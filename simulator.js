/* ============================================================
   Lumi Alert — "Live Grid" simulator  (the X-factor)
   One week of a 96-fixture district, compressed into a minute.
   Lamps fail at random; how fast they're found depends on the mode.
   ========================================================== */
(function () {
  'use strict';
  var cv = document.getElementById('simCanvas');
  if (!cv || !cv.getContext) return;

  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HOURS_PER_SEC = 168 / 70;      // a 7-day week in ~70 seconds
  var FAILS_PER_WEEK = 9;
  var PATROL_EVERY = 72;             // hours between patrol sweeps
  var COMPLAINT_RATE = 0.006;        // per dark lamp, per hour
  var CREW_MANUAL = 22;              // hours from detection to repair
  var CREW_LUMI = 8;
  var LUMI_LAG = 0.15;               // detection latency in hours

  var mode = 'manual', paused = false;
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var lamps = [], pings = [], t = 0, last = 0, raf = null;
  var stats = { darkHours: 0, detTotal: 0, detCount: 0, lastPatrol: 0, nextFail: 6 };

  var $ = function (id) { return document.getElementById(id); };

  function layout() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = 12, rows = 8;
    var padX = W * 0.07, padY = H * 0.12;
    var gx = (W - padX * 2) / (cols - 1), gy = (H - padY * 2) / (rows - 1);
    lamps.forEach(function (l, i) {
      l.x = padX + (i % cols) * gx + ((Math.floor(i / cols) % 2) ? gx * 0.18 : 0);
      l.y = padY + Math.floor(i / cols) * gy;
    });
  }

  function build() {
    lamps = [];
    for (var i = 0; i < 96; i++) {
      lamps.push({ x: 0, y: 0, id: i, st: 'ok', failedAt: 0, detAt: 0, fixAt: 0, ph: Math.random() * 6.28 });
    }
    layout();
  }

  function reset(msg) {
    build();
    pings = []; t = 0;
    stats = { darkHours: 0, detTotal: 0, detCount: 0, lastPatrol: 0, nextFail: 4 };
    paint();
    readout();
    if (msg && window.lumiToast) window.lumiToast(msg);
  }

  function breakLamp(l) {
    if (!l || l.st !== 'ok') return;
    l.st = 'dark'; l.failedAt = t; l.detAt = 0; l.fixAt = 0;
  }

  function breakRandom() {
    var ok = lamps.filter(function (l) { return l.st === 'ok'; });
    if (!ok.length) return;
    breakLamp(ok[Math.floor(Math.random() * ok.length)]);
  }

  function detect(l) {
    l.detAt = t;
    stats.detTotal += (t - l.failedAt);
    stats.detCount++;
    l.fixAt = t + (mode === 'lumi' ? CREW_LUMI : CREW_MANUAL);
    pings.push({ x: l.x, y: l.y, t: t, lumi: mode === 'lumi' });
  }

  function step(dt) {
    t += dt;

    // random failures across the week
    stats.nextFail -= dt;
    if (stats.nextFail <= 0) {
      breakRandom();
      stats.nextFail = (168 / FAILS_PER_WEEK) * (0.5 + Math.random());
    }

    var patrolled = false;
    if (mode === 'manual' && t - stats.lastPatrol >= PATROL_EVERY) {
      stats.lastPatrol = t; patrolled = true;
    }

    lamps.forEach(function (l) {
      if (l.st === 'dark') {
        stats.darkHours += dt;
        if (!l.detAt) {
          if (mode === 'lumi') {
            if (t - l.failedAt >= LUMI_LAG) detect(l);
          } else {
            if (patrolled) detect(l);
            else if (Math.random() < COMPLAINT_RATE * dt) detect(l);   // someone calls it in
          }
        } else if (t >= l.fixAt) {
          l.st = 'fixed'; l.fixAt = t;
        }
      } else if (l.st === 'fixed' && t - l.fixAt > 3) {
        l.st = 'ok';
      }
    });

    if (t >= 168) {                               // week over, roll it again
      var keepMode = mode;
      reset(null);
      mode = keepMode;
    }
  }

  function paint() {
    ctx.clearRect(0, 0, W, H);

    // street grid
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    var cols = 12, rows = 8;
    for (var r = 0; r < rows; r++) {
      var a = lamps[r * cols], b = lamps[r * cols + cols - 1];
      if (!a || !b) continue;
      ctx.beginPath(); ctx.moveTo(a.x - 20, a.y); ctx.lineTo(b.x + 20, b.y); ctx.stroke();
    }
    for (var c = 0; c < cols; c += 2) {
      var top = lamps[c], bot = lamps[(rows - 1) * cols + c];
      if (!top || !bot) continue;
      ctx.beginPath(); ctx.moveTo(top.x, top.y - 16); ctx.lineTo(bot.x, bot.y + 16); ctx.stroke();
    }

    lamps.forEach(function (l) {
      var lit = l.st === 'ok' || l.st === 'fixed';
      var flick = 0.88 + Math.sin(t * 0.6 + l.ph) * 0.12;
      if (lit) {
        var glow = l.st === 'fixed' ? 30 : 22;
        var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, glow);
        var base = l.st === 'fixed' ? '150,220,190' : '240,205,140';
        g.addColorStop(0, 'rgba(' + base + ',' + (0.5 * flick).toFixed(3) + ')');
        g.addColorStop(0.45, 'rgba(212,175,106,.1)');
        g.addColorStop(1, 'rgba(212,175,106,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(l.x, l.y, glow, 0, 6.3); ctx.fill();
        ctx.fillStyle = l.st === 'fixed' ? '#9FE3C5' : 'rgba(255,243,222,.95)';
      } else {
        ctx.fillStyle = l.detAt ? 'rgba(226,112,95,.9)' : 'rgba(110,116,128,.55)';
      }
      ctx.beginPath(); ctx.arc(l.x, l.y, 3.2, 0, 6.3); ctx.fill();

      if (l.st === 'dark') {                       // crosshair on the failure
        ctx.strokeStyle = l.detAt ? 'rgba(226,112,95,.55)' : 'rgba(140,146,158,.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(l.x, l.y, 8, 0, 6.3); ctx.stroke();
      }
    });

    pings = pings.filter(function (p) {
      var age = (t - p.t) / 6;
      if (age > 1 || age < 0) return false;
      ctx.strokeStyle = (p.lumi ? 'rgba(121,201,166,' : 'rgba(226,112,95,') + (0.7 * (1 - age)).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6 + age * 46, 0, 6.3); ctx.stroke();
      return true;
    });
  }

  function readout() {
    var dark = lamps.filter(function (l) { return l.st === 'dark'; }).length;
    var day = Math.min(7, Math.floor(t / 24) + 1);
    var hr = Math.floor(t % 24);
    $('simDay').textContent = 'Day ' + day + ' · ' + (hr < 10 ? '0' : '') + hr + ':00';
    $('simOut').textContent = dark;
    $('simDarkHrs').textContent = Math.round(stats.darkHours).toLocaleString('en-US');
    if (stats.detCount) {
      var avg = stats.detTotal / stats.detCount;
      $('simDetect').textContent = avg < 1
        ? Math.max(1, Math.round(avg * 60)) + ' min'
        : (avg < 24 ? avg.toFixed(1) + ' hrs' : (avg / 24).toFixed(1) + ' days');
      $('simDetect').className = 'n ' + (avg < 1 ? 'hi' : 'lo');
    } else {
      $('simDetect').textContent = '—';
      $('simDetect').className = 'n';
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!last) last = now;
    var dtSec = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!paused) step(dtSec * HOURS_PER_SEC);
    paint();
    readout();
  }

  /* ---------- controls ---------- */
  $('simMode').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
    b.setAttribute('aria-pressed', 'true');
    mode = b.getAttribute('data-mode');
    reset(mode === 'lumi' ? 'Lumi Alert mode — every failure reports itself' : 'Patrol mode — failures wait to be found');
  });
  $('simFail').addEventListener('click', function () { breakRandom(); });
  $('simReset').addEventListener('click', function () { reset('Week reset'); });
  $('simPause').addEventListener('click', function () {
    paused = !paused;
    this.setAttribute('aria-pressed', String(paused));
    this.textContent = paused ? 'Resume' : 'Pause';
  });

  cv.addEventListener('click', function (e) {
    var rect = cv.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top, best = null, bd = 400;
    lamps.forEach(function (l) {
      var d = (l.x - mx) * (l.x - mx) + (l.y - my) * (l.y - my);
      if (d < bd) { bd = d; best = l; }
    });
    if (best) breakLamp(best);
  });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 160); });

  build();
  paint();
  readout();

  // only animate while the section is on screen
  if ('IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }
        else if (raf) { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0.18 }).observe(cv.closest('.sim-shell'));
  } else if (!reduce) {
    raf = requestAnimationFrame(loop);
  }
})();
