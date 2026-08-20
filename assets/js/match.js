/* ==========================================================================
   MiBoWi — Species & breed suitability
   Scores all 69 candidates against your profile on fifteen weighted axes,
   then separates the ones that genuinely fit from the ones that are ruled
   out — and says why, because the ruled-out list is where the learning is.
   ========================================================================== */

(function () {
  'use strict';

  var M = window.MiBoWi;
  var PETS = window.MIBOWI_PETS;
  var COSTS = window.MIBOWI_COSTS;

  var form, out, current = 0;

  /* ------------------------------------------------------------------
     Profile → numbers
     ------------------------------------------------------------------ */

  var MAPS = {
    home:    { studio: 1, flat: 2, house: 3, yard: 4, rural: 5 },
    alone:   { lt4: 3, '4to6': 6, '7to9': 9, '10': 11 },
    active:  { lt15: 12, '15to30': 25, '30to60': 45, '60to90': 75, gt90: 110 },
    tol:     { low: 1, mid: 2, high: 3 },
    budget:  { b1: 1, b2: 2, b3: 3, b4: 4, b5: 5 },
    horizon: { lt3: 3, '3to7': 7, '8to15': 15, gt15: 22 },
    exp:     { first: 1, some: 2, exp: 3 }
  };

  function profile() {
    return {
      groups:  Array.prototype.slice.call(form.querySelectorAll('[name="groups"]:checked')).map(function (n) { return n.value; }),
      home:    MAPS.home[M.val(form, 'home', 'flat')] || 2,
      alone:   MAPS.alone[M.val(form, 'alone', '7to9')] || 8,
      active:  MAPS.active[M.val(form, 'active', '30to60')] || 45,
      exp:     MAPS.exp[M.val(form, 'experience', 'some')] || 2,
      groom:   MAPS.tol[M.val(form, 'groom', 'mid')] || 2,
      shed:    MAPS.tol[M.val(form, 'shed', 'mid')] || 2,
      noise:   MAPS.tol[M.val(form, 'noise', 'mid')] || 2,
      allergy: M.val(form, 'allergy', 'no'),
      kids:    M.val(form, 'kids', 'none'),
      pets:    M.val(form, 'pets', 'none'),
      budget:  MAPS.budget[M.val(form, 'budget', 'b3')] || 3,
      horizon: MAPS.horizon[M.val(form, 'horizon', '8to15')] || 15,
      climate: M.val(form, 'climate', 'temperate'),
      want:    M.val(form, 'want', 'companion'),
      train:   M.val(form, 'train', 'some')
    };
  }

  var c01 = function (n) { return M.clamp(n, 0, 1); };

  /* ------------------------------------------------------------------
     The fifteen axes
     ------------------------------------------------------------------ */

  var AXES = [
    { k: 'alone', label: 'Time alone', w: 1.6, fn: function (p, a) {
        if (a.maxAlone >= p.alone) return 1;
        return c01(1 - (p.alone - a.maxAlone) / 7);
      },
      good: 'Copes with the hours you are out',
      bad:  'Needs company sooner than you can get home' },

    { k: 'active', label: 'Daily time', w: 1.5, fn: function (p, a) {
        if (p.active >= a.dailyMin) return 1;
        return c01(0.25 + 0.75 * (p.active / a.dailyMin));
      },
      good: 'Needs about as much daily time as you have',
      bad:  'Needs more hands-on time than you said you can give' },

    { k: 'want', label: 'What you want from it', w: 1.4, fn: function (p, a) {
        if (p.want === 'companion') return a.affection / 5;
        if (p.want === 'active')    return (a.energy + a.trainable) / 10;
        if (p.want === 'roommate')  return a.independent / 5;
        return c01((6 - a.affection) / 5);
      },
      good: 'The kind of relationship you are looking for',
      bad:  'A different temperament from the one you described wanting' },

    { k: 'allergy', label: 'Allergies', w: 1.4, fn: function (p, a) {
        if (p.allergy === 'no') return 1;
        if (p.allergy === 'mild') return c01(1 - (a.allergen - 1) * 0.16);
        return a.allergen <= 2 ? 0.9 : c01(1 - (a.allergen - 1) * 0.3);
      },
      good: 'Low allergen load',
      bad:  'A common trigger for allergy and asthma sufferers' },

    { k: 'budget', label: 'Running cost', w: 1.3, fn: function (p, a) {
        if (a.costTier <= p.budget) return 1;
        return c01(1 - (a.costTier - p.budget) * 0.3);
      },
      good: 'Comfortably inside your monthly budget',
      bad:  'Costs more per month than you allowed for' },

    { k: 'space', label: 'Space', w: 1.2, fn: function (p, a) {
        if (p.home >= a.space) return 1;
        return c01(1 - (a.space - p.home) * 0.3);
      },
      good: 'Fits the space you have',
      bad:  'Wants more room than your home offers' },

    { k: 'horizon', label: 'Commitment length', w: 1.2, fn: function (p, a) {
        if (p.horizon >= a.lifeLo) return 1;
        return c01(1 - (a.lifeLo - p.horizon) / a.lifeLo);
      },
      good: 'Lives about as long as you can commit for',
      bad:  'Likely to outlive the commitment you said you could make' },

    { k: 'exp', label: 'Experience needed', w: 1.2, fn: function (p, a) {
        if (p.exp === 3) return 1;
        if (p.exp === 2) return c01((a.novice + 1.4) / 5.4);
        return a.novice / 5;
      },
      good: 'Forgiving of a first-time owner',
      bad:  'Really wants someone who has done this before' },

    { k: 'kids', label: 'Children', w: 1.2, fn: function (p, a) {
        if (p.kids === 'none') return 1;
        if (p.kids === 'teen') return c01((a.kids + 2) / 5.5);
        if (p.kids === 'mid')  return c01((a.kids + 0.8) / 5);
        return a.kids / 5;
      },
      good: 'Genuinely good with children',
      bad:  'A poor mix with children of the age you have' },

    { k: 'noise', label: 'Noise', w: 1.0, fn: function (p, a) {
        var allow = [0, 2, 3.5, 5][p.noise];
        if (a.vocal <= allow) return 1;
        return c01(1 - (a.vocal - allow) * 0.34);
      },
      good: 'Quiet enough for your situation',
      bad:  'Louder than you said you can live with' },

    { k: 'pets', label: 'Other animals', w: 1.0, fn: function (p, a) {
        if (p.pets === 'none') return 1;
        if (p.pets === 'small') return c01((a.otherPets - 0.5) / 4.5);
        return a.otherPets / 5;
      },
      good: 'Usually settles well with other animals',
      bad:  'Often difficult alongside the animals you already have' },

    { k: 'climate', label: 'Climate', w: 1.0, fn: function (p, a) {
        if (p.climate === 'hot')  return a.heat / 5;
        if (p.climate === 'cold') return a.cold / 5;
        return c01((a.heat + a.cold) / 8);
      },
      good: 'Suited to your climate',
      bad:  'Struggles in the climate you live in' },

    { k: 'groom', label: 'Grooming', w: 0.9, fn: function (p, a) {
        var allow = [0, 2, 3.5, 5][p.groom];
        if (a.grooming <= allow) return 1;
        return c01(1 - (a.grooming - allow) * 0.35);
      },
      good: 'Grooming load you are happy with',
      bad:  'More coat maintenance than you want to take on' },

    { k: 'shed', label: 'Shedding', w: 0.8, fn: function (p, a) {
        var allow = [0, 2, 3.5, 5][p.shed];
        if (a.shedding <= allow) return 1;
        return c01(1 - (a.shedding - allow) * 0.32);
      },
      good: 'Very little shedding to deal with',
      bad:  'Sheds more than you said you would tolerate' },

    { k: 'welfare', label: 'Inherited health burden', w: 0.9, fn: function (p, a) {
        return c01(1 - (a.health - 1) * 0.18);
      },
      good: 'Robust, without a heavy inherited health burden',
      bad:  'Carries a well-documented inherited health burden that you will pay for in both money and grief' },

    { k: 'train', label: 'Training appetite', w: 0.7, fn: function (p, a) {
        if (p.train === 'keen') return a.trainable / 5;
        if (p.train === 'some') return c01((a.trainable + 1.6) / 5.6);
        return c01(1 - (a.energy - 2) * 0.12);
      },
      good: 'Matches how much training you want to do',
      bad:  'Needs more structured training than you plan to give' }
  ];

  /* ------------------------------------------------------------------
     Hard blockers — the things no score should be allowed to outweigh
     ------------------------------------------------------------------ */

  function blockers(p, a) {
    var b = [];
    if (p.allergy === 'severe' && a.allergen >= 4)
      b.push('A significant allergy in the household rules this out — it is one of the top reasons animals are rehomed.');
    if (p.kids === 'young' && a.kids <= 2)
      b.push('Not safe or fair alongside children under six.');
    if (p.alone >= 10 && a.maxAlone <= 6)
      b.push('Cannot reasonably be left for the hours your home is empty.');
    if (p.budget === 1 && a.costTier >= 4)
      b.push('The monthly running cost is well beyond the budget you set.');
    if (p.home === 1 && a.space >= 4)
      b.push('Needs more space than a studio or one-bedroom can give.');
    if (p.horizon < a.lifeLo * 0.55)
      b.push('Typically lives ' + a.lifeLo + '–' + a.lifeHi + ' years, far beyond the commitment you can make.');
    if (p.active < a.dailyMin * 0.45)
      b.push('Needs roughly ' + a.dailyMin + ' minutes of hands-on time a day — more than double what you have.');
    return b;
  }

  /* ------------------------------------------------------------------
     Scoring
     ------------------------------------------------------------------ */

  function scoreAll(p) {
    return PETS.map(function (a) {
      var total = 0, weight = 0, axes = [];
      AXES.forEach(function (ax) {
        var f = c01(ax.fn(p, a));
        total += f * ax.w;
        weight += ax.w;
        axes.push({ k: ax.k, label: ax.label, fit: f, w: ax.w, good: ax.good, bad: ax.bad });
      });
      return {
        a: a,
        score: Math.round((total / weight) * 100),
        axes: axes,
        blockers: blockers(p, a),
        inGroup: p.groups.indexOf(a.group) >= 0
      };
    });
  }

  /* ------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------ */

  function dots(n, max) {
    var h = '<span class="dots">';
    for (var i = 1; i <= (max || 5); i++) h += '<i class="' + (i <= n ? 'on' : '') + '"></i>';
    return h + '</span>';
  }

  function costFor(costId) {
    for (var i = 0; i < COSTS.species.length; i++) if (COSTS.species[i].id === costId) return COSTS.species[i];
    return null;
  }

  function roughMonthly(costId) {
    var s = costFor(costId);
    if (!s) return null;
    var m = s.m.food + s.m.substrate + s.m.prevent + s.m.consum + s.m.utilities +
            (s.flags.insure ? s.insurance : 0) + (s.vetAnnual + s.dentalAnnual) / 12;
    return m;
  }

  function detail(r) {
    var a = r.a;
    var sorted = r.axes.slice().sort(function (x, y) { return (y.fit * y.w) - (x.fit * x.w); });
    var wins = sorted.filter(function (x) { return x.fit >= 0.92; }).slice(0, 3);
    var gaps = r.axes.slice().sort(function (x, y) { return (x.fit * x.w) - (y.fit * y.w); })
                     .filter(function (x) { return x.fit < 0.72; }).slice(0, 3);
    var mo = roughMonthly(a.costId);

    var h = '<div class="card card--sand card--pad-sm" style="border-radius:var(--r-md)">';
    h += '<p class="small" style="margin-bottom:16px">' + a.summary + '</p>';

    h += '<div class="pill-row" style="margin-bottom:20px">' +
         a.traits.map(function (t) { return '<span class="pill">' + t + '</span>'; }).join('') + '</div>';

    h += '<div class="spec-grid" style="margin-bottom:20px">' +
      '<div class="spec"><div class="spec__k">Lifespan</div><div class="spec__v">' + a.lifeLo + '–' + a.lifeHi + ' yrs</div></div>' +
      '<div class="spec"><div class="spec__k">Daily time</div><div class="spec__v">' + a.dailyMin + ' min</div></div>' +
      '<div class="spec"><div class="spec__k">Can be alone</div><div class="spec__v">' + (a.maxAlone >= 24 ? '1 day+' : a.maxAlone + ' hrs') + '</div></div>' +
      (mo ? '<div class="spec"><div class="spec__k">Rough monthly</div><div class="spec__v">' + M.money(mo) + '</div></div>' : '') +
      '<div class="spec"><div class="spec__k">Energy</div>' + dots(a.energy) + '</div>' +
      '<div class="spec"><div class="spec__k">Grooming</div>' + dots(a.grooming) + '</div>' +
      '<div class="spec"><div class="spec__k">Noise</div>' + dots(a.vocal) + '</div>' +
      '<div class="spec"><div class="spec__k">Affection</div>' + dots(a.affection) + '</div>' +
    '</div>';

    if (wins.length) {
      h += '<h4 style="font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);margin-bottom:10px">Why it fits you</h4><div class="flags" style="margin-bottom:16px">';
      wins.forEach(function (w) {
        h += '<div class="flag flag--good" style="padding:11px 14px"><div><p style="font-size:.85rem">' + w.good + '</p></div></div>';
      });
      h += '</div>';
    }

    h += '<h4 style="font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);margin-bottom:10px">Before you fall for it</h4><div class="flags">';
    h += '<div class="flag flag--warn" style="padding:11px 14px"><div><p style="font-size:.85rem">' + a.watch + '</p></div></div>';
    gaps.forEach(function (g) {
      h += '<div class="flag" style="padding:11px 14px"><div><p style="font-size:.85rem">' + g.bad + '.</p></div></div>';
    });
    h += '</div>';

    h += '<div class="row" style="margin-top:18px">' +
      '<a class="btn btn--ghost btn--sm" href="cost.html?species=' + a.costId + '">What it really costs &rarr;</a></div>';

    return h + '</div>';
  }

  function matchRow(r, rank) {
    var col = M.scoreColor(r.score);
    return '<div class="match-wrap" data-id="' + r.a.id + '">' +
      '<div class="match" role="button" tabindex="0" aria-expanded="false">' +
        '<span class="match__rank">' + rank + '</span>' +
        '<span><span class="match__name">' + r.a.name +
          '<span class="badge">' + r.a.group + '</span></span>' +
          '<span class="match__tags">' + r.a.traits.slice(0, 3).join(' · ') + '</span></span>' +
        '<span class="match__score"><b style="color:' + col + '">' + r.score + '</b><span>fit</span></span>' +
      '</div>' +
      '<div class="match-detail"></div></div>';
  }

  function speciesVerdict(top, p) {
    var byGroup = {};
    top.slice(0, 12).forEach(function (r) {
      byGroup[r.a.group] = (byGroup[r.a.group] || 0) + r.score;
    });
    var best = null;
    Object.keys(byGroup).forEach(function (g) { if (!best || byGroup[g] > byGroup[best]) best = g; });

    var lines = {
      'Dog':          'Your answers support a dog — the time, the space and the tolerance are all there. Which dog matters enormously, though: the gap between a Whippet and a Border Collie is far wider than the gap between a dog and a cat.',
      'Cat':          'A cat fits your life better than a dog does. Cats absorb long working days, small flats and irregular hours in a way that dogs simply cannot, without being any less attached to you.',
      'Small mammal': 'A small mammal is the honest fit here — lower cost, smaller footprint, and a commitment measured in a few years rather than fifteen. Take the pair requirements seriously; most of these animals suffer alone.',
      'Bird':         'A bird suits what you are after, but read the lifespan and the volume twice. Birds are the most commonly under-estimated pets in both dimensions.',
      'Reptile':      'A reptile is the strongest match: no allergens, no noise, no walks, and a daily commitment measured in minutes. The cost and the complexity are all in getting the enclosure right at the start.',
      'Aquatic':      'An aquarium is the best fit for your circumstances — life in the room without touch, noise, allergens or daily walks. The commitment is a standing weekly ritual rather than a daily one.'
    };
    return { group: best, line: lines[best] || '' };
  }

  function showResults() {
    var p = profile();
    if (!p.groups.length) p.groups = ['Dog', 'Cat', 'Small mammal', 'Bird', 'Reptile', 'Aquatic'];

    var all = scoreAll(p);
    var considered = all.filter(function (r) { return r.inGroup; });
    var clear   = considered.filter(function (r) { return !r.blockers.length; })
                            .sort(function (a, b) { return b.score - a.score; });
    var ruled   = considered.filter(function (r) { return r.blockers.length; })
                            .sort(function (a, b) { return b.score - a.score; });

    var verdict = clear.length ? speciesVerdict(clear, p) : null;
    var top = clear.slice(0, 10);

    var html = '';

    if (!clear.length) {
      html += '<div class="verdict" style="--vc:var(--bad)"><p class="verdict__title">Nothing here clears your constraints</p>' +
        '<p class="lede" style="font-size:1.02rem">Every animal in the groups you selected hits at least one hard blocker. That is genuinely useful information rather than a failure of the tool — it usually means one constraint is doing all the work. Widen the groups you are open to, or look at the list below to see which single answer is closing the most doors.</p></div>';
    } else {
      var head = clear[0];
      html += '<div class="verdict" style="--vc:' + M.scoreColor(head.score) + '">' +
        '<div class="verdict__grid">' +
          '<div class="dial"><svg viewBox="0 0 168 168">' +
            '<circle class="dial__track" cx="84" cy="84" r="74"/>' +
            '<circle class="dial__val" cx="84" cy="84" r="74" stroke-dasharray="' + (2 * Math.PI * 74) + '" stroke-dashoffset="' + (2 * Math.PI * 74) + '" data-dial/></svg>' +
            '<div class="dial__center"><b data-count>0</b><span>Best fit</span></div></div>' +
          '<div><span class="eyebrow">Your strongest match</span>' +
            '<p class="verdict__title" style="color:var(--ink)">' + head.a.name + '</p>' +
            '<p class="lede" style="font-size:1.02rem;margin-bottom:14px">' + head.a.summary + '</p>' +
            '<p class="small muted" style="margin:0"><b>' + verdict.group + 's, broadly.</b> ' + verdict.line + '</p>' +
          '</div></div></div>';

      html += '<div class="card" style="margin-top:18px">' +
        '<div class="row-between" style="margin-bottom:6px"><h4 style="margin:0">Your top ' + top.length + '</h4>' +
        '<span class="tiny muted">' + clear.length + ' of ' + considered.length + ' cleared your constraints</span></div>' +
        '<p class="small muted" style="margin-bottom:20px">Tap any row to open it.</p>' +
        '<div class="match-list">' +
        top.map(function (r, i) { return matchRow(r, i + 1); }).join('') +
        '</div></div>';
    }

    if (ruled.length) {
      html += '<div class="card" style="margin-top:18px">' +
        '<h4 style="margin-bottom:6px">Ruled out, and why</h4>' +
        '<p class="small muted" style="margin-bottom:20px">' + ruled.length + ' would otherwise have scored well but hit something that cannot be trained, budgeted or wished away. This is usually the most useful part of the result.</p>' +
        '<div class="flags">' +
        ruled.slice(0, 10).map(function (r) {
          return '<div class="flag flag--bad"><div><b>' + r.a.name + '</b><p>' + r.blockers[0] + '</p></div></div>';
        }).join('') +
        (ruled.length > 10 ? '<p class="tiny muted" style="margin:6px 0 0">…and ' + (ruled.length - 10) + ' more.</p>' : '') +
        '</div></div>';
    }

    html += '<div class="card card--sand" style="margin-top:18px">' +
      '<h4 style="margin-bottom:8px">A word on how to use this</h4>' +
      '<p class="small muted measure" style="margin-bottom:20px">A breed is a probability, not a promise. Every list here describes tendencies across thousands of animals, and the individual in front of you may ignore all of it — which is exactly why meeting an adult animal with a known temperament beats picking a breed from a page. Use this to narrow the field, then go and meet several.</p>' +
      '<div class="row">' +
        '<a class="btn btn--primary" href="cost.html">Cost the shortlist</a>' +
        '<button type="button" class="btn btn--ghost" data-redo>Change my answers</button>' +
        '<button type="button" class="btn btn--quiet no-print" data-print>Save as PDF</button>' +
      '</div></div>';

    out.innerHTML = html;
    form.querySelector('.wizard').style.display = 'none';
    M.revealResult(out);

    if (clear.length) {
      requestAnimationFrame(function () {
        var dial = out.querySelector('[data-dial]');
        if (dial) dial.style.strokeDashoffset = (2 * Math.PI * 74) * (1 - clear[0].score / 100);
        M.countTo(out.querySelector('[data-count]'), clear[0].score, function (n) { return Math.round(n); }, 950);
      });
    }

    /* Expandable rows */
    Array.prototype.forEach.call(out.querySelectorAll('.match'), function (row) {
      var open = function () {
        var wrap = row.parentNode;
        var det = wrap.querySelector('.match-detail');
        var isOpen = det.classList.contains('is-open');
        if (!isOpen && !det.innerHTML) {
          var id = wrap.getAttribute('data-id');
          var rec = null;
          top.forEach(function (r) { if (r.a.id === id) rec = r; });
          if (rec) det.innerHTML = detail(rec);
        }
        det.classList.toggle('is-open', !isOpen);
        row.classList.toggle('is-open', !isOpen);
        row.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
      };
      row.addEventListener('click', open);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    var pb = out.querySelector('[data-print]');
    if (pb) pb.addEventListener('click', function () { window.print(); });
    out.querySelector('[data-redo]').addEventListener('click', function () {
      out.innerHTML = '';
      out.classList.remove('is-active');
      form.querySelector('.wizard').style.display = '';
      showStep(0);
    });
  }

  /* ------------------------------------------------------------------
     Wizard
     ------------------------------------------------------------------ */

  function steps() { return form.querySelectorAll('.step'); }

  function showStep(i) {
    var nodes = steps();
    current = M.clamp(i, 0, nodes.length - 1);
    Array.prototype.forEach.call(nodes, function (n, k) { n.classList.toggle('is-active', k === current); });
    form.querySelector('[data-progress]').style.width = (current / nodes.length) * 100 + '%';
    form.querySelector('[data-progress-label]').textContent = 'Step ' + (current + 1) + ' / ' + nodes.length;
    form.querySelector('[data-back]').disabled = current === 0;
    form.querySelector('[data-next]').textContent = current === nodes.length - 1 ? 'Show my matches' : 'Continue';
    var top = form.getBoundingClientRect().top + window.scrollY - 96;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function missingOn(i) {
    var node = steps()[i];
    var groups = {};
    Array.prototype.forEach.call(node.querySelectorAll('input[type="radio"]'), function (r) {
      if (!(r.name in groups)) groups[r.name] = false;
      if (r.checked) groups[r.name] = true;
    });
    return Object.keys(groups).filter(function (k) { return !groups[k]; });
  }

  /* Prefill from a readiness run, when arriving via its result page. */
  function prefillFromReadiness() {
    var saved = M.store.get('readiness', null);
    if (!saved || !saved.constraints) return false;
    var c = saved.constraints;
    var set = function (name, value) {
      var n = form.querySelector('[name="' + name + '"][value="' + value + '"]');
      if (n) n.checked = true;
    };
    var band = function (v, cuts, vals) {
      for (var i = 0; i < cuts.length; i++) if (v <= cuts[i]) return vals[i];
      return vals[vals.length - 1];
    };
    set('alone',   band(c.alone, [3, 6, 9], ['lt4', '4to6', '7to9', '10']));
    set('active',  band(c.active, [15, 30, 60, 90], ['lt15', '15to30', '30to60', '60to90', 'gt90']));
    set('home',    { studio: 'studio', flat: 'flat', house: 'house', yard: 'yard' }[c.space] || 'flat');
    set('budget',  'b' + M.clamp(c.budget, 1, 5));
    set('allergy', c.allergy === 'severe' ? 'severe' : (c.allergy === 'mild' ? 'mild' : 'no'));
    set('horizon', band(c.horizon, [3, 7, 15], ['lt3', '3to7', '8to15', 'gt15']));
    set('experience', c.novice === 'exp' ? 'exp' : (c.novice === 'some' ? 'some' : 'first'));
    return true;
  }

  function init() {
    form = document.getElementById('match-form');
    out = document.getElementById('match-out');
    if (!form || !out) return;

    showStep(0);

    var params = new URLSearchParams(location.search);
    if (params.get('from') === 'readiness') {
      var did = prefillFromReadiness();
      var banner = document.querySelector('[data-prefill-note]');
      if (banner) banner.style.display = did ? '' : 'none';
    }

    form.querySelector('[data-next]').addEventListener('click', function () {
      var missing = missingOn(current);
      if (missing.length) {
        var node = form.querySelector('.step.is-active [name="' + missing[0] + '"]').closest('.field');
        node.style.outline = '2px solid var(--bad)';
        node.style.outlineOffset = '10px';
        setTimeout(function () { node.style.outline = 'none'; }, 2200);
        window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        return;
      }
      if (current === steps().length - 1) showResults();
      else showStep(current + 1);
    });

    form.querySelector('[data-back]').addEventListener('click', function () { showStep(current - 1); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    document.addEventListener('mibowi:region', function () { if (out.innerHTML) showResults(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
