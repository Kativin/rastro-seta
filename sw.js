// Sube este número en cada nueva versión (o cambia cualquier archivo): los móviles se actualizan solos.
const VERSION = 'rastro-seta-v8';
const APP = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'];
const TILES = 'rastro-seta-tiles-cors';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== TILES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Teselas del mapa: caché primero (sirven sin cobertura en zonas ya vistas)
  if (/tile\.openstreetmap\.org|arcgisonline\.com/.test(url.host)) {
    e.respondWith(caches.open(TILES).then(c => c.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok) c.put(req, res.clone()); return res; }))));
    return;
  }
  // App: red primero (siempre la última versión), caché si no hay conexión
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch: true})));
});
