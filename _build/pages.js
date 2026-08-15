const fs = require('fs');
const path = require('path');
const { page, ROOT, heroBg, optImg } = require('./gen');

function cta(title = "Ready to plan your event?", sub = "Tell us your event date, venue and requirements — we'll follow up with a quote.") {
  return `
<section class="section section-alt">
  <div class="container">
    <div class="cta-band reveal">
      <span class="eyebrow">Get Started</span>
      <h2>${title}</h2>
      <p class="lede center" style="margin:0 auto">${sub}</p>
      <div class="cta-band__actions">
        <a class="btn btn-primary" href="/contact/" data-cta-name="request_quote_band" data-cta-location="cta_band">Request a Quote</a>
      </div>
    </div>
  </div>
</section>`;
}

const services = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'services.json'), 'utf-8'));
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects.json'), 'utf-8'));

// ---------------------------------------------------------------- SERVICES HUB
page({
  route: '/services/',
  title: 'Event Production Services Philippines | VideoSonic',
  description: "VideoSonic's full range of event production services in the Philippines: LED walls, projection, sound, lighting, live streaming, multi-media consoles, rigging and technical production.",
  canonical: 'https://www.video-sonic.com/services/',
  active: 'services',
  heroHtml: `
<section class="hero" style="--hero-img:url('${heroBg('/images/backgrounds/breadcrumb-bg.jpg')}');min-height:50vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">What We Do</span>
      <h1>Services</h1>
      <p class="lede">Full-service events management and technical production — LED walls, projection, sound, lighting, live streaming, multi-media consoles, rigging and technical production.</p>
    </div>
  </div>
</section>`,
  bodyHtml: `
<section class="section">
  <div class="container">
    <div class="grid grid-3" data-services-grid></div>
  </div>
</section>` + cta(),
  extraScripts: '<script src="/assets/js/render.js"></script>',
  breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Services", "https://www.video-sonic.com/services/"]],
});

// ---------------------------------------------------------------- SERVICE DETAIL PAGES
const SERVICE_DETAIL = {
  'projection': {
    title: 'Projection',
    seoTitle: 'Projection Mapping &amp; Large-Format Projection Philippines | VideoSonic',
    desc: 'Large-format and 3D projection for stages, facades and immersive event environments across the Philippines.',
    img: '/images/projects/work-1.jpg',
    copy: 'VideoSonic delivers large-format and 3D projection for events including the RCBC Wealth Dinner, produced in collaboration with Manila Visual Jocks x VideoSonic. Projection work is paired with our in-house rigging and technical production teams to integrate cleanly with the rest of the show.',
    related: ['RCBC Wealth Dinner', '/projects/rcbc-wealth-dinner/'],
  },
  'sound': {
    title: 'Sound',
    seoTitle: 'Professional Event Sound Systems Philippines | VideoSonic',
    desc: 'Professional event audio systems and sound engineering for corporate events, concerts and large-scale productions in the Philippines.',
    img: '/images/backgrounds/callto-bg.jpg',
    copy: 'Professional sound system rental and audio engineering as part of VideoSonic\'s full-service event production. <span class="placeholder">[Insert verified audio equipment brands/specifications]</span>',
    related: null,
  },
  'lights': {
    title: 'Lights',
    seoTitle: 'Event &amp; Stage Lighting Philippines | VideoSonic',
    desc: 'Stage and event lighting design and production for concerts, corporate events and sports productions in the Philippines.',
    img: '/images/projects/work-7.jpg',
    copy: 'Stage and event lighting design and production, delivered alongside LED wall and sound systems for cohesive show environments — as part of our Miss World 2018 production work.',
    related: ['Miss World 2018', '/projects/miss-world-2018/'],
  },
  'live-streaming': {
    title: 'Live Streaming',
    seoTitle: 'Event Livestreaming Services Philippines | VideoSonic',
    desc: 'Broadcast-grade live streaming services for events reaching audiences beyond the venue, Philippines-wide.',
    img: '/images/projects/work-7.jpg',
    copy: 'Live streaming production for events that need to reach audiences beyond the venue, integrated with our multi-media console and broadcast production capabilities. <span class="placeholder">[Insert verified streaming platform/technical specifications]</span>',
    related: null,
  },
  'multimedia-consoles': {
    title: 'Multi-Media Consoles',
    seoTitle: 'Multi-Media Console &amp; Show Control Philippines | VideoSonic',
    desc: 'Show control and multi-media console operation tying video, audio and lighting together for live events in the Philippines.',
    img: '/images/backgrounds/team-bg.jpg',
    copy: 'Multi-media console operation and show control that ties video, audio and lighting into a single, cued production — run by our in-house technical crew.',
    related: null,
  },
  'rigging': {
    title: 'Rigging',
    seoTitle: 'Event &amp; LED Rigging Services Philippines | VideoSonic',
    desc: 'Specialized rigging for trussing, LED walls and overhead production elements at events across the Philippines.',
    img: '/images/projects/work-4.jpg',
    copy: 'Specialized rigging for trussing, LED wall structures and overhead production elements, developed as one of VideoSonic\'s core in-house technical capabilities.',
    related: ['FIBA World Cup 2023', '/projects/fiba-world-cup-2023/'],
  },
  'technical-production': {
    title: 'Technical Production',
    seoTitle: 'Technical Production Philippines | VideoSonic',
    desc: 'End-to-end event technical production in the Philippines: set-up services, specialized rigging, joinery and signage, utilities and telecom overlay.',
    img: '/images/backgrounds/breadcrumb-bg.jpg',
    copy: 'End-to-end technical production covering event set-up services, specialized rigging, joinery and signage, and event overlay requirements such as utilities and telecom integrations — built in-house and refined across a range of technical experts.',
    related: null,
  },
};

for (const [slug, d] of Object.entries(SERVICE_DETAIL)) {
  const heroHtml = `
<section class="hero" style="--hero-img:url('${heroBg(d.img)}');min-height:55vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">Services</span>
      <h1>${d.title}</h1>
      <p class="lede">${d.desc}</p>
      <div class="hero__ctas"><a class="btn btn-primary" href="/contact/" data-cta-name="request_quote_hero" data-cta-location="service_hero">Request a Quote</a></div>
    </div>
  </div>
</section>`;

  const related = d.related ? `<p><a class="btn btn-outline" href="${d.related[1]}">See it in action: ${d.related[0]} →</a></p>` : '';

  const bodyHtml = `
<section class="section">
  <div class="container">
    <div class="grid grid-2">
      <div>
        <h2>${d.title}</h2>
        <p>${d.copy}</p>
        ${related}
      </div>
      <div class="card reveal">
        <h3>All Services</h3>
        <ul style="margin-top:12px">
          <li style="margin-bottom:10px"><a href="/led-wall/">LED Walls</a></li>
          <li style="margin-bottom:10px"><a href="/services/projection/">Projection</a></li>
          <li style="margin-bottom:10px"><a href="/services/sound/">Sound</a></li>
          <li style="margin-bottom:10px"><a href="/services/lights/">Lights</a></li>
          <li style="margin-bottom:10px"><a href="/services/live-streaming/">Live Streaming</a></li>
          <li style="margin-bottom:10px"><a href="/services/multimedia-consoles/">Multi-Media Consoles</a></li>
          <li style="margin-bottom:10px"><a href="/services/rigging/">Rigging</a></li>
          <li style="margin-bottom:10px"><a href="/services/technical-production/">Technical Production</a></li>
        </ul>
      </div>
    </div>
  </div>
</section>` + cta();

  const ld = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","serviceType":"${d.title}","provider":{"@type":"Organization","name":"VideoSonic"},"areaServed":"Philippines"}</script>`;

  page({
    route: `/services/${slug}/`,
    title: d.seoTitle.replace('&amp;', '&'),
    description: d.desc,
    canonical: `https://www.video-sonic.com/services/${slug}/`,
    active: 'services',
    heroHtml,
    bodyHtml,
    extraHead: ld,
    breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Services", "https://www.video-sonic.com/services/"], [d.title, `https://www.video-sonic.com/services/${slug}/`]],
  });
}

// ---------------------------------------------------------------- PROJECTS HUB
page({
  route: '/projects/',
  title: 'Event Production Projects | VideoSonic Philippines',
  description: 'Selected event production projects delivered by VideoSonic across the Philippines, including corporate events, sports and broadcast productions.',
  canonical: 'https://www.video-sonic.com/projects/',
  active: 'projects',
  heroHtml: `
<section class="hero" style="--hero-img:url('${heroBg('/images/projects/work-4.jpg')}');min-height:50vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">Our Work</span>
      <h1>Projects</h1>
      <p class="lede">A selection of the productions VideoSonic has delivered — verified projects only. More case studies are added as they're confirmed.</p>
    </div>
  </div>
</section>`,
  bodyHtml: `
<section class="section">
  <div class="container">
    <div class="grid grid-3" data-projects-grid></div>
  </div>
</section>` + cta("Want your event featured here next?", "Let's talk about your production."),
  extraScripts: '<script src="/assets/js/render.js"></script>',
  breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Projects", "https://www.video-sonic.com/projects/"]],
});

// ---------------------------------------------------------------- CASE STUDIES
for (const p of projects) {
  const heroHtml = `
<section class="hero" style="--hero-img:url('${heroBg(p.cover_image)}');min-height:60vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">${p.category} &middot; ${p.year}</span>
      <h1>${p.title}</h1>
      <p class="lede">${p.summary}</p>
    </div>
  </div>
</section>`;

  const galleryImgs = p.gallery.map(g => {
    const o = optImg(g);
    if (!o) return `<img class="reveal" src="${g}" alt="${p.title} — VideoSonic production, Philippines" loading="lazy" style="border-radius:var(--radius-lg)">`;
    return `<picture><source srcset="${o.webp}" type="image/webp"><img class="reveal" src="${o.jpg}" width="633" height="633" alt="${p.title} — VideoSonic production, Philippines" loading="lazy" style="border-radius:var(--radius-lg);width:100%;height:auto"></picture>`;
  }).join('');
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const servicesLinks = p.services_used.map(s => {
    const sv = services.find(x => x.id === s);
    return `<a class="tag" href="${sv ? sv.path : '/services/'}">${sv ? sv.name : s}</a>`;
  }).join('');

  const bodyHtml = `
<section class="section">
  <div class="container">
    <div class="grid grid-2">
      <div>
        <h2>Overview</h2>
        <p>${p.summary}</p>
        <p><strong>Client:</strong> ${p.client}<br><strong>Category:</strong> ${p.category}<br><strong>Year:</strong> ${p.year}</p>
        <div class="tag-row">${tags}</div>
      </div>
      <div>
        <h2>Services Used</h2>
        <div class="tag-row">${servicesLinks}</div>
        <p style="margin-top:20px" class="placeholder">[Additional project details, technical requirements and results can be added here as they're verified.]</p>
      </div>
    </div>
    <div class="grid grid-2" style="margin-top:40px">${galleryImgs}</div>
  </div>
</section>` + cta("Planning something similar?", "Let's talk about your production.");

  const ld = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"CreativeWork","name":"${p.title}","about":"${p.category}","image":"https://www.video-sonic.com${p.cover_image}"}</script>`;

  page({
    route: p.path,
    title: `${p.title} | VideoSonic Projects`,
    description: p.summary.slice(0, 155),
    canonical: `https://www.video-sonic.com${p.path}`,
    active: 'projects',
    heroHtml,
    bodyHtml,
    extraHead: ld,
    breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Projects", "https://www.video-sonic.com/projects/"], [p.title, `https://www.video-sonic.com${p.path}`]],
  });
}

console.log('done');
