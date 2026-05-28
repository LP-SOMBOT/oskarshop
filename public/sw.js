const CACHE = 'oskarshop-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(r => {
      return r || fetch(e.request).then(response => {
        // Optional: Cache successful requests here
        return response;
      });
    })
  );
});
