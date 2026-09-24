// M2 自动抠图 · 主线程管理（惰性 Worker + 进度转发）
// 用法：
//   PLAYGROUND_MATTING.supported             // file:// 下为 false（worker/CORS 限制，见 PRD §6）
//   PLAYGROUND_MATTING.onProgress(cb)        // cb({ percent, file }) 模型加载进度
//   await PLAYGROUND_MATTING.run(canvas)     // 传长边 ≤1024 的 canvas，返回同尺寸灰度 mask Uint8ClampedArray
(() => {
  const supported = location.protocol !== 'file:';
  let worker = null;
  let readyPromise = null;
  let progressCb = null;
  let lastError = null;

  function onProgress(cb) { progressCb = cb; }

  function getWorker() {
    if (worker) return worker;
    worker = new Worker('matting-worker.js', { type: 'module' });
    worker.addEventListener('message', (e) => {
      const m = e.data;
      if (m.type === 'progress') {
        if (progressCb) progressCb({ percent: m.progress, file: m.file });
      } else if (m.type === 'error') {
        lastError = m.message;
        if (readyPromise) {
          const p = readyPromise;
          readyPromise = null;
          p.reject(new Error(m.message));
        }
      }
    });
    worker.addEventListener('error', (e) => {
      lastError = e.message || 'worker 加载失败';
      if (readyPromise) {
        const p = readyPromise;
        readyPromise = null;
        p.reject(new Error(lastError));
      }
    });
    return worker;
  }

  // 预热：下载/加载模型（可提前调用，也可等首次 run）
  function ensure() {
    if (!supported) return Promise.reject(new Error('file:// 下不可用，请用 http(s) 打开'));
    if (!readyPromise) {
      readyPromise = new Promise((resolve, reject) => {
        const w = getWorker();
        const onMsg = (e) => {
          const m = e.data;
          if (m.type === 'ready') { w.removeEventListener('message', onMsg); resolve(); }
          else if (m.type === 'error') { w.removeEventListener('message', onMsg); reject(new Error(m.message)); }
        };
        w.addEventListener('message', onMsg);
        w.postMessage({ type: 'load' });
      });
      readyPromise.catch(() => { readyPromise = null; }); // 失败后允许重试
    }
    return readyPromise;
  }

  // canvas：长边 ≤1024 的 RGBA 画布；resolve → { width, height, alpha }
  async function run(canvas) {
    await ensure();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const w = worker;
    return new Promise((resolve, reject) => {
      const onMsg = (e) => {
        const m = e.data;
        if (m.type === 'result') {
          w.removeEventListener('message', onMsg);
          resolve({ width: m.width, height: m.height, alpha: new Uint8ClampedArray(m.alpha) });
        } else if (m.type === 'error') {
          w.removeEventListener('message', onMsg);
          reject(new Error(m.message));
        }
      };
      w.addEventListener('message', onMsg);
      w.postMessage(
        { type: 'run', width: data.width, height: data.height, rgba: data.data.buffer },
        [data.data.buffer],
      );
    });
  }

  window.PLAYGROUND_MATTING = {
    supported,
    get lastError() { return lastError; },
    onProgress,
    ensure,
    run,
  };
})();
