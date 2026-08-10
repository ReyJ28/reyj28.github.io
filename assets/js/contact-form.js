// Web3Forms integration for the /contact/ quote request form.
//
// WEB3FORMS_ACCESS_KEY is a PUBLIC client-side key by Web3Forms' own design --
// it is not a secret (Web3Forms' architecture explicitly expects this key to
// live in browser-visible HTML/JS; the actual destination inbox is configured
// on Web3Forms' own dashboard when the key is created, not by this code).
//
// SUBMISSION DESTINATION: marketingnsales18@gmail.com -- set this as the
// verified inbox when the access key is generated on web3forms.com. This is
// intentionally different from the emails shown on the page
// (salesandproduction@video-sonic.com / technicaln@video-sonic.com), which
// stay exactly as displayed; only the actual form submission target changes.
// See CONTACT_FORM_ARCHITECTURE.md for full detail and the activation steps.
//
// Until a real key is supplied, the placeholder below is intentionally
// invalid so the form fails safely with a clear message + fallback contact
// details, rather than silently pretending to work.
(function () {
  var WEB3FORMS_ACCESS_KEY = '5d6ee20b-fe98-4d8a-a40a-2fc9272978a2';

  var form = document.getElementById('quote-form');
  if (!form) return;
  var statusEl = document.getElementById('quote-form-status');
  var submitBtn = form.querySelector('[type="submit"]');

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'form-status' + (kind ? ' form-status--' + kind : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Honeypot: real users never fill this (it's visually hidden); bots often do.
    var honeypot = form.querySelector('[name="botcheck"]');
    if (honeypot && honeypot.checked) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (WEB3FORMS_ACCESS_KEY.indexOf('REPLACE_WITH') === 0) {
      setStatus(
        'This form isn’t connected yet. Please email salesandproduction@video-sonic.com or message us on WhatsApp at +63 927 884 5028 and we’ll follow up.',
        'error'
      );
      return;
    }

    var formData = new FormData(form);
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', 'New VideoSonic quote request');
    formData.append('from_name', 'VideoSonic website');

    submitBtn.disabled = true;
    setStatus('Sending your request…');

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (json.success) {
          setStatus('Thank you — your inquiry has been sent. We’ll follow up shortly.', 'success');
          form.reset();
        } else {
          throw new Error(json.message || 'Submission failed');
        }
      })
      .catch(function () {
        setStatus(
          'Something went wrong sending your inquiry. Please email salesandproduction@video-sonic.com directly.',
          'error'
        );
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
})();
