import type { ReactNode } from "react";
import { copy } from "../copy";
import type { Trackable } from "../data/catalog";
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
        <span className="camo-name">{camo.name}</span>
        <span className="camo-challenge" title={camo.challenge.en}>
          {camo.challenge.zh}
        </span>
      </div>
      {onToggleFavorite && (
        <button
          type="button"
          className="icon-button star"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? copy.unfavorite(camo.name) : copy.favorite(camo.name)}
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
            aria-label={copy.doneLabel(camo.name)}
            onChange={(event) => onCountChange(event.target.checked ? 1 : 0)}
          />
          <span className="check-box" aria-hidden />
        </label>
      ) : (
        <div className="counter">
          <button
            type="button"
            className="icon-button"
            aria-label={copy.decrease(camo.name)}
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
              aria-label={copy.countLabel(camo.name)}
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
            aria-label={copy.increase(camo.name)}
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
            {copy.markDone}
          </button>
        </div>
      )}
    </li>
  );
}
