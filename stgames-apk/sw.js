
const CACHE_NAME = "stgames-apk-cache-v4";

const APP_SHELL = [
  "/stgames-apk/index.html",
  "/stgames-apk/login.html",
  "/stgames-apk/app.mp3",
  "/stgames-apk/launchericon-192x192.png",
  "/stgames-apk/launchericon-512x512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.allSettled(
      APP_SHELL.map(url => cache.add(url))
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/stgames-apk/")) return;

  // Allow audio range requests to reach the network.
  if (request.headers.has("range")) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // App page: network first, cached page as offline fallback.
    if (request.mode === "navigate") {
      try {
        const response = await fetch(request);

        if (response && response.status === 200) {
          await cache.put(
            "/stgames-apk/index.html",
            response.clone()
          );
        }

        return response;
      } catch (error) {
        const fallback = await cache.match(
          "/stgames-apk/index.html"
        );

        if (fallback) return fallback;

        throw error;
      }
    }

    // App assets: cache first, then network.
    const cached = await cache.match(request, {
      ignoreSearch: true
    });

    if (cached) return cached;

    const response = await fetch(request);

    if (
      response &&
      response.status === 200 &&
      response.type !== "opaque"
    ) {
      event.waitUntil(
        cache.put(request, response.clone())
      );
    }

    return response;
  })());
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil((async () => {
    const target = "/stgames-apk/index.html";

    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of windows) {
      if (
        client.url.includes("/stgames-apk/") &&
        "focus" in client
      ) {
        return client.focus();
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(target);
    }
  })());
});
