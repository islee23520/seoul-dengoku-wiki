# 문서 재작성 파이프라인

`data/sql/*.sql`은 이 저장소의 단독 정본이다(#721). 위키 문서 본문은 PostgreSQL을 거치지 않고
**초안 파일 → `scripts/pages/rewrite-doc.mjs` → `data/sql/030-wiki-documents.sql` 전체 재직렬화** 경로로 바꾼다.
폐기된 일회용 내보내기 `scripts/pages/export-sql.mjs`는 재실행 가드로 막혀 있다(`--force-resync` 없으면 exit 1).

## 초안 작성 (`docs/drafts/`)

- 파일명은 `<slug>.ko.md`, `<slug>.en.md`. 두 언어는 한 쌍으로 함께 제출한다.
- 파일은 `---` 두 줄 사이의 front matter로 시작한다:

```
---
title: New English Title
title_ko: 새 한국어 제목
model: gemini-3-pro
section_checkpoint: G07 1-4절 완료
---
(이 뒤의 모든 내용이 본문이다)
```

- 네 필드 모두 값은 **줄 끝까지 그대로 저장된다** — 줄 안 주석 문법이 없다. 단 `model:` 값은 예외적으로 모델 id 뒤에 세미콜론(`;`)으로 구분한 출처 기록(호출 횟수·작성 방식·실제 모델 경위)을 붙일 수 있다(2026-11-11 W5-28 확정). 도구는 줄 전체를 그대로 저장하고 어떤 검사도 이를 거부하지 않는다. 출처 기록은 저자 표시의 정직한 근거다.
  - `title`(선택): 있을 때만 행의 영어 title을 바꾼다. `title_ko`(선택): 있을 때만 한국어 title_ko를 바꾼다.
  - `model`(필수): 초안을 만든 모델 id. 빈 값이면 기각된다.
  - `section_checkpoint`(선택): 절 단위 진행 기록으로, 재개 지점 식별에만 쓰인다.

- 닫는 `---` 행 다음 줄부터 파일 끝까지가 그대로 `body_ko_md`(ko 파일) / `body_md`(en 파일) 값을 통째로 교체한다.
- **긴 문서는 절 단위로 이어 쓴다.** 조각은 `<dir>/<slug>.ko.md.part-<n>` 파일에 쌓고, 완성본을 합쳐
  최종 `<slug>.ko.md`로 저장한다. 파이프라인은 최종 파일만 소비하며 `.part-*` 조각은 무시한다.
  `model:`과 `section_checkpoint:`가 항상 기록돼 있어야 중단된 초안을 어느 절까지 썼는지 식별하고
  이어 쓸 수 있다 — 이 두 값이 긴 문서의 재개 가능성을 만든다.

## 실행

```bash
node scripts/pages/rewrite-doc.mjs --drafts docs/drafts --dry-run   # 검사만, 쓰지 않음
node scripts/pages/rewrite-doc.mjs --drafts docs/drafts             # 실제 반영(전체 재직렬화 후 기록)
node scripts/pages/rewrite-doc.mjs --roundtrip                      # 무변경 재직렬화가 원본과 바이트 동일인지 검증
node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --scope <slug>,<slug> [--json out.json]
```

- `--only slug,slug`: 이번 배치가 다룰 문서로 한정한다. `--sql-dir <dir>`: 사본 디렉터리를 대상으로
  실행한다(검증·스모크용; 기본은 저장소 `data/sql`).
- `--allow-single-language` / `--allow-shrink`는 해당 불변식을 명시적으로 완화할 때만 쓴다.
- 일반 실행은 기존 행만 UPDATE 하며 030에 없는 slug의 초안은 언제나 exit 2로 거부한다.

## 새 문서 행 추가 (`--add-slug`)

```bash
node scripts/pages/rewrite-doc.mjs --add-slug <slug> --category <id> [--title <en>] [--title-ko <ko>] [--dry-run] [--sql-dir <dir>]
```

- 문서 slug의 정본 목록은 `docs/canon-slugs.json`(61개, `docs/CANON-BIBLE.md` 7.1)이다. 목록에 없는 slug와
  이미 030에 있는 slug는 exit 2로 거부한다. `--category`가 없으면 exit 1, `wiki_category`에 없는 분류도 exit 1이다.
- 030 끝에 INSERT 1행을 기존 직렬화 그대로(같은 열 순서, 작은따옴표 2배 이스케이프) 붙인다. `sort`는 그 분류의
  최댓값 + 1이다. 본문은 H1 하나와 "작성 중" 문장 하나(ko/en)이며 명시 앵커가 없어 두 언어의 앵커 집합이 같다.
  이후 같은 slug의 초안은 일반 실행으로 이 행을 UPDATE 한다(작성 중 본문은 짧으므로 `--allow-shrink`가 필요 없다).
- 쓰기 전과 쓴 뒤에 파일을 다시 파싱·적재해 행 수(기존 + 1), slug 순서, 바이트 왕복을 검사한다.
- 기존 030의 머리말 뒤 빈 줄 수만 정규 형식과 다르면 정규 형식(빈 줄 1개)으로 다시 쓰고, 그 밖의 차이가 있으면 exit 10으로 멈춘다.
- 반영 결과는 slug별로 ko/en 바이트 전후(비율), 마크다운 제목 수, 앵커 수, model id를 출력한다.
- 실제 변경을 기록할 때만 030의 둘째 머리말이 정본 안내 문구로 교체된다(2026-11-10 커밋으로 이미 교체됨).
  재작성 검증은 언제나 `--roundtrip`을 먼저 돌려 직렬화 무손실을 확인한다.

## 불변식과 종료 코드

쓰기 전에 아래 불변식을 검사한다. 위반 시 각각 다른 0이 아닌 코드로 끝나고 메시지에 slug가 있다.

| 코드 | 불변식 |
|---|---|
| 2 | slug가 `wiki_document`에 없거나 행 수가 파싱 결과와 다르다. `--add-slug`: slug가 `docs/canon-slugs.json`에 없거나 이미 있다 |
| 3 | 한 언어 초안만 제출됨(`--allow-single-language` 필요) |
| 4 | ko/en 명시 앵커(`<a id="...">`) id 집합 불일치 |
| 5 | ko/en 마크다운 제목(`#`로 시작하는 줄) 수 불일치 |
| 6 | 새 본문이 교체 대상 본문의 50% 미만(바이트 기준, `--allow-shrink` 필요) |
| 7 | front matter의 `model:` 값이 비었음 |
| 8 | 본문에 NUL 바이트 또는 순서가 잘못된 HTML 주석(열지 않은 닫기 `-->`, 중첩 여는 `<!--`, 끝까지 닫히지 않음). 빈 주석 `<!---->`은 여·닫 순서가 맞으므로 허용한다 |
| 10 | `--roundtrip` 재직렬화가 원본과 바이트 불일치 |
| 11 | 처리할 초안이 없음(디렉터리·slug 불일치 포함) |
| 12 | SQL 적재 실패 |

앵커·제목 비교는 새 ko 본문과 새 en 본문을 맞대며, 한 언어만 제출됐을 때는 다른 언어의 **현재** 본문과 맞댄다.

## 용어 스캔 (`docs/canon-terms.json`)

금지/필수 표 `{forbidden:[…], required:[…]}`는 지금 **스타터 세트**(각 항목의 `note`에 표시)이며
이후 canon-bible 작업이 교체한다. 항목 필드: `id`, `pattern`(정규식), `flags`, `lang`(`ko`/`en`/`both`),
`allowedContext`(정규식 문자열 배열 — 일치 문맥에서는 면제), `note`; `required`에는 `minPerDoc`, `docs`가 더 붙는다.

- 원천 3가지: 기본은 `data/sql` 본문, `--html <dist-dir>`은 빌드된 HTML의 **가시 텍스트만**
  (script/style/HTML 주석/태그 제거, href 속성은 결코 스캔하지 않음), `--url <base>`는 같은 추출 모듈로
  라이브 페이지(`<base>/wiki/<slug>/`, `<base>/ko/wiki/<slug>/`)를 검사한다.
- 금지 패턴은 기존 히트 기준선과 무관하게 **항상** 검사한다 — 기준선이 0이어도 새로 1건 나타나면 실패다.
- `--scope`는 이번 배치가 교체한 문서로 판정을 한정하고, `--all`은 전수 검사한다.
- `--md <파일|디렉터리>[,…]`는 SQL 밖의 마크다운을 그대로(URL 속 이름까지) 검사한다. 디렉터리는 안의 `*.md` 전부다.
  **`docs/design`과 `docs/research`의 필수 게이트다**: 이 두 디렉터리를 바꾸는 과제는 끝내기 전에
  `node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --md docs/research,docs/design`가 0이어야 하고, 게이트 검토자도 같은 명령을 돌린다.
  `--md`는 필수 표를 적용하지 않고 `--scope`/`--all`/`--html`/`--url`/`--sql-dir`과 함께 쓸 수 없다. 출처 주소에는 이름 대신 `pageid=` 형식을 쓴다.
- 다른 게임 이름(`tw-*` 항목)은 손으로 고르지 않고 `docs/canon-terms-sources/`의 커밋된 Fandom 분류 제목 스냅샷에서
  `node scripts/pages/gen-tw-bans.mjs`로 만든다(`--check`는 현재 파일이 생성 결과와 같은지만 확인, `--fetch`만 네트워크를 쓰고 스냅샷을 새로 받는다).
  일반 영어·오탐 단어는 `tw-stoplist.txt`의 수동 구역에서 조정하고, 이름 보강과 한국어 표기는 `tw-extra.txt`에서 고친다. `tw-*` 항목을 `canon-terms.json`에서 직접 고치지 않는다.
- 위반 시 slug·패턴 id·60자 문맥을 출력하고 exit 1, 통과 시 건수를 출력하고 exit 0. `--json`으로 보고서 파일을 남긴다.
