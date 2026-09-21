# LORE/structures — JSON-canon domain

`Structures.md` is a generated projection. Its only canon is JSON under `LORE/canon/` (`tables/documents.json`, `tables/structure-kinds.json`, `relations/structure-kind-details.json`, `locales/ko-KR/structures.json`, schema in `schema/structures.schema.json`).

- Never hand-edit the Markdown. Edit the JSON, then `node TOOL/tools/wiki/structures-render.mjs`; `--check` fails with `E_DRIFT` on any difference.
- Internal IDs (`doc.<file stem>`, `structure.*`, `structures.*` block IDs) are never public. Link targets resolve through `documents.json`; an unknown target is `E_FK_DOC`.
- The generated file has no banner, so the public mirror and Patina receipt stay byte-stable; this file and `--check` are the guard.
- No Markdown-to-JSON reverse path exists or may be added.
- Tests: `node --test TOOL/tools/wiki/test-structures-canon.mjs` (also part of `npm --prefix TOOL/tools test`).
