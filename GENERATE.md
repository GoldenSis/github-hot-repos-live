# Weekly build brief — "The Next New Thing" (multi-source AI digest)

Spec the weekly routine follows to auto-generate one issue: a new `issues/<date>.html` in the
**house design** of the exemplar `issues/2026-06-25.html`, built from this week's activity across
GitHub, Hugging Face, the AI labs, papers, and the buzz — then deployed to the archive worker.

Repo: `~/projects/github-hot-repos-live`. Read FIRST: `issues/2026-06-25.html` (design exemplar) and
`sources.md` (the verified feed list — every endpoint below comes from there; all are no-key unless noted).

## Sections to produce (in order)
1. **🔥 Hot Repos** (rank 01–10) — the spine. GitHub Trending + breakouts.
2. **🧠 Hot Models** (~5) — Hugging Face trending models/spaces.
3. **📄 Fresh Papers** (~4) — trending/high-signal papers, code-linked.
4. **🚀 Lab Drops** (~5) — official releases from the AI labs this week.
5. **📡 The Buzz** (~5) — what's being talked about (newsletters/HN/Reddit).
6. **📺 Watch** (~4) — notable new videos from the curated top-notch AI channels (`sources.md` §6).
7. **⭐ WANTED** (3) — hidden-gem repos (lower-star, high-signal).

Scale gracefully: if a section has little genuinely-new this week, run it shorter rather than padding.

## Steps
1. **Date** = run date `YYYY-MM-DD`; human forms "July 9, 2026" / "JULY 9, 2026".
2. **Gather (keyless, one pass — see `sources.md` for exact endpoints):**
   - Repos: GitHub Trending RSS (`mshibanami…/weekly/all.xml` + top languages) + GitHub Search API breakouts (`created:>lastweek sort:stars`). Dedupe. Cross-check suspicious spikes.
   - Models: `huggingface.co/api/models?sort=trendingScore&limit=30&full=true` (+ spaces).
   - Papers: `huggingface.co/api/daily_papers` (loop the week) + arXiv API.
   - Lab drops: Tier-1 lab RSS (OpenAI, Mistral, Google AI/Research/DeepMind, Qwen, AI2, Stability, MS, NVIDIA) + HF per-org new-model JSON for DeepSeek/Meta/etc. + scrape Anthropic news.
   - Buzz: AI News (`news.smol.ai/rss.xml`) + HN Algolia (score>100) + Import AI + r/LocalLLaMA `.rss` (spaced, custom UA, curl).
   - Watch: pull the S/A-tier YouTube RSS feeds in `sources.md` §6 (`youtube.com/feeds/videos.xml?channel_id=<UC…>`), pick ~4 genuinely notable new videos from the week (skip Shorts / filler), link each to its watch URL.
3. **Curate & verify (provenance mandatory, no fabrication):** pick the items, then for each confirm facts at the primary source (repo stars/lang/license; model card; paper abstract; the lab's own post). Be skeptical of astroturf (huge stars days after creation + first-party promo) and *say so* in the copy. Mark anything unverified.
4. **Write the HTML** — one self-contained document in the exemplar's design (reuse its `<head>`/`<style>`; give each new section a header styled like the existing rank/section headers; cards analogous to the repo cards). **Load-bearing:** keep the repo star markup EXACT so the live-stars Worker still works —
   - repo panels: `<section … data-repo="r-NN" data-type="summary|github|video|…">`, each repeating `<a class="repo-name" href="https://github.com/OWNER/REPO">`; Stars stat `<div class="stat-label">Stars</div><div class="stat-val">36k</div>`; badge `<span class="badge">★ 36k</span>`.
   - Non-repo sections (models/papers/labs/buzz) are static cards — no star tags needed; link each to its primary source. (HF likes / paper upvotes may be shown as plain text; they are NOT live-refreshed — only GitHub repo stars are.)
5. **Ingest + publish:**
   ```
   node scripts/add-issue.mjs <raw-report.html> <YYYY-MM-DD>   # tags repo stars, rebuilds manifest
   npm run build
   git add -A && git commit -m "issue <YYYY-MM-DD>" && git push
   ```
   Deploy is automatic via `.github/workflows/deploy.yml` on push. Do NOT run `wrangler deploy` (no Cloudflare creds in the cloud env).
6. **Verify + report:** after the Action finishes (~1 min), curl `https://github-hot-repos.nextnewthing.workers.dev/<date>` + `/stars.json?issue=<date>`; confirm the repo section's live stars + delta chips render and the index lists the new issue. Report the URL + a one-line summary of each section's picks.

## Guardrails
- Provenance on every claim; prefer independent corroboration; X is excluded (use AI News for buzz).
- Keep the repo star markup exact (verify `add-issue.mjs` reports the repo count tagged).
- Validate feed content-type, not just HTTP 200 (some return HTML with 200 — see `sources.md`).
- Deploys are additive (new dated path); past issues never change. Note token spend (research-heavy).
