# JSON 정본 대안 파일럿 선정 (2026-09-21)

조사 전용 문서다. 구현하지 않았다. 워크트리 `/Volumes/gameWorkspace/worktrees/seoul-kenshi/wiki-updates-state-selection`.

작성 방법 주의: 이 세션에는 `apply_patch`가 없어 파일 생성 도구(`Write`)로 작성했다. 이 파일 외에는 아무것도 쓰지 않았다.

## 1. 결론 (하나)

**대안 첫 파일럿은 `LORE/offices/Offices-and-Ranks.md`(관직, 12,317 B)다.**

- 인물 ID를 전혀 쓰지 않는다. 키는 국가 ID(`S01`~`S16`)와 티어 ID(`T1`~`T5`)뿐이다.
- 작업 트리에서 수정되지 않았다(`git status`에 없음). 마지막 커밋 `b0fe7236`. 금지된 더러운 파일 목록과 겹치지 않는다.
- 손으로 쓴 원본이다. 표지 `원본 앵커` 헤더가 없고 다른 문서의 투영이 아니다.
- 이미 기계 소비자가 있다. `WEB/wiki/scripts/generate-catalog.mjs:118-121`이 이 문서의 「국가별 관직표」를 정규식으로 읽어 1004명의 `commonTier`(T1~T5)를 계산한다. 그러므로 "JSON 정본 → 결정적 Markdown → 기존 공식 위키 경로"가 소비자 코드를 바꾸지 않고 증명된다.
- 공개 경로가 있다: `/world/Offices-and-Ranks`(`WEB/wiki/src/wikiLinks.ts:8`).

## 2. 후보 비교

| 후보 | 크기 | 판정과 근거 |
| --- | --- | --- |
| **`LORE/offices/Offices-and-Ranks.md`** | 12,317 B, 표 3개(5행, 16행x5티어, 5행) | **선정.** 위 1절. |
| `LORE/culture/Values-and-Policy-Scales.md` | 11,006 B | 기각. 숫자 원장이 이미 `values-cast.json`/`values-orgs.json`이다(정본이 다른 문서). 「개막 핵심 인물 17명」 표가 인물 이름을 키로 쓴다(인물 FK 의존). |
| `LORE/factions/Sixteen-States.md` | 30,254 B | 기각. `S` ID는 있으나 산문 위주이고, `glossary.json`의 `state-*`와 원장이 겹친다(`glossary.json`은 더러운 파일). 소비자가 많아 첫 파일럿으로 크다. |
| `LORE/factions/External-Theaters.md` | 47,792 B | 제외. `원본 앵커: World-Narrative-Atlas.md`인 생성 투영물이다. |
| `LORE/ailments/Ailments.md`, `LORE/structures/Structures.md` | 7.5 KB, 10 KB | 기각. 표가 거의 없고(5줄, 7줄) 산문뿐이라 관계형 구조 증명이 약하다. 정본 성격의 지명 문서 링크만 다수. |
| `LORE/chronology/Century-Annals.md` | 99 KB | 기각. 크다. 전용 테스트(`test-century-annals.mjs`)가 있으나 이번에 내용을 읽지 않았다(미조사). |
| `LORE/economy/*`, `LORE/technology/*` | 5.5~24 KB | 미조사. 관직 문서가 더 작고 소비자가 명확해 읽지 않았다. |

GAME/Backend는 조사하지 않았다. `Glossary.md`, `glossary.json`, `Martial-Paths.md`, `Conscription-Remnants.md`, `Era-Arms-and-Tech-Level.md`, design-store 파생물은 건드리지 않는다.

## 3. 확인한 사실과 미확인

확인(읽은 것):

- 문서 구조: 서두 문단, 「다섯 층」(티어 표 5행), 「국가별 관직」(H3 13개, 국가 묶음 서술), 「국가별 관직표」(16x5), 「옛 조선 관직 치환」(표 5행), 「왜 이 관직인가」, 「작위와 생업」, 「계승」. 본문에 상대 링크(`../characters/...`)가 있다.
- 소비자 정규식: `| 국가 | 티어1 |` 이후 `## `까지의 구간에서 정확히 6열 행만 잡는다. `commonTier`는 `person.state_name`과 표의 국가 이름, 인물 `rank` 문자열로 계산한다. 이름 기반 조인은 기존 소비자의 것이며 이 파일럿의 범위 밖이다.
- `LORE/World-Narrative-Atlas.md`의 국가 등록부에 `교헌필사정`(표기명)과 `state_id`/`state_name` 쌍이 있다(391, 2310행 부근). 관직표의 국가 이름은 이 표기와 같은 계열이다.
- `Sixteen-States.md` 산문과 `Values-and-Policy-Scales.md` 표에서 `S06` 대한민국정부, `S10` 승가구휼정, `S11` 서초전산그룹, `S12` 중립호송시, `S14` 관문군정이 일치함을 확인했다.
- 다른 소비자: `TOOL/tools/policy/test-private-organization-names.mjs`(이 파일 내용 검사), `TOOL/tools/wiki/patina-human-receipt.json`(본문 해시 수령증), `WEB/wiki-source/scripts/build-world-index.mjs`(링크).

미확인(구현 전에 도구가 실패로 드러내야 하는 것):

- 관직표 16개 국가 이름이 모두 등록부의 표기명과 일치하는지, 그리고 16개 각각의 `Sxx` 대응(위 5개만 확인). 표에는 `교헌필사정`, 「국가별 관직」 H3에는 `원불교`가 병존한다. 이 불일치는 이번에 발견했으며 원인은 조사하지 않았다.
- 문서에 굵은 글씨, 목록, 코드 블록 같은 다른 인라인 문법이 있는지(앞부분과 표만 읽었다). 이관 도구가 목록화하고, 지원하지 않는 문법이면 실패해야 한다.
- 문서 전체 줄 수와 파일 SHA-256(기준선 1번에서 기록).

## 4. JSON 모양 (제안, 이름은 소유자 확인 필요)

`GDD/architecture/JSON-Relational-Canon.md`의 목표 경로와 블록 모델을 따른다. 인물은 어디에도 없다.

`LORE/canon/tables/office-tiers.json` — 티어 5행. `T1`~`T5`는 `generate-catalog.mjs`가 이미 쓰는 식별자다.

```json
{
  "schemaVersion": 1,
  "rows": [
    { "id": "T1", "order": 1, "name_key": "tier.T1" }
  ]
}
```

`LORE/canon/relations/state-office-titles.json` — 국가 x 티어의 직함. 복합키 `(state_id, tier_id)`가 PK, `state_id`는 국가 등록부 FK, `tier_id`는 위 표 FK. 16 x 5 = 80행.

```json
{
  "schemaVersion": 1,
  "rows": [
    { "state_id": "S06", "tier_id": "T1", "title_key": "office.S06.T1", "order": 1 }
  ]
}
```

`LORE/canon/locales/ko-KR/offices-and-ranks.json` — 문서 하나와 순서 있는 블록, 직함·티어 이름 텍스트.

```json
{
  "schemaVersion": 1,
  "locale": "ko-KR",
  "texts": { "office.S06.T1": "대통령", "tier.T1": "티어1" },
  "document": { "id": "doc.offices-and-ranks", "blockIds": ["block.offices.001"] },
  "blocks": [
    { "id": "block.offices.001", "kind": "heading", "level": 1, "inlines": [{ "kind": "text", "text": "관직" }] }
  ]
}
```

- 「국가별 관직표」 블록은 `state-office-titles.json`에서 행을 만들도록 `kind: "table"`에 `source: "relation:state-office-titles"`를 두거나, 표 셀 텍스트를 `texts` 키로 연결한다. 표 열 순서, 6열 형식, 머리글 `| 국가 | 티어1 |...`은 소비자 정규식 때문에 바이트로 보존한다.
- 국가 표시 이름은 국가 등록부(읽기 전용)에서 가져오되 저장하지 않는다. 등록부는 편집 대상이 아니다.
- 새로 정해야 하는 ID: 문서·블록 ID(`doc.*`, `block.offices.NNN`). 소유자 확인이 필요하다. 인물 ID는 발명하지 않는다.
- 표 밖 산문(서두, 국가별 서술, 치환 근거, 왜, 작위와 생업, 계승)은 전부 블록이다. 산문을 Markdown 템플릿으로 남기면 그 산문이 손 편집 원본이 되어 이중 정본이므로 택하지 않는다.
- `manifest.json`이 아직 없다(전체 정본 설계는 목표 상태). 파일럿은 이 도메인 하나만 `json-active`로 등록하는 최소 항목을 만든다.

## 5. 렌더러와 테스트 파일 (신규)

- `TOOL/tools/wiki/offices-render.mjs` — JSON에서 `LORE/offices/Offices-and-Ranks.md` 바이트를 결정적으로 생성. 선례: `world-atlas-render.mjs`.
- `TOOL/tools/wiki/test-offices-render.mjs`.
- 일회성 이관 스크립트: 임시 위치에서 실행 후 삭제, 커밋하지 않는다.

기존 소비자 파일은 변경하지 않는다. 생성된 Markdown이 현재와 바이트가 같으므로 `generate-catalog.mjs`(정규식), `wikiLinks.ts`, `publish-wiki.mjs`, 패티나 수령증, 개인 조직명 테스트가 그대로 동작해야 한다. 소비자를 JSON으로 직접 전환하는 일은 후속 파동이다(현재 `state_name` 조인을 `state_id`로 바꾸는 일 포함).

## 6. 기준선 (구현 전에 실행, 이번에는 실행하지 않음)

1. `shasum -a 256 LORE/offices/Offices-and-Ranks.md`, 줄 수, 표 행 수(5, 16, 5). 이 값을 이관 영수증에 기록.
2. `npm --prefix WEB/wiki run generate` 후 `git diff --stat WEB/wiki/src/generated/`로 무관한 기존 변경을 구분해 기록(작업 트리에 다른 변경이 있다).
3. `npm --prefix WEB/wiki run test:common-tiers`, `test:people`, `test:person-details`, `test:contract`, `test:links`.
4. `node --test TOOL/tools/wiki/test-patina-human-gate.mjs TOOL/tools/wiki/test-publish-wiki.mjs TOOL/tools/policy/test-private-organization-names.mjs`.
5. `/world/Offices-and-Ranks`의 기존 화면 텍스트(표 행 수, 제목 목록)를 `aside-agent`로 저장(수동 QA 비교용).

실패가 다른 작업의 미커밋 변경 때문인지 구분해 기록한다. 구현이 만든 실패만 고친다.

## 7. 먼저 실패해야 하는 테스트 (렌더러·JSON 부재 상태에서 작성)

1. 렌더 결과가 디스크의 `Offices-and-Ranks.md`와 바이트 동일하다(드리프트 게이트). 컷오버 시 한 번은 기준선 SHA와도 대조한다.
2. 같은 입력을 두 번 렌더하면 바이트가 같다. 디렉터리 열거 순서·시각·로케일에 의존하지 않는다.
3. 무결성: 티어 정확히 `T1`~`T5`; 국가 정확히 16, 국가마다 티어 5개(80행), `(state_id, tier_id)` 중복 없음, `state_id`가 등록부에 있음, `tier_id` 존재, `title_key`가 텍스트에 있고 비어 있지 않음. 하나라도 어긋나면 오류로 끝난다.
4. 블록: `blockIds` 중복·누락 없음, 모든 블록이 문서 하나에 속함, 표 셀 수가 열 수와 같음.
5. 소비자 의미 동등: 렌더된 표를 `generate-catalog.mjs`의 정규식과 같은 규칙으로 파싱한 `국가 -> [5직함]`이 JSON 관계에서 만든 값과 같다.
6. Markdown을 한 글자 바꾸면 1번이 실패한다(손 편집 차단).
7. 국가 표시 이름만 등록부에서 바꾸면 JSON은 그대로이고 표의 이름만 바뀐다(이름이 키가 아님).
8. 이관 도구 전용(폐기 대상과 함께): 표의 국가 이름이 등록부에 없으면 `E_UNMAPPED_STATE`로 실패하고 파일을 쓰지 않는다. 지원하지 않는 Markdown 문법을 만나면 조용히 버리지 않고 실패한다.

기존 회귀(통과 유지): `test:common-tiers`(1004명 모두 `T1`~`T5`), `test:people`, 패티나 게이트. 고정 sleep을 쓰지 않는다. 문구를 고정하는 테스트는 만들지 않는다(직함 값은 기계가 소비하는 값이라 대상이다).

## 8. 수동 Aside QA

브라우저는 `aside-agent`만 쓴다.

1. `npm --prefix WEB/wiki run build` 후 로컬 서빙.
2. `/world/Offices-and-Ranks`: 표 3개, 국가별 관직표 16행 x 5열, 기준선 화면 텍스트와 동일한지 확인(내용·표·링크만).
3. 인물 목록(`/people`)에서 「공통 티어」 필터가 T1~T5로 동작하고 건수가 기준선과 같은지, 임의 인물 상세에 티어가 표시되는지 확인.
4. 문서 안 상대 링크 두세 개(`야망`, `후계 …`)가 도달하는지 확인.

대표 데스크톱 표면에서만 확인하고 플랫폼별 검증은 하지 않는다.

## 9. 이중 정본이 생기지 않는 컷오버

1. 컷오버 전: `Offices-and-Ranks.md`가 유일한 정본이고 JSON은 후보다. 후보와 원본을 동시에 편집하지 않는다. 컷오버 직전에 파일이 미커밋 편집 없이 깨끗한지 다시 확인한다.
2. 컷오버는 한 커밋에서 원자적으로 한다: JSON 3개 + 최소 manifest 항목 + 렌더러 + 테스트 추가, `Offices-and-Ranks.md`를 렌더 결과로 교체(바이트 동일), `LORE/AGENTS.md`의 「직접 편집 가능 문서」 목록에서 이 문서를 생성물로 옮김.
3. Markdown에 `생성물` 머리 배너를 넣지 않는다. 바이트가 바뀌고 공개 본문에 내부 메타가 노출된다(`JSON-Relational-Canon.md` 5절). 대신 테스트 1번(드리프트)과 manifest 상태가 직접 편집을 막는다.
4. Markdown을 읽어 JSON을 갱신하는 경로를 만들지 않는다. 일회성 이관 도구는 삭제한다. `generate-catalog.mjs`는 생성된 Markdown을 읽기만 한다.
5. 파일럿 밖 문서와 design-store 파생물, `WEB/wiki-source` 미러는 손대지 않는다. 미러는 기존 `publish-wiki`/`mount` 절차로 재생성되며 바이트가 같으므로 차이가 없어야 한다.

## 10. 롤백

- 머지 전(컷오버 커밋 전후 모두): 컷오버 커밋 하나를 되돌리면 신규 파일이 사라지고 Markdown이 원래 손 편집 원본으로 돌아온다. 되돌릴 소비자 배선이 없다.
- 머지 후: `JSON-Relational-Canon.md` 11절대로 Markdown을 다시 쓰기 가능한 정본으로 열지 않는다. 마지막 승인된 JSON 묶음(JSON+렌더러+영수증)으로 복구하고 JSON에서 고쳐 다시 검증한다. 불일치는 명시적 실패로 보고한다.

## 11. 소유자 확인이 필요한 것과 한계

- `doc.*`/`block.*` ID 형식, `LORE/canon/...` 경로와 최소 manifest 항목의 도입 시점.
- 관직표(`교헌필사정`)와 H3 제목(`원불교`)의 명칭 병존은 저작 문자열로 그대로 보존한다. 어느 쪽이 공개 표기인지는 이 파일럿이 정하지 않는다.
- 이 조사는 코드를 실행하지 않았다. 위 명령과 수치(줄 수, SHA, 80행 등)는 구현 전 기준선에서 다시 확인해야 한다.
- 소비자 `generate-catalog.mjs`의 이름 기반 조인(`state_name`)을 `state_id`로 바꾸는 일은 파일럿에 넣지 않았다. 바이트 동일 생성으로 기존 소비자가 그대로 유지되기 때문이다.
