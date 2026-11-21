// ST Virtual World Service Worker v2.1.0
// Network-first for app code (HTML/JS/CSS/JSON) so deployments never leave stale JS cached.
// Cache-first for immutable vendor/binary assets (fonts, maplibre, three-bundle, houses.glb).

const CACHE_VERSION = 'st-virtual-world-v2.1.0';
const STATIC_VENDOR_ASSETS = [
  './lib/maplibre-gl.css',
  './lib/maplibre-gl.js',
  './lib/three-bundle.js',
  './houses.glb',
  './lib/fonts/poppins-latin-500-normal.woff2',
  './lib/fonts/poppins-latin-600-normal.woff2',
  './lib/fonts/poppins-latin-700-normal.woff2',
  './lib/fonts/poppins-latin-800-normal.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_VENDOR_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const isVendorAsset = url.pathname.includes('/lib/') || url.pathname.endsWith('/houses.glb') || url.pathname.endsWith('.woff2');
  if (isVendorAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
        }
        return resp;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then((resp) => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
      }
      return resp;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
