/* Service Worker — Rando Var
   Chemins relatifs : fonctionne sur GitHub Pages ET en local.
   Brise-cache : incrémenter CACHE_VERSION à chaque déploiement. */

const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME    = 'rando-var-' + CACHE_VERSION;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/formulaire.js',
  './sorties/2025.json',
  './icons/icon192.png',
  './icons/icon512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('rando-var-') && k !== CACHE_NAME)
            .map(k => { console.log('[SW] Suppression cache:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  /* Ignorer les requêtes externes (uMap, CDN) */
  if (!event.request.url.includes(self.location.origin)) return;

  /* Network-first pour le JSON des sorties */
  if (event.request.url.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(ca => ca.put(event.request, c)); return r; })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* Cache-first pour tout le reste */
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(ca => ca.put(event.request, c)); return r; })
      )
  );
});
