# Contact Form Architecture

Implemented per Phase 4/5 approval: **Web3Forms**, client-side only, no backend to maintain.

## How it works
- `assets/js/contact-form.js` intercepts the `/contact/` page's `#quote-form` submit, validates required fields (`Name`, `Email`, `Message` — browser-native `required`), checks a hidden honeypot field, then POSTs a `FormData` payload to `https://api.web3forms.com/submit`.
- Success/error/sending states are shown in a `role="status" aria-live="polite"` element so screen readers announce them.
- All 11 requested fields are present: Name, Company, Email, Phone, Event Type (select), Event Date (date picker), Venue, Estimated Audience, Services Required (checkbox group, multi-select), Budget, Message.

## The access key — not yet activated (blocking item)
Web3Forms' architecture requires a **public** access key embedded in client-side code by design — this is not a leaked secret, it's how the service is meant to work (the actual destination inbox is configured on Web3Forms' own dashboard when the key is generated, not controllable from the page). `assets/js/contact-form.js` currently has:
```js
var WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_ACCESS_KEY';
```
This is an intentionally-invalid placeholder. **I cannot create the Web3Forms account or generate this key myself** — account creation is outside what I can do on your behalf. Until a real key is substituted, the form fails **safely**: it shows *"This form isn't connected yet. Please email salesandproduction@video-sonic.com or message us on WhatsApp at +63 927 884 5028"* instead of silently pretending to work (verified in the browser — see deployment verification in `PRODUCTION_DEPLOYMENT_REPORT.md`).

### To activate (steps for you)
1. Go to web3forms.com, create a free account, verify **`marketingnsales18@gmail.com`** as the destination inbox when creating the access key (updated per your latest instruction — set once, on their dashboard, not in code).
2. Copy the generated access key.
3. Replace `REPLACE_WITH_WEB3FORMS_ACCESS_KEY` in `assets/js/contact-form.js` with the real key, commit, and redeploy.
4. Optionally enable Web3Forms' built-in spam filtering / reCAPTCHA in their dashboard for extra protection beyond the honeypot already built in.

## Email routing decision
The form's actual submission destination is **`marketingnsales18@gmail.com`** — an internal routing address, not shown anywhere on the page. Per your explicit instruction, every email address visible on the frontend (`salesandproduction@video-sonic.com` in the footer/contact card, `technicaln@video-sonic.com` as the separate "Technical Support" line) stays exactly as displayed and unchanged; only what happens when a visitor clicks **Send Request** was rerouted. Neither displayed email is wired to the form itself — they remain informational/direct-contact options alongside it.

(Earlier version of this doc had the form routing to `salesandproduction@video-sonic.com` to match what's displayed — that's been superseded by this instruction. See git history for that reasoning if useful context.)

## Spam protection
- Honeypot field (`botcheck`, visually hidden via `.honeypot-field`, `tabindex="-1"`, `autocomplete="off"`) — bots that fill every field trip it; the JS silently drops the submission.
- Web3Forms' own dashboard offers additional spam filtering / optional reCAPTCHA once the account exists — not enabled yet since there's no account yet.

## Accessibility
Every field has a real `<label for>` association, the select uses native `<select>` (keyboard/screen-reader friendly), the status region is `aria-live="polite"`, and the whole form was verified to have no horizontal overflow at 375px width.
