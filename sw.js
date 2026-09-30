/* Service Worker - Parcours Biblique
   Mode hors ligne + installation PWA. */
const CACHE_NAME = 'parcours-biblique-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
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

// Récupération
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Ignorer les méthodes autres que GET et les requêtes hors de l'origine du site
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    // Navigations (le fichier HTML) : réseau d'abord, cache en secours.
    // Ainsi les mises à jour du site sont visibles immédiatement, sans vider le cache.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Autres ressources (icônes, manifest) : cache d'abord, réseau en secours.
    event.respondWith(
        caches.match(request).then((cached) => {
            return cached || fetch(request).then((response) => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
