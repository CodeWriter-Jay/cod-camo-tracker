import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useRef, useState } from "react";

export type AppUpdateStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "upToDate" }
  | { state: "available"; version: string }
  | { state: "installing"; percent: number | null }
  | { state: "error"; phase: "check" | "install"; detail: string };

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** 通过 GitHub Release 的 latest.json 检查并安装客户端更新（仅桌面端可用） */
export function useAppUpdate() {
  const isAvailable = isTauri();
  const [version, setVersion] = useState<string | null>(null);
  // 桌面端启动即开始检查，初始状态直接为 checking
  const [status, setStatus] = useState<AppUpdateStatus>(() =>
    isTauri() ? { state: "checking" } : { state: "idle" },
  );
  const updateRef = useRef<Update | null>(null);

  const runCheck = useCallback(
    () =>
      check().then(
        (update) => {
          updateRef.current = update;
          setStatus(
            update ? { state: "available", version: update.version } : { state: "upToDate" },
          );
        },
        (error: unknown) => setStatus({ state: "error", phase: "check", detail: toMessage(error) }),
      ),
    [],
  );

  const checkForUpdate = useCallback(async () => {
    setStatus({ state: "checking" });
    await runCheck();
  }, [runCheck]);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;
    let total: number | null = null;
    let downloaded = 0;
    setStatus({ state: "installing", percent: null });
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? null;
        if (event.event !== "Progress") return;
        downloaded += event.data.chunkLength;
        const percent = total ? Math.min(100, Math.round((downloaded / total) * 100)) : null;
        setStatus({ state: "installing", percent });
      });
      await relaunch();
    } catch (error) {
      setStatus({ state: "error", phase: "install", detail: toMessage(error) });
    }
  }, []);

  // 启动时静默检查一次，失败只在设置页显示，不打扰游戏
  useEffect(() => {
    if (!isAvailable) return;
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(null));
    void runCheck();
  }, [isAvailable, runCheck]);

  return { isAvailable, version, status, checkForUpdate, installUpdate };
}
