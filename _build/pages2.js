const { page, heroBg, optImg } = require('./gen');

function cta(title = "Ready to plan your event?", sub = "Tell us your event date, venue and requirements — we'll follow up with a quote.") {
  return `
<section class="section section-alt">
  <div class="container">
    <div class="cta-band reveal">
      <span class="eyebrow">Get Started</span>
      <h2>${title}</h2>
      <p class="lede center" style="margin:0 auto">${sub}</p>
      <div class="cta-band__actions"><a class="btn btn-primary" href="/contact/">Request a Quote</a></div>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- ABOUT
page({
  route: '/about/',
  title: 'About VideoSonic | LED &amp; Event Production Philippines'.replace('&amp;', '&'),
  description: "VideoSonic (Setting the Stage) is an events management company and technical service provider in the Philippines, delivering LED walls, projection, sound, lighting and full technical production.",
  canonical: 'https://www.video-sonic.com/about/',
  active: 'about',
  heroHtml: `
<section class="hero" style="--hero-img:url('${heroBg('/images/team/team-bg.jpg')}');min-height:55vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">About VideoSonic</span>
      <h1>Setting the Stage.</h1>
      <p class="lede">VideoSonic is committed to excellence and innovation, providing quality events through projection, sound, lights, LED walls, live streaming and multi-media consoles.</p>
    </div>
  </div>
</section>`,
  bodyHtml: `
<section class="section">
  <div class="container">
    <div class="grid grid-2">
      <div>
        <h2>Who we are</h2>
        <p>Videosonic (Setting the Stage) is committed to Excellence and Innovation. Providing quality events through Projection, Sound, Lights, LED Walls, Live Streaming and Multi-Media consoles. With the company's track record in handling both national and international events, VideoSonic is a full-service events management company and technical service provider.</p>
        <p class="placeholder">[Insert additional verified company history — founding year, milestones, notable long-term clients]</p>
        <h2>What we do</h2>
        <p>We've developed our own in-house technical capabilities — from event set-up services and specialized rigging to technical production, joinery and signage — to event overlay requirements such as utilities and telecom integrations. We work with a range of technical experts to ensure events are delivered to the highest standard.</p>
      </div>
      <div class="card reveal">
        <picture><source srcset="${optImg('/images/team/team-1.jpg').webp}" type="image/webp"><img src="${optImg('/images/team/team-1.jpg').jpg}" width="292" height="390" alt="Mart Miranda, President and CEO of VideoSonic" loading="lazy" style="border-radius:var(--radius);margin-bottom:16px;width:100%;height:auto"></picture>
        <h3>Mart Miranda</h3>
        <p style="color:var(--text-muted)">President &amp; CEO</p>
        <p class="placeholder">[Insert additional team members as verified]</p>
      </div>
    </div>
  </div>
</section>
<section class="section section-alt">
  <div class="container">
    <div class="section-head left">
      <span class="eyebrow">Capabilities</span>
      <h2>Production experience that shows on show day.</h2>
    </div>
    <div class="cap-row" data-capabilities></div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head left">
      <span class="eyebrow">Track Record</span>
      <h2>Projects</h2>
      <p class="lede">Verified productions: RCBC Wealth Dinner, FIBA World Cup 2023, and Miss World 2018. <a href="/projects/">View all projects →</a></p>
    </div>
  </div>
</section>` + cta("Want to work with VideoSonic?", "Reach out and let's talk about your event."),
  extraScripts: '<script src="/assets/js/render.js"></script>',
  breadcrumb: [["Home", "https://www.video-sonic.com/"], ["About", "https://www.video-sonic.com/about/"]],
});

// ---------------------------------------------------------------- CONTACT
page({
  route: '/contact/',
  title: 'Contact VideoSonic | Event Production Philippines',
  description: 'Contact VideoSonic for LED wall rental and event production in the Philippines. Warehouse 5, Lagsa Compound, San Pedro, Laguna. WhatsApp +63 927 884 5028.',
  canonical: 'https://www.video-sonic.com/contact/',
  active: 'contact',
  heroHtml: `
<section class="hero" style="--hero-img:url('/images/optimized/backgrounds/breadcrumb-bg-1920.webp');min-height:45vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">Get In Touch</span>
      <h1>Contact Us</h1>
      <p class="lede">Tell us about your event and LED wall or production requirements — we'll follow up with a quote.</p>
    </div>
  </div>
</section>`,
  bodyHtml: `
<section class="section">
  <div class="container">
    <div class="grid grid-2">
      <div class="card reveal">
        <h3>Address</h3>
        <p>Warehouse 5, Lagsa Compound,<br>San Pedro, Laguna, Philippines</p>
        <h3>WhatsApp</h3>
        <p><a href="https://wa.me/639278845028" target="_blank" rel="noopener">+63 927 884 5028</a></p>
        <h3>Sales &amp; Production Inquiries</h3>
        <p><a href="mailto:salesandproduction@video-sonic.com">salesandproduction@video-sonic.com</a></p>
        <h3>Technical Support</h3>
        <p><a href="mailto:technicaln@video-sonic.com">technicaln@video-sonic.com</a></p>
        <h3>Facebook</h3>
        <p><a href="https://www.facebook.com/videosonicph">facebook.com/videosonicph</a></p>
      </div>
      <div class="card reveal">
        <h3>Request a Quote</h3>
        <p style="color:var(--text-muted)">Tell us about your event and we'll follow up with a quote.</p>
        <form id="quote-form" novalidate style="display:flex;flex-direction:column;gap:14px;margin-top:16px">
          <label for="qf-botcheck" class="honeypot-field" aria-hidden="true">Leave this empty<input id="qf-botcheck" name="botcheck" type="checkbox" tabindex="-1" autocomplete="off"></label>
          <div class="field-row">
            <label for="qf-name">Name<input id="qf-name" name="name" class="field" type="text" required autocomplete="name"></label>
            <label for="qf-company">Company<input id="qf-company" name="company" class="field" type="text" autocomplete="organization"></label>
          </div>
          <div class="field-row">
            <label for="qf-email">Email<input id="qf-email" name="email" class="field" type="email" required autocomplete="email"></label>
            <label for="qf-phone">Phone<input id="qf-phone" name="phone" class="field" type="tel" autocomplete="tel"></label>
          </div>
          <div class="field-row">
            <label for="qf-event-type">Event Type
              <select id="qf-event-type" name="event_type" class="field">
                <option value="">Select an event type</option>
                <option>Corporate Event</option>
                <option>Concert</option>
                <option>Conference</option>
                <option>Sports Event</option>
                <option>Broadcast / Livestream</option>
                <option>Wedding / Private Event</option>
                <option>Other</option>
              </select>
            </label>
            <label for="qf-event-date">Event Date<input id="qf-event-date" name="event_date" class="field" type="date"></label>
          </div>
          <div class="field-row">
            <label for="qf-venue">Venue<input id="qf-venue" name="venue" class="field" type="text"></label>
            <label for="qf-audience">Estimated Audience<input id="qf-audience" name="estimated_audience" class="field" type="text" inputmode="numeric" placeholder="e.g. 300"></label>
          </div>
          <div>
            <span style="font-size:.85rem;color:var(--text-muted)">Services Required</span>
            <div class="checkbox-group">
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="LED Walls">LED Walls</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Projection">Projection</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Sound">Sound</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Lights">Lights</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Live Streaming">Live Streaming</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Multi-Media Consoles">Multi-Media Consoles</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Rigging">Rigging</label>
              <label class="checkbox-item"><input type="checkbox" name="services_required" value="Technical Production">Technical Production</label>
            </div>
          </div>
          <label for="qf-budget">Budget<input id="qf-budget" name="budget" class="field" type="text" placeholder="Approximate range"></label>
          <label for="qf-message">Message<textarea id="qf-message" name="message" class="field" rows="4" required></textarea></label>
          <button class="btn btn-primary" type="submit">Send Request</button>
          <p id="quote-form-status" class="form-status" role="status" aria-live="polite"></p>
        </form>
        <p style="margin-top:4px">Prefer email or WhatsApp? Reach us directly at <a href="mailto:salesandproduction@video-sonic.com">salesandproduction@video-sonic.com</a> or <a href="https://wa.me/639278845028" target="_blank" rel="noopener">WhatsApp +63 927 884 5028</a>.</p>
      </div>
    </div>
  </div>
</section>`,
  extraHead: `<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"VideoSonic","image":"https://www.video-sonic.com/images/brand/logo.png","address":{"@type":"PostalAddress","streetAddress":"Warehouse 5, Lagsa Compound","addressLocality":"San Pedro","addressRegion":"Laguna","addressCountry":"PH"},"telephone":"+63-927-884-5028","email":"salesandproduction@video-sonic.com","url":"https://www.video-sonic.com/contact/"}</script>`,
  extraScripts: '<script src="/assets/js/contact-form.js"></script>',
  breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Contact", "https://www.video-sonic.com/contact/"]],
});

// ---------------------------------------------------------------- SUPPLIER (Get Accredited — preserved from live site)
page({
  route: '/supplier/',
  title: 'Supplier Accreditation | VideoSonic',
  description: 'Become an accredited supplier for VideoSonic events and productions in the Philippines.',
  canonical: 'https://www.video-sonic.com/supplier/',
  active: null,
  heroHtml: `
<section class="hero" style="--hero-img:url('/images/optimized/backgrounds/breadcrumb-bg-1920.webp');min-height:45vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">Get Accredited</span>
      <h1>Supplier Accreditation</h1>
      <p class="lede">Apply to become an accredited supplier for VideoSonic's events and productions.</p>
    </div>
  </div>
</section>`,
  bodyHtml: `
<section class="section">
  <div class="container">
    <div class="grid grid-2">
      <div class="card reveal">
        <h3>Address</h3>
        <p>Warehouse 5, Lagsa Compound, San Pedro, Laguna, Philippines</p>
        <h3>WhatsApp</h3>
        <p><a href="https://wa.me/639278845028" target="_blank" rel="noopener">+63 927 884 5028</a></p>
        <h3>Email</h3>
        <p><a href="mailto:salesandproduction@video-sonic.com">salesandproduction@video-sonic.com</a></p>
      </div>
      <div class="card reveal">
        <h3>Supplier Accreditation Form</h3>
        <p>Complete the accreditation form to be considered as a VideoSonic supplier.</p>
        <a class="btn btn-primary" href="https://docs.google.com/forms/d/e/1FAIpQLSeaq4WIDSzOPzUODG-1a9dZ42JHGDs4ZW_MZ8n8GnLaMKlHpA/viewform?usp=sf_link" target="_blank" rel="noopener">Click Here to Apply</a>
      </div>
    </div>
  </div>
</section>`,
  breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Get Accredited", "https://www.video-sonic.com/supplier/"]],
});

// ---------------------------------------------------------------- INSIGHTS HUB
const posts = [
  { slug: 'led-wall-rental-philippines-guide', title: 'LED Wall Rental Philippines: What Event Organizers Need to Know', excerpt: 'What to consider before booking an LED wall for your next event in the Philippines — screen sizing, venue type, and working with a technical crew.' },
  { slug: 'indoor-vs-outdoor-led-walls', title: 'Indoor vs Outdoor LED Walls for Events', excerpt: 'How indoor and outdoor LED wall requirements differ, and what that means for planning your event.' },
  { slug: 'choosing-the-right-led-screen', title: 'How to Choose the Right LED Screen for Your Event', excerpt: 'A practical framework for matching LED screen size and format to your event type and venue.' },
  { slug: 'event-production-checklist-corporate-events', title: 'Event Production Checklist for Corporate Events', excerpt: 'A planning checklist covering AV, LED, staging and technical production for corporate events.' },
  { slug: 'led-wall-vs-projection', title: 'LED Wall vs Projection for Large Events', excerpt: 'How to decide between LED walls and projection depending on your venue, lighting conditions and budget.' },
];

const postCards = posts.map(p => `
        <a class="post-card reveal" href="/insights/${p.slug}/">
          <span class="eyebrow">Insights</span>
          <h3>${p.title}</h3>
          <p style="color:var(--text-muted)">${p.excerpt}</p>
        </a>`).join('');

page({
  route: '/insights/',
  title: 'LED Wall &amp; Event Production Insights | VideoSonic'.replace('&amp;', '&'),
  description: 'Practical guides on LED walls and event production in the Philippines from VideoSonic.',
  canonical: 'https://www.video-sonic.com/insights/',
  active: 'insights',
  heroHtml: `
<section class="hero" style="--hero-img:url('/images/optimized/backgrounds/breadcrumb-bg-1920.webp');min-height:45vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">Insights</span>
      <h1>Insights</h1>
      <p class="lede">Practical guides on LED walls and event production in the Philippines, written from VideoSonic's verified expertise.</p>
    </div>
  </div>
</section>`,
  bodyHtml: `
<section class="section">
  <div class="container">
    <div class="grid grid-3">${postCards}</div>
  </div>
</section>`,
  breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Insights", "https://www.video-sonic.com/insights/"]],
});

// ---------------------------------------------------------------- INSIGHTS ARTICLES
const ARTICLE_BODY = {
  'led-wall-rental-philippines-guide': `
<p>Booking an LED wall for an event in the Philippines comes down to a few practical decisions: screen size relative to your venue and audience distance, whether the event is indoor or outdoor, and how the LED wall integrates with the rest of your production — staging, rigging, power and show control.</p>
<h3>Start with the venue</h3>
<p>Venue size and layout determine how large an LED wall needs to be to read clearly from the back row, and whether it can be rigged (flown) or needs ground support. <span class="placeholder">[Insert verified guidance on venue assessment from VideoSonic's technical team]</span></p>
<h3>Work with a full-service technical crew</h3>
<p>An LED wall is only as reliable as the rigging, power distribution and control system behind it. VideoSonic pairs LED wall rental with in-house rigging and technical production, so the display is planned as part of the whole show rather than a standalone rental.</p>
<h3>Plan ahead</h3>
<p>LED wall availability, crew scheduling and venue logistics are easier to lock in the earlier you start planning. <a href="/led-wall/">See VideoSonic's LED wall capabilities</a> or <a href="/contact/">request a quote</a> for your event.</p>`,
  'indoor-vs-outdoor-led-walls': `
<p>Indoor and outdoor LED walls are planned differently, mainly because of ambient light, weather exposure and structural requirements.</p>
<h3>Indoor LED walls</h3>
<p>Indoor environments give more control over ambient light, so screen brightness and viewing distance can be optimized for the room. Rigging is typically simpler since there's no weather exposure to plan around.</p>
<h3>Outdoor LED walls</h3>
<p>Outdoor deployments need to account for direct sunlight, wind loading on structures, and weatherproofing. <span class="placeholder">[Insert verified outdoor-rated panel specifications and structural requirements]</span></p>
<h3>Choosing between them</h3>
<p>The right choice depends on your venue, time of day, and audience size. VideoSonic's technical production team handles both configurations — <a href="/contact/">talk to us about your venue</a>.</p>`,
  'choosing-the-right-led-screen': `
<p>Choosing an LED screen for your event comes down to matching format and size to what the audience actually needs to see, and how far they'll be sitting or standing from it.</p>
<h3>Match screen size to viewing distance</h3>
<p>A screen that's too small won't read from the back of a large venue; one that's oversized for an intimate room can overwhelm the space. <span class="placeholder">[Insert verified pixel pitch / viewing distance guidance]</span></p>
<h3>Consider the content</h3>
<p>Live camera feeds, branded graphics, and stage backdrops each have different resolution and aspect ratio needs. Talk through your content plan with your production team before finalizing screen dimensions.</p>
<h3>Get it planned with your production partner</h3>
<p>VideoSonic sizes and configures LED screens as part of full event production, not as a standalone rental — <a href="/contact/">request a quote</a> with your venue and content details.</p>`,
  'event-production-checklist-corporate-events': `
<p>A corporate event's technical production covers more than just booking equipment — it's coordinating AV, LED, staging, and crew around a fixed show schedule.</p>
<h3>Before the event</h3>
<ul style="list-style:disc;padding-left:20px;margin-bottom:16px">
  <li>Confirm venue power, load-in access and rigging points</li>
  <li>Finalize LED wall / screen size and stage layout</li>
  <li>Confirm sound and lighting requirements for the program</li>
  <li>Align on run-of-show with the technical crew</li>
</ul>
<h3>On the day</h3>
<ul style="list-style:disc;padding-left:20px;margin-bottom:16px">
  <li>Load-in, rigging and technical set-up</li>
  <li>Full system check (LED, sound, lighting, multi-media console)</li>
  <li>Rehearsal / cue-to-cue run-through</li>
  <li>Live show technical direction</li>
</ul>
<p>VideoSonic handles this end-to-end as part of its technical production service — <a href="/services/technical-production/">see the service</a> or <a href="/contact/">get in touch</a>.</p>`,
  'led-wall-vs-projection': `
<p>LED walls and projection both put video and graphics on a large surface, but they suit different situations.</p>
<h3>When LED walls make sense</h3>
<p>LED walls hold up in bright or uncontrolled ambient light and offer strong contrast and color regardless of venue lighting — well suited to stages, galas and broadcast-scale productions like VideoSonic's <a href="/projects/fiba-world-cup-2023/">FIBA World Cup 2023</a> and <a href="/projects/miss-world-2018/">Miss World 2018</a> game-experience work.</p>
<h3>When projection makes sense</h3>
<p>Projection, including 3D projection mapping, works well on irregular surfaces, building facades, or where a lighter physical footprint is needed — as delivered for the <a href="/projects/rcbc-wealth-dinner/">RCBC Wealth Dinner</a> in collaboration with Manila Visual Jocks x VideoSonic.</p>
<h3>Deciding for your event</h3>
<p>The right choice depends on venue lighting, surface, and budget. <a href="/contact/">Talk to VideoSonic's production team</a> about which fits your event.</p>`,
};

for (const p of posts) {
  page({
    route: `/insights/${p.slug}/`,
    title: `${p.title} | VideoSonic Insights`,
    description: p.excerpt,
    canonical: `https://www.video-sonic.com/insights/${p.slug}/`,
    active: 'insights',
    heroHtml: `
<section class="hero" style="--hero-img:url('/images/optimized/backgrounds/breadcrumb-bg-1920.webp');min-height:40vh">
  <div class="container">
    <div class="hero__inner">
      <span class="eyebrow">Insights</span>
      <h1>${p.title}</h1>
    </div>
  </div>
</section>`,
    bodyHtml: `
<section class="section">
  <div class="container" style="max-width:760px">
    ${ARTICLE_BODY[p.slug]}
  </div>
</section>` + cta(),
    extraHead: `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${p.title}","description":"${p.excerpt}","publisher":{"@type":"Organization","name":"VideoSonic"}}</script>`,
    breadcrumb: [["Home", "https://www.video-sonic.com/"], ["Insights", "https://www.video-sonic.com/insights/"], [p.title, `https://www.video-sonic.com/insights/${p.slug}/`]],
  });
}

console.log('done2');
