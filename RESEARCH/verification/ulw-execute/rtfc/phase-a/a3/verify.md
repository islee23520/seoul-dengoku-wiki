# A3 독립 검증 — 기증 절 카탈로그 참조 (정정 커밋 포함 재검증, 2026-09-07)

브랜치: `rtfc/phase-a` (워크트리 `/Users/ilseoblee/workspace/seoul-kenshi-wt/rtfc-phase-a`)
대상 커밋 3개 (`origin/main..HEAD`):

1. `9132faa339efc685e220ac6e0d7b8575b42d79ed` — `feat(art): 오드랜드 기증 카탈로그 — 분류기·계약 테스트·카탈로그 산출`
2. `80195b727f6387803e72cd2f3f3b8ba30fb4c47e` — `docs(pipeline): 기증 절에 카탈로그 참조 추가`
3. `97d693e1cefbb224e69f24a876ba9c018b06dfb4` — `fix(art): 카탈로그 분류 정정 — SpineAssets 텍스트 family·Res/Prefabs 캐릭터 프리팹, RED 증거 추가`

이 문서는 정정 커밋(`97d693e`) 반영 후의 재검증 기록으로, 이전 판의 disposition 수치(blockout-geometry 2176·character-poc-only 532)를 대체한다.

## ① node --test tools/art/test-oddland-catalog.mjs

```
✔ catalog contract and manifest coverage (13.153666ms)
✔ classification samples (4.432292ms)
✔ markdown totals agree (2.710375ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

결과: **'# fail 0' 확인, exit 0** — 통과

## ② node tools/art/catalog-oddland-donor.mjs --check (2회)

```
catalog check OK   (1회차, exit 0)
catalog check OK   (2회차, exit 0)
```

결과: **2회 모두 exit 0** — 통과

## ③ node tools/art/catalog-oddland-donor.mjs --summary

```
Oddland catalog: 7712 assets
```

## ④ 카탈로그 JSON 무결성 (node -e)

`docs/assets/bom/donor/oddland-asset-catalog.json`:

- `rows.length === 7712` ✓
- `Res/Prefabs/Character` 프리팹 전부 `kind === 'prefab-character'` ✓ (Res/Prefabs 경로 223행 중 Character 하위 전부 통과)
- `City_pigzombie.atlas.txt` → `family === 'spine-stage1'` (`kind: spine-skeleton`) ✓
- disposition 합계 === 7712 ✓

| disposition | rows |
|---|---|
| blockout-geometry | 2170 |
| vfx-candidate | 1577 |
| ui-reference-only | 1734 |
| excluded-artifact | 1035 |
| character-poc-only | 538 |
| sfx-candidate | 416 |
| tooling-runtime | 242 |
| **합계** | **7712** |

정정 반영 확인: blockout-geometry 2176→2170, character-poc-only 532→538 (Res/Prefabs/Character 캐릭터 프리팹 재분류).

## ⑤ RED 증거 — a1/red.txt 존재 + 내용

`docs/verification/ulw-execute/rtfc/phase-a/a1/red.txt` 존재 (12줄). 정정 커밋에서 새로 추가된 단정의 실패를 캡처한 내용 확인:

```
RED — node --test tools/art/test-oddland-catalog.mjs

✔ catalog contract and manifest coverage (12.446958ms)
✖ classification samples (4.445709ms)
✔ markdown totals agree (2.479083ms)
ℹ tests 3
ℹ pass 2
ℹ fail 1

AssertionError [ERR_ASSERTION]: expected Res/Prefabs/Character/CharPlayer.prefab to be ['prefab-character','spine-player','character-poc-only'], actual ['prefab-other','common','blockout-geometry'].

This RED run also contains the newly added CharacterSpines and SpineAssets Stage1/Pig assertions; execution stops at the first failing assertion.
```

결과: **새 단정(Res/Prefabs/Character·CharacterSpines·SpineAssets Stage1/Pig)의 RED 실패 캡처 확인** — 통과

## ⑥ 문서 참조 확인 (rg)

```
$ rg -n 'oddland-asset-catalog' docs/game-logic/Asset-Pipeline.md
89:- **카탈로그**: `docs/assets/bom/donor/oddland-asset-catalog.json`·`.md`가 비-.meta 7,712개 전량을
    kind·family·처분으로 분류한다(미분류 0). `node tools/art/catalog-oddland-donor.mjs`로 재생성,
    `--check`로 멱등 검증, `--summary`로 요약. 분류는 사용 준비도 판정이 아니며 승격은 아래 승격 절차를 그대로 따른다.
```

기증 에셋 절 내 카탈로그 참조 확인 (exit 0).

## ⑦ npm --prefix tools test

```
37 passed, 0 failed
temp fixtures removed: /var/folders/.../janseon-wiki-test-vWEs1n
wiki build contract passed
unity architecture wiki contract passed
```

결과: **exit 0, 37 passed / 0 failed** — 통과

## ⑧ 커밋 이력 (git log --oneline origin/main..HEAD)

```
97d693e fix(art): 카탈로그 분류 정정 — SpineAssets 텍스트 family·Res/Prefabs 캐릭터 프리팹, RED 증거 추가
80195b7 docs(pipeline): 기증 절에 카탈로그 참조 추가
9132faa feat(art): 오드랜드 기증 카탈로그 — 분류기·계약 테스트·카탈로그 산출
```

예상대로 커밋 3개(카탈로그+정정+문서) 확인.

## ⑨ 작업 상태 (git status --short)

```
?? docs/verification/ulw-execute/rtfc/phase-a/a3/
```

미커밋 변경은 본 재검증 산출물(a3/verify.md)뿐 — 커밋 금지 지침에 따라 의도적으로 미추적 상태로 유지. 코드·카탈로그 변경 없음.

## ⑩ 임시 파일 정리 영수증

none

(테스트 픽스처는 도구가 자체 삭제; 워크트리에 임시/백업 파일 없음 — verify.md 본 파일은 산출물)

## 결론

**①②⑤⑦ 전부 통과.** ③④ 결과 일치(7,712 전량 분류, 미분류 0, 정정 분류 반영), ⑤ RED 증거 존재, ⑥ 문서 참조 확인, ⑧ 커밋 3개 확인, ⑨ 미커밋 변경은 본 산출물뿐, ⑩ 정리 'none'. 구현 없음(문서만 갱신), 커밋 없음.

---

# A3 삼차 재검증 — 2차 정정(만능 폴백 제거·명시 규칙화) 반영 (2026-09-07)

대상 커밋 4개 (`origin/main..HEAD`) — 2차 정정 커밋 `1b36920` 추가:

1. `9132faa` — `feat(art): 오드랜드 기증 카탈로그 — 분류기·계약 테스트·카탈로그 산출`
2. `80195b7` — `docs(pipeline): 기증 절에 카탈로그 참조 추가`
3. `97d693e` — `fix(art): 카탈로그 분류 정정 — SpineAssets 텍스트 family·Res/Prefabs 캐릭터 프리팹, RED 증거 추가`
4. `1b36920` — `fix(art): 카탈로그 만능 폴백 제거·명시 규칙화 — 게이트 리뷰 반영`

## ① node --test tools/art/test-oddland-catalog.mjs

```
✔ catalog contract and manifest coverage (12.601416ms)
✔ classification samples (4.503209ms)
✔ markdown totals agree (2.489917ms)
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

결과: **fail 0, exit 0** — 통과

## ② node tools/art/catalog-oddland-donor.mjs --check (2회)

```
catalog check OK   (1회차, exit 0)
catalog check OK   (2회차, exit 0)
```

결과: **2회 모두 exit 0** — 통과

## ③ node -e 카탈로그 무결성

`docs/assets/bom/donor/oddland-asset-catalog.json`:

- `rows.length === 7712` ✓
- `rule === 'other'` 또는 `'fallback'` 행 **0개** ✓ (2차 정정: 만능 폴백 제거 확인 — 분류기는 `rule==='other'||'fallback'` 행 존재 시 throw)
- `Spine/Runtime/*.asset` 1행 → `text-data / runtime / tooling-runtime` (rule `spine-runtime-asset`) ✓
  - `Spine/Runtime/spine-unity/SkeletonDataModifierAssets/BlendModeMaterials/Default BlendModeMaterials.asset`
- `Post Processing Profiles/*.asset` 5행 전부 `kind === 'post-process-profile'` (rule `postfx`, disposition `vfx-candidate`) ✓
  - Global Volume Profile Battle/Highlight/Lobby/Login/Mini Game.asset

## ④ RED 증거 — a1/red2.txt 존재 + 실제 실패 단정 포함

`docs/verification/ulw-execute/rtfc/phase-a/a1/red2.txt` 존재 (34줄). 2차 정정에서 추가된 단정의 실제 실패를 캡처한 내용 확인:

```
✖ classification samples (5.747083ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
    assert.ok(postfx.length > 0)
      at tools/art/test-oddland-catalog.mjs:37:9
ℹ pass 2
ℹ fail 1
```

결과: **실제 실패 단정(postfx 행 부재 → `assert.ok(postfx.length > 0)` falsy, fail 1) 포함 확인** — 통과

## ⑤ npm --prefix tools test

```
37 passed, 0 failed
temp fixtures removed: /var/folders/.../janseon-wiki-test-a9XQjl
wiki build contract passed
unity architecture wiki contract passed
```

결과: **exit 0, 37 passed / 0 failed** — 통과

## ⑥ 커밋 이력 (git log origin/main..HEAD)

```
1b36920 fix(art): 카탈로그 만능 폴백 제거·명시 규칙화 — 게이트 리뷰 반영
97d693e fix(art): 카탈로그 분류 정정 — SpineAssets 텍스트 family·Res/Prefabs 캐릭터 프리팹, RED 증거 추가
80195b7 docs(pipeline): 기증 절에 카탈로그 참조 추가
9132faa feat(art): 오드랜드 기증 카탈로그 — 분류기·계약 테스트·카탈로그 산출
```

예상대로 커밋 4개 확인.

## ⑦ 작업 상태 (git status --short)

```
?? docs/verification/ulw-execute/rtfc/phase-a/a3/
```

미커밋 변경은 본 검증 산출물(a3/)뿐 — 커밋 금지 지침에 따라 의도적으로 미추적 상태 유지. 코드·카탈로그 변경 없음.

## 삼차 결론

**①②④⑤ 전부 통과.** ③ 무결성 일치(7,712행 전량 명시 규칙 분류, `other`/`fallback` 0행, Spine/Runtime .asset → tooling-runtime, Post Processing Profiles .asset → post-process-profile), ⑥ 커밋 4개 확인, ⑦ 미커밋 변경은 본 산출물뿐. 구현 없음(문서만 갱신), 커밋 없음.

---

# A3 사차 갱신 — RED2 재캡처 수습 (게이트 리뷰 2차 지적, 2026-09-07)

지적 내용: 기존 `a1/red2.txt`의 실패(`assert.ok(postfx.length > 0)` falsy)는 **재현 불가능한 중간 선택자 실패**였다. 부모 커밋 `97d693e` 카탈로그에는 `Post Processing Profiles/*.asset` postfx 5행이 이미 존재하므로 해당 단정은 통과해야 하며, 구버전 캡처는 테스트 선택자 버그(구 선택자)에 의한 것. **진짜 결함은 부모 카탈로그의 `rule === 'other'` 3행**이며, 현재 테스트의 zero-other 단정(`test-oddland-catalog.mjs:39`, `other|fallback` 0행 단정)이 이를 잡는다.

## 수습 절차 (구현 없음, 증거 파일만 갱신)

1. 부모 카탈로그 추출: `git show 97d693e:docs/assets/bom/donor/oddland-asset-catalog.json > /tmp/parent-catalog.json`
2. 현재 카탈로그 백업: `cp docs/assets/bom/donor/oddland-asset-catalog.json /tmp/current-catalog.json`
3. 부모 카탈로그 임시 적용: `cp /tmp/parent-catalog.json docs/assets/bom/donor/oddland-asset-catalog.json`
4. `node --test tools/art/test-oddland-catalog.mjs` → 실패 출력을 `a1/red2.txt`에 헤더와 함께 덮어쓰기
5. 즉시 복원: `cp /tmp/current-catalog.json docs/assets/bom/donor/oddland-asset-catalog.json` (같은 셸에서 실행 — 중간 실패 시에도 복원 보장)
6. 복원 무결 확인 → 아래 ①②③
7. 테스트 재실행 → GREEN
8. `/tmp` 임시파일 삭제

## ① RED2 재캡처 결과 — zero-other 단정 실패 (exit 1)

부모 카탈로그(`97d693e`) 적용 하에서 현재 테스트 실행:

```
✖ classification samples
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  3 !== 0

      at TestContext.<anonymous> (tools/art/test-oddland-catalog.mjs:39:9)
ℹ pass 2
ℹ fail 1
```

`3 !== 0` = 부모 카탈로그의 `rule === 'other'` 3행이 zero-other 단정을 실패시킴. postfx 단정(같은 테스트 내 37행)은 통과 — 구 캡처의 선택자 실패가 재현되지 않음을 재확인. 전체 출력은 `a1/red2.txt` (헤더에 재캡처 사유 명기).

## ② 복원 무결

```
$ node tools/art/catalog-oddland-donor.mjs --check
catalog check OK        → exit 0
$ git status --short -- docs/assets/bom/donor/oddland-asset-catalog.json
(빈 출력 — 카탈로그 변경 없음)
$ cmp /tmp/parent-catalog.json /tmp/current-catalog.json
(서로 다름 — 실제로 부모 카탈로그를 테스트했음을 확인)
```

카탈로그 최종 바이트 불변 확인.

## ③ 테스트 GREEN (현재 카탈로그 복원 후)

```
✔ catalog contract and manifest coverage
✔ classification samples
✔ markdown totals agree
ℹ tests 3
ℹ pass 3
ℹ fail 0
```

exit 0.

## 사차 결론

RED2는 이제 부모 커밋 `97d693e` 카탈로그의 실제 결함(`rule other` 3행)을 zero-other 단정 실패로 보여준다. 구 캡처의 postfx 선택자 실패는 폐기. 복원 후 `--check` exit 0, `git status` 카탈로그 무변경, 테스트 3/3 GREEN. 구현 없음, 커밋 없음(증거 파일 `red2.txt`·본 `verify.md`만 갱신).
