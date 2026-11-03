import { createContext, useContext } from "react";
import rawCatalog from "./mw4.json";
import { catalogSchema, collectImages, type Catalog } from "./schema";

export * from "./schema";

// 内置数据由 pnpm data:build 生成，启动时校验以便尽早暴露格式错误
export const bundledCatalog: Catalog = catalogSchema.parse(rawCatalog);

/** 随安装包打包在 public/images 的图片（单测保证内置数据引用的图片均已打包） */
export const bundledImages = collectImages(bundledCatalog);

/** 当前生效的数据：本地缓存的在线数据或内置数据 */
export const CatalogContext = createContext<Catalog>(bundledCatalog);

export const useCatalog = () => useContext(CatalogContext);
