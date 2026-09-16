# Portrait tool

Canonical package path: `Tool/art`. Do not add a second root `tools/` folder.

- Original (immutable): `original/target.png` — SHA-256 `c3a7e4815de6acaef28faf429395417a001bfe8088df633537c6e1a2aa9109a9`. Same bytes as `Design/portrait-demo/assets/v2/target.png`. Never auto-replace.
- Final default combo: `final/h0-e0-o0.png` (dirty vs target = 0).
- Eight-combo matrix: `final/matrix/h{0,1}-e{0,1}-o{0,1}.png` (8 unique hashes).

```bash
node Tool/art/portrait/verify-portrait-recipe.mjs --recipe .omo/evidence/portrait-authoring-v2/recipe.json --mode contract
node Tool/art/portrait/verify-portrait-recipe.mjs --recipe .omo/evidence/portrait-authoring-v2/recipe.json --mode base
node Tool/art/portrait/verify-portrait-recipe.mjs --recipe .omo/evidence/portrait-authoring-v2/recipe.json --mode matrix
node --test Tool/art/portrait/test-portrait-layer-composite.mjs Tool/art/portrait/test-portrait-layer-slots.mjs Tool/art/portrait/test-ingest-see-through.mjs
```

## Stage-2/3 machine gates

[QUALITY-GATE.md](QUALITY-GATE.md) is the prose contract. These three checkers are its
machine half. None of them awards quality: they decide whether a record is admissible
evidence and whether the verdicts already written in it add up to acceptance.

### Permanent gateway order — `portrait-gateway.mjs`

Every portrait path uses the same cumulative order, regardless of provider or authoring tool:

1. Gateway 1 — semantic split, alpha/ownership and source reconstruction.
2. Gateway 2 — individual parts, hidden support, per-sex ownership, common shoulders and native material quality.
3. Gateway 3 — cross-combinations, exchange continuity, anchors/occlusion and real browser output.

A PASS gate needs at least one path+SHA256 evidence record. Gateway 2 cannot PASS before Gateway 1, and Gateway 3 cannot PASS before both earlier gates. Source generation and see-through splitting are always available; Anime2.5DRig/StandRig rig work unlocks after Gateway 1; slot combinations unlock after Gateway 2; save/export, character assignment/binding and runtime handoff unlock only after Gateway 3.

`portrait-tool.mjs compose` separates three purposes: `reconstruction` for Gateway 1, `review` after Gateway 2, and `delivery` only after Gateway 3. Direct `assignPortraits` and `batch` also require all three gates. Owner approval of a flattened source, API success, PSD import, auto-rig preview, numeric QA, file count or runtime file existence never skips this order.

The browser tool loads `Design/portrait-demo/assets/v2/workflow.json`, displays the two Civitai profiles and six tool lanes, and locks sex/slot/randomize/save/export controls according to the same contract. `작업 패킷 JSON` remains available while locked for handoff to external authoring tools.

### Review records — `verify-portrait-review.mjs`

Vocabulary lives in [portrait-review-contract.json](portrait-review-contract.json)
(Q01–Q10, GQ1–GQ4, the nine numeric gates, reviewer roles). A record is refused when it
drops or doubles a row, binds a reference other than the frozen target, carries an
aggregate score, or records `N/A` on a composite. It stays admissible but **not accepted**
when a row reads FAIL or NOT_VERIFIED, when a numeric gate is not PASS, or when a PASS
lacks a bound native crop — such a PASS is downgraded to NOT_VERIFIED rather than counted.
A `worker` reviewer can never produce PASS.

```bash
node Tool/art/portrait/verify-portrait-review.mjs --record <path>.json --repo-root "$PWD"
```

```jsonc
{
  "schema_version": 1,
  "checkpoint": "GQ2",                       // GQ1 pilot · GQ2 variant · GQ3 composite · GQ4 delivery
  "reviewer": { "name": "owner", "role": "owner" },
  "reviewed_at": "2026-09-15T04:30:00Z",
  "subject": {
    "kind": "variant", "id": "female/hair/hair-03", "sex": "female", "slot": "hair",
    "candidate": { "path": "...", "sha256": "..." },
    "contributing": [{ "slot": "hair", "path": "...", "sha256": "..." }]
    // GQ3 adds "crosses": [ ... ] (>= 4); GQ4 adds "character_id" and "export"
  },
  "reference": { "path": "Tool/art/portrait/original/target.png", "sha256": "c3a7e481..." },
  "inspection": {
    "native_crops": [{ "path": "...", "sha256": "..." }],
    "full_50pct": { "path": "...", "sha256": "..." },
    "demo_scale": { "path": "...", "sha256": "..." },
    "isolated_backdrops": ["black", "gray", "white"]
  },
  "rows": [{ "id": "Q01", "verdict": "PASS", "crop": "...", "observation": "..." }],
  "numeric_gates": { "dimensions": "PASS", "anchors": "PASS", "...": "PASS" }
}
```

### Character bindings — `verify-portrait-binding.mjs`

Joins a registered person, one reproducible selection, and the exported composite. Character
ids come from the world atlas fence (`Wikis/game-logic/World-Narrative-Atlas.md`, K001–K1006);
the atlas records no sex, so each binding declares it. The gate refuses an unregistered or
doubled character, a selection missing a required slot, a female `beard`/`beard_back`
selection, an unknown slot or variant, a slot with fewer than ten variants, and an export that
drifted from its hash. Determinism is enforced both ways: one selection may not yield two
export hashes, and two selections may not share one.

```bash
node Tool/art/portrait/verify-portrait-binding.mjs --bindings <path>.json --repo-root "$PWD"
```

### Unity ingestion — `character-portrait` runtime slot

Intent decision 8 says Unity receives the offline-composited PNG/atlas only. That is now a
contract row in [../runtime-slot-contract.json](../runtime-slot-contract.json) with
`composite_only: true`: a per-slot authoring plate landing under
`Game/Assets/Janseon/Art/Portrait/` fails the provenance gate as
`portrait_layer_plate_forbidden`, and any other undeclared runtime file as
`composite_only_extra_file`. The slot stays blocked until a BOM row carries
`look.owner_verdict: accepted` — gate 7 is unchanged.

```bash
node --test Tool/art/portrait/test-verify-portrait-review.mjs \
  Tool/art/portrait/test-verify-portrait-binding.mjs
node --test Tool/art/test-runtime-asset-provenance.mjs
```

## The offline tool — `portrait-tool.mjs`

The command-line half of the portrait surface: plates in, one composited PNG out.
It composites and records; it never judges art. A library it builds carries
`quality_acceptance: "NOT VERIFIED"` until a GQ review record says otherwise.

```bash
# 1. Inventory plates into the manifest the demo and the gates share.
#    Convention tree: <plates>/<sex>/<slot>/<variantId>.png
node Tool/art/portrait/portrait-tool.mjs library \
  --plates Design/portrait-demo/assets/v2/plates \
  --out Design/portrait-demo/assets/v2/library.json --repo-root "$PWD"

# 1b. Or adapt the Stage-1 partition recipe (one identity, honestly short of ten variants).
node Tool/art/portrait/portrait-tool.mjs library \
  --recipe .omo/evidence/portrait-authoring-v2/recipe.json --sex female \
  --out <dir>/library.json --repo-root "$PWD"

# 2. Compose one selection.
node Tool/art/portrait/portrait-tool.mjs compose \
  --library <dir>/library.json --workflow <dir>/workflow.json --purpose delivery --sex female \
  --select hair=hair-h0,eyes_color=eyes_color-e0,... --out <dir>/out.png --repo-root "$PWD"

# 3. Assign and export portraits for registered characters, then check the result.
node Tool/art/portrait/export-human-roster.mjs --out <dir>/humans.json --repo-root "$PWD"
node Tool/art/portrait/portrait-tool.mjs batch \
  --library <dir>/library.json --workflow <dir>/workflow.json --roster <dir>/roster.json --seed janseon-portrait-v1 \
  --out-dir <dir>/portraits --repo-root "$PWD"
node Tool/art/portrait/verify-portrait-binding.mjs --bindings <dir>/portraits/bindings.json --repo-root "$PWD"
```

- **Composition** is source-over by slot `z`, on the library canvas, with every plate
  checked against its recorded hash. A missing required slot, a selection on a slot
  disabled for that sex, an unknown variant or a drifted plate all throw rather than
  render something plausible.
- **Sex is never inferred.** The atlas carries no sex field and the binding contract
  requires an operator to state it, so `batch` takes no `--sex`: it reads a roster of
  `{id, sex}` entries and refuses any entry that leaves sex unset.
- **Assignment** is a pure function of `(seed, character_id, slot)` — editing the roster
  never reshuffles anyone else's portrait, and a rerun reproduces identical bytes.
- **Batch** refuses to write into an existing directory, and emits `bindings.json` in
  exactly the shape `verify-portrait-binding.mjs` checks, so a short library fails closed
  (`variant_count_short`) instead of shipping as a delivery.
- Stage-1 `empty: true` plates stay marked in the manifest, so a deliberately transparent
  slot is never mistaken for authored content.

Verified against the tracked Stage-1 truth: the derived library reproduces
`original/target.png` and all eight `final/matrix` composites at `changedPixels: 0`.

### Roster projection — `export-human-roster.mjs`

`SERVICES.md` serves the demo at `/portrait-demo/`, so the page cannot fetch
`../../Wikis/...`. This exporter writes the projection it can fetch, and `--check`
proves a committed projection still matches the atlas it claims to come from.

```bash
node Tool/art/portrait/export-human-roster.mjs --out <dir>/humans.json --repo-root "$PWD"
node Tool/art/portrait/export-human-roster.mjs --out <dir>/humans.json --check --repo-root "$PWD"
```

It is a projection, not a second identity authority: ids are copied rather than
allocated or derived from order, only `humans[]` is admitted (never `synthetics`,
`hostile_groups` or any other cohort), null labels on corridor records are preserved
rather than repaired, and **no sex field is synthesized**. A duplicated id, a missing
id or a human count other than 1006 fails closed.

### Verdicts written in ledger prose

The Stage-2/3 quality ledger (`portrait-stage23-quality-ledger.v1`) records verdicts as
qualified prose — `PASS limited garment-only`, `FAIL DEFERRED`, `PENDING lead image
channel`. `verify-portrait-review.mjs` normalizes those instead of refusing them, and
does so conservatively: only a bare `PASS` is a pass, a qualified pass becomes
`NOT_VERIFIED` (`reason: qualified_pass`), and deferring a failure does not clear it.
