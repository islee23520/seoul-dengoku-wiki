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
- `sources[]` 한 항목은 `{ "id", "url", "accessed", "quote", "evidence" }` 전부를 채운다.
  - `url`은 실제로 연 주소, `accessed`는 `YYYY-MM-DD`.
  - `quote`는 그 주소에서 **그대로 복사한** 문장이다. 요약·번역·재작성은 인용이 아니다.
  - `evidence`는 저장소 안 원자료 경로(`Research/verification/hangnyeol/raw/*.md`)다.
    검사기는 그 파일을 열어 `quote`가 실제로 들어 있는지 대조한다(공백만 정규화).
- 출처가 필요한 행은 `sources: ["<source id>"]`로 참조한다. 참조가 풀리지 않으면 실패한다.
- `id`는 파일 안에서 유일하다.

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
