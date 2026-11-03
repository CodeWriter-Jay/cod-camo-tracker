import { useState } from "react";
import "./App.css";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { MasteryPanel } from "./components/MasteryPanel";
import { ProgressBar } from "./components/ProgressBar";
import { WeaponDetail } from "./components/WeaponDetail";
import { WeaponList } from "./components/WeaponList";
import { copy } from "./copy";
import { catalog } from "./data/catalog";
import { useOverlayControls } from "./hooks/useOverlayControls";
import { useTrackerState } from "./hooks/useTrackerState";
import { getOverallCompletion } from "./lib/progress";

function App() {
  const {
    loadStatus,
    saveError,
    changeCamoCount,
    changeMasteryCount,
    toggleFavoriteKey,
    setMode,
    resetState,
  } = useTrackerState();
  const { isOverlayAvailable, isClickThrough, overlayError, hideOverlay } = useOverlayControls();
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);

  if (loadStatus.status === "loading") {
    return <main className="overlay">{copy.loading}</main>;
  }

  if (loadStatus.status === "error") {
    return (
      <main className="overlay">
        <p className="error" role="alert">
          {copy.loadFailed}：{loadStatus.message}
        </p>
        <button type="button" className="text-button" onClick={resetState}>
          {copy.resetData}
        </button>
      </main>
    );
  }

  const { progress, favorites, settings } = loadStatus.data;
  const { mode } = settings;
  const selectedWeapon = catalog.weapons.find((weapon) => weapon.id === selectedWeaponId) ?? null;
  const overall = getOverallCompletion(progress, mode, catalog.weapons);
  const overallPercent =
    overall.total === 0 ? 0 : Math.round((overall.completed / overall.total) * 100);
  const errorMessage = overlayError ?? saveError;

  const favoritesPanel = (
    <FavoritesPanel
      favorites={favorites}
      progress={progress}
      onCountChange={changeCamoCount}
      onToggleFavorite={toggleFavoriteKey}
      onOpenWeapon={setSelectedWeaponId}
    />
  );

  // 点击穿透时无法操作界面，只保留收藏挑战的精简视图
  if (isClickThrough) {
    return (
      <main className="overlay is-compact">
        {favoritesPanel}
        <p className="hint">{copy.clickThroughOn}</p>
      </main>
    );
  }

  return (
    <main className="overlay">
      <header className="app-header" data-tauri-drag-region>
        <div className="brand" data-tauri-drag-region>
          <span className="brand-mark" aria-hidden />
          <h1 data-tauri-drag-region>{copy.appTitle}</h1>
          <span className="tag">{copy.appSubtitle}</span>
        </div>
        {isOverlayAvailable && (
          <button
            type="button"
            className="text-button"
            title={copy.hideOverlayHint}
            onClick={() => void hideOverlay()}
          >
            {copy.hideOverlay}
          </button>
        )}
      </header>

      <div className="summary" data-tauri-drag-region>
        <div className="summary-text">
          <span className="summary-label">{copy.overallLabel}</span>
          <span className="summary-value">
            {overallPercent}
            <small>%</small>
          </span>
          <span className="stat">
            {overall.completed}/{overall.total}
          </span>
        </div>
        <ProgressBar {...overall} label={copy.overallLabel} />
      </div>

      <div className="segmented" role="tablist" aria-label={copy.modeLabel}>
        {catalog.modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === mode}
            onClick={() => setMode(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p className="error" role="alert">
          {errorMessage}
        </p>
      )}

      {selectedWeapon ? (
        <WeaponDetail
          weapon={selectedWeapon}
          mode={mode}
          progress={progress}
          favorites={favorites}
          onBack={() => setSelectedWeaponId(null)}
          onToggleFavorite={toggleFavoriteKey}
          onCountChange={(camo, count) => changeCamoCount(mode, selectedWeapon, camo, count)}
        />
      ) : (
        <>
          {favoritesPanel}
          <WeaponList
            catalog={catalog}
            mode={mode}
            progress={progress}
            onSelect={setSelectedWeaponId}
          />
          <MasteryPanel
            mode={mode}
            progress={progress}
            onCountChange={(camo, count) => changeMasteryCount(mode, camo, count)}
          />
        </>
      )}

      {isOverlayAvailable && <p className="hint">{copy.shortcutHint}</p>}
    </main>
  );
}

export default App;
