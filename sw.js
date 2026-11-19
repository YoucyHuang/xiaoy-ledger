// 小Y记账本 · 离线缓存。改了页面文件后，把 VERSION 加一，手机下次打开会自动更新。
const VERSION = 'xy-ledger-v4';
const CORE = ['./', './index.html', './shared.js', './keys.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 页面本身：先上网拿新的，断网就用缓存
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(VERSION).then((x) => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 其他文件（脚本、图标、字体）：有缓存就直接用，顺手在后台更新
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSION).then((x) => x.put(req, c)); } return r; })
      .catch(() => hit);
    return hit || net;
  }));
});
