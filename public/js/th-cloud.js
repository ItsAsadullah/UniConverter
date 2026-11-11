/* TechHat Cloud — Firebase sign-in + Cloudflare sync + account UI.
 *
 * - Guests: everything stays on this device (th-store.js / IndexedDB).
 * - Signed in (Google or email/password via Firebase Auth): local changes are
 *   pushed to the Cloudflare Worker (D1 + R2) and changes from the user's
 *   other devices are pulled — automatically.
 *
 * Firebase is loaded lazily from gstatic only when needed (sign-in dialog
 * opened, or a previous session exists), so offline / guest use never pays
 * for it. Public config only — no secrets live in the client.
 */
(function () {
  'use strict';
  if (window.TechHatCloud) return;

  var FIREBASE_VERSION = '13.2.0';
  var FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDvH_v4lsCm8b3VEyzu-lIxiNyUDslvakg',
    authDomain: 'tools-techhat.firebaseapp.com',
    projectId: 'tools-techhat',
    storageBucket: 'tools-techhat.firebasestorage.app',
    messagingSenderId: '333434453212',
    appId: '1:333434453212:web:4e5f55becc1ab309308819'
  };
  // Cloudflare Worker endpoint (set after `wrangler deploy`). Can be overridden
  // for testing with localStorage['thbc-api-base'].
  var DEFAULT_API_BASE = 'https://techhat-tools-sync.angrycreation.workers.dev';

  var SESSION_FLAG = 'thbc-auth-session';
  var USER_CACHE_KEY = 'thbc-auth-user-cache';
  var SYNC_SENSITIVE_KEY = 'thbc-sync-sensitive';
  var Store = window.TechHatStore;

  var state = {
    fb: null,           // { auth, mod }
    user: null,         // { uid, email, displayName, photoURL, emailVerified }
    liveAuth: false,
    status: 'guest',    // guest | idle | syncing | offline | error | disabled
    lastSync: 0,
    lastError: '',
    syncing: false,
    pending: 0
  };

  function isEn() { return document.documentElement.getAttribute('data-lang') === 'en'; }
  function tr(bn, en) { return isEn() ? (en || bn) : bn; }
  function toast(bn, en) {
    if (window.TechHatToast) { window.TechHatToast(tr(bn, en)); return; }
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = tr(bn, en); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2800);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function apiBase() {
    var o = '';
    try { o = (localStorage.getItem('thbc-api-base') || '').trim(); } catch (e) { /* */ }
    return (o || DEFAULT_API_BASE).replace(/\/+$/, '');
  }
  function syncSensitive() {
    try { return localStorage.getItem(SYNC_SENSITIVE_KEY) !== '0'; } catch (e) { return true; }
  }

  /* ============================ Firebase (lazy) ============================ */

  var fbLoading = null;
  function loadFirebase() {
    if (state.fb) return Promise.resolve(state.fb);
    if (fbLoading) return fbLoading;
    var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
    fbLoading = Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js')]).then(function (mods) {
      var app = mods[0].initializeApp(FIREBASE_CONFIG);
      var A = mods[1];
      var auth = A.getAuth(app);
      try { auth.languageCode = isEn() ? 'en' : 'bn'; } catch (e) { /* */ }
      state.fb = { auth: auth, A: A };
      A.onAuthStateChanged(auth, onAuthChanged);
      // complete a redirect sign-in (mobile / app WebView fallback)
      A.getRedirectResult(auth).catch(function (e) { if (e && e.code) showAuthError(e); });
      return state.fb;
    }).catch(function (e) {
      fbLoading = null;
      throw e;
    });
    return fbLoading;
  }

  function onAuthChanged(u) {
    var prevUid = state.liveAuth && state.user ? state.user.uid : '';
    state.liveAuth = true;
    state.user = u ? { uid: u.uid, email: u.email || '', displayName: u.displayName || '', photoURL: u.photoURL || '', emailVerified: !!u.emailVerified, providers: (u.providerData || []).map(function (p) { return p.providerId; }) } : null;
    try {
      if (u) {
        localStorage.setItem(SESSION_FLAG, '1');
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ uid: u.uid, email: u.email || '', displayName: u.displayName || '', photoURL: u.photoURL || '' }));
      } else {
        localStorage.removeItem(SESSION_FLAG);
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch (e) { /* */ }
    if (u && u.uid !== prevUid) {
      state.status = apiBase() ? 'idle' : 'disabled';
      adoptGuestData(u.uid).then(function () { scheduleSync(300); });
    }
    if (!u) state.status = 'guest';
    renderAll();
  }

  function getToken(force) {
    if (!state.fb || !state.fb.auth.currentUser) return Promise.reject(new Error('signed-out'));
    return state.fb.auth.currentUser.getIdToken(!!force);
  }

  /* ============================ sign-in actions ============================ */

  var AUTH_ERRORS = {
    'auth/invalid-email': ['ইমেইল ঠিকানাটি সঠিক নয়', 'Invalid email address'],
    'auth/missing-password': ['পাসওয়ার্ড দিন', 'Enter a password'],
    'auth/weak-password': ['পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'Password must be at least 6 characters'],
    'auth/email-already-in-use': ['এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন করুন', 'An account already exists — sign in instead'],
    'auth/invalid-credential': ['ইমেইল বা পাসওয়ার্ড ভুল', 'Wrong email or password'],
    'auth/wrong-password': ['ইমেইল বা পাসওয়ার্ড ভুল', 'Wrong email or password'],
    'auth/user-not-found': ['এই ইমেইলে কোনো অ্যাকাউন্ট নেই', 'No account with this email'],
    'auth/too-many-requests': ['অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন', 'Too many attempts — try again later'],
    'auth/network-request-failed': ['ইন্টারনেট সংযোগ নেই', 'No internet connection'],
    'auth/popup-closed-by-user': ['সাইন-ইন উইন্ডো বন্ধ করা হয়েছে', 'Sign-in window was closed'],
    'auth/unauthorized-domain': ['এই ডোমেইন Firebase-এ অনুমোদিত নয় (Authorized domains-এ যোগ করুন)', 'This domain is not authorized in Firebase'],
    'auth/configuration-not-found': ['Firebase Console → Authentication → Sign-in method থেকে Google ও Email/Password চালু করুন', 'Enable Google & Email/Password in Firebase Console → Authentication → Sign-in method'],
    'auth/operation-not-allowed': ['এই লগইন পদ্ধতি Firebase-এ চালু করা নেই', 'This sign-in method is not enabled in Firebase'],
    'auth/account-exists-with-different-credential': ['এই ইমেইল অন্য পদ্ধতিতে নিবন্ধিত — সেই পদ্ধতিতে লগইন করুন', 'Email registered with another sign-in method']
  };
  function showAuthError(e) {
    var m = AUTH_ERRORS[e && e.code];
    var msg = m ? tr(m[0], m[1]) : tr('সাইন-ইন ব্যর্থ হয়েছে', 'Sign-in failed') + (e && e.code ? ' (' + e.code + ')' : '');
    var el = document.getElementById('thAuthMsg');
    if (el) { el.textContent = msg; el.className = 'text-[12px] font-semibold text-rose-600 dark:text-rose-400 min-h-[16px]'; }
    else toast(msg, msg);
  }
  function setAuthMsg(bn, en, ok) {
    var el = document.getElementById('thAuthMsg');
    if (el) { el.textContent = tr(bn, en); el.className = 'text-[12px] font-semibold min-h-[16px] ' + (ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'); }
  }
  function busy(on) {
    $$('#thAccountDialog [data-th-auth]').forEach(function (b) { b.disabled = on; });
  }

  function signInGoogle() {
    busy(true); setAuthMsg('Google-এ যাচ্ছে…', 'Opening Google…');
    loadFirebase().then(function (fb) {
      var provider = new fb.A.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      var inApp = /; wv\)|Capacitor/i.test(navigator.userAgent);
      return inApp ? fb.A.signInWithRedirect(fb.auth, provider) : fb.A.signInWithPopup(fb.auth, provider).catch(function (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return fb.A.signInWithRedirect(fb.auth, provider);
        throw e;
      });
    }).then(function () { busy(false); }, function (e) { busy(false); showAuthError(e); });
  }

  function emailAuth(mode) {
    var email = (val('thAuthEmail') || '').trim();
    var pass = val('thAuthPass') || '';
    var name = (val('thAuthName') || '').trim();
    if (!email) { showAuthError({ code: 'auth/invalid-email' }); return; }
    busy(true); setAuthMsg('অপেক্ষা করুন…', 'Please wait…');
    loadFirebase().then(function (fb) {
      if (mode === 'register') {
        return fb.A.createUserWithEmailAndPassword(fb.auth, email, pass).then(function (cred) {
          var jobs = [fb.A.sendEmailVerification(cred.user).catch(function () { /* optional */ })];
          if (name) jobs.push(fb.A.updateProfile(cred.user, { displayName: name }).then(function () { onAuthChanged(fb.auth.currentUser); }));
          return Promise.all(jobs).then(function () { toast('অ্যাকাউন্ট তৈরি হয়েছে — ইমেইল ভেরিফাই লিংক পাঠানো হয়েছে', 'Account created — verification email sent'); });
        });
      }
      return fb.A.signInWithEmailAndPassword(fb.auth, email, pass);
    }).then(function () { busy(false); }, function (e) { busy(false); showAuthError(e); });
  }

  function resetPassword() {
    var email = (val('thAuthEmail') || '').trim();
    if (!email) { setAuthMsg('প্রথমে ইমেইল লিখুন', 'Enter your email first'); return; }
    busy(true);
    loadFirebase().then(function (fb) { return fb.A.sendPasswordResetEmail(fb.auth, email); })
      .then(function () { busy(false); setAuthMsg('পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে', 'Password reset link sent', true); },
        function (e) { busy(false); showAuthError(e); });
  }

  function signOut() {
    var wipe = !!(document.getElementById('thWipeLocal') && document.getElementById('thWipeLocal').checked);
    var uid = state.user && state.user.uid;
    var p = wipe && uid ? wipeAccountLocal(uid) : Promise.resolve();
    p.then(function () { return state.fb ? state.fb.A.signOut(state.fb.auth) : null; }).then(function () {
      try { localStorage.removeItem('thbc-sync-cursor-' + uid); } catch (e) { /* */ }
      toast(wipe ? 'সাইন-আউট হয়েছে, এই ডিভাইস থেকে অ্যাকাউন্টের কপি মুছে ফেলা হয়েছে' : 'সাইন-আউট হয়েছে', wipe ? 'Signed out and removed account copies from this device' : 'Signed out');
      if (window.TechHatVault && window.TechHatVault.render) window.TechHatVault.render();
      renderAll();
    });
  }

  /* ============================ sync engine ============================ */

  var KIND_OF = { files: 'file', projects: 'project', kv: 'kv' };
  var STORE_OF = { file: 'files', project: 'projects', kv: 'kv' };

  function cursorKey() { return 'thbc-sync-cursor-' + (state.user ? state.user.uid : ''); }
  function getCursor() { try { return Number(localStorage.getItem(cursorKey())) || 0; } catch (e) { return 0; } }
  function setCursor(v) { try { localStorage.setItem(cursorKey(), String(v)); } catch (e) { /* */ } }

  function api(method, path, body, headers) {
    var base = apiBase();
    if (!base) return Promise.reject(new Error('sync-not-configured'));
    var attempt = function (force) {
      return getToken(force).then(function (tok) {
        var h = Object.assign({ Authorization: 'Bearer ' + tok }, headers || {});
        var opts = { method: method, headers: h };
        if (body !== undefined) {
          if (body instanceof Blob) opts.body = body;
          else { h['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
        }
        return fetch(base + path, opts);
      });
    };
    return attempt(false).then(function (res) { return res.status === 401 ? attempt(true) : res; });
  }

  // First sign-in on a device: offer to add this device's guest data to the account.
  function adoptGuestData(uid) {
    var flag = 'thbc-adopted-' + uid;
    try { if (localStorage.getItem(flag)) return Promise.resolve(); } catch (e) { return Promise.resolve(); }
    return Promise.all(Store.STORES.map(function (s) { return Store.listAll(s); })).then(function (lists) {
      var guest = [];
      lists.forEach(function (rows, i) {
        rows.forEach(function (r) { if (!r.ownerUid && !r.deleted) guest.push([Store.STORES[i], r]); });
      });
      var docs = guest.filter(function (g) { return g[0] !== 'kv'; }).length;
      var ask = docs > 0 ? askConfirm({
        tone: 'emerald',
        titleBn: 'আগের কাজগুলো ক্লাউডে সিঙ্ক করবেন?',
        titleEn: 'Sync existing work to your account?',
        descBn: 'এই ডিভাইসে আগে থেকে ' + docs + 'টি ডকুমেন্ট/প্রজেক্ট সেভ আছে। এগুলো আপনার অ্যাকাউন্টে যোগ করলে সব ডিভাইসে পাওয়া যাবে।',
        descEn: 'This device has ' + docs + ' saved documents/projects. Add them to your account and sync them to all your devices?',
        okBn: 'হ্যাঁ, সিঙ্ক করুন',
        okEn: 'Yes, sync to account',
        cancelBn: 'শুধু এই ডিভাইসে রাখুন',
        cancelEn: 'Keep local only'
      }) : Promise.resolve(true);
      return ask.then(function (yes) {
        return Promise.all(guest.map(function (g) {
          var r = g[1];
          r.ownerUid = yes ? uid : '';
          if (!yes) r.localOnly = true;
          return Store.putSynced(g[0], r, 'adopt');
        })).then(function () { try { localStorage.setItem(flag, '1'); } catch (e) { /* */ } });
      });
    });
  }

  function wipeAccountLocal(uid) {
    return Promise.all(Store.STORES.map(function (s) {
      return Store.listAll(s).then(function (rows) {
        return Promise.all(rows.filter(function (r) { return r.ownerUid === uid; }).map(function (r) { return Store.purge(s, r.id); }));
      });
    }));
  }

  function shouldSkip(store, rec) {
    return store === 'files' && rec.category === 'nid' && !syncSensitive();
  }

  function pushAll() {
    var uid = state.user.uid;
    var jobs = [];
    return Promise.all(Store.STORES.map(function (s) { return Store.listAll(s); })).then(function (lists) {
      lists.forEach(function (rows, i) {
        var store = Store.STORES[i];
        rows.forEach(function (r) { if (Store.needsPush(r, uid) && !shouldSkip(store, r)) jobs.push([store, r]); });
      });
      state.pending = jobs.length;
      renderStatus();
      // sequential: keeps mobile connections responsive and order deterministic
      var chain = Promise.resolve();
      jobs.forEach(function (j) {
        chain = chain.then(function () { return pushOne(j[0], j[1]); }).then(function () { state.pending = Math.max(0, state.pending - 1); renderStatus(); });
      });
      return chain;
    });
  }

  function pushOne(store, rec) {
    var uid = state.user.uid;
    var kind = KIND_OF[store];
    var blobStep = Promise.resolve();
    if (!rec.deleted && rec.blob && (rec.blobUploaded || 0) < (rec.blobVersion || rec.updatedAt)) {
      blobStep = api('PUT', '/v1/blobs/' + encodeURIComponent(rec.id), rec.blob, {
        'Content-Type': rec.mime || rec.blob.type || 'application/octet-stream',
        'X-Blob-Version': String(rec.blobVersion || rec.updatedAt)
      }).then(function (res) {
        if (!res.ok) throw new Error('blob-' + res.status);
        rec.blobUploaded = rec.blobVersion || rec.updatedAt;
      });
    }
    return blobStep.then(function () {
      return api('PUT', '/v1/items/' + encodeURIComponent(rec.id), Store.toWire(rec, kind));
    }).then(function (res) {
      if (res.status === 409) return; // server has a newer version — the pull will bring it
      if (!res.ok) throw new Error('item-' + res.status);
      return Store.getRaw(store, rec.id).then(function (cur) {
        if (!cur) return;
        if ((cur.updatedAt || 0) === (rec.updatedAt || 0)) {
          cur.syncedAt = rec.updatedAt;
          cur.ownerUid = uid;
          if (rec.blobUploaded) cur.blobUploaded = rec.blobUploaded;
          // tombstones that reached the cloud can be dropped locally
          if (cur.deleted) return Store.purge(store, cur.id);
          return Store.putSynced(store, cur, 'sync');
        }
      });
    });
  }

  function pullAll() {
    var uid = state.user.uid;
    var loop = function () {
      return api('GET', '/v1/changes?since=' + getCursor()).then(function (res) {
        if (!res.ok) throw new Error('changes-' + res.status);
        return res.json();
      }).then(function (data) {
        var items = (data && data.items) || [];
        var chain = Promise.resolve();
        items.forEach(function (it) {
          chain = chain.then(function () { return applyRemote(it, uid); });
        });
        return chain.then(function () {
          if (data.cursor) setCursor(data.cursor);
          if (data.more) return loop();
        });
      });
    };
    return loop();
  }

  function applyRemote(it, uid) {
    var store = STORE_OF[it.kind];
    if (!store) return Promise.resolve();
    return Store.getRaw(store, it.id).then(function (local) {
      var remote = {
        id: it.id, tool: it.tool, title: it.title, category: it.category, mime: it.mime, size: it.size,
        thumb: it.thumb, state: it.state, key: it.key, value: it.value, hasBlob: it.hasBlob,
        blobVersion: it.blobVersion, blobUploaded: it.blobVersion, createdAt: it.createdAt, updatedAt: it.updatedAt,
        deleted: it.deleted, ownerUid: uid
      };
      var merged = Store.mergeRemote(local, remote);
      if (!merged) return;
      if (merged.deleted) {
        return Store.purge(store, it.id).then(function () { if (store === 'kv') Store.applyRemoteKv(merged); notifyRemote(store, merged); });
      }
      return Store.putSynced(store, merged, 'cloud').then(function () {
        if (store === 'kv') Store.applyRemoteKv(merged);
        notifyRemote(store, merged);
      });
    });
  }

  var remoteTimer = 0;
  function notifyRemote() {
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(function () {
      if (window.TechHatVault && window.TechHatVault.render) window.TechHatVault.render();
      if (document.getElementById('thWorkDialog') && document.getElementById('thWorkDialog').open) renderWork();
    }, 250);
  }

  function syncNow(manual) {
    if (!state.user) {
      if (manual) openAccount();
      return Promise.resolve(false);
    }
    if (!apiBase()) {
      state.status = 'disabled';
      renderStatus();
      if (manual) toast('ক্লাউড সার্ভার এখনো চালু করা হয়নি — ডকুমেন্ট এই ডিভাইসে সেভ আছে', 'Cloud server not configured yet — documents are saved on this device');
      return Promise.resolve(false);
    }
    if (!navigator.onLine) { state.status = 'offline'; renderStatus(); return Promise.resolve(false); }
    if (state.syncing) { syncAgain = true; return Promise.resolve(false); }
    state.syncing = true;
    state.status = 'syncing';
    renderStatus();
    return Store.snapshotKv().then(pushAll).then(pullAll).then(function () {
      state.status = 'idle';
      state.lastSync = Date.now();
      state.lastError = '';
      return true;
    }).catch(function (e) {
      state.status = navigator.onLine ? 'error' : 'offline';
      state.lastError = (e && e.message) || 'error';
      if (manual) toast('সিঙ্ক ব্যর্থ হয়েছে — পরে আবার চেষ্টা হবে', 'Sync failed — will retry');
      return false;
    }).then(function (ok) {
      state.syncing = false;
      renderStatus();
      if (syncAgain) { syncAgain = false; scheduleSync(500); }
      return ok;
    });
  }
  var syncAgain = false;

  var syncTimer = 0;
  function scheduleSync(delay) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { syncNow(false); }, delay == null ? 1500 : delay);
  }

  // Lazily fetch a cloud binary for a record (used by the vault / My Work).
  function ensureBlob(store, rec) {
    if (!rec || rec.blob || !rec.blobRemote) return Promise.resolve(rec);
    if (!state.user) return Promise.reject(new Error('signed-out'));
    return api('GET', '/v1/blobs/' + encodeURIComponent(rec.id)).then(function (res) {
      if (!res.ok) throw new Error('blob-' + res.status);
      return res.blob();
    }).then(function (blob) {
      return Store.getRaw(store, rec.id).then(function (cur) {
        cur = cur || rec;
        cur.blob = blob;
        cur.blobRemote = false;
        cur.size = blob.size;
        return Store.putSynced(store, cur, 'download');
      });
    });
  }

  /* ============================ UI ============================ */

  function $(sel, r) { return (r || document).querySelector(sel); }
  function $$(sel, r) { return Array.prototype.slice.call((r || document).querySelectorAll(sel)); }
  function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }

  function initials(u) {
    var s = (u.displayName || u.email || '?').trim();
    return s.charAt(0).toUpperCase();
  }

  function avatarHtml(u, size) {
    var cls = 'inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-extrabold text-white bg-gradient-to-br from-emerald-500 to-teal-600 ' + (size || 'w-8 h-8 text-[13px]');
    if (u && u.photoURL) return '<span class="' + cls + '"><img src="' + esc(u.photoURL) + '" alt="" referrerpolicy="no-referrer" class="w-full h-full object-cover"></span>';
    return '<span class="' + cls + '">' + esc(u ? initials(u) : '?') + '</span>';
  }

  var STATUS_TEXT = {
    guest: ['এই ডিভাইসে সেভ', 'Saved on this device', 'bg-slate-400'],
    idle: ['সিঙ্কড', 'Synced', 'bg-emerald-500'],
    syncing: ['সিঙ্ক হচ্ছে…', 'Syncing…', 'bg-sky-500 animate-pulse'],
    offline: ['অফলাইন — পরে সিঙ্ক হবে', 'Offline — will sync later', 'bg-amber-500'],
    error: ['সিঙ্ক ব্যর্থ — আবার চেষ্টা হবে', 'Sync failed — retrying', 'bg-rose-500'],
    disabled: ['লগইন হয়েছে · ক্লাউড সার্ভার শীঘ্রই', 'Signed in · cloud server pending', 'bg-amber-500']
  };

  function ensureHeaderButtons() {
    // Remove legacy My Work button from desktop header if present
    var oldWorkBtn = document.getElementById('thWorkBtn');
    if (oldWorkBtn && oldWorkBtn.parentNode) oldWorkBtn.parentNode.removeChild(oldWorkBtn);

    // Desktop header — compact avatar-only button before the language switcher
    var lang = document.getElementById('globalLangSwitch');
    var existingAcc = document.getElementById('thAccountBtn');
    if (existingAcc) {
      existingAcc.className = 'inline-flex items-center justify-center w-9.5 h-9.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-700 dark:text-studio-text text-xs font-bold cursor-pointer hover:border-emerald-400 transition-colors shrink-0';
    } else if (lang) {
      var b = document.createElement('button');
      b.type = 'button';
      b.id = 'thAccountBtn';
      b.setAttribute('data-th-account-open', '');
      b.setAttribute('aria-label', 'Account Dashboard');
      b.className = 'inline-flex items-center justify-center w-9.5 h-9.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-700 dark:text-studio-text text-xs font-bold cursor-pointer hover:border-emerald-400 transition-colors shrink-0';
      lang.parentNode.insertBefore(b, lang);
    }
    // Mobile app bar — before the settings button
    var mobBar = document.querySelector('#mobAppBar [data-mob-sheet-open="mobMeSheet"]');
    if (mobBar && !document.getElementById('thMobAccountBtn')) {
      var m = document.createElement('button');
      m.type = 'button';
      m.id = 'thMobAccountBtn';
      m.setAttribute('data-th-account-open', '');
      m.setAttribute('aria-label', 'Account');
      m.className = 'inline-flex items-center justify-center w-10 h-10 rounded-full bg-transparent border-0 cursor-pointer shrink-0 active:bg-slate-200/70 dark:active:bg-white/10';
      mobBar.parentNode.insertBefore(m, mobBar);
    }
    // Mobile settings sheet: repurpose the old Cloudflare row
    var oldRow = document.querySelector('#mobMeSheet [data-mob-sheet-open="mobCloudSheet"]');
    if (oldRow) {
      oldRow.removeAttribute('data-mob-sheet-open');
      oldRow.setAttribute('data-th-account-open', '');
      var lbl = oldRow.querySelector('[data-i18n-bn]');
      if (lbl) { lbl.setAttribute('data-i18n-bn', 'ইউজার ড্যাশবোর্ড ও ক্লাউড সিঙ্ক'); lbl.setAttribute('data-i18n-en', 'User Dashboard & Cloud Sync'); lbl.textContent = tr('ইউজার ড্যাশবোর্ড ও ক্লাউড সিঙ্ক', 'User Dashboard & Cloud Sync'); }
    }
  }

  function renderHeader() {
    var u = state.user;
    var st = STATUS_TEXT[state.status] || STATUS_TEXT.guest;
    var b = document.getElementById('thAccountBtn');
    if (b) {
      b.innerHTML = u
        ? '<span class="relative inline-flex">' + avatarHtml(u, 'w-7.5 h-7.5 text-[12px]') + '<span class="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-studio-panel ' + st[2] + '" title="' + esc(tr(st[0], st[1])) + '"></span></span>'
        : '<span class="inline-flex items-center justify-center w-7.5 h-7.5 rounded-full bg-emerald-500/12 text-emerald-600"><svg class="w-4 h-4" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>';
      b.title = u ? ((u.displayName || u.email) + ' · ' + tr(st[0], st[1])) : tr('সাইন ইন করে সব ডিভাইসে সিঙ্ক করুন', 'Sign in to sync across devices');
    }
    var m = document.getElementById('thMobAccountBtn');
    if (m) {
      m.innerHTML = u
        ? '<span class="relative">' + avatarHtml(u, 'w-7.5 h-7.5 text-[12px]') + '<span class="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-studio-sidebar ' + st[2] + '"></span></span>'
        : '<svg class="w-5.5 h-5.5 text-slate-700 dark:text-studio-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
    }
  }

  function dialogShell(id, label) {
    var d = document.getElementById(id);
    if (d) return d;
    d = document.createElement('dialog');
    d.id = id;
    d.setAttribute('aria-label', label);
    d.className = 'th-cloud-dialog m-auto max-lg:mb-0 max-lg:mt-auto w-[min(440px,100vw)] max-lg:w-full max-lg:max-w-none p-0 border-0 rounded-3xl max-lg:rounded-b-none bg-white dark:bg-studio-sidebar text-slate-900 dark:text-studio-text shadow-2xl backdrop:bg-slate-950/55 backdrop:backdrop-blur-xs';
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    document.body.appendChild(d);
    return d;
  }

  function askConfirm(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var d = dialogShell('thConfirmDialog', 'Confirm');
      var isRose = opts.tone === 'rose';
      var iconWrap = isRose
        ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
        : 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400';
      var iconSvg = isRose
        ? '<svg class="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
        : '<svg class="w-6 h-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 13 2 2 4-4"/></svg>';
      var okClass = isRose
        ? 'bg-rose-600 hover:bg-rose-700 text-white'
        : 'bg-emerald-600 hover:bg-emerald-700 text-white';

      d.innerHTML =
        '<div class="p-5 sm:p-6 space-y-4">' +
          '<div class="flex items-start gap-3.5">' +
            '<span class="w-11 h-11 rounded-2xl ' + iconWrap + ' inline-flex items-center justify-center shrink-0">' + iconSvg + '</span>' +
            '<div class="min-w-0 flex-1">' +
              '<h3 class="m-0 text-[16px] font-extrabold text-slate-900 dark:text-studio-text leading-snug">' + esc(tr(opts.titleBn || 'নিশ্চিত করুন', opts.titleEn || 'Confirm')) + '</h3>' +
              '<p class="m-0 mt-1.5 text-[13px] text-slate-600 dark:text-studio-muted leading-relaxed">' + esc(tr(opts.descBn || '', opts.descEn || '')) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center justify-end gap-2.5 pt-1">' +
            '<button type="button" data-th-confirm-ans="0" class="h-10 px-4 rounded-xl border border-slate-200 dark:border-studio-border bg-slate-100 dark:bg-studio-panel text-slate-700 dark:text-studio-text text-[13px] font-bold cursor-pointer hover:bg-slate-200/70 dark:hover:bg-studio-surface transition-colors">' + esc(tr(opts.cancelBn || 'বাতিল', opts.cancelEn || 'Cancel')) + '</button>' +
            '<button type="button" data-th-confirm-ans="1" class="h-10 px-4 rounded-xl border-0 ' + okClass + ' text-[13px] font-bold cursor-pointer shadow-xs transition-colors">' + esc(tr(opts.okBn || 'ঠিক আছে', opts.okEn || 'Confirm')) + '</button>' +
          '</div>' +
        '</div>';

      var settled = false;
      function finish(val) {
        if (settled) return;
        settled = true;
        d.removeEventListener('close', onClose);
        d.removeEventListener('click', onClick);
        if (d.open) d.close();
        resolve(!!val);
      }
      function onClose() { finish(false); }
      function onClick(e) {
        var btn = e.target && e.target.closest ? e.target.closest('[data-th-confirm-ans]') : null;
        if (btn) {
          e.preventDefault();
          finish(btn.getAttribute('data-th-confirm-ans') === '1');
        }
      }
      d.addEventListener('close', onClose);
      d.addEventListener('click', onClick);
      if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
      var okBtn = d.querySelector('[data-th-confirm-ans="1"]');
      if (okBtn && okBtn.focus) setTimeout(function () { okBtn.focus(); }, 15);
    });
  }
  window.TechHatConfirm = askConfirm;

  var authMode = 'login';
  var dashTab = 'overview'; // 'overview' | 'documents' | 'security' | 'settings'
  var dashDocFilter = 'all'; // 'all' | 'projects' | 'scan' | 'nid' | 'pdf' | 'vector'
  var dashDocSearch = '';
  var dashRenameItem = null; // { store, id, title }
  var activeSharePayload = null; // { file, blob, url, title, mime, size }

  function openAccount(initialTab) {
    if (initialTab && typeof initialTab === 'string') dashTab = initialTab;
    var existingAd = document.getElementById('thAccountDialog');
    if (existingAd && existingAd.open) existingAd.close();
    var existingWd = document.getElementById('thWorkDialog');
    if (existingWd && existingWd.open) existingWd.close();

    var pageMount = document.getElementById('thFullDashboardPage');
    if (pageMount) {
      renderAccount();
      loadFirebase().catch(function () {
        if (!state.user) setAuthMsg('Firebase লোড করা যায়নি — ইন্টারনেট সংযোগ দেখুন', 'Could not load Firebase — check your connection');
      });
      return;
    }
    if (window.TechHatNavigate) {
      window.TechHatNavigate('/dashboard');
    } else {
      location.href = '/dashboard';
    }
  }

  function renderAccount() {
    var d = document.getElementById('thFullDashboardPage');
    if (!d) return;
    loadFirebase().catch(function () {});
    var u = state.user;

    Promise.all([Store.list('files'), Store.list('projects')]).then(function (res) {
      var mount = document.getElementById('thFullDashboardPage');
      if (!mount) return;
      var files = res[0] || [], projects = res[1] || [];
      var totalDocs = files.length;
      var totalProjs = projects.length;
      var totalItems = totalDocs + totalProjs;

      if (!state.user) {
        var reg = authMode === 'register';
        var inp = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-[14px] text-slate-900 dark:text-studio-text outline-none focus:border-emerald-500';
        var guestRows = [];
        projects.forEach(function (p) { guestRows.push(['projects', p]); });
        files.forEach(function (f) { guestRows.push(['files', f]); });
        guestRows.sort(function (a, b) { return (b[1].updatedAt || 0) - (a[1].updatedAt || 0); });

        mount.innerHTML =
          '<div class="space-y-5">' +
            '<div class="flex flex-wrap items-center justify-between gap-3">' +
              '<div>' +
                '<h1 class="m-0 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">' + tr('ইউজার ড্যাশবোর্ড ও ক্লাউড সিঙ্ক', 'User Dashboard & Cloud Sync') + '</h1>' +
                '<p class="m-0 mt-1 text-[13px] text-slate-500 dark:text-studio-muted">' + tr('আপনার অ্যাকাউন্টে সাইন ইন করুন অথবা এই ডিভাইসে সেভ করা ডকুমেন্ট পরিচালনা করুন', 'Sign in to sync across devices or manage documents saved on this device') + '</p>' +
              '</div>' +
              '<a href="/" class="inline-flex items-center gap-1.5 h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-700 dark:text-studio-text text-[12.5px] font-bold no-underline hover:border-emerald-500 transition-colors">← ' + tr('হোমপেজে ফিরে যান', 'Back to Home') + '</a>' +
            '</div>' +
            '<div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">' +
              '<!-- Sign In / Register Card -->' +
              '<div class="lg:col-span-5 rounded-3xl border border-slate-200/80 dark:border-studio-border bg-white dark:bg-studio-sidebar shadow-xs p-5 sm:p-6 space-y-4">' +
                '<div>' +
                  '<b class="block text-[17px] font-extrabold text-slate-900 dark:text-white">' + tr('সাইন ইন / অ্যাকাউন্ট খুলুন', 'Sign in / Create account') + '</b>' +
                  '<p class="m-0 mt-1 text-[12.5px] text-slate-500 dark:text-studio-muted">' + tr('লগইন ছাড়াও সব কাজ এই ডিভাইসে সেভ থাকে। সাইন ইন করলে ফোন ও কম্পিউটার — সব জায়গায় একই কাজ পাবেন।', 'Your work is always saved on this device. Sign in to get it on every phone and computer.') + '</p>' +
                '</div>' +
                '<button type="button" data-th-auth="google" class="w-full h-11 rounded-xl border border-slate-300 dark:border-studio-border bg-white dark:bg-studio-panel text-[14px] font-bold cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-studio-surface disabled:opacity-50">' +
                  '<svg class="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>' +
                  tr('Google দিয়ে চালিয়ে যান', 'Continue with Google') +
                '</button>' +
                '<div class="flex items-center gap-2 text-[11px] text-slate-400"><span class="flex-1 h-px bg-slate-200 dark:bg-studio-border"></span>' + tr('অথবা ইমেইল', 'or email') + '<span class="flex-1 h-px bg-slate-200 dark:bg-studio-border"></span></div>' +
                '<div class="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-studio-panel">' +
                  '<button type="button" data-th-mode="login" class="h-8.5 rounded-lg border-0 text-[12.5px] font-bold cursor-pointer ' + (!reg ? 'bg-white dark:bg-studio-surface shadow-2xs' : 'bg-transparent text-slate-500') + '">' + tr('লগইন', 'Sign in') + '</button>' +
                  '<button type="button" data-th-mode="register" class="h-8.5 rounded-lg border-0 text-[12.5px] font-bold cursor-pointer ' + (reg ? 'bg-white dark:bg-studio-surface shadow-2xs' : 'bg-transparent text-slate-500') + '">' + tr('নতুন অ্যাকাউন্ট', 'Create account') + '</button>' +
                '</div>' +
                '<form id="thAuthForm" class="space-y-2.5" novalidate>' +
                  (reg ? '<input id="thAuthName" type="text" autocomplete="name" placeholder="' + tr('আপনার নাম', 'Your name') + '" class="' + inp + '">' : '') +
                  '<input id="thAuthEmail" type="email" autocomplete="email" inputmode="email" placeholder="' + tr('ইমেইল', 'Email') + '" class="' + inp + '">' +
                  '<input id="thAuthPass" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" placeholder="' + tr('পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)', 'Password (min 6 characters)') + '" class="' + inp + '">' +
                  '<div id="thAuthMsg" class="text-[12px] font-semibold min-h-[16px]"></div>' +
                  '<button type="submit" data-th-auth="email" class="w-full h-11 rounded-xl border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold cursor-pointer disabled:opacity-50">' + (reg ? tr('অ্যাকাউন্ট খুলুন', 'Create account') : tr('লগইন করুন', 'Sign in')) + '</button>' +
                  (!reg ? '<button type="button" data-th-auth="reset" class="w-full h-8 border-0 bg-transparent text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">' + tr('পাসওয়ার্ড ভুলে গেছেন?', 'Forgot password?') + '</button>' : '') +
                '</form>' +
              '</div>' +
              '<!-- Local Documents Manager -->' +
              '<div class="lg:col-span-7 rounded-3xl border border-slate-200/80 dark:border-studio-border bg-white dark:bg-studio-sidebar shadow-xs p-5 sm:p-6 space-y-4">' +
                '<div class="flex flex-wrap items-center justify-between gap-2">' +
                  '<div>' +
                    '<h2 class="m-0 text-[16px] font-extrabold text-slate-900 dark:text-white">' + tr('এই ডিভাইসে সেভ করা ডকুমেন্ট ও প্রজেক্ট (' + totalItems + ')', 'Documents & Projects on This Device (' + totalItems + ')') + '</h2>' +
                    '<p class="m-0 text-[12px] text-slate-500 dark:text-studio-muted">' + tr('সাইন ইন করলে এই ফাইলগুলো স্বয়ংক্রিয়ভাবে আপনার ক্লাউড অ্যাকাউন্টে ব্যাকআপ হয়ে যাবে', 'Sign in to automatically back up these files to your cloud account') + '</p>' +
                  '</div>' +
                  '<button type="button" data-th-dash-upload class="h-9 px-3.5 rounded-xl border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold cursor-pointer">+ ' + tr('ফাইল আপলোড', 'Upload File') + '</button>' +
                '</div>' +
                '<div class="space-y-2 max-h-[62dvh] overflow-y-auto">' +
                  (guestRows.length
                    ? guestRows.map(function (r) { return renderDashItemRow(r[0], r[1]); }).join('')
                    : '<div class="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-studio-border text-center text-[13px] text-slate-500 dark:text-studio-muted">' +
                        tr('এখনো কোনো ডকুমেন্ট সেভ হয়নি। যেকোনো টুলে কাজ করলে এখানে জমা হবে।', 'No documents saved yet. Work in any tool to see your files here.') +
                      '</div>') +
                '</div>' +
              '</div>' +
            '</div>' +
            '<input id="thDashHiddenFileInput" type="file" multiple class="hidden" accept="image/*,application/pdf,.svg,.txt,.doc,.docx">' +
          '</div>';
        return;
      }

      u = state.user;
      var syncedCount = 0;
      var totalBytes = 0;
      files.forEach(function (f) {
        totalBytes += (f.size || 0);
        if (f.blobRemote || (f.syncedAt && f.syncedAt >= (f.updatedAt || 0))) syncedCount++;
      });
      projects.forEach(function (p) {
        if (p.syncedAt && p.syncedAt >= (p.updatedAt || 0)) syncedCount++;
      });

      var st = STATUS_TEXT[state.status] || STATUS_TEXT.idle;
      var navBtn = function (id, icon, bn, en, badge) {
        var active = dashTab === id;
        return '<button type="button" data-th-dash-tab="' + id + '" class="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-0 text-left text-[13.5px] font-bold cursor-pointer transition-colors ' +
          (active
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'bg-transparent text-slate-600 dark:text-studio-muted hover:bg-slate-100 dark:hover:bg-studio-panel hover:text-slate-900 dark:hover:text-white') + '">' +
          '<span class="w-4.5 h-4.5 inline-flex items-center justify-center shrink-0">' + icon + '</span>' +
          '<span class="truncate flex-1">' + tr(bn, en) + '</span>' +
          (badge !== undefined ? '<span class="px-2 py-0.5 rounded-full text-[11px] font-extrabold ' + (active ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-studio-border text-slate-700 dark:text-studio-text') + '">' + badge + '</span>' : '') +
        '</button>';
      };

      var mainContent = '';
      if (dashTab === 'overview') {
        var recentCombined = [];
        projects.forEach(function (p) { recentCombined.push(['projects', p]); });
        files.forEach(function (f) { recentCombined.push(['files', f]); });
        recentCombined.sort(function (a, b) { return (b[1].updatedAt || 0) - (a[1].updatedAt || 0); });
        var topRecent = recentCombined.slice(0, 6);

        var recentRowsHtml = topRecent.length ? topRecent.map(function (r) {
          return renderDashItemRow(r[0], r[1]);
        }).join('') : '<div class="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-studio-border text-center text-[13px] text-slate-500 dark:text-studio-muted">' +
          tr('এখনো কোনো ডকুমেন্ট বা প্রজেক্ট জমা হয়নি। যেকোনো টুলে কাজ করলে বা ডকুমেন্ট যোগ করলে এখানে দেখা যাবে।', 'No documents or projects yet. Work in any tool or upload files to see them here.') +
        '</div>';

        mainContent =
          '<div class="space-y-5">' +
            '<!-- Profile & Cloud Sync Banner -->' +
            '<div class="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">' +
              '<div class="flex items-center gap-4 min-w-0">' +
                avatarHtml(u, 'w-14 h-14 text-[20px]') +
                '<div class="min-w-0">' +
                  '<div class="flex items-center gap-2.5 flex-wrap">' +
                    '<h2 class="m-0 text-[18px] font-extrabold text-slate-900 dark:text-white truncate">' + esc(u.displayName || u.email.split('@')[0]) + '</h2>' +
                    '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-white/90 dark:bg-studio-panel border border-slate-200/80 dark:border-studio-border">' +
                      '<span id="thSyncDot" class="w-2 h-2 rounded-full ' + st[2] + '"></span>' +
                      '<span id="thSyncText">' + esc(statusLine()) + '</span>' +
                    '</span>' +
                  '</div>' +
                  '<p class="m-0 mt-1 text-[13px] text-slate-500 dark:text-studio-muted truncate">' + esc(u.email) + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="flex items-center gap-2.5 shrink-0">' +
                '<button type="button" data-th-sync-now class="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold border-0 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors">' +
                  '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>' +
                  tr('এখনই সিঙ্ক করুন', 'Sync Now') +
                '</button>' +
                '<button type="button" data-th-dash-tab="security" class="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-slate-700 dark:text-studio-text text-[12.5px] font-bold cursor-pointer hover:border-emerald-400 transition-colors">' +
                  tr('প্রোফাইল এডিট', 'Edit Profile') +
                '</button>' +
              '</div>' +
            '</div>' +

            '<!-- Stats Grid -->' +
            '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">' +
              '<div class="p-4 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel">' +
                '<span class="block text-[11.5px] font-bold text-slate-500 dark:text-studio-muted">' + tr('মোট ফাইল ও ডকুমেন্ট', 'Saved Documents') + '</span>' +
                '<b class="mt-1.5 block text-[22px] font-extrabold text-slate-900 dark:text-white">' + totalDocs + '</b>' +
              '</div>' +
              '<div class="p-4 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel">' +
                '<span class="block text-[11.5px] font-bold text-slate-500 dark:text-studio-muted">' + tr('চলমান প্রজেক্ট', 'Active Projects') + '</span>' +
                '<b class="mt-1.5 block text-[22px] font-extrabold text-emerald-600 dark:text-emerald-400">' + totalProjs + '</b>' +
              '</div>' +
              '<div class="p-4 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel">' +
                '<span class="block text-[11.5px] font-bold text-slate-500 dark:text-studio-muted">' + tr('ক্লাউডে ব্যাকআপকৃত', 'Cloud Synced') + '</span>' +
                '<b class="mt-1.5 block text-[22px] font-extrabold text-sky-600 dark:text-sky-400">' + syncedCount + ' / ' + totalItems + '</b>' +
              '</div>' +
              '<div class="p-4 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel">' +
                '<span class="block text-[11.5px] font-bold text-slate-500 dark:text-studio-muted">' + tr('স্টোরেজ ব্যবহার', 'Storage Used') + '</span>' +
                '<b class="mt-1.5 block text-[22px] font-extrabold text-slate-900 dark:text-white">' + (fmtBytes(totalBytes) || '0 KB') + '</b>' +
              '</div>' +
            '</div>' +

            '<!-- Recent Managed Documents Preview -->' +
            '<div class="space-y-3">' +
              '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<h3 class="m-0 text-[15px] font-extrabold text-slate-900 dark:text-white">' + tr('সাম্প্রতিক ডকুমেন্ট ও প্রজেক্ট', 'Recent Documents & Projects') + '</h3>' +
                '<div class="flex items-center gap-2">' +
                  '<button type="button" data-th-dash-upload class="h-9 px-3.5 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-0 text-[12.5px] font-bold cursor-pointer hover:bg-emerald-500/20 transition-colors">+ ' + tr('নতুন ফাইল আপলোড', 'Upload File') + '</button>' +
                  '<button type="button" data-th-dash-tab="documents" class="h-9 px-3.5 rounded-xl bg-slate-100 dark:bg-studio-panel text-slate-700 dark:text-studio-text border-0 text-[12.5px] font-bold cursor-pointer hover:bg-slate-200/70">' + tr('সব দেখুন (' + totalItems + ')', 'View All (' + totalItems + ')') + ' →</button>' +
                '</div>' +
              '</div>' +
              '<div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">' + recentRowsHtml + '</div>' +
            '</div>' +
          '</div>';
      } else if (dashTab === 'documents') {
        var filteredRows = [];
        var q = (dashDocSearch || '').trim().toLowerCase();
        projects.forEach(function (p) {
          if (dashDocFilter !== 'all' && dashDocFilter !== 'projects') return;
          var title = (p.title || '').toLowerCase();
          if (q && title.indexOf(q) < 0) return;
          filteredRows.push(['projects', p]);
        });
        files.forEach(function (f) {
          if (dashDocFilter === 'projects') return;
          if (dashDocFilter !== 'all' && (f.category || 'scan') !== dashDocFilter) return;
          var title = (f.title || '').toLowerCase();
          if (q && title.indexOf(q) < 0) return;
          filteredRows.push(['files', f]);
        });
        filteredRows.sort(function (a, b) { return (b[1].updatedAt || 0) - (a[1].updatedAt || 0); });

        var catPill = function (k, bn, en) {
          var on = dashDocFilter === k;
          return '<button type="button" data-th-dash-doc-filter="' + k + '" class="h-8.5 px-3.5 rounded-full border text-[12.5px] font-bold cursor-pointer transition-colors ' +
            (on ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-transparent border-slate-200 dark:border-studio-border text-slate-600 dark:text-studio-muted hover:border-slate-300') + '">' + tr(bn, en) + '</button>';
        };

        var renameBar = '';
        if (dashRenameItem) {
          renameBar =
            '<form id="thDashRenameForm" class="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">' +
              '<span class="text-[12.5px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">' + tr('নতুন নাম:', 'New Title:') + '</span>' +
              '<input id="thDashRenameInput" type="text" value="' + esc(dashRenameItem.title || '') + '" class="flex-1 h-9.5 px-3 rounded-xl border border-emerald-400 bg-white dark:bg-studio-panel text-[13.5px] font-semibold text-slate-900 dark:text-white outline-none">' +
              '<button type="submit" class="h-9.5 px-4 rounded-xl border-0 bg-emerald-600 text-white text-[12.5px] font-bold cursor-pointer">' + tr('সেভ', 'Save') + '</button>' +
              '<button type="button" data-th-dash-rename-cancel class="h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-[12.5px] font-bold cursor-pointer">' + tr('বাতিল', 'Cancel') + '</button>' +
            '</form>';
        }

        mainContent =
          '<div class="space-y-4">' +
            '<div class="flex flex-wrap items-center justify-between gap-3">' +
              '<div>' +
                '<h2 class="m-0 text-[17px] font-extrabold text-slate-900 dark:text-white">' + tr('ডকুমেন্ট ও প্রজেক্ট ম্যানেজার', 'Document & Project Manager') + '</h2>' +
                '<p class="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-studio-muted">' + tr('আপনার সব স্ক্যান, এনআইডি, পিডিএফ ও চলমান প্রজেক্ট এক জায়গা থেকে পরিচালনা করুন', 'Manage all your scans, NIDs, PDFs, and active projects in one place') + '</p>' +
              '</div>' +
              '<button type="button" data-th-dash-upload class="h-10 px-4 rounded-xl border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">' +
                '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                tr('নতুন ডকুমেন্ট আপলোড', 'Upload Document') +
              '</button>' +
            '</div>' +
            renameBar +
            '<div class="flex flex-wrap items-center gap-2">' +
              catPill('all', 'সব (' + totalItems + ')', 'All (' + totalItems + ')') +
              catPill('projects', 'চলমান কাজ (' + totalProjs + ')', 'Projects (' + totalProjs + ')') +
              catPill('scan', 'স্ক্যান', 'Scans') +
              catPill('nid', 'এনআইডি / আইডি', 'NID / ID') +
              catPill('pdf', 'পিডিএফ', 'PDF') +
              catPill('vector', 'ভেক্টর', 'Vector') +
              '<div class="ml-auto relative min-w-[220px] flex-1 sm:flex-initial">' +
                '<input id="thDashDocSearchInput" type="search" value="' + esc(dashDocSearch) + '" placeholder="' + tr('ফাইলের নাম দিয়ে খুঁজুন…', 'Search by filename…') + '" class="w-full h-9 pl-3.5 pr-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-slate-50 dark:bg-studio-panel text-[13px] text-slate-900 dark:text-white outline-none focus:border-emerald-500">' +
              '</div>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">' +
              (filteredRows.length
                ? filteredRows.map(function (r) { return renderDashItemRow(r[0], r[1]); }).join('')
                : '<div class="col-span-full p-10 rounded-2xl border border-dashed border-slate-200 dark:border-studio-border text-center text-[13.5px] text-slate-500 dark:text-studio-muted">' +
                    tr('এই ফিল্টারে কোনো ডকুমেন্ট বা প্রজেক্ট পাওয়া যায়নি।', 'No documents or projects found in this filter.') +
                  '</div>') +
            '</div>' +
          '</div>';
      } else if (dashTab === 'security') {
        var inpCls = 'w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-panel text-[14px] text-slate-900 dark:text-white outline-none focus:border-emerald-500';
        mainContent =
          '<div class="space-y-5 max-w-2xl">' +
            '<div>' +
              '<h2 class="m-0 text-[17px] font-extrabold text-slate-900 dark:text-white">' + tr('প্রোফাইল ও পাসওয়ার্ড পরিবর্তন', 'Profile & Password Security') + '</h2>' +
              '<p class="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-studio-muted">' + tr('আপনার প্রোফাইলের নাম এবং অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন', 'Update your display name and account password') + '</p>' +
            '</div>' +

            '<!-- Update Display Name -->' +
            '<form id="thDashProfileForm" class="p-5 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/50 dark:bg-studio-panel space-y-3.5">' +
              '<div class="flex items-center gap-3.5">' +
                avatarHtml(u, 'w-12 h-12 text-[17px]') +
                '<div class="min-w-0 flex-1">' +
                  '<b class="block text-[14px] text-slate-900 dark:text-white">' + tr('প্রোফাইলের নাম ও পরিচয়', 'Profile Display Name') + '</b>' +
                  '<small class="block text-[12px] text-slate-500 dark:text-studio-muted">' + esc(u.email) + '</small>' +
                '</div>' +
              '</div>' +
              '<div class="flex flex-col sm:flex-row gap-2.5">' +
                '<input id="thDashNameInput" type="text" value="' + esc(u.displayName || '') + '" placeholder="' + tr('আপনার নাম লিখুন', 'Enter your display name') + '" class="' + inpCls + ' flex-1">' +
                '<button type="submit" class="h-11 px-5 rounded-xl border-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[13.5px] font-bold cursor-pointer shrink-0">' + tr('নাম আপডেট করুন', 'Save Name') + '</button>' +
              '</div>' +
              '<div id="thDashProfileMsg" class="text-[12.5px] font-semibold empty:hidden"></div>' +
            '</form>' +

            '<!-- Change Password -->' +
            '<form id="thDashPassForm" class="p-5 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/50 dark:bg-studio-panel space-y-3.5">' +
              '<div class="flex items-center justify-between gap-2 flex-wrap">' +
                '<div>' +
                  '<b class="block text-[14px] text-slate-900 dark:text-white">' + tr('পাসওয়ার্ড পরিবর্তন / নতুন পাসওয়ার্ড সেট', 'Change or Set Password') + '</b>' +
                  '<small class="block text-[12px] text-slate-500 dark:text-studio-muted">' + tr('কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড দিন অথবা ইমেইলে রিসেট লিংক পাঠান', 'Enter a new password (min 6 chars) or send a reset link to your email') + '</small>' +
                '</div>' +
                '<button type="button" data-th-dash-send-reset class="h-8.5 px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[12px] font-bold cursor-pointer hover:bg-emerald-500/20">' +
                  tr('ইমেইলে রিসেট লিংক পাঠান', 'Send Reset Email') +
                '</button>' +
              '</div>' +
              '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
                '<input id="thDashNewPass" type="password" autocomplete="new-password" placeholder="' + tr('নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)', 'New password (min 6 chars)') + '" class="' + inpCls + '">' +
                '<input id="thDashConfirmPass" type="password" autocomplete="new-password" placeholder="' + tr('পুনরায় নতুন পাসওয়ার্ড দিন', 'Confirm new password') + '" class="' + inpCls + '">' +
              '</div>' +
              '<div class="flex items-center justify-between gap-2">' +
                '<div id="thDashPassMsg" class="text-[12.5px] font-semibold flex-1"></div>' +
                '<button type="submit" class="h-10.5 px-5 rounded-xl border-0 bg-slate-900 dark:bg-emerald-600 text-white text-[13.5px] font-bold cursor-pointer">' + tr('পাসওয়ার্ড পরিবর্তন করুন', 'Update Password') + '</button>' +
              '</div>' +
            '</form>' +
          '</div>';
      } else if (dashTab === 'settings') {
        mainContent =
          '<div class="space-y-5 max-w-2xl">' +
            '<div>' +
              '<h2 class="m-0 text-[17px] font-extrabold text-slate-900 dark:text-white">' + tr('সিঙ্ক সেটিংস ও সাইন আউট', 'Sync Settings & Sign Out') + '</h2>' +
              '<p class="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-studio-muted">' + tr('ক্লাউড সিঙ্ক প্রাইভেসি এবং ডিভাইস সেশন নিয়ন্ত্রণ করুন', 'Manage cloud sync privacy and device session') + '</p>' +
            '</div>' +

            '<div class="p-5 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-slate-50/50 dark:bg-studio-panel space-y-3">' +
              '<label class="flex items-center justify-between gap-3 cursor-pointer">' +
                '<div>' +
                  '<b class="block text-[14px] text-slate-900 dark:text-white">' + tr('NID ও পাসপোর্ট স্ক্যান ক্লাউডে সিঙ্ক করুন', 'Sync NID & Passport Scans to Cloud') + '</b>' +
                  '<small class="block text-[12px] text-slate-500 dark:text-studio-muted">' + tr('চালু থাকলে আপনার এনআইডি ও পাসপোর্ট স্ক্যানগুলোও এনক্রিপ্টেড ক্লাউডে ব্যাকআপ থাকবে', 'Keep your ID card and passport scans backed up across devices') + '</small>' +
                '</div>' +
                '<input type="checkbox" id="thSyncSensitive" ' + (syncSensitive() ? 'checked' : '') + ' class="w-5 h-5 accent-emerald-600 shrink-0">' +
              '</label>' +
            '</div>' +

            '<div class="p-5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-500/5 space-y-3.5">' +
              '<b class="block text-[14px] text-rose-700 dark:text-rose-300">' + tr('অ্যাকাউন্ট সাইন আউট', 'Sign Out of Account') + '</b>' +
              '<label class="flex items-center gap-2.5 text-[13px] text-slate-700 dark:text-studio-muted cursor-pointer">' +
                '<input type="checkbox" id="thWipeLocal" class="w-4 h-4 accent-rose-600 shrink-0">' +
                '<span>' + tr('সাইন-আউটের সময় এই ডিভাইস থেকে অ্যাকাউন্টের সব কপি মুছে ফেলুন (শেয়ার্ড কম্পিউটারের জন্য নিরাপদ)', 'Remove all account copies from this device on sign-out (recommended on shared computers)') + '</span>' +
              '</label>' +
              '<button type="button" data-th-signout class="h-11 px-6 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-600 hover:bg-rose-700 text-white text-[13.5px] font-bold cursor-pointer transition-colors">' +
                tr('সাইন আউট করুন', 'Sign Out') +
              '</button>' +
            '</div>' +
          '</div>';
      }

      mount.innerHTML =
        '<div class="space-y-4">' +
          '<div class="flex flex-wrap items-center justify-between gap-3">' +
            '<div>' +
              '<h1 class="m-0 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">' + tr('ইউজার ড্যাশবোর্ড', 'User Dashboard') + '</h1>' +
              '<p class="m-0 mt-0.5 text-[12.5px] text-slate-500 dark:text-studio-muted">' + tr('অ্যাকাউন্ট, ক্লাউড সিঙ্ক এবং ডকুমেন্ট ও প্রজেক্ট ম্যানেজমেন্ট', 'Account, Cloud Sync & Document Management') + '</p>' +
            '</div>' +
            '<a href="/" class="inline-flex items-center gap-1.5 h-9.5 px-3.5 rounded-xl border border-slate-200 dark:border-studio-border bg-white dark:bg-studio-sidebar text-slate-700 dark:text-studio-text text-[12.5px] font-bold no-underline hover:border-emerald-500 transition-colors">← ' + tr('হোমপেজে ফিরে যান', 'Back to Home') + '</a>' +
          '</div>' +
          '<div class="rounded-3xl border border-slate-200/80 dark:border-studio-border bg-white dark:bg-studio-sidebar shadow-xs flex flex-col lg:flex-row min-h-[640px] overflow-hidden">' +
            '<!-- Sidebar -->' +
            '<aside class="w-full lg:w-64 shrink-0 bg-slate-50/90 dark:bg-studio-panel border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-studio-border p-4 flex flex-col justify-between gap-4">' +
              '<div class="space-y-3">' +
                '<nav class="grid grid-cols-2 lg:grid-cols-1 gap-1.5">' +
                  navBtn('overview', '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>', 'ওভারভিউ ও সিঙ্ক', 'Overview & Sync') +
                  navBtn('documents', '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>', 'ডকুমেন্ট ম্যানেজার', 'Documents', totalItems) +
                  navBtn('security', '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>', 'প্রোফাইল ও পাসওয়ার্ড', 'Profile & Password') +
                  navBtn('settings', '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', 'সেটিংস ও সাইন আউট', 'Settings') +
                '</nav>' +
              '</div>' +
              '<div class="hidden lg:flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-studio-sidebar border border-slate-200/70 dark:border-studio-border">' +
                avatarHtml(u, 'w-9 h-9 text-[13px]') +
                '<div class="min-w-0 flex-1">' +
                  '<b class="block text-[12.5px] truncate text-slate-900 dark:text-white">' + esc(u.displayName || u.email.split('@')[0]) + '</b>' +
                  '<small class="block text-[11px] text-emerald-600 dark:text-emerald-400 truncate">' + esc(tr(st[0], st[1])) + '</small>' +
                '</div>' +
              '</div>' +
            '</aside>' +
            '<!-- Main Area -->' +
            '<div class="flex-1 p-5 sm:p-6 min-w-0">' +
              mainContent +
            '</div>' +
          '</div>' +
          '<input id="thDashHiddenFileInput" type="file" multiple class="hidden" accept="image/*,application/pdf,.svg,.txt,.doc,.docx">' +
        '</div>';
    });
  }

  function renderDashItemRow(store, x) {
    var isProj = store === 'projects';
    var tn = TOOL_NAMES[x.tool];
    var badge = isProj ? tr('চলমান কাজ', 'In progress') + (tn ? ' · ' + tr(tn[0], tn[1]) : '') : (x.category === 'nid' ? 'NID / ID' : x.category === 'pdf' ? 'PDF' : (x.category === 'vector' ? tr('ভেক্টর', 'Vector') : tr('ডকুমেন্ট', 'Document')));
    var cloud = x.blobRemote ? ' ☁️' : (x.syncedAt && x.syncedAt >= x.updatedAt ? ' ✓' : '');
    var thumb = x.thumb
      ? '<img src="' + esc(x.thumb) + '" alt="" class="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-studio-border bg-slate-100 shrink-0">'
      : '<span class="w-11 h-11 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center text-[10px] font-extrabold shrink-0">' + (isProj ? 'WIP' : esc(((x.title || '').split('.').pop() || 'DOC').slice(0, 4).toUpperCase())) + '</span>';
    var btn = 'h-8 px-2.5 rounded-xl border-0 inline-flex items-center justify-center cursor-pointer text-[12px] font-bold transition-colors ';
    return '<div class="flex items-center gap-3 p-2.5 rounded-2xl border border-slate-200/80 dark:border-studio-border bg-white dark:bg-studio-panel hover:border-emerald-500/30 transition-colors">' + thumb +
      '<div class="min-w-0 flex-1"><b class="block text-[13px] text-slate-900 dark:text-white truncate">' + esc(x.title || (tn ? tr(tn[0], tn[1]) : 'Untitled')) + '</b>' +
      '<small class="block text-[11px] text-slate-500 dark:text-studio-muted truncate">' + esc(badge) + ' · ' + fmtDate(x.updatedAt) + (x.size ? ' · ' + fmtBytes(x.size) : '') + cloud + '</small></div>' +
      '<div class="flex items-center gap-1 shrink-0">' +
        '<button type="button" data-th-work-act="rename" data-store="' + store + '" data-id="' + esc(x.id) + '" class="' + btn + 'bg-slate-100 dark:bg-studio-surface text-slate-700 dark:text-studio-text" title="' + tr('নাম পরিবর্তন', 'Rename') + '">✎</button>' +
        (isProj ? '<button type="button" data-th-work-act="open" data-store="projects" data-id="' + esc(x.id) + '" class="' + btn + 'bg-emerald-600 text-white px-3">' + tr('খুলুন', 'Open') + '</button>'
          : '<button type="button" data-th-work-act="download" data-store="files" data-id="' + esc(x.id) + '" class="' + btn + 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" title="Download">⬇</button>' +
            '<button type="button" data-th-work-act="share" data-store="files" data-id="' + esc(x.id) + '" class="' + btn + 'bg-slate-100 dark:bg-studio-surface text-slate-700 dark:text-studio-text" title="Share">⤴</button>') +
        '<button type="button" data-th-work-act="delete" data-store="' + store + '" data-id="' + esc(x.id) + '" class="' + btn + 'bg-rose-500/10 text-rose-600" title="Delete">🗑</button>' +
      '</div></div>';
  }

  function statusLine() {
    var st = STATUS_TEXT[state.status] || STATUS_TEXT.idle;
    var s = tr(st[0], st[1]);
    if (state.pending && state.status === 'syncing') s += ' (' + state.pending + ')';
    if (state.lastSync && state.status === 'idle') {
      var mins = Math.round((Date.now() - state.lastSync) / 60000);
      s += ' · ' + (mins < 1 ? tr('এইমাত্র', 'just now') : tr(mins + ' মিনিট আগে', mins + ' min ago'));
    }
    return s;
  }

  function renderStatus() {
    renderHeader();
    var st = STATUS_TEXT[state.status] || STATUS_TEXT.idle;
    var dot = document.getElementById('thSyncDot'), txt = document.getElementById('thSyncText');
    if (dot) dot.className = 'w-2 h-2 rounded-full ' + st[2];
    if (txt) txt.textContent = statusLine();
  }

  function renderAll() {
    ensureHeaderButtons();
    renderHeader();
    renderAccount();
  }

  /* ---------- My Work & Dashboard Actions ---------- */

  var TOOL_NAMES = {
    vectorize: ['রাস্টার টু ভেক্টর', 'Raster to Vector', '/image/vectorize'],
    bijoy: ['বিজয় ↔ ইউনিকোড', 'Bijoy ↔ Unicode', '/bangla/bijoy-to-unicode']
  };
  var workFilter = 'all';

  function openWork() {
    openAccount('documents');
  }

  function fmtBytes(b) {
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function fmtDate(t) {
    try { return new Date(t).toLocaleString(isEn() ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
  }

  function renderWork() {
    renderAccount();
  }

  function openShareDialog(store, id) {
    Store.getRaw(store || 'files', id).then(function (rec) {
      if (!rec || rec.deleted) {
        toast('ফাইলটি পাওয়া যায়নি', 'File not available');
        return;
      }
      return ensureBlob(store || 'files', rec);
    }).then(function (full) {
      if (!full || !full.blob) {
        toast('ফাইলটি পাওয়া যায়নি', 'File not available');
        return;
      }
      if (activeSharePayload && activeSharePayload.url) {
        try { URL.revokeObjectURL(activeSharePayload.url); } catch (e) {}
      }
      var mime = full.mime || full.blob.type || 'application/octet-stream';
      var title = full.title || 'Document';
      var file = new File([full.blob], title, { type: mime });
      var url = URL.createObjectURL(full.blob);
      activeSharePayload = { file: file, blob: full.blob, url: url, title: title, mime: mime, size: full.size || full.blob.size, thumb: full.thumb || '' };

      var d = dialogShell('thShareDialog', 'Share File');
      var canSysShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      var thumbHtml = activeSharePayload.thumb
        ? '<img src="' + esc(activeSharePayload.thumb) + '" alt="" class="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-studio-border shrink-0">'
        : '<span class="w-12 h-12 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-[11px] font-extrabold shrink-0">' + esc((title.split('.').pop() || 'DOC').slice(0, 4).toUpperCase()) + '</span>';

      var actBtn = function (act, icon, bn, en, primary) {
        return '<button type="button" data-th-share-act="' + act + '" class="flex items-center gap-3 w-full p-3 rounded-2xl border text-left cursor-pointer transition-colors ' +
          (primary
            ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
            : 'border-slate-200/80 dark:border-studio-border bg-slate-50/70 dark:bg-studio-panel hover:border-emerald-500/40 text-slate-800 dark:text-white') + '">' +
          '<span class="w-9 h-9 rounded-xl bg-white dark:bg-studio-sidebar border border-slate-200/70 dark:border-studio-border inline-flex items-center justify-center shrink-0">' + icon + '</span>' +
          '<span class="font-bold text-[13.5px] flex-1">' + tr(bn, en) + '</span>' +
        '</button>';
      };

      d.innerHTML =
        '<div class="p-5 space-y-3.5">' +
          '<div class="flex items-center justify-between gap-2">' +
            '<b class="text-[16px] font-extrabold text-slate-900 dark:text-white">' + tr('ফাইল শেয়ার ও কুইক অ্যাকশন', 'Share & Quick Actions') + '</b>' +
            '<button type="button" data-th-close class="w-8 h-8 rounded-full border-0 bg-slate-100 dark:bg-studio-panel cursor-pointer text-[14px]" aria-label="Close">✕</button>' +
          '</div>' +
          '<div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-studio-panel border border-slate-200/80 dark:border-studio-border">' +
            thumbHtml +
            '<div class="min-w-0 flex-1">' +
              '<b class="block text-[13.5px] text-slate-900 dark:text-white truncate">' + esc(title) + '</b>' +
              '<small class="block text-[11.5px] text-slate-500 dark:text-studio-muted">' + esc(fmtBytes(activeSharePayload.size)) + ' · ' + esc(mime) + '</small>' +
            '</div>' +
          '</div>' +
          '<div class="space-y-2">' +
            (canSysShare ? actBtn('native', '📤', 'ডিভাইস শেয়ার মেনু (System Share)', 'System Share Sheet', true) : '') +
            actBtn('copy', '📋', 'ক্লিপবোর্ডে কপি করুন (Copy File/Image)', 'Copy to Clipboard', !canSysShare) +
            actBtn('preview', '🔍', 'নতুন ট্যাবে প্রিভিউ ও প্রিন্ট করুন', 'Open Preview & Print in New Tab', false) +
            actBtn('whatsapp', '💬', 'WhatsApp-এ পাঠান (ফাইল ডাউনলোডসহ)', 'Share on WhatsApp', false) +
            actBtn('email', '✉️', 'ইমেইলে পাঠান (Send via Email)', 'Send via Email', false) +
            actBtn('download', '⬇️', 'সরাসরি ডাউনলোড করুন (Download)', 'Download File', false) +
          '</div>' +
        '</div>';

      if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
    }).catch(function () {
      toast('ফাইল শেয়ারের জন্য লোড করা যায়নি', 'Could not load file for sharing');
    });
  }
  window.TechHatShare = openShareDialog;

  function runShareModalAction(act) {
    var p = activeSharePayload;
    if (!p || !p.blob) return;
    var dlg = document.getElementById('thShareDialog');
    if (act === 'native') {
      if (navigator.canShare && navigator.canShare({ files: [p.file] })) {
        navigator.share({ title: p.title, files: [p.file] }).then(function () {
          if (dlg && dlg.open) dlg.close();
        }).catch(function (err) {
          if (err && err.name === 'AbortError') return;
          toast('ব্রাউজার নেটিভ শেয়ার ব্লক করেছে — নিচের কপি বা প্রিভিউ অপশন ব্যবহার করুন', 'Browser blocked native share — use Copy or Preview below');
        });
      }
      return;
    }
    if (act === 'copy') {
      if (p.mime && p.mime.indexOf('image/') === 0 && navigator.clipboard && window.ClipboardItem) {
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = img.naturalWidth || 600;
          c.height = img.naturalHeight || 600;
          c.getContext('2d').drawImage(img, 0, 0);
          c.toBlob(function (pngBlob) {
            if (!pngBlob) return;
            navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]).then(function () {
              toast('ছবিটি ক্লিপবোর্ডে কপি হয়েছে! যেকোনো চ্যাটে (Ctrl+V) পেস্ট করুন', 'Image copied to clipboard! Paste (Ctrl+V) anywhere');
              if (dlg && dlg.open) dlg.close();
            }).catch(function () {
              toast('ক্লিপবোর্ডে কপি করা যায়নি', 'Could not copy to clipboard');
            });
          }, 'image/png');
        };
        img.src = p.url;
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(p.title).then(function () {
          toast('ফাইলের নাম কপি হয়েছে এবং ডাউনলোড শুরু হচ্ছে', 'Filename copied & downloading file');
          runShareModalAction('download');
        });
        return;
      }
    }
    if (act === 'preview') {
      window.open(p.url, '_blank', 'noopener');
      if (dlg && dlg.open) dlg.close();
      return;
    }
    if (act === 'whatsapp') {
      var a1 = document.createElement('a');
      a1.dataset.vaultIgnore = '1';
      a1.href = p.url;
      a1.download = p.title;
      document.body.appendChild(a1);
      a1.click();
      a1.remove();
      window.open('https://wa.me/?text=' + encodeURIComponent(p.title + ' — TechHat Studio'), '_blank', 'noopener');
      toast('ফাইলটি ডাউনলোড হয়েছে — WhatsApp চ্যাটে ড্র্যাগ করে পাঠান', 'File downloaded — attach it in WhatsApp');
      if (dlg && dlg.open) dlg.close();
      return;
    }
    if (act === 'email') {
      var a2 = document.createElement('a');
      a2.dataset.vaultIgnore = '1';
      a2.href = p.url;
      a2.download = p.title;
      document.body.appendChild(a2);
      a2.click();
      a2.remove();
      location.href = 'mailto:?subject=' + encodeURIComponent(p.title) + '&body=' + encodeURIComponent(tr('ফাইলটি সংযুক্ত করা হলো: ', 'Attached document: ') + p.title);
      if (dlg && dlg.open) dlg.close();
      return;
    }
    if (act === 'download') {
      var a = document.createElement('a');
      a.dataset.vaultIgnore = '1';
      a.href = p.url;
      a.download = p.title || 'document';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (dlg && dlg.open) dlg.close();
    }
  }

  function workAction(act, store, id) {
    if (act === 'share') {
      openShareDialog(store, id);
      return;
    }
    Store.getRaw(store, id).then(function (rec) {
      if (!rec || rec.deleted) return;
      if (act === 'rename') {
        dashRenameItem = { store: store, id: id, title: rec.title || '' };
        dashTab = 'documents';
        renderAccount();
        setTimeout(function () {
          var inp = document.getElementById('thDashRenameInput');
          if (inp) { inp.focus(); inp.select(); }
        }, 30);
        return;
      }
      if (act === 'delete') {
        askConfirm({
          tone: 'rose',
          titleBn: 'ডকুমেন্টটি মুছে ফেলবেন?',
          titleEn: 'Delete this item?',
          descBn: '"' + (rec.title || 'এটি') + '" মুছে ফেলবেন? সাইন-ইন থাকলে আপনার সব ডিভাইস থেকেও এটি মুছে যাবে।',
          descEn: 'Delete "' + (rec.title || 'this') + '"? It will be removed from all your synced devices.',
          okBn: 'মুছে ফেলুন',
          okEn: 'Delete',
          cancelBn: 'বাতিল',
          cancelEn: 'Cancel'
        }).then(function (yes) {
          if (!yes) return;
          Store.remove(store, id).then(function () {
            renderWork();
            renderAccount();
            if (window.TechHatVault && window.TechHatVault.render) window.TechHatVault.render();
          });
        });
        return;
      }
      if (act === 'open') {
        var tn = TOOL_NAMES[rec.tool];
        try { sessionStorage.setItem('thbc-open-project', rec.id); } catch (e) { /* */ }
        var target = tn ? tn[2] : '/';
        if (location.pathname.replace(/\/+$/, '') === target.replace(/\/+$/, '')) {
          window.dispatchEvent(new CustomEvent('th-open-project', { detail: { id: rec.id } }));
        } else if (window.TechHatNavigate) window.TechHatNavigate(target);
        else location.href = target;
        return;
      }
      ensureBlob(store, rec).then(function (full) {
        if (!full || !full.blob) { toast('ফাইলটি পাওয়া যায়নি', 'File not available'); return; }
        var url = URL.createObjectURL(full.blob);
        var a = document.createElement('a');
        a.dataset.vaultIgnore = '1';
        a.href = url; a.download = full.title || 'document';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
      }, function () { toast('ক্লাউড থেকে ফাইল ডাউনলোড করা যায়নি', 'Could not download from the cloud'); });
    });
  }

  function updateProfileName() {
    var nameInp = document.getElementById('thDashNameInput');
    var msgEl = document.getElementById('thDashProfileMsg');
    if (!nameInp) return;
    var newName = (nameInp.value || '').trim();
    if (!newName) {
      if (msgEl) { msgEl.textContent = tr('অনুগ্রহ করে একটি নাম লিখুন', 'Please enter a name'); msgEl.className = 'text-[12px] font-semibold text-rose-600'; }
      return;
    }
    loadFirebase().then(function (fb) {
      if (!fb.auth.currentUser) throw new Error('signed-out');
      return fb.A.updateProfile(fb.auth.currentUser, { displayName: newName }).then(function () {
        onAuthChanged(fb.auth.currentUser);
        toast('প্রোফাইলের নাম আপডেট হয়েছে', 'Profile name updated');
      });
    }).catch(function () {
      if (msgEl) { msgEl.textContent = tr('নাম আপডেট করা যায়নি', 'Could not update name'); msgEl.className = 'text-[12px] font-semibold text-rose-600'; }
    });
  }

  function updateAccountPassword() {
    var p1 = val('thDashNewPass') || '';
    var p2 = val('thDashConfirmPass') || '';
    var msgEl = document.getElementById('thDashPassMsg');
    if (p1.length < 6) {
      if (msgEl) { msgEl.textContent = tr('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', 'Password must be at least 6 characters'); msgEl.className = 'text-[12px] font-semibold text-rose-600 flex-1'; }
      return;
    }
    if (p1 !== p2) {
      if (msgEl) { msgEl.textContent = tr('দুটি পাসওয়ার্ড মেলেনি', 'Passwords do not match'); msgEl.className = 'text-[12px] font-semibold text-rose-600 flex-1'; }
      return;
    }
    if (msgEl) { msgEl.textContent = tr('আপডেট হচ্ছে…', 'Updating…'); msgEl.className = 'text-[12px] font-semibold text-slate-500 flex-1'; }
    loadFirebase().then(function (fb) {
      if (!fb.auth.currentUser) throw new Error('signed-out');
      return fb.A.updatePassword(fb.auth.currentUser, p1).then(function () {
        if (msgEl) { msgEl.textContent = tr('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', 'Password updated successfully!'); msgEl.className = 'text-[12px] font-semibold text-emerald-600 flex-1'; }
        var n1 = document.getElementById('thDashNewPass'), n2 = document.getElementById('thDashConfirmPass');
        if (n1) n1.value = '';
        if (n2) n2.value = '';
      });
    }).catch(function (e) {
      if (e && e.code === 'auth/requires-recent-login' && state.user && state.user.email) {
        if (msgEl) {
          msgEl.textContent = tr('নিরাপত্তার জন্য পুনরায় লগইন প্রয়োজন অথবা উপরের "ইমেইলে রিসেট লিংক পাঠান" বাটনে ক্লিক করুন।', 'Recent login required — click "Send Reset Email" above or sign in again.');
          msgEl.className = 'text-[12px] font-semibold text-amber-600 flex-1';
        }
        return;
      }
      if (msgEl) { msgEl.textContent = tr('পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', 'Could not update password'); msgEl.className = 'text-[12px] font-semibold text-rose-600 flex-1'; }
    });
  }

  function sendDashboardPasswordReset() {
    if (!state.user || !state.user.email) return;
    var msgEl = document.getElementById('thDashPassMsg');
    loadFirebase().then(function (fb) {
      return fb.A.sendPasswordResetEmail(fb.auth, state.user.email);
    }).then(function () {
      if (msgEl) { msgEl.textContent = tr('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!', 'Password reset link sent to your email!'); msgEl.className = 'text-[12px] font-semibold text-emerald-600 flex-1'; }
      toast('পাসওয়ার্ড রিসেট ইমেইল পাঠানো হয়েছে', 'Password reset email sent');
    }).catch(function () {
      if (msgEl) { msgEl.textContent = tr('ইমেইল পাঠানো যায়নি', 'Could not send reset email'); msgEl.className = 'text-[12px] font-semibold text-rose-600 flex-1'; }
    });
  }

  /* ============================ events ============================ */

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('[data-th-account-open]')) {
      e.preventDefault();
      document.querySelectorAll('dialog.th-mob-sheet[open]').forEach(function (d) { d.close(); });
      var wd = document.getElementById('thWorkDialog'); if (wd && wd.open) wd.close();
      openAccount();
      return;
    }
    if (t.closest('[data-th-work-open]')) {
      e.preventDefault();
      document.querySelectorAll('dialog.th-mob-sheet[open]').forEach(function (d) { d.close(); });
      openWork();
      return;
    }
    var dt = t.closest('[data-th-dash-tab]');
    if (dt) {
      dashTab = dt.getAttribute('data-th-dash-tab');
      dashRenameItem = null;
      renderAccount();
      return;
    }
    var df = t.closest('[data-th-dash-doc-filter]');
    if (df) {
      dashDocFilter = df.getAttribute('data-th-dash-doc-filter');
      renderAccount();
      return;
    }
    if (t.closest('[data-th-dash-upload]')) {
      var fi = document.getElementById('thDashHiddenFileInput');
      if (fi) fi.click();
      return;
    }
    if (t.closest('[data-th-dash-rename-cancel]')) {
      dashRenameItem = null;
      renderAccount();
      return;
    }
    if (t.closest('[data-th-dash-send-reset]')) {
      sendDashboardPasswordReset();
      return;
    }
    var close = t.closest('[data-th-close]');
    if (close) { var dl = close.closest('dialog'); if (dl) dl.close(); return; }
    var mode = t.closest('[data-th-mode]');
    if (mode) { authMode = mode.getAttribute('data-th-mode'); renderAccount(); return; }
    var a = t.closest('[data-th-auth]');
    if (a) {
      var k = a.getAttribute('data-th-auth');
      if (k === 'google') signInGoogle();
      else if (k === 'reset') resetPassword();
      return; // 'email' handled by submit
    }
    if (t.closest('[data-th-sync-now]')) { syncNow(true); return; }
    if (t.closest('[data-th-signout]')) { signOut(); return; }
    var sa = t.closest('[data-th-share-act]');
    if (sa) { runShareModalAction(sa.getAttribute('data-th-share-act')); return; }
    var wf = t.closest('[data-th-work-filter]');
    if (wf) { workFilter = wf.getAttribute('data-th-work-filter'); renderWork(); return; }
    var wa = t.closest('[data-th-work-act]');
    if (wa) { workAction(wa.getAttribute('data-th-work-act'), wa.getAttribute('data-store'), wa.getAttribute('data-id')); }
  });

  document.addEventListener('submit', function (e) {
    if (!e.target) return;
    if (e.target.id === 'thAuthForm') { e.preventDefault(); emailAuth(authMode); return; }
    if (e.target.id === 'thDashProfileForm') { e.preventDefault(); updateProfileName(); return; }
    if (e.target.id === 'thDashPassForm') { e.preventDefault(); updateAccountPassword(); return; }
    if (e.target.id === 'thDashRenameForm') {
      e.preventDefault();
      var inp = document.getElementById('thDashRenameInput');
      var newTitle = inp ? (inp.value || '').trim() : '';
      if (dashRenameItem && newTitle) {
        var item = dashRenameItem;
        dashRenameItem = null;
        Store.getRaw(item.store, item.id).then(function (rec) {
          if (!rec) return;
          rec.title = newTitle;
          return Store.save(item.store, rec);
        }).then(function () {
          renderAccount();
          if (window.TechHatVault && window.TechHatVault.render) window.TechHatVault.render();
          toast('নাম পরিবর্তন হয়েছে', 'Renamed successfully');
        });
      }
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'thDashDocSearchInput') {
      dashDocSearch = e.target.value || '';
      var pos = e.target.selectionStart || dashDocSearch.length;
      renderAccount();
      setTimeout(function () {
        var el = document.getElementById('thDashDocSearchInput');
        if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (err) { /* */ } }
      }, 15);
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'thSyncSensitive') {
      try { localStorage.setItem(SYNC_SENSITIVE_KEY, e.target.checked ? '1' : '0'); } catch (err) { /* */ }
      if (e.target.checked) scheduleSync(200);
      return;
    }
    if (e.target && e.target.id === 'thDashHiddenFileInput') {
      var list = Array.prototype.slice.call(e.target.files || []);
      e.target.value = '';
      if (!list.length) return;
      Promise.all(list.map(function (file) {
        var cat = /pdf/i.test(file.type || file.name) ? 'pdf' : (/svg/i.test(file.type || file.name) ? 'vector' : 'scan');
        if (window.TechHatVault && window.TechHatVault.save) {
          return window.TechHatVault.save(file, file.name);
        }
        return Store.save('files', { title: file.name, category: cat, mime: file.type || 'application/octet-stream', size: file.size, blob: file });
      })).then(function () {
        toast('ডকুমেন্ট যুক্ত হয়েছে', 'Document uploaded');
        renderAccount();
        if (window.TechHatVault && window.TechHatVault.render) window.TechHatVault.render();
      });
    }
  });

  // Local changes → debounced push
  Store.onChange(function (d) { if (d.origin === 'local' && state.user) scheduleSync(1500); });
  window.addEventListener('online', function () { if (state.user) scheduleSync(200); });
  window.addEventListener('offline', function () { if (state.user) { state.status = 'offline'; renderStatus(); } });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && state.user) scheduleSync(300); });
  window.addEventListener('th:pagechange', function () { renderAll(); });
  setInterval(function () { if (state.user && !document.hidden) syncNow(false); }, 45000);
  // language switch → re-render labels
  new MutationObserver(function () { renderAll(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  // SPA navigation may re-render the header or mount #thFullDashboardPage
  new MutationObserver(function () {
    if (!document.getElementById('thAccountBtn') || !document.getElementById('thMobAccountBtn')) { ensureHeaderButtons(); renderHeader(); }
    var pg = document.getElementById('thFullDashboardPage');
    if (pg && pg.children.length === 1 && !pg.querySelector('[data-th-dash-tab],[data-th-auth]')) renderAccount();
  }).observe(document.body, { childList: true, subtree: true });

  window.TechHatCloud = {
    uid: function () { return state.user ? state.user.uid : ''; },
    user: function () { return state.user; },
    status: function () { return state.status; },
    openAccount: openAccount,
    openWork: openWork,
    renderDashboard: renderAccount,
    share: openShareDialog,
    confirm: askConfirm,
    syncNow: function () { return syncNow(true); },
    ensureBlob: ensureBlob
  };

  function boot() {
    var had = false;
    try {
      had = localStorage.getItem(SESSION_FLAG) === '1';
      var cached = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null');
      if (had && cached && cached.uid) {
        state.user = { uid: cached.uid, email: cached.email || '', displayName: cached.displayName || '', photoURL: cached.photoURL || '', emailVerified: true, providers: [] };
        state.status = navigator.onLine ? (apiBase() ? 'idle' : 'disabled') : 'offline';
      }
    } catch (e) { /* */ }
    ensureHeaderButtons();
    renderHeader();
    renderAccount();
    // restore a previous session (Firebase keeps it in IndexedDB)
    if (had && navigator.onLine) loadFirebase().catch(function () { state.status = 'offline'; renderHeader(); });
    else if (had) { state.status = 'offline'; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
