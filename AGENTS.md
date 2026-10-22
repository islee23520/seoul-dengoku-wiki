# PROJECT KNOWLEDGE BASE

**Generated:** 2026-10-22
**Commit / Branch:** 3f870385451b / research/s08-preview-st01a15a59

## OVERVIEW
서울 내부 세계를 다루는 대전략·TRPG 기반 CRPG 위키다. JSON 원천과 승인된 공개 투영을 React 18·Vite·TypeScript 화면, Node API, SQLite 조회 계층이 소비한다.

## STRUCTURE
```text
seoul-dengoku-wiki/
├── WORLD_BUILDING_GUIDE.md  # 현행 집필·승인 기준
├── lore/                   # Atlas·인물·정치·지리 JSON 원천
├── src/                    # 화면과 generated/·generated-private/ 투영
├── scripts/                # 승인·생성·조회·검증 파이프라인
├── server/                 # 읽기 전용 공개 JSON·문서 API
├── deploy/                 # 외부 owner 호출과 배포 계약
├── data/                   # 지리 입력·갱신 기록·로컬 정본 DB
├── public/                 # 공개 생성 JSON과 이미지·정적 asset 혼재
├── snapshots/build-inputs/ # 외부 commit/hash 고정 입력
├── assets/                 # 문장 모티프 JSON·SVG 원본
├── docs/                   # 운영 계약과 날짜별 검토 기록
└── .omo/                   # 비공개 작업·증거·임시 자료
```
- `public/`, `src/generated/`, `src/generated-private/`: `npm run generate`로 공개 승인 검사 후 재생성한다.
- `data/canonical/wiki-cast.sqlite`: `npm run cast:build`로 재빌드한다. `data/geography/`와 갱신 기록은 일괄 생성 출력이 아니다.
- `snapshots/build-inputs/`: 고정 입력이며 `npm run generate`의 소비 대상이다. 이 명령이 외부 원본을 다시 수집한다고 해석하지 않는다.
- `.omo/`: 공개 배포 제외. `/init-deep`는 지침·snapshot 갱신 진입점이며 `init-deep/{reports,digests}`는 완료 후 제거한다.

## WHERE TO LOOK
| 작업 | 위치 | 경계 |
| --- | --- | --- |
| 세계관 집필·검토 | `WORLD_BUILDING_GUIDE.md`, `lore/AGENTS.md` | 현행 승인본 우선 |
| Atlas 본문 투영 | `lore/World-Narrative-Atlas.json`, `scripts/world-atlas-render.mjs` | Atlas 소유 문서는 원천에서 수정 |
| 인물 신원·등록 | `lore/characters/Cast-Profile-Contract.md`, `lore/name-pools/person-id-registry.json` | 공개 본문과 발급 원장 구분 |
| 작위·보유권 | `lore/regions/seoul-electoral-titles.json`, `lore/relations/personal-holdings.json` | 정치 ID와 지리 작위 분리 |
| 화면·라우팅 | `src/main.tsx`, `src/App.tsx`, `src/AGENTS.md` | BrowserRouter basename `/wiki` |
| 기사 본문 | `src/pages/ArticlePage.tsx` | locale별 generated JSON glob |
| 공개 생성·승격 | `scripts/generate-release.mjs`, `scripts/AGENTS.md` | stage·journal·publication admission |
| 인물 DB | `scripts/cast-sqlite/AGENTS.md` | schema 5, typed read-only reader |
| 비공개 문서·승인 | `scripts/document-store/AGENTS.md` | private store·receipt·pinned reader |
| HTTP API | `server/wiki-api.mjs`, `server/wiki-document-api.mjs` | 후자는 `WIKI_DOCUMENT_DB` 필수 |
| 배포·허용 산출물 | `deploy/README.md`, `artifact-allowlist.json` | 외부 owner가 release·rollback 수행 |

## CODE MAP
Refs는 선언 제외 LSP 관측치다. TS 프로젝트 범위와 JS 전역 탐색 범위가 같다고 가정하지 않는다.

| Symbol | Type | Location | Refs | 역할 |
| --- | --- | --- | --- | --- |
| `sha256` | function-valued constant | `scripts/seoul-scope.mjs:66` | 777 | scope·승인 원천 무결성 |
| `openReadOnly` | function | `scripts/cast-sqlite/db.mjs:86` | 10 | schema·application_id 검사 |
| `resolveRelations` | function | `lore/relations/validate.mjs:9` | 3 | 관계 양끝 이름·영구 ID 해석 |
| `resolveVassals` | function | `lore/relations/validate.mjs:32` | 4 | 현행 봉속과 과거 업무 구분 |
| `toWikiPath` | exported const function | `src/wikiRouting.ts:8` | 1 | native href의 `/wiki` 처리 |
| `createMapBridge` | function | `src/components/mapBridge.ts:73` | 3 | 지도 transport 수명·선택 관리 |
| `CharacterProfile` | component | `src/pages/PersonDetailPage.tsx:92` | 1 | 공개 현재 인물 수치 표시 |

## CONVENTIONS
- Vite base는 `/wiki/`, `@`는 `src`, dev port는 5174다. `/wiki/api`는 `127.0.0.1:8787`로 proxy한다.
- 공개 문서 본문은 JSON-first다. README와 비공개 계약 Markdown까지 금지하는 규칙은 아니다.
- `@seoul-dengoku/document-renderer`, `@seoul-dengoku/shared-web-ui`는 `vendor/*.tgz` 의존성이다.
- `npm test`는 제한된 suite다. 전체 Vitest와 추가 Node 검사는 `npm run test:parent`가 실행한다.
- 아래 기존 소유자 정책은 원문 그대로 유지하며 계속 적용한다.

- 세계관·인물·세력·무공·아이템·대사·위키를 작성·수정·검토하기 전에 [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md)를 끝까지 읽는다. 이 지침은 이 저장소의 집필·기여 표면에 적용하며, 최신 사용자·디렉터 지시와 승인 상태를 함께 대조한다. 무공 분류는 그 가이드와 명명 원장의 승인본을 따르고, 옛 여덟 유파·여섯 분류·현장 별칭 문장으로 되돌리지 않는다.
- Work on a dedicated branch and deliver changes through a pull request to `main`; the owner alone merges it.
- Use Korean conventional-commit messages for independently verified changes.
- Do not push directly to `main` or rewrite shared history.

## ANTI-PATTERNS
- soul·역사 모티브·증거 원천·`src/generated-private/`를 공개 JSON·asset·번들에 포함하지 않는다.
- DB 무결성·현재성·원천 품질·owner approval·publication admission을 서로 대신하지 않는다. `published`, `source_present`, `issued`만으로 공개 승인을 추론하지 않는다.
- `generate-catalog.mjs`를 live 출력 대체 진입점으로 사용하지 않는다. 정식 generate/build 경계는 `generate-release.mjs`다.
- 과거 editorial 기록·외부 범위 자료·문서의 완료 체크박스를 현재 canon이나 승인 근거로 자동 승격하지 않는다.
- MongoDB 파생 조회물을 역방향으로 편집해 lore 원천에 반영하지 않는다.

## UNIQUE STYLES
- 인물 수치 계약은 `lore/editorial/Character-System-Contract.json`이다. current/history와 미확인 값을 구분한다.
- 정치 ID·정치 세력·지리 왕국·작위 보유권은 서로 다른 계약이며 자동 대응시키지 않는다.
- 기사 본문은 현재 locale별 generated JSON을 읽는다. 문서 API의 존재만으로 전면 API 렌더링이라고 설명하지 않는다.

## COMMANDS
```bash
npm ci --ignore-scripts
npm run dev
npm run generate
npm run build
npm test
npm run test:parent
npm run test:lore-json
npm run test:cast-sqlite
npm run cast:build
npm run cast:verify
npm run test:contract
npm run check:artifacts
node --test deploy/test-*.mjs
node server/wiki-api.mjs
```

## NOTES
- release lock은 Python `fcntl.flock`을 사용한다. Windows에서 generate/build의 즉시 실행 가능성을 단정하지 않는다.
- release lock은 협조하는 generate/build만 보호한다. 생성 중 dev·직접 tsc/vite reader를 중지한다.
- cast-sqlite는 Node.js >=24.15.0이 필요하다. 임시 DB는 checkout 밖 새 경로에 두며 정본 DB 경로만 재빌드 교체한다.
- lore CI는 Node 22, SQLite CI는 24.15.0, Woodpecker는 26을 사용한다. 과거 배포 README의 버전보다 현행 workflow를 확인한다.
- build/gate/test는 MongoDB 없이 동작한다. API 기본값은 `PORT=8787`, `HOST=0.0.0.0`, `DATA_DIR=public/`다.
