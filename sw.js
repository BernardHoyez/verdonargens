/* Service Worker — Rando Var
   Stratégie brise-cache : modifier CACHE_VERSION à chaque déploiement
   pour invalider tous les caches clients automatiquement. */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = 'rando-var-' + CACHE_VERSION;

const STATIC_ASSETS = [
  '/verdonargens/',
  '/verdonargens/index.html',
  '/verdonargens/manifest.json',
  '/verdonargens/css/app.css',
  '/verdonargens/js/app.js',
  '/verdonargens/js/formulaire.js',
  '/verdonargens/sorties/2025.json',
  '/verdonargens/icons/icon192.png',
  '/verdonargens/icons/icon512.png'
];

/* Installation : mise en cache des assets statiques */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activation : suppression des anciens caches (brise-cache) */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('rando-var-') && key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* Fetch : Cache-first pour assets statiques, Network-first pour JSON */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Laisser passer les requêtes externes (uMap, CDN) */
  if (!url.origin.includes('github.io') && !url.pathname.startsWith('/verdonargens')) {
    return;
  }

  /* Network-first pour les données JSON (sorties) */
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* Cache-first pour tout le reste */
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
      )
  );
});
