const CACHE = 'vetadmin-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  // Eliminar cachés viejas de versiones anteriores
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  // Network first: siempre intenta red primero, caché solo si está offline
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) {
          caches.open(CACHE).then(cache => cache.put(event.request, res.clone()))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
