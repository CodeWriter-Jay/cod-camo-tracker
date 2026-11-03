import { copy } from "../copy";
import { catalog, type Camo, type ModeId, type Weapon } from "../data/catalog";
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

const modeName = (mode: ModeId) => catalog.modes.find((item) => item.id === mode)?.name ?? mode;

export function FavoritesPanel({
  favorites,
  progress,
  onCountChange,
  onToggleFavorite,
  onOpenWeapon,
}: FavoritesPanelProps) {
  const items = resolveFavorites(catalog, favorites);

  return (
    <section className="panel" aria-label={copy.favoritesTitle}>
      <h2 className="section-title">
        {copy.favoritesTitle}
        <span className="badge">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <p className="empty">{copy.favoritesEmpty}</p>
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
                    {weapon.name}
                  </button>
                  <span className="tag">{modeName(mode)}</span>
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
