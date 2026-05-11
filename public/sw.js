// ─── Calnza Service Worker ───────────────────────────────────────────────────
// Versioned cache — bump CACHE_VERSION on each deploy to bust stale assets.
// Do NOT hardcode app URLs here; the SW only handles relative paths so it works
// in both dev (localhost) and production (calnza.com) without modification.

const CACHE_VERSION = 'v4'
const CACHE_NAME = `calnza-cache-${CACHE_VERSION}`

// Pre-cached shell assets — loaded at install time for offline support
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/bgless-logo.png',
]

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // addAll is all-or-nothing; individual failures won't break the SW
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Pre-cache partial failure (non-fatal):', err)
      })
    })
  )
  self.skipWaiting()
})

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('calnza-cache-') && k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Deleting old cache:', k)
            return caches.delete(k)
          })
      )
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // 1. Never intercept non-GET requests
  if (event.request.method !== 'GET') return

  // 2. Never cache API routes — always live network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // 3. Never cache monitoring/sentry tunnel
  if (url.pathname.startsWith('/monitoring')) {
    event.respondWith(fetch(event.request))
    return
  }

  // 4. HTML navigation: network-first, fall back to /offline on failure
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/offline').then(r => r || new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // 5. Next.js JS/CSS chunks: network-first then cache
  //    (hashed filenames invalidate automatically; cache is just a fallback)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // 6. Static assets (images, fonts, icons): cache-first, network fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?|ttf|otf)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // 7. Everything else: network-first
  event.respondWith(fetch(event.request))
})
