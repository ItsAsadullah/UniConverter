/* Cloud sync tests — run: node tests/cloud-sync.test.cjs
 * - Firebase ID token verification (real RS256 keys generated locally)
 * - Worker end-to-end against an in-memory D1 (node:sqlite) + R2 mock
 * - th-store pure merge / push helpers
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const S = require('../public/js/th-store.js');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

const PROJECT = 'tools-techhat';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeKeys() {
  const kp = await webcrypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await webcrypto.subtle.exportKey('jwk', kp.publicKey);
  jwk.kid = 'k1';
  return { kp, jwk };
}

async function signToken(kp, payload, kid = 'k1') {
  const header = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(header + '.' + body));
  return header + '.' + body + '.' + b64url(sig);
}

function claims(uid, over = {}) {
  const now = Math.floor(Date.now() / 1000);
  return Object.assign({ aud: PROJECT, iss: 'https://securetoken.google.com/' + PROJECT, sub: uid, iat: now - 10, exp: now + 3600, auth_time: now - 10 }, over);
}

/* ---------- D1 + R2 mocks ---------- */
function makeD1() {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'schema.sql'), 'utf8'));
  return {
    prepare(sql) {
      let params = [];
      const stmt = () => db.prepare(sql);
      const api = {
        bind(...p) { params = p; return api; },
        async first() { return stmt().get(...params) || null; },
        async all() { return { results: stmt().all(...params) }; },
        async run() { stmt().run(...params); return { success: true }; }
      };
      return api;
    },
    _db: db
  };
}
function makeR2() {
  const m = new Map();
  return {
    async put(k, buf, o) { m.set(k, { buf: Buffer.from(buf), o }); },
    async get(k) {
      const v = m.get(k); if (!v) return null;
      return { body: v.buf, writeHttpMetadata(h) { h.set('Content-Type', v.o.httpMetadata.contentType); } };
    },
    async delete(k) { m.delete(k); },
    _m: m
  };
}

(async () => {
  const W = await import('../cloudflare/worker.js');
  const { kp, jwk } = await makeKeys();
  const other = await makeKeys();

  // The worker fetches Google's JWKS; route it to our generated key.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('securetoken@system.gserviceaccount.com')) {
      return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'max-age=600' } });
    }
    return realFetch(url);
  };

  /* ===== token verification ===== */
  test('valid Firebase token is accepted', async () => {
    const t = await signToken(kp, claims('user-a'));
    const p = await W.verifyFirebaseToken(t, PROJECT, { keys: [jwk] });
    assert.equal(p.sub, 'user-a');
  });
  test('token signed by another key is rejected', async () => {
    const t = await signToken(other.kp, claims('user-a'));
    await assert.rejects(W.verifyFirebaseToken(t, PROJECT, { keys: [jwk] }), /bad-signature/);
  });
  test('wrong audience / issuer / expiry are rejected', async () => {
    await assert.rejects(W.verifyFirebaseToken(await signToken(kp, claims('a', { aud: 'other' })), PROJECT, { keys: [jwk] }), /bad-audience/);
    await assert.rejects(W.verifyFirebaseToken(await signToken(kp, claims('a', { iss: 'https://evil' })), PROJECT, { keys: [jwk] }), /bad-issuer/);
    await assert.rejects(W.verifyFirebaseToken(await signToken(kp, claims('a', { exp: 1000 })), PROJECT, { keys: [jwk] }), /token-expired/);
  });
  test('tampered payload is rejected', async () => {
    const t = await signToken(kp, claims('user-a'));
    const parts = t.split('.');
    parts[1] = b64url(JSON.stringify(claims('user-b')));
    await assert.rejects(W.verifyFirebaseToken(parts.join('.'), PROJECT, { keys: [jwk] }), /bad-signature/);
  });

  /* ===== worker end-to-end ===== */
  const env = { DB: makeD1(), BUCKET: makeR2(), FIREBASE_PROJECT_ID: PROJECT, ALLOWED_ORIGINS: 'https://tools.techhat.com.bd' };
  const ORIGIN = 'https://tools.techhat.com.bd';
  async function call(method, p, { token, body, headers = {}, origin = ORIGIN } = {}) {
    const h = Object.assign({}, headers);
    if (origin) h.Origin = origin;
    if (token) h.Authorization = 'Bearer ' + token;
    if (body && !(body instanceof Uint8Array)) { h['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const res = await W.default.fetch(new Request('https://api.test' + p, { method, headers: h, body }), env);
    return res;
  }
  const tokA = await signToken(kp, claims('uid-A'));
  const tokB = await signToken(kp, claims('uid-B'));

  test('requests without a valid token get 401', async () => {
    assert.equal((await call('GET', '/v1/changes')).status, 401);
    assert.equal((await call('GET', '/v1/changes', { token: 'garbage' })).status, 401);
  });
  test('unknown origins are refused, allowed origin gets CORS header', async () => {
    assert.equal((await call('GET', '/v1/health', { origin: 'https://evil.example' })).status, 403);
    const ok = await call('GET', '/v1/health');
    assert.equal(ok.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  });
  test('item + blob round-trip, scoped to the signed-in user', async () => {
    const item = { kind: 'file', title: 'NID.pdf', category: 'nid', mime: 'application/pdf', size: 5, hasBlob: true, blobVersion: 100, createdAt: 100, updatedAt: 100 };
    assert.equal((await call('PUT', '/v1/items/doc_1', { token: tokA, body: item })).status, 200);
    const up = await call('PUT', '/v1/blobs/doc_1', { token: tokA, body: new Uint8Array([1, 2, 3, 4, 5]), headers: { 'Content-Type': 'application/pdf', 'X-Blob-Version': '100' } });
    assert.equal(up.status, 200);
    const ch = await (await call('GET', '/v1/changes?since=0', { token: tokA })).json();
    assert.equal(ch.items.length, 1);
    assert.equal(ch.items[0].title, 'NID.pdf');
    const blob = await call('GET', '/v1/blobs/doc_1', { token: tokA });
    assert.equal(blob.status, 200);
    assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [1, 2, 3, 4, 5]);
    // user B sees nothing and cannot read A's blob
    const chB = await (await call('GET', '/v1/changes?since=0', { token: tokB })).json();
    assert.equal(chB.items.length, 0);
    assert.equal((await call('GET', '/v1/blobs/doc_1', { token: tokB })).status, 404);
  });
  test('last-write-wins: older update is refused with 409', async () => {
    const newer = { kind: 'kv', key: 'thbc-theme', value: 'dark', updatedAt: 500 };
    const older = { kind: 'kv', key: 'thbc-theme', value: 'light', updatedAt: 400 };
    assert.equal((await call('PUT', '/v1/items/kv:thbc-theme', { token: tokA, body: newer })).status, 200);
    assert.equal((await call('PUT', '/v1/items/kv:thbc-theme', { token: tokA, body: older })).status, 409);
    const ch = await (await call('GET', '/v1/changes?since=0', { token: tokA })).json();
    assert.equal(ch.items.find(i => i.id === 'kv:thbc-theme').value, 'dark');
  });
  test('cursor returns only newer changes; tombstone deletes the R2 blob', async () => {
    const first = await (await call('GET', '/v1/changes?since=0', { token: tokA })).json();
    const cur = first.cursor;
    await call('PUT', '/v1/items/doc_1', { token: tokA, body: { kind: 'file', deleted: true, updatedAt: 900 } });
    const next = await (await call('GET', '/v1/changes?since=' + cur, { token: tokA })).json();
    assert.equal(next.items.length, 1);
    assert.equal(next.items[0].deleted, true);
    assert.equal(env.BUCKET._m.has('u/uid-A/doc_1'), false);
    assert.equal((await call('GET', '/v1/blobs/doc_1', { token: tokA })).status, 404);
  });
  test('invalid ids, kinds and oversized state are rejected', async () => {
    assert.equal((await call('PUT', '/v1/items/' + encodeURIComponent('../x'), { token: tokA, body: { kind: 'file', updatedAt: 1 } })).status, 400);
    assert.equal((await call('PUT', '/v1/items/a1', { token: tokA, body: { kind: 'evil', updatedAt: 1 } })).status, 400);
    const big = { kind: 'project', updatedAt: 1, state: { s: 'x'.repeat(1100 * 1024) } };
    assert.equal((await call('PUT', '/v1/items/p1', { token: tokA, body: big })).status, 413);
  });

  /* ===== store helpers ===== */
  test('needsPush only for own, unsynced, non-local records', async () => {
    assert.equal(S.needsPush({ updatedAt: 5, syncedAt: 0 }, 'u'), true);
    assert.equal(S.needsPush({ updatedAt: 5, syncedAt: 5 }, 'u'), false);
    assert.equal(S.needsPush({ updatedAt: 5, ownerUid: 'other' }, 'u'), false);
    assert.equal(S.needsPush({ updatedAt: 5, localOnly: true }, 'u'), false);
    assert.equal(S.needsPush({ updatedAt: 5 }, ''), false);
  });
  test('mergeRemote: newer remote wins, newer local stays, tombstones drop data', async () => {
    assert.equal(S.mergeRemote({ id: 'a', updatedAt: 10 }, { id: 'a', updatedAt: 5 }), null);
    const m = S.mergeRemote({ id: 'a', updatedAt: 5, title: 'old' }, { id: 'a', updatedAt: 10, title: 'new', hasBlob: true });
    assert.equal(m.title, 'new'); assert.equal(m.blobRemote, true); assert.equal(m.syncedAt, 10);
    const keep = S.mergeRemote({ id: 'a', updatedAt: 5, blob: { size: 3 }, blobVersion: 10 }, { id: 'a', updatedAt: 10, hasBlob: true, blobVersion: 10 });
    assert.ok(keep.blob, 'same-version blob kept'); assert.equal(keep.blobRemote, false);
    const d = S.mergeRemote({ id: 'a', updatedAt: 5, blob: { size: 3 }, state: { x: 1 } }, { id: 'a', updatedAt: 10, deleted: true });
    assert.equal(d.deleted, true); assert.equal(d.blob, null); assert.equal(d.state, null);
  });
  test('toWire never includes the binary', async () => {
    const w = S.toWire({ id: 'f', blob: { size: 9 }, updatedAt: 3, title: 't' }, 'file');
    assert.equal(w.hasBlob, true); assert.equal(w.size, 9); assert.equal('blob' in w, false);
  });

  for (const [name, fn] of tests) {
    try { await fn(); passed++; console.log('✓ ' + name); }
    catch (e) { console.error('✗ ' + name + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
  }
  console.log(passed + ' cloud sync tests passed' + (process.exitCode ? ' (with failures)' : ''));
})();
