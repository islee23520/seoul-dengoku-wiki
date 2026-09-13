# SERVICES.md — 서비스 레이어 계약

배포 사이트 `https://seoul-kenshi.vercel.app`의 구성 계약. 루트 `/`는 서비스 인덱스(`index.html`)이고, 각 서비스는 루트 바로 아래 자기 디렉터리 서브 경로로 열린다.

## 현재 구성

| 서브 경로 | 저장소 출처 | 비고 |
|---|---|---|
| `/` | `index.html` | 서비스 인덱스(허브) |
| `/play/` | `play/` | 코어 루프 웹 POC. 2026-09-14. 자립형 HTML |
| `/ui-layout-moodboard/` | `ui-layout-moodboard/` | UI 레이아웃 무드보드. 2026-09-11 작성, 2026-09-12 루트로 승격 |
| `/design/` `/world/` `/rules/` | `docs-site/`(VitePress 빌드) | 문서 사이트 영역 |
| 대기: `system-design/` | 루트 `system-design/` | 소유자 큐레이션 후 편입 |

## 등록 기준

- 루트 바로 아래 자기 디렉터리 하나 + 자립형 `index.html`(외부 의존 없이 로컬에서 열림).
- 이미지는 실제 산출물(동결 캡처·구현 캡처·위키 자산)만. 새로 그린 삽화·AI 생성 이미지 금지.
- 금지 공개 용어 기준은 `tools/wiki/build-wiki.mjs`와 동일 — 가시 텍스트 대상.
- 문서 산출은 patina 오프라인 게이트(`--score --offline`) 통과 후 커밋.
- 등록 시 이 문서 표와 `index.html` 허브 카드에 함께 올린다.

## 배포 절차 (복합 스테이징)

```bash
rm -rf /tmp/prod-stage && mkdir -p /tmp/prod-stage
cp -R docs-site/dist/. /tmp/prod-stage/          # 문서 사이트 영역
rm /tmp/prod-stage/index.html                    # VitePress 홈 제거 — 허브가 루트를 가져간다
cp index.html /tmp/prod-stage/index.html
cp -R play /tmp/prod-stage/
cp -R ui-layout-moodboard /tmp/prod-stage/       # 서비스 디렉터리들
cp -R .vercel /tmp/prod-stage/.vercel
cd /tmp/prod-stage && npx --yes vercel@59.16.0 deploy --prod --yes
```

주의 — `docs-site/dist`를 단독으로 배포하면 허브와 서비스 경로가 사라진다. 이 복합 절차를 따른다.
