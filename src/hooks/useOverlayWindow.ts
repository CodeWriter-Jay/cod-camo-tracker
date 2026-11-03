import { isTauri } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { Window } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ModeId } from "../data/schema";
import {
  OVERLAY_EVENTS,
  OVERLAY_WINDOW_LABEL,
  type OverlayDoneChange,
  type OverlayState,
} from "../overlay/protocol";

interface OverlayHandlers {
  onOpacityChange: (opacity: number) => void;
  onModeChange: (mode: ModeId) => void;
  onDoneChange: (change: OverlayDoneChange) => void;
}

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function getOverlayWindow(): Promise<Window> {
  const overlay = await Window.getByLabel(OVERLAY_WINDOW_LABEL);
  if (!overlay) throw new Error(`Window "${OVERLAY_WINDOW_LABEL}" not found`);
  return overlay;
}

/**
 * 主窗口控制独立的浮层窗口：显示 / 隐藏，并把收藏的挑战等数据推送给浮层；
 * 浮层中调整的不透明度、模式与完成标记通过事件回传，由主窗口统一保存
 */
export function useOverlayWindow(state: OverlayState | null, handlers: OverlayHandlers) {
  const isDesktop = isTauri();
  const [isVisible, setIsVisible] = useState(false);
  const [overlayError, setOverlayError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    stateRef.current = state;
    handlersRef.current = handlers;
  });

  const reportError = useCallback((error: unknown) => setOverlayError(toMessage(error)), []);

  // 数据变化时推送给浮层；浮层页面刷新或首次加载会通过 ready 事件主动索取
  const serialized = state ? JSON.stringify(state) : null;
  useEffect(() => {
    if (!isDesktop || serialized === null) return;
    emitTo(OVERLAY_WINDOW_LABEL, OVERLAY_EVENTS.state, JSON.parse(serialized)).catch(reportError);
  }, [isDesktop, serialized, reportError]);

  useEffect(() => {
    if (!isDesktop) return;
    const listeners = Promise.all([
      listen(OVERLAY_EVENTS.ready, () => {
        if (stateRef.current) {
          emitTo(OVERLAY_WINDOW_LABEL, OVERLAY_EVENTS.state, stateRef.current).catch(reportError);
        }
      }),
      listen<number>(OVERLAY_EVENTS.opacity, (event) =>
        handlersRef.current.onOpacityChange(event.payload),
      ),
      listen<ModeId>(OVERLAY_EVENTS.mode, (event) =>
        handlersRef.current.onModeChange(event.payload),
      ),
      listen<OverlayDoneChange>(OVERLAY_EVENTS.done, (event) =>
        handlersRef.current.onDoneChange(event.payload),
      ),
      listen(OVERLAY_EVENTS.hidden, () => setIsVisible(false)),
    ]);
    listeners.catch(reportError);
    return () => {
      void listeners.then((unlisteners) => unlisteners.forEach((unlisten) => unlisten()));
    };
  }, [isDesktop, reportError]);

  const toggleOverlay = useCallback(async () => {
    if (!isDesktop) return;
    try {
      const overlay = await getOverlayWindow();
      if (await overlay.isVisible()) {
        await overlay.hide();
        setIsVisible(false);
      } else {
        await overlay.show();
        setIsVisible(true);
      }
      setOverlayError(null);
    } catch (error) {
      reportError(error);
    }
  }, [isDesktop, reportError]);

  return { isDesktop, isVisible, toggleOverlay, overlayError };
}
