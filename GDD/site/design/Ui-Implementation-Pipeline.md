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

이 표는 현재 보드의 목록입니다. 여기에 없는 화면을 이 문서에서 새로 만들지 않습니다.

출격 단계의 세계 규칙은 [출격하고 돌아오는 흐름](/rules/Campaign-Loop), 런타임 화면 책임은 [유니티 구조](/rules/Unity-Architecture)에서 이어집니다.
