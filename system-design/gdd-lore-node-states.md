# 노드 상태

열두 노드는 기존 아키텍처 지도의 id다. 상태 칸은 워크트리에서 다시 읽은 문장만 적는다. 그 문장에 없는 이름은 `미정`이다. `글로스`는 정본 토큰이 아니다.

| id | 상태 | 근거 |
|---|---|---|
| character | 역할: 지휘관, 배속, 독립 요원, 사용 불가. 한 시점에 주 전투 클래스 하나 | `GDD/rules/Hero-Squads-and-Simultaneous-Turns.md` |
| house | 미정 | 세력 수명 주기를 이 워크트리 규칙에서 다시 읽지 못했다 |
| strategy | 계획, 일괄 해결. 태세: 통상 행군, 강행군, 매복. 주둔·야영은 제안이라 제외 | `GDD/rules/Hero-Squads-and-Simultaneous-Turns.md` |
| engagement | 말하다, 숨다, 붙다. 비전투 해결은 정식 해결 | `GDD/rules/Campaign-Loop.md`, `GDD/rules/Travel-and-Encounters.md` |
| battle | 개시, 진행, 종결 (글로스). 일시정지는 이 파티의 닫힌 전투만. 기한 만료 기본값이며 소유자 명시 결정이 아니다 | `GDD/rules/Strategy-Battle-Roundtrip.md` |
| return | 결말: 귀환, 정착, 정복, 방랑, 교역. 귀환은 강제 엔딩이 아니다. 정산은 귀환 명령이 아니다 | `GDD/rules/Campaign-Loop.md`, `GDD/rules/Strategy-Battle-Roundtrip.md` |
| atlas | 미정 | `WEB/lore/World-Narrative-Atlas.md`를 이 표 작성 턴에 다시 열지 않았다 |
| places | 미정 | `held`, `contested`, `vacant`를 이 턴에 다시 확인하지 않았다 |
| ecology | 도감 항목. 런타임 서식·격파는 미정 | 도감은 목록 계약. 런타임 상태는 규칙에 없다 |
| rules | 목표 계약 대 POC 역사. 카드 전투는 목표가 아니다 | `GDD/rules/Realtime-Formation-Card-Battle.md` |
| save | 사건 기록. 쓰임새별로 나눈 무작위 값. 명확한 오류. 조용한 복구 없음 | `GDD/rules/Save-and-Determinism.md` |
| pov | 파티 닫힘. 공유 캠페인과 다른 파티는 계속 | `GDD/rules/Strategy-Battle-Roundtrip.md` |

가문 멸망, 생태의 전투 참여, 전투 자동 정산은 적지 않았다.
