/* ==========================================================================
   MiBoWi — homepage widgets
   Both of these run the same cost model the calculator page uses, so the
   numbers on the front door can never drift from the numbers inside.
   ========================================================================== */

(function () {
  'use strict';

  var M = window.MiBoWi;
  var CM = window.MiBoWiCost;
  var DATA = window.MIBOWI_COSTS;
  if (!M || !CM || !DATA) return;

  /* ---------------- Hero panel: a rotating reality check ---------------- */

  var ROTATE = ['dog-large', 'cat', 'rabbit', 'parrot', 'corn-snake'];
  var idx = 0, timer = null;

  function heroCard(id) {
    var s = CM.species(id);
    var r = CM.compute(s, CM.defaultOpts(s));
    var top = r.cats.slice(0, 4);
    var max = top[0].v;

    var html = '<div style="margin-bottom:18px">' +
      '<p class="tiny muted" style="margin-bottom:4px;letter-spacing:.09em;text-transform:uppercase;font-weight:640">' + s.group + '</p>' +
      '<h3 style="margin:0 0 2px">' + s.label + '</h3>' +
      '<p class="tiny muted" style="margin:0">' + s.sub + ' · plans out over ' + s.life + ' years</p>' +
    '</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;margin-bottom:20px">' +
      '<div style="background:var(--paper);padding:15px 16px">' +
        '<div class="stat__label">Year one</div>' +
        '<div class="stat__value" style="font-size:1.45rem">' + M.money(r.yearOne) + '</div></div>' +
      '<div style="background:var(--paper);padding:15px 16px">' +
        '<div class="stat__label">Whole life</div>' +
        '<div class="stat__value" style="font-size:1.45rem;color:var(--clay)">' + M.money(r.lifetime) + '</div></div>' +
    '</div>';

    html += '<p class="tiny muted" style="margin-bottom:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:640">Where a normal year goes</p><div class="breakdown">';
    top.forEach(function (c, i) {
      var cols = ['var(--clay)', 'var(--moss)', 'var(--gold)', 'var(--ink-4)'];
      html += '<div class="bd-row" style="grid-template-columns:minmax(96px,124px) 1fr auto">' +
        '<span class="bd-name" style="font-size:.8rem">' + c.k + '</span>' +
        '<span class="bd-track" style="height:7px"><span class="bd-fill" data-w="' + (c.v / max * 100) + '" style="background:' + cols[i] + '"></span></span>' +
        '<span class="bd-val num" style="font-size:.8rem;min-width:64px">' + M.money(c.v) + '</span></div>';
    });
    html += '</div>';

    html += '<div class="row" style="margin-top:20px;gap:8px">' +
      '<a class="btn btn--dark btn--sm" href="cost.html?species=' + s.id + '">Cost this properly</a>' +
      '<span class="tiny muted" style="margin-left:auto">' + (idx + 1) + ' / ' + ROTATE.length + '</span></div>';

    return html;
  }

  function paintHero(animate) {
    var body = document.querySelector('[data-hero-body]');
    if (!body) return;
    var apply = function () {
      body.innerHTML = heroCard(ROTATE[idx]);
      body.style.opacity = '1';
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(body.querySelectorAll('.bd-fill'), function (n) {
          n.style.width = n.getAttribute('data-w') + '%';
        });
      });
    };
    if (animate) {
      body.style.transition = 'opacity .3s ease';
      body.style.opacity = '0';
      setTimeout(apply, 300);
    } else {
      apply();
    }
  }

  function startRotation() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    clearInterval(timer);
    timer = setInterval(function () {
      if (document.hidden) return;
      idx = (idx + 1) % ROTATE.length;
      paintHero(true);
    }, 5200);
  }

  /* ---------------- Lifetime comparison card ---------------- */

  var COMPARE = ['dog-giant', 'dog-large', 'parrot', 'dog-medium', 'cat', 'dog-small',
                 'rabbit', 'chinchilla', 'bearded-dragon', 'aquarium', 'guinea-pig', 'gerbils'];

  function paintLifetime() {
    var body = document.querySelector('[data-lifetime-body]');
    if (!body) return;
    var rows = COMPARE.map(function (id) {
      var s = CM.species(id);
      return { s: s, r: CM.compute(s, CM.defaultOpts(s)) };
    }).sort(function (a, b) { return b.r.lifetime - a.r.lifetime; });

    var max = rows[0].r.lifetime;
    var html = '<div class="breakdown">';
    rows.forEach(function (row, i) {
      var col = i === 0 ? 'var(--clay)' : (i < 4 ? 'var(--moss)' : 'var(--ink-4)');
      html += '<div class="bd-row" style="grid-template-columns:minmax(104px,142px) 1fr auto">' +
        '<span class="bd-name" style="font-size:.82rem">' + row.s.label + '</span>' +
        '<span class="bd-track"><span class="bd-fill" data-w="' + (row.r.lifetime / max * 100) + '" style="background:' + col + '"></span></span>' +
        '<span class="bd-val num" style="min-width:68px">' + M.moneyShort(row.r.lifetime) + '</span></div>';
    });
    body.innerHTML = html + '</div>';

    requestAnimationFrame(function () {
      Array.prototype.forEach.call(body.querySelectorAll('.bd-fill'), function (n) {
        n.style.width = n.getAttribute('data-w') + '%';
      });
    });
  }

  function boot() {
    paintHero(false);
    paintLifetime();
    startRotation();

    var panel = document.querySelector('[data-hero-panel]');
    if (panel) {
      panel.addEventListener('mouseenter', function () { clearInterval(timer); });
      panel.addEventListener('mouseleave', startRotation);
    }

    document.addEventListener('mibowi:region', function () {
      paintHero(false);
      paintLifetime();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
