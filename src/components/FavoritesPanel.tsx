import { useCatalog, type ModeId, type Weapon } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { resolveFavorites } from "../lib/favorites";
import { isDone, type Completed } from "../lib/progress";
import { CamoRow } from "./CamoRow";

interface FavoritesPanelProps {
  /** 当前模式，决定显示哪种模式的挑战要求 */
  mode: ModeId;
  favorites: string[];
  completed: Completed;
  onDoneChange: (weapon: Weapon, camoId: string, done: boolean) => void;
  onToggleFavorite: (key: string) => void;
  onOpenWeapon: (weaponId: string) => void;
}

export function FavoritesPanel({
  mode,
  favorites,
  completed,
  onDoneChange,
  onToggleFavorite,
  onOpenWeapon,
}: FavoritesPanelProps) {
  const catalog = useCatalog();
  const { t, weaponName } = useI18n();
  const items = resolveFavorites(catalog, favorites, mode);

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
          {items.map(({ key, weapon, camo }) => (
            <CamoRow
              key={key}
              camo={camo}
              isDone={isDone(completed, key)}
              eyebrow={
                <button type="button" className="link" onClick={() => onOpenWeapon(weapon.id)}>
                  {weaponName(weapon)}
                </button>
              }
              isFavorite
              onToggleFavorite={() => onToggleFavorite(key)}
              onDoneChange={(done) => onDoneChange(weapon, camo.id, done)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
