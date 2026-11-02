# tools/ — moved tool packages

Moved from `seoul-dengoku-tools` on 2026-11-02 (`TOOL/...` -> `tools/...`). Each directory is its own package with its own `package.json`, lockfile and tests; none of them is part of the wiki's root `npm`, Vite, or `tsconfig` scope. Nested `AGENTS.md` files inside each package still apply.

| Directory | Former path | What it is |
|---|---|---|
| `portal/` | `TOOL/tools-portal` | Local-first tools portal (`ssstool` CLI, MCP, server, Windows native host). Depends on `../portrait/generator`, `../people-cli` (`file:`), `../portrait/{2d,acceptance}`, `../local-ai`, `../shared-web-ui/src/tokens.css` |
| `local-ai/` | `TOOL/local-ai` | Local AI worker broker, ComfyUI maintenance, backup/restore; shares code with `portal/` |
| `portrait/` | `TOOL/avatar-gen/portrait` | Portrait stack: `2d/`, `generator/`, `acceptance/`, `native/`, `pipeline/`, `tools/character-tool/` (Blender ARP/Voxel rigging CLI) |
| `shared-web-ui/` | `TOOL/shared-web-ui` | Shared React UI + tokens; the wiki consumes the pinned tarball in `vendor/` |
| `document-renderer/` | `TOOL/document-renderer` | Shared document renderer; the wiki consumes the pinned tarball in `vendor/`. seoul-dengoku-tools GDD canon and design-store import `tools/document-renderer/dist` from a sibling checkout |
| `hub-deploy/` | `TOOL/tools/deploy` | Self-hosted hub build/deploy. Copied byte-for-byte; still assumes the old parent-monorepo layout. See `hub-deploy/MOVED.md` before use |
| `people-cli/`, `cast-cli/`, `people/` | `TOOL/tools/{people-cli,cast-cli,people}` | People originals CLI, cast draft CLI, people snapshot store |
| `portrait-template/` | `TOOL/tools/art/portrait-template` | Re-export shims over `portrait/2d` |

## Install / test (from wiki root)

```bash
npm ci --prefix tools/portrait/acceptance --ignore-scripts && npm --prefix tools/portrait/acceptance run build
npm install --prefix tools/portrait/generator --ignore-scripts --package-lock=false && npm --prefix tools/portrait/generator run build
npm install --prefix tools/people-cli --ignore-scripts --package-lock=false && npm --prefix tools/people-cli run build
npm ci --prefix tools/portal --ignore-scripts && npm --prefix tools/portal run build
npm ci --prefix tools/portrait --ignore-scripts
npm --prefix tools/portrait test            # also: run test:2d, run test:character
npm --prefix tools/portrait/acceptance test
npm --prefix tools/portrait/generator test
npm --prefix tools/people-cli test
LOCAL_AI_TEST_PYTHON=<venv python with numpy/pydantic/Pillow> npm --prefix tools/portal test
node --test tools/local-ai/test/<file>.test.mjs
npm --prefix tools/document-renderer test
npm --prefix tools/shared-web-ui test
```

## Known pre-existing failures (same count before and after the move)

- `portrait` 2D suite: 53 failing tests (connection config and historical fixtures).
- `portrait/generator`: 44 failing, 2 errors.
- `portal`: 27 failing; `portal` build fails because `src/training-generation.ts` imports `ART-ASSETS/portrait-training/*` manifests that are not in any checkout.
- `local-ai`: several node:test files fail (backup-restore, forced-stop, portal-admission, wsl-bridge).
- Tests that reference `ART-ASSETS/portrait-references/` or `ART-ASSETS/portrait-training/` point at assets that no longer exist in either repository.
