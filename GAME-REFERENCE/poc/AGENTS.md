# POC ROOT KNOWLEDGE BASE

## OVERVIEW
2026-09-19 owner-authorized revision of this formerly frozen POC/reference tree. Parent freeze text does not block this root contract. The current contract is Total War-style unit command: named heroes are separate command figures, soldier squads are separate battlefield actors, heroes are excluded from soldier count, one squad is at most 20 soldiers, and figures use anime natural proportions. Nested `browser/` demos are historical POC unless a page is explicitly labeled current target. Keep media provenance and nested browser ownership. This file is the local knowledge contract. It does not implement combat, Unity, or Oddland.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Current contract (this file) | `AGENTS.md` | Owner-authorized root contract. Target vs historical split. No current-target HTML at this root on 2026-09-19. |
| Nested browser ownership | `browser/AGENTS.md` | Nested owner of the four 2026-09-07 review surfaces, tests, hashes, and provenance. |
| Nested review index | `browser/README.md`, `browser/index.html` | Nested launcher. Current-target copy points at `GDD/system-design/total-war-ui/`. Nested executables stay historical POC. |
| Nested byte ledger | `browser/SHA256SUMS` | Generated hashes for 26 payload files. Nested ownership; this lane does not refresh it. |
| Nested media provenance | `browser/avatar-preview/SOURCE-PROVENANCE.md` | Pilgrimage atlas URLs. No declared license. Local review only. |
| Nested recovery provenance | `browser/recovered-campaign/SOURCE-COMPARISON.md` | Windows v3 source selection. Historical combat/return choices stay as history. |
| Parent reference router | `../AGENTS.md` | GAME-REFERENCE domain. Nested `poc/browser/` freeze still owns those bytes. |
| Current unit-command UI docs | `../../GDD/system-design/total-war-ui/` | Design template, not this tree and not a runtime claim. |

## CURRENT TARGET
Owner-authorized current contract (Intent decision 11, 2026-09-19). Nested browser demos remain historical POC unless a page is explicitly labeled current target. Not a claim that files here or in Unity already do this.

- Input is unit and formation command. Do not make continuous direct hero move/attack/dodge.
- Select a unit. Preview move, attack, facing/formation, or hold. Confirm replaces that unit's current order. Cancel keeps the old order and writes no history.
- No card, deck, draw, recharge, resource economy, waypoint chain, command queue, or slow/speed control.
- Heroes never count as soldiers. Do not merge hero state into squad headcount. Do not invent a squad minimum, total squad count, hero count, or army cap.
- Closed battle emits one immutable `ResultId`. Campaign settles that id once. Duplicate id returns the old receipt. Conflicting payload for a settled battle rejects and mutates nothing.
- Settlement is not return. After application the expedition may continue, or end as return, settle, conquer, wander, or trade.
- Camera and pause after the unanswered 2026-09-19 question: 3D pan/orbit/zoom, and pause only inside this party's closed battle. Those are adopted design defaults, not owner-explicit picks. Do not lock angle or FOV. Top-down battle drawings are documentation schematics, not game renders.
- Art target is anime natural proportion. SD, chibi, and semi-real portraits are not the target. Nested pixel atlases and low-poly placeholders stay historical; do not restyle them into fake current evidence.

## HISTORICAL NESTED BROWSER
`browser/` keeps its own AGENTS, README, SHA256SUMS, models, tests, and provenance. Nested HTML may label the current target and link the design template. Nested models, tests, Three.js scenes, and remote atlas loads remain 2026-09-07 historical POC unless that page is explicitly labeled current target and its executable rules match. Banners are not implementation.

| Nested surface | Live tell |
|----------------|-----------|
| `browser/index.html` | Title `서울:전국 · 브라우저 레퍼런스 색인`. `h1` `현재 목표와 역사 POC`. `.primary.target h2` `부대 지휘 UI 설계 템플릿`. `.history-heading h2` `2026-09-07 역사 POC`. |
| `browser/avatar-preview/` | Title `서울:전국 · 역사 지휘관 카드·아바타 POC`. `h1` still `지휘관 카드 전투`. `#target-boundary-title` `현재 목표: 카드가 아닌 부대 명령`. `.history-status` `2026-09-07 역사 POC`. |
| `browser/formation-editor/` | Title `서울:전국 · 진형 편집 검토용 POC`. `h1` `출격 진형 편집`. Scene kicker `역사 POC · 고정 직교 아이소메트릭`. Specs `CAM 45° / 35.264°`, `GRID 1.5m`. |
| `browser/battle-preview/` | Title `서울:전국 · 실시간 분대 전투 검토용 POC`. `h1` `실시간 분대 교전`. `.history-status` names 6v6 / 48 figures / cardinal buttons. `#target-boundary-title` `현재 목표: 부대 명령의 미리보기·취소·확인`. |
| `browser/recovered-campaign/` | Title `서울:전국 · 회수 캠페인 통합 POC`. `#target-boundary-title` `현재 목표: 원정을 계속할 수 있는 부대 지휘 흐름`. Stage rail still marks formation/battle/return as `역사`. Model still uses `?result=reviewed` and hub return. |

Reusable nested facts that remain useful as history, not as current UI copy: pure JS models apart from DOM/Three.js, deterministic fingerprints, pause that actually freezes simulation, named roster/route/encounter shell, and fail-closed Pilgrimage rights text.

## CONVENTIONS
- Nested `browser/` is a distinct prototype domain. Keep media provenance and nested ownership. Nested SHA256SUMS, Pilgrimage URLs, and model tests stay nested-owned. Do not promote nested files into `GAME/Assets/` or the public hub from this lane.
- Existing direct assets stay. Direct means files already in this tree or pinned remote review URLs recorded in nested provenance. Do not add new generated art here.
- Desktop review only. Do not implement or test responsive, mobile, or per-platform behavior.
- Korean product copy must say historical POC or current target. Do not call nested card/grid/return pages the current game.
- `codex-ux-refs/` stays unpublished. This tree does not register it.

## COMMANDS
From the repository root. Nested tests lock historical models; they are not current-target acceptance.

```bash
node --test GAME-REFERENCE/poc/browser/*/*.test.js
python3 -m http.server 8000 --directory GAME-REFERENCE/poc/browser
```

Historical review URL: `http://localhost:8000/`. CDN Three.js and pinned remote avatar images need network. The server does not prove Unity parity and does not prove the current target.

Current-target UI docs (separate tree, documentation only):

```bash
python3 -m http.server 8010 --directory GDD/system-design/total-war-ui
```

Docs URL: `http://localhost:8010/`. Title `서울:전국 · 부대 지휘 UI 설계 템플릿`. Eyebrow `INTERACTION BLUEPRINT / TARGET UI`.

## ANTI-PATTERNS
- Do not read nested commander cards, recharge, 3x3 slots, 1.5 m grid, four-direction facing, four-soldier invariants, 48+12 presentation counts, or forced hub return as the current target.
- Do not claim this directory, Unity, Oddland, or `/play/` already ships unit-command combat.
- Do not copy, publish, or restyle Pilgrimage images. Nested authorization is local review.
- Do not invent capture chances, camera numbers, speed controls, queues, or any cap besides 20 soldiers per squad and hero exclusion.
- Do not refresh `browser/SHA256SUMS` unless nested payload bytes actually change in an authorized nested edit.
- Do not deploy, commit, or hand-edit generated `WEB/wiki-source` mirrors from this contract file.
