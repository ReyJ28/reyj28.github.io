const fs = require('fs');
const path = require('path');
const ROOT = path.dirname(__dirname);

// Maps a live-site-sourced image path to its optimized webp/jpg pair.
// Backgrounds get two widths (1920/960) for a simple responsive CSS swap;
// work photos and the team photo are small enough to ship one size.
function optImg(srcPath) {
  const bgMap = {
    '/images/backgrounds/breadcrumb-bg.jpg': 'backgrounds/breadcrumb-bg',
    '/images/backgrounds/callto-bg.jpg': 'backgrounds/callto-bg',
    '/images/team/team-bg.jpg': 'team/team-bg',
  };
  if (bgMap[srcPath]) {
    const base = bgMap[srcPath];
    return {
      webp1920: `/images/optimized/${base}-1920.webp`,
      jpg1920: `/images/optimized/${base}-1920.jpg`,
      webp960: `/images/optimized/${base}-960.webp`,
      jpg960: `/images/optimized/${base}-960.jpg`,
    };
  }
  const workMatch = srcPath.match(/\/images\/projects\/work-(\d+)\.jpg$/);
  if (workMatch) {
    const n = workMatch[1];
    return { webp: `/images/optimized/projects/work-${n}.webp`, jpg: `/images/optimized/projects/work-${n}.jpg` };
  }
  if (srcPath === '/images/team/team-1.jpg') {
    return { webp: '/images/optimized/team/team-1.webp', jpg: '/images/optimized/team/team-1.jpg' };
  }
  return null;
}

// CSS custom property for a .hero background-image, using the optimized asset
// where one exists, falling back to the original path otherwise.
function heroBg(srcPath) {
  const o = optImg(srcPath);
  if (!o) return srcPath;
  return o.webp1920 || o.webp || srcPath;
}

const HEADER = (active) => {
  const cls = (k) => (k === active ? ' class="active"' : '');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container">
    <nav class="nav">
      <a class="nav__logo" href="/"><img src="/images/brand/logo.png" width="167" height="30" alt="VideoSonic"></a>
      <div class="nav__links">
        <a href="/led-wall/"${cls('led')}>LED Walls</a>
        <a href="/services/"${cls('services')}>Services</a>
        <a href="/projects/"${cls('projects')}>Projects</a>
        <a href="/about/"${cls('about')}>About</a>
        <a href="/insights/"${cls('insights')}>Insights</a>
        <a href="/contact/"${cls('contact')}>Contact</a>
      </div>
      <div class="nav__actions">
        <a class="btn btn-outline" href="https://videosonic-erp-web.vercel.app/login">Log In</a>
        <a class="btn btn-primary" href="/contact/">Request an LED Quote</a>
        <button class="nav__toggle" data-nav-toggle aria-expanded="false" aria-label="Menu">&#9776;</button>
      </div>
    </nav>
    <div class="mobile-panel" data-mobile-panel>
      <a href="/led-wall/">LED Walls</a><a href="/services/">Services</a><a href="/projects/">Projects</a>
      <a href="/about/">About</a><a href="/insights/">Insights</a><a href="/contact/">Contact</a>
      <a href="https://videosonic-erp-web.vercel.app/login">Log In</a>
    </div>
  </div>
</header>
`;
};

const FOOTER = `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img src="/images/brand/logo.png" width="167" height="30" alt="VideoSonic" style="height:32px;width:auto;margin-bottom:16px">
        <p>Professional LED display, AV and technical production solutions for high-impact events across the Philippines.</p>
        <p>Warehouse 5, Lagsa Compound,<br>San Pedro, Laguna, Philippines</p>
        <p>(+63) 28815-2236 &middot; +63 961 491 6871<br><a href="mailto:salesandproduction@video-sonic.com">salesandproduction@video-sonic.com</a></p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="/led-wall/">LED Walls</a></li>
          <li><a href="/services/projection/">Projection</a></li>
          <li><a href="/services/sound/">Sound</a></li>
          <li><a href="/services/lights/">Lights</a></li>
          <li><a href="/services/live-streaming/">Live Streaming</a></li>
          <li><a href="/services/multimedia-consoles/">Multi-Media Consoles</a></li>
          <li><a href="/services/rigging/">Rigging</a></li>
          <li><a href="/services/technical-production/">Technical Production</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="/about/">About</a></li>
          <li><a href="/projects/">Projects</a></li>
          <li><a href="/insights/">Insights</a></li>
          <li><a href="/supplier/">Become a Supplier</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Connect</h4>
        <ul>
          <li><a href="https://www.facebook.com/videosonicph">Facebook</a></li>
          <li><a href="https://videosonic-erp-web.vercel.app/login">Client / Partner Log In</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="year"></span> VideoSonic. All rights reserved.</span>
      <span>Serving clients and events across the Philippines.</span>
    </div>
  </div>
</footer>
<div class="mobile-cta"><a href="tel:+639614916871">Call Us</a><a class="primary" href="/contact/">Request Quote</a></div>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
<script src="/assets/js/site.js"></script>
`;

// Preserved verbatim from the live site's index.html (teamVanityId/doChat/doTracking
// unchanged), loaded from assets/js/momentcrm.js -- see that file for why it's
// dynamically injected rather than a static blocking <script src> like the live
// site's original implementation.
const MOMENTCRM = `<script src="/assets/js/momentcrm.js"></script>`;

function page({ route, title, description, canonical, active, heroHtml, bodyHtml, extraHead = '', extraScripts = '', breadcrumb = null }) {
  let bcHtml = '';
  let bcLd = '';
  if (breadcrumb) {
    const items = breadcrumb.map((b, i) => `{"@type":"ListItem","position":${i + 1},"name":"${b[0]}","item":"${b[1]}"}`).join(',');
    const crumbs = breadcrumb.map((b, i) => (i < breadcrumb.length - 1 ? `<a href="${b[1].replace('https://www.video-sonic.com', '') || '/'}">${b[0]}</a>` : b[0]));
    bcHtml = `<div class="breadcrumb">${crumbs.join(' / ')}</div>`;
    bcLd = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[${items}]}</script>`;
  }

  // Derive a social share image from the hero's --hero-img background (prefer the .jpg twin of a .webp path)
  const heroMatch = heroHtml.match(/--hero-img:url\('([^']+)'\)/);
  let ogImage = 'https://www.video-sonic.com/images/optimized/brand/hero-1-1920.jpg';
  if (heroMatch) {
    ogImage = 'https://www.video-sonic.com' + heroMatch[1].replace(/\.webp$/, '.jpg');
  }
  const titleText = title.replace(/&amp;/g, '&').replace(/"/g, '&quot;');
  const descText = description.replace(/"/g, '&quot;');

  const ogTags = `<meta property="og:type" content="website">
<meta property="og:title" content="${titleText}">
<meta property="og:description" content="${descText}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${titleText}">
<meta name="twitter:description" content="${descText}">
<meta name="twitter:image" content="${ogImage}">`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
${ogTags}
<link rel="stylesheet" href="/assets/css/site.css">
${extraHead}
${bcLd}
</head>
<body>
${HEADER(active)}
<main id="main">
${heroHtml}
${bcHtml}
${bodyHtml}
</main>
${FOOTER}
${extraScripts}
${MOMENTCRM}
</body>
</html>
`;

  const full = route.endsWith('.html')
    ? path.join(ROOT, route.replace(/^\//, ''))
    : path.join(ROOT, route.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, 'utf-8');
  console.log('wrote', full);
}

module.exports = { page, ROOT, optImg, heroBg, MOMENTCRM };
