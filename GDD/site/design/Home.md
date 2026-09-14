# 《잔선: 서울》

![잔선 서울의 인물 방향 시야 아이소 개요](https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/isometric-home.svg?raw=true)

홈 화면에서 4방향 시야와 인물 위치를 한눈에 파악해 즉시 탐색 방향을 결정합니다.

![붕괴 이후 지하철 거점의 콘셉트](https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/janseon-seoul-cover.png?raw=true)


> **붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG — 전투는 4방향 격자 위의 실시간 진형·카드 전투.**

《잔선: 서울》은 아포칼립스 이후 서울의 지하철망을 영토·물류·생존·정통성의 골격으로 삼는 인물 중심 대전략 RPG입니다. 플레이어는 무명 인물입니다. 소규모 파티로 시작해 역과 노선을 오가며 생업, 관계, 직위와 세력 내 영향력을 쌓습니다. 탐색, 상호작용과 전투는 하나의 고정 직교 아이소메트릭 카메라와 4방향 타일 격자를 공유합니다.

## 문서 안내

| 문서 | 설명 |
|---|---|
| [이 게임이 뭔지](/design/Game-Thesis) | 어떤 인물로 시작해 무엇을 이루는 게임인지 |
| [서울과 지하철 레이어](/world/World-and-Subway-Layers) | 다층 세계 그래프와 데이터 출처 |
| [월드맵을 어떻게 구성하나](/world/World-Map-Construction) | 구 25·역 목록·시설을 그래프로 조립하는 순서. 런타임은 세 역 |
| [서울 역 카탈로그](/world/Seoul-Station-Catalog) | OSM에서 뽑은 서울 안 이름 있는 역 334곳 |
| [역 내부에 들어가면](/world/Station-Interior-Construction) | 입장 시 층·격자·시설 슬롯. 조우 정산 API와 별개 |
| [출격하고 돌아오는 흐름](/rules/Campaign-Loop) | 준비, 원정, 마주침, 전투, 복귀와 결과 반영 |
| [거점과 영토](/world/Strongholds-and-Territory) | 점령, 안정화, 통합, 시설과 영토 과확장 |
| [경제와 생산](/world/Economy-and-Production) | 생존 자원, 노동, 전력, 생산과 시장 가격 |
| [물류와 기반 시설](/world/Logistics-and-Infrastructure) | 허가된 경로, 처리량, 비축, 고립과 복구 |
| [세력과 외교](/world/Factions-and-Diplomacy) | 신뢰, 평판, 정통성, 협약과 집단 불만 |
| [전쟁과 공성](/rules/Warfare-and-Sieges) | 접근로, 보급, 봉쇄, 철수와 점령 후 유지 |
| [캠페인 진행과 위기](/rules/Campaign-Progression) | 안정화, 전문화, 긴장도, 회복과 다중 결말 |
| [인물·세력·생업](/world/Characters-Factions-and-Professions) | 관계, 직위, 정통성과 성장 |
| [서울 십육국](/world/Sixteen-States) | 총16국, 강국5·약소국11의 지리와 기반시설 |
| [십육국 핵심 인물](/world/Core-Characters) | 국가별 핵심 인물의 성격, 야망, 공포와 촉발 사건 |
| [인물 총람](/world/Cast-Index) · [관계 원장](/world/Cast-Relations) | 16국 인물 412명과 인물 사이 관계 원장 |
| [인물 카드 계약](/world/Cast-Profile-Contract) | 이름 있는 인물의 필수 칸. 출신·언어·징집·무장 접근 |
| [본관과 항렬](/world/Hangnyeol-and-Bon-gwan) · [랜덤 추가 로스터](/world/Random-Cast-Roster) | 성·남·여 풀 분리, 본관 항렬, Nemotron 100명 롤 |
| [징집 잔존과 군 장부](/world/Conscription-Remnants) | 징병제 명부가 동원잔존·무기고·탈영으로 쪼개지는 방식 |
| [이주민 회랑](/world/Diaspora-Corridors) · [회랑 인물](/world/Cast-Corridors-Index) | 대림·구로공단·이태원·용산 위에 얹는 다국적 회랑과 시드 인물 |
| [야망과 관계가 움직이는 정치](/world/Ambitions-and-Relations) | 이름 있는 인물이 동맹, 배신, 전쟁과 계승을 만드는 규칙 |
| [후계, 이름 로스터, 세계 원장](/world/Heirs-Names-and-World-Ledger) | 문화 성명 풀에서 후계를 만들고, 면담·거래가 세계 사건에 쌓이는 규칙 |
| [시나리오 타임라인](/world/Scenario-Timeline) | 붕괴 이전부터 패권전까지 조건에 따라 갈라지는 연대기 |
| [이 시대의 기술과 무구](/world/Era-Arms-and-Tech-Level) | 2026 기술에서 붕괴 이후 생업 공구·제식·군용 잔존·로스트 회수 |
| [세계 서사 지도](/world/World-Narrative-Atlas) | 가문·적대 생태·몬스터·서사 배치의 원본 |
| [이동과 조우](/rules/Travel-and-Encounters) | 4방향 행동과 원정 위험 |
| [실시간 진형·카드 전투](/rules/Realtime-Formation-Card-Battle) | 같은 격자에서 이어지는 실시간 진형·카드 전투 (Core 규칙 버전 `rtfc-owner-cards-v2`) |
| [전략에서 전투로](/rules/Strategy-Battle-Roundtrip) | 세계 상태를 전투에 넘기고 결과를 한 번만 반영하는 법 |
| [캐릭터 미술](/rules/Character-Art-Direction) | 2.5등신 전술 실루엣과 인물 프로필 초상 규칙 |
| [에셋이 들어오는 길](/design/Asset-Pipeline) | 의도 JSON을 그래프로 컴파일·검사하고 생성부터 승인까지 가는 설명서 |
| [UI가 코드로 들어오는 길](/design/Ui-Implementation-Pipeline) | HTML 목업을 먼저 고정한 뒤 uGUI로 옮기는 화면 경로 |
| [유니티 구조](/rules/Unity-Architecture) | 규칙과 화면을 나누는 영역별 책임 |
| [Unity 시스템 설계 계약](/rules/Unity-System-Design) | FSM, VContainer, Singleton과 Repository의 구현 전 계약 |
| [Unity 아키텍처 구현 계획](/rules/Unity-Architecture-Implementation-Plan) | 계약을 RED→GREEN으로 적용하고 검증하는 순서 |
| [같은 선택이 같은 결과가 되나](/rules/Save-and-Determinism) | 같은 상황을 다시 만들 수 있는 안전한 저장 |
| [개발 로드맵](/design/Development-Roadmap) | 검증 게이트와 구현 순서 |

## 현재 구현 범위

현재 모듈 `Unity POC 통합 코어 루프`까지 구현되어 있습니다. 이 모듈은 `Bootstrap` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면 lease, uGUI 화면, 세 역 노선과 교섭·우회·전투·정산·복귀를 구현했고, 전투 Core는 30Hz 고정 틱의 실시간 진형·카드 규칙(`rtfc-owner-cards-v2`)입니다. 동일 seed 재현과 중복 정산 거부를 실제 batchmode PlayMode에서 검증했습니다.

생성 아트 슬롯은 아직 런타임 화면에 연결되지 않았습니다. 아트 슬롯 승인·연결은 별도 수용 조건이며, 코드 검증만으로 모듈 전체가 완료되지는 않습니다. 16국 캠페인 시뮬레이션, 집계 사상자 표현, `ToDo.md`의 13–17 항목은 아직 완료가 아니며 이 문서에 정의된 검증 게이트를 따라 이후 구현합니다. 문서에 적힌 설계는 구현 완료를 의미하지 않습니다.

