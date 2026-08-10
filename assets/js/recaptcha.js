// Google reCAPTCHA v2 ("I'm not a robot" checkbox) for the /contact/ form.
//
// RECAPTCHA_SITE_KEY is the PUBLIC site key from
// https://www.google.com/recaptcha/admin -- safe to expose client-side by
// design (the matching SECRET key is entered into Web3Forms' dashboard,
// which does the actual server-side verification -- never put the secret
// key here or anywhere in this repo).
//
// Until a real site key is supplied, this script does nothing: no widget
// renders, no external Google script loads, and contact-form.js skips the
// reCAPTCHA check entirely so the form keeps working via the honeypot
// field alone. See CONTACT_FORM_ARCHITECTURE.md for activation steps.
(function () {
  var RECAPTCHA_SITE_KEY = '6LfpjX4tAAAAANvQs2tNC1HRBGgIu1NAvDc5em5U';
  var container = document.getElementById('recaptcha-container');
  if (!container) return;

  if (RECAPTCHA_SITE_KEY.indexOf('REPLACE_WITH') === 0) {
    window.__recaptchaActive = false;
    return;
  }

  window.__recaptchaActive = true;
  var widgetId = null;

  window.__onRecaptchaLoad = function () {
    widgetId = grecaptcha.render(container, { sitekey: RECAPTCHA_SITE_KEY });
  };
  window.__getRecaptchaResponse = function () {
    return widgetId !== null ? grecaptcha.getResponse(widgetId) : '';
  };
  window.__resetRecaptcha = function () {
    if (widgetId !== null) grecaptcha.reset(widgetId);
  };

  var s = document.createElement('script');
  s.src = 'https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();
