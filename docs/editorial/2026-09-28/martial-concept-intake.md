# 무협 컨셉 아이데이션 접수 기록 (#16)

비게시 편집 기록. 대상은 위키 이슈 #16 「세계관: 무협 컨셉 추가 — 무술 유파·거지(개방) 계열」(원본 seoul-kenshi#102)이다. 설계안 본문은 `lore/editorial/Martial-Concept-Design.json`(EN+KO, 비게시)에 있다.

## 1. 접수 현황

| 항목 | 내용 |
|---|---|
| 제안 출처 | 이슈 #16 본문에 인용된 Project Makcha `#일반` 채널 대화(2026-09-14). 메시지 ID는 이슈 본문에 있으며 이 기록은 원문을 다시 옮기지 않는다. |
| 소유자 방향 | 이슈 본문 인용: “무협같은거 넣어야 해요!”, “안그래도 대림에 세력이 있어요”. 2026-09-28 소유자 답변: 창작 이슈는 초안 PR을 만들고 항목별 승인을 요청한다. |
| 접수된 아이데이션 | 0건. 2026-09-28 `gh issue view 16` 기준 댓글이 없다. |
| 이 PR의 산출 | 설계안(EN+KO JSON), 이 접수 기록, 고맥락 자료(3절), 명명 검증표(4절), 법무 메모(5절, 2026-09-28 작성). |

## 2. 접수 절차

1. 기여자는 아이데이션을 이슈 #16 댓글로 올린다. 한국어·영어 어느 쪽이든 받는다.
2. 편집자는 항목을 무공(전투 무공·심법·보법·경공), 유파 현장의 업무·생업, 조직·세력, 인물, 사건으로 나눈다. 장비·의례·명부 업무·공동 대열은 무공으로 분류하지 않는다.
3. 편집자는 `lore/culture/Martial-Paths.json`, `lore/editorial/Naming-Ledger.json`, `WORLD_BUILDING_GUIDE.md` 4절 경계와 대조한다. 새 유파는 2026년 기원, 2126년 후계 이름, 전수 방식, 장비 의존, 실패 조건을 모두 갖춰야 검토 대상이 된다.
4. 채택 후보는 같은 JSON 노드에 `en`·`ko`를 함께 적어 PR로 올린다. 새 이름은 정식명 하나만 두고 별칭을 만들지 않는다.
5. 기계 검사(`lore-json-validate --strict`, 빌드, 게이트, 전체 테스트)와 메인테이너 평가 코멘트를 거친 뒤 소유자가 병합한다.

## 3. 고맥락 자료 (제안자용)

이슈 본문의 읽기 순서는 저장소 분리 전 경로다. 현재 위키 원천으로 바꾸면 다음과 같다.

| 순서 | 원천 | 읽을 내용 |
|---|---|---|
| 1 | `lore/culture/Martial-Paths.json` | 여덟 유파의 정식명·기원·금기, 개방 무공 갈래, 환승계, 사제와 겸전 심사 |
| 2 | `WORLD_BUILDING_GUIDE.md` | 작명 원칙, 총림·개방·타구봉법 경계, 소속과 습득의 분리 |
| 3 | `lore/factions/Sixteen-States.json`, `lore/factions/Diaspora-Corridors.json` | 십육국과 이주민 회랑, 대림·가리봉 중국동포 회랑 |
| 4 | `lore/chronology/Scenario-Timeline.json` | 개막일의 인물과 사건 |
| 5 | `lore/regions/content/11560.json`(영등포구), `11530.json`(구로구) | 대림·구로·영등포 생활권의 개막 상태 |

## 4. 명명 검증표

이슈 #16의 품질 게이트는 새 유파명·세력명·인명마다 독립된 한국어 자료 2–3건의 검증표를 요구한다. 이 설계안은 새 이름을 만들지 않았으므로 아래 표는 사용한 기존 이름의 원천만 적는다. 외부 자료 대조는 하지 않았다. 선택 질문 Q16 (a)에 따라 새 이름이 없는 동안 외부 대조를 면제한다(소유자 2026-09-28 추천안 일괄 채택).

| 이름 | 종류 | 원천 | 새 이름 여부 |
|---|---|---|---|
| 수문호흡법·차륜강체공·강단호명법·호위철벽진·죽검연환법·연각권법·총검술·감응조준법 | 유파 정식명 | `Martial-Paths.json` 여덟 유파 표, `Naming-Ledger.json` `martialSchools` | 기존 |
| 개방 무공, 항룡십팔장, 타구봉법, 소림 | 갈래·레퍼런스 무공명 | `Martial-Paths.json` 개방 무공 절, `Naming-Ledger.json` `martialBranch` | 기존 |
| 태권도 | 실존 무술 | `Martial-Paths.json` 이름을 이어 쓰는 무술 절 | 실제 이름 |
| 환승계 | 이동 상호부조망 | `Martial-Paths.json` 환승계 절 | 기존 |
| 대림·가리봉 중국동포 회랑, 규격맹, 안국총림 | 회랑·국가 | `Diaspora-Corridors.json`, `Sixteen-States.json` | 기존 |

## 5. 법무 메모

계획 원장 T28은 실존 무술 단체의 상표·명예 검사를 요구한다. 아래 표는 설계안(`lore/editorial/Martial-Concept-Design.json`)에 나오는 실존 무술·단체·작품 이름을 공개 자료로 대조한 위험 선별 결과다. 변호사 자문이 아니며, 사용 허용이나 금지를 확정된 법적 사실로 쓰지 않는다. 조회일은 2026-09-28이다.

- 검토자: OmO lead review 2026-09-28 (owner-approved recommendation)
- 근거 결정: 선택 질문 Q15 (a), 소유자 2026-09-28 추천안 일괄 채택

| 대상 | 쓰임 | 확인한 점 | 공개 자료 | 결과 |
|---|---|---|---|---|
| 태권도 | 실존 무술 이름. 연각권법의 2026년 기원 | 국기원·세계태권도연맹은 각자 기관명과 로고를 쓰는 별개 단체다. 설계안은 무술 이름만 쓰고 두 단체명·로고·품새명·사범 이름을 쓰지 않는다. | https://en.wikipedia.org/wiki/Kukkiwon · https://en.wikipedia.org/wiki/World_Taekwondo | 위험 낮음. 조건: 기관명·로고·단증 체계를 2126년 유파의 소유로 쓰지 않는다. |
| 검도·거합도·고류 | 죽검연환법의 2026년 기원 | 전일본검도연맹이 제정 거합 형을 정했고 고류는 개별 유파 이름을 가진다. 설계안은 종목 이름만 쓰고 연맹명·유파명(무쌍직전영신류 등)을 쓰지 않는다. | https://www.kendo.or.jp/en/organization/ · https://en.wikipedia.org/wiki/Iaido · https://www.kendo-world.com/what-are-koryu | 위험 낮음. 조건: 실존 연맹·고류 이름을 2126년 족보로 쓰지 않는다. |
| 택견·씨름·태극권 | 실제 이름을 그대로 쓰는 무술 | 셋 다 유네스코 인류무형문화유산이다(택견 2011, 씨름 2018 남북 공동, 태극권 2020). 특정 단체 소유 명칭이 아니다. | https://en.wikipedia.org/wiki/List_of_Intangible_Cultural_Heritage_elements_in_South_Korea · https://www.koreatimes.co.kr/lifestyle/koreanheritage/20181126/ssireum-listed-as-unesco-intangible-cultural-heritage · https://ich.unesco.org/en/RL/taijiquan-00424 | 위험 낮음. 조건: 전승을 비하하거나 범죄 기술로 묘사하지 않는다. |
| 수박·유도·본국검법·태극검법 | 실제 이름을 그대로 쓰는 무술 | 종목·역사 기법명이다. 설계안은 이름만 들고 단체명(강도관 등)·교본 문구를 옮기지 않는다. | https://en.wikipedia.org/wiki/Judo · https://en.wikipedia.org/wiki/Kukkiwon | 위험 낮음. 조건: 단체명·교본 원문을 쓰지 않는다. |
| 소림·소림사 | 안국총림이 따로 전하는 무공 갈래, 레퍼런스 이름 | 숭산 소림사는 “소림사”를 45개 상품·서비스류 전부에 상표로 등록했고 80개국 넘게 출원했다. 미국 등록 상표 SHAOLIN(등록번호 2882759)도 있다. | http://www.china.org.cn/english/international/99755.htm · https://mdpi.com/2077-1444/8/11/246/htm · https://www.sixthtone.com/news/1006206 · https://trademarks.justia.com/769/76/shaolin-76976668.html | 위험 중간. 위키 산문 속 무공 갈래 이름으로 쓰는 것은 상품 표지가 아니다. 조건: 게임 제목·상품명·로고·굿즈에 “소림”을 쓰지 않고, 상품화 전에 권리 검토를 다시 한다. |
| 개방·항룡십팔장·타구봉법·화산파(김용 작품명) | 김용 작품에서 차용한 갈래·무공 이름 | 김용(查良鏞)이 강남(양즈)을 상대로 낸 소송에서 광저우 법원은 김용 작품의 인물 이름을 가져다 쓴 소설이 부정경쟁·저작권 침해라고 판단했다(1심 2018, 항소심 2023). 이 설계안은 인물 이름·줄거리·초식 목록·설명·계보를 옮기지 않고 무공 이름 넷만 쓴다. | https://www.scmp.com/tech/tech-trends/article/3220526/hong-kong-wuxia-novelist-louis-cha-jin-yong-gets-posthumous-victory-copyright-lawsuit-against · https://www.chinajusticeobserver.com/a/chinese-court-first-finds-fanfiction-to-infringe-copyright · https://ipkitten.blogspot.com/2020/07/guest-post-warming-up-legality-issue-of.html | 위험 중간. 조건: 김용 작품의 인물명·초식 이름 목록·설명문을 옮기지 않고, 무공 이름을 상품명으로 쓰지 않는다. 중국어권 출시 전에 권리 검토를 다시 한다. |
| 거지·소매치기 서술, 대림·가리봉 중국동포 회랑 | 생업·행위, 대림 세력과의 정합 | 영화 「청년경찰」은 대림동 중국동포를 범죄 집단처럼 그렸다는 이유로 주민 62명에게 소송을 당했고, 항소심 재판부는 제작사에 사과와 혐오 표현 검토를 권고했다(2020). 설계안은 소매치기를 대림 회랑에 두지 않고 일부 계원의 행위를 전체에 돌리지 않는다(Q11·Q12). | https://www.newsis.com/view/NISX20200618_0001064080 · https://www.hankyung.com/article/202006180976H · https://en.wikipedia.org/wiki/Midnight_Runners | 위험 낮음(현재 문안). 조건: 이후 사건·인물에서도 범죄 행위를 특정 이주민 공동체나 실제 동네에 묶지 않는다. |

설계안에서 새로 만든 유파·단체 이름은 없으므로 이름 충돌 검사 대상은 위 실존 이름뿐이다. “위험 중간” 두 행은 위키 산문 사용을 막지 않는다. 다만 상품화·현지화 단계로 넘어가면 권리 검토를 다시 받는다.
