import { useRef, useState } from "react";
import { useCatalog } from "../data/catalog";
import type { AppUpdateStatus } from "../hooks/useAppUpdate";
import type { CatalogUpdateStatus } from "../hooks/useCatalogData";
import { useImages } from "../hooks/useImageLibrary";
import { useI18n } from "../i18n/I18nContext";
import { buildExportScript } from "../lib/exportScript";
import { DEFAULT_SHORTCUTS, MIN_OVERLAY_OPACITY, type Settings } from "../lib/storage";
import { ShortcutRecorder } from "./ShortcutRecorder";

// 与打包图片尺寸一致（界面显示尺寸的 2 倍）
const CAMO_IMAGE_SIZE = "200x80";
const WEAPON_IMAGE_SIZE = "144x72";

type Feedback = { tone: "info" | "error"; text: string } | null;

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (changes: Partial<Settings>) => void;
  isOnlineData: boolean;
  catalogStatus: CatalogUpdateStatus;
  onRefreshCatalog: () => void;
  appUpdate: {
    isAvailable: boolean;
    version: string | null;
    status: AppUpdateStatus;
    checkForUpdate: () => void;
    installUpdate: () => void;
  };
  onBack: () => void;
}

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function SettingsPanel({
  settings,
  onSettingsChange,
  isOnlineData,
  catalogStatus,
  onRefreshCatalog,
  appUpdate,
  onBack,
}: SettingsPanelProps) {
  const catalog = useCatalog();
  const images = useImages();
  const { t, language } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFeedback, setImageFeedback] = useState<Feedback>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { shortcuts } = settings;
  const formattedDate = new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(catalog.updatedAt));

  const handleImport = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsImporting(true);
    try {
      const { images: imported, skipped } = await images.importFiles([...fileList]);
      setImageFeedback({ tone: "info", text: t.settings.importDone(imported.size, skipped) });
    } catch (error) {
      setImageFeedback({ tone: "error", text: t.settings.importFailed(toMessage(error)) });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyExportScript = async () => {
    const script = buildExportScript(images.missing, CAMO_IMAGE_SIZE, WEAPON_IMAGE_SIZE);
    try {
      await navigator.clipboard.writeText(script);
      setImageFeedback({ tone: "info", text: t.settings.exportScriptCopied });
    } catch (error) {
      setImageFeedback({ tone: "error", text: t.settings.exportScriptFailed(toMessage(error)) });
    }
  };

  const catalogFeedback: Feedback =
    catalogStatus.state === "success"
      ? {
          tone: "info",
          text: t.settings.updateDataDone(catalogStatus.addedWeapons, catalogStatus.addedCamos),
        }
      : catalogStatus.state === "error"
        ? { tone: "error", text: t.settings.updateDataFailed(catalogStatus.detail) }
        : null;

  const { status } = appUpdate;
  const appFeedback: Feedback =
    status.state === "upToDate"
      ? { tone: "info", text: t.settings.upToDate }
      : status.state === "available"
        ? { tone: "info", text: t.settings.updateAvailable(status.version) }
        : status.state === "error"
          ? {
              tone: "error",
              text:
                status.phase === "check"
                  ? t.settings.updateCheckFailed(status.detail)
                  : t.settings.updateInstallFailed(status.detail),
            }
          : null;

  return (
    <section className="settings" aria-label={t.settings.title}>
      <div className="detail-header">
        <button type="button" className="text-button" onClick={onBack}>
          ← {t.back}
        </button>
        <h2>{t.settings.title}</h2>
      </div>

      <div className="setting-group">
        <h3 className="section-title">{t.settings.language}</h3>
        <div className="segmented" role="radiogroup" aria-label={t.settings.language}>
          {(["zh", "en"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={settings.language === item}
              onClick={() => onSettingsChange({ language: item })}
            >
              {t.settings.languages[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3 className="section-title">{t.settings.appearance}</h3>
        <label className="setting-row">
          <span className="setting-label">{t.settings.opacity}</span>
          <input
            type="range"
            className="slider"
            min={MIN_OVERLAY_OPACITY}
            max={1}
            step={0.05}
            value={settings.overlayOpacity}
            onChange={(event) => onSettingsChange({ overlayOpacity: event.target.valueAsNumber })}
          />
          <span className="stat">{Math.round(settings.overlayOpacity * 100)}%</span>
        </label>
        {appUpdate.isAvailable && <p className="setting-note">{t.settings.resizeHint}</p>}
      </div>

      <div className="setting-group">
        <h3 className="section-title">{t.settings.shortcuts}</h3>
        <ShortcutRecorder
          label={t.settings.toggleOverlay}
          value={shortcuts.toggleOverlay}
          otherValue={shortcuts.toggleClickThrough}
          onChange={(toggleOverlay) =>
            onSettingsChange({ shortcuts: { ...shortcuts, toggleOverlay } })
          }
        />
        <ShortcutRecorder
          label={t.settings.toggleClickThrough}
          value={shortcuts.toggleClickThrough}
          otherValue={shortcuts.toggleOverlay}
          onChange={(toggleClickThrough) =>
            onSettingsChange({ shortcuts: { ...shortcuts, toggleClickThrough } })
          }
        />
        <button
          type="button"
          className="text-button"
          onClick={() => onSettingsChange({ shortcuts: DEFAULT_SHORTCUTS })}
        >
          {t.settings.resetShortcuts}
        </button>
      </div>

      <div className="setting-group">
        <h3 className="section-title">{t.settings.data}</h3>
        <p className="setting-note">
          {t.settings.dataSource(
            isOnlineData ? t.settings.sourceOnline : t.settings.sourceBundled,
            formattedDate,
          )}
        </p>
        <button
          type="button"
          className="text-button is-primary"
          disabled={catalogStatus.state === "loading"}
          onClick={onRefreshCatalog}
        >
          {catalogStatus.state === "loading" ? t.settings.updatingData : t.settings.updateData}
        </button>
        <FeedbackText feedback={catalogFeedback} />
      </div>

      <div className="setting-group">
        <h3 className="section-title">{t.settings.images}</h3>
        <p className="setting-note">{t.settings.imagesSummary(images.missing.length)}</p>
        <div className="button-row">
          <button
            type="button"
            className="text-button is-primary"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            {t.settings.importImages}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={images.missing.length === 0}
            onClick={() => void copyExportScript()}
          >
            {t.settings.copyExportScript}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept=".webp,.png,.jpg,.jpeg,.zip,.json"
          onChange={(event) => void handleImport(event.target.files)}
        />
        <p className="setting-note">{t.settings.importHint}</p>
        <p className="setting-note">
          {images.missing.length === 0
            ? t.settings.exportScriptNothingMissing
            : t.settings.exportScriptHint}
        </p>
        <FeedbackText feedback={imageFeedback} />
      </div>

      <div className="setting-group">
        <h3 className="section-title">{t.settings.app}</h3>
        {appUpdate.isAvailable ? (
          <>
            {appUpdate.version && (
              <p className="setting-note">{t.settings.version(appUpdate.version)}</p>
            )}
            <div className="button-row">
              <button
                type="button"
                className="text-button"
                disabled={status.state === "checking" || status.state === "installing"}
                onClick={appUpdate.checkForUpdate}
              >
                {status.state === "checking" ? t.settings.checkingUpdate : t.settings.checkUpdate}
              </button>
              {(status.state === "available" || status.state === "installing") && (
                <button
                  type="button"
                  className="text-button is-primary"
                  disabled={status.state === "installing"}
                  onClick={appUpdate.installUpdate}
                >
                  {status.state === "installing"
                    ? t.settings.installingUpdate(status.percent)
                    : t.settings.installUpdate}
                </button>
              )}
            </div>
            <FeedbackText feedback={appFeedback} />
          </>
        ) : (
          <p className="setting-note">{t.settings.desktopOnly}</p>
        )}
      </div>
    </section>
  );
}

function FeedbackText({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p className={feedback.tone === "error" ? "setting-error" : "setting-success"} role="status">
      {feedback.text}
    </p>
  );
}
