/**
 * backend/src/services/dataHelper.js
 * ------------------------------------
 * Loads Zomato and Hotels datasets once at startup and exposes
 * fast city-fuzzy-matching lookups so the AI prompt can be
 * enriched with real restaurant and hotel data.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Datasets live in the project root (two levels above backend/src/services)
const ROOT = join(__dirname, '..', '..', '..', 'ai-engine', 'datasets');

let zomatoData = [];
let hotelsData = [];

// ── Load datasets once ──────────────────────────────────────────────────────
try {
  zomatoData = JSON.parse(readFileSync(join(ROOT, 'restaurants.json'), 'utf8'));
  console.log(`✅ Zomato dataset loaded: ${zomatoData.length} restaurants`);
} catch (e) {
  console.warn('⚠️  Zomato dataset not found, skipping:', e.message);
}

try {
  hotelsData = JSON.parse(readFileSync(join(ROOT, 'hotels.json'), 'utf8'));
  console.log(`✅ Hotels dataset loaded: ${hotelsData.length} hotels`);
} catch (e) {
  console.warn('⚠️  Hotels dataset not found, skipping:', e.message);
}


// ── City aliases — map common user inputs to dataset city keys ────────────
const CITY_ALIASES = {
  'bengaluru': 'bangalore',
  'bombay': 'mumbai',
  'calcutta': 'kolkata',
  'madras': 'chennai',
  'new delhi': 'new delhi',
  'delhi': 'new delhi',
  'gurgaon': 'gurgaon',
  'gurugram': 'gurgaon',
  'pune': 'pune',
  // Bangalore neighbourhoods — map to the Koramangala / MG Road etc. index
  'koramangala': 'koramangala 4th block',
  'indiranagar': 'indiranagar',
  'btm': 'btm',
  'hsr': 'hsr',
  'whitefield': 'whitefield',
  'baner': 'baner',
};

const normalizeCity = (str) => {
  const n = (str || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  return CITY_ALIASES[n] || n;
};

// Extract city token (first word before comma)
const extractCityToken = (str) => normalizeCity(str).split(',')[0].split(' ')[0];

// ── Build a quick-lookup city index for Zomato ─────────────────────────────
const zomatoCityIndex = {};
for (const r of zomatoData) {
  const city = extractCityToken(r['listed_in(city)'] || r.location || '');
  if (!zomatoCityIndex[city]) zomatoCityIndex[city] = [];
  zomatoCityIndex[city].push(r);
}

// ── Build a quick-lookup city index for Hotels ────────────────────────────
const hotelsCityIndex = {};
for (const h of hotelsData) {
  const city = extractCityToken(h.city || '');
  if (!hotelsCityIndex[city]) hotelsCityIndex[city] = [];
  hotelsCityIndex[city].push(h);
}

// ── Fuzzy city-match: tries exact, then substring ─────────────────────────
function findCity(index, cityQuery) {
  const q = normalizeCity(cityQuery).split(',')[0];
  // 1. Exact match
  if (index[q]) return index[q];
  // 2. Substring match on first word
  const firstWord = q.split(' ')[0];
  const found = Object.keys(index).find((k) => k.startsWith(firstWord) || firstWord.startsWith(k));
  return found ? index[found] : [];
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Get top N restaurants for a city, sorted by rating (desc).
 * Returns a curated array of plain objects.
 */
export function getTopRestaurants(city, n = 6) {
  const records = findCity(zomatoCityIndex, city);
  return records
    .filter((r) => r.rate && r.name)
    .sort((a, b) => (b.rate || 0) - (a.rate || 0))
    .slice(0, n)
    .map((r) => ({
      name: r.name,
      cuisines: r.cuisines || 'Mixed',
      type: r.rest_type || 'Restaurant',
      rating: r.rate,
      costForTwo: r['approx_cost(for two people)'] || null,
      location: r.location || '',
    }));
}

/**
 * Get top N hotels for a city, sorted by review rating (desc).
 * Returns a curated array of plain objects.
 */
export function getTopHotels(city, n = 4) {
  const records = findCity(hotelsCityIndex, city);
  return records
    .filter((h) => h.property_name && h.site_review_rating)
    .sort((a, b) => parseFloat(b.site_review_rating || 0) - parseFloat(a.site_review_rating || 0))
    .slice(0, n)
    .map((h) => ({
      name: h.property_name,
      stars: h.hotel_star_rating || 'Unrated',
      rating: h.site_review_rating,
      state: h.state || '',
      description: (h.hotel_description || '').slice(0, 180),
    }));
}

/**
 * Build a compact Markdown context block to inject into the AI prompt.
 * Returns an empty string if no data is found for the city.
 *
 * @param {string} city - city name from the user message
 * @param {'all'|'food'|'hotel'} mode - what type of data to include
 */
export function buildDataContext(city, mode = 'all') {
  const restaurants = (mode === 'hotel') ? [] : getTopRestaurants(city, 8);
  const hotels = (mode === 'food') ? [] : getTopHotels(city, 4);

  const lines = [];

  if (restaurants.length > 0) {
    lines.push('### 🍽️ Top-Rated Restaurants & Cafes (from Zomato data)');
    for (const r of restaurants) {
      const cost = r.costForTwo ? `₹${r.costForTwo} for two` : '';
      lines.push(`- **${r.name}** | ${r.cuisines} | ${r.type} | ⭐ ${r.rating} | ${cost} | ${r.location}`);
    }
    lines.push('');
  }

  if (hotels.length > 0) {
    lines.push('### 🏨 Recommended Hotels');
    for (const h of hotels) {
      lines.push(`- **${h.name}** | ${h.stars} | Review: ${h.rating}/10`);
      if (h.description) lines.push(`  → ${h.description}...`);
    }
    lines.push('');
  }

  return lines.length > 0
    ? `\n\n---\n**📊 Real Local Data** (reference these actual places in your suggestions):\n${lines.join('\n')}\n---\n`
    : '';
}
