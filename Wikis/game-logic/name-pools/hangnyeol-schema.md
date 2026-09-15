# 성씨·본관·항렬 데이터 계약

이 문서는 `name-pools/` 아래 네 파일의 필수 칸과 검사 규칙을 정한다. 기계 검사는
`Tool/tools/wiki/verify-hangnyeol.mjs`이며, 여기 적힌 규칙과 코드가 어긋나면 코드가 정본이다.

검사 실행:

```bash
node Tool/tools/wiki/verify-hangnyeol.mjs            # 데이터 계약
node Tool/tools/wiki/verify-hangnyeol.mjs --cast     # 인물 적용까지
node Tool/tools/wiki/test-verify-hangnyeol.mjs       # 검사기 단위 테스트
```

## 공통 규칙

- 모든 파일은 `{ "id", "schema", "note", "sources": [...] }` 를 가진다.
- `sources[]` 한 항목은 `{ "id", "url", "accessed", "quote", "evidence", "live_check" }` 전부를 채운다.
  - `url`은 실제로 연 주소, `accessed`는 `YYYY-MM-DD`.
  - `quote`는 그 주소에서 **그대로 복사한** 문장이다. 요약·번역·재작성은 인용이 아니다.
  - `evidence`는 저장소 안 원자료 경로(`Research/verification/hangnyeol/raw/*.md`)다.
    검사기는 그 파일을 열어 `quote`가 실제로 들어 있는지 대조한다(공백만 정규화).
- 출처가 필요한 행은 `sources: ["<source id>"]`로 참조한다. 참조가 풀리지 않으면 실패한다.
- `id`는 파일 안에서 유일하다.

## 라이브 재대조 (`live_check`)

원장 대조만으로는 부족하다. 원자료를 쓴 쪽이 인용을 지어내면 그 인용은 자기 파일 안에
그대로 들어 있으므로 원장 대조를 통과한다. 그래서 **URL을 다시 열어 본 독립 판정**을
행에 묶는다.

| 값 | 뜻 | 추가로 요구하는 칸 |
|---|---|---|
| `verbatim_ok` | 재대조에서 인용이 그 주소에 축자로 있었다 | `record_id`, `live_check_ref` |
| `artifact_corrected` | 재대조 결과가 `MISMATCH`였고, 그 차이가 공백·둥근따옴표·NBSP·표 행 분리 같은 표기 차이였다. 보고가 적어 둔 실제 본문을 인용으로 쓴다 | `record_id`, `live_check_ref` |
| `unchecked` | 아직 재대조하지 않았다 | 없음 |

- `live_check_ref`는 재대조 보고 경로(`Research/verification/hangnyeol/raw/_verify-*.md`)다.
- `record_id`는 그 보고의 표에 있는 수확 레코드 id다. 검사기는 보고에서 그 id 칸을 찾아
  판정 토큰(`VERBATIM_OK` / `MISMATCH`)이 선언과 맞는지 확인한다. **부분 문자열이 아니라
  표의 한 칸이 정확히 같아야 한다.**
- `verbatim_ok`이라 적었는데 보고가 `MISMATCH`라고 하면 실패한다. 그 반대도 실패한다.
- 검사기는 요약에 `live_verified=<비율>%`를 찍는다. 이 값은 `sourced=`와 다른 것을 센다.
  `sourced`는 행이 출처를 가리키는지, `live_verified`는 그 출처를 실제로 다시 열어 봤는지다.
- 재대조에서 **주장 자체가 틀린** 레코드(예: 인용한 URL이 다른 항목이었다)는 `live_check`를
  고쳐 다는 것이 아니라 데이터셋에서 **뺀다.**

## surnames-bongwan.json

```json
{
  "surnames": [
    {
      "id": "kim",
      "hangul": "김",
      "hanja": "金",
      "population_2015": 10689959,
      "sources": ["s-a2-kim"],
      "bongwan": [
        { "id": "kim-gimhae", "name": "김해", "hanja": "金海",
          "population_2015": 4456700, "sources": ["s-a3-gimhae"] }
      ]
    }
  ]
}
```

- 성씨 행 필수 칸: `id`, `hangul`, `sources`, `bongwan`.
- 본관 행 필수 칸: `id`, `name`, `sources`.
- 인구 수치를 적으면 그 수치가 든 인용이 출처에 있어야 한다.
- 기존 `surnames.json`의 성씨는 전부 이 파일에 있어야 한다(누락은 실패).

## hangnyeol-systems.json

```json
{
  "systems": [
    { "id": "ohaeng", "name": "오행상생법", "summary": "...",
      "sequence": ["木", "火", "土", "金", "水"], "sources": ["s-b1-ohaeng"] }
  ]
}
```

- 필수 칸: `id`, `name`, `summary`, `sources`.

## clan-hangnyeol-tables.json

```json
{
  "clans": [
    { "id": "gimhae-kim", "surname": "김", "bongwan": "김해", "branch": "삼현파",
      "provenance": "verified", "sources": ["s-c01-kim-table"],
      "rows": [ { "sesu": 71, "hangnyeol": "종", "hanja": "鍾", "position": "first" } ] }
  ]
}
```

- `provenance`는 `verified` 또는 `creative` 둘 중 하나다.
- **`verified`**: 실제로 공표된 문중 항렬표. 문중과 행 모두 출처를 요구한다.
- **`creative`**: 세계관 창작 가계. `creative_rationale`과 `method_ref`(systems id)를 요구하고,
  **출처를 달 수 없다.** 창작 표에 실존 출처를 붙이는 순간 위조이므로 검사기가 막는다.
- 한 문중 표 안에서 `verified` 행과 `creative` 행을 섞지 않는다. 행이 문중과 다른
  `provenance`를 선언하면 실패한다.
- `position`은 `first`(상자) 또는 `second`(하자)다.
- `sesu`는 정수이며 한 표 안에서 중복되지 않는다.

## cast-hangnyeol.json

```json
{
  "people": [
    { "name": "한재목", "surname": "한", "status": "applied",
      "clan": "cheongju-han", "branch": "...", "sesu": 34,
      "hangnyeol": "재", "position": "first", "reason": "..." },
    { "name": "백온", "surname": "백", "status": "unused",
      "reason": "한 글자 이름이라 항렬자를 넣을 자리가 없다" }
  ]
}
```

- `status`는 `applied`·`unused`·`unconfirmed` 중 하나이고, 셋 다 `reason`을 요구한다.
  미사용과 미확인은 다른 상태다.
- `applied`는 `clan`·`sesu`·`hangnyeol`·`position`을 모두 요구한다.
  - `clan`은 `clan-hangnyeol-tables.json`의 문중 id로 풀려야 한다.
  - 그 문중 표의 `sesu` 행에 같은 `hangnyeol`이 있어야 한다.
  - **항렬자가 실제 이름의 그 자리에 있어야 한다.** 이름에 없는 글자를 적용했다고
    적을 수 없다.
- `unused`·`unconfirmed`는 `hangnyeol`을 적지 않는다.
- 같은 문중·분파에서 같은 세수는 같은 항렬자를, 다른 세수는 다른 항렬자를 쓴다.
  나이는 세수의 근거가 아니다.

## 하지 않는 것

- 출처 없는 인구 수치·항렬자 기재
- 창작 가계 표에 실존 문중 출처를 붙이는 일
- 한 표 안에서 실존 자료와 창작 자료를 섞는 일
- 기존 인물의 소급 개명
