import { useState } from "react";
import { copy } from "../copy";
import type { Catalog, ModeId } from "../data/catalog";
import { getWeaponCompletion, type Progress } from "../lib/progress";
import { CamoImage } from "./CamoImage";
import { ProgressBar } from "./ProgressBar";

const ALL_CATEGORIES = "all";

interface WeaponListProps {
  catalog: Catalog;
  mode: ModeId;
  progress: Progress;
  onSelect: (weaponId: string) => void;
}

export function WeaponList({ catalog, mode, progress, onSelect }: WeaponListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const normalizedQuery = query.trim().toLowerCase();
  const weapons = catalog.weapons.filter(
    (weapon) =>
      (category === ALL_CATEGORIES || weapon.category === category) &&
      weapon.name.toLowerCase().includes(normalizedQuery),
  );

  return (
    <section className="panel">
      <h2 className="section-title">{copy.weaponsTitle}</h2>
      <div className="filters">
        <input
          type="search"
          value={query}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchLabel}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          value={category}
          aria-label={copy.categoryLabel}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value={ALL_CATEGORIES}>{copy.allCategories}</option>
          {catalog.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      {weapons.length === 0 ? (
        <p className="empty">{copy.noWeapons}</p>
      ) : (
        <ul className="weapon-grid">
          {weapons.map((weapon) => {
            const completion = getWeaponCompletion(progress, mode, weapon);
            return (
              <li key={weapon.id}>
                <button type="button" className="weapon-card" onClick={() => onSelect(weapon.id)}>
                  <CamoImage file={weapon.image} className="weapon-image" />
                  <span className="weapon-name">{weapon.name}</span>
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
