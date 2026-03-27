# Ruler Lines — Product Vision & Description

> A precision measurement and alignment tool for web developers, living inside the browser as a Chrome DevTools extension.

---

## The Problem

Frontend developers working with design tools like Figma, Sketch, or Adobe XD are used to one thing: **rulers and guide lines**. Drop a line, measure a gap, verify spacing — it's second nature. Then they switch to the browser to implement or QA those same designs, and the tool disappears entirely.

The existing options are frustrating:

- Browser DevTools shows box model dimensions in isolation — you can inspect one element at a time, but you can't visually compare across elements or eyeball global alignment.
- Browser zoom and screenshot-based comparisons are error-prone and slow.
- Pixel-perfect overlays require external tools, uploads, or browser extensions that add heavy overlays that block interaction with the actual page.
- Grid bookmarklets and CSS debug tools are blunt instruments — they show you everything at once or nothing at all.

There is no native, lightweight, interactive guide line tool that lives inside the browser alongside the page itself.

**Ruler Lines is that tool.**

---

## What It Is

Ruler Lines is a Chrome DevTools extension that lets developers place draggable guide lines and resizable measurement boxes directly on top of any webpage — without interrupting the ability to interact with the page itself.

It is inspired by the guide line workflow in Figma and traditional design tools, but built specifically for the browser context: live pages, real layout, scrolling content, and responsive viewports.

The tool is accessed via a dedicated panel inside Chrome DevTools. It has no visual footprint when inactive — it only appears when you open DevTools and invoke it.

---

## Core Principles

### 1. The DOM is the canvas

Rather than layering an opaque overlay on top of the page, Ruler Lines injects itself _into_ the DOM. The ruler chrome (the tick-marked edge bars) uses `position: sticky` so it stays anchored to the viewport edges as part of the document flow. This means nothing is hidden beneath the rulers — the full page is always accessible and measurable.

### 2. Guide lines are viewport-relative

When you place a guide at 300px from the top of the viewport, it stays at 300px from the top — regardless of scroll position. This mirrors how design tools behave: the guide is a viewport-level reference point, not pinned to a specific DOM coordinate. Guides use `position: fixed` internally, but the experience feels like design tool guides.

### 3. The page stays interactive

The guides container uses `pointer-events: none` at the root level. Only the drag handles on guides and the interactive areas of measurement boxes re-enable pointer events. This means you can still click links, fill forms, interact with dropdowns, and use the page normally while guides are active. The tool is invisible to page functionality.

### 4. No configuration required

There is no setup, no API key, no project config. Open DevTools, open the Ruler Lines panel, add a line. Done.

---

## Feature Set

### MVP — The Foundation

- **Add horizontal guide lines** — placed at a default position and draggable to any viewport-relative Y coordinate
- **Add vertical guide lines** — placed at a default position and draggable to any viewport-relative X coordinate
- **Per-line color picker** — each guide gets a unique color by default; the color can be changed per-line using a native `<input type="color">` element
- **Remove individual lines** — each line can be deleted independently
- **Clear all lines** — a single action removes all guides at once
- **Draggable guides** — click and drag any guide to reposition it; coordinate updates in real time
- **Coordinate display** — each guide shows its current position (in px) either in the panel or as a label on the guide itself
- **Add measurement boxes** — place a draggable, resizable rectangular overlay centered in the viewport; useful for overlaying a region of the page to compare dimensions against design specs
- **Per-box color picker** — each box gets a unique color by default; changeable per-box
- **Dimension label** — each box displays its current width × height in pixels
- **Draggable boxes** — drag from the box interior to reposition; coordinates update in real time
- **Resizable boxes** — 8-point resize handles (4 corners + 4 edges) with live dimension feedback
- **Remove individual boxes** — each box can be deleted independently
- **In-DOM injection** — rulers, guides, and boxes are part of the DOM, not a detached canvas overlay
- **DevTools panel** — the control surface lives in a dedicated Chrome DevTools panel, separate from the page
- **Ruler visibility toggle** — a toggle switch in the toolbar shows or hides the top and left ruler bars; useful when content at the very edges of the viewport is obscured by the ruler overlay. Rulers are on by default and the toggle reflects their live state
- **Column grid overlay** — a toggleable column grid rendered directly on the page. Configurable column count (default 12) and gutter gap (default 20px) with a color picker; settings are exposed inline when the grid is active and update the overlay in real time
- **Distance readout between guides** — distances between adjacent same-axis guide pairs are shown inline between guide rows in the panel and update live as guides are dragged
- **Breakpoint presets** — a one-click row of breakpoint buttons below the toolbar. On panel open, the page's stylesheets are scanned for `min-width`/`max-width` media query values and used as buttons (capped at 6); falls back to standard defaults (320, 768, 1024, 1440px) with a visual indicator if none are detected. A ↺ button re-scans on demand
- **Keyboard nudge** — click a guide row in the panel to select it, then reposition with arrow keys (1px) or Shift + arrow keys (10px)
- **Color eyedropper** — samples any pixel on the page using the browser's native EyeDropper API and copies the hex value to the clipboard, with a brief inline color preview
- **Font inspector** — a hover tooltip that follows the cursor and displays the font-family, size, weight, and line-height of any element on the page; toggled from the toolbar
- **Spacing inspector** — select any two elements in the DevTools Elements panel and visualize the pixel gap between their bounding boxes as labeled measurement lines on the page; overlap is highlighted in red

### Phase 2 — Measurement & Precision

- **Snap to element edges** — when dragging a guide near a DOM element's boundary, it snaps precisely to that element's edge
- **Coordinate input** — type an exact pixel value to position a guide precisely

### Phase 3 — Persistence & Configuration

- **Per-domain guide persistence** — guide positions, colors, and layout are saved to `chrome.storage` and restored automatically when revisiting the same domain
- **Named guide sets / presets** — save a layout of guides under a name (e.g. "12-column grid", "mobile breakpoints") and recall it instantly
- **JSON import/export** — export your guide configuration as JSON and import it on another machine or share it with teammates

### Phase 4 — Advanced Measurement

- **Element dimension overlay on hover** — hovering an element while the tool is active shows a non-intrusive overlay with its width, height, and position
- **Screenshot with guides** — capture the current viewport with guides rendered in the image, useful for annotated QA screenshots
- **Responsive simulation mode** — lock viewport width to a specific breakpoint to test layout at that exact size

### Phase 5 — Polish & Integration

- **Keyboard shortcuts** — add/toggle guides without touching the panel UI
- **DevTools theme matching** — the panel UI matches the browser's DevTools light/dark theme automatically
- **Guide grouping and locking** — group related guides and lock them to prevent accidental movement
- **Undo/redo** — full history of guide additions, moves, and removals
- **Ruler unit toggle** — switch between pixels, rem, em, and percentage units on the ruler tick marks

---

## Long-term / To-do

These features are valuable but require more infrastructure and are deferred until the core toolset is stable.

- **Per-domain guide persistence** — guide positions, colors, and layout are saved to `chrome.storage` and restored automatically when revisiting the same domain
- **Named guide sets / presets** — save a layout of guides under a name (e.g. "12-column grid", "mobile breakpoints") and recall it instantly
- **JSON import/export** — export your guide configuration as JSON and import it on another machine or share it with teammates
- **Responsive simulation mode** — lock viewport width to a specific breakpoint to test layout at that exact size

---

## The User

The primary user is a **frontend developer or UI engineer** who:

- Works from Figma or similar design files and needs to verify their implementations in the browser
- Does QA passes on their own or a colleague's work and needs spatial reference points
- Builds component libraries or design systems and cares about precise spacing and alignment
- Is already comfortable living in DevTools and wants their measurement tools to live there too

Secondary users include **designers who can inspect code** and want to do quick spatial checks directly in the browser without handing off a screenshot, and **QA engineers** doing visual regression checks.

---

## What It Is Not

- It is not a pixel-perfect overlay comparison tool (no image upload, no design file sync)
- It is not a full grid system generator (no column count, gutter, or margin input — that's a separate concern)
- It is not a performance profiler, accessibility auditor, or network inspector
- It is not a standalone app — it requires Chrome DevTools and is specifically designed for that environment

---

## The Vision in One Sentence

> Ruler Lines brings the guide line workflow from design tools into the browser, as a first-class DevTools citizen — so the gap between design and implementation can be measured, literally.

---

## Technical Architecture Summary

| Layer                       | Mechanism                                  | Rationale                                          |
| --------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Ruler chrome (tick bars)    | In-DOM, `position: sticky`                 | Always visible, never hides page content           |
| Guide lines                 | In-DOM, `position: fixed`                  | Viewport-relative, scroll-independent              |
| Measurement boxes           | In-DOM, `position: fixed`                  | Viewport-relative overlays; pointer-events on drag/resize handles only |
| Page interactivity          | `pointer-events: none` on guides container | Page remains fully usable                          |
| Control surface             | Chrome DevTools panel (`devtools_page`)    | Native DevTools integration, no popup              |
| Guide injection             | `chrome.devtools.inspectedWindow.eval()`   | Works without `scripting` permission, bypasses CSP |
| Panel toolbar layout        | CSS grid (1fr + max-content), wrapping flex controls | New buttons slot in without layout changes; Clear is always anchored right |
| State persistence (Phase 3) | `chrome.storage.sync`                      | Per-domain, synced across devices                  |
