# AVATAR-GEN KNOWLEDGE BASE

## OWNERSHIP

This directory is ordinary content in the main `seoul-kenshi` repository. It is not a Git submodule. Full-body mesh validation belongs here; accepted binaries belong in `../../ART-ASSETS/avatar-gen/`; portrait PNG rendering remains in the `TOOL/portrait-gen` submodule.

## CONTRACT

- Preserve source files and record SHA-256 identity.
- Audit both sides before conditional symmetry repair.
- Treat undeclared holes, winding faults, degenerates, native intersections, missing textures, and protected-opening changes as hard failures.
- Keep deliberate eye openings; use the separate shared-eye component.
- Require upper/lower gum and teeth, inner mouth, and tongue roles for completed oral assemblies.
- Verify FBX through fresh reimport with external textures present.
- Do not claim medical anatomical fidelity, official commercial-game shader code, rigging, or animation.

## CHECKS

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py check
uv run --python 3.14 --with pytest --with numpy python -m pytest -q TOOL/avatar-gen/tests TOOL/avatar-gen/tests-gates
```

Binary fixtures use repository Git LFS rules. Production Blender/FBX/texture assets must not be stored under `TOOL/`; put them in `ART-ASSETS/avatar-gen`. Do not commit Blender backup files, virtual environments, caches, or exploratory rejected candidates.

