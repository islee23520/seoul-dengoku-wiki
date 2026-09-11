# 유니티 구조

![유니티 화면에서 칸에 누가 서 있고 어느 쪽을 보며 어디까지 보이는지](https://github.com/islee23520/seoul-kenshi/blob/main/docs/assets/wiki/isometric-grammar.svg?raw=true)

## 기준선

현재 기반은 Unity `6000.7.0a5`입니다. 시험판이므로 편집기 판본과 패키지 잠금 파일을 함께 고정하고, 판본을 올리기 전에 따로 검증합니다.

현재 구현된 기반은 다음입니다.

- Unity `6000.7.0a5` 프로젝트
- 장르 계약 JSON과 상수, EditMode 장르 계약 테스트
- URP, Input System, Test Framework, VContainer `1.19.0`
- `Bootstrap.unity` App scope와 FSM, `Foundation.unity` 화면 child scope
- 단일 scene-load 권한과 정적 아키텍처 게이트

이 기반 위에 `Unity POC 통합 코어 루프`가 실렸습니다. `MainTitle` 화면 lease, 세 역 노선, 교섭·우회, 30Hz 실시간 진형·카드 전투(`rtfc-owner-cards-v2`), 정확히 한 번 정산, uGUI HUD가 `Janseon.Core`와 `Janseon.Foundation`에 있습니다. 생성 아트 슬롯·16국 캠페인·집계 사상자 표현은 아직 완료가 아닙니다.

## 영역별 책임

현재 저장소 어셈블리는 `Janseon.Core`(엔진 금지), `Janseon.Foundation`, `Janseon.Data`, `Janseon.Art`입니다. 전투 계약과 시뮬레이션은 Core 안의 `Battle.Contracts`·`Battle.Sim` 네임스페이스이고, 별도 `Janseon.Battle` 어셈블리는 없습니다.

| 모듈 | 책임 | UnityEngine 참조 |
|---|---|---|
| `Janseon.Core` | ID, 시간, 명령, 사건, 노선, 캠페인, 정산, 실시간 진형·카드 전투 | 금지 |
| `Janseon.Data` | Unity 저작 데이터 | 허용 |
| `Janseon.Foundation` | 씬 흐름, 화면, uGUI, 전투 드라이버 | 허용 |
| `Janseon.Art` | 런타임 슬롯·후보 | 허용 |

## 규칙

- 엔진 독립 모듈에는 전역 가변 상태를 두지 않습니다.
- 화면은 상태를 직접 수정하지 않고 명령을 보냅니다.
- 모든 상태 변화는 사건 원장에 기록합니다.
- 고급 패키지는 실제 사용처와 실패 테스트가 생긴 뒤 추가합니다.

