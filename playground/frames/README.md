# frames/ — 卡框/卡背管理目录

新增一套预制件的步骤（无需改页面代码）：

1. 在本目录建一个英文小写子目录，放入素材：
   - `ui.png` — 卡框层（整卡尺寸，窗口区域透明，必需）
   - `back.png` — 卡背（可选，缺省用 `back-default.png`）
2. 打开 `frames.js`，在 `frames` 数组加一条：
   `{ id: "目录名", name: "显示名", frame: "目录名/ui.png", back: "目录名/back.png" }`

说明：
- `frames.js` 是用 `<script>` 引入的注册表而不是 JSON，
  这样页面在 `file://` 直接打开也能读到（fetch JSON 会被 CORS 拦）。
- 卡框比例不必统一，页面会按 `ui.png` 的实际宽高比自适应卡片。
- 卡框上的文字目前是烙在图里的；"留空可编辑版"在 PRD P2。
