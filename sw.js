// Minimal service worker — mainly here so Chrome/Android will treat this
// as an installable PWA. It caches the shell files (not the live Google
// Sheets/n8n data, which should always be fetched fresh).
const CACHE_NAME = 'sip-abacus-shell-v1';
const SHELL_FILES = ['./index.html', './logo.png', './logo-192.png', './logo-512.png', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache live data calls (Google Sheets CSV exports or n8n webhooks) —
  // the dashboard must always show current data, not stale cached data.
  if (url.hostname.includes('docs.google.com') || url.hostname.includes('n8n.')) {
    return;
  }

  // App shell files: try cache first, fall back to network.
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
