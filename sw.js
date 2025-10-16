const CACHE_NAME = 'mamcu-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/tee.html',
  '/assets/mamcu-logo.png',
  '/assets/css-placeholder',
  '/assets/js/translations.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, {mode: 'no-cors'}))).catch(err => {
        // Some hosts may block cross-origin; ignore failures for now
        console.warn('Some assets failed to cache during install:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        try {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
        } catch (e) {
          // ignore caching errors
        }
        return response;
      }).catch(() => cached || fetch(event.request));
    })
  );
});