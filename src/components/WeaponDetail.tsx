import type { Camo, CamoGroup, ModeId, Weapon } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { getCount, getWeaponCompletion, progressKey, type Progress } from "../lib/progress";
import { CamoImage } from "./CamoImage";
import { CamoRow } from "./CamoRow";
import { ProgressBar } from "./ProgressBar";

const GROUP_ORDER: CamoGroup[] = ["military", "special", "completionist"];

interface WeaponDetailProps {
  weapon: Weapon;
  mode: ModeId;
  progress: Progress;
  favorites: string[];
  onBack: () => void;
  onToggleFavorite: (key: string) => void;
  onCountChange: (camo: Camo, count: number) => void;
}

export function WeaponDetail({
  weapon,
  mode,
  progress,
  favorites,
  onBack,
  onToggleFavorite,
  onCountChange,
}: WeaponDetailProps) {
  const { t, weaponName } = useI18n();
  const completion = getWeaponCompletion(progress, mode, weapon);
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
                const key = progressKey(mode, weapon.id, camo.id);
                return (
                  <CamoRow
                    key={camo.id}
                    camo={camo}
                    count={getCount(progress, mode, weapon.id, camo)}
                    isFavorite={favorites.includes(key)}
                    onToggleFavorite={() => onToggleFavorite(key)}
                    onCountChange={(count) => onCountChange(camo, count)}
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
