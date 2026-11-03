import { describe, expect, it } from "vitest";
import { catalog } from "./catalog";

// 只取文件名，不加载内容；用于确认数据引用的图片都已随客户端打包
const bundledImages = new Set(
  Object.keys(import.meta.glob("../../public/images/*.webp")).map((path) => path.split("/").pop()),
);

describe("bundled images", () => {
  it("should bundle every image referenced by catalog for offline use", () => {
    const referenced = [
      catalog.divergence.image,
      ...Object.values(catalog.mastery).flatMap((camos) => camos.map((camo) => camo.image)),
      ...catalog.weapons.flatMap((weapon) => [
        weapon.image,
        ...Object.values(weapon.camos).flatMap((camos) => camos.map((camo) => camo.image)),
      ]),
    ].filter((file): file is string => file !== null);

    const missing = [...new Set(referenced)].filter((file) => !bundledImages.has(file));
    expect(missing).toEqual([]);
  });
});
