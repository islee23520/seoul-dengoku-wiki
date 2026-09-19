# SERVICES.md — 서비스 레이어 계약

배포 표면의 구성 계약. 루트 `/`는 서비스 인덱스(`index.html`)이고, 각 서비스는 루트 바로 아래 자기 디렉터리 서브 경로로 열린다. GitHub Wiki는 유지하지 않는다. 문서 정본은 `LORE/`, 로컬 열람은 `npm run docs:dev`(VitePress).

## 배포 표면 (2026-09-18 전환)

| 표면 | 상태 |
|---|---|
| `https://seoul-dengoku.linalab.io` | 정식 표면. 윈도우 호스트(desktop, Tailscale) `E:\git\seoul-dengoku-web`의 docker compose — nginx(정적 번들, `127.0.0.1:8080`) + cloudflared(Cloudflare Tunnel `seoul-dengoku`). Cloudflare Access 이메일 화이트리스트가 입장 게이트다(컨트리뷰터 전용). DNS 연결은 게이트 완료 후. |
| `https://seoul-kenshi.vercel.app` | 구 표면. 전환 검증 후 Vercel 프로젝트(`seoul-kenshi`)를 제거한다. 그 전까지 읽기 전용으로 유지. |

### 자체 호스팅 표면 갱신 절차

1. `npm --prefix GAME-LOGIC/site run docs:build` — `site/{world,rules,design}` 스테이징(mount.mjs 산출물) 기준.
2. 오버레이: 루트 `index.html`(허브)과 `GAME/play`, `GAME-REFERENCE/ui-layout-moodboard`, `GAME-REFERENCE/portrait-demo`, `GAME-REFERENCE/ui-ux-refs`, `GDD/system-design`를 dist에 사본. `design-store/`와 `hashmap.json`은 직전 dist에서 보존 이관한다(SQLite 렌더 산출물).
3. `node GAME-LOGIC/site/scripts/gate.mjs` PASS 확인.
4. tar로 묶어 `desktop:E:/git/seoul-dengoku-web/site`를 교체한다. Windows tar는 `E:` 절대경로를 원격 호스트로 오인하므로 상대경로로 푼다. macOS tar의 `._*` 파일은 제거한다. nginx는 바인드 마운트라 즉시 반영된다.

## 현재 구성

| 서브 경로 | 저장소 출처 | 비고 |
|---|---|---|
| `/` | `index.html` | 서비스 인덱스(허브) |
| `backend`(로컬 개발·미배포) | `Backend/server`(.NET 8) | 호스트 세션 코디네이터. Kestrel 1219 하나로 HTTP REST + WebSocket 릴레이, 외부 저장소 없음. 2026-09-18 |
| `/play/` | `GAME/play/` | 코어 루프 웹 POC. 2026-09-14. 자립형 HTML |
| `/ui-layout-moodboard/` | `GAME-REFERENCE/ui-layout-moodboard/` | UI 레이아웃 무드보드. 2026-09-11 작성, 2026-09-12 루트로 승격 |
| `/portrait-demo/` | `GAME-REFERENCE/portrait-demo/` | 애니메 풍 초상 레이어 합성 브라우저 재현. 정적 페이지, 런타임 아님 |
| `/portrait-gen/` | `TOOL/portrait-gen/` | 애니메 풍 초상 제작·큐레이션 브라우저와 `.omo/evidence` SQLite 자산 SSoT. 정적 도구, 런타임 아님 — 스테이징: `node TOOL/portrait-gen/tools/portrait/stage-potrait-generator.mjs` |
| `/system-design/` | `GDD/system-design/` | 시스템 구조 보고 HTML |
| `/system-design/regions/` | `GDD/system-design/regions/` | 서울 25구·427동 지역 총람. 2026-09-13 |
| `/design-store/` | `GDD/design-store/` | MDA 시트 + LORE 정본 전량. SQLite에서 렌더한 HTML |
| `/ui-ux-refs/` | `GAME-REFERENCE/ui-ux-refs/` | UI/UX 레퍼런스 취합. 이슈 #101. 2026-09-14 |
| `/design/` `/world/` `/rules/` | `GAME-LOGIC/site/`(VitePress 빌드) | 문서 사이트 영역 |

## 등록 기준

- 루트 바로 아래 자기 디렉터리 하나 + 자립형 `index.html`(외부 의존 없이 로컬에서 열림).
- 이미지는 실제 산출물(동결 캡처·구현 캡처·위키 자산)만. 새로 그린 삽화·AI 생성 이미지 금지.
- 금지 공개 용어 기준은 `TOOL/tools/wiki/build-wiki.mjs`와 동일 — 가시 텍스트 대상.
- 문서 산출은 patina 오프라인 게이트(`--score --offline`) 통과 후 커밋.
- 등록 시 이 문서 표와 `index.html` 허브 카드에 함께 올린다.
