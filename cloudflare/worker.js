/**
 * TechHat Studio — Cloudflare Worker (R2 + D1 Document Backup & Sync API)
 * Bindings required in wrangler.toml:
 *   - DB (D1 Database: techhat_vault_db)
 *   - BUCKET (R2 Bucket: techhat-vault-files)
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Account'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const account = (
      request.headers.get('X-Sync-Account') ||
      url.searchParams.get('account') ||
      ''
    ).trim().toLowerCase();

    if (!account) {
      return jsonResponse({ error: 'Missing Sync Account ID' }, 400);
    }

    // GET /api/docs — List all saved documents for this account
    if (request.method === 'GET' && url.pathname === '/api/docs') {
      const { results } = await env.DB.prepare(
        `SELECT id, title, category, mime, size, created_at AS createdAt, thumb
         FROM documents WHERE account = ?1 ORDER BY created_at DESC LIMIT 200`
      ).bind(account).all();
      return jsonResponse({ docs: results || [] });
    }

    // POST /api/docs — Upload a document blob to R2 + metadata to D1
    if (request.method === 'POST' && url.pathname === '/api/docs') {
      const form = await request.formData();
      const id = String(form.get('id') || `doc_${Date.now()}`);
      const title = String(form.get('title') || 'Document');
      const category = String(form.get('category') || 'scan');
      const mime = String(form.get('mime') || 'application/octet-stream');
      const size = Number(form.get('size') || 0);
      const createdAt = Number(form.get('createdAt') || Date.now());
      const thumb = String(form.get('thumb') || '');
      const file = form.get('file');

      if (!file || typeof file.arrayBuffer !== 'function') {
        return jsonResponse({ error: 'Missing file payload' }, 400);
      }

      const r2Key = `${account}/${id}`;
      await env.BUCKET.put(r2Key, await file.arrayBuffer(), {
        httpMetadata: { contentType: mime }
      });

      await env.DB.prepare(
        `INSERT OR REPLACE INTO documents (id, account, title, category, mime, size, created_at, thumb, r2_key)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
      ).bind(id, account, title, category, mime, size, createdAt, thumb, r2Key).run();

      return jsonResponse({ ok: true, id });
    }

    // GET /api/docs/:id/file — Download raw file from R2
    const fileMatch = url.pathname.match(/^\/api\/docs\/([^/]+)\/file$/);
    if (request.method === 'GET' && fileMatch) {
      const id = decodeURIComponent(fileMatch[1]);
      const r2Key = `${account}/${id}`;
      const obj = await env.BUCKET.get(r2Key);
      if (!obj) return jsonResponse({ error: 'Not found' }, 404);
      const headers = new Headers(CORS_HEADERS);
      obj.writeHttpMetadata(headers);
      return new Response(obj.body, { status: 200, headers });
    }

    // DELETE /api/docs/:id — Remove from R2 + D1
    const delMatch = url.pathname.match(/^\/api\/docs\/([^/]+)$/);
    if (request.method === 'DELETE' && delMatch) {
      const id = decodeURIComponent(delMatch[1]);
      const r2Key = `${account}/${id}`;
      await env.BUCKET.delete(r2Key);
      await env.DB.prepare(`DELETE FROM documents WHERE id = ?1 AND account = ?2`).bind(id, account).run();
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Route not found' }, 404);
  }
};
