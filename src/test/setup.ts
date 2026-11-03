import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

beforeEach(() => {
  // 默认语言跟随系统，测试统一按中文环境运行
  Object.defineProperty(navigator, "language", { value: "zh-CN", configurable: true });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
