# 오픈소스 게임 메커니즘 데이터베이스

조사일: 2026-09-17. 입력은 소유자 지정 카탈로그 [bobeff/open-source-games](https://github.com/bobeff/open-source-games)와 연계 목록(osgameclones 등)이다. 상업 게임 중심의 기존 조사(`Reference-Game-Mechanisms.md`, 16종)가 "무엇을 차용할까"를 묻는다면 이 문서는 "열린 소스에서 그것이 어떻게 구현됐는가"를 묻는다. 구조와 인용 규칙은 기존 문서와 같다 — 게임 → 메커니즘 → 원문 근거 → 잔선 채택, `[REF:OS-게임-메커니즘]` 인용 체계, append-only. 하중 사실마다 소스 URL과 열람일(2026-09-17), 25단어 이내 원문 인용을 붙인다. 검증되지 않은 사실은 UNVERIFIED 태그로 남긴다.

수집: 8축 병렬 조사 레인(2026-09-17) + osgameclones 전수 스캔(리드 수행). 완결 후 리드가 하중 사실 10개를 원문에서 직접 대조했다 — 10/10 확인(OpenXcom 패닉 확률, OpenPanzer kF, Wesnoth lawful_bonus=25, Unciv 성장 공식, Freeciv PMT_CONCURRENT, VCMI movementPointsLand, fheroes2 XP 4500, CDDA 적대 임계, Zero-K thresholdMap, BrogueCE 이중 raninit).

계약 유의: 잔선의 전투는 실시간 진형·카드(2026-09-07 소유자 결정)다. 이 문서의 턴제 메커니즘은 전부 '선택지 병기'용 — 공식·상수·데이터 레이아웃은 옮겨도 턴/페이즈 시계는 옮기지 않는다.

## 후보 스캔 (osgameclones 전수 조인, 2026-09-17)

심층 조사 15종 외에 참고 가치가 확인된 후보. 출처는 osgameclones 저장소(github.com/opengaming/osgameclones) games/*.yaml 전수 조인 + 각 repo.

| 후보 | 개발 상태 | 저장소 | 참고 포인트 (도메인) |
|---|---|---|---|
| Jagged Alliance 2 Stracciatella | active | github.com/ja2-stracciatella/ja2-stracciatella | 용병 로스터·개성·충성·부상·고용 경제의 열린 소스 실례 (Character/Battle/Campaign) |
| OpenApoc | very active | github.com/OpenApoc/OpenApoc | X-COM: Apocalypse의 실시간+일시정지 하이브리드 전투 — 실시간 계약의 직접 선례 (Battle) |
| KeeperFX | very active | github.com/dkfans/keeperfx | 부하 크리처 기분·급여·배신 관리 (Character/Battle) |
| Fallout 1/2 Community Edition | sporadic | github.com/alexbatalov/fallout2-ce | 종말 후 동료·AP 행동 경제·크리티컬 실구현 (Character/Battle) |
| UFO: Alien Invasion | sporadic | sourceforge.net/projects/ufoai | 전략+전술 이층을 처음부터 열린 소스로 설계한 사례 (Campaign/Battle) |
| Cortex Command Community Project | active | github.com/cortex-command-community/Cortex-Command-Community-Project | 실시간 분대 통제 + 전략 자원층 (Battle/Campaign) |
| Tanks of Freedom II / Commander Wars | sporadic / active | github.com/P1X-in/tanks-of-freedom-ii / github.com/Robosturm/Commander_Wars | 간접 지휘 턴제 비교예 — Advance Wars 축 (Battle, 선택지 병기) |
| GLSMAC | very active | github.com/afwbkbc/glsmac | Alpha Centauri 파벌 성격·사회 공학 4X (Campaign) |
| Stone Kingdoms | active | gitlab.com/stone-kingdoms/stone-kingdoms | Stronghold 계열 거점 경영·공성 (Settlement) |
| Wyrmsun | active | github.com/Andrettin/Wyrmsun | RTS 속 영웅 성장·캠페인 (Campaign/Battle) |
| OpenTTD | active | github.com/OpenTTD/OpenTTD | 노선·신호·네트워크 운영 — 역 그래프 보조 참고 (Route) |

---

## 1. OpenXcom — 전투 수치·사기·연구·자금 (턴제, 선택지 병기)

소스: github.com/OpenXcom/OpenXcom (master). 배틀스케이프는 상태 스택(walk/projectile/melee/explosion/panic), 타일 복셀 16×16×24.

### 1.1 명중은 이항 판정이 아니라 편차 원뿔이다 [REF:OS-OXC-ACCURACY]

명중률 = `firingStat * weaponAcc / 100`, 웅크림 ×115/100, 양손 불완전 ×80/100. 부상 보정은 `max(10, 25*현재HP/최대HP + 75 - 10*치명상)` — 머리 상처는 항상 계산, 양손 무기는 양 팔을 센다. 발사체는 `rand < accuracy`를 굴리지 않고 편차 구름을 계산해 조준점을 밀어낸다: `deviation = RNG(0,100) - accuracy*100`; ≥0이면 +50(빗나감 구름), 음수면 +10(밀집). 패닉/광폭 상태에서는 명중률을 200으로 나눈다.
- 인용: `int deviation = RNG::generate(0, 100) - (accuracy * 100);` — src/Battlescape/Projectile.cpp (2026-09-17)
- 인용: `return std::max(10, 25 * _health / getBaseStats()->health + 75 + -10 * wounds);` — src/Savegame/BattleUnit.cpp (2026-09-17)
- **잔선 채택 후보**: 카드 판정도 이항 명중 대신 '탄도 편차' 공식을 쓸 수 있다. 자세(진형 열)·부상(지속 부상 계약)이 값에 곱으로 들어가는 구조 그대로.

### 1.2 TU 경제: 고정 틱 vs 최대치 비율 [REF:OS-OXC-TU]

이동/회전/인벤토리는 고정 틱, 공격은 최대 TU의 백분율(snap/aimed/auto 각 무기 지정). `cost = floor(기본TU * cost / 100)`. 턴 회복은 과부하(힘/무게<1이면 비율 축소)·다리 부상(부상당 -10%)·에너지(이동 TU의 절반 소모)로 깎인다. 예약 사격은 snap 33%/auto 40%/aimed 50% 잔류.
- 인용: `// Each fatal wound to the left or right leg reduces the soldier's TUs by 10%.` — src/Savegame/BattleUnit.cpp (2026-09-17)
- **잔선**: AP가 늘어도 발사 횟수가 아니라 이동+반응 저축률이 늘어나는 이원 구조. 실시간에서는 재생 스태미나 풀로 치환.

### 1.3 사기는 계급 키가 있는 부대 전염 그래프다 [REF:OS-OXC-MORALE]

사기 상한 100. 피격 시 `morale_loss = 100 * (adjustedDamage * bravery/10) / modifier`, `bravery = (110-용기)/10`. 사망 시 적 처치 +20×modifier/100, 아군 오사 -2000/modifier, 아군 사망 -(계급계수×200×bravery)/100. 지휘관 계급 보정은 낙차 스위치로 누적(사령관 150, 대령 125, 대위 115, 중사 110). 패닉 판정 `chance = 100 - 2*morale`, 발생 유형은 33% 이하 광폭. 패닉 처리 후 +15 회복 — 연쇄 패닉 방지.
- 인용(리드 직접 대조 PASS): `int chance = 100 - (2 * getMorale());` — src/Savegame/BattleUnit.cpp (2026-09-17)
- 인용: `const int morale_loss = 100 * (adjustedDamage * bravery / 10) / modifier;` — src/Battlescape/TileEngine.cpp (2026-09-17)
- **잔선**: 라벨렌 사기 게이지와 결합할 수치 골격. 지휘관 생존이 사기 보정을 들고 있는 구조가 진형 리더 지휘 반경과 직결.

### 1.4 반응 사격 = 잔여 AP 비율 이니셔티브 큐 [REF:OS-OXC-REACTION]

반응 점수 = `반응스탯 × (잔여TU/최대TU)`. 행동 후 시야 내 적 각각의 반응 점수와 비교해 이긴 유닛이 snap TU를 써서 끼어든다. 이니셔티브 = 스킬×잔여비율이라는 공식 자체가 실시간 인터럽트 설계로 옮겨진다.
- 인용: `(Reactions Stat) x (Current Time Units / Max TUs)` — src/Savegame/BattleUnit.cpp (2026-09-17)

### 1.5 시야: 야간 반경과 절대 상한 분리 [REF:OS-OXC-LOS]

`MAX_VIEW_DISTANCE = 20` 타일 절대 상한, 야간(밝기>9)은 9타일, 연기는 광학 거리로 환산(`smoke/3`씩 가산, 상한 320 복셀).
- 인용: `aliens can see in the dark, xcom can see at a distance of 9 or less, further if there's enough light.` — src/Battlescape/TileEngine.cpp (2026-09-17)
- **잔선**: 지하철 전장의 조명 구간/연기 규칙에 그대로 대응.

### 1.6 연구·자금: 숨은 비용 변동과 만족도 예산 [REF:OS-OXC-STRATEGY]

연구는 DAG + 비용 0 OR 게이트 + 아이템 조건. 배정 시 실제 비용은 `cost * RNG(50,150)/100`로 굴러간다(탐색 시간 불확실성). 월말 자금은 국가별 만족도: `good = 아군활동/10 + 지역활동`, `bad = 외계활동/20 + 지역외계활동`, 인상 시 현 자금의 5~20%. 2개월 연속 저점 또는 파산이 패배 조건.
- 인용: `new ResearchProject(rule, int(rule->getCost() * OpenXcom::RNG::generate(50, 150)/100))` — src/Basescape/ResearchInfoState.cpp (2026-09-17)
- **잔선**: 16개 파벌 "이사회" 예산을 역별 활동 점수로 산정하는 원형. RNG가 전역 단일 xorshift인 점은 잔선 시드 스트림 계약의 반면교사.

UNVERIFIED(원본 UFO:EU 위키 수치): 신병 사격 40~70, 상한 120.

## 2. OpenPanzer — 결정론적 교전 확률표와 코어 로스터 (턴제, 선택지 병기)

소스: github.com/nicupavel/openpanzer (master). 육각 IGOUGO, 교전에는 RNG가 없다(getCombatKills 무작위성 0).

### 2.1 kF 곡선: 확률표를 선형식으로 압축 [REF:OS-OP-COMBAT]

공격·방어 값은 병과/지형/참호/경험/거리/기습의 정수 보정 합산. 살상 `kF = atkval - defval; if kF>4: kF = 4 + (2kF-8)/5; kF += 6; (포병|폭격기|요새|해상대지상이면 -3); clamp(1,19); kills = round((5*kF*strength + 50)/100)`.
- 인용(리드 직접 대조 PASS): `if (kF > 4) kF = 4 + (2 * kF - 8) / 5; //PG2 formula` — js/gamerules.js (2026-09-17)
- **잔선**: 시드 결정론 + 미리보기 가능한 전투(역 공성 예측)에 필요한 형태. 실시간 판정에도 확률 없는 kF식 병행 선택지.

### 2.2 참호: 지형 기저 스냅 + 느린 추가 적층 [REF:OS-OP-ENTRENCH]

턴 종료 시 참호가 지형 기저 미만이면 스냅, 이상이면 틱 적층(`next = 9*level + 4`; 틱 = 경험/100 + (지형+1)*병과비율). 상한 지형+5. 이동 시 0, 피격 시 -1. 보병 대 보병 도심지에서 참호가 이중 계산된다.
- 인용: `this.entrenchment = 0; //loses all entrenchment` — js/unit.js (2026-09-17)
- 인용: `//How fast a unit class entrench` — js/prototypes.js (2026-09-17)
- **잔선**: 역 거점 방어 태세(정지 시간 → 방어 보정)의 원형. 지하철 역 구조물이 지형 기저 역할.

### 2.3 프레스티지·코어 로스터 이월 [REF:OS-OP-CAMPAIGN]

단일 지갑(구매×12, 업그레이드×1.25, 보충 cost/10). 깃발 +20, 목표 +50. 캠페인은 배치 칸의 부대를 코어로 표시, 시나리오 간 경험 유지·HP/탄약/참호 리셋. 파괴된 코어는 목록에서 제거.
- 인용: `Reset player properties from previous scenario and resets/reinforce/resupply it's core unit status` — js/map.js (2026-09-17)
- **잔선**: 유지 필드의 정반대 선택(잔선은 부상 유지). 무엇을 이월하고 무엇을 리셋할지 명시 목록으로 관리하는 계약이 참고점.

UNVERIFIED: 기상 TODO(원본 미구현), AI 이동 로직 공란(updateObjectives 빈 함수).

## 3. Battle for Wesnoth — 다단계 피해 파이프라인과 로스터 경제 (턴제, 선택지 병기)

소스: github.com/wesnoth/wesnoth (master).

### 3.1 피해 = 기본 × (100+가산) × 저항, 기저로 반올림 [REF:OS-BFW-DAMAGE]

파이프라인: 기본 피해(무기 특수) → 가산 승수 시작 100에 시간대·지휘 가산 → 방어자 저항 승수(기본 100=무변화) → `round_damage(base, multiplier, 10000)` 반올림은 "기저 쪽으로, 0이 되지 않게". 명중률은 `100 - 지형 방어%`에서 특수 보정 후 클램프. 타격 판정 `get_random_int(0,99) < CTH`.
- 인용: `round (base_damage * bonus / divisor) to the closest integer, but up or down towards base_damage` — src/utils/math.hpp (2026-09-17)
- 인용: `return cfg_[damage_type].to_int(100);` (저항 기본 100) — src/movetype.cpp (2026-09-17)
- **잔선**: '지형 방어% = 회피'와 '저항% = 감소'의 분리가 잔선 하이트맵 규칙(회피/감소 이원)과 같은 구조. 특수 효과를 SET/ADD/MUL/DIV 컴포지터로 통합하는 데이터 모델도 그대로.

### 3.2 시간대 정렬 ±25와 지역 조명 [REF:OS-BFW-TOD]

기본 스케줄 6단계: 아침/오후 +25, 초·후반 야간 -25, 실내 0, 지하 -25, 심층 지하 -30. 정렬 매핑: 질서=+bonus, 혼돈=-bonus, 중립=0, 경계(liminal)=max_liminal-|bonus|. 조명(Illuminates)은 육각 단위로 시간대를 국소 재작성한다.
- 인용(리드 직접 대조 PASS): `lawful_bonus=25` — data/core/macros/schedules.cfg (2026-09-17)
- 인용: `bonus = max_liminal_bonus-std::abs(lawful_bonus);` — src/actions/attack.cpp (2026-09-17)
- **잔선**: 지하철 노선별·구간별 조명/치안 상태를 전투 보정의 국소 스케줄로.

### 3.3 XP 8×레벨, AMLA, 충성=유지비 면제 [REF:OS-BFW-PROGRESSION]

격파 `kill_xp = 8×피해자레벨`(레벨0은 4), 교전 참여 1×적 레벨. AMLA 기본 +3 최대HP/+20% 경험치 요구치/완전 회복, 최대 100회. 충성은 사기 플래그이기보다 `upkeep = 0` — 유지비는 레벨세(레벨당 1)이며 마을 지원 1로 상계.
- 인용: `return level ? kill_experience * level : kill_experience / 2;` — src/game_config.hpp (2026-09-17)
- 인용: `Loyal units cost no upkeep.` — src/units/unit.hpp (2026-09-17)
- **잔선**: '충성'을 관계 수치가 아니라 경제 면제로 구현하는 관점. 캐스트 관계·가치관과 별개 축으로 유지.

### 3.4 리콜 로스터와 캠페인 이월 [REF:OS-BFW-RECALL]

시나리오 간 부대 WML에서 좌표/소속만 제거해 로스터 보관. 리콜 비용 20골드(레벨 무관). 골드 이월 80%(`gold_carryover_percentage = 80`). 시나리오 시작 시 전원 완전 회복 — 잔선의 지속 부상 계약과 반대되는 지점, 명시적 비채택.
- 인용: `u_back.remove_attributes("side", "goto_x", "goto_y", "x", "y", "hidden");` — src/carryover.cpp (2026-09-17)
- 인용: `const int gold_carryover_percentage = 80;` — src/game_config.cpp (2026-09-17)

### 3.5 인접 지휘: 25%×계급차 [REF:OS-BFW-LEADERSHIP]

인접 같은 편 하위 레벨 유닛에 `25 × (지도자레벨 - 대상레벨)`을 피해 승수에 가산. 잔선 진형 리더 지휘 반경의 턴제 원형.
- 인용: `value="(25 * (level - other.level))"` — data/core/macros/abilities.cfg (2026-09-17)

## 4. Ancient Beast — 타입 피해 벡터와 어빌리티 데이터 (턴제 큐, 선택지 병기)

소스: github.com/FreezingMoon/AncientBeast (master).

### 4.1 피해는 타입 벡터다 [REF:OS-AB-DAMAGE]

`result[key] = round(value × (1 + (atk.offense - trg.defense/area + (atk[key]-trg[key]))/100))`, 합계 하한 1. `pure`는 공식 우회. `area`(대형 유닛 피격 면 수)가 방어 항을 나눈다 — 큰 유닛일수록 유효 방어 감소. 피해는 HP와 별도로 `endurance`(피로)를 깎는다.
- 인용: `value * (1 + (atk.offense - trg.defense / this.area + (atk[key] - trg[key])) / 100)` — src/damage.ts (2026-09-17)
- **잔선**: 인물 카드의 피해가 단일 수치가 아니라 `{타입: 값}` 맵+면적+효과 목록인 데이터 형태. 피로(endurance) 0에서 재생 차단은 지속 소모전 규칙으로.

### 4.2 상태효과 = 트리거 문자열 + alterations 패치 [REF:OS-AB-EFFECTS]

Effect 객체 `{trigger, alterations, turnLifetime, deleteTrigger, stackable}`. 스탯 재계산은 baseStats 복제 후 효과·드롭 적용(숫자 가산, 문자열은 사칙연산 eval, 불리언 덮어씀).
- 인용: `this.stats = { ...this.baseStats };` — src/creature.ts (2026-09-17)
- **잔선**: 카드 부여 효과(거점 카드·인물 카드)의 직렬화 가능한 표현. 트리거 문자열 onQuery/onDamage/onStartOfRound는 실시간 이벤트로 치환.

### 4.3 이니셔티브 큐: `init*500 - id` [REF:OS-AB-QUEUE]

행동 순서 `stats.initiative * 500 - id` 내림차순. 동점을 RNG가 아니라 안정 id로 깬다. 지연(delay)은 같은 라운드 후반 재배치.
- 인용: `return this.stats.initiative * 500 - this.id;` — src/creature.ts (2026-09-17)
- **잔선**: 실시간 틱에서도 우선순위 타이브레이커를 시드 소모 없이 안정 id로.

### 4.4 소환 경제와 영구 드롭 [REF:OS-AB-ECONOMY]

소환 비용 `size + level`(플라즈마, 플레이어 자원). 유닛 사망 시 `drop {name, 스탯 패치}`를 바닥에 남긴다 — 스택 가능, 만료 없음, 제거 불가. 어빌리티는 N회 사용 후 업그레이드(사용 카운트 or 라운드 카운트 이중 시계).
- 인용: `cost: crea.size - 0 + ((crea.level as number) - 0)` — src/abilities/Dark-Priest.ts (2026-09-17)
- 인용: `Drops currently do NOT expire.` — src/drop.ts (2026-09-17)
- **잔선**: 카드 N회 시전 후 성장(카드 ID 불변)과 전장 드롭이 인물 시트를 영구 패치하는 두 축.

## 5. Cataclysm: DDA — 규모 분리와 관계·필요도 시계 (턴제 세계)

소스: github.com/CleverRaven/Cataclysm-DDA (master). 1턴=1초.

### 5.1 3층 좌표: 타일/서브맵/오버맵 [REF:OS-CDDA-GRAPH]

타일 1, 서브맵 12×12, 오버맵 지형(OMT) 24×24, 오버맵 180×180 OMT, z 21층. 지하철·도로·하수는 `overmap_connection` 객체 — `{terrain, locations, basic_cost, flags}` 목록으로 경로 탐색이 저비용 변을 선호한다(도로 0, 숲 20, 습지 40, 물/교량 120).
- 인용: `{ "terrain": "subway", "locations": [ "subterranean_subway" ], "flags": [ "ORTHOGONAL" ] }` — data/json/overmap/overmap_connections.json (2026-09-17)
- **잔선**: 334역 그래프의 터널 변에 상태별 비용(침수/붕괴/점거)을 붙이는 원형. 역 내부(24×24 스케일)는 진입 시점에 생성하는 지연 생성 계약.

### 5.2 리얼리티 버블 + 시간 버킷 캐치업 [REF:OS-CDDA-BUBBLE]

전체 타일 AI는 132×132 버블 안에서만. 밖 NPC는 `min(경과, 2일)` 상한으로 30분→5분→1턴 버킷 캐치업. 오버맵 이동은 5분 주기. 무리(horde)는 `{pos,dest,moves,tracking}` 경량체로 오버맵에서 이동, 버블 진입 시 완전체로 승격.
- 인용: `const time_duration dt = std::min( calendar::turn - last_updated, 2_days );` — src/npc.cpp (2026-09-17)
- 인용: `attacked sectors are frozen in time; don't update those` — (Mindustry와 같은 원칙의 CDDA 판, src/npcmove.cpp 주변) (2026-09-17)
- **잔선**: 켄시식 bubble+오프스크린 설계의 두 번째 실증(사유 문서의 RPS 인터뷰 근거와 상호 보강). 전투 중인 역은 동결, 나머지는 캠페인 시계로.

### 5.3 관계는 정수 6축 + 성격 ±10 + 파벌 플래그 [REF:OS-CDDA-OPINION]

`npc_opinion {trust, fear, value, anger, owed, sold}`. 성격 `aggression/bravery/collector/altruism` 전부 int8 [-10,10]. 적대 임계 `anger >= 20 + fear - aggression`. 첫 대면 태도는 이 정수들의 소형 결정트리(대화/살해/도주). 대화 시험(PERSUADE/LIE/INTIMIDATE)은 난이도 백분율 + 스탯 계수, 성패가 opinion 델타를 직접 이동. 파벌 `likes_u < -10`이면 구성원 적대 — 임계 트리거. 동맹 신뢰는 매시간 `x_in_y(5-trust, 240 + 10*벌점 + 상태벌점)` 확률로 +1(허기/갈증/부상이 벌점).
- 인용(리드 직접 대조 PASS): `return 20 + op_of_u.fear - personality.aggression;` — src/npc.cpp (2026-09-17)
- 인용: `if( x_in_y( trust_chance, 240 + 10 * op_penalty + state_penalty ) )` — src/npc.cpp (2026-09-17)
- **잔선**: 가치관 10칸·관계 등급 설계의 정수 구현 원형. '의뢰 완료 +10/+10/+10'처럼 이벤트가 큰 폭으로 움직이는 이산 설계가 C/B/A 등급 카드와 호환.

### 5.4 필요도 5분 틱과 칼로리 병행장부 [REF:OS-CDDA-NEEDS]

주관 허기(표시/AI)와 저장 칼로리(기아·체중)를 분리. 5분 틱마다 `rate × n` 일괄 적용, 물은 250ml/5분 흡수. 수면 부채는 '깨어있는 분' 누적. 활동 배율 수면 0.85 ~ 격렬 10.
- 인용: `const int five_mins = ticks_between( from, to, 5_minutes );` — src/character_body.cpp (2026-09-17)
- 인용: `rates.water = 250_ml; // Water is special, passes very quickly` — src/stomach.cpp (2026-09-17)
- **잔선**: 원정 소모(식량+수당+회복 3중 압박)를 초 단위 시뮬레이션이 아니라 틱 횟수 곱으로 정산하는 계약. UNVERIFIED: 기본 needs_rates 수치 본문(함수 분리로 이번 패스 미회수).

### 5.5 레시피 AND/OR 문법과 무인 공정 [REF:OS-CDDA-RECIPES]

구성요소는 외곽 AND·내부 OR의 중첩 배열. 단계(steps)가 있으면 루트에 시간·도구를 두지 않고 단계별로 검사·소모. `attention: "unattended"` 단계는 벽시계 시간 — 파티가 지도층에 있는 동안 공정이 진행된다.
- 인용: `"A step marked \"attention\": \"unattended\" is wall-clock time"` — doc/JSON/ITEM_CRAFT_AND_DISASSEMBLY.md (2026-09-17)
- **잔선**: 역 워크샵(발효·용해·수리)의 원정 병행 생산 모델.

### 5.6 가격: 파벌 오버레이 + 개인 부채 장부 [REF:OS-CDDA-ECONOMY]

아이템은 `price_postapoc`(센트)를 기본으로 파벌 `price_rules {markup, premium, fixed_adj}`가 덮는다. 흥정은 사교 스킬의 이차 곡선(±유계). `owed`는 NPC별 부채 정수 — 전역 화폐 없이 거래 완결. 상점 재입고 6일 주기, `wealth`가 상한.
- 인용: `price *= 1 + 0.25 * adjust;` — src/npctrade.cpp (2026-09-17)
- 인용: `Faction shopkeeps will trade faction current at 100% value` — doc/JSON/FACTIONS.md (2026-09-17)
- **잔선**: 역 시장의 배급·현물 경제. 캐스트 간 은혜(owed) 장부가 즉시 호환.

## 6. Unciv — 도시·기술·턴 파이프라인·상태해시 RNG (턴제 4X, 전략층 참고)

소스: github.com/yairm210/Unciv (master, Kotlin).

### 6.1 도시 성장 공식과 기아 [REF:OS-UNCIV-GROWTH]

`foodRequired = 15 + 8*(pop-1) + floor((pop-1)^1.5)` × 속도/도시국가/난이도 계수. 저장 식량 음수 && 인구>1이면 -1 인구·저장 0. 초과분 이월은 상한 95%. 식량 소모는 인구당 2.
- 인용(리드 직접 대조 PASS): `var foodRequired = 15 + 8 * (population - 1) + floor((population - 1).toDouble().pow(1.5))` — core/src/com/unciv/logic/city/managers/CityPopulationManager.kt (2026-09-17)
- **잔선**: 역 인구·시설 성장 곡선의 기본형. 334역 전체에 도시 불행(-3/도시)을 그대로 두면 붕괴하므로 계수 재설계 필요(비채택 사유 기록).

### 6.2 수익 스탯 트리 + 퍼센트 트리 [REF:OS-UNCIV-STATS]

CityStats는 저장하지 않고 매턴 재계산(@Transient). 원천별 스탯 트리 → 퍼센트 트리 → 생산 먼저 % → 전환(기본 1/4) → 골드/문화/식량 % → 과학 % → 유지비 차감. 저항 상태는 목록 clear. 도시 생산 하한 1.
- 인용: `stats.gold = capitalForTradeRoutePurposes.population.population * 0.15f + city.population.population * 1.1f - 1` — core/src/com/unciv/logic/city/CityStats.kt (2026-09-17)
- **잔선**: 역 수익의 원천별 분해 표시(CK3 중첩 툴팁 원칙과 같은 방향)의 구현 골격.

### 6.3 기술 비용: 지도 크기·도시 수·따라잡기 [REF:OS-UNCIV-TECH]

`cost × 지도배율 × (1 + (도시수-1)×도시당계수) / 따라잡기계수`, 따라잡기 = `1 + (알고있는주요국가/생존국가) × 0.3`. 오버플로우 상한 존재. 8턴 과학 링버퍼(위인=합산).
- 인용: `return 1 + numberOfCivsResearchedThisTech / numberOfCivsRemaining.toFloat() * 0.3f` — core/src/com/unciv/logic/civilization/managers/TechManager.kt (2026-09-17)
- **잔선**: 파벌 기술/재건 루프에서 '선두 따라잡기' 완충의 구현례.

### 6.4 순차 턴 파이프라인과 커밋 게이트 [REF:OS-UNCIV-TURN]

`GameInfo.nextTurn`: 인간 종료 → AI 연쇄(자동턴) → 인간 시작. startTurn 순서는 비싼 것부터(기술→자원→통계→GP 스폰→종교→시야→도시→유닛). '다음 턴' 버튼은 미결정 선택지(연구/건설/대기 유닛)가 있으면 게이트로 막힌다.
- 인용: `We rotate Players in cycle: 1,2...N,1,2...` — core/src/com/unciv/logic/GameInfo.kt (2026-09-17)
- **잔선**: 지도 턴 4X 층의 턴 순서·원자성 참고. 멀티플레이는 동시 턴이 아니라 세이브 파일 순차 교환(락스텝 아님).

### 6.5 고정소수점 A*와 ZoC [REF:OS-UNCIV-PATH]

이동 1.0 = 내부 30 단위. 도로 1/3, 철도 0.1(휴리스틱 상한과 일치), 통제구역(ZoC) 통과는 잔여 MP 전부 소모(세티널 100). 경로는 유닛 이동 등급+시작 타일 키로 캐시.
- 인용: `1.0f movement = 30 internal units` — core/src/com/unciv/logic/map/pathingmap/FixedPointMovement.kt (2026-09-17)
- **잔선**: 334역 그래프에서도 '분쟁역 통과=맵턴 전부' 같은 세티널 비용과 정수 연산 inner loop.

### 6.6 세이브 최소주의·복제·상태해시 RNG [REF:OS-UNCIV-SAVE]

세이브는 이름 참조만 저장, 링크는 setTransients()로 재구성. 매턴 GameInfo 복제로 자동저장/렌더 격리. 확률 판정은 전역 가변 RNG가 아니라 `stateBasedRandom(caller, seed)` — (caller, turn, 엔티티 id) 해시로 주사위를 다시 굴릴 수 없게 한다.
- 인용: `fun stateBasedRandom(caller: String, seed: Int=31) = Random(hashOf(caller.hashCode(), seed, this.hashCode()))` — core/src/com/unciv/models/ruleset/unique/GameContext.kt (2026-09-17)
- 인용: `We save names instead of pointers, and anything that can be recalculated is simply not saved.` — docs/Developers/Saved-games-and-transients.md (2026-09-17)
- **잔선**: 잔선 시드 스트림 계약(PurposeRng)과 가장 가까운 실구현. 리로드 세이브스컴 방지가 목적이 같다.

## 7. Freeciv — 페이즈 모드·슬라이더 경제·핸디캡 (턴제 4X, 선택지 병기)

소스: github.com/freeciv/freeciv (main, C).

### 7.1 턴과 페이즈의 분리 [REF:OS-FCV-PHASES]

서버 루프: begin_turn → 페이즈 반복(begin_phase → 입력 → end_phase) → end_turn. `phase_mode`가 동시(PMT_CONCURRENT, num_phases=1, 매턴 순서 셔플)/교대(플레이어 수만큼 페이즈)/팀 교대를 결정. 페이즈와 모드는 세이브에 정수로 저장되어 로드 시 start-of-turn 부작용이 재실행되지 않는다.
- 인용(리드 직접 대조 PASS): `* PMT_CONCURRENT games.) */` — server/srv_main.c (2026-09-17)
- **잔선**: 전략층이 '동시 결정'이 될지 '순차'가 될지의 정식 분리. 둘을 섞지 않는 원칙.

### 7.2 교역 3분할 슬라이더 [REF:OS-FCV-ECONOMY]

도시 산출 trade를 과학/사치/세금 백분율(합 100)로 정수 분배. 무정부 상태는 과학 0·사치 100 하드 오버라이드. 과학은 도시 비축이 아니라 국가 풀로 귀속.
- 인용: `rates[TAX] = 100 - rates[SCIENCE] - rates[LUXURY];` — common/city.c (2026-09-17)
- **잔선**: 역 잉여를 '병참/연구/충성' 3분할로 보내는 단일 파이프 모델.

### 7.3 AI 난이도는 데이터다 [REF:OS-FCV-AI]

핸디캡 비트벡터 + fuzzy(0-1000 확률로 불리언 뒤집기) + science_cost 배율 + expand 평가. 최고 난이도도 정부 세율 제한(H_RATES)은 유지 — 정보/행동 차단이 은닉 버프보다 우선.
- 인용: `a science development cost of 200 means that the AI develops science at half the speed` — ai/difficulty.c (2026-09-17)
- **잔선**: 파벌 AI 강약을 스택이 아니라 제약 집합으로 조절하는 원칙.

UNVERIFIED: `distribute()` 잔여 배분 알고리즘 세부(호출 계약만 인용).

## 8. VCMI — 영웅·마을·캠페인 이월 (턴제, 선택지 병기)

소스: github.com/vcmi/vcmi (develop).

### 8.1 XP 표와 저/고급 레벨 분기 [REF:OS-VCMI-HERO]

XP 테이블 하드코딩 후 34140부터 `nextDiff = prevDiff + prevDiff/5`. 레벨업은 레벨<10 저급/≥10 고급 클래스 가중치 표(HCTRAITS.TXT 로드 — UNVERIFIED 수치). 습득 스킬 8개, 군단 7슬롯, 병참(Logistics) +10/20/30%.
- 인용: `expPerLevel.push_back(0);` … `then nextDiff = prevDiff + prevDiff / 5;` — lib/entities/hero/CHeroHandler.cpp (2026-09-17)
- 인용: `const bool isLowLevelHero = hero->level < GameConstants::HERO_HIGH_LEVEL;` — lib/callback/GameRandomizer.cpp (2026-09-17)

### 8.2 스택={타입,수}와 전력 스칼라 [REF:OS-VCMI-ARMY]

지도층 군단은 `map<SlotID, CStackInstance>`(최대 7), 전투층 CStack이 별도. 지도 전력은 `AIValue × 수`의 합, 영웅 강도 `sqrt((1+0.05*ATK)*(1+0.05*DEF))` — 외교/합류 판정용 단일 스칼라.
- 인용: `return static_cast<ui64>(getType()->getAIValue()) * getCount();` — lib/mapObjects/army/CStackInstance.cpp (2026-09-17)
- **잔선**: 진형 편집·포획·영입 판정에 '표시용 전력 스칼라'를 따로 두는 설계.

### 8.3 지형·도로 이동 비용과 일일 예산 [REF:OS-VCMI-MOVE]

육상 MP는 최저속 부대 테이블(1300…2000), 해상 1500. 지형 원가(습지 175, 사막/설원 150...)에서 탐색 스킬 할인(25/50/75), 하한 기저 100. 도로 75/65/50 — 경로는 양 타일 도로일 때만 도로 원가. 대각선 √2.
- 인용(리드 직접 대조 PASS): `"movementPointsLand" : [ 1300, 1360, 1430, 1500, 1560, 1630, 1700, 1760, 1830, 1900, 1960,` — config/gameConfig.json (2026-09-17)
- **잔선**: 역간 이동의 일일 예산(최저속 성원 기준)과 구간 상태 할인 구조.

### 8.4 마을: 하루 1건 + 주간 성장 합산기 [REF:OS-VCMI-TOWN]

건설 상한 하루 1. 요구조건은 LogicalExpression(allOf). 주간 성장 = ceil(base + 성+base or 요새+base/2 + 타율보너스 + ...)·손보정. 방랑 몬스터 주간 10%(상한 4000), 역병/특별 주는 월 플래그.
- 인용: `if (hasBuilt(BuildingID::CASTLE))` … `castleBonus = base;` — lib/mapObjects/CGTownInstance.cpp (2026-09-17)
- **잔선**: 역 시설 건설·거주민 성장의 배치 모델(주간 사이클).

### 8.5 캠페인 이월 keep-flags + 허용 목록 [REF:OS-VCMI-CARRYOVER]

시나리오별 `CampaignTravel{experience, primarySkills, secondarySkills, spells, artifacts 불리언 + monstersKeptByHero 세트}`. 유지 축이 거짓이면 그 축을 초기화. 영웅은 JSON 풀로 직렬화.
- 인용: `bool experience; bool primarySkills; bool secondarySkills; bool spells; bool artifacts;` — lib/campaign/CampaignState.h (2026-09-17)
- **잔선**: 캐스트 이월 계약의 원형 — 부상·관계·가치관 각 축의 유지/초기화를 플래그 목록으로 선언.

### 8.6 FoW 팀 공유 + 직렬화 RNG [REF:OS-VCMI-FOW]

FoW는 팀 단위 uint8 맵, 시야 기본 5(영웅/마을)+정찰 1/2/3, 반올림 유클리드. RNG는 `std::minstd_rand` 상태를 문자열로 저장, 영웅별 스킬 스트림.
- 인용: `MapTilesStorage<uint8_t> fogOfWarMap; //true - visible, false - hidden` — lib/CPlayerState.h (2026-09-17)
- **잔선**: 파벌/가문 단위 안개와 스트림 id 직렬화.

## 9. fheroes2 — 같은 축의 인-리포 수치 (턴제, 선택지 병기)

소스: github.com/ihhub/fheroes2 (master). VCMI가 원본 데이터 파일에 의존하는 반면 수치가 저장소 안에 있다.

- 군단 5슬롯. 유닛 전력 `(1 + 0.1*attack + 0.05*defense) × baseStrength × count`, 사기 `1+morale/24`(음수면 /12), 궁술 `×sqrt(1+archery/100)`. — src/fheroes2/army/army.cpp, monster/monster.cpp (2026-09-17)
- XP L4 = 4500(리드 직접 대조 PASS: `return 4500;` — src/fheroes2/heroes/heroes.cpp). 39레벨 이후 증분 ×1.2/100 반올림.
- 지형 벌점×탐색 스킬 매트릭스(사막 200→100, 습지 175→100, 설원 150→100, 도로 75 고정). — src/fheroes2/maps/ground.cpp (2026-09-17)
- 지혈: 총 레벨이 3의 배수면 위즈덤 강제 — 세부 스킬이 고르게 분포하는 보정. — src/fheroes2/heroes/skill.cpp (2026-09-17)
- 시야: 영웅 4+정찰, 성 5, 감시탑 19. 제곱 유클리드 + 원본 근사 치트(7→66, 8→90). — src/fheroes2/maps/maps.cpp (2026-09-17)
- RNG: PCG32(기본 시드 42/스트림 54). 레벨업은 라이브 굴림이 아니라 영웅에 저장된 4개 시드 큐. — src/engine/rand.h (2026-09-17)
- 캠페인 이월은 `vector<Troop>` 최소 스냅샷(가장 먼저 고용된 생존 영웅의 군단). — src/fheroes2/campaign/campaign_savedata.h (2026-09-17)
- 주간 성장: 우물 +2 전 계층, 우물2 +8(1계층), 중립 도시 절반, 역병 절감. — src/fheroes2/castle/castle.cpp (2026-09-17)
- **잔선**: 시드를 PRNG 상태가 아니라 '결정 키'로 영웅 인스턴스에 저장하는 패턴 — 재현 안정 레벨업.

UNVERIFIED: monsterBaseStrength 표 값(원본 데이터 로드).

## 10. OpenNefia — 호감 정수·관계 이산·상점 랭크 (턴제, 캐스트 축)

소스: github.com/OpenNefia/OpenNefia (develop, C#/.NET 8). Elona 재구현.

### 10.1 호감(Impression)은 명명 임계값을 가진 정수다 [REF:OS-ONEFIA-IMPRESSION]

임계값: Enemy 0, Foe 10, Hate 25, Normal 50, Party 53, Amiable 75, Friend 100, Fellow 150, Marry 200, Soulmate 300. 표시 등급 0-8은 원시 점수→밴드 매핑 함수. 획득은 수확 체감 `delta = delta*100/(50 + level³)`(음수 델타는 원시 적용). 대화는 Interest(기본 100)를 소모하고 8시간 후 갱신 — 하루 대화 파밍 차단.
- 인용: `public const int Marry = 200;` — OpenNefia.Content/Dialog/DialogComponent.cs (2026-09-17)
- 인용: `delta = delta * 100 / (50 + level * level * level);` — OpenNefia.Content/Dialog/DialogSystem.cs (2026-09-17)
- **잔선**: 관계 등급 C/B/A에 대한 또 하나의 실례 — 등급은 저장하지 않고 정수+순수 함수. 인연 5유형×등급과 병합할 때 참조.

### 10.2 적대는 Relation 이넘 + 개인 덮어쓰기 지도 [REF:OS-ONEFIA-RELATION]

`Relation {Enemy=-3, Hate=-2, Dislike=-1, Neutral=0, Ally=10}` + 파벌 기본 + `EntityUid→Relation` 희소 개인 지도. 해석 규칙: 아군+아군=아군, 적의 적=아군, 한쪽 증오+한쪽 적=적, 나머지 min(). 전투 AI는 관계가 아니라 별도 `aggro` 정수(발견 시 30, 아군 피해 시 5, 매턴 -1).
- 인용: `Enemy = -3, Hate = -2, Dislike = -1, Neutral = 0, Ally = 10` — OpenNefia.Content/Factions/FactionComponent.cs (2026-09-17)
- **잔선**: '관계(누구 편)'와 '어그로(지금 누구를 노리나)'의 이원 구조가 잔선 캐스트·전투 분리와 정확히 일치.

### 10.3 상점 랭크·재입고, 업(業) 보상 [REF:OS-ONEFIA-SHOP]

`itemCount = min(80, 20 + ShopRank/2)`, 아이템 레벨도 랭크에서 산출. 재입고는 틱 감쇠가 아니라 날짜 트리거(기본 24시간). 구매가 `value*100/(100+협상)` 하한 value/2. 업 투자 공식은 이 트리에 미구현(UNVERIFIED — 로케일만 존재).
- 인용: `return Math.Min(80, 20 + (CompOrNull<RoleShopkeeperComponent>(shopkeeper)?.ShopRank ?? 0) / 2);` — OpenNefia.Content/Shopkeeper/ShopkeeperSystem.cs (2026-09-17)
- **잔선**: 역 상점의 규모·재입고 모델. 투자 성장은 미구현이라 설계 여지로 남긴다.

### 10.4 카르마 -30 형사 임계 [REF:OS-ONEFIA-KARMA]

카르마는 NPC별 호감이 아니라 플레이어 전역 정수. -30 미만에서 치안 NPC가 즉시 적대(aggro 80). 상점 주 살해 -10.
- 인용: `public const int Bad = -30;` — OpenNefia.Content/Karma/KarmaComponent.cs (2026-09-17)
- **잔선**: 파벌 평판과 개인 관계의 층위 분리 사례.

### 10.5 결정론은 약하다 (반면교사) [REF:OS-ONEFIA-RNG]

RNG는 단일 `System.Random` + PushSeed/PopSeed 스택. `WorldState.RandomSeed = Next(800)+2`를 저장하지만 로드 시 되살리는 경로는 확인되지 않았다(UNVERIFIED). 세이브는 YAML 명명 필드로 충실하나 RNG 위상은 계약 밖.
- 인용: `public void PushSeed(int seed) { _stack.Push(_random); _random = new System.Random(seed); }` — OpenNefia.Core/Random/SysRandom.cs (2026-09-17)
- **잔선**: 잔선 시드 스트림 계약이 요구하는 것의 부재 예시로 기록.

## 11. Brogue CE — 시드 결정론의 실구현 (턴제, Determinism 축)

소스: github.com/tmewett/BrogueCE (master).

### 11.1 두 스트림, 같은 알고리즘, 같은 시드 [REF:OS-BROGUE-RNG]

`RNG_SUBSTANTIVE`(게임플레이)와 `RNG_COSMETIC`(연출) 두 ranctx(Jenkins 32bit)를 같은 시드로 초기화. `assureCosmeticRNG/restoreRNG` 매크로로 연출 스코프를 엄격히 격리 — UI 깜빡임이 게임플레이 난수열을 밀지 않는다. rand_range는 기각표본추출로 편향 제거.
- 인용(리드 직접 대조 PASS): `raninit(&(RNGState[RNG_COSMETIC]), seed);` (L189, 바로 위 줄이 SUBSTANTIVE 동일 호출) — src/brogue/Math.c (2026-09-17)
- 인용: `enum RNGs { RNG_SUBSTANTIVE, RNG_COSMETIC, NUMBER_OF_RNGS, };` — src/brogue/Rogue.h (2026-09-17)
- **잔선**: PurposeRng 스트림 분리(combat/ai/cosmetic/mapgen)의 원형 + '연출은 반드시 cosmetic 스트림' 규율.

### 11.2 마스터 시드 → 층별 자식 시드 [REF:OS-BROGUE-SEEDTREE]

시작 시 각 깊이의 levelSeed를 마스터 스트림에서 뽑아 표로 저장. 층 생성 시 이전 시드 저장→levelSeed로 재초기화→생성→마스터 복원. 이전 층을 다시 만들어도 이후 층이 밀리지 않는다.
- 인용: `uint64_t seed; // the master seed for generating the entire dungeon` — src/brogue/Rogue.h playerCharacter (2026-09-17)
- **잔선**: 역(스테이션) 내부의 지연 생성에 그대로 적용 — 역 시드 표 + 생성 시 스트림 교체/복원.

### 11.3 기록 파일이 세이브다 [REF:OS-BROGUE-RECORDINGS]

녹화 헤더 36바이트(버전 15, 모드 1, 시드 8, 턴 4, 최고층 4, 길이 4). 세이브 로드는 녹화 재생으로 수행(fast-forward). 매 플레이어 턴 1바이트 RNG 체크섬을 뽑아 재생 중 불일치를 즉시 감지(`playbackPanic`).
- 인용: `compare a random number once per player turn so we instantly know if we are out of sync` — src/brogue/Recordings.c (2026-09-17)
- **잔선**: 잔선 세이브 계약의 대안 형태 — (a) 전체 월드 직렬화 or (b) 시드+명령 로그. 턴별 체크섬 불변식은 어느 쪽이든 채택 가치.

### 11.4 시드 카탈로그 = 회귀 오라클 [REF:OS-BROGUE-CATALOG]

`--print-seed-catalog`로 시드×깊이별 결과물을 덤프하고 checked-in 카탈로그와 diff하는 CI 테스트.
- 인용: `Seed catalog identical - test run successful` — test/compare_seed_catalog.py (2026-09-17)
- **잔선**: '시드 S의 역 D는 이 named 개체들을 낸다'를 Unity EditMode 회귀 픽스처로 굳히는 원형.

## 12. NetHack — conduct 카운터·CORE/DISP·본즈 (턴제, 캐릭터·결정론 축)

소스: github.com/NetHack/NetHack (NetHack-3.7).

### 12.1 conduct는 위반 횟수 카운터다 [REF:OS-NETHACK-CONDUCT]

`u_conduct`는 16개 long 카운터(채식 위반, 살생, 기도 사용, 무기 타격, 소원...). '지킴' = 카운터 0. 성취가 아니라 이력에서 재계산하지 않는 증가 전용 카운터.
- 인용: `These are voluntary challenges. Each field denotes the number of times a` — include/you.h (2026-09-17)
- **잔선**: 캐스트 행적('버린 동료 없음', '파괴한 역 없음')을 업적 토글이 아니라 이벤트 카운터로 누적 — 사후 정산·평판 산출의 근거 데이터.

### 12.2 RNG는 CORE/DISP 이원 (3.7 명칭) [REF:OS-NETHACK-RNG]

ISAAC-64 두 상태: `rn2`(CORE, 게임플레이)와 `rn2_on_display_rng`(DISP, 비게임플레이). 위키의 'major/minor' 표현과 달리 코드 이름은 CORE/DISP — 3번째 스트림을 상상하지 말 것. NetHack의 `RND(x) = isaac64 % x`는 편향이 있고 Brogue의 기각표본추출이 더 올바른 복사 대상.
- 인용: `used in cases where the answer doesn't affect gameplay and we don't` — src/rnd.c (2026-09-17)

### 12.3 본즈: 동일 코덱·1/3 확률·이름 위생 [REF:OS-NETHACK-BONES]

본즈는 일반 세이브와 같은 sfo/sfi 필드 직렬화기로 쓴다(NHF_BONESFILE=3). 발견은 `rn2(3)` — 자격 층의 1/3만. 생성 시 사망자 인벤토리 5할 저주, `sanitize_name`으로 플레이어 제공 문자열 위생(교환 대비).
- 인용: `if (rn2(3) /* only once in three times do we find bones */` — src/bones.c (2026-09-17)
- 인용: `while loading bones, strip out text possibly supplied by old player` — src/bones.c (2026-09-17)
- **잔선**: '전사자 잔재' 이벤트(역에 남는 몰락 지휘관 유물)의 구현 원형 — 두 번째 파일 포맷을 만들지 않는 원칙 포함.

## 13. Zero-K — 실시간 후퇴·진형·제압 (실시간, Battle 직결)

소스: github.com/ZeroK-RTS/Zero-K (master, Lua/Spring).

### 13.1 후퇴는 상태다: 임계 30/65/99% + 헤이븐 [REF:OS-ZK-RETREAT]

유닛별 후퇴 상태(비활성/0.3/0.65/0.99). `healthRatio < threshold`면 wantRetreat 설정, 헤이븐(RADIUS 160) 내 지터 지점으로 이동 후 대기, 완전 회복시 해제. 주기 `frame%20==10`. 다른 명령으로 즉시 중단.
- 인용(리드 직접 대조 PASS): `local thresholdMap = {` L41 + `0.65,` L43 — LuaRules/Gadgets/cmd_retreat.lua (2026-09-17)
- 인용: `local RADIUS = 160 --retreat zone radius` — 같은 파일 (2026-09-17)
- **잔선**: 사기·라벨렌 항복 3조건과 직접 조합 가능한 실시간 규칙 — '설정된 HP%에서 라인을 떠나 지정된 집결지로, 완치까지 대기'. 라이벌 항복 게이지의 개별 유닛 판.

### 13.2 진형 랭크 0-3 + 헝가리안 배정 [REF:OS-ZK-FORMATION]

드래그 경로를 폴리라인으로, 유닛 수만큼 보간 후 랭크(0=전열)별 수직 오프셋(rank_gap 기본 100)을 준다. 배정은 거리 비용 행렬의 헝가리안(상한 유닛 수 20~10, 시간 예산 0.05s), 초과 시 탐욕. 그룹 속도는 최저속 유닛.
- 인용: `Formation rank: units of lower rank line up in front of units of higher rank.` — LuaUI/Widgets/cmd_customformations2.lua (2026-09-17)
- **잔선**: 전열/후열/측면 편집(잔선 진형 계약)의 수치 골격 — 랭크는 유닛 상태, 라인은 작성된 폴리라인.

### 13.3 전술 AI 상수: 스킴/징크/도주 [REF:OS-ZK-TACTICALAI]

키팅: `weaponRange - leeway` 유지, 적 속도 30프레임 예측. 징크: 평행 200/접선 80 지그재그. 도주: `enemyRange + fleeDistance` 밖으로. 갱신 주기 20프레임, 유닛 인덱스로 분산.
- 인용: `function gadget:GameFrame(n) UpdateUnits(n, n%UPDATE_RATE + 1, UPDATE_RATE)` — LuaRules/Gadgets/unit_tactical_ai.lua (2026-09-17)
- **잔선**: 카드 부여 행동(킵 거리/스트레이프/이탈)의 구체 상수 출처.

### 13.4 명령(큐)과 상태(모드)의 분리 [REF:OS-ZK-CMDS]

이동/교전/순찰은 큐에 쌓이는 명령, 후퇴 임계·AI 온오프·발포 규율은 유닛 상태. 잔선 '진형 편집=상태, 전진/유지/후퇴=명령' 구분의 실구현 원형.
- 인용: `[SUC.RETREAT] = true,` — LuaRules/Configs/state_commands.lua (2026-09-17)

### 13.5 timeslow = 제압 [REF:OS-ZK-TIMESLOW]

피해 누적 `slowDamage/health` 비율로 속도·재장전 축소, 상한 50%. 0.5초 후 초당 현재치의 4% 감쇠. 사기 게이지 대신 '제압=둔화'의 수치 모델.
- 인용: `Max slow damage on a unit = MAX_SLOW_FACTOR * current health` — LuaRules/Gadgets/unit_timeslow.lua (2026-09-17)
- 참고: 헤이븐 지터에 시드 없는 math.random — 결정론 구멍(잔선은 시드 스트림 필수). UNVERIFIED: 사기/항복/지휘 반경 오라 부재(조사 범위 내 발견 안 됨).

## 14. Mindustry — 전략↔실시간 2층의 실구현 (실시간, Campaign/Battle 직결)

소스: github.com/Anuken/Mindustry (master, Java).

### 14.1 섹터 그래프 ↔ 배틀 인스턴스 [REF:OS-MIND-SECTORS]

행성은 섹터 그래프, 각 섹터는 자체 세이브+SectorInfo 스냅샷. 착륙은 인접 조건, 점령 중 배틀만 실시간으로 돌고 나머지 섹터는 동결. 캠페인 시계는 배틀 일시정지에 함께 멈춘다.
- 인용: `Only sectors adjacent to non-wave sectors can be landed on.` — core/src/mindustry/type/Sector.java (2026-09-17)
- 인용: `attacked sectors are frozen in time; don't update those` — core/src/mindustry/game/Universe.java (2026-09-17)
- **잔선**: S/W/B 3표면 연결의 가장 가까운 실구현 — 역 노드가 세이브를 소유, 전투는 세션, 전투 중 역 동결.

### 14.2 캠페인 턴 120초·침공 확률·수출 [REF:OS-MIND-CAMPAIGN]

캠페인 턴 = 7200틱(120s). 미플레이 기지는 `production.mean × dt`(60틱 창 이동평균)로 자원 축적, 상한 storage. 침공: 점령 20분 유예 후 `chance(1/100 × (0.8 + (인접적기지-1)×0.3))`. 수출은 목적 섹터로.
- 인용: `turnDuration = 2 * Time.toMinutes` — core/src/mindustry/Vars.java (2026-09-17)
- **잔선**: 역 생산이 캠페인 틱에서 창 이동평균으로 정산 — 병참 압박 루프의 실시간/전략 접합부. 침공 RNG가 시드 스트림 밖이라는 결점은 잔선에서 보완(반례 기록).

### 14.3 일시정지 = 시뮬 블록 스킵 [REF:OS-MIND-PAUSE]

`State {paused, playing, menu}`. playing이고 paused가 아니면 틱(엔티티 물리→유닛→전력→건물→탄). 델타 클램프(최대 4)로 정지 해제 순간 점프 방지. 렌더/입력은 유지.
- 인용: `state.set(state.isPaused() ? State.playing : State.paused);` — core/src/mindustry/core/Control.java (2026-09-17)
- **잔선**: 일시정지 가능 틱 시뮬의 루프 골격 그대로.

### 14.4 유닛 명령·그룹·편형 [REF:OS-MIND-UNITS]

명령 큐 상한 50. UnitGroup은 배경 스레드에서 편형 계산 — 중심 기준 오프셋 → 원 충전 밀도 0.7까지 압축 → 물리 밀어내기 → 목적지 레이캐스트(막히면 타일+4 후퇴). 각 유닛은 `dest + offset[i]`로 조향.
- 인용: `float maxSpaceUsage = 0.7f;` — core/src/mindustry/ai/UnitGroup.java (2026-09-17)
- **잔선**: 진형이 강체가 아니라 공유 오프셋 버퍼 — 잔선은 슬롯을 사전 작성하지만 '뒤열이 타일에 갇히지 않게 목적지 레이캐스트'는 채택.

### 14.5 유닛 상한 = 병참 [REF:OS-MIND-CAP]

상한 = 룰 기본 + 건물 보정 합. 초과 생성 불가, 초과분 사망 처리. 캠페인 적 팀은 무한.
- 인용: `return !type.useUnitCap || (team.data().countType(type) < getCap(team)` — core/src/mindustry/entities/Units.java (2026-09-17)
- **잔선**: 소환형 카드의 상한을 지휘관/역 단위 계약으로.

UNVERIFIED: 현재 master의 2×/4× 배속 슬라이더(정지+델타 클램프만 확인).

## 15. Warzone 2100 — 계급·지휘 반경·부품 연구 (실시간, Battle/Character)

소스: github.com/Warzone2100/warzone2100 (master, C++).

### 15.1 계급 임계 테이블과 레벨당 효과 [REF:OS-WZ-RANK]

경험치는 16.16 고정소수, `numKills = experience/65536`. 계급은 브레인별 임계 테이블(일반 0,4,8,...,512; 지휘 포탑 0,24,...,2048). 레벨당 피해 -6%/명중 +5%/속도 +5% — HP 증가가 아니라 판정 보정.
- 인용: `damage of a droid is reduced by this value per experience level, in %` — src/droid.h (2026-09-17)
- 인용: `unsigned int numKills = experience / 65536;` — src/droid.cpp (2026-09-17)
- **잔선**: 캐스트 성장이 최대HP 증가 대신 판정 보정으로 — 지속 부상(최대HP 감소)과 공존하는 베테랑 설계. 재활용 시 경험치가 다음 기체로 이전되는 큐도 참고.

### 15.2 후퇴 정책은 2차 명령 비트마스크 [REF:OS-WZ-ORDERS]

`secondaryOrder` 비트: REPLEV_LOW(25% 이하 후퇴)/HIGH(50%)/NEVER + 사격 규율 + 사거리 모드. 매 피해 후 `body*100 <= repairLevel*originalBody` 정수 판정으로 RTR(정비소 복귀)/RTB.
- 인용: `psDroid->body * 100 <= repairLevel * psDroid->originalBody` — src/order.cpp (2026-09-17)
- **잔선**: 캐럭터별 3단 후퇴 정책(각오/중상 후퇴/사생결단)을 인물 속성으로.

### 15.3 지휘 그룹 = 계급 스케일 반경 + 정원 [REF:OS-WZ-COMMANDER]

지휘관 정원 `level × maxDroidsMult + maxDroids`(예: 6+2×level). 반경은 계급별 배열 `cmdExpRange[level]`², 이탈 시 경험 공유·보정 소멸. 지휘관은 오라가 아니라 그룹 포인터를 든 유닛.
- 인용: `return getDroidLevel(psCommander) * psStats->upgrade[...].maxDroidsMult + psStats->upgrade[...].maxDroids;` — src/cmddroid.cpp (2026-09-17)
- **잔선**: 진형 리더 지휘 반경의 수치 골격 — 반경 표 by 랭크, 보너스는 `dist² ≤ r[rank]²` 내에서만.

### 15.4 연구는 부품을 해금하고 조립이 유닛이다 [REF:OS-WZ-DESIGN]

유닛은 `asParts[부품타입]`(차체/추진/센서/ECU/수리...) + 무기 슬롯의 템플릿. 연구 항목은 `componentResults`로 부품을 해금한다 — 유니크 유닛 타입이 아니라 부품의 조합.
- 인용: `This array is indexed by COMPONENT_TYPE so the ECM would be accessed using asParts[COMP_ECM].` — src/droiddef.h (2026-09-17)
- **잔선**: 카드/장비 연구-장착 모델 — 연구는 카드 ID(부품)를 풀고 장착은 슬롯 조합.

### 15.5 캠페인은 맵 스택 + 본거지 병행 [REF:OS-WZ-MISSIONS]

미션 타입(캠페인/확장/보류...) + `MISSION` 중첩 GameWorld + 타이머 모드(카운트다운/업/정지). 본거지 기지는 원정 중에도 시뮬레이션 지속.
- 인용: `storage structure for values that need to be kept between missions` — src/missiondef.h (2026-09-17)
- **잔선**: 역 전투 진입(MKEEP) 중 본거지 네트워크가 캠페인 속도로 계속 도는 구조.

UNVERIFIED: REPAIRLEV 정수 리터럴(주석상 25/50), formation.cpp 기본 명령 경로의 활성 여부.

---

## 도메인 종합 — 무엇을 어디에 쓸 것인가

| 잔선 도메인 | 최우선 참고 | 차선/비교 |
|---|---|---|
| Route (역 그래프 이동·병참) | CDDA overmap_connection 비용 · VCMI/fheroes2 일일 예산+지형 할인 | Unciv 고정소수점 A*+ZoC 세티넬 |
| Campaign (턴 루프·파벌) | Unciv 순차 파이프라인+커밋 게이트 · Freeciv 페이즈 모드 분리 · Mindustry 캠페인 턴+동결 | OpenXcom 월말 만족도 예산 |
| Battle (실시간 진형·카드) | Zero-K 후퇴 상태·진형 랭크·timeslow · Mindustry 정지 루프·오프셋 편형 · Warzone 지휘 반경·후퇴 정책 | OpenXcom 사기 전염·반응 이니셔티브, Wesnoth/AB 피해 공식(선택지 병기) |
| Settlement (역 운영·경제) | CDDA 가격 오버레이+부채 장부·레시피 무인 공정 · Unciv 스탯 트리 · VCMI 주간 성장 합산기 | OpenNefia ShopRank, Freeciv 슬라이더 |
| Character (캐스트·관계·행적) | CDDA opinion 6축+성격+트리거 · OpenNefia impression 임계값+Interest · NetHack conduct 카운터 | Wesnoth 충성=유지비 면제, Warzone 계급 보정 |
| Determinism (시드·세이브) | Brogue 이중 스트림·시드 트리·체크섬·카탈로그 CI · Unciv 상태해시 RNG·최소 세이브 · NetHack 동일 코덱 본즈 | fheroes2 영웅별 시드 큐 (반면교사: OpenXcom 단일 전역, OpenNefia 미회복) |

## 원본 보고 보존

8축 레인 보고 원문(전체 인용 포함)은 조사 세션 트랜스크립트와 `.omo/senpi-task/completion-results/`에 보존된다(2026-09-17 기준 st_01a0aee1·ee2·ee3·ee4·ee5·eeb·eec). 스캔 축은 리드가 osgameclones 원본 YAML에서 직접 수행했다.
