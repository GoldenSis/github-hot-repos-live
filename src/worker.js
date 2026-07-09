// Hot GitHub Repos — live-stars Worker.
//
// Serves the weekly report, but rewrites every baked-in star count with a live
// value from the GitHub API and appends a "since publish" delta chip. Live counts
// are cached (edge Cache API) so we hit GitHub at most once per repo per TTL.

import TEMPLATE from './report.template.html';
import REPOS from './repos.json';

// Publish date baked into this issue (delta is measured from here).
const PUBLISH_LABEL = 'Jun 25';
const CACHE_TTL_SECONDS = 600; // 10 min

// Format an integer like GitHub Trending: 337, 1.5k, 14.7k, 36k.
function fmt(n) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  const s = k >= 100 ? k.toFixed(0) : k.toFixed(1);
  return s.replace(/\.0$/, '') + 'k';
}

// Parse a baked label ("22k", "14.7k", "337") back to an approximate integer,
// used only to compute the delta arrow.
function parseLabel(v) {
  const m = String(v).trim().match(/^([\d.]+)\s*(k)?$/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1));
}

async function fetchStars(env) {
  const headers = {
    'User-Agent': 'hot-repos-live-worker',
    Accept: 'application/vnd.github+json',
  };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

  const entries = await Promise.all(
    REPOS.map(async (slug) => {
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
  constructor(stars) {
    this.stars = stars;
    this.slug = null;
    this.role = null;
    this.base = null;
  }
  element(el) {
    this.slug = el.getAttribute('data-gh');
    this.role = el.getAttribute('data-role');
    this.base = el.getAttribute('data-base');
    const live = this.stars[this.slug];
    if (live == null) return; // GitHub unreachable → leave the baked value untouched

    const prefix = this.role === 'badge' ? '★ ' : '';
    el.setInnerContent(`${prefix}${fmt(live)}`);

    const was = parseLabel(this.base);
    if (this.role === 'stat' && was != null) {
      const diff = live - was;
      if (Math.abs(diff) >= 100) {
        const arrow = diff > 0 ? '▲' : '▼';
        const chip = `<span class="stat-delta" style="margin-left:.4em;font-size:.72em;font-weight:600;opacity:.72;white-space:nowrap">${arrow} ${fmt(Math.abs(diff))} since ${PUBLISH_LABEL}</span>`;
        el.append(chip, { html: true });
      }
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Lightweight JSON endpoint for debugging / reuse by other bots.
    if (url.pathname === '/stars.json') {
      const stars = await fetchStars(env);
      return new Response(JSON.stringify(stars, null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` },
      });
    }

    const stars = await fetchStars(env);
    const rewriter = new HTMLRewriter().on('[data-gh]', new StarRewriter(stars));
    const html = new Response(TEMPLATE, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` },
    });
    return rewriter.transform(html);
  },
};
