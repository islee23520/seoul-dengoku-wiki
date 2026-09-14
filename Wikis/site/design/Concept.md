# 잔선: 서울 — 제품 콘셉트와 기술 기준선

## 제품

《잔선: 서울》은 붕괴 이후 **후세 서울**의 지하철망을 지상·지하 다층 전략 그래프로 다루는, 인물 중심 **4X + RPG**입니다. 전투는 턴제 SRPG가 아닙니다. 2026-09-07 소유자 결정으로 **실시간 진형·카드 전투**로 확정됐고 기준 레퍼런스는 Songs of Silence입니다([Intent.md](/design/Intent) 결정 3). 탐색·상호작용·전투는 고정 직교 아이소메트릭 카메라와 4방향 타일 격자를 공유합니다.

## 기술 기준선

- Unity `6000.7.0a5`
- Universal Render Pipeline `17.7.0`
- Input System `1.20.0`
- Unity Test Framework `1.8.0`
- VContainer `1.19.0` — Foundation 아키텍처 모듈에서 고정한 DI 기준

VContainer 외 Makcha-Unity 패키지는 현재 모듈에 실제 호출자와 실패 테스트가 생기기 전에는 추가하지 않습니다.

## 아키텍처 원칙

- 씬 하나에 앱 수명주기, 화면, 게임 상태와 저장 책임을 모으지 않습니다.
- `Bootstrap.unity`는 프로세스 수명의 App scope와 FSM만 소유합니다.
- `Foundation.unity`는 화면 수명의 child scope, 카메라와 조명만 소유합니다.
- FSM만 scene transition을 승인하며 대상 readiness 이후에 안정 상태를 commit합니다.
- static mutable Singleton과 service locator를 금지합니다.
- Repository와 domain contract는 Unity-free 경계를 유지합니다.
- 같은 seed와 command log는 같은 상태와 원장 hash를 만들어야 합니다.

상세 계약은 [`GDD/system-design/Unity-System-Design.md`](/rules/Unity-System-Design), 실행 순서는 [`Wikis/game-logic/Unity-Architecture-Implementation-Plan.md`](/rules/Unity-Architecture-Implementation-Plan)를 따릅니다.

## 현재 구현 범위

현재 모듈 `Unity POC 통합 코어 루프`는 `Bootstrap` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면 lease, uGUI 화면, 세 역 노선과 교섭·우회·전투·정산·복귀를 구현했습니다. 전투 Core는 30Hz 고정 틱의 실시간 진형·카드 규칙(`rtfc-owner-cards-v2`)이며, 분대 명령·집계 사상자 표현의 완료 검증은 남아 있습니다([실시간 진형·카드 전투](/rules/Realtime-Formation-Card-Battle)). 동일 seed 재현과 중복 정산 거부를 실제 batchmode PlayMode에서 검증합니다. 생성 아트 슬롯 승인·연결은 별도 수용 조건이며, 코드 검증만으로 모듈 전체가 완료되지는 않습니다.

## 완료 판단

Foundation 아키텍처 모듈은 Wiki 계약, 정적 아키텍처 게이트, Unity compile, EditMode/PlayMode, 실제 Editor Play Mode와 네 축 시각 리뷰를 통과한 기준선입니다. 현재 모듈 `Unity POC 통합 코어 루프`는 타이틀→거점→원정→조우→전투/비전투→정산→복귀 한 바퀴와 검수된 생성 에셋이 실제 화면에 연결된 뒤에만 완료됩니다.
