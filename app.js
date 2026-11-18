/* ============================================================
   Lumi Alert — shared behaviour: nav, reveals, counters,
   hero ambience canvas, video readiness, toast
   ========================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  window.lumiToast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  };

  /* ---------- sticky nav ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('stuck', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- scroll reveals ---------- */
  var rvs = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    rvs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (en.isIntersecting) {
          var el = en.target;
          setTimeout(function () { el.classList.add('in'); }, i * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    rvs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- count-up stats ---------- */
  var nums = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.innerHTML = pre + target + suf; return; }
    var dur = 1500, t0 = performance.now();
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = pre + Math.round(target * eased) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); io2.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io2.observe(el); });
  } else {
    nums.forEach(runCount);
  }

  /* ---------- hero video readiness ----------
     The AI-generated clip autoplays muted + looped. If it is missing or
     blocked, the generative canvas below stays at full strength so the
     hero is never blank. */
  var vid = document.getElementById('heroVideo');
  var media = document.getElementById('heroMedia');
  if (vid && media) {
    var markReady = function () {
      if (vid.videoWidth > 0) {
        vid.classList.add('ready');
        media.classList.add('has-video');
      }
    };
    vid.addEventListener('loadeddata', markReady);
    vid.addEventListener('canplay', markReady);
    vid.addEventListener('error', function () { media.classList.remove('has-video'); });
    // Some browsers refuse autoplay until a gesture; retry quietly.
    var tryPlay = function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
    tryPlay();
    ['click', 'touchstart', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, tryPlay, { once: true, passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tryPlay();
    });
  }

  /* ---------- hero ambience canvas ----------
     A slow aerial grid of lit fixtures; now and then one fails and a
     detection ring pulses out from it. */
  var cv = document.getElementById('heroCanvas');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var lamps = [], rings = [], t = 0, raf = null;

    function build() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lamps = [];
      var rows = 7, cols = Math.max(7, Math.round(W / 115));
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var depth = r / (rows - 1);                 // 0 far, 1 near
          var skew = (c - (cols - 1) / 2) * (0.55 + depth * 0.95);
          lamps.push({
            x: W / 2 + skew * (W / cols) * 0.92,
            y: H * (0.26 + Math.pow(depth, 1.5) * 0.78),
            r: 1.1 + depth * 2.7,
            glow: 10 + depth * 44,
            a: 0.18 + depth * 0.5,
            ph: Math.random() * Math.PI * 2,
            out: false,
            tOut: 0
          });
        }
      }
    }

    function failRandom() {
      var live = lamps.filter(function (l) { return !l.out && l.y > H * 0.4; });
      if (!live.length) return;
      var l = live[Math.floor(Math.random() * live.length)];
      l.out = true; l.tOut = t;
      rings.push({ x: l.x, y: l.y, t: t });
      setTimeout(function () { l.out = false; }, 5200 + Math.random() * 3000);
    }

    function frame() {
      t += 1;
      ctx.clearRect(0, 0, W, H);

      // ground haze
      var g = ctx.createLinearGradient(0, H * 0.25, 0, H);
      g.addColorStop(0, 'rgba(10,14,22,0)');
      g.addColorStop(1, 'rgba(18,22,34,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      lamps.forEach(function (l) {
        var flick = 0.86 + Math.sin(t * 0.021 + l.ph) * 0.14;
        var alpha = l.out ? 0.05 : l.a * flick;
        var rg = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.glow);
        rg.addColorStop(0, 'rgba(240,210,150,' + (alpha * 0.85).toFixed(3) + ')');
        rg.addColorStop(0.42, 'rgba(212,175,106,' + (alpha * 0.22).toFixed(3) + ')');
        rg.addColorStop(1, 'rgba(212,175,106,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(l.x, l.y, l.glow, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = l.out ? 'rgba(120,120,130,.35)' : 'rgba(255,240,215,' + Math.min(1, alpha + 0.35).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
      });

      rings = rings.filter(function (ring) {
        var age = (t - ring.t) / 95;
        if (age > 1) return false;
        ctx.strokeStyle = 'rgba(226,112,95,' + (0.55 * (1 - age)).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(ring.x, ring.y, 6 + age * 110, 0, Math.PI * 2); ctx.stroke();
        return true;
      });

      raf = requestAnimationFrame(frame);
    }

    build();
    if (!reduce) {
      frame();
      setInterval(failRandom, 3400);
    } else {
      frame();                       // one static pass
      cancelAnimationFrame(raf);
    }
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(build, 180);
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (!reduce) { cancelAnimationFrame(raf); frame(); }
    });
  }
})();
