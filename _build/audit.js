const fs = require('fs');
const path = require('path');
const ROOT = path.dirname(__dirname);

const PAGES = [
  '/', '/led-wall/', '/led-wall/size-guide/', '/services/', '/services/projection/', '/services/sound/',
  '/services/lights/', '/services/live-streaming/', '/services/multimedia-consoles/',
  '/services/rigging/', '/services/technical-production/', '/projects/',
  '/projects/rcbc-wealth-dinner/', '/projects/fiba-world-cup-2023/', '/projects/miss-world-2018/',
  '/about/', '/contact/', '/supplier/', '/insights/',
  '/insights/led-wall-rental-philippines-guide/', '/insights/indoor-vs-outdoor-led-walls/',
  '/insights/choosing-the-right-led-screen/', '/insights/event-production-checklist-corporate-events/',
  '/insights/led-wall-vs-projection/',
];

function filePathFor(route) {
  return route === '/'
    ? path.join(ROOT, 'index.html')
    : path.join(ROOT, route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

const results = [];
const allInternalLinks = new Set();
const linkedTo = new Set();

for (const route of PAGES) {
  const fp = filePathFor(route);
  const exists = fs.existsSync(fp);
  const entry = { route, file: fp, exists, issues: [] };
  if (!exists) { entry.issues.push('MISSING FILE'); results.push(entry); continue; }
  const html = fs.readFileSync(fp, 'utf-8');

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  entry.title = titleMatch ? titleMatch[1] : null;
  if (!titleMatch) entry.issues.push('no <title>');

  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  entry.description = descMatch ? descMatch[1] : null;
  if (!descMatch) entry.issues.push('no meta description');

  const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gs)];
  entry.h1Count = h1s.length;
  if (h1s.length === 0) entry.issues.push('no <h1>');
  if (h1s.length > 1) entry.issues.push(`${h1s.length} <h1> tags (expected 1)`);

  const canonMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
  entry.canonical = canonMatch ? canonMatch[1] : null;
  if (!canonMatch) entry.issues.push('no canonical');

  const ogTitle = /property="og:title"/.test(html);
  const ogDesc = /property="og:description"/.test(html);
  const ogImage = /property="og:image"/.test(html);
  const twCard = /name="twitter:card"/.test(html);
  if (!ogTitle) entry.issues.push('no og:title');
  if (!ogDesc) entry.issues.push('no og:description');
  if (!ogImage) entry.issues.push('no og:image');
  if (!twCard) entry.issues.push('no twitter:card');

  const robotsMatch = html.match(/<meta name="robots" content="([^"]*)"/);
  entry.robots = robotsMatch ? robotsMatch[1] : '(default)';
  if (robotsMatch && /noindex/.test(robotsMatch[1])) entry.issues.push('ACCIDENTAL NOINDEX');

  const langMatch = html.match(/<html lang="([^"]*)"/);
  if (!langMatch) entry.issues.push('no lang attribute');

  // images missing alt
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(m => m[0]);
  const missingAlt = imgs.filter(tag => !/alt="/.test(tag));
  if (missingAlt.length) entry.issues.push(`${missingAlt.length} <img> missing alt attr`);
  const emptyContentAlt = imgs.filter(tag => /alt=""/.test(tag) && !/aria-hidden="true"/.test(tag));
  // (empty alt is fine for decorative icons marked aria-hidden; flag only if not marked)
  if (emptyContentAlt.length) entry.issues.push(`${emptyContentAlt.length} <img> with empty alt not marked decorative`);

  const missingDims = imgs.filter(tag => /src="\/images\//.test(tag) && (!/width="/.test(tag) || !/height="/.test(tag)));
  if (missingDims.length) entry.issues.push(`${missingDims.length} <img> missing width/height`);

  // internal links
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  const internal = hrefs.filter(h => h.startsWith('/') && !h.startsWith('//'));
  entry.internalLinkCount = internal.length;
  for (const h of internal) {
    allInternalLinks.add(JSON.stringify([route, h]));
    const clean = h.split('#')[0].split('?')[0];
    if (clean === '' ) continue;
    linkedTo.add(clean.endsWith('/') || clean.includes('.') ? clean : clean + '/');
  }

  results.push(entry);
}

// broken internal links: does target resolve to a real file?
const broken = [];
for (const pair of allInternalLinks) {
  const [route, href] = JSON.parse(pair);
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '') continue; // pure anchor
  if (/^(mailto:|tel:|https?:)/.test(clean)) continue;
  let target;
  if (clean.match(/\.\w+$/)) {
    target = path.join(ROOT, clean.replace(/^\//, ''));
  } else {
    target = path.join(ROOT, clean.replace(/^\//, ''), 'index.html');
  }
  if (!fs.existsSync(target)) broken.push({ from: route, href });
}

// orphan pages: pages not linked to from any other page's internal links
const orphans = PAGES.filter(route => {
  if (route === '/') return false;
  const norm = route;
  return ![...linkedTo].some(l => l === norm);
});

console.log('=== PAGE-BY-PAGE SEO/A11Y ISSUES ===');
for (const r of results) {
  console.log(`\n${r.route}`);
  console.log(`  title: ${r.title}`);
  if (r.issues.length) r.issues.forEach(i => console.log('  ISSUE: ' + i));
  else console.log('  OK');
}

console.log('\n=== BROKEN INTERNAL LINKS ===');
console.log(broken.length ? broken : 'none found');

console.log('\n=== ORPHAN PAGES (not linked from nav/footer/content) ===');
console.log(orphans.length ? orphans : 'none found');

fs.writeFileSync(path.join(ROOT, '_build', 'audit-results.json'), JSON.stringify({ results, broken, orphans }, null, 2));
