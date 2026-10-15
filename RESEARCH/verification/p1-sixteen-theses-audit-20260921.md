# P1 "핵심 정본 열여섯 논지" 감사 (2026-09-21)

판정: **정의 차단(DEFINITION BLOCKER)**. 정확히 열여섯 개인 P1 목록은 계획서·복구 파일·원장 어디에도 없다. 목록을 지어내지 않고 경쟁 정의를 그대로 싣는다. 기계 판독본은 `p1-sixteen-theses-audit-20260921.json`이다.

## 1. 기준선 불일치

- 요청은 "현재 HEAD f5965149"라 했으나 이 체크아웃의 HEAD는 `main` `c7998481`(PR #210)이다.
- `f5965149`는 존재하는 커밋이지만 HEAD의 조상이 아니다. 브랜치 `fix/wiki-updates-state-selection`의 끝이다. HEAD와의 diff는 290개 파일이다.
- 아래 표는 두 기준선을 모두 기록한다. main 작업 트리에는 외부 미커밋 수정이 있다.

## 2. 정의 출처와 경쟁 목록

| 목록 | 개수 | 권위 | 근거 |
|---|---|---|---|
| A. P1 Gemini 논지/TPO 재집필 우선 정본 | **17** | 최우선. 실제 디스패치 프롬프트 | `.omo/senpi-task/tasks/st_01a0c2b9.json` 프롬프트가 파일 17개를 나열. 원장 `.omo/ulw-loop/01a0adee-.../ledger.jsonl` 82행 "P1 ... for 17 priority canon files" |
| B. A + `LORE/overview/World-Unbinding.md` | 18 | 원장 84행 스티어링 | 워커 보고 `dag_7d8b2d05.../p1-gemini.txt`: `files_requested: 18` |
| C. 기동권 이탈 참조 LORE 파일 | **16** | 용어 참조 집합이지 논지 집합이 아님 | 원장 84·85행 "16 LORE and 15 public mirror references". HEAD에서 실측 16/15 일치 |

- 정확한 열여섯은 정의된 적이 없다. "열여섯 논지"에 가장 가까운 숫자는 C의 16이다. 그러나 C는 A와 8개만 겹치고 7개는 A 밖이다(README, World-Narrative-Atlas, Ailments, Cast-Profile-Contract, Food-Culture, Chaebol-Houses, External-Theaters). A의 9개는 C에 없다.
- P1은 Gemini 작업으로 정의됐고 실패했다(원장 88행: 교체 0건, 타임아웃 2회). 원장 157행에서 사용자가 Gemini를 제외했다. 원장 169행은 이 정의 확정을 `st_01a0c471`에 맡겼다.
- 계획서 `.omo/plans/wiki-gdd-session-reconciliation-20260920.md`와 `RECONCILIATION.md`, `GOAL.md`, `todo-before-reconciliation.md`에는 P1도 열여섯 논지도 없다. "열여섯"은 서울 십육국을 뜻하는 산문에만 나온다.
- 권고: 사용자가 확정하기 전까지 A(17)를 작업 정의로 쓴다. 16으로 맞추려고 한 파일을 임의로 빼지 않는다.

## 3. 파일별 상태 (A 17 + B의 World-Unbinding)

용어 수 표기는 개막/창세/기동권 이탈/계약이다. `기준선` 열은 HEAD와 f5965149를 구분한다. 논지·TPO 본문을 정독한 것이 아니라 용어 실측과 원장 근거로 판정했다. 개막·창세가 세계 내부 구술 용례인 경우가 있어 수치만으로 결함을 단정하지 않는다. 계약 열의 다수도 세계 내부 용례일 수 있다.

| # | 정본 경로 | 요구 논지/TPO | HEAD 용어 | f5965149 용어 | Patina(f5965149 영수증) | 상태 | 최소 비Gemini 조치 |
|---|---|---|---|---|---|---|---|
| 1 | LORE/places/World-Map-Construction.md | 실제 지리·이동 배경 설명. "평면 행정 지도는 거짓"이나 구현 계약 서술 금지(레인 2 지정 주의 사항) | 0/0/0/2 | 동일 | 20.8 mostly human | needs edit(논지 미정독) | 계약 2건 문맥 정독 후 문장 단위 개정 |
| 2 | LORE/places/World-and-Subway-Layers.md | 표면·지하철 층 세계 설명 | 0/0/0/0 | 동일 | 10 human | PASS 후보 | 조치 없음, 최종 정독만 |
| 3 | LORE/factions/Sixteen-States.md | 십육국 정치 논지, 개막 시대 프레임 제거 | 10/1/1/27 | 동일 | 15.4 mostly human | foreign-conflict(작업 트리 dirty) + needs edit | 외부 수정 정리 뒤 개막·기동권 이탈 문맥 개정 |
| 4 | LORE/factions/Conscription-Remnants.md | 예비군 잔존 세력 | 2/1/0/1 | 0/0/0/1 | 21.7 mostly human | HEAD: needs edit / f5965149: PASS | f5965149를 main으로 통합 |
| 5 | LORE/culture/Faith-Culture-Schism.md | 종교 문화 분열 | 15/9/2/23 | 15/9/1/23 | 21.3 mostly human | foreign-conflict + needs edit | 외부 수정 정리 후 개정 |
| 6 | LORE/culture/Oral-Stories.md | 구술 전승(창세 구술은 세계 내부 용례 가능) | 5/8/2/7 | 동일 | 0 human | needs edit | 기동권 이탈 2건을 프롤로그 인과로 치환, 창세는 문맥별 판정 |
| 7 | LORE/culture/Martial-Paths.md | 무공 갈래 | 1/1/0/8 | 동일(본문 +3.8KB, 6909710a) | 30 mostly human | needs edit(2건) | 통합 후 2건 문맥 판정 |
| 8 | LORE/culture/Values-and-Policy-Scales.md | 가치·정책 척도 | 3/0/0/28 | 3/0/0/27 | 14.3 human | foreign-conflict + needs edit | 외부 수정 정리 후 개막 3건 개정 |
| 9 | LORE/chronology/Scenario-Timeline.md | 연표. 2126은 게임 배경 시점일 뿐 | 13/5/6/20 | 동일 | 19 mostly human | needs edit | 프롤로그 앵커 확정 후 6+13+5건 개정 |
| 10 | LORE/chronology/Century-Annals.md | 백년 연대기 | 20/11/3/54 | 18/9/1/54 | 18.4 mostly human | foreign-conflict + needs edit | 외부 수정 정리, f5965149 부분 개정 위에 잔여 개정 |
| 11 | LORE/technology/Lost-Technology-Lineage.md | 실전 기술 계보 | 2/1/2/2 | 동일 | 20.5 mostly human | foreign-conflict(작업 트리 기동권 이탈 3, HEAD 2) + needs edit | 외부 수정 정리 후 개정 |
| 12 | LORE/people-and-machines/People-and-Machines.md | 인간·기계 관계 | 3/2/1/0 | 동일 | 26.1 mostly human | needs edit | 프롤로그 앵커 후 개정 |
| 13 | LORE/structures/Structures.md | 구조물 | 1/1/1/5 | 동일 | 29.2 mostly human | needs edit | 프롤로그 앵커 후 개정 |
| 14 | LORE/offices/Offices-and-Ranks.md | 관직 | 6/0/0/4 | 6/0/0/4 | 6.1 human | needs edit | 개막 6건 문맥 판정. 관직 JSON 정본 파일럿(5df68977) 경로와 충돌 여부 확인 |
| 15 | LORE/economy/Economy-and-Production.md | 경제 | 0/0/0/1 | 동일 | 15 human | PASS 후보 | 계약 1건만 확인 |
| 16 | LORE/economy/Logistics-and-Infrastructure.md | 물류 | 0/0/0/0 | 동일 | 0 human | PASS 후보 | 조치 없음 |
| 17 | LORE/economy/Strongholds-and-Territory.md | 거점·영토 | 0/0/0/0 | 동일 | 12.5 human | PASS 후보 | 조치 없음 |
| (18) | LORE/overview/World-Unbinding.md | 독자 대상 프롤로그: 왜 AI가 인간을 죽였고 어떤 인과로 2126 배경에 이르렀나(원장 84행). "기동권 이탈"은 제목 금지 | 11/5/3/1 | 0/0/0/1 | 11.8 human | HEAD: needs edit / f5965149: PASS(미병합). A에는 없음 | f5965149 통합. 프롤로그 앵커의 원천 |

"PASS 후보"는 용어 실측이 0이고 Patina human이라는 뜻이다. 논지 정독은 하지 않았다.

## 4. 파생 공개 미러 (참고 증거일 뿐 정본 아님)

- `WEB/wiki-source/world/<이름>.md`에는 17개 모두 미러가 있다. 개막/창세/기동권 이탈 행 수는 HEAD와 f5965149에서 다르다. 예: Conscription-Remnants 2→0, World-Unbinding 15→0, Century-Annals 31→28, Faith 22→21. 나머지는 동일하다.
- 기동권 이탈 미러 수는 HEAD 15개, f5965149 10개다. LORE는 HEAD 16개, f5965149 12개다. 정본 개정이 미러에 그대로 흘러가므로 미러를 손으로 고치지 않는다.
- `WEB/wiki/public/timeline-overview.json`도 작업 트리에서 수정 상태(foreign)다. 생성물이므로 정본 개정 뒤 재생성한다.

## 5. Patina 해석

- 영수증 `TOOL/tools/wiki/patina-human-receipt.json`은 f5965149에만 있다(HEAD에는 없음). 138문서, human 119 / mostly human 19다. 위 17개에서는 mostly human이 10개(1, 3, 4, 5, 7, 9, 10, 11, 12, 13)이고 나머지는 human이다.
- 원장 113행 사용자 지시: 점수는 "거의 휴먼"이면 충분하고 논지·TPO 수정이 우선이다. 따라서 mostly human은 결함이 아니다. 점수 최적화를 목표로 삼지 않는다.
- 영수증은 문서 SHA에 결합돼 있다. 정본을 고치면 해당 항목이 낡으므로 각 배치가 끝날 때 재생성한다.

## 6. 의존 순서 배치 (Gemini 없이)

- **B0 기준선 통합**: `f5965149`를 main 위로 통합한다. 이 전에는 파일 3·5·8·10·11의 외부 미커밋 수정(작업 트리 dirty)과 충돌한다. 외부 수정은 소유자 확인 뒤 정리하고 이 감사에서는 건드리지 않는다. 종료 조건은 HEAD에 World-Unbinding 프롤로그와 Conscription 개정이 반영되는 것이다.
- **B1 프롤로그 앵커**: World-Unbinding(18번)을 원천으로 확정한다. 기동권 이탈을 독자용 인과 서술로 치환하는 기준이 여기서 나온다.
- **B2 연표 축**: Scenario-Timeline(9), Century-Annals(10), Oral-Stories(6). 개막/창세를 "게임 배경 시점" 표현으로 바꾼다. 세계 내부 구술은 남긴다.
- **B3 세력·문화**: Sixteen-States(3), Faith(5), Values(8), Martial-Paths(7). Conscription(4)은 B0으로 끝난다.
- **B4 잎사귀**: Lost-Technology(11), People-and-Machines(12), Structures(13), Offices(14).
- **B5 정독 확인만**: World-Map-Construction(1)의 논지, 그리고 PASS 후보 2·15·16·17.
- **B6 마감**: 미러·카탈로그 재생성(`node WEB/wiki-source/scripts/mount.mjs`, `gate.mjs`), Patina 영수증 재생성, `npm --prefix TOOL/tools test`.

각 배치는 파일 하나씩 서로 겹치지 않는 범위로 나눌 수 있다. B2~B4는 B1 이후 병렬이 가능하다.

## 7. 확인하지 않은 것

- 17개 문서의 본문 논지를 정독하지 않았다. 상태는 용어 실측과 원장·Patina 영수증에서 유도했다.
- 세계 내부 용례의 개막/창세는 결함이 아닐 수 있다. 문맥 판정은 각 배치에서 한다.
- 공개 URL 라이브 확인은 하지 않았다. 미러는 저장소 파일만 대조했다.
- 요청한 `apply_patch`가 이 세션에 없어 `Write`로 두 파일을 만들었다. 소스 편집은 하지 않았다.
