/* ==========================================================================
   MiBoWi — Total cost reality check
   A pure model function run three times: your choices, a lean version and a
   comfortable version. Everything is computed in USD baselines and rendered
   through the regional index in core.js.
   ========================================================================== */

(function () {
  'use strict';

  var M = window.MiBoWi;
  var DATA = window.MIBOWI_COSTS;

  var PALETTE = ['#B4522E', '#3E5C48', '#B98B2E', '#7A6A9B', '#3D7A55', '#A3412C',
                 '#4A7C94', '#8E6A3D', '#6E7F5C', '#9B5F7A', '#5C6E8E', '#A8763F',
                 '#4F7A6A', '#8A5340'];

  var form, sp, out;

  function speciesById(id) {
    for (var i = 0; i < DATA.species.length; i++) if (DATA.species[i].id === id) return DATA.species[i];
    return DATA.species[0];
  }

  /* ------------------------------------------------------------------
     The model. Pure: same options in, same numbers out.
     ------------------------------------------------------------------ */

  function compute(s, opt) {
    var n = opt.count;
    var tier = 1;
    DATA.foodTiers.forEach(function (t) { if (t.id === opt.tier) tier = t.mult; });
    var groomVisits = 0;
    DATA.groomPlans.forEach(function (g) { if (g.id === opt.groom) groomVisits = g.visits; });

    /* One-time. A second animal shares most of the equipment but none of the vet work. */
    var scale = 1 + 0.55 * (n - 1);
    var acquire  = (s.acquire[opt.route] || s.acquire.adopt) * n;
    var setup    = s.setup * scale;
    var vetSetup = s.vetSetup * n;
    var training = opt.training === 'none' ? 0
                 : opt.training === 'basic' ? s.trainBasic * n
                 : s.trainBasic * 2.6 * n;
    var deposit  = opt.petRent ? DATA.extras.petDepositOnce : 0;

    var oneTime = acquire + setup + vetSetup + training + deposit;

    /* Monthly recurring. */
    var mFood    = s.m.food * tier * n;
    var mSub     = s.m.substrate * n;
    var mPrev    = s.m.prevent * n;
    var mCons    = s.m.consum * n;
    var mUtil    = s.m.utilities * (1 + 0.3 * (n - 1));
    var mIns     = (opt.insure && s.flags.insure) ? s.insurance * n : 0;
    var mRent    = opt.petRent ? DATA.extras.petRentMonthly : 0;
    var mCare    = (s.flags.care ? opt.careDays * s.careDay * 52 / 12 : 0);

    /* Annual recurring. */
    var aVet     = s.vetAnnual * n;
    var aDental  = s.dentalAnnual * n;
    var aGroom   = (s.flags.grooming ? groomVisits * s.groomVisit * n : 0);
    var aBoard   = (s.flags.board ? opt.boardNights * s.boardDay * n : 0);
    var dmgKey   = s.group === 'Dogs' ? 'dog' : (s.group === 'Cats' ? 'cat' : 'other');
    var aDamage  = (s.damage != null ? s.damage : DATA.extras.damageAnnual[dmgKey]) * (1 + 0.4 * (n - 1));
    var aRisk    = opt.risk ? s.riskRate * s.riskCost * n : 0;

    var L = s.labels || {};
    var cats = [
      { k: 'Food',                          v: mFood * 12 },
      { k: L.substrate || 'Bedding & litter', v: mSub * 12 },
      { k: 'Parasite prevention',           v: mPrev * 12 },
      { k: L.consum || 'Toys & enrichment', v: mCons * 12 },
      { k: L.utilities || 'Heating & electricity', v: mUtil * 12 },
      { k: 'Insurance',                v: mIns * 12 },
      { k: 'Routine veterinary',       v: aVet },
      { k: 'Dental care',              v: aDental },
      { k: 'Professional grooming',    v: aGroom },
      { k: 'Walker or daycare',        v: mCare * 12 },
      { k: 'Boarding & sitting',       v: aBoard },
      { k: 'Pet rent',                 v: mRent * 12 },
      { k: 'Damage & replacement',     v: aDamage },
      { k: 'Emergency provision',      v: aRisk }
    ].filter(function (c) { return c.v > 0.5; });

    var annual = 0;
    cats.forEach(function (c) { annual += c.v; });

    var yearOne  = oneTime + annual;
    var lifetime = oneTime + annual * s.life + s.endOfLife * n;

    return {
      oneTime: oneTime, annual: annual, monthly: annual / 12,
      yearOne: yearOne, lifetime: lifetime,
      cats: cats.sort(function (a, b) { return b.v - a.v; }),
      parts: { acquire: acquire, setup: setup, vetSetup: vetSetup, training: training, deposit: deposit },
      buffer: Math.max(s.riskCost * 1.4, 400),
      n: n
    };
  }

  /* ------------------------------------------------------------------
     Reading the form
     ------------------------------------------------------------------ */

  function readOpts() {
    return {
      count:       parseInt(M.val(form, 'count', '1'), 10),
      route:       M.val(form, 'route', 'adopt'),
      tier:        M.val(form, 'tier', 'standard'),
      insure:      form.elements.insure ? form.elements.insure.checked : true,
      petRent:     form.elements.petRent ? form.elements.petRent.checked : false,
      risk:        form.elements.risk ? form.elements.risk.checked : true,
      groom:       M.val(form, 'groom', 'none'),
      careDays:    M.num(form, 'careDays', 0),
      boardNights: M.num(form, 'boardNights', 7),
      training:    M.val(form, 'training', 'basic')
    };
  }

  function leanOpts(base, s) {
    return {
      count: base.count, route: base.route, tier: 'budget', insure: false,
      petRent: base.petRent, risk: true, groom: s.flags.grooming ? 'seasonal' : 'none',
      careDays: 0, boardNights: 3, training: 'none'
    };
  }

  function plushOpts(base, s) {
    return {
      count: base.count, route: base.route, tier: 'premium', insure: s.flags.insure,
      petRent: base.petRent, risk: true, groom: s.flags.grooming ? 'regular' : 'none',
      careDays: s.flags.care ? 2 : 0, boardNights: 21,
      training: s.trainBasic ? 'ongoing' : 'none'
    };
  }

  /* ------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------ */

  function relevanceToggles() {
    var show = function (sel, on) {
      var n = form.querySelector(sel);
      if (n) n.style.display = on ? '' : 'none';
    };
    show('[data-if-groom]',    !!sp.flags.grooming);
    show('[data-if-care]',     !!sp.flags.care);
    show('[data-if-board]',    !!sp.flags.board);
    show('[data-if-insure]',   !!sp.flags.insure);
    show('[data-if-training]', sp.trainBasic > 0);
    show('[data-if-tier]',     sp.m.food > 15);

    var pairNote = form.querySelector('[data-pair-note]');
    var countField = form.querySelector('[data-count-field]');
    if (pairNote) {
      pairNote.textContent = sp.flags.pair
        ? 'Every figure below is already for a bonded pair — this species should not be kept alone.'
        : 'Figures are per animal.';
    }
    if (countField) {
      countField.querySelector('.field__label span').textContent =
        sp.flags.pair ? 'How many pairs?' : 'How many animals?';
    }
  }

  function summaryCard(r, s) {
    return '' +
      '<div class="stat-grid">' +
        '<div class="stat stat--accent"><div class="stat__label">Year one</div>' +
          '<div class="stat__value" data-y1>' + M.money(r.yearOne) + '</div>' +
          '<div class="stat__sub">Everything up front, plus twelve months</div></div>' +
        '<div class="stat"><div class="stat__label">Every year after</div>' +
          '<div class="stat__value">' + M.money(r.annual) + '</div>' +
          '<div class="stat__sub">About ' + M.money(r.monthly) + ' a month</div></div>' +
        '<div class="stat"><div class="stat__label">Whole life</div>' +
          '<div class="stat__value">' + M.money(r.lifetime) + '</div>' +
          '<div class="stat__sub">Over ' + s.life + ' years, ending included</div></div>' +
        '<div class="stat"><div class="stat__label">Cash you should be able to reach</div>' +
          '<div class="stat__value">' + M.money(r.buffer) + '</div>' +
          '<div class="stat__sub">For one bad night, not a plan</div></div>' +
      '</div>';
  }

  function breakdown(r) {
    var max = r.cats.length ? r.cats[0].v : 1;
    var html = '<div class="breakdown">';
    r.cats.forEach(function (c, i) {
      var pct = (c.v / max) * 100;
      var col = PALETTE[i % PALETTE.length];
      html += '<div class="bd-row">' +
        '<span class="bd-name"><i class="bd-swatch" style="background:' + col + '"></i>' + c.k + '</span>' +
        '<span class="bd-track"><span class="bd-fill" data-w="' + pct + '" style="background:' + col + '"></span></span>' +
        '<span class="bd-val num">' + M.money(c.v) + '</span></div>';
    });
    html += '</div>';
    return html;
  }

  function scenarios(s, base) {
    var lean  = compute(s, leanOpts(base, s));
    var yours = compute(s, base);
    var plush = compute(s, plushOpts(base, s));
    var rows = [
      ['Lean', lean, 'Budget food, no insurance, minimal grooming, almost no boarding, training done yourself.'],
      ['Your choices', yours, 'Exactly what you selected on the left.'],
      ['Comfortable', plush, 'Premium food, insured, regular grooming, some daycare, three weeks of boarding a year.']
    ];
    var html = '<div class="table-scroll"><table class="data"><thead><tr>' +
      '<th>Scenario</th><th>Monthly</th><th>Year one</th><th>Lifetime</th></tr></thead><tbody>';
    rows.forEach(function (row) {
      var isYours = row[0] === 'Your choices';
      html += '<tr' + (isYours ? ' style="background:var(--clay-soft)"' : '') + '>' +
        '<td><b>' + row[0] + '</b><div class="tiny muted" style="margin-top:3px;max-width:38ch">' + row[2] + '</div></td>' +
        '<td class="num">' + M.money(row[1].monthly) + '</td>' +
        '<td class="num">' + M.money(row[1].yearOne) + '</td>' +
        '<td class="num"><b>' + M.money(row[1].lifetime) + '</b></td></tr>';
    });
    html += '</tbody></table></div>';
    var spread = plush.lifetime - lean.lifetime;
    html += '<p class="small muted" style="margin-top:16px">The gap between lean and comfortable over a lifetime is ' +
      '<b>' + M.money(spread) + '</b>. Most of that is discretionary — how you feed, groom and cover the animal — ' +
      'which means the running cost is more within your control than the headline suggests. The vet bills are not.</p>';
    return html;
  }

  function upfrontTable(r, s, opt) {
    var rows = [
      ['Getting the animal', r.parts.acquire, DATA.routes.filter(function (x) { return x.id === opt.route; })[0].label],
      ['Equipment & habitat', r.parts.setup, 'Enclosure, bedding, bowls, carrier, the lot'],
      ['First-year medical', r.parts.vetSetup, 'Neutering, vaccine course, microchip'],
      ['Training', r.parts.training, opt.training === 'none' ? 'Skipped' : (opt.training === 'basic' ? 'A basic course' : 'Ongoing classes')],
      ['Housing deposit', r.parts.deposit, 'One-off pet deposit']
    ].filter(function (x) { return x[1] > 0.5; });

    var html = '<div class="table-scroll"><table class="data"><thead><tr><th>Before day one</th><th>What it covers</th><th>Cost</th></tr></thead><tbody>';
    rows.forEach(function (x) {
      html += '<tr><td><b>' + x[0] + '</b></td><td class="muted small">' + x[2] + '</td><td class="num">' + M.money(x[1]) + '</td></tr>';
    });
    html += '</tbody><tfoot><tr><td>Total before you start</td><td></td><td class="num">' + M.money(r.oneTime) + '</td></tr></tfoot></table></div>';
    return html;
  }

  function oopsList(s) {
    var html = '<div class="flags">';
    s.oops.forEach(function (x) {
      html += '<div class="flag flag--warn">' +
        '<svg class="flag__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">' +
        '<path d="M10 3.2l7 12.4H3z" stroke-linejoin="round"/><path d="M10 8v3.4M10 13.7v.1" stroke-linecap="round"/></svg>' +
        '<div><b>' + x[0] + '</b><p>' + x[1] + '</p></div></div>';
    });
    return html + '</div>';
  }

  function comparison(s, base) {
    var rows = DATA.species.map(function (x) {
      var o = {
        count: 1, route: 'adopt', tier: 'standard', insure: x.flags.insure,
        petRent: false, risk: true, groom: x.flags.grooming ? 'seasonal' : 'none',
        careDays: 0, boardNights: 7, training: x.trainBasic ? 'basic' : 'none'
      };
      return { s: x, r: compute(x, o) };
    }).sort(function (a, b) { return b.r.lifetime - a.r.lifetime; });

    var max = rows[0].r.lifetime;
    var html = '<div class="breakdown">';
    rows.forEach(function (row) {
      var on = row.s.id === s.id;
      var pct = (row.r.lifetime / max) * 100;
      html += '<div class="bd-row"' + (on ? ' style="font-weight:650"' : '') + '>' +
        '<span class="bd-name">' + row.s.label + '</span>' +
        '<span class="bd-track"><span class="bd-fill" data-w="' + pct + '" style="background:' +
          (on ? 'var(--clay)' : 'var(--ink-4)') + '"></span></span>' +
        '<span class="bd-val num">' + M.moneyShort(row.r.lifetime) + '</span></div>';
    });
    return html + '</div><p class="tiny muted" style="margin-top:14px">Like-for-like: one animal (or one pair), adopted, standard food, ' +
      'light grooming, a week of boarding a year, insured where a real market exists. Your own selections are not applied here.</p>';
  }

  /* ------------------------------------------------------------------
     Update cycle
     ------------------------------------------------------------------ */

  function update() {
    sp = speciesById(M.val(form, 'species', 'dog-medium'));
    relevanceToggles();

    var opt = readOpts();
    var r = compute(sp, opt);

    /* Live labels on the sliders. */
    var cd = form.querySelector('[data-careDays-val]');
    if (cd) cd.textContent = opt.careDays === 0 ? 'None' : opt.careDays + (opt.careDays === 1 ? ' day' : ' days');
    var bn = form.querySelector('[data-boardNights-val]');
    if (bn) bn.textContent = opt.boardNights === 0 ? 'None' : opt.boardNights + ' nights';

    var perYearOfLife = r.lifetime / sp.life;

    out.innerHTML =
      '<div class="card" style="margin-bottom:18px">' +
        '<div class="row-between" style="margin-bottom:20px">' +
          '<div><span class="eyebrow" style="margin-bottom:6px">' + sp.group + '</span>' +
          '<h3 style="margin:0">' + sp.label + '<span class="muted" style="font-family:var(--sans);font-size:.9rem;font-weight:400"> · ' + sp.sub + '</span></h3></div>' +
          '<span class="badge badge--clay">' + sp.life + '-year plan</span>' +
        '</div>' +
        summaryCard(r, sp) +
        '<p class="small muted" style="margin-top:18px">Averaged across the whole life you are signing up for, that is ' +
          '<b>' + M.money(perYearOfLife / 12) + ' a month</b>, every month, for ' + sp.life + ' years. ' +
          'Lifespan here is a planning figure — the realistic range is ' + sp.lifeRange[0] + ' to ' + sp.lifeRange[1] + ' years.</p>' +
      '</div>' +

      '<div class="grid grid-2">' +
        '<div class="card"><h4 style="margin-bottom:6px">Where a typical year goes</h4>' +
          '<p class="small muted" style="margin-bottom:20px">Ongoing costs only — the setup is separate.</p>' +
          breakdown(r) + '</div>' +
        '<div class="card"><h4 style="margin-bottom:6px">Before you bring them home</h4>' +
          '<p class="small muted" style="margin-bottom:20px">The part people budget for, and the smallest part of the total.</p>' +
          upfrontTable(r, sp, opt) + '</div>' +
      '</div>' +

      '<div class="card" style="margin-top:18px"><h4 style="margin-bottom:6px">Three versions of the same animal</h4>' +
        '<p class="small muted" style="margin-bottom:20px">The same species, kept three different ways.</p>' +
        scenarios(sp, opt) + '</div>' +

      '<div class="card" style="margin-top:18px"><h4 style="margin-bottom:6px">What this species actually costs people</h4>' +
        '<p class="small muted" style="margin-bottom:20px">The bills that are not in any budget spreadsheet, and are not rare.</p>' +
        oopsList(sp) + '</div>' +

      '<div class="card" style="margin-top:18px">' +
        '<details class="faq" style="border:0"><summary style="padding-top:0">Compare the lifetime cost of every species</summary>' +
        '<div class="faq__body" style="padding-right:0">' + comparison(sp, opt) + '</div></details></div>';

    requestAnimationFrame(function () {
      Array.prototype.forEach.call(out.querySelectorAll('.bd-fill'), function (n) {
        n.style.width = n.getAttribute('data-w') + '%';
      });
    });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */

  function buildSpeciesSelect() {
    var sel = form.elements.species;
    var groups = [];
    DATA.species.forEach(function (s) { if (groups.indexOf(s.group) < 0) groups.push(s.group); });
    sel.innerHTML = groups.map(function (g) {
      return '<optgroup label="' + g + '">' + DATA.species.filter(function (s) { return s.group === g; })
        .map(function (s) { return '<option value="' + s.id + '">' + s.label + ' — ' + s.sub + '</option>'; })
        .join('') + '</optgroup>';
    }).join('');
  }

  function buildRouteOptions() {
    form.querySelector('[data-routes]').innerHTML = DATA.routes.map(function (r, i) {
      return '<label class="opt"><input type="radio" name="route" value="' + r.id + '"' + (i === 0 ? ' checked' : '') + '>' +
             '<span><b>' + r.label + '</b><small>' + r.note + '</small></span></label>';
    }).join('');
    form.querySelector('[data-tiers]').innerHTML = DATA.foodTiers.map(function (t) {
      return '<label class="opt"><input type="radio" name="tier" value="' + t.id + '"' + (t.id === 'standard' ? ' checked' : '') + '>' +
             '<span><b>' + t.label + '</b><small>' + t.note + '</small></span></label>';
    }).join('');
    form.querySelector('[data-grooms]').innerHTML = DATA.groomPlans.map(function (g, i) {
      return '<label class="opt"><input type="radio" name="groom" value="' + g.id + '"' + (i === 0 ? ' checked' : '') + '>' +
             '<span>' + g.label + '</span></label>';
    }).join('');
  }

  function init() {
    form = document.getElementById('cost-form');
    out = document.getElementById('cost-out');
    if (!form || !out) return;

    buildSpeciesSelect();
    buildRouteOptions();

    /* Deep link: cost.html?species=cat */
    var q = new URLSearchParams(location.search).get('species');
    if (q && speciesById(q).id === q) form.elements.species.value = q;

    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    document.addEventListener('mibowi:region', update);

    var printBtn = document.querySelector('[data-print]');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    update();
  }

  /* Sensible defaults for any species — used by the homepage widget and by
     the comparison chart, so there is exactly one cost model in the product. */
  function defaultOpts(s) {
    return {
      count: 1, route: 'adopt', tier: 'standard', insure: s.flags.insure,
      petRent: false, risk: true, groom: s.flags.grooming ? 'seasonal' : 'none',
      careDays: 0, boardNights: 7, training: s.trainBasic ? 'basic' : 'none'
    };
  }

  window.MiBoWiCost = { compute: compute, species: speciesById, defaultOpts: defaultOpts };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
