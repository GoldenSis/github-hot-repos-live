# github-hot-repos-live

The weekly **Hot GitHub Repos** report ("The Next New Thing") as a live, self-updating,
auto-generated archive. One Cloudflare Worker serves every issue by path, with star counts
that refresh from the GitHub API on every request.

**Live:** https://github-hot-repos.nextnewthing.workers.dev

## Routes
- `/` — archive index (all issues, newest first)
- `/YYYY-MM-DD` — that week's issue, with live star counts + `▲ since publish` deltas
- `/latest` — 302 to the newest issue
- `/stars.json[?issue=YYYY-MM-DD]` — raw `{ "owner/repo": stars }` map

## How it works
- `issues/<date>.html` — each week's report, with star elements tagged (`data-gh` + baseline).
- `src/issues.index.js` — AUTO-GENERATED manifest (`{date, published, repos[], html}`, newest first).
- `src/worker.js` — routes issues + index; fetches live stars (edge-cached 10 min) and rewrites
  them via `HTMLRewriter`, appending a delta chip. Falls back to baked values if GitHub is down.

## Add / regenerate an issue
```bash
node scripts/add-issue.mjs <raw-report.html> <YYYY-MM-DD>   # tags stars + rebuilds the manifest
npm run build                                              # regenerate the manifest only
git add -A && git commit -m "issue <date>" && git push     # GitHub Action deploys on push
```

## Weekly auto-generation
- **Brief:** `GENERATE.md` — the spec for producing one issue from GitHub Trending in the
  house design (exemplar: `issues/2026-06-25.html`).
- **Routine:** a Claude Code cloud routine `hot-repos-weekly` (`trig_01UeAEQVdikHrRkkGUnCUg3L`)
  runs Wednesdays 06:00 UTC (08:00 Europe/Zurich): clones this repo, follows `GENERATE.md`,
  pushes the new issue. Manage at https://claude.ai/code/routines
- **Deploy (current):** Mac launchd `com.arnaud.hot-repos-deploy` (`ops/deploy-on-change.sh`)
  pulls + `wrangler deploy` when the routine pushes. Reload after a Mac rebuild:
  `launchctl bootstrap gui/$(id -u) ~/projects/github-hot-repos-live/ops/com.arnaud.hot-repos-deploy.plist`.
- **Deploy (pure-cloud upgrade):** install `ops/github-action-deploy.yml.template` at
  `.github/workflows/deploy.yml` (via the GitHub web UI, or grant the gh token `workflow` scope
  and push) + add repo secret `CLOUDFLARE_API_TOKEN` — then retire the launchd job. `.github/`
  is gitignored so the auto-backup can't get stuck on an unpushable workflow file.

## Develop / deploy locally
```bash
npm install
npm run build      # regenerate the manifest
npm run dev        # wrangler dev at http://localhost:8787
npm run deploy     # build + wrangler deploy (needs wrangler login / CLOUDFLARE_API_TOKEN)
```
Optional: `npx wrangler secret put GITHUB_TOKEN` lifts the 60 req/hr anonymous GitHub limit.
