# UI가 코드로 들어오는 길

화면은 유니티에서 시작하지 않습니다. HTML 목업에서 레이아웃·안정 이름을 먼저 고정한 뒤, 같은 계약을 uGUI Canvas로 옮깁니다.

## 짧은 경로

1. 목업에서 화면을 그린다.
2. 플레이어가 보는 이름과 단계를 고정한다.
3. `UguiHudBuilder`가 Canvas와 `UiElementNames`를 만든다.
4. EditMode가 이름·구조를 검사하고, PlayMode 캡처가 영수증을 남긴다.

유니티에서 빈 Canvas를 먼저 열고 나중에 이름을 맞추지 않습니다.

## 플레이어가 지나가는 화면

| # | 화면 | 안정 이름 |
|---|---|---|
| 0 | 타이틀 | `main-title-start` |
| 1 | 거점 준비 | `stage-base-prep` |
| 2 | 원정 | `stage-expedition` |
| 3 | 조우 | `stage-encounter` |
| 4 | 해결 | `stage-resolution` |
| 5 | 진형 | `formation-edit` |
| 6 | 전투 | `battle-dock` |
| 7 | 정산·복귀 | `settlement-panel` |

이 표는 **현재 Unity 보드 8칸**의 목록입니다. #101의 12면 및 사망·후계
보조 목업은 제품 화면 설계 범위이며, 이 표에 칸을 추가하거나 현재 요소
이름을 바꾸는 뜻이 아닙니다. `출격 인원 선택`은 거점 준비 맥락의 참가자 선택,
`전투 전 진형 편집`은 조우 이후 교전 전의 위치·방향 편집으로 서로 다릅니다.
신규 요소 이름의 목표 계약은 [Design §11](../../Design.md)에 기록하고,
현재 `UiElementNames` 구현 여부와 구별합니다. 12면 질문표는 [.omo/decisions/issue-101-ui-ux-decisions.md](../../.omo/decisions/issue-101-ui-ux-decisions.md)가 정본입니다. 화면이 그리는 세계는 [기동권 이탈](World-Unbinding.md) 이후 2126 서울입니다.

출격 단계의 세계 규칙은 [원정](Campaign-Loop.md), 런타임 화면 책임은 [유니티 구조](Unity-Architecture.md)에서 이어집니다.

## 보기 예

화면 문법은 웹 패널이 아니라 세계 안의 사물입니다. 2026-09-12 소유자 락. 목업과 동결 캡처는 저장소에 있습니다.

| 면 | 파일 |
|---|---|
| 무드보드 11면 | [Design/ui-layout-moodboard/index.html](../../Design/ui-layout-moodboard/index.html) |
| 동결 캡처 | `Design/ui-layout-moodboard/images/frozen/` |
| POC 10면 | [Reference/ui-ux-refs/poc-complete.html](../../Reference/ui-ux-refs/poc-complete.html) |
| 다이제틱 HUD | `Reference/ui-ux-refs/images/diegetic-hud.png` |
| 전투·진형 | `Reference/ui-ux-refs/images/battle.png`, `formation.png` |

라이브 허브 경로: `/ui-layout-moodboard/`, `/play/`. 에덴 맥북의 별도 벤치마크 원본은 이 저장소에 없습니다. 위 파일이 합의된 보기 예입니다.
