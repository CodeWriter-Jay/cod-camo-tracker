use tauri::{Manager, WindowEvent};
use tauri_plugin_window_state::StateFlags;

const MAIN_WINDOW: &str = "main";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 快捷键、浮层显隐与点击穿透、检查更新均在前端通过插件 / window API 完成
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        // 记住主窗口与浮层窗口各自的大小、位置；浮层显隐由用户操作决定，不随退出状态恢复
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::SIZE | StateFlags::POSITION | StateFlags::MAXIMIZED)
                .build(),
        )
        .on_window_event(|window, event| {
            // 隐藏的浮层窗口会让进程一直存活，因此关闭主窗口时直接退出整个应用
            if window.label() == MAIN_WINDOW {
                if let WindowEvent::CloseRequested { .. } = event {
                    window.app_handle().exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
