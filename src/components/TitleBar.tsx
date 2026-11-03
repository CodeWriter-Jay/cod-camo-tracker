import { useI18n } from "../i18n/I18nContext";

interface TitleBarProps {
  isDesktop: boolean;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  isOverlayVisible: boolean;
  onToggleOverlay: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
}

/** 主窗口标题栏：拖动区域、浮层开关、设置与窗口控制按钮 */
export function TitleBar({
  isDesktop,
  isSettingsOpen,
  onToggleSettings,
  isOverlayVisible,
  onToggleOverlay,
  onMinimize,
  onToggleMaximize,
  onClose,
}: TitleBarProps) {
  const { t } = useI18n();
  // 浏览器预览没有多窗口能力，按钮保留但禁用，保证界面与桌面端一致
  const desktopOnly = isDesktop ? undefined : t.settings.desktopOnly;

  return (
    <header className="app-header" data-tauri-drag-region>
      <div className="brand" data-tauri-drag-region>
        <span className="brand-mark" aria-hidden />
        <h1 data-tauri-drag-region>{t.appTitle}</h1>
        <span className="tag">{t.appSubtitle}</span>
      </div>
      <div className="header-actions">
        <button
          type="button"
          className={isOverlayVisible ? "text-button" : "text-button is-primary"}
          aria-pressed={isOverlayVisible}
          disabled={!isDesktop}
          title={desktopOnly}
          onClick={onToggleOverlay}
        >
          {isOverlayVisible ? t.closeOverlay : t.enterOverlay}
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={t.openSettings}
          aria-pressed={isSettingsOpen}
          onClick={onToggleSettings}
        >
          ⚙
        </button>
        <div className="window-controls" title={desktopOnly}>
          <button
            type="button"
            className="window-control"
            aria-label={t.minimize}
            disabled={!isDesktop}
            onClick={onMinimize}
          >
            <svg viewBox="0 0 10 10" aria-hidden>
              <path d="M1 5h8" />
            </svg>
          </button>
          <button
            type="button"
            className="window-control"
            aria-label={t.maximize}
            disabled={!isDesktop}
            onClick={onToggleMaximize}
          >
            <svg viewBox="0 0 10 10" aria-hidden>
              <rect x="1.5" y="1.5" width="7" height="7" />
            </svg>
          </button>
          <button
            type="button"
            className="window-control is-close"
            aria-label={t.close}
            disabled={!isDesktop}
            onClick={onClose}
          >
            <svg viewBox="0 0 10 10" aria-hidden>
              <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
