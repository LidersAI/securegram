// SecureGram Service Worker
const CACHE = 'securegram-v1';
const ASSETS = [
  '/securegram/',
  '/securegram/index.html',
  '/securegram/manifest.json',
  '/securegram/icon-192.png',
  '/securegram/icon-512.png',
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache first for assets, network first for API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin (PeerJS, fonts, etc)
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // Network first for HTML (always get latest version)
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for everything else (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

// Push notifications (for future use)
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'SecureGram', {
    body: data.body || '',
    icon: '/securegram/icon-192.png',
    badge: '/securegram/icon-96.png',
    vibrate: [200, 100, 200],
    data: data,
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/securegram/'));
});
