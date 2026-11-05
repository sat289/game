const CACHE_NAME = 'stgames-offline-v2';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// Automatically save every game file, image, script, and sound opened by the player
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 1. If the user is online, fetch fresh copy and save to offline storage
            if (navigator.onLine) {
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
            // 2. If the user is OFFLINE, load directly from saved cache!
            return cachedResponse || fetch(event.request);
        })
    );
});
