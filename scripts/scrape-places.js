#!/usr/bin/env node
/* ==========================================================================
   MiBoWi — pet-friendly places scraper (UAE)

   Writes assets/data/places.js, which the static site reads directly. The
   site has no back end, so scraping happens here at build time and the
   result is committed. Nothing is scraped in the visitor's browser.

   Two providers:

     overpass   Default. OpenStreetMap via the Overpass API. Keyless, open
                data (ODbL), and every record arrives with real coordinates.
                Excellent UAE coverage of vets, pet shops, groomers and dog
                parks — roughly 150 records.

     google     Optional, needs GOOGLE_PLACES_API_KEY. Adds ratings and review
                counts. This is the only provider we will take ratings from —
                see "On ratings" below.

     firecrawl  Optional, needs FIRECRAWL_API_KEY. Fills the gap OSM cannot:
                cafes, beaches and hotels that welcome dogs, which are barely
                tagged in OSM (6 records nationwide at last run). Extracts
                structured records from published listings, then geocodes them
                through Nominatim. Every record keeps its source URL.

   On ratings
     Ratings are claims about named real businesses, so they come from a
     licensed API or not at all. Scraping them was tried and rejected:
     Google Maps serves a JavaScript shell with no ratings in the HTML, and
     directory pages put an LLM in the position of inventing numbers — a test
     run returned 0.0 stars for a groomer with 38 reviews, which as a published
     figure is worse than showing nothing. So there is no scraped-rating path
     here on purpose.

   Usage
     node scripts/scrape-places.js                    # overpass only
     node scripts/scrape-places.js --provider all     # + firecrawl and google if keyed
     node scripts/scrape-places.js --dry-run          # print, do not write
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'assets', 'data', 'places.js');
const UA = 'MiBoWi/1.0 (pet information space; https://manojkurapati.github.io/miBowi/)';

/* Node does not read .env on its own, and we would rather not add a dependency
   for six lines. Values already in the environment (CI secrets) always win. */
function loadEnv() {
  const file = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (!val) continue;
    if (!process.env[key]) process.env[key] = val;
    // Accept the obvious spellings rather than making anyone rename a variable.
    if (/^(firecrawl|firecrawl_key|firecrawl_api_key|fc_api_key)$/i.test(key) &&
        !process.env.FIRECRAWL_API_KEY) {
      process.env.FIRECRAWL_API_KEY = val;
    }
  }
}
loadEnv();

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] || true) : d; };
const DRY = argv.includes('--dry-run');
const PROVIDER = arg('provider', 'overpass');

/* ---------------------------------------------------------------- helpers */

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function withRetry(label, fn, tries = 3) {
  let last;
  for (let i = 1; i <= tries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (i < tries) {
        const wait = 2000 * i;
        console.warn(`  ${label}: attempt ${i} failed (${e.message}); retrying in ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }
  throw last;
}

/* Emirate is assigned by nearest population centre. UAE emirate borders have
   enclaves and exclaves that a bounding box gets wrong, so this is deliberately
   an approximation and is labelled as such in the UI. */
const CENTRES = [
  { emirate: 'Abu Dhabi',      lat: 24.4539, lon: 54.3773 },
  { emirate: 'Abu Dhabi',      lat: 24.2075, lon: 55.7447 }, // Al Ain
  { emirate: 'Abu Dhabi',      lat: 23.6500, lon: 53.7000 }, // Al Dhafra
  { emirate: 'Dubai',          lat: 25.2048, lon: 55.2708 },
  { emirate: 'Sharjah',        lat: 25.3463, lon: 55.4209 },
  { emirate: 'Sharjah',        lat: 25.3300, lon: 56.3400 }, // Khor Fakkan
  { emirate: 'Ajman',          lat: 25.4052, lon: 55.5136 },
  { emirate: 'Umm Al Quwain',  lat: 25.5647, lon: 55.5532 },
  { emirate: 'Ras Al Khaimah', lat: 25.7895, lon: 55.9432 },
  { emirate: 'Fujairah',       lat: 25.1288, lon: 56.3265 }
];

function emirateFor(lat, lon) {
  let best = null, bestD = Infinity;
  for (const c of CENTRES) {
    const dLat = lat - c.lat, dLon = (lon - c.lon) * Math.cos(lat * Math.PI / 180);
    const d = dLat * dLat + dLon * dLon;
    if (d < bestD) { bestD = d; best = c.emirate; }
  }
  return best;
}

const round = (n, p = 5) => Math.round(n * 10 ** p) / 10 ** p;
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------- categories */

const CATEGORIES = {
  vet:      { label: 'Veterinary',     tint: '#A3412C' },
  shop:     { label: 'Pet shop',       tint: '#B98B2E' },
  grooming: { label: 'Grooming',       tint: '#7A6A9B' },
  dogpark:  { label: 'Dog park',       tint: '#3D7A55' },
  shelter:  { label: 'Shelter',        tint: '#4A7C94' },
  boarding: { label: 'Boarding',       tint: '#8E6A3D' },
  cafe:     { label: 'Dog-friendly',   tint: '#B4522E' },
  outdoors: { label: 'Parks & beaches',tint: '#3E5C48' }
};

function categorise(t) {
  if (t.amenity === 'veterinary') return 'vet';
  if (t.amenity === 'animal_shelter') return 'shelter';
  if (t.amenity === 'animal_boarding') return 'boarding';
  if (t.shop === 'pet_grooming' || t.shop === 'pet_care') return 'grooming';
  if (t.shop === 'pet') return 'shop';
  if (t.leisure === 'dog_park') return 'dogpark';
  const dogOk = /^(yes|leashed|outside)$/.test(t.dog || '');
  if (dogOk && (t.leisure === 'park' || t.natural === 'beach' || t.leisure === 'playground')) return 'outdoors';
  if (dogOk) return 'cafe';
  return null;
}

/* ------------------------------------------------------------ 1. OVERPASS */

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const QUERY = `
[out:json][timeout:120];
area["ISO3166-1"="AE"][admin_level=2]->.ae;
(
  nwr(area.ae)["amenity"="veterinary"];
  nwr(area.ae)["amenity"="animal_shelter"];
  nwr(area.ae)["amenity"="animal_boarding"];
  nwr(area.ae)["shop"~"^(pet|pet_grooming|pet_care)$"];
  nwr(area.ae)["leisure"="dog_park"];
  nwr(area.ae)["dog"~"^(yes|leashed|outside)$"];
  nwr(area.ae)["pet"="yes"];
);
out center tags;
`.trim();

async function fromOverpass() {
  console.log('· Overpass — querying OpenStreetMap for the UAE');
  let json = null;
  for (const url of MIRRORS) {
    try {
      json = await withRetry('overpass', async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain', 'User-Agent': UA },
          body: QUERY
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
      break;
    } catch (e) {
      console.warn(`  mirror ${url} failed: ${e.message}`);
    }
  }
  if (!json) throw new Error('every Overpass mirror failed');

  const out = [];
  for (const el of json.elements || []) {
    const t = el.tags || {};
    const lat = el.lat != null ? el.lat : (el.center && el.center.lat);
    const lon = el.lon != null ? el.lon : (el.center && el.center.lon);
    if (lat == null || lon == null) continue;

    const cat = categorise(t);
    if (!cat) continue;

    const name = clean(t['name:en'] || t.name);
    // Unnamed records are only useful where the category is the name.
    if (!name && !(cat === 'dogpark' || cat === 'outdoors')) continue;

    out.push({
      id: el.type[0] + el.id,
      name: name || (cat === 'dogpark' ? 'Dog park' : 'Park'),
      cat,
      lat: round(lat), lon: round(lon),
      emirate: emirateFor(lat, lon),
      area: clean(t['addr:city'] || t['addr:suburb'] || ''),
      street: clean(t['addr:street'] || ''),
      phone: clean(t.phone || t['contact:phone'] || ''),
      web: clean(t.website || t['contact:website'] || ''),
      hours: clean(t.opening_hours || ''),
      dog: clean(t.dog || t.pet || ''),
      src: 'osm',
      srcUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`
    });
  }
  console.log(`  ${out.length} usable records`);
  return out;
}

/* ------------------------------------------------------------ 2. FIRECRAWL

   Fills the category OSM does not cover: venues that welcome dogs. Requires
   FIRECRAWL_API_KEY. Each extracted venue is geocoded through Nominatim and
   keeps the URL it came from, so every claim on the map is traceable.        */

/* Verified listing pages. Each extracted venue keeps the URL it came from, so
   every claim on the map is traceable back to whoever published it. */
const SOURCES = [
  'https://www.timeoutdubai.com/moving-to-dubai/dog-friendly-cafes-and-pubs-in-dubai',
  'https://whatson.ae/2026/04/best-pet-friendly-restaurants-cafes-in-dubai/',
  'https://www.daidubai.com/directory-dog-friendly-places',
  'https://noblevetclinic.com/blog/top-dog-friendly-restaurants-cafes-in-dubai',
  'https://www.daidubai.com/restaurants-auh',
  'https://www.bestbitesuae.com/articles/dog-friendly-dining-in-abu-dhabi',
  'https://www.thenationalnews.com/lifestyle/things-to-do/2026/01/02/pet-friendly-restaurants-and-cafes-in-dubai-and-abu-dhabi/'
];

const VENUE_SCHEMA = {
  type: 'object',
  properties: {
    venues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:     { type: 'string', description: 'Venue name' },
          kind:     { type: 'string', description: 'cafe, restaurant, beach, park or hotel' },
          area:     { type: 'string', description: 'Neighbourhood or district' },
          city:     { type: 'string', description: 'Emirate or city' },
          note:     { type: 'string', description: 'One sentence on the pet policy' }
        },
        required: ['name']
      }
    }
  },
  required: ['venues']
};

async function firecrawlScrape(url, key) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({
      url,
      formats: ['json'],
      onlyMainContent: true,
      jsonOptions: {
        schema: VENUE_SCHEMA,
        prompt: 'List every venue named on this page that explicitly welcomes dogs or pets. Do not invent venues.'
      }
    })
  });
  if (!res.ok) throw new Error('firecrawl HTTP ' + res.status + ' ' + (await res.text()).slice(0, 160));
  const body = await res.json();
  const data = body.data || {};
  return (data.json && data.json.venues) || [];
}

/* ---- geocode result guard ----------------------------------------------
   Fuzzy geocoders happily return the nearest-sounding business, which on a map
   means sending someone to the wrong address. Photon offered "Happy Day
   Discount Centre" for "Happy Bark Day" and "Chuno Deli" for "Barbary Deli".
   So every candidate must clear a name check before we believe it.

   Scoring is bidirectional (an F1 over matched tokens) so that extra words in
   the candidate count against it, with a prefix escape hatch for short names
   that the geocoder legitimately extends: "Kave" -> "Kave Alserkal Avenue".   */

const STOP = new Set(['the','a','an','and','cafe','café','coffee','restaurant','grill','bar',
  'lounge','dubai','abu','dhabi','uae','llc','br','branch','emirates','dxb','united','arab']);

function nameTokens(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    .split(' ').filter(t => t.length > 1 && !STOP.has(t));
}
function normName(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
const nearTok = (a, b) =>
  a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));

function overlap(A, B) {
  return A.length ? A.filter(a => B.some(b => nearTok(a, b))).length / A.length : 0;
}

const NAME_THRESHOLD = 0.6;

function nameMatches(wanted, got) {
  const w = normName(wanted), g = normName(got);
  if (!w || !g) return false;
  if (w.length >= 4 && g.startsWith(w)) return true;      // "Kave" -> "Kave Alserkal Avenue"
  const A = nameTokens(wanted), B = nameTokens(got);
  if (!A.length || !B.length) return false;
  const f = overlap(A, B), r = overlap(B, A);
  const f1 = (f + r) ? (2 * f * r) / (f + r) : 0;
  return f1 >= NAME_THRESHOLD;
}

/* Nominatim: keyless, but a strict 1 request/second policy. Respect it. */
async function geocodeOnce(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ae&q=' +
              encodeURIComponent(q);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const hits = await res.json();
  if (!hits.length) return null;
  return { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon),
           label: hits[0].display_name, via: 'nominatim' };
}

/* Photon finds far more UAE businesses than Nominatim, but only because it
   guesses. Everything it returns goes through nameMatches() before use. */
async function photonOnce(q) {
  const url = 'https://photon.komoot.io/api/?limit=3&lat=25.2&lon=55.27&q=' + encodeURIComponent(q);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const body = await res.json();
  for (const f of body.features || []) {
    const p = f.properties || {};
    if (p.countrycode && p.countrycode !== 'AE') continue;
    const label = [p.name, p.street, p.city].filter(Boolean).join(', ');
    if (!label) continue;
    return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
             label: label, name: p.name || label, via: 'photon' };
  }
  return null;
}

/* Business names are patchy in OSM, so widen the query rather than give up:
   name + area + city, then name + city, then name + UAE. */
async function geocode(name, area, city) {
  const tries = [
    [name, area, city || 'UAE'].filter(Boolean).join(', '),
    [name, city || 'Dubai'].filter(Boolean).join(', '),
    [name, 'United Arab Emirates'].join(', ')
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const q of tries) {
    const hit = await geocodeOnce(q);
    await sleep(1100);                                 // Nominatim rate limit
    if (hit && nameMatches(name, hit.label)) return hit;
  }
  for (const q of tries) {
    const hit = await photonOnce(q);
    await sleep(400);
    if (hit && nameMatches(name, hit.name)) return hit;
  }
  return null;
}

async function fromFirecrawl() {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    console.log('· Firecrawl — skipped, FIRECRAWL_API_KEY is not set');
    return [];
  }
  console.log('· Firecrawl — extracting dog-friendly venues');
  const out = [], ungeocoded = [];
  for (const url of SOURCES) {
    let venues = [];
    try {
      venues = await withRetry('firecrawl', () => firecrawlScrape(url, key));
    } catch (e) {
      console.warn(`  ${url} failed: ${e.message}`);
      continue;
    }
    console.log(`  ${venues.length} venues from ${new URL(url).hostname}`);
    for (const v of venues) {
      const name = clean(v.name);
      if (!name) continue;
      const hit = await geocode(name, clean(v.area), clean(v.city));
      if (!hit) { ungeocoded.push(name); continue; }
      out.push({
        id: 'fc-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48),
        name,
        cat: /beach|park/i.test(v.kind || '') ? 'outdoors' : 'cafe',
        lat: round(hit.lat), lon: round(hit.lon),
        emirate: emirateFor(hit.lat, hit.lon),
        area: clean(v.area), street: '', phone: '', web: '', hours: '',
        dog: 'reported',
        note: clean(v.note),
        geo: hit.via,
        src: 'firecrawl',
        srcUrl: url
      });
    }
  }
  console.log(`  ${out.length} geocoded venues` +
    (ungeocoded.length ? `, ${ungeocoded.length} dropped (no coordinates found)` : ''));
  if (ungeocoded.length) console.log('    dropped: ' + ungeocoded.slice(0, 8).join(', ') +
    (ungeocoded.length > 8 ? ` … +${ungeocoded.length - 8}` : ''));
  return out;
}

/* ------------------------------------------------------- 3. GOOGLE PLACES

   Enriches records that already exist with a rating and review count. It never
   adds a place: this provider answers "how is this rated", not "what is here".
   Matches are put through the same nameMatches() guard as geocoding, so a
   rating can never be pinned to the wrong business.                          */

async function ratePlace(row, key) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.location'
    },
    body: JSON.stringify({
      textQuery: [row.name, row.area, row.emirate, 'UAE'].filter(Boolean).join(', '),
      locationBias: { circle: { center: { latitude: row.lat, longitude: row.lon }, radius: 2000 } },
      maxResultCount: 3
    })
  });
  if (!res.ok) throw new Error('places HTTP ' + res.status + ' ' + (await res.text()).slice(0, 140));
  const body = await res.json();
  for (const p of body.places || []) {
    const label = (p.displayName && p.displayName.text) || '';
    if (!nameMatches(row.name, label)) continue;        // same guard as geocoding
    if (typeof p.rating !== 'number' || !p.userRatingCount) continue;
    return { rating: Math.round(p.rating * 10) / 10, reviews: p.userRatingCount };
  }
  return null;
}

async function addRatings(rows) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.log('· Google Places — skipped, GOOGLE_PLACES_API_KEY is not set (no ratings this run)');
    return rows;
  }
  console.log('· Google Places — fetching ratings for ' + rows.length + ' places');
  let rated = 0, unmatched = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (const row of rows) {
    try {
      const hit = await ratePlace(row, key);
      if (hit) {
        row.rating = hit.rating;
        row.reviews = hit.reviews;
        row.ratingSrc = 'google';
        row.ratingAt = today;
        rated++;
      } else {
        unmatched++;
      }
    } catch (e) {
      console.warn(`  ${row.name}: ${e.message}`);
    }
    await sleep(120);
  }
  console.log(`  ${rated} rated, ${unmatched} had no confident match`);
  return rows;
}

/* ------------------------------------------------------------------- main */

/* Sources spell the same venue differently — "Tap House" and "The Tap House",
   "Reform" and "Reform Social & Grill", "1762 JLT Stripped" and "1762 Stripped".
   They geocode to the same point, so collapse on the point and treat one name
   as the same venue when its words are a subset of the other's. Two genuinely
   different names at one point are kept: a mall can hold two businesses. */
function venueTokens(s) {
  return new Set(String(s || '').toLowerCase().replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean));
}
function sameVenue(a, b) {
  const A = venueTokens(a), B = venueTokens(b);
  const [small, big] = A.size <= B.size ? [A, B] : [B, A];
  if (!small.size) return false;
  for (const t of small) if (!big.has(t)) return false;
  return true;
}

function dedupe(rows) {
  const keep = [];
  for (const r of rows) {
    const pt = r.lat.toFixed(4) + ',' + r.lon.toFixed(4);
    const hit = keep.find(k => k.lat.toFixed(4) + ',' + k.lon.toFixed(4) === pt && sameVenue(k.name, r.name));
    if (!hit) { keep.push(r); continue; }
    // Same venue: keep the more descriptive name, and do not lose detail.
    if (r.name.length > hit.name.length) hit.name = r.name;
    if (!hit.note && r.note) hit.note = r.note;
    if (!hit.area && r.area) hit.area = r.area;
    if (!hit.web && r.web) hit.web = r.web;
  }
  return keep;
}

(async () => {
  const want = p => PROVIDER === 'all' || PROVIDER === p;
  let rows = [];

  if (want('overpass'))  rows = rows.concat(await fromOverpass());
  if (want('firecrawl')) rows = rows.concat(await fromFirecrawl());

  rows = dedupe(rows).sort((a, b) =>
    a.emirate.localeCompare(b.emirate) || a.name.localeCompare(b.name));

  /* Ratings-only run: enrich the committed dataset in place rather than
     re-scraping everything just to refresh star counts. */
  if (!rows.length && want('google') && fs.existsSync(OUT)) {
    global.window = {};
    delete require.cache[require.resolve(OUT)];
    require(OUT);
    rows = (global.window.MIBOWI_PLACES || {}).places || [];
    console.log(`· Loaded ${rows.length} existing places to rate`);
  }

  if (want('google')) rows = await addRatings(rows);

  /* Ids must be unique across the whole file: the site keys records by id, and
     two branches of the same chain legitimately share a name. Deterministic,
     because the sort above is stable. */
  const usedIds = new Set();
  for (const r of rows) {
    let id = r.id, n = 2;
    while (usedIds.has(id)) id = r.id + '-' + (n++);
    r.id = id;
    usedIds.add(id);
  }

  const byCat = {}, byEmirate = {};
  rows.forEach(r => {
    byCat[r.cat] = (byCat[r.cat] || 0) + 1;
    byEmirate[r.emirate] = (byEmirate[r.emirate] || 0) + 1;
  });

  console.log('\n  by category:', JSON.stringify(byCat));
  console.log('  by emirate: ', JSON.stringify(byEmirate));
  console.log(`  total: ${rows.length}` +
    `  (rated: ${rows.filter(r => typeof r.rating === 'number').length})`);

  if (DRY) { console.log('\n(dry run — nothing written)'); return; }

  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    country: 'AE',
    categories: CATEGORIES,
    counts: { total: rows.length, byCat, byEmirate,
              rated: rows.filter(r => typeof r.rating === 'number').length },
    attribution: 'Place data © OpenStreetMap contributors, ODbL. Dog-friendly venue records carry their own source.',
    places: rows
  };

  const banner = `/* GENERATED FILE — do not edit by hand.
   Produced by scripts/scrape-places.js on ${payload.generated}.
   Regenerate with:  npm run scrape
   ${payload.attribution} */\n\n`;

  fs.writeFileSync(OUT, banner + 'window.MIBOWI_PLACES = ' + JSON.stringify(payload, null, 1) + ';\n');
  console.log(`\nwrote ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
})().catch(e => { console.error('\nscrape failed:', e.message); process.exit(1); });
