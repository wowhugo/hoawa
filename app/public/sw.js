const CACHE_NAME = 'hoawa-v1'
const urlsToCache = [
    '/',
    '/baby.png',
    '/hoawa1.mp3',
    '/hoawa2.mp3',
    '/hoawa3.mp3',
    '/hoawa4.mp3',
    '/hoawa5.mp3'
]

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    )
    self.skipWaiting()
})

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    )
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    self.clients.claim()
})
