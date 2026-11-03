import type { Camo, Weapon } from "../data/catalog";

export const levelCamo: Camo = {
  id: "military-camo-1",
  name: "Military Camo 1",
  nameZh: "军事迷彩 1",
  group: "military",
  image: null,
  challenge: { en: "Reach Weapon Level 10", zh: "武器等级达到 10 级", target: 1 },
};

export const countedCamo: Camo = {
  id: "smoke",
  name: "Smoke",
  nameZh: null,
  group: "special",
  image: null,
  challenge: { en: "Get 75 Kills", zh: "击杀 75 次", target: 75 },
};

export const goldCamo: Camo = {
  id: "gold",
  name: "Gold",
  nameZh: null,
  group: "completionist",
  image: null,
  challenge: { en: "Get 15 Player Kills in a single match", zh: "单场内击杀 15 名玩家", target: 1 },
};

export const weapon: Weapon = {
  id: "han-86",
  name: "Han 86",
  nameZh: "汉86",
  category: "assault-rifle",
  image: null,
  camos: { mp: [levelCamo, countedCamo, goldCamo], dmz: [levelCamo, countedCamo, goldCamo] },
};

const camo = (id: string, group: Camo["group"]): Camo => ({
  id,
  name: id,
  nameZh: null,
  group,
  image: null,
  challenge: { en: id, zh: id, target: 1 },
});

/** 完整顺序的武器：军事 ×3 → 特殊 ×3 → 黄金 → 铂金 */
const fullCamos = [
  camo("military-1", "military"),
  camo("military-2", "military"),
  camo("military-3", "military"),
  camo("smoke", "special"),
  camo("stormwave", "special"),
  camo("red", "special"),
  camo("gold", "completionist"),
  camo("platinum", "completionist"),
];

export const fullWeapon: Weapon = {
  id: "m4",
  name: "M4",
  nameZh: "M4",
  category: "assault-rifle",
  image: null,
  camos: { mp: fullCamos, dmz: fullCamos },
};
