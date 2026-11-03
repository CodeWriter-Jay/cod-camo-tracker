import { isTauri } from "@tauri-apps/api/core";
import { register, unregister, type ShortcutEvent } from "@tauri-apps/plugin-global-shortcut";
import { useEffect, useRef, useState } from "react";
import type { ShortcutAction, Shortcuts } from "../lib/storage";

export type ShortcutError =
  { kind: "register"; detail: string } | { kind: "run"; shortcut: string; detail: string };

type ShortcutHandlers = Record<ShortcutAction, () => Promise<void>>;

// 需等上一次注销完成再注册（StrictMode 双挂载、修改快捷键时），否则会报“已注册”
let pendingUnregister: Promise<unknown> = Promise.resolve();

const toMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** 注册全局快捷键；未设置（空字符串）的快捷键不注册 */
export function useGlobalShortcuts(shortcuts: Shortcuts, handlers: ShortcutHandlers) {
  const [shortcutError, setShortcutError] = useState<ShortcutError | null>(null);
  // 快捷键回调注册后不随渲染更新，通过 ref 调用最新的处理函数
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const { toggleWindow, toggleOverlay } = shortcuts;

  useEffect(() => {
    if (!isTauri()) return;
    const bindings = (
      [
        ["toggleWindow", toggleWindow],
        ["toggleOverlay", toggleOverlay],
      ] as const
    ).filter(([, accelerator]) => accelerator !== "");
    const accelerators = bindings.map(([, accelerator]) => accelerator);

    const registration = pendingUnregister.then(async () => {
      for (const [action, accelerator] of bindings) {
        await register(accelerator, (event: ShortcutEvent) => {
          if (event.state !== "Pressed") return;
          handlersRef.current[action]().catch((error: unknown) =>
            setShortcutError({ kind: "run", shortcut: event.shortcut, detail: toMessage(error) }),
          );
        });
      }
      setShortcutError(null);
    });
    registration.catch((error: unknown) =>
      setShortcutError({ kind: "register", detail: toMessage(error) }),
    );

    return () => {
      // 注册失败已在上面上报，这里只需保证注销在其之后执行
      pendingUnregister = registration
        .catch(() => undefined)
        .then(() => (accelerators.length > 0 ? unregister(accelerators) : undefined))
        .catch((error: unknown) =>
          setShortcutError({ kind: "register", detail: toMessage(error) }),
        );
    };
  }, [toggleWindow, toggleOverlay]);

  return shortcutError;
}
