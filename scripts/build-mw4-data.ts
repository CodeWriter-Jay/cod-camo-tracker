// 由 data-source 中的 codmunity 快照生成内置数据 src/data/mw4.json
// 用法：pnpm data:build
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformCodmunity } from "../src/data/codmunity";

const root = new URL("..", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf-8"));

const rawPath = "data-source/codmunity-mw4-raw.json";
// 以快照文件的修改时间作为数据时间，保证重复生成结果一致
const updatedAt = statSync(new URL(rawPath, root)).mtime.toISOString();
const catalog = transformCodmunity(
  readJson(rawPath),
  readJson("data-source/codmunity-zh-weapon-names.json"),
  updatedAt,
);

// 内置数据必须全部有中文；运行时在线更新才允许回退英文
const untranslated = new Set(
  [
    ...Object.values(catalog.mastery).flat(),
    ...catalog.weapons.flatMap((weapon) => Object.values(weapon.camos).flat()),
  ]
    .filter((camo) => camo.challenge.zh === null)
    .map((camo) => camo.challenge.en),
);
if (untranslated.size > 0) {
  console.error("以下挑战描述未能翻译，请在 src/data/translate.ts 中补充词表：");
  for (const text of untranslated) console.error(`  ${text}`);
  process.exit(1);
}

const output = fileURLToPath(new URL("src/data/mw4.json", root));
writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.error(`${catalog.weapons.length} weapons -> src/data/mw4.json`);
