<div align="center">

# COD Camo Tracker

**An in-game camo progress overlay for Call of Duty: Modern Warfare 4 (Windows)**

[简体中文](README.md) · English

[![Release](https://img.shields.io/github/v/release/CodeWriter-Jay/cod-camo-tracker?style=flat-square&color=c4f135)](https://github.com/CodeWriter-Jay/cod-camo-tracker/releases/latest)
[![Stars](https://img.shields.io/github/stars/CodeWriter-Jay/cod-camo-tracker?style=flat-square&color=ffc53d)](https://github.com/CodeWriter-Jay/cod-camo-tracker/stargazers)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-0078d4?style=flat-square)

⭐ If this saves you a few alt-tabs on the way to Gold, please consider giving it a **Star**. It really keeps the updates coming!

</div>

![The overlay in game](docs/screenshots/overlay-en.jpg)

<p align="center"><sub>A separate always-on-top overlay window shows only your favorite challenges; once pinned, clicks pass straight through to the game</sub></p>

## Features

- **Main window + separate overlay**: the main window is a regular desktop window (minimize, maximize, close) where you manage every weapon and camo; the overlay is a small always-on-top window showing only your favorite challenges, so you never have to leave the game
- **Pin to toggle click-through**: when pinned, the whole overlay passes clicks through and only the pin stays clickable; unpin to check off challenges, move or resize it, switch Multiplayer / DMZ and adjust background opacity
- **Favorite challenges**: track the camos you're grinding; once checked off, each is replaced by that weapon's next camo
- **Mode-aware requirements**: Multiplayer and DMZ share completion, and switching modes shows each mode's own challenge
- **Prerequisite auto-check**: checking a military camo fills in the earlier military camos; checking Gold (or any completionist camo) fills in every earlier camo on that weapon
- **English & Chinese**: UI, weapon names and challenge text in English or Simplified Chinese
- **Works offline**: data plus 150 camo and weapon images ship with the installer
- **Online data updates**: when new weapons drop, pull the latest weapons and camos from codmunity in one click
- **Auto-update**: check for a new version in Settings and install it in place

![Main window](docs/screenshots/home-en.jpg)

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/detail-en.jpg" alt="Weapon details" /></td>
    <td width="50%"><img src="docs/screenshots/settings-en.jpg" alt="Settings" /></td>
  </tr>
  <tr>
    <td align="center">Weapon details: Military / Special / Completionist groups, ☆ to favorite, check when done</td>
    <td align="center">Settings: language, overlay appearance, shortcuts, data update, image import, app updates</td>
  </tr>
</table>

## Install

1. Open [Releases](https://github.com/CodeWriter-Jay/cod-camo-tracker/releases/latest) and download `COD.Camo.Tracker_x.y.z_x64-setup.exe`
2. Run the installer. Images and data are bundled, so no internet connection is needed to use it
   (if the WebView2 runtime is missing it is downloaded during install; Windows 10/11 usually ships with it)
3. Future versions can be installed from **Settings → Check for updates**

## Usage

1. In the main window, open a weapon and tap ☆ on the camos you're grinding
2. Click **Overlay** in the top-right corner of the main window to show the overlay on top of the game (it starts pinned, with click-through on)
3. To adjust it, click the 📌 pin on the overlay to unpin:

   <img src="docs/screenshots/overlay-unpinned-en.jpg" alt="Unpinned overlay" width="380" />

   Check off a challenge and it moves on to that weapon's next camo. Drag the title to move it, drag the bottom-right corner to resize, switch Multiplayer / DMZ and use `−` / `+` for background opacity. Click the pin again when you're done

| Action | What it does |
|---|---|
| Overlay / Close overlay | Button in the main window's top-right corner; shows or hides the overlay window |
| 📌 Pin | Toggles click-through on the overlay; while pinned only the pin is clickable |
| `Alt+C` | Show / hide the main window |
| `Alt+X` | Show / hide the overlay |

- Shortcuts can be changed or cleared in Settings; the app works fine without them
- Closing the main window quits the app and closes the overlay too; main window and overlay sizes and positions are remembered separately
- Run the game in **borderless windowed** or windowed mode; the overlay can't draw over exclusive fullscreen
- The tracker is just a separate desktop window. It **does not inject into the game or read game memory**

## Development

```bash
pnpm install
pnpm dev          # browser preview (no Tauri runtime, progress stored in localStorage)
pnpm tauri dev    # desktop app, requires the Rust toolchain
pnpm test && pnpm lint && pnpm typecheck
```

Stack: Tauri 2 · React 19 · TypeScript · Vite · zod · Vitest. The Windows installer is built with `pnpm tauri build` on Windows (or by `tauri-action` on GitHub Actions).

### Releasing

Push a version tag and GitHub Actions builds the Windows installer and publishes it to Releases:

```bash
git tag v1.1.0 && git push origin v1.1.0
```

Bump the version in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` first.
CI signs the update bundle with the `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` repository secrets
and uploads `latest.json`, which installed clients use to check for updates. If the private key is lost, installed clients
can no longer be updated, so keep a backup.

### Data

`src/data/mw4.json` (the built-in data) is generated. Don't edit it by hand:

```bash
pnpm data:build
```

- Source: `data-source/codmunity-mw4-raw.json`, a snapshot of the public [codmunity.gg](https://codmunity.gg/camo-tracker/mw4)
  endpoint `/api/public/camo-tracker/mw4` (exported from the page in a browser). Chinese weapon names come from codmunity's
  translations and live in `data-source/codmunity-zh-weapon-names.json`
- The transform and translation logic in `src/data/codmunity.ts` and `src/data/translate.ts` is shared by the build script and the
  in-app "Update weapons & camos" button. Untranslated challenge text fails the build; online updates fall back to English
- Camo and weapon images are bundled in `public/images/`; see the header of `scripts/sync-images.py` for how to refresh them.
  A unit test checks that every image referenced by the built-in data is bundled. Images for weapons added through online updates
  load from the CDN when online, or can be imported in Settings for offline use

## Support

If this project helps you:

- Give it a ⭐ **Star** so more camo grinders can find it
- Report bugs or request features in [Issues](https://github.com/CodeWriter-Jay/cod-camo-tracker/issues)
- Share it with your squad

## Disclaimer

This is an unofficial personal project and is not affiliated with Activision, Call of Duty or CODMunity.
Game names, camo and weapon images belong to their respective owners; data and images come from [CODMunity](https://codmunity.gg).
