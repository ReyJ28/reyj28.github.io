// LED Wall Size Calculator -- pure calculation module.
//
// This module contains ONLY the estimation logic. It has no DOM
// dependencies and renders nothing -- see assets/js/size-guide.js for the
// page UI that calls into this. Keeping the two separate means the math
// can be tested/adjusted without touching markup, and vice versa.
//
// IMPORTANT: this produces a PLANNING ESTIMATE, not an engineering
// specification. The formulas below are VideoSonic's own general-purpose
// sizing heuristic (loosely based on common AV-industry "viewing distance
// vs. screen height" planning ratios), not a claim about any certified
// standard, and not a claim about specific VideoSonic equipment. Pixel
// pitch is intentionally NOT computed as a number -- see
// data/led-equipment.json: until real, verified VideoSonic pixel-pitch
// inventory is supplied there, this always returns the "to be confirmed"
// message rather than inventing a spec.
window.LEDCalculator = (function () {
  'use strict';

  // Height = viewingDistanceMeters / CONTENT_FACTOR[contentType].
  // A smaller factor recommends a larger screen for the same distance
  // (content that needs more visual detail, read up close, sized bigger).
  var CONTENT_FACTORS = {
    'presentations-text': { factor: 6, label: 'Presentations / Text' },
    'graphics': { factor: 7, label: 'Graphics' },
    'mixed': { factor: 8, label: 'Mixed Content' },
    'video': { factor: 9, label: 'Video' },
    'live-camera': { factor: 10, label: 'Live Camera' },
  };

  var ASPECT_RATIOS = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    'ultra-wide': 21 / 9,
    // 'custom' isn't in this map -- it means the caller supplied an actual
    // placement size in feet (customWidthFt/customHeightFt), not a ratio.
  };

  // Rounding increment for the estimate (meters), matched to VideoSonic's
  // verified standard LED cabinet module size (0.5m x 0.5m) -- real walls
  // are built from a whole number of these, so results are snapped to the
  // same grid rather than an arbitrary planning increment.
  var ROUNDING_INCREMENT_M = 0.5;

  // Sane bounds so extreme inputs don't produce a nonsensical result.
  var MIN_HEIGHT_M = 1.0;
  var MAX_HEIGHT_M = 12.0;
  var MIN_DISTANCE_M = 1;
  var MAX_DISTANCE_M = 200;

  // ---------------------------------------------------------------------
  // GENERAL PLANNING ASSUMPTIONS (NOT VideoSonic hardware specs)
  // ---------------------------------------------------------------------
  // Per-panel weight/power/cost below are typical mid-range values for a
  // 500x500mm indoor cabinet, used only to give a rough planning figure.
  // They are labelled as general industry assumptions everywhere they are
  // shown and are NOT a spec sheet for VideoSonic's actual panels. Real
  // figures depend on the confirmed product and must come from the
  // technical team. Grouped here so they are easy to tune in one place.
  var PANEL_SIZE_MM = 500;                 // 0.5m cabinet, matches ROUNDING_INCREMENT_M
  var PANEL_MAX_WATTS = 260;               // general assumption, max draw
  var PANEL_AVG_WATTS = 120;               // general assumption, average draw
  var PANEL_WEIGHT_KG = 8.5;               // general assumption, per cabinet
  var PANEL_COST_USD = 305;                // general assumption, hardware only, indicative

  // Electrical basis: a branch circuit at the selected supply voltage, with a
  // 20A breaker and an 80% continuous-load safety margin. Supply voltage
  // varies by region -- 120V in the US/Canada, 220-240V across most of
  // Asia/Europe including the Philippines -- so it is a user-selectable input.
  // 220V is the default.
  var DEFAULT_VOLTAGE = 220;
  var CIRCUIT_BREAKER_A = 20;
  var CIRCUIT_DERATE = 0.8;                // continuous-load safety margin

  var KG_TO_LB = 2.20462;

  // Power distribution for a panel count at a chosen supply voltage. Watts (and
  // therefore kW) are voltage-independent; voltage changes the current draw and
  // how many panels fit on one 20A circuit. Exposed so the UI can recompute
  // live when the user switches region/voltage without recalculating the wall.
  function powerPlan(totalPanels, opts) {
    var voltage = (opts && Number(opts.voltage)) || DEFAULT_VOLTAGE;
    var breakerA = (opts && Number(opts.breakerA)) || CIRCUIT_BREAKER_A;
    var continuousA = breakerA * CIRCUIT_DERATE;
    var continuousW = voltage * continuousA;
    var maxWatts = totalPanels * PANEL_MAX_WATTS;
    var avgWatts = totalPanels * PANEL_AVG_WATTS;
    var panelsPerCircuit = Math.max(1, Math.floor(continuousW / PANEL_MAX_WATTS));
    return {
      voltage: voltage,
      breakerA: breakerA,
      continuousA: Math.round(continuousA * 10) / 10,
      maxWatts: maxWatts,
      avgWatts: avgWatts,
      maxKw: Math.round(maxWatts / 1000 * 100) / 100,
      avgKw: Math.round(avgWatts / 1000 * 100) / 100,
      maxCurrentA: Math.round(maxWatts / voltage * 10) / 10,
      panelsPerCircuit: panelsPerCircuit,
      circuits: Math.ceil(totalPanels / panelsPerCircuit),
      perPanel: { maxWatts: PANEL_MAX_WATTS, avgWatts: PANEL_AVG_WATTS },
    };
  }

  // Builds the derived technical spec set shown in the left "Wall" panel and
  // used by the power-distribution plan. pitchMm may be null when no verified
  // pixel pitch applies -- pixel-derived fields then come back null (honest),
  // never invented.
  function buildSpecs(dims) {
    var totalPanels = dims.panelsWide * dims.panelsHigh;

    var panelPxAxis = dims.pitchMm ? Math.round(PANEL_SIZE_MM / dims.pitchMm) : null;
    var resW = panelPxAxis ? dims.panelsWide * panelPxAxis : null;
    var resH = panelPxAxis ? dims.panelsHigh * panelPxAxis : null;
    var totalPixels = (resW && resH) ? resW * resH : null;

    var weightKg = totalPanels * PANEL_WEIGHT_KG;

    // Power/current/circuits are computed by powerPlan (voltage-dependent) at
    // render time so the region selector can change them without recalculating.
    return {
      totalPanels: totalPanels,
      panelPxAxis: panelPxAxis,
      resW: resW,
      resH: resH,
      totalPixels: totalPixels,
      weightKg: Math.round(weightKg * 10) / 10,
      weightLb: Math.round(weightKg * KG_TO_LB * 10) / 10,
      costUsd: Math.round(totalPanels * PANEL_COST_USD),
      perPanelWeightKg: PANEL_WEIGHT_KG,
      perPanelCostUsd: PANEL_COST_USD,
    };
  }

  // Signal (data) patching: given the wall's total pixels and panel count and
  // a chosen controller brand/model, works out the minimum active data ports
  // and a daisy-chain routing figure. Port capacity is the published nominal
  // at 60Hz / 8-bit, scaled down for higher refresh or bit depth (bandwidth
  // scales roughly linearly with both). Returns null if inputs are missing.
  function signalPatching(opts, processors) {
    if (!opts || !opts.totalPixels || !opts.brandId || !opts.modelId || !processors) return null;
    var brand = (processors.brands || []).filter(function (b) { return b.id === opts.brandId; })[0];
    if (!brand) return null;
    var model = (brand.models || []).filter(function (m) { return m.id === opts.modelId; })[0];
    if (!model) return null;
    var cap = (processors.capacities || {})[brand.portType];
    if (!cap) return null;

    var refresh = Number(opts.refreshHz) || 60;
    var bitDepth = Number(opts.bitDepth) || 8;
    // Scale nominal (60Hz/8-bit) capacity by the extra bandwidth demanded.
    var scaledCapacity = Math.floor(cap.pixelsPerPort * (60 / refresh) * (8 / bitDepth));
    scaledCapacity = Math.max(1, scaledCapacity);

    var portsNeeded = Math.ceil(opts.totalPixels / scaledCapacity);
    var panelsPerRun = Math.ceil(opts.totalPanels / portsNeeded);
    var exceeded = portsNeeded > model.ports;

    return {
      brandName: brand.name,
      modelName: model.name,
      portType: brand.portType,
      portLabel: cap.portLabel,
      nominalCapacity: cap.pixelsPerPort,
      effectiveCapacity: scaledCapacity,
      scaled: scaledCapacity !== cap.pixelsPerPort,
      refreshHz: refresh,
      bitDepth: bitDepth,
      physicalPorts: model.ports,
      portsNeeded: portsNeeded,
      panelsPerRun: panelsPerRun,
      exceeded: exceeded,
    };
  }

  function round(value, increment) {
    return Math.round(value / increment) * increment;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Audience size doesn't independently set the screen's dimensions (that's
  // viewing distance + content), but a very large audience implies a wider
  // venue/footprint and typically benefits from a wider format for
  // sightline coverage -- so it nudges the *aspect choice/width floor*,
  // not the core height math.
  function audienceWidthFloorM(audienceSize) {
    if (audienceSize >= 5000) return 8;
    if (audienceSize >= 2000) return 6;
    if (audienceSize >= 1000) return 4.5;
    if (audienceSize >= 500) return 3;
    return 0; // no special floor for smaller audiences
  }

  function resolveAspectRatio(screenShape) {
    return ASPECT_RATIOS[screenShape] || ASPECT_RATIOS['16:9'];
  }

  var FEET_TO_METERS = 0.3048;

  function viewingSuitabilityText(distanceM, contentKey, heightM) {
    var contentLabel = (CONTENT_FACTORS[contentKey] || CONTENT_FACTORS.mixed).label;
    var idealHeight = distanceM / (CONTENT_FACTORS[contentKey] || CONTENT_FACTORS.mixed).factor;
    var ratio = heightM / idealHeight;
    if (ratio >= 0.9 && ratio <= 1.15) {
      return 'This size is well matched to ' + contentLabel.toLowerCase() + ' viewed from about ' + distanceM + 'm away.';
    }
    if (ratio < 0.9) {
      return 'For ' + contentLabel.toLowerCase() + ' at this distance, a slightly larger wall may read more comfortably for the furthest viewers.';
    }
    return 'This size comfortably exceeds typical requirements for ' + contentLabel.toLowerCase() + ' at this distance.';
  }

  /**
   * @param {Object} input
   * @param {string} input.eventType
   * @param {number} input.audienceSize
   * @param {number} input.viewingDistanceM
   * @param {string} input.contentType - key into CONTENT_FACTORS
   * @param {string} input.screenShape - '16:9' | '4:3' | 'ultra-wide' | 'custom'
   * @param {string} [input.customUnit] - 'feet' (default) | 'meters' — unit of the custom placement size
   * @param {number} [input.customWidth] - actual placement width (in customUnit), required if screenShape === 'custom'
   * @param {number} [input.customHeight] - actual placement height (in customUnit), required if screenShape === 'custom'
   * @param {number} [input.customWidthFt] - deprecated alias for customWidth in feet (backward compatibility)
   * @param {number} [input.customHeightFt] - deprecated alias for customHeight in feet (backward compatibility)
   * @param {Object} [equipmentData] - from data/led-equipment.json
   * @returns {Object} result
   */
  function calculate(input, equipmentData) {
    var errors = [];

    var distance = Number(input.viewingDistanceM);
    var audience = Number(input.audienceSize);
    var isCustomSize = input.screenShape === 'custom';

    // Custom placement size may be entered in feet (default) or meters.
    // customWidth/customHeight are the current field names; customWidthFt/
    // customHeightFt are kept as a feet-only fallback for older callers.
    var customUnit = input.customUnit === 'meters' ? 'meters' : 'feet';
    var unitLabel = customUnit === 'meters' ? 'meters' : 'feet';
    var customWidth = Number(input.customWidth != null ? input.customWidth : input.customWidthFt);
    var customHeight = Number(input.customHeight != null ? input.customHeight : input.customHeightFt);

    if (!isFinite(distance) || distance <= 0) {
      errors.push('Enter a viewing distance greater than 0.');
    }
    if (!isFinite(audience) || audience < 0) {
      errors.push('Enter a valid audience size.');
    }
    if (isCustomSize && (!(customWidth > 0))) {
      errors.push('Enter a valid placement width in ' + unitLabel + '.');
    }
    if (isCustomSize && (!(customHeight > 0))) {
      errors.push('Enter a valid placement height in ' + unitLabel + '.');
    }
    if (!CONTENT_FACTORS[input.contentType]) {
      errors.push('Select a content type.');
    }

    if (errors.length) {
      return { valid: false, errors: errors };
    }

    var distanceClamped = clamp(distance, MIN_DISTANCE_M, MAX_DISTANCE_M);
    var outOfRange = distanceClamped !== distance;

    var widthM, heightM, aspectRatio, audienceAdjusted = false;

    if (isCustomSize) {
      // "Custom" means the actual physical placement is already known
      // (a fixed stage backdrop, DJ booth, architectural opening, etc.) --
      // convert that directly to meters and snap to the cabinet grid,
      // rather than deriving a size from viewing distance/content. The
      // audience-driven width floor doesn't apply here either: a known
      // physical constraint overrides a general sightline heuristic.
      var toMeters = customUnit === 'meters' ? 1 : FEET_TO_METERS;
      widthM = round(customWidth * toMeters, ROUNDING_INCREMENT_M);
      heightM = round(customHeight * toMeters, ROUNDING_INCREMENT_M);
      widthM = Math.max(widthM, ROUNDING_INCREMENT_M);
      heightM = Math.max(heightM, ROUNDING_INCREMENT_M);
      aspectRatio = widthM / heightM;
    } else {
      var contentFactor = CONTENT_FACTORS[input.contentType].factor;
      var rawHeight = distanceClamped / contentFactor;
      heightM = round(clamp(rawHeight, MIN_HEIGHT_M, MAX_HEIGHT_M), ROUNDING_INCREMENT_M);

      aspectRatio = resolveAspectRatio(input.screenShape);
      widthM = round(heightM * aspectRatio, ROUNDING_INCREMENT_M);

      var widthFloor = audienceWidthFloorM(audience);
      if (widthFloor > widthM) {
        widthM = round(widthFloor, ROUNDING_INCREMENT_M);
        heightM = round(widthM / aspectRatio, ROUNDING_INCREMENT_M);
        audienceAdjusted = true;
      }
    }

    var areaM2 = Math.round(widthM * heightM * 100) / 100;
    var panelsWide = Math.round(widthM / ROUNDING_INCREMENT_M);
    var panelsHigh = Math.round(heightM / ROUNDING_INCREMENT_M);

    // Pixel pitch: only ever computed if verified equipment data is
    // supplied and marked verified -- otherwise always the honest
    // "to be confirmed" message. See data/led-equipment.json.
    var pixelPitch = {
      verified: false,
      label: 'To be confirmed based on venue and viewing distance',
      category: null,
    };
    var pitchMm = null;          // numeric pitch, for pixel-count specs
    var minViewDistanceM = null; // manufacturer/verified minimum for that pitch
    if (equipmentData && equipmentData.verified && Array.isArray(equipmentData.pixelPitchOptions) && equipmentData.pixelPitchOptions.length) {
      var suitable = equipmentData.pixelPitchOptions.filter(function (opt) {
        return distanceClamped >= (opt.minViewingDistanceM || 0);
      });
      if (suitable.length) {
        var best = suitable.reduce(function (a, b) { return (a.pitchMm < b.pitchMm ? a : b); });
        pixelPitch = { verified: true, label: best.pitchMm + 'mm pixel pitch (' + best.name + ')', category: best.name };
        pitchMm = best.pitchMm;
        minViewDistanceM = best.minViewingDistanceM || null;
      }
    }

    var specs = buildSpecs({
      panelsWide: panelsWide,
      panelsHigh: panelsHigh,
      pitchMm: pitchMm,
    });

    // Standard configuration: if a verified, ready-built VideoSonic
    // configuration exists for the chosen aspect ratio, surface it as a
    // reference point alongside the estimate -- not a substitute for it.
    var standardConfig = null;
    if (equipmentData && equipmentData.verified && Array.isArray(equipmentData.pixelPitchOptions)) {
      standardConfig = equipmentData.pixelPitchOptions.find(function (opt) {
        return opt.aspectRatioLabel === input.screenShape && opt.widthM && opt.heightM;
      }) || null;
    }

    return {
      valid: true,
      widthM: widthM,
      heightM: heightM,
      areaM2: areaM2,
      panelsWide: panelsWide,
      panelsHigh: panelsHigh,
      isCustomSize: isCustomSize,
      aspectRatioLabel: isCustomSize ? 'Actual placement (' + widthM.toFixed(2) + ':' + heightM.toFixed(2) + ')' : input.screenShape,
      aspectRatioDecimal: aspectRatio,
      pixelPitch: pixelPitch,
      pitchMm: pitchMm,
      minViewDistanceM: minViewDistanceM,
      standardConfig: standardConfig,
      specs: specs,
      suitabilityText: viewingSuitabilityText(distanceClamped, input.contentType, heightM),
      audienceAdjusted: audienceAdjusted,
      outOfRange: outOfRange,
      distanceUsedM: distanceClamped,
    };
  }

  return {
    CONTENT_FACTORS: CONTENT_FACTORS,
    ASPECT_RATIOS: ASPECT_RATIOS,
    calculate: calculate,
    signalPatching: signalPatching,
    powerPlan: powerPlan,
  };
})();
