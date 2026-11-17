/**
 * ============================================================================
 * CPGHS OPTICAL MARK RECOGNITION (OMR) EXAM CHECKER — SERVICE WORKER (v23)
 * ============================================================================
 */

const CACHE_NAME = 'cpghs-omr-v23';
const ASSETS = [
  './',
  './index.html',
  './answer-sheet.html',
  './manifest.json',
  './CPGHS-OMR_Logo.jpg',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://docs.opencv.org/4.8.0/opencv.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com')) {
    return;
  }

  if (event.request.mode === 'navigate' || url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
