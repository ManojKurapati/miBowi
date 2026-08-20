/* ==========================================================================
   MiBoWi — core runtime
   Shared across every page. Classic script (no modules) so the site runs
   straight from file:// with no build step and no server.
   ========================================================================== */

window.MiBoWi = (function () {
  'use strict';

  /* ---------- Storage (safe in private mode / file://) ---------- */

  var store = {
    get: function (k, fallback) {
      try {
        var v = localStorage.getItem('mibowi.' + k);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem('mibowi.' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  /* ---------- Theme ---------- */

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#131110' : '#FAF7F2');
  }

  function initTheme() {
    var saved = store.get('theme', null);
    var sys = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (sys ? 'dark' : 'light'));

    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.theme-toggle');
      if (!btn) return;
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      store.set('theme', next);
    });
  }

  /* ---------- Regions & money ----------
     Two separate levers, because they are genuinely different things:
       fx   — currency conversion from the USD baseline
       idx  — local cost-of-living index for veterinary care, food and services.
              A vet visit in Mumbai is not a New York vet visit at the spot rate.
     Baseline figures in data/costs.js are US-market, 2026.
  ------------------------------------------------------------------------- */

  var REGIONS = [
    { id: 'us',  label: 'United States',   cur: 'USD', sym: '$',   fx: 1,     idx: 1.00 },
    { id: 'ca',  label: 'Canada',          cur: 'CAD', sym: 'C$',  fx: 1.37,  idx: 0.94 },
    { id: 'uk',  label: 'United Kingdom',  cur: 'GBP', sym: '£',   fx: 0.79,  idx: 0.92 },
    { id: 'eu',  label: 'Eurozone',        cur: 'EUR', sym: '€',   fx: 0.92,  idx: 0.88 },
    { id: 'au',  label: 'Australia',       cur: 'AUD', sym: 'A$',  fx: 1.52,  idx: 1.02 },
    { id: 'ae',  label: 'UAE',             cur: 'AED', sym: 'AED', fx: 3.67,  idx: 0.96 },
    { id: 'sg',  label: 'Singapore',       cur: 'SGD', sym: 'S$',  fx: 1.34,  idx: 1.12 },
    { id: 'in',  label: 'India',           cur: 'INR', sym: '₹',   fx: 83.5,  idx: 0.26 },
    { id: 'za',  label: 'South Africa',    cur: 'ZAR', sym: 'R',   fx: 18.2,  idx: 0.44 }
  ];

  function region() {
    var id = store.get('region', 'us');
    for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i];
    return REGIONS[0];
  }

  function setRegion(id) {
    store.set('region', id);
    document.dispatchEvent(new CustomEvent('mibowi:region', { detail: id }));
  }

  /* Convert a USD baseline figure into the active region's local money. */
  function local(usd) {
    var r = region();
    return usd * r.idx * r.fx;
  }

  /* Round to something a human would actually say out loud. */
  function humanRound(n) {
    var a = Math.abs(n);
    if (a >= 100000) return Math.round(n / 1000) * 1000;
    if (a >= 10000)  return Math.round(n / 500) * 500;
    if (a >= 1000)   return Math.round(n / 50) * 50;
    if (a >= 100)    return Math.round(n / 5) * 5;
    return Math.round(n);
  }

  /* Format a USD baseline figure as local currency. */
  function money(usd, opts) {
    opts = opts || {};
    var r = region();
    var v = opts.raw ? usd : local(usd);
    if (opts.round !== false) v = humanRound(v);
    var s = Math.round(v).toLocaleString('en-US');
    return r.sym + (r.sym.length > 1 ? ' ' : '') + s;
  }

  /* Compact form for big lifetime numbers: $41,000 -> $41k */
  function moneyShort(usd) {
    var r = region();
    var v = local(usd);
    var suffix = '', div = 1;
    if (v >= 1000000) { suffix = 'M'; div = 1000000; }
    else if (v >= 10000) { suffix = 'k'; div = 1000; }
    var n = v / div;
    var s = div === 1 ? Math.round(n).toLocaleString('en-US')
                      : (n >= 100 ? Math.round(n) : (Math.round(n * 10) / 10));
    return r.sym + (r.sym.length > 1 ? ' ' : '') + s + suffix;
  }

  /* Mount every <select data-region-picker> on the page. */
  function initRegionPickers() {
    var sels = document.querySelectorAll('[data-region-picker]');
    Array.prototype.forEach.call(sels, function (sel) {
      if (!sel.getAttribute('aria-label')) sel.setAttribute('aria-label', 'Region and currency');
      sel.innerHTML = REGIONS.map(function (r) {
        return '<option value="' + r.id + '">' + r.label + ' &middot; ' + r.cur + '</option>';
      }).join('');
      sel.value = region().id;
      sel.addEventListener('change', function () { setRegion(sel.value); });
    });
    document.addEventListener('mibowi:region', function () {
      Array.prototype.forEach.call(sels, function (sel) { sel.value = region().id; });
    });
  }

  /* Fill any <span data-money="120"> with the localised figure, and keep it
     in sync when the region changes. Lets static markup carry live currency. */
  function initMoneyTags() {
    var paint = function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-money]'), function (n) {
        var v = parseFloat(n.getAttribute('data-money'));
        if (!isNaN(v)) n.textContent = money(v);
      });
    };
    paint();
    document.addEventListener('mibowi:region', paint);
  }

  /* ---------- Header behaviour ---------- */

  function initHeader() {
    var header = document.querySelector('.site-header');
    var nav = document.querySelector('.nav');
    var toggle = document.querySelector('.nav-toggle');

    if (header) {
      var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 6); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') nav.classList.remove('is-open');
      });
    }

    // Mark the current page in the nav.
    var here = location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('.nav a'), function (a) {
      var href = a.getAttribute('href');
      if (href === here) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- Scroll reveal ---------- */

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(els, function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- Small helpers ---------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* Read a radio group's value out of a form. */
  function val(form, name, fallback) {
    var f = form.elements[name];
    if (!f) return fallback;
    if (f.length && f[0] && f[0].type === 'radio') {
      for (var i = 0; i < f.length; i++) if (f[i].checked) return f[i].value;
      return fallback;
    }
    if (f.type === 'checkbox') return f.checked;
    return f.value === '' || f.value == null ? fallback : f.value;
  }

  function num(form, name, fallback) {
    var v = parseFloat(val(form, name, NaN));
    return isNaN(v) ? fallback : v;
  }

  /* Count 0 -> target, for result headline numbers. */
  function countTo(node, target, fmt, ms) {
    ms = ms || 900;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = fmt(target); return;
    }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = clamp((ts - start) / ms, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* Scroll a result panel into view without slamming it to the very top. */
  function revealResult(node) {
    node.classList.add('is-active');
    var y = node.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /* Colour ramp used by every score in the product: red -> amber -> green. */
  function scoreColor(pct) {
    if (pct >= 78) return 'var(--good)';
    if (pct >= 58) return 'var(--moss)';
    if (pct >= 38) return 'var(--warn)';
    return 'var(--bad)';
  }

  /* ---------- Boot ---------- */

  function boot() {
    initTheme();
    initHeader();
    initReveal();
    initRegionPickers();
    initMoneyTags();
    document.body.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  return {
    store: store, REGIONS: REGIONS, region: region, setRegion: setRegion,
    money: money, moneyShort: moneyShort, local: local, humanRound: humanRound,
    el: el, esc: esc, clamp: clamp, val: val, num: num,
    countTo: countTo, revealResult: revealResult, scoreColor: scoreColor
  };
})();

/* Theme applied before paint to avoid a flash of the wrong theme. */
(function () {
  try {
    var t = JSON.parse(localStorage.getItem('mibowi.theme') || 'null');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
