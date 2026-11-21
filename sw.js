/* ST GAMES root service worker.
   Upload this file to https://stgames.online/sw.js.
   It lets pages under /game/ read assets saved by the app downloader. */
"use strict";

const GAME_CACHE = "stgames-apk-cache-v4";
const SW_CACHE = "stgames-root-shell-v1";
const APP_SHELL = [
  "/stgames-apk/",
  "/stgames-apk/index.html",
  "/stgames-apk/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SW_CACHE);
    await Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith((async () => {
    const gameCache = await caches.open(GAME_CACHE);

    // Exact request first; ignore query strings as a fallback for versioned assets.
    let cached = await gameCache.match(request);
    if (!cached) {
      cached = await gameCache.match(request.url, { ignoreSearch: true });
    }
    if (cached) return cached;

    // Also check the app shell cache for the lobby itself.
    const shellCache = await caches.open(SW_CACHE);
    cached = await shellCache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    try {
      return await fetch(request);
    } catch (error) {
      // Offline navigation fallback: serve the cached app lobby if available.
      if (request.mode === "navigate") {
        const fallback = await shellCache.match("/stgames-apk/index.html");
        if (fallback) return fallback;
      }
      return new Response("This file is not saved for offline use. Connect to the internet and download the game first.", {
        status: 503,
        statusText: "Offline asset unavailable",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
self.options = {
    "domain": "5gvci.com",
    "zoneId": 12313773
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')
