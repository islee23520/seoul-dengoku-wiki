# Structures.md 병렬 diff 판정 (2026-09-21)

대상: `LORE/structures/Structures.md`. 읽기 전용 조사이며 세 워크트리 모두 수정·정리·전환하지 않았다. 이 보고서 파일만 통합 워크트리에 새로 썼다.

## 1. 인벤토리

| 항목 | 통합 `wiki-updates-state-selection` | `human2-core` | `wiki-three-world-markers` |
|---|---|---|---|
| 브랜치 | `fix/wiki-updates-state-selection` | `docs/human2-core` | `feat/wiki-three-world-markers` |
| HEAD | `0dc67baa` | `42c42fd1` | `d5aa237d` |
| origin/main(`c7998481`) 대비 | 7 앞, 0 뒤 | 0 앞, 37 뒤 | 2 앞, 217 뒤 |
| 이 파일 상태 | 깨끗함(HEAD 블롭 = origin/main 블롭) | 미커밋 수정 | 미커밋 수정 |
| 파일 mtime | 09-21 16:52(체크아웃 시각) | 09-21 13:59 | 09-20 15:37 |
| 작업 트리 SHA-1 | `ac25a905…` | `8ecafa56…` | `0455c7cc…` |
| HEAD 블롭 SHA-1 | `ac25a905…` (= origin/main) | `ac25a905…` (= origin/main) | `604149bd…` (origin/main과 다름) |
| origin/main 대비 diff | 없음 | 22줄 교체(+22/-22) | 2줄 교체(+2/-2) |
| 통합 기준선 대비 diff | 없음 | 22줄 | 2줄(3행, 33행) |
| 같은 워크트리의 다른 미커밋 변경 | 다수(GDD design-store, LORE 용어·문화·세력, TOOL wiki 게이트) | Ailments, Chaebol-Houses, Conscription-Remnants, People-and-Machines | GDD·LORE 다수 삭제/수정(217 뒤처진 트리) |

origin/main의 이 파일 최근 커밋은 `b0fe7236`(jargon 제거)와 `b375127a`(실존 단체 국호를 창작 후신명으로 교체)다. 통합 워크트리는 이 파일을 건드리지 않았고 origin/main 내용 그대로다.

소유자·세션 증거(추정 포함):
- 통합: 브랜치와 원격 추적이 일치하고 최근 커밋이 wiki 공개 계약 작업이다. 이 파일과 무관하다.
- human2-core: 형제 브랜치 `docs/human2-{characters,culture,places,wna}`가 모두 `42c42fd1`에 있다. 같은 "human2" 문체 정리 세션이 lane별로 워크트리를 나눈 구조다. reflog는 `merge origin/main: Fast-forward`가 마지막이고, 파일 mtime(13:59)이 HEAD 커밋(13:32)보다 뒤라 그 뒤에 손으로 고친 미커밋 편집이다. 이 세션이 지금도 살아 있는지는 확인하지 못했다.
- world-markers: 커밋은 지도·마커 작업(WEB/wiki, station-control-overrides, regions)이다. Structures.md 변경은 그 작업과 무관하고 217 뒤처진 옛 트리에 남은 변경이다.

## 2. 내용 분류

### world-markers (2줄)
- 3행: `당시의 서울` → `개막의 서울`. 이는 `b0fe7236`이 이미 제거한 jargon을 되돌린다.
- 33행: `설교명부정` → `기독교`, `당시의 창작` → `개막의 창작`. 커밋된 HEAD 블롭은 `대한예수교장로회`(실존 단체명)이고 작업 트리는 그것을 `기독교`로 바꾼 것이다. 둘 다 `b375127a`가 창작 후신명 `설교명부정`으로 바꾼 결정을 되돌린다.
- 분류: 전부 stale/superseded. 고유한 의미 추가는 없다. origin/main이 이미 이 두 문장의 최신 결정을 담고 있다.
- 토큰 수: `기독교` 1, `설교명부정` 0, `개막` 3.

### human2-core (22줄, 전부 산문 교체)
- 문단 1·2·5·9·11·13·17·19·21·25·27·29·33·35·37·41·43·45와 표 5행. 링크와 수치(334, 25, 435, 2026/2126)는 그대로다. `설교명부정` 유지, `슬롯` 3→1로 감소. 개막 1→2로 증가(25행 `개막 이후`).
- 생성 미러 결합: `WEB/wiki-source/world/Structures.md`가 origin/main에 있는 생성 미러다. 이 파일을 커밋하면 `mount.mjs`로 미러를 다시 만들고 `gate.mjs`를 돌려야 한다. 직접 참조하는 테스트는 없다.
- 의미 이동 후보(사람 검토 필요):
  1. 9행 `동에 지하철이 있으면 그 역 건물이 핵심 시설` → `무조건 역 건물이 핵심`. 규칙이 절대화된다.
  2. 13행 `미확인으로 남긴다` → `여백으로 둔다`. 상태 어휘가 사라진다.
  3. 17행·표 `지도 점에서 뽑은` 한정어가 사라진다. 435의 산출 근거가 빠진다.
  4. 21행 `반복하는 기체` → `망가진 방재 기체`, `창세 구술` → `영웅담`. 지칭 대상이 바뀌어 다른 정본 용어와 어긋날 수 있다.
  5. 37행 지천 목록에서 `홍제`가 빠지고 `청계`가 `청계천`이 된다.
  6. 33행 `이름이 있는 사람이 선다` 이미지 삭제, 29행 `부품 건조` → `부품 창고`, 표 `잔반과 열` → `둥지 찌꺼기`.
  7. 5행·33행에서 `정본이다`가 빠져 권한 관계 문장이 약해진다.
- 좋은 점: 번역투·이중 수식이 줄고 문장 길이가 다양해진다(Patina 관점의 개선 의도는 분명하다).

### 통합 (변경 없음)
- origin/main과 같다. 이 파일에 관해서는 기준선일 뿐이다.

## 3. 포함·충돌 관계

- 통합 = origin/main(기준). 어느 쪽도 통합의 상위집합이 아니다.
- world-markers는 origin/main의 하위(옛 버전)다. 통합에 새로 더하는 의미가 없고 최신 결정 두 개를 되돌린다.
- human2-core는 origin/main과 같은 블롭에서 출발했고 world-markers와 겹치는 줄은 3행·33행이다. human2가 그 두 줄을 이미 다른 문장으로 바꿨으므로 world-markers 변경과는 기계적으로도 의미상으로도 함께 쓸 수 없다. 반대로 human2와 통합은 서로 다른 줄을 건드리지 않아 합성 가능하다.
- 파일 밖 결합: 통합과 human2-core 둘 다 `LORE/factions/Conscription-Remnants.md`를 미커밋 수정 중이다. Structures.md 판정과는 별개지만 human2를 올릴 때 충돌 위험이 있다.

## 4. Patina·검증 증거

- 통합 HEAD `0dc67baa`의 `patina-current-138-20260921.json`: `WEB/wiki-source/world/Structures.md` 미러 29.2 (mostly human), hot 단락 7/24, sha256 `85b1702c…`. 이것이 기준 점수다.
- human2-core와 world-markers 후보본은 Patina 점수가 없다(미측정).
- 이 조사에서는 어떤 테스트도 실행하지 않았다. 후보본의 게이트 통과 여부는 검증하지 못했다.

## 5. 결정 매트릭스

| 후보 | 상태 | 통합 대비 | 정본 결정 대비 | 권고 |
|---|---|---|---|---|
| 통합(origin/main) | 기준 | 동일 | 최신 | 유지 |
| human2-core | 미커밋 산문 22줄 | 합성 가능(줄 겹침 없음) | 최신 결정 유지, 의미 이동 7건 | 사람 검토 후 별도 PR |
| world-markers | 미커밋 2줄 + stale HEAD | 하위 버전, 새 내용 없음 | `b375127a`·`b0fe7236`을 되돌림 | 이 파일 변경은 반영하지 않음 |

## 6. 권고 착지 순서·보류

1. 통합 브랜치는 이 파일과 무관하므로 그대로 진행한다.
2. human2-core는 원래 세션 소유자가 위 의미 이동 후보를 확인·수정한 뒤, `docs/human2-core`에서 별도 PR로 올린다. 그 뒤 `mount.mjs`, `docs:build`, `gate.mjs`, Patina 점수(기준 29.2)를 다시 돌린다. Conscription-Remnants 겹침도 그때 정리한다.
3. world-markers의 Structures.md 미커밋 변경은 landing 대상에서 제외한다. 소유자가 스스로 폐기하게 하고, 지도 기능 커밋들은 이 파일과 무관하니 rebase 대상으로 그대로 둔다. 그 워크트리에서 `stash pop`이나 되돌리기를 자동으로 하지 않는다.

보류: 세 워크트리 모두 손대지 않는다. 최근성만으로 고르지 않았고, 다른 세션 작업(human2, world-markers)은 전부 보존했다.

## 7. 한계

- `apply_patch` 도구가 이 세션에 없어 새 파일 생성은 Write로 했다. 기존 파일은 수정하지 않았다.
- human2 세션이 아직 활성인지, 어떤 지시로 22줄을 바꿨는지는 확인하지 못했다.
- 의미 이동 후보는 정본 문서 대조 없이 문장 비교로만 뽑았다.
