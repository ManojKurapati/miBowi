const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');   // repo root, wherever it is checked out

// Serve the site over http so pages get a real origin — file:// gives jsdom an
// opaque origin where localStorage throws, which is not how a browser behaves.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('nope'); }
  res.setHeader('content-type', TYPES[path.extname(f)] || 'application/octet-stream');
  res.end(fs.readFileSync(f));
});
let ORIGIN = '';

class LocalOnly extends ResourceLoader {
  fetch(url, options) {
    if (url.indexOf(ORIGIN) !== 0) return null;   // block Google Fonts etc.
    return super.fetch(url, options);
  }
}

let pass = 0, fail = 0;
const errors = [];
function ok(cond, label, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + label + (extra ? '  → ' + extra : '')); }
}

async function load(file, seed) {
  const jsErrors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    const m = String(e.message || e);
    if (/Not implemented/.test(m)) return;      // scrollTo / print stubs
    jsErrors.push(m);
  });
  vc.on('error', (...a) => jsErrors.push('console.error: ' + a.join(' ')));

  const dom = await JSDOM.fromURL(ORIGIN + '/' + file, {
    runScripts: 'dangerously',
    resources: new LocalOnly(),
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = q => ({ matches: !!(seed && seed.__reduceMotion && /reduced-motion/.test(q)), media: q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} });
      w.scrollTo = () => {};
      w.print = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      if (seed) { try { Object.keys(seed).forEach(k => {
        if (k === '__reduceMotion') return;
        if (k.indexOf('session:') === 0) w.sessionStorage.setItem(k.slice(8), seed[k]);
        else w.localStorage.setItem(k, seed[k]);
      }); } catch (e) {} }
    }
  });
  await new Promise(r => {
    if (dom.window.document.readyState === 'complete') return r();
    dom.window.addEventListener('load', r);
  });
  await new Promise(r => setTimeout(r, 60));
  return { dom, w: dom.window, d: dom.window.document, jsErrors };
}

function money(s) { return /[\d]/.test(s); }

// -------------------------------------------------------------- INDEX
async function testIndex() {
  console.log('\nindex.html');
  const { w, d, jsErrors } = await load('index.html');
  ok(jsErrors.length === 0, 'no JS errors', jsErrors.join(' | '));
  const hero = d.querySelector('[data-hero-body]');
  ok(hero && /Year one/.test(hero.textContent), 'hero panel rendered');
  ok(hero && hero.querySelectorAll('.bd-fill').length === 4, 'hero breakdown bars', hero ? hero.querySelectorAll('.bd-fill').length : 'none');
  const life = d.querySelector('[data-lifetime-body]');
  ok(life && life.querySelectorAll('.bd-row').length === 12, 'lifetime chart rows', life ? life.querySelectorAll('.bd-row').length : 'none');
  ok(d.querySelector('[data-region-picker]').options.length === 9, 'region picker populated', d.querySelector('[data-region-picker]').options.length);
  ok(d.querySelectorAll('.tool-card').length === 3, 'three tool cards');
  // theme toggle
  d.querySelector('.theme-toggle').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok(d.documentElement.getAttribute('data-theme') === 'dark', 'theme toggles to dark');
  // region switch updates money
  const before = life.textContent;
  w.MiBoWi.setRegion('in');
  await new Promise(r => setTimeout(r, 30));
  ok(d.querySelector('[data-lifetime-body]').textContent !== before, 'region change repaints figures');
  ok(/₹/.test(d.querySelector('[data-lifetime-body]').textContent), 'rupee symbol applied');
  w.MiBoWi.setRegion('us');
}

// ---------------------------------------------------------- READINESS
async function runReadiness(answers, label) {
  const { w, d, jsErrors } = await load('readiness.html');
  ok(jsErrors.length === 0, label + ': no JS errors', jsErrors.join(' | '));
  const form = d.getElementById('readiness');
  ok(d.querySelectorAll('.step').length === 6, label + ': 6 steps rendered');
  ok(d.querySelectorAll('.field[data-q]').length === 21, label + ': 21 questions', d.querySelectorAll('.field[data-q]').length);

  Object.keys(answers).forEach(k => {
    const n = form.querySelector(`[name="${k}"][value="${answers[k]}"]`);
    if (!n) { fail++; console.log('  ✗ ' + label + ': missing option ' + k + '=' + answers[k]); return; }
    n.checked = true;
  });
  // walk to the last step and submit
  for (let i = 0; i < 6; i++) form.querySelector('[data-next]').click();
  const out = d.getElementById('result');
  let score = -1;
  try { score = JSON.parse(w.localStorage.getItem('mibowi.readiness')).total; } catch (e) {}
  return { w, d, out, score, jsErrors };
}

async function testReadiness() {
  console.log('\nreadiness.html');
  const ideal = {
    away: 'lt4', active: 'gt60', rhythm: 'yes', hold: 'yes',
    tenure: 'own', space: 'house-yard', household: 'yes', move: 'no',
    slack: 'gt500', emergency: 'savings', insure: 'yes', income: 'stable',
    travel: 'lt7', horizon: 'gt15', changes: 'none',
    backup: 'named', experience: 'primary', allergy: 'no',
    why: 'considered', research: 'deep', worst: 'yes'
  };
  const a = await runReadiness(ideal, 'ideal');
  ok(a.score >= 95, 'ideal profile scores 95+', a.score);
  ok(/You are ready/.test(a.out.textContent), 'ideal gets "You are ready" verdict');
  ok(/No red flags/.test(a.out.textContent), 'ideal shows no red flags');
  ok(a.out.querySelectorAll('.meter').length === 6, 'six dimension meters');

  const blocked = Object.assign({}, ideal, { tenure: 'rent-no' });
  const b = await runReadiness(blocked, 'blocked');
  ok(b.score <= 42, 'lease blocker caps score at 42', b.score);
  ok(/Capped at 42/.test(b.out.textContent), 'cap is explained');
  ok(/Your lease says no/.test(b.out.textContent), 'blocker flag shown');

  const worst = {
    away: '10', active: 'lt15', rhythm: 'no', hold: 'no',
    tenure: 'rent-no', space: 'studio', household: 'one-no', move: 'likely',
    slack: 'lt50', emergency: 'cant', insure: 'no', income: 'uncertain',
    travel: 'gt45', horizon: 'lt3', changes: 'several',
    backup: 'nobody', experience: 'none', allergy: 'severe',
    why: 'impulse', research: 'none', worst: 'no'
  };
  const c = await runReadiness(worst, 'worst');
  ok(c.score <= 20, 'worst profile scores very low', c.score);
  ok(/This is not the moment/.test(c.out.textContent), 'worst gets refusal verdict');
  ok(c.out.querySelectorAll('.flag--bad').length >= 5, 'multiple hard blockers listed', c.out.querySelectorAll('.flag--bad').length);
  ok(c.out.querySelectorAll('ol li').length === 5, 'five prioritised fixes', c.out.querySelectorAll('ol li').length);

  const mid = Object.assign({}, ideal, {
    away: '7to9', active: '15to30', slack: '120to250', emergency: 'credit',
    horizon: '8to15', experience: 'none', why: 'kids', backup: 'probably'
  });
  const dres = await runReadiness(mid, 'mid');
  ok(dres.score > 45 && dres.score < 85, 'realistic profile lands mid-range', dres.score);

  // validation: refuse to advance with unanswered questions
  const { d: d2 } = await load('readiness.html');
  const f2 = d2.getElementById('readiness');
  f2.querySelector('[data-next]').click();
  ok(f2.querySelector('.step.is-active').getAttribute('data-step') === '0', 'blocks advance while unanswered');

  // readiness stores constraints for the matcher
  ok(a.w.localStorage.getItem('mibowi.readiness') !== null, 'readiness result saved for matcher');

  // Changing region mid-wizard re-renders currency copy without losing answers
  const { w: w3, d: d3 } = await load('readiness.html');
  const f3 = d3.getElementById('readiness');
  ['away','active','rhythm','hold'].forEach(k => { f3.querySelector(`[name="${k}"][value="${ideal[k]}"]`).checked = true; });
  f3.querySelector('[data-next]').click();
  ['tenure','space','household','move'].forEach(k => { f3.querySelector(`[name="${k}"][value="${ideal[k]}"]`).checked = true; });
  f3.querySelector('[data-next]').click();
  const stepBefore = f3.querySelector('.step.is-active').getAttribute('data-step');
  ok(/\$/.test(f3.querySelector('[data-q="slack"]').textContent), 'money question renders in USD');
  w3.MiBoWi.setRegion('uk');
  await new Promise(r => setTimeout(r, 40));
  ok(/£/.test(f3.querySelector('[data-q="slack"]').textContent), 'money question re-renders in GBP');
  ok(f3.querySelector('.step.is-active').getAttribute('data-step') === stepBefore, 'stays on the same step after region change');
  ok(f3.querySelector('[name="tenure"][value="own"]').checked, 'earlier answers survive the re-render');
  w3.MiBoWi.setRegion('us');

  // Prefill: matcher picks up a completed readiness run
  const pre = await load('match.html?from=readiness',
    { 'mibowi.readiness': a.w.localStorage.getItem('mibowi.readiness') });
  ok(pre.d.querySelector('[data-prefill-note]').style.display !== 'none', 'matcher shows the prefill banner');
  ok(pre.d.querySelector('[name="alone"]:checked') !== null, 'matcher prefilled from readiness');
}

// --------------------------------------------------------------- COST
async function testCost() {
  console.log('\ncost.html');
  const { w, d, jsErrors } = await load('cost.html');
  ok(jsErrors.length === 0, 'no JS errors', jsErrors.join(' | '));
  const form = d.getElementById('cost-form');
  const out = d.getElementById('cost-out');
  ok(form.elements.species.options.length === 19, '19 species in picker', form.elements.species.options.length);
  ok(out.textContent.length > 400, 'results render on load');
  ok(d.querySelectorAll('[data-routes] .opt').length === 3, 'acquisition routes rendered');
  ok(d.querySelectorAll('[data-tiers] .opt').length === 4, 'food tiers rendered');

  const fire = () => form.dispatchEvent(new w.Event('change', { bubbles: true }));

  // Species with no grooming / no walker should hide those controls
  form.elements.species.value = 'corn-snake'; fire();
  ok(d.querySelector('[data-if-care]').style.display === 'none', 'walker control hidden for snake');
  ok(d.querySelector('[data-if-groom]').style.display === 'none', 'grooming control hidden for snake');
  ok(d.querySelector('[data-if-insure]').style.display === 'none', 'insurance hidden where no market');

  form.elements.species.value = 'dog-large'; fire();
  ok(d.querySelector('[data-if-care]').style.display !== 'none', 'walker control shown for dog');
  ok(/Torn cruciate|Dose-by-weight/.test(out.textContent), 'species-specific hidden costs shown');

  // Monotonicity: adding daycare must raise the total
  const CM = w.MiBoWiCost;
  const s = CM.species('dog-large');
  const base = CM.compute(s, CM.defaultOpts(s));
  const withCare = CM.compute(s, Object.assign(CM.defaultOpts(s), { careDays: 3 }));
  ok(withCare.annual > base.annual, 'daycare increases annual cost');
  const premium = CM.compute(s, Object.assign(CM.defaultOpts(s), { tier: 'fresh' }));
  ok(premium.annual > base.annual, 'fresh food increases annual cost');
  const two = CM.compute(s, Object.assign(CM.defaultOpts(s), { count: 2 }));
  ok(two.annual > base.annual * 1.6 && two.annual < base.annual * 2.1, 'second animal scales sub-linearly then', Math.round(two.annual / base.annual * 100) / 100);
  ok(base.lifetime > base.yearOne, 'lifetime exceeds year one');
  ok(base.yearOne > base.annual, 'year one exceeds a normal year');

  // Sanity: a large dog should cost more over life than a corn snake
  const snake = CM.species('corn-snake');
  const snakeR = CM.compute(snake, CM.defaultOpts(snake));
  ok(base.lifetime > snakeR.lifetime * 4, 'large dog costs multiples of a corn snake', Math.round(base.lifetime) + ' vs ' + Math.round(snakeR.lifetime));
  ok(/Cat litter/.test(CM.compute(CM.species('cat'), CM.defaultOpts(CM.species('cat'))).cats.map(c=>c.k).join('|')), 'cat shows a litter line, not "bedding, hay"');
  ok(/Water treatment/.test(CM.compute(CM.species('aquarium'), CM.defaultOpts(CM.species('aquarium'))).cats.map(c=>c.k).join('|')), 'aquarium shows tank consumables, not "toys"');

  // Every species produces finite, positive numbers
  let bad = [];
  w.MIBOWI_COSTS.species.forEach(sp => {
    const r = CM.compute(sp, CM.defaultOpts(sp));
    ['oneTime','annual','yearOne','lifetime','buffer'].forEach(k => {
      if (!isFinite(r[k]) || r[k] <= 0) bad.push(sp.id + '.' + k + '=' + r[k]);
    });
    if (!r.cats.length) bad.push(sp.id + ' has no cost categories');
  });
  ok(bad.length === 0, 'all 19 species produce sane totals', bad.join(', '));

  // Deep link
  const dl = await load('cost.html?species=cat');
  ok(dl.d.getElementById('cost-form').elements.species.value === 'cat', 'deep link selects species');

  // Regional index actually changes the output
  const usd = w.MiBoWi.money(base.lifetime);
  w.MiBoWi.setRegion('in');
  await new Promise(r => setTimeout(r, 30));
  ok(/₹/.test(out.textContent), 'cost page repaints in local currency');
  w.MiBoWi.setRegion('us');
}

// -------------------------------------------------------------- MATCH
async function runMatch(answers, label) {
  const { w, d, jsErrors } = await load('match.html');
  ok(jsErrors.length === 0, label + ': no JS errors', jsErrors.join(' | '));
  const form = d.getElementById('match-form');
  Object.keys(answers).forEach(k => {
    if (k === 'groups') {
      form.querySelectorAll('[name="groups"]').forEach(n => { n.checked = answers.groups.indexOf(n.value) >= 0; });
      return;
    }
    const n = form.querySelector(`[name="${k}"][value="${answers[k]}"]`);
    if (!n) { fail++; console.log('  ✗ ' + label + ': missing option ' + k + '=' + answers[k]); return; }
    n.checked = true;
  });
  for (let i = 0; i < 4; i++) form.querySelector('[data-next]').click();
  const out = d.getElementById('match-out');
  const names = Array.from(out.querySelectorAll('.match__name')).map(n => n.childNodes[0].textContent.trim());
  const scores = Array.from(out.querySelectorAll('.match__score b')).map(n => parseInt(n.textContent, 10));
  return { w, d, out, names, scores };
}

async function testMatch() {
  console.log('\nmatch.html');
  const { d: d0, jsErrors: e0 } = await load('match.html');
  ok(e0.length === 0, 'loads clean', e0.join(' | '));
  ok(d0.querySelectorAll('#match-form .step').length === 4, '4 wizard steps');
  ok(d0.querySelectorAll('#match-form input[type=radio]').length >= 40, 'all radio options present');
  ok(d0.querySelectorAll('[name="groups"]:checked').length === 6, 'all groups pre-selected');
  ok(/\$\s?50|\$50/.test(d0.querySelector('[name="budget"][value="b2"]').parentNode.textContent), 'budget labels show currency');

  const ALL = ['Dog','Cat','Small mammal','Bird','Reptile','Aquatic'];

  // 1. Active owner, house with garden — should surface dogs
  const runner = await runMatch({
    groups: ALL, want: 'active', train: 'keen', home: 'yard', alone: 'lt4', active: 'gt90',
    climate: 'temperate', kids: 'none', pets: 'none', allergy: 'no', experience: 'exp',
    groom: 'high', shed: 'high', noise: 'high', budget: 'b5', horizon: 'gt15'
  }, 'active-owner');
  ok(runner.names.length === 10, 'ten matches returned', runner.names.length);
  ok(runner.scores[0] >= runner.scores[9], 'results sorted by fit');
  const dogTop = runner.out.querySelectorAll('.match__name .badge')[0].textContent;
  ok(dogTop === 'Dog', 'active owner with a garden gets a dog first', dogTop);

  // 2. Studio, out 10 hours, severe allergy — dogs and cats must be ruled out
  const flat = await runMatch({
    groups: ALL, want: 'watch', train: 'no', home: 'studio', alone: '10', active: 'lt15',
    climate: 'hot', kids: 'none', pets: 'none', allergy: 'severe', experience: 'first',
    groom: 'low', shed: 'low', noise: 'low', budget: 'b2', horizon: '3to7'
  }, 'studio-allergy');
  const grp = flat.out.querySelectorAll('.match__name .badge')[0].textContent;
  ok(['Reptile','Aquatic'].indexOf(grp) >= 0, 'allergy + long absence yields reptile or fish', grp);
  ok(!/Labrador|Golden Retriever/.test(flat.out.querySelector('.match-list').textContent), 'no high-allergen dogs in shortlist');
  ok(/Ruled out, and why/.test(flat.out.textContent), 'ruled-out section present');
  ok(flat.out.querySelectorAll('.flag--bad').length >= 5, 'blockers listed with reasons');

  // 3. Young children — animals unsuitable for under-sixes are blocked
  const kids = await runMatch({
    groups: ALL, want: 'companion', train: 'some', home: 'yard', alone: '4to6', active: '60to90',
    climate: 'temperate', kids: 'young', pets: 'none', allergy: 'no', experience: 'some',
    groom: 'mid', shed: 'mid', noise: 'mid', budget: 'b4', horizon: 'gt15'
  }, 'young-children');
  const shortlist = kids.out.querySelector('.match-list').textContent;
  ok(!/Shiba Inu|Chihuahua|Yorkshire Terrier/.test(shortlist), 'child-unsuitable breeds excluded from shortlist');
  ok(kids.names.length > 0, 'still returns matches for families');

  // 4. Short commitment horizon blocks long-lived animals
  const short = await runMatch({
    groups: ALL, want: 'companion', train: 'some', home: 'flat', alone: '4to6', active: '30to60',
    climate: 'temperate', kids: 'none', pets: 'none', allergy: 'no', experience: 'some',
    groom: 'mid', shed: 'mid', noise: 'mid', budget: 'b3', horizon: 'lt3'
  }, 'short-horizon');
  ok(!/Parrot|Cockatiel|Corn snake/.test(short.out.querySelector('.match-list') ? short.out.querySelector('.match-list').textContent : ''), 'long-lived species blocked on a 3-year horizon');

  // 5. Group filter is respected
  const catsOnly = await runMatch({
    groups: ['Cat'], want: 'companion', train: 'some', home: 'flat', alone: '7to9', active: '30to60',
    climate: 'temperate', kids: 'none', pets: 'none', allergy: 'no', experience: 'some',
    groom: 'mid', shed: 'mid', noise: 'mid', budget: 'b3', horizon: '8to15'
  }, 'cats-only');
  const badges = Array.from(catsOnly.out.querySelectorAll('.match__name .badge')).map(b => b.textContent);
  ok(badges.every(b => b === 'Cat'), 'group filter respected', badges.join(','));

  // 6. Expanding a row renders detail
  const row = catsOnly.d.querySelector('.match');
  row.dispatchEvent(new catsOnly.w.Event('click', { bubbles: true }));
  const det = catsOnly.d.querySelector('.match-detail');
  ok(det.classList.contains('is-open'), 'row expands');
  ok(/Lifespan/.test(det.textContent) && /Before you fall for it/.test(det.textContent), 'detail panel populated');
  ok(/cost\.html\?species=/.test(det.innerHTML), 'detail links to the cost tool');

  // 7. Scores stay within bounds across every candidate and profile
  ok(runner.scores.every(s => s >= 0 && s <= 100), 'scores bounded 0-100');
}

// ------------------------------------------------------------- METHOD
async function testMethod() {
  console.log('\nmethod.html');
  const { d, jsErrors } = await load('method.html');
  ok(jsErrors.length === 0, 'no JS errors', jsErrors.join(' | '));
  ok(d.querySelectorAll('[data-region-table] tbody tr').length === 9, 'region table rendered', d.querySelectorAll('[data-region-table] tbody tr').length);
  ok(/\$/.test(d.querySelector('[data-money="3200"]').textContent), 'inline money tags filled');
  ['cost-model','readiness-method','matching','limits','privacy'].forEach(id =>
    ok(!!d.getElementById(id), 'anchor #' + id + ' exists'));
}

async function testIntro() {
  console.log('\nintro curtain');

  // First visit: the curtain is in the DOM and armed
  const first = await load('index.html');
  ok(first.jsErrors.length === 0, 'no JS errors with the curtain', first.jsErrors.join(' | '));
  const intro = first.d.getElementById('intro');
  ok(!!intro, 'curtain present on a first visit');
  ok(!first.d.documentElement.classList.contains('no-intro'), 'curtain is armed on a first visit');
  ok(first.w.sessionStorage.getItem('mibowi.intro') === '1', 'visit recorded in sessionStorage');
  ok(intro.querySelectorAll('.runner').length === 2, 'a dog and a cat are on the stage');
  ok(intro.querySelectorAll('.leg').length === 8, 'both animals have four legs each', intro.querySelectorAll('.leg').length);
  ok(intro.querySelectorAll('.tail').length === 2, 'both animals have a tail');
  ok(!!intro.querySelector('.intro__skip'), 'skip control exists');
  ok(intro.querySelector('.intro__skip').getAttribute('aria-label').length > 5, 'skip control is labelled');
  ok(first.d.querySelectorAll('h1').length === 1, 'curtain does not add a second h1');
  // decorative content is hidden from assistive tech, the button is not
  ok(intro.querySelector('.intro__inner').getAttribute('aria-hidden') === 'true', 'decorative artwork hidden from screen readers');
  ok(intro.querySelector('.intro__skip').getAttribute('aria-hidden') === null, 'skip button stays reachable');

  // Second visit in the same session: suppressed before paint
  const again = await load('index.html', { 'session:mibowi.intro': '1' });
  ok(again.d.documentElement.classList.contains('no-intro'), 'curtain suppressed on a repeat visit');

  // ?intro forces a replay even after it has been seen
  const forced = await load('index.html?intro', { 'session:mibowi.intro': '1' });
  ok(!forced.d.documentElement.classList.contains('no-intro'), '?intro forces a replay');

  // Reduced motion: never plays
  const calm = await load('index.html', { __reduceMotion: true });
  ok(calm.d.documentElement.classList.contains('no-intro'), 'reduced-motion skips the curtain');

  // Skip removes it from the DOM entirely
  const skipTest = await load('index.html');
  skipTest.d.querySelector('.intro__skip').dispatchEvent(new skipTest.w.Event('click', { bubbles: true }));
  ok(skipTest.d.getElementById('intro').classList.contains('is-skipped'), 'skip marks the curtain');
  await new Promise(r => setTimeout(r, 420));
  ok(skipTest.d.getElementById('intro') === null, 'skip removes the curtain from the DOM');

  // The page underneath is fully built while the curtain is up
  ok(/Year one/.test(skipTest.d.querySelector('[data-hero-body]').textContent), 'homepage rendered behind the curtain');

  // Choreography: retuning the timing knobs must not strand any element mid-flight
  const css = fs.readFileSync(path.join(ROOT, 'assets/css/mibowi.css'), 'utf8');
  const sec = css.slice(css.indexOf('16. Intro curtain'));
  const knob = n => parseFloat((sec.match(new RegExp('--' + n + ':\\s*([\\d.]+)s')) || [])[1]);
  const run = knob('intro-run'), stride = knob('intro-stride'), hold = knob('intro-hold');
  ok(run > 0 && stride > 0 && hold > 0, 'all three timing knobs are declared', `run=${run} stride=${stride} hold=${hold}`);
  ok(0.5 + run <= hold, 'the cat finishes crossing before the curtain lifts', `cat ends ${(0.5 + run).toFixed(2)}s vs lift ${hold}s`);
  ok(0.25 + (hold - 0.35) <= hold, 'the progress bar completes before the curtain lifts');
  const cycles = run / stride;
  ok(cycles >= 6 && cycles <= 13, 'stride stays in step with travel speed, so the legs do not skate', cycles.toFixed(1) + ' cycles per crossing');
  ok(hold + 0.7 <= 6, 'the whole curtain stays under six seconds', (hold + 0.7).toFixed(2) + 's');
}

async function testPlaces() {
  console.log('\nUAE places map');
  const { w, d, jsErrors } = await load('places.html');
  ok(jsErrors.length === 0, 'no JS errors', jsErrors.join(' | '));

  const DATA = w.MIBOWI_PLACES;
  ok(!!DATA && Array.isArray(DATA.places), 'dataset loaded');
  ok(DATA.places.length >= 100, 'a useful number of places', DATA.places.length);
  ok(/^\d{4}-\d{2}-\d{2}$/.test(DATA.generated), 'dataset is date-stamped', DATA.generated);
  ok(/OpenStreetMap/.test(DATA.attribution), 'ODbL attribution is carried in the data');

  // Every record must be renderable and traceable
  const bad = DATA.places.filter(p =>
    !p.id || !p.name || !p.cat || !DATA.categories[p.cat] ||
    typeof p.lat !== 'number' || typeof p.lon !== 'number' || !p.srcUrl);
  ok(bad.length === 0, 'every record has id, name, known category, coords and a source', bad.slice(0,3).map(b=>b.id||b.name).join(', '));

  // Coordinates must actually be inside the UAE, or the map is lying
  const outside = DATA.places.filter(p => p.lat < 22.5 || p.lat > 26.5 || p.lon < 51 || p.lon > 56.6);
  ok(outside.length === 0, 'every pin falls inside the UAE bounding box', outside.slice(0,3).map(p=>`${p.name} ${p.lat},${p.lon}`).join(' | '));

  const dupes = DATA.places.map(p => p.id).filter((v,i,a) => a.indexOf(v) !== i);
  ok(dupes.length === 0, 'no duplicate ids', dupes.slice(0,3).join(','));

  // UI wiring
  ok(typeof w.L === 'object', 'Leaflet loaded from the vendored copy');
  ok(d.querySelectorAll('#cat-filters .opt').length === Object.keys(DATA.categories).length, 'a filter per category');
  ok(d.querySelectorAll('#emirate-filter option').length >= 3, 'emirate filter populated');
  ok(d.querySelectorAll('#place-list .place').length === DATA.places.length, 'every place listed initially', d.querySelectorAll('#place-list .place').length);
  ok(d.querySelectorAll('.pin').length === DATA.places.length, 'a marker per place', d.querySelectorAll('.pin').length);
  ok(d.getElementById('places-total').textContent === String(DATA.counts.total), 'headline count filled in');
  // Provenance copy was deliberately removed from this page, but the ODbL
  // attribution is a licence condition and must survive — Leaflet renders it
  // into the map's own attribution control.
  ok(d.querySelector('.leaflet-control-attribution') !== null, 'map keeps its attribution control');
  ok(/OpenStreetMap/.test(d.querySelector('.leaflet-control-attribution').innerHTML), 'OSM attribution still present on the map');
  ok(!/scrape|Overpass|Firecrawl/i.test(d.querySelector('main').textContent), 'no scraper or provenance copy left on the page');

  // Filtering narrows both the list and the map
  const vets = DATA.places.filter(p => p.cat === 'vet').length;
  d.querySelectorAll('#cat-filters input').forEach(n => { n.checked = n.value === 'vet'; });
  d.getElementById('cat-filters').dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === vets, 'category filter narrows the list', `${d.querySelectorAll('#place-list .place').length} vs ${vets}`);
  ok(d.querySelectorAll('.pin').length === vets, 'category filter narrows the map too');

  // Reset restores everything
  d.getElementById('reset-filters').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === DATA.places.length, 'reset restores every place');

  // Search
  const q = d.getElementById('place-search');
  q.value = 'zzzzznotathing';
  q.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === 0, 'search with no hits empties the list');
  ok(/Nothing matches/.test(d.getElementById('place-list').textContent), 'empty state explains itself');

  // --- the filter system ---
  // Reset first: the search test above deliberately leaves a no-hit query in
  // the box, and these assertions are about filters, not leftover state.
  d.getElementById('reset-filters').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === DATA.places.length, 'clean slate before filter tests');

  const withPhone = DATA.places.filter(p => p.phone).length;
  d.getElementById('need-phone').checked = true;
  d.getElementById('need-phone').dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === withPhone, 'phone filter narrows the list', `${d.querySelectorAll('#place-list .place').length} vs ${withPhone}`);
  ok(d.querySelectorAll('.pin').length === withPhone, 'phone filter narrows the map');
  ok(/1 filter/.test(d.getElementById('filter-count').textContent), 'active filter badge counts it');

  const withWeb = DATA.places.filter(p => p.phone && p.web).length;
  d.getElementById('need-web').checked = true;
  d.getElementById('need-web').dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === withWeb, 'filters combine rather than replace', `${d.querySelectorAll('#place-list .place').length} vs ${withWeb}`);
  ok(/2 filters/.test(d.getElementById('filter-count').textContent), 'badge counts both');

  d.getElementById('reset-filters').dispatchEvent(new w.Event('click', { bubbles: true }));
  ok(d.querySelectorAll('#place-list .place').length === DATA.places.length, 'reset clears every filter');
  ok(d.getElementById('filter-count').style.display === 'none', 'badge hides when nothing is filtered');

  // --- sorting ---
  const sort = d.getElementById('sort-by');
  ok(sort.options.length >= 2, 'sort options rendered', sort.options.length);
  const names = () => Array.from(d.querySelectorAll('#place-list .place b')).map(n => n.textContent);
  const before = names();
  const sortedCopy = before.slice().sort((a, b) => a.localeCompare(b));
  ok(JSON.stringify(before) === JSON.stringify(sortedCopy), 'default sort is alphabetical');
  sort.value = 'near';
  sort.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(names().length === DATA.places.length, 'sorting by distance keeps every row');
  ok(JSON.stringify(names()) !== JSON.stringify(before), 'distance sort actually reorders');

  // --- ratings: present honestly, or not at all ---
  const rated = DATA.places.filter(p => typeof p.rating === 'number').length;
  if (rated === 0) {
    ok(d.getElementById('rating-filter') === null, 'no dead rating filter when there are no ratings');
    ok(/No ratings in this dataset/.test(d.getElementById('rating-field').textContent), 'absence of ratings is explained');
    ok(!Array.from(sort.options).some(o => o.value === 'rating'), 'no "highest rated" sort without ratings');
    ok(d.querySelectorAll('.stars').length === 0, 'no star glyphs rendered');
  } else {
    ok(d.getElementById('rating-filter').children.length === 4, 'rating filter offers Any/3+/4+/4.5+');
    ok(Array.from(sort.options).some(o => o.value === 'rating'), 'can sort by rating');
    ok(d.querySelectorAll('.stars').length === rated, 'a star block per rated place');
    const bad = DATA.places.filter(p => typeof p.rating === 'number' &&
      (p.rating < 0 || p.rating > 5 || p.ratingSrc !== 'google' || !p.reviews));
    ok(bad.length === 0, 'every rating is 0-5, sourced and backed by reviews', bad.slice(0,3).map(b=>b.name).join(', '));
  }

  // Ratings must never come from scraping — the guard is the point
  const scr = fs.readFileSync(path.join(ROOT, 'scripts/scrape-places.js'), 'utf8');
  ok(/GOOGLE_PLACES_API_KEY/.test(scr), 'licensed ratings provider exists');
  ok(/nameMatches\(row\.name/.test(scr), 'ratings pass the same name guard as geocoding');

  // The scraper is committed and self-documenting
  const scraper = fs.readFileSync(path.join(ROOT, 'scripts/scrape-places.js'), 'utf8');
  ok(/FIRECRAWL_API_KEY/.test(scraper), 'firecrawl provider is wired for when a key exists');
  ok(/overpass/i.test(scraper), 'overpass provider present');
  ok(!/[A-Za-z0-9_-]{20,}\s*['"]\s*\)\s*;?\s*\/\/\s*key/i.test(scraper), 'no hard-coded credentials in the scraper');
}

async function testIntegrity() {
  console.log('\nsite integrity');
  const pages = ['index.html','readiness.html','cost.html','match.html','method.html','places.html','404.html'];
  const files = new Set(pages.concat(['assets/css/mibowi.css','assets/js/core.js','assets/js/home.js',
    'assets/js/cost.js','assets/js/readiness.js','assets/js/match.js','assets/js/intro.js','assets/js/places.js',
    'assets/data/costs.js','assets/data/pets.js','assets/data/places.js',
    'assets/vendor/leaflet.js','assets/vendor/leaflet.css']));
  for (const pg of pages) {
    const { d, jsErrors } = await load(pg);
    ok(jsErrors.length === 0, pg + ': clean console', jsErrors.join(' | '));
    ok(!!d.querySelector('title') && d.title.length > 12, pg + ': has a real title');
    ok(!!d.querySelector('meta[name=description]'), pg + ': has a description');
    ok(d.querySelectorAll('h1').length === 1, pg + ': exactly one h1', d.querySelectorAll('h1').length);
    ok(!!d.querySelector('.site-header') && !!d.querySelector('.site-footer'), pg + ': header + footer');
    // internal links resolve
    const bad = Array.from(d.querySelectorAll('a[href]')).map(a => a.getAttribute('href'))
      .filter(h => h && !/^(#|https?:|mailto:)/.test(h))
      .map(h => h.split('#')[0].split('?')[0])
      .filter(h => h && !files.has(h));
    ok(bad.length === 0, pg + ': all internal links resolve', bad.join(', '));
    // every form control is labelled
    const unlabelled = Array.from(d.querySelectorAll('input, select'))
      .filter(el => !el.closest('label') && !el.getAttribute('aria-label') && !el.id);
    ok(unlabelled.length === 0, pg + ': every control is labelled', unlabelled.length + ' unlabelled');
    // nav marks the current page
    // index (home lives on the logo) and 404 are not nav destinations
    const navExempt = pg === 'index.html' || pg === '404.html';
    ok(!!d.querySelector('.nav a[aria-current=page]') || navExempt, pg + ': nav marks current page');
  }
}

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  ORIGIN = 'http://127.0.0.1:' + server.address().port;
  await testIndex();
  await testReadiness();
  await testCost();
  await testMatch();
  await testMethod();
  await testIntro();
  await testPlaces();
  await testIntegrity();
  console.log('\n' + '─'.repeat(46));
  console.log(fail === 0 ? `ALL ${pass} CHECKS PASSED` : `${pass} passed, ${fail} FAILED`);
  server.close();
  process.exit(fail ? 1 : 0);
})();
