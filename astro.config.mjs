import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const localCropDataset = {
  name: 'techhat-local-crop-dataset',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost');
      if (url.pathname !== '/__local/crop-dataset') return next();
      const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
      const hostHeader = String(req.headers.host || '');
      const host = hostHeader.startsWith('[') ? '[::1]' : hostHeader.split(':')[0];
      let originHost = '';
      try { originHost = new URL(String(req.headers.origin || '')).hostname; } catch {}
      if (!localHosts.has(host) || !localHosts.has(originHost)) {
        res.statusCode = 403;
        res.end('Localhost only');
        return;
      }
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.end('Method not allowed');
        return;
      }

      try {
        const raw = req.headers['x-crop-annotation'];
        if (typeof raw !== 'string') throw new Error('Annotation is required');
        const annotation = JSON.parse(decodeURIComponent(raw));
        if (!['training', 'testing'].includes(annotation.split)) throw new Error('Invalid dataset split');
        const validQuad = (quad) => Array.isArray(quad) && quad.length === 4 && quad.every((p) =>
          Number.isFinite(p?.x) && Number.isFinite(p?.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1,
        );
        if (!validQuad(annotation.autoPts) || !validQuad(annotation.correctedPts)) throw new Error('Invalid crop points');

        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 40 * 1024 * 1024) throw new Error('Image exceeds 40 MB');
          chunks.push(chunk);
        }
        if (!size) throw new Error('Image is empty');

        const mime = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();
        const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/bmp': 'bmp' })[mime];
        if (!extension) throw new Error('Unsupported image type');
        const image = Buffer.concat(chunks);
        const id = createHash('sha256').update(image).digest('hex');
        const datasetRoot = path.resolve(process.cwd(), 'local-data', 'crop-dataset');
        const directory = path.join(datasetRoot, annotation.split, id);
        const otherSplit = annotation.split === 'training' ? 'testing' : 'training';
        await rm(path.join(datasetRoot, otherSplit, id), { recursive: true, force: true });
        await mkdir(directory, { recursive: true });
        const fileName = String(annotation.fileName || 'scan').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
        await writeFile(path.join(directory, `image.${extension}`), image);
        await writeFile(path.join(directory, 'annotation.json'), JSON.stringify({
          ...annotation,
          id,
          fileName,
          mime,
          savedAt: new Date().toISOString(),
        }, null, 2) + '\n');
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, id }));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Could not save crop sample' }));
      }
    });
  },
};

export default defineConfig({
  integrations: [icon()],
  vite: { plugins: [localCropDataset] },
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory',
  },
});
