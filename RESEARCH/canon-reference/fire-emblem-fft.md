# Fire Emblem Awakening / Final Fantasy Tactics 시스템 대전

> 출처 인계: [공유 조사 색인](../../.omo/research/README.md). 로컬 sources.json·원문 패킷 언급은 조사 당시 기록이며 이 전달에 원시 자료가 포함된다는 뜻이 아니다. 누락된 ID는 미확인으로 남긴다.

> **독립 게임 규칙 참조 문서.** 다른 프로젝트의 평가, 개선안, 구현 요구사항을 포함하지 않는다. 조사 기준일: 2026-09-06.
>
> **판본:** FE는 Nintendo 3DS용 **Awakening**. FFT는 **PlayStation 원작**, 수치표는 별도 표시가 없으면 **북미 PS판**이다. 일본 PS판의 매뉴얼은 공통 조작·진행의 1차 자료로 사용한다. 일본 PS/PSP **The War of the Lions(WotL)**의 직업 조건은 별도 열에 병기한다. **The Ivalice Chronicles의 Enhanced 모드, FFTA/FFTA2, FE Fates의 규칙은 원작 규칙에 합치지 않는다.** [문서][S01][S02][FEFFT-FFT02][FEFFT-FFT52]
>
> **표기:** `[문서]`는 실제 열람한 매뉴얼·위키·전문 데이터베이스의 내용, `[추론]`은 그 규칙을 적용한 계산 예나 기능적 분류, `[미확인]`은 원문 누락·상충·판본 불명으로 확정하지 않은 내용이다. `[추론]`은 숨은 게임 규칙을 추측했다는 의미가 아니다. 표의 도입부 인용은 해당 표 전체에 적용된다. 영문 명칭은 판본 간 식별용이며 한국어 번역은 편의상 붙였다.
>
> **수식 읽기:** `floor(x)`는 버림, `%p`는 퍼센트포인트, `PA/MA/SP/WP`는 FFT의 물리공격/마법공격/속도/무기공격력이다. 예제는 별도 명시가 없으면 지형·속성·특수 스킬·궁합 보정을 제외한다. 위키가 정수 연산 순서를 밝히지 않은 식을 비트 단위 재현 공식으로 취급하지 않는다.

## 1. 개요

### 1.1 Fire Emblem Awakening

**Intelligent Systems 개발, Nintendo 발매의 턴제 전략 롤플레잉 게임**으로 Nintendo 3DS에서 일본 **2012-04-19**, 북미 **2013-02-04**, 유럽 **2013-04-19**에 출시했다. 플레이어는 Chrom의 Shepherds와 커스터마이즈한 전술가 Robin을 지휘한다. 사각 격자에서 아군 전체가 움직이는 페이즈제, 무기 소모·상성, 직업 승급/재전직, 인접 협력과 Pair Up, 지원 대화·결혼·자녀의 능력 계승이 연결된다. 세계지도에서 본편, 외전, 조우전, 상점을 선택하며 Classic의 영구 전력 손실과 Casual/Newcomer의 전투 한정 퇴각을 독립적으로 선택한다. [문서][FEFFT-FE01][S01 §§2,6,9,13–14]

### 1.2 Final Fantasy Tactics

**Square 개발의 전술 롤플레잉 게임**으로 PlayStation에서 일본 **1997-06-20**, 북미 **1998-01-28**에 출시했다. Ivalice의 사자전쟁과 Ramza의 여정을 다루며, 회전 가능한 입체 격자 전장 위에서 **개별 유닛의 CT가 행동 순서를 결정**한다. 직업별 JP로 능력을 배워 서로 다른 직업의 명령·반응·보조·이동 능력을 조합하고, 고저차·방향별 회피·시전 지연·Brave/Faith·별자리 궁합으로 공격과 회복을 계산한다. 세계지도 노드 이동, 상점, 병사 고용, 주점의 파견 의뢰, 숨은 동료와 Deep Dungeon이 전투 외 활동을 구성한다. [문서][FEFFT-FFT01][FEFFT-FFT18][S02 pp.10–14,25–39]

### 1.3 혼동하면 안 되는 핵심

| 항목 | Awakening | FFT PS |
|---|---|---|
| 시간 | Player → Enemy → 필요시 Other 페이즈 | 진영과 무관한 CT/AT |
| 성장 단위 | EXP, 무기 EXP, 레벨에서 배우는 스킬 | EXP와 별도인 직업별 JP |
| 능력 구성 | 활성 스킬 최대 5개 | 주 직업 명령 + 보조 명령 + 반응/보조/이동 각 1개 |
| 협력 | 인접 Dual + 동일 칸 Pair Up | FE식 Pair Up 없음; 능력 조합·범위 지원 |
| 사망 | Classic 영구 손실 / Casual 맵 한정 퇴각 | KO 뒤 개인 CT 기반 구조 기회, 결정화하면 영구 손실 |
| 지형 | 이동 비용·Def/Avoid·회복 | 이동·높이·시선·방향·Geomancy |
| 재전직 | Seal 소비, 표시 Lv 1로 초기화 | 해금된 직업으로 변경, 인물 레벨 유지 |

[문서][S01 §§9,13–14][S02 pp.11–13,30–35][FEFFT-FE20][FEFFT-FFT18][FEFFT-FFT43]

## 2. 코어 루프

### 2.1 Awakening: 전투 성과를 다음 편성과 관계로 전환

```text
세계지도: 다음 본편 / 외전 / 조우전 / DLC 선택
  ├─ 상점·연성 → 무기/지팡이 보충
  ├─ 인벤토리·Seal·스킬 → 전력 구성
  └─ 지원 대화·결혼 → 협력 강화·자녀 외전 조건
                  ↓
준비: 승리 조건·적·지형 확인 → 출격 인원·시작 위치 확정
                  ↓
아군 페이즈: 이동 → 공격/지팡이/Pair Up/교환/춤/대기
                  ↓
적 페이즈 → 기타 진영 페이즈 → 생존·목표 확인 ─┐
                  ↑__________________________________│
                  ↓ 승리
EXP·무기 소모·획득품·지원점·생존자·지도 해금 반영
                  ↓
세계지도 복귀 / 다음 이야기 → 반복
```

위 도식은 매뉴얼의 메뉴·페이즈·성장·지원 관계를 묶은 **기능적 요약**이다. EXP는 전투 행동 직후 발생하므로 전부 승리 정산에서 지급되는 것이 아니다. 지원점은 전투 종료 시 정리되고, 지원 대화를 실제로 보아야 다음 지원 단계로 올라간다. [추론][S01 §§6–14][FEFFT-FE47]

### 2.2 FFT: 전투 행동이 인물과 직업을 동시에 성장

```text
세계지도 노드 선택 ── 1구간 이동 = 1일
  ├─ 도시: 구매/판매·병사 고용·소문·파견
  └─ 편성: 직업·능력·장비·저장
                  ↓
이야기 전투 또는 무작위 조우 → 출격 타일 배치
                  ↓
Clock tick: CT 누적 → CT 100 이상인 유닛 AT
                  ↓
이동/행동(순서 자유) → 시전 예약·즉시 효과 → 대기 방향
                  ↓
EXP·현재 직업 JP·아군 JP 공유 → 다음 AT / 예약 효과
                  ↓ 승리
gil·전리품·HP/MP 회복 → 능력 구매·직업 해금
                  ↓
의뢰 기간 경과 시 원래 주점 보고 → 세계지도 반복
```

AP를 모두 써야 하는 라운드제가 아니다. 이동 또는 행동을 생략하면 AT 종료 시 차감되는 CT가 작아 다음 행동이 빨라진다. 파견은 전투를 직접 플레이하는 별도 미니게임이 아니라 일반 병사를 일정 기간 부대에서 빼놓고 보고를 받는 활동이다. [문서][S02 pp.11–14,25–29][FEFFT-FFT18][FEFFT-FFT07]

## 3. 진행 구조

### 3.1 Awakening의 본편 단계

본편 목록은 **Premonition, Prologue, Chapter 1–25, Endgame**이다. 외전은 별도 번호 **1–23**이며, 뒤의 일부는 SpotPass 해금이 필요하다. 목록 수와 실제 세계지도 노드 수는 동일한 개념이 아니다. [문서][FEFFT-FE01][FEFFT-FE27][FEFFT-FE22]

| 시기 | 이야기·기능의 변화 | 전력·준비에서 변하는 점 |
|---|---|---|
| 시작: Premonition–Ch.3 | Robin·Chrom·Lissa·Frederick을 중심으로 기본 명령 습득. Ch.3 완료로 외전 1 | 무기·치유 배분, 초기 상급직 Frederick과 성장 유닛의 사용 비중, Donnel의 레벨업 조건 |
| 초반: Ch.4–11 | Ch.4 뒤 Outrealm Gate. Ch.5/7/9 완료로 외전 2/3/4. Ch.11 끝 Chrom의 강제 결혼 | 인접 협력과 지원점 관리, Seal의 초기 공급, 결혼 상대 선택 마감 |
| 중반: Ch.12–20 | Valm 원정, Ch.13 끝 Lucina, 이후 자녀 외전. Ch.12 상점 Master Seal, Ch.16 상점 Second Seal | 승급·재전직을 반복할 수 있는 공급망, 부모 스킬과 자녀 모집 시점, 이동력·마법·비행 전력의 조합 |
| 후반: Ch.21–Endgame | Plegia와 Grima 사건. Ch.23 Basilio/Flavia. Ch.25 뒤 다운로드 외전 조건 충족 | 고급 무기·강한 적 스킬, 완성된 지원쌍, 최종전 준비 |
| 선택적 심화 | 자녀 육성·Renown·희귀 장비·DLC 재도전·Apotheosis | 본편 완료에 불필요한 극한 능력치·스킬·팀 구성 |

[문서][FEFFT-FE46][FEFFT-FE22][FEFFT-FE21][FEFFT-FE39][FEFFT-FE47]

**난이도 곡선의 읽기:** 전직과 S지원으로 전력이 강화되지만, 외전 개방은 플레이어 레벨에 맞춘 안전 보증이 아니다. 특히 Lunatic 조우전은 위치만이 아니라 진행·전투 횟수·부대 전력 등으로 강해진다. 같은 노가다 루프가 Normal에서는 경제적이고 Lunatic에서는 더 큰 장애물이 될 수 있다. [문서][FEFFT-FE11 §Awakening] [추론][FEFFT-FE19][FEFFT-FE47]

### 3.2 FFT의 본편 단계

FFT 본편은 **4장**이다. PS 영문판 장 제목과 후대 번역은 다르지만 다음의 진행 축은 동일하다. [문서][FEFFT-FFT01 §§Story/Chapters]

| 단계 | 내용·해금 | 시스템 압박 |
|---|---|---|
| Ch.1: The Meager | 사관생도 Ramza, Corpse Brigade와 계급 갈등, 기본 두 직업에서 분기 | 장비·회복·배후 노출·시전 지연을 익히는 구간. 직업 조건을 채우기 위한 초기 JP 투자 |
| Ch.2: The Manipulative and the Subservient | 용병 시기, Ovelia 사건, Agrias·Mustadio, 주점 Proposition 시작 | 임시 Guest와 정식 동료 구분, 파견 공백, 총기와 마법 직업 조합 확대 |
| Ch.3: The Valiant | 교회·성석의 비밀, Orbonne/Riovanes 연전 | 개인 결투와 호위 목표가 범용 파티 육성만으로 해결되지 않는 준비 점검 |
| Ch.4: In the Name of Love | Orlandeau·Meliadoul, Goug 관련 숨은 동료, 최종전 | 강력한 고유 직업, 고급 장비·JP 투자, 놓칠 수 있는 연쇄 이벤트 |
| 선택 심화 | Mullonde 이후 Deep Dungeon, 희귀 밀렵품·의뢰·Wonders | 저Brave 탐색자, Zodiac 습득, 최상위 아이템 수집 |

[문서][FEFFT-FFT01][FEFFT-FFT02][FEFFT-FFT07][FEFFT-FFT15]

**진행과 무작위 전투는 별개다.** 본편은 정해진 이야기 전투를 해결해 진전하고, 무작위 전투를 반복하면 직업/EXP/돈을 더 얻는다. 무작위 조우 적의 레벨은 부대 전력에 연동되므로 인물 레벨만 올리고 장비·능력 구성을 방치하면 안전한 성장 루프라고 보장할 수 없다. 정확한 지역별 생성 범위·확률은 이 문서에서 `[미확인]`이다. [문서][FEFFT-FFT89 §Final Fantasy Tactics][FEFFT-FFT90 §Final Fantasy Tactics] [추론][FEFFT-FFT18]

## 4. 경제 시스템

### 4.1 Awakening의 자원과 거래

| 자원 | 획득 | 소비·역할 | 구체 예 |
|---|---|---|---|
| Gold(G) | 적 드롭·상자·마을·Bullion 판매·조우 보상 | 무기/아이템 구매, 연성, 영령 고용 | Bullion S/M/L 판매액 1,000/5,000/10,000G |
| 무기·지팡이 사용 횟수 | 상점·드롭·이벤트·희귀 보상 | 공격·지팡이 사용으로 고갈, 0이면 파손 | Iron Sword 40회/520G, Steel Sword 35회/840G |
| EXP | 전투·지팡이·춤 등 | 100에서 레벨업; 통화처럼 직접 배분하지 않음 | Veteran은 Pair Up 상태 EXP ×1.5 |
| Weapon EXP | 무기 전투·지팡이 사용 | 무기 등급 해금, 지출하지 않는 누적치 | E→D 30, D→C 40, C→B 50, B→A 60 WExp |
| Seal | 상점·상자·Renown·외전 | 전직 1회에 1개 | Master/Second Seal 각 2,500G |
| Renown | 본편/조우 각 10, SpotPass/StreetPass 격파·고용 50 | 임계값 보상; **수령해도 감소하지 않음** | 100 Second Seal, 1,000 Bullion L, 50,000 Boots |
| 지원점 | 전투 협력·대화·춤·지팡이 등 | 관계 단계 조건; 직접 지출하지 않음 | 맵별 상한과 결혼 조건은 §5 |

[문서][FEFFT-FE28][FEFFT-FE58][FEFFT-FE02][FEFFT-FE20][FEFFT-FE26][FEFFT-FE47]

- **휴대 한도:** 각 유닛 인벤토리는 무기와 도구를 합쳐 **5칸**이다. 여러 무기는 동시에 목록에 둘 수 있지만 실제 공격은 현재 선택한 무기와 직업/숙련 조건을 따른다. 준비 메뉴에서 유닛 간 교환·장비 정리를 하고 공용 수송대와 주고받는다. [문서][FEFFT-FE60][S01 §§7,12]
- **가격:** 일반 판매는 Worth의 **1/2**, 특수 품목 일부는 **1/4**이다. 표의 Worth를 판매액으로 그대로 읽으면 안 된다. Reeking Box는 Normal **500G**, Hard 이상 **4,800G**로 조우전 소환 비용이 달라진다. [문서][FEFFT-FE28][FEFFT-FE58]
- **치유품:** Vulnerary는 **3회, 회당 10HP, 300G**, Concoction은 **3회, 20HP, 600G**, Elixir는 **3회, 전체 HP, 900G**. HP Tonic은 다음 전투 종료까지 최대 HP **+5**, 다른 능력 Tonic은 해당 능력 **+2**, 각 **150G**다. [문서][FEFFT-FE28]
- **지팡이:** Heal E/30회/600G, Mend D/20회/1,000G, Physic C/10회/1,800G. Rescue는 E/5회/1,280G이고 `1~floor(Mag/2)` 범위의 아군을 사용자 인접 칸으로 옮긴다. Hammerne는 B/1회/2,000G로 아군 무기나 지팡이를 완전 수리한다. 이 자료에서 Heal·Mend의 정확한 회복 상수는 `[미확인]`이다. [문서][FEFFT-FE59]
- **상점 잠금:** 완료 장소의 상점은 전투 외에 이용하지만 Risen 또는 보너스 팀이 점유하면 일반 상점에 바로 접근하지 못한다. 등장한 행상인은 해당 지점 상품에 추가 희귀 물품을 보탠다. [문서][FEFFT-FE21][FEFFT-FE31]

### 4.2 Awakening 연성(Forge)

판매가치가 있는 대부분의 무기에 **Mt/Hit/Crit**를 올리고 이름을 붙인다. Mire는 예외로 연성할 수 없다. 각 능력은 **5단계**, 한 무기의 총 투자는 **8단계**, 연성 Crit 자체의 상한은 **50**이다. **수리는 별도**이며 연성 가격은 남은 내구도가 아니라 **완전한 무기의 Worth**를 사용한다. [문서][FEFFT-FE09][FEFFT-FE33 §Awakening]

| 투자 단계 | Mt 증가 | Hit 증가 | Crit 증가 | 해당 항목의 누적 가격 |
|---:|---:|---:|---:|---:|
| 1 | +1 | +5 | +3 | Worth ×0.5 |
| 2 | +2 | +10 | +6 | Worth ×1.5 |
| 3 | +3 | +15 | +9 | Worth ×3 |
| 4 | +4 | +20 | +12 | Worth ×5 |
| 5 | +5 | +25 | +15 | Worth ×7.5 |

[문서][FEFFT-FE09]

**예:** Steel Sword(840G)에 Mt +2, Hit +15, Crit +3은 투자 `2+3+1=6`단계, 가격은 `(1.5+3+0.5)×840=4,200G`다. 세 능력에 전부 5단계를 넣는 것은 합계 15이므로 불가능하다. [문서: 원문의 예][FEFFT-FE09] [추론: 한도 적용][FEFFT-FE09]

**인플레이션 억제의 성격:** 소모성 무기, Seal, 고가 연성이 반복 지출을 만든다. 그러나 무한 성장과 반복 DLC를 막는 절대적 경제 균형은 아니다. Golden Gaffe는 돈, EXPonential Growth는 EXP, Infinite Regalia는 희귀 무기를 반복 공급한다. 따라서 '인플레이션 방지 시스템이 있다'보다 **고정 가격·소모품 경제에 반복 획득 수단이 공존한다**고 읽어야 한다. [추론][FEFFT-FE09][FEFFT-FE28][FEFFT-FE39][FEFFT-FE54]

### 4.3 FFT의 자원·장비 경제

| 자원 | 주요 획득 | 소모 또는 지속 규칙 |
|---|---|---|
| gil | 전투 완료 보너스·전리품 판매·의뢰·Steal Gil 등 | 상점·병사 고용·의뢰 비용·닌자 투척품·소모품 |
| EXP | 유효한 행동 | 100마다 인물 레벨 상승, 최대 Lv99 |
| 직업별 JP | 유효 행동·동료 공유·의뢰 | 그 직업의 능력 구매. 현재 보유량과 직업 성장 누적치를 구분 |
| HP/MP | 장비와 직업·성장, 전투 내 회복 | HP0은 KO, 마법은 MP 소비; 생존자는 전투 후 HP/MP 회복 |
| 장비 | 상점·훔치기·보물·전리품·밀렵점 | 통상 공격의 FE식 내구도는 없지만 파괴/도난/투척/Draw Out 손실 가능 |
| Brave/Faith | 고유 시작치·대화·능력 | 돈이 아니라 전투 성능과 이탈에 연결된 수치 |

[문서][S02 pp.13,25–35][FEFFT-FFT18][FEFFT-FFT23][FEFFT-FFT26][FEFFT-FFT34][FEFFT-FFT35]

**장비 슬롯:** 오른손·왼손·머리·몸·액세서리 구조이고, 직업 또는 Equip 계열 능력이 장비 가능 종류를 결정한다. 일반 갑옷은 FE의 Def처럼 피해에서 고정 수치를 빼는 장비가 아니라 **최대 HP/MP, 능력, 속성, 상태 저항** 등을 제공한다. 방패·망토는 별도 회피 판정이다. [문서][S02 pp.30–32][FEFFT-FFT18][FEFFT-FFT54]

**상점은 생산·공급망 시뮬레이션이 아니다.** 진행과 도시 종류에 따라 품목이 열리고 Buy/Sell/Fitting으로 장비를 맞춘다. 예를 들어 Chemist용 총은 Ch.2 Goug에서 구매할 수 있다. 병사에게 정기 급료·식량을 지불하는 체계는 이 매뉴얼에 없으며, 고용 비용과 반복 소모품 비용을 정기 유지비로 해석하지 않는다. [문서][S02 pp.28–29][FEFFT-FFT20][FEFFT-FFT57] [추론: 경제 분류][S02 pp.25–29]

**회복을 돈으로 확정화:** Chemist의 Potion/Hi-Potion/X-Potion은 **30/70/150HP**, Ether/Hi-Ether는 **20/50MP**를 회복한다. 아이템은 해당 능력을 먼저 JP로 배워야 하며, 일반 마법과 달리 Brave/Faith·별자리 궁합에 회복량이 좌우되지 않는다. Auto Potion은 보유한 가장 낮은 단계의 포션을 사용한다. [문서][FEFFT-FFT20][FEFFT-PS02]

**밀렵:** Thief의 Secret Hunt/Poach를 장착한 **통상 Attack의 마무리 타격**으로 몬스터를 죽이면 시체를 보물상자/크리스털로 남기지 않고 밀렵품 공급으로 바꾼다. Fur Shop/Poachers' Den에서 몬스터별 대응 아이템을 구매하며, 일반/희귀 결과가 구분된다. 아군 몬스터도 대상이고 번식으로만 얻는 종도 있다. 이는 자동 농장 생산이 아니라 모집→번식→전투에서 밀렵→구매의 루프다. 밀렵점은 Ch.3부터 거래 도시에 열리고, 일반/희귀 결과는 **7/8 대 1/8**이다. 몬스터 레벨로 희귀 확률을 올리지는 않는다. [문서][FEFFT-FFT44][FEFFT-FFT01 §Recruitable monsters and poaching]

### 4.4 FFT Proposition/Errand의 완전한 처리 흐름

1. **Ch.2부터 주점에서 의뢰를 수락**한다. 정보료/비용을 지불하고, **일반 인간 유닛 1–3명**을 보낸다. Ramza·고유 이야기 인물·몬스터는 파견할 수 없다. [문서][FEFFT-FFT07]
2. 제시된 범위에서 파견 일수를 정한다. 예를 들어 **11–13일**짜리면 더 긴 기간이 더 큰 보상을 준다. 파견된 사람은 돌아올 때까지 전투 편성에서 빠진다. [문서][FEFFT-FFT07][S02 p.27]
3. 세계지도의 구간 이동으로 시간이 경과한다. 필요한 기간이 지난 뒤 **의뢰를 수락한 동일 주점**에서 보고받아야 한다. [문서][S02 pp.25–27][FEFFT-FFT07]
4. 성공은 정상 보상과 보너스·연쇄 의뢰 해금, 실패는 감소한 보상과 미완료 상태를 만든다. 실패한 의뢰는 **한 달 뒤 재수락** 가능하며 영구 실패로 고정되지 않는다. 대실패 보상은 원문의 표현상 통상량의 약 **1/20**이다. [문서][FEFFT-FFT07]
5. 성공률/지급량은 인원, 레벨, 직업, Brave/Faith, 기간, 의뢰 종류의 영향을 받는다. '적성 직업(skill saver)'이 성공에 유리하더라도 JP 보상의 최댓값을 보장하지는 않는다. 정확한 가중치 전체식은 `[미확인]`이다. [문서][FEFFT-FFT07]

| 실제 의뢰 예(PS 이름) | 주점 | 기간 | 비용 | 보너스 |
|---|---|---:|---:|---|
| Bandits | Dorter | 11–13일 | 600gil | 돈주머니 |
| Miner's Tale | Gariland | 8–11일 | 600gil | 광석 |
| The Hindenburg | Zaland | 8–15일 | 100gil | 돈주머니 |

[문서][FEFFT-FFT07 §Chapter 2]

**보상 롤의 시점:** 돈주머니/광석 등의 등급은 보고할 때 결정된다. Wonders/Artefacts는 등급 없는 수집 보상이다. 의뢰 JP는 JP Boost의 영향을 받지 않는다. [문서][FEFFT-FFT07][FEFFT-FFT71]

## 5. 캐릭터/파티 시스템

### 5.1 Awakening 모집 목록

자동 합류도 존재하지만 지도 위 적·NPC를 **Chrom으로 대화**해야 하는 인물은 죽이면 영입할 수 없다. 아래는 기본 세대의 모집 조건을 축약한 전체 목록이다. 자녀와 배포 외전은 별도 표를 본다. [문서][FEFFT-FE46]

| 시점 | 합류 인물·조건 |
|---|---|
| Premonition/Prologue | Robin, Chrom; Prologue에서 Lissa, Frederick |
| Ch.1 | Sully, Virion: 2턴 자동 |
| Ch.2 | Stahl, Vaike; Miriel: 2턴 자동 |
| Ch.3 | Sumia; Kellam: NPC에게 Chrom 대화 |
| 외전 1 | Donnel: 해당 맵에서 레벨을 올리고 완료 |
| Ch.4 | Lon'qu: 완료 시 |
| Ch.5 | Ricken, Maribelle |
| Ch.6 | Panne: 2턴 자동; Gaius: 적에게 Chrom 대화 |
| Ch.7 | Cordelia: 3턴 자동 |
| Ch.8 | Gregor, Nowi |
| Ch.9 | Libra: NPC, Tharja: 적; 각각 Chrom 대화 |
| 외전 4 | Anna: NPC에게 Chrom 대화. 외전 2의 Anna 구조와 정식 모집은 별개 |
| Ch.11 | Olivia |
| Ch.12 | Cherche |
| Ch.13 | Henry; Lucina: 완료 시 |
| Ch.15 | Say'ri: NPC에게 Chrom 대화 |
| 외전 17 | Tiki: 완료 시 |
| Ch.23 | Basilio, Flavia: Validar 격파 뒤 자동 |

[문서][FEFFT-FE46]

### 5.2 Awakening 성장·재전직·상한

- **성장:** 100EXP에서 레벨업하고 능력별 성장률로 수치가 오른다. 현재 직업에 따른 성장률과 개인의 성장률을 구분한다. 예를 들어 Lord Chrom의 전체 성장률은 HP/Str/Mag/Skl/Spd/Lck/Def/Res 순서로 **85/60/10/60/60/70/45/25%**다. 이는 매번 그만큼의 능력을 확정 지급한다는 뜻이 아니다. [문서][S01 §14][FEFFT-FE51]
- **레벨 상한:** 일반 하급/상급직은 각각 **20**, Villager·Dancer·Taguel·Manakete·Lodestar·Conqueror·Dread Fighter·Bride 같은 특수직은 **30**이다. 각 클래스의 능력 상한도 있어 현재 직업의 상한에 도달한 능력은 그 직업에서 더 오르지 않는다. [문서][FEFFT-FE18][FEFFT-FE19][FEFFT-FE15][FEFFT-FE63]
- **Master Seal:** 하급직 **Lv10 이상**에서 대응 상급직으로 승급, 표시 레벨 **1**로 초기화한다. Lord/Tactician은 각각 Great Lord/Grandmaster로 단일 승급이고 대다수 일반직은 두 갈래다. [문서][FEFFT-FE19][FEFFT-FE15]
- **Second Seal:** 하급직 **Lv10 이상** 또는 상급직 **어느 레벨**에서 허용된 하급직으로 재전직한다. 상급직 **Lv10 이상**, 특수직 **Lv30**에서는 대응 상급직으로도 이동할 수 있다. 현재 직업 최대 레벨에서는 같은 직업으로 다시 시작할 수도 있다. [문서][FEFFT-FE19]
- **능력 보존:** 전직 시 능력 변화는 새 직업과 이전 직업의 기본치 차이이며 Luck은 바뀌지 않는다. 배운 스킬·기존 무기 EXP는 기억한다. 새 무기 종류는 E에서 시작하고 현재 직업이 못 쓰는 무기는 사용할 수 없다. [문서][FEFFT-FE19]
- **개인 직업군:** 대부분 고정 후보군을 가진다. Chrom은 Lord/Cavalier/Archer, Donnel은 Villager/Fighter/Mercenary, Cordelia는 Pegasus Knight/Mercenary/Dark Mage다. Robin은 성별에 허용된 모든 일반직으로 재전직하지만 Lord·Dancer·Villager·종족 전용직 등을 자유 획득하지는 않는다. [문서][FEFFT-FE30]

**숨은 내부 레벨:**

```text
승급 가산 P = 상급직이면 20, 아니면 0
Second Seal 사용 시 누적 C += floor((사용 직전 표시 Lv + P - 1)/2)
내부 레벨 = 새 표시 Lv + 새 P + C
C 상한 = Normal 20 / Hard 30 / Lunatic 및 Lunatic+ 50
```

내부 레벨은 경험치 획득량을 낮추는 성장 이력이다. Master Seal 자체는 C를 더하지 않는다. 예를 들어 Lv15 Donnel이 Second Seal로 Lv1 Mercenary가 되면 `C=7`, 내부 레벨은 **8**이며, 이후 Lv1 Hero로 승급하면 **28**이다. 원문 뒤쪽 Hero 예제의 중간 전개는 `-1` 표기가 빠져 있지만 버림 결과는 같으며, 위 식은 명시된 공식 행을 따른다. [문서][FEFFT-FE02 §Internal Level]

### 5.3 Awakening 전체 직업·승급·스킬

기본직의 스킬은 **Lv1/Lv10**, 상급직은 **Lv5/Lv15**, 특수직은 **Lv1/Lv15**에 배운다. 아래의 `전→후`는 학습 순서이며 스킬 이름의 상세 효과는 이어지는 스킬 사전에서 다룬다. Priest/Cleric과 War Monk/War Cleric은 성별 명칭을 합쳤고 Lord의 성별 변형도 하나의 계통으로 표시한다. [문서][FEFFT-FE15][FEFFT-FE20]

| 기본직 | 무기 / Move | 승급 선택 | 스킬 Lv1 → Lv10 |
|---|---|---|---|
| Lord | 검 /5 | Great Lord | Dual Strike+ → Charm |
| Tactician | 검·마도서 /5 | Grandmaster | Veteran → Solidarity |
| Cavalier | 검·창 /7 | Paladin, Great Knight | Discipline → Outdoor Fighter |
| Knight | 창 /4 | General, Great Knight | Defence +2 → Indoor Fighter |
| Myrmidon | 검 /5 | Swordmaster, Assassin | Avoid +10 → Vantage |
| Mercenary | 검 /5 | Hero, Bow Knight | Armsthrift → Patience |
| Fighter(남) | 도끼 /5 | Warrior, Hero | HP +5 → Zeal |
| Barbarian(남) | 도끼 /5 | Berserker, Warrior | Despoil → Gamble |
| Archer | 활 /5 | Sniper, Bow Knight | Skill +2 → Prescience |
| Thief | 검 /5 | Assassin, Trickster | Locktouch → Movement +1 |
| Pegasus Knight(여) | 창 /7 | Falcon Knight, Dark Flier | Speed +2 → Relief |
| Wyvern Rider | 도끼 /7 | Wyvern Lord, Griffon Rider | Strength +2 → Tantivy |
| Mage | 마도서 /5 | Sage, Dark Knight | Magic +2 → Focus |
| Dark Mage | 마도서·암흑 /5 | Sorcerer, Dark Knight | Hex → Anathema |
| Priest/Cleric | 지팡이 /5 | Sage, War Monk/War Cleric | Miracle → Healtouch |
| Troubadour(여) | 지팡이 /7 | Valkyrie, War Cleric | Resistance +2 → Demoiselle |

[문서][FEFFT-FE15][FEFFT-FE29][FEFFT-FE30][FEFFT-FE20]

| 상급직 | 무기 / Move | 스킬 Lv5 → Lv15 |
|---|---|---|
| Great Lord | 검·창 /6 | Aether → Rightful King |
| Grandmaster | 검·마도서 /6 | Ignis → Rally Spectrum |
| Paladin | 검·창 /8 | Defender → Aegis |
| Great Knight | 검·창·도끼 /7 | Luna → Dual Guard+ |
| General | 창·도끼 /5 | Rally Defence → Pavise |
| Swordmaster | 검 /6 | Astra → Swordfaire |
| Assassin | 검·활 /6 | Lethality → Pass |
| Hero | 검·도끼 /6 | Sol → Axebreaker |
| Bow Knight | 검·활 /8 | Rally Skill → Bowbreaker |
| Warrior | 도끼·활 /6 | Rally Strength → Counter |
| Berserker | 도끼 /6 | Wrath → Axefaire |
| Sniper | 활 /6 | Hit Rate +20 → Bowfaire |
| Trickster | 검·지팡이 /6 | Lucky Seven → Acrobat |
| Falcon Knight | 창·지팡이 /8 | Rally Speed → Lancefaire |
| Dark Flier | 창·마도서 /8 | Rally Movement → Galeforce |
| Wyvern Lord | 창·도끼 /8 | Quick Burn → Swordbreaker |
| Griffon Rider | 도끼 /8 | Deliverer → Lancebreaker |
| Sage | 마도서·지팡이 /6 | Rally Magic → Tomefaire |
| Sorcerer | 마도서·암흑 /6 | Vengeance → Tomebreaker |
| Dark Knight | 검·마도서 /8 | Slow Burn → Lifetaker |
| War Monk/War Cleric | 도끼·지팡이 /6 | Rally Luck → Renewal |
| Valkyrie | 마도서·지팡이 /8 | Rally Resistance → Dual Support+ |

[문서][FEFFT-FE15][FEFFT-FE29][FEFFT-FE20]

| 특수직 | 무기 / Move | 진입·전직 경계 | Lv1 → Lv15 |
|---|---|---|---|
| Villager | 창 /5 | Donnel 및 해당 남자 자녀; 승급 없음 | Aptitude → Underdog |
| Dancer | 검 /5 | Olivia 전용, 계승 불가 | Luck +4 → Special Dance |
| Taguel | Beaststone /6 | Panne/Yarne 계통, Morgan 계승 가능 | Even Rhythm → Beastbane |
| Manakete | Dragonstone /6 | Nowi/Nah/Tiki 계통, Morgan 계승 가능 | Odd Rhythm → Wyrmsbane |
| Lodestar | 검 /6 | Marth 영령, 일반 Seal로 획득 불가 | 클래스 학습 스킬 없음 |
| Conqueror | 검·창·도끼 /8 | Walhart, 일반 계승 불가 | 클래스 학습 스킬 없음; Conquest는 별도 고유 스킬 |
| Dread Fighter | 검·도끼·마도서 /6 | 남성, Dread Scroll 사용 | Resistance +10 → Aggressor |
| Bride | 창·활·지팡이 /6 | 여성, Wedding Bouquet 사용 | Rally Heart → Bond |

[문서][FEFFT-FE18][FEFFT-FE29][FEFFT-FE30][FEFFT-FE20]

**비플레이어 직업:** Soldier(창/Move5), Merchant(창/5), Revenant(발톱/5), Entombed(발톱/6), Grima(브레스/0), Mirage(외전의 복제용 존재)가 있다. Outrealm Class는 DLC 미설치 시 표시용 클래스다. 이것들을 플레이어 승급 선택지로 세지 않는다. [문서][FEFFT-FE18][FEFFT-FE15]

### 5.4 Awakening 스킬 사전

동시에 활성화 가능한 스킬은 **5개**이고 전투 밖에서 바꾼다. 공격 발동 스킬을 여럿 장착해도 한 타격에 전부 중첩 발동하는 것이 아니다. 우선순위는 **Lethality > Aether > Astra > Sol > Luna > Ignis > Vengeance**다. 공격 스킬을 계산한 뒤 치명타, 그 뒤 방어측 감소 스킬을 적용하는 구별이 있다. [문서][FEFFT-FE20][FEFFT-FE02]

| 분류 | 스킬과 정확한 효과 |
|---|---|
| 성장·소모 | Veteran: Pair Up EXP ×1.5. Discipline: WExp ×2. Armsthrift: `Luck×2%`로 공격 시 내구도 무소모. Aptitude: 모든 성장률 +20%p. Despoil: 처치 시 `Luck%`로 Bullion S |
| 기본 수치 | HP +5, Str/Mag/Skl/Spd/Def/Res +2, Luck +4, Avoid +10, Hit Rate +20, Zeal Crit +5는 이름 그대로. Gamble은 Hit -5/Crit +10 |
| 근접·범위 오라 | Charm: 반경 3칸 아군 Hit/Avoid +5. Solidarity: 인접 아군 Crit/Crit Avoid +10. Hex: 인접 적 Avoid -15. Anathema: 3칸 적 Avoid/Crit Avoid -10. Demoiselle: 3칸 남성 아군 Avoid/Crit Avoid +10 |
| 위치·페이즈 | Outdoor/Indoor Fighter: 해당 환경 Hit/Avoid +10. Patience: 적 페이즈 +10. Prescience: 자기 페이즈 +15. Tantivy: 3칸에 아군 없으면 +10. Focus: 3칸에 아군 없으면 Crit +10 |
| 시간·체력 조건 | Lucky Seven: 7턴까지 Hit/Avoid +20. Quick Burn: 첫 턴 +15에서 턴마다 감소. Slow Burn: 턴마다 +1, 15턴까지 증가. Wrath: HP 절반 미만 Crit +20. Vantage: HP 절반 미만, 적이 건 전투에서 선공. Odd/Even Rhythm: 홀수/짝수 턴 Hit/Avoid +10 |
| 무기 강화 | Sword/Lance/Axe/Bow/Tomefaire: 해당 무기 사용 시 공격에 쓰는 Str 또는 Mag +5. Sword/Lance/Axe/Bow/Tomebreaker: 적이 해당 무기 사용 시 Hit/Avoid +50 |
| 공격 발동 | Lethality `Skl/4%`: 즉사. Aether `Skl/2%`: Sol 타격→Luna 타격. Astra `Skl/2%`: 절반 피해 5연타. Sol `Skl%`: 준 피해의 절반 회복. Luna `Skl%`: Def/Res 절반 무시. Ignis `Skl%`: 반대 공격 능력의 절반 가산. Vengeance `Skl×2%`: 잃은 HP의 절반 추가 피해 |
| 방어 발동 | Pavise `Skl%`: 검·창·도끼·Beaststone 계열 피해 절반. Aegis `Skl%`: 활·마도서·Dragonstone 피해 절반. Miracle `Luck%`: HP가 1보다 클 때 치사 피해를 받아도 HP1 생존 |
| 전투 후·턴 시작 | Lifetaker: 자기 페이즈에 처치 후 최대HP 50% 회복. Renewal: 자기 턴 시작 30% 회복. Relief: 3칸 안에 아무 유닛도 없으면 턴 시작 20% 회복. Healtouch: 지팡이 회복량 +5 |
| 행동·이동 | Galeforce: 자기 페이즈 처치 후 재행동, 사용자당 턴 1회. Movement +1. Deliverer: Pair Up 시 Move +2. Pass: 적 점유 칸 통과. Acrobat: 통과 가능한 지형 비용 1. Locktouch: 열쇠 없이 문·상자 열기 |
| 협력 | Dual Strike+/Dual Guard+: 각각 확률 +10%p. Dual Support+: 지원 랭크 +4. Defender: Pair Up 시 HP/Move 제외 기본 능력 +1. Rightful King: 스킬 발동률 +10%p |
| 특수 | Counter: 인접 적에게 받은 피해 반사, 사용자가 죽는 피해는 제외. Beastbane/Wyrmsbane: 해당 변신 직업에서 짐승/드래곤 특효. Underdog: 자기 유효 레벨이 적보다 낮으면 Hit/Avoid +15, 상급직은 Lv+20. Special Dance: 춤을 받은 유닛 Str/Mag/Def/Res +2, 1턴 |
| 개인 전용 | Shadowgift: 마도서 사용 가능 직업에서 암흑 마도서 허용. Conquest: 사용자 짐승·중갑 약점 무효 |

[문서][FEFFT-FE20][FEFFT-FE23]

**Rally 계열:** 명령 한 번에 활성화한 모든 Rally가 발동하고, 반경 **3칸**, **1턴** 지속한다. Str/Mag/Skl/Spd/Def/Res는 각각 **+4**, Luck은 **+8**, Move는 **+1**, Spectrum은 HP/Move를 제외한 7능력 **+4**다. 같은 Rally끼리는 중첩하지 않지만 Spectrum·Heart와는 중첩한다. [문서][FEFFT-FE20]

**DLC 스킬 전체:** Resistance +10, Aggressor(자기 페이즈 공격 +10), Rally Heart(7능력 +2/Move +1), Bond(턴 시작 3칸 아군 HP10 회복), All Stats +2(7능력 +2), Paragon(EXP ×2), Iote's Shield(비행 약점 무효), Limit Breaker(7능력 상한 +10). Outrealm Skill은 DLC 미설치 표시다. 이 스킬들과 DLC 클래스 학습 스킬은 자녀에게 계승하지 못한다. [문서][FEFFT-FE20][FEFFT-FE05]

**적 전용:** Dragonskin은 피해 절반과 Counter/Lethality 무효, Hit Rate +10, Grima의 Rightful God(발동률 +30%p), Lunatic+의 Hawkeye/무조건 Vantage·Luna 및 Aegis+/Pavise+가 존재한다. Counter·Pavise·Aegis 계열은 Dual Strike에 같은 식으로 적용되지 않는 예외가 있으므로 평범한 선두 공격과 지원 공격을 분리한다. [문서][FEFFT-FE20][FEFFT-FE02]

### 5.5 Awakening 지원·결혼

**단계:** 무지원→C→B→A→S. A까지 여러 사람과 맺을 수 있지만 **S는 한 명**, 성별이 반대이며 형제·부모자녀 관계는 제외한다. 영령·다른 플레이어의 게스트 Robin은 지원을 맺지 않는다. [문서][FEFFT-FE47][FEFFT-FE24]

| 지원점 행동 | 점수 |
|---|---:|
| 지원 유닛과 전투(동일 칸 포함) | +6/9 |
| 지원자가 아닌 인접 동료와 함께 전투 | +2/9 |
| 지팡이·춤 | +2/9 |
| Dual Strike 또는 Guard 발동 | +2/9 |
| Pair Up 이벤트 타일 / 병영 대화 / Seed of Trust | 각각 +1 |

[문서][FEFFT-FE47]

맵 종료 시 가장 가까운 정수로 정리하고 한 쌍은 보통 **맵당 최대 3점**이다. 한 사람이 여러 상대와 쌓았다면 두 번째 쌍은 최대 **2**, 세 번째는 **1**, 그 뒤는 **0**으로 제한한다. 동률은 게임 지원 목록 순서가 우선한다. 이벤트 타일/Seed 점수는 이 제한의 예외다. Casual에서 한 명이 쓰러지면 그 쌍이 해당 맵에서 쌓은 점수를 잃는다. [문서][FEFFT-FE47]

누적 임계값은 짝에 따라 다르다. 일반 Robin 이성 지원은 C/B/A/S **4/8/13/18**, 동성은 **3/8/15**, Chrom–Sumia는 **2/6/10/14**, Chrom–Sully·Maribelle는 **3/7/11/16**이다. 'B에 8'은 C 이후 추가 8이 아니라 누적 8이다. [문서][FEFFT-FE48]

**Chrom의 예외:** Ch.11 끝까지 결혼하지 않았다면 지원이 가장 높은 후보와 자동 결혼한다. Olivia와 그 맵에서 반올림 후 2점 이상을 쌓고 다른 후보와 C 이상이 없으면 Olivia 조건이 우선하고, 모든 유효 후보가 이미 결혼했거나 점수가 없으면 이름 없는 마을 처녀가 배우자가 된다. 일반 동률은 다음 단계까지 필요한 점수가 적은 쪽, 다시 동률이면 **Sumia > Sully > Maribelle > 여성 Robin > Olivia**다. [문서][FEFFT-FE47]

### 5.6 Awakening 자녀·외전·계승

**부모와 자녀가 동시에 존재한다.** 부모 장비가 자녀에게 이동하거나 부모가 퇴장하는 세대교체가 아니다. 보통 어머니가 자녀 정체를 결정하고 아버지가 머리색에 영향을 준다. Lucina는 Chrom의 고정 딸, Morgan은 Robin의 고정 자녀이며 **성별은 Robin의 반대**다. Lucina의 머리색은 고정이다. [문서][FEFFT-FE05][FEFFT-FE14 §Awakening]

| 자녀 | 고정 부모 | 시점·외전 | 모집 조건 |
|---|---|---|---|
| Lucina | Chrom | Ch.13 종료 | 자동 |
| Owain | Lissa | 외전5 | Chrom 또는 Lissa 대화 |
| Inigo | Olivia | 외전6 | Chrom 또는 Olivia 대화 |
| Brady | Maribelle | 외전7 | Chrom 또는 Maribelle 대화 |
| Kjelle | Sully | 외전8 | Chrom 또는 Sully 대화 |
| Cynthia | Sumia | 외전9 | 적 상태에서 Chrom 또는 Sumia 대화 |
| Severa | Cordelia | 외전10 | Severa가 적 Villager Holland와 대화하도록 호위 |
| Gerome | Cherche | 외전11 | Chrom 또는 Cherche 대화 |
| Morgan | Robin | 외전12 | Chrom 또는 Robin 대화 |
| Yarne | Panne | 외전13 | NPC/적, Chrom 또는 Panne 대화 |
| Laurent | Miriel | 외전14 | Chrom 또는 Miriel이 남서 마을 방문 |
| Noire | Tharja | 외전15 | 2턴 자동 |
| Nah | Nowi | 외전16 | Chrom 또는 Nowi 대화 |

[문서][FEFFT-FE46][FEFFT-FE05]

자녀 외전은 **Ch.13 이후 부모 결혼**으로 열리지만 연결 경로도 필요하다. 쉬운 접근 경로 기준 외전5·6은 Ch.15, 외전7은 Ch.16, 외전11은 Ch.17 접근이 필요하고 외전9는 외전17/5/10 중 연결을 확보해야 한다. 따라서 결혼했다고 당장 모든 자녀를 모집할 수 있는 것은 아니다. [문서][FEFFT-FE22]

**계승 확정:** 자녀 모집 외전에 들어가는 시점에 부모 상태와 **각 부모 활성 스킬 목록의 마지막 스킬**을 반영한다. Lucina는 Ch.13 종료 시점이다. 나중에 외전을 다시 들어가 계승을 자유 갱신하는 FE Fates의 규칙을 적용하면 안 된다. [문서][FEFFT-FE05][FEFFT-FE14]

```text
자녀 개인 성장률 = (아버지 기본 성장률 + 어머니 기본 성장률 + 자녀 고유 성장률) / 3
자녀 능력 상한 보정 = 아버지 보정 + 어머니 보정 + 1
  단, 다른 자녀를 부모로 둔 Morgan은 마지막 +1 없음
자녀 개인 기본치 = (아버지 개인치 + 어머니 개인치 + 자녀 개인치) / 3
```

성장·개인치 평균과 **클래스 기본치**를 혼동하지 않는다. 기본치의 전직 보정·자동 레벨·정수 처리 전체 순서는 열람한 요약 표만으로 완전히 복원되지 않아 `[미확인]`으로 둔다. 상한 보정 예로 부모 Spd 보정이 +2/+3이면 보통 자녀는 **+6**이다. [문서][FEFFT-FE14 §Calculations] [추론: 상한 계산 예][FEFFT-FE14]

**스킬 예외:** Chrom의 딸은 Aether, 아들은 Rightful King을 고정 계승하며 Chrom이 아직 안 배웠어도 적용된다. 자녀가 직접 갈 수 없는 성별 직업의 스킬도 전달 가능하므로 어머니의 **Galeforce를 아들에게** 줄 수 있다. Special Dance와 DLC 스킬은 불가. Robin–Aversa/Walhart의 Morgan은 Shadowgift/Conquest를 전달받는 고유 예외가 있다. [문서][FEFFT-FE05][FEFFT-FE14]

**직업 계승:** 성별 허용 범위에서 양쪽 일반 직업군을 합친다. Lord는 Lucina만, Dancer/Conqueror는 불가. Villager는 남자 자녀, Taguel/Manakete는 Morgan에게 전달 가능하다. 성별 때문에 못 넘기는 직업은 정해진 대체 규칙을 쓴다. [문서][FEFFT-FE05][FEFFT-FE30]

| 부모 | 성별 제한에 따른 대체 |
|---|---|
| Vaike | 딸: Fighter/Barbarian → Knight/Mercenary |
| Gaius | 딸: Fighter → Pegasus Knight |
| Donnel | 딸: Villager/Fighter → Pegasus Knight/Troubadour(집합 기준) |
| Gregor, Henry | 딸: Barbarian → Troubadour |
| Lissa | 아들: Pegasus Knight/Troubadour → Myrmidon/Barbarian |
| Miriel | 아들: Troubadour → Barbarian |
| Maribelle | 아들: Pegasus Knight/Troubadour → Cavalier/Priest |
| Olivia | 아들: Dancer/Pegasus Knight → Mercenary/Barbarian(집합 기준) |
| Panne | 아들: Wyvern Rider → Barbarian(원래 양성 직업이어도 이 예외 적용) |
| Cherche | 아들: Troubadour → Fighter; Cleric은 Priest 명칭으로 |

[문서][FEFFT-FE05][FEFFT-FE14]

### 5.7 FFT 부대·모집·직업 성장

**PS 부대 정원은 16**, WotL은 **24**로 확대된다. 고유 인물, 일반 병사, 몬스터가 부대 슬롯을 경쟁한다. 한 전투의 출격 수는 임무별로 정해지며 보통 소수 부대다. 예를 들어 Deep Dungeon 최종전은 Ramza와 4명이며 Guest Byblos는 별도다. '부대 정원 16=매번 16명 출격'이 아니다. [문서][FEFFT-FFT52][FEFFT-FFT15][S02 p.14]

- **일반 병사:** 도시의 Soldier Office에서 고용한다. 일반 인간은 직업을 바꾸고 JP를 배울 수 있다. [문서][S02 pp.28–29]
- **고유 인물:** 이야기 또는 숨은 이벤트로 합류한다. 고유 직업이 Squire 자리를 대체하며 다른 사람에게 그 직업을 넘기지 못한다. Guest 단계에서는 AI가 조작하고 정식 합류하면 플레이어가 편성·조작한다. [문서][FEFFT-FFT02]
- **대표 합류:** Agrias는 Ch.2 Balias Swale, Mustadio는 Ch.2 Goug, Rafa/Malak은 Ch.3 Riovanes, Orlandeau는 Ch.4 Besselat, Meliadoul은 Ch.4 Limberry 후 정식 합류한다. Beowulf·Reis·Construct 8·Cloud는 Goug 연계 선택 이벤트, Byblos는 Deep Dungeon 보상이다. [문서][FEFFT-FFT02][FEFFT-FFT01][FEFFT-FFT15]
- **몬스터:** Mediator Invitation/Train 등으로 영입한다. 장비·다른 직업·JP는 사용하지 않고 종별 명령을 가진다. 시간이 지나 알을 낳고 같은 계통의 다른 등급이 태어날 수 있다. Squire의 Monster Skill을 가진 인접 아군이 추가 몬스터 기술을 열어 준다. 정확한 산란 확률·간격은 혼합 판본 원문이 상충하여 `[미확인]`이다. [문서][FEFFT-FFT01 §Recruitable monsters and poaching][FEFFT-FFT31][FEFFT-FFT19]

**능력 슬롯:** 현재 직업 명령은 고정, 다른 직업 명령군 **1개**, Reaction **1개**, Support **1개**, Movement **1개**를 장착한다. 예를 들어 Knight + Item + Auto Potion + Gained JP Up + Move+1은 장비 파괴·회복·반응 회복·JP 성장·이동 보완을 결합한다. 각 능력은 미리 배워야 하고 '배웠다'와 '장착했다'를 구분한다. [문서][S02 pp.33–35] [추론: 합법적 구성 예][FEFFT-PS01][FEFFT-PS02][FEFFT-PS03]

**EXP:** 유효한 행동의 기본 예는 같은 레벨 대상 **10EXP**, 레벨 차이 1마다 **±1EXP**다. 적만 아니라 아군·자신을 대상으로 한 유효 행동도 대상이다. 이미 최대 HP인 대상의 무의미한 회복은 EXP/JP를 주지 않는다. **100EXP=1레벨, 최대99**이며 레벨업 시 초과분 처리까지 FE와 동일하다고 가정하지 않는다. [문서][FEFFT-FFT18 §§Lv./EXP]

**JP:** 직업별로 따로 저장하고 현재 직업의 능력을 구매한다. 동료 행동의 기본 JP **25%**가 해당 직업 JP로 공유된다. Gained JP Up은 사용자 획득량 **+50%**, 공유분과 Proposition에는 적용되지 않는다. JP 최대 보유량은 직업별 **9,999**. 행동당 JP의 정확한 다항식과 직업 Lv1–8의 누적 JP 임계값은 확보한 위키·매뉴얼에 완전한 표가 없어 `[미확인]`이며 경험식으로 채우지 않는다. [문서][FEFFT-FFT18][FEFFT-FFT71]

**성장 공식:** 숨은 원시 능력치 `R`는 레벨업 때 `floor(R/(C+Lv))`만큼 증가한다. Lv는 상승 전 레벨, C는 해당 직업의 능력별 성장 상수이며 작을수록 성장량이 크다. 직업을 바꾸면 현재 표시는 직업 배율에 따라 바뀌지만 이미 쌓은 원시 능력은 유지된다. 열람한 위키의 MA 표시식 분모는 다른 능력과 불일치하므로 해당 표시 변환식은 확정 공식으로 싣지 않는다. [문서][FEFFT-FFT18 §Stat growth mechanics]

### 5.8 FFT 일반 20직업 해금표

`Lv`는 **인물 레벨이 아니라 해당 직업 레벨**이다. 일본 PS/WotL 조건 열과 북미 PS 조건 열을 합치지 않는다. Move/Jump는 장비·이동 스킬 없는 북미 PS 기본값이다. [문서][FEFFT-FFT02][FEFFT-FFT52][FEFFT-PS01][FEFFT-PS02][FEFFT-PS03][FEFFT-PS04][FEFFT-PS05][FEFFT-PS06][FEFFT-PS07][FEFFT-PS08][FEFFT-PS09][FEFFT-PS10][FEFFT-PS11][FEFFT-PS12][FEFFT-PS13][FEFFT-PS14][FEFFT-PS15][FEFFT-PS16][FEFFT-PS17][FEFFT-PS18][FEFFT-PS19][FEFFT-PS20]

| PS 명칭 (후대 명칭) | 북미 PS 해금 조건 | 일본 PS/WotL 조건 | Move/Jump | 주 명령 |
|---|---|---|---:|---|
| Squire | 처음부터 | 동일 |4/3| Basic Skill |
| Chemist | 처음부터 | 동일 |3/3| Item |
| Knight | Squire2 | 동일 |3/3| Battle Skill |
| Archer | Squire2 | 동일 |3/3| Charge |
| Monk | Knight2 | Knight3 |3/4| Punch Art |
| Priest(White Mage) | Chemist2 | 동일 |3/3| White Magic |
| Wizard(Black Mage) | Chemist2 | 동일 |3/3| Black Magic |
| Time Mage | Wizard2 | Black Mage3 |3/3| Time Magic |
| Oracle(Mystic) | Priest2 | White Mage3 |3/3| Yin Yang Magic |
| Thief | Archer2 | Archer3 |4/4| Steal |
| Mediator(Orator) | Oracle2 | Mystic3 |3/3| Talk Skill |
| Summoner | Time Mage2 | Time Mage3 |3/3| Summon Magic |
| Geomancer | Monk3 | Monk4 |4/3| Elemental |
| Lancer(Dragoon) | Thief3 | Thief4 |3/4| Jump |
| Samurai | Knight3, Monk4, Lancer2 | Knight4, Monk5, Dragoon2 |3/3| Draw Out |
| Ninja | Archer3, Thief4, Geomancer2 | Archer4, Thief5, Geomancer2 |4/4| Throw |
| Calculator(Arithmetician) | Priest4, Wizard4, Time Mage3, Oracle3 | White/Black Mage5, Time Mage/Mystic4 |3/3| Math Skill |
| Bard(남) | Summoner4, Mediator4 | Summoner5, Orator5 |3/3| Sing |
| Dancer(여) | Geomancer4, Lancer4 | Geomancer5, Dragoon5 |3/3| Dance |
| Mime | Squire8, Chemist8, Geomancer4, Lancer4, Mediator4, Summoner4 | 두 기본직8, 나머지 네 직업5 |4/4| Mimic |

**WotL 전용 추가 2직업:** Onion Knight는 Squire6+Chemist6. Dark Knight는 Knight/Black Mage 마스터, Dragoon/Samurai/Ninja/Geomancer 각8, 결정화/상자화로 집계되는 처치 **20**을 요구한다. 이 둘은 PS의 일반 20직업에 포함되지 않으며 Gaffgarion의 PS 'Dark Knight'와도 별개다. [문서][FEFFT-FFT02][FEFFT-FFT17][FEFFT-FFT52]

### 5.9 FFT 직업 운용·JP 학습의 특수 규칙

- **Squire/Chemist:** 초반 두 뿌리. Squire의 Accumulate는 자신 PA 상승으로 유효 행동을 만들고, Chemist는 Item 명령과 개별 도구 학습으로 확정 회복을 맡는다. Gained JP Up **200JP**, Move+1 **200JP**, Potion **30JP**, Phoenix Down **90JP**, Auto Potion **400JP**가 대표 초기 투자다. [문서][FEFFT-PS01][FEFFT-PS02]
- **Knight/Archer/Thief:** Knight는 장비와 능력을 파괴한다. Archer Charge는 공격 강화 대신 시간 지연을 감수한다. Thief는 적 장비·경험치·gil을 빼앗고 Charm은 일시 조종이지 영구 영입이 아니다. Steal Weapon **600JP**, Move+2 **520JP**. [문서][FEFFT-FFT23][FEFFT-FFT24][FEFFT-FFT26][FEFFT-PS10]
- **Monk:** 맨손 공격, 범위 공격, Chakra, 상태 해제, Revive를 MP 없이 사용하지만 범위·고저 조건이 다르다. Chakra **350JP**, Revive **500JP**, Counter **300JP**, Hamedo **1,200JP**. [문서][FEFFT-PS05][FEFFT-FFT25]
- **마법직:** White는 회복·부활·Protect/Shell, Black은 속성·상태·Flare, Time은 CT/시간·중력, Oracle은 상태·흡수·Faith 상태를 다룬다. 일반 마법은 MP·명중·시전 시간이 서로 다른 제약이며 상위 주문이 모든 면에서 하위 주문보다 낫지 않다. [문서][FEFFT-PS06][FEFFT-PS07][FEFFT-PS08][FEFFT-PS09]
- **Mediator:** Talk Skill은 즉시·MP 없음, MA와 궁합에 영향받으며 Faith 계수는 사용하지 않는다. Invitation은 적 영입, Praise/Threaten은 Brave, Preach/Solution은 Faith를 조정한다. Monster Talk를 다른 직업에 장착해야 몬스터에게 Talk Skill을 쓸 수 있다. [문서][FEFFT-FFT31][FEFFT-FFT85]
- **Summoner:** 공격 소환은 적, 지원 소환은 아군을 선택적으로 대상으로 하므로 일반 Black Magic의 아군 오폭과 다르다. **Zodiac/Zodiark는 JP 구매가 아니라 Summoner 상태에서 해당 소환을 맞고 살아남아 학습**한다. 비용 **99MP**, 위력 높은 장기 목표다. [문서][FEFFT-FFT32][FEFFT-FFT86]
- **Lancer:** Jump는 수평/수직 범위를 따로 구매하고 큰 범위가 작은 범위를 포함한다. Level Jump8 **900JP**, Vertical Jump8 **900JP**이므로 작은 범위를 전부 먼저 살 의무가 없다. 이동 능력 Jump+와 공격 명령 Jump 해금은 다르다. [문서][FEFFT-PS14][FEFFT-FFT76]
- **Samurai:** Draw Out은 보유 Katana의 힘을 꺼내며 즉시 발동한다. 피해/회복에 MA를 쓰고 Faith에 의존하지 않는 효과가 많다. 사용 후 해당 검이 부서질 가능성이 있어 기술을 배웠다고 재고 없이 무제한 쓰지 못한다. Blade Grasp **700JP**, Two Hands **900JP**. [문서][FEFFT-FFT34][FEFFT-PS15]
- **Ninja:** 주 직업 자체에 양손 각각 공격이 내장되며 다른 직업은 Two Swords **900JP**를 장착한다. Throw는 재고 무기를 소비하고 `SP×WP` 계열 피해를 낸다. [문서][FEFFT-FFT35][FEFFT-PS16][FEFFT-FFT42]
- **Calculator:** CT/Level/EXP/Height 중 한 기준과 소수/3/4/5의 배수 조건을 선택하고, 이미 배운 계산 가능 마법을 사용한다. **MP·시전시간 없이**, 적아군 구분 없이 조건에 맞는 대상을 때린다. 수학 조건을 배워도 마법을 안 배웠으면 공격 주문이 자동 생기지 않는다. [문서][FEFFT-FFT21][FEFFT-PS17]
- **Bard/Dancer:** 전장 전체 아군/적군에 반복 노래·춤 효과. 각 노래/춤의 충전 속도가 다르다. Bard Move+3 **1,000JP**, 양쪽 Fly **1,200JP**는 북미 PS 비용이다. [문서][FEFFT-PS18][FEFFT-PS19][FEFFT-FFT36][FEFFT-FFT37]
- **Mime:** 일반적인 장비·능력 장착을 포기하고 동료의 행동을 위치·방향에 맞춰 모방한다. 자기 주위 대상에 의도치 않은 효과가 날 수 있으며 모든 고유 명령을 모방하는 것은 아니다. 구매할 개별 능력은 없다. [문서][FEFFT-FFT38][FEFFT-PS20]

**전체 JP 카탈로그는 부록 A**에 실었다. 판본이 뒤섞인 위키의 임의 첫 숫자 대신 PS 모드가 명시된 데이터 표를 기준으로 하며 불일치는 따로 남긴다.

### 5.10 부상·죽음·이탈

| 게임 | HP0 | 영구 손실 경계 | 복구·예외 |
|---|---|---|---|
| FE Classic | 전투 불능과 전력 손실 | 맵을 계속 진행하면 해당 유닛 사용 불가 | 이야기상 살아서 대사에 나오는 인물도 전력으로 복귀한다는 뜻은 아님 |
| FE Casual/Newcomer | 해당 전투에서 퇴각 | 통상 유닛 영구 손실 없음 | 다음 전투 복귀. Chrom/Robin 패배는 여전히 게임오버 |
| FFT | KO, 개인 CT는 계속 진행 | 카운트 소진 후 크리스털/상자화 | 그 전에 Phoenix Down/Raise/Revive 또는 전투 승리로 구출 |
| FFT Guest | KO 가능 | 일반 결정화 없음 | 호위 대상 KO가 즉시 패배 조건이면 유예 없음 |
| FFT 수치 이탈 | Brave/Faith의 영구값에 따라 경고 | Brave≤5, Faith≥95에서 부대 이탈 | Ramza는 이탈하지 않음 |

[문서][S01 §9][FEFFT-FE50][FEFFT-FFT43][FEFFT-FFT13][FEFFT-FFT05]

두 작품 모두 여기서 설명하는 손실은 자유로운 치료 기간·흉터·절단·노화 관리가 아니다. 해당 유형의 지속 부상 시스템은 확인 자료에서 제시되지 않는다. [추론: 규칙 범위][S01 §9][S02 pp.13,17,21]

## 6. 전투 시스템

### 6.1 Awakening 턴·행동·명령

**Player Phase → Enemy Phase → Other Phase(존재할 때)**가 한 주기다. 한 유닛은 기본적으로 이동 한 번과 상황별 행동을 하고 회색으로 바뀐다. 공격자는 먼저 치고, 방어자는 자기 무기 사거리와 상태가 허용하면 반격한다. 속도차와 Brave 무기로 추가 공격할 수 있다. [문서][S01 §§9,11–12][FEFFT-FE02]

| 명령 | 역할·조건 |
|---|---|
| Move/Attack/Wait | 이동 범위에서 위치 선택, 무기·대상 확인, 행동 종료 |
| Staff/Item | 직업·무기 랭크에 맞는 지팡이 또는 휴대 도구 사용 |
| Trade/장비 변경 | 인접 유닛과 물품 교환, 현재 사용할 무기 선택 |
| Pair Up/Switch/Separate/Transfer | 동일 칸 결합, 선두 교대, 인접 칸 분리, 인접 파트너 전달 |
| Talk/Visit/Open | 특정 대상 대화·마을·문·상자 상호작용. Locktouch/열쇠 조건 |
| Dance | Olivia가 아군을 재행동시킴 |
| Rally | 활성 Rally를 묶어서 실행 |
| Auto/End | 자동 행동 방침 또는 남은 아군 행동을 포기하고 적 페이즈 시작 |

[문서][S01 §§7,11–15][FEFFT-FE20][FEFFT-FE46]

**거리 표시:** 이동 파랑, 공격 빨강, 지팡이 초록. 위험 영역은 적 공격을 검토하는 정보다. 3D 전투 애니메이션은 이미 선택한 격자 전투를 표현하며 일인칭/측면/자동 카메라로 바꿀 수 있어도 별도 자유 이동 전투가 되지는 않는다. [문서][S01 §§9,11–12]

### 6.2 Awakening 명중·피해·치명타

각 항목의 분수는 버림한다. 물리 무기는 Str/Def, 마법 무기는 Mag/Res를 사용한다. Levin Sword·Shockstick·Bolt Axe는 외형상 근접 무기여도 마법 계산이다. [문서][FEFFT-FE02]

```text
Atk = Str 또는 Mag + 무기 Mt + 무기랭크 공격 보너스
기본 Hit = 무기 Hit + floor((3×Skl + Luck)/2) + 무기랭크 명중 보너스
기본 Crit = 무기 Crit + floor(Skl/2)
Avoid = floor((3×Spd + Luck)/2)

표시 피해 = Atk + 삼각상성 공격 보정 - (적 Def 또는 Res + 지형 방어 보정)
표시 Hit = 기본 Hit + 삼각상성 Hit + 지원 Hit
           - (적 Avoid + 지형 Avoid + 적 지원 Avoid)
표시 Crit = 기본 Crit + 지원 Crit - (적 Luck + 적 지원 Crit Avoid)
```

실전은 스킬·특효·상태에 의해 수정된다. 특효는 **무기 Mt를 3배** 하고, 치명타는 **계산된 피해를 3배** 한다. 둘 다 '최종 공격력 3배'가 아니다. [문서][FEFFT-FE02]

**추가 공격:** `자기 Spd - 적 Spd ≥ 5`면 추격. 기본 순서는 공격자→반격자→추격자다. Brave는 자신의 각 공격 기회를 연속 2타로 만들어 추격과 결합하면 최대 **4타**이며 Astra가 각 타격에 발동하면 더 늘어난다. [문서][FEFFT-FE02]

**계산 예:** Str20, Skl20, Luck10, Spd20, C검 Iron Sword(Mt5/Hit95), 적 Def12/Avoid25/Luck8, 상성·지원 없음이면 `Atk=20+5+1=26`, 피해 **14**, 기본 Hit `95+35=130`, 상대 회피 차감 전후 Hit는 130/105다. 실제 표시 확률은 유효 확률 범위로 제한된다. Crit는 `10-8=2%`. 적 Spd15면 5차로 추격하며, 일반 타격 둘이 맞으면 28 피해다. [추론][FEFFT-FE02][FEFFT-FE58][FEFFT-FE64]

**True Hit:** Awakening 명중 판정은 **2RN** 방식이다. 표시 Hit와 실제 명중 빈도가 다르며, 위키 표상 표시 **20/50/80%**는 실제 **8.20/50.50/92.20%**다. 치명타·스킬·Dual Strike 확률에도 이 표를 그대로 적용하지 않는다. [문서][FEFFT-FE40 §The Binding Blade through Awakening]

### 6.3 Awakening 무기 삼각형·숙련

**검 > 도끼 > 창 > 검**. 유리한 쪽의 무기 랭크로 양쪽 보정 크기를 결정한다. 활·마도서·지팡이·변신석에는 이 3종 삼각형을 확대 적용하지 않는다. [문서][FEFFT-FE02]

| 유리한 쪽 랭크 | 유리 | 불리 |
|---|---|---|
| E/D | Hit +5 | Hit -5 |
| C | Hit +10 | Hit -10 |
| B | Hit +10, 공격 +1 | Hit -10, 공격 -1 |
| A | Hit +15, 공격 +1 | Hit -15, 공격 -1 |

| 무기 종류 | C랭크 | B랭크 | A랭크 |
|---|---|---|---|
| 검 | 공격+1 | 공격+2 | 공격+3 |
| 창·활·마도서 | 공격+1 | 공격+1/Hit+5 | 공격+2/Hit+5 |
| 도끼 | Hit+5 | Hit+10 | 공격+1/Hit+10 |
| 지팡이 | 회복+1 | 회복+2 | 회복+3 |

[문서][FEFFT-FE02]

불리한 삼각상성에 놓이면 별도의 **자기 무기 랭크 보너스도 사라진다**. 예로 B검 Chrom 대 E도끼 적은 Chrom 공격+1/Hit+10, 적 공격-1/Hit-10이다. 등급이 낮은 도끼의 E가 보정 폭을 결정하지 않는다. [문서][FEFFT-FE02]

무기 EXP는 전투 또는 지팡이 사용마다 기본 **2**, 빗나감/0피해여도 획득한다. 랭크 누적 기준은 E=1, D=31, C=71, B=121, A=181 WExp이며 최대 A다. 다타 무기의 타격 수를 그대로 WExp 획득 횟수로 세지 않는다. [문서][FEFFT-FE02 §Weapon Rank Progression]

### 6.4 Awakening Pair Up / Dual의 구분과 공식

**Pair Up:** 두 유닛을 한 칸에 놓되 선두만 이동·직접 공격·피격 대상이 된다. 후열은 능력 보너스와 Dual을 제공한다. 후열이 될 유닛이 기존 선두의 칸으로 들어가는 명령이다. 선두 교대(Switch) 후 그 턴 추가 이동은 할 수 없다는 매뉴얼 제한이 있으며, 분리는 인접 칸을 사용한다. [문서][S01 §13][FEFFT-FE07]

```text
Pair Up 기본 능력 보너스
 = 후열 순수 능력치 구간 보너스 + 후열 클래스 보너스 + 지원 단계 보너스
후열 순수 능력 0~9 / 10~19 / 20~29 / 30 이상 → 0 / 1 / 2 / 3
C/B 지원 → 클래스가 원래 올리는 능력에 +1
A/S 지원 → 클래스가 원래 올리는 능력에 +2
HP는 증가하지 않음. Move는 순수 능력치·지원 단계 가산 없음.
```

후열의 Tonic·스킬로 임시 상승한 능력은 '순수 능력치 구간'을 올리는 데 쓰지 않는다. Grandmaster 후열의 기본 클래스 보너스는 Str/Mag/Skl/Spd 각 **+2**이며, A지원이면 이 네 항목에 각 **+2**를 더한다. Str25/Mag31/Skl27/Spd22/Luck33/Def15/Res19 후열의 최종 보너스는 **+6/+7/+6/+6/+3/+1/+1**이다. [문서][FEFFT-FE07]

**Dual은 인접만으로도 가능하다.** Pair Up이 아니면 인접 아군 중 지원 단계가 가장 높은 한 명이 공격·방어 파트너가 된다. Pair Up이면 후열이 우선한다. 주변 여러 사람의 지원은 전투 능력 보너스를 함께 올리지만 한 번의 Dual Strike를 여러 사람이 동시에 하는 것은 아니다. [문서][FEFFT-FE23][S01 §13]

```text
Dual Strike % = floor((선두 Skl + 후열 Skl)/4) + 단계 보너스 + 스킬 보너스
단계 보너스: 없음20 / C30 / B40 / A50 / S60
스킬 보너스: 둘 중 Dual Strike+ 소지 시 +10

Dual Guard % = floor((두 유닛 Def 합 또는 Res 합)/4) + 단계 보너스 + 스킬 보너스
단계 보너스: 없음0 / C2 / B5 / A7 / S10
스킬 보너스: 둘 중 Dual Guard+ 소지 시 +10
```

물리 피격에는 Def, 마법에는 Res 합을 쓴다. Guard는 해당 피해를 **0**으로 만들며 Aether/Astra가 발동한 공격 묶음도 차단한다. Strike는 선두의 일반/Brave 공격 뒤에 판정하며 후열 공격도 명중·무기 조건에 따라 해결한다. [문서][FEFFT-FE02][FEFFT-FE23]

**Dual Support의 전체 표:** 각 인접/후열의 없음/C/B/A/S를 랭크 **1/2/3/4/5**로 환산해 합산하고 최대12, Dual Support+는 +4다. [문서][FEFFT-FE23]

| 합산 랭크 |1|2|3|4|5|6|7|8|9|10|11|12|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Hit + |10|10|10|10|15|15|15|15|20|20|20|20|
| Avoid + |0|10|10|10|10|15|15|15|15|20|20|20|
| Crit + |0|0|0|10|10|10|10|15|15|15|15|20|
| Crit Avoid + |0|0|10|10|10|10|15|15|15|15|20|20|

[문서][FEFFT-FE23]

### 6.5 Awakening 지형

| 지형 | Def | Avoid | 턴 회복 | 기본 이동 비용·조건 |
|---|---:|---:|---:|---|
| Forest |+1|+10|없음|2; 기병 비용3, 비행1 |
| Fort |+2|+20|최대HP20%|1 |
| Gate/Throne |+3|+20|최대HP20%|1; 기병2 |
| Pillar |+1|+10|없음|1 |
| Desert |0|0|없음|2; 도보 마법/비행1, 기병3 |
| Stairway |0|+10|없음|1 |
| Peak |+3|+30|없음|비행만 진입 |

[문서][FEFFT-FE61 §Fire Emblem Awakening]

**주의:** 같은 지형명이라도 FE 다른 작품의 값과 다르다. 인용 위키의 Awakening Mountain 허용 직업 칸에는 본작에 없는 Hunter 명칭이 섞여 있어 그 칸은 `[미확인]`으로 제외했다. 겉보기 고도 자체가 FFT식 고저 명중/방향 공식으로 변하지 않는다. [미확인][FEFFT-FE61] [추론: 두 게임 규칙의 구별][S01 §10][S02 p.22]

### 6.6 FFT CT/AT와 시전

```text
각 clock tick: 유닛 CT += 현재 CT 증가용 Speed
CT >= 100 → 그 유닛의 Active Turn
AT 종료 시 CT 차감:
  이동 + 행동 = 100
  이동만 또는 행동만 = 80
  둘 다 생략 = 60
잔여 CT는 최대60으로 제한
```

진영 전체가 아니라 **한 유닛씩** 움직인다. 이동→행동 또는 행동→이동이 가능하고 끝에 방향을 고른다. AT 목록은 유닛 차례와 예약 마법 발동 순서를 함께 보여준다. 동시 임계 도달의 내부 동률 정렬은 열람 자료에서 완전히 확인하지 못해 `[미확인]`이다. [문서][FEFFT-FFT18 §CT][S02 pp.11–12,19]

**예:** SP10, CT0이면 10tick 뒤 CT100. 거기서 이동+행동을 하면 CT0이므로 다음 AT까지10tick, 행동만 하면 CT20이므로8tick, 대기만 하면 CT40이므로6tick이다. 최초 CT를 모든 전투에서 반드시0이라고 일반화한 예가 아니라 **조건을 정한 산술 예**다. [추론][FEFFT-FFT18]

**Haste/Slow:** Haste는 CT 증가를 **3/2**, Slow는 **1/2(버림)**로 바꾸고 각각 **32tick** 지속한다. 이는 Speed 자체의 영구 상승이 아니므로 SP에 의존하는 무기 피해·훔치기·Jump 착지 시간이 함께 빨라지지 않는다. [문서][FEFFT-FFT87][FEFFT-FFT88]

**주문 충전:** 대부분의 지연 능력은 유닛 CT와 별도인 자체 속도로 충전한다. `필요 tick≈ceil(100/능력 Speed)`로 읽으며, 일반 주문은 시전자 SP/Haste/Slow로 빨라지지 않는다. 예로 북미 PS Fire의 속도25는 **4tick**, Fire3의15는 **7tick**이다. 실제 예약 순서는 AT 미리보기에서 확인한다. [문서][FEFFT-FFT18][FEFFT-PS07] [추론: tick 계산][FEFFT-FFT18]

대상 지정에는 **유닛 추적/패널 고정** 구별이 있다. 추적 주문의 대상이 아군 쪽으로 이동하면 범위에 다른 아군이 들어갈 수 있고 패널 고정 기술은 적이 떠나면 빈 곳에 발동한다. 충전 중에는 회피가0이며 물리 피해에 취약하다. [문서][S02 pp.15–16][FEFFT-FFT18][FEFFT-FFT54]

**Jump:** 충전은 `50/SP`tick 계열이며 비정수·동시 AT의 엄밀한 반올림은 `[미확인]`이다. 공중에 있는 동안 대상 지정·피해를 받지 않으며 착지는 **선택한 패널**을 공격한다. 창 장착 시 피해가 **50% 증가**, Haste/Slow는 비행 시간을 줄이지 않는다. [문서][FEFFT-FFT76]

### 6.7 FFT 피해 공식·무기 계통

FFT는 모든 물리 공격에 단일 '공격력-방어력' 식을 쓰지 않는다. 다음은 **보정 없는 일반 공격의 기반식**이다. 궁합·Protect/Shell·공격/방어 보조·속성·상태가 중간 항을 수정할 수 있어 마지막에 단순 곱만 하면 정수 결과가 다를 수 있다. [문서][FEFFT-FFT42]

| 무기 계통 | 기반 피해 |
|---|---|
| 검·창·Rod·Crossbow | `PA×WP` |
| Knife·Ninja Sword·Bow | `floor((PA+SP)/2)×WP` |
| Katana·Knight Sword | `floor(PA×Brave/100)×WP` |
| Staff·Pole | `MA×WP` |
| Book·Cloth·Instrument | `floor((PA+MA)/2)×WP` |
| Axe·Flail·Bag | `Random(1..PA)×WP` |
| 일반 Gun | `WP×WP` |
| 마법 Gun | `floor((시전자Faith/100)×(대상Faith/100)×주문위력)×WP` |
| 맨손 | `floor(PA×Brave/100)×PA`; Martial Arts 보정은 별도 |
| Throw | `SP×투척무기WP` |

[문서][FEFFT-FFT42]

마법 Gun은 기본/중급/상급 발동이 **60/30/10%**, 위력은 **14/18/24**다. 보통 Gun은 방어 능력치가 낮은 Chemist도 무기 WP만 확보하면 피해가 안정적이지만, 사선과 회피 규칙까지 사라진다는 뜻은 아니다. [문서][FEFFT-FFT42 §Guns] [추론][FEFFT-FFT54]

**피해·회복 마법:** `MA×주문위력×(사용자Faith/100)×(대상Faith/100)`. 일반 공격 마법의 기본 명중은100에서 적용 가능한 마법 회피로 줄고 Holy/Ultima 등 예외가 있다. 상태 마법은 ` (MA+기본성공값)×사용자Faith비율×대상Faith비율`을 출발 성공률로 삼는다. 예로 Death의 기본성공값100, Toad120, Poison160이다. [문서][FEFFT-FFT05][FEFFT-FFT21][FEFFT-FFT28]

**계산 예:** MA10, Fire 위력14, 양쪽 Faith70이면 보정 전 피해 `10×14×0.7×0.7=68.6`, 버림하면 **68** 수준이다. 대상 Faith35이면 같은 식은34.3이 되어 절반 수준으로 줄어든다. 정확한 중간 버림에 따라 실제 예측값은 달라질 수 있으므로 위 예는 Faith의 곱 구조 설명이다. [추론][FEFFT-FFT05][FEFFT-FFT28]

### 6.8 FFT 명중·방향·고저

회피는 **더하기가 아니라 연속 곱**이다. C-Ev는 클래스, S-Ev 방패, A-Ev 액세서리, W-Ev는 Weapon Guard를 장착했을 때의 무기 회피다. 다음 식에서 e는 0~1로 환산한 회피율이다. [문서][FEFFT-FFT54 §Final Fantasy Tactics]

```text
정면 Hit = 기본Hit × (1-C) × (1-S) × (1-A) × (1-W)
측면 Hit = 기본Hit × (1-S) × (1-A) × (1-W)
후면 Hit = 기본Hit × (1-A)
```

예를 들어 방패50%+망토50%는100% 회피가 아니라 기본100% 명중에 `0.5×0.5`가 적용되어 **25% 명중**이다. 후면에서는 방패가 빠져 **50% 명중**이다. 마법에는 클래스/무기 회피가 없고 충전 중 회피는0. 일부 반응(Blade Grasp 등)은 이 회피 수치와 별도 기제로 공격을 막는다. [문서][FEFFT-FFT54]

**고저·이동:** Move는 이동 거리, Jump는 단차 허용 능력이다. 물·늪·깊은 수역·용암은 통과 가능 여부와 비용에 영향을 주며 Ignore Height, Float, Fly, Teleport 등은 각각 다른 제약을 바꾼다. 높이차는 능력마다 따로 정해진 **수직 범위**를 검사하고, 화살과 총탄은 궤적·장애물 조건도 고려한다. 고지에 섰다고 모든 공격에 동일한 +명중/+피해를 주는 단일 규칙은 아니다. [문서][S02 p.22][FEFFT-FFT55][FEFFT-FFT42][FEFFT-FFT17]

### 6.9 FFT 별자리 궁합

생일로 정해지는 별자리는 전투 대상과의 **효과 배율·상태 성공률**에 관여한다. Ramza의 생일은 시작할 때 선택하고 고유 인물은 고정이다. 서로 좋은 궁합이면 적을 더 세게 때리지만 아군 회복·지원도 더 잘 받아, 단순한 '적대 관계 수치'가 아니다. [문서][S02 p.21][FEFFT-FFT45]

| 등급 | 일반 설명상 효과 배율 |
|---|---:|
| Best | ×1.5 |
| Good | ×1.25 |
| Neutral | ×1 |
| Bad | ×0.75 |
| Worst | ×0.5 |

[문서][FEFFT-FFT45 §Zodiac compatibility chart]

**일반 인간 별자리 패턴:** 같은 원소의 서로 다른 별자리끼리는 Good: 불(Aries/Leo/Sagittarius), 땅(Taurus/Virgo/Capricorn), 공기(Gemini/Libra/Aquarius), 물(Cancer/Scorpio/Pisces). 황도상 90도 떨어진 별자리는 Bad이며 대척점은 **Aries–Libra, Taurus–Scorpio, Gemini–Sagittarius, Cancer–Capricorn, Leo–Aquarius, Virgo–Pisces**다. PS의 대척 인간쌍은 이성 Best/동성 Worst다. [문서][FEFFT-FFT45]

**자료 상충 주의:** 열람한 Fandom 궁합 페이지는 본문과 표 범례에서 몬스터 성별 처리 설명이 서로 다르고, 표에는 같은 별자리 대각선도 `!`로 표시되어 서술과 충돌한다. 따라서 **몬스터와의 대척 특수 처리·동일 별자리 성별 예외는 [미확인]**으로 남긴다. Aries 단독 페이지의 Bad 상대 중 Scorpio도 전체 황도표의 Capricorn과 충돌하므로 채택하지 않았다. 실제 해당 매치업은 게임 내 별자리 도움말을 확인해야 한다. 후대 Enhanced의 성별 제거 규칙은 PS에 소급하지 않는다. [미확인][FEFFT-FFT45][FEFFT-FFT60][S02 p.21]

### 6.10 FFT Brave/Faith

| 수치 | 전투 효과 | 상태·영구 변화 |
|---|---|---|
| Brave | 대부분 반응 발동률은 Brave%. 맨손/Katana/Knight Sword 공격 항에 사용 | 9 이하 Chicken, 자기 AT마다 Brave+1로10 이상이 되면 해제 |
| Faith | 주는/받는 마법·회복의 곱 계수, 상태마법 성공률 | Faith/Atheist 상태와 영구 Faith 값은 구분 |
| 낮은 Brave | 반응이 잘 안 나옴 | Move-Find Item의 희귀품 확률에는 유리 |
| 낮은 Faith | 공격/치유 마법에 덜 영향받음 | Item·Geomancy 등 비Faith 능력은 별도 |

[문서][FEFFT-FFT13][FEFFT-FFT05][FEFFT-FFT17][FEFFT-FFT20]

- **지속 변화:** 전투 중 Brave/Faith 상승량의 **1/4**가 버림되어 전투 후 영구값에 남는다. Praise/Preach 한 번의 +4가 영구 +1의 예다. 하락도 Solution -20→영구 -5처럼 남는다. 스킬로 올릴 수 있는 Brave 영구 상한은 **97**, 전투 중은100이다. [문서][FEFFT-FFT84][FEFFT-FFT83][FEFFT-FFT05]
- **이탈:** Brave **6–15** 경고, **5 이하** 이탈. Faith **85–94** 경고, **95 이상** 이탈. Ramza는 떠나지 않는다. 'Faith97이 항상 최선'이라는 조언은 일반 동료에게 적용할 수 없다. [문서][FEFFT-FFT13][FEFFT-FFT05]
- **보물 탐색:** Move-Find Item의 해당 칸 희귀품 대신 일반품을 뽑는 확률이 Brave%다. 따라서 Brave10이면 희귀품 쪽이 **90%**라는 계산이 된다. 하지만 Brave9 이하 Chicken과 영구5 이하 이탈 경계를 같이 관리해야 한다. [문서][FEFFT-FFT13] [추론: 보완확률][FEFFT-FFT13]

### 6.11 FFT 지형 패널과 Geomancy — Geo Panel과 구별

**FFT의 패널은 지형과 높이를 가진 전장 칸이다. 색을 연결해 Geo Symbol을 부수고 전장 전체에 연쇄 폭발·색 보너스를 일으키는 Disgaea식 Geo Panel 체계로 설명하지 않는다.** 여기에서 대응하는 시스템은 **Geomancer의 Elemental/Geomancy**다. [추론: 용어 경계][S02 p.22][FEFFT-FFT17]

시전자 발밑 지형에 대응하는 기술을 배웠을 때만 해당 Geomancy를 사용할 수 있다. **사거리5, MP0, 즉시, 명중100%**, 기본 피해는 `MA×(PA/2+1)`이며 **상태 부여25%**다. 궁합·속성은 적용하지만 Faith는 적용하지 않는다. 상태 면역 대상에게까지25%로 강제 적용한다는 뜻은 아니다. [문서][FEFFT-FFT17 §§Geomancy/Terrain tiles]

| PS 기술 | 필요한 대표 지형 | 속성 | 추가 상태 | 학습 JP |
|---|---|---|---|---:|
| Pitfall | 흙·황무지 | 무 | Don't Move |150|
| Water Ball | 운하·강·호수·바다·폭포 | 물 | Frog |150|
| Hell Ivy | 풀·수풀·덩굴 | 무 | Stop |150|
| Carve Model | 자갈·석재 바닥/벽·묘비 | 무 | Petrify |150|
| Local Quake | 암석·현무암 | 땅 | Confusion |150|
| Kamaitachi | 책·나무·벽돌·다리·가구·철판·관 | 바람 | Don't Act |150|
| Demon Fire | 나무 바닥·카펫·상자·계단·갑판 | 불 | Sleep |150|
| Quicksand | 늪·독늪 | 물 | Death Sentence |150|
| Sand Storm | 모래·종유석·소금 지형 | 바람 | Darkness |150|
| Blizzard | 눈·얼음 | 얼음 | Silence |150|
| Gusty Wind | 지붕·굴뚝 | 바람 | Slow |150|
| Lava Ball | 용암·기계 | 불 | 즉사 |150|

[문서][FEFFT-FFT17][FEFFT-PS13]

### 6.12 FFT 주요 상태와 구조 시계

| 상태 | 규칙·기간 |
|---|---|
| Protect/Shell | 관련 공격 항을 1/3 감소; 각각32tick |
| Regen | 자기 AT 종료 최대HP1/8 회복,32tick |
| Poison | 자기 AT 종료 최대HP1/8 피해,36tick |
| Haste/Slow | CT 증가 ×1.5/×0.5,32tick |
| Stop | CT 정지·회피/반응 불가,20tick |
| Sleep | CT·회피·반응 불가, 물리 공격 항 +50%로 피격, 피해 시 해제 또는60tick |
| Stone/Petrify | 행동·CT·피격 불가, 패배 판정상 무력화 |
| Don't Move/Immobilize | 이동 불가, 행동 가능 |
| Don't Act/Disable | 행동 불가, 이동 가능 |
| Silence | 마법·Talk Skill 제한 |
| Charm | 일시적으로 반대편 행동; 정식 영입과 별개 |
| Reraise | KO 뒤 개인 AT에서 최대HP10%(올림)로 부활하고 행동 가능 |
| KO | 개인 CT100마다 머리 위 카운트 감소, 소진 후 영구 결정화/상자화 |

[문서][FEFFT-FFT22][FEFFT-FFT43][FEFFT-FFT85]

**KO 시계의 엄밀성:** 위키의 상세는 `3→2→1→0` 뒤 **0에서 다시 AT가 오면** 결정화라고 설명하지만 같은 페이지는 이를 '3턴 후'라고도 요약한다. 따라서 이를 전체 전장 3라운드나 단순3tick로 바꾸지 않는다. 이 문서는 **머리 위 카운트와 개인 CT 기반의 제한된 구조 기회**를 확정하며, 0 도달과 결정화 사이의 판본별 내부 갱신 횟수는 `[미확인]`이다. [문서/미확인][FEFFT-FFT43]

## 7. 지도/세계 구조

### 7.1 표면의 정의와 수

여기서 '표면'은 **플레이어가 서로 다른 이동·시간 규칙으로 조작하는 공간**이다. 메뉴 하나, 물리 화면 하나, 대륙 하나, 던전 층 하나를 각각 새 게임 표면으로 세지 않는다. 이 정의로 두 작품은 모두 **주요 공간 표면 2종(세계지도/전술 전장)**이다. FE 병영 관찰과 전투 애니메이션은 별도 보기 화면이지 독립 이동 시뮬레이션은 아니다. [추론][S01 §§6–13][S02 pp.10–22,25–29]

| 게임·표면 | 규모·표현 | 카메라·이동 | 시간 | 전환 |
|---|---|---|---|---|
| FE 세계지도 | Ylisse·Valm의 연결 장소, 본편/외전/Outrealm | 노드 선택·스크롤·전체 보기 | 사건 일부는 3DS 실제 시각과 동기. 거리당 하루 규칙 없음 | 장소 입장→상점/준비/이야기 |
| FE 전술 지도 | 임무별 사각 격자; 모든 맵 공통 크기는 없음 | 커서·범위·줌, 유닛별 Move | 페이즈 턴 | 준비→전투→이야기/세계지도 |
| FE 병영(보조 보기) | 합류자에 따라 장식 변화 | Look으로 방 안 카메라 관찰, 자유 보행 아님 | 2시간마다 사건, 최대5개 저장 | 준비 메뉴에서 진입/복귀 |
| FE 전투 연출(보조 보기) | 선택한 교전만 3D로 표시 | 자동/유닛 시점/측면·줌·속도·건너뛰기 | 전투 결과 표현 | 격자 교전에서 자동 진입/복귀 |
| FFT 세계지도 | Ivalice의 도시/전장 노드와 연결선 | 노드 커서·목적지 선택 | 1구간1일 | 도착 도시 메뉴 또는 전투 |
| FFT 전술 지도 | 높이층을 가진 입체 격자 | 회전 가능한 디오라마, Move/Jump·방향 | 개인 CT와 능력 CT | 출격 배치→전투→세계지도 또는 연전 |

[문서][S01 §§6–13][FEFFT-FE27][FEFFT-FE52][S02 pp.8–14,22,25–29][FEFFT-FFT01 §Development]

**규모의 한계:** FFT 개발 관련 위키는 전장 격자를 **16×16 이내**로 제한했다는 개발자 인터뷰를 인용한다. 이는 모든 임무가 정확히16×16이라는 뜻도, 높이별 점유 층이 한 개라는 뜻도 아니다. FE 전장별 너비×높이 전체 카탈로그와 두 게임의 노드 간 실제 거리 환산은 `[미확인]`이다. [문서][FEFFT-FFT01 §Development][S02 p.22]

### 7.2 FFT 세계지도·상점·던전의 연결

매뉴얼은 방문한 거점 **파랑**, 미방문 거점 **빨강**, 무작위 전투 지점 **초록**으로 구분한다. 빨강을 '현재 적대 국가', 파랑을 '내가 세금을 걷는 영지'로 해석하면 안 된다. 도시 안에서 걸어다니는 별도 3D 마을 없이 상점/주점/병사 고용 메뉴로 서비스를 사용한다. [문서][S02 pp.10,25–29]

연전은 전투 종료마다 반드시 세계지도와 상점에 복귀하는 흐름을 보장하지 않는다. 고립된 결투·호위·연전 전에 별도 저장을 남겨야 안전하다는 것은 규칙에서 도출되는 운영 조언이며 자동 복구 시스템이 있다는 뜻은 아니다. [추론][FEFFT-FFT01 §§Chapter 3–4][S02 pp.13,39]

### 7.3 FFT Deep Dungeon / Midlight's Deep

**해금:** Ch.4 **Mullonde 전투 이후 Warjilis 입장 이벤트**로 세계지도에 나타난다. **10층**, 각 층은 독립 전장이다. 최하층을 제외한 다음 층 출구는 층별 **5개 후보 칸 중 하나**에 숨는다. 출구 칸을 밟아 찾은 뒤 적을 전멸해야 다음 층이 열린다. 출구 발견에는 Move-Find Item이 필수가 아니지만 희귀 장비 수집에는 필요하다. [문서][FEFFT-FFT15]

**어둠:** 유닛과 이동 칸은 보이지만 바닥 자체가 어둡다. 쓰러진 적의 크리스털을 남기면 조금씩 밝아지고 **5개**가 남아 있으면 완전히 밝아진다. 크리스털을 주워 회복/스킬을 얻는 것과 조명으로 남기는 것 사이에 선택이 생긴다. [문서][FEFFT-FFT15][FEFFT-FFT43]

| 순서 | 북미 PS 층명 | 후대 명칭 |
|---:|---|---|
|1|NOGIAS|The Crevasse|
|2|TERMINATE|The Stair|
|3|DELTA|The Hollow|
|4|VALKYRIES|The Catacombs|
|5|MLAPAN|The Oubliette|
|6|TIGER|The Palings|
|7|BRIDGE|The Crossing|
|8|VOYAGE|The Switchback|
|9|HORROR|The Interstice|
|10|END|The Terminus|

[문서][FEFFT-FFT15]

최하층 최초 전투는 Elidibs/Elidibus의 특수 보스전이며 **Byblos가 생존하면 합류**한다. Zodiac 소환을 Summoner가 맞고 생존하여 배우는 기회도 여기 있다. '던전을 클리어하면 모든 유닛에게 Zodiac 자동 지급'이 아니다. 이후 최하층도 일반 반복 전장처럼 재방문 가능하다. [문서][FEFFT-FFT15][FEFFT-FFT86]

### 7.4 FFT Wonders/Artefacts

**Wonders는 실제로 이동하는 새 던전이 아니다.** 주점 탐사 의뢰 보상으로 발견하는 고대 지역의 설명·삽화 수집 기록이다. **16종** 모두 발견하면 최고 Adventurer Rank와 기록의 별 표식을 얻으며 직접 전투 보너스는 없다. 발견 수 **1/3/6/8/10/12/14/16**에서 Lv1/2/3/4/5/6/7/Master다. [문서][FEFFT-FFT40]

전체16종: **Chaos Shrine, Eureka, Pandaemonium, Mirage Tower, Flying Fortress, Matoya's Cave, Crystal Tower, Floating Continent, Citadel of Trials, Tower of Babil, Ronkan Ruins, Falgabard, Phantom Train, Tozus Village, Chocobo Forest, Semitt Falls**. PS 번역에서는 Shrine of Chaos/Forbidden Land Eureka/Floating Castle/Fortress of Trials/Tower of Babel 등 이름이 다르다. [문서][FEFFT-FFT40]

Artefacts도 비슷한 별도 수집군이며 의뢰가 완료된 뒤 Chronicle/Brave Story에서 설명을 열람한다. Wonders와 Artefacts를 장비 슬롯에 끼우거나 정복 가능한 지역으로 바꾸는 기능은 없다. [문서][FEFFT-FFT07][FEFFT-FFT41]

## 8. 외교/세력

### 8.1 Awakening

Ylisse, Plegia, Regna Ferox, Valm, Chon'sin 등 세력이 이야기의 동맹·전쟁 구도를 만든다. Chrom은 정치적 사건에 대응하지만 플레이어가 국가 관계 수치·외교 조약·세율·반란 확률을 상시 관리하지 않는다. 지도 점령은 다음 임무와 상점 접근을 뜻하며 영지 생산·주둔·징세 규칙으로 확장되지 않는다. [문서][FEFFT-FE01][FEFFT-FE27] [추론: 기능 분류][S01 §§6–8]

**실제 수치 관계는 인물 지원이다.** C/B/A/S는 국가 호감도가 아니라 두 유닛의 관계이고, 결혼과 자녀 외전·전투 보너스에 영향을 준다. 적 유닛 영입은 Gaius/Tharja의 Chrom 대화처럼 특정 조건이며 모든 적에게 협상 명령을 시도하는 체계가 아니다. [문서][FEFFT-FE47][FEFFT-FE46]

### 8.2 FFT

Hokuten/Nanten과 귀족 세력, Glabados 교회, Corpse Brigade, Lucavi의 갈등이 진행을 이끈다. 플레이어는 Ramza의 부대를 관리하며 Delita처럼 정치적 세력 전체를 지휘하거나 왕국 외교를 수치로 조절하지 않는다. 네 장의 본편은 선택 국가에 따라 별도 캠페인으로 분기하지 않는다. [문서][FEFFT-FFT01 §§Setting/Story] [추론: 기능 분류][S02 pp.25–39]

**전투 내 진영 변경과 국가 외교를 분리한다.** Mediator Invitation은 적 유닛을 아군으로 만들고, Thief Steal Heart는 일시 Charm, Brave/Faith 이탈은 개인의 영구 이탈이다. 이들로 국가 동맹이나 반란 지지도를 조작하는 것은 아니다. [문서][FEFFT-FFT31][FEFFT-FFT26][FEFFT-FFT13][FEFFT-FFT05]

| 요청 범주 | Awakening | FFT PS |
|---|---|---|
| 국가별 관계 수치 | 해당 기능 없음 | 해당 기능 없음 |
| 자유 동맹/선전포고 | 이야기로 결정 | 이야기로 결정 |
| 자유 영토 정복·통치 | 없음 | 없음 |
| 동적 반란 시뮬레이션 | 없음 | 없음 |
| 인물 관계/이탈 | 지원·결혼, 모드별 손실 | 영입·Charm·Brave/Faith 이탈 |

위의 '없음'은 전쟁이나 반란 **이야기가 없다**는 뜻이 아니라 플레이어가 반복 조작하는 독립 시스템이 아니라는 분류다. [추론][S01][S02][FEFFT-FE01][FEFFT-FFT01]

## 9. 이벤트/내러티브

### 9.1 Awakening 이벤트 유형과 지속성

| 유형 | 트리거·선택 | 남는 결과 |
|---|---|---|
| 본편 대화/연출 | 정해진 장 진입·승리·보스 상황 | 다음 장소·합류·이야기 진행 |
| 지원 대화 | 쌍별 지원점 임계 도달 후 메뉴 선택 | C/B/A/S, 결혼·전투 보너스 |
| 영입 대화 | 올바른 화자와 대상 접근 | 해당 유닛 아군화 |
| 자녀 외전 | 부모 결혼·진행·지도 접근 | 계승 상태 고정, 자녀 합류 |
| 병영 | 실제 시간2시간마다, 최대5개 | 지원점·임시 능력·아이템·EXP. 생일 복합 보상 |
| 지도 조우 | Risen·행상인·StreetPass/SpotPass 팀 | 전투·고용·구매·격파 보상 |
| 마을·상자·숨은 물품 | 타일 방문·열쇠/Locktouch·특수 방문 순서 | 물품 획득; 놓친 기회는 본편 재시작 없이 복구 불가일 수 있음 |
| 최종 선택 | Grima 격파 후 Chrom/Robin 결정 | 결말 장면 차이 |

[문서][S01 §§6–8,13,16–20][FEFFT-FE46][FEFFT-FE47][FEFFT-FE52][FEFFT-FE54][FEFFT-FE45]

병영의 EXP 사건은 **99EXP를 넘겨 레벨업시키지 않는다**. 생일 사건은 잃어버린 물건·임시 능력·EXP를 함께 준다. 임시 능력은 다음 전투 종료까지, 지원 단계·영입·물품은 지속 상태다. [문서][FEFFT-FE52]

**결말 선택:** Chrom이 Grima를 마무리하면 다시 **1,000년 봉인**, Robin이 희생을 선택하면 Grima와 함께 사라졌다가 후일 재회 장면이 나온다. 최종전 전의 합일 제안 같은 선택은 양쪽 답변이 같은 핵심 사건으로 수렴한다. 따라서 모든 대화 선택이 전략 노선 분기인 것은 아니다. [문서][FEFFT-FE45 §Plot]

### 9.2 Awakening DLC·통신의 전체 구성

DLC는 **Ch.4 완료 뒤 Outrealm Gate**에서 시작한다. 본편 완료에 필요하지 않고 구입한 맵을 반복 플레이할 수 있다. **2023-03-27 이후 3DS eShop 폐쇄로 신규 구매 불가**이므로 아래는 제공 당시 콘텐츠 규칙이다. 기존 구매본의 재다운로드·현재 SpotPass 서비스 가용성은 각각 서비스 상황에 따라 달라, 이 문서가 2026년 서버 동작을 확인한 것은 아니다. [문서][FEFFT-FE39][FEFFT-FE12][S01 §20]

| 묶음·전체 에피소드 | 핵심 보상/목적 |
|---|---|
| Champions of Yore 1/2/3 | Marth / Roy / Micaiah + All Stats +2 |
| Lost Bloodlines 1/2/3 | Leif / Alm + Dread Scroll / Seliph + Paragon |
| Smash Brethren 1/2/3 | Elincia / Eirika + Wedding Bouquet / Lyn + Iote's Shield |
| Rogues & Redeemers 1/2/3 | Ephraim / Celica / Ike + Limit Breaker |
| The Golden Gaffe | 돈을 들고 도망가는 적 추격 |
| EXPonential Growth | Entombed 처치 EXP; 높은 레벨 적의 Counter 주의 |
| Infinite Regalia | 무작위 희귀 무기 상자3개, Eldigan, Silver Card |
| Death's Embrace | HP를1로 만드는 지형의 고난도 조건, Est |
| Five-Anna Firefight | 분산된 Anna5명 보호, Rescue 지팡이 금지, Catria |
| Roster Rescue | 열리고 닫히는 벽과 추격, Palla·Bullion S7개 |
| Harvest/Summer/Hot-Springs Scramble | 추가 동료 대화·복장·아이템 |
| The Future Past 1/2/3 | 다른 미래의 자녀 구조·부모 대화·결말 |
| Apotheosis | 연속5파 전투, Katarina 또는 Supreme Emblem |

[문서][FEFFT-FE39]

**Apotheosis 분기:** 첫 파를 **2턴 이내**에 격파하면 더 강한 적 세트로 진행하는 선택이 열리고 그 시련을 이기면 Katarina 대신 Supreme Emblem을 얻는다. 난이도 선택과 별개로 특수 적 스킬·높은 능력을 상대하는 최종 시험이다. [문서][FEFFT-FE39 §Apotheosis][FEFFT-FE20]

**유료 DLC와 다른 무료/로컬 기능:**

- SpotPass는 영령 팀·보너스 아이템·외전 등을 받는 기능이며 Bonus Box에서 팀을 재소환할 수 있다. 외전18–23은 Ch.25 후 배포 데이터가 있어야 한다. Gangrel(Chrom3회 대화), Walhart(Chrom과 교전 후 완료), Emmeryn(생존), Yen'fay(Say'ri 대화), Aversa(NPC 생존), Priam(완료)이 각각 합류한다. [문서][S01 §18][FEFFT-FE46]
- StreetPass 팀은 최대 **10유닛**, 상대 지도에 나타나 대화·고용·도전·구매를 제공한다. 업데이트당 최대3팀, 지도에 최대9팀이라는 매뉴얼 제한이 있다. 플레이어끼리 실시간 전술 PvP를 하는 기능으로 바꾸어 설명하지 않는다. [문서][S01 §17]
- Avatar Logbook은 최대 **99명**, 저장 파일 간 공유, 고용에 게임 내 돈 사용. 등록 유닛을 업데이트하고 덮어쓰기 방지 Lock을 걸 수 있다. [문서][S01 §16]
- Double Duel은 **로컬 2인**, 각자 최대 **3명**으로 팀을 구성하고 턴마다 선두/지원 역할을 교대해 적을 상대한다. 승리하면 Renown·보상, 중간 패배는 보상 없음, 일부 적 격파 후 자진 포기하면 해당 Renown을 얻는다. [문서][S01 §19]

### 9.3 FFT 이벤트·선택의 결과

FFT는 큰 줄기에서는 고정 이야기지만 대화 선택으로 **전투 목표·Brave 변화**가 달라지는 경우가 있다. 전투 중 대사, 인물 합류 여부, 상점/주점 소문, 선택적 동료 연쇄 이벤트가 지속 상태를 만든다. 모든 선택을 호감도 점수나 다중 정치 루트로 해석하지 않는다. [문서][FEFFT-FFT01][FEFFT-FFT13][S02 pp.21,26–27]

**장기 결과의 종류:**

- 일반 동료의 죽음·결정화, 파괴/도난 장비는 영구 손실이다. 새 인간을 고용해 빈자리를 채울 수는 있어도 잃은 인물의 성장·고유 직업이 자동 복구되지 않는다. [문서][FEFFT-FFT43][FEFFT-FFT23][FEFFT-FFT02]
- 고유 동료와 소문·도시 방문이 연결된 숨은 이벤트는 전제 인물을 유지해야 이어진다. Goug 계열은 Beowulf·Reis·Construct8·Cloud 등의 부가 모집으로 이어지며, 본편 필수 루트와 구분된다. [문서][FEFFT-FFT01 §Chapter 4][FEFFT-FFT02]
- Proposition 성공은 기록·연쇄 의뢰·수집품을 남기지만 실패는 재도전 가능하다. Brave Story/Chronicle은 이전 이야기·인물·발견 기록을 열람하는 장치다. [문서][FEFFT-FFT07][S02 pp.26–27,36–37]
- PS판에는 후대 WotL의 추가 직업·추가 인물·멀티플레이 보상을 다운로드로 넣는 체계가 없다. WotL 추가 콘텐츠와 2025 Enhanced의 NG+·난이도·새 대사를 PS 진행으로 소급하지 않는다. [문서][FEFFT-FFT52]

## 10. 난이도/압박

### 10.1 Awakening 난이도와 실패 조건

| 모드 | 적·규칙 변화 |
|---|---|
| Normal | 기본 튜토리얼, 낮은 적 능력·스킬 부담, Reeking Box500G |
| Hard | 높은 적 능력·수, 적 무기랭크 최소C, 적 페이즈 시작 증원 즉시 행동, Reeking Box4,800G |
| Lunatic | 적 무기랭크 최대, 더 높은 능력·위험한 AI·고급/초과 연성 무기·강한 스킬; 반복 공격 EXP 억제·강한 조우전 스케일링 |
| Lunatic+ | Lunatic 기반에 적마다 추가 특수 스킬2개. Pass/Hawkeye/Luna+/Vantage+/Counter/Aegis+/Pavise+ 조합. Ch.3 전에는 Counter/Aegis+/Pavise+ 제외 |

[문서][FEFFT-FE11 §Awakening]

Lunatic+는 Lunatic 클리어로 열리며 **Lunatic/Casual 클리어는 Lunatic+/Casual만**, **Lunatic/Classic 클리어는 양쪽**을 해금한다. Classic/Casual은 위 난이도와 별도 축이다. [문서][FEFFT-FE11][FEFFT-FE50]

**압박원:** 무기·치유 횟수, 적 페이즈에 받는 연속 공격, 비행/중갑/짐승 특효, 지도 목표와 증원, 부모 세팅 확정 시점, Classic 전력 손실. Pair Up은 강한 선두를 만들지만 독립 행동할 유닛 수를 줄인다. 높은 확률의 Guard가 있어도 확정 생존이라고 계산할 수 없다. [문서][S01 §§9,12–14][FEFFT-FE02][FEFFT-FE05][FEFFT-FE11] [추론: 비용 관계][FEFFT-FE07]

**게임오버:** Chrom 또는 Robin이 패배하면 Casual에서도 게임오버다. 마지막 저장에서 다시 시작한다. 일반 저장 슬롯 **3개**, Casual 전투 저장 **2개**; Classic은 중단용 Bookmark를 재개하면 소멸한다. 전투 중 실수를 되감는 현대 FE의 시간역행 기능으로 Bookmark를 해석하면 안 된다. [문서][S01 §§3,9][FEFFT-FE50]

### 10.2 FFT 난이도와 실패 조건

**PS 원작에는 Normal/Hard 선택 모드가 없다.** 적 배치·목표·성장·장비·직업 조합이 도전을 만든다. 후대 Enhanced의 난이도 선택을 포함하면 판본 오류다. [문서][S02 pp.5–7][FEFFT-FFT52]

| 압박 | 구체 원인 | 실패 시 |
|---|---|---|
| AT·시전 | 고속 적이 먼저 움직임, 주문 전 적 이동, 충전 중 취약 | 행동 낭비·오폭·시전자 KO |
| 위치·방향 | 정면/측면/후면 회피 차이, 높은 지형·사선·수직 범위 | 예상했던 방패 방어 무효·기술 대상 불가 |
| 회복 시계 | KO 개인 카운트, 부활자의 SP·마법 충전 | 결정화로 영구 동료 손실 |
| 특수 목표 | 호위 NPC·Ramza 단독 결투·연전 | 보호 대상 KO 등으로 즉시 패배 가능 |
| 성장 불균형 | 인물 레벨만 높고 장비·JP 조합이 약함 | 스케일링 조우가 더 위험 |
| 자산 손실 | Break·Steal·투척·Katana 파손 | 희귀 장비 또는 재고 손실 |
| 인물 유지 | 영구 Brave/Faith 경계 | 경고 후 이탈 |
| 탐색 | Deep Dungeon 출구를 못 찾고 전멸 | 다음 층 미개방, 다시 탐색 |

[문서][FEFFT-FFT18][FEFFT-FFT54][FEFFT-FFT43][FEFFT-FFT89][FEFFT-FFT90][FEFFT-FFT23][FEFFT-FFT34][FEFFT-FFT13][FEFFT-FFT05][FEFFT-FFT15]

Ramza의 완전한 사망, 부대가 행동 불가능한 전멸/석화, 임무별 실패 조건은 게임오버를 만든다. KO와 영구 사망은 같지 않지만 보호 목표는 예외다. 승리 전에 살릴 수 있는 KO 유닛을 남겨 놓고 재빨리 목표를 달성하는 것도 구조 방법이 된다. [문서][S02 p.13][FEFFT-FFT43][FEFFT-FFT22]

### 10.3 문서의 확정 범위와 남은 미확인 항목

이 문서는 **모든 요구 시스템의 항목을 포함**하지만 아래 자료 공백을 검증된 숫자인 것처럼 채우지 않는다. 특히 웹 위키는 최신판 변경과 원작 데이터를 섞고 개별 페이지끼리도 충돌한다.

| 항목 | 확정한 것 | 미확인·충돌 경계 |
|---|---|---|
| FE 성장 | EXP100, 클래스·개인 성장, 내부레벨, 자녀 평균/상한 | 자녀 가입 능력의 자동레벨·클래스 기본치·정수 처리 전체 순서 |
| FE 지형 | 주요 지형 Def/Avoid/회복·비용 | 위키 Mountain 허용 클래스 오염, 전체 전장 크기표 |
| FE 경험치 | 내부 레벨·무기 EXP·성장 스킬 | 계산 페이지의 Lunatic penalty 식 부호와 설명 충돌. 해당 세부 전투 EXP 식은 미수록 |
| FFT JP | 직업별 소비·공유25%·Boost50%·20직업 조건·전체 능력 비용 | 행동당 획득량의 정확한 공식과 직업레벨 누적 임계값 |
| FFT 별자리 | 인간의 Good/Bad/대척 배율 | 동일 별자리·몬스터 성별 특수 처리의 원문 상충 |
| FFT KO | 개인 CT카운트·결정화 영구 손실 | '3턴' 요약과 상세 0상태 처리의 불일치 |
| FFT 시계 | CT증가·60/80/100 차감·일반 능력 별도 CT | 동일 tick 타이브레이크, Jump 비정수 세부 처리 |
| FFT 성장·생성 | 원시 능력 성장식, 몬스터 번식 | MA 표시 분모 오류 가능성, 몬스터 산란 일정/확률·지역별 조우 생성식 |
| FFT JP 카탈로그 | PS 전용 표와 개별 위키의 학습비용 | Black Magic 상위·일부 Time Magic 비용에서 출처 간 상충은 부록 명시 |
| 서비스 | FE 신규 DLC 구매 종료, 제공 당시 통신 규칙 | 현재 계정별 재다운로드/SpotPass 서버 실동작 |

**보수적 사용 원칙:** `[미확인]`을 '그 시스템이 없다'로 바꾸지 않고, `[추론]` 계산 예를 실제 게임에서 재현한 테스트 결과로 읽지 않는다. 정밀 시뮬레이터를 만들 때는 이 경계 항목을 별도 원판 실행 또는 더 강한 1차 근거로 확인해야 한다.

## 부록 A. FFT 북미 PS 일반 직업 전체 JP 카탈로그

**표기:** `기술명 숫자`는 학습에 쓰는 JP다. 행동 명령과 반응(R)/보조(S)/이동(M)을 분리했다. 같은 능력의 PS 명칭이 두 위키에서 다르면 익숙한 PS 이름을 유지한다. 효과는 본문 직업·전투 항목을 참조한다. 아래는 **일반 20직업**의 학습 목록이며 고유 인물만의 명령은 포함하지 않는다. PS 전용 데이터베이스와 Fandom의 충돌 값은 단일 정답으로 숨기지 않는다. [문서][FEFFT-PS01][FEFFT-PS20][FEFFT-FFT02]

| 직업 | 행동 능력과 JP | R / S / M 능력과 JP |
|---|---|---|
| Squire | Accumulate300, Dash80, Throw Stone90, Heal150 | R Counter Tackle180; S Equip Axe170, Gained JP Up200, Monster Skill200, Defend50; M Move+1 200 |
| Chemist | Potion30, Hi-Potion200, X-Potion300, Ether300, Hi-Ether400, Elixir900, Antidote70, Eye Drop80, Echo Grass120, Maiden's Kiss200, Soft250, Holy Water400, Remedy700, Phoenix Down90 | R Auto Potion400; S Throw Item350, Maintenance250, Equip Change0; M Move-Find Item100 |
| Knight | Head Break300, Armor Break400, Shield Break300, Weapon Break400, Magic Break250, Speed Break250, Power Break250, Mind Break250 | R Weapon Guard200; S Equip Armor500, Equip Shield250, Equip Sword400 |
| Archer | Charge+1 100, +2 150, +3 200, +4 250, +5 300, +7 400, +10 600, +20 1,000 | R Speed Save800, Arrow Guard450; S Equip Crossbow350, Concentrate400; M Jump+1 200 |
| Monk | Spin Fist150, Repeating Fist300, Wave Fist300, Earth Slash600, Secret Fist300, Stigma Magic200, Chakra350, Revive500 | R HP Restore500, Counter300, Hamedo1,200; S Martial Arts200; M Move-HP Up300 |
| Priest | Cure50, Cure2 180, Cure3 400, Cure4 700, Raise180, Raise2 500, Reraise800, Regen300, Protect70, Protect2 500, Shell70, Shell2 500, Wall380, Esuna280, Holy600 | R Regenerator400; S Magic Defend Up400 |
| Wizard | Fire/Bolt/Ice 각각50, Fire2/Bolt2/Ice2 각각200, Fire3/Bolt3/Ice3 각각480, Fire4/Bolt4/Ice4 각각850, Poison150, Frog500, Death600, Flare900 | R Counter Magic800; S Magic Attack Up400 |
| Time Mage | Haste100, Haste2 550, Slow80, Slow2 520, Stop330, Don't Move100, Float200, Reflect200, Quick300, Demi250, Demi2 550, Meteor1,500 | R Critical Quick700, MP Switch400; S Short Charge800; M Teleport600, Float540 |
| Oracle | Blind100, Spell Absorb200, Life Drain350, Pray Faith400, Doubt Faith400, Zombie300, Silence Song170, Blind Rage400, Foxbird200, Confusion Song400, Dispel Magic700, Paralyze100, Sleep350, Petrify580 | R Absorb Used MP250; S Defense Up400; M Move-MP Up350, Any Weather200 |
| Thief | Gil Taking10, Steal Heart150, Steal Helmet350, Steal Armor450, Steal Shield350, Steal Weapon600, Steal Accessory500, Steal Exp250 | R Caution200, Gilgame Heart200, Catch200; S Secret Hunt200; M Move+2 520, Jump+2 480 |
| Mediator | Invitation100, Persuade100, Praise200, Threaten200, Preach200, Solution200, Death Sentence500, Negotiate100, Insult300, Mimic Daravon300 | R Finger Guard300; S Equip Gun750, Train450, Monster Talk100 |
| Summoner | Mogri110, Shiva200, Ramuh200, Ifrit200, Titan220, Golem500, Carbunkle350, Bahamut1,200, Odin900, Leviathan850, Salamander820, Silf400, Fairy400, Lich600, Cyclops1,000; Zodiac는 피격생존 학습 | R MP Restore400; S Half of MP900 |
| Geomancer | Pitfall/Water Ball/Hell Ivy/Carve Model/Local Quake/Kamaitachi/Demon Fire/Quicksand/Sand Storm/Blizzard/Gusty Wind/Lava Ball 각각150 | R Counter Flood300; S Attack Up400; M Any Ground220, Move on Lava150 |
| Lancer | 수평 Jump2/3/4/5/8 =150/300/450/600/900; 수직 Jump2/3/4/5/6/7/8 =100/200/300/400/500/600/900 | R Dragon Spirit560; S Equip Spear400; M Ignore Height700 |
| Samurai | Asura100, Koutetsu180, Bizen Boat260, Murasame340, Heaven's Cloud420, Kiyomori500, Muramasa580, Kikuichimoji660, Masamune740, Chirijiraden820 | R Meatbone Slash200, Blade Grasp700; S Equip Knife(Katana)400, Two Hands900; M Move in Water300 |
| Ninja | Shuriken50, Ball70, Axe120; Knife/Sword/Hammer/Katana/Ninja Sword/Spear/Stick/Knight Sword/Dictionary 각각100 | R Sunken State900, Abandon400; S Two Swords900; M Walk on Water420 |
| Calculator | CT250, Level350, Exp200, Height250, Prime Number300, 배수5 200, 배수4 400, 배수3 600 | R Distribute200, Damage Split300; S Gained Exp Up200; M Move-Get Experience400, Move-Get JP360 |
| Bard | Angel Song/Life Song/Cheer Song/Battle Song/Magic Song/Nameless Song/Last Song 각각100 | R MA Save450, Face Up500; M Move+3 1,000, Fly1,200 |
| Dancer | Witch Hunt/Wiznaibus/Slow Dance/Polka Polka/Disillusion/Nameless Dance/Last Dance 각각100 | R A Save550, Brave Up500; M Jump+3 1,000, Fly1,200 |
| Mime | Mimic 내장, JP 구매 목록 없음 | 별도 장착·구매 목록 없음 |

[문서: Squire–Monk][FEFFT-PS01][FEFFT-PS02][FEFFT-PS03][FEFFT-PS04][FEFFT-PS05]
[문서: Priest–Thief][FEFFT-PS06][FEFFT-PS07][FEFFT-PS08][FEFFT-PS09][FEFFT-PS10]
[문서: Mediator–Samurai][FEFFT-PS11][FEFFT-PS12][FEFFT-PS13][FEFFT-PS14][FEFFT-PS15]
[문서: Ninja–Mime][FEFFT-PS16][FEFFT-PS17][FEFFT-PS18][FEFFT-PS19][FEFFT-PS20][FEFFT-FFT36]

**카탈로그의 출처 충돌과 명칭 정정:**

- Fandom Black Mage 페이지는 Fire3 계열500, Fire4 계열300(original)/350, Flare300(original)/350로 적는 반면 PS 명시 데이터베이스는480/850/900을 준다. 위 표는 **PS 명시 표의 전사값**이며 해당 상충은 `[미확인]`이다. 최상위 주문 전체를 수백 JP로 싸게 살 수 있다고 이 표와 별개로 일반화하지 않는다. [미확인][FEFFT-FFT28][FEFFT-PS07]
- Priest Cure3는 PS표400/Fandom450, Time Mage Reflect와 Quick은 PS표200/300/Fandom300/800 등의 충돌이 있다. 역시 위 표는 PS표를 따르되 정밀 검산에서는 재확인 대상이다. [미확인][FEFFT-PS06][FEFFT-FFT27][FEFFT-PS08][FEFFT-FFT29]
- Archer Charge+10/+20, Speed Save도 PS표600/1,000/800과 Fandom700/1,200/900으로 다르다. 후대 수치를 PS로 자동 대체하지 않았다. 두 자료 모두 Charge 표에 Now를 출력하므로 **그 Speed 열은 충전 없음의 근거로 채택하지 않는다**. [미확인][FEFFT-PS04][FEFFT-FFT24]
- Dancer의 Disillusion은 PS 데이터베이스 개별 목록에서 빠져 있으나 Fandom Dancer의7곡 목록에 포함되어 보완했다. Samurai/Ninja 수중 이동 능력은 PS 명칭 혼동이 있어 효과 기준으로 정리했다. Samurai는 깊은 물, Ninja는 수면 보행 계열이다. [문서][FEFFT-FFT36][FEFFT-FFT34][FEFFT-FFT35]
- PS Gained JP Up200은 PS 전용 표와 개별 능력 문서의 PS 설명이 일치한다. WotL 비용은 Fandom 한 페이지 내부에서200/250이 상충하므로 여기서 확정하지 않는다. [문서/미확인][FEFFT-PS01][FEFFT-FFT71]

### A.1 JP·MP·시전시간은 서로 다른 비용

| 주문(북미 PS 표) | 학습 JP | 사용 MP | 능력 Speed | 읽는 법 |
|---|---:|---:|---:|---|
| Fire |50|6|25|저렴한 기본 속성 주문 |
| Fire2 |200|12|20|위력18, 기본보다 느림 |
| Fire3 |480(상충 주의)|24|15|위력24, 충전 도중 표적 이동 위험 |
| Haste |100|8|50|빠른 시간 강화 |
| Raise |180|10|25|KO 구조, 성공률은 Faith 영향 |
| Holy |600|56|17|비싼 단일 대상 공격 |
| Zodiac |JP 구매 불가|99|10|피격생존 학습, 긴 충전 |

[문서][FEFFT-PS07][FEFFT-PS08][FEFFT-PS06][FEFFT-PS12][FEFFT-FFT28][FEFFT-FFT86]

이미50JP를 써 Fire를 배운 뒤에는 매 시전마다50JP를 다시 지불하지 않고6MP를 쓴다. 현재 직업을 바꿔도 Black Magic을 보조 명령으로 장착하면 배운 주문을 쓸 수 있다. [추론: 위 비용의 적용][S02 pp.33–35][FEFFT-PS07]

## 부록 B. Awakening 클래스별 Pair Up 기본 보너스 전표

아래는 **후열 클래스 자체의 보너스**이며 순수 능력 구간·지원 단계 보너스를 아직 더하지 않은 값이다. 0인 능력에 C/B/A/S 보너스를 새로 만들지 않는다. Move는 지원 단계 증액에서 제외한다. [문서][FEFFT-FE13 §Awakening/Class bonuses][FEFFT-FE07]

| 클래스 | 0이 아닌 기본 보너스 |
|---|---|
| Lord / Great Lord | Spd3·Luck3 / Spd4·Luck4 |
| Tactician / Grandmaster | Str1·Mag1·Skl2·Spd2 / Str2·Mag2·Skl2·Spd2 |
| Cavalier / Paladin | Str2·Skl1·Spd1·Def2 / Str2·Skl2·Spd2·Def2 |
| Great Knight | Str3·Def3·Move1 |
| Knight / General | Str2·Def4 / Str3·Def5 |
| Barbarian / Berserker | Str4·Spd2 / Str5·Spd3 |
| Fighter / Warrior | Str4·Def2 / Str5·Def3 |
| Mercenary / Hero | Skl2·Spd3·Def1 / Skl3·Spd3·Def2 |
| Bow Knight | Skl3·Spd3·Move1 |
| Archer / Sniper | Str2·Skl2·Def2 / Str3·Skl3·Def2 |
| Myrmidon / Swordmaster | Spd4·Luck2 / Spd5·Luck3 |
| Thief / Assassin | Skl2·Spd2·Move1 / Str2·Skl2·Spd4 |
| Trickster | Mag2·Skl1·Spd3·Move1 |
| Pegasus / Falcon Knight | Spd3·Res3 / Spd4·Res4 |
| Dark Flier | Mag3·Spd3·Res2 |
| Wyvern Rider / Lord | Str3·Def3 / Str4·Def4 |
| Griffon Rider | Str3·Luck1·Def2·Move1 |
| Troubadour / Valkyrie | Mag2·Spd1·Res3 / Mag3·Spd2·Res3 |
| Priest/Cleric | Mag2·Luck2·Res2 |
| War Monk/War Cleric | Str2·Mag2·Luck2·Res2 |
| Mage / Sage | Mag4·Skl2 / Mag4·Skl2·Res2 |
| Dark Mage / Sorcerer | Mag3·Def3 / Mag3·Def2·Res3 |
| Dark Knight | Mag2·Def3·Res1·Move1 |
| Manakete | Str2·Mag2·Def2·Res2 |
| Taguel | Str3·Skl2·Spd3 |
| Villager / Dancer | Skl3·Luck3 / Spd3·Luck3 |
| Lodestar | Str2·Spd3·Luck3 |
| Conqueror | Str2·Spd2·Def2·Move1 |
| Dread Fighter | Str3·Mag1·Spd1·Res3 |
| Bride | Mag2·Spd2·Luck2·Def2 |

[문서][FEFFT-FE13 §Awakening/Class bonuses]

## 부록 C. 인용 자료 및 검증 방식

모든 인용 ID는 아래의 원문 링크와 공용 `sources.json`의 동일 ID로 연결된다. Fandom은 직접 페이지 차단 시 공개 MediaWiki API의 본문 wikitext를 읽었고, Serenes Forest/Fire Emblem Wiki/Caves of Narshe는 직접 본문을 읽었다. Nintendo FE 매뉴얼은 기존 S01과 같은 PDF를 Jina Reader로 다시 열람했고 FFT는 기존 S02의 Archive OCR을 다시 읽었다. HTTP200이더라도 리디렉션·동음이의·차단 안내만 있는 응답은 근거에 넣지 않았다.

자료는 공식 저작 매뉴얼과 커뮤니티/전문 데이터베이스가 혼합되어 있다. 제목의 '위키 수준'은 상세도의 목표이지 본 문서 또는 커뮤니티 표가 제작사 공식 인증을 받았다는 뜻이 아니다. 게임을 실행해 수치를 실측한 자료는 아니다.

- **S01** Nintendo / Intelligent Systems, *Awakening 전자 매뉴얼*, §§2–20. [PDF](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_3ds_2/fire_emblem__awakening_1/ElectronicManual_Nintendo3DS_FireEmblemAwakening_EN.pdf)
- **S02** Square, *FFT 일본 PS 설명서*, pp.8–39. [Archive 보관본](https://archive.org/details/final-fantasy-tactics-manual-scan-jp-play-station-psx)
- **FEFFT-FE01** [Fire Emblem Awakening - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Fire_Emblem_Awakening)
- **FEFFT-FE02** [Calculations - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/calculations/)
- **FEFFT-FE05** [Children - Serenes Forest](https://serenesforest.net/awakening/characters/children/)
- **FEFFT-FE07** [Pair Up - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/pair-up/)
- **FEFFT-FE09** [Forging - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/forging/)
- **FEFFT-FE11** [Difficulty - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Difficulty)
- **FEFFT-FE12** [Downloadable content in Fire Emblem Awakening - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Downloadable_content_in_Fire_Emblem_Awakening)
- **FEFFT-FE13** [Pair Up - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Pair_Up)
- **FEFFT-FE14** [Inheritance - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Inheritance)
- **FEFFT-FE15** [List of classes in Fire Emblem Awakening - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/List_of_classes_in_Fire_Emblem_Awakening)
- **FEFFT-FE18** [Introduction - Serenes Forest](https://serenesforest.net/awakening/classes/introduction/)
- **FEFFT-FE19** [Class Changing - Serenes Forest](https://serenesforest.net/awakening/classes/class-changing/)
- **FEFFT-FE20** [Skills - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/skills/)
- **FEFFT-FE21** [Shops - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/shops/)
- **FEFFT-FE22** [Gaiden Chapters - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/gaiden-chapters/)
- **FEFFT-FE23** [Dual System - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/dual-system/)
- **FEFFT-FE24** [Supports - Serenes Forest](https://serenesforest.net/awakening/characters/supports/)
- **FEFFT-FE26** [Renown - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/renown/)
- **FEFFT-FE27** [World Map - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/world-map/)
- **FEFFT-FE28** [Items - Serenes Forest](https://serenesforest.net/awakening/inventory/items/)
- **FEFFT-FE29** [Base Stats - Serenes Forest](https://serenesforest.net/awakening/classes/base-stats/)
- **FEFFT-FE30** [Class Sets - Serenes Forest](https://serenesforest.net/awakening/characters/class-sets/)
- **FEFFT-FE31** [Merchants - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/merchants/)
- **FEFFT-FE33** [Forge - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Forging)
- **FEFFT-FE39** [North America - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/downloadable-content/north-america/)
- **FEFFT-FE40** [True hit - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/True_hit)
- **FEFFT-FE45** [Grima (chapter) - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Grima_(chapter))
- **FEFFT-FE46** [Main Story - Serenes Forest](https://serenesforest.net/awakening/characters/recruitment/main-story/)
- **FEFFT-FE47** [Support Basics - Serenes Forest](https://serenesforest.net/awakening/characters/supports/support-basics/)
- **FEFFT-FE48** [Support Growth - Serenes Forest](https://serenesforest.net/awakening/characters/supports/support-growth/)
- **FEFFT-FE50** [Gameplay modes - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Casual_Mode)
- **FEFFT-FE51** [Full - Serenes Forest](https://serenesforest.net/awakening/characters/growth-rates/full/)
- **FEFFT-FE52** [Barracks - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/barracks/)
- **FEFFT-FE54** [Hints and Secrets - Serenes Forest](https://serenesforest.net/awakening/miscellaneous/hints-and-secrets/)
- **FEFFT-FE58** [Swords - Serenes Forest](https://serenesforest.net/awakening/inventory/swords/)
- **FEFFT-FE59** [Staves - Serenes Forest](https://serenesforest.net/awakening/inventory/staves/)
- **FEFFT-FE60** [Inventory - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Inventory)
- **FEFFT-FE61** [Terrain](https://fireemblem.fandom.com/wiki/Terrain)
- **FEFFT-FE63** [Level - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Level)
- **FEFFT-FE64** [Hit rate - Fire Emblem Wiki](https://fireemblemwiki.org/wiki/Hit_rate)
- **FEFFT-FFT01** [Final Fantasy Tactics](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics)
- **FEFFT-FFT02** [Final Fantasy Tactics jobs](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics_jobs)
- **FEFFT-FFT05** [Faith (stat)](https://finalfantasy.fandom.com/wiki/Faith_(stat))
- **FEFFT-FFT07** [Errands](https://finalfantasy.fandom.com/wiki/Errands)
- **FEFFT-FFT13** [Bravery (Tactics)](https://finalfantasy.fandom.com/wiki/Bravery_(Tactics))
- **FEFFT-FFT15** [Midlight's Deep (Tactics)](https://finalfantasy.fandom.com/wiki/Midlight%27s_Deep_(Tactics))
- **FEFFT-FFT17** [Geomancer (Tactics)](https://finalfantasy.fandom.com/wiki/Geomancer_(Tactics))
- **FEFFT-FFT18** [Final Fantasy Tactics stats](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics_stats)
- **FEFFT-FFT19** [Squire (Tactics)](https://finalfantasy.fandom.com/wiki/Squire_(Tactics))
- **FEFFT-FFT20** [Chemist (Tactics)](https://finalfantasy.fandom.com/wiki/Chemist_(Tactics))
- **FEFFT-FFT21** [Arithmetician (Tactics)](https://finalfantasy.fandom.com/wiki/Arithmetician_(Tactics))
- **FEFFT-FFT22** [Final Fantasy Tactics statuses](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics_statuses)
- **FEFFT-FFT23** [Knight (Tactics)](https://finalfantasy.fandom.com/wiki/Knight_(Tactics))
- **FEFFT-FFT24** [Archer (Tactics)](https://finalfantasy.fandom.com/wiki/Archer_(Tactics))
- **FEFFT-FFT25** [Monk (Tactics)](https://finalfantasy.fandom.com/wiki/Monk_(Tactics))
- **FEFFT-FFT26** [Thief (Tactics)](https://finalfantasy.fandom.com/wiki/Thief_(Tactics))
- **FEFFT-FFT27** [White Mage (Tactics)](https://finalfantasy.fandom.com/wiki/White_Mage_(Tactics))
- **FEFFT-FFT28** [Black Mage (Tactics)](https://finalfantasy.fandom.com/wiki/Black_Mage_(Tactics))
- **FEFFT-FFT29** [Time Mage (Tactics)](https://finalfantasy.fandom.com/wiki/Time_Mage_(Tactics))
- **FEFFT-FFT31** [Orator (Tactics)](https://finalfantasy.fandom.com/wiki/Orator_(Tactics))
- **FEFFT-FFT32** [Summoner (Tactics)](https://finalfantasy.fandom.com/wiki/Summoner_(Tactics))
- **FEFFT-FFT34** [Samurai (Tactics)](https://finalfantasy.fandom.com/wiki/Samurai_(Tactics))
- **FEFFT-FFT35** [Ninja (Tactics)](https://finalfantasy.fandom.com/wiki/Ninja_(Tactics))
- **FEFFT-FFT36** [Dancer (Tactics)](https://finalfantasy.fandom.com/wiki/Dancer_(Tactics))
- **FEFFT-FFT37** [Bard (Tactics)](https://finalfantasy.fandom.com/wiki/Bard_(Tactics))
- **FEFFT-FFT38** [Mime (Tactics)](https://finalfantasy.fandom.com/wiki/Mime_(Tactics))
- **FEFFT-FFT40** [Wonder (Tactics)](https://finalfantasy.fandom.com/wiki/Wonder_(Tactics))
- **FEFFT-FFT41** [Artefact (Tactics)](https://finalfantasy.fandom.com/wiki/Artefact_(Tactics))
- **FEFFT-FFT42** [Final Fantasy Tactics weapons](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics_weapons)
- **FEFFT-FFT43** [KO (Tactics)](https://finalfantasy.fandom.com/wiki/KO_(Tactics))
- **FEFFT-FFT44** [Poach (Tactics)](https://finalfantasy.fandom.com/wiki/Poach_(Tactics))
- **FEFFT-FFT45** [Zodiac (term)](https://finalfantasy.fandom.com/wiki/Zodiac_(term))
- **FEFFT-FFT52** [Final Fantasy Tactics version differences](https://finalfantasy.fandom.com/wiki/Final_Fantasy_Tactics_version_differences)
- **FEFFT-FFT54** [Evasion](https://finalfantasy.fandom.com/wiki/Evasion)
- **FEFFT-FFT55** [Jump (stat)](https://finalfantasy.fandom.com/wiki/Jump_(stat))
- **FEFFT-FFT57** [Outfitter](https://finalfantasy.fandom.com/wiki/Outfitter)
- **FEFFT-FFT60** [Aries (zodiac)](https://finalfantasy.fandom.com/wiki/Aries_(zodiac))
- **FEFFT-FFT71** [JP Boost (Tactics)](https://finalfantasy.fandom.com/wiki/JP_Boost_(Tactics))
- **FEFFT-FFT76** [Jump (Tactics)](https://finalfantasy.fandom.com/wiki/Jump_(Tactics))
- **FEFFT-FFT83** [Preach (Tactics)](https://finalfantasy.fandom.com/wiki/Preach_(Tactics))
- **FEFFT-FFT84** [Praise (Tactics)](https://finalfantasy.fandom.com/wiki/Praise_(Tactics))
- **FEFFT-FFT85** [Speechcraft](https://finalfantasy.fandom.com/wiki/Speechcraft)
- **FEFFT-FFT86** [Zodiark (Tactics)](https://finalfantasy.fandom.com/wiki/Zodiark_(Tactics))
- **FEFFT-FFT87** [Haste (Tactics status)](https://finalfantasy.fandom.com/wiki/Haste_(Tactics_status))
- **FEFFT-FFT88** [Slow (Tactics status)](https://finalfantasy.fandom.com/wiki/Slow_(Tactics_status))
- **FEFFT-FFT89** [Random encounter](https://finalfantasy.fandom.com/wiki/Random_encounter)
- **FEFFT-FFT90** [Level grinding](https://finalfantasy.fandom.com/wiki/Level_grinding)
- **FEFFT-PS01** [FFT 북미 PS Squire](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Squire)
- **FEFFT-PS02** [FFT 북미 PS Chemist](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Chemist)
- **FEFFT-PS03** [FFT 북미 PS Knight](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Knight)
- **FEFFT-PS04** [FFT 북미 PS Archer](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Archer)
- **FEFFT-PS05** [FFT 북미 PS Monk](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Monk)
- **FEFFT-PS06** [FFT 북미 PS Priest](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Priest)
- **FEFFT-PS07** [FFT 북미 PS Wizard](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Wizard)
- **FEFFT-PS08** [FFT 북미 PS Time Mage](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Time+Mage)
- **FEFFT-PS09** [FFT 북미 PS Oracle](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Oracle)
- **FEFFT-PS10** [FFT 북미 PS Thief](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Thief)
- **FEFFT-PS11** [FFT 북미 PS Mediator](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Mediator)
- **FEFFT-PS12** [FFT 북미 PS Summoner](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Summoner)
- **FEFFT-PS13** [FFT 북미 PS Geomancer](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Geomancer)
- **FEFFT-PS14** [FFT 북미 PS Lancer](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Lancer)
- **FEFFT-PS15** [FFT 북미 PS Samurai](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Samurai)
- **FEFFT-PS16** [FFT 북미 PS Ninja](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Ninja)
- **FEFFT-PS17** [FFT 북미 PS Calculator](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Calculator)
- **FEFFT-PS18** [FFT 북미 PS Bard](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Bard)
- **FEFFT-PS19** [FFT 북미 PS Dancer](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Dancer)
- **FEFFT-PS20** [FFT 북미 PS Mime](https://www.cavesofnarshe.com/fft/jobs.php?fftmode=psx&job=Mime)
