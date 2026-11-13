# v3 인물 적용 영수증 (과제 26 데이터 부분)

계획 `.omo/plans/wiki-lore-rebuild-v3.md` 과제 26. 입력은 `docs/drafts/people/{government,free-city,arc}.jsonl`(1,022줄), 적용기는 `scripts/pages/v3-apply-people.mjs`, 처분 기준은 `docs/design/v3/07-people-and-war.md` 9~10절이다.

## 1. 적용

| 단계 | 명령 | 결과 |
|---|---|---|
| 사전 검사 | `node scripts/pages/v3-apply-people.mjs --check-only` | lines=1022 valid=1022 hard=0 alloc=0 |
| 적용 | `node scripts/pages/v3-apply-people.mjs --recompute-stats` (`--force-allocation` 없음) | hard=0 alloc=0, 아래 표대로 씀 |
| 능력치 | `node scripts/pages/ck3-stats.mjs --dry-run` | exit 0. people=1022, detail-derived=0, table-derived=1022 |
| 고정 사실 | `node scripts/pages/v3-fixed-facts.mjs --check` | exit 0. "fixed facts unchanged (with 160 listed corrections applied)" |
| 철도 | `git diff --quiet 536c1f286 -- data/sql/122-map-rail.sql` | 같음 |
| 바이블 뼈대 | 1~3절 `diff`(096cf9046 대비) | 빈 출력 |

### 1.1 표마다 바뀐 행 수 (첫 적용, 커밋 c4f0c1665)

| 표·파일 | 바뀐 수 | 크기(바이트) |
|---|---|---|
| 050 `wiki_person` | 1,022행 | 597,942 -> 565,155 |
| 090 `person_detail` | 1,022행 (json, json_ko) | 9,305,933 -> 6,849,771 (DROP 키 삭제) |
| 100 `clan` 분파 이름·상태 | 86행 | 238,909 -> 242,280 (100 파일 전체) |
| 100 `nonkorean_family` basis | 62행 | (위와 같은 파일) |
| 110 가계도 | 148그루, 산 사람 노드 483개 | 5,394,714 -> 3,533,633 (선대 timeline DROP) |
| 115 `retainer_graph` | 1행 (노드 312, 간선 302, 궁정 79) | 45,120 -> 108,134 |
| 123 `map_holding` | 50행 -> 169행 | 271,812 -> 378,370 |
| `public/portrait-tokens/*.json` | 511개 | |
| `public/person-details/*.json` | 511개 (2절) | |

### 1.2 멱등성

같은 명령을 두 번 더 돌렸다. 두 번째 실행부터 모든 SQL이 "unchanged", 바뀐 행 0, 토큰 0, person-details 0이었고, `data/sql/*.sql` + `public/portrait-tokens/*.json` + `public/person-details/*.json` 전체의 sha256 묶음 해시가 실행 전후 같았다(`09063e75…`: 토큰까지, `869667b7…`: person-details를 더한 뒤). 결과: 바이트 동일.

## 2. person-details

`public/person-details/*.json`(511개)은 `scripts/generate-portrait-tokens.mjs:25`가 읽는 입력이다. 옛 파일에는 090에 없는 `familyTree`, `sourceRefs`, `sources`(옛 로어 경로와 옛 연대기 글, 예: "수문국 선출 군주")가 있어 090에서 그대로 끌어낼 수 없었다. 그래서 적용기에 `--details-dir`(기본 `public/person-details`) 단계를 더했다. 이미 있는 파일만 새 090 `json_ko` 기록 그대로 다시 쓴다. 07장 10절 처분이 그대로 실리고, 옛 파일에만 있던 세 키는 함께 빠진다. 다시 쓴 뒤 옛 정치체 이름, 은퇴한 조직 이름, 옛 신앙 이름표는 person-details와 portrait-tokens 어디에도 없다(0개 파일). 토큰 생성기가 읽는 `title`, `position`, `occupation`, `commonTier`, `state`, `age`, `fields`는 모두 v3 값이다.

## 3. 사이트 고침

| 파일 | 고침 | 까닭 |
|---|---|---|
| `site/build.mjs` (두 곳) | `charToPerson`이 person id도 받는다 | 07장 10.2절. `characterId`가 없는 자리 주인의 보유지·가계도 노드가 이름과 링크로 보인다. 지도 보유지 169곳 모두 주인 있음, 이름이 id로 남은 곳 0 |
| `site/relations.mjs` | 같은 고침 (가신 관계 페이지) | 115 노드 id가 person id일 때 링크가 빠지던 문제. 고친 뒤 ko 관계 페이지 인물 링크 302개, 본문에 남은 `person-` id 0 |
| `site/people.mjs` `FAITH` | 옛 신앙 값 세 개(종교 이름 둘과 unknown)의 이름표를 지우고 v3 값 `baptised` 세례받음, `unbaptised` 미세례자, `fitted` 이식(아크 밖), `none` 없음 | 07장 9.4·10.2절 |
| `site/people.mjs` 가구 칸 | `humanoidAdmission`이 v3 값(`admitted`/`none`)이 되어 옛 `excluded`/심사 이름표가 맞지 않았다. "가구의 휴머노이드: 있음(가신 무리)/없음", "가구주 신앙"(houseFaith = 가구주의 personFaith) | 07장 9.4절 |
| `site/people.mjs` 관계 칸 | "궁정 가신 · 이름 / 2126 · court:K1018"을 "직속 아랫사람 · 이름 / 2126"으로. 보유지 머리 "이 공작령 안 가신의 보유지" -> "직속 아랫사람의 보유지" | 원시 id 노출 제거. 아크·자유도시 인물에게 "공작령 안 가신"이 맞지 않음 |
| `site/people.mjs` 기본 정보 | v3 `fields`의 `품계`/`생업`(`Rank`/`Livelihood`)은 표의 품계·직업과 같은 값이라 한 번만 보인다 | 같은 값이 두 줄로 나오던 것 |
| `site/people.mjs` 약력 | 약력이 `생애`/`Life` 절과 같으면 "정본 카드 원문 전체" 접기를 내지 않는다 | v3 기록은 약력을 `생애`로도 싣는다(07장 10.2절). 같은 글이 두 번 나오던 것 |

`site/` 전체에서 canon-terms 금지 항목 전부와 옛 정치체 이름, 은퇴한 조직, 외부 영지 칭호, 옛 신앙 값을 찾았고 위 밖의 하드코딩은 없었다(`build.mjs:405`의 옛 정치체 표를 은퇴시켰다는 코드 주석만 남음, 화면에 안 나옴). `relations.mjs`와 `map.mjs`의 "궁정/가신" 낱말은 CK3식 체계 화면 용어(09장)라 두었다.

## 4. 빌드와 검사

마지막 사이트 고침(커밋 086f17ede) 뒤 새 출력 폴더에 다시 지었다.

| 검사 | 결과 |
|---|---|
| `MSYS_NO_PATHCONV=1 SITE_BASE=/ SITE_OUT=…/v3-dist-26r node site/build.mjs` | exit 0. "wiki 61, gdd 129, factions 4, states 3, people 1022", 쇼케이스 탑재 |
| `MSYS_NO_PATHCONV=1 SITE_OUT=…/v3-dist-26r node site/check-site.mjs` | exit 0. 조각 링크 26,948개, 끊긴 것 0. EN 1,433 + KO 1,433 + 쇼케이스 1 |
| `node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --all` | 금지 위반 0, 필수 위반 0 (문서 61, 페이지 122) |
| `node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --all --html …/v3-dist-26r` | 금지 위반 0, 필수 위반 0 |
| 덧붙인 확인: canon-terms 금지 패턴 52개를 인물·가문·가신 관계 페이지 2,404개(en/ko)에 적용 | 3건, 모두 person-0798의 고정 영어 성씨(비한국계 가계)가 영어 통치자 칭호 금지 항목과 같은 철자라 걸린 것(인물 페이지, 인물 목록, 가문 색인 각 1). 사람 이름이라 통치자 칭호가 아니다. 이름은 고정 사실이라 바꾸지 않았다. `allowedTerms` 면제는 과제 24 판단으로 남긴다 |

`scan-terms --all`의 범위는 위키 문서 61개다. 인물 페이지는 위 덧붙인 확인과 5절에서 읽었다.

## 5. V-view: 인물 페이지 읽기

고른 사람: 세력마다 Key와 S1 전원, 30명이 안 되면 나머지 단계에서 고르게 채웠다. 정부 53(Key 9, S1 44), 아크 46(Key 9, S1 37), 자유도시 30(Key 3, S1 23, S2 2, S4 2), 무소속 3(S1 3). 132명 × ko/en = 264페이지.

읽은 방법: 지은 HTML의 `<main>` 본문을 글로 풀어, 사람마다 ko와 en 두 쪽에서 다음을 보았다.
- 입력 줄의 직함, 직위, 품계, 직업(`title/position/rank/occupation_<lang>`), 약력 첫 60자, 특성 이름이 모두 화면에 있는가.
- 옛 정치체 이름(옛 S 번호 정치체 15개의 한·영 이름과 옛 정부 정식 이름), 옛 S 번호 표기, 서울 밖 영지(서울 밖 시·도 지명과 영지 작위 낱말, 영어 영지 칭호), 은퇴한 조직(01장 10절 은퇴 목록의 조직 이름), 옛 성직 어휘(canon-terms의 옛 종교 직제 항목과 같은 범위), 옛 신앙 이름표가 있는가. 본관 줄은 씨족 자리라 영지 검사에서 뺐다. 검사 패턴은 저장소 밖 일회성 스크립트에 있다.
- 씨족이 있으면 인물 페이지의 가문 링크, 가문 페이지가 있고 그 사람을 싣는지, 가계도 SVG가 있는지.

사람이 직접 끝까지 읽은 페이지: 고예진(1018) ko, 박태겸(0170) en, 오경재(0088) en, 그리고 첫 빌드의 고예진 ko. 이 읽기에서 찾은 표시 문제 넷(궁정 id 노출, 품계·생업 두 번, 약력 두 번, 가구 칸의 옛 이름표)을 3절대로 고쳤고, 다시 지은 쪽에서 고친 것을 확인했다. 고예진은 입력에 `partCount`가 없어 07장 9.4절 계산이 "개인 신앙: 없음"을 낸다. 입력 그대로의 결과이며 사이트 문제가 아니다.

결과: 264/264 PASS. 첫 측정에서 나온 FAIL 2건(0009 ko, 0378 en "가문 페이지에 그 사람이 없음")은 빌드가 가문 페이지를 쓰는 중에 읽은 경합이었다. 빌드가 끝난 뒤 두 가문 페이지(c720-ac15-b989, b0a8-c758-b839) 모두 그 사람을 싣고 있었고 다시 잰 결과는 PASS다. 같은 검사를 1,022명 전체(2,044페이지)에 돌리면 22페이지(11명)가 걸리고, 모두 본관(수원 백씨, 대구 배씨)이나 사람 이름(하남은)이 서울 밖 지명과 겹친 것이다.

지도: `data/map.core.{en,ko}.json`의 보유지 169곳 모두 주인이 있고, 주인 이름이 id로 남은 곳 0, 역이 붙은 곳 101, 행정동이 붙은 곳 169. 가문 색인은 본관 가문 177개와 등록 인물 955명으로 나온다. 가신 관계 페이지는 인물 링크 302개를 낸다.

| # | 인물 | 세력 | 단계 | 이름 (ko / en) | 직함 (ko / en) | 가문 | 결과 |
|---|---|---|---|---|---|---|---|
| 1 | person-0001 | free-city | Key | 한재목 / Han Jae-mok | 영등포 장주 / Yeongdeungpo Market Master | 가계도 있음 | PASS |
| 2 | person-0002 | free-city | S1 | 이서담 / I Seo-dam | 양천 기지장 / Yangcheon Depot Master | 가계도 있음 | PASS |
| 3 | person-0003 | free-city | S1 | 김태운 / Gim Tae-un | 당산 취수구대 대주 / Owner of the Dangsan Intake Bench | 가계도 있음 | PASS |
| 4 | person-0004 | free-city | S1 | 박누리 / Bak Nu-ri | 이을 자식 / Heir | 가계도 있음 | PASS |
| 5 | person-0005 | free-city | S1 | 최한결 / Choe Han-gyeol | 낙성대 굴착대 대주 / Owner of the Nakseongdae Drilling Bench | 가계도 있음 | PASS |
| 6 | person-0006 | free-city | S1 | 정모란 / Jeong Mo-ran | 여의도 곳간대 대주 / Owner of the Yeouido Storehouse Bench | 가계도 있음 | PASS |
| 7 | person-0007 | free-city | S1 | 장필규 / Jang Pil-gyu | 셈판 서기 / Tally clerk | 가계도 있음 | PASS |
| 8 | person-0008 | free-city | S1 | 임바다 / Im Ba-da | 교대장 / Shift Chief | 가계도 있음 | PASS |
| 9 | person-0009 | free-city | S1 | 유세진 / Yu Sejin | 남태령 나무조 대주 / Owner of the Namtaeryeong Wood Bench | 가계도 있음 | PASS |
| 10 | person-0029 | free-city | S1 | 강민서 / Gang Minseo | 구로 공장장 / Guro Works Master | 가계도 있음 | PASS |
| 11 | person-0030 | free-city | S1 | 정시우 / Jeong Siu | 이을 자식 / Heir | 가계도 있음 | PASS |
| 12 | person-0031 | free-city | S1 | 김나율 / Kim Nayul | 이을 자식 / Heir | 가계도 있음 | PASS |
| 13 | person-0032 | free-city | S1 | 이강묵 / I Gangmuk | 금천 경계장 / Geumcheon Edge Warden | 가계도 있음 | PASS |
| 14 | person-0033 | free-city | S1 | 박소언 / Bak Soeon | 이을 자식 / Heir | 가계도 있음 | PASS |
| 15 | person-0034 | free-city | S1 | 최다인 / Choe Dain | 강서 바람지기 / Gangseo Wind Keeper | 가계도 있음 | PASS |
| 16 | person-0035 | free-city | S1 | 장우석 / Jang Useok | 셈판 서기 / Tally clerk | 가계도 있음 | PASS |
| 17 | person-0036 | free-city | S1 | 임채원 / Im Chaewon | 남구로 부품대 대주 / Owner of the Namguro Parts Bench | 가계도 있음 | PASS |
| 18 | person-0037 | free-city | S1 | 한지온 / Han Jion | 이을 자식 / Heir | 가계도 있음 | PASS |
| 19 | person-0220 | free-city | Key | 최지우 / Choe Ji-u | 동작 나루지기 / Dongjak Ferry Keeper | 가계도 있음 | PASS |
| 20 | person-0221 | free-city | S1 | 권미래 / Gwon Mi-rae | 이을 자식 / Heir | 가계도 있음 | PASS |
| 21 | person-0222 | free-city | S1 | 황은설 / Hwang Eunseol | 노들 황씨네 어로대 대주 / Owner of the Hwang family fishing bench, Nodeul | 가계도 있음 | PASS |
| 22 | person-0223 | free-city | S1 | 송재민 / Song Jaemin | 개화산 송씨네 바람대 대주 / Owner of the Song family wind bench, Gaehwasan | 가계도 있음 | PASS |
| 23 | person-0224 | free-city | S1 | 오하늘 / Oh Haneul | 공항시장 오씨네 바람대 대주 / Owner of the Oh family wind bench, Airport Market | 가계도 있음 | PASS |
| 24 | person-0225 | free-city | S1 | 조은우 / Jo Eunu | 동작 강 쪽 건널목장 / Crossing Chief of Dongjak (river side) | 가계도 있음 | PASS |
| 25 | person-0998 | free-city | Key | 이일섭 / I Ilseop | 관악 공작 / Duke of Gwanak | 가계도 있음 | PASS |
| 26 | person-1008 | free-city | S1 | 민웅기 / Min Ung-gi | 천왕 통신대 대주 / Bench Owner of the Cheonwang Radio Bench | 가계도 있음 | PASS |
| 27 | person-0010 | free-city | S2 | 허도담 / Heo Dodam | 신림 구간장 / Section Chief of Sillim | 가계도 있음 | PASS |
| 28 | person-0230 | free-city | S2 | 소감 / So Gam | 화곡 구간장 / Section Chief of Hwagok | 가계도 있음 | PASS |
| 29 | person-0569 | free-city | S4 | 허다우 / Heo Dau | 동력 덩이 캐는 사람 / Power-core runner | 가계도 있음 | PASS |
| 30 | person-0793 | free-city | S4 | 권파윤 / Gwon Payun | 동력 덩이 캐는 사람 / Power-core runner | 가계도 있음 | PASS |
| 31 | person-0057 | arc | Key | 정호준 / Jeong Hojun | 세례 집도자 / Baptism fitter | 가계도 있음 | PASS |
| 32 | person-0058 | arc | S1 | 정하린 / Jeong Harin | 삼성2동 대피소장 / Shelter Head of Samseong 2-dong | 가계도 있음 | PASS |
| 33 | person-0059 | arc | S1 | 최은재 / Choe Eunjae | 가락본동 대피소장 / Shelter Head of Garakbon-dong | 가계도 있음 | PASS |
| 34 | person-0060 | arc | S1 | 이봄결 / Yi Bomgyeol | 호위장 / Guard Captain | 가계도 있음 | PASS |
| 35 | person-0061 | arc | S1 | 김도하 / Gim Doha | 오륜동 대피소장 / Shelter Head of Oryun-dong | 가계도 있음 | PASS |
| 36 | person-0062 | arc | S1 | 유민호 / Yu Minho | 말지기 / Word Keeper | 가계도 있음 | PASS |
| 37 | person-0063 | arc | S1 | 박진솔 / Bak Jinsol | 수서동 대피소장 / Shelter Head of Suseo-dong | 가계도 있음 | PASS |
| 38 | person-0064 | arc | S1 | 장예린 / Jang Yerin | 잠실역 정비장 / Bench Keeper of Jamsil | 가계도 있음 | PASS |
| 39 | person-0065 | arc | S1 | 임시온 / Im Sion | 호위장 / Guard Captain | 가계도 있음 | PASS |
| 40 | person-0086 | arc | S1 | 임하준 / Im Hajun | 강동 곁집 어른 / Gangdong Near House elder | 가계도 있음 | PASS |
| 41 | person-0087 | arc | Key | 임초원 / Im Chowon | 펌프 정비공 / Pump fitter | 가계도 있음 | PASS |
| 42 | person-0088 | arc | Key | 오경재 / O Gyeongjae | 강남 곁집장 / Head of the Gangnam Near House | 가계도 있음 | PASS |
| 43 | person-0089 | arc | S1 | 한소미 / Han Somi | 호위장 / Guard Captain | 가계도 있음 | PASS |
| 44 | person-0090 | arc | S1 | 박세린 / Bak Serin | 천호2동 대피소장 / Shelter Head of Cheonho 2-dong | 가계도 있음 | PASS |
| 45 | person-0091 | arc | S1 | 김보람 / Kim Boram | 서초 곁집 어른 / Seocho Near House elder | 가계도 있음 | PASS |
| 46 | person-0092 | arc | S1 | 이준택 / I Juntaek | 강동 곁집 어른 / Gangdong Near House elder | 가계도 있음 | PASS |
| 47 | person-0093 | arc | S1 | 최나래 / Choe Narae | 호위장 / Guard Captain | 가계도 있음 | PASS |
| 48 | person-0094 | arc | S1 | 정가온 / Jeong Gaon | 강남 곁집 어른 / Gangnam Near House elder | 가계도 있음 | PASS |
| 49 | person-0095 | arc | S1 | 장민재 / Jang Minjae | 서초 곁집 어른 / Seocho Near House elder | 가계도 있음 | PASS |
| 50 | person-0096 | arc | S1 | 유하은 / Yu Haeun | 강남 곁집 어른 / Gangnam Near House elder | 가계도 있음 | PASS |
| 51 | person-0116 | arc | Key | 배우진 / Bae Ujin | 강동 곁집장 / Head of the Gangdong Near House | 가계도 있음 | PASS |
| 52 | person-0117 | arc | S1 | 김우찬 / Kim Uchan | 송파 곁집 어른 / Songpa Near House elder | 가계도 있음 | PASS |
| 53 | person-0118 | arc | S1 | 정소율 / Jeong Soyul | 강남 곁집 어른 / Gangnam Near House elder | 가계도 있음 | PASS |
| 54 | person-0119 | arc | S1 | 장석윤 / Jang Seogyun | 명일2동 대피소장 / Shelter Head of Myeongil 2-dong | 가계도 있음 | PASS |
| 55 | person-0120 | arc | S1 | 이윤서 / I Yunseo | 잠실6동 대피소장 / Shelter Head of Jamsil 6-dong | 가계도 있음 | PASS |
| 56 | person-0121 | arc | S1 | 박하율 / Bak Hayul | 강동 곁집 어른 / Gangdong Near House elder | 가계도 있음 | PASS |
| 57 | person-0122 | arc | S1 | 최도윤 / Choe Doyun | 강남 곁집 어른 / Gangnam Near House elder | 가계도 있음 | PASS |
| 58 | person-0123 | arc | S1 | 임겨레 / Im Gyeore | 송파 곁집 어른 / Songpa Near House elder | 가계도 있음 | PASS |
| 59 | person-0124 | arc | S1 | 한보라 / Han Bora | 송파1동 대피소장 / Shelter Head of Songpa 1-dong | 가계도 있음 | PASS |
| 60 | person-0272 | arc | Key | 이홍원 / Yi Hong-won | 강남 곁집 어른 / Gangnam Near House elder | 가계도 있음 | PASS |
| 61 | person-0273 | arc | S1 | 송하율 / Song Ha-yul | 반포4동 대피소장 / Shelter Head of Banpo 4-dong | 가계도 있음 | PASS |
| 62 | person-0274 | arc | S1 | 조우찬 / Jo U-chan | 서초 곁집 어른 / Seocho Near House elder | 가계도 있음 | PASS |
| 63 | person-0275 | arc | S1 | 서진아 / Seo Jin-a | 서초4동 대피소장 / Shelter Head of Seocho 4-dong | 가계도 있음 | PASS |
| 64 | person-0276 | arc | S1 | 권도하 / Gwon Do-ha | 고속터미널역 정비장 / Bench Keeper of Express Bus Terminal | 가계도 있음 | PASS |
| 65 | person-0277 | arc | S1 | 황노을 / Hwang No-eul | 수서역 정비장 / Bench Keeper of Suseo | 가계도 있음 | PASS |
| 66 | person-0374 | arc | Key | 남윤경 / Nam Yun-gyeong | 송파 곁집장 / Head of the Songpa Near House | 가계도 있음 | PASS |
| 67 | person-0399 | arc | Key | 정유라 / Jeong Yura | 서초 곁집장 / Head of the Seocho Near House | 가계도 있음 | PASS |
| 68 | person-0400 | arc | S1 | 하서진 / Ha Seojin | 송파 곁집 어른 / Songpa Near House elder | 가계도 있음 | PASS |
| 69 | person-0401 | arc | S1 | 곽은재 / Gwak Eunjae | 천호역 정비장 / Bench Keeper of Cheonho | 가계도 있음 | PASS |
| 70 | person-0402 | arc | S1 | 심유리 / Sim Yuri | 말지기 / Word Keeper | 가계도 있음 | PASS |
| 71 | person-0403 | arc | S1 | 은보람 / Eun Boram | 호위장 / Guard Captain | 가계도 있음 | PASS |
| 72 | person-0404 | arc | S1 | 안태경 / An Taegyeong | 송파 곁집 어른 / Songpa Near House elder | 가계도 있음 | PASS |
| 73 | person-1005 | arc | Key | 정서온 / Jeong Seoon | 교섭인 / Negotiator | 가계도 있음 | PASS |
| 74 | person-1017 | arc | S1 | 지연희 / Ji Yeon-hui | 교주 호위 / Hierophant's guard | 가계도 있음 | PASS |
| 75 | person-1018 | arc | Key | 고예진 / Go Ye-jin | 교주 / Hierophant | 본관 없음 | PASS |
| 76 | person-1020 | arc | S1 | 한서경 / Han Seo-gyeong | 대치1동 대피소장 / Shelter Head of Daechi 1-dong | 본관 없음 | PASS |
| 77 | person-0145 | government | Key | 윤서린 / Yun Seo-rin | 종신 대통령 / President for Life | 가계도 있음 | PASS |
| 78 | person-0146 | government | S1 | 강예준 / Gang Ye-jun | 중랑구 국회의원 / Member of the National Assembly for Jungnang-gu | 가계도 있음 | PASS |
| 79 | person-0147 | government | S1 | 조하린 / Jo Ha-rin | 은평구 국회의원 / Member of the National Assembly for Eunpyeong-gu | 가계도 있음 | PASS |
| 80 | person-0148 | government | S1 | 윤지율 / Yun Ji-yul | 대통령 비서실장 / Chief of Staff to the President | 가계도 있음 | PASS |
| 81 | person-0149 | government | S1 | 오서율 / O Seo-yul | 동대문구 국회의원 / Member of the National Assembly for Dongdaemun-gu | 가계도 있음 | PASS |
| 82 | person-0150 | government | S1 | 서라온 / Seo Ra-on | 성북구 국회의원 / Member of the National Assembly for Seongbuk-gu | 가계도 있음 | PASS |
| 83 | person-0170 | government | Key | 박태겸 / Bak Tae-gyeom | 용산구 국회의원 / Member of the National Assembly for Yongsan-gu | 가계도 있음 | PASS |
| 84 | person-0171 | government | S1 | 알렉산더 밀러 / Alexander Miller | 서대문구 국회의원 / Member of the National Assembly for Seodaemun-gu | 본관 없음 | PASS |
| 85 | person-0172 | government | S1 | 에바 노바코바 / Eva Novakova | OMO당 사무총장 / Secretary-General of the OMO Party | 본관 없음 | PASS |
| 86 | person-0173 | government | S1 | 아이작 워커 / Isaac Walker | 의원 집안 후계 / Heir of the Member's house | 본관 없음 | PASS |
| 87 | person-0174 | government | S1 | 루카스 슈나이더 / Lucas Schneider | 국방부 장관 / Minister of National Defense | 본관 없음 | PASS |
| 88 | person-0175 | government | S1 | 클라라 베넷 / Clara Bennett | 산림청장 / Commissioner of the Korea Forest Service | 본관 없음 | PASS |
| 89 | person-0195 | government | Key | 오해린 / Oh Hae-rin | 원장 / Director | 가계도 있음 | PASS |
| 90 | person-0196 | government | S1 | 조민재 / Jo Min-jae | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 91 | person-0197 | government | S1 | 윤서하 / Yun Seo-ha | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 92 | person-0198 | government | S1 | 신태산 / Sin Tae-san | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 93 | person-0199 | government | S1 | 서나연 / Seo Na-yeon | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 94 | person-0200 | government | S1 | 피터 얀센 / Peter Jansen | 클로당 사무총장 / Secretary-General of the Claw Party | 본관 없음 | PASS |
| 95 | person-0246 | government | Key | 백온 / Baek On | 행정안전부 주민등록 원부 필사관 / Master Register Copyist of the Ministry of the Interior and Safety | 가계도 있음 | PASS |
| 96 | person-0247 | government | S1 | 신보람 / Sin Boram | 국토교통부 장관 / Minister of Land, Infrastructure and Transport | 가계도 있음 | PASS |
| 97 | person-0248 | government | S1 | 황세린 / Hwang Serin | 행정안전부 장관 / Minister of the Interior and Safety | 가계도 있음 | PASS |
| 98 | person-0249 | government | S1 | 강태산 / Gang Taesan | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 99 | person-0250 | government | S1 | 윤초아 / Yun Choa | 종로구 국회의원 / Member of the National Assembly for Jongno-gu | 가계도 있음 | PASS |
| 100 | person-0251 | government | S1 | 오한결 / O Han-gyeol | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 101 | person-0297 | government | Key | 장세화 / Jang Sehwa | 성동구 국회의원 / Member of the National Assembly for Seongdong-gu | 가계도 있음 | PASS |
| 102 | person-0298 | government | S1 | 안도한 / An Dohan | 성동구 구청장 / Head of the Seongdong-gu Office | 가계도 있음 | PASS |
| 103 | person-0299 | government | S1 | 전미리 / Jeon Miri | 법무부 장관 / Minister of Justice | 가계도 있음 | PASS |
| 104 | person-0300 | government | S1 | 문시온 / Mun Sion | 농림축산식품부 장관 / Minister of Agriculture, Food and Rural Affairs | 가계도 있음 | PASS |
| 105 | person-0301 | government | S1 | 하세온 / Ha Seon | 국회 사무총장 / Secretary-General of the National Assembly | 가계도 있음 | PASS |
| 106 | person-0302 | government | S1 | 곽태산 / Gwak Taesan | 기후에너지환경부 장관 / Minister of Climate, Energy and Environment | 가계도 있음 | PASS |
| 107 | person-0323 | government | Key | 류은비 / Ryu Eunbi | 보건복지부 의료단 단장 / Head of the Medical Corps, Ministry of Health and Welfare | 가계도 있음 | PASS |
| 108 | person-0324 | government | S1 | 심달호 / Sim Dalho | 보건복지부 장관 / Minister of Health and Welfare | 가계도 있음 | PASS |
| 109 | person-0325 | government | S1 | 은채윤 / Eun Chaeyun | 노원구 국회의원 / Member of the National Assembly for Nowon-gu | 가계도 있음 | PASS |
| 110 | person-0326 | government | S1 | 라세영 / Ra Seyeong | 강북구 국회의원 / Member of the National Assembly for Gangbuk-gu | 가계도 있음 | PASS |
| 111 | person-0327 | government | S1 | 남호성 / Nam Hoseong | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 112 | person-0328 | government | S1 | 전솔 / Jeon Sol | 도봉구 국회의원 / Member of the National Assembly for Dobong-gu | 가계도 있음 | PASS |
| 113 | person-0349 | government | Key | 고서준 / Go Seojun | 광진구 국회의원 / Member of the National Assembly for Gwangjin-gu | 가계도 있음 | PASS |
| 114 | person-0350 | government | S1 | 문하율 / Mun Hayul | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 115 | person-0351 | government | S1 | 안기준 / An Gijun | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 116 | person-0352 | government | S1 | 하윤목 / Ha Yunmok | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 117 | person-0353 | government | S1 | 곽민재 / Gwak Minjae | 광진구 구청장 / Head of the Gwangjin-gu Office | 가계도 있음 | PASS |
| 118 | person-0354 | government | S1 | 심가은 / Sim Gaeun | 마포구 구청장 / Head of the Mapo-gu Office | 가계도 있음 | PASS |
| 119 | person-0375 | government | S1 | 은태호 / Eun Taeho | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 120 | person-0376 | government | S1 | 라진우 / Ra Jinu | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 121 | person-0377 | government | S1 | 전나경 / Jeon Nagyeong | 서울역 역장 / Stationmaster of Seoul Station | 가계도 있음 | PASS |
| 122 | person-0378 | government | S1 | 남시윤 / Nam Siyun | 중구 국회의원 / Member of the National Assembly for Jung-gu | 가계도 있음 | PASS |
| 123 | person-0379 | government | S1 | 문도윤 / Mun Doyun | 한국은행 총재 / Governor of the Bank of Korea | 가계도 있음 | PASS |
| 124 | person-1006 | government | Key | 탁서윤 / Tak Seoyun | 수도방위사령관 / Capital Defense Commander | 가계도 있음 | PASS |
| 125 | person-1007 | government | Key | 김연규 / Kim Yeongyu | 마포구 국회의원 / Member of the National Assembly for Mapo-gu | 가계도 있음 | PASS |
| 126 | person-1009 | government | S1 | 신종목 / Sin Jong-mok | 귀환망 현장 계약자 / Return Network field contractor | 가계도 있음 | PASS |
| 127 | person-1010 | government | S1 | 신준 / Sin Jun |  /  | 가계도 있음 | PASS |
| 128 | person-1019 | government | S1 | 박성수 / Bak Seong-su | 의원 집안 후계 / Heir of the Member's house | 가계도 있음 | PASS |
| 129 | person-1022 | government | S1 | 문도현 / Mun Do-hyeon | 용산구 구청장 / Head of the Yongsan-gu Office | 본관 없음 | PASS |
| 130 | person-1003 | independent | S1 | 조재표 / Jo Jaepyo | 귀환 일행 지휘자 / Leader of a return crossing party | 가계도 있음 | PASS |
| 131 | person-1004 | independent | S1 | 이연 / I Yeon | 수행 전령 / Attendant messenger | 본관 없음 | PASS |
| 132 | person-1021 | independent | S1 | 차유선 / Cha Yu-seon | 공동 위임 교섭자 / Jointly mandated negotiator | 본관 없음 | PASS |

## 6. 커밋

- c4f0c1665 `fix(data): 인물 1,022명을 v3 배치 입력으로 다시 쓴다` (data/sql 6개 파일, 초상 토큰 511개)
- f92d7de04 `fix(data): 초상 토큰 생성기 입력인 인물 상세 사본 511개를 v3 기록으로 다시 쓴다` (적용기 `--details-dir`, person-details 511개)
- 086f17ede `fix(site): 인물 id 노드와 v3 신앙·가구 값을 인물 페이지에 맞게 보인다`
- 이 영수증
