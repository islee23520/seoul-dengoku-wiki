# DOCUMENT RENDERER

`@seoul-dengoku/document-renderer` (v0.1.2, Node >=20): peer-React renderer for the shared document content contract - Wiki blocks, normalized GDD blocks, Markdown round-trip, and host-supplied lazy Mermaid - in one module: `src/index.ts` (295 lines, 23 exports). Existing knowledge file, expanded 2026-10-20 from a 7-line workflow note; standalone score 7 (kept as an existing cross-subtree rendering contract; reference counts are grep counts, LSP workspace measurement unavailable).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Entire public surface | `src/index.ts` | `DocumentContent`, `renderDocumentMarkdown`, `fromWikiBlocks`, `fromGddBlocks`, `MermaidDiagram`, types `WikiBlock` / `GddDocument` / `DocumentEnvelope` |
| Round-trip design notes | `Concept.md`, `README.md`, `ToDo.md` | |
| Tests | `test/` | `npm --prefix TOOL/document-renderer test` = build, then vitest |
| In-repo consumer | `TOOL/tools/canon/materialize-gdd.mjs` | requires this package built first |

## CONVENTIONS (repository workflow)

- Keep this package limited to rendering the shared document content contract and adapting normalized GDD blocks.
- Keep React as a peer dependency and build the distributed entry before publishing a Git tag.
- Verify type checking, tests, package build, and a server-rendered consumer smoke check before committing.
- Commit only reviewed package files; push the verified commit and tag to the approved public GitHub repository.
- Build before use: `main` and `exports` point at `dist/index.js`; run `npm ci --prefix TOOL/document-renderer && npm --prefix TOOL/document-renderer run build` before `tools/canon/materialize-gdd.mjs` (or any consumer) executes.
- Mermaid is host-supplied and lazy: consumers pass `loadMermaid?: () => import('mermaid')`; without a loader, diagram code stays a plain code block. Never import `mermaid` statically.
- `renderDocumentMarkdown` round-trips document content back to Markdown; keep it a round-trip, not a general-purpose Markdown engine.
- Zero runtime dependencies besides peer React (`dependencies: {}`); keep it that way.

## ANTI-PATTERNS

- Never import from `src/` in consumers - always the built `dist/` artifacts.
- No site chrome, tokens, or layout here; `TOOL/shared-web-ui` owns those.
- Do not let renderer changes reach consumer sites without a reviewed, tagged release.
- Do not add fetching, storage, or quality-gating of source documents; this package renders prepared content only.

## COMMANDS

```bash
npm ci --prefix TOOL/document-renderer
npm --prefix TOOL/document-renderer run build        # tsc -p tsconfig.json -> dist/
npm --prefix TOOL/document-renderer run typecheck
npm --prefix TOOL/document-renderer test             # build + vitest run
```
