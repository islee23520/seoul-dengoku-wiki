# Prebaked 3D portrait UI design

## Outcome

The active portrait studio is a single local-render workflow: choose a registered prebaked 3D object, set output dimensions, yaw and framing, then wait for Blender to return a real PNG. A valid completed render is `PASS`. There are no 2D slots, provider settings, generation prompts, source-splitting stages, or ordered approval gates in the active interface.

The original 2D UI (former `legacy-2d/`) was deleted on 2026-11-02 and must not be restored.

## Product contract

- `GET ./healthz` identifies `mode: "prebaked-3d"` and whether the surface is read-only.
- `GET ./api/assets` populates the model selector from server-registered `.glb`, `.gltf`, `.fbx`, and `.blend` assets. The UI never accepts an arbitrary filesystem path.
- `POST ./api/generate` sends `{assetId,width,height,yaw,framing}` and remains visibly busy until the actual Blender response returns.
- A successful response displays the returned PNG, `PASS`, source name, dimensions, and a direct PNG download.
- `GET ./api/jobs` provides recent `PASS` and `FAIL` history. Remote strings are inserted with `textContent`; no API data is interpreted as HTML.
- If API startup fails, `./catalog.json` is the only fallback. This mode displays saved jobs, hides rendering capability, and explicitly says a local server is required. It never invents assets or sample artwork.
- An empty live asset list instructs the operator to register a prebaked object in the server assets directory.

All URLs are document-relative so the same build works at the server root and under `/portrait-gen/`.

## Visual system

The existing operational palette remains: charcoal void, raised charcoal-steel panels, one-pixel steel rules, pale-lime actions and state accents, and compact Korean-first sans typography. The redesign removes the visual density of the retired authoring pipeline and treats the output image as the primary artifact.

- Desktop uses a wide output frame beside a narrower camera console.
- The render frame uses technical grid and crop marks, not placeholder character art.
- Controls are grouped as object, output size, and camera. Defaults are 512 × 640, yaw 0°, and upper-body framing.
- Recent outputs use their actual PNGs. Failed jobs use text-only cards with the server error.
- Motion is limited to the rendering indicator and short card feedback; `prefers-reduced-motion` removes it.

## Accessibility and responsive behavior

- All inputs have visible labels and native keyboard behavior.
- Framing uses labeled radio controls; yaw has a live numeric output.
- Loading and form updates use polite status regions. Server failures use an alert.
- Status is always written (`READY`, `RENDERING`, `PASS`, `FAIL`) and never conveyed by color alone.
- Focus rings use the pale-lime accent at high contrast.
- At 700px and below, settings precede output in one column so mobile users can configure before reaching the preview. History becomes a two-column grid with no horizontal scrolling.
- Tap targets are at least 43px high, and reduced-motion preferences are honored.
