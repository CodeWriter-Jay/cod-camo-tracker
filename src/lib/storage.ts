import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { z } from "zod";
import { bundledCatalog } from "../data/catalog";
import { catalogSchema, modeIdSchema, type Catalog } from "../data/schema";
import { migrateFavorites } from "./favorites";
import { completedSchema, migrateCountProgress } from "./progress";

const STORE_FILE = "tracker.json";
const STATE_KEY = "state";
const CATALOG_KEY = "catalog";
// 浏览器预览（pnpm dev）没有 Tauri 运行时，改用 localStorage
const LOCAL_STORAGE_PREFIX = "cod-camo-tracker:";

export const languageSchema = z.enum(["zh", "en"]);
export type Language = z.infer<typeof languageSchema>;

export const DEFAULT_OVERLAY_OPACITY = 0.9;
export const MIN_OVERLAY_OPACITY = 0;

/** 空字符串表示未设置；窗口按钮可完成同样操作，快捷键不是必需的 */
export const DEFAULT_SHORTCUTS = {
  toggleWindow: "Alt+C",
  toggleOverlay: "Alt+X",
};
export type Shortcuts = typeof DEFAULT_SHORTCUTS;
export type ShortcutAction = keyof Shortcuts;

const detectLanguage = (): Language => (navigator.language.startsWith("zh") ? "zh" : "en");

// 1.0.0 及之前：toggleOverlay 为显示/隐藏窗口，toggleClickThrough 为点击穿透（即现在的浮层窗口）
const shortcutsSchema = z.preprocess(
  (raw) => {
    if (typeof raw !== "object" || raw === null || !("toggleClickThrough" in raw)) return raw;
    const legacy = raw as { toggleOverlay?: unknown; toggleClickThrough?: unknown };
    return { toggleWindow: legacy.toggleOverlay, toggleOverlay: legacy.toggleClickThrough };
  },
  z.object({ toggleWindow: z.string(), toggleOverlay: z.string() }),
);

// 旧版本缺少的字段均有默认值，旧数据可直接读取；未知字段（如 pinnedWeaponId）会被剥离
const persistedStateSchema = z.object({
  completed: completedSchema.default({}),
  favorites: z.array(z.string()).default([]),
  settings: z.object({
    mode: modeIdSchema.default("dmz"),
    language: languageSchema.default(detectLanguage),
    shortcuts: shortcutsSchema.default(DEFAULT_SHORTCUTS),
    /** 浮层背景不透明度，文字与控件始终保持不透明 */
    overlayOpacity: z.number().min(MIN_OVERLAY_OPACITY).max(1).default(DEFAULT_OVERLAY_OPACITY),
  }),
});

export type PersistedState = z.infer<typeof persistedStateSchema>;
export type Settings = PersistedState["settings"];

export const createDefaultState = (): PersistedState => ({
  completed: {},
  favorites: [],
  settings: {
    mode: "dmz",
    language: detectLanguage(),
    shortcuts: DEFAULT_SHORTCUTS,
    overlayOpacity: DEFAULT_OVERLAY_OPACITY,
  },
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
  return migrateLegacyState(raw, result.data);
}

// 0.2.0 及之前按模式记录计数（progress 字段）、收藏带模式前缀，读取时转换为完成状态
const legacyProgressSchema = z.object({
  progress: z.record(z.string(), z.number()),
});

function migrateLegacyState(raw: unknown, state: PersistedState): PersistedState {
  const legacy = legacyProgressSchema.safeParse(raw);
  if (!legacy.success) return state;
  return {
    ...state,
    completed: {
      ...migrateCountProgress(legacy.data.progress, bundledCatalog),
      ...state.completed,
    },
    favorites: migrateFavorites(state.favorites),
  };
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
