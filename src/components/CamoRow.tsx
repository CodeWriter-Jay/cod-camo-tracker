import type { ReactNode } from "react";
import type { Trackable } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { CamoImage } from "./CamoImage";

interface CamoRowProps {
  camo: Trackable;
  isDone?: boolean;
  /** 不传时为只读展示（浮层模式），不显示收藏与勾选控件 */
  onDoneChange?: (done: boolean) => void;
  /** 显示在迷彩名上方的补充信息，如收藏列表中的武器名 */
  eyebrow?: ReactNode;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function CamoRow({
  camo,
  isDone = false,
  onDoneChange,
  eyebrow,
  isFavorite = false,
  onToggleFavorite,
}: CamoRowProps) {
  const { t, camoName, challengeText, language } = useI18n();
  const name = camoName(camo);
  const className = ["camo-row", isDone && "is-done", isFavorite && "is-favorite"]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={className}>
      <CamoImage file={camo.image} />
      <div className="camo-info">
        {eyebrow && <span className="camo-eyebrow">{eyebrow}</span>}
        <span className="camo-name">{name}</span>
        <span
          className="camo-challenge"
          title={language === "zh" ? camo.challenge.en : (camo.challenge.zh ?? undefined)}
        >
          {challengeText(camo)}
        </span>
      </div>
      {onToggleFavorite && (
        <button
          type="button"
          className="icon-button star"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? t.unfavorite(name) : t.favorite(name)}
          onClick={onToggleFavorite}
        >
          {isFavorite ? "★" : "☆"}
        </button>
      )}
      {onDoneChange && (
        <label className="check">
          <input
            type="checkbox"
            checked={isDone}
            aria-label={t.doneLabel(name)}
            onChange={(event) => onDoneChange(event.target.checked)}
          />
          <span className="check-box" aria-hidden />
        </label>
      )}
    </li>
  );
}
