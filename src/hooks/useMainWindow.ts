import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useState } from "react";

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** 主窗口的最小化 / 最大化 / 关闭与显隐；关闭主窗口会退出整个应用（见 src-tauri/src/lib.rs） */
export function useMainWindow() {
  const [windowError, setWindowError] = useState<string | null>(null);
  const run = useCallback((action: () => Promise<void>) => {
    action().catch((error: unknown) => setWindowError(toMessage(error)));
  }, []);

  const toggleVisible = useCallback(async () => {
    const appWindow = getCurrentWindow();
    if (await appWindow.isVisible()) {
      await appWindow.hide();
      return;
    }
    await appWindow.show();
    await appWindow.setFocus();
  }, []);

  return {
    isDesktop: isTauri(),
    windowError,
    toggleVisible,
    minimize: () => run(() => getCurrentWindow().minimize()),
    toggleMaximize: () => run(() => getCurrentWindow().toggleMaximize()),
    close: () => run(() => getCurrentWindow().close()),
  };
}
