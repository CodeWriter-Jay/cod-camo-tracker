import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { extractImages } from "./imageImport";

const WANTED = ["smoke_mw4_camo_icon.webp", "MW4_M4_green.webp"];
const bytes = new Uint8Array([82, 73, 70, 70]);

describe("extractImages", () => {
  it("should match saved files by name ignoring duplicates suffix and extension", async () => {
    const files = [
      new File([bytes], "smoke_mw4_camo_icon (1).webp"),
      new File([bytes], "MW4_M4_green.png"),
      new File([bytes], "unrelated.webp"),
    ];
    const result = await extractImages(files, WANTED);
    expect([...result.images.keys()].sort()).toEqual([...WANTED].sort());
    expect(result.skipped).toBe(1);
  });

  it("should read images inside zip archive", async () => {
    const zip = zipSync({ "folder/smoke_mw4_camo_icon.webp": bytes, "readme.txt": bytes });
    const result = await extractImages([new File([zip as BlobPart], "camos.zip")], WANTED);
    expect([...result.images.keys()]).toEqual(["smoke_mw4_camo_icon.webp"]);
  });

  it("should read base64 bundle from export script", async () => {
    const bundle = JSON.stringify({ "MW4_M4_green.webp": btoa("RIFF") });
    const result = await extractImages([new File([bundle], "codmunity-mw4-images.json")], WANTED);
    expect([...result.images.keys()]).toEqual(["MW4_M4_green.webp"]);
  });
});
