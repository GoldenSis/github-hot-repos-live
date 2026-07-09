// Preprocess the one-shot deployed report HTML into a live template.
// It tags every star element with data-gh="owner/repo" and data-base="<publish-day value>"
// so the Worker can rewrite them with live counts + a "since publish" delta.
//
// Usage: node scripts/preprocess.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'report.source.html'), 'utf8');

// Split into <section>…</section> blocks (they don't nest in this document) plus
// the surrounding chrome, so we can scope replacements per repo panel.
const parts = src.split(/(<section\b[\s\S]*?<\/section>)/);

const repoOrder = new Set();

const out = parts.map((chunk) => {
  if (!chunk.startsWith('<section')) return chunk;

  const type = chunk.match(/data-type="([^"]+)"/)?.[1];
  // The panel's own repeated header carries the canonical owner/repo.
  const slug = chunk.match(/class="repo-name" href="https:\/\/github\.com\/([^"/]+\/[^"?]+)"/)?.[1];
  if (!slug || !type) return chunk;
  repoOrder.add(slug);

  if (type === 'summary') {
    // <div class="stat-label">Stars</div><div class="stat-val">22k</div>
    return chunk.replace(
      /(<div class="stat-label">Stars<\/div><div class="stat-val")(>)([^<]+)(<\/div>)/,
      (_m, a, close, val, end) =>
        `${a} data-gh="${slug}" data-role="stat" data-base="${val}"${close}${val}${end}`,
    );
  }
  if (type === 'github') {
    // <span class="badge">★ 22k</span>
    return chunk.replace(
      /(<span class="badge">)(★\s*)([^<]+)(<\/span>)/,
      (_m, a, star, val, end) =>
        `${a.replace('badge', 'badge" data-gh="' + slug + '" data-role="badge" data-base="' + val.trim())}${star}${val}${end}`,
    );
  }
  return chunk;
}).join('');

const repos = [...repoOrder];
writeFileSync(join(here, '..', 'src', 'report.template.html'), out);
writeFileSync(join(here, '..', 'src', 'repos.json'), JSON.stringify(repos, null, 2) + '\n');

// sanity report
const statTags = (out.match(/data-role="stat"/g) || []).length;
const badgeTags = (out.match(/data-role="badge"/g) || []).length;
console.log(`repos: ${repos.length}`);
console.log(`tagged stat blocks: ${statTags}, badges: ${badgeTags}`);
console.log(repos.join('\n'));
