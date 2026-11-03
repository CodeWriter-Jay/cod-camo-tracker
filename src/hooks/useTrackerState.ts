import { useCallback, useEffect, useState } from "react";
import type { Camo, ModeId, Trackable, Weapon } from "../data/catalog";
import { applyCountChange, toggleFavorite } from "../lib/favorites";
import { ACCOUNT_OWNER_ID, setCount } from "../lib/progress";
import {
  createDefaultState,
  loadState,
  saveState,
  type PersistedState,
  type Settings,
} from "../lib/storage";

type LoadStatus =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PersistedState };

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useTrackerState() {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>({ status: "loading" });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    loadState()
      .then((data) => {
        if (!isCancelled) setLoadStatus({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!isCancelled) setLoadStatus({ status: "error", message: toMessage(error) });
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const update = useCallback((recipe: (data: PersistedState) => PersistedState) => {
    setLoadStatus((current) => {
      if (current.status !== "ready") return current;
      return { status: "ready", data: recipe(current.data) };
    });
  }, []);

  const data = loadStatus.status === "ready" ? loadStatus.data : null;

  // 进度变化后写回本地存储（Tauri store 自带 200ms 防抖落盘）
  useEffect(() => {
    if (!data) return;
    saveState(data)
      .then(() => setSaveError(null))
      .catch((error: unknown) => setSaveError(toMessage(error)));
  }, [data]);

  const changeCamoCount = useCallback(
    (mode: ModeId, weapon: Weapon, camo: Camo, count: number) =>
      update((current) => ({
        ...current,
        ...applyCountChange(current, mode, weapon, camo, count),
      })),
    [update],
  );

  const changeMasteryCount = useCallback(
    (mode: ModeId, camo: Trackable, count: number) =>
      update((current) => ({
        ...current,
        progress: setCount(current.progress, mode, ACCOUNT_OWNER_ID, camo, count),
      })),
    [update],
  );

  const toggleFavoriteKey = useCallback(
    (key: string) =>
      update((current) => ({ ...current, favorites: toggleFavorite(current.favorites, key) })),
    [update],
  );

  const updateSettings = useCallback(
    (changes: Partial<Settings>) =>
      update((current) => ({ ...current, settings: { ...current.settings, ...changes } })),
    [update],
  );

  // 本地数据损坏时允许用户清空重来，否则应用无法继续使用
  const resetState = useCallback(() => {
    setLoadStatus({ status: "ready", data: createDefaultState() });
  }, []);

  return {
    loadStatus,
    saveError,
    changeCamoCount,
    changeMasteryCount,
    toggleFavoriteKey,
    updateSettings,
    resetState,
  };
}
