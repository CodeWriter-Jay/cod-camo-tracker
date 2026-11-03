import { useCatalog, type ModeId } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { getDivergenceCompletion, isDone, masteryKey, type Completed } from "../lib/progress";
import { CamoImage } from "./CamoImage";
import { CamoRow } from "./CamoRow";
import { ProgressBar } from "./ProgressBar";

interface MasteryPanelProps {
  mode: ModeId;
  completed: Completed;
  onDoneChange: (camoId: string, done: boolean) => void;
}

export function MasteryPanel({ mode, completed, onDoneChange }: MasteryPanelProps) {
  const catalog = useCatalog();
  const { t, camoName } = useI18n();
  const { divergence } = catalog;
  const divergenceCompletion = getDivergenceCompletion(completed, catalog);
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
            isDone={isDone(completed, masteryKey(mode, camo.id))}
            onDoneChange={(done) => onDoneChange(camo.id, done)}
          />
        ))}
      </ul>
    </section>
  );
}
