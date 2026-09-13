# Structured design store — discovery digest

Planning only. No product/JSON/source edits, no service install, no migration, no PR #87 merge, no deploy. Dirty WT paths left as-is.

## Inputs and measurement

| Input | Present | Role |
|---|---|---|
| `.omo/research/structured-design-store/corpus.md` | yes (2026-09-13) | content inventory |
| `.omo/research/structured-design-store/consumers.md` | yes | parsers, projections, runtime fences |
| `.omo/research/structured-design-store/storage-options.md` | yes | SQLite vs JSON vs MongoDB |
| `.omo/plans/structured-design-store.md` | missing | final plan; out of this node |

Extra unassigned file `design-brief.md` exists in the same folder. Not an input. INCONCLUSIVE as authority.

**Fold-in (not a re-inventory):** latest `.omo/locks/ate-grammar-reference.md` (STATUS CONFIRMED 2026-09-13) and `.omo/research/r-ate-grammar-only.md`. Sibling `corpus.md` / `consumers.md` / `storage-options.md` are not edited. Count tables above are unchanged except the two corpus errors resolved below.

**Checkout (this verify pass):** WT `/Users/ilseoblee/workspace/seoul-kenshi`. HEAD `5bd47ee0780186709ec71f95db0687fac2bf90fa`. `origin/main` `4343cc00727c760ffb94af1a6a7a3ea27317533b`. `HEAD^{tree}` = `origin/main^{tree}` = `96daf323f58a48f69f8a1cb89cfbb6760eb85c5b` (commit SHAs differ; trees match). `git status -sb`: `main...origin/main [ahead 2, behind 2]`. Dirty includes `Design.md`, `SERVICES.md`, `vercel.json` (and unrelated Game/docs-site paths). Reports measured HEAD `09863cf39209467c56c5459e8b4a552e58db2b3e`; that commit is an ancestor of current HEAD (`git merge-base --is-ancestor` exit 0). Atlas blob id `a4a7d55fa58071b19502f9bebb8c5554349bd447` and SHA-256 `61650e2e4605df4e147030b08457d51d0a9366362fe6599d89ff6505683708e1` are unchanged.

Inventory scopes used below (not a 198-file pin):

- Tracked top-level `docs/game-logic/*.md`: **202** (`git ls-files`, path depth 3).
- Tracked `docs/game-logic/reference/*.md`: **18**.
- Tracked `docs-site/{design,world,rules}/*.md`: **13 / 165 / 36**.
- Basename overlap `docs-site/world` ∩ top-level game-logic: **164**.
- Atlas file: **5,072,804** bytes, **57,612** lines.
- Atlas projections in memory: **125**.
- Fragment regex `Story-Batch-B###|Monster-Batch-M###|Hostile-Group-G##`: **113** files (45+41+27). `publishedFragmentPages`: **25** (B001 + G01–G24). Excluded: **88**.

## Verified central claims

### Trees, PR #87, region branch

- **PR #87 is not main.** `docs/lore-audit-corrections` = `5230e02a940474e7077470a19bff84102bd5fb63`; not ancestor of HEAD (exit 1). `gh pr view 87`: OPEN, MERGEABLE, base `main`, 16 files, +640/−364. Anonymous URL HTTP 404 (private). Docs-only; calendar/gear are proposals. Eight `docs/game-logic` files match HEAD (`git diff --quiet` 0) and differ from PR tip (1). HEAD `Scenario-Timeline.md` has no 2026/2036/2042; PR `:13–28` adds that span. HEAD `Random-Cast-Roster.md:7` vs PR disagree on Nemotron names.
- **Region atlas is not main.** `feat/seoul-region-atlas-20260913` = `98cc619979eca466732050920e6d5e6158c6b8c0`; not ancestor of HEAD/`origin/main`. `git ls-tree HEAD -- docs/game-logic/regions` = 0. WT untracked; 25 JSON byte-identical to feat. Sampled SHA-256 match for `README.md`, `11110.json`, `selection.json`, `boundary-comparison.json`. GeoJSON gitignored (`regions/sources/.gitignore:1`). Merge-base with current HEAD is `09863cf…`.
- **Presence ≠ approval.** `Cast-Index.md:9,:17`. `docs/game-logic/regions/README.md:29,:70`.

### Atlas / cast / geo counts (WT parse this pass)

JSON fence `World-Narrative-Atlas.md:74`–`:57612`, `document` at `:80`. `schema=world-narrative-atlas.v1`, `document.id=WNA-001`, `document_status=active`, `owner=wiki-world`, `support_reviewers=[]`, `revision=r14` (`:86`), `last_verified_commit=c485bc84629c39e978889f1585ade92bef4ceda4` (exists; **not** current HEAD), `source_kind=original-fiction`, `document.verification_state=story-B001-authored` (`:191`). Prose table `:14` still `r11` / 검증 “가문 등록”. Prose `:38,:54` still `K001`–`K412`.

Parsed arrays: humans **422** (`K001` 한재목 … `K422` 노세람); houses **32** all `ACTIVE` / `original-fiction`; theaters **5**; synthetics **48** (H/F/V = 16); story_batches **47** (B001–B047); story_contents **45** (no B017, B020); hostile_groups **27** (G01–G27); monster_batches **42** (includes M007 id); monster_contents **41** / **422** entries (no M007 body); arcs **67**; relations **43**; change_ledger **14** (CL-0004–CL-0017); diagrams **3**. `document.projection_targets` (`:178`) lists the 10 names corpus named. House classes from JSON **data** (not corpus prose): CORPORATION **22** (`HC01`–`HC22`), PROFESSIONAL_GUILD 4, INFRA_OPERATOR 3, CIVIC_COMPACT 2, DATA_TRUST 1. Corpus “HC01–HC14” is a range typo; `document.related_ids` and atlas prose `:42` still list HC01–HC14 — treat as stale envelope, not the 22-count. Human stages: 주요 17 / S1 95 / S2 200 / S3 110. Relation kinds: operates_in 16, custodied_by 16, pressures 5, +6 firm edges. Story content `actors` slots **450**. WT SHA-256 of the atlas file equals projection banner hash on `Operating-Houses.md:3–6` and `World-Relation-Ledger.md:3–6`.

`parseCastIndex` (`tools/wiki/world-atlas-parse.mjs:24–47`) → 422 rows; positional id/name mismatches vs atlas humans: **0**. Validator requires 422 (`world-atlas-verify.mjs:94–105`). `Cast-Index.md:3` and table from `:79` = 422 names; footer `:572` “총 412명”. `Home.md:33` still “412명”. `Cast-Profile-Contract.md:5` says 422.

Person stores: `roster-100.json` `n=100` seed `90421` ids `roll-*` (`회랑` all null; ∩ humans = 0). Untracked `cast-backfill-draft.json` `count=422` (`generated=2026-09-12T00:00:00Z`; ∩ humans = 422; ∩ roster = 0). `cast-backfill-draft.md:3–8` forbids unreviewed promote. `existing-names.json` = 430 = 422 humans + 8 corridor aliases (`Cast-Corridors-Index.md:7–12`: 6 rows). Name pools: 40/40/40 + 10 clans in `clans-hangnyeol.json` (not `clans.json`). `Cast-Relations.md` **780** name-keyed rows. Files: Story-Batch **45** (no B017/B020), Hostile-Group **27**, Monster-Batch-M### **41** (no M007). G25–G27 files exist; not in Cast-Index hub.

Region WT: 25 JSON, `schema=seoul-region-content.v1`, `as_of=2026-09-12`, `district_id=gu:<code>`, **427** unique `region:*`. All 427 have the key set corpus listed (`11110.json` 청운효자동 sample `:1–80`; production.outputs/requires present). `selection.json:13` authority “not official-current certification”; `:33–42` OSM `complete_official_roster: false`, snapshot `2026-09-04T23:00:00Z`; `:51–55` `fictional_epoch.absolute_date` is `null`; `:57` `decision_kind` not legal certification. `boundary-comparison.json`: `seoul_features=427`, `invalid_ids=[]`, `sha256=c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f`. GeoJSON URL in `README.md:13` HTTP 200. `atlas-data.js` size **34,639,164** bytes. `Seoul-Station-Catalog.md:9–14`: **334** names, 25 구, OSM+KOSTAT 2013, not in Unity Assets. **Corpus “runtime only 3 stations” is wrong as a route-graph claim.** `RouteDomain.CreateSeoul` (`RouteDomain.cs:106–111`) feeds compiled `SeoulWorldGraphCatalog` (`:9–11`: DistrictCount 25, StationCount **334**, EdgeCount 435). `PocCoreLoopController.BeginNewRun` (`:114–116`) calls that path. Area-1 **content catalog** still locks 3 stations (`GameDataCatalogValidator.cs:20`; `Area1GameDataBuilder.cs:20–29`). `Home.md:20` “런타임은 세 역” matches Area-1/POC catalog, not `CreateSeoul`. Consumers already split these; use that split, not corpus. Core gameplay files were not changed this node.

`Research-Sources.md:5,:9–31`: three kinds, three records. `Era-Arms-and-Tech-Level.md:3,:46–49,:107` 설계 제안 / four layers / no model names. Seven site `Rules-*.md` + `rules/index.md` (not in top-level game-logic); `Rules-Battle.md:3` defers to implementation. RTFC 101 lines; `Home.md:44` `rtfc-owner-cards-v2`. `Intent.md:3` decision log; `:49` gateway 7. `Design.md:3` uGUI (WT dirty 6/3). `Concept.md:5,:7–12` combat lock + Unity versions. `ToDo.md:1–6` art incomplete. `Development-Roadmap.md:5` not a schedule. `Unofficial-Fan-AU-Notice.md:1–5`. `World-and-Subway-Layers.md:14–20` five layers. `Asset-Pipeline.md:15–21`. `Sixteen-States.md:3,:11`.

### Consumers (re-run this pass)

- `extractAtlasJson` uses the fence containing `world-narrative-atlas.v1` (`world-atlas-parse.mjs:13–21`). `projectionsFromAtlas` (`world-atlas-render.mjs:177–206`) → **125** keys. `renderHouses` (`:18–37`) omits charter/membership/succession required by `world-atlas-schema.mjs:111–116`.
- `materializeWorldAtlas({check:true})` **passed** 125; `atlasHash` = file SHA-256 (`materialize-world-atlas.mjs:55–86`). Unexpected-file filter exempts confirmed monster pages (`:10–12,:42–52`). No stage validators in materialize.
- Wiki `publishedFragmentPages` (`build-wiki.mjs:250–278`) = 25; mount has no that filter and does not delete stale pages (`mount.mjs:29–39,:157–180,:193–197`). VitePress lists all section Markdown; `docs:build` is VitePress only; `ignoreDeadLinks: true` (`config.mts:8–18,:27`; `docs-site/package.json:7–9`). Wiki bans `Kenshi/Underrail/Gunner/clone/복제` (`build-wiki.mjs:10`); site gate is weaker (`gate.mjs:44–61`).
- Runtime: Area-1 catalog 6/3/1/3 (`GameDataCatalogValidator.cs:20`; builder `GameDataCatalogIndexBuilder.cs:10`; hardcoded `Area1GameDataBuilder.cs:20–29`). Route graph via `CreateSeoul` compiled arrays (`RouteDomain.cs:106–111`; `PocCoreLoopController.cs:114–116`). GUID/fileID (`Area1GameDataCatalog.asset:12–34`). `EnsureCompatible` only at `ContentCatalogContracts.cs:80`. NFC hash `CanonicalContentFingerprint.cs:2`. DI `FoundationLifetimeScope.cs:18–35`; UI `GameplayPresenter.cs:894–907`; slots `RuntimeSlotCatalog.cs:12–48`.
- Adjacent: `assemble_region_content.py:15–43,:74–83` → `atlas-data.js`; viewer `system-design/regions/index.html:9`. Character-forge `design-store.ts:9–44` is localStorage. Manifest `incomplete: true` (`confirmed-integration-manifest.json:2–5`).

### Storage / authority (agree across reports)

- ADR-001 accepted (`docs/adr/ADR-001-repository-delivery-policy.md:3,:22–31`): repo docs under `docs/` are SoT; delivery is branch+PR; owner merges; Wiki is derived. A DB-canonical store needs an explicit policy amendment. Not authorized here.
- SQLite is an embedded engine, not HTTP ([S1] https://www.sqlite.org/whentouse.html HTTP 200). JSON is interchange ([J1] https://www.rfc-editor.org/rfc/rfc8259 → 200). MongoDB stores BSON ([M1] https://www.mongodb.com/docs/manual/core/document/ HTTP 200). S2–S7, J2–J3, M2–M8, V1 HTTP 200 this pass. [V2] rewrites URL 308/200 at https://vercel.com/docs/routing/rewrites.
- Vercel function storage is ephemeral ([V1] https://vercel.com/kb/guide/is-sqlite-supported-in-vercel). Proposed `/api/:path*` capture is blocked by **dirty** `vercel.json:25–28` rewrite to character-forge; **HEAD** `vercel.json` has only `outputDirectory`/`buildCommand`. Cite WT vs HEAD.
- No SQLite/Mongo service, no entity/revision/review tables, no `/design-store-api/` in this checkout. Future tables are **not implemented**.

Reports agree: keep SoT layers split; do not make the design store a live gameplay dependency; copy-if-present is invalid; Git-reviewed exports stay the publication gate until the owner amends ADR-001.

## Conflicts (do not silently resolve)

1. **412 vs 422.** Atlas JSON + Cast-Index table + validator = 422. Prose `Cast-Index.md:572`, `Home.md:33`, atlas `:38,:54`, HEAD `Random-Cast-Roster.md:3` = 412. Parser IDs follow row order (`world-atlas-parse.mjs:24–47`) despite “no renumber” prose.
2. **Atlas r11/r14 and verification_state.** Header `:14` r11 / 가문 등록 vs JSON `:86,:191` r14 / story-B001-authored. `last_verified_commit` is `c485bc8`, not HEAD.
3. **House ID span — resolved for ingest.** Machine count = 32 houses, **22 CORPORATION** as `HC01`–`HC22` (parsed this pass). Corpus “HC01–HC14” is a typo relative to that array. Prose/`related_ids` HC01–HC14 remain a **document conflict** to record, not a reason to drop HC15–HC22.
4. **Publication ≠ files.** B002+ and G25–G27 (and monster pages) exist; Cast-Index 게시 is B001 + G01–G24 + three ISO SVGs (`Cast-Index.md:37–75`). Wiki filters 25; mount does not.
5. **Three person stores + PR roster rewrite.** K-ids vs `roll-*` vs untracked backfill. HEAD vs PR #87 disagree on whether Nemotron rows contain names.
6. **Relations unjoined.** 780 name edges vs 43 atlas id edges vs 427 region `connections`/`action` strings.
7. **Geo denominators — two runtime graphs, not one “3-station runtime”.** Design catalog 334 names (`Seoul-Station-Catalog.md:9–14`) = compiled route graph 25/334/435 (`SeoulWorldGraphCatalog.cs:9–11` via `CreateSeoul`). Area-1 catalog 3 stations is a separate content snapshot. 427 dongs and 16 states are not station counts. `SeoulWorldGraph.json` does not drive `CreateSeoul`.
8. **Chronology is a separate owner decision.** Grammar inspiration does **not** approve a centuries-long calendar. PR #87’s 2026→2036→2042 six-year proposal is still not HEAD (`Scenario-Timeline.md` this tree: zero `2026|2036|2042` hits). `selection.json:55` `absolute_date` is `null`. Do not inherit either span into schema/epoch fields.
9. **SERVICES.md / vercel.json dirty vs HEAD.** Consumers/storage line pins for character-forge rewrites and `/api/:path*` describe WT, not HEAD. Both still mark `system-design/` as 대기 (`SERVICES.md` table).
10. **Rules vs code.** Site `Rules-Battle.md:3` vs Core constants vs Area-1 catalog lock.

## INCONCLUSIVE (not approved)

- Stage validators / isometric contracts not re-run; projection equality ≠ Wiki publication.
- `build-wiki.mjs:318–404`, `publish-wiki.mjs`, image staging, art provenance scripts: not re-read this pass.
- Nemotron parquet hash absent; generator Windows path (`generate_nemotron_roster.py:2–6`) is not a host proof. `atlas-data.js` size only; full vs feat hash not computed. Mount freshness vs game-logic (except PR #87’s 8 files) not hashed.
- Corridor alias pairing beyond Cast-Corridors table; G25–G27 beyond file presence; per-house `projection_targets` not exhaustively printed.
- No Unity/browser/deploy. Anonymous PR URL HTTP 404 (`gh` OK). Context7 not replayed. WAL/throughput/`E:/git/design-store-data/` not measured.

## Grammar, camera, export (fold-in)

**Campaign vs battle (latest lock `:16`, target ≠ legacy code).** Inspiration grammar is **campaign-only**: politics · faith · culture **between sorties**. Do not import a reference tick scheduler or vassal UI. Battle is a **separate invariant**: fixed isometric, square grid, four directions, movement then action (`ate-grammar-reference.md:16`; camera/grid also `Intent.md:11`, `Concept.md:5`). Preserve this lock as the plan/world target; do not retarget Area-1 3-station catalog or RTFC tick code from this node. Product language: 「후세 서울 · 지역 분열 · 왕조·봉신」 (`r-ate-grammar-only.md:13`). Allowed axes: post-collapse local identities; line/district identity; faith/culture schism; dynasty/vassal politics on the campaign layer only.

**Public export ban:** no source-mod/IP names or mod assets in wiki/site/store (`ate-grammar-reference.md:22,:25–26`). Wiki already bans `Kenshi`/`Underrail`/`Gunner`/`clone`/`복제` (`build-wiki.mjs:10`). Public title 《잔선》 only. Exporters must not copy lock/memo proper nouns.

**Art slots:** portrait is 2D composite (`Character-Art-Direction.md:27,:43,:84–87`; `Asset-Pipeline.md:15,:40` `portrait` vs `character_mesh`). Mesh path is separate 3D (`Asset-Pipeline.md:34–36`). Lock hard-ban: portrait `wFR`/`wFT` vs mesh `wBJ` (`.omo/locks/ate-grammar-reference.md:26`). Token names were **not** found in tracked `docs/` this pass (INCONCLUSIVE as implemented BOM keys; treat as lock constraint for exports).

**Authoring authority: UNANSWERED.** Owner has not chosen central API/SQLite vs Git JSON. **Recommend default (not approved):** keep versioned Git JSON/Markdown canonical per ADR-001 (`:3,:22–31`) and the storage-options “no policy amendment” row. SQLite HTTP service remains a proposed target only. Do not treat `/design-store-api/`, entity/revision tables, or a durable host as owner-approved.

Memo `:29` still waits on owner confirmation of 3-layer faith + culture kit mapping. INCONCLUSIVE as world schema until answered.

## Assumptions (explicit)

- **Recommended default, not owner-approved:** Git remains canonical until ADR-001 is amended. Any database is a rebuildable index. Central API/SQLite is UNANSWERED.
- Dirty WT (`Design.md`, `SERVICES.md`, `vercel.json`, untracked regions/backfill) is evidence of checkout state, not merged authority.
- `source_kind` remains `{verified, inference, original-fiction}` (`Research-Sources.md:5`, `world-atlas-schema.mjs:3`).
- Runtime catalogs stay snapshots; design records must not become a live gameplay read path.
- Latest lock is the **target** for campaign grammar; legacy Area-1 3-station catalog and compiled 334-station graph stay as measured. Grammar does not change battle invariants, portrait/mesh split, or chronology.

## Six components (schema/service/migration input)

Bound 1–6. Not implemented.

1. **Document envelope** — plans/lore/rules Markdown (`Concept.md`, `Intent.md`, dirty `Design.md`, `ToDo.md`, 202 game-logic pages, 7 site-only `Rules-*`). Persist path, git tree SHA, content SHA-256, branch/PR membership, `schema`, `revision`, `document_status`, `owner`, `source_kind`, `source_anchors`, `last_verified_commit`, `as_of`.
2. **Atlas machine registry (`WNA-001`)** — the JSON fence is the structured SoT for houses/theaters/synthetics/batches/arcs/relations/ledger/diagrams. Import every field including charter/membership/succession even when renderers omit them. Record r11-vs-r14; do not merge.
3. **Identity + links** — namespaces `K###`, `roll-*`, `HC/HP/XT/H/F/V/G/M/B/ARC/CL/WNA/DIAG`, `gu:#####`, `region:##########`, `osm:node|way|relation:…`, `SRC-*`. Freeze 422 K-id/name/order. Keep name-keyed Cast-Relations until callers change. Do not join the three person stores by display name.
4. **Review / publication / promotion** — Cast-Index hub status, `confirmed-integration-manifest.json` incomplete flag, Wiki fragment allowlist (25), art `look.owner_verdict` + content hashes. File existence, `document_status=active`, and integration SHA are three different states.
5. **Export surfaces** — Wiki generator, docs-site mount copies, VitePress HTML, `system-design/regions` viewer. Mirrors are not write authorities. Preserve slugs, public-text policy (Wiki ≠ site gate), LFS bytes, SVG labels, and the grammar IP ban (no source-mod names in public bodies). Root `/` is the service hub (`SERVICES.md`), not VitePress home. Plan/world orchestration only; no concurrent issue-body writing in main cwd from this node.
6. **Runtime snapshots (adjacent)** — Area-1 ScriptableObjects, `SeoulWorldGraphCatalog` compiled arrays, `SeoulWorldGraph.json` coordinates. Export only approved static catalogs with fingerprints. Changing design prose or graph JSON does not update `CreateSeoul`. Character-forge and untracked region JSON are not implicit migrate-in.

## Input map (next schema/service/migration nodes)

| Need | Source of truth now | Do not treat as SoT |
|---|---|---|
| Entity payload | Atlas JSON + owning Markdown | `docs-site/*` mounts, Wiki checkout, `atlas-data.js` |
| Human K map | atlas `humans[]` + Cast-Index row order | backfill draft, roster-100, Home “412” |
| Publication | Cast-Index hub `게시` | fragment file presence, mount output |
| Geo 427 | feat `98cc619` + WT untracked JSON | HEAD tree, Unity Assets, 334 catalog as dong denominator |
| Calendar/gear proposals | UNANSWERED chronology decision; HEAD relative 붕괴 N년; PR #87 six-year dates are still proposals | grammar “centuries after collapse”; PR #87 as if merged |
| Route graph | `SeoulWorldGraphCatalog` 25/334/435 via `CreateSeoul` (`RouteDomain.cs:106–111`) | corpus “runtime only 3 stations”; `Home.md:20` as if it were the full graph |
| Area-1 snapshot | validator 6 cards / 3 roles / 1 formation / **3 stations** (`GameDataCatalogValidator.cs:20`) | collapsing this with `CreateSeoul` |
| House IDs | atlas `houses[]` HC01–HC22 + HP01–HP10 (32; CORPORATION 22) | corpus “HC01–HC14” typo |
| Delivery/authority | ADR-001 **recommended default**; owner API/SQLite question UNANSWERED | treating SQLite HTTP or Git JSON as already chosen |
| Site URLs | `/design/` `/world/` `/rules/` (`config.mts:55–75`); proposed domain names `planning,world,rules` with `planning -> /design/` | capturing `/api/*` (dirty rewrite) |

**Selection stance to carry (not an implementation plan; not owner-approved):** recommend Git JSON/Markdown as the default canonical store; SQLite HTTP authoring is still only a proposed later target; MongoDB is not selected. JSON remains interchange/export. Grammar lock does not pick the store and does not pick a calendar.

## Report verdict

Three input reports **exist**. Authority split, PR #87 / region-branch exclusion, and “future tables are not implemented” **agree**. Digest **resolves** corpus errors without editing siblings: route runtime is `CreateSeoul` 334 stations; Area-1 catalog is 3 stations; house data is HC01–HC22 (22 CORPORATION). Campaign grammar is lock-target and separate from battle invariants. Authoring-store and chronology remain **UNANSWERED**. Do not merge PR #87, do not retarget gameplay from this node, do not treat SQLite API as approved.
