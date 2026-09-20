# 《서울:전국》

> **붕괴한 서울의 지하철망에서 무명 인물과 파티를 이끌어 역과 노선의 새로운 질서를 세우는 4X + RPG. 전투의 주 입력은 부대 지휘다.**

《서울:전국》은 아포칼립스 이후 **후세 서울**의 지하철망을 영토·물류·생존·정통성의 골격으로 삼는 인물 중심 대전략 RPG입니다. 원인은 [기동권 이탈](/world/World-Unbinding)이고 개막은 그로부터 100년(2126)입니다. 캠페인이 그리는 질서는 사람이 지켜보는 일과 신앙이 갈라진 노선 사회입니다. 플레이어는 무명 인물입니다. 무명은 착생 갈래 하나다. 전체 순서는 [온라인 유저 여정](/design/Online-User-Journey)을 따른다. 소규모 파티로 시작해 역과 노선을 오가며 생업, 관계, 직위와 세력 내 영향력을 쌓습니다.

2026-09-19부터 전투는 부대를 골라 이동·공격·진형 방향·정지·철수를 내리는 실시간 지휘다. 영웅을 직접 때리고 피하는 액션이 아니다. 인물 그림은 애니메이션풍 정비율을 목표로 한다. 젤다 무쌍은 그 그림의 참고일 뿐, 무쌍 조작을 가져오지 않는다.

전략 화면은 3D 하이트맵 전역막이다(결정 10). 전투 카메라와 일시정지는 질문 시간이 만료한 뒤 채택한 설계 기본값이며, 소유자가 명시한 결정이 아니다. 전투 카메라는 팬·오빗·줌이 가능한 3D 자유 지휘 시점이다. 각도·FOV 수치는 만들지 않는다. 일시정지는 그 파티의 닫힌 전투만 멈추고, 캠페인 세계와 다른 파티는 계속 흐른다. 정지 중에도 명령 미리보기·확정을 허용하며, 수락된 명령은 재개 뒤 다음 시뮬레이션 단계에서 입력 순서대로 현재 지시를 교체한다. 감속·배속·명령 큐는 없다. 결정 10의 좌우 사이드스크롤은 당시 표현 계약이며 새 목표 시점이 아니다. 사람과 소품의 현재 POC는 오드랜드 원본을 그대로 쓴다.

## 문서 안내

나무위키 [새 시리즈/설정](https://namu.wiki/w/%EC%83%88%20%EC%8B%9C%EB%A6%AC%EC%A6%88/%EC%84%A4%EC%A0%95)의 목차를 따른다. 구현·유니티 문서는 맨 아래 둔다.

### 1. 개요
| 문서 | 설명 |
|---|---|
| [개요](/design/Game-Thesis) | 선 자리에서 세계를 민다. 4X이자 RPG |
| [기동권 이탈](/world/World-Unbinding) | 2026년 호출권이 떨어진 밤, 개막 2126, 서울만 나라인 까닭 |
| [온라인 유저 여정](/design/Online-User-Journey) | 계정부터 착생·사망·후계까지 |

### 2. 연표
| 문서 | 설명 |
|---|---|
| [연표](/world/Scenario-Timeline) | 서기는 이탈 2026과 개막 2126만. 창세는 햇수 없는 구술 |
| [원정](/rules/Campaign-Loop) | 나선 길. 귀환이 전제가 아님 |
| [캠페인 진행](/rules/Campaign-Progression) | 성장 단계와 위기 영향 추적 |

### 3. 지명
| 문서 | 설명 |
|---|---|
| [서울과 지하철 레이어](/world/World-and-Subway-Layers) | 지상·역·터널 |
| [월드맵을 어떻게 구성하나](/world/World-Map-Construction) | 구 25·역 목록 |
| [서울 지역 설정 데이터](../LORE/regions/README.md) | 25구·427동 |
| [강·구·동 건물 재사용](/world/Building-Reuse-Geography) | 한강과 관측 건물 |
| [서울 역 카탈로그](/world/Seoul-Station-Catalog) | 이름 있는 역 334곳 |
| [역 내부에 들어가면](/world/Station-Interior-Construction) | 대합실과 승강장 |

### 4. 세력과 집단
| 문서 | 설명 |
|---|---|
| [서울 십육국](/world/Sixteen-States) | 나라 열여섯. 국호는 서명 습관 |
| [관직](/world/Offices-and-Ranks) | 수령·판서·군수·현감·참하. 조선·2026 관직에 크루세이더 킹즈 층 |
| [가문](/world/Chaebol-Houses-and-Century-Factions) | 2026 총수 일가와 개막 운영가문 |
| [운영가문](/world/Operating-Houses) | HC·HP 장부 |
| [징집 잔존과 군 장부](/world/Conscription-Remnants) | 병무청 잔해 |
| [세력과 외교](/world/Factions-and-Diplomacy) | 나라 사이 |
| [바깥](/world/External-Theaters) | 임진·서해·해협·두만·인천 회랑 |
| [이주민 회랑](/world/Diaspora-Corridors) | 시외에서 들어온 사람 |

### 5. 등장인물
나무위키 [피를 마시는 새/등장인물](https://namu.wiki/w/%ED%94%BC%EB%A5%BC%20%EB%A7%88%EC%8B%9C%EB%8A%94%20%EC%83%88/%EB%93%B1%EC%9E%A5%EC%9D%B8%EB%AC%BC), [삼국지 13](https://namu.wiki/w/%EC%82%BC%EA%B5%AD%EC%A7%80%2013)의 무장 항목처럼 쓴다. 품계와 생업을 나눈다.

| 문서 | 설명 |
|---|---|
| [등장인물](/world/Core-Characters) | 수령 열여섯과 참하 |
| [인물 총람](/world/Cast-Index) | 이름 있는 사람 |
| [인물 카드 계약](/world/Cast-Profile-Contract) | 칸 규칙 |
| [인물 등록 템플릿](/world/Cast-Registration-Template) | 빈 칸 |
| [야망](/world/Ambitions-and-Relations) | 승인·배신 |
| [후계, 이름 로스터, 세계 원장](/world/Heirs-Names-and-World-Ledger) | 누가 뒤를 잇는가 |
| [본관과 항렬](/world/Hangnyeol-and-Bon-gwan) | 이름 |

### 6. 신앙과 풍속
| 문서 | 설명 |
|---|---|
| [신앙](/world/Faith-Culture-Schism) | 강단·제대·잔해 제사 |

### 7. 기술과 무구
| 문서 | 설명 |
|---|---|
| [이 시대의 기술과 무구](/world/Era-Arms-and-Tech-Level) | 2026 법령의 잔해 |
| [잃어버린 기술](/world/Lost-Technology-Lineage) | 멈춘 팔과 도면 |

### 8. 전쟁
| 문서 | 설명 |
|---|---|
| [거점과 영토](/world/Strongholds-and-Territory) | |
| [전쟁과 공성](/rules/Warfare-and-Sieges) | |
| [전투](/rules/Realtime-Formation-Card-Battle) | |
| [무공](/world/Martial-Paths) | 다섯 유파. 스킬 트리 아님 |
| [이동과 조우](/rules/Travel-and-Encounters) | |

### 9. 경제
| 문서 | 설명 |
|---|---|
| [경제와 생산](/world/Economy-and-Production) | |
| [물류와 기반 시설](/world/Logistics-and-Infrastructure) | |

### 10. 구현 (설정이 아님)
| 문서 | 설명 |
|---|---|
| [UI가 코드로 들어오는 길](/design/Ui-Implementation-Pipeline) | |
| [유니티 구조](/rules/Unity-Architecture) | |
| [Unity 시스템 설계 계약](/rules/Unity-System-Design) | |
| [Unity 아키텍처 구현 계획](/rules/Unity-Architecture-Implementation-Plan) | |
| [같은 선택이 같은 결과가 되나](/rules/Save-and-Determinism) | |
| [기여를 시작하는 곳](../CONTRIBUTING.md) | |

## 현재 구현 범위

이 절은 현재 Unity POC의 실측이다. 위 2026-09-19 목표와 같은 말이 아니다.

홈 화면에서 4방향 시야와 인물 위치를 한눈에 파악해 즉시 탐색 방향을 결정합니다. 2026-09-07 아이소 POC 기록이며 새 목표 전투의 화면이 아니다.

현재 모듈 `Unity POC 통합 코어 루프`까지 구현되어 있습니다. 이 모듈은 `Bootstrap` App scope/FSM, 배타적 `MainTitle`/`Foundation` 화면 lease, uGUI 화면, 세 역 노선과 교섭·우회·전투·정산·복귀를 구현했고, 전투 Core는 30Hz 고정 틱의 실시간 진형·카드 규칙(`rtfc-owner-cards-v2`)입니다. 동일 seed 재현과 중복 정산 거부를 실제 batchmode PlayMode에서 검증했습니다. 결정 10은 전투 화면을 좌우 사이드스크롤로 적었고, 현재 Core 식별자는 카드 규칙 `rtfc-owner-cards-v2`다. 카드 문법과 그 화면 계약을 새 목표로 올리지 않는다. 캠페인 호스트의 이동 그래프는 `RouteGraph.CreateSeoul()`의 334역·OSM 인접 435입니다. Area 1 콘텐츠 카탈로그는 영등포–신도림–구로 세 역입니다.

서울 지역 데이터는 날짜 고정 행정동 427개의 저작 원장입니다. 공식 위키 지도와 웹 POC `play/`가 이 데이터를 서로 다른 용도로 읽습니다. 어느 쪽도 Unity 역 내부 격자나 16국 캠페인 구현을 뜻하지 않습니다.

생성 아트 슬롯은 아직 런타임 화면에 연결되지 않았습니다. 아트 슬롯 승인·연결은 별도 수용 조건이며, 코드 검증만으로 모듈 전체가 완료되지는 않습니다. 16국 캠페인 시뮬레이션, 집계 사상자 표현, `ToDo.md`의 13–17 항목은 아직 완료가 아니며 이 문서에 정의된 검증 게이트를 따라 이후 구현합니다. 문서에 적힌 설계는 구현 완료를 의미하지 않습니다.

