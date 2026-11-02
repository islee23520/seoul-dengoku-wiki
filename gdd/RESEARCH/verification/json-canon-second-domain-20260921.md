# JSON 정본 두 번째 도메인 선정 감사 (2026-09-21)

읽기 전용 결정 감사다. 구현하지 않았다. 워크트리 `/Volumes/gameWorkspace/worktrees/seoul-kenshi/wiki-updates-state-selection`, HEAD `0dc67baa`.

작성 방법 주의: 이 세션에는 `apply_patch`가 없어 파일 생성 도구(`Write`)로 이 파일 하나만 썼다.

## 1. 결론

두 번째 도메인은 **`LORE/structures/Structures.md`(구조물 총람)** 로 정한다.

- 근거: 통합 워크트리에서 깨끗하고(형제 워크트리 둘의 미커밋 편집은 10절 동결 단계 참조), 손 저작 산문이며, 파생 투영이 아니고, 소비자가 얇고, 문서 구성요소가 관직 파일럿 렌더러가 이미 지원하는 범위(제목·문단·표·링크)에 거의 들어간다.
- 관직 파일럿에 없는 것은 딱 둘이다. **문서 ID로 연결되는 링크(`docLink`)** 와 **관직 전용이 아닌 표 파생 훅**이다. 둘 다 `TOOL/tools/canon`의 두 번째 호출자를 실제로 만들고, 다음 도메인(질병·경제)이 그대로 쓴다.
- 이번 이관의 합격 기준은 하나다. 생성 결과가 컷오버 시점의 `Structures.md`와 **바이트 동일**해야 하고(이번 파동의 원본으로 동결한 통합 HEAD `0dc67baa` 기준 SHA-256 `79dcb217…8b33`이며, 컷오버 시작 전에 승인된 다른 Structures 변경이 PR211 브랜치에 들어오면 10절 1단계대로 다시 추출해 SHA를 다시 계산한다), 그러면 WEB 미러와 Patina 영수증은 손대지 않는다.

## 2. 사전 확인 (Git 상태)

`git status --short` 결과(요약):

- 수정(`M`): `LORE/Glossary.md`, `LORE/glossary.json`, `LORE/culture/{AGENTS,Martial-Paths}.md`, `LORE/factions/Conscription-Remnants.md`, `LORE/goods/Era-Arms-and-Tech-Level.md`, `LORE/offices/Offices-and-Ranks.md`, `TOOL/tools/package.json`, `TOOL/tools/wiki/{patina-human-gate,test-patina-human-gate,test-verify-glossary,verify-glossary}.mjs`, `WEB/wiki-source/design/*`, `WEB/wiki-source/world/Offices-and-Ranks.md`, `GDD/design-store/**`, `WEB/wiki/src-gdd/**`.
- 미추적(`??`): `LORE/canon/`, `LORE/offices/AGENTS.md`, `TOOL/tools/canon/`, `TOOL/tools/wiki/offices-{canon,render}.mjs`, `test-offices-canon.mjs`, `patina-human-receipt.json`, `GDD/architecture/JSON-Relational-Canon.md`, 여러 `RESEARCH/verification/*20260921*`.

후보 5개 문서(`LORE/structures`, `LORE/ailments`, `LORE/economy/*` 셋)와 그 WEB 미러(`WEB/wiki-source/world/{Structures,Ailments}.md`)는 **위 목록에 없다.** 즉 수정도 미추적도 아니다. `WEB/wiki/src/content/`는 `.gitignore` 대상(생성물)이다.

## 3. 후보 행렬

기준: 깨끗함 / 정본성(손 저작, 파생 아님) / 안정 ID / 공개 라우트 / 소비자·테스트 / 구성요소 / 확장 필요량. 세 후보만 비교한다. 사람 ID 의존 관계, GAME·Backend, design-store, 생성 투영은 처음부터 제외했다.

| 항목 | A. Structures | B. Ailments | C. Economy 3문서 |
|---|---|---|---|
| 경로 | `LORE/structures/Structures.md` | `LORE/ailments/Ailments.md` | `LORE/economy/{Economy-and-Production,Logistics-and-Infrastructure,Strongholds-and-Territory}.md` |
| 깨끗함 | 예 | 예 | 예 |
| 크기 | 53줄 / 10,063 B | 54줄 | 102 + 75 + 85줄 |
| 제목 | h1 1, h2 5 | h1 1, h2 3 | h1 3, h2 16 |
| 표 | 1개(5행 x 4열), 마지막 열이 링크 | 1개(3행 x 3열), 평문 | 8개 매개변수 표, 값이 `0~1`, `10%`, `5 보급점/일` 같은 혼합 문자열 |
| 목록·강조·코드 | 없음 | 없음 | 목록 33줄, 인라인 코드 44곳, 표 밖 파이프 2줄 |
| 링크 | 22개(고유 대상 15) | 12개(고유 12) | 4개 |
| 안정 ID | 문서 스템 15+1(이미 `mount.mjs`가 유일성에 의존), 구조 종류 5는 새 내재 슬러그 | 문서 스템 12+1, 층 3은 새 슬러그, 무리 `G10`·`G19`는 기존 영구 ID | 기호(`B`,`I`,`P`,`X`,`H`,`Q`,`A`,`L`,`R`,`K`,`S`,`O`)는 산문 안 변수 이름이지 행 ID가 아니다 |
| 공개 라우트 | `/world/Structures` (React `/wiki/world/Structures`, VitePress `structures/Structures.html`) | `/world/Ailments` | `/world/…`, 그리고 `Rules-EconomyLogistics`·`Rules-Strongholds` 미러 |
| 소비자 | `build-world-index.mjs:70`(색인 링크), `mount.mjs`(미러+href 재작성), Patina 게이트(미러 SHA), `LORE/README.md`, 산문 링크 4곳 | 위와 동일 + `LORE/culture/Martial-Paths.md`(수정 중) 링크 | GDD 규칙 3개, `LORE/regions/content/*.json` 7개 이상, `TOOL/tools/regions/data/atlas-data.js`, `test-build-wiki.mjs`, `generate-core-isometric-diagrams.mjs`, 위키 규칙 미러 |
| 기존 테스트 | 없음(Patina·위키 빌드 게이트가 간접) | 없음 | `test-build-wiki`, `test-strategy-formulas` 등 다수 |
| 렌더러 재사용 | 헤딩·문단·표·링크 그대로 | 그대로(표도 평문) | 목록·코드·범위 값 셀·숫자 의미가 전부 새로 필요 |
| 필요한 확장 | `docLink` 1종, 표 파생 훅 일반화 | `docLink` 1종 | 목록, 인라인 코드, 숫자 파싱, 범위 제약, 다중 문서, 규칙 미러 동기화 |
| 위험 | 낮음 | 낮음, 다만 재사용 증거가 약함 | 높음. 수치 규칙을 JSON이 소유하게 되면 미결 수치 창작 금지선과 GDD 규칙과의 이중 소유가 걸린다 |

판정:

- **A를 고른다.** B는 같은 구성요소지만 표가 평문이라 FK·링크 확장을 증명할 것이 적다. 다음 파동으로 남긴다(A가 이미 `doc.Ailments`를 등록하므로 B는 문서 ID 재사용의 첫 실증이 된다).
- **C는 지금 고르지 않는다.** 표는 가장 표답지만 목록·코드·수치 의미가 전부 새 확장이고, 소비자가 GDD와 지역 JSON까지 뻗어 있다. 「작은 표 중심 도메인」 조건에 맞지 않는다.

## 4. 선정 소스 (확인한 사실)

- 파일: `LORE/structures/Structures.md`, 마지막 변경 커밋 `b0fe7236`(2026-09-21), 바이트 10,063, 줄 53, CRLF 없음, 끝 개행 있음.
- SHA-256 `79dcb217185d87e734d4ad821610bcb2de343a5e5930bdf11071754466408b33`, git blob `b6c954a421efc9d04fa955a9276510788db43ead`.
- 구성: h1 1(`구조물 총람`), h2 5(`역`,`터널`,`차량기지`,`정수장과 수문`,`통로`), 문단 17, 표 1(헤더+구분선+5행). 총 24 블록. 목록·강조·코드·인용·이미지·HTML 없음(`grep`으로 0 확인).
- 링크 22개: 문단 17 + 표 5. 앵커(`#`) 없음. 전부 `../<디렉터리>/<스템>.md` 꼴이고 22개 모두 대상 파일이 존재한다(스크립트로 확인, `MISSING` 0).
- 미러 `WEB/wiki-source/world/Structures.md`는 추적 중이고 깨끗하며 SHA-256 `85b1702c…afa`다. 이 값이 `TOOL/tools/wiki/patina-human-receipt.json`의 `Structures.md` 항목과 같다. 원본에서 `](../dir/Stem.md)`를 `](/world/Stem)`으로 바꾼 결과와 미러의 차이는 0이다.

## 5. 안정 ID

새 ID 접두는 영구 ID 계열(`K`,`S`,`HC`,`HP`,`XT`,`G`,`M`,`B`)과 겹치지 않게 점 표기 슬러그로 한다. 새 슬러그 두 종류는 소유자 승인 항목이다(12절).

**문서 ID (16개, 새 소유 표 `documents`)**: `doc.<파일 스템>`. 스템은 `mount.mjs`가 이미 평면 유일이라 가정하므로(`pageByFile` 키가 basename) 새 이름을 만들지 않는다.

| ID | 경로(`LORE/` 기준) |
|---|---|
| `doc.Structures` | `structures/Structures.md` (자기 자신) |
| `doc.World-Unbinding` | `overview/World-Unbinding.md` |
| `doc.Seoul-Station-Catalog` | `places/Seoul-Station-Catalog.md` |
| `doc.World-Map-Construction` | `places/World-Map-Construction.md` |
| `doc.World-and-Subway-Layers` | `places/World-and-Subway-Layers.md` |
| `doc.Building-Reuse-Geography` | `places/Building-Reuse-Geography.md` |
| `doc.Station-Interior-Construction` | `places/Station-Interior-Construction.md` |
| `doc.Strongholds-and-Territory` | `economy/Strongholds-and-Territory.md` |
| `doc.Logistics-and-Infrastructure` | `economy/Logistics-and-Infrastructure.md` |
| `doc.Sixteen-States` | `factions/Sixteen-States.md` |
| `doc.People-and-Machines` | `people-and-machines/People-and-Machines.md` |
| `doc.Lost-Technology-Lineage` | `technology/Lost-Technology-Lineage.md` |
| `doc.Oral-Stories` | `culture/Oral-Stories.md` |
| `doc.Ailments` | `ailments/Ailments.md` |
| `doc.Food-Culture` | `culture/Food-Culture.md` |
| `doc.Scenario-Timeline` | `chronology/Scenario-Timeline.md` |

**구조 종류 ID (5개)**: `structure.station`, `structure.tunnel`, `structure.depot`, `structure.waterworks`, `structure.passage`. 원문 표의 5행과 1:1이고, 순서는 원문 행 순서다.

**블록 ID (24개)**: 의미 슬러그. 번호 접미사 대신 위치로 고정한다.
`structures.title`, `structures.intro.p1`, `structures.intro.p2`, `structures.station.h`, `structures.station.p1..p3`, `structures.tunnel.h`, `structures.tunnel.p1..p3`, `structures.depot.h`, `structures.depot.p1..p3`, `structures.waterworks.h`, `structures.waterworks.p1..p3`, `structures.passage.h`, `structures.passage.p1..p3`, `structures.kinds.table`. 문단 개수(17)와 제목 개수(6)와 표 1이 원문과 맞는다.

## 6. 정확한 JSON 표·관계·로캘

새 파일은 `LORE/canon/` 아래에만 둔다. 예약 경로는 아래와 같다.

| 파일 | 종류 | 행·내용 |
|---|---|---|
| `LORE/canon/tables/documents.json` | 표 | `{schemaVersion:1, rows:[{id, path}]}` 16행. `path`는 `LORE/` 기준 상대 경로이며 링크·라우트의 유일한 출처 |
| `LORE/canon/tables/structure-kinds.json` | 표 | `{schemaVersion:1, rows:[{id, order}]}` 5행 |
| `LORE/canon/relations/structure-kind-details.json` | 관계 | `{schemaVersion:1, rows:[{kindId, docId, textKey}]}` 5행. 종류당 정확히 1개 상세 문서. `textKey`는 링크에 보이는 글자 |
| `LORE/canon/locales/ko-KR/structures.json` | 로캘 | `texts`(종류별 이름·2026 출발점·개막에 하는 일·상세 링크 글자 = 20행), `document{id:"doc.Structures", blockIds}`, `blocks` 24개 |
| `LORE/canon/schema/structures.schema.json` | 스키마 | **별도 파일.** 이 도메인 세 파일(`tables/structure-kinds.json`, `relations/structure-kind-details.json`, `locales/ko-KR/structures.json`)에 `documents.json`을 더한 네 분기와, 작은 `$defs`(`schemaVersion`, `id`, `inline`, `cell`, `block`)를 이 파일 안에 **복제**해 둔다. 현재 지원 키워드만 쓴다. `offices.schema.json`은 손대지 않는다(7절) |

표 블록은 관직과 같은 `source` 방식을 쓴다.

```json
{"id":"structures.kinds.table","kind":"table",
 "header":["구조","2026 출발점","개막에 하는 일","상세 정본"],
 "source":"structure-kinds"}
```

문단은 링크를 `docLink`로 든다(원문 `[기동권 이탈](../overview/World-Unbinding.md)` 대응).

```json
{"kind":"docLink","text":"기동권 이탈","targetDocumentId":"doc.World-Unbinding"}
```

표 셀 4열은 파생 훅이 `[<textKey 글자>](<상대경로>)`로 만든다. 그러므로 셀에는 마크다운 문법을 JSON에 저장하지 않고 `cell` 스키마(`|`·개행 금지 문자열)를 그대로 쓴다. 표 셀 링크를 인라인 배열로 바꾸는 스키마 확장은 필요 없다.

상대 경로는 `posix.relative(dirname(자기 문서 path), 대상 path)`다. `structures/` 기준 계산 결과가 원문의 22개 링크 문자열과 같다(`../overview/World-Unbinding.md` 등). 같은 디렉터리 링크는 이 문서에 없어서 `./` 처리 규칙은 이번 범위 밖이다.

기존 행 순서·표 열 순서·문단 경계를 그대로 보존하고, 원문에 없는 사실(예: 차량기지 8곳, 정수센터 4곳을 국가 ID에 잇는 관계)은 **산문에 남기고 표·관계로 승격하지 않는다.** 그 승격은 새 내용을 정하는 일이라 이번 범위 밖이다.

## 7. 렌더러·스키마 재사용 대 필요 확장

| 항목 | 판정 |
|---|---|
| `parseCanonJson`(중복 키 거절) | 그대로 재사용 |
| `checkSchema` 부분집합 | 그대로 재사용. `TOOL/tools/canon/schema-subset.mjs`는 **변경하지 않는다.** 이미 지원하는 키워드(`type`, `const`, `enum`, `minimum`, `minLength`, `pattern`, `minItems`, `items`, `required`, `properties`, `additionalProperties: false`, `oneOf`, `$ref "#/..."`, `$defs`)만 쓴다 |
| `CanonError` | 그대로 |
| 스키마 파일 | **결정: 별도 `LORE/canon/schema/structures.schema.json`.** 파일 간 `$ref`를 쓰지 않고 `checkSchema`도 확장하지 않는다. `$ref`는 파일 안의 `#/$defs/...`만 쓴다. `offices.schema.json`은 파일도 이름도 내용도 그대로 두고 관직 테스트 기대값도 바꾸지 않는다. 로더는 관직처럼 `title`이 경로인 `oneOf` 분기를 찾는다 |
| 복제하는 `$defs` | `schemaVersion`, `id`, `cell`, `inline`(`text`, `link`, 그리고 새 `docLink`), `block`(`heading`, `paragraph`, `table`)을 `structures.schema.json`에 옮겨 적는다. 이는 의도한 복제다. 두 파일의 공통 `$defs`가 어긋나지 않게 8절 테스트 8번이 두 스키마의 공유 정의 동일성을 검사한다 |
| `inline` | **확장 1(구조물 스키마 안에서만).** `docLink`(`kind`,`text`,`targetDocumentId`) 분기 추가. 관직 스키마의 `link`(`href`)는 구조물 스키마에도 같이 복제하되 이 문서는 쓰지 않는다 |
| `block.table.source` | **확장 2(구조물 스키마 안에서만).** 구조물 스키마의 `source`는 `const "structure-kinds"`다. 관직 스키마의 `const "state-office-titles"`는 그대로다. 렌더러 `renderTable`의 관직 하드코딩은 도메인별 파생 훅 표(`{source → (canon, ctx) => rows}`)로 바꾼다. 이것은 스키마가 아니라 렌더러 코드의 변경이다 |
| 블록 렌더러 `renderBlock` | `heading`/`paragraph`/`table` 그대로. `docLink` 분기 1개 추가 |
| 로더 | `loadOfficesCanon`을 그대로 복제하지 않는다. 헬퍼(`uniqueBy`, `uniqueComposite`, `requireFk`, `requireCount`, 문서 블록 검증 `validateDocument`)를 `TOOL/tools/canon/integrity.mjs`로 끌어올리고 관직과 구조물이 함께 호출한다. 관직 테스트 11개(`test-offices-canon.mjs`의 `test(` 11건)가 안전망이다 |
| 원자적 쓰기·`--check` | `materializeOffices`의 임시 파일+`rename`+`E_DRIFT` 로직을 `TOOL/tools/canon/emit.mjs`로 올려 두 도메인이 공유한다 |
| 국가 등록부 | 관직 전용 접착 코드(`loadStateRegistry`)로 남긴다. 구조물은 등록부 대신 `documents` 표를 인자로 받는다 |
| 유지하는 한계 | 링크 URL 스킴 검사 없음(문서 내부 링크만 쓰므로 무관), 셀에 `|`·개행 거절, 강조·목록·인용·이미지 미지원. 이 문서는 그것들을 쓰지 않는다 |

이것이 「진짜 재사용」의 증거다. 두 번째 호출자가 생기는 순간 `integrity.mjs`·`emit.mjs`가 호출자 둘을 가져 wave 1이 정당화되고, 관직 코드는 같은 PR에서 그 모듈을 호출하도록 최소로만 바뀐다(선제 리팩터 금지 원칙 유지).

문서 ID와 경로의 정합 검사는 파일 시스템 경계를 건드리는 새 무결성 규칙이다(`path`가 실제 파일을 가리킴, `basename` 유일). 이 규칙은 `documents` 표가 하는 일이고 구조물 전용이 아니다.

## 8. 테스트

기존 테스트를 늘린다: `TOOL/tools/canon/test-canon.mjs`(공유 계층), `TOOL/tools/wiki/test-offices-canon.mjs`(관직, 그대로 통과해야 함). 새 파일은 `TOOL/tools/wiki/test-structures-canon.mjs` 하나다. 관직 테스트와 같은 `sandbox`/`rejects` 헬퍼를 쓰고, 그 헬퍼는 도메인 이름을 모르게 `canon/`으로 올린다.

1. **바이트 동등**: 렌더 결과 SHA-256이 `79dcb217185d87e734d4ad821610bcb2de343a5e5930bdf11071754466408b33`이고 디스크의 `Structures.md`와 같으며 두 번 생성해도 같다. 이 해시는 이관 전 원문을 고정하는 기계 값이다.
2. **구성 보존**: 블록 24개, 제목 6(h1 1·h2 5), 문단 17, 표 1, 링크 22(문단 17 + 표 5), 표 5행 x 4열.
3. **무결성 오류 코드**: 중복 문서 ID(`E_DUPLICATE_ID`), 중복 스템, 없는 경로(`E_FK_DOC_PATH`), 끊긴 `targetDocumentId`(`E_FK_DOC`), 없는 종류(`E_FK_KIND`), 종류당 상세 1개 위반(`E_MISSING_COMPOSITE`/`E_DUPLICATE_COMPOSITE`), `blockIds`와 `blocks` 불일치(`E_DOCUMENT_BLOCKS`), `source`가 없는 표 훅(`E_TABLE_SHAPE`).
4. **스키마**: 알 수 없는 인라인 `kind`, `docLink`에 `href`가 섞임, 추가 필드, 잘못된 `schemaVersion`, 중복 JSON 객체 키 거절.
5. **드리프트·원자성**: 손으로 고친 Markdown은 `--check`에서 `E_DRIFT`, 검증 실패는 출력 파일을 건드리지 않음.
6. **소비자 호환(파일럿의 「소비자 정규식」 테스트에 대응)**: `docLink`로 계산한 22개 상대 경로 집합이 원문 링크 집합과 같고, `build-world-index.mjs`의 `structures/Structures.html` 경로가 `documents`의 `doc.Structures` 경로에서 나온 것과 일치한다.
7. **관직 회귀**: `node --test TOOL/tools/wiki/test-offices-canon.mjs`(11개)가 수정 없이 그대로 통과하고, `offices.schema.json`이 바이트 단위로 그대로이며, 관직 출력 SHA도 변하지 않는다.
8. **복제 `$defs` 동일성**: `structures.schema.json`과 `offices.schema.json`이 함께 가진 정의(`schemaVersion`, `id`, `cell`, `inline`의 `text`·`link`, `block`의 `heading`·`paragraph`)가 구조적으로 같다. `docLink`와 구조물 전용 `table.source`는 비교에서 제외한다. 스키마 실행기를 늘리지 않고 파일 두 개를 읽어 비교하는 테스트다.

실행 명령(구현 PR에서):

```
node --test TOOL/tools/canon/test-canon.mjs TOOL/tools/wiki/test-offices-canon.mjs TOOL/tools/wiki/test-structures-canon.mjs
node TOOL/tools/wiki/structures-render.mjs --check
node WEB/wiki-source/scripts/mount.mjs
node TOOL/tools/wiki/patina-human-gate.mjs verify
npm --prefix TOOL/tools test
```

이번 감사에서는 위 명령을 실행하지 않았다.

## 9. 라우트 QA

라우트는 바뀌지 않는다. 원문 경로(`LORE/structures/Structures.md`)와 미러 경로(`WEB/wiki-source/world/Structures.md`)와 사이트 경로(`mount.mjs`의 `sitePath`가 `/world/Structures`)가 그대로다. React 사이트의 `base`는 `/wiki/`(`WEB/wiki/vite.config.ts:6`)이므로 공개 URL은 `/wiki/world/Structures`로 추정한다. 이 추정은 브라우저로 확인하지 않았다.

구현 PR의 QA 순서:

1. `git diff --exit-code -- LORE/structures/Structures.md WEB/wiki-source/world/Structures.md TOOL/tools/wiki/patina-human-receipt.json` 종료 0(재생성 후, mount 재실행 후).
2. `node WEB/wiki-source/scripts/gate.mjs`와 `WEB/wiki/scripts/check-links.mjs`.
3. 대표 데스크톱 브라우저(`aside-agent`)로 `/wiki/world/Structures`를 열어 h1 1·h2 5, 표 5행, 본문 링크 22개가 살아 있고, `질병과 증상` 링크로 `/wiki/world/Ailments`에 도달하며 거기서 다시 돌아오는지 확인한다. 색인 페이지의 `건축물` 카드가 이 페이지로 이어지는지도 확인한다. 반응형·타 브라우저는 검증하지 않는다(프로젝트 웹 검증 범위).
4. 첫 확인은 `curl -i`로 `/wiki`가 공개로 응답하는지만 본다.

## 10. 이중 정본 없는 컷오버

원자적 한 PR:

1. **동결**: 근거는 [`structures-parallel-diff-adjudication-20260921.md`](structures-parallel-diff-adjudication-20260921.md)다. 통합 워크트리의 `Structures.md`는 origin/main과 같은 블롭이라 깨끗하지만, 형제 워크트리 둘이 이 파일을 미커밋으로 고치고 있다: `human2-core`(산문 22줄, 의미 이동 후보 7건, 사람 검토 대기, 별도 PR 권고)와 `wiki-three-world-markers`(2줄, 최신 결정 두 개를 되돌리는 옛 변경, 반영 제외 권고). 판정의 권고는 통합 브랜치를 이 파일과 무관한 origin/main 기준선으로 그대로 진행하는 것이고, 이 파동은 그 권고를 따른다. **이 파동의 원본은 동결한 통합 HEAD `0dc67baa`의 `Structures.md`(SHA-256 `79dcb217…8b33`)다.**
   - `human2-core`(22줄)와 `wiki-three-world-markers`(2줄)는 **보존된 외부 변형**이다. 컷오버는 두 편집을 가져오지 않고, 그 착지를 기다리며 막히지도 않는다. 두 워크트리에서 이 파일을 정리·되돌리기·`stash pop` 하지 않는다.
   - 두 변형은 나중에 각 소유자가 JSON 원본에 대해 조정한다. 컷오버 뒤 이 Markdown은 생성물이므로 그 조정은 Markdown 손 편집이 아니라 JSON 수정과 재생성이다. human2를 올릴 때의 `mount.mjs`·`gate.mjs`·Patina 재측정(기준 29.2)도 그 소유자의 몫이며 이 컷오버가 대신하지 않는다.
   - 컷오버 시작 전에 승인된 다른 Structures 변경이 PR211 브랜치에 들어오면 그 위로 rebase하고 JSON을 다시 추출하며, 8절 테스트 1과 이 보고서의 SHA를 다시 계산한다. 그런 변경이 없으면 동결한 SHA로 그대로 진행한다.
   - 컷오버 직전 `git log`와 열린 PR로 다른 편집이 없음을 다시 확인한다(열린 PR 조회는 아직 하지 않았다).
   - 동결 중 어느 워크트리에서도 이 파일을 정리·되돌리기·`stash pop` 하지 않는다.
2. **JSON 추가**: 6절 파일과 `LORE/structures/AGENTS.md`(관직 `AGENTS.md`와 같은 문구: 생성물, 손 편집 금지, 역방향 없음).
3. **생성**: 새 렌더러로 `Structures.md`를 생성하고 원문과 **바이트 동일**임을 확인한다. 다르면 JSON을 고치지 원문을 고치지 않는다.
4. **소유 전환**: 같은 커밋에서 렌더러와 `--check`와 테스트가 활성화되고 `TOOL/tools/package.json` 배선(12절)이 함께 들어간다. 배선이 빠진 커밋은 컷오버가 아니다. 그 뒤로 이 Markdown은 생성물이다. 소유·활성 상태는 `LORE/structures/AGENTS.md`가 적고, 공유 manifest는 이번 파동에 없다.
5. 생성 배너는 **넣지 않는다.** 배너 한 줄이 원문 바이트를 바꿔 미러 SHA와 Patina 영수증을 무효화하기 때문이다. 대신 `--check`, `AGENTS.md` 경고, CI 배선으로 가드한다. 배너는 계약 8절 3단계가 요구하는 생성물 표식이라 이 결정을 소유자에게 묻는다(12절).
6. 중간 상태는 게시하지 않는다. 시각·내용이 같은 바이트이므로 사이트 재배포도 필요 없다.

이관은 「내용 수정 없음」이다. 관직 파일럿처럼 마이그레이션 중 문구를 바꾸지 않는다(파일럿은 `S08` 제목을 함께 바꿨다는 경고가 일반화 감사에 있다).

## 11. 롤백

- 컷오버 PR을 머지하기 전: PR을 닫는다. 원문은 처음부터 바뀌지 않았다.
- 머지 뒤 JSON 편집이 한 번도 없었다면: PR을 `git revert`한다. Markdown 바이트가 이관 전후 동일하므로 미러·영수증·사이트가 그대로다.
- JSON 편집이 이미 들어간 뒤: 마지막 승인된 JSON 묶음(JSON·스키마·렌더러·테스트)으로 원자적으로 복구한다. Markdown을 다시 쓰기 가능한 정본으로 여는 롤백은 하지 않는다(계약 11절).
- 이 절은 `Structures.md`만 되돌리고 관직·공유 계층은 건드리지 않는 것을 뜻한다. 공유 `emit`·`integrity` 추출은 별도 커밋이라 구조물 PR을 되돌려도 관직은 통과해야 한다.

## 12. 충돌과 소유자 확인 항목

**작업 트리 충돌 (확인한 사실)**

- 관직 파일럿 전체(`LORE/canon/`, `TOOL/tools/canon/`, `offices-{canon,render}.mjs`, 테스트)가 **미추적**이다. 구조물 PR은 그 커밋 뒤에 쌓여야 한다. 먼저 커밋하지 않으면 공유 모듈 추출의 두 번째 호출자를 대조할 원본이 없다.
- `TOOL/tools/package.json`이 수정 상태(다른 작업 소유)다. 구조물 컷오버는 이 파일의 배선을 **같은 PR에 포함해야 한다.** 구조물 렌더러 `--check`, `test-structures-canon.mjs`, 공유 `TOOL/tools/canon/test-canon.mjs`를 `scripts`에 넣고, 관직 테스트와 `--check`가 아직 배선되지 않았다면 함께 넣는다. 배선 없는 컷오버는 AGENTS.md 수동 명령에만 의존해 드리프트를 CI가 막지 못하므로 허용하지 않는다. 현재의 수정(`M`)이 정리되기 전에는 이 파일에 손댈 수 없으므로, 그 정리가 컷오버의 선행 조건이다.
- `patina-human-receipt.json`이 **미추적**이고 `patina-human-gate.mjs`가 수정 상태다. 영수증 자체가 아직 커밋되지 않았다. 구조물은 영수증 SHA를 바꾸지 않아야 하므로 이 영수증이 확정된 뒤에 이관하는 것이 안전하다.
- `WEB/wiki-source/world/Offices-and-Ranks.md`는 수정 상태이나 구조물 미러와 별개 파일이다.
- `JSON-Relational-Canon.md`(계약)가 미추적이고 `GDD/canon/manifest.json`이 없다. 승인된 기존 기본값을 따른다: 이번 파동에서 도메인 소유와 활성 상태는 관직처럼 `LORE/structures/AGENTS.md`가 기록하고 `--check`와 CI 배선이 가드한다. **공유 manifest는 만들지 않고, 근거가 있는 설계가 나올 때까지 보류한다.** 「도메인이 둘이 되면 manifest가 필요하다」는 이전 일반화 감사의 문장은 이 결정으로 대체한다. 두 도메인이 `AGENTS.md`로 충분한지는 이 파동의 실측 결과가 근거가 된다.
- `human2-core`(산문 22줄)와 `wiki-three-world-markers`(2줄)가 이 파일을 미커밋 수정 중이다(병렬 diff 판정 참조). 통합 워크트리는 깨끗하고 컷오버는 그 편집에 묶이지 않는다. 두 편집은 보존된 외부 변형으로 남고 소유자가 나중에 JSON 원본에 대해 조정한다(10절 1단계). `LORE/factions/Conscription-Remnants.md`도 human2와 통합 양쪽에서 수정 중이라 human2를 올릴 때 겹칠 수 있다.

**서로 얽힘**

- `Ailments.md`와 `Structures.md`가 서로 링크한다. 경로가 그대로라 Ailments는 손대지 않는다. 다음 파동으로 Ailments를 옮기면 `doc.Structures`가 이미 `documents`에 있어 연쇄가 닫힌다.
- `Structures.md`의 링크 대상 중 `Sixteen-States.md`(수정 없음), `Lost-Technology-Lineage.md` 등은 깨끗하다. 링크 대상 자체가 수정 중이라도 경로만 등록하므로 충돌하지 않는다.

**미확인 (이번에 하지 않음)**

- 테스트·게이트·빌드는 실행하지 않았다(읽기 전용).
- `verify-glossary.mjs`(수정 중)가 `Structures.md`를 검사하는지 읽지 않았다. 구현 전에 확인한다.
- `publish-wiki.mjs`, `generate-catalog.mjs`가 `Structures`를 문서 단위로 특수 처리하는지 내용을 읽지 않았다(파일명 grep에서는 나오지 않음).
- `/wiki/world/Structures` 실제 응답은 브라우저로 열어 보지 않았다.
- 열린 PR이 `Structures.md`를 수정 중인지 확인하지 못했다.

**소유자 승인 필요 (구현 전)**

1. `structure.*` 슬러그와 `doc.*` 슬러그 두 접두를 새 영구 ID로 승인하는가.
2. 생성 배너를 넣어 미러·영수증을 한 번 갱신하는가, 아니면 배너 없이 가드로 대신하는가(권고: 배너 없음).
(human2 착지 순서는 결정이 끝났다: 10절 1단계에서 통합 SHA를 원본으로 동결하며 승인 항목이 아니다. 스키마도 결정이 끝났다: 구조물 전용 별도 `structures.schema.json`, `offices.schema.json` 무변경, 승인 항목 아님. 관직 파일럿 커밋과 `TOOL/tools/package.json` 배선은 질문이 아니라 컷오버 선행 조건이다: 12절 충돌 항목.)

## 13. 다음 파동

`Ailments.md`(B). `doc.Ailments`를 이미 등록했고 `docLink`·표 파생 훅이 있으니 남는 것은 표 1개(3행)와 링크 12개다. 그 다음에야 경제 3문서를 고려하며, 목록·인라인 코드·수치 셀 확장 설계를 먼저 승인받는다.
