
const CACHE_NAME = 'stgames-apk-cache-v3';

const CORE_ASSETS = [
  '/',
  '/stgames-apk/index.html',
  '/stgames-apk/login.html',
  '/stgames-apk/app.mp3',
  '/stgames-apk/launchericon-192x192.png'
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        CORE_ASSETS.map(url => cache.add(url))
      );
    })
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key =>
              key.startsWith('stgames-apk-cache-') &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// CHECK AUDIO FILES
function isAudioRequest(request) {
  const url = new URL(request.url).pathname.toLowerCase();

  return (
    request.destination === 'audio' ||
    /\.(mp3|wav|ogg|m4a)$/i.test(url)
  );
}

// FETCH
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);

  // Leave external requests untouched
  if (requestUrl.origin !== self.location.origin) return;

  // Let audio range requests pass directly to the network
  if (request.headers.has('range')) {
    event.respondWith(fetch(request));
    return;
  }

  // 1. GAMES.JSON - NETWORK FIRST
  if (requestUrl.pathname.endsWith('/games.json')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const response = await fetch(request);

          if (response && response.status === 200) {
            event.waitUntil(
              cache.put('/games.json', response.clone())
            );
          }

          return response;
        } catch (error) {
          const cached = await cache.match('/games.json');

          if (cached) return cached;

          throw error;
        }
      })()
    );

    return;
  }

  // 2. AUDIO AND SONG FILES
  if (isAudioRequest(request)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        const cachedAudio = await cache.match(request.url, {
          ignoreSearch: true
        });

        if (cachedAudio) {
          return cachedAudio;
        }

        try {
          const audioResponse = await fetch(request.url, {
            method: 'GET',
            cache: 'no-cache'
          });

          if (audioResponse && audioResponse.status === 200) {
            event.waitUntil(
              cache.put(request.url, audioResponse.clone())
            );
          }

          return audioResponse;
        } catch (error) {
          return fetch(request);
        }
      })()
    );

    return;
  }

  // 3. OTHER GAME FILES - NETWORK FIRST
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const cachedResponse = await cache.match(request, {
        ignoreSearch: true
      });

      try {
        const networkResponse = await fetch(request);

        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type !== 'opaque'
        ) {
          event.waitUntil(
            cache.put(request, networkResponse.clone())
          );
        }

        return networkResponse;
      } catch (error) {
        if (cachedResponse) {
          return cachedResponse;
        }

        throw error;
      }
    })()
  );
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (const client of clientList) {
        if (
          client.url.includes('stgames.online') &&
          'focus' in client
        ) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(
          '/stgames-apk/index.html'
        );
      }
    })
  );
});
