/* ============================================================
   Lumi Alert — "Beacon", the on-site assistant
   Self-contained intent engine: no API key, no network calls,
   so it works identically on GitHub Pages and offline.
   Injected on every page, so the widget stays in sync.
   ========================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. Knowledge base. Each intent scores against the user's words.
     ------------------------------------------------------------------ */
  var KB = [
    {
      id: 'greet',
      k: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'yo', 'howdy', 'hiya'],
      a: "Hi — I'm Beacon, the Lumi Alert assistant. I can explain how the sensor works, price a rollout for your fixture count, or check whether your company fits our partner program. What's on your mind?",
      q: ['How does it work?', 'What would I save?', 'Become a partner']
    },
    {
      id: 'what',
      k: ['what is', 'what do you', 'what does', 'about', 'explain', 'lumi alert', 'product', 'who are you', 'tell me'],
      a: "Lumi Alert is a <b>lamp-failure detection system</b>. We put a small sealed sensor inline with fixtures you already own — streetlights, lot poles, high-bays, wall packs. Each one watches its own current draw, voltage, light output and temperature, then reports the moment it dims, flickers or dies.<br><br>The result: you stop sending people to <em>look</em> for dark lights and send them to <em>fix</em> known ones.",
      q: ['How does it install?', 'What does it cost?', 'Which fixtures work?']
    },
    {
      id: 'how',
      k: ['how does it work', 'how it works', 'how work', 'technology', 'tech', 'sensor', 'detect', 'detection', 'mesh', 'network'],
      a: "Three steps:<ul><li><b>Sense</b> — an inline module reads current, voltage, lumen output and temperature at the fixture, so it can tell <em>off by schedule</em> from <em>failing driver</em> from <em>dead lamp</em>.</li><li><b>Report</b> — modules mesh to each other and backhaul over LTE-M or LoRaWAN. One gateway covers a corridor or a campus.</li><li><b>Resolve</b> — you get a work order with pole ID, GPS pin, fault code and the part to bring.</li></ul>Median detection time in pilots is under 11 minutes, versus weeks on patrol.",
      q: ['How long does install take?', 'Does it need wiring?', 'Show me the savings']
    },
    {
      id: 'install',
      k: ['install', 'installation', 'retrofit', 'wiring', 'wire', 'how long to install', 'setup', 'set up', 'mount', 'labor'],
      a: "It's a retrofit, not a rebuild. The module goes inline at the fixture — <b>about 4 minutes per fixture</b> for a crew that's already up there, and <b>no new conduit or control wiring</b>. Most customers add sensors during a relamping cycle so the lift is already scheduled. A gateway per zone, powered from an existing circuit, and you're live the same day.",
      q: ['Which fixtures are compatible?', 'What does it cost?', 'Run a pilot']
    },
    {
      id: 'compat',
      k: ['compatible', 'compatibility', 'fixture', 'led', 'hid', 'halide', 'sodium', 'work with', 'types', 'legacy', 'old lights', 'high bay', 'wall pack'],
      a: "We support <b>LED, HID, metal halide and high-pressure sodium</b> fixtures from roughly 10W to 1000W, 120–480V. That covers street and roadway, parking lots and garages, industrial high-bays, wall packs, canopy and most sports lighting. Legacy fleets actually see the biggest return, because they fail about 14% a year versus 4% for LED.",
      q: ['What would I save?', 'Does it need internet?', 'Become a partner']
    },
    {
      id: 'price',
      k: ['cost', 'price', 'pricing', 'how much', 'expensive', 'budget', 'quote', 'fee', 'subscription', 'per fixture'],
      a: "Pricing is per fixture, per year, and it includes the module, the gateway, the dashboard and firmware updates. It runs <b>$9 per fixture per year</b> under 2,000 fixtures, <b>$7.50</b> through 10,000, and down to <b>$5.50</b> above 25,000 — hardware, gateway, connectivity, dashboard and updates included, on a three-year term.<br><br>Tell me your fixture count and I'll model the whole thing: <em>\"price 3,000 fixtures\"</em>.",
      q: ['Price 2,500 fixtures', 'What is the payback?', 'Open the calculator']
    },
    {
      id: 'savings',
      k: ['save', 'savings', 'roi', 'return', 'payback', 'calculator', 'estimate', 'model', 'worth it', 'money', 'how much would i save', 'price '],
      a: 'SAVINGS_DYNAMIC',
      q: ['Price 5,000 fixtures', 'How is that calculated?', 'Run a pilot']
    },
    {
      id: 'math',
      k: ['how is that calculated', 'assumption', 'assumptions', 'math', 'formula', 'where do those numbers', 'methodology', 'conservative'],
      a: "Four buckets, all editable in the calculator:<ul><li><b>Detection labor</b> — patrol hours × loaded labor rate, of which about 92% goes away.</li><li><b>Truck rolls</b> — without a fault code a failure takes 1.45–1.6 visits; pre-diagnosed and batched into a route, about 0.8.</li><li><b>Wasted energy</b> — a failing fixture keeps drawing roughly 45% of rated power for the weeks nobody notices.</li><li><b>Dispatch handling</b> — complaint intake and triage minutes per failure.</li></ul>Defaults are mid-range 2026 North American figures. It's a modeled estimate, not a quote — swap in your own rates under \"Adjust the assumptions\".",
      q: ['Open the calculator', 'What does it cost?', 'Run a pilot']
    },
    {
      id: 'energy',
      k: ['energy', 'kwh', 'power', 'electricity', 'carbon', 'emissions', 'sustainability', 'consumption', 'waste'],
      a: "Two sources of energy savings. First, failing fixtures aren't free — a dying driver or ballast keeps pulling roughly <b>45% of rated power</b> while producing almost no usable light, sometimes for a month. Second, we flag fixtures drawing <em>above</em> spec, which is usually a driver on its way out. Customers typically use the kWh report for sustainability and rebate filings.",
      q: ['What would I save?', 'Does it integrate with our system?', 'Which fixtures work?']
    },
    {
      id: 'connect',
      k: ['internet', 'wifi', 'wi-fi', 'cellular', 'lora', 'connectivity', 'signal', 'offline', 'coverage', 'gateway', 'range'],
      a: "No site Wi-Fi needed. Modules mesh locally and one gateway backhauls over <b>LTE-M or LoRaWAN</b>, which is included in the per-fixture price. Range is roughly 300m per hop in open air, so a pole line carries itself. If a gateway drops, modules buffer events and flush them when it's back — and a power loss at the fixture is itself a reported event, because the module is battery-backed.",
      q: ['Is our data secure?', 'How does it install?', 'What does it cost?']
    },
    {
      id: 'data',
      k: ['data', 'security', 'privacy', 'secure', 'encrypt', 'camera', 'surveillance', 'gdpr', 'who owns'],
      a: "No cameras, no microphones, no personal data — the module reports electrical and photometric telemetry only. Traffic is encrypted in transit and at rest, each device is individually keyed, and the data is yours: export it any time, and we delete it on request when a contract ends.",
      q: ['Does it integrate with our system?', 'Run a pilot', 'How does it work?']
    },
    {
      id: 'integrate',
      k: ['integrate', 'integration', 'api', 'cmms', 'cityworks', 'maximo', 'work order', 'servicenow', 'export', 'dashboard', 'software', 'salesforce'],
      a: "The dashboard stands alone, but most teams route failures into something they already use. We push work orders via <b>REST API or webhook</b>, with prebuilt connectors for Cityworks, Maximo and ServiceNow, plus CSV and scheduled email digests for smaller shops. A failure can open a ticket in your system within a minute of being detected.",
      q: ['Is our data secure?', 'Run a pilot', 'Become a partner']
    },
    {
      id: 'partner',
      k: ['partner', 'partnership', 'reseller', 'distributor', 'contractor', 'installer', 'integrator', 'become a partner', 'channel', 'dealer', 'margin', 'territory'],
      a: "We don't climb poles — our partners do. Three tracks:<ul><li><b>Certified Installer</b> — electrical and lighting contractors who retrofit and service.</li><li><b>Preferred Distributor</b> — lighting and electrical supply houses stocking modules and gateways.</li><li><b>Strategic Integrator</b> — smart-city, controls and facilities platforms embedding Lumi Alert in larger programs.</li></ul>The <a href=\"partners.html#match\">fit check</a> scores your fleet, crews and service model and tells you which track you qualify for in about 30 seconds.",
      q: ['Run the fit check', 'What are the margins?', 'What are the requirements?']
    },
    {
      id: 'partner_terms',
      k: ['margin', 'margins', 'commission', 'discount', 'requirements', 'requirement', 'qualify', 'minimum', 'exclusive', 'territory', 'training', 'what do i get'],
      a: "Certified Installers buy at a <b>32–38% partner discount</b> with no stocking minimum and keep recurring service revenue. Preferred Distributors get <b>40–46%</b>, protected pricing on registered projects and co-op marketing. Strategic Integrators negotiate program pricing plus API access. Requirements are modest: a licensed crew, one trained technician per territory (two days, free), and a completed fit check. <a href=\"partners.html#match\">Run it here.</a>",
      q: ['Run the fit check', 'How does onboarding work?', 'Who are your partners?']
    },
    {
      id: 'who_partners',
      k: ['who are your partners', 'existing partners', 'customers', 'case study', 'references', 'clients', 'pilots', 'who uses'],
      a: "Lumi Alert is an early-stage venture, so we're honest about this: we're building out a founding partner network rather than pointing at a long logo wall. Pilots run with municipal public-works departments, a community-college campus and a retail property group. Founding partners get territory protection and pricing locked for 24 months — that's the trade for being early.",
      q: ['Run the fit check', 'Run a pilot', 'What are the margins?']
    },
    {
      id: 'segments',
      k: ['city', 'municipal', 'school', 'district', 'campus', 'university', 'mall', 'retail', 'commercial', 'parking', 'industrial', 'port', 'warehouse', 'stadium', 'hospital', 'who is it for', 'use case'],
      a: "If you own more lights than you can look at, you're the customer. Cities and public works use it for pole-level accountability; schools and campuses for walkway and lot safety without night staff; retail and commercial property to catch a dark lot before the evening rush; industrial yards and ports for fixtures that need a lift to reach. The economics scale with fixture count and labor rate, not with sector.",
      q: ['What would I save?', 'Which fixtures work?', 'Run a pilot']
    },
    {
      id: 'pilot',
      k: ['pilot', 'demo', 'trial', 'try', 'contact', 'talk to', 'sales', 'call', 'email', 'get started', 'buy', 'order', 'next step', 'sign up'],
      a: "Pilots start at <b>100 fixtures over 90 days</b>, priced at cost, with a written report comparing detection time and truck rolls before and after. If it doesn't hold up, you keep the report and owe nothing further.<br><br>Email <a href=\"mailto:hello@lumialert.io\">hello@lumialert.io</a> with your fixture count and city, or run the <a href=\"partners.html#match\">fit check</a> and it'll route you.",
      q: ['What does it cost?', 'How long does install take?', 'Become a partner']
    },
    {
      id: 'warranty',
      k: ['warranty', 'lifespan', 'battery', 'maintenance', 'fail', 'break', 'weather', 'ip rating', 'temperature', 'durable', 'support'],
      a: "The module is sealed to <b>IP67</b>, rated –40°C to 70°C, and carries a <b>5-year warranty</b> — if a module dies, the mesh reports it and we replace it free. Expected service life is 10+ years, matched to LED fixture life, and the backup cell is rated for 7 days of reporting with no mains power.",
      q: ['Which fixtures work?', 'What does it cost?', 'Run a pilot']
    },
    {
      id: 'competition',
      k: ['competitor', 'competition', 'versus', 'vs', 'different', 'alternative', 'why not', 'smart controls', 'telensa', 'itron', 'better'],
      a: "Networked lighting controls do far more than we do — dimming, scheduling, metering — and cost accordingly, usually $90–$250 per node plus a controls retrofit. Lumi Alert does <b>one job</b>: tell you precisely which fixture failed and why, on the fixtures you already own, at a per-fixture price in the low teens. If you're already deploying full controls, we're redundant. If you're not, you've been paying people to find failures by eye.",
      q: ['What would I save?', 'What does it cost?', 'Which fixtures work?']
    },
    {
      id: 'simulator',
      k: ['simulator', 'live grid', 'simulation', 'animation', 'map', 'x-factor', 'demo on site', 'grid'],
      a: "That's the <b>Live Grid</b> on the home page — one week of a 96-fixture district compressed into about a minute. Switch between patrol-and-complaint detection and Lumi Alert, or click any lamp to break it yourself, and watch the dark-hours counter climb. It's the whole pitch in one widget. <a href=\"index.html#grid\">Take a look.</a>",
      q: ['Open the calculator', 'How does it work?', 'Run a pilot']
    },
    {
      id: 'video',
      k: ['video', 'clip', 'film', 'footage', 'animation at top'],
      a: "The clip at the top of the home page is an AI-generated 5-second loop of a night street grid with one fixture going dark and reporting itself — the thing the whole company exists to catch. It autoplays on a loop, muted.",
      q: ['How does it work?', 'What would I save?', 'Become a partner']
    },
    {
      id: 'thanks',
      k: ['thank', 'thanks', 'appreciate', 'great', 'cool', 'nice', 'awesome', 'helpful'],
      a: "Happy to help. If you want the short version to pass along: Lumi Alert makes every fixture report its own failure, so detection labor, repeat truck rolls and wasted energy mostly disappear. Anything else I can pull up?",
      q: ['What would I save?', 'Become a partner', 'Run a pilot']
    },
    {
      id: 'bye',
      k: ['bye', 'goodbye', 'later', 'that is all', 'thats all', 'done', 'see you'],
      a: "Good talking with you. The calculator and the fit check stay open as long as you need them — and <a href=\"mailto:hello@lumialert.io\">hello@lumialert.io</a> reaches a human.",
      q: ['Open the calculator', 'Run the fit check']
    },
    {
      id: 'help',
      k: ['help', 'what can you do', 'options', 'menu', 'questions'],
      a: "I can cover: how the sensor works, installation, fixture compatibility, connectivity, data handling, pricing, a savings estimate for your fixture count, integrations, pilots, and the partner program with its margins and requirements. Ask in your own words — or tap one of the suggestions.",
      q: ['What would I save?', 'How does it work?', 'Become a partner']
    }
  ];

  var FALLBACK = {
    a: "I don't have a good answer for that one. I'm solid on the sensor itself, installation, fixture compatibility, connectivity, pricing, savings math, integrations, pilots and the partner program. For anything else, <a href=\"mailto:hello@lumialert.io\">hello@lumialert.io</a> goes to a person.",
    q: ['How does it work?', 'What would I save?', 'Become a partner']
  };

  var OPENER = {
    a: "Hi — I'm <b>Beacon</b>, the Lumi Alert assistant. Ask me how the sensor works, what a rollout costs, or whether your company fits our partner program.<br><br>Try: <em>\"price 4,000 fixtures\"</em>.",
    q: ['How does it work?', 'Price 4,000 fixtures', 'Become a partner', 'What does it cost?']
  };

  /* ------------------------------------------------------------------
     2. Matching
     ------------------------------------------------------------------ */
  function normalize(s) {
    return (' ' + s.toLowerCase().replace(/[^a-z0-9%$., ]/g, ' ').replace(/\s+/g, ' ') + ' ');
  }

  function match(text) {
    var t = normalize(text), best = null, bestScore = 0;
    KB.forEach(function (intent) {
      var score = 0;
      intent.k.forEach(function (kw) {
        if (t.indexOf(' ' + kw) !== -1 || t.indexOf(kw + ' ') !== -1) {
          score += kw.indexOf(' ') !== -1 ? 2.5 : 1;   // phrases weigh more
          if (kw.length > 7) score += 0.4;
        }
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    // a bare number, or a number next to "fixture", is a pricing request
    var nums = text.replace(/,/g, '').match(/\b\d{2,6}\b/);
    if (nums && (bestScore < 2 || /fixture|light|lamp|pole|price|cost|save|quote/i.test(text))) {
      return { intent: KB.filter(function (i) { return i.id === 'savings'; })[0], n: parseInt(nums[0], 10) };
    }
    if (bestScore < 1) return { intent: null };
    return { intent: best, n: nums ? parseInt(nums[0], 10) : null };
  }

  function savingsAnswer(n) {
    if (window.lumiEstimate) {
      var r = window.lumiEstimate(n || null);
      var m = window.lumiMoney;
      return 'For <b>' + r.N.toLocaleString('en-US') + ' fixtures</b> on the current settings:<ul>' +
        '<li>Detection labor recovered: <b>' + m(r.laborSave) + '</b></li>' +
        '<li>Truck rolls avoided: <b>' + m(r.rollSave) + '</b></li>' +
        '<li>Wasted energy reclaimed: <b>' + m(r.energySave) + '</b></li>' +
        '<li>Dispatch handling: <b>' + m(r.adminSave) + '</b></li>' +
        '<li>Program cost: <b>' + m(r.cost) + '</b></li></ul>' +
        '<b>Net year one: ' + m(r.net) + '</b> — about ' + Math.round(r.roi) + '% return, paying back in ' +
        Math.round(r.payback) + ' months. I\'ve set the <a href="index.html#savings">calculator</a> to that count so you can change the labor rate, fixture type and detection method.' +
        '<br><br><em>Modeled estimate, not a quote.</em>';
    }
    var count = (n || 2400).toLocaleString('en-US');
    return 'On the home page the calculator will model this live. As a rule of thumb for <b>' + count +
      ' fixtures</b>: patrol labor mostly disappears, roughly 40% of repairs stop needing a second visit, and failing fixtures stop burning power for weeks. Payback usually lands in <b>6–10 months</b>. ' +
      '<a href="index.html#savings">Open the calculator →</a>';
  }

  /* ------------------------------------------------------------------
     3. Widget
     ------------------------------------------------------------------ */
  var fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.id = 'chatFab';
  fab.setAttribute('aria-label', 'Open the Lumi Alert assistant');
  fab.innerHTML =
    '<span class="ping"></span>' +
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
    '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-2.8-.4L4 21l1.4-4.1A8.2 8.2 0 0 1 3.5 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/>' +
    '<path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg>' +
    '<span class="badge">1</span>';

  var panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.id = 'chatPanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Lumi Alert assistant');
  panel.innerHTML =
    '<div class="chat-head">' +
      '<div class="av"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">' +
      '<path d="M12 3a6 6 0 0 0-3.4 10.95c.5.36.8.93.8 1.55v.5h5.2v-.5c0-.62.3-1.19.8-1.55A6 6 0 0 0 12 3Z"/><path d="M9.9 19h4.2M10.6 21.4h2.8"/></svg></div>' +
      '<div class="who"><b>Beacon</b><span>Lumi Alert assistant · online</span></div>' +
      '<button type="button" id="chatClose" aria-label="Close chat">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '</div>' +
    '<div class="chat-log" id="chatLog" aria-live="polite"></div>' +
    '<div class="chat-quick" id="chatQuick"></div>' +
    '<form class="chat-form" id="chatForm" autocomplete="off">' +
      '<input id="chatInput" type="text" placeholder="Ask about sensors, pricing, partners…" aria-label="Your message" maxlength="240">' +
      '<button type="submit" aria-label="Send">' +
      '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>' +
      '</button>' +
    '</form>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var log = panel.querySelector('#chatLog');
  var quick = panel.querySelector('#chatQuick');
  var form = panel.querySelector('#chatForm');
  var input = panel.querySelector('#chatInput');
  var started = false;

  function scroll() { log.scrollTop = log.scrollHeight; }

  function push(who, html) {
    var el = document.createElement('div');
    el.className = 'msg ' + who;
    el.innerHTML = html;
    log.appendChild(el);
    scroll();
    return el;
  }

  function setQuick(list) {
    quick.innerHTML = '';
    (list || []).forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function () { send(label); });
      quick.appendChild(b);
    });
  }

  function botReply(html, quicks) {
    var typing = document.createElement('div');
    typing.className = 'typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(typing);
    scroll();
    var delay = Math.min(1100, 320 + html.length * 1.1);
    setTimeout(function () {
      typing.remove();
      push('bot', html);
      setQuick(quicks);
    }, delay);
  }

  function send(text) {
    text = (text || '').trim();
    if (!text) return;
    push('me', text.replace(/</g, '&lt;'));
    setQuick([]);
    var m = match(text);
    if (!m.intent) { botReply(FALLBACK.a, FALLBACK.q); return; }

    // let a few commands drive the page itself
    if (/open the calculator|show me the savings/i.test(text)) {
      var sec = document.getElementById('savings');
      if (sec) { sec.scrollIntoView({ behavior: 'smooth' }); }
      else { window.location.href = 'index.html#savings'; }
    }
    if (/run the fit check|fit check/i.test(text)) {
      var mt = document.getElementById('match');
      if (mt) { mt.scrollIntoView({ behavior: 'smooth' }); }
      else { window.location.href = 'partners.html#match'; }
    }

    var answer = m.intent.a === 'SAVINGS_DYNAMIC' ? savingsAnswer(m.n) : m.intent.a;
    botReply(answer, m.intent.q);
  }

  function open() {
    panel.classList.add('open');
    fab.classList.add('hide');
    var badge = fab.querySelector('.badge');
    if (badge) badge.remove();
    if (!started) {
      started = true;
      botReply(OPENER.a, OPENER.q);
    }
    setTimeout(function () { input.focus(); }, 420);
  }
  function close() {
    panel.classList.remove('open');
    fab.classList.remove('hide');
  }

  fab.addEventListener('click', open);
  panel.querySelector('#chatClose').addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    send(input.value);
    input.value = '';
  });

  // any "ask Beacon" link on the page can open it
  document.querySelectorAll('[data-chat]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      open();
      var q = el.getAttribute('data-chat');
      if (q) setTimeout(function () { send(q); }, 650);
    });
  });
})();
