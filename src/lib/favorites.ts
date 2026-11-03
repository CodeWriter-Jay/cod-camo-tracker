import type { Camo, Catalog, ModeId, Weapon } from "../data/catalog";
import {
  camoKey,
  getNextCamo,
  getPrerequisites,
  isDone,
  setDone,
  type Completed,
} from "./progress";

export interface TrackerData {
  completed: Completed;
  /** 收藏的武器迷彩，元素为 camoKey，与模式无关，按收藏顺序排列 */
  favorites: string[];
}

export interface ResolvedFavorite {
  key: string;
  weapon: Weapon;
  /** 当前模式下的迷彩（挑战要求随模式变化） */
  camo: Camo;
}

export function toggleFavorite(favorites: string[], key: string): string[] {
  return favorites.includes(key) ? favorites.filter((item) => item !== key) : [...favorites, key];
}

/**
 * 已收藏的迷彩完成后，用来接替它的收藏（同一把武器内）：
 * - 特殊迷彩：若该武器还有其他未完成的特殊迷彩在收藏中，只移除不接替；
 *   否则接替下一个未完成的特殊迷彩，特殊迷彩全部完成后才接替其后的迷彩（黄金）
 * - 其他迷彩：接替其后的下一个未完成迷彩
 */
function getSuccessor(
  completed: Completed,
  favorites: string[],
  weapon: Weapon,
  camo: Camo,
): Camo | null {
  const isPending = (item: Camo) => !isDone(completed, camoKey(weapon.id, item.id));
  if (camo.group !== "special") return getNextCamo(completed, weapon, camo.id);

  const camos = weapon.camos.mp;
  const specials = camos.filter((item) => item.group === "special");
  const hasOtherFavoritedSpecial = specials.some(
    (item) =>
      item.id !== camo.id && isPending(item) && favorites.includes(camoKey(weapon.id, item.id)),
  );
  if (hasOtherFavoritedSpecial) return null;

  const position = specials.findIndex((item) => item.id === camo.id) + 1;
  const nextSpecial = [...specials.slice(position), ...specials.slice(0, position)].find(isPending);
  if (nextSpecial) return nextSpecial;
  const lastSpecialIndex = camos.findLastIndex((item) => item.group === "special");
  return camos.slice(lastSpecialIndex + 1).find(isPending) ?? null;
}

/**
 * 标记武器迷彩完成状态。勾选时连同前置迷彩一起完成（见 getPrerequisites），取消勾选只影响该迷彩。
 * 因此变为完成的收藏会在原位置换成接替的迷彩（见 getSuccessor），方便继续追踪。
 */
export function applyCompletionChange(
  data: TrackerData,
  weapon: Weapon,
  camoId: string,
  done: boolean,
): TrackerData {
  const key = camoKey(weapon.id, camoId);
  if (!done) return { ...data, completed: setDone(data.completed, key, false) };

  const newlyDone = new Set(
    [camoId, ...getPrerequisites(weapon, camoId).map((camo) => camo.id)]
      .map((id) => camoKey(weapon.id, id))
      .filter((item) => !isDone(data.completed, item)),
  );
  const completed = [...newlyDone].reduce(
    (result, item) => setDone(result, item, true),
    data.completed,
  );

  // 逐个处理，后续判断能看到之前已移除或接替的结果，避免重复与误判
  let favorites = data.favorites;
  for (const favorite of data.favorites) {
    if (!newlyDone.has(favorite)) continue;
    const camo = weapon.camos.mp.find((item) => camoKey(weapon.id, item.id) === favorite);
    const successor = camo && getSuccessor(completed, favorites, weapon, camo);
    const successorKey = successor ? camoKey(weapon.id, successor.id) : null;
    favorites = favorites.flatMap((item) => {
      if (item !== favorite) return [item];
      return successorKey !== null && !favorites.includes(successorKey) ? [successorKey] : [];
    });
  }
  return { completed, favorites };
}

/** 把收藏 key 还原为武器与当前模式的迷彩；数据更新后已不存在的条目会被忽略 */
export function resolveFavorites(
  catalog: Catalog,
  favorites: string[],
  mode: ModeId,
): ResolvedFavorite[] {
  return favorites.flatMap((key) => {
    const [weaponId, camoId] = key.split(":");
    const weapon = catalog.weapons.find((item) => item.id === weaponId);
    const camo = weapon?.camos[mode].find((item) => item.id === camoId);
    return weapon && camo ? [{ key, weapon, camo }] : [];
  });
}

/** 迁移 0.2.0 及之前带模式前缀的收藏（`${mode}:${weaponId}:${camoId}`），去重并保持顺序 */
export const migrateFavorites = (favorites: string[]) => [
  ...new Set(
    favorites.map((key) => {
      const parts = key.split(":");
      return parts.length === 3 ? `${parts[1]}:${parts[2]}` : key;
    }),
  ),
];
