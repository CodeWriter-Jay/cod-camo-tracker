import { useCallback, useEffect, useState } from "react";
import { bundledCatalog, type Catalog } from "../data/catalog";
import {
  collectZhWeaponNames,
  diffCatalog,
  fetchLatestCatalog,
  type CatalogDiff,
} from "../lib/catalogUpdate";
import { loadCachedCatalog, saveCachedCatalog } from "../lib/storage";

export type CatalogUpdateStatus =
  | { state: "idle" }
  | { state: "loading" }
  | ({ state: "success" } & CatalogDiff)
  | { state: "error"; detail: string };

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useCatalogData() {
  const [catalog, setCatalog] = useState<Catalog>(bundledCatalog);
  const [updateStatus, setUpdateStatus] = useState<CatalogUpdateStatus>({ state: "idle" });

  useEffect(() => {
    let isCancelled = false;
    loadCachedCatalog()
      .then((cached) => {
        // 客户端升级后内置数据可能比缓存更新，只采用更新的那份
        if (!isCancelled && cached && cached.updatedAt > bundledCatalog.updatedAt)
          setCatalog(cached);
      })
      .catch((error: unknown) => {
        if (!isCancelled) setUpdateStatus({ state: "error", detail: toMessage(error) });
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const refreshCatalog = useCallback(async () => {
    setUpdateStatus({ state: "loading" });
    try {
      const next = await fetchLatestCatalog(collectZhWeaponNames(bundledCatalog, catalog));
      await saveCachedCatalog(next);
      setUpdateStatus({ state: "success", ...diffCatalog(catalog, next) });
      setCatalog(next);
    } catch (error) {
      setUpdateStatus({ state: "error", detail: toMessage(error) });
    }
  }, [catalog]);

  return {
    catalog,
    isOnlineData: catalog !== bundledCatalog,
    updateStatus,
    refreshCatalog,
  };
}
