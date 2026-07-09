// Unit checks for the pure formatting/parsing logic (no network).
import assert from 'node:assert';

function fmt(n) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  const s = k >= 100 ? k.toFixed(0) : k.toFixed(1);
  return s.replace(/\.0$/, '') + 'k';
}
function parseLabel(v) {
  const m = String(v).trim().match(/^([\d.]+)\s*(k)?$/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1));
}

// fmt matches the GitHub-Trending house style seen in the source page.
assert.equal(fmt(337), '337');
assert.equal(fmt(1500), '1.5k');
assert.equal(fmt(14700), '14.7k');
assert.equal(fmt(22000), '22k');
assert.equal(fmt(36000), '36k');
assert.equal(fmt(61900), '61.9k');
assert.equal(fmt(120000), '120k');

// parseLabel round-trips the baked labels.
assert.equal(parseLabel('22k'), 22000);
assert.equal(parseLabel('14.7k'), 14700);
assert.equal(parseLabel('337'), 337);
assert.equal(parseLabel('111'), 111);
assert.equal(parseLabel('nope'), null);

// delta sanity: OpenMontage 22k -> 36k should read "▲ 14k"
const diff = parseLabel('36k') - parseLabel('22k');
assert.equal(diff, 14000);
assert.equal(fmt(Math.abs(diff)), '14k');

console.log('ok — all formatting/parse assertions passed');
