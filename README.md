# UI Tools

> A collection of precision measurement and alignment tools for frontend developers, living inside browser DevTools.

**Version 0.8.4** | Chrome & Firefox | Manifest V3 | Zero dependencies

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
Click any element to visualize its full CSS box model with colored semi-transparent layers: orange (margin), yellow (border), green (padding), blue (content). Updates live as you hover.

### Crosshair
A viewport-wide crosshair that follows the cursor for precise alignment work. Toggle from the toolbar.

### Column Grid Overlay
Configurable column grid rendered directly on the page. Adjust column count (1-48), gutter gap (0-200px), and color. Settings appear inline when the grid is active and update in real time.

### Breakpoint Presets
Auto-scans page stylesheets for `min-width`/`max-width` media query values and displays them as quick-add guide buttons (up to 6). Falls back to standard defaults (320, 768, 1024, 1440px) with a visual indicator. Re-scan on demand with the refresh button.

---

## Installation

### Chrome

1. Clone or download the repository
2. Run the build script:
   ```bash
   bash build.sh
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
   bash build.sh
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
| Add horizontal guide | Click **+ H** |
| Add vertical guide | Click **+ V** |
| Add measurement box | Click **+ Box** |
| Create guide from ruler | Drag from ruler bar edge |
| Reposition guide | Drag its handle on the page |
| Nudge selected guide | Arrow keys (1px) or Shift+Arrow (10px) |
| Inspect spacing | Click **Inspect**, select element, hover to measure |
| Pick a color | Click **Eyedropper**, click any pixel |
| Inspect fonts | Toggle **Font**, hover elements |
| View box model | Toggle **Box Model**, click element |
| Toggle crosshair | Click **Crosshair** |
| Toggle column grid | Click **Grid**, adjust settings inline |
| Add breakpoint guide | Click a breakpoint preset button |
| Exit inspect/box model mode | Press **ESC** |

---

## Building

The build script packages the extension for both Chrome and Firefox:

```bash
bash build.sh
```

This creates:
- `dist/chrome/` — Chrome-ready extension
- `dist/firefox/` — Firefox-ready extension (adds `browser_specific_settings`)
- `ui-tools-chrome-v{VERSION}.zip` — Chrome Web Store package
- `ui-tools-firefox-v{VERSION}.zip` — Firefox Add-ons package

No build tools, bundlers, or npm dependencies required.

---

## Project Structure

```
chrome-extension-line-ruler/
├── manifest.json              # Extension manifest (Manifest V3)
├── devtools.html / .js        # DevTools panel entry point
├── panel.html                 # Main panel UI layout
├── build.sh                   # Chrome/Firefox build & packaging
├── icons/                     # Extension icons (16/48/128)
├── src/
│   ├── panel/                 # DevTools panel logic
│   │   ├── init.js            # Event listeners & startup
│   │   ├── state.js           # Global state & color rotation
│   │   ├── bridge.js          # Page injection bridge
│   │   ├── guides.js          # Guide CRUD operations
│   │   ├── boxes.js           # Box CRUD operations
│   │   ├── render.js          # UI list rendering
│   │   ├── sync.js            # Polling for page updates
│   │   ├── features.js        # Feature toggles & breakpoints
│   │   └── styles/            # Panel stylesheets
│   └── injected/              # Scripts injected into the page
│       ├── constants.js       # Dimensions, colors, host setup
│       ├── rulers.js          # Ruler bars & drag-to-create
│       ├── guides.js          # Guide rendering & dragging
│       ├── boxes.js           # Box creation, drag, resize
│       ├── overlays.js        # Box model, font inspector, grid
│       ├── inspect.js         # DOM spacing inspector
│       ├── crosshair.js       # Crosshair overlay
│       └── api.js             # Public API for DevTools bridge
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

- **Pure vanilla JavaScript** — no frameworks, libraries, or external dependencies
- **Manifest V3** — uses the latest Chrome extension standard
- **No permissions required** — works entirely through the DevTools API
- **Viewport-relative positioning** — guides use `position: fixed`, rulers use `position: sticky`
- **High z-index stacking** — overlays at z-index `2147483647` to stay above page content
- **6-color palette** — automatic rotation through red, blue, green, orange, purple, teal

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
- DevTools theme matching (light/dark)
- Guide grouping and locking
- Undo/redo history
- Unit toggle (px, rem, em, %)

---

## License

MIT
