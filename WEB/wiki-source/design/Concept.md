# 서울:전국 — 제품 콘셉트와 기술 기준선

## 제품

《서울:전국》은 붕괴 이후 **후세 서울**의 지하철망을 지상·지하 다층 전략 그래프로 다루는, 인물 중심 **4X + RPG**입니다. 2026-09-19 결정 11로 제품 목표 전투는 **토탈워식 부대 지휘**이고, 인물은 **애니메이션풍 정비율**입니다. 개별 영웅 액션 조작과 무쌍식 전투는 채택하지 않습니다. 2026-09-07 결정 3의 실시간 진형·카드와 Songs of Silence 기준은 목표에서 대체됐고, 현 Unity POC의 `rtfc-owner-cards-v2` 기록으로 남습니다([Intent.md](/design/Intent) 결정 3·11). 전략 화면은 2026-09-18 결정 10의 서울 전역 3D 하이트맵입니다. 전투 화면의 좌우 사이드스크롤은 POC 표현입니다. 목표 카메라는 2026-09-19 질문 시간 초과 뒤 채택한 3D 자유 지휘 기본안(팬·오빗·줌)이며, 소유자가 직접 고른 결정이 아닙니다. 각도·시야각 수치는 잠그지 않습니다.

전장에서는 이름 있는 영웅 캐릭터와 병졸 분대를 구분합니다. 영웅은 병졸 인원에 포함되지 않는 별도 지휘 인물이고, 병졸 한 분대는 최대 20명입니다. 이 상한은 소규모 노선 사회의 규모를 지키기 위한 것이며, 전체 분대 수나 영웅 수를 새로 고정하지 않습니다.

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

상세 계약은 [`GDD/architecture/Unity-System-Design.md`](/rules/Unity-System-Design), 실행 순서는 [`GDD/architecture/Unity-Architecture-Implementation-Plan.md`](/rules/Unity-Architecture-Implementation-Plan)를 따릅니다.

## 현재 구현 범위

현재 모듈 `Unity POC 통합 코어 루프`는 `Bootstrap` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면 lease, uGUI 화면, 세 역 노선과 교섭·우회·전투·정산·복귀를 구현한 역사적 POC입니다. 이 구현은 풀 3D 부대 지휘 목표의 완료 증거가 아닙니다. 기존 전투 Core의 30Hz 고정 틱 실시간 진형·카드 규칙(`rtfc-owner-cards-v2`)은 POC 계약으로 보존하며, 활성 목표는 병졸별 상태를 가진 풀 3D 부대 지휘와 분리된 영웅·병졸 표현입니다. 새 시간 기준은 Unity PlayerLoop의 `FixedUpdate`와 실행 시점 `Time.fixedDeltaTime`을 사용하며 특정 Hz를 잠그지 않습니다. 생성 아트 슬롯 승인·연결은 별도 수용 조건이며, 코드 검증만으로 모듈 전체가 완료되지는 않습니다.

## 완료 판단

Foundation 아키텍처 모듈은 Wiki 계약, 정적 아키텍처 게이트, Unity compile, EditMode/PlayMode, 실제 Editor Play Mode와 네 축 시각 리뷰를 통과한 기준선입니다. 현재 모듈 `Unity POC 통합 코어 루프`는 타이틀→거점→원정→조우→전투/비전투→정산→복귀 한 바퀴와 검수된 생성 에셋이 실제 화면에 연결된 뒤에만 완료됩니다. 결정 11의 부대 지휘 목표는 문서 계약이며, 이 POC 완료 조건을 대체하지 않습니다.
