import { useState } from "react";
import "./App.css";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { MasteryPanel } from "./components/MasteryPanel";
import { ProgressBar } from "./components/ProgressBar";
import { SettingsPanel } from "./components/SettingsPanel";
import { TitleBar } from "./components/TitleBar";
import { WeaponDetail } from "./components/WeaponDetail";
import { WeaponList } from "./components/WeaponList";
import { CatalogContext } from "./data/catalog";
import { useAppUpdate } from "./hooks/useAppUpdate";
import { useCatalogData } from "./hooks/useCatalogData";
import { useGlobalShortcuts, type ShortcutError } from "./hooks/useGlobalShortcuts";
import { ImageLibraryContext, useImageLibrary } from "./hooks/useImageLibrary";
import { useTrackerState } from "./hooks/useTrackerState";
import { useMainWindow } from "./hooks/useMainWindow";
import { useOverlayWindow } from "./hooks/useOverlayWindow";
import { LanguageContext, useI18n } from "./i18n/I18nContext";
import { messages, type Messages } from "./i18n/messages";
import { getOverallCompletion } from "./lib/progress";
import { EMPTY_WEAPON_FILTER, type WeaponFilter } from "./lib/weaponFilter";
import { buildOverlayState } from "./overlay/protocol";
import { DEFAULT_SHORTCUTS, type PersistedState } from "./lib/storage";

type View = { name: "home" } | { name: "weapon"; weaponId: string } | { name: "settings" };

const formatShortcutError = (t: Messages, error: ShortcutError) =>
  error.kind === "register"
    ? t.shortcutRegisterFailed(error.detail)
    : t.shortcutFailed(error.shortcut, error.detail);

/** 负责加载状态与各类数据源，并通过 Context 向界面提供语言、数据和图片 */
function App() {
  const tracker = useTrackerState();
  const catalogData = useCatalogData();
  const imageLibrary = useImageLibrary(catalogData.catalog);
  const appUpdate = useAppUpdate();
  const { loadStatus, updateSettings } = tracker;
  const data = loadStatus.status === "ready" ? loadStatus.data : null;
  const mainWindow = useMainWindow();
  const overlayWindow = useOverlayWindow(
    data ? buildOverlayState(data, catalogData.catalog) : null,
    {
      onOpacityChange: (overlayOpacity) => updateSettings({ overlayOpacity }),
      onModeChange: (mode) => updateSettings({ mode }),
      // 与主窗口勾选走同一套规则：联动前置迷彩、收藏自动切换到下一个
      onDoneChange: ({ key, done }) => {
        const [weaponId, camoId] = key.split(":");
        const weapon = catalogData.catalog.weapons.find((item) => item.id === weaponId);
        if (weapon) tracker.setCamoDone(weapon, camoId, done);
      },
    },
  );
  const shortcutError = useGlobalShortcuts(data?.settings.shortcuts ?? DEFAULT_SHORTCUTS, {
    toggleWindow: mainWindow.toggleVisible,
    toggleOverlay: overlayWindow.toggleOverlay,
  });
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
            mainWindow={mainWindow}
            overlayWindow={overlayWindow}
            shortcutError={shortcutError}
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
  mainWindow: ReturnType<typeof useMainWindow>;
  overlayWindow: ReturnType<typeof useOverlayWindow>;
  shortcutError: ShortcutError | null;
}

function TrackerView({
  data,
  tracker,
  catalogData,
  appUpdate,
  mainWindow,
  overlayWindow,
  shortcutError,
}: TrackerViewProps) {
  const { t } = useI18n();
  const [view, setView] = useState<View>({ name: "home" });
  // 放在视图之上，进入武器详情或设置后返回时筛选条件不丢失
  const [weaponFilter, setWeaponFilter] = useState<WeaponFilter>(EMPTY_WEAPON_FILTER);
  const { catalog } = catalogData;
  const { completed, favorites, settings } = data;
  const { mode, shortcuts } = settings;
  const selectedWeapon =
    view.name === "weapon" ? catalog.weapons.find((weapon) => weapon.id === view.weaponId) : null;
  const overall = getOverallCompletion(completed, catalog.weapons);
  const overallPercent =
    overall.total === 0 ? 0 : Math.round((overall.completed / overall.total) * 100);
  const windowError = mainWindow.windowError ?? overlayWindow.overlayError;
  const errorMessage = shortcutError
    ? formatShortcutError(t, shortcutError)
    : tracker.saveError
      ? t.saveFailed(tracker.saveError)
      : windowError && t.windowFailed(windowError);
  const shortcutHint = t.shortcutHint(shortcuts.toggleWindow, shortcuts.toggleOverlay);
  const openWeapon = (weaponId: string) => setView({ name: "weapon", weaponId });
  const goHome = () => setView({ name: "home" });

  return (
    <main className="overlay">
      <TitleBar
        isDesktop={mainWindow.isDesktop}
        isSettingsOpen={view.name === "settings"}
        onToggleSettings={() =>
          setView(view.name === "settings" ? { name: "home" } : { name: "settings" })
        }
        isOverlayVisible={overlayWindow.isVisible}
        onToggleOverlay={() => void overlayWindow.toggleOverlay()}
        onMinimize={mainWindow.minimize}
        onToggleMaximize={mainWindow.toggleMaximize}
        onClose={mainWindow.close}
      />

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
              <FavoritesPanel
                mode={mode}
                favorites={favorites}
                completed={completed}
                onDoneChange={tracker.setCamoDone}
                onToggleFavorite={tracker.toggleFavoriteKey}
                onOpenWeapon={openWeapon}
              />
              <WeaponList
                completed={completed}
                filter={weaponFilter}
                onFilterChange={setWeaponFilter}
                onSelect={openWeapon}
              />
              <MasteryPanel
                mode={mode}
                completed={completed}
                onDoneChange={(camoId, done) => tracker.setMasteryDone(mode, camoId, done)}
              />
            </>
          )}
        </>
      )}

      {mainWindow.isDesktop && shortcutHint && <p className="hint">{shortcutHint}</p>}
    </main>
  );
}

export default App;
