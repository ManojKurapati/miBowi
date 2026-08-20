# MiBoWi

**Live: <https://manojkurapati.github.io/miBowi/>**

[![Deploy](https://github.com/ManojKurapati/miBowi/actions/workflows/pages.yml/badge.svg)](https://github.com/ManojKurapati/miBowi/actions/workflows/pages.yml)

A pet information space built around the three decisions that come *before* the animal.

No build step, no framework, no back end. Open `index.html` and it runs.

> **Note on the URL:** GitHub Pages paths are case-sensitive, so only
> `/miBowi/` resolves — `/mibowi/` and `/MiBoWi/` both 404. Share the link by
> copy-paste rather than dictation. Renaming the repo to all-lowercase would
> make the address match what people naturally type.

## Deployment

Every push to `main` runs the full test suite and, only if it passes, publishes
to GitHub Pages (`.github/workflows/pages.yml`). A commit that breaks the site
cannot reach the live URL.

---

## The three calculators

| Tool | File | What it does |
|---|---|---|
| **Should I get a pet at all?** | `readiness.html` | 21 questions across six weighted dimensions — time, money, housing, life stability, support, motivation. Five answers act as **hard caps** rather than deductions, because a lease that forbids animals is a wall, not a weak spot. Returns a score, a dimension breakdown, flagged blockers, and a ranked "fix this first" list. |
| **What will it really cost?** | `cost.html` | 19 species modelled from acquisition to end of life. Setup, food, prevention, insurance, grooming, boarding, dental, damage, expected emergency cost and the end. Live-updating, in your currency at your local cost of living. Shows lean / your choices / comfortable side by side. |
| **Which one actually fits?** | `match.html` | 69 species and breeds scored on **15 weighted axes** against your hours, home, budget, allergies, children, climate and tolerances. Seven hard blockers rule candidates out — and the ruled-out list, with reasons, is shown deliberately, because that is where most of the learning is. |

`method.html` documents every weighting, baseline and known limitation.

## The intro curtain

`index.html` opens with a hand-drawn dog and cat trotting across a ground line
while the brand settles in — about 4.4 seconds.

- Plays **once per browser session**. Repeat visits are suppressed *before paint*
  by a tiny inline script in `<head>`, so there is no flash.
- Add **`?intro`** to the URL to force a replay: `http://localhost:8000/?intro`
- Skipped by the Skip button, or any click, scroll, key or touch.
- Silently skipped entirely under `prefers-reduced-motion`.
- **Dismissal is driven by CSS, not JavaScript.** `assets/js/intro.js` only adds
  the skip shortcuts and tidies the node away afterwards. If that script fails to
  load, the curtain still clears on its own — a preloader that can trap a visitor
  behind a broken script is worse than no preloader.

The animals are inline SVG (`index.html`) animated by CSS in section 16 of
`mibowi.css` — alternating leg rotations, a body bob, a wagging tail, a flapping
ear and dust puffs. No images, no library, nothing to download.

### Tuning the timing

Three custom properties on `.intro` drive the whole sequence; everything else is
derived from them with `calc()`.

```css
--intro-run:    3.1s;   /* how long an animal takes to cross the screen */
--intro-stride: .36s;   /* one full leg cycle — keep in step with the run */
--intro-hold:   3.75s;  /* when the curtain starts lifting */
```

Keep `run / stride` somewhere around 8–10 cycles per crossing, or the legs stop
looking like running and start looking like skating. `intro.js` reads
`--intro-hold` at runtime for its failsafe deadline, so the two cannot drift
apart. The test suite asserts both invariants.

## Running it

```bash
open index.html                # works straight from file://
python3 -m http.server 8000    # or serve it, for cross-page prefill
```

Everything runs client-side. Nothing is uploaded. Two things are kept in the
browser's local storage: your theme/region, and a completed readiness summary so
the matcher can offer to prefill from it.

## Layout

```
index.html  readiness.html  cost.html  match.html  method.html  404.html
assets/
  css/mibowi.css     design system — tokens, components, light + dark
  js/core.js         theme, nav, region/currency model, shared helpers
  js/intro.js        skip handling for the homepage intro curtain
  js/home.js         homepage widgets (reuse the live cost model)
  js/readiness.js    question schema + scoring + result rendering
  js/cost.js         the cost model (pure `compute()`), exported as MiBoWiCost
  js/match.js        the 15-axis scorer and blocker rules
  data/costs.js      19 species economics + the "what people forget" bills
  data/pets.js       69 candidates × 21 scored attributes + written profiles
tests/site.test.js   158 headless checks
```

Scripts are classic (non-module) on purpose, so the site works from `file://`
with no server and no CORS problems.

## Tests

158 headless checks — every page loads clean, the calculators produce sane and
correctly-ordered results across a range of profiles, the cost model is
monotonic, hard blockers actually block, the intro curtain plays once and always
clears, internal links resolve and every form control is labelled.

```bash
npm install jsdom@24        # jsdom 25+ needs a newer Node than 20
node tests/site.test.js
```

The suite serves the site over HTTP rather than `file://`, because an opaque
origin disables `localStorage` and would silently skip the region and handoff
tests.

## Editing the data

Both datasets are plain, commented JS with validation built in.

- **`assets/data/pets.js`** — each candidate is one `P()` call taking a
  21-number trait string. The order is documented at the top of the file and the
  loader throws on a miscount, so a dropped digit fails loudly at load rather
  than silently skewing a score.
- **`assets/data/costs.js`** — one object per species. Optional `damage` and
  `labels` keys override the generic defaults, so an aquarium shows
  "water treatment & filter media" rather than "toys".

Change either and the homepage, calculators and comparison charts all follow —
there is exactly one cost model in the product, exported from `cost.js` and
reused everywhere.

## Editorial stance

- The tools will tell you *not* to get a pet when your own answers say so.
- Welfare is scored, not footnoted: pair-living species are costed as pairs, and
  a dedicated axis penalises breeds carrying a heavy inherited health burden.
- Figures are planning estimates, not quotes. `method.html` says exactly what the
  model excludes and where it is a judgement call.
