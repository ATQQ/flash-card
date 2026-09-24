// PlayGround M2 · 预制素材 + 自定义上传 + 自动抠图 + WebGL 实机渲染（与介绍页活卡同款）
// 导出落位（M3）见 docs/playground-prd.md
(() => {
  const FRAMES = window.PLAYGROUND_FRAMES;
  const PRESETS = window.PLAYGROUND_PRESETS;
  const $ = (id) => document.getElementById(id);

  const card = $('card'), scene = $('scene'), glCanvas = $('gl');
  const imgBack = $('imgBack');
  const rows = { bg: $('rowBg'), char: $('rowChar'), frame: $('rowFrame'), back: $('rowBack') };
  const fileInput = $('fileAny');
  const sliders = {
    charScale: $('sCharScale'), charX: $('sCharX'), charY: $('sCharY'),
    bgScale: $('sBgScale'),
    frameScale: $('sFrameScale'), frameX: $('sFrameX'), frameY: $('sFrameY'),
    foil: $('sFoil'),
  };
  const defaults = { charScale: 1, charX: 0, charY: 0, bgScale: 1, frameScale: 1, frameX: 0, frameY: 0, foil: 0.55 };
  const state = {
    ...defaults,
    uploadKind: null,
    urls: { bg: null, char: null, frame: null }, // 当前合成用的三层素材
  };
  const DEF = 'darkmagiciangirl';

  // ---------- 通用：缩略图行 ----------
  function makeTile(row, { src, name, plus, title }) {
    const el = document.createElement('div');
    el.className = 'thumb' + (plus ? ' plus' : '');
    if (title) el.title = title;
    if (src) {
      el.innerHTML = `<img src="${src}" alt="" loading="lazy">` +
        (name ? `<span class="tname">${name}</span>` : '');
    }
    row.appendChild(el);
    return el;
  }
  function markOnly(row, el) {
    row.querySelectorAll('.thumb').forEach((t) => t.classList.toggle('on', t === el));
  }
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  // 已加载图片缓存：切素材时免重复解码，合成秒出
  const imgCache = new Map();
  function loadImageCached(url) {
    if (!imgCache.has(url)) imgCache.set(url, loadImage(url));
    return imgCache.get(url);
  }

  // ---------- 上传（+ 占位触发，新图追加到列表末尾） ----------
  function loadFile(file, cb) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { alert('仅支持 PNG / JPG / WebP'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 2048;
      const long = Math.max(img.naturalWidth, img.naturalHeight);
      if (long <= MAX) { cb(url); return; }
      const k = MAX / long;
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const mime = state.uploadKind === 'bg' && file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      c.toBlob((blob) => {
        URL.revokeObjectURL(url);
        cb(URL.createObjectURL(blob));
      }, mime, 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert('图片读取失败'); };
    img.src = url;
  }

  function addPlusTile(kind) {
    const tile = makeTile(rows[kind], { plus: true, title: '上传自定义素材' });
    tile.dataset.plus = '1';
    tile.addEventListener('click', () => {
      state.uploadKind = kind;
      fileInput.value = '';
      fileInput.click();
    });
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    const kind = state.uploadKind;
    if (!file || !kind) return;
    loadFile(file, (url) => {
      // 新图追加到列表末尾，不占据 + 的位置
      const tile = makeTile(rows[kind], { src: url, title: '自定义素材' });
      tile.addEventListener('click', () => selectCustom(kind, url, tile));
      selectCustom(kind, url, tile);
    });
  });

  function selectCustom(kind, url, tile) {
    if (kind === 'back') {
      imgBack.src = url;
    } else {
      state.urls[kind] = url;
      rebuildRenderer();
    }
    markOnly(rows[kind], tile);
    if (kind === 'char') showMatting(url, tile);
  }

  // ---------- M2 自动抠图：不透明角色图一键去背景 ----------
  const MATTING = window.PLAYGROUND_MATTING;
  const mat = {
    box: $('mattingBox'), btn: $('btnMatting'), status: $('mattingStatus'),
    bar: $('mattingBar'), check: $('mattingCheck'),
    chkBlack: $('chkBlack'), chkWhite: $('chkWhite'),
  };
  mat.barFill = mat.bar.querySelector('i');
  const matt = { origUrl: null, mattedUrl: null, tile: null, busy: false };

  function mattingResetUI() {
    mat.btn.textContent = '自动抠图';
    mat.btn.disabled = false;
    mat.status.hidden = true;
    mat.bar.hidden = true;
    mat.check.hidden = true;
    mat.barFill.style.width = '0';
  }
  function hideMatting() { mat.box.hidden = true; matt.origUrl = matt.mattedUrl = matt.tile = null; }

  // 选择角色素材后调用：透明图不显示抠图条；不透明图（jpg/无 alpha 的 png）显示
  async function showMatting(url, tile) {
    if (!MATTING || !MATTING.supported) { hideMatting(); return; }
    let hasAlpha = false;
    try {
      const img = await loadImageCached(url);
      const S = 256;
      const k = Math.min(1, S / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k));
      const h = Math.max(1, Math.round(img.naturalHeight * k));
      const c = mkCanvas(w, h);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      for (let i = 3; i < d.length; i += 4) { if (d[i] < 250) { hasAlpha = true; break; } }
    } catch (_) { hasAlpha = false; }
    if (hasAlpha) { hideMatting(); return; }
    matt.origUrl = url; matt.mattedUrl = null; matt.tile = tile;
    mattingResetUI();
    mat.box.hidden = false;
  }

  if (MATTING && MATTING.supported) {
    MATTING.onProgress(({ percent }) => {
      if (mat.bar.hidden) mat.bar.hidden = false;
      mat.barFill.style.width = Math.min(100, Math.max(0, percent)) + '%';
      mat.status.hidden = false;
      mat.status.textContent = '模型加载中（首次约 40MB，之后走缓存）…';
    });
  }

  mat.btn.addEventListener('click', async () => {
    // 已抠图 → 还原原图
    if (matt.mattedUrl) {
      state.urls.char = matt.origUrl;
      if (matt.tile) { const im = matt.tile.querySelector('img'); if (im) im.src = matt.origUrl; }
      matt.mattedUrl = null;
      mattingResetUI();
      rebuildRenderer();
      return;
    }
    if (matt.busy || !matt.origUrl || !MATTING || !MATTING.supported) return;
    matt.busy = true;
    mat.btn.disabled = true;
    try {
      mat.status.hidden = false;
      mat.status.textContent = '准备模型…';
      await MATTING.ensure();
      mat.bar.hidden = true;
      mat.status.textContent = '抠图中…';

      // 推理输入压长边 ≤1024（PRD §6）
      const img = await loadImageCached(matt.origUrl);
      const S = 1024;
      const k = Math.min(1, S / Math.max(img.naturalWidth, img.naturalHeight));
      const iw = Math.max(1, Math.round(img.naturalWidth * k));
      const ih = Math.max(1, Math.round(img.naturalHeight * k));
      const inC = mkCanvas(iw, ih);
      inC.getContext('2d').drawImage(img, 0, 0, iw, ih);
      const { alpha } = await MATTING.run(inC);

      // mask 画布（白 RGB + 灰度 alpha），放大回原尺寸做 destination-in
      const maskC = mkCanvas(iw, ih);
      const mctx = maskC.getContext('2d');
      const mid = mctx.createImageData(iw, ih);
      for (let i = 0, j = 0; j < alpha.length; i += 4, j++) {
        mid.data[i] = 255; mid.data[i + 1] = 255; mid.data[i + 2] = 255; mid.data[i + 3] = alpha[j];
      }
      mctx.putImageData(mid, 0, 0);
      const outC = mkCanvas(img.naturalWidth, img.naturalHeight);
      const octx = outC.getContext('2d');
      octx.drawImage(img, 0, 0);
      octx.globalCompositeOperation = 'destination-in';
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(maskC, 0, 0, outC.width, outC.height);

      // 黑白底自查图（沿用 alpha-inputs review 习惯）
      const chk = (bg) => {
        const c = mkCanvas(104, 140);
        const x = c.getContext('2d');
        x.fillStyle = bg; x.fillRect(0, 0, 104, 140);
        const s = Math.max(104 / outC.width, 140 / outC.height);
        x.drawImage(outC, (104 - outC.width * s) / 2, (140 - outC.height * s) / 2, outC.width * s, outC.height * s);
        return c.toDataURL('image/png');
      };
      mat.chkBlack.src = chk('#000');
      mat.chkWhite.src = chk('#fff');

      const blob = await new Promise((res, rej) => outC.toBlob((b) => b ? res(b) : rej(new Error('toBlob 失败')), 'image/png'));
      matt.mattedUrl = URL.createObjectURL(blob);
      state.urls.char = matt.mattedUrl;
      if (matt.tile) { const im = matt.tile.querySelector('img'); if (im) im.src = matt.mattedUrl; }
      mat.btn.disabled = false;
      mat.btn.textContent = '还原原图';
      mat.status.hidden = true;
      mat.check.hidden = false;
      rebuildRenderer();
    } catch (err) {
      mat.status.hidden = false;
      mat.status.textContent = '抠图失败：' + (err && err.message || err);
      mat.btn.disabled = false;
    } finally {
      matt.busy = false;
    }
  });

  // ---------- 预制绑定（+ 占位在行首） ----------
  addPlusTile('bg'); addPlusTile('char'); addPlusTile('frame'); addPlusTile('back');

  PRESETS.backgrounds.forEach((item) => {
    const el = makeTile(rows.bg, { src: `presets/${item.src}`, title: item.name });
    el.addEventListener('click', () => {
      state.urls.bg = `presets/${item.src}`;
      rebuildRenderer();
      markOnly(rows.bg, el);
    });
  });
  PRESETS.characters.forEach((item) => {
    const el = makeTile(rows.char, { src: `presets/${item.src}`, name: item.name, title: item.name });
    el.addEventListener('click', () => {
      state.urls.char = `presets/${item.src}`;
      rebuildRenderer();
      markOnly(rows.char, el);
      hideMatting(); // 预制角色自带 alpha，无需抠图
    });
  });
  PRESETS.backs.forEach((item) => {
    const el = makeTile(rows.back, { src: `presets/${item.src}`, title: item.name });
    el.addEventListener('click', () => {
      imgBack.src = `presets/${item.src}`;
      markOnly(rows.back, el);
    });
  });
  FRAMES.frames.forEach((f) => {
    const el = makeTile(rows.frame, { src: `frames/${f.frame}`, title: f.name });
    el.addEventListener('click', () => {
      state.urls.frame = `frames/${f.frame}`;
      rebuildRenderer();
      markOnly(rows.frame, el);
    });
  });

  // ---------- 图层合成：统一尺寸画布 + 结构线生成 ----------
  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // 角色 alpha 包围盒（降采样扫描定位到原尺寸）
  // S=512 + 阈值>5：S=256/阈值>10 会把角色下沿细结构丢掉（实测黑魔导女孩 y1: 660/810）
  function alphaBBox(img) {
    const S = 512;
    const k = Math.min(1, S / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = mkCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    let d;
    try { d = ctx.getImageData(0, 0, w, h).data; } catch (_) { return { x0: 0, y0: 0, x1: img.naturalWidth, y1: img.naturalHeight }; }
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 5) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return { x0: 0, y0: 0, x1: img.naturalWidth, y1: img.naturalHeight };
    const inv = 1 / k;
    return {
      x0: Math.max(0, Math.floor(x0 * inv) - 2),
      y0: Math.max(0, Math.floor(y0 * inv) - 2),
      x1: Math.min(img.naturalWidth, Math.ceil((x1 + 1) * inv) + 2),
      y1: Math.min(img.naturalHeight, Math.ceil((y1 + 1) * inv) + 2),
    };
  }

  // 结构线 = 角色 alpha 边缘（轮廓辉光用）
  function makeStructure(charCanvas) {
    const w = Math.max(2, Math.round(charCanvas.width / 2));
    const h = Math.max(2, Math.round(charCanvas.height / 2));
    const c = mkCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(charCanvas, 0, 0, w, h);
    let d;
    try { d = ctx.getImageData(0, 0, w, h).data; } catch (_) { return c; }
    const o = ctx.createImageData(w, h);
    const A = (x, y) => d[(Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 4 + 3];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const gx = A(x + 1, y) - A(x - 1, y);
        const gy = A(x, y + 1) - A(x, y - 1);
        const v = Math.min(255, Math.hypot(gx, gy) * 1.6);
        const i = (y * w + x) * 4;
        o.data[i] = 255; o.data[i + 1] = 255; o.data[i + 2] = 255; o.data[i + 3] = v;
      }
    }
    ctx.putImageData(o, 0, 0);
    return c;
  }

  // 合成方式与介绍页活卡（如 holo-card/darkmagiciangirl/job/index.html）一致：
  // 三层全部对齐到统一卡面尺寸，卡片比例恒定，
  // 角色按 alpha 包围盒等比放入卡面居中；缩放/偏移微调交给 shader 的 charScale/charOff。
  const CARD_W = 1280;
  const CHAR_FIT = 0.78; // 角色包围盒目标占卡面比例（对齐介绍页成卡的观感）

  async function composeLayers() {
    const [bgI, chI, frI] = await Promise.all([
      loadImageCached(state.urls.bg), loadImageCached(state.urls.char), loadImageCached(state.urls.frame),
    ]);

    // 卡面尺寸 = 卡框的不透明区域（裁掉四周透明边），
    // 保证右侧全屏预览时卡框紧贴边缘、渲染尺寸就是卡框尺寸。
    const fb = alphaBBox(frI);
    const fw = Math.max(1, fb.x1 - fb.x0), fh = Math.max(1, fb.y1 - fb.y0);
    const outW = CARD_W, outH = Math.round(fh * CARD_W / fw);

    // 角色：等比放进卡面（以 alpha 包围盒为界），水平垂直居中
    const bb = alphaBBox(chI);
    const bw = Math.max(1, bb.x1 - bb.x0), bh = Math.max(1, bb.y1 - bb.y0);
    const fit = Math.min(outW * CHAR_FIT / bw, outH * CHAR_FIT / bh);
    const dw = bw * fit, dh = bh * fit;
    const cc = mkCanvas(outW, outH);
    cc.getContext('2d').drawImage(chI, bb.x0, bb.y0, bw, bh, (outW - dw) / 2, (outH - dh) / 2, dw, dh);

    const bc = mkCanvas(outW, outH);
    {
      const ctx = bc.getContext('2d');
      const s = Math.max(outW / bgI.naturalWidth, outH / bgI.naturalHeight);
      const dw2 = bgI.naturalWidth * s, dh2 = bgI.naturalHeight * s;
      ctx.drawImage(bgI, (outW - dw2) / 2, (outH - dh2) / 2, dw2, dh2);
    }

    const fc = mkCanvas(outW, outH);
    fc.getContext('2d').drawImage(frI, fb.x0, fb.y0, fw, fh, 0, 0, outW, outH);

    return { cc, bc, fc, st: makeStructure(cc), aspect: outH / outW };
  }

  // ---------- WebGL 渲染器管理 ----------
  let renderer = null, buildSeq = 0;
  async function rebuildRenderer() {
    if (!state.urls.bg || !state.urls.char || !state.urls.frame) return;
    const seq = ++buildSeq;
    let layers;
    try { layers = await composeLayers(); } catch (_) { return; }
    if (seq !== buildSeq) return; // 已被更新的构建覆盖
    card.style.aspectRatio = String(1 / layers.aspect); // CSS width/height
    try {
      const next = await globalThis.HOLO_CREATE_RENDERER(glCanvas, {
        character: layers.cc, background: layers.bc, ui: layers.fc, structure: layers.st,
      });
      if (seq !== buildSeq) { next.dispose(); return; } // 连点时丢弃过期构建
      // 新 renderer 建好再释放旧的，避免中途失败导致画面空白
      if (renderer) renderer.dispose();
      renderer = next;
      dirty = true; // 立即重绘一帧，不等指针移动
    } catch (e) {
      // 保留旧 renderer；新构建失败时画面维持上一次可用状态
    }
  }

  // ---------- 微调 ----------
  let dirty = true; // 滑杆改动置位，渲染循环消费
  function bindSlider(key, fmt) {
    const el = sliders[key], out = el.nextElementSibling;
    el.addEventListener('input', () => { state[key] = +el.value; out.textContent = fmt(+el.value); dirty = true; });
  }
  bindSlider('charScale', (v) => v.toFixed(2));
  bindSlider('charX', (v) => Math.round(v));
  bindSlider('charY', (v) => Math.round(v));
  bindSlider('bgScale', (v) => v.toFixed(2));
  bindSlider('frameScale', (v) => v.toFixed(2));
  bindSlider('frameX', (v) => Math.round(v));
  bindSlider('frameY', (v) => Math.round(v));
  bindSlider('foil', (v) => v.toFixed(2));

  $('btnReset').addEventListener('click', () => {
    Object.assign(state, defaults);
    Object.entries(sliders).forEach(([k, el]) => {
      el.value = defaults[k];
      el.nextElementSibling.textContent = /[XY]$/.test(k)
        ? Math.round(defaults[k]) : (+defaults[k]).toFixed(2);
    });
    dirty = true; // 重置后立即重绘
  });

  // ---------- 交互：拖拽 360° 旋转 / 悬停视差 / 轻点翻面（与介绍页活卡 job/index.html 一致） ----------
  const faceFront = card.querySelector('.face.front');
  const faceBack = card.querySelector('.face.back');
  const m = {
    x: -5, y: -12, tx: -5, ty: -12, base: 0,
    down: false, px: 0, py: 0, moved: false, pointer: null, startX: 0, startY: 0,
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flip = () => { m.base += 180; m.tx = 0; m.ty = m.base; };

  card.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      if (e.key === 'ArrowLeft') m.ty -= 8;
      if (e.key === 'ArrowRight') m.ty += 8;
      if (e.key === 'ArrowUp') m.tx = Math.min(45, m.tx + 8);
      if (e.key === 'ArrowDown') m.tx = Math.max(-45, m.tx - 8);
    }
  });
  card.addEventListener('dragstart', (e) => e.preventDefault()); // 禁止图片原生拖拽
  card.addEventListener('pointerdown', (e) => {
    if (m.pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    m.pointer = e.pointerId;
    m.startX = e.clientX; m.startY = e.clientY;
    m.down = true; m.px = e.clientX; m.py = e.clientY; m.moved = false;
    card.setPointerCapture(e.pointerId);
  });
  card.addEventListener('pointermove', (e) => {
    if (m.down && m.pointer === e.pointerId) {
      const dx = e.clientX - m.px, dy = e.clientY - m.py;
      if (Math.hypot(e.clientX - m.startX, e.clientY - m.startY) > 5) m.moved = true;
      m.ty += dx * 0.62;                                // 偏航自由旋转，可转任意圈
      m.tx = Math.max(-50, Math.min(50, m.tx - dy * 0.3));
      m.px = e.clientX; m.py = e.clientY;
    } else if (!m.down && e.pointerType === 'mouse') {
      m.tx = (-(e.clientY - innerHeight / 2) / innerHeight) * 30;
      m.ty = m.base + ((e.clientX - innerWidth / 2) / innerWidth) * 40;
    }
  });
  card.addEventListener('pointerup', (e) => {
    if (m.pointer !== e.pointerId) return;
    m.pointer = null; m.down = false;
    if (card.hasPointerCapture(e.pointerId)) card.releasePointerCapture(e.pointerId);
    if (!m.moved) flip();                               // 轻点 = 翻面
    else m.base = Math.round(m.ty / 180) * 180;         // 拖拽松手吸附最近 180°，任意角度停留
  });
  const cancelDrag = () => { m.pointer = null; m.down = false; m.base = Math.round(m.ty / 180) * 180; };
  card.addEventListener('pointercancel', cancelDrag);
  card.addEventListener('lostpointercapture', () => { if (m.down) cancelDrag(); });
  card.addEventListener('pointerleave', () => {
    if (!m.down) { m.tx = 0; m.ty = m.base; }
  });

  $('btnFlip').addEventListener('click', flip);

  // 渲染循环：卡片 CSS 3D 旋转 + 按转角显隐正/背面；depth=0 使内容全部裁进卡框
  let lastX = 999, lastY = 999;
  (function frame() {
    const ease = reduced ? 1 : 0.115;
    m.x += (m.tx - m.x) * ease;
    m.y += (m.ty - m.y) * ease;
    card.style.transform = `rotateX(${m.x}deg) rotateY(${m.y}deg)`;
    const visible =
      Math.cos((m.y * Math.PI) / 180) * Math.cos((m.x * Math.PI) / 180) > 0.001;
    faceFront.style.visibility = visible ? 'visible' : 'hidden';
    faceBack.style.visibility = visible ? 'hidden' : 'visible';
    if (
      !document.hidden && visible && renderer &&
      (dirty || Math.abs(m.x - lastX) > 0.015 || Math.abs(m.y - lastY) > 0.015)
    ) {
      renderer.draw(m.x, m.y, state.foil, 0, 0.15 * state.foil, {
        charScale: state.charScale,
        charX: (state.charX / 100) * 0.6,
        charY: (state.charY / 100) * 0.6,
        bgScale: state.bgScale,
        frameScale: state.frameScale,
        frameX: (state.frameX / 100) * 0.6,
        frameY: (state.frameY / 100) * 0.6,
      });
      dirty = false;
      lastX = m.x; lastY = m.y;
    }
    requestAnimationFrame(frame);
  })();

  // ---------- 启动：默认整套黑魔导女孩 + 经典卡背 ----------
  const bgIdx = PRESETS.backgrounds.findIndex((x) => x.id === DEF);
  if (bgIdx >= 0) {
    state.urls.bg = `presets/${PRESETS.backgrounds[bgIdx].src}`;
    markOnly(rows.bg, rows.bg.children[1 + bgIdx]);
  }
  const chIdx = PRESETS.characters.findIndex((x) => x.id === DEF);
  if (chIdx >= 0) {
    state.urls.char = `presets/${PRESETS.characters[chIdx].src}`;
    markOnly(rows.char, rows.char.children[1 + chIdx]);
  }
  const frIdx = FRAMES.frames.findIndex((x) => x.id === DEF);
  if (frIdx >= 0) {
    state.urls.frame = `frames/${FRAMES.frames[frIdx].frame}`;
    markOnly(rows.frame, rows.frame.children[1 + frIdx]);
  }
  if (PRESETS.backs.length) {
    imgBack.src = `presets/${PRESETS.backs[0].src}`;
    markOnly(rows.back, rows.back.children[1]); // back 行 + 占位后第一套
  }
  rebuildRenderer();
})();
