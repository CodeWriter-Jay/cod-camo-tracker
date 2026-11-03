import { copy } from "../copy";
import { catalog, type ModeId, type Trackable } from "../data/catalog";
import {
  ACCOUNT_OWNER_ID,
  getCount,
  getDivergenceCompletion,
  type Progress,
} from "../lib/progress";
import { CamoImage } from "./CamoImage";
import { CamoRow } from "./CamoRow";
import { ProgressBar } from "./ProgressBar";

interface MasteryPanelProps {
  mode: ModeId;
  progress: Progress;
  onCountChange: (camo: Trackable, count: number) => void;
}

export function MasteryPanel({ mode, progress, onCountChange }: MasteryPanelProps) {
  const { divergence } = catalog;
  const divergenceCompletion = getDivergenceCompletion(progress, mode, catalog);
  const requiredCamoName =
    catalog.weapons
      .flatMap((weapon) => weapon.camos[mode])
      .find((camo) => camo.id === divergence.requiredCamoId)?.name ?? divergence.requiredCamoId;

  return (
    <section className="panel" aria-label={copy.masteryTitle}>
      <h2 className="section-title">{copy.masteryTitle}</h2>
      <div className="divergence">
        <CamoImage file={divergence.image} />
        <div className="camo-info">
          <span className="camo-name">{divergence.name}</span>
          <span className="camo-challenge">
            {copy.divergenceHint(requiredCamoName, divergence.required)}
          </span>
          <ProgressBar {...divergenceCompletion} label={divergence.name} />
        </div>
        <span className="stat">
          {divergenceCompletion.completed}/{divergenceCompletion.total}
        </span>
      </div>
      <ul className="camo-list">
        {catalog.mastery[mode].map((camo) => (
          <CamoRow
            key={camo.id}
            camo={camo}
            count={getCount(progress, mode, ACCOUNT_OWNER_ID, camo)}
            onCountChange={(count) => onCountChange(camo, count)}
          />
        ))}
      </ul>
    </section>
  );
}
