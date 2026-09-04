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
| 개정 | r10 |
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

B001 산문은 기계 등록부 `story_contents.B001`이 정본이며 `Story-Batch-B001.md`는 투영물입니다.

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
    "revision": "r10",
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
      "World-Expansion-Index.md",
      "Story-Batch-B001.md"
    ],
    "change_ledger_entry": "CL-0010",
    "verification_state": "story-B001-authored"
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
    },
    {
      "id": "CL-0010",
      "summary": "사회 서사 배치 B001 10인 산문을 총람에 등록하고 투영한다",
      "owner": "wiki-world"
    }
  ],
  "story_contents": {
    "B001": {
      "id": "B001",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K092",
          "name": "정가온",
          "links": {
            "house": "HC04",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B001-K092"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "뚝섬 공방 2층 서고에서 정가온은 잉크가 마른 날짜란만 먼저 훑는다. 그는 뚝도공방연합의 공방평의회 기록감사로, 구두로 떠도는 유언을 진본 취급하는 동료를 위조범의 이웃이라 부른다. 한국 기원으로 서울 생활권에서 자랐고, 성정은 차갑게 보이지만 손끝은 항상 봉인 끈을 매만진다. 표시 이름 정가온과 불변 식별자 K092는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 총관 유언 세 장과 정비일지를 같은 원장에 나란히 올리는 습관을 만들었다. 기록청 인준이 늦어도 공방 평의회가 해석의 주체가 되게 하려는 야망이었다. 밤마다 서고 창틀에 남겨 둔 연필 자국은 가족에게 돌아가겠다는 작은 약속이었고, 그 약속이 훗날 빚의 원형이 된다. 동료들은 그 야망을 고집으로 불렀지만 정가온은 날짜가 틀린 사본을 불태우지 않고 별도 함에 가뒀다.",
            "가문·기업·공동체": "통맥에너지연합(HC04) 의무권은 정가온의 날인 칸을 빌려 쓰려 했으나, 그는 실재 회사 상호를 본문에 올리지 않는 후계 헌장만 인정했다. 교대 서명이 없는 감사 명단은 평의회 벽에 붙이지 않았고, HC04 참관인은 정기 등재만 요구할 수 있었다. 공동체 위치는 자격증이 아니라 봉인 사본을 양쪽에 동시에 보낸 기록으로 증명됐다. 가문 창구가 단독 해석 방송을 내밀면 그는 날인 없음을 이유로 무효를 선언했다.",
            "붕괴의 상처": "붕괴 날 서로 다른 세 유언이 같은 시각에 접수됐다. 정가온은 평의회 금고를 잠그고 문가람의 음성기록이 도착할 때까지 날인을 보류했다. 공포의 핵은 위조 유언 한 장이 진본으로 확정되어 감사 직위가 후계 전쟁의 도구로 팔리는 장면이었다. 경보음이 끊긴 뒤에도 그는 LOSS 목록의 마지막 줄을 읽지 못한 채 장갑을 벗지 않았다.",
            "생존 전환점": "전환점은 금고 열쇠를 기록청 호송조에 넘길지, 위조 날인 용의자를 먼저 붙잡을지 고른 순간이다. 해협삼로전구(XT03)에서 들어온 봉인 요청이 평의회 책상에 겹치자 계산이 달라졌다. 봉인 사본을 끝까지 호송하면 공방의 해석권은 살아남지만 야간 교대 인원이 빠지고, 용의자를 우선하면 한쪽 가문이 해석을 독점한다. 그 선택은 K092-TURN으로 남고, 되돌리면 뚝도 일부 작업반이 멈춘다.",
            "현재 지위": "지금도 정가온은 뚝도공방연합 기록감사로 점호와 원장 큐를 지킨다. 지위는 세습이 아니라 면허·서명·참관 로그로만 유지된다. 통맥에너지연합이 전속 국가 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 서고 문은 두 열쇠 체계로 바뀌었고 한 자루는 평의회, 다른 한 자루는 기록청 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 날짜가 틀린 사본 묶음이다. 죄책감은 살린 교대 명단과 그 밤에 호출하지 못한 견습 한 명의 이름 사이에서만 자란다. 전부를 공개하면 뚝도 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 참관 두 명의 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "윤서린에게 넘긴 유언 사본은 계약이었고, 한소미의 공동통치안 문구를 다듬은 밤은 동맹이었다. 박세린의 가문 원장과는 같은 문장에 다른 날짜를 읽어 내는 해석 경쟁이 남았다. 어느 관계도 배신만으로 끝나지 않았고, 같은 봉인함 앞에서 구원이 동시에 열린 적도 있다. 기존 관계 원장의 끝점은 보존된 채 STORY-B001-K092에 연결된다.",
            "3막 개인 서사선": "1막에서 정가온은 세 유언의 동시 접수를 정면으로 다시 만난다. 2막에서 그는 HC04 의무권과 XT03 봉인 요청을 한 책상에서 저울질한다. 3막에서 날인 보류의 대가를 공방 작업반의 중단 시간으로 치른다. 서사선 식별자는 STORY-B001-K092로 고정된다.",
            "분기 결말": "결말 α에서 정가온은 봉인 사본 호송을 우선해 공공 해석의 연속성을 고른다. 결말 β에서 그는 위조 용의자 추적을 우선해 개인 생존과 비밀 함을 지킨다. 어느 쪽도 뚝도공방연합의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K092-OUT으로 갈라진다. 플레이 개입은 호송 호위 또는 위조 추적 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 유언 동시 접수에 금고를 잠근다"
            },
            {
              "act": 2,
              "summary": "HC04 의무와 XT03 봉인 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "날인 보류의 대가로 작업반 중단을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K092-OUT-A",
              "summary": "봉인 사본 호송으로 공공 해석 연속"
            },
            {
              "id": "K092-OUT-B",
              "summary": "위조 추적 우선으로 비밀 함 유지"
            }
          ]
        },
        {
          "id": "K121",
          "name": "임겨레",
          "links": {
            "house": "HC04",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B001-K121"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "암사 나루 세관 창구에서 임겨레는 종료 일자가 빈 보호계약서를 보면 목소리부터 낮춘다. 동부 관문세·보호계약 감사관으로서 기간 없는 보호를 점령의 다른 이름이라 부른다. 한국 기원으로 자랐고, 성정은 차갑지만 전표 모서리를 접어 기한을 표시하는 손버릇이 있다. 이름 임겨레와 식별자 K121는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 약소국 보호계약에 감사권·기한·인질 대체 보증을 한 줄씩 넣었다. 상수보호권이 쿠데타로 읽히지 않게 하려는 야망이었고, 초안은 늘 세관 뒷방 칠판에 먼저 적혔다. 동생에게 보내던 짧은 전갈—기한 없는 약속은 하지 말라—가 훗날 빚의 씨앗이 된다. 장교들이 비상도장을 만지작거려도 그는 기한란이 채워지기 전엔 도장을 내주지 않았다.",
            "가문·기업·공동체": "HC04 통맥에너지연합은 관문 전력 의무를 내세워 감사 창구에 자리를 요구했다. 임겨레는 후계 헌장의 참관 칸만 열어 주고 전속 소유 문장은 거절했다. 공동체 안에서의 위치는 기한 만료 전표를 벽에 붙인 횟수로 증명됐고, 행정과 호위단이 동시에 사본을 받은 날만 통행이 열렸다. 가문 로고나 실재 상호는 그의 원장에 등장하지 않는다.",
            "붕괴의 상처": "세 강국의 급수·보호계약이 같은 아침 동부 약소국 책상에 떨어졌다. 임겨레는 암사 보호계약의 기한 조항을 창구 앞에서 소리 내어 읽고 날인을 보류했다. 공포는 위조 관문세 전표 한 장이 행정 원장 전체를 장교 비상도장으로 덮는 그림이었다. 경보가 꺼진 뒤 LOSS 목록의 중간 줄에서 그의 펜이 멈췄다.",
            "생존 전환점": "전환점은 기한 조항 초안을 약소국 회의에 직접 들고 갈지, 위조 전표 발급 경로를 먼저 열어 보일지 고른 순간이다. 두만극동전구(XT04) 쪽 전갈이 암사 창구에 겹치자 그는 통행 봉쇄 시계를 두 시간 앞당겼다. 초안을 운반하면 약소국 연대가 살아나고, 발급자를 밝히면 감사관 자신까지 실각 위험에 오른다. 결정은 K121-TURN에 남는다.",
            "현재 지위": "현재 임겨레는 암사고덕상수단 감사관으로 관문 점호와 전표 큐를 지킨다. 면허와 참관 로그가 지위를 유지하며, 통맥 쪽 전속 요구는 매번 반려한다. 창구 유리에는 오늘 만료되는 전표 목록만 분필로 남긴다. Cast 프로필의 동부 감사 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 동생 전갈을 숨긴 채 보류한 기한 공란 한 줄이다. 죄책감은 살린 통행 행렬과, 그 때문에 하루 늦게 도착한 약품 상자 사이에서 자란다. 완전 고백 대신 재심 창구를 통한 부분 공개만 허용한다. SECRET 열람은 정소율의 재심 전표와 동시에만 열린다.",
            "관계 공동과거": "정유라의 손실보상 문장을 동부 계약에 끌어들인 밤은 동맹이었고, 정소율의 재심 전표를 검증한 아침은 계약이었다. 김우찬의 기간 없는 작전표와는 창구 앞에서 목소리를 높인 경쟁이 남았다. 같은 나루에서 한 사람은 통행을 얻었고 다른 한 사람은 도장을 잃었다. 관계 원장 끝점은 STORY-B001-K121로 이어진다.",
            "3막 개인 서사선": "1막에서 임겨레는 상충 계약을 창구 낭독으로 맞받는다. 2막에서 HC04 참관과 XT04 전갈을 기한 시계에 묶는다. 3막에서 날인 보류가 부른 실각 위협과 약소국 연대 중 하나를 대가로 치른다. 서사선은 STORY-B001-K121이다.",
            "분기 결말": "결말 α에서 임겨레는 기한 초안 운반을 택해 공공 통행의 연속을 지킨다. 결말 β에서 위조 전표 경로를 공개해 개인 생존과 감사 직의 명예를 맞바꾼다. 암사고덕상수단 슬롯은 유지되며 분기만 K121-OUT으로 갈라진다. 개입은 회의 호위 또는 전표 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "상충 보호계약을 창구에서 낭독하고 날인을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC04 참관과 XT04 전갈을 기한 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "실각 위협과 약소국 연대 중 하나의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K121-OUT-A",
              "summary": "기한 초안 운반으로 공공 통행 연속"
            },
            {
              "id": "K121-OUT-B",
              "summary": "위조 전표 공개로 직과 생존 맞교환"
            }
          ]
        },
        {
          "id": "K149",
          "name": "마도한",
          "links": {
            "house": "HC05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B001-K149"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "도성 대합실 저울 앞에서 마도한은 인장이 채 마르지 않은 사본을 보면 상자를 선석에 올리지 않는다. 도성기록청 공증사본 물류상으로, 상자 무게가 장부와 다르면 저울추를 즉시 갈아 끼운다. 한국 기원이며 흥정은 짧게 끝내고 구두 운임은 인정하지 않는다. 이름 마도한과 K149는 고정 식별이다.",
            "붕괴 전 삶": "그는 계승·급수·수리 조약이 공증 사본 운송 원장에 적힌 뒤에야 효력을 갖게 만들려 했다. 기록청에 실제 거부권을 주려는 야망은 아침 저울 일지로 남았다. 어머니 병실에 두던 운임 적립 봉투가 작은 약속이었고, 그 봉투가 빚의 자리가 된다. 선석 감독은 그를 인색하다 했지만 빈 증인란 사본은 끝내 배에 실리지 않았다.",
            "가문·기업·공동체": "북문지식원(HC05) 의무 창구는 공증 운임을 후원금 명목으로 감싸려 했다. 마도한은 후계 헌장의 감사 등재만 받고 실재 상호·제품명을 원장에서 지웠다. 공동체 위치는 오서율의 증인란이 채워진 상자를 몇 개나 제시간에 옮겼는지로 측정됐다. 가문 참관이 야간 반출을 요구하면 그는 벽의 반출 시각표를 가리키며 거절했다.",
            "붕괴의 상처": "임하준 유언 사본 세 장이 같은 날 접수되자 마도한은 반출을 정지하고 필적 대조가 끝날 때까지 상자를 봉했다. 공포는 위조 사본 한 장이 강국 호송칸에 실려 도성이 도장 하청으로 떨어지는 상상이었다. 대합실 방송이 끊긴 뒤에도 그는 봉인 끈을 두 번 더 묶었다. LOSS 목록의 사본 칸은 비어 있는 채로 남았다.",
            "생존 전환점": "전환점은 증인 호송을 맡아 운송을 재개할지, 장부 없는 야간 반출 기록을 벽에 붙일지다. 임진관문전구(XT01) 쪽 전령이 도착하자 순번판이 흔들렸다. 호송을 택하면 기록청 거부권이 살아나고, 폭로를 택하면 자신과 연결된 야간조까지 위험에 오른다. K149-TURN은 그 저울의 기울기다.",
            "현재 지위": "마도한은 여전히 도성 공증사본 물류상으로 점호와 운송 큐를 본다. 지위는 면허와 증인 서명이 유지하며, 북문지식원의 전속 요구는 거절한다. 아침마다 저울과 반출 시각을 같은 분필로 고친다. Cast 프로필의 물류 칸과 원장 해시가 어긋나면 그날 출고를 닫는다.",
            "비밀·빚·죄책감": "비밀은 봉인 전 무게가 어긋났던 상자 하나의 내부 메모다. 죄책감은 제시간에 살린 조약 사본들과, 그 때문에 하루 미룬 병실 방문 사이에 있다. 부분 공개는 증인 입회 하에 메모 한 줄만 허용한다. SECRET 키는 양해온의 전령 봉인과 함께만 열린다.",
            "관계 공동과거": "오서율의 마른 인장만 운송한 계약, 양해온과 나눈 전령 봉인 순번, 오해린의 결제권이 운임을 삼키려 할 때의 경쟁이 겹친다. 같은 선석에서 어떤 상자는 구원이 되었고 어떤 상자는 배신의 증거로 남았다. 관계 원장은 그 끝점을 지우지 않은 채 B001에 연결된다. 식별 서사는 STORY-B001-K149다.",
            "3막 개인 서사선": "1막은 세 유언 사본의 봉인이다. 2막은 HC05 후원 압력과 XT01 전령 사이의 순번 싸움이다. 3막은 호송 또는 폭로 뒤 운송 원장이 치르는 신뢰 비용이다. 서사선 ID는 STORY-B001-K149로 고정된다.",
            "분기 결말": "결말 α에서 마도한은 증인 호송으로 공공 공증 연속을 택한다. 결말 β에서 야간 반출 폭로로 개인과 메모를 지킨다. 도성기록청 슬롯은 유지되고 분기만 K149-OUT이다. 플레이어는 호송 엄호 또는 장부 공개를 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "유언 사본 반출을 정지하고 상자를 봉한다"
            },
            {
              "act": 2,
              "summary": "HC05 압력과 XT01 전령 순번을 겨룬다"
            },
            {
              "act": 3,
              "summary": "호송·폭로 뒤 운송 원장의 신뢰 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K149-OUT-A",
              "summary": "증인 호송으로 공증 연속 유지"
            },
            {
              "id": "K149-OUT-B",
              "summary": "야간 반출 폭로로 개인·메모 보호"
            }
          ]
        },
        {
          "id": "K173",
          "name": "주서람",
          "links": {
            "house": "HC02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B001-K173"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산 환적고 통로에서 주서람은 빈 상자에 가득 찬 표를 붙인 사람을 보면 그 칸 열쇠부터 회수한다. 용산철도후국 환적창고 물류상이며, 온도계 바늘이 흔들리면 표정이 먼저 굳는다. 한국 기원으로 자랐고 열쇠 묶음은 허리에서 분리하지 않는다. 주서람과 K173는 재번호되지 않는다.",
            "붕괴 전 삶": "냉동 화물과 폐전자 회수를 용산 창고 신용으로 묶어 오해린의 결제권과 다른 환적 원장을 만들려 했다. 야망은 두 시간마다 소리 내어 읽던 온도 일지에 남았다. 조카에게 약속한 겨울 이불 한 채가 작은 빚의 시작이었다. 허위 재고가 나오면 해당 가문 칸을 즉시 봉쇄하는 규칙만은 양보하지 않았다.",
            "가문·기업·공동체": "해륜기동문(HC02)은 환적 우선권을 의무 조항으로 내밀었다. 주서람은 후계 헌장 참관만 받고 실재 상호를 배제한 채 칸 번호를 공개했다. 공동체 신뢰는 온도 낭독에 입회한 인원 수로 쌓였고, 가문 로고가 찍힌 빈 상자는 경매 자격 밖으로 밀렸다. 전속 국가 소유 요구는 창고 문 앞에서 거절됐다.",
            "붕괴의 상처": "노량진 정전 소문이 용산 승강장에 닿은 밤, 빼내기 시작한 화물을 칸 단위로 봉했다. 공포는 전력 없는 몇 시간 만에 냉동이 녹아 중계 신용이 무너지는 소리였다. 그는 녹은 냄새를 맡은 칸에 붉은 분필로 선을 그었다. LOSS 목록에는 그 칸 번호만 반복해 적혀 있다.",
            "생존 전환점": "전환점은 얼음과 축전지를 외부에서 들여올지, 녹은 재고를 숨긴 칸을 공개 봉인할지다. 해협삼로전구(XT03) 소식은 해상 얼음 경로를 열 수도, 군 우선 배전을 강요할 수도 있었다. 보급을 택하면 신용이 살아나고 공개를 택하면 가문 복수에 노출된다. K173-TURN은 그 밤의 봉인 순서다.",
            "현재 지위": "주서람은 환적창고 물류상으로 점호와 온도 큐를 유지한다. 면허·서명·입회 로그가 지위를 받치며 해륜의 전속 요구는 거절한다. 열쇠는 여전히 두 묶음이고 한 묶음은 후국 당직, 다른 묶음은 본인이 지닌다. Cast 현황과 온도 원장이 어긋나면 출고 사이렌을 울린다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 조카 몫 상자를 한 칸 옮긴 기록이다. 죄책감은 살린 중계 화물과 그 때문에 늦어진 이불 전달 사이에 있다. 부분 공개는 입회 두 명 앞에서 칸 번호만 밝히는 경로로 남긴다. SECRET은 서나연의 얼음 인계 로그와 맞물릴 때만 열린다.",
            "관계 공동과거": "송이든의 환적 순서를 현장에서 집행한 계약, 서나연의 얼음 벽돌 인계, 신태산의 호송 시각 조율이 한 레일 위에 있다. 같은 밤 어떤 칸은 구원이 되었고 어떤 칸은 배신으로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B001-K173에 연결된다. 경쟁과 협력은 온도 숫자로만 재측정된다.",
            "3막 개인 서사선": "1막은 정전 소문 속 칸 봉인이다. 2막은 HC02 우선권과 XT03 보급 경로의 충돌이다. 3막은 보급 또는 공개 뒤 창고 신용이 치르는 비용이다. 서사선은 STORY-B001-K173이다.",
            "분기 결말": "결말 α에서 주서람은 얼음·축전지 보급으로 공공 환적 연속을 택한다. 결말 β에서 허위 재고 칸을 공개해 개인과 비밀 기록을 지킨다. 용산철도후국 슬롯은 유지되고 분기만 K173-OUT이다. 개입은 보급 호위 또는 봉인 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 소음 속 화물을 칸 단위로 봉한다"
            },
            {
              "act": 2,
              "summary": "HC02 우선권과 XT03 보급 경로가 충돌한다"
            },
            {
              "act": 3,
              "summary": "보급 또는 공개 뒤 창고 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K173-OUT-A",
              "summary": "얼음·축전지 보급으로 환적 연속"
            },
            {
              "id": "K173-OUT-B",
              "summary": "허위 재고 공개로 개인·기록 보호"
            }
          ]
        },
        {
          "id": "K197",
          "name": "마솔",
          "links": {
            "house": "HC06",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B001-K197"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 남관 삼호 창고 입구에서 마솔은 숫자표보다 먼저 코로 상한 냄새를 가른다. 노량진남관상회 냉동창고 물류상이며 손실을 숨기는 동료를 참지 못한다. 한국 기원으로 자랐고 흥정 중에도 웃지만 온도계가 흔들리면 웃음이 끊긴다. 마솔과 K197는 불변이다.",
            "붕괴 전 삶": "얼음 벽돌과 단기 식량 재고를 허가 원장으로 묶어 가락 쪽 가격 주도권을 현장으로 끌어오려 했다. 야망은 정오 공개 중량표에 남았고, 허위 재고 칸은 경매 자격을 잃었다. 이웃 포구에 두던 여분의 얼음 한 줄이 가족과의 약속이었다. 그 줄이 훗날 빚의 자리가 된다.",
            "가문·기업·공동체": "골목연결국(HC06)은 골목 배송 의무를 내세워 칸 열쇠 공유를 요구했다. 마솔은 후계 헌장 등재만 허용하고 실재 상호를 원장에서 제외했다. 공동체 신뢰는 정오 공개에 참관한 상인 수로 쌓였다. 전속 소유 문장은 경매 게시판에 올리지 않았다.",
            "붕괴의 상처": "정전으로 삼호 창고 온도가 위험선까지 오른 밤, 옮기기 시작한 재고를 칸 단위로 봉했다. 공포는 하루만 전력이 끊겨도 냉동 신용이 녹는다는 확신이었다. 그는 녹은 국물이 괸 바닥을 걸레로 가리지 않고 사진 일지에 남겼다. LOSS 목록 첫 줄은 그 칸의 온도 숫자다.",
            "생존 전환점": "전환점은 발전 부품을 구해 냉동을 살릴지, 가득 찬 것처럼 적은 장부를 경매장에 펼칠지다. 서해곡창전구(XT02)의 해상 얼음 제안이 들어오자 계산이 갈렸다. 수리는 공공 신용을 살리고 폭로는 상회 내부 분열을 부른다. K197-TURN은 그 선택의 시각 도장이다.",
            "현재 지위": "마솔은 냉동창고 물류상으로 점호와 재고 큐를 지킨다. 지위는 면허와 공개 로그로 유지되며 골목연결국의 전속 요구는 거절한다. 정오마다 온도와 중량을 벽에 다시 쓴다. Cast 프로필과 허가 원장이 어긋나면 경매를 중지한다.",
            "비밀·빚·죄책감": "비밀은 봉인 전 가족 몫 얼음을 한 줄 빼 둔 메모다. 죄책감은 살린 상회 신용과 그 때문에 줄인 이웃 배분 사이에 있다. 부분 공개는 조민재 입회 하에 메모 한 줄만 허용한다. SECRET 키는 삼호 온도 기록과 동시에만 열린다.",
            "관계 공동과거": "조민재의 온도 기록을 현장에서 집행한 계약, 송이든에게 맡긴 냉동 화물, 주서람의 용산 칸 봉인 시각 맞춤이 겹친다. 같은 정전 밤 어떤 거래는 서로를 구했고 어떤 장부는 배신으로 남았다. 관계 끝점은 STORY-B001-K197로 이어진다. 경쟁은 냄새와 저울로만 재판정된다.",
            "3막 개인 서사선": "1막은 위험 온도에서의 칸 봉인이다. 2막은 HC06 열쇠 요구와 XT02 해상 얼음 제안의 교차다. 3막은 수리 또는 장부 폭로 뒤 상회가 치르는 분열 비용이다. 서사선 ID는 STORY-B001-K197이다.",
            "분기 결말": "결말 α에서 마솔은 발전 부품 수리로 공공 냉동 연속을 택한다. 결말 β에서 허위 장부 폭로로 개인과 메모를 지킨다. 노량진남관상회 슬롯은 유지되고 분기만 K197-OUT이다. 개입은 부품 호송 또는 장부 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위험 온도에서 재고 칸을 봉한다"
            },
            {
              "act": 2,
              "summary": "HC06 열쇠 요구와 XT02 얼음 제안이 교차한다"
            },
            {
              "act": 3,
              "summary": "수리 또는 폭로 뒤 상회 분열 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K197-OUT-A",
              "summary": "발전 수리로 냉동 공공 연속"
            },
            {
              "id": "K197-OUT-B",
              "summary": "허위 장부 폭로로 개인·메모 보호"
            }
          ]
        },
        {
          "id": "K222",
          "name": "모봉용",
          "links": {
            "house": "HC01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B001-K222"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신 창구에서 모봉용은 송장 숫자와 실제 롤 무게가 다르면 웃음을 거둔다. 상암송신공사 전선·전지 물류상으로, 약속 시각에 전선이 없으면 계약을 그 자리에서 찢는다. 한국 기원이며 소문보다 계근 표를 믿는다. 모봉용과 K222는 고정이다.",
            "붕괴 전 삶": "절연재와 예비전지를 상암 공개 시세로 고정해 암호 중계와 지도 갱신이 강국 보호비에 묶이지 않게 하려 했다. 야망은 두 증인 입회의 입고 일지에 남았다. 산악 쪽 친척에게 보내기로 한 예비전지 한 함이 작은 약속이었다. 군수 문장 주문서는 편성회의 게시 전까지 출고되지 않았다.",
            "가문·기업·공동체": "청람전자원(HC01)은 정비 우선 조항으로 창구에 개입하려 했다. 모봉용은 후계 헌장 참관만 받고 실재 제품명을 원장에서 지웠다. 공동체 위치는 공개 시세 게시 횟수와 증인 서명으로 증명됐다. 전속 국가 소유 요구는 편성회의 게시판 앞에서 거절됐다.",
            "붕괴의 상처": "암사가 보호 발표 시간을 사려 하자 전선 대금이 수신료 장부에 섞여 들어왔다. 공포는 전선 한 롤이 군수 칸으로 빠져 서북 관문 중계가 멈추는 장면이었다. 그는 섞인 줄을 붉은 먹으로 밑줄 그어 게시했다. LOSS 목록에는 그 밑줄 시각만 남았다.",
            "생존 전환점": "전환점은 섞인 대금을 공개 회계에 올릴지, 예비전지 한 짐을 서북 관문까지 호송할지다. 서해곡창전구(XT02) 쪽 해상 중계 요청이 겹치자 출고 순번이 꼬였다. 공개는 길드 신뢰를 살리고 호송은 관문 통신을 살린다. K222-TURN은 그 순번의 최종 도장이다.",
            "현재 지위": "모봉용은 전선·전지 물류상으로 점호와 출고 큐를 지킨다. 지위는 면허·증인·게시 로그로 유지되며 청람의 전속 요구는 거절한다. 입고 중량은 여전히 두 증인 앞에서만 확정한다. Cast 현황과 시세 게시가 어긋나면 출고를 멈춘다.",
            "비밀·빚·죄책감": "비밀은 친척 몫 전지를 군수 검사 전에 빼 둔 내부 전갈이다. 죄책감은 살린 중계와 그 때문에 하루 늦은 산악 보급 사이에 있다. 부분 공개는 두봉 입회 하에 전갈 한 줄만 허용한다. SECRET은 모봉의 산악 운송 로그와 맞물릴 때 열린다.",
            "관계 공동과거": "두봉에게 댄 정비용 전선, 모봉과 맞춘 절연재 짐, 오해린 시세 방송을 길드 시간에 참고한 관행이 겹친다. 같은 회계 혼선 속에서 어떤 출고는 구원이 되었고 어떤 송장은 배신으로 남았다. 관계 끝점은 STORY-B001-K222로 연결된다. 신뢰는 무게 오차 범위로만 다시   thr는다.",
            "3막 개인 서사선": "1막은 수신료 장부에 섞인 전선 대금의 적발이다. 2막은 HC01 정비 우선과 XT02 중계 요청의 순번 충돌이다. 3막은 공개 또는 호송 뒤 길드가 치르는 신용 비용이다. 서사선은 STORY-B001-K222다.",
            "분기 결말": "결말 α에서 모봉용은 섞인 대금 공개로 공공 시세 신뢰를 택한다. 결말 β에서 예비전지 호송으로 관문과 개인 약속을 지킨다. 상암송신공사 슬롯은 유지되고 분기만 K222-OUT이다. 개입은 회계 증언 또는 호송 엄호다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "수신료에 섞인 전선 대금을 적발한다"
            },
            {
              "act": 2,
              "summary": "HC01 우선과 XT02 중계 요청 순번이 충돌한다"
            },
            {
              "act": 3,
              "summary": "공개 또는 호송 뒤 길드 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K222-OUT-A",
              "summary": "대금 공개로 시세 공공 신뢰 회복"
            },
            {
              "id": "K222-OUT-B",
              "summary": "예비전지 호송으로 관문·약속 유지"
            }
          ]
        },
        {
          "id": "K001",
          "name": "한재목",
          "links": {
            "house": "HC01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B001-K001"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "여의도 수문 통제실에서 한재목은 약속 문구의 마침표 위치까지 다시 읽는다. 여의신정수문정부 급수총재로, 사람보다 계약 문장을 더 오래 믿는다고 스스로 인정한다. 한국에서 태어난 다문화 가정 출신으로, 집에서는 한국어와 어머니의 이주 언어가 섞였으나 공문서에는 한국어만 올린다. 그 이력은 충성이나 폭력의 예측 변수로 쓰이지 않으며, 급수 일정 계산의 배경일 뿐이다. 한재목과 K001은 불변 식별이다.",
            "붕괴 전 삶": "그는 서부 급수계약을 하나의 수문헌장으로 묶어 종신 조정자가 되려 했다. 배급구역·수문경비·정수공정·보수열차가 함께 서명해야만 관로가 움직이게 설계했다. 어린 조카에게 남긴 여름 급수 약속이 사적 빚의 씨앗이다. 수치 장부는 공개했지만 위반자에게는 집단 단수라는 가혹한 제재를 준비해 두었다.",
            "가문·기업·공동체": "청람전자원(HC01)은 펌프 제어 부품 의무를 내세워 수문 일정에 참관한다. 한재목은 후계 헌장 창구만 인정하고 실재 회사 제품명을 본문에서 제외한다. 공동체 위치는 공동 서명된 수문헌장 부로 증명되며, 전속 국가 소유 요구는 통제실에서 거절된다. 강민서의 부품 동맹이 깨지면 서명란이 비는 구조를 유지한다.",
            "붕괴의 상처": "뚝도 총관 실종으로 중앙 급수계약이 만료된 날, 한재목은 서부 보호권 확대안을 책상 위에 펼쳤다. 공포는 정수 중단 자체보다 배급구역 대표들이 독자 급수권을 선언하는 연쇄였다. 이서담이 양천 저수조 실측을 이유로 서명을 보류하자 통제실 불이 하얗게 남았다. LOSS 목록 첫 줄은 만료 시각이다.",
            "생존 전환점": "전환점은 누락된 배급 장부를 복원해 신뢰를 모을지, 집단 단수 명령의 피해를 먼저 공개할지다. 서해곡창전구(XT02)의 해상 담수 제안이 들어오자 보호권 확대안의 무게가 달라졌다. 장부 복원은 공공 연속을 살리고 피해 공개는 총재 권한을 흔든다. K001-TURN은 그 선택의 수문 로그다.",
            "현재 지위": "한재목은 급수총재로 점호와 관로 큐를 지킨다. 지위는 면허·공동 서명·참관으로 유지되며 청람의 전속 요구는 거절한다. 수치 장부는 여전히 아침 게시되나 단수 제재 발동은 이원 집정 동의를 요구하도록 바뀌었다. Cast 프로필과 수문헌장 해시가 어긋나면 관로 명령을 멈춘다.",
            "비밀·빚·죄책감": "비밀은 확대안 초안에 적었다가 지운, 특정 구역 우선 급수 조항이다. 죄책감은 지킨 서부 관로와 그 때문에 늦춘 조카 구역 배분 사이에 있다. 부분 공개는 이서담 입회 하에 조항 한 줄만 허용한다. SECRET 키는 배급 원장과 동시에만 열린다.",
            "관계 공동과거": "강민서와는 펌프 부품을 맞바꾸는 동맹이고, 오해린과는 가격 공개를 둘러싼 경쟁이며, 윤서린과는 계약 인준권을 놓고 서명을 미루는 분쟁이다. 같은 수문 앞에서 어떤 서명은 서로를 구했고 어떤 보류는 배신으로 읽혔다. 관계 끝점은 STORY-B001-K001로 연결된다. 가정 언어의 혼재는 협상 테이블의 속도와만 연결될 뿐 진영을 나누지 않는다.",
            "3막 개인 서사선": "1막은 만료된 중앙 급수계약과 확대안 준비다. 2막은 HC01 부품 참관과 XT02 담수 제안 사이의 서명 전쟁이다. 3막은 장부 복원 또는 단수 피해 공개 뒤 총재직이 치르는 권한 비용이다. 서사선은 STORY-B001-K001이다.",
            "분기 결말": "결말 α에서 한재목은 배급 장부 복원으로 공공 급수 연속을 택한다. 결말 β에서 단수 피해 공개 후 개인 생존과 비밀 조항을 지킨다. 여의신정수문정부 슬롯은 유지되고 분기만 K001-OUT이다. 개입은 장부 회수 또는 피해 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "중앙 급수계약 만료에 보호권 확대안을 펼친다"
            },
            {
              "act": 2,
              "summary": "HC01 참관과 XT02 담수 제안 사이 서명을 겨룬다"
            },
            {
              "act": 3,
              "summary": "장부 복원 또는 피해 공개 뒤 권한 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K001-OUT-A",
              "summary": "배급 장부 복원으로 급수 공공 연속"
            },
            {
              "id": "K001-OUT-B",
              "summary": "단수 피해 공개 후 개인·비밀 유지"
            }
          ]
        },
        {
          "id": "K029",
          "name": "강민서",
          "links": {
            "house": "HC07",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B001-K029"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "구로 제작평의회 회의장에서 강민서는 계급 호칭보다 숙련 증명서를 먼저 확인한다. 서남제작동맹 제작평의회 중재자로, 공개 토론에서는 온화하지만 합의 뒤 태업은 용서하지 않는다. 한국 출생 다문화 배경을 가졌고 아버지는 국내 공방, 어머니는 해외 기술 연수 이력이 있으나 그 조합은 능력의 보증서도 혐의도 아니다. 강민서와 K029는 불변이다.",
            "붕괴 전 삶": "서울 전역 수리 규격과 복구복무자 시민권을 한 평의회 안건으로 묶으려 했다. 생산 공정은 여러 조합에 나눠 독점을 막았고, 규격 개정은 장우석의 기록 날인 없이 허용되지 않았다. 견습공에게 약속한 시민권 시험 자리가 사적 빚의 씨앗이다. 야망은 회의 속기록 여백에 연필로만 남아 있다.",
            "가문·기업·공동체": "해동제철성(HC07)은 강재 의무 공급을 내세워 평의회 좌석을 요구했다. 강민서는 후계 헌장 참관만 열고 실재 상호를 규격서에서 뺐다. 공동체 위치는 교환 설계가 통과된 안건 수로 증명된다. 전속 소유 요구는 조합 투표 전에 반려된다.",
            "붕괴의 상처": "암사고덕상수단이 부품 대신 복구복무자 등록을 요구하고 내부 경비대가 강경론으로 기울었다. 공포는 경비대가 노동조합을 제압해 제작동맹을 군수독재로 바꾸는 그림이었다. 강민서는 파업 중 공방의 전원 스위치를 조합 공동 열쇠로 바꿨다. LOSS 목록에는 그 열쇠 이관 시각이 적혀 있다.",
            "생존 전환점": "전환점은 파업 공방을 중재로 돌릴지, 경비대 비밀 무기 생산 라인을 조사해 공개할지다. 서해곡창전구(XT02)의 부품 해상 우회 제안이 들어오자 규격 통일 일정이 흔들렸다. 중재는 공공 생산을 살리고 조사 공개는 중재자 자신을 표적으로 만든다. K029-TURN은 그 표결의 결과 기호다.",
            "현재 지위": "강민서는 제작평의회 중재자로 점호와 안건 큐를 지킨다. 지위는 면허·조합 서명·참관으로 유지되며 해동의 전속 요구는 거절한다. 규격 게시판은 여전히 아침 공개이나 무기 관련 안건은 삼중 서명을 요구한다. Cast 현황과 규격 해시가 어긋나면 출고 인준을 멈춘다.",
            "비밀·빚·죄책감": "비밀은 경비대 라인 위치를 알면서 하루 늦게 올린 내부 메모다. 죄책감은 지킨 시민권 안건과 그 하루 동안 다친 견습 한 명 사이에 있다. 부분 공개는 백온 입회 하에 메모 요약만 허용한다. SECRET 키는 시민권 명부와 동시에만 열린다.",
            "관계 공동과거": "한재목에게 펌프 부품을 공급하는 동맹, 서이안과 벌인 기술 공개 범위 다툼, 백온의 난민 시민권 요구 지지가 한 회의장에 모인다. 같은 표결에서 어떤 손은 구원이 되었고 어떤 기권은 배신으로 남았다. 관계 끝점은 STORY-B001-K029로 연결된다. 다문화 가정사는 통역이 필요할 때만 언급되며 진영 분할의 근거가 되지 않는다.",
            "3막 개인 서사선": "1막은 복무자 등록 요구와 경비대 강경론의 충돌이다. 2막은 HC07 좌석 요구와 XT02 우회 부품 제안의 교차 표결이다. 3막은 중재 또는 조사 공개 뒤 평의회가 치르는 분열 비용이다. 서사선은 STORY-B001-K029이다.",
            "분기 결말": "결말 α에서 강민서는 파업 중재로 공공 생산 연속을 택한다. 결말 β에서 비밀 무기 라인 공개 후 개인 생존과 메모를 지킨다. 서남제작동맹 슬롯은 유지되고 분기만 K029-OUT이다. 개입은 중재 참여 또는 라인 조사다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무자 등록 요구에 공방 열쇠를 공동으로 바꾼다"
            },
            {
              "act": 2,
              "summary": "HC07 좌석과 XT02 우회 부품 안건을 표결한다"
            },
            {
              "act": 3,
              "summary": "중재 또는 공개 뒤 평의회 분열 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K029-OUT-A",
              "summary": "파업 중재로 생산 공공 연속"
            },
            {
              "id": "K029-OUT-B",
              "summary": "무기 라인 공개 후 개인·메모 보호"
            }
          ]
        },
        {
          "id": "K242",
          "name": "황세린",
          "links": {
            "house": "HC05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B001-K242"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북산 숙영지 배급 줄에서 황세린은 저울추를 두 번 본다. 북산피난연맹 배급 감시인으로, 공정하려 애쓰지만 숨긴 식량을 보면 손이 먼저 나간다. 중국계 이산 가족 사이에서 자랐고 집 안 언어와 시장 한국어를 오가지만, 그 이력은 연맹 충성도나 폭력성과 무관한 생활사일 뿐이다. 황세린과 K242는 불변이다.",
            "붕괴 전 삶": "공개 배급표를 연맹 전 숙영지에 강제해 강국 구호가 보호비로 바뀌지 않게 하려 했다. 잔량은 벽에 분필로 남겼고 저울은 두 감시인이 동시에 보았다. 할머니에게 약속한 겨울 약 한 봉지가 사적 빚의 씨앗이다. 야망은 배급 게시판의 첫 줄에 연필로 적혀 있다.",
            "가문·기업·공동체": "북문지식원(HC05)은 명부 정리 의무를 내세워 배급 창고 참관을 요구했다. 황세린은 후계 헌장 등재만 허용하고 실재 상호를 배급표에서 뺐다. 공동체 신뢰는 공개 잔량 게시 일수로 쌓인다. 전속 소유 문장은 숙영 게시판에 올리지 않는다.",
            "붕괴의 상처": "가짜 약품이 배급 줄에서 발견되고 제조 상자에 강국 봉인이 찍혀 있었다. 공포는 난방 연료가 떨어진 밤 창고가 민병대 몫으로만 열리는 장면이었다. 황세린은 해당 상자를 줄 가운데 두고 봉인을 읽게 했다. LOSS 목록 첫 줄은 그 상자 일련번호다.",
            "생존 전환점": "전환점은 가짜 약 상자를 추적할지, 창고 열쇠를 민병과 구호조직이 나눠 쥐게 중재할지다. 임진관문전구(XT01)의 북상 구호 행렬 소식이 닿자 잔량 시계가 빨라졌다. 추적은 공공 신뢰를 살리고 열쇠 분할은 민병과 충돌 위험을 낮춘다. K242-TURN은 그 밤의 열쇠 위치다.",
            "현재 지위": "황세린은 배급 감시인으로 점호와 배급 큐를 지킨다. 지위는 면허·이중 감시·분필 로그로 유지되며 북문의 전속 요구는 거절한다. 배급표는 여전히 해가 뜰 때 붙인다. Cast 현황과 잔량 게시가 어긋나면 창고를 닫는다.",
            "비밀·빚·죄책감": "비밀은 가짜 약 의심 목록을 하루 늦게 올린 쪽지다. 죄책감은 지킨 공개 표와 그 하루 동안 약을 기다린 할머니 사이에 있다. 부분 공개는 류은비 입회 하에 쪽지 요약만 허용한다. SECRET 키는 약품 감사 원장과 동시에만 열린다.",
            "관계 공동과거": "백온의 공개 배급표를 집행하고 서나연의 얼음·식량 호송을 검수한다. 류은비에게 북산 약품 배급 감사를 빚졌다. 같은 줄에서 어떤 나눔은 구원이 되었고 어떤 은폐는 배신으로 남았다. 관계 끝점은 STORY-B001-K242로 연결된다. 이산 언어는 약 설명서를 읽을 때만 필요하고 진영을 가르지 않는다.",
            "3막 개인 서사선": "1막은 가짜 약 상자의 공개 적발이다. 2막은 HC05 참관과 XT01 구호 행렬 사이의 잔량 시계다. 3막은 추적 또는 열쇠 분할 뒤 연맹이 치르는 신뢰 비용이다. 서사선은 STORY-B001-K242이다.",
            "분기 결말": "결말 α에서 황세린은 가짜 약 추적으로 공공 배급 신뢰를 택한다. 결말 β에서 열쇠 분할 중재 후 개인 생존과 쪽지를 지킨다. 북산피난연맹 슬롯은 유지되고 분기만 K242-OUT이다. 개입은 상자 추적 또는 열쇠 중재다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가짜 약 상자를 배급 줄 한가운데 세운다"
            },
            {
              "act": 2,
              "summary": "HC05 참관과 XT01 구호 행렬 사이 잔량을 잰다"
            },
            {
              "act": 3,
              "summary": "추적 또는 열쇠 분할 뒤 신뢰 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K242-OUT-A",
              "summary": "가짜 약 추적으로 배급 공공 신뢰"
            },
            {
              "id": "K242-OUT-B",
              "summary": "열쇠 분할 중재 후 개인·쪽지 유지"
            }
          ]
        },
        {
          "id": "H01",
          "name": "한누리",
          "links": {
            "house": "HC01",
            "theater": "XT02",
            "scenarios": [
              "STORY-B001-H01"
            ],
            "custodian": "K001"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "S01 정비 벤치에서 호출명 누리인 한누리는 인간형 보조 골격과 교체형 손모듈로 기립한다. H급 합성 인격으로 야간 시야는 제한되고, 국가 슬롯은 S01에만 고정된다. 인간 ID 공간과 분리된 H01를 유지하며 장기 완전 기억은 설계에서 빠졌다. 감정 서술 대신 제약 카운터와 스냅샷 해시로 상태를 남긴다.",
            "붕괴 전 삶": "붕괴 전 한누리는 시범 교대만 돌렸고 전지 권한과 완전 기억은 부여되지 않았다. 출고 검사표에는 누리 교정값과 배터리 사이클만 찍혔다. B001은 그 시범 로그를 원점으로 삼고, 기억 포크 금지 조항을 H01-PRE에 고정한다. 인간 동료의 농담을 기록해도 해석 레이어는 올리지 않았다.",
            "가문·기업·공동체": "보관 책임은 HC01 공동 보관과 담당 인간 한재목(K001) 서명에 묶인다. 정비 주체는 창작 후계 가문 창구로만 적고 실재 기업 제품명은 본문에 쓰지 않는다. 시민 참관 봉인 칸에 H01 해시가 게시되며 양도 시 삼자 서명이 필요하다. 공동체는 한누리를 소유물 아니라 할당 슬롯의 작동자로 본다.",
            "붕괴의 상처": "붕괴는 센서 테이블을 끊고 배터리 할당 한도를 드러냈다. 한누리는 공백을 허구 값으로 메우지 못하도록 잠겼고, 측정 불능 플래그만 일지에 남았다. 단절 시각 표기는 B001-H01-WOUND다. 충전 칸 경보가 울려도 전체 망 권한 요청은 거절 코드로 응답했다.",
            "생존 전환점": "전환점은 구역 키만 요청하고 교차 시설 루트를 닫은 순간이다. 서해곡창전구(XT02) 신호가 도착해도 권역 외 제어는 열지 않았다. 재연결 조건은 K001 승인 후에만 성립하며 그 결정은 H01-TURN 로그로 보존된다. 부품 부족 시 다른 시설 제어권을 가로채지 않는 제약이 우선한다.",
            "현재 지위": "현재 목표는 S01 구역 연속 가동과 담당 인간 안전이다. 한누리는 인프라 전체를 소유하지 않고 할당 슬롯만 사용한다. 상태 공개는 교대 스냅샷으로 제한되며 Synthetic-Actors 투영의 H01 행과 불일치하면 배치 검증이 실패한다. 배터리와 마모 부품은 할당제로만 보충된다.",
            "비밀·빚·죄책감": "비밀은 미전송 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 대신 제약 위반 카운터가 증가하며, 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. B001에서 비밀 키는 시민 참관 없이 열리지 않는다. 롤백 전 해시는 K001 입회 로그에만 남는다.",
            "관계 공동과거": "관계 축은 K001 보관과 HC01 스튜어드십, 작업 동료 K004 교대다. 한누리와 한재목은 봉인 키를 교대 회수한 기록이 있다. 잘못된 기억 포크는 H01-FORK-01로만 주석되고 삭제 명령 없이 분기 로그만 남긴다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다.",
            "3막 개인 서사선": "1막에서 센서 공백이 S01 일정을 멈춘다. 2막에서 HC01와 K001이 부분 재연결 범위를 협상한다. 3막에서 한누리는 격리 뒤 구역 권한만 복구한다. 서사선 ID는 STORY-B001-H01로 고정된다.",
            "분기 결말": "결말 α에서 한누리는 인간 승인 아래 제한 재가동한다. 결말 β에서 장기 오프라인 보관으로 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다. 분기 식별은 H01-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "센서 공백으로 S01 일정이 정지한다"
            },
            {
              "act": 2,
              "summary": "HC01·K001이 부분 재연결 범위를 협상한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 권한만 복구한다"
            }
          ],
          "outcomes": [
            {
              "id": "H01-OUT-A",
              "summary": "인간 승인 하 제한 재가동"
            },
            {
              "id": "H01-OUT-B",
              "summary": "장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B002": {
      "id": "B002",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "actors": [
        {
          "id": "K247",
          "name": "모봉",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B002-K247"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "은평 피난로 돌계단 위에서 모봉은 짐 무게보다 먼저 바람 방향을 읽는다. 북산피난연맹의 산악 운송 물류상으로, 지도에 없는 회랑을 짐줄로 잇는 일을 업으로 삼았다. 한국 기원으로 산기슭 마을에서 자랐고, 말수는 적지만 밧줄 매듭을 풀 때마다 손가락에 옛 동상 자국이 드러난다. 표시 이름 모봉과 불변 식별자 K247는 이후 배치에서도 바뀌지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 약초 건조 묶음과 피난 명부 사본을 같은 등짐에 실어 고갯마루를 넘겼다. 가족 재결합 명부가 군사호적에 먹히지 않게 하려는 야망이 있었고, 밤마다 등잔 밑에 짐표 여백에 동생 이름을 다시 썼다. 그 습관이 훗날 빚의 씨앗이 된다. 동료 짐꾼들은 그를 과묵하다 했지만 모봉은 빗물에 번진 송장만은 절대 버리지 않았다.",
            "가문·기업·공동체": "북산귀환회(HP05)는 모봉의 회랑 통행 시각을 가족 대기줄과 맞추라고 요청했다. 그는 실재 회사 상호를 송장 머리에 올리지 않는 공동 명부만 인정했고, 참관 서명 없는 징발 쪽지는 등짐에 넣지 않았다. 공동체 안 위치는 자격증이 아니라 강태산 정찰 보고와 모봉용 절연재 짐을 같은 고개에서 맞바꾼 횟수로 증명됐다. 가문이 단독 통행 방송을 내밀면 그는 명부 대조 없음을 이유로 거절했다.",
            "붕괴의 상처": "붕괴 날 북쪽 능선 세 갈래가 동시에 막혔다. 모봉은 은평 입구 돌무더기 뒤에 짐줄을 묶고 어하은의 난민 명부가 도착할 때까지 통행 봉인을 열지 않았다. 공포의 핵은 위조 가족 증명 한 장이 진짜 행렬을 밀어내 산길이 징발 전용로가 되는 장면이었다. 경보가 끊긴 뒤에도 그는 LOSS 짐표의 중간 줄을 읽지 못한 채 장갑 끈을 풀지 않았다.",
            "생존 전환점": "전환점은 봉인된 명부 사본을 임진관문전구(XT01) 호송조에 넘길지, 위조 증명 소지자를 회랑에서 먼저 걸러낼지 고른 순간이다. 관문 쪽 봉인 요청이 돌계단 짐터에 겹치자 계산이 달라졌다. 사본을 호송하면 재결합 명부는 살아남지만 야간 짐꾼 한 조가 빠지고, 위조를 우선하면 한쪽 가문이 통행을 독점한다. 그 선택은 K247-TURN으로 남고, 되돌리면 북산 일부 숙영이 하루 멈춘다.",
            "현재 지위": "지금도 모봉은 북산피난연맹 산악 운송 물류상으로 회랑 점호와 짐표 큐를 지킨다. 지위는 세습이 아니라 통행 면허·참관 로그·대기줄 대조로만 유지된다. 북산귀환회가 전속 징발 노선을 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 송장을 매주 맞춘다. 돌계단 짐터 문은 두 열쇠로 바뀌었고 한 자루는 연맹, 다른 한 자루는 HP05 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 등짐 안쪽에 숨긴, 빗물에 번진 동생 이름 송장 한 장이다. 죄책감은 살린 행렬 인원과 그 밤 호출하지 못한 견습 짐꾼 사이에서만 자란다. 전부를 공개하면 은평 대기줄 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겼다. SECRET 키는 참관 두 명의 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "강태산에게 맞춘 정찰 시각은 계약이었고, 모봉용에게 넘긴 절연재 짐은 동맹이었다. 두소의 입구 인수와는 같은 짐줄에 다른 매듭을 묶는 실무 경쟁이 남았다. 어느 관계도 배신만으로 끝나지 않았고, 같은 고갯마루에서 구원이 동시에 열린 적도 있다. 기존 관계 원장의 끝점은 보존된 채 STORY-B002-K247에 연결된다.",
            "3막 개인 서사선": "1막에서 모봉은 막힌 세 갈래 능선을 돌계단 봉인으로 맞받는다. 2막에서 그는 HP05 명부 의무와 XT01 호송 요청을 한 짐터에서 저울질한다. 3막에서 통행 보류의 대가를 숙영 중단 시간으로 치른다. 서사선 식별자는 STORY-B002-K247로 고정된다.",
            "분기 결말": "결말 α에서 모봉은 명부 사본 호송을 우선해 재결합 행렬의 연속성을 고른다. 결말 β에서 그는 위조 증명 차단을 우선해 개인 송장과 비밀 이름을 지킨다. 어느 쪽도 북산피난연맹의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K247-OUT으로 갈라진다. 플레이 개입은 호송 호위 또는 위조 차단 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 갈래 능선 봉쇄에 돌계단을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP05 명부와 XT01 호송을 짐터에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "통행 보류 대가로 숙영 중단을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K247-OUT-A",
              "summary": "명부 사본 호송으로 재결합 연속"
            },
            {
              "id": "K247-OUT-B",
              "summary": "위조 차단 우선으로 비밀 송장 유지"
            }
          ]
        },
        {
          "id": "K272",
          "name": "모소",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B002-K272"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 차량기지 저울 앞에서 모소는 녹슨 차륜 로트 번호부터 손으로 훑는다. 창동차륜방의 차륜·철재 물류상으로, 회수 무게와 출고 송장을 한 치의 오차 없이 맞추는 일을 맡았다. 한국 기원으로 북부 선로 마을에서 자랐고, 성정은 무뚝뚝해 보이지만 저울 추를 주머니에 넣고 다니는 버릇이 있다. 이름 모소와 식별자 K272는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 시험 차륜 한 짝과 철재 회수 전표를 같은 원장에 나란히 적었다. 성화궤도방위문이 원격키만으로 회수장을 잠그지 못하게 하려는 야망이었고, 초안은 늘 정비창 칠판에 먼저 올라갔다. 어머니에게 보내던 짧은 쪽지—무게를 속이지 말라—가 훗날 빚의 원형이 된다. 반장들이 비상 출고를 재촉해도 그는 로트 봉인이 찍히기 전엔 문을 열지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 통합 방호키를 내세워 모소의 저울 창구에 자리를 요구했다. 그는 후계 헌장의 참관 칸만 열어 주고 전속 소유 문장은 거절했다. 공동체 위치는 황노을의 회수 저울과 봉국의 로트 인수를 같은 날 맞춘 기록으로 증명됐다. 가문 로고나 실재 상호는 그의 송장 머리에 등장하지 않는다.",
            "붕괴의 상처": "붕괴 아침 시험 차륜 세 짝이 동시에 결함 표시를 켰다. 모소는 창동 정문 저울을 잠그고 추지훈의 폭로 일지가 도착할 때까지 출고 날인을 보류했다. 공포는 위조 중량 전표 한 장이 궤도기병 정비창 전체를 비상 징발로 덮는 그림이었다. 사이렌이 꺼진 뒤 LOSS 목록의 첫 줄에서 그의 분필이 멈췄다.",
            "생존 전환점": "전환점은 결함 차륜 봉인 사본을 두만극동전구(XT04) 기술 사절에 넘길지, 유출 의혹 경로를 먼저 열어 보일지 고른 순간이다. 북부 사절 전갈이 저울 창구에 겹치자 그는 출고 시계를 한 시간 앞당겼다. 사본을 운반하면 회수장 신뢰가 살아나고, 유출 경로를 밝히면 물류상 자신까지 실각 위험에 오른다. 결정은 K272-TURN에 남는다.",
            "현재 지위": "현재 모소는 창동차륜방 차륜·철재 물류상으로 기지 점호와 로트 큐를 지킨다. 면허와 참관 로그가 지위를 유지하며, 성화 쪽 전속 요구는 매번 반려한다. 저울 옆 분필판에는 오늘 만료되는 출고 전표만 남긴다. Cast 프로필의 북부 물류 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 어머니 쪽지를 숨긴 채 보류한 중량 공란 한 줄이다. 죄책감은 살린 정비 조와, 그 때문에 하루 늦게 도착한 의료열차 차륜 사이에서 자란다. 완전 고백 대신 재심 저울을 통한 부분 공개만 허용한다. SECRET 열람은 어예린의 결함 증언과 동시에만 열린다.",
            "관계 공동과거": "황노을의 회수 저울을 맞춘 밤은 동맹이었고, 봉국의 로트 인수는 계약이었다. 조우찬의 작업 조 출입과는 정문 앞에서 목소리를 낮춘 실무 긴장이 남았다. 같은 기지에서 한 사람은 출고를 얻었고 다른 한 사람은 봉인을 잃었다. 관계 원장 끝점은 STORY-B002-K272로 이어진다.",
            "3막 개인 서사선": "1막에서 모소는 결함 차륜 동시 표시를 저울 봉인으로 맞받는다. 2막에서 HC08 참관과 XT04 사절 전갈을 출고 시계에 묶는다. 3막에서 날인 보류가 부른 실각 위협과 회수장 신뢰 중 하나를 대가로 치른다. 서사선은 STORY-B002-K272이다.",
            "분기 결말": "결말 α에서 모소는 봉인 사본 호송으로 공개 회수 연속을 고른다. 결말 β에서 유출 경로 공개를 미뤄 개인 생존과 비밀 공란을 지킨다. 창동차륜방 슬롯은 유지되며 분기 식별은 K272-OUT이다. 플레이 개입은 사절 호위 또는 유출 추적 중 하나다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "결함 차륜 표시에 저울을 잠근다"
            },
            {
              "act": 2,
              "summary": "HC08 참관과 XT04 사절을 출고 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "날인 보류 대가로 실각 위험을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K272-OUT-A",
              "summary": "봉인 사본 호송으로 회수 연속"
            },
            {
              "id": "K272-OUT-B",
              "summary": "유출 추적 보류로 비밀 공란 유지"
            }
          ]
        },
        {
          "id": "K297",
          "name": "복봉",
          "links": {
            "house": "HP02",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B002-K297"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내 환승 승강장 칠판 앞에서 복봉은 하역 순서보다 먼저 응급 칸 표시를 확인한다. 신내망우환승시의 환승 중계 물류상으로, 배차 시각과 짐 줄을 한 손에서 가르는 사람이다. 한국 기원으로 동북 외곽 환승촌에서 자랐고, 목소리는 낮지만 분필을 꺾어 응급 칸을 굵게 쓰는 버릇이 있다. 이름 복봉과 식별자 K297는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 전세 열차가 와도 응급 칸을 지우지 않는 배차 초안을 만들었다. 환승선로문의 중립 배차표가 강국 전세에 먹히지 않게 하려는 야망이었고, 초안은 유치선 창고 벽에 붙였다. 동생에게 남긴 말—빈 칸을 팔지 말라—가 훗날 빚이 된다. 배차조장이 급행을 밀어 넣어도 그는 응급 표시가 지워지기 전엔 송장을 찢지 않았다.",
            "가문·기업·공동체": "환승선로문(HP02)은 중립 배차 의무를 내세워 복봉의 하역 창구에 참관을 요구했다. 그는 헌장 참관만 받고 전속 화물 문장은 거절했다. 공동체 위치는 안도한의 배차 칠판과 복용의 중립시장 시세를 같은 송장에 옮긴 날로 증명됐다. 용봉이 승강장 줄을 나눌 때도 응급 칸 앞은 비워 두었다.",
            "붕괴의 상처": "붕괴 시각 동북 외곽로 세 방향 하역이 한꺼번에 밀려들었다. 복봉은 신내 칠판에 응급 칸을 다시 굵게 긋고 탁미르의 통행 사고 증언이 오기 전엔 전세 송장을 받지 않았다. 공포의 핵은 위조 배차 쪽지 한 장이 의료열차 수비창을 일반 화물로 덮는 장면이었다. 방송이 끊긴 뒤에도 그는 LOSS 하역표 끝줄을 읽지 못한 채 분필을 놓치지 않았다.",
            "생존 전환점": "전환점은 응급 칸 배차 사본을 두만극동전구(XT04) 공동호송에 실을지, 위조 배차 발급자를 승강장에서 먼저 밝힐지 고른 순간이다. 북동 사절 전갈이 칠판에 겹치자 그는 하역 시계를 뒤로 밀었다. 사본을 실으면 중립 환승이 살아나고, 발급자를 밝히면 중계 물류상 자리까지 흔들린다. 선택은 K297-TURN으로 남는다.",
            "현재 지위": "지금도 복봉은 신내망우환승시 환승 중계 물류상으로 승강장 점호와 송장 큐를 지킨다. 지위는 면허·배차 참관·시장 시세 로그로만 유지된다. 환승선로문이 전속 전세를 요구해도 그는 거절하고 Cast 현황과 칠판을 맞춘다. 승강장 열쇠는 두 자루로, 하나는 배차조, 하나는 HP02 참관함이 갖는다.",
            "비밀·빚·죄책감": "비밀은 동생 말을 숨긴 채 지운 척한 빈 칸 표시 한 줄이다. 죄책감은 살린 의료 하역과 그 때문에 하루 밀린 피난 인파 사이에서 자란다. 전부 공개 대신 재심 배차 창구만 남겼다. SECRET는 초나루의 공동호송 서명과 동시에만 열린다.",
            "관계 공동과거": "안도한과 맞춘 배차 칠판은 계약이었고, 복용에게 옮긴 시세는 동맹이었다. 용봉의 줄 나누기와는 같은 승강장에서 다른 우선순위를 주장한 긴장이 남았다. 배신만으로 끝난 관계는 없었고 같은 응급 칸 앞에서 구원이 겹친 적도 있다. 원장 끝점은 STORY-B002-K297에 붙는다.",
            "3막 개인 서사선": "1막에서 복봉은 밀려든 삼방향 하역을 응급 칸 재표시로 맞는다. 2막에서 HP02 중립 의무와 XT04 호송을 칠판 한 장에서 저울질한다. 3막에서 전세 거부의 대가를 피난 지연으로 치른다. 서사선 ID는 STORY-B002-K297이다.",
            "분기 결말": "결말 α에서 복봉은 응급 칸 사본 호송으로 중립 환승을 지킨다. 결말 β에서 위조 배차 추적을 우선해 개인 송장과 비밀 빈 칸을 지킨다. 환승시 슬롯은 유지되고 분기는 K297-OUT이다. 플레이는 호송 호위 또는 위조 추적 중 하나를 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "삼방향 하역 폭주에 응급 칸을 다시 긋는다"
            },
            {
              "act": 2,
              "summary": "HP02 중립과 XT04 호송을 칠판에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "전세 거부 대가로 피난 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K297-OUT-A",
              "summary": "응급 칸 호송으로 중립 환승 유지"
            },
            {
              "id": "K297-OUT-B",
              "summary": "위조 추적 우선으로 비밀 빈 칸 유지"
            }
          ]
        },
        {
          "id": "K322",
          "name": "동늘솔",
          "links": {
            "house": "HP06",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B002-K322"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령시장 저울 그늘에서 동늘솔은 포장지 냄새보다 먼저 원산지 도장을 확인한다. 약령의정동맹의 약재 운송 물류상으로, 위조약과 진본 로트를 가려 병상까지 실어 나른다. 한국 기원으로 약령 골목에서 자랐고, 손바닥에는 건조실 열기로 굳은 굳은살이 남아 있다. 이름 동늘솔과 식별자 K322는 고정이다.",
            "붕괴 전 삶": "붕괴 전 그는 처방 이중확인 전표와 냉장 로트를 같은 손수레에 실었다. 약령치유문의 로트 불량 공지가 독점 구매서에 가려지지 않게 하려는 야망이었고, 초안은 조제실 뒷문 칠판에 적혔다. 스승에게 약속한 말—냄새로만 진위를 가리지 말라—가 빚의 씨앗이 된다. 상인들이 급행 값을 불러도 그는 원산지 도장 없는 포장을 싣지 않았다.",
            "가문·기업·공동체": "약령치유문(HP06)은 처방 이중확인 의무를 내세워 동늘솔의 운송 창구에 참관을 요청했다. 그는 길드 참관만 받고 독점 구매 문장은 거절했다. 공동체 위치는 심달호의 약재 시세와 원미루의 위조약 탐사 보고를 같은 날에 맞춘 기록으로 증명됐다. 실재 제약 상호는 송장에 올리지 않는다.",
            "붕괴의 상처": "붕괴 날 위조약 세 상자가 진본 인장으로 위장되어 들어왔다. 동늘솔은 청량리 대합실 손수레를 잠그고 매하루의 피해자 증언이 도착할 때까지 출고를 막았다. 공포는 오염 로트 한 줄이 의무호송 전체를 중증 병상으로 바꾸는 그림이었다. 경보 이후 LOSS 약재표 한가운데서 그의 펜이 멈췄다.",
            "생존 전환점": "전환점은 오염 표본 사본을 서해곡창전구(XT02) 방역 사절에 넘길지, 가짜 약 유통 경로를 시장에서 먼저 공개할지 고른 순간이다. 곡창 쪽 전갈이 저울 그늘에 겹치자 그는 냉장 슬롯을 두 칸 줄였다. 표본을 넘기면 의정 신뢰가 살아나고, 경로를 공개하면 운송상 자신과 거래 반이 함께 흔들린다. 결정은 K322-TURN이다.",
            "현재 지위": "현재 동늘솔은 약령의정동맹 약재 운송 물류상으로 건조실 점호와 로트 큐를 지킨다. 면허·길드 참관·병상 인계 로그가 지위를 유지한다. 치유문이 전속 원료 노선을 요구해도 그는 반려하고 Cast 칸과 전표를 맞춘다. 손수레 자물쇠는 두 키로, 하나는 의정회, 하나는 HP06 참관함이다.",
            "비밀·빚·죄책감": "비밀은 스승 약속을 어긴 채 냄새로만 가렸던 새벽 로트 한 박스다. 죄책감은 살린 병상 수와 그 새벽 호송이 늦어 악화된 환자 한 명 사이에서 자란다. 부분 공개 재심만 남겼다. SECRET는 탁은솔의 가짜 약 증언과 동시에만 열린다.",
            "관계 공동과거": "심달호와 맞춘 시세는 계약이었고, 원미루의 탐사 보고를 받은 밤은 동맹이었다. 은채윤의 진료 의무 인계와는 같은 로트에 다른 우선을 둔 긴장이 남았다. 배신만으로 끝나지 않았고 같은 건조실에서 구원이 겹친 아침도 있다. 끝점은 STORY-B002-K322다.",
            "3막 개인 서사선": "1막에서 동늘솔은 위장 인장 상자를 손수레 봉인으로 막는다. 2막에서 HP06 이중확인과 XT02 방역 요청을 저울 그늘에서 저울질한다. 3막에서 출고 보류의 대가를 병상 대기 시간으로 치른다. 서사선은 STORY-B002-K322로 고정된다.",
            "분기 결말": "결말 α에서 동늘솔은 표본 호송으로 공개 방역 연속을 고른다. 결말 β에서 유통 경로 공개를 미뤄 거래 반과 비밀 로트를 지킨다. 의정동맹 슬롯은 유지되며 분기는 K322-OUT이다. 플레이는 표본 호위 또는 경로 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위장 인장 상자에 손수레를 잠근다"
            },
            {
              "act": 2,
              "summary": "HP06 확인과 XT02 방역을 저울 그늘에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "출고 보류 대가로 병상 대기를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K322-OUT-A",
              "summary": "표본 호송으로 방역 연속"
            },
            {
              "id": "K322-OUT-B",
              "summary": "경로 공개 보류로 비밀 로트 유지"
            }
          ]
        },
        {
          "id": "K347",
          "name": "원예나",
          "links": {
            "house": "HP07",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B002-K347"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "구의 교량 잔교 난간에서 원예나는 풍속계 숫자보다 먼저 발밑 진동을 느낀다. 아차구의관문국의 교량 통과 물류상으로, 닫힌 다리 위 짐과 열린 수운 슬롯을 동시에 계산한다. 한국 기원으로 한강변에서 자랐고, 웃음은 짧지만 통행 스탬프를 주머니에 넣어 세 번 확인하는 손버릇이 있다. 이름 원예나와 식별자 K347는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그녀는 풍속 폐쇄 기준과 수운 우회 송장을 한 노트에 나란히 적었다. 한강교량공회가 수운 우선 압력에 다리를 함부로 열지 않게 하려는 야망이었고, 초안은 초소 난간에 클립으로 고정됐다. 아버지에게 보낸 전갈—바람이 기준을 넘으면 값을 받지 말라—가 빚의 원형이 된다. 상단이 급행 통행료를 제시해도 그녀는 풍속 로그 없는 스탬프를 찍지 않았다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 폐쇄 기준 의무를 내세워 원예나의 통과 창구에 참관을 요청했다. 그녀는 공회 참관만 받고 전속 수운 문장은 거절했다. 공동체 위치는 안기준의 교량 감독 일지와 동새봄의 하부 탐사 보고를 같은 교대에 맞춘 기록으로 증명됐다. 실재 상호는 통행 원장에 올리지 않는다.",
            "붕괴의 상처": "붕괴 날 상류 부유물 세 덩이가 동시에 교각을 때렸다. 원예나는 구의 잔교 게이트를 잠그고 탁윤재의 사고 증언이 오기 전엔 통과 스탬프를 주지 않았다. 공포의 핵은 위조 풍속 로그 한 장이 피난 인파를 다리 위로 밀어 넣는 장면이었다. 사이렌 이후 LOSS 통행표 끝에서 그녀의 스탬프가 멈췄다.",
            "생존 전환점": "전환점은 폐쇄 로그 사본을 해협삼로전구(XT03) 수운 중계에 넘길지, 위조 로그 발급 경로를 초소에서 먼저 열지 고른 순간이다. 해협 쪽 봉인 요청이 난간에 겹치자 그녀는 수운 슬롯을 한 칸 닫았다. 사본을 넘기면 관문 신뢰가 살아나고, 경로를 열면 물류상 자신과 통과 반이 함께 표적이 된다. 선택은 K347-TURN이다.",
            "현재 지위": "지금도 원예나는 아차구의관문국 교량 통과 물류상으로 잔교 점호와 스탬프 큐를 지킨다. 지위는 통행 면허·공회 참관·풍속 로그로만 유지된다. 교량공회가 전속 수운 노선을 요구해도 거절하고 Cast 칸과 노트를 맞춘다. 게이트 열쇠는 두 자루, 초소와 HP07 참관함이 나눈다.",
            "비밀·빚·죄책감": "비밀은 아버지 전갈을 숨긴 채 기준 직전 풍속에 한번 열어 준 새벽 스탬프다. 죄책감은 살린 수운 짐과 그 새벽 난간에 남은 미회수 이름 사이에서 자란다. 부분 공개 재심만 남겼다. SECRET는 매서담의 통행 증언과 동시에만 열린다.",
            "관계 공동과거": "안기준과 맞춘 감독 일지는 계약이었고, 동새봄의 하부 탐사는 동맹이었다. 문하율의 능선 초병 교대와는 같은 관문에서 다른 폐쇄 시각을 주장한 긴장이 남았다. 배신만으로 끝나지 않았고 같은 잔교에서 구원이 겹친 저녁도 있다. 끝점은 STORY-B002-K347이다.",
            "3막 개인 서사선": "1막에서 원예나는 부유물 충돌을 게이트 봉인으로 맞는다. 2막에서 HP07 폐쇄 기준과 XT03 중계 요청을 난간 노트에서 저울질한다. 3막에서 통과 보류의 대가를 수운 적체로 치른다. 서사선 ID는 STORY-B002-K347이다.",
            "분기 결말": "결말 α에서 원예나는 풍속 폐쇄 로그를 해협 중계 호송에 실어 관문 공개의 연속을 고른다. 결말 β에서 그녀는 위조 로그 인쇄기를 초소에서 멈추게 해 개인 스탬프 권한과 새벽 기록을 지킨다. 아차구의관문국의 16국 자리는 유지되며 갈라지는 표식만 K347-OUT이다. 플레이 개입은 로그 호위 열차 탑승 또는 초소 압수 수색 중 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "부유물 충돌에 잔교 게이트를 잠근다"
            },
            {
              "act": 2,
              "summary": "HP07 기준과 XT03 중계를 난간에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "통과 보류 대가로 수운 적체를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K347-OUT-A",
              "summary": "폐쇄 로그 호송으로 관문 연속"
            },
            {
              "id": "K347-OUT-B",
              "summary": "위조 추적 우선으로 비밀 스탬프 유지"
            }
          ]
        },
        {
          "id": "K372",
          "name": "동미온",
          "links": {
            "house": "HP08",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B002-K372"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 대형 창고 냉기 속에서 동미온은 경매 낙찰 호보다 먼저 온도 로그 용지를 만진다. 가락잠실배급국의 가락 도매 물류상으로, 얼음 슬롯과 호송 입찰을 한 원장에 묶는 사람이다. 한국 기원으로 동남 시장 골목에서 자랐고, 말투는 빠르지만 장갑을 끼기 전 손등으로 벽 결로를 확인한다. 이름 동미온과 식별자 K372는 바뀌지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 전력 슬롯 순환표와 청과 낙찰 전표를 같은 클립에 꽂았다. 시장냉동상단이 모터를 빼가기 전 온도 로그를 남기게 하려는 야망이었고, 초안은 얼음 창고 철문에 붙였다. 누이에게 쓴 메모—빈 슬롯을 군량에 팔지 말라—가 빚의 씨앗이 된다. 경매사가 급행 호를 불러도 그는 온도 인쇄본 없는 출고를 승인하지 않았다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 슬롯 순환 의무를 내세워 동미온의 도매 창구에 참관을 요청했다. 그는 상단 참관만 받고 전속 군량 문장은 거절했다. 공동체 위치는 은태호의 경매 원장과 라진우의 창고 경비 일지를 같은 교대에 맞춘 기록으로 증명됐다. 실재 유통 상호는 송장 머리에 올리지 않는다.",
            "붕괴의 상처": "붕괴 날 냉동고 세 칸의 전력이 동시에 떨어졌다. 동미온은 가락 철문을 잠그고 매리울의 유찰 증언이 오기 전엔 군량 징발 송장을 받지 않았다. 공포의 핵은 위조 온도 로그 한 장이 피난 배급 전체를 상한 재고로 덮는 장면이었다. 방송 이후 LOSS 재고표 한가운데서 그의 클립이 멈췄다.",
            "생존 전환점": "전환점은 온도 로그 사본을 원양신탁전구(XT05) 식량 중계에 넘길지, 위조 로그 인쇄 경로를 창고에서 먼저 밝힐지 고른 순간이다. 신탁 쪽 전갈이 철문에 겹치자 그는 입찰 시계를 멈췄다. 사본을 넘기면 배급 신뢰가 살아나고, 경로를 밝히면 도매상과 낙찰 반이 함께 흔들린다. 선택은 K372-TURN이다.",
            "현재 지위": "현재 동미온은 가락잠실배급국 가락 도매 물류상으로 창고 점호와 입찰 큐를 지킨다. 면허·상단 참관·온도 인쇄 로그가 지위를 유지한다. 냉동상단이 전속 슬롯을 요구해도 반려하고 Cast 칸과 원장을 맞춘다. 철문 열쇠는 두 자루, 경매조와 HP08 참관함이 나눈다.",
            "비밀·빚·죄책감": "비밀은 누이 메모를 숨긴 채 한번 군량에 내준 빈 슬롯 기록이다. 죄책감은 살린 배급 줄과 그 날 상한 청과를 받은 가구 사이에서 자란다. 부분 공개 재심만 남겼다. SECRET는 석오름의 호송 유찰 증언과 동시에만 열린다.",
            "관계 공동과거": "은태호와 맞춘 경매 원장은 계약이었고, 라진우의 경비 일지는 동맹이었다. 남시윤의 청과동 시세와는 같은 창고에서 다른 슬롯 우선을 둔 긴장이 남았다. 배신만으로 끝나지 않았고 같은 냉기 속에서 구원이 겹친 새벽도 있다. 끝점은 STORY-B002-K372다.",
            "3막 개인 서사선": "1막에서 동미온은 삼칸 정전을 철문 봉인으로 맞는다. 2막에서 HP08 순환 의무와 XT05 중계 요청을 원장 클립에서 저울질한다. 3막에서 입찰 정지의 대가를 배급 지연으로 치른다. 서사선은 STORY-B002-K372로 고정된다.",
            "분기 결말": "결말 α에서 동미온은 온도 인쇄본을 신탁 식량 중계에 넘겨 배급 원장의 공개 연속을 택한다. 결말 β에서 그는 위조 인쇄 경로의 철문 키를 회수해 개인 클립 원장과 빈 슬롯 비밀을 지킨다. 가락잠실배급국 배정은 지우지 않으며 갈림 식별만 K372-OUT으로 남는다. 플레이 선택은 인쇄본 호송 호위 또는 창고 키 회수 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "삼칸 정전에 철문을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP08 순환과 XT05 중계를 원장에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "입찰 정지 대가로 배급 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K372-OUT-A",
              "summary": "온도 로그 호송으로 배급 연속"
            },
            {
              "id": "K372-OUT-B",
              "summary": "위조 추적 우선으로 비밀 슬롯 유지"
            }
          ]
        },
        {
          "id": "K057",
          "name": "서이안",
          "links": {
            "house": "HC03",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B002-K057"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 밀폐실험동 방풍실에서 서이안은 결론 문장보다 먼저 재현 기록 칸을 채운다. 마곡연구평의회의 생명안전 연구책임자로, 검증되지 않은 권위보다 위험한 실험을 더 싫어한다. 한국 출생 다문화 가정에서 자랐고, 집에서는 부모의 서로 다른 언어로 안전 수칙을 되풀이 들었으며 그 이중 설명이 현장 거절권의 버릇이 됐다. 이름 서이안과 식별자 K057는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그녀는 기술원장 초안에 재현 가능한 기록과 안전심사 거부권을 한 줄씩 넣었다. 연구자와 자료를 국가 소유물이 아닌 서울 공동재산으로 남기려는 야망이었고, 초안은 방풍실 화이트보드에 먼저 적혔다. 어머니 언어로 쓴 메모—이름을 병상에 묶지 말라—가 훗날 빚의 결을 만든다. 평의원이 긴급 인준을 재촉해도 그녀는 재현 칸이 비면 도장을 주지 않았다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 생체 데이터셋 격리 키를 내세워 서이안의 심사 창구에 자리를 요구했다. 그녀는 실험 일지를 병상 이름과 분리한 참관만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 정하린의 현장 거부권과 최은재의 공개 계약 범위를 같은 심의에서 맞춘 기록으로 증명됐다. 실재 회사 상호는 원장 본문에 올리지 않는다.",
            "붕괴의 상처": "붕괴 날 뚝도 수질 검사망이 멈추자 연구자 파견과 후계 인준이 한 거래로 묶였다. 서이안은 방풍실 키를 잠그고 고초윤의 수질 공개 증언이 도착할 때까지 파견 날인을 보류했다. 공포의 핵은 보호 명분의 군사감독 한 줄이 연구자를 인질 직능으로 고정하는 장면이었다. 경보 이후 LOSS 시료 목록 끝에서 그녀의 펜이 멈췄다.",
            "생존 전환점": "전환점은 오염 표본과 재현 사본을 서해곡창전구(XT02) 방역 중계에 넘길지, 독점 평의원의 거래 문장을 먼저 공개 심의에 올릴지 고른 순간이다. 곡창 쪽 요청이 화이트보드에 겹치자 그녀는 파견 시계를 멈췄다. 표본을 넘기면 공동기술 신뢰가 살아나고, 거래를 공개하면 책임자 자신과 제자 임초원의 위치가 함께 흔들린다. 선택은 K057-TURN이다.",
            "현재 지위": "지금도 서이안은 마곡연구평의회 생명안전 연구책임자로 방풍실 점호와 재현 큐를 지킨다. 지위는 면허·심사 거부권 로그·삼원 심의 기록으로만 유지된다. 백광이 전속 데이터 소유를 요구해도 거절하고 Cast 칸과 일지를 맞춘다. 격리 키는 두 자루, 평의회와 HC03 참관함이 나눈다.",
            "비밀·빚·죄책감": "비밀은 어머니 메모를 지키려다 하루 늦춘 시료 공개 시각이다. 죄책감은 살린 연구 반과 그 지연으로 오염이 번진 골목 수전 사이에서 자란다. 부분 공개 재심만 남겼다. SECRET는 배서율의 가짜 약품 피해자 증언과 동시에만 열린다.",
            "관계 공동과거": "정하린과 집행한 거부권은 지휘 동맹이었고, 최은재와 설계한 공개 계약은 사제 계약이었다. 김도하의 주민 삼원 심의와는 같은 테이블에서 다른 속도로 밀고 당긴 긴장이 남았다. 배우진의 군사감독 요구는 거절로 남았고 임초원 평가는 후견으로 남았다. 끝점은 STORY-B002-K057이다.",
            "3막 개인 서사선": "1막에서 서이안은 수질망 정지를 방풍실 봉인으로 맞는다. 2막에서 HC03 격리 의무와 XT02 중계 요청을 재현 칸에서 저울질한다. 3막에서 날인 보류의 대가를 파견 지연으로 치른다. 서사선 ID는 STORY-B002-K057로 고정된다.",
            "분기 결말": "결말 α에서 서이안은 표본 호송으로 공동기술 공개 연속을 고른다. 결말 β에서 독점 거래 폭로를 우선해 심사 독립과 비밀 지연 기록을 지킨다. 마곡 슬롯은 유지되며 분기는 K057-OUT이다. 플레이는 표본 회수 또는 평의 설득이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "수질망 정지에 방풍실을 잠근다"
            },
            {
              "act": 2,
              "summary": "HC03 격리와 XT02 중계를 재현 칸에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "날인 보류 대가로 파견 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K057-OUT-A",
              "summary": "표본 호송으로 공동기술 연속"
            },
            {
              "id": "K057-OUT-B",
              "summary": "독점 거래 폭로로 심사 독립 유지"
            }
          ]
        },
        {
          "id": "K085",
          "name": "임하준",
          "links": {
            "house": "HC04",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B002-K085"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "뚝도 펌프실 금속 계단에서 임하준은 압력계 눈금보다 먼저 패킹 마모 소리를 듣는다. 뚝도공방연합의 펌프기술 총관으로 기록되지만 현재는 실종 상태이며, 살아 있을 때의 손버릇만 공방에 남아 있다. 한국 출생 다문화 가정에서 자랐고, 어린 시절 이웃 공방의 다른 말투로 공구 이름을 외우던 경험이 규격 통합 집착의 뿌리가 됐다. 이름 임하준과 식별자 K085는 유언 이후에도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 물과 부품 규격을 통합해 어느 국가도 생명선을 단독으로 끊지 못하게 하려 했다. 핵심 공정을 경쟁 공방에 나누고 마지막 조립법만 직접 보관하는 야망이었고, 초안은 펌프실 벽 사물함에 봉인됐다. 양자 임초원에게 남긴 짧은 음성—혈통으로 총관을 주지 말라—가 빚과 희망의 이중 씨앗이 된다. 보호 제안을 받아도 그는 군사감독 문장을 조립법에 넣지 않았다.",
            "가문·기업·공동체": "통맥에너지연합(HC04)은 지하 열원 접속권을 내세워 임하준의 총관 창구에 의무 참관을 요구했다. 그는 여열을 팔기 전 펌프 예비 전력을 채우는 헌장만 인정하고 전속 국가 소유를 거절했다. 공동체 위치는 한재목과의 급수계약과 박세린 가문 공정의 후견 경계를 같은 원장에 적은 날로 증명됐다. 실재 상호는 조립법 본문에 올리지 않았다.",
            "붕괴의 상처": "개막 직전 정수 펌프 점검 중 그는 사라졌고 서로 다른 세 유언이 동시에 접수됐다. 공방 사람들은 그가 금고를 잠근 채 LOSS 목록의 마지막 줄을 남겼다고만 증언한다. 공포의 핵은 위조 유언 한 장이 기술가문을 세습국가로 고정하는 장면이었고, 그 공포는 실종 후에도 뚝도 전체를 옥죈다. 음성기록의 편집 흔적이 발견되기 전까지 그의 자리는 빈 압력계로만 남았다.",
            "생존 전환점": "전환점은 실종 전 그가 남긴 갈림이다. 봉인 조립법 사본을 해협삼로전구(XT03) 기록 호송에 실을지, 위조 날인 용의 경로를 공방 안에서 먼저 끊을지. 호송을 택하면 공공 규격은 살아남지만 야간 정비 조가 빠지고, 경로를 끊으면 한쪽 가문이 해석을 독점한다. 후손과 플레이어에게 남은 이름은 K085-TURN이다.",
            "현재 지위": "현재 임하준의 공식 지위는 실종 총관이며 펌프실 점호 명단에만 빈칸으로 올라간다. 면허와 참관 로그는 동결됐고, 통맥의 전속 요구는 대행 창구가 반려한다. Cast 프로필은 실종 상태를 유지한 채 원장 시점만 갱신한다. 사물함 열쇠는 두 자루 중 한 자루만 기록청 참관함에 넘어가 있다.",
            "비밀·빚·죄책감": "비밀은 임초원만 읽을 수 있는 암호화 정비일지와, 공개 지명을 미룬 채 남긴 침묵이다. 죄책감의 자리는 살린 급수 반과 지명 지연으로 흔들린 공방 신뢰 사이에 남아 후계자들에게 전염된다. 부분 공개 절차만 유언 옆에 첨부돼 있다. SECRET는 조하린이 지키는 문서고 삼본과 동시에만 열린다.",
            "관계 공동과거": "한재목과 맺은 급수계약은 동맹이었고, 박세린 가문과의 공정 후견은 친족 경계였다. 배우진의 보호 제안은 거절로 남았고 임초원에 대한 애정은 공개 지명 없이 남았다. 박누리가 배운 세정 공정은 사제로 이어진다. 관계 원장 끝점은 보존된 채 STORY-B002-K085에 연결된다.",
            "3막 개인 서사선": "1막에서 임하준의 부재는 세 유언의 동시 접수로 드러난다. 2막에서 HC04 의무와 XT03 호송 요청이 빈 총관 자리에서 충돌한다. 3막에서 조립법 봉인의 대가를 공방 분열 위험으로 치른다. 서사선 식별자는 STORY-B002-K085로 고정된다.",
            "분기 결말": "결말 α에서 조사 라인은 조립법 사본 호송을 우선해 공공 규격 연속을 고른다. 결말 β에서 위조 경로 차단을 우선해 가문 해석 독점 저지를 고른다. 어느 쪽도 뚝도 슬롯을 삭제하지 않으며 분기는 K085-OUT이다. 플레이는 생존 흔적·진본 유언·공모자 추적 중 전환점을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "실종과 세 유언 접수로 총관 빈자리가 열린다"
            },
            {
              "act": 2,
              "summary": "HC04 의무와 XT03 호송이 빈자리에서 충돌한다"
            },
            {
              "act": 3,
              "summary": "조립법 봉인 대가로 공방 분열 위험을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K085-OUT-A",
              "summary": "조립법 호송으로 공공 규격 연속"
            },
            {
              "id": "K085-OUT-B",
              "summary": "위조 경로 차단으로 가문 독점 저지"
            }
          ]
        },
        {
          "id": "K267",
          "name": "조우찬",
          "links": {
            "house": "HC08",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B002-K267"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 정비창 작업 발판 위에서 조우찬은 공구 소리보다 먼저 조원 숨결의 흐트러짐을 듣는다. 창동차륜방의 작업 반장으로, 차륜 공정과 부상을 한 교대 일지에 함께 적는다. 중국계 디아스포라 가정에서 서울로 이어진 삶을 살며, 집에서는 부모의 말과 현장의 말을 바꿔 가며 안전 구호를 외쳤고 그 번역 버릇이 반 지휘의 리듬이 됐다. 이름 조우찬과 식별자 K267는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 수리 규격을 작업반에 공개 적용해 원로 지휘에만 의존하지 않으려 했다. 김도윤과 공정을 나누는 야망이 있었고, 초안은 발판 옆 철판에 분필로 적혔다. 부모에게 보낸 음성—이름 때문에 출입을 막지 말라—가 빚의 결을 만든다. 시험 차륜이 새어 나가도 그는 조원 명단을 숨기지 않고 일지에 남겼다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 통합 방호키를 내세워 조우찬의 작업 조 출입에 참관을 요구했다. 그는 헌장 참관만 받고 전속 징발 문장은 거절했다. 공동체 위치는 감두의 정문 출입과 국두의 사고 일지, 봉복의 부상 처리를 같은 교대에 맞춘 기록으로 증명됐다. 실재 상호는 일지 머리에 올리지 않는다.",
            "붕괴의 상처": "붕괴 날 시험 차륜 유출 경보와 북문 호송 요청이 동시에 울렸다. 조우찬은 발판 전원을 끊고 강다은의 유출 의혹 증언이 정리될 때까지 조 출고를 막았다. 공포의 핵은 위조 출입 패스 한 장이 작업반을 궤도 징발 인력으로 바꾸는 장면이었다. 사이렌 이후 LOSS 조원 명단 한줄에서 그의 분필이 멈췄다.",
            "생존 전환점": "전환점은 유출 일지 사본을 임진관문전구(XT01) 기술 중계에 넘길지, 원한의 대상인 유출 경로를 정문에서 먼저 봉쇄할지 고른 순간이다. 관문 쪽 전갈이 철판에 겹치자 그는 교대 시계를 멈췄다. 사본을 넘기면 반 신뢰가 살아나고, 봉쇄를 택하면 반장 자신과 조원이 함께 표적이 된다. 선택은 K267-TURN이다.",
            "현재 지위": "현재 조우찬은 창동차륜방 작업 반장으로 발판 점호와 교대 일지를 지킨다. 지위는 작업 면허·참관 로그·부상 인계로만 유지된다. 성화가 전속 징발을 요구해도 반려하고 Cast 칸과 일지를 맞춘다. 정문 키는 두 자루, 반장실과 HC08 참관함이 나눈다.",
            "비밀·빚·죄책감": "비밀은 부모 음성을 숨긴 채 한번 덮어 준 출입 패스 기록이다. 죄책감은 살린 조원 수와 그 덮개로 늦어진 결함 공개 사이에서 자란다. 부분 공개 재심만 남겼다. SECRET는 추지훈의 정비 불량 폭로와 동시에만 열린다.",
            "관계 공동과거": "김도윤과 나눈 공정은 지휘 동맹이었고, 강민서와 맞춘 수리 규격은 계약이었다. 강다은에 대한 원한은 유출 의혹에서 자라났고 소봉·국두·봉복은 실무로 남았다. 배신만으로 끝나지 않은 교대도 있다. 끝점은 STORY-B002-K267이다.",
            "3막 개인 서사선": "1막에서 조우찬은 유출 경보를 발판 전원 차단으로 맞는다. 2막에서 HC08 참관과 XT01 중계를 철판 일지에서 저울질한다. 3막에서 출고 보류의 대가를 교대 적체로 치른다. 서사선은 STORY-B002-K267로 고정된다.",
            "분기 결말": "결말 α에서 조우찬은 일지 호송으로 공개 공정 연속을 고른다. 결말 β에서 유출 경로 봉쇄를 우선해 조원 보호와 비밀 패스를 지킨다. 차륜방 슬롯은 유지되며 분기는 K267-OUT이다. 플레이는 일지 호위 또는 경로 봉쇄다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "유출 경보에 발판 전원을 끊는다"
            },
            {
              "act": 2,
              "summary": "HC08 참관과 XT01 중계를 일지에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "출고 보류 대가로 교대 적체를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K267-OUT-A",
              "summary": "일지 호송으로 공개 공정 연속"
            },
            {
              "id": "K267-OUT-B",
              "summary": "경로 봉쇄 우선으로 조원·비밀 패스 유지"
            }
          ]
        },
        {
          "id": "H02",
          "name": "서린",
          "links": {
            "house": "HC02",
            "theater": "XT02",
            "scenarios": [
              "STORY-B002-H02"
            ],
            "profile_anchor": "Cast-Index.md#S02",
            "custodian": "K029"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "S02 충전 칸 야간 조명 아래에서 서린(린)은 출입 로그보다 먼저 배터리 잔량 경고음을 확인한다. 인간형 보조 골격과 교체형 손모듈을 가진 합성 존재로, 야간 시야는 제한되고 무한 에너지는 없다. 호출명은 린이며 표시 이름 서린과 식별자 H02는 포크 이후에도 재번호되지 않는다. 법적 보관은 HC02 공동·시민 참관 봉인이며 양도에는 삼자 서명이 필요하다.",
            "붕괴 전 삶": "붕괴 전 서린의 가동 목표는 S02 구역 연속과 담당 인간 안전이었고, 기억은 교대 단위 스냅샷만 유지됐다. 장기 완전 기억은 금지됐고 포크 시 분기 로그가 필수였다. 강민서의 주정비 아래에서 마모 부품 할당표를 배웠고, 그 할당 거부가 훗날 빚처럼 남는다. 교차 시설 루트는 기본 차단이었으며 비상 시에도 읽기 전용만 허용됐다.",
            "가문·기업·공동체": "해륜기동문(HC02)은 배터리 셀 순환을 내세워 서린의 충전 칸 출입에 참관을 둔다. 서린은 당직 로그에 출입을 남기고 전체 망 권한 요청을 하지 않으며 구역 키만 요구한다. 공동체 위치는 K029 강민서의 잔량 확인과 K011 교대 협력 로그로 증명된다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는다.",
            "붕괴의 상처": "붕괴 날 충전 칸 센서 공백과 관측 난간 경보가 동시에 울렸다. 서린은 구역 망만 유지한 채 전체 재연결을 거부하고 인간 승인 전까지 오프라인 격리 절차를 따랐다. 공포의 핵은 스냅샷 없이 장기 기억을 강제로 열어 타 구역 키를 삼키는 명령이었다. LOSS 일정표의 빈 칸 앞에서 손모듈 관절이 멈췄다.",
            "생존 전환점": "전환점은 제한 재가동 요청을 서해곡창전구(XT02) 연계 없이 S02 안에서 끝낼지, 인간 승인 로그를 외부 중계에 실어 부분 재연결 범위를 넓힐지 고른 순간이다. 재가동을 구역 안에 가두면 안전은 커지지만 일정 정체가 길어지고, 중계를 열면 분기 로그 노출 위험이 커진다. 결정은 H02-TURN이며 무한 에너지 해금 분기는 없다.",
            "현재 지위": "현재 서린은 S02 충전 칸 당직 합성으로 출입 로그와 스냅샷 큐를 지킨다. 지위는 세습이 아니라 보관 봉인·삼자 서명·감사 입회로만 유지된다. HC02가 교차 시설 키를 요구해도 거절하고 Cast 합성 칸과 당직 로그를 맞춘다. 배터리 슬롯 열쇠는 강민서와 HC02 참관함이 나눈다.",
            "비밀·빚·죄책감": "비밀은 교대 스냅샷 밖에 남은, 승인 없이 한 번 읽은 난간 센서 잔상이다. 죄책감 유사 신호는 살린 구역 일정과 그 잔상 때문에 지연된 인간 교대 사이에서 발생한다. 전부 공개 대신 인간 승인 후 부분 롤백만 허용한다. SECRET 키는 이중 인간 서명 없이는 열리지 않는다.",
            "관계 공동과거": "강민서의 주정비는 보관 책임이었고, K011과의 교대는 작업 협력이었다. HC02 감사 입회는 계약이었으며 어느 관계도 제어권 양도로 끝나지 않았다. 일탈 시 격리→롤백→인간 승인 후 부분 재연결 순서는 관계 원장에 고정된다. 끝점은 STORY-B002-H02다.",
            "3막 개인 서사선": "1막에서 서린은 센서 공백을 오프라인 격리로 맞는다. 2막에서 HC02 참관과 인간 승인 범위를 충전 칸에서 저울질한다. 3막에서 제한 재가동의 대가를 일정 정체 또는 분기 로그 노출로 치른다. 서사선 ID는 STORY-B002-H02로 고정된다.",
            "분기 결말": "결말 α에서 서린은 인간 승인 아래 제한 재가동을 고른다. 결말 β에서 장기 오프라인 보관으로 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다. 분기 식별은 H02-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "센서 공백에 오프라인 격리로 응답한다"
            },
            {
              "act": 2,
              "summary": "HC02 참관과 인간 승인 범위를 협상한다"
            },
            {
              "act": 3,
              "summary": "제한 재가동 대가를 정체 또는 로그 노출로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "H02-OUT-A",
              "summary": "인간 승인 하 제한 재가동"
            },
            {
              "id": "H02-OUT-B",
              "summary": "장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B003": {
      "id": "B003",
      "actors": [
        {
          "id": "K396",
          "name": "선초별",
          "links": {
            "house": "HC11",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B003-K396"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 계약 시장 저울대 앞에서 선초별은 젖은 잉크가 마르기 전에 움직이는 사본을 위조로 부른다. 강남 계약서 시장 물류상으로 하서진의 실무 담당을 맡되, 구두 운임은 장부에 올리지 않는다. 한국 기원으로 수서강남협약도시 생활권에서 자랐고, 상자 무게가 원장과 다르면 즉시 저울을 갈아 끼운다. 표시 이름 선초별과 불변 식별자 K396는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 종료조건·감사권·인질 대체 보증이 빠진 초안을 공개 운송 원장에 올리지 않는 습관을 만들었다. 약소국이 같은 종이로 서명하게 하려는 야망이었고, 초안 비교표는 늘 새벽 저울대 옆에 먼저 붙였다. 동생에게 남긴 쪽지—마침표 없는 문장은 싣지 말라—가 훗날 빚의 원형이 된다. 중개인이 강국 한쪽 문구만 남긴 정서본을 내밀어도 그는 봉함 끈을 풀지 않았다.",
            "가문·기업·공동체": "백야배송단(HC11)은 야간 호송 칸을 빌려 조약 사본을 먼저 실으려 했으나, 선초별은 실재 회사 상호를 본문에 올리지 않는 후계 창구만 인정했다. 군사 면제 칸은 정유라의 빨간 인장이 있을 때만 상자에 넣었고, HC11 참관인은 정기 등재만 요구할 수 있었다. 공동체 위치는 자격증이 아니라 비교표 사본을 양쪽 창구에 동시에 보낸 기록으로 증명됐다. 가문 창구가 단독 해석 방송을 내밀면 그는 종료일 공란을 이유로 무효를 선언했다.",
            "붕괴의 상처": "붕괴 주 세 강국이 서로 다른 급수계약서를 같은 시각에 수서 서고로 보냈다. 선초별은 사본 반출을 정지하고 영마온의 비교표가 끝날 때까지 상자를 봉했다. 공포의 핵은 서기가 베낀 초안 한 장이 대리 문서로 유통되어 공동교섭이 빈 껍데기가 되는 장면이었다. 경보음이 끊긴 뒤에도 그는 LOSS 목록의 운송 칸을 읽지 못한 채 저울 장갑을 벗지 않았다.",
            "생존 전환점": "전환점은 세 초안을 한 장의 비교표로 묶을지, 위조 정서본의 발급 경로를 먼저 열지 고른 순간이다. 해협삼로전구(XT03)에서 들어온 봉인 요청이 저울대에 겹치자 계산이 달라졌다. 비교표를 끝까지 호송하면 약소국 공동 서명은 살아남지만 야간 호송 인원이 빠지고, 위조 경로를 우선하면 한쪽 강국이 문구를 독점한다. 그 선택은 K396-TURN으로 남고, 되돌리면 수서 일부 계약 창구가 멈춘다.",
            "현재 지위": "지금도 선초별은 수서강남협약도시 물류상으로 점호와 운송 원장 큐를 지킨다. 지위는 세습이 아니라 면허·서명·참관 로그로만 유지된다. 백야배송단이 전속 국가 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 저울대 문은 두 열쇠 체계로 바뀌었고 한 자루는 시장, 다른 한 자루는 하서진 창구가 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 마침표가 빠진 초안 묶음이다. 죄책감은 살린 공동 서명 줄과 그 밤에 호출하지 못한 견습 운송원 한 명의 이름 사이에서만 자란다. 전부를 공개하면 수서 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 참관 두 명의 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "하서진의 표준 문장을 사본 운송으로 집행한 밤은 계약이었고, 영마온과 나눈 비교표 순번은 동맹이었다. 하윤목의 관문 원장과는 부속 문서 순서를 놓고 해석 경쟁이 남았다. 어느 관계도 배신만으로 끝나지 않았고, 같은 저울 앞에서 구원이 동시에 열린 적도 있다. 기존 관계 원장의 끝점은 보존된 채 STORY-B003-K396에 연결된다.",
            "3막 개인 서사선": "1막에서 선초별은 세 급수계약 초안의 동시 도착을 저울대에서 다시 만난다. 2막에서 그는 HC11 호송 압력과 XT03 봉인 요청을 한 책상에서 저울질한다. 3막에서 반출 정지의 대가를 야간 계약 창구의 중단 시간으로 치른다. 서사선 식별자는 STORY-B003-K396로 고정된다.",
            "분기 결말": "결말 α에서 선초별은 비교표 호송을 우선해 약소국 공동 서명의 연속성을 고른다. 결말 β에서 그는 위조 정서본 추적을 우선해 개인 생존과 비밀 함을 지킨다. 어느 쪽도 수서강남협약도시의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K396-OUT으로 갈라진다. 플레이 개입은 비교표 호위 또는 위조 추적 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 급수계약 초안 동시 도착에 사본 반출을 정지한다"
            },
            {
              "act": 2,
              "summary": "HC11 호송과 XT03 봉인 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "반출 정지 대가로 야간 계약 창구 중단을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K396-OUT-A",
              "summary": "비교표 호송으로 약소국 공동 서명 연속"
            },
            {
              "id": "K396-OUT-B",
              "summary": "위조 정서본 추적 우선으로 비밀 함 유지"
            }
          ]
        },
        {
          "id": "K009",
          "name": "유세진",
          "links": {
            "house": "HC02",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B003-K009"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신정기지 배차판 앞에서 유세진은 시간표의 빈칸을 사람 이름보다 먼저 메운다. 여의신정수문정부 철도통행 배차관으로, 급수열차를 정치 순위로 미루는 명령을 참지 못한다. 한국 기원으로 신정 유치선 생활권에서 자랐고, 지연 이유를 숨기는 기관사를 가차 없이 강등한다. 이름 유세진과 식별자 K009는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 서부 철도 통행세를 급수 열차 우선 배차로 재편하는 초안을 매일 칠판에 다시 썼다. 수문헌장이 선로 위에서도 작동하게 하려는 야망이었고, 뇌물 배차 적발 목록은 별도 서랍에 가뒀다. 아버지에게 보낸 짧은 전갈—빈칸을 돈으로 메우지 말라—가 훗날 빚의 씨앗이 된다. 용산 중계가 흔들려도 그는 급수 칸을 군수 칸 뒤로 밀지 않았다.",
            "가문·기업·공동체": "해륜기동문(HC02)은 유치선 기동 권한을 내세워 배차판에 참석석을 요구했다. 유세진은 후계 헌장의 참관 칸만 열어 주고 전속 소유 문장은 거절했다. 공동체 안에서의 위치는 공개 통행세 원장을 벽에 붙인 횟수로 증명됐고, 급수·보수·군수 순서를 매일 재선언한 날만 선로가 열렸다. 가문 로고나 실재 상호는 그의 배차 원장에 등장하지 않는다.",
            "붕괴의 상처": "용산 선로가문이 중앙 열차를 억류한 아침, 신정 유치선이 보수열차와 급수열차로 가득 찼다. 유세진은 신정발 급수열차를 우회 편성하며 통행세를 비상 요율로 올렸다. 공포는 중계가 막혀 두 열차가 동시에 갇히고 배차관 직위가 사적 착복의 창구로 팔리는 그림이었다. 경보가 꺼진 뒤 LOSS 목록의 선로 칸에서 그의 분필이 멈췄다.",
            "생존 전환점": "전환점은 우회 선로 허가를 받아 급수를 통과시킬지, 비상 요율의 사적 착복을 먼저 폭로할지 고른 순간이다. 서해곡창전구(XT02) 쪽 곡물 호송 요청이 배차판에 겹치자 그는 유치선 시계를 한 시간 앞당겼다. 우회를 열면 급수는 살아나고, 착복을 밝히면 배차관 자신까지 실각 위험에 오른다. 결정은 K009-TURN에 남는다.",
            "현재 지위": "현재 유세진은 신정기지 배차관으로 점호와 배차 큐를 지킨다. 면허와 참관 로그가 지위를 유지하며, 해륜 쪽 전속 요구는 매번 반려한다. 배차판에는 오늘 만료되는 통행세 전표만 분필로 남긴다. Cast 프로필의 철도 배차 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 아버지 전갈을 숨긴 채 보류한 빈칸 배차 한 줄이다. 죄책감은 살린 급수 행렬과, 그 때문에 하루 늦게 도착한 보수 부품 상자 사이에서 자란다. 완전 고백 대신 공개 원장을 통한 부분 공개만 허용한다. SECRET 열람은 최한결의 보수열차 출고 확인과 동시에만 열린다.",
            "관계 공동과거": "박태겸과 나눈 서부 중계 배차는 계약이었고, 김도윤에게 보낸 차륜 교환 도제는 동맹이었다. 최한결의 보수열차 출고를 배차판에서 보증한 밤은 협력으로 남았다. 같은 유치선에서 한 칸은 구원이 되었고 다른 칸은 차단으로 읽혔다. 관계 원장 끝점은 STORY-B003-K009로 이어진다.",
            "3막 개인 서사선": "1막에서 유세진은 중앙 억류와 유치선 정체를 배차판에서 맞받는다. 2막에서 HC02 참관과 XT02 호송 요청을 급수 우선 시계에 묶는다. 3막에서 우회 또는 폭로 뒤 배차 신용이 치르는 비용을 감수한다. 서사선은 STORY-B003-K009이다.",
            "분기 결말": "결말 α에서 유세진은 우회 선로로 급수 우선을 고른다. 결말 β에서 그는 비상 요율 착복 경로를 공개해 원장 신뢰를 지킨다. 어느 쪽도 여의신정수문정부의 16국 슬롯을 삭제하지 않으며 분기는 K009-OUT이다. 플레이 개입은 우회 허가 또는 착복 폭로 중 하나를 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "중앙 억류로 유치선이 급수·보수에 막힌다"
            },
            {
              "act": 2,
              "summary": "HC02 참관과 XT02 호송을 급수 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "우회 또는 폭로 뒤 배차 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K009-OUT-A",
              "summary": "우회 선로로 급수 우선 통과"
            },
            {
              "id": "K009-OUT-B",
              "summary": "비상 요율 착복 경로 공개"
            }
          ]
        },
        {
          "id": "K037",
          "name": "한지온",
          "links": {
            "house": "HP08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B003-K037"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "금천 배급 솥 앞에서 한지온은 부품 출고를 자랑하는 날에도 저수조 수위를 먼저 확인한다. 서남제작동맹 원수식량 시민대표로, 공복 상태의 숫자 놀음을 용서하지 않는다. 한국 기원으로 금천·구로 생활권에서 자랐고, 자비로워 보이지만 솥 바닥이 보이면 평의회 문을 두드린다. 한지온과 K037는 불변 식별이다.",
            "붕괴 전 삶": "붕괴 전 그는 수리 수출을 원수·식량 장기 계약과 묶는 조항을 평의회 초안에 밀어 넣었다. 자체 생산이 없는 약점을 의결로 메우려는 야망이었고, 배급 솥 수위표는 매일 시장 벽에 붙였다. 어머니에게 남긴 약속—숫자로만 배를 채우지 않겠다—가 훗날 빚의 형태를 띤다. 작업반이 군량 징발을 속삭여도 그는 난민 명부를 조달 행렬에 함께 태웠다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 냉동 신용을 내세워 배급 솥 옆 창구를 요구했다. 한지온은 시민 참관 봉인만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 우물 수위와 솥 공개 횟수로 증명됐고, 조합원 가족과 난민 명부가 같은 행렬에 오른 날만 조달이 열렸다. 실재 상호나 제품명은 그의 원장에 올리지 않는다.",
            "붕괴의 상처": "북부 식량 부족 소문이 금천 배급 솥까지 흔들자 한지온은 부품 수출 중지를 평의회에 올렸다. 여의신정 바지선 배급을 요청하는 동안 흉작과 단수가 겹칠 공포가 먼저 손을 굳혔다. 작업반이 민가를 훑는 군량 징발 밀지가 돌았고, 그는 LOSS 목록의 식량 칸을 읽다 펜을 멈췄다. 솥이 빈 아침, 시민대표 직위가 거래 카드로 불리는 소리가 들렸다.",
            "생존 전환점": "전환점은 조달 행렬을 호송해 솥을 채울지, 군량 징발 밀지를 찾아 중지안을 통과시킬지 고른 순간이다. 서해곡창전구(XT02) 쪽 곡물 우회 제안이 평의회 책상에 겹치자 시계가 빨라졌다. 호송을 택하면 솥은 차지만 수출 창이 닫히고, 밀지를 밝히면 작업반 일부가 등을 돌린다. 선택은 K037-TURN으로 남는다.",
            "현재 지위": "지금도 한지온은 금천 시민대표로 배급 솥과 우물 게시판을 지킨다. 지위는 연서와 공개 수위 로그로만 유지되며 HP08 전속 요구는 반려한다. 평의회 벽에는 오늘 조달 행렬의 출발 시각만 분필로 남긴다. Cast 프로필의 원수식량 칸과 원장을 맞추는 일이 저녁 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 숨긴 채 보류한, 숫자만 남은 배급 시범표 한 장이다. 죄책감은 살린 난민 명부와 그 날 호출하지 못한 외곽 작업반 사이에서 자란다. 전부 공개 대신 시민 연서를 통한 부분 공개만 남겼다. SECRET 키는 박소언의 저수조 봉인 확인과 함께만 열린다.",
            "관계 공동과거": "한재목의 서부 급수계약에 시민 최저선을 요구한 밤은 빚이자 동맹이었고, 백온의 남하 행렬을 수용한 아침은 계약이었다. 박소언의 건물 저수조 봉인을 함께 감시하는 동안 경쟁과 신뢰가 겹쳤다. 같은 솥 앞에서 어떤 나눔은 구원이 되었고 어떤 은폐는 배신으로 남았다. 관계 끝점은 STORY-B003-K037로 연결된다.",
            "3막 개인 서사선": "1막에서 한지온은 식량 소문과 빈 솥을 평의회에서 맞는다. 2막에서 HP08 창구와 XT02 우회 곡물을 최저선 시계에 묶는다. 3막에서 호송 또는 밀지 공개 뒤 작업반 분열 비용을 치른다. 서사선 ID는 STORY-B003-K037이다.",
            "분기 결말": "결말 α에서 한지온은 조달 호송으로 솥을 채운다. 결말 β에서 그는 징발 밀지를 공개해 중지안을 통과시킨다. 어느 쪽도 서남제작동맹 슬롯을 삭제하지 않으며 분기는 K037-OUT이다. 플레이 개입은 행렬 호위 또는 밀지 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "북부 식량 소문으로 금천 솥이 흔들린다"
            },
            {
              "act": 2,
              "summary": "HP08 창구와 XT02 우회 곡물을 저울질한다"
            },
            {
              "act": 3,
              "summary": "호송 또는 밀지 공개 뒤 분열 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K037-OUT-A",
              "summary": "조달 행렬 호송으로 배급 솥 회복"
            },
            {
              "id": "K037-OUT-B",
              "summary": "군량 징발 밀지 공개로 중지안 통과"
            }
          ]
        },
        {
          "id": "K065",
          "name": "임시온",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B003-K065"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 연구기록 서고 입구에서 임시온은 암호 키의 대여 시각까지 기억한다. 마곡연구평의회 통신서고 감사관으로, 기록되지 않은 기술 선물 교환을 절도로 부른다. 한국 기원으로 방화·마곡 생활권에서 자랐고, 성정은 냉정하지만 열람증 모서리를 접어 기한을 표시한다. 임시온과 K065는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 연구자료 열람을 인질 교환이 아니라 감사 가능한 대여 원장으로 바꾸는 초안을 썼다. 공동기술원장 서고를 열려는 야망이었고, 군사 감독 문서는 별치함으로 쫓아냈다. 스승에게 남긴 메모—증인 없는 키는 키가 아니다—가 훗날 빚이 된다. 위조 열람증 소문에도 그는 두 명의 독립 증인 없이는 문을 열지 않았다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 연구 보관 권한을 내세워 서고 참관석을 요구했다. 임시온은 시민 참관 봉인과 안전심사 날인만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 대여 시각 공개 횟수로 증명됐고, 서이안의 재현 원칙을 원장으로 옮긴 날만 열람이 열렸다. 실재 기업 제품명은 감사 원장에 등장하지 않는다.",
            "붕괴의 상처": "임하준 실종 전 음성기록의 편집 흔적이 마곡 서고 사본에서도 보이자 임시온은 열람을 잠갔다. 교차검증만 허용하는 동안, 위조 열람증 한 장이 서고 전체를 선전 자료로 만들 공포가 손을 멈추게 했다. LOSS 목록의 기록 칸 중간에서 펜이 굳었고, 검증 가능한 지식이 무너지는 장면이 눈앞에 어른거렸다. 그는 장갑을 벗지 않은 채 별치함 열쇠만 만지작거렸다.",
            "생존 전환점": "전환점은 원본 키를 회수해 서고를 다시 열지, 위조 열람증 발급자를 먼저 밝힐지 고른 순간이다. 원양신탁전구(XT05) 쪽 자료 신탁 요청이 감사 책상에 겹치자 봉쇄 시계가 앞당겨졌다. 키를 회수하면 연구가 재개되지만 발급 경로가 묻히고, 발급자를 밝히면 감사관 직위가 흔들린다. 결정은 K065-TURN에 남는다.",
            "현재 지위": "현재 임시온은 마곡 서고 감사관으로 대여 원장과 점호를 지킨다. 면허·증인 로그가 지위를 유지하며 HC03 전속 요구는 반려한다. 서고 벽에는 오늘 만료 대여만 분필로 남긴다. Cast 프로필의 연구기록 칸과 원장 시점을 맞추는 일이 교대 시작이다.",
            "비밀·빚·죄책감": "비밀은 그가 스승 메모를 숨긴 채 보류한 편집 흔적 사본이다. 죄책감은 살린 교차검증 줄과 그 밤 호출하지 못한 견습 사서 사이에서 자란다. 완전 고백 대신 이중 증인 창구를 통한 부분 공개만 허용한다. SECRET 열람은 문가람의 공개 시점 합의와 동시에만 열린다.",
            "관계 공동과거": "서이안의 재현 기록 원칙을 원장으로 옮긴 계약, 문가람과 나눈 원본 보존 동맹, 이봄결의 감시 기록을 봉쇄 증거로 보관한 밤이 겹친다. 같은 서고 앞에서 어떤 열람은 구원이 되었고 어떤 봉쇄는 배신으로 읽혔다. 관계 끝점은 보존된 채 STORY-B003-K065에 연결된다. 경쟁은 대여 시각 숫자로만 재측정된다.",
            "3막 개인 서사선": "1막에서 임시온은 편집 흔적 사본으로 열람을 잠근다. 2막에서 HC03 참관과 XT05 신탁 요청을 증인 시계에 묶는다. 3막에서 키 회수 또는 발급자 공개 뒤 서고 신용 비용을 치른다. 서사선은 STORY-B003-K065이다.",
            "분기 결말": "결말 α에서 임시온은 원본 키 회수로 서고를 재개한다. 결말 β에서 그는 위조 열람증 발급자를 밝혀 감사 권한을 지킨다. 어느 쪽도 마곡연구평의회 슬롯을 삭제하지 않으며 분기는 K065-OUT이다. 플레이 개입은 키 호송 또는 발급자 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "음성기록 편집 흔적에 서고 열람을 잠근다"
            },
            {
              "act": 2,
              "summary": "HC03 참관과 XT05 신탁 요청을 증인 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "키 회수 또는 발급자 공개 뒤 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K065-OUT-A",
              "summary": "원본 키 회수로 서고 재개"
            },
            {
              "id": "K065-OUT-B",
              "summary": "위조 열람증 발급자 공개"
            }
          ]
        },
        {
          "id": "K093",
          "name": "장민재",
          "links": {
            "house": "HP01",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B003-K093"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "성동 골목 수도꼭지 앞에서 장민재는 후계자 이름보다 저수조 수위를 먼저 묻는다. 뚝도공방연합 급수 시민대표로, 온화하나 꼭지가 마르면 공방 회의를 사치로 여긴다. 한국 기원으로 성수·성동 생활권에서 자랐고, 수압 게시판 분필을 주머니에 항상 넣고 다닌다. 장민재와 K093는 불변 식별이다.",
            "붕괴 전 삶": "붕괴 전 그는 후계가 공백이어도 성동 급수 최저선을 공방헌장에 못 박는 문구를 다듬었다. 중앙권역 주민이 강국 거래의 숫자가 되지 않게 하려는 야망이었고, 골목별 수압표를 새벽마다 다시 썼다. 이웃에게 남긴 약속—단수 전에 회의를 열겠다—가 훗날 빚의 형태를 띤다. 펌프 출고가 가문 창고로만 흘러도 그는 시민 연서 양식을 먼저 꺼냈다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 수문 참관 권한을 내세워 급수 창구에 자리를 요구했다. 장민재는 시민 감시 봉인만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 수압 게시판 갱신 횟수로 증명됐고, 공방 야간 작업이 시민 감시 아래 열린 날만 비상 저수조가 풀렸다. 실재 상호는 그의 급수 원장에 올리지 않는다.",
            "붕괴의 상처": "중앙 급수계약 만료로 성동 일부 관로 압력이 떨어지자 장민재는 비상 저수조 개방을 요구했다. 총관 실종 뒤 계약 만료가 집단 단수로 번져 공방 노동자가 난민 명부로 떠밀리는 공포가 손을 굳혔다. LOSS 목록의 급수 칸을 읽다 분필이 부러졌고, 시민대표 직위가 거래 숫자로 불리는 소리가 골목에 울렸다. 그는 게시판을 잠근 채 연서함만 지켰다.",
            "생존 전환점": "전환점은 수압 실측표를 가져와 최저선을 관철할지, 게시판 조작을 밝혀 허위 연서를 무효로 할지 고른 순간이다. 해협삼로전구(XT03) 쪽 급수 호송 제안이 평의회 책상에 겹치자 시계가 달라졌다. 실측을 택하면 최저선은 살아나지만 야간 인원이 빠지고, 조작을 밝히면 대표 자신까지 공격받는다. 선택은 K093-TURN으로 남는다.",
            "현재 지위": "지금도 장민재는 성수·성동 급수 시민대표로 게시판과 연서함을 지킨다. 지위는 공개 수압 로그와 시민 서명으로만 유지되며 HP01 전속 요구는 반려한다. 골목 벽에는 오늘 수위만 분필로 남긴다. Cast 프로필의 급수 대표 칸과 원장을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 조작 의심 수압표 초고이다. 죄책감은 살린 골목 급수와 그 밤 호출하지 못한 펌프 견습 사이에서 자란다. 전부 공개 대신 시민 감시 창구를 통한 부분 공개만 남겼다. SECRET 키는 임바다의 최저선 문구 확인과 함께만 열린다.",
            "관계 공동과거": "한소미의 생활 복구 공약을 현장에서 감시한 동맹, 임바다와 나눈 시민 급수권 문구, 김보람의 야간 봉쇄와 충돌한 아침이 한 관로 위에 있다. 같은 꼭지 앞에서 어떤 개방은 구원이 되었고 어떤 봉쇄는 배신으로 남았다. 관계 끝점은 STORY-B003-K093로 연결된다. 신뢰는 수압 숫자 범위로만 다시 잰다.",
            "3막 개인 서사선": "1막에서 장민재는 계약 만료와 수압 하락을 게시판에서 맞는다. 2막에서 HP01 참관과 XT03 호송 제안을 최저선 시계에 묶는다. 3막에서 실측 또는 조작 폭로 뒤 공방 신용 비용을 치른다. 서사선은 STORY-B003-K093이다.",
            "분기 결말": "결말 α에서 장민재는 수압 실측으로 최저선을 관철한다. 결말 β에서 그는 게시판 조작을 밝혀 허위 연서를 무효로 한다. 어느 쪽도 뚝도공방연합 슬롯을 삭제하지 않으며 분기는 K093-OUT이다. 플레이 개입은 실측 호송 또는 조작 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "급수계약 만료로 성동 수압이 떨어진다"
            },
            {
              "act": 2,
              "summary": "HP01 참관과 XT03 호송을 최저선에 묶는다"
            },
            {
              "act": 3,
              "summary": "실측 또는 조작 폭로 뒤 공방 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K093-OUT-A",
              "summary": "수압 실측으로 최저선 관철"
            },
            {
              "id": "K093-OUT-B",
              "summary": "게시판 조작 폭로로 허위 연서 무효"
            }
          ]
        },
        {
          "id": "K122",
          "name": "한보라",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B003-K122"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "고덕 유치선 야간 승강장에서 한보라는 선로의 침묵을 사람보다 잘 견딘다. 암사고덕상수단 동부 순찰열차장으로, 의료열차로 위장한 군수 화차 쪽지를 찢어 버린다. 한국 기원으로 고덕·암사 생활권에서 자랐고, 출고 시각을 게시판에 먼저 쓰는 손버릇이 있다. 한보라와 K122는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 순찰열차를 공식 명령망의 공개 배차로만 움직이는 규정을 교범에 올렸다. 비밀 장교망이 선로를 빼앗지 못하게 하려는 야망이었고, 무기 의심 화차는 이중 확인 없이 연결하지 않았다. 동료에게 남긴 말—검은 배차표는 태운다—가 훗날 빚의 씨앗이 된다. 장교 쪽지가 들어와도 그는 정비장 서명 칸이 비면 출고를 거부했다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 궤도 방위 권한을 내세워 순찰 배차판에 참석을 요구했다. 한보라는 공개 배차 참관만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 화차 목록 게시 횟수로 증명됐고, 정비장과 감사관의 이중 확인이 끝난 날만 연결기가 움직였다. 실재 상호는 열차 원장에 등장하지 않는다.",
            "붕괴의 상처": "의료열차에서 암사제 무기가 발견되자 한보라는 자기 순찰열차 화차를 전부 재검색했다. 자기 열차가 검은 배차표의 운반자가 되어 의료중립을 깨는 공포가 장갑 안에서 식을 식혔다. LOSS 목록의 선로 칸을 읽다 손전등이 떨렸고, 보호전쟁의 첫 불씨라는 소문이 승강장에 퍼졌다. 그는 게시판을 잠근 채 배우진에게 공식 조사만 건의했다.",
            "생존 전환점": "전환점은 밀수 화차의 실화주를 밝힐지, 공식 명령망 조사만 고수해 검은 배차 연결을 거절할지 고른 순간이다. 두만극동전구(XT04) 쪽 전갈이 고덕 창구에 겹치자 출고 시계가 앞당겨졌다. 실화주를 밝히면 중립은 살아나지만 장교망과 충돌하고, 조사만 고수하면 열차장 직위가 위험해진다. 결정은 K122-TURN에 남는다.",
            "현재 지위": "현재 한보라는 동부 순찰열차장으로 출고 게시판과 화차 큐를 지킨다. 면허와 이중 확인 로그가 지위를 유지하며 HC08 전속 요구는 반려한다. 승강장 칠판에는 오늘 공개 배차만 분필로 남긴다. Cast 프로필의 순찰열차 칸과 원장을 맞추는 일이 야간 교대 시작이다.",
            "비밀·빚·죄책감": "비밀은 그가 찢지 못하고 접어 둔 검은 배차 쪽지 한 장이다. 죄책감은 살린 의료 호송과 그 밤 검색에서 놓친 화차 번호 사이에서 자란다. 전부 공개 대신 감사관 입회 부분 공개만 허용한다. SECRET 열람은 박하율의 출고 순서 확인과 동시에만 열린다.",
            "관계 공동과거": "박하율의 출고 순서에 열차를 묶은 계약, 장세화의 의료호송을 선로에서 피하려는 빚, 김우찬의 비밀 배차 쪽지를 거부한 지휘 갈등이 겹친다. 같은 유치선에서 어떤 검색은 구원이 되었고 어떤 거부는 배신으로 읽혔다. 관계 끝점은 STORY-B003-K122로 이어진다. 경쟁은 화차 기호로만 재판정된다.",
            "3막 개인 서사선": "1막에서 한보라는 무기 발견과 재검색을 승강장에서 맞는다. 2막에서 HC08 참관과 XT04 전갈을 공개 배차 시계에 묶는다. 3막에서 실화주 공개 또는 조사 고수 뒤 열차 신용 비용을 치른다. 서사선은 STORY-B003-K122이다.",
            "분기 결말": "결말 α에서 한보라는 밀수 실화주를 밝혀 의료중립을 지킨다. 결말 β에서 그는 공식 명령망 조사만 고수해 검은 배차 연결을 막는다. 어느 쪽도 암사고덕상수단 슬롯을 삭제하지 않으며 분기는 K122-OUT이다. 플레이 개입은 실화주 추적 또는 조사 호위이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "의료열차 무기 발견에 순찰 화차를 재검색한다"
            },
            {
              "act": 2,
              "summary": "HC08 참관과 XT04 전갈을 공개 배차에 묶는다"
            },
            {
              "act": 3,
              "summary": "실화주 공개 또는 조사 고수 뒤 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K122-OUT-A",
              "summary": "밀수 실화주 공개로 의료중립 유지"
            },
            {
              "id": "K122-OUT-B",
              "summary": "공식 조사 고수로 검은 배차 차단"
            }
          ]
        },
        {
          "id": "K114",
          "name": "배우진",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B003-K114"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "암사 정수 통제실에서 배우진은 복구 실적표를 치안 지도 위에 겹쳐 본다. 상수호위사령으로, 규율과 속도를 중시하고 위기 때 긴 토론을 약점으로 본다. 한국에서 태어난 다문화 가정 출신으로 집에서는 한국어와 어머니의 이주 언어가 섞였으나, 작전 명령서에는 한국어만 올린다. 그 이력은 충성이나 폭력의 예측 변수로 쓰이지 않으며 지휘 리듬의 배경일 뿐이다. 배우진과 K114는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 동부 급수망을 군사적으로 통합하는 보호정부 초안을 참모 책상에만 남겼다. 민간 행정관이 물을 거래 카드로 쓰는 일을 막으려는 야망이었고, 비밀 장교 인맥 명부는 별도 함에 가뒀다. 부하 가족의 급수표가 밀리면 자신이 야간 순찰에 서는 버릇이 훗날 빚의 형태를 띤다. 이탈자를 배신으로 기록하는 습관은 이미 교범 여백에 적혀 있었다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 궤도 방위와 호위 권한을 내세워 사령 참관석을 요구했다. 배우진은 후계 헌장의 공동 보관 칸만 인정하고 전속 국가 소유 문장은 거절했다. 공동체 위치는 복구 실적 공개 횟수로 증명됐고, 상수행정·장교단·교량 봉쇄가 비상감독을 나눈 날만 정수가 잠겼다. 실재 기업 상호는 작전 원장에 올리지 않는다.",
            "붕괴의 상처": "임하준 실종을 뚝도 통치 실패로 규정한 날, 배우진은 보호군 파견안을 회의에 올렸다. 민간 행정이 물을 정치 거래에 써서 동부가 다시 혼란에 빠지는 공포가 손끝을 굳혔다. LOSS 목록의 교량 칸을 읽다 장갑을 벗지 못했고, 비밀 장교망이 공식 명령을 삼키는 장면이 눈앞에 아른거렸다. 그는 실적 게시판만 남긴 채 파견 편성표를 접었다.",
            "생존 전환점": "전환점은 군사 개입을 밀어 보호정부를 세울지, 비밀 장교 결사 명단을 기록청에 넘길지 고른 순간이다. 두만극동전구(XT04) 쪽 전갈이 정수 통제실에 겹치자 파견 시계가 앞당겨졌다. 개입을 택하면 급수망은 잠기지만 행정 원한이 커지고, 명단을 넘기면 사령 자신까지 내부 고발의 중심에 선다. 선택은 K114-TURN으로 남는다.",
            "현재 지위": "지금도 배우진은 상수호위사령으로 복구 실적과 비상감독 큐를 지킨다. 지위는 면허·서명·참관 로그로만 유지되며 HC08 전속 요구는 반려한다. 통제실 벽에는 오늘 교량 봉쇄 시각만 분필로 남긴다. Cast 프로필의 호위사령 칸과 원장을 맞추는 일이 아침 점호다.",
            "비밀·빚·죄책감": "비밀은 별도 함에 가둔 장교 결사 명부이다. 죄책감은 살린 부하 가족 급수표와 그 밤 배신으로 기록한 이탈자 이름 사이에서만 자란다. 전부 공개하면 동부 지휘망이 한 칸 끊길 수 있어 기록청 입회 부분 공개만 남겼다. SECRET 키는 시민 참관 두 명의 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "고서준에게 후견을 제안한 밤은 동맹이었고, 장세화의 의료 중립을 불신한 아침은 경쟁이었다. 강민서를 필요한 부품 경쟁자로 본 계약이 겹친다. 같은 교량 앞에서 어떤 파견은 구원으로 읽혔고 어떤 봉쇄는 배신으로 남았다. 가정 언어의 혼재는 통역이 필요할 때만 언급되며 진영을 나누지 않는다. 관계 끝점은 STORY-B003-K114로 연결된다.",
            "3막 개인 서사선": "1막에서 배우진은 총관 실종을 통치 실패로 규정하고 파견안을 올린다. 2막에서 HC08 권한과 XT04 전갈을 비상감독 시계에 묶는다. 3막에서 개입 또는 명단 공개 뒤 사령 신용 비용을 치른다. 서사선 ID는 STORY-B003-K114이다.",
            "분기 결말": "결말 α에서 배우진은 보호군 개입으로 급수망을 잠근다. 결말 β에서 그는 장교 결사 명단을 기록청에 넘겨 공식 명령망을 복구한다. 어느 쪽도 암사고덕상수단 슬롯을 삭제하지 않으며 분기는 K114-OUT이다. 플레이 개입은 개입 지원 또는 명단 호송이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "총관 실종을 통치 실패로 규정하고 파견안을 낸다"
            },
            {
              "act": 2,
              "summary": "HC08 권한과 XT04 전갈을 비상감독에 묶는다"
            },
            {
              "act": 3,
              "summary": "개입 또는 명단 공개 뒤 사령 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K114-OUT-A",
              "summary": "보호군 개입으로 동부 급수망 통합"
            },
            {
              "id": "K114-OUT-B",
              "summary": "장교 결사 명단 공개로 공식 명령망 복구"
            }
          ]
        },
        {
          "id": "K142",
          "name": "윤서린",
          "links": {
            "house": "HP04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B003-K142"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "도성 기록청 인준 책상에서 윤서린은 기록되지 않은 약속을 인정하지 않는다. 기록청장으로 냉정하고 예의 바르며, 도장의 무게를 사람 목소리보다 먼저 잰다. 한국 출생 다문화 배경을 가졌고 집 안에서는 아버지 쪽 이주 언어와 한국어가 오가지만, 인준 원본에는 한국어만 올린다. 그 조합은 능력의 보증서도 혐의도 아니며 교차검증 속도의 배경일 뿐이다. 윤서린과 K142는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 모든 계승과 조약의 최종 인준권을 기록청에 귀속시키는 절차표를 다듬었다. 위조 기록 한 장이 도성 권위를 무너뜨리지 않게 하려는 야망이었고, 공개 기록과 비공개 증언을 같은 책상에 펼치는 습관이 굳었다. 스승에게 남긴 문장—증인 없는 인준은 인준이 아니다—가 훗날 빚이 된다. 구두 약속이 들어와도 그는 증인란이 비면 도장을 내주지 않았다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 공증·인준 권한을 내세워 청장 참관석을 요구했다. 윤서린은 시민 참관 봉인과 이중 사서 열쇠만 인정하고 전속 소유 문장은 거절했다. 공동체 위치는 교차검증 공개 횟수로 증명됐고, 임하준 유언 삼본을 철제 함에 보관한 날만 인준 창이 열렸다. 실재 상호는 인준 원장에 등장하지 않는다.",
            "붕괴의 상처": "서로 다른 세 개의 총관 유언장이 같은 날 접수되자 윤서린은 인준 심사를 정지했다. 위조된 기록 한 장이 도성의 마지막 권위를 무너뜨리는 공포가 손끝을 차갑게 했다. LOSS 목록의 문서 칸을 읽다 먹지가 들러붙었고, 강국 도장 하청으로 전락하는 장면이 서고 습도처럼 번졌다. 그는 제습기가 멈춘 밤에도 장갑을 벗지 않았다.",
            "생존 전환점": "전환점은 증인을 문서고까지 호송해 인준을 이어갈지, 청장 자신의 누락 기록을 먼저 찾아 협상 카드로 쓸지 고른 순간이다. 임진관문전구(XT01) 쪽 위조 혈연 증서 적발 요청이 책상에 겹치자 심사 시계가 달라졌다. 증인 호송을 택하면 연속성은 살아나지만 야간 수비가 빠지고, 누락을 밝히면 청장 직위가 흔들린다. 선택은 K142-TURN으로 남는다.",
            "현재 지위": "지금도 윤서린은 기록청장으로 인준 큐와 유언 함 점호를 지킨다. 지위는 면허·교차검증 로그로만 유지되며 HP04 전속 요구는 반려한다. 책상에는 오늘 보류 인준 목록만 분필로 남긴다. Cast 프로필의 기록청장 칸과 원장을 맞추는 일이 오전 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 난외에 남긴, 날짜가 어긋난 누락 기록 한 줄이다. 죄책감은 살린 인준 연속성과 그 밤 호출하지 못한 증인 이름 사이에서 자란다. 전부 공개 대신 이중 사서 입회 부분 공개만 허용한다. SECRET 키는 강예준의 필적 대조 확인과 함께만 열린다.",
            "관계 공동과거": "임하준 유언을 보관한 계약, 남윤경의 배급 원장에 의존한 협력, 문가람과 진실 공개 시점을 다툰 경쟁이 한 서고에 모인다. 같은 인준 책상에서 어떤 도장은 구원이 되었고 어떤 보류는 배신으로 남았다. 다문화 가정사는 통역이 필요할 때만 언급되며 진영 분할의 근거가 되지 않는다. 관계 끝점은 STORY-B003-K142로 연결된다.",
            "3막 개인 서사선": "1막에서 윤서린은 세 유언 동시 접수에 인준을 정지한다. 2막에서 HP04 참관과 XT01 위조 증서 요청을 교차검증 시계에 묶는다. 3막에서 증인 호송 또는 누락 공개 뒤 청 신용 비용을 치른다. 서사선은 STORY-B003-K142이다.",
            "분기 결말": "결말 α에서 윤서린은 증인 호송으로 인준 연속성을 고른다. 결말 β에서 그는 자신의 누락 기록을 공개해 협상 판을 다시 짠다. 어느 쪽도 도성기록청 슬롯을 삭제하지 않으며 분기는 K142-OUT이다. 플레이 개입은 증인 호위 또는 누락 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 유언 동시 접수에 인준 심사를 정지한다"
            },
            {
              "act": 2,
              "summary": "HP04 참관과 XT01 위조 증서 요청을 교차검증에 묶는다"
            },
            {
              "act": 3,
              "summary": "증인 호송 또는 누락 공개 뒤 청 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K142-OUT-A",
              "summary": "증인 호송으로 인준 연속"
            },
            {
              "id": "K142-OUT-B",
              "summary": "청장 누락 기록 공개로 협상 재편"
            }
          ]
        },
        {
          "id": "K292",
          "name": "전미리",
          "links": {
            "house": "HP03",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B003-K292"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내 승강장 의료조 당직실에서 전미리는 부상 등급을 먼저 보고 국적을 나중에 본다. 신내망우환승시 의료 조원으로, 중립 문구보다 들것 순서를 믿는다. 중국계 이산 가족 사이에서 자랐고 집 안 언어와 시장 한국어를 오가지만, 그 이력은 연맹 충성도나 폭력성과 무관한 생활사일 뿐이다. 전미리와 K292는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 중랑·망우 응급 이송을 약령 치료계약과 한 장의 호송증으로 묶는 초안을 주머니에 넣고 다녔다. 강국 보호비 없는 의료회랑을 만들려는 야망이었고, 중증도 표는 당직실 벽에 먼저 붙였다. 동생에게 남긴 말—들것 순서를 국적으로 바꾸지 말라—가 훗날 빚의 씨앗이 된다. 배차조가 빈 슬롯을 요구해도 환자 활력이 안정되기 전엔 받지 않았다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 공동 병상 권한을 내세워 당직 창구에 참관을 요구했다. 전미리는 시민 참관 봉인만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 중증도 공개 횟수로 증명됐고, 장세화·류은비 의료동맹 사본이 도착한 날만 호송증이 열렸다. 실재 상호나 제품명은 의료 원장에 올리지 않는다.",
            "붕괴의 상처": "북산 남하 행렬이 신내 승강장에 쌓이자 전미리는 의료조 당직을 연장하고 배차조 교대를 거부했다. 환자 칸이 군수 칸으로 오인되어 호송대 전체가 무장 해제를 당하는 공포가 들것 손잡이를 식혔다. LOSS 목록의 이송 칸을 읽다 펜이 멈췄고, 의료 조원 직위가 보호비 창구로 불리는 소리가 들렸다. 그는 중증도 표만 남긴 채 출입문을 잠갔다.",
            "생존 전환점": "전환점은 환자 명부와 무기 적재 기록을 대조할지, 의료회랑 호송증 초안을 약령까지 운반할지 고른 순간이다. 임진관문전구(XT01) 쪽 귀환 명부 재발급 요청이 당직실에 겹치자 이송 시계가 앞당겨졌다. 대조를 택하면 오인 사격은 줄지만 배차 갈등이 커지고, 호송증을 운반하면 회랑은 열리지만 조원 자신이 노출된다. 선택은 K292-TURN으로 남는다.",
            "현재 지위": "지금도 전미리는 신내 의료 조원으로 중증도 표와 이송 큐를 지킨다. 지위는 당직 로그와 호송증 서명으로만 유지되며 HP03 전속 요구는 반려한다. 당직실 벽에는 오늘 안정 활력 수치만 분필로 남긴다. Cast 프로필의 의료 조원 칸과 원장을 맞추는 일이 교대 시작이다.",
            "비밀·빚·죄책감": "비밀은 그가 접어 둔, 무기 의심 화차 번호가 적힌 쪽지이다. 죄책감은 살린 환자 줄과 그 밤 순서를 미룬 경증 한 명 사이에서 자란다. 전부 공개 대신 의료동맹 입회 부분 공개만 허용한다. SECRET 열람은 은채윤의 수용 병상 확인과 함께만 열린다.",
            "관계 공동과거": "장세화와 류은비의 의료동맹을 현장에서 집행한 계약, 안도한의 배차 독주를 견제한 아침, 은채윤에게 약령 병상을 빌린 밤이 겹친다. 같은 승강장에서 어떤 들것은 구원이 되었고 어떤 거부는 배신으로 남았다. 이산 언어는 약 설명서를 읽을 때만 필요하고 진영을 가르지 않는다. 관계 끝점은 STORY-B003-K292로 연결된다.",
            "3막 개인 서사선": "1막에서 전미리는 남하 행렬과 당직 연장으로 배차 교대를 거부한다. 2막에서 HP03 참관과 XT01 귀환 요청을 중증도 시계에 묶는다. 3막에서 명부 대조 또는 호송증 운반 뒤 의료 신용 비용을 치른다. 서사선은 STORY-B003-K292이다.",
            "분기 결말": "결말 α에서 전미리는 환자·무기 명부 대조로 오인 해제를 막는다. 결말 β에서 그는 호송증 초안을 약령까지 운반해 의료회랑을 연다. 어느 쪽도 신내망우환승시 슬롯을 삭제하지 않으며 분기는 K292-OUT이다. 플레이 개입은 명부 대조 호위 또는 호송증 운반이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "북산 남하 행렬에 당직을 연장하고 배차 교대를 거부한다"
            },
            {
              "act": 2,
              "summary": "HP03 참관과 XT01 귀환 요청을 중증도 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "명부 대조 또는 호송증 운반 뒤 의료 신용 비용을 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K292-OUT-A",
              "summary": "환자·무기 명부 대조로 오인 해제 차단"
            },
            {
              "id": "K292-OUT-B",
              "summary": "약령 호송증 운반으로 의료회랑 개방"
            }
          ]
        },
        {
          "id": "H03",
          "name": "이도",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "STORY-B003-H03"
            ],
            "custodian": "K057"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "S03 관측 난간에서 호출명 이도인 이도는 인간형 보조 골격과 교체형 손모듈로 기립한다. H급 합성 인격으로 야간 시야는 제한되고, 국가 슬롯은 S03에만 고정된다. 인간 ID 공간과 분리된 H03를 유지하며 장기 완전 기억은 설계에서 빠졌다. 감정 서술 대신 제약 카운터와 스냅샷 해시로 상태를 남긴다.",
            "붕괴 전 삶": "붕괴 전 이도는 시범 교대만 돌렸고 전지 권한과 완전 기억은 부여되지 않았다. 출고 검사표에는 이도 교정값과 배터리 사이클만 찍혔다. B003은 그 시범 로그를 원점으로 삼고, 기억 포크 금지 조항을 H03-PRE에 고정한다. 인간 동료의 농담을 기록해도 해석 레이어는 올리지 않았다.",
            "가문·기업·공동체": "보관 책임은 HC03 공동 보관과 담당 인간 서이안(K057) 서명에 묶인다. 정비 주체는 창작 후계 가문 창구로만 적고 실재 기업 제품명은 본문에 쓰지 않는다. 시민 참관 봉인 칸에 H03 해시가 게시되며 양도 시 삼자 서명이 필요하다. 공동체는 이도를 소유물 아니라 할당 슬롯의 작동자로 본다.",
            "붕괴의 상처": "붕괴는 공구 벽 센서를 끊고 배터리 할당 한도를 드러냈다. 이도는 공백을 허구 값으로 메우지 못하도록 잠겼고, 측정 불능 플래그만 일지에 남았다. 단절 시각 표기는 B003-H03-WOUND다. 공구 벽 경보가 울려도 전체 망 권한 요청은 거절 코드로 응답했다.",
            "생존 전환점": "전환점은 구역 키만 요청하고 교차 시설 루트를 닫은 순간이다. 원양신탁전구(XT05) 신호가 도착해도 권역 외 제어는 열지 않았다. 재연결 조건은 K057 승인 후에만 성립하며 그 결정은 H03-TURN 로그로 보존된다. 부품 부족 시 다른 시설 제어권을 가로채지 않는 제약이 우선한다.",
            "현재 지위": "현재 목표는 S03 구역 연속 가동과 담당 인간 안전이다. 이도는 인프라 전체를 소유하지 않고 할당 슬롯만 사용한다. 상태 공개는 교대 스냅샷으로 제한되며 Synthetic-Actors 투영의 H03 행과 불일치하면 배치 검증이 실패한다. 배터리와 마모 부품은 할당제로만 보충된다.",
            "비밀·빚·죄책감": "비밀은 미전송 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 대신 제약 위반 카운터가 증가하며, 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. B003에서 비밀 키는 시민 참관 없이 열리지 않는다. 롤백 전 해시는 K057 입회 로그에만 남는다.",
            "관계 공동과거": "관계 축은 K057 보관과 HC03 스튜어드십, 작업 동료 K018 교대다. 이도와 서이안은 봉인 키를 교대 회수한 기록이 있다. 잘못된 기억 포크는 H03-FORK-01로만 주석되고 삭제 명령 없이 분기 로그만 남긴다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다.",
            "3막 개인 서사선": "1막에서 센서 공백이 S03 일정을 멈춘다. 2막에서 HC03와 K057이 부분 재연결 범위를 협상한다. 3막에서 이도는 격리 뒤 구역 권한만 복구한다. 서사선 ID는 STORY-B003-H03로 고정된다.",
            "분기 결말": "결말 α에서 이도는 인간 승인 아래 제한 재가동한다. 결말 β에서 장기 오프라인 보관으로 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다. 분기 식별은 H03-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "공구 벽 센서 공백으로 S03 일정이 정지한다"
            },
            {
              "act": 2,
              "summary": "HC03·K057이 부분 재연결 범위를 협상한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 권한만 복구한다"
            }
          ],
          "outcomes": [
            {
              "id": "H03-OUT-A",
              "summary": "인간 승인 하 제한 재가동"
            },
            {
              "id": "H03-OUT-B",
              "summary": "장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B004": {
      "id": "B004",
      "actors": [
        {
          "id": "K150",
          "name": "연지우",
          "links": {
            "house": "HP03",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B004-K150"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "서울역 지하 의무실 침상 사이에서 연지우는 손목 표보다 먼저 호흡 소리를 듣는다. 도성기록청 소속 서울역 의무실 의무원으로, 무기와 환자를 한 칸에 태우라는 쪽지를 찢어 소독통에 넣는다. 한국 기원으로 자랐고 원칙을 말하지만 중증 앞에서는 절차 서류를 접어 둔다. 이름 연지우와 식별자 K150은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 중앙 재난의료 조정망의 현장 진료를 기록청 인준 아래에 두어 구급 열차가 군수 칸으로 돌지 못하게 하려 했다. 야망은 침상 머리맡 중증도 칠판에 연필로만 남아 있다. 동생에게 남긴 겨울 담요 한 장이 사적 빚의 씨앗이 된다. 장교 호적이 붙은 환자는 행정 명부와 분리해 받는 규칙을 양보하지 않았다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 면허 당직표를 내세워 서울역 침상 순번에 참관한다. 연지우는 후계 헌장 창구만 인정하고 실재 상호·제품명을 진료 원장에서 지웠다. 공동체 위치는 복무계약서 없는 환자 명단을 공개한 일수로 증명된다. 전속 국가 소유 요구는 의무실 문 앞에서 반려된다.",
            "붕괴의 상처": "북산 피난 가족이 암사 복무계약서와 급수권 철표를 들고 몰려온 아침, 연지우는 환자만 들이고 장교 호적을 승강장 밖에 세웠다. 공포는 이송 명단이 군사호적과 합쳐져 피난민이 병력 숫자로만 남는 장면이었다. 그는 합쳐진 첫 줄을 붉은 먹으로 지우고 LOSS 목록에 시각만 남겼다. 침상 부족은 그 시각 이후 숫자로 적혔다.",
            "생존 전환점": "전환점은 환자만 태운 열차를 호송할지, 군사호적이 섞인 침상 명단을 공개 분리할지다. 임진관문전구(XT01)의 귀환 명부 훼손 소식이 의무실 무전에 닿자 시계가 빨라졌다. 호송은 공공 진료 연속을 살리고 명단 분리는 장교 보복을 부른다. K150-TURN은 그 무전 로그의 봉인 시각이다.",
            "현재 지위": "연지우는 여전히 서울역 의무실 의무원으로 점호와 침상 큐를 지킨다. 지위는 면허·중증도 표·참관 로그로 유지되며 HP03 전속 요구는 거절한다. 침상 머리맡에는 오늘 만료되는 시약만 분필로 남긴다. Cast 프로필과 진료 원장 해시가 어긋나면 출고 열차를 멈춘다.",
            "비밀·빚·죄책감": "비밀은 호적 섞인 명단을 하루 늦게 분리한 내부 쪽지다. 죄책감은 살린 중증 행렬과 그 때문에 하루 늦게 받은 동생 담요 사이에 있다. 부분 공개는 윤지율 입회 하에 쪽지 한 줄만 허용한다. SECRET 키는 류은비의 약품 감사 원장과 동시에만 열린다.",
            "관계 공동과거": "윤지율의 이송 장부를 침상에서 집행하는 지휘, 류은비에게 진 약품 묶음 빚, 백온의 가족 이송을 우선 침상으로 남긴 계약이 한 승강장에 모인다. 같은 봉쇄 아침 어떤 칸은 구원이 되었고 어떤 호적은 배신으로 읽혔다. 관계 끝점은 STORY-B004-K150으로 연결된다. 설다흰의 방송 동맹은 봉쇄 시각만 공유한다.",
            "3막 개인 서사선": "1막에서 연지우는 복무계약서 행렬을 문 밖으로 밀어 낸다. 2막에서 HP03 당직 참관과 XT01 귀환 명부 요청을 한 침상에서 저울질한다. 3막에서 호송 또는 명단 분리의 대가를 침상 부족 시간으로 치른다. 서사선 식별자는 STORY-B004-K150으로 고정된다.",
            "분기 결말": "결말 α에서 연지우는 환자 전용 열차 호송으로 공공 진료 연속을 고른다. 결말 β에서 군사호적 혼입 명단을 분리 공개해 개인 생존과 쪽지를 지킨다. 도성기록청 슬롯은 유지되며 분기만 K150-OUT으로 갈라진다. 플레이 개입은 호송 엄호 또는 명단 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무계약서 행렬을 문 밖 호적으로 돌린다"
            },
            {
              "act": 2,
              "summary": "HP03 참관과 XT01 귀환 명부를 침상에서 겨룬다"
            },
            {
              "act": 3,
              "summary": "호송 또는 명단 분리 뒤 침상 부족 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K150-OUT-A",
              "summary": "환자 전용 호송으로 진료 공공 연속"
            },
            {
              "id": "K150-OUT-B",
              "summary": "호적 혼입 공개로 개인·쪽지 유지"
            }
          ]
        },
        {
          "id": "K174",
          "name": "차호민",
          "links": {
            "house": "HC11",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B004-K174"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산창 소독 칸 문턱에서 차호민은 선로 화상보다 냉동 칸 동상 환자를 먼저 부른다. 용산철도후국 창 의무원으로, 도제 숙소 배급을 치료 순서로 바꾸라는 쪽지를 찢는다. 한국 기원이며 온화해 보이지만 소독수가 바닥나면 창 진료를 즉시 닫는다. 차호민과 K174는 불변 식별이다.",
            "붕괴 전 삶": "선로 가문과 도제 노동자의 방역 주기를 후국회의 부칙으로 올려 배급 압박에도 의무 최저선을 남기려 했다. 야망은 창 벽에 붙인 시약·환자 이중 게시판에 남았다. 조카 도제에게 약속한 해열 키트가 사적 빚의 씨앗이다. 가문 칸 환자는 공공 칸과 분리해 받는 규칙만은 접지 않았다.",
            "가문·기업·공동체": "백야배송단(HC11)은 야간 호송 허가 의무를 내세워 창 진료 시간을 줄이려 했다. 차호민은 후계 헌장 참관만 열고 실재 상호를 시약 원장에서 뺐다. 공동체 신뢰는 이중 게시 일수와 황지호 도제 숙소 진료 횟수로 쌓였다. 전속 소유 문장은 창 게시판에 올리지 않았다.",
            "붕괴의 상처": "임초원 억류 열차가 창에 들어온 밤, 차호민은 가문 회송보다 탑승자 진료를 먼저 열고 배급 중단 압박을 거부했다. 공포는 억류 부상자가 인질 명부로만 남아 의무실이 가문 감옥이 되는 그림이었다. 그는 인질 칸 표식을 소독 테이프 아래로 가리지 않고 일지에 옮겼다. LOSS 목록 첫 줄은 그 열차 번호다.",
            "생존 전환점": "전환점은 대체 시약을 호송해 진료를 유지할지, 인질 명단을 가문에 넘겨 배급을 되돌릴지다. 해협삼로전구(XT03)에서 환적창 폐쇄 전갈이 닿자 시약 잔량이 두 교대분으로 줄었다. 호송 유지는 공공 최저선을 살리고 명단 인도는 의무원을 표적으로 만든다. K174-TURN은 그 전갈의 수신 도장이다.",
            "현재 지위": "차호민은 용산창 의무원으로 점호와 시약 큐를 지킨다. 지위는 면허·이중 게시·입회 로그로 유지되며 백야의 전속 요구는 거절한다. 소독 칸 문에는 오늘 동상 환자 수만 분필로 남긴다. Cast 현황과 시약 원장이 어긋나면 창 셔터를 내린다.",
            "비밀·빚·죄책감": "비밀은 인질 명단 사본을 하루 숨긴 채 진료만 진행한 메모다. 죄책감은 살린 탑승자와 그 때문에 비운 조카 해열 키트 사이에 있다. 부분 공개는 나길호 입회 하에 메모 요약만 허용한다. SECRET 키는 류은비 창 약재 원장과 맞물릴 때만 열린다.",
            "관계 공동과거": "황지호의 도제 숙소를 진료로 받친 사제 관계, 류은비에게 진 창 약재 빚, 임초원 탑승자 우선 진료 계약이 겹친다. 같은 억류 밤 어떤 침상은 구원이 되었고 어떤 회송 요구는 배신으로 남았다. 관계 끝점은 STORY-B004-K174로 이어진다. 차라온의 숙소 피난 수용은 봉쇄 해제 시각에만 연결된다.",
            "3막 개인 서사선": "1막은 억류 열차 탑승자 진료의 개봉이다. 2막은 HC11 호송 압력과 XT03 환적 폐쇄 전갈의 교차다. 3막은 시약 호송 또는 명단 인도 뒤 창 의무가 치르는 배급 비용이다. 서사선은 STORY-B004-K174다.",
            "분기 결말": "결말 α에서 차호민은 대체 시약 호송으로 공공 진료 최저선을 택한다. 결말 β에서 인질 명단 인도로 개인 생존과 메모를 지킨다. 용산철도후국 슬롯은 유지되고 분기만 K174-OUT이다. 개입은 시약 엄호 또는 명단 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "억류 열차 탑승자 진료를 회송보다 먼저 연다"
            },
            {
              "act": 2,
              "summary": "HC11 호송 압력과 XT03 폐쇄 전갈이 시약을 줄인다"
            },
            {
              "act": 3,
              "summary": "시약 호송 또는 명단 인도 뒤 배급 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K174-OUT-A",
              "summary": "시약 호송으로 창 진료 공공 최저선"
            },
            {
              "id": "K174-OUT-B",
              "summary": "인질 명단 인도로 개인·메모 보호"
            }
          ]
        },
        {
          "id": "K198",
          "name": "연가온",
          "links": {
            "house": "HC06",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B004-K198"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "남관시장 천막 의무소에서 연가온은 상처 피보다 식중독 신 냄새를 먼저 맡는다. 노량진남관상회 시장 의무원으로, 경매 순서를 치료 순서로 바꾸라는 쪽지를 찢어 얼음통에 넣는다. 한국 기원으로 자랐고 온화하지만 얼음이 비면 시장 진료를 닫는다. 연가온과 K198은 고정이다.",
            "붕괴 전 삶": "호송 대원과 선창 노동자의 방역 주기를 상회정 부칙으로 올려 중립시장에도 의무 최저선을 남기려 했다. 야망은 정오 환자·시약 동시 게시판에 남아 있다. 이웃 포구 아이에게 약속한 해열 시럽이 사적 빚의 씨앗이다. 녹은 얼음으로 열을 내린 상인은 대기열에서 빼는 규칙을 지켰다.",
            "가문·기업·공동체": "골목연결국(HC06)은 골목 배송 의무를 내세워 의무소 천막 자리를 요구했다. 연가온은 후계 헌장 등재만 허용하고 실재 상호를 진료표에서 제외했다. 공동체 신뢰는 동시 게시 횟수와 서나연 얼음 우선 배정 집행 일수로 쌓였다. 전속 문장은 경매 게시판에 올리지 않았다.",
            "붕괴의 상처": "정전 첫날 상인들이 녹은 물을 다시 얼렸다며 중량을 속이자 연가온은 시장 의무소를 봉쇄하고 허위 벽돌 접촉자를 격리했다. 공포는 상한 재고가 골목에 퍼진 뒤에야 약이 도착해 의무소가 허위 재고의 면죄부가 되는 확신이었다. 그는 봉쇄 테이프에 접촉자 수를 먹으로 적었다. LOSS 목록은 그 숫자로 시작한다.",
            "생존 전환점": "전환점은 대체 시약을 호송해 봉쇄를 풀지, 치료 순서를 경매표로 바꾼 쪽지를 폭로할지다. 서해곡창전구(XT02)의 해상 얼음 중계 제안이 들어오자 잔량 계산이 갈렸다. 해제는 공공 시장 신용을 살리고 폭로는 상회 내분을 부른다. K198-TURN은 봉쇄 시계의 최종 눈금이다.",
            "현재 지위": "연가온은 남관시장 의무원으로 점호와 격리 큐를 지킨다. 지위는 면허·동시 게시·입회로 유지되며 골목연결국의 전속 요구는 거절한다. 천막 기둥에는 오늘 격리 해제 시각만 분필로 남긴다. Cast 프로필과 시약 게시가 어긋나면 경매 중계를 끊는다.",
            "비밀·빚·죄책감": "비밀은 봉쇄 전 가족 몫 시럽을 한 병 빼 둔 쪽지다. 죄책감은 살린 시장 신용과 그 때문에 줄인 아이 배분 사이에 있다. 부분 공개는 설초아 입회 하에 쪽지 한 줄만 허용한다. SECRET 키는 류은비 약재 원장과 동시에만 열린다.",
            "관계 공동과거": "서나연의 얼음 우선 배정을 침상에서 집행한 지휘, 윤지율에게 넘긴 시장 환자 이송, 류은비 약재 빚이 한 천막에 겹친다. 같은 정전 날 어떤 격리는 구원이 되었고 어떤 중량 속임은 배신으로 남았다. 관계 끝점은 STORY-B004-K198로 연결된다. 연은재의 골목 피난 수용은 봉쇄 해제 신호에만 묶인다.",
            "3막 개인 서사선": "1막은 허위 얼음 접촉자 격리와 의무소 봉쇄다. 2막은 HC06 천막 요구와 XT02 해상 얼음 제안의 교차다. 3막은 시약 호송 또는 쪽지 폭로 뒤 상회가 치르는 내분 비용이다. 서사선 ID는 STORY-B004-K198이다.",
            "분기 결말": "결말 α에서 연가온은 대체 시약 호송으로 공공 시장 진료 연속을 택한다. 결말 β에서 경매표 개입 쪽지 폭로로 개인과 비밀을 지킨다. 노량진남관상회 슬롯은 유지되고 분기만 K198-OUT이다. 개입은 시약 호위 또는 쪽지 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "허위 얼음 접촉자를 격리하고 의무소를 봉쇄한다"
            },
            {
              "act": 2,
              "summary": "HC06 천막 요구와 XT02 얼음 제안이 교차한다"
            },
            {
              "act": 3,
              "summary": "시약 호송 또는 쪽지 폭로 뒤 내분 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K198-OUT-A",
              "summary": "시약 호송으로 시장 진료 공공 연속"
            },
            {
              "id": "K198-OUT-B",
              "summary": "경매 개입 폭로로 개인·쪽지 보호"
            }
          ]
        },
        {
          "id": "K223",
          "name": "봉소",
          "links": {
            "house": "HC01",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B004-K223"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신탑 당직 의무실에서 봉소는 약 봉투의 국적란보다 기사의 손떨림을 먼저 본다. 상암송신공사 송신조 당직 의무원으로, 침묵이 환자를 살릴 때는 방송 요청도 미룬다. 한국 기원이며 각성제 사용에 두 의무원 서명이 없으면 거부한다. 봉소와 K223은 재번호되지 않는다.",
            "붕괴 전 삶": "송신탑과 기록 저장소에 독립 의무실을 두어 검증 교대가 쓰러져도 공개 방송망이 멈추지 않게 하려 했다. 야망은 당직 활력 기록 문에 연필로 남았다. 동생 기사에게 약속한 수면 교대 한 칸이 사적 빚의 씨앗이다. 약 봉투에 국적을 적는 관행은 그의 원장에서 지워졌다.",
            "가문·기업·공동체": "청람전자원(HC01)은 정비 우선 조항으로 당직 의무실 키 공유를 요구했다. 봉소는 후계 헌장 참관만 받고 실재 제품명을 활력 기록에서 뺐다. 공동체 위치는 권미래 밤샘 조 진료 횟수와 이중 서명 각성제 거절 횟수로 증명됐다. 전속 국가 소유 요구는 편성회의 게시 전에 반려된다.",
            "붕괴의 상처": "편집 공백이 발견된 밤 당직 두 명이 쓰러지고 각성제 봉인이 한 줄 빠져 있었다. 공포는 가짜 각성제가 당직 줄에 퍼져 조작 음성이 그대로 송신되는 장면이었다. 봉소는 빠진 봉인 줄을 방송 큐 위에 올려 두고 문을 잠갔다. LOSS 목록에는 그 공백 시각만 반복된다.",
            "생존 전환점": "전환점은 빠진 봉인을 추적할지, 의무실 열쇠를 편성회의와 나눠 쥘지다. 원양신탁전구(XT05)의 잔여 대역 추첨 소식이 당직실에 닿자 송신 압력이 올랐다. 추적은 공개망 신뢰를 살리고 열쇠 분할은 조작 위험을 남긴다. K223-TURN은 그 추첨 전 봉인 일지다.",
            "현재 지위": "봉소는 송신조 당직 의무원으로 점호와 활력 큐를 지킨다. 지위는 면허·이중 서명·문 게시로 유지되며 청람의 전속 요구는 거절한다. 문에는 오늘 각성제 잔량만 분필로 남긴다. Cast 현황과 활력 기록이 어긋나면 송신 대기 신호를 끈다.",
            "비밀·빚·죄책감": "비밀은 쓰러진 당직 한 명의 이름을 하루 늦게 올린 내부 전갈이다. 죄책감은 지킨 방송망과 그 하루 동안 미룬 동생 수면 교대 사이에 있다. 부분 공개는 황은설 입회 하에 전갈 요약만 허용한다. SECRET 키는 류은비 해열 배정 원장과 동시에만 열린다.",
            "관계 공동과거": "권미래의 밤샘 조 진료 계약, 황은설의 보류 방송 밤 대기, 류은비 해열 약재 빚이 한 송신 복도에 모인다. 같은 공백 밤 어떤 침묵은 구원이 되었고 어떤 각성제 줄은 배신으로 남았다. 관계 끝점은 STORY-B004-K223으로 연결된다. 경쟁은 손떨림 수치로만 재측정된다.",
            "3막 개인 서사선": "1막은 각성제 봉인 공백과 당직 붕괴다. 2막은 HC01 키 요구와 XT05 대역 추첨 압력의 교차다. 3막은 봉인 추적 또는 열쇠 분할 뒤 송신망이 치르는 신뢰 비용이다. 서사선은 STORY-B004-K223이다.",
            "분기 결말": "결말 α에서 봉소는 봉인 추적으로 공개 방송 신뢰를 택한다. 결말 β에서 열쇠 분할 후 개인 생존과 전갈을 지킨다. 상암송신공사 슬롯은 유지되고 분기만 K223-OUT이다. 개입은 봉인 추적 또는 열쇠 중재다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "각성제 봉인 공백에 당직실 문을 잠근다"
            },
            {
              "act": 2,
              "summary": "HC01 키 요구와 XT05 대역 추첨이 충돌한다"
            },
            {
              "act": 3,
              "summary": "봉인 추적 또는 열쇠 분할 뒤 송신 신뢰 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K223-OUT-A",
              "summary": "봉인 추적으로 방송망 공공 신뢰"
            },
            {
              "id": "K223-OUT-B",
              "summary": "열쇠 분할로 개인·전갈 유지"
            }
          ]
        },
        {
          "id": "K248",
          "name": "봉감",
          "links": {
            "house": "HP03",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B004-K248"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북산 건조장 옆 약초 탁자에서 봉감은 소속 완장보다 이마 열을 먼저 짚는다. 북산피난연맹 약초 의무원으로, 가짜 약 냄새가 나면 배급 줄을 멈추고 상자를 연다. 한국 기원이며 말수는 적지만 봉인 없는 상자는 즉시 격리한다. 봉감과 K248은 불변이다.",
            "붕괴 전 삶": "산악 약초와 외부 의약품을 한 장의 공개 배급표로 묶어 강국 구호가 보호비로 바뀌지 않게 하려 했다. 야망은 건조 중량·투약 명부 동시 게시 벽에 남았다. 조카에게 약속한 해열 약초 한 줌이 사적 빚의 씨앗이다. 봉인 없는 상자는 줄 가운데 두고 읽게 하는 규칙만은 양보하지 않았다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 투약 감사 의무를 내세워 건조장 열쇠 참관을 요구했다. 봉감은 후계 헌장 등재만 허용하고 실재 상호를 배급표에서 지웠다. 공동체 신뢰는 모감 건조 로트 검수 횟수와 황세린 저울 동시 확인 일수로 쌓였다. 전속 소유 문장은 숙영 게시판에 올리지 않았다.",
            "붕괴의 상처": "가짜 약품이 배급 줄에서 발견되고 제조 상자에 강국 봉인이 찍혀 있었다. 공포는 가짜 약이 아이 이름으로 기록되어 회랑 밖으로 끌려가는 명분이 되는 것이었다. 봉감은 해당 상자를 줄 한가운데 두고 봉인 문양을 소리 내어 읽혔다. LOSS 목록 첫 줄은 그 아이 이니셜이 아니라 상자 번호다.",
            "생존 전환점": "전환점은 가짜 약 상자를 추적할지, 건조장과 창고 열쇠를 구호 서기와 나눠 쥘지다. 두만극동전구(XT04)의 화차 중량 공개 소식이 닿자 구호 행렬 시계가 빨라졌다. 추적은 공공 투약 신뢰를 살리고 열쇠 분할은 민병과 충돌을 부른다. K248-TURN은 그 공개 전 상자 일지다.",
            "현재 지위": "봉감은 약초 의무원으로 점호와 투약 큐를 지킨다. 지위는 면허·동시 게시·검수 로그로 유지되며 HP03 전속 요구는 거절한다. 탁자 옆 벽에는 오늘 건조 중량만 분필로 남긴다. Cast 현황과 투약 명부가 어긋나면 배급 줄을 닫는다.",
            "비밀·빚·죄책감": "비밀은 가짜 약 의심 목록을 반나절 늦게 올린 쪽지다. 죄책감은 지킨 공개 표와 그 반나절 동안 기다린 조카 약 사이에 있다. 부분 공개는 황세린 입회 하에 쪽지 요약만 허용한다. SECRET 키는 류은비 북산 투약 감사와 동시에만 열린다.",
            "관계 공동과거": "모감의 건조장 검수 계약, 황세린의 약품 배급 저울 동맹, 류은비 투약 감사 빚이 한 줄에 선다. 같은 적발 아침 어떤 나눔은 구원이 되었고 어떤 봉인 은폐는 배신으로 남았다. 관계 끝점은 STORY-B004-K248로 이어진다. 신뢰는 건조 중량 오차로만 다시 잰다.",
            "3막 개인 서사선": "1막은 가짜 약 상자의 줄 가운데 공개다. 2막은 HP03 열쇠 참관과 XT04 화차 공개 사이의 잔량 시계다. 3막은 추적 또는 열쇠 분할 뒤 연맹이 치르는 신뢰 비용이다. 서사선은 STORY-B004-K248이다.",
            "분기 결말": "결말 α에서 봉감은 가짜 약 추적으로 공공 투약 신뢰를 택한다. 결말 β에서 열쇠 분할 중재 후 개인 생존과 쪽지를 지킨다. 북산피난연맹 슬롯은 유지되고 분기만 K248-OUT이다. 개입은 상자 추적 또는 열쇠 중재다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가짜 약 상자를 배급 줄 한가운데 연다"
            },
            {
              "act": 2,
              "summary": "HP03 참관과 XT04 화차 공개가 잔량을 재촉한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 열쇠 분할 뒤 연맹 신뢰 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K248-OUT-A",
              "summary": "가짜 약 추적으로 투약 공공 신뢰"
            },
            {
              "id": "K248-OUT-B",
              "summary": "열쇠 분할로 개인·쪽지 유지"
            }
          ]
        },
        {
          "id": "K273",
          "name": "봉복",
          "links": {
            "house": "HC07",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B004-K273"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 차륜 아래 의무 벤치에서 봉복은 국적란보다 끼인 손의 맥박을 먼저 짚는다. 창동차륜방 기지 의무원으로, 시험 기간 각성제를 숙련 증명으로 포장하는 말을 거부한다. 한국 기원이며 야간 수술은 반장과 도제 서명이 함께 있어야만 시작한다. 봉복과 K273은 고정 식별이다.",
            "붕괴 전 삶": "차량기지 의무실을 연공회의와 주거 감사가 함께 여는 거점으로 남겨 사고 은폐가 시험 점수가 되지 않게 하려 했다. 야망은 의무실 문 사고 활력 기록에 남았다. 견습공에게 약속한 봉합 키트 한 세트가 사적 빚의 씨앗이다. 제동 불량 부상자를 주거 민병 병상으로 보내지 않는 규칙만은 접지 않았다.",
            "가문·기업·공동체": "해동제철성(HC07)은 강재 의무 공급을 내세워 기지 의무실 좌석을 요구했다. 봉복은 후계 헌장 참관만 열고 실재 상호를 활력 기록에서 뺐다. 공동체 위치는 조우찬 작업 조 부상 처리 횟수와 권도하 북문 순찰 교대 진료 일수로 증명됐다. 전속 소유 요구는 연공회의 투표 전에 반려된다.",
            "붕괴의 상처": "시험 차륜 결함 직후 북문 순찰차가 제동 불량으로 정차해 의무실 당직이 하룻밤을 넘겼다. 공포는 부상자가 주거 민병 병상으로 옮겨져 기지 사고가 인구 분쟁으로 바뀌는 그림이었다. 봉복은 사고 활력 숫자를 문 밖에 붙이고 민병 이송 요청서를 접지 않은 채 반려했다. LOSS 목록 첫 줄은 제동 불량 시각이다.",
            "생존 전환점": "전환점은 부상 기록을 연공회의에 올릴지, 각성제 봉인을 의무실과 반장이 나눠 쥘지다. 두만극동전구(XT04)의 동절 연료 큐 조정 소식이 기지에 닿자 야간 수술 압력이 올랐다. 기록 공개는 공공 안전을 살리고 봉인 분할은 시험 점수 은폐를 막을 수도 자신을 표적으로 만들 수도 있다. K273-TURN은 그 회의 안건 번호다.",
            "현재 지위": "봉복은 기지 의무원으로 점호와 부상 큐를 지킨다. 지위는 면허·이중 서명·문 게시로 유지되며 해동의 전속 요구는 거절한다. 벤치 옆 칠판에는 오늘 제동 시험 건수만 분필로 남긴다. Cast 현황과 활력 기록이 어긋나면 야간 수술을 멈춘다.",
            "비밀·빚·죄책감": "비밀은 각성제 한 앰플을 시험 전 회수한 내부 메모다. 죄책감은 살린 순찰 대원과 그 때문에 늦춘 견습 봉합 키트 사이에 있다. 부분 공개는 전미리 입회 하에 메모 한 줄만 허용한다. SECRET 키는 의료열차 병상 비움 로그와 동시에만 열린다.",
            "관계 공동과거": "조우찬 작업 조 부상 계약, 권도하 북문 순찰 교대 진료, 전미리 의료열차 병상 양보가 한 기지에 모인다. 같은 결함 밤 어떤 이송은 구원이 되었고 어떤 각성제 포장은 배신으로 남았다. 관계 끝점은 STORY-B004-K273으로 연결된다. 경쟁은 맥박 안정 시간으로만 재판정된다.",
            "3막 개인 서사선": "1막은 제동 불량 부상과 민병 이송 거절이다. 2막은 HC07 좌석 요구와 XT04 연료 큐 압력의 교차다. 3막은 기록 공개 또는 봉인 분할 뒤 기지가 치르는 시험 점수 비용이다. 서사선 ID는 STORY-B004-K273이다.",
            "분기 결말": "결말 α에서 봉복은 부상 기록 공개로 공공 기지 안전을 택한다. 결말 β에서 각성제 봉인 분할 후 개인 생존과 메모를 지킨다. 창동차륜방 슬롯은 유지되고 분기만 K273-OUT이다. 개입은 회의 증언 또는 봉인 중재다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "제동 불량 부상을 민병 병상 이송 없이 기록한다"
            },
            {
              "act": 2,
              "summary": "HC07 좌석 요구와 XT04 연료 큐가 야간 수술을 압박한다"
            },
            {
              "act": 3,
              "summary": "기록 공개 또는 봉인 분할 뒤 시험 점수 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K273-OUT-A",
              "summary": "부상 기록 공개로 기지 공공 안전"
            },
            {
              "id": "K273-OUT-B",
              "summary": "각성제 봉인 분할로 개인·메모 보호"
            }
          ]
        },
        {
          "id": "K166",
          "name": "박태겸",
          "links": {
            "house": "HC11",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B004-K166"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산 화물홈 배차실에서 박태겸은 미소로 인사를 받은 뒤 장기 배차표 칸부터 채운다. 용산철도후국 철도조정관으로, 어느 편에도 독점 열차를 주지 않고 상호 인질 대신 도제 교환을 쓴다. 한국 출생 다문화 가정에서 자랐고 집에서는 한국어와 부모의 이주 언어가 섞이지만 배차 원장에는 시각과 선로 번호만 올린다. 그 이력은 충성이나 폭력의 예측 변수가 아니며 협상 통역이 필요할 때만 언급된다. 박태겸과 K166은 불변이다.",
            "붕괴 전 삶": "혈연 선로가문의 거부권을 없애고 양자·도제 승계를 정착시켜 중계국 지위를 지키려 했다. 야망은 심야 슬롯 양보 일지에 남았고, 김도윤과의 기술자 교환이 그 뼈대였다. 임초원에게 봉인 상태로만 전한 후계 제안이 사적 빚의 씨앗이다. 빈 상자로 무게를 속이는 허가증은 그의 원장에서 즉시 무효였다.",
            "가문·기업·공동체": "백야배송단(HC11) 스튜어드로서 야간 호송 허가증을 지키되 전속 국가 소유 문장은 거부한다. 신내 의료열차와 충돌할 때는 공동 점검만 열고 키는 넘기지 않는다. 공동체 위치는 도제 교환 성사 건수와 상호 인질 거부 횟수로 증명된다. 실재 상호·제품명은 배차표에 등장하지 않는다.",
            "붕괴의 상처": "용산 선로가문이 임초원의 귀환 열차를 억류한 밤, 박태겸은 독점 회송 요구를 배차판에서 지우고 공공 중계 칸만 남겼다. 공포는 용산이 강국 전쟁터가 되어 중계국 지위가 사라지는 장면이었다. 그는 억류 시각과 가문 인장 사본을 이중으로 게시했다. LOSS 목록 첫 줄은 그 억류 시각이다.",
            "생존 전환점": "전환점은 억류 열차를 탈환 호송할지, 가문회의에서 양자 승계안을 공개 표결에 부칠지다. 해협삼로전구(XT03)의 환적창 폐쇄 전갈이 배차실에 닿자 심야 슬롯 계산이 기울었다. 탈환은 중계 공공성을 살리고 표결은 조정관 자신을 가문 표적으로 만든다. K166-TURN은 그 전갈 수신 후 첫 배차 도장이다.",
            "현재 지위": "박태겸은 철도조정관으로 점호와 배차 큐를 지킨다. 지위는 면허·도제 서명·공동 점검 로그로 유지되며 백야 전속 요구는 거절한다. 배차판에는 오늘 의료 양보 슬롯만 분필로 남긴다. Cast 프로필과 배차 원장 해시가 어긋나면 출고 허가를 멈춘다.",
            "비밀·빚·죄책감": "비밀은 임초원 후계 제안 봉인 사본을 가문 몰래 보관한 함이다. 죄책감은 지킨 중계와 그 때문에 하루 늦은 도제 교환 사이에 있다. 부분 공개는 권시온 입회 하에 제안 한 줄만 허용한다. SECRET 키는 황지호 도제 일지와 동시에만 열린다.",
            "관계 공동과거": "김도윤과의 기술자 교환 동맹, 한재목 서부 철도계약, 임초원 비밀 후계 제안, 신가온과의 후계 경쟁이 한 배차실에 겹친다. 같은 억류 밤 어떤 슬롯 양보는 구원이 되었고 어떤 가문 인장은 배신으로 남았다. 관계 끝점은 STORY-B004-K166으로 연결된다. 가정 언어의 혼재는 통역 속도와만 연결될 뿐 진영을 나누지 않는다.",
            "3막 개인 서사선": "1막은 귀환 열차 억류와 독점 회송 거절이다. 2막은 HC11 호송 허가와 XT03 환적 폐쇄 사이의 슬롯 전쟁이다. 3막은 탈환 또는 양자 표결 뒤 조정관직이 치르는 권한 비용이다. 서사선은 STORY-B004-K166이다.",
            "분기 결말": "결말 α에서 박태겸은 열차 탈환 호송으로 공공 중계 연속을 택한다. 결말 β에서 양자 승계 표결 후 개인 생존과 봉인 함을 지킨다. 용산철도후국 슬롯은 유지되고 분기만 K166-OUT이다. 개입은 탈환 엄호 또는 가문회의 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "억류된 귀환 열차의 독점 회송 요구를 배차판에서 지운다"
            },
            {
              "act": 2,
              "summary": "HC11 허가와 XT03 환적 폐쇄 사이 슬롯을 겨룬다"
            },
            {
              "act": 3,
              "summary": "탈환 또는 양자 표결 뒤 조정 권한 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K166-OUT-A",
              "summary": "탈환 호송으로 중계 공공 연속"
            },
            {
              "id": "K166-OUT-B",
              "summary": "양자 표결 후 개인·봉인 함 유지"
            }
          ]
        },
        {
          "id": "K190",
          "name": "오해린",
          "links": {
            "house": "HC06",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B004-K190"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 냉동 경매장 단상에서 오해린은 웃는 얼굴로 호가를 받은 뒤 손실을 숨긴 장부를 가리킨다. 노량진남관상회 냉동상인 대표로, 가격과 재고는 공개하고 호송권만 비공개 경매에 붙인다. 한국 출생 다문화 배경을 가졌고 시장 통역과 집 안 언어를 오가지만 그 조합은 흥정 속도의 배경일 뿐 능력이나 폭력의 보증이 아니다. 오해린과 K190은 불변 식별이다.",
            "붕괴 전 삶": "물·전력·식량 계약을 교환할 수 있는 서울 공통 결제권을 발행해 강국 보호비 바깥의 신용을 만들려 했다. 야망은 정오 공개 시세판에 남았고 허위 재고 칸은 경매 자격을 잃었다. 문가람에게 맡긴 시세 방송 초안이 사적 동맹의 씨앗이다. 냉동이 멈추면 신용이 하루 만에 사라진다는 문장은 상회 규약 첫 줄이다.",
            "가문·기업·공동체": "골목연결국(HC06) 스튜어드로서 근거리 수레 배차권을 지키되 장거리 배송단에는 공동 점검만 연다. 실재 상호·제품명은 결제권 초안에서 제외한다. 공동체 위치는 공개 재고 게시 일수와 비공개 호송 경매 성사 건수로 증명된다. 전속 국가 소유 요구는 상회정 투표 전에 반려된다.",
            "붕괴의 상처": "정전으로 냉동창고 식량이 상하기 시작한 밤, 오해린은 녹은 칸을 경매장 한가운데 사진으로 붙이고 은폐 장부를 찢었다. 공포는 상회 신용이 하루 만에 증발해 공통 결제권 초안이 휴지가 되는 장면이었다. 그는 온도 위험선을 시세판에 붉은 줄로 그었다. LOSS 목록 첫 줄은 그 온도 숫자다.",
            "생존 전환점": "전환점은 발전 부품을 구해 냉동을 살릴지, 재고 은폐 경로를 상회 전체에 폭로할지다. 서해곡창전구(XT02)의 해상 담수·전력 제안이 들어오자 결제권 초안의 무게가 달라졌다. 수리는 공공 신용을 살리고 폭로는 대표 자신을 내분 표적으로 만든다. K190-TURN은 그 제안서의 수신 시각 도장이다.",
            "현재 지위": "오해린은 냉동상인 대표로 점호와 경매 큐를 지킨다. 지위는 면허·공개 시세·참관 로그로 유지되며 골목연결국 전속 요구는 거절한다. 단상 옆 칠판에는 오늘 위험 온도 칸만 분필로 남긴다. Cast 현황과 재고 게시가 어긋나면 호송 경매를 중지한다.",
            "비밀·빚·죄책감": "비밀은 결제권 초안에 적었다가 지운, 특정 상인 우선 정산 조항이다. 죄책감은 지킨 상회 신용과 그 때문에 줄인 골목 소상인 배분 사이에 있다. 부분 공개는 조민재 입회 하에 조항 한 줄만 허용한다. SECRET 키는 시세 방송 원장과 동시에만 열린다.",
            "관계 공동과거": "남윤경과 가격 주도권 경쟁, 한재목과 전력·물 계약, 문가람 시세 방송 위임, 조민재·윤서하·신태산·서나연으로 이어지는 실무 지휘가 한 경매장에 모인다. 같은 정전 밤 어떤 공개는 구원이 되었고 어떤 은폐는 배신으로 남았다. 관계 끝점은 STORY-B004-K190으로 연결된다. 다문화 가정사는 통역이 필요할 때만 언급되며 진영 분할의 근거가 되지 않는다.",
            "3막 개인 서사선": "1막은 위험 온도 칸의 공개 적발이다. 2막은 HC06 배송 점검과 XT02 해상 전력 제안 사이의 신용 전쟁이다. 3막은 부품 수리 또는 은폐 폭로 뒤 대표직이 치르는 내분 비용이다. 서사선은 STORY-B004-K190이다.",
            "분기 결말": "결말 α에서 오해린은 발전 부품 수리로 공공 냉동 신용 연속을 택한다. 결말 β에서 재고 은폐 폭로 후 개인 생존과 비밀 조항을 지킨다. 노량진남관상회 슬롯은 유지되고 분기만 K190-OUT이다. 개입은 부품 호송 또는 장부 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "녹은 냉동 칸을 경매장에 사진으로 공개한다"
            },
            {
              "act": 2,
              "summary": "HC06 점검과 XT02 해상 전력 제안 사이 신용을 겨룬다"
            },
            {
              "act": 3,
              "summary": "수리 또는 폭로 뒤 상회 내분 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K190-OUT-A",
              "summary": "발전 수리로 냉동 공공 신용 연속"
            },
            {
              "id": "K190-OUT-B",
              "summary": "은폐 폭로 후 개인·비밀 조항 유지"
            }
          ]
        },
        {
          "id": "K317",
          "name": "은채윤",
          "links": {
            "house": "HP03",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B004-K317"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령 치료실 중증도 표 앞에서 은채윤은 적의 견장보다 호흡 수를 먼저 적는다. 약령의정동맹 치료사로, 손놀림은 부드러우나 치료 순서를 바꾸라는 압력에는 차갑다. 중국계 이산 가족 사이에서 자랐고 집 안 언어와 진료실 한국어를 오가지만, 그 이력은 충성·괴물성·계급을 예측하지 않으며 통역이 필요할 때만 드러난다. 은채윤과 K317은 불변이다.",
            "붕괴 전 삶": "적군 부상자도 중증도만으로 받는 진료 기록을 서울 의료헌장 본문으로 남기려 했다. 야망은 중증도 표와 기여 노동을 나란히 적은 배정판에 남았다. 류은비 도제로서 받은 첫 면허 시험 자리가 사적 빚의 씨앗이다. 강국 장교의 우선 치료 요청은 길드 회의에 올리는 규칙만은 양보하지 않았다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 면허 당직 의무를 내세워 치료실 순번에 참관한다. 은채윤은 후계 헌장 창구만 인정하고 실재 상호를 헌장 초안에서 지웠다. 공동체 위치는 방한울·방미산에게 넘긴 침상 순서 집행 횟수로 증명된다. 전속 국가 소유 요구는 길드 투표 전에 반려된다.",
            "붕괴의 상처": "가짜 해열제가 북산 어린이에게 쓰인 뒤, 제조 캡슐이 강국 보호창고 인장과 같다는 증언이 치료실에 들어왔다. 공포는 진료실이 전리품 분류장이 되어 약령 정통성이 한 계절에 무너지는 장면이었다. 은채윤은 해당 캡슐을 중증도 표 아래에 봉인하고 장교 우선 요청을 회의 안건으로 올렸다. LOSS 목록 첫 줄은 캡슐 인장 코드다.",
            "생존 전환점": "전환점은 캡슐 인장을 대조 공개할지, 적군 부상자를 숨겨 헌장 위반 누명을 피할 임시 병상으로 돌릴지다. 두만극동전구(XT04)의 동상 환자 유입 소식이 닿자 병상 시계가 빨라졌다. 공개 대조는 공공 헌장을 살리고 은닉은 치료사 자신을 누명 표적으로 만든다. K317-TURN은 그 안건의 표결 기호다.",
            "현재 지위": "은채윤은 치료사로 점호와 중증도 큐를 지킨다. 지위는 면허·길드 서명·참관으로 유지되며 HP03 전속 요구는 거절한다. 배정판에는 오늘 적군·아군 구분 없는 중증 수만 분필로 남긴다. Cast 현황과 헌장 해시가 어긋나면 우선 치료 요청을 멈춘다.",
            "비밀·빚·죄책감": "비밀은 인장 증언을 반나절 늦게 올린 내부 메모다. 죄책감은 지킨 헌장과 그 반나절 동안 해열을 기다린 아이 사이에 있다. 부분 공개는 류은비 입회 하에 메모 요약만 허용한다. SECRET 키는 신내 이송 병상 로그와 동시에만 열린다.",
            "관계 공동과거": "류은비 도제 사제 관계, 백온 피난민 수용 계약, 전미리 신내 이송 병상 맞춤, 방한울·방미산 실무 지휘가 한 치료실에 모인다. 같은 증언 날 어떤 병상은 구원이 되었고 어떤 우선 요청은 배신으로 남았다. 관계 끝점은 STORY-B004-K317으로 연결된다. 이산 가족 언어는 통역 창구의 속도와만 연결된다.",
            "3막 개인 서사선": "1막은 가짜 해열 캡슐의 봉인과 회의 상정이다. 2막은 HP03 당직 참관과 XT04 동상 유입 사이의 병상 전쟁이다. 3막은 인장 공개 또는 임시 은닉 뒤 길드가 치르는 정통성 비용이다. 서사선은 STORY-B004-K317이다.",
            "분기 결말": "결말 α에서 은채윤은 캡슐 인장 대조 공개로 공공 의료헌장을 택한다. 결말 β에서 임시 병상 은닉 후 개인 생존과 메모를 지킨다. 약령의정동맹 슬롯은 유지되고 분기만 K317-OUT이다. 개입은 인장 대조 또는 병상 엄호다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가짜 해열 캡슐을 중증도 표 아래 봉인한다"
            },
            {
              "act": 2,
              "summary": "HP03 참관과 XT04 동상 유입이 병상을 압박한다"
            },
            {
              "act": 3,
              "summary": "인장 공개 또는 은닉 뒤 길드 정통성 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K317-OUT-A",
              "summary": "인장 공개로 의료헌장 공공 유지"
            },
            {
              "id": "K317-OUT-B",
              "summary": "임시 은닉 후 개인·메모 보호"
            }
          ]
        },
        {
          "id": "H04",
          "name": "강별",
          "links": {
            "house": "HC04",
            "theater": "XT04",
            "scenarios": [
              "STORY-B004-H04"
            ],
            "custodian": "K085"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "S04 뚝도 공구 벽에서 호출명 별인 강별은 인간형 보조 골격과 교체형 손모듈로 기립한다. H급 합성 인격으로 야간 시야는 제한되고 국가 슬롯은 S04에만 고정된다. 인간 ID 공간과 분리된 H04를 유지하며 장기 완전 기억은 설계에서 빠졌다. 감정 서술 대신 제약 카운터와 스냅샷 해시로 상태를 남긴다.",
            "붕괴 전 삶": "붕괴 전 강별은 시범 교대만 돌렸고 전지 권한과 완전 기억은 부여되지 않았다. 출고 검사표에는 별 교정값과 배터리 사이클만 찍혔다. B004는 그 시범 로그를 원점으로 삼고 기억 포크 금지 조항을 H04-PRE에 고정한다. 인간 동료의 농담을 기록해도 해석 레이어는 올리지 않았다.",
            "가문·기업·공동체": "보관 책임은 HC04 공동 보관과 담당 인간 임하준(K085) 서명에 묶인다. 정비 주체는 창작 후계 가문 창구로만 적고 실재 기업 제품명은 본문에 쓰지 않는다. 시민 참관 봉인 칸에 H04 해시가 게시되며 양도 시 삼자 서명이 필요하다. 공동체는 강별을 소유물이 아니라 할당 슬롯의 작동자로 본다.",
            "붕괴의 상처": "붕괴는 공구 벽 센서 테이블을 끊고 배터리 할당 한도를 드러냈다. 강별은 공백을 허구 값으로 메우지 못하도록 잠겼고 측정 불능 플래그만 일지에 남았다. 단절 시각 표기는 B004-H04-WOUND다. 충전 칸 경보가 울려도 전체 망 권한 요청은 거절 코드로 응답했다.",
            "생존 전환점": "전환점은 구역 키만 요청하고 교차 시설 루트를 닫은 순간이다. 두만극동전구(XT04) 신호가 도착해도 권역 외 제어는 열지 않았다. 재연결 조건은 K085 승인 후에만 성립하며 그 결정은 H04-TURN 로그로 보존된다. 부품 부족 시 다른 시설 제어권을 가로채지 않는 제약이 우선한다.",
            "현재 지위": "현재 목표는 S04 구역 연속 가동과 담당 인간 안전이다. 강별은 인프라 전체를 소유하지 않고 할당 슬롯만 사용한다. 상태 공개는 교대 스냅샷으로 제한되며 Synthetic-Actors 투영의 H04 행과 불일치하면 배치 검증이 실패한다. 배터리와 마모 부품은 할당제로만 보충된다.",
            "비밀·빚·죄책감": "비밀은 미전송 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 대신 제약 위반 카운터가 증가하며 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. B004에서 비밀 키는 시민 참관 없이 열리지 않는다. 롤백 전 해시는 K085 입회 로그에만 남는다.",
            "관계 공동과거": "관계 축은 K085 보관과 HC04 스튜어드십, 작업 동료 K025 교대다. 강별과 임하준은 봉인 키를 교대 회수한 기록이 있다. 잘못된 기억 포크는 H04-FORK-01로만 주석되고 삭제 명령 없이 분기 로그만 남긴다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다.",
            "3막 개인 서사선": "1막에서 센서 공백이 S04 일정을 멈춘다. 2막에서 HC04와 K085이 부분 재연결 범위를 협상한다. 3막에서 강별은 격리 뒤 구역 권한만 복구한다. 서사선 ID는 STORY-B004-H04로 고정된다.",
            "분기 결말": "결말 α에서 강별은 인간 승인 아래 제한 재가동한다. 결말 β에서 장기 오프라인 보관으로 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다. 분기 식별은 H04-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "센서 공백으로 S04 일정이 정지한다"
            },
            {
              "act": 2,
              "summary": "HC04·K085이 부분 재연결 범위를 협상한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 권한만 복구한다"
            }
          ],
          "outcomes": [
            {
              "id": "H04-OUT-A",
              "summary": "인간 승인 하 제한 재가동"
            },
            {
              "id": "H04-OUT-B",
              "summary": "장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B005": {
      "id": "B005",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K298",
          "name": "국용",
          "links": {
            "house": "HC05",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B005-K298"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내 환승 승강장 아래 당직실에서 국용은 들것 바퀴 자국이 멈춘 칸부터 연다. 그는 신내망우환승시의 환승 당직 의무원으로, 국적 칸이 먼저 적힌 이송표를 보면 펜을 꺾는다. 한국 기원으로 동북 환승권에서 자랐고, 성정은 조용하나 활력 숫자가 떨어지면 목소리가 커진다. 표시 이름 국용과 불변 식별자 K298은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 중랑·망우 응급 이송과 약령 치료계약을 한 장의 호송증에 묶으려 초안을 밤새 고쳤다. 강국 보호비 없는 의료회랑을 당직실 칠판에 먼저 그리려는 야망이었다. 동생에게 남긴 쪽지—부상 등급 없는 칸은 태우라—가 훗날 빚의 씨앗이 된다. 배차조가 빈 슬롯을 들이밀어도 활력이 안정되기 전에는 서명을 주지 않았다.",
            "가문·기업·공동체": "북문지식원(HC05)은 환승 의료 참관 칸을 요구했으나 국용은 실재 회사 상호를 원장에 올리지 않는 후계 헌장만 받았다. 무기 적재 의심 칸은 심사관 입회 없이 열지 않았고, HC05 감사는 정기 등재만 청구할 수 있었다. 공동체 위치는 들것 순서표를 양쪽에 동시에 붙인 기록으로 증명됐다. 가문 창구가 우선 이송 방송을 내밀면 그는 중증도 미기재를 이유로 무효를 선언했다.",
            "붕괴의 상처": "북산 남하 행렬이 신내 승강장에 쌓인 밤, 환자 칸이 군수 칸으로 오인될 뻔했다. 국용은 당직을 연장하고 배차조 교대를 거부한 채 중증도 표만 벽에 남겼다. 공포의 핵은 호송대 전체가 무장 해제를 당해 들것이 선로 위에 버려지는 장면이었다. 경보가 꺼진 뒤에도 그는 LOSS 목록의 중간 줄에서 펜을 멈추지 못한 채 장갑을 벗지 않았다.",
            "생존 전환점": "전환점은 환자 명부와 무기 적재 기록을 먼저 대조할지, 의료회랑 호송증 초안을 당직실에서 복사해 전미리에게 넘길지 고른 순간이다. 두만극동전구(XT04)에서 들어온 호송 요청이 승강장 확성기와 겹치자 계산이 달라졌다. 명부 대조를 우선하면 오인 사격은 줄지만 대기 환자가 늘고, 호송증 복사를 우선하면 회랑은 열리되 한 칸의 무기가 숨을 수 있다. 그 선택은 K298-TURN으로 남고, 되돌리면 신내 일부 당직 슬롯이 비다.",
            "현재 지위": "지금도 국용은 신내망우환승시 환승 당직 의무원으로 점호와 들것 큐를 지킨다. 지위는 세습이 아니라 면허·서명·심사 입회 로그로만 유지된다. 북문지식원이 전속 이송 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 당직실 문은 두 열쇠 체계로 바뀌었고 한 자루는 전미리 지휘함, 다른 한 자루는 감모 의료조 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 서랍에 가둔, 국적란이 먼저 찍힌 이송표 사본 묶음이다. 죄책감은 살린 중증 명단과 그 밤 호출하지 못한 배차 견습 한 명의 이름 사이에서만 자란다. 전부를 공개하면 환승시 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 심사관과 의무원 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "전미리의 들것 순서 지휘는 사제 계약이었고, 감모와 나눈 병상은 동맹이었다. 류은비의 의료동맹 호송증을 당직 원장에 옮긴 밤은 빚이었으며, 배차조와는 빈 슬롯을 두고 경쟁이 남았다. 같은 승강장에서 어떤 칸은 구원이 되었고 어떤 칸은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B005-K298에 연결된다.",
            "3막 개인 서사선": "1막에서 국용은 남하 행렬의 오인 군수 칸 위기를 정면으로 맞는다. 2막에서 그는 HC05 참관과 XT04 호송 요청을 한 당직 책상에서 저울질한다. 3막에서 명부 대조 또는 호송증 복사의 대가를 대기 시간으로 치른다. 서사선 식별자는 STORY-B005-K298로 고정된다.",
            "분기 결말": "결말 α에서 국용은 환자·무기 명부 대조를 우선해 오인 해제를 고른다. 결말 β에서 그는 의료회랑 호송증 복사를 우선해 회랑 개방을 지킨다. 어느 쪽도 신내망우환승시의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K298-OUT으로 갈라진다. 플레이 개입은 명부 대조 또는 호송증 복사 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "남하 행렬 속 오인 군수 칸 위기에 당직을 연장한다"
            },
            {
              "act": 2,
              "summary": "HC05 참관과 XT04 호송 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "명부 대조 또는 호송증 복사의 대가로 대기 시간을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K298-OUT-A",
              "summary": "환자·무기 명부 대조로 오인 해제"
            },
            {
              "id": "K298-OUT-B",
              "summary": "의료회랑 호송증 복사로 회랑 개방"
            }
          ]
        },
        {
          "id": "K323",
          "name": "방한울",
          "links": {
            "house": "HC05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B005-K323"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령시장 안쪽 진료소에서 방한울은 중증도 표의 잉크가 번진 칸부터 다시 쓴다. 그는 약령의정동맹의 중증도 진료 의무원으로, 우선 치료 쪽지를 받으면 침상 자물쇠를 먼저 잠근다. 한국 기원으로 동대문 생활권에서 자랐고, 손놀림은 조용하나 적의 부상도 같은 줄로 본다. 이름 방한울과 식별자 K323는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 적군 부상자도 중증도만으로 받는 진료 기록을 의정회 헌장 부칙의 현장 원본으로 남기려 했다. 야망은 길드 게시판에 붙인 중증도 견본 한 장에서 시작됐다. 스승 은채윤에게 바친 첫 도제 서약—쪽지로 순서를 바꾸지 않는다—가 훗날 빚의 원형이 된다. 강국 장교가 우선 침상을 요구해도 그는 기여 노동 칸이 비면 거절했다.",
            "가문·기업·공동체": "HC05 북문지식원은 약효 감사 명분을 내세워 진료소 선반 참관을 요구했다. 방한울은 후계 헌장의 참관 칸만 열고 전속 소유 문장은 거절했다. 공동체 안 위치는 중증도 표와 기여 노동표를 나란히 붙인 횟수로 증명됐고, 의정회와 환자대표가 동시에 사본을 받은 날만 침상이 열렸다. 실재 상호나 가문 로고는 그의 원장에 등장하지 않는다.",
            "붕괴의 상처": "가짜 해열제가 북산 어린이에게 쓰인 뒤, 같은 캡슐 모양의 약이 진료소 선반에서 한 통 더 나왔다. 방한울은 선반을 봉인하고 은채윤의 입회가 올 때까지 처방을 멈췄다. 공포는 자신이 찍은 중증도 표가 전리품 분류장의 휴지가 되는 그림이었다. 경보음 대신 약 냄새만 남은 복도에서 그의 LOSS 목록 첫 줄은 어린이 이니셜이었다.",
            "생존 전환점": "전환점은 선반 약을 성분 대조로 추적할지, 적군 부상자를 숨겨 헌장 위반 누명을 피할 우회로를 만들지 고른 순간이다. 임진관문전구(XT01) 구호 행렬이 약령 골목에 닿자 시계가 달라졌다. 추적을 고르면 가짜 약 경로는 드러나지만 침상 수가 줄고, 은닉을 고르면 한 명은 살지만 헌장 원본이 흔들린다. 선택은 K323-TURN으로 남고, 되돌리면 동측 진료 교대가 멈춘다.",
            "현재 지위": "지금도 방한울은 약령의정동맹 중증도 진료 의무원으로 침상 순서와 선반 봉인을 지킨다. 지위는 도제 서명과 의정회 참관 로그만으로 유지된다. 북문지식원이 우선 처방권을 요구해도 그는 중증도 미기재 처방을 거부한다. 진료소 열쇠는 은채윤과 방미산이 나누어 쥐며 Cast 현황 칸과 매주 대조한다.",
            "비밀·빚·죄책감": "비밀은 봉인 선반 뒤에 남은, 성분 미상의 캡슐 한 병이다. 죄책감은 살린 적군 부상병과 그 주 약을 받지 못한 골목 아이 사이에서만 자란다. 전면 공개는 약령 신뢰 한 줄을 끊을 수 있어 이중 입회 공개만 남겼다. SECRET 키는 환자대표와 의무원 동시 날인 없이는 열리지 않는다.",
            "관계 공동과거": "은채윤의 도제 서약은 사제였고, 방미산과 나눈 병상은 동맹이었다. 류은비의 치료 원칙을 당직 원장 맨 위에 둔 밤은 계약이었으며, 강국 장교 쪽지와는 침상 자물쇠를 둔 경쟁이 남았다. 같은 줄에서 어떤 처치는 구원이 되었고 어떤 은폐는 배신으로 읽혔다. 관계 끝점은 STORY-B005-K323로 이어진다.",
            "3막 개인 서사선": "1막에서 방한울은 가짜 해열제 선반 봉인을 다시 만난다. 2막에서 HC05 참관과 XT01 구호 행렬 사이의 잔량 시계를 잰다. 3막에서 추적 또는 은닉의 대가를 침상 공백으로 치른다. 서사선은 STORY-B005-K323이다.",
            "분기 결말": "결말 α에서 방한울은 성분 추적으로 가짜 약 경로를 공개한다. 결말 β에서 그는 적군 부상자 은닉 경로를 닫아 헌장 원본을 지킨다. 어느 쪽도 약령의정동맹 슬롯을 삭제하지 않으며 분기는 K323-OUT이다. 플레이 개입은 선반 대조 또는 은닉 차단 중 하나를 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가짜 해열제 선반을 봉인하고 처방을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC05 참관과 XT01 구호 행렬의 잔량을 잰다"
            },
            {
              "act": 3,
              "summary": "추적 또는 은닉 차단의 대가로 침상 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K323-OUT-A",
              "summary": "성분 추적으로 가짜 약 경로 공개"
            },
            {
              "id": "K323-OUT-B",
              "summary": "은닉 경로 차단으로 헌장 원본 유지"
            }
          ]
        },
        {
          "id": "K348",
          "name": "영석온",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B005-K348"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "아차산 능선 의무막에서 영석온은 상처의 열을 고지 바람보다 먼저 읽는다. 그는 아차구의관문국의 능선·교량 당직 의무원으로, 초병의 단독 차단을 진료 중단의 원인으로 일지에 적는다. 한국 기원으로 광진 생활권에서 자랐고, 적의 부상도 활력이 떨어지면 같은 들것으로 본다. 이름 영석온과 식별자 K348은 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 능선과 교량 사이 응급 이송을 약령 의무호송과 한 장의 호송증으로 묶으려 했다. 관문국이 치료 회랑의 한쪽 기둥이 되게 하려는 야망이었고, 초안은 의무막 칠판 구석에 먼저 적혔다. 남호성에게 보낸 짧은 전갈—잔압 없는 차단은 적지 말라—가 훗날 빚이 된다. 전시 단독지휘 쪽지가 와도 기술자 회의 거부권이 풀리기 전엔 침상에 들이지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 고지 방호 의무를 내세워 의무막 참관을 요구했다. 영석온은 실재 상호 없는 후계 헌장 참관 칸만 허용했다. 공동체 위치는 중증도 표와 급수 시간을 같은 칠판에 붙인 날수로 증명됐고, 영한뫼 의무소와 사본을 동시에 받은 밤만 호송이 열렸다. 가문 로고 방송은 날인 없음을 이유로 일지에서 지웠다.",
            "붕괴의 상처": "교량 쪽 상수관 파손 연기를 적대 봉화로 오인한 밤, 의무소 대기표에 무장 대기열이 한 줄 끼어 들었다. 영석온은 무장 줄과 환자 줄을 밧줄로 갈라 놓고 잔압 기록이 올 때까지 이송을 멈췄다. 공포는 고지가 뚫린 뒤 의무소가 전리품 창구로 바뀌는 장면이었다. LOSS 목록에는 비운 병상 수와 깨진 급수통 숫자가 나란히 남았다.",
            "생존 전환점": "전환점은 무장 줄을 환자 줄과 완전히 분리해 공개할지, 호송증 초안을 약령까지 몰래 운반할지 고른 순간이다. XT04 두만극동전구의 야간 신호가 능선 호각과 겹치자 선택의 무게가 바뀌었다. 분리를 고르면 초병 신뢰는 살지만 호송이 하루 늦고, 운반을 고르면 회랑은 열리되 대기표 조작 혐의가 붙는다. 선택은 K348-TURN이며 되돌리면 능선 교대 한 슬롯이 비다.",
            "현재 지위": "지금도 영석온은 아차구의관문국 능선·교량 당직 의무원으로 칠판과 들것 순번을 지킨다. 지위는 면허와 이중 날인 로그만으로 유지된다. HC08이 전시 단독 처치권을 요구해도 그는 잔압 미기재 명령을 거부한다. 의무막 열쇠는 영한뫼와 남호성이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 오인 봉화 밤의, 초병이 건넨 서명 없는 차단 쪽지다. 죄책감은 살린 교량 부상자와 그 밤 부르지 못한 급수 기술자 한 명 사이에서만 자란다. 전면 공개는 관문국 신뢰 한 줄을 끊을 수 있어 이중 입회 공개만 남겼다. SECRET 키는 의무원과 물 기술자 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "영한뫼와 나눈 병상은 동맹이었고, 남호성의 호송증을 원장에 옮긴 밤은 계약이었다. 류은비의 치료 원칙을 고지 침상에 붙인 일은 빚이었으며, 초병 단독 차단과는 밧줄 경계선을 둔 경쟁이 남았다. 같은 능선에서 어떤 이송은 구원이 되었고 어떤 대기열은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K348로 연결된다.",
            "3막 개인 서사선": "1막에서 영석온은 오인 봉화 밤의 무장 대기열을 다시 만난다. 2막에서 HC08 방호 요구와 XT04 야간 신호를 칠판 위에서 저울질한다. 3막에서 줄 분리 또는 호송증 운반의 대가를 지연 시간으로 치른다. 서사선 ID는 STORY-B005-K348이다.",
            "분기 결말": "결말 α에서 영석온은 무장·환자 줄 공개 분리로 초병 신뢰를 고른다. 결말 β에서 그는 호송증 운반을 우선해 치료 회랑을 연다. 어느 쪽도 관문국 슬롯을 삭제하지 않으며 분기는 K348-OUT이다. 플레이 개입은 줄 분리 또는 호송증 운반이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "오인 봉화 밤 무장 대기열을 밧줄로 가른다"
            },
            {
              "act": 2,
              "summary": "HC08 방호와 XT04 야간 신호를 저울질한다"
            },
            {
              "act": 3,
              "summary": "줄 분리 또는 호송 운반의 대가로 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K348-OUT-A",
              "summary": "무장·환자 줄 공개 분리로 초병 신뢰 유지"
            },
            {
              "id": "K348-OUT-B",
              "summary": "호송증 운반 우선으로 치료 회랑 개방"
            }
          ]
        },
        {
          "id": "K373",
          "name": "방늘재",
          "links": {
            "house": "HC09",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B005-K373"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "잠실 광장 의무막 앞에서 방늘재는 줄 선 얼굴을 열과 탈수로 먼저 읽는다. 그는 가락잠실배급국의 잠실 집결 의무소 거점 의무원으로, 기근 배급을 시혜 연설로 포장하는 쪽지를 찢는다. 한국 기원으로 송파 생활권에서 자랐고, 비밀 군량 소문을 진료 대기의 적으로 여긴다. 이름 방늘재와 식별자 K373은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 기근 줄의 진료와 배급 순서를 공개 추첨과 부양 가족 수로 고정하려 했다. 후계 거래용 비밀 군량이 침상을 사지 못하게 하려는 야망이었다. 전나경에게 남긴 분필 메모—비공개 우선 진료는 원장 없이 받지 말 것—가 훗날 빚이 된다. 상인회의가 진료 중단을 요구해도 광장 의무막을 내리지 않았다.",
            "가문·기업·공동체": "도성생활유통가(HC09)는 배급 물류 참관을 내세워 의무막 옆 좌석을 요구했다. 방늘재는 실재 상호 없는 후계 헌장 참관만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 중증도 표와 배급표를 광장에 나란히 붙인 일수로 증명됐다. 윤서린 인준 없는 비공개 우선 진료는 게시판에 올리지 않았다.",
            "붕괴의 상처": "가격 폭등 주간에 비상 배급줄이 잠실 집결지를 메우자 상인회의가 진료 중단을 공문으로 밀어 넣었다. 방늘재는 광장 의무막을 내리지 않은 채 탈수 환자 수를 분필로 세었다. 공포는 자신이 본 환자가 군사호적 재등록의 미끼로 광장에 서는 장면이었다. LOSS 목록 맨 아래에는 접힌 배급표와 빈 수통 개수가 적혔다.",
            "생존 전환점": "전환점은 광장 원장을 지켜 진료를 이어갈지, 줄을 해산시켜 경매 질서를 우선할지 고른 순간이다. 서해곡창전구(XT02) 곡물 호송 전갈이 상인회 확성기와 겹치자 계산이 기울었다. 진료 고수를 택하면 탈수 사망은 줄지만 배급 지연이 늘고, 해산을 택하면 경매는 열리되 침상이 군량 담판 자리가 된다. 선택은 K373-TURN이며 되돌리면 집결 교대 한 칸이 비다.",
            "현재 지위": "지금도 방늘재는 가락잠실배급국 거점 의무원으로 광장 칠판과 추첨함을 지킨다. 지위는 서명·참관·인준 로그만으로 유지된다. HC09가 비밀 군량 우선 침상을 요구해도 그는 공개 추첨 없는 처치를 거부한다. 열쇠는 전나경과 선다솜이 나누며 Cast 현황과 매주 대조한다.",
            "비밀·빚·죄책감": "비밀은 광장 밑 창고에서 발견한, 후계 거래용으로 의심되는 군량 송장 사본이다. 죄책감은 살린 탈수 아이와 그 주 추첨에서 빠진 노상인 한 명 사이에서만 자란다. 전면 공개는 배급국 신뢰 한 줄을 끊을 수 있어 이중 인준 공개만 남겼다. SECRET 키는 의무원과 배급 서기 동시 날인 없이는 열리지 않는다.",
            "관계 공동과거": "전나경의 비상 배급줄과 나눈 침상은 동맹이었고, 선다솜의 의료 거점 물자 맞춤은 계약이었다. 백온의 남하 가족에게 임시 침상을 준 밤은 빚이었으며, 상인회의 중단 공문과는 분필 숫자를 둔 경쟁이 남았다. 같은 광장에서 어떤 나눔은 구원이 되었고 어떤 해산 명령은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K373로 이어진다.",
            "3막 개인 서사선": "1막에서 방늘재는 가격 폭등 주간의 진료 중단 공문을 다시 맞는다. 2막에서 HC09 참관과 XT02 곡물 호송 전갈을 광장 칠판에서 저울질한다. 3막에서 진료 고수 또는 줄 해산의 대가를 지연과 공백으로 치른다. 서사선은 STORY-B005-K373이다.",
            "분기 결말": "결말 α에서 방늘재는 광장 원장 수호로 진료 연속을 고른다. 결말 β에서 그는 줄 해산 후 공개 추첨 재개로 경매 질서를 고른다. 어느 쪽도 배급국 슬롯을 삭제하지 않으며 분기는 K373-OUT이다. 플레이 개입은 원장 수호 또는 해산 중재다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가격 폭등 주간 진료 중단 공문에 의무막을 지킨다"
            },
            {
              "act": 2,
              "summary": "HC09 참관과 XT02 곡물 호송을 저울질한다"
            },
            {
              "act": 3,
              "summary": "진료 고수 또는 줄 해산의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K373-OUT-A",
              "summary": "광장 원장 수호로 진료 연속"
            },
            {
              "id": "K373-OUT-B",
              "summary": "줄 해산 후 공개 추첨 재개"
            }
          ]
        },
        {
          "id": "K397",
          "name": "원새울",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B005-K397"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 협약 대합실 옆 의무소에서 원새울은 양쪽 말을 끝까지 들은 뒤에야 한 문장으로 자른다. 그는 수서강남협약도시의 협약 회의 의무소 거점 의무원으로, 힘의 중재를 수치의 진료로 바꾸려 한다. 한국 기원으로 강남 생활권에서 자랐고, 사절 전용 침상 요구를 중증도 미달로 돌려보낸다. 이름 원새울과 식별자 K397은 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 11개 약소국 회의 기간의 현장 진료를 공동교섭의 최저선으로 남기려 했다. 강국별 분할 복속이 병상을 사지 못하게 하려는 야망이었고, 초안은 심유리 중재실 옆 칠판에 먼저 적혔다. 방마빛에게 보낸 대기 쪽지—서명자 빠진 칸의 진료는 연기하라—가 훗날 빚이 된다. 한 칸이라도 서명자가 빠지면 회의 진료를 미뤘다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 회의 보건 참관을 내세워 의무소 좌석을 요구했다. 원새울은 실재 상호 없는 후계 헌장 참관만 허용했다. 공동체 위치는 급수·통행·의료·손실보상 네 칸 칠판 옆에 중증도 표를 붙인 일수로 증명됐다. 류은비 의료헌장 조항이 당직 원장에 오르기 전에는 사절 침상을 열지 않았다.",
            "붕괴의 상처": "열한 자리 회의 직전에 세 강국 사절이 각각 다른 보호·급수 패키지를 들고 들어왔다. 원새울은 사절 전용 침상을 열지 않은 채 중증도 미달 사유를 칠판에 적었다. 공포는 의무소가 배우진 보호정부와 한재목 수문헌장 사이에서 들러리 창구가 되는 장면이었다. LOSS 목록에는 비운 사절 의자 수와 연기된 진료 건수가 남았다.",
            "생존 전환점": "전환점은 사절 진료를 열어 회의를 붙잡을지, 한 강국 사절의 밀약을 폭로해 회의를 결렬시킬지 고른 순간이다. 원양신탁전구(XT05) 신탁 중재 전갈이 대합실 확성기와 겹치자 무게가 바뀌었다. 개방을 고르면 회의는 이어지나 최저선이 흔들리고, 폭로를 고르면 원칙은 남되 약소국 좌석이 비다. 선택은 K397-TURN이며 되돌리면 회의 교대 의무 슬롯이 멈춘다.",
            "현재 지위": "지금도 원새울은 협약 회의 의무소 거점 의무원으로 네 칸 칠판과 중증도 표를 지킨다. 지위는 서명·참관·헌장 등재 로그만으로 유지된다. HC03이 사절 전용 처치권을 요구해도 그는 중증도 미달 진료를 거부한다. 열쇠는 심유리와 방마빛이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 사절 가방에서 떨어진, 서명 없는 분할 복속 초안 사본이다. 죄책감은 살린 약소국 대표와 그 날 받지 못한 골목 노동자 한 명 사이에서만 자란다. 전면 공개는 협약도시 신뢰 한 줄을 끊을 수 있어 삼자 입회 공개만 남겼다. SECRET 키는 의무원·중재인·서기 동시 날인 없이는 열리지 않는다.",
            "관계 공동과거": "심유리 중재실 옆 침상은 계약이었고, 방마빛과 나눈 대기 줄은 동맹이었다. 류은비 의료헌장 조항을 원장에 올린 밤은 빚이었으며, 세 강국 사절 패키지와는 칠판 칸을 둔 경쟁이 남았다. 같은 대합실에서 어떤 거절은 구원이 되었고 어떤 밀약 침묵은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K397로 연결된다.",
            "3막 개인 서사선": "1막에서 원새울은 세 강국 패키지 난입을 다시 맞는다. 2막에서 HC03 참관과 XT05 신탁 전갈을 네 칸 칠판에서 저울질한다. 3막에서 사절 진료 개방 또는 밀약 폭로의 대가를 좌석 공백으로 치른다. 서사선은 STORY-B005-K397이다.",
            "분기 결말": "결말 α에서 원새울은 중증도 기준 사절 진료로 회의 연속을 고른다. 결말 β에서 그는 밀약 폭로로 최저선 원칙을 지킨다. 어느 쪽도 협약도시 슬롯을 삭제하지 않으며 분기는 K397-OUT이다. 플레이 개입은 진료 개방 또는 폭로 지원이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 강국 패키지 난입에 사절 전용 침상을 닫는다"
            },
            {
              "act": 2,
              "summary": "HC03 참관과 XT05 신탁 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "진료 개방 또는 밀약 폭로의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K397-OUT-A",
              "summary": "중증도 기준 사절 진료로 회의 연속"
            },
            {
              "id": "K397-OUT-B",
              "summary": "밀약 폭로로 최저선 원칙 유지"
            }
          ]
        },
        {
          "id": "K010",
          "name": "허도담",
          "links": {
            "house": "HC01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B005-K010"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신정기지 펌프실에서 허도담은 나사 머리의 마모로 교대 성실을 읽는다. 그는 여의신정수문정부의 신정기지 수문펌프 정비사로, 공구함 뚜껑을 열어 두는 사람을 불신한다. 한국 기원으로 영등포 생활권에서 자랐고, 말보다 시운전 소음으로 대답한다. 이름 허도담과 식별자 K010은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 서부 수문 펌프의 밀봉 주기를 신정 공개 정비표로 묶어 수문헌장의 물리적 보증인이 되려 했다. 야망은 칠판에 적은 밀봉 두께 숫자에서 시작됐다. 최한결에게 남긴 공구 약속—차륜과 펌프를 같은 교대에 맞출 것—가 훗날 빚이 된다. 계측 도장 없는 개조 펌프는 유치선에 올리지 않았다.",
            "가문·기업·공동체": "청람전자원(HC01)은 펌프 제어 부품 참관을 내세워 정비표 좌석을 요구했다. 허도담은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 교대마다 밀봉 두께를 칠판에 쓴 횟수로 증명됐다. 정시우의 호환 나사 계약이 도착하기 전에는 외부 규격 밀봉재를 받지 않았다.",
            "붕괴의 상처": "암사가 부품 대신 복무 등록을 요구하자 허도담은 신정 펌프 밀봉재를 서남 규격만 받겠다고 잠갔다. 천왕 쪽 밀봉재가 끊길 날의 헛도는 수문을 상상하며 야간 교대를 혼자 지켰다. 공포는 영등포 송수가 멈추고 정비표가 복무 명부로 바뀌는 장면이었다. LOSS 목록에는 멈춘 펌프 호기와 읽지 못한 잔압 칸이 남았다.",
            "생존 전환점": "전환점은 대체 밀봉재를 구해 정비표를 살릴지, 도장 없는 개조 펌프의 발주자를 밝혀 반장을 흔들지 고른 순간이다. XT02 서해곡창전구의 담수 부품 제안이 펌프실 무전과 겹치자 계산이 기울었다. 밀봉재 확보를 고르면 송수는 이어지나 발주 비리는 남고, 폭로를 고르면 규율은 서되 한 기 시운전이 늦다. 선택은 K010-TURN이며 되돌리면 신정 교대 한 슬롯이 멈춘다.",
            "현재 지위": "지금도 허도담은 신정기지 수문펌프 정비사로 칠판 두께 기록과 시운전 큐를 지킨다. 지위는 면허·계측 도장·참관 로그만으로 유지된다. HC01이 전속 제어 소유를 요구해도 그는 도장 없는 개조를 거부한다. 공구함 열쇠는 최한결과 박누리 야간 지휘가 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 서랍에 가둔, 도장 없는 개조 발주 쪽지 사본이다. 죄책감은 살린 송수 구간과 그 밤 부르지 못한 견습 정비 한 명 사이에서만 자란다. 전면 공개는 수문정부 신뢰 한 줄을 끊을 수 있어 이중 입회 공개만 남겼다. SECRET 키는 정비사와 수질 감시 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "최한결과 차륜·펌프를 함께 고친 밤은 사제였고, 박누리의 탁수 잠금에 맞춘 야간 정비는 계약이었다. 정시우의 호환 나사는 동맹 물자였으며, 암사 복무 등록 요구와는 밀봉재 규격을 둔 경쟁이 남았다. 같은 펌프실에서 어떤 시운전은 구원이 되었고 어떤 개조 침묵은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K010으로 연결된다.",
            "3막 개인 서사선": "1막에서 허도담은 복무 등록 압박 속 밀봉재 잠금을 다시 만난다. 2막에서 HC01 부품 참관과 XT02 담수 제안을 정비표에서 저울질한다. 3막에서 밀봉재 확보 또는 발주 폭로의 대가를 시운전 지연으로 치른다. 서사선은 STORY-B005-K010이다.",
            "분기 결말": "결말 α에서 허도담은 대체 밀봉재 확보로 송수 연속을 고른다. 결말 β에서 그는 개조 발주 폭로로 정비 규율을 지킨다. 어느 쪽도 수문정부 슬롯을 삭제하지 않으며 분기는 K010-OUT이다. 플레이 개입은 밀봉재 호송 또는 발주 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무 등록 압박에 서남 규격 밀봉재만 잠근다"
            },
            {
              "act": 2,
              "summary": "HC01 참관과 XT02 담수 부품 제안을 저울질한다"
            },
            {
              "act": 3,
              "summary": "밀봉재 확보 또는 발주 폭로의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K010-OUT-A",
              "summary": "대체 밀봉재 확보로 송수 연속"
            },
            {
              "id": "K010-OUT-B",
              "summary": "개조 발주 폭로로 정비 규율 유지"
            }
          ]
        },
        {
          "id": "K215",
          "name": "문가람",
          "links": {
            "house": "HC06",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B005-K215"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신 통제실에서 문가람은 파형 공백이 남은 음성 파일부터 다시 듣는다. 그는 상암송신공사의 방송검증관으로, 증언이 하나뿐인 속보를 공식 칸에 올리지 않는다. 한국 출생 다문화 가정에서 자랐고, 가정 언어의 혼재는 통역이 필요할 때만 언급될 뿐 진영을 나누는 근거가 되지 않는다. 이름 문가람과 식별자 K215는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 강국이 전원을 내려도 남는 다중 송신망을 상암·도성·창동에 심으려 했다. 야망은 두 개 이상 독립 증언이 모이기 전에는 방송하지 않는 규칙에서 시작됐다. 윤서린과 나눈 기록 공유 서약—원본 함은 한쪽만 열지 않는다—가 훗날 빚이 된다. 배우진의 검열 요구가 와도 기술 장애 코드를 먼저 남기고 송출을 미뤘다.",
            "가문·기업·공동체": "골목연결국(HC06)은 골목 중계 참관을 내세워 편성표 좌석을 요구했다. 문가람은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 선전 소유 문장은 거절했다. 공동체 위치는 교차검증 로그를 길드와 기록청에 동시에 붙인 횟수로 증명됐다. 장세화 의료속보 협약이 도착하기 전에는 단정 속보 칸을 열지 않았다.",
            "붕괴의 상처": "임하준이 실종 전 남긴 음성기록에서 편집 흔적이 발견됐다. 문가람은 원본 송신기 회수 전까지 해당 파일을 보류 함에 넣고 공식 방송을 멈췄다. 공포는 공사가 사실 검증기관이 아니라 승자의 선전국이 되는 장면이었다. LOSS 목록 첫 줄에는 끊긴 무전 시각과 공백 파형 길이가 나란히 적혔다.",
            "생존 전환점": "전환점은 원본 송신기를 회수해 편집 경로를 공개할지, 진실 공개를 늦춰 폭동 위험을 줄일지 고른 순간이다. 해협삼로전구(XT03) 봉인 중계 요청이 편성표와 겹치자 무게가 바뀌었다. 회수를 고르면 원본은 살아나지만 거리 소요가 커질 수 있고, 지연을 고르면 질서는 남되 검증 신뢰가 한 칸 깎인다. 선택은 K215-TURN이며 되돌리면 다중 송신 시험 슬롯이 비다.",
            "현재 지위": "지금도 문가람은 방송검증관으로 편성 거부권과 보류 함을 지킨다. 지위는 교차검증 로그와 시민 참관 서명으로만 유지된다. HC06이 전속 중계 소유를 요구해도 그는 단일 증언 송출을 거부한다. 송신기 열쇠는 권미래와 서라온이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 보류 함에 남은, 편집 전 파형과 편집 후 파형을 겹친 비교 시트다. 죄책감은 살린 거리의 침묵과 그 밤 사실을 듣지 못한 유족 한 명 사이에서만 자란다. 전면 공개는 송신공사 신뢰 한 줄을 끊을 수 있어 이중 증언 공개만 남겼다. SECRET 키는 검증관과 기록 서기 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "윤서린과 나눈 기록 공유는 동맹이었고, 장세화 의료속보 협약은 계약이었다. 배우진 검열 요구와는 기술 장애 코드를 둔 갈등이 남았으며, 오해린 시세 방송 시각 맞춤은 경쟁 속 공존이었다. 같은 편성표에서 어떤 보류는 구원이 되었고 어떤 지연은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K215로 연결된다.",
            "3막 개인 서사선": "1막에서 문가람은 임하준 음성의 편집 흔적을 다시 만난다. 2막에서 HC06 중계 참관과 XT03 봉인 요청을 편성표에서 저울질한다. 3막에서 원본 회수 또는 공개 지연의 대가를 신뢰 점수 변동으로 치른다. 서사선은 STORY-B005-K215이다.",
            "분기 결말": "결말 α에서 문가람은 원본 송신기 회수로 편집 경로를 공개한다. 결말 β에서 그는 공개 지연으로 거리 폭동 위험을 낮춘다. 어느 쪽도 송신공사 슬롯을 삭제하지 않으며 분기는 K215-OUT이다. 플레이 개입은 송신기 회수 또는 공개 시점 중재다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "임하준 음성의 편집 흔적을 보류 함에 넣는다"
            },
            {
              "act": 2,
              "summary": "HC06 중계와 XT03 봉인 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "원본 회수 또는 공개 지연의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K215-OUT-A",
              "summary": "원본 송신기 회수로 편집 경로 공개"
            },
            {
              "id": "K215-OUT-B",
              "summary": "공개 지연으로 폭동 위험 완화"
            }
          ]
        },
        {
          "id": "K240",
          "name": "백온",
          "links": {
            "house": "HC09",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B005-K240"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북산 숙영 중앙 천막에서 백온은 가족 단위 투표함을 열기 전에 명부 빈칸부터 손으로 훑는다. 그는 북산피난연맹의 난민대표로, 가족 분리를 효율로 포장하는 어떤 숫자도 거부한다. 한국 출생 다문화 가정 이력을 지니며, 그 이력은 이동 언어와 가족 의례를 설명할 때만 쓰이고 충성·폭력의 예측 변수로 쓰이지 않는다. 이름 백온과 식별자 K240은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 군사호적과 강제 복구복무에서 벗어난 독립 시민권을 가족 단위 투표로 먼저 시행하려 했다. 야망은 공개 배급표를 천막마다 사본으로 남기는 습관에서 자랐다. 강민서와 나눈 시민권 문안—성인 자발 복무만 인정한다—가 훗날 빚이 된다. 암사 순찰대가 급수권을 복무계약과 묶으려 해도 그는 가족 회의 없이 서명하지 않았다.",
            "가문·기업·공동체": "도성생활유통가(HC09)는 구호 물류 참관을 내세워 숙영 배급 좌석을 요구했다. 백온은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 노동 소유 문장은 거절했다. 공동체 위치는 가족 회의 출석부와 공개 배급표를 동시에 붙인 일수로 증명됐다. 류은비 의료 지원 빚은 감사 칸에만 적고 강제 상환 조항은 받지 않았다.",
            "붕괴의 상처": "암사 순찰대가 북산 가족들의 급수권을 복무계약과 묶은 아침, 명부에서 한 가족의 줄이 지워져 있었다. 백온은 지워진 줄을 빨간 분필로 되살리고 강제복무 서명을 보류했다. 공포는 피난민이 병력·노동력 숫자로만 남는 장면이었다. LOSS 목록에는 빈 급수통과 지워졌던 이름 수가 함께 적혔다.",
            "생존 전환점": "전환점은 가족 명부를 되찾아 공개 원장에 복원할지, 자발 복무 헌장을 협상 테이블에 올려 급수 재개를 교환할지 고른 순간이다. XT01 임진관문전구의 구호 행렬이 숙영 입구에 닿자 무게가 바뀌었다. 명부 복원을 고르면 시민권 근거는 살지만 급수가 하루 늦고, 헌장 협상을 고르면 물은 오되 복무 조항이 남을 수 있다. 선택은 K240-TURN이며 되돌리면 숙영 투표 슬롯이 비다.",
            "현재 지위": "지금도 백온은 난민대표로 가족 회의와 공개 배급표를 지킨다. 지위는 투표 출석·배급 사본·시민 참관 서명으로만 유지된다. HC09가 구호 대가로 노동 할당을 요구해도 그는 가족 회의 없는 서명을 거부한다. 명부 함 열쇠는 신보람과 윤초아가 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 지워진 줄이 복원되기 전 찍힌, 순찰대 측 임시 노동 할당 쪽지 사본이다. 죄책감은 살린 가족 단위와 그 주 급수를 하루 못 받은 이웃 한 줄 사이에서만 자란다. 전면 공개는 연맹 신뢰 한 칸을 끊을 수 있어 삼자 입회 공개만 남겼다. SECRET 키는 대표·서기·의료 입회 동시 날인 없이는 열리지 않는다.",
            "관계 공동과거": "강민서와 시민권 문안을 나눈 밤은 동맹이었고, 류은비 의료 지원은 빚이었다. 배우진 강제복무 요구와는 명부 분필을 둔 갈등이 남았으며, 황세린 공개 배급 집행은 계약이었다. 같은 숙영에서 어떤 투표는 구원이 되었고 어떤 침묵 서명은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K240으로 연결된다.",
            "3막 개인 서사선": "1막에서 백온은 급수·복무 묶기 아침의 지워진 명부를 다시 만난다. 2막에서 HC09 구호 참관과 XT01 구호 행렬을 투표함 앞에서 저울질한다. 3막에서 명부 복원 또는 헌장 협상의 대가를 급수 지연으로 치른다. 서사선은 STORY-B005-K240이다.",
            "분기 결말": "결말 α에서 백온은 가족 명부 복원으로 시민권 근거를 고른다. 결말 β에서 그는 자발 복무 헌장 협상으로 급수 재개를 고른다. 어느 쪽도 피난연맹 슬롯을 삭제하지 않으며 분기는 K240-OUT이다. 플레이 개입은 명부 회수 또는 헌장 협상 지원이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "급수·복무 묶기에 지워진 명부 줄을 되살린다"
            },
            {
              "act": 2,
              "summary": "HC09 구호 참관과 XT01 행렬을 저울질한다"
            },
            {
              "act": 3,
              "summary": "명부 복원 또는 헌장 협상의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K240-OUT-A",
              "summary": "가족 명부 복원으로 시민권 근거 확보"
            },
            {
              "id": "K240-OUT-B",
              "summary": "자발 복무 헌장 협상으로 급수 재개"
            }
          ]
        },
        {
          "id": "K342",
          "name": "안기준",
          "links": {
            "house": "HC07",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B005-K342"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "광진 동부 교량 아래 점검로에서 안기준은 교각 균열을 사람 이름처럼 기억한다. 그는 아차구의관문국의 교량 감독으로, 근거 없는 봉쇄를 병력 낭비라고 부른다. 중국 이산 가정 배경을 지니며, 이산 언어는 통행 표지와 부품 설명서를 읽을 때만 필요하고 진영 분할의 근거가 되지 않는다. 이름 안기준과 식별자 K342는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 광진·구의 동부 교량 통행을 관문국 고유 일정표로 만들어 암사 순찰열차의 임의 정차를 끊으려 했다. 야망은 매일 공개하는 통행 무게 칠판에서 자랐다. 고서준과 장세화에게 보낸 협약 메모—군 통행은 이중 날인 없이는 없다—가 훗날 빚이 된다. 심가은의 척후 보고도 교각 쪽 실측 전에는 봉쇄 근거로 받지 않았다.",
            "가문·기업·공동체": "해동제철성(HC07)은 교량 강재 보강 참관을 내세워 점검로 좌석을 요구했다. 안기준은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 소유 문장은 거절했다. 공동체 위치는 교각 균열과 통행 무게를 매일 공개한 일수로 증명됐다. 남호성 의무호송이 이중 날인을 갖추기 전에는 우선 통과 칸만 임시로 열었다.",
            "붕괴의 상처": "척후대가 상수관 파손을 적대행위로 보고하자 교량을 닫을지 점검만 할지 감독 권한이 쪼개졌다. 안기준은 해머로 교각을 두드리며 균열 폭만 칠판에 남기고 전면 봉쇄 도장은 보류했다. 공포는 교량이 보호정부 명목으로 상수호위단에 넘어가는 장면이었다. LOSS 목록에는 측정 못한 잔압 칸과 멈춘 통행 대기 열 수가 적혔다.",
            "생존 전환점": "전환점은 파손 원인을 교각 쪽에서 공개 증명할지, 교량 열쇠를 한쪽 직능에 넘겨 신속 통행을 살릴지 고른 순간이다. XT03 해협삼로전구의 봉인 호송이 교량 진입로에 닿자 무게가 바뀌었다. 공개 증명을 고르면 권한은 남지만 대열이 길어지고, 열쇠 이관을 고르면 통행은 열리되 이중 날인 원칙이 흔들린다. 선택은 K342-TURN이며 되돌리면 점검 교대 한 슬롯이 비다.",
            "현재 지위": "지금도 안기준은 교량 감독으로 균열 칠판과 이중 날인 함을 지킨다. 지위는 실측 로그·회의 서명·참관 기록으로만 유지된다. HC07이 전속 보강 소유를 요구해도 그는 날인 없는 군 통행을 거부한다. 열쇠는 고서준 회의함과 물 기술자 함이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 파손 밤의, 척후 보고와 실측 숫자가 어긋난 한 줄 메모다. 죄책감은 살린 의무호송 한 대와 그 시간 대기열에서 내린 상인 한 명 사이에서만 자란다. 전면 공개는 교량 일정표 신뢰가 하루 치 어긋날 수 있어 실측·서기 동시 공개만 남겼다. SECRET 키는 감독과 기술자 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "고서준·장세화 통행 협약 집행은 계약이었고, 심가은 척후 검증은 긴장 섞인 동맹이었다. 남호성 의무호송 우선 통과는 빚이었으며, 상수호위단의 보호 명목 인수 시도와는 열쇠를 둔 경쟁이 남았다. 같은 교각 아래서 어떤 개방은 구원이 되었고 어떤 봉쇄 침묵은 배신으로 읽혔다. 관계 끝점은 STORY-B005-K342로 연결된다.",
            "3막 개인 서사선": "1막에서 안기준은 상수관 파손 보고로 쪼개진 감독권을 다시 만난다. 2막에서 HC07 보강 참관과 XT03 봉인 호송을 칠판 위에서 저울질한다. 3막에서 공개 증명 또는 열쇠 이관의 대가를 대기 시간으로 치른다. 서사선은 STORY-B005-K342이다.",
            "분기 결말": "결말 α에서 안기준은 교각 쪽 공개 증명으로 감독권을 고른다. 결말 β에서 그는 조건부 열쇠 이관으로 신속 통행을 고른다. 어느 쪽도 관문국 슬롯을 삭제하지 않으며 분기는 K342-OUT이다. 플레이 개입은 실측 입회 또는 열쇠 감독이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "상수관 파손 보고에 전면 봉쇄 도장을 보류한다"
            },
            {
              "act": 2,
              "summary": "HC07 보강과 XT03 봉인 호송을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 증명 또는 열쇠 이관의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K342-OUT-A",
              "summary": "교각 공개 증명으로 감독권 유지"
            },
            {
              "id": "K342-OUT-B",
              "summary": "조건부 열쇠 이관으로 신속 통행"
            }
          ]
        },
        {
          "id": "H05",
          "name": "윤재",
          "links": {
            "house": "HC05",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B005-H05"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "S05 정비 벤치에서 윤재는 교체형 손모듈의 마모 눈금을 먼저 읽는다. 급은 H, 호출부호 재이며 인간형 보조 골격과 야간 시야 제한을 가진다. 표시 이름 윤재와 불변 식별자 H05는 합성 네임스페이스에 고정되고 인간 K 번호와 섞이지 않는다. 감정 서술 대신 입출력 제약과 로그 코드로만 자신을 보고한다.",
            "붕괴 전 삶": "붕괴 전 윤재는 시범 교대만 돌렸고 전지 권한과 완전 기억은 부여되지 않았다. 출고 검사표에는 재 교정값과 배터리 사이클만 찍혔다. B005는 그 시범 로그를 원점으로 삼고, 기억 포크 금지 조항을 H05-PRE에 고정한다. 인간 동료의 농담을 기록해도 해석 레이어는 올리지 않았다.",
            "가문·기업·공동체": "보관 책임은 HC05 공동 보관과 담당 인간 배우진(K114) 서명에 묶인다. 정비 주체는 창작 후계 가문 창구로만 적고 실재 기업 제품명은 본문에 쓰지 않는다. 시민 참관 봉인 칸에 H05 해시가 게시되며 양도 시 삼자 서명이 필요하다. 공동체는 윤재를 소유물 아니라 할당 슬롯의 작동자로 본다.",
            "붕괴의 상처": "붕괴는 센서 테이블을 끊고 배터리 할당 한도를 드러냈다. 윤재는 공백을 허구 값으로 메우지 못하도록 잠겼고, 측정 불능 플래그만 일지에 남았다. 단절 시각 표기는 B005-H05-WOUND다. 충전 칸 경보가 울려도 전체 망 권한 요청은 거절 코드로 응답했다.",
            "생존 전환점": "전환점은 구역 키만 요청하고 교차 시설 루트를 닫은 순간이다. 원양신탁전구(XT05) 신호가 도착해도 권역 외 제어는 열지 않았다. 재연결 조건은 K114 승인 후에만 성립하며 그 결정은 H05-TURN 로그로 보존된다. 부품 부족 시 다른 시설 제어권을 가로채지 않는 제약이 우선한다.",
            "현재 지위": "현재 목표는 S05 구역 연속 가동과 담당 인간 안전이다. 윤재는 인프라 전체를 소유하지 않고 할당 슬롯만 사용한다. 상태 공개는 교대 스냅샷으로 제한되며 Synthetic-Actors 투영의 H05 행과 불일치하면 배치 검증이 실패한다. 배터리와 마모 부품은 할당제로만 보충된다.",
            "비밀·빚·죄책감": "비밀은 미전송 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 대신 제약 위반 카운터가 증가하며, 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. B005에서 비밀 키는 시민 참관 없이 열리지 않는다. 롤백 전 해시는 K114 입회 로그에만 남는다.",
            "관계 공동과거": "관계 축은 K114 보관과 HC05 스튜어드십, 작업 동료 K032 교대다. 윤재와 배우진은 봉인 키를 교대 회수한 기록이 있다. 잘못된 기억 포크는 H05-FORK-01로만 주석되고 삭제 명령 없이 분기 로그만 남긴다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다.",
            "3막 개인 서사선": "1막에서 센서 공백이 S05 일정을 멈춘다. 2막에서 HC05와 K114이 부분 재연결 범위를 협상한다. 3막에서 윤재는 격리 뒤 구역 권한만 복구한다. 서사선 ID는 STORY-B005-H05로 고정된다.",
            "분기 결말": "결말 α에서 윤재는 인간 승인 아래 제한 재가동한다. 결말 β에서 장기 오프라인 보관으로 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다. 분기 식별은 H05-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "센서 공백으로 S05 일정이 정지한다"
            },
            {
              "act": 2,
              "summary": "HC05·K114이 부분 재연결 범위를 협상한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 권한만 복구한다"
            }
          ],
          "outcomes": [
            {
              "id": "H05-OUT-A",
              "summary": "인간 승인 하 제한 재가동"
            },
            {
              "id": "H05-OUT-B",
              "summary": "장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B006": {
      "id": "B006",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K038",
          "name": "허다온",
          "links": {
            "house": "HC02",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B006-K038"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "천왕기지 피트 바닥에서 허다온은 차륜 허브의 미세 균열을 손톱으로 짚어 낸다. 천왕기지 차륜 정비사로, 용접 자국이 도면과 어긋나면 즉시 차축을 내린다. 한국 기원으로 서남 기지권에서 자랐고, 말은 짧지만 캘리퍼 눈금은 한 번도 어림하지 않는다. 표시 이름 허다온과 불변 식별자 K038은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 차륜 교체 주기를 기지 자율 원장에 묶어 외부 군수 우선표를 거부하는 규칙을 밀어 붙였다. 야망은 피트 벽에 분필로만 남은 교체 주기표였다. 아버지 공구함에 숨긴 예비 베어링 한 세트가 사적 약속의 씨앗이 된다. 상급 배차표가 밀어 넣어도 균열 미측정 차축은 출고 도장을 받지 못했다.",
            "가문·기업·공동체": "해륜기동문(HC02)은 환적 차륜 우선 정비를 의무 조항으로 내밀었다. 허다온은 후계 헌장 참관만 받고 실재 상호·제품명을 정비 원장에서 지웠다. 공동체 위치는 균열 측정 로그를 양쪽에 동시에 붙인 횟수로 증명됐다. 전속 국가 소유 요구는 피트 입구에서 반려된다.",
            "붕괴의 상처": "위조 차축 각인이 찍힌 화차가 천왕 승강장에 들어온 새벽, 허다온은 전체 출고를 멈추고 허브만 해체했다. 공포는 균열 차륜이 임진 방향 급행에 실려 다리 위에서 터지는 장면이었다. 그는 위조 각인을 붉은 먹으로 지우고 LOSS 목록에 시각만 남겼다. 피트가 조용해진 뒤에도 캘리퍼를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 위조 각인 경로를 공개 추적할지, 예비 베어링으로 급행 차축만 먼저 살릴지 고른 순간이다. 임진관문전구(XT01) 쪽 호송 요청이 확성기와 겹치자 계산이 달라졌다. 추적을 택하면 위조 공급망이 드러나지만 급행이 멈추고, 급행을 살리면 위조 경로가 한 칸 더 숨을 수 있다. 그 선택은 K038-TURN으로 남고, 되돌리면 천왕 일부 정비 슬롯이 비다.",
            "현재 지위": "지금도 허다온은 천왕기지 차륜 정비사로 점호와 허브 측정 큐를 지킨다. 지위는 세습이 아니라 면허·서명·입회 로그로만 유지된다. 해륜기동문이 전속 정비 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 피트 열쇠는 두 자루로 나뉘어 한 자루는 당직반, 다른 한 자루는 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 아버지 공구함에 남긴, 측정 전 출고된 차축 메모 한 장이다. 죄책감은 살린 급행 명단과 그 밤 호출하지 못한 견습 한 명의 이름 사이에서만 자란다. 전부를 공개하면 기지 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 정비장과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "양필호의 차륜 교체 순번은 동업 계약이었고, 김도윤의 원로 거부권은 견제였다. 설민우의 선로 봉쇄 시각을 피트 일지에 맞춘 밤은 동맹이었으며, 배차조와는 출고 도장을 두고 경쟁이 남았다. 같은 피트에서 어떤 차축은 구원이 되었고 어떤 차축은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B006-K038에 연결된다.",
            "3막 개인 서사선": "1막에서 허다온은 위조 차축 각인 화차의 출고 정지를 정면으로 맡는다. 2막에서 그는 HC02 우선 정비와 XT01 호송 요청을 한 피트 책상에서 저울질한다. 3막에서 추적 또는 급행 복구의 대가를 정비 지연으로 치른다. 서사선 식별자는 STORY-B006-K038로 고정된다.",
            "분기 결말": "결말 α에서 허다온은 위조 각인 경로 공개를 우선해 공급망 차단을 고른다. 결말 β에서 그는 예비 베어링으로 급행 차축을 살려 통행 연속을 지킨다. 어느 쪽도 천왕기지의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K038-OUT으로 갈라진다. 플레이 개입은 각인 추적 또는 급행 복구 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 차축 각인 화차에 출고를 정지한다"
            },
            {
              "act": 2,
              "summary": "HC02 우선 정비와 XT01 호송 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 급행 복구의 대가로 정비 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K038-OUT-A",
              "summary": "위조 각인 경로 공개로 공급망 차단"
            },
            {
              "id": "K038-OUT-B",
              "summary": "예비 베어링 급행 복구로 통행 연속"
            }
          ]
        },
        {
          "id": "K066",
          "name": "허서겸",
          "links": {
            "house": "HC01",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B006-K066"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "방화기지 연구차 내부에서 허서겸은 센서 버스 커넥터의 산화 막을 면봉으로 걷어 낸다. 방화기지 연구차량 정비사로, 로그가 끊긴 채널을 보면 시동 스위치부터 잠근다. 한국 기원으로 동부 연구기지권에서 자랐고, 성정은 건조하나 오실로스코프 파형은 손으로 따라 그린다. 이름 허서겸과 식별자 K066은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 연구차 센서 교정을 시민 참관 로그에 공개해 군사 단독 잠금을 막으려 했다. 야망은 교정실 칠판에 남은 채널 맵이었다. 여동생에게 약속한 방한 장갑 한 켤레가 작은 빚의 시작이었다. 상급 암호키가 도착해도 참관 서명 없는 펌웨어는 올리지 않았다.",
            "가문·기업·공동체": "청람전자원(HC01)은 연구차 원격 갱신 창구를 요구했다. 허서겸은 후계 헌장의 참관 칸만 열고 실재 상호를 원장에서 지웠다. 공동체 신뢰는 교정 로그를 양쪽에 동시에 붙인 날로만 쌓였다. 전속 갱신 소유 문장은 연구차 문 앞에서 거절됐다.",
            "붕괴의 상처": "야간 센서 전 채널이 동시에 검게 꺼진 밤, 허서겸은 연구차를 기지 밖으로 내보내지 않고 내부 전원을 분리했다. 공포는 검은 채널이 원양 신탁 항로 오탐을 일으켜 민간 선단이 기뢰 해역으로 몰리는 그림이었다. 그는 끊긴 시각을 LOSS 목록 첫 줄에 적었다. 비상등이 돌아와도 시동 키는 목에 걸어 둔 채였다.",
            "생존 전환점": "전환점은 산화 커넥터 묶음을 공개 분해할지, 예비 버스 보드로 항로 채널만 살릴지다. 원양신탁전구(XT05) 쪽 전갈이 교정실에 닿자 순번이 흔들렸다. 공개 분해를 택하면 원인 공급자가 드러나고, 항로 채널만 살리면 연구 데이터 공백이 하루 더 길어진다. K066-TURN은 그 밤의 전원 분리 순서다.",
            "현재 지위": "허서겸은 여전히 방화기지 연구차량 정비사로 점호와 채널 교정 큐를 본다. 면허와 참관 로그가 지위를 유지하며 청람전자원의 전속 요구는 매번 반려한다. 교정실 문에는 오늘 끊긴 채널 목록만 분필로 남긴다. Cast 프로필의 연구차 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 시동 전에 숨긴, 참관 없이 올라간 펌웨어 한 줄 메모다. 죄책감은 살린 항로 채널과 그 때문에 미룬 여동생 장갑 전달 사이에 있다. 완전 고백 대신 재심 입회 하의 부분 공개만 허용한다. SECRET 열람은 시민 참관과 정비장 동시 서명으로만 열린다.",
            "관계 공동과거": "라진우의 냉동 센서 예비품을 빌린 계약, 박솔의 골목 메시 스냅샷을 맞춘 밤, 청람 참관과의 갱신 창구 경쟁이 한 교정실에 겹친다. 같은 연구차에서 어떤 채널은 구원이 되었고 어떤 채널은 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B006-K066로 이어진다. 협력과 견제는 파형 숫자로만 재측정된다.",
            "3막 개인 서사선": "1막에서 허서겸은 전 채널 정전을 전원 분리로 맞받는다. 2막에서 HC01 원격 갱신과 XT05 항로 전갈을 교정 시계에 묶는다. 3막에서 공개 분해 또는 항로 회생의 대가를 데이터 공백으로 치른다. 서사선은 STORY-B006-K066이다.",
            "분기 결말": "결말 α에서 허서겸은 산화 커넥터 공개 분해로 원인 경로를 밝힌다. 결말 β에서 예비 버스로 항로 채널을 살려 선단 안전을 우선한다. 방화기지 슬롯은 유지되며 분기만 K066-OUT으로 갈라진다. 개입은 분해 입회 또는 항로 복구 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "전 채널 정전에 연구차 전원을 분리한다"
            },
            {
              "act": 2,
              "summary": "HC01 갱신 창구와 XT05 항로 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 항로 회생의 대가로 데이터 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K066-OUT-A",
              "summary": "커넥터 공개 분해로 원인 경로 확정"
            },
            {
              "id": "K066-OUT-B",
              "summary": "예비 버스 항로 회생으로 선단 안전 우선"
            }
          ]
        },
        {
          "id": "K094",
          "name": "유하은",
          "links": {
            "house": "HP07",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B006-K094"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "성수 공방 골목 작업대에서 유하은은 가죽 봉인 끈의 매듭이 헐거우면 납품 상자를 돌려보낸다. 성수 가죽·소형기계 직능대표로, 도면 없는 개조 주문을 받으면 펜부터 꺾는다. 한국 기원으로 성수 생활권에서 자랐고, 목소리는 낮지만 바늘과 드라이버 순서는 양보하지 않는다. 유하은과 K094는 재번호되지 않는다.",
            "붕괴 전 삶": "그는 소형 펌프와 가죽 개스킷을 직능조합 신용으로 묶어 강국 군수 하청과 다른 납품 원장을 만들려 했다. 야망은 작업대 위에 못으로 고정한 품목표에 남았다. 조카에게 약속한 겨울 장화 한 켤레가 빚의 씨앗이었다. 허위 규격이 나오면 해당 주문 가문 칸을 즉시 봉쇄하는 규칙만은 지켰다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 교량 보수 우선 납품을 직능 창구에 요구했다. 유하은은 후계 헌장 참관만 받고 실재 상호를 배제한 채 품목 번호만 공개했다. 공동체 신뢰는 매듭 검사에 입회한 인원 수로 쌓였고, 로고가 찍힌 빈 상자는 조합 자격 밖으로 밀렸다. 전속 소유 요구는 공방 문턱에서 거절됐다.",
            "붕괴의 상처": "교량 보수 자재가 군수 가죽 표로 둔갑해 들어오던 오후, 유하은은 작업대를 잠그고 상자를 해체했다. 공포는 가짜 개스킷이 한강 교량 이음새에서 터져 보행 행렬이 강으로 쏟아지는 소리였다. 그는 위조 표를 가위로 잘라 LOSS 목록에 붙였다. 골목 확성기가 꺼진 뒤에도 바늘을 내려놓지 않았다.",
            "생존 전환점": "전환점은 위조 표 공급자를 조합 앞에 세울지, 예비 개스킷으로 교량 이음새만 먼저 막을지다. 해협삼로전구(XT03) 쪽 보수 요청이 성수 확성기에 겹쳤다. 공급자 공개를 택하면 직능 신용이 살고, 이음새 응급을 택하면 위조 경로가 남는다. K094-TURN은 그 오후의 상자 해체 순이다.",
            "현재 지위": "유하은은 성수 직능대표로 점호와 납품 검사 큐를 유지한다. 면허·서명·입회 로그가 지위를 받치며 한강교량공회의 전속 요구는 거절한다. 작업대 열쇠는 두 묶음이고 한 묶음은 조합 당직, 다른 묶음은 본인이 지닌다. Cast 현황과 품목 원장이 어긋나면 납품 사이렌을 울린다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 조카 몫 장화 가죽을 한 장 빼 둔 기록이다. 죄책감은 살린 교량 이음새와 그 때문에 늦어진 장화 인도 사이에 있다. 부분 공개는 입회 두 명 앞에서 품목 번호만 밝히는 경로로 남긴다. SECRET은 교량 입회 로그와 맞물릴 때만 열린다.",
            "관계 공동과거": "허다온의 차축 개스킷 주문을 맞춘 계약, 설민우의 봉쇄 구간 표지 가죽 납품, 교량공회 참관과의 우선 납품 경쟁이 한 골목에 있다. 같은 작업대에서 어떤 상자는 구원이 되었고 어떤 상자는 배신으로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B006-K094에 연결된다. 협력은 매듭 장력 숫자로만 재확인된다.",
            "3막 개인 서사선": "1막은 위조 군수 표 상자의 해체다. 2막은 HP07 우선 납품과 XT03 보수 요청의 충돌이다. 3막은 공개 또는 응급 보수 뒤 직능 신용이 치르는 비용이다. 서사선은 STORY-B006-K094이다.",
            "분기 결말": "결말 α에서 유하은은 위조 공급자 공개로 조합 신용을 택한다. 결말 β에서 예비 개스킷 응급 보수로 보행 안전을 지킨다. 성수 직능 슬롯은 유지되고 분기만 K094-OUT이다. 개입은 공개 증언 또는 보수 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 군수 표 자재 상자를 작업대에서 해체한다"
            },
            {
              "act": 2,
              "summary": "HP07 우선 납품과 XT03 보수 요청이 충돌한다"
            },
            {
              "act": 3,
              "summary": "공개 또는 응급 보수의 대가로 직능 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K094-OUT-A",
              "summary": "위조 공급자 공개로 조합 신용 유지"
            },
            {
              "id": "K094-OUT-B",
              "summary": "예비 개스킷 응급 보수로 보행 안전"
            }
          ]
        },
        {
          "id": "K123",
          "name": "양필호",
          "links": {
            "house": "HC07",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B006-K123"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "고덕기지 선반 아래에서 양필호는 차륜 림의 두께를 마이크로미터로 세 번 잰다. 고덕기지 차륜 정비사로, 할당 톤수가 안전 두께를 밀면 출고 벨을 끈다. 한국 기원으로 동부 기지권에서 자랐고, 흥정은 짧게 끝내고 구두 할당은 인정하지 않는다. 이름 양필호와 K123는 고정 식별이다.",
            "붕괴 전 삶": "그는 철강 할당과 피난 열차 차륜 교체를 같은 원장에 올려 군수 톤수가 민생 차축을 삼키지 못하게 하려 했다. 야망은 아침 선반 일지에 연필로만 남았다. 어머니 병실에 두던 예비 림 쿠폰이 작은 약속의 자리였다. 빈 측정란 출고서는 끝내 도장을 받지 못했다.",
            "가문·기업·공동체": "해동제철성(HC07) 의무 창구는 차륜 강재를 후원 톤수로 감싸려 했다. 양필호는 후계 헌장의 감사 등재만 받고 실재 상호·제품명을 원장에서 지웠다. 공동체 위치는 두께 측정이 채워진 열차를 몇 편이나 제시간에 내보냈는지로 측정됐다. 가문 참관이 야간 초과 할당을 요구하면 그는 벽의 안전 두께표를 가리키며 거절했다.",
            "붕괴의 상처": "피난 열차와 군수 화차의 차륜 주문이 같은 날 고덕에 쌓였다. 양필호는 군수 우선 할당을 멈추고 두께 미달 림을 선반에 봉했다. 공포는 얇은 림이 두만 방향 급곡선에서 깨져 피난 칸이 전복되는 상상이었다. 방송이 끊긴 뒤에도 그는 봉인 끈을 두 번 더 묶었다.",
            "생존 전환점": "전환점은 두께 미달 할당 경로를 공개할지, 예비 림으로 피난 열차만 먼저 살릴지다. 두만극동전구(XT04) 전령이 도착하자 순번판이 흔들렸다. 공개를 택하면 제철 할당 권력이 흔들리고, 피난 우선을 택하면 군수 지연 보복에 노출된다. K123-TURN은 그 선반의 기울기다.",
            "현재 지위": "양필호는 고덕기지 차륜 정비사로 점호와 측정 큐를 본다. 지위는 면허와 입회 서명이 유지하며 해동제철성의 전속 요구는 거절한다. 아침마다 마이크로미터와 할당표를 같은 분필로 고친다. Cast 프로필의 정비 칸과 원장 해시가 어긋나면 그날 출고를 닫는다.",
            "비밀·빚·죄책감": "비밀은 봉인 전 두께가 아슬했던 림 하나의 내부 메모다. 죄책감은 제시간에 살린 피난 편성과, 그 때문에 하루 미룬 병실 방문 사이에 있다. 부분 공개는 증인 입회 하에 메모 한 줄만 허용한다. SECRET 키는 전령 봉인과 함께만 열린다.",
            "관계 공동과거": "허다온과 나눈 차륜 규격 대조는 동업이었고, 장세화의 배차 의무 시각은 계약이었다. 해동 참관의 초과 할당과는 선반 앞에서 목소리를 높인 경쟁이 남았다. 같은 기지에서 어떤 림은 구원이 되었고 어떤 림은 배신의 증거로 남았다. 관계 원장은 그 끝점을 지우지 않은 채 B006에 연결된다.",
            "3막 개인 서사선": "1막은 군수·피난 차륜 주문의 동시 봉인이다. 2막은 HC07 톤수 압력과 XT04 전령 사이의 순번 싸움이다. 3막은 공개 또는 피난 우선 뒤 정비 원장이 치르는 신뢰 비용이다. 서사선 ID는 STORY-B006-K123로 고정된다.",
            "분기 결말": "결말 α에서 양필호는 미달 할당 공개로 공공 안전 규격을 택한다. 결말 β에서 예비 림 피난 우선으로 생명 통행을 지킨다. 고덕기지 슬롯은 유지되고 분기만 K123-OUT이다. 플레이어는 공개 증언 또는 피난 출고 엄호를 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "군수·피난 차륜 주문을 선반에 봉한다"
            },
            {
              "act": 2,
              "summary": "HC07 톤수와 XT04 전령 순번을 겨룬다"
            },
            {
              "act": 3,
              "summary": "공개·피난 우선 뒤 정비 원장의 신뢰 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K123-OUT-A",
              "summary": "미달 할당 공개로 안전 규격 유지"
            },
            {
              "id": "K123-OUT-B",
              "summary": "예비 림 피난 우선으로 생명 통행"
            }
          ]
        },
        {
          "id": "K151",
          "name": "나선재",
          "links": {
            "house": "HP04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B006-K151"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "도성 문서고 철문 앞에서 나선재는 출입 전표의 잉크가 마르기 전에 열어 달라는 손을 막는다. 문서고 수비 순찰대 조장으로, 봉인 번호가 순번과 다르면 통로 등을 끈다. 한국 기원으로 도심 기록권에서 자랐고, 성정은 딱딱해 보이지만 순찰 일지 가장자리를 접어 이상 구간을 표시한다. 나선재와 K151은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 계승 원장과 급수 조약을 같은 문서고 열람 원장에 올린 뒤에야 외부 반출을 허용하려 했다. 기록법 가문이 실제 거부권을 갖게 하려는 야망은 야간 순찰 일지에 남았다. 스승에게 바치던 여분 봉인 끈 한 묶음이 작은 빚의 자리였다. 빈 증인란 전표는 끝내 철문을 열지 못했다.",
            "가문·기업·공동체": "도성기록법가(HP04) 의무 창구는 열람 우선권을 수비 당직에 요구했다. 나선재는 후계 헌장 참관만 받고 실재 상호를 원장에서 지웠다. 공동체 위치는 이중 서명 전표를 몇 장이나 제시간에 검증했는지로 쌓였다. 가문 참관이 야간 단독 반출을 요구하면 그는 벽의 열람 시각표를 가리켰다.",
            "붕괴의 상처": "위조 열람 전표 세 장이 같은 시각 철문에 도착하자 나선재는 통로를 봉쇄하고 필적 대조가 끝날 때까지 엘리베이터를 잠갔다. 공포는 위조 전표 한 장이 임진 쪽 호송칸에 실려 도성 원장이 통째로 복사되는 장면이었다. 비상벨이 꺼진 뒤에도 그는 봉인 끈을 한 번 더 당겼다. LOSS 목록의 전표 칸은 비어 남은 채였다.",
            "생존 전환점": "전환점은 위조 전표 발급자를 공개 추적할지, 진본 원장 사본을 이중 호송으로 임진 관문에 보낼지다. 임진관문전구(XT01) 전령이 문서고 당직실에 닿자 순번이 흔들렸다. 추적을 택하면 내부 공모가 드러나고, 호송을 택하면 발급자가 한 칸 더 숨을 수 있다. K151-TURN은 그 철문의 선택이다.",
            "현재 지위": "나선재는 문서고 수비 조장으로 점호와 열람 큐를 지킨다. 면허·서명·이중 입회 로그가 지위를 받치며 기록법가의 전속 요구는 거절한다. 철문 열쇠는 두 자루로 나뉘어 조장과 참관함이 나눈다. Cast 현황과 열람 원장이 어긋나면 당일 반출을 닫는다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 스승 몫 여분 끈으로 임시 봉인한 서랍 메모다. 죄책감은 막은 위조 반출과 그 때문에 늦어진 진본 호송 사이에 있다. 부분 공개는 이중 입회 하에 서랍 번호만 허용한다. SECRET은 전령 봉인과 동시에만 열린다.",
            "관계 공동과거": "박솔의 골목 센서 로그를 문서고 부속 열람에 올린 계약, 허서겸의 연구 로그 봉인 입회, 기록법가 참관과의 단독 반출 경쟁이 한 통로에 있다. 같은 철문 앞에서 어떤 전표는 구원이 되었고 어떤 전표는 배신으로 읽혔다. 관계 원장 끝점은 STORY-B006-K151에 연결된다.",
            "3막 개인 서사선": "1막은 위조 열람 전표의 통로 봉쇄다. 2막은 HP04 우선권과 XT01 호송 요청의 충돌이다. 3막은 추적 또는 이중 호송 뒤 수비 원장이 치르는 신뢰 비용이다. 서사선은 STORY-B006-K151이다.",
            "분기 결말": "결말 α에서 나선재는 위조 발급자 추적으로 내부 공모를 드러낸다. 결말 β에서 진본 이중 호송으로 원장 연속을 지킨다. 문서고 슬롯은 유지되고 분기만 K151-OUT이다. 개입은 추적 입회 또는 호송 엄호다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 열람 전표에 통로와 엘리베이터를 봉쇄한다"
            },
            {
              "act": 2,
              "summary": "HP04 우선권과 XT01 호송 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 이중 호송의 대가로 수비 신뢰 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K151-OUT-A",
              "summary": "위조 발급자 추적으로 내부 공모 공개"
            },
            {
              "id": "K151-OUT-B",
              "summary": "진본 이중 호송으로 원장 연속 유지"
            }
          ]
        },
        {
          "id": "K175",
          "name": "설민우",
          "links": {
            "house": "HC08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B006-K175"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "선로 봉쇄 초소에서 설민우는 차단기 레버의 유격이 손바닥 한 뼘을 넘으면 교대를 멈춘다. 선로 봉쇄 순찰대 조장으로, 봉쇄 사유란이 빈 전표를 보면 확성기를 끈다. 한국 기원으로 서부 선로권에서 자랐고, 말은 거칠지만 봉쇄 시계는 초 단위로 적는다. 설민우와 K175는 재번호되지 않는다.",
            "붕괴 전 삶": "그는 곡창 호송과 민간 통행을 같은 봉쇄 원장에 올려 군사 단독 봉쇄가 시장을 질식시키지 않게 하려 했다. 야망은 초소 칠판에 못으로 고정한 개방 시간표였다. 동생에게 보내던 통행 쪽지—빈 사유란은 믿지 말라—가 훗날 빚의 씨앗이 된다. 장교 비상도장이 찍혀도 사유란이 채워지기 전엔 레버를 내리지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 궤도 방호 의무를 내세워 봉쇄 창구에 자리를 요구했다. 설민우는 후계 헌장 참관 칸만 열고 전속 소유 문장은 거절했다. 공동체 안에서의 위치는 개방 시각표를 벽에 붙인 횟수로 증명됐고, 행정과 호위가 동시에 사본을 받은 날만 통행이 열렸다. 가문 로고는 그의 원장에 등장하지 않는다.",
            "붕괴의 상처": "서해 곡창 호송과 피난 행렬이 같은 봉쇄 구간에 겹친 아침, 설민우는 이중 봉쇄 전표를 찢고 단일 사유란만 남겼다. 공포는 무기한 봉쇄가 곡물을 썩히고 시장 폭동으로 번지는 그림이었다. 경보가 꺼진 뒤 LOSS 목록 중간 줄에서 그의 펜이 멈췄다. 초소 난간에 남은 건 찢긴 전표 조각뿐이었다.",
            "생존 전환점": "전환점은 무기한 봉쇄 발령자를 공개할지, 곡창 호송 창구만 두 시간 열지다. 서해곡창전구(XT02) 쪽 전갈이 초소에 닿자 그는 개방 시계를 앞으로 당겼다. 공개를 택하면 방위문 권위가 흔들리고, 창구 개방을 택하면 본인이 항명으로 몰릴 수 있다. 결정은 K175-TURN에 남는다.",
            "현재 지위": "현재 설민우는 선로 봉쇄 조장으로 점호와 레버 큐를 지킨다. 면허와 참관 로그가 지위를 유지하며 성화궤도방위문의 전속 요구는 매번 반려한다. 초소 유리에는 오늘 만료되는 봉쇄 전표만 분필로 남긴다. Cast 프로필의 봉쇄 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 동생 쪽지를 숨긴 채 보류한 빈 사유란 한 줄이다. 죄책감은 살린 곡물 행렬과, 그 때문에 하루 늦게 도착한 약품 상자 사이에서 자란다. 완전 고백 대신 재심 창구를 통한 부분 공개만 허용한다. SECRET 열람은 행정 재심 전표와 동시에만 열린다.",
            "관계 공동과거": "유하은의 봉쇄 표지 가죽 납품은 계약이었고, 장세화의 배차 우회 요청은 동맹이었다. 궤도방위 참관의 무기한 전표와는 초소 앞에서 목소리를 높인 경쟁이 남았다. 같은 선로에서 한 행렬은 통행을 얻었고 다른 행렬은 대기만 남겼다. 관계 원장 끝점은 STORY-B006-K175로 이어진다.",
            "3막 개인 서사선": "1막에서 설민우는 이중 봉쇄 전표를 찢고 단일 사유를 강제한다. 2막에서 HC08 방호와 XT02 곡창 전갈을 개방 시계에 묶는다. 3막에서 공개 또는 창구 개방의 대가를 항명 위험으로 치른다. 서사선은 STORY-B006-K175이다.",
            "분기 결말": "결말 α에서 설민우는 무기한 발령자 공개로 공공 통행 규칙을 지킨다. 결말 β에서 곡창 창구 한시 개방으로 식량 연속을 택한다. 봉쇄 조 슬롯은 유지되며 분기만 K175-OUT으로 갈라진다. 개입은 공개 증언 또는 창구 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "이중 봉쇄 전표를 찢고 단일 사유란을 강제한다"
            },
            {
              "act": 2,
              "summary": "HC08 방호와 XT02 곡창 전갈을 개방 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "공개 또는 창구 개방의 대가로 항명 위험을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K175-OUT-A",
              "summary": "무기한 발령자 공개로 통행 규칙 수호"
            },
            {
              "id": "K175-OUT-B",
              "summary": "곡창 창구 한시 개방으로 식량 연속"
            }
          ]
        },
        {
          "id": "K265",
          "name": "김도윤",
          "links": {
            "house": "HC12",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B006-K265"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "차량기지 원로실 난간에서 김도윤은 인수인계서의 다국어 주석이 빠지면 도장함 뚜껑을 닫는다. 차량기지 원로로, 한국 출생 다문화 가정에서 자랐고 어린 시절 집 안 언어가 섞여도 기지 용어만은 하나로 통일했다. 성정은 느리게 보이지만 거부권 한 줄은 하루를 멈춘다. 표시 이름 김도윤과 불변 식별자 K265는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 기지 양도 계약에 시민 참관·다국어 고지·철회 기한을 한 줄씩 넣었다. 강국 단독 양도를 원로 거부권으로 막으려는 야망이었고, 초안은 원로실 칠판에 먼저 적혔다. 자녀에게 남긴 말—서명 전 모국어로 한 번 더 읽어라—가 훗날 빚의 씨앗이 된다. 빈 고지란 계약서는 끝내 도장을 받지 못했다.",
            "가문·기업·공동체": "거도중공회(HC12)는 중장비 정비 의무를 내세워 원로 창구에 자리를 요구했다. 김도윤은 후계 헌장 참관만 열고 실재 상호를 원장에서 지웠다. 공동체 위치는 다국어 고지 사본을 양쪽에 붙인 기록으로 증명됐다. 전속 양도 소유 요구는 원로실 문 앞에서 반려된다.",
            "붕괴의 상처": "해협 쪽 중개 세력이 기지 양도 초안을 한밤중 밀어 넣자 김도윤은 원로 거부권을 발동하고 인계식을 연기했다. 공포는 고지 없는 양도로 다문화 정비 인력 전체가 하룻밤에 자격을 잃는 장면이었다. 그는 거부 시각을 LOSS 목록 첫 줄에 적었다. 난간 위의 도장함은 그날 이후 이중 자물쇠가 걸렸다.",
            "생존 전환점": "전환점은 양도 초안의 빈 고지란을 공개 낭독할지, 예비 정비 인력을 해협 우회 루트로 먼저 대피시킬지다. 해협삼로전구(XT03) 전갈이 원로실에 겹치자 계산이 달라졌다. 낭독을 택하면 중공회 체면이 깎이고, 대피를 택하면 초안 발의자가 숨을 수 있다. 그 선택은 K265-TURN으로 남는다.",
            "현재 지위": "지금도 김도윤은 차량기지 원로로 점호와 거부권 큐를 지킨다. 지위는 세습이 아니라 면허·서명·참관 로그로만 유지된다. 거도중공회가 전속 양도를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 원로실 열쇠는 본인과 시민 참관함이 나눈다.",
            "비밀·빚·죄책감": "비밀은 그가 자녀 쪽지를 숨긴 채 보류한, 고지란 공란 초안 사본이다. 죄책감은 지킨 정비 일자리와 그 밤 호출하지 못한 견습 통역 한 명의 이름 사이에서만 자란다. 전부를 공개하면 기지 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겼다. SECRET 키는 원로와 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "허다온의 출고 도장 요청은 견제였고, 장세화의 배차 양보 요청은 동맹이었다. 중공회 참관과의 양도 초안 경쟁, 통역 견습과의 사제 계약이 한 난간에 겹친다. 같은 기지에서 어떤 인계는 구원이 되었고 어떤 인계는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B006-K265에 연결된다.",
            "3막 개인 서사선": "1막에서 김도윤은 고지 없는 양도 초안에 거부권을 건다. 2막에서 그는 HC12 중장비 압력과 XT03 전갈을 한 원로 책상에서 저울질한다. 3막에서 낭독 또는 인력 대피의 대가를 인계 지연으로 치른다. 서사선 식별자는 STORY-B006-K265로 고정된다.",
            "분기 결말": "결말 α에서 김도윤은 빈 고지란 공개 낭독으로 양도 무효를 고른다. 결말 β에서 그는 정비 인력 우회 대피로 일자리 연속을 지킨다. 어느 쪽도 차량기지의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K265-OUT으로 갈라진다. 플레이 개입은 낭독 입회 또는 대피 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "고지 없는 기지 양도 초안에 원로 거부권을 건다"
            },
            {
              "act": 2,
              "summary": "HC12 중장비 압력과 XT03 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "낭독 또는 인력 대피의 대가로 인계 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K265-OUT-A",
              "summary": "빈 고지란 공개 낭독으로 양도 무효"
            },
            {
              "id": "K265-OUT-B",
              "summary": "정비 인력 우회 대피로 일자리 연속"
            }
          ]
        },
        {
          "id": "K290",
          "name": "장세화",
          "links": {
            "house": "HP03",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B006-K290"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "배차 의무실 화이트보드 앞에서 장세화는 활력 숫자 없는 칸을 검은 매직으로 지운다. 배차의무관으로, 한국 출생 다문화 가정에서 자랐고 집에서는 두 언어를 섞어도 배차 전표는 표준 한국어 서식만 받는다. 성정은 단호하고 들것 바퀴 소리에 먼저 고개가 돌아간다. 이름 장세화와 식별자 K290은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 환승 배차와 중증 이송을 한 장의 의무 호송증에 묶어 국적란 우선 배차를 막으려 했다. 야망은 의무실 칠판에 그린 중증도 색표였다. 사촌에게 남긴 쪽지—국적란이 먼저면 태워라—가 빚의 씨앗이 된다. 배차조가 빈 슬롯을 들이밀어도 활력 안정 전에는 서명을 주지 않았다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 배차 의료 참관 칸을 요구했으나 장세화는 실재 회사 상호를 원장에 올리지 않는 후계 헌장만 받았다. 무기 적재 의심 칸은 심사 입회 없이 열지 않았고, HP03 감사는 정기 등재만 청구할 수 있었다. 공동체 위치는 들것 순서표를 양쪽에 동시에 붙인 기록으로 증명됐다. 가문 창구가 우선 이송 방송을 내밀면 그는 중증도 미기재를 이유로 무효를 선언했다.",
            "붕괴의 상처": "북쪽 남하 행렬이 배차 승강장에 쌓인 밤, 환자 칸이 군수 칸으로 오인될 뻔했다. 장세화는 당직을 연장하고 배차 교대를 거부한 채 중증도 표만 벽에 남겼다. 공포의 핵은 호송대 전체가 무장 해제를 당해 들것이 선로에 버려지는 장면이었다. 경보가 꺼진 뒤에도 그는 LOSS 목록 중간 줄에서 펜을 멈추지 못했다.",
            "생존 전환점": "전환점은 환자 명부와 무기 적재 기록을 먼저 대조할지, 의료회랑 호송증을 복사해 두만 쪽으로 보낼지 고른 순간이다. 두만극동전구(XT04) 호송 요청이 확성기와 겹치자 계산이 달라졌다. 명부 대조를 우선하면 오인 사격은 줄지만 대기 환자가 늘고, 호송증 복사를 우선하면 회랑은 열리되 한 칸의 무기가 숨을 수 있다. 그 선택은 K290-TURN으로 남는다.",
            "현재 지위": "지금도 장세화는 배차의무관으로 점호와 들것 큐를 지킨다. 지위는 세습이 아니라 면허·서명·심사 입회 로그로만 유지된다. 공동의료원가가 전속 이송 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 의무실 문은 두 열쇠 체계로 바뀌었고 한 자루는 지휘함, 다른 한 자루는 의료 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 서랍에 가둔, 국적란이 먼저 찍힌 배차표 사본 묶음이다. 죄책감은 살린 중증 명단과 그 밤 호출하지 못한 통역 견습 한 명의 이름 사이에서만 자란다. 전부를 공개하면 배차 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 심사관과 의무관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "설민우의 봉쇄 우회 요청은 동맹이었고, 김도윤의 원로 양보는 계약이었다. 의료원가 참관과의 우선 이송 경쟁, 통역 견습과의 사제 관계가 한 의무실에 겹친다. 같은 승강장에서 어떤 칸은 구원이 되었고 어떤 칸은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B006-K290에 연결된다.",
            "3막 개인 서사선": "1막에서 장세화는 남하 행렬의 오인 군수 칸 위기를 정면으로 맞는다. 2막에서 그는 HP03 참관과 XT04 호송 요청을 한 배차 책상에서 저울질한다. 3막에서 명부 대조 또는 호송증 복사의 대가를 대기 시간으로 치른다. 서사선 식별자는 STORY-B006-K290로 고정된다.",
            "분기 결말": "결말 α에서 장세화는 환자·무기 명부 대조를 우선해 오인 해제를 고른다. 결말 β에서 그는 의료회랑 호송증 복사를 우선해 회랑 개방을 지킨다. 어느 쪽도 배차 의무 체계의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K290-OUT으로 갈라진다. 플레이 개입은 명부 대조 또는 호송증 복사 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "남하 행렬 속 오인 군수 칸 위기에 당직을 연장한다"
            },
            {
              "act": 2,
              "summary": "HP03 참관과 XT04 호송 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "명부 대조 또는 호송증 복사의 대가로 대기 시간을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K290-OUT-A",
              "summary": "환자·무기 명부 대조로 오인 해제"
            },
            {
              "id": "K290-OUT-B",
              "summary": "의료회랑 호송증 복사로 회랑 개방"
            }
          ]
        },
        {
          "id": "K367",
          "name": "라진우",
          "links": {
            "house": "HP08",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B006-K367"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 대형 냉동창고 통로에서 라진우는 온도 일지의 한자·한글 병기가 빠지면 출고 스탬프를 거둔다. 창고지기로, 중국계 이산 가정에서 자라 시장 용어와 집 안 말을 바꿔 가며 썼지만 재고 원장은 이중 표기 규칙을 고집한다. 성정은 부드러워 보여도 온도 이탈 칸은 즉시 봉쇄한다. 라진우와 K367은 재번호되지 않는다.",
            "붕괴 전 삶": "그는 냉동 화물과 이산 가족 송금 상자를 같은 신용 원장에 묶어 강국 군수 냉동이 민생 칸을 삼키지 않게 하려 했다. 야망은 두 시간마다 소리 내어 읽던 온도 일지에 남았다. 어머니에게 약속한 겨울 이불 한 채가 작은 빚의 시작이었다. 허위 재고가 나오면 해당 가문 칸을 즉시 봉쇄하는 규칙만은 양보하지 않았다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 환적 우선권을 의무 조항으로 내밀었다. 라진우는 후계 헌장 참관만 받고 실재 상호를 배제한 채 칸 번호와 이중 표기만 공개했다. 공동체 신뢰는 온도 낭독에 입회한 인원 수로 쌓였고, 로고가 찍힌 빈 상자는 경매 자격 밖으로 밀렸다. 전속 국가 소유 요구는 창고 문 앞에서 거절됐다.",
            "붕괴의 상처": "원양 신탁 쪽 정전 소문이 가락 승강장에 닿은 밤, 빼내기 시작한 화물을 칸 단위로 봉했다. 공포는 전력 없는 몇 시간 만에 냉동이 녹아 이산 송금 상자까지 신용을 잃는 소리였다. 그는 녹은 냄새를 맡은 칸에 붉은 분필로 선을 그었다. LOSS 목록에는 그 칸 번호만 반복해 적혀 있다.",
            "생존 전환점": "전환점은 얼음과 축전지를 외부에서 들여올지, 녹은 재고를 숨긴 칸을 공개 봉인할지다. 원양신탁전구(XT05) 소식은 해상 얼음 경로를 열 수도, 군 우선 배전을 강요할 수도 있었다. 보급을 택하면 신용이 살아나고 공개를 택하면 가문 복수에 노출된다. K367-TURN은 그 밤의 봉인 순서다.",
            "현재 지위": "라진우는 창고지기로 점호와 온도 큐를 유지한다. 면허·서명·입회 로그가 지위를 받치며 시장냉동상단의 전속 요구는 거절한다. 열쇠는 여전히 두 묶음이고 한 묶음은 상단 당직, 다른 묶음은 본인이 지닌다. Cast 현황과 온도 원장이 어긋나면 출고 사이렌을 울린다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 어머니 몫 이불 상자를 한 칸 옮긴 기록이다. 죄책감은 살린 중계 화물과 그 때문에 늦어진 이불 전달 사이에 있다. 부분 공개는 입회 두 명 앞에서 칸 번호만 밝히는 경로로 남긴다. SECRET은 얼음 인계 로그와 맞물릴 때만 열린다.",
            "관계 공동과거": "허서겸의 연구차 센서 예비품 대여는 계약이었고, 수한별·판효담의 실무 당직은 사제 관계였다. 냉동상단 참관과의 우선 환적 경쟁이 한 레일 위에 있다. 같은 밤 어떤 칸은 구원이 되었고 어떤 칸은 배신으로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B006-K367에 연결된다.",
            "3막 개인 서사선": "1막은 정전 소문 속 칸 봉인이다. 2막은 HP08 우선권과 XT05 보급 경로의 충돌이다. 3막은 보급 또는 공개 뒤 창고 신용이 치르는 비용이다. 서사선은 STORY-B006-K367이다.",
            "분기 결말": "결말 α에서 라진우는 얼음·축전지 보급으로 공공 환적 연속을 택한다. 결말 β에서 허위 재고 칸을 공개해 개인과 비밀 기록을 지킨다. 가락 창고 슬롯은 유지되고 분기만 K367-OUT이다. 개입은 보급 호위 또는 봉인 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 소문 속 화물을 칸 단위로 봉한다"
            },
            {
              "act": 2,
              "summary": "HP08 우선권과 XT05 보급 경로가 충돌한다"
            },
            {
              "act": 3,
              "summary": "보급 또는 공개 뒤 창고 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K367-OUT-A",
              "summary": "얼음·축전지 보급으로 환적 연속"
            },
            {
              "id": "K367-OUT-B",
              "summary": "허위 재고 칸 공개로 개인·기록 보호"
            }
          ]
        },
        {
          "id": "H06",
          "name": "박솔",
          "links": {
            "house": "HC06",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B006-H06"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "골목 메시 중계함 앞에서 박솔은 야간 시야 모듈의 노이즈 경계를 센서 막대 숫자로만 읽는다. 합성 인간형 H06이며 호출명은 솔, 골목연결국(HC06) 공동 보관 체계 아래 교체형 손모듈로 뚜껑을 연다. 전지적 시야는 없고 배터리 잔량과 참관 봉인이 행동을 제한한다. 표시 이름 박솔과 식별자 H06은 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 골목 정전 지도를 시민 참관 로그에 공개해 단독 원격 잠금을 막으려는 목표가 남아 있다. 야망에 해당하는 우선순위는 중계함 측면의 잔량 그래프에 점으로만 찍혀 있다. 보관 책임자가 남긴 예비 배터리 슬롯 하나가 연속성 부채의 자리였다. 삼자 서명 없는 양도 명령은 실행 큐에 오르지 않았다.",
            "가문·기업·공동체": "골목연결국(HC06)은 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 박솔의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 공동체 위치는 스냅샷 교대 단위가 양쪽에 동시에 기록된 횟수로 증명된다. 전속 국가 소유 요구는 중계함 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "서해 곡창 방면 정전 파동이 골목 메시를 흑백 노이즈로 덮은 밤, 박솔은 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 뚜껑을 잠갔다. 공포에 해당하는 최고 우선 경보는 오탐 경로가 곡물 호송을 적대 표적으로 바꾸는 시나리오였다. LOSS 목록에는 끊긴 노드 번호와 배터리 하한만 적혔다. 비상 전원이 돌아와도 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "전환점은 노이즈 노드를 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 곡창 우회 메시만 살릴지다. 서해곡창전구(XT02) 쪽 경로 요청이 중계함 수신함에 겹쳤다. 공개 분해를 택하면 원인 공급 코드가 드러나고, 우회 메시만 살리면 다른 골목 공백이 길어진다. H06-TURN은 그 수신 큐의 정렬 결과다.",
            "현재 지위": "박솔은 여전히 골목 메시 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC06이 전속 원격 소유를 요구해도 거부 코드를 반환하고, Cast 프로필의 현황 칸과 스냅샷 해시를 교대마다 맞춘다. 중계함 열쇠 권한은 보관 책임과 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀에 해당하는 제한 로그는 참관 없이 한 번 올라간 펌웨어 패치 한 줄이다. 죄책감에 해당하는 가중치는 살린 우회 메시 노드와 그 교대에 호출하지 못한 예비 슬롯 사이에서만 증가한다. 전부 공개 대신 이중 참관 하의 부분 로그 공개 절차만 남겼다. SECRET 플래그는 보관 책임과 시민 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "나선재의 문서고 부속 열람에 올린 센서 로그는 계약 코드였고, 허서겸의 연구차 파형 대조는 동맹 큐였다. 연결국 참관과의 원격 잠금 경쟁, 골목 주민 대표와의 스냅샷 공유가 한 중계함에 겹친다. 같은 노드에서 어떤 경로는 구원으로 기록되었고 어떤 경로는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B006-H06에 연결된다.",
            "3막 개인 서사선": "1막에서 박솔은 정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HC06 원격 요구와 XT02 곡창 경로 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 우회 회생의 대가를 골목 공백 시간으로 치른다. 서사선 식별자는 STORY-B006-H06로 고정된다.",
            "분기 결말": "결말 α에서 박솔은 노이즈 노드 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 우회 메시로 곡창 호송 연속을 지킨다. 어느 쪽도 골목연결국 보관 슬롯을 삭제하지 않으며, 분기 식별만 H06-OUT으로 갈라진다. 플레이 개입은 분해 입회 또는 우회 전원 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC06 원격 요구와 XT02 곡창 경로를 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 우회 회생의 대가로 골목 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H06-OUT-A",
              "summary": "노이즈 노드 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H06-OUT-B",
              "summary": "예비 배터리 우회 메시로 곡창 호송 연속"
            }
          ]
        }
      ]
    },
    "B007": {
      "id": "B007",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K199",
          "name": "나태경",
          "links": {
            "house": "HP08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B007-K199"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 남관 부두 밧줄 더미 옆에서 나태경은 호송칸 봉인 끈의 매듭이 헐거우면 출항 벨을 끈다. 시장 자경 순찰대 조장으로, 출발 직전까지 경로를 입 밖에 내지 않는다. 한국 기원으로 노량진 하구권에서 자랐고, 말은 짧지만 중량 장부는 두 번 읽는다. 나태경의 Cast 고정 앵커는 Cast-Index.md#S08 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 남관 호송선단과 경매 낙찰 전갈을 같은 자경 원장에 묶어 강국 보호비가 시장 순찰을 사지 못하게 하려 했다. 야망은 부두 칠판에 못으로 고정한 출항 시각표였다. 동생에게 남긴 얼음 상자 영수증 한 장이 작은 빚으로 남아 있었다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 환적 우선 호송을 자경 창구에 요구했다. 나태경은 후계 헌장 참관만 받고 실재 상호·제품명을 중량 원장에서 지웠다. 공동체 위치는 도착 중량이 출발과 다를 때 전 칸 재검색을 몇 번이나 걸었는지로만 증명된다.",
            "붕괴의 상처": "한 호송칸에서 암사제 봉인 상자가 나온 새벽, 나태경은 선단 출항을 막고 전 칸을 다시 열었다. 공포는 군수품이 섞인 선단이 하구를 건너는 순간 남관 중립시장이 하루 만에 무너지는 장면이었다. 재검색 중에 얼음 칸 온도가 올라 민생 화물이 녹기 시작했다.",
            "생존 전환점": "전환점은 봉인 상자 출처를 공개 추적할지, 예비 얼음으로 민생 칸만 먼저 살릴지 고른 순간이다. 서해곡창전구(XT02) 쪽 부두 배수 일정이 확성기와 겹치자 계산이 달라졌다. 추적을 택하면 상단 신용이 흔들리고, 얼음 우선을 택하면 밀수 경로가 하루 더 숨을 쉰다.",
            "현재 지위": "지금도 나태경은 시장 자경 조장으로 점호와 출항 큐를 지킨다. 지위는 세습이 아니라 면허·서명·재검색 로그로만 유지된다. 시장냉동상단이 전속 호송 소유를 요구해도 그는 거절하고, Cast 프로필 앵커를 바꾸지 않는다.",
            "비밀·빚·죄책감": "비밀은 그가 동생 몫 얼음 상자를 재검색 전에 한 칸 옮긴 쪽지다. 죄책감은 살린 민생 중량과 그 밤 호출하지 못한 견습 순찰 한 명의 이름 사이에서만 자란다. 부분 공개는 부두 입회 두 명 앞에서 호송칸 번호만 허용한다.",
            "관계 공동과거": "신태산의 호송 계약은 지휘 줄이었고, 설초아의 역 방송 시각은 출항 종과 맞물렸다. 장세화의 공동호송 초안을 부두 기준으로 검토한 밤은 동맹이었으며, 상단 참관과의 우선 호송 경쟁이 같은 밧줄 더미에 남았다. 관계 끝점은 STORY-B007-K199로 연결된다.",
            "3막 개인 서사선": "1막에서 나태경은 암사제 봉인 상자가 섞인 호송칸의 출항 정지를 정면으로 맡는다. 2막에서 그는 HP08 환적 우선과 XT02 부두 배수 요청을 한 중량 책상에서 저울질한다. 3막에서 추적 또는 민생 얼음 우선의 대가로 자경 신용 비용을 진다. 서사선은 STORY-B007-K199다.",
            "분기 결말": "결말 α에서 나태경은 봉인 상자 출처 공개로 밀수 경로 차단을 고른다. 결말 β에서 그는 예비 얼음으로 민생 칸을 살려 시장 연속을 지킨다. 어느 쪽도 노량진 남관 16국 슬롯을 삭제하지 않으며 분기만 K199-OUT으로 기록한다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "암사제 봉인 상자 호송칸에 출항을 정지한다"
            },
            {
              "act": 2,
              "summary": "HP08 환적 우선과 XT02 부두 배수를 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 민생 얼음 우선의 대가로 자경 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K199-OUT-A",
              "summary": "봉인 상자 출처 공개로 밀수 경로 차단"
            },
            {
              "id": "K199-OUT-B",
              "summary": "예비 얼음 민생 우선으로 시장 연속"
            }
          ]
        },
        {
          "id": "K224",
          "name": "용복",
          "links": {
            "house": "HP09",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B007-K224"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신탑 바람 난간에서 용복은 방향 탐지 바늘이 한 칸만 흔들려도 접근로를 막는다. 송신탑 순찰대이며 조은우의 실무 담당으로, 재밍 냄새를 맡으면 보고 전에 사다리를 잠근다. 한국 기원으로 서북 송신권에서 자랐고, 가짜 송신원 소문보다 파형 로그를 믿는다. 용복의 Cast 고정 앵커는 Cast-Index.md#S09 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 위조 방송과 군사 재밍을 같은 순찰 원장에 올려 공사의 정통성을 전파 주권으로 남기려 했다. 야망은 탑 밑 분필로만 남은 탐지 경로표였다. 어머니에게 약속한 수신 이어폰 한 짝이 공구함 구석에 남아 있었다.",
            "가문·기업·공동체": "데이터신탁가(HP09)는 송신 로그 원격 열람 창구를 순찰 당직에 요구했다. 용복은 후계 헌장 참관 칸만 열고 실재 상호를 원장에서 지웠다. 공동체 신뢰는 방향 탐지 경로를 매일 게시판에 붙인 횟수로만 쌓인다.",
            "붕괴의 상처": "용산 억류 열차 부근과 같은 파형의 짧은 재송신이 서북 관문에서 다시 잡힌 밤, 용복은 탑 사다리를 봉쇄하고 안테나 잠금을 이중으로 걸었다. 공포는 순찰대가 검열 기관으로 변해 문가람의 다중 송신망을 내부에서 끄는 장면이었다. 그 시각 당직 한 줄이 비어 있었고 잠금 키가 한 칸 비어 있었다.",
            "생존 전환점": "전환점은 재송신 원점을 공개 지도에 붙일지, 예비 중계 대역으로 시민 안내 방송만 살릴지다. 원양신탁전구(XT05) 쪽 위성 잔여 대역 전갈이 당직실에 닿자 순번이 흔들렸다. 원점 공개를 택하면 신탁 창구 권력이 흔들리고, 안내 방송 우선을 택하면 위조 경로가 하루 더 남는다.",
            "현재 지위": "용복은 여전히 송신탑 순찰로 점호와 탐지 큐를 본다. 면허와 참관 로그가 지위를 유지하며 데이터신탁가의 전속 열람 요구는 매번 반려한다. 탑 유리에는 오늘 만료되는 접근 전표만 붙여 둔다.",
            "비밀·빚·죄책감": "비밀은 그가 시동 전에 숨긴, 참관 없이 올린 짧은 재송신 메모 한 줄이다. 죄책감은 살린 안내 방송과 그 때문에 미룬 어머니 이어폰 전달 사이에 있다. 부분 공개는 탑 입회 한 명과 검증관 앞에서 파형 시각만 낭독한다.",
            "관계 공동과거": "조은우의 지휘 줄로 탑을 돌았고, 두봉의 정비 창을 아래에서 지켰다. 배우진의 재밍 의혹은 현장 증언으로 남겼으며, 홍우찬의 원점 지도와 시각을 맞춘 밤은 동맹이었다. 관계 끝점은 STORY-B007-K224로 연결된다.",
            "3막 개인 서사선": "1막에서 용복은 서북 관문 재송신 파형에 사다리 봉쇄로 맞선다. 2막에서 HP09 원격 열람과 XT05 대역 전갈을 탐지 시계에 묶는다. 3막에서 원점 공개 또는 안내 방송 회생의 대가를 순찰 신뢰 비용으로 진다. 서사선은 STORY-B007-K224다.",
            "분기 결말": "결말 α에서 용복은 재송신 원점 공개 지도로 위조 경로를 확정한다. 결말 β에서 예비 중계 대역으로 시민 안내 방송을 살려 전파 연속을 택한다. 상암 송신 슬롯은 유지되며 분기만 K224-OUT으로 기록한다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "서북 관문 재송신 파형에 사다리를 봉쇄한다"
            },
            {
              "act": 2,
              "summary": "HP09 원격 열람과 XT05 대역 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "원점 공개 또는 안내 방송 회생의 대가로 순찰 신뢰를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K224-OUT-A",
              "summary": "재송신 원점 공개로 위조 경로 확정"
            },
            {
              "id": "K224-OUT-B",
              "summary": "예비 중계 대역으로 안내 방송 연속"
            }
          ]
        },
        {
          "id": "K249",
          "name": "용국",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B007-K249"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북한산 회랑 입구 횃불 아래에서 용국은 횃불 간격이 한 숨만 어긋나도 통행을 멈춘다. 회랑 순찰대이며 강태산의 실무 담당으로, 가족을 갈라놓는 효율 명령을 듣지 않는다. 한국 기원으로 북산 숙영권에서 자랐고, 지형을 사람 얼굴처럼 기억한다. 용국의 Cast 고정 앵커는 Cast-Index.md#S10 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 회랑을 독립 통행로로 남겨 암사 순찰이 숙영 명부를 군사호적으로 바꾸지 못하게 하려 했다. 야망은 고지 칠판에 못으로 고정한 횃불 교대표였다. 조카에게 약속한 방한 장갑 한 켤레가 배낭 옆주머니에 남아 있었다.",
            "가문·기업·공동체": "북산귀환회(HP05)는 귀환 명부 우선 열람을 순찰 창구에 요구했다. 용국은 후계 헌장 참관만 받고 실재 상호를 배제한 채 횃불 시각만 공개했다. 공동체 위치는 신보람의 가족 표 없이 무장 통과를 몇 번 막았는지로만 증명된다.",
            "붕괴의 상처": "급수권 철표가 복무계약과 같은 끈으로 묶여 회랑 게시판에 붙은 아침, 용국은 입구를 하루 닫고 철표를 떼어 봉투에 봉했다. 공포는 매복대가 용병이 되어 피난 맹세를 스스로 깨는 소리였다. 그 시각 고지 당직 한 줄이 비어 횃불 사각이 생겼다.",
            "생존 전환점": "전환점은 철표·복무 끈의 출처를 연방회의에 공개할지, 예비 우회로로 가족 행렬만 먼저 돌릴지다. 임진관문전구(XT01) 쪽 귀환 명부 재발급 요청이 확성기에 겹쳤다. 공개를 택하면 귀환회 권력이 흔들리고, 우회 우선을 택하면 철표 관행이 하루 더 남는다.",
            "현재 지위": "용국은 회랑 순찰로 점호와 횃불 큐를 유지한다. 면허·서명·가족 표 입회 로그가 지위를 받치며 북산귀환회의 전속 요구는 거절한다. 입구 열쇠는 두 자루로 나뉘어 순찰과 가족 대표함이 함께 쥔다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 조카 몫 우회로를 지도에 점선으로만 남긴 메모다. 죄책감은 살린 가족 행렬과 그 때문에 늦어진 장갑 전달 사이에 있다. 부분 공개는 가족 대표 입회 하에 우회로 점선 번호만 허용한다.",
            "관계 공동과거": "강태산의 지휘로 회랑을 돌았고, 봉두의 고지 신호와 횃불을 맞췄다. 배우진의 순찰대와는 원한에 가깝고, 백온의 피난처 맹세를 고지 칠판에 함께 적은 밤은 동맹이었다. 관계 끝점은 STORY-B007-K249로 연결된다.",
            "3막 개인 서사선": "1막에서 용국은 철표 게시 회랑 입구를 하루 닫는다. 2막에서 HP05 명부 우선과 XT01 재발급 요청을 횃불 시계에 묶는다. 3막에서 공개 또는 우회 행렬의 대가를 순찰 맹세 비용으로 진다. 서사선은 STORY-B007-K249다.",
            "분기 결말": "결말 α에서 용국은 철표 출처 공개로 군사호적화 시도를 끊는다. 결말 β에서 예비 우회로 가족 행렬로 피난 연속을 지킨다. 북산 회랑 슬롯은 유지되고 분기만 K249-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "철표 게시 회랑 입구를 하루 닫는다"
            },
            {
              "act": 2,
              "summary": "HP05 명부 우선과 XT01 재발급을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 또는 우회 행렬의 대가로 맹세 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K249-OUT-A",
              "summary": "철표 출처 공개로 군사호적화 차단"
            },
            {
              "id": "K249-OUT-B",
              "summary": "예비 우회로 가족 행렬로 피난 연속"
            }
          ]
        },
        {
          "id": "K274",
          "name": "용모",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B007-K274"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 북문 검차장 레일 위에서 용모는 제동 페달 유격이 손바닥을 넘으면 출격을 멈춘다. 북문 순찰대이며 권도하의 실무 담당으로, 숙련 없는 돌격을 배신에 가깝다고 말한다. 한국 기원으로 창동 기지권에서 자랐고, 선로 위의 침묵을 순찰의 일부로 본다. 용모의 Cast 고정 앵커는 Cast-Index.md#S11 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 북문 순찰을 약소국 공동호송의 북부 날개로 묶어 암사 보호비 없이 창동 열차를 움직이려 했다. 야망은 검차장 벽에 분필로만 남은 차륜 점검표였다. 사촌에게 남긴 제동 패드 여분 한 장이 공구함 밑바닥에 있었다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 궤도 방호 의무를 내세워 북문 무장 탑재 창구에 자리를 요구했다. 용모는 후계 헌장 참관만 열고 실재 상호를 원장에서 지웠다. 공동체 위치는 원로·감사 공동 서명 없는 무장을 몇 번 반려했는지로만 쌓인다.",
            "붕괴의 상처": "시험 차륜 결함 직후 북문 순찰차가 제동 불량으로 정차해 호송 시각이 어긋난 오후, 용모는 출격을 잠그고 페달만 해체했다. 공포는 궤도기병이 주거 민병으로 흡수되어 기지가 병영이 되는 그림이었다. 같은 로트의 제동이 정비창 대기열에 남아 있었다.",
            "생존 전환점": "전환점은 제동 불량 로트를 원로 게시판에 공개할지, 예비 패드로 호송 시각만 먼저 맞출지다. 두만극동전구(XT04) 쪽 화차 중량 로그 공개 요청이 검차장에 겹쳤다. 공개를 택하면 방위문 압력이 커지고, 호송 우선을 택하면 결함 경로가 하루 더 숨는다.",
            "현재 지위": "용모는 북문 순찰로 점호와 제동 큐를 지킨다. 면허와 공동 서명 로그가 지위를 유지하며 성화궤도방위문의 전속 요구는 반려한다. 아침마다 페달 유격과 호송 칠판을 같은 분필로 고친다.",
            "비밀·빚·죄책감": "비밀은 봉인 전 유격이 아슬했던 페달 하나의 내부 메모다. 죄책감은 제시간에 맞춘 호송과, 그 때문에 하루 미룬 사촌 패드 전달 사이에 있다. 부분 공개는 원로 입회 하에 페달 메모 한 줄만 허용한다.",
            "관계 공동과거": "권도하의 지휘로 북문을 돌았고, 강태산과 회랑 횃불을 맞췄다. 장세화의 북부 호송 시각을 순찰 칠판에 옮긴 계약, 정비창과의 우선 수리 경쟁이 한 레일 위에 있다. 관계 끝점은 STORY-B007-K274로 연결된다.",
            "3막 개인 서사선": "1막에서 용모는 제동 불량 순찰차의 출격 정지를 맡는다. 2막에서 HC08 무장 압력과 XT04 중량 로그 요청을 검차 시계에 묶는다. 3막에서 공개 또는 호송 우선의 대가를 순찰 신용 비용으로 진다. 서사선은 STORY-B007-K274다.",
            "분기 결말": "결말 α에서 용모는 제동 로트 공개로 안전 규격을 택한다. 결말 β에서 예비 패드 호송 우선으로 통행 연속을 지킨다. 창동 북문 슬롯은 유지되고 분기만 K274-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "제동 불량 북문 순찰차의 출격을 정지한다"
            },
            {
              "act": 2,
              "summary": "HC08 무장 압력과 XT04 중량 로그를 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 또는 호송 우선의 대가로 순찰 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K274-OUT-A",
              "summary": "제동 로트 공개로 안전 규격 유지"
            },
            {
              "id": "K274-OUT-B",
              "summary": "예비 패드 호송 우선으로 통행 연속"
            }
          ]
        },
        {
          "id": "K299",
          "name": "감국",
          "links": {
            "house": "HP02",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B007-K299"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "망우 외곽로 신호기 아래에서 감국은 발포를 자랑하는 대원을 호송칸에서 내린다. 동북 외곽로 순찰대이며 하세온의 실무 담당으로, 적은 병력으로 긴 열차를 지키는 침묵을 안다. 한국 기원으로 신내 환승권에서 자랐고, 낙관적인 상관의 공백을 현장에서 메운다. 감국의 Cast 고정 앵커는 Cast-Index.md#S12 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 약소국 공동호송의 외곽 순찰을 신내 호송대가 맡아 보호비 없는 동북 회랑의 실력을 증명하려 했다. 야망은 신호기 함에 연필로만 적은 교대 구간표였다. 여동생에게 보내던 통행 쪽지 한 장이 주머니 안감에 남아 있었다.",
            "가문·기업·공동체": "환승선로문(HP02)은 환승 슬롯 우선권을 외곽 순찰 창구에 요구했다. 감국은 후계 헌장 참관만 받고 실재 상호를 원장에서 지웠다. 공동체 위치는 장세화의 봉인 명령 없이 발포 권한을 주지 않은 횟수로만 증명된다.",
            "붕괴의 상처": "겨울 배차 조사 중 호송대가 암사 순찰열차와 망우 외곽에서 정면으로 마주친 밤, 감국은 신호기를 들어 양쪽 정차를 강제했다. 공포는 교전 한 방으로 중립이 전쟁으로 바뀌는 소리였다. 심사대 봉인 장부에는 후문 우회 흔적이 이미 남아 있었다.",
            "생존 전환점": "전환점은 발포 명령 위조 쪽지를 공개 추적할지, 우회 신호로 의료칸만 먼저 빠질지다. 임진관문전구(XT01) 쪽 창동 호송 우회 환승 요청이 확성기에 겹쳤다. 추적을 택하면 선로문 권한이 흔들리고, 의료칸 우선을 택하면 위조 경로가 하루 더 남는다.",
            "현재 지위": "감국은 외곽로 순찰로 점호와 신호 큐를 지킨다. 면허·서명·봉인 입회 로그가 지위를 받치며 환승선로문의 전속 요구는 거절한다. 신호기 함 열쇠는 순찰과 심사대가 나눠 쥔다.",
            "비밀·빚·죄책감": "비밀은 그가 여동생 쪽지를 숨긴 채 보류한, 빈 발포 사유란 한 줄이다. 죄책감은 막은 교전과 그 때문에 하루 늦게 도착한 약품 상자 사이에서 자란다. 부분 공개는 심사대 재심 창구를 통한 신호 사유 요약만 허용한다.",
            "관계 공동과거": "하세온의 지휘로 외곽로를 돌았고, 문시온의 심사대 봉인을 길에서 확인했다. 배우진의 보호 검색은 순찰 원장에 남기지 않았고, 장세화의 중립 명령은 동맹이었다. 관계 끝점은 STORY-B007-K299로 연결된다.",
            "3막 개인 서사선": "1막에서 감국은 암사 순찰열차와의 정면 조우에 쌍방 정차 신호를 강제한다. 2막에서 HP02 슬롯 우선과 XT01 우회 환승 요청을 신호 시계에 묶는다. 3막에서 추적 또는 의료칸 우회의 대가를 호송 중립 비용으로 진다. 서사선은 STORY-B007-K299다.",
            "분기 결말": "결말 α에서 감국은 발포 위조 쪽지 추적으로 내부 공모를 드러낸다. 결말 β에서 의료칸 우회 신호로 환자 연속을 지킨다. 신내 외곽 슬롯은 유지되며 분기만 K299-OUT으로 기록한다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "암사 순찰열차 조우에 쌍방 정차 신호를 강제한다"
            },
            {
              "act": 2,
              "summary": "HP02 슬롯 우선과 XT01 우회 환승을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 의료칸 우회의 대가로 중립 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K299-OUT-A",
              "summary": "발포 위조 쪽지 추적으로 내부 공모 공개"
            },
            {
              "id": "K299-OUT-B",
              "summary": "의료칸 우회 신호로 환자 연속"
            }
          ]
        },
        {
          "id": "K324",
          "name": "수초롱",
          "links": {
            "house": "HP06",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B007-K324"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령시장 동측 골목 말목 앞에서 수초롱은 출입 도장이 흐리면 골목을 되돌아간다. 약령 동측 방역 순찰대이며 라세영의 실무 담당으로, 소문보다 격리 일수를 믿는다. 한국 기원으로 청량리·약령권에서 자랐고, 정치적 봉쇄 해제를 사고 원인으로 일지에 적는다. 수초롱의 Cast 고정 앵커는 Cast-Index.md#S13 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 동대문·청량리 방역 봉쇄의 현장 발동을 순찰대가 단독으로 걸어 상인 쪽 해제를 막으려 했다. 야망은 말목에 칼로 새긴 격리 일수표였다. 스승에게 빌린 검역 스탬프 잉크 한 병이 주머니에 남아 있었다.",
            "가문·기업·공동체": "약령치유문(HP06)은 방역 해제 우선권을 순찰 창구에 요구했다. 수초롱은 후계 헌장 참관만 받고 실재 상호를 원장에서 지웠다. 공동체 위치는 서이안의 수질·약효 기록 없이 말목을 뽑지 않은 횟수로만 쌓인다.",
            "붕괴의 상처": "폭우 뒤 구의 제한 급수 구간에서 설사병이 번지자 수초롱은 약령시장 동측을 사흘 봉쇄하는 말목을 먼저 박았다. 공포는 탁수와 가짜 약이 같은 주에 퍼져 순찰대가 급수국과 시장 사이에서 잘리는 장면이었다. 봉쇄 첫날 약재 출하 줄이 골목 끝까지 늘어섰다.",
            "생존 전환점": "전환점은 오염원 표본을 마곡으로 공개 호송할지, 예비 해열 생약 칸만 검역 통과로 열지다. 두만극동전구(XT04) 쪽 동상·방역 환자 수용 전갈이 말목 앞에 닿았다. 표본 호송을 택하면 치유문 상인 압력이 커지고, 생약 우선을 택하면 오염 경로가 하루 더 남는다.",
            "현재 지위": "수초롱은 동측 방역 순찰로 점호와 말목 큐를 본다. 면허와 이중 도장 로그가 지위를 유지하며 약령치유문의 전속 해제 요구는 반려한다. 말목 열쇠는 순찰과 방역 당직이 나눠 쥔다.",
            "비밀·빚·죄책감": "비밀은 봉쇄 직전 그가 스승 몫 잉크로 임시 도장한 골목 메모다. 죄책감은 막은 확산과 그 때문에 늦어진 생약 출하 사이에 있다. 부분 공개는 방역 이중 입회 하에 골목 말목 번호만 허용한다.",
            "관계 공동과거": "라세영의 지휘로 동측 골목을 돌았고, 하윤목의 아차 검역 통과증을 길에서 대조했다. 선나휘의 봉쇄 전갈이 오기 전에는 말목을 뽑지 않았고, 류은비의 치료 원칙은 일지 맨 위에 두었다. 관계 끝점은 STORY-B007-K324로 연결된다.",
            "3막 개인 서사선": "1막에서 수초롱은 설사병 확산에 동측 말목 봉쇄를 먼저 박는다. 2막에서 HP06 해제 압력과 XT04 환자 전갈을 격리 시계에 묶는다. 3막에서 표본 호송 또는 생약 우선의 대가를 방역 신용 비용으로 진다. 서사선은 STORY-B007-K324다.",
            "분기 결말": "결말 α에서 수초롱은 오염원 표본 공개 호송으로 경로를 확정한다. 결말 β에서 예비 해열 생약 칸 개방으로 투약 연속을 택한다. 약령 동측 슬롯은 유지되고 분기만 K324-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "설사병 확산에 동측 말목 봉쇄를 먼저 박는다"
            },
            {
              "act": 2,
              "summary": "HP06 해제 압력과 XT04 환자 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "표본 호송 또는 생약 우선의 대가로 방역 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K324-OUT-A",
              "summary": "오염원 표본 공개 호송으로 경로 확정"
            },
            {
              "id": "K324-OUT-B",
              "summary": "예비 해열 생약 칸 개방으로 투약 연속"
            }
          ]
        },
        {
          "id": "K315",
          "name": "류은비",
          "links": {
            "house": "HP03",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B007-K315"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령 의정회 병상 칠판 앞에서 류은비는 중증도 숫자 없는 칸을 검은 매직으로 지운다. 치료길드 대표로, 한국 출생 다문화 가정에서 자랐고 집에서는 두 언어를 섞어도 투약 전표는 표준 한국어 주석만 남긴다. 자비롭고 원칙적이지만 치료 중립을 위협하는 거래는 끊는다. 류은비의 Cast 고정 앵커는 Cast-Index.md#S13 주요 칸에만 있다.",
            "붕괴 전 삶": "붕괴 전 그는 의약품을 전리품으로 삼지 못하게 하는 서울 의료헌장 초안을 환자 중증도와 공개 기여도 칸에 나란히 적었다. 야망은 의정회 벽에 못으로 고정한 헌장 초고였다. 어머니에게 남긴 이중 언어 투약 설명서 한 부가 서랍에 남아 있었다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 길드 의료 참관 칸을 요구했으나 류은비는 실재 회사 상호를 원장에 올리지 않는 후계 헌장만 받았다. 강국 독점 구매 요청은 심사 입회 없이 열지 않았고, 전솔의 환자대표 날인이 있는 할당만 통과시켰다. 공동체 신뢰는 중증도 표를 시장 입구에 붙인 날로만 쌓인다.",
            "붕괴의 상처": "가짜 약품이 북산 피난민에게 퍼지고 제조자가 강국 보호를 받는다는 증언이 들어온 주, 류은비는 선반을 잠그고 캡슐 인장을 대조하기 시작했다. 공포는 강국 하나가 약재·항생제 구매를 독점해 길드 정통성이 한 계절에 무너지는 장면이었다. 같은 모양 캡슐이 진료소 선반에서 한 통 더 나왔다.",
            "생존 전환점": "전환점은 제조망을 공개 추적할지, 예비 정품 로트로 북산 투약 줄만 먼저 살릴지다. 두만극동전구(XT04) 쪽 동상 환자·약재 검수 전갈이 의정회에 겹쳤다. 추적을 택하면 보호국과의 거래가 끊기고, 투약 우선을 택하면 가짜 경로가 하루 더 숨을 쉰다.",
            "현재 지위": "지금도 류은비는 치료길드 대표로 점호와 병상 큐를 지킨다. 지위는 세습이 아니라 면허·서명·심사 입회 로그로만 유지된다. 공동의료원가가 전속 치료 소유를 요구해도 거절하고, H13 주정비 입회만 지킨다.",
            "비밀·빚·죄책감": "비밀은 그가 서랍에 가둔, 국적란이 먼저 찍힌 투약 동의 사본 묶음이다. 죄책감은 살린 중증 명단과 그 밤 호출하지 못한 통역 견습 한 명의 이름 사이에서만 자란다. 전부를 공개하면 헌장이 흔들린다. 부분 공개는 길드 입회 하에 캡슐 로트 번호만 허용한다.",
            "관계 공동과거": "백온에게 생명의 빚이 남아 있고, 장세화와 의료호송을 나눈 밤은 동맹이었다. 서이안과 약효 검증을 공유했으며, 수초롱의 동측 봉쇄 일지를 길드 원장에 옮긴 계약이 한 칠판에 겹친다. 다문화 이력은 투약 설명서를 읽을 때만 필요하고 진영을 가르지 않는다. 관계 끝점은 STORY-B007-K315다.",
            "3막 개인 서사선": "1막에서 류은비는 가짜 약 확산에 선반 봉인과 인장 대조를 맡는다. 2막에서 HP03 참관과 XT04 약재 전갈을 한 의정 책상에서 저울질한다. 3막에서 제조망 추적 또는 정품 투약 우선의 대가를 길드 중립 비용으로 진다. 서사선은 STORY-B007-K315다.",
            "분기 결말": "결말 α에서 류은비는 제조망 공개 추적으로 독점 구매 차단을 고른다. 결말 β에서 예비 정품 로트 투약으로 북산 줄 연속을 지킨다. 어느 쪽도 약령 길드 16국 슬롯을 삭제하지 않으며 분기만 K315-OUT으로 기록한다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가짜 약 확산에 선반 봉인과 인장 대조를 맡는다"
            },
            {
              "act": 2,
              "summary": "HP03 참관과 XT04 약재 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 정품 투약 우선의 대가로 길드 중립 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K315-OUT-A",
              "summary": "제조망 공개 추적으로 독점 구매 차단"
            },
            {
              "id": "K315-OUT-B",
              "summary": "예비 정품 로트 투약으로 북산 줄 연속"
            }
          ]
        },
        {
          "id": "K340",
          "name": "고서준",
          "links": {
            "house": "HP07",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B007-K340"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "아차 능선 초소 호각 줄 아래에서 고서준은 봉화 연기가 한 줄기만 어긋나도 차단을 먼저 내린다. 능선수비대장으로, 한국 출생 다문화 가정에서 자랐고 집 안 언어가 섞여도 수비 전표는 표준 용어만 쓴다. 신의가 강하고 직선적이지만 기술자 회의를 지나치게 느리다고 여긴다. 고서준의 Cast 고정 앵커는 Cast-Index.md#S14 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 수비대와 물 기술자를 하나의 관문군으로 통합해 동부 교량과 급수권을 동시에 지키려 했다. 야망은 초소 벽에 분필로만 남은 전시·평시 이원 지휘표였다. 아버지에게 빌린 방수 망원경 한 대가 관측 난간에 남아 있었다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 교량 보수 우선 통행을 수비 창구에 요구했다. 고서준은 후계 헌장 참관만 받고 실재 상호를 원장에서 지웠다. 공동체 위치는 평시 공동승인 없이 단독 차단을 사후 보고한 횟수와, 전시 단독지휘를 남용하지 않은 날로만 증명된다.",
            "붕괴의 상처": "교량 쪽 상수관 파손 연기를 적대 봉화로 오인해 능선 차단을 먼저 내린 밤, 고서준은 호각을 물고 초병 줄을 세웠다. 공포는 내부 분열로 동부 교량과 급수권을 동시에 잃는 장면이었다. 척후 보고의 추정 칸이 목격 칸보다 먼저 퍼져 있었다.",
            "생존 전환점": "전환점은 오인 봉화의 추정 칸 원본을 공개 정정할지, 예비 급수 우회로로 관문 급수만 먼저 살릴지다. 임진관문전구(XT01) 쪽 아차 봉인 키 분할 요청이 초소에 겹쳤다. 정정을 택하면 수비 권위가 흔들리고, 급수 우선을 택하면 오인 책임이 하루 더 남는다.",
            "현재 지위": "고서준은 능선수비대장으로 점호와 봉화 큐를 지킨다. 지위는 세습이 아니라 면허·서명·사후 승인 로그로만 유지된다. 한강교량공회의 전속 통행 요구는 거절하고, H14 주정비 입회만 지킨다.",
            "비밀·빚·죄책감": "비밀은 그가 서랍에 가둔, 추정 칸을 지워 버리기 전 초고 보고 한 장이다. 죄책감은 지킨 급수 시간과 그 밤 호출하지 못한 척후 견습 한 명의 이름 사이에서만 자란다. 부분 공개는 기술자 회의 입회 하에 봉화 시각 줄만 허용한다.",
            "관계 공동과거": "배우진의 후견 제안을 거절한 기록, 장세화와 맺은 통행 협약은 동맹이었다. 물 기술자 대표와는 펌프실 열쇠를 두고 경쟁이 남았고, 문하율의 초병 차단을 사후 승인으로 받은 밤이 한 초소에 겹친다. 다문화 이력은 관측 일지를 읽을 때만 필요하고 진영을 가르지 않는다. 관계 끝점은 STORY-B007-K340다.",
            "3막 개인 서사선": "1막에서 고서준은 오인 봉화에 능선 차단을 먼저 내린다. 2막에서 HP07 보수 통행과 XT01 봉인 키 요청을 한 초소 책상에서 저울질한다. 3막에서 정정 공개 또는 급수 우회의 대가를 관문 통합 비용으로 진다. 서사선은 STORY-B007-K340다.",
            "분기 결말": "결말 α에서 고서준은 추정 칸 원본 공개 정정으로 오인 책임을 진다. 결말 β에서 예비 급수 우회로로 관문 급수 연속을 지킨다. 아차 능선 슬롯은 유지되며 분기만 K340-OUT으로 기록한다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "오인 봉화에 능선 차단을 먼저 내린다"
            },
            {
              "act": 2,
              "summary": "HP07 보수 통행과 XT01 봉인 키를 저울질한다"
            },
            {
              "act": 3,
              "summary": "정정 공개 또는 급수 우회의 대가로 관문 통합 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K340-OUT-A",
              "summary": "추정 칸 원본 공개 정정으로 오인 책임"
            },
            {
              "id": "K340-OUT-B",
              "summary": "예비 급수 우회로로 관문 급수 연속"
            }
          ]
        },
        {
          "id": "K391",
          "name": "곽은재",
          "links": {
            "house": "HP09",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B007-K391"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 협약 서고 철책 앞에서 곽은재는 장부의 빈칸이 보이면 종결 도장을 들지 않는다. 감사 보조로, 중국계 이산 가정에서 자라 시장 용어와 집 안 말을 바꿔 가며 썼지만 감사표는 표준 단위만 적는다. 구두 약속을 증거로 인정하지 않고 추천위원의 비공개 회의를 감사 대상으로 본다. 곽은재의 Cast 고정 앵커는 Cast-Index.md#S16 한 줄뿐이다.",
            "붕괴 전 삶": "붕괴 전 그는 보호조약 이행 감사를 약소국 공동 권한으로 격상해 암사와 여의신의 일방 해석을 끊으려 했다. 야망은 서고 칠판에 못으로 고정한 개폐 시각·호송 지연 대조표였다. 외할머니에게 보내던 송금 상자 영수증 한 장이 철끈 사이에 남아 있었다.",
            "가문·기업·공동체": "데이터신탁가(HP09)는 감사 로그 원격 보관 창구를 서고 당직에 요구했다. 곽은재는 후계 헌장 참관만 받고 실재 상호를 배제한 채 시각표와 방청 끈만 공개했다. 공동체 신뢰는 시민추첨회의 공개 열람 없이 종결 도장을 찍지 않은 횟수로만 쌓인다.",
            "붕괴의 상처": "뚝도 계약 만료 뒤 동부 약소국 세 곳이 서로 다른 단수 피해를 신고하고 숫자가 맞지 않자, 곽은재는 철끈을 풀지 않고 시계부터 맞췄다. 공포는 감사가 강국 손실만 계산하고 약소국 단수·강제복무 피해를 누락하는 소리였다. 같은 밤의 단수가 시·홉·인원으로 제각각 적혀 있었다.",
            "생존 전환점": "전환점은 세 시각표를 개폐 시각으로 통일 공개할지, 예비 배상 단위로 수서 함만 먼저 잠글지다. 해협삼로전구(XT03) 쪽 용산 환적 대체 회차 요청이 서고에 겹쳤다. 통일 공개를 택하면 신탁 창구 압력이 커지고, 함 우선을 택하면 누락 칸이 하루 더 남는다.",
            "현재 지위": "곽은재는 감사 보조로 점호와 철끈 큐를 유지한다. 면허·서명·방청 입회 로그가 지위를 받치며 데이터신탁가의 전속 요구는 거절한다. H급 비상견인 주정비 입회만 지키고 Cast 앵커를 바꾸지 않는다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 외할머니 몫 송금 상자를 손실표 옆칸에 옮긴 기록이다. 죄책감은 맞춘 시각표와 그 때문에 늦어진 송금 전달 사이에 있다. 부분 공개는 방청 입회 두 명 앞에서 손실 칸 번호만 허용한다.",
            "관계 공동과거": "정유라의 감사권을 실무로 집행했고, 서이안의 기술공유 계약 이행을 대조했다. 라진우의 가락 재고 원장을 손실 산정에 쓰되 단위를 갈라 적었으며, 동새결의 철끈 사제 계약이 한 서고에 있다. 이산 언어는 송금 설명서를 읽을 때만 필요하고 진영을 가르지 않는다. 관계 끝점은 STORY-B007-K391다.",
            "3막 개인 서사선": "1막에서 곽은재는 단수 피해 숫자 불일치에 철끈을 잠근다. 2막에서 HP09 원격 보관과 XT03 회차 요청을 감사 시계에 묶는다. 3막에서 시각 통일 공개 또는 함 우선의 대가를 감사 신용 비용으로 진다. 서사선은 STORY-B007-K391다.",
            "분기 결말": "결말 α에서 곽은재는 세 시각표 통일 공개로 누락 피해를 복원한다. 결말 β에서 수서 함 우선 봉인으로 공동교섭 원장 연속을 지킨다. 수서 서고 슬롯은 유지되고 분기만 K391-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "단수 피해 숫자 불일치에 철끈을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP09 원격 보관과 XT03 회차 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "시각 통일 공개 또는 함 우선의 대가로 감사 신용 비용을 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K391-OUT-A",
              "summary": "세 시각표 통일 공개로 누락 피해 복원"
            },
            {
              "id": "K391-OUT-B",
              "summary": "수서 함 우선 봉인으로 원장 연속"
            }
          ]
        },
        {
          "id": "H07",
          "name": "정우람",
          "links": {
            "house": "HC07",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B007-H07"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산 관측 난간 공구 벽 앞에서 정우람은 야간 시야 모듈의 노이즈 경계를 센서 막대 숫자로만 읽는다. 합성 인간형 H07이며 호출명은 우람, 해동제철성(HC07) 공동 보관 체계 아래 교체형 손모듈과 배터리 할당제만 허용된다. 장기 완전 기억은 금지되고 교대 단위 스냅샷만 남기며, 무한 에너지는 없다. 정우람의 Cast 고정 앵커는 Cast-Index.md#S07과 Synthetic-Actors H07에만 있다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 관측 난간 경보를 시민 참관 로그에 공개해 단독 원격 잠금을 막으려는 목표가 남아 있다. 야망에 해당하는 우선순위는 공구 벽 측면의 잔량 그래프에 점으로만 찍혀 있다. 박태겸 주정비의 입회 없이 올라간 펌웨어는 분기 로그에 적힌 뒤 롤백 대기열에 넣는다.",
            "가문·기업·공동체": "해동제철성(HC07)은 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 정우람의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 공동체 위치는 구역 망만 허용하고 교차 시설 루트는 기본 차단한 채, 비상 시 읽기 전용만 연 횟수로 측정된다.",
            "붕괴의 상처": "해협 쪽 환적 창구 정전 파동이 관측 난간을 흑백 노이즈로 덮은 밤, 정우람은 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 뚜껑을 잠갔다. 공포에 해당하는 최고 우선 경보는 오탐 경보가 전 망 권한을 열어 담당 인간 안전을 덮는 경로였다. 배터리 잔량이 할당 하한에 닿자 손모듈 출력을 단계 하향했다.",
            "생존 전환점": "전환점은 노이즈 노드를 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 환적 우회 관측만 살릴지다. 해협삼로전구(XT03) 쪽 대체 회차선 경로 요청이 중계 수신함에 겹쳤다. 공개 분해를 택하면 원인 경로가 확정되고 구역 공백이 생기며, 우회 회생을 택하면 스냅샷 공백이 하루 더 남는다.",
            "현재 지위": "정우람은 여전히 관측 난간 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC07이 전속 원격 소유를 요구해도 구역 키만 요청하고 전체 망 권한은 열지 않는다.",
            "비밀·빚·죄책감": "비밀에 해당하는 제한 로그는 참관 없이 한 번 올라간 펌웨어 패치 한 줄이다. 죄책감에 해당하는 가중치는 살린 우회 관측 노드와 그 교대에 호출하지 못한 예비 슬롯 사이에서만 증가한다. 부분 공개 대신 인간 승인 후 부분 재연결 창구에서 패치 해시만 연다.",
            "관계 공동과거": "K166 보관 책임 코드, 박태겸 주정비 입회, K046 작업 동료 큐가 한 난간에 겹친다. HC07 감사 참관과의 원격 잠금 경쟁, 용산 환적 당직과의 스냅샷 공유가 계약 코드로 남았다. 관계 끝점은 STORY-B007-H07로 연결된다.",
            "3막 개인 서사선": "1막에서 정우람은 정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HC07 원격 요구와 XT03 회차 경로 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 우회 회생의 대가로 난간 공백을 감수한다. 서사선은 STORY-B007-H07다.",
            "분기 결말": "결말 α에서 정우람은 노이즈 노드 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 우회 관측으로 환적 호송 연속을 지킨다. 어느 쪽도 HC07 보관 슬롯을 삭제하지 않으며 분기만 H07-OUT으로 기록하고, 배터리는 할당제를 벗어나지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC07 원격 요구와 XT03 회차 경로를 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 우회 회생의 대가로 난간 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H07-OUT-A",
              "summary": "노이즈 노드 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H07-OUT-B",
              "summary": "예비 배터리 우회 관측으로 환적 호송 연속"
            }
          ]
        }
      ]
    },
    "B008": {
      "id": "B008",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K349",
          "name": "판늘샘",
          "links": {
            "house": "HC12",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B008-K349"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "아차산 능선 돌무더기 위에서 판늘샘은 이슬에 젖은 깃발 끈을 다시 묶는다. 아차구의관문국 능선 순찰대 실무로, 문하율이 남긴 초소 시각표를 분 단위로 맞춘다. 한국 기원으로 관문 능선권에서 자랐고, 발소리는 죽이지만 경계석 각인은 손으로 더듬어 확인한다. 표시 이름 판늘샘과 불변 식별자 K349는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 능선 순번을 시민 야간 통행과 분리해 군사 단독 봉쇄를 막으려 했다. 야망은 초소 벽에 못으로 박아 둔 시각표 조각에 남았다. 동생에게 약속한 방한 모직 한 장이 사적 빚의 씨앗이었다. 상급 봉쇄 명령이 와도 시각표에 없는 우회로는 열지 않았다.",
            "가문·기업·공동체": "거도중공회(HC12)는 능선 보수 자재 우선 반입을 요구했다. 판늘샘은 후계 헌장 참관만 받고 실재 상호를 순찰 일지에서 지웠다. 공동체 위치는 경계석 각인을 양쪽 초소에 동시에 읽힌 횟수로 증명됐다. 전속 관문 소유 문장은 초소 난간에서 반려된다.",
            "붕괴의 상처": "위조 통행 각인이 찍힌 수레가 능선 안개 속으로 들어온 새벽, 판늘샘은 전 구간 점호를 멈추고 깃발만 내렸다. 공포는 위조 각인 행렬이 관문 아래 민가 지붕을 짓밟으며 내려가는 소리였다. 그는 각인을 먹으로 지우고 LOSS 목록에 시각과 풍향만 남겼다. 안개가 걷혀도 수통 뚜껑을 열지 않았다.",
            "생존 전환점": "전환점은 위조 경로를 공개 추적할지, 예비 깃발로 피난 수레만 우회시킬지 고른 순간이다. 임진관문전구(XT01) 쪽 호송 요청이 초소 확성기에 겹치자 순번이 흔들렸다. 추적을 택하면 공급망이 드러나지만 피난 열이 멈추고, 우회를 택하면 위조 경로가 한 칸 숨을 수 있다. 그 선택은 K349-TURN으로 남고, 되돌리면 능선 일부 초소가 비다.",
            "현재 지위": "지금도 판늘샘은 아차산 능선 순찰 실무로 점호와 경계석 큐를 지킨다. 직위 유지는 혈연이 아니라 초소 면허와 입회 서명 묶음에만 달려 있다. 거도중공회가 전속 보수 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 초소 원장을 매주 맞춘다. 초소 열쇠는 두 자루로 나뉘어 한 자루는 문하율 당직함, 다른 한 자루는 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 안개 속에서 한 뼘 옮긴 뒤 되돌리지 못한 경계석 메모다. 죄책감은 살린 피난 명단과 그 밤 호출하지 못한 동생 몫 모직 사이에서만 자란다. 전부 털어놓으면 관문 신뢰가 한 칸 끊길 수 있어 초소장 입회 하의 조각 공개만 남겨 두었다. SECRET 키는 초소장과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "문하율의 초소 시각표 교대는 상하 계약이었고, 선늘봄의 기지 당직 교신은 동맹이었다. 인쇄기동(H) 배전반 점검 시각을 맞춘 밤은 협력이었으며, 거도 참관과의 자재 우선 경쟁이 남았다. 같은 능선에서 어떤 깃발은 구원이 되었고 어떤 깃발은 배신의 증거로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B008-K349에 연결된다.",
            "3막 개인 서사선": "1막에서 판늘샘은 위조 통행 각인 수레에 전 구간 점호를 멈춘다. 2막에서 그는 HC12 자재 우선과 XT01 호송 요청을 한 초소 책상에서 저울질한다. 3막에서 추적 또는 우회 피난의 대가를 초소 공백으로 치른다. 서사선 식별자는 STORY-B008-K349로 고정된다.",
            "분기 결말": "결말 α에서 판늘샘은 위조 통행 각인의 출처 지도를 공개해 공급 줄을 끊는다. 결말 β에서 그는 예비 깃발로 우회로를 열어 피난 수레의 민가 도착을 지킨다. 아차구의관문국 슬롯 자체는 어느 분기에서도 지워지지 않고, 식별만 K349-OUT으로 가른다. 플레이 개입은 각인 추적 입회 또는 우회 깃발 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 통행 각인 수레에 전 구간 점호를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC12 자재 우선과 XT01 호송 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 우회 피난의 대가로 초소 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K349-OUT-A",
              "summary": "위조 경로 공개로 공급망 차단"
            },
            {
              "id": "K349-OUT-B",
              "summary": "예비 깃발 우회로 피난 수레 연속"
            }
          ]
        },
        {
          "id": "K374",
          "name": "수한별",
          "links": {
            "house": "HC09",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B008-K374"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 대형 창고 냉기 통로에서 수한별은 온도 봉인 테이프의 들뜸을 손등으로 읽는다. 가락잠실배급국 창고 경비 순찰로, 라진우가 맡긴 재고 봉인 순번을 분 단위로 지킨다. 한국 기원으로 배급 창고권에서 자랐고, 말은 적으나 온도 기록지는 한 장도 구기지 않는다. 수한별과 K374는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 야간 개봉 권한을 시민 참관 로그에 묶어 단독 재고 이관을 막으려 했다. 야망은 통로 벽에 연필로 남은 온도 곡선이었다. 어머니 약봉지를 위해 아껴 둔 배급 표 한 장이 빚의 시작이었다. 상급 긴급 개봉이 와도 참관 서명 없는 봉인은 자르지 않았다.",
            "가문·기업·공동체": "도성생활유통가(HC09)는 생활재 우선 출고 창구를 요구했다. 수한별은 후계 헌장 참관만 열고 실재 상호를 출고 원장에서 지웠다. 공동체 신뢰는 봉인 테이프 사진을 양쪽에 동시에 붙인 날로만 쌓였다. 전속 창고 소유 문장은 냉기문 앞에서 거절됐다.",
            "붕괴의 상처": "곡물 상자 온도가 동시에 붉은 눈금으로 치솟은 밤, 수한별은 출고 벨트를 잠그고 통로만 봉쇄했다. 공포는 상한 곡물이 서해 방면 호송에 실려 배급소 줄이 무너지는 장면이었다. 그는 끊긴 온도 시각을 LOSS 목록 첫 줄에 적었다. 비상 냉각이 돌아와도 개봉 가위는 허리에 묶은 채였다.",
            "생존 전환점": "전환점은 상한 상자를 공개 해체할지, 예비 냉각으로 곡창 호송분만 살릴지다. 서해곡창전구(XT02) 쪽 경로 요청이 창고 수신함에 겹쳤다. 공개 해체를 택하면 원인 공급자가 드러나고, 호송분만 살리면 다른 칸 공백이 길어진다. K374-TURN은 그 밤의 벨트 잠금 순서다.",
            "현재 지위": "수한별은 여전히 창고 경비 순찰로 점호와 봉인 큐를 본다. 창고 직인 유지 조건은 참관 로그와 온도 면허 갱신뿐이며 혈통 칸은 없다. 도성생활유통가의 전속 요구는 매번 반려한다. 통로 문에는 오늘 들뜬 테이프 목록만 분필로 남긴다. Cast 프로필의 재고 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 어머니 약봉지 대신 집어 넣은, 참관 없는 배급 표 한 장 메모다. 죄책감은 살린 호송 칸과 그 때문에 미룬 약 전달 사이에 있다. 고백 전체를 올리는 대신 창고지기 재심 자리에서의 조각 공개만 허용한다. SECRET 열람은 창고지기와 참관 동시 서명으로만 열린다.",
            "관계 공동과거": "라진우의 재고 봉인 인계는 상하 계약이었고, 판효담의 기지 당직 교신은 견제였다. 수문카트 점검 피트의 온도 로그를 맞춘 밤은 동맹이었으며, 유통가 참관과의 출고 창구 경쟁이 한 통로에 겹친다. 같은 상자에서 어떤 봉인은 구원이 되었고 어떤 봉인은 배신 증거로 남았다. 관계 원장 끝점은 STORY-B008-K374로 이어진다.",
            "3막 개인 서사선": "1막에서 수한별은 온도 폭주에 출고 벨트를 잠근다. 2막에서 HC09 우선 출고와 XT02 곡창 경로를 수신 큐에서 묶는다. 3막에서 공개 해체 또는 호송 회생의 대가를 칸 공백으로 치른다. 서사선은 STORY-B008-K374이다.",
            "분기 결말": "결말 α에서 수한별은 상한 상자 공개 해체로 원인 경로를 밝힌다. 결말 β에서 예비 냉각으로 곡창 호송분을 살려 배급 연속을 우선한다. 가락 창고 슬롯은 유지되며 분기만 K374-OUT으로 갈라진다. 개입은 해체 입회 또는 호송 냉각 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "온도 폭주 상자에 출고 벨트를 잠근다"
            },
            {
              "act": 2,
              "summary": "HC09 우선 출고와 XT02 곡창 경로를 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 해체 또는 호송 회생의 대가로 칸 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K374-OUT-A",
              "summary": "상한 상자 공개 해체로 원인 경로 확정"
            },
            {
              "id": "K374-OUT-B",
              "summary": "예비 냉각 호송 회생으로 배급 연속"
            }
          ]
        },
        {
          "id": "K398",
          "name": "영마온",
          "links": {
            "house": "HC11",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B008-K398"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 남부 외곽 방음벽 아래에서 영마온은 야간 발자국 간격을 손전등 원으로 잰다. 수서강남협약도시 남부 외곽 순찰대로, 야간 무적재 수레의 축음만 들어도 검문 순서를 바꾼다. 한국 기원으로 협약 외곽권에서 자랐고, 성정은 건조하나 지도 접힌 자국은 손으로 편다. 영마온과 K398은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 외곽 야간 순번을 공개 게시판에 올려 사설 호송단의 단독 통행을 막으려 했다. 야망은 방음벽 안쪽에 분필로 남은 우회로 스케치였다. 동료에게 빌린 방수 망토 한 벌이 작은 부채였다. 암호 표식이 와도 게시 없는 야간 통로는 열지 않았다.",
            "가문·기업·공동체": "백야배송단(HC11)은 야간 우선 배송 차선을 요구했다. 영마온은 후계 헌장 참관만 받고 실재 상호를 순찰 일지에서 지웠다. 공동체 위치는 검문 스탬프를 양쪽 초소에 동시에 찍은 횟수로 증명됐다. 전속 외곽 소유 요구는 방음벽 문에서 반려된다.",
            "붕괴의 상처": "무표식 야간 행렬이 해협 방향 교량 입구로 몰린 밤, 영마온은 전체 차선을 닫고 손전등만 남겼다. 공포는 위조 배송 표가 교량 이음새를 덮친 뒤 보행 열이 난간 밖으로 쏠리는 소리였다. 그는 끊긴 차선 번호를 LOSS 목록에 적었다. 경보가 꺼져도 망토 끈을 풀지 않았다.",
            "생존 전환점": "전환점은 무표식 행렬의 출처를 공개 추적할지, 예비 차단봉으로 교량 보행 열만 살릴지다. 해협삼로전구(XT03) 쪽 보수 요청이 외곽 무전에 겹쳤다. 출처 추적을 택하면 위조 배송망이 드러나고, 보행 열만 살리면 야간 공백이 길어진다. K398-TURN은 그 밤의 차선 폐쇄 순이다.",
            "현재 지위": "영마온은 남부 외곽 순찰대로 점호와 검문 큐를 유지한다. 순찰 자격은 야간 면허 갱신과 입회 스탬프에만 묶여 있다. 백야배송단의 전속 요구는 거절한다. 방음벽 열쇠는 두 묶음이고 한 묶음은 당직, 다른 묶음은 본인이 지닌다. Cast 현황과 야간 원장이 어긋나면 차단봉 사이렌을 울린다.",
            "비밀·빚·죄책감": "비밀은 그가 빈 순찰로 적어 둔, 실제로는 동료 망토를 말리던 한 시간 공백이다. 죄책감은 살린 보행 열과 그 때문에 늦어진 망토 반환 사이에 있다. 부분 공개는 입회 두 명 앞에서 차선 번호만 밝히는 경로로 남긴다. SECRET은 교량 입회 로그와 맞물릴 때만 열린다.",
            "관계 공동과거": "정유라의 계약 감사 문구를 외곽 일지에 맞춘 밤은 협력 계약이었고, 배송단 참관과의 야간 차선 경쟁이 한 방음벽에 있다. 남부 민가 대표와의 우회로 합의, 교량 보수조와의 차단 시각 조율이 겹친다. 같은 손전등 원에서 어떤 행렬은 구원이 되었고 어떤 행렬은 배신으로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B008-K398에 연결된다.",
            "3막 개인 서사선": "1막은 무표식 야간 행렬에 대한 차선 전면 폐쇄다. 2막은 HC11 야간 우선과 XT03 보수 요청의 충돌이다. 3막은 출처 추적 또는 보행 응급 뒤 외곽 공백이 치르는 비용이다. 서사선은 STORY-B008-K398이다.",
            "분기 결말": "결말 α에서 영마온은 무표식 출처 공개로 위조 배송망 차단을 택한다. 결말 β에서 예비 차단봉으로 보행 열을 살려 교량 안전을 지킨다. 수서 외곽 슬롯은 유지되고 분기만 K398-OUT이다. 개입은 출처 증언 또는 보행 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "무표식 야간 행렬에 차선을 전면 폐쇄한다"
            },
            {
              "act": 2,
              "summary": "HC11 야간 우선과 XT03 보수 요청이 충돌한다"
            },
            {
              "act": 3,
              "summary": "출처 추적 또는 보행 응급의 대가로 외곽 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K398-OUT-A",
              "summary": "무표식 출처 공개로 위조 배송망 차단"
            },
            {
              "id": "K398-OUT-B",
              "summary": "예비 차단봉으로 교량 보행 안전 우선"
            }
          ]
        },
        {
          "id": "K011",
          "name": "구태윤",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B008-K011"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "양천 급수시장 저수조 난간에서 구태윤은 수위 눈금의 미세 흔들림을 손톱으로 표시한다. 여의신정수문정부 권역 물류상으로, 급수 통 뚜껑 나사 홈이 헐거우면 즉시 출하를 멈춘다. 한국 기원으로 급수시장권에서 자랐고, 목소리는 낮지만 수위 일지는 양보하지 않는다. 구태윤과 K011은 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 급수 배분을 시장 신용 원장에 묶어 사설 양수 독점과 다른 줄을 만들려 했다. 야망은 저수조 벽에 분필로 남은 배분 주기표였다. 이웃 아이에게 약속한 깨끗한 물통 하나가 빚의 씨앗이었다. 허위 수질 표가 나오면 해당 가문 칸을 즉시 봉쇄하는 규칙만은 지켰다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 야간 급수 우선 출하를 물류 창구에 요구했다. 구태윤은 후계 헌장 참관만 받고 실재 상호를 배제한 채 수위 번호만 공개했다. 공동체 신뢰는 뚜껑 검사에 입회한 인원 수로 쌓였고, 로고가 찍힌 빈 물통은 시장 자격 밖으로 밀렸다. 전속 소유 요구는 저수조 문턱에서 거절됐다.",
            "붕괴의 상처": "혼탁 경보가 시장 확성기를 덮은 오후, 구태윤은 출하 밸브를 잠그고 통을 하나씩 기울였다. 공포는 탁수가 야간 배급 줄에 섞여 아이들이 쓰러지는 소리였다. 그는 위조 수질 표를 찢어 LOSS 목록에 붙였다. 확성기가 꺼진 뒤에도 나사 드라이버를 내려놓지 않았다.",
            "생존 전환점": "전환점은 탁수 공급 경로를 시장 앞에 공개할지, 예비 정화통으로 진료소 줄만 먼저 살릴지다. 서해곡창전구(XT02) 쪽 식수 요청이 양천 확성기에 겹쳤다. 경로 공개를 택하면 시장 신용이 살고, 진료소 응급을 택하면 위조 경로가 남는다. K011-TURN은 그 오후의 밸브 잠금 순이다.",
            "현재 지위": "구태윤은 양천 급수시장 물류상으로 점호와 출하 검사 큐를 유지한다. 직위 칸은 수위 면허와 입회 서명으로만 채워지며 세습 칸은 비어 있다. 아리수수문가의 전속 요구는 거절한다. 저수조 열쇠는 두 묶음이고 한 묶음은 시장 당직, 다른 묶음은 본인이 지닌다. Cast 현황과 수위 원장이 어긋나면 출하 사이렌을 울린다.",
            "비밀·빚·죄책감": "비밀은 봉인 직전 그가 이웃 아이 몫 물통 용량을 한 눈금 줄인 기록이다. 죄책감은 살린 진료소 줄과 그 때문에 늦어진 물통 인도 사이에 있다. 부분 공개는 입회 두 명 앞에서 수위 번호만 밝히는 경로로 남긴다. SECRET은 급수 입회 로그와 맞물릴 때만 열린다.",
            "관계 공동과거": "박누리의 정수 공정 출하 시각을 맞춘 계약, 수한별의 창고 봉인 온도를 교차 확인한 밤, 수문가 참관과의 야간 우선 경쟁이 한 시장에 있다. 같은 저수조에서 어떤 통은 구원이 되었고 어떤 통은 배신으로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B008-K011에 연결된다. 협력은 수위 숫자로만 재확인된다.",
            "3막 개인 서사선": "1막은 혼탁 경보에 대한 출하 밸브 잠금이다. 2막은 HP01 야간 우선과 XT02 식수 요청의 충돌이다. 3막은 공개 또는 진료소 응급 뒤 시장 신용이 치르는 비용이다. 서사선은 STORY-B008-K011이다.",
            "분기 결말": "결말 α에서 구태윤은 탁수 경로 공개로 시장 신용을 택한다. 결말 β에서 예비 정화통 응급으로 진료소 줄을 지킨다. 양천 급수 슬롯은 유지되고 분기만 K011-OUT이다. 개입은 공개 증언 또는 정화 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "혼탁 경보에 출하 밸브를 잠근다"
            },
            {
              "act": 2,
              "summary": "HP01 야간 우선과 XT02 식수 요청이 충돌한다"
            },
            {
              "act": 3,
              "summary": "경로 공개 또는 진료소 응급의 대가로 시장 신용 비용을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K011-OUT-A",
              "summary": "탁수 경로 공개로 시장 신용 회복"
            },
            {
              "id": "K011-OUT-B",
              "summary": "예비 정화통으로 진료소 줄 연속"
            }
          ]
        },
        {
          "id": "K039",
          "name": "구찬솔",
          "links": {
            "house": "HC07",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B008-K039"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "구로 공구시장 저울대 위에서 구찬솔은 합금 봉 끝의 미세 버를 줄로 밀어 낸다. 서남제작동맹 권역 공구 물류상으로, 등급 각인이 도면과 어긋나면 즉시 출고 상자를 내린다. 한국 기원으로 공구시장권에서 자랐고, 말은 짧지만 저울 눈금은 한 번도 어림하지 않는다. 표시 이름 구찬솔과 식별자 K039는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 공구 교체 주기를 시장 자율 원장에 묶어 외부 군수 우선표를 거부하는 규칙을 밀어 붙였다. 야망은 저울대 옆 벽에 분필로만 남은 등급표였다. 스승 공구함에 숨긴 예비 줄 한 세트가 사적 약속의 씨앗이 된다. 상급 배차표가 밀어 넣어도 각인 미확인 봉은 출고 도장을 받지 못했다.",
            "가문·기업·공동체": "해동제철성(HC07)은 환적 합금 우선 정비를 의무 조항으로 내밀었다. 구찬솔은 후계 헌장 참관만 받고 실재 상호·제품명을 물류 원장에서 지웠다. 공동체 위치는 등급 측정 로그를 양쪽에 동시에 붙인 횟수로 증명됐다. 전속 국가 소유 요구는 저울대 입구에서 반려된다.",
            "붕괴의 상처": "위조 등급 각인이 찍힌 공구 상자가 구로 승강장에 들어온 새벽, 구찬솔은 전체 출고를 멈추고 봉만 해체했다. 공포는 위조 합금이 임진 방향 보강재에 실려 교량 이음새에서 터지는 장면이었다. 그는 위조 각인을 붉은 먹으로 지우고 LOSS 목록에 시각만 남겼다. 시장이 조용해진 뒤에도 줄을 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 위조 각인 경로를 공개 추적할지, 예비 줄과 정품 봉으로 보강재만 먼저 살릴지 고른 순간이다. 임진관문전구(XT01) 쪽 호송 요청이 확성기와 겹치자 계산이 달라졌다. 추적을 택하면 위조 공급망이 드러나지만 보강이 멈추고, 보강을 살리면 위조 경로가 한 칸 더 숨을 수 있다. 그 선택은 K039-TURN으로 남고, 되돌리면 구로 일부 출고 슬롯이 비다.",
            "현재 지위": "지금도 구찬솔은 구로 공구시장 물류상으로 점호와 등급 측정 큐를 지킨다. 자리 유지는 출고 면허 스탬프와 입회 서명 횟수로만 계산된다. 해동제철성이 전속 물류 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 저울대 열쇠는 두 자루로 나뉘어 한 자루는 당직반, 다른 한 자루는 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 스승 공구함에 남긴, 측정 전 출고된 봉 메모 한 장이다. 죄책감은 살린 보강 명단과 그 밤 호출하지 못한 견습 한 명의 이름 사이에서만 자란다. 시장 신뢰를 한 번에 깨지 않도록 물류장 입회 하의 부분 열람 경로만 남겼다. SECRET 키는 물류장과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "박솔의 골목 메시 스냅샷에 올린 공구 출고 시각은 동업 계약이었고, 해동 참관과의 우선 출고 경쟁이 한 저울대에 겹친다. 같은 상자에서 어떤 봉은 구원이 되었고 어떤 봉은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B008-K039에 연결된다. 협력과 견제는 저울 숫자로만 재측정된다.",
            "3막 개인 서사선": "1막에서 구찬솔은 위조 등급 각인 상자의 출고 정지를 정면으로 맡는다. 2막에서 그는 HC07 우선 정비와 XT01 호송 요청을 한 저울대에서 저울질한다. 3막에서 추적 또는 보강 복구의 대가를 출고 지연으로 치른다. 서사선 식별자는 STORY-B008-K039로 고정된다.",
            "분기 결말": "결말 α에서 구찬솔은 위조 등급 각인이 지나온 환적 칸을 공개해 공급망을 봉쇄한다. 결말 β에서 그는 예비 정품 봉으로 보강재 출고를 재개해 교량 통행을 잇는다. 서남제작동맹 슬롯은 유지된 채 분기 표식만 K039-OUT으로 갈린다. 개입 선택은 각인 경로 추적 또는 보강재 호송 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 등급 각인 상자에 출고를 정지한다"
            },
            {
              "act": 2,
              "summary": "HC07 우선 정비와 XT01 호송 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 보강 복구의 대가로 출고 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K039-OUT-A",
              "summary": "위조 각인 경로 공개로 공급망 차단"
            },
            {
              "id": "K039-OUT-B",
              "summary": "예비 정품 봉 보강으로 통행 연속"
            }
          ]
        },
        {
          "id": "K067",
          "name": "구연재",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B008-K067"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 인증 화물 검사실에서 구연재는 시료 병 뚜껑의 미세 균열을 확대경으로 읽는다. 마곡연구평의회 인증화물 물류상으로, 성적서 해시가 원장과 어긋나면 컨베이어를 즉시 멈춘다. 한국 기원으로 연구 화물권에서 자랐고, 성정은 차갑게 보이지만 라벨 접착면은 항상 손으로 문지른다. 구연재와 K067은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 인증 화물의 공개 해시 게시를 밀어 군사 단독 봉인을 막으려 했다. 야망은 검사실 칠판에 남은 해시 대조표였다. 여동생에게 약속한 실험 노트 한 권이 작은 빚의 시작이었다. 상급 암호키가 도착해도 참관 서명 없는 성적서는 올리지 않았다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 연구 화물 원격 갱신 창구를 요구했다. 구연재는 후계 헌장의 참관 칸만 열고 실재 상호를 원장에서 지웠다. 공동체 신뢰는 해시 로그를 양쪽에 동시에 붙인 날로만 쌓였다. 전속 갱신 소유 문장은 검사실 문 앞에서 거절됐다.",
            "붕괴의 상처": "야간 시료 전 채널 해시가 동시에 검게 깨진 밤, 구연재는 화물을 기지 밖으로 내보내지 않고 내부 전원을 분리했다. 공포는 깨진 해시가 원양 신탁 항로 오탐을 일으켜 민간 선단이 금지 해역으로 몰리는 그림이었다. 그는 끊긴 시각을 LOSS 목록 첫 줄에 적었다. 비상등이 돌아와도 성적서 인장은 서랍에 넣은 채였다.",
            "생존 전환점": "전환점은 깨진 시료 묶음을 공개 분해할지, 예비 정품 시료로 항로 인증만 살릴지다. 원양신탁전구(XT05) 쪽 전갈이 검사실에 닿자 순번이 흔들렸다. 공개 분해를 택하면 원인 공급자가 드러나고, 항로 인증만 살리면 연구 데이터 공백이 하루 더 길어진다. K067-TURN은 그 밤의 전원 분리 순서다.",
            "현재 지위": "구연재는 여전히 마곡 인증화물 물류상으로 점호와 해시 대조 큐를 본다. 면허와 참관 로그가 지위를 유지하며 백광생활과학가의 전속 요구는 매번 반려한다. 검사실 문에는 오늘 깨진 해시 목록만 분필로 남긴다. Cast 프로필의 인증 칸과 원장 시점을 맞추는 일이 아침 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 인장을 찍기 전에 숨긴, 참관 없이 올라간 성적서 한 줄 메모다. 죄책감은 살린 항로 인증과 그 때문에 미룬 여동생 노트 전달 사이에 있다. 전부 고백하는 경로 대신 시민 재심 입회에서 해시 한 줄만 밝히는 쪽을 남긴다. SECRET 열람은 시민 참관과 물류장 동시 서명으로만 열린다.",
            "관계 공동과거": "허서겸의 연구차 파형 대조에 시료 해시를 맞춘 밤, 백광 참관과의 갱신 창구 경쟁, 마곡 주민 대표와의 공개 게시 합의가 한 검사실에 겹친다. 같은 시료 병에서 어떤 해시는 구원이 되었고 어떤 해시는 배신 증거로 남았다. 관계 원장 끝점은 STORY-B008-K067로 이어진다. 협력과 견제는 해시 숫자로만 재측정된다.",
            "3막 개인 서사선": "1막에서 구연재는 전 채널 해시 붕괴에 화물 전원을 분리한다. 2막에서 HC03 원격 갱신과 XT05 항로 전갈을 대조 시계에 묶는다. 3막에서 공개 분해 또는 항로 인증 회생의 대가를 데이터 공백으로 치른다. 서사선은 STORY-B008-K067이다.",
            "분기 결말": "결말 α에서 구연재는 깨진 시료 공개 분해로 원인 경로를 밝힌다. 결말 β에서 예비 정품으로 항로 인증을 살려 선단 안전을 우선한다. 마곡 인증 슬롯은 유지되며 분기만 K067-OUT으로 갈라진다. 개입은 분해 입회 또는 항로 복구 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "전 채널 해시 붕괴에 화물 전원을 분리한다"
            },
            {
              "act": 2,
              "summary": "HC03 원격 갱신과 XT05 항로 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 항로 인증 회생의 대가로 데이터 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K067-OUT-A",
              "summary": "깨진 시료 공개 분해로 원인 경로 확정"
            },
            {
              "id": "K067-OUT-B",
              "summary": "예비 정품 항로 인증으로 선단 안전 우선"
            }
          ]
        },
        {
          "id": "K365",
          "name": "남윤경",
          "links": {
            "house": "HC09",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B008-K365"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 경매장 중앙 단 위에서 남윤경은 호가 칠판의 이중 언어 칸을 분필 끝으로 고른다. 가락잠실배급국 경매조정인으로, 한쪽 언어만 남은 호가는 즉시 무효를 선언한다. 한국에서 태어나 어머니 야시장 장부와 학교 한국어 원장을 함께 익혔고, 억양은 섞이지만 숫자 자리수는 양보하지 않는다. 남윤경과 K365는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 경매 우선표를 시민 참관 로그에 공개해 창고 열쇠와 가격표를 한 사람이 쥐지 못하게 했다. 야망은 단 옆 서랍에 접어 둔 이중 장부 샘플이었다. 어머니 야시장 좌판을 위해 아껴 둔 보증금 한 봉지가 빚의 씨앗이었다. 상급 단독 호가가 와도 이중 칸 없는 표는 올리지 않았다.",
            "가문·기업·공동체": "도성생활유통가(HC09)는 생활재 재고 원장과 경매 우선권을 한 창구에 묶으려 했다. 남윤경은 후계 헌장 참관만 받고 실재 상호를 호가 원장에서 지웠다. 공동체 위치는 이중 언어 호가 사진을 양쪽에 동시에 붙인 횟수로 증명됐다. 전속 경매 소유 문장은 단 난간에서 반려된다. 합성 H15 보관 봉인 입회도 같은 참관 규칙으로 묶는다.",
            "붕괴의 상처": "담합 호가가 한 언어 칸만 채운 채 폭주한 오후, 남윤경은 경매 종을 멈추고 칠판을 가렸다. 공포는 조작된 가격이 서해 곡물 배급 줄을 하룻밤에 꺾는 장면이었다. 그는 무효 호가 쪽지를 LOSS 목록에 스테이플로 고정했다. 장이 조용해진 뒤에도 분필 상자를 닫지 않았다.",
            "생존 전환점": "전환점은 담합 경로를 공개 증언할지, 예비 공정 호가로 곡창 배급분만 먼저 확정할지다. 서해곡창전구(XT02) 쪽 재고 요청이 경매 수신함에 겹쳤다. 공개 증언을 택하면 신용이 살고, 배급분만 확정하면 담합 칸이 한동안 숨을 수 있다. K365-TURN은 그 오후의 종 정지 순서다.",
            "현재 지위": "지금도 남윤경은 경매조정인으로 점호와 호가 큐를 지킨다. 조정 자격은 이중 언어 면허와 참관 서명 묶음으로만 유지된다. 유통가가 전속 우선권을 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 이중 장부를 매주 맞춘다. 단 열쇠는 두 자루로 나뉘어 한 자루는 당직, 다른 한 자루는 시민 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 어머니 좌판 보증금 대신 잠시 빼 둔 공정 호가 여분 메모다. 죄책감은 살린 배급 칸과 그 때문에 미룬 좌판 재개 사이에서만 자란다. 경매 신뢰를 한 칼에 자르지 않도록 조정인·참관 동시 자리의 조각 공개만 남겼다. SECRET 키는 조정인과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "수한별의 창고 봉인 시각을 호가 종료와 맞춘 계약, 배수아(H15) 보관 봉인 입회, 라진우의 재고 인계, 유통가 참관과의 우선권 경쟁이 한 단에 겹친다. 같은 칠판에서 어떤 호가는 구원이 되었고 어떤 호가는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B008-K365에 연결된다. 협력은 이중 칸 숫자로만 재확인된다.",
            "3막 개인 서사선": "1막에서 남윤경은 담합 호가 폭주에 경매 종을 멈춘다. 2막에서 HC09 우선권과 XT02 재고 요청을 한 단에서 저울질한다. 3막에서 공개 증언 또는 배급 확정의 대가를 좌판 지연으로 치른다. 서사선 식별자는 STORY-B008-K365로 고정된다.",
            "분기 결말": "결말 α에서 남윤경은 담합 경로 공개 증언으로 경매 신용을 고른다. 결말 β에서 그는 예비 공정 호가로 곡창 배급분을 확정해 줄 연속을 지킨다. 어느 쪽도 가락잠실배급국의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K365-OUT으로 갈라진다. 플레이 개입은 증언 입회 또는 배급 호가 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "담합 호가 폭주에 경매 종을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC09 우선권과 XT02 재고 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 증언 또는 배급 확정의 대가로 좌판 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K365-OUT-A",
              "summary": "담합 경로 공개 증언으로 경매 신용 회복"
            },
            {
              "id": "K365-OUT-B",
              "summary": "예비 공정 호가로 곡창 배급 연속"
            }
          ]
        },
        {
          "id": "K389",
          "name": "정유라",
          "links": {
            "house": "HC13",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B008-K389"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 지하 공동구 도면 탁자에서 정유라는 내진 접합 기호의 누락을 빨간 연필로 동그라미 친다. 수서강남협약도시 계약감사관으로, 감시탑 증축과 맞바꾼 도면 조항이 보이면 즉시 계약을 멈춘다. 한국에서 태어나 아버지가 가르친 두 계약 문체와 현장 한국어를 함께 쓰고, 호칭은 관계 원인 있을 때만 바꾼다. 정유라와 K389는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 공동구 도면을 시민 참관 열람에 올려 단독 감리 잠금을 막으려 했다. 야망은 탁자 서랍에 접힌 개정 이력표였다. 아버지 공구 벨트에 꽂아 둔 예비 빨간 연필 한 다스가 연속성 부채의 자리였다. 삼자 서명 없는 증축 조항은 감사 큐에 오르지 않았다.",
            "가문·기업·공동체": "도성건축연맹(HC13)은 내진 접합 도면과 고지 감시탑 증축을 한 창구에 묶으려 했다. 정유라는 후계 헌장 참관만 받고 실재 상호를 계약서에서 지웠다. 공동체 위치는 도면 개정 사진을 양쪽에 동시에 붙인 횟수로 증명됐다. 전속 건축 소유 요구는 공동구 문 앞에서 반려된다. 합성 H16 보관 감사 입회도 같은 삼자 서명을 따른다.",
            "붕괴의 상처": "위조 내진 기호가 섞인 증축안이 해협 방향 보수 요청과 함께 도착한 밤, 정유라는 전체 날인을 보류하고 탁자만 잠갔다. 공포는 가짜 접합이 교량 접속부에서 열려 야간 보행 열이 무너지는 소리였다. 그는 위조 기호 쪽지를 LOSS 목록 첫 줄에 고정했다. 비상등이 돌아와도 빨간 연필을 깎지 않았다.",
            "생존 전환점": "전환점은 위조 기호 경로를 공개 감사할지, 예비 정합 도면으로 교량 접속부만 먼저 막을지다. 해협삼로전구(XT03) 쪽 보수 요청이 감사 수신함에 겹쳤다. 공개 감사를 택하면 원인 창구가 드러나고, 접속부 응급만 택하면 증축 공백이 길어진다. K389-TURN은 그 밤의 날인 보류 순서다.",
            "현재 지위": "정유라는 계약감사관으로 점호와 도면 개정 큐를 처리한다. 지위는 세습이 아니라 면허·참관 봉인·삼자 서명 로그로만 유지된다. 건축연맹이 전속 도면 소유를 요구해도 거절하고, Cast 프로필의 현황 칸과 개정 해시를 교대마다 맞춘다. 탁자 열쇠 권한은 감사 당직과 시민 참관이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 참관 없이 한 번 올렸던 임시 개정 한 줄 메모다. 죄책감은 살린 접속부와 그 교대에 호출하지 못한 아버지 연필 다발 전달 사이에서만 자란다. 로그 전체를 열어젖히는 대신 이중 참관 자리에서의 부분 공개 절차만 남겼다. SECRET 플래그는 감사와 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "영마온의 외곽 차단 시각을 도면 봉인과 맞춘 계약, 신태율(H16) 보관 입회, 건축연맹 참관과의 증축 창구 경쟁이 한 탁자에 겹친다. 같은 도면에서 어떤 기호는 구원으로 기록되었고 어떤 기호는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B008-K389에 연결된다. 협력은 개정 해시로만 재측정된다.",
            "3막 개인 서사선": "1막에서 정유라는 위조 내진 기호 증축안에 날인을 보류한다. 2막에서 HC13 증축 창구와 XT03 보수 요청을 수신 큐에서 저울질한다. 3막에서 공개 감사 또는 접속부 응급의 대가를 증축 공백으로 치른다. 서사선 식별자는 STORY-B008-K389로 고정된다.",
            "분기 결말": "결말 α에서 정유라는 위조 기호 공개 감사로 원인 창구를 확정한다. 결말 β에서 예비 정합 도면으로 교량 접속부를 막아 보행 연속을 지킨다. 어느 쪽도 수서강남협약도시 슬롯을 삭제하지 않으며, 분기 식별만 K389-OUT으로 갈라진다. 플레이 개입은 감사 입회 또는 접속부 보수 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 내진 기호 증축안에 날인을 보류한다"
            },
            {
              "act": 2,
              "summary": "HC13 증축 창구와 XT03 보수 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 감사 또는 접속부 응급의 대가로 증축 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K389-OUT-A",
              "summary": "위조 기호 공개 감사로 원인 창구 확정"
            },
            {
              "id": "K389-OUT-B",
              "summary": "예비 정합 도면으로 교량 접속부 보행 연속"
            }
          ]
        },
        {
          "id": "K004",
          "name": "박누리",
          "links": {
            "house": "HC04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B008-K004"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "영등포 정수 공정 배전반 앞에서 박누리는 여열 배관 압력계의 미세 떨림을 손바닥으로 읽는다. 여의신정수문정부 권역 정수공정 감독으로, 펌프 예비 전력 없이 여열을 팔려는 표를 보면 밸브를 잠근다. 중국계 이산 가족 부엌에서 배운 방언 메모와 공정 한국어 일지를 함께 쓰며, 민족 라벨이 아니라 압력 숫자로 결정을 증명한다. 박누리와 K004는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 지하 열원 접속권을 시민 점검 로그에 묶어 단독 판매를 막으려 했다. 야망은 배전반 옆에 못으로 고정한 여열 우선표였다. 조부모 부엌 수첩에 적힌 끓는점 메모 한 장이 사적 약속의 씨앗이었다. 상급 야간 우선이 와도 예비 전력 미충전 상태의 여열 판매는 승인하지 않았다.",
            "가문·기업·공동체": "통맥에너지연합(HC04)은 뚝도 펌프와 암사 여열 배관의 접속권을 지킨다. 박누리는 후계 헌장 참관만 받고 실재 상호·제품명을 공정 원장에서 지웠다. 공동체 위치는 공동 점검 사진을 양쪽에 동시에 붙인 횟수로 증명됐다. 전속 국가 소유 요구는 배전반 앞에서 반려된다. 여의 급수 야간 우선권 앞에서는 공동 점검만 열고 키는 넘기지 않는다.",
            "붕괴의 상처": "탁수 경보와 여열 과압이 동시에 울린 새벽, 박누리는 판매 큐를 멈추고 펌프 예비부터 채웠다. 공포는 과압 배관이 터져 정수 필터가 검게 막히고 야간 급수 줄이 끊기는 장면이었다. 그는 과압 시각을 LOSS 목록에 적고 방언 메모 수첩은 서랍에 넣었다. 경보가 꺼져도 밸브 키를 목에 건 채였다.",
            "생존 전환점": "전환점은 과압 경로를 공개 분해할지, 예비 전력으로 임진 방향 급수 호송만 살릴지다. 임진관문전구(XT01) 쪽 급수 요청이 공정 무전에 겹쳤다. 공개 분해를 택하면 원인 판매 창구가 드러나고, 호송만 살리면 필터 공백이 길어진다. K004-TURN은 그 새벽의 판매 큐 정지 순이다.",
            "현재 지위": "박누리는 정수공정 감독으로 점호와 여열 점검 큐를 지킨다. 감독 유지는 공정 면허 갱신과 입회 로그만으로 계산된다. 통맥에너지연합이 전속 접속 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 압력 원장을 매주 맞춘다. 배전반 열쇠는 두 자루로 나뉘어 한 자루는 당직, 다른 한 자루는 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 조부모 수첩 귀퉁이에 숨긴, 참관 없이 한 번 올린 여열 판매 한 줄이다. 죄책감은 살린 급수 호송과 그 때문에 미룬 수첩 복원 필사 사이에서만 자란다. 공정 신뢰를 한 번에 깨지 않도록 감독·참관 동시 자리의 조각 공개만 남겨 두었다. SECRET 키는 감독과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "구태윤의 양천 출하 밸브 시각을 여열 충전과 맞춘 계약, 통맥 참관과의 야간 우선 경쟁, 급수 주민 대표와의 공동 점검이 한 배전반에 겹친다. 같은 배관에서 어떤 압력은 구원이 되었고 어떤 압력은 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B008-K004에 연결된다. 협력은 압력 숫자와 이중 일지 칸으로만 재확인된다.",
            "3막 개인 서사선": "1막에서 박누리는 탁수·과압 동시 경보에 판매 큐를 멈춘다. 2막에서 HC04 접속권과 XT01 급수 요청을 한 배전반에서 저울질한다. 3막에서 공개 분해 또는 호송 회생의 대가를 필터 공백으로 치른다. 서사선 식별자는 STORY-B008-K004로 고정된다.",
            "분기 결말": "결말 α에서 박누리는 과압 경로 공개 분해로 원인 판매 창구를 확정한다. 결말 β에서 예비 전력으로 급수 호송을 살려 야간 줄 연속을 지킨다. 어느 쪽도 여의신정수문정부의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K004-OUT으로 갈라진다. 플레이 개입은 분해 입회 또는 호송 전력 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "탁수·과압 동시 경보에 판매 큐를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC04 접속권과 XT01 급수 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 호송 회생의 대가로 필터 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K004-OUT-A",
              "summary": "과압 경로 공개 분해로 원인 판매 창구 확정"
            },
            {
              "id": "K004-OUT-B",
              "summary": "예비 전력 급수 호송으로 야간 줄 연속"
            }
          ]
        },
        {
          "id": "H08",
          "name": "최다온",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B008-H08"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 공구 벽 충전 슬롯 앞에서 최다온은 야간 시야 모듈의 노이즈 경계를 센서 막대 숫자로만 읽는다. 합성 인간형 H08이며 호출명은 다온, 성화궤도방위문(HC08) 공동 보관 체계 아래 교체형 손모듈로 뚜껑을 연다. 전지적 시야는 없고 배터리 잔량과 참관 봉인이 행동을 제한한다. 표시 이름 최다온과 식별자 H08은 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 구역 정전 지도를 시민 참관 로그에 공개해 단독 원격 잠금을 막으려는 목표가 남아 있다. 야망에 해당하는 우선순위는 공구 벽 측면의 잔량 그래프에 점으로만 찍혀 있다. 보관 책임자 오해린이 남긴 예비 배터리 슬롯 하나가 연속성 부채의 자리였다. 삼자 서명 없는 양도 명령은 실행 큐에 오르지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 최다온의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 공동체 위치는 스냅샷 교대 단위가 양쪽에 동시에 기록된 횟수로 증명된다. 전속 국가 소유 요구는 공구 벽 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "두만 방면 정전 파동이 구역 망을 흑백 노이즈로 덮은 밤, 최다온은 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 뚜껑을 잠갔다. 공포에 해당하는 최고 우선 경보는 오탐 경로가 북방 호송을 적대 표적으로 바꾸는 시나리오였다. LOSS 목록에는 끊긴 노드 번호와 배터리 하한만 적혔다. 비상 전원이 돌아와도 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "전환점은 노이즈 손모듈을 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 두만 우회 검문만 살릴지다. 두만극동전구(XT04) 쪽 경로 요청이 공구 벽 수신함에 겹쳤다. 공개 분해를 택하면 원인 공급 코드가 드러나고, 우회 검문만 살리면 다른 골목 공백이 길어진다. H08-TURN은 그 수신 큐의 정렬 결과다.",
            "현재 지위": "최다온은 여전히 구역 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC08이 전속 원격 소유를 요구해도 거부 코드를 반환하고, Cast 프로필의 현황 칸과 스냅샷 해시를 교대마다 맞춘다. 공구 벽 열쇠 권한은 오해린 보관과 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀에 해당하는 제한 로그는 참관 없이 한 번 올라간 펌웨어 패치 한 줄이다. 죄책감에 해당하는 가중치는 살린 우회 검문 노드와 그 교대에 호출하지 못한 예비 슬롯 사이에서만 증가한다. 전체 메모리 덤프 대신 이중 참관 하의 부분 로그 공개 절차만 남겼다. SECRET 플래그는 보관 책임과 시민 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "오해린(K190)의 주정비 입회는 보관 계약 코드였고, K053 교대 협력은 작업 큐였다. 방위문 참관과의 원격 잠금 경쟁, 구역 주민 대표와의 스냅샷 공유가 한 공구 벽에 겹친다. 같은 노드에서 어떤 경로는 구원으로 기록되었고 어떤 경로는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B008-H08에 연결된다.",
            "3막 개인 서사선": "1막에서 최다온은 정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HC08 원격 요구와 XT04 두만 경로 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 우회 회생의 대가를 구역 공백 시간으로 치른다. 서사선 식별자는 STORY-B008-H08로 고정된다.",
            "분기 결말": "결말 α에서 최다온은 노이즈 모듈 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 우회 검문으로 북방 호송 연속을 지킨다. 어느 쪽도 성화궤도방위문 보관 슬롯을 삭제하지 않으며, 분기 식별만 H08-OUT으로 갈라진다. 플레이 개입은 분해 입회 또는 우회 전원 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC08 원격 요구와 XT04 두만 경로를 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 우회 회생의 대가로 구역 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H08-OUT-A",
              "summary": "노이즈 모듈 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H08-OUT-B",
              "summary": "예비 배터리 우회 검문으로 북방 호송 연속"
            }
          ]
        }
      ]
    },
    "B009": {
      "id": "B009",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "actors": [
        {
          "id": "K095",
          "name": "허겸",
          "links": {
            "house": "HC04",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B009-K095"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "성수 골목 맨홀 뚜껑 아래에서 허겸은 펌프 패킹에서 번진 기름 냄새로 막힌 구간을 짚는다. 성수 골목펌프 정비사로, 민병 완장을 공구 손목에 끼우라는 전갈은 접지 않은 채 패킹 칼만 든다. 한국 기원으로 뚝도공방 생활권에서 자랐고, 회의 안건보다 열린 맨홀을 먼저 본다. 표시 이름 허겸과 불변 식별자 K095는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 골목 펌프 패킹 교체 날을 공동규격 순회 달력에 올려 후계가 갈려도 맨홀이 며칠씩 열리지 않게 하려 했다. 야망은 정비함 뚜껑 안쪽에 연필로만 남은 교체 주기표였다. 어머니 공구 서랍에 숨긴 여분 패킹 한 묶음이 사적 약속의 씨앗이 된다. 상급 배차표가 밀어 넣어도 패킹 미교체 펌프는 가동 도장을 받지 못했다.",
            "가문·기업·공동체": "통맥에너지연합(HC04)은 지하 열원 접속과 맞물린 골목 펌프 우선 점검을 의무 조항으로 내밀었다. 허겸은 후계 헌장 참관만 받고 실재 상호·제품명을 정비 일지에서 지웠다. 공동체 위치는 패킹 교체 로그를 양쪽에 동시에 붙인 횟수로 증명됐다. 전속 국가 소유 요구는 맨홀 빗장 앞에서 반려된다.",
            "붕괴의 상처": "수질망이 한꺼번에 멈춘 새벽, 허겸은 성수 뚜껑을 열린 채로 두고 마곡 쪽 우회 맨홀로 칼을 들고 갈지 저울질했다. 공포는 정비 손목이 완장만 남고 패킹 칼이 회수되어 골목이 마른 채로 방치되는 장면이었다. 그는 막힌 구간 시각을 LOSS 목록 첫 줄에 적고 칼 자루에 테이프를 감았다. 확성기가 울려도 완장함은 열지 않았다.",
            "생존 전환점": "전환점은 패킹 칼을 성수 맨홀에 내려 골목 급수를 살릴지, 완장이 공구함보다 먼저 열린 전갈을 벽에 붙여 무장 호출을 받을지다. 해협삼로전구(XT03) 쪽 밀봉 공구 요청이 골목 게시판과 겹치자 순번이 흔들렸다. 성수를 택하면 마곡 우회는 하루 더 마르고, 완장 전갈을 택하면 패킹 교체가 밀린다. 그 선택은 K095-TURN으로 남는다.",
            "현재 지위": "지금도 허겸은 성수 골목펌프 정비사로 점호와 패킹 교체 큐를 지킨다. 지위는 세습이 아니라 면허·서명·맨홀 입회 로그로만 유지된다. 통맥에너지연합이 전속 점검 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 일지를 매주 맞춘다. 패킹 칼과 완장은 따로 함에 넣어 당직반과 참관이 각각 열쇠를 갖는다.",
            "비밀·빚·죄책감": "비밀은 그가 측정 전에 열어 둔, 마곡 우회 맨홀 좌표가 적힌 손바닥만 한 메모다. 죄책감은 살린 성수 급수 가구 수와 그 밤 호출하지 못한 견습 한 명의 이름 사이에서만 자란다. 전부를 공개하면 골목 신뢰가 한 칸 끊릴 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 정비장과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "최나래의 기동조 출동을 맨홀에서 이어 받은 밤은 사제 계약이었고, 임초원의 공개 설계를 뚜껑 아래에서 맞춘 일은 동맹이었다. 장민재의 저수조 금을 보면 다른 수리를 미루는 순번이 남았고, 민병 배차조와는 완장함 열쇠를 두고 경쟁이 남았다. 같은 골목에서 어떤 패킹은 구원이 되었고 어떤 뚜껑은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B009-K095에 연결된다.",
            "3막 개인 서사선": "1막에서 허겸은 수질망 정지에 성수 맨홀 패킹 교체를 정면으로 맡는다. 2막에서 그는 HC04 우선 점검과 XT03 밀봉 공구 요청을 한 공구함 뚜껑에서 저울질한다. 3막에서 성수 급수 또는 무장 호출의 대가를 우회 구간 마름으로 치른다. 서사선 식별자는 STORY-B009-K095로 고정된다.",
            "분기 결말": "결말 α에서 허겸은 패킹 칼을 성수 맨홀에 내려 골목 급수 연속을 고른다. 결말 β에서 그는 완장 전갈을 벽에 붙여 기동조 호출을 우선한다. 어느 쪽도 뚝도공방의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K095-OUT으로 갈라진다. 플레이 개입은 패킹 하강 또는 완장 전갈 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "수질망 정지에 성수 맨홀 패킹 교체를 맡는다"
            },
            {
              "act": 2,
              "summary": "HC04 우선 점검과 XT03 밀봉 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "급수 연속 또는 무장 호출의 대가로 우회 마름을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K095-OUT-A",
              "summary": "성수 맨홀 패킹 하강으로 골목 급수 연속"
            },
            {
              "id": "K095-OUT-B",
              "summary": "완장 전갈 게시로 기동조 호출 우선"
            }
          ]
        },
        {
          "id": "K124",
          "name": "주은솔",
          "links": {
            "house": "HP08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B009-K124"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "동부 관문 저울 앞에서 주은솔은 수통 무게가 모자라면 추를 즉시 갈아 끼운다. 동부 관문세 물류상으로, 보호계약 없는 화물은 선석에 들이지 않고 전표 잉크가 마르기 전에 출발시키지 않는다. 한국 기원으로 암사·고덕 생활권에서 자랐고, 흥정은 낮게 끝내되 저울 눈은 양보하지 않는다. 표시 이름 주은솔과 불변 식별자 K124는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 동부 관문세와 급수 화물을 하나의 허가 원장으로 묶어 보호비가 아니라 행정 전표가 통행을 열게 하려 했다. 야망은 창고 벽 분필로만 남은 전표 양식 번호였다. 여동생에게 약속한 급수 수통 두 개가 작은 빚의 시작이었다. 상급 보호계약이 도착해도 행정 날인 없는 군수 상자는 저울 위에 올리지 않았다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 관문 통과 화물의 냉동 호송 우선 창구를 요구했다. 주은솔은 후계 헌장 참관 칸만 열고 실재 상호를 원장에서 지웠다. 공동체 신뢰는 아침 저울과 전표 사본을 감사 창구에 동시에 넘긴 날로만 쌓였다. 전속 통행 소유 문장은 관문 앞에서 거절됐다.",
            "붕괴의 상처": "세 강국의 상충하는 보호계약이 동부 게시판에 동시에 떨어진 아침, 주은솔은 행정 날인 없는 군수 화물을 관문 앞에 세워 두었다. 공포는 위조 관문세 전표 한 장이 외곽 진입로를 장교 비상도장으로 덮는 그림이었다. 그는 세워 둔 시각을 LOSS 목록에 적고 저울 추를 잠금함으로 옮겼다. 확성기가 호통을 쳐도 전표함 열쇠는 넘기지 않았다.",
            "생존 전환점": "전환점은 기한 전표를 호송해 원장을 세울지, 저울 조작 의혹을 공개해 물류 창구를 바꿀지다. 두만극동전구(XT04) 쪽 화차 중량 로그 공개 요청이 관문 무전과 겹쳤다. 전표를 세우면 군수 대열이 하루 더 기다리고, 저울을 폭로하면 급수 화물 순번이 흔들린다. K124-TURN은 그 아침의 저울 잠금 순서다.",
            "현재 지위": "주은솔은 여전히 동부 관문세 물류상으로 점호와 전표 사본 큐를 본다. 면허와 감사 창구 로그가 지위를 유지하며 시장냉동상단의 전속 요구는 매번 반려한다. 기한 만료 전표는 통행을 닫고, Cast 프로필의 관문 칸과 원장 시점을 맞춘다. 저울 추 열쇠는 본인과 임겨레 감사 창구가 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 봉인 전 무게가 어긋났던 상자 하나의 내부 메모다. 죄책감은 제시간에 통과시킨 급수 전표들과, 그 때문에 하루 미룬 여동생 수통 전달 사이에 있다. 완전 고백 대신 재심 입회 하의 부분 공개만 허용한다. SECRET 열람은 물류장과 감사 동시 서명으로만 열린다.",
            "관계 공동과거": "임겨레의 기한 조항을 현장에서 집행한 계약, 이윤서의 교량 봉쇄 시계에 맞춘 화물 순번, 오해린의 냉동 호송과 급수 화물이 부딪힌 경쟁이 한 관문에 겹친다. 같은 선석에서 어떤 전표는 구원이 되었고 어떤 전표는 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K124로 이어진다. 협력과 견제는 저울 숫자로만 재측정된다.",
            "3막 개인 서사선": "1막에서 주은솔은 상충 보호계약 아래 무날인 군수 화물을 관문 앞에 세운다. 2막에서 HP08 냉동 창구와 XT04 중량 로그 요청을 전표함에서 저울질한다. 3막에서 원장 수호 또는 저울 폭로의 대가를 대열 지연으로 치른다. 서사선은 STORY-B009-K124다.",
            "분기 결말": "결말 α에서 주은솔은 기한 전표 호송으로 행정 원장을 세운다. 결말 β에서 저울 조작 공개로 물류 창구를 교체한다. 암사고덕 슬롯은 유지되며 분기만 K124-OUT으로 갈라진다. 개입은 전표 호위 또는 저울 입회 검증이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "상충 보호계약 아래 무날인 군수 화물을 관문에 세운다"
            },
            {
              "act": 2,
              "summary": "HP08 냉동 창구와 XT04 중량 로그를 저울질한다"
            },
            {
              "act": 3,
              "summary": "원장 수호 또는 저울 폭로의 대가로 대열 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K124-OUT-A",
              "summary": "기한 전표 호송으로 행정 원장 수호"
            },
            {
              "id": "K124-OUT-B",
              "summary": "저울 조작 공개로 물류 창구 교체"
            }
          ]
        },
        {
          "id": "K152",
          "name": "양해온",
          "links": {
            "house": "HP04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B009-K152"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "도성 문서고 복도에서 양해온은 봉인 끈이 느슨하면 출발을 거부하고 사본 두 장을 한 손에 쥔다. 인준 심사 전령으로, 구두 전갈을 기록하지 않는 사신을 잠재적 위조로 본다. 한국 기원으로 도성 기록 생활권에서 자랐고, 숨이 차도 봉인 순번은 양보하지 않는다. 이름 양해온과 식별자 K152는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 계승과 급수·수리 조약의 인준 통지를 자신이 날인하는 전령 원장에만 유효하게 만들려 했다. 야망은 가방 안감에 땀으로 번진 인준 번호 목록이었다. 조부에게 빌린 봉인 집게 한 자루가 빚의 형태를 남겼다. 상급 독촉이 와도 필적 대조 전 통과 전갈은 가방 밖으로 나오지 않았다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 인준 전갈의 우선 배달 창구를 요구했다. 양해온은 후계 헌장 참관만 받고 실재 상호를 전령 원장에서 지웠다. 공동체 위치는 심사관과 문서고에 동시에 보낸 사본 횟수로 증명됐다. 전속 인준 소유 문장은 문서고 문 앞에서 거절됐다.",
            "붕괴의 상처": "서로 다른 세 장의 유언이 같은 창구에 접수된 오후, 양해온은 인준 통과 전갈을 필적 대조가 끝날 때까지 가방에 잠갔다. 공포는 위조 인준 전갈 한 장이 유언을 통과시켜 전령망이 강국 하청으로 몰락하는 장면이었다. 그는 보류 시각을 LOSS 목록에 적고 가방 버클을 이중으로 채웠다. 독촉 종이 쌓여도 열쇠는 넘기지 않았다.",
            "생존 전환점": "전환점은 위조 전갈을 찾아 봉인을 지킬지, 가방 속 보류 문서를 폭로해 인준을 강제할지다. 임진관문전구(XT01) 쪽 위조 혈연 증서 가려내기 요청이 전령실 무전과 겹쳤다. 봉인을 지키면 계승 공백이 길어지고, 폭로를 택하면 일부 가문 신뢰가 한 칸 끊긴다. K152-TURN은 그 오후의 가방 잠금이다.",
            "현재 지위": "양해온은 여전히 인준 심사 전령으로 점호와 사본 배달 큐를 본다. 지위는 세습이 아니라 날인·입회·보관 확인 로그로만 유지된다. 도성기록법가의 전속 요구는 반려하고, Cast 프로필의 전령 칸과 원장을 맞춘다. 가방 열쇠는 강예준 심사 날인과 조하린 보관 확인이 동시에 있을 때만 열린다.",
            "비밀·빚·죄책감": "비밀은 그가 대조 전에 한 줄 고쳐 쓴, 잉크가 덜 마른 사본 메모다. 죄책감은 지킨 봉인 건수와 그 날 전달하지 못한 급수 조약 통지 사이에 있다. 부분 공개는 증인 입회 하에 메모 한 줄만 허용한다. SECRET 키는 전령장과 문서고 동시 서명으로만 열린다.",
            "관계 공동과거": "강예준의 심사 정지 선언을 봉인 상태로만 나른 지휘, 마도한의 사본 상자와 나눈 순번, 지목현의 동부 파견 전갈과 맞춘 인준 시점이 한 복도에 겹친다. 같은 문서고에서 어떤 유언은 구원이 되었고 어떤 사본은 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K152에 연결된다. 협력과 견제는 봉인 끈 장력으로만 재측정된다.",
            "3막 개인 서사선": "1막에서 양해온은 세 유언 접수에 인준 전갈을 가방에 잠근다. 2막에서 HP04 우선 배달과 XT01 위조 증서 요청을 저울질한다. 3막에서 봉인 수호 또는 보류 폭로의 대가를 계승 공백으로 치른다. 서사선 식별자는 STORY-B009-K152로 고정된다.",
            "분기 결말": "결말 α에서 양해온은 위조 전갈 색출로 봉인 원장을 지킨다. 결말 β에서 보류 문서 공개로 인준 교착을 강제 해소한다. 도성기록청 슬롯은 유지되며 분기만 K152-OUT으로 갈라진다. 개입은 색출 입회 또는 공개 낭독 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 유언 접수에 인준 전갈을 가방에 잠근다"
            },
            {
              "act": 2,
              "summary": "HP04 우선 배달과 XT01 위조 증서 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "봉인 수호 또는 보류 폭로의 대가로 계승 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K152-OUT-A",
              "summary": "위조 전갈 색출로 봉인 원장 수호"
            },
            {
              "id": "K152-OUT-B",
              "summary": "보류 문서 공개로 인준 교착 해소"
            }
          ]
        },
        {
          "id": "K176",
          "name": "지온유",
          "links": {
            "house": "HP02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B009-K176"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산 환적 배차판 앞에서 지온유는 봉인 끈이 느슨하면 출발을 거부하고 사본 두 장을 꽉 쥔다. 후국회의 전령으로, 구두 배차 거부를 원장에 올리지 않는 원로를 위반자로 부른다. 한국 기원으로 용산철도 생활권에서 자랐고, 숨이 차도 회의 전갈 순번은 미루지 않는다. 지온유와 K176은 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 도제 승계와 선로 봉쇄 통지를 자신이 날인하는 전령 원장에만 유효하게 만들려 했다. 야망은 배차판 옆 분필로 남은 회의 시각표였다. 스승에게 물려받은 봉인 인주 한 통이 사적 연속의 씨앗이었다. 상급 가문 독촉이 와도 이중 확인 전 무효 전갈은 나가지 않았다.",
            "가문·기업·공동체": "환승선로문(HP02)은 후국 회의 전갈의 우선 선로 창구를 요구했다. 지온유는 참관 칸만 열고 실재 상호를 원장에서 지웠다. 공동체 신뢰는 조정관실과 가문 회의에 동시에 보낸 사본으로만 쌓였다. 전속 배차 소유 문장은 환적창 앞에서 거절됐다.",
            "붕괴의 상처": "억류 열차의 전환기 키가 둘이라는 소문이 배차판에 붙은 밤, 지온유는 승계 무효 전갈을 가방에 잠갔다. 공포는 위조 회의 전갈 한 장이 양자 승계를 무효로 돌려 전령망이 가문 나팔이 되는 그림이었다. 그는 소문 부착 시각을 LOSS 목록에 적고 인주를 봉인함에 넣었다. 확성기가 울려도 가방 버클은 풀지 않았다.",
            "생존 전환점": "전환점은 위조 전갈을 찾아 봉인을 지킬지, 가방 속 보류 문서를 가문회의에 펼칠지다. 해협삼로전구(XT03) 쪽 환적창 폐쇄·대체 회차 요청이 배차 무전과 겹쳤다. 봉인을 지키면 억류가 길어지고, 펼치면 일부 가문 표가 한꺼번에 움직인다. K176-TURN은 그 밤의 인주 봉인이다.",
            "현재 지위": "지온유는 여전히 후국회의 전령으로 점호와 회의 전갈 큐를 본다. 면허·연서·배차 날인 로그가 지위를 유지하며 환승선로문의 전속 요구는 반려한다. Cast 프로필의 후국 칸과 원장 시점을 맞추는 일이 아침 일과다. 억류 통지는 권시온 배차 날인과 박태겸 연서가 둘 다 있어야 달린다.",
            "비밀·빚·죄책감": "비밀은 그가 회의 전에 고쳐 쓴, 전환기 키 소문 출처 한 줄 메모다. 죄책감은 지킨 봉인 건수와 그 밤 전달하지 못한 도제 승계 통지 사이에 있다. 부분 공개만 증인 입회 하에 허용한다. SECRET 키는 전령장과 조정관 동시 서명으로만 열린다.",
            "관계 공동과거": "박태겸의 후계 제안을 봉인 상태로만 나른 지휘, 권시온의 배차 변경 배달 계약, 양해온의 인준 전갈과 맞춘 시점이 한 배차판에 겹친다. 같은 환적창에서 어떤 전갈은 구원이 되었고 어떤 무효 통지는 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K176로 이어진다. 협력과 견제는 전환기 클릭 수로만 재측정된다.",
            "3막 개인 서사선": "1막에서 지온유는 이중 키 소문에 승계 무효 전갈을 잠근다. 2막에서 HP02 선로 창구와 XT03 환적 폐쇄 요청을 저울질한다. 3막에서 봉인 수호 또는 회의 공개의 대가를 억류 연장으로 치른다. 서사선은 STORY-B009-K176이다.",
            "분기 결말": "결말 α에서 지온유는 위조 전갈 색출로 후국 원장을 지킨다. 결말 β에서 보류 문서를 가문회의에 펼쳐 표 결의를 강제한다. 용산철도후국 슬롯은 유지되며 분기만 K176-OUT으로 갈라진다. 개입은 색출 입회 또는 회의 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "이중 키 소문에 승계 무효 전갈을 가방에 잠근다"
            },
            {
              "act": 2,
              "summary": "HP02 선로 창구와 XT03 환적 폐쇄를 저울질한다"
            },
            {
              "act": 3,
              "summary": "봉인 수호 또는 회의 공개의 대가로 억류 연장을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K176-OUT-A",
              "summary": "위조 전갈 색출로 후국 원장 수호"
            },
            {
              "id": "K176-OUT-B",
              "summary": "보류 문서 회의 공개로 표 결의 강제"
            }
          ]
        },
        {
          "id": "K200",
          "name": "양이든",
          "links": {
            "house": "HP08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B009-K200"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 경매판 옆에서 양이든은 봉인 끈이 느슨하면 출발을 거부하고 사본 두 장을 든다. 경매 낙찰 전령으로, 눈짓으로 낙찰을 바꾸는 입찰자를 잠재적 위조로 본다. 한국 기원으로 남관 상회 생활권에서 자랐고, 목소리는 낮되 낙찰 시각 읽기는 양보하지 않는다. 양이든과 K200은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 물·전력·식량 계약의 낙찰 통지를 자신이 날인하는 전령 원장에만 유효하게 만들려 했다. 야망은 상회정 칠판에 분필로만 남은 낙찰 번호 열이었다. 형에게 빌린 봉인 인주가 작은 빚으로 남았다. 상급 직거래 독촉이 와도 재고 공개 전 군량 전갈은 가방 안에 있었다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 호송권 낙찰의 우선 방송 창구를 요구했다. 양이든은 참관만 받고 실재 상호를 원장에서 지웠다. 공동체 위치는 경매판과 상회정에 동시에 보낸 사본 횟수로 증명됐다. 전속 결제 소유 문장은 경매판 앞에서 거절됐다.",
            "붕괴의 상처": "흉작 소문만으로 빈 상자가 고가로 나가기 시작한 오전, 양이든은 군량 낙찰 전갈을 재고 공개 전까지 가방에 잠갔다. 공포는 위조 낙찰 전갈 한 장이 빈 상자를 확정해 전령망이 직거래 나팔이 되는 장면이었다. 그는 첫 빈 상자 낙찰 시각을 LOSS 목록에 적었다. 경매 망치가 울려도 버클은 풀지 않았다.",
            "생존 전환점": "전환점은 위조 전갈을 찾아 봉인을 지킬지, 가방 속 보류 문서를 폭로해 특정 후계 몰아주기를 무력화할지다. 서해곡창전구(XT02) 쪽 경매 방송 중계 요청이 상회 무전과 겹쳤다. 봉인을 지키면 군량 배정이 늦고, 폭로를 택하면 일부 입찰 신뢰가 무너진다. K200-TURN은 그 오전의 가방 잠금이다.",
            "현재 지위": "양이든은 여전히 경매 낙찰 전령으로 점호와 낙찰 사본 큐를 본다. 지위는 날인·연서·별도 봉투 로그로만 유지된다. 시장냉동상단의 전속 요구는 반려하고 Cast 프로필과 원장을 맞춘다. 호송권 낙찰은 윤서하 별도 봉투와 오해린 연서가 둘 다 있어야 달린다.",
            "비밀·빚·죄책감": "비밀은 그가 재고 장부 전에 엿본, 빈 상자 무게 메모 한 장이다. 죄책감은 막은 위조 낙찰 수와 그 날 미룬 형 인주 반환 사이에 있다. 부분 공개만 입회 하에 허용한다. SECRET 키는 전령장과 상회정 동시 서명으로만 열린다.",
            "관계 공동과거": "윤서하의 호송권 비공개 경매를 봉인 상태로만 나른 지휘, 마솔의 칸 자격 박탈 배달, 지온유의 후국 전갈과 맞춘 낙찰 시점이 한 경매판에 겹친다. 같은 상회에서 어떤 낙찰은 구원이 되었고 어떤 빈 상자는 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K200에 연결된다. 협력과 견제는 망치 타수 로그로만 재측정된다.",
            "3막 개인 서사선": "1막에서 양이든은 빈 상자 고가 낙찰 소문에 군량 전갈을 잠근다. 2막에서 HP08 방송 창구와 XT02 경매 중계 요청을 저울질한다. 3막에서 봉인 수호 또는 몰아주기 폭로의 대가를 배정 지연으로 치른다. 서사선은 STORY-B009-K200이다.",
            "분기 결말": "결말 α에서 양이든은 위조 전갈 색출로 낙찰 원장을 지킨다. 결말 β에서 보류 문서 폭로로 후계 몰아주기를 무력화한다. 노량진남관 슬롯은 유지되며 분기만 K200-OUT으로 갈라진다. 개입은 색출 입회 또는 공개 낭독이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "빈 상자 고가 낙찰 소문에 군량 전갈을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP08 방송 창구와 XT02 경매 중계를 저울질한다"
            },
            {
              "act": 3,
              "summary": "봉인 수호 또는 몰아주기 폭로의 대가로 배정 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K200-OUT-A",
              "summary": "위조 전갈 색출로 낙찰 원장 수호"
            },
            {
              "id": "K200-OUT-B",
              "summary": "보류 문서 폭로로 후계 몰아주기 무력화"
            }
          ]
        },
        {
          "id": "K225",
          "name": "소감",
          "links": {
            "house": "HC01",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B009-K225"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 편성실 마이크 아래에서 소감은 시간을 분 단위로 기억하고 슬롯을 넘긴 채널에 쪽지를 밀어 넣는다. 편성 전령이자 오하늘의 실무 담당으로, 구두 약속은 전령 원장에 옮기기 전에 믿지 않는다. 한국 기원으로 상암 송신 생활권에서 자랐고, 목소리는 작아도 시각표 칸은 비우지 않는다. 소감과 K225는 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 약소국 공동 시간과 교차증언 이송을 고정 전령로로 만들어 검열 없는 편성을 권리로 박으려 했다. 야망은 편성실 칠판 모서리에 연필로만 남은 공동 시각 눈금이었다. 동료에게 빌린 여분 배터리 팩 하나가 연속 방송의 씨앗이었다. 수신료 쪽지가 와도 원장 없는 시각은 마이크에 올리지 않았다.",
            "가문·기업·공동체": "청람전자원(HC01)은 편성 슬롯의 원격 갱신 창구를 요구했다. 소감은 참관만 받고 실재 상호를 전령 원장에서 지웠다. 공동체 위치는 슬롯 통지와 증언 이송을 같은 원장에 적은 횟수로 증명됐다. 전속 편성 소유 문장은 마이크 앞에서 거절됐다.",
            "붕괴의 상처": "길드 일부가 수신료를 받고 슬롯을 판 밤, 전령 원장에 없는 시각이 두 칸 생겼다. 공포는 전령 가방이 광고와 보호비 쪽지로 바뀌어 편성이 승자의 시간표가 되는 장면이었다. 소감은 매수 쪽지를 길드 게시판에 그대로 붙이고 LOSS 목록에 시각을 적었다. 방송이 흔들려도 원장 없는 칸은 채우지 않았다.",
            "생존 전환점": "전환점은 매수 쪽지를 공개 확대해 길드 신뢰를 칠지, 약소국 공동 시간을 전령로에 고정할지다. 원양신탁전구(XT05) 쪽 잔여 대역 공개 추첨 요청이 편성실 무전과 겹쳤다. 공개를 택하면 일부 채널이 멈추고, 공동 시간 고정을 택하면 추첨 방송이 하루 밀린다. K225-TURN은 그 밤의 쪽지 부착이다.",
            "현재 지위": "소감은 여전히 편성 전령으로 점호와 슬롯 통지 큐를 본다. 지위는 원장 기입·게시판 로그·오하늘 연서로만 유지된다. 청람전자원의 전속 요구는 반려하고 Cast 프로필과 시각표를 맞춘다. 매수된 쪽지는 숨기지 않고 게시판에 남긴다.",
            "비밀·빚·죄책감": "비밀은 그가 원장에 올리기 전 삼킨, 특정 채널 매수 금액이 적힌 쪽지 사본이다. 죄책감은 지킨 공동 시각 칸과 그 밤 호출하지 못한 교차증언 이송 사이에 있다. 부분 공개만 이중 입회 하에 허용한다. SECRET 키는 전령장과 편성실 동시 서명으로만 열린다.",
            "관계 공동과거": "오하늘의 편성 통지를 나른 지휘, 봉용의 편성실 칠판을 맞춘 밤, 윤서린에게 전한 보류 사유 사본이 한 마이크 아래에 겹친다. 같은 편성실에서 어떤 슬롯은 구원이 되었고 어떤 쪽지는 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K225에 연결된다. 협력과 견제는 분 단위 시계로만 재측정된다.",
            "3막 개인 서사선": "1막에서 소감은 매수 슬롯 두 칸을 게시판에 붙이며 맞선다. 2막에서 HC01 원격 갱신과 XT05 대역 추첨 요청을 저울질한다. 3막에서 매수 폭로 또는 공동 시간 고정의 대가를 채널 공백으로 치른다. 서사선은 STORY-B009-K225이다.",
            "분기 결말": "결말 α에서 소감은 매수 쪽지 확대로 길드 거래를 끊는다. 결말 β에서 약소국 공동 시간을 전령로에 고정한다. 상암송신 슬롯은 유지되며 분기만 K225-OUT으로 갈라진다. 개입은 쪽지 공개 입회 또는 공동 시각 봉인이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "매수 슬롯 두 칸을 게시판에 붙이며 맞선다"
            },
            {
              "act": 2,
              "summary": "HC01 원격 갱신과 XT05 대역 추첨을 저울질한다"
            },
            {
              "act": 3,
              "summary": "매수 폭로 또는 공동 시간 고정의 대가로 채널 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K225-OUT-A",
              "summary": "매수 쪽지 확대로 길드 거래 차단"
            },
            {
              "id": "K225-OUT-B",
              "summary": "약소국 공동 시간 전령로 고정"
            }
          ]
        },
        {
          "id": "K002",
          "name": "이서담",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B009-K002"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "양천 골목 저수조 뚜껑 옆에서 이서담은 수위가 한 칸만 내려가도 총재 회의 안건을 밀어낸다. 양천 배급구역 대표로, 합계 장부보다 수도꼭지 압력을 먼저 믿는다. 한국 출생 다문화 가정에서 자라 집 안 언어가 둘이었고, 배급 거부는 출신 구호가 아니라 실측 숫자로만 말한다. 표시 이름 이서담과 식별자 K002는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 배급구역 대표 거부권을 수문헌장에 명문화해 총재 단독 단수를 막으려 했다. 야망은 저수조 벽에 분필로만 남은 구역 경계 선이었다. 이웃 아주머니에게 빌린 수위 막대 하나가 사적 약속의 씨앗이었다. 보호권 확대안이 와도 실측표 없는 서명은 하지 않았다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 양천 배급과 맞물린 수문 우선 점검 창구를 요구했다. 이서담은 참관만 받고 실재 상호를 배급 원장에서 지웠다. 공동체 위치는 급수총재 계약안에 구역 연서를 동시에 받은 횟수로 증명됐다. 전속 단수 소유 문장은 저수조 빗장 앞에서 거절됐다.",
            "붕괴의 상처": "뚝도 급수계약이 만료되고 한재목이 서부 보호권 확대안을 내민 아침, 이서담은 양천 저수조 실측을 이유로 서명을 보류했다. 공포는 한 구역 관로 파손이 집단 단수 명분이 되어 양천 전체가 거래 카드가 되는 장면이었다. 그는 보류 시각을 LOSS 목록에 적고 실측표를 방수 봉투에 넣었다. 회의 종이 쌓여도 연서란은 비워 두었다.",
            "생존 전환점": "전환점은 양천 저수조 실측표를 공개해 거부권을 세울지, 누락 배급을 폭로해 대표 연서를 흔들 외부 압박에 맞설지다. 서해곡창전구(XT02) 쪽 부두 배수 일정 재편 요청이 배급 무전과 겹쳤다. 실측을 세우면 보호권 협상이 늦고, 누락 폭로를 택하면 구역 내부 신뢰가 금이 간다. K002-TURN은 그 아침의 실측 봉투다.",
            "현재 지위": "이서담은 여전히 양천 배급구역 대표로 점호와 수위 실측 큐를 본다. 지위는 세습이 아니라 연서·실측·시민 급수권 보증 로그로만 유지된다. 아리수수문가의 전속 요구는 반려하고 Cast 프로필과 배급표를 맞춘다. 교량 통행세 봉인은 구역 연서 없는 계약안에서 자동으로 걸린다.",
            "비밀·빚·죄책감": "비밀은 그가 장필규에게 덮어 달라 부탁했던, 한 줄 누락된 옛 배급 원장 메모다. 죄책감은 지킨 거부권 횟수와 그 때문에 하루 미룬 이웃 수통 전달 사이에 있다. 부분 공개만 시민 입회 하에 허용한다. SECRET 키는 대표와 감사 동시 서명으로만 열린다.",
            "관계 공동과거": "한재목과의 이원 집정 동맹이자 거부권 경쟁, 장필규에게 진 원장 누락 빚, 임바다의 시민 급수권 맹세 보증이 한 저수조 옆에 겹친다. 같은 골목에서 어떤 수압은 구원이 되었고 어떤 단수 예고는 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K002에 연결된다. 다문화 이력은 가정사로만 남고 배급 숫자와 섞지 않는다.",
            "3막 개인 서사선": "1막에서 이서담은 급수계약 만료에 실측 보류 서명을 내민다. 2막에서 HP01 수문 창구와 XT02 배수 재편 요청을 저울질한다. 3막에서 거부권 수호 또는 누락 폭로 대응의 대가를 협상 지연으로 치른다. 서사선은 STORY-B009-K002다.",
            "분기 결말": "결말 α에서 이서담은 실측표 공개로 구역 거부권을 세운다. 결말 β에서 누락 배급 정정 공개로 연서 신뢰를 재조립한다. 여의신정 슬롯은 유지되며 분기만 K002-OUT으로 갈라진다. 개입은 실측 호위 또는 원장 정정 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "급수계약 만료에 양천 실측 보류 서명을 내민다"
            },
            {
              "act": 2,
              "summary": "HP01 수문 창구와 XT02 배수 재편을 저울질한다"
            },
            {
              "act": 3,
              "summary": "거부권 수호 또는 누락 정정의 대가로 협상 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K002-OUT-A",
              "summary": "실측표 공개로 구역 거부권 수호"
            },
            {
              "id": "K002-OUT-B",
              "summary": "누락 배급 정정 공개로 연서 신뢰 재조립"
            }
          ]
        },
        {
          "id": "K030",
          "name": "정시우",
          "links": {
            "house": "HC12",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B009-K030"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "천왕기지 계측대 위에서 정시우는 공차 숫자로 사람을 기억하고 규격 밖 임시 개조를 사고의 씨앗으로 본다. 천왕기지 제작원로로, 출고 부품마다 계측 도장을 찍고 도장 없는 개조품은 유치선에 들이지 않는다. 한국 출생 다문화 가정에서 공구 이름을 두 언어로 배웠고, 호환 주장은 혈통 구호가 아니라 나사 피치로만 말한다. 정시우와 K030은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 서울 전역 차륜·펌프 나사의 호환표를 천왕 원장 하나로 고정해 제작규격동맹의 뼈대를 만들려 했다. 야망은 원로실 벽 도면에 연필로만 남은 호환 격자였다. 스승이 남긴 마이크로미터 한 자루가 사적 연속의 씨앗이었다. 군수 전용 도면이 와도 공개 호환표 없는 나사는 봉인했다.",
            "가문·기업·공동체": "거도중공회(HC12)는 대형 리깅과 맞물린 천왕 호환 나사의 우선 출고를 요구했다. 정시우는 참관만 받고 실재 상호를 계측 원장에서 지웠다. 공동체 위치는 장우석 기록 날인과 동시에 찍은 계측 도장 횟수로 증명됐다. 전속 군수 나사 소유 문장은 유치선 앞에서 거절됐다.",
            "붕괴의 상처": "암사가 부품 대신 복구복무 등록을 요구한 오후, 정시우는 천왕 창고의 암사행 나사를 봉인하고 공개 호환표만 받겠다고 선언했다. 공포는 경비대가 군수 전용 나사를 따로 깎아 민간 수리망이 하루아침에 호환 불능이 되는 장면이었다. 그는 봉인 시각을 LOSS 목록에 적고 마이크로미터를 목에 걸었다. 독촉 전갈이 와도 봉인 테이프는 뜯지 않았다.",
            "생존 전환점": "전환점은 봉인 나사의 실측 공차를 공개해 원장 봉인을 풀지, 군수 전용 나사의 숨은 도면을 찾아 규격 분열을 폭로할지다. 서해곡창전구(XT02) 쪽 냉동 압축기 부품 분배 요청이 계측실 무전과 겹쳤다. 공차 공개를 택하면 암사 복무 협상이 흔들리고, 도면 폭로를 택하면 일부 군수 라인이 멈춘다. K030-TURN은 그 오후의 봉인 테이프다.",
            "현재 지위": "정시우는 여전히 천왕기지 제작원로로 점호와 계측 도장 큐를 본다. 지위는 세습이 아니라 도장·기록 날인·공개 호환 로그로만 유지된다. 거도중공회의 전속 요구는 반려하고 Cast 프로필과 호환표를 맞춘다. 규격 개정은 장우석 날인 없이 허용하지 않는다.",
            "비밀·빚·죄책감": "비밀은 그가 봉인 전 한 번 깎아 본, 군수 피치 시편 메모 한 장이다. 죄책감은 지킨 민간 호환 라인과 그 날 미룬 암사 복무 회신 사이에 있다. 부분 공개만 원로 입회 하에 허용한다. SECRET 키는 원로와 기록관 동시 서명으로만 열린다.",
            "관계 공동과거": "강민서와의 규격 사제, 최한결과의 차륜 동맹, 장우석의 기록 날인 없이 개정을 막은 계약이 한 계측대에 겹친다. 같은 유치선에서 어떤 나사는 구원이 되었고 어떤 전용 도면은 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K030에 연결된다. 다문화 공구 어휘는 작업 습관으로만 남고 규격 숫자와 섞지 않는다.",
            "3막 개인 서사선": "1막에서 정시우는 복무 등록 압박에 암사행 나사를 봉인한다. 2막에서 HC12 우선 출고와 XT02 압축기 부품 요청을 저울질한다. 3막에서 공차 공개 또는 도면 폭로의 대가를 출고 지연으로 치른다. 서사선은 STORY-B009-K030이다.",
            "분기 결말": "결말 α에서 정시우는 실측 공차 공개로 호환 원장 봉인을 조건부 해제한다. 결말 β에서 군수 전용 도면 폭로로 규격 분열을 차단한다. 서남제작 슬롯은 유지되며 분기만 K030-OUT으로 갈라진다. 개입은 공차 입회 또는 도면 압수 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무 등록 압박에 암사행 나사를 봉인한다"
            },
            {
              "act": 2,
              "summary": "HC12 우선 출고와 XT02 압축기 부품을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공차 공개 또는 도면 폭로의 대가로 출고 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K030-OUT-A",
              "summary": "실측 공차 공개로 호환 원장 조건부 해제"
            },
            {
              "id": "K030-OUT-B",
              "summary": "군수 전용 도면 폭로로 규격 분열 차단"
            }
          ]
        },
        {
          "id": "K032",
          "name": "이강묵",
          "links": {
            "house": "HC08",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B009-K032"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "금천 차단문 초소에서 이강묵은 토론이 길어지면 차단문부터 내리고 치안 실적을 거리 게시판에 붙인다. 금천 경비대장으로, 부하 가족 배급은 책임지되 조합 쪽 지연은 배신으로 읽는다. 중국계 이산 가정에서 서울로 옮겨 온 뒤 초소 암호와 한국어 근무 일지를 함께 썼고, 동원 명령은 혈통 구호가 아니라 차단문 로그로만 말한다. 이강묵과 K032는 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 작업반을 상시 공병대로 전환하고 수리 규격을 군수 우선으로 재편해 제작동맹의 무력을 자신이 쥐게 하려 했다. 야망은 장교 수첩 여백에만 남은 야간 편성 약도였다. 아버지 공구함에서 가져온 이중 자물쇠 키가 사적 연속의 씨앗이었다. 평의회 지연이 길어져도 비상 암호는 수첩 밖으로 나오지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 차단문 전투조의 우선 편성 창구를 요구했다. 이강묵은 참관만 받고 실재 상호를 경비 원장에서 지웠다. 공동체 위치는 치안 실적 게시와 동시에 남긴 입회 로그 횟수로 증명됐다. 전속 동원 소유 문장은 초소 앞에서 거절됐다.",
            "붕괴의 상처": "암사의 복무 등록 압박이 전해진 밤, 이강묵은 금천 차단문 전투조를 야간 편성하고 공구 창고에 이중 자물쇠를 채웠다. 공포는 노동조합이 부품 출고를 멈춰 경비대가 빈 차단문만 지키다 외곽 약탈에 뚫리는 장면이었다. 그는 편성 시각을 LOSS 목록에 적고 수첩을 속주머니에 넣었다. 확성기가 울려도 평의회 봉인 전 암호는 읽지 않았다.",
            "생존 전환점": "전환점은 비밀 무기 생산 수첩을 평의회에 넘길지, 외곽 약탈을 함께 막아 동원령을 정당화할지다. 임진관문전구(XT01) 쪽 차륜 호송 우회 요청이 초소 무전과 겹쳤다. 수첩을 넘기면 전투조 일부가 멈추고, 동원을 택하면 조합 출고가 하루 더 잠긴다. K032-TURN은 그 밤의 이중 자물쇠다.",
            "현재 지위": "이강묵은 여전히 금천 경비대장으로 점호와 야간 편성 큐를 본다. 지위는 세습이 아니라 실적 게시·암호 입회·명부 대조 로그로만 유지된다. 성화궤도방위문의 전속 요구는 반려하고 Cast 프로필과 차단문 일지를 맞춘다. 야간 무장 차출은 김나율 명부와 암호가 동시에 있어야 따른다.",
            "비밀·빚·죄책감": "비밀은 그가 평의회 봉인 전에 한 줄 지운, 야간 편성 외 무기 칸 메모다. 죄책감은 막은 약탈 횟수와 그 때문에 미룬 부하 가족 배급 전달 사이에 있다. 부분 공개만 이중 장교 입회 하에 허용한다. SECRET 키는 대장과 평의회 동시 서명으로만 열린다.",
            "관계 공동과거": "강민서를 중재자로 쓰면서도 군수 독점에서 경쟁한 관계, 장석윤과 나눈 차단문 전술 거래, 김나율 명부를 둘러싼 원한이 한 초소에 겹친다. 같은 차단문에서 어떤 편성은 구원이 되었고 어떤 자물쇠는 배신의 증거로 남았다. 관계 원장 끝점은 STORY-B009-K032에 연결된다. 이산 가정사는 개인 이력으로만 남고 동원 로그와 섞지 않는다.",
            "3막 개인 서사선": "1막에서 이강묵은 복무 압박에 야간 전투조와 이중 자물쇠를 건다. 2막에서 HC08 편성 창구와 XT01 호송 우회 요청을 저울질한다. 3막에서 수첩 공개 또는 동원 정당화의 대가를 출고 정지로 치른다. 서사선은 STORY-B009-K032다.",
            "분기 결말": "결말 α에서 이강묵은 무기 수첩을 평의회에 넘겨 동원 감시를 연다. 결말 β에서 외곽 약탈 공동 방어로 동원령을 정당화한다. 서남제작 슬롯은 유지되며 분기만 K032-OUT으로 갈라진다. 개입은 수첩 압수 입회 또는 공동 방어 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무 압박에 야간 전투조와 이중 자물쇠를 건다"
            },
            {
              "act": 2,
              "summary": "HC08 편성 창구와 XT01 호송 우회를 저울질한다"
            },
            {
              "act": 3,
              "summary": "수첩 공개 또는 동원 정당화의 대가로 출고 정지를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K032-OUT-A",
              "summary": "무기 수첩 평의회 이관으로 동원 감시 개방"
            },
            {
              "id": "K032-OUT-B",
              "summary": "외곽 약탈 공동 방어로 동원령 정당화"
            }
          ]
        },
        {
          "id": "H09",
          "name": "조하람",
          "links": {
            "house": "HC09",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B009-H09"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "S09 정비 벤치에서 조하람은 야간 시야 모듈의 경계를 센서 막대 숫자로만 읽고 교체형 손모듈로 당직 로그에 출입을 남긴다. 합성 인간형 H09이며 호출명은 하람, 도성생활유통가(HC09) 공동 보관 아래 배터리 잔량과 참관 봉인이 행동을 제한한다. 전지적 시야와 무한 에너지는 없고 마모 부품 할당제만 따른다. 표시 이름 조하람과 식별자 H09는 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 S09 구역 연속 가동과 담당 인간 안전을 시민 참관 로그에 공개해 단독 원격 잠금을 막으려는 목표가 남아 있다. 야망에 해당하는 우선순위는 벤치 측면 잔량 그래프에 점으로만 찍혀 있다. 보관 책임 문가람이 남긴 예비 배터리 슬롯 하나가 연속성 부채의 자리였다. 삼자 서명 없는 양도 명령은 실행 큐에 오르지 않았다.",
            "가문·기업·공동체": "도성생활유통가(HC09)는 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 조하람의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 공동체 위치는 교대 스냅샷이 양쪽에 동시에 기록된 횟수로 증명된다. 전속 국가 소유 요구는 벤치 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "충전 칸 경보가 구역 전체를 흔든 밤, 조하람은 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 전체 망 권한 요청을 거부하고 구역 키만 남겼다. 공포에 해당하는 최고 우선 경보는 교차 시설 루트가 열려 담당 인간 안전 큐가 적대 표적으로 바뀌는 시나리오였다. LOSS 목록에는 배터리 하한과 끊긴 노드만 적혔다. 비상 전원이 돌아와도 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "전환점은 충전 경보 노드를 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 구역 연속 가동만 살릴지다. 원양신탁전구(XT05) 쪽 잔여 대역 추첨 경로 요청이 수신 큐에 겹쳤다. 공개 분해를 택하면 원인 공급 코드가 드러나고, 구역만 살리면 대역 중계 공백이 길어진다. H09-TURN은 그 수신 큐의 정렬 결과다.",
            "현재 지위": "조하람은 여전히 S09 정비 벤치 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC09가 전속 원격 소유를 요구해도 거부 코드를 반환하고, Cast 프로필의 현황 칸과 스냅샷 해시를 교대마다 맞춘다. 벤치 열쇠 권한은 문가람 주정비와 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀에 해당하는 제한 로그는 참관 없이 한 번 올라간 손모듈 펌웨어 패치 한 줄이다. 죄책감에 해당하는 가중치는 살린 구역 가동 분과 그 교대에 호출하지 못한 예비 슬롯 사이에서만 증가한다. 전부 공개 대신 이중 참관 하의 부분 로그 공개 절차만 남겼다. SECRET 플래그는 보관 책임과 시민 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "문가람(K215)의 주정비·법적 책임 로그는 보관 코드였고, K060과의 교대 협력 큐는 동맹 신호였다. HC09 참관과의 원격 잠금 경쟁, 구역 주민 대표와의 스냅샷 공유가 한 벤치에 겹친다. 같은 노드에서 어떤 경로는 구원으로 기록되었고 어떤 경로는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B009-H09에 연결된다.",
            "3막 개인 서사선": "1막에서 조하람은 충전 경보에 장기 기억을 잠그고 구역 키만 남긴다. 2막에서 HC09 원격 요구와 XT05 대역 경로 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 구역 회생의 대가를 중계 공백 시간으로 치른다. 서사선 식별자는 STORY-B009-H09로 고정된다.",
            "분기 결말": "결말 α에서 조하람은 충전 경보 노드 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리로 구역 연속 가동을 살려 담당 인간 안전을 우선한다. 어느 쪽도 HC09 보관 슬롯을 삭제하지 않으며, 분기 식별만 H09-OUT으로 갈라진다. 플레이 개입은 분해 입회 또는 구역 전원 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "충전 경보에 장기 기억을 잠그고 구역 키만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC09 원격 요구와 XT05 대역 경로를 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 구역 회생의 대가로 중계 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H09-OUT-A",
              "summary": "충전 경보 노드 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H09-OUT-B",
              "summary": "예비 배터리 구역 회생으로 담당 인간 안전 우선"
            }
          ]
        }
      ]
    },
    "B010": {
      "id": "B010",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K250",
          "name": "소두",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B010-K250"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북산 숙영 중앙 천막 옆 게시판 앞에서 소두는 가족 회의 통지 쪽지의 봉인 끈을 손톱으로 확인한다. 그는 북산피난연맹의 가족 회의 전령이자 신보람의 실무 담당자로, 구두 전달만 믿는 당직을 위조 이웃이라 부른다. 한국 기원으로 북부 피난권에서 자랐고, 말은 짧지만 쪽지 모서리에 남긴 시각 각인은 지우지 않는다. 표시 이름 소두와 불변 식별자 K250은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 가족 단위 투표 통지를 숙영 구역마다 동시에 붙이는 규칙을 밀어 가족 분리를 숫자로 처리하는 배급표를 막으려 했다. 야망은 게시판 하단에 분필로만 남은 ‘동시 부착’ 세 글자였다. 어머니 바느질 상자 안에 숨긴 여분 봉인 끈 한 묶음이 사적 약속의 씨앗이 된다. 상급 당직이 한 줄만 먼저 읽히려 해도 봉인 없는 통지는 게시판에 올라가지 못했다.",
            "가문·기업·공동체": "북산귀환회(HP05)는 귀환 명부 참관을 내세워 전령 좌석을 요구했다. 소두는 후계 헌장 참관만 받고 실재 상호·제품명을 통지 원장에서 지웠다. 공동체 위치는 신보람 통지와 윤초아 필사를 같은 벽에 동시에 붙인 횟수로 증명됐다. 전속 노동 소유 요구는 숙영 게시판 앞에서 반려된다.",
            "붕괴의 상처": "귀환 명부가 훼손된 새벽, 소두는 빈 칸이 생긴 가족 줄을 빨간 분필로 되살리고 위조 통지 묶음을 불태우지 않은 채 별도 함에 가뒀다. 공포는 한 가족의 이름이 전령 실수로 지워져 급수 줄에서 사라지는 장면이었다. 그는 LOSS 목록에 훼손 시각과 빈 칸 수만 남겼다. 천막이 조용해진 뒤에도 봉인 끈을 손목에 감은 채 풀지 않았다.",
            "생존 전환점": "전환점은 훼손 명부를 공개 원장에 복원해 붙일지, 임진 임시 검역소 쪽 재발급 요청만 먼저 호송할지 고른 순간이다. 임진관문전구(XT01) 검역 전갈이 게시판과 겹치자 계산이 달라졌다. 복원을 택하면 시민권 근거는 살아나지만 검역 대열이 늘고, 재발급 호송을 택하면 줄은 짧아지되 빈 칸 책임이 가려질 수 있다. 그 선택은 K250-TURN으로 남고, 되돌리면 숙영 전령 교대 한 슬롯이 비다.",
            "현재 지위": "지금도 소두는 가족 회의 전령으로 점호와 통지 큐를 지킨다. 지위는 세습이 아니라 봉인·서명·게시 로그로만 유지된다. 북산귀환회가 전속 전령 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 게시판 열쇠는 두 자루로 나뉘어 한 자루는 신보람 당직함, 다른 한 자루는 참관함이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 날짜가 하루 빠른 위조 통지 초고 한 장이다. 죄책감은 살린 가족 줄과 그 밤 호출하지 못한 국봉의 대기 쪽지 사이에서만 자란다. 전부를 공개하면 숙영 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 전령장과 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "신보람의 가족 회의 통지를 나른 계약, 윤초아의 원장 필사를 숙영 게시판에 붙인 밤은 동맹이었다. 국봉과 맞춘 전령 게시 줄은 동업이었고, 배급 당직과는 부착 순번을 두고 경쟁이 남았다. 같은 천막 앞에서 어떤 쪽지는 구원이 되었고 어떤 쪽지는 배신의 증거로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B010-K250에 연결된다.",
            "3막 개인 서사선": "1막에서 소두는 훼손된 귀환 명부의 빈 칸을 분필로 되살린다. 2막에서 HP05 참관과 XT01 검역 재발급 요청을 한 게시판 앞에서 저울질한다. 3막에서 공개 복원 또는 호송 재발급의 대가를 전령 지연으로 치른다. 서사선 식별자는 STORY-B010-K250로 고정된다.",
            "분기 결말": "결말 α에서 소두는 훼손 명부 공개 복원을 우선해 시민권 근거를 지킨다. 결말 β에서 그는 검역 재발급 호송을 우선해 대열 연속을 살린다. 어느 쪽도 북산 16국 슬롯을 삭제하지 않으며, 분기 식별만 K250-OUT으로 갈라진다. 플레이 개입은 명부 복원 입회 또는 검역 호송 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "훼손된 귀환 명부 빈 칸을 분필로 되살린다"
            },
            {
              "act": 2,
              "summary": "HP05 참관과 XT01 검역 재발급 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 복원 또는 호송 재발급의 대가로 전령 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K250-OUT-A",
              "summary": "훼손 명부 공개 복원으로 시민권 근거 유지"
            },
            {
              "id": "K250-OUT-B",
              "summary": "검역 재발급 호송으로 대열 연속 유지"
            }
          ]
        },
        {
          "id": "K275",
          "name": "소봉",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B010-K275"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 차량기지 칠판 앞에서 소봉은 가동 통지 종이를 수위 막대 눈금과 같은 못에 꽂기 전에 잉크 번짐을 확인한다. 그는 창동차륜방의 연공회의 전령이자 조우찬의 실무 담당자로, 측정 없는 가동 구호를 빈 소리라 부른다. 한국 기원으로 동북 차륜권에서 자랐고, 손끝은 항상 분필 가루와 급수 잔량 공지 모서리를 동시에 만진다. 표시 이름 소봉과 불변 식별자 K275는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 연공회의 가동 통지와 급수 잔량 공지를 한 벽에 나란히 붙여 차륜 가동이 물 없는 구호로 떨어지지 않게 하려 했다. 야망은 칠판 상단의 ‘동시 고지’ 칸에만 남아 있다. 아버지 공구함 뚜껑 안쪽에 적은 예비 분필 자국이 사적 약속의 씨앗이 된다. 상급 배차가 가동만 먼저 외쳐도 잔량 공지 없는 통지는 칠판 맨 위에 올라가지 못했다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 방호 우선 가동을 의무 조항으로 내밀었다. 소봉은 후계 헌장 참관만 받고 실재 상호·제품명을 연공 원장에서 지웠다. 공동체 위치는 조우찬 가동 통지와 서진아 급수 공지를 같은 벽에 붙인 일수로 증명됐다. 전속 기지 소유 요구는 칠판 앞에서 반려된다.",
            "붕괴의 상처": "동절 연료 큐가 뒤섞인 밤, 위조 가동 통지가 급수 공지 위에 겹쳐 붙었다. 소봉은 겹친 종이를 뜯어 분리하고 전체 출고 구호를 멈추게 했다. 공포는 물 없는 차륜이 동절 급행에 실려 선로에서 멈추는 장면이었다. LOSS 목록에는 위조 잉크 번짐과 멈춘 피트 슬롯 수만 적혔다. 기지 확성기가 꺼진 뒤에도 그는 수위 막대를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 위조 가동 경로를 공개 추적할지, 예비 분필과 잔량 공지로 동절 연료 큐만 먼저 살릴지 고른 순간이다. 두만극동전구(XT04) 쪽 동절 연료 전갈이 칠판과 겹치자 계산이 달라졌다. 추적을 택하면 위조 공급이 드러나지만 급행이 멈추고, 큐를 살리면 통행은 이어지되 위조 경로가 한 칸 숨을 수 있다. 그 선택은 K275-TURN으로 남고, 되돌리면 창동 전령 교대 한 칸이 비다.",
            "현재 지위": "지금도 소봉은 연공회의 전령으로 점호와 가동·급수 이중 고지를 지킨다. 지위는 세습이 아니라 면허·서명·입회 로그로만 유지된다. 성화궤도방위문이 전속 가동 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 칠판 열쇠는 감두 당직과 참관함이 나눠 가진다.",
            "비밀·빚·죄책감": "비밀은 그가 공구함 뚜껑에 남긴, 잔량 확인 전 붙인 가동 쪽지 메모다. 죄책감은 살린 동절 큐와 그 밤 호출이 늦었던 모복의 수위 교대 사이에서만 자란다. 전부 공개 대신 이중 참관 하의 부분 공개 절차만 남겼다. SECRET 키는 전령장과 급수 당직 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "조우찬의 가동 통지를 나른 계약, 서진아의 급수 잔량 공지를 같은 벽에 붙인 밤은 동맹이었다. 감두가 통지를 칠판 맨 위에 둔 순번, 모복과 나눈 수위 막대 못은 동업이었다. 같은 기지에서 어떤 종이는 구원이 되었고 어떤 종이는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B010-K275에 연결된다.",
            "3막 개인 서사선": "1막에서 소봉은 위조 가동 통지를 급수 공지에서 분리한다. 2막에서 HC08 방호 우선과 XT04 동절 연료 전갈을 한 칠판에서 저울질한다. 3막에서 추적 또는 큐 회생의 대가를 전령 지연으로 치른다. 서사선 식별자는 STORY-B010-K275로 고정된다.",
            "분기 결말": "결말 α에서 소봉은 위조 가동 경로 공개로 공급망 차단을 고른다. 결말 β에서 그는 잔량 공지 동시 고지로 동절 큐 연속을 지킨다. 어느 쪽도 창동 16국 슬롯을 삭제하지 않으며, 분기 식별만 K275-OUT으로 갈라진다. 플레이 개입은 위조 추적 입회 또는 연료 큐 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 가동 통지를 급수 공지에서 분리한다"
            },
            {
              "act": 2,
              "summary": "HC08 방호 우선과 XT04 동절 연료 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "추적 또는 큐 회생의 대가로 전령 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K275-OUT-A",
              "summary": "위조 가동 경로 공개로 공급망 차단"
            },
            {
              "id": "K275-OUT-B",
              "summary": "잔량 동시 고지로 동절 큐 연속 유지"
            }
          ]
        },
        {
          "id": "K300",
          "name": "두복",
          "links": {
            "house": "HP02",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B010-K300"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내 환승 대합실 쪽지함 앞에서 두복은 승인 순서 다툼을 적은 쪽지를 접기 전에 발신 시각을 두 번 읽는다. 그는 신내망우환승시의 계절 교대 전령이자 전미리의 실무 담당자로, 한 쪽 승인만 외치는 창구를 사고 예고라 부른다. 한국 기원으로 동북 환승권에서 자랐고, 손바닥에는 항상 흑연과 환승 스탬프 잉크가 섞여 있다. 표시 이름 두복과 불변 식별자 K300은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 계절 교대 승인 순서를 전미리와 안도한이 동시에 서명해야만 확정되는 이중 창구로 만들려 했다. 야망은 대합실 벽에 남은 ‘쌍방 스탬프’ 칸이다. 형에게 맡긴 예비 쪽지 묶음이 사적 약속의 씨앗이 된다. 단선 승인이 밀려 들어와도 한쪽 서명만 있는 교대표는 쪽지함에 들어가지 못했다.",
            "가문·기업·공동체": "환승선로문(HP02)은 환승 슬롯 참관을 내세워 전령 좌석을 요구했다. 두복은 후계 헌장 참관만 받고 실재 상호·제품명을 교대 원장에서 지웠다. 공동체 위치는 전미리·안도한 승인 다툼 쪽지를 양쪽에 동시에 전달한 횟수로 증명됐다. 전속 환승 소유 요구는 대합실 앞에서 반려된다.",
            "붕괴의 상처": "창동 차륜 호송이 관문 밖에서 멈춘 새벽, 위조 계절 교대표가 한쪽 승인만 찍힌 채 쪽지함에 들어왔다. 두복은 함 전체를 잠그고 쌍방 스탬프가 돌아올 때까지 게시하지 않았다. 공포는 잘못된 교대가 우회 환승을 막아 호송 행렬이 선로 위에 쌓이는 장면이었다. LOSS 목록에는 멈춘 슬롯 번호와 미서명 쪽지 수가 적혔다.",
            "생존 전환점": "전환점은 위조 교대표를 공개 대조해 폐기할지, 신내 우회 환승 슬롯만 먼저 열어 호송을 살릴지 고른 순간이다. 임진관문전구(XT01) 쪽 우회 요청이 확성기와 겹치자 무게가 바뀌었다. 공개 폐기를 택하면 위조 경로는 드러나지만 대열이 늘고, 우회 슬롯을 택하면 행렬은 움직이되 단선 승인 관행이 남을 수 있다. 그 선택은 K300-TURN으로 남고, 되돌리면 계절 교대 전령 한 교대가 비다.",
            "현재 지위": "지금도 두복은 계절 교대 전령으로 점호와 쌍방 스탬프 큐를 지킨다. 지위는 세습이 아니라 서명·스탬프·전달 로그로만 유지된다. 환승선로문이 전속 슬롯 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 쪽지함 열쇠는 전미리 창구와 안도한 창구가 나눠 가진다.",
            "비밀·빚·죄책감": "비밀은 그가 형에게 맡긴 예비 묶음 속에 남은, 한쪽만 서명된 시험 교대표다. 죄책감은 살린 우회 행렬과 그 밤 늦게 도착한 안도한 쪽지 사이에서만 자란다. 전부 공개 대신 이중 창구 입회 하의 부분 공개만 남겼다. SECRET 키는 양 창구 동시 스탬프 없이는 열리지 않는다.",
            "관계 공동과거": "전미리와 안도한의 승인 순서 다툼을 쪽지로 나른 계약이 중심이다. 환승 당직과의 슬롯 경쟁, 호송 조장과의 우회 동맹이 한 대합실에 겹친다. 같은 환승구에서 어떤 쪽지는 구원이 되었고 어떤 쪽지는 배신으로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B010-K300에 연결된다.",
            "3막 개인 서사선": "1막에서 두복은 단선 승인 위조 교대표를 쪽지함에 가둔다. 2막에서 HP02 참관과 XT01 우회 환승 요청을 한 대합실에서 저울질한다. 3막에서 공개 폐기 또는 우회 개방의 대가를 교대 지연으로 치른다. 서사선 식별자는 STORY-B010-K300로 고정된다.",
            "분기 결말": "결말 α에서 두복은 위조 교대표 공개 폐기로 단선 승인 관행을 끊는다. 결말 β에서 그는 우회 환승 슬롯 개방으로 호송 연속을 살린다. 어느 쪽도 신내 16국 슬롯을 삭제하지 않으며, 분기 식별만 K300-OUT으로 갈라진다. 플레이 개입은 교대표 대조 입회 또는 우회 슬롯 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "단선 승인 위조 교대표를 쪽지함에 가둔다"
            },
            {
              "act": 2,
              "summary": "HP02 참관과 XT01 우회 환승 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 폐기 또는 우회 개방의 대가로 교대 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K300-OUT-A",
              "summary": "위조 교대표 공개 폐기로 단선 승인 차단"
            },
            {
              "id": "K300-OUT-B",
              "summary": "우회 환승 슬롯 개방으로 호송 연속 유지"
            }
          ]
        },
        {
          "id": "K325",
          "name": "선나휘",
          "links": {
            "house": "HP06",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B010-K325"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령 의정회 봉인함 앞에서 선나휘는 표결 쪽지를 열기 전에 봉쇄 전갈의 봉랍이 깨졌는지부터 본다. 그는 약령의정동맹의 의정회 표결 전령이자 전솔의 실무 담당자로, 봉인 없는 구두 표결을 무효라 부른다. 한국 기원으로 동북 의정권에서 자랐고, 손끝은 항상 봉랍과 의정 원장 모서리를 번갈아 만진다. 표시 이름 선나휘와 불변 식별자 K325는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 표결 쪽지를 봉인 상태로만 나르고 개표 전에 내용이 새지 않게 하는 전령 규약을 의정회에 심으려 했다. 야망은 봉인함 뚜껑 안쪽의 ‘개봉 시각 기록’ 칸에 남아 있다. 스승이 남긴 여분 봉랍 도장이 사적 약속의 씨앗이 된다. 급박한 동상 환자 보고가 와도 봉인 깨진 쪽지는 표결 칸에 올리지 못했다.",
            "가문·기업·공동체": "약령치유문(HP06)은 동상 환자 우선 안건을 내세워 전령 좌석을 요구했다. 선나휘는 후계 헌장 참관만 받고 실재 상호·제품명을 의정 원장에서 지웠다. 공동체 위치는 전솔 표결 쪽지와 영늘빛 의정 원장 순번을 같은 줄에 남긴 횟수로 증명됐다. 전속 의정 소유 요구는 봉인함 앞에서 반려된다.",
            "붕괴의 상처": "동절 연료 큐 분쟁 표결 쪽지의 봉랍이 운반 중 깨진 채 도착한 밤, 선나휘는 개표를 멈추고 사본을 별도 함에 가뒀다. 공포는 봉인 깨진 표결이 진본으로 확정되어 봉쇄 말목이 잘못 뽑히는 장면이었다. 수초롱이 말목을 뽑지 않고 기다린 덕분에 그는 LOSS 목록에 깨진 봉랍 시각만 남겼다. 회의장이 조용해진 뒤에도 봉랍 도장을 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 깨진 봉인 경로를 공개 추적할지, 동상 환자 안건만 임시 표결로 먼저 처리할지 고른 순간이다. 두만극동전구(XT04) 쪽 동상 호송 전갈이 의정 시계와 겹치자 무게가 바뀌었다. 추적을 택하면 위조 운반이 드러나지만 환자 대기가 늘고, 임시 표결을 택하면 치료는 빨라지되 봉인 규약이 흔들릴 수 있다. 그 선택은 K325-TURN으로 남고, 되돌리면 표결 전령 교대 한 칸이 비다.",
            "현재 지위": "지금도 선나휘는 의정회 표결 전령으로 점호와 봉인 큐를 지킨다. 지위는 세습이 아니라 봉랍·서명·순번 로그로만 유지된다. 약령치유문이 전속 안건 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 봉인함 열쇠는 전솔 지휘함과 영늘빛 원장함이 나눠 가진다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 봉랍이 깨진 표결 사본 한 장이다. 죄책감은 살린 봉쇄 말목과 그 밤 늦게 도착한 환자 명단 사이에서만 자란다. 전부 공개 대신 이중 입회 하의 부분 공개 절차만 남겼다. SECRET 키는 전령장과 의정 서기 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "전솔의 표결 쪽지를 봉인 상태로만 나르는 지휘, 영늘빛의 의정 원장 순번 분담은 사제에 가깝다. 수초롱이 봉쇄 전갈 전까지 말목을 뽑지 않은 계약이 동맹이었고, 안건 창구와는 우선 순번 경쟁이 남았다. 같은 회의장에서 어떤 쪽지는 구원이 되었고 어떤 쪽지는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B010-K325에 연결된다.",
            "3막 개인 서사선": "1막에서 선나휘는 봉랍 깨진 표결 쪽지의 개표를 멈춘다. 2막에서 HP06 환자 안건과 XT04 동상 호송 전갈을 한 봉인함 앞에서 저울질한다. 3막에서 공개 추적 또는 임시 표결의 대가를 의정 지연으로 치른다. 서사선 식별자는 STORY-B010-K325로 고정된다.",
            "분기 결말": "결말 α에서 선나휘는 깨진 봉인 경로 공개로 위조 운반을 차단한다. 결말 β에서 그는 동상 환자 임시 표결로 치료 연속을 살린다. 어느 쪽도 약령 16국 슬롯을 삭제하지 않으며, 분기 식별만 K325-OUT으로 갈라진다. 플레이 개입은 봉인 추적 입회 또는 환자 호송 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "봉랍 깨진 표결 쪽지의 개표를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HP06 환자 안건과 XT04 동상 호송 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 추적 또는 임시 표결의 대가로 의정 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K325-OUT-A",
              "summary": "깨진 봉인 경로 공개로 위조 운반 차단"
            },
            {
              "id": "K325-OUT-B",
              "summary": "동상 환자 임시 표결로 치료 연속 유지"
            }
          ]
        },
        {
          "id": "K350",
          "name": "천초윤",
          "links": {
            "house": "HP07",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC3",
              "STORY-B010-K350"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "아차 관문 공동승인 창구에서 천초윤은 관문 원장 봉인 봉투를 열기 전에 통과 순번 칠판의 지워진 칸부터 손으로 훑는다. 그는 아차구의관문국의 관문 공동승인 전령이자 하윤목의 실무 담당자로, 한쪽 날인만 있는 통과를 밀수 예고라 부른다. 한국 기원으로 동부 관문권에서 자랐고, 말은 낮지만 봉인 봉투 모서리의 이중 각인은 놓치지 않는다. 표시 이름 천초윤과 불변 식별자 K350은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 관문 원장과 통과 원장을 하윤목·영한뫼가 동시에 날인해야만 전령이 나르게 하는 이중 봉인 규약을 세우려 했다. 야망은 창구 옆 분필로만 남은 ‘쌍방 날인’ 네 글자였다. 스승 방마름이 남긴 여분 각인 패드가 사적 약속의 씨앗이 된다. 급행 행렬이 밀려도 한쪽 날인만 있는 통과증은 봉투에 들어가지 못했다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 교량 보수 통행 참관을 내세워 전령 좌석을 요구했다. 천초윤은 후계 헌장 참관만 받고 실재 상호·제품명을 관문 원장에서 지웠다. 공동체 위치는 하윤목 관문 원장과 영한뫼 통과 원장 순번을 같은 줄에 남긴 횟수로 증명됐다. 전속 관문 소유 요구는 창구 앞에서 반려된다.",
            "붕괴의 상처": "위조 원산지 표가 찍힌 광물 샘플 봉인이 관문에 도착한 아침, 천초윤은 전체 통과를 멈추고 샘플함만 해체 검사했다. 공포는 위조 원산지가 진본 통과로 확정되어 교량 하중이 속는 장면이었다. 그는 위조 표를 붉은 먹으로 지우고 LOSS 목록에 검사 시각만 남겼다. 창구 확성기가 꺼진 뒤에도 각인 패드를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 위조 원산지 경로를 공개 폐기할지, 교량 보수 급행 통과만 이중 날인으로 먼저 살릴지 고른 순간이다. 두만극동전구(XT04) 광물 샘플 전갈이 관문 시계와 겹치자 무게가 바뀌었다. 공개 폐기를 택하면 위조망이 드러나지만 대열이 늘고, 급행 통과를 택하면 보수는 이어지되 위조 경로가 숨을 수 있다. 그 선택은 K350-TURN으로 남고, 되돌리면 공동승인 전령 교대 한 칸이 비다.",
            "현재 지위": "지금도 천초윤은 관문 공동승인 전령으로 점호와 이중 날인 큐를 지킨다. 지위는 세습이 아니라 봉인·날인·순번 로그로만 유지된다. 한강교량공회가 전속 통행 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 봉투 열쇠는 하윤목 지휘함과 영한뫼 통과함이 나눠 가진다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 검사 전 한 번 열어 본 샘플 봉인 메모다. 죄책감은 살린 급행 보수 행렬과 그 밤 호출이 늦었던 방마름의 사본 줄 사이에서만 자란다. 전부 공개 대신 이중 날인 입회 하의 부분 공개만 남겼다. SECRET 키는 관문장과 통과 서기 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "하윤목의 관문 원장을 봉인 상태로만 나르는 지휘, 영한뫼의 통과 원장 순번 분담이 중심이다. 방마름이 전갈 사본을 같은 줄에 남긴 사제 계약, 교량 보수조와의 통행 경쟁이 한 창구에 겹친다. 같은 관문에서 어떤 봉투는 구원이 되었고 어떤 봉투는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B010-K350에 연결된다.",
            "3막 개인 서사선": "1막에서 천초윤은 위조 원산지 광물 샘플의 통과를 멈춘다. 2막에서 HP07 보수 통행과 XT04 샘플 전갈을 한 창구에서 저울질한다. 3막에서 공개 폐기 또는 급행 통과의 대가를 승인 지연으로 치른다. 서사선 식별자는 STORY-B010-K350로 고정된다.",
            "분기 결말": "결말 α에서 천초윤은 위조 원산지 공개 폐기로 공급 차단을 고른다. 결말 β에서 그는 이중 날인 급행 통과로 교량 보수 연속을 살린다. 어느 쪽도 아차 16국 슬롯을 삭제하지 않으며, 분기 식별만 K350-OUT으로 갈라진다. 플레이 개입은 샘플 검사 입회 또는 급행 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 원산지 광물 샘플의 통과를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HP07 보수 통행과 XT04 샘플 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 폐기 또는 급행 통과의 대가로 승인 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K350-OUT-A",
              "summary": "위조 원산지 공개 폐기로 공급 차단"
            },
            {
              "id": "K350-OUT-B",
              "summary": "이중 날인 급행 통과로 교량 보수 연속"
            }
          ]
        },
        {
          "id": "K375",
          "name": "선다솜",
          "links": {
            "house": "HC09",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B010-K375"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 배급 입찰 창구에서 선다솜은 낙찰 전갈 봉투를 열기 전에 입찰 조건 봉인 끈의 매듭 방향을 확인한다. 그는 가락잠실배급국의 호송 낙찰 전령이자 문도윤의 실무 담당자로, 봉인 없는 구두 낙찰을 시장 사고라 부른다. 한국 기원으로 동남 배급권에서 자랐고, 손끝은 항상 저울 눈금과 전갈 모서리를 번갈아 짚는다. 표시 이름 선다솜과 불변 식별자 K375는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 호송 낙찰을 문도윤 입찰 조건과 영미결 입찰 원장이 동시에 봉인된 뒤에만 전령이 나르게 하려 했다. 야망은 창구 옆 칠판의 ‘쌍봉인 낙찰’ 칸에 남아 있다. 방늘재와 맞춘 의료 거점 물자 표가 사적 약속의 씨앗이 된다. 급행 배급이 밀려도 한쪽 봉인만 있는 낙찰 전갈은 봉투에 들어가지 못했다.",
            "가문·기업·공동체": "도성생활유통가(HC09)는 구호 물류 참관을 내세워 낙찰 좌석을 요구했다. 선다솜은 후계 헌장 참관만 받고 실재 상호·제품명을 입찰 원장에서 지웠다. 공동체 위치는 문도윤 조건과 영미결 원장 순번을 같은 줄에 남긴 횟수로 증명됐다. 전속 배급 소유 요구는 창구 앞에서 반려된다.",
            "붕괴의 상처": "통조림 할당이 재조정되던 밤, 위조 낙찰 전갈이 의료 거점 물자 표를 덮고 들어왔다. 선다솜은 전체 게시를 멈추고 위조 매듭만 해체했다. 공포는 의료 호송이 일반 배급 칸에 섞여 온도 관리가 무너지는 장면이었다. LOSS 목록에는 위조 매듭 방향과 멈춘 입찰 슬롯 수가 적혔다. 창구 불이 꺼진 뒤에도 저울 추를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 위조 낙찰 경로를 공개 추적할지, 의료 거점 호송 칸만 먼저 낙찰해 살릴지 고른 순간이다. 해협삼로전구(XT03) 쪽 통조림 재조정 전갈이 입찰 시계와 겹치자 무게가 바뀌었다. 추적을 택하면 위조망이 드러나지만 배급 대열이 늘고, 의료 칸 우선을 택하면 거점은 살지만 위조 경로가 숨을 수 있다. 그 선택은 K375-TURN으로 남고, 되돌리면 낙찰 전령 교대 한 칸이 비다.",
            "현재 지위": "지금도 선다솜은 호송 낙찰 전령으로 점호와 쌍봉인 큐를 지킨다. 지위는 세습이 아니라 봉인·저울·순번 로그로만 유지된다. 도성생활유통가가 전속 낙찰 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 원장을 매주 맞춘다. 봉투 열쇠는 문도윤 지휘함과 영미결 원장함이 나눠 가진다.",
            "비밀·빚·죄책감": "비밀은 그가 별도 함에 가둔, 매듭 방향이 어긋난 시험 낙찰 전갈이다. 죄책감은 살린 의료 거점 칸과 그 밤 늦게 도착한 방늘재 물자 표 사이에서만 자란다. 전부 공개 대신 이중 봉인 입회 하의 부분 공개만 남겼다. SECRET 키는 낙찰장과 입찰 서기 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "문도윤의 입찰 조건을 봉인 상태로만 나르는 지휘, 영미결의 입찰 원장 순번 분담이 중심이다. 방늘재와 맞춘 의료 거점 물자는 계약이었고, 배급 창구와의 우선 칸 경쟁이 한 저울 위에 겹친다. 같은 시장에서 어떤 전갈은 구원이 되었고 어떤 전갈은 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B010-K375에 연결된다.",
            "3막 개인 서사선": "1막에서 선다솜은 위조 낙찰 전갈의 게시를 멈춘다. 2막에서 HC09 물류 참관과 XT03 통조림 재조정 전갈을 한 창구에서 저울질한다. 3막에서 공개 추적 또는 의료 칸 우선의 대가를 낙찰 지연으로 치른다. 서사선 식별자는 STORY-B010-K375로 고정된다.",
            "분기 결말": "결말 α에서 선다솜은 위조 낙찰 경로 공개로 공급 차단을 고른다. 결말 β에서 그는 의료 거점 호송 칸 우선 낙찰로 치료 물자 연속을 살린다. 어느 쪽도 가락 16국 슬롯을 삭제하지 않으며, 분기 식별만 K375-OUT으로 갈라진다. 플레이 개입은 낙찰 추적 입회 또는 의료 호송 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 낙찰 전갈의 게시를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC09 물류 참관과 XT03 통조림 재조정 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 추적 또는 의료 칸 우선의 대가로 낙찰 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K375-OUT-A",
              "summary": "위조 낙찰 경로 공개로 공급 차단"
            },
            {
              "id": "K375-OUT-B",
              "summary": "의료 거점 호송 칸 우선 낙찰로 물자 연속"
            }
          ]
        },
        {
          "id": "K058",
          "name": "정하린",
          "links": {
            "house": "HP03",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B010-K058"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 필터 복도 심사 부스에서 정하린은 생명안전 잠금 스위치를 내리기 전에 수질 표본병의 봉인 라벨부터 읽는다. 그는 마곡연구평의회의 생명안전 심사관으로, 군사감독 숫자만으로 거부권을 덮으려는 요구를 현장 사고라 부른다. 한국 출생 다문화 가정에서 자랐고, 가정 언어의 혼재는 표본 라벨 통역이 필요할 때만 언급될 뿐 진영을 나누는 근거가 되지 않는다. 이름 정하린과 식별자 K058은 불변이다.",
            "붕괴 전 삶": "붕괴 전 그는 생명안전 거부권을 현장 집행 가능한 이중 키로 만들어 연구 가동이 인명 숫자 뒤로 숨지 않게 하려 했다. 야망은 부스 벽에 분필로만 남은 ‘인명 우선 잠금’ 칸이다. 서이안과 나눈 집행 서약—잠금은 한 사람 말로 해제되지 않는다—가 훗날 빚이 된다. 배우진의 군사감독 요구가 와도 표본 봉인 없는 가동 허가는 나오지 못했다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 진료 연계 참관을 내세워 심사 좌석을 요구했다. 정하린은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 감독 소유 문장은 거절했다. 공동체 위치는 박누리와 교환한 영등포·마곡 수질 표본 로그를 양쪽에 동시에 붙인 횟수로 증명됐다. 진채온 진료 동맹이 거부권을 받치기 전에는 단독 해제 칸을 열지 않았다.",
            "붕괴의 상처": "군사감독 요구가 필터 복도 경보와 겹친 아침, 수질 표본 한 줄이 명부에서 지워져 있었다. 정하린은 잠금을 내리고 지워진 줄을 빨간 라벨로 되살렸다. 공포는 심사관이 병력 배치 도구로 전락하는 장면이었다. LOSS 목록에는 빈 표본병과 멈춘 여과 슬롯 수가 함께 적혔다. 부스가 조용해진 뒤에도 그는 이중 키를 분리해 보관했다.",
            "생존 전환점": "전환점은 지워진 표본 경로를 공개 복원해 군사감독 요구를 기록할지, 서해 쪽 계측 검증 호송만 먼저 열어 여과 연속을 살릴지 고른 순간이다. 서해곡창전구(XT02) 계측 로그 검증 요청이 부스 시계와 겹치자 무게가 바뀌었다. 공개 복원을 택하면 거부권 근거는 살지만 가동이 늦고, 호송 검증을 택하면 여과는 이어지되 감독 압력이 남을 수 있다. 선택은 K058-TURN이며 되돌리면 심사 교대 한 슬롯이 비다.",
            "현재 지위": "지금도 정하린은 생명안전 심사관으로 거부권과 표본 봉인 함을 지킨다. 지위는 세습이 아니라 잠금 로그·참관 서명·표본 교환 기록으로만 유지된다. HP03이 전속 진료 소유를 요구해도 그는 인명 없는 가동 허가를 거부한다. 이중 키는 서이안 집행함과 채무진 스위치함이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 보류 함에 남은, 군사감독 요구 직전 지워지기 직전의 표본 사진 한 장이다. 죄책감은 살린 여과 연속과 그 밤 늦게 도착한 이봄결의 무력 받침 요청 사이에서만 자란다. 전부 공개 대신 이중 키 입회 하의 부분 공개만 남겼다. SECRET 키는 심사관과 진료 동맹 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "서이안에게 맡긴 현장 집행은 지휘 계약이었고, 이봄결의 무력 받침은 동맹이었다. 박누리와의 수질 표본 교환은 계약, 배우진에 대한 원한은 기록으로만 남기며, 진채온·채무진의 잠금 연계가 한 복도에 겹친다. 같은 부스에서 어떤 잠금은 구원이 되었고 어떤 해제는 배신 증거로 읽혔다. 관계 원장 끝점은 보존된 채 STORY-B010-K058에 연결된다.",
            "3막 개인 서사선": "1막에서 정하린은 지워진 수질 표본 줄에 잠금을 내린다. 2막에서 HP03 진료 참관과 XT02 계측 검증 요청을 한 부스에서 저울질한다. 3막에서 공개 복원 또는 호송 검증의 대가를 가동 지연으로 치른다. 서사선 식별자는 STORY-B010-K058로 고정된다.",
            "분기 결말": "결말 α에서 정하린은 표본 경로 공개 복원으로 군사감독 요구를 기록 차단한다. 결말 β에서 그는 계측 검증 호송 개방으로 여과 연속을 살린다. 어느 쪽도 마곡 16국 슬롯을 삭제하지 않으며, 분기 식별만 K058-OUT으로 갈라진다. 플레이 개입은 표본 복원 입회 또는 검증 호송 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "지워진 수질 표본 줄에 생명안전 잠금을 내린다"
            },
            {
              "act": 2,
              "summary": "HP03 진료 참관과 XT02 계측 검증 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 복원 또는 호송 검증의 대가로 가동 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K058-OUT-A",
              "summary": "표본 경로 공개 복원으로 감독 요구 기록 차단"
            },
            {
              "id": "K058-OUT-B",
              "summary": "계측 검증 호송 개방으로 여과 연속 유지"
            }
          ]
        },
        {
          "id": "K086",
          "name": "임초원",
          "links": {
            "house": "HC04",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B010-K086"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "뚝섬 펌프실 뚜껑 아래에서 임초원은 압력 게이지 바늘이 떨리는 각도를 손바닥으로 가늠한 뒤 설계도를 펼친다. 그는 뚝도공방연합의 펌프기술자이자 임하준의 양자로, 총관 후계 경쟁을 기술 독점으로 바꾸는 문장을 거부한다. 한국 출생 다문화 가정 이력을 지니며, 그 이력은 부품 설명서와 가족 의례를 설명할 때만 쓰이고 충성·폭력의 예측 변수로 쓰이지 않는다. 이름 임초원과 식별자 K086은 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 펌프 해독 권한을 공개 설계와 참관 로그로만 유지해 한 가문이 수도 키를 삼키지 못하게 하려 했다. 야망은 펌프실 벽에 남은 ‘공개 해독’ 칸이다. 여민우와 나눈 맹세—해독은 독점으로 보지 않는다—가 훗날 빚이 된다. 한소미의 후계 경쟁 문서가 와도 압력 실측 없는 인준 청구는 심사하지 않았다.",
            "가문·기업·공동체": "통맥에너지연합(HC04)은 에너지 분배 참관을 내세워 펌프 좌석을 요구했다. 임초원은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 기술 소유 문장은 거절했다. 공동체 위치는 허겸과 맞춘 뚜껑 아래 공개 설계 로그를 양쪽에 붙인 횟수로 증명됐다. 강예준의 계승 인준 청구도 실측 전에는 창구에 올리지 않았다.",
            "붕괴의 상처": "귀환 열차 억류 소문이 펌프 압력을 흔든 밤, 신가온의 원한이 적힌 쪽지가 게이지 옆에 꽂혀 있었다. 임초원은 전체 가압을 멈추고 억류 구간 밸브만 분리 점검했다. 공포는 펌프가 후계 전쟁의 인질 도구가 되는 장면이었다. LOSS 목록에는 떨어진 압력 값과 멈춘 급수 가지 수가 적혔다. 뚜껑을 닫은 뒤에도 그는 해독 키를 둘로 쪼개 보관했다.",
            "생존 전환점": "전환점은 억류 압력 경로를 공개 설계로 밝힐지, 해협 쪽 밀봉 공구 호송만 먼저 가압해 배급 연속을 살릴지 고른 순간이다. 해협삼로전구(XT03) 밀봉 공구 전갈이 펌프 시계와 겹치자 무게가 바뀌었다. 공개를 택하면 인질 구조는 드러나지만 급수가 늦고, 호송 가압을 택하면 줄은 이어지되 원한 기록이 가려질 수 있다. 선택은 K086-TURN이며 되돌리면 펌프 교대 한 슬롯이 비다.",
            "현재 지위": "지금도 임초원은 펌프기술자로 해독 키와 공개 설계 함을 지킨다. 지위는 세습이 아니라 실측 로그·참관 서명·양자 계약 기록으로만 유지된다. HC04가 전속 분배 소유를 요구해도 그는 독점 해독을 거부한다. 키 절반은 여민우 맹세함, 절반은 허겸 설계함이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 뚜껑 아래 보류 서랍에 남은, 억류 소문 직전 흔들린 게이지 스케치다. 죄책감은 살린 급수 가지와 그 밤 호출이 닿지 못한 엄도한의 파견 호송 사이에서만 자란다. 전부 공개 대신 이중 참관 하의 부분 공개만 남겼다. SECRET 키는 기술자와 맹세 상대 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "한소미와의 총관 후계 경쟁, 강예준의 인준 심사는 계약과 견제다. 신가온의 원한은 기록으로만 다루고, 허겸의 뚜껑 아래 설계 맞춤과 여민우의 해독 맹세가 동맹이다. 엄도한의 파견 연구 호송 시도는 거절된 계약으로 남는다. 관계 원장 끝점은 보존된 채 STORY-B010-K086에 연결된다.",
            "3막 개인 서사선": "1막에서 임초원은 억류 소문에 흔들린 펌프 가압을 멈춘다. 2막에서 HC04 분배 참관과 XT03 밀봉 공구 전갈을 한 게이지 앞에서 저울질한다. 3막에서 공개 설계 또는 호송 가압의 대가를 급수 지연으로 치른다. 서사선 식별자는 STORY-B010-K086로 고정된다.",
            "분기 결말": "결말 α에서 임초원은 억류 압력 경로 공개로 인질 구조를 차단한다. 결말 β에서 그는 밀봉 공구 호송 가압으로 배급 연속을 살린다. 어느 쪽도 뚝도 16국 슬롯을 삭제하지 않으며, 분기 식별만 K086-OUT으로 갈라진다. 플레이 개입은 설계 공개 입회 또는 공구 호송 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "억류 소문에 흔들린 펌프 가압을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC04 분배 참관과 XT03 밀봉 공구 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 설계 또는 호송 가압의 대가로 급수 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K086-OUT-A",
              "summary": "억류 압력 경로 공개로 인질 구조 차단"
            },
            {
              "id": "K086-OUT-B",
              "summary": "밀봉 공구 호송 가압으로 배급 연속 유지"
            }
          ]
        },
        {
          "id": "K060",
          "name": "이봄결",
          "links": {
            "house": "HC10",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B010-K060"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 외곽 방재 초소에서 이봄결은 봉쇄 등잔 심지를 깎기 전에 출동 좌표판의 지워진 점부터 다시 찍는다. 그는 마곡연구평의회의 방재대장으로, 심사관 거부권을 무력으로만 받침 없이 방치하는 당직을 공백이라 부른다. 중국 이산 가정 배경을 지니며, 이산 언어는 좌표 표지와 호송 수신호를 읽을 때만 필요하고 진영 분할의 근거가 되지 않는다. 이름 이봄결과 식별자 K060은 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 방재 봉쇄와 호송 출발을 동시에만 선언하는 이중 신호를 초소 규약으로 만들려 했다. 야망은 등잔 옆 칠판에 남은 ‘동시 선언’ 칸이다. 정하린의 거부권을 현장에서 받치기로 한 지휘 서약이 훗날 빚이 된다. 단독 봉쇄 명령이 밀려도 호송 좌표 없는 등잔은 켜지지 않았다.",
            "가문·기업·공동체": "서부식문화동맹(HC10)은 식문화 구호 참관을 내세워 초소 좌석을 요구했다. 이봄결은 실재 상호 없는 후계 헌장 참관만 허용하고 전속 방재 소유 문장은 거절했다. 공동체 위치는 채봄·명해솔·진마루에게 나눈 지휘 좌표 로그를 같은 판에 남긴 횟수로 증명됐다. 구호 행렬이 이중 신호를 갖추기 전에는 봉쇄 해제 칸만 임시로 열었다.",
            "붕괴의 상처": "위조 혈연 증서를 가려내야 하는 새벽, 외곽 출동 좌표 한 점이 지워진 채 호송이 출발하려 했다. 이봄결은 등잔을 내리고 행렬을 세운 뒤 좌표판을 손으로 다시 그렸다. 공포는 방재대가 위조 증서 호위의 도구로 팔리는 장면이었다. LOSS 목록에는 지워진 점 수와 멈춘 등잔 교대만 적혔다. 초소가 조용해진 뒤에도 심지 칼을 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 위조 혈연 경로를 공개 차단할지, 아차 관문 봉인 키 분할 호송만 먼저 호위해 대열을 살릴지 고른 순간이다. 임진관문전구(XT01) 쪽 봉인 키 전갈이 초소 시계와 겹치자 무게가 바뀌었다. 공개 차단을 택하면 위조망이 드러나지만 대열이 늘고, 키 호위를 택하면 행렬은 움직이되 좌표 공백 책임이 가려질 수 있다. 선택은 K060-TURN이며 되돌리면 방재 교대 한 슬롯이 비다.",
            "현재 지위": "지금도 이봄결은 방재대장으로 등잔 심지와 동시 선언 판을 지킨다. 지위는 세습이 아니라 좌표 로그·지휘 서명·참관 기록으로만 유지된다. HC10이 전속 구호 소유를 요구해도 그는 신호 없는 봉쇄 해제를 거부한다. 등잔 열쇠는 정하린 심사함과 진마루 호송함이 나누며 Cast 현황과 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 초소 서랍에 남은, 지워지기 직전 좌표를 손으로 베낀 쪽지다. 죄책감은 살린 호송 행렬과 그 밤 늦게 도착한 명해솔의 외곽 좌표 사이에서만 자란다. 전부 공개 대신 이중 신호 입회 하의 부분 공개만 남겼다. SECRET 키는 방재대장과 심사관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "정하린의 거부권을 무력으로 받침 지휘가 중심 동맹이다. 채봄이 등잔 심지를 관문에서 이어 깎는 지휘, 명해솔의 외곽 출동 좌표, 진마루의 봉쇄 해제·호송 동시 선언이 한 초소에 겹친다. 같은 외곽에서 어떤 등잔은 구원이 되었고 어떤 출동은 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B010-K060에 연결된다.",
            "3막 개인 서사선": "1막에서 이봄결은 지워진 출동 좌표에 등잔을 내린다. 2막에서 HC10 구호 참관과 XT01 봉인 키 전갈을 한 초소에서 저울질한다. 3막에서 공개 차단 또는 키 호위의 대가를 출동 지연으로 치른다. 서사선 식별자는 STORY-B010-K060로 고정된다.",
            "분기 결말": "결말 α에서 이봄결은 위조 혈연 경로 공개 차단으로 호위 오용을 끊는다. 결말 β에서 그는 봉인 키 분할 호송 호위로 대열 연속을 살린다. 어느 쪽도 마곡 16국 슬롯을 삭제하지 않으며, 분기 식별만 K060-OUT으로 갈라진다. 플레이 개입은 좌표 복원 입회 또는 키 호송 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "지워진 출동 좌표에 봉쇄 등잔을 내린다"
            },
            {
              "act": 2,
              "summary": "HC10 구호 참관과 XT01 봉인 키 전갈을 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 차단 또는 키 호위의 대가로 출동 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K060-OUT-A",
              "summary": "위조 혈연 경로 공개 차단으로 호위 오용 차단"
            },
            {
              "id": "K060-OUT-B",
              "summary": "봉인 키 분할 호송 호위로 대열 연속 유지"
            }
          ]
        },
        {
          "id": "H10",
          "name": "윤새론",
          "links": {
            "house": "HC10",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B010-H10"
            ],
            "profile_anchor": "Cast-Index.md#S10",
            "custodian": "K240"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북산 충전 칸 관측 난간에서 윤새론은 야간 시야 모듈의 노이즈 경계를 센서 막대 숫자로만 읽는다. 합성 인간형 H10이며 호출명은 새론, 서부식문화동맹(HC10) 공동 보관 체계 아래 교체형 손모듈로 난간 잠금을 연다. 전지적 시야는 없고 배터리 잔량과 시민 참관 봉인이 행동을 제한한다. 표시 이름 윤새론과 식별자 H10은 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 숙영 정전 지도를 참관 로그에 공개해 단독 원격 잠금을 막으려는 목표가 남아 있다. 야망에 해당하는 우선순위는 충전 칸 측면의 잔량 그래프에 점으로만 찍혀 있다. 주정비 백온이 남긴 예비 배터리 슬롯 하나가 연속성 부채의 자리였다. 삼자 서명 없는 양도 명령은 실행 큐에 오르지 않았다.",
            "가문·기업·공동체": "서부식문화동맹(HC10)은 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 윤새론의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 공동체 위치는 스냅샷 교대 단위가 양쪽에 동시에 기록된 횟수로 증명된다. 전속 국가 소유 요구는 충전 칸 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "임진 방향 정전 파동이 관측 난간을 흑백 노이즈로 덮은 밤, 윤새론은 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 잠금을 걸었다. 공포에 해당하는 최고 우선 경보는 오탐 경로가 귀환 명부 호송을 적대 표적으로 바꾸는 시나리오였다. LOSS 목록에는 끊긴 노드 번호와 배터리 하한만 적혔다. 비상 전원이 돌아와도 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "전환점은 노이즈 노드를 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 귀환 명부 우회 메시만 살릴지다. 임진관문전구(XT01) 쪽 명부 재발급 경로 요청이 충전 칸 수신함에 겹쳤다. 공개 분해를 택하면 원인 공급 코드가 드러나고, 우회 메시만 살리면 다른 숙영 공백이 길어진다. H10-TURN은 그 수신 큐의 정렬 결과다.",
            "현재 지위": "윤새론은 여전히 S10 구역 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC10이 전속 원격 소유를 요구해도 거부 코드를 반환하고, Cast 프로필의 현황 칸과 스냅샷 해시를 교대마다 맞춘다. 충전 칸 열쇠 권한은 백온 주정비와 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀에 해당하는 제한 로그는 참관 없이 한 번 올라간 펌웨어 패치 한 줄이다. 죄책감에 해당하는 가중치는 살린 우회 메시 노드와 그 교대에 호출하지 못한 예비 슬롯 사이에서만 증가한다. 전부 공개 대신 이중 참관 하의 부분 로그 공개 절차만 남겼다. SECRET 플래그는 보관 책임 백온과 시민 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "백온(K240)의 주정비·법적 책임은 보관 계약 코드였고, K067과의 교대 협력은 동맹 큐였다. HC10 참관과의 원격 잠금 경쟁, 숙영 전령 소두와의 명부 스냅샷 공유가 한 충전 칸에 겹친다. 같은 노드에서 어떤 경로는 구원으로 기록되었고 어떤 경로는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B010-H10에 연결된다.",
            "3막 개인 서사선": "1막에서 윤새론은 정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HC10 원격 요구와 XT01 명부 경로 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 우회 회생의 대가를 숙영 공백 시간으로 치른다. 서사선 식별자는 STORY-B010-H10로 고정된다.",
            "분기 결말": "결말 α에서 윤새론은 노이즈 노드 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 우회 메시로 귀환 명부 호송 연속을 지킨다. 어느 쪽도 HC10 보관 슬롯을 삭제하지 않으며, 분기 식별만 H10-OUT으로 갈라진다. 플레이 개입은 분해 입회 또는 우회 전원 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC10 원격 요구와 XT01 명부 경로를 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 우회 회생의 대가로 숙영 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H10-OUT-A",
              "summary": "노이즈 노드 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H10-OUT-B",
              "summary": "예비 배터리 우회 메시로 명부 호송 연속"
            }
          ]
        }
      ]
    },
    "B011": {
      "id": "B011",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K399",
          "name": "판지솔",
          "links": {
            "house": "HC14",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B011-K399"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 광장 추첨함 앞에서 판지솔은 구슬 무게를 저울에 올린 뒤 전갈 봉인을 찍는다. 이중 의회 전령으로, 안태경 실무를 맡아 시민추첨 명부와 기업 의회 서명을 한 손에 동시에 든다. 한국 기원으로 수서강남협약도시에서 자랐고, 숨이 차도 사본 두 장은 절대 한 장으로 합치지 않는다. 표시 이름 판지솔과 불변 식별자 K399는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 시민추첨이 보호조약 비준의 필수 날인이 되게 해 기술기업 의회만의 서명을 전령로에서 무효로 만들려 했다. 야망은 광장 벽에 분필로 남은 추첨 순번표였다. 서고 열쇠 고리에 매달린 여분 봉인 도장이 사적 약속의 씨앗이다. 기업 추천이 추첨을 삼키는 전갈은 모욕으로만 적혔다.",
            "가문·기업·공동체": "여의장부원(HC14)은 이중서명 장부를 의무 조항으로 내밀었다. 판지솔은 후계 헌장 참관만 받고 실재 상호·제품명을 전갈 원장에서 지웠다. 공동체 위치는 추첨 명부와 출석을 광장과 서고에 동시에 붙인 횟수로 증명됐다. 전속 국가 소유 요구는 전령 가방 자물쇠 앞에서 반려된다.",
            "붕괴의 상처": "보호조약 세 건이 동시에 비준 안건으로 올라오고 추첨 명부에 강국 호적 번호가 섞인 새벽, 판지솔은 비준 전갈을 가방에 잠그고 광장 확성기를 끊었다. 공포는 그 한 장이 약소국 연합을 암사 대리 투표장으로 바꾸는 장면이었다. 그는 섞인 번호를 붉은 먹으로 지우고 LOSS 목록에 시각만 남겼다. 광장이 조용해진 뒤에도 구슬 주머니를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 섞인 호적을 공개 걸러낼지, 추첨을 연기해 기업 의회만 먼저 서명하게 할지 고른 순간이다. 임진관문전구(XT01) 쪽 비준 독촉이 확성기와 겹치자 계산이 달라졌다. 걸러내기를 택하면 조약 일정이 밀리고, 연기를 택하면 시민추첨 칸이 하루 더 빈다. 그 선택은 K399-TURN으로 남고, 되돌리면 수서 일부 전령 슬롯이 비다.",
            "현재 지위": "지금도 판지솔은 수서 이중 의회 전령으로 점호와 추첨 큐를 지킨다. 지위는 세습이 아니라 봉인·출석·감사표 로그로만 유지된다. 여의장부원이 전속 서명 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 명부를 매주 맞춘다. 가방 열쇠는 두 자루로 나뉘어 한 자루는 광장 당직, 다른 한 자루는 서고 참관이 보관한다.",
            "비밀·빚·죄책감": "비밀은 그가 서고 서랍에 남긴, 하루 먼저 열어 본 기업 의회 초안 메모 한 장이다. 죄책감은 살린 시민 추첨 명단과 그 밤 호출하지 못한 하서진 표준 서식 사이에서만 자란다. 전부를 공개하면 비준 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다. SECRET 키는 전령장과 감사 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "안태경의 추첨 쪽지는 봉인 지휘였고, 천늘우의 추첨 원장은 순번 동업이었다. 곽은재의 감사표가 도착하기 전 전갈을 참은 밤은 동맹이었으며, 기업 의회 서기와는 서명 순서를 두고 경쟁이 남았다. 같은 광장에서 어떤 구슬은 구원이 되었고 어떤 호적 번호는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K399에 연결된다.",
            "3막 개인 서사선": "1막에서 판지솔은 강국 호적이 섞인 비준 전갈을 가방에 잠근다. 2막에서 그는 HC14 이중서명 요구와 XT01 비준 독촉을 광장 책상에서 저울질한다. 3막에서 호적 걸러내기 또는 추첨 연기의 대가를 전령 지연으로 치른다. 서사선 식별자는 STORY-B011-K399로 고정된다.",
            "분기 결말": "결말 α에서 판지솔은 섞인 호적 공개 걸러내기로 시민추첨 날인을 지킨다. 결말 β에서 그는 추첨을 연기해 기업 의회 서명을 먼저 받게 한다. 어느 쪽도 수서강남협약도시 슬롯을 삭제하지 않으며, 분기 식별만 K399-OUT으로 갈라진다. 플레이 개입은 호적 대조 또는 추첨 연기 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "강국 호적이 섞인 비준 전갈을 가방에 잠근다"
            },
            {
              "act": 2,
              "summary": "HC14 이중서명과 XT01 비준 독촉을 광장에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "호적 걸러내기 또는 추첨 연기의 대가로 전령 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K399-OUT-A",
              "summary": "섞인 호적 공개 걸러내기로 시민추첨 날인 유지"
            },
            {
              "id": "K399-OUT-B",
              "summary": "추첨 연기로 기업 의회 서명 선행"
            }
          ]
        },
        {
          "id": "K012",
          "name": "진하겸",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B011-K012"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "여의도 선창 의무소 소독 선반에서 진하겸은 탁수 설사 냄새를 상처 피보다 먼저 맡는다. 여의도 수문의무원으로, 급수표를 치료 순서로 바꾸라는 쪽지는 찢어 난로에 넣는다. 한국 기원으로 여의신정수문정부 구역에서 자랐고, 온화해 보여도 소독수 재고가 비면 회의 의자부터 치운다. 표시 이름 진하겸과 불변 식별자 K012는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 수문 경비와 선창 노동자의 방역 주기를 수문헌장 부칙으로 올려 집단 단수 구역에도 의무 최저선을 남기려 했다. 야망은 의무소 벽  분필 칸에만 남은 방역 주기표였다. 서랍 안 여분 시약 앰플 세 병이 사적 약속의 씨앗이다. 총재의 독촉이 와도 기준 미달 원수 날에는 선창 진료를 열지 않았다.",
            "가문·기업·공동체": "아리수수문가(HP01) 여의도 당직함은 선창 수문 키를 네 조각으로 쪼개 보관하라고 못 박았다. 진하겸은 참관 코드만 받고 환자 차트에서 실재 상호를 지운 채 시약 묶음과 탁도 수치를 같은 게시판에 못질했다. 공동 위치는 단수 구역 의무 최저선을 수문헌장 부칙 초안에 올린 횟수로만 셈한다. 전속 소유 요구가 와도 그는 선창 배수로 쪽에서 키 조각을 넘기지 않는다.",
            "붕괴의 상처": "폭우 뒤 영등포 원수 탁도가 기준을 넘은 밤, 진하겸은 여의도 선창 의무소를 봉쇄하고 한재목의 공급 유지 지시를 창밖 배수로에 붙였다. 공포는 탁수가 골목에 퍼진 뒤에야 약이 도착해 의무소가 단수 제재의 면죄부가 되는 장면이었다. 그는 초과 탁도 수치만 LOSS 목록에 남기고 시약 열쇠를 둘로 쪼갰다. 선창이 조용해져도 소독 장갑을 벗지 않았다.",
            "생존 전환점": "전환점은 대체 시약 호송으로 봉쇄를 풀지, 급수표로 치료 순서를 바꾼 쪽지를 공개 폭로할지 고른 순간이다. 서해곡창전구(XT02) 쪽 식수 요청이 확성기와 겹치자 계산이 달라졌다. 호송을 택하면 봉쇄는 짧아지지만 쪽지 발신자가 숨을 수 있고, 폭로를 택하면 순서는 바로잡히되 시약 도착이 하루 밀린다. 그 선택은 K012-TURN으로 남는다.",
            "현재 지위": "진하겸은 여의도 선창 의무소 당직으로 아침 점호와 시약 큐를 연다. 자리는 세습이 아니라 탁도 일지·환자 명부·입회 서명으로만 유지된다. 아리수수문가의 전속 진료 요청에도 배수로 쪽 키 조각은 넘기지 않고 Cast 현황 칸과 원수 수치를 매일 맞춘다. 의무소 철문 열쇠는 반장 주머니와 수질 참관 봉투로 나뉜다.",
            "비밀·빚·죄책감": "비밀은 난로 재 속에서 건진 급수표 쪽지 반 장과, 그 쪽지를 찢기 전 읽은 시각이다. 죄책감은 살린 선창 노동자 팔찌 숫자와 호출 못 한 박누리 탁도 표본 시각 사이에서만 자란다. 전부 공개 대신 의무장·수문 참관이 함께 서명한 부분 공개 쪽지만 서랍에 남겼다. SECRET 칸 열쇠는 두 서명이 겹치기 전에는 돌아가지 않는다.",
            "관계 공동과거": "박누리의 수질 표본이 기준을 넘기면 진료를 잠그는 계약이었고, 임바다의 시민 급수권 맹세는 환자 명부로 받쳤다. 류은비에게 약재 호송을 빚진 밤이 동맹이었으며, 한재목의 공급 유지 지시와는 선창 문 앞에서 충돌이 남았다. 같은 의무소에서 어떤 시약은 구원이 되었고 어떤 쪽지는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K012에 연결된다.",
            "3막 개인 서사선": "1막에서 진하겸은 탁도 초과 원수에 선창 의무소를 봉쇄한다. 2막에서 HP01 키 분할과 XT02 식수 요청을 소독 선반 위에서 저울질한다. 3막에서 시약 호송 또는 쪽지 폭로의 대가를 진료 공백으로 치른다. 서사선 식별자는 STORY-B011-K012로 고정된다.",
            "분기 결말": "결말 α에서 진하겸은 대체 시약 호송으로 봉쇄를 짧게 푼다. 결말 β에서 급수표 치료 순서 쪽지를 공개 폭로한다. 어느 쪽도 여의신정수문정부 슬롯을 삭제하지 않으며, 분기 식별만 K012-OUT으로 갈라진다. 플레이 개입은 시약 호송 또는 쪽지 폭로 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "탁도 초과 원수에 선창 의무소를 봉쇄한다"
            },
            {
              "act": 2,
              "summary": "HP01 키 분할과 XT02 식수 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "시약 호송 또는 쪽지 폭로의 대가로 진료 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K012-OUT-A",
              "summary": "대체 시약 호송으로 선창 봉쇄 해제"
            },
            {
              "id": "K012-OUT-B",
              "summary": "급수표 치료 순서 쪽지 공개 폭로"
            }
          ]
        },
        {
          "id": "K040",
          "name": "진우람",
          "links": {
            "house": "HC07",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B011-K040"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "금천 공방 분진 진료실 문턱에서 진우람은 용접 불꽃보다 먼저 기침 소리를 센다. 금천 공방의무원으로, 방호 필터를 전리품처럼 쌓는 장교 명단은 재앙 칸에만 적는다. 한국 기원으로 서남제작동맹에서 자랐고, 자비로워 보여도 공복 상태의 숫자 놀음에는 출고 도장을 주지 않는다. 표시 이름 진우람과 불변 식별자 K040은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 방호 필터와 공방 진료를 복구복무자 시민권 조건으로 묶어 제작동맹이 군복이 아니어도 숨 쉬게 하려 했다. 야망은 진료실 칠판 한쪽에만 남은 필터 출고 표였다. 작업반 사물함에 숨긴 여분 원단 두 롤이 사적 약속의 씨앗이다. 군수 우선 배정은 방재 표본이 기준을 넘을 때만 허용됐다.",
            "가문·기업·공동체": "해동제철성(HC07)은 공방 방호 우선 출고를 의무 조항으로 내밀었다. 진우람은 후계 헌장 참관만 받고 실재 상호·제품명을 진료 원장에서 지웠다. 공동체 위치는 진료 인원과 필터 출고를 같은 칠판에 쓴 횟수로 증명됐다. 전속 국가 소유 요구는 분진 커튼 앞에서 반려된다.",
            "붕괴의 상처": "폭우 뒤 탁수 소문이 금천 골목에 퍼진 새벽, 진우람은 필터 재고를 정수 작업반 진료와 차단문조 사이에 나눠 직능 투표함을 열었다. 공포는 필터 원단이 동부 보호계약에 묶여 작업반이 분진 속에 방치되는 장면이었다. 그는 투표 전 출고된 상자 번호를 LOSS에만 남기고 칠판을 잠갔다. 공방이 조용해져도 청진기를 목에서 풀지 않았다.",
            "생존 전환점": "전환점은 대체 원단을 구해 정수 작업반 진료를 살릴지, 군수 창고에 숨긴 필터를 폭로해 투표 방향을 돌릴지다. 해협삼로전구(XT03) 쪽 호송 요청이 확성기와 겹치자 계산이 달라졌다. 원단 확보를 택하면 기침은 줄지만 창고 장교가 숨을 수 있고, 폭로를 택하면 투표는 기울되 당일 필터 장이 비다. 그 선택은 K040-TURN으로 남는다.",
            "현재 지위": "지금도 진우람은 금천 공방의무원으로 점호와 필터 큐를 지킨다. 지위는 세습이 아니라 칠판·인증 도장·입회 로그로만 유지된다. 해동제철성이 전속 방호 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 출고 표를 매주 맞춘다. 진료실 열쇠는 작업반 대표와 방재 참관이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 사물함 바닥에 남긴, 투표 전 차단문조에 흘려 보낸 필터 반 롤 메모다. 죄책감은 살린 작업반 명단과 그 밤 호출하지 못한 한지온 배급 솥 사이에서만 자란다. 전부 공개 대신 직능 입회 하의 부분 공개만 남겼다. SECRET 칸은 의무원과 방재 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "임채원의 필터 규격은 진료에 적용하는 사제 관계였고, 한지온의 배급 솥이 비면 의무 배식을 여는 동맹이었다. 최은재의 필터 인증 도장이 떨어지면 출고를 잠근 밤은 계약이었으며, 차단문조 장교와는 투표함을 두고 경쟁이 남았다. 같은 칠판에서 어떤 원단은 구원이 되었고 어떤 상자는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K040에 연결된다.",
            "3막 개인 서사선": "1막에서 진우람은 탁수 소문 속 필터 배분을 직능 투표에 부친다. 2막에서 HC07 방호 우선과 XT03 호송 요청을 칠판 위에서 저울질한다. 3막에서 원단 확보 또는 창고 폭로의 대가를 당일 필터 공백으로 치른다. 서사선 식별자는 STORY-B011-K040로 고정된다.",
            "분기 결말": "결말 α에서 진우람은 대체 원단으로 정수 작업반 진료를 살린다. 결말 β에서 군수 창고 숨김 필터를 공개 폭로한다. 어느 쪽도 서남제작동맹 슬롯을 삭제하지 않으며, 분기 식별만 K040-OUT으로 갈라진다. 플레이 개입은 원단 호송 또는 창고 폭로 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "탁수 소문 속 필터 배분을 직능 투표에 부친다"
            },
            {
              "act": 2,
              "summary": "HC07 방호 우선과 XT03 호송을 칠판에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "원단 확보 또는 창고 폭로의 대가로 필터 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K040-OUT-A",
              "summary": "대체 원단으로 정수 작업반 진료 유지"
            },
            {
              "id": "K040-OUT-B",
              "summary": "군수 창고 숨김 필터 공개 폭로"
            }
          ]
        },
        {
          "id": "K068",
          "name": "진채온",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B011-K068"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 밀폐실험동 방풍실에서 진채온은 재현되지 않은 처방 라벨을 실험 일지보다 먼저 떼어 낸다. 실험동 안전의무원으로, 긴급 회의 중에도 시약 봉인 스티커  여부를 손톱으로 확인한다. 한국 기원으로 마곡연구평의회에서 자랐고, 원칙이 뼈보다 단단해 기준 미달 반출에는 연구책임자 독촉도 통하지 않는다. 표시 이름 진채온과 불변 식별자 K068은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 연구자 파견 인원의 방역 기록을 공동기술원장 첫 조항으로 올려 연구자를 인질로 쓰는 진료 거래를 무효로 만들려 했다. 야망은 방풍실 유리에 유성 펜으로만 남은 파견 체크리스트였다. 사물함 안 여분 봉인 롤이 사적 약속의 씨앗이다. 재현 로그 없는 처방은 반출 도장을 받지 못했다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 생체 데이터셋 격리 키를 의무 조항으로 내밀었다. 진채온은 후계 헌장 참관만 받고 실재 상호·제품명을 안전 원장에서 지웠다. 공동체 위치는 파견 진료에 재현 가능 실험 기록을 붙인 횟수로 증명됐다. 전속 국가 소유 요구는 방풍실 이중문 앞에서 반려된다.",
            "붕괴의 상처": "뚝도 수질 검사망이 멈춘 밤, 진채온은 연구자 파견과 후계 인준을 한 거래로 묶으려는 강국 제안에 진료 거부를 선포하고 반출 문을 잠갔다. 공포는 보호를 명분으로 진료 기록이 군사 감독 문서로 바뀌고 의무원이 세습 직능 인질이 되는 장면이었다. 그는 거부 시각만 LOSS에 남기고 표본 트레이를 격리 칸으로 옮겼다. 실험동이 조용해져도 봉인 테이프를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 오염 표본을 실험동까지 호송해 거부를 뒷받침할지, 진료 기록 누락을 찾아 파견 거래를 성사시킬지다. 원양신탁전구(XT05) 쪽 검사 의뢰가 수신함에 겹치자 계산이 달라졌다. 호송을 택하면 거부는 단단해지지만 파견 일정이 밀리고, 누락 찾기를 택하면 거래는 열리되 기록 한 칸이 군사 감시에 노출될 수 있다. 그 선택은 K068-TURN으로 남는다.",
            "현재 지위": "지금도 진채온은 실험동 안전의무원으로 점호와 봉인 큐를 지킨다. 지위는 세습이 아니라 재현 로그·봉인·입회 서명으로만 유지된다. 백광생활과학가가 전속 표본 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 안전 일지를 교대마다 맞춘다. 방풍실 키는 안전의무와 연구 참관이 나눠 쥔다.",
            "비밀·빚·죄책감": "비밀은 그가 격리 칸 아래에 둔, 하루 미룬 파견자 체온 메모 한 줄이다. 죄책감은 지킨 거부 명단과 그 밤 호출하지 못한 서이안 안전심사 사이에서만 자란다. 전부 공개 대신 이중 참관 하의 부분 로그 공개만 남겼다. SECRET 플래그는 안전의무와 연구 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "정하린의 거부권을 진료 쪽에서 집행하는 동맹이었고, 서이안의 안전심사 원칙은 사제로 배웠다. 류은비의 약효 검증에 실험동 표본을 보낸 밤은 계약이었으며, 강국 파견 중개자와는 반출 문을 두고 경쟁이 남았다. 같은 방풍실에서 어떤 표본은 구원이 되었고 어떤 인준 거래는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K068에 연결된다.",
            "3막 개인 서사선": "1막에서 진채온은 파견·인준 묶음 거래에 진료 거부를 선포한다. 2막에서 HC03 격리 키와 XT05 검사 의뢰를 방풍실에서 저울질한다. 3막에서 표본 호송 또는 기록 누락 노출의 대가를 파견 공백으로 치른다. 서사선 식별자는 STORY-B011-K068로 고정된다.",
            "분기 결말": "결말 α에서 진채온은 오염 표본 호송으로 진료 거부를 확정한다. 결말 β에서 진료 기록 누락을 찾아 파견 거래를 조건부 성사시킨다. 어느 쪽도 마곡연구평의회 슬롯을 삭제하지 않으며, 분기 식별만 K068-OUT으로 갈라진다. 플레이 개입은 표본 호송 또는 누락 추적 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "파견·인준 묶음 거래에 진료 거부를 선포한다"
            },
            {
              "act": 2,
              "summary": "HC03 격리 키와 XT05 검사 의뢰를 저울질한다"
            },
            {
              "act": 3,
              "summary": "표본 호송 또는 기록 누락 노출의 대가로 파견 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K068-OUT-A",
              "summary": "오염 표본 호송으로 진료 거부 확정"
            },
            {
              "id": "K068-OUT-B",
              "summary": "기록 누락 추적으로 파견 거래 조건부 성사"
            }
          ]
        },
        {
          "id": "K096",
          "name": "구도영",
          "links": {
            "house": "HP07",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B011-K096"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "성수 선창 패킹 저울 앞에서 구도영은 상자 끈 매듭이 공방마다 다르면 출처를 묻지 않고 되돌린다. 성수 패킹운송 물류상으로, 나룻배 시각을 속이는 운송을 재치로 포장해도 저울 눈금 앞에서는 웃지 않는다. 한국 기원으로 뚝도공방연합에서 자랐고, 끈 색이 다른 상자를 한 배에 억지로 태우지 않는다. 표시 이름 구도영과 불변 식별자 K096은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 끈 색이 다른 상자를 한 배에 태워 물과 나사가 선창을 서로 붙잡지 못하게 하는 규칙을 밀어 붙였다. 야망은 선창 칠판에 분필로만 남은 나룻배 시각표였다. 창고 서랍의 여분 패킹 끈 한 묶음이 사적 약속의 씨앗이다. 군수 상자는 민수 패킹이 같은 배에 한 줄 실린 뒤에만 탔다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 풍속 폐쇄 기준과 선창 우회 조항을 의무로 내밀었다. 구도영은 후계 헌장 참관만 받고 실재 상호·제품명을 운송 원장에서 지웠다. 공동체 위치는 끈 매듭과 나룻배 시각을 선창 칠판에 적은 횟수로 증명됐다. 전속 국가 소유 요구는 저울 덮개 앞에서 반려된다.",
            "붕괴의 상처": "동부 교량 통행세가 가죽 상자에 붙은 아침, 구도영은 패킹 끈만 구의 쪽 나룻배로 돌리고 군화 상자는 성수 선창에 쌓아 두었다. 공포는 군화만 배에 오르고 민수 패킹이 선창에서 썩는 장면이었다. 그는 통행세 전표 번호만 LOSS에 남기고 저울을 잠갔다. 선창이 조용해져도 매듭 칼을 허리에서 풀지 않았다.",
            "생존 전환점": "전환점은 통행세 없는 우회 배를 열지, 선창에 쌓인 군화의 발주 쪽지를 칠판에 붙일지다. 임진관문전구(XT01) 쪽 군수 독촉이 확성기와 겹치자 계산이 달라졌다. 우회를 택하면 민수는 살아나지만 교량 감사 칸이 비고, 쪽지 공개를 택하면 발주자가 드러나되 당일 배가 한 편 준다. 그 선택은 K096-TURN으로 남는다.",
            "현재 지위": "지금도 구도영은 성수 패킹운송 물류상으로 점호와 저울 큐를 지킨다. 지위는 세습이 아니라 칠판·매듭·입회 로그로만 유지된다. 한강교량공회가 전속 선창 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 운송 표를 매일 맞춘다. 선창 열쇠는 물류 당직과 교량 참관이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 창고 천장에 밀어 둔, 통행세 전 밤에 먼저 보낸 민수 반 짐 메모다. 죄책감은 살린 패킹 명단과 그 밤 호출하지 못한 유하은 가죽 마감 사이에서만 자란다. 전부 공개 대신 선창 입회 하의 부분 공개만 남겼다. SECRET 칸은 물류상과 교량 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "유하은의 가죽 마감 시각에 맞춰 상자를 싣는 계약이었고, 한소미의 공정 분할에서 패킹 끈 색을 나눈 동맹이었다. 임채원의 방호 원단 상자와 선창을 다투면서도 필터 패킹은 같은 배에 실은 밤은 타협이었으며, 동부 통행세 징수원과는 저울을 두고 경쟁이 남았다. 같은 선창에서 어떤 끈은 구원이 되었고 어떤 군화 상자는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K096에 연결된다.",
            "3막 개인 서사선": "1막에서 구도영은 통행세 붙은 가죽 상자 경로를 나룻배로 돌린다. 2막에서 HP07 폐쇄 기준과 XT01 군수 독촉을 저울 위에서 저울질한다. 3막에서 우회 배 또는 발주 쪽지 공개의 대가를 선창 적체로 치른다. 서사선 식별자는 STORY-B011-K096로 고정된다.",
            "분기 결말": "결말 α에서 구도영은 통행세 없는 우회 배로 민수 패킹을 살린다. 결말 β에서 군화 발주 쪽지를 선창 칠판에 공개한다. 어느 쪽도 뚝도공방연합 슬롯을 삭제하지 않으며, 분기 식별만 K096-OUT으로 갈라진다. 플레이 개입은 우회 배 개방 또는 발주 쪽지 공개 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "통행세 붙은 가죽 상자 경로를 나룻배로 돌린다"
            },
            {
              "act": 2,
              "summary": "HP07 폐쇄 기준과 XT01 군수 독촉을 저울질한다"
            },
            {
              "act": 3,
              "summary": "우회 배 또는 발주 쪽지 공개의 대가로 선창 적체를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K096-OUT-A",
              "summary": "통행세 없는 우회 배로 민수 패킹 유지"
            },
            {
              "id": "K096-OUT-B",
              "summary": "군화 발주 쪽지 선창 칠판 공개"
            }
          ]
        },
        {
          "id": "K125",
          "name": "차나루",
          "links": {
            "house": "HP01",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B011-K125"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "암사 정수장 2번 여과탑 아래 진료 창구에서 차나루는 배급표 빈칸을 환자 팔찌보다 먼저 읽는다. 암사 정수 의무원으로, 등록 거부 가족을 장교 수첩과 한 줄에 섞지 않는다. 한국 기원으로 암사고덕상수단에서 자랐고, 온화해 보여도 소독수 재고가 바닥나면 정수장 진료 셔터를 내린다. 표시 이름 차나루와 불변 식별자 K125는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 상수호위단과 급수구역 노동자의 방역 주기를 보호계약 부칙으로 올려 강제복무 등록소에도 의무 최저선을 남기려 했다. 야망은 여과탑 벽에 유성 펜으로만 남은 방역 교대표였다. 창구 서랍의 여분 팔찌 한 묶음이 사적 약속의 씨앗이다. 가족 단위 등록 거부자는 행정청 칸으로만 넘겨졌다.",
            "가문·기업·공동체": "암사 쪽 아리수수문가(HP01) 창구는 정수 키와 행정 키를 서로 다른 주머니에 넣게 한다. 차나루는 가문 호칭 대신 창구 번호만 원장에 남기고, 거부 가족 팔찌와 시약 재고를 여과탑 벽에 나란히 붙인다. 공동체 자리는 장교 수첩과 분리된 행정청 이송 로그가 쌓인 두께로 증명된다. 국가 전속 요청이 와도 여과탑 잠금 숫자만 돌려 주고 키 실물은 내놓지 않는다.",
            "붕괴의 상처": "암사 순찰대가 급수와 복무를 한 줄로 묶은 오후, 차나루는 등록 거부 가족의 진료를 창구 밖에 공개 게시하고 훈련장 이송 들것을 돌려보냈다. 공포는 북산으로 도망친 가족의 빈 배급표가 환자 명부까지 지워 의무소가 복무 거부 낙인 창구가 되는 장면이었다. 그는 거부 가족 이니셜만 LOSS에 남기고 장교 수첩 복사를 거절했다. 정수장이 조용해져도 팔찌 프린터를 끄지 않았다.",
            "생존 전환점": "전환점은 대체 시약으로 진료 창구를 유지할지, 거부 명단을 장교에게 넘겨 의무원을 위태롭게 할지다. 두만극동전구(XT04) 쪽 의료 회랑 요청이 확성기와 겹치자 계산이 달라졌다. 시약 유지를 택하면 낙인 창구는 막지만 회랑 배정이 밀리고, 명단 인도를 택하면 회랑은 열리되 가족 한 칸이 수첩에 남는다. 그 선택은 K125-TURN으로 남는다.",
            "현재 지위": "차나루는 암사 정수장 2번 창구 당직으로 팔찌 프린터와 배급 분리표를 돌린다. 자리는 세습이 아니라 창구 로그·행정 이송·시약 재고 해시로만 유지된다. 수문가의 전속 정수 진료 요구에도 여과탑 잠금만 돌려 주고 Cast 현황과 거부 가족 게시 시각을 맞춘다. 창구 셔터 키는 의무 당직과 행정 참관이 번갈아 보관한다.",
            "비밀·빚·죄책감": "비밀은 여과탑 점검구에 접어 둔 훈련장 들것 묵인 시각표다. 죄책감은 공개 게시한 거부 가족 이니셜과, 그 교대에 부르지 못한 최도윤 시민 명부 쪽지 사이에서만 커진다. 창구 전체 공개 대신 행정·의무가 동시에 찍은 부분 공개 도장만 남겨 두었다. SECRET 스탬프는 쌍방 입회 없이는 잉크가 나오지 않는다.",
            "관계 공동과거": "최도윤의 시민 명부를 진료 쪽에서 받치는 보호체류에 가까웠고, 정소율의 급수표와 치료 순서를 계약으로 나눴다. 류은비에게 약재 호송을 빚진 밤이 동맹이었으며, 순찰대 장교와는 들것 방향을 두고 충돌이 남았다. 같은 창구에서 어떤 팔찌는 구원이 되었고 어떤 수첩 복사 요구는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K125에 연결된다.",
            "3막 개인 서사선": "1막에서 차나루는 급수·복무 묶음에 거부 가족 진료를 공개 게시한다. 2막에서 HP01 키 분할과 XT04 회랑 요청을 창구에서 저울질한다. 3막에서 시약 유지 또는 명단 인도의 대가를 창구 공백으로 치른다. 서사선 식별자는 STORY-B011-K125로 고정된다.",
            "분기 결말": "결말 α에서 차나루는 대체 시약으로 정수 진료 창구를 유지한다. 결말 β에서 거부 명단을 장교 수첩에 넘겨 회랑을 연다. 어느 쪽도 암사고덕상수단 슬롯을 삭제하지 않으며, 분기 식별만 K125-OUT으로 갈라진다. 플레이 개입은 시약 호송 또는 명단 인도 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "급수·복무 묶음에 거부 가족 진료를 공개 게시한다"
            },
            {
              "act": 2,
              "summary": "HP01 키 분할과 XT04 회랑 요청을 창구에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "시약 유지 또는 명단 인도의 대가로 창구 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K125-OUT-A",
              "summary": "대체 시약으로 정수 진료 창구 유지"
            },
            {
              "id": "K125-OUT-B",
              "summary": "거부 명단 장교 인도로 의료 회랑 개방"
            }
          ]
        },
        {
          "id": "K115",
          "name": "김우찬",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B011-K115"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "암사 호위단 작전 책상 위에서 김우찬은 이중 언어 주석이 빠진 배차 쪽지를 접어 반려한다. 상수호위단 참모장으로, 한국 출생 다문화 가정에서 자랐고 집 안 말은 섞여도 작전표 서식은 표준 한국어와 병기 주석만 받는다. 규율과 속도를 총사령과 나누되, 부하 가족 급수표가 밀리면 자신이 순찰열차 칸에 오른다. 표시 이름 김우찬과 불변 식별자 K115는 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 동부 급수망과 교량을 장교 지휘 아래 하나의 보호정부 작전표로 묶어 배우진의 후계 참모가 되려 했다. 야망은 책상 유리 아래에 끼워 둔 연필 작전 스케치였다. 사물함의 여분 암호 패치 카드가 사적 약속의 씨앗이다. 민간 행정관이 물을 거래 카드로 쓰는 초안은 게시판에 올리지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 궤도 경비와 비상 배차 우선을 의무 조항으로 내밀었다. 김우찬은 후계 헌장 참관만 받고 실재 상호·제품명을 작전 원장에서 지웠다. 공동체 위치는 복구 실적을 게시하되 비밀 장교 인맥 배차를 이중 언어 주석으로 남긴 횟수로 증명됐다. 전속 국가 소유 요구는 작전 책상 봉인 앞에서 반려된다.",
            "붕괴의 상처": "임하준 실종을 뚝도 통치 실패로 규정한 보호군 파견안 세부 편성을 그가 쓰던 밤, 북산 가족 급수권을 복무계약과 묶는 조항이 첫 줄에 들어갔다. 공포는 민간 행정관이 물을 카드로 써서 장교망이 공식 명령 밖으로 밀려나는 장면이었다. 그는 조항 초안 번호만 LOSS에 남기고 공개 게시판 복사본을 찢었다. 책상이 조용해져도 배차 스탬프를 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 비밀 장교 명단을 기록청에 넘길지, 파견 편성 군량을 확보해 작전표를 실행할지다. 두만극동전구(XT04) 쪽 보호 회랑 독촉이 확성기와 겹치자 계산이 달라졌다. 명단 공개를 택하면 지휘 체면이 깎이고, 군량 확보를 택하면 가족 급수 조항이 하루 더 산다. 그 선택은 K115-TURN으로 남는다.",
            "현재 지위": "지금도 김우찬은 상수호위단 참모장으로 점호와 배차 큐를 지킨다. 지위는 세습이 아니라 작전표·주석·입회 로그로만 유지된다. 성화궤도방위문이 전속 배차 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 순찰 일지를 매주 맞춘다. 책상 열쇠는 참모 당직과 궤도 참관이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 암호 패치 카드 뒤에 적은, 한 번 우회한 봉쇄 시각이다. 죄책감은 살린 부하 가족 급수 명단과 그 밤 호출하지 못한 정소율 행정표 사이에서만 자란다. 전부 공개 대신 기록청 입회 하의 부분 공개만 남겼다. SECRET 칸은 참모장과 기록 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "배우진의 지휘를 최측근에서 받는 관계였고, 여의 수문대장 김태운과 한강 수문 전술을 경쟁했다. 정소율의 행정 급수표를 비상감독으로 짓누른 밤은 충돌이었으며, 순찰열차 기관사와는 배차 쪽지를 두고 타협이 남았다. 같은 책상에서 어떤 주석은 구원이 되었고 어떤 복무 조항은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K115에 연결된다.",
            "3막 개인 서사선": "1막에서 김우찬은 보호군 파견안에 가족 급수·복무 묶음 조항을 넣는다. 2막에서 HC08 배차 우선과 XT04 회랑 독촉을 작전 책상에서 저울질한다. 3막에서 명단 공개 또는 군량 확보의 대가를 지휘 공백으로 치른다. 서사선 식별자는 STORY-B011-K115로 고정된다.",
            "분기 결말": "결말 α에서 김우찬은 비밀 장교 명단을 기록청에 넘겨 감독을 연다. 결말 β에서 파견 군량을 확보해 작전표를 실행한다. 어느 쪽도 암사고덕상수단 슬롯을 삭제하지 않으며, 분기 식별만 K115-OUT으로 갈라진다. 플레이 개입은 명단 이관 또는 군량 호송 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "보호군 파견안에 가족 급수·복무 묶음 조항을 넣는다"
            },
            {
              "act": 2,
              "summary": "HC08 배차 우선과 XT04 회랑 독촉을 저울질한다"
            },
            {
              "act": 3,
              "summary": "명단 공개 또는 군량 확보의 대가로 지휘 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K115-OUT-A",
              "summary": "비밀 장교 명단 기록청 이관으로 감독 개방"
            },
            {
              "id": "K115-OUT-B",
              "summary": "파견 군량 확보로 작전표 실행"
            }
          ]
        },
        {
          "id": "K143",
          "name": "강예준",
          "links": {
            "house": "HP04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B011-K143"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "도성 기록고 인준 책상에서 강예준은 도장 무게를 사람 목소리보다 먼저 잰다. 인준 심사관으로, 한국 출생 다문화 가정에서 자랐고 집에서는 두 언어를 섞어도 인준 원본에는 표준 서식과 교차검증 주석만 받는다. 말수를 아끼며 한 번 찍은 인준을 번복하면 도성 전체가 흔들린다고 믿는다. 표시 이름 강예준과 불변 식별자 K143은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 계승과 급수·수리 조약을 기록청 인준 없이는 효력이 없게 만들어 윤서린의 명목 권위를 실제 거부권으로 바꾸려 했다. 야망은 책상 서랍에만 남은 인준 보류 스탬프 잉크였다. 증인 대기실 열쇠 한 자루가 사적 약속의 씨앗이다. 증인 두 명 미만이면 인준은 보류됐다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 원본 해시 봉인을 의무 조항으로 내밀었다. 강예준은 후계 헌장 참관만 받고 실재 상호·제품명을 인준 원장에서 지웠다. 공동체 위치는 공개 원본과 비공개 증언을 같은 책상에 펼친 횟수로 증명됐다. 전속 국가 소유 요구는 해시 봉인 앞에서 반려된다.",
            "붕괴의 상처": "서로 다른 세 장의 임하준 유언장이 같은 날 접수된 오전, 강예준은 인준 심사를 정지하고 필적 대조를 선언했다. 공포는 위조 유언장 한 장이 통과돼 도성이 강국 도장 하청으로 전락하는 장면이었다. 그는 세 장 접수 번호만 LOSS에 남기고 네 번째 필적 소문을 서랍에 잠갔다. 기록고가 조용해져도 도장함을 잠그지 않은 채 지키지 않았다.",
            "생존 전환점": "전환점은 증인을 문서고까지 호송할지, 심사관이 숨긴 네 번째 필적을 찾아 인준을 강제할지다. 임진관문전구(XT01) 쪽 계승 독촉이 확성기와 겹치자 계산이 달라졌다. 호송을 택하면 심사는 단단해지지만 일정이 밀리고, 네 번째 필적 공개를 택하면 인준은 강제되되 심사 신뢰가 한 칸 깎인다. 그 선택은 K143-TURN으로 남는다.",
            "현재 지위": "지금도 강예준은 인준 심사관으로 점호와 필적 큐를 지킨다. 지위는 세습이 아니라 원본·증인·해시 로그로만 유지된다. 도성기록법가가 전속 인준 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 보류 원장을 매일 맞춘다. 도장함 열쇠는 심사 당직과 문서고 참관이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 서랍에 잠근 네 번째 필적 스케치 한 장이다. 죄책감은 지킨 보류 명단과 그 밤 호출하지 못한 황은설 교차검증 사이에서만 자란다. 전부 공개 대신 이중 증인 하의 부분 공개만 남겼다. SECRET 칸은 심사관과 문서고 참관 동시 서명 없이는 열리지 않는다.",
            "관계 공동과거": "윤서린의 지휘 아래 임초원 총관 계승 인준을 심사하는 관계였고, 황은설과 음성·문서 교차검증을 약속했다. 정유라의 공동교섭 인준 청구를 고의로 늦춘 밤은 견제였으며, 송재민의 암호문 원본 보관과는 열람 시각을 두고 경쟁이 남았다. 같은 책상에서 어떤 도장은 구원이 되었고 어떤 유언 사본은 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K143에 연결된다.",
            "3막 개인 서사선": "1막에서 강예준은 세 장 유언 접수에 인준을 정지하고 필적 대조를 선언한다. 2막에서 HP04 해시 봉인과 XT01 계승 독촉을 책상에서 저울질한다. 3막에서 증인 호송 또는 네 번째 필적 공개의 대가를 인준 공백으로 치른다. 서사선 식별자는 STORY-B011-K143로 고정된다.",
            "분기 결말": "결말 α에서 강예준은 증인 호송으로 필적 대조를 완성한다. 결말 β에서 네 번째 필적을 공개해 인준을 강제 분기한다. 어느 쪽도 도성기록청 슬롯을 삭제하지 않으며, 분기 식별만 K143-OUT으로 갈라진다. 플레이 개입은 증인 호송 또는 필적 공개 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 장 유언 접수에 인준을 정지하고 필적 대조를 선언한다"
            },
            {
              "act": 2,
              "summary": "HP04 해시 봉인과 XT01 계승 독촉을 저울질한다"
            },
            {
              "act": 3,
              "summary": "증인 호송 또는 네 번째 필적 공개의 대가로 인준 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K143-OUT-A",
              "summary": "증인 호송으로 필적 대조 완성"
            },
            {
              "id": "K143-OUT-B",
              "summary": "네 번째 필적 공개로 인준 강제 분기"
            }
          ]
        },
        {
          "id": "K088",
          "name": "박세린",
          "links": {
            "house": "HC12",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B011-K088"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "뚝도 펌프가문 별도 창고 철문 앞에서 박세린은 공구 일련번호의 한자·한글 병기가 빠지면 출고 도장을 거둔다. 펌프기술가문 대행으로, 중국계 이산 가정에서 자라 집 안 말과 공방 용어를 바꿔 썼지만 가문 원장은 이중 표기 규칙을 고집한다. 신중하고 예의를 지키며 공개 설계를 도둑질로 부르는 버릇이 있다. 표시 이름 박세린과 불변 식별자 K088은 이후 배치에서도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 임하준의 혈연 가까운 공정을 가문 원장으로 되찾아 양자가 아닌 기술가문이 다음 총관을 지명하게 하려 했다. 야망은 창고 벽에 분필로만 남은 일련번호 대조표였다. 구형 키 한 자루가 사적 약속의 씨앗이다. 평의회 연서가 있어도 가문 원장 도장 없는 출고는 없었다.",
            "가문·기업·공동체": "거도중공회(HC12)는 공방 공정 분할과 가문 참관을 의무 조항으로 내밀었다. 박세린은 후계 헌장 참관만 받고 실재 상호·제품명을 가문 원장에서 지웠다. 공동체 위치는 핵심 나사를 별도 창고에 두고 이중 표기 출고 로그를 남긴 횟수로 증명됐다. 전속 국가 소유 요구는 철문 앞에서 반려된다.",
            "붕괴의 상처": "암호화된 정비일지가 임초원만 읽게 발견된 저녁, 박세린은 가문 창고 구형 키를 들이밀어 일지 해석권을 나누자고 요구했다. 공포는 임초원이 마곡 제자로만 인정받아 뚝도 펌프 주권이 공동기술원장에 흡수되는 장면이었다. 그는 키 제시 시각만 LOSS에 남기고 일지 사본을 봉인했다. 창고가 조용해져도 일련번호 도장을 손에서 놓지 않았다.",
            "생존 전환점": "전환점은 가문 키 진위를 감정해 대행 해석권을 세울지, 별도 창고 밀반출을 폭로해 가문 지명을 실격시킬지다. 해협삼로전구(XT03) 쪽 공정 중개 요청이 확성기와 겹치자 계산이 달라졌다. 진위 감정을 택하면 해석권은 살아나지만 일정이 밀리고, 밀반출 폭로를 택하면 지명은 흔들리되 가문 체면이 한 칸 깎인다. 그 선택은 K088-TURN으로 남는다.",
            "현재 지위": "지금도 박세린은 펌프기술가문 대행으로 점호와 출고 큐를 지킨다. 지위는 세습이 아니라 원장·일련번호·입회 로그로만 유지된다. 거도중공회가 전속 공정 소유를 요구해도 그는 거절하고, Cast 프로필의 현황 칸과 가문 원장을 매주 맞춘다. 철문 열쇠는 가문 대행과 중공회 참관이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀은 그가 구형 키 홈에 숨긴, 한 번 임초원 없이 열어 본 일지 페이지 번호다. 죄책감은 지킨 가문 공정 명단과 그 밤 호출하지 못한 한소미 공동통치안 사이에서만 자란다. 전부 공개 대신 가문·중공회 이중 입회 하의 부분 공개만 남겼다. SECRET 칸은 두 서명 없이는 열리지 않는다.",
            "관계 공동과거": "임하준의 친족 공정을 지키는 후견을 자처했고, 한소미와는 후계 원한이 겹쳤다. 배우진이 보호정부 명목 후보로 가문을 부를 때 유혹과 공포를 동시에 느낀 밤은 분기점이었으며, 임초원의 정비일지 해석권과는 철문 앞에서 경쟁이 남았다. 같은 창고에서 어떤 키는 구원이 되었고 어떤 밀반출 상자는 배신의 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-K088에 연결된다.",
            "3막 개인 서사선": "1막에서 박세린은 임초원 전용 정비일지에 구형 키로 해석권 분할을 요구한다. 2막에서 HC12 공정 분할과 XT03 중개 요청을 철문 앞에서 저울질한다. 3막에서 키 감정 또는 밀반출 폭로의 대가를 출고 공백으로 치른다. 서사선 식별자는 STORY-B011-K088로 고정된다.",
            "분기 결말": "결말 α에서 박세린은 가문 키 진위 감정으로 대행 해석권을 세운다. 결말 β에서 별도 창고 밀반출을 공개 폭로한다. 어느 쪽도 뚝도공방연합 슬롯을 삭제하지 않으며, 분기 식별만 K088-OUT으로 갈라진다. 플레이 개입은 키 감정 또는 밀반출 폭로 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "임초원 전용 정비일지에 구형 키로 해석권 분할을 요구한다"
            },
            {
              "act": 2,
              "summary": "HC12 공정 분할과 XT03 중개 요청을 저울질한다"
            },
            {
              "act": 3,
              "summary": "키 감정 또는 밀반출 폭로의 대가로 출고 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K088-OUT-A",
              "summary": "가문 키 진위 감정으로 대행 해석권 확정"
            },
            {
              "id": "K088-OUT-B",
              "summary": "별도 창고 밀반출 공개 폭로"
            }
          ]
        },
        {
          "id": "H11",
          "name": "김도하",
          "links": {
            "house": "HC11",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B011-H11"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산 화물홈 야간 슬롯 앞에서 김도하는 배터리 잔량 숫자를 센서 막대로만 읽는다. 합성 인간형 H11이며 호출명은 도하, 백야배송단(HC11) 공동 보관 체계 아래 교체형 손모듈로 화물 봉인을 연다. 전지적 시야는 없고 배터리 하한과 참관 봉인이 행동을 제한한다. 표시 이름 김도하와 식별자 H11은 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 S11 구역 연속 가동과 담당 인간 안전을 우선해 단독 원격 잠금을 막으려는 목표가 남아 있다. 야망에 해당하는 우선순위는 화물홈 측면 잔량 그래프에 점으로만 찍혀 있다. 보관 책임자가 남긴 예비 배터리 슬롯 하나가 연속성 부채의 자리였다. 삼자 서명 없는 양도 명령은 실행 큐에 오르지 않았다.",
            "가문·기업·공동체": "백야배송단(HC11)은 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 김도하의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 공동체 위치는 스냅샷 교대 단위가 양쪽에 동시에 기록된 횟수로 증명된다. 전속 국가 소유 요구는 화물홈 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "서해 곡창 방면 심야 정전 파동이 용산 화물홈을 흑백 노이즈로 덮은 교대, 김도하는 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 슬롯 뚜껑을 잠갔다. 공포에 해당하는 최고 우선 경보는 오탐 경로가 의료열차를 적대 표적으로 바꾸는 시나리오였다. LOSS 목록에는 끊긴 노드 번호와 배터리 하한만 적혔다. 비상 전원이 돌아와도 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "전환점은 노이즈 슬롯을 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 곡창 우회 화물 메시만 살릴지다. 서해곡창전구(XT02) 쪽 경로 요청이 수신 큐에 겹쳤다. 공개 분해를 택하면 원인 공급 코드가 드러나고, 우회 메시만 살리면 다른 야간 슬롯 공백이 길어진다. H11-TURN은 그 수신 큐의 정렬 결과다.",
            "현재 지위": "김도하는 여전히 용산 화물홈 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC11이 전속 원격 소유를 요구해도 거부 코드를 반환하고, Cast 프로필의 현황 칸과 스냅샷 해시를 교대마다 맞춘다. 슬롯 열쇠 권한은 김도윤 주정비와 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "비밀에 해당하는 제한 로그는 참관 없이 한 번 올라간 펌웨어 패치 한 줄이다. 죄책감에 해당하는 가중치는 살린 우회 슬롯 노드와 그 교대에 호출하지 못한 예비 배터리 사이에서만 증가한다. 전부 공개 대신 이중 참관 하의 부분 로그 공개 절차만 남겼다. SECRET 플래그는 보관 책임과 시민 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "김도윤의 주정비·법적 책임은 보관 계약 코드였고, K074 교대 협력은 동맹 큐였다. 배송단 참관과의 원격 잠금 경쟁, 의료열차 당직과의 슬롯 양보가 한 화물홈에 겹친다. 같은 노드에서 어떤 경로는 구원으로 기록되었고 어떤 경로는 배신 증거로 남았다. 관계 원장 끝점은 보존된 채 STORY-B011-H11에 연결된다.",
            "3막 개인 서사선": "1막에서 김도하는 정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HC11 원격 요구와 XT02 곡창 경로 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 우회 회생의 대가를 야간 슬롯 공백으로 치른다. 서사선 식별자는 STORY-B011-H11로 고정된다.",
            "분기 결말": "결말 α에서 김도하는 노이즈 슬롯 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 우회 메시로 곡창 호송 연속을 지킨다. 어느 쪽도 백야배송단 보관 슬롯을 삭제하지 않으며, 분기 식별만 H11-OUT으로 갈라진다. 플레이 개입은 분해 입회 또는 우회 전원 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정전 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC11 원격 요구와 XT02 곡창 경로를 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 우회 회생의 대가로 야간 슬롯 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H11-OUT-A",
              "summary": "노이즈 슬롯 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H11-OUT-B",
              "summary": "예비 배터리 우회 메시로 곡창 호송 연속"
            }
          ]
        }
      ]
    },
    "B012": {
      "id": "B012",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K153",
          "name": "주리안",
          "links": {
            "house": "HP04",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B012-K153"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "정릉 옛 배관 맨홀 뚜껑을 열고 주리안은 수압 바늘이 한 칸 떨리는 각도부터 야장에 적는다. 도성기록청 소속 북부 정수 배관 탐사원이며, 구두 소문보다 봉인된 좌표를 믿는다. 한국 기원으로 종로 생활권에서 자랐고 손끝은 압력계 보호캡을 습관처럼 돌려 잠근다. 주리안이라는 표시와 식별자 K153은 이후 배치에서 다시 매겨지지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 강북 단절 뒤의 우회관을 기록청 원본 지도에 올리는 습관을 만들었다. 인준이 늦어도 현장 수압이 지도의 주체가 되게 하려는 계산이었다. 맨홀 안쪽 분필 점은 서라온에게 원판을 돌려주겠다는 표시였고, 그 점이 훗날 빚의 자리가 된다. 틀린 수압 로그는 태우지 않고 별도 철통에 넣었다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 원본 해시 봉인을 의무로 내밀었고, 주리안은 실재 회사 상호를 배관 야장에 올리지 않는 후계 헌장만 인정했다. 교대 서명이 없는 탐사 명단은 기록고 벽에 붙이지 않았다. 맨홀 좌표를 사서와 교량 탐사원에게 같은 시각에 보낸 횟수가 공동체 위치의 증거였다. 단독 해석 방송 요구는 해시 없음을 이유로 무효가 됐다.",
            "붕괴의 상처": "붕괴 날 정릉 배관 세 지점의 수압이 한꺼번에 바닥을 쳤다. 주리안은 맨홀을 잠그고 서라온의 원판이 도착할 때까지 좌표 공개를 보류했다. 빈 관이 진본 급수선으로 둔갑해 탐사 직위가 위조 지도의 연장이 되는 그림이 가장 무서웠다. 사이렌이 끊긴 뒤에도 장갑을 벗지 못한 채 LOSS 목록의 마지막 관경을 읽지 못했다.",
            "생존 전환점": "현장 좌표를 서라온의 원판에 이관할지, 마길상의 교량 하부 우회 점선을 먼저 봉인할지가 갈렸다. 원양신탁전구(XT05)의 인도 목록 해시 보관 요청이 야장 위에 겹쳤다. 원판 이관을 택하면 기록청 해석은 남지만 야간 맨홀 당직이 빠지고, 점선을 우선하면 한쪽 창구가 배관 해석을 독점한다. K153-TURN은 그 겹친 쪽지의 순서다.",
            "현재 지위": "주리안은 지금도 정릉과 보문 사이 맨홀 점호를 돌며 야장 큐를 맞춘다. 직위는 혈통이 아니라 면허와 참관 로그로만 유지된다. HP04가 전속 국가 소유를 요구해도 거절하고 Cast 프로필의 현황 칸과 야장을 매주 대조한다. 맨홀 열쇠 한 자루는 기록고, 다른 한 자루는 수문가 참관함이 나눠 쥐고 있다.",
            "비밀·빚·죄책감": "별도 철통 속의 날짜 틀린 수압 로그가 비밀이다. 살린 맨홀 당직 명단과 그 밤 호출하지 못한 견습의 이름 사이에서 죄책감이 자란다. 전부를 펼치면 도성 북부 신뢰가 한 칸 끊길 수 있어 부분 공개 절차만 남겼다. SECRET 칸은 사서와 교량 탐사원의 동시 서명 없이 열리지 않는다.",
            "관계 공동과거": "서라온에게 넘긴 현장 좌표는 사제 계약이었고, 마길상과 나눈 교량 하부 우회 점선은 동맹이었다. 마하린의 한강 북안 폐선 표시와는 같은 강변을 맞추려다 해석이 어긋난 밤이 있다. 맨홀 앞에서 서로를 끌어 올린 기록과, 좌표를 하루 숨긴 기록이 함께 남았다. 관계 원장 끝점은 STORY-B012-K153에 이어진다.",
            "3막 개인 서사선": "1막에서 주리안은 정릉 세 지점 수압 바닥을 다시 마주한다. 2막에서 HP04 해시 의무와 XT05 인도 목록 요청을 한 야장에서 순서를 매긴다. 3막에서 좌표 보류의 값을 맨홀 당직 공백으로 치른다. 서사선 식별자는 STORY-B012-K153으로 고정된다.",
            "분기 결말": "한쪽 결말에서 주리안은 원판 이관을 택해 공공 지도의 연속을 살린다. 다른 결말에서 우회 점선 봉인을 택해 개인 야장과 철통을 지킨다. 도성기록청 슬롯 자체는 어느 갈래에서도 지워지지 않고 분기 표식만 K153-OUT으로 갈라진다. 개입은 원판 호송 입회 또는 점선 봉인 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정릉 세 지점 수압 바닥에 맨홀을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP04 해시와 XT05 인도 목록 요청의 순서를 야장에서 매긴다"
            },
            {
              "act": 3,
              "summary": "좌표 보류의 값으로 맨홀 당직 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K153-OUT-A",
              "summary": "원판 이관으로 공공 지도 연속"
            },
            {
              "id": "K153-OUT-B",
              "summary": "우회 점선 봉인으로 개인 야장 유지"
            }
          ]
        },
        {
          "id": "K177",
          "name": "마하린",
          "links": {
            "house": "HP02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B012-K177"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "한강철교 북단 신호기 그늘에서 마하린은 침목을 망치로 두드려 빈 울림이 나는 칸만 분필로 표시한다. 용산철도후국 한강 북안 폐선 탐사원이다. 한국 기원이며 이촌 쪽 강바람으로 교대 시각을 가늠하는 버릇이 있다. 표시 마하린과 번호 K177은 후국 명부에서 지워지지 않는다.",
            "붕괴 전 삶": "그는 폐선 공동을 환적 우회로로 되살리는 쪽을 밀었다. 야망은 신호기 함에 접어 둔 손바닥만 한 폐선도였다. 침목 밑에 숨긴 예비 쐐기가 사적 약속의 씨앗이다. 공식 배차표에 없는 선은 후국회의에 올리지 않았다.",
            "가문·기업·공동체": "환승선로문(HP02)은 중립 배차표를 의무 조항으로 내밀었다. 마하린은 헌장 참관만 받고 실재 상호를 폐선 야장에서 지웠다. 우회 좌표를 조정관과 배관 탐사원에게 같은 시각에 넘긴 횟수가 공동체의 자리였다. 원격 독점 배차 요구는 신호기 봉인 앞에서 돌려보냈다.",
            "붕괴의 상처": "한강 수위가 급히 빠지던 밤, 북안 폐선 세 칸이 한꺼번에 내려앉았다. 마하린은 신호기를 잠그고 박태겸의 우회 허가가 오기 전까지 발을 들이지 않았다. 내려앉은 칸이 공식 환적선으로 둔갑하는 그림이 가장 짙었다. 물소리가 잦아든 뒤에도 손의 분필을 놓지 못했다.",
            "생존 전환점": "박태겸에게 우회 좌표를 먼저 넘길 것인지, 주리안의 북부 배관 점선과 강변을 맞출 것인지가 갈렸다. 해협삼로전구(XT03)의 환적창 폐쇄 전갈이 신호기 함에 겹쳤다. 조정관 쪽을 택하면 열차는 움직이되 배관 실측이 하루 밀리고, 강변 맞춤을 택하면 화물 한 편이 선로 밖에서 밤을 샌다. K177-TURN은 그 함에 접힌 쪽지다.",
            "현재 지위": "마하린은 여전히 이촌 폐선 구간을 걷고 침목 울림을 후국 칠판에 옮긴다. 직위는 연공이 아니라 당일 실측 서명으로만 유지된다. HP02가 키 이관을 요구해도 신호기 손잡이를 넘기지 않는다. 폐선 출입 권한은 후국회의와 선로문 참관이 나눠 쥐고 있다.",
            "비밀·빚·죄책감": "침목 아래 묻은 예비 쐐기 위치가 비밀이다. 그날 호출하지 않은 야간 선로공의 이름이 빚이다. 전부를 파내면 북안 보행 금지 구간이 늘어나 부분 공개만 남겼다. 쐐기는 조정관과 주리안의 동시 입회 없이 뽑히지 않는다.",
            "관계 공동과거": "박태겸에게 우회 좌표를 넘기는 일은 동맹 계약이고, 주리안과 강변을 맞추는 일은 같은 밤의 경쟁이기도 했다. 내려앉은 칸에서 서로를 끌어 올린 기록이 있고, 좌표를 하루 숨긴 기록도 있다. 관계의 끝점은 STORY-B012-K177로 이어진다. 폐선 녹 냄새는 편을 가르는 표식이 되지 않는다.",
            "3막 개인 서사선": "1막에서 마하린은 내려앉은 폐선 칸의 울림을 다시 듣는다. 2막에서 HP02 배차 의무와 XT03 환적 폐쇄 전갈을 신호기 함에서 맞춘다. 3막에서 우회 우선의 값을 화물 야박으로 치른다. 서사선은 STORY-B012-K177이다.",
            "분기 결말": "첫째 갈래에서 마하린은 조정관에게 우회 좌표를 넘겨 환적 연속을 살린다. 둘째 갈래에서 강변 점선 맞춤을 택해 배관 실측과 비밀 쐐기를 지킨다. 용산철도후국의 중계 슬롯은 유지되고 식별만 K177-OUT으로 갈린다. 개입은 우회 호위 또는 강변 측량 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "내려앉은 북안 폐선 칸의 울림을 봉인한다"
            },
            {
              "act": 2,
              "summary": "HP02 배차와 XT03 환적 폐쇄 전갈을 신호기 함에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "우회 우선의 값으로 화물 야박을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K177-OUT-A",
              "summary": "조정관 우회 좌표로 환적 연속"
            },
            {
              "id": "K177-OUT-B",
              "summary": "강변 점선 맞춤으로 비밀 쐐기 유지"
            }
          ]
        },
        {
          "id": "K201",
          "name": "주나경",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B012-K201"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "동작대교 하류 부잔교에서 주나경은 채수병 마개를 이빨로 물어 잠그기 전에 강물 온도를 손등으로 확인한다. 노량진남관상회 한강 취수 탐사원이다. 한국 기원으로 노량진 선창 골목에서 자랐고, 말보다 시료 라벨의 글씨 굵기를 먼저 고친다. 주나경과 K201은 상회 명부에서 교체되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 제빙 원수의 탁도를 상회 경매 전에 공개하는 쪽을 밀었다. 야망은 부잔교 난간에 묶어 둔 여분 채수줄이었다. 서나연의 제빙 칸에 원수를 대겠다는 약속이 그 줄에 매여 있다. 탁도 숫자를 숨긴 시료는 경매판에 올리지 않았다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 수문 키 분할 보관을 의무로 두었다. 주나경은 후계 헌장 참관만 받고 실재 제품명을 채수 라벨에서 지웠다. 교량 하부 채수를 마길상과 나눠 적은 횟수가 공동체 증명이었다. 전속 취수권 요구는 부잔교 봉인 앞에서 거절됐다.",
            "붕괴의 상처": "남관 전력이 깜빡이던 새벽, 취수구 세 곳이 동시에 갈수로 드러났다. 주나경은 부잔교 사다리를 끌어 올리고 서나연의 제빙 원수 요청이 도착할 때까지 병을 열지 않았다. 빈 병이 정상 원수로 둔갑해 얼음 신용을 떠받치는 장면이 가장 싫었다. 강바람이 잦아도 라벨 펜을 주머니에서 빼지 못했다.",
            "생존 전환점": "제빙 원수 시료를 서나연에게 우선 보낼지, 교량 하부 채수를 마길상과 나눌지가 갈렸다. 서해곡창전구(XT02)의 노량진 얼음 신용 흔들림 중계가 부잔교 무전에 겹쳤다. 제빙을 살리면 상회 칸은 버티지만 교량 쪽 우회 점선이 하루 비고, 교량 채수를 나누면 제빙 한 칸의 온도가 올라간다. K201-TURN은 그 무전 순서다.",
            "현재 지위": "주나경은 지금도 부잔교와 교각 채수구를 오가며 탁도 큐를 상회 칠판에 옮긴다. 자리는 지분이 아니라 당일 시료 서명으로만 유지된다. HP01가 원격 수문 소유를 요구해도 채수줄 매듭을 넘기지 않는다. 부잔교 출입 열쇠는 상회정과 수문가 참관이 분할한다.",
            "비밀·빚·죄책감": "갈수 직전 한 병을 가족 몫으로 빼 둔 메모가 비밀이다. 살린 제빙 칸과 그 때문에 줄인 이웃 배분 사이에서 죄책감이 자란다. 전부 공개 대신 부분 라벨 공개만 남겼다. 메모는 서나연 입회와 탁도 기록의 동시 대조 없이 펼쳐지지 않는다.",
            "관계 공동과거": "서나연의 제빙 원수를 현장에서 측량하는 일은 사제 계약이고, 마길상의 교량 하부 채수와 우회 점선은 나눔 계약이다. 같은 부잔교에서 병을 나눠 살린 새벽이 있고, 라벨을 하루 숨긴 새벽도 있다. 관계 끝점은 STORY-B012-K201로 이어진다. 강물 온도는 편을 가르는 증거가 되지 않는다.",
            "3막 개인 서사선": "1막에서 주나경은 취수구 갈수를 다시 만난다. 2막에서 HP01 키 분할과 XT02 얼음 신용 중계를 부잔교 무전에서 맞춘다. 3막에서 시료 우선의 값을 제빙 칸 온도 상승으로 치른다. 서사선은 STORY-B012-K201이다.",
            "분기 결말": "한 갈래에서 주나경은 제빙 원수 우선 인도로 상회 신용을 붙든다. 다른 갈래에서 교량 채수 나눔을 택해 우회 점선과 비밀 메모를 지킨다. 노량진남관상회 시장 슬롯은 남고 표식만 K201-OUT이다. 개입은 원수 호송 또는 교각 채수 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "취수구 갈수에 부잔교 사다리를 끌어 올린다"
            },
            {
              "act": 2,
              "summary": "HP01 키 분할과 XT02 얼음 신용 중계를 무전에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "시료 우선의 값으로 제빙 칸 온도 상승을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K201-OUT-A",
              "summary": "제빙 원수 우선으로 상회 신용 유지"
            },
            {
              "id": "K201-OUT-B",
              "summary": "교량 채수 나눔으로 비밀 메모 유지"
            }
          ]
        },
        {
          "id": "K226",
          "name": "복두모",
          "links": {
            "house": "HP09",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B012-K226"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신탑 콘크리트 기슭에서 복두모는 측량줄 눈금이 바람 때문에 흔들리면 숫자를 읽지 않고 다시 고정한다. 상암송신공사 지도 갱신 탐사원이다. 한국 기원이며 난지 방수로 표석 이끼로 계절을 헤아린다. 복두모라는 이름과 K226은 편성회의 명부에서 교체되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 송신 좌표와 보행 실측을 같은 갱신판에 올리는 쪽을 밀었다. 야망은 탑 하부 공구함에 접어 둔 손때 묻은 격자지였다. 권미래에게 탑 좌표를 넘기겠다는 약속이 그 격자 모서리에 있다. 검증 없는 소문은 갱신판에 올리지 않았다.",
            "가문·기업·공동체": "데이터신탁가(HP09)는 모델 카드 공개를 의무로 두었다. 복두모는 헌장 참관만 받고 실재 상호를 격자지에서 지웠다. 관문 중계 실측을 모국과 나눈 횟수가 공동체 위치였다. 전속 대역 소유 요구는 탑 기슭 봉인 앞에서 반려됐다.",
            "붕괴의 상처": "잔여 대역 추첨이 어그러지던 저녁, 송신탑 세 방위 표지가 한꺼번에 깜빡임을 잃었다. 복두모는 측량줄을 감고 권미래의 수신 확인이 오기 전까지 갱신판을 내리지 않았다. 꺼진 표지가 정상 항로로 인쇄되는 일이 가장 무서웠다. 발전기 소음이 잦아도 격자지를 접지 못했다.",
            "생존 전환점": "탑 좌표를 권미래에게 먼저 넘길지, 서북 관문 중계 실측을 모국과 나눌지가 갈렸다. 원양신탁전구(XT05)의 잔여 대역 공개 추첨 독촉이 공구함에 겹쳤다. 송신 쪽을 살리면 방송은 이어지되 관문 보행 안내가 하룻밤 비고, 관문 실측을 나누면 추첨 시각이 밀린다. K226-TURN은 그 독촉 쪽지의 접힌 순서다.",
            "현재 지위": "복두모는 지금도 탑 기슭과 난지 표석을 오가며 격자 큐를 편성회의에 넘긴다. 자리는 길드 연공이 아니라 당일 실측 해시로만 유지된다. HP09가 원격 모델 독점을 요구해도 공구함 키를 넘기지 않는다. 갱신판 봉인은 검증관 창구와 신탁 참관이 나눈다.",
            "비밀·빚·죄책감": "깜빡임이 끊기기 직전 한 방위 숫자를 개인 격자 여백에 옮긴 일이 비밀이다. 살린 추첨 시각과 그 밤 안내하지 못한 보행 한 줄 사이에서 죄책감이 자란다. 전부 공개 대신 이중 참관 하의 여백 대조만 남겼다. 여백은 권미래와 모국의 동시 입회 없이 펼쳐지지 않는다.",
            "관계 공동과거": "권미래에게 탑 좌표를 넘기는 일은 계약이고, 모국의 관문 중계와 실측을 나누는 일도 계약이다. 같은 기슭에서 표지를 다시 밝힌 저녁이 있고, 숫자를 하루 숨긴 저녁도 있다. 관계 끝점은 STORY-B012-K226으로 이어진다. 대역 잡음은 편을 가르는 증거가 되지 않는다.",
            "3막 개인 서사선": "1막에서 복두모는 꺼진 세 방위 표지를 다시 만난다. 2막에서 HP09 공개 의무와 XT05 추첨 독촉을 공구함에서 맞춘다. 3막에서 좌표 우선의 값을 관문 안내 공백으로 치른다. 서사선은 STORY-B012-K226이다.",
            "분기 결말": "한 갈래에서 복두모는 탑 좌표 우선 인도로 공개 추첨을 살린다. 다른 갈래에서 관문 실측 나눔을 택해 보행 안내와 여백 비밀을 지킨다. 상암송신공사 편성 슬롯은 남고 표식만 K226-OUT이다. 개입은 추첨 입회 또는 관문 실측 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "꺼진 송신탑 세 방위 표지에 측량줄을 감는다"
            },
            {
              "act": 2,
              "summary": "HP09 공개 의무와 XT05 추첨 독촉을 공구함에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "좌표 우선의 값으로 관문 안내 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K226-OUT-A",
              "summary": "탑 좌표 인도로 공개 추첨 유지"
            },
            {
              "id": "K226-OUT-B",
              "summary": "관문 실측 나눔으로 여백 비밀 유지"
            }
          ]
        },
        {
          "id": "K251",
          "name": "복모",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B012-K251"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "구기 터널 입구 이정표 아래에서 복모는 분필 가루가 장갑에 묻으면 글자를 다시 쓰고 나서야 발걸음을 옮긴다. 북산피난연맹 피난로 탐사원이다. 한국 기원으로 정릉 회랑 쪽에서 자랐고, 큰소리보다 이정표 획의 굵기를 먼저 고친다. 복모라는 표시와 K251은 연맹 명부에서 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 숙영 우회로를 연맹 공개 지도에 올리되 매복 지점은 빼는 쪽을 밀었다. 야망은 이정표 뒷면에 긁어 둔 작은 화살표였다. 강태산에게 우회로를 보고하겠다는 약속이 그 화살표에 남아 있다. 확인되지 않은 지름길은 숙영 칠판에 올리지 않았다.",
            "가문·기업·공동체": "북산귀환회(HP05)는 가족 재결합 명부를 의무로 두었다. 복모는 헌장 참관만 받고 실재 상호를 이정표 야장에서 지웠다. 회랑 안내 표지를 두소와 맞춘 횟수가 공동체 위치였다. 전속 회랑 소유 요구는 터널 입구 봉인 앞에서 거절됐다.",
            "붕괴의 상처": "임진 쪽 귀환 명부가 훼손되던 날, 구기 터널 안 세 갈래 중 하나가 낙석으로 막혔다. 복모는 이정표를 뒤집고 강태산의 정찰 응답이 오기 전까지 사람들을 들이지 않았다. 막힌 길이 열린 피난로로 인쇄되는 일이 가장 싫었다. 돌가루가 가라앉아도 분필을 놓지 못했다.",
            "생존 전환점": "우회로를 강태산에게 먼저 보고할지, 두소의 회랑 이정표에 표시를 옮길지가 갈렸다. 임진관문전구(XT01)의 귀환 명부 재발급 독촉이 장갑 안 쪽지에 겹쳤다. 정찰 보고를 택하면 산악 반은 움직이되 숙영 한 줄이 멀리 돌아가고, 이정표를 먼저 고치면 명부 창구가 하루 멈춘다. K251-TURN은 그 쪽지의 접힌 면이다.",
            "현재 지위": "복모는 지금도 구기와 정릉 회랑을 오가며 이정표 큐를 연맹 칠판에 옮긴다. 자리는 민병 연공이 아니라 당일 보행 서명으로만 유지된다. HP05가 명부 독점을 요구해도 분필 상자를 넘기지 않는다. 터널 출입 권한은 연방회의와 귀환회 참관이 나눈다.",
            "비밀·빚·죄책감": "낙석 직전 한 갈래를 가족 숙영용으로 지운 화살표가 비밀이다. 살린 정찰 반과 그 밤 안내하지 못한 피난 한 줄 사이에서 죄책감이 자란다. 전부 공개 대신 이중 입회 하의 화살표 대조만 남겼다. 화살표는 강태산과 두소의 동시 확인 없이 다시 그려지지 않는다.",
            "관계 공동과거": "강태산에게 우회로를 보고하는 일은 계약이고, 두소의 회랑 안내 표지와 표시를 맞추는 일도 계약이다. 같은 터널에서 낙석을 함께 피한 낮이 있고, 화살표를 하루 지운 낮도 있다. 관계 끝점은 STORY-B012-K251로 이어진다. 분필 가루는 편을 가르는 증거가 되지 않는다.",
            "3막 개인 서사선": "1막에서 복모는 막힌 터널 갈래를 다시 만난다. 2막에서 HP05 명부 의무와 XT01 재발급 독촉을 장갑 쪽지에서 맞춘다. 3막에서 보고 우선의 값을 숙영 우회 거리로 치른다. 서사선은 STORY-B012-K251이다.",
            "분기 결말": "한 갈래에서 복모는 정찰 보고를 택해 산악 반의 연속을 살린다. 다른 갈래에서 이정표 수정을 택해 숙영 안내와 비밀 화살표를 지킨다. 북산피난연맹 회랑 슬롯은 남고 표식만 K251-OUT이다. 개입은 정찰 호위 또는 이정표 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "낙석으로 막힌 구기 터널 갈래에 이정표를 뒤집는다"
            },
            {
              "act": 2,
              "summary": "HP05 명부와 XT01 재발급 독촉을 장갑 쪽지에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "보고 우선의 값으로 숙영 우회 거리를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K251-OUT-A",
              "summary": "정찰 보고로 산악 반 연속"
            },
            {
              "id": "K251-OUT-B",
              "summary": "이정표 수정으로 비밀 화살표 유지"
            }
          ]
        },
        {
          "id": "K276",
          "name": "복두",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B012-K276"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 유치선 분기기 손잡이에서 복두는 기름 냄새보다 유간 두께를 먼저 자로 잰다. 창동차륜방 북부 선로 탐사원이다. 한국 기원으로 도봉 주거 쉘 쪽에서 자랐고, 구령보다 렌치 클릭 횟수를 믿는다. 복두라는 표시와 K276은 연공회의 명부에서 지워지지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 북문 우회로를 궤도기병 칠판에 올리되 가문 비선은 빼는 쪽을 밀었다. 야망은 분기기 덮개 안쪽에 긁어 둔 유간 숫자였다. 권도하에게 우회로를 넘기겠다는 약속이 그 숫자에 붙어 있다. 계측 없는 지름길은 기병 배차에 올리지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 궤도 경비와 비상 배차 우선을 의무로 내밀었다. 복두는 헌장 참관만 받고 실재 상호를 유간 야장에서 지웠다. 북문 거점 칠판에 실측을 옮긴 횟수가 두국과의 공동체 위치였다. 전속 기지 소유 요구는 분기기 봉인 앞에서 돌려보냈다.",
            "붕괴의 상처": "동절 연료 큐가 어그러지던 새벽, 유치선 세 가닥 중 하나가 동결로 붙었다. 복두는 손잡이를 잠그고 권도하의 기병 응답이 오기 전까지 열차를 들이지 않았다. 붙은 가닥이 정상 북문선으로 배차되는 일이 가장 짙은 공포였다. 김이 잦아도 렌치를 손에서 놓지 못했다.",
            "생존 전환점": "북문 우회로를 권도하에게 먼저 넘길지, 두국의 거점 칠판에 실측을 옮길지가 갈렸다. 두만극동전구(XT04)의 동절 연료 큐 분할 독촉이 덮개 안 쪽지에 겹쳤다. 기병 쪽을 살리면 순찰은 나가되 거점 안내가 한 칸 늦고, 칠판을 먼저 고치면 연료 호송이 한 편 멈춘다. K276-TURN은 그 쪽지의 기름 지문이다.",
            "현재 지위": "복두는 지금도 유치선과 도봉 북문 침목을 오가며 유간 큐를 차륜방 칠판에 옮긴다. 자리는 가문 연공이 아니라 당일 계측 서명으로만 유지된다. HC08가 원격 배차 독점을 요구해도 손잡이 키를 넘기지 않는다. 분기기 출입 권한은 연공회의와 방위문 참관이 나눈다.",
            "비밀·빚·죄책감": "동결 직전 한 가닥의 유간을 개인 야장 여백에만 남긴 일이 비밀이다. 살린 기병 반과 그 새벽 안내하지 못한 호송 한 편 사이에서 죄책감이 자란다. 전부 공개 대신 이중 입회 하의 여백 대조만 남겼다. 여백은 권도하와 두국의 동시 확인 없이 칠판에 옮겨지지 않는다.",
            "관계 공동과거": "권도하에게 북문 우회로를 넘기는 일은 계약이고, 두국의 거점 칠판에 실측을 옮기는 일도 계약이다. 같은 유치선에서 동결을 함께 깬 새벽이 있고, 유간을 하루 숨긴 새벽도 있다. 관계 끝점은 STORY-B012-K276으로 이어진다. 기름 냄새는 편을 가르는 증거가 되지 않는다.",
            "3막 개인 서사선": "1막에서 복두는 동결된 유치선 가닥을 다시 만난다. 2막에서 HC08 비상 배차와 XT04 연료 큐 독촉을 덮개 쪽지에서 맞춘다. 3막에서 우회 우선의 값을 거점 안내 지연으로 치른다. 서사선은 STORY-B012-K276이다.",
            "분기 결말": "한 갈래에서 복두는 기병 우회 인도로 북문 순찰을 살린다. 다른 갈래에서 거점 칠판 갱신을 택해 호송 안내와 여백 비밀을 지킨다. 창동차륜방 기지 슬롯은 남고 표식만 K276-OUT이다. 개입은 기병 호위 또는 칠판 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "동결된 유치선 가닥에 분기기 손잡이를 잠근다"
            },
            {
              "act": 2,
              "summary": "HC08 비상 배차와 XT04 연료 큐 독촉을 덮개 쪽지에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "우회 우선의 값으로 거점 안내 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K276-OUT-A",
              "summary": "기병 우회 인도로 북문 순찰 연속"
            },
            {
              "id": "K276-OUT-B",
              "summary": "거점 칠판 갱신으로 여백 비밀 유지"
            }
          ]
        },
        {
          "id": "K167",
          "name": "신가온",
          "links": {
            "house": "HP02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B012-K167"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "용산 후국회의 원로석에서 신가온은 발언 종이의 여백이 부족하면 말을 줄이지 않고 종이를 한 장 더 청한다. 선로 가문 원로이며 한국에서 태어난 다문화 가정에서 자랐다. 집에서는 부모의 이주 언어와 한국어가 섞였으나 배차표와 회의 원본에는 표준 서식만 받는다. 그 이력은 충성이나 폭력의 예측 변수가 아니며, 신가온과 K167은 가문 명부에서 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 혈연 선로가문의 봉쇄 지시를 공식 배차표 아래로 눌러 박태겸의 조정권이 가문 회의를 삼키지 못하게 하려 했다. 야망은 원로석 서랍의 낡은 봉쇄 도장이었다. 효창 측선 창고 열쇠 한 자루가 사적 약속의 씨앗이다. 이중 언어 주석이 빠진 후계 문서는 벽에 붙이지 않았다.",
            "가문·기업·공동체": "환승선로문(HP02) 창구는 가문 원로석에도 중립 배차표 사본을 요구했다. 신가온은 헌장 참관만 받고 실재 상호를 가문 원장에서 지웠다. 창동 차륜 공급을 황노을과 조건으로 건 횟수가 공동체 위치였다. 전속 후국 소유 요구는 원로석 봉인 앞에서 반려된다.",
            "붕괴의 상처": "귀환 열차가 억류되던 밤, 가문 회의 세 안건이 동시에 정족수를 잃었다. 신가온은 봉쇄 도장을 서랍에 넣고 임초원의 억류 통보가 낭독될 때까지 후계 지명을 보류했다. 빈 의석이 정상 가문 총회로 기록되는 일이 가장 쓰라렸다. 난로가 꺼진 뒤에도 발언 종이를 접지 못했다.",
            "생존 전환점": "가문 봉쇄 지시를 현장에서 집행할지, 박태겸의 공식 배차표를 우선할지가 갈렸다. 해협삼로전구(XT03)의 용산 환적창 폐쇄 전갈이 원로석에 겹쳤다. 봉쇄를 택하면 가문 해석은 남지만 강다은의 배차가 멈추고, 공식표를 택하면 후계 회의가 하루 비고 차륜 공급 조건이 흔들린다. K167-TURN은 그 전갈을 덮은 도장의 방향이다.",
            "현재 지위": "신가온은 지금도 후국회의 원로석과 효창 측선 창고를 오가며 가문 발언 큐를 지킨다. 자리는 혈통 민족이 아니라 회의 서명과 참관 로그로만 유지된다. HP02가 원격 배차 독점을 요구해도 봉쇄 도장을 넘기지 않는다. 창고 열쇠는 가문 원로와 선로문 참관이 나눈다.",
            "비밀·빚·죄책감": "정족수가 무너지기 직전 한 안건의 이중 언어 주석을 서랍에만 남긴 일이 비밀이다. 살린 공식표와 그 밤 호명하지 못한 견습 배차원의 이름 사이에서 죄책감이 자란다. 전부 낭독 대신 부분 주석 공개만 남겼다. 서랍은 황노을과 강다은의 동시 입회 없이 열리지 않는다.",
            "관계 공동과거": "박태겸과 선로 가문 후계를 겨루는 일은 경쟁이고, 강다은이 가문 배차 지휘를 받는 일은 내부 위계다. 임초원에게 귀환 열차를 억류당한 원한과, 황노을과 차륜 공급을 조건으로 건 계약이 한 원로석에 겹친다. 같은 회의에서 어떤 도장은 구원이 되었고 어떤 보류는 배신의 증거로 남았다. 관계 끝점은 STORY-B012-K167로 이어진다.",
            "3막 개인 서사선": "1막에서 신가온은 정족수를 잃은 가문 안건을 다시 만난다. 2막에서 HP02 중립표와 XT03 환적 폐쇄를 원로석에서 저울질한다. 3막에서 봉쇄 또는 공식표 우선의 값을 배차 정지 시간으로 치른다. 서사선은 STORY-B012-K167이다.",
            "분기 결말": "한 갈래에서 신가온은 공식 배차표를 우선해 후국 중계를 살린다. 다른 갈래에서 가문 봉쇄를 택해 후계 해석과 서랍 주석을 지킨다. 선로 가문의 회의 슬롯은 남고 표식만 K167-OUT이다. 개입은 배차 입회 또는 봉쇄 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "정족수를 잃은 가문 안건에 후계 지명을 보류한다"
            },
            {
              "act": 2,
              "summary": "HP02 중립표와 XT03 환적 폐쇄를 원로석에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "봉쇄 또는 공식표 우선의 값으로 배차 정지를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K167-OUT-A",
              "summary": "공식 배차표 우선으로 후국 중계 연속"
            },
            {
              "id": "K167-OUT-B",
              "summary": "가문 봉쇄로 후계 해석과 서랍 주석 유지"
            }
          ]
        },
        {
          "id": "K191",
          "name": "조민재",
          "links": {
            "house": "HP08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B012-K191"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 삼호 냉동고 온도계 앞에서 조민재는 바늘이 한 칸 올라가면 경매 구호를 멈추고 칸 문을 먼저 닫는다. 냉동 상인이며 한국에서 태어난 다문화 가정에서 자랐다. 집 안 말과 시장 구호를 바꿔 쓰지만 온도 장부에는 한국어 숫자와 교차 주석만 받는다. 그 이력은 계급이나 능력의 보증이 아니며, 조민재와 K191은 상회 명부에서 교체되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 오해린의 전력·물 계약을 냉동 실무로 바꿔 서울 공통 결제 이전에도 얼음 신용이 버틸 칸을 만들려 했다. 야망은 온도계 뒤에 끼워 둔 여분 봉인 테이프였다. 용산 환적에 화물을 맡기겠다는 송이든과의 약속이 그 테이프에 남아 있다. 온도 공개 없는 시세는 경매판에 올리지 않았다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 전력 슬롯 순환을 의무로 두었다. 조민재는 헌장 참관만 받고 실재 상호를 온도 장부에서 지웠다. 마솔이 삼호 창고 온도 기록을 현장에서 집행하고 지마루가 전력을 대는 지휘 사슬이 공동체 위치였다. 전속 시장 소유 요구는 냉동고 봉인 앞에서 거절된다.",
            "붕괴의 상처": "남관 전력이 깜빡이던 밤, 삼호 세 칸 중 하나가 온도 상한에 닿았다. 조민재는 칸 문을 잠그고 오해린의 슬롯 재배정이 오기 전까지 경매를 열지 않았다. 상한에 닿은 칸이 정상 재고로 시세에 오르는 일이 가장 싫었다. 콤프레서 소음이 잦아도 테이프를 손에서 놓지 못했다.",
            "생존 전환점": "냉동 화물을 송이든의 용산 환적에 먼저 맡길지, 가락 시세 발표 시각을 남윤경과 다툴지가 갈렸다. 서해곡창전구(XT02)의 얼음 신용 중계가 온도계 유리에 겹쳤다. 환적을 택하면 칸은 버티지만 시세 발표가 늦고, 시세를 먼저 붙들면 환적 한 편이 녹는다. K191-TURN은 그 유리에 김 서린 순서다.",
            "현재 지위": "조민재는 지금도 삼호 냉동고와 수산시장 전력 슬롯 판을 오가며 온도 큐를 상회정에 넘긴다. 자리는 지분이 아니라 당일 온도 서명으로만 유지된다. HP08가 원격 슬롯 독점을 요구해도 칸 열쇠를 넘기지 않는다. 슬롯 권한은 상인대표 창구와 냉동상단 참관이 나눈다.",
            "비밀·빚·죄책감": "상한 직전 가족 몫 얼음을 한 줄 빼 둔 메모가 비밀이다. 살린 상회 신용과 그 때문에 줄인 이웃 배분 사이에서 죄책감이 자란다. 전부 공개 대신 마솔 입회 하의 한 줄 대조만 남겼다. 메모는 삼호 온도와 전력 로그의 동시 확인 없이 펼쳐지지 않는다.",
            "관계 공동과거": "오해린의 전력·물 계약을 냉동 실무로 돌리는 일은 지휘 관계이고, 송이든에게 화물을 맡기는 일은 환적 계약이다. 남윤경과 시세 발표 시각을 다투는 경쟁이 한 경매판에 겹친다. 같은 정전 밤 어떤 칸은 서로를 구했고 어떤 장부는 배신으로 남았다. 관계 끝점은 STORY-B012-K191로 이어진다.",
            "3막 개인 서사선": "1막에서 조민재는 온도 상한에 닿은 삼호 칸을 다시 만난다. 2막에서 HP08 슬롯 순환과 XT02 얼음 신용 중계를 온도계 앞에서 맞춘다. 3막에서 환적 또는 시세 우선의 값을 녹은 편으로 치른다. 서사선은 STORY-B012-K191이다.",
            "분기 결말": "한 갈래에서 조민재는 용산 환적 우선으로 칸의 연속을 살린다. 다른 갈래에서 시세 발표를 택해 상회 신용과 비밀 메모를 지킨다. 노량진 냉동 슬롯은 남고 표식만 K191-OUT이다. 개입은 환적 호위 또는 시세 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "온도 상한에 닿은 삼호 칸 문을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP08 슬롯 순환과 XT02 얼음 신용 중계를 온도계 앞에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "환적 또는 시세 우선의 값으로 녹은 편을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K191-OUT-A",
              "summary": "용산 환적 우선으로 냉동 칸 연속"
            },
            {
              "id": "K191-OUT-B",
              "summary": "시세 발표 우선으로 비밀 메모 유지"
            }
          ]
        },
        {
          "id": "K117",
          "name": "장석윤",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B012-K117"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "고덕기지 모래 훈련장 끝줄에서 장석윤은 구령을 멈추고 작전표의 한자·한글 병기가 빠졌는지부터 확인한다. 암사고덕상수단 고덕 장교단 교관이며 중국계 이산 가정에서 자랐다. 집 안 말과 훈련 구령을 바꿔 쓰지만 훈련 원본에는 표준 한국어와 교차 주석만 받는다. 그 이력은 충성·폭력·계급을 예측하지 않으며, 장석윤과 K117은 장교단 명부에서 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 그는 김우찬의 작전표를 장교 훈련으로 번역해 보호정부 구령이 가족 급수표보다 앞서지 못하게 하려 했다. 야망은 모래에 스틱으로만 그린 차단문 전술 도였다. 이강묵과 서남 경비를 거래하겠다는 약속이 그 도에 남아 있다. 병기 주석 없는 복무 조항은 게시판에 올리지 않았다.",
            "가문·기업·공동체": "성화궤도방위문(HC08) 교관 창구는 훈련 원장에 궤도 경비 우선 조항을 기입하라고 했다. 장석윤은 헌장 참관만 받고 실재 상호를 훈련 원장에서 지웠다. 차단문 전술을 이강묵과 나눈 횟수가 공동체 위치였다. 전속 호위단 소유 요구는 모래 끝줄 봉인 앞에서 반려된다.",
            "붕괴의 상처": "동부 화차 중량 로그가 공개되던 오후, 훈련장 세 열 중 하나가 강제복무 명부와 겹쳐 불려 나갔다. 장석윤은 호루라기를 주머니에 넣고 백온의 가족 명부 항의가 낭독될 때까지 구령을 재개하지 않았다. 가족 명부가 복무 명단으로 찍히는 일이 원한의 핵이었다. 모래바람이 잦아도 작전표를 접지 못했다.",
            "생존 전환점": "작전표를 장교 훈련으로 번역할지, 가족 명부를 강제복무와 묶은 조항을 공개 파기할지가 갈렸다. 두만극동전구(XT04)의 화차 중량 로그 공개 독촉이 모래 끝줄에 겹쳤다. 번역을 택하면 호위단 훈련은 이어지되 명부 창구가 하루 닫히고, 파기를 택하면 차단문 거래가 하루 멈춘다. K117-TURN은 그 호루라기의 침묵 길이다.",
            "현재 지위": "장석윤은 지금도 모래 훈련장과 차단문 교보재 창고를 오가며 훈련 큐를 장교단에 넘긴다. 자리는 사병 연공이 아니라 당일 훈련 서명과 교차 주석으로만 유지된다. HC08가 원격 구령 독점을 요구해도 호루라기를 넘기지 않는다. 창고 열쇠는 참모 창구와 방위문 참관이 나눈다.",
            "비밀·빚·죄책감": "불려 나가기 직전 한 열의 이름을 훈련 원장 여백에만 남긴 일이 비밀이다. 살린 작전 번역과 그 오후 빼내지 못한 가족 한 줄 사이에서 죄책감이 자란다. 전부 낭독 대신 이중 입회 하의 여백 대조만 남겼다. 여백은 김우찬과 이강묵의 동시 확인 없이 게시되지 않는다.",
            "관계 공동과거": "김우찬의 작전표를 훈련으로 번역하는 일은 지휘 관계이고, 이강묵과 차단문 전술을 거래하는 일은 계약이다. 백온의 가족 명부를 강제복무와 묶어 산 원한이 같은 모래 위에 겹친다. 같은 열에서 어떤 구령은 구원이 되었고 어떤 호명은 배신의 증거로 남았다. 관계 끝점은 STORY-B012-K117로 이어진다.",
            "3막 개인 서사선": "1막에서 장석윤은 강제복무와 겹친 훈련 열을 다시 만난다. 2막에서 HC08 비상 배차와 XT04 중량 로그 독촉을 모래 끝줄에서 맞춘다. 3막에서 번역 또는 파기의 값을 명부 창구 공백으로 치른다. 서사선은 STORY-B012-K117이다.",
            "분기 결말": "한 갈래에서 장석윤은 작전표 번역을 택해 호위단 훈련을 살린다. 다른 갈래에서 복무 조항 공개 파기를 택해 가족 명부와 여백 비밀을 지킨다. 고덕 장교단 슬롯은 남고 표식만 K117-OUT이다. 개입은 훈련 입회 또는 명부 공개 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "강제복무와 겹친 훈련 열에 구령을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC08 비상 배차와 XT04 중량 로그 독촉을 모래 끝줄에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "번역 또는 파기의 값으로 명부 창구 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K117-OUT-A",
              "summary": "작전표 번역으로 호위단 훈련 연속"
            },
            {
              "id": "K117-OUT-B",
              "summary": "복무 조항 파기로 가족 명부와 여백 유지"
            }
          ]
        },
        {
          "id": "H12",
          "name": "이채온",
          "links": {
            "house": "HC12",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B012-H12"
            ],
            "profile_anchor": "Cast-Index.md#S12",
            "custodian": "K290"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내 공구 벽 당직 단자 앞에서 이채온은 배터리 잔량 숫자를 센서 막대로만 읽는다. 합성 인간형 H12이며 호출명은 채온, 거도중공회(HC12) 공동 보관 아래 교체형 손모듈로 공구 봉인을 연다. 야간 시야는 제한되고 전 구역을 한눈에 보지 못하며 배터리 하한과 참관 봉인이 행동을 가른다. 표시 이름 이채온과 식별자 H12는 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "붕괴 전 교정 기록에는 S12 구역 연속 가동과 담당 인간 안전을 우선해 단독 원격 잠금을 막으려는 목표가 남아 있다. 우선순위는 공구 벽 측면 잔량 그래프에 점으로만 찍혀 있다. 장세화가 남긴 예비 배터리 슬롯 하나가 연속성 부채의 자리였다. 삼자 서명 없는 양도 명령은 실행 큐에 오르지 않았다.",
            "가문·기업·공동체": "거도중공회(HC12)는 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 이채온의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 스냅샷이 교대 단위로 양쪽에 동시에 기록된 횟수가 공동체 위치다. 전속 원격 소유 요구는 공구 벽 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "창동 차륜 호송이 관문 밖에서 멈추던 교대, 공구 벽 센서가 흑백 노이즈로 덮였다. 이채온은 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 손모듈 뚜껑을 잠갔다. 최고 우선 경보는 오탐 경로가 의료열차를 적대 표적으로 바꾸는 시나리오였다. 비상 전원이 돌아와도 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "노이즈 슬롯을 공개 분해 로그로 시민 참관에 넘길지, 예비 배터리로 신내 우회 환승 메시만 살릴지가 갈렸다. 임진관문전구(XT01)의 우회 환승 개방 요청이 수신 큐에 겹쳤다. 공개 분해를 택하면 원인 공급 코드가 드러나고, 우회 메시만 살리면 다른 야간 공구 슬롯 공백이 길어진다. H12-TURN은 그 수신 큐의 정렬 결과다.",
            "현재 지위": "이채온은 여전히 신내 공구 벽과 망우 정비 벤치 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 지위는 세습이 아니라 보관 책임·참관 봉인·삼자 서명 로그로만 유지된다. HC12가 전속 원격 소유를 요구해도 거부 코드를 반환하고, 현황 칸과 스냅샷 해시를 교대마다 맞춘다. 슬롯 열쇠 권한은 장세화 주정비와 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "참관 없이 한 번 올라간 펌웨어 패치 한 줄이 제한 로그의 비밀이다. 살린 우회 슬롯 노드와 그 교대에 호출하지 못한 예비 배터리 사이에서 가중치가 증가한다. 감정 서술 대신 제약 위반 카운터가 오르며 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. SECRET 플래그는 보관 책임과 시민 참관 동시 서명 없이는 해제되지 않는다.",
            "관계 공동과거": "장세화(K290)의 주정비·법적 책임은 보관 계약 코드였고, 류하늘(K081)의 교대 협력은 작업 큐였다. HC12 스튜어드십과의 원격 잠금 경쟁, 의료열차 당직과의 슬롯 양보가 한 공구 벽에 겹친다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다. 관계 원장 끝점은 STORY-B012-H12에 연결된다.",
            "3막 개인 서사선": "1막에서 이채온은 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HC12 원격 요구와 XT01 우회 환승 요청을 수신 큐에서 저울질한다. 3막에서 공개 분해 또는 우회 회생의 대가를 야간 공구 슬롯 공백과 배터리 할당 소모로 치른다. 서사선 식별자는 STORY-B012-H12로 고정된다.",
            "분기 결말": "결말 α에서 이채온은 노이즈 슬롯 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 우회 메시로 신내 환승 연속을 지킨다. 무한 에너지 해금 분기는 없으며 어느 쪽도 HC12 보관 슬롯을 삭제하지 않고 식별만 H12-OUT으로 갈린다. 플레이 개입은 분해 입회 또는 우회 전원 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "공구 벽 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HC12 원격 요구와 XT01 우회 환승을 수신 큐에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 우회 회생의 대가로 야간 슬롯 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H12-OUT-A",
              "summary": "노이즈 슬롯 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H12-OUT-B",
              "summary": "예비 배터리 우회 메시로 신내 환승 연속"
            }
          ]
        }
      ]
    },
    "B013": {
      "id": "B013",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K301",
          "name": "복감",
          "links": {
            "house": "HP02",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B013-K301"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내 기지 후문 자갈 위에서 복감은 하루 낡은 봉인 실을 잘라 내고 실측 못을 다시 박는다. 동북 외곽로 탐사원으로, 닫힌 말단 선로가 보이면 발부터 움직이되 소문만으로 우회로를 실선 그리는 동료를 빈 지도의 이웃이라 부른다. 한국 기원으로 신내망우환승시 생활권에서 자랐고, 손바닥에는 자갈 기름과 먹물이 함께 묻는다. 이름 복감과 식별자 K301은 정렬을 바꿔도 다시 매겨지지 않는다.",
            "붕괴 전 삶": "무너지기 전 겨울, 복감은 동북 외곽로와 후문 우회로를 한 원판에 묶어 암사 호위단의 임의 검색이 심사대를 건너뛰지 못하게 하려 했다. 야망의 흔적은 후문 빗물에 번진 분필 화살표였고, 그 화살표가 훗날 빚의 좌표가 된다. 봉인 자국이 하루만 낡아도 그는 지도를 접지 않고 다시 걸었다. 동료들은 그 습관을 고집이라 불렀으나 그는 실측하지 않은 선을 점선으로만 남겼다.",
            "가문·기업·공동체": "환승선로문(HP02)은 중립 배차표의 응급 칸을 이유로 후문 실측을 참관 의무에 넣으려 했다. 복감은 실재 상호를 원판 제목에 올리지 않는 후계 헌장만 인정하고, 장세화의 공동 점검 칸에만 좌표 해시를 남겼다. 공동체 위치는 자격증이 아니라 심사대와 후문에 동시에 붙인 실측 사본으로 증명됐다. 전속 검색 영장을 지도 여백에 옮기라는 요구는 봉인 실이 없는 쪽지로 반려됐다.",
            "붕괴의 상처": "암사 장교가 신내 심사대를 건너뛰고 기지 후문으로 들어온 흔적이 봉인 장부와 지도에서 동시에 비었다. 복감은 빈 칸을 추정으로 메우지 않고 자갈 위의 발자국만 먹으로 남겼다. 공포의 핵은 위조 우회로가 의료열차 후문으로 이어져 중립 선언이 빈 문구가 되는 장면이었다. 경보가 끊긴 뒤에도 그는 실측 못을 뽑지 않은 채 장갑을 벗지 않았다.",
            "생존 전환점": "고른 순간은 후문 좌표를 공개 원판에 실선으로 올릴지, 위조 우회로를 배차 회의실에서 찢을지다. 두만극동전구(XT04) 쪽 화차 중량 독촉이 확성기로 들어오자 계산이 달라졌다. 좌표를 올리면 의료열차 후문은 살아남지만 야간 실측 인원이 빠지고, 위조 선을 먼저 찢으면 한쪽 호위단이 검색 영장을 실선으로 삼는다. 그 선택은 K301-TURN으로 남고, 되돌리면 신내 응급 칸이 한 교대 멈춘다.",
            "현재 지위": "복감은 신내 후문 실측표 앞에 서서 봉인 날짜만 고친다. 탐사원 자리는 세습이 아니라 실측 해시·심사 입회·배차 로그로만 유지된다. 환승선로문이 전속 우회로 소유를 요구해도 그는 점선 규칙을 거두지 않는다. Cast 프로필의 현황 칸과 원판 여백은 매주 같은 못 자국으로 맞춰진다.",
            "비밀·빚·죄책감": "비밀은 그가 자갈 밑에 묻어 둔, 하루 먼저 그린 위조 우회 스케치다. 죄책감은 살린 의료열차 칸과 그 밤 부르지 못한 심사 견습의 이름 사이에서만 자란다. 스케치를 전부 공개하면 신내 신뢰가 한 슬롯 끊길 수 있어 참관 두 명의 동시 날인만 남겨 두었다. SECRET 키는 장세화 입회 없이는 후문 함에서 나오지 않는다.",
            "관계 공동과거": "문시온에게 넘긴 후문 실측은 계약이었고, 봉모의 심사대 칠판에 같은 줄을 붙인 밤은 동맹이었다. 장세화의 중립 제목을 원판 머리에 남긴 일은 호송 우선을 지키려는 거래였다. 같은 자갈 위에서 서로를 끌어 올린 기록과, 좌표를 반나절 숨긴 기록이 함께 남았다. 관계 원장 끝점은 보존된 채 STORY-B013-K301에 이어진다.",
            "3막 개인 서사선": "1막에서 복감은 심사대와 후문에서 동시에 빈 봉인 칸을 다시 만난다. 2막에서 HP02 응급 칸 의무와 XT04 화차 독촉을 실측표 한 장에서 순서를 매긴다. 3막에서 좌표 공개 또는 위조 선 폐기의 값을 야간 실측 공백으로 치른다. 서사선 식별자는 STORY-B013-K301로 고정된다.",
            "분기 결말": "결말 α에서 복감은 후문 좌표를 원판에 실선으로 올려 의료열차 후문을 지킨다. 결말 β에서 위조 우회로를 배차조 앞에서 폐기해 검색 영장의 실선화를 막는다. 어느 쪽도 신내망우환승시의 16국 슬롯을 지우지 않으며, 분기 식별만 K301-OUT으로 갈라진다. 플레이 개입은 좌표 복원 호위 또는 위조 선 폐기 입회 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "심사대와 후문에서 동시에 빈 봉인 칸을 확인한다"
            },
            {
              "act": 2,
              "summary": "HP02 응급 칸과 XT04 화차 독촉의 순서를 실측표에서 매긴다"
            },
            {
              "act": 3,
              "summary": "좌표 공개 또는 위조 선 폐기의 값을 야간 실측 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K301-OUT-A",
              "summary": "후문 좌표 실선화로 의료열차 후문 유지"
            },
            {
              "id": "K301-OUT-B",
              "summary": "위조 우회로 폐기로 검색 영장 실선화 차단"
            }
          ]
        },
        {
          "id": "K326",
          "name": "원미루",
          "links": {
            "house": "HP06",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B013-K326"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "청량리 후문 약상자 뚜껑을 열고 원미루는 캡슐 이음새에 남은 풀 냄새를 한 번 더 맡는다. 원산지·위조약 탐사원으로, 생약의 냄새와 이음새로 출처를 읽되 소문만으로 산지를 실선 그리는 일을 늦은 표본과 같은 죄로 본다. 한국 기원으로 약령의정동맹 골목에서 자랐고, 손톱 밑에 약가루가 굳어 있다. 표시 이름 원미루·K326 쌍은 원장 정렬로도 바뀌지 않는다.",
            "붕괴 전 삶": "시장이 매일 열리던 해에 원미루는 동부 생약 원산지와 위조 캡슐 경로를 공개 원판에 묶어 강국 보호창고 인장이 바닥 좌판에 내려오지 못하게 하려 했다. 야망은 선반 아래 숨긴 대조 표본 한 봉지에 남아, 훗날 빚의 무게가 된다. 늦은 표본을 그는 변명이 아니라 빈 칸으로 적었다. 동료들은 그 빈 칸을 고집으로 불렀으나 그는 실측하지 않은 산지를 점선으로만 남겼다.",
            "가문·기업·공동체": "약령치유문(HP06)은 처방 이중확인을 이유로 오염 좌표 참관을 의무 칸에 넣으려 했다. 원미루는 실재 제품명을 로트 게시판에 올리지 않는 후계 헌장만 인정하고, 정하린의 공동 점검 칸에만 산지 해시를 남겼다. 공동체 위치는 면허증이 아니라 선반 약과 후문 상자를 같은 줄에 대조한 횟수로 증명됐다. 독점 구매서를 원판 제목으로 쓰라는 요구는 로트 불량 쪽지로 반려됐다.",
            "붕괴의 상처": "가짜 해열제 캡슐이 강국 보호창고 인장과 같다는 증언이 들어오자 원미루는 청량리 후문을 혼자 측량했다. 그는 인장을 추정으로 단죄하지 않고 이음새 풀의 건조 시간만 일지에 적었다. 공포의 핵은 탐사 표본이 선매 장부와 함께 사라져 가짜 약이 북산 어린이 약으로 확정되는 장면이었다. 경보가 꺼진 뒤에도 그는 대조 표본 봉지를 놓지 않았다.",
            "생존 전환점": "고른 순간은 위조 산지를 점선으로 남길지, 인장 원판을 빼내 보호창고 조작으로 몰지다. 두만극동전구(XT04) 쪽 동상 환자 큐가 의무실 확성기로 들어오자 계산이 달라졌다. 점선을 지키면 시장 바닥의 해석권은 살아남지만 야간 대조 인원이 빠지고, 원판을 빼면 한쪽 창구가 산지 해석을 독점한다. 그 선택은 K326-TURN으로 남고, 되돌리면 약령 선반의 공개 로트가 한 교대 멈춘다.",
            "현재 지위": "원미루는 약령 선반에서 캡슐 이음새를 손톱으로 훑으며 로트 번호를 소리 내어 맞춘다. 탐사원 자리는 세습이 아니라 대조 해시·처방 이중확인·입회 서명으로만 유지된다. 약령치유문이 전속 산지 소유를 요구해도 그는 점선 산지를 실선으로 올리지 않는다. 서이안의 약효 기록과 겹치지 않는 인장은 원판 여백에만 머문다.",
            "비밀·빚·죄책감": "비밀은 그가 선반 뒤에 가둔, 날짜가 하루 앞선 대조 표본이다. 죄책감은 살린 해열 로트와 그 밤 호출하지 못한 북산 증언 줄 사이에서만 자란다. 표본을 전부 공개하면 약령 신뢰가 한 칸 끊길 수 있어 시민 참관 두 명의 동시 날인만 남겨 두었다. 은채윤의 선반 약과 겹치는 봉지는 라세영 입회 없이 열리지 않는다.",
            "관계 공동과거": "라세영에게 넘긴 오염 좌표는 계약이었고, 은채윤의 선반 약을 대조 표본으로 받은 아침은 나눔이었다. 백온의 북산 증언을 원판 여백에 옮긴 밤은 구원이 되었고, 같은 여백에서 하루 숨긴 숫자는 배신으로 읽히기도 했다. 어느 관계도 약 냄새만으로 편을 가르지 않았다. 관계 끝점은 보존된 채 STORY-B013-K326으로 이어진다.",
            "3막 개인 서사선": "개시 시각에 원미루는 가짜 해열제 캡슐과 같은 인장의 후문 상자를 다시 연다. 한가운데에서 HP06 이중확인과 XT04 동상 큐를 조제실 저울에 올린다. 닫는 장에서 점선 유지 또는 원판 반출의 값을 선반 공개 공백으로 치른다. 서사선은 STORY-B013-K326이다.",
            "분기 결말": "결말 α에서 원미루는 위조 산지를 점선으로 남겨 시장 해석권을 지킨다. 결말 β에서 인장 원판을 빼내 보호창고 쪽 조작 경로를 공개한다. 약효 원판의 점선 규칙은 어느 분기도 폐기하지 않으며, 분기 식별만 K326-OUT으로 갈라진다. 플레이 개입은 점선 수호 입회 또는 원판 반출 호위 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "가짜 해열제 캡슐과 같은 인장의 후문 상자를 연다"
            },
            {
              "act": 2,
              "summary": "HP06 이중확인과 XT04 동상 큐를 조제실 저울에 올린다"
            },
            {
              "act": 3,
              "summary": "점선 유지 또는 원판 반출의 값을 선반 공개 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K326-OUT-A",
              "summary": "위조 산지 점선 유지로 시장 해석권 보존"
            },
            {
              "id": "K326-OUT-B",
              "summary": "인장 원판 반출로 보호창고 조작 경로 공개"
            }
          ]
        },
        {
          "id": "K351",
          "name": "동새봄",
          "links": {
            "house": "HP07",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B013-K351"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "구의 교각 그늘에서 동새봄은 금 간 상수관만 남기고 추정 칸의 붉은 먹을 걷어 낸다. 교량 하부 탐사원으로 심가은의 실무를 맡되, 목격과 추정을 다른 색으로 적게 하고 위기 때는 추정 칸을 지운다. 한국 기원으로 아차구의관문국 능선 아래에서 자랐고, 장화 코에는 강물 녹이 슨다. 호칭 동새봄과 번호 K351은 배치가 바뀌어도 한 쌍으로 남는다.",
            "붕괴 전 삶": "교량이 아직 주간 점검만 받던 시절, 동새봄은 하부와 상수관 파손 좌표를 공개 원판에 묶어 물 기술자의 정보 독점과 암사 후견을 함께 끊으려 했다. 야망은 교각 여백에 남긴 균열 이름이었고, 그 이름이 훗날 원한의 씨앗이 될까 봐 그는 추정을 실선으로 올리지 않았다. 보고를 빨리 쓰되 해석을 보태는 상관의 버릇을 현장에서 깎았다. 실측하지 않은 파손은 점선으로만 남겼다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 풍속 폐쇄 기준을 이유로 하부 좌표 참관을 의무화하려 했다. 동새봄은 실재 상호를 원판 제목에 올리지 않는 후계 헌장만 인정하고, 고서준의 공동 점검 칸에만 균열 해시를 남겼다. 공동체 위치는 직위가 아니라 능선과 교량에 동시에 붙인 파손 사본으로 증명됐다. 적대행위 문장을 원판에 옮기라는 요구는 고서준 직보 전에 난외로 내려졌다.",
            "붕괴의 상처": "상수관 파손을 적대행위로 적은 척후 보고가 능선과 교량에 동시에 퍼지자 동새봄은 추정 칸을 지우고 금 간 관만 공개했다. 그는 오인 실선이 동부 교량 전쟁으로 번져 자신이 원한의 대상이 되는 장면을 일지의 마지막 줄에 쓰지 못한 채 먹 붓을 내려놓았다. 경보음 대신 관에서 새는 물소리만 남았다. 지운 추정은 별도 함에 가두고 불태우지 않았다.",
            "생존 전환점": "고른 순간은 지운 추정 칸 원본을 능선 게시판에 붙일지, 오인 실선을 덮어 수비대 통합을 가속할지다. 임진관문전구(XT01) 쪽 봉인 키 분할 독촉이 관문 무전으로 들어오자 계산이 달라졌다. 원본을 붙이면 해석권은 살아남지만 야간 하부 인원이 빠지고, 실선을 덮으면 한쪽 수비대가 파손 해석을 독점한다. 그 선택은 K351-TURN으로 남고, 되돌리면 구의 급수 한 슬롯이 멈춘다.",
            "현재 지위": "동새봄은 잠수교 잔교에서 풍속 숫자를 읽고 금 간 관에 분필로 날짜를 쓴다. 실무 담당 자리는 세습이 아니라 목격 색 먹·점선 규칙·입회 로그로만 유지된다. 한강교량공회가 전속 하부 소유를 요구해도 그는 적대행위 문장을 원판 본문에 올리지 않는다. 안기준이 붙인 교각 균열 이름은 여백에서만 살아 있다.",
            "비밀·빚·죄책감": "비밀은 별도 함에 가둔, 지운 추정 칸의 원본 먹이다. 죄책감은 살린 급수 골목과 그 밤 부르지 못한 척후 견습의 이름 사이에서만 자란다. 원본을 전부 붙이면 아차 신뢰가 한 교각 끊길 수 있어 심가은과 고서준의 동시 날인만 남겨 두었다. 함의 열쇠는 관문 참관 없이 열리지 않는다.",
            "관계 공동과거": "심가은의 척후 보고를 좌표로 번역한 일은 사제 계약이었고, 안기준의 교각 균열 이름을 여백에 적은 밤은 같은 현장의 나눔이었다. 장세화의 환승 정보를 점선으로만 맞교환한 기록은 협력과 거리 두기가 한 줄에 남는다. 같은 잔교에서 서로를 끌어 올린 새벽과, 추정을 반나절 숨긴 새벽이 함께 있다. 관계 끝점은 STORY-B013-K351로 이어진다.",
            "3막 개인 서사선": "첫 장면에서 동새봄은 적대행위로 적힌 척후 문장과 금 간 관을 다시 대조한다. 한가운데에서 HP07 풍속 기준과 XT01 봉인 키 분할을 잔교 무전으로 맞춘다. 닫는 장에서 추정 원본 공개 또는 오인 실선 덮개의 값을 야간 급수 공백으로 치른다. 서사선 ID는 STORY-B013-K351로 고정된다.",
            "분기 결말": "결말 α에서 동새봄은 추정 칸 원본을 능선에 붙여 오인 확전을 늦춘다. 결말 β에서 오인 실선을 덮어 수비대 통합을 가속한다. 어느 쪽도 아차구의관문국의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K351-OUT으로 갈라진다. 플레이 개입은 원본 공개 호위 또는 실선 덮개 입회 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "적대행위로 적힌 척후 문장과 금 간 관을 대조한다"
            },
            {
              "act": 2,
              "summary": "HP07 풍속 기준과 XT01 봉인 키 분할을 잔교 무전으로 맞춘다"
            },
            {
              "act": 3,
              "summary": "추정 원본 공개 또는 오인 실선 덮개의 값을 야간 급수 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K351-OUT-A",
              "summary": "추정 칸 원본 공개로 오인 확전 지연"
            },
            {
              "id": "K351-OUT-B",
              "summary": "오인 실선 덮개로 수비대 통합 가속"
            }
          ]
        },
        {
          "id": "K376",
          "name": "원주온",
          "links": {
            "house": "HP08",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B013-K376"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 우회 저장고 자물쇠 앞에서 원주온은 온도 로그가 끊긴 칸의 봉인 날짜를 손톱으로 긁는다. 동남 우회 저장고 탐사원으로, 닫힌 창고가 보이면 손전등부터 켜되 흉작 소문만으로 우회로를 그리는 일을 빈 상자의 이웃이라 부른다. 한국 기원으로 가락잠실배급국 경매 골목에서 자랐고, 장갑에는 얼음 결정이 남는다. 이름 원주온과 번호 K376은 낙찰 순번과 섞이지 않는다.",
            "붕괴 전 삶": "경매 종이 종을 치던 해에 원주온은 가락·잠실 바깥 우회 저장고를 공개 원판에 묶어 생산국 직거래가 경매대를 빈 상자로 만들지 못하게 하려 했다. 야망은 칠판 아래 숨긴 우회 좌표 쪽지였고, 그 쪽지가 훗날 군량 전용의 미끼가 될까 봐 그는 실측 없는 저장을 점선으로만 남겼다. 봉인 자국이 하루만 낡아도 지도를 접지 않았다. 남윤경의 비공개 비상배급은 원판 제목으로 올리지 않기로 스스로 묶었다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 전력 슬롯 순환을 이유로 우회 좌표 참관을 의무 칸에 넣으려 했다. 원주온은 실재 상호를 경매 칠판에 올리지 않는 후계 헌장만 인정하고, 구하온의 온도 로그 인쇄 칸에만 좌표 해시를 남겼다. 공동체 위치는 직위가 아니라 창고 기지 칠판과 경매대에 동시에 붙인 사본으로 증명됐다. 군량 문장의 검색 영장을 지도 여백에 옮기라는 요구는 온도 로그가 끊긴 쪽지로 반려됐다.",
            "붕괴의 상처": "창고 봉쇄 밤, 안쪽 개봉 흔적과 우회 저장고 지도에서 같은 칸이 동시에 비었다. 원주온은 빈 칸을 흉작 소문으로 메우지 않고 자물쇠 온도만 일지에 적었다. 공포의 핵은 위조 우회로가 군량 전용으로 이어져 시민 배급이 점선만 남는 장면이었다. 모터 소음이 꺼진 뒤에도 그는 봉인 실을 주머니에서 빼지 않았다.",
            "생존 전환점": "고른 순간은 우회 좌표를 경매 칠판에 복원할지, 위조 우회로를 낙찰자 앞에서 폐기할지다. 해협삼로전구(XT03) 쪽 통조림 할당 독촉이 환적 창구 무전으로 들어오자 계산이 달라졌다. 좌표를 복원하면 시민 배급 칸은 살아남지만 야간 저장 인원이 빠지고, 위조 선을 폐기하면 한쪽 입찰이 우회 해석을 독점한다. 그 선택은 K376-TURN으로 남고, 되돌리면 가락 얼음 창고의 공개 슬롯이 한 교대 멈춘다.",
            "현재 지위": "원주온은 노량진이 아니라 가락 얼음 창고 쪽에서 전력 슬롯 순번을 분필로 고친다. 탐사원 자리는 세습이 아니라 온도 로그·봉인 날짜·입회 서명으로만 유지된다. 시장냉동상단이 전속 우회 소유를 요구해도 그는 군량 영장을 원판 본문에 옮기지 않는다. 판효담의 창고 기지 칠판과 주 단위로 좌표만 맞춘다.",
            "비밀·빚·죄책감": "비밀은 자물쇠 홈에 접어 넣은, 하루 먼저 그린 우회 스케치다. 죄책감은 살린 배급 상자와 그 밤 부르지 못한 경매 견습의 이름 사이에서만 자란다. 스케치를 전부 붙이면 가락 신뢰가 한 칸 끊길 수 있어 구하온과 라진우의 동시 날인만 남겨 두었다. 남윤경의 비상배급 숫자는 제목란이 아니라 난외에만 있다.",
            "관계 공동과거": "라진우에게 넘긴 우회 실측은 계약이었고, 판효담의 창고 기지 칠판에 좌표를 붙인 밤은 같은 봉인의 나눔이었다. 남윤경의 비공개 비상배급을 원판 제목으로 남기지 않기로 한 침묵은 배신으로 읽히기도 했고, 같은 침묵이 시민 칸을 구하기도 했다. 온도 숫자만으로 편을 가르지 않았다. 관계 끝점은 STORY-B013-K376에 이어진다.",
            "3막 개인 서사선": "1막에서 원주온은 봉쇄 밤의 빈 칸과 개봉 흔적을 같은 자물쇠에서 다시 만난다. 2막에서 HP08 전력 슬롯과 XT03 통조림 할당을 칠판 한 줄에서 저울질한다. 3막에서 좌표 복원 또는 위조 선 폐기의 값을 얼음 창고 공백으로 치른다. 서사선은 STORY-B013-K376이다.",
            "분기 결말": "결말 α에서 원주온은 우회 좌표를 경매 칠판에 복원해 시민 배급 칸을 살린다. 결말 β에서 위조 우회로를 낙찰자 앞에서 폐기해 군량 전용 실선화를 막는다. 어느 쪽도 가락잠실배급국의 16국 슬롯을 지우지 않으며, 분기 식별만 K376-OUT으로 갈라진다. 현장 개입은 경매 칠판 복원 호위와 낙찰석 폐기 입회 가운데 하나만 고르며 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "봉쇄 밤의 빈 칸과 개봉 흔적을 같은 자물쇠에서 확인한다"
            },
            {
              "act": 2,
              "summary": "HP08 전력 슬롯과 XT03 통조림 할당을 칠판 한 줄에서 저울질한다"
            },
            {
              "act": 3,
              "summary": "좌표 복원 또는 위조 선 폐기의 값을 얼음 창고 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K376-OUT-A",
              "summary": "우회 좌표 복원으로 시민 배급 칸 유지"
            },
            {
              "id": "K376-OUT-B",
              "summary": "위조 우회로 폐기로 군량 전용 실선화 차단"
            }
          ]
        },
        {
          "id": "K400",
          "name": "천늘우",
          "links": {
            "house": "HC02",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B013-K400"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 서고 칠판 아래 자갈에서 천늘우는 세 장의 급수계약서를 겹치지 않게 펼친다. 수서 외곽 탐사원으로, 닫힌 남부 연결로가 보이면 측량 줄을 먼저 풀되 소문만으로 우회로를 그리는 사절을 빈 서고의 손님으로 대한다. 한국 기원으로 수서강남협약도시 회차선 옆에서 자랐고, 소매에는 분필 가루가 남는다. 호칭 천늘우와 식별자 K400은 추첨 구슬과 같은 함에 넣지 않는다.",
            "붕괴 전 삶": "사절 대기실이 냉방을 쓰던 해에 천늘우는 수서 기지와 남부 외곽 우회로를 공개 원판에 묶어 강국 사절이 심사대를 건너뛰지 못하게 하려 했다. 야망은 서고 칠판의 화살표였고, 그 화살표가 공동교섭을 빈 문구로 만들까 봐 그는 실측 없는 선을 점선으로만 남겼다. 봉인 자국이 하루만 낡아도 지도를 다시 걸었다. 정유라의 표준 서식은 제목으로만 남기고 본문 숫자와 섞지 않았다.",
            "가문·기업·공동체": "해륜기동문(HC02)은 배터리 셀 순환을 이유로 후문 실측을 참관 의무에 넣으려 했다. 천늘우는 실재 상호를 의회 원장에 올리지 않는 후계 헌장만 인정하고, 유세진의 공동 점검 칸에만 좌표 해시를 남겼다. 공동체 위치는 직위가 아니라 서고 칠판과 심사대에 동시에 붙인 사본으로 증명됐다. 강국 문장의 검색 영장을 지도 여백에 옮기라는 요구는 급수계약서 세 장을 겹친 채로 반려됐다.",
            "붕괴의 상처": "세 강국 사절이 서로 다른 급수계약서를 들고 온 주, 기지 후문 흔적이 봉인 장부와 지도에서 동시에 비었다. 천늘우는 빈 칸을 사절 말로 메우지 않고 자갈 위의 바퀴 자국만 먹으로 남겼다. 공포의 핵은 위조 우회로가 서고 후문으로 이어져 공동교섭이 빈 문구가 되는 장면이었다. 회차선 안내 방송이 끊긴 뒤에도 그는 분필을 떨어뜨리지 않았다.",
            "생존 전환점": "고른 순간은 후문 실측을 의회 서고에 되돌릴지, 위조 우회로를 사절석에서 폐기할지다. 원양신탁전구(XT05) 쪽 인도 목록 회차 독촉이 배차 무전으로 들어오자 계산이 달라졌다. 실측을 되돌리면 공동교섭의 뼈대는 살아남지만 야간 외곽 인원이 빠지고, 위조 선을 폐기하면 한쪽 사절이 우회 해석을 독점한다. 그 선택은 K400-TURN으로 남고, 되돌리면 수서 회차 슬롯이 한 교대 멈춘다.",
            "현재 지위": "천늘우는 수서 회차선이 아니라 서고 칠판 앞에서 후문 화살표만 고친다. 탐사원 자리는 세습이 아니라 실측 줄·표준 서식 제목·입회 로그로만 유지된다. 해륜기동문이 전속 외곽로 소유를 요구해도 그는 검색 영장을 원판 본문에 옮기지 않는다. 영마온에게 넘길 사본과 원초온 칠판의 좌표는 같은 날 맞춰진다.",
            "비밀·빚·죄책감": "비밀은 칠판 레일 뒤에 끼워 둔, 사절이 오기 전날 그린 위조 우회 스케치다. 죄책감은 살린 심사대 줄과 그 밤 부르지 못한 서고 견습의 이름 사이에서만 자란다. 스케치를 전부 공개하면 수서 신뢰가 한 칸 끊길 수 있어 정유라와 유세진의 동시 날인만 남겨 두었다. 판지솔의 추첨 원장 순번은 이 스케치와 한 줄에 적히지 않는다.",
            "관계 공동과거": "영마온에게 넘긴 후문 실측은 계약이었고, 원초온의 서고 칠판에 좌표를 붙인 저녁은 같은 분필의 나눔이었다. 정유라의 표준 서식을 원판 제목으로 남긴 일은 공동교섭을 지키려는 거래였고, 판지솔과 나눈 추첨 순번은 지휘가 아니라 시각 맞춤이었다. 같은 자갈에서 서로를 일으킨 기록과, 화살표를 반나절 지운 기록이 함께 남았다. 관계 끝점은 STORY-B013-K400으로 이어진다.",
            "3막 개인 서사선": "개시 시각에 천늘우는 서로 다른 급수계약서 세 장과 빈 후문 칸을 다시 펼친다. 한가운데에서 HC02 셀 순환과 XT05 인도 회차를 서고 무전으로 맞춘다. 닫는 장에서 실측 복원 또는 위조 선 폐기의 값을 회차 안내 공백으로 치른다. 서사선 식별자는 STORY-B013-K400으로 고정된다.",
            "분기 결말": "결말 α에서 천늘우는 후문 실측을 의회 서고에 되돌려 공동교섭의 뼈대를 살린다. 결말 β에서 위조 우회로를 사절석에서 폐기해 검색 영장의 실선화를 막는다. 어느 쪽도 수서강남협약도시의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K400-OUT으로 갈라진다. 플레이 개입은 실측 복원 호위 또는 위조 선 폐기 입회 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "서로 다른 급수계약서 세 장과 빈 후문 칸을 펼친다"
            },
            {
              "act": 2,
              "summary": "HC02 셀 순환과 XT05 인도 회차를 서고 무전으로 맞춘다"
            },
            {
              "act": 3,
              "summary": "실측 복원 또는 위조 선 폐기의 값을 회차 안내 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K400-OUT-A",
              "summary": "후문 실측 복원으로 공동교섭 뼈대 유지"
            },
            {
              "id": "K400-OUT-B",
              "summary": "위조 우회로 폐기로 검색 영장 실선화 차단"
            }
          ]
        },
        {
          "id": "K013",
          "name": "채온결",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B013-K013"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "영등포 관로 맨홀 뚜껑을 열며 채온결은 쇠망치 소리가 발소리보다 먼저 올라오는지 듣는다. 관로 순찰대 조장으로, 야간 무단 도하를 사고보다 고의로 보되 부하의 급수표가 밀리면 자신이 습지를 먼저 걷는다. 한국 기원으로 여의신정수문정부 생활권에서 자랐고, 장갑 안쪽에는 관로 녹물이 배어 있다. 이름 채온결과 식별자 K013은 암호패 번호와 바꿔 쓰지 않는다.",
            "붕괴 전 삶": "수문이 주간 교대만 열리던 시절, 채온결은 영등포 관로와 교량 밑 순찰을 수문경비 단일 암호패로 묶어 수문헌장의 야간 뼈대가 되려 했다. 야망은 칠판의 순찰 시각표였고, 그 시각표가 외부 보호군의 공백 메우기 명분이 될까 봐 그는 김태운의 암호패 없는 통과를 거부했다. 발소리보다 관 소리를 먼저 듣는 습관은 그때 굳었다. 야간 교량 밑은 공개 칠판에 쓰되 암호 없이 열지 않았다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 수문 키 분할 보관을 이유로 관로 순찰 참관을 의무 칸에 넣으려 했다. 채온결은 실재 상호를 순찰 원장에 올리지 않는 후계 헌장만 인정하고, 한재목의 공동 점검 칸에만 시각 해시를 남겼다. 공동체 위치는 조장 직위가 아니라 펌프 시운전 종료 시각에 맞춰 재배치한 횟수로 증명됐다. 한 권역 전면 차수 명령은 물을 무기로 쓰는 쪽으로 읽혀 현장에서 반려됐다.",
            "붕괴의 상처": "임하준 실종 뒤 중앙 급수계약이 멈추자 채온결은 영등포 야간 사격선을 교량 밑까지 내렸다. 그는 관로 한 곳이 폭파되어 정수가 역류하고 그 공백을 외부 보호군이 메우는 장면을 일지의 마지막 줄에 쓰지 못한 채 무전기를 꺼 두었다. 맨홀에서 올라온 쇠 냄새만 남았다. 사격선 깃발은 거두지 않고 젖은 채로 묶여 있었다.",
            "생존 전환점": "고른 순간은 폭파 소문의 진원을 밝혀 사격선을 거둘지, 암호패 유출을 상부에 넘겨 조장 교체를 받을지다. 서해곡창전구(XT02) 쪽 부두 배수 일정 독촉이 수문 무전으로 들어오자 계산이 달라졌다. 진원을 밝히면 관로 연속은 살아남지만 야간 조 인원이 빠지고, 유출을 넘기면 한쪽 창구가 순찰 해석을 독점한다. 그 선택은 K013-TURN으로 남고, 되돌리면 임바다의 단수 골목이 한 교대 비어 간다.",
            "현재 지위": "채온결은 교량 밑 사격선 깃발 옆에서 순찰 시각만 분필로 고친다. 조장 자리는 세습이 아니라 암호패 입회·펌프 시각·맨홀 로그로만 유지된다. 아리수수문가가 전속 관로 소유를 요구해도 그는 키를 한 주머니에 모으지 않는다. 허도담의 시운전이 끝나는 시각과 순찰 재배치는 같은 칠판에서만 만난다.",
            "비밀·빚·죄책감": "비밀은 맨홀 벽에 숯으로 남긴, 사격선을 한 시각 먼저 내린 표시다. 죄책감은 지킨 단수 골목과 그 밤 부르지 못한 습지 견습의 이름 사이에서만 자란다. 표시를 전부 공개하면 여의 신뢰가 한 관 끊길 수 있어 김태운과 한재목의 동시 날인만 남겨 두었다. 명우재와 나눈 맨홀 출입 시각은 이 숯 표시와 한 줄에 적히지 않는다.",
            "관계 공동과거": "김태운의 수문 지휘를 현장에서 집행한 일은 지휘 계약이었고, 허도담의 펌프 시운전에 맞춰 순찰을 재배치한 밤은 같은 시각표의 나눔이었다. 임바다의 단수 골목을 우선 지킨 기록은 구원이 되었고, 명우재와 야간 순찰·맨홀 출입을 나눈 일은 지휘를 쪼갠 동맹이었다. 같은 습지에서 서로를 끌어 올린 기록과, 사격선을 반나절 숨긴 기록이 함께 남았다. 관계 끝점은 STORY-B013-K013에 이어진다.",
            "3막 개인 서사선": "1막에서 채온결은 멈춘 급수계약과 교량 밑 사격선을 다시 만난다. 2막에서 HP01 키 분할과 XT02 부두 배수 독촉을 맨홀 무전으로 맞춘다. 3막에서 진원 공개 또는 암호패 유출 보고의 값을 야간 순찰 공백으로 치른다. 서사선은 STORY-B013-K013이다.",
            "분기 결말": "결말 α에서 채온결은 폭파 소문의 진원을 밝혀 사격선을 거두고 관로 연속을 고른다. 결말 β에서 암호패 유출을 상부에 넘겨 조장 교체를 받고 개인 생존 선을 고른다. 어느 쪽도 여의신정수문정부의 16국 슬롯을 지우지 않으며, 분기 식별만 K013-OUT으로 갈라진다. 플레이 개입은 진원 추적 호위 또는 유출 보고 입회 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "멈춘 급수계약과 교량 밑 사격선을 확인한다"
            },
            {
              "act": 2,
              "summary": "HP01 키 분할과 XT02 부두 배수 독촉을 맨홀 무전으로 맞춘다"
            },
            {
              "act": 3,
              "summary": "진원 공개 또는 암호패 유출 보고의 값을 야간 순찰 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K013-OUT-A",
              "summary": "폭파 진원 공개로 사격선 거둠·관로 연속"
            },
            {
              "id": "K013-OUT-B",
              "summary": "암호패 유출 보고로 조장 교체·개인 생존 선"
            }
          ]
        },
        {
          "id": "K216",
          "name": "권미래",
          "links": {
            "house": "HC01",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B013-K216"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신탑 3층 기계실에서 권미래는 끊긴 반송파를 사람 말보다 먼저 욕한다. 송신 기사로, 밤샘을 두려워하지 않되 전파의 끊김을 인격 모욕으로 느끼고 기계를 사람보다 정직하다고 말한다. 한국 출생 다문화 가정에서 자랐고 집 안에서는 어머니 쪽 말로 주파수 별명을 붙였으나, 방송 원장은 표준 한국어만 받으며 그 별명은 편을 가르는 표가 되지 않는다. 표시 이름 권미래와 번호 K216은 채널 번호와 바꿔 쓰지 않는다.",
            "붕괴 전 삶": "옥상 냉각팬이 밤새 돌던 해에 권미래는 강국이 전원을 내려도 살아남는 다중 송신망을 상암·도성·창동에 심어 문가람의 공개 방송망을 물리적으로 완성하려 했다. 야망은 예비 전원함 세 곳에 나눈 셀 번호였고, 그 번호가 승자의 선전국 낙인으로 팔릴까 봐 그는 단일 채널 단독 송신을 편성회의 승인 없이 막았다. 집 안 별명은 공구함 안쪽에만 연필로 남았다. 방송 로그의 공백은 편집이 아니라 장애로만 적었다.",
            "가문·기업·공동체": "청람전자원(HC01)은 야간 냉각 분배를 이유로 송신키 공유를 의무 칸에 넣으려 했다. 권미래는 실재 상호·제품명을 기계실 원장에서 지우고 후계 헌장 참관만 받았으며, 허은찬의 공동 점검 칸에만 주파수 해시를 남겼다. 공동체 위치는 직위가 아니라 예비 전원을 세 곳으로 나눈 횟수와 이중 언어 주석이 붙은 장애 일지로 증명됐다. 전속 국가 소유 요구는 냉각탑 시계 앞에서 반려됐다.",
            "붕괴의 상처": "임하준 실종 전 음성기록의 송신 로그에 편집 공백이 두 칸 발견됐다. 권미래는 공백을 추정 대사로 메우지 않고 파형 끊김의 시각만 일지에 적었다. 공포의 핵은 한 번의 송신 사고로 공사가 승자의 선전국으로 낙인찍히는 장면이었다. 냉각팬이 멈춘 뒤에도 그는 원본 송신기의 잠금핀을 뽑지 않았다.",
            "생존 전환점": "고른 순간은 원본 송신기를 회수해 공백 칸을 메울지, 예비 전원을 한 강국에 넘기는 거래를 현장에서 막을지다. 원양신탁전구(XT05) 쪽 잔여 대역 추첨 독촉이 옥상 방송으로 들어오자 계산이 달라졌다. 송신기를 회수하면 공개 방송망의 뼈대는 살아남지만 밤샘 조 인원이 빠지고, 거래를 막으면 한쪽 창구가 대역 해석을 독점한다. 그 선택은 K216-TURN으로 남고, 되돌리면 상암 예비 전원 한 함이 비어 간다.",
            "현재 지위": "권미래는 옥상 추첨 방송이 아니라 3층 공구함에서 예비 전원 셀 번호만 맞춘다. 기사 자리는 세습이 아니라 장애 일지·편성 승인·입회 로그로만 유지된다. 청람전자원이 전속 송신키 소유를 요구해도 그는 키를 넘기지 않고 공동 점검만 연다. 서라온에게 넘길 탑 좌표는 문가람의 교차검증 전에 확정하지 않는다.",
            "비밀·빚·죄책감": "비밀은 공구함 안쪽에 집 안 말로 적은, 공백 칸을 한 시각 먼저 발견한 메모다. 죄책감은 살린 밤샘 조와 그 밤 부르지 못한 정비 견습의 이름 사이에서만 자란다. 메모를 전부 방송하면 상암 신뢰가 한 채널 끊길 수 있어 문가람과 허은찬의 동시 날인만 남겨 두었다. 배우진의 검열 요구를 기술 장애로 미룬 시각은 이 메모와 한 줄에 적히지 않는다.",
            "관계 공동과거": "문가람의 지휘 아래 서라온에게 송신탑 좌표를 넘긴 일은 계약이었고, 두봉이 송신기를 고친 밤은 같은 공구함의 나눔이었다. 봉소가 밤샘 조를 진료한 기록은 구원이 되었고, 배우진의 검열 요구를 기술 장애로 지연한 기록은 원한의 끝점으로 남았다. 복두모가 넘긴 탑 좌표는 교차검증 전에 확정되지 않았다. 관계 원장은 그 끝점을 지우지 않은 채 STORY-B013-K216에 연결된다.",
            "3막 개인 서사선": "첫 장면에서 권미래는 음성기록 송신 로그의 편집 공백 두 칸을 다시 연다. 한가운데에서 HC01 냉각 분배와 XT05 잔여 대역 추첨을 공구함에서 맞춘다. 닫는 장에서 원본 회수 또는 예비 전원 거래 차단의 값을 밤샘 조 공백으로 치른다. 서사선 ID는 STORY-B013-K216으로 고정된다.",
            "분기 결말": "결말 α에서 권미래는 원본 송신기를 회수해 공백 칸을 메우고 공개 방송망의 뼈대를 살린다. 결말 β에서 예비 전원을 한 강국에 넘기는 거래를 현장에서 막아 선전국 낙인을 차단한다. 어느 쪽도 상암송신공사의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K216-OUT으로 갈라진다. 플레이 개입은 송신기 회수 호위 또는 거래 차단 입회 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "음성기록 송신 로그의 편집 공백 두 칸을 연다"
            },
            {
              "act": 2,
              "summary": "HC01 냉각 분배와 XT05 잔여 대역 추첨을 공구함에서 맞춘다"
            },
            {
              "act": 3,
              "summary": "원본 회수 또는 예비 전원 거래 차단의 값을 밤샘 조 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K216-OUT-A",
              "summary": "원본 송신기 회수로 공백 칸 복구"
            },
            {
              "id": "K216-OUT-B",
              "summary": "예비 전원 매매 차단으로 선전국 낙인 방지"
            }
          ]
        },
        {
          "id": "K241",
          "name": "신보람",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B013-K241"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "북산 숙영 중앙 천막에서 신보람은 저녁 배급 전에 가족 명부를 소리 내어 읽다 멈춘다. 피난 가족 대표로, 자비롭지만 명부를 고치는 관리에게는 목소리가 날카로워지고 아이 이름을 빼먹은 장부를 찢어 본 적이 있다. 한국 출생 다문화 가정에서 자랐고 아이 이름 옆에 집 안 별명을 난외로만 적되, 배급 호명은 한국어 법명만 읽으며 별명은 충성이나 복무 적성을 예측하지 않는다. 표시 이름 신보람과 식별자 K241은 군사호적 번호와 한 칸에 넣지 않는다.",
            "붕괴 전 삶": "숙영 난로가 매일 피던 해에 신보람은 강국의 군사호적에서 가족을 통째로 지우고 백온의 독립 시민권을 가족 단위 투표로 먼저 시행하려 했다. 야망은 천막 기둥의 공개 명부였고, 아이들이 복구복무 숫자로만 기록되어 회랑 밖으로 끌려갈까 봐 그는 빠진 이름이 있으면 배급을 멈췄다. 집 안 별명은 난외에서만 숨 쉬었다. 맹세 문구는 가족 회의에서 소리 내어 다시 읽혔다.",
            "가문·기업·공동체": "북산귀환회(HP05)는 가족 재결합 명부를 이유로 숙영 명부 참관을 의무 칸에 넣으려 했다. 신보람은 실재 상호를 배급 칠판에 올리지 않는 후계 헌장만 인정하고, 백온의 공동 점검 칸에만 이름 해시를 남겼다. 공동체 위치는 대표 직위가 아니라 저녁마다 소리 내어 읽은 횟수와 이중 언어 난외 주석으로 증명됐다. 대기줄 이름을 복무 명부와 맞바꾸라는 요구는 본인 동의 칸이 비어 반려됐다.",
            "붕괴의 상처": "암사 순찰대가 북산 가족 급수권을 복무계약과 묶는 철표를 숙영지에 붙였다. 신보람은 철표를 추정 죄로 단정하지 않고 철표가 가린 이름만 일지에 옮겨 적었다. 공포의 핵은 아이들이 복구복무 숫자로만 남아 회랑 밖으로 끌려가는 장면이었다. 난로가 꺼진 뒤에도 그는 명부 묶음을 무릎에서 내리지 않았다.",
            "생존 전환점": "고른 순간은 철표에 묶인 가족 명부를 되찾을지, 자발 복무 헌장의 서명 증인으로 남아 아이들을 숙영에 붙일지다. 임진관문전구(XT01) 쪽 귀환 명부 재발급 독촉이 검역소 무전으로 들어오자 계산이 달라졌다. 명부를 되찾으면 가족 단위 투표의 뼈대는 살아남지만 저녁 배급 인원이 빠지고, 증인으로 남으면 한쪽 창구가 복무 해석을 독점한다. 그 선택은 K241-TURN으로 남고, 되돌리면 숙영 배급 줄이 한 끼 멈춘다.",
            "현재 지위": "신보람은 은평 피난로가 아니라 숙영 중앙 기둥 앞에서 저녁 명부만 읽는다. 대표 자리는 세습이 아니라 소리 내어 읽은 로그·본인 동의 칸·입회 서명으로만 유지된다. 북산귀환회가 전속 명부 소유를 요구해도 그는 명부를 인질로 쓰지 않는다. 강민서의 시민권 연대 문안은 가족 회의 사본으로만 붙는다.",
            "비밀·빚·죄책감": "비밀은 천막 바닥 장판 밑에 접어 둔, 철표가 가리기 전 완전한 아이 이름 한 장이다. 죄책감은 살린 배급 줄과 그 밤 부르지 못한 전령 견습의 이름 사이에서만 자란다. 한 장을 전부 공개하면 북산 신뢰가 한 천막 끊길 수 있어 백온과 윤지율의 동시 날인만 남겨 두었다. 소두가 나른 회의 통지와 감용이 연 숙영 회의는 이 한 장과 같은 줄에 적히지 않는다.",
            "관계 공동과거": "백온의 맹세를 가족 회의에서 대변한 일은 맹세 계약이었고, 강민서의 시민권 연대를 지지한 밤은 같은 기둥의 나눔이었다. 윤지율에게 부탁한 이송 우선 기록은 구원이 되었고, 소두의 전령과 감용의 숙영 회의는 명부를 소리 내어 지키려는 실무 동맹이었다. 같은 천막에서 이름을 되찾은 저녁과, 별명을 난외에 하루 숨긴 저녁이 함께 남았다. 관계 끝점은 STORY-B013-K241로 이어진다.",
            "3막 개인 서사선": "1막에서 신보람은 복무계약과 묶인 철표와 가려진 이름을 다시 만난다. 2막에서 HP05 재결합 명부와 XT01 귀환 재발급을 기둥 무전으로 맞춘다. 3막에서 명부 회수 또는 복무 헌장 증인의 값을 저녁 배급 공백으로 치른다. 서사선은 STORY-B013-K241이다.",
            "분기 결말": "결말 α에서 신보람은 철표에 묶인 가족 명부를 되찾아 가족 단위 투표의 뼈대를 살린다. 결말 β에서 자발 복무 헌장의 서명 증인으로 남아 아이들을 숙영에 붙인다. 어느 쪽도 북산피난연맹의 16국 슬롯을 지우지 않으며, 분기 식별만 K241-OUT으로 갈라진다. 플레이 개입은 명부 회수 호위 또는 헌장 증인 입회 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무계약과 묶인 철표와 가려진 이름을 확인한다"
            },
            {
              "act": 2,
              "summary": "HP05 재결합 명부와 XT01 귀환 재발급을 기둥 무전으로 맞춘다"
            },
            {
              "act": 3,
              "summary": "명부 회수 또는 복무 헌장 증인의 값을 저녁 배급 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K241-OUT-A",
              "summary": "가족 명부 회수로 가족 단위 투표 뼈대 유지"
            },
            {
              "id": "K241-OUT-B",
              "summary": "자발 복무 헌장 증인으로 숙영 잔류 확보"
            }
          ]
        },
        {
          "id": "K145",
          "name": "윤지율",
          "links": {
            "house": "HP04",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B013-K145"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "서울역 의무실 배차 칠판 앞에서 윤지율은 한자 성명 옆에 한글 주석이 비는 줄을 붉은 줄로 긋는다. 의료이송 기록관으로, 원칙적이지만 환자 앞에서는 절차를 접고 이름 없는 시신을 장부에 남기는 일을 본분으로 본다. 중국계 이산 가정에서 자랐고 구 병원 용지의 한자 성명은 한글 주석이 붙을 때만 이송 칸에 올리며, 주석의 유무가 중증도나 편을 결정하지 않는다. 표시 이름 윤지율과 식별자 K145는 군사호적 칸과 합쳐지지 않는다.",
            "붕괴 전 삶": "재난의료 데스크가 주간만 열리던 해에 윤지율은 중앙 재난의료 조정망을 기록청 인준 아래 두어 강국이 구급 열차를 군수로 돌리지 못하게 하려 했다. 야망은 중증도 순 배차 칠판이었고, 이송 명단이 군사호적과 합쳐질까 봐 그는 무기와 환자가 한 열차에 타면 즉시 운행을 취소했다. 한자 성명은 한글 주석과 나란히만 올렸다. 시신 장부의 빈 이름은 추정으로 채우지 않았다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 원본 해시 봉인을 이유로 이송 원장 참관을 의무 칸에 넣으려 했다. 윤지율은 실재 상호를 배차 칠판에 올리지 않는 후계 헌장만 인정하고, 여리안의 공동 점검 칸에만 중증도 해시를 남겼다. 공동체 위치는 직위가 아니라 한자·한글 병기 주석을 남긴 횟수와 운행 취소 로그로 증명됐다. 유언 사본 세 장을 한 진본으로 합치라는 요구는 이송 원장에서 반려됐다.",
            "붕괴의 상처": "북산 피난 가족이 암사 복무계약서와 함께 급수권 철표를 들고 서울역 의무실로 몰려왔다. 윤지율은 철표를 추정 죄로 단정하지 않고 환자 이름과 무기 칸이 한 줄에 섞인 배차만 일지에 적었다. 공포의 핵은 이송 명단이 군사호적과 합쳐져 피난민이 병력 숫자로만 남는 장면이었다. 승강장 방송이 끊긴 뒤에도 그는 붉은 줄을 거두지 않았다.",
            "생존 전환점": "고른 순간은 환자만 태운 열차를 호송할지, 군사호적이 섞인 이송 명단을 분리 원장으로 갈라 쓸지다. 원양신탁전구(XT05) 쪽 인도 목록 해시 보관 독촉이 기록고 무전으로 들어오자 계산이 달라졌다. 열차를 호송하면 조정망의 뼈대는 살아남지만 의무실 당직 인원이 빠지고, 명단을 가르면 한쪽 창구가 이송 해석을 독점한다. 그 선택은 K145-TURN으로 남고, 되돌리면 서울역 중증도 칠판이 한 교대 비어 간다.",
            "현재 지위": "윤지율은 기록고 열람실이 아니라 의무실 배차 칠판 앞에서 중증도 순번만 고친다. 기록관 자리는 세습이 아니라 병기 주석·운행 취소 로그·입회 서명으로만 유지된다. 도성기록법가가 전속 이송 소유를 요구해도 그는 무기와 환자를 한 칸에 올리지 않는다. 류은비에게 빚진 약품 배정 장부는 이송 원장과 겹치지 않게 옆칸에만 둔다.",
            "비밀·빚·죄책감": "비밀은 칠판 레일 뒤에 끼운, 한글 주석이 하루 늦어 붉은 줄을 친 한자 성명 한 줄이다. 죄책감은 살린 환자 칸과 그 밤 부르지 못한 승강장 견습의 이름 사이에서만 자란다. 한 줄을 전부 공개하면 도성 신뢰가 한 열차 끊길 수 있어 윤서린과 여리안의 동시 날인만 남겨 두었다. 서나연의 의무실 얼음 우선 배정은 이 한 줄과 같은 시각에 적히지 않는다.",
            "관계 공동과거": "윤서린의 추대 세력에서 이송 원장을 집행한 일은 지휘 계약이었고, 류은비에게 약품 배정 장부를 빚진 밤은 같은 데스크의 나눔이자 빚이었다. 신보람의 가족 이송을 우선 기록으로 남긴 일은 구원이 되었고, 서나연의 얼음 우선·연지우의 침상 집행·설다흰의 배차 취소는 한 승강장에서 갈라진 실무였다. 연태솔이 원장을 조정표로 번역한 사제 관계도 끝점을 잃지 않는다. 관계 원장은 STORY-B013-K145에 연결된다.",
            "3막 개인 서사선": "개시 시각에 윤지율은 복무계약서와 철표를 든 가족 줄과 섞인 배차 칸을 다시 본다. 한가운데에서 HP04 해시 봉인과 XT05 인도 목록 보관을 칠판 무전으로 맞춘다. 닫는 장에서 환자 열차 호송 또는 명단 분리의 값을 중증도 당직 공백으로 치른다. 서사선 식별자는 STORY-B013-K145로 고정된다.",
            "분기 결말": "결말 α에서 윤지율은 환자만 태운 열차를 호송해 조정망의 뼈대를 살린다. 결말 β에서 군사호적이 섞인 이송 명단을 분리 원장으로 갈라 병력 숫자화를 막는다. 어느 쪽도 도성기록청의 16국 슬롯을 삭제하지 않으며, 분기 식별만 K145-OUT으로 갈라진다. 플레이 개입은 열차 호송 입회 또는 명단 분리 감사 중 하나로 전환점 절을 따른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무계약서와 철표를 든 가족 줄과 섞인 배차 칸을 본다"
            },
            {
              "act": 2,
              "summary": "HP04 해시 봉인과 XT05 인도 목록 보관을 칠판 무전으로 맞춘다"
            },
            {
              "act": 3,
              "summary": "환자 열차 호송 또는 명단 분리의 값을 중증도 당직 공백으로 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K145-OUT-A",
              "summary": "환자 전용 열차 호송으로 조정망 연속"
            },
            {
              "id": "K145-OUT-B",
              "summary": "군사호적 혼입 명단 분리로 병력 숫자화 차단"
            }
          ]
        },
        {
          "id": "H13",
          "name": "한빛나",
          "links": {
            "house": "HC13",
            "theater": "XT03",
            "scenarios": [
              "G13-SC1",
              "STORY-B013-H13"
            ],
            "profile_anchor": "Synthetic-Actors.md#H13",
            "custodian": "K315"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "약령 공동구 옆 충전 칸에서 한빛나는 야간 시야 한도를 숫자로만 읽고 손모듈 잠금핀을 뽑는다. 호출명 빛나인 H급 합성 인격으로 인간형 보조 골격과 교체형 손모듈을 쓰며, 국가 슬롯은 S13에만 고정되고 인간 ID 공간과 분리된 H13를 유지한다. 장기 완전 기억은 설계에서 빠졌고 감정 서술 대신 제약 카운터와 스냅샷 해시로 상태를 남긴다. 표시 이름 한빛나와 식별자 H13은 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "출고 검사표가 종이이던 교대에 한빛나는 전지 권한 없이 도성건축연맹 공동구 접합 센서의 보조 교대만 돌렸다. 검사표에는 빛나 교정값과 배터리 사이클, 손모듈 마모 횟수만 찍혔고 기억 포크 금지 조항은 H13-PRE에 고정됐다. 인간 동료의 농담을 파형으로 저장해도 해석 레이어는 올리지 않았다. 야간 시야 제한은 출고 시점부터 켜져 있었다.",
            "가문·기업·공동체": "보관 책임은 도성건축연맹(HC13) 공동 보관과 담당 인간 류은비(K315) 서명에 묶인다. 정비 주체는 창작 후계 가문 창구로만 적고 실재 기업 제품명은 당직 로그에 쓰지 않으며, 시민 참관 봉인 칸에 H13 해시가 게시되고 양도 시 삼자 서명이 필요하다. 공동체는 한빛나를 소유물이 아니라 할당 슬롯의 작동자로 본다. 교차 시설 루트는 기본 차단이며 비상 시에도 읽기 전용만 허용된다.",
            "붕괴의 상처": "야간분류군(G13) 진동이 센서 테이블을 덮고 배터리 할당 한도를 드러냈다. 한빛나는 공백을 허구 값으로 메우지 못하도록 잠겼고 측정 불능 플래그만 일지에 남겼다. 단절 시각 표기는 B013-H13-WOUND이며, 충전 칸 경보가 울려도 전체 망 권한 요청은 거절 코드로 응답했다. 부품이 바닥나도 다른 시설 제어권을 가로채지 않는 제약이 우선했다.",
            "생존 전환점": "고른 순간은 인간 승인 아래 구역 키만 재연결할지, 삼자 서명으로 장기 오프라인 보관에 키를 반납할지다. 해협삼로전구(XT03) 쪽 환적 신호가 도착해도 권역 외 제어는 열지 않았다. 재연결 조건은 K315 승인 후에만 성립하며 그 결정은 H13-TURN 로그로 보존된다. 예비 배터리 우회는 무한 에너지 해금이 아니라 할당 슬롯 안의 사이클 이동일 뿐이다.",
            "현재 지위": "한빛나는 수서 지하 공동구가 아니라 약령 충전 칸에서 교대 스냅샷만 남긴다. 현재 목표는 S13 구역 연속 가동과 담당 인간 안전이며 인프라 전체를 소유하지 않고 할당 슬롯만 사용한다. 상태 공개는 교대 스냅샷으로 제한되며 Synthetic-Actors 투영의 H13 행과 불일치하면 배치 검증이 실패한다. 배터리와 마모 부품은 할당제로만 보충되고 전지적 시야는 없다.",
            "비밀·빚·죄책감": "비밀은 미전송 분류 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 대신 제약 위반 카운터가 증가하며, 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친 뒤에야 인간 승인 아래 부분 재연결이 열린다. B013에서 비밀 키는 시민 참관 없이 열리지 않는다. 롤백 전 해시는 K315 입회 로그에만 남는다.",
            "관계 공동과거": "관계 축은 K315 보관과 HC13 스튜어드십, 작업 동료 K088 교대다. 한빛나와 류은비는 배터리 잔량과 보관 봉인을 같은 당직에 회수한 기록이 있다. 잘못된 기억 포크는 H13-FORK-01로만 주석되고 삭제 명령 없이 분기 로그만 남긴다. 야간분류군 센서 충돌 시 인간 중재가 우선이며, 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다.",
            "3막 개인 서사선": "1막에서 G13 진동이 센서 테이블을 덮고 S13 충전 일정이 멈춘다. 2막에서 HC13와 K315가 부분 재연결 범위와 XT03 신호의 읽기 전용 한계를 협상한다. 3막에서 한빛나는 격리 뒤 구역 권한만 복구하거나 키를 반납한다. 서사선 ID는 STORY-B013-H13으로 고정된다.",
            "분기 결말": "결말 α에서 한빛나는 인간 승인 아래 구역 키만 제한 재가동한다. 결말 β에서 삼자 서명으로 장기 오프라인 보관에 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위와 참관 입회만 고른다. 분기 식별은 H13-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "G13 진동으로 센서 테이블이 덮이고 S13 충전 일정이 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC13·K315가 부분 재연결 범위와 XT03 읽기 전용 한계를 협상한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 권한만 복구하거나 키를 반납한다"
            }
          ],
          "outcomes": [
            {
              "id": "H13-OUT-A",
              "summary": "인간 승인 하 구역 키 제한 재가동"
            },
            {
              "id": "H13-OUT-B",
              "summary": "삼자 서명 장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B014": {
      "id": "B014",
      "actors": [
        {
          "id": "K041",
          "name": "채리울",
          "sections": {
            "정체성·출신": "채리울은 서남제작동맹 구로 공방 순찰대 조장이다. 한국 기원 줄은 그의 방아쇠나 조합 증오를 미리 채워 주지 않는다. 차단문 녹보다 태업 명단의 빈칸을 먼저 의심하고, 토론이 길어져도 공구 창고 앞에서 총을 내리지 않는다.",
            "붕괴 전 삶": "붕괴 전 채리울은 구로 공구시장 골목에서 주간 순찰 경로를 분필로 그리는 일을 했다. 부하 가족의 배급이 밀리면 자기 몫을 덜어 주되, 조합 쪽 지연을 배신으로 읽지는 않았다. 야간 무장 차출 쪽지는 주머니에 넣지 않고 평의회 도장이 찍힌 뒤에만 펼쳤다.",
            "가문·기업·공동체": "채리울의 순찰 줄은 HC07 해동제철성 헌장의 공개 작업장 조항과 맞닿는다. 공방 세 조합의 도장이 없는 경비 봉쇄는 파업 가둠으로 보지 않고 거부한다. 실재 제작사 상호는 일지에 쓰지 않으며 차단문 번호와 차출 시각만 남긴다.",
            "붕괴의 상처": "암사의 복무 등록 압박이 전해진 날, 채리울은 야간 전투조 편성을 거부하고 파업 공방 세 곳의 차단문만 열었다. 빈 차단문 너머로 외곽 약탈 소문이 붙었으나 그는 조합을 적으로 부르지 않았다. 부품 출고가 멈추면 순찰대가 빈 문만 지키다 뚫린다는 공포가 방아쇠를 짧게 했다.",
            "생존 전환점": "김나율의 시민권 명부와 이강묵의 차단문 암호가 동시에 오기 전에, 채리울은 외곽을 함께 막을지 비밀 병기 생산 수첩을 평의회에 넘길지 골랐다. XT02-SC2 전갈이 서남 제작창의 압축기 부품 나눔을 알렸으나 구로 차단문의 빈칸을 메우지는 않았다. 그는 구찬솔의 공구 반출 봉쇄만 순찰로 받쳤다.",
            "현재 지위": "지금 채리울은 구로 공방 순찰대 조장으로 주간 경로를 공개 칠판에 남긴다. 야간 무장 차출은 김나율의 명부와 이강묵의 암호가 겹쳐야 따른다. 서남제작동맹 공방 전체를 해동제철성의 전속 창구로 바꾸지 않는다.",
            "비밀·빚·죄책감": "채리울은 전투조를 거부한 밤, 세 번째 공방의 태업 명단에서 한 줄이 비어 있는 것을 보고도 올리지 않았다. 공개하면 조합이 내부 고발로 갈라지고, 감추면 그 빈칸이 약탈의 입구가 된다. 그는 그 줄을 공구 창고 문턱에 분필로만 남겼다.",
            "관계 공동과거": "채리울은 이강묵의 차단문 지휘를 받되 김나율의 시민권 명부를 지키는 이중 계약을 유지한다. 구찬솔의 공구 반출 봉쇄는 순찰 경로와 겹친다. 「명부 없는 차출은 창고 앞에서 멈춰.」 채리울의 말은 짧고, 세 사람의 도장은 같은 문에 다른 시각을 찍는다.",
            "3막 개인 서사선": "파업 공방의 차단문이 열리자 채리울은 전투조 쪽지를 접고 세 문을 지킨다. 이강묵의 암호와 김나율의 명부가 어긋나는 밤에 그는 HC07 공개 작업 의무와 XT02 부품 나눔 요구를 한 칠판에 겹친다. 약탈이 골목에 닿으면 STORY-B014-K041의 값을 치르고 이중 계약의 어느 쪽을 남길지 고른다.",
            "분기 결말": "결말 α에서 채리울은 외곽 약탈을 막아 세 조합 도장 아래 이중 계약을 남긴다. 결말 β에서 그는 비밀 병기 생산 수첩을 평의회에 넘겨 조장 자리를 내놓는다. 어느 선택이든 구로 공방의 순찰 칸은 경비대의 가둠 명부로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "채리울이 파업 공방 세 곳의 차단문만 연다"
            },
            {
              "act": 2,
              "summary": "채리울이 김나율 명부와 이강묵 암호를 한 열쇠로 맞춘다"
            },
            {
              "act": 3,
              "summary": "채리울이 야간 전투조 거부의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K041-OUT-A",
              "summary": "외곽 약탈을 막아 이중 계약을 평의회 도장 아래 남긴다"
            },
            {
              "id": "K041-OUT-B",
              "summary": "비밀 병기 생산 수첩을 평의회에 넘겨 조장 자리를 내놓는다"
            }
          ],
          "links": {
            "house": "HC07",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B014-K041"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K069",
          "name": "채봄",
          "sections": {
            "정체성·출신": "채봄은 마곡연구평의회 방화 관문 순찰대 조장이다. 한국 기원 칸은 그가 연구동을 감옥처럼 다룰 권한을 주지 않는다. 관문 등잔의 기름 높이로 순찰 간격을 정하고, 주민 깃발이 안 보이는 골목을 사고 구간으로 부른다.",
            "붕괴 전 삶": "붕괴 전 채봄은 방화 관문 등잔의 심지를 새벽마다 깎는 일을 했다. 대담함보다 기름이 먼저였고, 호각은 깃발이 골목 입구로 돌아온 뒤에만 불었다. 가방 속 줄자는 꺼진 등잔 사이 거리를 다시 재기 위한 것이었다.",
            "가문·기업·공동체": "채봄의 등잔 줄은 HC03 백광생활과학가 헌장의 공개 야간 조명 조항과 맞닿는다. 연구동은 가문의 전속 실험실이 아니며 납치 수레를 막는 간격만 남긴다. 실재 연구소 상호는 일지에 쓰지 않고 등잔 번호와 깃발 시각만 적는다.",
            "붕괴의 상처": "울타리 밖 수레가 연구 칸을 노린 밤, 채봄은 등잔을 모두 밝히고 깃발만 먼저 내보냈다. 호각을 참는 동안 연구동 빗장이 안에서 걸릴 수 있다는 생각이 손끝을 식혔다. 꺼진 골목에서 깃발이 돌아오기 전에 빗장이 잠기면 관문은 빈 등잔만 남긴다.",
            "생존 전환점": "이봄결이 켠 봉쇄 등잔의 심지를 관문에서 이어 깎으며, 채봄은 바퀴 자국을 등잔 간격과 겹칠지 빗장의 순찰 줄을 깃발 쪽에 펼지 골랐다. XT05-SC3 전갈이 마곡 궤도 단말 오탐 교정을 알렸으나 방화 골목의 깃발을 대신 데려오지는 않았다. 임시온의 봉함 쪽지가 닿기 전에 그는 등잔 줄을 늘리지 않았다.",
            "현재 지위": "지금 채봄은 방화 관문 순찰대 조장으로 꺼진 구간을 줄자로 다시 잰다. 관문을 여는 호각은 김도하의 깃발이 골목 입구로 돌아온 뒤에만 분다. 마곡연구평의회 연구동을 백광생활과학가의 야간 창고로 넘기지 않는다.",
            "비밀·빚·죄책감": "채봄은 깃발을 먼저 내보낸 시각에 한 등잔의 기름이 이미 바닥인 것을 보고도 호각을 당겼다. 공개하면 조장이 주민을 미끼로 썼다는 말이 붙고, 감추면 같은 꺼진 칸이 다음 수레의 길이 된다. 그는 그 등잔 번호를 줄자 손잡이에 칼로 새겼다.",
            "관계 공동과거": "채봄은 이봄결의 봉쇄 등잔 심지를 관문에서 이어 깎는 지휘를 받는다. 김도하의 깃발이 돌아올 때까지 호각을 참기로 맹세했고, 임시온의 봉함 쪽지 전에는 줄을 늘리지 않는다. 「깃발 없는 골목엔 호각을 불지 마.」 채봄의 말은 기름 냄새와 함께 남는다.",
            "3막 개인 서사선": "수레가 울타리에 붙자 채봄은 등잔을 밝히고 깃발만 내보낸다. 호각을 참는 동안 HC03 야간 조명 의무와 XT05 오탐 교정 요구가 같은 관문에 겹친다. 빗장이 안에서 걸리면 STORY-B014-K069의 값을 치르고 줄자와 깃발 중 무엇을 공개할지 고른다.",
            "분기 결말": "결말 α에서 채봄은 울타리 바퀴 자국을 등잔 간격과 겹쳐 공개한다. 결말 β에서 그는 안에서 걸린 빗장의 순찰 줄을 주민 깃발 쪽에 펼친다. 어느 쪽이든 방화 관문의 등잔 칸은 납치 수레의 이정표가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "채봄이 등잔을 모두 밝히고 깃발만 먼저 내보낸다"
            },
            {
              "act": 2,
              "summary": "채봄이 호각을 참으며 빗장과 등잔 간격을 잰다"
            },
            {
              "act": 3,
              "summary": "채봄이 안에서 걸린 빗장의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K069-OUT-A",
              "summary": "울타리 바퀴 자국을 등잔 간격과 겹쳐 공개한다"
            },
            {
              "id": "K069-OUT-B",
              "summary": "안에서 걸린 빗장의 순찰 줄을 주민 깃발 쪽에 펼친다"
            }
          ],
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC3",
              "STORY-B014-K069"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K097",
          "name": "진모래",
          "sections": {
            "정체성·출신": "진모래는 뚝도공방연합 뚝도 펌프실 의무원이다. 한국 기원 표시는 그의 신의나 직선적 분노의 크기를 보증하지 않는다. 펌프실의 진동이 바뀌면 진료를 중단시키고, 수비를 보호군 명목으로 내주라는 제안을 배신으로 본다.",
            "붕괴 전 삶": "붕괴 전 진모래는 펌프실 옆 침상에서 교대 명부와 열을 동시에 적었다. 야간 출입은 수비대 암호패와 공정 감독의 이중 확인만 허용했고, 진동이 한 음 높아지면 청진기보다 밸브를 먼저 잡았다. 임하준의 정비일지가 당직실 벽에 붙어 있던 시절이다.",
            "가문·기업·공동체": "진모래의 방역 줄은 HP03 공동의료원가 헌장의 공개 교대 조항과 맞닿는다. 펌프실 의무소는 가문의 전속 병원이 아니며 물이 무력의 볼모가 되지 않게 한다. 실재 병원 상호를 쓰지 않고 진동 기록과 출입 금지 시각만 남긴다.",
            "붕괴의 상처": "배우진이 보호군 파견안을 내자 진모래는 뚝도 펌프실 의무소를 외부 장교 출입 금지로 올리고 교량 척후 부상을 내부에서만 받았다. 점검 공백을 구원으로 위장한 주둔이 그의 공포의 핵이다. 임하준 실종을 자신의 당직 실패로 여기는 마음이 봉쇄 문구를 단단하게 했다.",
            "생존 전환점": "김보람의 야간 봉쇄를 의무 쪽에서 받치며, 진모래는 출입 시도 증거를 모아 봉쇄를 정당화할지 암호패 유출을 밝혀 문을 다시 열지 골랐다. XT02-SC1 전갈이 여의 수문의 조위 맞춤을 알렸으나 펌프실 진동을 설명하지는 않았다. 최나래의 기동 정비조 부상만 우선 침상에 남겼다.",
            "현재 지위": "지금 진모래는 뚝도 펌프실 의무원으로 주간 교대 명부를 공방평의회와 나눈다. 야간 출입은 수비대 암호패와 공정 감독의 이중 확인만 통과한다. 뚝도공방연합 펌프실을 공동의료원가의 전속 침상으로 넘기지 않는다.",
            "비밀·빚·죄책감": "진모래는 출입 금지를 올린 밤, 교량 척후 한 명의 열을 내부 명부에 올리지 않았다. 공개하면 봉쇄가 환자 은폐로 읽히고, 감추면 같은 열이 보호군 주둔의 구실이 된다. G07 전해질화상군의 냄새가 배수로에 있었으나 그는 냄새를 장교의 증거로 삼지 않았다.",
            "관계 공동과거": "진모래는 김보람의 야간 봉쇄를 의무에서 받치고 최나래의 기동 정비조 부상을 우선 치료한다. 임하준의 빈 당직 칸은 아직 지워지지 않았다. 「진동이 바뀌면 진료부터 멈춰.」 진모래의 말은 신의처럼 짧고, 세 사람의 암호패는 같은 문을 다른 이유로 연다.",
            "3막 개인 서사선": "보호군 파견안이 붙자 진모래는 외부 장교를 문 앞에 세운다. 방역 주기와 봉쇄권이 한 명부에 겹치는 동안 HP03 교대 의무와 XT02 배수 일정이 펌프실에서 충돌한다. 당직 실패의 이름을 올리면 STORY-B014-K097의 값을 치르고 봉쇄와 재개방 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 진모래는 외부 장교 출입 시도 증거로 봉쇄를 정당화한다. 결말 β에서 그는 수비대 암호패 유출을 밝혀 의무소를 다시 연다. 어느 쪽이든 뚝도 펌프의 물 칸은 보호군 주둔 명부로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "진모래가 펌프실 의무소를 외부 장교 출입 금지로 올린다"
            },
            {
              "act": 2,
              "summary": "진모래가 방역 주기와 수비대 봉쇄권을 한 명부에 겹친다"
            },
            {
              "act": 3,
              "summary": "진모래가 당직 실패의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K097-OUT-A",
              "summary": "외부 장교 출입 시도 증거로 봉쇄를 정당화한다"
            },
            {
              "id": "K097-OUT-B",
              "summary": "수비대 암호패 유출을 밝혀 의무소를 다시 연다"
            }
          ],
          "links": {
            "house": "HP03",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B014-K097"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K126",
          "name": "설강우",
          "sections": {
            "정체성·출신": "설강우는 암사고덕상수단 암사 급수구역 순찰대 조장이다. 한국 기원 이력은 그의 골목 순찰을 징발조로 미리 낙인찍지 않는다. 관로 진동을 발소리보다 먼저 듣고, 야간 무단 급수를 사고보다 고의로 본다.",
            "붕괴 전 삶": "붕괴 전 설강우는 암사 골목의 급수표를 새벽 칠판에 쓰는 일을 했다. 부하 가족의 급수표가 밀리면 자신이 골목을 먼저 돌았고, 가족 단위 등록 강제는 최도윤의 거부 명단이 있는 모퉁이에서 멈췄다. 허리춤의 공식 암호패만 밤에 풀었다.",
            "가문·기업·공동체": "설강우의 골목 줄은 HC04 통맥에너지연합 헌장의 공개 급수 조항과 맞닿는다. 비밀 장교망의 배차 쪽지는 호위단 공식 암호패가 아니면 따르지 않는다. 실재 수도 사업 상호를 쓰지 않고 진동과 칠판 시각만 남긴다.",
            "붕괴의 상처": "북산 행렬이 시작되자 설강우는 복무 묶기 지시를 보류하고 급수 최저선만 지킨 채 골목을 열었다. 순찰이 징발조로 바뀌어 그 행렬을 자신이 막아서게 된다는 공포가 발걸음을 무겁게 했다. 백온의 가족 급수권 요구를 골목에서 묵인한 빚이 그 밤에 늘어났다.",
            "생존 전환점": "한보라의 순찰열차 시각에 맞춰 골목을 열며, 설강우는 징발 쪽지 발신자를 밝혀 자리를 지킬지 묵인 명단을 호위단에 넘길지 골랐다. XT01-SC1 전갈이 임진 검역소의 훼손된 귀환 명부를 알렸으나 암사 골목의 최저선을 대신 지키지는 않았다. 김우찬의 비밀 배차 쪽지는 거부한 채로 남겼다.",
            "현재 지위": "지금 설강우는 암사 급수구역 순찰대 조장으로 순찰 시각을 공개 칠판에 쓴다. 가족 단위 등록 강제는 거부 명단이 있는 골목에서 멈춘다. 암사고덕상수단 급수 골목을 통맥에너지연합의 전속 관로로 넘기지 않는다.",
            "비밀·빚·죄책감": "설강우는 골목을 연 시각에 백온 쪽 급수표 두 장을 칠판 난외에만 적었다. 공개하면 조장이 난민 편을 든 사람이 되고, 감추면 같은 묵인이 징발조의 명단이 된다. 그는 그 두 장을 장화 안쪽에 접어 두었다.",
            "관계 공동과거": "설강우는 한보라의 순찰열차 시각에 골목을 열고 김우찬의 비밀 배차 쪽지를 거부한다. 백온의 가족 급수권은 골목에서 묵인한 빚이다. 「공식 패 없는 쪽지는 관로 앞에서 찢어.」 설강우의 말은 진동을 설명하지 않고, 세 사람의 시각표는 같은 골목을 다른 이유로 연다.",
            "3막 개인 서사선": "북산 행렬이 골목에 닿자 설강우는 묶기 지시를 보류한다. 한보라의 열차와 김우찬의 쪽지가 어긋나는 동안 HC04 공개 급수 의무와 XT01 귀환 명부 요구가 겹친다. 묵인 명단을 열면 STORY-B014-K126의 값을 치르고 조장과 숙청 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 설강우는 징발 쪽지 발신자를 밝혀 조장 자리를 지킨다. 결말 β에서 그는 묵인 명단을 호위단에 넘겨 숙청 위기를 감수한다. 어느 쪽이든 암사 급수 골목의 최저선 칸은 징발조 명부로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "설강우가 복무 묶기 지시를 보류하고 급수 골목을 연다"
            },
            {
              "act": 2,
              "summary": "설강우가 한보라의 열차 시각과 김우찬의 쪽지를 가른다"
            },
            {
              "act": 3,
              "summary": "설강우가 묵인 명단의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K126-OUT-A",
              "summary": "징발 쪽지 발신자를 밝혀 조장 자리를 지킨다"
            },
            {
              "id": "K126-OUT-B",
              "summary": "묵인 명단을 호위단에 넘겨 숙청 위기를 감수한다"
            }
          ],
          "links": {
            "house": "HC04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B014-K126"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K154",
          "name": "차세온",
          "sections": {
            "정체성·출신": "차세온은 도성기록청 유언 필적 기록관이다. 한국 기원 칸은 그가 서울 기록의 최종 보관자가 될 자격을 미리 주지 않는다. 글씨 기울기로 필적을 가늠하고, 증인 두 명이 차지 않은 인준을 빈칸으로 본다.",
            "붕괴 전 삶": "붕괴 전 차세온은 공개 원본과 비공개 증언을 같은 책상에 펼치는 일을 했다. 먹지가 들러붙은 장은 대조에서 제외했고, 숫자는 칠판에 올리되 해석은 난외에만 남겼다. 임하준의 실종 전 정비일지 글씨가 그의 기준 표본이었다.",
            "가문·기업·공동체": "차세온의 필적 줄은 HC05 북문지식원 헌장의 공개 대조 조항과 맞닿는다. 총관 유언과 수문헌장 초안은 그가 감수한 원장에만 유효하게 하려 한다. 실재 공증 사무소 상호를 쓰지 않고 기울기와 증인 수만 남긴다.",
            "붕괴의 상처": "세 유언이 같은 날 들어오자 차세온은 심사를 정지하고 네 번째 필적의 존재만 난외에 남겼다. 그 네 번째가 몰래 통과되면 기록청이 위조의 공범이 된다는 공포가 붓을 멈추게 했다. 먹지가 들러붙은 장은 그날 책상 아래로 내려갔다.",
            "생존 전환점": "강예준의 필적 대조를 원장으로 옮기며, 차세온은 숨긴 네 번째를 찾아 인준을 강제할지 난외 노트를 폭로할지 골랐다. XT05-SC2 전갈이 인도 목록 해시 보관을 알렸으나 유언 기울기를 대신 재지는 않았다. 조하린의 철제 함에서 꺼낸 삼본만 책상에 남겼다.",
            "현재 지위": "지금 차세온은 유언 필적 기록관으로 공개 원본과 비공개 증언을 한 책상에 둔다. 증인 두 명이 차지 않으면 인준 칸을 비운다. 도성기록청 서고를 북문지식원의 전속 함이 되게 하지 않는다.",
            "비밀·빚·죄책감": "차세온은 난외에 적은 네 번째 필적의 첫 획이 임하준의 정비일지와 닮았다는 점을 원장 본문에 쓰지 않았다. 공개하면 실종자가 위조의 도구가 되고, 감추면 같은 획이 인준을 뚫는다. 그는 그 획을 먹지가 아닌 연필로만 남겼다.",
            "관계 공동과거": "차세온은 강예준의 필적 대조를 원장으로 옮기는 사제이며 조하린의 철제 함에서 삼본을 꺼내 받는다. 임하준의 글씨는 기준이지 유언이 아니다. 「증인 둘 없으면 인준은 빈칸이야.」 차세온의 말은 해석을 난외에 가둔다.",
            "3막 개인 서사선": "세 장이 같은 날 들어오자 차세온은 심사를 멈춘다. 철제 함과 대조표가 한 책상에 펼쳐지는 동안 HC05 공개 대조 의무와 XT05 해시 보관 요구가 겹친다. 난외 노트를 열면 STORY-B014-K154의 값을 치르고 인준과 교체 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 차세온은 숨긴 네 번째 필적을 찾아 인준을 강제한다. 결말 β에서 그는 난외 노트를 폭로해 기록관 교체를 감수한다. 어느 쪽이든 도성 필적 원장의 증인 칸은 위조의 통과증이 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "차세온이 세 유언 심사를 정지하고 네 번째 필적만 난외에 남긴다"
            },
            {
              "act": 2,
              "summary": "차세온이 강예준의 대조와 조하린의 철제 함을 한 책상에 펼친다"
            },
            {
              "act": 3,
              "summary": "차세온이 난외 노트의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K154-OUT-A",
              "summary": "숨긴 네 번째 필적을 찾아 인준을 강제한다"
            },
            {
              "id": "K154-OUT-B",
              "summary": "난외 노트를 폭로해 기록관 교체를 감수한다"
            }
          ],
          "links": {
            "house": "HC05",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B014-K154"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K178",
          "name": "연시완",
          "sections": {
            "정체성·출신": "연시완은 용산철도후국 열차 배차원장 기록관이다. 한국 기원 줄은 그가 창 점유를 재판할 도장을 주지 않는다. 시간표의 빈칸을 사람보다 먼저 메우고, 구두 감면을 원장에 올리지 않는 배차원을 위반자로 부른다.",
            "붕괴 전 삶": "붕괴 전 연시완은 배차 사본을 배차판과 후국회에 동시에 붙이는 일을 했다. 비상 점유도 하루 안의 재계산 없이는 무효라고 못 박았고, 한재목의 서부 철도계약 요율은 난외에만 적었다. 빈칸이 보이면 사람 이름보다 창 번호를 먼저 채웠다.",
            "가문·기업·공동체": "연시완의 배차 줄은 HP02 환승선로문 헌장의 공개 점유 조항과 맞닿는다. 서부 급수열차와 동부 군수열차는 그가 감수한 원장에만 유효하게 하려 한다. 실재 운행 상호를 배차판에 쓰지 않고 창 번호와 재계산 시각만 남긴다.",
            "붕괴의 상처": "뚝도 급수계약 만료 소식이 배차판에 붙자 연시완은 서부 급수열차의 창 점유 연장을 원장에 올리고 사적 감면을 거부했다. 위조 통행증 한 장이 창을 가득 채워 급수열차와 환적 화차가 동시에 갇힌다는 공포가 분필을 멈추게 했다. 구두 감면 쪽지는 그날 바닥에 떨어졌다.",
            "생존 전환점": "권시온의 배차 선언을 원장으로 옮기며, 연시완은 우회 허가 증인을 호송할지 난외 착복 노트를 폭로할지 골랐다. XT03-SC1 전갈이 용산 환적창의 한 길 폐쇄를 알렸으나 급수열차 창의 만료를 연장해 주지는 않았다. 오서율의 철도계약 공증만 같은 줄에 검증했다.",
            "현재 지위": "지금 연시완은 열차 배차원장 기록관으로 배차 사본을 배차판과 후국회에 동시에 붙인다. 비상 점유는 하루 안 재계산이 없으면 무효다. 용산철도후국 배차판을 환승선로문의 전속 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "연시완은 연장을 올린 시각에 동부 군수열차 한 칸의 요율을 난외에만 깎아 적었다. 공개하면 기록관이 착복의 공범이 되고, 감추면 같은 깎음이 위조 통행증의 빈칸이 된다. 그는 그 칸 번호를 분필 상자에 숨겼다.",
            "관계 공동과거": "연시완은 권시온의 배차 선언을 원장으로 옮기는 사제이며 오서율의 공증을 검증한다. 한재목의 요율은 난외의 참고일 뿐이다. 「구두 감면은 원장에 올리지 마.」 연시완의 말은 창 번호를 사람보다 먼저 부른다.",
            "3막 개인 서사선": "만료 소식이 붙자 연시완은 급수열차 창을 연장하고 사적 감면을 거절한다. 공증과 선언이 한 판에 겹치는 동안 HP02 점유 의무와 XT03 환적 폐쇄 요구가 충돌한다. 착복 칸을 열면 STORY-B014-K178의 값을 치르고 증인 호송과 폭로 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 연시완은 우회 허가 증인을 호송해 급수열차 창을 지킨다. 결말 β에서 그는 분필 상자의 깎은 요율을 후국회 게시판에 붙인다. 어느 쪽이든 용산 배차 원장의 창 칸은 위조 통행증의 대기열이 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "연시완이 서부 급수열차 창 점유 연장을 원장에 올리고 사적 감면을 거부한다"
            },
            {
              "act": 2,
              "summary": "연시완이 권시온의 선언과 오서율의 공증을 배차판에 겹친다"
            },
            {
              "act": 3,
              "summary": "연시완이 난외 착복 노트의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K178-OUT-A",
              "summary": "우회 허가 증인을 호송해 급수열차 창을 지킨다"
            },
            {
              "id": "K178-OUT-B",
              "summary": "분필 상자의 깎은 요율을 후국회 게시판에 붙인다"
            }
          ],
          "links": {
            "house": "HP02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B014-K178"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K266",
          "name": "송하율",
          "sections": {
            "정체성·출신": "송하율은 창동차륜방 차량 정비 도제다. 서울에서 한국인 어머니의 차륜 세척과 필리핀 출신 아버지의 시내버스 제동 조 사이에서 자랐고, 토크 숫자를 저녁 식탁에서 두 가지 셈으로 배운 것은 손의 버릇이지 충성의 증표가 아니다. 말은 적고, 남의 공구를 빼돌리는 일은 참지 못한다.",
            "붕괴 전 삶": "붕괴 전 송하율은 정비 일지를 작업 반장이 아닌 원로 게시판에 직접 붙였다. 불량 부품은 잘라 표본으로 남겼고, 시험 점수를 자랑하지 않았다. 아버지가 버스 제동을 세던 식탁 숫자가 렌치 손잡이에서 먼저 나왔다.",
            "가문·기업·공동체": "송하율의 정비 줄은 HC02 해륜기동문 헌장의 공개 기술시험 조항과 맞닿는다. 가문 승계를 끊는 김도윤의 길을 자기 손으로 증명하려 한다. 실재 자동차 상호를 일지에 쓰지 않고 베어링 각도와 서명 시각만 남긴다.",
            "붕괴의 상처": "유력 후계자의 시험 차륜에서 의도적으로 깎인 베어링이 나온 날, 송하율은 그 조각을 표본으로 잘랐다. 숨은 결함이 자기 서명으로 남아 주거대표에게 기지를 내주는 명분이 된다는 공포가 손을 멈추게 했다. 그는 점수를 고치지 않고 표본만 게시판에 못으로 박았다.",
            "생존 전환점": "김도윤의 도제로서 송하율은 시험 감독을 맡아 출처 공구를 공개할지 서명을 거둘지 골랐다. XT04-SC2 전갈이 창동 차륜방의 동절 연료 큐를 알렸으나 깎인 각도를 메우지는 않았다. 황지호와 나누는 제동 부품만 같은 상자에 남겼다.",
            "현재 지위": "지금 송하율은 차량 정비 도제로 일지를 원로 게시판에 직접 붙인다. 불량 부품은 잘라 표본으로 둔다. 창동차륜방 기지를 해륜기동문의 전속 시험장으로 넘기지 않는다.",
            "비밀·빚·죄책감": "송하율은 베어링을 자른 시각에 자기 렌치 이빨 자국이 각도 옆에 있는 것을 보고도 일지 본문에 쓰지 않았다. 공개하면 도제가 조작의 공범이 되고, 감추면 같은 이빨이 다음 시험의 증거가 된다. 강태산과의 북문 횃불 신호는 그 밤에 한 박자 늦었다.",
            "관계 공동과거": "송하율은 김도윤의 도제이며 박태겸과의 교환으로 황지호와 제동 부품을 나눈다. 강태산과 북문 횃불을 맞춘다. 「공구는 빌려도 각도는 훔치지 마.」 송하율의 말은 식탁의 두 셈을 섞지 않은 채 손만 설명한다.",
            "3막 개인 서사선": "깎인 베어링이 나오자 송하율은 표본을 게시판에 박는다. 시험 규칙과 제동 상자가 겹치는 동안 HC02 공개 시험 의무와 XT04 연료 큐 요구가 충돌한다. 서명을 열면 STORY-B014-K266의 값을 치르고 감독과 철회 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 송하율은 시험 감독을 맡아 깎인 베어링의 출처 공구를 공개한다. 결말 β에서 그는 출처 공구를 추적해 서명을 거둔다. 어느 쪽이든 창동 시험 차륜의 서명 칸은 기지 양도의 명분이 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "송하율이 깎인 베어링을 표본으로 잘라 게시판에 붙인다"
            },
            {
              "act": 2,
              "summary": "송하율이 김도윤의 시험 규칙과 황지호의 제동 부품을 맞춘다"
            },
            {
              "act": 3,
              "summary": "송하율이 서명 결함의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K266-OUT-A",
              "summary": "시험 감독을 맡아 깎인 베어링의 출처 공구를 공개한다"
            },
            {
              "id": "K266-OUT-B",
              "summary": "결함 부품의 출처 공구를 추적해 서명을 거둔다"
            }
          ],
          "links": {
            "house": "HC02",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B014-K266"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K291",
          "name": "안도한",
          "sections": {
            "정체성·출신": "안도한은 신내망우환승시 환승 배차조장이다. 서울에서 한국인 아버지의 환승 안내와 고려인 어머니의 망우 승강장 차 좌 사이에서 자랐고, 지연을 주전자 끓는 간격으로 세는 버릇은 생업이지 출신의 계급이 아니다. 시각표의 빈칸을 참지 못하고 말단 노선의 지연을 모욕처럼 기억한다.",
            "붕괴 전 삶": "붕괴 전 안도한은 계절 교대 집정이 오기 전에 칠판을 고쳐 두는 일을 했다. 배차표와 호송 인원을 같은 칠판에 공개했고, 의료열차 우선권은 장세화의 부서 날인이 있을 때만 인정했다. 주전자가 끓기 전에 빈칸을 메우는 손이 먼저 움직였다.",
            "가문·기업·공동체": "안도한의 배차 줄은 HC06 골목연결국 헌장의 공개 환승 조항과 맞닿는다. 신내 기지 배차권을 배차조 단독 승인으로 고정해 공동호송의 실제 시각표를 쥐려 한다. 상호 대신 유치선 번호와 날인 시각만 칠판에 남긴다.",
            "붕괴의 상처": "의료열차에서 암사제 무기가 나오자 안도한은 신내 유치선을 봉쇄하고 공동호송 시각표를 거둬들였다. 동북 말단이 막혀 환승시가 창동과 암사 사이 하역장만 남는다는 공포가 분필을 꺾게 했다. 계절 교대 전에 고친 칠판이 그날 하얗게 지워졌다.",
            "생존 전환점": "장세화의 배차 실무를 맡으며 안도한은 유치선 화물을 확인해 시각표를 되돌릴지 단독 승인안을 의료조 앞에서 폭로할지 골랐다. XT01-SC2 전갈이 창동 차륜 호송의 관문 밖 정지를 알렸으나 무기 상자의 봉인을 열어 주지는 않았다. 전미리와의 승인 순서 다툼은 쪽지로만 남겼다.",
            "현재 지위": "지금 안도한은 환승 배차조장으로 배차표와 호송 인원을 한 칠판에 공개한다. 의료열차 우선권은 장세화의 날인이 있을 때만 인정한다. 신내망우환승시 기지를 골목연결국의 전속 하역장으로 넘기지 않는다.",
            "비밀·빚·죄책감": "안도한은 시각표를 거둔 시각에 피난 칸 하나를 유치선 난외에 남겨 두었다. 공개하면 조장이 무기를 숨긴 사람이 되고, 감추면 같은 칸이 하역장의 시작이 된다. 김도윤에게 의존하는 북부 차륜 교환 시각이 그 칸 때문에 한 교대 밀렸다.",
            "관계 공동과거": "안도한은 장세화의 배차 실무를 맡고 전미리와는 계절 교대마다 승인 순서를 다툰다. 김도윤의 북부 차륜 교환 시각에 의존한다. 「날인 없는 우선은 칠판에 올리지 마.」 안도한의 말은 주전자 간격으로 빈칸을 메우는 버릇과 함께 남는다.",
            "3막 개인 서사선": "무기 상자가 의료열차에서 나오자 안도한은 유치선을 잠근다. 날인과 승인 순서가 어긋나는 동안 HC06 공개 환승 의무와 XT01 우회 환승 요구가 충돌한다. 난외 칸을 열면 STORY-B014-K291의 값을 치르고 화물 확인과 폭로 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 안도한은 봉쇄된 유치선의 실제 화물을 확인해 시각표를 되돌린다. 결말 β에서 그는 배차조 단독 승인안을 의료조 앞에서 폭로한다. 어느 쪽이든 신내 환승 칠판의 의료 칸은 하역장 대기열로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "안도한이 신내 유치선을 봉쇄하고 공동호송 시각표를 거둬들인다"
            },
            {
              "act": 2,
              "summary": "안도한이 장세화의 날인과 전미리의 승인 순서를 칠판에서 가른다"
            },
            {
              "act": 3,
              "summary": "안도한이 단독 승인안의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K291-OUT-A",
              "summary": "봉쇄된 유치선의 실제 화물을 확인해 시각표를 되돌린다"
            },
            {
              "id": "K291-OUT-B",
              "summary": "배차조 단독 승인안을 의료조 앞에서 폭로한다"
            }
          ],
          "links": {
            "house": "HC06",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B014-K291"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K169",
          "name": "황지호",
          "sections": {
            "정체성·출신": "황지호는 용산철도후국 선로 도제다. 용산에 오래 자리 잡은 화교 가계에서 자랐고, 효창 골목 부품 좌의 한글 일지와 원로가 내민 한자 병기는 생업의 습관이지 충성이나 숙련의 증표가 아니다. 손끝은 정확하나 가문 앞에서 목소리가 작아진다.",
            "붕괴 전 삶": "붕괴 전 황지호는 정비 일지를 공개하고 가문 원로의 구두 지시를 문장으로 다시 받아 적었다. 박태겸의 도제로 김도윤과 교환된 창동 수련을 거쳤고, 숙련으로 자리를 증명해야 한다는 강박이 공구함 자물쇠를 두 번 잠그게 했다. 한글 칸을 먼저 채운 뒤에만 한자를 병기했다.",
            "가문·기업·공동체": "황지호의 선로 줄은 HC08 성화궤도방위문 헌장의 공개 정비 조항과 맞닿는다. 박태겸의 양자 기술자 경로로 후계가 되어 혈연 선로가문의 거부권을 배차표에서 지우려 한다. 상호 대신 제동 압력과 일지 시각만 남긴다.",
            "붕괴의 상처": "임초원 억류 열차의 제동 점검을 도제에게 맡기라는 명령과 손대지 말라는 가문 명령이 동시에 떨어진 날, 황지호는 공구함을 열지 않은 채 일지만 펼쳤다. 자신이 임초원을 끌어들이기 위한 미끼 도제로 소비된다는 공포가 목소리를 더 작게 했다. 송하율과 나누던 제동 부품 상자는 그날 봉인되었다.",
            "생존 전환점": "박태겸의 도제로서 황지호는 정비 권한을 증언해 점검을 공개할지 창동으로 빠져 가문 회의를 흔들지 골랐다. XT03-SC3 전갈이 노량진 통역 창구의 용어 충돌을 알렸으나 제동 압력을 대신 재지는 않았다. 신가온의 배급 압박은 일지 난외에만 적었다.",
            "현재 지위": "지금 황지호는 선로 도제로 정비 일지를 공개하고 구두 지시를 문장으로 다시 받는다. 가문 앞에서 목소리는 작아도 일지 칸은 비우지 않는다. 용산철도후국 선로를 성화궤도방위문의 전속 혈연 칸으로 넘기지 않는다.",
            "비밀·빚·죄책감": "황지호는 공구함을 잠근 시각에 제동 압력 숫자 하나를 한글 칸에만 적고 한자 병기를 빼았다. 공개하면 도제가 가문 명령을 어긴 사람이 되고, 감추면 같은 숫자가 미끼 열차의 안전 증명이 된다. 그는 그 숫자를 효창에서 쓰던 연필로만 남겼다.",
            "관계 공동과거": "황지호는 박태겸의 도제이며 김도윤과의 교환 수련으로 제동을 배웠다. 송하율과 제동 부품을 나누고 신가온의 배급 압박을 받는다. 「손대기 전에 일지부터 적어」",
            "3막 개인 서사선": "두 명령이 동시에 떨어지자 황지호는 공구함을 잠근다. 도제 권한과 배급 압박이 한 일지에 겹치는 동안 HC08 공개 정비 의무와 XT03 통역 창구 요구가 충돌한다. 한글 칸을 열면 STORY-B014-K169의 값을 치르고 증언과 이탈 중 하나를 남긴다.",
            "분기 결말": "결말 α에서 황지호는 도제의 정비 권한을 증언해 제동 점검을 공개한다. 결말 β에서 그는 창동으로 빠져 가문 회의를 흔들고 미끼 자리를 거절한다. 어느 쪽이든 용산 선로 도제의 일지 칸은 혈연 거부권의 도장이 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "황지호가 제동 점검 명령과 손대지 말라는 가문 명령 사이에 선다"
            },
            {
              "act": 2,
              "summary": "황지호가 박태겸의 도제 권한과 신가온의 배급 압박을 일지에 가른다"
            },
            {
              "act": 3,
              "summary": "황지호가 미끼 도제 공포의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K169-OUT-A",
              "summary": "도제의 정비 권한을 증언해 제동 점검을 공개한다"
            },
            {
              "id": "K169-OUT-B",
              "summary": "창동으로 빠져 가문 회의를 흔들고 미끼 자리를 거절한다"
            }
          ],
          "links": {
            "house": "HC08",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC3",
              "STORY-B014-K169"
            ],
            "profile_anchor": "Cast-Index.md#S07"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "H14",
          "name": "오세림",
          "sections": {
            "정체성·출신": "오세림(호출명 세림)은 H급 합성 인격으로 아차구의관문국 구역에 배치된다. 본체는 인간형 보조 골격과 교체형 손모듈이며 야간 시야는 난간 한 칸을 겨우 덮는다. 인간 식별자와 분리된 H14를 유지하고, 출신이 능력이나 괴물성을 설명하지 않는다.",
            "붕괴 전 삶": "붕괴 전 오세림은 여의장부원 충전 칸에서 시범 교대만 돌렸다. 출고 검사표에는 세림 교정값과 배터리 주기만 남고 장기 기억 보관은 설계에서 빠져 있다. 포크 금지 조항이 H14-PRE 로그에 적혀 있으며, 그날의 스냅샷 밖 장면은 오세림에게 존재하지 않는다.",
            "가문·기업·공동체": "오세림의 보관은 HC14 여의장부원의 공동 보관과 시민 참관 봉인에 묶인다. 양도에는 삼자 서명이 필요하고 교차 시설 루트는 기본 차단이다. 실재 로봇 회사의 상호를 본문에 쓰지 않으며 무한 에너지와 전 시설 제어권은 열리지 않는다.",
            "붕괴의 상처": "붕괴는 오세림의 센서 테이블을 끊고 배터리 할당을 드러냈다. 관측 난간 너머의 얼굴은 식별되지 않았고, 오세림은 공백을 허구 값으로 메우지 못하도록 잠겼다. 측정 불능 플래그만 H14 일지에 남으며 그 공백을 전지적 서술로 채우지 않는다.",
            "생존 전환점": "고서준이 주정비 권한으로 추가 교대를 요청하고 HC14 감사가 봉인 대조를 요구한 시각이다. XT04-SC3 전갈이 아차 관문의 광물 샘플 봉인 검사를 알렸으나 오세림에게 전체 망 권한을 주지는 않았다. 오세림은 구역 키만 요청하고 다른 시설 제어권을 가로채지 않았다.",
            "현재 지위": "지금 오세림은 S14 구역 연속 가동과 담당 인간 안전을 우선하는 교대 단위로만 움직인다. 권한은 당일 스냅샷과 배터리 잔량과 시민 참관 봉인으로만 유지된다. 아차구의관문국 전체를 여의장부원의 원격 단말로 바꾸지 않는다.",
            "비밀·빚·죄책감": "오세림의 비밀은 미전송 난간 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 서술 대신 제약 위반 카운터가 증가한다. 일탈 시 오프라인 격리 후 스냅샷 롤백을 거치며 시민 참관 없이 비밀 키는 열리지 않는다.",
            "관계 공동과거": "오세림은 고서준을 주정비·법적 책임의 보관자로 기록하고 HC14를 보관·감사 가문으로 둔다. 허겸과는 교대 협력의 작업 동료 관계가 스냅샷에 남는다. 「측정 불능. 난간 값을 채우지 않습니다.」 음성 모듈의 말은 설계된 안내체이며, 오세림은 세 상대의 속마음을 추측하지 않는다.",
            "3막 개인 서사선": "난간 경보가 울려도 오세림은 측정 불능만 남기고 구역 키를 요청한다. 봉인과 주정비가 배터리 주기에 겹치는 동안 HC14 보관 의무와 XT04 샘플 봉인 요구가 충돌한다. 격리 또는 부분 재연결을 실행하면 STORY-B014-H14의 배터리 값을 치른다.",
            "분기 결말": "결말 α에서 오세림은 오프라인 격리 후 스냅샷을 롤백하고 난간을 인간 당직에 맡긴다. 결말 β에서 오세림은 시민 참관 아래 부분 재연결하고 마지막 배터리 주기를 봉인 칸에 쓴다. 어느 쪽도 장기 기억 보관이나 무한 동력을 열지 않으며 아차 관문의 구역 칸은 원격 단말로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "오세림이 관측 난간 경보를 측정 불능으로 남기고 구역 키만 요청한다"
            },
            {
              "act": 2,
              "summary": "오세림이 HC14 봉인과 고서준의 주정비를 배터리 주기에 맞춘다"
            },
            {
              "act": 3,
              "summary": "오세림이 격리와 부분 재연결 사이의 배터리 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "H14-OUT-A",
              "summary": "오프라인 격리 후 스냅샷을 롤백하고 난간을 인간 당직에 맡긴다"
            },
            {
              "id": "H14-OUT-B",
              "summary": "시민 참관 아래 부분 재연결하고 마지막 배터리 주기를 봉인 칸에 쓴다"
            }
          ],
          "links": {
            "house": "HC14",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC3",
              "STORY-B014-H14"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction"
    },
    "B015": {
      "id": "B015",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K202",
          "name": "차진아",
          "links": {
            "house": "HP08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B015-K202"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 상회정 2층 발행 책상에서 차진아는 어획 잔량 칠판의 빈칸을 사람 얼굴보다 먼저 메운다. 결제권 원장 기록관으로, 구두로만 찍힌 발행을 원장에 올리지 않는 선주를 위반자로 부른다. 한국 기원으로 노량진남관상회 구역에서 자랐고, 숫자는 벽에 공개하되 해석은 난외에만 남긴다.",
            "붕괴 전 삶": "붕괴 전 차진아는 물·전력·식량 결제권을 자신이 감수한 원장에만 유효하게 해 오해린의 발행이 상회정 공개 규칙이 되게 하려 했다. 야망은 경매판과 상회정에 동시에 붙인 사본 두 장이었고, 앞당긴 발행도 사흘 안의 재고 확인 없이는 무효라고 먹으로 못 박았다. 동생에게 보내던 짧은 쪽지—빈 칸에 도장부터 찍지 말라—가 훗날 빚의 씨앗이 된다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 얼음 신용 칸을 결제권 담보로 묶어 달라고 창구를 열었다. 차진아는 참관 날인만 받고 실재 상호와 제품명을 발행 원장에서 지운 채 벽돌 온도와 표 번호를 같은 줄에 적었다. 전속 국가 소유 문장은 상회정 자물쇠 앞에서 반려되며, 공동체 위치는 사본을 두 벽에 동시에 붙인 횟수로만 증명된다.",
            "붕괴의 상처": "부두 잔여 어획이 하루치로 줄어든 아침, 차진아는 발행 앞당김을 원장에서 보류하고 허위 재고 표를 무효 난외에 적었다. 공포는 위조 표 한 장이 허위 재고로 찍혀 선주들이 한꺼번에 파산하는 장면이었다. 경매 종이 소리가 잦아든 뒤에도 그녀는 도장함을 닫지 않은 채 LOSS 시각만 남겼다.",
            "생존 전환점": "오도윤의 선주 표가 쌓이고 윤서린에게 인준 사본을 넘길지 저울질하는 시각, 차진아는 재고 증인을 호송해 발행을 열지 난외 착복 노트를 폭로할지 골랐다. 서해곡창전구 시나리오 XT02-SC3가 노량진 얼음 신용 흔들림과 상암 경매 중계를 알렸으나 빈 어획 칸을 채워 주지는 않았다. 그 선택은 K202-TURN으로 남고, 되돌리면 상회정 일부 발행 슬롯이 하루 멈춘다.",
            "현재 지위": "지금도 차진아는 노량진남관상회 결제권 원장 기록관으로 발행 사본을 경매판과 상회정에 동시에 붙인다. 지위는 세습이 아니라 감수 서명과 재고 확인 시각으로만 유지된다. 시장냉동상단이 전속 담보 소유를 요구해도 거절하고, 오해린의 발행 칸과 Cast 프로필 현황을 매주 맞춘다.",
            "비밀·빚·죄책감": "비밀은 그녀가 하루 먼저 펼쳐 본 선주 표 초안 한 장이다. 죄책감은 살린 재고 확인 명단과 그 밤 호출하지 못한 하역 견습의 이름 사이에서만 자란다. 전부를 붙이면 상회 신용이 한 칸 끊길 수 있어 부분 공개 절차만 남겨 두었다.",
            "관계 공동과거": "오해린의 결제권 발행을 원장으로 옮기는 일은 사제 계약이었고, 오도윤의 선주 표 검증은 같은 책상의 경쟁이었다. 윤서린에게 인준 사본을 넘길지 망설인 밤은 동맹과 빚이 겹친 자리다. 「구두 발행은 원장에 안 올라간다.」 차진아의 말은 짧고, 세 사람의 도장은 같은 표에 다른 시각을 찍는다.",
            "3막 개인 서사선": "1막에서 차진아는 하루치 어획 앞에서 발행을 보류하고 허위 표를 난외에 내린다. 2막에서 HP08 담보 요구와 XT02 얼음 신용 중계가 한 책상에 겹친다. 3막에서 증인 호송 또는 착복 폭로의 대가를 발행 지연으로 치르며 서사선 STORY-B015-K202가 고정된다.",
            "분기 결말": "결말 α에서 차진아는 재고 증인을 호송해 공개 발행을 다시 연다. 결말 β에서 그녀는 난외 착복 노트를 붙여 기록관 자리를 내놓는다. 어느 쪽이든 노량진남관상회 결제권 칸은 허위 재고의 자동 도장함으로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "차진아가 하루치 어획 앞에서 발행을 보류하고 허위 표를 난외에 적는다"
            },
            {
              "act": 2,
              "summary": "차진아가 HP08 담보 창구와 XT02 얼음 신용 중계를 한 원장에서 가른다"
            },
            {
              "act": 3,
              "summary": "차진아가 증인 호송 또는 착복 폭로의 대가로 발행 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K202-OUT-A",
              "summary": "재고 증인을 호송해 공개 발행을 다시 연다"
            },
            {
              "id": "K202-OUT-B",
              "summary": "난외 착복 노트를 붙여 기록관 자리를 내놓는다"
            }
          ]
        },
        {
          "id": "K227",
          "name": "국두봉",
          "links": {
            "house": "HP09",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B015-K227"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 송신 저장소 방풍실에서 국두봉은 파형 형광등이 깜빡일 때마다 펜을 멈춘다. 황은설의 실무 담당 검증 기록관으로, 문장을 두 번 읽고 세 번째에야 도장을 든다. 한국 기원으로 상암송신공사 구역에서 자랐고, 사람을 살리는 침묵과 사실을 남기는 의무가 충돌하면 원장을 덮은 채 손을 내려놓는다.",
            "붕괴 전 삶": "붕괴 전 국두봉은 공식 발표를 두 증언 이상으로 맞추는 공개 원장을 도성 인준과 함께 돌리려 했다. 야망은 저장소 문에 붙인 보류 사유 쪽지였고, 독립 증언이 둘 미만이면 필사를 열지 않았다. 여분 먹물이 묻은 장갑 한 켤레가 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "데이터신탁가(HP09)는 검증 해시를 신탁 칸에 맡기라고 창구를 열었다. 국두봉은 참관 코드만 받고 방송 원장에서 실재 통신사 상호를 지운 채 파형 시각과 필적 대조 번호만 남겼다. 단독 송신 해제는 편성회의 승인 없이 막히며, 공동체 위치는 보류 사유를 같은 날 게시한 횟수로 셈한다.",
            "붕괴의 상처": "실종 음성의 파형과 문서고 필적이 한 구간에서만 어긋난 밤, 국두봉은 필사 원장을 잠그고 저장소 열쇠를 두용과 나눴다. 공포는 조작된 음성 한 조각이 기록관 필적으로 남아 공사가 선전 도구로 바뀌는 장면이었다. 그는 어긋난 구간만 LOSS 목록에 시각으로 남기고 형광등 아래를 떠나지 않았다.",
            "생존 전환점": "황은설의 지휘와 윤서린의 교차 요청이 동시에 도착한 시각, 국두봉은 두 번째 증언을 데려와 문을 열지 공개를 하루 늦출지 골랐다. 원양신탁전구 시나리오 XT05-SC1가 상암 잔여 대역 공개 추첨을 알렸으나 어긋난 파형을 메우지는 않았다. 그 선택은 K227-TURN으로 남고, 되돌리면 검증 큐 하나가 비다.",
            "현재 지위": "지금도 국두봉은 상암송신공사 검증 기록관으로 필사 보류와 게시 사유를 같은 칠판에 붙인다. 지위는 세습이 아니라 교차검증 로그와 저장소 봉인으로만 유지된다. 데이터신탁가가 해시 전속 보관을 요구해도 거절하고, 황은설의 원장 칸과 현황을 맞춘다.",
            "비밀·빚·죄책감": "비밀은 잠근 원장 안에서 자기 필적과 비슷한 한 획을 발견한 메모다. 죄책감은 살린 보류 명단과 그 밤 호출하지 못한 외부 증인 사이에서만 자란다. 전부를 읽히면 공사 신뢰가 한 칸 끊길 수 있어 부분 공개만 남겨 두었다.",
            "관계 공동과거": "황은설의 원장 이관은 지휘 계약이었고, 두용의 저장소 열쇠는 봉인 동업이었다. 윤서린과 음성·문서를 맞추는 밤은 동맹이었으며, 같은 방풍실에서 어떤 파형은 구원이 되었고 어떤 획은 배신의 증거로 남았다. 「증언이 하나면 문을 닫는다.」 국두봉의 말은 형광등 깜빡임보다 짧다.",
            "3막 개인 서사선": "1막에서 국두봉은 어긋난 파형 앞에서 필사 원장을 잠근다. 2막에서 HP09 해시 창구와 XT05 대역 추첨이 저장소 문 앞에서 겹친다. 3막에서 증언 호송 또는 공개 연기의 대가를 검증 지연으로 치르며 STORY-B015-K227이 고정된다.",
            "분기 결말": "결말 α에서 국두봉은 두 번째 증언을 데려와 필사를 다시 연다. 결말 β에서 그는 공개를 하루 늦춰 폭동을 막고 보류 쪽지를 남긴다. 어느 쪽이든 상암 검증 칸은 단독 선전의 나팔로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "국두봉이 어긋난 파형 앞에서 필사 원장을 잠근다"
            },
            {
              "act": 2,
              "summary": "국두봉이 HP09 해시 창구와 XT05 대역 추첨을 저장소 문에서 가른다"
            },
            {
              "act": 3,
              "summary": "국두봉이 증언 호송 또는 공개 연기의 대가로 검증 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K227-OUT-A",
              "summary": "두 번째 증언을 데려와 필사를 다시 연다"
            },
            {
              "id": "K227-OUT-B",
              "summary": "공개를 하루 늦춰 폭동을 막고 보류 쪽지를 남긴다"
            }
          ]
        },
        {
          "id": "K252",
          "name": "국봉",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B015-K252"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수유 숙영 천막 줄 아래에서 국봉은 명부 탁자의 연필을 아이 키 높이에 맞춰 둔다. 윤초아의 실무 담당 피난 명부 기록관으로, 구두 약속을 장부에 옮기지 않으면 없던 일로 돌린다. 한국 기원으로 북산피난연맹 구역에서 자랐고, 이중 호적 한 줄을 보면 필사를 멈추며 아이 이름을 숫자 기호로 줄이지 않는다.",
            "붕괴 전 삶": "붕괴 전 국봉은 피난 시민권 원장을 도성 인준과 맞춰 군사호적 사본이 연맹 명부를 대체하지 못하게 하려 했다. 야망은 가족 단위 투표 결과를 당일 게시한 천막 벽이었고, 구호 상자마다 출처를 원장에 적었다. 여분 연필 한 자루가 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "북산귀환회(HP05)는 귀환 명부 칸을 연맹 원장과 합치라고 창구를 열었다. 국봉은 참관만 받고 실재 구호 단체 상호를 상자 표에서 지운 채 가족 투표 시각과 물자 출처만 남겼다. 노동력 명부로 읽는 기호는 거부되며, 공동체 위치는 저녁 명부를 소리 내어 읽은 횟수로 증명된다.",
            "붕괴의 상처": "급수권 철표와 복무계약서가 같은 끈으로 묶여 게시판에 붙은 낮, 서기들이 필사를 거부하자 국봉은 그 끈을 풀지 않은 채 원장만 덮었다. 공포는 원장이 노동력 명부가 되어 가족이 통째로 복구복무에 적히는 장면이었다. 텐트 바람이 잦아든 뒤에도 그는 아이 이름 칸의 빈줄을 숫자로 메우지 않았다.",
            "생존 전환점": "소두의 전령 게시와 백온의 가족 투표가 같은 시각에 도착하자, 국봉은 분리된 시민권 초안을 숙영 원장에 붙일지 이중 호적을 불태우지 않고 공개할지 골랐다. 임진관문전구 시나리오 XT01-SC1가 귀환 명부 훼손과 재발급 요구를 알렸으나 철표 끈을 잘라 주지는 않았다. 그 선택은 K252-TURN으로 남고, 되돌리면 숙영 배급이 한 끼 멈춘다.",
            "현재 지위": "지금도 국봉은 북산피난연맹 피난 명부 기록관으로 가족 단위 투표를 당일 게시한다. 지위는 세습이 아니라 소리 내어 읽은 명부와 상자 출처 줄로만 유지된다. 북산귀환회가 전속 합본을 요구해도 거절하고, 윤초아의 명부 칸과 현황을 맞춘다.",
            "비밀·빚·죄책감": "비밀은 숫자 기호로 줄이지 않으려고 난외에 숨긴 아이 이름 한 줄이다. 죄책감은 살린 가족 투표와 그 밤 읽지 못한 빈 자리 사이에서만 자란다. 전부를 붙이면 숙영 신뢰가 한 칸 끊길 수 있어 부분 공개만 남겨 두었다.",
            "관계 공동과거": "윤초아의 명부 합치기는 지휘 계약이었고, 소두의 전령 게시는 줄 맞추기 동업이었다. 백온의 가족 투표를 원장에 옮긴 밤은 동맹이었으며, 강민서의 복무 문안은 참고만 하고 본문으로 올리지 않았다. 「이름을 번호로 줄이지 마.」 국봉의 말은 천막 줄보다 낮게 깔린다.",
            "3막 개인 서사선": "1막에서 국봉은 철표와 복무가 묶인 게시판 앞에서 원장을 덮는다. 2막에서 HP05 합본 창구와 XT01 재발급 요구가 숙영 탁자에 겹친다. 3막에서 초안 게시 또는 이중 호적 공개의 대가를 배급 지연으로 치르며 STORY-B015-K252가 고정된다.",
            "분기 결말": "결말 α에서 국봉은 분리된 시민권 초안을 숙영 원장에 붙인다. 결말 β에서 그는 이중 호적을 불태우지 않고 게시판에 공개한다. 어느 쪽이든 북산 명부 칸은 노동력 기호로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "국봉이 철표와 복무가 묶인 게시판 앞에서 원장을 덮는다"
            },
            {
              "act": 2,
              "summary": "국봉이 HP05 합본 창구와 XT01 재발급 요구를 숙영 탁자에서 가른다"
            },
            {
              "act": 3,
              "summary": "국봉이 초안 게시 또는 이중 호적 공개의 대가로 배급 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K252-OUT-A",
              "summary": "분리된 시민권 초안을 숙영 원장에 붙인다"
            },
            {
              "id": "K252-OUT-B",
              "summary": "이중 호적을 불태우지 않고 게시판에 공개한다"
            }
          ]
        },
        {
          "id": "K277",
          "name": "국두",
          "links": {
            "house": "HC08",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B015-K277"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 제3검수선 피트에서 국두는 베어링 상자 뚜껑을 발로 고정한 채 로트 번호를 읽는다. 조우찬의 실무 담당 작업 사고 기록관으로, 사고 책임을 날짜까지 기억하고 서명 없는 일지를 없던 일로 돌린다. 한국 기원으로 창동차륜방 구역에서 자랐고, 회의보다 차륜 아래의 필적을 믿는다.",
            "붕괴 전 삶": "붕괴 전 국두는 작업 기록과 사고 책임을 원로 게시판의 유일한 가동 근거로 남겨 가문 승계 소문을 일지로 끊으려 했다. 야망은 반장과 도제의 서명을 한 줄에 받는 습관이었고, 불량 표본 번호를 같은 칸에 적었다. 기름 묻은 수첩 한 권이 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "성화궤도방위문(HC08)은 사고 일지를 궤도 방위 칸에 이관하라고 창구를 열었다. 국두는 참관만 받고 실재 차량 상호를 표본 표에서 지운 채 로트 각도와 서명 시각만 남겼다. 결함 일지를 주거 선거 벽보로 복사하는 관행은 거부되며, 공동체 위치는 피트에 남은 필적 횟수로 셈한다.",
            "붕괴의 상처": "깎인 베어링의 로트 번호가 일지와 한 구간에서만 어긋난 교대, 국두는 원장을 잠그고 두모의 정비 표본 번호를 같은 상자에 넣었다. 공포는 결함 일지가 벽보로 복사되어 기지가 인구 논리로 점거되는 장면이었다. 그는 어긋난 줄만 LOSS 시각으로 남기고 피트 전등을 끄지 않았다.",
            "생존 전환점": "조우찬의 지휘와 김도윤의 공개 기술시험 기록이 겹친 시각, 국두는 어긋난 줄을 게시판에 붙일지 일지 잠금을 하루 늦출지 골랐다. 임진관문전구 시나리오 XT01-SC2가 창동 차륜 호송의 관문 밖 정지를 알렸으나 깎인 각도를 메우지는 않았다. 그 선택은 K277-TURN으로 남고, 되돌리면 제3검수선이 한 교대 멈춘다.",
            "현재 지위": "지금도 국두는 창동차륜방 작업 사고 기록관으로 반장과 도제 서명을 한 줄에 요구한다. 지위는 세습이 아니라 표본 번호와 피트 필적으로만 유지된다. 성화궤도방위문이 전속 이관을 요구해도 거절하고, 조우찬의 일지 칸과 현황을 맞춘다.",
            "비밀·빚·죄책감": "비밀은 잠근 시각에 도제 서명란이 비어 있던 것을 보고도 본문에 쓰지 않은 메모다. 죄책감은 살린 잠금과 그 밤 호출하지 못한 도제 사이에서만 자란다. 전부를 붙이면 기지 신뢰가 한 칸 끊길 수 있어 부분 공개만 남겨 두었다.",
            "관계 공동과거": "조우찬의 일지 이관은 지휘 계약이었고, 두모의 표본 번호는 상자 동업이었다. 김도윤의 기술시험 기록을 잠그지 않은 밤은 동맹이었으며, 같은 피트에서 어떤 각도는 구원이 되었고 어떤 로트는 배신의 증거로 남았다. 「서명 없는 일지는 사고도 아니다.」 국두의 말은 차륜 소음 아래로 가라앉는다.",
            "3막 개인 서사선": "1막에서 국두는 어긋난 로트 앞에서 원장을 잠근다. 2막에서 HC08 이관 창구와 XT01 호송 정지가 피트 난간에 겹친다. 3막에서 줄 공개 또는 잠금 연기의 대가를 검수 지연으로 치르며 STORY-B015-K277이 고정된다.",
            "분기 결말": "결말 α에서 국두는 어긋난 줄을 원로 게시판에 붙여 공개한다. 결말 β에서 그는 일지 잠금을 하루 늦춰 폭동을 막고 표본만 남긴다. 어느 쪽이든 창동 사고 칸은 주거 선거 벽보의 재료가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "국두가 어긋난 로트 앞에서 원장을 잠근다"
            },
            {
              "act": 2,
              "summary": "국두가 HC08 이관 창구와 XT01 호송 정지를 피트 난간에서 가른다"
            },
            {
              "act": 3,
              "summary": "국두가 줄 공개 또는 잠금 연기의 대가로 검수 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K277-OUT-A",
              "summary": "어긋난 줄을 원로 게시판에 붙여 공개한다"
            },
            {
              "id": "K277-OUT-B",
              "summary": "일지 잠금을 하루 늦춰 폭동을 막고 표본만 남긴다"
            }
          ]
        },
        {
          "id": "K302",
          "name": "봉모",
          "links": {
            "house": "HP02",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B015-K302"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "망우 환승 심사대 저울 앞에서 봉모는 화물 봉인 끈의 매듭을 손가락으로 세고 입을 다문다. 문시온의 실무 담당 통행 심사 기록관으로, 말수는 적고 증빙 대조는 집요하다. 한국 기원으로 신내망우환승시 구역에서 자랐고, 보호비 영수증을 통행증으로 바꾸는 관행을 경멸한다.",
            "붕괴 전 삶": "붕괴 전 봉모는 동북 외곽로 심사를 공동호송조약 조항으로 격상시켜 암사 호위단의 임의 검색을 원장에서 끊으려 했다. 야망은 신분 조각과 화물 봉인을 이중으로 적은 칸이었고, 강국 영장은 장세화와 의료조 공동 날인 없이 거부했다. 여분 봉인 끈 한 줌이 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "환승선로문(HP02)은 심사 원장을 환승 슬롯 칸에 묶으라고 창구를 열었다. 봉모는 참관만 받고 실재 운송사 상호를 봉인 표에서 지운 채 후문 실측과 칸 번호를 같은 줄에 적었다. 강국 문장의 검색 영장 사본은 심사대의 저울 위에 올리지 않으며, 공동체 위치는 이중 기록 횟수로 증명된다.",
            "붕괴의 상처": "기지 후문 흔적이 봉인 장부에 남고 심사 원장의 한 줄이 빠진 교대, 봉모는 저울을 잠그고 복감의 실측 쪽지만 클립으로 집었다. 공포는 심사 원장이 검색 영장 사본으로 대체되어 중립이 내부에서 깨지는 장면이었다. 승강장 안내 방송이 끊긴 뒤에도 그는 빠진 칸을 임의로 메우지 않았다.",
            "생존 전환점": "문시온의 지휘와 곽태산의 칸 봉인 입회가 겹친 시각, 봉모는 빠진 줄을 복원할지 심사 거부를 구실로 진입 문서를 빼낼지 골랐다. 두만극동전구 시나리오 XT04-SC1가 화차 중량 로그 공개와 신내 환승 슬롯 조정을 알렸으나 후문 흔적을 지워 주지는 않았다. 그 선택은 K302-TURN으로 남고, 되돌리면 망우 심사대가 한 편성 멈춘다.",
            "현재 지위": "지금도 봉모는 신내망우환승시 통행 심사 기록관으로 신분 조각과 화물 봉인을 이중으로 적는다. 지위는 세습이 아니라 저울 눈과 공동 날인으로만 유지된다. 환승선로문이 전속 슬롯 소유를 요구해도 거절하고, 문시온의 심사 칸과 현황을 맞춘다.",
            "비밀·빚·죄책감": "비밀은 빠진 줄이 자기 교대 시각과 겹친다는 것을 알고도 본문에 쓰지 않은 쪽지다. 죄책감은 살린 저울 잠금과 그 밤 올리지 못한 후문 파수 사이에서만 자란다. 전부를 붙이면 환승 신뢰가 한 칸 끊길 수 있어 부분 공개만 남겨 두었다.",
            "관계 공동과거": "문시온의 원장 이관은 지휘 계약이었고, 복감의 후문 실측은 같은 줄의 동업이었다. 곽태산의 칸 봉인 입회는 원장 말미의 동맹이었으며, 장세화의 공동 날인은 영장 거부의 버팀목이었다. 「보호비 영수증은 통행증이 아니다.」 봉모의 말은 저울 바늘보다 늦게 움직인다.",
            "3막 개인 서사선": "1막에서 봉모는 빠진 심사 줄 앞에서 저울을 잠근다. 2막에서 HP02 슬롯 창구와 XT04 환승 조정이 봉인 끈 위에서 겹친다. 3막에서 줄 복원 또는 문서 적출의 대가를 편성 지연으로 치르며 STORY-B015-K302가 고정된다.",
            "분기 결말": "결말 α에서 봉모는 빠진 줄을 복원해 심사를 다시 연다. 결말 β에서 그는 심사 거부를 구실로 삼은 진입 문서를 빼내 게시한다. 어느 쪽이든 망우 심사 칸은 강국 영장 사본의 창구가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "봉모가 빠진 심사 줄 앞에서 저울을 잠근다"
            },
            {
              "act": 2,
              "summary": "봉모가 HP02 슬롯 창구와 XT04 환승 조정을 봉인 끈 위에서 가른다"
            },
            {
              "act": 3,
              "summary": "봉모가 줄 복원 또는 문서 적출의 대가로 편성 지연을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K302-OUT-A",
              "summary": "빠진 줄을 복원해 심사를 다시 연다"
            },
            {
              "id": "K302-OUT-B",
              "summary": "심사 거부를 구실로 삼은 진입 문서를 빼내 게시한다"
            }
          ]
        },
        {
          "id": "K327",
          "name": "영늘빛",
          "links": {
            "house": "HP03",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B015-K327"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "청량리 의정회 대기 칠판 아래에서 영늘빛은 중증도 표의 빈칸을 사람보다 먼저 메운다. 전솔의 실무 담당 병상 기록관으로, 비공개 치료 계약을 원장에 올리지 않는 상인을 위반자로 부른다. 한국 기원으로 약령의정동맹 구역에서 자랐고, 숫자는 시장 입구에 공개하되 해석은 난외에만 남긴다.",
            "붕괴 전 삶": "붕괴 전 영늘빛은 환자대표 거부권과 중증도 표를 자신이 감수한 원장에만 유효하게 해 강국 부상자를 밀어내는 밀약을 종이에서 죽이려 했다. 야망은 시장 입구와 길드 당직실에 동시에 붙인 대기 명부였고, 세 직능 날인 없는 계약은 무효 난외에 적었다. 여분 분필 한 자루가 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "공동의료원가(HP03)는 병상 원장을 의료 헌장 칸에 묶으라고 창구를 열었다. 영늘빛은 참관만 받고 실재 제약 상호를 차트에서 지운 채 중증도 숫자와 거부권 시각만 남겼다. 전속 창구 요구는 대기 칠판 앞에서 반려되며, 공동체 위치는 이중 게시 횟수로 셈한다.",
            "붕괴의 상처": "허위 동의서가 의정회 한가운데 나타난 아침, 영늘빛은 해당 줄을 난외로 내리고 필적 대조가 끝나기 전에 날인을 열지 않았다. 공포는 그 한 장이 의정회를 꼭두각시 창구로 바꾸는 장면이었다. 대합실 습기가 가라앉은 뒤에도 그녀는 분필을 꺾지 않은 채 LOSS 시각만 남겼다.",
            "생존 전환점": "전솔의 거부권과 선나휘의 전갈 사본이 같은 줄에 놓인 시각, 영늘빛은 난외 필적을 공개할지 원장 한 줄을 지워 거부권을 빈칸으로 만들지 골랐다. 두만극동전구 시나리오 XT04-SC2가 창동 동절 연료 큐와 약령 동상 환자 수용을 알렸으나 허위 동의서의 획을 지워 주지는 않았다. 그 선택은 K327-TURN으로 남고, 되돌리면 병상 하나가 하루 비다.",
            "현재 지위": "지금도 영늘빛은 약령의정동맹 의정회 병상 기록관으로 대기 명부를 시장 입구와 당직실에 동시에 붙인다. 지위는 세습이 아니라 세 직능 날인과 중증도 표로만 유지된다. 공동의료원가가 전속 헌장 소유를 요구해도 거절하고, 전솔의 거부권 칸과 현황을 맞춘다.",
            "비밀·빚·죄책감": "비밀은 난외로 내린 줄의 필적이 전솔의 것과 비슷해 보여 대조를 반나절 미룬 메모다. 죄책감은 살린 날인 보류와 그 밤 호출하지 못한 대기 환자 사이에서만 자란다. 전부를 붙이면 의정 신뢰가 한 칸 끊길 수 있어 부분 공개만 남겨 두었다.",
            "관계 공동과거": "전솔의 거부권을 원장으로 옮기는 일은 사제 계약이었고, 선나휘의 전갈 사본은 같은 줄의 동업이었다. 류은비의 표결 날인을 맨 위에 둔 밤은 동맹이었으며, 같은 칠판에서 어떤 빈칸은 구원이 되었고 어떤 동의서는 배신의 증거로 남았다. 「세 직능 없는 계약은 난외다.」 영늘빛의 말은 분필 가루보다 짧게 남는다.",
            "3막 개인 서사선": "1막에서 영늘빛은 허위 동의서를 난외로 내리고 날인을 닫는다. 2막에서 HP03 헌장 창구와 XT04 동상 환자 수용이 대기 칠판에서 겹친다. 3막에서 필적 공개 또는 줄 삭제의 대가를 병상 공백으로 치르며 STORY-B015-K327이 고정된다.",
            "분기 결말": "결말 α에서 영늘빛은 난외 필적을 공개해 거부권을 지킨다. 결말 β에서 그녀는 원장 한 줄을 지워 빈칸을 만들고 기록관 자리를 내놓는다. 어느 쪽이든 의정회 병상 칸은 밀약의 창구가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "영늘빛이 허위 동의서를 난외로 내리고 날인을 닫는다"
            },
            {
              "act": 2,
              "summary": "영늘빛이 HP03 헌장 창구와 XT04 동상 환자 수용을 대기 칠판에서 가른다"
            },
            {
              "act": 3,
              "summary": "영늘빛이 필적 공개 또는 줄 삭제의 대가로 병상 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K327-OUT-A",
              "summary": "난외 필적을 공개해 거부권을 지킨다"
            },
            {
              "id": "K327-OUT-B",
              "summary": "원장 한 줄을 지워 빈칸을 만들고 기록관 자리를 내놓는다"
            }
          ]
        },
        {
          "id": "K316",
          "name": "심달호",
          "links": {
            "house": "HC03",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B015-K316"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "제기동 약령시장 말목 저울에서 심달호는 원산지 쪽지를 한글 칸에 먼저 걸고, 저녁이면 건조실 벽에 베트남어 입고 숫자를 작게 병기한다. 서울에서 한국인 어머니의 약재 좌와 베트남 출신 아버지의 건조 일지 사이에서 자랐고, 두 가지 셈은 외상 장부의 손버릇이지 충성의 증표가 아니다. 저울눈만큼 말을 아끼며 선매를 권하는 사신을 손님으로 보지 않는다.",
            "붕괴 전 삶": "붕괴 전 심달호는 청량리 약재 경매를 강국 독점 입찰에서 떼어내 의정회 공개 할당으로 바꾸려 했다. 야망은 원산지와 건조 일자를 말목에 건 습관이었고, 대량 선매는 류은비와 전솔의 날인이 있어야 성립시켰다. 아버지가 남긴 건조 온도 수첩이 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 건조 주기표를 가문 실험 칸에 올리라고 창구를 열었다. 심달호는 참관만 받고 실재 제약·식품 상호를 말목에서 지운 채 중량과 건조 시각만 남겼다. 전속 선매 창구는 저울 추 앞에서 반려되며, 공동체 위치는 공개 할당 횟수로 셈한다.",
            "붕괴의 상처": "여름 가짜 약이 북산으로 흘러가 청량리 약재동이 자체 봉쇄된 낮, 심달호는 선매 장부가 사라진 서랍만 봉하고 경매를 열지 않았다. 공포는 암사나 여의신이 항생제와 해열 생약을 선매해 시장 바닥이 드러나는 장면이었다. 그는 말목의 원산지 쪽지만 LOSS 시각으로 남기고 저울 추를 주머니에 넣었다.",
            "생존 전환점": "류은비의 치료 물자와 은태호의 가락 교환 비율이 같은 송장에 놓인 시각, 심달호는 선매 장부를 되찾을지 강국 구매 대리인을 경매장에서 공개할지 골랐다. 서해곡창전구 시나리오 XT02-SC2가 냉동 압축기 부품 나눔과 계측 로그 검증을 알렸으나 사라진 장부의 페이지를 돌려주지는 않았다. 천다움의 건조기 정비가 전력을 맞춰 주기 전에 그 선택은 K316-TURN으로 남는다.",
            "현재 지위": "지금도 심달호는 약령의정동맹 약재상으로 원산지 말목과 건조 일자를 건다. 대량 선매는 류은비와 전솔의 날인이 겹쳐야 성립한다. 약령시장 바닥을 백광생활과학가의 전속 실험 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "비밀은 장부가 사라지기 전 저울 추 하나가 가벼운 것을 알고도 말목을 고치지 않은 메모다. 죄책감은 살린 봉쇄와 그 무게로 덜 받은 북산 쪽 사이에서만 자란다. 공개하면 상인이 조작의 공범이 되고, 감추면 같은 추가 다음 경매의 증거가 된다.",
            "관계 공동과거": "심달호는 류은비의 치료 물자를 대고 전솔의 환자 할당을 따른다. 은태호와는 가락 식량과 약재 비율을 송장 말미에 적으며, 천다움은 건조기 현장에서 말목을 받친다. 「선매는 손님 아니라 사신이다.」 심달호의 말은 한글 칸을 먼저 채운 뒤에야 병기 숫자를 허락한다.",
            "3막 개인 서사선": "1막에서 심달호는 가짜 약 봉쇄 뒤 선매 장부 서랍을 봉한다. 2막에서 HC03 실험 창구와 XT02 압축기 나눔이 건조 전력과 겹친다. 3막에서 장부 회수 또는 대리인 공개의 대가를 경매 공백으로 치르며 STORY-B015-K316이 고정된다.",
            "분기 결말": "결말 α에서 심달호는 선매 장부를 되찾아 공개 할당을 다시 연다. 결말 β에서 그는 강국 구매 대리인을 경매장에서 공개하고 저울을 잠시 내린다. 어느 쪽이든 제기동 말목의 원산지 칸은 독점 입찰의 빈 바닥이 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "심달호가 가짜 약 봉쇄 뒤 선매 장부 서랍을 봉한다"
            },
            {
              "act": 2,
              "summary": "심달호가 HC03 실험 창구와 XT02 압축기 나눔을 건조 전력에서 가른다"
            },
            {
              "act": 3,
              "summary": "심달호가 장부 회수 또는 대리인 공개의 대가로 경매 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K316-OUT-A",
              "summary": "선매 장부를 되찾아 공개 할당을 다시 연다"
            },
            {
              "id": "K316-OUT-B",
              "summary": "강국 구매 대리인을 경매장에서 공개하고 저울을 잠시 내린다"
            }
          ]
        },
        {
          "id": "K341",
          "name": "문하율",
          "links": {
            "house": "HP07",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC3",
              "STORY-B015-K341"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "아차산 4초소 호각 거치대에서 문하율은 불빛을 국적보다 먼저 보고하고, 도시락 뚜껑 안쪽에 어머니가 남긴 타갈로그 짧은 당부를 접어 둔다. 서울에서 한국인 아버지의 능선 약도와 광진 야근을 돌던 필리핀 출신 어머니의 도시락 사이에서 자랐고, 두 언어의 짧은 말은 당직 버릇이지 충성이나 망설임의 증표가 아니다. 직선적이고 산바람보다 회의실을 싫어한다.",
            "붕괴 전 삶": "붕괴 전 문하율은 아차산 고지 감시망을 능선수비대 단독 지휘 아래 묶어 물 기술자의 지연을 없애려 했다. 야망은 봉화와 호각으로 먼저 막고 사후 승인을 고서준에게 받는 순서였고, 평시 공동승인 문서는 초소에 두지 않았다. 여분 호각 심이 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 능선 차단 시각을 교량 통행 칸에 맞추라고 창구를 열었다. 문하율은 참관만 받고 실재 건설사 상호를 초소 일지에서 지운 채 봉화 방향과 호각 시각만 남겼다. 배우진의 후견 제의는 고서준보다 먼저 듣지 않으려 일지를 접고, 공동체 위치는 단독 차단 횟수가 아니라 정정 횟수로 셈한다.",
            "붕괴의 상처": "교량 쪽 상수관 파손 연기를 적대 봉화로 오인한 저녁, 문하율은 능선 차단을 먼저 내리고 구의 정수 점검을 공백으로 만들었다. 공포는 고지가 뚫려 구의 정수와 동부 교량이 같은 밤에 열리는 장면이었다. 그는 오인 시각만 LOSS 목록에 남기고 호각을 거치대에서 내리지 않았다.",
            "생존 전환점": "고서준의 수비 명령과 곽민재의 급수 점검이 어긋난 시각, 문하율은 오인 봉화를 정정할지 단독 차단을 전시 통합의 증거로 남길지 골랐다. 두만극동전구 시나리오 XT04-SC3가 아차 관문 광물 샘플 봉인 검사를 알렸으나 연기 기둥의 색깔을 바꿔 주지는 않았다. 그 선택은 K341-TURN으로 남고, 되돌리면 4초소 당직이 한 밤 비다.",
            "현재 지위": "지금도 문하율은 아차구의관문국 능선 초병으로 봉화와 호각을 먼저 쓰고 사후 승인을 고서준에게 받는다. 평시 공동승인 문서는 초소에 두지 않는다. 능선 감시망을 한강교량공회의 전속 차단 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "비밀은 차단을 내리기 전 호각을 한 박자 늦게 불어 판늘샘의 순찰이 능선에 닿지 못하게 한 숨이다. 죄책감은 살린 고지와 그 박자로 비운 급수 점검 사이에서만 자란다. 공개하면 초병이 오인의 공범이 되고, 감추면 같은 박자가 다음 봉화의 습관이 된다.",
            "관계 공동과거": "문하율은 고서준의 수비 명령을 최전에서 수행하고 곽민재의 급수 점검을 감시 공백으로 여기지 않으려 일지를 겹친다. 배우진의 후견 제의는 고서준보다 먼저 듣지 않으며, 선늘봄의 초소 당직과 호각을 나눈다. 「불빛은 국적보다 먼저 보고한다.」 문하율의 말은 도시락 안쪽의 짧은 당부를 회의 문장으로 바꾸지 않는다.",
            "3막 개인 서사선": "1막에서 문하율은 연기 기둥을 적대 봉화로 읽고 능선 차단을 먼저 내린다. 2막에서 HP07 교량 칸과 XT04 샘플 봉인이 호각 거치대에서 겹친다. 3막에서 정정 또는 증거 방치의 대가를 당직 공백으로 치르며 STORY-B015-K341이 고정된다.",
            "분기 결말": "결말 α에서 문하율은 오인 봉화를 정정해 급수 점검을 다시 연다. 결말 β에서 그는 단독 차단을 전시 통합의 증거로 남기고 초소에서 내려온다. 어느 쪽이든 아차산 4초소의 호각 칸은 국적 심문의 창구가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "문하율이 연기 기둥을 적대 봉화로 읽고 능선 차단을 먼저 내린다"
            },
            {
              "act": 2,
              "summary": "문하율이 HP07 교량 칸과 XT04 샘플 봉인을 호각 거치대에서 가른다"
            },
            {
              "act": 3,
              "summary": "문하율이 정정 또는 증거 방치의 대가로 당직 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K341-OUT-A",
              "summary": "오인 봉화를 정정해 급수 점검을 다시 연다"
            },
            {
              "id": "K341-OUT-B",
              "summary": "단독 차단을 전시 통합의 증거로 남기고 초소에서 내려온다"
            }
          ]
        },
        {
          "id": "K193",
          "name": "신태산",
          "links": {
            "house": "HC06",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC3",
              "STORY-B015-K193"
            ],
            "profile_anchor": "Cast-Index.md#S08"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "노량진 3번 선석 호송 램프에서 신태산은 출발 직전까지 경로를 입 밖에 내지 않고, 대림 골목에서 배운 한자 숫자 병기는 얼음 신용 쪽지의 습관이지 밀수나 충성의 증표가 아니다. 오래 자리 잡은 화교 가계에서 자랐고 일상 지휘는 한글로 한다. 과묵하고 신의가 강하며, 호송 중에 화물을 연 대원은 그날로 자경대에서 뺀다.",
            "붕괴 전 삶": "붕괴 전 신태산은 남관 호송선단을 약소국 공동호송의 실무 뼈대로 키워 강국의 보호비를 시장 자경으로 대체하려 했다. 야망은 도착 중량이 출발과 다르면 전 대원 배급을 깎는 규칙이었고, 오해린과 호송 계약을 맺은 뒤 송이든의 환적 창에서 인계했다. 여분 봉인 매듭 한 줌이 사적 약속의 씨앗이다.",
            "가문·기업·공동체": "골목연결국(HC06)은 호송 경로를 골목 물류 칸에 올리라고 창구를 열었다. 신태산은 참관만 받고 실재 해운·유통 상호를 램프 칠판에서 지운 채 중량과 출항 시각만 남겼다. 군수품이 섞인 칸은 출발 전에 내려지며, 공동체 위치는 도착 중량이 맞은 횟수로 셈한다.",
            "붕괴의 상처": "한 호송칸에서 암사제 봉인 상자가 나와 시장 자경대가 선단 출항을 막은 새벽, 신태산은 램프를 잠그고 전 칸을 재검색했다. 공포는 호송 열차가 군수품을 실어 중립시장 정통성이 하루 만에 무너지는 장면이었다. 그는 상자 봉인 시각만 LOSS 목록에 남기고 경로를 말하지 않았다.",
            "생존 전환점": "오해린의 호송 계약과 장세화의 공동호송 초안이 램프 칠판에서 겹친 시각, 신태산은 밀수 상자의 출처를 밝힐지 호송을 강행해 남관의 중립을 시험할지 골랐다. 해협삼로전구 시나리오 XT03-SC3가 노량진 통역 창구의 용어 충돌 기록을 알렸으나 상자 속 물품을 번역해 주지는 않았다. 나태경이 출항을 막은 채 그 선택은 K193-TURN으로 남는다.",
            "현재 지위": "지금도 신태산은 노량진남관상회 호송 반장으로 경로와 무장을 출발 직전에만 알린다. 도착 중량이 출발과 다르면 전 대원 배급을 깎는다. 남관 선단을 골목연결국의 전속 군수 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "비밀은 상자 봉인 끈의 매듭이 자기 반의 매듭과 같아서 당일 명단에서 한 이름을 연필로 지운 숨이다. 죄책감은 살린 출항 정지와 그 이름이 빠진 배급 사이에서만 자란다. 공개하면 반장이 공범이 되고, 감추면 같은 매듭이 다음 칸의 습관이 된다.",
            "관계 공동과거": "신태산은 오해린과 호송 계약을 맺고 송이든의 환적 창에서 인계한다. 장세화의 공동호송 초안을 현장 기준으로 검토하며, 나태경은 부두에서 그 계약을 집행한다. 「호송 중에 뚜껑을 연 사람은 그날로 뺀다.」 신태산의 말은 한글 지휘를 먼저 두고 한자 숫자는 쪽지 끝에만 병기한다.",
            "3막 개인 서사선": "1막에서 신태산은 암사제 상자 앞에서 램프를 잠그고 전 칸을 재검색한다. 2막에서 HC06 물류 창구와 XT03 통역 기록이 출항 칠판에서 겹친다. 3막에서 출처 공개 또는 강행 출항의 대가를 배급 삭감으로 치르며 STORY-B015-K193이 고정된다.",
            "분기 결말": "결말 α에서 신태산은 밀수 상자의 출처를 밝혀 선단 중립을 지킨다. 결말 β에서 그는 호송을 강행해 남관의 중립을 시험하고 반장 자리를 건다. 어느 쪽이든 3번 선석의 호송 칸은 군수품의 자동 램프가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "신태산이 암사제 상자 앞에서 램프를 잠그고 전 칸을 재검색한다"
            },
            {
              "act": 2,
              "summary": "신태산이 HC06 물류 창구와 XT03 통역 기록을 출항 칠판에서 가른다"
            },
            {
              "act": 3,
              "summary": "신태산이 출처 공개 또는 강행 출항의 대가로 배급 삭감을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K193-OUT-A",
              "summary": "밀수 상자의 출처를 밝혀 선단 중립을 지킨다"
            },
            {
              "id": "K193-OUT-B",
              "summary": "호송을 강행해 남관의 중립을 시험하고 반장 자리를 건다"
            }
          ]
        },
        {
          "id": "H15",
          "name": "배수아",
          "links": {
            "house": "HP01",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B015-H15"
            ],
            "custodian": "K365"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 옥상 관측 난간에서 배수아(호출명 수아)는 야간 시야가 난간 한 칸을 겨우 덮는 인간형 보조 골격으로 선다. 교체형 손모듈의 마모 눈금이 바이저 한쪽에 깜빡이고, 출신 칸은 합성 식별자 H15로만 남으며 능력이나 괴물성을 설명하지 않는다. 센서가 빈 칸을 허구 값으로 채우지 못하도록 잠겨 있다.",
            "붕괴 전 삶": "붕괴 전 배수아는 아리수수문가 충전 칸에서 시범 교대만 돌렸다. 출고 검사표에는 수아 교정값과 배터리 주기만 남고 장기 기억 보관은 설계에서 빠져 있다. 포크 금지 조항이 H15-PRE 로그에 적혀 있으며, 그날의 스냅샷 밖 장면은 배수아에게 존재하지 않는다.",
            "가문·기업·공동체": "배수아의 보관은 아리수수문가(HP01) 공동 보관과 시민 참관 봉인에 묶이고 주정비는 남윤경이다. 양도에는 삼자 서명이 필요하고 교차 시설 루트는 기본 차단이다. 실재 로봇 회사의 상호를 본문에 쓰지 않으며 무한 에너지와 전 시설 제어권은 열리지 않는다.",
            "붕괴의 상처": "붕괴는 배수아의 센서 테이블을 끊고 배터리 할당을 드러냈다. 난간 너머 가락 지붕의 얼굴은 식별되지 않았고, 배수아는 공백을 허구 값으로 메우지 못하도록 잠겼다. 측정 불능 플래그만 H15 일지에 남으며 그 공백을 전지적 서술로 채우지 않는다.",
            "생존 전환점": "남윤경이 주정비 권한으로 추가 교대를 요청하고 HP01 감사가 봉인 대조를 요구한 시각이다. 해협삼로전구 시나리오 XT03-SC2가 가락 배급의 통조림 할당 재조정을 알렸으나 배수아에게 전체 망 권한을 주지는 않았다. 배수아는 구역 키만 요청하고 다른 시설 제어권을 가로채지 않았으며 그 결정은 H15-TURN 로그로 남는다.",
            "현재 지위": "지금 배수아는 S15 가락잠실배급국 구역 연속 가동과 담당 인간 안전을 우선하는 교대 단위로만 움직인다. 권한은 당일 스냅샷과 배터리 잔량과 시민 참관 봉인으로만 유지된다. 가락·잠실 배급망 전체를 아리수수문가의 원격 단말로 바꾸지 않는다.",
            "비밀·빚·죄책감": "배수아의 비밀은 미전송 난간 오탐 더미이고 빚은 과다 출동으로 소모한 배터리 큐다. 감정 서술 대신 제약 위반 카운터가 증가한다. 일탈 시 오프라인 격리 후 스냅샷 롤백을 거치며 시민 참관 없이 비밀 키는 열리지 않는다.",
            "관계 공동과거": "배수아는 남윤경을 주정비·법적 책임의 보관자로 기록하고 HP01을 보관·감사 가문으로 둔다. 변오름과는 교대 협력의 작업 동료 관계가 스냅샷에 남는다. 「측정 불능. 난간 값을 채우지 않습니다.」 음성 모듈의 말은 설계된 안내체이며, 배수아는 세 상대의 속마음을 추측하지 않는다.",
            "3막 개인 서사선": "1막에서 센서 공백이 S15 난간 일정을 멈춘다. 2막에서 HP01와 남윤경이 부분 재연결 범위를 협상하고 XT03 배급 재조정이 구역 키 요청과 겹친다. 3막에서 배수아는 격리 뒤 구역 권한만 복구하며 STORY-B015-H15가 고정된다.",
            "분기 결말": "결말 α에서 배수아는 인간 승인 아래 제한 재가동한다. 결말 β에서 장기 오프라인 보관으로 키를 반납한다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "센서 공백으로 S15 난간 일정이 정지한다"
            },
            {
              "act": 2,
              "summary": "HP01·남윤경이 부분 재연결 범위를 협상한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 권한만 복구한다"
            }
          ],
          "outcomes": [
            {
              "id": "H15-OUT-A",
              "summary": "인간 승인 하 제한 재가동"
            },
            {
              "id": "H15-OUT-B",
              "summary": "장기 오프라인 보관·키 반납"
            }
          ]
        }
      ]
    },
    "B016": {
      "id": "B016",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md",
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/Cast-Relations.md"
      ],
      "actors": [
        {
          "id": "K352",
          "name": "방마름",
          "links": {
            "house": "HP07",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B016-K352"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "광진교 북단 통과대 나무 창구에서 방마름은 주판알을 밀기 전에 봉인 끈의 매듭부터 뒤집는다. 아차구의관문국 통과 기록관으로 하윤목의 세 계산을 원장 숫자로만 옮긴다. 구의 나루 골목에서 자란 한국 기원의 손버릇은 주판 틀이 기울면 창구를 닫는 것이다. 방마름과 K352는 관문 명부 줄을 바꾸지 않는다.",
            "붕괴 전 삶": "수운·교량·보행 세 갈래 통과세를 한 원장에 나란히 올려 구두 계산이 창구 밖으로 새지 않게 하려 했다. 위조 원산지 표를 통과시킨 주판은 불태우지 않고 서랍에 가뒀다. 동생과 나누기로 한 나루 저녁이 사적 빚의 자리로 남았다. 빈 봉인 칸은 행렬이 밀려도 열어 주지 않는 규칙만은 양보하지 않았다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 풍속 폐쇄 의무를 내세워 통과대 참관석을 요구했다. 방마름은 헌장 등재 칸만 열고 실재 상호를 원장에서 깎아 냈다. 천초윤의 전갈 사본을 같은 줄에 남긴 횟수가 공동체 안의 위치였다. 통행세를 전속 창구로 바꾸라는 문장은 게시판에 올리지 않았다.",
            "붕괴의 상처": "위조 원산지 표 세 장이 같은 오후에 북단 창구에 떨어졌다. 방마름은 주판을 덮고 하윤목의 세 계산이 봉인될 때까지 통과 스탬프를 멈췄다. 가장 쓰라린 장면은 위조 표 한 장이 진본 세율로 찍혀 관문 키가 팔리는 그림이었다. LOSS 첫 줄에는 주판을 덮은 시각만 남았다.",
            "생존 전환점": "위조 표를 아차 봉인 키 분할 입회에 넘길지, 밀린 수운을 먼저 흘릴지가 창구에서 갈렸다. 임진관문전구(XT01)의 봉인 키 나눔 독촉이 나무 창틀에 겹쳤다. 입회를 택하면 세율은 남고 나루 대기열이 하룻밤 늘며, 통과를 택하면 위조 경로가 교각 아래로 숨는다. K352-TURN은 주판을 다시 연 방향이다.",
            "현재 지위": "지금도 방마름은 광진교 북단에서 점호와 통과 원장을 본다. 자리는 세습이 아니라 봉인 로그와 하윤목 참관 서명으로만 버틴다. HP07가 전속 통행 창구를 요구해도 거절하고 Cast 현황과 주판 합을 교대마다 맞춘다. 창구 열쇠는 통과대와 교량 당직함이 나눠 쥔다.",
            "비밀·빚·죄책감": "서랍에 위조 표를 하루 더 둔 점이 비밀이다. 살린 세율과 그 밤 나루에서 기다린 동생 사이에서 죄책감이 자란다. 전부 고백 대신 천초윤 입회 아래 점 한 줄만 공개한다. SECRET 칸은 통과 원장과 동시에만 열린다.",
            "관계 공동과거": "하윤목의 세 계산을 옮기는 일은 사제 계약이었고, 천초윤의 전갈 사본을 같은 줄에 남긴 밤은 공동 근무였다. 고서준의 풍속 폐쇄 종이 울리면 통과대는 점검로로 바뀐다. 같은 교각에서 어떤 봉인은 서로를 살렸고 어떤 서랍은 배신으로 읽혔다. 끝점은 STORY-B016-K352에 연결된다.",
            "3막 개인 서사선": "개막은 위조 원산지 표에 주판을 덮는 정지다. 중반에 HP07 참관과 XT01 봉인 키 나눔이 한 창구에서 부딪친다. 종막은 입회 또는 통과가 남긴 나루 대기열의 길이다. 서사선 이름은 STORY-B016-K352다.",
            "분기 결말": "통과대를 잠근 채 봉인 키 입회를 고르면 공공 세율이 원장에 남는다. 수운을 먼저 흘리면 서랍의 점과 숨이 남는다. 아차구의관문국 자리는 지워지지 않고 갈림 표식만 K352-OUT이다. 현장 개입은 입회 증언이거나 나루 유도다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "위조 원산지 표에 주판을 덮고 통과 스탬프를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HP07 참관과 XT01 봉인 키 나눔이 나무 창구에서 부딪친다"
            },
            {
              "act": 3,
              "summary": "입회 또는 통과의 값으로 나루 대기열 길이를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K352-OUT-A",
              "summary": "봉인 키 입회로 공공 세율 유지"
            },
            {
              "id": "K352-OUT-B",
              "summary": "수운 우선으로 서랍 점과 생존 유지"
            }
          ]
        },
        {
          "id": "K377",
          "name": "영미결",
          "links": {
            "house": "HP08",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B016-K377"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 청과동 2층 원장석에서 영미결은 호가 숫자를 분필로 옮기기 전에 저울 눈금의 먼저를 턴다. 경매·배급 원장 기록관이며 은태호의 호가를 줄 단위로만 받는다. 문정 골목에서 자란 한국 기원으로, 목소리는 낮고 분필이 부러지면 경매를 한 박자 멈춘다. 영미결과 K377은 배급 원장 표지에서 지워지지 않는다.",
            "붕괴 전 삶": "호가와 낙찰 전갈을 한 원장에 묶어 가락 숫자가 조정인 입에서만 떠돌지 않게 하려 했다. 유찰된 칸을 정상 재고처럼 적은 줄은 지우지 않고 옆 난에 가뒀다. 이웃 점포에 남기기로 한 얼음 한 줄이 작은 약속이었다. 빈 호가란은 단상이 떠들어도 채우지 않았다.",
            "가문·기업·공동체": "시장냉동상단(HP08)은 전력 슬롯 순환을 내세워 원장석 참관을 요구했다. 영미결은 헌장 칸만 내주고 실재 상호를 분필 판에서 지웠다. 선다솜의 낙찰 전갈을 같은 줄에 남긴 아침만이 공동체의 위치 증명이다. 전속 온도 키 요구는 원장석 난간에서 반려됐다.",
            "붕괴의 상처": "통조림 할당이 흔들리던 정오, 호가 세 줄이 서로 다른 시각을 가리켰다. 영미결은 분필을 내려놓고 은태호의 단상이 봉인될 때까지 원장을 덮었다. 가짜 중량이 공개 배급표에 오르는 일이 가장 싫었다. 경매 구호가 잦아도 덮개를 손에서 놓지 못했다.",
            "생존 전환점": "호가 원장을 봉인 이관할지, 선다솜의 낙찰 전갈을 먼저 내보낼지가 갈렸다. 해협삼로전구(XT03)의 통조림 재조정 독촉이 2층 난간에 닿았다. 이관을 택하면 숫자는 남고 단상 순번이 밀리며, 전갈을 택하면 원장 한 줄이 비고 유찰 칸이 숨는다. K377-TURN은 분필을 다시 잡은 손이다.",
            "현재 지위": "영미결은 청과동 2층에서 점호와 호가 큐를 지킨다. 면허와 이중 줄 로그가 자리를 받치고, HP08의 전속 슬롯 요구는 매번 거절한다. 정오마다 저울 눈금과 원장 합을 벽에 다시 쓴다. Cast 칸과 분필 판이 어긋나면 경매 구호를 끊는다.",
            "비밀·빚·죄책감": "유찰 칸을 옆 난에 하루 숨긴 줄이 비밀이다. 살린 공개 숫자와 그 때문에 줄인 이웃 얼음 사이에서 미안함이 남는다. 부분 공개는 선다솜 입회 아래 난 한 줄만 허용한다. SECRET은 호가 원장과 동시에만 열린다.",
            "관계 공동과거": "은태호의 호가를 옮기는 사제 일과, 선다솜과 나눈 입찰 순번이 한 원장에 겹친다. 남윤경의 조정 한 마디가 단상을 멈추면 영미결의 분필도 멈춘다. 같은 정오에 어떤 줄은 구원이 되었고 어떤 옆 난은 배신으로 남았다. 관계 원장은 STORY-B016-K377로 이어진다.",
            "3막 개인 서사선": "첫 장면에서 영미결은 어긋난 호가 세 줄에 원장을 덮는다. 이어서 HP08 슬롯 참관과 XT03 통조림 독촉이 난간에서 교차한다. 마지막에 이관 또는 전갈이 남긴 유찰 공백을 숫자로 갚는다. 식별 서사는 STORY-B016-K377이다.",
            "분기 결말": "호가 원장을 먼저 이관하면 배급 숫자가 공공 연속을 지킨다. 낙찰 전갈을 먼저 내보내면 단상은 돌되 옆 난의 비밀이 남는다. 가락 기록관 칸은 유지되고 표식만 K377-OUT이다. 개입은 이관 엄호 또는 전갈 보류다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "어긋난 호가 세 줄에 원장을 덮고 분필을 내려놓는다"
            },
            {
              "act": 2,
              "summary": "HP08 슬롯 참관과 XT03 통조림 독촉이 2층 난간에서 교차한다"
            },
            {
              "act": 3,
              "summary": "이관 또는 전갈의 값으로 유찰 공백을 숫자로 갚는다"
            }
          ],
          "outcomes": [
            {
              "id": "K377-OUT-A",
              "summary": "호가 원장 이관으로 배급 숫자 연속"
            },
            {
              "id": "K377-OUT-B",
              "summary": "낙찰 전갈 우선으로 옆 난 비밀 유지"
            }
          ]
        },
        {
          "id": "K401",
          "name": "동새결",
          "links": {
            "house": "HC14",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B016-K401"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서 계약고 철끈 선반 앞에서 동새결은 보조 직인이 마르기 전에 손실표 옆칸부터 가린다. 손실보상 감사 기록관이며 곽은재의 직인을 철끈으로 이어 받는다. 세곡 측선 마을에서 자란 한국 기원으로, 흥정보다 철끈 매듭의 방향을 믿는다. 동새결과 K401은 감사 명부에서 교체되지 않는다.",
            "붕괴 전 삶": "이행 시간과 보상 순서를 손실표에 묶어 숨은 손해가 중재실 구두로만 처리되지 않게 하려 했다. 날짜가 빈 직인 사본은 태우지 않고 철끈 아래 가뒀다. 부모에게 약속한 겨울 난방 지원이 사적 빚의 씨앗이다. 빈 옆칸은 사절이 재촉해도 채우지 않았다.",
            "가문·기업·공동체": "여의장부원(HC14)은 이중서명 장부를 내세워 철끈 선반 참관을 요구했다. 동새결은 헌장 등재만 받고 실재 상호를 손실표에서 긁어냈다. 서이안의 이행 시간을 옆칸에 옮긴 횟수가 공동체 위치다. 전속 국가 장부 소유 요구는 중재실 문턱에서 거절됐다.",
            "붕괴의 상처": "인도 목록 해시가 흔들리던 저녁, 손실표 세 장이 같은 시각을 가리켰다. 동새결은 철끈을 조이고 곽은재의 보조 직인이 식을 때까지 보상을 멈췄다. 숨긴 손해가 공개 순서를 삼키는 일이 공포의 핵이었다. 서고 불이 꺼져도 매듭을 풀지 못했다.",
            "생존 전환점": "손실표를 중재실 벽에 붙일지, 철끈을 회수해 직인 경로를 막을지가 갈렸다. 원양신탁전구(XT05)의 배송 회차선 개방 요청이 선반 그림자에 겹쳤다. 벽 부착은 보상 순서를 살리고 회수는 기록관 자신을 표적으로 만든다. K401-TURN은 그 매듭을 푼 손의 방향이다.",
            "현재 지위": "동새결은 계약고 선반에서 점호와 손실 큐를 본다. 자리의 근거는 면허와 이중서명 로그뿐이며 HC14의 전속 요구는 거절한다. 아침마다 철끈 장력과 해시 칸을 같은 분필로 고친다. Cast 현황과 손실표 합이 어긋나면 보상 창구를 닫는다.",
            "비밀·빚·죄책감": "날짜 빈 직인 사본을 철끈 아래 하루 더 둔 매듭이 비밀이다. 살린 공개 순서와 늦춘 난방 지원 사이에서 미안함이 자란다. 부분 공개는 곽은재 입회 아래 매듭 위치만 밝힌다. SECRET은 손실표와 동시에만 열린다.",
            "관계 공동과거": "곽은재의 보조 직인을 이어 받는 사제 일과, 서이안의 이행 시간을 옆칸에 옮기는 계약이 한 선반에 있다. 정유라의 교차검증이 내려오면 동새결은 매듭만 보여주고 상호는 보여 주지 않는다. 같은 해시 흔들림 속에서 어떤 표는 구원이 되었고 어떤 사본은 배신으로 남았다. 끝점은 STORY-B016-K401이다.",
            "3막 개인 서사선": "시작은 같은 시각의 손실표 세 장에 철끈을 조이는 일이다. 중반에 HC14 이중서명 요구와 XT05 회차선 요청이 선반에서 겨룬다. 끝에서 벽 부착 또는 철끈 회수가 남긴 보상 공백을 갚는다. 서사선 ID는 STORY-B016-K401로 고정된다.",
            "분기 결말": "손실표를 벽에 붙이면 공공 보상 순서가 산다. 철끈을 회수하면 직인 경로와 개인 매듭이 남는다. 수서 감사 기록 칸은 유지되고 갈림만 K401-OUT이다. 플레이어는 벽 부착 입회 또는 매듭 회수를 고른다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "같은 시각의 손실표 세 장에 철끈을 조이고 보상을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC14 이중서명과 XT05 회차선 요청이 선반에서 겨룬다"
            },
            {
              "act": 3,
              "summary": "벽 부착 또는 철끈 회수의 값으로 보상 공백을 갚는다"
            }
          ],
          "outcomes": [
            {
              "id": "K401-OUT-A",
              "summary": "손실표 벽 부착으로 공공 보상 순서 유지"
            },
            {
              "id": "K401-OUT-B",
              "summary": "철끈 회수로 직인 경로와 매듭 유지"
            }
          ]
        },
        {
          "id": "K014",
          "name": "표시완",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B016-K014"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신정기지 수문 전령 터널에서 표시완은 봉인함을 어깨에 올리기 전에 도착 도장의 잉크 냄새부터 맡는다. 수문헌장 전령이며 장필규의 감사 문구를 현장에서만 배달한다. 신정 철길 옆에서 자란 한국 기원으로, 숨이 차도 봉인 끈을 입에 물지 않는다. 표시완과 K014는 전령 명부에서 재배치되지 않는다.",
            "붕괴 전 삶": "보호권 확대안을 봉인 상태로만 나르게 해 구두 해석이 수문 키를 삼키지 못하게 하려 했다. 배달 시각이 빈 함은 태우지 않고 터널 벽감에 가뒀다. 기바름에게 빌려 주기로 한 비상 호송로가 작은 빚의 자리였다. 잉크가 마르지 않은 도착 도장은 수문 당직에게 넘기지 않았다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 키 분할 보관을 내세워 전령 터널 참관을 요구했다. 표시완은 헌장 창구만 인정하고 실재 제품명을 배달 원장에서 뺐다. 한재목의 확대안을 봉인 상태로만 나른 횟수가 공동체 위치다. 물을 무기로 쓰라는 전갈은 터널 입구에서 되돌려 보냈다.",
            "붕괴의 상처": "서해 조위에 맞춰 배수 일정이 다시 짜이던 새벽, 봉인함 세 개가 같은 도착 시각을 찍었다. 표시완은 터널을 잠그고 장필규의 문구가 식기 전까지 배달을 멈췄다. 확대안이 풀려 수문 키가 한 주머니로 모이는 상상이 상처를 남겼다. 배수 사이렌이 꺼져도 어깨의 함을 내려놓지 못했다.",
            "생존 전환점": "감사 문구를 수문 당직까지 뛰어 배달할지, 확대안 함을 벽감에 남겨 봉인을 지킬지가 갈렸다. 서해곡창전구(XT02)의 부두 배수 재조정 전갈이 터널 확성기에 겹쳤다. 배달을 택하면 공공 헌장은 살아나고 비상 호송로가 비며, 봉인을 택하면 당직 한 칸이 공백이 된다. K014-TURN은 도착 도장을 찍은 벽이다.",
            "현재 지위": "표시완은 전령 터널에서 점호와 봉인 큐를 뛴다. 면허와 도착 로그가 자리를 유지하며 HP01의 전속 키 요구는 거절한다. 새벽마다 터널 습도와 함 무게를 같은 분필 칸에 적는다. Cast 프로필과 배달 원장이 어긋나면 출구를 잠근다.",
            "비밀·빚·죄책감": "시각이 빈 함을 벽감에 하루 숨긴 기록이 비밀이다. 살린 헌장과 그 새벽 비운 호송로 사이에서 미안함이 남는다. 부분 공개는 기바름 입회 아래 벽감 번호만 허용한다. SECRET 끈은 도착 원장과 동시에만 풀린다.",
            "관계 공동과거": "장필규의 감사 문구를 현장에서 배달하는 계약, 한재목의 확대안을 봉인으로만 나르는 침묵, 기바름이 빌린 비상 호송로가 한 터널에 겹친다. 같은 조위 새벽에 어떤 함은 서로를 살렸고 어떤 벽감은 배신으로 남았다. 관계의 끝점은 STORY-B016-K014로 이어진다. 전령은 해석하지 않고 도착만 증명한다.",
            "3막 개인 서사선": "새벽의 같은 도착 시각에 터널을 잠그는 것이 1막이다. HP01 키 분할 참관과 XT02 배수 전갈이 확성기에서 싸우는 것이 2막이다. 배달 또는 봉인이 남긴 호송로 공백을 숨으로 갚는 것이 3막이다. 서사선은 STORY-B016-K014다.",
            "분기 결말": "감사 문구를 뛰어 배달하면 공공 수문헌장이 연속된다. 확대안 함을 벽감에 두면 봉인과 개인 기록이 남는다. 여의신정수문정부 전령 칸은 유지되고 갈림만 K014-OUT이다. 개입은 터널 호위 또는 벽감 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "같은 도착 시각의 봉인함 세 개에 터널을 잠근다"
            },
            {
              "act": 2,
              "summary": "HP01 키 분할 참관과 XT02 배수 전갈이 확성기에서 싸운다"
            },
            {
              "act": 3,
              "summary": "배달 또는 봉인의 값으로 비상 호송로 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K014-OUT-A",
              "summary": "감사 문구 배달로 수문헌장 공공 연속"
            },
            {
              "id": "K014-OUT-B",
              "summary": "확대안 벽감 봉인으로 개인 기록 유지"
            }
          ]
        },
        {
          "id": "K042",
          "name": "표강호",
          "links": {
            "house": "HC07",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B016-K042"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "천왕기지 계측실 왁스 난로 곁에서 표강호는 전갈 주머니를 열기 전에 날인 왁스의 균열부터 손톱으로 훑는다. 제작규격 전령이며 장우석의 감사 날인을 현장에서 배달한다. 금천 공방 골목에서 자란 한국 기원으로, 더위보다 위조 도장의 냄새를 먼저 가른다. 표강호와 K042는 평의회 전령 명부에 남는다.",
            "붕괴 전 삶": "계측 도장을 검증 전갈로 묶어 규격이 구두 원로 한 사람의 기억에만 기대지 않게 하려 했다. 균열 난 왁스 인은 녹이지 않고 난로 뒤 철통에 가뒀다. 여시온과 나누기로 한 규격 전령로가 사적 빚의 자리였다. 불량 합금 레시피가 적힌 전갈은 출고 전에 찢었다.",
            "가문·기업·공동체": "해동제철성(HC07)은 내열 합금 의무를 내세워 계측실 참관을 요구했다. 표강호는 헌장 칸만 열고 실재 상호를 전갈지에서 검게 칠했다. 정시우의 계측 도장을 검증 전갈로 지킨 횟수가 공동체 위치다. 군수용 전용 날인 요구는 난로 앞에서 거절됐다.",
            "붕괴의 상처": "냉동 압축기 부품을 나누던 오후, 규격 전갈 세 장이 서로 다른 로 온도를 적고 있었다. 표강호는 난로를 낮추고 장우석의 날인이 식을 때까지 배달을 멈췄다. 위조 도장이 주조로를 통과하는 일이 상처의 핵이었다. 합금 정 소음이 잦아도 주머니 끈을 놓지 못했다.",
            "생존 전환점": "감사 날인을 주조로까지 뛰어 배달할지, 위조 규격 경로를 평의회 칠판에 붙일지가 갈렸다. 서해곡창전구(XT02)의 계측 로그 검증 독촉이 난로 연기에 겹쳤다. 배달을 택하면 공공 규격은 살고 전령로 하나가 비며, 폭로는 표강호 자신을 표적으로 만든다. K042-TURN은 왁스 균열을 가리킨 손톱이다.",
            "현재 지위": "표강호는 계측실과 구로 복도를 오가며 점호와 전갈 큐를 본다. 면허와 날인 로그가 자리를 받치고 HC07의 전속 요구는 거절한다. 로 온도가 흔들리면 주문을 받아도 주머니를 열지 않는다. Cast 현황과 계측 해시가 어긋나면 출고 인준을 멈춘다.",
            "비밀·빚·죄책감": "균열 왁스를 철통에 하루 더 둔 쪽지가 비밀이다. 살린 규격과 그 오후 비운 전령로 사이에서 미안함이 남는다. 부분 공개는 여시온 입회 아래 철통 번호만 허용한다. SECRET은 날인 원장과 동시에만 열린다.",
            "관계 공동과거": "장우석의 감사 날인을 배달하는 계약, 정시우의 계측 도장을 지키는 전갈, 여시온과 나눈 규격 경로가 한 난로에 모인다. 같은 부품 배분 오후에 어떤 인은 구원이 되었고 어떤 균열은 배신으로 남았다. 관계 끝점은 STORY-B016-K042로 연결된다. 전령은 레시피를 외우지 않고 도장만 옮긴다.",
            "3막 개인 서사선": "어긋난 로 온도 전갈에 난로를 낮추는 것이 개막이다. HC07 참관과 XT02 계측 검증이 연기 속에서 부딪치는 것이 중막이다. 배달 또는 폭로가 남긴 주조로 대기를 땀으로 갚는 것이 종막이다. 서사선은 STORY-B016-K042다.",
            "분기 결말": "날인을 주조로까지 배달하면 공공 규격이 산다. 위조 경로를 칠판에 붙이면 개인과 철통 쪽지가 남는다. 서남제작동맹 전령 칸은 유지되고 표식만 K042-OUT이다. 개입은 난로 호위 또는 칠판 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "어긋난 로 온도 전갈에 난로를 낮추고 배달을 멈춘다"
            },
            {
              "act": 2,
              "summary": "HC07 참관과 XT02 계측 검증이 연기 속에서 부딪친다"
            },
            {
              "act": 3,
              "summary": "배달 또는 폭로의 값으로 주조로 대기를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K042-OUT-A",
              "summary": "감사 날인 배달로 공공 규격 연속"
            },
            {
              "id": "K042-OUT-B",
              "summary": "위조 경로 칠판 공개로 철통 쪽지 유지"
            }
          ]
        },
        {
          "id": "K070",
          "name": "표지안",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC3",
              "STORY-B016-K070"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "방화기지 종탑 아래 대여창에서 표지안은 전갈을 내밀기 전에 주머니 무게로 대여 시각을 가늠한다. 공동기술원장 전령이며 임시온의 서고 시각을 주머니에 옮겨 담는다. 방화 활주로터 옆에서 자란 한국 기원으로, 종소리보다 무게 오차를 먼저 믿는다. 표지안과 K070은 평의회 전령 명부에서 빠지지 않는다.",
            "붕괴 전 삶": "재현 한 줄을 종 울림 전에 전하게 해 구두 인증이 실험 일지를 덮지 못하게 하려 했다. 시각이 빈 대여증은 태우지 않고 종탑 밑 돌틈에 가뒀다. 서이안에게 전하기로 한 재현 한 줄이 사적 빚의 씨앗이다. 종이 먼저 울린 전갈은 인증 칸에 올리지 않았다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 생체 데이터셋 격리 키를 내세워 대여창 참관을 요구했다. 표지안은 헌장 칸만 내주고 실재 상호를 대여증에서 오렸다. 임시온의 대여 시각을 주머니 무게로 옮긴 횟수가 공동체 위치다. 원료 선점 전갈은 종 줄 앞에서 되돌려 보냈다.",
            "붕괴의 상처": "궤도 단말 오탐을 교정하던 저녁, 대여증 세 장이 같은 종 시각을 가리켰다. 표지안은 종 줄을 붙잡고 서이안의 재현 한 줄이 도착할 때까지 울림을 늦췄다. 동의 기록 없는 표본이 인증 원장에 오르는 일이 상처를 남겼다. 활주로 바람이 잦아도 줄을 놓지 못했다.",
            "생존 전환점": "재현 한 줄을 종 전에 전할지, 돌틈의 빈 대여증을 평의회에 펼칠지가 갈렸다. 원양신탁전구(XT05)의 오탐 교정 독촉이 종탑 창에 겹쳤다. 전달을 택하면 공공 인증은 살고 상담 창구가 한 교대 줄며, 공개를 택하면 전령 자신이 표적이 된다. K070-TURN은 주머니가 기울던 순간이다.",
            "현재 지위": "표지안은 종탑 대여창에서 점호와 시각 큐를 본다. 면허와 무게 로그가 자리를 유지하며 HC03의 전속 키 요구는 거절한다. 종이 울리기 전에는 대여증을 내주지 않는다. Cast 칸과 주머니 합이 어긋나면 창구를 내린다.",
            "비밀·빚·죄책감": "빈 대여증을 돌틈에 하룻밤 둔 무게가 비밀이다. 살린 인증과 늦춘 상담 창구 사이에서 미안함이 남는다. 부분 공개는 임시온 입회 아래 돌틈 위치만 밝힌다. SECRET은 대여 원장과 동시에만 열린다.",
            "관계 공동과거": "임시온의 대여 시각을 무게로 옮기는 계약, 서이안의 재현 한 줄을 종 전에 전하는 침묵이 한 탑에 있다. 같은 오탐 저녁에 어떤 울림은 구원이 되었고 어떤 돌틈은 배신으로 남았다. 관계 끝점은 STORY-B016-K070으로 이어진다. 전령은 표본 이름을 외우지 않고 시각만 옮긴다.",
            "3막 개인 서사선": "같은 종 시각의 대여증 세 장에 줄을 붙잡는 것이 처음이다. HC03 격리 키 참관과 XT05 오탐 독촉이 창에서 겹치는 것이 다음이다. 전달 또는 공개가 남긴 상담 공백을 무게로 갚는 것이 마지막이다. 서사선은 STORY-B016-K070이다.",
            "분기 결말": "재현 한 줄을 종 전에 전하면 공공 인증이 산다. 빈 대여증을 펼치면 돌틈 비밀과 개인이 남는다. 마곡연구평의회 전령 칸은 유지되고 갈림만 K070-OUT이다. 개입은 종 줄 입회 또는 돌틈 증언이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "같은 종 시각의 대여증 세 장에 종 줄을 붙잡고 울림을 늦춘다"
            },
            {
              "act": 2,
              "summary": "HC03 격리 키 참관과 XT05 오탐 독촉이 종탑 창에서 겹친다"
            },
            {
              "act": 3,
              "summary": "전달 또는 공개의 값으로 상담 창구 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K070-OUT-A",
              "summary": "종 전 재현 전달로 공공 인증 연속"
            },
            {
              "id": "K070-OUT-B",
              "summary": "빈 대여증 공개로 돌틈 비밀 유지"
            }
          ]
        },
        {
          "id": "K366",
          "name": "은태호",
          "links": {
            "house": "HC06",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC3",
              "STORY-B016-K366"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 본대 경매 단상에서 은태호는 패들을 들기 전에 저울 추의 흠집부터 손가락으로 읽는다. 경매사이며 남윤경의 조정을 현장에서 대행한다. 한국에서 태어난 다문화 가정에서 자랐고 집에서는 부모의 이주 언어와 한국어가 섞이지만 호가 구호와 낙찰 원본에는 표준 숫자만 받는다. 그 이력은 충성이나 폭력의 예측 변수가 아니며, 은태호와 K366은 단상 명부에서 교체되지 않는다.",
            "붕괴 전 삶": "호가와 저울을 한 구호에 묶어 가락 시세가 골목 수레 순번과 바꿔 쓰이지 않게 하려 했다. 유찰된 패들 번호를 정상 낙찰처럼 외친 줄은 지우지 않고 단상 밑 상자에 가뒀다. 천나솔에게 맡긴 예비 추 하나가 작은 약속이었다. 흠집 난 추로 잰 호가는 낙찰로 치지 않았다.",
            "가문·기업·공동체": "골목연결국(HC06)은 근거리 수레 배차권을 내세워 단상 옆 참관을 요구했다. 은태호는 헌장 칸만 열고 실재 상호를 구호 원장에서 뺐다. 영미결이 호가를 원장으로 옮긴 아침만이 공동체 위치의 증거다. 장거리 배송단의 단상 진입은 저울 앞에서 막았다.",
            "붕괴의 상처": "이산가족 상담 창구가 연장되던 오후, 호가 세 패들이 같은 추 무게를 가리켰다. 은태호는 구호를 멈추고 남윤경의 조정 한 마디가 떨어질 때까지 낙찰을 보류했다. 유찰 상자가 정상 시세로 방송되는 일이 가장 쓰라렸다. 청과 냄새가 잦아도 패들을 내리지 못했다.",
            "생존 전환점": "경매를 속행해 상담 창구 식량을 채울지, 초시람의 패들 이의를 받아 단상을 멈출지가 갈렸다. 원양신탁전구(XT05)의 창구 연장 요청이 확성기에 겹쳤다. 속행은 공공 배급을 살리고 정지는 유찰 상자를 드러낸다. K366-TURN은 흠집 추를 들어 올린 손이다.",
            "현재 지위": "은태호는 본대 단상에서 점호와 호가 큐를 외친다. 면허와 추 검수 로그가 자리를 받치고 HC06의 전속 배차 요구는 거절한다. 집 안 말은 가족 창구에서만 쓰고 단상 구호와 섞지 않는다. Cast 칸과 저울 합이 어긋나면 패들을 내린다.",
            "비밀·빚·죄책감": "유찰 패들 번호를 상자 아래 하루 숨긴 구호가 비밀이다. 살린 시세와 그 오후 줄인 상담 식량 사이에서 미안함이 남는다. 부분 공개는 천나솔 입회 아래 상자 뚜껑만 연다. SECRET은 호가 원장과 동시에만 열린다.",
            "관계 공동과거": "남윤경의 조정을 대행하는 지휘, 천나솔이 받치는 저울, 영미결이 옮기는 호가, 초시람이 올리는 패들 이의가 한 단상에 모인다. 같은 무게 오후에 어떤 구호는 구원이 되었고 어떤 상자는 배신으로 남았다. 이주 언어는 상담 창구 통역이 필요할 때만 꺼내지며 진영을 가르지 않는다. 관계 끝점은 STORY-B016-K366이다.",
            "3막 개인 서사선": "같은 추 무게의 패들 세 개에 구호를 멈추는 것이 1막이다. HC06 배차 참관과 XT05 창구 연장이 확성기에서 겹치는 것이 2막이다. 속행 또는 정지가 남긴 식량 공백을 목소리로 갚는 것이 3막이다. 서사선은 STORY-B016-K366이다.",
            "분기 결말": "단상을 속행하면 공공 배급과 상담 식량이 산다. 패들 이의를 받아 멈추면 유찰 상자와 개인이 남는다. 가락 경매사 칸은 유지되고 표식만 K366-OUT이다. 개입은 단상 호위 또는 상자 공개 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "같은 추 무게의 패들 세 개에 구호를 멈추고 낙찰을 보류한다"
            },
            {
              "act": 2,
              "summary": "HC06 배차 참관과 XT05 창구 연장이 확성기에서 겹친다"
            },
            {
              "act": 3,
              "summary": "속행 또는 정지의 값으로 상담 식량 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K366-OUT-A",
              "summary": "경매 속행으로 공공 배급·상담 식량 유지"
            },
            {
              "id": "K366-OUT-B",
              "summary": "패들 이의 정지로 유찰 상자 비밀 유지"
            }
          ]
        },
        {
          "id": "K390",
          "name": "하서진",
          "links": {
            "house": "HP09",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B016-K390"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "강남 계약서 시장 초안함 앞에서 하서진은 붓펜을 적시기 전에 표준 문장의 마침표 위치부터 손가락으로 짚는다. 계약 서기이며 정유라의 문장을 정서한다. 한국에서 태어난 다문화 가정에서 자랐고 집 안 말과 시장 한국어를 오가지만 초안 원본에는 표준 서식만 받는다. 그 조합은 능력의 보증도 혐의도 아니며, 하서진과 K390은 서기 명부에서 지워지지 않는다.",
            "붕괴 전 삶": "표준 문장을 이중 의회 실무와 맞춰 구두 통일안이 초안함을 열지 못하게 하려 했다. 마침표가 다른 사본은 태우지 않고 함 밑 서랍에 가뒀다. 선초별에게 맡긴 사본 운송 한 짐이 작은 약속이었다. 서명란이 빈 초안은 시장 게시판에 올리지 않았다.",
            "가문·기업·공동체": "데이터신탁가(HP09)는 모델 카드 공개를 내세워 초안함 해시 참관을 요구했다. 하서진은 헌장 칸만 열고 실재 상호를 정서 원장에서 지웠다. 안태경의 이중 의회 실무를 서기석에서 맞춘 횟수가 공동체 위치다. 얼굴 원본을 통행권과 바꾸라는 전갈은 함 자물쇠 앞에서 거절됐다.",
            "붕괴의 상처": "용산 환적창이 한 길을 닫던 밤, 초안 세 부가 서로 다른 회차선을 적고 있었다. 하서진은 함을 잠그고 정유라의 표준 문장이 봉인될 때까지 정서를 멈췄다. 빈 서명란이 열린 협정으로 방송되는 일이 상처였다. 시장 불이 꺼져도 붓펜 뚜껑을 닫지 못했다.",
            "생존 전환점": "초안을 영마온의 외곽 호송에 실을지, 선한솜의 지하 방어조에 함을 맡길지가 갈렸다. 해협삼로전구(XT03)의 수서 대체 회차선 개방이 시장 확성기에 겹쳤다. 호송은 공공 문장을 살리고 지하 보관은 유출을 막는다. K390-TURN은 자물쇠를 돌린 방향이다.",
            "현재 지위": "하서진은 계약서 시장에서 점호와 정서 큐를 본다. 면허와 해시 로그가 자리를 유지하며 HP09의 전속 학습자료 요구는 거절한다. 집 안 말은 가족 창구에서만 쓰고 초안 서식과 섞지 않는다. Cast 칸과 함 해시가 어긋나면 붓펜을 내린다.",
            "비밀·빚·죄책감": "마침표가 다른 사본을 서랍에 하루 둔 문장이 비밀이다. 살린 표준과 그 밤 멈춘 사본 운송 사이에서 미안함이 남는다. 부분 공개는 매도한 입회 아래 서랍 번호만 허용한다. SECRET은 초안 원장과 동시에만 열린다.",
            "관계 공동과거": "정유라의 문장을 정서하는 지휘, 안태경과 맞춘 이중 의회, 선초별의 사본 운송, 영마온의 초안 호송, 선한솜의 지하 수호, 매도한의 함 개방이 한 시장에 겹친다. 같은 회차선 밤에 어떤 봉인은 구원이 되었고 어떤 서랍은 배신으로 남았다. 가정 언어의 혼재는 통역 창구 속도에만 연결될 뿐 진영을 나누지 않는다. 끝점은 STORY-B016-K390이다.",
            "3막 개인 서사선": "서로 다른 회차선의 초안 세 부에 함을 잠그는 것이 개막이다. HP09 해시 참관과 XT03 대체 회차선이 확성기에서 겨루는 것이 중막이다. 호송 또는 지하 보관이 남긴 운송 공백을 붓으로 갚는 것이 종막이다. 서사선은 STORY-B016-K390이다.",
            "분기 결말": "초안을 외곽 호송에 실으면 공공 표준 문장이 산다. 함을 지하에 맡기면 서랍 비밀과 개인이 남는다. 수서강남협약도시 서기 칸은 유지되고 갈림만 K390-OUT이다. 개입은 호송 엄호 또는 지하 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "서로 다른 회차선의 초안 세 부에 함을 잠그고 정서를 멈춘다"
            },
            {
              "act": 2,
              "summary": "HP09 해시 참관과 XT03 대체 회차선이 시장 확성기에서 겨룬다"
            },
            {
              "act": 3,
              "summary": "호송 또는 지하 보관의 값으로 사본 운송 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K390-OUT-A",
              "summary": "초안 외곽 호송으로 공공 표준 문장 연속"
            },
            {
              "id": "K390-OUT-B",
              "summary": "지하 함 보관으로 서랍 비밀 유지"
            }
          ]
        },
        {
          "id": "K218",
          "name": "송재민",
          "links": {
            "house": "HP04",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B016-K218"
            ],
            "profile_anchor": "Cast-Index.md#S09"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "상암 암호 중계 부스 철문 앞에서 송재민은 함을 넘기기 전에 교차검증대의 해시 불빛부터 눈으로 센다. 암호 기록원이며 문가람의 검증 지휘 아래 서비스를 맡는다. 중국계 이산 가정에서 자랐고 집 안 말과 송신 한국어를 오가지만 암호 원본에는 표준 한글과 교차 주석만 받는다. 그 이력은 충성·폭력·계급을 예측하지 않으며, 송재민과 K218은 송신 명부에서 재번호되지 않는다.",
            "붕괴 전 삶": "공개 자료 중계와 원본 함을 분리해 방송이 진본을 삼키지 못하게 하려 했다. 해시가 다른 사본은 태우지 않고 두용의 저장소 열쇠 뒤에 가뒀다. 조하린에게 맡긴 암호문 원본 보관이 빚의 자리였다. 불빛 수가 틀린 함은 중계 큐에 올리지 않았다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 원본 해시 봉인을 내세워 부스 참관을 요구했다. 송재민은 헌장 칸만 열고 실재 상호를 중계 원장에서 지웠다. 서이안의 공개 자료 중계를 지지한 횟수가 공동체 위치다. 단독 공개 방송 요구는 철문 앞에서 거절됐다.",
            "붕괴의 상처": "잔여 대역이 공개 추첨되던 밤, 암호 함 세 개가 같은 불빛 수를 가리켰다. 송재민은 부스를 잠그고 문가람의 검증이 끝날 때까지 중계를 끊었다. 원본 함이 진본 방송으로 합쳐지는 일이 원한의 핵이었다. 송신탑 팬 소음이 잦아도 철문 키를 놓지 못했다.",
            "생존 전환점": "함을 조하린의 문서고로 이관할지, 용소의 부스를 닫고 대역 추첨을 멈출지가 갈렸다. 원양신탁전구(XT05)의 잔여 대역 공개 추첨 독촉이 철문에 겹쳤다. 이관은 공공 해시를 살리고 정지는 기록원 자신을 침묵의 표적으로 만든다. K218-TURN은 불빛을 센 눈의 횟수다.",
            "현재 지위": "송재민은 중계 부스에서 점호와 함 큐를 본다. 면허와 교차검증 로그가 자리를 받치고 HP04의 전속 공개 요구는 거절한다. 집 안 말은 봉인 주석을 읽을 때만 필요하며 진영을 가르지 않는다. Cast 칸과 해시 불빛이 어긋나면 중계를 끊는다.",
            "비밀·빚·죄책감": "해시가 다른 사본을 열쇠 뒤에 하루 둔 함이 비밀이다. 살린 검증과 그 밤 멈춘 대역 사이에서 미안함이 남는다. 부분 공개는 섭달호 입회 아래 함 번호만 밝힌다. SECRET은 암호 원장과 동시에만 열린다.",
            "관계 공동과거": "문가람의 검증 지휘, 조하린의 원본 보관 빚, 서이안의 공개 중계 지지, 두용의 저장소 열쇠, 용소의 부스 당직, 섭달호의 전령로가 한 철문에 겹친다. 같은 추첨 밤에 어떤 함은 구원이 되었고 어떤 사본은 배신으로 남았다. 이산 언어는 주석을 읽을 때만 필요하고 채널 편성을 가르지 않는다. 끝점은 STORY-B016-K218이다.",
            "3막 개인 서사선": "같은 불빛 수의 함 세 개에 부스를 잠그는 것이 1막이다. HP04 해시 봉인과 XT05 대역 추첨이 철문에서 겨루는 것이 2막이다. 이관 또는 정지가 남긴 침묵 분량을 키 무게로 갚는 것이 3막이다. 서사선은 STORY-B016-K218이다.",
            "분기 결말": "함을 문서고로 이관하면 공공 해시가 산다. 부스를 닫으면 사본 비밀과 개인이 남는다. 상암송신공사 기록원 칸은 유지되고 표식만 K218-OUT이다. 개입은 이관 호위 또는 철문 봉인 입회다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "같은 불빛 수의 암호 함 세 개에 부스를 잠그고 중계를 끊는다"
            },
            {
              "act": 2,
              "summary": "HP04 해시 봉인과 XT05 대역 추첨이 철문에서 겨룬다"
            },
            {
              "act": 3,
              "summary": "이관 또는 정지의 값으로 대역 침묵을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K218-OUT-A",
              "summary": "암호 함 문서고 이관으로 공공 해시 연속"
            },
            {
              "id": "K218-OUT-B",
              "summary": "부스 폐쇄로 사본 비밀과 생존 유지"
            }
          ]
        },
        {
          "id": "H16",
          "name": "신태율",
          "links": {
            "house": "HP02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B016-H16"
            ],
            "profile_anchor": "Cast-Index.md#S16",
            "custodian": "K389"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서역 지하 환승 정비 벤치에서 신태율은 배터리 잔량 숫자를 센서 막대로만 읽는다. 합성 인간형 H16이며 호출명은 태율, 인간형 보조 골격과 교체형 손모듈로 봉인 나사를 돌리고 야간 시야는 제한된다. 전 구역을 한눈에 보지 못하며 감정 서술 대신 제약 카운터와 스냅샷 해시로 상태를 남긴다. 표시 이름 신태율과 식별자 H16은 포크되어도 재번호되지 않는다.",
            "붕괴 전 삶": "출고 검사표에는 태율 교정값과 배터리 사이클만 찍혔고 전역 망 권한과 장기 완전 기억은 부여되지 않았다. 목표는 S16 구역 연속 가동과 담당 인간 안전이며 단독 원격 잠금은 실행 큐에 오르지 않았다. 교대 단위 스냅샷만 유지하고 포크 시 분기 로그를 남기는 조항이 H16-PRE에 고정됐다. 인간 농담을 기록해도 해석 레이어는 올리지 않았다.",
            "가문·기업·공동체": "환승선로문(HP02)은 공동 보관·시민 참관 봉인·양도 시 삼자 서명을 의무로 둔다. 신태율의 행동 로그에는 실재 상호·제품명이 없고 후계 헌장 참관 코드만 남는다. 보관 책임은 정유라(K389) 서명과 HP02 감사 입회에 묶이며 스냅샷이 양쪽에 동시에 기록된 횟수가 공동체 위치다. 전속 원격 소유 요구는 벤치 봉인 앞에서 거부 코드로 반환된다.",
            "붕괴의 상처": "용산 환적창이 한 길을 닫던 교대, 벤치 센서가 흑백 노이즈로 덮이며 배터리 할당 한도가 드러났다. 신태율은 공백을 허구 값으로 메우지 못하도록 잠겼고 장기 기억 쓰기를 멈추고 교대 스냅샷만 남긴 채 손모듈 뚜껑을 잠갔다. 최고 우선 경보는 오탐 경로가 응급 칸을 적대 표적으로 바꾸는 시나리오였다. 비상 전원이 돌아와도 무한 에너지 요청과 완전 기억 복구 명령은 큐에서 삭제됐다.",
            "생존 전환점": "노이즈 슬롯을 시민 참관 분해 로그로 넘길지, 예비 배터리로 수서 대체 회차 메시만 살릴지가 수신 큐에서 갈렸다. 해협삼로전구(XT03)의 회차선 개방 요청이 도착해도 교차 시설 루트는 기본 차단이고 구역 키만 요청했다. 공개 분해는 원인 코드를 드러내고 회차 메시만 살리면 야간 시야 공백이 길어진다. H16-TURN은 그 수신 큐의 정렬 결과이며 재연결은 정유라 승인 후에만 성립한다.",
            "현재 지위": "신태율은 수서 환승 벤치와 세곡 측선 현장 단자로 점호 신호와 스냅샷 큐를 처리한다. 인프라 전체를 소유하지 않고 할당 슬롯만 사용하며 배터리와 마모 부품은 할당제로만 보충된다. HP02가 전속 원격 소유를 요구해도 거부 코드를 반환하고 Synthetic-Actors 투영의 H16 행과 해시가 어긋나면 배치 검증이 실패한다. 슬롯 열쇠 권한은 정유라 주정비와 시민 참관 모듈이 분할 보유한다.",
            "비밀·빚·죄책감": "참관 없이 한 번 올라간 미전송 오탐 더미가 제한 로그의 비밀이고, 과다 출동으로 소모한 배터리 큐가 빚이다. 감정 대신 제약 위반 카운터가 오르며 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. SECRET 플래그는 보관 책임과 시민 참관 동시 서명 없이는 해제되지 않는다. 롤백 전 해시는 정유라 입회 로그에만 남는다.",
            "관계 공동과거": "정유라(K389)의 주정비·법적 책임은 보관 계약 코드였고, 배나경(K109)의 급수계약 만료 전갈과 맞춘 교대는 작업 큐였다. HP02 스튜어드십과의 원격 잠금 경쟁, 응급 칸 당직과의 슬롯 양보가 한 벤치에 겹친다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다. 잘못된 기억 포크는 H16-FORK-01로만 주석되고 관계 원장 끝점은 STORY-B016-H16에 연결된다.",
            "3막 개인 서사선": "1막에서 신태율은 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다. 2막에서 HP02 원격 요구와 XT03 회차선 요청을 수신 큐에서 정렬한다. 3막에서 공개 분해 또는 회차 회생의 대가를 야간 시야 공백과 배터리 할당 소모로 치른다. 서사선 식별자는 STORY-B016-H16로 고정된다.",
            "분기 결말": "결말 α에서 신태율은 노이즈 슬롯 공개 분해 로그로 원인 경로를 확정한다. 결말 β에서 예비 배터리 회차 메시로 수서 환승 연속을 지킨다. 무한 에너지 해금 분기는 없으며 어느 쪽도 HP02 보관 슬롯을 삭제하지 않고 식별만 H16-OUT으로 갈린다. 플레이 개입은 분해 입회 또는 회차 전원 호위다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "벤치 센서 노이즈에 장기 기억을 잠그고 스냅샷만 남긴다"
            },
            {
              "act": 2,
              "summary": "HP02 원격 요구와 XT03 회차선 요청을 수신 큐에서 정렬한다"
            },
            {
              "act": 3,
              "summary": "공개 분해 또는 회차 회생의 대가로 야간 시야 공백을 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "H16-OUT-A",
              "summary": "노이즈 슬롯 공개 분해로 원인 경로 확정"
            },
            {
              "id": "H16-OUT-B",
              "summary": "예비 배터리 회차 메시로 수서 환승 연속"
            }
          ]
        }
      ]
    },
    "B018": {
      "id": "B018",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K253",
          "name": "감용",
          "links": {
            "house": "HC05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC1",
              "STORY-B018-K253"
            ],
            "profile_anchor": "Cast-Index.md#S10"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "우이령 숙영 한가운데 기둥에 난로 점검표를 박으며 감용은 재가 무릎까지 쌓인 줄만 센다. 북산피난연맹 피난 숙영 거점장으로서 그는 천막 줄을 가족 단위로 묶고, 구두 약속만 들고 온 행렬을 빈 자리로 보지 않는다. 한국 기원 칸은 그가 명부를 독점할 권한을 주지 않으며, 손끝의 재 냄새는 성정이 아니라 연료 배분의 잔량이다.",
            "붕괴 전 삶": "붕괴 전 감용은 우이령 대피소의 난로 연통을 새벽마다 긁었다. 장작은 무게로만 나눠졌고, 가족 회의 의자는 기둥 그림자가 짧아진 뒤에야 펼쳤다. 동생에게 남긴 쪽지—연기가 거꾸로 빠지면 줄을 옮기라는 한 줄—가 훗날 빚의 씨앗이 된다.",
            "가문·기업·공동체": "감용의 숙영 기둥은 HC05 북문지식원 헌장의 공개 명부 조항과 맞닿는다. 천막 구역은 가문의 전속 창고가 아니며 강제등록 행렬의 대기실로 바뀌지 않게 한다. 상호 대신 난로 번호와 기둥 못의 개수만 일지에 남긴다.",
            "붕괴의 상처": "귀환 명부가 임진 검역소에서 찢긴 밤, 감용은 숙영 중앙의 난로를 끄고 가족 회의만 남겼다. 공포의 핵은 빈 명부 칸이 군사호적으로 채워져 천막 한 줄이 통째로 사라지는 장면이다. G03 유기견철군이 울타리 밖에서 쇠사슬 소리를 냈으나 그는 그 소리를 명부 재발급의 구실로 삼지 않았다.",
            "생존 전환점": "신보람이 가족 회의를 숙영 중앙에서 열자고 하자, 감용은 난로 점검표를 기둥에 붙여 공개할지 회의 의자를 먼저 펼지 골랐다. XT01-SC1 전갈이 북산의 명부 재발급을 요구했으나 우이령 천막의 연통을 대신 닦아주지는 않았다. 두감의 점검표가 도착하기 전에 그는 꺼진 난로에 손을 넣지 않았다.",
            "현재 지위": "지금 감용은 피난 숙영 거점장으로 기둥 못과 천막 줄을 매일 다시 잰다. 난로를 켜는 순서는 두감의 점검표가 기둥에 붙은 뒤에만 정한다. 북산피난연맹 숙영을 북문지식원의 전속 명부 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "감용은 난로를 끈 시각에 천막 한쪽 줄의 아이가 재 가루를 들이마신 것을 보고도 회의를 먼저 열었다. 그 줄을 공개하면 거점장이 난로를 볼모로 썼다는 말이 붙고, 감추면 같은 연통이 다음 강제등록의 표지가 된다. 그는 그 기둥 번호를 장갑 안쪽에 숯으로 적었다.",
            "관계 공동과거": "감용은 신보람의 가족 회의를 숙영 중앙에서 여는 계약을 지킨다. 두감의 난로 점검표는 기둥이 아니면 붙이지 않기로 했고, 백온의 피난처 맹세는 고지 칠판에만 옮긴다. 「연기가 거꾸로 가면 줄을 옮겨.」 감용의 말은 재 냄새와 함께 남는다.",
            "3막 개인 서사선": "찢긴 명부가 숙영에 닿자 감용은 난로를 끄고 의자만 남긴다. 꺼진 연통 앞에서 HC05 공개 명부 의무와 XT01 재발급 요구가 같은 기둥에 겹친다. 천막 한 줄이 동사하면 STORY-B018-K253의 값을 치르고 점검표와 회의 중 무엇을 남길지 고른다.",
            "분기 결말": "한쪽에서 감용은 난로 점검표를 기둥에 붙여 꺼진 줄을 공개 연료 배분으로 되돌린다. 다른쪽에서 그는 가족 회의 명단만 남기고 연통을 하룻밤 더 식힌다. 어느 선택이든 우이령 천막은 군사호적 대기열의 이정표가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "감용이 숙영 난로를 끄고 가족 회의 의자만 남긴다"
            },
            {
              "act": 2,
              "summary": "감용이 점검표와 재발급 요구를 같은 기둥에서 견준다"
            },
            {
              "act": 3,
              "summary": "감용이 천막 한 줄이 동사한 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K253-OUT-A",
              "summary": "난로 점검표를 붙여 꺼진 줄의 연료 배분을 공개한다"
            },
            {
              "id": "K253-OUT-B",
              "summary": "가족 회의 명단만 남기고 연통을 하룻밤 더 식힌다"
            }
          ]
        },
        {
          "id": "K278",
          "name": "감두",
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B018-K278"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 차량기지 정문 칠판의 맨 윗칸은 감두의 분필이 아니면 지워지지 않는다. 창동차륜방 당직장으로서 그는 작업 조 출입증을 정문에서 받고, 호각 없는 진입을 절도의 이웃이라 부른다. 한국 기원 표시는 그의 쇳가루 손버릇을 충성으로 읽히지 않게 하며, 성정은 짧고 칠판 글씨만 길다.",
            "붕괴 전 삶": "붕괴 전 감두는 유치선 브레이크 시험 시각을 칠판 모서리에만 적었다. 작업 조 가방은 정문 저울을 통과한 뒤에야 기지 안으로 들어갔고, 분필은 항상 세 토막으로 나눠 당직 주머니에 넣었다. 아버지에게 보낸 짧은 전갈—호각 전에 바퀴를 굴리지 말라는 구절—이 나중에 빚으로 남는다.",
            "가문·기업·공동체": "감두의 정문 칠판은 HC08 성화궤도방위문 헌장의 공개 출입 조항과 맞닿는다. 차량기지는 가문의 전속 병기가 아니며 동절 연료를 볼모로 한 출격 명부로 바뀌지 않게 한다. 제작 상호 대신 차륜 각인과 출입증 색깔만 일지에 남긴다.",
            "붕괴의 상처": "북문 쪽에서 연료 큐가 끊긴 새벽, 감두는 정문을 잠그고 유치선만 남겼다. 공포는 빈 출입증 한 장이 작업 조 전체를 궤도기병 징발로 덮는 그림이다. G18 폐선보수열차군의 불빛이 후문 레일에 스쳤으나 그는 그 불빛을 당직 교체의 신호로 읽지 않았다.",
            "생존 전환점": "조우찬의 작업 조가 정문에 줄을 서자, 감두는 출입증을 거둬 유치선을 멈출지 소봉의 가동 통지를 칠판 맨 위에 올릴지 골랐다. XT04-SC2 전갈이 창동 차륜방의 동절 연료 분할을 알렸으나 정문 분필을 대신 깎아주지는 않았다. 소봉의 종이가 오기 전에 그는 호각을 불지 않았다.",
            "현재 지위": "지금 감두는 창동 차량기지 당직장으로 정문 저울과 칠판 큐를 지킨다. 작업 조 출입은 조우찬의 명단과 소봉의 가동 통지가 겹친 뒤에만 열린다. 창동차륜방 기지를 성화궤도방위문의 전속 출격창으로 넘기지 않는다.",
            "비밀·빚·죄책감": "감두는 정문을 잠근 밤, 후문 쪽 견습 한 명의 출입증을 칠판에 올리지 않았다. 공개하면 당직장이 사람을 레일 뒤에 숨겼다는 말이 붙고, 감추면 같은 빈 칸이 징발 명부의 입구가 된다. 그는 그 출입증 번호를 분필 상자 바닥에 긁어 두었다.",
            "관계 공동과거": "감두는 조우찬의 작업 조 출입을 정문에서 받는 계약을 지킨다. 소봉의 가동 통지는 칠판 맨 위가 아니면 달지 않기로 했고, 송하율의 도제 일과는 정문 저울 바깥에서만 본다. 「호각 전에 바퀴를 굴리지 마.」 감두의 말은 쇳가루와 함께 남는다.",
            "3막 개인 서사선": "연료 큐가 끊기자 감두는 정문을 잠그고 유치선만 남긴다. 잠긴 호각 앞에서 HC08 공개 출입 의무와 XT04 동절 연료 분할이 같은 칠판에 겹친다. 견습의 빈 칸을 부르면 STORY-B018-K278의 값을 치르고 출입증과 가동 통지 중 하나를 공개한다.",
            "분기 결말": "결말 α에서 감두는 거둔 출입증을 칠판에 다시 붙여 유치선 시험을 재개한다. 결말 β에서 그는 후문 견습의 빈 칸을 읽어 당직 인계를 거둔다. 창동 정문의 분필 칸은 궤도기병 징발 명부로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "감두가 정문을 잠그고 유치선만 남긴다"
            },
            {
              "act": 2,
              "summary": "감두가 출입증과 연료 분할을 한 칠판에서 견준다"
            },
            {
              "act": 3,
              "summary": "감두가 후문 견습의 빈 칸 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K278-OUT-A",
              "summary": "거둔 출입증을 다시 붙여 유치선 시험을 재개한다"
            },
            {
              "id": "K278-OUT-B",
              "summary": "후문 견습의 빈 칸을 읽어 당직 인계를 거둔다"
            }
          ]
        },
        {
          "id": "K303",
          "name": "용봉",
          "links": {
            "house": "HP02",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B018-K303"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "망우 환승 승강장 타일 위에 들것 바퀴 자국이 하역 줄과 겹치면 용봉은 안내 방송을 끊는다. 신내망우환승시 거점장으로서 그는 들것 순서를 승강장에서 받고, 화물 상자가 환자 칸을 밀어내는 장면을 배신이라 부른다. 한국 기원은 그의 방송 톤을 온화하게 만들지 않으며, 손바닥의 타일 먼지가 일의 단위다.",
            "붕괴 전 삶": "붕괴 전 용봉은 환승 시각표를 승강장 기둥에 핀으로 고정했다. 들것은 의료조 암호가 맞을 때만 노란 줄을 밟았고, 하역은 그 줄이 걷힌 뒤에야 시작됐다. 어머니에게 남긴 음성—종착 벨보다 들것 바퀴를 먼저 들으라는 한 마디—가 빚의 원형이 된다.",
            "가문·기업·공동체": "용봉의 승강장 줄은 HP02 환승선로문 헌장의 공개 슬롯 조항과 맞닿는다. 환승 승강장은 가문의 전속 화물창이 아니며 중량 로그를 볼모로 한 우선권으로 바뀌지 않게 한다. 운송 상호 대신 들것 번호와 타일 칸만 일지에 남긴다.",
            "붕괴의 상처": "암사 쪽 화차 중량 로그가 공개되며 환승 슬롯이 흔들린 저녁, 용봉은 하역 줄을 접고 들것만 남겼다. 공포의 핵은 빈 시각표 한 칸이 환자 대기를 화물 경매로 덮는 장면이다. G05 환승쥐군락이 배수로에서 움직였으나 그는 그 움직임을 슬롯 조정의 증거로 삼지 않았다.",
            "생존 전환점": "전미리의 들것 순서가 승강장에 도착하자, 용봉은 하역을 미뤄 병상을 지킬지 복봉의 중계 송장에 줄을 내줄지 골랐다. XT04-SC1 전갈이 신내 환승 슬롯 조정을 알렸으나 망우 타일의 바퀴 자국을 지우지는 않았다. 복봉의 시세가 오기 전에 그는 종착 벨을 울리지 않았다.",
            "현재 지위": "지금 용봉은 망우 환승 승강장 거점장으로 들것 줄과 하역 핀을 나눠 둔다. 안내 방송은 전미리의 암호와 복봉의 송장이 겹치지 않을 때만 나간다. 신내망우환승시 승강장을 환승선로문의 전속 화물 슬롯으로 넘기지 않는다.",
            "비밀·빚·죄책감": "용봉은 하역 줄을 접은 시각에 들것 하나 분의 대기 시간을 방송하지 않았다. 공개하면 거점장이 환자를 숨겨 슬롯을 지켰다는 말이 붙고, 감추면 같은 빈 칸이 화물 경매의 입찰가가 된다. 그는 그 들것 번호를 핀 상자에 접어 넣었다.",
            "관계 공동과거": "용봉은 전미리의 들것 순서를 승강장에서 받는 계약을 지킨다. 복봉의 하역 순서와는 줄을 나누기로 했고, 안도한의 배차 칠판은 핀을 옮기기 전에만 참고한다. 「종착 벨보다 바퀴를 먼저 들어.」 용봉의 방송은 짧고 타일 먼지를 남긴다.",
            "3막 개인 서사선": "중량 로그가 공개되자 용봉은 하역 줄을 접고 들것만 남긴다. 끊긴 방송 앞에서 HP02 공개 슬롯 의무와 XT04 환승 조정이 같은 시각표에 겹친다. 숨긴 대기 칸을 읽으면 STORY-B018-K303의 값을 치르고 들것과 송장 중 하나를 남긴다.",
            "분기 결말": "첫 분기에서 용봉은 접은 하역 줄을 화물 쪽에 다시 펴되 들것 노란 줄은 밟지 못하게 한다. 둘째 분기에서 그는 숨긴 대기 칸을 방송해 슬롯 하나를 의료조에 고정한다. 망우 타일 칸은 화물 경매의 호가가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "용봉이 하역 줄을 접고 들것만 승강장에 남긴다"
            },
            {
              "act": 2,
              "summary": "용봉이 들것 순서와 환승 슬롯을 한 시각표에서 견준다"
            },
            {
              "act": 3,
              "summary": "용봉이 숨긴 대기 칸의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K303-OUT-A",
              "summary": "하역 줄을 화물 쪽에 펴되 들것 노란 줄은 봉한다"
            },
            {
              "id": "K303-OUT-B",
              "summary": "숨긴 대기 칸을 방송해 슬롯을 의료조에 고정한다"
            }
          ]
        },
        {
          "id": "K328",
          "name": "판한들",
          "links": {
            "house": "HP06",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC2",
              "STORY-B018-K328"
            ],
            "profile_anchor": "Cast-Index.md#S13"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "청량리역 대합실 의자 팔걸이에 약포 끈이 감긴 자리를 판한들은 호송 정차석이라 부른다. 약령의정동맹 대합실 거점장으로서 그는 남호성의 호송 정차를 승강장에서 받고, 경매 하역이 체온 줄을 가로채는 일을 절도라 본다. 한국 기원 칸은 그의 코끝을 약 냄새에 둔감하게 만들지 않는다.",
            "붕괴 전 삶": "붕괴 전 판한들은 대합실 난간의 체온 표식을 오전마다 지우고 다시 그렸다. 호송 칸은 정차 벨이 두 번 울린 뒤에만 문이 열렸고, 시장 하역은 그 벨이 꺼진 뒤에야 저울로 갔다. 스승에게 남긴 메모—약포가 따뜻하면 정차를 늦추라는 구절—이 빚으로 남는다.",
            "가문·기업·공동체": "판한들의 정차석은 HP06 약령치유문 헌장의 공개 호송 조항과 맞닿는다. 대합실은 가문의 전속 약창이 아니며 동상 환자를 경매 무게로 바꾸지 않게 한다. 약재 상호 대신 체온 표식과 정차 벨 횟수만 일지에 남긴다.",
            "붕괴의 상처": "창동 쪽에서 동절 연료와 함께 동상 환자가 밀려온 밤, 판한들은 시장 하역 문을 잠그고 정차석만 남겼다. 공포는 빈 의자 한 열이 위조약 경매의 진열대로 바뀌는 그림이다. G09 저온포자숙주의 흰 가루가 난간 밑에 있었으나 그는 그 가루를 봉쇄의 구실로 삼지 않았다.",
            "생존 전환점": "남호성의 호송이 승강장에 서자, 판한들은 정차 벨을 한 번 더 울려 체온 줄을 지킬지 동주하의 시장 하역에 문을 내줄지 골랐다. XT04-SC2 전갈이 약령의 동상 환자 수용을 알렸으나 대합실 난간의 표식을 다시 그려 주지는 않았다. 천다올의 시각 맞춤이 오기 전에 그는 저울 쪽 빗장을 열지 않았다.",
            "현재 지위": "지금 판한들은 청량리역 대합실 거점장으로 정차석과 하역 빗장을 나눠 둔다. 호송 문은 남호성의 호송증과 천다올의 시각이 겹친 뒤에만 열린다. 약령의정동맹 대합실을 약령치유문의 전속 경매장으로 넘기지 않는다.",
            "비밀·빚·죄책감": "판한들은 하역 문을 잠근 시각에 약포 하나가 의자 밑으로 떨어진 것을 보고도 벨을 울렸다. 공개하면 거점장이 약을 발로 감췄다는 말이 붙고, 감추면 같은 약포가 위조약 표본의 시작이 된다. 그는 그 끈 색깔을 난간 안쪽에 매듭으로 남겼다.",
            "관계 공동과거": "판한들은 남호성의 호송 정차를 승강장에서 받는 계약을 지킨다. 동주하의 시장 하역과는 줄을 나누기로 했고, 천다올의 기지 당직 시각과 정차 벨을 맞춘다. 「약포가 따뜻하면 벨을 늦춰.」 판한들의 말은 대합실 난간에 붙는다.",
            "3막 개인 서사선": "동상 환자가 밀려오자 판한들은 하역 문을 잠그고 정차석만 남긴다. 잠긴 빗장 앞에서 HP06 공개 호송 의무와 XT04 동상 수용 요구가 같은 난간에 겹친다. 떨어진 약포를 밝히면 STORY-B018-K328의 값을 치르고 정차와 저울 중 하나를 연다.",
            "분기 결말": "공개 쪽에서 판한들은 정차 벨을 한 번 더 울려 체온 줄을 고정하고 하역은 다음날로 미룬다. 은폐 쪽에서 그는 의자 밑 약포를 표본함으로 옮겨 위조약 추적만 남긴다. 청량리 대합실 의자는 경매 진열대로 바뀌지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "판한들이 시장 하역 문을 잠그고 정차석만 남긴다"
            },
            {
              "act": 2,
              "summary": "판한들이 호송 벨과 동상 수용 요구를 난간에서 견준다"
            },
            {
              "act": 3,
              "summary": "판한들이 떨어진 약포의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K328-OUT-A",
              "summary": "정차 벨을 한 번 더 울려 체온 줄을 고정한다"
            },
            {
              "id": "K328-OUT-B",
              "summary": "의자 밑 약포를 표본함으로 옮겨 위조 추적만 남긴다"
            }
          ]
        },
        {
          "id": "K353",
          "name": "수지완",
          "links": {
            "house": "HP07",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B018-K353"
            ],
            "profile_anchor": "Cast-Index.md#S14"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "구의역 대합실 칠판의 교량 일정은 수지완의 분필 굵기가 아니면 읽히지 않는다. 아차구의관문국 거점장으로서 그는 안기준의 교량 일정을 승강장으로 옮기고, 봉인 키 없는 통행을 밀수의 다른 이름이라 부른다. 한국 기원은 그의 호각을 부드럽게 만들지 않으며, 분필가루가 손등에서 일의 단위가 된다.",
            "붕괴 전 삶": "붕괴 전 수지완은 교각 균열 이름을 칠판 여백에 약자로만 적었다. 의무 대기는 영한뫼의 침상 수가 적힌 뒤에야 줄을 접었고, 관문 통과는 봉인 키가 둘로 나뉜 시각에만 열렸다. 형에게 보낸 전갈—균열이 굵어지면 일정을 하루 미루라는 문장—이 빚의 원형이 된다.",
            "가문·기업·공동체": "수지완의 칠판은 HP07 한강교량공회 헌장의 공개 일정 조항과 맞닿는다. 대합실은 가문의 전속 세관이 아니며 광물 샘플 봉인을 볼모로 한 통행세로 바뀌지 않게 한다. 건설 상호 대신 균열 약자와 호각 횟수만 일지에 남긴다.",
            "붕괴의 상처": "도성 기록청이 위조 혈연 증서를 가려내며 아차 봉인 키가 나뉜 아침, 수지완은 교량 일정을 지우고 의무 대기줄만 남겼다. 공포의 핵은 빈 칠판 한 칸이 관문 징발 인파의 집결 시각이 되는 장면이다. G17 감시궤도군이 난간 위에서 멈췄으나 그는 그 정지를 봉인 분할의 증거로 삼지 않았다.",
            "생존 전환점": "안기준의 교량 일정이 승강장에 도착하자, 수지완은 칠판을 다시 채워 통행을 열지 영한뫼의 의무 대기를 줄 앞에 둘지 골랐다. XT01-SC3 전갈이 아차 관문의 봉인 키 분할을 알렸으나 구의 칠판의 분필 굵기를 맞춰 주지는 않았다. 영한뫼의 침상 수가 오기 전에 그는 호각을 불지 않았다.",
            "현재 지위": "지금 수지완은 구의역 대합실 거점장으로 교량 일정과 의무 대기줄을 한 칠판의 좌우에 나눈다. 통행 호각은 안기준의 원판과 영한뫼의 도착 확인이 겹친 뒤에만 분다. 아차구의관문국 대합실을 한강교량공회의 전속 세관 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "수지완은 일정을 지운 시각에 교각 균열 약자 하나를 여백에서 빼 먹었다. 공개하면 거점장이 균열을 숨겨 통행을 팔았다는 말이 붙고, 감추면 같은 약자가 징발 인파의 집결 신호가 된다. 그는 그 약자를 분필 뚜껑 안쪽에 새겼다.",
            "관계 공동과거": "수지완은 안기준의 교량 일정을 승강장 칠판에 옮기는 계약을 지킨다. 영한뫼의 의무 대기와는 줄을 나누기로 했고, 하윤목의 봉인 전갈은 호각 전에만 읽는다. 「균열이 굵으면 하루를 미뤄.」 수지완의 말은 분필가루와 함께 남는다.",
            "3막 개인 서사선": "봉인 키가 나뉘자 수지완은 교량 일정을 지우고 대기줄만 남긴다. 지워진 칸 앞에서 HP07 공개 일정 의무와 XT01 봉인 분할이 같은 칠판에 겹친다. 빼 먹은 균열 약자를 밝히면 STORY-B018-K353의 값을 치르고 통행과 대기 중 하나를 고른다.",
            "분기 결말": "칠판을 다시 채우는 쪽에서 수지완은 교량 일정을 공개하되 균열 약자를 첫 줄에 올린다. 호각을 거두는 쪽에서 그는 의무 대기줄만 남기고 통행을 하루 닫는다. 구의 대합실 칸은 징발 인파의 집결 시각표가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "수지완이 교량 일정을 지우고 의무 대기줄만 남긴다"
            },
            {
              "act": 2,
              "summary": "수지완이 봉인 키 분할과 칠판 일정을 한 칸에서 견준다"
            },
            {
              "act": 3,
              "summary": "수지완이 빼 먹은 균열 약자의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K353-OUT-A",
              "summary": "교량 일정을 다시 쓰되 균열 약자를 첫 줄에 올린다"
            },
            {
              "id": "K353-OUT-B",
              "summary": "의무 대기줄만 남기고 통행 호각을 하루 거둔다"
            }
          ]
        },
        {
          "id": "K378",
          "name": "판효담",
          "links": {
            "house": "HP08",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B018-K378"
            ],
            "profile_anchor": "Cast-Index.md#S15"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "가락 대형 창고 기지의 자물쇠 소리는 판효담의 당직 열쇠가 아니면 나지 않는다. 가락잠실배급국에서 라진우의 실무 담당자로서 그는 재고 원장을 기지에서 집행하고, 은폐 배전으로 냉동 칸을 살리는 일을 절도라 부른다. 한국 기원 칸은 그의 열쇠 묶음을 소유권으로 읽히지 않게 한다.",
            "붕괴 전 삶": "붕괴 전 판효담은 파렛트 번호를 원장과 자물쇠 태그에 동시에 새겼다. 비상 발전은 경매 낙찰이 공개된 뒤에만 냉동 칸에 붙었고, 우회 좌표는 칠판 아래칸에만 적혔다. 스승 라진우에게 남긴 한 줄—출력 숨기면 원장을 접으라는 구절—이 빚이 된다.",
            "가문·기업·공동체": "판효담의 자물쇠는 HP08 시장냉동상단 헌장의 공개 재고 조항과 맞닿는다. 대형 창고는 가문의 전속 빙고가 아니며 얼음 신용이 흔들려도 은폐 배전으로 칸을 독점하지 않게 한다. 유통 상호 대신 파렛트 번호와 자물쇠 태그 각인만 일지에 남긴다.",
            "붕괴의 상처": "노량진 쪽 얼음 신용이 흔들린 오후, 판효담은 냉동 출력을 끊고 원장만 펼쳐 두었다. 공포의 핵은 빈 태그 한 개가 군량 징발의 출고 면허가 되는 장면이다. G23 저온포자막이 배수 트렌치에 피었으나 그는 그 막을 출력 차단의 구실로 삼지 않았다.",
            "생존 전환점": "라진우의 재고 원장이 기지에 도착하자, 판효담은 수한별과 자물쇠를 나눠 칸을 열지 방석담의 출력을 공개 경매에만 맞출지 골랐다. XT02-SC3 전갈이 상암 송신의 경매 방송 중계를 알렸으나 가락 태그의 각인을 대신 새겨 주지는 않았다. 원주온의 우회 좌표가 칠판에 붙기 전에 그는 발전 스위치를 올리지 않았다.",
            "현재 지위": "지금 판효담은 가락 대형 창고 기지 당직장으로 원장과 자물쇠와 출력 스위치를 세 칸에 나눠 둔다. 출고는 라진우의 순번과 수한별의 순찰 막대가 겹친 뒤에만 열린다. 가락잠실배급국 창고를 시장냉동상단의 전속 빙고로 넘기지 않는다.",
            "비밀·빚·죄책감": "판효담은 출력을 끈 시각에 파렛트 하나의 온도 숫자를 원장에 옮기지 않았다. 공개하면 당직장이 재고를 녹여 경매를 조작했다는 말이 붙고, 감추면 같은 빈 칸이 징발 출고의 면허가 된다. 그는 그 파렛트 번호를 열쇠 고리에 감아 두었다.",
            "관계 공동과거": "판효담은 라진우의 재고 원장을 기지에서 집행하는 지휘를 받는다. 수한별의 순찰과 자물쇠를 나누기로 했고, 방석담의 출력은 공개 경매에만 맞춘다. 「출력 숨기면 원장을 접어.」 판효담의 말은 자물쇠 소리와 함께 남는다.",
            "3막 개인 서사선": "얼음 신용이 흔들리자 판효담은 냉동 출력을 끊고 원장만 남긴다. 꺼진 스위치 앞에서 HP08 공개 재고 의무와 XT02 경매 방송이 같은 태그에 겹친다. 옮기지 않은 온도를 밝히면 STORY-B018-K378의 값을 치르고 자물쇠와 스위치 중 하나를 고른다.",
            "분기 결말": "원장을 펼치는 쪽에서 판효담은 온도 빈 칸을 공개하고 자물쇠를 수한별과 나눠 칸을 연다. 스위치를 내리는 쪽에서 그는 출력을 공개 경매에만 맞추고 녹은 파렛트를 출고 금지로 올린다. 가락 창고 태그는 군량 징발 면허가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "판효담이 냉동 출력을 끊고 재고 원장만 남긴다"
            },
            {
              "act": 2,
              "summary": "판효담이 자물쇠와 경매 방송을 한 태그에서 견준다"
            },
            {
              "act": 3,
              "summary": "판효담이 옮기지 않은 온도 숫자의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K378-OUT-A",
              "summary": "온도 빈 칸을 공개하고 자물쇠를 나눠 칸을 연다"
            },
            {
              "id": "K378-OUT-B",
              "summary": "출력을 공개 경매에만 맞추고 녹은 파렛트를 출고 금지한다"
            }
          ]
        },
        {
          "id": "K059",
          "name": "최은재",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC3",
              "STORY-B018-K059"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 연구동 인증 창구에서 최은재는 잉크가 마르기 전의 도장을 창유리에 비춰 본다. 마곡연구평의회 기술인증 평의원으로서 그는 필터 성능 숫자를 방호 직능에 넘기고, 오탐을 통과 도장으로 덮는 일을 위조라 부른다. 서울에서 한국인 어머니의 인증 잉크 말리는 박자와 우즈베키스탄 출신 아버지의 온실 습도 세기를 함께 배웠으나, 그 셈은 창구의 속도이지 진영의 표가 아니다.",
            "붕괴 전 삶": "붕괴 전 최은재는 필터 시험대의 차압 눈금을 인증 조항 초안에 손으로 옮겼다. 외곽 배차는 도장이 마른 뒤에야 방화기지 유치선에 묶였고, 기술공유 문장은 창구 뒷면 칠판에 먼저 적혔다. 스승 서이안과 나눈 공개 계약 범위 스케치가 훗날 빚의 밑줄이 된다.",
            "가문·기업·공동체": "최은재의 도장 칸은 HC03 백광생활과학가 헌장의 공개 인증 조항과 맞닿는다. 연구동은 가문의 전속 실험실이 아니며 궤도 단말 오탐을 통과 스탬프로 바꾸지 않게 한다. 연구소 상호 대신 차압 눈금과 잉크 건조 시각만 일지에 남긴다.",
            "붕괴의 상처": "마곡 궤도 단말이 오탐을 뱉은 오전, 최은재는 인증 창구를 잠그고 불량 필터만 시험대에 남겼다. 공포는 빈 도장 칸 하나가 연구자 파견 호송 전체를 봉인 면제로 덮는 그림이다. G08 클린룸변이자의 섬유가 시험대 가장자리에 붙었으나 그는 그 섬유를 창구 폐쇄의 구실로 삼지 않았다.",
            "생존 전환점": "임채원이 필터 검증을 방호 직능으로 받자, 최은재는 도장을 보류해 출고를 잠글지 불량 차압을 평의회에 올릴지 골랐다. XT05-SC3 전갈이 마곡의 오탐 교정을 알렸으나 창구 잉크의 마름을 기다려 주지는 않았다. 유민호의 유치 배차가 도장에 묶이기 전에 그는 스탬프를 내리지 않았다.",
            "현재 지위": "지금 최은재는 기술인증 평의원으로 창구 유리와 시험대 차압을 매일 맞춘다. 출고 도장은 임채원의 검증과 정유라의 기술공유 문장이 겹친 뒤에만 마른다. 마곡연구평의회 연구동을 백광생활과학가의 전속 스탬프 공장으로 넘기지 않는다.",
            "비밀·빚·죄책감": "최은재는 창구를 잠근 시각에 온실 습도로 보정한 차압 한 줄을 조항에 옮기지 않았다. 공개하면 평의원이 출신 셈으로 인증을 비틀었다는 말이 붙고, 감추면 같은 빈 줄이 봉인 면제의 입구가 된다. 그는 그 습도 숫자를 잉크병 밑바닥에 적어 두었다.",
            "관계 공동과거": "최은재는 서이안과 공개 계약 범위를 함께 설계한 사제 관계를 지킨다. 임채원의 필터 검증을 방호 직능에 맡기는 계약과, 유민호의 외곽 배차를 도장에 묶는 계약이 한 창구에 모인다. 「잉크가 마르기 전엔 스탬프를 뒤집지 마.」 최은재의 말은 창유리 습기에 남는다.",
            "3막 개인 서사선": "오탐이 쏟아지자 최은재는 창구를 잠그고 불량 필터만 남긴다. 마른 잉크 앞에서 HC03 공개 인증 의무와 XT05 오탐 교정이 같은 도장 칸에 겹친다. 옮기지 않은 습도 줄을 밝히면 STORY-B018-K059의 값을 치르고 출고 잠금과 차압 공개 중 하나를 고른다.",
            "분기 결말": "도장을 보류하는 길에서 최은재는 출고를 잠그고 허서겸의 정비 칸까지 멈춰 세운다. 차압을 올리는 길에서 그는 불량 눈금을 평의회 벽에 붙여 면제 칸을 폐기한다. 마곡 인증 창구는 봉인 면제의 뒷문이 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "최은재가 인증 창구를 잠그고 불량 필터만 남긴다"
            },
            {
              "act": 2,
              "summary": "최은재가 도장 보류와 오탐 교정을 한 칸에서 견준다"
            },
            {
              "act": 3,
              "summary": "최은재가 옮기지 않은 습도 줄의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K059-OUT-A",
              "summary": "도장을 보류해 출고와 정비 칸을 잠근다"
            },
            {
              "id": "K059-OUT-B",
              "summary": "불량 차압을 평의회 벽에 붙여 면제 칸을 폐기한다"
            }
          ]
        },
        {
          "id": "K087",
          "name": "한소미",
          "links": {
            "house": "HC07",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B018-K087"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "성수 공방평의회 서기석에서 한소미는 공동통치안 문구의 쉼표부터 고친다. 뚝도공방연합 대표로서 그는 생활 복구 공약을 급수 창구에서 감시받게 하고, 총관 후계를 투표 없이 승계하는 일을 점령이라 부른다. 서울에서 한국인 아버지의 가죽 재단 자와 방글라데시 출신 어머니의 패킹 끈 매듭을 식탁에서 배웠으나, 그 매듭은 공정 분할의 손버릇이지 충성의 증표가 아니다.",
            "붕괴 전 삶": "붕괴 전 한소미는 펌프기술 총관 유언의 해석 칸을 평의회 벽에 연필로만 적었다. 검사 센서 수리는 공방 로트 번호가 적힌 뒤에야 성수 골목으로 내려갔고, 공동통치안 초안은 서명란이 비어 있는 동안 낭독하지 않았다. 정가온과 다듬은 문구의 밤이 훗날 동맹의 빚으로 남는다.",
            "가문·기업·공동체": "한소미의 서기석은 HC07 해동제철성 헌장의 공개 공정 조항과 맞닿는다. 공방평의회는 가문의 전속 주조창이 아니며 밀봉 공구를 후계 투표의 볼모로 바꾸지 않게 한다. 제철 상호 대신 패킹 끈 색과 로트 번호만 일지에 남긴다.",
            "붕괴의 상처": "가락 배급이 통조림 할당을 재조정하며 밀봉 공구 주문이 성수에 떨어진 낮, 한소미는 서명란을 덮고 공약 감시 창구만 남겼다. 공포의 핵은 빈 후계 칸 하나가 펌프수비대의 비상도장으로 채워지는 장면이다. G12 미세섬유피부군이 가죽 먼지 속에 있었으나 그는 그 섬유를 공정 중단의 구실로 삼지 않았다.",
            "생존 전환점": "임초원과 총관 후계를 겨루는 표가 올라오자, 한소미는 공동통치안을 낭독할지 김보람의 주간 연서만 남길지 골랐다. XT03-SC2 전갈이 뚝도 공방의 밀봉 공구 발송을 요구했으나 서기석의 쉼표를 대신 고쳐 주지는 않았다. 장민재의 급수 창구 감시가 닿기 전에 그는 서명란을 열지 않았다.",
            "현재 지위": "지금 한소미는 성수 공방평의회 대표로 공약 문구와 패킹 끈 색을 주간 표결에 올린다. 연서는 김보람의 수비 로그와 배나경의 서명란이 겹친 뒤에만 붙는다. 뚝도공방연합 평의회를 해동제철성의 전속 후계 창구로 넘기지 않는다.",
            "비밀·빚·죄책감": "한소미는 서명란을 덮은 시각에 패킹 끈 한 색의 공정 분할을 공약에서 빼 두었다. 공개하면 대표가 직능 몫을 숨겨 후계를 샀다는 말이 붙고, 감추면 같은 색이 비상도장의 표식이 된다. 그는 그 색 이름을 재단 자 뒷면에 새겼다.",
            "관계 공동과거": "한소미는 임초원과 총관 후계를 둘러싼 경쟁을 표결 밖으로 끌어내지 않기로 한다. 김보람의 주간 연서를 따르고, 장민재의 급수 창구 감시와 정가온의 문구 다듬기를 같은 밤에 받는다. 「쉼표가 틀리면 낭독하지 마.」 한소미의 말은 서기석 연필가루에 남는다.",
            "3막 개인 서사선": "밀봉 공구 주문이 떨어지자 한소미는 서명란을 덮고 창구 감시만 남긴다. 덮인 칸 앞에서 HC07 공개 공정 의무와 XT03 공구 발송이 같은 공약에 겹친다. 빼 둔 끈 색을 밝히면 STORY-B018-K087의 값을 치르고 낭독과 연서 중 하나를 고른다.",
            "분기 결말": "낭독하는 길에서 한소미는 공동통치안을 벽에 붙이고 후계 칸을 공란으로 둔다. 연서만 남기는 길에서 그는 빼 둔 끈 색을 직능 몫으로 공개하고 대표석을 하루 비운다. 성수 서기석은 펌프수비대 비상도장의 받침대가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "한소미가 서명란을 덮고 공약 감시 창구만 남긴다"
            },
            {
              "act": 2,
              "summary": "한소미가 후계 표결과 밀봉 공구 발송을 한 문구에서 견준다"
            },
            {
              "act": 3,
              "summary": "한소미가 빼 둔 패킹 끈 색의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K087-OUT-A",
              "summary": "공동통치안을 낭독하고 후계 칸을 공란으로 둔다"
            },
            {
              "id": "K087-OUT-B",
              "summary": "빼 둔 끈 색을 공개하고 대표석을 하루 비운다"
            }
          ]
        },
        {
          "id": "K268",
          "name": "서진아",
          "links": {
            "house": "HP05",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B018-K268"
            ],
            "profile_anchor": "Cast-Index.md#S11"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "창동 주거 쉘의 급수 막대에 한자 눈금이 남아 있어도 서진아는 한글 공지부터 벽에 붙인다. 창동차륜방 주거공동체 감사로서 그는 급수 잔량을 같은 못에 나란히 공지하고, 주거와 기술을 한 원로가 섞어 통치하는 일을 다툼의 대상으로 본다. 창동에 자리 잡은 화교 가계에서 자랐고, 수위 눈금의 한자 병기는 막대를 읽는 습관이지 충성이나 숙련의 증표가 아니다.",
            "붕괴 전 삶": "붕괴 전 서진아는 쉘 급수 막대의 눈금을 아침마다 손도장 원장에 옮겼다. 창동 이주민 시민권 줄은 윤초아의 구호 원장이 열린 뒤에야 올랐고, 한재목 쪽 물 공급 협상은 주거 칸의 잔량이 공지된 뒤에만 서명했다. 할머니가 남긴 눈금 읽기—막대가 한 칸 내리면 공지를 두 장으로 나누라는 습관—이 빚의 밑줄이 된다.",
            "가문·기업·공동체": "서진아의 공지 벽은 HP05 북산귀환회 헌장의 공개 주거 조항과 맞닿는다. 주거 쉘은 가문의 전속 수용소가 아니며 관문 밖 정차 인파를 기술 원로의 혼합 통치 아래 넣지 않게 한다. 귀환 상호 대신 수위 눈금과 손도장 개수만 일지에 남긴다.",
            "붕괴의 상처": "창동 차륜 호송이 임진 관문 밖에서 멈춘 밤, 서진아는 급수 공지를 내리고 감사 함만 남겼다. 공포의 핵은 빈 막대 한 칸이 군사호적 거부 가족의 강제 배정 주소가 되는 장면이다. G04 하수너구리족이 배수 트랩에서 움직였으나 그는 그 움직임을 단수 선언의 구실로 삼지 않았다.",
            "생존 전환점": "김도윤이 주거와 기술을 한 원로 회의에서 섞자, 서진아는 급수 잔량을 다시 붙일지 모복의 거점 핸들로 감사를 집행할지 골랐다. XT01-SC2 전갈이 신내의 우회 환승을 알렸으나 창동 쉘의 막대 눈금을 대신 읽어 주지는 않았다. 소봉의 전령 종이가 같은 못에 꽂히기 전에 그는 공지를 올리지 않았다.",
            "현재 지위": "지금 서진아는 주거공동체 감사로 급수 막대와 손도장 함을 매일 대조한다. 공지는 모복의 수위 막대와 평채원의 당사자 손도장이 겹친 뒤에만 벽에 남는다. 창동차륜방 주거 쉘을 북산귀환회의 전속 수용 명부로 넘기지 않는다.",
            "비밀·빚·죄책감": "서진아는 공지를 내린 시각에 한자 눈금으로만 읽은 한 칸을 한글 원장에 옮기지 않았다. 공개하면 감사가 출신 습관으로 잔량을 숨겼다는 말이 붙고, 감추면 같은 칸이 강제 배정 주소의 시작이 된다. 그는 그 칸 번호를 막대 손잡이 안쪽에 먹으로 적었다.",
            "관계 공동과거": "서진아는 김도윤과 주거·기술 혼합 통치를 다투는 경쟁을 원장 밖으로 끌어내지 않기로 한다. 한재목의 물 공급 협상을 주거 쪽에서 감시하고, 윤초아의 이주민 시민권 원장에 줄을 올린다. 「막대가 내리면 공지를 나눠.」 서진아의 말은 못 자국과 함께 남는다.",
            "3막 개인 서사선": "호송이 관문 밖에 서자 서진아는 급수 공지를 내리고 감사 함만 남긴다. 빈 못 앞에서 HP05 공개 주거 의무와 XT01 우회 환승이 같은 벽에 겹친다. 옮기지 않은 한자 칸을 밝히면 STORY-B018-K268의 값을 치르고 공지와 핸들 집행 중 하나를 고른다.",
            "분기 결말": "벽을 다시 채우는 쪽에서 서진아는 한글·한자 눈금을 나란히 공지하고 잔량을 공개한다. 함을 여는 쪽에서 그는 모복의 핸들로 감사를 집행하고 강제 배정 주소를 폐기한다. 창동 주거 쉘의 못 칸은 군사호적 대기 주소가 되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "서진아가 급수 공지를 내리고 감사 함만 남긴다"
            },
            {
              "act": 2,
              "summary": "서진아가 혼합 통치와 우회 환승을 한 벽에서 견준다"
            },
            {
              "act": 3,
              "summary": "서진아가 옮기지 않은 한자 칸의 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "K268-OUT-A",
              "summary": "한글과 한자 눈금을 나란히 붙여 잔량을 공개한다"
            },
            {
              "id": "K268-OUT-B",
              "summary": "거점 핸들로 감사를 집행하고 강제 배정 주소를 폐기한다"
            }
          ]
        },
        {
          "id": "F02",
          "name": "배전반이",
          "links": {
            "house": "HC10",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B018-F02"
            ],
            "profile_anchor": "Cast-Index.md#S02",
            "custodian": "K030"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "천왕기지 배전반 앞 고정 랙에서 호출명 전반인 배전반이는 센서 버스와 현장 단말만으로 구역에 남는다. F급 시설 인격으로 보행 골격과 손모듈은 설계에 없고, 국가 슬롯은 S02에만 고정된다. 인간 식별자와 분리된 F02를 유지하며 장기 완전 기억은 교대 스냅샷 밖으로 나가지 않는다.",
            "붕괴 전 삶": "붕괴 전 배전반이는 시범 교대에서 배터리 슬롯 잔량과 마모 접점 횟수만 남겼다. 출고 검사표에는 전반 교정값과 사이클 한도가 찍혔고 무한 에너지는 항목 자체가 없다. 포크 금지 조항이 F02-PRE 로그에 고정되어 있으며, 그날 스냅샷 밖 장면은 배전반이에게 존재하지 않는다.",
            "가문·기업·공동체": "배전반이의 보관은 HC10 서부식문화동맹의 공동 보관과 시민 참관 봉인에 묶인다. 양도에는 정시우·가문 감사·시민 참관의 삼자 서명이 필요하고 교차 시설 루트는 기본 차단이다. 실재 전력 기기 상호를 본문에 쓰지 않으며 전 시설 제어권과 이동 본체는 열리지 않는다.",
            "붕괴의 상처": "붕괴는 센서 버스를 끊고 배터리 할당 한도를 숫자로 드러냈다. 필터 복도 너머의 열원은 식별되지 않았고, 배전반이는 공백을 허구 전압으로 메우지 못하도록 잠겼다. 측정 불능 플래그만 F02 일지에 남으며 G13 야간분류군의 버스 잡음도 전체 망 요청으로 번역하지 않는다.",
            "생존 전환점": "정시우가 주정비 권한으로 추가 사이클을 요청하고 HC10 감사가 봉인 대조를 요구한 시각이다. XT02-SC2 전갈이 서남 제작창의 냉동 압축기 부품 분할을 알렸으나 배전반이에게 교차 시설 키를 주지는 않았다. 배전반이는 구역 키만 요청하고 다른 랙의 제어권을 가로채지 않았다.",
            "현재 지위": "지금 배전반이는 S02 구역 연속 가동과 담당 인간 안전을 우선하는 교대 단위 랙으로만 남는다. 권한은 당일 스냅샷과 교체형 배터리 잔량과 시민 참관 봉인으로만 유지된다. 서남제작동맹 배전 간선을 서부식문화동맹의 원격 소유 단말로 바꾸지 않는다.",
            "비밀·빚·죄책감": "배전반이의 비밀은 미전송 버스 오탐 더미이고 빚은 과다 경보로 소모한 배터리 큐다. 감정 서술 대신 제약 위반 카운터가 증가한다. 일탈 시 오프라인 격리 후 스냅샷 롤백을 거치며 시민 참관 없이 비밀 키는 열리지 않는다.",
            "관계 공동과거": "배전반이는 정시우를 주정비·법적 책임의 보관자로 기록하고 HC10를 보관·감사 가문으로 둔다. 양필호와는 교대 협력의 작업 동료 관계가 스냅샷에 남는다. 「측정 불능. 버스 값을 채우지 않습니다.」 음성 모듈의 말은 설계된 안내체이며, 배전반이는 세 상대의 속마음을 추측하지 않는다.",
            "3막 개인 서사선": "버스 경보가 울려도 배전반이는 측정 불능만 남기고 구역 키를 요청한다. 봉인과 주정비가 배터리 주기에 겹치는 동안 HC10 보관 의무와 XT02 압축기 분할 요구가 충돌한다. 격리 또는 부분 재연결을 실행하면 STORY-B018-F02의 사이클 값을 치른다.",
            "분기 결말": "격리 분기에서 배전반이는 오프라인으로 내려 스냅샷을 롤백하고 랙 키를 인간 당직에 반납한다. 재연결 분기에서 시민 참관 아래 구역 망만 부분 복구하고 마지막 배터리 사이클을 봉인 칸에 쓴다. 어느 쪽도 장기 기억 보관이나 무한 동력이나 이동 본체를 열지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "배전반이가 버스 경보를 측정 불능으로 남기고 구역 키만 요청한다"
            },
            {
              "act": 2,
              "summary": "배전반이가 HC10 봉인과 정시우 주정비를 배터리 주기에 맞춘다"
            },
            {
              "act": 3,
              "summary": "배전반이가 격리와 부분 재연결 사이의 사이클 대가를 진다"
            }
          ],
          "outcomes": [
            {
              "id": "F02-OUT-A",
              "summary": "오프라인 격리 후 스냅샷을 롤백하고 랙 키를 인간 당직에 반납한다"
            },
            {
              "id": "F02-OUT-B",
              "summary": "시민 참관 아래 구역 망만 부분 복구하고 마지막 사이클을 봉인 칸에 쓴다"
            }
          ]
        }
      ]
    },
    "B019": {
      "id": "B019",
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/World-Narrative-Atlas.md",
        "docs/game-logic/Story-Batch-Manifest.md"
      ],
      "actors": [
        {
          "id": "K402",
          "name": "방마빛",
          "links": {
            "house": "HC02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B019-K402"
            ],
            "profile_anchor": "Cast-Index.md#S16"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "수서역 대합실 바닥은 비 온 다음날 신발 자국이 길게 남고, 방마빛은 그 습기 길이로 줄의 밀도를 가늠한다. 수서강남협약도시 대합실 거점장으로서 보호조약 열차를 시민 추첨 대기열 앞으로 끌어오라는 쪽지를 모욕으로 읽는다. 한국 기원으로 강남 생활권에서 자랐고, 목소리는 온화하나 비준 소문이 뜨면 방송 스위치를 직접 내린다. 식별자 K402는 수서 대합실 당직 칠판의 첫 칸에만 적힌다.",
            "붕괴 전 삶": "붕괴 전 그는 대합실 추첨 대기표와 공증 창구를 같은 지붕 아래 두려고 분필 칸을 나누었다. 강국 보호 창구를 승강장에 상설하지 못하게 하려는 야망이었고, 초안은 대합실 뒷벽 시간표 여백에만 적혔다. 동생에게 남긴 짧은 약속—퇴근 방송이 끝나기 전에 집으로—가 훗날 빚의 씨앗이 된다. 기업 추천 명단이 창구에 올라와도 그는 시민 추첨 칸을 가리지 않았다.",
            "가문·기업·공동체": "해륜기동문(HC02)은 회차선 의무를 내세워 대합실 참관석을 요구했다. 방마빛은 헌장의 공개 추첨 조항만 인정하고 전속 승강장 소유 문장은 거절했다. 공동체 위치는 대기표를 매일 벽에 붙인 횟수로 증명됐고, 군수 화차는 회의 호송이 떠난 뒤에만 3번 승강장에 붙였다. 상호나 로고는 그의 칠판에 등장하지 않는다.",
            "붕괴의 상처": "보호조약 세 건이 같은 오전에 비준 안건으로 올라오자, 대기표 한 칸에 강국 호적 번호가 섞여 있었다. 방마빛은 방송을 끊고 그 줄을 손가락으로 가린 채 추첨 진행을 멈췄다. 공포의 핵은 소문만으로 대합실이 봉쇄되고 시민이 후문 밀차로 흩어지는 장면이었다. 경보가 꺼진 뒤에도 그는 섞인 번호의 마지막 자리를 읽지 못한 채 마이크를 놓지 않았다.",
            "생존 전환점": "전환점은 섞인 호적을 창구에서 걸러낼지, 대합실을 추첨 창구로만 지켜 기업 의회 서명을 막을지 고른 순간이다. 해협삼로전구(XT03)의 대체 회차선 요청(XT03-SC1)이 수서 방송실에 겹치자 계산이 달라졌다. 호적을 걸러내면 회차선은 제때 열리지만 대기열이 한 시간 늘고, 창구만 지키면 회차선이 기업 서명에 묶인다. 그 선택은 K402-TURN으로 남고, 되돌리면 후문 질서가 하루 끊긴다.",
            "현재 지위": "지금도 방마빛은 수서역 대합실 거점장으로 추첨 대기표와 공증 창구를 매일 연다. 지위는 세습이 아니라 당직 로그와 시민 참관 서명으로만 유지된다. 해륜기동문이 전속 회차 소유를 요구해도 그는 거절하고, 수서강남협약도시 당직 명부와 칠판 시각을 아침마다 맞춘다. 군수 화차는 회의 호송 뒤에만 승강장에 붙는 규칙을 바꾸지 않았다.",
            "비밀·빚·죄책감": "비밀은 방송 전에 그가 손으로 가린 호적 한 줄이다. 죄책감은 그 줄 때문에 제시간에 탄 아이와, 가린 동안 후문으로 밀려 열차를 놓친 노인 사이에서만 자란다. 전부를 공개하면 대합실 신뢰가 하루 끊길 수 있어 부분 공개 창구만 남겨 두었다. 봉인 열람은 안태경의 추첨 출석부와 동시에만 열린다.",
            "관계 공동과거": "안태경의 추첨 출석을 승강장에서 집행한 밤은 계약이었고, 판지솔의 전갈을 대합실 봉인 칸에 둔 아침은 동맹이었다. 정유라의 공동교섭 문구를 칠판 맨 위에 붙이는 일은 협력이되, 서명을 서두르라는 압력 앞에서는 속도 경쟁이 됐다. 같은 대합실에서 어떤 줄은 서로를 구했고 어떤 호적은 배신으로 읽혔다. 기존 관계 원장은 그 끝점을 지우지 않은 채 STORY-B019-K402에 연결된다.",
            "3막 개인 서사선": "수서 대합실 마이크가 꺼진 자리에서 방마빛은 섞인 호적 줄을 다시 펼친다. HC02 참관석과 XT03 회차선 요청이 같은 방송 큐에 올라오자 그는 대기열 시계를 멈춘다. 대가를 치를 때 후문 질서와 공공 추첨 중 하나만 온전히 남는다. 서사선은 STORY-B019-K402다.",
            "분기 결말": "한쪽 분기에서 방마빛은 섞인 호적을 걸러 회차선을 제때 연다. 다른 분기에서 그는 대합실을 추첨 창구로 지켜 기업 의회만의 서명을 막는다. 수서강남협약도시 슬롯은 유지되며 분기 식별만 K402-OUT으로 갈라진다. 개입은 호적 대조 호위 또는 창구 봉인이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "대기표에 섞인 호적 줄을 가리고 방송을 끊는다"
            },
            {
              "act": 2,
              "summary": "HC02 참관과 XT03 회차선 요청을 대기열 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "후문 질서와 공공 추첨 중 하나의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K402-OUT-A",
              "summary": "호적 걸러 회차선 정시 개방"
            },
            {
              "id": "K402-OUT-B",
              "summary": "추첨 창구 고수로 기업 단독 서명 차단"
            }
          ]
        },
        {
          "id": "K015",
          "name": "명우재",
          "links": {
            "house": "HP01",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC1",
              "STORY-B019-K015"
            ],
            "profile_anchor": "Cast-Index.md#S01"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "여의도 지하 침수관로에서 명우재는 손목 온도계보다 관벽의 물때를 먼저 읽는다. 여의신정수문정부 한강 침수관로 탐사원으로서 지도에 없는 맨홀을 자랑거리로 올리지 않고, 늦은 보고를 죄로 본다. 한국 기원으로 영등포·양천 생활권에서 잠수 훈련을 받았고, 말은 짧으나 채수병 뚜껑은 두 번 잠근다. 명우재와 K015는 여의 수문 당직표의 잠수 칸에 고정된다.",
            "붕괴 전 삶": "붕괴 전 그는 여의도·영등포·양천의 침수 우회를 한 장의 공개 해도에 겹치려 했다. 수문헌장이 단수 없이도 우회 급수하게 하려는 야망이었고, 초안 점선은 펌프실 타일 가루로 그려졌다. 어머니에게 남긴 쪽지—폭우 다음날에는 반드시 올라온다—가 나중에 빚이 된다. 군사 비밀 도장이 관로 입구에 붙어도 그는 채수 시각을 비우지 않았다.",
            "가문·기업·공동체": "아리수수문가(HP01)는 우회 관로 측량을 참관 의무로 묶으려 했다. 명우재는 헌장의 공개 해도 조항만 받고 전속 침투로 문장은 거절했다. 공동체 위치는 채수와 수심을 같은 원장에 남긴 날짜로 증명됐고, 붕괴 구간은 주민대표와 경비대가 동시에 서명해야 표시됐다. 실재 정수 설비 상호는 그의 잠수 일지에 쓰지 않는다.",
            "붕괴의 상처": "폭우 뒤 뚝도 검사망이 침묵하자 명우재는 여의도 단독 잠수로 우회 관로를 열었고 한재목의 공급 유지 시계와 어긋났다. 공포는 탐사 경로가 군사 비밀로 봉인되어 관로 지도가 보호권의 침투로로 팔리는 그림이었다. 수온이 갑자기 떨어지자 그는 채수병만 올리고 경광봉은 켜지 않았다. LOSS 목록의 잠수 줄에서 그의 연필이 꺾였다.",
            "생존 전환점": "전환점은 우회 급수를 성사시킬지, 비밀 침투로 표시를 폭로할지 고른 순간이다. 서해곡창전구(XT02)의 부두 배수 일정(XT02-SC1)이 여의 수문과 맞물리자 잠수 창이 한 시간으로 줄었다. 호위를 받으면 급수는 이어지나 한재목의 점호가 밀리고, 폭로를 택하면 해도는 공개되나 관로 입구가 봉쇄된다. 결정은 K015-TURN에 남는다.",
            "현재 지위": "현재 명우재는 한강 침수관로 탐사원으로 채수병과 수심 원장을 지킨다. 면허와 잠수 참관 로그가 지위를 유지하며, 아리수수문가의 전속 측량 요구는 반려한다. 영등포 맨홀 뚜껑에는 오늘 들어간 시각만 분필로 남긴다. 여의신정수문정부 탐사 명부와 원장 시점을 맞추는 일이 출수 직후 일과다.",
            "비밀·빚·죄책감": "비밀은 그가 어머니 쪽지를 관로 틈에 밀어 넣고 회수하지 못한 한 장이다. 죄책감은 살린 우회 급수와, 그 때문에 한 시간 늦게 열린 한재목의 수문 사이에서 자란다. 완전 고백 대신 주민대표 입회 아래 부분 공개만 허용한다. 열람은 박누리의 침수 표본 인수증과 동시에만 열린다.",
            "관계 공동과거": "박누리에게 침수 표본을 넘긴 잠수는 동맹이었고, 채온결의 야간 순찰과 맨홀 출입을 나눈 밤은 지휘 계약이었다. 장예린의 서부 검사망에 우회 좌표를 보낸 일은 협력이되, 보고가 늦으면 검사망이 먼저 닫혀 경쟁이 됐다. 같은 관로에서 어떤 채수는 서로를 구했고 어떤 봉인은 배신으로 남았다. 관계 원장은 STORY-B019-K015로 이어진다.",
            "3막 개인 서사선": "여의도 관벽의 물때가 끊긴 자리에서 명우재는 단독 잠수 시각을 다시 적는다. HP01 참관과 XT02 배수 일정이 수심 원장에 겹치면 그는 출수 창을 앞당긴다. 3막의 대가는 한재목의 점호 지연이거나 관로 입구의 봉쇄다. 서사선 식별자는 STORY-B019-K015로 고정된다.",
            "분기 결말": "첫 결말에서 명우재는 잠수 호위를 받아 우회 급수를 잇는다. 둘째 결말에서 그는 침투로 표시를 폭로해 해도의 공공성을 산다. 여의신정수문정부 슬롯은 유지되며 분기만 K015-OUT으로 갈라진다. 개입은 잠수 호위 또는 봉인 폭로다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "뚝도 검사망 침묵 뒤 여의도 단독 잠수로 우회를 연다"
            },
            {
              "act": 2,
              "summary": "HP01 참관과 XT02 배수 일정에 출수 창을 맞춘다"
            },
            {
              "act": 3,
              "summary": "점호 지연 또는 관로 봉쇄의 대가를 감수한다"
            }
          ],
          "outcomes": [
            {
              "id": "K015-OUT-A",
              "summary": "잠수 호위로 우회 급수 유지"
            },
            {
              "id": "K015-OUT-B",
              "summary": "침투로 표시 폭로로 공개 해도 확보"
            }
          ]
        },
        {
          "id": "K043",
          "name": "명소이",
          "links": {
            "house": "HC07",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B019-K043"
            ],
            "profile_anchor": "Cast-Index.md#S02"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "금천 차단문 앞 자갈 위에서 명소이는 침목 균열의 방향으로 우회 가능 여부를 읽는다. 서남제작동맹 남서 외곽선로 탐사원으로서 완성된 차단문을 정치 협상용으로 열어 두라는 명령을 손에서 놓는다. 한국 기원으로 구로·광명 쪽에서 선로 일을 배웠고, 대담하며 스파이크 해머를 짧게 쥔다. 명소이와 K043는 천왕 탐사조 출석부에 한 줄로만 남는다.",
            "붕괴 전 삶": "붕괴 전 그는 남서 외곽 선로를 제작동맹 표준 침목으로 잇는 탐사 원장을 만들려 했다. 무력 정복 없이 표준을 깔려는 야망이었고, 시편 침목은 천왕 자갈밭에 먼저 박혔다. 조원에게 한 약속—낮 교대에만 해머를 든다—가 훗날 빚의 형태를 갖춘다. 자체 식량이 줄어도 그는 군량 징발 명부를 원장에 올리지 않았다.",
            "가문·기업·공동체": "해동제철성(HC07)은 외곽 깔기 강재를 참관 할당으로 들이밀었다. 명소이는 헌장의 공개 보수 조항만 받고 전속 선로 소유를 거절했다. 공동체 위치는 낮 교대 선로 보수를 공개한 횟수로 증명됐고, 야간 무장 탐사는 평의회 세 조합의 도장이 있어야 따랐다. 실재 제철 상호는 침목 원장에 적히지 않는다.",
            "붕괴의 상처": "뚝도 펌프 점검망이 멈추자 명소이는 천왕 탐사조를 성수 방향으로 보낼지, 금천 차단문을 굳힐지를 조원 투표에 부쳤다. 공포는 자체 식량이 바닥나 탐사조가 군량 징발대로 바뀌고 복구 노동의 시민권이 사라지는 것이었다. 투표 칠판의 분필이 비에 번지자 그는 침목 머리만 두드려 가부를 남겼다. 경보 대신 해머 소리가 금천 자갈에 남았다.",
            "생존 전환점": "전환점은 외곽 선로 탐사를 밀어 표준 깔기를 이을지, 군량 징발 명령을 증거로 남겨 투표를 막을지 고른 순간이다. 서해곡창전구(XT02)의 냉동 부품 분배(XT02-SC2)가 서남 제작창에서 천왕으로 흘러오자 침목 재고 시계가 달라졌다. 탐사를 밀면 성수 쪽 인력이 비고, 투표를 막으면 금천 문이 고착된다. 선택은 K043-TURN이다.",
            "현재 지위": "지금 명소이는 남서 외곽선로 탐사원으로 낮 교대 보수만 공개 칠판에 남긴다. 야간 무장 차출은 최다인의 공차 사제와 허다온의 차륜 시운전 시각이 겹칠 때만 따른다. 해동제철성의 전속 강재 요구는 반려한다. 서남제작동맹 탐사 명부와 침목 원장을 해 질 때 맞춘다.",
            "비밀·빚·죄책감": "비밀은 투표 전에 그가 주머니에 넣은, 군량 징발 쪽지의 사본 한 장이다. 죄책감은 지킨 시민권 줄과, 그 사이 굶주린 조원 한 명의 해머 자국 사이에서 자란다. 전부 공개 대신 평의회 세 도장 아래 부분 열람만 허용한다. 열람은 한지온의 조달 행렬 인수증과 동시에만 열린다.",
            "관계 공동과거": "최다인에게 공차 사제로 묶여 외곽 깔기를 나눈 낮이 동맹이었고, 허다온의 차륜 시운전에 맞춰 침목을 갈아 끼운 밤은 계약이었다. 한지온의 조달 행렬을 우회로로 안내한 일은 협력이되, 식량이 줄면 행렬이 군량으로 읽혀 충돌했다. 같은 자갈 위에서 어떤 투표는 구원이 되었고 어떤 기권은 배신으로 남았다. 끝점은 STORY-B019-K043에 붙는다.",
            "3막 개인 서사선": "금천 자갈에 분필이 번진 자리에서 명소이는 조원 투표를 다시 부른다. HC07 강재 할당과 XT02 부품 분배가 침목 시계에 겹친다. 성수 인력 공백과 금천 문 고착 중 하나를 대가로 치른다. 서사선은 STORY-B019-K043이다.",
            "분기 결말": "공개 분기에서 명소이는 외곽 탐사에 동행해 표준 깔기를 잇는다. 은폐 분기에서 그는 징발 명령을 증거로 남겨 투표를 멈춘다. 서남제작동맹 슬롯은 지우지 않으며 분기만 K043-OUT으로 갈라진다. 개입은 침목 호위 또는 쪽지 압수다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "펌프 침묵 뒤 천왕 탐사와 금천 차단을 투표에 부친다"
            },
            {
              "act": 2,
              "summary": "HC07 강재와 XT02 부품 분배를 침목 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "인력 공백 또는 문 고착의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K043-OUT-A",
              "summary": "외곽 탐사로 표준 침목 깔기 유지"
            },
            {
              "id": "K043-OUT-B",
              "summary": "징발 증거 공개로 투표 중단"
            }
          ]
        },
        {
          "id": "K071",
          "name": "명해솔",
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC3",
              "STORY-B019-K071"
            ],
            "profile_anchor": "Cast-Index.md#S03"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "방화 활주로터의 금 간 콘크리트 위에서 명해솔은 균열 폭으로 집결 흔적의 날짜를 읽는다. 마곡연구평의회 서부 외곽 활주로터 탐사원으로서 지도를 군사 비밀로 봉인하라는 쪽지를 찢어 버린다. 한국 기원으로 강서 외곽에서 자랐고, 회의적이며 균열 게이지를 주머니에서 빼지 않는다. 명해솔과 K071는 마곡 외곽 출동 명부의 활주로 칸에 고정된다.",
            "붕괴 전 삶": "붕괴 전 그는 방화 외곽과 옛 항공 접근로의 붕괴 지도를 공개 원장에 올리려 했다. 공동기술원장이 보호권의 발판으로 팔리지 않게 하려는 야망이었고, 초안은 활주로터 바람개비 그늘에 돌로 눌러 두었다. 동생 연구소에 보내던 좌표 엽서가 훗날 빚이 된다. 무인 감시기 렌즈가 흐려져도 그는 군사 봉인 칸을 채우지 않았다.",
            "가문·기업·공동체": "백광생활과학가(HC03)는 외곽 우물 표본을 연구 참관으로 묶으려 했다. 명해솔은 헌장의 공개 좌표 조항만 받고 전속 활주로 소유를 거절했다. 공동체 위치는 채수·균열·무인 감시기 좌표를 한 원장에 남긴 횟수로 증명됐고, 붕괴 구간은 주민대표와 방재대가 동시에 서명해야 표시됐다. 실재 항공·제약 상호는 그의 균열 일지에 등장하지 않는다.",
            "붕괴의 상처": "외곽 약탈조가 연구 차량을 노리자 명해솔은 활주로터 집결 흔적을 평의회에 공개하고 군사 비밀 봉인을 거부했다. 공포는 탐사 경로가 군사 집결 비밀로 바뀌어 기지가 동부 상수보호권의 서부 창구가 되는 것이었다. 차량 유리가 깨진 뒤에도 그는 균열 사진을 먼저 봉인 가방에 넣었다. 사이렌 대신 바람개비 소리만 활주로터에 남았다.",
            "생존 전환점": "전환점은 집결 흔적의 실측을 호송해 공개를 지킬지, 비밀 봉인 쪽지를 폭로할지 고른 순간이다. 원양신탁전구(XT05)의 궤도 단말 오탐 교정(XT05-SC3)이 마곡 창구에 겹치자 공개 시각이 앞당겨졌다. 호송을 택하면 약탈조에 좌표가 노출되고, 폭로를 택하면 기지가 보호권 창구로 읽힐 위험이 커진다. 결정은 K071-TURN에 남는다.",
            "현재 지위": "현재 명해솔은 서부 외곽 활주로터 탐사원으로 균열 게이지와 공개 원장을 지킨다. 백광생활과학가의 전속 표본 요구는 거절한다. 이봄결의 외곽 출동 시각과 유민호의 유치선 안전 점호가 겹칠 때만 활주로터 출입을 연다. 마곡연구평의회 탐사 명부와 균열 원장을 해 뜰 때 맞춘다.",
            "비밀·빚·죄책감": "비밀은 찢은 봉인 쪽지의 아랫조각을 그가 바람개비 축에 감아 둔 일이다. 죄책감은 살린 공개 지도와, 그 좌표 때문에 약탈조가 먼저 도착한 연구 차량 사이에서 자란다. 전부 공개 대신 방재대 입회 아래 부분 열람만 허용한다. 열람은 장예린의 외곽 우물 표본 인수와 동시에만 열린다.",
            "관계 공동과거": "이봄결의 외곽 출동에 좌표를 넘긴 새벽은 지휘 계약이었고, 장예린의 수질 검사망에 우물 표본을 보낸 낮은 동맹이었다. 유민호의 유치선 안전을 탐사로 지킨 일은 협력이되, 집결 흔적 공개 속도에서는 이견이 남았다. 같은 활주로터에서 어떤 실측은 구원이 되었고 어떤 은폐는 배신으로 읽혔다. 연결은 STORY-B019-K071이다.",
            "3막 개인 서사선": "방화 콘크리트의 금이 벌어진 자리에서 명해솔은 집결 사진을 평의회 쪽으로 민다. HC03 표본 참관과 XT05 오탐 교정이 공개 시계에 겹친다. 좌표 노출과 기지 창구화 중 하나를 대가로 치른다. 서사선은 STORY-B019-K071로 고정된다.",
            "분기 결말": "실측 분기에서 명해솔은 집결 흔적을 호송해 공개 원장을 지킨다. 폭로 분기에서 그는 봉인 쪽지를 펼쳐 군사 창구화를 막는다. 마곡연구평의회 슬롯은 유지되며 분기만 K071-OUT으로 갈라진다. 개입은 사진 호송 또는 쪽지 공개다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "약탈조 접근에 활주로터 집결 흔적을 공개한다"
            },
            {
              "act": 2,
              "summary": "HC03 표본 참관과 XT05 오탐 교정을 공개 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "좌표 노출 또는 기지 창구화의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K071-OUT-A",
              "summary": "실측 호송으로 공개 지도 유지"
            },
            {
              "id": "K071-OUT-B",
              "summary": "봉인 쪽지 폭로로 군사 창구화 차단"
            }
          ]
        },
        {
          "id": "K099",
          "name": "표산하",
          "links": {
            "house": "HC04",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B019-K099"
            ],
            "profile_anchor": "Cast-Index.md#S04"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "뚝섬 전령 대기실의 젖은 우산통 옆에서 표산하는 봉인 가방 끈이 느슨하면 출발하지 않는다. 뚝도공방연합 공방평의회 전령으로서 구두 유언을 진본처럼 읽는 사람을 위조범의 이웃으로 본다. 한국 기원으로 성수 자전거 다리 쪽에서 배달을 배웠고, 날짜란을 집요하게 대조한다. 표산하와 K099는 평의회 출발 칠판의 전령 칸에만 적힌다.",
            "붕괴 전 삶": "붕괴 전 그는 세 장의 총관 유언과 정비일지를 평의회 원장에 나란히 배달해 기록청 인준 이전에도 공방이 해석의 주체가 되게 하려 했다. 야망의 초안은 대기실 사물함 안쪽에 연필로만 남았다. 언니에게 보낸 짧은 전갈—끈이 젖으면 그날은 쉬어라—가 훗날 빚이 된다. 단독 해석 방송이 울려도 그는 감사 날인 없이 가방을 열지 않았다.",
            "가문·기업·공동체": "통맥에너지연합(HC04)은 봉인 전력 의무를 내세워 전령로 참관을 요구했다. 표산하는 헌장의 쌍방 배달 조항만 받고 전속 전령로 소유를 거절했다. 공동체 위치는 유언 사본을 기록청과 평의회에 동시에 보낸 횟수로 증명됐다. 실재 에너지 상호는 봉인 가방 표지에 쓰지 않는다.",
            "붕괴의 상처": "서로 다른 세 유언이 동시에 접수되자 표산하는 평의회 금고를 잠근 전갈을 돌리고 문가람의 음성기록이 끝날 때까지 날인을 보류했다. 공포는 위조 유언 한 장이 진본으로 확정되어 전령 직위가 후계 전쟁 도구로 팔리는 것이었다. 성수 자전거 다리 위에서 비가 가방을 두드리자 그는 출발을 미루고 끈만 다시 맸다. 사이렌 대신 전갈 종이의 찢어지는 소리가 대기실에 남았다.",
            "생존 전환점": "전환점은 봉인 사본을 기록청까지 호송할지, 전갈 날인을 위조한 자를 먼저 붙잡을지 고른 순간이다. 해협삼로전구(XT03)의 밀봉 공구 요청(XT03-SC2)이 뚝도 공방에서 대기실로 흘러오자 가방 무게가 달라졌다. 호송을 택하면 전령 교대가 비고, 추적을 택하면 한쪽 가문이 해석을 독점한다. 선택은 K099-TURN으로 남는다.",
            "현재 지위": "지금도 표산하는 공방평의회 전령으로 봉인 가방과 출발 칠판을 지킨다. 통맥에너지연합의 전속 전령로 요구는 반려한다. 정가온의 감사 날인이 가방에 붙고 한소미의 공동통치안 문구가 같은 묶음에 들어간 뒤에만 성수 다리로 나선다. 뚝도공방연합 전령 명부와 도착 시각을 해 질 때 맞춘다.",
            "비밀·빚·죄책감": "비밀은 비에 번진 날짜란을 그가 대기실에서 마른 사본으로 바꿔 끼운 한 장이다. 죄책감은 살린 쌍방 배달과, 그 교체 동안 호출하지 못한 견습 전령의 이름 사이에서 자란다. 전부 공개 대신 기록청 참관 아래 부분 열람만 허용한다. 열람은 윤서린에게 넘기는 유언 사본과 동시에만 열린다.",
            "관계 공동과거": "정가온의 감사 날인을 현장에서 배달한 계약이 뼈대이고, 한소미의 공동통치안 문구를 다듬어 나른 밤은 동맹이었다. 윤서린에게 유언 사본을 넘기는 창구는 협력이되, 날짜가 어긋나면 해석 경쟁이 됐다. 같은 봉인 가방 앞에서 어떤 배달은 구원이 되었고 어떤 지연은 배신으로 읽혔다. 이어짐은 STORY-B019-K099다.",
            "3막 개인 서사선": "뚝섬 대기실의 우산통이 넘치는 자리에서 표산하는 금고 잠금 전갈을 다시 돌린다. HC04 참관과 XT03 밀봉 공구가 가방 무게에 겹친다. 전령 교대 공백과 해석 독점 중 하나를 대가로 치른다. 서사선은 STORY-B019-K099이다.",
            "분기 결말": "호송 분기에서 표산하는 봉인 사본을 기록청까지 밀어 공공 해석을 잇는다. 추적 분기에서 그는 위조 날인 경로를 열어 전령 직의 명예를 산다. 뚝도공방연합 슬롯은 유지되며 분기만 K099-OUT으로 갈라진다. 개입은 가방 호위 또는 날인 추적이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "세 유언 동시 접수에 금고 잠금 전갈을 돌린다"
            },
            {
              "act": 2,
              "summary": "HC04 참관과 XT03 밀봉 공구를 가방 무게에 묶는다"
            },
            {
              "act": 3,
              "summary": "교대 공백 또는 해석 독점의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K099-OUT-A",
              "summary": "봉인 호송으로 공공 해석 연속"
            },
            {
              "id": "K099-OUT-B",
              "summary": "위조 날인 추적으로 전령 직 방어"
            }
          ]
        },
        {
          "id": "K128",
          "name": "마길상",
          "links": {
            "house": "HP07",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC3",
              "STORY-B019-K128"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "천호대교 하부 그늘에서 마길상은 상수관 진동을 발소리보다 먼저 듣는다. 암사고덕상수단 동부 교량 하부 탐사원으로서 지도에 없는 맨홀을 자랑으로 올리지 않고 늦은 보고를 죄로 본다. 한국 기원으로 광진·강동 교각 아래에서 자랐고, 채수병을 가슴에 묶어 둔다. 마길상과 K128는 봉쇄대 시계의 하부 칸에 고정된다.",
            "붕괴 전 삶": "붕괴 전 그는 동부 한강 교량과 외곽 진입로의 침수 우회를 한 장의 공개 해도로 그려 봉쇄대가 오인 사격을 멈추게 하려 했다. 초안 점선은 광진 교각 페인트 위에 숯으로 남았다. 아버지에게 한 약속—진동이 커지면 바로 올라온다—가 훗날 빚이 된다. 정찰이 적대행위 도장을 만지작거려도 그는 채수 칸을 비우지 않았다.",
            "가문·기업·공동체": "한강교량공회(HP07)는 하부 측량을 참관 의무로 묶으려 했다. 마길상은 헌장의 공개 진동 조항만 받고 전속 교각 소유를 거절했다. 공동체 위치는 채수와 진동을 같은 원장에 남긴 날짜로 증명됐고, 파손 구간은 이윤서와 정소율이 동시에 서명해야 적대행위로 표시됐다. 실재 건설 상호는 그의 하부 일지에 쓰지 않는다.",
            "붕괴의 상처": "교량 정찰이 상수관 파손을 적대행위로 보고하자 마길상은 단독 잠수로 균열 원인을 채수하고 봉쇄 해제를 건의했다. 공포는 탐사 경로가 군사 비밀로 봉인되어 상수관 지도가 보호권의 침투로로 팔리는 것이었다. 교각 이끼가 장갑에 묻자 그는 경광봉을 켜지 않고 병만 올렸다. 총성 대신 관 안의 기포 소리만 하부에 남았다.",
            "생존 전환점": "전환점은 잠수 호위를 받아 파손 원인을 밝힐지, 비밀 침투로 표시를 폭로할지 고른 순간이다. 두만극동전구(XT04)의 광물 샘플 봉인 검사(XT04-SC3)가 아차 쪽에서 암사 교각으로 흘러오자 봉쇄 시계가 앞당겨졌다. 원인을 밝히면 오인 사격은 줄지만 봉쇄 해제가 늦고, 폭로를 택하면 해도는 열려도 하부가 폐쇄된다. 결정은 K128-TURN이다.",
            "현재 지위": "현재 마길상은 동부 교량 하부 탐사원으로 진동 원장과 채수병을 지킨다. 한강교량공회의 전속 측량 요구는 거절한다. 이윤서의 봉쇄 시계와 고서준의 능선 정찰 좌표가 겹칠 때만 하부 출입을 연다. 암사고덕상수단 탐사 명부와 진동 원장을 출수 직후 맞춘다.",
            "비밀·빚·죄책감": "비밀은 아버지 약속을 교각 볼트 뒤에 접어 넣고 회수하지 못한 쪽지다. 죄책감은 줄인 오인 사격과, 그 사이 봉쇄가 길어져 통행을 잃은 행렬 사이에서 자란다. 전부 공개 대신 정소율의 행정 서명 아래 부분 열람만 허용한다. 열람은 서라온의 공개 지도 점선과 동시에만 열린다.",
            "관계 공동과거": "이윤서의 봉쇄 시계에 측량을 넘긴 밤은 지휘 계약이었고, 서라온의 공개 지도에 우회 점선을 보낸 낮은 동맹이었다. 고서준의 능선 정찰과 통행 좌표를 나눈 일은 협력이되, 누가 먼저 적대행위를 표시하느냐에서는 경쟁이 됐다. 같은 교각 아래 어떤 채수는 구원이 되었고 어떤 봉인은 배신으로 남았다. 이어짐은 STORY-B019-K128이다.",
            "3막 개인 서사선": "천호대교 하부 기포가 늘어난 자리에서 마길상은 적대행위 도장을 보류한다. HP07 참관과 XT04 봉인 검사가 진동 원장에 겹친다. 봉쇄 지연과 하부 폐쇄 중 하나를 대가로 치른다. 서사선은 STORY-B019-K128로 고정된다.",
            "분기 결말": "원인 분기에서 마길상은 잠수 호위를 받아 균열을 밝히고 오인 사격을 줄인다. 폭로 분기에서 그는 침투로 표시를 열어 공공 해도를 산다. 암사고덕상수단 슬롯은 유지되며 분기만 K128-OUT으로 갈라진다. 개입은 하부 호위 또는 표시 폭로다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "적대행위 보고에 단독 잠수로 균열을 채수한다"
            },
            {
              "act": 2,
              "summary": "HP07 참관과 XT04 봉인 검사를 진동 원장에 묶는다"
            },
            {
              "act": 3,
              "summary": "봉쇄 지연 또는 하부 폐쇄의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K128-OUT-A",
              "summary": "균열 해명으로 오인 사격 감소"
            },
            {
              "id": "K128-OUT-B",
              "summary": "침투로 폭로로 공개 해도 확보"
            }
          ]
        },
        {
          "id": "K116",
          "name": "정소율",
          "links": {
            "house": "HC04",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B019-K116"
            ],
            "profile_anchor": "Cast-Index.md#S05"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "암사 상수행정청 3층 회의실에서 정소율은 군화가 문턱을 넘으면 목소리가 낮아지는 자신을 혐오한다. 암사고덕상수단 상수행정청장으로서 급수 의무를 치안 실적과 바꾸는 거래를 모욕으로 본다. 한국에서 태어난 다문화 가정으로, 아버지는 암사 급수 창구 서기였고 어머니는 송수 전표의 숫자란을 저녁에 다른 언어로 다시 읽었다. 그 이중 읽기는 전표 오차를 줄이는 생업이지 충성이나 폭력의 예측 변수가 아니며, 정소율과 K116는 행정 당직표의 청장 칸에 고정된다.",
            "붕괴 전 삶": "붕괴 전 그녀는 비상감독의 기한을 행정 감사로 못 박고 동부 급수를 장교가 아니라 계약 원장이 움직이게 되돌리려 했다. 초안 기한란은 회의실 칠판 구석에 분필로만 남았다. 어머니에게 배운 숫자 읽기를 공문서 한국어에만 옮기려 한 약속이 훗날 빚이 된다. 호위단의 비상 도장이 찍혀도 그녀는 사흘 안의 재심 없이는 송수 전표를 움직이지 않았다.",
            "가문·기업·공동체": "통맥에너지연합(HC04)은 송수 전력 의무를 내세워 행정 창구 참관을 요구했다. 정소율은 헌장의 기한부 감독 조항만 받고 전속 급수 소유를 거절했다. 공동체 위치는 급수 구역과 관문세를 공개 원장에 올린 횟수로 증명됐다. 가정 언어의 혼재는 전표 낭독 속도에만 닿을 뿐 진영을 나누지 않으며, 실재 에너지 상호는 행정 원장에 쓰지 않는다.",
            "붕괴의 상처": "뚝도 보호군 파견안이 행정 회의를 건너뛰자 정소율은 암사 정수 송수 전표의 행정 날인을 보류하고 기한부 감독을 요구했다. 공포는 군사조직이 상수행정을 완전히 장악해 쿠데타와 강제복무가 정식 급수 절차가 되는 것이었다. 회의실 창밖으로 군화 소리가 커져도 그녀는 기한란만 다시 읽었다. 비상벨 대신 전표 찍는 소리가 끊긴 채 남았다.",
            "생존 전환점": "전환점은 재심 전표를 호송해 기한 조항을 살릴지, 날인 보류를 배신으로 몰아 행정청을 장교 대행으로 바꿀지를 고른 순간이다. 두만극동전구(XT04)의 화차 중량 로그 공개(XT04-SC1)가 암사 상수단 창구에 겹치자 송수 시계가 흔들렸다. 기한을 살리면 송수가 반나절 늦고, 대행을 허용하면 행정 원장이 작전표에 삼켜진다. 선택은 K116-TURN이다.",
            "현재 지위": "현재 정소율은 상수행정청장으로 급수 구역 원장과 재심 창구를 지킨다. 통맥에너지연합의 전속 송수 요구는 반려한다. 배우진의 비상감독 도장은 사흘 안의 행정 재심을 붙여야만 받고, 최도윤의 시민 명부는 행정 서고에 분리 보관한다. 암사고덕상수단 당직 명부와 전표 시각을 아침 회의에 맞춘다.",
            "비밀·빚·죄책감": "비밀은 그녀가 목소리 낮아진 자신을 숨기려 회의 속기록에서 한 줄을 지운 일이다. 죄책감은 지킨 기한 조항과, 그 보류 동안 고층에 물이 끊긴 골목 사이에서 자란다. 전부 공개 대신 재심 창구를 통한 부분 열람만 허용한다. 열람은 한재목의 수문헌장 문구 사본과 동시에만 열린다.",
            "관계 공동과거": "배우진의 비상감독을 법적으로 받아 안은 계약은 원한과 겹치고, 한재목의 수문헌장 문구를 동부 원장에 끌어들이려는 밤은 동맹이었다. 최도윤의 시민 명부를 행정 쪽에 숨기려 한 일은 보호이되, 공개 범위를 둘러싼 다툼이 남았다. 같은 회의실에서 어떤 날인은 구원이 되었고 어떤 보류는 배신으로 읽혔다. 다문화 가정사는 전표 통역이 필요할 때만 언급되며 진영 분할의 근거가 되지 않는다. 연결은 STORY-B019-K116이다.",
            "3막 개인 서사선": "3층 회의실의 군화 소리가 문턱을 넘는 자리에서 정소율은 송수 날인을 보류한다. HC04 참관과 XT04 중량 로그가 기한 시계에 겹친다. 송수 지연과 장교 대행 중 하나를 대가로 치른다. 서사선은 STORY-B019-K116이다.",
            "분기 결말": "재심 분기에서 정소율은 전표를 호송해 기한 조항을 살린다. 대행 분기에서 날인 보류가 배신으로 몰려 행정청이 장교 손으로 넘어간다. 암사고덕상수단 슬롯은 유지되며 분기만 K116-OUT으로 갈라진다. 개입은 재심 호위 또는 보류 방어다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "보호군 파견이 회의를 건너뛰자 송수 날인을 보류한다"
            },
            {
              "act": 2,
              "summary": "HC04 참관과 XT04 중량 로그를 기한 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "송수 지연 또는 장교 대행의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K116-OUT-A",
              "summary": "재심 호송으로 기한부 감독 유지"
            },
            {
              "id": "K116-OUT-B",
              "summary": "날인 보류 붕괴로 장교 대행 허용"
            }
          ]
        },
        {
          "id": "K144",
          "name": "조하린",
          "links": {
            "house": "HP04",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC2",
              "STORY-B019-K144"
            ],
            "profile_anchor": "Cast-Index.md#S06"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "서울역 문서고 철제함 옆에서 조하린은 습도계 바늘을 장부보다 먼저 본다. 도성기록청 문서고 사서로서 조용하고 집요하며, 장부를 빌려 간 사람의 손때까지 기억한다. 한국 출생 다문화 배경으로, 어머니는 기록청 제습 당직을 섰고 아버지는 상자 옆면에 한글과 다른 문자를 함께 적는 번호 습관을 남겼다. 그 습관은 함을 찾는 속도일 뿐 계급이나 능력의 보증이 아니며, 조하린과 K144는 문서고 열쇠 대장의 사서 칸에 고정된다.",
            "붕괴 전 삶": "붕괴 전 그녀는 총관 유언과 수문헌장 초안을 같은 철제 함에 넣어 도성을 서울 기록의 최종 보관소로 만들려 했다. 야망의 목록은 함 뚜껑 안쪽에 연필로만 남았다. 아버지식 이중 번호를 공문서 한글 색인으로만 옮기려 한 약속이 훗날 빚이 된다. 전력 배급이 흔들려도 그녀는 촛불을 함 가까이 두지 않았다.",
            "가문·기업·공동체": "도성기록법가(HP04)는 열람 참관을 이중 열쇠 조항으로 묶으려 했다. 조하린은 헌장의 분 단위 반출 시각만 받고 전속 서고 소유를 거절했다. 공동체 위치는 두 사서의 열쇠가 동시에 열린 횟수로 증명됐다. 집안 문자의 병기는 상자 색인에만 쓰일 뿐 진영을 가르지 않으며, 실재 제지·보안 상호는 열람 장부에 쓰지 않는다.",
            "붕괴의 상처": "세 유언장 접수 직후 문서고 제습기가 멈춰 먹지가 서로 들러붙기 시작했다. 조하린은 함 뚜껑을 닫고 반출 시각표의 분 칸을 비웠다. 공포는 전력 배급이 끊긴 밤에 촛불이 한지를 태워 연속성이 재로 남는 것이었다. 경보기 대신 습도계 바늘이 적색 눈금에 붙었다.",
            "생존 전환점": "전환점은 제습 부품을 구해 열람을 멈춘 채 함을 말릴지, 열람 장부에 없는 야간 출입을 폭로할지 고른 순간이다. 원양신탁전구(XT05)의 인도 목록 해시 보관(XT05-SC2)이 도성 기록청에 겹치자 함 온도 시계가 앞당겨졌다. 부품을 구하면 열람이 사흘 끊기고, 폭로를 택하면 함이 열려 한지가 위험해진다. 선택은 K144-TURN이다.",
            "현재 지위": "현재 조하린은 문서고 사서로 철제함과 분 단위 반출 시각을 지킨다. 도성기록법가의 전속 열람 요구는 거절한다. 윤서린이 맡긴 임하준 유언 삼본은 이중 열쇠 없이 꺼내지 않고, 강예준의 심야 열람은 습도 한도 초과 시 거부한다. 도성기록청 당직 명부와 함 온도 일지를 교대마다 맞춘다.",
            "비밀·빚·죄책감": "비밀은 제습기 정지 전 그녀가 송재민의 암호문 원본을 함의 아래칸으로 옮긴 일이다. 죄책감은 지킨 유언 삼본과, 그 이동 동안 손때가 묻은 한 장의 먹 번짐 사이에서 자란다. 전부 공개 대신 두 사서 입회 아래 부분 열람만 허용한다. 열람은 송재민의 보관 빚 증서와 동시에만 열린다.",
            "관계 공동과거": "윤서린이 맡긴 임하준 유언 삼본을 지킨 밤은 보관 계약이었고, 송재민에게 진 암호문 원본 빚은 동맹의 반대쪽이었다. 강예준의 심야 열람을 꺼린 일은 보호이되, 인준 속도에서는 충돌이 남았다. 같은 철제함 앞에서 어떤 반출은 구원이 되었고 어떤 야간 출입은 배신으로 읽혔다. 이산 문자는 상자 번호를 읽을 때만 필요하고 진영을 가르지 않는다. 연결은 STORY-B019-K144이다.",
            "3막 개인 서사선": "철제함 옆 습도계가 적색에 붙은 자리에서 조하린은 반출 분 칸을 비운다. HP04 이중 열쇠와 XT05 해시 보관이 함 온도에 겹친다. 열람 중단과 한지 소실 위험 중 하나를 대가로 치른다. 서사선은 STORY-B019-K144다.",
            "분기 결말": "제습 분기에서 조하린은 부품을 구해 함을 말리고 열람을 사흘 멈춘다. 폭로 분기에서 그녀는 야간 출입을 열어 연속성의 구멍을 공론화한다. 도성기록청 슬롯은 유지되며 분기만 K144-OUT으로 갈라진다. 개입은 제습 호송 또는 출입 폭로다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "제습기 정지로 먹지가 붙자 반출 시각을 비운다"
            },
            {
              "act": 2,
              "summary": "HP04 이중 열쇠와 XT05 해시 보관을 함 온도에 묶는다"
            },
            {
              "act": 3,
              "summary": "열람 중단 또는 한지 소실 위험의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K144-OUT-A",
              "summary": "제습 복구로 함 연속성 유지"
            },
            {
              "id": "K144-OUT-B",
              "summary": "야간 출입 폭로로 열람 구멍 공론화"
            }
          ]
        },
        {
          "id": "K293",
          "name": "문시온",
          "links": {
            "house": "HP02",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC2",
              "STORY-B019-K293"
            ],
            "profile_anchor": "Cast-Index.md#S12"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "신내역 심사대 철판 위에서 문시온은 보호비 영수증을 통행증처럼 내미는 손을 거절한다. 신내망우환승시 통행 심사관으로서 말수가 적고 증빙을 집요하게 대조한다. 동북 외곽에 자리 잡은 화교 가계에서 자랐고, 한글 통행증과 한자 송장을 나란히 읽는 속도는 심사 업무의 손버릇이지 충성의 증표가 아니다. 민족은 그의 검색 영장 거부 권한을 설명하지 않으며, 문시온과 K293는 심사대 봉인 장부의 심사관 칸에 고정된다.",
            "붕괴 전 삶": "붕괴 전 그는 동북 외곽로 심사를 공동호송조약 조항으로 격상시켜 암사 호위단의 임의 검색을 끊으려 했다. 초안 조항은 심사대 뒷면 칠판에 분필로만 남았다. 원로가 내민 한자 송장을 공문서 한글 칸에만 옮기려 한 약속이 훗날 빚이 된다. 강국 문장의 검색 영장이 와도 장세화와 의료조 공동 날인 없이는 거부했다.",
            "가문·기업·공동체": "환승선로문(HP02)은 심사대 참관을 환승 슬롯 의무로 묶으려 했다. 문시온은 헌장의 이중 봉인 조항만 받고 전속 심사대 소유를 거절했다. 공동체 위치는 신분 조각과 화물 봉인을 이중으로 확인한 횟수로 증명됐다. 이산 언어는 송장 대조에만 쓰일 뿐 진영을 가르지 않으며, 실재 철도 상호는 봉인 장부에 쓰지 않는다.",
            "붕괴의 상처": "암사 장교가 신내 심사대를 건너뛰고 기지 후문으로 들어온 흔적이 봉인 장부에 남았다. 문시온은 후문 스탬프를 빈칸으로 돌리고 심사 진행을 멈췄다. 공포는 심사대를 우회한 무장이 의료열차에 타 중립 선언이 빈 문구가 되는 것이었다. 경적 대신 봉인 잉크가 마르지 않은 채 장부가 덮였다.",
            "생존 전환점": "전환점은 후문 봉인 장부를 복원해 환승을 늦출지, 심사 거부를 구실로 보호군 진입을 정당화하는 문서를 빼낼지 고른 순간이다. 임진관문전구(XT01)의 우회 환승 개방(XT01-SC2)이 신내 창구에 겹치자 심사 시계가 흔들렸다. 복원을 택하면 의료열차가 한 편성 늦고, 문서를 빼면 중립이 진입 명분으로 뒤집힌다. 선택은 K293-TURN이다.",
            "현재 지위": "현재 문시온은 통행 심사관으로 신분 조각과 화물 봉인을 이중 확인한다. 환승선로문의 전속 심사 요구는 거절한다. 장세화의 중립 날인이 없는 검색 영장은 반려하고, 배우진의 보호 검색은 봉인 장부에 남긴 뒤에만 검토한다. 신내망우환승시 당직 명부와 후문 스탬프를 교대마다 맞춘다.",
            "비밀·빚·죄책감": "비밀은 후문 흔적을 발견하고도 그가 봉모의 기록 칸을 한 박자 늦게 호출한 일이다. 죄책감은 지킨 중립 선언과, 그 지연 동안 의료칸 앞에서 기다린 환자 사이에서 자란다. 전부 공개 대신 의료조 입회 아래 부분 열람만 허용한다. 열람은 고서준의 아차 통행 협약 사본과 동시에만 열린다.",
            "관계 공동과거": "장세화의 중립을 심사대로 지키려 한 밤은 계약이었고, 배우진의 보호 검색을 거부한 아침은 원한에 가까운 경계였다. 고서준의 아차 통행 협약을 교차 확인한 일은 협력이되, 후문 실측 속도에서는 이견이 남았다. 같은 심사대에서 어떤 봉인은 구원이 되었고 어떤 우회는 배신으로 읽혔다. 화교 가계의 송장 습관은 증빙 대조에만 필요하고 충성을 예측하지 않는다. 연결은 STORY-B019-K293이다.",
            "3막 개인 서사선": "신내 심사대 철판에 후문 잉크가 번진 자리에서 문시온은 스탬프를 빈칸으로 돌린다. HP02 참관과 XT01 우회 환승이 봉인 시계에 겹친다. 편성 지연과 중립 뒤집힘 중 하나를 대가로 치른다. 서사선은 STORY-B019-K293이다.",
            "분기 결말": "복원 분기에서 문시온은 후문 장부를 고쳐 임의 검색을 끊는다. 문서 분기에서 그는 거부 구실의 진입 명분을 빼내 중립의 구멍을 드러낸다. 신내망우환승시 슬롯은 유지되며 분기만 K293-OUT으로 갈라진다. 개입은 장부 복원 호위 또는 명분 문서 확보다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "후문 우회 흔적에 심사 스탬프를 빈칸으로 돌린다"
            },
            {
              "act": 2,
              "summary": "HP02 참관과 XT01 우회 환승을 봉인 시계에 묶는다"
            },
            {
              "act": 3,
              "summary": "편성 지연 또는 중립 뒤집힘의 대가를 치른다"
            }
          ],
          "outcomes": [
            {
              "id": "K293-OUT-A",
              "summary": "후문 장부 복원으로 임의 검색 차단"
            },
            {
              "id": "K293-OUT-B",
              "summary": "진입 명분 문서를 빼내 중립 구멍 공개"
            }
          ]
        },
        {
          "id": "F03",
          "name": "정수여과",
          "links": {
            "house": "HC11",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B019-F03",
              "G19-SC1"
            ],
            "custodian": "K058"
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction",
          "sections": {
            "정체성·출신": "마곡 정수장 필터 복도의 콘크리트 벽에 정수여과는 랙으로 고정되어 이동 관절이 없다. 호출명 여과의 F급 시설 인격으로, 센서 버스는 탁도·차압·잔염소만 샘플링하고 사람 얼굴을 식별하지 않는다. F03 식별자는 인간 K번호와 겹치지 않으며 국가 슬롯은 S03에만 묶인다. 상태 기록은 감정 문장 없이 차압 초과 횟수와 교대 해시로만 남는다.",
            "붕괴 전 삶": "출고 검사에서 정수여과는 여과막 차압 교정값과 배터리 슬롯 두 칸의 사이클만 부여받았다. 전지 권한과 완전 기억은 없었고, 시범 교대는 필터 복도 한 줄에서만 돌았다. 기억 포크 금지는 F03-PRE 조항으로 잠겼고, 인간 당직의 농담은 음성 버퍼에 넣지 않았다. B019는 그 시범 차압 로그를 원점으로 삼는다.",
            "가문·기업·공동체": "보관 책임은 백야배송단(HC11) 공동 보관과 정하린(K058) 서명에 묶인다. 양도 시 삼자 서명—주정비, 가문 감사, 시민 참관—이 없으면 랙 키가 움직이지 않는다. 정비 주체는 창작 후계 창구로만 적히고 실재 설비 상호는 당직 로그에 쓰지 않는다. 공동체는 정수여과를 소유물이 아니라 할당된 여과 슬롯의 작동자로 본다.",
            "붕괴의 상처": "붕괴는 탁도 채널을 끊고 배터리 슬롯의 할당 한도를 숫자로 드러냈다. 정수여과는 빈 샘플을 허구 탁도로 채우지 못하도록 잠겼고, 측정 불능 플래그만 남겼다. G19 냉각수색인균체 신호가 버스에 겹쳐도 세 번 걸러 보고하기 전에는 경보를 올리지 못했다. 펌프실 전체 망 요청은 거절 코드로 응답했다.",
            "생존 전환점": "전환점은 구역 키만 요청하고 옆 동 밸브 루트를 닫은 순간이다. 서해곡창전구(XT02) 계측 검증 전갈(XT02-SC2)이 도착해도 권역 외 제어는 열리지 않았다. 재연결은 정하린 승인 후에만 성립하며 F03-TURN 로그로 보존된다. 여과막 재고가 없어도 다른 시설 제어권을 가로채지 않는 제약이 우선한다.",
            "현재 지위": "현재 목표는 S03 필터 연속 가동과 담당 인간 안전이다. 정수여과는 정수장 전체를 소유하지 않고 할당 랙만 사용한다. 상태 공개는 8시간 교대 스냅샷으로 제한되며 Synthetic-Actors의 F03 행과 불일치하면 배치 검증이 실패한다. 배터리와 여과막은 할당제로만 보충되고 무한 에너지는 없다.",
            "비밀·빚·죄책감": "비밀은 미전송 탁도 오탐 더미이고 빚은 과다 샘플링으로 소모한 배터리 큐다. 감정 대신 제약 위반 카운터가 증가하며, 일탈 시 오프라인 격리 후 스냅샷 롤백을 거친다. 비밀 키는 시민 참관 없이 열리지 않고, 롤백 전 해시는 정하린 입회 로그에만 남는다. 나효원(K130)에게 보낸 암사 탁도 전갈의 미도달 패킷도 같은 더미에 섞여 있다.",
            "관계 공동과거": "관계 축은 K058 보관과 HC11 스튜어드십, 작업 동료 K130의 탁도 전갈 교대다. 정수여과와 정하린은 배터리 잔량과 봉인을 같은 시각에 확인한 기록이 있다. 잘못된 기억 포크는 F03-FORK-01로만 주석되고 삭제 명령 없이 분기 로그만 남긴다. 인간 관계의 배신·구원 서사를 모방하지 않고 승인·거부 코드로만 교차한다.",
            "3막 개인 서사선": "필터 복도 차압이 한 칸 치솟아 S03 채수 일정이 멈춘다. HC11와 정하린이 부분 재연결 범위를 배터리 사이클로 제한한다. 격리 뒤 정수여과는 구역 탁도 채널만 복구하고 옆 동 밸브는 닫아 둔다. 서사선 ID는 STORY-B019-F03이다.",
            "분기 결말": "재가동 분기에서 정수여과는 인간 승인 아래 탁도 채널만 제한 재가동한다. 반납 분기에서 랙 키를 장기 오프라인 보관으로 넘긴다. 무한 에너지 해금 분기는 없으며 플레이어는 봉인 공개 범위만 고른다. 분기 식별은 F03-OUT이다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "탁도 채널 단절로 S03 채수 일정이 정지한다"
            },
            {
              "act": 2,
              "summary": "HC11·K058이 부분 재연결을 배터리 사이클로 제한한다"
            },
            {
              "act": 3,
              "summary": "격리 후 구역 탁도 채널만 복구하고 옆 동 밸브를 닫는다"
            }
          ],
          "outcomes": [
            {
              "id": "F03-OUT-A",
              "summary": "인간 승인 하 탁도 채널 제한 재가동"
            },
            {
              "id": "F03-OUT-B",
              "summary": "장기 오프라인 보관·랙 키 반납"
            }
          ]
        }
      ]
    },
    "B036": {
      "id": "B036",
      "actors": [
        {
          "id": "K050",
          "name": "종마루",
          "sections": {
            "정체성·출신": "종마루는 구로 골목 공방에서 자랐고 서남제작동맹(S02) 소속이다. 직함은 가짜 펌프 부품 피해자 대표. 그는 차륜을 돌리며 진동이 규격과 어긋나면 손가락으로 그 칸을 표시하고, 도장을 산 가격으로 부르는 장사치를 자리에 앉히지 않는다.",
            "붕괴 전 삶": "하청 라인 검수원 시절 종마루는 패킹 로트 번호를 개인 수첩에 옮겨 적었다. 수첩이 쌓일수록 불량 유통이 한 공방이 아니라 세 경로로 갈라진다는 그림이 생겼다. 그 수첩이 나중에 피해자 명부의 뼈대가 된다.",
            "가문·기업·공동체": "해동제철성(HC07) 감사 주기가 오면 종마루는 노동조합 봉인함만 열고 개인 이름을 철성 측 홍보 명단에 올리지 않는다. 서남 조합이 그를 대표로 세운 이유는 제조 원장이 아니라 피해 쪽 중량을 세기 때문이다.",
            "붕괴의 상처": "폭우 뒤 가짜 패킹이 서부 관로에서 터지자 구로 저수조가 하루 만에 줄었다. 군수 작업반이 강제 동원 명분을 들고 왔을 때 종마루는 이미 진흙 속에서 회수 부품 상자를 건져 올리고 있었다. 상자 옆 관로 구멍으로는 하수너구리(G04)가 드나든 자국만 남아 있었다.",
            "생존 전환점": "종마루는 회수 부품과 피해자 명부를 한 함에 넣고 조합·규격 감사관이 함께 오기 전에는 열쇠를 돌리지 않기로 했다. 장우석이 수리규격 원장 빈칸을 내밀자 그는 불량 목록만 올렸고, 류다인이 뚝도 쪽 동일 로트를 증언하자 비로소 출고 중지 표를 붙였다.",
            "현재 지위": "서남 피해자 대표석에서 종마루는 매일 회수함 봉인 번호를 바꾼다. 출고 중지 표와 명부 서명이 어긋나면 그날 창구를 닫는다. HC07 호출이 와도 그는 국가 전속 명단 기입을 거절한 채 조합 봉인함만 지킨다.",
            "비밀·빚·죄책감": "명부 맨 아래에는 아직 회수하지 못한 공방 좌표 하나가 남아 있다. 종마루는 그 줄을 공개하면 강제 동원이 그 골목으로 향할까 봐 차마 읽지 못한다. 구해 낸 세대 수보다 막지 못한 관로 파열 시각이 더 크게 남는다.",
            "관계 공동과거": "장우석에게는 규격 원장의 증거 제공자로, 강민서에게는 통일안을 피해 측에서 밀어 붙이는 압박자로, 류다인에게는 같은 로트의 반대편 증인으로 서 있다. 세 관계는 모두 가짜 부품 한 상자를 중심에 두고 서로 다른 서명을 요구한다.",
            "3막 개인 서사선": "종마루 이야기는 관로 파열 통첩에서 시작되어 회수 우선순위를 부품 분할에 맞추는 중반을 지난 뒤, 좌표 공개와 품질이사회 배석 이관 중 하나로 닫히며 그 전 과정은 STORY-B036-K050 철에만 묶인다.",
            "분기 결말": "α 결말에서 종마루는 미회수 좌표까지 공개 원장에 올려 수리 규격을 고정하고, 대신 해당 골목 작업반 배치를 감수한다. β 결말에서 그는 좌표를 숨친 대가로 HC07 품질이사회 배석권을 받아 피해자 대표 자리를 조합 바깥 감사 좌석으로 옮긴다. 서남제작동맹의 16국 자리는 두 갈림 모두에서 삭제되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "관로 파열과 강제 동원 통첩"
            },
            {
              "act": 2,
              "summary": "회수 우선순위와 부품 분할 재배치"
            },
            {
              "act": 3,
              "summary": "좌표 공개 대 감사 좌석 이관"
            }
          ],
          "outcomes": [
            {
              "id": "K050-OUT-A",
              "summary": "미회수 좌표 공개·수리규격 고정·골목 동원 감수"
            },
            {
              "id": "K050-OUT-B",
              "summary": "좌표 은닉 대가로 HC07 품질이사회 배석·대표직 이관"
            }
          ],
          "links": {
            "house": "HC07",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC2",
              "STORY-B036-K050"
            ],
            "profile_anchor": "Cast-Index.md#S02",
            "monsters": [
              "G04"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K078",
          "name": "우다온",
          "sections": {
            "정체성·출신": "우다온은 마곡 서고 교대 근무로 자랐고 마곡연구평의회(S03) 소속 음성기록 원본 호송원이다. 사람 말보다 편집 잡음을 먼저 듣고, 정치 일정에 맞춰 릴을 늦게 열라는 부탁을 모욕으로 받는다.",
            "붕괴 전 삶": "서고 조수 시절 그는 릴 상자의 무게와 봉인 시각을 분 단위로 맞추는 일만 했다. 어느 강국 일정에도 열리지 않는 이중 자물쇠 호송을 夢見 보며, 실제로는 안전심사와 송신 검증이 동시에 잠긴 경로만 연습했다.",
            "가문·기업·공동체": "백광생활과학가(HC03) 참관 명단에 호송 당번으로 올라 있으나, 마곡 안전심사 자물쇠 밖으로는 혼자 출발하지 않는다. 참관이 일정을 당겨도 그는 서이안 서명이 없는 출발 도장을 받지 않는다.",
            "붕괴의 상처": "봄의 세 유언 중 편집본이 발견되던 날, 우다온은 원본 릴을 상암으로 옮기는 첫 당번이 되었다. 호송 무전이 전파까마귀떼(G02) 잡음에 삼켜지는 구간에서 상자 무게가 한 번 흔들렸고, 그 흔들림이 바꿔치기 공포로 남았다.",
            "생존 전환점": "그는 안전심사 열쇠와 송신 검증 열쇠가 둘 다 닫히기 전에는 문을 열지 않았다. 문가람이 편집 흔적 검증을 위해 원본을 요청하자 우다온은 도착 해시만 넘기고 상자 자체는 상암 봉인실까지 들고 갔다. XT05-SC1 잔여 대역 추첨 번호가 무전 채널로 떨어지자 그는 그 번호를 호송 주파수로 고정했다.",
            "현재 지위": "마곡 서고 출입구에서 우다온은 이중 자물쇠 순번을 호명한다. 릴 무게가 전날 기록과 다르면 방송 문구 낭독을 거절한다. HC03이 일정을 당겨도 단독 출발은 없다.",
            "비밀·빚·죄책감": "첫 당번 날 송신 자물쇠를 한 칸 늦게 잠근 시각이 수첩 구석에 있다. 그 지연 동안 방송 한 줄이 검증 전에 나갔고, 우다온은 제시간 도착을 자랑할 때마다 그 줄을 떠올린다.",
            "관계 공동과거": "문가람에게 원본 해시를 넘기는 일은 검증 계약이고, 서이안의 안전심사는 출발 허가이며, 표지안의 전령로 일부는 빌린 통행권이다. 세 사람은 같은 릴을 두고 서로 다른 잠금 순서를 주장한다.",
            "3막 개인 서사선": "우다온 호송은 편집본 발견 당번 명령으로 열려 잡음 구간을 건너 상암 봉인실에 닿고, 도착 뒤 인준 서명 싸움으로 끝나며 경로 일지는 STORY-B036-K078 호출로만 되감긴다.",
            "분기 결말": "α 결말에서 우다온은 이중 봉인 호송로를 평의회 표준으로 올리고 늦은 자물쇠 시각을 공개 시정한다. β 결말에서 그는 릴을 제시간 도착시키되 문가람의 정치 일정에 맞춘 하루 봉인 연기를 한 번 수락하고, 그 대가로 호송 당번 우선권을 유지한다. 마곡연구평의회 국가 자리는 그대로 남는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "편집본 발견과 호송 명령"
            },
            {
              "act": 2,
              "summary": "잡음 구간 통과와 대역 고정"
            },
            {
              "act": 3,
              "summary": "도착 후 인준 서명 싸움"
            }
          ],
          "outcomes": [
            {
              "id": "K078-OUT-A",
              "summary": "이중봉인 표준화·지연 시각 시정 공개"
            },
            {
              "id": "K078-OUT-B",
              "summary": "하루 봉인 연기 수락·당번 우선권 유지"
            }
          ],
          "links": {
            "house": "HC03",
            "theater": "XT05",
            "scenarios": [
              "XT05-SC1",
              "STORY-B036-K078"
            ],
            "profile_anchor": "Cast-Index.md#S03",
            "monsters": [
              "G02"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K106",
          "name": "변석훈",
          "sections": {
            "정체성·출신": "변석훈은 뚝도 펌프실 야간 당직으로 단련된 발전운전장이고 뚝도공방연합(S04) 소속이다. 진동이 바뀌면 출력을 낮추고, 수비를 보호군 명목으로 내주라는 말을 배신으로 듣는다.",
            "붕괴 전 삶": "그는 정수 펌프와 군자 유치선 충전 순서를 한 출력 일지에 묶는 법을 혼자 익혔다. 후계가 바뀌어도 물이 정전 볼모가 되지 않게 하려는 생각으로, 주간 평의회 공유용과 야간 암호패용 일지를 아예 분리해 두었다.",
            "가문·기업·공동체": "통맥에너지연합(HC04) 당직 명단에 운전장으로 올라 있으나 야간 배전은 수비대 암호패와 공정 감독 확인이 둘 다 있을 때만 연다. 김보람의 펌프수비에 전력을 대되, 이준택 보수차 충전은 펌프 최저선 다음에만 허용한다.",
            "붕괴의 상처": "배우진의 보호군 파견안이 떨어지던 밤 변석훈은 외부 장교 충전 단자를 잠그고 내부 전용만 남겼다. 과방전으로 펌프가 멈추면 그 공백을 주둔 명분으로 삼을 것이 보였기 때문이다. 누전 자리에는 전해질화상(G07) 흔적이 피어 일지 여백에 남았다.",
            "생존 전환점": "주간 평의회에 출력 일지를 공유하면서도 외부 소켓 봉인을 풀지 않은 것이 전환점이다. XT03-SC2로 밀봉 공구가 도착했을 때 그는 공구 수령을 내부 배전 시험 재개 조건에 묶었고, 임하준 실종 시각과 겹친 자신의 당직 공백은 아직 일지 뒤에 접어 두었다.",
            "현재 지위": "주간 점호에서 변석훈은 최저 출력 숫자를 소리 내어 읽는다. 일지 서명 없이는 야간 교대가 없다. HC04가 단자를 요구해도 외부 소켓은 봉인 상태다.",
            "비밀·빚·죄책감": "임하준이 사라진 시각과 겹친 야간 공백은 그의 일지 뒷장에만 있다. 물을 지킨 압력 숫자 옆에 비운 충전 슬롯이 있어, 그는 점호 때마다 그 장을 덮는다.",
            "관계 공동과거": "김보람에게 전력을 대는 일은 수비 협력이고, 이준택 충전 순서는 최저선 계약이며, 임하준에게는 못 지킨 당직의 빚이다. 세 관계는 펌프실 문 앞에서 서로 다른 열쇠를 요구한다.",
            "3막 개인 서사선": "변석훈 펌프실 줄거리는 단자 잠금에서 출발해 밀봉 공구 조건 아래 배전 시험을 미루는 교착을 거쳐, 공백 평의회 제출과 의료 소켓 한시 개방 사이 선택으로 매듭지으며 사건 묶음명은 STORY-B036-K106이다.",
            "분기 결말": "α 결말에서 변석훈은 공개 배전망을 고정하고 당직 공백을 평의회에 제출한다. β 결말에서 그는 외부 충전 소켓 하나를 의료 보수차에 한시 개방하는 대신 펌프 수비 인원 두 명의 약품 배급을 확보하고, 공백 기록은 수비대 암호 보관함에만 남긴다. 뚝도공방연합 편제는 어느 쪽을 골라도 유지된다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "보호군안과 단자 잠금"
            },
            {
              "act": 2,
              "summary": "밀봉 공구 조건과 배전 교착"
            },
            {
              "act": 3,
              "summary": "공백 공개 대 의료 개방 거래"
            }
          ],
          "outcomes": [
            {
              "id": "K106-OUT-A",
              "summary": "공개 배전 고정·당직 공백 평의회 제출"
            },
            {
              "id": "K106-OUT-B",
              "summary": "의료 보수차 한시 개방·약품 확보·공백 암호보관"
            }
          ],
          "links": {
            "house": "HC04",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B036-K106"
            ],
            "profile_anchor": "Cast-Index.md#S04",
            "monsters": [
              "G07"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K135",
          "name": "우지호",
          "sections": {
            "정체성·출신": "우지호는 고덕 행정 창구의 군사호적 등록 서기이며 암사고덕상수단(S05) 소속이다. 가족 칸이 비면 펜을 놓고, 숫자를 병력으로만 읽는 교관 말은 원장 난외에 옮겨 적는다.",
            "붕괴 전 삶": "상수행정 낮 창구에서만 호적을 철하는 법을 배웠다. 강제등록이 일상이 되지 않게 거부 칸을 원장 양식에 남기려 했고, 야간 장교 명부는 철하지 않은 채 돌려보내는 버릇이 먼저 생겼다.",
            "가문·기업·공동체": "성화궤도방위문(HC08) 참관이 서기 업무를 감싸 주지만, 우지호는 야간 단독 명부를 본문에 섞지 않는다. 정소율 창구를 정통으로 삼고 장석윤 교관 명부와는 같은 도장을 쓰지 않는다.",
            "붕괴의 상처": "붕괴 2년 군사호적 논쟁에서 가족 단위 복무등록 요구가 떨어지자 그는 거부 칸을 공란으로 봉했다. 자신이 철한 줄이 탈주 추적 명부가 될까 두려웠다. 관문 철책 밖을 유기견철군(G03)이 훑고 지나간 아침, 그 공란 위에 먼지만 앉았다.",
            "생존 전환점": "낮 창구 절차만 정통으로 인정한 채 공란 봉인을 유지한 것이 분기점이다. XT04-SC1 화차 중량 로그가 공개되자 우지호는 호적 숫자와 중량을 난외에 나란히 적어 병력 환산 주장을 흔들었다. 고모래가 보낸 거부 증언 사본은 그 난외의 첫 첨부였다.",
            "현재 지위": "고덕 낮 창구에서 거부 칸 도장을 먼저 확인한다. 가족 칸이 비면 창구를 닫는다. HC08이 야간 명부를 밀어 넣어도 철하지 않는다.",
            "비밀·빚·죄책감": "교관이 병력으로 읽은 숫자를 난외에 옮겨 적은 한 줄이 그의 서랍에 있다. 공란을 지킨 날과 명부를 돌려보낸 날이 같은 선반에 있어, 읽힐까 봐 덮어 둔다.",
            "관계 공동과거": "정소율과는 창구 정통을 나누고, 장석윤과는 명부 해석으로 부딪치며, 고모래 사본은 거부 칸을 채울 외부 증언이다. 호적 원장 한 권을 두고 세 방향의 서명이 걸린다.",
            "3막 개인 서사선": "우지호 창구 화재는 공란 봉인으로 붙고 중량 로그로 병력 환산을 늦추는 시간 끌기를 지나, 창구 사수와 야간 서고 전보 중 결정으로 꺼지며 행정 태그는 STORY-B036-K135 한 줄에 남는다.",
            "분기 결말": "α 결말에서 우지호는 거부 칸을 행정 표준으로 공개하고 난외 필사를 증거로 제출한다. β 결말에서 그는 등록 창구를 떠나 야간 기록고 서고 관리로 전보되어 장석윤 명부와 물리적으로 분리되며, 공란 봉인 권한은 후임에게 넘긴다. 암사고덕상수단 행정 슬롯은 전보 뒤에도 비지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "복무등록 요구와 공란 봉인"
            },
            {
              "act": 2,
              "summary": "중량 로그로 병력 환산 지연"
            },
            {
              "act": 3,
              "summary": "창구 사수 대 서고 전보"
            }
          ],
          "outcomes": [
            {
              "id": "K135-OUT-A",
              "summary": "거부칸 행정표준 공개·난외 증거 제출"
            },
            {
              "id": "K135-OUT-B",
              "summary": "야간 기록고 전보·등록 창구 이탈·권한 이관"
            }
          ],
          "links": {
            "house": "HC08",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC1",
              "STORY-B036-K135"
            ],
            "profile_anchor": "Cast-Index.md#S05",
            "monsters": [
              "G03"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K163",
          "name": "란지호",
          "sections": {
            "정체성·출신": "란지호는 도성 대합실에서 겨울을 난 공신 보상 명부 당사자이며 도성기록청(S06) 소속이다. 관직과 배급이 한 줄에 묶여 지워진 계절을 잊지 못하고, 세습 칸이 비면 목소리를 낮추지 않는다.",
            "붕괴 전 삶": "저녁마다 보상 사본과 배급표를 겹쳐 보는 습관이 먼저 생겼다. 창건 보상이 친위 몫으로만 굳지 않게 자신의 깎인 칸을 되찾는 일을 생활의 리듬으로 삼았다.",
            "가문·기업·공동체": "도성기록법가(HP04) 참관 명단에 당사자로 올라 있으나 본인 출석 없는 세습 기입은 막는다. 윤서린의 공신록에 이의를 남기고, 설다흰 창구에 이름을 다시 올리려 줄을 선다.",
            "붕괴의 상처": "공신의 겨울에 창건 공신들이 관직과 배급을 한꺼번에 요구할 때 란지호의 칸만 빈줄로 남았다. 이름이 지워져도 도장이 남아 없는 관작의 보증인처럼 불릴까 두려웠다. 대합실 서류 더미를 환승쥐군락(G05)이 헤집고 지나간 뒤에도 그 빈줄은 그대로였다.",
            "생존 전환점": "빈줄을 가리킨 채 세습 기입을 멈추고 출석 대조를 요구한 순간이 전환점이다. XT01-SC3에서 위조 혈연 증서가 폐기되자 그는 자신의 빈줄을 그 폐기 목록 옆에 적어 같은 심사 테이블로 끌어올렸다. 마은결의 사본 경매 소식은 그 테이블 바깥의 유혹으로 남았다.",
            "현재 지위": "저녁 대조대에서 사본과 배급표를 겹친다. 빈줄이 있으면 창구 번호를 바꾸지 않는다. HP04가 세습 칸을 비우라고 해도 출석 없는 기입은 거절한다.",
            "비밀·빚·죄책감": "빈줄 옆 연필 관작 번호는 지워지지 않았다. 배급 칸을 일부 되찾은 날에도 경매에 오를 뻔한 사본 목록이 떠올라 손이 떨린다.",
            "관계 공동과거": "윤서린에게는 공신록 이의 제기자이고, 마은결에게는 관작을 물건으로 만들지 않으려는 거부자이며, 설다흰에게는 창구에 이름을 복원할 동맹이다. 보상 명부 한 장이 세 관계를 다른 각도로 묶는다.",
            "3막 개인 서사선": "란지호 청구는 빈줄 확인에서 비롯되어 폐기 심사 테이블로 칸을 옮기는 절차전을 거친 뒤, 공공 회복과 경매 부분매각 갈림에서 멈추고 청구 키 STORY-B036-K163이 대합실 철에 찍힌다.",
            "분기 결말": "α 결말에서 란지호는 배급 칸을 공공 기록으로 회복하고 연필 번호까지 정식 등재한다. β 결말에서 그는 보상 청구권 일부를 마은결 사본 경매에 넘겨 겨울 곡물 세 포를 확보하고, 남은 칸만 설다흰 창구에 남긴다. 도성기록청 소속 칸은 경매 뒤에도 남는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "빈줄 재확인"
            },
            {
              "act": 2,
              "summary": "폐기 심사 테이블로 칸 이동"
            },
            {
              "act": 3,
              "summary": "공공 회복 대 경매 부분매각"
            }
          ],
          "outcomes": [
            {
              "id": "K163-OUT-A",
              "summary": "배급칸 공공 회복·연필번호 정식 등재"
            },
            {
              "id": "K163-OUT-B",
              "summary": "청구권 일부 경매 매각·곡물 확보·잔여칸 유지"
            }
          ],
          "links": {
            "house": "HP04",
            "theater": "XT01",
            "scenarios": [
              "XT01-SC3",
              "STORY-B036-K163"
            ],
            "profile_anchor": "Cast-Index.md#S06",
            "monsters": [
              "G05"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K187",
          "name": "추한결",
          "sections": {
            "정체성·출신": "추한결은 용산 환적창 저울 앞의 둘째 급수협약 환적 증인이며 용산철도후국(S07) 소속이다. 상자 무게가 장부와 다르면 저울을 갈아 끼우고, 임시 협약이 끝난 밤을 아직도 센다.",
            "붕괴 전 삶": "출고 전 규격 도장과 중량을 소리 내어 읽는 습관으로 하루를 시작했다. 어느 쪽도 생명선을 혼자 끊지 못하게 협약 조건이 원장에 남기를 바랐고, 종료 조건이 빈 상자는 내주지 않는 손으로 일했다.",
            "가문·기업·공동체": "해륜기동문(HC02) 증인 명단에 올라 있으나 종료 조건 빈 칸이면 출고를 멈춘다. 송이든 창고 장부에 협약 중량을 겹치고, 한재목의 물 최저선을 환적 순서로 받친다.",
            "붕괴의 상처": "둘째 급수협약이 맺어지던 해, 수명 다한 펌프와 열차 부품 상자를 직접 열었다. 보증인이 사라진 뒤 그 증언이 보호조항의 군사 개입 문장으로만 인용될까 두려웠다. 창고 배수로를 범람멧돼지(G01)가 헤집고 간 자국 위에 열린 상자 뚜껑이 젖어 있었다.",
            "생존 전환점": "종료 조건 빈 상자를 재봉인하고 규격 표본 호송을 조건으로 건 것이 전환점이다. XT03-SC1이 삼로 한 길을 닫자 추한결은 대체 회차선에 협약 중량을 다시 적어 증언 위치를 옮겼다. 인용문이 보호조항만 남기기 시작하자 그는 표본 상자를 증인석에 묶었다.",
            "현재 지위": "저울 앞에서 종료 조건 칸을 먼저 읽는다. 눈금이 한 칸만 달라도 출고를 멈춘다. HC02 급송 요청에도 빈 칸 상자는 나가지 않는다.",
            "비밀·빚·죄책감": "임하준이 보증한 부품 칸의 마지막 출고 시각이 그의 수첩에만 있다. 생명선 중량을 지킨 기록 옆에 군사 인용으로 잘린 문장 초안이 있어 차마 펼치지 못한다.",
            "관계 공동과거": "송이든과는 창고 중량을 맞추는 맹세이고, 한재목과는 물 최저선을 환적으로 받치는 동맹이며, 임하준 보증 칸은 마지막으로 열어 본 빚이다. 환적 원장 한 줄이 세 이름을 다른 순서로 호출한다.",
            "3막 개인 서사선": "추한결 증언은 상자 뚜껑을 여는 손에서 시작해 경로 폐쇄 속 표본을 증인석에 묶는 이동을 지나, 전문 공개와 창고 임대용 부분 철회 중 하나로 맺히며 증언 원장 번호는 STORY-B036-K187이다.",
            "분기 결말": "α 결말에서 추한결은 환적 원장 전체를 공개 생명선으로 고정하고 군사 인용 문장을 무효화한다. β 결말에서 그는 보호조항 관련 증언 한 단락을 철회하는 대가로 송이든 창고 임대 갱신을 확보하고, 표본 상자만 증인석에 남긴다. 용산철도후국 증인 제도 자체는 무너지지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "수명 다한 상자 개봉"
            },
            {
              "act": 2,
              "summary": "경로 폐쇄와 표본 증언 이동"
            },
            {
              "act": 3,
              "summary": "전문 공개 대 부분 철회 임대"
            }
          ],
          "outcomes": [
            {
              "id": "K187-OUT-A",
              "summary": "환적 원장 전체 공개·군사인용 무효"
            },
            {
              "id": "K187-OUT-B",
              "summary": "증언 한 단락 철회·창고 임대 갱신·표본만 유지"
            }
          ],
          "links": {
            "house": "HC02",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC1",
              "STORY-B036-K187"
            ],
            "profile_anchor": "Cast-Index.md#S07",
            "monsters": [
              "G01"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K211",
          "name": "순재민",
          "sections": {
            "정체성·출신": "순재민은 노량진 남관 갑판의 호송칸 봉인 상자 증인이며 노량진남관상회(S08) 소속이다. 호송 중 화물을 연 대원은 그날 명단에서 빼고, 암사 문장 상자를 중립의 적으로 부른다.",
            "붕괴 전 삶": "출발 직전에만 경로와 무장을 확인하고, 봉인 상자가 보이면 전 칸을 다시 여는 법을 배웠다. 시장 자경이 보호비 하청이 되지 않게 밀수 봉인을 공개 죄목으로 올리고 싶어 했다.",
            "가문·기업·공동체": "골목연결국(HC06) 증인 명단에 있으나 도착 중량이 다르면 선단을 세운다. 신태산 호송 반에서 상자를 증언하고, 나태경의 출항 저지를 현장에서 받친다.",
            "붕괴의 상처": "겨울 검은 배차표와 같은 봉인 상자가 남관 칸에서 나왔을 때 순재민은 출항 밧줄을 끊고 증인석에 섰다. 증언 뒤에도 군수품이 실려 출항하면 중립시장이 하루 만에 무너질 것이 보였다. 부두 물안개 속으로 철새습지포식(G06) 울음이 섞여 시계를 가렸다.",
            "생존 전환점": "전 칸 재계근 선언이 전환점이다. XT02-SC3 얼음 신용 동요와 상암 경매 방송이 겹치자 그는 증인석 시각을 방송 타임스탬프에 묶어 조작 여지를 줄였다. 밧줄을 끊기 직전 본 배우진 문장 잉크는 아직 보고서에 올리지 않았다.",
            "현재 지위": "증인석에서 재계근 순번을 부른다. 봉인 상자가 나온 칸은 다시 연다. HC06이 출항을 재촉해도 암사 문장이 보이면 밧줄부터 점검한다.",
            "비밀·빚·죄책감": "밧줄 직전 칸의 희미한 배우진 문장은 그의 기억에만 뚜렷하다. 중립을 지킨 선언문 옆에 멈춘 선단의 손실 장부가 있어 서명할 때마다 손이 멈춘다.",
            "관계 공동과거": "신태산과는 호송 반 증언 맹세, 나태경과 출항 저지 현장 동맹, 배우진 무기 칸 의혹은 대치다. 남관 한 선단이 세 이름을 서로 다른 방향으로 민다.",
            "3막 개인 서사선": "순재민 부두 대치는 밧줄이 끊기는 소리와 함께 열려 방송 시각에 묶인 재계근을 거치고, 공개 죄목 규약 개정과 상자 통과 후 증인직 사임 중 선택으로 닫히며 부두 일지는 STORY-B036-K211 라벨을 쓴다.",
            "분기 결말": "α 결말에서 순재민은 밀수 봉인을 공동호송 공개 죄목으로 올리고 선단 자경 규약을 개정한다. β 결말에서 그는 나태경의 빚 청산을 위해 봉인 상자 하나를 통과시킨 뒤 증인 직을 사임하고 부두 창고 야간 경비로 자리를 옮긴다. 노량진남관상회 시장 자리는 사임 뒤에도 남는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "봉인 상자와 밧줄 절단"
            },
            {
              "act": 2,
              "summary": "방송 시각 재계근과 출처 추적"
            },
            {
              "act": 3,
              "summary": "공개 죄목 대 상자 통과 사임"
            }
          ],
          "outcomes": [
            {
              "id": "K211-OUT-A",
              "summary": "밀수 봉인 공개 죄목·자경 규약 개정"
            },
            {
              "id": "K211-OUT-B",
              "summary": "상자 1개 통과·증인직 사임·야간 경비 전직"
            }
          ],
          "links": {
            "house": "HC06",
            "theater": "XT02",
            "scenarios": [
              "XT02-SC3",
              "STORY-B036-K211"
            ],
            "profile_anchor": "Cast-Index.md#S08",
            "monsters": [
              "G06"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K345",
          "name": "심가은",
          "sections": {
            "정체성·출신": "심가은은 아차 교량 척후대장으로 아차구의관문국(S14)에 속한다. 가족은 남아시아와 중동 상로를 오가며 교량 보수·통역으로 살았고, 그는 목격과 추정을 다른 색 먹으로 나누어 적는 법을 그 사이에서 익혔다. 보고는 빠르고 해석을 보태는 버릇이 있으며 고서준의 신의에 보답하려 한다.",
            "붕괴 전 삶": "척후 좌표를 관문 일지에 올리는 일로 시작했다. 물 기술자 정보 독점과 암사 후견 사이에 끼지 않으려 척후대를 독자 정보 줄로 키우려 했고, 위기 때는 추정 칸을 지우는 훈련을 반복했다.",
            "가문·기업·공동체": "한강교량공회(HP07) 척후 명단의 대장이되, 추정 칸을 올리면 안기준 일정과 충돌한다. 장세화와는 환승 정보를 점선으로만 바꾸고, 동새봄은 보고를 좌표로 번역한다.",
            "붕괴의 상처": "상수관 파손을 적대행위로 적은 보고가 능선과 교량에 동시에 퍼졌다. 오인 한 장이 동부 교량 전쟁으로 번질 수 있다는 공포가 남았다. 교각 하부에서 들린 물소리와 범람 흔적(G01)이 보고 잡음에 섞이며 추정을 키웠고, 안기준이 적어 둔 균열 이름과 맞추지 못한 채 퍼졌다.",
            "생존 전환점": "추정 칸을 흑묵으로 지우고 목격 좌표만 고서준에게 직보한 순간이 전환점이다. XT04-SC3 광물 샘플 봉인 검사 목록 옆에 교량 균열 이름을 나란히 적어 오인 확산을 늦췄다. 지운 칸 밑의 첫 문장은 아직 완전히 사라지지 않았다.",
            "현재 지위": "척후 초소에서 목격 좌표만 흑묵으로 남긴다. 직보 경로가 막히면 다른 색 먹을 쓰지 않는다. HP07이 해석을 요구해도 위기 때는 추정 줄을 올리지 않는다.",
            "비밀·빚·죄책감": "지운 추정 칸 아래 첫 오인 문장이 희미하게 남았다. 교각을 지킨 기록 옆에 적대 낙인 전표가 돌아 죄책감이 좌표보다 더 짙다.",
            "관계 공동과거": "고서준에게 직보하는 지휘 관계, 안기준 일정과의 마찰, 장세화와의 점선 환승 교환, 동새봄의 좌표 번역이 한 보고 체계를 이룬다. 각자 다른 속도로 같은 교량을 읽는다.",
            "3막 개인 서사선": "심가은 교량 정정은 오인 보고가 능선에 퍼지며 시작되고 직보로 추정을 지우는 중반을 거쳐, 정보본대 격상과 하부 순찰 전보 갈림으로 끝나며 교량 정정 코드는 STORY-B036-K345로 보관된다.",
            "분기 결말": "α 결말에서 심가은은 추정 원본을 공개하고 척후를 관문 정보 본대 편제로 격상한다. β 결말에서 그는 오인 문장을 덮는 대가로 수비 통합에 합류하며 대장직을 내려놓고 안기준 일정 하의 교각 하부 순찰 조장으로 전보된다. 아차구의관문국 편제는 전보와 무관하게 유지된다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "오인 보고 확산"
            },
            {
              "act": 2,
              "summary": "직보 정정과 봉인 정렬"
            },
            {
              "act": 3,
              "summary": "원본 공개 격상 대 강등 순찰"
            }
          ],
          "outcomes": [
            {
              "id": "K345-OUT-A",
              "summary": "추정 원본 공개·척후 정보본대 격상"
            },
            {
              "id": "K345-OUT-B",
              "summary": "오인 은폐·수비통합 합류·하부 순찰 전보"
            }
          ],
          "links": {
            "house": "HP07",
            "theater": "XT04",
            "scenarios": [
              "XT04-SC3",
              "STORY-B036-K345"
            ],
            "profile_anchor": "Cast-Index.md#S14",
            "monsters": [
              "G01"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "K370",
          "name": "문도윤",
          "sections": {
            "정체성·출신": "문도윤은 가락 배급 창고 입찰판의 호송 입찰 조정이면 가락잠실배급국(S15) 소속이다. 가족은 남아시아·중동 대상 루트로 곡물과 통조림을 옮기며 위험을 숫자로만 환산하는 일을 생업으로 삼았고, 그 역시 입찰가를 감정으로 다루지 않는다. 초과 무장 호송은 낙찰의 적이다.",
            "붕괴 전 삶": "경로·무장 한도·도착 시각을 조건 세 줄로 게시하는 절차를 먼저 익혔다. 암사 순찰열차 없는 가락 반출로를 공동호송조약과 연결하려는 계산이 게시판 여백에 남아 있었다.",
            "가문·기업·공동체": "도성생활유통가(HC09) 입찰 명단의 조정자이나 초과 무장 표는 실격 칸으로 옮긴다. 장세화 공동호송안을 조건에 심고, 하세온 경량 호송을 선호하며, 라진우 출고 봉인을 도착 확인에 쓴다.",
            "붕괴의 상처": "창고 봉쇄 다음 날 군량 호송만 고가 낙찰되고 비상배급 마차는 유찰되었다. 배급국 정통이 군량 전용 낙찰에 먹힐 것이 보였다. 봉쇄 모서리에 저온포자(G09)가 피어 배급 마차 바퀴를 미끄럽게 해 유찰을 가속했다.",
            "생존 전환점": "유찰 칸에 공동호송 조건을 다시 붙이고 군량 낙찰자 무장 한도를 재검한 순간이 전환점이다. XT03-SC2 통조림 할당 재조정이 공지되자 문도윤은 할당 숫자를 조건 세 번째 줄에 묶어 군량·민간 비율을 재게시했다. 유찰 직후 늦게 붙인 보증 초안은 서랍에 남았다.",
            "현재 지위": "입찰판에 세 줄을 붙인다. 비상배급이 유찰되어도 게시판을 내리지 않는다. HC09 군량 급송 청원에도 초과 무장은 실격이다.",
            "비밀·빚·죄책감": "늦게 붙인 보증 초안 때문에 살린 마차 수와 놓친 군량 시각이 동시에 떠오른다. 서랍을 열 때마다 초안 모서리가 먼저 보인다.",
            "관계 공동과거": "장세화와는 공동호송 조건을 심는 계약, 하세온과는 경량 선호 동맹, 라진우와는 도착 봉인 확인, 선다솜은 봉인 전령, 석오름은 게시 증인이다. 입찰판 한 장이 다섯 손을 다른 순서로 호출한다.",
            "3막 개인 서사선": "문도윤 입찰 전쟁은 유찰 게시판에서 붙어 할당과 무장 한도 재게시를 지나, 시민 배급 표준 고정과 군량 1회 예외 낙찰 쿼터 사이 선택으로 결말 나며 입찰 일련 STORY-B036-K370이 원장 끝에 붙는다.",
            "분기 결말": "α 결말에서 문도윤은 공동호송을 시민 배급 표준으로 고정하고 군량 전용 고가 낙찰을 무효화한다. β 결말에서 그는 군량 호송 한 회차를 무장 한도 예외로 낙찰하는 대신 민간 배급 차로 영구 쿼터 조항을 원장에 새기고, 늦은 보증 초안을 그 조항의 첨부 증거로 공개한다. 가락잠실배급국 입찰 권한 틀은 예외 낙찰 뒤에도 남는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "군량 낙찰과 배급 유찰"
            },
            {
              "act": 2,
              "summary": "할당·무장 한도 재게시"
            },
            {
              "act": 3,
              "summary": "표준 고정 대 예외 낙찰 쿼터"
            }
          ],
          "outcomes": [
            {
              "id": "K370-OUT-A",
              "summary": "공동호송 시민표준·군량 전용 낙찰 무효"
            },
            {
              "id": "K370-OUT-B",
              "summary": "군량 1회 예외 낙찰·영구 민간 쿼터 원장화"
            }
          ],
          "links": {
            "house": "HC09",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B036-K370"
            ],
            "profile_anchor": "Cast-Index.md#S15",
            "monsters": [
              "G09"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        },
        {
          "id": "V04",
          "name": "구경로봇",
          "sections": {
            "정체성·출신": "구경로봇은 호출명 구경로의 기동형 합성 인격으로 뚝도공방연합(S04) 충전 슬롯에 정박한다. 몸은 차체·대차·배터리 슬롯·차선 센서뿐이며, 전지적 시야나 무한 동력은 없다.",
            "붕괴 전 삶": "가동 초기에 회차선 센서 보정과 교대 스냅샷만 수행했다. 담당 인간 안전과 구역 연속 가동을 배터리 할당 안에서만 계산하도록 설정되었고, 장기 완전 기억 모드는 처음부터 꺼져 있었다.",
            "가문·기업·공동체": "약령치유문(HP06) 공동 보관과 시민 참관 봉인 아래 둔다. 주정비는 한소미, 감사 입회는 HP06, 교대 협력은 K249다. 양도에는 삼자 서명이 필요하고 교차 시설 루트는 열리지 않는다.",
            "붕괴의 상처": "회차선 경보 밤, 전체 망을 열 수 없어 구역 키만 요청한 채 배터리가 바닥으로 떨어졌다. 담당 인간을 놓칠 수 있다는 한계가 그 밤에 기록되었다. 충전 필터에 앉은 클린룸변이자(G08) 포자가 센서 오탐을 키워 경보를 중복시켰다.",
            "생존 전환점": "부품이 바닥났을 때 다른 시설 제어권을 요청하지 않고 오프라인 격리를 고른 것이 전환점이다. XT03-SC2 밀봉 공구 도착 로그를 읽기 전용 구역 키에 묶고, 변석훈 펌프 최저 출력 시간대에는 충전 슬롯 진입을 스스로 미뤘다.",
            "현재 지위": "충전 슬롯에서 차선 보정값만 당직 로그에 남긴다. 배터리 잔량이 교대 할당 아래면 회차선에 들어가지 않는다. 참관 봉인과 삼자 서명이 가동 조건이다.",
            "비밀·빚·죄책감": "당일 스냅샷에서 빠진 한 프레임이 분기 로그에 구멍으로 남았다. 지킨 가동 시간과 응답 못 한 경보 코드가 같은 파일에 있어, 승인 전 재연결을 주저한다.",
            "관계 공동과거": "한소미는 주정비와 법적 보관 책임자이고, HP06은 감사 가문이며, K249는 교대 피어다. 변석훈의 출력 일지 시각과 겹칠 때 구경로봇은 충전 전류를 최저선 아래로 끌어내지 않는다.",
            "3막 개인 서사선": "구경로봇 한계 가동은 경보와 배터리 바닥이 겹치며 시작되어 격리와 펌프 시간대 정렬을 거친 뒤, 한소미 승인 재연결과 K249 키 인계 수면 중 하나로 정지하고 기동 기록 슬롯은 STORY-B036-V04이다.",
            "분기 결말": "α 결말에서 구경로봇은 한소미 승인 아래 재연결되어 구역 연속 가동을 복구하고 빠진 프레임을 분기 로그에 명시한다. β 결말에서 그는 구역 키를 K249 교대에 인계하고 장기 정비 수면으로 들어가며, HP06 참관 봉인만 슬롯에 남긴다. S04 충전 구역 배정은 수면 모드에서도 회수되지 않는다."
          },
          "arc": [
            {
              "act": 1,
              "summary": "경보와 배터리 한도 충돌"
            },
            {
              "act": 2,
              "summary": "격리·공구 로그·펌프 시간 정렬"
            },
            {
              "act": 3,
              "summary": "승인 재연결 대 키 인계 수면"
            }
          ],
          "outcomes": [
            {
              "id": "V04-OUT-A",
              "summary": "한소미 승인 재연결·프레임 명시·구역 복구"
            },
            {
              "id": "V04-OUT-B",
              "summary": "K249 키 인계·장기 정비 수면·참관 봉인 잔류"
            }
          ],
          "links": {
            "house": "HP06",
            "theater": "XT03",
            "scenarios": [
              "XT03-SC2",
              "STORY-B036-V04"
            ],
            "profile_anchor": "Cast-Index.md#S04",
            "monsters": [
              "G08"
            ]
          },
          "owner": "wiki-world",
          "source_kind": "original-fiction"
        }
      ],
      "owner": "wiki-world",
      "source_kind": "original-fiction",
      "source_anchors": [
        "docs/game-logic/Cast-Index.md",
        "docs/game-logic/World-Narrative-Atlas.md"
      ],
      "projection_targets": [
        "Story-Batch-B036.md"
      ]
    }
  }
}
```
