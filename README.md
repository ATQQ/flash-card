# 闪卡实验场

纯静态的闪卡交互 Demo 集合：首页是卡册，每张卡是独立子项目。另有 PlayGround，可自带素材合成一张可拖、可翻的全息卡。

代码按 **MIT** 授权，见 [`LICENSE`](./LICENSE)。**MIT 只覆盖本仓库的代码与文档，不授予任何第三方角色、卡面、商标或模型权重的权利。** 素材与依赖说明见 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)。

## 本地打开

```bash
# 推荐：任意静态服务，介绍页 iframe / PlayGround 抠图需要 http(s)
npx serve .
```

首页和各卡的 `job/index.html` 也可以直接用 `file://` 打开。PlayGround 的自动抠图在 `file://` 下会隐藏（模型无法跨源加载）。

克隆后若要用 PlayGround 抠图，需按 [`playground/models/README.md`](./playground/models/README.md) 自行下载 RMBG-1.4 权重（约 44MB，不进 git）。

## 目录

| 路径 | 说明 |
|---|---|
| `index.html` | 卡册首页（静态缩略，无 canvas / iframe 循环） |
| `holo-card/<name>/` | 单卡介绍页 + 拆层图 |
| `holo-card/<name>/job/` | 可交互活卡（引用 `assets/`，约 30KB） |
| `playground/` | 自助合成工作台 |
| `SKILLS/holo-card-lite/` | 生成用 SKILL（默认外部引用图片） |
| `docs/playground-prd.md` | PlayGround 需求记录 |
| `AGENTS.md` | 接入新卡的仓库约定 |

## 免责

本仓库是个人学习 / 交互 Demo，**非官方、非商业**。
