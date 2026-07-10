# Sources to watch — verified 2026-07-10

The feed list the weekly generator pulls from. Every endpoint below was live-checked on
2026-07-10. **Golden rule for the headless cloud routine: prefer no-key RSS/JSON; validate
content-type (check for `<rss>`/`<?xml>` or real JSON), not just HTTP 200.**

## Access reality (what a keyless cloud agent can actually use)
- ✅ **Fully automatable, no key:** GitHub Trending (via RSS mirror), GitHub Search API, Hugging
  Face Hub API, arXiv, Hacker News, YouTube per-channel RSS, most AI-lab blog RSS, AI newsletters.
- ⚠️ **Works with care:** Reddit `.rss` only (`.json` is dead — 403), spaced ~10s apart, custom UA,
  server-side curl (datacenter fetchers are IP-blocked). Some lab sites 403 bots (xAI, Perplexity) → scrape docs pages with a browser UA or poll their HF org.
- ❌ **Not reliably automatable without paying:** X/Twitter (no free API since Feb 2026; nitter dead).
  → Don't depend on X. **AI News (smol.ai) already meta-aggregates X buzz** — use that instead.

---

## 1. GitHub / code repos  (the report's spine)
| Source | Endpoint | Access | Signal |
|---|---|---|---|
| **GitHub Trending (RSS mirror)** | `https://mshibanami.github.io/GitHubTrendingRSS/weekly/all.xml` (+ `weekly/python.xml`, `…/typescript.xml`, ~700 langs) | RSS, no key | ★5 — primary spine |
| GitHub Trending (canonical) | `https://github.com/trending?since=weekly` (+ `/{lang}`) | scrape HTML | ★5 — dedupe vs mirror |
| GitHub Search API (breakouts) | `https://api.github.com/search/repositories?q=created:>YYYY-MM-DD&sort=stars&order=desc` | JSON, 10 req/min unauth | ★4 — catches new repos trending misses |
| Star History (verify only) | `https://star-history.com/#owner/repo` | manual/embed | ★3 — validate a spike isn't 1-day astroturf |
| crates.io summary | `https://crates.io/api/v1/summary` | JSON, no key (set UA) | ★4 — Rust ecosystem |
| HN Algolia | `https://hn.algolia.com/api/v1/search?tags=front_page` | JSON, no key | ★3 — early launches |

> Prefer the **weekly** range everywhere to damp single-day star campaigns. `paperswithcode.com` is **dead** (redirects to HF Papers).

## 2. Hugging Face  (models · datasets · spaces · papers) — all no-key JSON
> Trending sort key is **`sort=trendingScore`** (NOT `trending` → 400). Limit 500 req / 5 min unauth.
| Source | Endpoint | Signal |
|---|---|---|
| **Models (trending)** | `https://huggingface.co/api/models?sort=trendingScore&limit=30&full=true` | ★5 |
| Datasets (trending) | `https://huggingface.co/api/datasets?sort=trendingScore&limit=30` | ★5 |
| Spaces (trending) | `https://huggingface.co/api/spaces?sort=trendingScore&limit=30` | ★4 — "try it now" |
| **Daily Papers** | `https://huggingface.co/api/daily_papers` (loop the week's dates) — ships `upvotes`, `ai_summary`, `ai_keywords`, `githubRepo` | ★5 |
| Blog RSS | `https://huggingface.co/blog/feed.xml` | ★4 |
| New model drops per org | `https://huggingface.co/api/models?author=<ORG>&sort=createdAt&direction=-1&limit=10` (orgs: `deepseek-ai`,`Qwen`,`stabilityai`,`allenai`,`facebook`,`mistralai`,`nvidia`,`xai-org`,`CohereLabs`) | ★4 — open-weight lab launches |

## 3. AI labs — official release feeds
**Tier 1 — clean RSS (subscribe directly):**
- OpenAI `https://openai.com/news/rss.xml`
- Mistral `https://mistral.ai/rss.xml`
- Google AI `https://blog.google/technology/ai/rss/` · Google Research `https://research.google/blog/rss/` · DeepMind `https://deepmind.google/blog/rss.xml`
- Alibaba Qwen `https://qwenlm.github.io/blog/index.xml`
- Allen AI `https://allenai.org/rss.xml`
- Stability `https://stability.ai/news-updates?format=rss`
- Microsoft Research `https://www.microsoft.com/en-us/research/feed/` · Foundry `https://devblogs.microsoft.com/foundry/feed/`
- NVIDIA `https://developer.nvidia.com/blog/feed/` (+ `https://blogs.nvidia.com/feed/`)

**Tier 2 — no RSS, poll HF org JSON (§2 last row):** DeepSeek, Qwen, Stability, AI2, Meta.
**Tier 2 — Anthropic** (no RSS, essential): scrape `https://www.anthropic.com/news` + watch `github.com/anthropics/claude-code` `CHANGELOG.md`.
**Tier 3 — bot-blocked, browser-UA scrape:** xAI `https://docs.x.ai/docs/release-notes`, Perplexity `https://docs.perplexity.ai/changelog/changelog`, Cohere `https://cohere.com/blog` (⚠️ its `/blog/rss.xml` returns HTML with 200 — validate!).

## 4. Papers / research
- **HF Daily Papers** — `https://huggingface.co/api/daily_papers` (best trending, code-linked; see §2)
- **arXiv API** — `http://export.arxiv.org/api/query?search_query=cat:cs.CL+OR+cat:cs.LG+OR+cat:cs.AI+OR+cat:cs.CV&sortBy=submittedDate&sortOrder=descending&max_results=50` (Atom, ~1 req/3s)
- arXiv RSS — `http://export.arxiv.org/rss/cs.CL+cs.LG+cs.AI+cs.CV` (daily firehose)

## 5. The Buzz — newsletters / aggregators (replaces X)
| Source | Feed | Signal |
|---|---|---|
| 🥇 **AI News (smol.ai)** | `https://news.smol.ai/rss.xml` — pre-summarized meta-aggregate of ~356 X accts + 21 Discords + AI subreddits | ★5 |
| Latent Space | `https://www.latent.space/feed` | ★5 |
| Import AI (Jack Clark) | `https://jack-clark.net/feed/` | ★5 |
| TLDR AI | `https://tldr.tech/api/rss/ai` (note: `/ai/rss` 404s) | ★3 |
| Hacker News (AI, score-filtered) | `https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&numericFilters=points>100` | ★4 |
| Reddit r/LocalLLaMA | `https://www.reddit.com/r/LocalLLaMA/top/.rss?t=week` — ⚠️ `.rss` only, spaced, custom UA, curl | ★5 |
| Reddit r/MachineLearning | `https://www.reddit.com/r/MachineLearning/.rss` — same caveats | ★4 |
> Skip: The Batch & Ben's Bites (no working RSS — AI News covers their ground).

## 6. Video — YouTube (per-channel RSS, keyless)
`https://www.youtube.com/feeds/videos.xml?channel_id=UC…` — free, no quota, no key. Feed = channel's ~15 latest uploads (includes Shorts — filter by title/duration if needed).

**Channel IDs resolved 2026-07-10** (curated from Arnaud's own subscriptions + verified top-notch adds; tiers per the cross-check). Pull the S/A tier every week; the rest are optional depth.

**S — elite / foundational**
| Channel | channel_id | Best for |
|---|---|---|
| Andrej Karpathy | `UCXUPKJO5MZQN11PqgIvyuvQ` | foundational LLM/AI (ex-OpenAI/Tesla) |
| AI Engineer (conf) | `UCLKPca3kwwd-B59HNr-_lvA` | high-density technical talks |
| Matt Pocock (AI Hero) | `UCswG6FSbgZjbWtdf_hMLaow` | serious AI-assisted dev |
| Addy Osmani | `UCfetJpmQH2XpFj8uFgWsezw` | LLM-in-production coding (Google) |
| Two Minute Papers | `UCbfYPyITQ-7l4upoX8nvctg` | research/capability demos |
| Yannic Kilcher | `UCZHmQk67mSJgfCCTn7xBfew` | deep paper walkthroughs |
| AI Explained | `UCNJ1Ymd5yFuUPtn21xtRbbw` | measured launch/benchmark analysis |

**A — credible, high-signal**
| Channel | channel_id | Best for |
|---|---|---|
| Machine Learning Street Talk | `UCMLtBahI5DMrt0NPvDSoIRQ` | long-form researcher interviews |
| Sam Witteveen | `UC55ODQSvARtgSyc8ThfiepQ` | hands-on agents/LLM building |
| bycloud | `UCgfe2ooZD3VJPB6aJAnuQng` | ML research/trend explainers |
| Matt Wolfe | `UChpleBmo18P08aKCIgti38g` | AI-news curation |
| Bret Fisher | `UC0NErq0RhP51iXx64ZmyVfg` | agentic DevOps / cloud-native |
| Alex Ziskind | `UCajiMK_CY9icRhLepS8_3ug` | local-LLM benchmarking |
| Kun Chen | `UCb69t9ZkE5z1KvCmfJoaifA` | ex-L8 eng; firstmate upstream |
| The AI Advantage | `UCHhYXsLBEVVnbvsq57n1MTQ` | practical weekly tutorials |
| Fireship | `UCsBjURrPoezykLs9EqgamOA` | punchy launch recaps |

**B — Claude-stack relevant** (Arnaud's subs; lighter depth): Hyperautomation Labs `UCiax-xbEI0P6Y8C8VwZGMgQ` · Brad AI & Automation `UCLHfIq7P2CkA62ReystiOrw`.

Official lab channels also worth a feed (resolve if wanted): OpenAI, Google DeepMind, Anthropic.
> Selection basis: `youtube-crosscheck` (2026-07-10) — ranked Arnaud's AI subs S→C and flagged research-explainer gaps (he had none), which the S-tier adds fill.

## X / Twitter — deliberately excluded
No free API since 2026-02-06; nitter effectively dead. Best-effort only: `xcancel.com` RSS with a custom User-Agent (flaky, allowed to fail). **Do not architect the digest to depend on X** — AI News (§5) carries the same buzz, automatably.

---
### The routine's default pull (keyless, one pass)
GitHub Trending RSS (§1) · GitHub Search breakouts (§1) · HF trending models + daily_papers (§2) · Tier-1 lab RSS (§3) · arXiv API (§4) · AI News + HN + Import AI (§5). YouTube RSS once channel IDs are pinned. Everything here is no-key and cloud-runnable today.
