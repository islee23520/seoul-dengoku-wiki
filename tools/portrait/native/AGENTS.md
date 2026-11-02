# NATIVE LIB KNOWLEDGE BASE

Score 15: own package `seoul-avatar-generator` (Node >=24), 48 files / ~3.7k LOC; the shared algorithm core imported by generator, acceptance, pipeline and 2d.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Lib entry | `lib/index.mjs` (`project`, `validateProjection`, `generatePortrait`, `modifyPortrait`, proportion helpers, `strictJSONParse`, `sha`, mode adapters) |
| 2D generation algorithm | `lib/2d/image-generate.mjs` (~586 LOC) |
| Complete-source replacement | `lib/2d/complete-source.mjs` (`completeSourceReplacement`, `prepareCompleteReplacement`; sparse-alpha policy + approval registries) |
| Normalized projection schemas | `lib/normalized/` (incl. `projection.schema.json`) |
| CLI | `bin/seoul-avatar.mjs` (npm bin `seoul-avatar`) |
| Request/source examples | `examples/` (fullbody + 3Dparts request/source pairs, `look.json`, preview) |
| Tests | `test/*.test.mjs` (9 files, `node --test`) |

## CONVENTIONS

- `npm test` = `node --test test/*.test.mjs` — the suite includes a real local HTTP multipart roundtrip; `npm run build` = `node scripts/check.mjs` (verification, not compilation).
- Transport is one-request multipart against the fixed image model `gpt-image-2.5-sunburst`.
- Source files are immutable; outputs get SHA-256 receipts, overwrites refused.

## ANTI-PATTERNS

- Do not re-implement transport/projection/proportion logic outside `lib/` — sibling packages import this package as the single core.
- Measurement hashes are evidence, not truth; do not gate on hash equality alone.

## COMMANDS

```bash
npm --prefix TOOL/avatar-gen/portrait/native test    # node --test test/*.test.mjs
npm --prefix TOOL/avatar-gen/portrait/native run build  # node scripts/check.mjs
npx --prefix TOOL/avatar-gen/portrait/native seoul-avatar --help
```
