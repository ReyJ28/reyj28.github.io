# VideoSonic — Design System & Site Architecture (Phase 2)

Branch: `website-redesign-2026`. This is the blueprint implementation follows.

## 1. Design system

**Direction:** cinematic, dark, technical, premium, LED-glow accent, large type, generous negative space, minimal chrome, authentic event photography.

### Color tokens (`assets/css/tokens.css`)
- `--bg`: #0a0a0d — page background, near-black
- `--bg-elevated`: #121216 — cards, header
- `--surface`: #18181d — inputs, secondary surfaces
- `--border`: #2a2a32
- `--text`: #f5f5f7
- `--text-muted`: #9a9aa5
- `--accent`: #22d3ee — LED cyan, primary interactive/glow color
- `--accent-strong`: #67e8f9 — hover/highlight
- `--accent-warm`: #ff5a36 — CTA emphasis, sparingly (LED red/orange glow)
- Gradients used only for glow/vignette effects behind hero and section dividers, never as decorative noise.

### Typography
- Display/headings: `"Space Grotesk"` (technical, geometric, confident) — Google Fonts
- Body: `"Inter"` — Google Fonts
- Both loaded with `font-display: swap`; system-font fallback stack included so the page is never blocked on font load.
- Scale: hero H1 clamp(2.75rem, 6vw, 5.5rem); section H2 clamp(2rem, 4vw, 3rem); body 1rem/1.7 line-height.

### Layout
- 12-col fluid grid, max content width 1280px, 24px gutter mobile / 40px desktop.
- Section rhythm: 96px vertical padding desktop, 56px mobile.
- Sticky header, transparent-over-hero → solid on scroll.

### Components (in `assets/css/main.css`)
`.btn` / `.btn-primary` / `.btn-outline`, `.card`, `.card-project`, `.badge`, `.nav`, `.mobile-nav-toggle`, `.hero`, `.section`, `.grid-3`/`.grid-2`, `.stat-row` (replaces old fake counters — see §2), `.footer`, `.breadcrumb`, `.cta-band`.

### Motion
Subtle only: fade/slide-in on scroll (IntersectionObserver, `prefers-reduced-motion` respected), no autoplay carousels of unverified stats.

## 2. Replacing the fake stats counters

Per user decision, no numeric counters unless verifiable. Replaced with a **capabilities/authority band**:

> PRODUCTION EXPERIENCE THAT SHOWS ON SHOW DAY.

Four capability tiles instead of four fake numbers: LED Wall Systems · Full-Service Technical Production · Projection & AV Integration · In-House Rigging & Crew — each backed by real service copy, no invented figures. Architecture: a simple array in `data/capabilities.json` so real numbers can be dropped in later (`value` field is currently null/omitted → renders as a capability statement instead of a stat).

## 3. Content model (data-driven, no framework)

Static site, no build step (matches current GH Pages hosting). "CMS-lite" via JSON files + a small vanilla-JS renderer, so new projects/services don't require touching page markup:

- `data/services.json` — id, name, slug, short_desc, icon, is_primary (LED Wall = true), status ("verified" | "placeholder")
- `data/projects.json` — id, title, slug, client, year, category, cover_image, gallery[], summary, services_used[], status
- `data/capabilities.json` — label, description, value (nullable)

`assets/js/render.js` fetches these on index/listing pages (`/projects/`, `/services/`, homepage highlight strips) and renders cards. Individual case-study and service detail pages remain hand-authored static HTML (each needs bespoke narrative), but they're linked from `data/*.json` by slug, so the listing pages never need manual edits when a new project/service page is added — just append a JSON entry + create the page at the matching slug.

## 4. URL / SEO architecture

```
/                           Homepage
/led-wall/                  Primary LED Wall authority page (SEO priority #1)
/led-wall/size-guide/       LED Wall Size Calculator & Guide (interactive lead-gen tool)
/services/                  Services hub
/services/sound/
/services/lights/
/services/projection/
/services/live-streaming/
/services/multimedia-consoles/
/services/rigging/
/services/technical-production/
/projects/                  Portfolio hub (data-driven grid)
/projects/rcbc-wealth-dinner/
/projects/3d-projection-manila-visual-jocks/
/projects/fiba-world-cup-2023/
/projects/miss-world-2018/
/about/
/contact/
/supplier/                  Get Accredited (preserves live site's supplier.html)
/insights/                  Insights hub (blog architecture, ready for future posts)
/insights/led-wall-rental-philippines-guide/
/insights/indoor-vs-outdoor-led-walls/
/insights/choosing-the-right-led-screen/
/insights/event-production-checklist-corporate-events/
/insights/led-wall-vs-projection/
/404.html
```

Sub-pages under `/led-wall/` (rental, indoor, outdoor, events, corporate, concerts, sports) are **not** created yet — insufficient distinct verified content to make each genuinely useful (master brief §9: don't create thin pages). The single `/led-wall/` page covers all of that intent now; split later once real photos/case detail exist per sub-category.

Old template pages `generic.html` and `elements.html` (Templated.co demo pages, zero real content, never part of the live site, not indexed) are removed — see `CONTENT_MIGRATION.md`. `index.html`, `contact.html`, `supplier.html` map to real routes; see `URL_REDIRECT_MAP.md`.

## 7. LED Wall Size Calculator (`/led-wall/size-guide/`)

Interactive planning tool, separated cleanly into calculation vs. UI vs. content, matching the "no invented equipment specs" rule from the master brief:

- **`assets/js/led-calculator.js`** — pure calculation module, no DOM access. Exposes `window.LEDCalculator.calculate(input, equipmentData)`. Takes viewing distance, content type, audience size and aspect ratio; returns width/height/area/aspect-ratio-label/suitability text. This is the project's equivalent of a `/lib/` module — isolated so the math can change without touching markup, and vice versa.
- **`assets/js/size-guide.js`** — page-only UI wiring: reads the form, calls the calculator, renders the result card. Contains zero calculation logic itself.
- **`data/led-equipment.json`** — `{ verified: false, pixelPitchOptions: [] }`. The calculator checks `verified` before ever computing a pixel-pitch number; while false (today), the page always shows "To be confirmed based on venue and viewing distance" rather than inventing a spec. Populating this file later with real, confirmed VideoSonic pixel-pitch inventory is the only change needed to make the calculator recommend an actual pitch category — no code change required.
- Sizing heuristic is VideoSonic's own general planning ratio (viewing distance ÷ a per-content-type factor for height, aspect ratio for width, audience size only nudges a minimum-width floor for large audiences) — explicitly labelled as a planning estimate everywhere it appears, never presented as an engineering spec or a claim about a certified standard.
- Entry points: a dedicated banner section on `/led-wall/`, and a secondary "Try the Size Calculator" link on the LED Walls card in `/services/` (via an optional `extraLink` field on that one entry in `data/services.json`, rendered by `assets/js/render.js`).

## 5. Navigation

Header: `LED Walls` · `Services` · `Projects` · `About` · `Insights` · `Contact` — plus persistent `Log In` (ERP) and a primary `Request an LED Quote` button. Sticky mobile CTA bar (`Request Quote` / `Call`) per master brief §22.

Footer: company info (address/phone/email from audit), service links, project links, social (Facebook), legal line, "Made by" credit line preserved in spirit (updated).

## 6. Structured data plan
Organization + WebSite on every page (JSON-LD in a shared include pattern — duplicated per static page since there's no templating layer). LocalBusiness on `/contact/` and `/supplier/`. Service schema on each `/services/*` and `/led-wall/`. BreadcrumbList on all non-home pages. ImageObject on project galleries. Article on `/insights/*` posts once published.
