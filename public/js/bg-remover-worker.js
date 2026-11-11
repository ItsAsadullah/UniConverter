/* ==========================================================================
 * TechHat Studio — Dedicated Neural AI Background Removal Web Worker
 * (`public/js/bg-remover-worker.js`)
 *
 * Runs 1024x1024 Studio-Grade Dichotomous Segmentation & Alpha Matting models
 * (`onnx-community/ormbg-ONNX` + `briaai/RMBG-1.4`) off the main UI thread
 * via @huggingface/transformers WASM SIMD + Browser CacheStorage.
 * ========================================================================== */

const TF_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.4.2';

let tfPromise = null;
let ormbgBundlePromise = null;
let rmbg14BundlePromise = null;

async function getTransformers() {
  if (!tfPromise) {
    tfPromise = import(TF_CDN).then((mod) => {
      mod.env.allowLocalModels = false;
      if (mod.env.backends && mod.env.backends.onnx && mod.env.backends.onnx.wasm) {
        mod.env.backends.onnx.wasm.simd = true;
      }
      return mod;
    });
  }
  return tfPromise;
}

async function getOrmbgBundle(onProgress) {
  if (!ormbgBundlePromise) {
    ormbgBundlePromise = (async () => {
      const tf = await getTransformers();
      const modelId = 'onnx-community/ormbg-ONNX';
      const processor = await tf.AutoProcessor.from_pretrained(modelId);
      const model = await tf.AutoModel.from_pretrained(modelId, {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: (info) => {
          if (onProgress && info && typeof info.progress === 'number') {
            const pct = Math.min(58, 12 + Math.round(info.progress * 0.45));
            onProgress(pct, 'স্টুডিও HD AI মডেল লোড হচ্ছে (' + Math.round(info.progress) + '%)...');
          }
        }
      });
      return { model, processor, tf };
    })().catch((err) => {
      ormbgBundlePromise = null;
      throw err;
    });
  }
  return ormbgBundlePromise;
}

async function getRmbg14Bundle(onProgress) {
  if (!rmbg14BundlePromise) {
    rmbg14BundlePromise = (async () => {
      const tf = await getTransformers();
      const modelId = 'briaai/RMBG-1.4';
      const processor = await tf.AutoProcessor.from_pretrained(modelId, {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: 'ImageFeatureExtractor',
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 }
        }
      });
      const model = await tf.AutoModel.from_pretrained(modelId, {
        device: 'wasm',
        dtype: 'q8',
        config: { model_type: 'custom' },
        progress_callback: (info) => {
          if (onProgress && info && typeof info.progress === 'number') {
            const pct = Math.min(72, 42 + Math.round(info.progress * 0.30));
            onProgress(pct, 'আল্ট্রা BRIA AI মডেল লোড হচ্ছে (' + Math.round(info.progress) + '%)...');
          }
        }
      });
      return { model, processor, tf };
    })().catch((err) => {
      rmbg14BundlePromise = null;
      throw err;
    });
  }
  return rmbg14BundlePromise;
}

function extractMaskTensor(resObj) {
  const key = resObj.alphas ? 'alphas' : (resObj.output ? 'output' : Object.keys(resObj)[0]);
  const tensor = resObj[key];
  const dims = tensor.dims;
  const mh = dims[dims.length - 2];
  const mw = dims[dims.length - 1];
  const src = tensor.data;
  const n = mw * mh;
  const out = new Float32Array(n);

  let mn = 1e9;
  let mx = -1e9;
  for (let i = 0; i < n; i++) {
    const v = src[i];
    if (v < mn) mn = v;
    if (v > mx) mx = v;
  }
  const span = mx - mn > 1e-5 ? mx - mn : 1;
  for (let i = 0; i < n; i++) {
    let v = (src[i] - mn) / span;
    if (v < 0) v = 0;
    else if (v > 1) v = 1;
    out[i] = v;
  }
  return { mask: out, mw, mh };
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  if (msg.type !== 'segment') return;
  const { reqId, rgbBuffer, width, height, mode } = msg;

  const report = (pct, text) => {
    self.postMessage({ type: 'progress', reqId, pct, msg: text });
  };

  try {
    const tf = await getTransformers();
    const rgbBytes = new Uint8Array(rgbBuffer);
    const rawImg = new tf.RawImage(rgbBytes, width, height, 3);

    if (mode === 'object' || mode === 'ultra') {
      report(15, 'ডুয়াল-মডেল আল্ট্রা AI প্রস্তুত হচ্ছে...');
      const orm = await getOrmbgBundle(report);
      report(55, '১ম স্তর: Open-RMBG ১০২৪px সেগমেন্টেশন চলছে...');
      const ormInputs = await orm.processor(rawImg);
      const ormRes = await orm.model({ pixel_values: ormInputs.pixel_values });
      const m1 = extractMaskTensor(ormRes);

      let finalMask = m1.mask;
      let engineUsed = 'ormbg-hd';

      try {
        const rmbg = await getRmbg14Bundle(report);
        report(76, '২য় স্তর: BRIA RMBG-1.4 এনসেম্বল ফিউশন চলছে...');
        const rmbgInputs = await rmbg.processor(rawImg);
        const rmbgRes = await rmbg.model({ input: rmbgInputs.pixel_values });
        const m2 = extractMaskTensor(rmbgRes);

        if (m1.mw === m2.mw && m1.mh === m2.mh) {
          const fused = new Float32Array(m1.mask.length);
          for (let i = 0; i < fused.length; i++) {
            const a = m1.mask[i];
            const b = m2.mask[i];
            const hi = a > b ? a : b;
            const lo = a < b ? a : b;
            // Protect solid clothing/body interior when one model is strongly confident (>0.85) and the other agrees (>0.30)
            if (hi > 0.85 && lo > 0.30) {
              fused[i] = 0.72 * hi + 0.28 * lo;
            } else if (hi < 0.12) {
              // Suppress background noise when both agree it is background
              fused[i] = lo * 0.5;
            } else {
              // Balanced studio matting blend along fine hair & subtle edges
              fused[i] = 0.58 * a + 0.42 * b;
            }
          }
          finalMask = fused;
          engineUsed = 'dual-rmbg-ensemble';
        }
      } catch (_) {
        // Keep m1 if secondary model fails
      }

      self.postMessage(
        {
          type: 'result',
          reqId,
          maskBuffer: finalMask.buffer,
          mw: m1.mw,
          mh: m1.mh,
          engineUsed
        },
        [finalMask.buffer]
      );
      return;
    }

    // Default Studio HD Mode ('auto' | 'portrait'): 1024x1024 Open-RMBG
    report(16, 'স্টুডিও HD AI প্রস্তুত হচ্ছে...');
    try {
      const orm = await getOrmbgBundle(report);
      report(60, '১০২৪px নিখুঁত চুল ও পোশাক সেগমেন্টেশন চলছে...');
      const ormInputs = await orm.processor(rawImg);
      const ormRes = await orm.model({ pixel_values: ormInputs.pixel_values });
      const m1 = extractMaskTensor(ormRes);
      self.postMessage(
        {
          type: 'result',
          reqId,
          maskBuffer: m1.mask.buffer,
          mw: m1.mw,
          mh: m1.mh,
          engineUsed: 'ormbg-hd'
        },
        [m1.mask.buffer]
      );
    } catch (primaryErr) {
      // Secondary fallback to BRIA RMBG-1.4
      const rmbg = await getRmbg14Bundle(report);
      report(64, 'BRIA Studio AI সেগমেন্টেশন চলছে...');
      const rmbgInputs = await rmbg.processor(rawImg);
      const rmbgRes = await rmbg.model({ input: rmbgInputs.pixel_values });
      const m2 = extractMaskTensor(rmbgRes);
      self.postMessage(
        {
          type: 'result',
          reqId,
          maskBuffer: m2.mask.buffer,
          mw: m2.mw,
          mh: m2.mh,
          engineUsed: 'rmbg-1.4'
        },
        [m2.mask.buffer]
      );
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      reqId,
      error: (err && err.message) ? err.message : String(err)
    });
  }
};
