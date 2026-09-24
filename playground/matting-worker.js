// M2 自动抠图 · Worker 推理（RMBG-1.4 INT8 量化 ~40MB，transformers.js）
// 模型文件在 ./models/RMBG-1.4/（见 models/README.md），仅本地加载，不出浏览器。
// 协议：
//   in  { type: 'load' }
//   in  { type: 'run', width, height, rgba: ArrayBuffer }   // 长边 ≤1024 的像素
//   out { type: 'progress', file, loaded, total, progress } // 模型下载/加载进度
//   out { type: 'ready' }
//   out { type: 'result', width, height, alpha: ArrayBuffer } // 灰度 mask（0-255），与输入同尺寸
//   out { type: 'error', message }
import {
  AutoModel, AutoProcessor, RawImage, env,
} from './vendor/transformers.min.js';

env.allowLocalModels = true;
env.allowRemoteModels = false; // 模型只从本地 ./models/ 读，杜绝意外外联
env.localModelPath = new URL('./models/', import.meta.url).href;
env.backends.onnx.wasm.wasmPaths = new URL('./vendor/', import.meta.url).href; // ort wasm 也走本地

const MODEL_ID = 'RMBG-1.4';
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

async function ensure() {
  if (model && processor) return;
  // RMBG-1.4 没有标准 transformers 配置，按官方配方内联 processor 参数（1024×1024，mean .5 / std 1）
  model = await AutoModel.from_pretrained(MODEL_ID, {
    dtype: 'q8', // → onnx/model_quantized.onnx
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
      // RMBG-1.4 的 ONNX 输入名是 "input"（非 transformers 默认的 pixel_values），动态取 session 首个输入名兜底
      const session = model.session || (model.sessions && model.sessions.model);
      const inName = (session && session.inputNames && session.inputNames[0]) || 'input';
      const output = await model({ [inName]: pixel_values });
      // v3 的模型返回按输出名组织的对象（如 { output: Tensor }），取第一个张量即可
      const tensor = output[0] || output.output || output[Object.keys(output)[0]];
      // RawImage.fromTensor 要 CHW 三维；模型输出是 NCHW 四维，先去掉 batch 维
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
