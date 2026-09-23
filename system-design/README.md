# 시스템 구조 보고

정의된 게임 디자인(`GDD/`)과 코드 조립이 어떻게 나뉘는지 정리한 읽기 전용 보고입니다. 제품 코드가 아닙니다.

브라우저에서 `index.html`을 엽니다. 그 페이지는 현재 Unity POC 측정과 2026-09-19 목표(실시간 부대 지휘, 애니메이션풍 정비율, 3D 자유 지휘 카메라, 닫힌 전투 안에서만 일시정지 중 명령)를 한 장에서 구별합니다. 카메라·일시정지는 질문 만료 뒤 채택한 설계 기본값이며 소유자 명시 결정이 아닙니다. 부대 지휘 화면 초안은 [`total-war-ui/`](total-war-ui/)입니다. 노드별 상태와 그 흐름은 [`gdd-lore-node-states.lifecycle.html`](gdd-lore-node-states.lifecycle.html)과 [`gdd-lore-node-states.md`](gdd-lore-node-states.md) 표에서 봅니다. 뷰어 UI는 영어 폴백입니다. 캠페인 POV·권한 전이 청사진은 [`campaign-pov-authority/`](campaign-pov-authority/)입니다. 그 도식들은 실제 게임 렌더가 아닙니다.

근거 문서는 `GDD/architecture/Unity-Architecture.md`, `GDD/architecture/Unity-System-Design.md`, `GDD/rules/Save-and-Determinism.md`, `GDD/rules/Campaign-Loop.md`, `GDD/Home.md`와 `GAME/Assets/Janseon/`입니다. 서울 전체 지도와 개막 영토는 [서울:전국 공식 위키](https://seoul-dengoku.linalab.io/wiki/world/World-and-Subway-Layers)에서 확인합니다.

과거 카드 전투 POC의 구현·수치·검증 이력은 스튜디오 전용 [카드 전투 POC 기록](poc-history/Card-Battle-POC-History.md)에 보존합니다. 현재 목표 전투 규칙은 아닙니다.
