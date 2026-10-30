# PostgreSQL 저작과 SQLite 이관 도구 안내

## 저작 권위 전환과 작업 상태

PostgreSQL `wiki`가 저작 정본 전환 대상이다. `document-cli.mjs`와 공개 문서 API는 PG 전용이며 SQLite 폴백이 없다. 옛 `data/canonical/wiki-cast.sqlite` 및 외부 SQLite archive는 이관·대사 입력일 뿐, 전환 후 운영 저작 정본이 아니다. 격리 환경에서 SQLite·PG reader와 전체 worker 출력 1,433개가 동등했고 일반 PG 빌드 및 계약·산출물·게이트 검사가 통과했다. 일반 PG 생성·빌드는 메타데이터와 스냅샷·비공개 출처 검증 아래 허용되지만, 정확한 SHA 기준 운영 후보 확인과 배포는 아직 남아 있다.

- 물리적인 lore JSON 원천 파일은 모두 제거됐다. 문서·출처 기록에 남아 있는 `lore/.../*.json` 이름은 DB 안의 논리적 문서 식별자 또는 provenance이며, 디스크에서 다시 읽어야 할 입력 파일이 아니다.
- 현재 envelope head는 예시를 포함해 99개다. 예시는 실제 게시 문서와 구별한다.
- 원래 인물 ID 1,022개는 보존돼 있다. 현재 인물 511명은 disposition을 통해 구분한다. 보존 ID 수, 현재 인물 수, 프로필 수, 문서 수는 서로 다른 분모다.
- 비공개 editorial·Soul 데이터는 공개 데이터와 별도 권한 경계를 유지한다. 이관용 비공개 SQLite 파일은 Git이나 공개 배포물에 넣지 않는다.
- 생성된 공개 JSON은 출력물이다. 직접 고쳐 저작 원천으로 사용하지 않는다.
- 이관 검증, 생성 완료, 원격 배포와 소유자 승인은 각각 별도 상태다.

DB의 존재, export 성공, 검증 통과, 렌더링 완료, 공개 배포, 게임 구현, 소유자 승인은 서로 다른 상태다. 현재 저장 상태를 확인하는 검증을 새로운 게시 승인으로 해석하지 않는다.

## 준비

프로젝트 실행에는 Node.js 24.15.0 이상을 사용한다. SQLite 접근은 Node 내장 기능을 이용한다. 일반 SQLite 도구로 닫힌 DB를 읽을 때에는 Node가 필요하지 않다.

SQLite 이관·대사 작업에는 해당 캡처의 실제 SQLite 파일과 정확한 식별·해시가 필요하다. 파일이 없거나 열리지 않으면 중단한다. 삭제된 JSON이나 다른 파일로 대체 정본을 만들지 않는다. PG 저작·문서 API는 이 SQLite 파일을 요구하지 않는다.

작업은 전용 브랜치와 PR로 제안하며 main 병합은 소유자만 한다. 공개 DB 변경과 비공개 저장소 변경은 보관·검토·배포 경계를 분리한다.

## 저작·생성·검증의 역할

| 기능 | 현재 역할 | 하지 않는 일 |
| --- | --- | --- |
| document-cli | 문서 list/read/edit, stdin을 통한 typed 편집 명령, 불변 revision 이력과 draft invalidation | 모든 도메인에 대한 범용 쓰기 API를 제공한다고 보장하지 않음 |
| `cast:query` | 이관 SQLite를 읽어 인물·관계·출처·품질 정보를 조회 | PG 운영 조회나 새 승인 사실을 대체하지 않음 |
| `cast:build` | 이관 SQLite에서 새 외부 경로로 export | PG 정본 생성·덮어쓰기 |
| `cast:verify` | 이관 SQLite의 storage·head·privacy 계약을 읽기 전용 검증 | PG 대사, 새 게시 승인, 의미 검토 |
| 정식 생성 | 메타데이터와 스냅샷·비공개 출처 검증을 거치는 일반 PG release; `--verify-pg`는 stage 검증만 수행 | 출력 JSON을 저작 원천으로 승격하거나 배포를 증명하지 않음 |

현재 document-cli의 지원 범위는 문서 편집이다. 인물 수치·권리·직책·가계·Soul 등 임의의 도메인을 같은 명령으로 수정할 수 있다고 약속하지 않는다. 필요한 변경을 기존 typed 명령으로 표현할 수 없다면 지원 범위를 확인하고 별도 구현·검토 대상으로 기록한다. 임의 SQL 쓰기로 지원되지 않는 편집 계약을 우회하지 않는다.

비공개 Soul 배정은 별도 `scripts/document-store/soul-assignment-cli.mjs`로 편집한다. `init-edits --db <path> --actor <actor> --reason <reason>`는 mode `600`인 기존 DB에 개정 저장소를 명시적으로 추가한다. `read`와 `revision`은 현재 head를 읽으며, `replace`는 `--person-id`, `--expected-revision`, `--actor`, `--reason`과 stdin의 완전한 typed assignment를 받는다. 편집은 `draft`이고 `approvalRef`를 허용하지 않는다. 원본 승인 revision `0`, 안정 ID 1,022개와 과거 개정은 보존한다. 별도 검토 전까지 게시 인증은 명시적인 `view: 'approved'`로 원래 승인 스냅샷만 읽는다.

## 문서 편집과 revision 이력

운영 `document-cli.mjs`는 PostgreSQL 전용이다. `WIKI_AUTHORING_PG`(미설정 시 `WIKI_DOCUMENT_PG`) 또는 명시적 `--pg <connection-url>`로 연결을 선택하며 `wiki_author` 역할을 사용한다. 비밀번호를 프로세스 인자에 노출하지 않도록 환경변수를 권장한다. `--db`는 오류이며 PG 연결 실패 시 SQLite로 대체하지 않는다. 기존 `document-edit.mjs`의 SQLite export는 migration tooling 전용이고, 운영 쓰기는 `document-edit-pg.mjs`의 비동기 typed SQL 구현을 사용한다.

전용 저작 계정은 `scripts/postgres-migration/wiki-author-login.sql`로 제공한다. 비공개 superuser 세션에서 `WIKI_AUTHOR_PASSWORD` 환경변수를 설정하고 `psql -X -v ON_ERROR_STOP=1 --dbname=seoul --file=scripts/postgres-migration/wiki-author-login.sql`을 실행한다. SQL을 기록하는 proxy·audit 수집 경로에서는 실행하지 않는다. 로그인 `wiki_author_login`은 `NOINHERIT`이며 `wiki_author`로 명시적 `SET ROLE`한 연결만 저작 권한을 얻는다. runtime/generation 계정에는 membership을 부여하지 않는다. typed 본문 변경·좌표 추가·projection 갱신·revision INSERT만 허용하고, 과거 revision UPDATE/DELETE·승인 발급·private 접근·DDL은 허용하지 않는다. 역할·권한 사전 조건이 안전하지 않거나 비밀번호가 비면 transaction 전체가 실패한다.

`edit`는 `--expected-revision`을 필수로 받는다. 선택적 `--expected-hash`는 편집 전 semantic SHA-256, `--expected-result-hash`는 draft 전환 후 결과 SHA-256을 검증한다. revision 충돌이나 hash 불일치는 전체 transaction을 rollback한다. 현재 head 검증, typed 변경과 종속 projection, draft 전환, 불변 revision snapshot·seal 기록, head CAS 및 전역 sequence 변경은 같은 transaction에 속한다. revision 읽기는 현재 본문이 아니라 봉인된 typed snapshot을 복원하며 저장 hash와 대조한다.

인물 본문 전용 `character-document-editor.mjs` CLI도 같은 PG 연결과 `wiki_author` 역할을 사용한다. `--id`, `--revision`, `--actor`, `--reason`과 stdin의 명령 배열을 받으며 `setText`, `setRunText`, `setLocale`만 허용한다. 인물 profile projection과 evidence 검사는 같은 transaction에서 처리된다. 관계 표 추가는 `relation-document-editor-pg.mjs`의 `editRelationDocumentPgOnConnection(reader, options)` 또는 `editRelationDocumentPgInTransaction(tx, options)`를 사용하며 `appendTableRow`만 허용한다. 두 PG editor는 revision CAS와 선택적 현재·결과 semantic hash를 문서 writer에 전달한다. 구조 편집은 검증된 target-anchor FK와 node identity 불변 trigger가 없는 DB에서 실패하며 다른 문서의 링크 증명을 변경하지 않는다.

```bash
node scripts/cast-sqlite/document-cli.mjs --help
node scripts/cast-sqlite/document-cli.mjs list --corpus current
node scripts/cast-sqlite/document-cli.mjs read --corpus current --domain <domain> --id <documentId>
```


1. document-cli의 list/read로 대상의 논리 ID, 현재 head, 문서 상태와 내용을 확인한다.
2. 공개 문서인지 비공개 운영 자료인지 구분하고, 적용 지시와 승인 범위를 확인한다.
3. 기존 CLI가 지원하는 typed 편집 명령을 stdin으로 전달한다. 정확한 명령 형식은 현재 CLI의 도움말과 구현 계약을 따른다. JSON 파일을 새로 만들거나 생성 JSON을 수정하는 방식으로 대체하지 않는다.
4. edit 후 새 head와 revision 이력, 변경 본문을 다시 읽는다. 이전 revision은 덮어쓰거나 삭제하지 않는다.
5. 편집으로 인한 draft invalidation을 확인한다. 이전 본문에 대한 검토·승인을 변경된 본문에 자동 승계하지 않는다.
6. 정본을 읽기 전용으로 검증하고, 별도로 정식 생성 결과와 필요한 본문·게시 검토를 확인한다.

논리적 `.json` 이름은 이 과정에서 문서 식별 및 과거 출처 연결에 계속 사용할 수 있다. 그 이름이 남아 있다는 이유로 해당 물리 파일을 다시 만들 필요는 없다. revision 이력과 출처 provenance는 서로 다른 정보다. 과거 JSON의 경로·pointer·해시는 당시 입력의 계보이며, 현재 문서 head를 대신하지 않는다.

## 이관 SQLite 외부 export

`cast:build`는 이전 SQLite 입력의 외부 export 도구다. 새 출력 경로는 checkout 밖에 있어야 하며 아직 존재하지 않아야 한다. PG 백업이나 PG 저작 수단이 아니다.

다음은 저장소 루트에서 실행하는 PowerShell 예시다.

```powershell
$castOut = Join-Path ([System.IO.Path]::GetTempPath()) ('wiki-cast-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $castOut | Out-Null
$castDb = Join-Path $castOut 'wiki-cast.sqlite'

npm run cast:verify -- --db 'data/canonical/wiki-cast.sqlite'
npm run cast:build -- --output "$castDb"
npm run cast:verify -- --db "$castDb"
```

`cast:build`는 `data/canonical/wiki-cast.sqlite` 덮어쓰기를 거부하고 입력이 없을 때 삭제된 JSON으로 재구축하지 않는다. export 파일을 PG 정본이나 이전 입력 위에 복사하지 않는다.

다른 checkout을 지정해도 SQLite export 입력에 관한 옵션이다. `--source-root`를 JSON 원천 탐색이나 JSON freshness 검사의 의미로 설명하지 않는다. 실제 지원 옵션과 오류 코드는 현재 명령 도움말·실행 결과를 따른다.

임시 DB·검증 영수·로그는 Git, `public/`, `dist/`, 생성 카탈로그에 넣지 않는다. 비공개 저장소를 export 입력의 공개 문서 집합에 섞지 않는다.

## 검증 결과를 읽는 법

`cast:verify`는 지정된 이관 SQLite를 읽기 전용으로 열어 storage·head·privacy 계약을 검증한다. PG 대사는 별도의 `cast:pg-verify`를 사용하며 이관 입력이 필요하다. 검증 중 이력을 변경하지 않고 실제 결과와 범위를 기록한다.

| 판단 | 의미 | 별도로 남는 판단 |
| --- | --- | --- |
| 저장 무결성 | 현재 구현이 검사하는 SQLite 구조·참조·저장 계약의 일관성 | 설정의 사실성·서사 적합성 |
| head 일관성 | 현재 문서 head와 revision 저장 관계의 일관성 | 해당 본문에 대한 소유자 승인 |
| privacy | 공개 저장 범위와 비공개 제외 계약 검사 | 모든 외부 배포물에 대한 별도 검토 |
| 현재 disposition | 보존 ID와 현재 분류의 구별 | 개별 위치·권리·사건·수치의 승인 |
| 생성 결과 | 실제 완료된 생성 실행의 결과 | 원격 게시·게임 구현·최종 검토 |

검사하지 않은 의미·번역·역사 근거·게시 준비도는 미검사 또는 미검토로 남긴다. schema 통과나 issue 0건을 의미 검토 완료로 바꾸지 않는다. 현재 99개 head와 원래 ID 1,022개·현재 511명은 저장 상태 설명이지 게시 승인 수가 아니다.

이전 JSON 원천 방식의 `source_git_commit`, Git blob 대조, JSON freshness, offline/full 구분에 관한 과거 receipt는 당시 검증의 기록이다. 삭제된 JSON과 다시 대조하거나 JSON에서 정본을 재빌드하는 운영 지침으로 사용하지 않는다.

과거 공식 historical GURPS 검사에서 기록한 `not_checked`·`unsupported-current-schema`·`unverified`도 당시 검사 범위를 나타낸다. 현재 검사기가 실제 실행됐다는 증거 없이 `checked`나 성공으로 바꾸지 않는다. importer 검사와 공식 검사 결과를 합산해 독립 결함 수로 제시하지 않는다.

## ID·현재 분모·공개 주소

K ID는 안정 결합 키다. 공개 순번과 route는 별도 값이며 K ID 숫자에서 계산하지 않는다. 원래 ID 1,022개를 보존하면서 disposition으로 현재 511명을 구분한다. 현재 집합 밖에 있다는 사실은 ID 삭제나 과거 기록 삭제를 뜻하지 않는다.

전체 보존 인물의 조회와 현재 집합의 조회를 혼동하지 않는다. 현재 인원 수를 셀 때에는 현재 disposition 계약을 적용한다. 프로필·관계·직책·작위·수여 행 수를 사람 수에 더하지 않는다. 서울 재배치 검토에서 외부 위치를 가진 인물을 임의로 제외하거나 역사-only로 바꾸어 검토 분모를 줄여서는 안 된다. 현재 disposition과 그 변경 근거는 별도로 읽어야 한다.

다음 조회는 DB를 읽는 기존 명령의 예다.

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

마지막 예시의 `.json` 경로는 DB에 남은 논리적 provenance 식별자다. 해당 파일이 디스크에 존재한다는 뜻이 아니다. `source` 조회는 metadata와 RFC 6901 pointer의 typed record를 확인하는 용도이며 raw byte 다운로드 기능이 아니다. private raw를 노출하는 endpoint로 사용하지 않는다.

## 인물 envelope와 관계 해석

인물 결과의 `person`, `state`, `aliases`, `values`, `desires`, `gender`, `lineage`, `profiles`, `source_indexes`, `relations`는 서로 다른 자료군이다. 원문 방향·순서·상태와 provenance를 구분해 읽는다.

- `relations`의 incoming/outgoing은 기록된 방향이다. 역관계나 동치 관계를 자동 생성하지 않는다. 빈 근거도 지어내지 않는다.
- 한 사람에게 공개 서술 변형이 여러 개 있을 수 있다. `profiles`를 단일 행으로 가정해 JOIN하면 자료가 빠진다.
- 대표 프로필 선택은 명시적 `primary_detail_names` 일치, state 카드, 렌더링한 한국어 본문 길이 순의 기존 규칙을 따른다. 동률에서는 입력 순서를 유지한다. 대표 선택은 승인 우선순위가 아니다.
- `source_indexes`의 draft·approved와 temporal scope는 해당 색인의 authored 상태다. 현재 권리나 게시 준비도 승인이 아니다.
- 미연결 색인 이름은 임의로 다른 K ID에 붙이지 않는다. 과거 `오도윤` 미연결 행과 요약·표 인원 차이 같은 관측은 현재 issue 결과와 다시 대조한다.

| envelope 경로 | 뜻과 주의점 |
| --- | --- |
| `current.engine` | 공개 허용 역량·숙련·특성·효과·신체·질병·서사와 provenance. Soul·역사 모티브·비공개 profile 상태나 승인 원문을 포함하지 않음 |
| `current.birthday`, `current.family`, `current.household` | 생일·가계·가구. draft·source-projection 상태를 승인으로 승격하지 않음 |
| `current.context` | 궁정·주군·가신·직책·사건·접촉 등. 지리 parent, 정치 parent, 개인 주군을 구별 |
| `current.holdings` | `current_seoul_evidenced`로 구분한 보유. 역·시설·landmark 참조는 토지 전체나 작위 전체의 소유가 아님 |
| `current.nonowning_rights` | `current_seoul_nonowning` 비소유 권리. 지리 범위와 순서 있는 powers를 소유권으로 바꾸지 않음 |
| `historical.gurps` | 봉인된 과거 GURPS. 현행 8역량으로 자동 변환하지 않음 |
| `historical.superseded_holdings`, `historical.superseded_context`, `historical.feudal` | 대체된 보유·정치·봉건 기록. 새 서울 권리의 근거로 자동 재사용하지 않음 |
| `historical.context.offices` | 과거 직책. 현재 null 직책을 이력으로 채우지 않음 |
| `unresolved.holdings`, `unresolved.context.retinue_groups` | 미확정 보유·가신단. 위치·권리·승인이 확인됐다는 뜻이 아님 |

`current`는 해당 조회 계약의 현행 영역을 뜻한다. 그 안의 모든 필드가 독립 검토·게시 승인을 마쳤다는 뜻은 아니다. `historical`은 당시 상태의 보존이고 `unresolved`는 현재성 또는 근거가 해결되지 않은 상태다.

과거 권리 패키지의 보유 20건·비소유 권리 5건, 작위 42건·수여 31건·binding 7건·정치 정체성 158건, office-v2 95건 등의 수치는 당시 매핑 설명이다. 현재 결과의 고정 기대값이나 승인 총수로 사용하지 않는다. `unappointed`의 null은 그대로 읽고 이력·카드 직함·common tier에서 보충하지 않는다.

## 테이블과 provenance의 보존 경계

정확한 열·FK·제약은 현재 DB schema와 구현 계약을 확인한다. 문서 revision/head와 기존 인물 도메인 조회 테이블은 구별한다. 다음은 조회 목적을 이해하기 위한 주요 대응이다.

| 자료군 | 주요 테이블 계열 | 해석 경계 |
| --- | --- | --- |
| 인물·프로필·관계 | `person`, `person_alias`, `profile`, `profile_node`, `profile_field`, `relation`, `relation_type` | 안정 ID·route·순서·방향 보존 |
| 공개 색인 | `index_document`, `index_section`, `index_person`, `index_corridor_person`, `index_issue` | authored 상태와 현재 승인 분리 |
| 가치·욕망·성별·혈통 | `person_value`, `person_desire`, `person_gender`, `person_lineage`, `person_lineage_source_clan`, `lineage_node`, `lineage_parent` | nullable 참조를 새 인물이나 한국식 가문으로 만들지 않음 |
| 전역 신원·정책·조사 | `identity_registry_provenance`, `identity_gender_provenance`, `identity_gender_policy`, `identity_clan_research_source`, `identity_lineage_provenance` | 정책·조사 계보는 개인별 수치 승인과 다름 |
| 생일·가계·가구 | `family_*`, `household_*`, `diaspora_*` | 원천 상태와 가족·가구 관계의 방향 보존 |
| 현행 문맥·권리·직책 | `context_*` | current validity, authority, 권리 전환, 비소유 범위, 현재 직책과 이력을 구별 |
| 보관 정치·권리 | `historical_*` | superseded 자료를 현재 권리로 승격하지 않음 |
| 공개 엔진 | `current_engine_source`, `current_profile`, `ability`, `skill`, `trait`, `effect`, `health`, `body`, `disease`, `narrative` | 공개 허용 projection만 저장·노출 |
| 출처·품질 | `source_file`, `source_record`, `reference_source`, `source_reference`, `excluded_source`, `source_check_run`, `source_check_issue`, `quality_issue` | 과거 provenance와 현재 권위를 구별 |
| 본문·행 보존 | `text_document` 및 자식 테이블, `text_line_document`, `text_line` | 정규화 본문과 보존 행의 역할을 구별. 현재 편집에는 document-cli head 사용 |

과거 text corpus는 본문 노드·목록·표·run·앵커·링크를 정규화하고 Markdown/CSV/일부 JavaScript의 물리 행을 보존했다. JavaScript 행 보존은 의미 파싱이 아니다. `corpus_kind`의 current-source·historical·example 구분과 renderer-visible `published` 앵커는 각각 자료 분류와 표시 가능성을 뜻하며 게시 허가가 아니다.

과거 source manifest의 primary raw, reference hash-only, private-engine hash-only, excluded hash-only 구분은 보존된 계보의 범위를 설명한다. hash-only 기록만으로 원문 BLOB을 복구할 수 없으며 무손실 백업도 아니다. 기존 JSON pointer는 당시 대상과 발생 위치를 구별해 읽는다. 논리 경로나 pointer가 있다고 해서 임의 디렉터리·URL·비공개 저장소를 탐색하지 않는다.

새 편집의 권위는 PG 현재 head다. `wiki.source_file`에 보존된 원천 바이트·해시와 `wiki.source_record`의 provenance 및 봉인된 revision은 불변 역사 증거로 보존한다. SQLite 외부 archive의 전환 후 정리와 이 PG 증거는 별개이며, archive를 없애더라도 PG 증거를 삭제·수정하지 않는다. 과거 입력 바이트를 현재 head와 같게 만들기 위해 이력을 고치거나 삭제된 JSON을 복원하지 않는다.

## 비공개 editorial·Soul 경계

관계 검증기 `node lore/relations/validate.mjs --private-pg <connection-string>`는 공개 관계 자료와 `lore/editorial/seoul-narrative-census-events.json`의 비공개 event-ID ledger를 동일한 read-only PostgreSQL transaction에서 읽는다. 이 경로만 명시적으로 private capability를 주입한다. 인자 없는 검증은 private access를 허용하지 않아 `E_PRIVATE`로 실패하며, ledger를 파일·archive·환경 변수로 우회하지 않는다. 표준 출력은 집계 PASS만, 오류 출력은 오류만 담으며 ledger 본문·자격증명은 출력하지 않는다.
공개 엔진에는 허용된 역량·숙련·특성·신체·질병·근거 서사만 투영한다. Soul, 역사 모티브, 비공개 basis/evidence, private profile 상태와 승인 원문을 함께 싣지 않는다. 공개에 허용된 hash·projection metadata와 비공개 원문은 구별한다.

과거 excluded 경로 17개나 engine batch 9개 같은 수치는 당시 제외 계약의 기록이다. 현재 비공개 저장소 전체의 개수·완전성·권한 검사를 대신하지 않는다. 과거 검토 baseline이나 `batches=[]`, `approvals=[]`였던 장부도 새 서울 수여 승인으로 사용할 수 없다.


## 품질 문제와 역사 기록

과거에 관측된 GURPS의 `uncited-note`, 성별 정책의 선언 인구 1,016명과 보존 registry 1,022명의 차이, 미연결 색인, 미해결 pointer는 숨기거나 임의 보정하지 않는다. 다만 옛 건수를 현재 검사 결과로 재사용하지 않는다. 현재 511명이라는 disposition 분모를 과거 정책 선언이나 registry 분모에 대입해서도 안 된다.

비한국계 혈통의 한국식 clan FK가 NULL인 것은 원본 참조를 버렸다는 뜻이 아니다. `person_lineage_source_clan`과 naming convention provenance를 함께 읽는다. 과거 62명·59개 원본 참조·303개 한국식 clan이라는 스냅숏 수는 현재 고정 검증값이 아니다.

새 오류를 조사할 때에는 현재 head·도메인 행·보존 provenance·승인 기록을 구분해 대조한다. 미확인을 0·성공·금지로 대체하지 않고, 수정 가능한 문제는 조사해 고치며 사용자 판단이 필요한 사항은 근거 있는 대안을 제시한다.

## 닫힌 사본의 읽기 전용 SQL

이관 export가 완료돼 닫힌 파일을 받은 뒤 사본을 읽는다. 실행 중인 DB 파일을 무조건 복사해 일관된 백업이라고 가정하지 않는다. export의 journal 상태와 sidecar 필요 여부는 실제 산출물에서 확인한다. 이 예시는 PG 백업 방법이 아니다.

```powershell
$castCopy = Join-Path $castOut 'wiki-cast-copy.sqlite'
Copy-Item -LiteralPath $castDb -Destination $castCopy

sqlite3 -readonly -json "$castCopy" "SELECT person_id,name,public_route FROM person WHERE person_id='K1022';"
sqlite3 -readonly -json "$castCopy" "SELECT state_id,population,observed_population,female_count,observed_female_count,alignment_status FROM identity_gender_policy ORDER BY state_id;"
sqlite3 -readonly -json "$castCopy" "SELECT research_source_id,source_url,accessed_on,live_check FROM identity_clan_research_source ORDER BY ordinal;"

npm run cast:verify -- --db "$castCopy"
```

첫 SQL은 보존된 ID 행을 조회하는 예이며 현재 511명에 포함되는지 판정하는 쿼리가 아니다. 현재 인원 집계에는 disposition을 적용한다. 정책의 `population`은 선언값, `observed_population`은 해당 저장 계약의 관측값이다. `differs-current`는 차이이지 인물 누락·승인 판정이 아니다. SQL 조회 결과도 최신 의미 검토를 대신하지 않는다.

## 검증·생성 보고

자동 검증 명령은 현재 구현과 입력을 확인해 실행한다. 이관 SQLite 검사와 PG 대사, 실제 PG stage 검증을 구분하고 실행한 명령·종료 코드·식별 정보·검사 범위를 기록한다. 과거 결과를 현재 성공 증거로 재사용하지 않는다.

문서에는 새 테스트 수, 전체 통과, source freshness, 원격 반영 또는 소유자 승인을 만들어 적지 않는다. 최종 보고는 저장 검증, 의미 검토, 생성 완료, 게시 확인, 게임 구현, 승인 상태를 각각 분리한다.
