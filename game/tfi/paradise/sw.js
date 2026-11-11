const CACHE_NAME = 'st-games-paradise-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './dialogue.js',
  './audio.js',
  './characters.js',
  './missions.js',
  './controls.js',
  './game.js',
  './manifest.json',
  './assets/images/icon.svg',
  './assets/images/leader.png',
  './assets/images/mother.png',
  './assets/images/tribal.png',
  './assets/images/rebel.png',
  './assets/images/dog.png',
  './assets/images/crow.png',
  './assets/images/baby.png',
  './assets/images/guard_pistol.png',
  './assets/images/guard_bazooka.png',
  './assets/audio/paradise-bgm.mp3',
  './assets/audio/start-dialogue.mp3',
  './assets/audio/character-dialogue.mp3',
  './assets/audio/level-clear.mp3',
  './assets/audio/gameover.mp3',
  './assets/audio/danger-alert.mp3',
  './assets/audio/pass.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
