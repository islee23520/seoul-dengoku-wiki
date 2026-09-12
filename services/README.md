# services/ — 서비스 레이어

이 저장소가 내보내는 대화형 HTML 표면을 모으는 곳이다. 무엇이 등록되는지는 소유자가 큐레이션한다.

## 등록 기준

- 하위 디렉터리 하나에 자립형 `index.html`(외부 의존 없이 로컬에서 열림).
- 이미지는 실제 산출물(동결 캡처·구현 캡처·위키 자산)만. 새로 그린 삽화·AI 생성 이미지 금지.
- 금지 공개 용어 기준은 `tools/wiki/build-wiki.mjs`와 동일 — 가시 텍스트 대상.
- 문서 산출은 patina 오프라인 게이트(`--score --offline`) 통과 후 커밋.

## 등록 방법

1. 하위 디렉터리로 추가하고 이 목록에 한 줄 넣는다.
2. index.html 목록 카드에도 올린다 — 하위 서비스는 /services/<이름>/ 서브 경로로 열린다.
3. main에 직접 커밋·푸시한다(소유자 상시 지시).

## 등록됨

- **ui-layout-moodboard/** — UI 레이아웃 영역별 무드보드. 2026-09-11 작성, 검증 증거는 `screenshots/`. 원래 `docs/verification/ui-layout-moodboard-20260911/`에 있었다.

## 대기 (소유자 큐레이션 대기)

- `system-design/` (현재 루트) — 시스템 설계 인터랙티브 보고서. Vercel `/system-design/`으로 배포 중이라 이동 시 재배포 필요.
- `docs-site/` — lore-html-service 계획(`.omo/plans/lore-html-service.md`)의 VitePress 문서 사이트. 실행은 별도 증분.
