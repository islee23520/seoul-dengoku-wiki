# 레퍼런스 게임 조사 정본 (사유 연구문서)

- 위치 계약: 이 파일은 `.omo/research-private/` 아래 사유 연구문서다. 마스터 플랜(`.omo/plans/seoul-grand-strategy-srpg.md`)의 잠금 조항("Reference names remain only in private research documents excluded from generated/public material")에 따라 생성·공개 위키 소스 트리(`docs/game-logic/`) 밖에 유지된다. 공개 위키 빌드(`tools/wiki/build-wiki.mjs`)의 금지 공개 용어(`Kenshi`, `Underrail`, `Gunner`, `clone`, `복제`)는 이 문서에 등장해도 된다. 단, 그 어떤 문장도 공개 문서로 복사되어서는 안 된다.
- 상위 문서: `.omo/research-private/nippon-sangoku-canon-bridge.md` (일삼국 정사 다리 — 별도 운명).
- 이 문서가 대체한다: `.omo/ulw-research/20260902-204022/wave-1-reference-games.md` (913바이트 스케치, 자체 판정 "SUPPORTED WITH SOURCE GAPS"). 마스터 플랜 Todo가 해당 파일을 참조하는 곳은 이 문서를 가리키게 된다.
- 작성: 2026-09-07. 조사 채널: 공식 사이트/Steam 스토어 렌더 검증(Aside 브라우저)/위키/개발 블로그/보도. 접근일은 모두 2026-09-07 기준.

## 갭 정의 (왜 이 문서가 필요한가)

1. 마스터 플랜은 Todo 12(가문·직위 시스템), Todo 13(경제), Todo 15(이동), Todo 16(SRPG)의 근거로 레퍼런스 매트릭스(Kenshi/Stoneshard/CK3/태합입지전V DX)와 `wave-1-reference-games.md`를 명시 참조한다. 그러나 그 파일은 한 줄 역할 분리 스케치뿐이며 스스로 "SUPPORTED WITH SOURCE GAPS"라고 기록했다.
2. 사유 연구 영구 보관 위치 `.omo/research-private/`는 화이트리스트 의도(`.gitignore`)가 있었지만 2026-09-06 추가된 마지막 `.omo/` 무시 규칙이 이를 무효화해 추적 파일이 0개였다. (git check-ignore RED 포착 후 화이트리스트 복구로 해결 — 커밋 이력 참조.)
3. 공개 설계 문서는 금지 용어 게이트상 레퍼런스 이름을 쓸 수 없으므로, 설계 결정의 증거 기반은 이 사유 문서에만 존재해야 하고, 공개 문서는 이 문서의 결론(채택/거부)만 흡수한다.

## 판독 계층 (canon-bridge 규약 준용)

- `verified`: 출처 URL에서 직접 확인한 사실. 각 항목에 출처와 인용을 붙인다.
- `inference`: 레퍼런스 관찰을 서울 설정에 이식할 때의 설계 추론. 정사 아님.
- `original-fiction`: 서울 쪽 창작(16국, 인물, 가문 등) — 이 문서에서 다루지 않는다.

---

## Kenshi (켄시) — 역할: 실패의 지속성과 플레이어 부재 세계

### verified
- 개발·유통 Lo-Fi Games(영국 브리스털, 자체 유통), 창시자/디자이너 Chris Hunt(경비 근무 밤알바 시절 1인 개발로 시작). 엔진: OGRE + NVIDIA PhysX. Steam 얼리 액세스 2013-03(초기 EA 물결), 정식 1.0 2018-12-06(API 기준; KR 스토어 UI는 12-07 표기 — 타임존). Windows 64비트 전용, 콘솔 없음. 2026-05 누적 300만 플레이어. 후속 Kenshi 2는 1천 년 이전 프리퀄, Unreal Engine 전환(2019-09 공식 블로그) 확인 — 출시 시점 무기한(kenshi2when.com, 2026-05). [lofigames.com, Steam app 233860/API, Wikipedia, RPS, PC Gamer]
- 패배 사다리: **KO가 기본 패배 상태**(죽음이 아님) — 부상·실혈로 쓰러지고, 아군 기립·운반·침대 재활이 1급 명령. 사망 vs 포획은 세력이 결정: 노예상·성전국 경찰 등은 회복시키고 수갑을 채워 노예 캠프로 이송, "Obedient Slave" 직무 부여(탈출 시 낙인·수배 %). 노예 상태는 굶주림 100 이상으로 유지되는 **안정적 저영양 플로어** — 즉사가 아니라 훈련 루프이기도. 식인족에게 사로잡히면 포식이 정상 결과. 플레이어는 노예 소유 불가(구매 노예는 동료나 도주). [공식 FAQ/about-kenshi, 패치 노트, 위키 Wayback]
- 위치별 부상: 부위별 HP — 다리 파손은 절뚝·기어감, 팔 파손은 양손 무기 봉인. 지혈 키트·부목(기능 부분 복원)·붕대+침대(5× 회복)·의수(성능 트레이드: 체력/은신/수영 등, 종교 세력은 의수 착용자를 골격으로 취급 — 착용 자체가 적대 플래그). 절단은 −100% 초과 명중 시 드물게(설정 게이트). [공식 about-kenshi, 위키 Robot Limbs Wayback]
- 굶주림: 영양 바(갈증 없음, 부패 없음), 공유 인벤토리에서 자동 섭취(<250), 종사 여부로 소모율 차이, 굶주림이 스탯을 깎음. 물은 생존 자원이 아니라 요리/농업 재료. [위키 Food Wayback, Steam 문구]
- 세계 상태(World States): 명명된 지도자의 **사망/투옥/석방 플래그**가 마을 점거·폐허·내전 오버라이드와 스폰 테이블을 재작성. 구체 예: (1) 성주 피닉스 제거 → Blister Hill 파괴, 재판관 Seta·Valtena마저 쓰러지면 Flotsam 닌자 점거, 플레이어 거점에 Wrath of God 성전 레이드(1일 100% 발동, 지도 밖까지 사거리, 명명된 지휘관 선봉). *플레이어가* 붙잡아둔 피닉스를 풀어주면 선전포고, *타자가* 붙잡은 피닉스를 풀어주면 동맹 — 같은 동사, 반대 세계 상태. (2) 셰크 왕 에사타 제거 → Mukai 계승, Admag 함락 가능, 카미카제 순찰. (3) 황제 텡구 사망 → 수도 Heft가 농민에게, 내전·식인 침입, 귀족 다수 사망 시 사무라이 로그 스폰. 다지도자 세력(피닉스+재판관 2, 텡구+귀족 4)이라 한 번의 암살이 와이프가 아니다. [위키 World States/Town Overrides/지도자 문서 Wayback]
- 플레이어 부재 시뮬레이션: **카메라 주변 9개 구역만 완전 로드·시뮬레이션**(RPS 인터뷰, Hunt), 구역 밖 유닛은 추상적 글로벌 도로 그래프로 이동. 마을·전리품·NPC는 수작업 배치. 월드 스테이트 플래그는 안 보여도 지속·재작성. 레벨 스케일링 없음(지역별 상점·적성). [RPS 2018-12-19, Steam 문구 "living and surviving in a simulated world", 공식 FAQ]

### 서울 프로젝트 대응 (inference)
- "패배도 이야기다": KO→실혈→포획/노예화→사망의 사다리는 우리 전투 결과 반환(`Strategy-Battle-Roundtrip.md`)의 결과 어휘 확장 — 쓰러진 유닛은 전리품·인질·구출 목표.
- 월드 스테이트는 역 점거로 번역: 명명 지도자(16국·적대 집단)의 죽음/투옥/석방이 **어느 세력이 어느 역을 점거하는지**와 순찰 테이블·레이드 시계를 재작성. 다지도자 요구는 단일 암살 와이프 방지 설계 규칙으로 이식.
- 9구역 버블+추상 도로 그래프는 우리의 "활성 버블+집합 오프스크린" 아키텍처(`Save-and-Determinism.md` 결정론 계약과 결합)의 검증된 선례 — 레이드 시계(30~672시간)는 그대로 턴/일 타이머로 번역.
- 의수는 짐이 아니라 로드아웃: 스탯 트레이드+유지비+세력 복장 규정(특정 역은 개조를 이단으로 취급) — 캐스트 개별 상태 문서의 변칙 소재.

### 채택 / 거부
- 채택: 패배 사다리(KO/실혈/포획/노예/사망), 위치 부상의 캠페인 상태화(부목·침대·의수 회복 트리), 굶주림=전략 시계(전투 HP 아님, 자동 섭취·공유 인벤토리), 명명 지도자 월드 스테이트 플래그+다지도자 세력, 구출의 외교(같은 동사가 전쟁/동맹 갈림), 마을 오버라이드(폐허·점거·내전, 플레이어 재산 보존), 오프스크린 틱+추상 이동 그래프, 플래그 결과로서의 명명 레이드, 레벨 스케일링 부정, 분할 파티(노선별 다중 분대).
- 거부: 실시간 RTS 클릭 이동과 30인 일시정지 마이크로, 자유 카메라·시말리스 개방 세계·9구역 스트리머(고정 아이소 그리드가 이미 금지), 물리 래그돌·충돌 패스파인딩, 야생 요새의 연속 지형 조형(역 모듈/승강장 구획으로 번역), 안 보이는 공간의 실시간 다중 분대 제어(턴 종료 일괄 해소+이동 명령), 실시간 직무 자동화(오프스크린 상임 명령 틱으로 번역), 고어 슬라이더로서의 절단 빈도(상태는 유지, 실시간 HP 초과 판정은 폐기).


## Stoneshard (스톤샤드) — 역할: 턴제 원정 루프와 상태 부담

### verified
- 개발 Ink Stains Games, 유통 HypeTrain Digital. Steam 얼리 액세스 2020-02-06(app 625960), Prologue 무료 데모 2018-06-06부터. **2026-09-07 기준 여전히 얼리 액세스**(버전 0.9.4.x, 1.0 무기한 — 공식 FAQ "quality above all"). 플랫폼 Windows+Linux(GOG·Epic 병행, 콘솔은 EA 졸업 후). 엔진 GameMaker Studio 2(공식 핀 FAQ). [공식 사이트 stoneshard.com / Steam 앱페이지 / Steam 핀 FAQ]
- 2026-04-08 개발 로드맵: 남은 4대 글로벌 시스템은 인챈트·태스크·랜덤 조우·동적 특성이고, 2026 중 "Ancient Echoes" 패치, 본편 스토리는 맵 확장 이후 마지막. [Steam 뉴스 devlog]
- 표현: **탑다운 2D 픽셀**(아이소메트릭 아님), 타일 그리드 턴제. [공식 사이트·위키]
- 원정 루프: 안전 거점(여관·상점·계약자·평판) → 시간 제한 계약(contract) 수주 → 글로벌 맵 이동(매복·마차·카라반) → 절차 배치 던전 → 복귀 납품(왕관+거점 평판), 납품 후 해당 던전은 3~4일 리셋까지 봉인. [Steam 문구 "carefully prepare for each expedition", 위키 Contracts/Global Map]
- 전투 경제: **1행동=1턴**(AP 풀이 아님) — 이동·공격·스킬·아이템 각각 1턴, 접적 시 전투 모드에서 내 행동 후 맵의 모든 NPC가 행동. 소모 자원은 Energy+쿨다운(예: Set Aflame Energy 11/CD 5), 피로 1%당 최대 Energy 문턱 −0.75%. [위키 Combat Formulas]
- 부상·통증: 피해는 전역 HP+무작위 신체 부위 동시 감소, 50/25/0% 경증·중증·심각 부상(손 무기 낙하, 다리 이동 불능, 머리 혼수 등), 부상이 Max HP 상단을 깎아 물약 만회 차단, 통증 3단계 → Pain Shock(무작위 실족·최대 HP 절단). [위키 Injuries & Pain]
- 심리(0.9.3 개편): 사기·이성 각각 상황 50%/식단 35%/수면 15% 구성, 조합 상태(낙관·영웅심·공황·편집증). [위키 Psyche]
- 물자·휴식: 배고픔·갈증·피로 3단계 문턱, 수면 게이트 세이브(침대에서만 실제 저장), Rest 모드는 전투 중 불가. [위키 Fatigue & Resting / Steam 문구 "Saving can only be done in certain spots"]
- 위험 스케일: "거리 공식"은 없음 — **구역/던전 티어(1~5)/시간/물자**로 스케일. 개척지 사다리(Osbrook→Mannshire→Rotten Willow→Denbrie)가 계약 티어를 따르고, 길 없는 원거리 던전은 항상 수정자 붙은 고환률 지(T4~5, 시작 마을 근처에도 T5 가능), 티어는 플레이어 레벨 무시, 적 자동 스케일링 없음(최대 레벨 30). [Steam 핀 FAQ, 위키 Dungeons/Global Map]
- 카라반(0.9.1 "Rags to Riches", 2024-12-16): 이동 가능한 야영 거점 — 수면 저장·보관 800슬롯·요리·제작·기도·메신저 비둘기. 사료 소모는 거리+생물군계 비례, 사거리는 업그레이드 게이트. 추종자 최대 3/6 — **야영지에만 머무르고 전투·던전 불참**("Stoneshard isn't a party-based game"). [위키 Caravan & Followers, Steam 핀 FAQ]
- 퍼머데스는 선택(신규 게임 아이언맨 체크박스, 목숨 1·세이브 삭제), 기본은 무한 목숨+수면 세이브 리로드. [공식 사이트·FAQ]

### 서울 프로젝트 대응 (inference)
- "역 거점 → 노선 이동 → 현장 → 복귀 납품" 구조가 우리 원정 루프(`docs/game-logic/Campaign-Loop.md`, `Travel-and-Encounters.md`)와 직접 대응. 계약 시간 제한과 던전 봉인·리셋은 조우 배치의 재생 리듬 참조.
- 카라반의 사료/사거리/쿨다운은 "연료와 시간표" — 우리 물류(`Logistics-and-Infrastructure.md`)의 보급 병목 모델로 이식 가능. 이동 야영지는 2차 거점(역 밖 캠프) 설계 선례.
- 귀환 세금: 부상·통증·피로·사기가 문 앞에서 리셋되지 않는다 — 전투 결과가 캠페인 상태로 되돌아오는 우리 왕복 계약의 실증 선례.

### 채택 / 거부
- 채택: 계약-원정-복귀 루프, 이동 야영지(사료=연료), 지속 부상(귀환 세금), 계약 현장 vs 미개척 지선의 두 현장 클래스, 구역 티어제(자동 스케일링 금지), 평판 허브 메타, 수면 게이트 세이브 옵션(아이언맨 인접 긴장), 야영 전문가 역할(전투원이 아닌 캠프 기능).
- 거부: 탑다운 카메라와 1행동 턴(우리는 고정 아이소 스쿼드 SRPG — 진성 AP 풀 유지), 솔로 전투 설계, "로그라이크 와이프/메타 없음" 오인 인용(Stoneshard는 거점 메타가 지속된다), 미완성 랜덤 조우 층의 완성 참조(2026 로드맵에도 미구현), 배고픔으로 거리 난이도 모델링(시간 세금이지 지리 세금이 아님), EA 셰이프(스토리 마지막) 복제.


## Crusader Kings III — 역할: 인물·가문·직위 중심 장기 시뮬레이션

### verified
- 개발 Paradox Development Studio, 유통 Paradox Interactive. PC(Win/mac/Linux) 2020-09-01, 콘솔(PS5/Xbox Series) 2022-03-29. 엔진: Clausewitz + Jomini 툴셋. 2025-04 기준 400만 판매, 2026-09에도 DLC 지원 중(Chapter V 2026-04-20, By God Alone 2026-09-30 예정). [Wikipedia, Steam app 1158310, Paradox 공식 사이트]
- 관계/호감도: 모든 캐릭터가 다른 캐릭터마다 수치 Opinion을 보유 — 플레이어 대상 행동 성공률과 AI 행동(세금·병력 제공, 적대 개입)을 좌우. 사망 시 후계자가 전임자에 대한 호감을 **긍정 25%/부정 50% 상속**(이야기 엔진). 방향성 관계 트랙: 친구 +60/절친 +120, 연인 +60/운명적 +120, 라이벌 −60/네메시스 −120. 가족 보너스(부모/자식 +50, 형제·배우자 +25), 폭정(Tyranny) 누적과 감쇠. [공식 위키 Opinion/Character — Wayback 스냅샷 1.2]
- 음모(Scheme) 수명주기: 대상 지정 → 기본 1적대+1개인 동시 → 능력 대 능력으로 매달(매턴) 진행 판정 → 완료 시 성공 굴림 → 적대 음모는 비밀 유지(Secrecy) 판정. 공범(Agent)은 근접도 가중(첩자부장 +75, 배우자/절친 +50)으로 성공률 가산, 공포에 겁먹은 자는 강 고리(Hook) 없으면 거절. 비밀 발견 → 폭로 또는 협박 → 약/강 고리(강 고리는 재사용·행동 강제). [공식 위키 Schemes — 스냅샷 ~1.10]
- 계승·청구권: 계승 불가 자녀에게 압류 청구권(pressed claim) 부여, 부모의 압류 청구권은 상속자에게 비압류로 전환(1대만), 전쟁에서 압류하면 다시 압류. 상속법: 단일 상속(장자상속/말자/가문 연장자) vs 분할 상속(분할/자동 균등 분할/고분할 — 왕국급 타이틀 자동 생성이 분열 엔진). 성별법·서자·폐적출 게이트. 플레이어 계승자≠주 계승자(다른 왕조)면 게임 오버 규칙. [공식 위키 Succession — 스냅샷 ~1.10]
- 왕조/가문: 왕조(Dynasty) = 창시 가문 + 방계(Cadet Branch, 새 이름·모토·문장, 창시자가 가문장). 가문장은 서자 인정·가문 소집·강제 개종, 왕조장은 군사력 최강 가문장(10% 초과 시 교체), 명성(Renown) 화폐로 소집·청구·폐적출 등 유료 상호작용과 세대별 영구 해금(왕조 유산) 지급. [공식 위키 Dynasty — 스냅샷 1.2]
- 직위(Council) = 6석 전문 임명직: **석당 1인 배타, 한 번에 한 과업, 과업 전환 시 진행도 소멸, 주 스킬이 과업 효과를 스케일**(재무관 스킬당 세금 +0.5% 등), 보수로 스킬 경험+계급별 특전, 재임 중 연 1회 관련 이벤트 주입. 석: 배우자(전 스킬 20% 보좌 또는 1스킬 50% 특화), 법무장(외교/국내/타이틀 통합), 재무관(세금/개발/문화), 원수(병력/사관/통제), 첩자부장(음모 방해/지원/비밀 수색), 법무관(개종/청구 위조). 궁정 직위(경호원·시종 등)는 별개 계층 — 음모 공범 근접도로 기능. [공식 위키 Council — 스냅샷 1.2]
- 특성 → 결과: 성격 특성(통상 ≤3)이 능력치·호감도·이벤트 선택지·AI를 바꾸고, 성격에 반하는 행동은 스트레스를 쌓음(2+에서 붕괴 시 특성 변경). 교육 특성은 직위 자격(스튜어드십 교육=재무관 과업 스킬). 예: Brave +2 Martial/+5 가신 호감, Greedy +15% 수입/−2 외교. [공식 위키 Traits — 스냅샷 1.2, IGN 리뷰]

### 서울 프로젝트 대응 (inference)
- "사람이 지도다" 결합만 채택: 호감도 수치 × 직위 × 계승이 역-노선 정치를 굴린다. "지난 역장을 사랑했는지 미움받았는지"가 후계자 출발점을 결정하는 CK3식 상속 호감은 우리 가문·세력 문서(`Ambitions-and-Relations.md`, `Cast-Relations.md`)의 엔진.
- 직위 6석 중 3~4석으로 압축 이식: 한 자리 한 사람 한 과업, 스킬 스케일, 배우자식 보좌(소규모 캐스트에서 배우자=스탯 배터리).
- 음모는 압축 이식: 살해/고리/자리 찬탈 3종이면 충분. 비밀→협박→고리 사슬은 역질서·협박 이벤트의 뼈대.
- 계승은 캠페인 척추: 분할 상속의 자동 분열 압력, 방계 가문 분가 = 역 집단의 독립, 폐적출·서자 규칙.

### 채택 / 거부
- 채택: 수치 호감도+명명 관계 트랙, 전임자 호감 상속(25/50), 배타 직위-과업-스킬 스케일, 음모 수명주기(공범 근접도 포함), 압류/비압류 청구권 1대 전환, 분할 상속 분열 압력, 성격 특성의 스트레스 제약, 왕조-가문-방계 중첩.
- 거부: 수천 캐릭터·수천 타이틀 규모(공식 카피 "thousands of unique counties..." — 16국 명명 캐스트에 사형), 실시간 일시정지 대륙 지도 루프(우리는 지하철 그래프 위 턴제), 6석×다과업×연간 이벤트 테이블 전체 이식, 혈통 DNA·근친 유전 시스템, 명성/화려함/세대 유산 5단 트리, de jure 타이틀 수학(역 인접+노선 소유로 대체), 후속 DLC의 무토지 모험가·유목·천문 과층.


## 太閤立志伝V DX (태합입지전V DX) — 역할: 직업 입지전과 주임 미션

### verified
- 원작 태합입지전V: 코에이(Koei), Windows 2004-03-12 정식 발매, 이후 PS2(2004-08-26)·PSP(2009-09-17). 장르 명칭은 코에이식 "리코에이션 게임"(시뮬레이션+RPG 혼합). [ja.wikipedia 태합立志伝V, 코에이 카탈로그]
- DX 리마스터: KOEI TECMO GAMES, **2022-05-19 일본 발매**(Switch+Steam, 스팀 기록일은 18일 — 타임존 차이). HD 리마스터 + 무장·시나리오·QoL 추가, 이벤트 에디터는 Windows 전용. 언어: 일본어·간체·번체 (영어 없음). [DX 공식 사이트 gamecity.ne.jp/taikou5dx, GAME Watch 보도, Steam app 1842810]
- 플레이 가능 직업 8종, 2계층(공식 DX 웹 매뉴얼 "게임의 흐름"): **세력계 4종**(무사·닌자·해적·상인 — 각각 평정/주임과 천하일 엔딩 보유, 상호 배타) + **구도계 4종**(검호·다인·의사·대장장이 — 세력 소속이나 낭인 생활 위에 겸업 가능, 하나의 작업장만 보유). [매뉴얼 1200.html]
- 무사 주임(主命) 진행 체계: **홀수월 평정(성, 1~5일) → 현재 계급에서 합법한 주임 목록에서 플레이어가 선택(닌자는 배정만) → 현장 보고 → 훈공(勲功) 누적 → 계급 승진 → 미션 풀·봉급·병력 상한 확대**. 성주 이상부터는 플레이어가 평정을 주관해 가신에게 주임을 내린다. 지각·기한 초과·포기는 훈공 감소. 계급 사다리: 족경조두(0) → 족경대장(200) → 시대장(600) → 부장(1400) → 가로(3000) → 성주(임명) → 국주 → 다이묘(모반 또는 상속). [매뉴얼 4200/5100/5130/5160]
- 성장: 주임 성과 → 훈공 → 계급(경험치 직접식 아님). 16계열 스킬(족경·기마·철포·수군·궁술·무예·군학·인술·건축·개간·광산·산술·예법·변설·다도·의술)을 시설이나 **친밀도가 높은 고수 NPC 사사**로 습득. 친밀도 게이트: 취향 맞춘 선물(월 1회), 다석(월 1회), 수합(반복) — 고친밀도는 주인공 카(미래 플레이어 캐릭터 해금)를 줄 수 있다. [매뉴얼 1200/3300/3400]
- "일본일/천하일" 결말: 정복만이 승리가 아니라 직업별 목표 — 무사(180성 점령 또는 동맹 포함 또는 정1위), 닌자(12리 마을 전부 또는 니술 카 전수집), 해적(16해역), 상인(15상업권 상인사 또는 전 다이묘 어용상인), 검호(천람시합 우승·비전 전습득·제자 1만·통일 후견·제자 20+), 다인(최고의 다도·최고의 다구), 의사(치료와 신뢰), 대장장이(최고의 무기). DX 공식: 39종 엔딩(신규 5종). [공식 사이트 features.html, 매뉴얼 5500~5800]
- 카드(札)는 인벤토리·해금 토큰일 뿐 — V에서는 IV식 카드 전투를 폐기하고 위치·기합·비기 개인전, 육각 전장 야전, 곽별 공성+교섭으로 전환. 미니게임은 옵션에서 스킵 가능(스탯 대체 판정)하나 일부 이벤트는 강제. [매뉴얼 3400/3200]

### 서울 프로젝트 대응 (inference)
- 직업=룰셋 이식: 무사→역무원·노선관리·운송조합(주기 평정+주임+훈공 계급, 후반엔 직접 주임 하달), 상인→상인(역 간 교역로·상권 관리인 경쟁), 닌자→탐사자(배정만 되는 불규칙 임무, 기술 수집 엔딩), 해적→화물·미사용 선로·차고 크루(구역 지배), 검호→경비대·도장 사범, 대장장이→정비사(레시피 카드→자기 서명 장비가 개인 천하일), 의사→의무관(무료 진료 vs 유료 명성 갈림길), 다인→기록관·역 사교(두 NPC를 초대해 그들 관계를 바꾸는 사회적 중개 — 비전투 최고 레버리지).
- 세력계 배타+구도계 겸업 2계층은 우리 직업 문서(`Characters-Factions-and-Professions.md`)의 "직위-기능" 이중 구조와 정합.
- 주임→훈공→계급 사다리는 캠페인 성장(`Campaign-Progression.md`)의 인물 단위 미션 척도 참조.

### 채택 / 거부
- 채택: 평정-주임-훈공-계급 척도, 세력계/구도계 2계층 직업 구조, 친밀도 게이트 사사(월 한도 있는 선물·다석·수합), 직업별 "시스템 최고" 결말 가족(정복은 한 갈래뿐), 해금 토큰형 카드(전투 규칙 아님), 스킵 가능한 미니게임(스탯 판정 대체).
- 거부: 센고쿠 고유물 전부(도요토미·오다·혼노지·정1위·180성·12리·16해역·15상업권 수치와 이름, 足軽組頭 등 직급 문자열, 역사 초상), IV식 카드 배틀(V조차 폐기), 닌자/해적 아이콘의 서울 이식(탐사자는 "서울의 닌자"가 아니라), 궁정 칙명 강화(필요하면 안전 사고·조합 투표·도시 조례로 대체), 수명-1621 시한(교대 연도·폐쇄 시계로 대체).


## Tree of Savior (트리 오브 세이비어) — 역할: SD 실루엣 표현 규약

### verified
- 개발 IMC Games(서울, 2003 창립, CEO 김학규 — 그라비티 창립·라그나로크 온라인 창작자). 한국: 넥슨 유통, 2015-12-17 오픈 베타 → 2015-12-29 정식 서비스. 국제: Steam 창시자 얼리 액세스 2016-03-28, F2P 전환 2016-04-28. 엔진은 자체 개발(DX9 시대 IMC 자체 클라이언트, 서드파티 엔진명 미공개). [ko/en Wikipedia, Steam app 372000, IMC 공식 사이트]
- 표현 파이프라인(공식·보도 확인): **3D 캐릭터 모델을 먼저 만들고 2D 도트(픽셀)로 베이크**해 3D 배경 위에서 움직인다. 4Gamer G-Star 2013: "一度3Dグラフィックスでキャラクターモデルを作ってから，2Dのドット絵に落とし込む". IMC 공식: "3D 모델링에 텍스처를 입히고 회화적인 느낌을 가미". [4Gamer 2013/2011, IMC 사이트, Kotaku "2D character sprites moving around in a 3D world"]
- SD 비율: **공식 두상 수치는 미공개**(확인된 바 없음). 공개 정보는 "귀엽고 매력적인" SD·RO 계열 대두 캐릭터임이 전부 — 눈대중 2~3두상. **우리의 2.5두상은 TOS 수치가 아니라 우리 규격이며, TOS와 눈대중으로 맞아떨어진다.** [UNVERIFIED 플래그: 자식 레인 확인]
- 스프라이트 방향 수(4방향 vs 8방향): **공식 진술 미확인**. RO는 8방향 기억이 있으나 TOS는 아이소메트릭+베이크 2D 시트로 8면이 가능해도 주장할 1차 출처 없음. 우리의 4방향 계약은 TOS보다 엄격한 우리 규격. [UNVERIFIED 플래그: 자식 레인 확인]
- 실루엣 판독 장치: 직업 정체성은 **무기 실루엣+직업 코스튬**이 운반(확대 무기·투구·색 블록·스킬 FX가 축소 화면에서 일한다), 방어구는 천/가죽/판금 3 덩어리 패밀리. 2D 스프라이트는 군중 속에서 하드 외곽선을 유지 — 3D 스킨 메시가 잃는 판독성. [Steam 문구 "costumes and expressions", 공식 매거진 2018, EP18-2 패치]
- 성장(참고만, 수치 복제 금지): 출시 시 8랭크 클래스, Re:Build(2018) 개편으로 캐릭터당 기본 1+전직 3(총 4클래스), 5트리(검사/마법사/궁수/클레릭/스카웃). 라이브: "Tree of Savior W" 리브랜딩(EP18-2, Lv 560, 2026-09에도 주간 패치 활동). 콘솔 없음, 모바일은 별도 게임(TOS M 2022-11, Neverland 2024-10, Neo 2025-06). [Steam, 공식 Re:Build 블로그, 공식 EP18-2 페이지, IMC]

### 서울 프로젝트 대응 (inference)
- 우리 미술 방향(`Character-Art-Direction.md` "트리 오브 세이비어식 SD")의 근거 정본: 채택 대상은 **스프라이트 계약**(SD 대두, 고정 아이소 방향, 무기/투구 실루엣 플래그, 3D→픽셀 베이크 파이프라인)이지 서비스가 아니다. TOS가 10년 판독성을 유지한 이유는 "캐릭터가 플래그"이기 때문 — 64px에서 패션 카탈로그가 아니라 외곽선이 계급장.
- 3D 제작→2D 베이크는 우리 3역할 파이프라인(도트 헤드+메시 바디)과 직접 호환 — TRELLIS 3D 후보를 베이크해 방향성 스프라이트로 정착하는 경로의 선례.

### 채택 / 거부
- 채택: 3D→2D 픽셀 베이크 파이프라인, SD 대두·소신(2.5두상 계약과 일치), 고정 아이소메트릭(오르빗 금지), 무기/모자/색 블록 실루엣 플래그(장비는 알베도가 아니라 외곽선을 바꿔야), 천/가죽/판금 3 덩어리 패밀리, 큰 FX로 행동을 읽히는 전투 언어, 트리당 하나의 실루엣 패밀리.
- 거부: TP/토큰/캐시 코스튬·가챠·시즌 장비 트레드밀 등 라이브 서비스 경제 전부, 80~100+ 클래스 조합론과 히든 직업 게이트, 자동 매칭 레이드·길드 영토전·동반자 캐시 펫, 미화점(상점 루프 — 피팅 카메라 발상만 참고), TOS의 미해결 4/8방향 수식을 사실처럼 인용, 공식 미공개 두상 수치를 TOS 규격으로 표기.


## Underrail — 역할: 지하철 역-국가 세계 전례 (공개 금지 비교작)

### verified
- 개발/유통: Stygian Software(자체 유통), 디자이너 Dejan Radisic. Windows 단일 플랫폼, 정식 출시 2015-12-18, 얼리 액세스는 2012년 말 시작. 확장: `Underrail: Expedition`(2019), `Underrail: Heavy Duty`(2023). 후속 `Underrail 2: Infusion` 개발 중. [Wikipedia: https://en.wikipedia.org/wiki/Underrail]
- 세계 전제: 지표 생활이 불가능해진 원격 미래, 인류의 잔존자가 지하철역들이 "역-국가(station-states)"를 이루는 광대한 지하철망(Underrail)에 산다. 공식 문구: "the remnants of humanity now dwell in the Underrail, a vast system of metro station-states that, it seems, are the last bastions of a fading race." [공식 사이트: https://underrail.com/]
- 전투: "old school turn-based isometric" — 턴제 아이소메트릭, 탐험·전투 집중. [공식 사이트]
- 전투 규칙은行动점(AP) 중심이며 특수기는 쿨다운. [RPGCodex 리뷰: https://rpgcodex.net/article.php?id=10525]
- 소음 시스템: 적 AI가 소음에 반응해 지원 호출·조사 — 우회/유인 플레이 창출. [RPGCodex 리뷰]
- 캐릭터 육성: 단일 캐릭터 커스터마이징, 제작 시스템, SPECIAL(Fallout) 계열 규칙의 영향. [Wikipedia]

### 서울 프로젝트 대응 (inference)
- 지하철 "역-국가" 세계 전제의 검증된 선례. 우리의 차별화: (1) 역 하나가 아니라 16국 규모의 정치 체제, (2) 파티·가문·직위 사회 시뮬레이션, (3) 결정론적 4방향 SRPG 전투. Underrail은 단일 캐릭터 CRPG라 전투·탐험 루프만 참조한다.
- 이 작품명은 위키 금지 공개 용어다 — 공개 물량에 이름·인용 그대로 노출 금지. 본 문서가 유일한 기록 위치.

### 채택 / 거부
- 채택 후보: 역 단위 정치 단위(이미 우리 설계와 일치), 지하 환경의 폐쇄성이 만드는 긴장, 소음·탐험 긴장(조우 설계 참고 수준).
- 거부: 실시간 탐험+턴제 전투 하이브리드(우리는 4방향 턴제 고정), 단일 캐릭터 시점, SPECIAL식 능력치 복제.

## SRPG 장르 역할 (일반) — 조우를 제한된 전장과 명시적 승패로

### verified
- Into the Breach (Subset Games, 2018-02-27, Windows 이후 다중 플랫폼): 턴제 전투에서 적의 행동을 미리 보여주는(telegraph) 시스템, 맵마다 명시적 목표와 고정 턴 수. [Wikipedia: https://en.wikipedia.org/wiki/Into_the_Breach] 인용: "The game uses a turn-based combat system, allowing the player to coordinate the actions of their team in response to enemy moves and actions that serve to telegraph their attacks." / "the player controls three different mechs against the Vek, and will be given an objective for that map along with a fixed number of turns to complete that objective."
- Fire Emblem: Three Houses (Intelligent Systems, 2019): 격자 기반 턴제 전투, 고정 유닛 운용, 3개 가문(house) 지도자 중심 서사 구조 — 가문 단위 캐스트 조직의 선례. [Wikipedia: https://en.wikipedia.org/wiki/Fire_Emblem:_Three_Houses]

### 서울 프로젝트 대응 (inference)
- 우리 SRPG 계약(`docs/game-logic/Realtime-Formation-Card-Battle.md`, `Strategy-Battle-Roundtrip.md`): 조우는 제한된 전장+명시적 승패로 풀고, 결과(부상·포획·사기·자원·통제)는 캠페인 상태로 되돌아간다. ItB의 "목표+고정 턴"은 전투 종결 조건 설계의 참조, FE3H의 가문 조직은 Cast-Relations·가문 문서의 참조.

## 출처 등록부

| # | 대상 | 출처 | URL | 접근일 | 핵심 인용(요지) |
|---|------|------|-----|--------|----------------|
| U1 | Underrail | 공식 사이트 | https://underrail.com/ | 2026-09-07 | "metro station-states", 턴제 아이소 |
| U2 | Underrail | Wikipedia | https://en.wikipedia.org/wiki/Underrail | 2026-09-07 | 2015-12-18 정식, 확장 2종, 후속 개발 |
| U3 | Underrail | RPGCodex 리뷰 | https://rpgcodex.net/article.php?id=10525 | 2026-09-07 | AP 중심 턴제, 소음 시스템 |
| S1 | Into the Breach | Wikipedia | https://en.wikipedia.org/wiki/Into_the_Breach | 2026-09-07 | 적 행동 예고, 목표+고정 턴 |
| S2 | FE Three Houses | Wikipedia | https://en.wikipedia.org/wiki/Fire_Emblem:_Three_Houses | 2026-09-07 | 격자 턴제, 3가문 구조 |
| ST1 | Stoneshard | 공식 사이트 | https://stoneshard.com | 2026-09-07 | "challenging turn-based RPG... open world", 아이언맨 표기 |
| ST2 | Stoneshard | Steam 앱페이지 | https://store.steampowered.com/app/625960/Stoneshard/ | 2026-09-07 | EA 2020-02-06, 원정·카라반·부상 문구 |
| ST3 | Stoneshard | 공식 위키 | https://stoneshard.com/wiki/Stoneshard_Wiki | 2026-09-07 | 0.9.4.23, 여전히 EA |
| ST4 | Stoneshard | Steam 핀 FAQ | https://steamcommunity.com/app/625960/discussions/0/2567564692468593199/ | 2026-09-07 | GameMaker Studio 2, 솔로, 자동 스케일링 없음 |
| ST5 | Stoneshard | 로드맵 devlog | https://store.steampowered.com/news/app/625960/view/519743485967859961 | 2026-09-07 | 남은 4대 시스템, 1.0 무기한 |
| T1 | 태합V DX | 공식 사이트 | https://www.gamecity.ne.jp/taikou5dx/ | 2026-09-07 | 직업별 "일본일" 문구, 39엔딩 |
| T2 | 태합V DX | Steam app 1842810 | https://store.steampowered.com/app/1842810/ | 2026-09-07 | 2022-05-18(기록일), 일·간·번체만 |
| T3 | 태합V | ja.wikipedia | https://ja.wikipedia.org/wiki/太閤立志伝V | 2026-09-07 | 2004-03-12 Windows, DX 2022-05-19 |
| T4 | 태합V DX | GAME Watch | https://game.watch.impress.co.jp/docs/news/1387553.html | 2026-09-07 | 5월 19일 발매 보도 |
| T5 | 태합V DX | 공식 웹 매뉴얼 | https://www.gamecity.ne.jp/manual/TaikeWqS/jp/1200.html 외(4200/5100/5500~5800) | 2026-09-07 | 주임→훈공→계급, 직업 체계 |
| T6 | 태합V | 코에이 구작 카피 | https://www.gamecity.ne.jp/products/products/ee/new/taikou5/game.htm | 2026-09-07 | 해적·대장장이·의사·다인 직업 추가 문구 |
| O1 | TOS | IMC 공식 | https://www.imc.co.kr/ | 2026-09-07 | "3D 모델링에 텍스처... 회화적인 느낌" |
| O2 | TOS | Steam app 372000 | https://store.steampowered.com/app/372000/Tree_of_Savior_English_Ver/ | 2026-09-07 | 2016-03-28 EA, F2P, Windows 전용 |
| O3 | TOS | 공식 EP18-2/W | https://treeofsavior.com/event/Ep_18-2/ | 2026-09-07 | Lv560 확장, 2026-09 라이브 |
| O4 | TOS | 4Gamer G-Star 2013 | https://www.4gamer.net/games/132/G013290/20131118071/ | 2026-09-07 | 3D 모델→2D 도트 베이크 |
| O5 | TOS | en/ko Wikipedia | https://en.wikipedia.org/wiki/Tree_of_Savior | 2026-09-07 | EA/F2P 일자, 한국 2015-12-29 정식 |
| O6 | TOS | 공식 Re:Build 블로그 | https://treeofsavior.com/page/news/view.php?n=1534 | 2026-09-07 | 4클래스·5트리 개편 |
| O7 | TOS | 공식 매거진 2018 | https://treeofsavior.com/magazine/201804/ | 2026-09-07 | 김학규 PC TOS 총괄, "charming visual style" |
| C1 | CK3 | Paradox 공식 | https://www.paradoxinteractive.com/games/crusader-kings-iii/about | 2026-09-07 | 왕조·후계자 정체성 카피 |
| C2 | CK3 | 공식 위키(Council 등, Wayback) | https://web.archive.org/web/20201127195942/https://ck3.paradoxwikis.com/Council | 2026-09-07 | 6석 직위·과업 정의 |
| C3 | CK3 | Steam app 1158310 | https://store.steampowered.com/app/1158310/Crusader_Kings_III/ | 2026-09-07 | 2020-09-01, PDS/Paradox, "thousands" 규모 |
| C4 | CK3 | Wikipedia | https://en.wikipedia.org/wiki/Crusader_Kings_III | 2026-09-07 | Clausewitz+Jomini, 콘솔 일자, DLC 연표 |
| K1 | Kenshi | Lo-Fi 공식 about/FAQ | https://lofigames.com/about-kenshi/ | 2026-09-07 | 의료 시스템·KO 문화 문구 |
| K2 | Kenshi | Steam app 233860/API | https://store.steampowered.com/app/233860/Kenshi/ | 2026-09-07 | 1.0 2018-12-06, "simulated world" |
| K3 | Kenshi | 위키 World States(Wayback) | https://web.archive.org/web/20241229230856/https://kenshi.fandom.com/wiki/World_States | 2026-09-07 | 지도자 플래그→세계 지속 결과 |
| K4 | Kenshi | RPS Hunt 인터뷰 | https://www.rockpapershotgun.com/how-kenshis-world-is-designed-not-to-care-about-you | 2026-09-07 | 9구역 버블 시뮬레이션 |
| K5 | Kenshi | Lo-Fi 커뮤니티 업데이트 | https://lofigames.com/community-update-3-million-copies-sold/ | 2026-09-07 | 300만 판매, Kenshi 2 무기한 |
| K6 | Kenshi | Lo-Fi 블로그 #29 | https://lofigames.com/kenshi-kenshi-2-development-news/ | 2026-09-07 | Kenshi 2 Unreal 전환 |

## wave-1 판정 해소 (SUPPORTED WITH SOURCE GAPS → RESOLVED WITH SOURCES)

wave-1의 책임 매트릭스 주장과 corrections에 출처가 부여됐다:
- Kenshi: 비선형 파티 생존·실패 지속·세계 계속 회전 → K1/K2/K4, 월드 스테이트 구체 사례 3건 → K3.
- Stoneshard: 턴제 원정·상태 부담·안전 거점 복귀 → ST1~ST5. (wave-1 한 줄에 없던 정정: 여전히 EA, 1행동 턴제, 카라반 존재.)
- CK3: 인물·가문·관계·계승·직위 → C1~C4.
- 태합입지전V DX: 2022년 공식 발매 확정(2022-05-19 JST; Steam 기록일 05-18) → T2/T3/T4 — wave-1 correction 확증. 직업 다양성(무장 외 상인·대장장이·해적·다인 등) → T1/T5/T6 — wave-1 correction 확증. "복수 결말"은 공식 39엔딩(T1).
- Tree of Savior: SD 실루엣·판독 → O1~O7. 라이브서비스 수치·100+ 클래스 복제 금지 원칙 유지(O6).
- SRPG 역할(제한 전장·명시 승패) → S1/S2.
- wave-1에서 폐기된 "모바일 플레이/비폭력 세계/봉건 전쟁 회피" 주장은 출처 없음이 확인됐고 본 문서에 채택하지 않는다.

## 남은 UNVERIFIED 등기부 (팩트로 인용 금지)

- TOS: 공식 두상 비율 수치, 스프라이트 4/8방향 수, 서드파티 엔진명, IMC "2016-05" F2P 표기 vs Wikipedia 04-28.
- CK3: Legitimacy 수치 랭크 전체(라이브 위키 JS 게이트), 1.2 이후 평의회 변화, 공식 "real-time with pause" 문구.
- Kenshi: 종족별 굶주림 소모 수치, 레이드 테이블 전체(원문 페이지 404), Kenshi 2 출시 시기.
- Stoneshard: 크로스런 메타 존재 여부, macOS EA 표기(PCGamingWiki vs Steam API 충돌).
- 태합V: 39엔딩 전체 목록, 구도계 천하일 수치 플래그, 대만판 언어.
- Steam KR UI 표기 차이: Kenshi 12-07 vs API 12-06(타임존), 태합V DX 05-18 vs 공식 05-19(타임존).
