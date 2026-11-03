import { createContext, useContext } from "react";
import type { Trackable, Weapon } from "../data/schema";
import type { Language } from "../lib/storage";
import { messages } from "./messages";

export const LanguageContext = createContext<Language>("zh");

/** 按语言生成文案与名称取值函数，供组件与非组件代码（如浮层状态构建）共用 */
export function createI18n(language: Language) {
  const isZh = language === "zh";
  return {
    language,
    t: messages[language],
    // 中文缺失时回退英文原名
    weaponName: (weapon: Weapon) => (isZh ? (weapon.nameZh ?? weapon.name) : weapon.name),
    camoName: (camo: Trackable) => (isZh ? (camo.nameZh ?? camo.name) : camo.name),
    challengeText: (camo: Trackable) =>
      isZh ? (camo.challenge.zh ?? camo.challenge.en) : camo.challenge.en,
    categoryName: (category: { name: string; nameZh: string }) =>
      isZh ? category.nameZh : category.name,
  };
}

export const useI18n = () => createI18n(useContext(LanguageContext));
