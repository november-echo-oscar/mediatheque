const CACHE_NAME = 'mediatheque-cache-v1';
const ASSETS_TO_CACHE = [
  './Mediatheque.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Événement d'installation : Mise en cache des ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Événement d'activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie Réseau d'abord, sinon Cache (idéal pour une app connectée à Firebase)
self.addEventListener('fetch', (event) => {
  // On ne gère pas les requêtes Firestore complexes (WebSockets/POST) via le cache standard
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la réponse est valide, on met à jour le cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // En cas de panne réseau, on pioche dans le cache
        return caches.match(event.request);
      })
  );
});