# Structured design store — content source inventory

Measurement: WT `/Users/ilseoblee/workspace/seoul-kenshi`, 2026-09-13. HEAD `09863cf39209467c56c5459e8b4a552e58db2b3e`. `origin/main` `93bc6ce6b89d89cc05e6126020fb0d1534439211`. `HEAD^{tree}` = `origin/main^{tree}` = `60e5df561d74afeaff4dce32f7da8ad31012420d` (commit SHAs differ; trees do not). Dirty paths including `Design.md` left as-is. No product/JSON edits, no PR #87 merge, no deploy.

Presence ≠ approval. `Cast-Index.md:9,:17`: fragment completion is not wiki publication. `docs/game-logic/regions/README.md:29,:70`: evidence folders / JSON existence are not Unity or content completion.

## Trees (HEAD vs WT vs PR #87 vs region branch)

| Tree | Ref | In HEAD? | Role |
|---|---|---|---|
| Tracked HEAD/origin tree | `60e5df56…` | yes | Canonical tracked corpus |
| WT extra | untracked | no | `docs/game-logic/regions/`, `name-pools/cast-backfill-draft.{json,md}`, `tools/cast/generate_backfill_draft.py`, `tools/regions/`, `system-design/regions/` |
| PR #87 | `docs/lore-audit-corrections` `5230e02a940474e7077470a19bff84102bd5fb63` | no (`merge-base --is-ancestor` exit 1) | OPEN; 16 md; +640/−364 |
| Region atlas | `feat/seoul-region-atlas-20260913` `98cc619979eca466732050920e6d5e6158c6b8c0` | no (exit 1 vs HEAD and origin/main) | 25 district JSON + tools + viewer |

https://github.com/islee23520/seoul-kenshi/pull/87 — OPEN, MERGEABLE, base `main`, author `islee23520`. Body: docs only; generators/JSON/cast prose/runtime unchanged; calendar and gear are review proposals. The eight `docs/game-logic/*` files in that PR match HEAD in WT (`git diff --quiet HEAD -- file` exit 0) and differ from the PR tip (exit 1).

`feat/seoul-region-atlas-20260913` merge-base with HEAD is HEAD (branch sits on current main) but is not merged. WT `docs/game-logic/regions/content/*.json` (25) are byte-identical to feat; sampled SHA-256 prefixes match for `README.md`, `11110.json`, `selection.json`, `boundary-comparison.json`. `regions/sources/admdongkor-20260701.geojson` is gitignored (`regions/sources/.gitignore:1`).

## Duplicate / projection boundaries

- Atlas (`World-Narrative-Atlas.md:3`): hand-edit this page only; split docs and figures are read-only projections.
- JSON fence `:74`–`:57612`, `document` at `:80`. `projection_targets`: `Operating-Houses.md`, `External-Theaters.md`, `Synthetic-Actors.md`, `Story-Batch-Manifest.md`, `Hostile-Ecology-Index.md`, `Monster-Batch-Manifest.md`, `Regional-Physical-AI-Arcs.md`, `World-Relation-Ledger.md`, `World-Expansion-Index.md`, `Story-Batch-B001.md`.
- Those files declare “읽기 전용 투영물” and pin `원본 해시: 61650e2e4605df4e147030b08457d51d0a9366362fe6599d89ff6505683708e1` (`Operating-Houses.md:3–6` and the same header on the other projection pages listed above). WT SHA-256 of `World-Narrative-Atlas.md` equals that hash. HEAD git blob id for the path is `a4a7d55fa58071b19502f9bebb8c5554349bd447` (object id ≠ content hash).
- Identity table `World-Narrative-Atlas.md:14` = revision `r11` / 검증 “가문 등록”; JSON `:86` `revision=r14`, `verification_state=story-B001-authored`. Machine record is the fence.
- `docs-site/world/` 165 md, 164 names overlap `docs/game-logic/*.md`. Mount root `docs-site/scripts/mount.mjs:8`. Mounts are copies. PR #87 edits both trees together.
- `docs/game-logic/reference/` 18 files vs `Ref-*.md` 17: parallel research, not declared projections.

Do not collapse these person corpora (WT parse this session):

| Set | Path | HEAD-tracked? | Count | Kind |
|---|---|---|---:|---|
| Cast index | atlas `humans` + `Cast-Index.md` | yes | 422 ids `K001`–`K422`; table rows from `:79` = 422; footer `:572` “총 412명” | authored 16-state roster |
| Sampled candidates | `name-pools/roster-100.json` | yes | `n=100`, seed `90421`, ids `roll-*` | Nemotron sample + name pools; not Cast-Index |
| Local backfill | `name-pools/cast-backfill-draft.json` | no | `count=422`, `generated=2026-09-12T00:00:00Z` | draft fields on the same 422 names; `cast-backfill-draft.md:3–8` forbids promote without review |

Name overlap: humans ∩ backfill = 422; humans ∩ roster = 0; roster ∩ backfill = 0. `existing-names.json` = 430 strings = 422 humans + corridor aliases (`Cast-Corridors-Index.md:7–12`). `Home.md:33` and HEAD `Random-Cast-Roster.md:3` still say 412; `Cast-Index.md:3` and `Cast-Profile-Contract.md:5` say 422.

## Class inventory

Shared metadata to persist: `id`, `schema`, `owner`, `revision`, `document_status`, `source_kind` (`verified` \| `inference` \| `original-fiction`, `Research-Sources.md:5`), `source_anchors`, `projection_targets`, `as_of`.

### plans

| Source | Authority | Format | IDs / status |
|---|---|---|---|
| `Concept.md:1–7` | owner; Unity versions in-file | md | module `Unity POC 통합 코어 루프`; combat lock 2026-09-07 |
| `Intent.md:3` | decisions 1–4 (2026-09-06/07) | md | stage said “구현 금지”; treat as decision log, not live module status |
| `Design.md:3` | UI contract; **WT dirty vs HEAD** (9-line diff) | md | uGUI; 1280×720 / 1920×1080 |
| `ToDo.md:1–6` | module status | md | art integration / acceptance incomplete |
| `docs/game-logic/Development-Roadmap.md:1–7` | depends on Concept/ToDo | md | not a schedule (`:7`) |
| `Unity-Architecture-Implementation-Plan.md` | architecture | md | RED→GREEN |

### lore

| Source | Authority | Format | IDs / counts (WT) |
|---|---|---|---|
| `World-Narrative-Atlas.md` fence `:74`–`:57612` | `owner=wiki-world`, `source_kind=original-fiction`, `revision=r14`, `last_verified_commit=c485bc84629c39e978889f1585ade92bef4ceda4` (`c485bc8`, **not HEAD**), `document.id=WNA-001`, `document_status=active`, `support_reviewers=[]` | `world-narrative-atlas.v1` | 5 072 804 bytes, 57 612 lines |
| `Sixteen-States.md:3,:13` | original fiction; opening-day control | md | S01–S16 |
| `Scenario-Timeline.md:1–7` | relative chronicle; no absolute calendar on HEAD | md | 붕괴 N년 |
| `Core-Characters.md`, `Cast-State-01.md`–`16` | person prose SoT (`Cast-Index.md:15`) | md | 16 files |
| `Story-Batch-B*.md` | Cast-Index publication table is approval | md | 45 files; atlas `story_batches` 47; `story_contents` 45 (no B017, B020) |
| `Hostile-Group-G01.md`–`G27.md` | G01–G24 “게시” `Cast-Index.md:47–70`; G25–G27 files only | md | 27 files = atlas `hostile_groups` |
| `Monster-Batch-M*.md` | atlas has M007 batch; **no** `Monster-Batch-M007.md` | md | 42 files; `monster_contents` 41; 422 entries |
| `World-and-Subway-Layers.md:11–19` | design lore | md | 5 vertical layers |
| `Unofficial-Fan-AU-Notice.md:1–5` | scope notice, not a license | md | 1 |

Same JSON parse: `humans` 422; `houses` 32 all `ACTIVE` / `original-fiction` (HC01–HC14, HP01–HP10); `theaters` 5 XT01–XT05; `synthetics` 48 (H/F/V = 16); `arcs` 67; `relations` 43; `change_ledger` 14 (CL-0004–CL-0017); `diagrams` 3; `story_contents` actor slots 450. Cast-Index `:39+`: B001 게시, B002–B012 폐기/미게시, G01–G24 게시, three ISO SVGs 게시.

### rules

| Source | Authority | Format | IDs |
|---|---|---|---|
| `Realtime-Formation-Card-Battle.md` (101 lines) | owner combat; `Home.md:45` `rtfc-owner-cards-v2` | md | core ticks/cards |
| `Campaign-Loop.md`, `Travel-and-Encounters.md`, `Warfare-and-Sieges.md`, `Economy-and-Production.md`, `Logistics-and-Infrastructure.md`, `Strongholds-and-Territory.md`, `Save-and-Determinism.md`, `Factions-and-Diplomacy.md`, `Ambitions-and-Relations.md` | design rules; not runtime unless code says so | md | among 202 top-level `docs/game-logic/*.md` |
| `docs-site/rules/Rules-Battle.md:1–3` | “계약 수치는 구현 상수를 우선한다” | md | `RBATTLE-*`; seven `Rules-*.md` on HEAD (Battle, CampaignLoop, EconomyLogistics, FactionsWarfare, SaveDeterminism, Strongholds, TravelEncounters) |

### entities

| Class | IDs | Authority | Format | Representative fields |
|---|---|---|---|---|
| Humans | `K001`–`K422` | atlas `humans[]` + Cast-State/Core/Cast-Index | JSON stub + md | `id,name,role,stage,state_id,state_name,source_anchor`; stages 주요 17 / S1 95 / S2 200 / S3 110 |
| Contract overlay | same 422 names | untracked backfill | JSON | `성명,소속,직위,출신 공동체,언어,생업,징집 이력,무장 접근,source_file,fields`; `source_file` Cast-State-01–16, Core-Characters.md (17), Cast-Index.md (10) |
| Nemotron candidates | `roll-*` | `roster-100.json`; HEAD `Random-Cast-Roster.md:3` | JSON | `id,source_uuid,성명,성,이름,본관,항렬자,sex,age,출신 공동체,언어,생업,소속,직위,징집 이력,무장 접근,culture_key,회랑`; `회랑` all null |
| Corridor seeds | 6 rows | `Cast-Corridors-Index.md:5–12` | md table | 이름,회랑,직위,징집 이력,무장 접근 |
| Houses | HC/HP | atlas → Operating-Houses | JSON + projection | `id,display_name,house_class,status,owner,source_kind,revision,projection_targets,states`; CORPORATION 22 / PROFESSIONAL_GUILD 4 / INFRA_OPERATOR 3 / CIVIC_COMPACT 2 / DATA_TRUST 1 |
| Synthetics | H/F/V 01–16 | atlas | JSON | `id,display_name,callsign,cls,owner,source_kind,state_id,house_id` |
| Hostiles | G01–G27 | atlas + Hostile-Group md | JSON + md | `id,display_name,category,owner,source_kind,revision` |
| Monster entries | GxxEyy | atlas `monster_contents` | JSON | 422 entries / 41 batches; M007 id without contents |
| Name pools | surnames 40, given-male 40, given-female 40, clans 10 | tracked JSON | JSON | `id,note,names\|surnames\|clans` |

### relations

| Source | Count | Fields | Boundary |
|---|---:|---|---|
| `Cast-Relations.md:7–8` | 780 data rows | 인물, 유형, 대상, 근거 | display names, not K-ids |
| atlas `relations` | 43 | `from,kind,to,reason` (operates_in 16, custodied_by 16, pressures 5, +6 firm edges) | `World-Relation-Ledger.md:9–` |
| region `connections` / `action` | 427 | `action.id,label,target_ref,costs,outcomes,tradeoff` | geo, not Cast-Relations |

### events

| Source | IDs | Notes |
|---|---|---|
| `Scenario-Timeline.md` | 붕괴 N년 | HEAD has no 2026/2036/2042 lock; that calendar is PR #87 only |
| atlas `story_batches` / `story_contents` / `arcs` | B001–B047, ARC-* | B017, B020: batch stubs, no contents, no Story-Batch files |
| region `opening_state` | `region:*` | epoch `opening-day`; `selection.json` `fictional_epoch.absolute_date` is `null` (`:47–52`) |

### gear

| Source | HEAD status | Fields |
|---|---|---|
| `Era-Arms-and-Tech-Level.md:3,:40–48` | “설계 제안”; four layers 생업 공구 / 치안 제식 / 군용 잔존 / 로스트 | no item SKUs; model names discouraged (`:107`) |
| `Lost-Technology-Lineage.md`, `Conscription-Remnants.md` | lore | PR #87 rewrites not in HEAD |
| `Starting-Presets.md` | target numbers | not shipped loadouts (`Era-Arms-and-Tech-Level.md:3`) |

PR #87 body: 15 gear candidate rows and 2026→2036→2042 calendar as proposals. Those sentences are not in HEAD.

### geo

| Source | Authority | Format | IDs / counts |
|---|---|---|---|
| `docs/game-logic/regions/content/<구>.json` | **not on HEAD**; feat `98cc619` + WT untracked; `schema=seoul-region-content.v1`, `as_of=2026-09-12` | JSON | `district_id=gu:<code>`, `region_id=region:<adm_cd2>`; 25 files, 427 unique regions = `selection.json:18–19` |
| `regions/sources/selection.json` | `authority` “not official-current certification” (`:13`); `decision_kind` not legal certification (`:54`) | JSON | `source_id=admdongkor-20260701-7360288` |
| `regions/sources/boundary-comparison.json` | `seoul_features=427`, `invalid_ids=[]` | JSON | sha256 `c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f` |
| GeoJSON original | https://raw.githubusercontent.com/vuski/admdongkor/7360288277dfd12d74e54b959c59bdd66f852e3a/ver20260701/HangJeongDong_ver20260701.geojson (`README.md:13`) | gitignored locally | not a git object |
| OSM PBF | `selection.json:33–42`; `complete_official_roster: false`; snapshot `2026-09-04T23:00:00Z`; sibling `seoul-kenshi-data/seoul-geography-20260830` (`README.md:19`) | outside this repo | `osm:node\|way\|relation` in `anchor_refs` |
| `Seoul-Station-Catalog.md:9–14` | OSM BBBike + KOSTAT 2013; design data; not in Unity Assets | md table | **334** unique names; 25 구 |
| `World-Map-Construction.md`; runtime 3 stations (`Home.md:21`) | assembly order | md | ≠ 334 catalog, ≠ 427 dongs (`regions/README.md:3`) |
| `system-design/regions/` | viewer; untracked / feat | HTML/JS | `atlas-data.js` generated, not canon |

Region fields (`11110.json:1–80` 청운효자동): `source_kind, fictional_epoch, title, summary, anchor_refs, canon_refs, polity_contexts, inhabitants, livelihood, production.{outputs,requires}, shortages, hazard, opening_state, connections, action, uncertainty`. All 427 regions have that key set.

### assets

| Source | Authority | Format | Fields |
|---|---|---|---|
| `Asset-Pipeline.md:15–21` | BOM fail-closed; `look.owner_verdict: accepted` (`Intent.md` gateway 7) | md | `asset_class, animation_need, dcc, generation_backend, rights_status, source` |
| `docs/assets/bom/` | manifests | JSON BOM | characters, donor, fonts, props, runtime, tiles, title, ui |
| `docs/assets/wiki/` | wiki diagrams; Cast-Index ISO @ `7b4e27b` | SVG/PNG | atlas `diagrams` DIAG-WORLD-ATLAS, DIAG-HOUSE-INFLUENCE, DIAG-HOSTILE-ECOLOGY |

BOM/PNG presence is not `owner_verdict: accepted`. Game/Assets not inventoried.

### sources

| Source | source_kind / license | Locator | Notes |
|---|---|---|---|
| `Research-Sources.md:9–31` | three records | SRC-SHOGUKAN-PICTURE https://www.shogakukan.co.jp/picture ; SRC-BUNKA-COPYRIGHT https://www.bunka.go.jp/seisaku/chosakuken/taisetsu/ ; SRC-SEOUL-FICTION-BOUNDARY `url=""` | only registered facts |
| Nemotron-Personas-Korea | parquet not in repo | `Random-Cast-Roster.md:5`; generator `tools/cast/generate_nemotron_roster.py` (tracked) | HEAD `:7` “Nemotron 행에는 이름이 없다”; PR #87 contradicts. Unresolved. |
| `existing-names.json` | occupancy list | 430 strings | collision guard |
| admdongkor | CC BY 4.0 / 공공누리 제1유형 (`README.md:17`) | commit `7360288277dfd12d74e54b959c59bdd66f852e3a` | not official legal boundary |
| OSM | ODbL 1.0 (`Seoul-Station-Catalog.md:11`) | BBBike Seoul.osm.pbf | snapshot ≠ complete roster |
| `.omo/research/reference-source-index.json` | local index | `schema_version, source_sha256, status, sources` | not game-logic canon |
| `Game-References.md` + `Ref-*.md` + `reference/` | design research | md | mechanisms, not world facts |

## Source-authority gaps

1. **Three person stores.** 422 K-ids (tracked), 100 `roll-*` (tracked sample), 422-row untracked backfill. Name overlap ≠ merge. Backfill confirmation cells empty (`cast-backfill-draft.md:8`). PR #87 body “확인 0/422” / “미검토 후보 100” is PR-branch audit, not HEAD.
2. **Count drift:** 422 (atlas, `Cast-Index.md:3`, table rows) vs 412 (`Cast-Index.md:572`, `Home.md:33`, HEAD `Random-Cast-Roster.md:3`).
3. **Atlas JSON vs md header:** `r14` / `story-B001-authored` vs `r11` / “가문 등록”; empty reviewers; `last_verified_commit` is `c485bc8` not `09863cf`.
4. **Publication ≠ files.** Story B002+ exist while Cast-Index marks 폐기/미게시. B017, B020, M007 lack contents and Markdown.
5. **PR #87 not main.** Gear 15-pack, 2036/2042 calendar, hangnyeol rewrite, roster caveats live only at the PR URL.
6. **Region atlas not main.** 25 JSON / 427 dongs on `feat/seoul-region-atlas-20260913` and WT; `git ls-tree HEAD -- docs/game-logic/regions` = 0. `absolute_date` unknown. OSM/admdongkor are dated extracts, not 2026 administrative law.
7. **Geo denominators:** 334 stations vs 427 dongs vs 16 fictional states vs runtime 3 stations.
8. **source_kind holes.** Research-Sources allows three kinds (`:5`) but lists 3 URLs. Atlas objects are almost all `original-fiction`. Region `uncertainty` mixes OSM tags with fiction per dong.
9. **Relations split.** 780 name edges vs 43 atlas id edges vs 427 region strings — no join key in this pass.
10. **Rules vs code.** `Rules-Battle.md:3` defers numbers to implementation constants.

**Unknowns:** (a) `atlas-data.js` (34 639 164 bytes) not fully hashed vs feat; (b) Nemotron parquet hash absent; (c) corridor 6 names vs 8 extra `existing-names` strings (alias pairs 린샤오메이/임소매, 팜반득/범반득); (d) G25–G27 publication beyond file presence; (e) docs-site mount freshness vs `docs/game-logic` not hashed except PR #87’s 8-file pair.

## Store ingest distinction

SoT layers must stay split: owner plans (Concept/Intent/Design) ≠ atlas JSON `WNA-001` ≠ 16-state prose ≠ projections ≠ docs-site mounts ≠ feat-only region JSON ≠ untracked backfill ≠ Nemotron sample.

ID namespaces: `K###`, `roll-*`, `HC/HP/XT/H/F/V/G/M/B/ARC/CL/WNA/DIAG`, `gu:#####`, `region:##########`, `osm:node|way|relation:…`, `SRC-*`.

Persist `schema, revision, document_status, owner, source_kind, source_anchors, last_verified_commit, as_of, projection_targets`, git tree SHA, content SHA-256, branch/PR membership, Cast-Index publication status. Copy-if-present is invalid. Approval is not implied by path existence.
