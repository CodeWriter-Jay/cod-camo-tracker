import type { ReactNode } from "react";
import type { Trackable } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { getTarget } from "../lib/progress";
import { CamoImage } from "./CamoImage";

interface CamoRowProps {
  camo: Trackable;
  count: number;
  onCountChange: (count: number) => void;
  /** 显示在迷彩名上方的补充信息，如收藏列表中的武器名 */
  eyebrow?: ReactNode;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function CamoRow({
  camo,
  count,
  onCountChange,
  eyebrow,
  isFavorite = false,
  onToggleFavorite,
}: CamoRowProps) {
  const { t, camoName, challengeText, language } = useI18n();
  const name = camoName(camo);
  const target = getTarget(camo);
  const isDone = count >= target;
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
      {target === 1 ? (
        <label className="check">
          <input
            type="checkbox"
            checked={isDone}
            aria-label={t.doneLabel(name)}
            onChange={(event) => onCountChange(event.target.checked ? 1 : 0)}
          />
          <span className="check-box" aria-hidden />
        </label>
      ) : (
        <div className="counter">
          <button
            type="button"
            className="icon-button"
            aria-label={t.decrease(name)}
            disabled={count === 0}
            onClick={() => onCountChange(count - 1)}
          >
            −
          </button>
          <span className="counter-value">
            <input
              type="number"
              min={0}
              max={target}
              value={count}
              aria-label={t.countLabel(name)}
              onChange={(event) => {
                const value = event.target.valueAsNumber;
                if (!Number.isNaN(value)) onCountChange(value);
              }}
            />
            <span className="counter-target">/{target}</span>
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label={t.increase(name)}
            disabled={isDone}
            onClick={() => onCountChange(count + 1)}
          >
            +
          </button>
          <button
            type="button"
            className="text-button"
            disabled={isDone}
            onClick={() => onCountChange(target)}
          >
            {t.markDone}
          </button>
        </div>
      )}
    </li>
  );
}
