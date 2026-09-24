# 로어 작성 규칙

## 공개 본문과 집필 규칙의 경계

이 파일은 비게시 집필 지침이다. `wiki/scripts/generate-catalog.mjs`는 `editorial`을 생성 대상에서 제외하므로 공개 `/world/` 경로에 올리지 않는다. 공개 본문에는 집필 원칙, 정본의 소유·관리 설명, 독자에게 지시하는 문장이나 게임 계산 규칙을 쓰지 않는다.

## 정본과 서술

- 영역별 로어 JSON을 작성 원본으로 삼고 같은 이름의 Markdown 본문은 의미·표·링크·앵커를 맞춘다. `lore/World-Narrative-Atlas.md`와 `lore/Glossary.md`처럼 Markdown이 원본인 자료는 각각의 계약을 따른다. 생성 투영물은 손으로 고치지 않는다. 근거와 생성 경계는 [`../AGENTS.md`](../AGENTS.md)와 [`../World-Narrative-Atlas.md`](../World-Narrative-Atlas.md)를 확인한다.
- 한국어 산문은 연표의 인정 사실체로 쓴다. 날짜와 당사자, 행위와 그 결과를 확인된 기록에 연결한다. 3인칭 한다체로 한 문단에 한 인과를 담고, 없는 사건을 요약이나 부재 서술로 메우지 않는다. 검증되지 않은 진술은 사실로 확정하지 않는다. 다른 언어의 필드가 있어도 영어를 한국어 서술의 정본으로 삼지 않는다.
- 비장한 고어식 이름과 근거 없는 조어를 만들지 않는다. '창세 구술', '창세 이야기', '구술로만', '창세의 첫 줄', '창세의 첫 급수협약'을 공개 산문에 쓰지 않는다. 실제 운전일지의 '첫 줄', 일반적인 구술 증언, 정당한 단어 '창세' 자체는 이 금지에 포함하지 않는다.

## 인물과 세계의 경계

- 실존 기업·제품·로고·표어·현직 임원 이름을 허구 속에 넣지 않는다. 실존 인물이나 기관에 허구의 범죄·비리·스캔들을 귀속하지 않는다. 근거는 [`../AGENTS.md`](../AGENTS.md)와 [`../characters/AGENTS.md`](../characters/AGENTS.md)의 금지 항목이다.
- 미성년자의 성적 서사는 쓰지 않는다. 인물의 출처 상태와 공개 여부는 [`../characters/AGENTS.md`](../characters/AGENTS.md) 및 [`../characters/Cast-Profile-Contract.md`](../characters/Cast-Profile-Contract.md)를 따른다.
- 합성체는 전지적 존재가 아니며 무한한 에너지·완전한 장기 기억·전역 네트워크·담당 구역 밖 시설 통제 능력을 주지 않는다. 인물·국가·가문·외부 전구·합성체·적대 개체의 영구 ID를 다시 매기지 않는다. ID 범위와 합성체 제약의 근거는 [`../AGENTS.md`](../AGENTS.md) 및 [`../World-Narrative-Atlas.md`](../World-Narrative-Atlas.md)에 있다.

## 시나리오 사건 카드

- 연표 사건은 정해진 결과를 재생하지 않는다. 사건 조건과 결과 판정 규칙은 GDD `campaign-progression.json#r2.event-conditions`에 있다.
- 날짜가 붙은 2026–2126 사건은 [서울전국 연표 2026–2126](../chronology/Century-Annals.md)에 적고, 개막일과 개막 이후 사건은 [시나리오 타임라인](../chronology/Scenario-Timeline.md)에 적는다. 첫해 사계절과 둘째 해 패권전의 제목에는 서기를 넣지 않는다.
- 사건 카드의 플레이테스트 상태와 설계 소유 경로는 공개 본문에 적지 않는다. 신도림 연결부 카드의 실험 절차는 이슈 #86, 배역·공간·정산 설계는 GDD 제안 `proposals/Scenario-Hold-the-Gate`에 있다.

### 신도림 연결부 카드의 구현 경계

- 여과재와 구리는 비교용 창작 화물이고 기존 아이템 ID나 경제 밸런스가 아니다. 운반 인부 둘도 정본 캐스트·분대 생존수와 무관한 표식이다.
- 종이 카드의 표식·처리 순서는 RTFC 계약의 전투 턴·분대·카드 수가 아니고, 전령·기록관이 새 전투 카드를 만들지 않는다. 정산은 왕복 계약의 한 번의 ResultId를 유지하며 비전투 결과를 전투 결과로 가장하지 않는다.
- 발생 조건은 이동·조우의 위치·시간·소음·통제·최근 사건·파티 입력과 이어지고, 문·허가·일정·분쟁의 지속 상태와 소유권은 이 사건이 보존한다.
- 월드맵 구성의 334역과 무관하게 이 사건의 장소는 신도림 창작 연결부 하나다. 역 내부 구성은 내부 입장·시설 슬롯이 아직 없음을 명시한다.
- 관계 변화는 직접 목격·보고 범위의 소수 인물에만 남고, 문서만으로 전역 평판·동맹 변화를 자동 적용하지 않는다.

### 사건 작성 양식

```yaml
event:
  id:
  date_or_phase:
  trigger_facts: []
  initiator_actor_id:
  authority_office_id:
  supporting_actor_ids: []
  opposing_actor_ids: []
  ambitions_in_conflict: []
  relationships_used: []
  known_memories: []
  candidate_actions: []
  required_approvals: []
  immediate_results: []
  relationship_changes: []
  follow_up_issue_ids: []
  player_entry_points: []
```

환경 변화는 `trigger_facts`만 만들며 전쟁이나 동맹 결과를 직접 지정하지 않는다.
