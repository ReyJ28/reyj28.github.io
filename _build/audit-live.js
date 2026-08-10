const BASE = 'https://www.video-sonic.com';
const PAGES = [
  '/', '/led-wall/', '/services/', '/services/projection/', '/services/sound/',
  '/services/lights/', '/services/live-streaming/', '/services/multimedia-consoles/',
  '/services/rigging/', '/services/technical-production/', '/projects/',
  '/projects/rcbc-wealth-dinner/', '/projects/fiba-world-cup-2023/', '/projects/miss-world-2018/',
  '/about/', '/contact/', '/supplier/', '/insights/',
  '/insights/led-wall-rental-philippines-guide/', '/insights/indoor-vs-outdoor-led-walls/',
  '/insights/choosing-the-right-led-screen/', '/insights/event-production-checklist-corporate-events/',
  '/insights/led-wall-vs-projection/',
  '/contact.html', '/supplier.html', '/sitemap.xml', '/robots.txt', '/404.html',
];

(async () => {
  let ldTotal = 0, ldBad = 0, brokenPages = [];
  for (const p of PAGES) {
    const r = await fetch(BASE + p);
    if (r.status !== 200) { brokenPages.push([p, r.status]); continue; }
    const text = await r.text();
    const blocks = [...text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const b of blocks) {
      ldTotal++;
      try { JSON.parse(b[1]); } catch (e) { ldBad++; console.log('BAD JSON-LD on', p, e.message); }
    }
  }
  console.log('Pages checked:', PAGES.length);
  console.log('Non-200 pages:', brokenPages.length ? brokenPages : 'none');
  console.log('JSON-LD blocks:', ldTotal, 'invalid:', ldBad);
})();
