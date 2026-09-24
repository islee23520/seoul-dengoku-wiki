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

이 표의 `formation-edit`·`battle-dock`·`settlement-panel`은 안정 요소 이름이며 바꾸지 않습니다. #101의 12면 및 사망·후계
보조 목업은 제품 화면 설계 범위이며, 이 표에 칸을 추가하거나 현재 요소
이름을 바꾸는 뜻이 아닙니다. `출격 인원 선택`은 거점 준비 맥락의 참가자 선택,
`전투 배치`는 조우 이후 교전 전의 참가 부대·목표·지형·퇴로·초기 배치를
잠그는 화면으로 서로 다릅니다.
신규 요소 이름의 목표 계약은 [Design §11](/design/Design)에 기록하고,
현재 `UiElementNames` 구현 여부와 구별합니다. 12면의 활성 목록과 전투 관련
재정의는 [Intent 결정 6](/design/Intent), 안정 요소 이름은 [Design §11](/design/Design)이
정본입니다. 화면이 그리는 세계는 2026년 붕괴([프롤로그](/world/World-Unbinding)) 뒤의 2126 서울입니다.

목표 12면의 10번은 `전투 배치`, 11번은 `부대 지휘`이며 문서 실물은 [부대 지휘 UI](https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/collections/system-design.json)에 둡니다. 정산 뒤에도 원정을 계속할 수 있으며 귀환은 다섯 결말 가운데 하나입니다.

정보 획득·신뢰·원장 투영·착생·포섭·사망·후계 결정을 바꾸지 않고, 뒤에 추가된 부대 지휘 권위와 충돌하는 전투 단계의 의미만 바로잡습니다. 이 문서 개정은 새 Unity 요소 이름이나 런타임 구현을 요구하지 않습니다.

그 초안의 전장 도식은 공간 배치를 설명하는 청사진이며 실제 게임 화면이 아닙니다. 전투에는 일시정지·재개와 감속·배속 칸이 없습니다(2026-09-24 소유자 결정). 명령은 전투가 흐르는 동안 미리보고 확정하며, 수락된 명령은 다음 시뮬레이션 단계에서 입력 순서대로 현재 지시를 교체합니다. 명령 큐 칸은 없습니다.

출격 단계의 세계 규칙은 [원정](/rules/Campaign-Loop), 런타임 화면 책임은 [유니티 구조](/rules/Unity-Architecture)에서 이어집니다.

## 보기 예

화면 문법은 웹 패널이 아니라 세계 안의 사물입니다. 2026-09-12 소유자 락. 목업과 동결 캡처는 저장소에 있습니다.

| 면 | 파일 |
|---|---|
| 무드보드 11면 | [ui-layout-moodboard](../GAME-REFERENCE/ui-layout-moodboard/index.html) |
| 동결 캡처 | `GAME-REFERENCE/ui-layout-moodboard/images/frozen/` |
| 다이제틱 HUD | `GAME-REFERENCE/ui-ux-refs/images/diegetic-hud.png` |
| 전투·진형 | `GAME-REFERENCE/ui-ux-refs/images/battle.png`, `formation.png` |
| 부대 지휘 목표 초안 | [system-design/total-war-ui](https://github.com/islee23520/seoul-dengoku-gdd/blob/main/canon/collections/system-design.json) |

라이브 허브 경로: `/ui-layout-moodboard/`. 에덴 맥북의 별도 벤치마크 원본은 이 저장소에 없습니다. 위 파일이 합의된 보기 예입니다.
