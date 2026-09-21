# SERVICES.md — 서비스 레이어 계약

배포 표면의 구성 계약. 각 서비스는 루트 바로 아래 자기 디렉터리 서브 경로로 열린다. 2026-09-19 확인한 루트 `/`는 서울:전국 공식 위키다. 저장소의 이전 허브 `index.html`로 현재 루트를 덮어쓰지 않는다. GitHub Wiki는 유지하지 않는다. 정본은 `GDD/`와 `LORE/`에 두고, VitePress 파생 문서는 `npm --prefix WEB/wiki-source run docs:dev`로 확인한다. 루트 `SOCIAL-MEDIA/`는 운영자 연재 계약이며 허브 서브 경로로 올리지 않는다.

## 배포 표면 (2026-09-18 전환)

| 표면 | 상태 |
|---|---|
| `https://seoul-dengoku.linalab.io` | 정식 표면. 윈도우 호스트(desktop, Tailscale) `E:\git\seoul-dengoku-web`의 docker compose — nginx(정적 번들, `127.0.0.1:8080`) + cloudflared(Cloudflare Tunnel `seoul-dengoku`). Cloudflare Access 이메일 화이트리스트가 입장 게이트다(컨트리뷰터 전용). DNS 연결은 게이트 완료 후. |
| `https://seoul-kenshi.vercel.app` | 구 표면. 전환 검증 후 Vercel 프로젝트(`seoul-kenshi`)를 제거한다. 그 전까지 읽기 전용으로 유지. |

### 자체 호스팅 표면 갱신 절차

배포는 `TOOL/tools/deploy/`의 Docker 도구가 소유한다. 위키나 등록 페이지를 수동으로 복사하지 않는다.

```bash
# Docker 안에서 정본 재생성·게이트·전체 허브 스테이징만 수행
npm --prefix TOOL/tools run deploy:hub:build

# 같은 Docker 빌드 후 Windows Docker/nginx에 원자 배포하고 실서버 검증
npm --prefix TOOL/tools run deploy:hub -- --host oliver@100.77.98.25
```

1. 저장소는 Docker에 읽기 전용으로 마운트된다. 컨테이너가 별도 작업 사본을 만들고 `mount.mjs`, `build-world-index.mjs`, VitePress 빌드·게이트, React 빌드·232문서 계약·링크 게이트를 실행한다.
2. `TOOL/tools/deploy/hub-pages.json`이 `/play/`, `/system-design/`, `/ui-layout-moodboard/`, `/portrait-gen/`, `/ui-ux-refs/`, `/design-store/`의 소스와 필수 진입 파일을 선언한다. 페이지를 추가하거나 옮길 때는 이 파일만 갱신한다.
3. 산출물은 `.omo/deploy/hub/`의 `seoul-dengoku-site.tar`, `deployment-manifest.json`, SHA-256, nginx·Windows 배포·검사 파일이다. `.omo/`는 계속 untracked다.
4. Windows에서는 `site-next`를 검증한 뒤 `site`와 원자 교체하고 Docker nginx를 재시작한다. 배포 후 232개 공식 위키 문서·호환 URL·회귀 URL과 등록 페이지 전부를 localhost:8080에서 검사한다.

### main 자동 배포

GitHub `main`에 새 커밋이 push되면 `.github/workflows/deploy-windows-hub.yml`이 `desktop-bo514et-seoul-dengoku` self-hosted Windows runner를 깨운다. 같은 workflow는 `workflow_dispatch` 수동 실행도 지원하며 `seoul-dengoku-windows-production` concurrency 그룹으로 배포를 직렬화한다.

- 러너 설치 위치: `E:\git\github-runner-seoul-kenshi`
- 러너 작업공간: 설치 폴더 아래 `_work` — 사람 작업용 저장소와 분리한다.
- 배포 위치: `E:\git\seoul-dengoku-web`
- 빌드·배포 진입점: `TOOL\tools\deploy\deploy-hub-local-windows.ps1`
- 검증: Docker 전체 빌드, manifest 검사, 원자 승격, nginx readiness, React 전체 문서 HTTP 검사
- 실패: 기존 `site`로 rollback하고 workflow를 실패로 종료한다.

러너를 다시 등록할 때는 GitHub 저장소 Settings → Actions → Runners의 일회용 토큰을 받아 관리자 PowerShell에서 실행한다.

```powershell
./TOOL/tools/deploy/setup-github-runner-windows.ps1 `
  -RepositoryUrl 'https://github.com/islee23520/seoul-dengoku' `
  -RegistrationToken '<one-time token>'
```

## 현재 구성

| 서브 경로 | 저장소 출처 | 비고 |
|---|---|---|
| `/` | 현재 배포된 공식 위키 | 이전 허브 `index.html`로 덮어쓰지 않음 |
| `backend`(로컬 개발·미배포) | `Backend/server`(.NET 8) | 호스트 세션 코디네이터. Kestrel 1219 하나로 HTTP REST + WebSocket 릴레이, 외부 저장소 없음. 2026-09-18 |
| `/play/` | `GAME/play/` | 코어 루프 웹 POC. 2026-09-14. 자립형 HTML |
| `/ui-layout-moodboard/` | `GAME-REFERENCE/ui-layout-moodboard/` | UI 레이아웃 무드보드. 2026-09-11 작성, 2026-09-12 루트로 승격 |
| `/portrait-gen/` | `TOOL/portrait-gen/` | 애니메 풍 초상 제작·큐레이션 브라우저와 `.omo/evidence` SQLite 자산 SSoT. 정적 도구, 런타임 아님 — 스테이징: `node TOOL/portrait-gen/tools/portrait/stage-potrait-generator.mjs` |
| `/system-design/` | `GDD/system-design/` | 시스템 구조 보고 HTML |
| `/total-war-ui/` | `GDD/system-design/total-war-ui/` | 토탈워식 부대 지휘와 애니메이션풍 정비율 방향의 UI/UX 설계 템플릿. 게임 런타임·오드랜드 POC와 별개 |
| `/design-store/` | `GDD/design-store/` | MDA 시트 + LORE 정본 전량. SQLite에서 렌더한 HTML |
| `/ui-ux-refs/` | `GAME-REFERENCE/ui-ux-refs/` | UI/UX 레퍼런스 취합. 이슈 #101. 2026-09-14 |
| `/design/` `/world/` `/rules/` | `WEB/wiki/` + 정본 `GDD/`·`LORE/` | React 공식 위키 셸. VitePress는 정본 렌더·링크 품질 게이트에 사용 |

## 등록 기준

- 루트 바로 아래 자기 디렉터리 하나 + 자립형 `index.html`(외부 의존 없이 로컬에서 열림).
- 이미지는 실제 산출물(동결 캡처·구현 캡처·위키 자산)만. 새로 그린 삽화·AI 생성 이미지 금지.
- 금지 공개 용어 기준은 `TOOL/tools/wiki/build-wiki.mjs`와 동일 — 가시 텍스트 대상.
- 문서 산출은 patina 오프라인 게이트(`--score --offline`) 통과 후 커밋.
- 등록 시 이 문서 표에 경로를 남긴다. 탐색 링크는 현재 공식 위키의 배포 원본과 함께 갱신하며, 다른 세션의 미완료 프런트엔드를 임의로 수정하거나 이전 허브를 되살리지 않는다.
