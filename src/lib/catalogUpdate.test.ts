import { afterEach, describe, expect, it, vi } from "vitest";
import raw from "../../data-source/codmunity-mw4-raw.json";
import { bundledCatalog } from "../data/catalog";
import { collectZhWeaponNames, diffCatalog, fetchLatestCatalog } from "./catalogUpdate";

const withNewWeapon = () => {
  const copy = structuredClone(raw);
  copy.page.weapons.push({ ...copy.page.weapons[0], WeaponName: "New Gun", slug: "new-gun" });
  copy.page.challenges.push({ ...copy.page.challenges[0], WeaponName: "New Gun" });
  return copy;
};

describe("catalog update", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fetch, transform and keep known chinese weapon names", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(withNewWeapon()))),
    );
    const next = await fetchLatestCatalog(collectZhWeaponNames(bundledCatalog));
    expect(next.weapons.find((weapon) => weapon.id === "han-86")?.nameZh).toBe("汉86");
    expect(next.weapons.find((weapon) => weapon.id === "new-gun")?.nameZh).toBeNull();
    expect(diffCatalog(bundledCatalog, next)).toEqual({ addedWeapons: 1, addedCamos: 1 });
  });

  it("should throw with status when request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("blocked", { status: 403 })));
    await expect(fetchLatestCatalog({})).rejects.toThrow("HTTP 403");
  });
});
