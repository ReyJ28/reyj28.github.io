// Builds the <head> snippet for GA4 + Google Search Console verification,
// read from data/analytics-config.json. Pure function, no side effects --
// used by _build/gen.js for the 21 generated pages, and by
// _build/apply-analytics-head.js to keep the 3 hand-authored pages
// (index.html, led-wall/index.html, 404.html) in sync.
//
// Contract: if a value isn't configured, nothing for it is emitted. No
// fake measurement ID, no empty verification tag, no placeholder script
// pointed at an invalid ID.
const fs = require('fs');
const path = require('path');

function loadAnalyticsConfig() {
  const configPath = path.join(__dirname, '..', 'data', 'analytics-config.json');
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return {
      GA4_MEASUREMENT_ID: (raw.GA4_MEASUREMENT_ID || '').trim(),
      GOOGLE_SITE_VERIFICATION: (raw.GOOGLE_SITE_VERIFICATION || '').trim(),
    };
  } catch (e) {
    return { GA4_MEASUREMENT_ID: '', GOOGLE_SITE_VERIFICATION: '' };
  }
}

function buildAnalyticsHead(config) {
  config = config || loadAnalyticsConfig();
  var parts = [];

  if (config.GOOGLE_SITE_VERIFICATION) {
    parts.push('<meta name="google-site-verification" content="' + config.GOOGLE_SITE_VERIFICATION + '">');
  }

  // Only a well-formed GA4 ID (starts with "G-") triggers the tag. This
  // guards against an accidental placeholder-looking value ever causing a
  // script tag pointed at garbage.
  if (config.GA4_MEASUREMENT_ID && /^G-[A-Z0-9]+$/i.test(config.GA4_MEASUREMENT_ID)) {
    var id = config.GA4_MEASUREMENT_ID;
    parts.push(
      '<script async src="https://www.googletagmanager.com/gtag/js?id=' + id + '"></script>\n' +
      '<script>\n' +
      "  window.dataLayer = window.dataLayer || [];\n" +
      "  function gtag(){dataLayer.push(arguments);}\n" +
      "  gtag('js', new Date());\n" +
      "  gtag('config', '" + id + "');\n" +
      '</script>'
    );
  }

  return parts.join('\n');
}

module.exports = { buildAnalyticsHead, loadAnalyticsConfig };
