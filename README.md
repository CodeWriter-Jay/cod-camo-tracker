# COD Camo Tracker

Call of Duty: MW4 迷彩进度追踪浮层（Windows）。Tauri 2 + React + TypeScript。

## 使用

- `Alt+C`：显示 / 隐藏浮层
- `Alt+X`：切换点击穿透（开启后只显示「收藏的挑战」，鼠标操作穿透到游戏）
- 在武器详情点 ☆ 收藏挑战；收藏的挑战完成后会自动换成该武器在其后的下一个未完成迷彩
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

发版前先同步修改 `package.json` 与 `src-tauri/tauri.conf.json` 中的版本号。

## 开发

```bash
pnpm install
pnpm dev          # 浏览器预览（无 Tauri 运行时，进度存 localStorage）
pnpm tauri dev    # 桌面应用，需要 Rust 工具链
pnpm test && pnpm lint && pnpm typecheck
```

Windows 安装包需在 Windows（或 GitHub Actions 的 `tauri-action`）上执行 `pnpm tauri build`。

## 数据

`src/data/mw4.json` 由脚本生成，不要手改：

```bash
python3 -I scripts/build-mw4-data.py
```

- 数据源：`data-source/codmunity-mw4.json`，是 [codmunity.gg](https://codmunity.gg/zh/camo-tracker/mw4) 公开接口
  `/api/public/camo-tracker/mw4` 的精简快照（需在浏览器中打开该页面后导出）
- 挑战描述由脚本内的词组规则翻译为中文，遇到未识别的句式会报错，补充 `CONDITIONS` / `KILL_KINDS` 词表即可
- 迷彩与武器图片打包在 `public/images/`。codmunity 的图片 CDN 不允许脚本直接下载，更新方式见
  `scripts/sync-images.py` 顶部说明；单测会校验数据引用的图片均已打包
- 启动时会用 zod 校验数据格式

## 声明

本项目为非官方的个人工具，与 Activision、Call of Duty 及 CODMunity 无关。
游戏名称、迷彩与武器图片的版权归各自权利人所有，图片来自 CODMunity。
