// Keeps hand-maintained pages in sync with data/analytics-config.json, since
// they aren't produced (cleanly) by _build/gen.js. Each file has a marker pair:
//   <!-- ANALYTICS_HEAD_START -->
//   <!-- ANALYTICS_HEAD_END -->
// Everything between the markers is replaced with the current
// buildAnalyticsHead() output (empty when unconfigured). Run this any time
// data/analytics-config.json changes, alongside node _build/pages.js etc.
//
// led-wall/size-guide/index.html is included here (unlike the dev repo's
// version of this script) because this production repo's _build/pages3.js
// source has drifted from the currently-live content for that page (title,
// copy, field IDs) -- regenerating it would publish that unrelated,
// never-deployed content change. Until that drift is resolved separately,
// this page is maintained by hand like the other 3.
const fs = require('fs');
const path = require('path');
const { buildAnalyticsHead } = require('./analytics-head');

const ROOT = path.dirname(__dirname);
const FILES = [
  'index.html',
  path.join('led-wall', 'index.html'),
  '404.html',
  path.join('led-wall', 'size-guide', 'index.html'),
];

const head = buildAnalyticsHead();
const START = '<!-- ANALYTICS_HEAD_START -->';
const END = '<!-- ANALYTICS_HEAD_END -->';

for (const rel of FILES) {
  const full = path.join(ROOT, rel);
  const html = fs.readFileSync(full, 'utf-8');
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    console.error('missing analytics markers in', rel);
    continue;
  }
  const before = html.slice(0, startIdx + START.length);
  const after = html.slice(endIdx);
  const middle = head ? '\n' + head + '\n' : '\n';
  fs.writeFileSync(full, before + middle + after, 'utf-8');
  console.log('synced', rel);
}
