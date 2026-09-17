# SERVICES.md — 서비스 레이어 계약

배포 사이트 `https://seoul-kenshi.vercel.app`의 구성 계약. 루트 `/`는 서비스 인덱스(`index.html`)이고, 각 서비스는 루트 바로 아래 자기 디렉터리 서브 경로로 열린다.

## 현재 구성

| 서브 경로 | 저장소 출처 | 비고 |
|---|---|---|
| `/` | `index.html` | 서비스 인덱스(허브) |
| `backend`(로컬 개발·미배포) | `Backend/server`(.NET 8 CoreWCF) | 소셜 SNG 백엔드. 도커 MySQL(13306)·Redis(16379), 포트 1219. 2026-09-14 |
| `/play/` | `Game/play/` | 코어 루프 웹 POC. 2026-09-14. 자립형 HTML |
| `/ui-layout-moodboard/` | `Design/ui-layout-moodboard/` | UI 레이아웃 무드보드. 2026-09-11 작성, 2026-09-12 루트로 승격 |
| `/potrait-generator/` | `Design/potrait-generator/` | 애니메 풍 초상 제작·큐레이션 브라우저와 `.omo/evidence` SQLite 자산 SSoT. 정적 도구, 런타임 아님 |
| `/system-design/` | `GDD/system-design/` | 시스템 구조 보고 HTML |
| `/system-design/regions/` | `GDD/system-design/regions/` | 서울 25구·427동 지역 총람. 2026-09-13 |
| `/design-store/` | `GDD/design-store/` | MDA 시트 + Wikis/game-logic 정본 전량. SQLite에서 렌더한 HTML |
| `/ui-ux-refs/` | `Reference/ui-ux-refs/` | UI/UX 레퍼런스 취합. 이슈 #101. 2026-09-14 |
| `/design/` `/world/` `/rules/` | `Wikis/site/`(VitePress 빌드) | 문서 사이트 영역 |

## 등록 기준

초상 도구 스테이징: `node Tool/art/portrait/stage-potrait-generator.mjs`.
이 명령은 허브의 다른 서비스를 보존하고 `/potrait-generator/` 브라우저 파일만 복사한다.
`raw/`, `data/`(SQLite), `work/`, `cache/`, `config/`, `views/`는 공개 배포에서 제외한다.
기존 초상 데모 경로는 유지하거나 리다이렉트하지 않는다.

- 루트 바로 아래 자기 디렉터리 하나 + 자립형 `index.html`(외부 의존 없이 로컬에서 열림).
- 이미지는 실제 산출물(동결 캡처·구현 캡처·위키 자산)만. 새로 그린 삽화·AI 생성 이미지 금지.
- 금지 공개 용어 기준은 `Tool/wiki/build-wiki.mjs`와 동일 — 가시 텍스트 대상.
- 문서 산출은 patina 오프라인 게이트(`--score --offline`) 통과 후 커밋.
- 등록 시 이 문서 표와 `index.html` 허브 카드에 함께 올린다.
