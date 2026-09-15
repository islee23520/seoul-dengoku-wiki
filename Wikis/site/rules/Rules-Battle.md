# 실시간 진형과 카드 전투 규칙

> 출처: docs/game-logic/Realtime-Formation-Card-Battle.md — 계약 수치는 구현 상수를 우선한다.

## 개요

한 판은 확정된 전투 컨텍스트로 시작해 ResultId 하나로 끝난다.
진형과 사기와 카드 타이밍이 한 판의 전술 축이다.
위치와 방향과 시야는 진형 규칙으로 이어진다.

## 핵심 수치

| name | value | unit |
|---|---:|---|
| TicksPerSecond | 30 | Hz |
| MoveTicksPerCell | 10 | ticks per cell |
| AttackCooldownTicks | 30 | ticks |
| MoraleBase | 60 | morale |
| MoraleWarn | 40 | morale |
| MoraleRecoverCap | 80 | morale |
| MoraleRecoveryPerSecond | 5 | morale per second |
| MoraleLossPerDeath | 5 | morale |
| MoraleLossCommanderBelowHalf | 10 | morale |
| SurrenderMoraleMax | 20 | morale |
| SurrenderCommanderHpPercentMax | 50 | percent |
| StrongholdCardSlots | 2 | slots |
| CardEffectTicks | 150 | ticks |
| MaxTicks | 9000 | ticks |
| CommandRadius | 3 | cells |
| RulesVersion | rtfc-owner-cards-v2 | version |
| recharge | 방패벽300/격려600/협공450/기동재집결600/보급900/통행750 | ticks |

## 조항

### RBATTLE-01 한 판의 경계

한 판은 확정된 전투 컨텍스트로 시작한다.
끝은 ResultId 하나다.

### RBATTLE-02 공간과 틱

전투에 들어가도 카메라와 공간 규칙은 안 바뀐다.
고정 직교 아이소메트릭 카메라와 1.5m 4방향 타일 격자 위에 진형을 놓는다.
시간은 30Hz 고정 틱으로 흐른다.

### RBATTLE-03 드라이버와 일시정지

D1 드라이버만 BattleSim.Step을 호출한다.
한 프레임 상한은 4스텝이다.
일시정지는 시뮬레이션 명령이 아니며 해시 입력에서 빠진다.

### RBATTLE-04 명령 단위

개별 병사 직접 조작은 없다.
분대 단위 명령과 카드 타이밍만 다룬다.

### RBATTLE-05 진형과 지휘 반경

전열과 후열과 측면에 분대를 배치하고 4방향 정면을 고른다.
지휘 반경은 3칸이다.
반경 밖 인물은 카드와 협공 대상이 아니다.

### RBATTLE-06 분대 편성과 뷰

초기 편성은 양측 6개 논리 분대다.
총 12분대이며 증원은 따로 붙는다.
각 분대는 병사 뷰 4명과 중앙 리더 1명으로 보인다.

### RBATTLE-07 리더 연출

리더는 연출용이다.
리더 전용 전투 HP와 정산 ID는 없다.

### RBATTLE-08 집계 생존수

집계 생존수는 0부터 4까지다.
초기 생존수는 ceil(4 * 시작Hp / MaxHp)로 연다.
시작Hp가 0이면 생존수는 0이다.

### RBATTLE-09 단조 감소

피해를 입으면 생존 수는 min(이전 생존수, ceil(4 * 현재Hp / MaxHp))로 줄어든다.
치료를 받아도 쓰러진 병사는 부활하지 않는다.
현재 HP로 매번 다시 계산해 치료를 부활로 바꾸지 않는다.

### RBATTLE-10 분대 명령

분대 명령은 Move와 Attack과 SetFacing이다.
실행 주체 actor와 목표 위치 또는 대상 UnitId를 명시한다.

### RBATTLE-11 인물 카드

인물 카드 상태는 (OwnerUnitId, CardId) 쌍으로 관리한다.
소유자마다 재충전 타이머가 독립이다.
덱 구축과 무작위 드로우는 없다.

### RBATTLE-12 거점과 재충전

거점 카드는 최대 2슬롯이고 아군 분대 전체가 공유한다.
방패벽 300틱 격려 600틱 협공 450틱 기동재집결 600틱을 소유자별로 유지한다.
보급은 900틱 통행은 750틱이며 효과 지속은 150틱이다.

### RBATTLE-13 미리보기와 확정

Preview는 상태를 변경하지 않는 순수 판정이다.
Submit 시점에 유효성을 다시 검증한다.
반영은 한 번뿐이다.

### RBATTLE-14 사기

기본 사기는 60이다.
경고선은 40이고 회복 상한은 80이다.
초당 회복 5와 사망당 손실 5와 지휘관 반피 이하 손실 10을 적용한다.

### RBATTLE-15 항복과 후퇴

항복은 사기 20 이하와 지휘관 HP 50% 이하와 열린 퇴로가 모두 참일 때만 성립한다.
지휘관 타일 점거는 퇴로 차단과 같지 않다.
후퇴 판단은 사기 경고선 40을 넘기기 전에 둔다.

### RBATTLE-16 결정론

전장 생성과 명중과 피해와 사기와 증원과 카드 플레이는 전투 시드와 틱 스탬프 명령 기록으로 재현한다.
동일한 입력 기록이 다른 결과를 내면 검증 실패다.

### RBATTLE-17 리플레이 버전

규칙 버전은 rtfc-owner-cards-v2다.
소유자 없는 이전 리플레이는 재생 전 버전 오류를 명시하고 거부한다.
원본 파일 자동 변환과 삭제는 하지 않는다.

### RBATTLE-18 정산

정산과 결과 기록은 논리 UnitId와 남은 HP를 기준으로 한다.
ResultId와 함께 단 1회 확정된다.

### RBATTLE-19 리셋 범위

전투 초기화는 정산 전에 현재 전투만 시작 상태로 되돌린다.
캠페인 진행과 이미 반영한 정산은 건드리지 않는다.

### RBATTLE-20 표현과 코어

UI의 시각 이동 Transform은 Core의 논리 위치를 따라 표현한다.
화면 이동으로 Core 이동 판정을 대신하지 않는다.

### RBATTLE-21 증원

증원 병력은 기존 분대 인원 회복이 아니다.
고유 초기 HP를 가진 별도 분대로 전장에 진입한다.

### RBATTLE-22 이동과 공격 틱

칸 이동은 10틱이다.
공격 쿨다운은 30틱이다.
한 판 상한은 9000틱이다.

## 판정 순서

1. RulesVersion rtfc-owner-cards-v2와 전투 시드를 고정한다.
2. 진형과 4방향 정면과 지휘 반경 3칸 안의 대상을 확정한다.
3. 집계 생존수를 ceil(4 * 시작Hp / MaxHp)로 연다.
4. 30Hz로 틱을 진행한다.
5. D1만 BattleSim.Step을 부르며 프레임당 최대 4스텝을 허용한다.
6. 명령은 actor와 목표만 기록하고 일시정지는 해시에서 뺀다.
7. Preview로 순수 판정한 뒤 Submit에서 다시 검증해 한 번만 반영한다.
8. 이동 10틱과 공격 쿨다운 30틱을 적용한다.
9. 카드는 소유자 재충전과 지휘 반경을 통과한 뒤에만 발동한다.
10. 피해 후 생존수를 단조 감소로 갱신한다.
11. 사기를 갱신한다.
12. 항복 세 조건 또는 MaxTicks 9000에서 판을 닫는다.
13. UnitId와 남은 HP로 ResultId를 1회 확정한다.

## 금지 사항

- 개별 병사를 직접 조작하는 일
- 덱 구축
- 무작위 드로우
- Preview가 상태를 바꾸는 일
- Submit을 두 번 반영하는 일
- 소유자 없는 리플레이를 재생하는 일
- 원본 리플레이 자동 변환
- 원본 리플레이 삭제
- UI Transform으로 Core 이동 판정을 대신하는 일
- 치료로 쓰러진 병사를 다시 세우는 일
- 증원을 기존 분대 인원 회복으로 처리하는 일
- 일시정지를 시뮬레이션 명령으로 기록하는 일
- 전투 리셋으로 캠페인 진행을 되돌리는 일
- 이미 반영한 정산을 되돌리는 일
- 지휘관 타일 점거를 퇴로 차단으로 취급하는 일
- 리더에게 별도 전투 HP를 부여하는 일
- 리더에게 정산 ID를 부여하는 일
- 동일 입력이 다른 결과를 내는 일

## 출처

- docs/game-logic/Realtime-Formation-Card-Battle.md — 잠긴 수치와 Core 계약 A·B
- 문서와 구현이 다르면 구현의 같은 이름 상수를 우선한다
- 본문의 재충전 300~900틱은 카드별 잠긴 값의 범위 요약이다. 표의 카드별 틱을 쓴다
- 항복 본문과 표는 SurrenderMoraleMax 20과 SurrenderCommanderHpPercentMax 50으로 같다
