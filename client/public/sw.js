// VIBE MUSIC Service Worker - App Shell Caching & Offline Support
const CACHE_NAME = 'vibe-music-v1.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/vibe-music-logo.png',
];

// Install: Cache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for dynamic content & APIs; bypass media audio/video streams!
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // STRICT RULE: Never intercept or cache audio/video streaming requests
  // Audio playback relies strictly on HTML5 audio element & MediaSession
  if (
    event.request.destination === 'audio' ||
    event.request.destination === 'video' ||
    url.pathname.includes('/stream') ||
    url.hostname.includes('audius.co') ||
    url.hostname.includes('apple.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('deezer.com') ||
    url.hostname.includes('sndcdn.com')
  ) {
    return;
  }

  // Bypass API requests to allow fresh live data
  if (url.pathname.startsWith('/api') || url.hostname.includes('googleapis.com')) {
    return;
  }

  // For navigational requests (HTML documents), try network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, images, fonts)
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, toCache);
          });
          return response;
        }).catch(() => {
          // Graceful fallback for failed static assets
          return cached;
        });
      })
    );
    return;
  }

  // Default network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
