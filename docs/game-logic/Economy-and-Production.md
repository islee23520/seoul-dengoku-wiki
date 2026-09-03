# 경제와 생산

경제는 돈 하나가 아니라 생존 자원, 제작 자원, 노동, 전력과 실제 운송 능력의 결합입니다. 모든 수치는 첫 프로토타입용 **설계 가정**입니다.

## 입력과 출력

| 입력 | 단위·기본값 | 출력 |
|---|---:|---|
| 식량·물·의약품 | 역별 재고 | 주민 생존, 치료, 노동 지속성 |
| 전력 | 전력점 | 조명, 펌프, 제작, 냉장 |
| 부품·탄약 | 물자점 | 수리와 전술 장비 |
| 직능 인력 | 작업교대 | 생산·행정·호송 수행 |
| 연결 처리량 | 0~1 | 반입·반출 상한 |
| 교환권 | 역별 장부 | 시장 거래와 계약 정산 |

## 계산 규칙

하루 시작에 주민용 물·식량·응급 의료를 먼저 예약하고, 그 뒤 시설 입력과 시장 주문을 배정합니다. 생산량은 노동, 입력, 전력, 시설 상태 중 가장 낮은 충족률로 제한됩니다. 요구량이 0이거나 필요 입력 집합이 비어 있으면 해당 충족률은 1이며, 어떤 경우에도 0으로 나누지 않습니다.

```text
노동률 = 필요인력이 0이면 1, 아니면 clamp(가용직능인력 / 필요인력, 0, 1)
입력률 = 필요 입력 집합이 비어 있으면 1, 아니면 min_r(필요량_r이 0이면 1, 아니면 clamp(배정량_r / 필요량_r, 0, 1))
전력률 = 필요전력이 0이면 1, 아니면 clamp(배정전력 / 필요전력, 0, 1)
생산량 = 기본산출 * min(노동률, 입력률, 전력률) * 시설상태
부족률_r = 총수요_r이 0이면 0, 아니면 clamp(1 - 충족수요_r / 총수요_r, 0, 1)
노동지속성 = clamp(1 - sum_r(감점계수_r * 부족률_r), 0.2, 1)
```

가격은 재고를 만들지 않습니다. 실제 물건, 구매력, 접근권과 운송 용량이 있어야 거래가 성립합니다.

## 기본 수치

| 항목 | 기본값 | 최소 | 최대 |
|---|---:|---:|---:|
| 정상 매수·매도 반폭 | 10% | 5% | 35% |
| 고립 추가 반폭 | 0~10% | 0% | 10% |
| 물 부족 노동 감점 계수 | 0.70 | 0 | 1 |
| 식량 부족 노동 감점 계수 | 0.50 | 0 | 1 |
| 전력 부족 노동 감점 계수 | 0.30 | 0 | 1 |
| 최저 노동 지속성 | 20% | 0% | 100% |
| 역당 행정 수요 | 1점 | 0.5 | 3 |

```mermaid
flowchart LR
  A[현지 생산·도착 화물] --> B[필수 주민 몫 예약]
  B --> C[시설 입력 배정]
  C --> D[생산]
  D --> E[주민 소비]
  E --> F[시장 주문]
  F --> G[마감 재고·가격·부족 영수증]
```

## 경계 상황

- 수요가 0이면 부족률도 0이며 0으로 나누지 않습니다.
- 필요 노동이 0이면 노동률은 1이며 0으로 나누지 않습니다.
- 필요 전력이 0이면 전력률은 1이며 0으로 나누지 않습니다.
- 개별 입력의 필요량이 0이면 그 입력의 충족률은 1입니다.
- 필요 입력 집합이 비어 있으면 입력률은 1입니다.
- 물·식량·전력 부족은 다음 날 노동을 낮추고, 의약품 부족은 치료 행동 자체를 제한합니다.
- 탄약 부족은 주민 노동이 아니라 전술 장비와 출격 가능 수량을 제한합니다.
- 인력 부족 시 자격 없는 인물을 자동 대체하지 않고 생산 주문이 부분 완료됩니다.
- 고립된 자급 역은 해당 자원의 가격에 임의의 고립 감점을 받지 않습니다.
- 과확장 시 노선 산출은 최대 50%, 현지 산출은 최대 25%까지 감소합니다.

## 계산 예시

물 수요 100 중 50만 충족되고 식량·전력은 모두 충족되면 노동 지속성은 `clamp(1 - 0.70*0.5, 0.2, 1)=0.65`입니다. 필요 노동 10교대 중 8교대, 입력 70%, 전력 90%, 시설 상태 80%라면 생산량은 기본산출 100의 `100 * min(0.8,0.7,0.9) * 0.8 = 56`입니다. 필요 노동·전력·입력이 모두 0이고 필요 입력 집합이 비어 있으면 같은 시설 상태에서 생산량은 `100 * min(1,1,1) * 0.8 = 80`입니다.

```json economy-formula-cases
[
  {"name":"labor-zero-requirement","kind":"labor","available":0,"required":0,"expected":1},
  {"name":"labor-partial-requirement","kind":"labor","available":8,"required":10,"expected":0.8},
  {"name":"power-zero-requirement","kind":"power","allocated":0,"required":0,"expected":1},
  {"name":"power-capped-requirement","kind":"power","allocated":12,"required":10,"expected":1},
  {"name":"input-empty-requirement-set","kind":"input","requirements":[],"expected":1},
  {"name":"input-all-zero-requirements","kind":"input","requirements":[{"allocated":0,"required":0},{"allocated":7,"required":0}],"expected":1},
  {"name":"input-zero-and-positive","kind":"input","requirements":[{"allocated":0,"required":0},{"allocated":7,"required":10}],"expected":0.7},
  {"name":"shortage-zero-demand","kind":"shortage","filled":0,"demand":0,"expected":0},
  {"name":"documented-mixed-production","kind":"production","baseOutput":100,"laborAvailable":8,"laborRequired":10,"powerAssigned":90,"powerRequired":100,"inputs":[{"assigned":70,"required":100}],"facility":0.8,"expected":56},
  {"name":"all-zero-requirement-production","kind":"production","baseOutput":100,"laborAvailable":0,"laborRequired":0,"powerAssigned":0,"powerRequired":0,"inputs":[],"facility":0.8,"expected":80}
]
```
