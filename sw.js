/* TechHat Bangla Converter — service worker (offline app shell) */
'use strict';

var VERSION = 'thbc-v6';
var SHELL = 'shell-' + VERSION;
var RUNTIME = 'runtime-' + VERSION;

var ASSETS = [
  './',
  'index.html',
  'css/app.css',
  'SutonnyMJ-Regular.ttf',
  'SutonnyMJ-Italic.ttf',
  'js/bijoy-engine.js',
  'js/office.js',
  'js/formats.js',
  'js/app.js',
  'vendor/jszip.min.js',
  'manifest.webmanifest',
  'icons/icon-48.png',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL)
      .then(function (cache) { return cache.addAll(ASSETS.map(function (u) { return new Request(u, { cache: 'reload' }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== SHELL && k !== RUNTIME; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isFontRequest(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

// stale-while-revalidate: answer from cache instantly, refresh in background
function staleWhileRevalidate(request) {
  return caches.open(RUNTIME).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var network = fetch(request).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (isFontRequest(url)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // page navigations: network first (fresh deploys), fall back to cached shell offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(SHELL).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('index.html', { ignoreSearch: true });
      })
    );
    return;
  }

  // static assets: cache first, then network (and store)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      return cached || fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(RUNTIME).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
