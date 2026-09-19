# Archify UI/UX·와이어프레임 검증

검증일: 2026-09-19

## 산출물

| 역할 | JSON | HTML | Archify 결과 |
|---|---|---|---|
| 제품 흐름 | `flow.json` | `flow.html` | 기존 캠페인·전투 왕복 |
| UX 상태 전이 | `ux-flow.json` | `ux-flow.html` | standard 9/9, 오류 0, 경고 0 |
| 데스크톱 와이어프레임 | `wireframes.json` | `wireframes.html` | standard 9/9, 오류 0, 경고 0 |

UX 상태 전이 JSON SHA-256은 `5014e539e8e5fe201b7d420e46d61ca5036bbf7c81349f0cfdab26de51655361`, HTML은 `fef36fa92b4a345d49c9706470f8e2c55f6620a862f0cd6c2d82c5e5c26b8148`이다.

와이어프레임 JSON SHA-256은 `38da335f169e3b410d1fc2ba33f7333f12edddacc820c777482f628af859af38`, HTML은 `d44ffd7009e75e07e2e01cd86cf0674086dfcea9e0b42248a9b9468e4aab649d`이다.

## 설계 내용

UX 상태 전이는 원정 경로, 파티 편성, 조우 대응, 전투 배치, 부대 지휘, 종료 확인, 결과 영수증과 다음 행선을 다룬다. 종료 취소는 전투 상태로 돌아가고, 결과는 `ResultId`로 한 번만 반영하며 원정을 계속할 수 있다.

와이어프레임은 공통 헤더·화면 탭, 캠페인/편성 패널, 배치 도식, 주 전장, 선택·명령 패널, 종료 확인 오버레이, 결과·다음 행선 패널의 공간 배치를 보여 준다. 영웅은 병졸 수에서 제외하고 병졸 분대는 최대 20명으로 표기한다. 카드 자원과 영웅 직접 액션 UI는 없다.

## 실제 데스크톱 검토

Aside Browser에서 `index.html`, `ux-flow.html`, `wireframes.html`을 각각 열어 접근성 트리와 실제 렌더를 확인했다. 기존 UI에는 세 Archify 문서 진입 링크가 보인다. UX 흐름과 와이어프레임의 핵심 라벨이 읽히고 패널 겹침이나 잘린 주요 텍스트가 없다.

- `screenshots/archify-ux-flow.png`
- `screenshots/archify-wireframes.png`

검증 탭은 같은 호출에서 닫았고 `CLEANUP_ARCHIFY_DESIGN_TABS_CLOSED`를 확인했다. 임시 서버를 종료했으며 TCP 4319는 비어 있다. 프로젝트 규칙에 따라 멀티 플랫폼 지원은 구현·검증하지 않았다.
