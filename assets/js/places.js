/* ==========================================================================
   MiBoWi — pet-friendly places map (UAE)
   Reads the dataset produced by scripts/scrape-places.js. Nothing is scraped
   in the browser; this only renders what was committed at build time.
   ========================================================================== */

(function () {
  'use strict';

  var M = window.MiBoWi;
  var DATA = window.MIBOWI_PLACES;
  if (!M || !DATA || !window.L) return;

  var CATS = DATA.categories;
  var ALL = DATA.places;

  var map, layer, markers = {}, state = {
    cats: Object.keys(CATS),
    emirate: 'all',
    q: '',
    viewportOnly: false
  };

  /* --------------------------------------------------------------- filter */

  function matches(p) {
    if (state.cats.indexOf(p.cat) < 0) return false;
    if (state.emirate !== 'all' && p.emirate !== state.emirate) return false;
    if (state.q) {
      var hay = (p.name + ' ' + p.area + ' ' + p.emirate + ' ' + (CATS[p.cat] || {}).label).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    if (state.viewportOnly && map) {
      if (!map.getBounds().contains([p.lat, p.lon])) return false;
    }
    return true;
  }

  function visible() { return ALL.filter(matches); }

  /* ------------------------------------------------------------ map setup */

  function icon(p) {
    var tint = (CATS[p.cat] || {}).tint || '#B4522E';
    return window.L.divIcon({
      className: 'pin-wrap',
      html: '<span class="pin" style="--pin:' + tint + '"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10]
    });
  }

  function popup(p) {
    var cat = CATS[p.cat] || { label: p.cat };
    var h = '<div class="pop">';
    h += '<span class="pop__cat" style="color:' + cat.tint + '">' + M.esc(cat.label) + '</span>';
    h += '<b class="pop__name">' + M.esc(p.name) + '</b>';
    var where = [p.street, p.area, p.emirate].filter(Boolean).join(', ');
    if (where) h += '<p class="pop__where">' + M.esc(where) + '</p>';
    if (p.hours) h += '<p class="pop__meta">' + M.esc(p.hours) + '</p>';
    if (p.note) h += '<p class="pop__meta">' + M.esc(p.note) + '</p>';
    if (p.dog) h += '<p class="pop__meta">Dogs: ' + M.esc(p.dog) + '</p>';
    h += '<div class="pop__links">';
    h += '<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' +
         p.lat + ',' + p.lon + '">Directions</a>';
    if (p.phone) h += '<a href="tel:' + M.esc(p.phone.replace(/\s/g, '')) + '">Call</a>';
    if (p.web) h += '<a target="_blank" rel="noopener" href="' + M.esc(p.web) + '">Website</a>';
    if (p.srcUrl) h += '<a target="_blank" rel="noopener" href="' + M.esc(p.srcUrl) + '">Source</a>';
    h += '</div></div>';
    return h;
  }

  function buildMap() {
    map = window.L.map('map', {
      center: [24.8, 55.2],
      zoom: 8,
      scrollWheelZoom: false,      // don't hijack the page scroll
      attributionControl: true
    });
    map.on('click', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    layer = window.L.layerGroup().addTo(map);

    ALL.forEach(function (p) {
      var m = window.L.marker([p.lat, p.lon], { icon: icon(p), title: p.name });
      m.bindPopup(popup(p), { closeButton: true, maxWidth: 260 });
      markers[p.id] = m;
    });

    map.on('moveend', function () { if (state.viewportOnly) render(); });
  }

  /* ------------------------------------------------------------- rendering */

  function render() {
    var rows = visible();

    layer.clearLayers();
    rows.forEach(function (p) { layer.addLayer(markers[p.id]); });

    var list = document.getElementById('place-list');
    if (!rows.length) {
      list.innerHTML = '<p class="small muted" style="padding:20px 4px">Nothing matches those filters. ' +
        'Widen the categories, or clear the search.</p>';
    } else {
      list.innerHTML = rows.map(function (p) {
        var cat = CATS[p.cat] || { label: p.cat, tint: 'var(--clay)' };
        return '<button class="place" type="button" data-id="' + p.id + '">' +
          '<span class="place__dot" style="background:' + cat.tint + '"></span>' +
          '<span class="place__text"><b>' + M.esc(p.name) + '</b>' +
          '<small>' + M.esc([cat.label, p.area || p.emirate].filter(Boolean).join(' · ')) + '</small></span>' +
        '</button>';
      }).join('');
    }

    document.getElementById('place-count').textContent =
      rows.length + (rows.length === 1 ? ' place' : ' places');

    Array.prototype.forEach.call(document.querySelectorAll('[data-cat-count]'), function (n) {
      var c = n.getAttribute('data-cat-count');
      n.textContent = ALL.filter(function (p) { return p.cat === c; }).length;
    });
  }

  function focus(id) {
    var p = null;
    ALL.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 14), { duration: 0.7 });
    var m = markers[p.id];
    if (m) setTimeout(function () { m.openPopup(); }, 720);
  }

  /* ------------------------------------------------------------------ init */

  function buildControls() {
    var chips = document.getElementById('cat-filters');
    chips.innerHTML = Object.keys(CATS).map(function (k) {
      return '<label class="opt"><input type="checkbox" name="cat" value="' + k + '" checked>' +
        '<span><i class="place__dot" style="background:' + CATS[k].tint + '"></i>' +
        CATS[k].label + ' <b class="muted" data-cat-count="' + k + '"></b></span></label>';
    }).join('');

    var em = document.getElementById('emirate-filter');
    var names = Object.keys(DATA.counts.byEmirate).sort();
    em.innerHTML = '<option value="all">Every emirate</option>' + names.map(function (n) {
      return '<option value="' + n + '">' + n + ' (' + DATA.counts.byEmirate[n] + ')</option>';
    }).join('');

    chips.addEventListener('change', function () {
      state.cats = Array.prototype.slice.call(chips.querySelectorAll('input:checked'))
        .map(function (n) { return n.value; });
      render();
    });
    em.addEventListener('change', function () { state.emirate = em.value; render(); });

    var q = document.getElementById('place-search');
    q.addEventListener('input', function () { state.q = q.value.trim().toLowerCase(); render(); });

    var vp = document.getElementById('viewport-only');
    vp.addEventListener('change', function () { state.viewportOnly = vp.checked; render(); });

    document.getElementById('place-list').addEventListener('click', function (e) {
      var btn = e.target.closest('.place');
      if (btn) focus(btn.getAttribute('data-id'));
    });

    document.getElementById('reset-filters').addEventListener('click', function () {
      Array.prototype.forEach.call(chips.querySelectorAll('input'), function (n) { n.checked = true; });
      em.value = 'all'; q.value = ''; vp.checked = false;
      state = { cats: Object.keys(CATS), emirate: 'all', q: '', viewportOnly: false };
      map.flyTo([24.8, 55.2], 8, { duration: 0.6 });
      render();
    });
  }

  function init() {
    if (!document.getElementById('map')) return;
    buildMap();
    buildControls();
    render();

    var gen = document.getElementById('places-generated');
    if (gen) gen.textContent = DATA.generated;
    var tot = document.getElementById('places-total');
    if (tot) tot.textContent = DATA.counts.total;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
