// Centralized analytics event tracking for VideoSonic.
//
// Single entry point for every GA4 event on the site -- no other file should
// call gtag() directly. Fails silently (no console errors, no throws) when
// GA4 isn't configured (data/analytics-config.json GA4_MEASUREMENT_ID empty),
// since _build/analytics-head.js then never emits the gtag.js snippet and
// window.gtag simply doesn't exist.
//
// PII guard: trackEvent() only forwards parameters on this explicit
// allowlist -- the full set of non-PII parameter names used anywhere in the
// site's event taxonomy (see ANALYTICS_EVENT_REFERENCE.md). Anything not
// listed here is dropped before the event reaches GA4. This fails closed
// (safe by default) rather than trying to pattern-match "looks like PII",
// which is what let a prior denylist-based version silently strip cta_name
// (a substring match on "name" caught cta_name/form_name/link_name too).
(function () {
  var ALLOWED_PARAMS = {
    cta_name: 1, cta_location: 1, destination: 1,
    location: 1, platform: 1,
    destination_domain: 1, link_name: 1,
    form_name: 1, form_location: 1,
    calculator_name: 1, calculator_mode: 1, calculator_step: 1,
    content_type: 1, aspect_ratio: 1, pixel_pitch: 1, error_count: 1,
    file_name: 1, file_type: 1,
  };

  function trackEvent(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    var clean = {};
    if (params) {
      for (var k in params) {
        if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
        if (!ALLOWED_PARAMS[k]) continue;
        clean[k] = params[k];
      }
    }
    try {
      window.gtag('event', eventName, clean);
    } catch (e) {
      // Never let analytics break the page.
    }
  }

  // Exposed for other scripts (contact-form.js, size-guide.js) to call directly.
  window.VSAnalytics = { trackEvent: trackEvent };

  // ---------------------------------------------------------------- delegated click tracking
  // One document-level listener classifies clicks by href / data attribute so
  // individual pages don't need per-element JS wiring for standard link types.
  var SOCIAL_ALLOW = ['facebook.com/videosonicph'];
  var EXTERNAL_ALLOW = ['videosonic-erp-web.vercel.app', 'docs.google.com'];

  function locationOf(el) {
    return el.getAttribute('data-cta-location') || document.body.getAttribute('data-page') || location.pathname;
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('a[href]');
    if (!el) return;
    var href = el.getAttribute('href') || '';

    if (href.indexOf('wa.me/') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
      trackEvent('phone_click', { location: locationOf(el) });
    } else if (href.indexOf('mailto:') === 0) {
      trackEvent('email_click', { location: locationOf(el) });
    } else if (SOCIAL_ALLOW.some(function (d) { return href.indexOf(d) !== -1; })) {
      trackEvent('social_click', { platform: 'facebook', location: locationOf(el) });
    } else if (/^https?:\/\//.test(href)) {
      var isInternal = href.indexOf('video-sonic.com') !== -1;
      if (!isInternal) {
        var matchedDomain = EXTERNAL_ALLOW.filter(function (d) { return href.indexOf(d) !== -1; })[0];
        if (matchedDomain) {
          trackEvent('external_link_click', {
            destination_domain: matchedDomain,
            link_name: (el.textContent || '').trim().slice(0, 100),
            location: locationOf(el),
          });
        }
      }
    }

    // Semantic CTA tracking -- fires alongside any of the above if the
    // element also carries data-cta-name (nav/footer/hero/cta-band buttons).
    var ctaName = el.getAttribute('data-cta-name');
    if (ctaName) {
      trackEvent('cta_click', {
        cta_name: ctaName,
        cta_location: locationOf(el),
        destination: href,
      });
    }
  });
})();
