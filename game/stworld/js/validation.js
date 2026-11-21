// ST Virtual World — Shared Validation, Admin Contact, Trending 3D Models & Landmarks Catalog

export const AP_BOUNDS = { minLat: 12.5, maxLat: 19.5, minLng: 76.5, maxLng: 85.0 };

export const ADMIN_CONTACT = {
  phoneDisplay: '6301798807',
  phoneHref: 'tel:+916301798807',
  whatsappHref: 'https://wa.me/916301798807?text=Hi%20Admin%2C%20I%20want%20to%20request%20an%20edit%20for%20my%20ST%20Virtual%20World%20house.',
  email: 'satishkommana630@gmail.com',
  emailHref: 'mailto:satishkommana630@gmail.com?subject=ST%20Virtual%20World%20House%20Edit%20Request',
  instagram: '_satish_official_16',
  instagramHref: 'https://www.instagram.com/_satish_official_16/'
};

export const HOUSE_DESIGNS = [
  // 12 GLB models (v0..v11)
  { id: 'Modern Villa',       variant: 'v0',  accent: '#38d9ff', kind: 'glb' },
  { id: 'Coastal Bungalow',   variant: 'v1',  accent: '#2dd4bf', kind: 'glb' },
  { id: 'Glass Tower',        variant: 'v2',  accent: '#60a5fa', kind: 'glb' },
  { id: 'Heritage Courtyard', variant: 'v3',  accent: '#f59e0b', kind: 'glb' },
  { id: 'Garden Residence',   variant: 'v4',  accent: '#4ade80', kind: 'glb' },
  { id: 'Royal Mansion',      variant: 'v5',  accent: '#facc15', kind: 'glb' },
  { id: 'Sky Penthouse',      variant: 'v6',  accent: '#a78bfa', kind: 'glb' },
  { id: 'Lotus Villa',        variant: 'v7',  accent: '#fb7185', kind: 'glb' },
  { id: 'Classic Home',       variant: 'v8',  accent: '#fb923c', kind: 'glb' },
  { id: 'Cyber Loft',         variant: 'v9',  accent: '#22d3ee', kind: 'glb' },
  { id: 'Emerald Duplex',     variant: 'v10', accent: '#34d399', kind: 'glb' },
  { id: 'Crown Estate',       variant: 'v11', accent: '#fde047', kind: 'glb' },
  // Trending Popular Procedural 3D House Models
  { id: 'Neon Cyber Mansion', variant: 'proc_cyber',   accent: '#00f5ff', kind: 'proc' },
  { id: 'Golden Palace',      variant: 'proc_palace',  accent: '#ffd700', kind: 'proc' },
  { id: 'Luxury Skyscraper',  variant: 'proc_tower',   accent: '#38bdf8', kind: 'proc' },
  { id: 'Beachfront Resort',  variant: 'proc_resort',  accent: '#2dd4bf', kind: 'proc' }
];

// Admin-only Popular Places / Landmarks 3D Models
export const LANDMARK_MODELS = [
  { id: 'Golden Gopuram Temple', variant: 'lm_temple',     icon: '🛕', category: 'Temple',     accent: '#f59e0b' },
  { id: 'Coastal Lighthouse',    variant: 'lm_lighthouse', icon: '🗼', category: 'Lighthouse', accent: '#ef4444' },
  { id: 'Grand Shopping Mall',   variant: 'lm_mall',       icon: '🏬', category: 'Mall',       accent: '#38bdf8' },
  { id: 'Tech Park Skyscraper',  variant: 'lm_techpark',   icon: '🏢', category: 'Tower',      accent: '#22d3ee' },
  { id: 'Cricket Stadium',       variant: 'lm_stadium',    icon: '🏟️', category: 'Stadium',    accent: '#4ade80' },
  { id: 'Heritage Monument',     variant: 'lm_monument',   icon: '🏛️', category: 'Monument',   accent: '#eab308' },
  { id: 'Clock Tower',           variant: 'lm_clocktower', icon: '🕰️', category: 'Tower',      accent: '#fb923c' },
  { id: 'Royal Arch Gate',       variant: 'lm_arch',       icon: '⛩️', category: 'Monument',   accent: '#f43f5e' }
];

export function getDesignMeta(designName) {
  return HOUSE_DESIGNS.find((d) => d.id === designName) || HOUSE_DESIGNS[0];
}

export function getLandmarkMeta(modelName) {
  return LANDMARK_MODELS.find((m) => m.id === modelName) || LANDMARK_MODELS[0];
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
