# Production Deployment Report

## Deployment facts

| | |
|---|---|
| Production repository | `ReyJ28/reyj28.github.io` |
| Deployment commit | `2c49897d3b2b9afc9559034ea9c41eac555d2f36` |
| Previous commit / rollback tag | `pre-redesign-2026` → `90d501735bcc3fcce30d8ced1ca6cf175e2b9396` (tagged and pushed to `origin` before deploy) |
| Deployment timestamp | 2026-08-09T18:55:37+08:00 (commit time); pushed and live-verified same session |
| Canonical URL | `https://www.video-sonic.com/` |
| DNS / MX / SPF / DKIM | **Not touched** — deployment was entirely a GitHub Pages content push, no DNS changes |

## Verification performed against the live domain (not a preview)

| Check | Result |
|---|---|
| GitHub Pages status | Live — new content confirmed serving within minutes of push |
| HTTPS | Valid — Let's Encrypt cert for `www.video-sonic.com`, unchanged (`openssl s_client` re-checked post-deploy, same cert as pre-deploy) |
| `www.video-sonic.com` | Loads correctly, new homepage content confirmed |
| All 23 core pages | **200 OK**, checked via a live script against the real domain (`_build/audit-live.js`) — homepage, `/led-wall/`, all 8 services pages, all 4 projects pages, `/about/`, `/contact/`, `/supplier/`, all 6 insights pages |
| Assets | Confirmed loading: CSS, JS, images (optimized WebP/JPEG), `data/*.json` — all 200 in live network trace |
| Legacy URLs (`/contact.html`, `/supplier.html`) | Both 200, confirmed forwarding to `/contact/` and `/supplier/` via meta-refresh, both retain `noindex,follow` + canonical to the new URL |
| Old preserved assets (`img/`, `css/`, `fonts/`, `js/`, `sass/`, `icon_logo.png`) | Untouched, spot-checked `img/logo.png` still 200 |
| Sitemap | `sitemap.xml` live, 200 |
| Robots | `robots.txt` live, 200, allows all crawling, points to the live sitemap |
| Structured data | 42 JSON-LD blocks fetched live from the real domain and JSON-parsed — **0 invalid** |
| Contact form | `/contact/` confirmed live with all 19 form fields present, `contact-form.js` wired, both `salesandproduction@video-sonic.com` and `technicaln@video-sonic.com` visible on the page |
| MomentCRM | `momentcrm.js` script tag present and loading (200) on the live homepage and `/contact/`; a `postMessage` warning referencing `app.pavior.com` appeared in console — this is normal cross-origin messaging from MomentCRM's own chat-widget iframe initializing (not an error from this site's code), and is the expected sign the widget is attempting to load correctly on the real domain (unlike the sandboxed dev preview, where the external network call itself was blocked) |
| Console errors | **0** attributable to this site's code on a fresh tab load. (An earlier check in a tab that had also browsed the *old* live site earlier in this session showed a stale `MomentCRM is not defined` error from that prior page load — reproduced on a completely fresh tab and confirmed **absent**; false alarm from console-log buffer carryover, not a real bug — see investigation notes below.) |
| Mobile (375px) | No horizontal overflow on the live homepage, verified directly against `video-sonic.com` |
| 404 handling | Confirmed: unknown URL returns HTTP 404 with the custom "Page Not Found \| VideoSonic" page, not GitHub's generic 404 |

### MomentCRM console-error investigation (worth recording)
Right after deploy, a browser tab that had earlier in this session loaded the *old* production site showed two `Uncaught ReferenceError: MomentCRM is not defined` messages. That error signature only matches the **old** site's unguarded `MomentCRM('init', ...)` call (no existence check) — the new `assets/js/momentcrm.js` explicitly guards with `if (typeof MomentCRM === 'function')` and cannot throw that error. Opening a brand-new tab and loading the live site fresh showed **no such error**, confirming the messages were stale console-buffer entries from that tab's earlier navigation history, not a live defect. Documented here for transparency rather than silently discarded.

## Status by area (as requested)

- **Production repository:** `ReyJ28/reyj28.github.io` — confirmed correct target, deployed.
- **GitHub Pages status:** Live, serving the new build.
- **HTTPS status:** Valid, unchanged.
- **MomentCRM status:** Preserved, present site-wide, loading non-blocking, config (`teamVanityId: vs-salesteam`, `doChat: true`, `doTracking: true`) unchanged from the original.
- **Contact form status:** Fully built and live (11 fields, validation, honeypot, accessible status messaging) but **not yet functionally activated** — the Web3Forms access key is a placeholder. Submitting today shows a graceful fallback message with direct email/phone, not a broken/silent failure. See `CONTACT_FORM_ARCHITECTURE.md` (in the `ReyJ28/videosonic.github.io` source repo) for the exact activation steps.
- **Email routing:** Form will route to `salesandproduction@video-sonic.com` once activated. `technicaln@video-sonic.com` preserved as a separate, visible "Technical Support" line on `/contact/`, not wired to the form, per your instruction.
- **Legacy URL status:** `/contact.html` and `/supplier.html` live as compatibility forwarding pages (not HTTP 301s — documented as such everywhere), both verified forwarding correctly.
- **Sitemap status:** Live at `/sitemap.xml`, 200.
- **Robots status:** Live at `/robots.txt`, 200, permissive, points to the live sitemap.
- **Structured data status:** 42 JSON-LD blocks live, 0 invalid, 0 unsupported claims (checked in Phase 3's `STRUCTURED_DATA_AUDIT.md`, re-verified live post-deploy).
- **Lighthouse results:** **Not yet run** — per your instruction to run it after production deployment, this is the next action, not something to estimate here. See "Remaining issues" below for the exact commands.
- **Rollback commit/tag:** `pre-redesign-2026` → `90d501735bcc3fcce30d8ced1ca6cf175e2b9396`, tagged and pushed to `origin` before this deploy. `git revert 2c49897` (or `git reset --hard pre-redesign-2026` + force-push if a clean revert isn't possible) restores the previous live site with no DNS involvement.

## Remaining issues / next actions

1. **Run Lighthouse against the live production URLs** (homepage, `/led-wall/`, `/services/`, `/projects/`, `/contact/`, plus one representative service and project page), per your Phase 4 instruction:
   ```
   npx lighthouse https://www.video-sonic.com/ --view
   npx lighthouse https://www.video-sonic.com/led-wall/ --view
   npx lighthouse https://www.video-sonic.com/services/ --view
   npx lighthouse https://www.video-sonic.com/projects/ --view
   npx lighthouse https://www.video-sonic.com/contact/ --view
   npx lighthouse https://www.video-sonic.com/services/sound/ --view
   npx lighthouse https://www.video-sonic.com/projects/fiba-world-cup-2023/ --view
   ```
   Not run yet in this session — no Chrome/Lighthouse CLI available in this sandboxed environment; this needs to run from a machine with Chrome installed. Recording actual scores here once available, not estimating them.
2. **Activate the Web3Forms contact form** — create the account, generate the key, verify `salesandproduction@video-sonic.com` as the destination on Web3Forms' dashboard, replace the placeholder in `assets/js/contact-form.js`.
3. **Google Search Console / GA4 / Bing Webmaster Tools** — per the post-launch sequence in `SEO_MIGRATION_PLAN.md` (source repo): verify ownership via DNS TXT, submit `https://www.video-sonic.com/sitemap.xml`, inspect the homepage/`/led-wall/`/major service+project pages, then monitor indexing/crawl errors/404s/Core Web Vitals over the following weeks. Not started — flagged as your action per the "do not submit anything yet without confirming" instruction from Phase 4, now that deployment is live this is unblocked whenever you're ready.
4. **Content gaps still marked `[placeholder]`** on the live site (verified event years, LED technical specs, additional team bios) — unchanged from Phase 2/3, still pending your input, not blocking launch.
