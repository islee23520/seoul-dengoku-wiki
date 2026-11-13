# v3 과제 27 — 옛 로어 표면 처분 기록

Plan: `.omo/plans/wiki-lore-rebuild-v3.md` 과제 27 (GAP-6). 작업트리 `task/v3-27-legacy`.

## 판정 기준

- **Pages 경로**: `.github/workflows/pages.yml`이 실행하는 `node site/build.mjs`와 `node site/check-site.mjs`, 그리고 build.mjs가 빌드해 붙이는 `artifacts/seoul-showcase`. `site/*.mjs`가 저장소에서 읽는 것은 `data/sql/*.sql`, `public/clan-crests/`, `artifacts/seoul-showcase/`, `artifact-allowlist.json`, `LICENSE`, `docs/.anchor-baseline-broken`뿐이다(`rg -n "path.join\(REPO|readFileSync|existsSync" site/*.mjs`).
- **옛 빌드 경로**: `vite.config.ts` + `src/` React SPA, `scripts/generate-release.mjs` → `scripts/generate-catalog.mjs`, `scripts/check-contract.mjs`, `scripts/check-artifact-allowlist.mjs`. Pages는 이것을 돌리지 않지만 저장소 안의 빌드 경로이므로 "읽는 곳이 있음"으로 친다(삭제하지 않는다).
- **이관 전용 도구**: `scripts/lore-json-validate.mjs`, `scripts/cast-sqlite/*`(text-corpus-manifest, sources, source-closure, coverage-contract, additional-line-sources, line-document-store), `scripts/check-lore-links.mjs`. 루트 `AGENTS.md`가 SQLite 이관 진단 전용이라고 적은 도구이고, 이 목록들은 이미 디스크에 없는 `lore/**/*.json` 논리 경로를 다수 담고 있다(예: `lore/places/World-and-Subway-Layers.json`). 빌드 경로가 아니다.
- `scripts/pages/export-sql.mjs`는 `public/` JSON을 읽지만 첫 줄의 재실행 가드로 `--force-resync` 없이는 exit 1이다(보관된 일회용 내보내기). 빌드 경로가 아니다.
- 검색 범위: `rg -n -F <이름> site scripts artifacts .github vite.config.ts src`.

## 지운 파일 (git rm, 8개)

| 경로 | rg 결과(검색 범위 안 읽는 곳) | 판정 |
|---|---|---|
| `lore/characters/Cast-Profile-Contract.md` | `scripts/check-lore-links.mjs:43`, `scripts/lore-json-validate.mjs:51,56`, `scripts/cast-sqlite/{coverage-contract.mjs:11, line-document-store.mjs:102, sources.mjs:26, text-corpus-manifest.mjs:108}` | 이관 전용 목록만. Pages·빌드 경로 없음. 옛 국가별 카드 계약 |
| `lore/characters/Cast-Registration-Template.md` | `check-lore-links.mjs:43`, `lore-json-validate.mjs:51,57`, `cast-sqlite/text-corpus-manifest.mjs:109` | 이관 전용. 옛 등록 양식 |
| `lore/characters/Random-Cast-Roster.md` | `check-lore-links.mjs:43`, `lore-json-validate.mjs:51,58`, `cast-sqlite/text-corpus-manifest.mjs:110` | 이관 전용. 2026-09 생성 실험 기록 |
| `lore/name-pools/cast-backfill-draft.md` | `lore-json-validate.mjs:61`, `cast-sqlite/text-corpus-manifest.mjs:111`, `cast-sqlite/build.mjs:31`·`verify.mjs:50`(제외 목록), `document-store/scope-current-source.mjs:72`(`.json` 논리 경로) | 이관 전용. 옛 백필 초안(재벌·국가 소속 15곳) |
| `lore/name-pools/hangnyeol-schema.md` | `lore-json-validate.mjs:62`, `cast-sqlite/source-closure.mjs:28`, `cast-sqlite/text-corpus-manifest.mjs:112` | 이관 전용. 이미 없는 JSON과 검사기를 설명하는 옛 계약 |
| `lore/editorial/Naming-Ledger.md` | `lore-json-validate.mjs:59`, `cast-sqlite/additional-line-sources.mjs:35`; `gate.mjs:57`·`canonical-document.mjs:19`·`scope-current-source.mjs:76`은 `.json` 논리 문서(DB)를 읽는다 | 이관 전용. 16국 정식명 원장(옛 국가명 29곳) |
| `lore/editorial/Writing-Rules.md` | `lore-json-validate.mjs:60`, `cast-sqlite/additional-line-sources.mjs:36` | 이관 전용. 옛 집필 규칙 |
| `lore/places/Station-Alias-Candidates.md` | `lore-json-validate.mjs:63`, `cast-sqlite/text-corpus-manifest.mjs:113`; `scope-current-source.mjs:123`·`station-alias-document.sql`은 `.json` 논리 문서 | 이관 전용. 2026-09-28 대조 기록 |

`site/`, `.github/`, `vite.config.ts`, `src/`, `artifacts/`에는 위 8개 이름의 히트가 하나도 없다. `scripts/generate-catalog.mjs`·`generate-release.mjs`·`check-contract.mjs`의 import 그래프에도 이 Markdown 파일을 읽는 모듈이 없다(옛 생성은 DB를 읽는다).

참고: `tools/portrait/2d/options.json:33`에 `Cast-Profile-Contract.md`의 GitHub URL이 출처 문자열로 남아 있다. 파일을 읽지 않으며 초상 도구이므로 손대지 않았다.

## 남긴 파일 (읽는 곳이 있음)

| 경로 | 읽는 곳 | 지우려면 필요한 것 |
|---|---|---|
| `public/state-flags/S01-S16.webp` | `src/components/StateFlag.tsx:3`(SPA), `scripts/generate-catalog.mjs:1153`; `artifact-allowlist.json:21` 패턴 | SPA의 `StateFlag` 사용처와 generate-catalog의 `stateFlag` 투영을 먼저 걷어낸다. `concept-sheet.webp`는 읽는 곳이 없지만 같은 폴더·같은 허용 패턴이라 함께 남겼다 |
| `public/timeline-overview.json` | `src/components/TimelineOverview.tsx:27`; `artifact-allowlist.json:9` | SPA 연표 개관 컴포넌트 제거 |
| `public/opening-territories.json` | `src/components/OpeningTerritoryMap.tsx:94`, `src/pages/StateDetailPage.tsx:16`, `scripts/check-contract.mjs:95`, `scripts/check-artifact-allowlist.mjs:70`, `scripts/check-render-snapshot.mjs:101`, `scripts/bake-underground-detail.py:45` | SPA `/states` 지도와 옛 검사기 퇴역 |
| `public/family-trees/` (148) | `src/pages/FamilyDetailPage.tsx:11`; `scripts/generate-catalog.mjs:1219,1280`(생성·목록) | SPA 가계도 페이지 퇴역(Pages 가계도는 `data/sql`에서 만든다) |
| `public/territorial-scale.json` | `scripts/check-contract.mjs:93-94`(드리프트 검사); generate-catalog가 쓴다 | check-contract의 territorial-scale 검사 퇴역 |
| `public/underground-detail.json` | `src/components/OpeningTerritoryMap.tsx:109`, `scripts/generate-catalog.mjs:997,1006` | SPA 지도 퇴역 |
| `public/confirmed-person-holdings.json` | `src/components/OpeningTerritoryMap.tsx:130`, `src/components/HoldingSelectionPanel.tsx`; generate-catalog가 쓴다 | SPA 지도·보유 패널 퇴역 |
| `public/portrait-reviews/` (25) | `scripts/apply-approved-portrait-selection.mjs:48,121,132,201,214,240,263`(읽고 씀) | 초상 선택 도구의 일부. 초상 경로는 손대지 않는다는 규칙에 따라 남김 |
| `public/person-details/` | 과제 26이 v3로 다시 썼다 | 손대지 않음 |
| `lore/AUTHORING-JSON.md` | 루트 `AGENTS.md`, `scripts/cast-sqlite/AGENTS.md:22`가 가리킴; `lore-json-validate.mjs:296` | 루트 `AGENTS.md`의 저작 절차 문장을 먼저 바꿔야 한다(이 과제 범위 밖) |
| `lore/regions/README.md`, `lore/regions/sources/observed-levels-join.md` (+ csv) | `lore-json-validate.mjs:64-65`, `cast-sqlite/text-corpus-manifest.mjs:114-116` | 지리 출처 기록이고 v3와 어긋나지 않아 남김 |
| `lore/relations/validate.mjs` | `scripts/check-contract.mjs:151`, `scripts/cast-sqlite/relation-inputs.mjs:5` | Markdown이 아니라 범위 밖. 옛 국가명 4곳(아래 목록) |
| `lore/**/AGENTS.md` (8개) | 지침 파일 | 남기고 머리에 v3 권위 줄을 더했다 |

`lore/README.md`는 정본이 `docs/CANON-BIBLE.md`, `docs/design/v3/`, `data/sql`에 있다고 다시 썼다.

## 폐기 개념 잔존 검색

`git ls-files`에서 `docs/drafts/reports`, `docs/editorial`, `.omo`, `docs/design/v3`를 뺀 파일에 대해 옛 정치체 이름 15개(S01 수문국 … S16 정동노총, S06 대한민국정부는 v3 정부와 겹쳐 제외), `십육국|16국`, `재벌|chaebol`, `운영 가문|operating house`, `유니온|\bUnion\b`, `외부 영주|서울 밖 영주|outside-Seoul lord`로 `rg -P`를 돌렸다.

**공개 표면 (Pages가 내보내는 것)**

| 경로 | 히트 | 처리 |
|---|---|---|
| `data/sql/090-person-details.sql` | `Union` 511 | 오탐. 인물 욕망 칸의 결혼 형태 키(`"Union":"Monogamy"`)다. 폐기 개념 아님 |
| `site/people.mjs:138` | `Union` 1 | 같은 결혼 형태 키. 오탐 |
| `data/sql/080-gdd-documents.sql` | 40 (수문국 6, Union 10, 16국 4, 규격맹 4, 아관사 4 등) | 과제 21(GDD 080)이 병렬로 다시 쓰는 범위라 손대지 않고 목록만 남김 |
| `artifacts/seoul-showcase/src/data/storyScript.ts` | `유니온`/`the Union` 3줄(`v6-fc-04`, `v6-child-01`, `...ow-01`), 같은 줄에 "폴리스" | 과제 22(쇼케이스)가 병렬로 다시 쓰는 범위라 목록만 남김. 소유자 규칙("자유도시는 유니온이 아니야") 위반이므로 과제 22에서 반드시 고쳐야 한다 |

**공개 저장소 파일이지만 Pages 산출물이 아닌 것 (목록만)**

- 옛 SPA: `src/wikiLinks.ts`, `src/wikiRouting.ts`, `src/pages/HomePage.tsx`, `src/pages/StatesPage.tsx`, `src/pages/StateDetailPage.tsx`(2), `src/components/OpeningTerritoryMap.tsx`, `src/components/Sidebar.tsx`.
- 옛 SPA 데이터: `public/opening-territories.json`, `public/timeline-overview.json`, `public/family-trees/` 다수(예: `d45c-c2e0-cc3d.json` 4, `cc44-d3c9-ac15.json` 4).
- `lore/relations/validate.mjs:38-59`(수문국·동방사·태욱그룹·여의도출자연합회), `lore/factions/AGENTS.md:11,22`, `lore/AGENTS.md:21`(지침 안 옛 이름; v3 권위 줄로 덮음).
- `DESIGN.md:11,80,83,153`(16국 지도 설계 기록, 문서 스스로 현행 아님을 밝힘).
- `gdd/` 70개 파일(`gdd/canon` 14, `GAME-REFERENCE` 22, `RESEARCH` 11, `snapshots` 6 등; 과제 21 범위), `db/seeds/` 46(옛 PG seed 스냅샷), `vendor/issued-history/` 34(발행 이력 보존), `scripts/` 27(이관·편집 규칙·픽스처), `tools/` 6(예: `tools/portrait/2d/emit-character-prompt.test.mjs:353` "수문국 선출 군주" 픽스처, 초상 도구라 손대지 않음), `snapshots/build-inputs` 2, `data/geography/**/*.pbf` 23(지도 타일 이진 오탐).
- `docs/*-rules.json`, `docs/canon-terms.json`, `docs/CANON-BIBLE.md`, `docs/aux-rules.md`, `docs/.anchor-baseline`, `docs/RELIGION-REMOVAL-2026-11-10.md`: 금지 어휘 목록·폐기 기록으로 의도된 히트.

## 검증

- `MSYS_NO_PATHCONV=1 SITE_BASE=/ SITE_OUT=E:/git/seoul-dengoku-wiki-wt/scratch/t27/dist node site/build.mjs` → exit 0
- `SITE_OUT=… node site/check-site.mjs` → exit 0
- `node scripts/pages/v3-fixed-facts.mjs --check` → exit 0
- 빌드 산출물은 확인 뒤 지웠다(`scratch/t27`).
