// UI wiring for /led-wall/size-guide/ -- reads the form, calls
// window.LEDCalculator (assets/js/led-calculator.js) for the actual math,
// and renders the result. No calculation logic lives in this file.
(function () {
  var form = document.getElementById('calc-form');
  if (!form) return;

  var audiencePreset = document.getElementById('calc-audience-preset');
  var audienceCustomWrap = document.getElementById('calc-audience-custom-wrap');
  var audienceCustom = document.getElementById('calc-audience-custom');
  var screenShape = document.getElementById('calc-screen-shape');
  var customRatioWrap = document.getElementById('calc-ratio-wrap');
  var ratioW = document.getElementById('calc-ratio-w');
  var ratioH = document.getElementById('calc-ratio-h');
  var errorsEl = document.getElementById('calc-errors');
  var resultEl = document.getElementById('calc-result');
  var equipmentData = null;

  fetch('/data/led-equipment.json').then(function (r) { return r.json(); }).then(function (d) { equipmentData = d; }).catch(function () {});

  function toggleAudienceCustom() {
    var isCustom = audiencePreset.value === 'custom';
    audienceCustomWrap.hidden = !isCustom;
    audienceCustom.required = isCustom;
  }
  function toggleCustomRatio() {
    var isCustom = screenShape.value === 'custom';
    customRatioWrap.hidden = !isCustom;
    ratioW.required = isCustom;
    ratioH.required = isCustom;
  }
  audiencePreset.addEventListener('change', toggleAudienceCustom);
  screenShape.addEventListener('change', toggleCustomRatio);
  toggleAudienceCustom();
  toggleCustomRatio();

  function getAudienceSize() {
    if (audiencePreset.value === 'custom') return Number(audienceCustom.value);
    return Number(audiencePreset.value);
  }

  function renderErrors(errors) {
    errorsEl.innerHTML = errors.map(function (e) { return '<li>' + e + '</li>'; }).join('');
    errorsEl.hidden = errors.length === 0;
    resultEl.hidden = true;
  }

  function renderResult(r, eventTypeLabel) {
    errorsEl.hidden = true;
    var notes = [];
    if (r.audienceAdjusted) {
      notes.push('Widened to suit your estimated audience size and typical sightline coverage for an event of this scale.');
    }
    if (r.outOfRange) {
      notes.push('Your viewing distance is unusually large or small for this quick estimate — for ' + eventTypeLabel.toLowerCase() + ' at this scale, please talk to our technical team directly for an accurate plan.');
    }

    resultEl.innerHTML =
      '<span class="eyebrow">Your Estimated LED Wall</span>' +
      '<div class="calc-result__dims">' + r.widthM.toFixed(2) + 'm × ' + r.heightM.toFixed(2) + 'm</div>' +
      '<p style="color:var(--text-muted);font-size:.85rem;margin-top:-10px">Sized in whole 0.5m × 0.5m LED cabinet units, matching VideoSonic\'s standard modular build.</p>' +
      '<div class="calc-result__meta">' +
        '<span class="tag">' + r.aspectRatioLabel + '</span>' +
        '<span class="tag">' + r.areaM2.toFixed(2) + ' m²</span>' +
        '<span class="tag">' + r.pixelPitch.label + '</span>' +
      '</div>' +
      '<p class="calc-result__suitability">Recommended for your estimated viewing conditions. ' + r.suitabilityText + '</p>' +
      (notes.length ? '<p class="calc-result__note placeholder">' + notes.join(' ') + '</p>' : '') +
      '<div class="calc-disclaimer">' +
        '<strong>Planning estimate only.</strong> LED wall size and pixel pitch recommendations depend on venue dimensions, viewing distance, content requirements, camera requirements, stage design and available equipment. Final specifications should be confirmed by the VideoSonic technical production team.' +
      '</div>' +
      '<div class="calc-cta">' +
        '<h3>Want an exact LED configuration?</h3>' +
        '<p>Send VideoSonic your event requirements and let the technical team prepare the appropriate configuration.</p>' +
        '<div class="hero__ctas">' +
          '<a class="btn btn-primary" href="/contact/">Request an LED Wall Quote</a>' +
          '<a class="btn btn-outline" href="https://wa.me/639278845028" target="_blank" rel="noopener">Talk to Our Technical Team</a>' +
        '</div>' +
      '</div>';
    resultEl.hidden = false;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      resultEl.scrollIntoView();
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var eventTypeSelect = document.getElementById('calc-event-type');
    var eventTypeLabel = eventTypeSelect.options[eventTypeSelect.selectedIndex].textContent;

    var input = {
      eventType: eventTypeSelect.value,
      audienceSize: getAudienceSize(),
      viewingDistanceM: document.getElementById('calc-distance').value,
      contentType: document.getElementById('calc-content-type').value,
      screenShape: screenShape.value,
      customAspectRatio: screenShape.value === 'custom' ? (Number(ratioW.value) / Number(ratioH.value)) : undefined,
    };

    var result = window.LEDCalculator.calculate(input, equipmentData);
    if (!result.valid) {
      renderErrors(result.errors);
      return;
    }
    renderResult(result, eventTypeLabel);
  });
})();
