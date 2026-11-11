/* TechHat Studio — secure cloud sync API (Cloudflare Worker, D1 + R2).
 *
 * Identity: Firebase Authentication ID tokens (Google / email-password).
 * Every request must send `Authorization: Bearer <Firebase ID token>`. The
 * token is verified here with Google's public keys (RS256, WebCrypto) — no
 * secrets are stored in the Worker. The verified `uid` scopes every query,
 * so a user can only ever read or write their own records.
 *
 * Routes (all JSON unless noted):
 *   GET    /v1/health                     → { ok }
 *   GET    /v1/changes?since=<srv_ts>     → { items:[...], cursor, more }
 *   PUT    /v1/items/:id                  ← item metadata (LWW on updatedAt)
 *   PUT    /v1/blobs/:id                  ← raw binary body (R2)
 *   GET    /v1/blobs/:id                  → raw binary
 *   GET    /v1/usage                      → { bytes, items, quota }
 *
 * Bindings: DB (D1), BUCKET (R2). Vars: FIREBASE_PROJECT_ID, ALLOWED_ORIGINS.
 */

const MAX_BLOB_BYTES = 50 * 1024 * 1024;     // per file
const MAX_STATE_BYTES = 1024 * 1024;         // per project state JSON
const MAX_THUMB_BYTES = 200 * 1024;          // thumbnail data URL
const MAX_VALUE_BYTES = 1024 * 1024;         // kv value
const QUOTA_BYTES = 2 * 1024 * 1024 * 1024;  // per user (2 GB)
const PAGE_SIZE = 200;
const KINDS = ['file', 'project', 'kv'];
const ID_RE = /^[A-Za-z0-9:_.-]{1,160}$/;

/* ============================ Firebase ID token verification ============================ */

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let jwksCache = { keys: null, exp: 0 };

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function fetchJwks(fetcher) {
  const t = Date.now();
  if (jwksCache.keys && jwksCache.exp > t) return jwksCache.keys;
  const res = await (fetcher || fetch)(JWKS_URL);
  if (!res.ok) throw new Error('jwks-unavailable');
  const body = await res.json();
  const cc = res.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/);
  jwksCache = { keys: body.keys || [], exp: t + (m ? Number(m[1]) : 3600) * 1000 };
  return jwksCache.keys;
}

/**
 * Verifies a Firebase ID token. Returns the decoded payload ({ sub, email, … })
 * or throws. `opts.keys` (JWK array) and `opts.now` (ms) allow offline tests.
 */
export async function verifyFirebaseToken(token, projectId, opts = {}) {
  if (!token || typeof token !== 'string') throw new Error('missing-token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed-token');
  const header = b64urlJson(parts[0]);
  const payload = b64urlJson(parts[1]);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('bad-alg');
  const nowSec = Math.floor((opts.now || Date.now()) / 1000);
  if (!projectId) throw new Error('server-misconfigured');
  if (payload.aud !== projectId) throw new Error('bad-audience');
  if (payload.iss !== 'https://securetoken.google.com/' + projectId) throw new Error('bad-issuer');
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) throw new Error('bad-subject');
  if (!(payload.exp > nowSec - 30)) throw new Error('token-expired');
  if (!(payload.iat <= nowSec + 300)) throw new Error('token-from-future');
  if (payload.auth_time && payload.auth_time > nowSec + 300) throw new Error('bad-auth-time');
  const keys = opts.keys || await fetchJwks(opts.fetcher);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown-key');
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]),
    new TextEncoder().encode(parts[0] + '.' + parts[1]));
  if (!ok) throw new Error('bad-signature');
  return payload;
}

/* ============================ helpers ============================ */

function allowedOrigin(req, env) {
  const origin = req.headers.get('Origin') || '';
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin) return '';
  if (list.includes(origin)) return origin;
  // local development
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return '';
}

function corsHeaders(origin) {
  const h = {
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Blob-Version',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (origin) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, corsHeaders(origin))
  });
}

function err(status, code, origin) { return json({ error: code }, status, origin); }

function byteLen(s) { return s == null ? 0 : new TextEncoder().encode(String(s)).length; }

function r2Key(uid, id) { return 'u/' + uid + '/' + id; }

function rowToWire(r) {
  let state = null;
  if (r.state) { try { state = JSON.parse(r.state); } catch (e) { state = null; } }
  return {
    id: r.id, kind: r.kind, tool: r.tool || '', title: r.title || '', category: r.category || '',
    mime: r.mime || '', size: r.size || 0, thumb: r.thumb || '', state,
    key: r.kv_key || '', value: r.kv_value == null ? null : r.kv_value,
    hasBlob: !!r.has_blob, blobVersion: r.blob_version || 0,
    createdAt: r.created_at || 0, updatedAt: r.updated_at || 0, deleted: !!r.deleted, srvTs: r.srv_ts
  };
}

// Strictly increasing server timestamp per user, used as the sync cursor
// (independent of client clocks).
async function nextSrvTs(env, uid) {
  const row = await env.DB.prepare('SELECT MAX(srv_ts) AS m FROM items WHERE uid = ?').bind(uid).first();
  return Math.max(Date.now(), ((row && row.m) || 0) + 1);
}

/* ============================ route handlers ============================ */

async function handleChanges(env, uid, url, origin) {
  const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
  const res = await env.DB.prepare(
    'SELECT * FROM items WHERE uid = ? AND srv_ts > ? ORDER BY srv_ts ASC LIMIT ?'
  ).bind(uid, since, PAGE_SIZE + 1).all();
  const rows = res.results || [];
  const more = rows.length > PAGE_SIZE;
  const page = more ? rows.slice(0, PAGE_SIZE) : rows;
  const cursor = page.length ? page[page.length - 1].srv_ts : since;
  return json({ items: page.map(rowToWire), cursor, more }, 200, origin);
}

async function handlePutItem(env, uid, id, req, origin) {
  let body;
  try { body = await req.json(); } catch (e) { return err(400, 'bad-json', origin); }
  if (!body || typeof body !== 'object') return err(400, 'bad-body', origin);
  const kind = String(body.kind || '');
  if (!KINDS.includes(kind)) return err(400, 'bad-kind', origin);
  const updatedAt = Number(body.updatedAt) || 0;
  if (!updatedAt) return err(400, 'missing-updatedAt', origin);
  const deleted = body.deleted ? 1 : 0;
  const stateStr = body.state == null || deleted ? null : JSON.stringify(body.state);
  if (byteLen(stateStr) > MAX_STATE_BYTES) return err(413, 'state-too-large', origin);
  const thumb = deleted ? '' : String(body.thumb || '');
  if (byteLen(thumb) > MAX_THUMB_BYTES || (thumb && !/^data:image\/(png|jpeg|webp);base64,/.test(thumb))) return err(400, 'bad-thumb', origin);
  const kvValue = kind === 'kv' && !deleted && body.value != null ? String(body.value) : null;
  if (byteLen(kvValue) > MAX_VALUE_BYTES) return err(413, 'value-too-large', origin);

  const existing = await env.DB.prepare('SELECT updated_at, has_blob, blob_version, size FROM items WHERE uid = ? AND id = ?').bind(uid, id).first();
  if (existing && existing.updated_at > updatedAt) {
    return json({ ok: true, stale: true, updatedAt: existing.updated_at }, 409, origin);
  }
  const srvTs = await nextSrvTs(env, uid);
  const hasBlob = !deleted && body.hasBlob ? 1 : 0;
  await env.DB.prepare(
    `INSERT INTO items (uid, id, kind, tool, title, category, mime, size, thumb, state, kv_key, kv_value,
       has_blob, blob_version, created_at, updated_at, deleted, srv_ts)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
     ON CONFLICT(uid, id) DO UPDATE SET kind=?3, tool=?4, title=?5, category=?6, mime=?7, size=?8, thumb=?9,
       state=?10, kv_key=?11, kv_value=?12, has_blob=?13, blob_version=MAX(blob_version, ?14), created_at=?15,
       updated_at=?16, deleted=?17, srv_ts=?18`
  ).bind(
    uid, id, kind, String(body.tool || '').slice(0, 60), String(body.title || '').slice(0, 300),
    String(body.category || '').slice(0, 40), String(body.mime || '').slice(0, 120),
    Math.max(0, Number(body.size) || 0), thumb, stateStr,
    kind === 'kv' ? String(body.key || '').slice(0, 120) : '', kvValue,
    hasBlob, Number(body.blobVersion) || 0, Number(body.createdAt) || updatedAt, updatedAt, deleted, srvTs
  ).run();
  if (deleted && existing && existing.has_blob) {
    await env.BUCKET.delete(r2Key(uid, id));
  }
  return json({ ok: true, srvTs }, 200, origin);
}

async function handlePutBlob(env, uid, id, req, origin) {
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > MAX_BLOB_BYTES) return err(413, 'file-too-large', origin);
  const usage = await env.DB.prepare('SELECT COALESCE(SUM(size),0) AS bytes FROM items WHERE uid = ? AND deleted = 0 AND has_blob = 1 AND id <> ?').bind(uid, id).first();
  if (((usage && usage.bytes) || 0) + len > QUOTA_BYTES) return err(507, 'quota-exceeded', origin);
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_BLOB_BYTES) return err(413, 'file-too-large', origin);
  const mime = (req.headers.get('Content-Type') || 'application/octet-stream').slice(0, 120);
  const version = Number(req.headers.get('X-Blob-Version')) || Date.now();
  await env.BUCKET.put(r2Key(uid, id), buf, {
    httpMetadata: { contentType: mime },
    customMetadata: { version: String(version) }
  });
  return json({ ok: true, size: buf.byteLength, version }, 200, origin);
}

async function handleGetBlob(env, uid, id, origin) {
  const row = await env.DB.prepare('SELECT title, deleted FROM items WHERE uid = ? AND id = ?').bind(uid, id).first();
  if (!row || row.deleted) return err(404, 'not-found', origin);
  const obj = await env.BUCKET.get(r2Key(uid, id));
  if (!obj) return err(404, 'blob-missing', origin);
  const h = new Headers(corsHeaders(origin));
  obj.writeHttpMetadata(h);
  h.set('Cache-Control', 'private, no-store');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Content-Disposition', 'attachment');
  return new Response(obj.body, { status: 200, headers: h });
}

async function handleUsage(env, uid, origin) {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN has_blob = 1 THEN size ELSE 0 END),0) AS bytes FROM items WHERE uid = ? AND deleted = 0').bind(uid).first();
  return json({ items: (row && row.n) || 0, bytes: (row && row.bytes) || 0, quota: QUOTA_BYTES }, 200, origin);
}

/* ============================ entry ============================ */

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = allowedOrigin(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (req.headers.get('Origin') && !origin) return err(403, 'origin-not-allowed', '');
    if (url.pathname === '/v1/health') return json({ ok: true }, 200, origin);

    const auth = req.headers.get('Authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    let claims;
    try {
      claims = await verifyFirebaseToken(m && m[1], env.FIREBASE_PROJECT_ID);
    } catch (e) {
      return err(401, 'unauthenticated', origin);
    }
    const uid = claims.sub;

    try {
      if (req.method === 'GET' && url.pathname === '/v1/changes') return await handleChanges(env, uid, url, origin);
      if (req.method === 'GET' && url.pathname === '/v1/usage') return await handleUsage(env, uid, origin);
      const im = url.pathname.match(/^\/v1\/(items|blobs)\/([^/]+)$/);
      if (im) {
        const id = decodeURIComponent(im[2]);
        if (!ID_RE.test(id)) return err(400, 'bad-id', origin);
        if (im[1] === 'items' && req.method === 'PUT') return await handlePutItem(env, uid, id, req, origin);
        if (im[1] === 'blobs' && req.method === 'PUT') return await handlePutBlob(env, uid, id, req, origin);
        if (im[1] === 'blobs' && req.method === 'GET') return await handleGetBlob(env, uid, id, origin);
      }
      return err(404, 'not-found', origin);
    } catch (e) {
      console.error('sync error', e && e.message);
      return err(500, 'server-error', origin);
    }
  }
};
