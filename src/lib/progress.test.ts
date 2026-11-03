import { describe, expect, it } from "vitest";
import { bundledCatalog as catalog } from "../data/catalog";
import { countedCamo, goldCamo, levelCamo, weapon } from "../test/fixtures";
import {
  getCount,
  getDivergenceCompletion,
  getNextCamo,
  getOverallCompletion,
  getWeaponCompletion,
  setCount,
} from "./progress";

describe("setCount", () => {
  it("should clamp count between 0 and target", () => {
    const progress = setCount({}, "dmz", weapon.id, countedCamo, 999);
    expect(getCount(progress, "dmz", weapon.id, countedCamo)).toBe(75);
    expect(setCount({}, "dmz", weapon.id, countedCamo, -3)).toEqual({});
  });

  it("should remove entry when count is reset to zero", () => {
    const progress = setCount({}, "dmz", weapon.id, countedCamo, 10);
    expect(setCount(progress, "dmz", weapon.id, countedCamo, 0)).toEqual({});
  });

  it("should keep progress of different modes separate", () => {
    const progress = setCount({}, "dmz", weapon.id, goldCamo, 1);
    expect(getCount(progress, "mp", weapon.id, goldCamo)).toBe(0);
  });
});

describe("completion", () => {
  it("should count only fully completed camos", () => {
    let progress = setCount({}, "dmz", weapon.id, countedCamo, 74);
    expect(getWeaponCompletion(progress, "dmz", weapon)).toEqual({ completed: 0, total: 3 });
    progress = setCount(progress, "dmz", weapon.id, countedCamo, 75);
    expect(getWeaponCompletion(progress, "dmz", weapon)).toEqual({ completed: 1, total: 3 });
    expect(getOverallCompletion(progress, "dmz", [weapon, weapon])).toEqual({
      completed: 2,
      total: 6,
    });
  });

  it("should return first incomplete camo in game order as next target", () => {
    expect(getNextCamo({}, "dmz", weapon)).toBe(levelCamo);
    const progress = setCount({}, "dmz", weapon.id, levelCamo, 1);
    expect(getNextCamo(progress, "dmz", weapon)).toBe(countedCamo);
  });

  it("should search after given camo first and wrap around", () => {
    expect(getNextCamo({}, "dmz", weapon, countedCamo.id)).toBe(goldCamo);
    expect(getNextCamo({}, "dmz", weapon, goldCamo.id)).toBe(levelCamo);
  });

  it("should derive divergence from weapons that completed the required camo", () => {
    const [first, second] = catalog.weapons;
    const requiredOf = (item: typeof first) =>
      item.camos.mp.find((camo) => camo.id === catalog.divergence.requiredCamoId)!;
    let progress = setCount({}, "mp", first.id, requiredOf(first), 999);
    progress = setCount(progress, "mp", second.id, requiredOf(second), 1);
    expect(getDivergenceCompletion(progress, "mp", catalog)).toEqual({
      completed: 1,
      total: catalog.divergence.required,
    });
  });
});
