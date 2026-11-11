/* TechHat Bangla Converter — service worker (offline app shell) */
'use strict';

var VERSION = 'thbc-v78';
var SHELL = 'shell-' + VERSION;
var RUNTIME = 'runtime-' + VERSION;
var IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' || /^192\.168\./.test(self.location.hostname);

// Precache ONLY the app shell needed for a first offline paint. Tool engines (public/js/*)
// and vendor libs (pdf.js, pdf-lib, jszip) are cached at runtime the first time a tool uses
// them, so opening one tool no longer downloads every other tool's engine.
// ('index.html' is intentionally omitted: with cleanUrls it redirects to '/', which is './'.)
var PRECACHE = [
  './',
  'js/th-store.js',
  'js/shell.js',
  'js/th-cloud.js',
  'SutonnyMJ-Regular.ttf',
  'manifest.webmanifest',
  'icons/icon-48.png',
  'icons/icon-180.png',
  'icons/icon-192.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL)
      .then(function (cache) {
        // Resilient install: one missing/failed entry must not abort the whole SW install.
        return Promise.allSettled(PRECACHE.map(function (u) {
          var req = new Request(u, { cache: 'reload' });
          return fetch(req).then(function (res) {
            if (!res || !res.ok) throw new Error('precache ' + u + ' -> ' + (res && res.status));
            return cache.put(req, res);
          });
        }));
      })
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

// Immutable-by-URL assets: ?v=NN versioned engines, content-hashed Astro bundles, pinned vendor libs.
function isImmutableAsset(url) {
  return /(?:^|&)v=/.test(url.search.slice(1)) ||
    url.pathname.indexOf('/_astro/') === 0 ||
    url.pathname.indexOf('/vendor/') === 0;
}

function putRuntime(request, res) {
  if (res && res.ok) {
    var copy = res.clone();
    caches.open(RUNTIME).then(function (c) { c.put(request, copy); });
  }
  return res;
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

// cache-first for versioned/immutable assets: cached on first use, served instantly afterwards.
// Offline with a different ?v= than cached, fall back to any cached copy of the same path.
function cacheFirst(request) {
  return caches.match(request).then(function (hit) {
    if (hit) return hit;
    return fetch(request).then(function (res) { return putRuntime(request, res); })
      .catch(function () { return caches.match(request, { ignoreSearch: true }); });
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

  // page navigations: network first (fresh deploys), fall back to cached page or home shell offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(SHELL).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (m) {
          return m || caches.match('./', { ignoreSearch: true });
        });
      })
    );
    return;
  }

  if (!IS_DEV && isImmutableAsset(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // other static assets: network first so updates appear immediately, cache at runtime, fallback offline
  event.respondWith(
    fetch(req).then(function (res) { return putRuntime(req, res); }).catch(function () {
      return caches.match(req, { ignoreSearch: true });
    })
  );
});
