/* ============================================================
   Service Worker — Rando Var  |  BRISE-CACHE
   Incrémenter CACHE_VERSION à chaque déploiement :
   tous les navigateurs téléchargeront la nouvelle version.
   ============================================================ */

const CACHE_VERSION = 'v1.0.6';
const CACHE_NAME    = 'rando-var-' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/formulaire.js',
  './icons/icon192.png',
  './icons/icon512.png'
  /* NE PAS mettre sorties/2025.json ici :
     il doit toujours être rechargé depuis le réseau */
];

/* ── INSTALL : mise en cache des assets statiques ── */
self.addEventListener('install', event => {
  console.log('[SW] Install', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())   /* active immédiatement sans attendre */
  );
});

/* ── ACTIVATE : suppression de TOUS les anciens caches (brise-cache) ── */
self.addEventListener('activate', event => {
  console.log('[SW] Activate', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)   /* conserver seulement la version courante */
          .map(k => {
            console.log('[SW] Suppression cache obsolète :', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())    /* prend le contrôle de tous les onglets */
  );
});

/* ── FETCH : stratégie mixte ── */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  /* Laisser passer les requêtes cross-origin (uMap, CDN tabler-icons…) */
  if (!url.startsWith(self.location.origin)) return;

  /* ► Network-FIRST pour le JSON des sorties
       → toujours la version la plus récente du serveur
       → fallback cache si hors connexion                */
  if (url.includes('sorties/') && url.endsWith('.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* ► Cache-FIRST pour les assets statiques
       → réponse instantanée depuis le cache
       → mise à jour en arrière-plan si en ligne  */
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
