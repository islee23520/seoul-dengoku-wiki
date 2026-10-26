# Contributing

The test workflows have been removed. Build and data verification still require the configured parent-repository inputs and publication sources.

## Testing rules

Test suites and test scripts were removed by owner decision (2026-10-26). Do not add new test scripts; verify data with the cast authority check and the generate gate, and keep one-off verification out of the committed tree.

## Historical person sheets

`npm run generate` and `npm run build` load both historical sheets from the committed `vendor/issued-history/` inputs. No `WIKI_PERSON_SHEET_SOURCES`, historical Git checkout, network fetch, or private evidence directory is required. The existing parent inputs still come from the parent checkout or `SEOUL_KENSHI_ROOT` when this Wiki is in a standalone worktree.

The exact revisions are `ce173686bcba220cd2a7dedfb5c78b941bf3c151` and `5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4`. `scripts/issued-preservation-baseline.json` binds the original ledger bytes and citation corpus. `node scripts/import-issued-history.mjs` is an explicit maintenance import from those Git objects, not a build step or a rebaseline command. It verifies every expected hash before writing any archived input. The corpus is historical evidence, not an alternative current lore source.

Current person details are regenerated from `lore/`. Stable issued IDs, names and routes bind a historical sheet to a current person. `personSheet.currentState` is checked against current canon; each variant's `historicalState` is checked against its sealed record. Historical affiliation is never required to equal current affiliation. Historical records and numbers remain unchanged and nonoperative; selecting a revision does not assign new opposed-d10 ratings.

Run `node scripts/check-preserved-generation.mjs` to exercise the standard build without sheet-specific environment variables and verify a second standard generation is byte-identical.
