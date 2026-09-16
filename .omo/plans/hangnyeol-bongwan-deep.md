# 계획: 한국 성씨·본관·항렬자 전수 조사와 인물 적용

목표 계약은 등록된 goal(SC1~SC6)이고, 이 파일은 그 goal을 실행 순서로 푼 정본이다.
작업 트리: `/Volumes/gameWorkspace/worktrees/seoul-kenshi/hangnyeol-bongwan-deep` (브랜치 `hangnyeol-bongwan-deep`, `aff74038` 기준).

## 왜 지금 표면이 얕은가 (실측)

| 근거 | 실측 |
| --- | --- |
| `Wikis/game-logic/Hangnyeol-and-Bon-gwan.md` | 52줄. 본문이 스스로 "실존 족보 자료가 아닌 검토용 시드"라고 적는다 |
| `Wikis/game-logic/name-pools/clans-hangnyeol.json` | 17줄. 성씨 10개, 성씨당 본관 1개, 창작 글자 4개, `keepRate`는 임의값 |
| `Wikis/game-logic/name-pools/surnames.json` | 단일 글자 성씨 40개. 한자·본관·인구 없음 |
| `Tool/tools/cast/generate_nemotron_roster.py` | `generation_index(age)`가 나이 구간을 세수로 쓴다. 문서가 금지한 바로 그 방식이 코드에 박혀 있다 |

## 단계

### P0 부트스트랩
- goal 등록, 노트패드 개설, mass-ulw 계획 교범 정독
- 워크트리 생성, 이 계획 파일 배치, todo 등록

### P1 스키마와 게이트 먼저 (RED 선확보)
데이터가 없는 상태에서 게이트가 먼저 실패해야 증거가 성립한다.

- 데이터 파일 4종
  - `surnames-bongwan.json` — 성씨 표기·한자·본관·2015 인구·출처
  - `hangnyeol-systems.json` — 오행상생·십간·십이지·수교·자리·세수
  - `clan-hangnyeol-tables.json` — 문중별 항렬표. 행마다 `verified` 또는 `creative`
  - `cast-hangnyeol.json` — 인물별 본관·분파·세수·항렬 적용 또는 미사용 사유
- `Tool/tools/wiki/verify-hangnyeol.mjs` — 출처 강제, 인용 스니펫 대조, 라벨 혼합 금지, 세대 정합성
- `Tool/tools/wiki/test-verify-hangnyeol.mjs` — 단위 테스트
- SC1 RED 캡처

### P2 원자료 수집 (mass-ulw 동시 run 2개)
노드는 JSON을 쓰지 않는다. 실제로 열어본 페이지의 **축자 인용**과 URL, 열람일만 레인별 파일 하나에 적는다.
출처를 못 찾으면 `NOT_FOUND`에 검색어와 실패 URL을 적는다. 이것이 성공한 결과다.

- run `hangnyeol-harvest-systems`: 통계 5 + 체계 9 + 경계 5 레인
- run `hangnyeol-harvest-clans`: `surnames.json` 40개 성씨 각각 1레인
- 각 run 끝에 요약 노드와 인용 재대조 노드

### P3 데이터셋 빌드
raw 증거 파일만 읽어 JSON으로 환원한다. 행마다 `source_url`·`accessed`·`evidence`(raw 경로)가 있어야 한다.
`verified`와 `creative`를 한 표에 섞지 않는다. SC1 GREEN, SC2 위조 탐지 프로브.

### P4 인물 적용
- 관계 원장(`Cast-Relations.md`)의 친족 간선에서 혈연 세수를 읽는다. 나이에서 세수를 만들지 않는다.
- 기존 이름은 개명하지 않는다(카드 계약 + `verify-cast.mjs`의 T0 17명 고정).
  소급은 본관·분파·세수·항렬 사용 여부 부여까지다.
- 생성기를 세수 기반으로 재작성하고 결정적 시드를 유지한다.
- SC3 세대 정합성 RED→GREEN.

### P5 문서와 게시
- `Wikis/game-logic/Hangnyeol-and-Bon-gwan.md` 심층 재작성, `Wikis/site/world/` 미러 동기화
- SC6 patina `--score --offline`, SC4 회귀, SC5 렌더 스크린샷
- 단계별 커밋, PR(푸터 `Refs`만). main 직접 푸시 금지.

## 하지 않는 것

- 실존 문중의 항렬표를 창작 가계 표에 섞어 "실제"로 적는 일
- 출처 없이 인구 수치나 항렬자를 채우는 일
- 기존 캐스트 이름의 소급 개명
- Unity 씬·아트 승격
