import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { z } from "zod";
import { modeIdSchema } from "../data/catalog";
import { progressSchema } from "./progress";

const STORE_FILE = "tracker.json";
const STATE_KEY = "state";
// 浏览器预览（pnpm dev）没有 Tauri 运行时，改用 localStorage
const LOCAL_STORAGE_KEY = "cod-camo-tracker:state";

// 旧版本存有 settings.pinnedWeaponId，zod 默认会剥离未知字段；favorites 为新增字段，缺省为空
const persistedStateSchema = z.object({
  progress: progressSchema,
  favorites: z.array(z.string()).default([]),
  settings: z.object({
    mode: modeIdSchema,
  }),
});

export type PersistedState = z.infer<typeof persistedStateSchema>;

export const DEFAULT_STATE: PersistedState = {
  progress: {},
  favorites: [],
  settings: { mode: "dmz" },
};

function parseState(raw: unknown): PersistedState {
  if (raw === null || raw === undefined) return DEFAULT_STATE;
  const result = persistedStateSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`本地进度数据格式无效：${result.error.message}`);
  }
  return result.data;
}

let storePromise: ReturnType<typeof load> | null = null;
const getStore = () => (storePromise ??= load(STORE_FILE, { defaults: {}, autoSave: 200 }));

export async function loadState(): Promise<PersistedState> {
  if (!isTauri()) {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return parseState(raw === null ? null : JSON.parse(raw));
  }
  const store = await getStore();
  return parseState(await store.get(STATE_KEY));
}

export async function saveState(state: PersistedState): Promise<void> {
  if (!isTauri()) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    return;
  }
  const store = await getStore();
  await store.set(STATE_KEY, state);
}
