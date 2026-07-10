# Weekly build brief — "Hot GitHub Repos" (The Next New Thing)

This is the spec the weekly routine follows to auto-generate one issue. The goal: a new
`issues/<date>.html` in the **exact design** of the exemplar `issues/2026-06-25.html`,
built from this week's GitHub Trending, then deployed to the archive worker.

Repo: `~/projects/github-hot-repos-live`. Style exemplar (READ IT FIRST): `issues/2026-06-25.html`.

## Steps

1. **Date.** Use the run date as `YYYY-MM-DD` (the issue date). Header/label text uses the
   human form, e.g. "July 9, 2026" and "JULY 9, 2026".

2. **Pick the repos.** Fetch GitHub Trending (`https://github.com/trending?since=weekly`,
   and language-specific pages if useful). Choose **10 main repos** (rank 01–10) — favour
   genuinely surging, useful projects; be skeptical of pure astroturf (huge stars days after
   creation + heavy first-party promo) and *say so* in the copy when it applies. Also pick
   **3 "hidden gems"** (lower-star, high-signal) for the WANTED section.

3. **Research each repo (verify at source — no guessing).**
   - From the GitHub repo: exact `owner/repo`, stargazers, primary language, license, one-line description.
   - Web-search for: *why it's trending*, 3–5 concrete *highlights*, a crisp *so what?*, and
     2–5 *further-reading* links (independent sources > first-party). For main repos, find a
     relevant **YouTube video** to embed if a good one exists (walkthrough/demo).
   - Mark anything unverified; never invent benchmarks, links, or quotes.

4. **Write the HTML** — a complete self-contained document in the SAME design as the exemplar.
   Reuse its `<head>`/`<style>` verbatim and its section markup conventions. **The star markup
   contract is load-bearing** (the live-stars Worker depends on it) — keep it EXACT:
   - Each repo is a set of `<section … data-repo="r-NN" data-type="summary|github|video|…">` panels
     (hidden gems use `hm-NN`). Each panel repeats the header with
     `<a class="repo-name" href="https://github.com/OWNER/REPO" …>`.
   - Summary panel Stars stat: `<div class="stat-label">Stars</div><div class="stat-val">36k</div>`
     (plain human count, no tags — the pipeline adds them).
   - GitHub panel badge: `<span class="badge">★ 36k</span>`.
   - Panels are per-repo bespoke: include a `video` panel only when you found a good video, a
     `controversy`/`tweet` panel only when warranted — mirror how the exemplar varies them.

5. **Ingest + publish.**
   ```
   node scripts/add-issue.mjs <raw-report.html> <YYYY-MM-DD>   # tags stars, rebuilds manifest
   npm run build                                              # regenerate src/issues.index.js
   git add -A && git commit -m "issue <YYYY-MM-DD>" && git push
   ```
   **Deploy happens on push:** the `.github/workflows/deploy.yml` GitHub Action runs
   `wrangler deploy` automatically. Only run `npm run deploy` yourself if you have local
   Cloudflare creds (`wrangler login` / `CLOUDFLARE_API_TOKEN`) — the cloud routine does NOT,
   so it just pushes and lets the Action deploy.

6. **Verify + report.** After the Action finishes (~1 min), curl
   `https://github-hot-repos.nextnewthing.workers.dev/<date>` and `/stars.json?issue=<date>`;
   confirm live stars + delta chips render and the index lists the new issue. Report the URL +
   a one-line summary of the 10 picks.

## Guardrails
- Provenance: every factual claim traces to a source; prefer independent corroboration.
- Keep the exact house markup so star-tagging works (verify `add-issue.mjs` reports 13 repos tagged).
- Deploys are additive (new dated path); past issues never change. Safe to self-run.
- Note token spend; this is a research-heavy run (visible on /budget).
