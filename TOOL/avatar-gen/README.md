# avatar-gen

`avatar-gen` is the repository-owned full-body custom-avatar viewer, preparation and validation component. Production binaries are owned by `ART-ASSETS/avatar-gen/`; this directory owns executable code, the Three.js viewer, shared renderer contract, Unity package, gates, tests and pipeline scripts.

The product boundary is strict:

- **avatar-gen:** full-body Blender avatar viewing, orbit/pan/zoom inspection, and per-object/per-element visibility toggles in Three.js and Unity.
- **portrait-gen:** upper-body portrait generation/rendering from an avatar-gen asset. Portrait framing/cropping is not duplicated here.

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
cd TOOL/avatar-gen && npm ci && npm run export:web && npm test && npm run serve
```

## Blender mesh work

사용자 steering에서 고정된 메쉬 방법론은 [BLENDER-MESH-WORKFLOW.md](BLENDER-MESH-WORKFLOW.md)와 `contracts/owner-steered-mesh-v1.json`에 있다.

```bash
python3 TOOL/avatar-gen/bin/avatar-gen.py route --request "목 접합, 노말, 좌우 감사, 구강과 눈, UV를 검증해"
python3 TOOL/avatar-gen/bin/avatar-gen.py mesh-work \
  --request "양쪽을 감사하고 입증된 donor만 대칭 수리 계획에 넣어" \
  --source /absolute/source.blend \
  --work-dir /absolute/work/avatar-mesh
```

`mesh-work`는 기본적으로 읽기 전용 감사와 수리 계획만 만든다. 새 `.blend`에 검증된 안전 수리를 적용하려면 `--apply --output ...`이 필요하다. donor reflection은 현재 계획 단계에서 차단되며 자동 적용되지 않는다. 원본 덮어쓰기는 항상 거부한다.

수리가 실행된 hard gate를 통과해도 visual/UV/texture/reimport/holdout이 실행되지 않았으면 상태는 `REPAIRED_UNPROVEN`이다. 이를 전체 `PASS`로 승격하지 않는다.

Native Blender extractors:

```bash
blender --background candidate.blend --python TOOL/avatar-gen/scripts/extract_geometry.py -- --output geometry.json
PYTHONPATH=TOOL/avatar-gen python3 -m gate.geometry_report --input geometry.json --output verdict.json
```

The package rejects hard defects rather than offsetting them with aggregate scores: undeclared holes, invalid protected openings, flipped or degenerate surfaces, native intersections, malformed UV data, and missing external textures remain failures.

## Shared renderer contract

`ART-ASSETS/avatar-gen/runtime/female-underwear/avatar-contract.json` binds the web GLB and Unity FBX to the same stable element IDs and names.

Coordinate conversion is explicit:

- Blender Z-up right-handed → glTF Y-up right-handed: `(x, z, -y)`
- Blender Z-up right-handed → Unity Y-up left-handed: `(x, z, y)`
- glTF → Unity: `(x, y, -z)`

The Three.js viewer toggles `Object3D.visible`; the Unity package toggles `Renderer.enabled` for the same contract ID/object name. Missing elements fail closed.

### Three.js viewer

```bash
cd TOOL/avatar-gen
npm run export:web
npm run serve
# open http://127.0.0.1:8131
```

### Unity package

`GAME/Packages/manifest.json` references `file:../../TOOL/avatar-gen/unity-package`. The reusable package includes runtime contract parsing, coordinate conversion, element visibility control, EditMode tests and `AvatarGen.Editor.AvatarViewerImportVerifier.ImportAndVerify` for a real FBX import/reopen/toggle check.

## Limits

- The included anatomical variants are provisional art bases, not medical anatomy references.
- The toon materials are project-authored from public technique evidence; they are not official Genshin shader implementations.
- Rigging and animation are not included.
- Eye socket openings are deliberate and are filled by the separate shared-eye component.

