# v3 잠정 항목 원장 조각: task 21, 배치 rules-b

계획 `.omo/plans/wiki-lore-rebuild-v3.md` 과제 21의 GDD 배치 `rules-b`(규칙 문서 13개 가운데 9개 변경). 과제 24가 `docs/drafts/reports/v3-provisional-ledger.md`로 합치고 전역 번호를 다시 매긴다. 여기 있는 항목은 소유자가 답하기 전까지 승인된 설정이 아니다. 한국어 본문에는 "(잠정 T21-rules-b-n)", 영어 본문의 같은 자리에는 "(provisional T21-rules-b-n)"으로 표시돼 있다.

| # | Document | Location | Provisional item |
|---|---|---|---|
| T21-rules-b-1 | doc.Rules-CampaignLoop (`gdd/canon/locales/ko-KR/rules/rules-campaign-loop-clauses.json`) | RCAMPAIGN-26, 판정 순서 16 | 질서 헌장의 결말 조건에서 옛 "노선 연합·독립 역 협약"을 빼고 "세 세력 사이의 급수계약, 도시 사이의 계약서 장, 교역 질서, 기술 복구"로 바꾼다(근거: 01-core 5.2절 급수계약, 05장 4.2절 계약서 장, 바이블 1절 13행 자유도시들에는 묶는 이름이 없다). 결말 조건별 판정식은 정하지 않았다 |
| T21-rules-b-2 | doc.Rules-FactionsWarfare (`gdd/canon/locales/ko-KR/rules/rules-factions-warfare-clauses.json`) | RWARFARE-37 | 무소속 인물이 역을 쥐어도 네 번째 세력은 서지 않는다. 그 보유는 세 세력 가운데 한 곳의 칭호 사다리에 들어가거나 한 도시와 계약서 장을 맺어야 인준된다(근거: 바이블 1절 7행 세력은 셋뿐, 01-core 8절). 인준 전 보유의 기간과 처리는 정하지 않았다 |
| T21-rules-b-3 | doc.Rules-FactionsWarfare | RWARFARE-41 표 | 옛 다섯 권역 문화 키(`west-sluice`, `center-record`, `north-refuge`, `east-caravan`, `southeast-ration`)를 세력 정체 키 셋 `government-ledger`, `free-city-contract`, `ark-baptism`으로 바꾸고, 정치 효과를 09장 4.2~4.4절의 대응(장부의 흠, 계약서 장과 맡김과 보증, 부위 수 문턱과 교주의 말과 바침)에서 끌어왔다. 키 이름과 효과 문구는 새로 지었다 |
| T21-rules-b-4 | doc.Rules-FactionsWarfare | RWARFARE-38, 39 | 옛 "봉신 계약"을 "보유 계약"으로 부르고, 옛 의례 조항(헌납·소각·가동·기름·순례, 유물, 사당)을 세력별 의무 조항(정부의 국민의례 출석, 아크의 맞춤 날과 바침)과 세례 기재로 바꾼다. 세력 사이의 계약은 급수계약과 그 부속서의 꼴로 적고, 권역 사이의 계약은 없다(근거: 09장 4.2~4.4절, 04장 13.1절, 06장 5절·8.4절, 01-core 8절) |
| T21-rules-b-5 | doc.Rules-TravelEncounters (`gdd/canon/locales/ko-KR/rules/rules-travel-encounters-clauses.json`), doc.Travel-and-Encounters (`gdd/canon/locales/ko-KR/rules/travel-and-encounters.json`) | RTRAVEL-08, 판정 순서 5, 이동 비용 목록 | 이동 비용의 지형 위험에 추위·얼음·눈보라(지상과 다리에서 크다)와 공기 모자람(깊은 터널에서 크다)을 더한다(근거: 01-core 3.1절 깊이별 온도, 4.1절 네 한도, 7.4절 다리). 계수는 정하지 않았다 |
