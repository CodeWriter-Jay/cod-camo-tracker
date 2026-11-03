import type { Catalog, ModeId } from "../data/schema";
import { createI18n } from "../i18n/I18nContext";
import { resolveFavorites } from "../lib/favorites";
import { isDone } from "../lib/progress";
import type { Language, PersistedState } from "../lib/storage";

/** 主窗口与浮层窗口之间的通信约定 */
export const OVERLAY_WINDOW_LABEL = "overlay";

export const OVERLAY_EVENTS = {
  /** 主窗口 → 浮层：最新的展示数据 */
  state: "overlay://state",
  /** 浮层 → 主窗口：浮层页面已就绪，请求当前数据 */
  ready: "overlay://ready",
  /** 浮层 → 主窗口：调整背景不透明度 */
  opacity: "overlay://opacity",
  /** 浮层 → 主窗口：切换多人游戏 / DMZ */
  mode: "overlay://mode",
  /** 浮层 → 主窗口：标记收藏的迷彩完成 / 未完成 */
  done: "overlay://done",
  /** 浮层 → 主窗口：浮层被自身的关闭按钮隐藏 */
  hidden: "overlay://hidden",
} as const;

export interface OverlayItem {
  key: string;
  weaponName: string;
  camoName: string;
  challenge: string;
  /** 另一种语言的挑战原文，用于悬停提示 */
  challengeAlt: string | null;
  image: string | null;
  isDone: boolean;
}

export interface OverlayDoneChange {
  /** 收藏 key，即 `${weaponId}:${camoId}` */
  key: string;
  done: boolean;
}

export interface OverlayState {
  language: Language;
  mode: ModeId;
  opacity: number;
  items: OverlayItem[];
}

/** 由主窗口的数据计算浮层需要展示的内容（名称与挑战文本已按语言本地化） */
export function buildOverlayState(data: PersistedState, catalog: Catalog): OverlayState {
  const { language, mode, overlayOpacity } = data.settings;
  const { weaponName, camoName, challengeText } = createI18n(language);
  return {
    language,
    mode,
    opacity: overlayOpacity,
    items: resolveFavorites(catalog, data.favorites, mode).map(({ key, weapon, camo }) => ({
      key,
      weaponName: weaponName(weapon),
      camoName: camoName(camo),
      challenge: challengeText(camo),
      challengeAlt: language === "zh" ? camo.challenge.en : camo.challenge.zh,
      image: camo.image,
      isDone: isDone(data.completed, key),
    })),
  };
}
