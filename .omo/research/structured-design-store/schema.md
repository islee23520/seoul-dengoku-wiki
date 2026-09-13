# 《잔선》 구조화 설계 저장소 스키마 제안

측정: 2026-09-13, HEAD `5bd47ee0780186709ec71f95db0687fac2bf90fa`; 현재 WT를 읽었다. 기존 dirty/untracked 자료는 승인된 HEAD 데이터로 취급하지 않는다. 아래 테이블은 **신규 설계이며 현재 존재한다고 주장하지 않는다.**

근거 약칭: D=`.omo/research/structured-design-store/discovery-digest.md`, B=`.omo/research/structured-design-store/design-brief.md`, C=`.omo/research/structured-design-store/corpus.md`. D:112–117을 각각 C1–C6으로 부른다. D:15의 brief 권위 유보와 달리 이번 명시적 과업은 B를 필수 입력으로 지정했다. B:7과 `docs/adr/ADR-001-repository-delivery-policy.md:22–31`에 따라 Git 정본을 유지한다. DB는 정책 변경 승인 전 재생성 가능한 색인이다. 중앙 저작권한은 미승인이다.

## 1. 엔티티·개정·관계·출처·검토 테이블

**SQLite SQL DDL 계획 예시 / PLANNED EXAMPLE / 미실행.** 설치·DB 생성·DDL 실행은 하지 않았다. 공통 관계만 정규화하고 타입별 서술은 JSON으로 보존한다. FK 활성화와 타입 검증은 향후 필수 조건이지 현재 기능이 아니다.

```sql
CREATE TABLE entity (
  entity_id TEXT PRIMARY KEY
);
CREATE TABLE revision (
  revision_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES entity,
  schema_id TEXT NOT NULL,
  domain TEXT NOT NULL CHECK(domain IN ('planning','world','rules')),
  kind TEXT NOT NULL,
  revision_label TEXT,
  owner TEXT,
  document_status TEXT,
  legacy_verification_state TEXT,
  source_kind TEXT CHECK(source_kind IN ('verified','inference','original-fiction')),
  implementation_state TEXT,
  last_verified_commit TEXT,
  as_of TEXT,
  valid_from TEXT,
  valid_to TEXT,
  fictional_time_json TEXT CHECK(json_valid(fictional_time_json)),
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  content_sha256 TEXT NOT NULL,
  CHECK(valid_from IS NULL OR valid_to IS NULL OR valid_from < valid_to)
);
CREATE TABLE alias (
  revision_id TEXT NOT NULL REFERENCES revision,
  namespace TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY(revision_id, namespace, value)
);
CREATE TABLE source (
  source_snapshot_id TEXT PRIMARY KEY,
  source_entity_id TEXT REFERENCES entity,
  original_locator TEXT NOT NULL,
  original_bytes BLOB,
  original_sha256 TEXT,
  git_commit TEXT,
  git_tree TEXT,
  branch TEXT,
  pr_number INTEGER,
  checkout_state TEXT CHECK(checkout_state IN ('tracked-clean','tracked-dirty','untracked','external')),
  source_kind TEXT CHECK(source_kind IN ('verified','inference','original-fiction')),
  accessed TEXT,
  quotation TEXT,
  rights_status TEXT,
  disclosure TEXT CHECK(disclosure IN ('internal','public'))
);
CREATE TABLE revision_source (
  revision_id TEXT NOT NULL REFERENCES revision,
  source_snapshot_id TEXT NOT NULL REFERENCES source,
  selector TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY(revision_id, source_snapshot_id, selector, role)
);
CREATE TABLE link (
  link_id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revision,
  from_entity_id TEXT REFERENCES entity,
  from_original_ref TEXT,
  kind TEXT NOT NULL,
  to_entity_id TEXT REFERENCES entity,
  to_original_ref TEXT,
  reason TEXT,
  details_json TEXT CHECK(json_valid(details_json)),
  CHECK(from_entity_id IS NOT NULL OR from_original_ref IS NOT NULL),
  CHECK(to_entity_id IS NOT NULL OR to_original_ref IS NOT NULL)
);
CREATE TABLE term (
  term_id TEXT PRIMARY KEY,
  term_type TEXT NOT NULL CHECK(term_type IN ('category','tag')),
  label TEXT NOT NULL,
  UNIQUE(term_type, label)
);
CREATE TABLE revision_term (
  revision_id TEXT NOT NULL REFERENCES revision,
  term_id TEXT NOT NULL REFERENCES term,
  PRIMARY KEY(revision_id, term_id)
);
CREATE TABLE review (
  review_id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revision,
  scope TEXT NOT NULL,
  target TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','accepted','rejected','withheld','withdrawn')),
  reviewer TEXT,
  evidence_snapshot_id TEXT REFERENCES source,
  reason TEXT
);
CREATE TABLE artifact (
  artifact_id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revision,
  surface TEXT NOT NULL,
  slug TEXT,
  source_snapshot_id TEXT NOT NULL REFERENCES source,
  fingerprint TEXT,
  guid TEXT
);
```

**필드 추적표:** 각 행의 PK/FK는 해당 구성요소의 안정 식별·개정 귀속을 위한 신규 구조다. 필드 생략 없이 다음 근거에 연결한다.

| 테이블/필드군 | 근거 |
|---|---|
| entity 전체, alias 전체 | C3, B:12; 별칭도 개정에 귀속 |
| revision 식별자·schema_id·revision_label·owner·document_status·source_kind·last_verified_commit·as_of·content_sha256 | C1–C2 |
| revision domain·kind·implementation_state·valid_from/to·fictional_time_json | C1, C6, B:11–14; 실제/허구 시간 분리 제안 |
| revision legacy_verification_state·payload_json | C2; `docs/game-logic/World-Narrative-Atlas.md:78–191`, C:41 |
| source 식별자·locator·bytes/hash·git_commit/tree·branch·pr_number·checkout_state | C1, C3, B:12; dirty 출처 구분 D:32–35 |
| source source_kind·accessed·quotation | `docs/game-logic/Research-Sources.md:5–33` |
| source rights_status·disclosure | C4–C5, B:15; C:135–153 |
| revision_source 전체 | C1의 source_anchors, C3의 원본 위치; role은 owning/evidence/inspiration/projection 구분 |
| link 전체 | C2–C3; C:92–98의 from/kind/to/reason 및 미결합 이름 관계; details_json은 B:18의 종파 행렬 |
| term·revision_term 전체 | C1–C2의 분류 요구를 B:11대로 다중화 |
| review 전체 | C4; target별 공개·승격·소유자 판정과 증거를 분리 |
| artifact 전체 | C5의 표면/slug/해시, C6의 fingerprint·GUID; D:61, B:21 |

개정·출처 스냅샷은 불변이다. 동일 `revision_label`도 서로 다른 bytes라면 별도 개정이다. JSON hash는 저장된 UTF-8 bytes의 SHA-256이며 Git 객체 ID나 런타임 fingerprint와 다르다. 원문 MD/JSON bytes는 source에 보존한다. 대형 아트는 bytes 대신 원본 경로·해시·GUID만 연결한다. 미취득 bytes/hash는 NULL이고 검증 완료로 표시하지 않는다.

`link`는 개정에 속하는 관계 사실이다. 해소된 ID와 원문 참조를 함께 보존할 수 있다. 이름만 있는 관계는 FK를 NULL로 남긴다. `contains`, `depends_on`, `schism_from`, `interacts_with`, `uses_salvage`, `affected_by`, `regional_identity_of`를 구분한다. 타입 검증은 kind별 필수 필드·허용 관계·endpoint kind를 검사해야 한다. SQL의 `json_valid`만으로 이를 보장하지 않는다.

## 2. domain / kind / 다중 category·tag

| 축 | 의미 | 예시 |
|---|---|---|
| domain | 저작 책임 영역, 개정당 하나 | planning / world / rules |
| kind | payload 계약, 개정당 하나 | plan, lore_page, person, house, faith, culture, region, event, rule, source |
| category | 통제된 다중 분류 | campaign-faith, regional-identity, salvage-technology |
| tag | 검색용 다중 표지 | 기계숭배, 배급의례 |

`planning`은 기존 `/design/` 표면으로 매핑한다(D:131). 파일 prefix나 공개 경로가 분류를 결정하지 않는다(B:11). 원본 hostile `category`는 해당 타입의 속성으로 그대로 보존하고, 검색 category로의 매핑은 명시한다. faith와 culture는 별개 공유 엔티티이며 관계로 연결한다. 모든 문장을 EAV 행으로 분해하지 않는다(B:13,26).

## 3. 안정 ID·별칭·원본 locator

기존 ID 문자열을 그대로 `entity_id`로 고정한다. 새 객체는 `ds:<UUID>`를 발급하고 이름·파일명·행번호에서 계산하지 않는다. ID 없는 원본은 첫 식별 결정과 locator를 함께 보존하여 재수집 때 재발급하지 않는다.

| namespace | 보존 규칙 |
|---|---|
| K### | K001–K422의 현재 ID/이름/순서를 동결; 정렬·개명으로 재번호 금지 |
| roll-* | 표본 인물 독립; K와 이름 일치만으로 합치지 않음 |
| HC/HP/XT/H/F/V/G/M/B/ARC/CL/WNA/DIAG | 원문 전체 ID 유지; 집합·콘텐츠·원장·도면 kind 구별 |
| gu:* / region:* | 행정구와 동 독립; region의 기준일·branch 출처 유지 |
| osm:node:* / osm:way:* / osm:relation:* | 객체 유형까지 ID에 포함; 현실 참조이지 허구 소유권 아님 |
| SRC-* | 출처 엔티티 ID; 개별 수집 bytes는 별도 source_snapshot_id |

C:170–176, D:75–82,114가 근거다. HC는 22개, HP는 10개라는 D:77의 정정을 채택하되 낡은 범위 서술도 원문으로 남긴다. B017/B020/M007은 ID 존재와 본문 존재를 분리한다. 로컬 backfill은 독립 증거이며 K 승격 승인이 아니다.

alias의 namespace는 `display-name`, `legacy-id`, `slug` 등을 구분한다. 이름 중복을 허용하며 alias로 자동 병합하지 않는다. 명시적 동일성 검토 없이 corridor 별칭도 확정하지 않는다(D:94). 원본 locator는 파일/URL, selector는 줄 범위·Markdown anchor·JSON Pointer를 보존한다. 배열 index는 위치 증거일 뿐 ID가 아니다. path+commit/tree+원본 hash로 재현하며 PR/branch는 수집 당시 소속이지 현재 병합 상태가 아니다.

## 4. 캠페인 typed payload와 lore envelope 예시

**두 JSON도 미저장·미승인 창작 예시**다. 지역·인물 기존 설정에 추가된 사실이 아니다. 문법 근거는 B:18–23 및 `.omo/locks/ate-grammar-reference.md`다. 예시 내 UUID 참조는 설명용이며 등록 시 FK 대상과 개정을 해소해야 한다.

faith 개정의 `schema_id=campaign-faith.v1`, `domain=world`, `kind=faith`, `source_kind=original-fiction`; payload는 다음과 같다.

```json
{
  "title": "환수로 신앙",
  "layer": "campaign",
  "regional_identity": {
    "succession_basis": "옛 노선명이 아니라 급수 복구 공동체의 계승",
    "self_name": "환수로 사람들"
  },
  "sacralization": {
    "old_world_symbols": ["폐역 안내도를 길잡이 신격으로 해석"],
    "currency_consumption_myths": ["배급표 소각을 공동체 부채 해소 의례로 해석"],
    "machine_factory_worship": ["정수 펌프의 재가동을 순례로 기념"]
  },
  "salvage_practice": {
    "technology": "잔존 펌프 수리",
    "ritual": "부품 회수와 공동 급수",
    "constraint": "에너지와 교체 부품 소모"
  },
  "schism_axes": ["회수 부품의 사유 허용", "배급표의 성물성"],
  "schism_matrix": [
    {"sect": "공수파", "positions": ["금지", "상징"], "reformation_trigger": "급수 중단"},
    {"sect": "성표파", "positions": ["조건부 허용", "성물"], "reformation_trigger": "배급표 위조"}
  ],
  "culture_interaction": {"mode": "혼합 의례", "tension": "급수권과 외부인 귀속"},
  "campaign_events": [
    {"kind": "invasion", "effect": "급수권 재편"},
    {"kind": "reformation", "effect": "종파와 지역 귀속 변화"}
  ]
}
```

이 필드들은 C2의 typed registry 확장으로서 B:18의 다섯 축에 일대일 대응한다. positions 길이는 schism_axes와 같아야 한다. 종파명이 공유 객체가 되면 faith ID로 분리하고 행렬은 `schism_from` 관계 details에 귀속한다. 문화·기술·침공 사건의 공유 객체는 `interacts_with/uses_salvage/affected_by` 관계로 연결한다. 예시의 지역 정체성은 기존 행정 경계와 동일시하지 않는다.

lore envelope는 테이블을 합친 교환 표현이며 별도 중복 정본이 아니다.

```json
{
  "entity_id": "ds:00000000-0000-4000-8000-000000000001",
  "schema_id": "lore-page.v1",
  "domain": "world",
  "kind": "lore_page",
  "revision_label": "draft-1",
  "owner": null,
  "document_status": "draft",
  "source_kind": "original-fiction",
  "implementation_state": null,
  "as_of": null,
  "fictional_time_json": {"epoch": "opening-day", "absolute_date": null},
  "categories": ["campaign-faith", "regional-identity", "salvage-technology"],
  "tags": ["종파분열"],
  "payload_json": {
    "title": "환수로의 계승과 분열",
    "layer": "campaign",
    "grammar_topics": ["successor-regional-identity", "salvage-cults", "sect-schism", "faith-culture-interaction", "invasions-events"],
    "blocks": [{"id": "opening", "format": "markdown", "text": "사람들은 펌프를 고친 날을 새 공동체의 시작으로 센다."}]
  },
  "links": [{"kind": "discusses", "to_entity_id": "ds:00000000-0000-4000-8000-000000000002"}],
  "reviews": [{"scope": "publication", "target": "wiki", "state": "pending"}]
}
```

envelope 공통 필드는 C1/C4, blocks는 B:13, topics는 B:18, links는 C3, 분류는 B:11에 근거한다. 공유 faith 본문은 복사하지 않는다. 내부 영감의 source row는 `disclosure=internal`; 공개 HTML·MD·JSON·검색에는 그 참조·이름·에셋을 포함하지 않는다(B:15). 공개 허용 NULL도 공개 승인으로 해석하지 않는다.

## 5. 유효 시간·내용 개정·검토 상태

- `as_of`는 실제 관측 기준일, `[valid_from, valid_to)`는 실제 사실의 유효 구간이다. NULL은 모름이며 무기한을 추정하지 않는다. 허구 시간은 별도 epoch/상대시점/미확정 absolute_date로 저장한다. 후세 정체성이 수백 년 경과나 PR #87 연대를 확정하지 않는다(B:23).
- revision_id는 내용 식별자이지 날짜·검토 순서가 아니다. r11/r14와 원본 verification_state 충돌을 별도 증거로 유지한다(D:76). 현재판 선택은 승인된 원본 스냅샷 기준이며 문자열 최대값이 아니다.
- review는 개정과 scope/target에 귀속한다. editorial·publication·promotion·asset-acceptance·source-disclosure 판정을 합치지 않는다. evidence/reviewer 없는 accepted는 승인 근거로 사용할 수 없다. 상충 판정은 보류한다. 새 개정은 이전 승인을 상속하지 않는다.
- `document_status=active`, 검토 accepted, artifact 존재, 실제 게시, 런타임 반영은 서로 다르다(C4–C6). artifact는 산출물 증거일 뿐 게시 허가가 아니다. 기존 `support_reviewers`는 원본 payload에 보존하며 실제 검토자로 꾸미지 않는다.

## 6. 여섯 구성요소 매핑

| 구성요소 | 테이블 및 보존 경계 |
|---|---|
| C1 문서 envelope | entity/revision/source/revision_source/term/revision_term; 원문 bytes와 긴 서술 |
| C2 atlas registry | entity/revision/link; charter·membership·succession 포함 모든 원본 필드 보존; 투영 생략을 스키마 삭제로 오해하지 않음 |
| C3 정체성·관계 | entity/alias/link/source/revision_source; 이름 관계는 미해소 참조 유지 |
| C4 검토·공개·승격 | review/source/revision; manifest incomplete·허브 상태·소유자 증거를 원본과 연결 |
| C5 출력 표면 | artifact/source/review; slug·출력 hash·공개 대상, 미러 쓰기권한 없음 |
| C6 런타임 스냅샷 | artifact/source/review; 정적 catalog fingerprint/GUID 참조만 연결 |

C2 완전성 근거: `tools/wiki/world-atlas-schema.mjs:111–116`. C5/C6은 데이터 관계만 정의하며 API·호스팅·이관 순서를 설계하지 않는다. D:123–131의 입력 권한표를 유지한다.

## 7. 명시적으로 모델링하지 않는 것

- 전투 규칙 변경, 참조 틱 체계, 봉신 UI. 고정 아이소·사각 격자·4방향·이동 후 행동은 불변(B:20).
- 실시간 게임 상태·세이브·전투 수치 정본, 런타임의 DB 직접 읽기(C6).
- PR #87 제안의 자동 채택, 미병합 지역 JSON의 main 승격, 세 인물 저장소의 이름 기반 통합(D:79–82).
- 범용 CMS, 문장별 EAV, 이벤트 소싱, 분산 동기화, 서비스 API·호스팅·마이그레이션 실행 계획(B:26).
- 아트 바이너리 저장소나 2D 포트레잇/메시 파이프라인 통합(B:21).
- 내부 영감의 고유명·에셋을 공개 데이터로 옮기는 모델. 대외 명칭은 《잔선》뿐이다.
