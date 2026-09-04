# 세계 서사 총람

붕괴 이후 서울의 운영가문과 확장 설정을 한 페이지에 등록한다. 이 페이지만 손으로 고친다. 쪼갠 문서와 그림은 읽기 전용 투영물이다.

## 문서 식별

| 항목 | 값 |
| --- | --- |
| 안정 식별자 | WNA-001 |
| 표시 이름 | 세계 서사 총람 |
| 문서 상태 | 활성 |
| 소유자 | wiki-world |
| 지원 검토자 | (없음, 외부 검토 대기) |
| 개정 | r4 |
| 마지막 검증 커밋 | `c485bc84629c39e978889f1585ade92bef4ceda4` |
| 출처층 | original-fiction |
| 출처 앵커 | Cast-Index.md, Sixteen-States.md, Research-Sources.md |
| 의존 문서 | Cast-Index.md, Sixteen-States.md, Unofficial-Fan-AU-Notice.md |
| 관련 식별자 | HC01–HC14, HP01–HP10 |
| 투영 대상 | Operating-Houses.md |
| 변경 원장 항목 | CL-0004 |
| 검증 상태 | 가문 등록 |

## 한국어 작법 계약

서사 본문은 지금 한국어 3인칭 제한 시점의 한다체를 씁니다. 안내문과 스키마 설명은 짧은 합니다체를 씁니다. 한 문단은 한 원인 결과만 움직입니다. 장면은 장소와 행동과 대가를 먼저 두고, 정치 해석은 뒤에 둡니다.

인물의 이름, 소속, 직위, 관계, 행위 주체를 바뀌지 않게 보존합니다. 호칭 변화는 장면 안의 관계 원인이 있을 때만 허용합니다. 번역체, 명사 나열 행정문, 같은 리듬의 셋 묶음, 교환 가능한 트라우마 요약은 피합니다.

다문화·초국경 인물은 이주, 언어, 가족, 생업, 시민 이력으로 그립니다. 민족이나 국적이 충성, 폭력, 계급, 능력, 괴물성을 예측하지 않습니다.

합성 인격은 센서 불확실, 에너지와 부품, 보관 책임, 기억 끊김 안에서만 봅니다. 전지적 서술자나 무한 동력으로 쓰지 않습니다.

사실, 추론, 창작은 `source_kind`로 분리합니다. 지금 실재하는 기관을 허구 범죄의 주체로 적지 않습니다.

## 인간 식별자

`K001`–`K412`는 현재 인물 총람 표의 행 순서와 같습니다. 나중에 정렬하거나 프로필을 고쳐도 번호를 다시 매기지 않습니다. 합성 식별자 `H`/`F`/`V`와 겹치지 않습니다.

## 운영가문

법인 후계 14개(`HC01`–`HC14`)와 시민·직능·기반 10개(`HP01`–`HP10`)를 헌장 조직으로 둡니다. 어느 가문도 16국 한 나라를 통째로 소유하지 않습니다. 실재 회사의 상호, 로고, 구호, 제품명, 현직 임원은 허구 본문에 쓰지 않습니다.

상세 필드는 아래 기계 등록부를 정본으로 합니다.

## 기계 등록부

```json
{
  "schema": "world-narrative-atlas.v1",
  "document": {
    "id": "WNA-001",
    "display_name": "세계 서사 총람",
    "document_status": "active",
    "owner": "wiki-world",
    "support_reviewers": [],
    "revision": "r4",
    "last_verified_commit": "c485bc84629c39e978889f1585ade92bef4ceda4",
    "source_kind": "original-fiction",
    "source_anchors": [
      "docs/game-logic/Cast-Index.md",
      "docs/game-logic/Sixteen-States.md",
      "docs/game-logic/Research-Sources.md"
    ],
    "dependencies": [
      "Cast-Index.md",
      "Sixteen-States.md",
      "Unofficial-Fan-AU-Notice.md"
    ],
    "related_ids": [
      "HC01",
      "HC02",
      "HC03",
      "HC04",
      "HC05",
      "HC06",
      "HC07",
      "HC08",
      "HC09",
      "HC10",
      "HC11",
      "HC12",
      "HC13",
      "HC14",
      "HP01",
      "HP02",
      "HP03",
      "HP04",
      "HP05",
      "HP06",
      "HP07",
      "HP08",
      "HP09",
      "HP10"
    ],
    "projection_targets": [
      "Operating-Houses.md"
    ],
    "change_ledger_entry": "CL-0004",
    "verification_state": "houses-authored"
  },
  "writing_contract": {
    "narrative_register": "plain-da",
    "guide_register": "hamnida",
    "viewpoint": "third-limited",
    "honorifics": "relationship-caused",
    "multicultural_rule": "individual-history-not-token",
    "synthetic_rule": "embodied-limits",
    "hostile_rule": "need-not-evil-label",
    "source_kind_visible": true
  },
  "humans": [
    {
      "id": "K001",
      "name": "한재목",
      "role": "급수총재",
      "stage": "주요",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K002",
      "name": "이서담",
      "role": "양천 배급구역 대표",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K003",
      "name": "김태운",
      "role": "수문경비대장",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K004",
      "name": "박누리",
      "role": "영등포 정수공정 감독",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K005",
      "name": "최한결",
      "role": "신정기지 장갑보수열차장",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K006",
      "name": "정모란",
      "role": "여의도 수상운송 조합장",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K007",
      "name": "장필규",
      "role": "급수계약 감사관",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K008",
      "name": "임바다",
      "role": "서부 급수권 시민대표",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K009",
      "name": "유세진",
      "role": "신정기지 철도통행 배차관",
      "stage": "S1",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K010",
      "name": "허도담",
      "role": "신정기지 수문펌프 정비사",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K011",
      "name": "구태윤",
      "role": "양천 급수시장 물류상",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K012",
      "name": "진하겸",
      "role": "여의도 수문의무원",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K013",
      "name": "채온결",
      "role": "영등포 관로 순찰대 조장",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K014",
      "name": "표시완",
      "role": "수문헌장 전령",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K015",
      "name": "명우재",
      "role": "한강 침수관로 탐사원",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K016",
      "name": "제윤",
      "role": "신정기지 통행세 기록관",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K017",
      "name": "변고운",
      "role": "영등포 대합실 역장",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K018",
      "name": "허은찬",
      "role": "신정기지 유치선 전력감독",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K019",
      "name": "구하온",
      "role": "여의도 선창시장 경매사",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K020",
      "name": "진세빈",
      "role": "양천 이동의무차 반장",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K021",
      "name": "채한솔",
      "role": "신정기지 비상발전 운전장",
      "stage": "S2",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K022",
      "name": "고늘결",
      "role": "신정-뚝도 급수호송 열차 승무원",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K023",
      "name": "배초담",
      "role": "급수계약 만료 협상 서기",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K024",
      "name": "류한뫼",
      "role": "유언 사본 입회 증인",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K025",
      "name": "엄새울",
      "role": "영등포 탁수 피해 구역 대표",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K026",
      "name": "여리안",
      "role": "첫 협약 원본 보관 서기",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K027",
      "name": "기바름",
      "role": "서부 비상 호송 전령",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K028",
      "name": "우오름",
      "role": "약소국 회의 급수병참 서기",
      "stage": "S3",
      "state_id": "S01",
      "state_name": "여의신정수문정부",
      "source_anchor": "Cast-Index.md#S01"
    },
    {
      "id": "K029",
      "name": "강민서",
      "role": "제작평의회 중재자",
      "stage": "주요",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K030",
      "name": "정시우",
      "role": "천왕기지 제작원로",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K031",
      "name": "김나율",
      "role": "구로 노동조합 서기",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K032",
      "name": "이강묵",
      "role": "금천 경비대장",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K033",
      "name": "박소언",
      "role": "구로 건물조합 대표",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K034",
      "name": "최다인",
      "role": "공병 작업반장",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K035",
      "name": "장우석",
      "role": "수리규격 감사기록관",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K036",
      "name": "임채원",
      "role": "방호복 직능 대표",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K037",
      "name": "한지온",
      "role": "금천 원수식량 시민대표",
      "stage": "S1",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K038",
      "name": "허다온",
      "role": "천왕기지 차륜 정비사",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K039",
      "name": "구찬솔",
      "role": "구로 공구시장 물류상",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K040",
      "name": "진우람",
      "role": "금천 공방의무원",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K041",
      "name": "채리울",
      "role": "구로 공방 순찰대 조장",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K042",
      "name": "표강호",
      "role": "제작규격 전령",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K043",
      "name": "명소이",
      "role": "남서 외곽선로 탐사원",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K044",
      "name": "제하온",
      "role": "숙련점수 원장 기록관",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K045",
      "name": "변시람",
      "role": "구로 대합실 역장",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K046",
      "name": "표예담",
      "role": "천왕기지 유치배차 실무장",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K047",
      "name": "명다해",
      "role": "금천 배급솥 시장 중개인",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K048",
      "name": "제문석",
      "role": "구로 분진진료소 의무장",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K049",
      "name": "변주아",
      "role": "구로 전력간선 발전운전장",
      "stage": "S2",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K050",
      "name": "종마루",
      "role": "가짜 펌프 부품 피해자 대표",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K051",
      "name": "고모래",
      "role": "복구복무 거부 증언 서기",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K052",
      "name": "배온결",
      "role": "공신 보상 원장 서기",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K053",
      "name": "류겨레",
      "role": "난민 수용 전령",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K054",
      "name": "엄누리",
      "role": "후계시험 부품 감정 직공",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K055",
      "name": "여시온",
      "role": "제작헌장 전령",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K056",
      "name": "기필호",
      "role": "패권전 제작 병참",
      "stage": "S3",
      "state_id": "S02",
      "state_name": "서남제작동맹",
      "source_anchor": "Cast-Index.md#S02"
    },
    {
      "id": "K057",
      "name": "서이안",
      "role": "생명안전 연구책임자",
      "stage": "주요",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K058",
      "name": "정하린",
      "role": "생명안전 심사관",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K059",
      "name": "최은재",
      "role": "기술인증 평의원",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K060",
      "name": "이봄결",
      "role": "방재대장",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K061",
      "name": "김도하",
      "role": "마곡·방화 주민대표",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K062",
      "name": "유민호",
      "role": "방화기지 유치·배차장",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K063",
      "name": "박진솔",
      "role": "종자보존고 책임자",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K064",
      "name": "장예린",
      "role": "서부 수질검사망 운영관",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K065",
      "name": "임시온",
      "role": "연구기록·통신서고 감사관",
      "stage": "S1",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K066",
      "name": "허서겸",
      "role": "방화기지 연구차량 정비사",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K067",
      "name": "구연재",
      "role": "마곡 인증화물 물류상",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K068",
      "name": "진채온",
      "role": "실험동 안전의무원",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K069",
      "name": "채봄",
      "role": "방화 관문 순찰대 조장",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K070",
      "name": "표지안",
      "role": "공동기술원장 전령",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K071",
      "name": "명해솔",
      "role": "서부 외곽 활주로터 탐사원",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K072",
      "name": "제라온",
      "role": "기술인증 사본 기록관",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K073",
      "name": "변태온",
      "role": "마곡 대합실 역장",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K074",
      "name": "허미리",
      "role": "방화기지 유치 실무장",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K075",
      "name": "구선율",
      "role": "방화 주민시장 중개인",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K076",
      "name": "진마루",
      "role": "방재 의무호송 반장",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K077",
      "name": "채무진",
      "role": "종자보존고 비상발전 운전장",
      "stage": "S2",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K078",
      "name": "우다온",
      "role": "음성기록 원본 호송원",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K079",
      "name": "고초윤",
      "role": "수질 검사 공개 증인",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K080",
      "name": "배서율",
      "role": "가짜 약품 표본 피해자 대표",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K081",
      "name": "류하늘",
      "role": "대정전 비상권한 서기",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K082",
      "name": "엄도한",
      "role": "연구자 파견 호송책",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K083",
      "name": "여다솜",
      "role": "약소국 회의 기술공유 서기",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K084",
      "name": "기서진",
      "role": "비군사 공동조사 전령",
      "stage": "S3",
      "state_id": "S03",
      "state_name": "마곡연구평의회",
      "source_anchor": "Cast-Index.md#S03"
    },
    {
      "id": "K085",
      "name": "임하준",
      "role": "펌프기술 총관, 현재 실종",
      "stage": "주요",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K086",
      "name": "임초원",
      "role": "펌프기술자, 임하준의 양자",
      "stage": "주요",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K087",
      "name": "한소미",
      "role": "성수 공방평의회 대표",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K088",
      "name": "박세린",
      "role": "펌프기술가문 대행",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K089",
      "name": "김보람",
      "role": "뚝도 펌프수비대장",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K090",
      "name": "이준택",
      "role": "군자기지 차량정비장",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K091",
      "name": "최나래",
      "role": "공방 기동정비조장",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K092",
      "name": "정가온",
      "role": "공방평의회 기록감사",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K093",
      "name": "장민재",
      "role": "성수·성동 급수 시민대표",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K094",
      "name": "유하은",
      "role": "성수 가죽·소형기계 직능대표",
      "stage": "S1",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K095",
      "name": "허겸",
      "role": "성수 골목펌프 정비사",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K096",
      "name": "구도영",
      "role": "성수 패킹운송 물류상",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K097",
      "name": "진모래",
      "role": "뚝도 펌프실 의무원",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K098",
      "name": "채구름",
      "role": "성동 교량 순찰대 조장",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K099",
      "name": "표산하",
      "role": "공방평의회 전령",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K100",
      "name": "명강산",
      "role": "군자-성수 침수터널 탐사원",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K101",
      "name": "제하율",
      "role": "공방 조립기록 실무관",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K102",
      "name": "변오름",
      "role": "성수 대합실 역장",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K103",
      "name": "표누리",
      "role": "군자기지 유치 실무장",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K104",
      "name": "명우솔",
      "role": "성수 공방시장 경매사",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K105",
      "name": "제바름",
      "role": "성동 골목의무소 원장",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K106",
      "name": "변석훈",
      "role": "뚝도 펌프실 발전운전장",
      "stage": "S2",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K107",
      "name": "종나솔",
      "role": "뚝도-신정 급수호송 열차 승무원",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K108",
      "name": "고은하",
      "role": "세 유언 공방 서기",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K109",
      "name": "배나경",
      "role": "급수계약 만료 협상 서기",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K110",
      "name": "류다인",
      "role": "가짜 정수 부품 피해자 직공",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K111",
      "name": "엄미래",
      "role": "유언 증거 호송 전령",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K112",
      "name": "여민우",
      "role": "암호화 정비일지 발견 증인",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K113",
      "name": "기하겸",
      "role": "보호군 파견 거부 민병 조장",
      "stage": "S3",
      "state_id": "S04",
      "state_name": "뚝도공방연합",
      "source_anchor": "Cast-Index.md#S04"
    },
    {
      "id": "K114",
      "name": "배우진",
      "role": "상수호위사령",
      "stage": "주요",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K115",
      "name": "김우찬",
      "role": "상수호위단 참모장",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K116",
      "name": "정소율",
      "role": "상수행정청장",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K117",
      "name": "장석윤",
      "role": "고덕 장교단 교관",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K118",
      "name": "이윤서",
      "role": "동부 교량봉쇄대장",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K119",
      "name": "박하율",
      "role": "고덕기지 열차정비장",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K120",
      "name": "최도윤",
      "role": "동부 급수구역 시민대표",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K121",
      "name": "임겨레",
      "role": "동부 관문세·보호계약 감사관",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K122",
      "name": "한보라",
      "role": "동부 순찰열차장",
      "stage": "S1",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K123",
      "name": "양필호",
      "role": "고덕기지 차륜 정비사",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K124",
      "name": "주은솔",
      "role": "동부 관문세 물류상",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K125",
      "name": "차나루",
      "role": "암사 정수 의무원",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K126",
      "name": "설강우",
      "role": "암사 급수구역 순찰대 조장",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K127",
      "name": "지목현",
      "role": "상수호위단 전령",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K128",
      "name": "마길상",
      "role": "동부 교량 하부 탐사원",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K129",
      "name": "연하진",
      "role": "상수행정 급수원장 기록관",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K130",
      "name": "나효원",
      "role": "암사역 대합실 역장",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K131",
      "name": "양기석",
      "role": "고덕기지 유치선 감독",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K132",
      "name": "주단아",
      "role": "고덕 급수시장 경매사",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K133",
      "name": "차윤목",
      "role": "동부 이동의무차 반장",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K134",
      "name": "설봄이",
      "role": "고덕기지 비상발전 운전장",
      "stage": "S2",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K135",
      "name": "우지호",
      "role": "군사호적 등록 서기",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K136",
      "name": "종하린",
      "role": "북산 행렬 급수-복무 전령",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K137",
      "name": "고재민",
      "role": "의료열차 적발 포로 증인",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K138",
      "name": "배은찬",
      "role": "보호조항 병참 서기",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K139",
      "name": "류가온",
      "role": "보호군 파견 호송책",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K140",
      "name": "엄시완",
      "role": "동부 헌장 선언 전령",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K141",
      "name": "여서하",
      "role": "검은 배차표 조사 서기",
      "stage": "S3",
      "state_id": "S05",
      "state_name": "암사고덕상수단",
      "source_anchor": "Cast-Index.md#S05"
    },
    {
      "id": "K142",
      "name": "윤서린",
      "role": "기록청장",
      "stage": "주요",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K143",
      "name": "강예준",
      "role": "인준 심사관",
      "stage": "S1",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K144",
      "name": "조하린",
      "role": "문서고 사서",
      "stage": "S1",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K145",
      "name": "윤지율",
      "role": "의료이송 기록관",
      "stage": "S1",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K146",
      "name": "오서율",
      "role": "계약 공증관",
      "stage": "S1",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K147",
      "name": "서라온",
      "role": "지도 복구 사서",
      "stage": "S1",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K148",
      "name": "지서윤",
      "role": "서울역 문서고 제습 정비사",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K149",
      "name": "마도한",
      "role": "도성 공증사본 물류상",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K150",
      "name": "연지우",
      "role": "서울역 의무실 의무원",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K151",
      "name": "나선재",
      "role": "문서고 수비 순찰대 조장",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K152",
      "name": "양해온",
      "role": "인준 심사 전령",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K153",
      "name": "주리안",
      "role": "북부 정수 배관 탐사원",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K154",
      "name": "차세온",
      "role": "유언 필적 기록관",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K155",
      "name": "설다흰",
      "role": "서울역 대합실 역장",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K156",
      "name": "지한솔",
      "role": "서울역 서고기지 감독",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K157",
      "name": "마은결",
      "role": "종로 공증사본 시장 경매사",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K158",
      "name": "연태솔",
      "role": "중앙 재난의료 조정 실무관",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K159",
      "name": "나봄결",
      "role": "문서고 비상발전 운전장",
      "stage": "S2",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K160",
      "name": "홍예준",
      "role": "유언 검증 서기",
      "stage": "S3",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K161",
      "name": "추서윤",
      "role": "급수계약 인준 청구 증인",
      "stage": "S3",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K162",
      "name": "어태산",
      "role": "열여섯 깃발 인준 보관인",
      "stage": "S3",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K163",
      "name": "란지호",
      "role": "공신 보상 명부 당사자",
      "stage": "S3",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K164",
      "name": "섭도윤",
      "role": "약소국 회의 기록 전령",
      "stage": "S3",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K165",
      "name": "평예준",
      "role": "비상권한 반환 증인",
      "stage": "S3",
      "state_id": "S06",
      "state_name": "도성기록청",
      "source_anchor": "Cast-Index.md#S06"
    },
    {
      "id": "K166",
      "name": "박태겸",
      "role": "철도조정관",
      "stage": "주요",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K167",
      "name": "신가온",
      "role": "선로 가문 원로",
      "stage": "S1",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K168",
      "name": "권시온",
      "role": "열차 배차원",
      "stage": "S1",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K169",
      "name": "황지호",
      "role": "선로 도제",
      "stage": "S1",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K170",
      "name": "송이든",
      "role": "환적 배차원",
      "stage": "S1",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K171",
      "name": "강다은",
      "role": "선로 가문 배차원",
      "stage": "S1",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K172",
      "name": "양건우",
      "role": "용산창 제동 정비사",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K173",
      "name": "주서람",
      "role": "환적창고 물류상",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K174",
      "name": "차호민",
      "role": "용산창 의무원",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K175",
      "name": "설민우",
      "role": "선로 봉쇄 순찰대 조장",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K176",
      "name": "지온유",
      "role": "후국회의 전령",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K177",
      "name": "마하린",
      "role": "한강 북안 폐선 탐사원",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K178",
      "name": "연시완",
      "role": "열차 배차원장 기록관",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K179",
      "name": "나길호",
      "role": "용산역 대합실 역장",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K180",
      "name": "양채윤",
      "role": "용산창 유치선 감독",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K181",
      "name": "주하음",
      "role": "강변 환적시장 경매사",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K182",
      "name": "차라온",
      "role": "용산창 이동의무차 반장",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K183",
      "name": "설우찬",
      "role": "환적창고 비상발전 운전장",
      "stage": "S2",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K184",
      "name": "단시온",
      "role": "배차 기록 열람 청구인",
      "stage": "S3",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K185",
      "name": "순가온",
      "role": "의료열차 무기 목격자",
      "stage": "S3",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K186",
      "name": "홍재민",
      "role": "개막 급수열차 창 점유 증인",
      "stage": "S3",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K187",
      "name": "추한결",
      "role": "둘째 급수협약 환적 증인",
      "stage": "S3",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K188",
      "name": "어지율",
      "role": "약소국 회의 열차 안내인",
      "stage": "S3",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K189",
      "name": "란하율",
      "role": "후계시험 부품 고발 보조",
      "stage": "S3",
      "state_id": "S07",
      "state_name": "용산철도후국",
      "source_anchor": "Cast-Index.md#S07"
    },
    {
      "id": "K190",
      "name": "오해린",
      "role": "냉동상인 대표",
      "stage": "주요",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K191",
      "name": "조민재",
      "role": "냉동 상인",
      "stage": "S1",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K192",
      "name": "윤서하",
      "role": "경매사",
      "stage": "S1",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K193",
      "name": "신태산",
      "role": "호송 반장",
      "stage": "S1",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K194",
      "name": "서나연",
      "role": "얼음 상인",
      "stage": "S1",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K195",
      "name": "오도윤",
      "role": "운송선주 평의",
      "stage": "S1",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K196",
      "name": "지윤재",
      "role": "남관 제빙기 정비사",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K197",
      "name": "마솔",
      "role": "냉동창고 물류상",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K198",
      "name": "연가온",
      "role": "남관시장 의무원",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K199",
      "name": "나태경",
      "role": "시장 자경 순찰대 조장",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K200",
      "name": "양이든",
      "role": "경매 낙찰 전령",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K201",
      "name": "주나경",
      "role": "한강 취수 탐사원",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K202",
      "name": "차진아",
      "role": "결제권 원장 기록관",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K203",
      "name": "설초아",
      "role": "노량진역 대합실 역장",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K204",
      "name": "지마루",
      "role": "남관 냉동기지 감독",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K205",
      "name": "마하율",
      "role": "수산도매 시장 경매사",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K206",
      "name": "연은재",
      "role": "남부 의료접근 이동의무차 반장",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K207",
      "name": "나루희",
      "role": "남관 제빙 비상발전 운전장",
      "stage": "S2",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K208",
      "name": "섭다은",
      "role": "냉동고 사고 증인",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K209",
      "name": "평서아",
      "role": "가짜 약품 경매 피해자",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K210",
      "name": "단노을",
      "role": "탁수 재고 야간 이전 목격자",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K211",
      "name": "순재민",
      "role": "호송칸 봉인 상자 증인",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K212",
      "name": "홍지훈",
      "role": "급수 시세 폭등 상인",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K213",
      "name": "추보람",
      "role": "약소국 회의 식량 호송 선주",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K214",
      "name": "어도윤",
      "role": "첫 급수협약 시장 증인",
      "stage": "S3",
      "state_id": "S08",
      "state_name": "노량진남관상회",
      "source_anchor": "Cast-Index.md#S08"
    },
    {
      "id": "K215",
      "name": "문가람",
      "role": "방송검증관",
      "stage": "주요",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K216",
      "name": "권미래",
      "role": "송신 기사",
      "stage": "S1",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K217",
      "name": "황은설",
      "role": "검증 기록원",
      "stage": "S1",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K218",
      "name": "송재민",
      "role": "암호 기록원",
      "stage": "S1",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K219",
      "name": "오하늘",
      "role": "채널 길드 편성관",
      "stage": "S1",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K220",
      "name": "조은우",
      "role": "전파추적조 반장",
      "stage": "S1",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K221",
      "name": "두봉",
      "role": "송신 정비사, 권미래의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K222",
      "name": "모봉용",
      "role": "전선·전지 물류상",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K223",
      "name": "봉소",
      "role": "송신조 당직 의무원",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K224",
      "name": "용복",
      "role": "송신탑 순찰대, 조은우의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K225",
      "name": "소감",
      "role": "편성 전령, 오하늘의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K226",
      "name": "복두모",
      "role": "지도 갱신 탐사원",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K227",
      "name": "국두봉",
      "role": "검증 기록관, 황은설의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K228",
      "name": "감봉",
      "role": "상암 송신탑 당직장",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K229",
      "name": "두용",
      "role": "기록 저장소 열쇠지기, 송재민의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K230",
      "name": "모국",
      "role": "서북 관문 중계 거점장",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K231",
      "name": "봉용",
      "role": "채널 길드 편성실 거점 실무 담당자, 오하늘의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K232",
      "name": "용소",
      "role": "암호 중계 부스 실무 담당자, 송재민의 실무 담당자",
      "stage": "S2",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K233",
      "name": "란세온",
      "role": "가짜 송신 내부 제보자",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K234",
      "name": "섭달호",
      "role": "음성기록 회수 전령",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K235",
      "name": "평지우",
      "role": "실종 전 송신 기록 목격자",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K236",
      "name": "단보람",
      "role": "탁수 은폐 폭로 편성원",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K237",
      "name": "순한결",
      "role": "북산 행렬 속보 증인",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K238",
      "name": "홍우찬",
      "role": "재송신 원점 제보자",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K239",
      "name": "추우찬",
      "role": "열한 자리 회의 중계 기록원",
      "stage": "S3",
      "state_id": "S09",
      "state_name": "상암송신공사",
      "source_anchor": "Cast-Index.md#S09"
    },
    {
      "id": "K240",
      "name": "백온",
      "role": "난민대표",
      "stage": "주요",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K241",
      "name": "신보람",
      "role": "피난 가족 대표",
      "stage": "S1",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K242",
      "name": "황세린",
      "role": "배급 감시인",
      "stage": "S1",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K243",
      "name": "강태산",
      "role": "산악 정찰 반장",
      "stage": "S1",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K244",
      "name": "윤초아",
      "role": "구호 가족 서기",
      "stage": "S1",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K245",
      "name": "오한결",
      "role": "민병 배급 감시",
      "stage": "S1",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K246",
      "name": "두감",
      "role": "숙영 난로 정비사",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K247",
      "name": "모봉",
      "role": "산악 운송 물류상",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K248",
      "name": "봉감",
      "role": "약초 의무원",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K249",
      "name": "용국",
      "role": "회랑 순찰대, 강태산의 실무 담당자",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K250",
      "name": "소두",
      "role": "가족 회의 전령, 신보람의 실무 담당자",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K251",
      "name": "복모",
      "role": "피난로 탐사원",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K252",
      "name": "국봉",
      "role": "피난 명부 기록관, 윤초아의 실무 담당자",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K253",
      "name": "감용",
      "role": "피난 숙영 거점장",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K254",
      "name": "두소",
      "role": "회랑 통행 안내 거점장",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K255",
      "name": "모감",
      "role": "약초 건조장 거점장",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K256",
      "name": "봉두",
      "role": "방어 고지 거점장",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K257",
      "name": "용두",
      "role": "난방 연료고 거점장, 오한결의 실무 담당자",
      "stage": "S2",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K258",
      "name": "어하은",
      "role": "난민 명부 사고 당사자",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K259",
      "name": "란민준",
      "role": "군사호적 거부 가족",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K260",
      "name": "섭서연",
      "role": "가짜 약 배급 피해자",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K261",
      "name": "평은우",
      "role": "회랑 인원조사 증인",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K262",
      "name": "단유진",
      "role": "약소국 회의 난민 수행원",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K263",
      "name": "순지민",
      "role": "강제등록 행렬 이탈자",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K264",
      "name": "홍은서",
      "role": "공신 보상 구호 당사자",
      "stage": "S3",
      "state_id": "S10",
      "state_name": "북산피난연맹",
      "source_anchor": "Cast-Index.md#S10"
    },
    {
      "id": "K265",
      "name": "김도윤",
      "role": "차량기지 원로",
      "stage": "주요",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K266",
      "name": "송하율",
      "role": "차량 정비 도제",
      "stage": "S1",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K267",
      "name": "조우찬",
      "role": "작업 반장",
      "stage": "S1",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K268",
      "name": "서진아",
      "role": "주거공동체 감사",
      "stage": "S1",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K269",
      "name": "권도하",
      "role": "궤도기병 반장",
      "stage": "S1",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K270",
      "name": "황노을",
      "role": "철재 회수 작업반장",
      "stage": "S1",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K271",
      "name": "두모",
      "role": "차륜 정비사, 송하율의 실무 담당자",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K272",
      "name": "모소",
      "role": "차륜·철재 물류상",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K273",
      "name": "봉복",
      "role": "기지 의무원",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K274",
      "name": "용모",
      "role": "북문 순찰대, 권도하의 실무 담당자",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K275",
      "name": "소봉",
      "role": "연공회의 전령, 조우찬의 실무 담당자",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K276",
      "name": "복두",
      "role": "북부 선로 탐사원",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K277",
      "name": "국두",
      "role": "작업 사고 기록관, 조우찬의 실무 담당자",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K278",
      "name": "감두",
      "role": "창동 차량기지 당직장",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K279",
      "name": "두국",
      "role": "북문 호송 거점장",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K280",
      "name": "모복",
      "role": "주거 쉘 급수 거점장, 서진아의 실무 담당자",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K281",
      "name": "봉국",
      "role": "철재 회수장 거점장, 황노을의 실무 담당자",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K282",
      "name": "용두봉",
      "role": "궤도기병 정비창 거점장",
      "stage": "S2",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K283",
      "name": "추지훈",
      "role": "차륜 정비 불량 폭로자",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K284",
      "name": "어예린",
      "role": "시험 차륜 결함 증인",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K285",
      "name": "란진아",
      "role": "의료열차 북문 정비원",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K286",
      "name": "섭채원",
      "role": "북산 행렬 북문 안내인",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K287",
      "name": "평채원",
      "role": "급수 압력 저하 주거 당사자",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K288",
      "name": "단건우",
      "role": "약소국 회의 북부 사절 기술자",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K289",
      "name": "순하준",
      "role": "둘째 급수협약 차륜 교환 증인",
      "stage": "S3",
      "state_id": "S11",
      "state_name": "창동차륜방",
      "source_anchor": "Cast-Index.md#S11"
    },
    {
      "id": "K290",
      "name": "장세화",
      "role": "배차의무관",
      "stage": "주요",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K291",
      "name": "안도한",
      "role": "환승 배차조장",
      "stage": "S1",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K292",
      "name": "전미리",
      "role": "의료 조원",
      "stage": "S1",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K293",
      "name": "문시온",
      "role": "통행 심사관",
      "stage": "S1",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K294",
      "name": "하세온",
      "role": "경량 호송대장",
      "stage": "S1",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K295",
      "name": "곽태산",
      "role": "의료열차 수비대장",
      "stage": "S1",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K296",
      "name": "소두감",
      "role": "유치선 정비사, 안도한의 실무 담당자",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K297",
      "name": "복봉",
      "role": "환승 중계 물류상",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K298",
      "name": "국용",
      "role": "환승 당직 의무원, 전미리의 실무 담당자",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K299",
      "name": "감국",
      "role": "동북 외곽로 순찰대, 하세온의 실무 담당자",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K300",
      "name": "두복",
      "role": "계절 교대 전령, 전미리의 실무 담당자",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K301",
      "name": "복감",
      "role": "동북 외곽로 탐사원",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K302",
      "name": "봉모",
      "role": "통행 심사 기록관, 문시온의 실무 담당자",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K303",
      "name": "용봉",
      "role": "망우 환승 승강장 거점장",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K304",
      "name": "국소",
      "role": "신내 차량기지 당직장",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K305",
      "name": "복용",
      "role": "북동부 중립시장 거점장",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K306",
      "name": "국감",
      "role": "의료열차 수비창 거점장, 곽태산의 실무 담당자",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K307",
      "name": "감모",
      "role": "의료조 당직실 거점장",
      "stage": "S2",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K308",
      "name": "탁미르",
      "role": "환승 통행 사고 당사자",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K309",
      "name": "범온결",
      "role": "북동 외곽 관문 통행 증인",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K310",
      "name": "창다흰",
      "role": "약재 오염 이송 피해자 대표",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K311",
      "name": "초나루",
      "role": "공동호송조약 서명 서기",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K312",
      "name": "석봄우",
      "role": "패권전 개막 징발 인파 대표",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K313",
      "name": "근솔이",
      "role": "중립시장 경매 유찰 관계자",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K314",
      "name": "흥지완",
      "role": "환승 피난 인파 대표",
      "stage": "S3",
      "state_id": "S12",
      "state_name": "신내망우환승시",
      "source_anchor": "Cast-Index.md#S12"
    },
    {
      "id": "K315",
      "name": "류은비",
      "role": "치료길드 대표",
      "stage": "주요",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K316",
      "name": "심달호",
      "role": "약재상",
      "stage": "S1",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K317",
      "name": "은채윤",
      "role": "치료사",
      "stage": "S1",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K318",
      "name": "라세영",
      "role": "방역 관리",
      "stage": "S1",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K319",
      "name": "남호성",
      "role": "의무호송대장",
      "stage": "S1",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K320",
      "name": "전솔",
      "role": "의정회 환자대표",
      "stage": "S1",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K321",
      "name": "천다움",
      "role": "약재 건조기 정비사, 심달호의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K322",
      "name": "동늘솔",
      "role": "약재 운송 물류상",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K323",
      "name": "방한울",
      "role": "중증도 진료 의무원, 은채윤의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K324",
      "name": "수초롱",
      "role": "약령 동측 방역 순찰대, 라세영의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K325",
      "name": "선나휘",
      "role": "의정회 표결 전령, 전솔의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K326",
      "name": "원미루",
      "role": "원산지·위조약 탐사원",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K327",
      "name": "영늘빛",
      "role": "의정회 병상 기록관, 전솔의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K328",
      "name": "판한들",
      "role": "청량리역 대합실 거점장",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K329",
      "name": "천다올",
      "role": "의무호송 기지 당직장, 남호성의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K330",
      "name": "동주하",
      "role": "약령시장 저울 거점장",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K331",
      "name": "방미산",
      "role": "청량리 진료소 거점장, 은채윤의 실무 담당자",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K332",
      "name": "수효은",
      "role": "약재 건조·냉장 비상발전 운전장",
      "stage": "S2",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K333",
      "name": "매하루",
      "role": "약재 오염 피해자 대표",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K334",
      "name": "탁은솔",
      "role": "가짜 약 유통 증인",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K335",
      "name": "범초이",
      "role": "의무호송 사고 당사자",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K336",
      "name": "창해온",
      "role": "의료헌장 협약 서명 서기",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K337",
      "name": "석라온",
      "role": "남하 피난 환자 대표",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K338",
      "name": "근우람",
      "role": "군사호적 치료 거부 증인",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K339",
      "name": "흥다온",
      "role": "패권전 개막 징발 인파 대표",
      "stage": "S3",
      "state_id": "S13",
      "state_name": "약령의정동맹",
      "source_anchor": "Cast-Index.md#S13"
    },
    {
      "id": "K340",
      "name": "고서준",
      "role": "능선수비대장",
      "stage": "주요",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K341",
      "name": "문하율",
      "role": "능선 초병",
      "stage": "S1",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K342",
      "name": "안기준",
      "role": "교량 감독",
      "stage": "S1",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K343",
      "name": "하윤목",
      "role": "관문 세리",
      "stage": "S1",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K344",
      "name": "곽민재",
      "role": "구의 제한급수 기술자",
      "stage": "S1",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K345",
      "name": "심가은",
      "role": "교량 척후대장",
      "stage": "S1",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K346",
      "name": "선솔우",
      "role": "구의 펌프실 정비사, 곽민재의 실무 담당자",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K347",
      "name": "원예나",
      "role": "교량 통과 물류상",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K348",
      "name": "영석온",
      "role": "능선·교량 당직 의무원",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K349",
      "name": "판늘샘",
      "role": "아차산 능선 순찰대, 문하율의 실무 담당자",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K350",
      "name": "천초윤",
      "role": "관문 공동승인 전령, 하윤목의 실무 담당자",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K351",
      "name": "동새봄",
      "role": "교량 하부 탐사원, 심가은의 실무 담당자",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K352",
      "name": "방마름",
      "role": "관문 통과 기록관, 하윤목의 실무 담당자",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K353",
      "name": "수지완",
      "role": "구의역 대합실 거점장",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K354",
      "name": "선늘봄",
      "role": "능선 초소 기지 당직장, 문하율의 실무 담당자",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K355",
      "name": "원다결",
      "role": "관문 통과 시장 거점장",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K356",
      "name": "영한뫼",
      "role": "교량 의무소 거점장",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K357",
      "name": "판초담",
      "role": "구의 펌프실 비상발전 운전장",
      "stage": "S2",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K358",
      "name": "매서담",
      "role": "관문 통행 증인",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K359",
      "name": "탁윤재",
      "role": "교량 통행 사고 당사자",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K360",
      "name": "범한들",
      "role": "급수계약 만료 증인",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K361",
      "name": "창지안",
      "role": "보호권 징발 피난 인파 대표",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K362",
      "name": "초태온",
      "role": "약소국 회의 관문 증인",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K363",
      "name": "석주아",
      "role": "열여섯 깃발 관문 인준 관계자",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K364",
      "name": "근바름",
      "role": "공동호송 서명 보조",
      "stage": "S3",
      "state_id": "S14",
      "state_name": "아차구의관문국",
      "source_anchor": "Cast-Index.md#S14"
    },
    {
      "id": "K365",
      "name": "남윤경",
      "role": "경매조정인",
      "stage": "주요",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K366",
      "name": "은태호",
      "role": "경매사",
      "stage": "S1",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K367",
      "name": "라진우",
      "role": "창고지기",
      "stage": "S1",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K368",
      "name": "전나경",
      "role": "비상배급원",
      "stage": "S1",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K369",
      "name": "남시윤",
      "role": "청과 상인회의 대표",
      "stage": "S1",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K370",
      "name": "문도윤",
      "role": "호송 입찰 조정",
      "stage": "S1",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K371",
      "name": "천나솔",
      "role": "경매대 저울 정비사, 은태호의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K372",
      "name": "동미온",
      "role": "가락 도매 물류상",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K373",
      "name": "방늘재",
      "role": "잠실 집결 의무소 거점 의무원",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K374",
      "name": "수한별",
      "role": "창고 경비 순찰대, 라진우의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K375",
      "name": "선다솜",
      "role": "호송 낙찰 전령, 문도윤의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K376",
      "name": "원주온",
      "role": "동남 우회 저장고 탐사원",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K377",
      "name": "영미결",
      "role": "경매·배급 원장 기록관, 은태호의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K378",
      "name": "판효담",
      "role": "가락 대형 창고 기지 당직장, 라진우의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K379",
      "name": "천솔빛",
      "role": "잠실역 대합실 거점장, 전나경의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K380",
      "name": "동예솔",
      "role": "청과동 시장 거점장, 남시윤의 실무 담당자",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K381",
      "name": "방석담",
      "role": "동남 호송 기지 비상발전 운전장",
      "stage": "S2",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K382",
      "name": "흥예나",
      "role": "경매 유찰 사건 관계자",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K383",
      "name": "매리울",
      "role": "냉동재고 유찰 관계자",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K384",
      "name": "탁필호",
      "role": "남하 피난 배급 인파 대표",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K385",
      "name": "범채온",
      "role": "군량 징발 인파 대표",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K386",
      "name": "창고운",
      "role": "식량 공동구매 협약 서명 서기",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K387",
      "name": "초시람",
      "role": "공신 보상 경매 당사자",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K388",
      "name": "석오름",
      "role": "호송 입찰 유찰 증인",
      "stage": "S3",
      "state_id": "S15",
      "state_name": "가락잠실배급국",
      "source_anchor": "Cast-Index.md#S15"
    },
    {
      "id": "K389",
      "name": "정유라",
      "role": "계약감사관",
      "stage": "주요",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K390",
      "name": "하서진",
      "role": "계약 서기",
      "stage": "S1",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K391",
      "name": "곽은재",
      "role": "감사 보조",
      "stage": "S1",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K392",
      "name": "심유리",
      "role": "협약 중재인",
      "stage": "S1",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K393",
      "name": "은보람",
      "role": "기술기업 추천위원 서기",
      "stage": "S1",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K394",
      "name": "안태경",
      "role": "시민추첨회의 서기",
      "stage": "S1",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K395",
      "name": "수늘결",
      "role": "수서 기지 정비사, 은보람의 실무 담당자",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K396",
      "name": "선초별",
      "role": "강남 계약서 시장 물류상, 하서진의 실무 담당자",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K397",
      "name": "원새울",
      "role": "협약 회의 의무소 거점 의무원",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K398",
      "name": "영마온",
      "role": "남부 외곽 순찰대",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K399",
      "name": "판지솔",
      "role": "이중 의회 전령, 안태경의 실무 담당자",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K400",
      "name": "천늘우",
      "role": "수서 외곽 탐사원",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K401",
      "name": "동새결",
      "role": "손실보상 감사 기록관, 곽은재의 실무 담당자",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K402",
      "name": "방마빛",
      "role": "수서역 대합실 거점장",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K403",
      "name": "선한솜",
      "role": "지하시설 방어조 거점장",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K404",
      "name": "원초온",
      "role": "수서 차량기지 당직장",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K405",
      "name": "천늘샘",
      "role": "서고·의회 비상발전 운전장",
      "stage": "S2",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K406",
      "name": "근주하",
      "role": "약소국 공동교섭 서명 서기",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K407",
      "name": "흥미리",
      "role": "급수계약 감사 보조",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K408",
      "name": "매도한",
      "role": "다섯 통일안 초안 관계자",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K409",
      "name": "탁세온",
      "role": "둘째 급수협약 서명 증인",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K410",
      "name": "범하겸",
      "role": "열여섯 깃발 인준 감사 보조",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K411",
      "name": "창은찬",
      "role": "패권전 개막 징발 피난 인파 대표",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    },
    {
      "id": "K412",
      "name": "초진솔",
      "role": "검은 배차 열차 조사 증인",
      "stage": "S3",
      "state_id": "S16",
      "state_name": "수서강남협약도시",
      "source_anchor": "Cast-Index.md#S16"
    }
  ],
  "houses": [
    {
      "id": "HC01",
      "display_name": "청람전자원",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S01",
        "S09"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "청람전자원은 야간 냉각 분배를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "야간 냉각 분배",
          "여의도 제2정수 옆 봉인 전산동"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "허은찬"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "허은찬",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC01-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC01-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "허은찬",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S01",
          "kind": "continuity",
          "summary": "야간 냉각 분배의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "여의도 제2정수 옆 봉인 전산동에서 야간 냉각 분배가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "허은찬이 상암 송신키 공유 요구와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "화면이 꺼져도 급수 원장은 남긴다"
        }
      ],
      "prose": "여의도 제2정수 옆 봉인 전산동에서 청람전자원이 야간 냉각 분배를 지킨다. 허은찬은 냉각탑 시계를 급수 당직과 맞춰 돌린다. 상암 송신키 공유 요구 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 화면이 꺼져도 급수 원장은 남긴다."
    },
    {
      "id": "HC02",
      "display_name": "해륜기동문",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S01",
        "S16",
        "S07"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "해륜기동문은 배터리 셀 순환을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "배터리 셀 순환",
          "신정기지 유치선과 수서 회차선"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "유세진"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "유세진",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC02-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC02-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "유세진",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S01",
          "kind": "continuity",
          "summary": "배터리 셀 순환의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "신정기지 유치선과 수서 회차선에서 배터리 셀 순환이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "유세진이 용산 환적 창구 독점 시도와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "선로가 잠겨도 사람 호송은 걷게 연다"
        }
      ],
      "prose": "신정기지 유치선과 수서 회차선에서 해륜기동문이 배터리 셀 순환을 지킨다. 유세진은 회차 슬롯을 화물보다 구급차에 먼저 연다. 용산 환적 창구 독점 시도 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 선로가 잠겨도 사람 호송은 걷게 연다."
    },
    {
      "id": "HC03",
      "display_name": "백광생활과학가",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S03",
        "S13"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "백광생활과학가는 생체 데이터셋 격리 키를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "생체 데이터셋 격리 키",
          "마곡 밀폐실험동 방풍실"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "서이안"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "서이안",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC03-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC03-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "서이안",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S03",
          "kind": "continuity",
          "summary": "생체 데이터셋 격리 키의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "마곡 밀폐실험동 방풍실에서 생체 데이터셋 격리 키가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "서이안이 약령의 원료 선점와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "표본이 사라져도 동의 기록은 태우지 않는다"
        }
      ],
      "prose": "마곡 밀폐실험동 방풍실에서 백광생활과학가가 생체 데이터셋 격리 키를 지킨다. 서이안은 실험 일지를 병상 이름과 분리해 보관한다. 약령의 원료 선점 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 표본이 사라져도 동의 기록은 태우지 않는다."
    },
    {
      "id": "HC04",
      "display_name": "통맥에너지연합",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S04",
        "S05",
        "S01"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "통맥에너지연합은 지하 열원 접속권을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "지하 열원 접속권",
          "뚝도 펌프와 암사 여열 배관"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "박누리"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "박누리",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC04-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC04-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "박누리",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S04",
          "kind": "continuity",
          "summary": "지하 열원 접속권의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "뚝도 펌프와 암사 여열 배관에서 지하 열원 접속권이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "박누리가 여의 급수 야간 우선권와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "정전 순서를 숨기지 않고 게시판에 붙인다"
        }
      ],
      "prose": "뚝도 펌프와 암사 여열 배관에서 통맥에너지연합이 지하 열원 접속권을 지킨다. 박누리는 여열을 팔기 전에 펌프 예비 전력을 채운다. 여의 급수 야간 우선권 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 정전 순서를 숨기지 않고 게시판에 붙인다."
    },
    {
      "id": "HC05",
      "display_name": "북문지식원",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S10",
        "S06"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "북문지식원은 옛 기록 원본 한 상자를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "옛 기록 원본 한 상자",
          "북한산 회랑 창고의 습도 금고"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "윤서린"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "윤서린",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC05-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC05-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "윤서린",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S10",
          "kind": "continuity",
          "summary": "옛 기록 원본 한 상자의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "북한산 회랑 창고의 습도 금고에서 옛 기록 원본 한 상자가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "윤서린이 도성 인준 인지 요구와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "공개 범위를 접어도 목록 자체는 남긴다"
        }
      ],
      "prose": "북한산 회랑 창고의 습도 금고에서 북문지식원이 옛 기록 원본 한 상자를 지킨다. 윤서린은 습도 알람이 울리면 열람을 멈추고 상자만 옮긴다. 도성 인준 인지 요구 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 공개 범위를 접어도 목록 자체는 남긴다."
    },
    {
      "id": "HC06",
      "display_name": "골목연결국",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S08",
        "S15"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "골목연결국은 근거리 수레 배차권을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "근거리 수레 배차권",
          "노량진 하층 골목과 가락 후문"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "오해린"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "오해린",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC06-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC06-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "오해린",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S08",
          "kind": "continuity",
          "summary": "근거리 수레 배차권의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "노량진 하층 골목과 가락 후문에서 근거리 수레 배차권이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "오해린이 장거리 배송단의 진입와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "점포가 비어도 주문 장부는 섞지 않는다"
        }
      ],
      "prose": "노량진 하층 골목과 가락 후문에서 골목연결국이 근거리 수레 배차권을 지킨다. 오해린은 골목 순번을 경매 호가와 바꿔 쓰지 않는다. 장거리 배송단의 진입 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 점포가 비어도 주문 장부는 섞지 않는다."
    },
    {
      "id": "HC07",
      "display_name": "해동제철성",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S02",
        "S04"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "해동제철성은 내열 합금 레시피를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "내열 합금 레시피",
          "구로 고온로와 성수 합금 정"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "강민서"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "강민서",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC07-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC07-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "강민서",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S02",
          "kind": "continuity",
          "summary": "내열 합금 레시피의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "구로 고온로와 성수 합금 정에서 내열 합금 레시피가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "강민서가 궤도 방위문의 군수용 전용 요구와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "불량이 나와도 규격 도장은 위조하지 않는다"
        }
      ],
      "prose": "구로 고온로와 성수 합금 정에서 해동제철성이 내열 합금 레시피를 지킨다. 강민서는 로 온도가 흔들리면 주문을 받아도 불을 끈다. 궤도 방위문의 군수용 전용 요구 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 불량이 나와도 규격 도장은 위조하지 않는다."
    },
    {
      "id": "HC08",
      "display_name": "성화궤도방위문",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S11",
        "S12",
        "S05"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "성화궤도방위문은 통합 방호키를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "통합 방호키",
          "창동 북문과 신내 환승 차단문"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "김도윤"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "김도윤",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC08-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC08-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "김도윤",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S11",
          "kind": "continuity",
          "summary": "통합 방호키의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "창동 북문과 신내 환승 차단문에서 통합 방호키가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "김도윤이 암사 호위단의 원격 잠금와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "시민 통행을 닫기 전에 대피 방송을 먼저 연다"
        }
      ],
      "prose": "창동 북문과 신내 환승 차단문에서 성화궤도방위문이 통합 방호키를 지킨다. 김도윤은 차단문 원격키를 호위단에 넘기지 않는다. 암사 호위단의 원격 잠금 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 시민 통행을 닫기 전에 대피 방송을 먼저 연다."
    },
    {
      "id": "HC09",
      "display_name": "도성생활유통가",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S06",
        "S15",
        "S08"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "도성생활유통가는 생활재 재고 원장을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "생활재 재고 원장",
          "서울역 서편 창고와 잠실 하층"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "남윤경"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "남윤경",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC09-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC09-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "남윤경",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S06",
          "kind": "continuity",
          "summary": "생활재 재고 원장의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "서울역 서편 창고와 잠실 하층에서 생활재 재고 원장이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "남윤경이 가락 경매 우선권와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "재고가 줄어도 배급 순번을 팔지 않는다"
        }
      ],
      "prose": "서울역 서편 창고와 잠실 하층에서 도성생활유통가가 생활재 재고 원장을 지킨다. 남윤경은 창고 열쇠와 가격표를 한 사람이 쥐지 않는다. 가락 경매 우선권 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 재고가 줄어도 배급 순번을 팔지 않는다."
    },
    {
      "id": "HC10",
      "display_name": "서부식문화동맹",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S03",
        "S09",
        "S08"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "서부식문화동맹은 발효 종자 금고를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "발효 종자 금고",
          "마곡 종자 창고와 상암 부엌 방송"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "문가람"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "문가람",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC10-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC10-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "문가람",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S03",
          "kind": "continuity",
          "summary": "발효 종자 금고의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "마곡 종자 창고와 상암 부엌 방송에서 발효 종자 금고가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "문가람이 노량진 냉동 임차 인상와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "맛의 표준을 강요하지 않고 위생 수치만 공개한다"
        }
      ],
      "prose": "마곡 종자 창고와 상암 부엌 방송에서 서부식문화동맹이 발효 종자 금고를 지킨다. 문가람은 방송 레시피에 재고 위치를 섞어 쓰지 않는다. 노량진 냉동 임차 인상 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 맛의 표준을 강요하지 않고 위생 수치만 공개한다."
    },
    {
      "id": "HC11",
      "display_name": "백야배송단",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S07",
        "S12",
        "S16"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "백야배송단은 야간 호송 허가증을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "야간 호송 허가증",
          "용산 화물홈과 수서 심야 슬롯"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "박태겸"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "박태겸",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC11-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC11-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "박태겸",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S07",
          "kind": "continuity",
          "summary": "야간 호송 허가증의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "용산 화물홈과 수서 심야 슬롯에서 야간 호송 허가증이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "박태겸이 신내 의료열차와 충돌와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "빈 상자를 채워 무게를 속이지 않는다"
        }
      ],
      "prose": "용산 화물홈과 수서 심야 슬롯에서 백야배송단이 야간 호송 허가증을 지킨다. 박태겸은 심야 슬롯을 의료열차에 양보한 뒤 화물을 민다. 신내 의료열차와 충돌 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 빈 상자를 채워 무게를 속이지 않는다."
    },
    {
      "id": "HC12",
      "display_name": "거도중공회",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S02",
        "S14",
        "S04"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "거도중공회는 대형 리깅 자격을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "대형 리깅 자격",
          "금천 크레인과 아차 교각 하부"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "정시우"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "정시우",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC12-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC12-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "정시우",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S02",
          "kind": "continuity",
          "summary": "대형 리깅 자격의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "금천 크레인과 아차 교각 하부에서 대형 리깅 자격이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "정시우가 뚝도 펌프 하우징 쟁탈와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "하중 한도를 넘긴 작업은 기록 전에 멈춘다"
        }
      ],
      "prose": "금천 크레인과 아차 교각 하부에서 거도중공회가 대형 리깅 자격을 지킨다. 정시우는 교각 아래에 크레인을 세우기 전 풍속을 적는다. 뚝도 펌프 하우징 쟁탈 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 하중 한도를 넘긴 작업은 기록 전에 멈춘다."
    },
    {
      "id": "HC13",
      "display_name": "도성건축연맹",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S06",
        "S16",
        "S14"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "도성건축연맹은 내진 접합 도면을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "내진 접합 도면",
          "도성 잔벽과 수서 지하 공동구"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "정유라"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "정유라",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC13-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC13-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "정유라",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S06",
          "kind": "continuity",
          "summary": "내진 접합 도면의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "도성 잔벽과 수서 지하 공동구에서 내진 접합 도면이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "정유라가 아차 고지 감시탑 증축와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "도면이 틀려도 현장을 숫자로 맞춘다"
        }
      ],
      "prose": "도성 잔벽과 수서 지하 공동구에서 도성건축연맹이 내진 접합 도면을 지킨다. 정유라는 공동구 도면을 감시탑 증축과 맞바꿔 팔지 않는다. 아차 고지 감시탑 증축 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 도면이 틀려도 현장을 숫자로 맞춘다."
    },
    {
      "id": "HC14",
      "display_name": "여의장부원",
      "house_class": "CORPORATION",
      "house_kind": "corporate-successor",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S01",
        "S16",
        "S06"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "여의장부원은 이중서명 장부를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "이중서명 장부",
          "여의도 계약고와 수서 중재실"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "장필규"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "장필규",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HC14-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HC14-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "장필규",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S01",
          "kind": "continuity",
          "summary": "이중서명 장부의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "여의도 계약고와 수서 중재실에서 이중서명 장부가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "장필규가 기록청의 인준 지연와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "손실을 숨기지 않고 보상 순서를 공개한다"
        }
      ],
      "prose": "여의도 계약고와 수서 중재실에서 여의장부원이 이중서명 장부를 지킨다. 장필규는 한 서명이 비면 급수 계약을 집행하지 않는다. 기록청의 인준 지연 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 손실을 숨기지 않고 보상 순서를 공개한다."
    },
    {
      "id": "HP01",
      "display_name": "아리수수문가",
      "house_class": "INFRA_OPERATOR",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S01",
        "S04",
        "S05",
        "S14"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "아리수수문가는 수문 키 분할 보관을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "수문 키 분할 보관",
          "영등포·뚝도·암사·구의 수문 당직함"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "한재목"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "한재목",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP01-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP01-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "한재목",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S01",
          "kind": "continuity",
          "summary": "수문 키 분할 보관의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "영등포·뚝도·암사·구의 수문 당직함에서 수문 키 분할 보관이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "한재목이 한 권역의 전면 차수와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "물을 무기로 쓰는 명령을 거부한다"
        }
      ],
      "prose": "영등포·뚝도·암사·구의 수문 당직함에서 아리수수문가가 수문 키 분할 보관을 지킨다. 한재목은 네 곳 키를 한 주머니에 모으지 않는다. 한 권역의 전면 차수 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 물을 무기로 쓰는 명령을 거부한다."
    },
    {
      "id": "HP02",
      "display_name": "환승선로문",
      "house_class": "INFRA_OPERATOR",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S07",
        "S12",
        "S11"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "환승선로문은 중립 배차표를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "중립 배차표",
          "용산·신내·창동 배차 회의실"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "장세화"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "장세화",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP02-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP02-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "장세화",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S07",
          "kind": "continuity",
          "summary": "중립 배차표의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "용산·신내·창동 배차 회의실에서 중립 배차표가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "장세화가 강국의 전세 열차와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "응급 이송을 화물보다 뒤에 두지 않는다"
        }
      ],
      "prose": "용산·신내·창동 배차 회의실에서 환승선로문이 중립 배차표를 지킨다. 장세화는 전세 열차가 와도 응급 칸을 지우지 않는다. 강국의 전세 열차 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 응급 이송을 화물보다 뒤에 두지 않는다."
    },
    {
      "id": "HP03",
      "display_name": "공동의료원가",
      "house_class": "PROFESSIONAL_GUILD",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S13",
        "S06",
        "S03"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "공동의료원가는 면허 당직표를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "면허 당직표",
          "청량리 이송로와 도성 재난의료 데스크"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "류은비"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "류은비",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP03-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP03-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "류은비",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S13",
          "kind": "continuity",
          "summary": "면허 당직표의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "청량리 이송로와 도성 재난의료 데스크에서 면허 당직표가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "류은비가 마곡의 실험 병상 전용와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "병상을 편으로 가르지 않는다"
        }
      ],
      "prose": "청량리 이송로와 도성 재난의료 데스크에서 공동의료원가가 면허 당직표를 지킨다. 류은비는 실험 병상 요구가 와도 응급 순번을 팔지 않는다. 마곡의 실험 병상 전용 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 병상을 편으로 가르지 않는다."
    },
    {
      "id": "HP04",
      "display_name": "도성기록법가",
      "house_class": "PROFESSIONAL_GUILD",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S06",
        "S09"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "도성기록법가는 원본 해시 봉인을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "원본 해시 봉인",
          "기록고 열람실과 송신 교차검증대"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "여리안"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "여리안",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP04-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP04-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "여리안",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S06",
          "kind": "continuity",
          "summary": "원본 해시 봉인의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "기록고 열람실과 송신 교차검증대에서 원본 해시 봉인이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "여리안이 방송국의 단독 공개와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "유언 사본 세 장을 한 진본으로 합치지 않는다"
        }
      ],
      "prose": "기록고 열람실과 송신 교차검증대에서 도성기록법가가 원본 해시 봉인을 지킨다. 여리안은 해시가 다른 문서를 먼저 방송하지 않는다. 방송국의 단독 공개 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 유언 사본 세 장을 한 진본으로 합치지 않는다."
    },
    {
      "id": "HP05",
      "display_name": "북산귀환회",
      "house_class": "CIVIC_COMPACT",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S10",
        "S11",
        "S12"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "북산귀환회는 가족 재결합 명부를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "가족 재결합 명부",
          "은평 피난로와 창동 주거쉘 대기줄"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "백온"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "백온",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP05-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP05-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "백온",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S10",
          "kind": "continuity",
          "summary": "가족 재결합 명부의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "은평 피난로와 창동 주거쉘 대기줄에서 가족 재결합 명부가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "백온이 군사호적 재등록와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "명부를 인질로 쓰지 않고 본인 동의로만 연다"
        }
      ],
      "prose": "은평 피난로와 창동 주거쉘 대기줄에서 북산귀환회가 가족 재결합 명부를 지킨다. 백온은 대기줄 이름을 복무 명부와 맞바꾸지 않는다. 군사호적 재등록 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 명부를 인질로 쓰지 않고 본인 동의로만 연다."
    },
    {
      "id": "HP06",
      "display_name": "약령치유문",
      "house_class": "PROFESSIONAL_GUILD",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S13",
        "S03",
        "S10"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "약령치유문은 처방 이중확인을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "처방 이중확인",
          "약령 조제실과 마곡 방역 시료실"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "정하린"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "정하린",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP06-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP06-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "정하린",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S13",
          "kind": "continuity",
          "summary": "처방 이중확인의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "약령 조제실과 마곡 방역 시료실에서 처방 이중확인이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "정하린이 북산 약초 독점 구매와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "가짜 약을 숨기지 않고 로트 번호를 게시한다"
        }
      ],
      "prose": "약령 조제실과 마곡 방역 시료실에서 약령치유문이 처방 이중확인을 지킨다. 정하린은 독점 구매서보다 로트 불량을 먼저 붙인다. 북산 약초 독점 구매 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 가짜 약을 숨기지 않고 로트 번호를 게시한다."
    },
    {
      "id": "HP07",
      "display_name": "한강교량공회",
      "house_class": "INFRA_OPERATOR",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S01",
        "S07",
        "S14",
        "S04"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "한강교량공회는 풍속 폐쇄 기준을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "풍속 폐쇄 기준",
          "한강 교각 점검로와 잠수교 잔교"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "고서준"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "고서준",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP07-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP07-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "고서준",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S01",
          "kind": "continuity",
          "summary": "풍속 폐쇄 기준의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "한강 교각 점검로와 잠수교 잔교에서 풍속 폐쇄 기준이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "고서준이 여의 수운 우선와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "교량을 통행세로만 계산하지 않는다"
        }
      ],
      "prose": "한강 교각 점검로와 잠수교 잔교에서 한강교량공회가 풍속 폐쇄 기준을 지킨다. 고서준은 풍속이 기준을 넘으면 수운 우선도 세운다. 여의 수운 우선 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 교량을 통행세로만 계산하지 않는다."
    },
    {
      "id": "HP08",
      "display_name": "시장냉동상단",
      "house_class": "CIVIC_COMPACT",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S08",
        "S15",
        "S02"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "시장냉동상단은 전력 슬롯 순환을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "전력 슬롯 순환",
          "노량진 냉동고와 가락 얼음 창고"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "구하온"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "구하온",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP08-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP08-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "구하온",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S08",
          "kind": "continuity",
          "summary": "전력 슬롯 순환의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "노량진 냉동고와 가락 얼음 창고에서 전력 슬롯 순환이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "구하온이 제작 동맹의 모터 회수와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "온도 로그가 끊기면 경매를 멈춘다"
        }
      ],
      "prose": "노량진 냉동고와 가락 얼음 창고에서 시장냉동상단이 전력 슬롯 순환을 지킨다. 구하온은 모터를 빼 가기 전에 온도 로그를 인쇄한다. 제작 동맹의 모터 회수 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 온도 로그가 끊기면 경매를 멈춘다."
    },
    {
      "id": "HP09",
      "display_name": "데이터신탁가",
      "house_class": "DATA_TRUST",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S09",
        "S16",
        "S03"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "데이터신탁가는 모델 카드 공개를 공공 연속성으로 유지한다",
        "mandate_domains": [
          "모델 카드 공개",
          "상암 로그 신탁과 수서 계약 해시"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "최은재"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "최은재",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP09-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP09-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "최은재",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S09",
          "kind": "continuity",
          "summary": "모델 카드 공개의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "상암 로그 신탁과 수서 계약 해시에서 모델 카드 공개가 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "최은재가 마곡의 학습자료 반출와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "얼굴 원본을 통행권과 바꾸지 않는다"
        }
      ],
      "prose": "상암 로그 신탁과 수서 계약 해시에서 데이터신탁가가 모델 카드 공개를 지킨다. 최은재는 학습자료 반출 요청에 원본 대신 집계만 넘긴다. 마곡의 학습자료 반출 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 얼굴 원본을 통행권과 바꾸지 않는다."
    },
    {
      "id": "HP10",
      "display_name": "외교통역문",
      "house_class": "PROFESSIONAL_GUILD",
      "house_kind": "civic-professional",
      "status": "ACTIVE",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "Operating-Houses.md"
      ],
      "states": [
        "S06",
        "S16",
        "S09"
      ],
      "exclusive_state_ids": [],
      "charter": {
        "public_mission": "외교통역문은 언어 쌍 당직을 공공 연속성으로 유지한다",
        "mandate_domains": [
          "언어 쌍 당직",
          "도성 통역석과 수서 세관 창구"
        ],
        "forbidden_powers": [
          "hereditary_citizenship",
          "forced_labor",
          "bodily_hostage",
          "private_criminal_court",
          "collective_punishment"
        ]
      },
      "membership": {
        "classes": [
          "APPRENTICE",
          "LICENSED_MEMBER",
          "CORE_MEMBER",
          "OFFICER",
          "STEWARD"
        ],
        "entry_routes": [
          "OPEN_EXAM",
          "APPRENTICESHIP",
          "LATERAL_ADMISSION",
          "CHARTER_ADOPTION"
        ],
        "dual_membership_policy": "DISCLOSURE_REQUIRED",
        "steward": "표시완"
      },
      "succession": {
        "state": "NORMAL",
        "designated": "표시완",
        "caretaker_triad": [
          "운영대표",
          "감사",
          "시민참관"
        ],
        "trigger_events": [
          "사망",
          "소환",
          "면허정지",
          "은폐된 사고"
        ]
      },
      "regency": {
        "active": false,
        "triad": [
          "운영대표",
          "감사",
          "시민참관"
        ]
      },
      "protected_guests": [
        {
          "id": "HP10-PG01",
          "kind": "exchange_fellow",
          "terms": "성과보증과 다중서명. 신체 억류 금지"
        }
      ],
      "ai_stewardship": {
        "system_ids": [
          "HP10-AI"
        ],
        "authorized_functions": [
          "계측",
          "스케줄",
          "경보"
        ],
        "prohibited_functions": [
          "lethal_force",
          "unilateral_shutdown_of_life_support"
        ],
        "accountable_human": "표시완",
        "human_veto_required": true,
        "dual_key_shutdown": true
      },
      "obligations": [
        {
          "to": "S06",
          "kind": "continuity",
          "summary": "언어 쌍 당직의 최저 가동"
        },
        {
          "to": "시민",
          "kind": "audit",
          "summary": "공개 일지와 요금 근거"
        }
      ],
      "arcs": [
        {
          "act": 1,
          "title": "균열",
          "summary": "도성 통역석과 수서 세관 창구에서 언어 쌍 당직이 부족해진다"
        },
        {
          "act": 2,
          "title": "교섭",
          "summary": "표시완이 상암의 자동번역 우선와 공동 점검을 연다"
        },
        {
          "act": 3,
          "title": "대가",
          "summary": "통역을 자백 도구로 돌리지 않는다"
        }
      ],
      "prose": "도성 통역석과 수서 세관 창구에서 외교통역문이 언어 쌍 당직을 지킨다. 표시완은 자동번역이 빨라도 인준 문장은 사람이 읽는다. 상암의 자동번역 우선 앞에서는 공동 점검만 열고 키는 넘기지 않는다. 통역을 자백 도구로 돌리지 않는다."
    }
  ],
  "theaters": [],
  "synthetics": [],
  "story_batches": [],
  "hostile_groups": [],
  "monster_batches": [],
  "arcs": [],
  "relations": [],
  "change_ledger": [
    {
      "id": "CL-0004",
      "summary": "운영가문 24개를 총람에 등록하고 투영한다",
      "owner": "wiki-world"
    }
  ]
}
```
