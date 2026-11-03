import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { z } from "zod";
import { catalogSchema, modeIdSchema, type Catalog } from "../data/schema";
import { progressSchema } from "./progress";

const STORE_FILE = "tracker.json";
const STATE_KEY = "state";
const CATALOG_KEY = "catalog";
// 浏览器预览（pnpm dev）没有 Tauri 运行时，改用 localStorage
const LOCAL_STORAGE_PREFIX = "cod-camo-tracker:";

export const languageSchema = z.enum(["zh", "en"]);
export type Language = z.infer<typeof languageSchema>;

export const DEFAULT_SHORTCUTS = {
  toggleOverlay: "Alt+C",
  toggleClickThrough: "Alt+X",
};
export type Shortcuts = typeof DEFAULT_SHORTCUTS;

const detectLanguage = (): Language => (navigator.language.startsWith("zh") ? "zh" : "en");

// 旧版本缺少的字段均有默认值，旧数据可直接读取；未知字段（如 pinnedWeaponId）会被剥离
const persistedStateSchema = z.object({
  progress: progressSchema,
  favorites: z.array(z.string()).default([]),
  settings: z.object({
    mode: modeIdSchema.default("dmz"),
    language: languageSchema.default(detectLanguage),
    shortcuts: z
      .object({ toggleOverlay: z.string(), toggleClickThrough: z.string() })
      .default(DEFAULT_SHORTCUTS),
  }),
});

export type PersistedState = z.infer<typeof persistedStateSchema>;
export type Settings = PersistedState["settings"];

export const createDefaultState = (): PersistedState => ({
  progress: {},
  favorites: [],
  settings: { mode: "dmz", language: detectLanguage(), shortcuts: DEFAULT_SHORTCUTS },
});

let storePromise: ReturnType<typeof load> | null = null;
const getStore = () => (storePromise ??= load(STORE_FILE, { defaults: {}, autoSave: 200 }));

async function readValue(key: string): Promise<unknown> {
  if (!isTauri()) {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return raw === null ? null : JSON.parse(raw);
  }
  const store = await getStore();
  return (await store.get(key)) ?? null;
}

async function writeValue(key: string, value: unknown): Promise<void> {
  if (!isTauri()) {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
    return;
  }
  const store = await getStore();
  await store.set(key, value);
}

export async function loadState(): Promise<PersistedState> {
  const raw = await readValue(STATE_KEY);
  if (raw === null) return createDefaultState();
  const result = persistedStateSchema.safeParse(raw);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export const saveState = (state: PersistedState) => writeValue(STATE_KEY, state);

/** 读取在线更新缓存；格式与当前版本不兼容（如客户端升级后）时返回 null，回退内置数据 */
export async function loadCachedCatalog(): Promise<Catalog | null> {
  const raw = await readValue(CATALOG_KEY);
  if (raw === null) return null;
  const result = catalogSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export const saveCachedCatalog = (catalog: Catalog) => writeValue(CATALOG_KEY, catalog);
