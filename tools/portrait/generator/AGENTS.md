# GENERATOR TRANSPORT KNOWLEDGE BASE

Score 12 (8-15 band, distinct domain): own private package `portrait-generator-preflight` (Node >=24), 43 files / ~11k LOC; CLI `portrait-generator` — preflight + one-request generate transport, operator pins required (boundary in parent AGENTS.md).

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Preflight + schemas | `src/preflight.ts` (`preparePortraitConditions`; position/look/candidate/operator-pin schemas) |
| CLI dispatch | `src/command-runner.ts` + `src/cli.ts` (subcommands `preflight` \| `generate` \| `generate-reviewed`) |
| Projection ingress | `src/projection.ts`, `src/projection-ingress.ts` |
| Transport / review dispatch | `src/transport.ts`, `src/review-dispatch.ts` |
| Installer | `src/install-{cli,command,binary}.ts`, `install.ps1`/`install.sh`, script `compile:installer` |
| PNG handling | `src/png.ts` |
| Private evidence | `private/receipts/`, `.evidence/` |

## CONVENTIONS

- Toolchain: `test` = `bun test`; `build` = `tsc -p tsconfig.build.json` + `bun build` (dist `cli.js`); `compile` = standalone `dist/portrait-generator`; both `bun.lock` and `pnpm-lock.yaml` are present.
- `typecheck` = `tsc --noEmit`; `lint` = `biome check .`.
- Operator pins/profile SHAs are supplied independently of candidates and reviews; the transport enforces this.

## ANTI-PATTERNS

- apiKeys: env-sourced by caller configuration only; never in projections, request evidence, logs or artifacts; a key inside authored prompt content is rejected.
- No implicit retries in transport; failures surface and the operator re-dispatches.

## COMMANDS

```bash
npm --prefix TOOL/avatar-gen/portrait/generator run typecheck  # tsc --noEmit
npm --prefix TOOL/avatar-gen/portrait/generator run lint       # biome check .
npm --prefix TOOL/avatar-gen/portrait/generator test           # bun test
npm --prefix TOOL/avatar-gen/portrait/generator run build       # tsc + bun build -> dist/cli.js
npm --prefix TOOL/avatar-gen/portrait/generator run compile     # standalone dist/portrait-generator
# CLI: portrait-generator preflight | generate | generate-reviewed
```
