# POC·UI 참조 개정 전 기준선

확인일: 2026-09-19

사용자가 다음 8개 경로를 최신 게임플레이 정합성 개정 대상으로 지정했다.

- `GAME-REFERENCE/poc/`
- `GAME-REFERENCE/poc/browser/`
- `GAME-REFERENCE/poc-diegetic/`
- `GAME-REFERENCE/poc-plan/`
- `GAME-REFERENCE/portrait-demo/`
- `GAME-REFERENCE/ui-layout-moodboard/`
- `GAME-REFERENCE/ui-ux-refs/`
- `GAME-REFERENCE/codex-ux-refs/`

## 기계 기준선

`GAME-REFERENCE/poc/browser/**/*.test.js` 5파일을 `node --test`로 실행했다. 기존 카드·4방향 진형·아바타 명령 카드 계약에서 30개 테스트가 통과했다. 이 통과는 최신 제품 정합성을 증명하지 않고, 변경 전 동작을 고정하는 특성화 기준선이다.

## 실제 데스크톱 기준선

Aside Browser로 대표 진입 페이지를 열고 캡처했다. 기존 화면에는 카드 슬롯·4방향 대형·사이드스크롤 전투·실사 또는 반실사 초상·과거 채택 문구가 현재 POC처럼 보이는 부분이 있다.

- `screenshots/poc-baseline-poc-browser.png`
- `screenshots/poc-baseline-poc-diegetic.png`
- `screenshots/poc-baseline-poc-plan.png`
- `screenshots/poc-baseline-portrait-demo.png`
- `screenshots/poc-baseline-ui-layout-moodboard.png`
- `screenshots/poc-baseline-ui-ux-refs.png`
- `screenshots/poc-baseline-codex-ux-refs.png`

모든 기준선 탭은 같은 호출에서 닫아 `CLEANUP_POC_BASELINE_TABS_CLOSED`를 확인했다. 프로젝트 규칙에 따라 멀티 플랫폼 지원은 구현·검증하지 않는다.

`codex-ux-refs`는 내용 개정 대상이지만 기존 정책대로 공개 배포 대상이 아니다.
