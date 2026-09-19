# 시스템 구조 보고

정의된 게임 디자인(`GAME-LOGIC/`) 코드 조립으로 어떻게 나뉘는지 정리한 읽기 전용 보고입니다. 제품 코드가 아닙니다.

브라우저에서 `index.html`을 엽니다. 그 페이지는 현재 Unity POC 측정과 2026-09-19 목표(실시간 부대 지휘, 애니메이션풍 정비율, 3D 자유 지휘 카메라, 닫힌 전투 안에서만 일시정지 중 명령)를 한 장에서 구별합니다. 카메라·일시정지는 질문 만료 뒤 채택한 설계 기본값이며 소유자 명시 결정이 아닙니다. 부대 지휘 화면 초안은 [`total-war-ui/`](total-war-ui/)입니다. 그 청사진은 실제 게임 렌더가 아닙니다.

근거 문서는 `GAME-LOGIC/Unity-Architecture.md`, `GAME-LOGIC/Unity-System-Design.md`, `GAME-LOGIC/Save-and-Determinism.md`, `GAME-LOGIC/Campaign-Loop.md`, `GDD/Home.md`와 `GAME/Assets/Janseon/`입니다. 지역 총람은 [`regions/`](regions/)입니다.
