# 시스템 구조 보고

게임 디자인(`GDD/`)의 시스템 설계 도식을 모은 읽기 전용 폴더입니다. 제품 코드가 아닙니다.

이전 부대 지휘 화면 초안은 [`total-war-ui/`](total-war-ui/)에 보존합니다. 이는 결정 13~15 이전 자료이며 활성 규칙이나 구현 목표의 근거가 아닙니다. 교전 전 지시·자동/수동 선택·근접 잠금·전체 후퇴, 가변 정원·공통 상한 없음으로 다시 설계할 범위는 [캠페인 진행과 위기](../canon/locales/ko-KR/rules/campaign-progression.json)에 정리했습니다. 전투는 3D 자유 카메라를 사용하며 일시정지·감속·배속은 없습니다.

노드 상태는 [`gdd-lore-node-states.lifecycle.html`](gdd-lore-node-states.lifecycle.html)과 [정본 상태표](../canon/locales/ko-KR/system-design/gdd-lore-node-states.json), 캠페인 POV·권한 전이는 [`campaign-pov-authority/`](campaign-pov-authority/)에서 봅니다. [`tw-ck3-structure.architecture.html`](tw-ck3-structure.architecture.html)과 [`tw-ck3-turn.workflow.html`](tw-ck3-turn.workflow.html)은 이전 구조·전략 턴 청사진으로 보존하며 시간 기반 이동을 대체하지 않습니다. 이 폴더의 도식은 실제 게임 렌더가 아닙니다.

서울 전체 지도와 개막 영토는 [서울:전국 공식 위키](https://seoul-dengoku.linalab.io/wiki/world/World-and-Subway-Layers)에서 확인합니다.
