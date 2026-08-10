# Contact Form Architecture

Implemented per Phase 4/5 approval: **Web3Forms**, client-side only, no backend to maintain.

## How it works
- `assets/js/contact-form.js` intercepts the `/contact/` page's `#quote-form` submit, validates required fields (`Name`, `Email`, `Message` — browser-native `required`), checks a hidden honeypot field, then POSTs a `FormData` payload to `https://api.web3forms.com/submit`.
- Success/error/sending states are shown in a `role="status" aria-live="polite"` element so screen readers announce them.
- All 11 requested fields are present: Name, Company, Email, Phone, Event Type (select), Event Date (date picker), Venue, Estimated Audience, Services Required (checkbox group, multi-select), Budget, Message.

## The access key — ACTIVATED
`assets/js/contact-form.js` now has a real Web3Forms access key (`5d6ee20b-fe98-4d8a-a40a-2fc9272978a2`), provided by the owner and set to deliver to `marketingnsales18@gmail.com`. Web3Forms' architecture treats this key as **public by design** — it's not a leaked secret, it's how the service is meant to work; the destination inbox was configured on Web3Forms' own dashboard when the key was generated, not by this code.

Verified working with a live test submission (not just a code review): dispatched a real submit through the deployed form, got back `{"success": true}` from `https://api.web3forms.com/submit`, and the page showed the success state ("Thank you — your inquiry has been sent..."), no console errors. A test email should have arrived at `marketingnsales18@gmail.com` — worth a quick spot-check.

### Optional next step
Enable Web3Forms' built-in spam filtering in their dashboard, on top of the honeypot and reCAPTCHA already built in (see below).

## Email routing decision
The form's actual submission destination is **`marketingnsales18@gmail.com`** — an internal routing address, not shown anywhere on the page. Per your explicit instruction, every email address visible on the frontend (`salesandproduction@video-sonic.com` in the footer/contact card, `technicaln@video-sonic.com` as the separate "Technical Support" line) stays exactly as displayed and unchanged; only what happens when a visitor clicks **Send Request** was rerouted. Neither displayed email is wired to the form itself — they remain informational/direct-contact options alongside it.

(Earlier version of this doc had the form routing to `salesandproduction@video-sonic.com` to match what's displayed — that's been superseded by this instruction. See git history for that reasoning if useful context.)

## Spam protection

### Honeypot (active)
`botcheck`, visually hidden via `.honeypot-field`, `tabindex="-1"`, `autocomplete="off"` — bots that fill every field trip it; the JS silently drops the submission.

### reCAPTCHA v2 — built, not yet activated
`assets/js/recaptcha.js` implements a Google reCAPTCHA v2 ("I'm not a robot" checkbox) widget in the form, but is currently **dormant**:
```js
var RECAPTCHA_SITE_KEY = 'REPLACE_WITH_RECAPTCHA_SITE_KEY';
```
With that placeholder in place, no widget renders, no external Google script loads, and `contact-form.js` skips the reCAPTCHA check entirely — the form keeps working exactly as it did before (honeypot only). Verified: with the placeholder key, `window.__recaptchaActive` is `false`, the `#recaptcha-container` div stays empty, and a full test submission still succeeds.

**I cannot generate the site key myself** — it requires your Google account. To activate:
1. Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin), create a new site, choose **reCAPTCHA v2 → "I'm not a robot" Checkbox**, and add the domain `video-sonic.com` (and `www.video-sonic.com`).
2. You'll get two keys: a **site key** (public) and a **secret key** (private).
3. Enter the **secret key** into your Web3Forms dashboard settings (this is what actually validates the captcha server-side when a submission comes in — Web3Forms supports this natively).
4. Give me the **site key** — I'll drop it into `assets/js/recaptcha.js`, verify the widget renders and blocks empty-captcha submissions, and deploy.

Once active: the widget renders inside the form, a submission is blocked client-side with an inline error until the checkbox is completed, and the token resets automatically after a successful or failed submission so the visitor can retry.

## Accessibility
Every field has a real `<label for>` association, the select uses native `<select>` (keyboard/screen-reader friendly), the status region is `aria-live="polite"`, and the whole form was verified to have no horizontal overflow at 375px width.
