import { createContext, useContext } from "react";
import type { Trackable, Weapon } from "../data/schema";
import type { Language } from "../lib/storage";
import { messages } from "./messages";

export const LanguageContext = createContext<Language>("zh");

export function useI18n() {
  const language = useContext(LanguageContext);
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
