const CACHE_NAME = 'stgames-apk-cache-v3';

const CORE_ASSETS = [
  '/',
  '/stgames-apk/index.html',
  '/stgames-apk/login.html',
  '/stgames-apk/app.mp3',
  '/stgames-apk/launchericon-192x192.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(CORE_ASSETS.map(url => cache.add(url)));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Check if a request is an audio/song file
function isAudioRequest(request) {
  const url = request.url.toLowerCase();
  return (
    request.destination === 'audio' ||
    url.endsWith('.mp3') ||
    url.endsWith('.wav') ||
    url.endsWith('.ogg') ||
    url.endsWith('.m4a') ||
    request.headers.has('range')
  );
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const reqUrl = event.request.url;

  // 1. Always fetch fresh games.json when online so deleted/new games stay synced
  if (reqUrl.includes('games.json') && self.navigator.onLine) {
    event.respondWith(
      fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/games.json', clone));
        }
        return res;
      }).catch(() => caches.match('/games.json'))
    );
    return;
  }

  // 2. SPECIAL HANDLER FOR SONGS & AUDIO FILES (Fixes HTTP 206 Range Bug)
  if (isAudioRequest(event.request)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        // Check if we already saved the full song in cache (ignoring query params)
        const cachedAudio = await cache.match(event.request.url, { ignoreSearch: true });
        if (cachedAudio) {
          return cachedAudio;
        }

        // If online and not cached yet, fetch the FULL song (without Range header) so status is 200 and cacheable
        try {
          const cleanAudioResponse = await fetch(event.request.url, {
            method: 'GET',
            cache: 'no-cache'
          });

          if (cleanAudioResponse && cleanAudioResponse.status === 200) {
            cache.put(event.request.url, cleanAudioResponse.clone());
          }
          return cleanAudioResponse;
        } catch (err) {
          return fetch(event.request);
        }
      })
    );
    return;
  }

  // 3. ALL OTHER GAME FILES (HTML, JS, CSS, Images)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (self.navigator.onLine) {
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      }
      return cachedResponse || fetch(event.request);
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('stgames.online') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/stgames-apk/index.html');
      }
    })
  );
});
