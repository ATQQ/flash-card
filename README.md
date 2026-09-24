# 闪卡实验场

纯静态的闪卡交互 Demo 集合：首页是卡册，每张卡是独立子项目。另有 PlayGround，可自带素材合成一张可拖、可翻的全息卡。

代码按 **MIT** 授权，见 [`LICENSE`](./LICENSE)。**MIT 只覆盖本仓库的代码与文档，不授予任何第三方角色、卡面、商标或模型权重的权利。** 素材与依赖说明见 [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)。

## 本地打开

```bash
# 推荐：任意静态服务，介绍页 iframe / PlayGround 抠图需要 http(s)
npx serve .
```

首页和各卡的 `job/index.html` 也可以直接用 `file://` 打开。PlayGround 的自动抠图在 `file://` 下会隐藏（模型无法跨源加载）。

克隆后展示图已有 WebP；PNG/JPG 源文件仍保留在仓库。PlayGround 抠图：本机可放
`playground/models/RMBG-1.4`（不入 git 的权重）；线上点「自动抠图」才从 CDN 拉。
CDN 地址与上传说明见 [`playground/models/README.md`](./playground/models/README.md)。

## 目录

| 路径 | 说明 |
|---|---|
| `index.html` | 卡册首页（静态缩略，无 canvas / iframe 循环） |
| `holo-card/<name>/` | 单卡介绍页 + 拆层图 |
| `holo-card/<name>/job/` | 可交互活卡（引用 `assets/`，约 30KB） |
| `playground/` | 自助合成工作台 |
| `SKILLS/holo-card-lite/` | 生成用 SKILL（见下） |
| `docs/playground-prd.md` | PlayGround PRD |
| `AGENTS.md` | 接入新卡的仓库约定 |

## 使用的 Agent Skill

本仓库闪卡多由下列 Skill 生成（介绍页 RECIPE 里也有对应链接）：

| Skill | 仓库 | 本仓库中的用法 |
|---|---|---|
| **Holo Card** | [LerSent001/holo-card](https://github.com/LerSent001/holo-card) | 机械暴龙兽、迪路兽、黑魔导女孩等分层全息卡 |
| **Holo Card Lite** | 本仓库 [`SKILLS/holo-card-lite/`](./SKILLS/holo-card-lite/)（fork 自上一行） | 大元素使拉克丝；默认输出轻量相对路径 HTML（~30KB），避免原版 10MB+ base64 内联；需要单文件时再加 `--inline` |
| **RuiC Card Skill** | [HRuiCcc/RuiC-card-skill](https://github.com/HRuiCcc/RuiC-card-skill) | 魔术师的配合（3D 全息） |
| **Holo Card Studio** | [EverettFish/holo-card-studio](https://github.com/EverettFish/holo-card-studio) | 龙骑士黑魔术少女（3D 全息） |

接入新卡时可用 `/Holo Card` / `/Holo Card Lite` / `/RuiC Card` 等提示词句式；约定见 [`AGENTS.md`](./AGENTS.md)。

## 免责

本仓库是个人学习 / 交互 Demo，**非官方、非商业**。
