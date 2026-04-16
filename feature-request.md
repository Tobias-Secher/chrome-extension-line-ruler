# DOM Spacing Inspector – Feature Specification

## Purpose

A developer-focused measurement mode inside the Chrome DevTools extension that allows precise visual inspection of spacing between rendered DOM elements directly in the page.

The feature helps frontend developers quickly understand:

* external spacing between elements
* internal spacing inside containers
* alignment inconsistencies
* layout behavior caused by CSS
* unexpected wrapper elements affecting layout

---

## Activation

Triggered from the existing button inside the DevTools extension panel.

When activated:

* page enters inspect mode
* cursor changes to selection mode
* overlay system mounts
* normal page interaction is temporarily suppressed while active

---

## Core Interaction Flow

### 1. Select Reference Element

User moves the cursor across the page.

As the cursor moves:

* the exact DOM element under the cursor is highlighted
* only one hovered candidate is active at a time

On click:

* that exact element becomes the reference element
* persistent blue highlight is applied

---

### 2. Measure Against Other Elements

After a reference element is selected:

As the user moves the mouse:

* the exact hovered DOM element gets a green highlight
* distances between the reference element and hovered element are rendered live

This continues until the user exits or selects a new reference element.

---

## Targeting Model (Raw DOM)

The tool uses literal DOM targeting.

Meaning:

* whichever element is directly under the cursor becomes the hovered candidate
* clicking selects that exact element
* no automatic parent selection
* no wrapper skipping
* no heuristics or guessing intent

This ensures predictable developer-grade behavior.

---

## Measurement Rules

## External Measurements

When the hovered element is outside the selected reference element:

Show only the nearest meaningful spacing axis.

### Examples

#### Hovered Below

Show vertical distance from bottom of selected element to top of hovered element.

#### Hovered Above

Show vertical distance from top of selected element to bottom of hovered element.

#### Hovered Right

Show horizontal distance from right of selected element to left of hovered element.

#### Hovered Left

Show horizontal distance from left of selected element to right of hovered element.

---

## Diagonal Positioning

If the hovered element is offset on both axes:

* show only the dominant nearest spacing relationship
* avoid clutter from multiple simultaneous guides

---

## Overlapping Elements

If elements overlap visually:

* no spacing guides shown
* highlights remain visible

---

## Internal Measurements (Container Mode)

If the hovered element is inside the selected reference element:

Show internal distances from hovered element to the selected container edges.

Possible values:

* top inset
* left inset
* right inset
* bottom inset

Display nearest relevant values only unless space allows more.

Useful for:

* padding validation
* card layouts
* button alignment
* nested content spacing
* flex/grid containers

---

## Visual Design

## Selected Reference Element

* blue outline
* subtle translucent fill

## Hovered Element

* green outline
* lighter translucent fill

## Measurement Guides

* thin crisp lines between measured edges
* high contrast
* pixel precise

## Labels

Compact dark badges displaying values such as:

* 8px
  n- 16px
* 24px

Labels are centered on guide lines when possible.

---

## Rendering Accuracy

Measurements must reflect final rendered visual positions, including:

* transforms
* scaling
* responsive layout shifts
* browser zoom
* scrolling
* sticky/fixed positioning

This ensures values match what the developer sees.

---

## Live Update Behavior

Overlay positions and values recalculate during:

* mousemove
* scroll
* resize
* transitions
* animations
* layout shifts

No stale guides or ghost overlays should remain.

---

## Reset / Exit Behavior

### ESC

Exit measurement mode fully.

### Click New Element

Replace current reference element.

### Click Selected Element Again

Unselect and return to selection mode.

---

## Performance Expectations

Should remain smooth on complex pages.

Implementation should prioritize:

* lightweight overlay rendering
* minimal layout thrashing
* efficient recalculation
* smooth pointer movement response

---

## Failure Handling

### Selected Element Removed from DOM

Return to selection mode.

### Selected Element Hidden

Hide guides until visible or reselection occurs.

### Fast Mouse Movement

Never leave stale outlines or labels behind.

---

## V1 Scope

### Must Have

* activate from DevTools panel
* select reference element
* hover compare element
* external spacing guides
* internal spacing guides
* blue/green highlights
* pixel labels
* live updates
* ESC exit

### Later Enhancements

* ancestor cycling
  n- keyboard modifiers
* copy measurement values
* persistent compare mode
* flex/grid gap visualizer
* CSS source explanation

---

## Success Outcome

A frontend developer can instantly inspect the real rendered DOM tree and measure spacing between exact elements without manually hunting through DevTools box model panels.
