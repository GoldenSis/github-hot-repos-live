// Ingest one week's raw report HTML into the archive.
//   node scripts/add-issue.mjs <raw-report.html> <YYYY-MM-DD>
// Tags the stars for live-refresh, writes issues/<date>.html, and rebuilds the
// manifest. Follow with `npx wrangler deploy` (or `npm run deploy`).
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tagStars, extractRepos } from './lib-tagstars.mjs';

const [rawPath, date] = process.argv.slice(2);
if (!rawPath || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
  console.error('usage: node scripts/add-issue.mjs <raw-report.html> <YYYY-MM-DD>');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(rawPath, 'utf8');
const tagged = tagStars(raw);
const repos = extractRepos(tagged);
if (repos.length === 0) {
  console.error('refusing: no star elements tagged — check the HTML uses the house markup (stat-val / ★ badge).');
  process.exit(1);
}

writeFileSync(join(here, '..', 'issues', `${date}.html`), tagged);
console.log(`wrote issues/${date}.html — ${repos.length} repos tagged`);
execFileSync('node', [join(here, 'build-index.mjs')], { stdio: 'inherit' });
console.log('done. next: npx wrangler deploy');
