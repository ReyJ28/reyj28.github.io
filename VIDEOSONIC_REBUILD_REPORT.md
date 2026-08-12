# VideoSonic Rebuild Report

Branch: `website-redesign-2026`. This report captures the original rebuild snapshot; the site has since deployed to production (`ReyJ28/reyj28.github.io`, live at `www.video-sonic.com`) and received several follow-up changes — see `PRODUCTION_DEPLOYMENT_REPORT.md` and later commits for the current live state.

## NEW FEATURE — LED Wall Size Calculator & Guide (`/led-wall/size-guide/`)

Interactive SEO + lead-generation tool added post-launch. Full detail in `SITE_ARCHITECTURE.md` §7. Summary:
- Estimates a starting LED wall width/height/area/aspect ratio from event type, audience size, viewing distance, content type and screen shape — explicitly labelled a **planning estimate**, never an engineering spec.
- Calculation logic isolated in `assets/js/led-calculator.js` (pure, no DOM), separate from `assets/js/size-guide.js` (UI only) and `data/led-equipment.json` (equipment data, currently `verified: false` — pixel pitch always shows "To be confirmed based on venue and viewing distance" rather than an invented spec; populating that JSON file later with real VideoSonic pixel-pitch inventory is the only change needed to activate real recommendations).
- Educational 7-step guide (viewing distance, audience size, content, aspect ratio, pixel pitch, venue, content resolution), FAQ section with `FAQPage` schema, `WebPage` + `BreadcrumbList` schema, no `Product`/`Offer` schema used.
- Entry points added on `/led-wall/` (dedicated banner) and the `/services/` hub's LED Walls card (secondary link).
- Added to `sitemap.xml`; SEO metadata (title/description/canonical/OG/Twitter) generated automatically via the existing page template.
- Tested: all calculation paths (standard, custom aspect ratio, custom audience number, audience-driven width floor), invalid inputs (empty/negative distance, missing custom ratio), extreme values (1000m distance correctly clamped with a "talk to our technical team" note), mobile (375px, no overflow, result card included), accessibility (every field labelled, error list `role="alert"`, result region `aria-live="polite"`), zero console errors across every test.

## COMPLETED

- **Design system** — dark/cinematic theme, Space Grotesk + Inter, LED-cyan accent, full component library (`SITE_ARCHITECTURE.md`, `assets/css/tokens.css`, `assets/css/site.css`)
- **Homepage, LED Wall SEO architecture (`/led-wall/`), Services hub + 7 detail pages, Projects hub + 3 verified case studies, About, Contact, Supplier (Get Accredited preserved), Insights hub + 5 original articles, 404** — 23 pages total, all hand-verified
- **Content model** — `data/{services,projects,capabilities}.json` drive listing grids via `assets/js/render.js`; adding a project/service later is a JSON edit, not a markup change
- **Structured data** — 42 JSON-LD blocks across the site (Organization, WebSite, Service, BreadcrumbList, FAQPage, LocalBusiness, CreativeWork, Article); see `STRUCTURED_DATA_AUDIT.md` — 0 problems, no unsupported claims
- **Sitemap & robots** — `sitemap.xml` contains exactly the 23 indexable pages (verified by diff against the actual page set, zero mismatch); `robots.txt` allows all crawling and points to the sitemap; no CSS/JS/image paths blocked
- **SEO metadata** — unique `<title>`/meta description on every page (verified programmatically, zero duplicates), canonical URLs, Open Graph + Twitter Card tags generated automatically per page from each page's hero image, single `<h1>` per page, logical H2/H3 hierarchy
- **Image optimization** — 14 real assets optimized via ffmpeg (WebP + compressed JPEG, responsive widths for the hero and section backgrounds), 81% total size reduction (2.82 MB → 533 KB best-case). `<picture>`+WebP, explicit `width`/`height`, `loading="lazy"` on all below-the-fold images; hero images preloaded with `fetchpriority="high"` and never lazy-loaded. Full breakdown in `IMAGE_OPTIMIZATION_REPORT.md`
- **Accessibility** — skip-to-content link, `:focus-visible` outlines (10.9:1+ contrast on accent), all body/muted text ≥7:1 contrast (WCAG AA requires 4.5:1), `<label>` on every form field, `aria-expanded`/`aria-label` on the mobile menu toggle, decorative icons marked `aria-hidden`, `prefers-reduced-motion` respected (scroll-reveal animations disable cleanly)
- **Internal linking** — crawled all 23 pages programmatically: **0 broken internal links, 0 orphan pages** (every page reachable from nav/footer/content)
- **Content accuracy** — repo-wide grep for template/demo/placeholder markers (`950`, `8873`, `award-winning`, `Lorem`, `Templated`, `Demo`, `Example`) found zero hits in any live-facing page; the only matches were in this project's own internal audit docs (describing what was removed) and two now-orphaned template files (`assets/css/main.css`, `assets/js/main.js`) that no page references
- **Mobile QA** — checked 375/390/768/1440px on homepage, `/led-wall/`, `/services/`, `/contact/`, and a project case study: **no horizontal overflow at any breakpoint**; mobile nav toggle opens/closes correctly; sticky mobile CTA bar shows only under 960px
- **Correction transparency** — the initial "4 projects" brief was corrected to **3 verified projects** after checking the live site's raw HTML (not just rendered text) showed "3D Projection" / "Manila Visual Jocks x Videosonic" are sub-tags of the single RCBC Wealth Dinner project, not a separate case study. Documented in `CONTENT_MIGRATION.md`.

## REQUIRES DEPLOYMENT (cannot be completed statically/locally)

- **Live structured-data validation** — Google's Rich Results Test and Schema Markup Validator both require a fetchable public URL; static JSON-parse validation was done (`STRUCTURED_DATA_AUDIT.md`), but rich-result *eligibility* can only be confirmed once live
- **Live sitemap/robots validation** — Search Console's sitemap report and robots.txt tester both require the file to be served from the real domain
- **Lighthouse production test** — **not run**. This environment has no Chrome/Lighthouse CLI available (`npx lighthouse` was not attempted against a throwaway/unreliable setup rather than risk fabricating numbers), and Lighthouse scores measured against `localhost` don't reflect real CDN/TLS/network conditions anyway. What *can* be said honestly, from the static build itself: minimal JS (~2KB custom, no framework), a single external font request (Google Fonts, `font-display: swap`), the hero image preloaded and never lazy-loaded, and all below-the-fold images lazy + explicitly sized to avoid layout shift — these are the right inputs for a good score, but the actual number needs a real Lighthouse run. **Exact command to run after deployment:**
  ```
  npx lighthouse https://www.video-sonic.com/ --view --preset=desktop
  npx lighthouse https://www.video-sonic.com/ --view
  ```
- **Google Search Console submission** — needs domain ownership verification on the live domain
- **Google indexing verification** — needs the site to actually be crawlable at its final URL

## REQUIRES COMPANY INPUT

- **Hosting/redirect decision** — where `video-sonic.com` actually gets deployed determines how `/contact.html` → `/contact/` and `/supplier.html` → `/supplier/` redirects get implemented. Templates are ready in `deploy-templates/` (Netlify/Cloudflare `_redirects`, Vercel `vercel.json`) but inactive until a platform is chosen. See `URL_REDIRECT_MAP.md`.
- **Verified event years** for RCBC Wealth Dinner (currently `[Insert verified year]`)
- **LED panel / audio / streaming technical specifications** — left as explicit `[placeholder]` markers on `/led-wall/`, `/services/sound/`, `/services/live-streaming/` rather than invented
- **Additional team members** beyond CEO Mart Miranda, and any additional company history/milestones for `/about/`
- **Confirmation of which regions/cities are actively served** beyond "Philippines" / "Metro Manila" (used generically per the master brief's instruction not to fabricate specific city claims)
- **A real form backend** — `/contact/`'s form is a static placeholder (`onsubmit="return false"`, no submission endpoint). Documented below under Security/Forms — do not treat it as production-ready.
- **Real photos for `work-2.jpg`, `work-3.jpg`, `work-5.jpg`, `work-6.jpg`** — these 4 assets exist and are optimized but have no verified project caption in the live site's source, so they weren't assigned to a case study
- **Awards/recognition claims** — "award-winning" was found on the live site with no supporting evidence and was **not** carried into the rebuild; if real awards exist, they can be added to `/about/` and `Organization` schema (`award` field) once verifiable

## Security / Forms — explicit status

The `/contact/` request-quote form is **not production-ready** — it's a static placeholder with `onsubmit="return false"`, client-side-only, no backend endpoint, no email delivery, no spam protection (no honeypot/reCAPTCHA), no server-side validation. Fields have `required`/`type="email"` browser-level validation only. This is called out on the page itself (`[Connect to verified form handler]`). No exposed secrets, API keys, or credentials were found anywhere in the codebase (checked via grep across all HTML/JS/JSON). Before this form goes live it needs: a real submission endpoint (email service, CRM webhook, or serverless function), server-side validation, and spam mitigation.

## Cross-browser QA — explicit status

Testing in this environment was done through a single Chromium-based automated browser tool (console/network/DOM inspection + viewport resizing at 375/390/768/1440px). **Firefox and Safari were not tested** — no such browser was available in this sandboxed environment. The CSS used (flexbox, grid, `clamp()`, CSS custom properties, `aspect-ratio`, `backdrop-filter`) is all broadly supported in current Chrome/Edge/Firefox/Safari, so no compatibility issues are expected, but this is an inference, not a verified cross-browser test — flagged honestly rather than claimed as done.

## Deployment — exact steps once a hosting decision is made

1. Decide hosting (GitHub Pages custom domain vs. Netlify/Vercel/Cloudflare Pages) — determines which redirect template in `deploy-templates/` to activate (see `URL_REDIRECT_MAP.md`).
2. Merge `website-redesign-2026` → `main` **(explicitly not done — waiting on your approval)**.
3. Point the `video-sonic.com` DNS/hosting at this repo's built output (it's already static, no build step required).
4. Rename the appropriate file in `deploy-templates/` into place for the chosen host, or implement the GitHub-Pages-only fallback described in `URL_REDIRECT_MAP.md`.
5. Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools once live.
6. Run `npx lighthouse https://www.video-sonic.com/ --view` and address anything below target (90+ perf/a11y/best-practices, 95+ SEO).
7. Spot-check Google's Rich Results Test against a few live URLs (`/`, `/led-wall/`, one case study, one insight article).

**Nothing above has been executed — no merge, no deploy, no DNS change.** All work is committed on `website-redesign-2026` only.
