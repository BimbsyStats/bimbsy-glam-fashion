// Bimbsy Glam Fashion service worker. Caches only public, non-personal files.
// Never caches: admin pages, Supabase calls, Paystack, order or customer data.
const VERSION = 'bg-v1';
const SHELL = ['./offline.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // Supabase, Paystack, fonts: network only
  if (url.pathname.endsWith('admin.html') || url.pathname.includes('/admin')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match('./offline.html')));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res;
      }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./offline.html')))
    );
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
