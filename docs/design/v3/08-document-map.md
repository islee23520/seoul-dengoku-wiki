# v3 바이블 8장. 문서 지도

상태: 과제 9 작성. 계획 `.omo/plans/wiki-lore-rebuild-v3.md` 과제 9~15. 영어 미러 `08-document-map.en.md`.

근거: 바이블 7.1절(slug는 바꾸지 않는다, 문서 수 61), 9.4절 D2(새 문서 4개, 2026-11-12), 9.4절 2026-11-13 행(`Operating-Houses`와 `Chaebol-Houses-and-Century-Factions` 삭제), 01-core 10절(옛 개념을 다루던 slug는 이 장에서 v3 주제를 새로 받는다), `docs/canon-slugs.json`.

## 1. 이 장이 정하는 것

- 위키 문서 61개(`docs/canon-slugs.json`) 하나하나에 v3 주제, 새 영어·한국어 제목, 근거로 삼을 바이블 절, 초안 파일을 준다.
- 남은 slug는 이름을 바꾸지 않는다. 옛 개념(열여섯 정치체, 이주민 회랑, 합성 인격 장부, 서울 밖 영주)을 다루던 slug는 같은 slug로 v3 주제를 받는다. 옛 주소로 들어온 독자는 그 자리에서 v3 문서를 읽는다. 재벌 가문과 운영 가문을 다루던 두 slug는 2026-11-13 소유자 결정으로 지웠다(바이블 9.4절). 집안과 대물림, 역장 사무소와 작업대와 정비대는 세 세력 사회 문서와 `Hangnyeol-and-Bon-gwan`이 다룬다.
- 61개를 과제 10~15에 계획 그대로 나눈다.
- 문서의 분류(`category_id`)는 이 장에서 바꾸지 않는다. 분류 이름(`020-wiki-categories.sql`, 예: 옛 "감염자" 분류)은 과제 16이 고친다.
- 제목은 [제안]이다. 소유자가 바꾸면 그 과제가 따른다 (잠정 T09-6).

## 2. 새 slug를 더하지 않는 까닭

v3 바이블의 주제를 하나씩 대어 보았다. 모두 기존 slug 가운데 하나가 맡을 수 있고, 특히 옛 개념이 빠진 세 slug(`Sixteen-States`, Diaspora-Corridors, Synthetic-Actors)가 v3에서 새로 생긴 큰 주제(세 정체 개관, 건너는 곳과 몰래 바꾸기, 휴머노이드)를 받는다. 집안과 대물림, 역 사무와 작업대는 세 세력 사회 문서가 맡는다(2026-11-13 두 문서 삭제 뒤). 급수계약은 World-Relation-Ledger가, 영원한 겨울의 물리는 World-Unbinding과 Station-Interior-Construction이 맡는다.

09장의 CK3 기반 체계(캠페인 층과 전장 층의 계약, 형세, 보충, 붙잡힌 인물)는 게임 설계 쪽이다. 위키 독자가 세계를 읽는 데 필요한 것은 낱말 "형세" 하나뿐이고, 그것은 Glossary에 들어간다. 그래서 위키 slug를 더하지 않는다. `docs/canon-slugs.json`과 바이블 7.1절의 수는 61이다(63에서 2026-11-13 소유자 결정으로 두 문서를 지웠다) (잠정 T09-7).

## 3. 문서 지도

열 설명: **과제**는 계획의 문서 과제 번호다. **근거**는 그 문서를 쓸 때 읽을 바이블 절이다(`01`은 `01-core.md`, `02`~`07`·`09`는 각 장, `바이블`은 `docs/CANON-BIBLE.md`, `roster`는 `docs/design/roster-framework.md`). 초안 파일은 모두 `docs/drafts/<slug>.ko.md`와 `docs/drafts/<slug>.en.md`다. **현재 제목**은 2026-11-13 `data/sql/030-wiki-documents.sql` 값이다.

### 3.1 과제 10: 개요와 연표 (8)

| slug | 분류 | 현재 제목 | v3 주제 | 새 제목(ko / en) | 근거 |
|---|---|---|---|---|---|
| Glossary | overview | 용어 사전 | 세 정체가 쓰는 세계 안의 말. 승인된 용어와 v3 [제안] 용어를 나눠 싣는다. 세 정체의 셈 단위(끼·원, 킬로·손시간, 하루 충전·정비 차례), "형세" | 용어 사전 / Glossary | 바이블 5절, 01 2.2~2.4·8.4절, 03 10.1·11절, 04 9절, 05 6·10.7절, 06 6.4·10.5절, 09 3.6절 |
| World-Unbinding | overview | 대정전 | 대정전과 영원한 겨울: 최초의 AI가 겨울을 내린 일, 깊이별 온도, 빛, 눈, 강, 바람, 여든 해 동안 바뀐 것, 겨울의 톱니 | 대정전과 영원한 겨울 / The Great Blackout and the Eternal Winter | 바이블 1절, 3절, 01 3절·6.1~6.2절·9절(2046년 행) |
| World-Expansion-Index | overview | 세계 확장 색인 | 25개 구를 세 정체·자리 역·다스리는 칭호·관련 문서로 잇는 색인 | 세계 색인: 세 정체와 25공작령 / World Index: the Three Polities and the 25 Duchies | 바이블 2.4절, 01 7·8절, 04 3.4절, 05 2절, 06 1·4절, 07 4.3절 |
| World-Narrative-Atlas | overview | 세계 서사 총람 | 세계 서사의 뿌리 문서: 영원한 겨울, 역에 사는 사람, 한강으로 갈린 세 정체, 서로 필요하고 서로 두려운 까닭, 2126년 겨울의 물음 | 세계 서사 총람 / World Narrative Atlas | 바이블 1~2절, 01 1·7절(7.4절 포함), 01 9절 |
| Regional-Physical-AI-Arcs | overview | 권역·피지컬 AI 서사선 | 최초의 AI와 바깥 기계: 최초의 AI가 무엇이고 무엇이 아닌지, 사람이 내린 수도 봉쇄 명령을 지키는 테두리 기계, 기계를 둘러싼 세 정체의 이야기 줄기. 옛 "피지컬 AI 시대"는 쓰지 않는다 | 최초의 AI와 바깥 기계 / The First AI and the Machines Outside | 01 6.1~6.3절(6.4절 비공개 제외), 01 10절, 02 6.1~6.2·7절(7.4절 비공개 제외), 03 8절 |
| Century-Annals | chronology | 서울전국 연표 | 2046~2126 십 년 단위 연표. 대정전, 역으로 내려감, 한강 결빙, 급수계약 셋, 2079년 얼음판, 아크의 갈라섬, 2126년 겨울 | 서울 연표 2046~2126 / Seoul Annals 2046-2126 | 바이블 3절, 01 9절, 04 3.2절, 05 7.2절, 06 2.1·7.2절 |
| Scenario-Timeline | chronology | 시나리오 타임라인 | 개막: 2126년 겨울, 세 번째 급수계약을 앞둔 세 정체의 입장과 첫 해의 흐름. 게임의 한 턴이 한 달이라는 것은 쓰지 않고 철(긴 낮 철, 긴 밤 철)로 말한다 | 개막: 2126년 겨울 / The Opening: Winter 2126 | 바이블 1절 11행, 3절, 01 5.2·9절, 04 15절, 05 7.3절, 06 7.4절, 07 13절 |
| Sindorim-Junction-Cargo-Gate | chronology | 신도림 연결부 화물문 | 구로 신도림의 노선 이음목: 레일 위 짐 나르기, 구로의 공구 장터, 자유도시 사이 길의 한가운데 | 신도림 연결부 화물문 / Sindorim Junction Cargo Gate | 03 7.2~7.3절, 05 3.4·8.1절, 07 11.2절, 02 3.3절 |

### 3.2 과제 11: 세력 (6)

| slug | 분류 | 현재 제목 | v3 주제 | 새 제목(ko / en) | 근거 |
|---|---|---|---|---|---|
| `Sixteen-States` | factions | 서울의 세 세력 | (폐기: 열여섯 정치체) 서울의 세 정체 개관: 정부, 자유도시들, 아크가 무엇을 쥐고 무엇이 모자란지. 세 사회 문서로 가는 길잡이 | 서울의 세 정체 / The Three Polities of Seoul | 바이블 2.1~2.4절, 01 5.6·7·8.4절, 01 10절 첫 행 |
| Diaspora-Corridors | factions | 이주민 회랑 | (폐기: 이주민 회랑) 건너는 곳과 몰래 바꾸기: 다리, 강 밑 터널, 얼음판, 땅 경계, 증표와 초청 증표, 금지된 거래. 대정전 전 이주민 공동체의 후손은 각 정체의 보통 가구라는 것도 여기서 적는다 | 건너는 곳과 몰래 바꾸기 / Crossings and Smuggling | 01 7.4·10절, 05 8절, 06 7.3절, 07 11.1~11.3절 |
| World-Relation-Ledger | factions | 세계 확장 관계 원장 | 급수계약과 세 정체의 관계: 첫째와 둘째 계약, 세 번째 계약의 저울, 계약회, 사절과 보증인, 혼인과 갈라진 집안 | 급수계약과 세 정체 / The Water Contracts and the Three Polities | 바이블 1절 11행, 01 5.2·7.4절, 03 11.6절, 04 15절, 05 4·7절, 06 7절, 07 11.4~11.6절 |
| Government-Society | factions | 정부 사회 | 장부의 나라: 국회와 종신 대통령, 두 당, 부처, 주민등록과 말소, 법과 벌, 다섯 계층, 증표와 배급, 장터, 옷, 하루, 국민의례, 국군 | 정부 사회 / Government Society | 04 1~16절(17절 비공개 제외), 01 7.1·8.1절, 바이블 2.1절 |
| Free-City-Society | factions | 자유도시 사회 | 일곱 도시: 도시마다 다른 우두머리와 관악 공작, 계약회, 작업대와 작업조, 계약·보증·셈판, 급수계약, 길과 경계, 옷과 일상, 민병 | 자유도시들의 사회 / Free City Society | 05 1~12절, 01 7.2·8.2절, 바이블 2.2절 |
| Arc-Society | factions | 아크 사회 | 교주와 곁집, 세례(부위 수로 세는 신앙)의 공개된 모습, 네 구, 자유도시와의 갈라섬, 정비 경제, 옷과 일상, 전쟁 교리 | 아크 사회 / Arc Society | 06 1~14절(15절 비공개 제외), 01 7.3·8.3절, 바이블 2.3절 |

### 3.3 과제 12: 장소, 인물 구성, 문화 (12)

| slug | 분류 | 현재 제목 | v3 주제 | 새 제목(ko / en) | 근거 |
|---|---|---|---|---|---|
| Building-Reuse-Geography | places | 강·구·동 건물 재사용 | 눈 밑의 서울: 묻힌 건물의 지하, 빛밭이 서는 출입구 둘레, 섬유를 캐러 가는 길, 고물과 섬유로 먹히는 도시 | 눈 밑의 서울 / Seoul under the Snow | 01 3.3·5.3~5.5절, 02 2.1·3.4절, 03 3.1절 |
| External-Theaters | places | 바깥 | 서울 밖과 테두리: 띠의 생김새, 눈보라에 넘는 일, 동력 덩이를 캐 오는 사람, 귀환망, 띠 너머에 관해 아는 것. 서울 밖에는 다스리는 사람이 없다 | 서울 밖과 테두리 / Beyond Seoul: the Rim | 01 6.3·10절, 02 7.1~7.3절(7.4절 비공개 제외), 07 7.1·7.4절 |
| Seoul-Station-Catalog | places | 서울 연결 철도 역 카탈로그 | 서울의 역 312곳: 실제 이름과 노선, 정체별 수, 역의 크기 등급과 사람 수, 장터와 바꿈터가 서는 역 | 서울 역 목록 / Seoul Station Catalog | 01 4.3절, 04 10·16.1절, 05 2·3·5.4절, 06 4·8.6절, 지도 자료(`120-map-core.sql`) |
| Station-Interior-Construction | places | 역 내부에 들어가면 | 역 안으로: 지상, 대합실, 승강장, 깊은 터널의 깊이 띠와 온도, 역의 네 한도(열, 물, 공기, 빛), 잠자리와 부엌의 자리. 초안이 아직 없어 과제 12가 새로 쓴다 | 역 안으로 / Inside a Station | 01 3.1·4.1~4.2절, 02 3.2절, 04 12절, 05 10.1절, 06 10.2절 |
| World-Map-Construction | places | 세계 지도의 구성 | 세계 지도의 짜임: 25공작령, 세 정체의 땅, 자리 역, 경계의 열세 이음목 | 세계 지도의 짜임 / How the World Map Is Built | 바이블 2.4절, 01 7.4절, 07 4.3·11.1절, 지도 자료 |
| World-and-Subway-Layers | places | 세계 지도 | 지상과 땅 밑: 눈 위의 지상 길, 얼어붙은 한강과 다리, 노선과 깊은 노선, 레일이 길이다 | 지상과 땅 밑 / The Surface and Underground | 01 3.1·3.3~3.4·7.4절, 03 7.2절 |
| Characters-Factions-and-Professions | characters | 인물·세력·생업 | 인물 1,022명이 놓이는 법: 세력, 단계, 칭호, 직업, 거점, 나이와 가구, 세 정체의 생업 | 인물·세력·생업 / People, Factions and Trades | 07 3~6·8절, 01 8절, 04 16절, 05 12절, 06 12절 |
| Hangnyeol-and-Bon-gwan | characters | 본관과 항렬 | 본관과 항렬: 씨족 기록(고정 사실)을 그대로 두고, 강 건너로 갈린 친족과 집안의 대물림을 v3 세계에 놓는다 | 본관과 항렬 / Bon-gwan and Hangnyeol | 07 6.4절, 01 2.3절, `docs/design/v3/README.md` 고정 사실 |
| Faith-Culture-Schism | culture | 신앙과 문화의 분열 | 믿음과 의례: 정부의 국민의례, 자유도시들의 믿음, 아크의 세례와 신앙(공개된 것만), 아크와 자유도시가 갈라선 일. 조직된 신앙은 아크 하나다 | 믿음과 의례 / Faith and Rites | 바이블 1절 9행, 04 13절, 05 10.5절, 06 5~6·7.2절(15절 비공개 제외) |
| Food-Culture | culture | 식문화 | 끼니와 먹거리: 섬유당과 효모, 빛밭, 벌레, 버섯, 물고기와 사냥, 소금과 씨앗. 세 정체의 배급과 밥상 | 끼니와 먹거리 / Meals and Food | 01 5.3절, 02 2.5절, 04 9.2절, 05 10.2절, 06 10.3절 |
| Oral-Stories | culture | 이야기 | 이야기: 역 사람들이 바깥 기계와 짐승에 붙인 이름과 이야기, 세 정체의 말투로 전하는 옛이야기 | 이야기 / The Stories | 01 2.2절, 02 6.4절과 각 무리의 이름, 04 13.2절, 05 10.7절, 06 6.4절 |
| Values-and-Policy-Scales | culture | 가치관과 정책 척도 | 가치관과 정책 척도: 인물의 가치관 축과 세 정체의 기울기 | 가치관과 정책 척도 / Values and Policy Scales | 07 9.5절, 01 2.2·7절 |

### 3.4 과제 13: 기술, 사람과 기계, 그 밖 (8)

| slug | 분류 | 현재 제목 | v3 주제 | 새 제목(ko / en) | 근거 |
|---|---|---|---|---|---|
| Lost-Technology-Lineage | technology | 잃어버린 기술 | 아직 도는 것: 기술의 네 등급(만든다, 고친다, 살린다, 못 만든다), 서울의 전기 5 MW, 부품과 지식과 손, 세대마다 잃는 것 | 아직 도는 것 / What Still Runs | 03 1~3·10절, 01 5.1절 |
| Cyberware-and-Scarcity | technology | 사이버웨어와 희소성 | 기계 몸과 결핍: 몸의 자리, 다는 일, 정비, 전력, 거부, 죽음과 돌려받기, 값. 부품 이름은 쓰지 않는다(바이블 1절 14행) | 기계 몸과 결핍 / Machine Bodies and Scarcity | 03 4·11.5절, 04 13.3절, 06 5·8절 |
| Era-Arms-and-Tech-Level | goods | 이 시대의 기술과 무구 | 총, 탄, 드론: 화기의 출처, 탄약의 세 가지, 다시 채우기와 뇌관, 공기총, 터널 사격, 드론과 전파 싸움, 세 정체의 군대가 가진 것과 없는 것 | 총, 탄, 드론 / Guns, Rounds and Drones | 03 5~6절, 07 12절, roster 9절 |
| People-and-Machines | people-and-machines | 사람과 기체 | 사람과 기계: 레일 위 탈것과 차량기지, 서울 안의 기계, 다시 살린 기계, 기계가 귀한 세상의 일 | 사람과 기계 / People and Machines | 03 7~8절, 02 6.3·6.5절, 01 5.6절 |
| Synthetic-Actors | people-and-machines | 합성 사회 인격 | (폐기: 합성 인격 장부) 휴머노이드: 대정전 전에 만든 사람 꼴 기계가 지금 어디에 몇이 있고 누가 살려 두나. 생각하는 인격으로 쓰지 않는다 | 휴머노이드 / Humanoids | 바이블 1절 5행, 01 10절(T02-91), 03 8절, 07 3.2절(민웅기) |
| Ailments | ailments | 질병과 증상 | 추위의 병: 동상과 저체온, 공기가 모자란 깊은 역, 기계 몸의 거부와 감염, 섬유당의 탈, 약이 귀한 세상의 치료와 죽음 | 추위의 병 / Ailments of the Cold | 01 3.1·4.1절, 03 4.5절, 04 13.4절, 05 10.4절, 06 6.3절 |
| Offices-and-Ranks | offices | 관직 | 칭호와 자리: 세 정체의 칭호 사다리(승인된 국회의원, 관악 공작, 교주와 [제안] 칭호), 정부의 부처와 계급, 자유도시의 작업대 자리, 아크의 부위 수와 칭호 | 칭호와 자리 / Titles and Offices | 01 8절, 04 3~6·14.1절, 05 3·5.2절, 06 3.5·12.4절, 07 4.4·8.5절, 바이블 9.1절 |
| Structures | structures | 구조물 총람 | 구조물: 출입구 굴, 빛밭, 바람틀 밭, 잠실수중보 수차, 우물과 관로, 강 밑 터널 검문소, 테두리 망대 | 구조물 / Structures | 01 3.3·4·5절, 03 2·7.3절, 04 14.4절, 05 7.1절, 06 8.1절 |

### 3.5 과제 14: 적대 생태 색인과 G01~G13 (14)

| slug | 분류 | 현재 제목 | v3 주제 | 새 제목(ko / en) | 근거 |
|---|---|---|---|---|---|
| Hostile-Ecology-Index | bestiary | 서울 생태·변이 도감 | 적대 생태의 들머리: 녹은 주머니 먹이그물, 위협 등급과 깊이별 위협, 네 갈래 무리, 세력별 만남 | 적대 생태 도감 / Hostile Ecology Compendium | 02 1~3·8·9절 |
| Hostile-Group-G01 | bestiary | G01 · 멧돼지 | 짐승 | G01 · 멧돼지 / G01 · Wild Boar | 02 2절, 4절 G01 |
| Hostile-Group-G02 | bestiary | G02 · 큰부리까마귀 | 짐승 | G02 · 큰부리까마귀 / G02 · Large-billed Crow | 02 2절, 4절 G02 |
| Hostile-Group-G03 | bestiary | G03 · 들개 | 짐승 | G03 · 들개 / G03 · Feral Dogs | 02 2절, 4절 G03 |
| Hostile-Group-G04 | bestiary | G04 · 너구리 | 짐승 | G04 · 너구리 / G04 · Raccoon Dog | 02 2절, 4절 G04 |
| Hostile-Group-G05 | bestiary | G05 · 집쥐 | 짐승 | G05 · 집쥐 / G05 · Brown Rat | 02 2절, 4절 G05 |
| Hostile-Group-G06 | bestiary | G06 · 왜가리·가마우지 | 짐승 | G06 · 왜가리·가마우지 / G06 · Herons and Cormorants | 02 2절, 4절 G06 |
| Hostile-Group-G07 | bestiary | G07 · 용산 약탈단 | 적대 사람 무리 | G07 · 용산 말소자 / G07 · Yongsan Struck-Off | 02 5.1절, G07, 04 5·7.3절 |
| Hostile-Group-G08 | bestiary | G08 · 동대문 약탈단 | 적대 사람 무리 | G08 · 동대문 증표꾼 / G08 · Dongdaemun Coupon-Forgers | 02 5.1절, G08, 04 9.1절 |
| Hostile-Group-G09 | bestiary | G09 · 상암 탈영병 | 적대 사람 무리 | G09 · 상암 탈영병 / G09 · Sangam Deserters | 02 5.1절, G09, 04 14.3절 |
| Hostile-Group-G10 | bestiary | G10 · 보국문 집단 | 적대 사람 무리 | G10 · 보국문 테두리꾼 / G10 · Bogungmun Perimeter-Runners | 02 5.1절, G10, 07 7.4절 |
| Hostile-Group-G11 | bestiary | G11 · 강남 이탈 인간형 | 적대 사람 무리 | G11 · 수서 꺼진 사람들 / G11 · Suseo Gone-Dark | 02 5.1절, G11, 06 5.5절 |
| Hostile-Group-G12 | bestiary | G12 · 신내 탈영병 | 적대 사람 무리 | G12 · 금천 보증 잃은 손 / G12 · Geumcheon Hands Without Surety | 02 5.1절, G12, 05 3.5·6.3절 |
| Hostile-Group-G13 | bestiary | G13 · 집게팔 | 서울 안 옛 기계 | G13 · 집게팔 / G13 · Claw Arms | 02 6.1~6.5절, G13 |

### 3.6 과제 15: G14~G26 (13)과 새 slug

| slug | 분류 | 현재 제목 | v3 주제 | 새 제목(ko / en) | 근거 |
|---|---|---|---|---|---|
| Hostile-Group-G14 | bestiary | G14 · 빈수레 | 서울 안 옛 기계 | G14 · 빈수레 / G14 · Empty Carts | 02 6.1~6.5절, G14 |
| Hostile-Group-G15 | bestiary | G15 · 돌봄바퀴 | 서울 안 옛 기계 | G15 · 돌봄바퀴 / G15 · Care Wheels | 02 6.1~6.5절, G15 |
| Hostile-Group-G16 | bestiary | G16 · 철골거미 | 서울 안 옛 기계 | G16 · 철골거미 / G16 · Girder Spiders | 02 6.1~6.5절, G16 |
| Hostile-Group-G17 | bestiary | G17 · 외눈탑 | 테두리 기계 | G17 · 외눈탑 / G17 · One-Eye Towers | 02 6.1~6.2·6.6절, G17, 7절 |
| Hostile-Group-G18 | bestiary | G18 · 불다리열차 | 테두리 기계 | G18 · 굴막이 / G18 · Tunnel-Stoppers | 02 6.6절, G18 |
| Hostile-Group-G19 | bestiary | G19 · 그르렁이 | 테두리 기계(서울 안으로 흘러들기도 한다) | G19 · 그르렁이 / G19 · Growlers | 02 6.1·6.6절, G19 |
| Hostile-Group-G20 | bestiary | G20 · 철컥이 | 테두리 기계 | G20 · 불가사리 / G20 · Bulgasari | 02 6.6절, G20 |
| Hostile-Group-G21 | bestiary | G21 · 벽두드리기 | 테두리 기계 | G21 · 땅두드리기 / G21 · Ground-Knockers | 02 6.6절, G21 |
| Hostile-Group-G22 | bestiary | G22 · 불꽃등이 | 테두리 기계 | G22 · 도깨비불 / G22 · Dokkaebi Lights | 02 6.6절, G22 |
| Hostile-Group-G23 | bestiary | G23 · 우두커니 | 테두리 기계(서울 안으로 흘러들기도 한다) | G23 · 우두커니 / G23 · Udukeoni | 02 6.1·6.6절, G23 |
| Hostile-Group-G24 | bestiary | G24 · 울보 | 테두리 기계 | G24 · 되뇌미 / G24 · Doenoemi | 02 6.6절, G24 |
| Hostile-Group-G25 | bestiary | G25 · 등불개미 | 서울 안 옛 기계 | G25 · 등불개미 / G25 · Lamp Ants | 02 6.5절, G25 |
| Hostile-Group-G26 | bestiary | G26 · 철공룡 | 테두리 기계 | G26 · 철공룡 / G26 · Iron Dinosaurs | 02 6.6절, G26 |

새 slug는 없다(2절). 과제 15는 G14~G26 열세 문서만 쓴다.

수: 과제 10 여덟, 과제 11 여섯, 과제 12 열둘, 과제 13 여덟, 과제 14 열넷, 과제 15 열셋. 합 61.

## 4. 모든 문서 과제에 걸리는 규칙

1. 본문은 01-core 2절의 목소리와 세계 안의 말로 쓴다. 01-core 2.4절 표 왼쪽 칸의 비유 낱말과 "유니온"은 어떤 본문에도 쓰지 않는다(`docs/canon-terms.json`이 잡는다).
2. 비공개 설정(01 6.4절, 02 7.4절, 04 17절, 06 15절, 07 14절)은 공개 문서에 옮기지 않는다.
3. 역과 구의 이름은 실제 이름 그대로 쓰고, 영어는 `fixed-facts.corrections.json`으로 바로잡은 지도 값을 쓴다.
4. 잠정 항목은 본문에 승인된 것처럼 쓰지 않는다. 바이블 9.5절의 소유자 대기 결정은 기본값으로 쓰되 "정해지지 않았다"는 표시를 지키는 문장으로 쓴다.
5. 문서 사이의 링크와 앵커는 이 지도의 slug로 건다. 제목이 바뀌어도 slug는 같다.
6. 영어 제목과 한국어 제목은 위 표의 [제안]을 쓴다. 문서 과제가 더 나은 제목을 찾으면 바꾸고 자기 원장 조각에 올린다.
