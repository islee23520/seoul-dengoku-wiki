# Avatar-gen viewer design system

## 0. Product boundary

Avatar-gen is an operational full-body custom-avatar viewer and element inspector. It does not generate upper-body portraits; that belongs to portrait-gen.

## 1. Design direction

An asset inspection bench: dark neutral viewport, cool steel controls, one cyan selection accent, dense but legible object inventory. The memorable moment is direct correspondence between a visibility switch and the real 3D object disappearing from the viewport.

## 2. Tokens

- canvas: `#0b0d10`
- panel: `#14181d`
- raised: `#1b2027`
- border: `#303843`
- text: `#eef3f8`
- muted: `#9aa8b7`
- accent: `#38bdf8`
- danger: `#f87171`
- spacing base: 4px; shell gaps: 12px; panel padding: 16px
- radius: panels 12px, controls 8px, status pills 999px
- type: system sans for UI, system mono for IDs and coordinates

## 3. Layout

- desktop: fixed header; element inspector at 320px; viewport owns remaining space
- narrow: inspector stacks below viewport; document owns scroll
- viewport never scrolls internally; element list owns its panel scroll
- minimum usable viewport height: 420px

## 4. Motion and interaction

- visibility switch follows the beui.dev switch mechanism: immediate semantic state, 140ms opacity/transform feedback
- no continuous decorative animation; Three.js renders on demand after load, resize, orbit, or visibility changes
- reduced motion removes transform feedback while preserving instant state changes

## 5. Primitives

- `AppShell`: header + viewer workspace
- `ViewportPanel`: canvas, load state, renderer/coordinate badges
- `ElementInspector`: filter, show-all/hide-all, grouped element switches
- `ElementSwitch`: object name, stable ID, visible state
- `StatusPill`: loading/ready/error and coordinate-system status

## 6. Accessibility

- every element switch is a native checkbox with a visible label
- controls remain keyboard operable
- canvas has a text alternative identifying the loaded avatar
- state changes update an `aria-live` status region

## 7. Accepted debt

- initial viewer ships with one canonical female-underwear avatar; the contract supports additional manifests without adding portrait or roster product behavior
- mobile is a functional stacked layout, not a platform-specific optimized product surface

