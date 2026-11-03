import { isTauri } from "@tauri-apps/api/core";
import { cursorPosition, getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

/** 固定（点击穿透）状态下仍需可点击的元素（图钉按钮）带有此属性 */
export const PIN_TARGET_ATTR = "data-pin-target";

const HOVER_POLL_MS = 60;

/** 光标（全局物理坐标）是否位于图钉按钮上 */
async function isCursorOverPin(): Promise<boolean> {
  const appWindow = getCurrentWindow();
  const [cursor, origin, scale] = await Promise.all([
    cursorPosition(),
    appWindow.innerPosition(),
    appWindow.scaleFactor(),
  ]);
  const x = (cursor.x - origin.x) / scale;
  const y = (cursor.y - origin.y) / scale;
  const pin = document.querySelector(`[${PIN_TARGET_ATTR}]`);
  if (!pin) return false;
  const rect = pin.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * 浮层的点击穿透：固定时整个窗口穿透，只有光标经过图钉按钮时临时接收点击，
 * 保证随时可以解除；解除固定后窗口正常接收鼠标，可移动、缩放与调整
 */
export function usePinnedClickThrough(isPinned: boolean) {
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri()) return;
    const appWindow = getCurrentWindow();
    const report = (error: unknown) =>
      setPinError(error instanceof Error ? error.message : String(error));

    if (!isPinned) {
      appWindow.setIgnoreCursorEvents(false).catch(report);
      return;
    }

    let isOverPin = false;
    let isBusy = false;
    appWindow.setIgnoreCursorEvents(true).catch(report);
    const timer = setInterval(() => {
      if (isBusy) return;
      isBusy = true;
      isCursorOverPin()
        .then(async (isOver) => {
          if (isOver === isOverPin) return;
          isOverPin = isOver;
          await appWindow.setIgnoreCursorEvents(!isOver);
        })
        .catch(report)
        .finally(() => {
          isBusy = false;
        });
    }, HOVER_POLL_MS);
    return () => clearInterval(timer);
  }, [isPinned]);

  return pinError;
}
