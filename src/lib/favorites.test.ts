import { describe, expect, it } from "vitest";
import { bundledCatalog as catalog } from "../data/catalog";
import { countedCamo, goldCamo, levelCamo, weapon } from "../test/fixtures";
import { applyCountChange, resolveFavorites, toggleFavorite } from "./favorites";
import { progressKey } from "./progress";

const keyOf = (camoId: string) => progressKey("dmz", weapon.id, camoId);

describe("applyCountChange", () => {
  it("should keep favorite while challenge is unfinished", () => {
    const data = { progress: {}, favorites: [keyOf(countedCamo.id)] };
    const next = applyCountChange(data, "dmz", weapon, countedCamo, 10);
    expect(next.favorites).toEqual([keyOf(countedCamo.id)]);
  });

  it("should replace completed favorite with next camo of the same weapon in place", () => {
    const data = { progress: {}, favorites: ["mp:m4:gold", keyOf(levelCamo.id), "mp:m4:green"] };
    const next = applyCountChange(data, "dmz", weapon, levelCamo, 1);
    expect(next.favorites).toEqual(["mp:m4:gold", keyOf(countedCamo.id), "mp:m4:green"]);
  });

  it("should not duplicate next camo when it is already a favorite", () => {
    const data = { progress: {}, favorites: [keyOf(levelCamo.id), keyOf(countedCamo.id)] };
    const next = applyCountChange(data, "dmz", weapon, levelCamo, 1);
    expect(next.favorites).toEqual([keyOf(countedCamo.id)]);
  });

  it("should drop favorite when weapon has no camo left", () => {
    let data = { progress: {}, favorites: [] as string[] };
    data = applyCountChange(data, "dmz", weapon, levelCamo, 1);
    data = applyCountChange(data, "dmz", weapon, countedCamo, 75);
    data = { ...data, favorites: [keyOf(goldCamo.id)] };
    expect(applyCountChange(data, "dmz", weapon, goldCamo, 1).favorites).toEqual([]);
  });

  it("should skip earlier unfinished camos and pick the one after the completed camo", () => {
    const data = { progress: {}, favorites: [keyOf(countedCamo.id)] };
    const next = applyCountChange(data, "dmz", weapon, countedCamo, 75);
    expect(next.favorites).toEqual([keyOf(goldCamo.id)]);
  });

  it("should not touch favorites of other challenges when completing", () => {
    const data = { progress: {}, favorites: [keyOf(countedCamo.id)] };
    const next = applyCountChange(data, "dmz", weapon, levelCamo, 1);
    expect(next.favorites).toEqual([keyOf(countedCamo.id)]);
  });
});

describe("favorites helpers", () => {
  it("should toggle favorite key", () => {
    expect(toggleFavorite([], "a")).toEqual(["a"]);
    expect(toggleFavorite(["a", "b"], "a")).toEqual(["b"]);
  });

  it("should ignore favorites that no longer exist in catalog", () => {
    const weaponId = catalog.weapons[0].id;
    const camoId = catalog.weapons[0].camos.mp[0].id;
    const resolved = resolveFavorites(catalog, [
      `mp:${weaponId}:${camoId}`,
      "mp:removed:gold",
      "x:y:z",
    ]);
    expect(resolved.map((item) => item.key)).toEqual([`mp:${weaponId}:${camoId}`]);
  });
});
