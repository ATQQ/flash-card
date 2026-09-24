// PlayGround 预制素材注册表
// 新增预制背景/角色/卡背：在对应子目录放 webp（或 png），然后在下面数组加一条即可，页面无需改动。
window.PLAYGROUND_PRESETS = {
  backgrounds: [
    { id: "darkmagiciangirl", name: "黑魔导女孩", src: "backgrounds/darkmagiciangirl.webp" },
    { id: "metalgreymon", name: "机械暴龙兽", src: "backgrounds/metalgreymon.webp" },
    { id: "tailmon", name: "迪路兽", src: "backgrounds/tailmon.webp" },
    { id: "darkmagiciangirl-dragonknight", name: "龙骑士", src: "backgrounds/darkmagiciangirl-dragonknight.webp" },
  ],
  characters: [
    { id: "darkmagiciangirl", name: "黑魔导女孩", src: "characters/darkmagiciangirl.webp" },
    { id: "metalgreymon", name: "机械暴龙兽", src: "characters/metalgreymon.webp" },
    { id: "tailmon", name: "迪路兽", src: "characters/tailmon.webp" },
    { id: "darkmagiciangirl-dragonknight", name: "龙骑士", src: "characters/darkmagiciangirl-dragonknight.webp" },
  ],
  backs: [
    { id: "back-classic", name: "经典", src: "backs/back-classic.webp" },
    { id: "back-mgreymon", name: "暴龙兽", src: "backs/back-mgreymon.webp" },
  ],
};
