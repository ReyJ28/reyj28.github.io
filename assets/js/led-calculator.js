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
    // 'custom' is resolved from user-supplied width/height at call time.
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

  function resolveAspectRatio(screenShape, customRatio) {
    if (screenShape === 'custom' && customRatio && customRatio > 0) {
      return customRatio;
    }
    return ASPECT_RATIOS[screenShape] || ASPECT_RATIOS['16:9'];
  }

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
   * @param {number} [input.customAspectRatio] - width/height, required if screenShape === 'custom'
   * @param {Object} [equipmentData] - from data/led-equipment.json
   * @returns {Object} result
   */
  function calculate(input, equipmentData) {
    var errors = [];

    var distance = Number(input.viewingDistanceM);
    var audience = Number(input.audienceSize);

    if (!isFinite(distance) || distance <= 0) {
      errors.push('Enter a viewing distance greater than 0.');
    }
    if (!isFinite(audience) || audience < 0) {
      errors.push('Enter a valid audience size.');
    }
    if (input.screenShape === 'custom' && (!input.customAspectRatio || input.customAspectRatio <= 0)) {
      errors.push('Enter a valid custom aspect ratio (e.g. width ÷ height).');
    }
    if (!CONTENT_FACTORS[input.contentType]) {
      errors.push('Select a content type.');
    }

    if (errors.length) {
      return { valid: false, errors: errors };
    }

    var distanceClamped = clamp(distance, MIN_DISTANCE_M, MAX_DISTANCE_M);
    var outOfRange = distanceClamped !== distance;

    var contentFactor = CONTENT_FACTORS[input.contentType].factor;
    var rawHeight = distanceClamped / contentFactor;
    var heightM = round(clamp(rawHeight, MIN_HEIGHT_M, MAX_HEIGHT_M), ROUNDING_INCREMENT_M);

    var aspectRatio = resolveAspectRatio(input.screenShape, input.customAspectRatio);
    var widthM = round(heightM * aspectRatio, ROUNDING_INCREMENT_M);

    var widthFloor = audienceWidthFloorM(audience);
    var audienceAdjusted = false;
    if (widthFloor > widthM) {
      widthM = round(widthFloor, ROUNDING_INCREMENT_M);
      heightM = round(widthM / aspectRatio, ROUNDING_INCREMENT_M);
      audienceAdjusted = true;
    }

    var areaM2 = Math.round(widthM * heightM * 100) / 100;

    // Pixel pitch: only ever computed if verified equipment data is
    // supplied and marked verified -- otherwise always the honest
    // "to be confirmed" message. See data/led-equipment.json.
    var pixelPitch = {
      verified: false,
      label: 'To be confirmed based on venue and viewing distance',
      category: null,
    };
    if (equipmentData && equipmentData.verified && Array.isArray(equipmentData.pixelPitchOptions) && equipmentData.pixelPitchOptions.length) {
      var suitable = equipmentData.pixelPitchOptions.filter(function (opt) {
        return distanceClamped >= (opt.minViewingDistanceM || 0);
      });
      if (suitable.length) {
        var best = suitable.reduce(function (a, b) { return (a.pitchMm < b.pitchMm ? a : b); });
        pixelPitch = { verified: true, label: best.pitchMm + 'mm pixel pitch (' + best.name + ')', category: best.name };
      }
    }

    return {
      valid: true,
      widthM: widthM,
      heightM: heightM,
      areaM2: areaM2,
      aspectRatioLabel: input.screenShape === 'custom' ? widthM.toFixed(2) + ':' + heightM.toFixed(2) : input.screenShape,
      aspectRatioDecimal: aspectRatio,
      pixelPitch: pixelPitch,
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
  };
})();
