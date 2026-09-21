# avatar-gen

`avatar-gen` is the repository-owned full-body character preparation and validation component. Production binaries are owned by `ART-ASSETS/avatar-gen/`; this directory owns executable code, gates, tests and pipeline scripts. It complements the independently versioned `TOOL/portrait-gen` submodule:

- `avatar-gen` owns full-body mesh inspection, hard geometry/UV gates, accepted body packages, and Blender/FBX delivery checks.
- `portrait-gen` consumes a prepared `.blend`, `.glb`, `.gltf`, or `.fbx` and renders portrait PNGs. It does not approve source-mesh quality.

## Canonical production assets

`../../ART-ASSETS/avatar-gen/deliverables/` contains six validated body packages:

- male underwear, smooth doll, and provisional anatomical variants
- female underwear, smooth doll, and provisional anatomical variants
- one `.blend` and one external-texture FBX package per variant

`../../ART-ASSETS/avatar-gen/components/` contains the accepted shared eye mesh and male/female oral assemblies. `../../ART-ASSETS/avatar-gen/showcase/` contains the six-model Blender comparison scene and its front/quarter renders.

The portable inventory is `../../ART-ASSETS/avatar-gen/manifest.json`. Local absolute paths from the original production receipts are not used as package identity. `--manifest` can validate another asset library with the same schema.

## Commands

Requires Python 3.13+ for the validator. Blender 5.2.2 is required only for native extraction or reopening `.blend` files.

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py list
python3 TOOL/avatar-gen/bin/avatar-gen.py check
uv run --python 3.14 --with pytest --with numpy python -m pytest -q TOOL/avatar-gen/tests TOOL/avatar-gen/tests-gates
```

Native Blender extractors:

```bash
blender --background candidate.blend --python TOOL/avatar-gen/scripts/extract_geometry.py -- --output geometry.json
PYTHONPATH=TOOL/avatar-gen python3 -m gate.geometry_report --input geometry.json --output verdict.json
```

The package rejects hard defects rather than offsetting them with aggregate scores: undeclared holes, invalid protected openings, flipped or degenerate surfaces, native intersections, malformed UV data, and missing external textures remain failures.

## Limits

- The included anatomical variants are provisional art bases, not medical anatomy references.
- The toon materials are project-authored from public technique evidence; they are not official Genshin shader implementations.
- Rigging and animation are not included.
- Eye socket openings are deliberate and are filled by the separate shared-eye component.

