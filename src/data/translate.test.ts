import { describe, expect, it } from "vitest";
import { parseTarget, translateChallenge } from "./translate";

describe("translateChallenge", () => {
  it.each([
    ["Get 20 Mounted Kills against Players", "架枪击杀 20 名玩家"],
    ["Get 3 Enemy Kills without taking damage 50 times", "不受伤击杀 3 名敌人，达成 50 次"],
    ["Get 10 Double Kills against Players", "对玩家达成 10 次双杀"],
    ["Get 100 Enemy Kills in a single match in DMZ", "DMZ 单局内击杀 100 名敌人"],
    ["Get 10 Kills in a match 250 times", "单场内击杀 10 人，达成 250 次"],
    ["Get 75 Longshot Kills", "远距离击杀 75 次"],
    ["Reach Weapon Level 10", "武器等级达到 10 级"],
  ])("should translate %s", (text, expected) => {
    expect(translateChallenge(text)).toBe(expected);
  });

  it("should return null for unknown wording", () => {
    expect(translateChallenge("Get 5 Kills while riding a horse")).toBeNull();
    expect(translateChallenge("Win 3 matches")).toBeNull();
  });
});

describe("parseTarget", () => {
  it("should prefer repeat count, then single match, then first number", () => {
    expect(parseTarget("Get 3 Kills without dying 15 times")).toBe(15);
    expect(parseTarget("Get 15 Player Kills in a single match")).toBe(1);
    expect(parseTarget("Get 75 Longshot Kills")).toBe(75);
  });
});
