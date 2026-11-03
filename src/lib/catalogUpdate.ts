import { CODMUNITY_API_URL, transformCodmunity } from "../data/codmunity";
import type { Catalog } from "../data/schema";

export interface CatalogDiff {
  addedWeapons: number;
  addedCamos: number;
}

/** 已知的武器中文名：codmunity 中文名不在迷彩接口中，沿用内置与缓存数据里的翻译 */
export function collectZhWeaponNames(...catalogs: Catalog[]): Record<string, string> {
  const entries = catalogs.flatMap((catalog) =>
    catalog.weapons.flatMap((weapon) => (weapon.nameZh ? [[weapon.name, weapon.nameZh]] : [])),
  );
  return Object.fromEntries(entries);
}

export async function fetchLatestCatalog(
  zhWeaponNames: Record<string, string>,
  signal?: AbortSignal,
): Promise<Catalog> {
  const response = await fetch(CODMUNITY_API_URL, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
  return transformCodmunity(await response.json(), zhWeaponNames);
}

export function diffCatalog(previous: Catalog, next: Catalog): CatalogDiff {
  const camoKeys = (catalog: Catalog) =>
    new Set(
      catalog.weapons.flatMap((weapon) => weapon.camos.mp.map((camo) => `${weapon.id}:${camo.id}`)),
    );
  const previousWeapons = new Set(previous.weapons.map((weapon) => weapon.id));
  const previousCamos = camoKeys(previous);
  return {
    addedWeapons: next.weapons.filter((weapon) => !previousWeapons.has(weapon.id)).length,
    addedCamos: [...camoKeys(next)].filter((key) => !previousCamos.has(key)).length,
  };
}
