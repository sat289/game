/* ST GAMES root service worker
   Required location: https://stgames.online/sw.js
   This root scope is necessary because games are served from /game/, not only /stgames-apk/.
*/
"use strict";

const ST_GAME_CACHE = "stgames-apk-cache-v4";
const ST_SHELL_CACHE = "stgames-shell-v1";
const ST_APP_SHELL = [
  "/stgames-apk/index.html",
  "/stgames-apk/manifest.json",
  "/stgames-apk/launchericon-192x192.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(ST_SHELL_CACHE);
    await Promise.allSettled(ST_APP_SHELL.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith("stgames-apk-cache-") && name !== ST_GAME_CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Cross-origin assets can still be returned from CacheStorage if the
    // downloader previously saved them as opaque responses.
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch (_) {
        return new Response("This asset is not available offline.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    // Exact cache-first lookup: game HTML, styles, scripts, images and audio
    // are stored by the download manager in ST_GAME_CACHE.
    const gameCache = await caches.open(ST_GAME_CACHE);
    const savedGameAsset = await gameCache.match(request);
    if (savedGameAsset) return savedGameAsset;

    const shellCache = await caches.open(ST_SHELL_CACHE);
    const shellAsset = await shellCache.match(request);
    if (shellAsset) return shellAsset;

    try {
      return await fetch(request);
    } catch (_) {
      // A clear offline response is better than an indefinite failed request.
      return new Response(
        "<!doctype html><html><meta name='viewport' content='width=device-width,initial-scale=1'><title>Offline</title><body style='font-family:Arial;padding:24px;background:#0f172a;color:white'><h2>ST GAMES is offline</h2><p>This file was not saved on this device. Connect to the internet and download this game first.</p></body></html>",
        {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        }
      );
    }
  })());
});

