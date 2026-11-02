# ACCEPTANCE EVALUATION KNOWLEDGE BASE

Score 12 (8-15 band, distinct domain): own package `portrait-acceptance` (Node >=24), 46 files / ~10k LOC; internal-testing evaluator (`evaluatePortraitAcceptance`) + CLI `portrait-acceptance` — the "never owner/release approval" boundary lives in the parent AGENTS.md.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Entry exports | `src/index.ts` (`evaluatePortraitAcceptance`, `PORTRAIT_ACCEPTANCE_CRITERIA`, `BatchHoldError`, `requireBatchReview`) |
| Evaluators | `src/evaluator.ts`, `src/evaluator-replacement.ts` |
| Batch gate / criteria | `src/batch-gate.ts`, `src/criteria.ts` |
| Observable review | `src/observable-review.ts` |
| Proportion profiles | `src/proportion.ts`, `proportion-foundation.ts`, `proportion-artifacts.ts`, `proportion-error.ts` |
| Source draft comparison | `src/source-measurement.ts` |
| Ingress / decode / PNG | `src/acceptance-ingress.ts`, `src/measurement-byte-decoder.ts`, `src/png.ts` |
| CLI | `src/cli.ts` -> `dist/cli.js` (bin `portrait-acceptance`) |

## CONVENTIONS

- Toolchain: `test` = `bun test`; `build` = `tsc -p tsconfig.build.json`; `typecheck` = `tsc --noEmit`; `lint` = `biome check .`; both `bun.lock` and `pnpm-lock.yaml` are present.
- `.omo-private/` and `.private-evidence/` hold private evaluation evidence.
- Tests dominate LOC here (single test files up to ~1464 LOC); production logic concentrates in `evaluator*.ts` and `proportion-foundation.ts` — read those before editing.

## ANTI-PATTERNS

- Never publish or commit contents of `.omo-private/` / `.private-evidence/` (private source imagery included).
- Do not import batch-gate internals directly; consume `src/index.ts` exports.

## COMMANDS

```bash
npm --prefix TOOL/avatar-gen/portrait/acceptance run typecheck  # tsc --noEmit
npm --prefix TOOL/avatar-gen/portrait/acceptance run lint       # biome check .
npm --prefix TOOL/avatar-gen/portrait/acceptance test           # bun test
npm --prefix TOOL/avatar-gen/portrait/acceptance run build       # tsc -> dist/cli.js
# CLI: portrait-acceptance <image> <review> ...
```
