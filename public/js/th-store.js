/* TechHat Store — local-first persistence for TechHat Studio.
 *
 * IndexedDB `thbc_store` (v1) with three record stores:
 *   files    — exported / saved documents   { id, title, category, mime, size, thumb, blob, createdAt, updatedAt, ... }
 *   projects — in-progress tool work        { id, tool, title, state, blob, thumb, createdAt, updatedAt, ... }
 *   kv       — synced preferences           { id: 'kv:<localStorageKey>', key, value, updatedAt, ... }
 *
 * Every record also carries sync bookkeeping:
 *   deleted   — tombstone (kept so deletes propagate to other devices)
 *   syncedAt  — updatedAt value last confirmed by the cloud (0 = never)
 *   ownerUid  — account the record belongs to ('' = guest / this device only)
 *   blobRemote— the binary lives in the cloud and has not been downloaded yet
 *
 * Works fully offline for guests. The cloud layer (th-cloud.js) only reads
 * and writes through this API. Pure helpers are exported for node tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TechHatStore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DB_NAME = 'thbc_store';
  var DB_VERSION = 1;
  var STORES = ['files', 'projects', 'kv'];
  var LEGACY_DB = 'thbc_doc_vault';

  /* ============================ pure helpers (tested) ============================ */

  function now() { return Date.now(); }

  function newId(prefix) {
    var rnd = '';
    try {
      var a = new Uint8Array(8);
      (self.crypto || crypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) rnd += ('0' + a[i].toString(16)).slice(-2);
    } catch (e) {
      rnd = Math.random().toString(16).slice(2, 18);
    }
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + rnd;
  }

  // Record needs to be pushed to the cloud for `uid`.
  function needsPush(rec, uid) {
    if (!rec || !uid) return false;
    if (rec.ownerUid && rec.ownerUid !== uid) return false;
    if (rec.localOnly) return false;
    return (rec.updatedAt || 0) > (rec.syncedAt || 0);
  }

  // Last-write-wins merge of a remote (cloud) record into the local one.
  // Returns the record to store, or null when the local copy should stay.
  function mergeRemote(local, remote) {
    if (!remote) return null;
    if (local && (local.updatedAt || 0) > (remote.updatedAt || 0)) return null; // local is newer → will be pushed
    if (local && (local.updatedAt || 0) === (remote.updatedAt || 0) && !!local.deleted === !!remote.deleted) {
      // identical version — only refresh sync bookkeeping
      if ((local.syncedAt || 0) >= (remote.updatedAt || 0)) return null;
      var same = shallowCopy(local);
      same.syncedAt = remote.updatedAt || 0;
      same.ownerUid = remote.ownerUid || local.ownerUid || '';
      return same;
    }
    var out = shallowCopy(remote);
    out.syncedAt = remote.updatedAt || 0;
    if (out.deleted) {
      out.blob = null;
      out.blobRemote = false;
      out.state = null;
    } else if (remote.hasBlob) {
      // keep an already-downloaded binary if it belongs to the same version
      if (local && local.blob && (local.blobVersion || local.updatedAt) >= (remote.blobVersion || remote.updatedAt || 0)) {
        out.blob = local.blob;
        out.blobRemote = false;
      } else {
        out.blob = null;
        out.blobRemote = true;
      }
    }
    return out;
  }

  function shallowCopy(o) {
    var r = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k];
    return r;
  }

  // Cloud payload (metadata only — binaries travel separately).
  function toWire(rec, kind) {
    return {
      id: rec.id,
      kind: kind,
      tool: rec.tool || '',
      title: rec.title || '',
      category: rec.category || '',
      mime: rec.mime || '',
      size: rec.size || (rec.blob ? rec.blob.size : 0) || 0,
      thumb: rec.thumb || '',
      state: rec.state == null ? null : rec.state,
      key: rec.key || '',
      value: rec.value == null ? null : rec.value,
      hasBlob: !!(rec.blob || rec.blobRemote || rec.hasBlob),
      blobVersion: rec.blobVersion || 0,
      createdAt: rec.createdAt || rec.updatedAt || 0,
      updatedAt: rec.updatedAt || 0,
      deleted: !!rec.deleted
    };
  }

  var api = {
    STORES: STORES,
    newId: newId,
    needsPush: needsPush,
    mergeRemote: mergeRemote,
    toWire: toWire
  };

  if (typeof indexedDB === 'undefined') return api; // node tests: pure helpers only

  /* ============================ IndexedDB layer ============================ */

  var dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        STORES.forEach(function (name) {
          if (!db.objectStoreNames.contains(name)) {
            var st = db.createObjectStore(name, { keyPath: 'id' });
            st.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
        });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    }).then(function (db) {
      return migrateLegacy(db).then(function () { return db; }, function () { return db; });
    });
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(store, mode);
        var st = t.objectStore(store);
        var result;
        try { result = fn(st); } catch (e) { reject(e); return; }
        t.oncomplete = function () { resolve(result && result.__box ? result.__value : result); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  function reqValue(req) {
    var box = { __box: true, __value: undefined };
    req.onsuccess = function () { box.__value = req.result; };
    return box;
  }

  function getRaw(store, id) {
    return tx(store, 'readonly', function (st) { return reqValue(st.get(id)); });
  }

  function putRaw(store, rec) {
    return tx(store, 'readwrite', function (st) { st.put(rec); return rec; });
  }

  function deleteRaw(store, id) {
    return tx(store, 'readwrite', function (st) { st.delete(id); });
  }

  function allRaw(store) {
    return tx(store, 'readonly', function (st) { return reqValue(st.getAll()); }).then(function (r) { return r || []; });
  }

  /* ---------- change events ---------- */

  var listeners = [];
  function emit(store, rec, origin) {
    var detail = { store: store, id: rec && rec.id, record: rec, origin: origin || 'local' };
    listeners.slice().forEach(function (fn) { try { fn(detail); } catch (e) { /* listener error */ } });
    try { window.dispatchEvent(new CustomEvent('th-store-change', { detail: detail })); } catch (e) { /* no window */ }
  }
  function onChange(fn) {
    listeners.push(fn);
    return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
  }

  function currentOwner() {
    try { return (self.TechHatCloud && self.TechHatCloud.uid && self.TechHatCloud.uid()) || ''; } catch (e) { return ''; }
  }

  /* ---------- public record API ---------- */

  // Local write (user action). Bumps updatedAt so the change syncs.
  function save(store, rec) {
    if (STORES.indexOf(store) < 0) return Promise.reject(new Error('unknown store ' + store));
    var t = now();
    return getRaw(store, rec.id).then(function (prev) {
      var out = shallowCopy(prev || {});
      for (var k in rec) if (Object.prototype.hasOwnProperty.call(rec, k)) out[k] = rec[k];
      if (!out.id) out.id = newId(store.slice(0, 4));
      out.createdAt = out.createdAt || t;
      out.updatedAt = Math.max(t, (prev && prev.updatedAt || 0) + 1);
      if (rec.blob) { out.blobVersion = out.updatedAt; out.blobRemote = false; out.size = rec.blob.size; }
      out.deleted = false;
      if (!out.ownerUid) out.ownerUid = currentOwner();
      return putRaw(store, out).then(function () { emit(store, out, 'local'); return out; });
    });
  }

  // Tombstone delete — binary and state are dropped locally right away.
  function remove(store, id) {
    return getRaw(store, id).then(function (prev) {
      if (!prev) return null;
      var out = shallowCopy(prev);
      out.deleted = true;
      out.blob = null;
      out.blobRemote = false;
      out.state = null;
      out.thumb = '';
      out.updatedAt = Math.max(now(), (prev.updatedAt || 0) + 1);
      // never-synced guest records can simply disappear
      if (!prev.syncedAt && !prev.ownerUid) {
        return deleteRaw(store, id).then(function () { emit(store, out, 'local'); return out; });
      }
      return putRaw(store, out).then(function () { emit(store, out, 'local'); return out; });
    });
  }

  function get(store, id) {
    return getRaw(store, id).then(function (r) { return r && !r.deleted ? r : null; });
  }

  function list(store, filter) {
    return allRaw(store).then(function (rows) {
      return rows.filter(function (r) { return !r.deleted && (!filter || filter(r)); })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    });
  }

  // Sync-layer helpers (no updatedAt bump)
  function listAll(store) { return allRaw(store); }
  function putSynced(store, rec, origin) {
    return putRaw(store, rec).then(function () { emit(store, rec, origin || 'cloud'); return rec; });
  }
  function purge(store, id) { return deleteRaw(store, id); }

  /* ---------- projects (in-progress work) ---------- */

  // One rolling autosave slot per tool+key (e.g. vectorize:<image name>).
  function saveProject(tool, key, data) {
    var id = 'proj_' + tool + '_' + String(key || 'default').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60);
    var rec = { id: id, tool: tool };
    for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) rec[k] = data[k];
    return save('projects', rec);
  }

  function latestProject(tool) {
    return list('projects', function (r) { return r.tool === tool; }).then(function (rows) { return rows[0] || null; });
  }

  /* ---------- kv: synced localStorage preferences ---------- */

  var SYNC_KEYS = ['thbc-theme', 'thbc-lang', 'thbc-settings', 'thbc-draft', 'thbc-fav-tools', 'thbc-recent-tools',
    'thbc-recent-searches', 'thbc-inv-shop', 'thbc-inv-logo'];
  var applyingRemote = false;

  function kvSaveFromLocalStorage(key) {
    if (SYNC_KEYS.indexOf(key) < 0) return Promise.resolve(null);
    var v = null;
    try { v = localStorage.getItem(key); } catch (e) { return Promise.resolve(null); }
    if (v != null && v.length > 900000) return Promise.resolve(null); // too large to sync
    return getRaw('kv', 'kv:' + key).then(function (prev) {
      if (prev && !prev.deleted && prev.value === v) return prev;
      return save('kv', { id: 'kv:' + key, key: key, value: v });
    });
  }

  function applyRemoteKv(rec) {
    if (!rec || !rec.key || SYNC_KEYS.indexOf(rec.key) < 0) return;
    applyingRemote = true;
    try {
      if (rec.deleted || rec.value == null) localStorage.removeItem(rec.key);
      else localStorage.setItem(rec.key, rec.value);
    } catch (e) { /* quota */ }
    applyingRemote = false;
    try { window.dispatchEvent(new CustomEvent('th-kv-remote', { detail: { key: rec.key } })); } catch (e) { /* */ }
  }

  function installKvHook() {
    try {
      var proto = Storage.prototype;
      if (proto.__thHooked) return;
      var origSet = proto.setItem, origRemove = proto.removeItem;
      proto.setItem = function (k, v) {
        var r = origSet.apply(this, arguments);
        if (this === window.localStorage && !applyingRemote && SYNC_KEYS.indexOf(k) >= 0) scheduleKv(k);
        return r;
      };
      proto.removeItem = function (k) {
        var r = origRemove.apply(this, arguments);
        if (this === window.localStorage && !applyingRemote && SYNC_KEYS.indexOf(k) >= 0) scheduleKv(k);
        return r;
      };
      proto.__thHooked = true;
    } catch (e) { /* storage unavailable */ }
  }

  var kvTimers = {};
  function scheduleKv(k) {
    clearTimeout(kvTimers[k]);
    kvTimers[k] = setTimeout(function () { kvSaveFromLocalStorage(k); }, 800);
  }

  function snapshotKv() {
    return Promise.all(SYNC_KEYS.map(kvSaveFromLocalStorage));
  }

  /* ---------- legacy migration (thbc_doc_vault → files) ---------- */

  function migrateLegacy(db) {
    var flag = 'thbc-store-migrated-v1';
    try { if (localStorage.getItem(flag)) return Promise.resolve(); } catch (e) { return Promise.resolve(); }
    return new Promise(function (resolve) {
      var req;
      try { req = indexedDB.open(LEGACY_DB); } catch (e) { resolve(); return; }
      req.onupgradeneeded = function () { /* did not exist */ try { req.transaction.abort(); } catch (e) { /* */ } };
      req.onerror = function () { resolve(); };
      req.onsuccess = function () {
        var old = req.result;
        if (!old.objectStoreNames.contains('docs')) { old.close(); resolve(); return; }
        var getAll = old.transaction('docs', 'readonly').objectStore('docs').getAll();
        getAll.onsuccess = function () {
          var docs = getAll.result || [];
          old.close();
          if (!docs.length) { try { localStorage.setItem(flag, '1'); } catch (e) { /* */ } resolve(); return; }
          var t = db.transaction('files', 'readwrite');
          var st = t.objectStore('files');
          docs.forEach(function (d) {
            if (!d || !d.id) return;
            st.put({
              id: d.id, title: d.title || 'Document', category: d.category || 'scan', mime: d.mime || '',
              size: d.size || (d.blob ? d.blob.size : 0), thumb: d.thumb || '', blob: d.blob || null,
              createdAt: d.createdAt || now(), updatedAt: d.createdAt || now(), blobVersion: d.createdAt || now(),
              deleted: false, syncedAt: 0, ownerUid: ''
            });
          });
          t.oncomplete = function () { try { localStorage.setItem(flag, '1'); } catch (e) { /* */ } resolve(); };
          t.onerror = function () { resolve(); };
        };
        getAll.onerror = function () { old.close(); resolve(); };
      };
    });
  }

  // Ask the browser not to evict our data under storage pressure.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* */ }

  installKvHook();

  api.open = openDB;
  api.save = save;
  api.remove = remove;
  api.get = get;
  api.list = list;
  api.listAll = listAll;
  api.getRaw = getRaw;
  api.putSynced = putSynced;
  api.purge = purge;
  api.onChange = onChange;
  api.saveProject = saveProject;
  api.latestProject = latestProject;
  api.SYNC_KEYS = SYNC_KEYS;
  api.snapshotKv = snapshotKv;
  api.applyRemoteKv = applyRemoteKv;
  return api;
});
