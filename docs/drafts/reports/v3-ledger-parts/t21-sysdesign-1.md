## task 21 — batch sysdesign-1

계획 `.omo/plans/wiki-lore-rebuild-v3.md` 과제 21, GDD 묶음 "sysdesign-1"(시스템 설계 아치파이 D01~D15, `doc.Archify-D01`~`doc.Archify-D15`). 과제 24가 `docs/drafts/reports/v3-provisional-ledger.md`의 과제 21 절로 합치고 전역 번호를 다시 매긴다. 여기 있는 항목은 소유자가 답하기 전까지 승인된 설정이 아니다. 앞선 장의 잠정 값(T04-42, T29-, T31- 등)을 옮긴 것은 다시 올리지 않았다. 손 도구는 저장소 밖(`v3-scripts/t21-sysdesign-1/`)에 두었다.

| # | Document | Location | Provisional item |
|---|---|---|---|
| T21-sysdesign-1-1 | doc.Archify-D07 | 머리말 "v3 기준" 문장 | 충성을 받는 수장(옛 "군주", monarch·own lord)을 세력별로 읽는 법: 정부는 구의 국회의원과 종신 대통령, 자유도시들은 그 도시의 우두머리(관악 공작), 아크는 곁집장과 교주. 자유도시들 전체 위의 수장은 없다 |
| T21-sysdesign-1-2 | doc.Archify-D08, doc.Archify-D13 | 머리말 "v3 기준" 문장 | 합성 인격 인정 검사(`synthetic-person-property-guard`)와 "인정된 합성 인물" 예외는 v3 공개 설정에서 늘 거짓·빈 예비 술어로 읽는다(03장 8절 "생각하는 기계는 없다", T04-42에서 끌어낸 처리). 휴머노이드와 기계는 귀한 장비로서 자산 규칙을 따른다 |
| T21-sysdesign-1-3 | doc.Archify-D11 | 머리말 "v3 기준" 문장 | 수여·임명·회수의 실제 권한자: 정부는 국회의원(동장·역장과의 배급 몫과 징발 단계, 대통령은 구를 쥐지 않음), 자유도시들은 도시 안의 대주회와 우두머리(도시들 위 수여자 없음), 아크는 교주(곁집을 정하고 물림). 09장 4.2~4.4절의 봉신 계약·작위 회수 대응을 수여 도메인에 옮긴 것 |
| T21-sysdesign-1-4 | doc.Archify-D01~D15 전체(본문·표의 계약 값 문자열) | 용어 치환 | 메커니즘 문서의 정치체 낱말을 v3 낱말로 바꿨다: 국가 → 세력, state/country(정치체 뜻) → faction, 군주·monarch·own lord → 수장·leader, elector → voter, 16국·sixteen states·16-country → 세 세력·three factions·per-faction, D09 제목 "국가·정부·기관·직위" → "세력·정체·기관·직위". 식별자(`T68-D09-COUNTRY-LAWS`, `country-law`, `country-rights-law`, `stateId`, 하위 결정 키 `country-institutions-residual`, 상태·처분 값 `approved-structure-payload-values-per-state`·`proposal-per-state-and-office`, 경로 키)와 해시는 바꾸지 않았다(원천 메커니즘 계약과 글자 그대로 같다). 같은 낱말 치환을 그림 원천 `gdd/canon/archify/generated/d07-flow.html`(자기 군주 → 자기 수장)과 `d09-flow.html`(국가· → 세력·)의 노드·간선 표시 문구에도 적용했고 `data-edge` id·key는 그대로 두었으며, 바뀐 두 파일의 sha256만 `manifest.json`에서 갱신했다 |
