import { describe, expect, it } from "vitest";
import { hasModifier, toAccelerator } from "./shortcut";

const key = (code: string, keyName: string, modifiers: Partial<KeyboardEvent> = {}) => ({
  code,
  key: keyName,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...modifiers,
});

describe("toAccelerator", () => {
  it("should build accelerator from physical key and modifiers", () => {
    expect(toAccelerator(key("KeyK", "K", { ctrlKey: true, shiftKey: true }))).toBe("Ctrl+Shift+K");
    expect(toAccelerator(key("Digit1", "!", { altKey: true }))).toBe("Alt+1");
    expect(toAccelerator(key("F8", "F8"))).toBe("F8");
  });

  it("should wait while only modifier is pressed", () => {
    expect(toAccelerator(key("AltLeft", "Alt", { altKey: true }))).toBeNull();
  });

  it("should detect missing modifier", () => {
    expect(hasModifier("F8")).toBe(false);
    expect(hasModifier("Alt+C")).toBe(true);
  });
});
