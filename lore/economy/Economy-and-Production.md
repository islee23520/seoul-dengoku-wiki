# 경제와 생산

**가. 도표의 지위**

생산 시설 주변에 노동을 배치한다. 노선 용량에 맞춰 재고를 운송한다.

경제는 생존 자원, 제작 자원, 노동, 전력과 실제 운송 능력으로 구성된다.

## 입력과 출력

**가. 자원과 산출**

| 입력 | 단위·기본값 | 출력 |
|---|---|---|
| 식량·물·의약품 | 역별 재고 | 주민 생존, 치료, 노동 지속성 |
| 전력 | 전력점 | 조명, 펌프, 제작, 냉장 |
| 부품·탄약 | 물자점 | 수리와 전술 장비 |
| 직능 인력 | 작업교대 | 생산·행정·호송 수행 |
| 연결 처리량 | 0~1 | 반입·반출 상한 |
| 교환권 | 역별 장부 | 시장 거래와 계약 정산 |

## 기본 수치

**가. 설계 기본값**

| 항목 | 기본값 | 최소 | 최대 |
|---|---|---|---|
| 정상 매수·매도 반폭 | 10% | 5% | 35% |
| 고립 추가 반폭 | 0~10% | 0% | 10% |
| 가격 격리 민감도 | 0.35 | 0 | 1 |
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

**가. 분모와 공급 제한**

## 계산 예시

**가. 부족률과 생산량**

물 수요 100 중 50을 충족하고 식량·전력을 모두 충족하면 노동 지속성은 `clamp(1 - 0.70*0.5, 0.2, 1)=0.65`이다. 필요 노동 10교대 중 8교대, 입력 70%, 전력 90%, 시설 상태 80%이면 기본산출 100의 생산량은 `100 * min(0.8,0.7,0.9) * 0.8 = 56`이다. 필요 노동·전력·입력이 모두 0이고 필요 입력 집합이 비어 있으면 같은 시설 상태에서 생산량은 `100 * min(1,1,1) * 0.8 = 80`이다.

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
