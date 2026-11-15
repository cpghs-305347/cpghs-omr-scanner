// 1. Increment this version number every time you deploy an update to index.html
const CACHE_NAME = 'cpghs-omr-v21.2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 2. Install immediately without waiting for old tabs to close
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

// 3. Delete all old caches and take immediate control of open pages
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((oldName) => caches.delete(oldName))
      );
    }).then(() => self.clients.claim())
  );
});

// 4. Network-First for HTML pages (always gets newest index.html when online),
//    Cache-First for static assets (fast offline fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isHtmlRequest =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => caches.match(event.request) || caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
