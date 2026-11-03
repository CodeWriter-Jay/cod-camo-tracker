import { describe, expect, it } from "vitest";
import raw from "../../data-source/codmunity-mw4-raw.json";
import zhNames from "../../data-source/codmunity-zh-weapon-names.json";
import { bundledCatalog } from "./catalog";
import { transformCodmunity } from "./codmunity";

describe("transformCodmunity", () => {
  it("should reproduce built-in catalog from snapshot", () => {
    const catalog = transformCodmunity(raw, zhNames, bundledCatalog.updatedAt);
    expect(catalog).toEqual(bundledCatalog);
  });

  it("should fall back to english for unknown weapon names and wording", () => {
    const catalog = transformCodmunity(raw, {});
    expect(catalog.weapons.every((weapon) => weapon.nameZh === null)).toBe(true);
  });

  it("should reject payload with unexpected shape", () => {
    expect(() => transformCodmunity({ page: { weapons: "oops" } }, zhNames)).toThrow();
  });
});
