/** 生成在 assets.codmunity.gg 页面控制台运行的导出脚本，打包下载指定图片为 { 文件名: base64 } */
export function buildExportScript(files: string[], camoSize: string, weaponSize: string): string {
  const list = files.map((file) => [file, file.startsWith("MW4_") ? weaponSize : camoSize]);
  return `(async () => {
  const IMAGES = ${JSON.stringify(list)};
  const toBase64 = async (blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  };
  const bundle = {};
  const failed = [];
  await Promise.all(IMAGES.map(async ([file, size]) => {
    try {
      const response = await fetch("/optimized/" + file + "?size=" + size + "&quality=90&format=webp");
      if (!response.ok) throw new Error("HTTP " + response.status);
      bundle[file] = await toBase64(await response.blob());
    } catch (error) {
      failed.push(file + ": " + error.message);
    }
  }));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(bundle)], { type: "application/json" }));
  link.download = "codmunity-mw4-images.json";
  link.click();
  console.log({ total: IMAGES.length, exported: Object.keys(bundle).length, failed });
})();`;
}
