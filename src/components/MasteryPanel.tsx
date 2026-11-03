import { useCatalog, type ModeId, type Trackable } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
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
  const catalog = useCatalog();
  const { t, camoName } = useI18n();
  const { divergence } = catalog;
  const divergenceCompletion = getDivergenceCompletion(progress, mode, catalog);
  const requiredCamo = catalog.weapons
    .flatMap((weapon) => weapon.camos[mode])
    .find((camo) => camo.id === divergence.requiredCamoId);
  const requiredCamoName = requiredCamo ? camoName(requiredCamo) : divergence.requiredCamoId;

  return (
    <section className="panel" aria-label={t.masteryTitle}>
      <h2 className="section-title">{t.masteryTitle}</h2>
      <div className="divergence">
        <CamoImage file={divergence.image} />
        <div className="camo-info">
          <span className="camo-name">{divergence.name}</span>
          <span className="camo-challenge">
            {t.divergenceHint(requiredCamoName, divergence.required)}
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
