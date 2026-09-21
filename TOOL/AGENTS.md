# TOOL WORKSPACE KNOWLEDGE BASE

## OVERVIEW
Repo automation plus independently versioned tool checkouts; score 9, distinct integration and toolchain boundary.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Repository gates and generation | `tools/AGENTS.md` | Node/Python scripts owned by this repository |
| Character / game-art CLI | `portrait-gen/tools/character-tool/README.md`, `portrait-gen/skills/character-tool/SKILL.md` | Owned by portrait-gen; GUI ARP, skin/shape edits, external-texture FBX and Unity staging |
| Full-body avatar pipeline | `avatar-gen/README.md`, `avatar-gen/AGENTS.md` | Main-repository component: hard mesh/UV gates, accepted full-body packages, eye/oral components and FBX delivery evidence |
| Unity execution policy | `docs/Unity-Headless-Workflow.md` | Janseon batchmode-only execution contract |
| Art pipeline bootstrap contracts | `docs/contracts/art-pipeline/` | Project-specific reference and portable execution contract |
| Remote bridge integration | `docs/Unity-Remote.md`, `docs/Unity-Remote-Development.md` | Setup and integration documentation |
| Remote broker/package implementation | `unity-remote/AGENTS.md` | Separate Git submodule and its own toolchain |
| Portrait asset inventory workspace | `portrait-gen/README.md` | Separate Git submodule: SQLite asset DB, gates, slot reviews |
| Design-doc prompt skills | `skills/mda-framework`, `skills/one-page-designs` | SKILL.md prompts; output persists via `tools/design-store/mda-store.mjs` |
| Submodule URLs and ownership | `../.gitmodules` | Paths are `TOOL/unity-remote` and `TOOL/portrait-gen` |

## CONVENTIONS
- `TOOL/` is an integration directory, not an npm package; repository scripts are below `TOOL/tools/`.
- From repository root use `npm --prefix TOOL/tools ...` and `node TOOL/tools/<domain>/<script>.mjs`.
- Do not shorten this to `npm --prefix Tool` or `TOOL/art`; neither is the repo-tool package location.
- Submodules (`unity-remote`, `portrait-gen`) retain independent dependencies, tests and guidance; a parent tooling check does not validate their products.
- `avatar-gen` is ordinary parent-repository content, not a submodule. It prepares and validates full-body assets; `portrait-gen` renders prepared objects into portrait PNGs.
- Portrait layer compositing lives in the `portrait-gen` submodule (`tools/portrait/portrait-layer-composite.mjs`); do not revive a copy under `tools/art/`.
- The external Unity Remote project's interactive workflows do not override Janseon's headless execution policy.
- Unity runtime/import work belongs to `../Game/`; these wrappers do not make Node checks equivalent to engine evidence.
- Wrapper scripts are in `tools/unity/`, while the package implementation is in `unity-remote/unity-package/`.
- Existing migration leftovers can still spell `tools/...` or `Tool/...` (wrong case) relative to repo root; check consumers rather than trusting the old prefix.

## COMMANDS
From the repository root; package commands are intentionally qualified.
```bash
npm ci --prefix TOOL/tools
npm --prefix TOOL/tools test
npm --prefix TOOL/tools run test:unity-remote
```

## ANTI-PATTERNS
- Do not regenerate or overwrite submodule guidance as though it were maintained by the parent repository.
- Do not change a submodule's product files to fix a repository wrapper path without confirming which side owns the defect.
- Do not cite sibling tool README workflows as permission to launch a GUI Editor for Janseon.
- Do not place repository-only tooling dependencies in Unity player assemblies.
- `character-forge` is gone from `.gitmodules`; do not restore its rows or guidance from older docs.
