# LORE/offices — JSON-canon pilot

`Offices-and-Ranks.md` is a generated projection. Its only canon is JSON under `LORE/canon/` (`tables/office-tiers.json`, `relations/state-office-titles.json`, `locales/ko-KR/offices-and-ranks.json`, schema in `schema/offices.schema.json`).

- Never hand-edit the Markdown. Edit the JSON, then `node TOOL/tools/wiki/offices-render.mjs`; `--check` fails with `E_DRIFT` on any difference.
- State display names in the state-by-tier table come from the `states[]` registry in `World-Narrative-Atlas.md`; keys are `S01–S16` / `T1–T5`, never names or catalog slugs.
- No Markdown-to-JSON reverse path exists or may be added.
- Tests: `node --test TOOL/tools/wiki/test-offices-canon.mjs`.
