// LIDERS CHAT Service Worker v2
// Стратегия: HTML всегда с сети, иконки кешируем

const CACHE = 'liders-chat-v2';
const STATIC = [
  '/securegram/icon-192.png',
  '/securegram/icon-512.png',
  '/securegram/icon-192-maskable.png',
  '/securegram/manifest.json',
  '/securegram/favicon.ico',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET, cross-origin, PeerJS, API calls
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.pathname.includes('/relay')) return;
  if (url.pathname.includes('/signal')) return;

  // HTML — ALWAYS network first, never serve stale
  if (e.request.headers.get('accept')?.includes('text/html') ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/securegram/' ||
      url.pathname === '/securegram') {
    e.respondWith(
      fetch(e.request, {cache: 'no-cache'})
        .catch(() => caches.match('/securegram/') || caches.match('/securegram/index.html'))
    );
    return;
  }

  // Icons and manifest — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
