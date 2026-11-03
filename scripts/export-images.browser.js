// 在浏览器中打开任一 https://assets.codmunity.gg/optimized/ 图片页后，于开发者工具控制台执行。
// 把 IMAGES 替换为 `python3 -I scripts/sync-images.py --list` 的输出，
// 运行后会下载 codmunity-mw4-images.json（文件名 → base64），再用 sync-images.py 解包。
const IMAGES = [];

const toBase64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const bundle = {};
const failed = [];
await Promise.all(
  IMAGES.map(async ([file, size]) => {
    try {
      const response = await fetch(`/optimized/${file}?size=${size}&quality=90&format=webp`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      bundle[file] = await toBase64(await response.blob());
    } catch (error) {
      failed.push(`${file}: ${error.message}`);
    }
  }),
);

const link = document.createElement("a");
link.href = URL.createObjectURL(new Blob([JSON.stringify(bundle)], { type: "application/json" }));
link.download = "codmunity-mw4-images.json";
link.click();
console.log({ total: IMAGES.length, exported: Object.keys(bundle).length, failed });
