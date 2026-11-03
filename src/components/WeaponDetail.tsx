import type { CamoGroup, ModeId, Weapon } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { camoKey, getWeaponCompletion, isDone, type Completed } from "../lib/progress";
import { CamoImage } from "./CamoImage";
import { CamoRow } from "./CamoRow";
import { ProgressBar } from "./ProgressBar";

const GROUP_ORDER: CamoGroup[] = ["military", "special", "completionist"];

interface WeaponDetailProps {
  weapon: Weapon;
  mode: ModeId;
  completed: Completed;
  favorites: string[];
  onBack: () => void;
  onToggleFavorite: (key: string) => void;
  onDoneChange: (camoId: string, done: boolean) => void;
}

export function WeaponDetail({
  weapon,
  mode,
  completed,
  favorites,
  onBack,
  onToggleFavorite,
  onDoneChange,
}: WeaponDetailProps) {
  const { t, weaponName } = useI18n();
  const completion = getWeaponCompletion(completed, weapon);
  const camos = weapon.camos[mode];

  return (
    <section className="weapon-detail" aria-label={weaponName(weapon)}>
      <div className="detail-header">
        <button type="button" className="text-button" onClick={onBack}>
          ← {t.back}
        </button>
        <CamoImage file={weapon.image} className="weapon-image" />
        <h2>{weaponName(weapon)}</h2>
        <span className="stat">
          {completion.completed}/{completion.total}
        </span>
      </div>
      <ProgressBar {...completion} label={weaponName(weapon)} />

      {camos.length === 0 && <p className="empty">{t.noChallenges}</p>}

      {GROUP_ORDER.map((group) => {
        const groupCamos = camos.filter((camo) => camo.group === group);
        if (groupCamos.length === 0) return null;
        return (
          <div key={group} className="camo-group">
            <h3 className="section-title">{t.groups[group]}</h3>
            <ul className="camo-list">
              {groupCamos.map((camo) => {
                const key = camoKey(weapon.id, camo.id);
                return (
                  <CamoRow
                    key={camo.id}
                    camo={camo}
                    isDone={isDone(completed, key)}
                    isFavorite={favorites.includes(key)}
                    onToggleFavorite={() => onToggleFavorite(key)}
                    onDoneChange={(done) => onDoneChange(camo.id, done)}
                  />
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
