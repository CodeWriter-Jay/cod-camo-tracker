import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister, type ShortcutEvent } from "@tauri-apps/plugin-global-shortcut";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Shortcuts } from "../lib/storage";

export type OverlayError =
  { kind: "register"; detail: string } | { kind: "run"; shortcut: string; detail: string };

// 需等上一次注销完成再注册（StrictMode 双挂载、修改快捷键时），否则会报“已注册”
let pendingUnregister: Promise<unknown> = Promise.resolve();

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useOverlayControls({ toggleOverlay, toggleClickThrough }: Shortcuts) {
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [overlayError, setOverlayError] = useState<OverlayError | null>(null);
  // 快捷键回调注册后不随渲染更新，通过 ref 读取最新状态
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
        setOverlayError({ kind: "run", shortcut: event.shortcut, detail: toMessage(error) }),
      );
    };

    const showOrHide = async () => {
      if (await appWindow.isVisible()) {
        await appWindow.hide();
        return;
      }
      await appWindow.show();
      await appWindow.setFocus();
    };

    const shortcuts = [toggleOverlay, toggleClickThrough];
    const registration = pendingUnregister.then(async () => {
      await register(toggleOverlay, onPressed(showOrHide));
      await register(
        toggleClickThrough,
        onPressed(() => applyClickThrough(!clickThroughRef.current)),
      );
      setOverlayError(null);
    });
    registration.catch((error: unknown) =>
      setOverlayError({ kind: "register", detail: toMessage(error) }),
    );

    return () => {
      // 注册失败已在上面上报，这里只需保证注销在其之后执行
      pendingUnregister = registration
        .catch(() => undefined)
        .then(() => unregister(shortcuts))
        .catch((error: unknown) => setOverlayError({ kind: "register", detail: toMessage(error) }));
    };
  }, [toggleOverlay, toggleClickThrough, applyClickThrough]);

  return {
    isOverlayAvailable: isTauri(),
    isClickThrough,
    overlayError,
    hideOverlay,
  };
}
