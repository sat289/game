const CACHE_NAME = 'stgames-apk-v2';

// Core files & offline games from your games.json to cache on the phone
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/games.json',
  '/manifest.webmanifest',
  '/logo/logo.jpg',
  '/logo/Insta.jpg',
  '/logo/sub.jpg',
  '/game/Wheel%20master/index.html',
  '/game/rope.html',
  '/game/Spacewaces.html',
  '/game/thief/index.html',
  '/game/nuts.html',
  '/game/Toilet%20rush/index.html',
  '/game/salazar.html',
  '/game/merge.html',
  '/game/subway/index.html',
  '/game/tictactoe/index.html',
  '/game/snake/index.html',
  '/game/fruit.html',
  '/game/clumsy.html',
  '/game/fight.html',
  '/game/ladder/index.html',
  '/game/typerace/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (_) {}
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)))
    )
  );
  self.clients.claim();
});

// Network-first when online (saves every game asset visited), fallback to Offline Cache when internet is OFF
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.hostname.includes('googlesyndication') || url.hostname.includes('googletagmanager')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          return cachedResponse || caches.match('/index.html');
        });
      })
  );
});