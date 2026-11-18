/* ============================================================
   Lumi Alert — savings model
   Transparent, editable, and deliberately conservative.
   ========================================================== */
(function () {
  'use strict';
  var root = document.getElementById('savings');
  if (!root) return;

  var $ = function (id) { return document.getElementById(id); };

  /* --- assumption tables (documented in the UI) --- */
  var FAIL = { led: 0.04, mixed: 0.08, legacy: 0.14 };       // service events / fixture / yr
  var FT_HINT = {
    led: 'Modern LED fleet — roughly 4% of fixtures need service in a year.',
    mixed: 'Mixed LED and legacy — about 8% of fixtures need service in a year.',
    legacy: 'HID, halide or sodium — around 14% of fixtures need service in a year.'
  };
  var METHOD = {
    patrol:    { patrolMult: 1.00, darkDays: 19, adminMin: 12, rolls: 1.45, label: 'night patrols' },
    complaint: { patrolMult: 0.15, darkDays: 34, adminMin: 35, rolls: 1.60, label: 'complaint calls' },
    mixed:     { patrolMult: 0.55, darkDays: 26, adminMin: 22, rolls: 1.50, label: 'patrols and complaints' }
  };
  var METHOD_HINT = {
    patrol: 'A crew drives the grid on a route to spot dark lamps.',
    complaint: 'You hear about a dark lamp when a resident, tenant or staff member reports it.',
    mixed: 'Occasional sweeps, plus whatever gets reported in between.'
  };
  var SEG = {
    city:       { nightHrs: 11.0, rollMult: 1.00, label: 'city' },
    school:     { nightHrs: 10.0, rollMult: 0.92, label: 'campus' },
    commercial: { nightHrs: 12.0, rollMult: 0.88, label: 'commercial property' },
    industrial: { nightHrs: 13.5, rollMult: 1.12, label: 'industrial site' }
  };

  // volume pricing: the per-fixture figure drops as the fleet grows
  function tierPrice(n) {
    if (n < 2000) return 9;
    if (n < 10000) return 7.5;
    if (n < 25000) return 6.25;
    return 5.5;
  }
  var unitEdited = false;

  var LUMI_DARK_DAYS = 0.4;     // report in minutes; repair scheduled next cycle
  var PATROL_CUT     = 0.92;    // patrol hours no longer needed
  var ROLLS_LUMI     = 0.8;     // pre-diagnosed failures batched into one route
  var WASTE_FRACTION = 0.45;    // power a failing/failed fixture still draws
  var LUMI_ADMIN_MIN = 4;       // auto-generated work order

  var state = { seg: 'city', method: 'patrol', ft: 'led' };

  var money = function (n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  };
  var moneyShort = function (n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(n >= 10000000 ? 0 : 1) + 'M';
    if (n >= 10000) return '$' + Math.round(n / 1000) + 'k';
    return '$' + Math.round(n).toLocaleString('en-US');
  };

  function num(id, fallback) {
    var v = parseFloat($(id).value);
    return isFinite(v) && v > 0 ? v : fallback;
  }

  function compute() {
    var N = parseInt($('fixtures').value, 10);
    var m = METHOD[state.method], s = SEG[state.seg];
    var laborRate = num('laborRate', 48);
    var rollCost  = num('rollCost', 185) * s.rollMult;
    var kwhRate   = num('kwhRate', 0.16);
    var watt      = num('watt', 95);
    var vehRate   = parseFloat($('vehRate').value);
    if (!isFinite(vehRate) || vehRate < 0) vehRate = 22;
    var patrolHrs = parseFloat($('patrolHrs').value);
    if (!isFinite(patrolHrs) || patrolHrs < 0) patrolHrs = 12;
    if (!unitEdited) $('unitCost').value = tierPrice(N);
    var unitCost  = num('unitCost', tierPrice(N));

    var failures = N * FAIL[state.ft];

    // 1. detection labor
    var patrolHoursYr = patrolHrs * (N / 1000) * 12 * m.patrolMult;
    var patrolToday = patrolHoursYr * (laborRate + vehRate);   // crew + vehicle
    var laborSave = patrolToday * PATROL_CUT;

    // 2. truck rolls
    var rollsToday = failures * m.rolls * rollCost;
    var rollsLumi  = failures * ROLLS_LUMI * rollCost;
    var rollSave = rollsToday - rollsLumi;

    // 3. wasted energy while a fixture fails unnoticed
    var darkDelta = Math.max(0, m.darkDays - LUMI_DARK_DAYS);
    var kwhWasted = failures * darkDelta * s.nightHrs * (watt / 1000) * WASTE_FRACTION;
    var energyToday = failures * m.darkDays * s.nightHrs * (watt / 1000) * WASTE_FRACTION * kwhRate;
    var energySave = kwhWasted * kwhRate;

    // 4. complaint intake, triage and dispatch paperwork
    var adminToday = failures * (m.adminMin / 60) * laborRate;
    var adminSave = failures * ((m.adminMin - LUMI_ADMIN_MIN) / 60) * laborRate;
    if (adminSave < 0) adminSave = 0;

    var gross = laborSave + rollSave + energySave + adminSave;
    var cost = N * unitCost;
    var net = gross - cost;

    var todayTotal = patrolToday + rollsToday + energyToday + adminToday;
    var afterTotal = Math.max(0, todayTotal - gross) + cost;

    return {
      N: N, failures: failures,
      laborSave: laborSave, rollSave: rollSave, energySave: energySave,
      adminSave: adminSave, gross: gross, cost: cost, net: net,
      roi: cost > 0 ? (net / cost) * 100 : 0,
      payback: gross > 0 ? Math.max(0.5, (cost / gross) * 12) : 0,
      darkNights: failures * darkDelta,
      kwhWasted: kwhWasted,
      todayTotal: todayTotal, afterTotal: afterTotal,
      patrolHoursYr: patrolHoursYr,
      methodLabel: m.label, segLabel: s.label, rollsCut: Math.max(0, m.rolls - ROLLS_LUMI)
    };
  }

  function render() {
    var r = compute();

    $('fixturesVal').textContent = r.N.toLocaleString('en-US');
    var fx = $('fixtures');
    var p = ((fx.value - fx.min) / (fx.max - fx.min)) * 100;
    fx.style.setProperty('--p', p + '%');

    $('netSave').textContent = r.net >= 0 ? money(r.net) : '–' + money(Math.abs(r.net));
    $('rLabor').textContent = money(r.laborSave);
    $('rRolls').textContent = money(r.rollSave);
    $('rEnergy').textContent = money(r.energySave);
    $('rAdmin').textContent = money(r.adminSave);
    $('rCost').textContent = '–' + money(r.cost);
    $('rRoi').textContent = (r.roi >= 0 ? '' : '–') + Math.round(Math.abs(r.roi)) + '%';
    $('rPayback').textContent = r.payback > 0 && r.payback < 60
      ? (r.payback < 1.5 ? '<2 mo' : Math.round(r.payback) + ' mo') : '—';
    $('rDark').textContent = Math.round(r.darkNights).toLocaleString('en-US');
    $('unitHint').textContent = unitEdited
      ? 'Using your figure of $' + $('unitCost').value + ' per fixture per year.'
      : 'Volume tier for ' + r.N.toLocaleString('en-US') + ' fixtures: $' + tierPrice(r.N) + ' per fixture per year. Type over it to use your own quote.';

    var max = Math.max(r.todayTotal, r.afterTotal, 1);
    $('barBefore').style.width = (r.todayTotal / max * 100) + '%';
    $('barAfter').style.width = (r.afterTotal / max * 100) + '%';
    $('barBeforeTxt').textContent = moneyShort(r.todayTotal);
    $('barAfterTxt').textContent = moneyShort(r.afterTotal);

    if (r.net < 0) {
      $('calcNarrative').innerHTML =
        '<b>At this size and service model, the subscription costs more than it recovers</b> — ' +
        money(Math.abs(r.net)) + ' more over a year — and we would rather the model say so than hide it. ' +
        'Below roughly 1,000 fixtures, or where nobody is paid to go looking in the first place, the case rests on ' +
        'liability, response time and service quality instead of hard cost. Those are real, but they are not in this calculator. ' +
        '<a href="mailto:hello@lumialert.io">Talk to us</a> before you decide either way.';
      return r;
    }
    $('calcNarrative').innerHTML =
      'At <b>' + r.N.toLocaleString('en-US') + ' fixtures</b> found through ' + r.methodLabel +
      ', you can expect about <b>' + Math.round(r.failures).toLocaleString('en-US') +
      ' service events</b> a year, each sitting dark for weeks before anyone acts. Lumi Alert costs <b>' +
      money(r.cost) + '</b> and recovers roughly <b>' + money(r.gross) +
      '</b> — ' + Math.round(r.patrolHoursYr * 0.92).toLocaleString('en-US') +
      ' patrol hours, ' + Math.round(r.kwhWasted).toLocaleString('en-US') +
      ' kWh burned by failing fixtures, and about ' +
      Math.round(r.failures * r.rollsCut).toLocaleString('en-US') +
      ' truck visits that no longer need to happen, because every failure arrives pre-diagnosed and gets batched into one route.';

    return r;
  }

  /* ---------- wiring ---------- */
  $('fixtures').addEventListener('input', render);
  ['laborRate', 'rollCost', 'kwhRate', 'watt', 'patrolHrs', 'vehRate'].forEach(function (id) {
    $(id).addEventListener('input', render);
  });
  $('unitCost').addEventListener('input', function () { unitEdited = true; render(); });

  function segGroup(wrapId, attr, key, after) {
    var wrap = $(wrapId);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button[' + attr + ']');
      if (!b) return;
      wrap.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      state[key] = b.getAttribute(attr);
      if (after) after(state[key]);
      render();
    });
  }
  segGroup('segmentPick', 'data-seg', 'seg');
  segGroup('methodPick', 'data-method', 'method', function (v) { $('methodHint').textContent = METHOD_HINT[v]; });
  segGroup('fixtureType', 'data-ft', 'ft', function (v) { $('ftHint').textContent = FT_HINT[v]; });

  $('copyEstimate').addEventListener('click', function () {
    var r = compute();
    var txt = [
      'LUMI ALERT — ESTIMATED YEAR ONE',
      'Fixtures: ' + r.N.toLocaleString('en-US') + ' (' + r.segLabel + ', found via ' + r.methodLabel + ')',
      'Detection labor recovered: ' + money(r.laborSave),
      'Truck rolls avoided: ' + money(r.rollSave),
      'Wasted energy reclaimed: ' + money(r.energySave),
      'Dispatch handling saved: ' + money(r.adminSave),
      'Program cost: ' + money(r.cost),
      'NET SAVINGS: ' + money(r.net) + '  |  ROI ' + Math.round(r.roi) + '%  |  Payback ' + Math.round(r.payback) + ' mo',
      'Modeled estimate, not a quote. lumialert.io'
    ].join('\n');
    var done = function () { window.lumiToast && window.lumiToast('Estimate copied to your clipboard'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { window.lumiToast && window.lumiToast('Copy blocked by your browser'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  // expose for the chatbot
  window.lumiEstimate = function (fixtures) {
    if (fixtures) {
      var fx = $('fixtures');
      fx.value = Math.min(Math.max(fixtures, fx.min), fx.max);
    }
    return render();
  };
  window.lumiMoney = money;

  render();
})();
