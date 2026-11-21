
/* ST GAMES Root Service Worker
   Website: https://stgames.online/
   Purpose:
   - Cache downloaded game assets.
   - Support offline game loading.
   - Cache the ST GAMES APK app shell.
*/

"use strict";

const GAME_CACHE = "stgames-apk-cache-v4";
const SW_CACHE = "stgames-root-shell-v1";

const APP_SHELL = [
  "/stgames-apk/",
  "/stgames-apk/index.html",
  "/stgames-apk/manifest.json"
];

// Install service worker
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SW_CACHE);

    await Promise.allSettled(
      APP_SHELL.map(url => cache.add(url))
    );

    await self.skipWaiting();
  })());
});

// Activate service worker
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

// Handle GET requests
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  // Only handle same-origin requests.
  const requestURL = new URL(request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const gameCache = await caches.open(GAME_CACHE);
    const shellCache = await caches.open(SW_CACHE);

    // 1. Check downloaded game assets.
    let cached = await gameCache.match(request);

    // 2. Check without query strings.
    if (!cached) {
      cached = await gameCache.match(request, {
        ignoreSearch: true
      });
    }

    if (cached) {
      return cached;
    }

    // 3. Check cached app shell.
    cached = await shellCache.match(request, {
      ignoreSearch: true
    });

    if (cached) {
      return cached;
    }

    // 4. Try online network.
    try {
      return await fetch(request);
    } catch (error) {

      // 5. Offline navigation fallback.
      if (request.mode === "navigate") {
        const fallback = await shellCache.match(
          "/stgames-apk/index.html"
        );

        if (fallback) {
          return fallback;
        }
      }

      // 6. Asset unavailable offline.
      return new Response(
        "This file is not saved for offline use. Connect to the internet and download the game first.",
        {
          status: 503,
          statusText: "Offline asset unavailable",
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      );
    }
  })());
});
