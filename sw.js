/**
 * 噗通日记本 Service Worker
 * 作用：缓存应用外壳（页面+图标），让手机桌面图标打开更快、断网也能打开基础界面
 * 注意：记账数据不走这里缓存（数据在云端数据库，需要联网）
 */
var CACHE_NAME = 'putong-diary-v1';
var CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/black-cat.png',
  '/assets/black-cat-emoji.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// 安装：预缓存核心文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(CORE_ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

// 激活：清理旧版本缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// 请求：静态资源优先缓存；页面网络优先、断网回退缓存
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // API 请求不缓存（数据需要实时）
  if (url.pathname.indexOf('/api/') === 0) return;

  // 核心静态资源：缓存优先（快）
  if (CORE_ASSETS.indexOf(url.pathname) !== -1) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(res) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
          return res;
        });
      })
    );
    return;
  }

  // 其他（如 / 页面）：网络优先，失败回退缓存
  event.respondWith(
    fetch(req).then(function(res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
      }
      return res;
    }).catch(function() {
      return caches.match(req).then(function(cached) {
        return cached || caches.match('/');
      });
    })
  );
});
