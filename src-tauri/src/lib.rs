#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 快捷键注册、窗口显隐与点击穿透均在前端通过插件 / window API 完成
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
