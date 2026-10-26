# PROJECT KNOWLEDGE BASE

**Generated:** 2026-10-22
**Snapshot:** 3f870385451b 기준 초안; 현재 경로·계약은 아래 정본 문서와 구현을 확인한다.

## OVERVIEW
서울 내부 세계를 다루는 대전략·TRPG 기반 CRPG 위키다. SQLite 저작 정본과 승인된 공개 투영을 React 18·Vite·TypeScript 화면, Node API, SQLite 조회 계층이 소비한다.

## STRUCTURE
```text
seoul-dengoku-wiki/
├── WORLD_BUILDING_GUIDE.md  # 현행 집필·승인 기준
├── lore/                   # SQLite 논리 문서의 도메인 지침
├── src/                    # 화면과 generated/·generated-private/ 투영
├── scripts/                # 승인·생성·조회·검증 파이프라인
├── server/                 # 읽기 전용 공개 JSON·문서 API
├── deploy/                 # 외부 owner 호출과 배포 계약
├── data/                   # 지리 입력·갱신 기록·공개 정본 DB
├── public/                 # 공개 생성 JSON과 이미지·정적 asset 혼재
├── snapshots/build-inputs/ # 외부 commit/hash 고정 입력
├── assets/                 # 문장 모티프 JSON·SVG 원본
├── docs/                   # 운영 계약과 날짜별 검토 기록
└── .omo/                   # 비공개 작업·증거·임시 자료
```
- `public/`, `src/generated/`, `src/generated-private/`: `npm run generate`로 공개 승인 검사 후 재생성한다.
- `data/canonical/wiki-cast.sqlite`가 저작 정본이다. `cast:build`는 checkout 밖 새 경로로 export하며 정본 덮어쓰기를 거부한다.
- `snapshots/build-inputs/`: 고정 입력이며 `npm run generate`의 소비 대상이다. 이 명령이 외부 원본을 다시 수집한다고 해석하지 않는다.
- `.omo/`: 공개 배포 제외. `/init-deep`는 지침·snapshot 갱신 진입점이며 `init-deep/{reports,digests}`는 완료 후 제거한다.

## WHERE TO LOOK
| 작업 | 위치 | 경계 |
| --- | --- | --- |
| 세계관 집필·검토 | `WORLD_BUILDING_GUIDE.md`, `lore/AGENTS.md` | 현행 승인본 우선 |
| Atlas 본문 투영 | SQLite 논리 ID `lore/World-Narrative-Atlas.json`, `scripts/world-atlas-render.mjs` | 정본 편집은 `lore/AUTHORING-JSON.md` 준수 |
| 인물 신원·등록 | `lore/characters/Cast-Profile-Contract.md`, `lore/name-pools/AGENTS.md` | SQLite 논리 원장과 공개 본문 구분 |
| 작위·보유권 | `lore/regions/AGENTS.md`, `scripts/cast-sqlite/README.md` | 논리 ID·정치 ID·지리 작위 분리 |
| 화면·라우팅 | `src/main.tsx`, `src/App.tsx`, `src/AGENTS.md` | BrowserRouter basename `/wiki` |
| 기사 본문 | `src/pages/ArticlePage.tsx`, `src/documentApi.ts` | 문서 API의 locale별 blocks; 생성 catalog는 탐색 metadata |
| 공개 생성·승격 | `scripts/generate-release.mjs`, `scripts/AGENTS.md` | stage·journal·publication admission |
| 인물 DB | `scripts/cast-sqlite/AGENTS.md` | schema 5, typed read-only reader |
| 비공개 문서·승인 | `scripts/document-store/AGENTS.md` | private store·receipt·pinned reader |
| HTTP API | `server/wiki-api.mjs`, `server/wiki-document-api.mjs` | 후자는 `WIKI_DOCUMENT_DB` 필수 |
| 배포·허용 산출물 | `deploy/README.md`, `artifact-allowlist.json` | 외부 owner가 release·rollback 수행 |

## CODE MAP
현재 심볼 위치·호출자는 LSP와 구현에서 확인한다. 과거 스캔의 줄 번호·참조 수는 현재 계약이 아니다.

| 영역 | 현재 구현 |
| --- | --- |
| SQLite 문서 list/read/edit | `scripts/cast-sqlite/document-cli.mjs` |
| 공개 정본 검증 | `scripts/cast-sqlite/current-authority.mjs` |
| 관계 검증 | `lore/relations/validate.mjs` |
| 지도 transport | `src/components/mapBridge.ts` |
| 공개 인물 상세 | `src/pages/PersonDetailPage.tsx` |
| 편집 초안 adapter | `scripts/inkos-adapter/README.md` |

## CONVENTIONS
- Vite base는 `/wiki/`, `@`는 `src`, dev port는 5174다. `/wiki/api/documents`는 8788, 나머지 `/wiki/api`는 8787로 proxy한다.
- 공개 문서 저작은 SQLite-first다. `.json` 이름은 DB 논리 ID이며 공개 JSON은 생성물이다. 편집 절차는 `lore/AUTHORING-JSON.md`를 따른다.
- `@seoul-dengoku/document-renderer`, `@seoul-dengoku/shared-web-ui`는 `vendor/*.tgz` 의존성이다.
- `vendor/seoul-dengoku-inkos`는 소유자의 InkOS 포크 서브모듈이다. `npm run inkos:install`로 고정 commit을 pnpm 10으로 설치·빌드하고 `npm run inkos -- --help`로 실행한다. 별도 작업 디렉터리에서 별도 프로세스로 사용하며 공개 정본·비공개 DB를 읽거나 쓰도록 연결하지 않는다. `scripts/inkos-adapter/README.md`의 후보 전용·읽기 전용 경계는 그대로 유지한다. 위키 검사·생성·배포 입력에 포크를 포함하지 않는다.
- 테스트 스위트는 제거되었다(2026-10-26 소유자 결정). 데이터 검증은 `npm run cast:verify`와 `npm run generate` 게이트가 담당한다.
- 아래 기존 소유자 정책은 원문 그대로 유지하며 계속 적용한다.

- 세계관·인물·세력·무공·아이템·대사·위키를 작성·수정·검토하기 전에 [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md)를 끝까지 읽는다. 이 지침은 이 저장소의 집필·기여 표면에 적용하며, 최신 사용자·디렉터 지시와 승인 상태를 함께 대조한다. 무공 분류는 그 가이드와 명명 원장의 승인본을 따르고, 옛 여덟 유파·여섯 분류·현장 별칭 문장으로 되돌리지 않는다.
- Work on a dedicated branch and deliver changes through a pull request to `main`; the owner alone merges it.
- Use Korean conventional-commit messages for independently verified changes.
- Do not push directly to `main` or rewrite shared history.
- 재사용성이 불가능한 테스트 스크립트는 작성하지 않는다. 데이터 이관은 먼저 완료한 뒤 이관 결과를 검토하며, 기존 검증 도구를 우선 사용한다.
- 미정 항목은 AI가 원천·기존 설정·외부 자료를 적극 조사해 근거와 구체적인 후보를 마련하고, 사용자 판단이 필요한 부분은 질문해 끝까지 확정한다. 미정으로 표시하거나 최종 보고에 나열하는 것만으로 완료하지 않으며, 답변 전에는 후보를 승인된 설정으로 기록하지 않는다.

## ANTI-PATTERNS
- soul·역사 모티브·증거 원천·`src/generated-private/`를 공개 JSON·asset·번들에 포함하지 않는다.
- DB 무결성·현재성·원천 품질·owner approval·publication admission을 서로 대신하지 않는다. `published`, `source_present`, `issued`만으로 공개 승인을 추론하지 않는다.
- `generate-catalog.mjs`를 live 출력 대체 진입점으로 사용하지 않는다. 정식 generate/build 경계는 `generate-release.mjs`다.
- 과거 editorial 기록·외부 범위 자료·문서의 완료 체크박스를 현재 canon이나 승인 근거로 자동 승격하지 않는다.
- MongoDB 파생 조회물을 역방향으로 편집해 lore 원천에 반영하지 않는다.

## UNIQUE STYLES
- 인물 수치 계약의 논리 ID는 `lore/editorial/Character-System-Contract.json`이다. 비공개 editorial·Soul DB는 `WORLD_BUILDING_GUIDE.md`의 별도 경로를 따른다.
- 정치 ID·정치 세력·지리 왕국·작위 보유권은 서로 다른 계약이며 자동 대응시키지 않는다.
- 기사 본문은 문서 API에서 slug·locale별 blocks를 받아 렌더한다. 생성된 `wikiCatalog`·`wikiEnglishCatalog`는 문서 선택·언어 전환용 metadata이며 본문 로딩 경로와 별개다.

## COMMANDS
검사별로 생성 카탈로그·dist·비공개 승인 원천이 필요할 수 있다. 아래 명령의 존재가 공개 checkout만으로 전부 통과함을 뜻하지 않는다. 로어 schema 검사는 Python `jsonschema`도 필요하다.
```bash
npm ci --ignore-scripts
npm run dev
npm run generate
npm run build
npm run cast:build -- --output /tmp/wiki-cast-new.sqlite
npm run cast:verify -- --db data/canonical/wiki-cast.sqlite
npm run check:artifacts
node server/wiki-api.mjs
```

## NOTES
- release lock은 Python `fcntl.flock`을 사용한다. Windows에서 generate/build의 즉시 실행 가능성을 단정하지 않는다.
- release lock은 협조하는 generate/build만 보호한다. 생성 중 dev·직접 tsc/vite reader를 중지한다.
- cast-sqlite는 Node.js >=24.15.0이 필요하다. export는 checkout 밖 아직 없는 경로만 허용하며 SQLite 정본을 재빌드 교체하지 않는다.
- Woodpecker 배포는 현재 Node 26을 사용한다. 버전 변경 시 현행 workflow를 확인한다.
- build/gate는 MongoDB 없이 동작한다. API 기본값은 `PORT=8787`, `HOST=0.0.0.0`, `DATA_DIR=public/`다.
