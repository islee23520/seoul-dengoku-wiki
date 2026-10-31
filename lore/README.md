# 새 시리즈/설정 개요 (TOC)

이 문서는 《서울:전국》 세계관의 설정과 데이터 구조를 정리한 종합 목차입니다. `.json` 상대 경로는 PG 정본의 논리적 문서 식별자이며 디스크 파일 링크가 아닙니다. 조회·편집은 [PostgreSQL 작성 계약](AUTHORING-JSON.md)을 따릅니다. 공개 본문은 한국어만 작성·게시하며 영어 동시저작은 하지 않습니다. 실제 공개 주소는 현재 카탈로그에서 확인합니다.

## 1. 개요
- [용어 사전](/world/Glossary) — PG 논리 문서 `lore/glossary.json`에서 생성
- 기계 판독용 공개 JSON도 생성물이며 저작 원천이 아닙니다.
- 대정전（`overview/World-Unbinding.json`）

## 2. 사람과 기체
- 사람과 기체（`people-and-machines/People-and-Machines.json`）

## 3. 연표
- 서울전국 연표 2026–2126（`chronology/Century-Annals.json`）
- 시나리오 타임라인（`chronology/Scenario-Timeline.json`）

## 4. 지명
- 강·구·동 건물 재사용（`places/Building-Reuse-Geography.json`）
- 서울 역 카탈로그（`places/Seoul-Station-Catalog.json`）
- 역 내부에 들어가면（`places/Station-Interior-Construction.json`）
- 세계 지도（`places/World-and-Subway-Layers.json`）
- 세계 지도의 구성（`places/World-Map-Construction.json`）

## 5. 세력과 집단
- 서울 십육국（`factions/Sixteen-States.json`）
- 가문（`factions/Chaebol-Houses-and-Century-Factions.json`）
- 이주민 회랑（`factions/Diaspora-Corridors.json`）
- `factions/External-Theaters.json` — 과거 외부 전구 식별자·출처 기록. 서울 밖 현행 활동 공간의 안내가 아닙니다.
- 서울 생태·변이 도감（`bestiary/Hostile-Ecology-Index.json`）

## 6. 직책
- 관직（`offices/Offices-and-Ranks.json`）

## 7. 물건과 물질
- 이 시대의 기술과 무구（`goods/Era-Arms-and-Tech-Level.json`）

## 8. 건축물
- 구조물 총람（`structures/Structures.json`）

## 9. 기술
- 잃어버린 기술（`technology/Lost-Technology-Lineage.json`）

## 10. 질병과 증상
- 질병과 증상（`ailments/Ailments.json`）

## 11. 문화
- 신앙과 문화의 분열（`culture/Faith-Culture-Schism.json`）
- 식문화（`culture/Food-Culture.json`）
- 이야기（`culture/Oral-Stories.json`）
- 가치관과 정책 척도（`culture/Values-and-Policy-Scales.json`）

## 12. 등장인물
- 등장인물（`characters/Core-Characters.json`）
- 인물 총람（`characters/Cast-Index.json`）
- Cast-State 요약 1행: 01（`characters/Cast-State-01.json`） · 02（`characters/Cast-State-02.json`） · 03（`characters/Cast-State-03.json`） · 04（`characters/Cast-State-04.json`） · 05（`characters/Cast-State-05.json`） · 06（`characters/Cast-State-06.json`） · 07（`characters/Cast-State-07.json`） · 08（`characters/Cast-State-08.json`） · 09（`characters/Cast-State-09.json`） · 10（`characters/Cast-State-10.json`） · 11（`characters/Cast-State-11.json`） · 12（`characters/Cast-State-12.json`） · 13（`characters/Cast-State-13.json`） · 14（`characters/Cast-State-14.json`） · 15（`characters/Cast-State-15.json`） · 16（`characters/Cast-State-16.json`）
- 본관과 항렬（`characters/Hangnyeol-and-Bon-gwan.json`）
- 인물·세력·생업（`characters/Characters-Factions-and-Professions.json`）
- 무소속 인물（`characters/Cast-Unaffiliated.json`）
- [랜덤 추가 로스터 실험 기록](characters/Random-Cast-Roster.md) — 미승인 역사 후보

## 13. 데이터 장부
- [성씨·본관·항렬 데이터 계약](name-pools/hangnyeol-schema.md) — JSON 이름은 PG 논리 장부 식별자
- [서울 지역 설정 데이터](regions/README.md) — 지역 논리 문서와 관측 출처·고정 경계 판본 안내
- 세계 서사 총람（`World-Narrative-Atlas.json`）
- 세계 확장 관계 원장（`World-Relation-Ledger.json`）
- 세계 확장 색인（`World-Expansion-Index.json`）

투영물 안내: `lore/bestiary/`의 색인과 26개 집단 도감(G01–G26), `lore/` 루트의 `Operating-Houses.json`, `Synthetic-Actors.json`, `Regional-Physical-AI-Arcs.json`는 World-Narrative-Atlas의 읽기 전용 논리 투영입니다. 몬스터 배치 본문 페이지는 폐기했고, M번호는 집단 도감 안 개체의 출처 정보로만 남습니다. 지원되는 PG 도메인 편집 경로와 생성 계약으로 원본·의존 투영을 함께 처리하며 물리 JSON이나 투영만 직접 고치지 않습니다. 지원되지 않는 쓰기를 SQLite 도구로 우회하지 않습니다.

---

*(현재 정본은 서울 안의 세 정치 세력·중립과 여섯 지리 왕국을 별개 층으로 다루며, 옛 6강·4약·6소 구분은 사용하지 않습니다.)*
