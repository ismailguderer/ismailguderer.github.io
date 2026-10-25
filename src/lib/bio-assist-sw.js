// CACHE and PAGES are prepended by src/pages/bio-assist/sw.js.ts at build time.

const ASSET_RE = /\/_astro\/[^"'\s)]+/g;

// precache every tool page and the assets it references
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const url of PAGES) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) continue;
        await cache.put(url, res.clone());
        const assets = [...new Set((await res.text()).match(ASSET_RE) || [])];
        await Promise.all(assets.map((a) => cache.add(a).catch(() => {})));
      } catch {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('bio-assist-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // hashed build assets never change: cache first
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
      return res;
    })));
    return;
  }

  // pages: network first, cache as the offline fallback
  if (url.pathname.startsWith('/bio-assist/')) {
    event.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); }
      return res;
    }).catch(() => caches.match(url.pathname).then((hit) => hit || Response.error())));
  }
});
