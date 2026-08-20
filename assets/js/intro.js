/* ==========================================================================
   MiBoWi — intro curtain
   The curtain dismisses itself via a CSS animation, so this file only adds
   the niceties: skip on any interaction, and tidy the node out of the DOM
   afterwards. If this script never runs, the intro still clears on its own.
   ========================================================================== */

(function () {
  'use strict';

  var el = document.getElementById('intro');
  if (!el) return;

  var finished = false;

  function remove() {
    if (finished) return;
    finished = true;
    if (el.parentNode) el.parentNode.removeChild(el);
    document.documentElement.classList.remove('intro-playing');
  }

  /* Normal path: the CSS fade-out has run its course. */
  el.addEventListener('animationend', function (e) {
    if (e.animationName === 'introOut') remove();
  });

  /* Early exit: any deliberate interaction cuts it short. */
  function skip() {
    if (finished) return;
    el.classList.add('is-skipped');
    setTimeout(remove, 360);
  }

  var skipBtn = el.querySelector('.intro__skip');
  if (skipBtn) skipBtn.addEventListener('click', skip);

  ['pointerdown', 'wheel', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, skip, { once: true, passive: true });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
  }, { once: true });

  /* Belt and braces: never let the curtain outlive its welcome.
     The deadline is read from the CSS knob rather than hard-coded, so retuning
     --intro-hold in mibowi.css can never leave this timeout stranded behind it. */
  var hold = 0;
  try {
    var raw = getComputedStyle(el).getPropertyValue('--intro-hold').trim();
    if (raw) hold = /ms$/.test(raw) ? parseFloat(raw) : parseFloat(raw) * 1000;
  } catch (e) {}
  if (!hold || isNaN(hold)) hold = 4000;
  setTimeout(remove, hold + 2500);
})();
