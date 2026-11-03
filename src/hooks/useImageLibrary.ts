import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { bundledImages, type Catalog } from "../data/catalog";
import { collectImages } from "../data/schema";
import { extractImages, type ImportResult } from "../lib/imageImport";
import { loadImportedImages, saveImportedImages } from "../lib/imageStore";

export interface ImageLibrary {
  resolve: (file: string) => string;
  /** 当前数据引用、但既未打包也未导入的图片 */
  missing: string[];
  importFiles: (files: File[]) => Promise<ImportResult>;
  loadError: string | null;
}

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useImageLibrary(catalog: Catalog): ImageLibrary {
  const [imported, setImported] = useState<Map<string, Blob>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    loadImportedImages()
      .then((images) => {
        if (!isCancelled) setImported(images);
      })
      .catch((error: unknown) => {
        if (!isCancelled) setLoadError(toMessage(error));
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  // 为导入的图片生成 blob URL，图片集合变化或卸载时释放
  const importedUrls = useMemo(
    () => new Map([...imported].map(([name, blob]) => [name, URL.createObjectURL(blob)])),
    [imported],
  );
  useEffect(() => () => importedUrls.forEach((url) => URL.revokeObjectURL(url)), [importedUrls]);

  const referenced = useMemo(() => collectImages(catalog), [catalog]);
  const missing = useMemo(
    () => [...referenced].filter((file) => !bundledImages.has(file) && !imported.has(file)).sort(),
    [referenced, imported],
  );

  const resolve = useCallback(
    (file: string) => {
      if (bundledImages.has(file)) return `/images/${file}`;
      // 未离线保存的图片联网时直接加载 codmunity CDN，断网由 <img> 的 onError 显示占位
      return importedUrls.get(file) ?? `${catalog.imageBaseUrl}${file}`;
    },
    [catalog.imageBaseUrl, importedUrls],
  );

  const importFiles = useCallback(
    async (files: File[]) => {
      const result = await extractImages(files, referenced);
      if (result.images.size > 0) {
        await saveImportedImages(result.images);
        setImported((current) => new Map([...current, ...result.images]));
      }
      return result;
    },
    [referenced],
  );

  return { resolve, missing, importFiles, loadError };
}

export const ImageLibraryContext = createContext<ImageLibrary | null>(null);

export function useImages(): ImageLibrary {
  const library = useContext(ImageLibraryContext);
  if (!library) throw new Error("useImages must be used inside ImageLibraryContext");
  return library;
}
