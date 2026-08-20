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

## The UAE places map

`places.html` maps ~146 vets, pet shops, groomers, dog parks and dog-friendly
spots across the seven emirates, with category/emirate/search filters and a list
synced to the map.

**Scraping happens at build time, never in the browser.** The site has no back
end, so `scripts/scrape-places.js` writes `assets/data/places.js` and that file
is committed. Visitors read a dated snapshot, and every pin links back to the
record it came from.

```bash
npm run scrape        # Overpass only (keyless)
npm run scrape:all    # + Firecrawl, if FIRECRAWL_API_KEY is set
```

Two providers, because one source cannot do the job:

| Provider | Needs a key | Covers | Last run |
|---|---|---|---|
| **Overpass** (OpenStreetMap) | no | vets, pet shops, groomers, dog parks, shelters | ~146 records |
| **Firecrawl** | `FIRECRAWL_API_KEY` | dog-friendly cafés, beaches, hotels | 49 venues |
| **Google Places** | `GOOGLE_PLACES_API_KEY` | ratings & review counts (enrich only) | not yet run |

The split exists because OpenStreetMap covers UAE pet *services* well and
dog-friendly *venues* almost not at all — exactly **six** places in the entire
country carry a `dog=yes` tag. Firecrawl fills that category by extracting
structured records from published listings and geocoding them via Nominatim,
storing the source URL on every record. Nothing is added to the map without a
traceable source.

### Filters

Category, emirate, free-text search, minimum rating, sort (name / nearest /
highest rated / most reviewed), and "only places with a phone, a website or
opening hours". An active-filter badge shows how many are applied; Reset clears
all of them.

### Ratings

```bash
npm run scrape:ratings    # needs GOOGLE_PLACES_API_KEY
```

Ratings come from the **Google Places API or not at all**, and there is
deliberately no scraped-rating path. Two things were tried and rejected:

- **Google Maps** serves a JavaScript shell — the HTML contains map tiles and no
  review data — and scraping it would breach their terms regardless.
- **Directory pages** put a language model in the position of inventing numbers.
  A test run returned **0.0 stars for a groomer with 38 reviews**, and a 5.0
  drawn from three. Next to a real business name, the first is defamatory and
  the second is noise.

The `google` provider only enriches places that already exist — it answers "how
is this rated", never "what is here" — and each candidate passes the same
name-similarity guard used for geocoding, so a rating cannot land on the wrong
business. Until a key is present the map shows no stars and the rating controls
are hidden rather than left dead.

`.github/workflows/refresh-places.yml` re-runs the scraper monthly (and on
demand), runs the test suite against the new data, and commits only if something
changed. Delete that file if you would rather refresh by hand.

Leaflet 1.9.4 is vendored in `assets/vendor/` rather than pulled from a CDN, and
markers are CSS `divIcon`s, so the only runtime network calls are OpenStreetMap
tiles.

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
index.html  readiness.html  cost.html  match.html  method.html
places.html  404.html
assets/
  css/mibowi.css     design system — tokens, components, light + dark
  js/core.js         theme, nav, region/currency model, shared helpers
  js/intro.js        skip handling for the homepage intro curtain
  js/places.js       map, filters and list for the UAE places page
  data/places.js     GENERATED by scripts/scrape-places.js — do not hand-edit
  vendor/leaflet.*   Leaflet 1.9.4, vendored so there is no CDN dependency
scripts/
  scrape-places.js   Overpass + optional Firecrawl scraper
  js/home.js         homepage widgets (reuse the live cost model)
  js/readiness.js    question schema + scoring + result rendering
  js/cost.js         the cost model (pure `compute()`), exported as MiBoWiCost
  js/match.js        the 15-axis scorer and blocker rules
  data/costs.js      19 species economics + the "what people forget" bills
  data/pets.js       69 candidates × 21 scored attributes + written profiles
tests/site.test.js   217 headless checks
```

Scripts are classic (non-module) on purpose, so the site works from `file://`
with no server and no CORS problems.

## Tests

217 headless checks — every page loads clean, the calculators produce sane and
correctly-ordered results across a range of profiles, the cost model is
monotonic, hard blockers actually block, the intro curtain plays once and always
clears, every map pin has coordinates inside the UAE and a traceable source,
internal links resolve and every form control is labelled.

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
