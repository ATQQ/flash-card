# models/ · 抠图模型（M2）

RMBG-1.4 INT8（~44MB）。**打开 PlayGround 不会下载**；点「自动抠图」才加载。

## 本地文件（请保留）

```
playground/models/RMBG-1.4/
├── config.json
├── preprocessor_config.json
└── onnx/
    └── model_quantized.onnx   # ~44MB，不入 git，本机保留
```

开发时有本地文件就走本地；线上部署包不带权重，走 CDN。

## CDN 改哪里

文件：`playground/matting-worker.js` 顶部常量：

```js
const MODEL_CDN = 'https://cdn.upyun.sugarat.top/web-static/models/';
```

## 上传到又拍云什么

把本机整个 `playground/models/RMBG-1.4/` 上传到：

```
https://cdn.upyun.sugarat.top/web-static/models/RMBG-1.4/
```

对应对象存储路径（前缀 `web-static` 下）：

```
models/RMBG-1.4/config.json
models/RMBG-1.4/preprocessor_config.json
models/RMBG-1.4/onnx/model_quantized.onnx
```

上传后应能直接打开：

`https://cdn.upyun.sugarat.top/web-static/models/RMBG-1.4/config.json`

## 补本地权重（换机器）

```bash
mkdir -p playground/models/RMBG-1.4/onnx
cd playground/models/RMBG-1.4
curl -L -o onnx/model_quantized.onnx "https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx"
curl -L -o config.json "https://huggingface.co/briaai/RMBG-1.4/resolve/main/config.json"
curl -L -o preprocessor_config.json "https://huggingface.co/briaai/RMBG-1.4/resolve/main/preprocessor_config.json"
```

## 许可

RMBG-1.4 为 Bria 非商用协议，仅供个人 / Demo。
