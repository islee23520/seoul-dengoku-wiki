# W3 B조 초안 수정 라운드 2 보고서

- 대상: `docs/drafts` 다섯 문서 한영 열 파일 (Food-Culture, Hangnyeol-and-Bon-gwan, People-and-Machines, Regional-Physical-AI-Arcs, Synthetic-Actors)
- 기반: 61b6e6b6d (feat/w3-b-drafts tip, base 26ec455cc). 독립 검증 `.omo/evidence/w3-b-gate-review.md`의 REJECT(B1~B6) 이후 수정 라운드. 앞선 작업자가 사용량 한도로 중단한 미커밋 변경을 검토해 유효 부분을 그대로 유지하고, 아래 조치를 마저 완료했다.
- 명시적 cwd: `C:/Users/oliver/AppData/Local/Temp/wt-w3-b`. node는 `C:/nvm4w/nodejs/node.exe`(v24.13.1)를 argv 배열로 실행했다.

## 결함 조치 내역

1. **B1 (RPAA ko:50 / en:50)** — '매뉴얼에서 명령 체계를 알아냈다' / 'From the manuals ... learned the command system' 문장과 '일부 드론·병기가 그 명령을 받았고 켜고 끌 수 있게 됐다' 문장을 양 언어 모두 삭제했다. 매뉴얼 경로도 1장의 '켜진 신' 경로도 모두 공개 본문에 남지 않았다. 남은 문장('기계를 세우자 강남 대피소 사람들이 찾아왔다', 기계 이식 세례, 수서 옛 차량기지 아래 봉헌실)은 승인 공개 문구다. 연표행 `2112~2117 그곳에 남은 매뉴얼을 다섯 해 동안 읽는다`는 확정 연표(B3)에 근거한 기존 행으로, 명령 체계 습득 경로를 서술하지 않으므로 그대로 둔다.
2. **B2 (Synthetic-Actors ko:522/530/890/898, en 동일 단위)** — F07은 신가온/Sin Gaon → 알렉산더 밀러/Alexander Miller(person-0171, characterId K170), V07은 권시온/Gwon Sion → 에바 노바코바/Eva Novakova(person-0172, characterId K171)로 양 언어 각 2곳(계 8곳)을 교정했다. 아래 'custodian 전수 감사'에서 48개 단위를 전부 대조했다.
3. **B3 (Synthetic-Actors en)** — 검증 보고서가 지목한 21개 이름의 옛 철자를 050 철자로 바꿨다. 대체 건수: 옛 철자 42곳(Sin Gaon 2, Gwon Sion 2 포함; 순수 철자 교정 38곳 — 스펙행 21 + 본문 반복행 17). 수정 후 en 본문의 050 인물 이름 적중 48개가 전부 데이터 철자와 일치한다.
4. **B4 (편집 설명 문구)** — People-and-Machines ko:37/51, en:38/54('라인 이름과 봉인 좌표는 창작 설정이다', '철새와 포식 조류를 묶는 군락 명칭은 창작이다', 'this page did not prove any list of real 2026 deployments', 'this compendium fixed only ...'), Hangnyeol-and-Bon-gwan en:22('Hanja-surname rows copied into this repository') 및 같은 단락의 '캐스트가 실제 쓰는/창작 문중/created clans' 서술, People·RPAA 도입부의 '이 총람은/이 문서는' 문장을 세계 안 서술로 고쳤거나 삭제했다. 수정 후 열 파일에서 창작/설정/저장소/이 문서/편집/캐스트/데이터/canon/provisional/invented/repository/this page 등 정규식 적중 0. 광역 스캔(문서·페이지·작성·we·reader)의 잔여 적중은 교차 링크 문구·nav 제목('## 관련 문서')·세계 안 기록 서술뿐이다.
5. **B5 (People-and-Machines ko:31 / en:32)** — `H01–H16`의 en dash 4개(언어당 2개)를 `H01-H16` 하이픈으로 바꿨다. 수정 후 열 파일에 U+2013/U+2014 잔여 0.
6. **B6 (Food-Culture en:48)** — 한국어 ko:47 '급수량에 따라 배급미가 나뉜다'의 번역 'Ration rice is divided according to the amount of water supplied.'를 en 대응 단락 같은 위치에 추가했다(그 외 바이트 불변).
7. **모델 라인** — 열 파일의 front matter model 라인을 모두 `cpa/glm-5.3; 0 completion calls; written by the agent by hand; not from a Gemini model`(접미사 없음)로 맞췄다. 이 라운드의 completion 호출은 0회다. Gemini가 아니다. 앞선 라운드(st_01a1c7b2, cpa/claude-opus-5-5)가 쓴 초안 뼈대 위의 표적 치환이다.

## custodian 전수 감사 (Synthetic-Actors 48단위 × 050/090)

방법: 각 단위의 `- 관계/- Relations` 줄에서 custodian characterId를 뽑아 090 `person_detail.characterId` → person_id → 050 `wiki_person` 이름(en·ko)과 초안의 `- 정비/- Maintenance` 이름, `- 보관/- Custody` 가문, 감사 입회 가문을 대조했다. 결과 48/48 이름·가문 일치.

| 단위 | custodian | 사역 가문(감사) | 데이터 행(050/090) | 데이터 이름 en/ko | 초안 이름 en/ko | 대조 | work_peer |
|---|---|---|---|---|---|---|---|
| H01 | K001 | HC01 | person-0001 | Han Jae-mok / 한재목 | Han Jae-mok / 한재목 | 일치 | K004(Bak Nu-ri) |
| H02 | K029 | HC02 | person-0029 | Gang Minseo / 강민서 | Gang Minseo / 강민서 | 일치 | K011(Gu Taeyun) |
| H03 | K057 | HC03 | person-0057 | Jeong Hojun / 정호준 | Jeong Hojun / 정호준 | 일치 | K018(Heo Eunchan) |
| H04 | K086 | HC04 | person-0086 | Im Hajun / 임하준 | Im Hajun / 임하준 | 일치 | K025(Chae Hansol) |
| H05 | K115 | HC05 | person-0116 | Bae Ujin / 배우진 | Bae Ujin / 배우진 | 일치 | K032 |
| H06 | K144 | HC06 | person-0145 | Yun Seo-rin / 윤서린 | Yun Seo-rin / 윤서린 | 일치 | K039 |
| H07 | K169 | HC07 | person-0170 | Bak Tae-gyeom / 박태겸 | Bak Tae-gyeom / 박태겸 | 일치 | K046 |
| H08 | K194 | HC08 | person-0195 | Oh Hae-rin / 오해린 | Oh Hae-rin / 오해린 | 일치 | K053 |
| H09 | K219 | HC09 | person-0220 | Choe Ji-u / 최지우 | Choe Ji-u / 최지우 | 일치 | K060 |
| H10 | K245 | HC10 | person-0246 | Baek On / 백온 | Baek On / 백온 | 일치 | K067(090행 없음) |
| H11 | K271 | HC11 | person-0272 | Yi Hong-won / 이홍원 | Yi Hong-won / 이홍원 | 일치 | K074 |
| H12 | K296 | HC12 | person-0297 | Jang Sehwa / 장세화 | Jang Sehwa / 장세화 | 일치 | K081(090행 없음) |
| H13 | K322 | HC13 | person-0323 | Ryu Eunbi / 류은비 | Ryu Eunbi / 류은비 | 일치 | K089 |
| H14 | K348 | HC14 | person-0349 | Go Seojun / 고서준 | Go Seojun / 고서준 | 일치 | K096 |
| H15 | K373 | HP01 | person-0374 | Nam Yun-gyeong / 남윤경 | Nam Yun-gyeong / 남윤경 | 일치 | K103 |
| H16 | K398 | HP02 | person-0399 | Jeong Yura / 정유라 | Jeong Yura / 정유라 | 일치 | K110 |
| F01 | K002 | HC09 | person-0002 | I Seo-dam / 이서담 | I Seo-dam / 이서담 | 일치 | K117 |
| F02 | K030 | HC10 | person-0030 | Jeong Siu / 정시우 | Jeong Siu / 정시우 | 일치 | K124(090행 없음) |
| F03 | K058 | HC11 | person-0058 | Jeong Harin / 정하린 | Jeong Harin / 정하린 | 일치 | K131 |
| F04 | K087 | HC12 | person-0087 | Im Chowon / 임초원 | Im Chowon / 임초원 | 일치 | K138(090행 없음) |
| F05 | K116 | HC13 | person-0117 | Kim Uchan / 김우찬 | Kim Uchan / 김우찬 | 일치 | K146 |
| F06 | K145 | HC14 | person-0146 | Gang Ye-jun / 강예준 | Gang Ye-jun / 강예준 | 일치 | K153 |
| F07 | K170 | HP01 | person-0171 | Alexander Miller / 알렉산더 밀러 | Alexander Miller / 알렉산더 밀러 | 일치(이번 교정) | K160 |
| F08 | K195 | HP02 | person-0196 | Jo Min-jae / 조민재 | Jo Min-jae / 조민재 | 일치 | K167 |
| F09 | K220 | HP03 | person-0221 | Gwon Mi-rae / 권미래 | Gwon Mi-rae / 권미래 | 일치 | K175 |
| F10 | K246 | HP04 | person-0247 | Sin Boram / 신보람 | Sin Boram / 신보람 | 일치 | K182 |
| F11 | K272 | HP05 | person-0273 | Song Ha-yul / 송하율 | Song Ha-yul / 송하율 | 일치 | K189 |
| F12 | K297 | HP06 | person-0298 | An Dohan / 안도한 | An Dohan / 안도한 | 일치 | K197 |
| F13 | K323 | HP07 | person-0324 | Sim Dalho / 심달호 | Sim Dalho / 심달호 | 일치 | K204(090행 없음) |
| F14 | K349 | HP08 | person-0350 | Mun Hayul / 문하율 | Mun Hayul / 문하율 | 일치 | K211 |
| F15 | K374 | HP09 | person-0375 | Eun Taeho / 은태호 | Eun Taeho / 은태호 | 일치 | K218 |
| F16 | K399 | HP10 | person-0400 | Ha Seojin / 하서진 | Ha Seojin / 하서진 | 일치 | K225 |
| V01 | K003 | HP03 | person-0003 | Gim Tae-un / 김태운 | Gim Tae-un / 김태운 | 일치 | K232 |
| V02 | K031 | HP04 | person-0031 | Kim Nayul / 김나율 | Kim Nayul / 김나율 | 일치 | K239 |
| V03 | K059 | HP05 | person-0059 | Choe Eunjae / 최은재 | Choe Eunjae / 최은재 | 일치 | K247 |
| V04 | K088 | HP06 | person-0089 | Han Somi / 한소미 | Han Somi / 한소미 | 일치 | K254 |
| V05 | K117 | HP07 | person-0118 | Jeong Soyul / 정소율 | Jeong Soyul / 정소율 | 일치 | K261 |
| V06 | K146 | HP08 | person-0147 | Jo Ha-rin / 조하린 | Jo Ha-rin / 조하린 | 일치 | K268 |
| V07 | K171 | HP09 | person-0172 | Eva Novakova / 에바 노바코바 | Eva Novakova / 에바 노바코바 | 일치(이번 교정) | K276 |
| V08 | K196 | HP10 | person-0197 | Yun Seo-ha / 윤서하 | Yun Seo-ha / 윤서하 | 일치 | K283 |
| V09 | K221 | HC01 | person-0222 | Hwang Eunseol / 황은설 | Hwang Eunseol / 황은설 | 일치 | K290 |
| V10 | K247 | HC02 | person-0248 | Hwang Serin / 황세린 | Hwang Serin / 황세린 | 일치 | K297 |
| V11 | K273 | HC03 | person-0274 | Jo U-chan / 조우찬 | Jo U-chan / 조우찬 | 일치 | K304 |
| V12 | K298 | HC04 | person-0299 | Jeon Miri / 전미리 | Jeon Miri / 전미리 | 일치 | K311 |
| V13 | K324 | HC05 | person-0325 | Eun Chaeyun / 은채윤 | Eun Chaeyun / 은채윤 | 일치 | K318 |
| V14 | K350 | HC06 | person-0351 | An Gijun / 안기준 | An Gijun / 안기준 | 일치 | K326 |
| V15 | K375 | HC07 | person-0376 | Ra Jinu / 라진우 | Ra Jinu / 라진우 | 일치 | K333 |
| V16 | K400 | HC08 | person-0401 | Gwak Eunjae / 곽은재 | Gwak Eunjae / 곽은재 | 일치 | K340 |

비고:
- work_peer 5건(K067, K081, K124, K138, K204)은 090 `person_detail`에 해당 characterId 행이 없다. 이 다섯 id는 현재 030 기준선 원문의 같은 `Relations` 줄에 그대로 있던 값이며(이번 라운드 무관), 나머지 43건은 090에서 이름까지 확인했다.
- 050 전체 1,022명 이름 스캔: ko 49 적중(위 48 정비자 + '김도하' — H11 배우 별명이 person-0061 이름과 우연히 같은 표기. 기준선 원문이고 en 별명은 'Kimdoha'로 달라 인물 오링크가 아니다), en 48 적중(정확히 48 정비자).
- 가문 대조: 48/48에서 `- 보관` 가문 = 감사 입회 가문 = `steward_house`가 서로 같다.

## 자기점검 (공통 브리프 v2 열 가지, 각각 실행 명령과 수치)

1. **출처 역추적** — 이번 라운드가 더한 문장은 B6 영어 번역 1문장(기존 ko:47 문장의 번역), K170/K171 두 이름(090 person-0171/0172), 050 철자로의 치환뿐이다. 신규 사실 문장 0. 나머지 변경은 삭제·표현 교정이며, 남은 본문의 행별 근거는 독립 검증 보고서의 ledger(`.omo/evidence/w3-b-gate-review.md` '출처·내용 검토' 절)가 이미 대응한다. RPAA 길이 하한은 `--allow-shrink`로 완화했다(아래 21.25%).
2. **지어낸 고유명사** — 신규 단체명·직함·지명·인물 0(변경은 기존 이름의 데이터 철자 교정과 삭제뿐).
3. **비공개 줄거리** — 열 파일 전수 검색 `성소|sanctuary|뇌 적출|스승의 뇌|shrine` 적중 0. RPAA:50은 승인 공개 문구(세례·봉헌실)만 남는다.
4. **편집자 메모** — 수정 후 열 파일 정규식 `창작|설정|저장소|이 문서|편집|미정|확정|소유자|잠정|제안|캐스트|데이터|this page|repository|invented|creative|canon|provisional|proposal` 적중 0. 광역 스캔(`문서|페이지|작성|page|document|we|reader`) 잔여 적중은 교차 링크·nav 제목·세계 안 서술뿐(예: '## 관련 문서', '운전일지를 작성하였다').
5. **연표** — `2030년|in 2030` 적중 0. 2027~2111 연도 토큰 적중 0. 대정전은 '약 2026년', 종점 2122/2126 표기 유지.
6. **지도·인물 대조** — 120-map-core `map_station` 312행 전수 대조: 초안에 나오는 역 언급이 전부 district와 함께 확인됐다(예: 수서·선정릉·청담·삼성=강남구, 자양=광진구, 왕십리·뚝섬=성동구, 마포=마포구, 명동=중구, 동대문=종로구, 창동=도봉구, 노량진=동작구, 영등포·여의도=영등포구, 가락시장·잠실=송파구, 신정·양평=양천구, 암사·고덕=강동구, 구로·천왕=구로구, 마곡=강서구, 군자=광진구, 서울역·안국·광화문=중구/종로구, 용산=용산구). '정릉'('선정릉'의 부분문자열), '구의'(조사 결합), '성수'('성수현'의 부분문자열), '강남'(역 강남역=서초구 vs 지역 표현)은 문맥상 노이즈다. 인물은 위 48행 감사 표.
7. **한영 정합** — rewrite-doc 무결성 검사 exit 0: 앵커 집합 동일(Food 0=0, Hangnyeol 0=0, People 0=0, RPAA 6=6, Synthetic 49=49), 제목 수 동일(4=4, 3=3, 5=5, 6=6, 48=48). B6 시제로 급수량-배급미 사실이 양 언어 모두에 있다. 잉글리시/한글 혼입: en에 한글 0.
8. **제목 열** — 열 파일 front matter에서 `title:`/`title_ko:` 라인 0(model + section_checkpoint만).
9. **모델 기록** — 열 파일 model 라인 = `cpa/glm-5.3; 0 completion calls; written by the agent by hand; not from a Gemini model`(tasks json effective_model = cpa/glm-5.3; PI_MODEL 미사용). completion 호출 0회. 초안 뼈대는 앞선 라운드(cpa/claude-opus-5-5)가 쓰고 이번 라운드가 표적 치환으로 마쳤다. Gemini 산출물이 아니다.
10. **측정값** — 아래 수치는 모두 이번 세션의 실행 결과다. 측정하지 않은 것을 '확인'이라고 쓰지 않았다. 브라우저 렌더링·자동 heading slug 실행은 이 라운드에서 하지 않았다(독립 검증도 별도 항목으로 남긴 한계).

## 검증 실행 (스크래치 복사본 `C:/Users/oliver/AppData/Local/Temp/wt-w3b-scratch/sql`)

| 명령 | 종료 코드 | 결과 |
|---|---|---|
| `node scripts/pages/rewrite-doc.mjs --sql-dir <scratch>/sql --roundtrip` | 0 | 기준선 030 재직렬화 바이트 동일(3,719,229B) |
| `node scripts/pages/rewrite-doc.mjs --sql-dir <scratch>/sql --drafts docs/drafts --only Food-Culture,Hangnyeol-and-Bon-gwan,People-and-Machines,Regional-Physical-AI-Arcs,Synthetic-Actors --allow-shrink` | 0 | 5문서 반영, 앵커·제목 무결성 통과 |
| `node scripts/pages/rewrite-doc.mjs --sql-dir <scratch>/sql --roundtrip` | 0 | 적용 후 재직렬화 바이트 동일(3,675,568B) |
| `node scripts/pages/scan-terms.mjs --terms docs/canon-terms.json --scope <같은 5 slug> --sql-dir <scratch>/sql` | 0 | 금지 위반 0, 필수 위반 0, 면제 0, 건너뜀 0 |
| 독립 SQLite diff(bun:sqlite; `git show HEAD:data/sql/030-wiki-documents.sql` 대 적용본, wiki_document 59행 × 7열 전수) | — | 변경 셀 정확히 10개(5 slug의 body_md·body_ko_md만), 제목·분류·정렬 불변 |

본문 바이트(기준선 030 → 적용본, Buffer UTF-8):

| 문서 | ko | en |
|---|---|---|
| Food-Culture | 6,614 → 5,833B (88.19%) | 7,273 → 6,416B (88.22%) |
| Hangnyeol-and-Bon-gwan | 4,515 → 3,901B (86.40%) | 5,017 → 4,322B (86.15%) |
| People-and-Machines | 8,677 → 8,444B (97.31%) | 9,478 → 9,035B (95.33%) |
| Regional-Physical-AI-Arcs | 23,313 → 4,955B (21.25%) | 26,185 → 4,975B (19.00%) |
| Synthetic-Actors | 59,411 → 59,223B (99.68%) | 68,476 → 68,215B (99.62%) |

## 위험·한계

- RPAA는 기준선의 21.25%(ko)/19.00%(en)다. `--allow-shrink` 완화 사유와 근거 ledger는 독립 검증 보고서에 있다.
- work_peer 5건의 090 행 부재, H11 별명 '김도하'와 person-0061의 표기 중복은 기준선 데이터·원문 상태이며 이번 라운드에서 바꾸지 않았다.
- Food en 'A. The 2026 parts and water exchange'의 볼드 누락 등 기존 서식 그대로(바이트 불변 원칙).
- 이 라운드의 편집은 전부 표적 문자열 치환이다. 재생성·재작성 없음.
