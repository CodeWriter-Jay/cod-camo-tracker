import { describe, expect, it } from "vitest";
import { bundledCatalog as catalog } from "../data/catalog";
import { countedCamo, fullWeapon, goldCamo, levelCamo, weapon } from "../test/fixtures";
import {
  applyCompletionChange,
  migrateFavorites,
  resolveFavorites,
  toggleFavorite,
} from "./favorites";
import { camoKey, type Completed } from "./progress";

const keyOf = (camoId: string) => camoKey(weapon.id, camoId);

describe("applyCompletionChange", () => {
  it("should replace completed favorite with next camo of the same weapon in place", () => {
    const data = { completed: {}, favorites: ["m4:gold", keyOf(levelCamo.id), "m4:green"] };
    const next = applyCompletionChange(data, weapon, levelCamo.id, true);
    expect(next.favorites).toEqual(["m4:gold", keyOf(countedCamo.id), "m4:green"]);
  });

  it("should skip earlier unfinished camos and pick the one after the completed camo", () => {
    const data = { completed: {}, favorites: [keyOf(countedCamo.id)] };
    const next = applyCompletionChange(data, weapon, countedCamo.id, true);
    expect(next.favorites).toEqual([keyOf(goldCamo.id)]);
  });

  it("should not duplicate next camo when it is already a favorite", () => {
    const data = { completed: {}, favorites: [keyOf(levelCamo.id), keyOf(countedCamo.id)] };
    const next = applyCompletionChange(data, weapon, levelCamo.id, true);
    expect(next.favorites).toEqual([keyOf(countedCamo.id)]);
  });

  it("should drop favorite when weapon has no camo left", () => {
    const data = {
      completed: { [keyOf(levelCamo.id)]: true as const, [keyOf(countedCamo.id)]: true as const },
      favorites: [keyOf(goldCamo.id)],
    };
    expect(applyCompletionChange(data, weapon, goldCamo.id, true).favorites).toEqual([]);
  });

  it("should keep favorites untouched when unchecking", () => {
    const data = {
      completed: { [keyOf(levelCamo.id)]: true as const },
      favorites: [keyOf(levelCamo.id)],
    };
    const next = applyCompletionChange(data, weapon, levelCamo.id, false);
    expect(next).toEqual({ completed: {}, favorites: [keyOf(levelCamo.id)] });
  });
});

describe("favorites helpers", () => {
  it("should toggle favorite key", () => {
    expect(toggleFavorite([], "a")).toEqual(["a"]);
    expect(toggleFavorite(["a", "b"], "a")).toEqual(["b"]);
  });

  it("should resolve camo of the requested mode and ignore removed entries", () => {
    const resolved = resolveFavorites(catalog, ["han-86:smoke", "removed:gold"], "mp");
    expect(resolved.map((item) => item.camo.challenge.en)).toEqual([
      "Get 20 Kills while Mounted against Players",
    ]);
    expect(resolveFavorites(catalog, ["han-86:smoke"], "dmz")[0].camo.challenge.en).toBe(
      "Get 75 Enemy Kills while Mounted against Enemies",
    );
  });

  it("should migrate mode-prefixed favorites and remove duplicates", () => {
    expect(migrateFavorites(["mp:han-86:smoke", "dmz:han-86:smoke", "dmz:m4:gold"])).toEqual([
      "han-86:smoke",
      "m4:gold",
    ]);
  });
});

describe("applyCompletionChange with prerequisites", () => {
  const key = (camoId: string) => camoKey(fullWeapon.id, camoId);
  const doneIds = (completed: Completed) =>
    Object.keys(completed).map((item) => item.replace(`${fullWeapon.id}:`, ""));
  const check = (completed: Completed, favorites: string[], camoId: string) =>
    applyCompletionChange({ completed, favorites }, fullWeapon, camoId, true);

  it("should check earlier military camos only when checking a military camo", () => {
    expect(doneIds(check({}, [], "military-2").completed)).toEqual(["military-2", "military-1"]);
  });

  it("should check only the special camo itself", () => {
    expect(doneIds(check({}, [], "stormwave").completed)).toEqual(["stormwave"]);
  });

  it("should check every earlier camo when checking a completionist camo", () => {
    expect(doneIds(check({}, [], "gold").completed).sort()).toEqual(
      ["gold", "military-1", "military-2", "military-3", "red", "smoke", "stormwave"].sort(),
    );
  });

  it("should only uncheck the camo itself", () => {
    const { completed } = check({}, [], "gold");
    const next = applyCompletionChange(
      { completed, favorites: [] },
      fullWeapon,
      "military-1",
      false,
    );
    expect(doneIds(next.completed)).not.toContain("military-1");
    expect(doneIds(next.completed)).toContain("gold");
  });

  it("should not affect other weapons", () => {
    const { completed } = check({}, [], "gold");
    expect(Object.keys(completed).every((item) => item.startsWith(`${fullWeapon.id}:`))).toBe(true);
  });

  it("should move single favorited special to next special, then gold after the last one", () => {
    let data = check({}, [key("smoke")], "smoke");
    expect(data.favorites).toEqual([key("stormwave")]);
    data = check(data.completed, data.favorites, "stormwave");
    expect(data.favorites).toEqual([key("red")]);
    data = check(data.completed, data.favorites, "red");
    expect(data.favorites).toEqual([key("gold")]);
  });

  it("should only drop a special while another favorited special is still pending", () => {
    let data = check({}, [key("smoke"), key("red")], "smoke");
    expect(data.favorites).toEqual([key("red")]);
    data = check(data.completed, data.favorites, "red");
    expect(data.favorites).toEqual([key("stormwave")]);
  });

  it("should jump to gold once the last favorited special completes", () => {
    let data = check({ [key("stormwave")]: true }, [key("smoke"), key("red")], "smoke");
    expect(data.favorites).toEqual([key("red")]);
    data = check(data.completed, data.favorites, "red");
    expect(data.favorites).toEqual([key("gold")]);
  });

  it("should advance favorites that become done through prerequisites", () => {
    const data = check({}, [key("smoke"), key("military-1")], "gold");
    expect(data.favorites).toEqual([key("platinum")]);
  });
});
