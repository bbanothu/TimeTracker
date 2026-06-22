# App icon

Place your app icon here as **`icon.png`** (1024×1024 PNG, square).

electron-builder uses this file for the Dock icon, Applications folder, and `.dmg` installer on macOS.

## Use your own icon

Replace `icon.png` with your image:

```bash
cp /path/to/your/icon.png electron/build/icon.png
```

Then rebuild from the `electron/` folder:

```bash
npm run dist
```

## Optional: macOS `.icns`

If you already have an `.icns` file, copy it as `icon.icns` in this folder instead.
