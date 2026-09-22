# LORE/name-pools — machine-verified naming and values datasets

Earned its file: score ~8 (87% structured data, own schema contract `hangnyeol-schema.md`, cross-repo centrality — consumed by LORE/characters, TOOL/tools/cast, wiki gates); distinct domain — sourced, audited JSON datasets rather than prose.

## OVERVIEW
JSON datasets feeding character naming (surnames, 본관, 항렬), the numeric values canon for the 1001 cast, and generated roster/backfill drafts; one contract doc defines required fields and checks.

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Data contract (required fields, check rules) | `hangnyeol-schema.md` — when doc and verifier code disagree, the code is canonical |
| 본관/항렬 canon chain | `surnames-bongwan.json` (517 surnames, 413 본관; must be a superset of `surnames.json`) → `clans-hangnyeol.json` (10) → `clan-hangnyeol-tables.json` (170 clans) → `hangnyeol-systems.json` (9 systems) → per-person application in `cast-hangnyeol.json` (1001 cast; statuses `unconfirmed`/`unused`) |
| Simple name pools | `surnames.json` (40 one-syllable surnames), `given-male.json`, `given-female.json` — used by heir generation and the random roster |
| Numeric canon for the cast | `values-cast.json` — schema `janseon.values.cast.v2`, 1004 people (18 주요 locked, 98 S1, 200 S2, 110 S3, 578 S4), 10 value axes + 7 desire axes, −100..100 |
| Org values | `values-orgs.json` — schema `janseon.values.orgs.v1`, 37 orgs (HC/HP/XT), same 10 value axes + 9 policy domains |
| Name-collision check | `existing-names.json` — every already-used given name |
| Unvetted candidates | `roster-100.json` — Nemotron-Personas-Korea sample, seed 90421 |
| Draft card backfill | `cast-backfill-draft.json` / `.md` — 422 rows, name-hash-seeded, deterministic stamp 2026-09-12 |

## CONVENTIONS
- Sourced datasets carry `{id, schema, note, sources[]}`; each source is `{id, url, accessed, quote, evidence, live_check}` with all fields filled. `quote` must be copied verbatim from the URL — summary/translation/rewrite is not a quote. `evidence` points into `RESEARCH/verification/hangnyeol/raw/*.md`; the verifier opens that file and matches the quote (whitespace-normalized). Unresolvable `sources: ["<id>"]` references fail.
- `live_check` re-opens URLs independently: `verbatim_ok` / `artifact_corrected` additionally require `record_id` + `live_check_ref` into `raw/_verify-*.md`, and the declared verdict must equal the report's table cell exactly (not a substring). `live_verified%` and `sourced%` measure different things.
- Population figures are citable data: a row carrying a number needs a source quote containing that number.
- Generators and their tests live in `TOOL/tools/cast/` (`hangnyeol_names.py`, `bongwan_assignment.py`, `fill_values.py`, `expand_cast_to_1000.py`, `generate_backfill_draft.py`, `generate_nemotron_roster.py` + `test_*` files).

## ANTI-PATTERNS
- A claim refuted by live re-check is removed from the dataset — never re-labeled `artifact_corrected` to pass the gate.
- `roster-100.json` is CC BY 4.0: redistribution requires NVIDIA attribution, dataset URL, version, original row UUIDs, and transformation notes; `source_uuid` alone is not provenance. Synthetic personas are never treated as real-person facts.
- `cast-backfill-draft.*` rows become canon only after a human marks ✓ or corrects them — never paste them into `LORE/characters/Cast-State-*` or the indexes directly.
- Canonical script path casing is `TOOL/…` and `RESEARCH/…` (git); the schema doc's `Tool/…`/`Research/…` spellings only resolve on case-insensitive checkouts.

## COMMANDS
```bash
node TOOL/tools/wiki/verify-hangnyeol.mjs          # data contract (add --cast for per-person application)
node TOOL/tools/wiki/test-verify-hangnyeol.mjs     # verifier unit tests
python3 TOOL/tools/cast/test_hangnyeol_names.py    # naming generator tests
```
