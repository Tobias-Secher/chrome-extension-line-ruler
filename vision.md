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

Ruler Lines is a Chrome DevTools extension that lets developers place draggable, colored horizontal and vertical guide lines directly on top of any webpage — without interrupting the ability to interact with the page itself.

It is inspired by the guide line workflow in Figma and traditional design tools, but built specifically for the browser context: live pages, real layout, scrolling content, and responsive viewports.

The tool is accessed via a dedicated panel inside Chrome DevTools. It has no visual footprint when inactive — it only appears when you open DevTools and invoke it.

---

## Core Principles

### 1. The DOM is the canvas

Rather than layering an opaque overlay on top of the page, Ruler Lines injects itself _into_ the DOM. The ruler chrome (the tick-marked edge bars) uses `position: sticky` so it stays anchored to the viewport edges as part of the document flow. This means nothing is hidden beneath the rulers — the full page is always accessible and measurable.

### 2. Guide lines are viewport-relative

When you place a guide at 300px from the top of the viewport, it stays at 300px from the top — regardless of scroll position. This mirrors how design tools behave: the guide is a viewport-level reference point, not pinned to a specific DOM coordinate. Guides use `position: fixed` internally, but the experience feels like design tool guides.

### 3. The page stays interactive

The guides container uses `pointer-events: none` at the root level. Only the thin 1px drag handles on each guide re-enable pointer events. This means you can still click links, fill forms, interact with dropdowns, and use the page normally while guides are active. The tool is invisible to page functionality.

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
- **In-DOM injection** — rulers and guides are part of the DOM, not a detached canvas overlay
- **DevTools panel** — the control surface lives in a dedicated Chrome DevTools panel, separate from the page

### Phase 2 — Measurement & Precision

- **Distance readout between two guides** — when two horizontal or two vertical guides are selected, show the pixel distance between them
- **Snap to element edges** — when dragging a guide near a DOM element's boundary, it snaps precisely to that element's edge
- **Keyboard nudge** — move a selected guide by 1px (arrow keys) or 10px (Shift + arrow keys)
- **Coordinate input** — type an exact pixel value to position a guide precisely

### Phase 3 — Persistence & Configuration

- **Per-domain guide persistence** — guide positions, colors, and layout are saved to `chrome.storage` and restored automatically when revisiting the same domain
- **Named guide sets / presets** — save a layout of guides under a name (e.g. "12-column grid", "mobile breakpoints") and recall it instantly
- **JSON import/export** — export your guide configuration as JSON and import it on another machine or share it with teammates
- **Breakpoint presets** — built-in presets for common responsive breakpoints (320px, 768px, 1024px, 1440px) placeable with one click

### Phase 4 — Advanced Measurement

- **Element dimension overlay on hover** — hovering an element while the tool is active shows a non-intrusive overlay with its width, height, and position
- **Gap measurement between elements** — select two elements and see the spacing between them, rendered visually between the guides
- **Screenshot with guides** — capture the current viewport with guides rendered in the image, useful for annotated QA screenshots
- **Responsive simulation mode** — lock viewport width to a specific breakpoint to test layout at that exact size

### Phase 5 — Polish & Integration

- **Keyboard shortcuts** — add/toggle guides without touching the panel UI
- **DevTools theme matching** — the panel UI matches the browser's DevTools light/dark theme automatically
- **Guide grouping and locking** — group related guides and lock them to prevent accidental movement
- **Undo/redo** — full history of guide additions, moves, and removals
- **Ruler unit toggle** — switch between pixels, rem, em, and percentage units on the ruler tick marks

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
| Page interactivity          | `pointer-events: none` on guides container | Page remains fully usable                          |
| Control surface             | Chrome DevTools panel (`devtools_page`)    | Native DevTools integration, no popup              |
| Guide injection             | `chrome.devtools.inspectedWindow.eval()`   | Works without `scripting` permission, bypasses CSP |
| State persistence (Phase 3) | `chrome.storage.sync`                      | Per-domain, synced across devices                  |
