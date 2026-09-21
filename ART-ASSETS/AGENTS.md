# ART-ASSETS KNOWLEDGE BASE

## PURPOSE

Canonical repository storage for raw and authored art assets. This directory owns editable art binaries and external textures. `TOOL/` owns the code that processes them; `GAME-REFERENCE/` owns frozen references and experiments; `GAME/Assets/` owns approved runtime imports.

## RULES

- Every asset family requires `manifest.json` with relative paths and SHA-256 values.
- Use Git LFS for Blender, FBX, image, audio and other binary art formats.
- Never commit `.blend1`, caches, virtual environments, temporary render output or rejected candidates.
- A generated candidate becomes canonical only after its hard gates and visual review pass.
- Preserve original sources when licensing permits; otherwise preserve a provenance record without copying the source.
- Do not hand-edit Unity serialized assets here.

## AVATAR ASSETS

`avatar-gen/` contains accepted full-body character assets. Its executable pipeline is `../TOOL/avatar-gen/`.

