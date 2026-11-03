import { describe, expect, it } from "vitest";
import { bundledCatalog } from "./catalog";
import { collectImages } from "./schema";

// 只取文件名，不加载内容；用于确认内置数据引用的图片都已随客户端打包
const bundledFiles = new Set(
  Object.keys(import.meta.glob("../../public/images/*.webp")).map((path) => path.split("/").pop()),
);

describe("bundled images", () => {
  it("should bundle every image referenced by built-in catalog for offline use", () => {
    const missing = [...collectImages(bundledCatalog)].filter((file) => !bundledFiles.has(file));
    expect(missing).toEqual([]);
  });
});
