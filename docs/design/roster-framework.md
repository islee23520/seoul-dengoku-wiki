# 병종 로스터 공통 틀 (Roster design framework)

상태: **설계 계약(DESIGN CONTRACT) 초안**. 2026-11-12 작성. Plan: `.omo/plans/wiki-world-overhaul-v2.md` 6번 과제(GAP-2). 영어 병행본은 [roster-framework.en.md](roster-framework.en.md)다.

이 문서는 세력 병종 명단을 쓰는 13·14·15번 과제와 전투를 설계하는 19번 과제가 함께 따르는 규칙이다. 병종 행(SQL)은 여기에 쓰지 않는다. 행은 `data/sql/130-units-government.sql`, `131-units-free-city.sql`, `132-units-arc.sql`에만 둔다(바이블 2.5절).

## 0. 읽는 법과 근거 위계

- **[승인]** 표시는 `docs/CANON-BIBLE.md`가 승인한 사실이다. 이 문서는 그 사실을 옮길 뿐 바꾸지 않는다.
- **[틀]** 표시는 이 문서가 정하는 설계 규칙이다. 13~15번, 19번 과제는 이 규칙을 따라야 한다. 다만 세계 정본이 아니며, 소유자가 언제든 바꿀 수 있다. 공개 위키에 세계 사실로 옮기지 않는다.
- **[대기]** 표시는 소유자 답이 없어 임시 기본값을 쓰는 항목이다. 전체 목록은 13절에 있다. 대기 항목은 승인된 것처럼 쓰지 않는다.
- 근거로 쓴 원천은 다음과 같다. 바이블 1, 2.1~2.5, 3절. 소유자 결정 D3 원문: "전투 방식은 토탈워랑 동일하게 지휘관이 모든 분대의 지휘권한을 갖음". 소유자 지시(2026-11-12) 원문: "전투 기준 값은 알려진 워해머 토탈워 정보를 기준으로 로스터 잡아서 작업 합니다". TW:WH 수치는 Fandom MediaWiki API 페이지와 조사 B 4절에서 가져왔다. 다른 게임의 병종 이름은 여전히 쓰지 않는다. 조사 문서 `docs/research/w2v-tech-scarcity.md`, `docs/research/w2v-life-economy-rosters.md`(참고 전용). 스키마 `data/sql/000-schema.sql`의 `wiki_unit`(task 4 브랜치). GDD `hero-squads-and-time-based-movement.json`, `personal-resolution-battle.json`, `rules-battle-clauses.json`, `character-art-direction.json`. 역 자료 `data/sql/120-map-core.sql`.
- 수치의 축은 Total War 계열 전투(근접 공격, 근접 방어, 무기 위력, 장갑, 사격 피해, 사거리, 탄수, 속도, 리더십)에 맞췄다. 수치는 병종끼리 비교하고 균형을 잡는 설계 눈금이다. 실제 전투 계산식은 GDD 개인 판정 전투가 소유하며, 그 문서는 계수와 수치가 아직 정해지지 않았다고 적는다. 이 문서도 계산식을 확정하지 않는다. 10.6절에 연결 방법만 적는다.

## 1. 스키마와 수치 눈금

### 1.1 컬럼 계약

`wiki_unit`의 컬럼 이름과 NOT NULL 규칙은 바꾸지 않는다. 문자 컬럼의 쓰는 법은 다음과 같다.

| 컬럼 | NULL | 쓰는 법 |
|---|---|---|
| `id` | 불가 | `<faction_id>-<영문 이름 kebab>`. 예: `government-ledger-levy-spears`. 세 세력을 통틀어 유일하다 |
| `faction_id` | 불가 | `government`, `free-city`, `arc` 가운데 하나 |
| `name`, `name_ko` | 불가 | 11절 이름 규칙 |
| `category` | 불가 | 2절의 일곱 문자열 가운데 하나 |
| `role` | 불가 | 2.2절 역할 문자열 가운데 하나 |
| `recruit_building`, `recruit_building_ko` | 불가 | 4절 건물 표에 적힌 그 단계 건물 이름을 글자 그대로 쓴다 |
| `scarce_input` | 가능 | 6절 어휘. 하나 또는 쉼표로 이은 둘(공백 없음, 앞이 주 투입물). 순서와 값은 6.2절 규칙으로 정한다. 예: `ammo,fuel` |
| `attributes` | 불가 | 7절 태그 id의 JSON 배열. 빈 배열 `[]` 허용. 최대 4개 |
| `counters` | 불가 | 이 병종이 상대하기 좋은 병종 `id`의 JSON 배열. 1~4개. 8.3절 |
| `equipment`, `equipment_ko` | 불가 | 11절. 한 문장에서 세 문장 |
| `appearance`, `appearance_ko` | 불가 | 11절. 한 문장에서 세 문장 |
| `gdd_ref` | 가능 | GDD 규칙 앵커(예: `rules/hero-squads-and-time-based-movement#source.b16`). 없으면 NULL |

### 1.2 숫자 컬럼 눈금

아래 표가 모든 숫자 컬럼의 범위다. 범위 밖 값은 쓰지 않는다. "NULL"이 "가능"인 컬럼만 NULL을 쓸 수 있다. 소유자 지시(2026-11-12, 원문): "전투 기준 값은 알려진 워해머 토탈워 정보를 기준으로 로스터 잡아서 작업 합니다". 그래서 전투 수치의 범위는 Total War: WARHAMMER(이하 TW:WH)에서 알려진 값 안에 둔다. 마지막 열이 그 근거다. 링크는 Fandom MediaWiki API 페이지다. 다른 게임의 병종과 인물 이름은 글에 쓰지 않으므로 표본을 익명 글자로 적고, 주소는 페이지 번호(`pageid`)만 쓴다. 표본 A~G는 [조사 B 4.3절](../research/w2v-life-economy-rosters.md)의 행 글자와 같고, H 이후는 이 문서가 더한 표본이다.

| 컬럼 | 범위 | NULL | 뜻 | 상호작용 | TW:WH 기준 |
|---|---|---|---|---|---|
| `sort` | 1-999 | 불가 | 세력 안 표시 순서. 범주 순서(2절) 다음 등급 순서로 매긴다 | 세력 안에서 유일하다 | 해당 없음(표시 순서이며 TW 전투 수치가 아니다) |
| `tier` | 1-5 | 불가 | 등급. 3절 | 비용 띠, 리더십 띠, 상한 규칙을 정한다 | 1~5등급 표본([조사 B 4.3절](../research/w2v-life-economy-rosters.md) A~G행), [표본 H](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=651&prop=text&format=json) 2등급 |
| `cost` | 150-3200 | 불가 | 모집 비용. 단위 이름은 [대기](13절) | 5.1절 등급별 띠 | 300(1등급)~2,100(4등급) ([조사 B 4.3절](../research/w2v-life-economy-rosters.md)), [표본 H](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=651&prop=text&format=json) 475 |
| `upkeep` | 30-960 | 불가 | 유지 간격마다 내는 유지비 | `cost`의 20~30%여야 한다 | 81~525, 모집 비용의 25.0~27.0% ([조사 B 4.3절](../research/w2v-life-economy-rosters.md), [표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json) 81, [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 525) |
| `unit_cap` | 1-8 | 가능 | 세력 전체에서 동시에 둘 수 있는 분대 수. NULL은 상한 없음 | 5.3절. 4~5등급, 드론, `irreplaceable`은 NULL 불가 | 유지비를 내는 세력에는 상한이 없다. 일부 세력의 병종별 상한은 숫자가 공개되지 않았다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)). 이 컬럼은 결핍을 나타내려는 설계 이탈이다[틀] |
| `squad_size` | 1-80 | 불가 | 분대의 기본 전투 인원(드론은 기체 수, 전쟁 기계는 차체 수). 영웅은 세지 않는다 | 1.3절 범주별 띠. 실제 정원은 GDD 규칙대로 지휘관·세력·정착지 수준으로 바뀐다 | 1(한 덩어리 기계)~180(보병 최대 크기 설정). 1.3절 |
| `hp` | 50-9500 | 불가 | 한 사람(또는 한 기체, 한 차체)의 체력 | 1.4절 범주별 띠. 분대 총체력 = `hp` x `squad_size` | 보병 1인 50~135([표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json) 8,280/120 = 69, [표본 I](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=65134&prop=text&format=json) 10,800/80 = 135), 기병 1기 89~233([표본 J](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=657&prop=text&format=json) 233), 한 덩어리 기계 3,957~9,102([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 9,102, [표본 K](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=17582&prop=text&format=json) 6,420) |
| `melee_attack` | 10-65 | 불가 | 근접 공격 기술 | 상대 `melee_defence`와 견주어 근접 명중률을 정한다 | 10([표본 L](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=677&prop=text&format=json))~65([표본 M](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=679&prop=text&format=json)). 보병 12~46([표본 N](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=10066&prop=text&format=json) 46) |
| `melee_defence` | 6-66 | 불가 | 근접 방어 기술 | 높을수록 근접에서 덜 맞는다. 사격에는 쓰지 않는다 | 6([표본 L](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=677&prop=text&format=json), [표본 O](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=588&prop=text&format=json))~66([표본 V](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=697&prop=text&format=json)). [표본 P](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5341&prop=text&format=json) 62, [표본 Q](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5328&prop=text&format=json) 60 |
| `weapon_strength` | 18-400 | 불가 | 근접 한 번의 위력 | 상대 `armour`가 일부를 막는다. `plate-biter` 태그는 장갑을 덜 받는다 | 18([표본 O](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=588&prop=text&format=json))~400([표본 K](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=17582&prop=text&format=json)). 보병 18~60, 한 덩어리 기계 250~400([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 250) |
| `armour` | 0-150 | 불가 | 방호구·차체의 막는 힘 | 근접과 사격 피해를 모두 줄인다. 최대 감소는 90%로 둔다 | 0([표본 O](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=588&prop=text&format=json))~160([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json)). [표본 E](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=656&prop=text&format=json) 120 |
| `missile_damage` | 8-465 | 가능 | 사격 한 발(드론은 공격 한 번)의 위력. 기본 피해와 관통 피해의 합이다 | `range`, `ammo`와 셋이 함께 NULL이거나 함께 값이 있다 | 합계 8([표본 R](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=663&prop=text&format=json))~465([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 95+370). [표본 B](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5357&prop=text&format=json) 22(5+17), [표본 H](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=651&prop=text&format=json) 24 |
| `range` | 60-480 | 가능 | 사거리(미터). 드론은 조종 거리 | `role` `rifle`은 145-160, `artillery`는 380-480, 드론은 480 이하. 터널 전장에서는 실제 시야가 사거리보다 짧을 수 있다 | 60([표본 K](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=17582&prop=text&format=json))~480([표본 L](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=677&prop=text&format=json)). 보통 80~200, 포는 200 초과([Range](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=39740&prop=wikitext&format=json)). [표본 B](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5357&prop=text&format=json) 145, [표본 H](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=651&prop=text&format=json) 160, [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 380 |
| `ammo` | 1-40 | 가능 | 한 전투에서 쏠 수 있는 사격 횟수. 드론은 출격 횟수 | 6절 결핍 규칙이 시작 탄수를 줄인다 | 1([Ammunition](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=39739&prop=wikitext&format=json))~100([표본 S](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=715&prop=text&format=json)). 화약 보병 22([표본 B](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5357&prop=text&format=json)), [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 40 |
| `speed` | 20-90 | 불가 | 전장 이동 속도 | 1.4절 범주별 띠 | 20~90. 평균 30~60, 기병 60 초과, 포 30 미만([Speed](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=39741&prop=wikitext&format=json)). [표본 L](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=677&prop=text&format=json) 20, [표본 T](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=662&prop=text&format=json) 90 |
| `leadership` | 35-100 | 불가 | 기본 사기. 전투 중 사기의 시작값 | 3.2절 등급별 띠. 10절 패주 규칙 | 35([표본 O](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=588&prop=text&format=json))~100([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json)) |

참고 상호작용(균형 점검용이며 전투 계산식이 아니다): 근접 명중률은 35 + `melee_attack` − 상대 `melee_defence`로 보고 8~90% 사이로 자른다. 피해는 `weapon_strength`(사격은 `missile_damage`)에서 상대 `armour`%만큼 덜어 낸다. 이 식과 장갑 90% 상한은 확인한 Fandom 페이지에 숫자가 없어 TW:WH 근거가 확인되지 않은 균형 보조값이다. 19번 과제는 이 비교식을 GDD 개인 판정의 입력으로 옮길 때 같은 원인을 두 번 빼지 않는다(GDD "중복 차감 금지").

### 1.3 범주별 분대 인원 띠

결핍과 인구 붕괴 때문에 분대는 TW:WH의 큰 크기 설정보다 작다. 높은 등급일수록 띠의 아래쪽을 쓴다. 띠는 모두 TW:WH의 작은 크기~최대 크기 설정 범위 안에 있다.

| 범주 | `squad_size` 띠 | 세는 대상 | TW:WH 기준 |
|---|---|---|---|
| `commander` | 6-16 | 호위 병사. 영웅 본인은 세지 않는다 | 해당 없음. TW 군주는 한 덩어리 1이고 호위 분대가 없다([표본 M](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=679&prop=text&format=json), 한 덩어리 1) |
| `infantry` | 20-80 | 병사 | 20~180. [표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json) 30/60/90/120 ([조사 B 4.3절](../research/w2v-life-economy-rosters.md) A행) |
| `missile` | 12-48 | 사수 | 23~90. [표본 B](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5357&prop=text&format=json) 23/45/68/90 (B행). 화기반 7~32 |
| `fast` | 8-24 | 탑승자 또는 스키병 | 기병 8~60. [표본 E](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=656&prop=text&format=json) 15/30/45/60 (E행) |
| `drone` | 3-12 | 기체. 조종수는 세지 않는다 | 해당 없음. TW에 원격 조종 기계 분대가 없다 |
| `war-machine` | 1-4 | 차체나 포. 조원은 세지 않는다 | 포 1~4, 장갑 차량 1 (F·G행, [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 1) |
| `support` | 6-24 | 병사 | 해당 없음. 가장 가까운 화기반 7~32 |

### 1.4 범주별 체력·속도 띠

| 범주 | `hp` 띠 | `speed` 띠 | TW:WH 기준 |
|---|---|---|---|
| `commander` | 50-140 | 26-42 | 사람이므로 보병 기준: 1인 50~135, 속도 26~42 |
| `infantry` | 50-140 | 26-42 | 1인 50~135([표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json) 69, [표본 I](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=65134&prop=text&format=json) 135). 속도 26([표본 S](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=715&prop=text&format=json))~42([표본 U](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=17532&prop=text&format=json)) |
| `missile` | 50-140 | 26-42 | 보병과 같다([표본 B](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5357&prop=text&format=json) 6,210/90 = 69, 속도 33) |
| `fast` | 85-235 | 60-90 | 기병 1기 89~233([표본 J](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=657&prop=text&format=json) 233), 속도 60 초과([Speed](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=39741&prop=wikitext&format=json)), [표본 E](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=656&prop=text&format=json) 78, [표본 T](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=662&prop=text&format=json) 90 |
| `drone` | 50-140 | 60-90 | 해당 없음. TW 대응 병종이 없어 사람 체력 띠와 기병 속도 띠 안에 둔다[틀] |
| `war-machine` | 3500-9500 | 20-45 | 한 덩어리 3,957~9,102([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 9,102, [표본 K](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=17582&prop=text&format=json) 6,420). 속도 20([표본 L](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=677&prop=text&format=json))~40([표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json)) |
| `support` | 50-140 | 26-42 | 보병과 같다 |

## 2. 범주와 역할

### 2.1 범주 일곱 개

`category` 값은 아래 문자열을 글자 그대로 쓴다. 5번 과제의 화면은 이 순서로 표를 묶는다.

| 순서 | `category` | 화면 제목(ko / en) | 정의 |
|---|---|---|---|
| 1 | `commander` | 지휘관과 영웅 / Commanders and Heroes | 이름 있는 영웅 한 명이 타는 호위 분대의 틀. 영웅 본인의 능력은 인물 원장(CK3 능력치)에서 온다. 행의 수치는 호위 병사의 것이다 |
| 2 | `infantry` | 보병 / Infantry | 전열을 잡고 근접으로 싸우는 걸어 다니는 분대 |
| 3 | `missile` | 사격병 / Missile | 거리를 두고 쏘는 분대. 화기, 석궁, 투척, 박격포 사수 |
| 4 | `fast` | 기동병 / Fast and Mounted | 빠르게 움직이는 분대. 스키, 썰매, 궤도 수레, 동력 썰매. 말 같은 동물 탈것은 정본에 없으므로 쓰지 않는다 |
| 5 | `drone` | 드론 / Drones | 원격 조종하는 비행·주행 기계 분대 |
| 6 | `war-machine` | 장갑과 전쟁 기계 / Armour and War Machines | 장갑차, 궤도 장갑 수레, 포, 되살린 옛 기계 |
| 7 | `support` | 지원 / Support | 수리, 응급 처치, 그물, 전파 방해, 공병 |

### 2.2 역할 문자열

`role`은 아래 값 가운데 범주에 맞는 것을 쓴다. 5번 과제의 역할 아이콘이 이 값을 읽는다.

| `role` | ko | 쓰는 범주 | 뜻 |
|---|---|---|---|
| `command` | 지휘 | commander | 군대의 지휘관 호위 |
| `champion` | 투사 | commander | 결투에 강한 배속 영웅의 호위 |
| `line` | 전열 | infantry | 버티는 기본 전열 |
| `shock` | 충격 | infantry, fast | 들이쳐서 대열을 깨는 분대 |
| `anti-armour` | 대장갑 | infantry, missile | 장갑과 기계를 잡는 분대 |
| `skirmish` | 산개 | missile, fast | 흩어져 쏘고 빠지는 분대 |
| `rifle` | 소총 | missile | 정규 화기 사수 |
| `marksman` | 저격 | missile | 소수 정밀 사수 |
| `artillery` | 포격 | missile, war-machine | 간접 사격 |
| `recon` | 정찰 | fast, drone | 시야와 정보 |
| `raider` | 습격 | fast | 측후면과 보급 습격 |
| `strike` | 타격 | drone | 자폭·투하 공격 |
| `armour` | 장갑 | war-machine | 장갑 차체 |
| `breacher` | 돌파 | infantry, support | 문, 방벽, 봉쇄를 여는 분대 |
| `engineer` | 공병 | support | 수리와 축성 |
| `medic` | 구호 | support | 응급 처치 |
| `countermeasure` | 대응 | support | 그물과 전파 방해로 드론을 막는 분대 |

## 3. 등급 규칙

### 3.1 등급의 뜻

| 등급 | 무엇이 그 등급을 만드는가 | 전형 |
|---|---|---|
| 1 | 짧게 모아 기본 무장만 준 인원. 결핍 투입물 없이 굴러간다 | 장부 징집병, 가문 징집병 |
| 2 | 상시 훈련을 받은 분대, 또는 결핍 투입물 하나를 쓰는 흔한 분대 | 소총반, 계약 창병대 |
| 3 | 숙련 조원, 귀한 장비, 첫 단계 이식. 상한을 둘 수 있다 | 세례 돌파병, 공방 타격 비행조 |
| 4 | 세력의 정예. 반드시 상한이 있고 결핍 투입물이 끊기면 크게 약해진다 | 근위대, 장갑차, 전파 방해반 |
| 5 | 세력에 한두 개뿐인 것. 잃으면 되찾기 어렵다 | 되살린 옛 전쟁 기계, 최고 세례 투사 |

### 3.2 등급별 리더십 띠

| 등급 | `leadership` 띠 | TW:WH 기준 |
|---|---|---|
| 1 | 35-60 | 1등급 창병 60([표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json), [조사 B 4.3절](../research/w2v-life-economy-rosters.md) A행), 최저 35([표본 O](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=588&prop=text&format=json)) |
| 2 | 50-70 | 2등급 50~70(B·C행, [표본 H](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=651&prop=text&format=json) 50) |
| 3 | 60-80 | 3등급 보병·기병 75(D·E행, [표본 E](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=656&prop=text&format=json) 75) |
| 4 | 75-90 | 정예 보병 80~90([표본 N](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=10066&prop=text&format=json) 80, [표본 Q](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5328&prop=text&format=json) 85) |
| 5 | 70-100 | 최고 정예와 영웅 70~100([표본 M](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=679&prop=text&format=json) 100, [표본 P](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5341&prop=text&format=json) 85. 이 등급 귀속은 추정이다) |

`war-machine` 범주와 `artillery` 역할은 어느 등급이든 100을 쓸 수 있다. TW:WH의 포와 장갑 차량이 100이기 때문이다(F·G행, [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 100). 드론과 전쟁 기계의 리더십은 조종수와 조원의 사기다. 그 밖의 병종은 등급 띠를 지키고, 100은 5등급만 쓴다.

### 3.3 희소 비율

- **한 세력 명단에서 4~5등급은 30% 이하다.** 5번 과제의 빌드 검사와 같은 규칙이다. 명단 크기별 최대 수는 18개 5, 20개 6, 22개 6, 24개 7, 26개 7이다(`floor(0.30 x N)`).
- 5등급은 세력마다 1~3개다(자유도시는 0개, 9절).
- `commander` 범주는 3~5등급만 쓴다. 이 행도 4~5등급 비율에 들어간다.
- 권장 분포: 1등급 20~30%, 2등급 25~35%, 3등급 20~30%, 4~5등급 15~30%.
- 명단 크기는 세력마다 18~26개다.

## 4. 모집 건물 체인

### 4.1 공통 규칙

- 건물은 역에 짓는다. 역 유형은 `map_station.degree`로 가른다. `degree` 0은 **고립역**, 1은 **종착역**, 2는 **일반역**, 3 이상은 **환승역**이다. 고립역은 노선이 이어지지 않은 정류장이며(`line_ids`가 빈 배열) 일반역처럼 "모든 역"에 짓는 건물만 지을 수 있다. 2026-11-12 `data/sql/120-map-core.sql` 기준 수: 정부 역 157(환승 40, 종착 5, 고립 4), 자유도시 77(환승 19, 종착 6, 고립 0), 아크 78(환승 20, 종착 5, 고립 1). 고립역 다섯은 중구의 대현산배수지공원 모노레일 두 승강장과 메트로호텔, 서대문구의 신촌(지하), 강동구의 생태공원앞이다.
- **공작령 본역(duchy seat station)**: 공작령마다 하나다. [대기] 기본값은 그 구 안에서 `degree`가 가장 큰 역이다. 같으면 `sort`가 작은 역이다.
- 건물 단계가 등급 문을 연다. 1단계는 1~2등급, 2단계는 3등급, 3단계는 4등급, 4단계(있을 때)는 5등급이다. 이것은 기본 규칙이다. 건물 표의 "여는 등급"이 다르면 넓든 좁든 언제나 표를 따른다.
- 병종 행의 `recruit_building`은 그 병종을 처음 여는 단계 건물의 이름이다.
- 건물 이름은 이 문서가 새로 지은 이름이다[틀]. 세계 정본의 시설 이름이 아니며, 소유자가 이름을 바꾸면 세 명단을 함께 고친다.

### 4.2 정부

근거: 장부에 오른 사람만 국민이고(2.1 [승인]), 상원의원이 구의 공작령을 쥔다(2.1 [승인]). 그래서 징발은 장부에서 시작하고, 정예는 상원의원 본역에서 나온다.

| 체인 | 단계 | 건물(en / ko) | 지을 수 있는 곳 | 여는 등급과 범주 |
|---|---|---|---|---|
| 징발 | 1 | Levy Ledger Office / 징발 장부소 | 정부의 모든 역 | 1등급 infantry, missile |
| 징발 | 2 | Ledger Drill Yard / 장부 연병장 | 환승역 | 2~3등급 infantry, 2등급 fast |
| 징발 | 3 | Senate Guard Hall / 상원 근위청 | 상원의원 공작령 본역(최대 14) | 3~4등급 commander, 4등급 infantry |
| 병기 | 1 | Firing School / 사격 교습소 | 정부의 모든 역 | 2등급 missile |
| 병기 | 2 | Arms Repair Works / 병기 정비창 | 환승역 | 3등급 missile, 3등급 fast, 3등급 war-machine |
| 병기 | 3 | State Gun Works / 국가 포창 | 종로구, 중구, 용산구의 환승역. 세력 전체 2곳 | 4등급 missile(artillery), 4등급 war-machine |
| 병기 | 4 | State Vehicle Depot / 국가 차량고 | 정부 종착역. 세력 전체 1곳 | 5등급 war-machine |
| 비행 | 1 | State Flight Section / 국가 비행반 | 환승역. 같은 공작령에 병기 정비창이 있어야 한다 | 3등급 drone |
| 비행 | 2 | State Flight Command / 국가 비행 지휘소 | 국가 포창이 있는 공작령. 세력 전체 1곳 | 4등급 drone |
| 의무 | 1 | Ledger Aid Post / 장부 의무소 | 정부의 모든 역 | 1~2등급 support |
| 의무 | 2 | Ledger Field Hospital / 장부 야전 병원 | 환승역 | 3등급 support |

종로·중구·용산을 고른 것은 지도 자료에서 정부 핵심 거점(청와대, 정부서울청사, 서울시청, 서울역 옛 역사, 전쟁기념관)이 그곳에 몰려 있기 때문이다(`map_landmark`).

### 4.3 자유도시

근거: 자유도시는 각자 공작령을 쥔 도시국가이고 왕이 없다(2.2 [승인]). 주민 대부분은 물자와 기술을 주고받는 엔지니어다(2.2 [승인]). 그래서 병력은 도시가 아니라 계약과 공방에서 나오고, 정예 건물은 도시(공작령)마다 하나씩이다.

| 체인 | 단계 | 건물(en / ko) | 지을 수 있는 곳 | 여는 등급과 범주 |
|---|---|---|---|---|
| 계약 | 1 | Contract Hall / 계약 회관 | 자유도시의 모든 역 | 1~2등급 infantry, missile |
| 계약 | 2 | Company Exchange / 계약대 거래소 | 환승역 | 3등급 infantry, missile, commander |
| 계약 | 3 | City Charter House / 도시 계약청 | 도시 공작령 본역(최대 7) | 4등급 infantry, commander |
| 공방 | 1 | Workshop Floor / 공방 조립장 | 자유도시의 모든 역 | 2등급 drone, 2등급 missile |
| 공방 | 2 | Assembly Works / 조립 공장 | 환승역 | 3등급 drone, 3등급 support |
| 공방 | 3 | Signal Works / 신호 공방 | 도시 공작령 본역 | 4등급 drone, 4등급 support(countermeasure) |
| 궤도 | 1 | Track Shed / 궤도 정비고 | 종착역 또는 환승역 | 2~3등급 fast |
| 궤도 | 2 | Armoured Trolley Yard / 장갑 수레 차고 | 종착역. 세력 전체 2곳 | 3~4등급 war-machine |
| 조합 | 1 | Guild Hall / 기술 조합 회관 | 자유도시의 모든 역 | 1~2등급 support |
| 조합 | 2 | Master Guild Hall / 장인 조합 회관 | 환승역 | 3등급 support(engineer, breacher) |

자유도시에는 5등급을 여는 건물이 없다. 이 빈칸은 9절의 의도된 공백이다.

### 4.4 아크

근거: 아크는 강남 4구이고(2.3 [승인]), 가문 통치를 하며(2.3 [승인]), 신도는 몸의 부위를 기계로 바꾸는 세례를 받는다(2.3 [승인]). 그래서 병력은 가문 집결과 세례에서 나온다. 성소, 봉인, 뇌에 관한 내용은 공개 범위가 정해지지 않았으므로(Q10~Q12) 건물 이름과 조건에 쓰지 않는다.

| 체인 | 단계 | 건물(en / ko) | 지을 수 있는 곳 | 여는 등급과 범주 |
|---|---|---|---|---|
| 가문 | 1 | House Muster Hall / 가문 집결소 | 아크의 모든 역 | 1~2등급 infantry, missile, fast |
| 가문 | 2 | House Guard Yard / 가문 호위 마당 | 환승역 | 3등급 infantry, commander, missile |
| 가문 | 3 | House Seat Hall / 가문 본청 | 아크 공작령 본역(최대 4) | 4등급 commander, infantry |
| 세례 | 1 | Baptism Training Hall / 세례 수련장 | 환승역 | 3등급 infantry, fast |
| 세례 | 2 | Baptism Guard Hall / 세례 호위청 | 아크 공작령 본역 | 4등급 infantry, fast |
| 세례 | 3 | Hierophant's Guard Hall / 교주 호위청 | 세력 전체 1곳 | 5등급 commander, infantry |
| 유물 | 1 | Relic Machine Shed / 유물 기계고 | 종착역. 세력 전체 2곳 | 4~5등급 war-machine |
| 정비 | 1 | House Repair Shop / 가문 정비소 | 아크의 모든 역 | 1~2등급 support |
| 정비 | 2 | Body Repair Hall / 몸 정비청 | 환승역 | 3등급 support |

"교주"는 고예진의 승인 직위다(2.3 [승인]). 건물이 서는 역은 [대기]이며, 기본값은 세력 전체 1곳에 위치 미지정이다.

### 4.5 모집 속도와 건설 비용

| 항목 | 값 | TW:WH 기준 |
|---|---|---|
| 지휘관 하나가 한 유지 간격에 모집하는 분대 | 3 | 군주 하나가 한 턴에 3유닛([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 모집 중인 지휘관의 이동 | 움직이지 못한다 | 모집 중인 군주는 움직이지 못한다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 모집 시간 1~2등급 | 1 유지 간격 | 일반 유닛 1턴([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 모집 시간 3등급 | 2 유지 간격 | 중보병·기병 2턴([조사 B 4.3절](../research/w2v-life-economy-rosters.md) E·F행) |
| 모집 시간 4등급 | 3 유지 간격 | 장갑 차량 3턴(G행) |
| 모집 시간 5등급 | 4 유지 간격 | 괴수·포병 등 최대 4턴([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 건물 1단계 | 비용 750, 1 유지 간격 | 1단계 750 금화, 1턴([건물 표](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=7429&prop=wikitext&format=json), [조사 B 4.5절](../research/w2v-life-economy-rosters.md)) |
| 건물 2단계 | 비용 1500, 2 유지 간격 | 2단계 1,500, 2턴 |
| 건물 3단계 | 비용 2500, 3 유지 간격 | 3단계 2,500, 3턴 |
| 건물 4단계 | 비용 8000, 5 유지 간격 | 모집 건물 4단계 체인의 4단계: 8,000 금화, 5턴([건물 표](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=7429&prop=wikitext&format=json)) |

- 한 지휘관이 3개를 넘게 주문하면 넘는 분대는 다음 유지 간격으로 밀린다.
- 건물 비용은 병종 `cost`와 같은 단위를 쓴다(P13).

## 5. 비용, 유지비, 상한

### 5.1 등급별 비용 띠

| 등급 | `cost` 띠 | `upkeep` 띠 | TW:WH 기준 |
|---|---|---|---|
| 1 | 150-350 | 30-105 | 1등급 300 / 81([표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json), [조사 B 4.3절](../research/w2v-life-economy-rosters.md) A행) |
| 2 | 350-700 | 70-210 | 2등급 475~600 / 119~150([표본 H](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=651&prop=text&format=json) 475/119, B·C행) |
| 3 | 700-1200 | 140-360 | 3등급 850~1,200 / 225~300(D·E·F행) |
| 4 | 1200-2200 | 240-660 | 4등급 2,100 / 525(G행, [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json)) |
| 5 | 2200-3200 | 440-960 | TW 5등급 표본은 조사에 없다. 4등급 위를 이은 값이다[틀] |

- `upkeep`은 `cost`의 20~30%다. TW:WH 표본의 유지비 비율은 25.0~27.0%이고([표본 A](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=645&prop=text&format=json) 81/300 = 27.0%, [표본 G](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=668&prop=text&format=json) 525/2,100 = 25.0%), 띠는 그 둘레에 ±5%포인트를 둔다. 유지비 띠의 위아래 끝은 비용 띠 끝의 20%와 30%다. 5등급 위 끝은 3,200의 30%인 960이다.
- 같은 등급 안에서 결핍 투입물을 쓰는 병종은 비용 띠의 위쪽 절반을 쓴다.
- 자유도시의 계약 병종(`hired-company` 태그)은 같은 등급보다 모집 비용을 띠 아래쪽에, 유지비 비율을 28~30%로 둔다. 싸게 빌리고 오래 쓰면 비싸다.
- 아크의 가문 징집병은 유지비 비율을 20~22%로 둔다. 가문이 먹이고 입힌다.
- 위 두 비율 조정은 TW:WH 수치가 아니라 세력 정체성을 위한 설계 조정이다[틀].

### 5.2 유지 간격

유지비와 결핍 투입물은 캠페인의 "유지 간격"마다 낸다. 간격의 길이는 19번 과제와 시스템 설계(18번 과제)가 정한다. 이 문서는 정하지 않는다.

### 5.3 `unit_cap` 규칙

`unit_cap`은 세력 전체에서 동시에 존재할 수 있는 그 병종 분대의 수다(군대 하나가 아니다).

| 조건 | `unit_cap` | TW:WH 기준 |
|---|---|---|
| 1~2등급이고 결핍 투입물 없음 | NULL(상한 없음) | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 1~2등급이고 결핍 투입물 있음 | NULL 또는 4-8 | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 3등급 | NULL 또는 3-8 | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 4등급 | 2-4(필수) | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| 5등급 | 1-2(필수) | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| `drone` 범주 | 2-6(필수) | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |
| `irreplaceable` 태그 | 1(필수) | 해당 없음. 유지비를 내는 TW 세력은 상한이 없다([Recruitment](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=42904&prop=wikitext&format=json)) |

## 6. 결핍 투입물

### 6.1 어휘

`scarce_input`에는 아래 여섯 문자열만 쓴다.

| 값 | ko | 뜻 | 근거 |
|---|---|---|---|
| `ammo` | 탄약 | 화기 탄. 탄피는 다시 쓰지만 뇌관과 장약이 병목이다 | 바이블 1절 15행 [승인] "탄약과 부품이 귀해서 한 발, 한 대가 아쉽다". 조사 A 3절 |
| `cells` | 전지 | 충전지와 축전지. 영하에서는 충전이 막힌다 | 조사 A 2.4절 |
| `implants` | 이식 부품 | 사이버웨어의 예비 부품과 정비 | 바이블 1절 14행 [승인] |
| `fuel` | 연료 | 엔진과 발전기의 연료 | 바이블 1절 15행 "전쟁 장비" |
| `parts` | 기계 부품 | 기계와 드론의 예비 부품 | 바이블 1절 15행 [승인] |
| `medicine` | 의약품 | 항생제와 응급 약품 | 조사 A 2.1절(감염 관리) |

### 6.2 반드시 값이 있어야 하는 병종

| 규칙 | 조건 | 필요한 값 |
|---|---|---|
| 결핍-1 | `category`가 `drone` | `cells` 포함 |
| 결핍-2 | `attributes`에 `baptised` 또는 `wired-body`가 있음 | `implants` 포함 |
| 결핍-3 | `ammo` 컬럼이 NULL이 아니고, `category`가 `drone`이 아니며, `attributes`에 `muscle-powered`가 없음(화기나 포를 쓰는 병종. 드론의 `ammo`는 출격 횟수다) | `ammo` 포함 |
| 결핍-4 | `category`가 `war-machine` | `fuel` 또는 `cells` 포함 |
| 결핍-5 | `role`이 `medic` | `medicine` 포함 |

조건에 걸리지 않는 병종은 NULL로 둔다. 값을 정하는 순서는 다음과 같으며, 이 순서대로 하면 어느 병종이든 값이 하나로 정해진다.

1. 결핍-1부터 결핍-5까지 순서대로 걸리는 규칙을 모두 찾는다. 순위는 결핍-1 > 결핍-2 > 결핍-3 > 결핍-4 > 결핍-5다.
2. 걸린 규칙마다 값 하나를 정한다. 결핍-4의 값은 세력으로 정한다: 정부와 아크는 `fuel`, 자유도시는 `cells`다. 나머지 규칙은 표의 값 하나뿐이다.
3. 같은 값이 두 번 나오면 순위가 높은 쪽 하나만 남긴다.
4. 순위가 가장 높은 값이 주 투입물이고 앞에 쓴다. 두 번째 값이 있으면 쉼표 뒤에 쓴다.
5. 값이 하나뿐이고 `category`가 `drone` 또는 `war-machine`이면 `parts`를 두 번째 값으로 붙인다. 기계는 예비 부품 없이 굴러가지 않기 때문이다.
6. 값이 셋 이상이면 순위 상위 둘만 쓴다. 이렇게 하면 결핍-1~결핍-3 가운데 걸린 값은 둘 넘게 걸리지 않는 한 빠지지 않는다. 결핍-1과 결핍-2가 함께 걸리는 병종(드론이면서 이식 분대)은 만들지 않는다.

예: 포를 단 정부 장갑차는 결핍-3(`ammo`)과 결핍-4(`fuel`)에 걸려 `ammo,fuel`이다. 포가 없는 정부 장갑차는 `fuel,parts`다. 자유도시 장갑 수레에 포가 있으면 `ammo,cells`, 포가 없으면 `cells,parts`다. 자유도시 드론은 결핍-1(`cells`)만 걸리므로 5번에 따라 `cells,parts`다. 어느 규칙에도 걸리지 않는 병종(예: 손으로 미는 궤도 수레)은 언제나 NULL이다. 아크 세례 사격병은 결핍-2(`implants`)와 결핍-3(`ammo`)에 걸려 `implants,ammo`다. 5번 과제의 빌드 검사는 결핍-1과 결핍-2를 검사한다.

### 6.3 놀이에서 결핍이 느껴지는 방식

- **세력 비축.** 세력은 여섯 투입물 각각의 비축량을 가진다. 결핍 투입물이 있는 분대는 유지 간격마다 주 투입물 1을 쓴다.
- **전투 소모.** 그런 분대가 전투에 나가면(자동 전투와 수동 전투가 같다) 주 투입물 1을 더 쓴다. 쏜 탄수는 전투 뒤 비축에서 채운다. 분대 하나를 채우는 데 `ammo` 1이 든다.
- **떨어졌을 때.** 비축이 0이면 다음 효과가 생긴다.

| 투입물 | 비축 0의 효과 | TW:WH 기준 |
|---|---|---|
| `ammo` | 다음 전투의 시작 탄수가 `ammo`의 25%(올림)다 | 해당 없음. TW 탄약은 전투마다 다시 찬다([Ammunition](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=39739&prop=wikitext&format=json)). 결핍 규칙은 설계 추가다[틀] |
| `cells` | 드론 분대는 배치할 수 없다. 다른 분대는 `cells`에 기대는 태그 효과를 잃는다 | 해당 없음. TW 대응 자원이 없다 |
| `implants` | `baptised`, `wired-body` 분대의 근접 공격·근접 방어가 20% 줄고 리더십이 10 줄며, 인원 보충이 멈춘다 | 해당 없음. TW 대응 자원이 없다 |
| `fuel` | 엔진을 쓰는 분대는 속도가 절반이다. 엔진만으로 움직이는 전쟁 기계는 배치할 수 없다 | 해당 없음. TW 대응 자원이 없다 |
| `parts` | 기계와 드론의 체력이 전투 사이에 회복되지 않고 잃은 기체·차체를 채우지 않는다 | 해당 없음. TW 대응 자원이 없다 |
| `medicine` | 사람 분대의 인원 보충이 절반이다. 전투 뒤 부상자가 돌아오지 않는다 | 해당 없음. TW 대응 자원이 없다 |

- **보이는 곳.** 모집 화면과 군대 화면에 투입물 아이콘과 남은 유지 간격 수를 띄운다(화면 설계는 18번 과제). 플레이어는 정예 하나를 더 뽑을지, 비축을 아낄지 고르게 된다.
- **세력마다 다른 병목.** 정부는 `ammo`, `fuel`을 많이 쓴다. 자유도시는 `cells`, `parts`를 많이 쓴다. 아크는 `implants`를 많이 쓴다. 9절의 정체성 표와 맞물린다.

## 7. 속성 태그

이름은 모두 이 문서가 새로 지은 것이다. 다른 게임의 속성 이름을 옮기지 않는다. `attributes`에는 id만 쓴다.

| id | ko | en | 효과 |
|---|---|---|---|
| `ledger-levy` | 장부 징발 | Ledger levy | 이 분대가 도주하거나 무너져도 `ledger-levy`가 없는 아군 분대의 사기가 깎이지 않는다 |
| `house-bound` | 가문 결속 | House-bound | 같은 군대에 같은 세력의 `commander` 분대가 살아 있는 동안 사기 +5 |
| `hired-company` | 계약 용병 | Hired company | 세력 금고가 음수인 유지 간격마다 리더십 −10. 0이 되면 계약이 끝나 군대에서 빠진다 |
| `charge-breaker` | 돌격 막이 | Charge breaker | 정면에서 받는 `fast` 분대의 돌격 효과를 없애고, 그 분대에게 근접 공격 +10 |
| `shield-line` | 방패줄 | Shield line | 정면에서 받는 사격 피해 −30% |
| `plate-biter` | 쇠뚫이 | Plate biter | 근접 피해의 절반이 상대 장갑을 무시한다 |
| `machine-hunter` | 기계 사냥 | Machine hunter | `war-machine`, `drone`을 상대로 근접 공격 +12, 사격 피해 +25% |
| `net-casting` | 그물치기 | Net casting | 사거리 안의 적 드론이 공격할 때 피해 −50%. 그물은 전투마다 2회 |
| `static-veil` | 잡음 장막 | Static veil | 반경 120m 안의 전파 조종 드론이 공격할 수 없다. `cells`가 필요하다 |
| `fibre-guided` | 줄조종 | Fibre-guided | `static-veil`의 영향을 받지 않는다. 사거리는 이미 `range`에 반영돼 있다 |
| `radio-linked` | 전파 조종 | Radio-linked | `static-veil` 안에서 공격할 수 없다. 모든 무선 드론에 붙인다 |
| `frost-hardened` | 혹한 단련 | Frost-hardened | 지상 전장(지상 폐허, 한강 횡단 구간)에서 피로가 쌓이지 않는다 |
| `thin-clad` | 얇은 차림 | Thin-clad | 지상 전장에서 피로가 두 배로 쌓인다. 11절 복장 규칙과 짝을 이룬다 |
| `tunnel-fighter` | 굴길 싸움 | Tunnel fighter | 터널과 작은 역사 전장에서 근접 방어 +8 |
| `rail-borne` | 궤도 기동 | Rail-borne | 선로 위에서 속도 +30%, 선로 밖에서 속도 −50% |
| `quiet-step` | 발소리 죽이기 | Quiet step | 움직이는 동안에도 매복 상태를 유지한다 |
| `scout-deploy` | 선발 배치 | Scout deploy | 배치 구역 밖 앞쪽에 배치할 수 있다 |
| `roll-call` | 호명 | Roll call | 반경 40m 안의 아군 분대 사기 +4. 지휘관 효과와 겹치지 않고 큰 쪽만 쓴다. +4는 TW:WH의 격려 효과 값이다([Encourage](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=38158&prop=wikitext&format=json)). 반경 40m는 TW 숫자가 없어 [대기]다 |
| `field-repair` | 현장 수리 | Field repair | 전투 중 가까운 아군 기계·드론의 체력을 회복한다. 잃은 기체는 되살리지 않는다. `parts`가 필요하다 |
| `field-dressing` | 응급 처치 | Field dressing | 가까운 아군 사람 분대의 전투 뒤 사망 일부를 부상으로 바꾼다. 죽은 사람을 되살리지 않는다(GDD 구호 원칙) |
| `breach-charge` | 문 따기 | Breach charge | 문, 방벽, 봉쇄 시설에 주는 피해 x3 |
| `baptised` | 세례받은 몸 | Baptised body | 아크의 세례를 받은 분대. `implants`가 필요하다. 6.3절 결핍 효과를 받는다 |
| `wired-body` | 기계 이식 | Wired body | 아크 밖의 사이버웨어 분대. `implants`가 필요하다. 6.3절 결핍 효과를 받는다 |
| `iron-dread` | 쇠울림 | Iron dread | 근접 중인 적 1~2등급 분대의 사기 −8 |
| `last-to-leave` | 끝까지 남는 자 | Last to leave | 자기 군대의 지휘관이 살아 있으면 도주하지 않는다. 지휘관이 죽으면 다른 분대와 같은 판정을 받는다 |
| `skilled-crew` | 숙련 조원 | Skilled crew | 재장전과 조종이 빠르다. 전투 시작 탄수 +25%(올림) |
| `hand-loaded` | 재장전 탄 | Hand-loaded | 탄 비용이 싸다. 전투 소모에서 `ammo` 대신 절반만 쓰지만, 사격 피해가 −10% |
| `muscle-powered` | 근력 사격 | Muscle-powered | 화기가 아닌 사격(석궁, 투석, 투척). 결핍-3에 걸리지 않는다 |
| `irreplaceable` | 다시 못 만드는 것 | Irreplaceable | 잃으면 그 병종의 `unit_cap`이 영구히 1 줄어든다 |

태그 조합 규칙:

- `radio-linked`와 `fibre-guided`는 함께 쓰지 않는다. 모든 드론은 둘 가운데 하나를 가진다.
- `frost-hardened`와 `thin-clad`는 함께 쓰지 않는다.
- `baptised`는 아크만, `wired-body`는 아크 밖 세력만 쓴다. `ledger-levy`는 정부만, `house-bound`는 아크만, `hired-company`는 자유도시만 쓴다.

## 8. 상성 설계

### 8.1 규칙

- 범주마다 이기는 범주가 둘 이상, 지는 범주가 둘 이상이다(8.2 표).
- 어떤 세력도 상대 세력의 모든 범주에 맞설 답을 하나 이상 가져야 한다. 범주가 빈 세력은 태그로 답한다. 예: 드론이 없는 아크는 `net-casting` 지원 분대로 드론에 답한다.
- 같은 등급에서 한 병종이 다른 병종을 이기는 축은 하나다. 높은 수치를 모든 축에 몰아주지 않는다. 4~5등급만 두 축을 가질 수 있다.
- 비싼 병종은 싼 답에 진다. 4~5등급 전쟁 기계마다 2~3등급의 답(`plate-biter`, `machine-hunter`, `breach-charge`, 타격 드론)이 상대 세력에 적어도 하나 있어야 한다.

### 8.2 범주 상성표

행이 공격하는 쪽, 열이 받는 쪽이다. `+`는 유리, `−`는 불리, `=`는 비김, `T`는 태그에 달렸다는 뜻이다.

| 공격 \ 받음 | commander | infantry | missile | fast | drone | war-machine | support |
|---|---|---|---|---|---|---|---|
| commander | = | + | − | = | T | − | + |
| infantry | − | = | + | + | − | − | + |
| missile | + | + | = | − | T | − | = |
| fast | = | − | + | = | + | − | + |
| drone | + | = | + | − | = | + | − |
| war-machine | + | + | + | = | − | = | − |
| support | − | − | = | − | + | + | = |

읽는 법:

- 보병은 기동병의 돌격을 막고(`charge-breaker`), 사격병과 지원병을 잡는다. 장갑과 드론에는 약하다.
- 사격병은 보병과 지휘관 호위를 잘 쏜다. 기동병에게 뒤를 잡히고 장갑은 뚫지 못한다. 드론과의 상성은 `net-casting`, `machine-hunter` 같은 태그에 달렸다.
- 기동병은 사격병, 지원병, 드론 조종 진지를 습격한다. 대열을 갖춘 보병과 장갑에 진다.
- 드론은 장갑 위를 치고 사격병과 지휘관을 찾아낸다. 지원병의 그물과 잡음 장막, 기동병의 습격에 진다.
- 전쟁 기계는 보병, 사격병, 지휘관을 누른다. 드론과 공병(지원)의 문 따기에 진다.
- 지원은 드론과 전쟁 기계를 잡는 답이다. 직접 싸우는 분대에는 진다.

### 8.3 `counters` 쓰는 법

- `counters`에는 이 병종이 상대하기 좋은 병종의 `id`를 1~4개 적는다. 8.2 표에서 `+`인 범주의 병종만 적는다.
- 다른 세력의 `id`를 적는 것이 기본이다. 다만 13~15번 과제는 병렬로 진행한다. 그래서 각 명단은 먼저 자기 세력 `id`만으로 `counters`를 채워 빌드 검사를 통과시킨다. 자유도시끼리, 가문끼리, 상원의원끼리도 싸우므로 자기 세력 `id`도 의미가 있다. 세 명단이 모두 합쳐진 뒤 마지막으로 합쳐지는 명단 과제가 세력을 넘는 `id`를 하나 이상 더한다. [대기] 이 통합 담당은 오케스트레이터가 정한다.

## 9. 세력 정체성 표

목표 명단 크기는 세력마다 18~26개다. 아래 "범주 수"는 13~15번 과제가 지킬 범위다. 0은 일부러 비운 칸이다.

### 9.1 범주 수

| 범주 | 정부 | 자유도시 | 아크 |
|---|---|---|---|
| `commander` | 2-3 | 1-2 | 3-4 |
| `infantry` | 6-8 | 3-5 | 7-9 |
| `missile` | 4-6 | 4-6 | 2-3(3등급 이하) |
| `fast` | 1-2 | 2-4 | 2-3 |
| `drone` | 1-2 | 3-4 | 0 |
| `war-machine` | 3-4 | 2-3(4등급 이하) | 1-2(`irreplaceable`만) |
| `support` | 1-2 | 3-4 | 2-3 |

### 9.2 강점과 의도된 공백

| 세력 | 정체성 | 강점 | 의도된 공백 | 정본 근거 |
|---|---|---|---|---|
| 정부 | 현대 봉건 연합 병과. 장부 징집병의 수와 남은 현대 무기 | 수가 많은 싼 징집 보병. 포와 장갑차. 작은 국가 비행반. 상원의원 근위대 | **이식 병종 없음**(`wired-body` 0). **용병 없음**. 지원과 현장 수리가 얇다(지원 1~2). 1~2등급 징집병의 사기가 낮다 | 장부에 오른 사람만 국민이다(2.1) → 장부 밖 사람을 돈으로 빌리지 않는다. 결핍 때문에 일이 세습되고 수직 계층이 굳었다(1절 12행) → 징집병과 근위대의 사기 차이가 크다. 사이버웨어는 정비와 그것을 쥔 세력에 닿을 수 있느냐로 갈린다(1절 14행) → 정부는 기술자 공동체(자유도시)와 세례 공동체(아크)가 아니므로 이식 병종을 두지 않는다[틀] |
| 자유도시 | 엔지니어 조합 도시국가. 계약 용병과 숙련 조원 | 드론과 전파 방해. 현장 수리와 공병. 궤도 기동. 숙련 사격병 | **장부식 대량 징집 없음**(1등급 보병 최대 1). **5등급 없음**. 무거운 장갑이 4등급에서 멈춘다. 지휘관 호위가 적다(1~2) | 하나의 권력이 아닌 도시국가들이고 왕이 없다(2.2) → 도시를 넘어 사람을 징발할 권력이 없다. 지도자도 뽑지 못했다(2.2 1장 인용) → 군대를 하나로 묶는 지휘 병종이 적다. 주민 대부분이 엔지니어다(2.2) → 드론, 수리, 공병이 강하다 |
| 아크 | 가문 위계와 세례받은 이식 전사 | 1~5등급에 걸친 세례 근접 보병. 높은 사기. 지휘관 호위가 많다. 되살린 옛 기계 | **드론 없음**(0). **포 없음**(`artillery` 0). 사격병이 적고 3등급에서 멈춘다. 영토가 4구뿐이라 명단이 18~22개로 작다 | 신앙을 이식한 부위 수로 센다(2.3) → 자원이 몸에 간다. 가문 통치(2.3) → 가문 호위가 많고 사기가 높다. 강남 4구(2.3) → 가장 작은 생산 기반. 드론과 포가 없는 것은 이 근거에서 나온 설계 선택이다[틀] |

### 9.3 세력별 결핍 병목

| 세력 | 많이 쓰는 투입물 | 놀이에서의 압박 |
|---|---|---|
| 정부 | `ammo`, `fuel` | 포와 장갑차를 많이 굴릴수록 탄과 연료가 바닥난다 |
| 자유도시 | `cells`, `parts` | 드론과 수리에 전지와 부품이 묶인다. 추운 지상에서 전지가 약해진다 |
| 아크 | `implants`, `medicine` | 세례 정예가 강하지만 이식 부품이 끊기면 정예 전체가 무너진다 |

## 10. D3 지휘 규칙

### 10.1 원칙 [승인]

- 소유자 결정 D3: "전투 방식은 토탈워랑 동일하게 지휘관이 모든 분대의 지휘권한을 갖음".
- 군대 하나에 지휘관 하나다. 지휘관은 군대의 모든 분대를 지휘한다. 분대가 따로 움직이는 권한은 없다(2.5).

### 10.2 지휘관과 영웅

- 지휘관은 인물 원장의 이름 있는 영웅이다. GDD의 `ExpeditionSquad`에서 정식 영웅 지휘관 한 명이 필요하다는 규칙과 같다.
- 지휘관은 `commander` 범주 호위 분대 하나와 함께 배치된다. 배속 영웅도 각자 `commander` 범주 호위 분대 하나와 함께 배치된다. 영웅은 `squad_size`에 세지 않는다(GDD `SoldierSquad`).
- 영웅은 명령 대상이지만 직접 조작하지 않는다(GDD "영웅 직접 액션 조작은 목표 범위가 아니다").

### 10.3 분대 수 상한과 명령

- **[틀][대기] 군대 하나의 분대 상한은 20칸이다.** 지휘관 호위 1칸을 포함하고, 배속 영웅 한 명(호위 포함)이 1칸을 쓴다. D3의 "토탈워랑 동일하게"와 2026-11-12 소유자 지시("전투 기준 값은 알려진 워해머 토탈워 정보를 기준으로 로스터 잡아서 작업 합니다")를 따른 값이다. TW:WH 군대는 군주 하나가 이끄는 1~20유닛이다([Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5578&prop=wikitext&format=json)). GDD `hero-squads-and-time-based-movement`의 "분대 수에 고정 상한을 두지 않는다"와 부딪히므로 소유자 확인을 기다린다(13절).
- 명령은 GDD가 정한 네 가지다: 이동, 공격 대상, 사격, 매복. 전투 전에 배치와 진형을 정한다.
- 근접 교전에 들어간 분대는 그 교전이 끝날 때까지 새 명령을 받지 않는다(GDD).
- 후퇴는 분대 명령이 아니라 전투 전체 명령이다(GDD).
- **명령 거리 제한은 없다.** 지휘관은 전장 어디에 있든 모든 분대에 즉시 명령한다. GDD SP-1.0.0 "본체가 전투 지휘관이면 지휘에 배속된 모든 전투맵 분대를 직접 조정·명령한다"와 같다.
- **존재 반경은 있다.** [틀][대기] 지휘관 호위 분대 반경 50m 안의 아군 분대는 사기 보너스를 받는다. 기본값은 +8이다. 이것은 명령 거리가 아니라 사기 효과의 거리다. TW:WH 군주의 사기 효과는 있지만 반경과 값이 공개되지 않았다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json)). 그래서 50m와 +8은 TW 숫자 없이 [대기]다.

### 10.4 사기와 패주

| 상태 | 조건 [틀][대기] | 결과 | TW:WH 기준 |
|---|---|---|---|
| 굳건 | 현재 사기 > 기본 리더십의 25% | 명령대로 움직인다 | 해당 없음 |
| 흔들림 | 현재 사기 ≤ 기본 리더십의 25% | 명령은 받지만 근접 공격 −10 | 흔들림 상태는 있다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json)). 25%와 −10은 TW 숫자 없음. 그래서 [대기]다 |
| 도주 | 현재 사기 ≤ 0 | 명령을 받지 않고 퇴로로 달아난다. 안전해지면 다시 모일 수 있다 | 도주한 유닛은 안전해지면 다시 모인다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json)) |
| 흩어짐 | 한 전투에서 네 번째로 무너질 때. 세 번 도주한 분대가 다시 무너지면 흩어진다 | 다시 모이지 않는다 | 세 번 도주한 유닛은 다음에 리더십이 무너질 때 흩어진다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json)) |

- 사기를 깎는 원인은 GDD가 정한 것을 쓴다: 부상, 아군의 사망·기절·도주, 지휘관에게 일어난 일. 측후면 공격, 피로, 공포 태그(`iron-dread`)를 더한다. 원인 목록은 TW:WH와 같다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json): 포위·측후면 공격, 돌격, 군주 전사, 공포, 피로, 피해).
- 도주하는 분대는 반경 30m 안의 아군 분대 사기를 −5 깎는다. `ledger-levy` 분대가 도주할 때는 깎지 않는다. 도주가 이웃 사기를 깎는 것과 소모품 예외는 TW:WH에 있다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json), [Units](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=432&prop=wikitext&format=json)). 30m와 −5는 TW 숫자 없음. 그래서 [대기]다.
- **군대 붕괴.** 분대의 절반 이상(수 기준)이 도주, 흩어짐, 전멸 상태이면 남은 모든 분대가 사기 −15를 받고, 그 조건이 이어지는 동안 다시 모이지 못한다. 모든 분대가 도주하면 GDD의 "사기 패주"로 전투가 끝난다. TW:WH에도 군대가 많이 잃으면 모두 흔들리는 단계가 있다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json)). 절반과 −15는 TW 숫자 없음. 그래서 [대기]다.
- 숫자는 흩어짐 규칙을 빼고 모두 [대기]다. GDD는 공포 판정식과 도주 문턱을 미정으로 둔다. 19번 과제가 GDD 규칙 판본과 함께 확정한다.

### 10.5 지휘관이 죽었을 때

1. **충격.** 모든 분대가 즉시 사기 −20을 받는다(거리 무관). 반경 50m 안의 분대는 −10을 더 받는다. 존재 반경 보너스가 사라진다. TW:WH에서 군주 전사는 리더십을 깎고 군대를 무너뜨릴 수 있다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json), [Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5578&prop=wikitext&format=json)). −20, −10, 50m는 TW 숫자 없음. 그래서 [대기]다.
2. **연쇄 패주.** 충격으로 사기가 0 이하가 된 분대는 도주하고, 그 도주가 10.4절대로 이웃 분대 사기를 깎는다.
3. **임시 분대장.** 지휘관 호위 분대가 남아 있으면 그 병졸 가운데 한 명이, 없으면 남은 분대 가운데 기본 리더십이 가장 높은 분대의 병졸 한 명이 임시 분대장(`TemporaryLeader`)이 된다. GDD대로 임시 분대장은 정식 지휘관과 같은 명령을 내릴 수 있지만 지휘 효과는 약하다. [틀][대기] 기본값: 존재 반경 보너스가 없다. 정식 영웅의 클래스와 캠페인 역할을 받지 않는다. 영웅 초상과 클래스 표식을 쓰지 않는다(GDD UI 계약).
4. **배속 영웅.** 배속 영웅은 지휘를 넘겨받지 않는다. 지휘는 3번의 임시 분대장이 맡는다(GDD 임시 분대장 규칙). 배속 영웅은 자기 호명 효과 +4만 유지한다(`roll-call`과 같은 값, 겹치지 않고 큰 쪽만 쓴다). TW:WH에도 전투 중 영웅이 군주 자리를 넘겨받는 규칙이 없고, 새 군주는 전투 뒤에 모집한다([Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5578&prop=wikitext&format=json), [Encourage](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=38158&prop=wikitext&format=json)).
5. 지휘관이 기절하거나 중상을 입어 전투에서 빠져도 같은 순서를 쓴다. 충격만 −10으로 줄인다.
6. 지휘관의 생사, 부상, 구금은 인물 ID에 남긴다(RBATTLE-08, RBATTLE-09). 포획은 전투 뒤 신병 처리에서 정한다.

### 10.6 영웅, 결투, 개인 판정

- **결투가 열리는 때.** 서로 다른 군대의 두 영웅(호위 분대 포함)이 근접 교전에 들어가면 두 영웅이 결투를 한다. 호위 병사끼리는 집계 판정으로 싸운다.
- **결투 판정.** 결투는 GDD 개인 판정 전투로 푼다. 공격자의 무기, 방어자의 방어구, 두 사람의 전투 기술 차이, 몸 상태와 기분이 들어간다(RBATTLE-24). [대기] 인물의 무용(Prowess)을 전투 기술 입력으로 쓰는 것이 기본값이다. 계산식은 GDD에서 아직 미정이다.
- **결투 결과가 집단 전투로 이어지는 방법.**

| 결과 | 진 쪽 | 이긴 쪽 | TW:WH 기준 |
|---|---|---|---|
| 사망 | 지휘관이면 10.5절 전체. 배속 영웅이면 그 영웅 군대의 모든 분대 사기 −8 | 반경 50m 안의 아군 분대 사기 +10 | 영웅 전사가 사기를 깎는 것은 TW에 있다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json)). −8, +10, 50m는 TW 숫자 없음. 그래서 [대기]다 |
| 기절·중상 | 전투에서 빠진다. 지휘관이면 10.5절(충격 −10) | 반경 50m 안의 아군 분대 사기 +6 | +6, 50m는 TW 숫자 없음. 그래서 [대기]다 |
| 물러남 | 영웅이 호위 분대 뒤로 빠지고, 그 호위 분대 사기 −10 | 변화 없음 | −10은 TW 숫자 없음. 그래서 [대기]다 |

- **중복 금지.** 결투의 피해는 두 영웅에게만 적용한다. 호위 분대의 손실은 집계 판정에서만 나온다. 같은 공격을 두 채널에 넣지 않는다(GDD 중복 피해 금지).
- **지휘 능력.** [대기] 지휘관의 군사(Martial)가 존재 반경 보너스의 크기를 정하는 안을 기본값으로 둔다: +4 + floor(군사 / 4), 최대 +12. TW:WH 군주 사기 효과의 값이 공개되지 않아 이 식도 TW 숫자 없이 [대기]다. 분대 정원 산식은 GDD가 "지휘관의 독자 기량" 입력으로 미정이라 이 문서도 정하지 않는다. 511명의 능력치 산정 방식은 Q17이다.

## 11. 이름과 겉모습

### 11.1 이름 규칙

- `name`은 기능을 말하는 일반 영어다(Title Case). `name_ko`는 한국어 일반어다. 예: Ledger Levy Spears / 장부 징발 창병.
- 형식: [소속·출처 표지] + [무기나 기능] + [병, 반, 대, 조]. 표지는 세력마다 다르다. 정부는 장부, 상원, 국가. 자유도시는 계약, 공방, 조합, 궤도. 아크는 가문, 세례, 교주, 유물.
- 쓰지 않는 것: 실제 상표, 회사, 무기 모델 이름. 다른 게임의 병종 이름과 속성 이름. 바이블 4절 금지 어휘 표의 모든 항목. 아크 병종에 성직이나 수도회를 떠올리게 하는 말. 아직 승인되지 않은 칭호(9.1절 제안 칭호, 13절).
- 자유도시 용병은 "계약대", "계약병"이라 부른다.

### 11.2 장비 문구(`equipment`)

- 한 문장에서 세 문장. 주무기, 방호구, 결핍 투입물에 기대는 장비 순서로 쓴다.
- 결핍을 드러낸다. 예: "탄피를 회수하는 자루", "손으로 다시 채운 탄", "부품을 떼어 맞춘 총열", "체온으로 데우는 전지 주머니".
- 화기는 종류만 쓴다(볼트식 소총, 기관단총, 경기관총, 박격포). 모델 이름은 쓰지 않는다.
- 이식은 부위와 기능만 쓴다(팔, 다리, 손, 눈, 등). 개별 부품 이름은 짓지 않는다(바이블 1절 14행).

### 11.3 겉모습 문구(`appearance`)

GDD 아트 방향을 따른다.

- 실루엣은 1940년대 제2차 세계대전기 복장이다(`character-art-direction.json:142`). 외투, 누빔 솜옷, 각반, 펠트 장화, 귀덮개 모자, 가스 마스크 주머니 같은 형태다.
- 겨울이 계속된다(`:144`, 바이블 1절 4행 영원한 겨울). 모든 병종이 겨울옷을 입는다.
- 두께는 지상 노출에 비례하고 등급에 반비례한다(`:149`).

| 구분 | 겹 수 기준 |
|---|---|
| 1~2등급, 지상에 자주 나감 | 4~5겹. 누빔 솜옷, 덧바지, 펠트 장화, 귀덮개 모자 |
| 1~2등급, 주로 지하 | 3~4겹 |
| 3등급 | 3겹. 몸에 맞춘 외투 |
| 4~5등급 | 1~2겹. 얇게 맞춘 외투나 짧은 웃옷 |
| 지상 정찰·기동 역할(`recon`, `raider`, `frost-hardened`) | 등급과 무관하게 +1~2겹 |

- 4~5등급이나 `baptised` 분대에 얇은 차림을 줄 때는 `thin-clad` 태그를 함께 단다. `frost-hardened` 분대는 두꺼운 차림을 쓴다.
- 세력 색은 띠, 완장, 선두름으로만 쓴다: 정부 `#426f99`, 자유도시 `#567b46`, 아크 `#b54b4b`(`faction.color`).
- 해진 옷, 기운 자리, 덧댄 천, 서로 다른 출처의 장비를 섞어 결핍을 보인다. 정예일수록 덜 해졌다.

## 12. 예시 병종

**아래는 규칙을 보이는 예시이며 명단 행이 아니다.** 13~15번 과제는 이 행을 그대로 옮기지 않는다. 이름과 `id`를 다시 쓰고 싶으면 다시 써도 된다. 세력마다 예시 둘의 4~5등급 비율도 3.3절을 지키도록 1~3등급만 골랐다.

### 예시 정부-1

| 컬럼 | 값 |
|---|---|
| id | government-ledger-levy-spears |
| faction_id | government |
| sort | 30 |
| name | Ledger Levy Spears |
| name_ko | 장부 징발 창병 |
| category | infantry |
| role | line |
| tier | 1 |
| recruit_building | Levy Ledger Office |
| recruit_building_ko | 징발 장부소 |
| cost | 220 |
| upkeep | 55 |
| unit_cap | NULL |
| scarce_input | NULL |
| squad_size | 60 |
| hp | 69 |
| melee_attack | 20 |
| melee_defence | 34 |
| weapon_strength | 25 |
| armour | 15 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 30 |
| leadership | 45 |
| attributes | ["ledger-levy","charge-breaker"] |
| counters | ["free-city-rail-trolley-raiders"] |
| equipment | Long spears cut from scaffold pipe, and a tin helmet; one spare pair of felt-boot liners per squad. |
| equipment_ko | 비계 파이프를 잘라 만든 긴 창과 양철 철모를 든다. 분대마다 펠트 장화 속감 한 벌을 여벌로 둔다. |
| appearance | Five layers: quilted cotton jacket over a coarse greatcoat, padded over-trousers, felt boots and an ear-flap cap, with a blue-grey ledger armband. |
| appearance_ko | 다섯 겹이다. 거친 외투 위에 누빔 솜옷, 솜 덧바지, 펠트 장화, 귀덮개 모자를 쓰고 청회색 장부 완장을 찬다. |
| gdd_ref | NULL |

### 예시 정부-2

| 컬럼 | 값 |
|---|---|
| id | government-remnant-riflemen |
| faction_id | government |
| sort | 50 |
| name | Remnant Riflemen |
| name_ko | 잔존 소총반 |
| category | missile |
| role | rifle |
| tier | 2 |
| recruit_building | Firing School |
| recruit_building_ko | 사격 교습소 |
| cost | 560 |
| upkeep | 145 |
| unit_cap | NULL |
| scarce_input | ammo |
| squad_size | 30 |
| hp | 69 |
| melee_attack | 16 |
| melee_defence | 17 |
| weapon_strength | 24 |
| armour | 18 |
| missile_damage | 22 |
| range | 145 |
| ammo | 14 |
| speed | 33 |
| leadership | 50 |
| attributes | ["shield-line"] |
| counters | ["arc-house-levy-hooks"] |
| equipment | Bolt-action rifles of mixed origin and a sack for recovered brass; each rifleman draws a counted handful of rounds before battle. |
| equipment_ko | 출처가 제각각인 볼트식 소총과 회수한 탄피를 담는 자루를 든다. 사수마다 전투 전에 센 만큼의 탄을 받는다. |
| appearance | Four layers: a long greatcoat over a quilted jacket, puttees over felt boots, a field cap under a hood, and a blue-grey collar stripe. |
| appearance_ko | 네 겹이다. 누빔 솜옷 위에 긴 외투를 입고 펠트 장화에 각반을 감았으며 두건 아래 야전모를 쓰고 깃에 청회색 줄을 단다. |
| gdd_ref | NULL |

### 예시 자유도시-1

| 컬럼 | 값 |
|---|---|
| id | free-city-workshop-strike-drones |
| faction_id | free-city |
| sort | 60 |
| name | Workshop Strike Drones |
| name_ko | 공방 타격 비행조 |
| category | drone |
| role | strike |
| tier | 3 |
| recruit_building | Assembly Works |
| recruit_building_ko | 조립 공장 |
| cost | 1000 |
| upkeep | 250 |
| unit_cap | 4 |
| scarce_input | cells,parts |
| squad_size | 6 |
| hp | 60 |
| melee_attack | 10 |
| melee_defence | 6 |
| weapon_strength | 18 |
| armour | 0 |
| missile_damage | 120 |
| range | 400 |
| ammo | 2 |
| speed | 85 |
| leadership | 60 |
| attributes | ["radio-linked","skilled-crew"] |
| counters | ["government-remnant-riflemen"] |
| equipment | Six small rotor airframes rebuilt from salvaged motors, each carrying one drop charge; the crew keeps the cells warm in padded pouches against their bodies. |
| equipment_ko | 회수한 모터로 다시 짠 소형 회전익 기체 여섯 대가 각각 투하 폭약 하나를 단다. 조종조는 전지를 솜 주머니에 넣어 몸에 품고 데운다. |
| appearance | The crew wear three layers: a fitted quilted coat, knitted hood and goggles, with green piping and a tool roll on the hip. |
| appearance_ko | 조종조는 세 겹이다. 몸에 맞춘 누빔 외투와 뜨개 두건, 보안경을 쓰고 녹색 선두름과 허리 공구 말이를 단다. |
| gdd_ref | NULL |

### 예시 자유도시-2

| 컬럼 | 값 |
|---|---|
| id | free-city-rail-trolley-raiders |
| faction_id | free-city |
| sort | 45 |
| name | Rail Trolley Raiders |
| name_ko | 궤도 수레 습격대 |
| category | fast |
| role | raider |
| tier | 2 |
| recruit_building | Track Shed |
| recruit_building_ko | 궤도 정비고 |
| cost | 600 |
| upkeep | 150 |
| unit_cap | NULL |
| scarce_input | NULL |
| squad_size | 16 |
| hp | 110 |
| melee_attack | 30 |
| melee_defence | 20 |
| weapon_strength | 30 |
| armour | 20 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 70 |
| leadership | 55 |
| attributes | ["rail-borne","quiet-step"] |
| counters | ["government-remnant-riflemen"] |
| equipment | Hand-pumped rail trolleys with hooked boarding poles and short axes; the pump needs no fuel. |
| equipment_ko | 손으로 펌프질하는 궤도 수레에 갈고리 장대와 짧은 도끼를 싣는다. 펌프는 연료가 들지 않는다. |
| appearance | Four layers for the tunnels: a short quilted jacket, padded trousers, felt boots with rubber overshoes and a knitted cap with a green band. |
| appearance_ko | 터널용 네 겹이다. 짧은 누빔 웃옷, 솜바지, 고무 덧신을 신은 펠트 장화, 녹색 띠를 두른 뜨개 모자를 쓴다. |
| gdd_ref | NULL |

### 예시 아크-1

| 컬럼 | 값 |
|---|---|
| id | arc-house-levy-hooks |
| faction_id | arc |
| sort | 30 |
| name | House Levy Hooks |
| name_ko | 가문 징집 갈고리병 |
| category | infantry |
| role | line |
| tier | 1 |
| recruit_building | House Muster Hall |
| recruit_building_ko | 가문 집결소 |
| cost | 200 |
| upkeep | 42 |
| unit_cap | NULL |
| scarce_input | NULL |
| squad_size | 50 |
| hp | 72 |
| melee_attack | 24 |
| melee_defence | 24 |
| weapon_strength | 26 |
| armour | 12 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 34 |
| leadership | 45 |
| attributes | ["house-bound","charge-breaker"] |
| counters | ["free-city-rail-trolley-raiders"] |
| equipment | Long hooked poles for pulling riders off trolleys and sleds, and a short blade; no firearms. |
| equipment_ko | 수레와 썰매에서 사람을 끌어내리는 긴 갈고리 장대와 짧은 칼을 든다. 화기는 없다. |
| appearance | Four layers: a quilted coat with a red house sash, padded trousers, felt boots and a hood tied under the chin. |
| appearance_ko | 네 겹이다. 붉은 가문 띠를 두른 누빔 외투, 솜바지, 펠트 장화를 입고 턱 밑에서 묶는 두건을 쓴다. |
| gdd_ref | NULL |

### 예시 아크-2

| 컬럼 | 값 |
|---|---|
| id | arc-baptised-breakers |
| faction_id | arc |
| sort | 40 |
| name | Baptised Breakers |
| name_ko | 세례 돌파병 |
| category | infantry |
| role | shock |
| tier | 3 |
| recruit_building | Baptism Training Hall |
| recruit_building_ko | 세례 수련장 |
| cost | 1100 |
| upkeep | 275 |
| unit_cap | 4 |
| scarce_input | implants |
| squad_size | 20 |
| hp | 120 |
| melee_attack | 48 |
| melee_defence | 34 |
| weapon_strength | 55 |
| armour | 55 |
| missile_damage | NULL |
| range | NULL |
| ammo | NULL |
| speed | 34 |
| leadership | 70 |
| attributes | ["baptised","plate-biter","thin-clad","iron-dread"] |
| counters | ["government-remnant-riflemen"] |
| equipment | Heavy breaching hammers swung by machine-replaced arms; each warrior carries a small kit of spare joints for the replaced parts. |
| equipment_ko | 기계로 바꾼 팔로 무거운 돌파 망치를 휘두른다. 전사마다 바꾼 부위에 맞는 예비 관절 꾸러미를 지닌다. |
| appearance | Three thin layers: a knitted undershirt, a fitted coat left open at the replaced arm, and a red sash; the metal of the arm shows at the cuff. |
| appearance_ko | 얇은 세 겹이다. 뜨개 속옷 위에 바꾼 팔 쪽을 터 놓은 맞춤 외투와 붉은 띠를 두르고, 소매 끝으로 팔의 쇠가 보인다. |
| gdd_ref | NULL |

예시의 `counters`는 상성 규칙을 보이려고 다른 세력 예시를 가리킨다. 실제 명단은 8.3절 순서를 따른다.

예시 점검: 여섯 행 모두 1.2절 범위와 역할별 사거리, 1.3절 인원 띠, 1.4절 체력·속도 띠, 3.2절 리더십 띠, 5.1절 비용 띠와 유지비 비율, 5.3절 상한, 6.2절 결핍 규칙(값과 순서)을 지킨다. 보병 체력 69는 TW:WH 1등급 창병 1인 체력이고, 소총반 145/22/14/50은 TW:WH 화약 보병(표본 B)의 사거리·사격 피해 합계와 2등급 리더십에 맞춘 값이다. 세력마다 4~5등급은 0개다.

## 13. 소유자 대기 목록

아래 항목은 소유자 답이 없어 임시 기본값을 쓴다. 기본값은 승인이 아니다. 답이 오면 이 문서와 세 명단을 함께 고친다.

| # | 항목 | 걸린 바이블 질문·원천 | 이 문서의 임시 기본값 |
|---|---|---|---|
| P1 | 건물·병종 이름에 쓰는 칭호 | Q1(칭호 사다리, 9.1) | 승인된 칭호(상원의원, 관악 공작, 교주)와 일반어(가문, 계약, 장부)만 쓴다. 역장, 씨장 같은 제안 칭호는 쓰지 않는다 |
| P2 | 아크 병종 설명의 공개 범위 | Q10, Q11, Q12 | 세례가 몸의 부위를 기계로 바꾸는 일이라는 승인 사실만 쓴다. 성소, 봉헌실, 봉인, 뇌, 서울 밖 기계를 세운 일은 병종 문구와 건물 조건에 쓰지 않는다 |
| P3 | 아크 신도 명부 이름 | Q13 | 병종 문구에 명부 이름을 쓰지 않는다 |
| P4 | 이식 시술 묘사 | Q14 | 시술 장면을 묘사하지 않는다. 이미 바꾼 부위의 겉모습만 쓴다 |
| P5 | 정보기관 AI와 최초의 AI | Q15 | 병종과 연결하지 않는다 |
| P6 | 영웅 능력치와 결투·지휘 연결 | Q17, 8절 | 무용 → 결투 기술 입력, 군사 → 존재 반경 보너스(+4 + floor(군사/4), 최대 +12) |
| P7 | 조재표의 직함과 자유도시 용병 이름 | Q20 | 용병은 "계약대", "계약병"으로 부른다. 금지 어휘는 쓰지 않는다 |
| P8 | 임하준(펌프기술)과 아크 기술 병종 | Q22 | 특정 인물을 병종에 묶지 않는다 |
| P9 | 류은비 "의료단"과 정부 의무 체인 | Q27 | 정부 의무 체인 이름을 "장부 의무소", "장부 야전 병원"으로 두고 의료단과 묶지 않는다 |
| P10 | 군대 분대 상한 20칸 | D3, 2026-11-12 소유자 지시, GDD `hero-squads-and-time-based-movement`의 "고정 상한 없음"과 부딪힌다 | 20칸(지휘관 호위 포함, 배속 영웅 1칸씩). 숫자는 소유자 지시대로 TW:WH 군대 1~20유닛([Armies](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5578&prop=wikitext&format=json))에서 왔다. 남은 것은 GDD와의 충돌뿐이며, 19번 과제가 GDD 수정 제안을 함께 낸다 |
| P11 | 흔들림 문턱, 존재 반경과 값, 지휘관 사망 충격, 도주 전파, 군대 붕괴 문턱, 결투 결과 사기, 호명 반경, `iron-dread` 값 | GDD가 수치를 미정으로 둔다. TW:WH도 이 숫자를 공개하지 않는다([Leadership](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=5584&prop=wikitext&format=json), [Encourage](https://totalwarwarhammer.fandom.com/api.php?action=parse&pageid=38158&prop=wikitext&format=json)) | 10.3~10.6절과 7절의 값. TW 출처가 없으므로 [대기]로 둔다. 흩어짐(네 번째 붕괴)과 호명 +4는 TW 값을 따랐으므로 이 목록에서 뺐다 |
| P12 | 배속 영웅의 지휘 승계 | 이전 기본값(영웅이 지휘를 맡음)은 TW:WH와 맞지 않아 없앴다 | 승계하지 않는다. 지휘는 GDD 임시 분대장이 맡고 배속 영웅은 자기 +4만 유지한다(10.5절 4번). 이 항목은 이제 [틀]이며, 소유자가 다른 규칙을 원할 때만 다시 연다 |
| P13 | 비용 단위와 유지 간격 이름 | 조사 B 6절(화폐 단위 제안) | 이름 없는 "비용" 숫자. 간격은 18·19번 과제가 정한다 |
| P14 | 공작령 본역 | 바이블에 없음 | 구 안에서 `degree`가 가장 큰 역, 같으면 `sort`가 작은 역 |
| P15 | 교주 호위청의 위치 | Q12와 겹칠 수 있다 | 세력 전체 1곳, 위치 미지정 |
| P16 | 세력을 넘는 `counters` 통합 담당 | 13~15번 병렬 진행 | 마지막으로 합쳐지는 명단 과제. 오케스트레이터가 정한다 |
| P17 | 자유도시 도시마다 다른 공작령 보유자 칭호 | 바이블 2.4(도시마다 다르다 [제안]) | 건물 이름에 "도시"만 쓴다(도시 계약청) |

## 14. 13~15번 과제 점검표

- [ ] 명단 18~26개, 9.1절 범주 수를 지켰다.
- [ ] 4~5등급 30% 이하, 5등급 1~3개(자유도시 0개).
- [ ] 모든 숫자가 1.2절 범위, 1.3절 인원 띠, 1.4절 체력·속도 띠, 3.2절 리더십 띠, 5.1절 비용 띠, 1.2절 역할별 사거리 안이다. `upkeep`은 `cost`의 20~30%다.
- [ ] `missile_damage`, `range`, `ammo`는 셋이 함께 NULL이거나 함께 값이 있다. `missile` 범주는 값이 있다.
- [ ] 5.3절 상한 규칙과 6.2절 결핍 규칙(값과 순서)을 지켰다.
- [ ] `attributes`는 7절 id만 쓰고 조합 규칙을 지켰다. `counters`는 1~4개이고 모두 있는 `id`다.
- [ ] `recruit_building`은 4절 표의 이름과 글자까지 같다.
- [ ] 이름과 문구에 금지 어휘가 0건이다(`node scripts/pages/scan-terms.mjs` 기준 패턴).
