// UNIBUZZ Service Worker - Network First Strategy
// This ensures fresh JS/CSS is always loaded from the server
const CACHE_NAME = 'unibuzz-v5';
const STATIC_CACHE = ['https://unpkg.com/@phosphor-icons/web',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'];

self.addEventListener('install', event => {
  // Skip waiting so new SW activates immediately
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE).catch(() => {})));
});

self.addEventListener('activate', event => {
  // Take control immediately and delete all old caches
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ALWAYS fetch from network for app files - never use cache
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for fonts and icons only
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
