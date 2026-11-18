/* ============================================================
   Lumi Alert — partner fit check
   Rule-based scoring, entirely client side. Nothing is submitted.
   ========================================================== */
(function () {
  'use strict';
  var root = document.getElementById('match');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };

  var TYPE_PTS = { contractor: 26, distributor: 24, integrator: 28, facilities: 20, other: 10 };
  var SVC_PTS  = { relamp: 4, maint: 4, patrol: 4, public: 4, audit: 3, controls: 3, newcon: 2 };
  var MODEL_PTS = { recurring: 14, project: 9, supply: 7 };
  var REGION_PTS = { open: 6, tight: 3, wait: 0 };
  var REGION_HINT = {
    open: 'Open territory — founding-partner slots available.',
    tight: 'Competitive territory — one slot left in the founding cohort.',
    wait: 'Outside our 2026 service footprint — we would start you on the waitlist with pricing held.'
  };

  var DISCOUNT = { integrator: 0.30, distributor: 0.43, installer: 0.35, prospect: 0.28 };
  var ATTACH = 0.12;        // reachable fixtures won in year one
  var PRICE = 7.5;          // $/fixture/yr list at mid volume
  var LABOR = 14;           // $/fixture retrofit labor the partner bills

  var state = {
    type: 'contractor',
    fixtures: 6000,
    crews: 2,
    services: { relamp: true, maint: true },
    model: 'recurring',
    region: 'open'
  };

  function fixturePts(n) {
    if (n < 1000) return 6;
    if (n < 3000) return 12;
    if (n < 8000) return 18;
    if (n < 20000) return 22;
    if (n < 50000) return 25;
    return 26;
  }

  function crewPts() {
    var supplyish = state.type === 'distributor' || state.model === 'supply';
    if (state.crews >= 15) return 20;
    if (state.crews >= 7) return 16;
    if (state.crews >= 2) return 10;
    return supplyish ? 11 : 2;        // a supply house isn't expected to climb
  }

  function svcPts() {
    var total = 0;
    Object.keys(state.services).forEach(function (k) {
      if (state.services[k]) total += (SVC_PTS[k] || 2);
    });
    return Math.min(18, total);
  }

  function score() {
    var s = TYPE_PTS[state.type] + fixturePts(state.fixtures) + crewPts() +
            svcPts() + MODEL_PTS[state.model] + REGION_PTS[state.region];
    return Math.max(8, Math.min(100, Math.round(s)));
  }

  function tierOf(sc) {
    if (state.type === 'integrator' && sc >= 74) return 'integrator';
    if (state.type === 'distributor' && sc >= 60) return 'distributor';
    if ((state.type === 'contractor' || state.type === 'facilities') && state.crews >= 2 && sc >= 56) return 'installer';
    if (sc >= 44) return 'prospect';
    return 'referral';
  }

  var TIER_META = {
    integrator: { name: 'Strategic Integrator', line: 'You can embed detection inside programs you already run, which is the fastest path to volume for both of us.' },
    distributor: { name: 'Preferred Distributor', line: 'You reach the contractors who do the climbing, and counter-level stock is how modules get specified.' },
    installer: { name: 'Certified Installer', line: 'You have the crews and the service relationships — this attaches to work you are already scheduled to do.' },
    prospect: { name: 'Founding Prospect', line: 'The pieces are there but something is thin — likely crew coverage, reachable fixtures or a supply-only model. Worth a conversation.' },
    referral: { name: 'Referral Partner', line: 'Deploying it yourself would be a stretch today, but referral fees on closed deployments cost you nothing to earn.' }
  };

  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

  function steps(tier, sc) {
    var out = [];
    if (tier === 'integrator') {
      out = ['Email this result and we will set up an API and white-label review inside two business days.',
             'Name a program owner and pick one live program for a 100-fixture proof deployment.',
             'We co-author the detection section of your next public-sector pursuit.'];
    } else if (tier === 'distributor') {
      out = ['Email this result to open a stocking quote at your discount tier.',
             'Two counter staff take the two-day certification, free, remote or on site.',
             'We register your top five contractor accounts for protected project pricing.'];
    } else if (tier === 'installer') {
      out = ['Email this result to confirm territory status for your metro.',
             'One technician certifies in two days — then a 100-fixture proof deployment at cost.',
             'Pick the customer whose relamping cycle comes up next and attach modules to that visit.'];
    } else if (tier === 'prospect') {
      out = ['Send the result and tell us which part is thin — crews, fixtures or territory.',
             'Start with a single 100-fixture proof site instead of a territory commitment.',
             'If crews are the gap, we can pair you with a Certified Installer and split the work.'];
    } else {
      out = ['Join the referral track — send us a qualified lighting owner, earn a fee when it deploys.',
             'No certification, inventory or crew required to participate.',
             'Revisit the fit check when your fixture reach or crew coverage grows.'];
    }
    if (state.region === 'wait') out.push('Your territory is outside the 2026 footprint, so we would hold your pricing on the waitlist.');
    if (state.services.patrol) out.push('You sell night inspection today — tell us and we will model what replacing those routes does to your margin.');
    return out.slice(0, 4);
  }

  function render() {
    var sc = score();
    var tier = tierOf(sc);
    var meta = TIER_META[tier];

    // gauge
    var arc = $('gaugeArc');
    arc.style.strokeDashoffset = String(540 - (540 * sc / 100));
    arc.setAttribute('stroke', sc >= 70 ? '#3E9AD6' : (sc >= 45 ? '#EEC95B' : '#B9C0CB'));
    $('scoreNum').textContent = sc;
    $('tierLabel').textContent = meta.name;

    // money
    var reach = state.fixtures;
    var attach = reach * ATTACH;
    var disc = DISCOUNT[tier] || DISCOUNT.prospect;
    var margin = attach * PRICE * disc;
    var labor = (state.model === 'supply' || state.crews === 0) ? 0 : attach * LABOR;

    $('mReach').textContent = reach.toLocaleString('en-US') + ' fixtures';
    $('mAttach').textContent = Math.round(attach).toLocaleString('en-US') + ' fixtures';
    $('mMargin').textContent = money(margin) + '/yr';
    $('mLabor').textContent = labor ? money(labor) : 'n/a — supply only';
    $('mTotal').textContent = money(margin + labor);

    $('matchVerdict').innerHTML = '<b>' + meta.name + '.</b> ' + meta.line +
      ' Your score of <b>' + sc + '</b> comes mostly from ' + reasonSummary() + '.';

    var ul = $('mSteps');
    ul.innerHTML = '';
    steps(tier, sc).forEach(function (s) {
      var li = document.createElement('li');
      li.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12.5l5 5L20 6.5"/></svg><span>' + s + '</span>';
      ul.appendChild(li);
    });

    var subject = encodeURIComponent('Lumi Alert partner application — ' + meta.name);
    var body = encodeURIComponent(
      'Fit score: ' + sc + '/100 (' + meta.name + ')\n' +
      'Company type: ' + state.type + '\n' +
      'Reachable fixtures: ' + reach.toLocaleString('en-US') + '\n' +
      'Field crews: ' + (state.crews || 'none') + '\n' +
      'Services: ' + Object.keys(state.services).filter(function (k) { return state.services[k]; }).join(', ') + '\n' +
      'Revenue model: ' + state.model + '\n' +
      'Year-one territory opportunity: ' + money(margin + labor) + '\n\n' +
      'Company name:\nContact:\nTerritory / metro:\n'
    );
    $('mApply').setAttribute('href', 'mailto:hello@lumialert.io?subject=' + subject + '&body=' + body);
  }

  function reasonSummary() {
    var bits = [];
    if (fixturePts(state.fixtures) >= 22) bits.push('the size of the fleet you can reach');
    else if (fixturePts(state.fixtures) <= 12) bits.push('a modest reachable fleet');
    if (crewPts() >= 16) bits.push('deep crew coverage');
    else if (state.crews === 0 && state.type !== 'distributor') bits.push('no crews of your own');
    if (svcPts() >= 12) bits.push('the services you already sell');
    if (state.model === 'recurring') bits.push('recurring service agreements');
    if (state.model === 'supply') bits.push('a supply-only model');
    if (!bits.length) bits.push('your company profile');
    return bits.slice(0, 3).join(', ');
  }

  /* ---------- wiring ---------- */
  function segGroup(id, key, cast) {
    var wrap = $(id);
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      wrap.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      var v = b.getAttribute('data-v');
      state[key] = cast ? cast(v) : v;
      render();
    });
  }
  segGroup('mType', 'type');
  segGroup('mCrews', 'crews', function (v) { return parseInt(v, 10); });
  segGroup('mModel', 'model');

  var fx = $('mFixtures');
  function fxRender() {
    state.fixtures = parseInt(fx.value, 10);
    $('mFixturesVal').textContent = state.fixtures.toLocaleString('en-US');
    fx.style.setProperty('--p', ((fx.value - fx.min) / (fx.max - fx.min) * 100) + '%');
    render();
  }
  fx.addEventListener('input', fxRender);

  $('mServices').addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    var on = b.getAttribute('aria-pressed') === 'true';
    b.setAttribute('aria-pressed', String(!on));
    state.services[b.getAttribute('data-v')] = !on;
    var n = Object.keys(state.services).filter(function (k) { return state.services[k]; }).length;
    $('mSvcCount').textContent = n + (n === 1 ? ' selected' : ' selected');
    render();
  });

  $('mRegion').addEventListener('change', function () {
    state.region = this.value;
    $('mRegionHint').textContent = REGION_HINT[state.region];
    render();
  });

  fxRender();
})();
