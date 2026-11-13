## task 21 (GDD batch "design")

| # | Document | Location | Provisional item |
|---|---|---|---|
| T21-design-1 | doc.Game-Thesis (`gdd/canon/locales/ko-KR/root/game-thesis.json`) | 개요, 결말 문단 | v3 결말 갈래: 세 세력의 저울이 바뀐 서울, 도시 하나의 우두머리 자리, 급수계약의 새 조건, 교역망, 기술 복구(옛 "노선 연합, 독립 역, 강단의 치"를 대신함) |
| T21-design-2 | doc.Game-References (`game-references.json`) | 시작 프리셋 표 | "전직 자치 순찰대"의 첫 관문을 "구로 신도림 구간장과의 보증 회복"으로 바꿈(옛 신도림 자치회 대신, 01-core 8.2절 구간장). 같은 표의 "마지막 역장"은 영등포가 자유도시이므로 "마지막 역반장"으로 고침(01-core 8.2절) |
| T21-design-3 | doc.Open-Decisions (`open-decisions.json`) | 설계 제안 문단 | 열린 결정 OD-V3TURN: v3 09장 3.2절의 한 달 턴 안(잠정 T29-1)과 GDD 결정 14의 시간 기반 이동을 어떻게 맞출지 소유자 결정 대기 |
| T21-design-4 | doc.Data-Catalog-and-Schema (`data-catalog-and-schema.json`) | 필드 계약, 논리 관계 표 | 옛 `state`(S01~S16) 필드와 테이블을 `faction_id`(`government`·`free-city`·`arc`·`independent`, `data/sql/035`)로 바꾸고 `duchy`·`unit` 관계 행을 더함. 옛 조직 37개는 `retired`로 두고 v3 조직을 새로 등록하는 안 |
