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

     firecrawl  Optional, needs FIRECRAWL_API_KEY. Fills the gap OSM cannot:
                cafes, beaches and hotels that welcome dogs, which are barely
                tagged in OSM (6 records nationwide at last run). Extracts
                structured records from published listings, then geocodes them
                through Nominatim. Every record keeps its source URL.

   Usage
     node scripts/scrape-places.js                    # overpass only
     node scripts/scrape-places.js --provider all     # + firecrawl if keyed
     node scripts/scrape-places.js --dry-run          # print, do not write
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'assets', 'data', 'places.js');
const UA = 'MiBoWi/1.0 (pet information space; https://manojkurapati.github.io/miBowi/)';

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

const SOURCES = [
  'https://www.timeoutdubai.com/things-to-do/dog-friendly-cafes-restaurants-dubai',
  'https://www.timeoutabudhabi.com/things-to-do/pet-friendly-cafes-abu-dhabi'
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

/* Nominatim: keyless, but a strict 1 request/second policy. Respect it. */
async function geocode(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ae&q=' +
              encodeURIComponent(q);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const hits = await res.json();
  if (!hits.length) return null;
  return { lat: parseFloat(hits[0].lat), lon: parseFloat(hits[0].lon) };
}

async function fromFirecrawl() {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    console.log('· Firecrawl — skipped, FIRECRAWL_API_KEY is not set');
    return [];
  }
  console.log('· Firecrawl — extracting dog-friendly venues');
  const out = [];
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
      const hit = await geocode([name, clean(v.area), clean(v.city) || 'UAE'].filter(Boolean).join(', '));
      await sleep(1100);                       // Nominatim rate limit
      if (!hit) { console.warn(`    could not geocode "${name}" — dropped`); continue; }
      out.push({
        id: 'fc-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48),
        name,
        cat: /beach|park/i.test(v.kind || '') ? 'outdoors' : 'cafe',
        lat: round(hit.lat), lon: round(hit.lon),
        emirate: emirateFor(hit.lat, hit.lon),
        area: clean(v.area), street: '', phone: '', web: '', hours: '',
        dog: 'reported',
        note: clean(v.note),
        src: 'firecrawl',
        srcUrl: url
      });
    }
  }
  console.log(`  ${out.length} geocoded venues`);
  return out;
}

/* ------------------------------------------------------------------- main */

function dedupe(rows) {
  const seen = new Map();
  for (const r of rows) {
    // Same name within ~150m is the same place.
    const key = r.name.toLowerCase() + '@' + r.lat.toFixed(3) + ',' + r.lon.toFixed(3);
    if (!seen.has(key)) seen.set(key, r);
  }
  return [...seen.values()];
}

(async () => {
  const want = p => PROVIDER === 'all' || PROVIDER === p;
  let rows = [];

  if (want('overpass'))  rows = rows.concat(await fromOverpass());
  if (want('firecrawl')) rows = rows.concat(await fromFirecrawl());

  rows = dedupe(rows).sort((a, b) =>
    a.emirate.localeCompare(b.emirate) || a.name.localeCompare(b.name));

  const byCat = {}, byEmirate = {};
  rows.forEach(r => {
    byCat[r.cat] = (byCat[r.cat] || 0) + 1;
    byEmirate[r.emirate] = (byEmirate[r.emirate] || 0) + 1;
  });

  console.log('\n  by category:', JSON.stringify(byCat));
  console.log('  by emirate: ', JSON.stringify(byEmirate));
  console.log(`  total: ${rows.length}`);

  if (DRY) { console.log('\n(dry run — nothing written)'); return; }

  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    country: 'AE',
    categories: CATEGORIES,
    counts: { total: rows.length, byCat, byEmirate },
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
