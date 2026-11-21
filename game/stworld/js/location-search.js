// ST Virtual World — Andhra Pradesh Location Search & Hierarchical Filters
import { isWithinAndhraBounds } from './validation.js';

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MIN_REQUEST_INTERVAL_MS = 1100;
let lastNominatimCall = 0;
const queryCache = new Map();

const norm = (s) => String(s ?? '').trim().toLowerCase();

function classifyPlaceType(osmType, osmClass, addresstype) {
  const t = norm(addresstype || osmType);
  if (['village', 'hamlet', 'isolated_dwelling', 'locality', 'suburb', 'neighbourhood'].includes(t)) return 'village';
  if (['city', 'municipality'].includes(t)) return 'city';
  if (['town'].includes(t)) return 'town';
  if (['county', 'state_district', 'district'].includes(t)) return 'district';
  return osmClass === 'place' ? 'town' : 'town';
}

function extractDistrictName(addr, districtsList) {
  const candidates = [addr?.state_district, addr?.county, addr?.district, addr?.city_district].filter(Boolean);
  for (const raw of candidates) {
    const cleaned = raw.replace(/\s+district$/i, '').trim();
    const lc = cleaned.toLowerCase();
    const match = districtsList.find((d) => {
      const dl = d.d.toLowerCase();
      return dl === lc || dl.includes(lc) || lc.includes(dl);
    });
    if (match) return match.d;
    if (cleaned) return cleaned;
  }
  return 'Andhra Pradesh';
}

export class AndhraLocationSearch {
  constructor(andhraData) {
    this.data = andhraData || { districts: [], towns: [], villages: [] };
  }

  getDistricts() { return this.data.districts || []; }

  getTownsByDistrict(districtName) {
    const towns = this.data.towns || [];
    if (!districtName) return towns;
    const target = norm(districtName);
    return towns.filter((t) => norm(t.d) === target);
  }

  getVillagesByTown(townName, districtName = '') {
    if (!townName) return [];
    const targetTown = norm(townName);
    const targetDistrict = norm(districtName);
    return (this.data.villages || []).filter((v) => {
      const townMatch = norm(v.t) === targetTown;
      const distMatch = !targetDistrict || norm(v.d) === targetDistrict;
      return townMatch && distMatch;
    });
  }

  searchLocal(query, { district = '', town = '', placeType = '' } = {}) {
    const q = norm(query);
    if (!q) return [];
    const results = [];
    const distFilter = norm(district);
    const townFilter = norm(town);

    if (!placeType || placeType === 'village') {
      for (const v of this.data.villages || []) {
        if (distFilter && norm(v.d) !== distFilter) continue;
        if (townFilter && norm(v.t) !== townFilter) continue;
        if (norm(v.v).includes(q)) {
          results.push({
            name: v.v, placeType: 'village', town: v.t, district: v.d, state: 'Andhra Pradesh',
            lat: Number(v.lat), lng: Number(v.lng), source: 'local',
            displayLabel: `${v.v} (Village · near ${v.t}, ${v.d}, AP)`
          });
        }
      }
    }

    if (!placeType || placeType === 'town' || placeType === 'city') {
      for (const t of this.data.towns || []) {
        if (distFilter && norm(t.d) !== distFilter) continue;
        if (placeType && t.type !== placeType) continue;
        if (norm(t.t).includes(q)) {
          const typeLabel = t.type === 'city' ? 'City' : 'Town';
          results.push({
            name: t.t, placeType: t.type || 'town', town: t.t, district: t.d, state: 'Andhra Pradesh',
            lat: Number(t.lat), lng: Number(t.lng), source: 'local',
            displayLabel: `${t.t} (${typeLabel} · ${t.d}, AP)`
          });
        }
      }
    }

    if (!placeType || placeType === 'district') {
      for (const d of this.data.districts || []) {
        if (distFilter && norm(d.d) !== distFilter) continue;
        if (norm(d.d).includes(q)) {
          results.push({
            name: d.d, placeType: 'district', town: '', district: d.d, state: 'Andhra Pradesh',
            lat: Number(d.lat), lng: Number(d.lng), source: 'local',
            displayLabel: `${d.d} (District · Andhra Pradesh)`
          });
        }
      }
    }
    return results.slice(0, 12);
  }

  async searchNominatim(query, { district = '', town = '' } = {}) {
    const trimmed = String(query ?? '').trim();
    if (trimmed.length < 2) return [];

    const scopeParts = [trimmed];
    if (town) scopeParts.push(town);
    if (district) scopeParts.push(district);
    scopeParts.push('Andhra Pradesh', 'India');
    const fullQuery = scopeParts.join(', ');
    const cacheKey = fullQuery.toLowerCase();
    if (queryCache.has(cacheKey)) return queryCache.get(cacheKey);

    const waitMs = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastNominatimCall);
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    lastNominatimCall = Date.now();

    const params = new URLSearchParams({
      q: fullQuery, format: 'jsonv2', addressdetails: '1', countrycodes: 'in',
      limit: '10', viewbox: '76.5,19.5,85.0,12.5', bounded: '1'
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!resp.ok) throw new Error(`Nominatim HTTP ${resp.status}`);
      const rows = await resp.json();
      const mapped = [];
      const seen = new Set();
      for (const row of rows) {
        const lat = Number(row.lat), lng = Number(row.lon);
        if (!isWithinAndhraBounds(lat, lng)) continue;
        const addr = row.address || {};
        const state = String(addr.state || '');
        if (state && !state.toLowerCase().includes('andhra')) continue;

        const name = (row.name || row.display_name?.split(',')[0] || trimmed).trim();
        const placeType = classifyPlaceType(row.type, row.class, row.addresstype);
        const districtName = extractDistrictName(addr, this.data.districts || []);
        const key = `${norm(name)}|${norm(districtName)}|${placeType}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const typeLabel = placeType.charAt(0).toUpperCase() + placeType.slice(1);
        mapped.push({
          name, placeType, town: addr.town || addr.city || town || '',
          district: districtName, state: 'Andhra Pradesh', lat, lng, source: 'nominatim',
          displayLabel: `${name} (${typeLabel} · ${districtName}, Andhra Pradesh)`
        });
      }
      queryCache.set(cacheKey, mapped);
      return mapped;
    } catch (err) {
      console.warn('Nominatim search fallback to local index:', err?.message || err);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }

  async search(query, filters = {}) {
    const local = this.searchLocal(query, filters);
    const remote = await this.searchNominatim(query, filters);
    const merged = [];
    const seen = new Set();
    for (const item of [...local, ...remote]) {
      const key = `${norm(item.name)}|${norm(item.district)}|${item.placeType}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged.slice(0, 12);
  }
}
