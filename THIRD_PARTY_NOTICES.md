# Third-party notices

本仓库代码按 MIT 授权。下列素材与依赖**不在** MIT 范围内，各自适用原许可。

## 角色与卡面

收录卡是粉丝向交互 Demo，不是官方产品。角色、卡名、卡面构图与商标属于原权利人，例如：

- 游戏王 / Yu-Gi-Oh!（Konami）：黑魔导女孩、龙骑士黑魔术少女、魔术师的配合
- 数码宝贝 / Digimon（Bandai / Toei）：机械暴龙兽、迪路兽
- 英雄联盟 / League of Legends（Riot Games）：大元素使拉克丝；卡背为粉丝向徽记设计，非官方卡背

`holo-card/magician-combo/14909.webp` 是原卡「魔术师的配合」的参考图，不是本仓库原创。其余展示图多为用户提供参考后的 AI 重绘或分层拆解，**仍可能落入原作衍生范围**。MIT 不授予复制、再分发或商用这些图像的权利。

各卡 `job/THIRD_PARTY_NOTICES.md`（如有）只说明该次生成用的卡背参考，不改变上述边界。

## PlayGround 抠图模型

RMBG-1.4（Bria AI）权重默认不入 git（~44MB），本地目录 `playground/models/RMBG-1.4/` 请保留。
线上点「自动抠图」时从 CDN 拉取。上传路径与改地址说明见 `playground/models/README.md`。
许可为 Bria 非商用协议；商用前请核对 [Bria RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4)。

## 随仓库分发的前端依赖

| 路径 | 来源 | 许可 |
|---|---|---|
| `playground/vendor/transformers.min.js` | [@huggingface/transformers](https://github.com/huggingface/transformers.js) | Apache-2.0 |
| `playground/vendor/ort-wasm-simd-threaded.jsep.*` | [onnxruntime-web](https://github.com/microsoft/onnxruntime) | MIT |
| `SKILLS/holo-card-lite/` | fork 自 [Holo Card](https://github.com/LerSent001/holo-card) | 见上游仓库 |

`holo-card/*/web/node_modules/`（Three.js 等）已在 `.gitignore` 中排除，本地安装时沿用各包自带 LICENSE。
