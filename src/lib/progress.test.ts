import { describe, expect, it } from "vitest";
import { bundledCatalog as catalog } from "../data/catalog";
import { countedCamo, fullWeapon, goldCamo, levelCamo, weapon } from "../test/fixtures";
import {
  camoKey,
  getDivergenceCompletion,
  getNextCamo,
  getOverallCompletion,
  getPrerequisites,
  getWeaponCompletion,
  isDone,
  masteryKey,
  migrateCountProgress,
  setDone,
} from "./progress";

const key = (camoId: string) => camoKey(weapon.id, camoId);

describe("completion state", () => {
  it("should mark and unmark a camo", () => {
    const completed = setDone({}, key(countedCamo.id), true);
    expect(isDone(completed, key(countedCamo.id))).toBe(true);
    expect(setDone(completed, key(countedCamo.id), false)).toEqual({});
  });

  it("should count completed camos per weapon and overall", () => {
    const completed = setDone({}, key(countedCamo.id), true);
    expect(getWeaponCompletion(completed, weapon)).toEqual({ completed: 1, total: 3 });
    expect(getOverallCompletion(completed, [weapon, weapon])).toEqual({ completed: 2, total: 6 });
  });

  it("should search after given camo first and wrap around", () => {
    expect(getNextCamo({}, weapon)).toBe(levelCamo);
    expect(getNextCamo({}, weapon, countedCamo.id)).toBe(goldCamo);
    expect(getNextCamo({}, weapon, goldCamo.id)).toBe(levelCamo);
    expect(getNextCamo(setDone({}, key(levelCamo.id), true), weapon, goldCamo.id)).toBe(
      countedCamo,
    );
  });

  it("should derive divergence from weapons that completed the required camo", () => {
    const [first, second] = catalog.weapons;
    const { requiredCamoId } = catalog.divergence;
    let completed = setDone({}, camoKey(first.id, requiredCamoId), true);
    completed = setDone(completed, camoKey(second.id, "gold"), true);
    expect(getDivergenceCompletion(completed, catalog)).toEqual({
      completed: 1,
      total: catalog.divergence.required,
    });
  });
});

describe("migrateCountProgress", () => {
  it("should treat camo as done when either mode reached its target", () => {
    const migrated = migrateCountProgress(
      {
        "mp:han-86:smoke": 20,
        "dmz:han-86:stormwave": 10,
        "dmz:han-86:gold": 1,
        "mp:account:mercurial-drift": 250,
        "dmz:account:chiral": 5,
      },
      catalog,
    );
    expect(migrated).toEqual({
      "han-86:smoke": true,
      "han-86:gold": true,
      [masteryKey("mp", "mercurial-drift")]: true,
    });
  });
});

describe("getPrerequisites", () => {
  const ids = (camoId: string) => getPrerequisites(fullWeapon, camoId).map((camo) => camo.id);

  it("should require earlier military camos for a military camo", () => {
    expect(ids("military-3")).toEqual(["military-1", "military-2"]);
  });

  it("should not require anything for a special camo", () => {
    expect(ids("stormwave")).toEqual([]);
  });

  it("should require every earlier camo for a completionist camo", () => {
    expect(ids("platinum")).toEqual([
      "military-1",
      "military-2",
      "military-3",
      "smoke",
      "stormwave",
      "red",
      "gold",
    ]);
  });
});
