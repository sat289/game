
/* ST GAMES + MONETAG SERVICE WORKER
   Upload to: https://stgames.online/sw.js
*/

"use strict";

/* ==============================
   MONETAG INTEGRATION
============================== */

self.options = {
    domain: "5gvci.com",
    zoneId: 12313773
};

self.lary = "";

importScripts(
    "https://5gvci.com/act/files/service-worker.min.js?r=sw"
);

/* ==============================
   ST GAMES CACHE SETTINGS
============================== */

const GAME_CACHE = "stgames-apk-cache-v4";
const SW_CACHE = "stgames-root-shell-v1";

const APP_SHELL = [
    "/stgames-apk/",
    "/stgames-apk/index.html",
    "/stgames-apk/manifest.json"
];

/* ==============================
   INSTALL
============================== */

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(SW_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

/* ==============================
   ACTIVATE
============================== */

self.addEventListener("activate", event => {
    event.waitUntil(
        self.clients.claim()
    );
});

/* ==============================
   FETCH - OFFLINE GAME SUPPORT
============================== */

self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Only handle requests from this website.
    if (url.origin !== self.location.origin) return;
   // Always fetch the latest game catalog from the server.
if (url.pathname === "/games.json") {
    event.respondWith(
        fetch(request, { cache: "no-store" })
    );
    return;
}

    event.respondWith((async () => {
        try {
            // First: check downloaded game cache.
            const gameCache = await caches.open(GAME_CACHE);

            let cachedResponse = await gameCache.match(request);

            if (!cachedResponse) {
                cachedResponse = await gameCache.match(request, {
                    ignoreSearch: true
                });
            }

            if (cachedResponse) {
                return cachedResponse;
            }

            // Second: check ST GAMES app shell.
            const shellCache = await caches.open(SW_CACHE);

            cachedResponse = await shellCache.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            // Third: try internet.
            return await fetch(request);

        } catch (error) {

            // Offline fallback for app navigation.
            if (request.mode === "navigate") {
                const shellCache = await caches.open(SW_CACHE);

                const offlinePage = await shellCache.match(
                    "/stgames-apk/index.html"
                );

                if (offlinePage) {
                    return offlinePage;
                }
            }

            return new Response(
                "You are offline. This game or page is not downloaded yet.",
                {
                    status: 503,
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8"
                    }
                }
            );
        }
    })());
});
