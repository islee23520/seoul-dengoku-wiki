# Avatar-gen merge-readiness contract

PR #203 is ready to merge only when every gate below is current and green.

## Scope and ownership

- `ART-ASSETS/avatar-gen` owns canonical Blender, FBX, texture, runtime GLB, manifest and selected evidence files.
- `TOOL/avatar-gen` owns generators, gates, Three.js viewer, server, tests and the reusable Unity package.
- `TOOL/portrait-gen` remains the upper-body portrait generator; avatar-gen contains no portrait crop/generation product behavior.
- `GAME/Packages` may reference the local avatar-gen package, but generated FBX imports under `GAME/Assets/AvatarGen` are not committed.
- No unrelated working-tree changes or exploratory Round2 outputs enter the PR.

## Asset integrity

- `python3 TOOL/avatar-gen/bin/avatar-gen.py check` passes every required role and SHA-256.
- All canonical Blender, FBX, PNG and GLB binaries use Git LFS and are hydrated in a clean checkout.
- No committed `.blend1`, virtual environment, cache, `node_modules`, local absolute path or temporary import exists.

## Three.js viewer

- The canonical avatar reaches `Ready` with 40/40 elements.
- Per-element toggles, show all, hide all and filtering alter real `Object3D.visible` state.
- Orbit, vertical orbit, pan, zoom and fit work by pointer and keyboard where applicable.
- Full-body framing survives desktop and 760px viewports without horizontal overflow.
- Loading controls are disabled until the model is ready.
- Status and filtering changes are available through semantic live regions.
- Fresh screenshots pass independent functional and visual review.

## Unity

- Unity 6000.7.0a5 resolves `com.seouldengoku.avatar-gen` from the local package.
- The canonical FBX imports and all 40 shared element names resolve.
- Every contract element can be disabled and restored through `Renderer.enabled`.
- Three EditMode tests pass for coordinate conversion, visibility and missing-element rejection.

## Repository gates

- Avatar web tests and portable Python geometry/UV/intersection tests pass from current HEAD in CI. Four Blender-native extractor tests pass separately on the pinned macOS Blender host and are explicitly skipped where Blender is unavailable.
- `node TOOL/tools/policy/check-repo-delivery-policy.mjs` passes.
- `npm --prefix TOOL/tools test` passes or any pre-existing unrelated failure is identified separately.
- `git diff --check` is clean.
- PR head equals the pushed branch head, has no branch-caused required check failure, and is conflict-free with `main`.

Only after these gates pass may the draft PR be marked ready for review. Agents do not merge it; owner review and merge remain required by ADR-001.
