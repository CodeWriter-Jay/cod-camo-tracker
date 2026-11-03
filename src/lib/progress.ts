import { z } from "zod";
import type { Camo, Catalog, ModeId, Weapon } from "../data/catalog";

/**
 * 已完成的挑战集合。武器迷彩在多人游戏与 DMZ 中任一模式完成即解锁，键为 `${weaponId}:${camoId}`；
 * 精通迷彩按模式分开，键为 `mastery:${mode}:${camoId}`
 */
export const completedSchema = z.record(z.string(), z.literal(true));
export type Completed = z.infer<typeof completedSchema>;

export interface Completion {
  completed: number;
  total: number;
}

export const camoKey = (weaponId: string, camoId: string) => `${weaponId}:${camoId}`;
export const masteryKey = (mode: ModeId, camoId: string) => `mastery:${mode}:${camoId}`;

export const isDone = (completed: Completed, key: string) => completed[key] === true;

export function setDone(completed: Completed, key: string, done: boolean): Completed {
  if (done) return { ...completed, [key]: true };
  const next = { ...completed };
  delete next[key];
  return next;
}

/** 两种模式的迷彩列表顺序与 id 一致，仅挑战要求不同；与模式无关的计算统一用多人游戏列表 */
const camosOf = (weapon: Weapon) => weapon.camos.mp;

export function getWeaponCompletion(completed: Completed, weapon: Weapon): Completion {
  const camos = camosOf(weapon);
  return {
    completed: camos.filter((camo) => isDone(completed, camoKey(weapon.id, camo.id))).length,
    total: camos.length,
  };
}

export function getOverallCompletion(completed: Completed, weapons: Weapon[]): Completion {
  return weapons.reduce<Completion>(
    (sum, weapon) => {
      const { completed: done, total } = getWeaponCompletion(completed, weapon);
      return { completed: sum.completed + done, total: sum.total + total };
    },
    { completed: 0, total: 0 },
  );
}

/**
 * 下一个未完成的迷彩：从 afterCamoId 之后按游戏内顺序查找，找不到再从头查找；
 * 不传 afterCamoId 时即第一个未完成的迷彩
 */
export function getNextCamo(
  completed: Completed,
  weapon: Weapon,
  afterCamoId?: string,
): Camo | null {
  const camos = camosOf(weapon);
  const start = camos.findIndex((camo) => camo.id === afterCamoId) + 1;
  const ordered = [...camos.slice(start), ...camos.slice(0, start)];
  return ordered.find((camo) => !isDone(completed, camoKey(weapon.id, camo.id))) ?? null;
}

/**
 * 勾选某迷彩时一并视为完成的前置迷彩（仅限同一把武器）：
 * 军事迷彩依赖之前的军事迷彩；特殊迷彩互相独立、也不依赖军事迷彩；完成者迷彩依赖之前的全部迷彩
 */
export function getPrerequisites(weapon: Weapon, camoId: string): Camo[] {
  const camos = camosOf(weapon);
  const index = camos.findIndex((camo) => camo.id === camoId);
  if (index === -1) return [];
  const before = camos.slice(0, index);
  switch (camos[index].group) {
    case "military":
      return before.filter((camo) => camo.group === "military");
    case "special":
      return [];
    case "completionist":
      return before;
  }
}

/** Divergence 需要若干把武器完成指定迷彩，由各武器进度推导，不单独存储 */
export function getDivergenceCompletion(completed: Completed, catalog: Catalog): Completion {
  const { requiredCamoId, required } = catalog.divergence;
  const done = catalog.weapons.filter(
    (weapon) =>
      camosOf(weapon).some((camo) => camo.id === requiredCamoId) &&
      isDone(completed, camoKey(weapon.id, requiredCamoId)),
  ).length;
  return { completed: Math.min(done, required), total: required };
}

/**
 * 迁移 0.2.0 及之前按模式计数的进度（键为 `${mode}:${ownerId}:${camoId}`）：
 * 武器迷彩在任一模式达到要求即视为完成；精通迷彩（ownerId 为 account）保留各自模式
 */
export function migrateCountProgress(legacy: Record<string, number>, catalog: Catalog): Completed {
  const migrated: Completed = {};
  for (const [key, count] of Object.entries(legacy)) {
    const [mode, ownerId, camoId] = key.split(":");
    if (mode !== "mp" && mode !== "dmz") continue;
    if (ownerId === "account") {
      const camo = catalog.mastery[mode].find((item) => item.id === camoId);
      if (camo && count >= camo.challenge.target) migrated[masteryKey(mode, camoId)] = true;
      continue;
    }
    const camo = catalog.weapons
      .find((weapon) => weapon.id === ownerId)
      ?.camos[mode].find((item) => item.id === camoId);
    if (camo && count >= camo.challenge.target) migrated[camoKey(ownerId, camoId)] = true;
  }
  return migrated;
}
