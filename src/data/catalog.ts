import { z } from "zod";
import rawCatalog from "./mw4.json";

const modeIdSchema = z.enum(["mp", "dmz"]);

const challengeSchema = z.object({
  en: z.string(),
  zh: z.string(),
  target: z.number().int().positive(),
});

const trackableSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  challenge: challengeSchema,
});

const camoSchema = trackableSchema.extend({
  group: z.enum(["military", "special", "completionist"]),
});

const weaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  image: z.string().nullable(),
  camos: z.record(modeIdSchema, z.array(camoSchema)),
});

const catalogSchema = z.object({
  game: z.string(),
  source: z.string(),
  imageBaseUrl: z.url(),
  categories: z.array(z.object({ id: z.string(), name: z.string() })),
  modes: z.array(z.object({ id: modeIdSchema, name: z.string() })),
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

export { modeIdSchema };

// 数据文件由 scripts/build-mw4-data.py 生成，启动时校验以便尽早暴露格式错误
export const catalog: Catalog = catalogSchema.parse(rawCatalog);

// 图片随客户端打包在 public/images（由 scripts/sync-images.py 生成），无需联网
export const imageUrl = (file: string) => `/images/${file}`;
