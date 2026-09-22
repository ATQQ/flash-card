# AGENTS.md — 闪卡实验场

一个闪卡交互 Demo 的集合仓库。首页是"卡册"，每个 demo 是独立的子项目。
本文档沉淀本项目的工作经验，供后续接入新卡时复用。

## 目录结构

```
flash-card-demos/
├── index.html                  # 首页（纯静态，零依赖、零构建）
├── AGENTS.md                   # 本文档
├── docs/playground-prd.md      # PlayGround PRD（v0.2 已对齐）
├── playground/                 # 闪卡工作台（用户自带素材，M1 已上线）
│   ├── index.html              # 上传背景/角色 + 预制卡框 + CSS 分层预览
│   ├── playground.js           # 上传压缩/层微调/视差/翻面
│   ├── frames/                 # 卡框/卡背管理目录，新增见 frames/README.md
│   └── presets/                # 预制背景/角色库，新增见 presets.js 头注释
├── SKILLS/holo-card-lite/      # 本项目 fork 的 Holo Card SKILL（默认外部引用图片）
└── holo-card/                  # 按工具/系列分组
    ├── metalgreymon/           # 一张卡一个目录，英文小写命名
    │   ├── index.html          # 介绍页（必须有，首页只链介绍页）
    │   ├── source.png          # 原始卡面图（完整卡面，≈2:3）
    │   ├── character.png       # 角色层（供介绍页/首页引用）
    │   ├── background.png      # 场景层
    │   ├── ui.png              # 卡框文字层
    │   ├── structure.png       # 深度结构线
    │   ├── example.png         # 生成时用的参考图（如有）
    │   └── job/                # Holo Card 工作区，原样保留勿整理
    │       ├── index.html      # 可交互 demo（图片引用外部文件，仅 ~30KB）
    │       ├── assets/         # 正式四层拆分图（transparent RGBA）
    │       ├── raw/  masks/  alpha-inputs/
    │       ├── task.json  prompts.json  provenance.json
    │       ├── original.png  source.png  card.zip
    │       └── THIRD_PARTY_NOTICES.md
    └── tailmon/                # 同上结构
```

**命名规范**：`holo-card/<角色英文小写>/`，如 `metalgreymon`、`tailmon`。
新卡按此结构落位；`job/` 内的中间产物（`*_raw.png`、`*_mask.png`、`*_whitecheck.png`）
保留在 job 里，不要挪到上层。

## 新增一张 Holo Card 的完整流程

1. **生成**：优先用本仓库 fork 的 **holo-card-lite**（`/Holo Card Lite 给我做一张XX的闪卡`，
   或直接指定 `SKILLS/holo-card-lite`），它默认输出引用 `assets/` 的轻量 HTML（~30KB），从源头避免 base64 内联。
   仅当需要单文件分享时对 `assemble` 传 `--inline`。原版 [Holo Card](https://github.com/LerSent001/holo-card)
   生成的仍是 10MB+ 内联 HTML，需按"已知经验"去内联。
   提示词句式：`/Holo Card 给我做一张XX的闪卡`；
   如需复刻某张卡面的版式（金边、招式面板、数值栏等），附上参考图（存为 `example.png`）。
2. **落位**：产物按上述目录结构摆放；`job/` 原样移入。
3. **介绍页**：复制任意现有介绍页（metalgreymon 或 tailmon）改内容——
   实机 iframe 预览、RECIPE（工具 + 提示词 + 参考图）、四道工序、五张拆层图鉴。
   右上角徽标编号 +1。
4. **首页接入**（三处，缺一不可）：
   - `heroCards` 数组加一条（`no/name/en/dir/url`），右上角随机翻转卡即纳入随机池；
     素材用 `<dir>/background.png|character.png|ui.png` 三层
   - 收录架加一段 `<a class="mini-card">`（图用 `source.png` 整卡原图）
   - 计数徽标与「DEMO 在列」由 JS 按 DOM 自动统计，无需手改
5. **验证**：打开首页确认随机卡、卡册、计数三处都更新。

## 首页架构约定（性能红线）

- **首页零 Canvas、零 iframe、零 JS 动画循环**。可交互的活卡只出现在各介绍页里。
- 右上角 hero 卡 = 三层静态图（bg/character/ui）叠放的 CSS 视差，
  指针驱动 transform，事件驱动，无渲染循环；点击翻面看卡背介绍。
- 收录架 mini-card = 单张静态图 + hover 浮起/流光，不可交互翻面。
- 图片全部 `loading="lazy"`（hero 三层除外）。
- 新增互动 demo 时沿用此模型：首页静态缩略，点进去才加载重的东西。

## 设计系统（沿用，勿另起炉灶）

- **色板**：底 `#0E0B21`（深紫夜空，非纯黑）、面板 `#171233`、文字 `#EFEBFF`、
  弱文字 `#9B93C4`；全息箔渐变 `#43E8D8 → #8B5CFF → #FF5CA8 → #FFC15E`
  （青→紫→粉→琥珀，变量的 `--foil`，卡牌世界的全息闪卡质感，是全站签名元素）
- **字体**：中文展示 ZCOOL QingKe HuangYou、拉丁展示 Unbounded、
  正文 Noto Sans SC、编号/代码 JetBrains Mono（Google Fonts，一条 link 引入）
- **氛围**：固定的三团 radial 底光 + 微网格（`.aurora`），每页复制
- **动效**：入场 `.rise .d1~.d4` 上浮编排；hover 只做 translateY + 发光；
  `prefers-reduced-motion` 全部关停
- **无障碍**：交互卡可 Tab 聚焦，`--cyan` 色焦点环；图片有 alt

## 文案语气

- 中文为主，编号/标签用英文 mono 大写（NO.007 / HOLO / LIVE）
- 卡片背面文字保留"问答"的闪卡语感；不写营销腔，用具体的动作描述
  （"拖动它，光会贴着轮廓流过去"而非"超炫酷 3D 效果"）
- 诚实计数：占位、待开发的东西不展示在首页

## 已知经验

- **`job/index.html` 不要用 base64 内联图片**：5 张图全内联会把 HTML 撑到 10MB+，
  Live Server（http://127.0.0.1:5500）对这种文件响应永久挂死，iframe 只会白屏（file:// 反而正常）。
  已把 metalgreymon / tailmon 都改为引用外部文件：四层用 `assets/*.png`，卡背用 `assets/back.png`（tailmon 原本没落盘，已从内联数据解码补出），HTML 降到 ~30KB。
  `renderer.js:135` 用 `image.src = assets[name]` 加载，data URI 和相对路径通吃，两种访问方式都正常。
- **源头已解决**：`SKILLS/holo-card-lite/`（软链在 `.user_skills/holo-card-lite`）fork 自 holo-card，
  `scripts/native.py` 的 `html_document()` 默认把四层 + 卡背写成相对路径（`assets/*.png`），
  `assemble` 自动把 `back.png` 落盘到 `assets/` 并纳入 zip；`--inline` 保留原 base64 行为。
  **交付时直接给 `job/index.html` 的文件路径（file:// 打开即可）**，无需起本地服务；
  只有在嵌入介绍页 iframe / 手机预览时才需要 http(s)，且必须整目录一起提供。
  原版 holo-card 新生成的 `job/index.html` 仍默认内联，接入前需按上述方式去内联
  （替换前先做字节级一致性校验；原文件备份为 `index.html.bak`）
- `job/assets/*.png` 是对齐好的同尺寸分层图（角色层含 alpha），
  可直接叠放做 CSS 视差；上层目录的同名 png 是供介绍页展示的副本
- 抠图质检看 `alpha-inputs/**/*-review-black/white.png`（黑白底对照），有残留再看
- `task.json` / `provenance.json` 记录每层的生成与修复过程，介绍页可引用但不必展示细节
- source 图普遍 2MB+，首页只用一次；介绍页拆层图用 `object-fit: cover` 缩到卡片大小即可
