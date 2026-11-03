import { z } from "zod";
import { catalogSchema, type Camo, type Catalog, type ModeId, type Trackable } from "./schema";
import { parseTarget, translateChallenge } from "./translate";

export const CODMUNITY_API_URL = "https://codmunity.gg/api/public/camo-tracker/mw4";
const SOURCE_PAGE_URL = "https://codmunity.gg/zh/camo-tracker/mw4";

// codmunity 用 0 表示空字段，统一转为空字符串
const textField = z
  .union([z.string(), z.number()])
  .transform((value) => (typeof value === "string" ? value : ""));

const rawSchema = z.object({
  page: z.object({
    camoGrinds: z.array(
      z.object({
        name: z.string(),
        camoConfig: z
          .object({
            camos: z.array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                image: z.string(),
                mode: z.string().optional(),
                max: z.number().nullable().optional(),
                unlock: z.string().optional(),
              }),
            ),
          })
          .optional(),
      }),
    ),
    weapons: z.array(z.object({ WeaponName: z.string(), Category: z.string(), Icon: textField })),
    challenges: z.array(
      z.object({
        WeaponName: z.string(),
        Name: z.string(),
        SubCategory: z.string(),
        Order: z.number(),
        Challenge: textField,
        ChallengeDMZ: textField,
        Image: textField,
      }),
    ),
  }),
});

const CATEGORY_ZH: Record<string, string> = {
  "Assault Rifle": "突击步枪",
  SMG: "冲锋枪",
  Shotgun: "霰弹枪",
  LMG: "轻机枪",
  "Marksman Rifle": "射手步枪",
  Sniper: "狙击步枪",
  Pistol: "手枪",
  Launcher: "发射器",
  Melee: "近战",
};

const GROUPS: Record<string, Camo["group"]> = {
  "Military Camos": "military",
  "Special Camos": "special",
  Completionist: "completionist",
};

const MASTERY_GRIND = "mw4-mastery";
const BASE_GRIND = "mw4";
const MODES: ModeId[] = ["mp", "dmz"];

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const fileName = (url: string) => (url ? (url.split("/").pop() ?? null) : null);

const challengeOf = (text: string) => ({
  en: text,
  zh: translateChallenge(text),
  target: parseTarget(text),
});

const militaryNameZh = (name: string) => {
  const match = /^Military Camo (\d+)$/.exec(name);
  return match ? `军事迷彩 ${match[1]}` : null;
};

/**
 * 把 codmunity 接口原始数据转换为追踪器数据。
 * @param zhWeaponNames 英文武器名 → 中文名；codmunity 的中文名不在该接口中，需单独提供
 */
export function transformCodmunity(
  raw: unknown,
  zhWeaponNames: Record<string, string>,
  updatedAt = new Date().toISOString(),
): Catalog {
  const { page } = rawSchema.parse(raw);

  const categories = [...new Set(page.weapons.map((weapon) => weapon.Category))].map((name) => ({
    id: slugify(name),
    name,
    nameZh: CATEGORY_ZH[name] ?? name,
  }));

  const rowsByWeapon = Map.groupBy(page.challenges, (row) => row.WeaponName);
  const weapons = page.weapons.map((weapon) => {
    const rows = [...(rowsByWeapon.get(weapon.WeaponName) ?? [])].sort((a, b) => a.Order - b.Order);
    const camosFor = (mode: ModeId): Camo[] =>
      rows.map((row) => {
        const group = GROUPS[row.SubCategory];
        if (!group) throw new Error(`Unknown camo category "${row.SubCategory}" (${row.Name})`);
        const text = mode === "dmz" && row.ChallengeDMZ ? row.ChallengeDMZ : row.Challenge;
        return {
          id: slugify(row.Name),
          name: row.Name,
          nameZh: militaryNameZh(row.Name),
          group,
          image: fileName(row.Image),
          challenge: challengeOf(text),
        };
      });
    return {
      id: slugify(weapon.WeaponName),
      name: weapon.WeaponName,
      nameZh: zhWeaponNames[weapon.WeaponName] ?? null,
      category: slugify(weapon.Category),
      image: fileName(weapon.Icon),
      camos: { mp: camosFor("mp"), dmz: camosFor("dmz") },
    };
  });

  const grindCamos = (name: string) =>
    page.camoGrinds.find((grind) => grind.name === name)?.camoConfig?.camos ?? [];

  const divergence = grindCamos(BASE_GRIND).find((camo) => camo.unlock && camo.max);
  if (!divergence?.unlock || !divergence.max) throw new Error("Divergence camo not found");

  const mastery = Object.fromEntries(
    MODES.map((mode) => [
      mode,
      grindCamos(MASTERY_GRIND)
        .filter((camo) => camo.mode === mode)
        .map((camo): Trackable => ({
          id: slugify(camo.name),
          name: camo.name,
          nameZh: null,
          image: fileName(camo.image),
          challenge: challengeOf(camo.description ?? ""),
        })),
    ]),
  );

  return catalogSchema.parse({
    game: "mw4",
    source: SOURCE_PAGE_URL,
    updatedAt,
    imageBaseUrl: "https://assets.codmunity.gg/optimized/",
    categories,
    divergence: {
      id: slugify(divergence.name),
      name: divergence.name,
      image: fileName(divergence.image),
      requiredCamoId: slugify(divergence.unlock),
      required: divergence.max,
    },
    mastery,
    weapons,
  });
}
