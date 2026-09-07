# 개발 로드맵

![모든 개발 단계에서 칸에 누가 서 있고 어느 쪽을 보며 어디까지 보이는지](https://github.com/islee23520/seoul-kenshi/blob/main/docs/assets/wiki/isometric-grammar.svg?raw=true)

이 로드맵은 [Concept.md](../../Concept.md)의 현재 모듈 `Unity POC 통합 코어 루프`와 [ToDo.md](../../ToDo.md)의 실측 상태를 반영한다. 일정 약속이 아니라 의존성과 실패 기준을 설명한다.

## 목표 형태 (2026-09-07 소유자 결정)

이 게임이 도달하려는 형태는 **4X + RPG**이며, 전투는 **실시간 진형·카드 전투**다([Intent](https://github.com/islee23520/seoul-kenshi/blob/main/Intent.md) 결정 3). 기준 레퍼런스는 [Songs of Silence](Ref-Songs-of-Silence.md)(지도 턴 4X + 실시간 자동 전투 + 영웅 카드)이고, 턴제 SRPG 쪽의 정밀 참조는 [라벨렌 전기](Ref-Ravelen-Chronicles.md)다. 이 결정은 카메라(45/35.264 고정 직교 아이소)·격자(1.5m 4방향)·결정론(동일 seed + 명령 기록) 계약을 바꾸지 않고 **전투 안에서 플레이어가 하는 일**만 바꾼다.

| 층 | 목표 | 상태 |
|---|---|---|
| 4X 전략 | 노선·역을 탐상·확장·개발·정복, 제한된 상태 전이로 인과를 읽을 수 있게 | 설계 문서 있음, 런타임은 세 역 노선 POC만 |
| RPG | 인물 성장·관계·생업·직위가 카드와 지휘 반경으로 전투에 들어온다 | 인물 원본(412인) 있음, 카드 부여 규칙 미설계 |
| 실시간 진형·카드 전투 | 전투 전 진형 편집, 전투 중 카드(일시정지 가능), 사기·항복, 틱 스탬프 명령 기록 | 계약 페이지만 있음 — POC 런타임은 아직 턴제 규칙 |

이 목표 형태는 현재 모듈을 바꾸지 않는다. 현재 모듈은 아래 검증 단계를 그대로 끝내고, **다음 모듈은 실시간 진형·카드 전투 코어**로 지정한다(6번 항목).

## 현재 완료 (POC 슬라이스)

- Foundation 기반: Bootstrap App scope/FSM, 배타적 화면 lease, VContainer 정적 계약, 아키텍처 게이트
- 코어 루프(ToDo 5–12): 결정론 Core ID·tick·명령·RNG 스트림·원장 해시, 영등포–신도림–구로 세 역 노선, 교섭·우회를 포함한 여섯 단계 캠페인, 동일 격자 SRPG 전투, 정확히 한 번 정산, MainTitle 포함 UI Toolkit 화면 — batchmode PlayMode로 동일 seed 재현·중복 정산 거부 검증 (※ 2026-09-06 UI 계약이 uGUI로 개정됨([Intent](Intent.md)) — 기존 UI Toolkit 화면은 마이그레이션 대상)
- 생성 아트 기반: 역사 소품 6종 source-bound BOM 승격·런타임 연결, 3역할(탐사원·의무원·순찰대) 캐릭터 승격, UI kit 9종 후보(시각 수용 대기), TRELLIS v1 옵션 호스트 계약 고정
- 세계관·인물 원본: 국가별 명부(Cast-State-01–16, 412인)와 관계 원장, 적대 집단 G01–G24 게시, 서사 B001 배치, ISO 세계·가문·적대 도표, 몬스터 배치 원장(38/39), World-Narrative-Atlas 통합
- 공개 Wiki: docs/game-logic 원본의 자동 생성 미러가 원본 커밋과 동기(81페이지, 미게시 조각은 표로만 추적)
- 저장소 검증 도구: LFS 사전 스머지 검사, Cast-Index 관계 수(송신 간선) 계약 검증, 위키 빌더의 미게시 조각 누출 방지, 신규 클론 PlayMode 준비 절차

## 다음 검증 단계 (순서 의존)

1. 시각 수용 — 타이틀(#8)과 UI kit·아이콘·타일(#23)의 4축 독립 재심사와 소유자 육안 승인. COMPOSITION·PRODUCT_POLISH raw FAIL은 면제 없음. 캐릭터는 기존 placeholder가 폐기됐으므로 TOS식 SD 재작업(#56)이 선행된다
2. UI 전환 — UI Toolkit 구현을 uGUI로 마이그레이션(#55, Design.md 2026-09-06 개정). 안정 요소 이름·씬 흐름·결정론 계약 유지
3. 슬롯 연결(ToDo 16, #26) — 승격된 에셋만 uGUI 런타임 슬롯에 연결하고 임시 비주얼 제거
4. 최종 수용 게이트(ToDo 17, #27) — 아키텍처 게이트, batchmode PlayMode 전 경로, 4축 시각 PASS, BOM fail-closed, 동일 Unity revision macOS Development player smoke, 임시 리소스 cleanup receipt를 한 번에 통과
5. 서사·협업 후속(#41) — 외부 기여자와의 서사 디렉션 역할·경계 합의
6. 다음 모듈 — **실시간 진형·카드 전투 코어**(2026-09-07 지정). 현재 POC의 턴제 격자 규칙(ToDo 8)을 고정 틱 시뮬레이션·진형·사기·카드 명령으로 교체하고, 동일 seed + 틱 스탬프 명령 기록 재현을 같은 게이트로 검증한다. 착수 전에 전투 계약([실시간 진형·카드 전투](Realtime-Formation-Card-Battle.md))의 수치(틱 간격·카드 재충전·사기 임계)를 계획으로 잠그고 이슈로 등록한다. 전체 16국·412인 캠페인, 저장·외교·공성은 그 뒤 별도 모듈

각 단계는 실패하면 다음 단계로 넘어가지 않는다.

## 검증 게이트

| 게이트 | 통과 조건 |
|---|---|
| 시뮬레이션 | 100개 고정 시드를 두 번 실행해 상태·원장 해시 일치 |
| 지도 | 경로, 층, 환승과 봉쇄를 잘못 해석하지 않음 |
| 전투 왕복 | 중복 정산 0건, 저장 경계 복원 성공 |
| 캐릭터 | 실제 Play Mode 캡처에서 중대 가림·방향·경계 결함 0건 |
| 시각 | COMPOSITION / SPRITE_FIDELITY / TYPOGRAPHY / PRODUCT_POLISH 독립 PASS |
| 자산 | 출시 후보의 권리·도구·변환 BOM 누락 0건 |
| 빌드 | 고정 Unity revision에서 컴파일, 테스트와 대상 빌드 성공 |

POC 슬라이스가 위 게이트를 모두 통과하기 전까지 두 번째 제품 모듈을 시작하지 않는다.
