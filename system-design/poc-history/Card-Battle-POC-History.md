## 2026-09-07 카드 전투 POC 기록

아래 내용과 문서 첫머리의 그림은 당시 구현과 검증 이력을 보존한다. 현재 목표 규칙이나 새 구현 지시가 아니다.

한 판은 확정된 전투 컨텍스트로 시작해 ResultId 하나로 끝나는 실시간 진형·카드 전투 세션 한 번을 뜻합니다. 한 판 안에서 진형·사기·카드 타이밍이 실시간 전술의 핵심 축이며, 위치·방향·시야는 진형 규칙으로 이어집니다.

POC는 좌우 사이드스크롤 화면, 30Hz 고정 틱, 프레임당 최대 4스텝인 D1 드라이버를 썼다. 일시정지는 해시 입력에서 제외했고 전투 초기화는 정산 전 전투만 시작 상태로 되돌렸다. 이 시점과 일시정지 동작은 현재 목표에 자동 승계하지 않는다.

### 카드 소유권과 POC 명령

- 인물 카드는 `(OwnerUnitId, CardId)`로 상태를 나눴다. 방패벽 300틱, 격려 600틱, 협공 450틱, 기동 재집결 600틱이었다. 공유 거점 카드 보급과 통행은 각각 900틱과 750틱, 최대 2슬롯이었다.
- 분대 명령 `Move`, `Attack`, `SetFacing`은 실행 주체와 목표 위치 또는 대상 `UnitId`를 지정했다.
- 미리보기는 상태를 바꾸지 않았고 확정 때 다시 검사해 한 번 반영했다.
- 소유자 정보가 없는 옛 리플레이는 자동 변환하지 않고 규칙 버전 오류로 거부했다.

### 집계 생존수와 사상자 POC 계약

- 초기 편성은 양측 6개 논리 분대였고 증원은 별도로 추가했다. 각 분대는 병사 4명과 중앙 리더 1명으로 표현했다. 리더는 연출용이며 별도 전투 HP나 정산 ID를 갖지 않았다.
- 초기 생존수는 `ceil(4 * 시작Hp / MaxHp)`로 정했다. HP가 0이면 0이었다.
- 피해를 입으면 생존수는 `min(이전 생존수, ceil(4 * 현재Hp / MaxHp))`로 줄었다. 치료로 쓰러진 병사를 되살리지 않았다.
- 증원은 기존 분대의 회복이 아니라 고유 초기 HP를 가진 별도 분대로 들어왔다.
- 정산은 기존 논리 `UnitId`와 남은 `HP`를 기준으로 `ResultId`와 함께 한 번 확정했다.

### POC 수치

다음 값은 카드 전투 POC의 `BattleRules` 기록이다. 현재 목표의 밸런스 수치로 쓰지 않는다.

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

POC에서는 사기 20 이하, 지휘관 HP 50% 이하, 퇴로 확보가 모두 참일 때만 항복이 성립했다. 이 수치 결합은 현재 목표의 항복 조건이 아니다. 현재 목표에서는 `LegalFallback` 실패가 명령 철수만 막으며, 항복 선택을 없애지 않는다.

### POC가 다룬 것

- 진형(전열, 후열, 측면)과 좌우 정면, 지휘 반경
- 6v6 논리 분대와 분대당 병사 4명·중앙 리더 표시
- 사기 게이지와 항복 판정 수치
- 인물 카드와 거점 카드
- 지형 비용과 엄폐, 장치 조작
- 예고된 증원 위치와 위협 표시
- 부상, 쓰러짐, 포획, 후퇴, 항복과 사망
- 일시정지, 시점 줌, 전투 시작 상태로의 리셋

### POC 구현 상태

- 카드 소유권과 순수 판정 로직의 원본 62개 사례, 소유자 상대 지휘 반경 수정 1개 사례가 검증됐다. 최초 진형 버튼의 Raycast/EventSystem 문제는 남았다.
- 분대 Move/Attack과 방향 명령은 추가 반례 테스트 전 결과만 있어 최종 검증 상태가 보류됐다.
- 집계 생존수와 사상자 처리는 승인됐지만 구현 완료되지 않았다.
- Foundation raycast depth -1 원인은 해결되지 않았다. 원본 SVG 사용 가능 여부는 캐릭터·타이틀·아이콘·역사 텍스처의 권리와 외형 검토를 대신하지 않는다.
