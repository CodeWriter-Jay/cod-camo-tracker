import { z } from "zod";
import type { Catalog, ModeId, Trackable, Weapon } from "../data/catalog";

/** 键为 `${mode}:${ownerId}:${camoId}`，值为已完成次数 */
export const progressSchema = z.record(z.string(), z.number().int().nonnegative());
export type Progress = z.infer<typeof progressSchema>;

export interface Completion {
  completed: number;
  total: number;
}

/** 精通迷彩属于账号而非某把武器，用固定 id 作为归属 */
export const ACCOUNT_OWNER_ID = "account";

export const progressKey = (mode: ModeId, ownerId: string, camoId: string) =>
  `${mode}:${ownerId}:${camoId}`;

export const getTarget = (camo: Trackable) => camo.challenge.target;

export const getCount = (progress: Progress, mode: ModeId, ownerId: string, camo: Trackable) =>
  progress[progressKey(mode, ownerId, camo.id)] ?? 0;

export const isCamoComplete = (
  progress: Progress,
  mode: ModeId,
  ownerId: string,
  camo: Trackable,
) => getCount(progress, mode, ownerId, camo) >= getTarget(camo);

export function setCount(
  progress: Progress,
  mode: ModeId,
  ownerId: string,
  camo: Trackable,
  count: number,
): Progress {
  const key = progressKey(mode, ownerId, camo.id);
  const clamped = Math.min(Math.max(Math.trunc(count), 0), getTarget(camo));
  if (clamped === 0) {
    const next = { ...progress };
    delete next[key];
    return next;
  }
  return { ...progress, [key]: clamped };
}

export function getWeaponCompletion(progress: Progress, mode: ModeId, weapon: Weapon): Completion {
  const camos = weapon.camos[mode];
  return {
    completed: camos.filter((camo) => isCamoComplete(progress, mode, weapon.id, camo)).length,
    total: camos.length,
  };
}

export function getOverallCompletion(
  progress: Progress,
  mode: ModeId,
  weapons: Weapon[],
): Completion {
  return weapons.reduce<Completion>(
    (sum, weapon) => {
      const { completed, total } = getWeaponCompletion(progress, mode, weapon);
      return { completed: sum.completed + completed, total: sum.total + total };
    },
    { completed: 0, total: 0 },
  );
}

/**
 * 下一个未完成的迷彩：从 afterCamoId 之后按游戏内顺序查找，找不到再从头查找；
 * 不传 afterCamoId 时即第一个未完成的迷彩
 */
export function getNextCamo(
  progress: Progress,
  mode: ModeId,
  weapon: Weapon,
  afterCamoId?: string,
) {
  const camos = weapon.camos[mode];
  const start = camos.findIndex((camo) => camo.id === afterCamoId) + 1;
  const ordered = [...camos.slice(start), ...camos.slice(0, start)];
  return ordered.find((camo) => !isCamoComplete(progress, mode, weapon.id, camo)) ?? null;
}

/** Divergence 需要若干把武器完成指定迷彩，由各武器进度推导，不单独存储 */
export function getDivergenceCompletion(
  progress: Progress,
  mode: ModeId,
  catalog: Catalog,
): Completion {
  const { requiredCamoId, required } = catalog.divergence;
  const completed = catalog.weapons.filter((weapon) => {
    const camo = weapon.camos[mode].find((item) => item.id === requiredCamoId);
    return camo !== undefined && isCamoComplete(progress, mode, weapon.id, camo);
  }).length;
  return { completed: Math.min(completed, required), total: required };
}
