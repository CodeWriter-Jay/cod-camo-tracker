import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { saveWindowState, StateFlags } from "@tauri-apps/plugin-window-state";
import { useEffect } from "react";

const SAVE_DELAY_MS = 500;

/**
 * 窗口没有标题栏和关闭按钮，通常不会正常退出，插件的退出时保存不可靠；
 * 因此在拖动或缩放结束后自动保存大小与位置，下次启动由插件恢复
 */
export function useWindowPersistence(onError: (detail: string) => void) {
  useEffect(() => {
    if (!isTauri()) return;
    const appWindow = getCurrentWindow();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleSave = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        saveWindowState(StateFlags.SIZE | StateFlags.POSITION).catch((error: unknown) =>
          onError(error instanceof Error ? error.message : String(error)),
        );
      }, SAVE_DELAY_MS);
    };
    const listeners = Promise.all([
      appWindow.onResized(scheduleSave),
      appWindow.onMoved(scheduleSave),
    ]);
    listeners.catch((error: unknown) =>
      onError(error instanceof Error ? error.message : String(error)),
    );
    return () => {
      clearTimeout(timer);
      void listeners.then((unlisteners) => unlisteners.forEach((unlisten) => unlisten()));
    };
  }, [onError]);
}
