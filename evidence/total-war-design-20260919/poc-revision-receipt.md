# 8개 POC·UI 참조 정합성 개정 영수증

검증일: 2026-09-19

## 개정 범위

| 경로 | 최종 역할 |
|---|---|
| `GAME-REFERENCE/poc/` | 현재 계약과 역사 POC를 구분하는 상위 지침 |
| `GAME-REFERENCE/poc/browser/` | 현재 목표 허브와 2026-09-07 실행 POC 기록 |
| `GAME-REFERENCE/poc-diegetic/` | 3D 자유 지휘 다이제틱 HUD 청사진과 카드·격자 역사 |
| `GAME-REFERENCE/poc-plan/` | 캠페인→편성→조우→배치→지휘→종료→결과→다음 행선 설계 계획 |
| `GAME-REFERENCE/portrait-demo/` | 애니메이션풍 정비율 영웅 목표와 기존 합성 표본 역사 |
| `GAME-REFERENCE/ui-layout-moodboard/` | 부대 지휘 정보구조와 기존 무드 이미지 구분 |
| `GAME-REFERENCE/ui-ux-refs/` | 외부 참조 사실과 서울:전국 채택 결론 분리 |
| `GAME-REFERENCE/codex-ux-refs/` | 내부 전용 목표 화면 흐름, 공개·배포 금지 |

## 공통 계약

- 실시간 토탈워식 부대 지휘
- 이름 있는 영웅은 병졸 수에서 제외되는 별도 지휘 인물
- 병졸 한 분대 최대 20명
- 영웅 직접 액션, 카드 자원·드로우·재충전, 옛 4방향 격자, 강제 귀환은 목표가 아님
- 기존 인물 중심 캠페인과 `ResultId` 정확히 한 번 반영 유지
- 목표 인물 미술은 애니메이션풍 정비율
- 과거 카드·격자·사이드스크롤·SD·합성 표본은 날짜가 있는 POC 역사로 보존

## 검증

- browser JS 모델 특성화 테스트: 변경 전 30/30, 변경 후 30/30
- browser `SHA256SUMS`: 변경 전 9개 불일치 RED, 갱신 후 전 항목 GREEN
- 변경 HTML LSP: 오류 0
- 변경 Markdown patina 오프라인: 모든 파일 30 미만
- 대표 데스크톱 Aside Browser: 7개 진입 페이지에서 현재 계약 또는 역사/현재 경계를 확인
- 변경된 HTML 13개 전수 데스크톱 Aside Browser: `HTML_QA_PASS` 13건, 404·필수 계약 누락 0
- `codex-ux-refs`: 화면에 `INTERNAL DESKTOP REFERENCE · UNPUBLISHED`와 게시 금지 표시, 공개 배포 목록에는 추가하지 않음

## 화면 증거

변경 전: `screenshots/poc-baseline-*.png`

변경 후:

- `screenshots/poc-final-poc-browser.png`
- `screenshots/poc-final-poc-diegetic.png`
- `screenshots/poc-final-poc-plan.png`
- `screenshots/poc-final-portrait-demo.png`
- `screenshots/poc-final-ui-layout-moodboard.png`
- `screenshots/poc-final-ui-ux-refs.png`
- `screenshots/poc-final-codex-ux-refs.png`

검증 탭은 각 호출에서 닫았다. 프로젝트 규칙에 따라 멀티 플랫폼 지원 기능은 구현·검증하지 않았다.

최종 전수 확인 제목:

- 브라우저 레퍼런스 색인
- 역사 지휘관 카드·아바타 POC
- 실시간 분대 전투 검토용 POC
- 진형 편집 검토용 POC
- 회수 캠페인 통합 POC
- 목표 지휘 청사진과 다이제틱 POC 역사
- 목표 설계 계획 / POC 역사
- 목표 인물 표현과 역사 POC 초상 합성
- UI 레이아웃 설계 무드보드와 목표 부대 지휘 문서 시연
- UI/UX 레퍼런스와 목표 합성 목업 / 역사 POC
- 미게시 목표 화면 흐름
