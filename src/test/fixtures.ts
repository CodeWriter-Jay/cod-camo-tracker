import type { Camo, Weapon } from "../data/catalog";

export const levelCamo: Camo = {
  id: "military-camo-1",
  name: "Military Camo 1",
  group: "military",
  image: null,
  challenge: { en: "Reach Weapon Level 10", zh: "武器等级达到 10 级", target: 1 },
};

export const countedCamo: Camo = {
  id: "smoke",
  name: "Smoke",
  group: "special",
  image: null,
  challenge: { en: "Get 75 Kills", zh: "击杀 75 次", target: 75 },
};

export const goldCamo: Camo = {
  id: "gold",
  name: "Gold",
  group: "completionist",
  image: null,
  challenge: { en: "Get 15 Player Kills in a single match", zh: "单场内击杀 15 名玩家", target: 1 },
};

export const weapon: Weapon = {
  id: "han-86",
  name: "Han 86",
  category: "assault-rifle",
  image: null,
  camos: { mp: [goldCamo], dmz: [levelCamo, countedCamo, goldCamo] },
};
