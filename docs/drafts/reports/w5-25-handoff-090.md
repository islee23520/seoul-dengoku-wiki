# 090 person_detail 핸드오프 목록 (W5-25 → CK3 스탯 과제 뒤 통합 웨이브)

작성: scripts/pages/aux-edit.mjs가 090을 읽기 전용으로 스캔해 결정적으로 생성(2026-11-11).
대상: 인물 상세 JSON에서 아직 옛 정본 표기를 담은 필드. 090은 이 과제에서 편집하지 않았다(CK3 스탯 브랜치 소관).
기준: 매 항목의 “기준/제안” 열 — 050 확정값(같은 인물의 로스터 행) 또는 CANON-BIBLE §2–§5.
요약: 인물 509명, 위반 그룹 2890건.

| person | 이름 | JSON 경로 | 클래스 | 현재 텍스트(발췌) | 기준/제안 |
|---|---|---|---|---|---|
| person-0001 | 한재목 | $.position | org (2회) | Elected Sovereign of the Floodgate State ／ 수문국 선출 군주 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0001 | 한재목 | $.openingTitles[].parentTitle.name | org (3회) | Standards League Kingdom ／ 영등포구 수문국 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.fields.Title | org (1회) | Elected Sovereign of the Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.sections.Offices | org (1회) | Rank: Monarch. Title: Elected Monarch of the Floodgate Bureau. Livelihood nickname: Water Supply Director-Gene | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.sections.Relationships | org (1회) | Parts alliance with Gang Minseo. Dispute with O Haerin over price disclosure. Dispute with Yun Seorin over the | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.biography | org (2회) | **Life.** Han Jaemok grew up in a family of shift-working local civil servants at the Seoul Arisu Headquarters ／ **생애.** 한재목은 2126년에도 운영되는 서울아리수본부 영등포아리수정수센터의 교대근무 지방공무원 집안에서 자랐다. 가족 인력은 지방공업·지방시설 계열이며, 이 문장만으로 한재목 본인에게 공무원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.confirmedHoldings[].name.ko | org (1회) | 영등포구 수문국 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.openingTitles[].name | org (1회) | 영등포구 수문국 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.openingTitles[].basis | org (1회) | 2026-10-22 영토 작위 배분(owner:seoul-faction-consolidation-20261022). 수문국 군주. 서부 왕국 세 자치구 가운데 영등포·양천 공작령 보유 근거. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.fields.직함 | org (1회) | 수문국 선출 군주 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.sections.관직 | org (1회) | 품계 군주. 직함은 수문국 선출 군주. 생업 별명은 급수총재. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0001 | 한재목 | $.sections.관계 | org (1회) | 강민서와 부품 동맹. 오해린과 가격 공개를 두고 다툼. 윤서린과 계약 인준권 분쟁. 이서담(양천 구역장)과 계약 회의 선거인.

- 소속: 수문국
- 생업: 수문 당직
- 품계: 군주
- 직함: 수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0002 | 이서담 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0002 | 이서담 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0002 | 이서담 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0002 | 이서담 | $.biography | org (2회) | She says little, but when the alley cistern water levels drop she raises her voice even before the elected sov ／ 말수는 적지만 골목 저수조 수위가 떨어지면 선출 군주 앞에서도 목소리를 높인다. 합계 장부보다 수도꼭지에서 나오는 압력을 먼저 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 구역 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0002 | 이서담 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0003 | 김태운 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0003 | 김태운 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0003 | 김태운 | $.biography | org (2회) | Relying on discipline, he sleeps less and suspects unauthorized crossings before rust on floodgate screws. Whe ／ 규율에 기대 잠을 줄이고, 수문 나사의 녹보다 무단 도하를 먼저 의심한다. 부하의 급수표가 밀리면 자신이 야간 당직을 선다.

- 소속: 수문국
- 생업: 수문 경비
- 품계: 주사
- 직함: 수문 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0003 | 김태운 | $.relations.incoming[].basis | org (2회) | Competes with Floodgate Bureau guards over Han River floodgate tactics ／ 한강 수문 전술을 수문국 경비와 겨룸 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0003 | 김태운 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0004 | 박누리 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0004 | 박누리 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0004 | 박누리 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0004 | 박누리 | $.biography | org (1회) | 시약 냄새에 예민하고 구두 보고를 싫어한다. 검증되지 않은 원수를 받으라는 정치적 압박을 모욕으로 여긴다.

- 소속: 수문국
- 생업: 수질 검사
- 품계: 당직장
- 직함: 영등포 정수공정 감독 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0005 | 최한결 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0005 | 최한결 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0005 | 최한결 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0005 | 최한결 | $.biography | org (1회) | 공구 소리를 대화처럼 읽고, 약속한 출고 시각을 어기는 조합을 오래 기억한다. 말보다 차륜과 제동 시험으로 사람을 평가한다.

- 소속: 수문국
- 생업: 차량·펌프 정비
- 품계: 주사
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0006 | 정모란 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0006 | 정모란 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0006 | 정모란 | $.biography | org (2회) | She haggles as if singing, but immediately strips the berth from any shipowner who cheats the wharf scales. Sh ／ 흥정을 노래처럼 하지만 선창 저울을 속이는 선주에게는 즉시 선석을 빼앗는다. 강바람보다 소문 가격을 더 빨리 읽는다.

- 소속: 수문국
- 생업: 수상 운송
- 품계: 주사
- 직함: 여의도 수상 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0006 | 정모란 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0007 | 장필규 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0007 | 장필규 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0007 | 장필규 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0007 | 장필규 | $.biography | org (1회) | 문구의 빈칸을 집요하게 찾고, 구두 약속을 기록하지 않는 사람을 위반 소지가 있는 자로 본다. 숫자는 공개하되 해석은 자기 난외에 남긴다.

- 소속: 수문국
- 생업: 계약 기록·감수
- 품계:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0008 | 임바다 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0008 | 임바다 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0008 | 임바다 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0008 | 임바다 | $.biography | org (1회) | 온화하나 가족 단위 배급이 끊기는 순간 타협을 멈춘다. 효율을 이유로 한 골목을 희생하자는 말을 모욕으로 듣는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 구역장
- 직함: 서부 급 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0009 | 유세진 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0009 | 유세진 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0009 | 유세진 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0009 | 유세진 | $.biography | org (1회) | 시간표의 빈칸을 사람보다 먼저 메우고, 지연 이유를 숨기는 기관사를 가차 없이 강등한다. 급수열차를 정치 순위로 미루는 명령을 참지 못한다.

- 소속: 수문국
- 생업: 철도 배차
- 품계: 주사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0010 | 허도담 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0010 | 허도담 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0010 | 허도담 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0010 | 허도담 | $.biography | org (1회) | 나사 머리의 마모로 교대 성실을 읽고, 공구함 뚜껑을 열어 두지 않는 사람을 불신한다. 말보다 시운전 소음으로 대답한다.

- 소속: 수문국
- 생업: 펌프 정비
- 품계: 주사
- 직함: 신정기지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0011 | 구태윤 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0011 | 구태윤 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0011 | 구태윤 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0011 | 구태윤 | $.biography | org (1회) | 흥정을 낮은 목소리로 끝마치고, 배급표 무게가 모자라면 즉시 저울을 갈아 끼운다. 선창 소문보다 수통의 온도를 믿는다.

- 소속: 수문국
- 생업: 급수 물자 거래
- 품계: 주사
- 직함: 양천 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0012 | 진하겸 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0012 | 진하겸 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0012 | 진하겸 | $.biography | org (2회) | Smells the turbid-water diarrhea before the wounds, and tears up the note telling them to change the water-sup ／ 상처보다 탁수 설사 냄새를 먼저 맡고, 급수표를 치료 순서로 바꾸라는 쪽지를 찢는다. 온화하나 소독수 재고가 비면 회의를 중단시킨다.

- 소속: 수문국
- 생업: 진료
- 품계: 주사
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0012 | 진하겸 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0013 | 채온결 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0013 | 채온결 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0013 | 채온결 | $.biography | org (2회) | He hears the pipeline hammer before he hears footsteps, and he treats unauthorized night river crossings as de ／ 발소리보다 관로 쇠망치 소리를 먼저 듣고, 야간 무단 도하를 사고보다 고의로 본다. 부하의 급수표가 밀리면 자신이 습지를 먼저 걷는다.

- 소속: 수문국
- 생업: 관로 순찰
- 품계: 주사
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0013 | 채온결 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0014 | 대니얼 브룩스 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0014 | 대니얼 브룩스 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0014 | 대니얼 브룩스 | $.sections.Life | org (1회) | Generation of 2126. Raised on the Yeongdeungpo water purification night watch. The Contract Council Courier po | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0014 | 대니얼 브룩스 | $.biography | org (2회) | If the knot in the sealing cord is loose, he refuses to depart, and he treats an envoy who does not record ora ／ 봉인 끈의 매듭이 느슨하면 출발을 거부하고, 구두 전갈을 기록하지 않는 사신을 위조 소지가 있는 자로 본다. 숨이 차도 사본 두 장을 한 손에 쥔다.

- 소속: 수문국
- 생업: 계약 전갈 전달
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0014 | 대니얼 브룩스 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0014 | 대니얼 브룩스 | $.sections.생애 | org (1회) | 2126년 세대. 영등포 정수 당직에서 자랐다. 계약 회의 전령 자리는 탁수 밤의 밸브 서명으로 열렸다. 대니얼 브룩스는 2089년에 태어나 영등포 정수 당직 가구에서 자랐다. 아프리카계 미국인 가 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0017 | 변고운 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0017 | 변고운 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0017 | 변고운 | $.biography | org (2회) | Gauges the crowd by the humidity on the platform, and takes an order to push the ration queue behind the milit ／ 승강장 습기로 인파를 가늠하고, 배급 대기열을 군수 화차 뒤로 미루라는 명령을 모욕으로 듣는다. 온화하나 단수 예고가 뜨면 방송을 직접 잡는다.

- 소속: 수문국
- 생업: 대합실 당직
- 품계: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0017 | 변고운 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0018 | 허은찬 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0018 | 허은찬 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0018 | 허은찬 | $.biography | org (2회) | Reads overload from the vibration of the transformer, and burns the note telling him to put military charging  ／ 변압기 진동으로 과부하를 읽고, 급수펌프보다 군수 충전을 앞세우라는 쪽지를 태운다. 과묵하고 교대 일지를 깎지 않는다.

- 소속: 수문국
- 생업: 전력 설비 운전
- 품계: 당직장
- 직함: 신 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0018 | 허은찬 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0019 | 구하온 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0019 | 구하온 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0019 | 구하온 | $.biography | org (2회) | He reads water-flask prices faster than the river wind, and instantly pulls shipowners who cheat the scale fro ／ 강바람보다 수통 시세를 빨리 읽고, 저울을 속이는 선주를 아침 추첨에서 즉시 뺀다. 흥정을 노래처럼 하지만 단수 골목의 가격은 올리지 않는다.

- 소속: 수문국
- 생업: 선창 경매
- 품계: 주 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0019 | 구하온 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0021 | 채한솔 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0021 | 채한솔 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0021 | 채한솔 | $.biography | org (2회) | Sensitive to the smell of fuel and hates verbal power allocations. Takes the political pressure to divert powe ／ 연료 냄새에 예민하고 구두 배전을 싫어한다. 수문 전동기보다 선창 조명에 전력을 돌리라는 정치적 압박을 모욕으로 여긴다.

- 소속: 수문국
- 생업: 비상 발전 운전
- 품계: 당직장
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0021 | 채한솔 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0024 | 류한뫼 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0024 | 류한뫼 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0024 | 류한뫼 | $.biography | org (2회) | At the sight of a paper with a broken seal his voice cracks first, and when three sheets overlap he counts pag ／ 봉함 풀린 종이를 보면 목소리가 먼저 갈라지고, 세 장이 겹치면 한숨 대신 쪽수를 센다. 사람보다 인준 도장의 각인을 믿는다.

- 소속: 수문국
- 생업: 문서 입회·대조
- 품계: 주사
- 직함 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0024 | 류한뫼 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0025 | 엄새울 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0025 | 엄새울 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0025 | 엄새울 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0025 | 엄새울 | $.biography | org (1회) | 수도꼭지에서 흙내가 나면 장부보다 먼저 골목을 돌고, 탁수를 해명으로 덮는 관리를 믿지 않는다. 아이 배급통이 비면 선출 군주 면담을 끊지 않는다.

- 소속: 수문국
- 생업: 대합실 당직
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0026 | 여리안 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0026 | 여리안 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0026 | 여리안 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0026 | 여리안 | $.biography | org (1회) | 낡은 펌프 도면의 접힌 자국까지 기억하고, 임시 협약을 영구 권리로 고치는 문구를 보면 펜을 놓는다. 창립 때의 악수를 계약보다 오래 담아 둔다.

- 소속: 수문국
- 생업: 협약 원본 보관
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0027 | 기바름 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0027 | 기바름 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0027 | 기바름 | $.biography | org (2회) | Feels the loosening of the convoy seal cord before the night bridge wind, and takes pressure to fit a promised ／ 야간 교량 바람보다 호송 봉인 끈의 풀림을 먼저 느끼고, 약속한 도착 시각을 정치 일정에 맞추라는 압박을 모욕으로 여긴다. 말은 짧고 경로 쪽지는 길다.

- 소속: 수문국
- 생업: 호송 전갈 전 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0027 | 기바름 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0028 | 우오름 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0028 | 우오름 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0028 | 우오름 | $.biography | org (2회) | Believes the water level of the buckets in the council hall is the speed of the negotiation, and hates seeing  ／ 회의장 물통 수위가 협상 속도라고 믿고, 강국 세 장의 계약서를 한 테이블에 겹쳐 놓는 것을 싫어한다. 숫자는 큰 소리로 읽고 해석은 난외에만 남긴다.

- 소속: 수문국
- 생업: 급수 계량·배분 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0028 | 우오름 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.position | org (2회) | Chair of the Standards League ／ 규격맹 위원장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0029 | 강민서 | $.subordinateHoldings[].name.ko | org (7회) | Seodaemun District Yeouido Investment Federation Workshop Domain Direct Holdings ／ Yeongdeungpo-gu Yeouido Investment Alliance Ducal Directly Held Territory | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.openingTitles[].name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.openingTitles[].basis | org (2회) | Territorial title allocation of 2026-10-22 (owner:seoul-faction-consolidation-20261022). Chairman of the Stand ／ 2026-10-22 영토 작위 배분(owner:seoul-faction-consolidation-20261022). 규격맹 위원장. 남서 왕국 네 자치구 전체에 걸친 규격맹 공작령과 왕국 s02 보 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.fields.Title | org (1회) | Chair of the Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.Life | org (1회) | Generation of 2126. Raised in the Guro-Geumcheon industrial guild. The workshop elders taught by rejecting mod | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.Offices | org (1회) | Rank: Chairman. Title: Chairman of the Standards League. Occupational alias: Fabrication Council Arbiter. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.Relationships | org (1회) | Supplies pump parts to Han Jaemok. Disputes the scope of technology disclosure with Jeong Hojun. Supports Baek | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.biography | org (2회) | **Life.** Generation of 2126. Raised in the Guro-Geumcheon industrial guild. The workshop elders taught by rej ／ **생애.** 2126년 세대. 구로·금천 공단 조합에서 자랐다. 공방 원로들은 규격 없는 개조를 내치며 가르쳤다. 동방사가 부품 대가로 복구복무자 등록을 요구한 겨울, 강민서는 등록을 거부한 손을 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.relations.incoming[].basis | org (2회) | Posting Gang Minseo's Standards League council declaration in the Guro alleys ／ 강민서의 규격맹 평의회 선언을 구로 골목에 붙이며 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.fields.직함 | org (1회) | 규격맹 위원장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.생애 | org (1회) | 2126년 세대. 구로·금천 공단 조합에서 자랐다. 공방 원로들은 규격 없는 개조를 내치며 가르쳤다. 동방사가 부품 대가로 복구복무자 등록을 요구한 겨울, 강민서는 등록을 거부한 손을 시민권 줄에  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.관직 | org (1회) | 품계 위원장. 직함은 규격맹 위원장. 생업 별명은 제작평의회 중재자. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.일화 | org (1회) | 동방사가 펌프 부품 상자 대신 복구복무자 명부를 내밀었을 때, 강민서는 상자를 봉한 채 돌려보냈다. 그 봉인이 한재목의 서부 급수와 배우진의 병조 사이에 빚으로 남았다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0029 | 강민서 | $.sections.관계 | org (1회) | 한재목에게 펌프 부품을 댄다. 정호준과 기술 공개 범위를 다툰다. 백온의 난민 시민권을 지지한다.

- 소속: 규격맹
- 생업: 공방 제작 조정
- 품계: 위원장
- 직함: 규격맹 위원장
- 업무  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0030 | 정시우 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.sections.Relationships | org (1회) | With Gang Minseo, close to a standards master-pupil relationship; in a wheel alliance with Floodgate Bureau Tr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.sections.Ambition | org (1회) | To fix the compatibility table for wheel and pump screws across all of Seoul into a single Cheonwang ledger, f | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.biography | org (2회) | Taciturn, he remembers people by the tolerance of their fingertips. He sees improvised modifications that are  ／ 과묵하고 손끝의 공차로 사람을 기억한다. 규격서에 없는 임시 개조를 재능이 아니라 사고의 씨앗으로 본다.

- 소속: 규격맹
- 생업: 펌프 정비·계측
- 품계: 상임이사
- 직함: 천왕기지 제작원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.characterProfile.traits[].relationship | org (2회) | 강민서와는 규격 신도에 가깝고, 수문국 열차장 최한결과 차륜 동맹이며, 장우석의 기록 날인 없이 규격 개정을 허용하지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.sections.관계 | org (1회) | 강민서와는 규격 신도에 가깝고, 수문국 열차장 최한결과 차륜 동맹이며, 장우석의 기록 날인 없이 규격 개정을 허용하지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0030 | 정시우 | $.sections.야망 | org (1회) | 서울 전역 차륜·펌프 나사의 호환표를 천왕 원장 하나로 고정해 규격맹의 뼈대를 만든다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0031 | 김나율 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0031 | 김나율 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0031 | 김나율 | $.sections.Ambition | org (1회) | To enter the citizenship of restoration-service workers in the union roster first, so that the Standards Leagu | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0031 | 김나율 | $.biography | org (2회) | Gentle in debate, but she spends nights cross-checking the sabotage list after a consensus is reached. She reg ／ 토론에서는 온화하나 합의 뒤의 태업 명단을 밤새 대조한다. 숙련 점수를 숨기는 반장을 조합의 적으로 본다.

- 소속: 규격맹
- 생업: 교대 기록
- 품계: 조합원
- 직함: 구로 노동조합 서기
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0031 | 김나율 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0031 | 김나율 | $.sections.야망 | org (1회) | 복구복무자의 시민권을 조합 명부에 먼저 올려 규격맹이 군수가 아니라 노동 이동권으로 퍼지게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0032 | 이강묵 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0032 | 이강묵 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0032 | 이강묵 | $.sections.Ambition | org (1회) | Convert the work crews into a permanent engineer corps and reorganize repair standards to prioritize military  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0032 | 이강묵 | $.biography | org (2회) | He regards speed as justice, and when debate drags on he drops the barrier gate first. He takes responsibility ／ 속도를 정의로 여기고, 토론이 길어지면 차단문부터 내린다. 부하 가족의 배급은 책임지되 조합 쪽 지연은 배신으로 읽는다.

- 소속: 규격맹
- 생업: 경비·순찰
- 품계: 조합원
- 직함: 금천  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0032 | 이강묵 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0032 | 이강묵 | $.sections.야망 | org (1회) | 작업반을 상시 공병대로 전환하고 수리 규격을 군수 우선으로 재편해 규격맹의 무력을 자신이 쥐게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0033 | 박소언 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0033 | 박소언 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0033 | 박소언 | $.sections.Fear | org (1회) | Once their own raw water supply is cut off and the building cisterns run dry, the members become hostages to t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0033 | 박소언 | $.biography | org (2회) | She enjoys practical gain, but never makes the safety of roofs and main power lines a bargaining chip. She lon ／ 실리를 즐기되 지붕과 전력 간선의 안전을 흥정거리로 삼지 않는다. 숙련공보다 거주 표를 얕보는 사람을 오래 기억한다.

- 소속: 규격맹
- 생업: 대합실 당직
- 품계: 이사
- 직함: 구로 건물 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0033 | 박소언 | $.characterProfile.traits[].stress | org (2회) | 자체 원수가 끊긴 뒤 건물 저수조가 마르면 조합원이 수문국 급수계약의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0033 | 박소언 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0033 | 박소언 | $.sections.공포 | org (1회) | 자체 원수가 끊긴 뒤 건물 저수조가 마르면 조합원이 수문국 급수계약의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0034 | 최다인 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0034 | 최다인 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0034 | 최다인 | $.sections.Ambition | org (1회) | Make the work-crew-converted engineer corps the vanguard of standard restoration, and lay the southwest outer  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0034 | 최다인 | $.biography | org (2회) | Bold and quick-handed, she looks at welded seams rather than rank badges. She hates orders to leave a finished ／ 대담하고 손빠르며 계급 배지보다 용접 이음을 본다. 완성된 차단문을 정치 협상용으로 열어 두라는 명령을 싫어한다.

- 소속: 규격맹
- 생업: 대합실 당직
- 품계: 조합원
- 직함: 공병 작업반 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0034 | 최다인 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0034 | 최다인 | $.sections.야망 | org (1회) | 작업반 전환 공병대를 규격 복구의 선봉으로 만들어, 무력 정복 없이 남서 외곽 선로를 규격맹 표준으로 깐다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.title | org (2회) | Repair Standards Audit Recorder (Standards League Guild Member) ／ 수리규격 감사기록관(규격맹 조합원) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.position | org (2회) | Repair Standards Audit Recorder (Standards League Guild Member) ／ 수리규격 감사기록관(규격맹 조합원) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=polity:daejeon |
| person-0035 | 장우석 | $.fields.Affiliation | org (1회) | Standards League (formerly Daejeon Bloc; power shift 2026-10-22) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.sections.Life | org (1회) | Born in the generation of 2126. Raised at the Seoul Station registry office. The post of Repair Standards Audi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.sections.Ambition | org (1회) | He wants every revision of the Standards League to carry an audit seal and a termination condition, so that st | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.sections.Fear | org (1회) | The fear that a single forged measurement seal will void the entire Cheonwang ledger and split the Standards L | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.biography | org (2회) | Principled, and hates blanks in a sentence. He calls elders who do not enter verbally agreed compatibility int ／ 원칙적이고 문장의 빈칸을 증오한다. 구두로 합의한 호환을 원장에 올리지 않는 원로를 규격의 적으로 부른다.

- 소속: 규격맹(전 대전계; 2026-10-22 세력 이동)
- 생업: 규격 기록·감사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.characterProfile.traits[].stress | org (2회) | 위조 계측 도장 하나가 천왕 원장 전체를 무효로 만들어 규격맹이 부품 봉쇄로 쪼개지는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.fields.소속 | org (1회) | 규격맹(전 대전계; 2026-10-22 세력 이동) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.sections.생애 | org (1회) | 2126년 세대. 서울역 등기소에서 자랐다. 수리규격 감사기록관 자리는 이중 장부 한 줄 삭제로 열렸다.
- 서울역 등기소에서 자란 장우석은 천왕의 감사 창구에서 규격 사본을 길드 평의회와 공방에  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.sections.야망 | org (1회) | 규격맹의 모든 개정에 감사 날인과 종료 조건을 붙여, 군수 비상 핑계로 규격이 사라지지 않게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0035 | 장우석 | $.sections.공포 | org (1회) | 위조 계측 도장 하나가 천왕 원장 전체를 무효로 만들어 규격맹이 부품 봉쇄로 쪼개지는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0036 | 임채원 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0036 | 임채원 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0036 | 임채원 | $.biography | org (2회) | Practical, and gauges danger by the spacing of stitches. Avoids officers who pile up protective suits like war ／ 실용적이고 바느질 간격으로 위험을 가늠한다. 방호복을 전리품처럼 쌓아 두는 장교를 재앙처럼 피한다.

- 소속: 규격맹
- 생업: 대합실 당직
- 품계: 이사
- 직함: 방호복 직능 대표
**생애. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0036 | 임채원 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0037 | 한지온 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0037 | 한지온 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0037 | 한지온 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0037 | 한지온 | $.sections.Ambition | org (1회) | Forcibly ties the Standards League's repair exports to long-term raw water and food contracts, making up for i | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0037 | 한지온 | $.biography | org (2회) | Compassionate, but does not forgive number games played on an empty stomach. Even on a day when part shipments ／ 자비롭지만 공복 상태의 숫자 놀음을 용서하지 않는다. 부품 출고를 자랑하는 날에도 저수조와 배급 솥을 먼저 확인한다.

- 소속: 규격맹
- 생업: 배급 당직
- 품계: 이사
- 직함: 금천 원수식 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0037 | 한지온 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0037 | 한지온 | $.sections.야망 | org (1회) | 규격맹의 수리 수출을 원수·식량 장기 계약과 강제로 묶어, 자체 생산이 없는 약점을 평의회 의결로 메운다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.title | org (2회) | Cheonwang Depot Wheel Mechanic (Standards League guild member) ／ 천왕기지 차륜 정비사(규격맹 조합원) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.position | org (2회) | Cheonwang Depot Wheel Mechanic (Standards League guild member) ／ 천왕기지 차륜 정비사(규격맹 조합원) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=polity:daejeon |
| person-0038 | 허다온 | $.fields.Affiliation | org (1회) | Standards League (formerly Daejeon Bloc; power shift 2026-10-22) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.sections.Ambition | org (1회) | Fix the compatibility measurements of wheel screws across Seoul into the Cheonwang maintenance table, becoming | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.biography | org (2회) | Remembers people by their tolerances, and sees makeshift trimming not in the specifications as the seed of an  ／ 공차로 사람을 기억하고, 규격서에 없는 임시 깎기를 사고의 씨앗으로 본다. 말수는 적고 제동 시험으로 대답한다.

- 소속: 규격맹(전 대전계; 2026-10-22 세력 이동)
- 생업: 차륜 정비 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.fields.소속 | org (1회) | 규격맹(전 대전계; 2026-10-22 세력 이동) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0038 | 허다온 | $.sections.야망 | org (1회) | 서울 전역 차륜 나사의 호환 실측을 천왕 정비표로 고정해 규격맹의 손끝이 된다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.title | org (2회) | Logistics Merchant of the Guro Tool Market (Standards League Union Member) ／ 구로 공구시장 물류상(규격맹 조합원) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.position | org (2회) | Logistics Merchant of the Guro Tool Market (Standards League Union Member) ／ 구로 공구시장 물류상(규격맹 조합원) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=polity:daejeon |
| person-0039 | 구찬솔 | $.fields.Affiliation | org (1회) | Standards League (formerly Daejeon Bloc; power shift 2026-10-22) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.sections.Fear | org (1회) | That once its own source water is cut and the market cistern dries up, logistics will become a hostage to the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.biography | org (2회) | Reads deception from the weight of a box, and sets down the freight of foremen who hide skill scores in the al ／ 상자 무게로 속임수를 읽고, 숙련 점수를 숨기는 반장의 화물은 선석이 아니라 골목에 내려 놓는다. 실리를 즐기되 지붕 못을 군수 상자에 섞지 않는다.

- 소속: 규격맹(전 대전계; 2026-10- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.characterProfile.traits[].stress | org (2회) | 자체 원수가 끊긴 뒤 시장 저수조가 마르면 물류가 수문국 급수계약의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.fields.소속 | org (1회) | 규격맹(전 대전계; 2026-10-22 세력 이동) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0039 | 구찬솔 | $.sections.공포 | org (1회) | 자체 원수가 끊긴 뒤 시장 저수조가 마르면 물류가 수문국 급수계약의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0040 | 진우람 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0040 | 진우람 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0040 | 진우람 | $.sections.Relationships | clergy (1회) | Close to a priest who applies Im Chaewon's filter standards to treatment, opens a medical meal service when Ha | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0040 | 진우람 | $.sections.Ambition | org (1회) | Ties protective filters and workshop care to the citizenship conditions of restoration-service workers, so tha | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0040 | 진우람 | $.biography | clergy+org (2회) | Hears dust coughs before welding sparks, and avoids officers who stockpile protective filters like spoils as i ／ 분진 기침을 용접 불꽃보다 먼저 듣고, 방호 필터를 전리품처럼 쌓는 장교를 재앙처럼 피한다. 자비롭지만 공복 상태의 숫자 놀음을 용서하지 않는다.

- 소속: 규격맹
- 생업: 공방 진료
- 품계: | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0040 | 진우람 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0040 | 진우람 | $.sections.야망 | org (1회) | 방호 필터와 공방 진료를 복구복무자의 시민권 조건으로 묶어 규격맹이 군복이 아니어도 숨 쉬게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0041 | 채리울 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0041 | 채리울 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0041 | 채리울 | $.biography | org (2회) | Suspects the blanks in the sabotage list before the rust on the barrier gates, and does not lower the gun in f ／ 차단문 녹보다 태업 명단의 빈칸을 먼저 의심하고, 토론이 길어져도 공구 창고 앞에서 총을 내리지 않는다. 부하 가족의 배급은 책임지되 조합 쪽 지연을 배신으로 읽지는 않는다.

- 소속: 규격맹
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0041 | 채리울 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0042 | 표강호 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0042 | 표강호 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0042 | 표강호 | $.sections.Ambition | org (1회) | To make every revision notice of the Standards League valid only on the courier network that he himself seals, | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0042 | 표강호 | $.biography | org (2회) | He memorizes the measurement figures on the standards copies, and calls any elder who does not enter a verball ／ 규격 사본의 계측 숫자를 외우고, 구두로 합의한 호환을 원장에 올리지 않는 원로를 규격의 적으로 부른다. 봉인 끈이 젖으면 다시 떠난다.

- 소속: 규격맹
- 생업: 규격 문서 전달
- 품계: 조 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0042 | 표강호 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0042 | 표강호 | $.sections.야망 | org (1회) | 규격맹의 모든 개정 통지를 자신이 날인하는 전령망에만 유효하게 해 군수 비상 핑계로 규격이 사라지지 않게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0043 | 명소이 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0043 | 명소이 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0043 | 명소이 | $.sections.Ambition | org (1회) | To build a survey ledger linking the southwest outer track with Standards League standard sleepers, laying the | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0043 | 명소이 | $.biography | org (2회) | Reads cracks in the sleepers to tell whether a detour is possible, and hates orders to leave a finished blocki ／ 침목의 균열로 우회 가능 여부를 읽고, 완성된 차단문을 정치 협상용으로 열어 두라는 명령을 싫어한다. 대담하고 손빠르다.

- 소속: 규격맹
- 생업: 대합실 당직
- 품계: 조합원
- 직함: 남서 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0043 | 명소이 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0043 | 명소이 | $.sections.야망 | org (1회) | 남서 외곽 선로를 규격맹 표준 침목으로 잇는 탐사 원장을 만들어 무력 정복 없이 표준을 깐다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0044 | 제하온 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0044 | 제하온 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0044 | 제하온 | $.sections.Ambition | org (1회) | To enter restoration-service workers' citizenship and skill points in the same ledger, so that the Standards L | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0044 | 제하온 | $.biography | org (2회) | Principled, and hates blanks in a sentence. Never pushes the figures of the clerk who collates the sabotage li ／ 원칙적이고 문장의 빈칸을 증오한다. 태업 명단을 밤새 대조하는 서기의 숫자를 원장 밖으로 밀어내지 않는다.

- 소속: 규격맹
- 생업: 숙련점수 기록
- 품계: 조합원
- 직함: 숙련점수 원장 기 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0044 | 제하온 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0044 | 제하온 | $.sections.야망 | org (1회) | 복구복무자의 시민권과 숙련 점수를 같은 원장에 올려 규격맹이 군수가 아니라 노동 이동권으로 퍼지게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0045 | 변시람 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.sections.Ambition | org (1회) | To make the Guro concourse the face-to-face window of the Standards League, where parts release, citizenship r | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.sections.Fear | org (1회) | That the concourse reservoir runs dry once its own raw water source is cut, leaving the station queue hostage  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.biography | org (2회) | Reads the size of a work crew from platform dust, and cannot tolerate orders that push water trains back accor ／ 승강장 분진으로 작업반 규모를 읽고, 급수열차를 정치 순위로 미루는 명령을 참지 못한다. 시간표의 빈칸을 사람보다 먼저 메운다.

- 소속: 규격맹
- 생업: 대합실 당직
- 품계: 감사
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.characterProfile.traits[].stress | org (2회) | 자체 원수가 끊겨 대합실 저수조가 마르면 역 대기열이 수문국 급수계약의 인질이 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.sections.야망 | org (1회) | 구로 대합실을 부품 출고·시민권 등록·배급 솥이 한 지붕에서 서명되는 규격맹의 대면 창구로 만든다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0045 | 변시람 | $.sections.공포 | org (1회) | 자체 원수가 끊겨 대합실 저수조가 마르면 역 대기열이 수문국 급수계약의 인질이 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0046 | 표예담 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0046 | 표예담 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0046 | 표예담 | $.sections.Ambition | org (1회) | To turn the Cheonwang holding tracks into a circulating dispatch network on which only standard-sealed freight | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0046 | 표예담 | $.biography | org (2회) | Reads a train's lies from track vibration, and takes orders to disguise repair supplies as munitions wagons as ／ 선로 진동으로 열차의 거짓을 읽고, 수리 물자를 군수 화차로 위장하는 명령을 모욕으로 듣는다. 과묵하고 출고 시각을 어기는 조합을 오래 기억한다.

- 소속: 규격맹
- 생업: 유치선 배차
- 품계 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0046 | 표예담 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0046 | 표예담 | $.sections.야망 | org (1회) | 천왕 유치선을 규격 도장 화물만 오가는 순환 배차망으로 만들어 규격맹의 동맥이 된다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0047 | 명다해 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0047 | 명다해 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0047 | 명다해 | $.biography | org (2회) | If the ladle marks differ from pot to pot, the ledger numbers are folded away, and pots whose lid numbers have ／ 국자 자국이 솥마다 다르면 장부 숫자를 접고, 뚜껑 번호가 지워진 솥은 중개 테이블에서 뺀다. 흉작 쪽지가 돌면 국자를 기둥에 묶어 둔다.

- 소속: 규격맹
- 생업: 배급솥 운영
- 품계: 조합 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0047 | 명다해 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0048 | 제문석 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0048 | 제문석 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0048 | 제문석 | $.biography | org (2회) | Gauges the danger of a protective suit by its stitch spacing, and pushes officers who demand clinic records as ／ 바느질 간격으로 방호복의 위험을 가늠하고, 진료 기록을 군수 명부로 달라는 장교를 문으로 밀어낸다. 실용적이고 손이 빠르다.

- 소속: 규격맹
- 생업: 분진 진료
- 품계: 조합원
- 직함: 구 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0048 | 제문석 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0049 | 변주아 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0049 | 변주아 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0049 | 변주아 | $.sections.Fear | org (1회) | That the frequency under the red thread lasts beyond three days, turning the generator handle into a collatera | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0049 | 변주아 | $.biography | org (2회) | Stops speaking and grips the breaker handle if the frequency needle drops even one notch. Does not write the m ／ 주파수 바늘이 한 칸만 내려가도 말을 멈추고 차단기 손잡이를 잡는다. 군수 작업반의 심야 청을 부하표 바깥에 적지 않는다.

- 소속: 규격맹
- 생업: 발전 설비 운전
- 품계: 감사
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0049 | 변주아 | $.characterProfile.traits[].stress | org (2회) | 빨간 실 아래의 주파수가 사흘을 넘기면 발전 손잡이가 수문국 창구의 담보 번호가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0049 | 변주아 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0049 | 변주아 | $.sections.공포 | org (1회) | 빨간 실 아래의 주파수가 사흘을 넘기면 발전 손잡이가 수문국 창구의 담보 번호가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0050 | 종마루 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0050 | 종마루 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0050 | 종마루 | $.biography | org (2회) | Reads the vibration of defective wheels with the fingertips, and does not forgive merchants who name a standar ／ 불량 차륜의 진동을 손끝으로 읽고, 규격 도장을 산 가격으로 부르는 상인을 용서하지 않는다. 숙련공의 손가락보다 창고 봉인을 먼저 확인한다.

- 소속: 규격맹
- 생업: 펌프 정비
- 품계: 조합 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0050 | 종마루 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0051 | 고모래 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0051 | 고모래 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0051 | 고모래 | $.biography | org (2회) | Stops the pen at blanks in family-unit registration rosters, and underlines at length any sentence that turns  ／ 가족 단위 등록 명부의 빈칸을 보면 펜을 멈추고, 숙련을 병적으로 바꾸는 문장을 오래 밑줄 친다. 큰소리는 내지 않되 서명란은 비워 둔다.

- 소속: 규격맹
- 생업: 증언 기록
- 품계: 조합원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0051 | 고모래 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0052 | 배온결 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0052 | 배온결 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0052 | 배온결 | $.sections.Ambition | org (1회) | Make sure merit rewards remain only as skill points and time-limited rations rather than offices, so the Stand | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0052 | 배온결 | $.biography | org (2회) | Writes down the ration claims made right after the founding, separating them into merit and supplies, and stri ／ 창건 직후의 배급권 요구를 공로와 물자로 나눠 적고, 세습 칸이 비어 있으면 줄을 그어 지운다. 보상 잔치를 일의 끝으로 보지 않는다.

- 소속: 규격맹
- 생업: 보상 원장 기록
- 품계: 조합 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0052 | 배온결 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0052 | 배온결 | $.sections.야망 | org (1회) | 공신 보상을 관직이 아니라 숙련 점수와 한시 배급으로만 남게 해, 규격맹이 창건자 친위국이 되지 않게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0053 | 류겨레 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0053 | 류겨레 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0053 | 류겨레 | $.sections.Ambition | org (1회) | Open a one-night encampment and morning water supply for northern refugees through a guild lottery, so the Sta | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0053 | 류겨레 | $.biography | org (2회) | Counts the children's ration tins before the footprints of the intake procession inside Seoul, and hears the p ／ 서울 안 수용 행렬의 발자국 수보다 아이 배급통을 먼저 세고, 수용을 부품 대금과 바꾸자는 제안을 모욕으로 듣는다. 경로는 짧게, 거절은 분명하게 전한다.

- 소속: 규격맹
- 생업: 수용 문서  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0053 | 류겨레 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0053 | 류겨레 | $.sections.야망 | org (1회) | 북부 난민의 하룻밤 숙영과 아침 급수를 조합 추첨으로 열어, 규격맹이 암사의 복무 재등록 창구가 되지 않게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0054 | 엄누리 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0054 | 엄누리 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0054 | 엄누리 | $.biography | org (2회) | She looks for the fine cracks in test wheels with her own eyes first, and sees any whisper to stamp the pass s ／ 시험 차륜의 미세 균열을 눈으로 먼저 찾고, 합격 도장을 밤에 찍으라는 속삭임을 배신으로 본다. 침묵하되 불량품은 작업대 위에 남겨 둔다.

- 소속: 규격맹
- 생업: 부품 감정
- 품계: 조합원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0054 | 엄누리 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0055 | 여시온 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0055 | 여시온 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0055 | 여시온 | $.biography | org (2회) | She trusts the charter copies over flags, and if the wording of a declaration conflicts with workshop rules, s ／ 깃발보다 헌장 사본을 믿고, 선언 문구가 작업장 규칙과 어긋나면 전달을 하루 미룬다. 경로는 공개하고 가방 속 순서는 숨기지 않는다.

- 소속: 규격맹
- 생업: 헌장 사본 전달
- 품계: 조합원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0055 | 여시온 | $.relations.outgoing[].basis | org (2회) | Posting Gang Minseo's Standards League council declaration in the Guro alleys ／ 강민서의 규격맹 평의회 선언을 구로 골목에 붙이며 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0055 | 여시온 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0056 | 기필호 | $.characterProfile.traits[].stress | org (4회) | That commissariat trains would turn into the barrier-gate combat squads' ammunition cars, and the Fabrication  ／ 병참 열차가 차단문 전투조의 탄약칸으로 바뀌고, 규격맹이 부품 봉쇄의 다른 이름이 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.sections.Relationships | org (1회) | He contests shipment order with Choe Dain's engineer work crew, converts Gang Minseo's Standards League unific | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.sections.Fear | org (1회) | That the logistics train will become the ammunition car of the Barrier Gate Combat Squad, and the Standards Le | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.biography | org (2회) | Counts skilled workers' shift hours before the number of toolboxes, and is wary of anyone who pins the unifica ／ 공구 상자 수보다 숙련공의 교대 시간을 먼저 세고, 통일안의 이름을 군량 딱지로 붙이는 사람을 경계한다. 실리를 말하되 민가 전력을 병참으로 빼지 않는다.

- 소속: 규격맹
- 생업: 대합실 당직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.characterProfile.traits[].relationship | org (2회) | 최다인의 공병 작업반과 출고 순서를 다투고, 강민서의 규격맹 통일안을 물자표로 옮기며, 서부 호송의 기바름과 부품 칸을 교환한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.sections.관계 | org (1회) | 최다인의 공병 작업반과 출고 순서를 다투고, 강민서의 규격맹 통일안을 물자표로 옮기며, 서부 호송의 기바름과 부품 칸을 교환한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0056 | 기필호 | $.sections.공포 | org (1회) | 병참 열차가 차단문 전투조의 탄약칸으로 바뀌고, 규격맹이 부품 봉쇄의 다른 이름이 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.position | org (2회) | Taeuk Group Life Safety Research Director ／ 태욱그룹 생명안전 연구책임자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0057 | 정호준 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.fields.Title | org (1회) | Taeuk Group Life Safety Research Director | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.sections.Offices | org (1회) | Rank: Executive Director. Title: Life Safety Research Lead of the Taeuk Group. Occupation: life safety researc | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.sections.Relationships | org (1회) | Public contract with Jeong Yura. Dispute with Gang Minseo over the scope of disclosure.

- Affiliation: Taeuk  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.biography | org (2회) | **Life.** Born in the 2126 generation. A hand on the field test line at the Yangjae headquarters, 12 Heolleung ／ **생애.** 2126년 세대. 서초구 헌릉로 12 양재 본사 현장 시험 라인의 손. 2030년 그 마당은 이미 휴머노이드를 굴렸고, 구름 학습이 죽자 정비 가문이 상호를 남겼다. 기록 위조는 금지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.relations.incoming[].basis | org (2회) | The Taeuk Group chairman has separated out the life safety research responsibility ／ 태욱그룹 회장이 생명안전 연구책임을 분리해 둠 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.fields.직함 | org (1회) | 태욱그룹 생명안전 연구책임자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.sections.관직 | org (1회) | 품계 전무. 직함은 태욱그룹 생명안전 연구책임자. 생업은 생명안전 연구. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0057 | 정호준 | $.sections.관계 | org (1회) | 정유라와 공개 계약. 강민서와 공개 범위 다툼.

- 소속: 태욱그룹
- 생업: 생명안전 연구
- 품계: 전무
- 직함: 태욱그룹 생명안전 연구책임자
- 업무 위치: 양재2동 행정동 범위. 양재 본 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0058 | 정하린 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0058 | 정하린 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0058 | 정하린 | $.biography | org (2회) | Her principles are harder than bone, and she regards authority that has not been reproduced as more dangerous  ／ 원칙이 뼈보다 단단하고, 재현되지 않은 권위를 실험보다 위험하게 본다. 긴급 회의에서도 표본 봉인 스티커를 먼저 확인한다.

- 소속: 태욱그룹
- 생업: 안전 표본 심사
- 품계: 대리
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0058 | 정하린 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0059 | 최은재 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0059 | 최은재 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0059 | 최은재 | $.sections.Ambition | org (1회) | Moves medicine, communications and pump certifications onto the Taeuk Group's public ledger, becoming the work | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0059 | 최은재 | $.biography | org (2회) | Curious, but despises anyone who uses a certification seal as a bargaining chip. Spends longer looking at brok ／ 호기심이 많으나 인증 도장을 흥정 밑천으로 쓰는 사람을 경멸한다. 성능표의 빈칸보다 현장의 고장난 펌프를 더 오래 본다.

- 소속: 태욱그룹
- 생업: 기술 인증·검증
- 품계: 대리
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0059 | 최은재 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0059 | 최은재 | $.sections.야망 | org (1회) | 의약·통신·펌프 인증을 태욱그룹의 공개 원장으로 옮겨 공동기술원장의 실무 창구가 된다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0060 | 이봄결 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0060 | 이봄결 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0060 | 이봄결 | $.biography | org (2회) | Bold, but follows the alarms of the unmanned monitors ahead of human intuition. Takes no pride in a lockdown,  ／ 대담하되 무인 감시기의 경보를 사람의 직감보다 먼저 따른다. 봉쇄를 자랑으로 여기지 않고, 늦은 봉쇄를 죄로 여긴다.

- 소속: 태욱그룹
- 생업: 방재 경보·봉쇄
- 품계: 대리
- 직함: 방재 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0060 | 이봄결 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0061 | 김도하 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0061 | 김도하 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0061 | 김도하 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0061 | 김도하 | $.biography | org (2회) | He speaks of practical gain, but asks about kitchen tap water before laboratory-wing noise. Even on days he sh ／ 실리를 말하되 실험동 소음보다 부엌 수돗물을 먼저 묻는다. 지식을 자랑하는 날에도 원수 배급표가 비면 회의를 중단시킨다.

- 소속: 태욱그룹
- 생업: 대합실 당직
- 품계: 전무
- 직함: 마곡 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0061 | 김도하 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0062 | 유민호 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0062 | 유민호 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0062 | 유민호 | $.biography | org (2회) | Taciturn, reads a train's lies through the vibration of the rails. Hears an order to disguise research supplie ／ 과묵하고 선로 진동으로 열차의 거짓을 읽는다. 연구 물자를 군수 화차로 위장하는 명령을 모욕으로 듣는다.

- 소속: 태욱그룹
- 생업: 유치선 배차
- 품계: 부장
- 직함: 방화기지 유치·배차장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0062 | 유민호 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0063 | 박진솔 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0063 | 박진솔 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0063 | 박진솔 | $.biography | org (2회) | Patient and tolerates not even one blank cell in the temperature-humidity records. Sees anyone who calls seeds ／ 인내심이 길고 온습도 기록의 한 칸 빈칸도 용납하지 않는다. 씨앗을 군량 협상물로 부르는 사람을 도둑으로 본다.

- 소속: 태욱그룹
- 생업: 종자 보존·온습도 기록
- 품계: 대리
- 직함: 종 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0063 | 박진솔 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0064 | 장예린 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0064 | 장예린 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0064 | 장예린 | $.biography | org (2회) | Skeptical and tenacious; does not trust a pipeline on the strength of a single pass verdict. Tears up the note ／ 회의적이고 끈질기며 한 번의 합격 판정으로 관로를 믿지 않는다. 정치 일정에 맞춰 검사 주기를 줄이라는 쪽지를 찢어 버린다.

- 소속: 태욱그룹
- 생업: 수질 채수·검사
- 품계: 대리
- 직함 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0064 | 장예린 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0064 | 장예린 | $.sections.야망 | org (1회) | 수문국·뚝섬·마곡의 수질 검사 주기를 하나의 공개망으로 묶어 물·부품 공동규격의 과학 근거를 만든다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0065 | 임시온 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0065 | 임시온 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0065 | 임시온 | $.biography | org (2회) | Cold and precise, she remembers even the loan time of a cryptographic key. She calls the unrecorded exchange o ／ 냉정하고 암호 키의 대여 시각까지 기억한다. 기록되지 않은 기술 선물 교환을 외교가 아니라 절도로 부른다.

- 소속: 태욱그룹
- 생업: 연구기록 감사
- 품계: 대리
- 직함: 연구기록·통신서고 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0065 | 임시온 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0066 | 허서겸 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0066 | 허서겸 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0066 | 허서겸 | $.biography | org (2회) | She remembers people by chassis number and hears an order to disguise research materials as military freight c ／ 차대 번호로 사람을 기억하고, 연구 물자를 군수 화차로 위장하는 명령을 모욕으로 듣는다. 시운전 일지의 한 칸 빈칸도 용납하지 않는다.

- 소속: 태욱그룹
- 생업: 연구차량 정비
- 품계: 대리 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0066 | 허서겸 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0068 | 진채온 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0068 | 진채온 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0068 | 진채온 | $.biography | org (2회) | Sees prescriptions that have not been reproduced as more dangerous than experiments, and even in an emergency  ／ 재현되지 않은 처방을 실험보다 위험하게 보고, 긴급 회의에서도 시약 봉인 스티커를 먼저 확인한다. 원칙이 뼈보다 단단하다.

- 소속: 태욱그룹
- 생업: 실험동 진료
- 품계: 대리
- 직함: 실 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0068 | 진채온 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0069 | 채봄 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0069 | 채봄 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0069 | 채봄 | $.biography | org (2회) | She sets patrol intervals by the oil level of the gate lamps, and calls any alley where the resident flag cann ／ 관문 등잔의 기름 높이로 순찰 간격을 정하고, 주민 깃발이 안 보이는 골목을 사고 구간으로 부른다. 대담함보다 등잔 심지를 먼저 깎는다.

- 소속: 태욱그룹
- 생업: 관문 순찰
- 품계: 대리
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0069 | 채봄 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.title | org (2회) | Taeuk Group Chairman's Envoy · Lord of Seocho-gu ／ 태욱그룹 회장 전령 · 서초구 영주 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.position | org (2회) | Taeuk Group Chairman's Envoy · Lord of Seocho-gu ／ 태욱그룹 회장 전령 · 서초구 영주 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=geography:duchy:11650 |
| person-0070 | 표지안 | $.confirmedHoldings[].name.ko | org (2회) | Seocho-gu Taeuk Group Duchy Directly Held Land ／ 서초구 태욱그룹 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.openingTitles[].name | org (2회) | Seocho-gu Taeuk Group Duchy ／ 서초구 태욱그룹 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.fields.Title | org (1회) | Taeuk Group Chairman's Courier | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.sections.Offices | org (1회) | Rank: Assistant Manager. Title: Taeuk Group Chairman's Courier. She records pouch weight and bell time in the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.biography | org (2회) | She does not leave the gate if the ring of the message bell differs from the weight of the sealed pouch. She c ／ 전갈 종의 울림과 봉함 주머니 무게가 다르면 문을 나서지 않는다. 구두로만 열린 서고를 외교가 아니라 빈 심지로 부른다.

- 소속: 태욱그룹
- 생업: 봉함 문서 전달
- 품계: 대리
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.fields.직함 | org (1회) | 태욱그룹 회장 전령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0070 | 표지안 | $.sections.관직 | org (1회) | 품계 대리. 직함은 태욱그룹 회장 전령. 주머니 무게와 종 시각을 전령 일지에 남기고, 군사 감독 문구가 보이면 걸음 방향을 서고가 아니라 심사 창구로 돌린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0072 | 제라온 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0072 | 제라온 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0072 | 제라온 | $.sections.Relationships | clergy (1회) | Is close to a priest who moves Choe Eunjae's certification scope into the ledger, backs Im Sion's reading lock | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0072 | 제라온 | $.biography | clergy+org (2회) | Despises those who use certification seals as bargaining chips, and calls council members who do not enter ver ／ 인증 도장을 흥정 밑천으로 쓰는 사람을 경멸하고, 구두 합의를 원장에 올리지 않는 평의원을 절도로 부른다. 냉정하고 날짜를 집요하게 대조한다.

- 소속: 태욱그룹
- 생업: 인증 사본 기록
- 품 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0072 | 제라온 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0073 | 변태온 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0073 | 변태온 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0073 | 변태온 | $.biography | org (2회) | Asks about the kitchen tap water before the noise from the lab building, and even on days of showing off knowl ／ 실험동 소음보다 부엌 수돗물을 먼저 묻고, 지식을 자랑하는 날에도 원수 배급표가 비면 방송을 중단시킨다. 실리를 말하되 연구 화차를 민가 배급보다 앞에 두지 않는다.

- 소속: 태욱그룹
- 생업: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0073 | 변태온 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0074 | 허미리 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0074 | 허미리 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0074 | 허미리 | $.biography | org (2회) | Sorts out disguised supplies by the oil smell of freight cars, and never lets a message telling her to call we ／ 화물 칸의 기름 냄새로 위장 물자를 가리고, 병기를 연구 시료로 부르라는 전갈을 유치 분필 옆에 붙이지 않는다. 칸 번호를 밤마다 다시 쓰느라 말을 아낀다.

- 소속: 태욱그룹
- 생업: 유치선  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0074 | 허미리 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0078 | 우다온 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0078 | 우다온 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0078 | 우다온 | $.biography | org (2회) | Hears editing noise before human speech, and regards a request to open the original reel late to suit the poli ／ 편집 잡음을 사람 말보다 먼저 듣고, 원본 릴을 정치 일정에 맞춰 늦게 열라는 요청을 모욕으로 여긴다. 검증 전까지는 방송 문구를 읽지 않는다.

- 소속: 태욱그룹
- 생업: 음성 원본 호송
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0078 | 우다온 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0079 | 고초윤 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0079 | 고초윤 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0079 | 고초윤 | $.biography | org (2회) | Tolerates not even a single blank in the turbidity figures, and calls delay for the sake of preventing panic p ／ 탁도 숫자 한 칸의 빈칸도 용납하지 않고, 혼란 방지를 위한 지연을 과학이 아니라 정치로 부른다. 공개 시각을 흥정 거리로 삼지 않는다.

- 소속: 태욱그룹
- 생업: 수질 검사 공개 입회
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0079 | 고초윤 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0080 | 배서율 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0080 | 배서율 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0080 | 배서율 | $.biography | org (2회) | She notices the blur of the print on a medicine pouch before the severity of the illness, and regards brokers  ／ 약봉지의 인쇄 흐림을 병세보다 먼저 보고, 효능을 보호비로 부르는 중개인을 도둑으로 본다. 분노를 숨기되 표본 봉인은 양보하지 않는다.

- 소속: 태욱그룹
- 생업: 약품 피해 증거·명부 관리
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0080 | 배서율 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0083 | 여다솜 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0083 | 여다솜 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0083 | 여다솜 | $.biography | org (2회) | If a page number is missing from a certified copy, she stops her pen before even touching the conference water ／ 인증 사본의 쪽수가 빠지면 회의 물보다 먼저 펜을 멈추고, 지식을 보호비 조항 뒤에 숨기는 문구를 보면 자리를 뜬다. 숫자는 크게, 해석은 짧게 적는다.

- 소속: 태욱그룹
- 생업: 기술공유 문 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0083 | 여다솜 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0084 | 기서진 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0084 | 기서진 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0084 | 기서진 | $.biography | org (2회) | She checks the color of the escort flag before the temperature of the sample box, and tears up notes telling h ／ 표본 상자의 온도보다 호송 깃발의 색깔을 먼저 확인하고, 조사단을 호위단으로 바꾸라는 쪽지를 찢는다. 말은 적고 도착 시각은 지킨다.

- 소속: 태욱그룹
- 생업: 조사 문서 전달
- 품계: 대리 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0084 | 기서진 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0086 | 임하준 | $.position | clergy (2회) | Former Moderator of Myeongbu Church ／ 전 Arc 당회장 | 050 확정값: “”(빈 값 포함) |
| person-0086 | 임하준 | $.rank | clergy (2회) | Moderator ／ 당회장 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0086 | 임하준 | $.characterProfile.traits[].relationship | clergy (1회) | Taught Im Chowon maintenance without granting church succession. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.characterProfile.narrative | clergy (1회) | He handled church affairs as regent and learned pump standards, then taught Im Chowon maintenance without comp | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.sections.Offices | clergy (1회) | Rank: Session Head. Title: Former Session Head of the Roster Church. Livelihood nickname: Chief of Pump Engine | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.biography | clergy (2회) | Former Session Head of the Roster Church. Im Hajun, who sat as regent, disappeared in winter 2125. The records ／ Arc 전 당회장. 섭정으로 앉았던 임하준은 2125년 겨울 실종되었다. 성수1가2동의 뚝섬 열원 당직과 봉인함 기록에 그가 실종되기 전 맡았던 일이 남아 있다.

**생애.** 2126년 세대.  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.sections.생애 | clergy (1회) | 2126년 세대. 2119년 오씨 적장자 오경재가 미성년이었다. 장로들은 인준 투표로 임하준을 당회장에 앉혔다. 뚝섬 열원 당직에서 펌프 규격을 익힌 그는 양자 임초원에게 펌프 정비를 가르쳤으나 교 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.sections.관직 | clergy (1회) | 품계 당회장. 직함은 전 Arc 당회장. 생업 별명은 펌프기술 총관. 2125년 겨울 이후 자리가 비어 있다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0086 | 임하준 | $.relations.incoming[].basis | clergy (1회) | 2126년 장로 인준을 거쳐 당회장에 취임 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0087 | 임초원 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0087 | 임초원 | $.characterProfile.narrative | clergy (1회) | He learned pump maintenance from his adoptive father without becoming the church successor. On the shift after | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0087 | 임초원 | $.characterProfile.traits[].relationship | clergy (1회) | 오경재와 기술 동맹을 맺되 당회장 자리를 주장하지 않는다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0087 | 임초원 | $.sections.생애 | clergy (1회) | 2126년 세대. 펌프 곁에서 자랐다. 임하준에게 배운 것은 당회 후계가 아니라 펌프 정비 기술이었다. 품계는 교사다. 2125년 겨울 실종 다음 교대에 원본 함의 봉인을 확인하였다. 확인 사실은  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0087 | 임초원 | $.biography | clergy (1회) | 펌프기술자 임초원은 실종된 임하준의 양자다. 성수1가2동에서 펌프 정비 기록을 인계하고, 실종 다음 교대에 확인한 원본 함의 봉인을 장로회 기록과 대조한다. 임하준에게 배운 정비 교육은 끝나지 않았 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0087 | 임초원 | $.relations.incoming[].basis | clergy (1회) | 당회장 인준 청구를 심사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.title | clergy (2회) | King of the Religious Alliance · Moderator of Myeongbu Church ／ Arc 왕 · Arc 당회장 | 050 확정값: “” |
| person-0088 | 오경재 | $.position | clergy (2회) | King of the Religious Alliance · Moderator of Myeongbu Church ／ Arc 왕 · Arc 당회장 | 050 확정값: “”(빈 값 포함) |
| person-0088 | 오경재 | $.rank | clergy (2회) | King · Moderator ／ 왕 · 당회장 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0088 | 오경재 | $.confirmedHoldings[].name.ko | clergy (1회) | Roster Church Duchy Directly Managed Land, Gangnam-gu | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.subordinateHoldings[].name.ko | org (2회) | Seocho-gu Jeongdong Labor Federation Ducal Domain Direct Holdings ／ Gangnam-gu Jeongdong Labor Federation Ducal Domain Direct Holdings | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0088 | 오경재 | $.openingTitles[].name | clergy (1회) | Gangnam-gu Myeongbu Church Duchy | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.fields.Rank | clergy (1회) | Moderator | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.fields.Title | clergy (1회) | Moderator of Myeongbu Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.sections.Life | clergy (1회) | Generation of 2126. O Gyeongjae was the last duty apprentice at the General Assembly Hall at 29 Daehangno 3-gi | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.biography | clergy (2회) | **Life.** Generation of 2126. O Gyeongjae was the last duty apprentice at the General Assembly Hall at 29 Daeh ／ **생애.** 2126년 세대. 오경재는 종로구 대학로3길 29 총회회관의 마지막 당직 수습생이었다. 임하준이 2125년 겨울 실종된 뒤, 뚝섬 열원과 연지동 총회 사이의 펌프 정비 기록을 이어받았 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.characterProfile.traits[].relationship | org (1회) | 임초원과 기술 동맹을 유지하고 수문국과 원본을 공동 봉인한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0088 | 오경재 | $.characterProfile.narrative | org (1회) | 취임 뒤 임하준의 세 유언을 공개하고 한재목의 서부 확대안을 인준하지 않았다. 공정 원본을 수문국과 공동 봉인하는 데 동의했으나 유언의 내용이나 실종 경위는 공개 행동만으로 확정할 수 없다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0088 | 오경재 | $.fields.품계 | clergy (1회) | 당회장 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.fields.직함 | clergy (1회) | Arc 당회장 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.sections.생애 | clergy (1회) | 2126년 세대. 오경재는 종로구 대학로3길 29 총회회관의 마지막 당직 수습생이었다. 임하준이 2125년 겨울 실종된 뒤, 뚝섬 열원과 연지동 총회 사이의 펌프 정비 기록을 이어받았다. 임초원은  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0088 | 오경재 | $.relations.outgoing[].basis | clergy (1회) | 2126년 장로 인준을 거쳐 당회장에 취임 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0089 | 한소미 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.biography | clergy (2회) | She long remembers clans that are bold, quick-fingered, and hide their skill. She hears any talk of filling th ／ 대담하고 손끝이 빠르며 숙련을 숨기는 가문을 오래 기억한다. 총관의 빈자리를 혈통으로 메우자는 말을 공방의 모욕으로 듣는다.

- 소속: Arc
- 생업: 공방 조립 기록·교대 조정
- 품계: 장로 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.position | clergy (1회) | 성수 당회 장로 | 050 확정값: “”(빈 값 포함) |
| person-0089 | 한소미 | $.rank | clergy (1회) | 장로 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.fields.품계 | clergy (1회) | 장로 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.fields.직함 | clergy (1회) | 성수 당회 장로 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.sections.생애 | clergy (1회) | 2126년 세대. 한소미는 대합실 당직에서 자랐다. 한소미는 교대 무단 결근 대체 당직으로 성수 당회 장로 자리를 맡았다.
- 한소미의 성수 당회 장로 업무는 성수2가3동과 연결된다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.sections.관직 | clergy (1회) | 품계 장로. 직함은 성수 당회 장로. 핵심 공정을 여러 공방에 나누고 마지막 조립 기록만 평의회 금고에 두며, 기술총관의 빈 도장은 대표 연서로만 대행한다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0089 | 한소미 | $.sections.일화 | clergy (1회) | 2125년 한소미는 태업 작업반과 밤새 조건을 나눠 다음 교대를 열었다. 이 일로 성수 당회 장로 자리의 서명이 장부에 올랐다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0090 | 박세린 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0090 | 박세린 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0090 | 박세린 | $.biography | clergy+org (2회) | Cautious and polite, but she trusts the clan's tool serial numbers longer than any contract. She has a habit o ／ 신중하고 예의를 지키지만 가문의 공구 일련번호를 계약보다 오래 믿는다. 공개 설계를 도둑질로 부르는 버릇이 있다.

- 소속: Arc
- 생업: 펌프 부품 보관·출고 관리
- 품계: 교사
- 직함: | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0090 | 박세린 | $.sections.관계 | org (1회) | 임하준의 친족 공정을 지키는 후견을 자처하고, 한소미와는 후계 원한이며, 배우진이 동방사 명목 후보로 가문을 부를 때 유혹과 공포를 동시에 느낀다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0091 | 김보람 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0091 | 김보람 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0091 | 김보람 | $.biography | clergy (1회) | Loyal and direct; she halts meetings whenever the vibration in the pump room changes. She sees any proposal to | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0094 | 정가온 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0094 | 정가온 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0094 | 정가온 | $.biography | clergy (2회) | Cold and relentless in cross-checking the dates in the wording. She regards anyone who reads oral wills as aut ／ 냉정하고 문구의 날짜를 집요하게 대조한다. 구두 유언을 진본처럼 읽는 사람을 위조범의 이웃으로 본다.

- 소속: Arc
- 생업: 유언 사본 봉인·기록 감사
- 품계: 장로
- 직함: 당회 기록감 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0094 | 정가온 | $.rank | clergy (1회) | 장로 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0094 | 정가온 | $.fields.품계 | clergy (1회) | 장로 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0094 | 정가온 | $.sections.관직 | clergy (1회) | 품계 장로. 직함은 당회 기록감사. 유언 사본을 봉인해 기록청과 평의회에 동시에 보내고, 단독 해석 방송은 감사 날인 없이 무효라고 선언한다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0095 | 장민재 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0095 | 장민재 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0095 | 장민재 | $.biography | clergy (2회) | Gentle, but when the alley taps run dry he regards workshop meetings as a luxury. He asks about the cistern wa ／ 온화하나 골목 수도꼭지가 마르면 공방 회의를 사치로 여긴다. 후계자 이름보다 저수조 수위를 먼저 묻는다.

- 소속: Arc
- 생업: 골목 급수·수압 게시
- 품계: 권사
- 직함: 성수·성동 급 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0095 | 장민재 | $.rank | clergy (1회) | 권사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0095 | 장민재 | $.fields.품계 | clergy (1회) | 권사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0095 | 장민재 | $.sections.관직 | clergy (1회) | 품계 권사. 직함은 성수·성동 급수 시민대표. 골목별 수압 게시판을 운영하고, 펌프 출고가 군수나 가문 창고로만 가면 시민 연서로 평의회를 소집한다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0096 | 유하은 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0096 | 유하은 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0096 | 유하은 | $.biography | clergy (2회) | Witty, but she ruthlessly interrogates workshops that hide the origin of their fabric and gears. She believes  ／ 재치 있지만 원단과 기어의 출처를 숨기는 공방을 잔인하게 추궁한다. 신발 한 켤레의 바느질이 방호보다 먼저 사람을 살린다고 믿는다.

- 소속: Arc
- 생업: 가죽 공정·출고 기록
- 품계: 권 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0096 | 유하은 | $.rank | clergy (1회) | 권사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0096 | 유하은 | $.fields.품계 | clergy (1회) | 권사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0096 | 유하은 | $.sections.관직 | clergy (1회) | 품계 권사. 직함은 성수 가죽·소형기계 직능대표. 출고 수량을 직능 칠판에 공개하고, 군수 우선은 수비대의 누수 경보가 있을 때만 허용한다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0097 | 허겸 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0097 | 허겸 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0097 | 허겸 | $.sections.Relationships | clergy (1회) | He is the priest who takes over the mobile team's dispatch at the alley manhole, and he checks Im Chowon's pub | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0097 | 허겸 | $.biography | clergy (1회) | He pinpoints blocked sections by the oily smell from the packing, and does not fold the message telling him to | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0098 | 구도영 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0098 | 구도영 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0098 | 구도영 | $.biography | clergy (1회) | If the knots on the crate cords differ from workshop to workshop, he sends them back without asking about thei | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0100 | 채구름 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=geography:duchy:11200 |
| person-0100 | 채구름 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0100 | 채구름 | $.biography | clergy (1회) | She reads infiltration from the water level under the bridge, and regards any proposal to hand over defense in | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0104 | 변오름 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0104 | 변오름 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0104 | 변오름 | $.biography | clergy (2회) | When the alley taps run dry, Byeon Oreum regards workshop meetings as a luxury and asks about the cistern wate ／ 골목 수도꼭지가 마르면 공방 회의를 사치로 여기고, 후계자 이름보다 저수조 수위를 먼저 묻는다. 온화하나 군수 화차를 급수 창구 앞에 두지 않는다.

- 소속: Arc
- 생업: 대합실 급수 창구  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0104 | 변오름 | $.rank | clergy (1회) | 집사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0104 | 변오름 | $.fields.품계 | clergy (1회) | 집사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0104 | 변오름 | $.sections.관직 | clergy (1회) | 품계 집사. 직함은 성수 대합실 역장. 골목별 수압 게시판을 대합실에도 옮기고, 펌프 출고가 군수나 가문 창고로만 가면 시민 연서로 평의회를 소집한다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0105 | 표누리 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0105 | 표누리 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0105 | 표누리 | $.biography | clergy (2회) | Sees a spot where the stabling-track bay chalk has been erased as an empty one, and summons first whichever pa ／ 유치선 칸 분필이 지워진 자리를 빈 사람으로 보고, 후계 회의 전갈보다 출고 호각이 늦은 쪽을 먼저 부른다. 칸이 겹치면 말보다 줄을 친다.

- 소속: Arc
- 생업: 유치선 칸 배정·출고 관리 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0105 | 표누리 | $.rank | clergy (1회) | 집사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0105 | 표누리 | $.fields.품계 | clergy (1회) | 집사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0105 | 표누리 | $.sections.관직 | clergy (1회) | 품계 집사. 직함은 군자기지 유치 실무장. 호각 전에 공방 분필과 수비 분필을 칸마다 다시 긋고, 줄이 없는 개조칸은 자갈에 세운다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0106 | 명우솔 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0106 | 명우솔 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0106 | 명우솔 | $.biography | clergy (1회) | Presses workshops that hide the origin of fabric and gears, and believes that the market price of a single pai | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0107 | 제바름 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0107 | 제바름 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0107 | 제바름 | $.biography | clergy (1회) | When alley taps run dry, he considers workshop meetings a luxury and asks about the number of dehydrated patie | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0108 | 변석훈 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0108 | 변석훈 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0108 | 변석훈 | $.biography | clergy (2회) | When the vibration in the pump room changes, he lowers output, and he regards a proposal to hand over defense  ／ 펌프실의 진동이 바뀌면 출력을 낮추고, 수비를 보호군 명목으로 내주라는 제안을 배신으로 본다. 과묵하고 연료 일지를 깎지 않는다.

- 소속: Arc
- 생업: 펌프실 발전·배전 운전
- 품계: 집 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0108 | 변석훈 | $.rank | clergy (1회) | 집사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0108 | 변석훈 | $.fields.품계 | clergy (1회) | 집사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0108 | 변석훈 | $.sections.관직 | clergy (1회) | 품계 집사. 직함은 뚝섬 펌프실 발전운전장. 주간은 당회와 출력 일지를 공유하고, 야간 배전은 수비대 암호패와 공정 감독의 이중 확인만 허용한다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0109 | 종나솔 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0109 | 종나솔 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0109 | 종나솔 | $.biography | clergy (1회) | If the vibration of the pump room access door changes, she does not ring the disembarkation bell, and she trea | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0110 | 고은하 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0110 | 고은하 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0110 | 고은하 | $.biography | clergy+org (2회) | She looks at the slant of the handwriting on the three wills before the Workshop seal, and takes pressure to c ／ 유언장 세 장의 필적 기울기를 공방 도장보다 먼저 보고, 어느 한 장을 진본이라 부르라는 압력을 모욕으로 여긴다. 잉크가 마르기 전에는 평의회에 올리지 않는다.

- 소속: Arc
- 생업: 유언  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0110 | 고은하 | $.sections.야망 | org (1회) | 세 장의 상충하는 유언을 당회가 동시에 열람한 원장으로만 남겨, 기술가문이나 동방사가 한 장을 고르지 못하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0111 | 배나경 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0111 | 배나경 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0111 | 배나경 | $.biography | clergy+org (2회) | When she sees a signature field with the Chief Steward's seat vacant, she puts down her pen and rubs out with  ／ 총관 빈자리가 있는 서명란을 보면 펜을 놓고, 대행 날인을 연장으로 부르는 문구를 지우개로 문지른다. 만료 시각을 사람 말보다 펌프 압력으로 확인한다.

- 소속: Arc
- 생업: 급수계약 사본  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0111 | 배나경 | $.sections.공포 | org (1회) | 배나경은 빈 서명란이 동방사 파견의 동의가 되고, 자신이 찍은 사본이 그 동의의 증거가 되는 상황을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0112 | 류다인 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0112 | 류다인 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0112 | 류다인 | $.biography | clergy (1회) | She smells the sweetness coming off the packing before she checks the standard seal, and she pushes brokers wh | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0113 | 엄미래 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0113 | 엄미래 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0113 | 엄미래 | $.biography | clergy (1회) | If the knot of the sealing cord is loose, she does not depart, and she leaves no note outside the bag telling  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0115 | 기하겸 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0115 | 기하겸 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0115 | 기하겸 | $.sections.Ambition | org (1회) | He leaves the Ttukseom defense as a double refusal by the workshop militia and the Pump Defense Corps, so that | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0115 | 기하겸 | $.biography | clergy+org (2회) | He sends back the messenger who calls the officer's banner at the bridge a rescue, and does not hand the Pump  ／ 교량 쪽 장교 깃발을 구원으로 부르는 전령을 돌려보내고, 펌프수비의 야간 교대를 외부 지휘에 넘기지 않는다. 분노를 숨기되 차단 바리케이드는 거두지 않는다.

- 소속: Arc
- 생업: 민병 당직 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0115 | 기하겸 | $.sections.야망 | org (1회) | 뚝섬 수비를 공방 민병과 펌프수비대의 이중 거부로 남겨, 동방사가 명목 후보를 앞세워 주둔하지 못하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.position | org (2회) | Eastern Command Commander ／ 동방사 사령관 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0116 | 배우진 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.fields.Title | org (1회) | Eastern Command Commander | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.sections.Life | org (1회) | Bae Ujin was born in the third generation. Bae Ujin grew up in the Eastern Command warlord house. In 2126 the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.sections.Offices | org (1회) | Rank: Commander. Title: Commander of the Eastern Command. Livelihood alias: Water Supply Guard Commander. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.sections.Relationships | org (1회) | Floodgate tactics with Han Jaemok. Receives eastern provisions from Nam Yungyeong. Stands against Kang Minseo  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.biography | org (2회) | **Life.** Bae Ujin was born in the third generation. Bae Ujin grew up in the Eastern Command warlord house. Th ／ **생애.** 배우진은 3세대에 태어났다. 배우진은 동방사 군벌 가문에서 자랐다. 암사아리수정수센터는 2126년에도 서울아리수본부 산하 공공기관으로 운영되고 지방공업·지방시설 계열 서울특별시 지방공 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.relations.incoming[].basis | org (4회) | Former senior operative of the Eastern Command Special Recovery Team ／ Receives command from the commander as an Eastern Command staff officer | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.fields.직함 | org (1회) | 동방사 사령관 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.sections.생애 | org (1회) | 배우진은 3세대에 태어났다. 배우진은 동방사 군벌 가문에서 자랐다. 암사아리수정수센터는 2126년에도 서울아리수본부 산하 공공기관으로 운영되고 지방공업·지방시설 계열 서울특별시 지방공무원이 근무한다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.sections.관직 | org (1회) | 품계 사령관. 직함은 동방사 사령관. 생업 별명은 상수호위사령. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0116 | 배우진 | $.sections.관계 | org (1회) | 한재목과 수문 전술. 남윤경에게 동부 군량을 받는다. 강민서와 복무 등록을 두고 맞선다.

- 소속: 동방사
- 생업: 복구복무 명부·부품 대가 조정
- 품계: 사령관
- 직함: 동방사 사령관
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.position | org (2회) | Eastern Command Chief of Staff ／ 동방사 참모장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0117 | 김우찬 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.fields.Title | org (1회) | Eastern Command Chief of Staff | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Eastern Command Chief of Staff. He posts restoration results but bypasses dispatch and  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.sections.Relationships | org (1회) | Takes Bae Ujin's command at the closest range, competes over Han River floodgate tactics with Floodgate Bureau | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.sections.Ambition | org (1회) | To bind the eastern water supply network and bridges into a single Eastern Command operations chart under offi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.biography | org (2회) | Gim Uchan shares discipline and speed with the supreme commander, but his habit of seeing debate as a weakness ／ 김우찬은 규율과 속도를 총사령과 나누되, 토론을 약점으로 보는 버릇은 더 짙다. 부하 가족의 급수표가 밀리면 자신이 순찰열차를 탄다.

- 소속: 동방사
- 생업: 복구 실적 게시·배차 관리
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.relations.outgoing[].basis | org (4회) | Receives command from the commander as an Eastern Command staff officer ／ Competes with Floodgate Bureau guards over Han River floodgate tactics | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.characterProfile.traits[].behavior | org (2회) | 일화. 2125년 무장 난입자를 문 밖에서 붙들어 명부 재점검을 열었다. 이 일로 동방사 참모장 자리의 서명이 장부에 올랐다. ／ 관직. 품계 병장. 직함은 동방사 참모장. 복구 실적을 게시하되 비밀 장교 인맥으로 배차와 봉쇄를 우회하고, 이탈자를 배신으로 기록한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.characterProfile.traits[].relationship | org (2회) | 관계. 배우진의 지휘를 최측근에서 받으며, 수문국 수문대장 김태운과 한강 수문 전술을 경쟁하고, 정소율의 행정 급수표를 비상감독으로 짓누른다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 동방사 참모장. 복구 실적을 게시하되 비밀 장교 인맥으로 배차와 봉쇄를 우회하고, 이탈자를 배신으로 기록한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.characterProfile.narrative | org (1회) | 일화. 2125년 무장 난입자를 문 밖에서 붙들어 명부 재점검을 열었다. 이 일로 동방사 참모장 자리의 서명이 장부에 올랐다. 직함·야망을 이미 이룬 권한이나 성과로 취급하지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.fields.직함 | org (1회) | 동방사 참모장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.sections.관직 | org (1회) | 품계 병장. 직함은 동방사 참모장. 복구 실적을 게시하되 비밀 장교 인맥으로 배차와 봉쇄를 우회하고, 이탈자를 배신으로 기록한다.

일화. 김우찬은 2125년 무장 난입자를 문 밖에서 붙들어 명부  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.sections.관계 | org (1회) | 배우진의 지휘를 최측근에서 받으며, 수문국 수문대장 김태운과 한강 수문 전술을 경쟁하고, 정소율의 행정 급수표를 비상감독으로 짓누른다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0117 | 김우찬 | $.sections.야망 | org (1회) | 동부 급수망과 교량을 장교 지휘 아래 하나의 동방사 작전표로 묶어 배우진의 후계 참모가 된다.

공포. 김우찬은 민간 행정관이 물을 거래 카드로 써서 장교망이 공식 명령 밖으로 밀려나는 일을 두려워 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0118 | 정소율 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.sections.Offices | org (1회) | Rank: Battalion Commander. Title: Director of the Water Supply Administration. She posts water supply district | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.biography | org (2회) | Jeong Soyul is calculating and tries to hold to the letter of the text, but she loathes how her voice drops wh ／ 정소율은 계산적이고 문구를 지키려 하나, 군화가 회의실에 들어오면 목소리가 낮아지는 자신을 혐오한다. 급수 의무를 치안 실적과 바꾸는 거래를 모욕으로 본다.

- 소속: 동방사
- 생업: 급수 구역 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 대대장. 직함은 상수행정청장. 급수 구역과 관문세를 공개 원장에 올리지만, 동방사의 비상 도장이 찍힌 전표는 사흘 안의 행정 재심을 요구한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 대대장. 직함은 상수행정청장. 급수 구역과 관문세를 공개 원장에 올리지만, 동방사의 비상 도장이 찍힌 전표는 사흘 안의 행정 재심을 요구한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0118 | 정소율 | $.sections.관직 | org (1회) | 품계 대대장. 직함은 상수행정청장. 급수 구역과 관문세를 공개 원장에 올리지만, 동방사의 비상 도장이 찍힌 전표는 사흘 안의 행정 재심을 요구한다.

일화. 정소율은 2125년 역사 화재 때 인명  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0119 | 장석윤 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0119 | 장석윤 | $.characterProfile.traits[].stress | org (4회) | Fear. That the The Gauge's citizenship standard would pierce the Godeok training ground and the officer regist ／ Fear. That the The Gauge's citizenship standard would pierce the Godeok training ground and the officer regist | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0119 | 장석윤 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0119 | 장석윤 | $.sections.Ambition | org (1회) | He means to enter restoration servicemembers into the officer corps' household register, turning even the East | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0119 | 장석윤 | $.biography | org (2회) | Jang Seok-yun takes responsibility for his subordinates like family, but forgives no desertion during training ／ 장석윤은 부하를 가족처럼 책임지되 훈련 중 이탈은 용서하지 않는다. 부품 대신 복무 등록을 표준 교범에 넣고 싶어 한다.

- 소속: 동방사
- 생업: 장교단 훈련·교관 수첩 관리
- 품계: 병장
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0119 | 장석윤 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0119 | 장석윤 | $.sections.야망 | org (1회) | 복구복무자를 장교단 호적에 올려 동부 약소국까지 동방사의 병력 풀로 만든다.

공포. 장석윤은 규격맹의 시민권 규격이 고덕 훈련장을 뚫고 들어와 장교 호적이 빈 명부가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0120 | 이윤서 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Eastern Bridge Blockade Commander. Opens daytime passage with administrative gate-toll  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.biography | org (2회) | Yi Yunseo is straightforward and loyal, but dislikes superiors who use exceptions to passage permits as politi ／ 이윤서는 직선적이고 신의가 있으나 통행 허가의 예외를 정치 선물로 쓰는 상관을 싫어한다. 교량 아래 상수관 진동을 발소리보다 먼저 듣는다.

- 소속: 동방사
- 생업: 교량 통행·야간 봉쇄 관리
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 동부 교량봉쇄대장. 주간 통행은 행정 관문세 전표로 열고, 야간 봉쇄는 동방사 암호패만 인정하며 의료열차만 예외로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 병장. 직함은 동부 교량봉쇄대장. 주간 통행은 행정 관문세 전표로 열고, 야간 봉쇄는 동방사 암호패만 인정하며 의료열차만 예외로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0120 | 이윤서 | $.sections.관직 | org (1회) | 품계 병장. 직함은 동부 교량봉쇄대장. 주간 통행은 행정 관문세 전표로 열고, 야간 봉쇄는 동방사 암호패만 인정하며 의료열차만 예외로 남긴다.

일화. 이윤서는 2125년 능선 초계 중 매복 흔적을 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0121 | 박하율 | $.characterProfile.traits[].description | org (2회) | Office. Rank: sergeant. Title: Godeok depot train maintenance chief. He put the release order on the public bo ／ 관직. 품계 병장. 직함은 고덕기지 열차정비장. 출고 순서를 복구·순찰·군수 공개판에 올리되, 규격맹 도장 없는 나사는 별도 측정 없이 쓰지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.characterProfile.traits[].behavior | org (2회) | Office. Rank: sergeant. Title: Godeok depot train maintenance chief. He put the release order on the public bo ／ 관직. 품계 병장. 직함은 고덕기지 열차정비장. 출고 순서를 복구·순찰·군수 공개판에 올리되, 규격맹 도장 없는 나사는 별도 측정 없이 쓰지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Godeok Depot Train Maintenance Chief. Posts the dispatch order on the recovery, patrol, | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.biography | org (2회) | Bak Hayul is taciturn and reads the falsehoods of a route from the wear on its wheels. Regards an order to tur ／ 박하율은 과묵하고 차륜의 마모로 노선의 거짓을 읽는다. 정비 창구를 보호비 창구로 바꾸라는 명령을 수치로 여긴다.

- 소속: 동방사
- 생업: 열차 출고·부품 규격 점검
- 품계: 병장
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0121 | 박하율 | $.sections.관직 | org (1회) | 품계 병장. 직함은 고덕기지 열차정비장. 출고 순서를 복구·순찰·군수 공개판에 올리되, 규격맹 도장 없는 나사는 별도 측정 없이 쓰지 않는다.

일화. 박하율은 2125년 유치선 탈선 직전 바퀴 결 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0122 | 최도윤 | $.characterProfile.traits[].behavior | org (3회) | Anecdote. Jang Seokyun's registry demands the eastern alley ration tables and the service roll handed over as  ／ 일화. 장석윤의 등록소가 동부 골목 배급표와 복무 명부를 한 묶음으로 넘기라고 요구한다. 최도윤은 배급표를 골목에 공개하고, 가족 단위 등록 거부 명단은 정소율의 행정청으로만 보내 동방사 수첩과 갈 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.characterProfile.narrative | org (2회) | Anecdote. Jang Seokyun's registry demands the eastern alley ration tables and the service roll handed over as  ／ 일화. 장석윤의 등록소가 동부 골목 배급표와 복무 명부를 한 묶음으로 넘기라고 요구한다. 최도윤은 배급표를 골목에 공개하고, 가족 단위 등록 거부 명단은 정소율의 행정청으로만 보내 동방사 수첩과 갈 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.sections.Offices | org (1회) | Rank: Battalion Commander. Title: Civic Representative of the Eastern Water District. Makes the alley ration t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.sections.Anecdote | org (1회) | Jang Seogyun's registry office demands that the eastern alley ration tickets and the service roster be handed  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.biography | org (2회) | Choe Doyun is merciful, but he cuts off compromise the moment household rations are tied to the service roster ／ 최도윤은 자비롭지만 가족 단위 배급이 복무 명부와 묶이는 순간 타협을 끊는다. 치안을 이유로 아이를 훈련장에 보내는 효율론을 거부한다.

- 소속: 동방사
- 생업: 골목 배급표·시민 명부 관리
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 대대장. 직함은 동부 급수구역 시민대표. 골목 배급표를 공개하고, 가족 단위 등록 거부 명단을 행정청에만 넘겨 동방사 수첩과 분리한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.sections.관직 | org (1회) | 품계 대대장. 직함은 동부 급수구역 시민대표. 골목 배급표를 공개하고, 가족 단위 등록 거부 명단을 행정청에만 넘겨 동방사 수첩과 분리한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0122 | 최도윤 | $.sections.일화 | org (1회) | 장석윤의 등록소가 동부 골목 배급표와 복무 명부를 한 묶음으로 넘기라고 요구한다. 최도윤은 배급표를 골목에 공개하고, 가족 단위 등록 거부 명단은 정소율의 행정청으로만 보내 동방사 수첩과 갈라 둔다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0123 | 임겨레 | $.characterProfile.traits[].behavior | org (3회) | Anecdote. A protection clause with an empty term box comes down to the gate attached to Kim Woochan's operatio ／ 일화. 김우찬의 작전표에 기간 칸이 빈 보호 조항이 붙어 관문으로 내려온다. 임겨레는 만료된 관문세 전표의 통행을 닫고, 같은 조항을 행정과 동방사에 동시에 보내 정소율의 재심 전표와 맞춰 본다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.characterProfile.narrative | org (2회) | Anecdote. A protection clause with an empty term box comes down to the gate attached to Kim Woochan's operatio ／ 일화. 김우찬의 작전표에 기간 칸이 빈 보호 조항이 붙어 관문으로 내려온다. 임겨레는 만료된 관문세 전표의 통행을 닫고, 같은 조항을 행정과 동방사에 동시에 보내 정소율의 재심 전표와 맞춰 본다.  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Eastern Gate Toll and Protection Contract Auditor. Sends gate-toll and protection claus | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.sections.Anecdote | org (1회) | A protection clause with a blank term field is attached to Kim Uchan's operations sheet and sent down to the g | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.biography | org (2회) | Im Gyeore is cold, and loathes blanks in termination conditions. Im Gyeore calls protection without a time lim ／ 임겨레는 냉정하고 종료 조건의 빈칸을 증오한다. 기간 없는 보호를 계약이 아니라 점령으로 부른다.

- 소속: 동방사
- 생업: 관문세·보호계약 전표 감사
- 품계: 병장
- 직함: 동부 관문세·보 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 동부 관문세·보호계약 감사관. 관문세와 보호 조항을 행정·동방사에 동시에 보내되, 기한 만료 전표는 감사 날인 없이 통행을 닫는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.sections.관직 | org (1회) | 품계 병장. 직함은 동부 관문세·보호계약 감사관. 관문세와 보호 조항을 행정·동방사에 동시에 보내되, 기한 만료 전표는 감사 날인 없이 통행을 닫는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0123 | 임겨레 | $.sections.일화 | org (1회) | 김우찬의 작전표에 기간 칸이 빈 보호 조항이 붙어 관문으로 내려온다. 임겨레는 만료된 관문세 전표의 통행을 닫고, 같은 조항을 행정과 동방사에 동시에 보내 정소율의 재심 전표와 맞춰 본다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0124 | 한보라 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0124 | 한보라 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0124 | 한보라 | $.biography | org (2회) | Han Bora is bold and endures the silence of the night tracks better than most people. Han Bora tears up a note ／ 한보라는 대담하고 야간 선로의 침묵을 사람보다 잘 견딘다. 의료열차로 위장한 군수 화차를 자기 열차에 붙이라는 쪽지를 찢어 버린다.

- 소속: 동방사
- 생업: 순찰열차 출고·화차 확인
- 품계: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0124 | 한보라 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.position | org (2회) | Eastern Command Messenger ／ 동방사 전령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0129 | 지목현 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.fields.Title | org (1회) | Eastern Command Messenger | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Eastern Command Herald. Sends dispatches to the administrative office and the Eastern C | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.biography | org (2회) | Ji Mokhyeon refuses to depart if the seal cord is loose, and treats any envoy who does not enter oral messages ／ 지목현은 봉인 끈이 느슨하면 출발을 거부하고, 구두 전갈을 원장에 올리지 않는 사신을 위조로 본다. 숨이 차도 사본 두 장을 한 손에 쥔다.

- 소속: 동방사
- 생업: 행정·군사 전갈 봉함 전달 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.characterProfile.traits[].behavior | org (2회) | 일화. 2125년 야간 무단 도꾼을 붙잡아 경비 암호패를 갈았다. 이 일로 동방사 전령 자리의 서명이 장부에 올랐다. ／ 관직. 품계 병장. 직함은 동방사 전령. 전갈을 행정청과 동방사에 동시에 보내고, 파견 편성은 정소율의 재심 날인과 김우찬의 작전표가 둘 다 있어야 달린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 동방사 전령. 전갈을 행정청과 동방사에 동시에 보내고, 파견 편성은 정소율의 재심 날인과 김우찬의 작전표가 둘 다 있어야 달린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.characterProfile.narrative | org (1회) | 일화. 2125년 야간 무단 도꾼을 붙잡아 경비 암호패를 갈았다. 이 일로 동방사 전령 자리의 서명이 장부에 올랐다. 직함·야망을 이미 이룬 권한이나 성과로 취급하지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.fields.직함 | org (1회) | 동방사 전령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0129 | 지목현 | $.sections.관직 | org (1회) | 품계 병장. 직함은 동방사 전령. 전갈을 행정청과 동방사에 동시에 보내고, 파견 편성은 정소율의 재심 날인과 김우찬의 작전표가 둘 다 있어야 달린다.

일화. 지목현은 2125년 야간 무단 도꾼을  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0130 | 마길상 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0130 | 마길상 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0130 | 마길상 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0130 | 마길상 | $.biography | org (1회) | 마길상은 교량 아래 상수관 수온으로 시간을 읽고, 지도에 없는 맨홀을 자랑으로 여기지 않는다. 늦은 보고를 죄로 본다.

- 소속: 동방사
- 생업: 교량 하부 채수·진동 조사
- 품계: 병장
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0132 | 나효원 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0132 | 나효원 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0132 | 나효원 | $.characterProfile.traits[].description | org (1회) | 창구 스탬프의 마른 자리로 대기 인원을 세고, 보호 동방사의 정차 방송을 급수 컵보다 앞에 두지 않는다. 분필이 짧아지면 방송을 줄인다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0132 | 나효원 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0132 | 나효원 | $.biography | org (1회) | 나효원은 창구 스탬프의 마른 자리로 대기 인원을 세고, 보호 동방사의 정차 방송을 급수 컵보다 앞에 두지 않는다. 분필이 짧아지면 방송을 줄인다.

- 소속: 동방사
- 생업: 대합실 급수 창구·대 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0133 | 양기석 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0133 | 양기석 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0133 | 양기석 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0133 | 양기석 | $.biography | org (1회) | 양기석은 유치 램프가 두 칸 연속 깜빡이면 말을 멈추고, 군수 충전 쪽지는 축전지 함 겉에 붙이지 않는다. 교대 램프 횟수를 일지에서 지우지 않는다.

- 소속: 동방사
- 생업: 유치선 전력·쇄정 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0134 | 주단아 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0134 | 주단아 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0134 | 주단아 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0134 | 주단아 | $.biography | org (1회) | 주단아는 강바람보다 수통 시세를 빨리 읽고, 저울을 속이는 상인을 아침 추첨에서 즉시 뺀다. 흥정을 노래처럼 하지만 복무 골목의 가격은 올리지 않는다.

- 소속: 동방사
- 생업: 급수시장 수질  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0135 | 차윤목 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0135 | 차윤목 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0135 | 차윤목 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0135 | 차윤목 | $.biography | org (1회) | 차윤목은 들것 끈의 물기로 탈수 정도를 가늠하고, 한 골목을 통계로 건너뛰라는 쪽지를 차 옆 명찰에 꽂지 않는다. 시약 상자의 끓인 물 표시는 직접 그린다.

- 소속: 동방사
- 생업: 이동의무차 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0136 | 설봄이 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0136 | 설봄이 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0136 | 설봄이 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0136 | 설봄이 | $.biography | org (1회) | 설봄이는 연료 냄새에 예민하고 구두 배전을 싫어한다. 정수 전동기보다 훈련장 조명에 전력을 돌리라는 정치적 압박을 모욕으로 여긴다.

- 소속: 동방사
- 생업: 비상발전 연료·출력 운전
- 품계: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0141 | 류가온 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0141 | 류가온 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0141 | 류가온 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 보호군 파견 호송책. 파견 명단은 상수행정 날인과 동방사 암호패가 함께 있어야 출발하고, 귀환 시각이 빈 칸은 고덕 유치선에서 되돌린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0141 | 류가온 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 병장. 직함은 보호군 파견 호송책. 파견 명단은 상수행정 날인과 동방사 암호패가 함께 있어야 출발하고, 귀환 시각이 빈 칸은 고덕 유치선에서 되돌린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0141 | 류가온 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0141 | 류가온 | $.sections.관직 | org (1회) | 품계 병장. 직함은 보호군 파견 호송책. 파견 명단은 상수행정 날인과 동방사 암호패가 함께 있어야 출발하고, 귀환 시각이 빈 칸은 고덕 유치선에서 되돌린다.

일화. 류가온은 2125년 호송 도중  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0141 | 류가온 | $.biography | org (1회) | 류가온은 교량 위 민병 바리케이드를 구원 대상이 아니라 통과 거부로 읽고, 구두 주둔 허가를 명령으로 받지 않는다. 경로는 짧고 귀환 시각은 미리 적는다.

- 소속: 동방사
- 생업: 파견 인명  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0144 | 남휘강 | $.stateName | org (2회) | Eastern Command ／ 동방사 | 050 확정값으로 교체: state_id=arc |
| person-0144 | 남휘강 | $.fields.Affiliation | org (1회) | Eastern Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0144 | 남휘강 | $.sections.Ambition | org (1회) | Enter the Sluice Bridge lockdown authority as a standalone entry in the bridge ledger, rather than leaving it  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0144 | 남휘강 | $.biography | org (2회) | Nam Hwigang speaks briefly on the bridge and only checks whose hand brings the lockdown lever down. He leaves  ／ 남휘강은 교량 위에서는 짧게 말하고, 봉쇄 레버를 누구 손으로 내리는지만 확인한다. 칭찬보다 봉인 시각을 남긴다.

- 소속: 동방사
- 생업: 교량 레버·개방 연서 관리
- 품계: 병장
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0144 | 남휘강 | $.fields.소속 | org (1회) | 동방사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0144 | 남휘강 | $.sections.야망 | org (1회) | 수문 교량 봉쇄권을 동방사 사령의 구두 지시가 아니라 교량 장부에 단독 항목으로 올린다.

공포. 남휘강은 봉쇄 키가 한 손에 모이면 교량이 약소국 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0145 | 윤서린 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0145 | 윤서린 | $.subordinateHoldings[].name.ko | org (5회) | Seodaemun-gu Government of the Republic of Korea Ducal Demesne ／ Seocho-gu Seongha Group Ducal Demesne | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0145 | 윤서린 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0145 | 윤서린 | $.openingTitles[].name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0145 | 윤서린 | $.openingTitles[].basis | org (1회) | 2026-10-22 영토 작위 배분(owner:seoul-faction-consolidation-20261022). 대한민국정부 대통령. 청와대·광화문 중심의 강북 권역과 종로 공작령 보유 근거. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0145 | 윤서린 | $.relations.incoming[].basis | clergy (1회) | 당회장 인준을 대통령 지휘로 심사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0146 | 강예준 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0146 | 강예준 | $.relations.incoming[].basis | clergy (1회) | Is the priest who transfers Gang Yejun's handwriting comparison into the ledger, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0146 | 강예준 | $.relations.outgoing[].basis | clergy (2회) | 당회장 인준을 대통령 지휘로 심사 ／ 당회장 인준 청구를 심사 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0147 | 조하린 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0147 | 조하린 | $.relations.incoming[].basis | clergy (1회) | is a priest who backs Jo Harin's dual-key rule on site, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0148 | 윤지율 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0148 | 윤지율 | $.relations.incoming[].basis | clergy (1회) | is a priest who translates Yun Jiyul's medical transport ledger into coordination tables, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0149 | 오서율 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0150 | 서라온 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0150 | 서라온 | $.relations.incoming[].basis | clergy (1회) | A priest who hands field coordinates to Seo Raon's plate, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0151 | 지서윤 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0151 | 지서윤 | $.sections.Relationships | clergy (1회) | A priest who supports Jo Harin's double-key rule in the field, matches dehumidification power to Na Bomgyeol's | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0151 | 지서윤 | $.relations.outgoing[].basis | clergy (1회) | is a priest who backs Jo Harin's dual-key rule on site, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0152 | 마도한 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0153 | 연지우 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0154 | 나선재 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0155 | 양해온 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0156 | 주리안 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0156 | 주리안 | $.relations.outgoing[].basis | clergy (1회) | A priest who hands field coordinates to Seo Raon's plate, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0157 | 차세온 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0157 | 차세온 | $.relations.outgoing[].basis | clergy (1회) | Is the priest who transfers Gang Yejun's handwriting comparison into the ledger, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0158 | 설다흰 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0158 | 설다흰 | $.sections.Functional/Livelihood Role | org (1회) | Seoul Station Concourse Stationmaster. Not an office, position, or rank in the Government of the Republic of K | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0158 | 설다흰 | $.biography | org (2회) | Gauges the crowd by platform humidity and takes an order to pull a ceremonial train ahead of the patient queue ／ 승강장 습기로 인파를 가늠하고, 의전 열차를 환자 대기열 앞으로 끌어오라는 명령을 모욕으로 듣는다. 온화하나 이송 취소가 뜨면 방송을 직접 잡는다.

- 생업: 대합실 의무 대기표·공증 창구 운영
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0158 | 설다흰 | $.sections.기능·생업 역할 | org (1회) | 서울역 대합실 역장. 대한민국정부 또는 서울특별시 공무원 관직·직위·직급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0159 | 지한솔 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0160 | 마은결 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0160 | 마은결 | $.sections.Functional/Livelihood Role | org (1회) | Auctioneer of the Jongno Notarized Copy Market. This is not an office, position, or rank in the Government of  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0160 | 마은결 | $.biography | org (2회) | He reads copy prices faster than the river wind and immediately strikes from the morning lottery any merchant  ／ 사본 시세를 강바람보다 빨리 읽고, 빈 철제를 고가에 올리려는 상인을 아침 추첨에서 즉시 뺀다. 흥정을 노래처럼 하지만 유언 사본의 가격은 올리지 않는다.

- 생업: 공증사본 인장 확인·경매
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0160 | 마은결 | $.sections.기능·생업 역할 | org (1회) | 종로 공증사본 시장 경매사. 대한민국정부 또는 서울특별시 공무원 관직·직위·직급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0161 | 연태솔 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0161 | 연태솔 | $.biography | clergy (1회) | Fills in the triage numbers before the people, and refuses notes ordering ambulance trains to be attached to m | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0161 | 연태솔 | $.relations.outgoing[].basis | clergy (1회) | is a priest who translates Yun Jiyul's medical transport ledger into coordination tables, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0162 | 나봄결 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0163 | 홍예준 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0164 | 추서윤 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0164 | 추서윤 | $.sections.Functional/Livelihood Role | org (1회) | Water-supply-contract ratification petition witness. Not a Government of the Republic of Korea or Seoul Metrop | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0164 | 추서윤 | $.biography | org (2회) | Counts expiry dates on the fingers and sends envoys proposing verbal extensions down from the witness stand. T ／ 만료일을 손가락으로 세고, 구두로 연장하자는 사신을 증인석에서 내려보낸다. 숫자는 믿되 빈칸 조항은 믿지 않는다.

- 생업: 급수계약 청구서·증언 대조
- 지위: 기능·생업 역할(정부 임용 아님) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0164 | 추서윤 | $.sections.기능·생업 역할 | org (1회) | 급수계약 인준 청구 증인. 대한민국정부 또는 서울특별시 공무원 관직·직위·직급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0165 | 어태산 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0165 | 어태산 | $.characterProfile.traits[].stress | org (2회) | 공포. 인준 함이 강국의 보호 문장으로 덧칠되어 대한민국정부 헌장이 하청 문서가 되는 것. 행동 변화나 상태 효과는 미확정이다. ／ 공포. 인준 함이 강국의 보호 문장으로 덧칠되어 대한민국정부 헌장이 하청 문서가 되는 것. 실제 반응은 아직 기록되지 않았다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0166 | 란지호 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0166 | 란지호 | $.sections.Functional/Livelihood Role | org (1회) | Party to the Meritorious Retainer Reward Register. Not an office, position, or grade in the Government of the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0166 | 란지호 | $.biography | org (2회) | Cannot forget the winter when office and ration rights were handed over written on a single line, and does not ／ 관직과 배급권을 한 줄에 적힌 채 받은 겨울을 잊지 못하고, 세습 칸이 비면 목소리를 낮추지 않는다. 자비와 분노를 한 호흡에 낸다.

- 생업: 공신 보상 사본·배급표 대조
- 지위: 기능·생업  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0166 | 란지호 | $.sections.기능·생업 역할 | org (1회) | 공신 보상 명부 당사자. 대한민국정부 또는 서울특별시 공무원 관직·직위·직급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.title | org (2회) | Government Council Record Courier of the Government of the Republic of Korea ／ 대한민국정부 회의 기록 전령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.position | org (2회) | Government Council Record Courier of the Government of the Republic of Korea ／ 대한민국정부 회의 기록 전령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0167 | 섭도윤 | $.fields.Assigned Duties | org (1회) | Government Council Record Courier of the Government of the Republic of Korea | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.sections.Civil Servant Position and Grade | org (1회) | A grade among Local Administrative Officer (Grade 5), Local Administrative Clerk (Grade 6), Assistant Local Ad | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.biography | org (2회) | Checks the time of the council before the seal, and stands at the door any envoy who tries to turn a verbal ag ／ 회의 시각을 봉인보다 먼저 확인하고, 구두 합의를 전갈로 바꾸려는 사신을 문 앞에 세운다. 숨이 차도 사본은 두 장이다.

- 생업: 회의 전갈·증언 확인 전달
- 소속: 서울특별시 지방공무원 조직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.characterProfile.traits[].stress | org (2회) | 공포. 위조 회의 전갈 한 장이 대한민국정부을 강국별로 쪼개 전령망이 매수의 나팔이 되는 것. 행동 변화나 상태 효과는 미확정이다. ／ 공포. 위조 회의 전갈 한 장이 대한민국정부을 강국별로 쪼개 전령망이 매수의 나팔이 되는 것. 실제 반응은 아직 기록되지 않았다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 주사. 직함은 대한민국정부 회의 기록 전령. 전갈을 기록청과 회의장에 동시에 보내고, 암살·매수 소문은 증인 없이 원장에 올리지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 주사. 직함은 대한민국정부 회의 기록 전령. 전갈을 기록청과 회의장에 동시에 보내고, 암살·매수 소문은 증인 없이 원장에 올리지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.fields.담당 업무 | org (1회) | 대한민국정부 회의 기록 전령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0167 | 섭도윤 | $.sections.공무원 직위·직급 | org (1회) | 지방행정사무관(5급)·지방행정주사(6급)·지방행정주사보(7급)·지방행정서기(8급)·지방행정서기보(9급) 중 서울특별시 본부·사업소 보직에 맞는 직급. 담당 업무: 대한민국정부 회의 기록 전령. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0168 | 평예준 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0168 | 평예준 | $.sections.Functional/Livelihood Role | org (1회) | Emergency Authority Return Witness. Not an office, post, or grade in the Government of the Republic of Korea o | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0168 | 평예준 | $.biography | org (2회) | Cannot stand it when unreturned emergency authority is called orthodox legitimacy. The longer the silence, the ／ 반환하지 않은 비상권한을 법통이라고 부르는 말을 참지 못한다. 침묵이 길수록 증언은 짧다.

- 생업: 비상권한 반환 시각·관할 기록
- 지위: 기능·생업 역할(정부 임용 아님)
- 공무원 직위·직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0168 | 평예준 | $.sections.기능·생업 역할 | org (1회) | 비상권한 반환 증인. 대한민국정부 또는 서울특별시 공무원 관직·직위·직급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0169 | 조이록 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0170 | 박태겸 | $.position | org (2회) | Stationmaster of the Transshipment Bureau ／ 환적국 역장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0170 | 박태겸 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.fields.Title | org (1회) | Stationmaster of the Transshipment Bureau | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.sections.Life | org (1회) | Bak Taegyeom, born in 2071, becomes Station Master of the Transshipment Bureau in 2126. Bak worked entangled i | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.sections.Offices | org (1회) | Rank: Station Master. Title: Station Master of the Transshipment Bureau. Trade nickname: Rail Coordinator. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.sections.Relationships | org (1회) | Dispatch with Jang Sehwa. Im Hajun's pump train.

- Affiliation: Transshipment Bureau
- Rank: Station Master
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.biography | org (2회) | **Life.** Bak Taegyeom, born in 2071, becomes Station Master of the Transshipment Bureau in 2126. Bak worked e ／ **생애.** 2071년생인 박태겸은 2126년 환적국 역장을 맡는다. 용산 철도 환적과 주둔지 울타리 용역에 얽혀 일했다. 비상 호송이 열리면 선로가 나라보다 먼저 움직인다. 박태겸은 그 순서를  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.fields.직함 | org (1회) | 환적국 역장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.sections.생애 | org (1회) | 2071년생인 박태겸은 2126년 환적국 역장을 맡는다. 용산 철도 환적과 주둔지 울타리 용역에 얽혀 일했다. 비상 호송이 열리면 선로가 나라보다 먼저 움직인다. 박태겸은 그 순서를 후국회의에 남기 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.sections.관직 | org (1회) | 품계 역장. 직함은 환적국 역장. 생업 별명은 철도조정관. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0170 | 박태겸 | $.sections.관계 | org (1회) | 장세화와 배차. 임하준의 펌프 열차.

- 소속: 환적국
- 품계: 역장
- 직함: 환적국 역장
- 생업: 호송 배차표 관리·공개
- 박태겸의 환적국 역장 업무는 한강로동과 연결된다.

철도조정관  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0171 | 알렉산더 밀러 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0171 | 알렉산더 밀러 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0171 | 알렉산더 밀러 | $.biography | org (2회) | He regards the clan's track as bloodline and treats an adopted heir as a guest. He keeps up appearances of cou ／ 가문의 궤도를 혈통으로 보고 양자를 손님으로 대한다. 겉으로는 예의를 지키지만 배차 거부권만은 절대 놓지 않는다.

- 소속: 환적국
- 품계: 본부장
- 생업: 선로 봉쇄 승인·전환기 통제
- 직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0171 | 알렉산더 밀러 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0172 | 에바 노바코바 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0172 | 에바 노바코바 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0172 | 에바 노바코바 | $.biography | org (2회) | Pragmatic, but harsh on anyone who breaks the timetable. She shows no favoritism to any faction's train as lon ／ 실리적이나 시각표를 어기는 사람을 가혹하게 다룬다. 어느 진영 열차든 시간을 지키면 얼굴을 가리지 않는다.

- 소속: 환적국
- 품계: 주사
- 생업: 열차 탑승 증명·창 점유 배차
- 직함: 열 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0172 | 에바 노바코바 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0173 | 아이작 워커 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0173 | 아이작 워커 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0173 | 아이작 워커 | $.biography | org (2회) | Calm and precise with his hands, but his voice shrinks in front of the clan. He is obsessed with the need to p ／ 침착하고 손끝이 정확하지만 가문 앞에서 목소리가 작아진다. 숙련으로 자리를 증명해야 한다는 강박이 있다.

- 소속: 환적국
- 품계: 주사
- 생업: 선로 정비 일지·제동 점검
- 직함: 선로 도 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0173 | 아이작 워커 | $.relations.incoming[].basis | clergy (1회) | A priest who enforces Isaac Walker's maintenance log on the ground, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0173 | 아이작 워커 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0174 | 루카스 슈나이더 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0174 | 루카스 슈나이더 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0174 | 루카스 슈나이더 | $.biography | org (2회) | Sociable, but he never lets the warehouse keys leave his person. He regards anyone who records an empty box as ／ 사교적이지만 창고 열쇠는 몸에서 떼지 않는다. 빈 상자를 가득 찬 것처럼 적는 사람을 원수로 본다.

- 소속: 환적국
- 품계: 주사
- 생업: 환적창고 온도·재고 검증
- 직함: 환적 배차원
* | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0174 | 루카스 슈나이더 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0175 | 클라라 베넷 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0175 | 클라라 베넷 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0175 | 클라라 베넷 | $.biography | org (2회) | Bold and quick to seize an opportunity. She uses her clan's name as a shield, yet treats the Coordinator's dis ／ 대담하고 기회에 빠르다. 가문의 이름을 방패로 쓰면서도 조정관의 배차표를 빈칸처럼 다룬다.

- 소속: 환적국
- 품계: 주사
- 생업: 가문·공공 화차 배차와 전환기 운영
- 직함: 선로 가문 배 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0175 | 클라라 베넷 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0176 | 미콜라 본다렌코 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=geography:duchy:11170 |
| person-0176 | 미콜라 본다렌코 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0176 | 미콜라 본다렌코 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0176 | 미콜라 본다렌코 | $.biography | org (2회) | Reads the night running distance from brake wear, and pulls apprentices who leave toolbox lids open off the sh ／ 제동 마모로 야간 운행 거리를 읽고, 공구함 뚜껑을 열어 두는 도제를 교대에서 뺀다. 말수는 적고 시운전 소음으로 대답한다.

- 소속: 환적국
- 품계: 영주
- 생업: 출고 전 제동 두께 점검· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0176 | 미콜라 본다렌코 | $.relations.outgoing[].basis | clergy (1회) | A priest who enforces Isaac Walker's maintenance log on the ground, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0176 | 미콜라 본다렌코 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0177 | 나탈리야 소콜로바 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0177 | 나탈리야 소콜로바 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0177 | 나탈리야 소콜로바 | $.biography | org (2회) | She treats anyone who records an empty crate as full as an enemy, and her expression hardens when the temperat ／ 빈 상자를 가득 찬 것처럼 적는 사람을 원수로 보고, 온도가 흔들리면 표정이 굳는다. 창고 열쇠는 몸에서 떼지 않는다.

- 소속: 환적국
- 현재 관직: 미임명
- 생업: 창고 온도·재고 확인과  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0177 | 나탈리야 소콜로바 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0178 | 가브리엘 존슨 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0178 | 가브리엘 존슨 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0178 | 가브리엘 존슨 | $.biography | org (2회) | Treats frostbite from the cold compartments before track burns, and tears up notes demanding that apprentice-d ／ 선로 화상보다 냉동 칸 동상을 먼저 맡고, 도제 숙소 배급을 치료 순서로 바꾸라는 쪽지를 찢는다. 온화하나 소독수가 비면 창 진료를 닫는다.

- 소속: 환적국
- 품계: 주사
- 생업: 환자 명부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0178 | 가브리엘 존슨 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0180 | 소피아 로시 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0180 | 소피아 로시 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0180 | 소피아 로시 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0180 | 소피아 로시 | $.biography | org (1회) | 봉인 끈이 느슨하면 출발을 거부하고, 구두 배차 거부를 원장에 올리지 않는 원로를 위반자로 부른다. 숨이 차도 사본 두 장을 한 손에 쥔다.

- 소속: 환적국
- 품계: 주사
- 생업: 후국회의  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0181 | 패트릭 오코너 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0181 | 패트릭 오코너 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0181 | 패트릭 오코너 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0181 | 패트릭 오코너 | $.biography | org (1회) | 강변 폐선의 수온으로 시간을 읽고, 지도에 없는 측선을 자랑으로 여기지 않는다. 늦은 보고를 죄로 본다.

- 소속: 환적국
- 품계: 주사
- 생업: 폐선 채수·레일 상태 조사
- 직함: 한강 북 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0183 | 마테우시 코발스키 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0183 | 마테우시 코발스키 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0183 | 마테우시 코발스키 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0183 | 마테우시 코발스키 | $.biography | org (1회) | 승강장 습기로 환적인파를 가늠하고, 도제 대기열을 가문 화차 뒤로 미루라는 명령을 모욕으로 듣는다. 온화하나 억류 예고가 뜨면 방송을 직접 잡는다.

- 소속: 환적국
- 품계: 당직장
- 생업:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0184 | 앙드레 뒤부아 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0184 | 앙드레 뒤부아 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0184 | 앙드레 뒤부아 | $.biography | org (2회) | He reads overload from transformer vibration and burns the notes telling him to give up cars to military-suppl ／ 변압기 진동으로 과부하를 읽고, 환적보다 군수 충전에 칸을 내주라는 쪽지를 태운다. 과묵하고 교대 일지를 깎지 않는다.

- 소속: 환적국
- 품계: 당직장
- 생업: 유치선 전력 배분·충전 통제
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0184 | 앙드레 뒤부아 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0186 | 노아 데이비스 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0186 | 노아 데이비스 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0186 | 노아 데이비스 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0186 | 노아 데이비스 | $.biography | org (1회) | 도제 숙소 난로가 꺼지면 진료 순서를 가족 단위로 바꾸고, 효율을 이유로 가문 칸만 건너뛰라는 말을 모욕으로 듣는다. 온화하나 약품 상자의 봉인 끈은 직접 묶는다.

- 소속: 환적국
- 품계: 주 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0187 | 아데올라 아데예미 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0187 | 아데올라 아데예미 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0187 | 아데올라 아데예미 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0187 | 아데올라 아데예미 | $.biography | org (1회) | 연료 냄새에 예민하고 구두 배전을 싫어한다. 냉동 칸보다 가문 연회 조명에 전력을 돌리라는 정치적 압박을 모욕으로 여긴다.

- 소속: 환적국
- 품계: 주사
- 생업: 비상발전 연료·출력 운전
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0188 | 마르틴 호라크 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0188 | 마르틴 호라크 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0188 | 마르틴 호라크 | $.biography | org (2회) | Regards a dispatch table with blanks as deliberate rather than an accident, and leaves two request forms for a ／ 빈칸이 있는 배차표를 사고보다 고의로 보고, 열람을 거절하는 원로에게는 청구서를 두 장 남긴다. 실리적이나 시각을 지우는 손을 가혹하게 다룬다.

- 소속: 환적국
- 품계: 주사
- 생업: 배차  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0188 | 마르틴 호라크 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0189 | 스테판 페트로프 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0189 | 스테판 페트로프 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0189 | 스테판 페트로프 | $.biography | org (2회) | He picks out the scent of oiled paper amid the smell of bandages, and hears an officer's glance telling him to ／ 붕대 냄새 사이에서 기름종이를 알아채고, 본 것을 줄이라는 장교의 눈짓을 모욕으로 듣는다. 온화하나 증언 한 줄은 깎지 않는다.

- 소속: 환적국
- 품계: 주사
- 생업: 의료열차 무기 발견 시 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0189 | 스테판 페트로프 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0190 | 아나 포페스쿠 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0190 | 아나 포페스쿠 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0190 | 아나 포페스쿠 | $.biography | org (2회) | She copies down a note asking for one more day of window occupancy as if it were an accident, and sees the vei ／ 창 점유를 하루 더 달라는 쪽지를 사고처럼 받아 적고, 얼굴을 가린 급수차를 중계의 적으로 본다. 말은 짧고 시각표는 길다.

- 소속: 환적국
- 품계: 주사
- 생업: 급수열차 점유 청구·정차  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0190 | 아나 포페스쿠 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0191 | 필리프 뮐러 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0191 | 필리프 뮐러 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0191 | 필리프 뮐러 | $.biography | org (2회) | If the weight of a pump-parts box differs from the ledger, he swaps out the scale at once, and he still counts ／ 펌프 부품 상자의 무게가 장부와 다르면 즉시 저울을 갈아 끼우고, 임시 협약의 수명이 다한 밤을 아직도 센다. 사교적이나 빈 상자를 가득하다고 적지는 않는다.

- 소속: 환적국
- 품계: 주사
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0191 | 필리프 뮐러 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.position | org (2회) | Transshipment State Conference Train Guide ／ 환적국 회의 열차 안내인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0192 | 엘레나 모로조바 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.fields.Title | org (1회) | Transshipment State Conference Train Guide | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.sections.Life | org (1회) | Born in 2090, Elena Morozova takes up the duties of Transshipment State Conference Train Guide at the opening  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.sections.Offices | org (1회) | Rank: Jusa. Title: Transshipment State Conference Train Guide. She posts the envoy waiting tickets and escort  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.sections.Anecdote | org (1회) | In 2125 she took a fake medicine box from the auction house and sealed it instead of burning it. Because of th | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.characterProfile.traits[].description | org (2회) | 대합실 습기로 사절 인파를 가늠하고, 강국 화차를 환적국 대기열 앞으로 끌어오라는 명령을 모욕으로 듣는다. 온화하나 안내 방송을 남에게 넘기지 않는다. ／ 일화. 2125년 가짜 약 상자를 경매장에서 거둬 화형 대신 봉인했다. 이 일로 환적국 회의 열차 안내인 자리의 서명이 장부에 올랐다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 주사. 직함은 환적국 회의 열차 안내인. 사절 대기표와 호송 칸을 매일 공개하고, 군수 화차는 회의 열차가 떠난 뒤에만 승강장에 붙인다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.fields.직함 | org (1회) | 환적국 회의 열차 안내인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.sections.생애 | org (1회) | 2090년생인 엘레나 모로조바는 2126년 개막기에 환적국 회의 열차 안내인 업무를 맡는다. 제기동 의무소에서 자랐다. 환적국 회의 열차 안내인 업무는 가짜 약 봉인을 계기로 시작됐다. 러시아계 가 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.sections.관직 | org (1회) | 품계 주사. 직함은 환적국 회의 열차 안내인. 사절 대기표와 호송 칸을 매일 공개하고, 군수 화차는 회의 열차가 떠난 뒤에만 승강장에 붙인다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.sections.일화 | org (1회) | 2125년 가짜 약 상자를 경매장에서 거둬 화형 대신 봉인했다. 이 행동을 계기로 환적국 회의 열차 안내인 자리의 서명이 장부에 올랐다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0192 | 엘레나 모로조바 | $.biography | org (1회) | 대합실 습기로 사절 인파를 가늠하고, 강국 화차를 환적국 대기열 앞으로 끌어오라는 명령을 모욕으로 듣는다. 온화하나 안내 방송을 남에게 넘기지 않는다.

- 소속: 환적국
- 품계: 주사
- 생업: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0193 | 올렉산드르 셰우첸코 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0193 | 올렉산드르 셰우첸코 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0193 | 올렉산드르 셰우첸코 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0193 | 올렉산드르 셰우첸코 | $.biography | org (1회) | 제동 마모와 깎인 베어링을 같은 손으로 가늠하고, 가문 구두 지시를 문장으로 다시 받지 않으면 고발을 올리지 않는다. 침착하나 표본을 숨기는 반장을 참지 못한다.

- 소속: 환적국
- 품계: 주사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0194 | 케빈 화이트 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0194 | 케빈 화이트 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0194 | 케빈 화이트 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0194 | 케빈 화이트 | $.biography | org (1회) | 배차표의 빈칸을 먼저 보고, 큰 열차보다 작은 호송이 제시간에 빠지는지를 따진다. 중재석에 앉아도 목소리는 낮게 둔다.

- 소속: 환적국
- 품계: 주사
- 생업: 선로 배차 이의 서면 접수·중재 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.position | org (2회) | Director of the Central Intelligence Agency ／ 중앙정보부 원장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0195 | 오해린 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.fields.Title | org (1회) | Director of the Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.sections.Life | org (1회) | Oh Haerin is the current AI avatar of the Central Intelligence Agency and uses Namsan Tower as her base. The C | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.biography | org (2회) | **Life.** Oh Haerin is the current AI avatar of the Central Intelligence Agency and uses Namsan Tower as her b ／ **생애.** 오해린은 중앙정보부의 현재 AI 아바타이며 남산타워를 거점으로 삼는다. 중앙정보부는 2030년부터 독립된 중립 조직으로 활동했고 AI가 아바타를 바꾸며 계속 조직을 이끌었다. 첩보 조 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.fields.직함 | org (1회) | 중앙정보부 원장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0195 | 오해린 | $.sections.생애 | org (1회) | 오해린은 중앙정보부의 현재 AI 아바타이며 남산타워를 거점으로 삼는다. 중앙정보부는 2030년부터 독립된 중립 조직으로 활동했고 AI가 아바타를 바꾸며 계속 조직을 이끌었다. 첩보 조직이었던 중앙정 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0196 | 조민재 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0196 | 조민재 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0196 | 조민재 | $.biography | org (2회) | Cannot tolerate colleagues who hide losses, and reads the state of a warehouse by smell before numbers. Smiles ／ 손실을 숨기는 동료를 참지 못하고, 숫자보다 냄새로 창고 상태를 먼저 읽는다. 흥정에서는 웃지만 온도계가 흔들리면 표정이 굳는다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 냉동 재고 온도· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0196 | 조민재 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0197 | 윤서하 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0197 | 윤서하 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0197 | 윤서하 | $.biography | org (2회) | Clear-voiced and cruelly fair. If bidders exchange glances, he immediately postpones that item to the next rou ／ 목소리가 맑고 잔인할 만큼 공정하다. 입찰자가 눈짓을 교환하면 즉시 그 품목을 다음 회로 미룬다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 경매 시작가·낙찰가 기록
- 직함: 경매사
**생 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0197 | 윤서하 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0198 | 신태산 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0198 | 신태산 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0198 | 신태산 | $.biography | org (2회) | Taciturn and fiercely loyal. Any crew member who opens cargo during a convoy is removed from the self-defense  ／ 과묵하고 신의가 강하다. 호송 중에 화물을 열어본 대원은 그날로 자경대에서 뺀다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 호송 경로·도착 중량 대조
- 직함: 호송 반장
**생애.** 2 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0198 | 신태산 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0199 | 서나연 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0199 | 서나연 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0199 | 서나연 | $.biography | org (2회) | Meticulous and seemingly stingy, but releases ice first to sick children. Says credit melts before temperature ／ 꼼꼼하고 인색해 보이지만 병든 아이에게는 얼음을 먼저 푼다. 온도보다 신용이 먼저 녹는다고 말한다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 얼음 벽돌 무게·제작 시각 각인
- 직함: 얼음 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0199 | 서나연 | $.relations.incoming[].basis | clergy (1회) | is a priest who backs Seo Nayeon's brick engraving in the field, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0199 | 서나연 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0200 | 피터 얀센 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0200 | 피터 얀센 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0200 | 피터 얀센 | $.biography | org (2회) | Hides his expressions well and moves votes around like goods. Holds those who push losses off until later in t ／ 표정을 잘 숨기고 표를 물건처럼 옮긴다. 손실을 나중으로 미루는 사람을 가장 경멸한다.

- 소속: 중앙정보부
- 품계: 수석기사
- 생업: 출항 연료·얼음 잔량 공개
- 직함: 운송선주 평의
** | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0200 | 피터 얀센 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0201 | 지윤재 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0201 | 지윤재 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0201 | 지윤재 | $.biography | org (2회) | Reads the ice-making cycle from compressor vibration and removes from the shift any assistant who sets tools d ／ 압축기 진동으로 제빙 주기를 읽고, 공구를 얼음 위에 두는 조수를 교대에서 뺀다. 말수는 적고 시운전 소음으로 대답한다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 제빙기 압축 온도·부품 점 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0201 | 지윤재 | $.relations.outgoing[].basis | clergy (1회) | is a priest who backs Seo Nayeon's brick engraving in the field, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0201 | 지윤재 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0208 | 설초아 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0208 | 설초아 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0208 | 설초아 | $.biography | org (2회) | Gauges the auction crowd by platform humidity, and takes the order to push the convoy queue behind the munitio ／ 승강장 습기로 경매 인파를 가늠하고, 호송 대기열을 군수 화차 뒤로 미루라는 명령을 모욕으로 듣는다. 온화하나 정전 예고가 뜨면 방송을 직접 잡는다.

- 소속: 중앙정보부
- 품계: 기사
- 생업 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0208 | 설초아 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0209 | 지마루 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0209 | 지마루 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0209 | 지마루 | $.biography | org (2회) | Reads overload from compressor vibration and burns the notes telling them to give up slots to military ration  ／ 압축기 진동으로 과부하를 읽고, 시민 얼음보다 군량 충전에 칸을 내주라는 쪽지를 태운다. 과묵하고 교대 일지를 깎지 않는다.

- 소속: 중앙정보부
- 품계: 기사
- 생업: 냉동기지 전력 배분·충 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0209 | 지마루 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0211 | 연은재 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0211 | 연은재 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0211 | 연은재 | $.biography | org (2회) | When the pier taps run dry, switches the treatment order to family units, and takes the suggestion to skip onl ／ 부두 수도꼭지가 마르면 진료 순서를 가족 단위로 바꾸고, 효율을 이유로 선주 칸만 건너뛰라는 말을 모욕으로 듣는다. 온화하나 약품 상자의 봉인 끈은 직접 묶는다.

- 소속: 중앙정보부
- 품계:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0211 | 연은재 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0212 | 나루희 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0212 | 나루희 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0212 | 나루희 | $.biography | org (2회) | Sensitive to the smell of fuel and hates verbal power allocation. Takes the political pressure to divert power ／ 연료 냄새에 예민하고 구두 배전을 싫어한다. 제빙기보다 경매 조명에 전력을 돌리라는 정치적 압박을 모욕으로 여긴다.

- 소속: 중앙정보부
- 품계: 기사
- 생업: 제빙 비상발전 연료·출력 기록
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0212 | 나루희 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0213 | 섭다은 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0213 | 섭다은 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0213 | 섭다은 | $.biography | org (2회) | Smells the thawed stock before reading the numbers, and despises colleagues who want to leave the night the th ／ 녹은 재고의 냄새를 숫자보다 먼저 맡고, 온도계가 흔들린 밤을 사고에서 빼자는 동료를 경멸한다. 흥정에서는 웃지 않는다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 냉동고 사고 온도·중량 증 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0213 | 섭다은 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0214 | 평서아 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0214 | 평서아 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0214 | 평서아 | $.biography | org (2회) | Sniffs the medicine before opening a winning-bid envelope and cannot forget the morning of accepting, at a hig ／ 낙찰 봉투를 열기 전에 약 냄새를 맡고, 봉인만 번지르르한 상자를 고가에 받은 아침을 잊지 못한다. 목소리가 갈라져도 시작가는 다시 묻는다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 약품  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0214 | 평서아 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0215 | 단노을 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0215 | 단노을 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0215 | 단노을 | $.biography | org (2회) | Reads unauthorized unloading from the sound of dock ropes and measures the footsteps that move cars overnight, ／ 부두 밧줄 소리로 무단 하역을 읽고, 밤사이에 칸을 옮기는 발소리를 재고 공개보다 정직하다고 본다. 신의가 강해 본 시각을 줄이지 않는다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 야간 재 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0215 | 단노을 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0217 | 홍지훈 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0217 | 홍지훈 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0217 | 홍지훈 | $.biography | org (2회) | Reads the empty crates on mornings when water prices jump before the rumors of a poor harvest, and removes fro ／ 물값이 뛰는 아침의 빈 상자를 흉작 소문보다 먼저 읽고, 눈짓으로 낙찰을 바꾸는 입찰자를 자리에서 뺀다. 계산은 빠르고 잔인할 만큼 공정하다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 급수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0217 | 홍지훈 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0218 | 추보람 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0218 | 추보람 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0218 | 추보람 | $.biography | org (2회) | Halts shipowners who hide their fuel and ice remainders before departure, before they go bankrupt, and drops t ／ 출항 전 연료와 얼음 잔량을 숨기는 선주를 파산보다 먼저 멈추고, 표를 물건처럼 옮기는 버릇은 회의 호송에서만 접는다. 손실을 나중으로 미루는 사람을 경멸한다.

- 소속: 중앙정보부
- 품계: 교 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0218 | 추보람 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0219 | 어도윤 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0219 | 어도윤 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0219 | 어도윤 | $.biography | org (2회) | Remembers the first year, when water and parts were scattered across different districts, as if weighing it on ／ 물과 부품이 서로 다른 권역에 흩어지던 첫해를 저울처럼 기억하고, 임시 협약을 영원한 권리라고 부르는 젊은 상인을 고쳐 준다. 말수는 적고 날짜는 정확하다.

- 소속: 중앙정보부
- 품계: 교도
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0219 | 어도윤 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.position | org (2회) | Yeouido Investment Federation Chairperson ／ 여의도출자연합회 의장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0220 | 최지우 | $.confirmedHoldings[].name.ko | org (2회) | Yeongdeungpo-gu Yeouido Investment Alliance Ducal Directly Held Territory ／ 영등포구 여의도출자연합회 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.openingTitles[].name | org (2회) | Yeongdeungpo-gu Yeouido Investment Federation Duchy ／ 영등포구 여의도출자연합회 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.sections.Offices | org (1회) | Rank: Chair. Title: Chair of the Yeouido Investment Federation. Livelihood: chair elected by the council of in | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.biography | org (2회) | Chair of the Yeouido Investment Federation. A person who believes the voice is faster than the endorsement.

* ／ 여의도출자연합회 의장. 목소리가 인준보다 빠르다고 믿는 사람.

**생애.** 2126년 세대. 여의대로 24 여의도 회관 송신 당직의 손. 회관의 비상위원회가 계열 출자 장부를 냉각·키 당직으로  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.characterProfile.narrative | org (1회) | 출자 가문 평의회가 뽑은 여의도출자연합회 의장이다. 행렬이 내려오기 전 속보를 자르고 명부 칸만 송신했다. 빠른 목소리의 정치적 효력과 검증 사이에서 움직이며 국가 인준권을 가진 것은 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0220 | 최지우 | $.sections.관직 | org (1회) | 품계 의장. 직함은 여의도출자연합회 의장. 생업은 출자 가문 평의회가 뽑은 의장. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0221 | 권미래 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0221 | 권미래 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0221 | 권미래 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0221 | 권미래 | $.biography | org (1회) | 밤샘을 두려워하지 않고 금고 전원의 끊김을 인격 모욕으로 느낀다. 기계를 사람보다 정직하다고 말한다.

- 생업: 금고 예비 전원 점검·배분
- 소속: 여의도출자연합회
- 품계: 평의원
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0222 | 황은설 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0222 | 황은설 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0222 | 황은설 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0222 | 황은설 | $.biography | org (1회) | 회의적이고 문장을 두 번 읽는다. 사람을 살릴 때의 침묵과 사실을 공개할 의무 사이에서 손이 멈춘다.

- 생업: 화폐 각인 감정·보류 기록
- 소속: 여의도출자연합회
- 품계: 평의원
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0223 | 송재민 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0223 | 송재민 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0223 | 송재민 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0223 | 송재민 | $.biography | org (1회) | 말이 없고 열쇠를 몸에서 떼지 않는다. 호기심보다 누설을 더 큰 죄로 본다.

- 생업: 금고 키 분할·보관 기록
- 소속: 여의도출자연합회
- 품계: 평의원
- 직함: 금고 키 기록원
**생애.* | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0224 | 오하늘 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0224 | 오하늘 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0224 | 오하늘 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0224 | 오하늘 | $.biography | org (1회) | 사교적이고 발언 시간을 나누는 데 가혹하다. 한 출자 가문이 너무 오래 말하면 발언을 그 자리에서 끊는다.

- 생업: 평의회 발언 순번·시세 정정 기록
- 소속: 여의도출자연합회
- 품계: 평의원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0225 | 조은우 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0225 | 조은우 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0225 | 조은우 | $.biography | org (2회) | Blunt and quick to pick up rumors. When he finds the source of counterfeit currency, he blockades people befor ／ 직선적이고 소문에 빠르다. 위조 화폐의 출처를 찾으면 도구보다 사람을 먼저 봉쇄한다.

- 생업: 위조 화폐 추적 로그·금고 접근 확인
- 소속: 여의도출자연합회
- 품계: 서기
- 직함: 위조 화 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0225 | 조은우 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0226 | 두봉 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0226 | 두봉 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0226 | 두봉 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0226 | 두봉 | $.biography | org (1회) | 밤이 깊을수록 손이 정확해지고, 예비 전원의 잡음을 사람 말보다 먼저 듣는다. 대충 감은 선을 보면 그날 일을 처음부터 다시 한다.

- 생업: 금고 예비 전원 정비·순환 시험
- 소속: 여의도출자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0227 | 모봉용 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0227 | 모봉용 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0227 | 모봉용 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0227 | 모봉용 | $.biography | org (1회) | 무게를 속이는 장부를 보면 웃음을 거두고, 약속한 시각에 전선이 안 오면 계약을 그 자리에서 찢는다. 소문보다 송장 숫자를 믿는다.

- 생업: 보증 부품 입고 중량·출고 검증
- 소속: 여의도출자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0228 | 봉소 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0228 | 봉소 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0228 | 봉소 | $.biography | org (2회) | Checks the hand tremor of the night-working technician first, and refuses to write nationality on medicine env ／ 밤샘하는 기사의 손떨림을 먼저 보고, 약 봉투에 국적을 적는 일을 거부한다. 침묵으로 환자를 살릴 때는 감정 요청도 미룬다.

- 생업: 금고 당직 진료·각성제 사용 기록
- 소속: 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0228 | 봉소 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0230 | 소감 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0230 | 소감 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0230 | 소감 | $.biography | org (2회) | Remembers time down to the minute, and when an investment family overruns its speaking time, shoves a note in  ／ 시간을 분 단위로 기억하고, 한 출자 가문이 발언 시간을 넘기면 쪽지를 의장 앞에 밀어 넣는다. 구두 약속은 전령 원장에 옮기기 전에 믿지 않는다.

- 생업: 평의회 순번 통지·증언 이송
- 소속 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0230 | 소감 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0232 | 국두봉 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0232 | 국두봉 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0232 | 국두봉 | $.biography | org (2회) | Reads a sentence twice and lifts the seal only on the third reading. When the silence needed to save a person  ／ 문장을 두 번 읽고 세 번째에야 도장을 든다. 사람을 살릴 때의 침묵과 사실을 남길 의무가 충돌하면 손을 멈춘 채 원장을 덮는다.

- 생업: 화폐 감정 증언 대조·필사
- 소속: 여의도출자연합회
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0232 | 국두봉 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0233 | 감봉 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0233 | 감봉 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0233 | 감봉 | $.biography | org (2회) | He treats the area beneath the vault as home, and he calls those who break the duty rotation by the hour inste ／ 금고 아래를 집처럼 여기고, 당직 교대를 어기는 사람을 이름 대신 시각으로 부른다. 바람이 심하면 창구를 줄이라고 먼저 말한다.

- 생업: 금고 당직 교대·풍속 기록
- 소속: 여의도출자연합회
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0233 | 감봉 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0234 | 두용 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0234 | 두용 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0234 | 두용 | $.biography | org (2회) | He is silent and never lets the key leave his body. He regards opening a box out of curiosity as the same crim ／ 말이 없고 열쇠를 몸에서 떼지 않는다. 호기심으로 함을 여는 일을 누설과 같은 죄로 본다.

- 생업: 금고 키 함 분할·개함 확인
- 소속: 여의도출자연합회
- 품계: 서기
- 직함: 여의도 금고 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0234 | 두용 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=geography:duchy:11410 |
| person-0235 | 모국 | $.confirmedHoldings[].name.ko | org (2회) | Seodaemun District Yeouido Investment Federation Workshop Domain Direct Holdings ／ 서대문구 여의도출자연합회 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.openingTitles[].name | org (2회) | Seodaemun-gu Yeouido Investment Federation Duchy ／ 서대문구 여의도출자연합회 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.sections.Offices | org (1회) | Rank: Lord. Title: Exchange Records Clerk · Lord of Seodaemun-gu. Posts the exchange log and the passage ledge | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.biography | org (2회) | Cannot tolerate blanks in the exchange ledger, and holds merchants who are merely passing through in the excha ／ 환전 장부의 빈칸을 참지 못하고, 통과만 하는 상인을 환전 원장에 오래 붙잡아 둔다. 좌표 없는 소문은 지점 밖으로 내보내지 않는다.

- 생업: 영등포동 생활 화물 인계의 환전 로그·통행 명부 기 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0235 | 모국 | $.sections.관직 | org (1회) | 품계 영주. 직함은 환전 기록 담당 서기 · 서대문구 영주. 환전 로그와 통행 명부를 같은 벽에 붙이고, 단독 정정 시세는 다음 날 같은 길이에 반대 의견을 붙인다. 서대문구 여의도출자연합회 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0236 | 봉용 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=geography:duchy:11440 |
| person-0236 | 봉용 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0236 | 봉용 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0236 | 봉용 | $.biography | org (2회) | Sociable, but turns harsh at blanks on the chalkboard. When one investment clan speaks too long, snaps the cha ／ 사교적이나 칠판의 빈칸을 보면 가혹해진다. 한 출자 가문이 너무 오래 말하면 분필을 꺾어 발언을 끊는다.

- 생업: 평의회 발언 시간 칠판·순번 관리
- 소속: 여의도출자연합회
- 품계: 영주
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0236 | 봉용 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0237 | 용소 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0237 | 용소 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0237 | 용소 | $.biography | org (2회) | Remembers the weight of the key fragments in the fingers and regards curiosity about decryption as a sin. Keep ／ 열쇠 조각의 무게를 손가락으로 기억하고, 해독 호기심을 죄로 본다. 중계 부스 안의 침묵을 암호보다 중히 지킨다.

- 생업: 금고 키 중계 부스 봉인·조각 배분
- 소속: 여의도출자연합회
- 품계 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0237 | 용소 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0238 | 란세온 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0238 | 란세온 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0238 | 란세온 | $.biography | org (2회) | Listens to counterfeit engravings before people's words, and tries to tell with the same hand when silence sav ／ 위조 각인을 사람 말보다 먼저 듣고, 침묵으로 사람을 살릴 때와 사실을 덮을 때를 같은 손으로 가르려 한다. 회의적이고 문장을 두 번 읽는다.

- 생업: 위조 화폐 내부 기록·증언 교차
- 소속: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0238 | 란세온 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0239 | 섭달호 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0239 | 섭달호 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0239 | 섭달호 | $.biography | org (2회) | He remembers the weight of the original case in his fingers, and never puts a note telling someone to decipher ／ 원본 함의 무게를 손가락으로 기억하고, 구두로 해독하라는 쪽지를 가방에 넣지 않는다. 숨이 차도 사본은 두 장이다.

- 생업: 장부 원본 함·열쇠 조각 이송
- 소속: 여의도출자연합회
- 품계:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0239 | 섭달호 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0240 | 평지우 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0240 | 평지우 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0240 | 평지우 | $.biography | org (2회) | He hears the noise of the all-night duty as a blank, and when two record entries are empty he stands a person  ／ 밤샘 당직의 잡음을 빈 칸으로 듣고, 기록 두 칸이 비면 사람을 먼저 세운다. 장부를 정직하다고 말하면서도 빈칸은 믿지 않는다.

- 생업: 금고 당직 명부·기록 시각 대조
- 소속: 여의도출자연합 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0240 | 평지우 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0241 | 단보람 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0241 | 단보람 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0241 | 단보람 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0241 | 단보람 | $.biography | org (1회) | 한 출자 가문이 너무 오래 침묵하면 발언을 그 자리에서 끊고, 지연 공개를 안정이라고 부르는 쪽지를 칠판에서 가로지른다. 사교적이나 시간에 가혹하다.

- 생업: 평의회 보류 사유 게시·공개 순번  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0242 | 순한결 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0242 | 순한결 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0242 | 순한결 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0242 | 순한결 | $.biography | org (1회) | 환전 장부의 빈칸을 참지 못하고, 가족 숫자를 병력으로 셈하는 시세를 지점 밖으로 내보내지 않는다. 좌표 없는 소문은 입에도 올리지 않는다.

- 생업: 환전 기록·통행 명부 대조
- 소속: 여의도 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0243 | 홍우찬 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0243 | 홍우찬 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0243 | 홍우찬 | $.biography | org (2회) | Points to counterfeit engravings faster than rumors spread, and when he sees an unauthorized approacher, he pu ／ 위조 각인을 소문보다 빨리 가리키고, 무단 접근자를 보면 공구함보다 사람을 먼저 세운다. 직선적이고 보고 전에 길을 막는다.

- 생업: 위조 화폐 원점 지도·순찰 시각 기록
- 소속: 여의도출자연 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0243 | 홍우찬 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0244 | 추우찬 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0244 | 추우찬 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0244 | 추우찬 | $.biography | org (2회) | Reads a sentence twice and picks up the seal only on the third time. When the silence needed to save a person  ／ 문장을 두 번 읽고 세 번째에야 도장을 든다. 사람을 살릴 때의 침묵과 사실을 남길 의무가 충돌하면 손을 멈춘 채 원장을 덮는다.

- 생업: 평의회 발언 필사·증언 대조
- 소속: 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0244 | 추우찬 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0245 | 류해담 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0245 | 류해담 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0245 | 류해담 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0245 | 류해담 | $.biography | org (1회) | 소문을 문장 단위로 자르고, 출처가 없는 문장은 난외에만 남긴다. 시세를 올리기 전에 한 번 더 읽는다.

- 생업: 시세 소문 출처 확인·교차 검증 원고
- 소속: 여의도출자연합회
- 품계: 서기 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.position | org (2회) | Abbot of Anguk Grand Monastery ／ 안국총림 방장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0246 | 백온 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.fields.Title | org (1회) | Abbot of Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.proseContacts[].basis | org (1회) | 주요 관계: 안국총림 방장 백온과 협력. 뚝섬 기동 정비조와 숙소 계약 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.openingTitles[].basis | org (1회) | 2026-10-22 영토 작위 배분(owner:seoul-faction-consolidation-20261022). 안국총림 방장. 북서 왕국 세 자치구 가운데 은평·서대문 공작령 보유 근거. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.fields.직함 | org (1회) | 안국총림 방장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.sections.생애 | org (1회) | 2102-10-04 출생, 2126년 개막에 활동했다. 피난 명부의 손. 안국총림은 장경종(이하 '장경종'이라 한다)의 본산이고 수도는 안국역이다. 조계사·총무원 종로구 우정국로 55가 대정전 뒤에 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.sections.관직 | org (1회) | 품계 방장. 직함은 안국총림 방장. 생업 별명은 명부 필사. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.sections.관계 | org (1회) | 강민서와 시민권. 한재목의 집단 단수에 원한.

- 생업: 명부 필사
- 소속: 안국총림
- 품계: 방장
- 직함: 안국총림 방장
- 백온의 명부 필사 업무 기준점으로 종로1·2·3·4가동을 제안한 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0246 | 백온 | $.biography | org (1회) | **생애.** 2102-10-04 출생, 2126년 개막에 활동했다. 피난 명부의 손. 안국총림은 장경종(이하 '장경종'이라 한다)의 본산이고 수도는 안국역이다. 조계사·총무원 종로구 우정국로 55 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0247 | 신보람 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0247 | 신보람 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0247 | 신보람 | $.biography | org (2회) | Merciful, but the voice turns sharp toward officials who alter the register. Has torn up a ledger that left ou ／ 자비롭지만 명부를 고치는 관리에게는 목소리가 날카로워진다. 아이 이름을 빼먹은 장부를 찢어본 적이 있다.

- 생업: 신도 명부 대조·배급 확인
- 소속: 안국총림
- 품계: 주지
- 직함: 신도  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0247 | 신보람 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0248 | 황세린 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0248 | 황세린 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0248 | 황세린 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0248 | 황세린 | $.biography | org (1회) | 공정하려고 애쓰지만 숨긴 식량을 보면 손이 먼저 나간다. 숫자와 배고픔을 같은 저울에 올린다.

- 생업: 배급 저울·잔량 공개
- 소속: 안국총림
- 품계: 주지
- 직함: 배급 저울 주지
**생 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0249 | 강태산 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0249 | 강태산 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0249 | 강태산 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0249 | 강태산 | $.biography | org (1회) | 과묵하고 지형을 사람 얼굴처럼 기억한다. 가족을 갈라놓는 명령을 거부한다.

- 생업: 회랑 정찰 보고·통행 확인
- 소속: 안국총림
- 품계: 주지
- 직함: 회랑 정찰 주지
**생애.** 207 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0250 | 윤초아 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0250 | 윤초아 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0250 | 윤초아 | $.sections.Ambition | org (1회) | Align the believers' register ledger with the Seoul Station endorsement and the Standards League's recovery-se | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0250 | 윤초아 | $.biography | org (2회) | Warm, but cold when it comes to signatures. Verbal relief pledges are treated as if they never happened unless ／ 따뜻하나 서명은 차갑다. 구두 구호 약속을 장부에 옮기지 않으면 없던 일로 돌린다.

- 생업: 문중 표 결과·구호 물자 출처 기록
- 소속: 안국총림
- 품계: 주지
- 직함: 장경 필사 주지
* | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0250 | 윤초아 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0250 | 윤초아 | $.sections.야망 | org (1회) | 신도 명부 원장을 서울역 인준과 규격맹의 복구복무 명부와 맞춰 이중 호적을 없앤다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0251 | 오한결 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0251 | 오한결 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0251 | 오한결 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0251 | 오한결 | $.biography | org (1회) | 충성스러우나 배고픈 대원의 손을 막지 못할 때가 있다. 맹세와 생존이 충돌하면 오래 침묵한다.

- 생업: 배급·무장 근무 분리·창고 열쇠 관리
- 소속: 안국총림
- 품계: 주지
- 직함: 배급  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0252 | 두감 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0252 | 두감 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0252 | 두감 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0252 | 두감 | $.biography | org (1회) | 찬 재를 보면 말이 줄고, 연통을 막은 사람을 연통부터 열게 하고 책임을 묻는다. 고장난 난로를 하룻밤 넘기는 일을 맹세 위반으로 본다.

- 생업: 난로·연통 점검표 관리
- 소속: 안국총림
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0253 | 모봉 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0253 | 모봉 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0253 | 모봉 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0253 | 모봉 | $.biography | org (1회) | 짐의 무게와 아이의 이름을 같은 장부에 적고, 통행 안내를 보호비로 바꾸는 상인을 경멸한다. 눈이 오면 경로를 자랑하지 않고 표시만 고친다.

- 생업: 짐 출처 장부·통행 표 확인
- 소속: 안국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0254 | 봉감 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0254 | 봉감 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0254 | 봉감 | $.biography | org (2회) | Looks at fever first and affiliation afterward. At a whiff of fake medicine, halts the ration line and opens t ／ 열을 먼저 보고 소속을 나중에 본다. 가짜 약 냄새가 나면 배급 줄을 멈추고 상자를 연다.

- 생업: 약초 투약 명부·봉인 검사
- 소속: 안국총림
- 품계: 주지
- 직함: 약초 의무 주지
** | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0254 | 봉감 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0255 | 용국 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0255 | 용국 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0255 | 용국 | $.biography | org (2회) | Remembers terrain like a person's face and refuses orders that split families. If the torches fall out of step ／ 지형을 사람 얼굴처럼 기억하고, 가족을 갈라놓는 명령을 거부한다. 횃불이 어긋나면 보고보다 길을 먼저 막는다.

- 생업: 회랑 순찰 보고·신도 표 확인
- 소속: 안국총림
- 품계: 주지
- 직함 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0255 | 용국 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0256 | 소두 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0256 | 소두 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0256 | 소두 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0256 | 소두 | $.biography | org (1회) | 아이 이름을 빼먹은 쪽지를 찢어 본 적이 있고, 구두 구호 약속을 전령 원장에 옮기지 않으면 없던 일로 돌린다. 따뜻하나 서명은 차갑다.

- 생업: 총회 전령·명부 대조
- 소속: 안국총림
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0257 | 복모 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0257 | 복모 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0257 | 복모 | $.biography | org (2회) | On seeing a closed mountain path, fixes the marking first, and refuses to erase encampments that are not on th ／ 닫힌 산길을 보면 표시부터 고치고, 지도에 없는 숙영을 지우는 일을 거부한다. 눈보라 뒤의 발자국을 사람 수로 세지 않는다.

- 생업: 우회로 실측·고지 좌표 관리
- 소속: 안국총림
- 품계:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0257 | 복모 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0258 | 국봉 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0258 | 국봉 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0258 | 국봉 | $.biography | org (2회) | If an oral promise is not transferred into the ledger, it is treated as though it never happened, and on seein ／ 구두 약속을 장부에 옮기지 않으면 없던 일로 돌리고, 이중 호적 한 줄을 보면 필사를 멈춘다. 아이 이름을 숫자로 줄이는 기호를 쓰지 않는다.

- 생업: 문중 표 결과·구호 물자 출처 기록
- 소 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0258 | 국봉 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0259 | 감용 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0259 | 감용 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0259 | 감용 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0259 | 감용 | $.biography | org (2회) | The hand that mends tent cords is the same as the mouth that reads the roster, and it refuses the demand to fi ／ 텐트 줄을 고치는 손과 명부를 읽는 입이 같고, 빈 자리를 임의의 이름으로 메우라는 말을 거부한다. 아이들이 잠든 뒤에는 불빛부터 줄인다.

- 생업: 숙영 명부·출입 확인
- 소속: 안국총림
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0259 | 감용 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0260 | 두소 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0260 | 두소 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0260 | 두소 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0260 | 두소 | $.biography | org (2회) | Divides the road with words rather than the blade that whittles milestones, and sends down from the road anyon ／ 이정표를 깎는 칼보다 말로 길을 나누고, 보호비를 안내료로 바꾸는 사람을 길에서 내려보낸다. 눈 덮인 표지는 자랑하지 않고 손으로 닦는다.

- 생업: 통행 시각·신도 표 게시
- 소속: 안국총림
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0260 | 두소 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0261 | 모감 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0261 | 모감 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0261 | 모감 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0261 | 모감 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0261 | 모감 | $.biography | org (1회) | 습기를 사람 열보다 예민하게 읽고, 말리지 않은 뿌리를 상자 깊숙이 숨기는 손을 가혹하게 다룬다. 약 냄새와 가짜 봉인을 같은 코로 가른다.

- 생업: 약초 건조 중량·봉인 검사
- 소속: 안국총 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0262 | 봉두 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0262 | 봉두 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0262 | 봉두 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0262 | 봉두 | $.confirmedHoldings[].name.ko | org (1회) | 서대문구 안국총림 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0262 | 봉두 | $.openingTitles[].name | org (1회) | 서대문구 안국총림 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0262 | 봉두 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0262 | 봉두 | $.biography | org (1회) | 과묵하고 횃불 간격을 사람 숨처럼 센다. 고지를 병영으로 쓰자는 속삭임을 숙영을 위협하는 배신으로 듣는다.

- 생업: 고지 횃불 교대·접근 기록
- 소속: 안국총림
- 품계: 수좌
- 직함: 고지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0263 | 용두 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0263 | 용두 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0263 | 용두 | $.biography | org (2회) | Sometimes cannot stop the hands of loyal but hungry troops, so reads the scale twice. When oath and survival c ／ 충성스러우나 배고픈 대원의 손을 막지 못할 때가 있어 저울을 두 번 본다. 맹세와 생존이 충돌하면 열쇠를 몸에서 떼지 않는다.

- 생업: 연료 출고 분리·야간 열쇠 관리
- 소속: 안국총림
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0263 | 용두 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0264 | 어하은 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0264 | 어하은 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0264 | 어하은 | $.biography | org (2회) | Their voice sharpens at a ledger that has dropped a child's name, and they stop any official who would fill a  ／ 아이 이름을 빼먹은 장부를 보면 목소리가 날카로워지고, 빠진 줄을 숫자로 메우라는 관리를 자리에서 세운다. 자비롭지만 명부 앞에서는 차갑다.

- 생업: 신도 명부 누락 조사·배급 확인
- 소속:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0264 | 어하은 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0265 | 란민준 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0265 | 란민준 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0265 | 란민준 | $.biography | org (2회) | Before an officer who calls family-unit service registration "stability," falls silent for a long time, then f ／ 가족 단위 복무등록을 안정이라고 부르는 장교 앞에서 오래 침묵한 뒤, 서명란을 접어 돌려준다. 따뜻하나 서명은 차갑다.

- 생업: 복무계약 서명 확인·문중 표 게시
- 소속: 안국총림
- 품계:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0265 | 란민준 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0268 | 단유진 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0268 | 단유진 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0268 | 단유진 | $.biography | org (2회) | If an oral relief promise is not transcribed into the courier ledger, treats it as never made, and does not us ／ 구두 구호 약속을 전령 원장에 옮기지 않으면 없던 일로 돌리고, 아이 이름을 숫자로 줄이는 기호를 쓰지 않는다. 따뜻하나 회의 쪽지는 차갑다.

- 생업: 협의 문안·문중 표 결과 게시
- 소속:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0268 | 단유진 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0269 | 순지민 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0269 | 순지민 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0269 | 순지민 | $.biography | org (2회) | When oath and survival collide, falls silent for a long time and then steps one pace out of the procession. Be ／ 맹세와 생존이 충돌하면 오래 침묵한 뒤 행렬에서 한 걸음 빠진다. 충성스러우나 가족을 갈라놓는 철표 앞에서는 침묵을 깬다.

- 생업: 강제등록 이탈 기록·교대 분리 증언
- 소속: 안국총림
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0269 | 순지민 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0270 | 홍은서 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0270 | 홍은서 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0270 | 홍은서 | $.biography | org (2회) | Cannot forget the winter just after the founding when relief boxes were being turned into rank-and-title colum ／ 창건 직후 구호 상자가 관작 칸으로 바뀌던 겨울을 잊지 못하고, 빈 자리를 임의의 이름으로 메우라는 말을 거부한다. 아이들이 잠든 뒤에는 불빛부터 줄인다.

- 생업: 구호 배급표·보상 사본 대조
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0270 | 홍은서 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0271 | 윤산호 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0271 | 윤산호 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0271 | 윤산호 | $.biography | org (2회) | Checks the evacuation-route signposts with a flashlight and, instead of rewriting erased letters, attaches a n ／ 피난로 이정표를 손전등으로 확인하고, 지워진 글자는 새로 쓰지 않고 옆에 붙인다. 큰 약속은 하지 않는다.

- 생업: 피난로 이정표·증서 대기열 안내
- 소속: 안국총림
- 품계: 주지
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0271 | 윤산호 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.position | org (2회) | Chairman of Seongha Group, Hereditary Position of the Yi Family ／ 성하그룹 회장, 이씨 가문 세습 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.occupation | org (2회) | Seongha Electronics Elder ／ 성하전자 원로 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0272 | 이홍원 | $.fields.Livelihood | org (1회) | Seongha Electronics Elder | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.fields.Title | org (1회) | Chairman of Seongha Group, Hereditary Position of the Yi Family | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.sections.Life | org (1회) | Gangnam Station, Seongha Electronics computer room. The test wheelset of Sinjeong Wheelway belongs to Yu Sejin | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.sections.Offices | org (1회) | Rank: Chairman. Title: Chairman of Seongha Group, hereditary in the Yi clan. Livelihood alias: Seongha Electro | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.sections.Relationships | org (1회) | Bak Taegyeom and wheelsets. Gang Minseo and standards. Bae Ujin and the barrier gate.

- Livelihood: Seongha E | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.biography | org (2회) | **Life.** Gangnam Station, Seongha Electronics computer room. The test wheelset of Sinjeong Wheelway belongs t ／ **생애.** 강남역 성하전자 전산실. 신정차륜가의 시험 차륜은 유세진의 것이다. 이홍원이 회장이 된 것은 강남역 차단문과 강남역 당직함을 끊기지 않게 지킨 뒤였다. 성하그룹의 수도는 강남역이고 회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.fields.생업 | org (1회) | 성하전자 원로 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.fields.직함 | org (1회) | 성하그룹 회장, 이씨 가문 세습 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.sections.생애 | org (1회) | 강남역 성하전자 전산실. 신정차륜가의 시험 차륜은 유세진의 것이다. 이홍원이 회장이 된 것은 강남역 차단문과 강남역 당직함을 끊기지 않게 지킨 뒤였다. 성하그룹의 수도는 강남역이고 회장직은 이씨 가 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.sections.관직 | org (1회) | 품계 회장. 직함은 성하그룹 회장, 이씨 가문 세습. 생업 별명은 성하전자 원로. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0272 | 이홍원 | $.sections.관계 | org (1회) | 박태겸과 차륜. 강민서와 규격. 배우진과 차단문.

- 생업: 성하전자 원로
- 소속: 성하그룹
- 품계: 회장
- 직함: 성하그룹 회장, 이씨 가문 세습
- 이홍원은 서초4동에서 성하전자 원로 업 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.position | org (2회) | Seongha Electronics Vehicle Maintenance Apprentice ／ 성하전자 차량 정비 도제 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0273 | 송하율 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.fields.Title | org (1회) | Seongha Electronics Vehicle Maintenance Apprentice | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.sections.Life | org (1회) | Grew up at the Gangnam Station rail depot. The Seongha Electronics vehicle maintenance apprentice post opened  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.sections.Offices | org (1회) | Rank: Staff Member. Title: Seongha Electronics Vehicle Maintenance Apprentice. Posts maintenance logs directly | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.biography | org (2회) | Quick with the hands and sparing with words. Does not boast about exam scores but cannot tolerate someone siph ／ 손이 빠르고 말이 적다. 시험 점수를 자랑하지 않지만 남의 공구를 빼돌리는 일은 참지 못한다.

- 생업: 차량 정비 일지·불량 부품 표본 관리
- 소속: 성하그룹
- 품계: 사원
- 직함: 성하전 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.characterProfile.traits[].behavior | org (2회) | 정비 일지를 성하전자 작업 반장이 아닌 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. ／ 관직. 품계 사원. 직함은 성하전자 차량 정비 도제. 정비 일지를 성하전자 작업 반장이 아닌 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.fields.직함 | org (1회) | 성하전자 차량 정비 도제 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.sections.생애 | org (1회) | 강남역 차량기지에서 자랐다. 성하전자 차량 정비 도제 자리는 탈선 직전 결함 보고로 열렸다.
- 송하율은 서초4동에서 차량 정비 일지·불량 부품 표본 관리 업무를 맡는다. 강남역 본사·회장실 게시판 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0273 | 송하율 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 차량 정비 도제. 정비 일지를 성하전자 작업 반장이 아닌 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.position | org (2회) | Seongha Electronics Work Foreman ／ 성하전자 작업 반장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0274 | 조우찬 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.fields.Title | org (1회) | Seongha Electronics Work Foreman | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.sections.Life | org (1회) | Grew up on waiting-hall duty. The Seongha Electronics work foreman post opened up as a substitute duty for an  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.sections.Offices | org (1회) | Rank: Staff Member. Title: Seongha Electronics Work Foreman. Rotates work crews, and for every accident requir | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.sections.Ambition | org (1회) | Aims to protect Seongha Electronics' Gangnam Station stronghold by getting the engineers' Chairman's Office to | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.biography | org (2회) | Cold toward anyone who cannot prove their skill, and remembers the blame for accidents down to the date. Makes ／ 숙련을 증명하지 못한 사람에게 차갑고, 사고 책임을 날짜까지 기억한다. 회의보다 차륜 아래에서 결정을 내린다.

- 생업: 작업 조 순환·사고 서명 관리
- 소속: 성하그룹
- 품계: 사원
- 직함 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 작업 반장. 작업 조를 순환 배치하고, 사고 한 건에 반장과 도제의 서명을 함께 요구한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.fields.직함 | org (1회) | 성하전자 작업 반장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.sections.생애 | org (1회) | 대합실 당직에서 자랐다. 성하전자 작업 반장 자리는 교대 무단 결근 대체 당직으로 열렸다.
- 조우찬은 서초4동에서 작업 조 순환·사고 서명 관리 업무를 맡는다. 강남역 본사·회장실 게시판과 대합실 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 작업 반장. 작업 조를 순환 배치하고, 사고 한 건에 반장과 도제의 서명을 함께 요구한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0274 | 조우찬 | $.sections.야망 | org (1회) | 기술자 회장실가 사택 청원보다 먼저 기지 가동을 승인하게 만들어 성하전자 강남역 거점을 지킨다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0275 | 서진아 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0275 | 서진아 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0275 | 서진아 | $.biography | org (2회) | Logical and skilled at counting votes. Regards any moment when people go hungry because of technology as a per ／ 논리적이고 표를 세는 데 능하다. 기술 탓에 사람이 굶는 순간을 개인적 패배로 여긴다.

- 생업: 사택 청원·급수 잔량 감사
- 소속: 성하그룹
- 품계: 사원
- 직함: 강남역 사택 감사
**생 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0275 | 서진아 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0276 | 권도하 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0276 | 권도하 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0276 | 권도하 | $.sections.Ambition | org (1회) | Ties the North Gate patrol to the northern route of the Gangnam Station escort, moving Seongha Electronics tra | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0276 | 권도하 | $.biography | org (2회) | Likes discipline and regards silence on the tracks as part of combat. Says that an assault without skill is cl ／ 규율을 좋아하고 선로 위의 침묵을 전투의 일부로 본다. 숙련 없는 돌격은 배신에 가깝다고 말한다.

- 생업: 차륜 점검·무장 탑재 확인
- 소속: 성하그룹
- 품계: 사원
- 직함: 강남역 궤도기 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0276 | 권도하 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0276 | 권도하 | $.sections.야망 | org (1회) | 북문 순찰을 강남역 호송의 북문로 묶어 서울 내부 계약과 당직표에 따라 성하전자 열차를 움직인다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.position | org (2회) | Seongha Electronics Scrap Iron Recovery Crew Foreman ／ 성하전자 철재 회수 작업반장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0277 | 황노을 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.fields.Title | org (1회) | Seongha Electronics Scrap Iron Recovery Crew Foreman | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.sections.Life | org (1회) | Grew up on waiting-hall duty. The post of Seongha Electronics Steel Recovery Crew Chief opened up through a su | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.sections.Offices | org (1회) | Rank: Employee. Title: Seongha Electronics Steel Recovery Crew Chief. Puts recovered weights on the public sca | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.sections.Ambition | org (1회) | Binds wheel and brake steel into Seongha Electronics' standard stock so that no particular work crew can hold  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.biography | org (2회) | Pragmatic, but harsh toward those who hide scrap metal. Believes that cheating on weight is the same as shavin ／ 실리적이나 고철을 숨기는 사람을 가혹하게 다룬다. 무게를 속이는 일은 선로를 깎는 일과 같다고 본다.

- 생업: 철재 회수 중량·출고 검증
- 소속: 성하그룹
- 품계: 사원
- 직함: 성하전자  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 철재 회수 작업반장. 회수 중량을 공개 저울에 올리고, 이씨 가문 전용 칸으로 들어간 철재는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.fields.직함 | org (1회) | 성하전자 철재 회수 작업반장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.sections.생애 | org (1회) | 대합실 당직에서 자랐다. 성하전자 철재 회수 작업반장 자리는 교대 무단 결근 대체 당직으로 열렸다.
- 황노을은 역삼1동에서 철재 회수 중량·출고 검증 업무를 맡는다. 성하전자 정비 표본·중량·로트 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 철재 회수 작업반장. 회수 중량을 공개 저울에 올리고, 이씨 가문 전용 칸으로 들어간 철재는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0277 | 황노을 | $.sections.야망 | org (1회) | 차륜·제동 철재를 성하전자 표준 재고로 묶어 특정 작업 조가 부품을 볼모로 후계를 흔들지 못하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.position | org (2회) | Seongha Electronics Wheel Mechanic, Song Ha-yul's Practical Aide ／ 성하전자 차륜 정비사, 송하율의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0278 | 두모 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.fields.Title | org (1회) | Seongha Electronics Wheel Mechanic, Song Ha-yul's Practical Aide | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.sections.Life | org (1회) | Grew up at the Gangnam Station rolling-stock depot. The post of Seongha Electronics wheel mechanic and Song Ha | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.sections.Offices | org (1회) | Rank: Employee. Title: Seongha Electronics Wheel Mechanic, Song Hayul's Practical Aide. Posts maintenance logs | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.biography | org (2회) | Quick-handed and sparing with words, regards snatching other people's tools as the same offense as cheating on ／ 손이 빠르고 말이 적으며, 남의 공구를 빼돌리는 일을 시험 부정과 같은 죄로 본다. 결함 표본을 자르지 않고 넘기는 반장을 참지 못한다.

- 생업: 차륜 정비 일지·불량 부품 표본 관리
- 소속: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 차륜 정비사, 송하율의 실무 담당자. 정비 일지를 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.fields.직함 | org (1회) | 성하전자 차륜 정비사, 송하율의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.sections.생애 | org (1회) | 강남역 차량기지에서 자랐다. 성하전자 차륜 정비사, 송하율의 실무 담당자 자리는 탈선 직전 결함 보고로 열렸다.
- 두모는 역삼1동에서 차륜 정비 일지·불량 부품 표본 관리 업무를 맡는다. 성하전자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0278 | 두모 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 차륜 정비사, 송하율의 실무 담당자. 정비 일지를 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.position | org (2회) | Seongha Electronics Wheel and Scrap Iron Logistics Merchant ／ 성하전자 차륜·철재 물류상 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0279 | 모소 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.fields.Title | org (1회) | Seongha Electronics Wheel and Scrap Iron Logistics Merchant | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.sections.Life | org (1회) | Raised at the Gangnam Station Depot. The post of Seongha Electronics Wheel and Steel Logistics Merchant opened | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.sections.Offices | org (1회) | Rank: Staff. Title: Seongha Electronics Wheel and Steel Logistics Merchant. Two witnesses observe the receivin | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.sections.Ambition | org (1회) | Bundles wheels and brake steel into Seongha Electronics standard stock so that no particular work crew can sha | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.biography | org (2회) | Regards shipping that falsifies weight as no different from shaving down the rails, and harshly counts cargo t ／ 무게를 속이는 출고를 선로를 깎는 일과 같다고 보고, 이씨 가문 전용 칸으로 빠지는 짐을 가혹하게 세운다. 시세보다 공개 저울을 믿는다.

- 생업: 차륜·철재 입고 중량·출고 확인
- 소속: 성하 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 차륜·철재 물류상. 입고 중량을 두 증인이 보고, 가문 문장이 찍힌 주문서는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.fields.직함 | org (1회) | 성하전자 차륜·철재 물류상 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.sections.생애 | org (1회) | 강남역 차량기지에서 자랐다. 성하전자 차륜·철재 물류상 자리는 탈선 직전 결함 보고로 열렸다.
- 모소는 역삼1동에서 차륜·철재 입고 중량·출고 확인 업무를 맡는다. 성하전자 정비 표본·중량·로트· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 차륜·철재 물류상. 입고 중량을 두 증인이 보고, 가문 문장이 찍힌 주문서는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0279 | 모소 | $.sections.야망 | org (1회) | 차륜과 제동 철재를 성하전자 표준 재고로 묶어 특정 작업 조가 부품을 볼모로 후계를 흔들지 못하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0280 | 봉복 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0280 | 봉복 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0280 | 봉복 | $.biography | org (2회) | Looks at the hand caught under the wheel first and at nationality later. Refuses talk that packages stimulants ／ 차륜 아래 끼인 손부터 보고 국적을 나중에 본다. 시험 기간의 각성제를 숙련의 증명으로 포장하는 말을 거부한다.

- 생업: 사택 사고 활력 기록·야간 수술 서명 확인
- 소속: 성하그룹
- 품계: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0280 | 봉복 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0281 | 용모 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0281 | 용모 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0281 | 용모 | $.sections.Ambition | org (1회) | Ties the North Gate patrol to the northern route of the Gangnam Station escort, moving Seongha Electronics tra | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0281 | 용모 | $.biography | org (2회) | Likes discipline and sees silence on the track as part of patrolling. Calls an assault without skill close to  ／ 규율을 좋아하고 선로 위의 침묵을 순찰의 일부로 본다. 숙련 없는 돌격을 배신에 가깝다고 말한다.

- 생업: 북문 출격 차륜 점검·무장 탑재 확인
- 소속: 성하그룹
- 품계: 사원
- 직함: 강 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0281 | 용모 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0281 | 용모 | $.sections.야망 | org (1회) | 북문 순찰을 강남역 호송의 북문로 묶어 서울 내부 계약과 당직표에 따라 성하전자 열차를 움직인다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0282 | 소봉 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0282 | 소봉 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0282 | 소봉 | $.biography | org (2회) | Remembers accident dates before people's names, and will not open base operation until a verbal approval has b ／ 사고 날짜를 사람 이름보다 먼저 기억하고, 구두 승인을 전령 원장에 옮기기 전에 기지 가동을 열지 않는다. 사택 쪽 쪽지가 기술 일지보다 위에 붙으면 분필을 꺾는다.

- 생업: 작업 조·사고 원장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0282 | 소봉 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0283 | 복두 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0283 | 복두 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0283 | 복두 | $.sections.Life | org (1회) | Grew up on waiting-hall duty. The post of northern track scout opened through a substitute shift for an unexcu | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0283 | 복두 | $.biography | org (2회) | When he sees a closed tunnel, he heads there on foot first, and he despises drawing detours from rumor alone.  ／ 닫힌 터널을 보면 발부터 향하고, 소문만으로 우회로를 그리는 일을 경멸한다. 침수 자국이 하루만 낡아도 지도를 다시 그린다.

- 생업: 서울 북부 선로 실측·목격 대조
- 소속: 성하그룹
- 품계 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0283 | 복두 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0283 | 복두 | $.sections.생애 | org (1회) | 대합실 당직에서 자랐다. 북부 선로 탐사원 자리는 교대 무단 결근 대체 당직으로 열렸다.
- 복두는 역삼1동에서 서울 북부 선로 실측·목격 대조 업무를 맡는다. 성하전자 정비 표본·중량·로트·실측· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.position | org (2회) | Seongha Electronics Work Accident Recorder, Operations Aide to Jo Uchan ／ 성하전자 작업 사고 기록관, 조우찬의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0284 | 국두 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.fields.Title | org (1회) | Seongha Electronics Work Accident Recorder, Operations Aide to Jo Uchan | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.sections.Life | org (1회) | Grew up at the Seoul Station registry office. The post of Seongha Electronics Work Accident Recorder, Jo Uchan | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.sections.Offices | org (1회) | Rank: Staff. Title: Seongha Electronics Work Accident Recorder, Jo Uchan's working-level deputy. He requires t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.biography | org (2회) | He remembers accident accountability down to the date and treats unsigned logs as if they never existed. He tr ／ 사고 책임을 날짜까지 기억하고, 서명 없는 일지를 없던 일로 돌린다. 회의보다 차륜 아래의 필적을 믿는다.

- 생업: 작업 사고 서명·불량 표본 번호 기록
- 소속: 성하그룹
- 품계: 사원
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 작업 사고 기록관, 조우찬의 실무 담당자. 사고 한 건에 반장과 도제의 서명을 함께 요구하고, 불량 표본 번호를 같은 줄에 적는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.fields.직함 | org (1회) | 성하전자 작업 사고 기록관, 조우찬의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.sections.생애 | org (1회) | 서울역 등기소에서 자랐다. 성하전자 작업 사고 기록관, 조우찬의 실무 담당자 자리는 이중 장부 한 줄 삭제로 열렸다.
- 국두는 서초4동에서 작업 사고 서명·불량 표본 번호 기록 업무를 맡는다. 강 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0284 | 국두 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 작업 사고 기록관, 조우찬의 실무 담당자. 사고 한 건에 반장과 도제의 서명을 함께 요구하고, 불량 표본 번호를 같은 줄에 적는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0286 | 두국 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=geography:duchy:11350 |
| person-0286 | 두국 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0286 | 두국 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0286 | 두국 | $.sections.Ambition | org (1회) | He means to keep the North Gate as Gangnam Station's northern escort post, so that Seongha Electronics trains  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0286 | 두국 | $.biography | org (2회) | He remembers the blank in the escort times as an insult, and sends down off the tracks any officer who offers  ／ 호송 시각의 빈칸을 모욕처럼 기억하고, 통행세를 통행 조건으로 내미는 장교를 선로에서 내려보낸다. 제동 점검을 건너뛴 출고를 사고의 시작으로 본다.

- 생업: 북문 호송 인원·차륜 점검표 게시
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0286 | 두국 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0286 | 두국 | $.sections.야망 | org (1회) | 북문을 강남역 호송의 북문 거점으로 남겨 별도 통행세 없이 성하전자 열차가 나가게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0287 | 모복 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=geography:duchy:11650 |
| person-0287 | 모복 | $.confirmedHoldings[].name.ko | org (2회) | Seocho-gu Seongha Group Ducal Demesne ／ 서초구 성하그룹 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0287 | 모복 | $.openingTitles[].name | org (2회) | Seocho-gu Seongha Group Duchy ／ 서초구 성하그룹 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0287 | 모복 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0287 | 모복 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0287 | 모복 | $.biography | org (2회) | Reads the night water level by the length of the bucket line, and records any moment when the kettles run empt ／ 양동 줄의 길이로 밤 수위를 읽고, 기술 탓에 주전자가 비는 순간을 거점의 실패로 적는다. 구두로 밸브를 잠그라는 전갈은 핸들 페인트에 적지 않는다.

- 생업: 사택 급수 수위 확인·개폐 조정
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0287 | 모복 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.position | org (2회) | Seongha Electronics Steel Salvage Yard Outpost Chief, Operations Aide to Hwang Noeul ／ 성하전자 철재 회수장 거점장, 황노을의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0288 | 봉국 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.fields.Title | org (1회) | Seongha Electronics Steel Salvage Yard Outpost Chief, Operations Aide to Hwang Noeul | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.sections.Life | org (1회) | Raised at the waiting-hall watch. The post of Hub Chief of the Seongha Electronics Steel Recovery Yard, Hwang  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.sections.Offices | org (1회) | Rank: Managing Director. Title: Hub Chief of the Seongha Electronics Steel Recovery Yard, Hwang Noeul's Workin | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.sections.Ambition | org (1회) | Keep the recovery yard as the entrance to Seongha Electronics' standard inventory, so that the Lee clan's excl | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.biography | org (2회) | Pragmatic, but harsh toward those who hide scrap metal. He regards cheating the scale as the same as shaving d ／ 실리적이나 고철을 숨기는 사람을 가혹하게 다룬다. 저울을 속이는 일을 선로를 깎는 일과 같다고 본다.

- 생업: 철재 회수 중량 공개·출고 확인
- 소속: 성하그룹
- 품계: 상무
- 직함: 성하 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 상무. 직함은 성하전자 철재 회수장 거점장, 황노을의 실무 담당자. 회수 중량을 공개 저울에 올리고, 이씨 가문 전용 칸으로 들어간 철재는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.fields.직함 | org (1회) | 성하전자 철재 회수장 거점장, 황노을의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.sections.생애 | org (1회) | 대합실 당직에서 자랐다. 성하전자 철재 회수장 거점장, 황노을의 실무 담당자 자리는 교대 무단 결근 대체 당직으로 열렸다.
- 봉국은 역삼1동에서 철재 회수 중량 공개·출고 확인 업무를 맡는다. 성 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.sections.관직 | org (1회) | 품계 상무. 직함은 성하전자 철재 회수장 거점장, 황노을의 실무 담당자. 회수 중량을 공개 저울에 올리고, 이씨 가문 전용 칸으로 들어간 철재는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0288 | 봉국 | $.sections.야망 | org (1회) | 회수장을 성하전자 표준 재고의 입구로 남겨 이씨 가문 전용 칸이 시험 철재를 볼모로 잡지 못하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0289 | 용두봉 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0289 | 용두봉 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0289 | 용두봉 | $.biography | org (2회) | He turns any cavalryman who has not examined the wheels before sortie away to an empty compartment, and record ／ 출격 전 차륜을 보지 않은 기병을 빈 칸으로 돌리고, 숙련 없는 무장 탑재를 사고로 기록한다. 정비창의 침묵을 전투의 일부로 본다.

- 생업: 궤도기병 출격 전 정비·무장 탑재 확인
- 소속: 성 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0289 | 용두봉 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.position | org (2회) | Seongha Electronics Wheel Maintenance Defect Whistleblower ／ 성하전자 차륜 정비 불량 폭로자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0290 | 추지훈 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.fields.Title | org (1회) | Seongha Electronics Wheel Maintenance Defect Whistleblower | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.sections.Life | org (1회) | He grew up at the Gangnam Station rail depot. The post of Seongha Electronics Wheel Maintenance Defect Whistle | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.sections.Offices | org (1회) | Rank: Staff Member. Title: Seongha Electronics Wheel Maintenance Defect Whistleblower. He posts maintenance lo | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.biography | org (2회) | He regards pilfering others' tools as the same crime as cheating on an exam, and cannot tolerate a foreman who ／ 남의 공구를 빼돌리는 일을 시험 부정과 같은 죄로 보고, 결함 표본을 자르지 않고 넘기는 반장을 참지 못한다. 손이 빠르고 말은 적다.

- 생업: 차륜 정비 일지·불량 부품 표본 공개
- 소속:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 차륜 정비 불량 폭로자. 정비 일지를 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.fields.직함 | org (1회) | 성하전자 차륜 정비 불량 폭로자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.sections.생애 | org (1회) | 강남역 차량기지에서 자랐다. 성하전자 차륜 정비 불량 폭로자 자리는 탈선 직전 결함 보고로 열렸다.
- 추지훈은 역삼1동에서 차륜 정비 일지·불량 부품 표본 공개 업무를 맡는다. 성하전자 정비 표본 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0290 | 추지훈 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 차륜 정비 불량 폭로자. 정비 일지를 회장실 게시판에 직접 붙이고, 불량 부품은 잘라 표본으로 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.position | org (2회) | Seongha Electronics Test Wheel Defect Witness ／ 성하전자 시험 차륜 결함 증인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0291 | 어예린 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.fields.Title | org (1회) | Seongha Electronics Test Wheel Defect Witness | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.sections.Life | org (1회) | She grew up at the Gangnam Station rail depot. Her post as Seongha Electronics Test Wheel Defect Witness opene | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.sections.Offices | org (1회) | Rank: Employee. Title: Seongha Electronics Test Wheel Defect Witness. She requires the signatures of both the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.biography | org (2회) | She remembers accident responsibility down to the date, and treats logs without signatures as though they neve ／ 사고 책임을 날짜까지 기억하고, 서명 없는 일지를 없던 일로 돌린다. 회의보다 차륜 아래의 필적을 믿는다.

- 생업: 시험 차륜 결함 표본·사고 서명 확인
- 소속: 성하그룹
- 품계: 사원
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 시험 차륜 결함 증인. 사고 한 건에 반장과 도제의 서명을 함께 요구하고, 불량 표본 번호를 같은 줄에 적는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.fields.직함 | org (1회) | 성하전자 시험 차륜 결함 증인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.sections.생애 | org (1회) | 강남역 차량기지에서 자랐다. 성하전자 시험 차륜 결함 증인 자리는 탈선 직전 결함 보고로 열렸다.
- 어예린은 역삼1동에서 시험 차륜 결함 표본·사고 서명 확인 업무를 맡는다. 성하전자 정비 표본· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0291 | 어예린 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 시험 차륜 결함 증인. 사고 한 건에 반장과 도제의 서명을 함께 요구하고, 불량 표본 번호를 같은 줄에 적는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0292 | 란진아 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0292 | 란진아 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0292 | 란진아 | $.sections.Ambition | org (1회) | To bind the medical train's North Gate brakes into the northern wing of the Gangnam Station convoy, so that Se | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0292 | 란진아 | $.biography | org (2회) | She sends cavalry who have not inspected their wheels before sortie off with empty cars, and regards any relea ／ 출격 전 차륜을 보지 않은 기병을 빈 칸으로 돌리고, 제동 점검을 건너뛴 출고를 사고의 시작으로 본다. 규율을 좋아하고 선로 위의 침묵을 정비의 일부로 여긴다.

- 생업: 의료열차 출격 전 정비  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0292 | 란진아 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0292 | 란진아 | $.sections.야망 | org (1회) | 의료열차의 북문 제동을 강남역 호송의 북부 날개로 묶어 별도 통행세 없이 성하전자 열차가 나가게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0293 | 섭채원 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0293 | 섭채원 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0293 | 섭채원 | $.biography | org (2회) | She remembers the blank spaces in the escort schedule as an insult, and sends down off the tracks any officer  ／ 호송 시각의 빈칸을 모욕처럼 기억하고, 통행세를 통행 조건으로 내미는 장교를 선로에서 내려보낸다. 이정표를 깎는 칼보다 말로 길을 나눈다.

- 생업: 북문 피난 통행 시각·가족 표 안내
- 소속: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0293 | 섭채원 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0294 | 평채원 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0294 | 평채원 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0294 | 평채원 | $.biography | org (2회) | She uses the speed at which a kettle cools as her unit of testimony, and when the pressure-gauge needle trembl ／ 주전자가 식는 속도를 증언의 단위로 쓰고, 압력계 바늘이 떨리면 회의 말보다 먼저 일어선다. 남이 대신 눌러 준 손도장을 자신의 갈증으로 인정하지 않는다.

- 생업: 사택 급수 압력 기록·연서 확 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0294 | 평채원 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0295 | 단건우 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.sections.Life | org (1회) | Grew up at the Jegi-dong infirmary. The post of Northern Envoy Technician of the Weak Nations Council opened t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.sections.Ambition | org (1회) | At the work-living-area council, to put Seongha Electronics' repair standards and labor mobility rights into t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.biography | org (2회) | Remembers accident dates before people's names, and does not open the base's operations before transferring ve ／ 사고 날짜를 사람 이름보다 먼저 기억하고, 구두 승인을 전령 원장에 옮기기 전에 기지 가동을 열지 않는다. 사택 쪽 쪽지가 기술 일지보다 위에 붙으면 분필을 꺾는다.

- 생업: 역삼1동 작업 조· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 바깥 작업장 사절 기술자. 작업 조 순환과 사고 서명을 같은 원장에 적고, 시험 연기를 요구하는 쪽지는 게시판에 그대로 붙인다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.sections.생애 | org (1회) | 제기동 의무소에서 자랐다. 약소국 회의 북부 사절 기술자 자리는 가짜 약 봉인으로 열렸다.
- 단건우는 역삼1동에서 역삼1동 작업 조·사고 원장 기록 업무를 맡는다. 성하전자 정비 표본·중량·로트· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0295 | 단건우 | $.sections.야망 | org (1회) | 작업 생활권 회의에서 성하전자의 수리 규격과 노동 이동권을 본사 교섭 문안에 넣어 성하그룹이 작업 생활권 사절의 손으로도 서명되게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.position | org (2회) | Seongha Electronics Wheel Exchange Witness ／ 성하전자 차륜 교환 증인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.stateName | org (2회) | Seongha Group ／ 성하그룹 | 050 확정값으로 교체: state_id=arc |
| person-0296 | 순하준 | $.fields.Affiliation | org (1회) | Seongha Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.fields.Title | org (1회) | Seongha Electronics Wheel Exchange Witness | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.Life | org (1회) | Grew up on the water-purification night watch at Yeongdeungpo. The post of Seongha Electronics Wheel Exchange  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.Offices | org (1회) | Rank: Employee. Title: Seongha Electronics Wheel Exchange Witness. Two witnesses observe the intake weight, an | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.Anecdote | org (1회) | When the water-supply contract was concluded, Sun Hajun placed the worn-out wheels and brake box on the Seongh | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.Relationships | org (1회) | Overlap the agreed weight on Hwang Noeul's recovery scale, point to the same box as Chu Hangyeol's Yongsan tra | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.Ambition | org (1회) | To leave the water-supply contract's train parts exchange in Seongha Electronics' standard inventory ledger, s | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.biography | org (2회) | Regards falsified-weight dispatch as the same as shaving down the rails, and harshly stands against cargo slip ／ 무게를 속이는 출고를 선로를 깎는 일과 같다고 보고, 이씨 가문 전용 칸으로 빠지는 짐을 가혹하게 세운다. 시세보다 공개 저울을 믿는다.

- 생업: 차륜 입고 중량·출고 증언
- 소속: 성하그룹
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.characterProfile.traits[].relationship | org (2회) | 황노을의 회수 저울에 협약 중량을 겹치고, 추한결의 용산 환적 증언과 같은 상자를 가리키며, 임하준이 보증한 부품 칸의 성하전자 쪽 출고를 증언한다. ／ 관계. 황노을의 회수 저울에 협약 중량을 겹치고, 추한결의 용산 환적 증언과 같은 상자를 가리키며, 임하준이 보증한 부품 칸의 성하전자 쪽 출고를 증언한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.characterProfile.traits[].behavior | org (1회) | 관직. 품계 사원. 직함은 성하전자 차륜 교환 증인. 입고 중량을 두 증인이 보고, 가문 문장이 찍힌 주문서는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.fields.소속 | org (1회) | 성하그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.fields.직함 | org (1회) | 성하전자 차륜 교환 증인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.생애 | org (1회) | 영등포 정수 당직에서 자랐다. 성하전자 차륜 교환 증인 자리는 탁수 밤의 밸브 서명으로 열렸다.
- 순하준은 역삼1동에서 차륜 입고 중량·출고 증언 업무를 맡는다. 성하전자 정비 표본·중량·로트·실 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.관직 | org (1회) | 품계 사원. 직함은 성하전자 차륜 교환 증인. 입고 중량을 두 증인이 보고, 가문 문장이 찍힌 주문서는 회장실 인준 전 출고를 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.일화 | org (1회) | 급수 계약이 맺어질 때 순하준은 수명이 다한 차륜과 제동 상자를 성하전자 저울에 올리고 규격 도장을 확인했다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.관계 | org (1회) | 황노을의 회수 저울에 협약 중량을 겹치고, 추한결의 용산 환적 증언과 같은 상자를 가리키며, 임하준이 보증한 부품 칸의 성하전자 쪽 출고를 증언한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0296 | 순하준 | $.sections.야망 | org (1회) | 급수 계약의 열차 부품 교환을 성하전자 표준 재고 원장에 남겨 특정 작업 조가 부품을 볼모로 후계를 흔들지 못하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.position | org (2회) | Sinnae Transport President ／ 신내운수 사장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0297 | 장세화 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.fields.Title | org (1회) | Sinnae Transport President | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.openingTitles[].basis | org (1회) | 2026-10-22 영토 작위 배분(owner:seoul-faction-consolidation-20261022). 신내운수 사장. 북동 왕국 안 유일한 국가 수도 신내역(노원) 직영지 보유 근거. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.fields.직함 | org (1회) | 신내운수 사장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.biography | org (1회) | 생애. 장세화는 2098-08-11에 태어나 신내·용산선로문 생활권의 환승 당직 기록을 이어 왔다. 2126년 개막에는 신내운수 사장으로서 영구 겨울의 배차표에서 환자 이송과 생활 화물 인계를 함께 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0297 | 장세화 | $.relations.incoming[].basis | org (1회) | 의료호송을 신내운수와 나눔 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0298 | 안도한 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0298 | 안도한 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0298 | 안도한 | $.biography | org (2회) | An Dohan, born 2082-02-01, cannot stand blanks in a timetable and corrects the blackboard before the seasonal  ／ 2082-02-01생인 안도한은 시각표의 빈칸을 참지 못하고, 계절 교대 결재가 오기 전에 이미 칠판을 고쳐 둔다. 말단 노선의 지연을 모욕처럼 기억한다.

- 생업: 배차표·호송 인원 게시
- 소 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0298 | 안도한 | $.characterProfile.traits[].stress | org (2회) | 동북 말단이 막혀 신내운수가 창동과 암사 사이를 통과만 하는 하역장이 되는 것. ／ 공포. 동북 말단이 막혀 신내운수가 창동과 암사 사이를 통과만 하는 하역장이 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0298 | 안도한 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0298 | 안도한 | $.sections.공포 | org (1회) | 동북 말단이 막혀 신내운수가 창동과 암사 사이를 통과만 하는 하역장이 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0299 | 전미리 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0299 | 전미리 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0299 | 전미리 | $.biography | org (2회) | Jeon Miri, born 2080-03-07, looks at injury grade first and nationality later. Trusts stretcher order over neu ／ 2080-03-07생인 전미리는 부상 등급을 먼저 보고 국적을 나중에 본다. 중립 문구보다 들것 순서를 믿는다.

- 생업: 환자 중증도·이송 시각 기록
- 소속: 신내운수
- 품계: 호송원
- 직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0299 | 전미리 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0300 | 문시온 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0300 | 문시온 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0300 | 문시온 | $.biography | org (2회) | Born 2075-05-26, Mun Sion speaks little and relentlessly cross-checks evidence. Holds in contempt the practice ／ 2075-05-26생인 문시온은 말수가 적고 증빙을 집요하게 대조한다. 호송료 영수증을 통행증으로 바꾸는 관행을 경멸한다.

- 생업: 신분 조각·화물 봉인 대조
- 소속: 신내운수
- 품계: 호송 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0300 | 문시온 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0301 | 하세온 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0301 | 하세온 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0301 | 하세온 | $.biography | org (2회) | Born 2095-03-17, Ha Seon fills the gaps left by an optimistic superior in the field. Knows how to guard a long ／ 2095-03-17생인 하세온은 낙관적인 상관의 공백을 현장에서 메운다. 적은 병력으로 긴 열차를 지키는 법을 안다.

- 생업: 의료·화물 호송 인원 편성
- 소속: 신내운수
- 품계: 호송원
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0301 | 하세온 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0302 | 곽태산 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0302 | 곽태산 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0302 | 곽태산 | $.sections.Ambition | org (1회) | He wants to keep medical train defense as a function unique to Sinnae Transport and put an end to the practice | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0302 | 곽태산 | $.biography | org (2회) | Born on 2086-05-03, Gwak Taesan is taciturn and blocks access to the cars with his own body. He dislikes the g ／ 2086-05-03생인 곽태산은 과묵하고 칸 출입을 몸으로 막는다. 수비대가 호송대보다 눈에 띄는 것을 싫어한다.

- 생업: 의료열차 칸 열쇠·무기함 봉인 관리
- 소속: 신내운수
- 품계: 호송 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0302 | 곽태산 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0302 | 곽태산 | $.sections.야망 | org (1회) | 의료열차 수비를 신내운수 고유 직능으로 남겨 외부 호위병이 칸 안에 서는 관행을 없애려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0303 | 소두감 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0303 | 소두감 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0303 | 소두감 | $.sections.Fear | org (1회) | That an unmaintained car will go out as a medical train, and Sinnae Transport will fall to a freight yard betw | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0303 | 소두감 | $.biography | org (2회) | Born 2101-11-10, Sodugam cannot stand blanks in a timetable and remembers releases that skipped the brakes and ／ 2101-11-10생인 소두감은 시각표의 빈칸을 참지 못하고, 제동과 연결기를 건너뛴 출고를 모욕처럼 기억한다. 말단 노선의 지연을 정치 순위로 포장하는 말을 거부한다.

- 생업: 유치선 배차표· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0303 | 소두감 | $.characterProfile.traits[].stress | org (2회) | 정비 안 된 칸이 의료열차로 나가 신내운수가 창동과 암사 사이 하역장으로 떨어지는 것. ／ 공포. 정비 안 된 칸이 의료열차로 나가 신내운수가 창동과 암사 사이 하역장으로 떨어지는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0303 | 소두감 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0303 | 소두감 | $.sections.공포 | org (1회) | 정비 안 된 칸이 의료열차로 나가 신내운수가 창동과 암사 사이 하역장으로 떨어지는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0304 | 복봉 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0304 | 복봉 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0304 | 복봉 | $.sections.Fear | org (1회) | That a military insignia gets mixed into the patient-car invoices and Sinnae Transport falls to being an unloa | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0304 | 복봉 | $.biography | org (2회) | Born 2071-11-24, Bokbong puts the weight on an invoice and the seal on a patient car on the same scale, and de ／ 2071-11-24생인 복봉은 송장의 무게와 환자 칸의 봉인을 같은 저울에 올리고, 호송료를 통행 조건으로 적는 상인을 경멸한다. 계절 교대 전에 이미 하역 순서를 고쳐 둔다.

- 생업: 환승 화 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0304 | 복봉 | $.characterProfile.traits[].stress | org (2회) | 군수 문장이 환자 칸 송장에 섞여 신내운수가 하역장으로 전락하는 것. ／ 공포. 군수 문장이 환자 칸 송장에 섞여 신내운수가 하역장으로 전락하는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0304 | 복봉 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0304 | 복봉 | $.sections.공포 | org (1회) | 군수 문장이 환자 칸 송장에 섞여 신내운수가 하역장으로 전락하는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0305 | 국용 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0305 | 국용 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0305 | 국용 | $.biography | org (2회) | Born 2071-08-05, Gugyong looks at the grade of injury first and nationality later. He trusts stretcher order o ／ 2071-08-05생인 국용은 부상 등급을 먼저 보고 국적을 나중에 본다. 중립 문구보다 들것 순서를 믿고, 배차조의 빈 슬롯 요구를 활력이 안정되기 전에는 받지 않는다.

- 생업: 환승 환자 중 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0305 | 국용 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0306 | 감국 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0306 | 감국 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0306 | 감국 | $.biography | org (2회) | Born 2082-07-04, Gamguk fills in on site for the vacancy left by an optimistic superior, and knows the silence ／ 2082-07-04생인 감국은 낙관적인 상관의 공백을 현장에서 메우고, 적은 병력으로 긴 열차를 지키는 침묵을 안다. 발포를 자랑하는 사람을 호송에서 내린다.

- 생업: 외곽 호송 인원·발포 권한 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0306 | 감국 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0307 | 두복 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0307 | 두복 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0307 | 두복 | $.biography | org (2회) | Dubok, born 2066-08-08, remembers approval shift slips down to the minute and never alters the dispatch table  ／ 2066-08-08생인 두복은 결재 교대 쪽지를 분 단위로 기억하고, 구두 승인을 전령 원장에 옮기기 전에 배차표를 고치지 않는다. 의료조와 배차조의 순서를 한 장에 몰면 분필을 꺾는다.

- 생업 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0307 | 두복 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0308 | 복감 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0308 | 복감 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0308 | 복감 | $.biography | org (2회) | Bokgam, born 2078-02-12, heads feet first whenever he sees a closed dead-end track, and despises drawing bypas ／ 2078-02-12생인 복감은 닫힌 말단 선로를 보면 발부터 향하고, 소문만으로 우회로를 그리는 일을 경멸한다. 봉인 자국이 하루만 낡아도 지도를 다시 그린다.

- 생업: 동북 외곽로 실측 선·검 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0308 | 복감 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0309 | 봉모 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0309 | 봉모 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0309 | 봉모 | $.biography | org (2회) | Born 2074-05-29, Bongmo speaks little and tenaciously cross-checks evidence. Holds in contempt the practice of ／ 2074-05-29생인 봉모는 말수가 적고 증빙을 집요하게 대조한다. 호송료 영수증을 통행증으로 바꾸는 관행을 경멸한다.

- 생업: 통행 신분 조각·화물 봉인 기록
- 소속: 신내운수
- 품계:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0309 | 봉모 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0310 | 용봉 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0310 | 용봉 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0310 | 용봉 | $.biography | org (2회) | Born 2096-10-09, Yongbong remembers delays on the minor lines as an insult, and sends merchants who call the p ／ 2096-10-09생인 용봉은 말단 노선의 지연을 모욕처럼 기억하고, 승강장을 하역장으로 부르는 상인을 마이크 없이 내려보낸다. 환자 줄과 화물 줄을 한눈에 나눈다.

- 생업: 승강장 대기열·중증 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0310 | 용봉 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0311 | 국소 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0311 | 국소 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0311 | 국소 | $.sections.Ambition | org (1회) | Wants to keep Sinnae Depot as Sinnae Transport's own base, ending the practice of outside guards standing on t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0311 | 국소 | $.biography | org (2회) | Guk So, born 2064-06-18, treats holding-track duty like home and calls people who break shift changes by the t ／ 2064-06-18생인 국소는 유치선 당직을 집처럼 여기고, 교대를 어기는 사람을 이름 대신 시각으로 부른다. 계절 결재가 오기 전에 이미 출고 칠판을 잠근다.

- 생업: 차량기지 당직 명부·출고 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0311 | 국소 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0311 | 국소 | $.sections.야망 | org (1회) | 신내 기지를 신내운수 고유 거점으로 남겨 외부 호위병이 유치선에 서는 관행을 끊으려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0312 | 복용 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0312 | 복용 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0312 | 복용 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0312 | 복용 | $.biography | org (2회) | Bok Yong, born 2090-10-28, presses merchants who hide prices hardest, and drives out of the market anyone who  ／ 2090-10-28생인 복용은 가격을 숨기는 상인을 가장 잔인하게 몰아붙이고, 환자 이송 칸을 경매에 올리는 말을 시장에서 쫓아낸다. 공개 저울을 신용으로 본다.

- 생업: 시장 시세·재고 게시· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0312 | 복용 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0313 | 국감 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0313 | 국감 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0313 | 국감 | $.sections.Ambition | org (1회) | He wants to keep medical train defense as a function unique to Sinnae Transport and put an end to the practice | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0313 | 국감 | $.biography | org (2회) | Born 2096-10-18, Gukgam is taciturn and physically bars entry to the cars. Gukgam dislikes the guard detail st ／ 2096-10-18생인 국감은 과묵하고 칸 출입을 몸으로 막는다. 수비대가 호송대보다 눈에 띄는 것을 싫어하고, 열쇠와 무기함 봉인을 한 사람이 쥐는 일을 사고로 본다.

- 생업: 의료열차 칸 열 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0313 | 국감 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0313 | 국감 | $.sections.야망 | org (1회) | 의료열차 수비를 신내운수 고유 직능으로 남겨 외부 호위병이 칸 안에 서는 관행을 없애려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0314 | 감모 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0314 | 감모 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0314 | 감모 | $.biography | org (2회) | Born 2078-01-22, Gammo puts stretcher order ahead of nationality and accepts the Dispatch Unit's demands for e ／ 2078-01-22생인 감모는 들것 순서를 국적보다 앞에 두고, 배차조의 빈 슬롯 요구를 활력이 안정된 뒤에만 받는다. 당직 연장을 약으로 포장하는 말을 거부한다.

- 생업: 의료조 중증도·이송  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0314 | 감모 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0315 | 탁미르 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0315 | 탁미르 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0315 | 탁미르 | $.biography | org (2회) | Tak Mir, born 2066-09-11, remembers the shock of the platform coupling in the body and tears up slips insistin ／ 2066-09-11생인 탁미르는 승강장 이음매의 충격을 몸으로 기억하고, 빈 칸을 의료칸이라 우기는 쪽지를 찢는다. 말은 짧고 시각은 정확하다.

- 생업: 환승 사고 시각·화물칸 기록
- 소속:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0315 | 탁미르 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0316 | 범온결 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0316 | 범온결 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0316 | 범온결 | $.biography | org (2회) | Born on 2069-09-07, Beom Ongyeol counts the faces in the line and looks at the nationality table later. She cu ／ 2069-09-07생인 범온결은 줄의 얼굴을 세고 국적 표는 나중에 본다. 통행증을 군호로 바꾸라는 속삭임을 증인석에서 잘라 낸다.

- 생업: 외곽 관문 통과 시각·들것 수 기록
- 소속: 신내운 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0316 | 범온결 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0317 | 창다흰 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0317 | 창다흰 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0317 | 창다흰 | $.biography | org (2회) | Born on 2096-01-24, Chang Dahuin still carries the bitterness of the antipyretic on the tongue and never puts  ／ 2096-01-24생인 창다흰은 해열제 쓴맛을 아직도 혀에 남기고, 포장만 깨끗한 약을 들것에 올리지 않는다. 온화하나 열 곡선이 어긋나면 자리에서 일어나지 않는다.

- 생업: 약재 복용 시각·열 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0317 | 창다흰 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0318 | 초나루 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0318 | 초나루 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0318 | 초나루 | $.biography | org (2회) | Born on 2072-11-03, Cho Naru does not count an oral agreement made before the ink dries as a record. Quiet, bu ／ 2072-11-03생인 초나루는 먹물이 마르기 전의 구두 합의를 서기로 치지 않는다. 조용하나 조항 번호가 비면 붓을 내려놓는다.

- 생업: 중립 호송 서명·증인 대조
- 소속: 신내운수
- 품계 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0318 | 초나루 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0319 | 석봄우 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0319 | 석봄우 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0319 | 석봄우 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0319 | 석봄우 | $.biography | org (1회) | 2072-08-07생인 석봄우는 징발 쪽지의 글씨보다 빈집을 먼저 세고, 호송대를 병력으로 부르라는 방송을 모욕으로 듣는다. 줄이 길어질수록 목소리는 낮아진다.

- 생업: 징발 쪽지·출입 인원 대 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0320 | 근솔이 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0320 | 근솔이 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0320 | 근솔이 | $.biography | org (2회) | Geunsol, born 2085-02-01, watches the empty scale longer than the failed-auction bell, and drives out brokers  ／ 2085-02-01생인 근솔이는 유찰 종소리보다 빈 저울을 오래 보고, 군수 문장 입찰을 시세로 포장하는 중개인을 쫓아낸다. 외상 장부를 사람 얼굴보다 먼저 읽는다.

- 생업: 시장 유찰 시각·최 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0320 | 근솔이 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0322 | 서온결 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0322 | 서온결 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0322 | 서온결 | $.biography | org (2회) | Seo Ongyeol, born 2089-10-18, records transfer times to the minute and never leaves an empty stretcher at the  ／ 2089-10-18생인 서온결은 이송 시각을 분 단위로 적고, 빈 들것은 다음 창 전까지 역에 두지 않는다. 말은 짧게, 기록은 길게.

- 생업: 의무 이송 명부 대조·문 열쇠 인계
- 소속: 신 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0322 | 서온결 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0323 | 류은비 | $.position | org (2회) | White Cross Corps Leader ／ 흰십자단 단장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0323 | 류은비 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0323 | 류은비 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0323 | 류은비 | $.fields.Title | org (1회) | White Cross Corps Leader | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0323 | 류은비 | $.biography | org (2회) | Life. Ryu Eunbi, born 2070-09-16, is a healer who carried on the Jegi-dong herbal ledger and the Cheongnyangni ／ 생애. 2070-09-16에 태어난 류은비는 제기동 약재 장부와 청량리 병상 당직표를 이어 온 치료자다. 2126년 개막 현재 흰십자단 단장으로서 환자의 소속보다 중증도를 앞세워 병상을 배정하고,  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0323 | 류은비 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0323 | 류은비 | $.fields.직함 | org (1회) | 흰십자단 단장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0324 | 심달호 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0324 | 심달호 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0324 | 심달호 | $.biography | org (2회) | Sparing with words as a scale's graduations are sparing, he remembers a credit ledger longer than a person's f ／ 저울눈만큼 말을 아끼고, 외상 장부를 사람 얼굴보다 오래 기억한다. 선매를 권하는 사신을 손님으로 보지 않는다.

- 생업: 약재 원산지·출고 날인 대조
- 소속: 흰십자단
- 품계: 수련의
- 직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0324 | 심달호 | $.relations.incoming[].basis | clergy (1회) | A priest who backs Sim Dalho's origin marker post in the field, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0324 | 심달호 | $.characterProfile.traits[].behavior | org (1회) | 저울눈만큼 말을 아끼고, 외상 장부를 사람 얼굴보다 오래 기억한다. 선매를 권하는 사신을 손님으로 보지 않는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0324 | 심달호 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0325 | 은채윤 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0325 | 은채윤 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0325 | 은채윤 | $.biography | org (2회) | The hands are gentle, but cold toward pressure to change the treatment order. Even an enemy's wounds are seen  ／ 손놀림은 부드러우나 치료 순서를 바꾸라는 압력에는 차갑다. 적의 부상도 중증도 표 앞에서는 같은 줄로 본다.

- 생업: 중증도 배정·우선 치료 요청 보고
- 소속: 흰십자단
- 품계: 전문의
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0325 | 은채윤 | $.characterProfile.traits[].behavior | org (1회) | 손놀림은 부드러우나 치료 순서를 바꾸라는 압력에는 차갑다. 적의 부상도 중증도 표 앞에서는 같은 줄로 본다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정하며, 적아 구분 없이  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0325 | 은채윤 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0326 | 라세영 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0326 | 라세영 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0326 | 라세영 | $.biography | org (2회) | Turns principles into numbers and trusts quarantine days over rumors. Writes political lifting of a blockade d ／ 원칙을 숫자로 바꾸고, 소문보다 격리 일수를 믿는다. 정치적 봉쇄 해제를 사고 원인으로 적는다.

- 생업: 격리 출입 도장·해제 기록
- 소속: 흰십자단
- 품계: 전문의
- 직함: 방역 관리
* | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0326 | 라세영 | $.characterProfile.traits[].behavior | org (1회) | 원칙을 숫자로 바꾸고, 소문보다 격리 일수를 믿는다. 정치적 봉쇄 해제를 사고 원인으로 적는다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정하며, 적아 구분 없이 중증도만으로  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0326 | 라세영 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0327 | 남호성 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0327 | 남호성 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0327 | 남호성 | $.biography | org (2회) | Strongly faithful to their word, yet does not announce the convoy route in advance. Refuses to admit armed esc ／ 신의가 강하지만 호송 경로를 미리 말하지 않는다. 무장 호위를 치료 칸에 들이는 것을 거부한다.

- 생업: 의무호송증 환자·약재 중량 기록
- 소속: 흰십자단
- 품계: 전문의
- 직함: 의무호송 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0327 | 남호성 | $.characterProfile.traits[].behavior | org (1회) | 신의가 강하지만 호송 경로를 미리 말하지 않는다. 무장 호위를 치료 칸에 들이는 것을 거부한다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정하며, 적아 구분 없이 중증도만으로  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0327 | 남호성 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0327 | 남호성 | $.relations.outgoing[].basis | org (1회) | 의료호송을 신내운수와 나눔 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0328 | 전솔 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0328 | 전솔 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0328 | 전솔 | $.biography | org (2회) | Even with a quiet voice, Jeon Sol never backs down on clinical judgment and likes to rephrase medical neutrali ／ 목소리가 작아도 임상 판단에서 물러서지 않는다. 진료의 중립 원칙을 권리로 바꿔 말하길 좋아한다.

- 생업: 병상 대기 명부·비공개 치료 계약 심사
- 소속: 흰십자단
- 품계: 전문의
- 직함: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0328 | 전솔 | $.characterProfile.traits[].behavior | org (1회) | 목소리가 작아도 임상 판단에서 물러서지 않는다. 진료의 중립 원칙을 권리로 바꿔 말하길 좋아한다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정하며, 적아 구분 없이 중증도만으로 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0328 | 전솔 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0329 | 천다움 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0329 | 천다움 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0329 | 천다움 | $.sections.Relationships | clergy (1회) | She is the field priest who backs Sim Dalho's origin-marking stake, and she matches drying power to Su Hyoeun' | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0329 | 천다움 | $.biography | clergy+org (2회) | She listens to the drying room's temperature and fan sounds before she listens to people, and she regards any  ／ 건조실 온도와 팬 소리를 사람 말보다 먼저 듣고, 말목에 적힌 일자보다 늦은 수리를 모욕으로 본다. 공구함 봉인을 하루라도 건너뛰면 그날 출하를 멈춘다.

- 생업: 약재 건조 온도·필터 기록
-  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0329 | 천다움 | $.relations.outgoing[].basis | clergy (1회) | A priest who backs Sim Dalho's origin marker post in the field, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0329 | 천다움 | $.characterProfile.traits[].behavior | org (1회) | 건조실 온도와 팬 소리를 사람 말보다 먼저 듣고, 말목에 적힌 일자보다 늦은 수리를 모욕으로 본다. 공구함 봉인을 하루라도 건너뛰면 그날 출하를 멈춘다. 제기동의 중립 의료국 흰십자단에서 담당 전문 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0329 | 천다움 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0330 | 동늘솔 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0330 | 동늘솔 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0330 | 동늘솔 | $.biography | org (2회) | Puts the weight of each crate and its drying date on the same scale, and does not admit as a guest any envoy w ／ 상자 무게와 건조 일자를 같은 저울에 올리고, 선매 영수증만 들고 온 사신을 손님으로 들이지 않는다. 흥정은 짧게 끝내고 구두 운임을 인정하지 않는다.

- 생업: 약재 입고 중량·출고 송장 확인
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0330 | 동늘솔 | $.characterProfile.traits[].behavior | org (1회) | 상자 무게와 건조 일자를 같은 저울에 올리고, 선매 영수증만 들고 온 사신을 손님으로 들이지 않는다. 흥정은 짧게 끝내고 구두 운임을 인정하지 않는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0330 | 동늘솔 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0331 | 방한울 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0331 | 방한울 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0331 | 방한울 | $.biography | org (2회) | Quiet-handed, but locks the bed whenever handed a note ordering the treatment sequence changed. Even an enemy' ／ 손놀림은 조용하나 치료 순서를 바꾸라는 쪽지를 받으면 침상을 잠근다. 적의 부상도 중증도 표 앞에서는 같은 줄로 본다.

- 생업: 중증도 표·진료 소견 게시
- 소속: 흰십자단
- 품계: 수련의
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0331 | 방한울 | $.characterProfile.traits[].behavior | org (1회) | 손놀림은 조용하나 치료 순서를 바꾸라는 쪽지를 받으면 침상을 잠근다. 적의 부상도 중증도 표 앞에서는 같은 줄로 본다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0331 | 방한울 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0332 | 수초롱 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0332 | 수초롱 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0332 | 수초롱 | $.biography | org (2회) | Trusts quarantine days over rumors and records the political lifting of a blockade as the cause of the inciden ／ 소문보다 격리 일수를 믿고, 정치적 봉쇄 해제를 사고 원인으로 순찰 일지에 적는다. 출입 도장이 흐리면 골목을 되돌아간다.

- 생업: 격리 확인·해제 순찰
- 소속: 흰십자단
- 품계: 수련의
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0332 | 수초롱 | $.characterProfile.traits[].behavior | org (1회) | 소문보다 격리 일수를 믿고, 정치적 봉쇄 해제를 사고 원인으로 순찰 일지에 적는다. 출입 도장이 흐리면 골목을 되돌아간다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0332 | 수초롱 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0333 | 선나휘 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0333 | 선나휘 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0333 | 선나휘 | $.biography | org (2회) | If the seal cord is loose, refuses to depart, and does not accept a verbal consent in the name of the attendin ／ 봉인 끈이 느슨하면 출발을 거부하고, 담당 전문의 명의의 구두 동의를 전갈로 인정하지 않는다. 숨이 차도 사본 두 장을 한 손에 쥔다.

- 생업: 의료 전갈·계약 통지 배달
- 소속: 흰십자단
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0333 | 선나휘 | $.characterProfile.traits[].behavior | org (1회) | 봉인 끈이 느슨하면 출발을 거부하고, 담당 전문의 명의의 구두 동의를 전갈로 인정하지 않는다. 숨이 차도 사본 두 장을 한 손에 쥔다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0333 | 선나휘 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0334 | 원미루 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0334 | 원미루 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0334 | 원미루 | $.biography | org (2회) | Reads provenance from the smell of herbal medicines and the seams of capsules, and despises drawing an origin  ／ 생약의 냄새와 캡슐 이음새로 출처를 읽고, 소문만으로 원산지를 실선으로 그리는 일을 경멸한다. 늦은 표본을 죄로 본다.

- 생업: 위조약 감별·산지 기록
- 소속: 흰십자단
- 품계: 수련의
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0334 | 원미루 | $.characterProfile.traits[].behavior | org (1회) | 생약의 냄새와 캡슐 이음새로 출처를 읽고, 소문만으로 원산지를 실선으로 그리는 일을 경멸한다. 늦은 표본을 죄로 본다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0334 | 원미루 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0335 | 영늘빛 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0335 | 영늘빛 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0335 | 영늘빛 | $.sections.Relationships | clergy (1회) | A priest who transfers Jeon Sol's veto into the ledger, and leaves a copy of Seon Nahwi's message on the same  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0335 | 영늘빛 | $.biography | clergy+org (2회) | Fills the blanks in the waiting list before the people, and calls undisclosed buyers who do not enter private  ／ 대기 명부의 빈칸을 사람보다 먼저 메우고, 비공개 치료 계약을 원장에 올리지 않는 비공개 구매자를 위반자로 부른다. 숫자는 공개하되 해석은 난외에 남긴다.

- 생업: 병상 대기 명부·계약 난외 기 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0335 | 영늘빛 | $.characterProfile.traits[].behavior | org (1회) | 대기 명부의 빈칸을 사람보다 먼저 메우고, 비공개 치료 계약을 원장에 올리지 않는 외부 구매자를 위반자로 부른다. 숫자는 공개하되 해석은 난외에 남긴다. 제기동의 중립 의료국 흰십자단에서 담당 전문 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0335 | 영늘빛 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0336 | 판한들 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0336 | 판한들 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0336 | 판한들 | $.biography | org (2회) | Gauges the patient crowd by the humidity on the platform, and hears an order to bring military wagons ahead of ／ 승강장 습기로 환자 인파를 가늠하고, 군수 화차를 의무호송 앞으로 끌어오라는 명령을 모욕으로 듣는다. 온화하나 가짜 약 소문이 뜨면 방송을 직접 잡는다.

- 생업: 대합실 의무 대기표·약재 하역  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0336 | 판한들 | $.characterProfile.traits[].behavior | org (1회) | 승강장 습기로 환자 인파를 가늠하고, 군수 화차를 의무호송 앞으로 끌어오라는 명령을 모욕으로 듣는다. 온화하나 가짜 약 소문이 뜨면 방송을 직접 잡는다. 제기동의 중립 의료국 흰십자단에서 수련의를  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0336 | 판한들 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0337 | 천다올 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0337 | 천다올 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0337 | 천다올 | $.biography | org (2회) | Keeps, on the ground, the silence of a superior who does not announce the convoy route in advance. Burns a not ／ 호송 경로를 미리 말하지 않는 상관의 침묵을 현장에서 지킨다. 치료 칸에 무장 수비를 들이라는 쪽지를 태운다.

- 생업: 의무호송증 환자·약재 중량 기록
- 소속: 흰십자단
- 품계: 수련의
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0337 | 천다올 | $.characterProfile.traits[].behavior | org (1회) | 호송 경로를 미리 말하지 않는 상관의 침묵을 현장에서 지킨다. 치료 칸에 무장 수비를 들이라는 쪽지를 태운다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0337 | 천다올 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0338 | 동주하 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0338 | 동주하 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0338 | 동주하 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0338 | 동주하 | $.biography | org (2회) | Reads the origin tally post and the crate weight at a glance, and turns away emissaries urging advance purchas ／ 원산지 말목과 상자 무게를 한눈에 읽고, 선매를 권하는 사신을 저울 앞에서 돌려보낸다. 외상 장부를 사람 얼굴보다 오래 기억한다.

- 생업: 약재 원산지·건조 일자 검수
- 소속: 흰십자단
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0338 | 동주하 | $.characterProfile.traits[].behavior | org (1회) | 원산지 말목과 상자 무게를 한눈에 읽고, 선매를 권하는 사신을 저울 앞에서 돌려보낸다. 외상 장부를 사람 얼굴보다 오래 기억한다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정하 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0338 | 동주하 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0339 | 방미산 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0339 | 방미산 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0339 | 방미산 | $.biography | org (2회) | Admits even enemy wounded by severity alone, and tears up the note that told the clinic to call itself a spoil ／ 적의 부상도 중증도만으로 들이고, 진료소를 전리품 창구로 부르라는 쪽지를 찢는다. 진료 소견 표를 침상 발치에 붙인다.

- 생업: 중증도 표·진료 소견 게시
- 소속: 흰십자단
- 품계: 전문의
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0339 | 방미산 | $.characterProfile.traits[].behavior | org (1회) | 적의 부상도 중증도만으로 들이고, 진료소를 전리품 창구로 부르라는 쪽지를 찢는다. 진료 소견 표를 침상 발치에 붙인다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정하며, 적아  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0339 | 방미산 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0340 | 수효은 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0340 | 수효은 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0340 | 수효은 | $.biography | org (2회) | Sensitive to the smell of fuel and dislikes verbal power allocation. Regards pressure to divert power to the a ／ 연료 냄새에 예민하고 구두 배전을 싫어한다. 건조기보다 경매 조명에 전력을 돌리라는 압박을 모욕으로 여긴다.

- 생업: 약재 보관 출력 일지·봉인
- 소속: 흰십자단
- 품계: 수련의
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0340 | 수효은 | $.characterProfile.traits[].behavior | org (1회) | 연료 냄새에 예민하고 구두 배전을 싫어한다. 건조기보다 경매 조명에 전력을 돌리라는 압박을 모욕으로 여긴다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0340 | 수효은 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0341 | 매하루 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0341 | 매하루 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0341 | 매하루 | $.biography | org (2회) | Remembers even the particles of the bitter powder, and admits no crate into the treatment ward whose only clea ／ 쓴 가루의 입자까지 기억하고, 포장 문장만 깨끗한 상자를 치료 칸에 들이지 않는다. 자비와 분노가 함께 있다.

- 생업: 약재 오염 복용·열 기록
- 소속: 흰십자단
- 품계: 수련의
- 직함:  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0341 | 매하루 | $.characterProfile.traits[].behavior | org (1회) | 쓴 가루의 입자까지 기억하고, 포장 문장만 깨끗한 상자를 치료 칸에 들이지 않는다. 자비와 분노가 함께 있다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0341 | 매하루 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0342 | 탁은솔 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0342 | 탁은솔 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0342 | 탁은솔 | $.biography | org (2회) | Reads the misalignment of a capsule seam at a glance and sends down from the witness stand any broker who prop ／ 캡슐 이음매의 어긋남을 한눈에 읽고, 구두로 원산지를 바꾸자는 중개인을 증인석에서 내려보낸다. 숫자는 믿되 빈칸 문장은 믿지 않는다.

- 생업: 위조약 유통 시각·증인 기록
- 소속: 흰십자단
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0342 | 탁은솔 | $.characterProfile.traits[].behavior | org (1회) | 캡슐 이음매의 어긋남을 한눈에 읽고, 구두로 원산지를 바꾸자는 중개인을 증인석에서 내려보낸다. 숫자는 믿되 빈칸 문장은 믿지 않는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0342 | 탁은솔 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0343 | 범초이 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0343 | 범초이 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0343 | 범초이 | $.biography | org (2회) | Remembers in the body the sway of the stop on the bridge, and burns the note telling them to call the treatmen ／ 교량 위 정차의 흔들림을 몸으로 기억하고, 치료 칸을 군수 칸으로 부르라는 쪽지를 태운다. 과묵하나 호송증 무게가 비면 문을 잠근다.

- 생업: 의무호송증 환자·약재 중량 기록
- 소속: 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0343 | 범초이 | $.characterProfile.traits[].behavior | org (1회) | 교량 위 정차의 흔들림을 몸으로 기억하고, 치료 칸을 군수 칸으로 부르라는 쪽지를 태운다. 과묵하나 호송증 무게가 비면 문을 잠근다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0343 | 범초이 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0344 | 창해온 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0344 | 창해온 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0344 | 창해온 | $.sections.Anecdote | org (1회) | First, an envoy comes to the White Cross Order's clerk's office carrying the fair copy of the Medical Charter, | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0344 | 창해온 | $.biography | org (2회) | Fair-copies first the sentence that makes no distinction between enemy and ally, and keeps standing at the doo ／ 적과 아군을 가리지 않는 문장을 먼저 정서하고, 우선 치료 조항을 군호로 바꾸라는 사신을 문 앞에 세운다. 숨이 차도 사본은 두 장이다.

- 생업: 의료헌장 서명·인장 대조
- 소속: 흰십자단
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0344 | 창해온 | $.characterProfile.traits[].behavior | org (1회) | 적과 아군을 가리지 않는 문장을 먼저 정서하고, 우선 치료 조항을 군호로 바꾸라는 사신을 문 앞에 세운다. 숨이 차도 사본은 두 장이다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0344 | 창해온 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0344 | 창해온 | $.sections.일화 | org (1회) | 우선 치료 조항을 군호로 바꿔 달라는 사신이 의료헌장 정서본을 들고 흰십자단 서기실에 온다. 창해온은 사신을 문 앞에 세워 두고, 류은비의 헌장 문안과 초나루의 호송 조항 번호를 맞춰 정서본에 섞인 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0345 | 석라온 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0345 | 석라온 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0345 | 석라온 | $.biography | org (2회) | Puts stretcher order ahead of nationality, and hears the order to attach service re-registration to the treatm ／ 들것 순서를 국적보다 앞에 두고, 복무 재등록을 진료 창구에 붙이라는 명령을 모욕으로 듣는다. 줄 선 얼굴을 오래 기억한다.

- 생업: 피난 환자 중증도 게시
- 소속: 흰십자단
- 품계: 수련의 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0345 | 석라온 | $.characterProfile.traits[].behavior | org (1회) | 들것 순서를 국적보다 앞에 두고, 복무 재등록을 진료 창구에 붙이라는 명령을 모욕으로 듣는다. 줄 선 얼굴을 오래 기억한다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0345 | 석라온 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0346 | 근우람 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0346 | 근우람 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0346 | 근우람 | $.biography | org (2회) | Sees the family-unit service registration slip as evidence of treatment refusal, and sends away officers who t ／ 가족 단위 복무등록 쪽지를 치료 거부의 증거로 보고, 침상 앞에서 호적을 읽으라는 장교를 내려보낸다. 예의는 지키되 날짜를 고치는 손은 용서하지 않는다.

- 생업: 치료 거부 시각·재서명 기록
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0346 | 근우람 | $.characterProfile.traits[].behavior | org (1회) | 가족 단위 복무등록 쪽지를 치료 거부의 증거로 보고, 침상 앞에서 호적을 읽으라는 장교를 내려보낸다. 예의는 지키되 날짜를 고치는 손은 용서하지 않는다. 제기동의 중립 의료국 흰십자단에서 담당 전문 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0346 | 근우람 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0347 | 흥다온 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0347 | 흥다온 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0347 | 흥다온 | $.biography | org (2회) | Hears the broadcast calling the quarantine unit a requisition force as an insult, and tears up slips that reco ／ 방역대를 징발 병력으로 부르라는 방송을 모욕으로 듣고, 약재 칸을 군량으로 적는 쪽지를 찢는다. 줄이 길어질수록 목소리는 낮아진다.

- 생업: 징발 쪽지·출입 인원 대조
- 소속: 흰십자단
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0347 | 흥다온 | $.characterProfile.traits[].behavior | org (1회) | 방역대를 징발 병력으로 부르라는 방송을 모욕으로 듣고, 약재 칸을 군량으로 적는 쪽지를 찢는다. 줄이 길어질수록 목소리는 낮아진다. 제기동의 중립 의료국 흰십자단에서 수련의를 지도하고 후계자를 지정 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0347 | 흥다온 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0348 | 백여울 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0348 | 백여울 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0348 | 백여울 | $.biography | org (2회) | Weighs herbs on two scales and refuses any deal that balances on only one. Leaves an appraisal certificate rat ／ 약재 무게를 두 저울로 재고, 한 저울만 맞는 거래는 거절한다. 큰소리 흥정보다 감정서를 남긴다.

- 생업: 약재 감정 대조·출고 보류
- 소속: 흰십자단
- 품계: 수련의
- 직함: 의약 중개  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0348 | 백여울 | $.characterProfile.traits[].behavior | org (1회) | 약재 무게를 두 저울로 재고, 한 저울만 맞는 거래는 거절한다. 큰소리 흥정보다 감정서를 남긴다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0348 | 백여울 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.title | org (2회) | Agwansa Gate Commander ／ 아관사 관문사령관 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.position | org (2회) | Agwansa Commander ／ 아관사 사령관 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0349 | 고서준 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.fields.Title | org (1회) | Agwansa Commander | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.sections.Life | org (1회) | Generation of 2126. Agwansa and the Guui Garrison each choose commanders from their own troops and divide comm | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.biography | org (2회) | **Life.** Generation of 2126. Agwansa and the Guui Garrison each choose commanders from their own troops and d ／ **생애.** 2126년 세대. 아관사와 구의수비대는 각자의 병력에서 지휘관을 뽑고 지휘권을 나눈다. 고서준은 한강진교량공회의 능선 통행을 지킨 뒤 아관사 사령관으로 선출되었다. 구의수비대장 탁서윤 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.relations.incoming[].basis | org (2회) | Under Agwansa Gate Commander Go Seojun ／ 아관사 관문사령관 고서준의 산하 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.fields.직함 | org (1회) | 아관사 사령관 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0349 | 고서준 | $.sections.생애 | org (1회) | 2126년 세대. 아관사와 구의수비대는 각자의 병력에서 지휘관을 뽑고 지휘권을 나눈다. 고서준은 한강진교량공회의 능선 통행을 지킨 뒤 아관사 사령관으로 선출되었다. 구의수비대장 탁서윤과 전쟁·급수  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.position | org (2회) | Agwansa Ridge Sentry ／ 아관사 능선 초병 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0350 | 문하율 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.fields.Title | org (1회) | Agwansa Ridge Sentry | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.Life | org (1회) | Born on 2091-11-19. As of the 2126 opening, holds the post of Agwansa Ridge Sentry and carries on the records  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Agwansa Ridge Sentry. Handles the records of beacon fires, whistle blockades, and incid | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.Ambition | org (1회) | In the post of Agwansa Ridge Sentry, Mun Hayul seeks to make the records of beacon fires, whistle blockades, a | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.Fear | org (1회) | Fears that gaps in the records of the Agwansa Ridge Sentry watch will become a passage for unilateral orders b | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.biography | org (2회) | Mun Hayul is an Agwansa figure practiced in the records of beacon fires, whistle blockades, and incident repor ／ 문하율은 봉화·호각 차단·경위 보고 기록을 손에 익힌 아관사 인물이다. 직선적이고 산바람보다 회의실을 싫어한다. 한 번 본 불빛은 국적보다 먼저 보고한다.

- 생업: 봉화·호각 차단·경위 보고
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 아관사 능선 초병. 봉화와 호각으로 먼저 막고 차단 경위를 양군에 보고한다. 전쟁·급수 공동승인 문서를 초소 당직 원장에도 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 병장. 직함은 아관사 능선 초병. 봉화와 호각으로 먼저 막고 차단 경위를 양군에 보고한다. 전쟁·급수 공동승인 문서를 초소 당직 원장에도 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.fields.직함 | org (1회) | 아관사 능선 초병 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.생애 | org (1회) | 2091-11-19에 태어났다. 2126년 개막 현재 아관사 능선 초병 직무를 맡아 봉화·호각 차단·경위 보고 기록을 잇는다. 직무의 기존 선발·인계 경위는 현재 원장에 보존한다.
- 구의2동의 봉 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.관직 | org (1회) | 품계 병장. 직함은 아관사 능선 초병. 봉화·호각 차단·경위 보고 기록과 당직 인계를 현재 직무 범위 안에서 다룬다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.야망 | org (1회) | 문하율은 아관사 능선 초병 직무에서 봉화·호각 차단·경위 보고 기록을 공개 인계표와 맞물리게 하려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0350 | 문하율 | $.sections.공포 | org (1회) | 아관사 능선 초병 당직의 기록 공백이 후원 문장이 붙은 단독 명령의 통행로가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.position | org (2회) | Agwansa Bridge Supervisor ／ 아관사 교량 감독 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0351 | 안기준 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.fields.Title | org (1회) | Agwansa Bridge Supervisor | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.Life | org (1회) | Born on 2100-05-17. As of the 2126 opening, he holds the post of Agwansa Bridge Overseer and carries on the re | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.Offices | org (1회) | Rank: Company Commander. Title: Agwansa Bridge Overseer. He handles the records of pier cracks, traffic weight | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.Ambition | org (1회) | In his post as Agwansa Bridge Overseer, An Gijun intends to mesh the records of pier cracks, traffic weight di | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.Fear | org (1회) | He fears that gaps in the Agwansa Bridge Overseer duty record will become a passage for unilateral orders bear | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.biography | org (2회) | An Gijun is an Agwansa figure practiced in the records of pier cracks, traffic weight disclosure, and double-s ／ 안기준은 교각 균열·통행 무게 공개·이중 날인 확인 기록을 손에 익힌 아관사 인물이다. 점검 해머를 계약서보다 믿지만, 근거 없는 봉쇄는 병력 낭비라고 본다. 교각 균열을 사람 이름처럼 기억한다.
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 중대장. 직함은 아관사 교량 감독. 교각 균열과 통행 무게를 매일 공개하고, 군 통행은 아관사와 구의수비대의 이중 날인을 요구한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 중대장. 직함은 아관사 교량 감독. 교각 균열과 통행 무게를 매일 공개하고, 군 통행은 아관사와 구의수비대의 이중 날인을 요구한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.fields.직함 | org (1회) | 아관사 교량 감독 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.생애 | org (1회) | 2100-05-17에 태어났다. 2126년 개막 현재 아관사 교량 감독 직무를 맡아 교각 균열·통행 무게 공개·이중 날인 확인 기록을 잇는다. 직무의 기존 선발·인계 경위는 현재 원장에 보존한다.
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.관직 | org (1회) | 품계 중대장. 직함은 아관사 교량 감독. 교각 균열·통행 무게 공개·이중 날인 확인 기록과 당직 인계를 현재 직무 범위 안에서 다룬다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.야망 | org (1회) | 안기준은 아관사 교량 감독 직무에서 교각 균열·통행 무게 공개·이중 날인 확인 기록을 공개 인계표와 맞물리게 하려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0351 | 안기준 | $.sections.공포 | org (1회) | 아관사 교량 감독 당직의 기록 공백이 후원 문장이 붙은 단독 명령의 통행로가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0352 | 하윤목 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0352 | 하윤목 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0352 | 하윤목 | $.biography | org (2회) | Ha Yunmok is an Agwansa Joint Two-Army Working Group figure practiced in the records of passing goods, water s ／ 하윤목은 통과 품목·급수 시간 장부·면제 통행증 검사 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 숫자와 인장을 좋아하고, 무력으로 세를 깎는 장교를 모욕으로 기억한다. 빈 면제 칸을 위험 신 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0352 | 하윤목 | $.relations.incoming[].basis | clergy (1회) | is a priest who transfers Ha Yunmok's tax calculations into the ledger | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0352 | 하윤목 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0353 | 곽민재 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0353 | 곽민재 | $.sections.Anecdote | org (1회) | The Agwansa issues a pump-room opening order with the residual-pressure figure omitted to the Guui Garrison's  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0353 | 곽민재 | $.biography | org (2회) | Gwak Minjae is a Guui Garrison figure practiced in the records of water-supply times, residual-pressure postin ／ 곽민재는 급수 시간·잔압 게시·공동 승인 확인 기록을 손에 익힌 구의수비대 인물이다. 절차를 사랑하고 산악 민병의 속도를 사고 원인으로 본다. 잔압 숫자 없는 명령을 받지 않는다.

- 생업: 급수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0353 | 곽민재 | $.characterProfile.traits[].stress | org (2회) | 공포. 아관사가 구의수비대의 결재 없이 펌프실을 장악해 정수 기록이 끊기는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 아관사가 구의수비대의 결재 없이 펌프실을 장악해 정수 기록이 끊기는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0353 | 곽민재 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 수비대장. 직함은 구의수비대 제한급수 기술자. 급수 시간과 잔압을 게시판에 붙이고, 아관사의 단독 개폐는 구의수비대의 결재와 공동 승인 절차로 막는다. 전쟁과 급수는 아관사와 구의수비대 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0353 | 곽민재 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 수비대장. 직함은 구의수비대 제한급수 기술자. 급수 시간과 잔압을 게시판에 붙이고, 아관사의 단독 개폐는 구의수비대의 결재와 공동 승인 절차로 막는다. 전쟁과 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0353 | 곽민재 | $.sections.일화 | org (1회) | 아관사가 잔압 숫자를 뺀 펌프실 개방 명령을 구의수비대 게시판에 내린다. 곽민재는 구의수비대의 결재와 공동 승인 절차를 걸어 단독 개폐를 막고, 임초원의 펌프 일지로 잔압을 다시 계산해 급수 시간표 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.position | org (2회) | Agwansa Bridge Scout Captain ／ 아관사 교량 척후대장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0354 | 심가은 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.fields.Title | org (1회) | Agwansa Bridge Scout Captain | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.Life | org (1회) | Born on 2081-09-16. As of the opening of 2126, holds the post of Agwansa Bridge Scout Captain and carries on t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Agwansa Bridge Scout Captain. Handles the records of sighting/inference distinction and | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.Ambition | org (1회) | In the post of Agwansa Bridge Scout Captain, Sim Gaeun seeks to make the records of sighting/inference distinc | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.Fear | org (1회) | Fears that a gap in the records of the Agwansa Bridge Scout Captain's watch will become a passage for unilater | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.biography | org (2회) | Sim Gaeun is an Agwansa figure practiced in keeping records that separate sightings from assumptions, and in W ／ 심가은은 목격·추정 구분 기록·위시 목격 보고 기록을 손에 익힌 아관사 인물이다. 보고를 빨리 쓰지만 해석을 보태는 버릇이 있다. 고서준의 신의에 보답하려 한다.

- 생업: 목격·추정 구분 기록· | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 아관사 교량 척후대장. 목격과 추정을 다른 색 먹으로 적게 하지만, 위기 때는 추정 칸을 지우고 목격만 올린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 병장. 직함은 아관사 교량 척후대장. 목격과 추정을 다른 색 먹으로 적게 하지만, 위기 때는 추정 칸을 지우고 목격만 올린다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.fields.직함 | org (1회) | 아관사 교량 척후대장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.생애 | org (1회) | 2081-09-16에 태어났다. 2126년 개막 현재 아관사 교량 척후대장 직무를 맡아 목격·추정 구분 기록·위시 목격 보고 기록을 잇는다. 직무의 기존 선발·인계 경위는 현재 원장에 보존한다.
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.관직 | org (1회) | 품계 병장. 직함은 아관사 교량 척후대장. 목격·추정 구분 기록·위시 목격 보고 기록과 당직 인계를 현재 직무 범위 안에서 다룬다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.야망 | org (1회) | 심가은은 아관사 교량 척후대장 직무에서 목격·추정 구분 기록·위시 목격 보고 기록을 공개 인계표와 맞물리게 하려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0354 | 심가은 | $.sections.공포 | org (1회) | 아관사 교량 척후대장 당직의 기록 공백이 후원 문장이 붙은 단독 명령의 통행로가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0355 | 선솔우 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0355 | 선솔우 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 수비대원. 직함은 구의수비대 구의 펌프실 정비사, 곽민재의 실무 담당자. 마모표와 패킹 날을 벽에 걸고, 아관사의 단독 개폐를 막고 정비 키는 양군 승인 때만 걸이못에서 꺼낸다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0355 | 선솔우 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 수비대원. 직함은 구의수비대 구의 펌프실 정비사, 곽민재의 실무 담당자. 마모표와 패킹 날을 벽에 걸고, 아관사의 단독 개폐를 막고 정비 키는 양군 승인 때만 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0356 | 원예나 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0356 | 원예나 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0356 | 원예나 | $.biography | org (2회) | Won Yena is a Two-Army joint-operations figure of Agwansa who is practiced in pier-crack and transit-invoice d ／ 원예나는 교각 균열·통행 송장 이중 날인 확인 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 통행 무게와 교각 균열을 같은 저울에 올리고, 근거 없는 봉쇄를 병력 낭비라고 본다. 빈 면제 칸이  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0356 | 원예나 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 공동실무원. 직함은 양군 교량 통과 물류상. 교각 균열과 통행 무게를 매일 공개하고, 군 통행 송장은 아관사와 구의수비대의 이중 날인이 있기 전에는 싣지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0356 | 원예나 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 공동실무원. 직함은 양군 교량 통과 물류상. 교각 균열과 통행 무게를 매일 공개하고, 군 통행 송장은 아관사와 구의수비대의 이중 날인이 있기 전에는 싣지 않는 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0356 | 원예나 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0357 | 영석온 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0358 | 판늘샘 | $.position | org (2회) | Agwansa Achasan Ridge Patrol, Mun Hayul's Aide ／ 아관사 아차산 능선 순찰대, 문하율의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0358 | 판늘샘 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.fields.Title | org (1회) | Agwansa Achasan Ridge Patrol, Mun Hayul's Aide | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.Life | org (1회) | Born on 2064-02-08. As of the 2126 opening, holds the post of Agwansa Achasan Ridge Patrol, Mun Hayul's workin | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Agwansa Achasan Ridge Patrol, Mun Hayul's working-level aide. Handles beacon and whistl | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.Ambition | org (1회) | In the post of Agwansa Achasan Ridge Patrol, Mun Hayul's working-level aide, Pan Neulsaem seeks to make the re | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.Fear | org (1회) | Fears that a gap in the duty records of the Agwansa Achasan Ridge Patrol, Mun Hayul's working-level aide, will | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.biography | org (2회) | Pan Neulsaem is an Agwansa figure who has made beacon and whistle blockade and joint-approval document records ／ 판늘샘은 봉화·호각 차단·공동승인 문서 기록을 손에 익힌 아관사 인물이다. 한 번 본 불빛은 국적보다 먼저 보고하고, 회의실의 사후 승인을 초소에 두지 않는다. 직선적이고 산바람보다 인장을 싫어한다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 아관사 아차산 능선 순찰대, 문하율의 실무 담당자. 봉화와 호각으로 먼저 막고 차단 경위를 양군에 보고하되, 전쟁·급수 공동승인 문서를 초소 당직 원장에도 남긴다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 병장. 직함은 아관사 아차산 능선 순찰대, 문하율의 실무 담당자. 봉화와 호각으로 먼저 막고 차단 경위를 양군에 보고하되, 전쟁·급수 공동승인 문서를 초소 당 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.fields.직함 | org (1회) | 아관사 아차산 능선 순찰대, 문하율의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.생애 | org (1회) | 2064-02-08에 태어났다. 2126년 개막 현재 아관사 아차산 능선 순찰대, 문하율의 실무 담당자 직무를 맡아 봉화·호각 차단·공동승인 문서 기록을 잇는다. 직무의 기존 선발·인계 경위는 현재 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.관직 | org (1회) | 품계 병장. 직함은 아관사 아차산 능선 순찰대, 문하율의 실무 담당자. 봉화·호각 차단·공동승인 문서 기록과 당직 인계를 현재 직무 범위 안에서 다룬다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.야망 | org (1회) | 판늘샘은 아관사 아차산 능선 순찰대, 문하율의 실무 담당자 직무에서 봉화·호각 차단·공동승인 문서 기록을 공개 인계표와 맞물리게 하려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0358 | 판늘샘 | $.sections.공포 | org (1회) | 아관사 아차산 능선 순찰대, 문하율의 실무 담당자 당직의 기록 공백이 후원 문장이 붙은 단독 명령의 통행로가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0359 | 천초윤 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0359 | 천초윤 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0359 | 천초윤 | $.biography | org (2회) | Cheon Choyun is an Agwansa Two-Army Joint Operations figure practiced in the delivery records for passage disp ／ 천초윤은 통과 전갈·면제 통행증 배달 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 봉인 끈이 느슨하면 출발을 거부하고, 빈 면제 칸이 찍힌 전갈을 사고 원인으로 본다. 숫자와 인장을 사람 말보 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0359 | 천초윤 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.position | org (2회) | Practical Aide to Sim Ga-eun, Under-Bridge Surveyor of Agwansa ／ 아관사 교량 하부 탐사원, 심가은의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0360 | 동새봄 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.fields.Title | org (1회) | Practical Aide to Sim Ga-eun, Under-Bridge Surveyor of Agwansa | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.Life | org (1회) | Born 2090-08-02. As of the 2126 opening, holds the post of Agwansa Under-Bridge Surveyor, Sim Gaeun's Working  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Agwansa Under-Bridge Surveyor, Sim Gaeun's Working Aide. Handles the under-bridge surve | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.Ambition | org (1회) | In the post of Agwansa Under-Bridge Surveyor, Sim Gaeun's Working Aide, Dong Saebom intends to mesh the under- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.Fear | org (1회) | Fears that gaps in the records of the Agwansa Under-Bridge Surveyor, Sim Gaeun's Working Aide duty shift will  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.biography | org (2회) | Dong Saebom is an Agwansa figure practiced in under-bridge measurement and hostile-crest cross-checking record ／ 동새봄은 교량 하부 실측·적대 문장 대조 기록을 손에 익힌 아관사 인물이다. 목격과 추정을 다른 색 먹으로 적게 하지만, 위기 때는 추정 칸을 지우고 금이 간 관만 남긴다. 보고를 빨리 쓰되 해석을 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 아관사 교량 하부 탐사원, 심가은의 실무 담당자. 실측하지 않은 파손은 점선으로만 남기고, 적대행위 문장은 양군의 확인 전에는 원판에 옮기지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 병장. 직함은 아관사 교량 하부 탐사원, 심가은의 실무 담당자. 실측하지 않은 파손은 점선으로만 남기고, 적대행위 문장은 양군의 확인 전에는 원판에 옮기지 않 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.fields.직함 | org (1회) | 아관사 교량 하부 탐사원, 심가은의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.생애 | org (1회) | 2090-08-02에 태어났다. 2126년 개막 현재 아관사 교량 하부 탐사원, 심가은의 실무 담당자 직무를 맡아 교량 하부 실측·적대 문장 대조 기록을 잇는다. 직무의 기존 선발·인계 경위는 현재 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.관직 | org (1회) | 품계 병장. 직함은 아관사 교량 하부 탐사원, 심가은의 실무 담당자. 교량 하부 실측·적대 문장 대조 기록과 당직 인계를 현재 직무 범위 안에서 다룬다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.야망 | org (1회) | 동새봄은 아관사 교량 하부 탐사원, 심가은의 실무 담당자 직무에서 교량 하부 실측·적대 문장 대조 기록을 공개 인계표와 맞물리게 하려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0360 | 동새봄 | $.sections.공포 | org (1회) | 아관사 교량 하부 탐사원, 심가은의 실무 담당자 당직의 기록 공백이 후원 문장이 붙은 단독 명령의 통행로가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0361 | 방마름 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0361 | 방마름 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0361 | 방마름 | $.biography | org (2회) | Bang Mareum is an Agwansa Two-Army Joint Working Staff figure practiced in recording passage items and valid c ／ 방마름은 통과 품목·면제 통행증 유효 칸 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 빈 면제 칸을 위험 신호로 보고, 무력으로 세를 깎는 장교의 이름을 원장 난외에 오래 남긴다. 숫자와 인장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0361 | 방마름 | $.relations.outgoing[].basis | clergy (1회) | is a priest who transfers Ha Yunmok's tax calculations into the ledger | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0361 | 방마름 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0362 | 수지완 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0363 | 선늘봄 | $.position | org (2회) | Practical Aide to Mun Ha-yul, Ridge Guardpost Base Duty Officer of Agwansa ／ 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0363 | 선늘봄 | $.fields.Affiliation | org (1회) | Russian Legation Command | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.fields.Title | org (1회) | Practical Aide to Mun Ha-yul, Ridge Guardpost Base Duty Officer of Agwansa | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.Life | org (1회) | Born on 2089-10-11. As of the 2126 opening, holds the post of Agwansa Ridge Outpost Base Duty Chief and Mun Ha | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.Offices | org (1회) | Rank: Sergeant. Title: Agwansa Ridge Outpost Base Duty Chief, Mun Hayul's operations aide. Handles the records | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.Ambition | org (1회) | From the post of Agwansa Ridge Outpost Base Duty Chief and Mun Hayul's operations aide, Seon Neulbom seeks to  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.Fear | org (1회) | Fears that a gap in the records of the duty watch of the Agwansa Ridge Outpost Base Duty Chief and Mun Hayul's | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.biography | org (2회) | Seon Neulbom is an Agwansa figure well versed in the ridge outpost duty roster and beacon-time posting records ／ 선늘봄은 능선 초소 당직 명부·봉화 시각 게시 기록을 손에 익힌 아관사 인물이다. 초소 당직을 집처럼 여기고, 공동승인 문서를 초소에 두라는 쪽지를 태운다. 한 번 본 불빛을 교대 일지에 먼저 적는 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 병장. 직함은 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자. 당직 명과 봉화 시각을 같은 칠판에 붙이고, 외부 무장 접근은 양군의 공동 승인 없이 막는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.characterProfile.traits[].behavior | org (1회) | 확인된 당직 수행과 제한: 관직. 품계 병장. 직함은 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자. 당직 명과 봉화 시각을 같은 칠판에 붙이고, 외부 무장 접근은 양군의 공동 승인 없이 막 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.fields.소속 | org (1회) | 아관사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.fields.직함 | org (1회) | 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.생애 | org (1회) | 2089-10-11에 태어났다. 2126년 개막 현재 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자 직무를 맡아 능선 초소 당직 명부·봉화 시각 게시 기록을 잇는다. 직무의 기존 선발·인계  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.관직 | org (1회) | 품계 병장. 직함은 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자. 능선 초소 당직 명부·봉화 시각 게시 기록과 당직 인계를 현재 직무 범위 안에서 다룬다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.야망 | org (1회) | 선늘봄은 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자 직무에서 능선 초소 당직 명부·봉화 시각 게시 기록을 공개 인계표와 맞물리게 하려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0363 | 선늘봄 | $.sections.공포 | org (1회) | 아관사 능선 초소 기지 당직장, 문하율의 실무 담당자 당직의 기록 공백이 후원 문장이 붙은 단독 명령의 통행로가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0364 | 원다결 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=geography:duchy:11215 |
| person-0364 | 원다결 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0364 | 원다결 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0364 | 원다결 | $.biography | org (2회) | Won Dagyeol is a Two-Army joint working figure of Agwansa who is well versed in the records of market prices,  ／ 원다결은 시장 시세·통과 품목 게시·출고 확인 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 통과세를 숨기는 상인을 저울 앞에서 돌려보내고, 군사 면제 칸을 시세로 파는 말을 시장에서 쫓아낸다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0364 | 원다결 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0365 | 영한뫼 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0366 | 판초담 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0367 | 매서담 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0367 | 매서담 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0367 | 매서담 | $.biography | org (2회) | Mae Seodam is a figure of the Agwansa Two-Army Joint Working Office who has mastered the records of passage ti ／ 매서담은 통과 시각·봉화 색 기록·면제 증언 봉인 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 교량 통과증의 접힌 자국까지 기억하고, 군사 면제 칸을 증언으로 포장하는 사신을 내려보낸다. 침묵 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0367 | 매서담 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0368 | 탁윤재 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0368 | 탁윤재 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0368 | 탁윤재 | $.biography | org (2회) | Tak Yunjae is a Joint Working figure of the Two Armies at Agwansa, practiced in keeping collision-time and res ／ 탁윤재는 충돌 시각·잔압 수치 일지 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 난간 충격의 각도를 몸으로 기억하고, 급수 호스를 군수 줄로 바꾸라는 쪽지를 태운다. 말은 짧고 발자국은 정확하 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0368 | 탁윤재 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0369 | 범한들 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0369 | 범한들 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0369 | 범한들 | $.biography | org (2회) | Beom Handeul is a Joint Working figure of the Two Armies at Agwansa, practiced in cross-checking water supply  ／ 범한들은 급수계약 만료 시각·잔량 표 대조 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 만료일을 손가락으로 세고, 구두로 보호 연장을 증언하자는 사신을 증인석에서 내려보낸다. 숫자는 믿되 빈칸 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0369 | 범한들 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0370 | 창지안 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0370 | 창지안 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0370 | 창지안 | $.biography | org (2회) | Chang Ji-an is an Agwansa Two-Army Joint Working figure practiced in the records of requisition slips, headcou ／ 창지안은 징발 쪽지·통행 인원 대조·공동 승인 확인 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 능선 초소의 빈집을 먼저 세고, 수비대를 아관사 징발로 부르라는 방송을 모욕으로 듣는다. 줄이  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0370 | 창지안 | $.characterProfile.traits[].behavior | org (2회) | 능선 초소의 빈집을 먼저 세고, 수비대를 아관사 징발로 부르라는 방송을 모욕으로 듣는다. 줄이 길어질수록 목소리는 낮아진다. ／ 확인된 당직 수행과 제한: 관직. 품계 공동실무원. 직함은 양군 외부 징발 피난 인파 대표. 징발 쪽지와 실제 통행 인원을 저녁마다 대조하고, 아관사와 구의수비대의 공동 승인이 내려오기 전에는 인파 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0370 | 창지안 | $.characterProfile.traits[].description | org (1회) | 관직. 품계 공동실무원. 직함은 양군 외부 징발 피난 인파 대표. 징발 쪽지와 실제 통행 인원을 저녁마다 대조하고, 아관사와 구의수비대의 공동 승인이 내려오기 전에는 인파를 해산시키지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0370 | 창지안 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0371 | 초태온 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0371 | 초태온 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0371 | 초태온 | $.biography | org (2회) | Cho Taeon is a Two-Army Joint Working Staff member of Agwansa, practiced in the records of pass messages and t ／ 초태온은 통과 전갈·증인 없는 소문 걸러내기 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 회의 호송의 통과 시각을 봉인보다 먼저 확인하고, 구두 합의를 통행증으로 바꾸려는 사신을 문 앞에 세운 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0371 | 초태온 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0372 | 석주아 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0372 | 석주아 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0372 | 석주아 | $.biography | org (2회) | Seok Jua is a Two-Army Joint Working Staff member of Agwansa, practiced in the records of flag ratification da ／ 석주아는 깃발 인준일 기록·사후 추인 증인 확인 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 헌장 사본의 접힌 자국까지 기억하고, 늦게 온 인준을 소급하자고 하면 함을 잠근다. 날짜를 고치는  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0372 | 석주아 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0373 | 근바름 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-0373 | 근바름 | $.fields.Affiliation | org (1회) | Agwansa Joint Two-Army Working Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0373 | 근바름 | $.biography | org (2회) | Geun Bareum is a figure of the Agwansa Two-Army Joint Operations, practiced in the joint-escort assistant sign ／ 근바름은 공동호송 보조 서명·증인 대조 기록을 손에 익힌 아관사 양군 공동실무 인물이다. 먹물이 마르기 전의 구두 통과를 보조 서명으로 치지 않는다. 조용하나 교량 조항이 비면 붓을 내려놓는다.

 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0373 | 근바름 | $.fields.소속 | org (1회) | 아관사 양군 공동실무 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0374 | 남윤경 | $.fields.Work Location | clergy (1회) | Myeongdong administrative dong area. Binds Myeongdong Station's ratifications and Arc sanctuary's ritual and a | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0374 | 남윤경 | $.sections.Life | clergy (1회) | Generation of 2126. Nam Yungyeong worked at the Arc sanctuary altar and Arc registers, 74 Myeongdong-gil, Jung | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0374 | 남윤경 | $.biography | clergy (1회) | **Life.** Generation of 2126. Nam Yungyeong worked at the altar and the Arc register of Arc sanctuary, 74 Myeo | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0375 | 은태호 | $.sections.Life | clergy (1회) | Born on 2086-08-22, Eun Taeho serves as the election vote-count witness deacon at the Myeongdong Station Arc o | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0375 | 은태호 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0375 | 은태호 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0375 | 은태호 | $.biography | clergy (1회) | In the election vote-count witness deacon's duties, Eun Taeho first cross-checks the vote-count testimony and  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0375 | 은태호 | $.relations.incoming[].basis | clergy (2회) | A priest who backs Eun Taeho's auction on site, ／ A priest who transcribes Eun Taeho's bids into the ledger, | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0376 | 라진우 | $.sections.Life | clergy (1회) | Born on 2066-04-24, Ra Jinu serves as the Arc register custodian deacon at the Myeongdong Station Arc office i | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0376 | 라진우 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0376 | 라진우 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0376 | 라진우 | $.biography | clergy (1회) | In their work as Arc Register Custodian Believer, Ra Jinu first cross-checks the records of Arc register custo | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0377 | 전나경 | $.sections.Life | clergy (1회) | Born on 2075-07-04, Jeon Nagyeong serves as Myeongdong Station Relief Believer at the Myeongdong Station Arc o | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0377 | 전나경 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0377 | 전나경 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0377 | 전나경 | $.biography | clergy (1회) | In her work as Myeongdong Station Relief Believer, Jeon Nagyeong first cross-checks the records of relief supp | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0378 | 남시윤 | $.sections.Life | clergy (1회) | Nam Siyun, born on 2080-02-16, serves as the Arc Presbyterate Election Affairs Believer at the Myeongdong Stat | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0378 | 남시윤 | $.sections.Ambition | clergy (1회) | Protects the independence of the clergy's secret ballot and answers objections over the popeless archbishop el | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0378 | 남시윤 | $.biography | clergy (1회) | In his work as the Arc Presbyterate Election Affairs Believer, Nam Siyun first cross-checks the records of the | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0379 | 문도윤 | $.sections.Life | clergy (1회) | Mun Doyun, born on 2067-01-31, serves as the Election Procedure Inspection Believer at the Myeongdong Station  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0379 | 문도윤 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0379 | 문도윤 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0379 | 문도윤 | $.biography | clergy (1회) | In his work as the Election Procedure Inspection Believer, Mun Doyun first cross-checks the election procedure | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0380 | 천나솔 | $.sections.Life | clergy (1회) | Cheon Nasol, born on 2067-03-23, serves as the Ballot Box Seal Maintenance Believer at the Myeongdong Station  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0380 | 천나솔 | $.sections.Relationships | clergy (1회) | A priest who backs Eun Taeho's auction on site, and aligns Dong Mion's intake weights to the same mark. Contes | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0380 | 천나솔 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0380 | 천나솔 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0380 | 천나솔 | $.biography | clergy (1회) | Cheon Nasol first cross-checks the seal-maintenance and assistance records in the duties of the Ballot Box Sea | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0380 | 천나솔 | $.relations.outgoing[].basis | clergy (1회) | A priest who backs Eun Taeho's auction on site, | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0381 | 동미온 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0381 | 동미온 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0381 | 동미온 | $.biography | clergy (1회) | In the duties of the Congregation Supply Intake Believer, Dong Mion first cross-checks the congregation supply | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0382 | 방늘재 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0382 | 방늘재 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0382 | 방늘재 | $.biography | clergy (1회) | Bang Neuljae, in the work of Myeongdong Station Relief Duty Believer, first cross-checks the relief-duty suppo | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0383 | 수한별 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Ballot-Box Night Guard Believer. He handles ballot-box night guard and assistance work, | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0383 | 수한별 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0383 | 수한별 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0383 | 수한별 | $.biography | clergy (1회) | Su Hanbyeol, in the work of Ballot-Box Night Guard Believer, first cross-checks the ballot-box night guard and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0384 | 선다솜 | $.sections.Life | clergy (1회) | Born on 2075-03-03, Seon Dasom serves as Believers' Assembly Messenger Believer at the Myeongdong Station Arc  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0384 | 선다솜 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Believers' Assembly Messenger Believer. She handles priests' assembly messenger and ass | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0384 | 선다솜 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0384 | 선다솜 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0384 | 선다솜 | $.biography | clergy (1회) | Seon Dasom first cross-checks the Clergy Summons Herald/Assistant records in the duties of Clergy Summons Hera | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0385 | 원주온 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0385 | 원주온 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0385 | 원주온 | $.biography | clergy (1회) | Won Juon first cross-checks the Arc Vault Inspection/Assistant records in the duties of Arc Vault Inspection B | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0386 | 영미결 | $.sections.Relationships | clergy (1회) | A priest who transfers Eun Taeho's asking prices into the ledger, and leaves Seon Dasom's winning-bid message  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0386 | 영미결 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0386 | 영미결 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0386 | 영미결 | $.biography | clergy (1회) | Yeong Migyeol first cross-checks election-record transcription and assistance records in the duties of the Ele | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0386 | 영미결 | $.relations.outgoing[].basis | clergy (1회) | A priest who transcribes Eun Taeho's bids into the ledger, | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0387 | 판효담 | $.sections.Life | clergy (1회) | Born on 2086-01-15, Pan Hyodam serves as Storage Locker Duty Believer of Myeongdong Station at the Myeongdong  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0387 | 판효담 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Myeongdong Station Storage Locker Duty Believer. Handles locker-duty and election-assis | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0387 | 판효담 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0387 | 판효담 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0387 | 판효담 | $.biography | clergy (1회) | In the duties of the Myeongdong Station Storage Locker Duty Believer, Pan Hyodam first cross-checks locker-dut | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0388 | 천솔빛 | $.sections.Life | clergy (1회) | Born on 2090-03-28, Cheon Solbit serves as Myeongdong Station Confirmation Register Monk at the Myeongdong Sta | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0388 | 천솔빛 | $.sections.Offices | clergy (1회) | Rank: Monk. Title: Myeongdong Station Confirmation Register Monk. Handles confirmation-register cross-checking | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0388 | 천솔빛 | $.sections.Ambition | clergy (1회) | To protect the priests' convocation seal so that the procedure of the next archbishop's secret election and My | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0388 | 천솔빛 | $.sections.Fear | clergy (1회) | That the priests' convocation seal will be erased, and that their own signature will be doubted in the legitim | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0388 | 천솔빛 | $.sections.Intervention | clergy (1회) | Can testify to objections regarding election procedure by cross-checking the signatures on the priests' convoc | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0388 | 천솔빛 | $.biography | clergy (1회) | Cheon Solbit first cross-checks the ratification roll and election-assistance records in the work of the Myeon | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0389 | 동예솔 | $.sections.Offices | clergy (1회) | Rank: Friar. Title: Arc Election Seal Friar. Handles ballot-box sealing and election assistance, and in the pr | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0389 | 동예솔 | $.sections.Ambition | clergy (1회) | To protect the priests' convocation seal so that the procedure of the next archbishop's secret election and My | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0389 | 동예솔 | $.sections.Fear | clergy (1회) | That the priests' convocation seal will be erased, and that their own signature will be doubted in the legitim | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0389 | 동예솔 | $.sections.Intervention | clergy (1회) | Can testify to objections regarding election procedure by cross-checking the signatures on the priests' convoc | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0389 | 동예솔 | $.biography | clergy (1회) | Dong Yesol first cross-checks the ballot-box sealing and election-assistance records in the work of Arc Electi | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0390 | 방석담 | $.sections.Offices | clergy (1회) | Rank: Friar. Title: Myeongdong Station Altar Equipment Friar. Handles altar equipment inspection and election  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0390 | 방석담 | $.sections.Ambition | clergy (1회) | To protect the priests' convocation seal so that the procedure of the next archbishop's secret election and My | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0390 | 방석담 | $.sections.Fear | clergy (1회) | That the priests' convocation seal will be erased, and that their own signature will be doubted in the legitim | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0390 | 방석담 | $.sections.Intervention | clergy (1회) | Can testify to objections regarding election procedure by cross-checking the signatures on the priests' convoc | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0390 | 방석담 | $.biography | clergy (1회) | Bang Seokdam first cross-checks the altar equipment inspection and election assistance records in his work as  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0391 | 흥예나 | $.sections.Life | clergy (1회) | Born on 2077-02-07, Heung Yena serves as the Election Objection Intake Believer at the Myeongdong Station Arc  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0391 | 흥예나 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Election Objection Intake Believer. She handles election objection intake and assistanc | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0391 | 흥예나 | $.sections.Anecdote | clergy (1회) | In the week Han Jaemok's ration price pressure reached Myeongdong Station, objection filings about the electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0391 | 흥예나 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0391 | 흥예나 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0391 | 흥예나 | $.biography | clergy (1회) | Heung Yena first cross-checks the election objection intake and assistance records in her work as the Election | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0392 | 매리울 | $.sections.Life | clergy (1회) | Born on 2101-06-10, Mae Riul serves as the Arc Supplies Inspection Believer at the Myeongdong Station Arc offi | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0392 | 매리울 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Arc Supplies Inspection Believer. She handles Arc supplies inspection and assistance, a | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0392 | 매리울 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0392 | 매리울 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0392 | 매리울 | $.biography | clergy (1회) | Maeriul first cross-checks the Arc supply inspection and assistance records in her work as Arc Supply Inspecti | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0393 | 탁필호 | $.sections.Life | clergy (1회) | Born on 2068-11-27, Tak Pilho serves as Myeongdong Station Refugee Relief Believer at the Arc office of Myeong | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0393 | 탁필호 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Myeongdong Station Refugee Relief Believer. He handles refugee relief assistance and el | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0393 | 탁필호 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0393 | 탁필호 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0393 | 탁필호 | $.biography | clergy (1회) | Tak Pilho first cross-checks refugee relief assistance and election support records in his work as Myeongdong  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0394 | 범채온 | $.sections.Life | clergy (1회) | Born on 2067-11-18, Beom Chaeon serves as Relief Believer of Myeongdong Station at the Arc office of Myeongdon | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0394 | 범채온 | $.sections.Offices | clergy (1회) | Rank: Believer. Title: Relief Believer of Myeongdong Station. She handles relief distribution and safekeeping  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0394 | 범채온 | $.sections.Anecdote | clergy (1회) | On the day Bae Ujin's side's military grain pre-purchase request arrived at the Myeongdong Station relief coun | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0394 | 범채온 | $.sections.Ambition | clergy (1회) | Protects the independence of the clergy's secret ballot and answers objections over the popeless archbishop el | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0394 | 범채온 | $.biography | clergy (1회) | Beom Chaeon first cross-checks the relief distribution and congregation vote record-keeping files in his work  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0395 | 창고운 | $.sections.Life | clergy (1회) | Chang Goun, born on 2085-01-31, serves as election clerk deacon at the Myeongdong Station congregation office  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0395 | 창고운 | $.sections.Anecdote | clergy (1회) | On the same day, Chang Goun is assigned both the fair-copying of the petition and clauses to go into Jeong Yur | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0395 | 창고운 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0395 | 창고운 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0395 | 창고운 | $.biography | clergy (1회) | Chang Goun first cross-checks the congregation election clerk and assistant records in his work as the congreg | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0396 | 초시람 | $.sections.Life | clergy (1회) | Cho Siram, born on 2086-12-13, serves as election witness deacon at the Myeongdong Station congregation office | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0396 | 초시람 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0396 | 초시람 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0396 | 초시람 | $.biography | clergy (1회) | Cho Si-ram first cross-checks the election testimony and assistance records in the work of Election Witness Be | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0397 | 석오름 | $.sections.Life | clergy (1회) | Born on 2070-12-06, Seok Oreum serves as Election Validity Witness Believer at the Arc office of Myeongdong St | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0397 | 석오름 | $.sections.Ambition | clergy (1회) | Protects the Arc register and the election seals so that the procedure of the next archbishop's secret electio | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0397 | 석오름 | $.sections.Fear | clergy (1회) | Fear that the Arc register and election seals will be erased and that their own signature will be doubted in t | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0397 | 석오름 | $.biography | clergy (1회) | Seok Oreum first cross-checks the election validity testimony and assistance records in the work of Election V | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0398 | 함도겸 | $.sections.Life | clergy (1회) | Born on 2079-09-10, Ham Do-gyeom serves as Myeongdong Station Confirmation Roll Duty Officer at the Arc office | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0398 | 함도겸 | $.sections.Anecdote | clergy (1회) | Ahead of the archbishop election, a blank appears in the shift handover record where a signature is missing. H | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0398 | 함도겸 | $.sections.Fear | clergy (1회) | That, in the turmoil of the next archbishop's election, the signatures in the Myeongdong Station Confirmation  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0398 | 함도겸 | $.biography | clergy (1회) | Ham Dogyeom first cross-checks the approval roster handover records during his duty at the Myeongdong Station  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0399 | 정유라 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0399 | 정유라 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0399 | 정유라 | $.fields.Duty | org (1회) | Jeongdong Labor Federation Chairperson | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0400 | 하서진 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0400 | 하서진 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0400 | 하서진 | $.sections.Duty | org (1회) | The community role is union member, and the duty is contract clerk. This duty is an internal function of the J | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0400 | 하서진 | $.biography | org (1회) | At the Sicheong Station union workshop in the Permanent Winter, Ha Seojin first cross-checks the contract cler | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0401 | 곽은재 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0401 | 곽은재 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0401 | 곽은재 | $.sections.Duty | org (1회) | The community role is union member, and the duty is audit assistant. This duty is an internal function of the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0401 | 곽은재 | $.biography | org (1회) | At the City Hall Station union workshop in the Permanent Winter, Gwak Eunjae first cross-checks the audit-assi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0402 | 심유리 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0402 | 심유리 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0402 | 심유리 | $.sections.Life | org (1회) | Born on 2102-05-16, Sim Yuri handles Covenant Mediator work at the City Hall Station union workshop in the Per | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0402 | 심유리 | $.sections.Duty | org (1회) | The community role is union member and the duty is Covenant Mediator. This duty is an internal function of the | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0402 | 심유리 | $.biography | org (1회) | At the City Hall Station union workshop in the Permanent Winter, Sim Yuri first cross-checks the Covenant Medi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0403 | 은보람 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0403 | 은보람 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0403 | 은보람 | $.sections.Life | org (1회) | Born on 2066-03-28, Eun Boram serves as clerk of the Union Skill Review Committee at the Sicheong Station Unio | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0403 | 은보람 | $.sections.Duty | org (1회) | The community role is union member, and the duty is clerk of the Union Skill Review Committee. This duty is an | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0403 | 은보람 | $.biography | org (1회) | At the Sicheong Station Union Workshop in the Permanent Winter, Eun Boram first cross-checks the Union Skill R | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0403 | 은보람 | $.relations.incoming[].basis | clergy (1회) | is the priest who supports Eun Boram's recommendation rules on the ground, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0404 | 안태경 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0404 | 안태경 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0404 | 안태경 | $.sections.Life | org (1회) | Born on 2086-06-13, An Taegyeong serves as clerk of the Union Member Election Commission at the Sicheong Stati | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0404 | 안태경 | $.sections.Duty | org (1회) | The community role is union member, and the duty is clerk of the Union Member Election Commission. This duty i | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0404 | 안태경 | $.biography | org (1회) | At the Sicheong Station Union Workshop in the Permanent Winter, An Taegyeong first cross-checks the Union Memb | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0405 | 수늘결 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0405 | 수늘결 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0405 | 수늘결 | $.sections.Life | org (1회) | Born on 2095-05-09, Su Neulgyeol works at the Sicheong Station Guild workshop in the permanent winter as Worki | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0405 | 수늘결 | $.sections.Duty | org (1회) | The communal role is guild member, and the duty is Working-Level Aide to Eun Boram, Mechanic at the Sicheong S | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0405 | 수늘결 | $.biography | org (1회) | At the Sicheong Station Guild workshop in the permanent winter, Su Neulgyeol first cross-checks the duty recor | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0405 | 수늘결 | $.relations.outgoing[].basis | clergy (1회) | is the priest who supports Eun Boram's recommendation rules on the ground, and | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0406 | 선초별 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=geography:duchy:11680 |
| person-0406 | 선초별 | $.confirmedHoldings[].name.ko | org (1회) | Gangnam-gu Jeongdong Labor Federation Ducal Domain Direct Holdings | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0406 | 선초별 | $.openingTitles[].name | org (1회) | Gangnam-gu Jeongdong Federation of Labor Unions Duchy | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0406 | 선초별 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0406 | 선초별 | $.sections.Life | org (1회) | Born on 2101-08-31, Seon Chobyeol works at the Sicheong Station Guild workshop in the permanent winter as Work | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0406 | 선초별 | $.sections.Duty | org (1회) | The communal role is guild member, and the duty is Working-Level Aide to Ha Seojin, Logistics Merchant of the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0406 | 선초별 | $.biography | org (1회) | Before anything else, Seon Chobyeol cross-checks the duty records and open-vote signatures for the Jeongdong C | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0407 | 원새울 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=geography:duchy:11650 |
| person-0407 | 원새울 | $.confirmedHoldings[].name.ko | org (1회) | Seocho-gu Jeongdong Labor Federation Ducal Domain Direct Holdings | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0407 | 원새울 | $.openingTitles[].name | org (1회) | Seocho District Jeongdong Labor Federation Duchy | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0407 | 원새울 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0407 | 원새울 | $.sections.Life | org (1회) | Born on 2097-01-20, Won Saeul handles the duties of Convention Council Clinic Station Medic at the Sicheong St | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0407 | 원새울 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Convention Council Clinic Station Medic. This duty is an i | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0407 | 원새울 | $.biography | org (1회) | Before anything else, Won Saeul cross-checks the duty records and open-vote signatures for the Convention Coun | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0408 | 영마온 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0408 | 영마온 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0408 | 영마온 | $.sections.Life | org (1회) | Born on 2086-09-13, Yeong Maon handles the duties of the Southern Outskirts Patrol at the Sicheong Station uni | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0408 | 영마온 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Southern Outskirts Patrol. This duty is an internal functi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0408 | 영마온 | $.biography | org (1회) | At the Sicheong Station union workshop in the Permanent Winter, Yeong Maon first cross-checks the Southern Out | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0409 | 판지솔 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0409 | 판지솔 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0409 | 판지솔 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Union General Assembly Courier and An Taegyeong's working- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0409 | 판지솔 | $.biography | org (1회) | At the Sicheong Station union workshop in the Permanent Winter, Pan Jisol first cross-checks the work records  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0410 | 천늘우 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0410 | 천늘우 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0410 | 천늘우 | $.sections.Life | org (1회) | Cheon Neuru, born 2099-06-04, takes on the duties of Sicheong Station outer scout at the Sicheong Station Guil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0410 | 천늘우 | $.sections.Duty | org (1회) | The community role is guild member, and the duty is Sicheong Station outer scout. This duty is an internal fun | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0410 | 천늘우 | $.biography | org (1회) | At the Sicheong Station Guild workshop in the Permanent Winter, Cheon Neuru first cross-checks the Sicheong St | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0411 | 동새결 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0411 | 동새결 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0411 | 동새결 | $.sections.Life | org (1회) | Dong Saegyeol, born 2075-09-09, takes on the duties of working-level aide to Gwak Eunjae, Loss Compensation Au | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0411 | 동새결 | $.sections.Duty | org (1회) | The community role is guild member, and the duty is working-level aide to Gwak Eunjae, Loss Compensation Audit | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0411 | 동새결 | $.biography | org (1회) | At the Sicheong Station Guild workshop in the Permanent Winter, Dong Saegyeol first cross-checks the duty reco | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0412 | 방마빛 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0412 | 방마빛 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0412 | 방마빛 | $.sections.Duty | org (1회) | The community role is Branch Chief, and the duty is Sicheong Station Waiting Hall Post Chief. This duty is an  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0412 | 방마빛 | $.biography | org (1회) | In the permanent winter at the Sicheong Station union workshop, Bang Mabit first cross-checks the Sicheong Sta | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0413 | 선한솜 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0413 | 선한솜 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0413 | 선한솜 | $.sections.Duty | org (1회) | The community role is Branch Chief, and the duty is Underground Facility Defense Squad Post Chief. This duty i | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0413 | 선한솜 | $.biography | org (1회) | Seon Hansom first cross-checks Underground Facility Defense Team Post Chief work records against public-vote s | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0414 | 원초온 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0414 | 원초온 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0414 | 원초온 | $.sections.Duty | org (1회) | The community role is member and the duty is Sicheong Station Guild Vehicle Depot Duty Chief. This duty is an  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0414 | 원초온 | $.biography | org (1회) | Won Choon first cross-checks Sicheong Station Guild Vehicle Depot Duty Chief work records against public-vote  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0415 | 천늘샘 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0415 | 천늘샘 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0415 | 천늘샘 | $.sections.Life | org (1회) | Cheon Neulsaem, born on 2098-05-14, serves as Chief Operator of Archive-Assembly Emergency Power at the Sicheo | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0415 | 천늘샘 | $.sections.Duty | org (1회) | The community role is branch chief, and the duty is Chief Operator of Archive-Assembly Emergency Power. This d | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0415 | 천늘샘 | $.biography | org (1회) | At the Sicheong Station Union workshop in the Permanent Winter, Cheon Neulsaem first cross-checks the duty rec | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0416 | 근주하 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.fields.Duty | org (1회) | Jeongdong Labor Federation Joint Negotiation Signing Clerk | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.sections.Life | org (1회) | Geun Juha, born on 2099-07-01, serves as Joint Bargaining Signature Clerk of the Jeongdong Labor Federation at | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Joint Bargaining Signature Clerk of the Jeongdong Labor Fe | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.sections.Goals | org (1회) | Geun Juha seeks to keep the signing, handover, and disclosure procedures of the Joint Bargaining Signature Cle | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.sections.Fear | org (1회) | That the signature or handover records of the Joint Bargaining Signature Clerk duty of the Jeongdong Labor Fed | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0416 | 근주하 | $.biography | org (1회) | At the Sicheong Station Union workshop in the Permanent Winter, Geun Juha first cross-checks the duty records  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0417 | 흥미리 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0417 | 흥미리 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0418 | 매도한 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0418 | 매도한 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0418 | 매도한 | $.biography | org (1회) | Mae Do-han first cross-checks the Unification Proposal draft stakeholder work records against the public vote  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0419 | 탁세온 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0419 | 탁세온 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0419 | 탁세온 | $.sections.Life | org (1회) | Born on 2094-08-30, Tak Se-on handles the water-supply contract signature witness work at the City Hall Statio | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0419 | 탁세온 | $.sections.Duty | org (1회) | The community role is union member, and the duty is water-supply contract signature witness. This duty is an i | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0419 | 탁세온 | $.biography | org (1회) | Tak Se-on first cross-checks the water-supply contract signature witness work records against the public vote  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0420 | 범하겸 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0420 | 범하겸 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0420 | 범하겸 | $.sections.Life | org (1회) | Beom Hagyeom, born 2091-03-11, assists with multi-state ratification audits at the City Hall Station union wor | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0420 | 범하겸 | $.sections.Duty | org (1회) | His community role is union member, and his duty is multi-state ratification audit assistant. This duty is an  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0420 | 범하겸 | $.biography | org (1회) | At the City Hall Station union workshop in the Permanent Winter, Beom Hagyeom first cross-checks the multi-sta | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0421 | 창은찬 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0421 | 창은찬 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0421 | 창은찬 | $.sections.Life | org (1회) | Chang Eunchan, born 2064-08-01, serves as Requisitioned Refugee Crowd Representative at the City Hall Station  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0421 | 창은찬 | $.sections.Duty | org (1회) | Their community role is union member, and their duty is Requisitioned Refugee Crowd Representative. This duty  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0421 | 창은찬 | $.biography | org (1회) | At the City Hall Station union workshop in the Permanent Winter, Chang Eunchan first cross-checks the Requisit | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0422 | 초진솔 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0422 | 초진솔 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0422 | 초진솔 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Black Dispatch Train Inquiry Witness. This duty is an inte | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0422 | 초진솔 | $.biography | org (1회) | At the Sicheong Station union workshop in the Permanent Winter, Cho Jinsol first cross-checks the Black Dispat | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0423 | 노세람 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0423 | 노세람 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0423 | 노세람 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Contract Audit Clerk. This duty is an internal function of | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0423 | 노세람 | $.biography | org (1회) | At the Sicheong Station union workshop in the Permanent Winter, No Seram first cross-checks the Contract Audit | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0424 | 이민석 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0424 | 이민석 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0424 | 이민석 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0424 | 이민석 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0424 | 이민석 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0424 | 이민석 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0424 | 이민석 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0425 | 박도윤 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0425 | 박도윤 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0425 | 박도윤 | $.biography | org (2회) | Even when a message is late, Bak Doyun does not erase the receipt time to speed up the proposal's handover.

- ／ 박도윤은 전갈이 늦어도 수령 시각을 지워 제안서의 인계를 앞당기지 않는다.

- 소속: 규격맹
- 생업: 환승 전갈 전달
- 품계: 조합원
- 직함: 작업반 전령
**생애.** 2126년 세대. 신 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0425 | 박도윤 | $.characterProfile.traits[].stress | org (2회) | 작업반 전령 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0425 | 박도윤 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0429 | 조예준 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0436 | 신승민 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0436 | 신승민 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.biography | org (2회) | He chooses first the path that keeps the duty unbroken. He trusts a single line in the ledger more than loud t ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2095-04 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0436 | 신승민 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0441 | 류동현 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=geography:duchy:11590 |
| person-0441 | 류동현 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0441 | 류동현 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0441 | 류동현 | $.biography | org (2회) | Ryu Donghyeon reports power faults but leaves grain stock and ration judgments to I Ilseop.

- Affiliation: St ／ 류동현은 전력 이상을 보고하되 곡물 재고와 배급 판단은 이일섭의 몫으로 남긴다.

- 소속: 규격맹
- 생업: 경비·순찰
- 품계: 조합원
- 직함: 전력장치 순찰대
**생애.** 2126년 세대. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0441 | 류동현 | $.characterProfile.traits[].stress | org (2회) | 전력장치 순찰대 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0441 | 류동현 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0443 | 고영호 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0443 | 고영호 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0443 | 고영호 | $.sections.Ambition | clergy (1회) | As Workshop Courier on duty, Go Yeongho hopes to keep the Registry Church's ledger connected without a break. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0443 | 고영호 | $.sections.Fear | clergy (1회) | Go Yeongho fears that if the Workshop Courier duty goes vacant, the Registry Church's passage will become a ho | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0443 | 고영호 | $.biography | clergy (1회) | Go Yeongho chooses first not to break the duty chain. Go Yeongho trusts a single line in the ledger over loud  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0445 | 양서현 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=geography:duchy:11140 |
| person-0445 | 양서현 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0446 | 앙투안 르페브르 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0446 | 앙투안 르페브르 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0446 | 앙투안 르페브르 | $.biography | org (2회) | Antoine Lefebvre handles de-icing of the transmission tower and antenna maintenance. Antoine Lefebvre reports  ／ 앙투안 르페브르는 송신탑 결빙 제거·안테나 정비 업무를 맡는다. 앙투안 르페브르는 결빙을 제거한 송신탑의 상태와 안테나 정비 시각을 아데올라 아데예미에게 전한다.

- 소속: 환적국
- 품계: 주사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0446 | 앙투안 르페브르 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0446 | 앙투안 르페브르 | $.sections.야망 | org (1회) | 중계 당직 업무의 송신탑 결빙 제거·안테나 정비 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0452 | 심다현 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.biography | org (2회) | Chooses first not to break the duty. Trusts a single line in the ledger over loud talk.

- Livelihood: Quarant ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2102-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0452 | 심다현 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0457 | 차예원 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=geography:duchy:11620 |
| person-0457 | 차예원 | $.openingTitles[].parentTitle.name | org (2회) | Standards League Kingdom ／ 규격맹 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0457 | 차예원 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0457 | 차예원 | $.biography | org (2회) | Cha Yewon marks omissions in the citizenship copy without mixing military household register demands with labo ／ 차예원은 시민권 사본의 누락을 표시하면서도 군사호적 요구와 노동 교대를 섞지 않는다.

- 소속: 규격맹
- 생업: 등기·기록
- 품계: 조합원
- 직함: 복구복무 기록관
**생애.** 2126년  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0457 | 차예원 | $.characterProfile.traits[].stress | org (2회) | 복구복무 기록관 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0457 | 차예원 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0459 | 우경민 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0459 | 우경민 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0459 | 우경민 | $.sections.Ambition | clergy (1회) | U Gyeongmin wants to keep the Register Church's ledger unbroken through the Parts Logistics Merchant duty post | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0459 | 우경민 | $.sections.Fear | clergy (1회) | U Gyeongmin fears that if the Parts Logistics Merchant duty post falls vacant, the Register Church's passage w | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0459 | 우경민 | $.biography | clergy (1회) | U Gyeongmin first chooses not to break the duty post. U Gyeongmin trusts a single line in the ledger more than | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0461 | 민시현 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=geography:duchy:11410 |
| person-0461 | 민시현 | $.confirmedHoldings[].name.ko | org (2회) | Seodaemun-gu Government of the Republic of Korea Ducal Demesne ／ 서대문구 대한민국정부 공작령 직영지 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0461 | 민시현 | $.openingTitles[].parentTitle.name | org (2회) | Government of the Republic of Korea Kingdom ／ 대한민국정부 왕국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0461 | 민시현 | $.openingTitles[].name | org (1회) | 서대문구 대한민국정부 공작령 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0468 | 강달유 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.biography | org (2회) | Chooses first not to break the watch. Trusts a single line in the ledger more than loud talk.

- Livelihood: M ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 208 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0468 | 강달유 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0472 | 임건우 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0472 | 임건우 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0472 | 임건우 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0472 | 임건우 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0472 | 임건우 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0472 | 임건우 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0472 | 임건우 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0473 | 한현우 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0473 | 한현우 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0473 | 한현우 | $.biography | org (2회) | Han Hyeonu would rather hand a message over late at the next shift than send one missing its receipt signature ／ 한현우는 수령 서명이 빠진 전갈을 보내는 것보다 다음 교대에 늦게 넘기는 쪽을 택한다.

- 소속: 규격맹
- 생업: 환승 전갈 전달
- 품계: 조합원
- 직함: 작업반 전령
**생애.** 2126 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0473 | 한현우 | $.characterProfile.traits[].stress | org (2회) | 작업반 전령 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0473 | 한현우 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0477 | 권금윤 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0484 | 문철민 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0484 | 문철민 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.biography | org (2회) | He chooses first not to break the watch. He trusts a single line in the ledger more than loud talk.

- Occupat ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2065-07 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0484 | 문철민 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0493 | 노주아 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0499 | 우하진 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0499 | 우하진 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0499 | 우하진 | $.biography | org (2회) | U Hajin, born 2066-08-11, first checks the order of the medical escort times on the seasonal dispatch table. T ／ 2066-08-11생인 우하진은 계절 배차표의 의무호송 시각의 순서를 먼저 확인한다. 큰소리보다 인수 시각과 서명 칸을 믿는다.

- 생업: 의무호송 기록·당직 열쇠 인계
- 소속: 신내운수
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0499 | 우하진 | $.characterProfile.traits[].stress | org (2회) | 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. ／ 공포. 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0499 | 우하진 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0500 | 구소희 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single ledger line rather than loud voices.

- Livelihood: ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2070-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0500 | 구소희 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0505 | 박하은 | $.characterProfile.traits[].description | org (2회) | A copy of the restoration-service roster that the Eastern Command once offered in place of the pump-parts crat ／ 동방사가 펌프 부품 상자 대신 내밀었던 복구복무자 명부의 사본이 기록관 당직에 들어온다. 박하은은 강민서가 봉한 채 돌려보낸 상자의 봉인 기록을 사본 옆에 붙이고, 한재목의 서부 급수와 배우진의 병 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.characterProfile.traits[].behavior | org (2회) | A copy of the restoration-service roster that the Eastern Command once offered in place of the pump-parts crat ／ 동방사가 펌프 부품 상자 대신 내밀었던 복구복무자 명부의 사본이 기록관 당직에 들어온다. 박하은은 강민서가 봉한 채 돌려보낸 상자의 봉인 기록을 사본 옆에 붙이고, 한재목의 서부 급수와 배우진의 병 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.characterProfile.narrative | org (2회) | A copy of the restoration-service roster that the Eastern Command once offered in place of the pump-parts crat ／ 동방사가 펌프 부품 상자 대신 내밀었던 복구복무자 명부의 사본이 기록관 당직에 들어온다. 박하은은 강민서가 봉한 채 돌려보낸 상자의 봉인 기록을 사본 옆에 붙이고, 한재목의 서부 급수와 배우진의 병 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.biography | org (2회) | Bak Haeun begins by doubting the line where the parts box and the restoration service roster are written as if ／ 박하은은 부품 상자와 복구복무 명부가 한 거래의 대가처럼 적힌 줄부터 의심한다.

- 소속: 규격맹
- 생업: 등기·기록
- 품계: 조합원
- 직함: 복구복무 기록관
**생애.** 2126년 세대. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.characterProfile.traits[].stress | org (2회) | 복구복무 기록관 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.fields.업무 위치 | org (1회) | 구로2동. 박하은은 구로2동 기록 당직에서 동방사가 요구한 복구복무 명부 사본과 강민서가 봉한 부품 상자의 번호를 나란히 적는다. 한재목의 급수와 배우진의 병조 사이에 남은 계약 빚의 출처를 찾기  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.sections.생애 | org (1회) | 2126년 세대. 서울역 등기소에서 자랐다. 복구복무 기록관 자리는 이중 장부 한 줄 삭제로 열렸다.
- 업무 위치: 구로2동. 박하은은 구로2동 기록 당직에서 동방사가 요구한 복구복무 명부 사본과 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0505 | 박하은 | $.sections.일화 | org (1회) | 동방사가 펌프 부품 상자 대신 내밀었던 복구복무자 명부의 사본이 기록관 당직에 들어온다. 박하은은 강민서가 봉한 채 돌려보낸 상자의 봉인 기록을 사본 옆에 붙이고, 한재목의 서부 급수와 배우진의 병 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0507 | 정바준 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0507 | 정바준 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0507 | 정바준 | $.sections.Ambition | clergy (1회) | On the Parts Logistics Officer watch, Jeong Bajun wants to keep the Roster Church's ledger connected without a | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0507 | 정바준 | $.sections.Fear | clergy (1회) | Jeong Bajun fears that if the Parts Logistics Officer watch falls vacant, the Roster Church's passage will bec | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0507 | 정바준 | $.biography | clergy (1회) | Jeong Bajun chooses first not to break the watch. Jeong Bajun trusts a single line in the ledger over loud tal | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0509 | 조새준 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0516 | 신하빈 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0516 | 신하빈 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.biography | org (2회) | He chooses first not to break the watch. He trusts a single ledger line more than loud talk.

- Livelihood: Me ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 209 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0516 | 신하빈 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0520 | 송재현 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0520 | 송재현 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0520 | 송재현 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0520 | 송재현 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0520 | 송재현 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0520 | 송재현 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0520 | 송재현 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0525 | 양카태 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0532 | 심태양 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0532 | 심태양 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.biography | org (2회) | Chooses first not to break the duty shifts. Trusts a single line in the ledger more than loud words.

- Liveli ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2089-05 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0532 | 심태양 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0541 | 민연우 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0544 | 이바석 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0544 | 이바석 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0544 | 이바석 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0544 | 이바석 | $.sections.야망 | org (1회) | 금고 당직 자리에서 여의도출자연합회의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0544 | 이바석 | $.sections.공포 | org (1회) | 금고 당직이 비면 여의도출자연합회의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0544 | 이바석 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 금고 당직 교대·기록 인수
- 소속: 여의도출자연합회
- 품계: 서기
- 직함: 금고 당직
**생애.** 2102 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0547 | 정다은 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0547 | 정다은 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0547 | 정다은 | $.biography | org (2회) | Born on 2066-12-01, Jeong Daeun first checks the order of two conflicting dispatch sheets. She trusts handover ／ 2066-12-01생인 정다은은 엇갈린 두 배차표의 순서를 먼저 확인한다. 큰소리보다 인수 시각과 서명 칸을 믿는다.

- 생업: 의무호송 기록·당직 열쇠 인계
- 소속: 신내운수
- 품계: 호송원 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0547 | 정다은 | $.characterProfile.traits[].stress | org (2회) | 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. ／ 공포. 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0547 | 정다은 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0548 | 강바유 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.biography | org (2회) | Chooses first not to break the duty. Trusts a single ledger line more than loud voices.

- Livelihood: Quarant ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2102-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0548 | 강바유 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0555 | 서구서 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0555 | 서구서 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0555 | 서구서 | $.sections.Ambition | clergy (1회) | Seo Guseo wants to keep the Register Church's ledger continuously linked through the Parts Logistics Merchant  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0555 | 서구서 | $.sections.Fear | clergy (1회) | Seo Guseo fears that if the Parts Logistics Merchant duty falls vacant, the Register Church's passage will bec | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0555 | 서구서 | $.biography | clergy (1회) | Seo Guseo chooses first not to break the duty. Seo Guseo trusts a single ledger line more than loud voices.

- | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0557 | 권숲윤 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0564 | 문동은 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0564 | 문동은 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.biography | org (2회) | Chooses first not to break the watch. Trusts a single line in the ledger over loud voices.

- Livelihood: Medi ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 210 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0564 | 문동은 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0568 | 백산석 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0568 | 백산석 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0568 | 백산석 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0568 | 백산석 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0568 | 백산석 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0568 | 백산석 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0568 | 백산석 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0570 | 유바영 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0570 | 유바영 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0570 | 유바영 | $.biography | org (2회) | In Gayang 1-dong, Yu Bayeong first checks the original seed records for missing lines. Even when pressed to hu ／ 가양1동에서 유바영은 종자 원본의 빠진 줄을 먼저 살핀다. 보존고 출고를 재촉받아도 인수 기록과 온습도 장부를 맞춘 뒤 박진솔에게 넘긴다.

- 소속: 태욱그룹
- 생업: 기록·열쇠 인수인계
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0570 | 유바영 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0573 | 노사호 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0577 | 차남원 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0577 | 차남원 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0577 | 차남원 | $.biography | org (2회) | For vote results, he matches the per-clan lines and the transcript in turn. When he hands over the keys, he ha ／ 표결 결과는 문중별 줄과 필사본을 차례로 맞춘다. 열쇠를 넘길 때 대조본도 함께 건넨다.

- 생업: 장경 필사본·당직 열쇠 인계
- 소속: 안국총림
- 품계: 행자
- 직함: 장경 필사 행자
** | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0577 | 차남원 | $.characterProfile.traits[].stress | org (1회) | 장경 필사 행자 당직이 비면 안국총림의 필사본이 끊기고 문중 표가 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0577 | 차남원 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0580 | 구름결 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.biography | org (2회) | He chooses first not to break the duty chain. He trusts a single line in the ledger more than loud talk.

- Li ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2072-06 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0580 | 구름결 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0589 | 조서원 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0596 | 신나빈 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0596 | 신나빈 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.biography | org (2회) | Chooses first to keep the duty roster unbroken. Trusts a single ledger line over loud talk.

- Livelihood: Qua ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2084-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0596 | 신나빈 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0599 | 안카민 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0599 | 안카민 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0599 | 안카민 | $.sections.Life | org (1회) | Born on 2073-09-21, An Ka-min handles Audit Records Officer duties at the Sicheong Station union workshop in t | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0599 | 안카민 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Audit Records Officer. This duty is an internal function o | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0599 | 안카민 | $.biography | org (1회) | At the Sicheong Station union workshop in the Permanent Winter, An Ka-min first cross-checks the Audit Records | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0600 | 송하지 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.sections.Ambition | org (1회) | From the Conduit Surveyor post, to keep the Floodgate Bureau's ledger unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.biography | org (2회) | Chooses first not to break the duty watch. Trusts a single line in the ledger more than loud talk.

- Affiliat ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 대합실 당직
- 품계: 주사
- 직함: 관로 탐사원
**생애.** 2126년 세대. 대합실 당직 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.characterProfile.traits[].stress | org (2회) | 관로 탐사원 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.sections.야망 | org (1회) | 관로 탐사원 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0600 | 송하지 | $.sections.공포 | org (1회) | 관로 탐사원 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0603 | 고별호 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0603 | 고별호 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0603 | 고별호 | $.sections.Ambition | clergy (1회) | From the Parts Logistics Officer watch, Go Byeolho wants to keep the Roster Church's ledger unbroken. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0603 | 고별호 | $.sections.Fear | clergy (1회) | Go Byeolho fears a situation in which, if the Parts Logistics Officer watch goes empty, the Roster Church's pa | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0603 | 고별호 | $.biography | clergy (1회) | Go Byeolho chooses first not to break the duty watch. Go Byeolho trusts a single line in the ledger more than  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0605 | 양산태 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0606 | 시몬 카민스키 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0606 | 시몬 카민스키 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0606 | 시몬 카민스키 | $.sections.Ambition | org (1회) | He links the escort ledger-of-lives protection records of the Escort Courier duty to the ledgers of the Transs | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0606 | 시몬 카민스키 | $.biography | org (2회) | Simon Kaminseuki is in charge of protecting the escort ledger of lives. Simon Kaminseuki delivers the ledger o ／ 시몬 카민스키는 호송 인명 장부 보호 업무를 맡는다. 시몬 카민스키는 호송에서 지킨 인명 장부를 박태겸의 배차 창구에 전달한다.

- 소속: 환적국
- 품계: 주사
- 생업: 호송 인명 장부 보호
 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0606 | 시몬 카민스키 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0606 | 시몬 카민스키 | $.sections.야망 | org (1회) | 호송 전령 업무의 호송 인명 장부 보호 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0612 | 심파현 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.biography | org (2회) | Chooses first not to break the watch. Trusts a single line in the ledger over loud talk.

- Occupation: Medici ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 208 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0612 | 심파현 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0616 | 성달현 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0616 | 성달현 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0616 | 성달현 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0616 | 성달현 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0616 | 성달현 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0616 | 성달현 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0616 | 성달현 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0621 | 민다현 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0625 | 박금은 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0625 | 박금은 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0625 | 박금은 | $.characterProfile.traits[].stress | org (1회) | 장경 필사 행자 당직이 비면 안국총림의 필사본이 끊기고 문중 표가 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0625 | 박금은 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0625 | 박금은 | $.biography | org (1회) | 출처 칸이 빈 상자는 약속과 물자 기록을 따로 적는다. 말로 전해진 내용은 여백에 모아 올린다.

- 생업: 장경 필사본·당직 열쇠 인계
- 소속: 안국총림
- 품계: 행자
- 직함: 장경 필사 행 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0628 | 강솔준 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger over loud talk.

- Livelihood: P ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2080-08 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0628 | 강솔준 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0637 | 권하린 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0644 | 문바은 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0644 | 문바은 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single ledger line more than loud talk.

- Livelihood: qua ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2093-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0644 | 문바은 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0649 | 허파서 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0649 | 허파서 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0649 | 허파서 | $.biography | org (2회) | Heo Paseo does not bury unnumbered modified parts in the shipping list of standard parts.

- Affiliation: Stan ／ 허파서는 번호 없는 개조 부품을 규격 부품의 출고 목록에 묻어 보내지 않는다.

- 소속: 규격맹
- 생업: 등기·기록
- 품계: 조합원
- 직함: 복구복무 기록관
**생애.** 2126년 세대.  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0649 | 허파서 | $.characterProfile.traits[].stress | org (2회) | 복구복무 기록관 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0649 | 허파서 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0651 | 남남원 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0651 | 남남원 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0651 | 남남원 | $.sections.Ambition | clergy (1회) | In the Parts Logistics Chief duty, Nam Namwon seeks to keep the Roster Church's ledger continuous and unbroken | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0651 | 남남원 | $.sections.Fear | clergy (1회) | Nam Namwon fears that if the Parts Logistics Chief duty falls vacant, the Roster Church's passage will become  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0651 | 남남원 | $.biography | clergy (1회) | Nam Namwon chooses first not to break the duty chain. Nam Namwon trusts a single line in the ledger more than  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0660 | 구자희 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0660 | 구자희 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud talk.

- Occupati ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 209 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0660 | 구자희 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0676 | 신북민 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud talk.

- Occupati ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2073-05 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0676 | 신북민 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0691 | 남름은 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0691 | 남름은 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0691 | 남름은 | $.biography | org (2회) | Nam Reumeun, born 2085-03-21, first checks the order of the arrival time of the delayed dispatch message. Trus ／ 2085-03-21생인 남름은은 지연된 배차 전갈의 도착 시각의 순서를 먼저 확인한다. 큰소리보다 인수 시각과 서명 칸을 믿는다.

- 생업: 의무호송 기록·당직 열쇠 인계
- 소속: 신내운수
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0691 | 남름은 | $.characterProfile.traits[].stress | org (2회) | 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. ／ 공포. 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0691 | 남름은 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0692 | 심바현 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.biography | org (2회) | First chooses not to break the duty chain. Trusts a single ledger line more than loud voices.

- Livelihood: E ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2094-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0692 | 심바현 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0699 | 구서결 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0699 | 구서결 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0699 | 구서결 | $.sections.Ambition | clergy (1회) | As Parts Logistics Chief on watch, Gu Seogyeol wants to keep the Registry Church's ledger connected without a  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0699 | 구서결 | $.sections.Fear | clergy (1회) | Gu Seogyeol fears that if the Parts Logistics Chief's watch falls vacant, the Registry Church's passage will b | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0699 | 구서결 | $.biography | clergy (1회) | Gu Seogyeol would rather keep the watch unbroken. Gu Seogyeol trusts a single line in the ledger more than a l | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0708 | 조아원 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0708 | 조아원 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.biography | org (2회) | Jo Awon would rather keep the watch unbroken. Jo Awon trusts a single line in the ledger more than a loud voic ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 206 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0708 | 조아원 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0712 | 한북우 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0712 | 한북우 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0712 | 한북우 | $.biography | org (2회) | Han Bugu would rather keep the watch unbroken. Han Bugu trusts a single line in the ledger more than a loud vo ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0712 | 한북우 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0712 | 한북우 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0712 | 한북우 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0712 | 한북우 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.stateName | org (2회) | Central Intelligence Agency ／ 중앙정보부 | 050 확정값으로 교체: state_id=government |
| person-0719 | 송도현 | $.fields.Affiliation | org (1회) | Central Intelligence Agency | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.sections.Ambition | org (1회) | To keep the Central Intelligence Bureau's books unbroken from the Auction Clerk post. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.sections.Fear | org (1회) | That if the Auction Clerk's duty shift goes unfilled, the Central Intelligence Bureau's documents and parts wi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.biography | org (2회) | He chooses first not to break the duty shift. He trusts a single line in the ledger over loud talk.

- Affilia ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 중앙정보부
- 품계: 교도
- 생업: 밀수 호스 접수·관로 대장 작성
- 외형: 신장 183cm, 체중 70kg. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.characterProfile.traits[].stress | org (2회) | 공포. 경매 서기 당직이 비면 중앙정보부의 문서와 부품이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.fields.소속 | org (1회) | 중앙정보부 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.sections.야망 | org (1회) | 경매 서기 자리에서 중앙정보부의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0719 | 송도현 | $.sections.공포 | org (1회) | 경매 서기 당직이 비면 중앙정보부의 문서와 부품이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0724 | 양남태 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.biography | org (2회) | He chooses first not to break the duty shift. He trusts a single line in the ledger over loud talk.

- Livelih ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2083-01 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0724 | 양남태 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0728 | 허바우 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.sections.Fear | org (1회) | That if the Bridge Passage Courier's duty shift goes unfilled, the Floodgate Bureau's passage will become host | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.characterProfile.traits[].stress | org (2회) | 교량 통행 전령 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.sections.야망 | org (1회) | 교량 통행 전령 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.sections.공포 | org (1회) | 교량 통행 전령 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0728 | 허바우 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 교량 경비 당직
- 품계: 주사
- 직함: 교량 통행 전령
**생애.** 2126년 세대. 암사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0731 | 노바아 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0731 | 노바아 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0731 | 노바아 | $.sections.Ambition | clergy (1회) | Noh Ba-a wants to keep the Roster Church's ledger connected without a break through the Workshop Herald watch. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0731 | 노바아 | $.sections.Fear | clergy (1회) | Noh Ba-a fears a situation in which, if the Workshop Herald watch stands empty, the Roster Church's passage be | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0731 | 노바아 | $.biography | clergy (1회) | Noh Ba-a chooses first not to break the watch. Noh Ba-a trusts a single line in the ledger over loud talk.

-  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0739 | 민강현 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0739 | 민강현 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0739 | 민강현 | $.biography | org (2회) | Min Ganghyeon, born 2067-02-08, first checks the sequence of the Seal on Departure Without a Dispatch Sheet. H ／ 2067-02-08생인 민강현은 배차표 없는 출발의 봉인의 순서를 먼저 확인한다. 큰소리보다 인수 시각과 서명 칸을 믿는다.

- 생업: 의무호송 기록·당직 열쇠 인계
- 소속: 신내운수
- 품계: | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0739 | 민강현 | $.characterProfile.traits[].stress | org (2회) | 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. ／ 공포. 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0739 | 민강현 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0740 | 진숲혁 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.biography | org (2회) | He chooses first not to break the duty chain. He trusts a single ledger line more than loud voices.

- Livelih ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2077-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0740 | 진숲혁 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0747 | 윤북율 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0747 | 윤북율 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0747 | 윤북율 | $.sections.Ambition | clergy (1회) | Yun Bugyul wants to keep the Roster Church's ledger continuous and unbroken through the Parts Logistics Mercha | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0747 | 윤북율 | $.sections.Fear | clergy (1회) | Yun Bugyul fears that if the Parts Logistics Merchant's duty falls vacant, the Roster Church's passage will be | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0747 | 윤북율 | $.biography | clergy (1회) | Yun Bugyul chooses first not to break the duty chain. Yun Bugyul trusts a single ledger line more than loud vo | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0749 | 임빛나 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0756 | 안차민 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0756 | 안차민 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud talk.

- Occupati ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 206 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0756 | 안차민 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0760 | 고늘진 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0760 | 고늘진 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0760 | 고늘진 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0760 | 고늘진 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0760 | 고늘진 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0760 | 고늘진 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0760 | 고늘진 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0762 | 양름태 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0762 | 양름태 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0762 | 양름태 | $.biography | org (2회) | At Gayang 1-dong, Yang Reumtae first checks the original seed records for missing lines. Even when pressed to  ／ 가양1동에서 양름태는 종자 원본의 빠진 줄을 먼저 살핀다. 보존고 출고를 재촉받아도 인수 기록과 온습도 장부를 맞춘 뒤 박진솔에게 넘긴다.

- 소속: 태욱그룹
- 생업: 기록·열쇠 인수인계
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0762 | 양름태 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0763 | 손바호 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0763 | 손바호 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0763 | 손바호 | $.sections.Ambition | clergy (1회) | Son Baho wishes to keep the Register Church's ledger unbroken through the Stabling-Line Patrol duty. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0763 | 손바호 | $.sections.Fear | clergy (1회) | Son Baho fears that if the Stabling-Line Patrol duty falls vacant, the Register Church's passage will become a | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0763 | 손바호 | $.biography | clergy (1회) | Son Baho chooses first not to break the duty. Son Baho trusts a single line in the ledger more than loud talk. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0769 | 노금호 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-0769 | 노금호 | $.fields.Affiliation | org (1회) | Anguk Grand Monastery | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0769 | 노금호 | $.sections.Anecdote | org (1회) | A document binding a water-ration iron token and a service contract on one cord is posted again on the encampm | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0769 | 노금호 | $.biography | org (2회) | Untie the water-ration iron tokens and service contracts bound on one cord and transcribe each separately. Gat ／ 한 끈에 묶인 급수권 철표와 복무계약서를 풀어 각각 필사한다. 겹친 이름은 문서 끝에 모은다.

- 생업: 장경 필사본·당직 열쇠 인계
- 소속: 안국총림
- 품계: 행자
- 직함: 장경 필사 행자 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0769 | 노금호 | $.characterProfile.traits[].stress | org (1회) | 장경 필사 행자 당직이 비면 안국총림의 필사본이 끊기고 문중 표가 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0769 | 노금호 | $.fields.소속 | org (1회) | 안국총림 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0769 | 노금호 | $.sections.일화 | org (1회) | 급수권 철표와 복무계약서를 한 끈으로 묶은 문서가 숙영지 게시판에 다시 붙는다. 노금호는 두 문서를 끈에서 풀어 따로 필사하고, 신도 명부 원장과 규격맹 복구복무 명부에 겹쳐 오른 이름을 필사본 끝 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0772 | 성솔현 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.biography | org (2회) | Chooses first not to break the duty. Trusts a single line in the ledger more than loud talk.

- Livelihood: Pr ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2098-10 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0772 | 성솔현 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0779 | 김아호 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0779 | 김아호 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0779 | 김아호 | $.sections.Ambition | clergy (1회) | As Workshop Courier on watch, Gim Aho wants to keep the Roster Church's ledger connected without a break. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0779 | 김아호 | $.sections.Fear | clergy (1회) | Gim Aho fears that if the Workshop Courier watch falls vacant, the Roster Church's passage would become a host | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0779 | 김아호 | $.biography | clergy (1회) | Gim Aho chooses first not to break the watch. Gim Aho trusts a single line in the ledger over loud words.

- A | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0781 | 박하윤 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0788 | 임바나 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0788 | 임바나 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.biography | org (2회) | Chooses first the option that keeps the duty watch unbroken. Trusts a single ledger line over loud talk.

- Li ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2101-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0788 | 임바나 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0791 | 서사서 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-0791 | 서사서 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0791 | 서사서 | $.sections.Life | org (1회) | Born on 2092-08-31, Seo Saseo works as an Audit Records Officer at the Sicheong Station union workshop in the  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0791 | 서사서 | $.sections.Duty | org (1회) | The community role is union member, and the duty is Audit Records Officer. This duty is an internal function o | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0791 | 서사서 | $.biography | org (1회) | In the Permanent Winter, at the Sicheong Station union workshop, Seo Saseo first cross-checks the Audit Record | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0795 | 안남늘 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0795 | 안남늘 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0795 | 안남늘 | $.sections.Ambition | clergy (1회) | As Parts Logistics Steward on duty, An Namneul wants to keep the Register Church's ledger unbroken. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0795 | 안남늘 | $.sections.Fear | clergy (1회) | An Namneul fears that if the Parts Logistics Steward duty post falls vacant, the Register Church's passage wil | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0795 | 안남늘 | $.biography | clergy (1회) | An Namneul chooses first not to break the duty chain. An Namneul trusts a single line in the ledger more than  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0797 | 류달현 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0804 | 허타우 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0804 | 허타우 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud talk.

- Liveliho ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 208 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0804 | 허타우 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0810 | 곽강호 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0810 | 곽강호 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0810 | 곽강호 | $.biography | org (2회) | At Gayang 1-dong, Gwak Gangho first checks the seed originals for missing lines. Even when pressed to hurry th ／ 가양1동에서 곽강호는 종자 원본의 빠진 줄을 먼저 살핀다. 보존고 출고를 재촉받아도 인수 기록과 온습도 장부를 맞춘 뒤 박진솔에게 넘긴다.

- 소속: 태욱그룹
- 생업: 기록·열쇠 인수인계
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0810 | 곽강호 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0820 | 박별윤 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.biography | org (2회) | Chooses first not to break the shift chain. Trusts a single line in the ledger more than loud talk.

- Occupat ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2094-06 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0820 | 박별윤 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0836 | 류돌연 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.biography | org (2회) | He chooses first not to break the duty chain. He trusts a single line in the ledger more than loud talk.

- Li ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2078-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0836 | 류돌연 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0841 | 손타연 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0841 | 손타연 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0841 | 손타연 | $.biography | org (2회) | Son Tayeon cross-checks the two rosters before the same name is counted as two laborers.

- Affiliation: Stand ／ 손타연은 같은 이름이 두 명의 노동 인원으로 집계되기 전에 두 명부를 대조한다.

- 소속: 규격맹
- 생업: 등기·기록
- 품계: 조합원
- 직함: 복구복무 기록관
**생애.** 2126년 세대. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0841 | 손타연 | $.characterProfile.traits[].stress | org (2회) | 복구복무 기록관 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0841 | 손타연 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0846 | 제이컵 토머스 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0846 | 제이컵 토머스 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0846 | 제이컵 토머스 | $.sections.Ambition | org (1회) | He links the escort ledger-of-lives protection records of the Escort Courier duty to the ledgers of the Transs | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0846 | 제이컵 토머스 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0846 | 제이컵 토머스 | $.sections.야망 | org (1회) | 호송 전령 업무의 호송 인명 장부 보호 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0846 | 제이컵 토머스 | $.biography | org (1회) | 제이컵 토머스는 호송 인명 장부 보호 업무를 맡는다. 제이컵 토머스는 호송에서 지킨 인명 장부를 박태겸의 창구에 넘긴다.

- 소속: 환적국
- 품계: 주사
- 생업: 호송 인명 장부 보호
- 직함 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0848 | 하람은 | $.stateName | org (2회) | Yeouido Investment Federation ／ 여의도출자연합회 | 050 확정값으로 교체: state_id=free-city |
| person-0848 | 하람은 | $.fields.Affiliation | org (1회) | Yeouido Investment Federation | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0848 | 하람은 | $.fields.소속 | org (1회) | 여의도출자연합회 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0848 | 하람은 | $.sections.야망 | org (1회) | 금고 정비사 자리에서 여의도출자연합회의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0848 | 하람은 | $.sections.공포 | org (1회) | 금고 정비 당직이 비면 여의도출자연합회의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0848 | 하람은 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 금고 설비 점검·정비
- 소속: 여의도출자연합회
- 품계: 서기
- 직함: 금고 정비사
**생애.** 2066-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0852 | 주카인 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.biography | org (2회) | Chooses first not to let the watch break. Trusts a single line in the ledger more than loud talk.

- Occupatio ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 209 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0852 | 주카인 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0859 | 최바아 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0859 | 최바아 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0859 | 최바아 | $.sections.Ambition | clergy (1회) | As Stabling Track Patrol duty officer, Choe Ba-a seeks to keep the Register Church's ledger connected without  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0859 | 최바아 | $.sections.Fear | clergy (1회) | Choe Ba-a fears that if the Stabling Track Patrol duty goes vacant, the Register Church's passage will be held | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0859 | 최바아 | $.biography | clergy (1회) | Choe Ba-a first chooses not to break the duty chain. Choe Ba-a trusts a single line in the ledger more than lo | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0868 | 서달서 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0868 | 서달서 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud talk.

- Liveliho ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2076-01 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0868 | 서달서 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0883 | 남람원 | $.stateName | org (2회) | Sinnae Transport ／ 신내운수 | 050 확정값으로 교체: state_id=government |
| person-0883 | 남람원 | $.fields.Affiliation | org (1회) | Sinnae Transport | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0883 | 남람원 | $.biography | org (2회) | Nam Ramwon, born 2093-02-16, first checks the order of the petition copies returned to the public window. Nam  ／ 2093-02-16생인 남람원은 공개 창구로 되돌린 청탁 사본의 순서를 먼저 확인한다. 큰소리보다 인수 시각과 서명 칸을 믿는다.

- 생업: 의무호송 기록·당직 열쇠 인계
- 소속: 신내운수
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0883 | 남람원 | $.characterProfile.traits[].stress | org (2회) | 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. ／ 공포. 의무호송 기록관 당직이 비면 신내운수의 통행이 노선 면허의 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0883 | 남람원 | $.fields.소속 | org (1회) | 신내운수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0884 | 심나양 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud voices.

- Occupa ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2096-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0884 | 심나양 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0889 | 차동환 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-0889 | 차동환 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0889 | 차동환 | $.biography | org (2회) | Cha Donghwan records the Guard Corps' demand for the roster, but he does not hand over the original citizenshi ／ 차동환은 경비대의 명부 요구를 기록하되 시민권 원본 자체를 군사호적 사본으로 내주지 않는다.

- 소속: 규격맹
- 생업: 등기·기록
- 품계: 조합원
- 직함: 복구복무 기록관
**생애.** 21 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0889 | 차동환 | $.characterProfile.traits[].stress | org (2회) | 복구복무 기록관 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0889 | 차동환 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0900 | 강파유 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.biography | org (2회) | Chooses first not to break the duty chain. Trusts a single line in the ledger more than loud talk.

- Liveliho ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 209 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0900 | 강파유 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0906 | 서돌서 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-0906 | 서돌서 | $.fields.Affiliation | org (1회) | Taeuk Group | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0906 | 서돌서 | $.biography | org (2회) | In Gayang 1-dong, Seo Dolseo first looks for missing lines in the original seed records. Even when pressed to  ／ 가양1동에서 서돌서는 종자 원본의 빠진 줄을 먼저 살핀다. 보존고 출고를 재촉받아도 인수 기록과 온습도 장부를 맞춘 뒤 박진솔에게 넘긴다.

- 소속: 태욱그룹
- 생업: 기록·열쇠 인수인계
- 품 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0906 | 서돌서 | $.fields.소속 | org (1회) | 태욱그룹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0916 | 배숲민 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.biography | org (2회) | Chooses first not to break the watch. Trusts a single line in the ledger over loud talk.

- Livelihood: Prescr ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2073-09 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0916 | 배숲민 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0920 | 남아은 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.sections.Fear | org (1회) | That if the Bridge Passage Courier's duty shift goes unfilled, the Floodgate Bureau's passage will become host | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.biography | org (2회) | Chooses first not to break the watch. Trusts a single line in the ledger over loud talk.

- Affiliation: Flood ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 교량 경비 당직
- 품계: 주사
- 직함: 교량 통행 전령
**생애.** 2126년 세대. 암사 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.characterProfile.traits[].stress | org (2회) | 교량 통행 전령 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.sections.야망 | org (1회) | 교량 통행 전령 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0920 | 남아은 | $.sections.공포 | org (1회) | 교량 통행 전령 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0926 | 에티엔 모로 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0926 | 에티엔 모로 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0926 | 에티엔 모로 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0926 | 에티엔 모로 | $.sections.야망 | org (1회) | 중계 당직 업무의 예비 전지 교대·송신 유지 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0926 | 에티엔 모로 | $.biography | org (1회) | 에티엔 모로는 예비 전지 교대·송신 유지 업무를 맡는다. 에티엔 모로는 송신에 쓴 예비 전지와 교대 시각을 아데올라 아데예미에게 전한다.

- 소속: 환적국
- 품계: 주사
- 생업: 예비 전지 교 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0932 | 김사연 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.biography | org (2회) | He chooses first not to let the duty lapse. He trusts one line in the ledger more than loud talk.

- Livelihoo ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2087-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0932 | 김사연 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0942 | 조지 앤더슨 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0942 | 조지 앤더슨 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0942 | 조지 앤더슨 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0942 | 조지 앤더슨 | $.sections.야망 | org (1회) | 호송 전령 업무의 무표 열차 출발·서명 확인 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0942 | 조지 앤더슨 | $.biography | org (1회) | 조지 앤더슨은 무표 열차 출발·서명 확인 업무를 맡는다. 조지 앤더슨은 배차표·출발 서명 누락을 기록 담당자에게 알린다.

- 소속: 환적국
- 품계: 주사
- 생업: 무표 열차 출발·서명 확인
- | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0948 | 안서민 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.biography | org (2회) | Chooses first to keep the duty unbroken. Trusts a single line in the ledger more than loud talk.

- Occupation ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 209 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0948 | 안서민 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0952 | 문숲민 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-0952 | 문숲민 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0952 | 문숲민 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0952 | 문숲민 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0952 | 문숲민 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0952 | 문숲민 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0952 | 문숲민 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0955 | 백아래 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0955 | 백아래 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0955 | 백아래 | $.sections.Ambition | clergy (1회) | On the Siding Patrol watch, Baek Arae seeks to keep the Register Church's ledger continuous and unbroken. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0955 | 백아래 | $.sections.Fear | clergy (1회) | Baek Arae fears that if the Siding Patrol watch falls vacant, the Register Church's passage will become a host | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0955 | 백아래 | $.biography | clergy (1회) | Baek Arae chooses first not to break the watch. Baek Arae trusts a single line in the ledger more than loud ta | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0958 | 바르보라 프로하스코바 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0958 | 바르보라 프로하스코바 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0958 | 바르보라 프로하스코바 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0958 | 바르보라 프로하스코바 | $.sections.야망 | org (1회) | 배차 서기 업무의 침수 구간 붕괴 보고·폐쇄 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0958 | 바르보라 프로하스코바 | $.biography | org (1회) | 바르보라 프로하스코바는 침수 구간 붕괴 보고·폐쇄 업무를 맡는다. 바르보라 프로하스코바는 침수 폐쇄 위치와 배차 지연을 패트릭 오코너에게 전한다.

- 소속: 환적국
- 품계: 주사
- 생업: 침수 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0964 | 차바환 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.sections.Ambition | org (1회) | From the Prescription Resident post, he carries on the White Cross Order's ledger so that it is not broken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.sections.Fear | org (1회) | He fears that if the Prescription Resident duty falls vacant, the White Cross Order's passage will become a ho | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.biography | org (2회) | Cha Ba-hwan chooses not to break the watch first. Trusts a single line in the ledger more than a loud voice.

 ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 처방 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 처방 서기
**생애.** 2098-01 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.characterProfile.traits[].stress | org (2회) | 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 처방 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.sections.야망 | org (1회) | 처방 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0964 | 차바환 | $.sections.공포 | org (1회) | 처방 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0971 | 이남민 | $.stateName | clergy (1회) | Registry Church | 050 확정값으로 교체: state_id=arc |
| person-0971 | 이남민 | $.fields.Affiliation | clergy (1회) | Registry Church | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0971 | 이남민 | $.sections.Ambition | clergy (1회) | I Nam-min wants to keep the Register Church's ledger unbroken from the Workshop Courier watch. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0971 | 이남민 | $.sections.Fear | clergy (1회) | I Nam-min fears that if the Workshop Courier watch falls vacant, the Register Church's passage will become a h | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0971 | 이남민 | $.biography | clergy (1회) | I Nam-min chooses not to break the watch first. I Nam-min trusts a single line in the ledger more than a loud  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-0974 | 미겔 토레스 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0974 | 미겔 토레스 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0974 | 미겔 토레스 | $.sections.Ambition | org (1회) | He links the relay duty's records of preserved false bulletins and correction broadcasts to the Transshipment  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0974 | 미겔 토레스 | $.biography | org (2회) | Miguel Torres handles the work of preserving false bulletins and broadcasting corrections. Miguel Torres passe ／ 미겔 토레스는 거짓 속보 보존·정정 방송 업무를 맡는다. 미겔 토레스는 보존한 거짓 속보와 정정 시각을 소피아 로시에게 전한다.

- 소속: 환적국
- 품계: 주사
- 생업: 거짓 속보 보존·정정  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0974 | 미겔 토레스 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0974 | 미겔 토레스 | $.sections.야망 | org (1회) | 중계 당직 업무의 거짓 속보 보존·정정 방송 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0980 | 오타호 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.sections.Ambition | org (1회) | From the Quarantine Resident post, to keep the White Cross Order's ledger continuous and unbroken. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.sections.Fear | org (1회) | Fears that if the Quarantine Resident duty falls vacant, the White Cross Order's passage will become a hostage | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.biography | org (2회) | He chooses first not to break the duty chain. He trusts a single ledger line over loud talk.

- Livelihood: Qu ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 방역 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 방역 기록관
**생애.** 2073-0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.characterProfile.traits[].stress | org (2회) | 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 방역 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.sections.야망 | org (1회) | 방역 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0980 | 오타호 | $.sections.공포 | org (1회) | 방역 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0989 | 문마은 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-0990 | 이사벨 가르시아 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-0990 | 이사벨 가르시아 | $.fields.Affiliation | org (1회) | Transshipment State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0990 | 이사벨 가르시아 | $.biography | org (2회) | Isabel Garcia handles ticketless train departure and signature checks. Isabel Garcia reports unsigned train de ／ 이사벨 가르시아는 무표 열차 출발·서명 확인 업무를 맡는다. 이사벨 가르시아는 서명 없는 열차 출발을 에바 노바코바에게 알린다.

- 소속: 환적국
- 품계: 주사
- 생업: 무표 열차 출발·서명  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0990 | 이사벨 가르시아 | $.fields.소속 | org (1회) | 환적국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0990 | 이사벨 가르시아 | $.sections.야망 | org (1회) | 호송 전령 업무의 무표 열차 출발·서명 확인 기록을 환적국 장부와 이어, 다음 당직이 같은 기록을 확인하게 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.stateName | org (2회) | White Cross Order ／ 흰십자단 | 050 확정값으로 교체: state_id=government |
| person-0996 | 남빛원 | $.fields.Affiliation | org (1회) | White Cross Order | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.sections.Ambition | org (1회) | From the post of Medicinal Herb Management Resident, keeps the White Cross Order's ledgers continuous and unbr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.sections.Fear | org (1회) | Fears that if the Medicinal Herb Management Resident's watch falls vacant, the White Cross Order's passage wil | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.biography | org (2회) | He chooses first not to break the duty shift. He trusts a single line in the ledger more than loud talk.

- Li ／ 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 생업: 약재 관리 기록·당직 열쇠 인계
- 소속: 흰십자단
- 품계: 수련의
- 직함: 약재 물류상
**생애.** 207 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.characterProfile.traits[].behavior | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다. 제기동의 중립 의료국 흰십자단에서 담당 전문의의 도제로 배우며, 적아 구분 없이 중증도만으로 치료한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.characterProfile.traits[].stress | org (2회) | 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. ／ 이 경계가 흔들릴 때 카드에 명시된 우려: 공포. 약재 관리 수련의 당직이 비면 흰십자단의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.fields.소속 | org (1회) | 흰십자단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.sections.야망 | org (1회) | 약재 관리 수련의 자리에서 흰십자단의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0996 | 남빛원 | $.sections.공포 | org (1회) | 약재 관리 수련의 당직이 비면 흰십자단의 통행이 서울 내부 후원 세력 볼모가 되는 일을 두려워한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=geography:duchy:11620 |
| person-0998 | 이일섭 | $.fields.Affiliation | org (1회) | Standards League Vassal: Lee Clan of the First Sub-Workshop | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.fields.Work Location | org (1회) | Oryu 2-dong. At the First Sub-Workshop in Oryu 2-dong, Lee Ilseop recounts the grain stock for winter rations  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.Life | org (1회) | Heir of the Lee clan that carries on the First Sub-Workshop. In 2121, in his workshop duties at Oryu 2-dong, h | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.Anecdote | org (1회) | In 2123, Lee Ilseop recounted the grain stock three times before submitting the winter ration plan, and in the | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.Houses | org (1회) | The Lee clan is a vassal of the Standards League, and Lee Ilseop is the heir who carries on the First Sub-Work | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.Relationships | org (1회) | As heir of the Lee clan, a vassal of the Standards League, he carries on the First Sub-Workshop and, in his wo | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.biography | org (2회) | He is timid and slow to decide. On hearing dangerous news, he first thinks of a place to hide, and he recounts ／ 겁이 많고 결정이 느리다. 위험한 소식을 들으면 먼저 숨을 곳부터 생각하고, 밤새 장부를 다시 세어 다음 날에야 권안을 내놓는다. 그러나 믿는 일 앞에서는 물러서지 않는다.

- 소속: 규격맹 봉신 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.fields.소속 | org (1회) | 규격맹 봉신 제1분공방 이씨 가문 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.fields.업무 위치 | org (1회) | 오류2동. 이일섭은 오류2동 제1분공방에서 겨울 배급에 쓸 곡물 재고를 세 차례 세고 종자 대금 제안서를 규격맹 평의회로 올린다. 박도윤에게 제안서 수령 확인을 맡기고 류동현에게 작업 구역의 전력  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.생애 | org (1회) | 제1분공방을 잇는 이씨 가문의 후계다. 2121년 오류2동 공방 업무에서 밭을 일구고 곡물 재고를 맡았다. 밭과 보관 공간은 이 업무에 사용했으며 가문의 영토나 독점 소유는 아니었다. 2123년에는 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.일화 | org (1회) | 2123년 이일섭은 겨울 배급안을 올리기 전 곡물 재고를 세 차례 다시 세었고, 같은 해 분공방 부품 대금 일부를 종자로 받자고 규격맹 평의회에 제안하였다. 오류2동에서 밭의 경작과 보관 곡물 관리 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.가문 | org (1회) | 이씨 가문은 규격맹의 봉신이며, 이일섭은 제1분공방을 잇는 후계다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-0998 | 이일섭 | $.sections.관계 | org (1회) | 규격맹의 봉신인 이씨 가문의 후계로 제1분공방을 잇고, 오류2동의 공방 업무에서 분공방 부품 대금을 두고 규격맹 평의회에 제안을 올린다. 직속 전령 박도윤에게 전갈 전달과 수령 확인을, 직속 경비  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1001 | 곽가현 | $.stateName | org (2회) | Floodgate State ／ 수문국 | 050 확정값으로 교체: state_id=free-city |
| person-1001 | 곽가현 | $.fields.Affiliation | org (1회) | Floodgate State | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1001 | 곽가현 | $.characterProfile.traits[].stress | org (2회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1001 | 곽가현 | $.fields.소속 | org (1회) | 수문국 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1001 | 곽가현 | $.sections.야망 | org (1회) | 배급구역 서기 자리에서 수문국의 장부를 끊기지 않게 잇는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1001 | 곽가현 | $.sections.공포 | org (1회) | 배급구역 서기 당직이 비면 수문국의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1001 | 곽가현 | $.biography | org (1회) | 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.

- 소속: 수문국
- 생업: 급수 배분 당직
- 품계: 주사
- 직함: 배급구역 서기
**생애.** 2126년 세대. 영등포 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1002 | 성라현 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-1002 | 성라현 | $.fields.Affiliation | org (1회) | Standards League | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1002 | 성라현 | $.biography | org (2회) | Seong Rahyeon resolves not to announce that the detour is open until the ties have been checked.

- Affiliatio ／ 성라현은 침목 확인 전에는 우회로가 열렸다고 전하지 않기로 한다.

- 소속: 규격맹
- 생업: 환승 전갈 전달
- 품계: 조합원
- 직함: 작업반 전령
**생애.** 2126년 세대. 신내 환승  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1002 | 성라현 | $.characterProfile.traits[].stress | org (2회) | 작업반 전령 당직이 비면 규격맹의 통행이 강국 볼모가 되는 것. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1002 | 성라현 | $.fields.소속 | org (1회) | 규격맹 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.title | org (2회) | Standards League Guild Member · Leader of the Returning Party ／ 규격맹 조합원 · 귀환 일행 지휘자 | 050 확정값: “Leader of the Returning Party” |
| person-1003 | 조재표 | $.position | org (2회) | Standards League Guild Member · Leader of the Returning Party ／ 규격맹 조합원 · 귀환 일행 지휘자 | 050 확정값: “Leader of the Returning Party — signs off on travel routes, escort contracts, and withdrawal decisions”(빈 값 포함) |
| person-1003 | 조재표 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=S00 |
| person-1003 | 조재표 | $.fields.Feudal Title | org (1회) | None. Rank is that of a member in the Standards League Guild's hierarchy, not a Republic of Korea government p | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.Affiliation | org (1회) | Standards League Guild member, Jo Jaepyo's Party (faction shift on 2026-10-22) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.Civil and Community Duties | org (1회) | Commander of a renowned return party (Standards League Guild member). Signs off on travel routes, escort contr | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.Personal Ambition | org (1회) | Seeks to expand the return escort network within the framework of the Standards League Guild. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.biography | org (2회) | - Name: Jo Jaepyo
- Character ID: unaffiliated-jaepyo-jo. Permanent character ID K1003
- Home community: Grew  ／ - 성명: 조재표
- 캐릭터 ID: unaffiliated-jaepyo-jo. 영구 인물 ID K1003
- 출신 공동체: 서울 종로구 창신제1동의 창신 공동 거처에서 성장했고 지금도 그곳에 산다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.봉건 작위 | org (1회) | 없음. 품계는 규격맹 조합 직제의 조합원이며 대한민국 정부 관직·공무원 계급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.소속 | org (1회) | 규격맹 조합원, 조재표 일행(2026-10-22 세력 이동) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.민간·공동체 직무 | org (1회) | 유명 귀환 일행 지휘자(규격맹 조합원). 이동 경로·호위 계약·철수 판단에 서명한다. 개인 영지와 봉건 작위는 없다. 대한민국 정부 관직이나 공무원 계급이 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1003 | 조재표 | $.fields.개인 야망 | org (1회) | 규격맹 조합의 틀 안에서 귀환 호위망을 넓히려 한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1005 | 정서온 | $.position | org (2회) | Chairman of the Taeuk Group ／ 태욱그룹 회장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1005 | 정서온 | $.stateName | org (2회) | Taeuk Group ／ 태욱그룹 | 050 확정값으로 교체: state_id=arc |
| person-1005 | 정서온 | $.sections.Offices | org (1회) | Rank: Chairwoman. Title: Chairwoman of Taeuk Group. Livelihood alias: Chairwoman's Duties and Confirmation App | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1005 | 정서온 | $.biography | org (2회) | Chairwoman of Taeuk Group. Only daughter of the Jeong chairwoman's house. Jeong Seoon performs the chairwoman' ／ 태욱그룹 회장. 정씨 회장가의 외동딸. 정서온은 도곡1동에서 회장 직무를 보며 양재역 직영지의 기존 기록을 대조한다. 분가의 후계 주장과 정통회의 무응답을 확인한 뒤에도 생명안전 연구책임은 정호준에 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1005 | 정서온 | $.relations.outgoing[].basis | org (2회) | The Taeuk Group chairman has separated out the life safety research responsibility ／ 태욱그룹 회장이 생명안전 연구책임을 분리해 둠 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1005 | 정서온 | $.sections.관직 | org (1회) | 품계 회장. 직함은 태욱그룹 회장. 생업 별명은 회장 직무·검증 인준. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1006 | 탁서윤 | $.title | org (2회) | Commander of the Guui Garrison of Agwansa ／ 아관사 구의수비대장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1006 | 탁서윤 | $.position | org (2회) | Commander of the Guui Garrison of Agwansa ／ 아관사 구의수비대장 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1006 | 탁서윤 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-1006 | 탁서윤 | $.sections.Offices | org (1회) | Rank: Garrison Commander. Title: Guui Garrison Commander of Agwansa. Occupational alias: Guui Waterfront Guard | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1006 | 탁서윤 | $.biography | org (2회) | The working reference point is the Guui 3-dong waterfront guard and dual-command consensus desk of Tak Seoyun, ／ 아관사 구의수비대장 탁서윤의 구의3동 수변 경비·이원 합의 창구가 업무 기준점이다. 이 업무 기준점은 거주지·정확한 시설 경계·작위·영지·점유권을 정하지 않는다. 고서준과 전쟁·급수 명령을 공동 결 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1006 | 탁서윤 | $.sections.관직 | org (1회) | 품계 수비대장. 직함은 아관사 구의수비대장. 생업 별명은 구의 수변 경비·이원 합의. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-1007 | 김연규 | $.sections.Life | org (1회) | Of the 2126 generation. A records watch officer belonging to the Government of the Republic of Korea's Watch C | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.sections.Offices | org (1회) | Rank: Minister. Title: Head of the Onminui. Affiliation: Government of the Republic of Korea. Occupational ali | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.sections.Houses | org (1회) | The Government of the Republic of Korea's Watch Clan. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.biography | org (2회) | Head of the Onminui of the Government of the Republic of Korea. A person who seeks to preserve Seoul District  ／ 대한민국정부 온민의 수장. 서울 1통과 온전한 대한민국을 기록으로 남기려 하는 사람.

- 기여자: [code-yeongyu](https://github.com/code-yeongyu)
- 업무 위 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.sections.생애 | org (1회) | 2126년 세대. 대한민국정부 당직 가문 소속 기록 당직자다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.sections.관직 | org (1회) | 품계 장관. 직함은 온민의 수장. 소속은 대한민국정부. 생업 별명은 기록 당직·문서 등재. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1007 | 김연규 | $.sections.가문 | org (1회) | 대한민국정부 당직 가문. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.title | org (2회) | Vassal of the Standards League · in charge of communications maintenance and distribution (former lord of the  ／ 규격맹 봉신 · 통신 정비·배분 담당(전 대전선 군주, 왕격 보존) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.position | org (2회) | Vassal of the Standards League · in charge of communications maintenance and distribution (former lord of the  ／ 규격맹 봉신 · 통신 정비·배분 담당(전 대전선 군주, 왕격 보존) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=polity:daejeon |
| person-1008 | 민웅기 | $.fields.Affiliation | org (1회) | Vassal of the Standards League (formerly neutral Daejeon; faction shift of 2026-10-22) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.fields.Civil and Community Duties | org (1회) | In charge of communications maintenance and allocation. The former Daejeon lord (Daejeon Seon, Wanggyeok) was  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.biography | org (2회) | - Name: Min Ungi
- Character ID: K1008
- Contributor: [minpeter](https://github.com/minpeter)
- Home community ／ - 성명: 민웅기
- 캐릭터 ID: K1008
- 기여자: [minpeter](https://github.com/minpeter)
- 출신 공동체: 서울 내부 강남구청·수서 생활권
- 생년월일: 2 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.fields.소속 | org (1회) | 규격맹 봉신(전 중립 대전; 2026-10-22 세력 이동) | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1008 | 민웅기 | $.fields.민간·공동체 직무 | org (1회) | 통신 정비·배분 담당. 전직 대전 군주(대전선·왕격)는 2026-10-22 세력 이동으로 해소되었고 왕격은 규격맹 봉신의 개인 정치 등급으로 보존된다. 대한민국 정부 관직이나 봉건 작위가 아니다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-1009 | 신종목 | $.sections.Life | org (1회) | Born on 2087-09-18. In November 2119, as a senior operative of Eastern Command's Special Retrieval Squad, he h | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.sections.Offices | org (1회) | No rank. A field contractor of the Return Network, formerly a senior operative of Eastern Command's Special Re | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.sections.Relationships | org (1회) | He looks after his son Sin Jun and preserves the record of his withdrawal from Bae Ujin's Eastern Command; his | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.biography | org (2회) | Affiliated with Agwansa (S14), under Gateway Commander Go Seojun. The work reference point is Sin Jongmok's es ／ 소속은 아관사(S14)이며 관문사령관 고서준의 산하다. 신종목의 논현2동 호위·탐사 계약·무전 송신 창구가 업무 기준점이다. 이 업무 기준점은 거주지·정확한 시설 경계·작위·영지·점유권을 정하지 않 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.relations.outgoing[].basis | org (4회) | Former senior operative of the Eastern Command Special Recovery Team ／ Under Agwansa Gate Commander Go Seojun | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.characterProfile.traits[].stress | org (1회) | 미귀환 연락에도 주민 기록을 동방사 지휘 아래 넘기지 않는다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.sections.생애 | org (1회) | 2087-09-18에 태어났다. 2119년 11월 동방사 특수회수반 선임 공작원으로 명부 밖 피난민의 귀환을 맡았고, 보고서에는 명령 불복종·지급품 손실·퇴로를 지킨 반원의 실종 처리가 남았다. 2 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.sections.관직 | org (1회) | 품계 없음. 귀환망 현장 계약자이며 전직은 동방사 특수회수반 선임 공작원이다. 생업은 호위·탐사 계약·무전 송신이고 호출부호는 백야다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1009 | 신종목 | $.sections.관계 | org (1회) | 아들 신준을 돌보고 배우진의 동방사에서 물러난 기록을 보존하며, 산하 지휘관은 아관사 관문사령관 고서준이다. 민웅기와는 서울 내부 귀환합성국의 정비 기록·대체 경로·현장 회수·주민 동의를 나누어 맡 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1010 | 신준 | $.stateName | org (2회) | Russian Legation Command ／ 아관사 | 050 확정값으로 교체: state_id=government |
| person-1010 | 신준 | $.biography | org (2회) | Affiliated with Agwansa (S14) and the son of Sin Jongmok. Born on 2114-01-01, he is twelve years old as of the ／ 소속은 아관사(S14)이며 신종목의 아들이다. 2114-01-01에 태어나 2126년 개막 현재 열두 살이다.

**생애.** 신준은 폐역 방송·무전 잡음·차량 진동이 겹칠 때 낡은 호출 리듬과 경 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1011 | 린샤오메이 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-1011 | 린샤오메이 | $.fields.Affiliation | org (1회) | Standards League (S02). Interpreter Market ledger. Registered at the Standards League market counter only as a | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1011 | 린샤오메이 | $.fields.Personal Ambition | org (1회) | To open the currency exchange counter under the Interpreter Market seal rather than the seal of the Southwest  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1011 | 린샤오메이 | $.biography | org (2회) | - Name: Lin Xiaomei. Ledger Hangul name: Im Somae. Called Xiaomei in Daerim
- Character ID: K1011
- Birthplace ／ - 성명: 린샤오메이. 장부 한글 임소매. 대림에서는 샤오메이
- 캐릭터 ID: K1011
- 출생지: 대림
- 성별: 여성
- 품계: 없음
- 가치관: 권위 −20 \| 개방 40 \| 무력 −3 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1011 | 린샤오메이 | $.fields.소속 | org (1회) | 규격맹(S02). 통역시장 장부. 규격맹 시장 창구에 통역으로만 등록 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1011 | 린샤오메이 | $.fields.개인 야망 | org (1회) | 환전 창구를 서남 규격맹 평의회 도장이 아니라 통역시장 도장으로 연다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1012 | 팜반득 | $.stateName | org (2회) | Standards League ／ 규격맹 | 050 확정값으로 교체: state_id=free-city |
| person-1012 | 팜반득 | $.fields.Affiliation | org (1회) | Standards League (S02). Remnant dormitory shift ledger. His name appears as a subcontractor to the Southwest E | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1012 | 팜반득 | $.fields.Personal Ambition | org (1회) | To raise the dormitory household roster to the same standing as citizenship in the Standards League Council | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1012 | 팜반득 | $.biography | org (2회) | - Name: Pam Ban-deuk. Dormitory roster: Deok. Hangul ledger: Beom Ban-deuk
- Character ID: K1012
- Date of bir ／ - 성명: 팜반득. 기숙사 명부 덕. 장부 한글 범반득
- 캐릭터 ID: K1012
- 생년월일: 2089-04-17. 나이: 2126년 12월 31일 기준 만 37세
- 출생지: 가산 생활권
-  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1012 | 팜반득 | $.fields.소속 | org (1회) | 규격맹(S02). 기숙 잔존 교대 장부. 서남 공병대에 하청으로 이름이 있다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1012 | 팜반득 | $.fields.개인 야망 | org (1회) | 기숙사 세대 명부를 규격맹 평의회 시민권과 같은 급으로 올린다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1013 | 아미라 카심 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-1013 | 아미라 카심 | $.fields.Community of origin | org (1회) | Itaewon Passage Alley. Pre-collapse interpreting and lodging. Amira Kasim was born in Itaewon in 2084. She lea | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1013 | 아미라 카심 | $.fields.Affiliation | org (1회) | Transshipment State (S07). Itaewon Passage Alley. Interpreting service for the Transshipment State dispatch wi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1013 | 아미라 카심 | $.biography | org (2회) | - Name: Amira Kasim. Itaewon pass: Amira. Hangul ledger: Amira
- Character ID: K1013
- Birthplace: Itaewon
- S ／ - 성명: 아미라 카심. 이태원 통행증에는 Amira. 한글 장부 아미라
- 캐릭터 ID: K1013
- 출생지: 이태원
- 성별: 남성
- 품계: 없음
- 가치관: 권위 0 \| 개방 50 \|  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1013 | 아미라 카심 | $.fields.출신 공동체 | org (1회) | 이태원 통행 골목. 붕괴 전 통역·숙박. 아미라 카심은 2084년 이태원에서 태어났다. 이라크 아랍계 통역·숙박 가계에서 영어와 아랍어를 익히고, 환적국 배차 창구에서 한국어 통행 용어와 다국어 통 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1013 | 아미라 카심 | $.fields.소속 | org (1회) | 환적국(S07). 이태원 통행 골목. 환적국 배차 창구의 통역 용역 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1014 | 조엘 박 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-1014 | 조엘 박 | $.fields.Affiliation | org (1회) | Transshipment State (S07). Fence Contract Labor ledger. Registered with the Transshipment State as warehouse m | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1014 | 조엘 박 | $.biography | org (2회) | - Name: Joel Bak. Inside the Fence, Joel. Vassal-State Ledger: Bak Joel
- Character ID: K1014
- Birthplace: Yo ／ - 성명: 조엘 박. 울타리 안에서는 Joel. 후국 장부 박조엘
- 캐릭터 ID: K1014
- 출생지: 용산
- 성별: 여성
- 품계: 없음
- 가치관: 권위 10 \| 개방 10 \| 무력 − | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1014 | 조엘 박 | $.fields.소속 | org (1회) | 환적국(S07). 울타리 용역 장부. 환적국에 창고 기억으로 등록 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1015 | 나르기즈 유수포바 | $.stateName | org (2회) | Anguk Grand Monastery ／ 안국총림 | 050 확정값으로 교체: state_id=government |
| person-1015 | 나르기즈 유수포바 | $.fields.Affiliation | clergy (1회) | Anguk Monastic Grove (S10). Koryo-saram boardinghouse register. Dual registration with both the Register Churc | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1015 | 나르기즈 유수포바 | $.biography | clergy+org (2회) | - Name: Nargiz Yusupova. Called Nargiz at the boarding house. Written in Hangul in the ledger as Nargiz
- Char ／ - 성명: 나르기즈 유수포바. 하숙에서는 나르기즈. 장부 한글 나르기즈
- 캐릭터 ID: K1015
- 출생지: 자양
- 성별: 남성
- 품계: 없음
- 가치관: 권위 −20 \| 개방 40 \|  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1015 | 나르기즈 유수포바 | $.proseContacts[].basis | org (1회) | 주요 관계: 안국총림 방장 백온과 협력. 뚝섬 기동 정비조와 숙소 계약 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1015 | 나르기즈 유수포바 | $.fields.소속 | org (1회) | 안국총림(S10). 고려인 하숙 명부. Arc와 안국총림 사이에 이중 등록 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1015 | 나르기즈 유수포바 | $.fields.주요 관계 | org (1회) | 안국총림 방장 백온과 협력. 뚝섬 기동 정비조와 숙소 계약 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1015 | 나르기즈 유수포바 | $.fields.업무 위치 | org (1회) | 종로1·2·3·4가동 행정동 범위. 생업: 전령; 자양·건대 고려인 하숙과 뚝섬 숙소 계약을 서울 안에서 보존한다. 화양동·자양4동은 하숙 생활권의 동 수준 정밀화 제안이며 특정 필지나 두 집 보유 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1016 | 최일석 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-1016 | 최일석 | $.fields.Affiliation | org (1회) | Seoul Metropolitan Government local civil service organization. Clerk of the Guro–Geumcheon axis Mobilization  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1016 | 최일석 | $.fields.Personal Ambition | org (1회) | Keeps the register as a mobilization ledger rather than a Standards League Council ledger, preventing it from  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1016 | 최일석 | $.biography | org (2회) | - Name: Choe Ilseok
- Character ID: K1016
- Date of birth: 2087-09-03. Age: 39 (international age) as of Decem ／ - 성명: 최일석
- 캐릭터 ID: K1016
- 생년월일: 2087-09-03. 나이: 2126년 12월 31일 기준 만 39세
- 출생지: 구로
- 성별: 남성
- 직위·직급: 지방행정서기(8급 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1016 | 최일석 | $.fields.소속 | org (1회) | 서울특별시 지방공무원 조직. 구로·금천 축 동원잔존 서기. 규격맹 장부에는 「외부 무장」 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1016 | 최일석 | $.fields.개인 야망 | org (1회) | 명부를 규격맹 평의회가 아니라 동원 장부로 유지해 사병화를 막는다 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1017 | 지연희 | $.characterProfile.traits[].relationship | clergy (1회) | 문도현과 인계 연락을 나누지만 길목사무소 계약에 묶여 있다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1017 | 지연희 | $.characterProfile.narrative | clergy (1회) | 친절로 경계를 풀고 정보와 교섭으로 일을 성사시키지만 길목사무소의 빚과 계약에 묶여 있다. 비밀 명단의 인물을 죽이면 계약을 끝내 준다는 조건을 받아들였으나 그 행위의 완료는 기록되지 않았다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1017 | 지연희 | $.fields.소속 | clergy (1회) | 겉으로는 독립 전령이다. 실제로는 여러 세력의 소식과 비밀을 모아 거래하는 길목사무소에 속해 있다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1017 | 지연희 | $.fields.개인 야망 | clergy (1회) | 길목사무소에서 벗어나 자유를 얻으려 한다. 이 목표는 남에게 밝히지 않는다. | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1017 | 지연희 | $.fields.관계 | clergy (1회) | 갈 곳이 없던 지연희에게 길목사무소가 은신처와 생계를 주었다. 그 대가로 진 빚과 계약 때문에 지연희는 조직을 떠나지 못한다. 지연희는 전달물의 인수·인계 소식을 문도현에게 전하고 다음 운송 상대의 | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1017 | 지연희 | $.biography | clergy (1회) | - 성명: 지연희 (Ji Yeonhee)
- 캐릭터 ID: K1017
- 출신 공동체: 2119년 겨울 후암동의 거처에서 피난해 회현동에 자리 잡았다. 지금은 서울역의 생활 화물 인계 창구를 전령  | §4 금지 어휘 — 아크 정본 용어(교주·세례·총회 의장) 또는 일반 시설명; 잔여 재직함은 Q22·Q23·Q26 대기 |
| person-1018 | 고예진 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-1018 | 고예진 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation (S16). She holds no office in any state. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1018 | 고예진 | $.fields.Civil and Community Duties | org (1회) | Inter-Region Contract Advisor. This is not an office of the Government of the Republic of Korea or a feudal ra | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1018 | 고예진 | $.biography | org (1회) | - Name: Goh Yejin
- Character ID: K1018
- Home community: She grew up in the Isu Station living sphere. Her bi | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1019 | 박성수 | $.stateName | org (2회) | Government of the Republic of Korea ／ 대한민국정부 | 050 확정값으로 교체: state_id=government |
| person-1019 | 박성수 | $.fields.Affiliation | org (1회) | Government of the Republic of Korea (S06). An independent recorder. He keeps and manages copies of On Minui's  | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1019 | 박성수 | $.fields.Civil and Community Duties | org (1회) | Copy Keeper — aligns copies across multiple regions, gathers revision requests and passes them to Kim Yeongyu. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1019 | 박성수 | $.fields.Personal Ambition | sixteen (1회) | He wants to place copies of the same edition in all sixteen states. | 세 세력·25공작령 표현으로 재작성(십육국 프레임 제거) |
| person-1019 | 박성수 | $.biography | org+sixteen (2회) | - Name: Park Seongsu (Park Seongsu)
- Character ID: K1019
- Date of birth: 2095-03-04
- Language: Korean
- Liv ／ - 성명: 박성수 (Park Seongsu)
- 캐릭터 ID: K1019
- 생년월일: 2095-03-04
- 언어: 한국어
- 생업: 주 통신선 정비 / 부 기록 보관
- 소속: 대한민국정부(S0 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1019 | 박성수 | $.fields.소속 | org (1회) | 대한민국정부(S06). 독립 기록인이다. 온민의의 문서 '서울 1통과 온전한 대한민국'의 사본을 여러 권역에 두고 관리한다. | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1019 | 박성수 | $.fields.개인 야망 | sixteen (1회) | 십육국 모두에 같은 판의 사본을 두려 한다. | 세 세력·25공작령 표현으로 재작성(십육국 프레임 제거) |
| person-1020 | 한서경 | $.stateName | org (1회) | Jeongdong Labor Federation | 050 확정값으로 교체: state_id=arc |
| person-1020 | 한서경 | $.fields.Affiliation | org (1회) | Jeongdong Labor Federation (S16). Contract practitioner | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1020 | 한서경 | $.biography | org (1회) | - Name: Han Seogyeong (Han Seogyeong)
- Character ID: K1020
- Community of origin: Birthplace and place of upb | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1022 | 문도현 | $.stateName | org (2회) | Transshipment State ／ 환적국 | 050 확정값으로 교체: state_id=government |
| person-1022 | 문도현 | $.biography | org (2회) | - Name: Mun Dohyeon (Mun Dohyeon)
- Character ID: K1022
- Home community: Has a business base at Yongsan Stati ／ - 성명: 문도현 (Mun Dohyeon)
- 캐릭터 ID: K1022
- 출신 공동체: 한강로동의 용산역에 업무 거점을 두고, 한강로동의 임차 거처에서 산다. 출생지·성장지는 미정이다.
- 생년월 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
| person-1022 | 문도현 | $.fields.소속 | org (1회) | 환적국(S07). 독립 상단 | 옛 조직명 → 세력 표기명 매핑(aux-rules.md §1·§5 표) |
