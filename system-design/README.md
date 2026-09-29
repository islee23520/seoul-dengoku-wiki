# 시스템 구조 보고

게임 디자인(`GDD/`)의 시스템 설계 도식을 모은 읽기 전용 폴더입니다. 제품 코드가 아닙니다.

부대 지휘 화면 초안은 [`total-war-ui/`](total-war-ui/)입니다. 이 초안은 2026-09-28 결정 13(노랜드식 개인 판정 전투) 이전의 토탈워식 부대 지휘 화면이며, 교전 전 분대 지시·자동/수동 전투 선택·근접 교전 중 명령 잠금·전투 단위 후퇴에 맞춘 재작성은 아직 하지 않았습니다. 전투 카메라는 2026-09-24 소유자가 확정한 3D 자유 지휘 시점이고, 전투에는 일시정지와 감속·배속이 없습니다. 노드별 상태와 그 흐름은 [`gdd-lore-node-states.lifecycle.html`](gdd-lore-node-states.lifecycle.html)과 [`gdd-lore-node-states.json`](../canon/locales/ko-KR/system-design/gdd-lore-node-states.json) 표에서 봅니다. 뷰어 UI는 영어 폴백입니다. 캠페인 POV·권한 전이 청사진은 [`campaign-pov-authority/`](campaign-pov-authority/)입니다. TW 전략·전투와 CK3 인물 정치를 합친 층 구조는 [`tw-ck3-structure.architecture.html`](tw-ck3-structure.architecture.html), 한 전략 턴의 순서는 [`tw-ck3-turn.workflow.html`](tw-ck3-turn.workflow.html)에서 봅니다. 그 도식들은 실제 게임 렌더가 아닙니다.

서울 전체 지도와 개막 영토는 [서울:전국 공식 위키](https://seoul-dengoku.linalab.io/wiki/world/World-and-Subway-Layers)에서 확인합니다.
