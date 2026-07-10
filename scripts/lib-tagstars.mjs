// Tag every star element in a report's HTML with data-gh="owner/repo" + its
// publish-day baseline, so the Worker can rewrite them with live counts + deltas.
// Shared by the weekly ingest (add-issue.mjs) and the original preprocess.
//
// Expects the report's house markup: per-repo <section data-repo … data-type>
// panels, a Stars stat (`<div class="stat-label">Stars</div><div class="stat-val">N</div>`)
// in the summary panel, and a `<span class="badge">★ N</span>` in the github panel.

export function tagStars(html) {
  const parts = html.split(/(<section\b[\s\S]*?<\/section>)/);
  return parts.map((chunk) => {
    if (!chunk.startsWith('<section')) return chunk;
    const type = chunk.match(/data-type="([^"]+)"/)?.[1];
    const slug = chunk.match(/class="repo-name" href="https:\/\/github\.com\/([^"/]+\/[^"?]+)"/)?.[1];
    if (!slug || !type) return chunk;

    if (type === 'summary') {
      return chunk.replace(
        /(<div class="stat-label">Stars<\/div><div class="stat-val")(>)([^<]+)(<\/div>)/,
        (_m, a, close, val, end) =>
          `${a} data-gh="${slug}" data-role="stat" data-base="${val}"${close}${val}${end}`,
      );
    }
    if (type === 'github') {
      return chunk.replace(
        /(<span class="badge">)(★\s*)([^<]+)(<\/span>)/,
        (_m, _a, star, val, end) =>
          `<span class="badge" data-gh="${slug}" data-role="badge" data-base="${val.trim()}">${star}${val}${end}`,
      );
    }
    return chunk;
  }).join('');
}

// Unique owner/repo slugs in document order, from already-tagged HTML.
export function extractRepos(taggedHtml) {
  const seen = new Set();
  for (const m of taggedHtml.matchAll(/data-gh="([^"]+)"/g)) seen.add(m[1]);
  return [...seen];
}
