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
  var placementUnit = document.getElementById('calc-placement-unit');
  var widthFt = document.getElementById('calc-width-ft');
  var heightFt = document.getElementById('calc-height-ft');
  var errorsEl = document.getElementById('calc-errors');
  var resultEl = document.getElementById('calc-result');
  var equipmentData = null;
  var processorData = null;
  var lastResult = null; // kept so controller changes can re-patch without recalculating the wall
  var controllerState = { brandId: '', modelId: '', bitDepth: 8, refreshHz: 60, receivingCard: '', hdr: false, threeD: false };
  var track = window.VSAnalytics ? window.VSAnalytics.trackEvent : function () {};
  var CALC_NAME = 'led_wall_calculator';

  var M_TO_FT = 3.28084;

  fetch('/data/led-equipment.json').then(function (r) { return r.json(); }).then(function (d) { equipmentData = d; }).catch(function () {});
  fetch('/data/led-processors.json').then(function (r) { return r.json(); }).then(function (d) { processorData = d; }).catch(function () {});

  track('calculator_view', { calculator_name: CALC_NAME });
  var startTracked = false;
  form.addEventListener('focusin', function () {
    if (startTracked) return;
    startTracked = true;
    track('calculator_start', { calculator_name: CALC_NAME });
  });

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
  // Switches the custom placement-size fields between feet and meters by
  // giving a sensible placeholder for the selected unit. The unit itself is
  // shown by the Measurement Units selector; the conversion happens in the
  // calculator.
  function updatePlacementUnit() {
    var meters = placementUnit && placementUnit.value === 'meters';
    widthFt.placeholder = meters ? 'e.g. 6' : 'e.g. 20';
    heightFt.placeholder = meters ? 'e.g. 4' : 'e.g. 12';
  }
  audiencePreset.addEventListener('change', toggleAudienceCustom);
  screenShape.addEventListener('change', toggleCustomRatio);
  if (placementUnit) placementUnit.addEventListener('change', updatePlacementUnit);
  toggleAudienceCustom();
  toggleCustomRatio();
  updatePlacementUnit();

  function getAudienceSize() {
    if (audiencePreset.value === 'custom') return Number(audienceCustom.value);
    return Number(audiencePreset.value);
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function m2ft(m) { return Math.round(m * M_TO_FT * 10) / 10; }

  // Builds an SVG diagram of the estimated LED wall: one grid cell per
  // 0.5m cabinet panel (exactly matching panelsWide x panelsHigh from the
  // calculation), the VideoSonic logo centered on the wall, and a simple
  // human silhouette (average 1.7m height) standing beside it for scale.
  // Distinct, bright colours for the per-port signal runs (cycles if a very
  // large wall needs more ports than colours).
  var PORT_COLORS = ['#22d3ee', '#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#60a5fa', '#facc15', '#fb7185', '#4ade80', '#c084fc', '#38bdf8', '#fdba74'];

  // Row-major serpentine panel order (matches the horizontal daisy-chain shown
  // in NovaStar's port-config view): left->right on even rows, right->left on odd.
  function serpentineOrder(w, h) {
    var order = [];
    for (var row = 0; row < h; row++) {
      if (row % 2 === 0) { for (var c = 0; c < w; c++) order.push([c, row]); }
      else { for (var c2 = w - 1; c2 >= 0; c2--) order.push([c2, row]); }
    }
    return order;
  }

  // Splits the serpentine order into one data run per active port, each carrying
  // up to panelsPerRun panels. Returns per-run metadata (port #, colour, panels).
  function runChunks(r, sig) {
    if (!sig || !sig.panelsPerRun) return [];
    var order = serpentineOrder(r.panelsWide, r.panelsHigh);
    var per = sig.panelsPerRun;
    var runs = [];
    for (var k = 0; k * per < order.length; k++) {
      runs.push({ port: k + 1, color: PORT_COLORS[k % PORT_COLORS.length], panels: order.slice(k * per, (k + 1) * per) });
    }
    return runs;
  }

  // Small directional arrowhead ~60% along the segment from (x1,y1)->(x2,y2).
  function arrowHead(x1, y1, x2, y2, color) {
    var mx = x1 + (x2 - x1) * 0.6, my = y1 + (y2 - y1) * 0.6;
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var s = 4.5;
    var ax = mx + Math.cos(ang) * s, ay = my + Math.sin(ang) * s;
    var bx = mx + Math.cos(ang + 2.5) * s, by = my + Math.sin(ang + 2.5) * s;
    var cx = mx + Math.cos(ang - 2.5) * s, cy = my + Math.sin(ang - 2.5) * s;
    return '<polygon points="' + ax + ',' + ay + ' ' + bx + ',' + by + ' ' + cx + ',' + cy + '" fill="' + color + '"/>';
  }

  // Builds an SVG diagram of the estimated LED wall: one grid cell per 0.5m
  // cabinet panel, the VideoSonic logo, and a human silhouette for scale. When
  // a signal-patching result (sig) is passed, it also overlays the per-port
  // daisy-chain routing -- each data port a colour-coded serpentine path with
  // directional arrows, a numbered input marker, and per-panel port/sequence
  // labels -- mirroring a controller's port-config view.
  function buildWallDiagram(r, sig) {
    var SCALE = 60;          // svg units per meter
    var CELL = SCALE * 0.5;  // 30 units per 0.5m panel
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

    function center(col, row) { return [wallX + (col + 0.5) * CELL, wallY + (row + 0.5) * CELL]; }

    var runs = runChunks(r, sig);
    var hasSignal = runs.length > 0;
    var showLabels = hasSignal && (r.panelsWide * r.panelsHigh) <= 150;

    var gridLines = '';
    for (var col = 1; col < r.panelsWide; col++) {
      var gx = wallX + col * CELL;
      gridLines += '<line x1="' + gx + '" y1="' + wallY + '" x2="' + gx + '" y2="' + (wallY + wallH) + '" class="calc-diagram__grid"/>';
    }
    for (var row = 1; row < r.panelsHigh; row++) {
      var gy = wallY + row * CELL;
      gridLines += '<line x1="' + wallX + '" y1="' + gy + '" x2="' + (wallX + wallW) + '" y2="' + gy + '" class="calc-diagram__grid"/>';
    }

    // Per-port signal overlay: cell tint, routing polyline, arrows, labels, start marker.
    var tint = '', routes = '', labels = '', starts = '';
    if (hasSignal) {
      runs.forEach(function (run) {
        var pts = [];
        run.panels.forEach(function (p, i) {
          var cellX = wallX + p[0] * CELL, cellY = wallY + p[1] * CELL;
          tint += '<rect x="' + cellX + '" y="' + cellY + '" width="' + CELL + '" height="' + CELL + '" fill="' + run.color + '" opacity="0.18"/>';
          var ctr = center(p[0], p[1]);
          pts.push(ctr);
          if (showLabels) {
            labels += '<text x="' + ctr[0] + '" y="' + (ctr[1] - 1) + '" text-anchor="middle" font-size="8" font-weight="700" fill="' + run.color + '">P' + run.port + '</text>' +
              '<text x="' + ctr[0] + '" y="' + (ctr[1] + 8) + '" text-anchor="middle" font-size="7" fill="#cbd5e1">#' + (i + 1) + '</text>';
          }
        });
        routes += '<polyline points="' + pts.map(function (q) { return q[0] + ',' + q[1]; }).join(' ') + '" fill="none" stroke="' + run.color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.95"/>';
        for (var s = 0; s < pts.length - 1; s++) {
          routes += arrowHead(pts[s][0], pts[s][1], pts[s + 1][0], pts[s + 1][1], run.color);
        }
        var st = pts[0];
        starts += '<circle cx="' + st[0] + '" cy="' + st[1] + '" r="9" fill="' + run.color + '" stroke="#0a0a0d" stroke-width="1"/>' +
          '<text x="' + st[0] + '" y="' + (st[1] + 3.5) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#0a0a0d">' + run.port + '</text>';
      });
    }

    var logoAspect = 167 / 30;
    var logoW = Math.min(wallW * 0.42, wallH * logoAspect * 0.6);
    var logoH = logoW / logoAspect;
    var logoX = wallX + wallW / 2 - logoW / 2;
    var logoY = wallY + wallH / 2 - logoH / 2;
    var logoOpacity = hasSignal ? 0.18 : 1;

    var personTop = groundY - personH;
    var person = '<g class="calc-diagram__person" transform="translate(0,' + personTop + ')" opacity="' + (hasSignal ? 0.4 : 1) + '">' +
      '<circle cx="' + (personW * 0.5) + '" cy="' + (personH * 0.07) + '" r="' + (personH * 0.065) + '"/>' +
      '<rect x="' + (personW * 0.18) + '" y="' + (personH * 0.14) + '" width="' + (personW * 0.64) + '" height="' + (personH * 0.42) + '" rx="' + (personW * 0.22) + '"/>' +
      '<rect x="' + (personW * 0.2) + '" y="' + (personH * 0.55) + '" width="' + (personW * 0.26) + '" height="' + (personH * 0.45) + '" rx="' + (personW * 0.1) + '"/>' +
      '<rect x="' + (personW * 0.54) + '" y="' + (personH * 0.55) + '" width="' + (personW * 0.26) + '" height="' + (personH * 0.45) + '" rx="' + (personW * 0.1) + '"/>' +
      '</g>';

    var ariaExtra = hasSignal ? ', with ' + runs.length + ' colour-coded signal runs one per data port,' : '';

    return '' +
      '<svg viewBox="0 0 ' + canvasW + ' ' + (canvasH) + '" class="calc-diagram" role="img" aria-label="Diagram of the estimated ' +
        r.widthM.toFixed(2) + 'm by ' + r.heightM.toFixed(2) + 'm LED wall, ' + r.panelsWide + ' by ' + r.panelsHigh + ' panels' + ariaExtra +
        ' shown beside an average-height person for scale">' +
        (hasSignal ? person : '') +
        '<rect x="' + wallX + '" y="' + wallY + '" width="' + wallW + '" height="' + wallH + '" class="calc-diagram__wall"/>' +
        tint +
        gridLines +
        '<image href="/images/brand/logo.png" x="' + logoX + '" y="' + logoY + '" width="' + logoW + '" height="' + logoH + '" opacity="' + logoOpacity + '"/>' +
        routes + starts + labels +
        '<rect x="' + wallX + '" y="' + wallY + '" width="' + wallW + '" height="' + wallH + '" class="calc-diagram__wall-border"/>' +
        (hasSignal ? '' : person) +
        '<line x1="0" y1="' + groundY + '" x2="' + canvasW + '" y2="' + groundY + '" class="calc-diagram__ground"/>' +
      '</svg>' +
      '<p class="calc-diagram__caption">Grid shows each 0.5m × 0.5m panel (' + r.panelsWide + ' × ' + r.panelsHigh + ' = ' + (r.panelsWide * r.panelsHigh) + ' panels total).' +
        (hasSignal ? ' Coloured lines and arrows trace each data port’s daisy-chain; the numbered dot is the port input, #n is the panel order on that run.' : ' Silhouette is an average 1.7m adult, shown for scale only.') + '</p>';
  }

  // Colour legend listing each data port and how many panels it carries.
  function buildDiagramLegend(r, sig) {
    var runs = runChunks(r, sig);
    if (!runs.length) return '';
    var chips = runs.map(function (x) {
      return '<span class="calc-diagram__portchip"><span class="calc-diagram__portswatch" style="background:' + x.color + '"></span>Port ' + x.port + ' · ' + x.panels.length + ' panel' + (x.panels.length === 1 ? '' : 's') + '</span>';
    }).join('');
    return '<div class="calc-diagram__legend" aria-label="Signal routing per data port">' +
      '<span class="calc-diagram__legendhead">Signal flow — ' + runs.length + ' ' + esc(sig.portLabel) + ' run' + (runs.length === 1 ? '' : 's') + ' (~' + sig.panelsPerRun + ' panels each):</span>' + chips + '</div>';
  }

  function buildDiagramBlock(r, sig) {
    return buildWallDiagram(r, sig) + buildDiagramLegend(r, sig);
  }

  // ---- Left "Wall" spec panel -------------------------------------------
  function specRow(label, value, estimate) {
    return '<div class="calc-spec-row"><dt>' + esc(label) + (estimate ? ' <span class="calc-spec-est" title="General planning estimate, not a VideoSonic hardware spec">~</span>' : '') +
      '</dt><dd>' + value + '</dd></div>';
  }
  function buildSpecPanel(r) {
    var s = r.specs;
    var wallSize = r.widthM.toFixed(1) + ' × ' + r.heightM.toFixed(1) + ' m <span class="calc-spec-alt">(' + m2ft(r.widthM) + ' × ' + m2ft(r.heightM) + ' ft)</span>';
    var aspect = (r.aspectRatioDecimal ? r.aspectRatioDecimal.toFixed(2) : (r.widthM / r.heightM).toFixed(2)) + ':1';

    var rows = '';
    rows += specRow('Pixel Pitch', r.pitchMm ? (r.pitchMm + ' mm') : 'To be confirmed', false);
    rows += specRow('Wall Size', wallSize, false);
    rows += specRow('Layout', r.panelsWide + ' × ' + r.panelsHigh + ' panels', false);
    rows += specRow('Total Panels', fmt(s.totalPanels), false);
    rows += specRow('Wall Res.', (s.resW ? (s.resW + '×' + s.resH + ' px') : 'To be confirmed'), false);
    rows += specRow('Total Pixels', (s.totalPixels ? (fmt(s.totalPixels) + ' px') : 'To be confirmed'), false);
    rows += specRow('Aspect Ratio', aspect, false);
    if (r.minViewDistanceM) {
      rows += specRow('Min. Viewing Dist.', r.minViewDistanceM + ' m <span class="calc-spec-alt">(' + m2ft(r.minViewDistanceM) + ' ft)</span>', false);
    }
    rows += specRow('Wall Weight', fmt(s.weightKg) + ' kg <span class="calc-spec-alt">(' + fmt(s.weightLb) + ' lb)</span>', true);
    rows += specRow('Average Power', s.avgKw + ' kW', true);
    rows += specRow('Max Power', s.maxKw + ' kW', true);
    rows += specRow('Supply Voltage', s.circuitVoltage + ' V', true);
    rows += specRow('Max Current', s.maxCurrentA + ' A', true);
    rows += specRow('Circuits', s.circuits + ' @' + s.circuitContinuousA + 'A max each', true);
    rows += '<div class="calc-spec-row"><dt>Data Ports</dt><dd id="spec-ports">Select controller</dd></div>';
    rows += specRow('Est. Cost', '~$' + fmt(s.costUsd), true);

    return '<aside class="calc-specs" aria-label="Estimated wall specifications">' +
      '<div class="calc-specs__head"><span class="eyebrow">Wall</span></div>' +
      '<dl class="calc-specs__list">' + rows + '</dl>' +
      '<p class="calc-specs__note"><span class="calc-spec-est">~</span> General industry planning estimate for a typical 0.5m indoor cabinet — <strong>not</strong> a VideoSonic hardware spec or price quote. Power figures assume a US 120V / 20A (NEC) basis.</p>' +
      '</aside>';
  }

  // ---- Controller configuration -----------------------------------------
  function buildControllerConfig() {
    var brandOpts = '<option value="">Choose Brand</option>';
    (processorData && processorData.brands || []).forEach(function (b) {
      brandOpts += '<option value="' + esc(b.id) + '"' + (b.id === controllerState.brandId ? ' selected' : '') + '>' + esc(b.name) + '</option>';
    });

    return '<div class="calc-config">' +
      '<h3>LED Wall Controller</h3>' +
      '<div class="calc-config__grid">' +
        '<label for="calc-brand">Controller Brand' +
          '<select id="calc-brand" class="field">' + brandOpts + '</select></label>' +
        '<label for="calc-model">Controller Model' +
          '<select id="calc-model" class="field"><option value="">Choose Model</option></select></label>' +
        '<label for="calc-bitdepth">Bit Depth' +
          '<select id="calc-bitdepth" class="field">' +
            '<option value="8" selected>8-bit</option><option value="10">10-bit</option><option value="12">12-bit</option>' +
          '</select></label>' +
        '<label for="calc-refresh">Frame Rate' +
          '<select id="calc-refresh" class="field">' +
            '<option value="60" selected>60 Hz</option><option value="120">120 Hz</option><option value="144">144 Hz</option>' +
          '</select></label>' +
        '<label for="calc-recvcard">Receiving Card' +
          '<select id="calc-recvcard" class="field">' +
            '<option value="">Choose Receiving Card</option><option>NovaStar A8s</option><option>NovaStar A10s Pro</option><option>Colorlight i5A / i9A</option><option>Brompton R2 / R2+</option>' +
          '</select></label>' +
        '<fieldset class="calc-config__opts"><legend>Input Options</legend>' +
          '<label class="calc-check"><input type="checkbox" id="calc-hdr"> HDR</label>' +
          '<label class="calc-check"><input type="checkbox" id="calc-3d"> 3D</label>' +
        '</fieldset>' +
      '</div>' +
      '<p class="calc-config__note">Signal patching is calculated at the selected frame rate and bit depth. Port capacities are the published nominal at 60Hz / 8-bit.</p>' +
    '</div>';
  }

  function populateModels() {
    var modelSel = document.getElementById('calc-model');
    if (!modelSel) return;
    var brand = (processorData && processorData.brands || []).filter(function (b) { return b.id === controllerState.brandId; })[0];
    var opts = '<option value="">Choose Model</option>';
    if (brand) {
      brand.models.forEach(function (m) {
        opts += '<option value="' + esc(m.id) + '"' + (m.id === controllerState.modelId ? ' selected' : '') + '>' + esc(m.name) + ' (' + m.ports + ' ports)</option>';
      });
    }
    modelSel.innerHTML = opts;
  }

  // ---- Signal patching (updates on controller change) --------------------
  function redrawDiagram(sig) {
    var slot = document.getElementById('calc-diagram-slot');
    if (slot && lastResult) slot.innerHTML = buildDiagramBlock(lastResult, sig);
  }

  function renderSignalPatching() {
    var el = document.getElementById('calc-signal-plan');
    var portsCell = document.getElementById('spec-ports');
    if (!el || !lastResult) return;

    var sig = window.LEDCalculator.signalPatching({
      totalPixels: lastResult.specs.totalPixels,
      totalPanels: lastResult.specs.totalPanels,
      brandId: controllerState.brandId,
      modelId: controllerState.modelId,
      refreshHz: controllerState.refreshHz,
      bitDepth: controllerState.bitDepth,
    }, processorData);

    if (!sig) {
      el.className = 'calc-patch';
      el.innerHTML = '<h4>Section A — Signal Patching</h4>' +
        '<p class="calc-patch__prompt">Select a controller brand and model above to generate the data-port and daisy-chain plan.</p>';
      if (portsCell) portsCell.textContent = 'Select controller';
      redrawDiagram(null);
      return;
    }

    if (portsCell) portsCell.textContent = sig.portsNeeded + ' of ' + sig.physicalPorts + ' (' + sig.portLabel + ')';

    var capNote = sig.scaled
      ? 'Capacity scaled to ' + fmt(sig.effectiveCapacity) + ' px/port for ' + sig.refreshHz + 'Hz / ' + sig.bitDepth + '-bit (nominal ' + fmt(sig.nominalCapacity) + ' px/port at 60Hz/8-bit).'
      : fmt(sig.nominalCapacity) + ' px/port at 60Hz / 8-bit (' + sig.portLabel + ').';

    var warn = sig.exceeded
      ? '<div class="calc-patch__warn" role="alert"><strong>Processor capacity exceeded.</strong> This wall needs ' + sig.portsNeeded +
        ' active ports but the ' + esc(sig.brandName) + ' ' + esc(sig.modelName) + ' has only ' + sig.physicalPorts +
        '. Upgrade to a model with more ports, add a second processor, or reduce the frame rate / bit depth.</div>'
      : '';

    el.className = 'calc-patch' + (sig.exceeded ? ' calc-patch--warn' : '');
    el.innerHTML =
      '<h4>Section A — Signal Patching</h4>' +
      '<div class="calc-patch__stats">' +
        '<div class="calc-patch__stat"><span class="calc-patch__num">' + sig.portsNeeded + '</span><span class="calc-patch__lbl">active ports needed</span></div>' +
        '<div class="calc-patch__stat"><span class="calc-patch__num">' + sig.physicalPorts + '</span><span class="calc-patch__lbl">ports on ' + esc(sig.modelName) + '</span></div>' +
        '<div class="calc-patch__stat"><span class="calc-patch__num">~' + sig.panelsPerRun + '</span><span class="calc-patch__lbl">panels per data run</span></div>' +
      '</div>' +
      '<p class="calc-patch__plan">Daisy-chain approximately <strong>' + sig.panelsPerRun + ' panels per ' + esc(sig.portLabel) + ' data line</strong> across ' + sig.portsNeeded + ' run' + (sig.portsNeeded === 1 ? '' : 's') + '.</p>' +
      '<p class="calc-patch__meta">' + capNote + '</p>' +
      warn;

    redrawDiagram(sig);
  }

  // ---- Power distribution (static from specs) ----------------------------
  function buildPowerPatching(r) {
    var s = r.specs;
    return '<div class="calc-patch">' +
      '<h4>Section B — Power Distribution <span class="calc-spec-est" title="General planning estimate">~</span></h4>' +
      '<div class="calc-patch__stats">' +
        '<div class="calc-patch__stat"><span class="calc-patch__num">' + s.maxKw + ' kW</span><span class="calc-patch__lbl">max load</span></div>' +
        '<div class="calc-patch__stat"><span class="calc-patch__num">' + s.avgKw + ' kW</span><span class="calc-patch__lbl">average load</span></div>' +
        '<div class="calc-patch__stat"><span class="calc-patch__num">' + s.circuits + '</span><span class="calc-patch__lbl">×' + s.circuitBreakerA + 'A / ' + s.circuitVoltage + 'V circuits</span></div>' +
      '</div>' +
      '<p class="calc-patch__plan">Link a maximum of <strong>' + s.panelsPerCircuit + ' panels per ' + s.circuitBreakerA + 'A (' + s.circuitVoltage + 'V) circuit loop</strong> — a total of <strong>' + s.circuits + ' dedicated circuits</strong> for this wall.</p>' +
      '<p class="calc-patch__meta">Assumes ' + s.perPanel.maxWatts + 'W max / ' + s.perPanel.avgWatts + 'W avg per 0.5m panel and the NEC 80% continuous-load rule (' + s.circuitBreakerA + 'A breaker → ' + s.circuitContinuousA + 'A continuous). General estimate on a US 120V basis — confirm the venue\'s actual supply with the technical team.</p>' +
    '</div>';
  }

  function wireControllerConfig() {
    var brandSel = document.getElementById('calc-brand');
    var modelSel = document.getElementById('calc-model');
    var bitSel = document.getElementById('calc-bitdepth');
    var refreshSel = document.getElementById('calc-refresh');
    var recvSel = document.getElementById('calc-recvcard');
    var hdr = document.getElementById('calc-hdr');
    var threeD = document.getElementById('calc-3d');
    if (!brandSel) return;

    populateModels();

    brandSel.addEventListener('change', function () {
      controllerState.brandId = brandSel.value;
      controllerState.modelId = '';
      populateModels();
      renderSignalPatching();
    });
    modelSel.addEventListener('change', function () {
      controllerState.modelId = modelSel.value;
      renderSignalPatching();
      if (modelSel.value) {
        track('calculator_controller_select', { calculator_name: CALC_NAME, brand: controllerState.brandId, model: controllerState.modelId });
      }
    });
    bitSel.addEventListener('change', function () { controllerState.bitDepth = Number(bitSel.value); renderSignalPatching(); });
    refreshSel.addEventListener('change', function () { controllerState.refreshHz = Number(refreshSel.value); renderSignalPatching(); });
    if (recvSel) recvSel.addEventListener('change', function () { controllerState.receivingCard = recvSel.value; });
    if (hdr) hdr.addEventListener('change', function () { controllerState.hdr = hdr.checked; });
    if (threeD) threeD.addEventListener('change', function () { controllerState.threeD = threeD.checked; });
  }

  function renderErrors(errors) {
    errorsEl.innerHTML = errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('');
    errorsEl.hidden = errors.length === 0;
    resultEl.hidden = true;
    if (errors.length) {
      track('calculator_error', { calculator_name: CALC_NAME, error_count: errors.length });
    }
  }

  function renderResult(r, eventTypeLabel) {
    errorsEl.hidden = true;
    lastResult = r;
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

    var main =
      '<div class="calc-main">' +
        '<span class="eyebrow">Your Estimated LED Wall</span>' +
        '<div class="calc-result__dims">' + r.widthM.toFixed(2) + 'm × ' + r.heightM.toFixed(2) + 'm <span class="calc-result__panels">= ' + r.panelsWide + ' panels × ' + r.panelsHigh + ' panels</span></div>' +
        '<p style="color:var(--text-muted);font-size:.85rem;margin-top:-10px">Based on 0.5m × 0.5m LED cabinet units, matching VideoSonic\'s standard modular build.</p>' +
        '<div class="calc-result__meta">' +
          '<span class="tag">' + esc(r.aspectRatioLabel) + '</span>' +
          '<span class="tag">' + r.areaM2.toFixed(2) + ' m²</span>' +
          '<span class="tag">' + esc(r.pixelPitch.label) + '</span>' +
        '</div>' +
        '<p class="calc-result__suitability">Recommended for your estimated viewing conditions. ' + esc(r.suitabilityText) + '</p>' +
        (notes.length ? '<p class="calc-result__note">' + notes.map(esc).join(' ') + '</p>' : '') +
        '<div class="calc-diagram-wrap" id="calc-diagram-slot">' + buildDiagramBlock(r, null) + '</div>' +
        buildControllerConfig() +
        '<div class="calc-patch-wrap">' +
          '<h3>Technical Patching Plan</h3>' +
          '<div class="calc-patch" id="calc-signal-plan"><h4>Section A — Signal Patching</h4><p class="calc-patch__prompt">Select a controller brand and model above to generate the data-port and daisy-chain plan.</p></div>' +
          buildPowerPatching(r) +
        '</div>' +
        '<div class="calc-disclaimer">' +
          '<strong>Planning estimate only.</strong> LED wall size, pixel pitch, power and signal figures depend on venue dimensions, viewing distance, content and camera requirements, stage design, the confirmed panel product and available equipment. Final specifications should be confirmed by the VideoSonic technical production team.' +
        '</div>' +
        '<div class="calc-cta">' +
          '<h3>Want an exact LED configuration?</h3>' +
          '<p>Send VideoSonic your event requirements and let the technical team prepare the appropriate configuration.</p>' +
          '<div class="hero__ctas">' +
            '<a class="btn btn-primary" data-calc-quote-cta href="/contact/">Request an LED Wall Quote</a>' +
            '<a class="btn btn-outline" data-calc-quote-cta href="https://wa.me/639278845028" target="_blank" rel="noopener">Talk to Our Technical Team</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    resultEl.innerHTML = '<div class="calc-layout">' + buildSpecPanel(r) + main + '</div>';
    resultEl.hidden = false;

    wireControllerConfig();
    renderSignalPatching();

    var quoteCtas = resultEl.querySelectorAll('[data-calc-quote-cta]');
    for (var i = 0; i < quoteCtas.length; i++) {
      quoteCtas[i].addEventListener('click', function (e) {
        track('calculator_quote_click', {
          calculator_name: CALC_NAME,
          destination: e.currentTarget.getAttribute('href'),
        });
      });
    }
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
      customUnit: placementUnit ? placementUnit.value : 'feet',
      customWidth: screenShape.value === 'custom' ? Number(widthFt.value) : undefined,
      customHeight: screenShape.value === 'custom' ? Number(heightFt.value) : undefined,
    };

    var result = window.LEDCalculator.calculate(input, equipmentData);
    if (!result.valid) {
      renderErrors(result.errors);
      return;
    }
    track('calculator_calculation_complete', {
      calculator_name: CALC_NAME,
      calculator_mode: screenShape.value === 'custom' ? 'custom_ratio' : 'preset_ratio',
      placement_unit: screenShape.value === 'custom' ? input.customUnit : undefined,
      content_type: input.contentType,
      aspect_ratio: result.aspectRatioLabel,
      pixel_pitch: result.pixelPitch && result.pixelPitch.label,
    });
    renderResult(result, eventTypeLabel);
  });
})();
