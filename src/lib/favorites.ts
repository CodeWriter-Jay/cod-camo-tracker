import { modeIdSchema, type Camo, type Catalog, type ModeId, type Weapon } from "../data/catalog";
import { getNextCamo, isCamoComplete, progressKey, setCount, type Progress } from "./progress";

export interface TrackerData {
  progress: Progress;
  /** 收藏的武器迷彩挑战，元素为 progressKey，按收藏顺序排列 */
  favorites: string[];
}

export interface ResolvedFavorite {
  key: string;
  mode: ModeId;
  weapon: Weapon;
  camo: Camo;
}

export function toggleFavorite(favorites: string[], key: string): string[] {
  return favorites.includes(key) ? favorites.filter((item) => item !== key) : [...favorites, key];
}

/**
 * 修改挑战进度。若该挑战已收藏且因此完成，则移出收藏，
 * 并在原位置换成同一武器在其后的下一个未完成迷彩，方便继续追踪。
 */
export function applyCountChange(
  data: TrackerData,
  mode: ModeId,
  weapon: Weapon,
  camo: Camo,
  count: number,
): TrackerData {
  const progress = setCount(data.progress, mode, weapon.id, camo, count);
  const key = progressKey(mode, weapon.id, camo.id);
  if (!data.favorites.includes(key) || !isCamoComplete(progress, mode, weapon.id, camo)) {
    return { ...data, progress };
  }

  const nextCamo = getNextCamo(progress, mode, weapon, camo.id);
  const nextKey = nextCamo && progressKey(mode, weapon.id, nextCamo.id);
  const favorites = data.favorites.flatMap((item) => {
    if (item !== key) return [item];
    return nextKey !== null && !data.favorites.includes(nextKey) ? [nextKey] : [];
  });
  return { progress, favorites };
}

/** 把收藏 key 还原为武器与迷彩；数据更新后已不存在的条目会被忽略 */
export function resolveFavorites(catalog: Catalog, favorites: string[]): ResolvedFavorite[] {
  return favorites.flatMap((key) => {
    const [rawMode, weaponId, camoId] = key.split(":");
    const mode = modeIdSchema.safeParse(rawMode);
    if (!mode.success) return [];
    const weapon = catalog.weapons.find((item) => item.id === weaponId);
    const camo = weapon?.camos[mode.data].find((item) => item.id === camoId);
    return weapon && camo ? [{ key, mode: mode.data, weapon, camo }] : [];
  });
}
