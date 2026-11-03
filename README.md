# COD Camo Tracker

Call of Duty: MW4 迷彩进度追踪浮层（Windows）。Tauri 2 + React + TypeScript。

## 使用

- `Alt+C`：显示 / 隐藏浮层；`Alt+X`：切换点击穿透（开启后只显示「收藏的挑战」）。快捷键可在设置中修改
- 在武器详情点 ☆ 收藏挑战；收藏的挑战完成后会自动换成该武器在其后的下一个未完成迷彩
- 设置中可切换中文 / English 界面、从 codmunity 在线更新武器和迷彩、导入迷彩图片、检查客户端更新
- 游戏需使用**无边框窗口化**或窗口化，独占全屏下浮层无法覆盖
- 本工具只是独立的置顶窗口，不注入游戏进程、不读取游戏内存

## 下载

在 [Releases](../../releases) 下载最新的 `*-setup.exe` 安装。图片与数据均已内置，使用时无需联网
（安装时若系统缺少 WebView2 运行时会自动下载，Windows 10/11 通常已自带）。

## 发布

推送版本标签即可由 GitHub Actions 构建 Windows 安装包并发布到 Releases：

```bash
git tag v0.1.0 && git push origin v0.1.0
```

发版前先同步修改 `package.json`、`src-tauri/tauri.conf.json` 与 `src-tauri/Cargo.toml` 中的版本号。

CI 会用仓库 Secrets 中的 `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
为升级包签名并上传 `latest.json`，已安装的客户端据此检查更新。私钥丢失将无法再给已安装的客户端推送升级，请妥善备份。

## 开发

```bash
pnpm install
pnpm dev          # 浏览器预览（无 Tauri 运行时，进度存 localStorage）
pnpm tauri dev    # 桌面应用，需要 Rust 工具链
pnpm test && pnpm lint && pnpm typecheck
```

Windows 安装包需在 Windows（或 GitHub Actions 的 `tauri-action`）上执行 `pnpm tauri build`。

## 数据

`src/data/mw4.json`（安装包内置数据）由脚本生成，不要手改：

```bash
pnpm data:build
```

- 数据源：`data-source/codmunity-mw4-raw.json`，是 [codmunity.gg](https://codmunity.gg/zh/camo-tracker/mw4) 公开接口
  `/api/public/camo-tracker/mw4` 的快照（需在浏览器中打开该页面后导出）；武器中文名来自 codmunity 的翻译，
  维护在 `data-source/codmunity-zh-weapon-names.json`
- 转换与翻译逻辑在 `src/data/codmunity.ts`、`src/data/translate.ts`，内置数据生成与客户端「更新武器和迷彩」共用。
  生成内置数据时遇到未翻译的挑战描述会报错；在线更新时则回退显示英文
- 迷彩与武器图片打包在 `public/images/`，更新方式见 `scripts/sync-images.py` 顶部说明；单测会校验内置数据引用的图片均已打包。
  在线更新新增的图片联网时直接加载 CDN，也可在客户端设置中导入以离线使用
- 启动时会用 zod 校验数据格式

## 声明

本项目为非官方的个人工具，与 Activision、Call of Duty 及 CODMunity 无关。
游戏名称、迷彩与武器图片的版权归各自权利人所有，图片来自 CODMunity。
