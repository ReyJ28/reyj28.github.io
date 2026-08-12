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
  var widthFt = document.getElementById('calc-width-ft');
  var heightFt = document.getElementById('calc-height-ft');
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
    widthFt.required = isCustom;
    heightFt.required = isCustom;
  }
  audiencePreset.addEventListener('change', toggleAudienceCustom);
  screenShape.addEventListener('change', toggleCustomRatio);
  toggleAudienceCustom();
  toggleCustomRatio();

  function getAudienceSize() {
    if (audiencePreset.value === 'custom') return Number(audienceCustom.value);
    return Number(audiencePreset.value);
  }

  // Builds an SVG diagram of the estimated LED wall: one grid cell per
  // 0.5m cabinet panel (exactly matching panelsWide x panelsHigh from the
  // calculation), the VideoSonic logo centered on the wall, and a simple
  // human silhouette (average 1.7m height) standing beside it for scale.
  function buildWallDiagram(r) {
    var SCALE = 60; // svg units per meter
    var PERSON_HEIGHT_M = 1.7;
    var wallW = r.widthM * SCALE;
    var wallH = r.heightM * SCALE;
    var personH = PERSON_HEIGHT_M * SCALE;
    var personW = personH * 0.28;

    var groundY = Math.max(wallH, personH);
    var canvasH = groundY + 14; // small floor margin
    var wallX = personW * 0.55; // person overlaps ~45% onto the wall's left edge
    var wallY = groundY - wallH;
    var canvasW = wallX + wallW + 14;

    var gridLines = '';
    for (var col = 1; col < r.panelsWide; col++) {
      var gx = wallX + col * SCALE * 0.5;
      gridLines += '<line x1="' + gx + '" y1="' + wallY + '" x2="' + gx + '" y2="' + (wallY + wallH) + '" class="calc-diagram__grid"/>';
    }
    for (var row = 1; row < r.panelsHigh; row++) {
      var gy = wallY + row * SCALE * 0.5;
      gridLines += '<line x1="' + wallX + '" y1="' + gy + '" x2="' + (wallX + wallW) + '" y2="' + gy + '" class="calc-diagram__grid"/>';
    }

    var logoAspect = 167 / 30;
    var logoW = Math.min(wallW * 0.42, wallH * logoAspect * 0.6);
    var logoH = logoW / logoAspect;
    var logoX = wallX + wallW / 2 - logoW / 2;
    var logoY = wallY + wallH / 2 - logoH / 2;

    var personX = 0;
    var personTop = groundY - personH;

    return '' +
      '<svg viewBox="0 0 ' + canvasW + ' ' + (canvasH) + '" class="calc-diagram" role="img" aria-label="Diagram of the estimated ' +
        r.widthM.toFixed(2) + 'm by ' + r.heightM.toFixed(2) + 'm LED wall, ' + r.panelsWide + ' by ' + r.panelsHigh +
        ' panels, shown beside an average-height person for scale">' +
        '<rect x="' + wallX + '" y="' + wallY + '" width="' + wallW + '" height="' + wallH + '" class="calc-diagram__wall"/>' +
        gridLines +
        '<image href="/images/brand/logo.png" x="' + logoX + '" y="' + logoY + '" width="' + logoW + '" height="' + logoH + '"/>' +
        '<rect x="' + wallX + '" y="' + wallY + '" width="' + wallW + '" height="' + wallH + '" class="calc-diagram__wall-border"/>' +
        '<g class="calc-diagram__person" transform="translate(' + personX + ',' + personTop + ')">' +
          '<circle cx="' + (personW * 0.5) + '" cy="' + (personH * 0.07) + '" r="' + (personH * 0.065) + '"/>' +
          '<rect x="' + (personW * 0.18) + '" y="' + (personH * 0.14) + '" width="' + (personW * 0.64) + '" height="' + (personH * 0.42) + '" rx="' + (personW * 0.22) + '"/>' +
          '<rect x="' + (personW * 0.2) + '" y="' + (personH * 0.55) + '" width="' + (personW * 0.26) + '" height="' + (personH * 0.45) + '" rx="' + (personW * 0.1) + '"/>' +
          '<rect x="' + (personW * 0.54) + '" y="' + (personH * 0.55) + '" width="' + (personW * 0.26) + '" height="' + (personH * 0.45) + '" rx="' + (personW * 0.1) + '"/>' +
        '</g>' +
        '<line x1="0" y1="' + groundY + '" x2="' + canvasW + '" y2="' + groundY + '" class="calc-diagram__ground"/>' +
      '</svg>' +
      '<p class="calc-diagram__caption">Grid shows each 0.5m × 0.5m panel (' + r.panelsWide + ' × ' + r.panelsHigh + ' = ' + (r.panelsWide * r.panelsHigh) + ' panels total). Silhouette is an average 1.7m adult, shown for scale only.</p>';
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
    if (r.standardConfig) {
      notes.push('For reference: VideoSonic\'s standard ' + r.standardConfig.aspectRatioLabel + ' configuration is ' + r.standardConfig.widthM.toFixed(1) + 'm × ' + r.standardConfig.heightM.toFixed(1) + 'm (' + r.standardConfig.cabinetsWide + '×' + r.standardConfig.cabinetsHigh + ' cabinets, ' + r.standardConfig.pitchMm + 'mm pixel pitch) — your estimate may be built up or down from this using the same cabinet modules.');
    }

    resultEl.innerHTML =
      '<span class="eyebrow">Your Estimated LED Wall</span>' +
      '<div class="calc-result__dims">' + r.widthM.toFixed(2) + 'm × ' + r.heightM.toFixed(2) + 'm <span class="calc-result__panels">= ' + r.panelsWide + ' panels × ' + r.panelsHigh + ' panels</span></div>' +
      '<p style="color:var(--text-muted);font-size:.85rem;margin-top:-10px">Based on 0.5m × 0.5m LED cabinet units, matching VideoSonic\'s standard modular build.</p>' +
      '<div class="calc-result__meta">' +
        '<span class="tag">' + r.aspectRatioLabel + '</span>' +
        '<span class="tag">' + r.areaM2.toFixed(2) + ' m²</span>' +
        '<span class="tag">' + r.pixelPitch.label + '</span>' +
      '</div>' +
      '<p class="calc-result__suitability">Recommended for your estimated viewing conditions. ' + r.suitabilityText + '</p>' +
      (notes.length ? '<p class="calc-result__note">' + notes.join(' ') + '</p>' : '') +
      '<div class="calc-diagram-wrap">' + buildWallDiagram(r) + '</div>' +
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
      customWidthFt: screenShape.value === 'custom' ? Number(widthFt.value) : undefined,
      customHeightFt: screenShape.value === 'custom' ? Number(heightFt.value) : undefined,
    };

    var result = window.LEDCalculator.calculate(input, equipmentData);
    if (!result.valid) {
      renderErrors(result.errors);
      return;
    }
    renderResult(result, eventTypeLabel);
  });
})();
