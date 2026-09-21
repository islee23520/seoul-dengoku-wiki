# Avatar-gen asset migration and product plan

## Outcome

Separate production art from executable tooling. `ART-ASSETS/avatar-gen` becomes the single canonical home for accepted full-body Blender files, FBXs, textures, components, showcase scenes and selected evidence. `TOOL/avatar-gen` remains a reusable validator and pipeline that resolves the art library through a portable manifest.

Avatar-gen's baseline product surface is a custom Blender avatar viewer with per-object/per-element visibility controls. The shared element and coordinate contract must behave equivalently in Three.js and Unity. Upper-body portrait generation belongs to portrait-gen.

## Non-goals

- Do not promote all Round2 experiments or failed candidates.
- Do not move the `portrait-gen` submodule or merge portrait rendering into avatar generation.
- Do not import these assets into Unity runtime in this change.
- Do not claim medical anatomy, official Genshin shader parity, rigging or animation.

## Architecture

1. **Art library** — `ART-ASSETS/avatar-gen/`
   - owns all accepted binaries and visual evidence;
   - uses Git LFS and portable SHA-256 manifests;
   - exposes stable roles rather than production-session paths.
2. **Generation and validation tool** — `TOOL/avatar-gen/`
   - owns geometry, symmetry, UV and intersection gates;
   - owns Blender extraction, shader, render and export scripts;
   - validates `ART-ASSETS/avatar-gen/manifest.json` by default;
   - never treats an aggregate score as overriding a hard failure.
3. **Portrait renderer** — `TOOL/portrait-gen/`
   - remains independently versioned;
   - consumes an accepted 3D object and renders portrait PNGs;
   - does not approve the source mesh.
4. **Historical evidence** — `GAME-REFERENCE/character-assembly-poc/round2/`
   - retains exploratory and rejected attempts locally until a separate archival decision;
   - is not the production asset source after this migration.

## Module roadmap

### Foundation

- portable asset manifest loader and hash checker;
- role inventory (`male/female × underwear/smooth/anatomical`, eyes and oral parts);
- repository ownership and LFS checks.

### Import and diagnostics

- Blender/GLB/FBX import inventory;
- axis, scale, height and bounds report;
- topology, UV and evaluated-triangle extraction;
- source and candidate SHA-256 locking.

### Repair routing

- bilateral audit before conditional symmetry;
- neck-density transition and boundary welding;
- normals/winding and unintended-hole repair;
- oral-part placement and clearance checks;
- explicit rejection when protected eye openings change.

### Materials and delivery

- non-overlapping UV validation;
- source-color texture lineage;
- project-authored toon material application;
- `.blend` save plus external-texture FBX export;
- independent-directory FBX reimport and bounds comparison.

### Review surfaces

- six-model comparison scene;
- front, side, quarter and directional-light renders;
- machine-readable acceptance receipts;
- optional handoff to `portrait-gen` for portrait PNG production.

## Reviewed live Three.js portrait integration

This plan incorporates the approved decisions from `.omo/drafts/portrait-gen-live-three-avatar.md` and corrects its superseded asset assumptions.

### Decisions retained

- `portrait-gen` may add a real Three.js canvas as its primary interactive preview while retaining Blender PNG generation as reference, download and verified fallback.
- The web derivative is a self-contained static GLB with one `PORTRAIT_ROOT`, one fixed 5:6 orthographic `PORTRAIT_CAMERA`, embedded textures, unlit materials and no runtime skin, animation or morph targets.
- `ready-3d` requires manifest/hash/structure/texture validation, first render and GPU readback; loader completion alone is insufficient.
- The viewer remains fixed-camera and non-interactive, with explicit loading, ready, fallback, error and disposed states plus complete resource cleanup.
- Raw `.blend` files remain private repository assets and are never served by the portrait HTTP/static surface.

### Superseded assumptions

- Do not use `GAME-REFERENCE/character-assembly-poc/2026-09-19/deliverables/final-integration.blend`. That file is a failed historical assembly and is no longer the best available source.
- Use `ART-ASSETS/avatar-gen/deliverables/female-underwear.blend` as the first reversible portrait validation fixture because it is part of the accepted six-model package.
- Bind the portrait derivative to `ART-ASSETS/avatar-gen/manifest.json` and its source hash. The GLB/portrait-specific manifest belongs in the `portrait-gen` submodule, but it records this repository asset identity.
- The six accepted body variants remain available in the art library; the first portrait feature does not add a multi-avatar roster or selector. Adding more catalog entries later reuses the same contract.

### Execution boundary

The current parent-repository increment establishes the art library and corrected plan. The independently versioned `TOOL/portrait-gen` implementation remains a separate atomic submodule increment because it changes TypeScript APIs, Blender export behavior, a Three.js browser surface and its own test suite. Its execution order is:

1. Pin `ART-ASSETS/avatar-gen/deliverables/female-underwear.blend` and target-image hashes without modifying either source.
2. Implement and RED/GREEN-test the static portrait GLB and manifest contract.
3. Add the non-destructive Blender static-pose export and invariant inspector.
4. Add constrained catalog, HTTP and static-stage delivery of only GLB, manifest and fallback PNG.
5. Implement the fixed-camera Three.js viewer with deterministic readiness and disposal.
6. Replace only the active preview surface; retain PNG export/fallback and keep `legacy-2d` retired.
7. Run Blender, API, browser, typecheck, build and lifecycle failure matrices.
8. Commit the green `portrait-gen` submodule increment, then update only its parent gitlink in a dedicated follow-up commit/PR.

The avatar-gen full-body viewer is now the baseline product surface. The separate reviewed portrait-gen Three.js plan still owns upper-body portrait generation and fixed portrait framing; it consumes avatar-gen assets rather than duplicating avatar viewing.

## Migration stages

1. Move accepted binaries and selected evidence from `TOOL/avatar-gen/assets` and `TOOL/avatar-gen/evidence` to `ART-ASSETS/avatar-gen`.
2. Deduplicate repeated male/female textures into canonical `textures/` files while keeping per-FBX `.fbm` packages for portable FBX delivery.
3. Rewrite the manifest to use paths relative to the repository root and add owner/status fields.
4. Refactor `TOOL/avatar-gen` manifest resolution to default to the art-library manifest and accept `--manifest` for other libraries.
5. Add tests proving missing, modified and path-escaping assets fail.
6. Reopen the moved showcase and each final `.blend`; reimport all six FBXs from an independent directory.
7. Update `TOOL/AGENTS.md` and root guidance with the new ownership boundary.
8. Commit the move atomically and update the existing feature PR.

## Completion gates

- manifest hashes cover every canonical binary;
- six roles, six texture packages, shared eyes and both oral assemblies are present;
- geometry/UV/intersection and manifest test suites pass once;
- Blender reopens the showcase and detects all six model markers;
- all binary files are LFS objects and no file exceeds GitHub's non-LFS limit;
- no `TOOL/avatar-gen/assets` production binaries remain;
- no committed cache, `.blend1`, virtual environment or local absolute path remains;
- PR diff contains only the asset ownership migration and its direct documentation/tests.

