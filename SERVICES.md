# SERVICES.md — 서비스 레이어 계약

배포 사이트 `https://seoul-kenshi.vercel.app`의 구성 계약. 루트 `/`는 서비스 인덱스(`index.html`)이고, 각 서비스는 루트 바로 아래 자기 디렉터리 서브 경로로 열린다.

## 현재 구성

| 서브 경로 | 저장소 출처 | 비고 |
|---|---|---|
| `/` | `index.html` | 서비스 인덱스(허브) |
| `/ui-layout-moodboard/` | `ui-layout-moodboard/` | UI 레이아웃 무드보드. 2026-09-11 작성, 2026-09-12 루트로 승격 |
| `/portrait-demo/` | `web/portrait-demo/` | 애니메 풍 초상 레이어 합성 브라우저 재현. 정적 페이지, 런타임 아님 |
| `/design/` `/world/` `/rules/` | `docs-site/`(VitePress 빌드) | 문서 사이트 영역 |
| 대기: `system-design/` | 루트 `system-design/` | 소유자 큐레이션 후 편입 |

## 등록 기준

- 루트 바로 아래 자기 디렉터리 하나 + 자립형 `index.html`(외부 의존 없이 로컬에서 열림).
- 이미지는 실제 산출물(동결 캡처·구현 캡처·위키 자산)만. 새로 그린 삽화·AI 생성 이미지 금지.
- 금지 공개 용어 기준은 `tools/wiki/build-wiki.mjs`와 동일 — 가시 텍스트 대상.
- 문서 산출은 patina 오프라인 게이트(`--score --offline`) 통과 후 커밋.
- 등록 시 이 문서 표와 `index.html` 허브 카드에 함께 올린다.

## 동일 도메인 원칙

사용자에게 제공하는 주소는 `https://seoul-kenshi.vercel.app` 아래로 통일한다. 별도 Vercel 프로젝트를 만들지 않는다. `portrait-demo` 같은 이름만 비슷한 기본 별칭을 배포 완료 주소로 안내하지 않는다.

Vercel 프로젝트는 기존 `seoul-kenshi` (`prj_KOgAaJkJZ7j3CrUD1eAzYtiGV5mm`, scope `makcha1`)만 쓴다. 워크트리 루트나 `web/portrait-demo/`에서 `vercel deploy`로 새 프로젝트를 링크하지 않는다. 정적 데모는 아래 복합 스테이징으로 허브 서브 경로에 올린다.

서울켄시의 기존 접근 보호 설정은 유지한다.

## 배포 절차 (복합 스테이징)

```bash
STAGE=$(mktemp -d /tmp/seoul-kenshi-stage.XXXXXX)
mkdir -p "$STAGE/docs-site" "$STAGE/.vercel"
cp -R docs-site/dist "$STAGE/docs-site/dist"       # 기존 문서·리소스 전체
cp index.html "$STAGE/docs-site/dist/index.html"  # 루트는 서비스 허브
cp -R ui-layout-moodboard "$STAGE/docs-site/dist/"
cp -R web/portrait-demo "$STAGE/docs-site/dist/portrait-demo"
rm -rf "$STAGE/docs-site/dist/portrait-demo/.vercel"
cp .vercel/project.json "$STAGE/.vercel/project.json"
cp vercel.json "$STAGE/vercel.json"
cd "$STAGE" && npx --yes vercel@59.16.0 deploy --yes --scope makcha1
```

주의 — `docs-site/dist`나 `web/portrait-demo`를 단독으로 배포하면 허브와 다른 서비스 경로가 사라지거나 새 Vercel 프로젝트가 생긴다. 이 복합 절차를 따른다. 프로덕션(`--prod`)은 소유자가 명시할 때만.
