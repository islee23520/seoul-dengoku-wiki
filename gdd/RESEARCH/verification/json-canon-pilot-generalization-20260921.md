# JSON 정본 관직 파일럿 일반화 감사 (2026-09-21)

읽기 전용 감사다. 코드는 바꾸지 않았다. 워크트리 `/Volumes/gameWorkspace/worktrees/seoul-kenshi/wiki-updates-state-selection`.

작성 방법 주의: 이 세션에는 `apply_patch`가 없어 파일 생성 도구(`Write`)로 이 파일 하나만 썼다.

## 1. 결론

1. 두 번째 도메인을 옮기기 전에 공유해야 하는 것은 **오류 타입, 중복 키를 거절하는 JSON 읽기, 안정 직렬화·SHA-256, 유일·FK·카디널리티 검사 헬퍼, 원자적 쓰기와 드리프트 검사, 최소 manifest**다. 이 여섯 개가 `TOOL/tools/canon/`의 2차 파동 범위다.
2. 순서 있는 문서 블록 렌더러, 스키마 실행기(Ajv), 출처 영수증(corpus hash)은 **두 번째 도메인이 실제로 필요로 할 때** 넣는다. 지금 넣으면 호출자가 하나뿐인 추상이 된다.
3. **두 번째 도메인은 지금 근거로 확정할 수 없다.** 이유와 선행 조건은 5절이다. 억지로 이름을 붙이지 않는다.
4. 관직 코드는 두 번째 호출자가 같은 PR에 들어올 때만 공유 모듈로 옮긴다. 그 전에는 건드리지 않는다.

## 2. 읽은 대상

- `GDD/architecture/JSON-Relational-Canon.md` (198줄, 전체)
- `TOOL/tools/wiki/offices-canon.mjs` (122줄), `offices-render.mjs` (88줄), `test-offices-canon.mjs` (155줄)
- `LORE/canon/schema/offices.schema.json` (136줄), `tables/office-tiers.json`, `relations/state-office-titles.json`, `locales/ko-KR/offices-and-ranks.json` (앞부분), `LORE/offices/AGENTS.md`
- `RESEARCH/verification/json-canon-alternative-pilot-20260921.md` (앞 60줄)
- `TOOL/tools/package.json`의 scripts, `LORE/characters/Cast-Relations.md` 앞 25줄과 크기

## 3. 관직 파일럿의 현재 상태 (확인한 사실)

- `LORE/canon/`, `LORE/offices/AGENTS.md`, `offices-canon.mjs`, `offices-render.mjs`, `test-offices-canon.mjs`는 모두 **추적되지 않는 파일**(`??`)이고 `LORE/offices/Offices-and-Ranks.md`는 수정 상태(`M`)다. 파일럿은 아직 커밋되지 않았다.
- `TOOL/tools/package.json`의 `test` 스크립트와 전용 스크립트 어디에도 관직 테스트가 없다. 관직 테스트는 AGENTS.md가 안내하는 수동 명령(`node --test TOOL/tools/wiki/test-offices-canon.mjs`)으로만 돈다. CI가 드리프트를 막지 못한다.
- 생성된 Markdown 첫 줄은 `# 관직`이다. 생성 배너가 없다. 생성물 가드는 `LORE/offices/AGENTS.md`의 산문 규칙과 `--check` 옵션뿐이다.
- 계약이 말하는 manifest(`GDD/canon/manifest.json`)는 존재하지 않는다. `LORE/canon/manifest.json`도 없다. 도메인 상태(`legacy-readonly`/`json-active`)를 기록하는 곳이 없다.
- 테스트는 `S08` 제목을 `원불교`에서 `교헌필사정`으로 바꾼 내용 변경을 함께 고정한다(`BASELINE_SHA` 테스트와 「only the S08 heading differs」 테스트). 마이그레이션과 내용 수정이 한 파일럿에 섞여 있다. 이 내용 변경은 소유자 확인 이력을 이번에 확인하지 않았다.

## 4. 관심사별 구분: 도메인 전용 vs 공유 필요

| 관심사 | 관직 코드의 현재 모습 | 판정 |
|---|---|---|
| manifest 소유·상태 | 없음. 파일 경로는 `OFFICES_FILES` 상수에 하드코딩 | **공유**. 도메인 둘부터 필요. 최소형: 도메인 ID, 상태, 입력 파일, 출력 파일 |
| 안정 직렬화 | 없음(테스트 sandbox가 `JSON.stringify(_, null, 2)`로 쓴다) | **공유**. 계약 7절의 RFC 8785는 미구현 |
| JSON 읽기 | `readJson`이 `JSON.parse` 후 `schemaVersion`만 확인. `E_FILE_MISSING`, `E_JSON_MALFORMED`, `E_SCHEMA_VERSION` 코드는 일반적이다 | **공유**. 다만 `JSON.parse`는 **중복 객체 키를 조용히 삼킨다.** 계약 6절은 파싱 단계 거절을 요구하므로 현재 계약 위반이다 |
| 스키마 검증 | `offices.schema.json`이 있으나 **어떤 코드도 실행하지 않는다.** 로더가 `BLOCK_KINDS`, 셀 정규식 등을 손으로 다시 검사한다. 스키마 자신의 description도 "FK와 순서는 코드가 강제한다"고만 말한다 | **공유**. 이중 소유(스키마와 손 검사)는 어긋난다. 실행기 채택은 의존성 추가라 승인이 필요하다 |
| PK 유일 | `uniqueBy(rows, keyOf, code, label)` | **공유**. 이미 일반형이다 |
| 복합키 유일·FK·카디널리티 | `validateTitles`가 `stateId:tierId` 유일, FK 3종, `국가 수 x 티어 수` 완전성을 한 함수에 섞는다 | 헬퍼(`uniqueComposite`, `requireFk`)만 **공유**. 「전 국가 x 전 티어」 완전성 규칙은 **관직 전용** |
| 순서 있는 블록 검증 | `validateDocument`: blockIds 중복·대칭 차이·kind·heading level은 일반적. 표의 `source === 'state-office-titles'`와 `header.length === tierCount + 1`은 관직 전용 | 일반부는 **공유 후보**, 표 소스는 **도메인 전용 훅** |
| 블록 렌더러 | `renderBlock` switch: heading(1~3), paragraph, table, inline text/link. `renderTable`이 관직 관계를 직접 안다 | 두 번째 도메인이 같은 종류만 쓰면 **공유**, 새 종류(list, quote, code, image, emphasis, citation)가 필요하면 그때 확장. 표의 파생 행 생성은 **도메인 전용 훅** |
| 렌더러의 한계 | 링크 URL 스킴 검사 없음(빈 문자열만 거절), 셀의 `|`·개행은 이스케이프 대신 거절, 강조·목록·인용·이미지 미지원 | 알려진 한계. 두 번째 도메인 요구가 정한다 |
| 원자적 쓰기·드리프트 | `materializeOffices`: 임시 파일에 쓰고 `rename`, `--check`는 문자열 비교 후 `E_DRIFT`. 실패 시 임시 파일 정리, 검증 실패는 출력 파일을 건드리지 않음(테스트로 확인). fsync 없음 | **공유**. 도메인 이름이 없는 순수 로직이다 |
| provenance·해시 영수증 | 없음. 계약 7절의 원천 JSON 해시·corpus hash·출력 해시 미구현. 테스트의 `BASELINE_SHA`는 이관 전 원문 특성 고정용이다 | **공유하되 후속**. 출력이 둘 이상이 될 때 의미가 있다 |
| locale 처리 | 경로 `locales/ko-KR/...`와 `locale: const "ko-KR"`가 하드코딩. fallback, `sourceTextHash`, `reviewStatus` 없음 | 후속. 계약이 한국어 단일 원문을 기본으로 두므로 두 번째 도메인 전에 만들 필요 없음. 경로 규칙만 manifest가 소유 |
| 생성 파일 가드 | 배너·CI 없음 | **공유**. 배너 문자열 하나와 `--check` 진입점 규약 |
| CLI 규약 | `--check` 하나, 성공은 `console.log`, 도메인 오류는 `exitCode = 1`, 그 외 오류는 재던짐. `import.meta` 진입점 가드 | **공유**. 이미 다른 도구도 `--check`류를 쓴다(6절) |
| 오류 클래스 | `OfficesCanonError`(이름이 도메인 전용). 코드 접두는 `E_`로 일반적 | **공유**. `CanonError`로 일반화하되 코드 문자열은 유지 |
| 테스트 헬퍼 | `sandbox(mutate)`(canon 복사, `edit(key, fn)`), `rejects(promise, code)`. `files` 맵을 코드의 `OFFICES_FILES` 대신 테스트에 다시 적었다 | **공유**. 헬퍼는 도메인 이름을 모르게 만들 수 있다. 「소비자 정규식이 JSON과 같은 맵을 읽는다」 테스트는 **도메인 전용** |
| 국가 등록부 | `loadStateRegistry`가 `World-Narrative-Atlas.md`를 파싱(`extractAtlasJson`)해 `Map(S-ID -> 표기명)` 생성. 로더는 `registry`를 **인자**로 받는다 | 인자로 받는 경계가 옳다. 등록부 로더는 **도메인 전용 접착 코드**로 남긴다 |

## 5. 두 번째 도메인: 근거가 충분하지 않다

확정하지 않는 이유(확인한 사실):

- `LORE/characters/Cast-Relations.md`는 계약 10절이 조건부로 우선 선정한 후보이고 작업 트리에서 수정되지 않았다(`git status` 출력 없음). 그러나 73,050 B에 표 줄이 793개이고 **인물 열이 표시 이름**이다(앞 25줄 확인). 계약은 표시 이름을 FK로 쓰는 것을 금지하고 ID 매핑 감사 100%를 선행 조건으로 건다. 그 감사는 이 저장소에 완료 기록이 없다(이번에 찾지 못했다).
- 소비자가 셋이다: `TOOL/tools/wiki/verify-cast.mjs:287`, `WEB/wiki/scripts/generate-catalog.mjs:400`, `TOOL/tools/wiki/publish-wiki.mjs:20`. 관직처럼 「소비자 코드를 안 바꾸고 결정적 Markdown만 같게」 증명하는 범위가 더 넓다.
- `LORE/culture/Martial-Paths.md`는 앞선 조사와 계약이 이미 제외했다. `LORE/goods/Era-Arms-and-Tech-Level.md`는 지금 수정 상태(`M`)라 제외한다.
- `LORE/economy/*.md`(5.5~7.7 KB 세 개), `LORE/ailments`, `LORE/structures`는 **읽지 않았다.** 표가 적거나 소비자를 확인하지 않아 후보로 올릴 근거가 없다.

따라서 지금 적을 수 있는 정직한 사양은 이렇다.

> **선행 조건**: (a) 후보 3개 이하를 같은 기준으로 감사한다 — 작업 트리 미수정, 표와 산문이 함께 있음, 키가 영구 ID(`S`/`K`/`G` 등)로 닫힘, 기계 소비자 목록화. (b) 관직 파일럿의 커밋과 CI 배선. (c) Cast-Relations를 고르려면 인물 ID 대응 감사 100%, 모호성 0.

감사 없이 도메인 이름을 정하는 것은 이 문서가 금지하려는 추측이다.

## 6. 관직 코드와 기존 도구의 중복 신호 (읽지 않은 부분 표시)

- `TOOL/tools/wiki/patina-human-gate.mjs:15`에 로컬 `sha256` 헬퍼와 영수증 비교(`document.sha256 !== sha256(text)`)가 이미 있다. 관직 테스트도 자체 `sha256`을 만든다. 해시 함수는 이미 세 곳에서 반복이다.
- `materialize-world-atlas.mjs`, `publish-wiki.mjs`, `world-atlas-parse.mjs`가 `rename(`, `--check`, `createHash` 중 하나 이상에 걸린다(grep 결과). **내용은 읽지 않았다.** 원자적 쓰기·드리프트 로직이 겹치는지는 미확인이다. 겹친다면 관직 외 진짜 두 번째 호출자가 이미 존재하는 셈이라 도메인 이관 없이도 `emit` 모듈의 두 번째 호출자가 될 수 있다. 이것이 **가장 싼 2차 파동의 후보**이며, 코드를 읽어 확정해야 한다.

## 7. 권고: 가장 작은 2차 파동

원칙: 호출자가 둘 확인된 것만 `TOOL/tools/canon/`에 둔다. 관직 코드는 그 PR에서 새 모듈을 호출하도록 **최소로** 바꾼다(그것이 두 번째 호출자 증거이고 관직 테스트 12개가 안전망이다). 관직만을 위한 선제 리팩터는 하지 않는다.

파동 0(선행, 코드 변경 없음이 아니라 정리): 관직 파일럿을 커밋하고 `package.json`에 테스트·`--check`를 배선한다. `S08` 제목 변경의 소유자 확인 이력을 확인한다.

파동 1 — 프리미티브(전부 도메인 이름 없음):

| 파일 | 내용 | 두 번째 호출자 |
|---|---|---|
| `TOOL/tools/canon/errors.mjs` | `CanonError(code, detail)` | 관직 + 새 도메인 |
| `TOOL/tools/canon/json-io.mjs` | `readCanonJson`(중복 키 거절, `schemaVersion` 확인), `stableStringify`, `sha256` | 관직 + `patina-human-gate.mjs`의 `sha256` |
| `TOOL/tools/canon/integrity.mjs` | `uniqueBy`, `uniqueComposite`, `requireFk`, `requireCount` | 관직 + 새 도메인 |
| `TOOL/tools/canon/emit.mjs` | `writeAtomic`, `checkDrift`(`E_DRIFT`), 생성 배너 상수 | 관직 + (6절의 `materialize-world-atlas.mjs`, 읽고 확인한 뒤) 또는 새 도메인 |
| `TOOL/tools/canon/manifest.json` 또는 `LORE/canon/manifest.json` 스키마와 로더 | 도메인 ID, 상태, 입력 파일, 출력 경로, 스키마 판본 | 도메인이 둘이 되는 순간 필요. 위치는 계약이 `GDD/canon/manifest.json`을 말하므로 소유자 확인 |
| `TOOL/tools/canon/test-helpers.mjs` | `sandbox`, `rejects` | 관직 테스트 + 새 도메인 테스트 |

파동 1의 순 효과는 계약 6절 위반(중복 키 미거절) 하나를 공유 계층에서 고치는 것이다. 이미 통과 중인 관직 테스트는 그대로 통과해야 한다.

파동 2 이후로 미룬다: 블록 렌더러 일반화(새 블록 종류 요구가 생길 때), Ajv 도입(의존성 추가 — 승인 필요, 승인 전에는 손 검사 유지), corpus hash 영수증(출력이 둘 이상), locale fallback.

## 8. 확인한 것과 하지 않은 것

확인: 위 2절 파일의 내용, 관직 파일의 미추적 상태, `package.json` scripts에 관직 테스트 부재, `Cast-Relations.md`의 이름 키 표와 소비자 세 곳, `Era-Arms-and-Tech-Level.md` 수정 상태.

미확인: 관직 테스트 실행 결과(이번에 실행하지 않았다), `materialize-world-atlas.mjs`·`publish-wiki.mjs`의 중복 정도, `S08` 제목 변경의 승인 이력, `TOOL/tools/package.json`에 Ajv 등 스키마 실행기가 이미 있는지, 경제·질병·구조 문서의 표 구조와 소비자, 관직 locale JSON의 나머지 본문(앞 700자만 읽음).
