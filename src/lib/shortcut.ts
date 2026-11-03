const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

/**
 * 把键盘事件转换为 Tauri 全局快捷键格式（如 "Ctrl+Shift+K"）。
 * 单独按下修饰键时返回 null，表示组合尚未完成。
 */
export function toAccelerator(
  event: Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">,
): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  const modifiers = [
    event.ctrlKey && "Ctrl",
    event.altKey && "Alt",
    event.shiftKey && "Shift",
    event.metaKey && "Super",
  ].filter(Boolean);
  // 用物理键位 code，避免 Shift/输入法改变字符
  const key = event.code.replace(/^Key/, "").replace(/^Digit/, "");
  return [...modifiers, key].join("+");
}

export const hasModifier = (accelerator: string) => accelerator.includes("+");
