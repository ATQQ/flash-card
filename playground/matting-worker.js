// M2 自动抠图 · Worker 推理（RMBG-1.4 INT8）
// 加载策略：本 Worker / 模型 / ort wasm 均在用户点击「自动抠图」后才拉取，打开页面不占流量。
// 模型来源：本地 ./models/RMBG-1.4 优先（开发）；没有则走 CDN（部署包不带 ~42MB 权重）。
//
// 协议：
//   in  { type: 'load' }
//   in  { type: 'run', width, height, rgba: ArrayBuffer }
//   out { type: 'progress' | 'ready' | 'result' | 'error', ... }
import {
  AutoModel, AutoProcessor, RawImage, env,
} from './vendor/transformers.min.js';

/** CDN 上 models 根目录（其下直接是 RMBG-1.4/） */
const MODEL_CDN = 'https://cdn.upyun.sugarat.top/web-static/models/';
/** 本地目录名；与 CDN 上文件夹名一致 */
const MODEL_ID = 'RMBG-1.4';

env.backends.onnx.wasm.wasmPaths = new URL('./vendor/', import.meta.url).href;

let model = null;
let processor = null;

function report(p) {
  postMessage({
    type: 'progress',
    file: p.file || '',
    loaded: p.loaded || 0,
    total: p.total || 0,
    progress: typeof p.progress === 'number' ? p.progress : 0,
  });
}

async function hasLocalModel() {
  try {
    const url = new URL(`./models/${MODEL_ID}/config.json`, import.meta.url);
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

function configureRemoteCdn() {
  env.allowLocalModels = false;
  env.allowRemoteModels = true;
  const base = MODEL_CDN.endsWith('/') ? MODEL_CDN : MODEL_CDN + '/';
  env.remoteHost = base;
  // → {MODEL_CDN}RMBG-1.4/onnx/model_quantized.onnx
  env.remotePathTemplate = '{model}/';
}

async function ensure() {
  if (model && processor) return;

  const local = await hasLocalModel();
  if (local) {
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = new URL('./models/', import.meta.url).href;
  } else {
    configureRemoteCdn();
  }

  model = await AutoModel.from_pretrained(MODEL_ID, {
    dtype: 'q8',
    config: { model_type: 'custom' },
    progress_callback: report,
  });
  processor = await AutoProcessor.from_pretrained(MODEL_ID, {
    config: {
      feature_extractor_type: 'ImageFeatureExtractor',
      do_normalize: true,
      do_pad: false,
      do_rescale: true,
      do_resize: true,
      image_mean: [0.5, 0.5, 0.5],
      image_std: [1, 1, 1],
      resample: 2,
      rescale_factor: 0.00392156862745098,
      size: { width: 1024, height: 1024 },
    },
  });
}

onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === 'load') {
      await ensure();
      postMessage({ type: 'ready' });
      return;
    }
    if (msg.type === 'run') {
      await ensure();
      const { width, height } = msg;
      const rgba = new Uint8ClampedArray(msg.rgba);
      const image = new RawImage(rgba, width, height, 4);
      const { pixel_values } = await processor(image);
      const session = model.session || (model.sessions && model.sessions.model);
      const inName = (session && session.inputNames && session.inputNames[0]) || 'input';
      const output = await model({ [inName]: pixel_values });
      const tensor = output[0] || output.output || output[Object.keys(output)[0]];
      const chw = tensor.dims && tensor.dims.length === 4 ? tensor.squeeze(0) : tensor;
      const mask = await RawImage.fromTensor(chw.mul(255).to('uint8')).resize(width, height);
      const alpha = mask.data instanceof Uint8ClampedArray ? mask.data : new Uint8ClampedArray(mask.data);
      postMessage({ type: 'result', width, height, alpha: alpha.buffer }, [alpha.buffer]);
      return;
    }
  } catch (err) {
    postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};
