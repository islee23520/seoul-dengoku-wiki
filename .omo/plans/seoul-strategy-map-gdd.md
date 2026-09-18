# seoul-strategy-map-gdd - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** 기획과 규칙 문서에서 동서남북·아이소·타일맵이 사라지고, 공개 화면은 게임설계와 세계관 두 칸이 됩니다. 유니티 첫 화면은 서울 전역을 높낮이 있는 전략 지도로 띄웁니다. 전투 규칙은 진형·카드 그대로이고, 보이는 방향만 왼쪽·오른쪽입니다.

**Why this approach:** 같은 날 잠근 폴더 규칙(기획·규칙·세계관을 한 데 몰지 않음)을 지키고, 지도부터 만들라는 지시를 문서와 유니티에 같이 반영합니다.

**What it will NOT do:** 세계관 소설을 다시 쓰지 않습니다. 이미 들어간 카드 전투 규칙을 지우지 않습니다. 기증 캐릭터 그림을 다시 그리지 않습니다.

**Effort:** XL
**Risk:** High - 장르 카메라 계약과 이미 잠긴 전투 규칙이 겹치고, 지도 베이크가 새 유니티 화면입니다.
**Decisions to sanity-check:** 카드 전투는 남기고 화면만 좌우. 아이소 도표 그림 13장은 이번엔 그대로 두고 글만 고칩니다.

Your next move: 고정밀 검토가 끝난 뒤 `/ulw-execute seoul-strategy-map-gdd`로 실행합니다. Full execution detail follows below.

---

> TL;DR (machine): XL/High; ADR-004 folders kept; tabs 게임설계+세계관; docs drop NESW/iso/tile; RTFC kept L/R presentation; Unity Seoul heightmap chunks first.

## Scope
### Must have
- ADR-004 유지: 기획=`GDD/`, 규칙=`GAME-LOGIC/`, 세계관=`LORE/`. 공개 탭만 기획서+게임로직을 **게임설계**로 합친다. 세계관 탭은 남긴다.
- 정본 문서에서 NESW·아이소(45/35.264)·타일맵·2.5등신 문장을 삭제한다. 유효 계약만 남긴다. `Intent.md`는 결정 로그를 지우지 않고 대체 주석을 단다.
- 결정 3 실시간 진형·카드 메커니즘은 유지한다. 전투 표현만 좌우 사이드스크롤이다.
- `ToDo.md` 현재 모듈을 서울 전역 전략맵으로 바꾼다. 항목 13–17은 그 모듈 백로그로 주차한다. #58은 취소한다.
- `GenreContract.json` + C# 미러 + 테스트 + 소비자 9파일 + `check-unity-architecture.mjs` 기대값을 같은 Unity 파도에서 맞춘다. `combatResolution: realtime-formation-card`는 유지한다. `allowedDirections`/`headsTall`/`yawDegrees`/`pitchDegrees` 타일 공유 격자는 삭제 또는 전략맵·사이드스크롤 키로 교체한다.
- `GAME-REFERENCE/data/seoul-geography-20260830/` GeoTIFF z11 9장+OSM PBF+KOSTAT 2013을 오프라인 베이크해 Unity 청크 메시로 올린다. 첫 화면은 서울 전역 3D 하이트맵 전략맵이다.
- 오드랜드 원본 바이트 as-is. 이 맵 위에서 개발한다. 변환하지 않는다.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- `Wikis/` 또는 루트 `data/` 재생성. `GDD/game-logic`로 규칙 정본 병합. ADR-004 규칙 2–3 위반.
- 오드랜드 리타깃·리메쉬·2.5등신 변환.
- 전투 `HeightmapApi` 20×20 fbm과 서울 GeoTIFF를 한 타입으로 합치기.
- 결정 3 RTFC 코어 삭제. 16국 캠페인·저장·외교·공성 신규 모듈.
- 334역 그래프를 전략맵 비주얼로 위장(그래프는 이동 규칙으로 남을 수 있으나 첫 화면은 지형 메시).
- raw PBF/TIFF를 `GAME/Assets`에 넣기.
- `Intent.md`를 “현재 유효 결정만”으로 스냅샷 재작성.
- 세계관 산문 전면 재작성. 캐스트·십육국 본문 손대기.
- GitHub Wiki, 새 Vercel 프로젝트, uLoop, GUI Editor, unicli.
- 순수 산문 문구를 테스트로 고정. 기계 소비 값만 테스트.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for GenreContract and bake output (hash, chunk count=9, Seoul bbox). tests-after for Unity presenter PlayMode capture. none for pure prose (QA-by-read + patina `--score --offline`). Agent-executed QA always included.
- Evidence: `.omo/evidence/seoul-strategy-map-gdd/task-<N>.*` (outside ulw-loop). Inside ulw-loop use `<attemptDir>/task-<N>-seoul-strategy-map-gdd.<ext>`.
- Gates: `node TOOL/tools/architecture/check-unity-architecture.mjs` exit 0; `node TOOL/tools/policy/check-repo-delivery-policy.mjs` exit 0; wiki/public-term `rg` for Kenshi/Underrail/Gunner/clone/복제 empty on changed pages; VitePress `npm --prefix GAME-LOGIC/site run docs:build` exit 0 after mount.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: 정본 잠금 문서 4건 병렬 (Intent/Concept·Thesis/ToDo/Roadmap).
- Wave 2: GAME-LOGIC 규칙 페이지 NESW·아이소 삭제 (Travel + RTFC + 나머지 묶음). Wave 1 후.
- Wave 3: LORE 모순 문장만 + 공개 탭 크롬. Wave 2와 폴더 겹침 없음 → Wave 2와 병렬 가능.
- Wave 4: GenreContract TDD+소비자+architecture gate. Wave 1의 계약 문장에 의존.
- Wave 5: 지리 베이크 + Unity 전략맵 화면. Wave 4 카메라 키 확정 후.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | — | 2,3,4,5,6 | 2,3,4 |
| 2 | — | 5,6 | 1,3,4 |
| 3 | — | 12 | 1,2,4 |
| 4 | — | 12 | 1,2,3 |
| 5 | 1,2 | 12 | 6,7 |
| 6 | 1,2 | 9 | 5,7 |
| 7 | 1 | 12 | 5,6 |
| 8 | 1 | 12 | 7,9 |
| 9 | 6 | 12 | 8 |
| 10 | 1,4 | 11 | — |
| 11 | 10 | 12 | — |
| 12 | 3,5,7,8,9,11 | F* | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Intent.md에 결정 10을 달고 1·3·5·7·8은 대체 주석만 한다
  What to do / Must NOT do: 결정 로그 문장을 삭제하지 않는다. 새 **결정 10** (2026-09-18): 첫 Unity=서울 하이트맵 전략맵, 공개 탭=게임설계+세계관, SD/NESW/아이소/타일맵은 정본 계약에서 폐기, 전투 메커니즘=RTFC 유지·표현=좌우 사이드스크롤. 기존 결정 1(`:34`)·3 격자 절(`:18`)·5 시야·7(`:90`)·8(`:97`)에 “결정 10으로 대체” 주석만 단다. `GDD/adr/ADR-002-character-candidate-retrospective.md`도 회고 본문은 남기고 각주. Must NOT: 결정 번호 본문 삭제. 결정 3 코어 폐기 문구.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5,6
  References (executor has NO interview context - be exhaustive): `Intent.md:1-5,17-24,43-60`; `.omo/drafts/seoul-strategy-map-gdd.md` Decisions; glm B3/B5 `.omo/evidence/st_01a0b2f1-gate-review.md`
  Acceptance criteria (agent-executable): `rg -n '^## 결정 10' Intent.md` ≥1. `rg -n '1.5m 4방향' Intent.md` 가 대체 주석 줄에만 있고 유효 계약 단정이 아니다. `rg '^# 방향 결정 기록' Intent.md` 헤더 유지. `rg -n '진형·카드|Songs of Silence' Intent.md` ≥1.
  QA scenarios: happy — `rg` 위 세 명령. failure — 헤더/결정 3이 사라지면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-1-intent-rg.txt`
  Commit: Y | docs(intent): 카메라·격자 결정을 사이드스크롤·전략맵으로 대체 주석한다
  Recommended task executor category: writing — 한국어 결정 로그 개정, 코드 없음.

- [ ] 2. Concept.md·Game-Thesis·에이전트 가이드에서 아이소·NESW·SD를 뺀다
  What to do / Must NOT do: `Concept.md:5`, `GDD/Game-Thesis.md:3,17`, `Design.md:88`, `AGENTS.md:102-103`, `CLAUDE.md:11`, `GAME/AGENTS.md:26,65`의 아이소/4방향/2.5등신 유효 계약을 전략맵 3D + 전투 좌우로 교체한다. 4X+RPG 장르 문장은 남긴다. Must NOT: `GAME/play/Design.md`(현 POC 화면 서술) 손대기. `GAME-LOGIC/site/**` 스테이징 손편집.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 5,6
  References: `Concept.md:5`; `GDD/Game-Thesis.md:3,17`; `Design.md:88`; `AGENTS.md:102-103`; `CLAUDE.md:11`; `GAME/AGENTS.md:26,65`
  Acceptance criteria: `rg -n '35\.264|2\.5등신|4방향 타일' Concept.md GDD/Game-Thesis.md Design.md AGENTS.md CLAUDE.md GAME/AGENTS.md` 매칭 0 (폐기 주석 제외). `rg -n '4X|사이드스크롤|전략맵' Concept.md GDD/Game-Thesis.md` 각 ≥1.
  QA scenarios: happy — rg 0 히트. failure — 아이소 각도 잔존 시 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-2-thesis-rg.txt`
  Commit: Y | docs(concept): 개요에서 아이소 격자를 빼고 전략맵·사이드스크롤을 적는다
  Recommended task executor category: writing — 두 개요 산문.

- [ ] 3. ToDo.md 현재 모듈을 서울 전역 전략맵으로 바꾸고 13–17을 주차한다
  What to do / Must NOT do: 현재 모듈 제목을 서울 전역 하이트맵 전략맵으로 바꾼다. 완료된 POC 코어 루프(5–12, 18) 주장은 유지한다. 미체크 13–17을 “전략맵 모듈 백로그(주차)”로 옮긴다. #58(TOS식 SD)은 취소 한 줄을 적는다. 비목표에서 “카메라 회전·원근·대각 이동”을 전략맵 팬·줌 허용과 모순되지 않게 고친다. Must NOT: 13–17을 완료로 표시. 두 번째 제품 모듈을 동시에 현재로 두지 않기.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 12
  References: `ToDo.md` 전체; glm B6; 이슈 #8·#23·#58·#26·#27·#78
  Acceptance criteria: `rg -n '서울 전역|전략맵' ToDo.md` ≥1. `rg -n '\[ \] 13\.|\[ \] 58|취소' ToDo.md` 로 13이 백로그/주차이고 #58 취소가 보인다. `rg -n 'Unity POC 통합 코어 루프' ToDo.md` 가 “현재 모듈” 제목이 아니다.
  QA scenarios: happy — 위 rg. failure — 현재 모듈이 여전히 POC 코어 루프면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-3-todo.txt`
  Commit: Y | docs(todo): 현재 모듈을 서울 전략맵으로 바꾸고 시각 수용을 주차한다
  Recommended task executor category: writing — ToDo 모듈 선언.

- [ ] 4. GDD/Development-Roadmap.md 다음 단계를 맵 베이크로 교체한다
  What to do / Must NOT do: “다음 검증 단계 1 = 시각 수용·TOS식 SD 재작업(#58)”을 삭제하고 첫 단계를 OSM+GeoTIFF 전략맵 베이크·Unity 화면으로 쓴다. `docs/game-logic` 폐기 경로를 `GAME-LOGIC/`·`LORE/`·`GDD/`로 고친다. 목표 형태 표의 카메라(45/35.264)·4방향 격자 문장을 뺀다. RTFC 전투 Core 완료 주장은 유지한다. Must NOT: 로드맵에 아이소 각도를 새 계약으로 남기기.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 12
  References: `GDD/Development-Roadmap.md:9-13,27,37`; glm findings
  Acceptance criteria: `rg -n '35\.264|TOS식 SD|#58' GDD/Development-Roadmap.md` 가 취소/폐기 맥락이 아니면 0. `rg -n 'GeoTIFF|전략맵' GDD/Development-Roadmap.md` ≥1. `rg -n 'docs/game-logic' GDD/Development-Roadmap.md` 0.
  QA scenarios: happy — rg. failure — #58이 다음 단계 1로 남아 있으면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-4-roadmap.txt`
  Commit: Y | docs(roadmap): 다음 단계를 서울 전략맵 베이크로 바꾼다
  Recommended task executor category: writing — 로드맵 한 파일.

- [ ] 5. Travel-and-Encounters와 RTFC 규칙에서 NESW·공유 격자를 뺀다
  What to do / Must NOT do: `GAME-LOGIC/Travel-and-Encounters.md` 동서남북 네 행동·대각 거절을 삭제한다. 전략 이동은 역 그래프(`RouteGraph.CreateSeoul`)와 전역맵 선택으로 적는다. `GAME-LOGIC/Realtime-Formation-Card-Battle.md`는 진형·카드·30Hz·일시정지를 유지하고, 공유 아이소 격자·4방향 페이싱을 좌우 사이드스크롤로 교체한다. Must NOT: RTFC 규칙 본문을 삭제. 새 전투 수치를 발명하지 않기.
  Parallelization: Wave 2 | Blocked by: 1,2 | Blocks: 9,12
  References: `GAME-LOGIC/Travel-and-Encounters.md`; `GAME-LOGIC/Realtime-Formation-Card-Battle.md`; `Intent.md` 결정 3; `GAME/Assets/Janseon/Core/Grid.cs:24-29` (코드 삭제는 파도 4)
  Acceptance criteria: `rg -n '동서남북|동, 서, 남, 북|4방향' GAME-LOGIC/Travel-and-Encounters.md GAME-LOGIC/Realtime-Formation-Card-Battle.md` 0 (또는 폐기 주석만). `rg -n '사이드스크롤|왼쪽|오른쪽|진형|카드' GAME-LOGIC/Realtime-Formation-Card-Battle.md` 전투 형태 유지.
  QA scenarios: happy — rg. failure — NESW가 유효 규칙으로 남아 있으면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-5-rules.txt`
  Commit: Y | docs(game-logic): 이동·전투 규칙에서 네 방향 격자를 뺀다
  Recommended task executor category: writing — 규칙 두 페이지.

- [ ] 6. 나머지 GAME-LOGIC 아이소·타일 문장을 지운다
  What to do / Must NOT do: 아래 파일에서 아이소/NESW/타일맵/2.5등신/35.264를 유효 계약이 아니게 삭제 또는 한 줄 폐기로 표시한다: `Campaign-Loop.md` `Campaign-Progression.md` `Character-Art-Direction.md` `Save-and-Determinism.md` `Strategy-Battle-Roundtrip.md` `Unity-Architecture.md` `Unity-System-Design.md` `Warfare-and-Sieges.md`. Unity 구조 페이지는 아키텍처 게이트 서술을 유지하되 카메라 각도를 새 계약으로 쓰지 않는다. Must NOT: Unity 코드 수정(파도 4). 레퍼런스 게임 페이지(`Ref-*`)의 외부 게임 아이소 서술은 그 게임 설명이면 남긴다.
  Parallelization: Wave 2 | Blocked by: 1 | Blocks: 12
  References: 위 8파일; `GAME-LOGIC/Ref-Songs-of-Silence.md`는 외부 레퍼런스 — 손대지 않음 unless 우리 계약을 아이소로 단정.
  Acceptance criteria: `rg -n '35\.264|2\.5등신|타일맵' GAME-LOGIC --glob '*.md' --glob '!site/**' --glob '!Ref-*'` 매칭 0. `node TOOL/tools/wiki` 공개 금지어 선검사 `rg -n 'Kenshi|Underrail|Gunner|clone|복제' GAME-LOGIC --glob '*.md' --glob '!site/**'` 변경 파일 0.
  QA scenarios: happy — rg 0. failure — Unity-Architecture에 yaw 45가 유효 계약으로 남으면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-6-logic-rg.txt`
  Commit: Y | docs(game-logic): 규칙 페이지에서 아이소·타일 잔문을 지운다
  Recommended task executor category: writing — 규칙 잔여 페이지 묶음.

- [ ] 7. LORE 지도·이동 모순만 고친다
  What to do / Must NOT do: `LORE/World-Map-Construction.md` 칸 문법(`CardinalDirection` 북동남서, 1.5m 공유 격자, 대각 거절)과 “전 서울을 한 번에 메시로 올리지 않는다”를 전략맵 청크 메시(z11 3×3) + 역 그래프 이동으로 교체한다. 지리 경로를 `GAME-REFERENCE/data/seoul-geography-20260830/`로 고친다. 전투 Heightmap 층과 세계 지형을 합치지 말 것(현행 금지)은 유지한다. 같은 모순이 있는 `LORE/Station-Interior-Construction.md` `LORE/Strongholds-and-Territory.md` `LORE/Logistics-and-Infrastructure.md`만 해당 문장을 고친다. Must NOT: Cast-* · Sixteen-States 산문 전면 재작성. 새 세계 설정 발명.
  Parallelization: Wave 3 | Blocked by: 1 | Blocks: 12
  References: `LORE/World-Map-Construction.md`; `GAME-REFERENCE/data/seoul-geography-20260830/README.md`; ADR-004 규칙 3
  Acceptance criteria: `rg -n 'CardinalDirection|35\.264|1\.5m' LORE/World-Map-Construction.md LORE/Station-Interior-Construction.md` 0. `rg -n 'GAME-REFERENCE/data/seoul-geography' LORE/World-Map-Construction.md` ≥1. `rg -n 'seoul-kenshi-data' LORE/World-Map-Construction.md` 0.
  QA scenarios: happy — rg. failure — 칸 문법이 유효 규칙으로 남으면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-7-lore.txt`
  Commit: Y | docs(lore): 월드맵 문서에서 네 방향 칸 문법을 전략맵 청크로 바꾼다
  Recommended task executor category: writing — 세계 지도 문서 모순만.

- [ ] 8. 공개 탭을 게임설계+세계관으로 줄인다
  What to do / Must NOT do: nav 두 항목만: 게임설계→`/design/`, 세계관→`/world/`. 게임설계 사이드바 = design 항목 + **rules 하위 그룹**(경로 `/rules/` 유지). `gate.mjs` `SECTIONS = ['design','world','rules']` **변경 금지**. mount `DOMAIN_ROOTS` 변경 금지. `index.md` 세 링크를 둘로. 스테이징은 `node GAME-LOGIC/site/scripts/mount.mjs`로만 재생성. Must NOT: `/rules/` 재경로. SECTIONS 축소. `GAME-LOGIC/site/{design,world,rules}/**` 손편집. 사이드스크롤 전투 화면 구현.
  Parallelization: Wave 3 | Blocked by: none | Blocks: 12
  References: `GAME-LOGIC/site/.vitepress/config.mts:55-79`; `GAME-LOGIC/site/scripts/mount.mjs:1-21`; `GAME-LOGIC/site/index.md`; `GAME-LOGIC/site/scripts/gate.mjs`
  Acceptance criteria: `rg -n "text: '기획서'|text: '게임로직'" GAME-LOGIC/site/.vitepress/config.mts` 0. nav에 게임설계·세계관. `rg -n "SECTIONS = \['design', 'world', 'rules'\]" GAME-LOGIC/site/scripts/gate.mjs` 1. mount `rejected: 0`. docs:build exit 0. `node TOOL/tools/policy/check-repo-delivery-policy.mjs` exit 0.
  QA scenarios: happy — build 0 + nav 두 탭. failure — DOMAIN_ROOTS가 바뀌어 정책 게이트 FAIL. `node TOOL/tools/policy/check-repo-delivery-policy.mjs` exit 0. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-8-site-build.txt`
  Commit: Y | docs(site): 공개 탭을 게임설계와 세계관으로 합친다
  Recommended task executor category: unspecified-low — VitePress 설정+게이트, 소규모 다파일.

- [ ] 9. GDD 잔여 아이소 문장과 Asset-Pipeline 오드랜드 as-is를 맞춘다
  What to do / Must NOT do: `GDD/Home.md` `GDD/Asset-Pipeline.md` `GDD/Design-Requirements.md`(해당 시)에서 아이소/SD를 뺀다. Asset-Pipeline 오드랜드 절은 as-is·금지 변환을 유효 계약으로 적고 폐기 경로(`Tool/art/`, `docs/assets/bom`)를 `TOOL/tools/art/import-oddland-donor.mjs`·`GAME-REFERENCE/assets/bom/donor/`로 고친다. ADR-002 회고의 아이소 언급은 역사 기록이므로 본문이 “현재 계약”이 아니면 손대지 않는다. 루트 `Design.md` HUD 아이소 승강장 문장은 전투 사이드스크롤과 모순이면 고친다. Must NOT: ADR 본문 삭제. 오드랜드 임포터 실행(이 할 일의 범위 밖).
  Parallelization: Wave 2–3 | Blocked by: 6 | Blocks: 12
  References: `GDD/Home.md`; `GDD/Asset-Pipeline.md`; `Design.md:74-115`; `TOOL/tools/art/import-oddland-donor.mjs`
  Acceptance criteria: `rg -n '35\.264|2\.5등신' GDD --glob '*.md' --glob '!adr/**'` 0. `rg -n 'as-is|그대로' GDD/Asset-Pipeline.md` ≥1. `rg -n 'Tool/art/import-oddland' Intent.md GDD/Asset-Pipeline.md` 0.
  QA scenarios: happy — rg. failure — 폐기 임포터 경로가 유효 명령으로 남아 있으면 FAIL. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-9-gdd.txt`
  Commit: Y | docs(gdd): 기획 페이지와 파이프라인에서 아이소·옛 경로를 뺀다
  Recommended task executor category: writing — GDD 잔문.

- [ ] 10. GenreContract를 사이드스크롤·전략맵으로 RED→GREEN 한다
  What to do / Must NOT do: JSON 최종 모양 — 유지 `loop.combatResolution: realtime-formation-card`, `combatPauseAllowed`. 삭제 `explorationAndCombatShareGrid`, `allowedDirections`, `silhouette` 전체, `tile` 전체, `camera.yawDegrees/pitchDegrees`. 카메라 블록 `{ projection: "perspective", pan: true, zoom: true, orbit: false }` (전략맵). 전투 카메라는 Design.md 산문. `Grid.CardinalDirection` **유지**(결정 3 내부 문법). 주석만 전투-내부로. `GenreContractTests.cs:12` JSON 핀과 `:45-56` Foundation 카메라 assert를 새 계약으로 먼저 RED. 소비자 9파일은 삭제 상수를 로컬 인라인 — **기존 화면 행동 변경 금지**(사이드스크롤 전투 구현은 이 계획 밖). architecture gate는 GenreContract를 핀하지 않는다. 씬/스코프를 안 바꾸면 게이트 기대값 수정 없음. 경로 `TOOL/tools/architecture/check-unity-architecture.mjs`. Must NOT: enum 20파일 샷건. RTFC Core 삭제. GUI Editor.
  Parallelization: Wave 4 | Blocked by: 1,4 | Blocks: 11
  References: `GAME/ProjectSettings/GenreContract.json`; `GAME/Assets/Janseon/Foundation/GenreContract.cs:5-11`; glm B4 소비자 목록; `GAME/AGENTS.md` batchmode
  Acceptance criteria: RED XML then GREEN XML via `TOOL/unity-remote/scripts/run-unity-editmode.mjs`. JSON에 `35.264`/`headsTall`/`allowedDirections` 0, `realtime-formation-card` 1, `combatPauseAllowed` true. `rg -n 'enum CardinalDirection' GAME/Assets/Janseon/Core/Grid.cs` 1. `node TOOL/tools/architecture/check-unity-architecture.mjs` 출력에 `unity architecture gate passed`.
  QA scenarios: happy — tests GREEN + json 키. failure — 소비자 미수정으로 컴파일 실패면 이 할 일 FAIL(부분 커밋 금지). Evidence `.omo/evidence/seoul-strategy-map-gdd/task-10-genre-{red,green}.xml`
  Commit: Y | feat(genre): 아이소 격자를 사이드스크롤·전략맵 계약으로 교체한다
  Recommended task executor category: unspecified-high — JSON+C#+테스트+소비자+게이트.

- [ ] 11. GeoTIFF·OSM을 청크 메시로 베이크하고 Unity 전략맵 화면에 올린다
  What to do / Must NOT do: 지형=z11 GeoTIFF 9장, 과장 2.5×, nodata -32768=수면, EPSG:3857 단위 유지(위도 왜곡 방치). 구 오버레이=KOSTAT GeoJSON을 **lon/lat→EPSG:3857 변환** 후 25구. OSM 오버레이=OpenFreeMap MVT z14 `water`+`transportation`만. 런타임 PBF 금지. 베이크는 batchmode/`TOOL/docs/Unity-Headless-Workflow.md`. 산출 `GAME/Assets/Janseon/Data/StrategyMap/Baked/` + SHA 매니페스트. 라이선스 문자열 `licenses/`에서 매니페스트에 넣는다. 두 번 돌려 SHA 동일. Foundation 전략맵: 청크 로드·팬·줌. 전투 HeightmapDomain과 분리된 Core 타입. 씬을 추가하면 architecture `expectedScopes`/build order를 같은 커밋에서. Must NOT: raw raster를 Assets에. 단일 메시. HeightmapApi 합치기. 사이드스크롤 전투 구현.
  Parallelization: Wave 5 | Blocked by: 10 | Blocks: 12
  References: `GAME-REFERENCE/data/seoul-geography-20260830/README.md`; `GAME/Assets/Janseon/Core/HeightmapDomain.cs`; `GAME/Assets/Janseon/Foundation/Presentation/HeightmapVoxelWorld.cs`; `GAME/AGENTS.md`
  Acceptance criteria: bake 두 번 SHA-256 동일. chunkCount==9. nodata→water. 2.5× 메타데이터. PlayMode XML pass. PNG 1280×720와 1920×1080. 입력 1장 삭제 시 CLI non-zero. `node TOOL/tools/architecture/check-unity-architecture.mjs` → `unity architecture gate passed`.
  QA scenarios: happy — bake --verify + PNG. failure — 입력 1장 삭제 시 CLI non-zero. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-11-bake/` (manifest.json, nunit.xml, png)
  Commit: Y | feat(map): 서울 하이트맵 청크를 베이크해 전략맵 화면에 올린다
  Recommended task executor category: deep — 지리 베이크+Unity batchmode가 한 통찰.

- [ ] 12. 마운트·금지어·patina·정책 게이트를 한 번에 통과한다
  What to do / Must NOT do: `node GAME-LOGIC/site/scripts/mount.mjs`로 스테이징 갱신. 변경된 한국어 페이지 patina `--score --offline`. 공개 금지어 rg. `npm --prefix GAME-LOGIC/site run docs:build`. `node TOOL/tools/policy/check-repo-delivery-policy.mjs`. 루트에 Wikis/ data/ 없음. Must NOT: 사이트 md를 정본으로 손편집. 게이트 skip.
  Parallelization: Wave 5 | Blocked by: 3,5,7,8,9,11 | Blocks: F*
  References: `GAME-LOGIC/site/scripts/mount.mjs`; `CONTRIBUTING.md` 위키 게이트; ADR-004
  Acceptance criteria: mount+docs:build+policy 전부 exit 0. `test ! -d Wikis && test ! -d data`. patina가 변경 한국어 문서에서 실패하면 문장 수정 후 재실행.
  QA scenarios: happy — 세 명령 0. failure — `/rules/` 깨진 링크가 build에서 잡히면 리다이렉트 보정. Evidence `.omo/evidence/seoul-strategy-map-gdd/task-12-gates.txt`
  Commit: Y | chore(site): 전략맵 정본을 마운트하고 배포 게이트를 통과한다
  Recommended task executor category: unspecified-low — 게이트 묶음.

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Confirm every `- [ ] N.` row has References, Acceptance, happy+failure QA, Commit, and `Recommended task executor category:`. Confirm Must NOT have was not implemented. Evidence `.omo/evidence/seoul-strategy-map-gdd/F1-compliance.md`
  Recommended task executor category: unspecified-high
- [ ] F2. Code quality review
  Diff-only: GenreContract consumers compile; no leftover `35.264` in `GAME/ProjectSettings/GenreContract.json`; architecture gate 0; no Wikis/ or root data/. Evidence `.omo/evidence/seoul-strategy-map-gdd/F2-diff.txt`
  Recommended task executor category: unspecified-high
- [ ] F3. Real manual QA
  Agent: `npm --prefix GAME-LOGIC/site run docs:build` and curl or file-read of built nav for 게임설계+세계관 only. Unity batchmode PNG of strategy map exists and is not the 20×20 voxel POC. `node TOOL/tools/policy/check-repo-delivery-policy.mjs` 0. Evidence `.omo/evidence/seoul-strategy-map-gdd/F3/`
  Recommended task executor category: unspecified-high
- [ ] F4. Scope fidelity
  Reject if RTFC Core deleted, Oddland retargeted, ADR-004 violated, Intent log wiped, or 16-state campaign added. Evidence `.omo/evidence/seoul-strategy-map-gdd/F4-scope.md`
  Recommended task executor category: unspecified-high

## Commit strategy
One atomic commit per todo (RED→GREEN + evidence). Conventional Commits as specified on each todo. Language: Korean subject like recent `feat(policy):` / `docs(` history (`git log --oneline -8`). No WIP on the final branch. Footer on last commit: `Plan: .omo/plans/seoul-strategy-map-gdd.md`. Do not commit `.omo/evidence/` unless the repo already tracks that path. Do not force-push. PR if `/ulw-execute --make-pr`; no direct main unless the owner says so in that session.

## Success criteria
- Public site chrome is 게임설계 + 세계관. ADR-004 folders unchanged. Policy gate 0.
- Canon docs no longer state NESW / isometric 45/35.264 / tilemap / 2.5-head as live contract. Intent log still exists with supersession notes.
- 결정 3 RTFC mechanics still named live. Combat presentation is L/R side-scroll.
- ToDo current module is the Seoul strategy map. #58 cancelled. 13–17 parked.
- GenreContract JSON+C#+tests GREEN without iso keys; `combatResolution` still realtime-formation-card.
- Nine GeoTIFF chunks baked from `GAME-REFERENCE/data/seoul-geography-20260830/`, Unity strategy-map PNG captured in batchmode.
- Oddland bytes unmodified. No Wikis/ or root data/ recreated.
