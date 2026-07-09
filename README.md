# github-hot-repos-live

The weekly **Hot GitHub Repos** report ("The Next New Thing"), rebuilt so the star
counts never go stale. The original was a one-shot generate-and-deploy Worker with no
saved source and hard-coded star numbers — two weeks after publish every count was
wrong (e.g. OpenMontage read 22k when it was already ~36k).

This version keeps the exact original design but rewrites every star count with a
**live value from the GitHub API**, and adds a small **"since publish" delta chip**
(e.g. `▲ 14k since Jun 25`) next to each repo's Stars stat.

## How it works

1. `scripts/preprocess.mjs` takes the deployed HTML (`scripts/report.source.html`) and
   tags every star element with `data-gh="owner/repo"` + its publish-day baseline,
   emitting `src/report.template.html` and `src/repos.json`.
2. `src/worker.js` fetches live star counts (one GitHub API call per repo, edge-cached
   ~10 min), then uses `HTMLRewriter` to swap the numbers in and append the delta chip.
   If GitHub is unreachable it leaves the baked value untouched — never blanks out.

Endpoints:
- `/` — the report, with live stars.
- `/stars.json` — raw `{ "owner/repo": stars }` map (handy for other bots).

## Develop

```bash
npm install
npm run build      # regenerate template + repos.json from the source HTML
npm test           # formatting/parse unit checks
npm run dev        # wrangler dev — local preview at http://localhost:8787
```

## Deploy

```bash
# optional: lift the 60 req/hr unauthenticated GitHub limit
npx wrangler secret put GITHUB_TOKEN

npm run deploy
```

## Next issues

To publish a new week, drop the new report HTML in as `scripts/report.source.html`
(same markup conventions: `data-repo` panels, `stat-label`/`stat-val`, `★ badge`),
bump `PUBLISH_LABEL` in `src/worker.js`, then `npm run build && npm run deploy`.
