// Hot GitHub Repos — multi-issue archive Worker with live star counts.
//
// One worker serves every weekly issue by path:
//   /                 → archive index (all issues, newest first)
//   /YYYY-MM-DD        → that issue, with live star counts + "since publish" deltas
//   /latest            → 302 to the newest issue
//   /stars.json[?issue=YYYY-MM-DD] → raw { "owner/repo": stars } for that issue
//
// Star counts are fetched from the GitHub API (edge-cached) and rewritten into the
// baked HTML via HTMLRewriter, so numbers stay fresh between weekly drops.

import { ISSUES } from './issues.index.js';

const CACHE_TTL_SECONDS = 600; // 10 min
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const byDate = Object.fromEntries(ISSUES.map((i) => [i.date, i]));
const LATEST = ISSUES[0];

const shortLabel = (date) => {
  const [, m, d] = date.split('-').map(Number);
  return `${MONTHS_ABBR[m - 1]} ${d}`;
};

function fmt(n) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return (k >= 100 ? k.toFixed(0) : k.toFixed(1)).replace(/\.0$/, '') + 'k';
}
function parseLabel(v) {
  const m = String(v).trim().match(/^([\d.]+)\s*(k)?$/i);
  return m ? Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1)) : null;
}

async function fetchStars(repos, env) {
  const headers = { 'User-Agent': 'hot-repos-live-worker', Accept: 'application/vnd.github+json' };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const entries = await Promise.all(
    repos.map(async (slug) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${slug}`, {
          headers,
          cf: { cacheTtl: CACHE_TTL_SECONDS, cacheEverything: true },
        });
        if (!res.ok) return [slug, null];
        const data = await res.json();
        return [slug, typeof data.stargazers_count === 'number' ? data.stargazers_count : null];
      } catch {
        return [slug, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}

class StarRewriter {
  constructor(stars, sinceLabel) {
    this.stars = stars;
    this.since = sinceLabel;
  }
  element(el) {
    const slug = el.getAttribute('data-gh');
    const role = el.getAttribute('data-role');
    const base = el.getAttribute('data-base');
    const live = this.stars[slug];
    if (live == null) return; // GitHub unreachable → leave the baked value
    el.setInnerContent(`${role === 'badge' ? '★ ' : ''}${fmt(live)}`);
    const was = parseLabel(base);
    if (role === 'stat' && was != null) {
      const diff = live - was;
      if (Math.abs(diff) >= 100) {
        const arrow = diff > 0 ? '▲' : '▼';
        el.append(
          `<span class="stat-delta" style="margin-left:.4em;font-size:.72em;font-weight:600;opacity:.72;white-space:nowrap">${arrow} ${fmt(Math.abs(diff))} since ${this.since}</span>`,
          { html: true },
        );
      }
    }
  }
}

function indexPage() {
  const items = ISSUES.map((i, idx) => `
      <a class="issue${idx === 0 ? ' latest' : ''}" href="/${i.date}">
        <span class="date">${i.published}</span>
        <span class="title">Hot GitHub repos of the week${idx === 0 ? ' <em>· latest</em>' : ''}</span>
        <span class="meta">${i.repos.length} repos</span>
      </a>`).join('');
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hot GitHub Repos · The Next New Thing</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
<style>
  :root{--accent:#1f3a5f;--ink:#0c0d11;--ink-subtle:#6b7079;--canvas:#f8f9fc;--surface:#fff;--hairline:#d6dae2}
  *{box-sizing:border-box}
  body{margin:0;background:var(--canvas);color:var(--ink);font-family:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{max-width:820px;margin:0 auto;padding:12vh 24px 16vh}
  .kicker{font-size:.72rem;letter-spacing:.18em;font-weight:600;color:var(--accent);text-transform:uppercase;margin-bottom:1.2rem}
  h1{font-size:clamp(2.6rem,7vw,4.6rem);line-height:.98;font-weight:800;letter-spacing:-.02em;margin:0 0 .5rem}
  h1 .b{color:var(--accent)}
  .sub{color:var(--ink-subtle);font-size:1.05rem;margin:0 0 3rem}
  .issues{display:flex;flex-direction:column;border-top:1px solid var(--hairline)}
  .issue{display:grid;grid-template-columns:1fr auto;gap:.2rem 1rem;align-items:baseline;padding:1.25rem .25rem;border-bottom:1px solid var(--hairline);text-decoration:none;color:inherit;transition:padding-left .15s ease,background .15s ease}
  .issue:hover{padding-left:1rem;background:var(--surface)}
  .issue .date{grid-column:1;font-weight:600;font-size:1.15rem}
  .issue.latest .date{color:var(--accent)}
  .issue .title{grid-column:1;color:var(--ink-subtle);font-size:.95rem}
  .issue .title em{color:var(--accent);font-style:normal;font-weight:600}
  .issue .meta{grid-column:2;grid-row:1/3;align-self:center;color:var(--ink-subtle);font-size:.85rem;white-space:nowrap}
  footer{margin-top:4rem;color:var(--ink-subtle);font-size:.8rem;letter-spacing:.04em}
</style></head><body><div class="wrap">
  <div class="kicker">GitHub Hot Repos · The Next New Thing</div>
  <h1>The <span class="b">archive</span>.</h1>
  <p class="sub">Every week's hottest GitHub repos, with star counts that stay live.</p>
  <div class="issues">${items}</div>
  <footer>★ BY ORDER OF THE NEXT NEW THING ★</footer>
</div></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/' || path === '') {
      return new Response(indexPage(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` },
      });
    }

    if (path === '/latest') {
      return Response.redirect(new URL(`/${LATEST.date}`, url), 302);
    }

    if (path === '/stars.json') {
      const issue = byDate[url.searchParams.get('issue')] || LATEST;
      const stars = await fetchStars(issue.repos, env);
      return new Response(JSON.stringify(stars, null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` },
      });
    }

    const m = path.match(/^\/(\d{4}-\d{2}-\d{2})$/);
    if (m && byDate[m[1]]) {
      const issue = byDate[m[1]];
      const stars = await fetchStars(issue.repos, env);
      const rewriter = new HTMLRewriter().on('[data-gh]', new StarRewriter(stars, shortLabel(issue.date)));
      const html = new Response(issue.html, {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` },
      });
      return rewriter.transform(html);
    }

    return new Response(indexPage(), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  },
};
