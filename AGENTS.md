# GDD KNOWLEDGE BASE

## OVERVIEW
Single game-design canon: product pages, rules, references, architecture, art direction, ADRs, proposals and system-design. WEB owns publication; GDD owns meaning.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Product thesis vs binding requirements | `Game-Thesis.md`, `Design-Requirements.md` | Vision doc vs requirement list |
| Product home page | `Home.md` | 《서울:전국》 overview; doubles as the design-domain landing content |
| Gameplay rules | `rules/` | Campaign, battle, travel, warfare, save/determinism contracts |
| Reference encyclopedias | `references/` | Ref-* investigation derivatives and mechanism index |
| Runtime architecture docs | `architecture/` | Unity architecture, system design, implementation plan |
| Character art direction | `art/Character-Art-Direction.md` | Canonical visual-direction document |
| Asset intake pipeline | `Asset-Pipeline.md` | Asset approval flow from intake to acceptance |
| Roadmap and reference policy | `Development-Roadmap.md`, `Game-References.md`, `Research-Sources.md` | |
| User-facing flows | `Online-User-Journey.md`, `Ui-Implementation-Pipeline.md` | |
| Decision records | `adr/ADR-001` … `ADR-006` | One decision each; the status line is authoritative |
| Backend decisions | `adr/ADR-005`, `adr/ADR-006` | ADR-006 supersedes ADR-005's transport/identity/storage clauses |
| Naming policy | `adr/ADR-003` | Creative names anchor to real district/station names |
| Root domain structure | `adr/ADR-004` | Seven top-level domains, owner-locked 2026-09-18 |
| Proposals | `proposals/` | `metaverse-hub-2026-2/` business plan (+assets), `Scenario-Hold-the-Gate.md`, `Narrative-Direction.md` |
| Regions visualization | `system-design/regions/` | Standalone static web app (`atlas-data.js`, `app.js`); browser artifact, not Unity |
| Generated design-store | `design-store/AGENTS.md` | Never hand-edit; regenerate |

## CONVENTIONS
- ADR filenames are English kebab-case (`ADR-00N-kebab-title.md`); bodies mix English and Korean. Every ADR carries a status line (`Status: Accepted` / `상태: 승인` / `수용됨`) — check it and any supersession link before citing.
- Top-level `*.md` and `art/*.md` stage to `/design/`. `rules/`, `references/`, and `architecture/` stage to `/rules/`. `proposals/` and `system-design/` remain studio artifacts unless separately published.
- 게임 UI 레퍼런스 조사는 `https://interfaceingame.com/`을 항상 1차 기준으로 삼는다. 정확한 작품이 없으면 같은 시리즈의 가장 가까운 항목을 먼저 분석하고, 부족한 화면만 공식 자료와 실제 게임 영상으로 보완한다. 레퍼런스의 아트·문양·아이콘을 복제하지 않고 정보 위계와 레이아웃 구조만 추출한다.
- 게임 UI 레이아웃은 웹 브라우저 창 비율이 아니라 Unity Game View 내부의 16:9 렌더 영역을 기준으로 설계한다. 웹 문서는 이 게임 프레임을 바깥 설명·탐색 UI와 분리해 표시하고, HUD 위치·비율·시각 QA는 프레임 내부 좌표만 판정한다.

## ANTI-PATTERNS
- Proposals are exploratory documents — do not cite them as accepted design.
- Do not hand-edit anything under `design-store/`; regeneration commands live in `design-store/AGENTS.md`.
- ADR-001 quarantines the unrelated private shooter repository (no query, inspect, or push) and forbids creating repositories or remotes under the delivery plan.

## COMMANDS
```bash
node WEB/wiki-source/scripts/mount.mjs   # restage GDD/*.md -> WEB/wiki-source/design/
```
