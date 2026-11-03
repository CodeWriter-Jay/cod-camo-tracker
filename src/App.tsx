import { useState, type CSSProperties } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { MasteryPanel } from "./components/MasteryPanel";
import { ProgressBar } from "./components/ProgressBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { WeaponDetail } from "./components/WeaponDetail";
import { WeaponList } from "./components/WeaponList";
import { CatalogContext } from "./data/catalog";
import { useAppUpdate } from "./hooks/useAppUpdate";
import { useCatalogData } from "./hooks/useCatalogData";
import { ImageLibraryContext, useImageLibrary } from "./hooks/useImageLibrary";
import { useOverlayControls, type OverlayError } from "./hooks/useOverlayControls";
import { useTrackerState } from "./hooks/useTrackerState";
import { useWindowPersistence } from "./hooks/useWindowPersistence";
import { LanguageContext, useI18n } from "./i18n/I18nContext";
import { messages, type Messages } from "./i18n/messages";
import { getOverallCompletion } from "./lib/progress";
import { DEFAULT_SHORTCUTS, type PersistedState } from "./lib/storage";

type View = { name: "home" } | { name: "weapon"; weaponId: string } | { name: "settings" };

const formatOverlayError = (t: Messages, error: OverlayError) =>
  error.kind === "register"
    ? t.shortcutRegisterFailed(error.detail)
    : t.shortcutFailed(error.shortcut, error.detail);

/** 负责加载状态与各类数据源，并通过 Context 向界面提供语言、数据和图片 */
function App() {
  const tracker = useTrackerState();
  const catalogData = useCatalogData();
  const imageLibrary = useImageLibrary(catalogData.catalog);
  const appUpdate = useAppUpdate();
  const { loadStatus } = tracker;
  const settings = loadStatus.status === "ready" ? loadStatus.data.settings : null;
  const overlay = useOverlayControls(settings?.shortcuts ?? DEFAULT_SHORTCUTS);
  const [windowError, setWindowError] = useState<string | null>(null);
  useWindowPersistence(setWindowError);
  // 进度读取前还没有语言设置，按系统语言显示加载与错误提示
  const fallbackT = messages[navigator.language.startsWith("zh") ? "zh" : "en"];

  if (loadStatus.status === "loading") {
    return <main className="overlay">{fallbackT.loading}</main>;
  }

  if (loadStatus.status === "error") {
    return (
      <main className="overlay">
        <p className="error" role="alert">
          {fallbackT.loadFailed(loadStatus.message)}
        </p>
        <button type="button" className="text-button" onClick={tracker.resetState}>
          {fallbackT.resetData}
        </button>
      </main>
    );
  }

  return (
    <LanguageContext.Provider value={loadStatus.data.settings.language}>
      <CatalogContext.Provider value={catalogData.catalog}>
        <ImageLibraryContext.Provider value={imageLibrary}>
          <TrackerView
            data={loadStatus.data}
            tracker={tracker}
            catalogData={catalogData}
            appUpdate={appUpdate}
            overlay={overlay}
            windowError={windowError}
          />
        </ImageLibraryContext.Provider>
      </CatalogContext.Provider>
    </LanguageContext.Provider>
  );
}

interface TrackerViewProps {
  data: PersistedState;
  tracker: ReturnType<typeof useTrackerState>;
  catalogData: ReturnType<typeof useCatalogData>;
  appUpdate: ReturnType<typeof useAppUpdate>;
  overlay: ReturnType<typeof useOverlayControls>;
  windowError: string | null;
}

// 背景不透明度通过 CSS 变量作用于浮层底色，文字与控件不受影响
const overlayStyle = (opacity: number) => ({ "--overlay-alpha": opacity }) as CSSProperties;

function TrackerView({
  data,
  tracker,
  catalogData,
  appUpdate,
  overlay,
  windowError,
}: TrackerViewProps) {
  const { t } = useI18n();
  const [view, setView] = useState<View>({ name: "home" });
  const { catalog } = catalogData;
  const { completed, favorites, settings } = data;
  const { mode, shortcuts } = settings;

  const selectedWeapon =
    view.name === "weapon" ? catalog.weapons.find((weapon) => weapon.id === view.weaponId) : null;
  const overall = getOverallCompletion(completed, catalog.weapons);
  const overallPercent =
    overall.total === 0 ? 0 : Math.round((overall.completed / overall.total) * 100);
  const errorMessage = overlay.overlayError
    ? formatOverlayError(t, overlay.overlayError)
    : tracker.saveError
      ? t.saveFailed(tracker.saveError)
      : windowError && t.windowStateFailed(windowError);
  const openWeapon = (weaponId: string) => setView({ name: "weapon", weaponId });
  const goHome = () => setView({ name: "home" });

  const favoritesPanel = (
    <FavoritesPanel
      mode={mode}
      favorites={favorites}
      completed={completed}
      onDoneChange={tracker.setCamoDone}
      onToggleFavorite={tracker.toggleFavoriteKey}
      onOpenWeapon={openWeapon}
    />
  );

  // 点击穿透时无法操作界面，只保留收藏挑战的精简视图
  if (overlay.isClickThrough) {
    return (
      <main className="overlay is-compact" style={overlayStyle(settings.overlayOpacity)}>
        {favoritesPanel}
        <p className="hint">{t.clickThroughOn(shortcuts.toggleClickThrough)}</p>
      </main>
    );
  }

  return (
    <main className="overlay" style={overlayStyle(settings.overlayOpacity)}>
      <header className="app-header" data-tauri-drag-region>
        <div className="brand" data-tauri-drag-region>
          <span className="brand-mark" aria-hidden />
          <h1 data-tauri-drag-region>{t.appTitle}</h1>
          <span className="tag">{t.appSubtitle}</span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={t.openSettings}
            aria-pressed={view.name === "settings"}
            onClick={() =>
              setView(view.name === "settings" ? { name: "home" } : { name: "settings" })
            }
          >
            ⚙
          </button>
          {overlay.isOverlayAvailable && (
            <button
              type="button"
              className="text-button"
              title={t.hideOverlayHint(shortcuts.toggleOverlay)}
              onClick={() => void overlay.hideOverlay()}
            >
              {t.hideOverlay}
            </button>
          )}
        </div>
      </header>

      {appUpdate.status.state === "available" && view.name !== "settings" && (
        <div className="banner" role="status">
          <span>{t.updateBanner(appUpdate.status.version)}</span>
          <button type="button" className="link" onClick={() => setView({ name: "settings" })}>
            {t.updateBannerAction}
          </button>
        </div>
      )}

      {errorMessage && (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      )}

      {view.name === "settings" ? (
        <SettingsPanel
          settings={settings}
          onSettingsChange={tracker.updateSettings}
          isOnlineData={catalogData.isOnlineData}
          catalogStatus={catalogData.updateStatus}
          onRefreshCatalog={() => void catalogData.refreshCatalog()}
          appUpdate={{
            ...appUpdate,
            checkForUpdate: () => void appUpdate.checkForUpdate(),
            installUpdate: () => void appUpdate.installUpdate(),
          }}
          onBack={goHome}
        />
      ) : (
        <>
          <div className="summary" data-tauri-drag-region>
            <div className="summary-text">
              <span className="summary-label">{t.overallLabel}</span>
              <span className="summary-value">
                {overallPercent}
                <small>%</small>
              </span>
              <span className="stat">
                {overall.completed}/{overall.total}
              </span>
            </div>
            <ProgressBar {...overall} label={t.overallLabel} />
          </div>

          <div className="segmented" role="tablist" aria-label={t.modeLabel}>
            {(["mp", "dmz"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={item === mode}
                onClick={() => tracker.updateSettings({ mode: item })}
              >
                {t.modes[item]}
              </button>
            ))}
          </div>

          {selectedWeapon ? (
            <WeaponDetail
              key={selectedWeapon.id}
              weapon={selectedWeapon}
              mode={mode}
              completed={completed}
              favorites={favorites}
              onBack={goHome}
              onToggleFavorite={tracker.toggleFavoriteKey}
              onDoneChange={(camoId, done) => tracker.setCamoDone(selectedWeapon, camoId, done)}
            />
          ) : (
            <>
              {favoritesPanel}
              <WeaponList completed={completed} onSelect={openWeapon} />
              <MasteryPanel
                mode={mode}
                completed={completed}
                onDoneChange={(camoId, done) => tracker.setMasteryDone(mode, camoId, done)}
              />
            </>
          )}
        </>
      )}

      {overlay.isOverlayAvailable && (
        <>
          <p className="hint">
            {t.shortcutHint(shortcuts.toggleOverlay, shortcuts.toggleClickThrough)}
          </p>
          <div
            className="resize-grip"
            title={t.resizeWindow}
            aria-hidden
            onMouseDown={() => void getCurrentWindow().startResizeDragging("SouthEast")}
          />
        </>
      )}
    </main>
  );
}

export default App;
