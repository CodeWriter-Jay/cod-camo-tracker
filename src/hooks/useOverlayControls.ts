import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister, type ShortcutEvent } from "@tauri-apps/plugin-global-shortcut";
import { useCallback, useEffect, useRef, useState } from "react";

export const SHORTCUTS = {
  toggleOverlay: "Alt+C",
  toggleClickThrough: "Alt+X",
} as const;

const SHORTCUT_LIST = Object.values(SHORTCUTS);

// StrictMode 下 effect 会挂载两次，需等上一次注销完成再注册，否则会报“已注册”
let pendingUnregister: Promise<unknown> = Promise.resolve();

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useOverlayControls() {
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  // 快捷键回调只注册一次，通过 ref 读取最新状态
  const clickThroughRef = useRef(false);

  const applyClickThrough = useCallback(async (next: boolean) => {
    await getCurrentWindow().setIgnoreCursorEvents(next);
    clickThroughRef.current = next;
    setIsClickThrough(next);
  }, []);

  const hideOverlay = useCallback(async () => {
    await getCurrentWindow().hide();
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const appWindow = getCurrentWindow();

    const onPressed = (action: () => Promise<void>) => (event: ShortcutEvent) => {
      if (event.state !== "Pressed") return;
      action().catch((error: unknown) =>
        setOverlayError(`快捷键 ${event.shortcut} 执行失败：${toMessage(error)}`),
      );
    };

    const toggleOverlay = async () => {
      if (await appWindow.isVisible()) {
        await appWindow.hide();
        return;
      }
      await appWindow.show();
      await appWindow.setFocus();
    };

    const registration = pendingUnregister.then(() =>
      Promise.all([
        register(SHORTCUTS.toggleOverlay, onPressed(toggleOverlay)),
        register(
          SHORTCUTS.toggleClickThrough,
          onPressed(() => applyClickThrough(!clickThroughRef.current)),
        ),
      ]),
    );
    registration.catch((error: unknown) =>
      setOverlayError(`全局快捷键注册失败（可能被其他程序占用）：${toMessage(error)}`),
    );

    return () => {
      pendingUnregister = registration
        .catch(() => undefined)
        .then(() => unregister(SHORTCUT_LIST))
        .catch((error: unknown) => setOverlayError(`快捷键注销失败：${toMessage(error)}`));
    };
  }, [applyClickThrough]);

  return {
    isOverlayAvailable: isTauri(),
    isClickThrough,
    overlayError,
    hideOverlay,
  };
}
