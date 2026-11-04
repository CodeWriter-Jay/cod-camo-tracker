import { useCatalog } from "../data/catalog";
import { useI18n } from "../i18n/I18nContext";
import { getWeaponCompletion, type Completed } from "../lib/progress";
import {
  EMPTY_WEAPON_FILTER,
  filterWeapons,
  getFilterableCamos,
  isFilterActive,
  type WeaponFilter,
} from "../lib/weaponFilter";
import { CamoImage } from "./CamoImage";
import { ProgressBar } from "./ProgressBar";

const ANY_CAMO = "";

interface WeaponListProps {
  completed: Completed;
  /** 筛选条件由父组件持有，进出武器详情时保留 */
  filter: WeaponFilter;
  onFilterChange: (filter: WeaponFilter) => void;
  onSelect: (weaponId: string) => void;
}

export function WeaponList({ completed, filter, onFilterChange, onSelect }: WeaponListProps) {
  const catalog = useCatalog();
  const { t, weaponName, categoryName, camoName } = useI18n();
  const weapons = filterWeapons(catalog.weapons, filter, completed);
  const filterableCamos = getFilterableCamos(catalog.weapons);

  const toggleCategory = (categoryId: string) =>
    onFilterChange({
      ...filter,
      categories: filter.categories.includes(categoryId)
        ? filter.categories.filter((item) => item !== categoryId)
        : [...filter.categories, categoryId],
    });

  return (
    <section className="panel">
      <h2 className="section-title">{t.weaponsTitle}</h2>
      <div className="filters">
        <input
          type="search"
          value={filter.query}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchLabel}
          onChange={(event) => onFilterChange({ ...filter, query: event.target.value })}
        />
        <select
          value={filter.unfinishedCamoId ?? ANY_CAMO}
          aria-label={t.camoFilterLabel}
          onChange={(event) =>
            onFilterChange({ ...filter, unfinishedCamoId: event.target.value || null })
          }
        >
          <option value={ANY_CAMO}>{t.anyCamoProgress}</option>
          {filterableCamos.map((camo) => (
            <option key={camo.id} value={camo.id}>
              {t.unfinishedCamo(camoName(camo))}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="text-button"
          disabled={!isFilterActive(filter)}
          onClick={() => onFilterChange(EMPTY_WEAPON_FILTER)}
        >
          {t.clearFilters}
        </button>
      </div>
      <div className="category-chips" role="group" aria-label={t.categoryLabel}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter.categories.length === 0}
          onClick={() => onFilterChange({ ...filter, categories: [] })}
        >
          {t.allCategories}
        </button>
        {catalog.categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chip"
            aria-pressed={filter.categories.includes(item.id)}
            onClick={() => toggleCategory(item.id)}
          >
            {categoryName(item)}
          </button>
        ))}
      </div>
      {weapons.length === 0 ? (
        <p className="empty">{t.noWeapons}</p>
      ) : (
        <ul className="weapon-grid">
          {weapons.map((weapon) => {
            const completion = getWeaponCompletion(completed, weapon);
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
