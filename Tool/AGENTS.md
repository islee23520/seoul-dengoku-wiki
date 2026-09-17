# TOOL WORKSPACE KNOWLEDGE BASE

## OVERVIEW
Repo automation plus independently versioned tool checkouts; score 9, distinct integration and toolchain boundary.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Repository gates and generation | `tools/AGENTS.md` | Node/Python scripts owned by this repository |
| Unity execution policy | `docs/Unity-Headless-Workflow.md` | Janseon batchmode-only execution contract |
| Remote bridge integration | `docs/Unity-Remote.md`, `docs/Unity-Remote-Development.md` | Setup and integration documentation |
| Remote broker/package implementation | `unity-remote/AGENTS.md` | Separate Git submodule and its own toolchain |
| Character authoring workspace | `character-forge/AGENTS.md`, `character-forge/CLAUDE.md` | Separate Git submodule; follow its release ownership |
| Submodule URLs and ownership | `../.gitmodules` | Paths are `Tool/unity-remote` and `Tool/character-forge` |

## CONVENTIONS
- `Tool/` is an integration directory, not an npm package; repository scripts are below `Tool/tools/`.
- From repository root use `npm --prefix Tool/tools ...` and `node Tool/tools/<domain>/<script>.mjs`.
- Do not shorten this to `npm --prefix Tool` or `Tool/art`; neither is the repo-tool package location.
- Submodules retain independent dependencies, tests and guidance; a parent tooling check does not validate their products.
- The external Unity Remote project's interactive workflows do not override Janseon's headless execution policy.
- Unity runtime/import work belongs to `../Game/`; these wrappers do not make Node checks equivalent to engine evidence.
- Wrapper scripts are in `tools/unity/`, while the package implementation is in `unity-remote/unity-package/`.
- Existing migration leftovers can still spell `tools/...` relative to repo root; check consumers rather than trusting the old prefix.

## COMMANDS
From the repository root; package commands are intentionally qualified.
```bash
npm ci --prefix Tool/tools
npm --prefix Tool/tools test
npm --prefix Tool/tools run test:unity-remote
```

## ANTI-PATTERNS
- Do not regenerate or overwrite submodule guidance as though it were maintained by the parent repository.
- Do not change a submodule's product files to fix a repository wrapper path without confirming which side owns the defect.
- Do not cite sibling tool README workflows as permission to launch a GUI Editor for Janseon.
- Do not place repository-only tooling dependencies in Unity player assemblies.
