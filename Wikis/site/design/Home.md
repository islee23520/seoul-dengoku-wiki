# 《서울:전국》

![잔선 서울의 인물 방향 시야 아이소 개요](https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/isometric-home.svg?raw=true)

홈 화면에서 4방향 시야와 인물 위치를 한눈에 파악해 즉시 탐색 방향을 결정합니다.

![붕괴 이후 지하철 거점의 콘셉트](https://github.com/islee23520/seoul-kenshi/blob/main/Reference/assets/wiki/janseon-seoul-cover.png?raw=true)


> **붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG — 전투는 4방향 격자 위의 실시간 진형·카드 전투.**

《서울:전국》은 아포칼립스 이후 **후세 서울**의 지하철망을 영토·물류·생존·정통성의 골격으로 삼는 인물 중심 대전략 RPG입니다. 원인은 [기동권 이탈](/world/World-Unbinding)이고 개막은 그로부터 100년(2126)입니다. 캠페인이 그리는 질서는 서명 체계와 신앙이 갈라진 노선 사회입니다. 플레이어는 무명 인물입니다. 무명은 착생 갈래 하나다. 전체 순서는 [온라인 유저 여정](/design/Online-User-Journey)을 따른다. 소규모 파티로 시작해 역과 노선을 오가며 생업, 관계, 직위와 세력 내 영향력을 쌓습니다. 탐색, 상호작용과 전투는 하나의 고정 직교 아이소메트릭 카메라와 4방향 타일 격자를 공유합니다.

## 문서 안내

| 문서 | 설명 |
|---|---|
| [이 게임이 뭔지](/design/Game-Thesis) | 어떤 인물로 시작해 무엇을 이루는 게임인지 |
| [인물 등록 템플릿](/world/Cast-Registration-Template) | 이름 있는 인물을 넣을 때 복사하는 빈 칸. 초상 없음 |
| [기여를 시작하는 곳](../../contribute.md) | 도메인별 이슈·정본·게이트 |
| [온라인 유저 여정](/design/Online-User-Journey) | 계정·착생·공유 월드 입장부터 사망·후계까지. 캠페인 루프의 바깥 순서 |
| [기동권 이탈](/world/World-Unbinding) | 2026 피지컬 AI 호출권 상실, 개막 2126, 서울만 나라인 이유 |
| [서울과 지하철 레이어](/world/World-and-Subway-Layers) | 다층 세계 그래프와 데이터 출처 |
| [월드맵을 어떻게 구성하나](/world/World-Map-Construction) | 구 25·역 목록·시설을 그래프로 조립하는 순서. Unity 이동 그래프는 334역 |
| [서울 지역 설정 데이터](regions/README.md) | 2026-07-01 행정동 25구·427동 저작. 역 목록이 면적 전수가 아님 |
| [강·구·동 건물 재사용](Building-Reuse-Geography.md) | 한강·지천·25구 위에 관측 건물의 개막 쓰임을 얹는다. OSM 태그는 가동이 아님 |
| [서울 역 카탈로그](/world/Seoul-Station-Catalog) | OSM에서 뽑은 서울 안 이름 있는 역 334곳. 공식 전수 아님 |
| [역 내부에 들어가면](/world/Station-Interior-Construction) | 입장 시 층·격자·시설 슬롯. 조우 정산 API와 별개 |
| [출격하고 돌아오는 흐름](/rules/Campaign-Loop) | 준비, 원정, 마주침, 전투, 복귀와 결과 반영 |
| [거점과 영토](/world/Strongholds-and-Territory) | 점령, 안정화, 통합, 시설과 영토 과확장 |
| [경제와 생산](/world/Economy-and-Production) | 생존 자원, 노동, 전력, 생산과 시장 가격 |
| [물류와 기반 시설](/world/Logistics-and-Infrastructure) | 허가된 경로, 처리량, 비축, 고립과 복구 |
| [세력과 외교](/world/Factions-and-Diplomacy) | 신뢰, 평판, 정통성, 협약과 집단 불만 |
| [전쟁과 공성](/rules/Warfare-and-Sieges) | 접근로, 보급, 봉쇄, 철수와 점령 후 유지 |
| [캠페인 진행과 위기](/rules/Campaign-Progression) | 안정화, 전문화, 긴장도, 회복과 다중 결말 |
| [인물·세력·생업](/world/Characters-Factions-and-Professions) | 관계, 직위, 정통성과 성장 |
| [가치관과 정책 척도](Values-and-Policy-Scales.md) | 인물 10칸, 조직 가치관·정책. 1001명 생성 경로 |
| [서울 십육국](/world/Sixteen-States) | 총16국, 강국5·약소국11. 국호는 서명 체계, 지명은 권역 부제 |
| [신앙과 문화의 분열](/world/Faith-Culture-Schism) | 잔해 신앙과 강단계·제대계. 2026 기독교가 개막 실세인 이유 |
| [십육국 핵심 인물](/world/Core-Characters) | 국가별 핵심 인물의 성격, 야망, 공포와 촉발 사건 |
| [인물 총람](/world/Cast-Index) · [관계 원장](/world/Cast-Relations) · [무소속 인물](/world/Cast-Unaffiliated) | 16국 인물 412명, 무소속 인물과 인물 사이 관계 원장 |
| [인물 카드 계약](/world/Cast-Profile-Contract) | 이름 있는 인물의 필수 칸. 출신·언어·징집·무장 접근 |
| [본관과 항렬](/world/Hangnyeol-and-Bon-gwan) · [랜덤 추가 로스터](/world/Random-Cast-Roster) | 성·남·여 풀 분리, 본관 항렬, Nemotron 100명 롤 |
| [징집 잔존과 군 장부](/world/Conscription-Remnants) | 징병제 명부가 동원잔존·무기고·탈영으로 쪼개지는 방식 |
| [이주민 회랑](/world/Diaspora-Corridors) · [회랑 인물](/world/Cast-Corridors-Index) | 대림·구로공단·이태원·용산 위에 얹는 다국적 회랑과 시드 인물 |
| [야망과 관계가 움직이는 정치](/world/Ambitions-and-Relations) | 이름 있는 인물이 동맹, 배신, 전쟁과 계승을 만드는 규칙 |
| [후계, 이름 로스터, 세계 원장](/world/Heirs-Names-and-World-Ledger) | 문화 성명 풀에서 후계를 만들고, 면담·거래가 세계 사건에 쌓이는 규칙 |
| [시나리오 타임라인](/world/Scenario-Timeline) | 이탈 2026, 창세 구술, 공백의 세기, 개막 2126. 조건에 따라 갈라지는 연대기 |
| [재벌 가문과 세기의 세력](/world/Chaebol-Houses-and-Century-Factions) | 총수 일가 지배, 구 정부 잔존, 외부 전구, 세기 변혁 가문 |
| [이 시대의 기술과 무구](/world/Era-Arms-and-Tech-Level) | 2026 기술에서 붕괴 이후 생업 공구·제식·군용 잔존·로스트 회수 |
| [세계 서사 지도](/world/World-Narrative-Atlas) | 가문·적대 생태·몬스터·서사 배치의 원본 |
| [이동과 조우](/rules/Travel-and-Encounters) | 4방향 행동과 원정 위험 |
| [실시간 진형·카드 전투](/rules/Realtime-Formation-Card-Battle) | 같은 격자에서 이어지는 실시간 진형·카드 전투 (Core 규칙 버전 `rtfc-owner-cards-v2`) |
| [설계 요구 티켓](Design-Requirements.md) | MDA 층은 설계 어휘. 개발 단위는 GitHub 요구 티켓 |
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

현재 모듈 `Unity POC 통합 코어 루프`까지 구현되어 있습니다. 이 모듈은 `Bootstrap` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면 lease, uGUI 화면, 세 역 노선과 교섭·우회·전투·정산·복귀를 구현했고, 전투 Core는 30Hz 고정 틱의 실시간 진형·카드 규칙(`rtfc-owner-cards-v2`)입니다. 동일 seed 재현과 중복 정산 거부를 실제 batchmode PlayMode에서 검증했습니다. 캠페인 호스트의 이동 그래프는 `RouteGraph.CreateSeoul()`의 334역·OSM 인접 435입니다. Area 1 콘텐츠 카탈로그는 영등포–신도림–구로 세 역입니다.

서울 지역 총람은 날짜 고정 행정동 427개의 저작 데이터와 열람 화면입니다. 웹 POC `play/`는 그 동을 목적지로 고를 수 있습니다. 둘 다 Unity 역 내부 격자나 16국 캠페인이 아닙니다.

생성 아트 슬롯은 아직 런타임 화면에 연결되지 않았습니다. 아트 슬롯 승인·연결은 별도 수용 조건이며, 코드 검증만으로 모듈 전체가 완료되지는 않습니다. 16국 캠페인 시뮬레이션, 집계 사상자 표현, `ToDo.md`의 13–17 항목은 아직 완료가 아니며 이 문서에 정의된 검증 게이트를 따라 이후 구현합니다. 문서에 적힌 설계는 구현 완료를 의미하지 않습니다.

