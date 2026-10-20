# 위키 저장소 전용 인물 SQLite 사용 안내

## Local text corpus (schema version 5)

The immutable `text-corpus-manifest.mjs` enumerates non-private renderer envelopes and Markdown/CSV authoring sources. Build adds their exact bytes to `source_file` and JSON pointers to `source_record`; no runtime directory discovery widens the input set. The existing Git HEAD byte, tracking, symlink, snapshot and recorded-revision checks apply to every added source.

`text_document` and its twelve child tables normalize envelopes, locales, nodes, lists, tables, runs, renderer anchors and links. `text_line_document` and `text_line` preserve physical Markdown/CSV/JavaScript lines byte-for-byte, including CR and terminal LF. The JavaScript rows cover the two existing provenance scripts and are not JavaScript semantic parsing. The former standalone line mapper's `text_document` key is now `text_line_document`.

The document mapper requires `content_policy: 'local-corpus'`, not `public`. Draft, approved and excluded statuses remain literal authored values. `corpus_kind` separates current-source, historical and example documents; links never resolve across those corpora. Here current-source means the source snapshot, not satisfaction of the Seoul approval policy. The anchor column `published` means renderer-visible anchor only, not publication admission. No source is promoted to canon by storage or link resolution. Editorial/soul files remain outside both raw and normalized text tables; their existing hash-only/projection contracts are unchanged.

Build and offline/full verify return `text_corpus`: document, line-document, physical-line, missing-source, authored-status and corpus counts. Counts derive from the enumerated manifest, independently checked against tracked source documents by tests. Verify remaps all text and domain tables from stored bytes and rejects tampered rows even offline. `text-data.mjs` reconstructs document `/data` from explicit typed domain columns and ordered child tables and checks equality with source JSON. `domain_sidecar_normalization: complete` is limited to the enumerated renderer envelopes, while `publication_admission: not-evaluated` remains separate. Other standalone JSON domains, generated catalogues, geography/LFS binaries and private editorial documents remain outside this text increment. The existing person/family/engine field-coverage contract remains independent.

Schema 5 implements authenticated current-Seoul rights, office-v2, query, field-coverage and source-closure mapping. Those mappings do not establish every person's current location or narrative readiness. Schema versions 2, 3 and 4 are not migrated in place: use a clean admitted source checkout, build a new version-5 artifact, then run offline and source-including full verify. The clean-source full suite passed all 274 tests with zero failures or skips. The canonical artifact was refreshed from approved source commit b047449f5b9249b4c3fd46a6ac983c9157602f06 and tracked by 04fce5fff18d61c7f68d625900e130b09c1d2626. Offline, full and post-commit full verification passed; source freshness is current. PASS_WITH_SOURCE_ISSUES still reports the existing index warnings, gender-policy drift and unsupported official historical-GURPS check honestly. Remote delivery and latest-main integration remain separate work.

The domain/table map, uninterpreted source fields, current-Seoul mapping gaps, and source-quality limitations are listed in [TEXT-CORPUS-GAPS.md](TEXT-CORPUS-GAPS.md).

이 도구는 이 저장소의 인물 원천을 서버 없이 SQLite 파일 하나로 생성, 조회, 검증합니다. `build`는 현재 checkout의 원천을 읽어 새 DB를 만들고, `query`는 DB만 읽으며, `verify`는 DB 단독의 부분 검증 또는 원천을 포함한 전체 검증을 수행합니다. 원천 JSON은 고치지 않습니다. 저장소 정본 DB만 같은 경로로 다시 빌드할 때 교체합니다.

영문 용어는 다음 뜻으로 사용합니다.

- **current (현행)**: 최신 서울 범위와 공개 projection 기준을 만족해 현재 조회에 포함되는 자료입니다.
- **historical (역사 보존)**: 이전 GURPS 또는 최신 현재 사실로 승격되지 않는 보존 자료입니다.
- **unresolved (미확정)**: 현재성 또는 승인 근거가 부족한 자료입니다.
- **source provenance (원천 계보)**: 어떤 원천 경로·포인터·해시에서 온 값인지 나타내는 정보입니다.
- **allowlist projection (허용 목록 투영본)**: 비공개 원천에서 공개가 허용된 필드만 골라 만든 값입니다.

이 DB의 생성·복사는 공개, 배포, 게임 구현, owner approval(소유자 승인)을 뜻하지 않습니다.

## 저장소 정본

텍스트 원천을 정규화한 추적 파일은 `data/canonical/wiki-cast.sqlite`입니다. 인물 JSON은 집필 원천으로 남고, 이 파일이 로컬에서 조회하는 정규화 저장본입니다. 호스팅 데이터베이스로 옮기기 전까지 이 파일을 Git에 둡니다. 이 경로로 다시 빌드하면 그 파일만 교체하며, 이전 바이트는 Git 이력에 남습니다. 다른 저장소 안 경로는 계속 거부합니다. DB는 빌드 시점의 HEAD를 `source_git_commit`으로 기록하고, 그 DB를 추적하는 커밋은 입력 파일을 바꾸지 않으므로 커밋 뒤에도 full verify를 그대로 통과합니다.

```powershell
npm run cast:build -- --output "data/canonical/wiki-cast.sqlite"
```

## 준비와 단독 실행

Node.js 24.15.0 이상과 이 위키 저장소 checkout이 필요합니다. SQLite는 Node 내장 기능을 사용하므로 `npm install`이나 다른 저장소, `TOOL` 경로, 상위 checkout이 필요하지 않습니다. 일반 SQLite 도구로 결과 파일만 읽을 때는 Node와 원천 checkout도 필요하지 않습니다.

다음은 저장소 루트에서 실행하는 PowerShell 예시입니다. `build`에 `--source-root`를 생략했으므로 스크립트 위치에서 계산한 **이 저장소 루트**가 원천입니다. 작업 디렉터리의 부모나 형제 저장소를 검색하지 않습니다.

```powershell
$castOut = Join-Path ([System.IO.Path]::GetTempPath()) ('wiki-cast-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $castOut | Out-Null
$castDb = Join-Path $castOut 'wiki-cast.sqlite'
$castReceipt = Join-Path $castOut 'verify-full.json'
$castSource = (Get-Location).Path

npm run cast:build -- --output "$castDb"
npm run cast:verify -- --db "$castDb" --source-root "$castSource" --receipt "$castReceipt"
```

`--output`과 `--receipt`는 존재하지 않는 새 경로여야 합니다. 같은 경로를 다시 쓰면 `E_OUTPUT_EXISTS` 또는 `E_RECEIPT_EXISTS`로 실패하며 기존 파일의 바이트는 보존됩니다. 저장소 안에 둔 수 있는 DB는 `data/canonical/wiki-cast.sqlite` 하나입니다. 위 예시처럼 임시 복사본은 checkout 밖에 두며, 검증 영수와 임시 복사본은 Git, `public/`, `dist/`, 생성 카탈로그에 넣지 않습니다.

다른 신뢰할 수 있는 위키 checkout을 명시적으로 읽어야 할 때만 `build`에도 절대 경로를 지정합니다.

```powershell
$castOtherDb = Join-Path $castOut 'wiki-cast-other.sqlite'
npm run cast:build -- --source-root 'D:/trusted/seoul-dengoku-wiki' --output "$castOtherDb"
```

빌드와 원천 포함 검증은 실제로 읽는 모든 입력 파일이 해당 위키 checkout의 Git HEAD와 일치해야 합니다. 필요한 원천이 미커밋 상태이거나 Git 추적에서 제외되면 `E_SOURCE_DIRTY`로 거부합니다. 관련 없는 파일의 수정은 검사 범위에 포함하지 않습니다.

## 검증 상태를 읽는 법

원천을 지정한 verify는 DB 무결성, source revision·해시, 원천 보존 또는 projection 계보, 현재 profile 재계산을 확인하는 전체 원천 검증입니다. 공식 검사기가 현재 원천 schema를 지원하지 않으면 이를 실행한 것처럼 표시하지 않고 `not_checked`로 기록합니다. full verify는 DB에 기록된 `source_git_commit`이 원천 checkout의 현재 HEAD이거나 그 조상 커밋인지 확인하고, DB가 읽은 모든 입력 파일의 현재 바이트를 그 커밋에 기록된 Git blob과 직접 대조합니다. 현재 HEAD와 같을 필요는 없으므로 정본 DB를 커밋하는 것처럼 입력 파일을 바꾸지 않은 후속 커밋이 있어도 이전 DB는 그대로 통과하며, receipt의 `source_git_head`가 실제로 대조한 HEAD를 보여 줍니다. 입력 파일이 바뀐 커밋 뒤에는 `E_SOURCE_STALE`로, 기록된 커밋이 이 이력에 없거나 커밋 객체가 아니거나 그 커밋의 입력 blob이 현재 원천과 다르면 `E_SOURCE_REVISION`으로 거부하므로 새 DB를 빌드해야 합니다. `--source-root`를 생략하면 DB 내부 구조와 저장된 계보만 확인하는 offline(오프라인) 부분 검증이며, 원천 최신성·현재 renderer·공식 검사를 보장하지 않습니다.

```powershell
# 닫힌 DB 파일만 받은 소비자의 부분 검증
npm run cast:verify -- --db "$castDb"

# 원천 품질 gate. 공식 historical GURPS 검사가 미지원·미실행이면 엄격히 실패합니다.
npm run cast:verify -- --db "$castDb" --source-root "$castSource" --require-clean
```

receipt와 JSON 출력은 다음 판단을 분리합니다.

| 판단 | 의미 | 승인과의 관계 |
| --- | --- | --- |
| artifact integrity (산출물 무결성) | SQLite 구조, 외래 키, 파일·계보 검사가 정상인지 | 원천의 사실성 또는 승인 증명 아님 |
| current import completeness (현행 적재 완전성) | 현재 registry와 공개 projection이 정해진 적재 계약에 맞는지 | draft·미검토 상태를 승인으로 바꾸지 않음 |
| historical GURPS quality (역사 GURPS 품질) | 공식 검사 상태와 독립 importer 검사 결과를 분리. 공식 검사가 불가능하면 `unverified` | current engine·owner approval과 독립 |
| approval readiness / unconfirmed (승인 준비도·미확인) | 공개 projection의 `source_present`·`issued`와 별개로 승인 근거가 확인되지 않은 상태 | `source_present`, `issued`, clean 결과는 owner approval이 아님 |

현재 `wiki-gurps-cast.v1`에는 기존 공식 historical GURPS 검사기가 대응하지 않습니다. 따라서 현재 원천 receipt의 `official_check_status`는 `not_checked`, `official_check_reason`은 `unsupported-current-schema`, `historical_gurps_quality`는 `unverified`입니다. 공식 검사 issue 0건은 '문제 없음'이 아니라 '검사하지 못함'을 뜻합니다. 독립 importer 검사에서는 현재 스냅숏의 역사적 근거·형식 품질 문제를 별도로 찾습니다. 실제 `importer_issue_count`는 매 실행 receipt에서 확인하며 구 138건이나 새 관측치를 코드의 고정 기대값으로 쓰지 않습니다. 두 검사 결과를 합산해 독립 결함 수로 표현하지 않습니다. 현재 스냅숏의 건수는 매 실행 receipt의 `importer_issue_count`와 `source_reference_unresolved_count`에서 확인합니다.

현재 원천 스냅숏에는 경로와 인용문이 없는 GURPS 속성 근거 메모가 12행 있습니다(K998·K1007·K1008 각 4행). 원문 메모는 `uncited-note`로 보존하고 `E_GURPS_EVIDENCE_UNCITED` 품질 이슈로 드러냅니다. 이를 검증된 인용 근거로 바꾸거나 빌드 중 조용히 버리지 않습니다. 향후 원천이 바뀔 수 있으므로 검사 코드는 이 수를 고정 상수로 취급하지 않습니다.

성별 정책 원천의 17개 주별 선언 인구 합은 1,016명으로, 현재 registry·인물 원천의 1,022명과 다릅니다. 주별 선언 인구 또는 여성·남성 수가 현재 실제 배정과 다른 정책 행은 상태를 구별해 읽어야 합니다. 과거 정책 수치를 현재 인물 분모로 사용하거나, 이 차이를 인물 누락 또는 소유자 승인으로 해석하지 않습니다.

기본 build/verify는 원천 문제를 숨기지 않고 DB 무결성과 원천 품질을 함께 출력합니다. `--require-clean`은 독립 importer issue가 없고 공식 historical 검사도 `checked`인 경우에만 성공합니다. 현재 원천처럼 공식 검사가 지원되지 않으면 `E_SOURCE_QUALITY`로 실패합니다. 이 옵션은 현행 draft·unreviewed 자료를 owner-approved로 판정하지 않습니다.

## K ID, 공개 주소, 현재 도메인 조회

K ID는 안정 결합 키이고 publication ordinal(공개 순번)과 웹 주소는 별도 값입니다. route는 K ID 숫자에서 계산하지 않습니다. build와 원천 포함 verify는 registry, `values-cast.json`의 실제 공개 순번, `gurps-cast.json` 각 sheet의 `url`을 전수 대조합니다. 같은 인원 수여도 `sheet.url`만 변조하면 실패합니다. 기존 공개 카탈로그의 별도 생성·최신성 검사는 이 SQLite 도구의 범위 밖입니다.

```powershell
npm run cast:query -- --db "$castDb" person --id K1022
npm run cast:query -- --db "$castDb" person --route /people/person-1022
npm run cast:query -- --db "$castDb" person --id K014
npm run cast:query -- --db "$castDb" relations --id K1022 --direction both
npm run cast:query -- --db "$castDb" issues --dataset gurps
npm run cast:query -- --db "$castDb" issues --dataset reference
npm run cast:query -- --db "$castDb" issues --dataset index
npm run cast:query -- --db "$castDb" source --path lore/name-pools/values-cast.json --pointer /people/0/source
```

첫 두 `person` 명령은 같은 JSON envelope를 반환합니다. envelope의 최상위 `person`, `state`, `aliases`, `values`, `desires`, `gender`, `lineage`, `profiles`, `source_indexes`, `relations`는 원천의 방향·순서·상태와 source provenance를 보존합니다. `relations`의 incoming/outgoing은 원본 방향을 보여 주며 역관계나 동치 관계를 자동 생성하지 않습니다. `source_indexes`는 `cast`와 `corridor` 색인의 authored draft·approved 상태와 기존 temporal scope를 보존하며 이를 현재 권리·게시 준비도 승인으로 승격하지 않습니다.

공개 서술의 모든 변형은 `profiles` 배열에 별도로 보존하므로 한 사람에 프로필 하나만 있다고 가정해 JOIN하면 자료가 빠집니다. 대표 프로필은 첫 `primary_detail_names` 명시 일치 → 첫 state 카드 → 렌더링한 한국어 본문이 가장 긴 카드 순으로 선택하며, 길이가 같으면 원천 입력 순서를 유지합니다. 관계의 빈 근거도 지어내지 않고 그대로 반환합니다. 인물·프로필·node·field·관계의 실제 건수는 해당 실행 결과에서 확인합니다.

현재 draft index에는 registry ID와 명확히 연결되지 않는 `오도윤` 1행과, 원문 요약의 무소속 5명·실제 표 11명 사이의 차이가 있습니다. `issues --dataset index`에서 불일치·미연결 행을 확인합니다. 원문 이름·행은 보존하고 임의로 다른 인물에 붙이지 않습니다.

`person`의 도메인 구분은 다음과 같습니다.

| envelope 경로 | 뜻 | 해석 규칙 |
| --- | --- | --- |
| `current.engine` | 공개 허용 current profile | 8 abilities, skills, traits/effects, health/body/disease, narrative와 pointer·provenance만 포함. private profile status, owner approval, soul, 역사 모티브는 포함하지 않음 |
| `current.birthday`, `current.family`, `current.household`, `current.context` | 생일·가계·가구·현행 문맥 | `current.context`는 `courts`, `direct_retainer`, `owner_liege`, `court_membership`, `opening_disposition`, `offices`, `prose_contacts`, `event_links`, `issues` 등을 원문 방향으로 반환. draft, source-projection, source status를 current 사실이나 승인으로 승격하지 않음 |
| `current.holdings` | 서울에서 근거가 확인된 현행 보유 | `current_validity='current_seoul_evidenced'`만 포함. 역·시설·landmark의 참조는 토지·작위 전체 권리를 뜻하지 않음 |
| `current.nonowning_rights` | 승인된 별도 비소유 권리 | `current_seoul_nonowning`만 포함. `geographic_scope.counties`와 `powers`는 원천 순서를 보존하며 지리 범위를 소유권으로 바꾸지 않음 |
| `historical.gurps` | 봉인된 과거 GURPS | 영지·부대·유랑 세력·장단점/효과와 근거를 당시 상태로 보존. 현행 8역량으로 변환하거나 current approval을 부여하지 않음 |
| `historical.superseded_holdings` | 서울 밖이라 현행에서 대체된 보유 원행 | 기본 current holdings에 섞이지 않음 |
| `historical.superseded_context`, `historical.feudal` | 실제 superseded 정치체·가신단과 보관 원천의 옛 봉건 배정 | `superseded_context`는 실제 `superseded_outside_seoul` 행만 포함. archived title/grant/outside person control을 현행 권리로 승격하지 않음 |
| `historical.context.offices`, `unresolved.context.retinue_groups` | 별도 직책 이력과 위치 미확정 가신단 | 과거 직책을 현재 빈 값의 대체값으로 쓰지 않으며, 가신단을 현재 위치 승인으로 해석하지 않음 |
| `unresolved.holdings` | 새 서울 수여 근거가 없는 보유 원행 | `confirmed` 원천 상태나 카탈로그 검증만으로 current/approval로 바꾸지 않음 |

검토한 승인 원천에서 보유 20건은 정확한 승인 전환과 원행·후속 행 대조를 거쳐 `current_seoul_evidenced`로, 비소유 권리 5건은 `current_seoul_nonowning`으로 매핑합니다. 후자의 `direct_ownership=0`, 지리 범위와 순서 있는 권능은 별도로 보존하며 지명·좌표·정치 ID만으로 소유를 인정하지 않습니다. `current.context`에는 현행 작위 42건, 수여 31건, binding 7건, 비영토 정치 정체성 158건과 비영토 정치체가 각각 노출됩니다. 지리 parent·정치 parent·개인 주군은 별개이며 이 행들을 독립 영토 수나 인원 수로 합산하지 않습니다. 이 수는 승인 패키지 스냅숏 설명이지 가변 원천의 고정 검사 기대값이 아닙니다.

office-v2의 현재 결과 95건은 `current.context.offices`의 status·nullable position/rank·순서 있는 evidence로 읽습니다. 명시적 `unappointed`의 null은 그대로 반환하며 history·카드 직함·common tier에서 보충하지 않습니다. 이력은 `historical.context.offices`로 분리합니다. 검토된 office projection 바이트를 확인하는 계약은 새 직책 수여나 owner approval이 아닙니다. K151/K176/K355는 현재 null 직책과 별도 이력을, K1008은 비영토 정치체와 비소유 권리 및 미확정 가신단을 구별해 조회할 수 있는 사례입니다. 안정 K ID·공개 route·개인 관계 방향은 보존하며 권리 인증을 위치·서사·게시 준비도 승인으로 확대하지 않습니다.

`source`는 metadata와 RFC 6901 pointer의 typed record를 검사하는 용도입니다. raw byte 반환 기능은 제공하지 않습니다. `--include-bytes`는 `E_ARGUMENTS`로 실패합니다. private engine 원천은 전역 `source_file`/`source_record`에 없고, `current.engine`에는 hash·projection metadata만 연결됩니다.

## 테이블 대응과 보존 경계

`schema.sql`, `current-family.sql`, `current-engine.sql`, `current-context.sql`, `current-index.sql`, `historical-context.sql`, `current-identity-provenance.sql`, `source-closure.sql`, `excluded-sources.sql`이 정확한 열·FK·제약의 기준입니다. 아래 표는 조회 목적별 대응입니다.

| 자료군 | 주요 테이블 | 보존·공개 경계 |
| --- | --- | --- |
| 공통 인물·프로필·관계 | `person`, `person_alias`, `profile`, `profile_node`, `profile_field`, `relation`, `relation_type` | K ID, route, 원문 순서와 방향을 보존. 누락값을 0 또는 역관계로 채우지 않음 |
| 공개 인물 색인 | `index_document`, `index_state_label`, `index_section`, `index_person`, `index_corridor_person`, `index_issue` | 한영 필드, authored draft·approved 상태·기존 temporal scope·원문 출처 보존. 색인 상태를 current rights/readiness 승인으로 해석하지 않음 |
| 가치·욕망·성별·혈통 | `value_axis`, `person_value`, `desire_axis`, `person_desire`, `person_gender`, `person_lineage`, `person_lineage_source_clan`, `lineage_node`, `lineage_parent` | nullable `lineage_node.person_id`는 registry 밖 참조이며 새 인물로 만들지 않음. 비한국계는 한국식 clan FK를 NULL로 두고 원본 lineage reference와 `namingConventionSource`를 보존 |
| 전역 신원·성별 정책·가문 조사 계보 | `identity_registry_provenance`, `identity_gender_provenance`, `identity_gender_category`, `identity_gender_policy`, `identity_clan_catalog_provenance`, `identity_clan_research_source`, `identity_lineage_provenance` | 사람별 `person` 결과에 복제하지 않고 SQL로 읽는 원천 정책·조사 사실. registry 승인 기록도 개별 인물 수치 승인으로 확대하지 않음 |
| 생일·가계·가구 | `family_birthday`, `family_birth_cohort_assignment`, `family_node`, `family_edge`, `household_manifest`, `household_person`, `household_link`, `household_court`, `diaspora_lineage`, `diaspora_member`, `household_policy_value` | family/household의 draft·source-projection·source status는 원문 상태이며 approval이 아님 |
| 현행 관계·보유·직책 | `context_court`, `context_direct_retainer`, `context_owner_liege`, `context_court_membership`, `context_organization`, `context_event_link`, `context_holding`, `context_holding_admin_ref`, `context_holding_reference`, `context_opening_disposition`, `context_office_appointment`, `context_prose_contact`, `context_issue` | 관계·contact는 direction을 보존. `context_holding`의 `current_validity`, `canon_status`, authority 열을 읽고 부분 역·시설·landmark 참조를 토지·작위로 확대하지 않음 |
| 현행 권리·전환 근거 | `context_rights_approval`, `context_rights_original_source`, `context_rights_transition`, `context_outside_retirement`, `context_feudal_title`, `context_feudal_jurisdiction`, `context_feudal_grant`, `context_feudal_grant_admin`, `context_feudal_grant_component`, `context_feudal_binding`, `context_political_identity`, `context_political_identity_liege` | 고정 승인 패키지·보관 원행·정확한 후속 행을 인증. 정치 정체성 존속은 토지 수여가 아님 |
| 비소유 범위·직책 이력 | `context_holding_geographic_scope`, `context_holding_scope_county`, `context_holding_power`, `context_office_history`, `context_office_evidence` | 지리 범위와 허용 권능, 현재 직책 근거와 과거 직책을 분리. null 현재 값을 이력으로 채우지 않음 |
| 역사 정치·권리 | `historical_source_scope`, `historical_feudal_title`, `historical_feudal_jurisdiction`, `historical_feudal_grant`, `historical_feudal_grant_admin`, `historical_feudal_grant_component`, `historical_feudal_binding`, `historical_outside_person_control` | 보관 원천을 superseded 상태로 별도 보존하며 현행 서울 권리로 올리지 않음 |
| 정치체·가신단 분류 | `context_polity`, `context_retinue_group` | 정치체의 `current_nonterritorial`과 실제 superseded, 가신단의 unresolved를 구분. 정치 ID만으로 개인 관계를 역사 분류하거나 위치 승인하지 않음 |
| 현재 엔진 | `current_engine_source`, `current_profile`, `ability`, `skill`, `trait`, `effect`, `health`, `body`, `disease`, `narrative` | private 원문 bytes, document, soul, soulRevisionRef, historicalMotif, basis, evidence, private profile status를 저장하지 않음 |
| 출처·품질 | `source_file`, `source_record`, `reference_source`, `source_reference`, `excluded_source`, `source_check_run`, `source_check_issue`, `quality_issue` | primary raw은 typed record·BLOB으로 검증. reference hash-only의 대상 해시와 검증 범위를 별도 보존. private-engine·excluded hash-only는 원문 복구 대상이 아님 |

source manifest는 네 종류를 구분합니다. primary raw(완전 원문 검증), reference hash-only(고정된 참조 경로·해시와 검증 가능한 pointer), private-engine hash-only(허용된 engine source path·hash·public projection 계보), excluded hash-only(비공개 editorial 원천의 경로·해시·바이트 길이·제외 사유)입니다. reference closure는 가구 `sourceRef(s)`, context `sourcePath`·`sourceBasis.path`, 시설 `siteSourcePath`, office-v2 `current.evidence[].path/jsonPointer`를 명시적으로 수집합니다. evidence 발생 pointer와 대상 pointer는 별개입니다. `source-closure.mjs`의 고정 `REFERENCE_TARGET_PATHS`가 기준이며, 현재 목록은 preserved birthday와 Core 원천까지 포함한 40개 경로입니다. primary에 이미 있는 경로는 재사용하며 임의 디렉터리나 URL을 탐색하지 않습니다. JSON Pointer 검증·의미상 anchor의 path-only·미해결 pointer를 구별하고 미해결에는 `E_REFERENCE_ANCHOR`를 남깁니다. 실제 참조·검증·미해결 건수와 `reference_closure` 상태는 매 실행 receipt에서 확인하며 과거 합계를 고정 기대값으로 쓰지 않습니다. offline 검증은 저장 해시·바이트에서의 검증이며 원천 최신성을 보장하지 않습니다. hash-only 대상은 해당 기록만으로 원본 BLOB을 복구할 수 없어 무손실 백업이 아닙니다.

primary raw의 정확한 입력 집합은 `sources.mjs`의 `REQUIRED_SOURCE_PATHS`입니다. 인물·정책·현행 권리 JSON, 승인 전환·비소유·외부 권리 폐기 manifest, `scripts/historical-inputs/` 보관 원천, 고정 Markdown·스크립트와 텍스트 manifest의 합집합을 중복 제거합니다. coverage는 실제 정규화 열과 명시적 제외를 검사하며, 보관 holdings/island와 승인 payload의 인증·바이트 보존을 별도 정규화 행이라고 주장하지 않습니다. Markdown·스크립트는 비JSON 범위로 검사합니다. reference target과 primary raw의 겹치는 경로를 독립 파일 수로 합산하지 않습니다.

`excluded_source`는 고정된 **17개** 비공개 editorial 경로만 기록합니다. 인물 시스템 계약 1, 비공개 샘플 1, 서울 범위 검토 2, 승인 대기 이전 장부 1, soul·역사 모티브 12개입니다. 이들의 raw bytes·typed `source_record`·개인별 권리 행을 DB에 넣지 않습니다. 특히 이전 장부는 people 1,022건·old rights 2,021건을 담지만 `batches=[]`, `approvals=[]`로 승인된 현재 서울 권리의 근거가 아닙니다. 별도 `Seoul-Scope-Contract`의 entities 1,634/dispositions 3,043도 검토용 baseline입니다. 공개 허용 current engine profile batch 9개의 hash-only 계보는 `current_engine_source`에 별도로 연결되며 이 17개와 경로가 겹치지 않습니다.

receipt의 `excluded_source_count=17`과 `source_set_sha256`에는 이 17개 경로의 해시도 묶여 있습니다. 비공개 원천 바이트가 달라지면 전체 원천 대조에서 변경을 감지하지만 DB 파일만으로 비공개 내용을 복원할 수는 없습니다.

공개 옛 봉건 배정은 위 비공개 제외와 다릅니다. 보관 allocation의 작위·수여·관할·binding과 보관 외부 통제의 인물 연결 행은 `historical_*`에 superseded로 보존하며 비인물 통제를 개인 권리로 연결하지 않습니다. 서울 선거구 검토 원천은 holder 없는 inspection-only scope로만 표시합니다. 어느 행도 새 서울 수여나 현재 소유 승인을 뜻하지 않으며 실제 건수는 실행 결과에서 확인합니다.

`cast-hangnyeol`의 비한국계 인물은 현재 62명이며 원본 `clan` 참조는 서로 다른 59개 ID를 사용합니다. 한국식 canonical `clan` 303개와 별개입니다. 이 62명의 `person_lineage.clan_id`는 NULL이고, 원본 reference는 `person_lineage_source_clan`에 62행으로 남습니다. `naming_convention`, `naming_source_character_id`, `naming_source_path`, `naming_source_basis`는 이름 규칙의 원천을 설명합니다. `person K014` 조회에서는 `lineage.source_clan_refs`로 원본 참조를 읽을 수 있습니다. 기존 공개 카탈로그가 이 인물들에게 한국식 `detail.clan`을 표시하지 않는 의미를 유지합니다.

이 SQLite 검증은 mapper, 관계 원천 validator, 새 normalized DB의 계약만 다룹니다. 기존 public generated projection의 stale/divergence 또는 별도 common-tiers 실행 상태는 이 DB의 입력·출력 검증 범위가 아니며, 이 도구가 해당 생성물을 재생성하거나 고치지 않습니다.

## 닫힌 파일을 복사해 SQL로 읽기

build가 끝난 뒤 결과는 `DELETE` journal mode의 닫힌 DB입니다. `-wal`·`-shm` sidecar를 함께 옮길 필요가 없습니다.

```powershell
$castCopy = Join-Path $castOut 'wiki-cast-copy.sqlite'
Copy-Item -LiteralPath $castDb -Destination $castCopy

# sqlite3 CLI가 설치된 경우
sqlite3 -readonly -json "$castCopy" "SELECT person_id,name,public_route FROM person WHERE person_id='K1022';"

# 개인별 출력에 반복하지 않는 전역 정책·조사 계보
sqlite3 -readonly -json "$castCopy" "SELECT state_id,population,observed_population,female_count,observed_female_count,alignment_status FROM identity_gender_policy ORDER BY state_id;"
sqlite3 -readonly -json "$castCopy" "SELECT research_source_id,source_url,accessed_on,live_check FROM identity_clan_research_source ORDER BY ordinal;"

# 원천 없는 소비자의 부분 검증
npm run cast:verify -- --db "$castCopy"
```

SQLite CLI가 없으면 `node:sqlite` 또는 읽기 전용 모드의 SQLite 도구로 열어도 됩니다. 쓰기 시도는 거부되어야 하며, 사본의 해시는 build한 원본 DB와 같아야 합니다.

위 정책 SQL의 `population`은 과거 원천의 선언값, `observed_population`은 현재 적재 인물에서 계산한 값입니다. `alignment_status='differs-current'`는 정책 원천과 현재 배정의 차이를 뜻하며 인물 누락이나 승인 판정이 아닙니다. `identity_registry_provenance.approval_scope='registry-source-event-only'`, `identity_gender_provenance.decision_scope='category-and-assignment-policy-only'`도 개인별 owner approval이 아닙니다.

## 자동 검증

```powershell
npm run test:cast-sqlite
npm run test:cast-sqlite:readme
```

`test:cast-sqlite`는 Node test runner를 `--test-concurrency=1`로 실행해 여러 전체 적재가 동시에 메모리를 쓰지 않게 합니다. `test:cast-sqlite:readme`는 문구 정규식 검사가 아니라 임시 새 경로에서 README 순서대로 default build → source 포함 full verify → K ID/route/current·historical·unresolved 조회 → private raw endpoint 거부 → 사본 read-only SQL → source 생략 offline verify를 실제로 실행합니다. 출력 DB·receipt·로그는 테스트 종료 후 임시 경로에서 정리됩니다.

SQLite 구조 검사에는 `STRICT` 테이블, 복합 외래 키, `application_id`/`user_version`의 읽기 전용 재개방, 쓰기 거부 뒤 파일 해시·수정시각 불변, 동시 쓰기 시 `SQLITE_BUSY`와 재시도, 전체 `integrity_check`와 `foreign_key_check`가 포함됩니다. 파일을 복사한 뒤에도 읽기 전용으로 열어 검증하고, 출처에 관한 결론은 반드시 원천을 지정한 full verify receipt에서 확인하세요. 큰 원천의 전체 검사는 시간이 걸릴 수 있으므로 운영 시 완료 코드와 receipt를 함께 보관합니다.

정규화 범위 검사는 포함 JSON과 비공개 engine batch의 field shape를 고정된 `coverage-contract.mjs` 계약에 대조합니다. 현행 권리·지리/정치 parent·개인 주군·비소유 scope/powers·office current/history/evidence는 실제 열로 명시적으로 연결합니다. 공개 자료에는 해당 정규화 테이블·열·행이 있거나 문서화한 제외 사유가 있어야 합니다. 비공개 batch는 shape의 건수와 해시만 검증하며 비공개 필드 이름·경로·값을 DB, receipt, CLI에 내보내지 않습니다. 새 원천 경로나 선언되지 않은 필드 모양은 실패합니다. 원문 바이트 보존이나 인증 전용 입력을 정규화 행의 증거로 세지 않으며, 최종 판단에는 실제 build/verify와 각 도메인별 전수 행 대조도 필요합니다.
