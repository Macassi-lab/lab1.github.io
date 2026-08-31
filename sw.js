/* Service Worker — Parcours Biblique
   Permet le fonctionnement hors ligne et l'installation PWA. */
const CACHE_NAME = 'parcours-biblique-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

// Installation : pré-cache des fichiers essentiels
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activation : purge des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Récupération : cache d'abord, puis réseau
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (event.request.method === 'GET' && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Repli hors ligne pour les navigations
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return new Response('Hors ligne', { status: 503, statusText: 'Hors ligne' });
            });
        })
    );
});
