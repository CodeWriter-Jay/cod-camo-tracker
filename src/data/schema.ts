import { z } from "zod";

export const modeIdSchema = z.enum(["mp", "dmz"]);

const challengeSchema = z.object({
  en: z.string(),
  // 规则未覆盖的新句式为 null，界面回退显示英文
  zh: z.string().nullable(),
  target: z.number().int().positive(),
});

const trackableSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameZh: z.string().nullable(),
  image: z.string().nullable(),
  challenge: challengeSchema,
});

const camoSchema = trackableSchema.extend({
  group: z.enum(["military", "special", "completionist"]),
});

const weaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameZh: z.string().nullable(),
  category: z.string(),
  image: z.string().nullable(),
  camos: z.record(modeIdSchema, z.array(camoSchema)),
});

export const catalogSchema = z.object({
  game: z.string(),
  source: z.string(),
  /** 数据生成时间，用于判断本地缓存是否比安装包内置数据更新 */
  updatedAt: z.iso.datetime(),
  imageBaseUrl: z.url(),
  categories: z.array(z.object({ id: z.string(), name: z.string(), nameZh: z.string() })),
  divergence: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string(),
    requiredCamoId: z.string(),
    required: z.number().int().positive(),
  }),
  mastery: z.record(modeIdSchema, z.array(trackableSchema)),
  weapons: z.array(weaponSchema),
});

export type ModeId = z.infer<typeof modeIdSchema>;
/** 可计数的挑战：武器迷彩或账号级精通迷彩 */
export type Trackable = z.infer<typeof trackableSchema>;
export type Camo = z.infer<typeof camoSchema>;
export type CamoGroup = Camo["group"];
export type Weapon = z.infer<typeof weaponSchema>;
export type Catalog = z.infer<typeof catalogSchema>;

/** 收集数据引用的全部图片文件名 */
export function collectImages(catalog: Catalog): Set<string> {
  const files = [
    catalog.divergence.image,
    ...Object.values(catalog.mastery).flatMap((camos) => camos.map((camo) => camo.image)),
    ...catalog.weapons.flatMap((weapon) => [
      weapon.image,
      ...Object.values(weapon.camos).flatMap((camos) => camos.map((camo) => camo.image)),
    ]),
  ];
  return new Set(files.filter((file): file is string => file !== null));
}
