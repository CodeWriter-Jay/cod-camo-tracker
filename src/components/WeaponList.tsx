import { useState } from "react";
import { useCatalog, type ModeId } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { getWeaponCompletion, type Progress } from "../lib/progress";
import { CamoImage } from "./CamoImage";
import { ProgressBar } from "./ProgressBar";

const ALL_CATEGORIES = "all";

interface WeaponListProps {
  mode: ModeId;
  progress: Progress;
  onSelect: (weaponId: string) => void;
}

export function WeaponList({ mode, progress, onSelect }: WeaponListProps) {
  const catalog = useCatalog();
  const { t, weaponName, categoryName } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const normalizedQuery = query.trim().toLowerCase();
  // 中英文名都可搜索
  const weapons = catalog.weapons.filter(
    (weapon) =>
      (category === ALL_CATEGORIES || weapon.category === category) &&
      [weapon.name, weapon.nameZh ?? ""].some((name) =>
        name.toLowerCase().includes(normalizedQuery),
      ),
  );

  return (
    <section className="panel">
      <h2 className="section-title">{t.weaponsTitle}</h2>
      <div className="filters">
        <input
          type="search"
          value={query}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchLabel}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          value={category}
          aria-label={t.categoryLabel}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value={ALL_CATEGORIES}>{t.allCategories}</option>
          {catalog.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {categoryName(item)}
            </option>
          ))}
        </select>
      </div>
      {weapons.length === 0 ? (
        <p className="empty">{t.noWeapons}</p>
      ) : (
        <ul className="weapon-grid">
          {weapons.map((weapon) => {
            const completion = getWeaponCompletion(progress, mode, weapon);
            return (
              <li key={weapon.id}>
                <button type="button" className="weapon-card" onClick={() => onSelect(weapon.id)}>
                  <CamoImage file={weapon.image} className="weapon-image" />
                  <span className="weapon-name">{weaponName(weapon)}</span>
                  <span className="stat">
                    {completion.completed}/{completion.total}
                  </span>
                  <ProgressBar {...completion} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
