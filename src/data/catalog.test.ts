import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";

describe("catalog", () => {
  it("should have unique weapon ids", () => {
    const ids = catalog.weapons.map((weapon) => weapon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should only reference known categories", () => {
    const categoryIds = new Set(catalog.categories.map((category) => category.id));
    expect(catalog.weapons.every((weapon) => categoryIds.has(weapon.category))).toBe(true);
  });

  it("should have unique camo ids per weapon and mode", () => {
    for (const weapon of catalog.weapons) {
      for (const camos of Object.values(weapon.camos)) {
        const ids = camos.map((camo) => camo.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it("should translate every challenge to chinese", () => {
    const challenges = catalog.weapons.flatMap((weapon) =>
      Object.values(weapon.camos).flatMap((camos) => camos.map((camo) => camo.challenge)),
    );
    expect(challenges.every((challenge) => /[一-龥]/.test(challenge.zh))).toBe(true);
  });
});
