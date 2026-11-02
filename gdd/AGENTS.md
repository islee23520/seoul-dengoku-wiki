# GDD KNOWLEDGE BASE

## OVERVIEW
Single game-design canon: product pages, rules, references, architecture, art direction, ADRs, proposals and system-design. All design and architecture text is normalized JSON under `canon/`; the only Markdown files are ones named `AGENTS.md` or `README.md`; the license is stored in `LICENSE`. GDD owns meaning and its own `/gdd/` viewer (`viewer/`); the wiki (WIKI) publishes only the world.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Product thesis vs binding requirements | `canon/locales/ko-KR/root/game-thesis.json`, `canon/locales/ko-KR/root/design-requirements.json` | Vision doc vs requirement list |
| Product home page | `canon/locales/ko-KR/root/home.json` | 《서울:전국》 overview; doubles as the design-domain landing content |
| Gameplay rules | `canon/locales/ko-KR/rules/` | Campaign, battle, travel, warfare, save/determinism contracts |
| Reference encyclopedias | `canon/locales/ko-KR/references/` | Ref-* investigation derivatives and mechanism index |
| Runtime architecture docs | `canon/locales/ko-KR/architecture/` | Unity architecture, system design, implementation plan |
| Character art direction | `canon/locales/ko-KR/art/character-art-direction.json` | Canonical visual-direction document |
| Asset intake pipeline | `canon/locales/ko-KR/root/asset-pipeline.json` | Asset approval flow from intake to acceptance |
| Roadmap and reference policy | `canon/locales/ko-KR/root/development-roadmap.json`, `canon/locales/ko-KR/root/game-references.json`, `canon/locales/ko-KR/root/research-sources.json` | |
| User-facing flows | `canon/locales/ko-KR/root/online-user-journey.json`, `canon/locales/ko-KR/root/ui-implementation-pipeline.json` | |
| Decision records | `canon/locales/ko-KR/adr-001.json` … `adr-008.json` | One decision each; the status line is authoritative |
| Backend decisions | `canon/locales/ko-KR/adr-005.json`, `canon/locales/ko-KR/adr-006.json` | ADR-006 supersedes ADR-005's transport/identity/storage clauses. Product session lifecycle is ADR-008 |
| Local-first sessions | `canon/locales/ko-KR/adr-008.json` | Headless authority, Steam roles, lineage checkpoints; does not supersede ASP.NET Core |
| Naming policy | `canon/locales/ko-KR/adr-003.json` | Creative names anchor to real district/station names |
| Korean terminology and display names | `canon/locales/ko-KR/root/korean-terminology-and-naming.json` | Native/Sino-Korean/loanword layers, formal martial names, GDD data display rules |
| Root domain structure | `canon/locales/ko-KR/adr-004.json` | Seven top-level domains, owner-locked 2026-09-18 |
| Proposals | `canon/locales/ko-KR/proposals/` | `scenario-hold-the-gate.json`, `narrative-direction.json` |
| Region data and official map | `../LORE/regions/`, `../WIKI/wiki/src/components/OpeningTerritoryMap.tsx` | 427-dong canon stays in LORE; the official wiki owns the public map |
| Generated design-store | `design-store/AGENTS.md` | Never hand-edit; regenerate |
| Canon schema, collections, render lock | `canon/schema/`, `canon/collections/`, `canon/rendered.lock.json` | `gdd-doc.schema.json` for documents, `adr.schema.json` for ADRs; the lock pins each rendered page's SHA-256 |

## CONVENTIONS
- ADR canon files are `canon/locales/ko-KR/adr-00N.json`; their rendered page names stay English kebab-case (`ADR-00N-kebab-title.md`, outside GDD). Bodies mix English and Korean. Every ADR carries a status line (`Status: Accepted` / `상태: 승인` / `수용됨`) — check it and any supersession link before citing.
- Edit design text only in `canon/**` JSON. After an edit, run the TOOL materializer with `--update-lock` and commit the changed `canon/rendered.lock.json` entries together with the JSON; `source.sha256` is frozen migration provenance and is never edited.
- Publication renders Markdown pages OUTSIDE GDD (TOOL `canon/materialize-gdd.mjs`), and `/gdd/` is built from `viewer/` (Vite + React + TS), which reads them through `GDD_PAGES_ROOT`. `viewer/scripts/generate-catalog.mjs` writes `viewer/src/content/**` and `viewer/src/generated/**` at build time; both are gitignored build outputs, so the committed-Markdown rule above still holds. Viewer routes: top-level pages `/gdd/design/`, `rules/` `/gdd/rules/`, `architecture/` `/gdd/architecture/`, `references/` `/gdd/references/`, ADRs `/gdd/decisions/`, `art/` `/gdd/art/`. Dataset summaries read the hosting parent repo (`WIKI/lore` or sibling `LORE/`, plus `GAME/`; override with `SEOUL_KENSHI_ROOT` / `LORE_ROOT`). `system-design/` and `proposals/` are published under their matching `/gdd/` categories. Publication preserves collection and document statuses; proposals remain exploratory, not accepted design.
- 게임 UI 레퍼런스 조사는 `https://interfaceingame.com/`을 항상 1차 기준으로 삼는다. 정확한 작품이 없으면 같은 시리즈의 가장 가까운 항목을 먼저 분석하고, 부족한 화면만 공식 자료와 실제 게임 영상으로 보완한다. 레퍼런스의 아트·문양·아이콘을 복제하지 않고 정보 위계와 레이아웃 구조만 추출한다.
- 한국어 용어는 `canon/locales/ko-KR/root/korean-terminology-and-naming.json`를 따른다. 한자어를 회피하거나 남용하지 않고, 외래어는 한글 표기와 프로젝트 잠금을 지킨다. 내부 영어 ID는 사용자 표면에 표시하지 않는다.
- `korean-terminology-and-naming.json` is project-wide: state/org/house/office/person/martial/technology/equipment/place/event/rule/UI/data-field names all carry an owner and rights status. Absence of a search result is not proof of legal clearance.
- 게임 UI 레이아웃은 웹 브라우저 창 비율이 아니라 Unity Game View 내부의 16:9 렌더 영역을 기준으로 설계한다. 웹 문서는 이 게임 프레임을 바깥 설명·탐색 UI와 분리해 표시하고, HUD 위치·비율·시각 QA는 프레임 내부 좌표만 판정한다.

## ANTI-PATTERNS
- Proposals are exploratory documents — do not cite them as accepted design.
- Do not hand-edit anything under `design-store/`; regeneration commands live in `design-store/AGENTS.md`.
- ADR-001 quarantines the unrelated private shooter repository (no query, inspect, or push) and forbids creating repositories or remotes under the delivery plan.

## COMMANDS
```bash
# from the parent repository root
node TOOL/tools/canon/materialize-gdd.mjs --gdd GDD --out <dir outside GDD>                  # render JSON canon to Markdown pages
node TOOL/tools/canon/materialize-gdd.mjs --gdd GDD --out <dir outside GDD> --update-lock    # after a canon edit
npm ci --prefix GDD/viewer                                                                   # viewer dependencies
GDD_PAGES_ROOT=<dir> npm --prefix GDD/viewer run build                                       # build /gdd/ into GDD/viewer/dist
GDD_PAGES_ROOT=<dir> npm --prefix GDD/viewer test                                            # catalog contract
```
