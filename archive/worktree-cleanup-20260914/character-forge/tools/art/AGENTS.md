# ART TOOLING KNOWLEDGE BASE

## OVERVIEW
Asset planning, candidate assembly, and fail-closed runtime provenance; score 8, distinct schema/contract domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Backend/status vocabulary and restrictions | `catalog.mjs` | historical backend strings; tactical bake is character-forge |
| Intent compilation and graph validation | `pipeline-graph.mjs`, `intents/` | `compileGraph`, `checkGraph`, JSON fixtures |
| Manifest required fields and validation | `asset-manifest.schema.json`, `asset-manifest.mjs` | `validateManifest` checks reviewed/promoted receipts |
| Character bake | `character-forge/` submodule | idle·walk (then attack). Not TRELLIS, not sprite-gen |
| Retired probes | `host.mjs`, `trellis-host-contract.mjs` | do not call; not in spec |
| UI kit file families and BOM checks | `poc-ui-kit-contract.mjs` | Required IDs, paths, source files |
| Runtime reachability and evidence | `runtime-asset-provenance.mjs` | `auditRuntimeProvenance`, `evaluatePromotedAsset` |
| Runtime audit CLI | `check-runtime-asset-provenance.mjs` | JSON and evidence-output options |
| Slot layout and sprite-sheet contract | `runtime-slot-contract.json` | Six non-prop slots, exact semantic keys |
| Promotion preparation/finalization | `runtime-slot-promotion.mjs` | `prepare`/`commit` JSON request phases |
| Verified slot export | `export-runtime-slots.mjs` | Runtime catalog export boundary |
| Local character/UI draft generation | `build-poc-character-sprites.py`, `build-poc-ui-candidates.py` | Explicit new `--output-dir` |
| UI image quality inspection | `qa-poc-ui-kit.py` | Pillow-based image metrics |

## CONVENTIONS
- Graph checks recompile the embedded intent and compare nodes, edges, and status; manually patched plans fail closed.
- Graph compilation describes work; host capability flags do not execute or prove backend generation.
- Reviewed/promoted manifests require allowed rights and passing, named, hashed, timestamped review receipts.
- Runtime promotion additionally binds real raw/output/runtime bytes, rights evidence, review files, and source-binding JSON by SHA-256.
- Slot files must match contract keys and destination directories; character slots expand every facing/action frame and clip.
- `prepare` validates candidate inputs and refuses destination overwrites; `commit` validates imported runtime files before appending the BOM row.
- Character commit records `sprite-guid-retarget-v1` lineage and refreshes imported clip hashes; this is not permission to accept arbitrary altered clips.
- The slot contract names the runtime BOM under `docs/assets/bom/runtime/` and Unity catalog under `Game/Assets/Janseon/Foundation/Art/`.
- Python assemblers emit draft assets with unknown rights and empty reviews; successful assembly is not promotion.
- Python image tools require Pillow; UI candidate assembly also imports NumPy.

## COMMANDS
Run from repository root; these are separate from the parent npm test command.

```bash
node tools/art/pipeline-graph.mjs compile --intent tools/art/intents/poc-title-art.json
node tools/art/check-runtime-asset-provenance.mjs --json
node --test tools/art/test-*.mjs
python3 -m unittest discover -s tools/art -p 'test_*.py'
```

## ANTI-PATTERNS
- No automatic backend fallback; `fallback_backend` and `auto_fallback: true` are rejected.
- `comfyui_trellis`, `meshygen_plus`, and `tripo3d` are not usable substitutes; `comfyui_texture` is existing-tile intake only.
- Do not infer TRELLIS availability from the local machine: the pinned direct-Python host is a separate Windows RTX 4080 environment, with CPU/community fallback forbidden.
- Do not promote candidate/ArtSource/Quarantine content by merely setting `status: promoted`; runtime bytes and source-bound receipts must verify.
- Do not overwrite existing runtime slots or asset IDs; promotion refuses replacement, path traversal, symlink escape, and non-candidate sources.
- Alternate promotion BOM paths are fixture-only, not a production bypass.
- Do not write UI draft assembly into Game/ArtSource or reuse an existing output directory; the generator rejects both.
