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
  var RATED = ALL.filter(function (p) { return typeof p.rating === 'number'; }).length;

  /* Stable index on every record, so markers and list rows always agree. */
  ALL.forEach(function (p, i) { p.i = i; });

  var map, layer, markers = {};

  var DEFAULTS = {
    cats: Object.keys(CATS), emirate: 'all', q: '', minRating: 0,
    sort: 'name', needPhone: false, needWeb: false, needHours: false, viewportOnly: false
  };
  var state = Object.assign({}, DEFAULTS);

  /* --------------------------------------------------------------- filter */

  function matches(p) {
    if (state.cats.indexOf(p.cat) < 0) return false;
    if (state.emirate !== 'all' && p.emirate !== state.emirate) return false;
    if (state.minRating && !(typeof p.rating === 'number' && p.rating >= state.minRating)) return false;
    if (state.needPhone && !p.phone) return false;
    if (state.needWeb && !p.web) return false;
    if (state.needHours && !p.hours) return false;
    if (state.q) {
      var hay = (p.name + ' ' + (p.area || '') + ' ' + p.emirate + ' ' +
                 ((CATS[p.cat] || {}).label || '')).toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    if (state.viewportOnly && map && !map.getBounds().contains([p.lat, p.lon])) return false;
    return true;
  }

  function sortRows(rows) {
    var c = map ? map.getCenter() : null;
    var by = {
      name: function (a, b) { return a.name.localeCompare(b.name); },
      rating: function (a, b) { return (b.rating || -1) - (a.rating || -1) || a.name.localeCompare(b.name); },
      reviews: function (a, b) { return (b.reviews || -1) - (a.reviews || -1) || a.name.localeCompare(b.name); },
      near: function (a, b) {
        if (!c) return 0;
        var d = function (p) {
          var dy = p.lat - c.lat, dx = (p.lon - c.lng) * Math.cos(p.lat * Math.PI / 180);
          return dy * dy + dx * dx;
        };
        return d(a) - d(b);
      }
    };
    return rows.sort(by[state.sort] || by.name);
  }

  function visible() { return sortRows(ALL.filter(matches)); }

  function activeFilterCount() {
    var n = 0;
    if (state.cats.length !== Object.keys(CATS).length) n++;
    if (state.emirate !== 'all') n++;
    if (state.q) n++;
    if (state.minRating) n++;
    if (state.needPhone) n++;
    if (state.needWeb) n++;
    if (state.needHours) n++;
    if (state.viewportOnly) n++;
    return n;
  }

  /* ------------------------------------------------------------ map setup */

  function icon(p) {
    var tint = (CATS[p.cat] || {}).tint || '#B4522E';
    return window.L.divIcon({
      className: 'pin-wrap',
      html: '<span class="pin" style="--pin:' + tint + '"></span>',
      iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10]
    });
  }

  function stars(p, cls) {
    if (typeof p.rating !== 'number') return '';
    return '<span class="stars ' + (cls || '') + '">' +
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z"/></svg>' +
      '<b>' + p.rating.toFixed(1) + '</b>' +
      (p.reviews ? '<i>(' + p.reviews.toLocaleString('en-US') + ')</i>' : '') +
      '</span>';
  }

  function popup(p) {
    var cat = CATS[p.cat] || { label: p.cat };
    var h = '<div class="pop">';
    h += '<span class="pop__cat" style="color:' + cat.tint + '">' + M.esc(cat.label) + '</span>';
    h += '<b class="pop__name">' + M.esc(p.name) + '</b>';
    if (typeof p.rating === 'number') h += '<p class="pop__rating">' + stars(p) + '</p>';
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
    map = window.L.map('map', { center: [24.8, 55.2], zoom: 8, scrollWheelZoom: false });
    map.on('click', function () { map.scrollWheelZoom.enable(); });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    layer = window.L.layerGroup().addTo(map);

    /* Keyed by index rather than id: a duplicate id would otherwise overwrite
       a marker and silently lose a pin. */
    ALL.forEach(function (p, i) {
      var m = window.L.marker([p.lat, p.lon], { icon: icon(p), title: p.name });
      m.bindPopup(popup(p), { closeButton: true, maxWidth: 260 });
      markers[i] = m;
    });

    map.on('moveend', function () { if (state.viewportOnly || state.sort === 'near') render(); });
  }

  /* ------------------------------------------------------------- rendering */

  function render() {
    var rows = visible();

    layer.clearLayers();
    rows.forEach(function (p) { layer.addLayer(markers[p.i]); });

    var list = document.getElementById('place-list');
    if (!rows.length) {
      list.innerHTML = '<p class="small muted" style="padding:20px 4px">Nothing matches those filters. ' +
        'Widen the categories, or clear the search.</p>';
    } else {
      list.innerHTML = rows.map(function (p) {
        var cat = CATS[p.cat] || { label: p.cat, tint: 'var(--clay)' };
        return '<button class="place" type="button" data-i="' + p.i + '">' +
          '<span class="place__dot" style="background:' + cat.tint + '"></span>' +
          '<span class="place__text"><b>' + M.esc(p.name) + '</b>' +
          '<small>' + M.esc([cat.label, p.area || p.emirate].filter(Boolean).join(' · ')) + '</small></span>' +
          stars(p, 'stars--sm') +
        '</button>';
      }).join('');
    }

    document.getElementById('place-count').textContent =
      rows.length + (rows.length === 1 ? ' place' : ' places');

    var badge = document.getElementById('filter-count');
    var n = activeFilterCount();
    badge.textContent = n ? n + ' filter' + (n === 1 ? '' : 's') : '';
    badge.style.display = n ? '' : 'none';

    Array.prototype.forEach.call(document.querySelectorAll('[data-cat-count]'), function (node) {
      var c = node.getAttribute('data-cat-count');
      node.textContent = ALL.filter(function (p) { return p.cat === c; }).length;
    });
  }

  function focus(i) {
    var p = ALL[i];
    if (!p) return;
    map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 14), { duration: 0.7 });
    var m = markers[i];
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
    em.innerHTML = '<option value="all">Every emirate</option>' +
      Object.keys(DATA.counts.byEmirate).sort().map(function (n) {
        return '<option value="' + n + '">' + n + ' (' + DATA.counts.byEmirate[n] + ')</option>';
      }).join('');

    /* Rating controls only exist when the dataset actually carries ratings —
       a dead filter is worse than an honest explanation. */
    var rateBox = document.getElementById('rating-filter');
    if (RATED > 0) {
      rateBox.innerHTML = [0, 3, 4, 4.5].map(function (v) {
        return '<label class="opt"><input type="radio" name="minRating" value="' + v + '"' +
          (v === 0 ? ' checked' : '') + '><span>' + (v ? v + '+' : 'Any') + '</span></label>';
      }).join('');
      rateBox.addEventListener('change', function () {
        state.minRating = parseFloat(M.val(rateBox.closest('form') || document, 'minRating', 0)) || 0;
        var checked = rateBox.querySelector('input:checked');
        state.minRating = checked ? parseFloat(checked.value) : 0;
        render();
      });
    } else {
      /* Kept deliberately short and user-facing: the map page is not the place
         for pipeline detail. The explanation lives on the method page. */
      document.getElementById('rating-field').innerHTML =
        '<div class="field__label"><span>Ratings</span></div>' +
        '<p class="tiny muted" style="margin:0">No ratings in this dataset yet. ' +
        '<a href="method.html#ratings">How ratings work here</a>.</p>';
    }

    var sort = document.getElementById('sort-by');
    var opts = [['name', 'Name (A–Z)'], ['near', 'Nearest to map centre']];
    if (RATED > 0) opts.splice(1, 0, ['rating', 'Highest rated'], ['reviews', 'Most reviewed']);
    sort.innerHTML = opts.map(function (o) {
      return '<option value="' + o[0] + '">' + o[1] + '</option>';
    }).join('');

    chips.addEventListener('change', function () {
      state.cats = Array.prototype.slice.call(chips.querySelectorAll('input:checked'))
        .map(function (n) { return n.value; });
      render();
    });
    em.addEventListener('change', function () { state.emirate = em.value; render(); });
    sort.addEventListener('change', function () { state.sort = sort.value; render(); });

    var q = document.getElementById('place-search');
    q.addEventListener('input', function () { state.q = q.value.trim().toLowerCase(); render(); });

    [['need-phone', 'needPhone'], ['need-web', 'needWeb'], ['need-hours', 'needHours'],
     ['viewport-only', 'viewportOnly']].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el) return;
      el.addEventListener('change', function () { state[pair[1]] = el.checked; render(); });
    });

    document.getElementById('place-list').addEventListener('click', function (e) {
      var btn = e.target.closest('.place');
      if (btn) focus(parseInt(btn.getAttribute('data-i'), 10));
    });

    document.getElementById('reset-filters').addEventListener('click', function () {
      Array.prototype.forEach.call(chips.querySelectorAll('input'), function (n) { n.checked = true; });
      em.value = 'all'; q.value = ''; sort.value = 'name';
      ['need-phone', 'need-web', 'need-hours', 'viewport-only'].forEach(function (id) {
        var el = document.getElementById(id); if (el) el.checked = false;
      });
      var anyRating = rateBox.querySelector('input[value="0"]');
      if (anyRating) anyRating.checked = true;
      state = Object.assign({}, DEFAULTS);
      map.flyTo([24.8, 55.2], 8, { duration: 0.6 });
      render();
    });
  }

  function init() {
    if (!document.getElementById('map')) return;
    buildMap();
    buildControls();
    render();

    var tot = document.getElementById('places-total');
    if (tot) tot.textContent = DATA.counts.total;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
