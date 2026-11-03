import { useState, type KeyboardEvent } from "react";
import { useI18n } from "../i18n/I18nContext";
import { hasModifier, toAccelerator } from "../lib/shortcut";

interface ShortcutRecorderProps {
  label: string;
  value: string;
  /** 另一个快捷键，用于防止两个快捷键相同；空字符串表示未设置 */
  otherValue: string;
  onChange: (accelerator: string) => void;
}

export function ShortcutRecorder({ label, value, otherValue, onChange }: ShortcutRecorderProps) {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopRecording = () => setIsRecording(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isRecording) return;
    event.preventDefault();
    if (event.key === "Escape") {
      stopRecording();
      return;
    }
    const accelerator = toAccelerator(event);
    if (!accelerator) return;
    if (!hasModifier(accelerator)) {
      setError(t.settings.shortcutNeedsModifier);
      return;
    }
    if (otherValue !== "" && accelerator === otherValue) {
      setError(t.settings.shortcutDuplicate);
      return;
    }
    setError(null);
    stopRecording();
    onChange(accelerator);
  };

  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <button
        type="button"
        className={isRecording ? "kbd is-recording" : "kbd"}
        aria-label={`${label}: ${value || t.settings.shortcutUnset}`}
        onClick={() => {
          setError(null);
          setIsRecording((current) => !current);
        }}
        onKeyDown={handleKeyDown}
        onBlur={stopRecording}
      >
        {isRecording ? t.settings.recording : value || t.settings.shortcutUnset}
      </button>
      <button
        type="button"
        className="text-button"
        disabled={value === ""}
        onClick={() => {
          setError(null);
          onChange("");
        }}
      >
        {t.settings.clearShortcut}
      </button>
      {error && (
        <span className="setting-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
