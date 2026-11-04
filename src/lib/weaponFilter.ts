import type { Camo, Weapon } from "../data/catalog";
import { camoKey, isDone, type Completed } from "./progress";

export interface WeaponFilter {
  query: string;
  /** 选中的武器类别，空数组表示不限 */
  categories: string[];
  /** 只看该迷彩未完成的武器，null 表示不限 */
  unfinishedCamoId: string | null;
}

export const EMPTY_WEAPON_FILTER: WeaponFilter = {
  query: "",
  categories: [],
  unfinishedCamoId: null,
};

export const isFilterActive = (filter: WeaponFilter) =>
  filter.query.trim() !== "" || filter.categories.length > 0 || filter.unfinishedCamoId !== null;

/** 可按未完成筛选的迷彩：黄金及之后的完成者迷彩，按游戏内顺序去重 */
export function getFilterableCamos(weapons: Weapon[]): Camo[] {
  const camos = new Map<string, Camo>();
  for (const weapon of weapons) {
    for (const camo of weapon.camos.mp) {
      if (camo.group === "completionist" && !camos.has(camo.id)) camos.set(camo.id, camo);
    }
  }
  return [...camos.values()];
}

export function filterWeapons(
  weapons: Weapon[],
  filter: WeaponFilter,
  completed: Completed,
): Weapon[] {
  const query = filter.query.trim().toLowerCase();
  const { categories, unfinishedCamoId } = filter;
  return weapons.filter(
    (weapon) =>
      (categories.length === 0 || categories.includes(weapon.category)) &&
      // 中英文名都可搜索
      [weapon.name, weapon.nameZh ?? ""].some((name) => name.toLowerCase().includes(query)) &&
      // 没有该迷彩的武器（如近战）不在未完成之列
      (unfinishedCamoId === null ||
        (weapon.camos.mp.some((camo) => camo.id === unfinishedCamoId) &&
          !isDone(completed, camoKey(weapon.id, unfinishedCamoId)))),
  );
}
