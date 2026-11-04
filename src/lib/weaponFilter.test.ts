import { describe, expect, it } from "vitest";
import type { Weapon } from "../data/catalog";
import { fullWeapon, weapon } from "../test/fixtures";
import {
  EMPTY_WEAPON_FILTER,
  filterWeapons,
  getFilterableCamos,
  isFilterActive,
} from "./weaponFilter";

const smg: Weapon = { ...fullWeapon, id: "mp5", name: "MP5", nameZh: null, category: "smg" };
const knife: Weapon = {
  ...weapon,
  id: "knife",
  name: "Knife",
  nameZh: "刀",
  category: "melee",
  camos: { mp: [], dmz: [] },
};
const weapons = [weapon, fullWeapon, smg, knife];
const ids = (list: Weapon[]) => list.map((item) => item.id);

describe("weaponFilter", () => {
  it("should match weapons in any of the selected categories", () => {
    const result = filterWeapons(
      weapons,
      { ...EMPTY_WEAPON_FILTER, categories: ["assault-rifle", "smg"] },
      {},
    );
    expect(ids(result)).toEqual(["han-86", "m4", "mp5"]);
  });

  it("should keep only weapons whose camo is not done and skip weapons without it", () => {
    const result = filterWeapons(
      weapons,
      { ...EMPTY_WEAPON_FILTER, unfinishedCamoId: "platinum" },
      { "mp5:platinum": true },
    );
    expect(ids(result)).toEqual(["m4"]);
  });

  it("should combine query, categories and camo", () => {
    const result = filterWeapons(
      weapons,
      { query: " 汉 ", categories: ["assault-rifle"], unfinishedCamoId: "gold" },
      { "m4:gold": true },
    );
    expect(ids(result)).toEqual(["han-86"]);
  });

  it("should list completionist camos once in game order", () => {
    expect(getFilterableCamos(weapons).map((camo) => camo.id)).toEqual(["gold", "platinum"]);
  });

  it("should report whether any filter is set", () => {
    expect(isFilterActive(EMPTY_WEAPON_FILTER)).toBe(false);
    expect(isFilterActive({ ...EMPTY_WEAPON_FILTER, query: "  " })).toBe(false);
    expect(isFilterActive({ ...EMPTY_WEAPON_FILTER, categories: ["smg"] })).toBe(true);
  });
});
