// ST Virtual World — Shared Validation, Design Catalog & Formatting Utilities

export const AP_BOUNDS = { minLat: 12.5, maxLat: 19.5, minLng: 76.5, maxLng: 85.0 };

export const HOUSE_DESIGNS = [
  { id: 'Modern Villa',       variant: 'v0',  accent: '#38d9ff' },
  { id: 'Coastal Bungalow',   variant: 'v1',  accent: '#2dd4bf' },
  { id: 'Glass Tower',        variant: 'v2',  accent: '#60a5fa' },
  { id: 'Heritage Courtyard', variant: 'v3',  accent: '#f59e0b' },
  { id: 'Garden Residence',   variant: 'v4',  accent: '#4ade80' },
  { id: 'Royal Mansion',      variant: 'v5',  accent: '#facc15' },
  { id: 'Sky Penthouse',      variant: 'v6',  accent: '#a78bfa' },
  { id: 'Lotus Villa',        variant: 'v7',  accent: '#fb7185' },
  { id: 'Classic Home',       variant: 'v8',  accent: '#fb923c' },
  { id: 'Cyber Loft',         variant: 'v9',  accent: '#22d3ee' },
  { id: 'Emerald Duplex',     variant: 'v10', accent: '#34d399' },
  { id: 'Crown Estate',       variant: 'v11', accent: '#fde047' }
];

export function getDesignMeta(designName) {
  return HOUSE_DESIGNS.find((d) => d.id === designName) || HOUSE_DESIGNS[0];
}

export function extractDisplayUsername(raw) {
  return String(raw ?? '').trim().replace(/^@+/, '');
}

export function normalizeUsername(raw) {
  return extractDisplayUsername(raw).toLowerCase();
}

export function validateInstagramUsername(raw) {
  const display = extractDisplayUsername(raw);
  const normalized = display.toLowerCase();
  if (!normalized) return { valid: false, normalized, display, error: 'Enter your Instagram username.' };
  if (normalized.length > 30) return { valid: false, normalized, display, error: 'Maximum 30 characters allowed.' };
  if (!/^[a-z0-9._]{1,30}$/.test(normalized)) {
    return { valid: false, normalized, display, error: 'Use only letters, numbers, periods (.) and underscores (_).' };
  }
  if (normalized.startsWith('.') || normalized.endsWith('.')) {
    return { valid: false, normalized, display, error: 'Username cannot start or end with a period.' };
  }
  if (normalized.includes('..')) {
    return { valid: false, normalized, display, error: 'Username cannot contain consecutive periods (..).' };
  }
  return { valid: true, normalized, display, error: '' };
}

export function isWithinAndhraBounds(lat, lng) {
  const nLat = Number(lat), nLng = Number(lng);
  return Number.isFinite(nLat) && Number.isFinite(nLng)
    && nLat >= AP_BOUNDS.minLat && nLat <= AP_BOUNDS.maxLat
    && nLng >= AP_BOUNDS.minLng && nLng <= AP_BOUNDS.maxLng;
}

export function clampToAndhraBounds(lat, lng) {
  return {
    lat: Math.min(AP_BOUNDS.maxLat, Math.max(AP_BOUNDS.minLat, Number(lat))),
    lng: Math.min(AP_BOUNDS.maxLng, Math.max(AP_BOUNDS.minLng, Number(lng)))
  };
}

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

export function formatCoord(num) {
  const n = Number(num);
  return Number.isFinite(n) ? n.toFixed(5) : '—';
}

export function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export function sanitizePlaceType(t) {
  const allowed = ['village', 'town', 'city', 'district', 'custom'];
  const v = String(t || '').toLowerCase().trim();
  return allowed.includes(v) ? v : 'town';
}
