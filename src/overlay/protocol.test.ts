import { describe, expect, it } from "vitest";
import { bundledCatalog } from "../data/catalog";
import { createDefaultState } from "../lib/storage";
import { buildOverlayState } from "./protocol";

describe("buildOverlayState", () => {
  it("should localize favorites for the current mode and language", () => {
    const data = createDefaultState();
    data.favorites = ["han-86:smoke", "removed:gold"];
    data.settings = { ...data.settings, mode: "mp", language: "en", overlayOpacity: 0.6 };

    expect(buildOverlayState(data, bundledCatalog)).toEqual({
      language: "en",
      mode: "mp",
      opacity: 0.6,
      items: [
        {
          key: "han-86:smoke",
          weaponName: "Han 86",
          camoName: "Smoke",
          challenge: "Get 20 Kills while Mounted against Players",
          challengeAlt: "架枪击杀 20 名玩家",
          image: "smoke_mw4_camo_icon.webp",
          isDone: false,
        },
      ],
    });
  });
});
