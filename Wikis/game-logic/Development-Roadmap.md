# 개발 로드맵

![모든 개발 단계에서 칸에 누가 서 있고 어느 쪽을 보며 어디까지 보이는지](https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/isometric-grammar.svg?raw=true)

이 로드맵은 [Concept.md](../../Concept.md)의 현재 모듈 `Unity POC 통합 코어 루프`와 [ToDo.md](../../ToDo.md)의 실측 상태를 반영한다. 일정 약속이 아니라 의존성과 실패 기준을 설명한다.

## 목표 형태 (2026-09-07 소유자 결정)

이 게임이 도달하려는 형태는 **4X + RPG**이며 전투는 **실시간 진형·카드 전투**다([Intent](https://github.com/islee23520/seoul-kenshi/blob/main/Intent.md) 결정 3). 기준 레퍼런스는 [Songs of Silence](Ref-Songs-of-Silence.md)(지도 턴 4X + 실시간 자동 전투 + 영웅 카드)이고, 턴제 SRPG 쪽의 정밀 참조는 [라벨렌 전기](Ref-Ravelen-Chronicles.md)다. 계약은 그대로다. 카메라(45/35.264 고정 직교 아이소)·격자(1.5m 4방향)·결정론(동일 seed + 명령 기록)이 유지되고, 바뀌는 것은 **전투 안에서 플레이어가 하는 일**뿐이다.

| 층 | 목표 | 상태 |
|---|---|---|
| 4X 전략 | 노선·역을 탐상·확장·개발·정복, 제한된 상태 전이로 인과를 읽을 수 있게 | 서울 427동 지역 총람·웹 원정 지도는 있음. Unity 런타임 이동은 334역 그래프, Area 1 콘텐츠는 세 역 |
| RPG | 인물 성장·관계·생업·직위가 카드와 지휘 반경으로 전투에 들어온다 | 인물 원본(412인) 있음, 카드 부여 규칙 미설계 |
| 실시간 진형·카드 전투 | 전투 전 진형 편집, 전투 중 카드(일시정지 가능), 사기·항복, 틱 스탬프 명령 기록 | Core 규칙 `rtfc-owner-cards-v2`(30Hz) 반영. 분대 명령·집계 사상자 표현은 계약 승인, 완료 검증 미완 |

목표 형태는 그대로다. 전투 Core는 이미 실시간 진형·카드 규칙으로 바꾸었고, 아래 검증 단계는 시각 수용·슬롯 연결·시각 게이트를 끝내는 순서다.

## 현재 완료 (POC 슬라이스)

- Foundation 기반: Bootstrap App scope/FSM, 배타적 화면 lease, VContainer 정적 계약, 아키텍처 게이트
- 코어 루프(ToDo 5–12): 결정론 Core ID·tick·명령·RNG 스트림·원장 해시, 영등포–신도림–구로 세 역 노선, 교섭·우회를 포함한 여섯 단계 캠페인, 30Hz 실시간 진형·카드 전투(`rtfc-owner-cards-v2`), 정확히 한 번 정산, MainTitle 포함 uGUI 화면 — batchmode PlayMode로 동일 seed 재현·중복 정산 거부 검증
- 웹 코어 루프 POC(`play/`, 2026-09-14, PR #90): 영등포 거점에서 서울 427동을 고르고 조우·진형·실시간 카드 전투·정산 한 번·귀환까지 브라우저에서 조작한다. 캠페인 루프 설계를 손으로 확인하는 축소판이며 Unity 모듈 완료가 아니다. 이동은 직선 거리 웹 규칙이다
- 서울 지역 총람(2026-09-13): 2026-07-01 행정동 경계 25구·427동, OSM 스냅샷 2026-09-04T23:00:00Z. 동별 주민·생업·위험·행동과 후보 원장 1,011,022건을 `tools/regions`가 재대조한다. 열람은 `system-design/regions/`. 역 334·간선 435는 이동 그래프이지 서울 면적의 증명이 아니다. Unity 내부 격자·16국 시뮬레이션은 없다
- 생성 아트 기반: 역사 소품 6종 source-bound BOM 승격·런타임 연결, 3역할(탐사원·의무원·순찰대) 캐릭터 승격, UI kit 9종 후보(시각 수용 대기), TRELLIS v1 옵션 호스트 계약 고정
- 세계관·인물 원본: 국가별 명부(Cast-State-01–16, 412인)와 관계 원장, 적대 집단 G01–G27 게시, 서사 배치 B001–B047, ISO 세계·가문·적대 도표, 몬스터 배치 원장 M001–M042, World-Narrative-Atlas 통합
- 공개 Wiki: docs/game-logic 원본의 자동 생성 미러가 원본 커밋과 동기(소스 페이지 188, 미게시 조각은 표로만 추적)
- 저장소 검증 도구: LFS 사전 스머지 검사, Cast-Index 관계 수(송신 간선) 계약 검증, 위키 빌더의 미게시 조각 누출 방지, 신규 클론 PlayMode 준비 절차

## 다음 검증 단계 (순서 의존)

1. 시각 수용 — 타이틀(#8)과 UI kit·아이콘·타일(#23)의 4축 독립 재심사와 소유자 육안 승인. COMPOSITION·PRODUCT_POLISH raw FAIL은 면제 없음. 캐릭터는 기존 placeholder가 폐기됐으므로 TOS식 SD 재작업(#58)이 선행된다
2. UI 마무리 — uGUI HUD·진형 편집·지휘관 카드는 연결됨. 안정 요소 이름·씬 흐름·결정론 계약을 유지한 채 시각 수용·슬롯 연결(#59 잔여·ToDo 18)
3. 슬롯 연결(ToDo 16, #26) — 승격된 에셋만 uGUI 런타임 슬롯에 연결하고 임시 비주얼 제거
4. 최종 수용 게이트(ToDo 17, #27) — 아키텍처 게이트, batchmode PlayMode 전 경로, 4축 시각 PASS, BOM fail-closed, 동일 Unity revision macOS Development player smoke, 임시 리소스 cleanup receipt를 한 번에 통과
5. 서사·협업 후속(#41) — 외부 기여자와의 서사 디렉션 역할·경계 합의
6. 전투 표현 마무리 — Core는 `rtfc-owner-cards-v2`로 반영됐다. 남은 일은 [전투](Realtime-Formation-Card-Battle.md)의 분대 명령·집계 사상자 검증, Foundation HUD 잔여, BOM 승격 슬롯 연결이다. POC 비주얼은 오드랜드 기증 패이로드(`Game/Assets/Quarantine/Oddland/`, [에셋이 들어오는 길](Asset-Pipeline.md) 기증 절)의 3D·SFX·VFX와 Spine POC 캐릭터를 쓰되, 런타임 슬롯 연결은 BOM 승격 게이트를 그대로 통과해야 한다. 전체 16국·412인 캠페인, 저장·외교·공성은 그 뒤 별도 모듈

각 단계는 실패하면 다음 단계로 넘어가지 않는다.

## 검증 게이트

| 게이트 | 통과 조건 |
|---|---|
| 시뮬레이션 | 100개 고정 시드를 두 번 실행해 상태·원장 해시 일치 |
| 지도 | Unity 경로·층·환승·봉쇄를 잘못 해석하지 않음 |
| 지역 총람 | 427동 전수, 면적 누락/겹침 0, 원본 PBF 후보 재대조, 빈 내용·타 동 앵커·날짜 혼동 거부. `--geometry-only`는 완료가 아님 |
| 전투 왕복 | 중복 정산 0건, 저장 경계 복원 성공 |
| 캐릭터 | 실제 Play Mode 캡처에서 중대 가림·방향·경계 결함 0건 |
| 시각 | COMPOSITION / SPRITE_FIDELITY / TYPOGRAPHY / PRODUCT_POLISH 독립 PASS |
| 자산 | 출시 후보의 권리·도구·변환 BOM 누락 0건 |
| 빌드 | 고정 Unity revision에서 컴파일, 테스트와 대상 빌드 성공 |

POC 슬라이스가 위 게이트를 모두 통과하기 전까지 두 번째 제품 모듈을 시작하지 않는다.
