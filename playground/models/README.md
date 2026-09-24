# models/ · 本地抠图模型（M2 自动抠图）

RMBG-1.4 INT8 量化版（~44MB），transformers.js 浏览器端推理，全本地不出浏览器。
放在这里的原因：file:// 下 fetch 本地文件会被 CORS 拦死，模型必须随 http(s) 服务一起提供（PRD §6）。

## 目录结构

```
models/
└── RMBG-1.4/
    ├── config.json
    ├── preprocessor_config.json
    └── onnx/
        └── model_quantized.onnx   # ~44MB
```

## 手动放置（换机器/克隆仓库后）

```bash
cd playground/models/RMBG-1.4
curl -L -o onnx/model_quantized.onnx "https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx"
curl -L -o config.json "https://huggingface.co/briaai/RMBG-1.4/resolve/main/config.json"
curl -L -o preprocessor_config.json "https://huggingface.co/briaai/RMBG-1.4/resolve/main/preprocessor_config.json"
```

权重不入 git（见 .gitignore）。若改走 CDN，替换 `matting-worker.js`
里的 `env.allowRemoteModels = false` 与 `localModelPath` 逻辑即可。

`../vendor/`（transformers.js + onnxruntime wasm，~22MB）**随仓库走、可入 git**，
克隆后无需手动放置，只有本目录的权重需要按上面命令补。

## 注意

- 模型仅从本地 `./models/` 加载（worker 内 `env.allowRemoteModels = false`），不会外联。
- RMBG-1.4 许可为 bria 非商用协议，仅供个人 demo（与仓库 THIRD_PARTY_NOTICES 习惯一致）。
