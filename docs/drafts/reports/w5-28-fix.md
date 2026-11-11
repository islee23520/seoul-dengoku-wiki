# W5-28 결함 수정 검증 보고서 (w5-28-fix)

과제: 통합(4d7f0f6ed)의 독립 검증이 지적한 결함 H1·H2·H3·M1·M2·M3·M4·M5·EXTRA(a·b·c)를 같은 브랜치 `feat/wiki-canon-rewrite-integration`에서 수정하고 전 항목을 측정으로 검증한다. 작업 2026-11-11, 워크트리 `C:/Users/oliver/AppData/Local/Temp/wt-integ-fix`(신규 생성 — 이전 wt-integ 미사용·미수정). 실행 모델: 작업 JSON `effective_model` = **cpa/glm-5.3**(tasks/st_01a1c8d7.json 직독). 모든 데이터 변경은 규칙표+스크립트로 재현 가능하다(아래 8절).

## 1. 결함별 결과

### H2 — Century-Annals 구 제목 (커밋 6e1faa5dc)
- 두 언어 초안 머리말에 `title: Century Annals` / `title_ko: 서울전국 연표` 추가 후 `rewrite-doc.mjs --only Century-Annals` 재실행. 030 셀 비교(node:sqlite 독립): **title·title_ko 2셀만 변화**(본문 100%/100%, 앵커 400·제목 385 불변, roundtrip exit 0).
- 구 제목 텍스트 사용처 전수: 030의 다른 문서 링크 텍스트 3건(Faith-Culture-Schism 영 2, Oral-Stories 영 1, World-Narrative-Atlas 영 1 = 계 4링크)을 `Century Annals`(구 연표 범위 표기는 Oral-Stories `2026-2126` 유지 — 한국어와 대응)로 교체, SPA 하드코딩 라벨 2건(src/components/TimelineOverview.tsx, scripts/generate-catalog.mjs) 동일 정리. 한국어 링크 텍스트는 전부 연도 없음(무변경). World-Expansion-Index·Atlas 링크 텍스트는 이미 연도 없음(무변경 확인). 카테고리·정렬·사이드바는 030 제목 열에서 파생되므로 추가 변경 없음.
- **재빌드 후 구 제목 '2030–2126'이 보이는 빌드 페이지 수 = 0**(grep 전수, 2,858페이지).

### H1 — 구 대정전(2030) 서술 + 매치 단위 분류기 (커밋 284524fdc)
- `docs/blackout-year-rules.json` **규칙 220건**(090 140·110 80) + **보존 판정 84건**(생년 76·이야기 내 날짜 2·H3 위임 6). `scripts/pages/blackout-year-edit.mjs`: 규칙마다 (file,id,column,path) 셀에서 old 문장이 정확 1회일 때 1회만 치환(숫자 전역 치환 금지), ck3-stats 직렬화 재사용, old 부재 시 크게 실패.
- 적용: **090 33행(문자열 셀 66), 110 8행(셀 16)만 변화, 행 수 불변(1022/148)**. 잔여 2030 문맥 재스캔: 090 6건(=H3 위임 0195×4 + 보존 0297×2), 110 78건(=생년 76 + H3 위임 c624×2) — 설계와 정확히 일치.
- `w5-28-scan-built.mjs`를 **매치 단위 분류**로 재작성(y2030 → title/old-blackout/birth-or-date/hash-substring/other, 존속 조직명 면제 의존 매치 별도 계수). 통합 시점 dist에서의 실측(정정된 참값): **y2030 2,826 = title 2,604 + old-blackout 136 + birth-or-date 80 + other 6**; 검증자 수치(제목 2,604 매치/2,594페이지)와 일치.
- **최종 빌드에서 old-blackout 매치 = 0**(아래 8절 표).

### H3 — org-name-map 조직→정치체 (커밋 f23beb6d2)
- person-0195 기저(인계 적용 전 090) 확인: 원조직은 '중앙정보부/Central Intelligence Agency'. 중립 표현은 바이블 Q15 계열 일반명사 **'정보기관/the intelligence service'**(신규 고유명사 아님; Q7 직함 '원장' 유지). 문장 단위 규칙으로 전 셀 재작성(position·stateName·fields.소속/Affiliation·직함/Title·sections·biography, 양언어) + 110 c624 노드 2셀. '약 2026년/around 2026' 연도 교정 포함. '첩보 조직이었던 ~만이 진정한 대한민국과 청와대 지하 동면소에 잠든 실제 대한민국정부 인사들의 존재를 안다' 구 서아는 중립 표현으로 보존(소유자 결정 대기 — 6절). EN 'Only the Government, formerly an intelligence organization, ...'의 동명 중복 appositive는 일반명사화로 자연 소거(삭제 근거 규칙 reason에 기록).
- **같은 부류 스윕 전수**: 인계 org-name-map 적용 2,454항목 → 정치체 명사 문장 후보 1,468(필드 전체값 680·문장 788) → 좁은 기준(조직 서술어가 정치체 명사를 주어·소유 대상으로 쓰는 경우) 재스캔 → **19문장: 13이 person-0195(결함·수정), 6이 'Seoul Metropolitan Government local civil service organization'(person-0461·1016 — org-name-map의 산물이 아니라 존속하는 실채 조직명, approved)**. 속성 직함·소속 표기('정부 역장' 등)는 통합이 수용한 매핑 설계로 판정해 미변경(판정 기준 보고).

### M1 — 부분 치환 잔여 (커밋 f23beb6d2)
- 기저 대조로 원인 확인: EN 'Jeongdong Federation of Labor Unions'의 일부('Jeongdong Federation')만 'Arc'로 치환 → 'Arc of Labor Unions'. 전체 구절 치환으로 정리: **person-0405 2셀(sections.Duty + biography 2곳), person-0406 2셀(sections.Duty + openingTitles[0].name → 'Gangnam-gu Arc Duchy', 한국어 '강남구 Arc 공작령'과 대응)**.
- **표시명 잔여 전수 스윕**: org-name-map 적용 2,629항목 전셀에서 의심 패턴('Arc of|Arc the|Arc and|Arc[a-z]|Government…|혼합 문자') 97힐트 → 판정: 'Arc of Labor Unions' 4셀(수정), 'the Arc's/Arc's'(소유격)·'Archive/Archivist'(일반 영단어)·'Arc의/가/에/은/와'(한국어 조사)·'internal function of the Arc and is neither…'(접속사)는 정상 표기(보존). 'Governmental/Arcade'류 단어 내 혼입 0건.

### M2 — 중복 HTML id (커밋 51c244434)
- 원인: 명시 앵커 3개(faith/schedule/sources)가 영문 자동 헤딩 id와 충돌(한국어 헤딩은 슬러그가 달라 미충돌), Century-Annals 2125년 '시청역 노동자들' 절이 두 장(ch37·ch47)에 같은 앵커를 사용. 수정: 명시 앵커 3개 양언어 동시 제거(앵커 집합 동일성 유지), 이중 앵커는 **'2125년-ch37-시청역-노동자들'/'2125년-ch47-시청역-노동자들'로 분리**(양언어). 인바운드 링크: .anchor-baseline·030 전수에서 해당 파편 링크 0건 확인(갱신 불필요).
- **실제 HTML 중복 id 검사(신규 scripts/pages/w5-28-dup-id-check.mjs, 2,858페이지 전수): 중복 페이지 0건**(검증 기대 상한은 기존 빌드의 사전 존재 1건 이하 — 0으로 통과). check-site exit 0, **known-broken 0, new-broken 0**(Fragments checked 32,955 links).

### M5 — 독자 문면의 집필 출처 표기 (커밋 51c244434)
- World-Unbinding 영 8·10·128줄의 'Chapter 1 describes/states' 3문장을 세계 내 평서문으로 재작성, 한국어 대응 3문장 동일 처리. **58개 패치 초안 전수 스윕**('Chapter [0-9]','제1장','1장은','2장은','정본','초고','bible','canon' 등): 추가 적중 — Scenario-Timeline 2문장(약 2026 항목의 1장 인용, '신' 인용문)과 출처 목록의 '1장 고예진/Chapter 1, Go Ye-jin' 2행(삭제), Structures 표 머리 'Canon for detail/상세 정본'→'Details/상세 문서'. 보존 판정: '개정본'(족보·도면 개정판), '독자 전략'(기계의 독자적 전략), 'draft from the frozen leftovers'(냉기 바람) 등 세계 내 표기. 최종 스윕 잔여 0(세계 내 표기 제외). 파이프라인 재실행 5슬러그, 030 셀 비교로 의도 셀만 변화 확인, roundtrip exit 0.

### EXTRA (커밋 f23beb6d2)
- **(a)** person-1018: biography '- Affiliation: Arc. She holds no office in any state.'→'…She is the Hierophant of the Arc.', '- Civil/community duty: Inter-Region Contract Advisor…'→'Hierophant of the Arc…', 한국어 대응 2셀, 이력 문장 'worked there as an inter-region contract advisor'→'worked there on contract matters'(한국어 대응). person-1017: 소속·생업·민간 직무·관계 문장의 '독립 전령/independent courier/Courier'를 §6 승인값(2120년부터 고예진의 경호원)으로 정합, 관계 상대(person-1022 문도현) 행의 동일 문장 6셀 포함. 거점·길목사무소 소속은 Q5 대기라 보존.
- **(b)** person-1019: 십육국 야망 **구절만 삭제**(fields + biography, 양언어 4셀 — 인계 지시서의 owner-decision 항목은 3건이었으나 동일 주장의 4번째 셀도 포함). 나머지 야망 문장('같은 판의 사본을 두려 한다') 보존. **오케스트레이터 판단 기록**: 대기 중인 소유자 질문(칭호 계열 Q19~Q29)은 이 문장을 덮지 않는 평문의 십육국 세계 주장(바이블 1절 규칙 7 위반)이므로 삭제했다.
- **(c)** Arc 뇌/성소 공개 범위(Q10~Q12), 차예원 관악 도위(Q21) 등 미결 질문은 미수정(6절 목록).

### M3 — w5-28.md 정정 재작성 (이번 커밋)
초판 주장을 실측으로 교체: prose-context **9**(namedAudit 46 = pending 24 + approved-kept 13 + prose-context 9), SQL 재현 파일 **18종**, 재작성 href 66 = **HEI-ko 36 + External-Theaters 20 + Scenario-Timeline 10(‘Sindorim’ 오기 정정)**, 제목 열 불변 주장 철회(H2로 Century-Annals title·title_ko 변경), 스캔 항목 2,788 vs 고유 페이지 2,613 명시, 통합 시점 스캔 JSON 1,023,126B 명시, **w5-25-handoff-090.json 5,247,117B를 필수 기계판독 입력으로 명시**, staging 사건(5e7302532 실수 되돌림 → 7c7318864 복원) 진실 기술 + '재베이스는 트리와 데이터 해시로 판단하라', '모든 매치 분류·leftover 0' 주장 철회 → 매치 단위 분류표, **존속 조직명 면제 615매치 미검증 공개 + 30표본 직접 판정**(아래 5절).

### M4 — 브라우저 워크 (이번 커밋)
- GDD 선정을 재귀 탐색으로 바꿔 **2단계 깊이의 실제 문서**(`architecture/unity-architecture`)를 걷는다(섹션 색인이 아님).
- 종료 정리: DevTools **Browser.close** + **프로필 경로로 식별한 자기 프로세스만** 트리 킬 반복(사용자 브라우저 미접촉 — 임시 프로필 경로가 명령줄에 있는 msedge만). 실측: browserClose=true, killRounds=0, **종료 3초 후 잔존 0**(첫 실행의 미보강 판은 14잔존 → 스크립트 경합 수정과 함께 해소). 페이지별 CDP 오류는 walkError로 기록하고 계속(walkErrors 0).

## 2. 최종 매치 단위 2030 스캔 (w5-28-scan-built.mjs, 최종 dist 2,858페이지)
| 매치 부류 | 매치 수 |
|---|---|
| birth-or-date (생년·이야기 내 날짜) | 76 |
| other-y2030 (전수 목록 대상 — 아래 4절) | 2 |
| **old-blackout (구 대정전 서술)** | **0** |
| **title (구 제목 2030–2126)** | **0** |
| y2030 계 | 78 |
(참고: 나머지 부류 — church 443[record-schema 14·owner-pending 602·기타 27], old-org 826[면제 615·보류 211], slaughter 6, sixteen 19, 총 1,372매치·고유 히트 페이지 216)

## 3. 실제 브라우저 12페이지×2언어 (헤드리스 Edge CDP, 자체 임시 프로필)
모두 HTTP 200·콘솔 에러 0(CDP+프로브 이중). h1: Century-Annals='Century Annals/서울전국 연표'(새 제목 반영), person-0170='Bak Tae-gyeom/박태겸', person-0195='Oh Hae-rin/오해린', person-0406='Seon Chobyeol/선초별', person-1018='Go Ye-jin/고예진', person-1017='Ji Yeon-hui/지연희', person-1019='Bak Seong-su/박성수', World-Unbinding='The Great Blackout/대정전', Sindorim='Sindorim Junction Cargo Gate/신도림 연결부 화물문', 중첩 GDD 'architecture/unity-architecture'='Unity Structure/유니티 구조', factions-index='Factions/세력', map='Territory Map/서울 영토 지도'. 교정 문장 가시 확인(빌드 가시 텍스트 16/16): 0170 'went through the Great Blackout around 2026/약 2026년 용산호송가에서', 1012 'equipment stops around 2026', 1016 '약 2026년 명부를…', 0195 'current AI avatar of the intelligence service/정보기관은 약 2026년부터…', 0406 'Gangnam-gu Arc Duchy', 1018 'She is the Hierophant of the Arc/아크의 교주이다', 1017 "She has been Go Ye-jin's bodyguard since 2120/2120년부터 고예진의 경호원이다", 1019 '개인 야망: 같은 판의 사본을 두려 한다', World-Unbinding 'It only made the winter./아크에서는 신앙을…', Scenario-Timeline 'Go Ye-jin calls the First AI "God"', Structures 'Details/상세 문서'. **정직 한계: 이 모델(cpa/glm-5.3)은 이미지를 볼 수 없다 — 스크린샷 16장(1280·390)은 생성·크기 검증만 했고 육안 검수는 하지 않았다.** 전체 순회는 36경로×2언어 72페이지(non200 1: ko:showcase — EN 전용 설계).

## 4. 보존(kept) 2030 전수 목록
- **090 person-0297 ×2**(biography 양언어): '장현석의 2030년 기록은 선대의 일…' — 이야기 내 기록 연도(대정전 아님).
- **110 birthDate ×76**(38노드×양언어): 2030년생 출생 연도(약 2026년 대정전 이후 세대 — 정당).
- **030 Century-Annals 앵커 id ×16**('2030년-청와대-…' 등): id 속성 전용(가시 텍스트 아님), 인바운드 링크 보존용 기존 앵커 — 본문의 2030 서술은 0건.
- 빌드 가시 텍스트에 남는 2030은 위 2건(person-0297 양언어)뿐(other-y2030 부류).

## 5. 존속 조직명 면제 — 미검증 공개 (M3 요구)
최종 스캔 기준 **615매치**가 '존속 조직명' 면제에 의존한다(통합 시점과 동수). 문장이 다른 484종에서 결정론적 30표본 직접 판정: **27은 회사·리그·사령부의 존속 서술**(연표 2095~2123 사건, 생태 서식지 인용, 물류 서술), **3은 국가 기능 성격으로 면제 부적합 판정** — 흰십자단 단장 류은비(Ailments 한국어, Q27 직결), 동방사의 경비지구 편성(Century-Annals 2098), 규격맹의 시민권 명부(Century-Annals 영어). 셋 모두 소유자 결정 대기로 공개하며 615를 승인으로 세지 않는다.

## 6. 열린 소유자 결정 (미수정 목록)
Q5 지연희 거점·길목사무소 소속 / Q7 오해린 직함 '원장'(중립 조직 표현 '정보기관'은 Q15 계열 일반명사) / **Q10~Q12 Arc 뇌·성소 공개 범위** / **Q21 차예원 관악 도위** / Q26·Q27 백온·류은비 직함(흰십자단 문구 존속) / 직함 보류 22인의 org-name-map skipped-pending 175항목 / **옛 국가 조직의 존속 범위(위 5절 3표본 포함)** / 오해린의 '진정한 대한민국·지하 동면소' 구 서아 보존 여부 / 090 owner-decision 산문(clergy-vocab 299·bible6-stale-role 9).

## 7. data/sql 변경 폭 (4d7f0f6ed 기준, node:sqlite 독립 대조 — w5-28-fix-sql-diff.json)
파일 증감 0. 행 수 전 표 불변(wiki_document 59, person_detail 1,022, family_tree 148, wiki_person 1,022, …). 변경: **person_detail 40행(json 40·json_ko 38)·family_tree 9행(json 9·json_ko 9)·wiki_document 8행(body_md 8·body_ko_md 5, title 1·title_ko 1)**. 제목은 **Century-Annals 한 쌍만** 변화. 그 외 표 변화 0. 세 커밋 그룹의 합계와 정확히 일치(H1: 090 33행·110 8행, H3/M1/EXTRA: 090 7행·110 1행, H2/M2/M5: 030 8행).

## 8. 재현성 (사전 단계 트리에서 바이트 동일)
- `blackout-year-edit.mjs`: 사전 상태에서 2회 실행 → 090·110·로그 바이트 동일(cmp 3종 IDENTICAL).
- `integ-sentence-edits.mjs`: blackout 적용 후 상태에서 재실행 → 090·110·로그 바이트 동일(2단계 연쇄로 최종 상태와 IDENTICAL).
- `w5-28-scan-built.mjs`·`w5-28-dup-id-check.mjs`: 같은 dist에서 2회 실행 → 산출 JSON 바이트 동일(스캔 533,773B는 커밋본과도 동일).
- `w5-28-browser-walk.mjs`: 측정 도구(포트·시각 포함)라 산출 JSON의 바이트 재현은 보장하지 않는다 — 측정 항목(상태·콘솔·h1·정리 잔존 0)은 재실행으로 확인했다.
- H2/M2/M5의 030 변경은 `rewrite-doc.mjs --only <슬러그>` 재실행 + roundtrip exit 0 + 셀 비교로 재현(각 커밋 시 측정).

## 9. 빌드·검사 (SITE_BASE='/', 출력 Temp/w528fix-dist, 영수증 Temp/w5-28-fix-scratch/build)
`w5-28-run-build.mjs`: build exit 0(vitepress 72.63s; wiki 59·gdd 129·factions 4·states 3·people 1,022; showcase mounted; 파편 href 정규화 66건 재현) → check-site **exit 0: "Fragments checked 32955 links, known-broken 0, new-broken 0"**(EN 1,428 + KO 1,428 + showcase 1). `scan-terms.mjs --terms docs/canon-terms.json --all`: **금지 위반 0, 필수 위반 0**(문서 59/페이지 118).

## 10. 리스크
- 존속 조직명 면제 615매치 중 3표본이 국가 기능 성격(5절) — 소유자 결정 전까지 미해결로 공개.
- 050-030-090 간 옛 조직명 불일치(예: person-0070의 050 직위 '태욱그룹 회장 전령' vs 090 소속 'Arc')는 이번 범위 밖 후속 과제.
- person-0195의 `state` id('government')는 데이터 매핑이라 그대로 뒀다(stateName·산문은 중립 표현) — 소유자 판단 대기.
- 스크린샷 육안 검수 불가(모델 한계, 3절 명시).

## 커밋 목록 (4d7f0f6ed → HEAD, 이번 작업)
6e1faa5dc fix(pages) Century-Annals 제목 — H2 · 284524fdc fix(data) 구 대정전 2030 교정 — H1 · f23beb6d2 fix(data) org→polity·잔여·스테일 직함 — H3·M1·EXTRA · 51c244434 fix(pages) 중복 앵커·집필 출처 표기 — M2·M5 · (이번) fix(pages) 브라우저 워크 M4 + 검사 스크립트 · docs(pages) w5-28.md 정정 + 본 보고서 — M3·검증.
