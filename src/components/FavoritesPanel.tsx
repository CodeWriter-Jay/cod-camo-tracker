import { useCatalog, type Camo, type ModeId, type Weapon } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { resolveFavorites } from "../lib/favorites";
import { getCount, type Progress } from "../lib/progress";
import { CamoRow } from "./CamoRow";

interface FavoritesPanelProps {
  favorites: string[];
  progress: Progress;
  onCountChange: (mode: ModeId, weapon: Weapon, camo: Camo, count: number) => void;
  onToggleFavorite: (key: string) => void;
  onOpenWeapon: (weaponId: string) => void;
}

export function FavoritesPanel({
  favorites,
  progress,
  onCountChange,
  onToggleFavorite,
  onOpenWeapon,
}: FavoritesPanelProps) {
  const catalog = useCatalog();
  const { t, weaponName } = useI18n();
  const items = resolveFavorites(catalog, favorites);

  return (
    <section className="panel" aria-label={t.favoritesTitle}>
      <h2 className="section-title">
        {t.favoritesTitle}
        <span className="badge">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="empty">{t.favoritesEmpty}</p>
      ) : (
        <ul className="camo-list">
          {items.map(({ key, mode, weapon, camo }) => (
            <CamoRow
              key={key}
              camo={camo}
              count={getCount(progress, mode, weapon.id, camo)}
              eyebrow={
                <>
                  <button type="button" className="link" onClick={() => onOpenWeapon(weapon.id)}>
                    {weaponName(weapon)}
                  </button>
                  <span className="tag">{t.modes[mode]}</span>
                </>
              }
              isFavorite
              onToggleFavorite={() => onToggleFavorite(key)}
              onCountChange={(count) => onCountChange(mode, weapon, camo, count)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
