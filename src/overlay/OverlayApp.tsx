import { isTauri } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import "../App.css";
import { CamoImage } from "../components/CamoImage";
import { bundledCatalog, type ModeId } from "../data/catalog";
import { ImageLibraryContext, useImageLibrary } from "../hooks/useImageLibrary";
import { messages } from "../i18n/messages";
import { applyCompletionChange } from "../lib/favorites";
import { loadState, MIN_OVERLAY_OPACITY, type PersistedState } from "../lib/storage";
import { buildOverlayState, OVERLAY_EVENTS, type OverlayState } from "./protocol";
import { PIN_TARGET_ATTR, usePinnedClickThrough } from "./usePinnedClickThrough";

const OPACITY_STEP = 0.1;
const MODES: ModeId[] = ["mp", "dmz"];

const clampOpacity = (value: number) =>
  Math.round(Math.min(1, Math.max(MIN_OVERLAY_OPACITY, value)) * 100) / 100;
const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * 浮层窗口：只读展示收藏的挑战。
 * 桌面端数据由主窗口通过事件推送；浏览器预览没有多窗口，直接读取本地进度用于开发调试
 */
export function OverlayApp() {
  const [state, setState] = useState<OverlayState | null>(null);
  const [isPinned, setIsPinned] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pinError = usePinnedClickThrough(isPinned);
  const imageLibrary = useImageLibrary(bundledCatalog);
  const previewDataRef = useRef<PersistedState | null>(null);

  useEffect(() => {
    if (isTauri()) {
      const unlisten = listen<OverlayState>(OVERLAY_EVENTS.state, (event) =>
        setState(event.payload),
      );
      unlisten
        .then(() => emit(OVERLAY_EVENTS.ready))
        .catch((reason: unknown) => setError(toMessage(reason)));
      return () => {
        void unlisten.then((stop) => stop());
      };
    }
    let isCancelled = false;
    loadState()
      .then((data) => {
        if (isCancelled) return;
        previewDataRef.current = data;
        setState(buildOverlayState(data, bundledCatalog));
      })
      .catch((reason: unknown) => setError(toMessage(reason)));
    return () => {
      isCancelled = true;
    };
  }, []);

  if (!state) return <main className="overlay is-overlay" />;

  const t = messages[state.language];
  const isDesktop = isTauri();

  const changeOpacity = (opacity: number) => {
    setState({ ...state, opacity });
    if (isDesktop)
      emit(OVERLAY_EVENTS.opacity, opacity).catch((reason) => setError(toMessage(reason)));
  };

  const changeMode = (mode: ModeId) => {
    if (isDesktop) {
      emit(OVERLAY_EVENTS.mode, mode).catch((reason) => setError(toMessage(reason)));
      return;
    }
    const data = previewDataRef.current;
    if (!data) return;
    const next = { ...data, settings: { ...data.settings, mode } };
    previewDataRef.current = next;
    setState(buildOverlayState(next, bundledCatalog));
  };

  const changeDone = (key: string, done: boolean) => {
    if (isDesktop) {
      emit(OVERLAY_EVENTS.done, { key, done }).catch((reason) => setError(toMessage(reason)));
      return;
    }
    const data = previewDataRef.current;
    const [weaponId, camoId] = key.split(":");
    const weapon = bundledCatalog.weapons.find((item) => item.id === weaponId);
    if (!data || !weapon) return;
    const next = { ...data, ...applyCompletionChange(data, weapon, camoId, done) };
    previewDataRef.current = next;
    setState(buildOverlayState(next, bundledCatalog));
  };

  const hideOverlay = async () => {
    await getCurrentWindow().hide();
    await emit(OVERLAY_EVENTS.hidden);
  };

  const errorMessage = error ?? pinError;

  return (
    <ImageLibraryContext.Provider value={imageLibrary}>
      <main
        className={isPinned ? "overlay is-overlay is-pinned" : "overlay is-overlay"}
        style={{ "--overlay-alpha": state.opacity } as CSSProperties}
        aria-label={t.overlayTitle}
      >
        <div className="overlay-bar">
          <div
            className="overlay-handle"
            title={isPinned ? undefined : t.moveOverlay}
            onMouseDown={() => {
              if (!isPinned && isDesktop) void getCurrentWindow().startDragging();
            }}
          >
            <span className="brand-mark" aria-hidden />
            <span className="overlay-title">{t.overlayTitle}</span>
            <span className="badge">{state.items.length}</span>
            {isPinned && <span className="tag">{t.modes[state.mode]}</span>}
          </div>

          {!isPinned && (
            <div className="overlay-controls">
              <div className="segmented is-small" role="tablist" aria-label={t.modeLabel}>
                {MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={mode === state.mode}
                    onClick={() => changeMode(mode)}
                  >
                    {t.modes[mode]}
                  </button>
                ))}
              </div>
              <div className="overlay-opacity">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t.opacityDown}
                  disabled={state.opacity <= MIN_OVERLAY_OPACITY}
                  onClick={() => changeOpacity(clampOpacity(state.opacity - OPACITY_STEP))}
                >
                  −
                </button>
                <span className="stat">{Math.round(state.opacity * 100)}%</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t.opacityUp}
                  disabled={state.opacity >= 1}
                  onClick={() => changeOpacity(clampOpacity(state.opacity + OPACITY_STEP))}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="icon-button pin"
            aria-pressed={isPinned}
            aria-label={isPinned ? t.unpinOverlay : t.pinOverlay}
            title={isPinned ? t.unpinOverlay : t.pinOverlay}
            onClick={() => setIsPinned(!isPinned)}
            {...{ [PIN_TARGET_ATTR]: "" }}
          >
            <svg viewBox="0 0 16 16" aria-hidden>
              <path d="M10.5 1.5l4 4-2 1-2.5 2.5.5 3-1.5 1.5-3-3-3.5 3.5h-1v-1L5 9.5l-3-3L3.5 5l3 .5L9 3l1.5-1.5z" />
            </svg>
          </button>
          {!isPinned && isDesktop && (
            <button
              type="button"
              className="icon-button"
              aria-label={t.hideOverlayWindow}
              title={t.hideOverlayWindow}
              onClick={() => void hideOverlay().catch((reason) => setError(toMessage(reason)))}
            >
              ✕
            </button>
          )}
        </div>

        {errorMessage && (
          <p className="error" role="alert">
            {t.windowFailed(errorMessage)}
          </p>
        )}

        {state.items.length === 0 ? (
          <p className="empty">{t.overlayEmpty}</p>
        ) : (
          <ul className="camo-list">
            {state.items.map((item) => (
              <li key={item.key} className={item.isDone ? "camo-row is-done" : "camo-row"}>
                <CamoImage file={item.image} />
                <div className="camo-info">
                  <span className="camo-weapon">{item.weaponName}</span>
                  <span className="camo-name">{item.camoName}</span>
                  <span className="camo-challenge" title={item.challengeAlt ?? undefined}>
                    {item.challenge}
                  </span>
                </div>
                {/* 固定（点击穿透）时只有图钉可点，勾选框在解除固定后出现 */}
                {!isPinned && (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={item.isDone}
                      aria-label={t.doneLabel(item.camoName)}
                      onChange={(event) => changeDone(item.key, event.target.checked)}
                    />
                    <span className="check-box" aria-hidden />
                  </label>
                )}
              </li>
            ))}
          </ul>
        )}

        {!isPinned && isDesktop && (
          <div
            className="resize-grip"
            title={t.resizeWindow}
            aria-hidden
            onMouseDown={() => void getCurrentWindow().startResizeDragging("SouthEast")}
          />
        )}
      </main>
    </ImageLibraryContext.Provider>
  );
}
