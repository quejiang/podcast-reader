const CACHE = 'podcast-reader-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './css/style.css',
  './js/state.js',
  './js/storage.js',
  './js/highlight.js',
  './js/bookmarks.js',
  './js/annotations.js',
  './js/tts.js',
  './js/edge-tts.js',
  './js/ai-tts.js',
  './js/player.js',
  './js/import.js',
  './js/analytics.js',
  './js/ui.js',
  './js/tutorial.js',
  './js/i18n.js',
  './js/idb-storage.js',
  './js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Notify all clients about the update, then clean old caches
  e.waitUntil(
    Promise.all([
      self.clients.matchAll({ type: 'window' }).then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: 'sw-updated', version: '3.5' });
        });
      }),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
    ])
  );
  self.clients.claim();
});

// Share Target: 接收分享的文件/文本
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (e.request.method === 'POST' && url.pathname.endsWith('/') && url.searchParams.get('action') === 'shared') {
    e.respondWith(
      (async function() {
        const formData = await e.request.formData();
        const client = await self.clients.get(e.resultingClientId || (await self.clients.matchAll({ type: 'window' }))[0]?.id);
        if (client) {
          const shared = {};
          shared.text = formData.get('text') || '';
          shared.title = formData.get('title') || '';
          const file = formData.get('file');
          if (file && file.size) {
            const buf = await file.arrayBuffer();
            shared.fileName = file.name;
            shared.fileType = file.type;
            shared.fileSize = file.size;
            const shareCache = await caches.open('share-target');
            await shareCache.put('shared-file', new Response(buf, { headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) } }));
            shared.hasFile = true;
          }
          client.postMessage({ type: 'share-target', data: shared });
        }
        return Response.redirect('./?action=shared', 303);
      })()
    );
    return;
  }

  if (e.request.method !== 'GET') return;

  if (url.pathname.includes('/v1/') || url.pathname.includes('/consumer/speech/')) return;

  // Network-first for HTML & JS/CSS (always fresh), cache fallback
  var isAppFile = e.request.destination === 'document' ||
                  e.request.destination === 'script' ||
                  e.request.destination === 'style' ||
                  url.pathname.endsWith('/') ||
                  url.pathname.endsWith('.html') ||
                  url.pathname.endsWith('.js') ||
                  url.pathname.endsWith('.css');
  if (isAppFile) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match(e.request); })
    );
    return;
  }

  // Cache-first for images, icons, fonts, etc.
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetched = fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return resp;
      }).catch(function() { return cached; });
      return cached || fetched;
    })
  );
});

// 监听 app.js 发来的 share file 请求
self.addEventListener('message', async (evt) => {
  if (evt.data && evt.data.type === 'get-shared-file') {
    const cache = await caches.open('share-target');
    const resp = await cache.match('shared-file');
    if (resp) {
      const blob = await resp.blob();
      const name = decodeURIComponent(resp.headers.get('X-File-Name') || 'shared-file');
      const file = new File([blob], name, { type: resp.headers.get('Content-Type') || 'application/octet-stream' });
      evt.ports[0].postMessage({ file: file });
      await cache.delete('shared-file');
    } else {
      evt.ports[0].postMessage({ file: null });
    }
  }
});
