import { unzipSync } from "fflate";

const IMAGE_EXTENSIONS = /\.(webp|png|jpe?g)$/i;
const MIME_TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export interface ImportResult {
  images: Map<string, Blob>;
  skipped: number;
}

const stem = (name: string) => name.replace(/\.[^.]+$/, "").toLowerCase();

/**
 * 浏览器另存为时文件名可能带路径、查询参数或 “ (1)” 之类的重名后缀，
 * 按去除扩展名后的主干与需要的图片名匹配
 */
function normalizeStem(rawName: string): string {
  const base = rawName.split(/[\\/]/).pop() ?? rawName;
  return stem(base.replace(/\?.*$/, "")).replace(/\s*\(\d+\)$/, "");
}

function decodeBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function expandFile(file: File): Promise<[string, Blob][]> {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".zip")) {
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    return Object.entries(entries)
      .filter(([name]) => IMAGE_EXTENSIONS.test(name))
      .map(([name, bytes]) => {
        const extension = name.split(".").pop()!.toLowerCase();
        return [name, new Blob([bytes as BlobPart], { type: MIME_TYPES[extension] })];
      });
  }
  if (lowerName.endsWith(".json")) {
    // 导出脚本生成的图片包：{ 文件名: base64 }
    const bundle: unknown = JSON.parse(await file.text());
    if (typeof bundle !== "object" || bundle === null || Array.isArray(bundle)) {
      throw new Error(`${file.name} is not an image bundle`);
    }
    return Object.entries(bundle)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([name, encoded]) => [
        name,
        new Blob([decodeBase64(encoded) as BlobPart], { type: "image/webp" }),
      ]);
  }
  return IMAGE_EXTENSIONS.test(lowerName) ? [[file.name, file]] : [];
}

/** 解析用户选择的文件，只保留数据中引用到的图片，键统一为数据里的文件名 */
export async function extractImages(
  files: File[],
  wanted: Iterable<string>,
): Promise<ImportResult> {
  const wantedByStem = new Map([...wanted].map((name) => [stem(name), name]));
  const images = new Map<string, Blob>();
  let skipped = 0;
  for (const file of files) {
    const entries = await expandFile(file);
    if (entries.length === 0) skipped += 1;
    for (const [name, blob] of entries) {
      const target = wantedByStem.get(normalizeStem(name));
      if (target) images.set(target, blob);
      else skipped += 1;
    }
  }
  return { images, skipped };
}
