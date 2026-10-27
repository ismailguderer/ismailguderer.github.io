// CACHE and PAGES are prepended by src/pages/bio-assist/sw.js.ts at build time.

// absolute /_astro/ URLs (HTML, CSS fonts) and sibling imports like from"./react.X.js" inside chunks
const ASSET_RE = /\/_astro\/[^"'\s)]+/g;
const IMPORT_RE = /(?:from|import)\s*\(?\s*["']\.\/([^"']+\.js)["']/g;

// precache every tool page and the assets it references, following chunk imports
// any failure rejects, so a partial cache never replaces the working one
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const seen = new Set();
    const queue = [];
    const add = (u) => { if (!seen.has(u)) { seen.add(u); queue.push(u); } };
    for (const url of PAGES) {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`precache ${url}: ${res.status}`);
      await cache.put(url, res.clone());
      for (const a of (await res.text()).match(ASSET_RE) || []) add(a);
    }
    while (queue.length) {
      const a = queue.pop();
      const res = await fetch(a);
      if (!res.ok) throw new Error(`precache ${a}: ${res.status}`);
      await cache.put(a, res.clone());
      if (!/\.(js|css)$/.test(a)) continue;
      const text = await res.text();
      for (const m of text.match(ASSET_RE) || []) add(m);
      for (const m of text.matchAll(IMPORT_RE)) add(`/_astro/${m[1]}`);
    }
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('bio-assist-') && key !== CACHE) await caches.delete(key);
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // hashed build assets never change: cache first
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy))); }
      return res;
    })));
    return;
  }

  // pages: network first, cache when offline or the network stalls for 4 s
  if (url.pathname.startsWith('/bio-assist/')) {
    event.respondWith((async () => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); event.waitUntil(caches.open(CACHE).then((c) => c.put(url.pathname, copy))); }
        return res;
      });
      const first = await Promise.race([net.catch(() => null), new Promise((r) => setTimeout(r, 4000, null))]);
      if (first) return first;
      return (await caches.match(url.pathname)) || net;
    })());
  }
});
