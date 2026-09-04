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
| 개정 | r9 |
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

## 외부전구

다섯 외부전구(`XT01`–`XT05`)는 서울 16국 슬롯을 대체하지 않습니다. 사실·추론·창작 경계를 분리하고, 현 정권·현직 기관 혐의는 쓰지 않습니다. 일본 정사 연결표는 제거해도 서울 측 서사가 유지됩니다.

상세 필드는 아래 기계 등록부를 정본으로 합니다.

## 합성 사회 인격

인간형 `H01`–`H16`, 시설형 `F01`–`F16`, 기동형 `V01`–`V16`을 등록합니다. 기존 인간 412명의 식별자는 바꾸지 않습니다. 전지·무한 에너지·완전 기억은 금지합니다.

상세 필드는 아래 기계 등록부를 정본으로 합니다.

## 사회 서사 배치

B001–B046 배치 원장은 인간 K001–K412와 합성 H/F/V를 각각 한 번씩만 할당합니다. 본 절은 식별자 원장만 잠그며 배치 산문은 후속 작업에서 등록합니다.

## 적대 생태

G01–G24 군과 M001–M039 배치 원장을 등록합니다. 항목 산문은 후속 배치에서 채웁니다. 실재 기업 사고 귀속과 실재 피해자 선정주의는 금지합니다.

## 서사선 씨앗

24 가문, 5 전구, 합성 3급, 24 생태군의 3막 서사선 ID를 등록합니다. 기존 시나리오 타임라인 사건 문구는 덮어쓰지 않습니다.

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
    "revision": "r9",
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
      "HP10",
      "XT01",
      "XT02",
      "XT03",
      "XT04",
      "XT05",
      "H01",
      "H02",
      "H03",
      "H04",
      "H05",
      "H06",
      "H07",
      "H08",
      "H09",
      "H10",
      "H11",
      "H12",
      "H13",
      "H14",
      "H15",
      "H16",
      "F01",
      "F02",
      "F03",
      "F04",
      "F05",
      "F06",
      "F07",
      "F08",
      "F09",
      "F10",
      "F11",
      "F12",
      "F13",
      "F14",
      "F15",
      "F16",
      "V01",
      "V02",
      "V03",
      "V04",
      "V05",
      "V06",
      "V07",
      "V08",
      "V09",
      "V10",
      "V11",
      "V12",
      "V13",
      "V14",
      "V15",
      "V16"
    ],
    "projection_targets": [
      "Operating-Houses.md",
      "External-Theaters.md",
      "Synthetic-Actors.md",
      "Story-Batch-Manifest.md",
      "Hostile-Ecology-Index.md",
      "Monster-Batch-Manifest.md",
      "Regional-Physical-AI-Arcs.md",
      "World-Relation-Ledger.md",
      "World-Expansion-Index.md"
    ],
    "change_ledger_entry": "CL-0009",
    "verification_state": "seeds-authored"
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
  "theaters": [
    {
      "id": "XT01",
      "display_name": "임진관문전구",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        ".omo/research-private/nippon-sangoku-canon-bridge.md"
      ],
      "revision": 1,
      "projection_targets": [
        "External-Theaters.md"
      ],
      "verified": "임진강·한강 합류와 북부 환승·피난 회랑의 공개 지형 위치만 사실 앵커로 둔다. 현 정권·현직 기관의 범죄·정책 주장은 기록하지 않는다.",
      "inference": "붕괴 이후 개성·평양 방면 물자와 피난 흐름은 단절·우회가 반복된다는 추론만 허용하며 정사로 승격하지 않는다.",
      "original_fiction": "임진관문전구는 북산·창동·신내·도성이 공동으로 관문 검역과 귀환 명부를 운영하는 서울 창작 회랑이다.",
      "states": [
        "S10",
        "S11",
        "S12",
        "S06",
        "S14"
      ],
      "japan_bridge_removable": true,
      "routes": {
        "trade": "야간 곡물·의약품 우회 상자",
        "energy": "북부 비상 축전지 릴레이",
        "data": "귀환 명부 해시 동기",
        "refugee": "가족 재결합 대기열",
        "diaspora": "월경 친족 연락 창구",
        "security": "관문 이중 검역",
        "ai_custody": "귀환 안내 단말 공동 보관",
        "monster_migration": "철새·유기견 철군 북진 감시"
      },
      "scenario_chains": [
        {
          "id": "XT01-SC1",
          "summary": "임진 임시 검역소에서 귀환 명부가 훼손되고 북산이 재발급을 요구한다"
        },
        {
          "id": "XT01-SC2",
          "summary": "창동 차륜 호송이 관문 밖에서 멈춘 뒤 신내가 우회 환승을 연다"
        },
        {
          "id": "XT01-SC3",
          "summary": "도성 기록청이 위조 혈연 증서를 가려내고 아차 관문이 봉인 키를 나눈다"
        }
      ],
      "prose": "임진 제방 아래 임시 검역소에서 북산피난연맹 안내원이 귀환 명부를 손전등 빛에 비춘다. 창동 차륜 호송은 관문 밖 진흙길에 바퀴를 적시고, 신내 환승 창구는 가족 대기열만 먼저 연다. 도성 기록청 사서가 위조 혈연 증서의 잉크 번짐을 짚고, 아차 관문 초소는 봉인 키를 두 조각으로 나눈다. 어느 쪽도 북녘 정권을 단죄하지 않고, 통행과 명부만 지킨다."
    },
    {
      "id": "XT02",
      "display_name": "서해곡창전구",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "External-Theaters.md"
      ],
      "verified": "서해 연안·한강 하구 물길과 강서·영등포 일대 공개 시장·정수 위치만 사실 앵커로 둔다. 특정 현 국가 기관의 불법 무역 혐의는 쓰지 않는다.",
      "inference": "서해 쪽 곡물·냉동 화물은 조위와 전력 단절에 민감하다는 추론만 두고, 상대국 공식 정책을 단정하지 않는다.",
      "original_fiction": "서해곡창전구는 여의·서남·마곡·노량진이 하구 부두와 냉동 신용을 공동 점검하는 창작 무역 회랑이다.",
      "states": [
        "S01",
        "S02",
        "S03",
        "S08",
        "S09"
      ],
      "japan_bridge_removable": true,
      "routes": {
        "trade": "하구 곡물·냉동 상자 경매",
        "energy": "부두 비상 발전기 교대",
        "data": "화물 봉인 해시 장부",
        "refugee": "선원 가족 임시 숙소",
        "diaspora": "연안 언어 통역 창구",
        "security": "부두 야간 순찰 교대",
        "ai_custody": "하역 크레인 제어 키 분할",
        "monster_migration": "하수너구리·환승쥐 해안 이동 감시"
      },
      "scenario_chains": [
        {
          "id": "XT02-SC1",
          "summary": "여의 수문이 서해 조위에 맞춰 부두 배수 일정을 다시 짠다"
        },
        {
          "id": "XT02-SC2",
          "summary": "서남 제작창이 냉동 압축기 부품을 나누고 마곡이 계측 로그를 검증한다"
        },
        {
          "id": "XT02-SC3",
          "summary": "노량진 얼음 신용이 흔들릴 때 상암 송신이 경매 방송만 중계한다"
        }
      ],
      "prose": "한강 하구 임시 부두에서 여의신정수문 당직이 조위표와 배수 밸브를 맞춘다. 서남제작동맹 기술자는 냉동 압축기 소음을 듣고 부품 순번을 바꾸고, 마곡연구평의회 계측원은 봉인 해시가 깨진 상자만 따로 둔다. 노량진남관상회 얼음 장부는 전력 경고등이 켜져도 경매 순번을 지우지 않는다. 상암송신공사는 가격 구호 대신 부두 안전 방송만 내보낸다."
    },
    {
      "id": "XT03",
      "display_name": "해협삼로전구",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        ".omo/research-private/nippon-sangoku-canon-bridge.md"
      ],
      "revision": 1,
      "projection_targets": [
        "External-Theaters.md"
      ],
      "verified": "한반도·일본 열도 사이 해상 거리와 공개 항로 개념만 사실 앵커로 둔다. 원작 고유 국가명·인물·대사·연표 문장은 공개 본문에 넣지 않는다.",
      "inference": "세 갈래 해상 중계가 생필·부품·통역 수요를 나눈다는 추론은 창작 전제이며, 비공개 연결표를 제거해도 서울 측 서사는 유지된다.",
      "original_fiction": "해협삼로전구는 용산·수서·가락·뚝도가 세 갈래 중계 부두와 통역 창구를 운영하는 서울 창작 해로이다 정사 연결표는 언제든 뗄 수 있다.",
      "states": [
        "S07",
        "S16",
        "S15",
        "S04",
        "S08"
      ],
      "japan_bridge_removable": true,
      "routes": {
        "trade": "부품·약품·통조림 삼로 중계",
        "energy": "부두 충전 슬롯 예약",
        "data": "통역 용어 사전 동기",
        "refugee": "귀환 선원 검역 대기",
        "diaspora": "혼혈·귀환 가족 상담",
        "security": "중계 부두 무장 최소화 순찰",
        "ai_custody": "항해 보조 단말 삼자 보관",
        "monster_migration": "철새습지포식군 연안 우회 감시"
      },
      "scenario_chains": [
        {
          "id": "XT03-SC1",
          "summary": "용산 환적창이 삼로 중 한 길을 닫고 수서가 대체 회차선을 연다"
        },
        {
          "id": "XT03-SC2",
          "summary": "가락 배급이 통조림 할당을 재조정하고 뚝도 공방이 밀봉 공구를 보낸다"
        },
        {
          "id": "XT03-SC3",
          "summary": "노량진 통역 창구가 용어 충돌을 기록한 뒤 비공개 연결표 없이도 협정을 유지한다"
        }
      ],
      "prose": "용산철도후국 환적 창구 앞에 세 갈래 중계 표지판이 빗물에 번진다. 수서강남협약도시 배차원은 닫힌 항로 대신 내륙 회차 슬롯을 열고, 가락잠실배급국 계원은 통조림 상자에 새 봉인을 붙인다. 뚝도공방연합 직공은 밀봉 공구만 건네고 국경 이야기에 끼어들지 않는다. 노량진 통역 창구는 외래어를 한국어 주석 옆에 적어, 비공개 연결표를 치워도 협정이 남게 한다."
    },
    {
      "id": "XT04",
      "display_name": "두만극동전구",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY"
      ],
      "revision": 1,
      "projection_targets": [
        "External-Theaters.md"
      ],
      "verified": "대륙 철도·극동 에너지 회랑의 지리 개념만 사실 앵커로 둔다. 특정 현 정부·국영기업의 불법 채굴·밀수 혐의는 쓰지 않는다.",
      "inference": "붕괴 후 희토·연료·레일 부품이 동북 우회로로 들어온다는 추론은 창작 물류 전제에 한정한다.",
      "original_fiction": "두만극동전구는 암사·신내·창동·약령이 철도 우회와 광물·연료 검수를 나누는 서울 창작 내륙 회랑이다.",
      "states": [
        "S05",
        "S12",
        "S11",
        "S13",
        "S14"
      ],
      "japan_bridge_removable": true,
      "routes": {
        "trade": "레일 부품·광물 샘플 검수",
        "energy": "동절 연료 배급 큐",
        "data": "화차 중량 센서 로그",
        "refugee": "극동 귀환 노동자 숙소",
        "diaspora": "중앙아시아·사할린 귀환 상담",
        "security": "화차 봉인 이중 확인",
        "ai_custody": "기관차 보조 AI 공동 잠금",
        "monster_migration": "폐선보수열차군·철비늘 이동 감시"
      },
      "scenario_chains": [
        {
          "id": "XT04-SC1",
          "summary": "암사 상수단이 화차 중량 로그를 공개하고 신내가 환승 슬롯을 조정한다"
        },
        {
          "id": "XT04-SC2",
          "summary": "창동 차륜방이 동절 연료 큐를 나누고 약령이 동상 환자를 받는다"
        },
        {
          "id": "XT04-SC3",
          "summary": "아차 관문이 광물 샘플 봉인을 검사한 뒤 위조 원산지 표를 폐기한다"
        }
      ],
      "prose": "암사고덕상수단 야적장에서 화차 중량 센서가 한 칸만 과하게 뛴다. 신내망우환승시 배차원은 그 칸을 우회 슬롯에 넣고, 창동차륜방 정비수는 동절 연료 드럼 순번을 다시 쓴다. 약령의정동맹 의무실은 동상에 걸린 귀환 노동자의 장갑을 말리고, 아차구의관문국 검사관은 원산지 위조 표를 난로에 넣지 않고 증빙 봉투에 봉한다. 누구의 정부도 단죄하지 않고 화차와 사람만 검수한다."
    },
    {
      "id": "XT05",
      "display_name": "원양신탁전구",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Sixteen-States.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Unofficial-Fan-AU-Notice.md"
      ],
      "revision": 1,
      "projection_targets": [
        "External-Theaters.md"
      ],
      "verified": "위성·인도·방재 협력의 일반 개념과 공개 국제기구 명칭 수준만 사실 앵커로 둔다. 현 미·유엔 당국의 비밀 작전·불법 감시 혐의는 쓰지 않는다.",
      "inference": "붕괴 후 위성 잔여 대역과 인도 물자가 신탁 창구로 들어온다는 설정은 창작이며 특정 현직 사령부 행위로 단정하지 않는다.",
      "original_fiction": "원양신탁전구는 상암·여의·도성·수서·마곡이 위성 잔여 대역·인도 목록·디아스포라 연락을 신탁하는 서울 창작 원양 창구이다.",
      "states": [
        "S09",
        "S01",
        "S06",
        "S16",
        "S03",
        "S15"
      ],
      "japan_bridge_removable": true,
      "routes": {
        "trade": "인도 물자 할당 목록",
        "energy": "비상 송신 전력 쿼터",
        "data": "위성 잔여 대역 예약",
        "refugee": "해외 가족 재연결 대기",
        "diaspora": "다국어 상담·송금 기록",
        "security": "송신 키 시민 참관",
        "ai_custody": "궤도 중계 단말 다자 보관",
        "monster_migration": "감시궤도군 잔향 오탐 교정"
      },
      "scenario_chains": [
        {
          "id": "XT05-SC1",
          "summary": "상암 송신이 잔여 대역을 공개 추첨하고 여의가 급수 당직과 시간을 맞춘다"
        },
        {
          "id": "XT05-SC2",
          "summary": "도성 기록청이 인도 목록 해시를 보관하고 수서가 배송 회차선을 연다"
        },
        {
          "id": "XT05-SC3",
          "summary": "마곡이 궤도 단말 오탐을 교정하고 가락이 이산가족 상담 창구를 연장한다"
        }
      ],
      "prose": "상암송신공사 옥상에서 잔여 대역 추첨 번호가 방송된다. 여의신정수문 당직은 급수 펌프 가동 시각을 그 번호에 맞추고, 도성기록청 사서는 인도 목록 해시를 시민 참관 칸에 붙인다. 수서강남협약도시 배차원이 해외 송금 기록 상자만 실은 회차선을 열고, 마곡연구평의회 기술자는 궤도 단말의 오탐 경보를 끈다. 가락 상담 창구는 밤이 깊어도 다국어 대기표를 버리지 않는다."
    }
  ],
  "synthetics": [
    {
      "id": "H01",
      "display_name": "한누리",
      "callsign": "누리",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S01"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S01",
      "house_id": "HC01",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC01 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "한재목 주정비·HC01 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S01 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K001",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC01",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K004",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S01 정비 벤치에서 한누리(누리)이 HC01 당직 로그에 출입을 남긴다. 한재목은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 칸 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H02",
      "display_name": "서린",
      "callsign": "린",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S02"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S02",
      "house_id": "HC02",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC02 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "강민서 주정비·HC02 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S02 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K029",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC02",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K011",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S02 충전 칸에서 서린(린)이 HC02 당직 로그에 출입을 남긴다. 강민서은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 관측 난간 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H03",
      "display_name": "이도",
      "callsign": "이도",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S03"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S03",
      "house_id": "HC03",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC03 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "서이안 주정비·HC03 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S03 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K057",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC03",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K018",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S03 관측 난간에서 이도(이도)이 HC03 당직 로그에 출입을 남긴다. 서이안은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 공구 벽 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H04",
      "display_name": "강별",
      "callsign": "별",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S04"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S04",
      "house_id": "HC04",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC04 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "임하준 주정비·HC04 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S04 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K085",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC04",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K025",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S04 공구 벽에서 강별(별)이 HC04 당직 로그에 출입을 남긴다. 임하준은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 정비 벤치 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H05",
      "display_name": "윤재",
      "callsign": "재",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S05"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S05",
      "house_id": "HC05",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC05 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "배우진 주정비·HC05 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S05 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K114",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC05",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K032",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S05 정비 벤치에서 윤재(재)이 HC05 당직 로그에 출입을 남긴다. 배우진은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 칸 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H06",
      "display_name": "박솔",
      "callsign": "솔",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S06"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S06",
      "house_id": "HC06",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC06 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "윤서린 주정비·HC06 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S06 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K142",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC06",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K039",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S06 충전 칸에서 박솔(솔)이 HC06 당직 로그에 출입을 남긴다. 윤서린은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 관측 난간 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H07",
      "display_name": "정우람",
      "callsign": "우람",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S07"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S07",
      "house_id": "HC07",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC07 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "박태겸 주정비·HC07 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S07 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K166",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC07",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K046",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S07 관측 난간에서 정우람(우람)이 HC07 당직 로그에 출입을 남긴다. 박태겸은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 공구 벽 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H08",
      "display_name": "최다온",
      "callsign": "다온",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S08"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S08",
      "house_id": "HC08",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC08 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "오해린 주정비·HC08 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S08 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K190",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC08",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K053",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S08 공구 벽에서 최다온(다온)이 HC08 당직 로그에 출입을 남긴다. 오해린은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 정비 벤치 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H09",
      "display_name": "조하람",
      "callsign": "하람",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S09"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S09",
      "house_id": "HC09",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC09 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "문가람 주정비·HC09 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S09 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K215",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC09",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K060",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S09 정비 벤치에서 조하람(하람)이 HC09 당직 로그에 출입을 남긴다. 문가람은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 칸 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H10",
      "display_name": "윤새론",
      "callsign": "새론",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S10"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S10",
      "house_id": "HC10",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC10 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "백온 주정비·HC10 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S10 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K240",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC10",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K067",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S10 충전 칸에서 윤새론(새론)이 HC10 당직 로그에 출입을 남긴다. 백온은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 관측 난간 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H11",
      "display_name": "김도하",
      "callsign": "도하",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S11"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S11",
      "house_id": "HC11",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC11 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "김도윤 주정비·HC11 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S11 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K265",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC11",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K074",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S11 관측 난간에서 김도하(도하)이 HC11 당직 로그에 출입을 남긴다. 김도윤은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 공구 벽 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H12",
      "display_name": "이채온",
      "callsign": "채온",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S12"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S12",
      "house_id": "HC12",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC12 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "장세화 주정비·HC12 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S12 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K290",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC12",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K081",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S12 공구 벽에서 이채온(채온)이 HC12 당직 로그에 출입을 남긴다. 장세화은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 정비 벤치 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H13",
      "display_name": "한빛나",
      "callsign": "빛나",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S13"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S13",
      "house_id": "HC13",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC13 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "류은비 주정비·HC13 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S13 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K315",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC13",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K088",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S13 정비 벤치에서 한빛나(빛나)이 HC13 당직 로그에 출입을 남긴다. 류은비은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 칸 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H14",
      "display_name": "오세림",
      "callsign": "세림",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S14"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S14",
      "house_id": "HC14",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HC14 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "고서준 주정비·HC14 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S14 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K340",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC14",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K095",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S14 충전 칸에서 오세림(세림)이 HC14 당직 로그에 출입을 남긴다. 고서준은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 관측 난간 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H15",
      "display_name": "배수아",
      "callsign": "수아",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S15"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S15",
      "house_id": "HP01",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HP01 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "남윤경 주정비·HP01 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S15 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K365",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP01",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K102",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S15 관측 난간에서 배수아(수아)이 HP01 당직 로그에 출입을 남긴다. 남윤경은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 공구 벽 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "H16",
      "display_name": "신태율",
      "callsign": "태율",
      "cls": "H",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S16"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S16",
      "house_id": "HP02",
      "body_platform": "인간형 보조 골격·교체형 손모듈·야간 시야 제한",
      "custody_legal": "HP02 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "정유라 주정비·HP02 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S16 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K389",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP02",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K109",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S16 공구 벽에서 신태율(태율)이 HP02 당직 로그에 출입을 남긴다. 정유라은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 정비 벤치 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F01",
      "display_name": "냉각탑지기",
      "callsign": "탑지",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S01"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S01",
      "house_id": "HC09",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HC09 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "이서담 주정비·HC09 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S01 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K002",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC09",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K116",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S01 기계실에서 냉각탑지기(탑지)이 HC09 당직 로그에 출입을 남긴다. 이서담은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 배전반 앞 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F02",
      "display_name": "배전반이",
      "callsign": "전반",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S02"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S02",
      "house_id": "HC10",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HC10 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "정시우 주정비·HC10 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S02 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K030",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC10",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K123",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S02 배전반 앞에서 배전반이(전반)이 HC10 당직 로그에 출입을 남긴다. 정시우은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 필터 복도 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F03",
      "display_name": "정수여과",
      "callsign": "여과",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S03"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S03",
      "house_id": "HC11",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HC11 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "정하린 주정비·HC11 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S03 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K058",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC11",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K130",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S03 필터 복도에서 정수여과(여과)이 HC11 당직 로그에 출입을 남긴다. 정하린은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 제어 부스 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F04",
      "display_name": "냉동창고",
      "callsign": "냉창",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S04"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S04",
      "house_id": "HC12",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HC12 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "임초원 주정비·HC12 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S04 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K086",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC12",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K137",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S04 제어 부스에서 냉동창고(냉창)이 HC12 당직 로그에 출입을 남긴다. 임초원은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 기계실 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F05",
      "display_name": "송신중계",
      "callsign": "중계",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S05"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S05",
      "house_id": "HC13",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HC13 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "김우찬 주정비·HC13 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S05 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K115",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC13",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K144",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S05 기계실에서 송신중계(중계)이 HC13 당직 로그에 출입을 남긴다. 김우찬은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 배전반 앞 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F06",
      "display_name": "승강기축",
      "callsign": "승축",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S06"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S06",
      "house_id": "HC14",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HC14 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "강예준 주정비·HC14 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S06 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K143",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC14",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K151",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S06 배전반 앞에서 승강기축(승축)이 HC14 당직 로그에 출입을 남긴다. 강예준은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 필터 복도 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F07",
      "display_name": "보일러실",
      "callsign": "보일",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S07"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S07",
      "house_id": "HP01",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP01 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "신가온 주정비·HP01 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S07 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K167",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP01",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K158",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S07 필터 복도에서 보일러실(보일)이 HP01 당직 로그에 출입을 남긴다. 신가온은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 제어 부스 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F08",
      "display_name": "하수펌프",
      "callsign": "하수",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S08"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S08",
      "house_id": "HP02",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP02 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "조민재 주정비·HP02 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S08 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K191",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP02",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K165",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S08 제어 부스에서 하수펌프(하수)이 HP02 당직 로그에 출입을 남긴다. 조민재은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 기계실 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F09",
      "display_name": "실험클린",
      "callsign": "클린",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S09"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S09",
      "house_id": "HP03",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP03 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "권미래 주정비·HP03 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S09 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K216",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP03",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K172",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S09 기계실에서 실험클린(클린)이 HP03 당직 로그에 출입을 남긴다. 권미래은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 배전반 앞 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F10",
      "display_name": "물류분류",
      "callsign": "분류",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S10"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S10",
      "house_id": "HP04",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP04 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "신보람 주정비·HP04 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S10 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K241",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP04",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K179",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S10 배전반 앞에서 물류분류(분류)이 HP04 당직 로그에 출입을 남긴다. 신보람은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 필터 복도 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F11",
      "display_name": "전력변압",
      "callsign": "변압",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S11"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S11",
      "house_id": "HP05",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP05 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "송하율 주정비·HP05 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S11 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K266",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP05",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K186",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S11 필터 복도에서 전력변압(변압)이 HP05 당직 로그에 출입을 남긴다. 송하율은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 제어 부스 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F12",
      "display_name": "환기덕트",
      "callsign": "덕트",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S12"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S12",
      "house_id": "HP06",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP06 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "안도한 주정비·HP06 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S12 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K291",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP06",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K193",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S12 제어 부스에서 환기덕트(덕트)이 HP06 당직 로그에 출입을 남긴다. 안도한은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 기계실 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F13",
      "display_name": "의료멸균",
      "callsign": "멸균",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S13"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S13",
      "house_id": "HP07",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP07 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "심달호 주정비·HP07 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S13 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K316",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP07",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K200",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S13 기계실에서 의료멸균(멸균)이 HP07 당직 로그에 출입을 남긴다. 심달호은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 배전반 앞 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F14",
      "display_name": "인쇄기동",
      "callsign": "인쇄",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S14"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S14",
      "house_id": "HP08",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP08 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "문하율 주정비·HP08 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S14 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K341",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP08",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K207",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S14 배전반 앞에서 인쇄기동(인쇄)이 HP08 당직 로그에 출입을 남긴다. 문하율은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 필터 복도 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F15",
      "display_name": "급수계량",
      "callsign": "계량",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S15"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S15",
      "house_id": "HP09",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP09 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "은태호 주정비·HP09 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S15 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K366",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP09",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K214",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S15 필터 복도에서 급수계량(계량)이 HP09 당직 로그에 출입을 남긴다. 은태호은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 제어 부스 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "F16",
      "display_name": "터널환기",
      "callsign": "터환",
      "cls": "F",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S16"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S16",
      "house_id": "HP10",
      "body_platform": "시설 고정 랙·센서 버스·현장 단말 연결",
      "custody_legal": "HP10 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "하서진 주정비·HP10 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S16 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K390",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP10",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K221",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S16 제어 부스에서 터널환기(터환)이 HP10 당직 로그에 출입을 남긴다. 하서진은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 기계실 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V01",
      "display_name": "새벽호송",
      "callsign": "새벽",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S01"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S01",
      "house_id": "HP03",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP03 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "김태운 주정비·HP03 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S01 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K003",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP03",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K228",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S01 회차선에서 새벽호송(새벽)이 HP03 당직 로그에 출입을 남긴다. 김태운은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 적재 베이 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V02",
      "display_name": "순환버스",
      "callsign": "순환",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S02"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S02",
      "house_id": "HP04",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP04 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "김나율 주정비·HP04 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S02 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K031",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP04",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K235",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S02 적재 베이에서 순환버스(순환)이 HP04 당직 로그에 출입을 남긴다. 김나율은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 점검 피트 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V03",
      "display_name": "화물트램",
      "callsign": "트램",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S03"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S03",
      "house_id": "HP05",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP05 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "최은재 주정비·HP05 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S03 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K059",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP05",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K242",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S03 점검 피트에서 화물트램(트램)이 HP05 당직 로그에 출입을 남긴다. 최은재은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 슬롯 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V04",
      "display_name": "구경로봇",
      "callsign": "구경로",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S04"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S04",
      "house_id": "HP06",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP06 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "한소미 주정비·HP06 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S04 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K087",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP06",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K249",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S04 충전 슬롯에서 구경로봇(구경로)이 HP06 당직 로그에 출입을 남긴다. 한소미은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 회차선 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V05",
      "display_name": "레일견인",
      "callsign": "견인",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S05"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S05",
      "house_id": "HP07",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP07 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "정소율 주정비·HP07 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S05 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K116",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP07",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K256",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S05 회차선에서 레일견인(견인)이 HP07 당직 로그에 출입을 남긴다. 정소율은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 적재 베이 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V06",
      "display_name": "배전트럭",
      "callsign": "배전",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S06"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S06",
      "house_id": "HP08",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP08 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "조하린 주정비·HP08 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S06 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K144",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP08",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K263",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S06 적재 베이에서 배전트럭(배전)이 HP08 당직 로그에 출입을 남긴다. 조하린은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 점검 피트 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V07",
      "display_name": "청소차륜",
      "callsign": "청소",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S07"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S07",
      "house_id": "HP09",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP09 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "권시온 주정비·HP09 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S07 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K168",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP09",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K270",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S07 점검 피트에서 청소차륜(청소)이 HP09 당직 로그에 출입을 남긴다. 권시온은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 슬롯 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V08",
      "display_name": "구급카트",
      "callsign": "구급",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S08"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S08",
      "house_id": "HP10",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HP10 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "윤서하 주정비·HP10 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S08 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K192",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HP10",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K277",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S08 충전 슬롯에서 구급카트(구급)이 HP10 당직 로그에 출입을 남긴다. 윤서하은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 회차선 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V09",
      "display_name": "항만크레인",
      "callsign": "크레인",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S09"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S09",
      "house_id": "HC01",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC01 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "황은설 주정비·HC01 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S09 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K217",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC01",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K284",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S09 회차선에서 항만크레인(크레인)이 HC01 당직 로그에 출입을 남긴다. 황은설은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 적재 베이 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V10",
      "display_name": "도크셔틀",
      "callsign": "도크",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S10"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S10",
      "house_id": "HC02",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC02 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "황세린 주정비·HC02 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S10 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K242",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC02",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K291",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S10 적재 베이에서 도크셔틀(도크)이 HC02 당직 로그에 출입을 남긴다. 황세린은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 점검 피트 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V11",
      "display_name": "야간배차",
      "callsign": "야배",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S11"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S11",
      "house_id": "HC03",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC03 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "조우찬 주정비·HC03 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S11 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K267",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC03",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K298",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S11 점검 피트에서 야간배차(야배)이 HC03 당직 로그에 출입을 남긴다. 조우찬은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 슬롯 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V12",
      "display_name": "중장비팔",
      "callsign": "중팔",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S12"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S12",
      "house_id": "HC04",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC04 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "전미리 주정비·HC04 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S12 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K292",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC04",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K305",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S12 충전 슬롯에서 중장비팔(중팔)이 HC04 당직 로그에 출입을 남긴다. 전미리은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 회차선 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V13",
      "display_name": "터널보선",
      "callsign": "보선",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S13"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S13",
      "house_id": "HC05",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC05 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "은채윤 주정비·HC05 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S13 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K317",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC05",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K312",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S13 회차선에서 터널보선(보선)이 HC05 당직 로그에 출입을 남긴다. 은채윤은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 적재 베이 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V14",
      "display_name": "교량점검",
      "callsign": "교량",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S14"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S14",
      "house_id": "HC06",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC06 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "안기준 주정비·HC06 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S14 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K342",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC06",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K319",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S14 적재 베이에서 교량점검(교량)이 HC06 당직 로그에 출입을 남긴다. 안기준은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 점검 피트 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V15",
      "display_name": "수문카트",
      "callsign": "수문",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S15"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S15",
      "house_id": "HC07",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC07 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "라진우 주정비·HC07 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S15 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K367",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC07",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K326",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S15 점검 피트에서 수문카트(수문)이 HC07 당직 로그에 출입을 남긴다. 라진우은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 충전 슬롯 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    },
    {
      "id": "V16",
      "display_name": "비상견인",
      "callsign": "비견",
      "cls": "V",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "Cast-Index.md#S16"
      ],
      "revision": 1,
      "projection_targets": [
        "Synthetic-Actors.md"
      ],
      "state_id": "S16",
      "house_id": "HC08",
      "body_platform": "차체/대차 플랫폼·배터리 슬롯·차선 센서",
      "custody_legal": "HC08 공동 보관·시민 참관 봉인·양도 시 삼자 서명",
      "memory_continuity": "교대 단위 스냅샷만 유지, 장기 완전 기억 금지, 포크 시 분기 로그 필수",
      "energy_parts": "교체형 배터리·마모 부품 할당제, 무한 에너지 없음",
      "maintenance": "곽은재 주정비·HC08 감사 입회",
      "network_safety": "구역 망만 허용, 교차 시설 루트 기본 차단, 비상 시 읽기 전용",
      "emergent_goal": "S16 구역 연속 가동과 담당 인간 안전 우선",
      "divergence_recovery": "일탈 시 오프라인 격리→스냅샷 롤백→인간 승인 후 부분 재연결",
      "relations": [
        {
          "target": "K391",
          "kind": "custodian",
          "reason": "주정비·법적 책임"
        },
        {
          "target": "HC08",
          "kind": "steward_house",
          "reason": "보관·감사"
        },
        {
          "target": "K333",
          "kind": "work_peer",
          "reason": "교대 협력"
        }
      ],
      "prose": "S16 충전 슬롯에서 비상견인(비견)이 HC08 당직 로그에 출입을 남긴다. 곽은재은 배터리 잔량과 보관 봉인을 함께 확인하고, 기억 포크는 당일 분만 동기화한다. 회차선 경보가 울려도 전체 망 권한은 열지 않고 구역 키만 요청한다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다."
    }
  ],
  "story_batches": [
    {
      "id": "B001",
      "actors": [
        {
          "id": "K092",
          "name": "정가온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K121",
          "name": "임겨레",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K149",
          "name": "마도한",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K173",
          "name": "주서람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K197",
          "name": "마솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K222",
          "name": "모봉용",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K001",
          "name": "한재목",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S01"
        },
        {
          "id": "K029",
          "name": "강민서",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S02"
        },
        {
          "id": "K242",
          "name": "황세린",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S10"
        },
        {
          "id": "H01",
          "name": "한누리",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S01"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B002",
      "actors": [
        {
          "id": "K247",
          "name": "모봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K272",
          "name": "모소",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K297",
          "name": "복봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K322",
          "name": "동늘솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K347",
          "name": "원예나",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K372",
          "name": "동미온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K057",
          "name": "서이안",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S03"
        },
        {
          "id": "K085",
          "name": "임하준",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S04"
        },
        {
          "id": "K267",
          "name": "조우찬",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S11"
        },
        {
          "id": "H02",
          "name": "서린",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S02"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B003",
      "actors": [
        {
          "id": "K396",
          "name": "선초별",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K009",
          "name": "유세진",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K037",
          "name": "한지온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K065",
          "name": "임시온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K093",
          "name": "장민재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K122",
          "name": "한보라",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K114",
          "name": "배우진",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S05"
        },
        {
          "id": "K142",
          "name": "윤서린",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S06"
        },
        {
          "id": "K292",
          "name": "전미리",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S12"
        },
        {
          "id": "H03",
          "name": "이도",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S03"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B004",
      "actors": [
        {
          "id": "K150",
          "name": "연지우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K174",
          "name": "차호민",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K198",
          "name": "연가온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K223",
          "name": "봉소",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K248",
          "name": "봉감",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K273",
          "name": "봉복",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K166",
          "name": "박태겸",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S07"
        },
        {
          "id": "K190",
          "name": "오해린",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S08"
        },
        {
          "id": "K317",
          "name": "은채윤",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S13"
        },
        {
          "id": "H04",
          "name": "강별",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S04"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B005",
      "actors": [
        {
          "id": "K298",
          "name": "국용",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K323",
          "name": "방한울",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K348",
          "name": "영석온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K373",
          "name": "방늘재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K397",
          "name": "원새울",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K010",
          "name": "허도담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K215",
          "name": "문가람",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S09"
        },
        {
          "id": "K240",
          "name": "백온",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S10"
        },
        {
          "id": "K342",
          "name": "안기준",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S14"
        },
        {
          "id": "H05",
          "name": "윤재",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S05"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B006",
      "actors": [
        {
          "id": "K038",
          "name": "허다온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K066",
          "name": "허서겸",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K094",
          "name": "유하은",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K123",
          "name": "양필호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K151",
          "name": "나선재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K175",
          "name": "설민우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K265",
          "name": "김도윤",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S11"
        },
        {
          "id": "K290",
          "name": "장세화",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S12"
        },
        {
          "id": "K367",
          "name": "라진우",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S15"
        },
        {
          "id": "H06",
          "name": "박솔",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S06"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B007",
      "actors": [
        {
          "id": "K199",
          "name": "나태경",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K224",
          "name": "용복",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K249",
          "name": "용국",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K274",
          "name": "용모",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K299",
          "name": "감국",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K324",
          "name": "수초롱",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K315",
          "name": "류은비",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S13"
        },
        {
          "id": "K340",
          "name": "고서준",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S14"
        },
        {
          "id": "K391",
          "name": "곽은재",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S16"
        },
        {
          "id": "H07",
          "name": "정우람",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S07"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B008",
      "actors": [
        {
          "id": "K349",
          "name": "판늘샘",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K374",
          "name": "수한별",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K398",
          "name": "영마온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K011",
          "name": "구태윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K039",
          "name": "구찬솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K067",
          "name": "구연재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K365",
          "name": "남윤경",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S15"
        },
        {
          "id": "K389",
          "name": "정유라",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S16"
        },
        {
          "id": "K004",
          "name": "박누리",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S01"
        },
        {
          "id": "H08",
          "name": "최다온",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S08"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B009",
      "actors": [
        {
          "id": "K095",
          "name": "허겸",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K124",
          "name": "주은솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K152",
          "name": "양해온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K176",
          "name": "지온유",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K200",
          "name": "양이든",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K225",
          "name": "소감",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K002",
          "name": "이서담",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S01"
        },
        {
          "id": "K030",
          "name": "정시우",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S02"
        },
        {
          "id": "K032",
          "name": "이강묵",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S02"
        },
        {
          "id": "H09",
          "name": "조하람",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S09"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B010",
      "actors": [
        {
          "id": "K250",
          "name": "소두",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K275",
          "name": "소봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K300",
          "name": "두복",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K325",
          "name": "선나휘",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K350",
          "name": "천초윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K375",
          "name": "선다솜",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K058",
          "name": "정하린",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S03"
        },
        {
          "id": "K086",
          "name": "임초원",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S04"
        },
        {
          "id": "K060",
          "name": "이봄결",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S03"
        },
        {
          "id": "H10",
          "name": "윤새론",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S10"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B011",
      "actors": [
        {
          "id": "K399",
          "name": "판지솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K012",
          "name": "진하겸",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K040",
          "name": "진우람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K068",
          "name": "진채온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K096",
          "name": "구도영",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K125",
          "name": "차나루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K115",
          "name": "김우찬",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S05"
        },
        {
          "id": "K143",
          "name": "강예준",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S06"
        },
        {
          "id": "K088",
          "name": "박세린",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S04"
        },
        {
          "id": "H11",
          "name": "김도하",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S11"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B012",
      "actors": [
        {
          "id": "K153",
          "name": "주리안",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K177",
          "name": "마하린",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K201",
          "name": "주나경",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K226",
          "name": "복두모",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K251",
          "name": "복모",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K276",
          "name": "복두",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K167",
          "name": "신가온",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S07"
        },
        {
          "id": "K191",
          "name": "조민재",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S08"
        },
        {
          "id": "K117",
          "name": "장석윤",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S05"
        },
        {
          "id": "H12",
          "name": "이채온",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S12"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B013",
      "actors": [
        {
          "id": "K301",
          "name": "복감",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K326",
          "name": "원미루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K351",
          "name": "동새봄",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K376",
          "name": "원주온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K400",
          "name": "천늘우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K013",
          "name": "채온결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K216",
          "name": "권미래",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S09"
        },
        {
          "id": "K241",
          "name": "신보람",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S10"
        },
        {
          "id": "K145",
          "name": "윤지율",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S06"
        },
        {
          "id": "H13",
          "name": "한빛나",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S13"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B014",
      "actors": [
        {
          "id": "K041",
          "name": "채리울",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K069",
          "name": "채봄",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K097",
          "name": "진모래",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K126",
          "name": "설강우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K154",
          "name": "차세온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K178",
          "name": "연시완",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K266",
          "name": "송하율",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S11"
        },
        {
          "id": "K291",
          "name": "안도한",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S12"
        },
        {
          "id": "K169",
          "name": "황지호",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S07"
        },
        {
          "id": "H14",
          "name": "오세림",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S14"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B015",
      "actors": [
        {
          "id": "K202",
          "name": "차진아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K227",
          "name": "국두봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K252",
          "name": "국봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K277",
          "name": "국두",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K302",
          "name": "봉모",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K327",
          "name": "영늘빛",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K316",
          "name": "심달호",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S13"
        },
        {
          "id": "K341",
          "name": "문하율",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S14"
        },
        {
          "id": "K193",
          "name": "신태산",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S08"
        },
        {
          "id": "H15",
          "name": "배수아",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S15"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B016",
      "actors": [
        {
          "id": "K352",
          "name": "방마름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K377",
          "name": "영미결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K401",
          "name": "동새결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K014",
          "name": "표시완",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K042",
          "name": "표강호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K070",
          "name": "표지안",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K366",
          "name": "은태호",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S15"
        },
        {
          "id": "K390",
          "name": "하서진",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S16"
        },
        {
          "id": "K218",
          "name": "송재민",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S09"
        },
        {
          "id": "H16",
          "name": "신태율",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S16"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B017",
      "actors": [
        {
          "id": "K098",
          "name": "채구름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K127",
          "name": "지목현",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K155",
          "name": "설다흰",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K179",
          "name": "나길호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K203",
          "name": "설초아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K228",
          "name": "감봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K003",
          "name": "김태운",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S01"
        },
        {
          "id": "K031",
          "name": "김나율",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S02"
        },
        {
          "id": "K243",
          "name": "강태산",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S10"
        },
        {
          "id": "F01",
          "name": "냉각탑지기",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S01"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B018",
      "actors": [
        {
          "id": "K253",
          "name": "감용",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K278",
          "name": "감두",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K303",
          "name": "용봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K328",
          "name": "판한들",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K353",
          "name": "수지완",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K378",
          "name": "판효담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K059",
          "name": "최은재",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S03"
        },
        {
          "id": "K087",
          "name": "한소미",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S04"
        },
        {
          "id": "K268",
          "name": "서진아",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S11"
        },
        {
          "id": "F02",
          "name": "배전반이",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S02"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B019",
      "actors": [
        {
          "id": "K402",
          "name": "방마빛",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K015",
          "name": "명우재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K043",
          "name": "명소이",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K071",
          "name": "명해솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K099",
          "name": "표산하",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K128",
          "name": "마길상",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K116",
          "name": "정소율",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S05"
        },
        {
          "id": "K144",
          "name": "조하린",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S06"
        },
        {
          "id": "K293",
          "name": "문시온",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S12"
        },
        {
          "id": "F03",
          "name": "정수여과",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S03"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B020",
      "actors": [
        {
          "id": "K156",
          "name": "지한솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K180",
          "name": "양채윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K204",
          "name": "지마루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K229",
          "name": "두용",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K254",
          "name": "두소",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K279",
          "name": "두국",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K168",
          "name": "권시온",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S07"
        },
        {
          "id": "K192",
          "name": "윤서하",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S08"
        },
        {
          "id": "K318",
          "name": "라세영",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S13"
        },
        {
          "id": "F04",
          "name": "냉동창고",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S04"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B021",
      "actors": [
        {
          "id": "K304",
          "name": "국소",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K329",
          "name": "천다올",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K354",
          "name": "선늘봄",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K379",
          "name": "천솔빛",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K403",
          "name": "선한솜",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K016",
          "name": "제윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K217",
          "name": "황은설",
          "origin": "multicultural",
          "subgroup": "korea-born-multicultural",
          "state_id": "S09"
        },
        {
          "id": "K343",
          "name": "하윤목",
          "origin": "multicultural",
          "subgroup": "chinese-diaspora",
          "state_id": "S14"
        },
        {
          "id": "K368",
          "name": "전나경",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S15"
        },
        {
          "id": "F05",
          "name": "송신중계",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S05"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B022",
      "actors": [
        {
          "id": "K044",
          "name": "제하온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K072",
          "name": "제라온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K100",
          "name": "명강산",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K129",
          "name": "연하진",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K157",
          "name": "마은결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K181",
          "name": "주하음",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K392",
          "name": "심유리",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S16"
        },
        {
          "id": "K005",
          "name": "최한결",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S01"
        },
        {
          "id": "K393",
          "name": "은보람",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S16"
        },
        {
          "id": "F06",
          "name": "승강기축",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S06"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B023",
      "actors": [
        {
          "id": "K205",
          "name": "마하율",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K230",
          "name": "모국",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K255",
          "name": "모감",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K280",
          "name": "모복",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K305",
          "name": "복용",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K330",
          "name": "동주하",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K033",
          "name": "박소언",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S02"
        },
        {
          "id": "K061",
          "name": "김도하",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S03"
        },
        {
          "id": "K006",
          "name": "정모란",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S01"
        },
        {
          "id": "F07",
          "name": "보일러실",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S07"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B024",
      "actors": [
        {
          "id": "K355",
          "name": "원다결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K380",
          "name": "동예솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K404",
          "name": "원초온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K017",
          "name": "변고운",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K045",
          "name": "변시람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K073",
          "name": "변태온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K101",
          "name": "제하율",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K089",
          "name": "김보람",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S04"
        },
        {
          "id": "K118",
          "name": "이윤서",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S05"
        },
        {
          "id": "F08",
          "name": "하수펌프",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S08"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B025",
      "actors": [
        {
          "id": "K130",
          "name": "나효원",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K158",
          "name": "연태솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K182",
          "name": "차라온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K206",
          "name": "연은재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K231",
          "name": "봉용",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K256",
          "name": "봉두",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K281",
          "name": "봉국",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K146",
          "name": "오서율",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S06"
        },
        {
          "id": "K170",
          "name": "송이든",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S07"
        },
        {
          "id": "F09",
          "name": "실험클린",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S09"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B026",
      "actors": [
        {
          "id": "K306",
          "name": "국감",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K331",
          "name": "방미산",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K356",
          "name": "영한뫼",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K381",
          "name": "방석담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K405",
          "name": "천늘샘",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K018",
          "name": "허은찬",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K046",
          "name": "표예담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K194",
          "name": "서나연",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S08"
        },
        {
          "id": "K219",
          "name": "오하늘",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S09"
        },
        {
          "id": "F10",
          "name": "물류분류",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S10"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B027",
      "actors": [
        {
          "id": "K074",
          "name": "허미리",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K102",
          "name": "변오름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K131",
          "name": "양기석",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K159",
          "name": "나봄결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K183",
          "name": "설우찬",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K207",
          "name": "나루희",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K232",
          "name": "용소",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K244",
          "name": "윤초아",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S10"
        },
        {
          "id": "K269",
          "name": "권도하",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S11"
        },
        {
          "id": "F11",
          "name": "전력변압",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S11"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B028",
      "actors": [
        {
          "id": "K257",
          "name": "용두",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K282",
          "name": "용두봉",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K307",
          "name": "감모",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K332",
          "name": "수효은",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K357",
          "name": "판초담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K382",
          "name": "흥예나",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K406",
          "name": "근주하",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K294",
          "name": "하세온",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S12"
        },
        {
          "id": "K319",
          "name": "남호성",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S13"
        },
        {
          "id": "F12",
          "name": "환기덕트",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S12"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B029",
      "actors": [
        {
          "id": "K019",
          "name": "구하온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K047",
          "name": "명다해",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K075",
          "name": "구선율",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K103",
          "name": "표누리",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K132",
          "name": "주단아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K160",
          "name": "홍예준",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K184",
          "name": "단시온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K344",
          "name": "곽민재",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S14"
        },
        {
          "id": "K369",
          "name": "남시윤",
          "origin": "multicultural",
          "subgroup": "southeast-asian",
          "state_id": "S15"
        },
        {
          "id": "F13",
          "name": "의료멸균",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S13"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B030",
      "actors": [
        {
          "id": "K208",
          "name": "섭다은",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K233",
          "name": "란세온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K258",
          "name": "어하은",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K283",
          "name": "추지훈",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K308",
          "name": "탁미르",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K333",
          "name": "매하루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K358",
          "name": "매서담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K034",
          "name": "최다인",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S02"
        },
        {
          "id": "K062",
          "name": "유민호",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S03"
        },
        {
          "id": "F14",
          "name": "인쇄기동",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S14"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B031",
      "actors": [
        {
          "id": "K383",
          "name": "매리울",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K407",
          "name": "흥미리",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K020",
          "name": "진세빈",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K048",
          "name": "제문석",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K076",
          "name": "진마루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K104",
          "name": "명우솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K133",
          "name": "차윤목",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K090",
          "name": "이준택",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S04"
        },
        {
          "id": "K119",
          "name": "박하율",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S05"
        },
        {
          "id": "F15",
          "name": "급수계량",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S15"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B032",
      "actors": [
        {
          "id": "K161",
          "name": "추서윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K185",
          "name": "순가온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K209",
          "name": "평서아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K234",
          "name": "섭달호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K259",
          "name": "란민준",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K284",
          "name": "어예린",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K309",
          "name": "범온결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K147",
          "name": "서라온",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S06"
        },
        {
          "id": "K171",
          "name": "강다은",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S07"
        },
        {
          "id": "F16",
          "name": "터널환기",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S16"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B033",
      "actors": [
        {
          "id": "K334",
          "name": "탁은솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K359",
          "name": "탁윤재",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K384",
          "name": "탁필호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K408",
          "name": "매도한",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K021",
          "name": "채한솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K049",
          "name": "변주아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K077",
          "name": "채무진",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K195",
          "name": "오도윤",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S08"
        },
        {
          "id": "K220",
          "name": "조은우",
          "origin": "multicultural",
          "subgroup": "central-asian-koryoin",
          "state_id": "S09"
        },
        {
          "id": "V01",
          "name": "새벽호송",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S01"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B034",
      "actors": [
        {
          "id": "K105",
          "name": "제바름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K134",
          "name": "설봄이",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K162",
          "name": "어태산",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K186",
          "name": "홍재민",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K210",
          "name": "단노을",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K235",
          "name": "평지우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K260",
          "name": "섭서연",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K245",
          "name": "오한결",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S10"
        },
        {
          "id": "K270",
          "name": "황노을",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S11"
        },
        {
          "id": "V02",
          "name": "순환버스",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S02"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B035",
      "actors": [
        {
          "id": "K285",
          "name": "란진아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K310",
          "name": "창다흰",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K335",
          "name": "범초이",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K360",
          "name": "범한들",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K385",
          "name": "범채온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K409",
          "name": "탁세온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K022",
          "name": "고늘결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K295",
          "name": "곽태산",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S12"
        },
        {
          "id": "K320",
          "name": "전솔",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S13"
        },
        {
          "id": "V03",
          "name": "화물트램",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S03"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B036",
      "actors": [
        {
          "id": "K050",
          "name": "종마루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K078",
          "name": "우다온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K106",
          "name": "변석훈",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K135",
          "name": "우지호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K163",
          "name": "란지호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K187",
          "name": "추한결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K211",
          "name": "순재민",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K345",
          "name": "심가은",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S14"
        },
        {
          "id": "K370",
          "name": "문도윤",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S15"
        },
        {
          "id": "V04",
          "name": "구경로봇",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S04"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B037",
      "actors": [
        {
          "id": "K236",
          "name": "단보람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K261",
          "name": "평은우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K286",
          "name": "섭채원",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K311",
          "name": "초나루",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K336",
          "name": "창해온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K361",
          "name": "창지안",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K386",
          "name": "창고운",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K394",
          "name": "안태경",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S16"
        },
        {
          "id": "K007",
          "name": "장필규",
          "origin": "multicultural",
          "subgroup": "south-asian-me",
          "state_id": "S01"
        },
        {
          "id": "V05",
          "name": "레일견인",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S05"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B038",
      "actors": [
        {
          "id": "K410",
          "name": "범하겸",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K023",
          "name": "배초담",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K051",
          "name": "고모래",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K079",
          "name": "고초윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K107",
          "name": "종나솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K136",
          "name": "종하린",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K164",
          "name": "섭도윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K035",
          "name": "장우석",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S02"
        },
        {
          "id": "K063",
          "name": "박진솔",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S03"
        },
        {
          "id": "V06",
          "name": "배전트럭",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S06"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B039",
      "actors": [
        {
          "id": "K188",
          "name": "어지율",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K212",
          "name": "홍지훈",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K237",
          "name": "순한결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K262",
          "name": "단유진",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K287",
          "name": "평채원",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K312",
          "name": "석봄우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K337",
          "name": "석라온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K091",
          "name": "최나래",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S04"
        },
        {
          "id": "K120",
          "name": "최도윤",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S05"
        },
        {
          "id": "V07",
          "name": "청소차륜",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S07"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B040",
      "actors": [
        {
          "id": "K362",
          "name": "초태온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K387",
          "name": "초시람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K411",
          "name": "창은찬",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K024",
          "name": "류한뫼",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K052",
          "name": "배온결",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K080",
          "name": "배서율",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K108",
          "name": "고은하",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K148",
          "name": "지서윤",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S06"
        },
        {
          "id": "K172",
          "name": "양건우",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S07"
        },
        {
          "id": "V08",
          "name": "구급카트",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S08"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B041",
      "actors": [
        {
          "id": "K137",
          "name": "고재민",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K165",
          "name": "평예준",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S06"
        },
        {
          "id": "K189",
          "name": "란하율",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S07"
        },
        {
          "id": "K213",
          "name": "추보람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K238",
          "name": "홍우찬",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K263",
          "name": "순지민",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K288",
          "name": "단건우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K196",
          "name": "지윤재",
          "origin": "multicultural",
          "subgroup": "japanese-returnee",
          "state_id": "S08"
        },
        {
          "id": "K221",
          "name": "두봉",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S09"
        },
        {
          "id": "V09",
          "name": "항만크레인",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S09"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B042",
      "actors": [
        {
          "id": "K313",
          "name": "근솔이",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K338",
          "name": "근우람",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K363",
          "name": "석주아",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K388",
          "name": "석오름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "K412",
          "name": "초진솔",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S16"
        },
        {
          "id": "K025",
          "name": "엄새울",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K053",
          "name": "류겨레",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K246",
          "name": "두감",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S10"
        },
        {
          "id": "K271",
          "name": "두모",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S11"
        },
        {
          "id": "V10",
          "name": "도크셔틀",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S10"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B043",
      "actors": [
        {
          "id": "K081",
          "name": "류하늘",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K109",
          "name": "배나경",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K138",
          "name": "배은찬",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K214",
          "name": "어도윤",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S08"
        },
        {
          "id": "K239",
          "name": "추우찬",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S09"
        },
        {
          "id": "K264",
          "name": "홍은서",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S10"
        },
        {
          "id": "K289",
          "name": "순하준",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S11"
        },
        {
          "id": "K296",
          "name": "소두감",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S12"
        },
        {
          "id": "K321",
          "name": "천다움",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S13"
        },
        {
          "id": "V11",
          "name": "야간배차",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S11"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B044",
      "actors": [
        {
          "id": "K314",
          "name": "흥지완",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S12"
        },
        {
          "id": "K339",
          "name": "흥다온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "K364",
          "name": "근바름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S14"
        },
        {
          "id": "K026",
          "name": "여리안",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K054",
          "name": "엄누리",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K082",
          "name": "엄도한",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K110",
          "name": "류다인",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K346",
          "name": "선솔우",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S14"
        },
        {
          "id": "K371",
          "name": "천나솔",
          "origin": "multicultural",
          "subgroup": "western-african-other",
          "state_id": "S15"
        },
        {
          "id": "V12",
          "name": "중장비팔",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S12"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B045",
      "actors": [
        {
          "id": "K139",
          "name": "류가온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K027",
          "name": "기바름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K055",
          "name": "여시온",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K083",
          "name": "여다솜",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K111",
          "name": "엄미래",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K140",
          "name": "엄시완",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K395",
          "name": "수늘결",
          "origin": "multicultural",
          "subgroup": "stateless-refugee",
          "state_id": "S16"
        },
        {
          "id": "K008",
          "name": "임바다",
          "origin": "multicultural",
          "subgroup": "stateless-refugee",
          "state_id": "S01"
        },
        {
          "id": "V13",
          "name": "터널보선",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S13"
        },
        {
          "id": "V14",
          "name": "교량점검",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S14"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    },
    {
      "id": "B046",
      "actors": [
        {
          "id": "K028",
          "name": "우오름",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S01"
        },
        {
          "id": "K056",
          "name": "기필호",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S02"
        },
        {
          "id": "K084",
          "name": "기서진",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S03"
        },
        {
          "id": "K112",
          "name": "여민우",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K141",
          "name": "여서하",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S05"
        },
        {
          "id": "K113",
          "name": "기하겸",
          "origin": "korean-origin",
          "subgroup": null,
          "state_id": "S04"
        },
        {
          "id": "K036",
          "name": "임채원",
          "origin": "multicultural",
          "subgroup": "stateless-refugee",
          "state_id": "S02"
        },
        {
          "id": "K064",
          "name": "장예린",
          "origin": "multicultural",
          "subgroup": "stateless-refugee",
          "state_id": "S03"
        },
        {
          "id": "V15",
          "name": "수문카트",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S15"
        },
        {
          "id": "V16",
          "name": "비상견인",
          "origin": "synthetic",
          "subgroup": null,
          "state_id": "S16"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-Manifest.md"
      ]
    }
  ],
  "hostile_groups": [
    {
      "id": "G01",
      "display_name": "범람멧돼지군",
      "category": "animal-urban",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "홍수 후 도심 멧돼지 출몰과 쓰레기 경쟁",
      "fictional_origin": "붕괴 이후 S01·S06 회랑에서 범람멧돼지군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S01 핵심 서식, S06 계절 이동, XT01 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC01 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H01 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S01",
          "S06"
        ],
        "houses": [
          "HC01"
        ],
        "theaters": [
          "XT01"
        ],
        "synthetics": [
          "H01"
        ],
        "corporations_successor_only": [
          "HC01"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC01 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G01-SC1",
        "G01-SC2",
        "G01-SC3"
      ],
      "prose": "S01 가장자리에서 범람멧돼지군 무리가 홍수 후 도심 멧돼지 출몰과 쓰레기 경쟁의 흔적을 남긴다. HC01 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H01 센서는 오탐을 세 번 걸러 보고한다. XT01 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G02",
      "display_name": "전파까마귀떼",
      "category": "animal-urban",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "송신탑·전선 주변 군집과 신호 간섭 불안",
      "fictional_origin": "붕괴 이후 S02·S07 회랑에서 전파까마귀떼이 형성된 서울 창작 기원이다.",
      "territory_migration": "S02 핵심 서식, S07 계절 이동, XT02 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC02 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H02 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S02",
          "S07"
        ],
        "houses": [
          "HC02"
        ],
        "theaters": [
          "XT02"
        ],
        "synthetics": [
          "H02"
        ],
        "corporations_successor_only": [
          "HC02"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC02 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G02-SC1",
        "G02-SC2",
        "G02-SC3"
      ],
      "prose": "S02 가장자리에서 전파까마귀떼 무리가 송신탑·전선 주변 군집과 신호 간섭 불안의 흔적을 남긴다. HC02 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H02 센서는 오탐을 세 번 걸러 보고한다. XT02 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G03",
      "display_name": "유기견철군",
      "category": "animal-urban",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "유기·방치 개체의 무리지어 이동과 영역 표시",
      "fictional_origin": "붕괴 이후 S03·S08 회랑에서 유기견철군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S03 핵심 서식, S08 계절 이동, XT03 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC03 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H03 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S03",
          "S08"
        ],
        "houses": [
          "HC03"
        ],
        "theaters": [
          "XT03"
        ],
        "synthetics": [
          "H03"
        ],
        "corporations_successor_only": [
          "HC03"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC03 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G03-SC1",
        "G03-SC2",
        "G03-SC3"
      ],
      "prose": "S03 가장자리에서 유기견철군 무리가 유기·방치 개체의 무리지어 이동과 영역 표시의 흔적을 남긴다. HC03 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H03 센서는 오탐을 세 번 걸러 보고한다. XT03 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G04",
      "display_name": "하수너구리족",
      "category": "animal-urban",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "하수·지하 통로 점유와 야간 출몰",
      "fictional_origin": "붕괴 이후 S04·S09 회랑에서 하수너구리족이 형성된 서울 창작 기원이다.",
      "territory_migration": "S04 핵심 서식, S09 계절 이동, XT04 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC04 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H04 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S04",
          "S09"
        ],
        "houses": [
          "HC04"
        ],
        "theaters": [
          "XT04"
        ],
        "synthetics": [
          "H04"
        ],
        "corporations_successor_only": [
          "HC04"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC04 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G04-SC1",
        "G04-SC2",
        "G04-SC3"
      ],
      "prose": "S04 가장자리에서 하수너구리족 무리가 하수·지하 통로 점유와 야간 출몰의 흔적을 남긴다. HC04 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H04 센서는 오탐을 세 번 걸러 보고한다. XT04 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G05",
      "display_name": "환승쥐군락",
      "category": "animal-urban",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "환승 통로 먹이그물과 전염 공포",
      "fictional_origin": "붕괴 이후 S05·S10 회랑에서 환승쥐군락이 형성된 서울 창작 기원이다.",
      "territory_migration": "S05 핵심 서식, S10 계절 이동, XT05 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC05 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H05 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S05",
          "S10"
        ],
        "houses": [
          "HC05"
        ],
        "theaters": [
          "XT05"
        ],
        "synthetics": [
          "H05"
        ],
        "corporations_successor_only": [
          "HC05"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC05 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G05-SC1",
        "G05-SC2",
        "G05-SC3"
      ],
      "prose": "S05 가장자리에서 환승쥐군락 무리가 환승 통로 먹이그물과 전염 공포의 흔적을 남긴다. HC05 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H05 센서는 오탐을 세 번 걸러 보고한다. XT05 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G06",
      "display_name": "철새습지포식군",
      "category": "animal-urban",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "습지 복원 실패와 철새 경로 충돌",
      "fictional_origin": "붕괴 이후 S06·S11 회랑에서 철새습지포식군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S06 핵심 서식, S11 계절 이동, XT01 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC06 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H06 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S06",
          "S11"
        ],
        "houses": [
          "HC06"
        ],
        "theaters": [
          "XT01"
        ],
        "synthetics": [
          "H06"
        ],
        "corporations_successor_only": [
          "HC06"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC06 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G06-SC1",
        "G06-SC2",
        "G06-SC3"
      ],
      "prose": "S06 가장자리에서 철새습지포식군 무리가 습지 복원 실패와 철새 경로 충돌의 흔적을 남긴다. HC06 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H06 센서는 오탐을 세 번 걸러 보고한다. XT01 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G07",
      "display_name": "전해질화상군",
      "category": "humanoid-mutant",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "배터리 누액·전해질 화상 후유",
      "fictional_origin": "붕괴 이후 S07·S12 회랑에서 전해질화상군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S07 핵심 서식, S12 계절 이동, XT02 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC07 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H07 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S07",
          "S12"
        ],
        "houses": [
          "HC07"
        ],
        "theaters": [
          "XT02"
        ],
        "synthetics": [
          "H07"
        ],
        "corporations_successor_only": [
          "HC07"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC07 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G07-SC1",
        "G07-SC2",
        "G07-SC3"
      ],
      "prose": "S07 가장자리에서 전해질화상군 무리가 배터리 누액·전해질 화상 후유의 흔적을 남긴다. HC07 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H07 센서는 오탐을 세 번 걸러 보고한다. XT02 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G08",
      "display_name": "클린룸변이자",
      "category": "humanoid-mutant",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "밀폐 청정실 잔존 오염 노출",
      "fictional_origin": "붕괴 이후 S08·S13 회랑에서 클린룸변이자이 형성된 서울 창작 기원이다.",
      "territory_migration": "S08 핵심 서식, S13 계절 이동, XT03 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC08 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H08 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S08",
          "S13"
        ],
        "houses": [
          "HC08"
        ],
        "theaters": [
          "XT03"
        ],
        "synthetics": [
          "H08"
        ],
        "corporations_successor_only": [
          "HC08"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC08 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G08-SC1",
        "G08-SC2",
        "G08-SC3"
      ],
      "prose": "S08 가장자리에서 클린룸변이자 무리가 밀폐 청정실 잔존 오염 노출의 흔적을 남긴다. HC08 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H08 센서는 오탐을 세 번 걸러 보고한다. XT03 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G09",
      "display_name": "저온포자숙주",
      "category": "humanoid-mutant",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "저온 물류 포자·곰팡이 공생 불안",
      "fictional_origin": "붕괴 이후 S09·S14 회랑에서 저온포자숙주이 형성된 서울 창작 기원이다.",
      "territory_migration": "S09 핵심 서식, S14 계절 이동, XT04 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC09 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H09 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S09",
          "S14"
        ],
        "houses": [
          "HC09"
        ],
        "theaters": [
          "XT04"
        ],
        "synthetics": [
          "H09"
        ],
        "corporations_successor_only": [
          "HC09"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC09 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G09-SC1",
        "G09-SC2",
        "G09-SC3"
      ],
      "prose": "S09 가장자리에서 저온포자숙주 무리가 저온 물류 포자·곰팡이 공생 불안의 흔적을 남긴다. HC09 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H09 센서는 오탐을 세 번 걸러 보고한다. XT04 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G10",
      "display_name": "침수곰팡이호흡단",
      "category": "humanoid-mutant",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "침수 건물 호흡기 질환 잔영",
      "fictional_origin": "붕괴 이후 S10·S15 회랑에서 침수곰팡이호흡단이 형성된 서울 창작 기원이다.",
      "territory_migration": "S10 핵심 서식, S15 계절 이동, XT05 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC10 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H10 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S10",
          "S15"
        ],
        "houses": [
          "HC10"
        ],
        "theaters": [
          "XT05"
        ],
        "synthetics": [
          "H10"
        ],
        "corporations_successor_only": [
          "HC10"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC10 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G10-SC1",
        "G10-SC2",
        "G10-SC3"
      ],
      "prose": "S10 가장자리에서 침수곰팡이호흡단 무리가 침수 건물 호흡기 질환 잔영의 흔적을 남긴다. HC10 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H10 센서는 오탐을 세 번 걸러 보고한다. XT05 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G11",
      "display_name": "맞춤의료잔존체",
      "category": "humanoid-mutant",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "맞춤 치료 중단 후 잔여 장치",
      "fictional_origin": "붕괴 이후 S11·S16 회랑에서 맞춤의료잔존체이 형성된 서울 창작 기원이다.",
      "territory_migration": "S11 핵심 서식, S16 계절 이동, XT01 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC11 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H11 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S11",
          "S16"
        ],
        "houses": [
          "HC11"
        ],
        "theaters": [
          "XT01"
        ],
        "synthetics": [
          "H11"
        ],
        "corporations_successor_only": [
          "HC11"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC11 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G11-SC1",
        "G11-SC2",
        "G11-SC3"
      ],
      "prose": "S11 가장자리에서 맞춤의료잔존체 무리가 맞춤 치료 중단 후 잔여 장치의 흔적을 남긴다. HC11 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H11 센서는 오탐을 세 번 걸러 보고한다. XT01 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G12",
      "display_name": "미세섬유피부군",
      "category": "humanoid-mutant",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "산업 미세섬유·분진 피부 병변",
      "fictional_origin": "붕괴 이후 S12·S01 회랑에서 미세섬유피부군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S12 핵심 서식, S01 계절 이동, XT02 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC12 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H12 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S12",
          "S01"
        ],
        "houses": [
          "HC12"
        ],
        "theaters": [
          "XT02"
        ],
        "synthetics": [
          "H12"
        ],
        "corporations_successor_only": [
          "HC12"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC12 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G12-SC1",
        "G12-SC2",
        "G12-SC3"
      ],
      "prose": "S12 가장자리에서 미세섬유피부군 무리가 산업 미세섬유·분진 피부 병변의 흔적을 남긴다. HC12 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H12 센서는 오탐을 세 번 걸러 보고한다. XT02 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G13",
      "display_name": "야간분류군",
      "category": "rogue-robot",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "야간 물류 분류기 자율 폭주",
      "fictional_origin": "붕괴 이후 S13·S02 회랑에서 야간분류군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S13 핵심 서식, S02 계절 이동, XT03 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC13 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H13 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S13",
          "S02"
        ],
        "houses": [
          "HC13"
        ],
        "theaters": [
          "XT03"
        ],
        "synthetics": [
          "H13"
        ],
        "corporations_successor_only": [
          "HC13"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC13 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G13-SC1",
        "G13-SC2",
        "G13-SC3"
      ],
      "prose": "S13 가장자리에서 야간분류군 무리가 야간 물류 분류기 자율 폭주의 흔적을 남긴다. HC13 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H13 센서는 오탐을 세 번 걸러 보고한다. XT03 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G14",
      "display_name": "유령배차대",
      "category": "rogue-robot",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "무인 배차 스케줄 잔존 실행",
      "fictional_origin": "붕괴 이후 S14·S03 회랑에서 유령배차대이 형성된 서울 창작 기원이다.",
      "territory_migration": "S14 핵심 서식, S03 계절 이동, XT04 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HC14 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H14 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S14",
          "S03"
        ],
        "houses": [
          "HC14"
        ],
        "theaters": [
          "XT04"
        ],
        "synthetics": [
          "H14"
        ],
        "corporations_successor_only": [
          "HC14"
        ]
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HC14 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G14-SC1",
        "G14-SC2",
        "G14-SC3"
      ],
      "prose": "S14 가장자리에서 유령배차대 무리가 무인 배차 스케줄 잔존 실행의 흔적을 남긴다. HC14 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H14 센서는 오탐을 세 번 걸러 보고한다. XT04 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G15",
      "display_name": "돌봄순환체",
      "category": "rogue-robot",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "돌봄 루틴 고착과 과보호",
      "fictional_origin": "붕괴 이후 S15·S04 회랑에서 돌봄순환체이 형성된 서울 창작 기원이다.",
      "territory_migration": "S15 핵심 서식, S04 계절 이동, XT05 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP01 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H15 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S15",
          "S04"
        ],
        "houses": [
          "HP01"
        ],
        "theaters": [
          "XT05"
        ],
        "synthetics": [
          "H15"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP01 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G15-SC1",
        "G15-SC2",
        "G15-SC3"
      ],
      "prose": "S15 가장자리에서 돌봄순환체 무리가 돌봄 루틴 고착과 과보호의 흔적을 남긴다. HP01 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H15 센서는 오탐을 세 번 걸러 보고한다. XT05 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G16",
      "display_name": "도면유령기계단",
      "category": "rogue-robot",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "미완성 도면 기반 시공 로봇",
      "fictional_origin": "붕괴 이후 S16·S05 회랑에서 도면유령기계단이 형성된 서울 창작 기원이다.",
      "territory_migration": "S16 핵심 서식, S05 계절 이동, XT01 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP02 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 H16 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S16",
          "S05"
        ],
        "houses": [
          "HP02"
        ],
        "theaters": [
          "XT01"
        ],
        "synthetics": [
          "H16"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP02 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G16-SC1",
        "G16-SC2",
        "G16-SC3"
      ],
      "prose": "S16 가장자리에서 도면유령기계단 무리가 미완성 도면 기반 시공 로봇의 흔적을 남긴다. HP02 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, H16 센서는 오탐을 세 번 걸러 보고한다. XT01 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G17",
      "display_name": "감시궤도군",
      "category": "rogue-robot",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "궤도 감시 잔여 경보 오탐",
      "fictional_origin": "붕괴 이후 S01·S06 회랑에서 감시궤도군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S01 핵심 서식, S06 계절 이동, XT02 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP03 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F01 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S01",
          "S06"
        ],
        "houses": [
          "HP03"
        ],
        "theaters": [
          "XT02"
        ],
        "synthetics": [
          "F01"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP03 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G17-SC1",
        "G17-SC2",
        "G17-SC3"
      ],
      "prose": "S01 가장자리에서 감시궤도군 무리가 궤도 감시 잔여 경보 오탐의 흔적을 남긴다. HP03 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F01 센서는 오탐을 세 번 걸러 보고한다. XT02 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G18",
      "display_name": "폐선보수열차군",
      "category": "rogue-robot",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "폐선 자동 보수 열차 유령 운행",
      "fictional_origin": "붕괴 이후 S02·S07 회랑에서 폐선보수열차군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S02 핵심 서식, S07 계절 이동, XT03 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP04 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F02 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S02",
          "S07"
        ],
        "houses": [
          "HP04"
        ],
        "theaters": [
          "XT03"
        ],
        "synthetics": [
          "F02"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP04 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G18-SC1",
        "G18-SC2",
        "G18-SC3"
      ],
      "prose": "S02 가장자리에서 폐선보수열차군 무리가 폐선 자동 보수 열차 유령 운행의 흔적을 남긴다. HP04 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F02 센서는 오탐을 세 번 걸러 보고한다. XT03 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G19",
      "display_name": "냉각수색인균체",
      "category": "biomechanical",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "냉각수 배관 생물막·금속 부식 결합",
      "fictional_origin": "붕괴 이후 S03·S08 회랑에서 냉각수색인균체이 형성된 서울 창작 기원이다.",
      "territory_migration": "S03 핵심 서식, S08 계절 이동, XT04 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP05 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F03 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S03",
          "S08"
        ],
        "houses": [
          "HP05"
        ],
        "theaters": [
          "XT04"
        ],
        "synthetics": [
          "F03"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP05 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G19-SC1",
        "G19-SC2",
        "G19-SC3"
      ],
      "prose": "S03 가장자리에서 냉각수색인균체 무리가 냉각수 배관 생물막·금속 부식 결합의 흔적을 남긴다. HP05 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F03 센서는 오탐을 세 번 걸러 보고한다. XT04 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G20",
      "display_name": "철비늘군체",
      "category": "biomechanical",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "녹·비늘형 금속 군체 성장",
      "fictional_origin": "붕괴 이후 S04·S09 회랑에서 철비늘군체이 형성된 서울 창작 기원이다.",
      "territory_migration": "S04 핵심 서식, S09 계절 이동, XT05 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP06 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F04 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S04",
          "S09"
        ],
        "houses": [
          "HP06"
        ],
        "theaters": [
          "XT05"
        ],
        "synthetics": [
          "F04"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP06 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G20-SC1",
        "G20-SC2",
        "G20-SC3"
      ],
      "prose": "S04 가장자리에서 철비늘군체 무리가 녹·비늘형 금속 군체 성장의 흔적을 남긴다. HP06 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F04 센서는 오탐을 세 번 걸러 보고한다. XT05 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G21",
      "display_name": "통신근균체",
      "category": "biomechanical",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "광케이블·근균 유사 신호 기생",
      "fictional_origin": "붕괴 이후 S05·S10 회랑에서 통신근균체이 형성된 서울 창작 기원이다.",
      "territory_migration": "S05 핵심 서식, S10 계절 이동, XT01 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP07 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F05 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S05",
          "S10"
        ],
        "houses": [
          "HP07"
        ],
        "theaters": [
          "XT01"
        ],
        "synthetics": [
          "F05"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP07 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G21-SC1",
        "G21-SC2",
        "G21-SC3"
      ],
      "prose": "S05 가장자리에서 통신근균체 무리가 광케이블·근균 유사 신호 기생의 흔적을 남긴다. HP07 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F05 센서는 오탐을 세 번 걸러 보고한다. XT01 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G22",
      "display_name": "폐전지금속군락",
      "category": "biomechanical",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "폐전지 금속 석출 군락",
      "fictional_origin": "붕괴 이후 S06·S11 회랑에서 폐전지금속군락이 형성된 서울 창작 기원이다.",
      "territory_migration": "S06 핵심 서식, S11 계절 이동, XT02 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP08 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F06 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S06",
          "S11"
        ],
        "houses": [
          "HP08"
        ],
        "theaters": [
          "XT02"
        ],
        "synthetics": [
          "F06"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP08 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G22-SC1",
        "G22-SC2",
        "G22-SC3"
      ],
      "prose": "S06 가장자리에서 폐전지금속군락 무리가 폐전지 금속 석출 군락의 흔적을 남긴다. HP08 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F06 센서는 오탐을 세 번 걸러 보고한다. XT02 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G23",
      "display_name": "저온포자막",
      "category": "biomechanical",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "저온 창고 포자 막 형성",
      "fictional_origin": "붕괴 이후 S07·S12 회랑에서 저온포자막이 형성된 서울 창작 기원이다.",
      "territory_migration": "S07 핵심 서식, S12 계절 이동, XT03 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP09 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F07 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S07",
          "S12"
        ],
        "houses": [
          "HP09"
        ],
        "theaters": [
          "XT03"
        ],
        "synthetics": [
          "F07"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP09 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G23-SC1",
        "G23-SC2",
        "G23-SC3"
      ],
      "prose": "S07 가장자리에서 저온포자막 무리가 저온 창고 포자 막 형성의 흔적을 남긴다. HP09 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F07 센서는 오탐을 세 번 걸러 보고한다. XT03 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    },
    {
      "id": "G24",
      "display_name": "의료조직기계군",
      "category": "biomechanical",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Research-Sources.md#SRC-SEOUL-FICTION-BOUNDARY",
        "docs/game-logic/Sixteen-States.md"
      ],
      "revision": 1,
      "projection_targets": [
        "Hostile-Ecology-Index.md",
        "Monster-Batch-Manifest.md"
      ],
      "modern_anxiety": "의료 폐기 조직·기구 결합체",
      "fictional_origin": "붕괴 이후 S08·S13 회랑에서 의료조직기계군이 형성된 서울 창작 기원이다.",
      "territory_migration": "S08 핵심 서식, S13 계절 이동, XT04 외곽 압력에 반응한다.",
      "economy": "에너지·고철·유기물·냉각수 중 구역 잔여 자원을 순환하며 HP10 회수 작업과 경합한다.",
      "lifecycle": "출현-확산-정체-협상가능-와해 5단계. 복제는 자원 상한에 묶인다.",
      "senses": "진동·열·전자 잡음·냄새 중 둘 이상. 완전 투시 없음.",
      "hierarchy": "컨트롤러 1 + 무리 단위. 합성 F08 센서 로그와 충돌 시 인간 중재 우선.",
      "links": {
        "states": [
          "S08",
          "S13"
        ],
        "houses": [
          "HP10"
        ],
        "theaters": [
          "XT04"
        ],
        "synthetics": [
          "F08"
        ],
        "corporations_successor_only": []
      },
      "escalation": "1 경고 출몰 / 2 인프라 교란 / 3 거점 봉쇄. 3은 협상 창 닫힘 직전.",
      "combat_counterplay": "소음·냉각·봉인·먹이 우회·경로 차단. 학살 올인 금지 설계.",
      "negotiation": "HP10 중개로 자원 할당·통행 시간 거래 가능. 전멸 조건 없음.",
      "moral_cost": "무차별 제거는 시민 인프라와 공생 가능성을 함께 부순다.",
      "scenario_links": [
        "G24-SC1",
        "G24-SC2",
        "G24-SC3"
      ],
      "prose": "S08 가장자리에서 의료조직기계군 무리가 의료 폐기 조직·기구 결합체의 흔적을 남긴다. HP10 순찰은 총구보다 봉인 테이프를 먼저 꺼내고, F08 센서는 오탐을 세 번 걸러 보고한다. XT04 쪽에서 유입 신호가 와도 현 정권을 단죄하지 않고 이동 경로만 적는다. 협상 창이 열려 있는 한, 전멸 명령은 보류한다."
    }
  ],
  "monster_batches": [
    {
      "id": "M001",
      "entry_ids": [
        "G01E01",
        "G01E02",
        "G01E03",
        "G01E04",
        "G01E05",
        "G01E06",
        "G01E07",
        "G01E08",
        "G01E09",
        "G01E10"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M002",
      "entry_ids": [
        "G01E11",
        "G01E12",
        "G01E13",
        "G01E14",
        "G01E15",
        "G01E16",
        "G02E01",
        "G02E02",
        "G02E03",
        "G02E04"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M003",
      "entry_ids": [
        "G02E05",
        "G02E06",
        "G02E07",
        "G02E08",
        "G02E09",
        "G02E10",
        "G02E11",
        "G02E12",
        "G02E13",
        "G02E14"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M004",
      "entry_ids": [
        "G02E15",
        "G02E16",
        "G03E01",
        "G03E02",
        "G03E03",
        "G03E04",
        "G03E05",
        "G03E06",
        "G03E07",
        "G03E08"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M005",
      "entry_ids": [
        "G03E09",
        "G03E10",
        "G03E11",
        "G03E12",
        "G03E13",
        "G03E14",
        "G03E15",
        "G03E16",
        "G04E01",
        "G04E02"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M006",
      "entry_ids": [
        "G04E03",
        "G04E04",
        "G04E05",
        "G04E06",
        "G04E07",
        "G04E08",
        "G04E09",
        "G04E10",
        "G04E11",
        "G04E12"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M007",
      "entry_ids": [
        "G04E13",
        "G04E14",
        "G04E15",
        "G04E16",
        "G05E01",
        "G05E02",
        "G05E03",
        "G05E04",
        "G05E05",
        "G05E06"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M008",
      "entry_ids": [
        "G05E07",
        "G05E08",
        "G05E09",
        "G05E10",
        "G05E11",
        "G05E12",
        "G05E13",
        "G05E14",
        "G05E15",
        "G05E16"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M009",
      "entry_ids": [
        "G06E01",
        "G06E02",
        "G06E03",
        "G06E04",
        "G06E05",
        "G06E06",
        "G06E07",
        "G06E08",
        "G06E09",
        "G06E10"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M010",
      "entry_ids": [
        "G06E11",
        "G06E12",
        "G06E13",
        "G06E14",
        "G06E15",
        "G06E16",
        "G07E01",
        "G07E02",
        "G07E03",
        "G07E04"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M011",
      "entry_ids": [
        "G07E05",
        "G07E06",
        "G07E07",
        "G07E08",
        "G07E09",
        "G07E10",
        "G07E11",
        "G07E12",
        "G07E13",
        "G07E14"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M012",
      "entry_ids": [
        "G07E15",
        "G07E16",
        "G08E01",
        "G08E02",
        "G08E03",
        "G08E04",
        "G08E05",
        "G08E06",
        "G08E07",
        "G08E08"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M013",
      "entry_ids": [
        "G08E09",
        "G08E10",
        "G08E11",
        "G08E12",
        "G08E13",
        "G08E14",
        "G08E15",
        "G08E16",
        "G09E01",
        "G09E02"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M014",
      "entry_ids": [
        "G09E03",
        "G09E04",
        "G09E05",
        "G09E06",
        "G09E07",
        "G09E08",
        "G09E09",
        "G09E10",
        "G09E11",
        "G09E12"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M015",
      "entry_ids": [
        "G09E13",
        "G09E14",
        "G09E15",
        "G09E16",
        "G10E01",
        "G10E02",
        "G10E03",
        "G10E04",
        "G10E05",
        "G10E06"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M016",
      "entry_ids": [
        "G10E07",
        "G10E08",
        "G10E09",
        "G10E10",
        "G10E11",
        "G10E12",
        "G10E13",
        "G10E14",
        "G10E15",
        "G10E16"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M017",
      "entry_ids": [
        "G11E01",
        "G11E02",
        "G11E03",
        "G11E04",
        "G11E05",
        "G11E06",
        "G11E07",
        "G11E08",
        "G11E09",
        "G11E10"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M018",
      "entry_ids": [
        "G11E11",
        "G11E12",
        "G11E13",
        "G11E14",
        "G11E15",
        "G11E16",
        "G12E01",
        "G12E02",
        "G12E03",
        "G12E04"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M019",
      "entry_ids": [
        "G12E05",
        "G12E06",
        "G12E07",
        "G12E08",
        "G12E09",
        "G12E10",
        "G12E11",
        "G12E12",
        "G12E13",
        "G12E14"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M020",
      "entry_ids": [
        "G12E15",
        "G12E16",
        "G13E01",
        "G13E02",
        "G13E03",
        "G13E04",
        "G13E05",
        "G13E06",
        "G13E07",
        "G13E08"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M021",
      "entry_ids": [
        "G13E09",
        "G13E10",
        "G13E11",
        "G13E12",
        "G13E13",
        "G13E14",
        "G13E15",
        "G13E16",
        "G14E01",
        "G14E02"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M022",
      "entry_ids": [
        "G14E03",
        "G14E04",
        "G14E05",
        "G14E06",
        "G14E07",
        "G14E08",
        "G14E09",
        "G14E10",
        "G14E11",
        "G14E12"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M023",
      "entry_ids": [
        "G14E13",
        "G14E14",
        "G14E15",
        "G14E16",
        "G15E01",
        "G15E02",
        "G15E03",
        "G15E04",
        "G15E05",
        "G15E06"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M024",
      "entry_ids": [
        "G15E07",
        "G15E08",
        "G15E09",
        "G15E10",
        "G15E11",
        "G15E12",
        "G15E13",
        "G15E14",
        "G15E15",
        "G15E16"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M025",
      "entry_ids": [
        "G16E01",
        "G16E02",
        "G16E03",
        "G16E04",
        "G16E05",
        "G16E06",
        "G16E07",
        "G16E08",
        "G16E09",
        "G16E10"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M026",
      "entry_ids": [
        "G16E11",
        "G16E12",
        "G16E13",
        "G16E14",
        "G16E15",
        "G16E16",
        "G17E01",
        "G17E02",
        "G17E03",
        "G17E04"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M027",
      "entry_ids": [
        "G17E05",
        "G17E06",
        "G17E07",
        "G17E08",
        "G17E09",
        "G17E10",
        "G17E11",
        "G17E12",
        "G17E13",
        "G17E14"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M028",
      "entry_ids": [
        "G17E15",
        "G17E16",
        "G18E01",
        "G18E02",
        "G18E03",
        "G18E04",
        "G18E05",
        "G18E06",
        "G18E07",
        "G18E08"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M029",
      "entry_ids": [
        "G18E09",
        "G18E10",
        "G18E11",
        "G18E12",
        "G18E13",
        "G18E14",
        "G18E15",
        "G18E16",
        "G19E01",
        "G19E02"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M030",
      "entry_ids": [
        "G19E03",
        "G19E04",
        "G19E05",
        "G19E06",
        "G19E07",
        "G19E08",
        "G19E09",
        "G19E10",
        "G19E11",
        "G19E12"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M031",
      "entry_ids": [
        "G19E13",
        "G19E14",
        "G19E15",
        "G19E16",
        "G20E01",
        "G20E02",
        "G20E03",
        "G20E04",
        "G20E05",
        "G20E06"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M032",
      "entry_ids": [
        "G20E07",
        "G20E08",
        "G20E09",
        "G20E10",
        "G20E11",
        "G20E12",
        "G20E13",
        "G20E14",
        "G20E15",
        "G20E16"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M033",
      "entry_ids": [
        "G21E01",
        "G21E02",
        "G21E03",
        "G21E04",
        "G21E05",
        "G21E06",
        "G21E07",
        "G21E08",
        "G21E09",
        "G21E10"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M034",
      "entry_ids": [
        "G21E11",
        "G21E12",
        "G21E13",
        "G21E14",
        "G21E15",
        "G21E16",
        "G22E01",
        "G22E02",
        "G22E03",
        "G22E04"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M035",
      "entry_ids": [
        "G22E05",
        "G22E06",
        "G22E07",
        "G22E08",
        "G22E09",
        "G22E10",
        "G22E11",
        "G22E12",
        "G22E13",
        "G22E14"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M036",
      "entry_ids": [
        "G22E15",
        "G22E16",
        "G23E01",
        "G23E02",
        "G23E03",
        "G23E04",
        "G23E05",
        "G23E06",
        "G23E07",
        "G23E08"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M037",
      "entry_ids": [
        "G23E09",
        "G23E10",
        "G23E11",
        "G23E12",
        "G23E13",
        "G23E14",
        "G23E15",
        "G23E16",
        "G24E01",
        "G24E02"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M038",
      "entry_ids": [
        "G24E03",
        "G24E04",
        "G24E05",
        "G24E06",
        "G24E07",
        "G24E08",
        "G24E09",
        "G24E10",
        "G24E11",
        "G24E12"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    },
    {
      "id": "M039",
      "entry_ids": [
        "G24E13",
        "G24E14",
        "G24E15",
        "G24E16"
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Monster-Batch-Manifest.md"
      ]
    }
  ],
  "arcs": [
    {
      "id": "ARC-H-HC01",
      "title": "HC01 운영 연속성",
      "house_ids": [
        "HC01"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC01 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC01 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC01 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC02",
      "title": "HC02 운영 연속성",
      "house_ids": [
        "HC02"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC02 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC02 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC02 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC03",
      "title": "HC03 운영 연속성",
      "house_ids": [
        "HC03"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC03 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC03 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC03 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC04",
      "title": "HC04 운영 연속성",
      "house_ids": [
        "HC04"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC04 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC04 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC04 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC05",
      "title": "HC05 운영 연속성",
      "house_ids": [
        "HC05"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC05 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC05 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC05 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC06",
      "title": "HC06 운영 연속성",
      "house_ids": [
        "HC06"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC06 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC06 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC06 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC07",
      "title": "HC07 운영 연속성",
      "house_ids": [
        "HC07"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC07 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC07 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC07 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC08",
      "title": "HC08 운영 연속성",
      "house_ids": [
        "HC08"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC08 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC08 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC08 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC09",
      "title": "HC09 운영 연속성",
      "house_ids": [
        "HC09"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC09 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC09 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC09 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC10",
      "title": "HC10 운영 연속성",
      "house_ids": [
        "HC10"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC10 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC10 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC10 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC11",
      "title": "HC11 운영 연속성",
      "house_ids": [
        "HC11"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC11 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC11 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC11 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC12",
      "title": "HC12 운영 연속성",
      "house_ids": [
        "HC12"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC12 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC12 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC12 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC13",
      "title": "HC13 운영 연속성",
      "house_ids": [
        "HC13"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC13 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC13 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC13 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HC14",
      "title": "HC14 운영 연속성",
      "house_ids": [
        "HC14"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HC14 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HC14 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HC14 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP01",
      "title": "HP01 운영 연속성",
      "house_ids": [
        "HP01"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP01 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP01 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP01 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP02",
      "title": "HP02 운영 연속성",
      "house_ids": [
        "HP02"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP02 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP02 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP02 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP03",
      "title": "HP03 운영 연속성",
      "house_ids": [
        "HP03"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP03 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP03 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP03 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP04",
      "title": "HP04 운영 연속성",
      "house_ids": [
        "HP04"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP04 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP04 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP04 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP05",
      "title": "HP05 운영 연속성",
      "house_ids": [
        "HP05"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP05 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP05 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP05 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP06",
      "title": "HP06 운영 연속성",
      "house_ids": [
        "HP06"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP06 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP06 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP06 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP07",
      "title": "HP07 운영 연속성",
      "house_ids": [
        "HP07"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP07 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP07 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP07 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP08",
      "title": "HP08 운영 연속성",
      "house_ids": [
        "HP08"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP08 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP08 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP08 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP09",
      "title": "HP09 운영 연속성",
      "house_ids": [
        "HP09"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP09 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP09 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP09 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-H-HP10",
      "title": "HP10 운영 연속성",
      "house_ids": [
        "HP10"
      ],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "HP10 핵심 의무가 자원 부족으로 흔들린다"
        },
        {
          "act": 2,
          "summary": "HP10 이사회가 시민 참관 아래 재배분을 협상한다"
        },
        {
          "act": 3,
          "summary": "HP10 대가 지불 후 최소 연속성만 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-T-XT01",
      "title": "XT01 회랑 압력",
      "house_ids": [],
      "theater_ids": [
        "XT01"
      ],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "XT01 입구에서 검역·물자 큐가 막힌다"
        },
        {
          "act": 2,
          "summary": "XT01 연결 16국 대표가 공동 점검을 연다"
        },
        {
          "act": 3,
          "summary": "XT01 우회 경로 대가와 기록 보존을 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-T-XT02",
      "title": "XT02 회랑 압력",
      "house_ids": [],
      "theater_ids": [
        "XT02"
      ],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "XT02 입구에서 검역·물자 큐가 막힌다"
        },
        {
          "act": 2,
          "summary": "XT02 연결 16국 대표가 공동 점검을 연다"
        },
        {
          "act": 3,
          "summary": "XT02 우회 경로 대가와 기록 보존을 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-T-XT03",
      "title": "XT03 회랑 압력",
      "house_ids": [],
      "theater_ids": [
        "XT03"
      ],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "XT03 입구에서 검역·물자 큐가 막힌다"
        },
        {
          "act": 2,
          "summary": "XT03 연결 16국 대표가 공동 점검을 연다"
        },
        {
          "act": 3,
          "summary": "XT03 우회 경로 대가와 기록 보존을 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-T-XT04",
      "title": "XT04 회랑 압력",
      "house_ids": [],
      "theater_ids": [
        "XT04"
      ],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "XT04 입구에서 검역·물자 큐가 막힌다"
        },
        {
          "act": 2,
          "summary": "XT04 연결 16국 대표가 공동 점검을 연다"
        },
        {
          "act": 3,
          "summary": "XT04 우회 경로 대가와 기록 보존을 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-T-XT05",
      "title": "XT05 회랑 압력",
      "house_ids": [],
      "theater_ids": [
        "XT05"
      ],
      "synthetic_classes": [],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "XT05 입구에서 검역·물자 큐가 막힌다"
        },
        {
          "act": 2,
          "summary": "XT05 연결 16국 대표가 공동 점검을 연다"
        },
        {
          "act": 3,
          "summary": "XT05 우회 경로 대가와 기록 보존을 남긴다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-S-H",
      "title": "인간형 합성 보관 한계",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [
        "H"
      ],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "H급 배터리·기억 포크가 동시에 한계에 닿는다"
        },
        {
          "act": 2,
          "summary": "보관 가문과 담당 인간이 부분 재연결을 협상한다"
        },
        {
          "act": 3,
          "summary": "일탈 격리를 남기고 구역 권한만 복구한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-S-F",
      "title": "시설형 합성 보관 한계",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [
        "F"
      ],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "F급 배터리·기억 포크가 동시에 한계에 닿는다"
        },
        {
          "act": 2,
          "summary": "보관 가문과 담당 인간이 부분 재연결을 협상한다"
        },
        {
          "act": 3,
          "summary": "일탈 격리를 남기고 구역 권한만 복구한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-S-V",
      "title": "기동형 합성 보관 한계",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [
        "V"
      ],
      "group_ids": [],
      "acts": [
        {
          "act": 1,
          "summary": "V급 배터리·기억 포크가 동시에 한계에 닿는다"
        },
        {
          "act": 2,
          "summary": "보관 가문과 담당 인간이 부분 재연결을 협상한다"
        },
        {
          "act": 3,
          "summary": "일탈 격리를 남기고 구역 권한만 복구한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G01",
      "title": "G01 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G01"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G01 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G01 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G01 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G02",
      "title": "G02 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G02"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G02 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G02 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G02 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G03",
      "title": "G03 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G03"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G03 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G03 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G03 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G04",
      "title": "G04 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G04"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G04 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G04 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G04 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G05",
      "title": "G05 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G05"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G05 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G05 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G05 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G06",
      "title": "G06 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G06"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G06 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G06 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G06 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G07",
      "title": "G07 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G07"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G07 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G07 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G07 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G08",
      "title": "G08 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G08"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G08 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G08 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G08 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G09",
      "title": "G09 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G09"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G09 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G09 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G09 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G10",
      "title": "G10 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G10"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G10 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G10 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G10 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G11",
      "title": "G11 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G11"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G11 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G11 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G11 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G12",
      "title": "G12 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G12"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G12 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G12 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G12 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G13",
      "title": "G13 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G13"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G13 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G13 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G13 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G14",
      "title": "G14 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G14"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G14 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G14 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G14 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G15",
      "title": "G15 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G15"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G15 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G15 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G15 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G16",
      "title": "G16 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G16"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G16 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G16 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G16 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G17",
      "title": "G17 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G17"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G17 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G17 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G17 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G18",
      "title": "G18 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G18"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G18 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G18 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G18 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G19",
      "title": "G19 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G19"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G19 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G19 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G19 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G20",
      "title": "G20 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G20"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G20 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G20 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G20 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G21",
      "title": "G21 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G21"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G21 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G21 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G21 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G22",
      "title": "G22 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G22"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G22 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G22 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G22 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G23",
      "title": "G23 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G23"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G23 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G23 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G23 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    },
    {
      "id": "ARC-G-G24",
      "title": "G24 생태 교섭",
      "house_ids": [],
      "theater_ids": [],
      "synthetic_classes": [],
      "group_ids": [
        "G24"
      ],
      "acts": [
        {
          "act": 1,
          "summary": "G24 1단계 출몰이 인프라를 스친다"
        },
        {
          "act": 2,
          "summary": "G24 2단계 교란에서 자원 거래 창이 열린다"
        },
        {
          "act": 3,
          "summary": "G24 3단계 직전 공존 조건을 남기거나 봉쇄한다"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ]
    }
  ],
  "relations": [
    {
      "from": "HC01",
      "kind": "operates_in",
      "to": "S01",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC02",
      "kind": "operates_in",
      "to": "S02",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC03",
      "kind": "operates_in",
      "to": "S03",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC04",
      "kind": "operates_in",
      "to": "S04",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC05",
      "kind": "operates_in",
      "to": "S05",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC06",
      "kind": "operates_in",
      "to": "S06",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC07",
      "kind": "operates_in",
      "to": "S07",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC08",
      "kind": "operates_in",
      "to": "S08",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC09",
      "kind": "operates_in",
      "to": "S09",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC10",
      "kind": "operates_in",
      "to": "S10",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC11",
      "kind": "operates_in",
      "to": "S11",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC12",
      "kind": "operates_in",
      "to": "S12",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC13",
      "kind": "operates_in",
      "to": "S13",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HC14",
      "kind": "operates_in",
      "to": "S14",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HP01",
      "kind": "operates_in",
      "to": "S15",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "HP02",
      "kind": "operates_in",
      "to": "S16",
      "reason": "가문-국가 운영 연결"
    },
    {
      "from": "XT01",
      "kind": "pressures",
      "to": "S01",
      "reason": "전구-국가 압력"
    },
    {
      "from": "XT02",
      "kind": "pressures",
      "to": "S04",
      "reason": "전구-국가 압력"
    },
    {
      "from": "XT03",
      "kind": "pressures",
      "to": "S07",
      "reason": "전구-국가 압력"
    },
    {
      "from": "XT04",
      "kind": "pressures",
      "to": "S10",
      "reason": "전구-국가 압력"
    },
    {
      "from": "XT05",
      "kind": "pressures",
      "to": "S13",
      "reason": "전구-국가 압력"
    },
    {
      "from": "H01",
      "kind": "custodied_by",
      "to": "K001",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H02",
      "kind": "custodied_by",
      "to": "K029",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H03",
      "kind": "custodied_by",
      "to": "K057",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H04",
      "kind": "custodied_by",
      "to": "K085",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H05",
      "kind": "custodied_by",
      "to": "K114",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H06",
      "kind": "custodied_by",
      "to": "K142",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H07",
      "kind": "custodied_by",
      "to": "K166",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H08",
      "kind": "custodied_by",
      "to": "K190",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H09",
      "kind": "custodied_by",
      "to": "K215",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H10",
      "kind": "custodied_by",
      "to": "K240",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H11",
      "kind": "custodied_by",
      "to": "K265",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H12",
      "kind": "custodied_by",
      "to": "K290",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H13",
      "kind": "custodied_by",
      "to": "K315",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H14",
      "kind": "custodied_by",
      "to": "K340",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H15",
      "kind": "custodied_by",
      "to": "K365",
      "reason": "합성-인간 보관"
    },
    {
      "from": "H16",
      "kind": "custodied_by",
      "to": "K389",
      "reason": "합성-인간 보관"
    }
  ],
  "change_ledger": [
    {
      "id": "CL-0004",
      "summary": "운영가문 24개를 총람에 등록하고 투영한다",
      "owner": "wiki-world"
    },
    {
      "id": "CL-0005",
      "summary": "외부전구 5개를 총람에 등록하고 투영한다",
      "owner": "wiki-world"
    },
    {
      "id": "CL-0006",
      "summary": "합성 사회 인격 48명을 총람에 등록하고 투영한다",
      "owner": "wiki-world"
    },
    {
      "id": "CL-0007",
      "summary": "사회 서사 배치 B001-B046 원장을 잠근다",
      "owner": "wiki-world"
    },
    {
      "id": "CL-0008",
      "summary": "적대 생태 24군과 몬스터 배치 M001-M039를 잠근다",
      "owner": "wiki-world"
    },
    {
      "id": "CL-0009",
      "summary": "가문·전구·합성·생태 서사선 씨앗을 등록한다",
      "owner": "wiki-world"
    }
  ]
}
```
