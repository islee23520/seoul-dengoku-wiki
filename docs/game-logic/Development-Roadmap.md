# 개발 로드맵

![모든 개발 단계에서 칸에 누가 서 있고 어느 쪽을 보며 어디까지 보이는지](https://github.com/islee23520/seoul-kenshi/blob/main/docs/assets/wiki/isometric-grammar.svg?raw=true)

이 로드맵은 [Concept.md](../../Concept.md)의 현재 모듈 `Unity POC 통합 코어 루프`와 [ToDo.md](../../ToDo.md)의 실측 상태를 반영한다. 일정 약속이 아니라 의존성과 실패 기준을 설명한다.

## 현재 완료 (POC 슬라이스)

- Foundation 기반: Bootstrap App scope/FSM, 배타적 화면 lease, VContainer 정적 계약, 아키텍처 게이트
- 코어 루프(ToDo 5–12): 결정론 Core ID·tick·명령·RNG 스트림·원장 해시, 영등포–신도림–구로 세 역 노선, 교섭·우회를 포함한 여섯 단계 캠페인, 동일 격자 SRPG 전투, 정확히 한 번 정산, MainTitle 포함 UI Toolkit 화면 — batchmode PlayMode로 동일 seed 재현·중복 정산 거부 검증
- 생성 아트 기반: 역사 소품 6종 source-bound BOM 승격·런타임 연결, 3역할(탐사원·의무원·순찰대) 캐릭터 승격, UI kit 9종 후보(시각 수용 대기), TRELLIS v1 옵션 호스트 계약 고정
- 세계관·인물 원본: 국가별 명부(Cast-State-01–16, 412인)와 관계 원장, 적대 집단 G01–G24 게시, 서사 B001 배치, ISO 세계·가문·적대 도표, 몬스터 배치 원장(38/39), World-Narrative-Atlas 통합
- 공개 Wiki: docs/game-logic 원본의 자동 생성 미러가 원본 커밋과 동기(81페이지, 미게시 조각은 표로만 추적)
- 저장소 검증 도구: LFS 사전 스머지 검사, Cast-Index 관계 수(송신 간선) 계약 검증, 위키 빌더의 미게시 조각 누출 방지, 신규 클론 PlayMode 준비 절차

## 다음 검증 단계 (순서 의존)

1. 시각 수용 — 타이틀(#8)과 UI kit·아이콘·타일(#23)의 4축 독립 재심사와 소유자 육안 승인. COMPOSITION·PRODUCT_POLISH raw FAIL은 면제 없음
2. 슬롯 연결(ToDo 16, #26) — 승격된 에셋만 UI/캐릭터 런타임 슬롯에 연결하고 임시 비주얼 제거
3. 최종 수용 게이트(ToDo 17, #27) — 아키텍처 게이트, batchmode PlayMode 전 경로, 4축 시각 PASS, BOM fail-closed, 동일 Unity revision macOS Development player smoke, 임시 리소스 cleanup receipt를 한 번에 통과
4. 서사·협업 후속(#41) — 외부 기여자와의 서사 디렉션 역할·경계 합의
5. 다음 모듈 선택 — 전체 16국·412인 캠페인, 저장·외교·공성 등은 POC 완료 후 별도 모듈로만 착수

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
