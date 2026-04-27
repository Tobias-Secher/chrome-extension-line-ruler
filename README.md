# UI Tools

> A collection of precision measurement and alignment tools for frontend developers, living inside browser DevTools.

**Version 0.13.0** | Chrome & Firefox | Manifest V3 | Zero dependencies

---

## What It Does

UI Tools brings the guide line workflow from design tools like Figma directly into the browser. Place draggable guide lines, measure spacing between DOM elements, inspect typography, pick colors, and more — all from a dedicated DevTools panel with no visual footprint when inactive.

---

## Features

### Guide Lines
Add horizontal and vertical guide lines at any viewport-relative position. Drag to reposition, change colors, and see live coordinate updates. Distance measurements appear automatically between adjacent same-axis guides. Select a guide and nudge with arrow keys (1px) or Shift+arrow (10px).

### Measurement Boxes
Place resizable rectangular overlays to compare dimensions against design specs. 8-point resize handles (corners + edges), central drag zone, crosshair center markers, and live W x H dimension display.

### Rulers
Sticky ruler bars along the top and left viewport edges with tick marks every 10px, major ticks at 100px with numeric labels, and mid ticks at 50px. Drag from the ruler to create new guides. Toggle visibility from the toolbar.

### DOM Spacing Inspector
Interactive measurement mode for spacing between any DOM elements. Click to select a reference element (blue highlight), then hover other elements to see measurement lines with pixel labels. Supports external spacing between elements, internal inset distances for child elements, and overlap detection. Updates live on scroll and resize.

### Color Eyedropper
Pick any color from the page using the browser's native EyeDropper API. The hex value is copied to your clipboard with a toast notification showing the sampled color.

### Font Inspector
Hover tooltip that follows the cursor displaying font family, size, weight, and line height of any element. Toggle from the toolbar.

### Box Model Picker
Click any element to visualize its full CSS box model with colored semi-transparent layers: orange (margin), yellow (border), green (padding), blue (content). Updates live as you hover. The selected element's computed styles (typography, box, layout, appearance, and flex/grid container props when applicable) appear in the panel, grouped by category, with color swatches next to color values. Click any row to copy its value.

### Crosshair
A viewport-wide crosshair that follows the cursor for precise alignment work. Toggle from the toolbar.

### Column Grid Overlay
Configurable column grid rendered directly on the page. Adjust column count (1-48), gutter gap (0-200px), and color. Settings appear inline when the grid is active and update in real time.

### Breakpoint Presets
Auto-scans page stylesheets for `min-width`/`max-width` media query values and displays them as quick-add guide buttons (up to 6). Falls back to standard defaults (320, 768, 1024, 1440px) with a visual indicator. Re-scan on demand with the refresh button.

### Theme
Switch panel chrome between **Beach Boy** (light), **Cave Man** (dark), or **Auto** (follows the OS `prefers-color-scheme`). Selection persists across DevTools sessions via `localStorage`. Theme buttons live in the toolbar **Theme** group.

---

## Installation

### Chrome

1. Clone or download the repository
2. Run the build script:
   ```bash
   npm install && npm run release
   ```
3. Open `chrome://extensions/`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the `dist/chrome` directory
7. Open DevTools (F12) and find the **UI Tools** tab

### Firefox

1. Clone or download the repository
2. Run the build script:
   ```bash
   npm install && npm run release
   ```
3. Open `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on**
5. Select `dist/firefox/manifest.json`
6. Open DevTools (F12) and find the **UI Tools** tab

---

## Usage

1. **Open any webpage** and launch DevTools (F12 or Cmd+Option+I)
2. Click the **UI Tools** tab in DevTools
3. Use the toolbar to add guides, boxes, or toggle tools:

| Action | How |
|--------|-----|
| Add horizontal guide | Click the horizontal line icon in **Add** group |
| Add vertical guide | Click the vertical line icon in **Add** group |
| Add measurement box | Click the box icon in **Add** group |
| Create guide from ruler | Drag from ruler bar edge |
| Reposition guide | Drag its handle on the page |
| Nudge selected guide | Arrow keys (1px) or Shift+Arrow (10px) |
| Inspect spacing | Click the spacing icon in **Inspect** group, select element, hover to measure |
| Pick a color | Click the eyedropper icon in **Inspect** group, click any pixel |
| Inspect fonts | Toggle the **T** icon in **Inspect** group, hover elements |
| View box model | Toggle the box model icon in **Inspect** group, click element |
| Toggle crosshair | Click the crosshair icon in **Overlays** group |
| Toggle column grid | Click the grid icon in **Overlays** group, adjust settings inline |
| Add breakpoint guide | Click a breakpoint preset button |
| Exit inspect/box model mode | Press **ESC** |

---

## Building

Install dependencies, then build:

```bash
npm install
npm run build      # development build with source maps
npm run release    # production build (minified, no source maps, creates .zip packages)
```

This creates:
- `dist/chrome/` — Chrome-ready extension
- `dist/firefox/` — Firefox-ready extension (adds `browser_specific_settings`)
- `ui-tools-chrome-v{VERSION}.zip` — Chrome Web Store package
- `ui-tools-firefox-v{VERSION}.zip` — Firefox Add-ons package

Build uses **TypeScript** (type checking) + **esbuild** (bundling). No runtime dependencies.

---

## Project Structure

```
chrome-extension-line-ruler/
├── manifest.json              # Extension manifest (Manifest V3)
├── devtools.html / .js        # DevTools panel entry point
├── panel.html                 # Main panel UI layout
├── build.mjs                  # esbuild config & Chrome/Firefox packaging
├── tsconfig.json              # TypeScript compiler config
├── icons/                     # Extension icons (16/48/128)
├── src/
│   ├── shared/
│   │   └── api.ts             # Shared types for panel ↔ injected API
│   ├── panel/                 # DevTools panel logic
│   │   ├── init.ts            # Event listeners & startup
│   │   ├── state.ts           # Global state & color rotation
│   │   ├── bridge.ts          # Page injection bridge
│   │   ├── guides.ts          # Guide CRUD operations
│   │   ├── boxes.ts           # Box CRUD operations
│   │   ├── render.ts          # UI list rendering
│   │   ├── sync.ts            # Polling for page updates
│   │   ├── features.ts        # Feature toggles & breakpoints
│   │   ├── theme.ts           # Theme switching & persistence
│   │   └── styles/            # Panel stylesheets
│   └── injected/              # Scripts injected into the page
│       ├── state.ts           # Shared state & constants
│       ├── rulers.ts          # Ruler bars & drag-to-create
│       ├── guides.ts          # Guide rendering & dragging
│       ├── boxes.ts           # Box creation, drag, resize
│       ├── overlays.ts        # Box model, font inspector, grid
│       ├── inspect.ts         # DOM spacing inspector
│       ├── crosshair.ts       # Crosshair overlay
│       └── api.ts             # Public API for DevTools bridge
└── dist/                      # Build output
```

---

## Architecture

UI Tools uses a three-layer architecture:

1. **DevTools Panel** — The control surface in Chrome DevTools. Manages state, renders UI, and dispatches commands.

2. **Bridge** — Uses the `chrome.devtools.inspectedWindow` API to inject and communicate with the page runtime. No content scripts or host permissions needed, avoiding CSP issues entirely.

3. **Page Runtime** — Injected scripts that create and manage DOM elements (guides, boxes, rulers, overlays). Exposes a `window.__UITools` API. A 16ms polling loop syncs position and dimension changes back to the panel.

All visual elements are injected into a single fixed-position container with `pointer-events: none`, so the page remains fully interactive. Only drag handles and interactive zones re-enable pointer events.

---

## Technical Details

- **TypeScript** compiled with **esbuild** — no frameworks or runtime dependencies
- **Manifest V3** — uses the latest Chrome extension standard
- **No permissions required** — works entirely through the DevTools API
- **Viewport-relative positioning** — guides use `position: fixed`, rulers use `position: sticky`
- **High z-index stacking** — overlays at z-index `2147483647` to stay above page content
- **6-color palette** — automatic rotation through red, blue, green, orange, purple, teal

---

## Privacy

- **No data collected or transmitted** — the extension makes no network requests
- **No external servers** — all processing happens locally in the browser
- **`localStorage`** used only to persist the panel theme preference (Beach Boy / Cave Man / Auto); stored in the DevTools panel's own sandboxed origin, never accessible to the inspected page
- **No `storage` permission** declared in the manifest — DevTools panels have isolated storage by default
- **Visual overlays** injected into the inspected page exist only while DevTools is open and are fully removed on close
- **No host permissions, content scripts, or background workers**

---

## Roadmap

### Phase 2 — Measurement & Precision
- Snap to element edges
- Coordinate input for precise positioning

### Phase 3 — Advanced Measurement
- Element dimension overlay on hover
- Screenshot with guides
- Responsive simulation mode

### Phase 4 — Polish & Integration
- Keyboard shortcuts
- Guide grouping and locking
- Undo/redo history
- Unit toggle (px, rem, em, %)

---

## License

MIT
