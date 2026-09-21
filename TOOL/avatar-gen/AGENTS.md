# AVATAR-GEN KNOWLEDGE BASE

## OWNERSHIP

This directory is ordinary content in the main repository. It is not a Git submodule. It owns the full-body custom-avatar viewer, shared Three.js/Unity element contract and mesh validation. Accepted binaries belong in `../../ART-ASSETS/avatar-gen/`; upper-body portrait generation remains in the `TOOL/portrait-gen` submodule.

## CONTRACT

- Preserve source files and record SHA-256 identity.
- Audit both sides before conditional symmetry repair.
- Treat undeclared holes, winding faults, degenerates, native intersections, missing textures, and protected-opening changes as hard failures.
- Keep deliberate eye openings; use the separate shared-eye component.
- Require upper/lower gum and teeth, inner mouth, and tongue roles for completed oral assemblies.
- Verify FBX through fresh reimport with external textures present.
- Keep stable element IDs/object names identical across GLB and FBX.
- Treat Blender/glTF/Unity axes, handedness and units explicitly; never rely on implicit importer orientation.
- Per-element visibility must work in both Three.js (`Object3D.visible`) and Unity (`Renderer.enabled`).
- Do not add upper-body portrait crop/generation; route that to portrait-gen.
- Do not claim medical anatomical fidelity, official commercial-game shader code, rigging, or animation.
- Mesh work follows `contracts/owner-steered-mesh-v1.json`: immutable source, bilateral audit before conditional symmetry, non-compensable hard failures, named protected openings, explicit destructive authorization, fresh-process verification.
- Automated Blender repair is intentionally narrow. Neck retopology, oral repair, eye fitting, UV unwrap and texture bake remain plan/manual-review stages until independently proven automation exists.

## CHECKS

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py check
uv run --python 3.14 --with pytest --with numpy python -m pytest -q TOOL/avatar-gen/tests TOOL/avatar-gen/tests-gates
cd TOOL/avatar-gen && npm ci && npm run export:web && npm test
```

Binary fixtures use repository Git LFS rules. Production Blender/FBX/texture assets must not be stored under `TOOL/`; put them in `ART-ASSETS/avatar-gen`. Do not commit Blender backup files, virtual environments, caches, or exploratory rejected candidates.

