// PlayGround 预制件注册表
// 新增卡框：在 frames/ 下建子目录放入 ui.png（可选 back.png），
// 然后在下面 frames 数组加一条即可，页面无需改动。
// back 不填则使用 defaultBack。
window.PLAYGROUND_FRAMES = {
  defaultBack: "back-default.png",
  frames: [
    { id: "darkmagiciangirl", name: "黑魔导女孩", frame: "darkmagiciangirl/ui.png", back: "darkmagiciangirl/back.png" },
    { id: "metalgreymon", name: "机械暴龙兽", frame: "metalgreymon/ui.png" },
    { id: "tailmon", name: "迪路兽", frame: "tailmon/ui.png" },
  ],
};
