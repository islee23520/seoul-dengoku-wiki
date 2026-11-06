# repo 편집 → 운영 PostgreSQL 적용 경로 설계 제안

- 상태: **채택·구현됨**(D1–D10 소유자 승인, 2026-11-03). 제안 원문은 첫 커밋에 그대로
  보존됐고, 아래 "채택·구현 노트"가 이후 차이를 기록한다. 작성 시점에는 어떤 코드도
  구현하지 않았고 운영 PostgreSQL 접속·쓰기를 한 번도 수행하지 않았다(PG 접속 0회).
- 목적: PR #668(병합 완료, 2026-11-03T09:12:09Z)이 `db/seeds`에 담은 위키 컨텐츠
  seed(215 테이블 / 605,205 행 / 225 JSONL)를 **repo에서 편집해 운영 PG에 반영하는**
  경로의 설계와, 기존 typed-CLI 편집 정책과의 충돌·양립 관계를 정리한다.
- 기준선: `origin/main` = `66768288a`(seed 확정 커밋; 커밋열 `0c9b1d49a` → `61a176856`
  → `4a059b531` → `f578db2c9` → `f6371fd0e` → `66768288a`). 이 문서의 모든 사실 인용은
  이 기준선 또는 본 문서 작성 세션에서 직접 읽은 파일·응답에 근거한다(부록 A).

## 0. 배경: 있는 것과 없는 것

PR #668이 만든 것(이하 "seed 도구", `scripts/seed-{export,apply,core}.mjs` + `db/seeds/`):

- `seed:export` — 운영 PG `wiki` 스키마에서 공개 컨텐츠 seed를 `db/seeds`로 **읽기 전용**
  반출한다. 결정적 포맷(PK 오름차순 `row_to_json` 행, 도메인별 파일, 40,000행 샤드,
  sha256·행수 manifest, 타임스탬프 없음). 승격은 `.promote-pending.json` 저널로 보호된다.
- `seed:apply` — `db/seeds`를 대상 PG에 적재한다. **`INSERT … ON CONFLICT DO NOTHING`
  단일 경로**: 이미 있는 행은 절대 건드리지 않고, 갱신·삭제 경로는 존재하지 않는다.
  스크래치·리허설 환경 부트스트랩이 명시된 용도다(`scripts/seed-apply.mjs` 헤더 주석).
- 경계 이중 검사 — `isPublicTable`(`server/wiki-table-allowlist.mjs`, PR #666 소유자
  결정) AND `isSeedTable`(`scripts/seed-scope.mjs`, 소유자 결정 2026-11-03).
  `wiki_private`은 어떤 경로로도 조회하지 않는다. 컬럼 타입은
  text/bigint/double precision/bytea로 제한(`E_SEED_COLUMN_TYPE`).

없는 것: **repo에서 편집한 값을 운영 PG에 반영하는 경로.** `seed:apply`는
`ON CONFLICT DO NOTHING`이라 기존 행 갱신이 불가능하고, 운영을 향한 갱신 적용은
"운영 데이터 흐름의 정방향은 언제나 PG → repo다"(`db/seeds/README.md`)라고 명시돼
있다. 이 문서는 이 역방향 경로를, 기존 정책을 위반하지 않는 형태로 설계한다.

운영 토폴로지(적용 대상): `wiki-postgres`(postgres:17, desktop-bo514et 통합 compose
`seoul-dengoku-web`, DB `seoul`, 슈퍼유저 `wiki_owner`, 5432 비공개). 테이블 구조 변경은
`db/migrations`(drizzle custom SQL)를 PR로만 merge해야 호스트 적용기 `wiki-migrate`
서비스가 적용한다 — `wiki-migrate-loop.sh`는 300초마다 `origin/main`을 fetch해
`db scripts package.json`만 checkout하고 `node scripts/db-migrate.mjs`를 실행한다.
적용기 실행 후마다 `wiki_reader` 공개 읽기 권한이 재확정된다. 백업은 야간(03:30)
`pg_dump` → `E:\git\seoul-dengoku-web\backups\seoul-latest.sql`(+sha256).

## 1. typed-CLI 편집 정책과의 충돌 분석

### 1.1 정책의 근거(원문 계층)

"운영 편집은 typed CLI로 PG에서만"이라는 정책은 한 곳이 아니라 네 계층에서 같은 방향을
강제한다. 위에서 아래로 내려갈수록 기계적 강제에 가깝다.

| # | 근거 | 위치 | 요지 |
|---|---|---|---|
| P1 | `AGENTS.md`(repo 계약) | "Code Conventions" 절: "**PostgreSQL 운영 저작.** 지원되는 typed CLI로 문서 변경; `public/`·`src/generated*` 직접 수정 금지" / Development Commands 절: "문서 편집은 `document-cli.mjs` edit — stdin typed 명령 배열 + `--expected-revision --actor --reason` 필요. **편집은 draft 생성일 뿐 승인을 의미하지 않는다**" / "승인 경계" 절: "편집은 draft이며 기존 승인을 승계하지 않는다" | PG가 운영 저작 정본이고 편집 수단은 typed CLI뿐. 편집≠승인 |
| P2 | `lore/AUTHORING-JSON.md`(저작 절차 정본) | "편집과 검토" 절 6단계: "기존 CLI가 지원하는 typed 편집 명령을 stdin으로 전달한다… **JSON 파일을 새로 만들거나 생성 JSON을 수정하는 방식으로 대체하지 않는다**" / "edit 후 새 head와 revision 이력을 다시 읽는다. **이전 revision은 덮어쓰거나 삭제하지 않는다**" / "편집으로 인한 draft invalidation을 확인한다. 이전 본문에 대한 검토·승인을 변경된 본문에 자동 승계하지 않는다" | 파일·JSON 직접 수정 금지, revision 불변, 승인 비승계 |
| P3 | `scripts/cast-sqlite/document-cli.mjs`(CLI 구현 = 강제 장치) | L13-15 사용법: edit은 `--id --domain --expected-revision [--expected-hash] [--expected-result-hash] --actor --reason`, "typed command array required on stdin", "Editing creates a draft and does not grant publication approval" / L38-41: 필수 키 `connectionString, corpusKind, documentId, domain, expectedRevision, actor, reason` 누락 시 즉시 실패 | 낙관적 동시성(expectedRevision)·출처(actor·reason)·draft 경계가 코드로 강제됨 |
| P4 | `db/seeds/README.md`(seed 계약, PR #668로 병합) | "이 디렉터리는 … 결정적 JSONL로 버전 관리하는 **투영이며, 독립적인 편집 원본이 아니다**" / 루프 절: "운영 편집은 기존 typed CLI(`scripts/cast-sqlite/document-cli.mjs`)로 **PG에서만**" / "**운영 데이터 흐름의 정방향은 언제나 PG → repo다**" | seed는 투영. 역방향(repo→PG)은 현재 계약에 없음 |

### 1.2 "repo 편집 → 운영"이 충돌하는 지점

| # | 충돌 | 어떤 근거와 | 왜 | 해소 조건 |
|---|---|---|---|---|
| C1 | **정본 방향 역전** — repo→PG 적용은 제2의 쓰기 경로이며 "정방향은 언제나 PG → repo"(P4)를 깬다 | P4, P1 | 두 쓰기 경로가 병존하면 split-brain(어느 쪽이 정본인지 결정 불가) | 적용 직후 `seed:export` 재수렴을 **원자 규약**으로 강제: 적용이 끝난 PG에서 반출하면 repo와 바이트가 같아야 한다(다르면 `E_SYNC_DRIFT` 실패). PG는 계속 단일 정본이고, repo 편집은 "리뷰를 거친 변경의 전달 수단"일 뿐이다 |
| C2 | **개정 기계 우회** — `text_*`(162종), `document_head`, `glossary_head/revision` 등은 typed 개정 흐름이 유지하는 현재값 투영이다. 예: `text_atlas`는 `document__revision`, `json_pointer` 등 개정 연동 컬럼을 가지고, `document_head(source_id, revision_id, public_admission)`는 개정을 가리킨다. 직접 UPDATE는 (a) 개정 이력 무기록, (b) `expectedRevision` 낙관적 동시성 우회, (c) draft→승인 경계 우회 | P1, P2, P3 | `document_revision*`(seed 제외)과 봉인·승인 테이블이 감사 이력인데, 현재값만 바꾸면 이력과 단절된다 | v1 적용 범위에서 **개정 관리형 테이블을 제외**한다(아래 D1). 이 표들은 계속 typed CLI로만 편집한다. sync가 이 표의 변경을 감지하면 적용을 거부한다 |
| C3 | **출처(provenance) 부재** — typed CLI는 `--actor --reason`을 필수로 하지만(P3), seed JSONL은 결정성을 위해 actor/reason을 행에 심지 않는다. actor가 없는 테이블도 많다(`person` 15컬럼 전무 등) | P3 vs seed 결정성 계약 | 행에 actor를 추가하면 결정적 반출이 오염되고, 빼면 누가 왜 바꿨는지 사라진다 | 출처는 **행이 아니라 적용 로그**에 기록한다: 신규 테이블 `wiki.seed_sync_log`(마이그레이션으로 신설)에 merge SHA·PR·행수·diff 해시·시각을 남긴다. `current_region_disposition`처럼 actor/reason 컬럼을 내장한 표는 값 자체에 출처를 실어 리뷰된다 |
| C4 | **적용 수단의 위상** — 운영 쓰기는 현재 적용기(db-migrate)가 `wiki_owner`로만, 그것도 마이그레이션 파일 한정으로 수행한다. 임의 데이터 UPDATE를 만들면 "직접 수동 SQL로 테이블을 바꾸지 않는다"(deploy/README) 정신에 반한다 | AGENTS.md main판 L124-125, deploy/README | 인간이 psql로 직접 바꾸는 것과 도구가 리뷰된 diff를 적용하는 것은 다르지만, 경계가 흐려진다 | 적용은 **사람이 아니라 호스트 적용기가** merge된 main 기준으로만 수행(아래 §2). repo에는 SQL을 두지 않고 diff만 둔다 |

### 1.3 양립(오히려 강점이 되는) 지점

| # | 양립 요소 | 근거 |
|---|---|---|
| H1 | **경계 재사용** — sync 대상도 `isPublicTable AND isSeedTable` 이중 검사를 그대로 통과시키면, 데이터 경계는 소유자가 이미 결정한 두 허용목록 그대로다 | `seed-core.mjs` 경계 단일 출처 원칙 |
| H2 | **PR 리뷰 = 가시적 데이터 이력** — 결정적 JSONL의 git diff가 곧 검토 가능한 데이터 델타다. seed README가 이미 이를 천명한다("데이터 델타는 이 디렉터리의 git diff가 곧 가시적 마이그레이션 이력이다") | `db/seeds/README.md` 루프 절 |
| H3 | **PR-merge-only 적용기 패턴 존재** — `wiki-migrate`가 이미 "main에 merge된 것만, 300초 폴링, 호스트 네트워크 내부, wiki_owner 자격" 패턴을 구축했다. 데이터 적용기를 같은 패턴으로 만들면 새로운 운영 채널이 생기지 않는다 | `deploy/docker-compose.wiki-migrate.yml`, `wiki-migrate-loop.sh` |
| H4 | **dry-run·검증 선례** — `seed:apply --verify`(행수 대조)와 `--verify-pg`(stage만 검증)가 이미 "실행 없이 검사" 패턴을 확립했다 | `seed-apply.mjs`, `generate-release.mjs --verify-pg` |
| H5 | **운영 보호 관례** — 5432 비공개·자격은 `.env`/0600 파일·에러에서 URL 세척(`sanitizeError`)이 seed 도구에 이미 구현돼 있다 | `seed-core.mjs` |

결론: 충돌 C1·C2는 "무엇을 repo 편집할 수 있는가"(범위)와 "적용 후 어떻게 수렴하는가"
(재반출 원자성)로 해소되고, C3·C4는 출처 로그와 적용기 위상으로 해소된다. 즉
**repo 편집 경로는 정책을 대체하는 것이 아니라, typed CLI가 다루지 않는 표에 한해
같은 승인·출처·불변성 원칙을 PR 형태로 확장하는 것**으로 설계해야 한다.

## 2. 제안: PR 게이트 `seed:sync` — 비파괴 review+apply 경로

새 스크립트 `scripts/seed-sync.mjs`(`npm run seed:sync`)를 제안한다(설계만; 구현은
소유자 승인 후 별도 PR). 핵심 규칙:

> 1. **운영 데이터를 절대 덮어쓰거나 초기화하지 않는다.** 적용은 INSERT와
>    baseline-보장 UPDATE뿐이며, 어떤 TRUNCATE/DELETE/DROP도 없다.
> 2. **기본값은 dry-run.** 인자 없이 실행하면 repo vs PG diff만 출력한다.
> 3. **DELETE는 영구 미지원.** repo에서 행을 지운 것은 "감지 후 적용 거부"로만
>    다룬다(`E_SYNC_DELETE_PRESENT`). 삭제는 소유자 명시 승인 없이는 어떤
>    자동화로도 수행되지 않는다(아래 D2).
> 4. **적용은 기존 PR-merge-only 적용기 패턴을 통해서만.** 사람이 운영에 직접
>    쓰지 않는다.

### 2.1 워크플로(repo 편집 → 운영)

```text
[편집자]                          [PR/리뷰]                [호스트 적용기 wiki-sync]         [운영 PG]
1. db/seeds/<도메인>/<표>.jsonl 편집
   (또는 PG typed 편집 후 seed:export — 기존 루프)
2. npm run seed:sync              ─ diff 산출물(§2.2)을 PR에 첨부
3. manifest 재계산 항목 첨부        ─ 리뷰: 값 단위 검토
                                  4. merge to main ──────▶ 5. 마커 확인·재검증
                                                           6. seed:sync --apply ──────────▶ INSERT / baseline UPDATE
                                                           7. seed:export 재수렴 검증 ────▶ (repo와 바이트 동일해야)
                                                           8. seed_sync_log 기록
```

- **diff(1-3단계)**: `seed:sync`는 기존 `WIKI_SEEDS_PG[_FILE]/WIKI_SEEDS_PSQL` 연결
  계약 그대로 PG를 **읽기 전용**으로 읽어(자격은 `wiki_reader`로 충분 — 적용기가 매번
  재부여하는 SELECT 권한) repo JSONL·manifest와 대조한다. repo 편집 PR은 (a) 변경된
  JSONL과 (b) 도구가 재계산한 manifest 항목(행수·sha256)을 함께 포함한다. 편집자가
  manifest를 손으로 고치는 것은 금지다(결정성 훼손).
- **적용 승인(4-5단계)**: PR에 적용 요청 마커 `db/seeds/.sync-request.json`
  (`{ "base_manifest_sha256": …, "diff_sha256": …, "pr": 123 }`)를 커밋하면,
  merge가 곧 적용 승인이다(마커가 없는 seed 변경 PR은 반영되지 않는다 — 기존
  export-PR과 같은 취급). 적용기는 마커의 `base_manifest_sha256`가 merge 시점
  main의 manifest와 일치하는지, 이미 적용한 마커(`seed_sync_log` 조회)가 아닌지
  확인한다.
- **적용(6단계)**: 단일 트랜잭션에서 표별로 다음만 수행한다.
  - 신규 행: `INSERT … ON CONFLICT DO NOTHING`(기존 apply와 동일 문법 재사용)
  - 변경 행: `UPDATE wiki.<표> SET <변경컬럼>=… WHERE <PK> AND <전 컬럼>=base값`
    — WHERE의 base값 대조가 `expectedRevision`을 표 단위로 일반화한 낙관적 잠금이다.
    base가 다르면(리뷰 후·적용 전에 PG가 움직였으면) 그 행에서 실패 → 전체 rollback
    → `E_SYNC_BASE_MOVED`로 중단. 부분 적용은 존재하지 않는다.
- **재수렴 검증(7단계)**: 적용 직후 같은 연결로 `seed:export` 논리(결정적 재반출)를
  메모리에서 수행해 repo 트리와 바이트가 동일한지 확인한다(C1 해소). 다르면 적용은
  이미 rollback된 상태가 아니므로 로그에 `drift`로 기록하고 알림(다음 export PR에서
  잔여 drift가 가시화된다).
- **출처(8단계)**: `wiki.seed_sync_log(applied_at, merge_sha, pr, tables, rows,
  diff_sha256, outcome)`에 1행(마이그레이션 `000x_seed_sync_log.sql`로 신설 —
  허용목록에 넣지 않아 공개 API로 노출되지 않는다).

### 2.2 diff 산출물(reviewable typed diff)

dry-run 출력은 사람·기계 양쪽이 읽는 JSON+요약으로, 표별로:

```jsonc
{
  "event": "seed-sync-diff",
  "base": { "manifest_sha256": "…", "pg_read_at": "2026-11-03T…Z" },
  "tables": [
    {
      "table": "state_label",
      "insert": [{ "pk": {"state_id": "S14", "name_ko": "…"} }],
      "update": [{ "pk": {"state_id": "S09"}, "base": {"name_ko": "…"}, "next": {"name_ko": "…"} }],
      "delete": [],
      "out_of_scope": []   // v1 범위 밖 표의 변경이 감지되면 여기 나열되고 apply는 거부된다
    }
  ],
  "refused": { "reason": null }   // E_SYNC_DELETE_PRESENT / E_SYNC_OUT_OF_SCOPE / …
}
```

PR에는 이 파일을 그대로 첨부한다. seed는 공개 범위 데이터이므로 diff에 비공개 값은
나오지 않는다(`wiki_private` 미조회, 이중 검사 경계).

### 2.3 v1 범위(권고) — 개정 관리형 제외

- **v1 허용(비투영·저작 입력에 가까운 표)**: `state`, `state_label`,
  `clan_crest_motif`, `current_region_disposition`, `current_right_retirement`,
  `retirement_prose`, `relation_type`, `geography_*`(상수 계층) 등 소규모 상수·상태표.
- **v1 제외(개정/생성 기계가 유지하는 투영)**: `text_*` 162종, `document_head`,
  `document_key_order`, `glossary_*`(개정 단위 서빙), `region_content_*`(생성 파이프라인
  산출), `person`/`person_*`/`profile`/`relation`(인물 원장 — people/cast 전용 도구와
  권리·퇴역 절차가 얽힘), `public_map_*`(지도 투영). 이 표의 repo 직접 편집은
  sync가 `E_SYNC_OUT_OF_SCOPE`로 거부한다.
- 이 분할 자체는 소유자 결정 사항이다(D1). 제외 표에 repo 편집이 필요해지면
  별도 설계(예: diff를 typed 명령으로 변환해 document-cli edit 흐름에 넣는 경로,
  expectedRevision 승계 포함 — 옵션 B)를 후속 제안한다.

### 2.4 운영 무결성 장치 요약

| 장치 | 내용 |
|---|---|
| dry-run 기본 | 인자 없으면 읽기 전용 diff만. `--apply`는 명시 플래그 |
| DELETE 불가 | 감지만 하고 `E_SYNC_DELETE_PRESENT`로 apply 거부. DB 권한도 `wiki_sync_writer`(신설 LOGIN)에 INSERT/UPDATE만 부여 — 삭제는 권한 차원에서 불가능 |
| baseline 잠금 | UPDATE WHERE 전 컬럼=base + 마커의 manifest sha 대조 → 리뷰-적용 사이 운영 이동 감지 시 전체 rollback |
| 단일 트랜잭션 | 전체 apply가 한 트랜잭션(또는 소유자가 표별을 선택하더라도 실패 즉시 전체 rollback 보고) |
| 재수렴 검증 | 적용 후 결정적 재반출이 repo와 바이트 동일해야 한다(C1) |
| 출처 로그 | `wiki.seed_sync_log`에 merge SHA·PR·diff 해시·행수 |
| 롤백 지점 | 야간 `pg_dump`(03:30) + 권고: 적용 직전 수동 dump 1회(§4 D4) |

## 3. 마이그레이션 ↔ seed 대응 관계: 변경 주기의 실행 순서

### 3.1 한 주기의 표준 순서

```text
(1) 스키마 migration PR ──▶ (2) seed export refresh ──▶ (3) seed diff review ──▶ (4) apply
```

| 단계 | 무엇을 하는가 | PG 변화 | seed(db/seeds)에서 바뀌는 값 |
|---|---|---|---|
| (1) 스키마 migration | `npm run db:migration:new -- <이름>`(drizzle custom SQL) → `db/migrations/NNNN_*.sql` PR → merge → `wiki-migrate` 적용기가 300초 내 적용, `wiki_reader` 권한 재확정 | **구조만**(DDL) | 이 PR 자체는 아무 것도 바꾸지 않는다. 다음 export에서 manifest의 해당 표 `columns`/`primary_key`가 늘고(예: 신규 컬럼), 전 행에 신규 컬럼값(보통 null)이 붙어 JSONL·sha256가 갱신된다 |
| (2) seed export refresh | `WIKI_SEEDS_PG(또는 _PSQL) npm run seed:export` — 운영을 읽기 전용으로 재반출해 PR로 merge | 없음(읽기 전용) | manifest(행수·sha256·columns)과 JSONL 전체가 새 정상 상태 base로 교체. 운영에서 발생한 typed 편집의 값 변화가 이 단계에서 가시화된다(기존 PG→repo 루프) |
| (3) seed diff review | repo에서 JSONL 편집(신규 루프) 또는 (2)의 drift 확인 → `npm run seed:sync`(dry-run 기본) → diff 산출물을 PR에 첨부해 값 단위 리뷰 | 없음 | 편집자가 바꾼 JSONL 행 + 도구가 재계산한 manifest 항목 |
| (4) apply | PR merge(마커 포함) → 호스트 적용기 `seed:sync --apply`: INSERT/baseline-UPDATE만, 재수렴 검증, 로그 기록 | **값만**(DML) | 변화 없음(repo가 이미 목표 상태) — 다음 export는 no-op이어야 한다 |

불변식: **(1)은 구조만, (4)는 값만 바꾼다.** seed 도구는 `db/migrations`에 파일을
만들지 않으므로 기존 적용기 계약은 그대로고(README 명시), 반대로 마이그레이션은
데이터를 싣지 않는다("data-loading entries must stay out of the migration path").
값 변경 주기와 구조 변경 주기가 독립적으로 검토·적용된다.

### 3.2 실측 예시(현행 기준선의 실제 표·행수 기반)

**예시 A — 값 수정(repo→PG, v1 범위)**: `db/seeds/misc/state_label.jsonl`(18행,
PK `(state_id, name_ko)`)에서 `S09` 상태 표기의 오탈자를 고친다.

1. 편집자: JSONL 해당 행 1줄 수정. `npm run seed:sync` →
   `{"table":"state_label","update":[{"pk":{"state_id":"S09","name_ko":"<기존>"},"next":{"name_ko":"<수정>"}}],"insert":[],"delete":[]}`.
   도구가 재계산한 manifest 항목(`rows: 18` 동일, `sha256` 갱신)을 같은 PR에 포함.
2. 리뷰: diff 1행 — 누가 무엇을 왜 바꾸는지 PR 본문으로 확인(출처는 PR에 있다).
3. merge(마커 포함) → 적용기:
   `UPDATE wiki.state_label SET name_ko=$1 WHERE state_id='S09' AND name_ko=$2(base)`.
   base 불일치 시 `E_SYNC_BASE_MOVED` 전체 rollback.
4. 재수렴: `seed:export` 메모리 재수행 == repo 트리(바이트 동일). 다음 정기 반출도 no-op.

**예시 B — 신규 행(repo→PG)**: `current_region_disposition`(3행,
`region_id, status, decision_ref, actor, reason` — 표 자체가 출처 컬럼을 요구한다)에
새 지역 결정 `R-107`을 추가한다. JSONL에 1행(actor="owner", reason="PR #…") 추가 →
sync diff `insert 1` → merge 후 적용기 `INSERT … ON CONFLICT DO NOTHING`. 값 안에
출처가 실려 있어 리뷰가 곧 결정 기록이 된다.

**예시 C — 스키마+데이터 완결 주기**: `state`(18행, `(state_id, name_ko)`)에 영문명
컬럼이 필요해졌다면: ① `db:migration:new add-state-name-en`
(`ALTER TABLE wiki.state ADD COLUMN name_en text`) PR → merge → 적용기 적용.
② 다음 `seed:export`에서 manifest `state.columns`에 `name_en`이 추가되고 18행 전체에
`"name_en":null`이 붙는다 — 이 diff가 곧 구조 변화의 seed 가시화다. ③ 값 채우는
repo 편집 PR(예시 A 방식, `update 18행`) 또는 운영 typed 편집 후 export. ④ 적용·재수렴.

**예시 D — 충돌(rebase 필요)**: 예시 A의 PR이 열려 있는 동안 운영에서 typed CLI가
같은 표를 편집했다면(기존 PG→repo 루프), 적용기의 UPDATE가 base 불일치로 실패한다.
절차: `seed:export` 재반출로 새 base를 PR에 rebase하고 diff를 다시 리뷰한다. 낙관적
동시성이 "조용한 덮어쓰기"를 원천 차단하는 지점이 이것이다.

## 4. 소유자 결정 필요 사항(전량)

구현·운영 전에 소유자가 결정해야 하는 목록. 각 항에 권고를 붙인다.

| # | 결정 | 선택지 | 권고 |
|---|---|---|---|
| D1 | **v1 sync 범위**(경계 변경) | (a) §2.3 권고안(상수·상태 표만) (b) 인물·용어 등 확대 (c) 개정 관리형까지 확대(typed 명령 변환 경로 = 옵션 B 별도 설계) | (a)로 시작. 범위 조정은 `seed-scope.mjs`와 같은 PR 검토 절차로 |
| D2 | **DELETE 정책** | (a) 영구 금지(감지만) (b) 소유자 명시 승인 + 별도 절차(승인 영수증을 요구하는 owner 전용 경로) 후 허용 | (a)로 시작. 필요 시 (b)를 완전히 별도 PR로 설계 |
| D3 | **apply 실행 주체·자격** | (a) 호스트 적용기 자동(merge=적용, 마커 방식) — 신설 `wiki-sync` 서비스(또는 wiki-migrate 확장 모드), 전용 LOGIN `wiki_sync_writer`(INSERT/UPDATE만) (b) 소유자 수동 트리거(dori/SSH에서 1회 실행) | (a). 사람 손이 PG에 닿는 경로를 만들지 않는 것이 C4 해소 조건 |
| D4 | **rollback 이야기** | 야간 dump(03:30)만으로 충분한가? 적용 직전 dump 1회를 적용기가 자동 수행할까(용량·시간 비용)? 시점 복구(PITR/WAL 보관) 도입 여부? | 적용기가 apply 직전 `pg_dump` 1회를 남기고 성공 로그에 그 해시를 기록. 대규모 apply(만 행 단위) 시에만 소유자 사전 승인 |
| D5 | **repo 편집 규약** | JSONL 직접 편집을 누가 할 수 있나(브랜치·PR 필수는 기존 정책 준수)? manifest 재계산을 도구에 강제할까(편집자 수동 금지)? 편집 단위(표/도메인 제한)? | manifest는 도구 재계산만 허용, 편집 PR 체크리스트에 "sync diff 첨부"를 의무화 |
| D6 | **base 이동 감지 강도** | 전수 행 대조(전 컬럼 WHERE) vs PK+변경 컬럼만 | 전수(§2.1 설계). 605,205행 중 v1 범위 표는 소규모라 비용 문제 없음 |
| D7 | **출처 로그 표의 위치·보존** | `wiki.seed_sync_log`(공개 스키마·비공개 표) vs `wiki_private` | `wiki` 스키마에 두되 허용목록 미등록(공개 API 비노출). 보존 무기한 |
| D8 | **drift 감시 운영** | 정기적 `seed:export` dry-diff(예: 주 1회)로 운영↔repo 이탈 감시를 CI/스케줄로 둘까? | 도입 권장 — 적용 경로와 무관하게 운영 편집의 가시성을 높인다 |
| D9 | **적용 결과 알림** | 성공/실패를 어디에 보고할까(기존 deploy owner NDJSON·슬랙 스레드·로그만)? | 적용기 로그 + `seed_sync_log` 최소. 알림 확장은 운영 지시 후 |
| D10 | **이 문서의 채택 절차** | 본 제안을 PR로 승격해 확정할 것인가(그 경우 이 문서 커밋·리뷰), 범위를 좁혀 재설계할 것인가 | 소유자 검토 후 결정. 구현 PR은 본 제안 승인 후 별도로 |

## 부록 A. 근거 목록(본 문서 작성 세션에서 직접 확인)

- PR #668: https://github.com/islee23520/seoul-dengoku-wiki/pull/668 —
  state=closed, merged=true, merged_at=2026-11-03T09:12:09Z, head `9f0697315`(GitHub API).
- `origin/main` = `66768288a`; seed 관련 커밋 `0c9b1d49a`→`61a176856`→`4a059b531`→
  `f578db2c9`→`f6371fd0e`→`66768288a`(git log).
- `db/seeds/manifest.json` — format `wiki-seeds/1`, 215 테이블 / 605,205 행 / 225 파일,
  도메인 분포(text_* 162, region_content_* 21, people 8, glossary 6, geography 5,
  public_map 3, relations 2, document-heads 2, misc 6), 표별 columns/PK/rows/sha256.
- `scripts/seed-apply.mjs`(전문), `scripts/seed-export.mjs`(전문), `scripts/seed-core.mjs`
  (전문), `scripts/seed-scope.mjs`(전문) — origin/main 기준.
- `scripts/db-migrate.mjs`(전문) — drizzle 적용, `wiki_migrations.__drizzle_migrations`,
  실행 후 `wiki_reader` GRANT 재확정.
- `deploy/docker-compose.wiki-migrate.yml`(origin/main) + 호스트
  `E:\git\seoul-dengoku-web\docker-compose.yml`의 `wiki-migrate` 서비스 +
  `E:\git\seoul-dengoku-web\wiki-migrate-loop.sh`(전문) — 300초 폴링, `origin/main`의
  `db scripts package.json`만 checkout, PR-merge-only.
- `AGENTS.md`(origin/main L74-75, L124-125 및 현행 계약 절), `lore/AUTHORING-JSON.md`
  "편집과 검토" 절, `scripts/cast-sqlite/document-cli.mjs`(L13-15, L20-47),
  `db/seeds/README.md`(루프·연결·형식 절).
- `deploy/README.md`(origin/main) — wiki-postgres 운영 토폴로지, 5432 비공개, 야간
  dump, "테이블 변경은 PR 마이그레이션으로만".
- 표 구조 표본(manifest에서): `person`(1,022행, 15컬럼, audit 컬럼 없음),
  `profile`(1,038행), `document_head`(99행: source_id/revision_id/public_admission),
  `text_atlas`(json_pointer·document__revision 등 개정 연동 컬럼),
  `current_region_disposition`(3행: region_id/status/decision_ref/actor/reason),
  `state`(18행), `state_label`(18행, PK (state_id, name_ko)), `clan_crest_motif`(15행),
  `glossary_term`(12행, PK (revision_id, term_id)).

## 부록 B. 이 제안의 경계(하지 않은 것)

- 운영 PostgreSQL에 대한 접속·쓰기를 수행하지 않았다(본 세션 PG 연결 시도 0회;
  연결 환경변수도 존재하지 않는 상태에서 작업).
- 어떤 스크립트·마이그레이션·마커 파일도 구현·커밋하지 않았다. `seed:sync`,
  `.sync-request.json`, `seed_sync_log`, `wiki_sync_writer`는 모두 **제안 명세**다.
- PR #668(이미 병합)을 다루지 않았고, 본 문서는 기존 seed 도구·적용기 계약을
  변경하지 않는다(확장만 제안).
- 본 문서 자체는 워킹트리 파일로 제출되며 커밋되지 않았다. 저장소 정책(전용
  브랜치+PR)에 따른 승격 여부는 D10 결정에 따른다.

## 채택·구현 노트 (2026-11-03, wiki-apply-impl)

소유자가 D1–D10 권고안을 승인했다(각 항 (a)·권고 선택). 구현은 본 문서의 설계를
따르되 아래를 확정·강화했다.

- 적용 경로: `npm run seed:sync`(`scripts/seed-sync.mjs` + `scripts/seed-sync-scope.mjs`).
  dry-run 기본, `--manifest-write`(D5 — JSONL을 PG 정규형으로 재기입하고 manifest
  재계산), `--write-marker <PR>`(db/seeds/.sync-request.json), `--apply`(마커 확인·
  단일 트랜잭션·전 컬럼 baseline UPDATE·적용 후 바이트 동일 재반출 검사), `--drift`
  (D8 주간 감시). 연결은 `WIKI_SEEDS_PG[_FILE]`(읽기), 적용은 `WIKI_SYNC_PG[_FILE]`
  (wiki_sync_writer 자격, 없으면 seeds 연결 재사용).
- `E_SYNC_DRIFT`는 재반출 불일치 시 **전체 rollback**으로 강화했다(본문은 로그만
  남기는 안이었으나, rollback이 가능한 시점에 검사해 조용한 이탈을 원천 차단한다).
  drift 시도도 seed_sync_log에 outcome='drift'로 남는다.
- wiki_sync_writer에는 스키마 USAGE와 함께 **DB CONNECT 권한**이 필요하다
  (bootstrap-roles가 PUBLIC CONNECT를 제거) — 0001 마이그레이션이 함께 부여한다.
  비밀번호는 저장소에 없고 적용기가 WIKI_SYNC_WRITER_PASSWORD로 주기적
  ALTER ROLE 한다(deploy/wiki-sync-loop.sh).
- `seed:export`의 청소(sweep)가 `.sync-request.json`을 지우지 않도록 보존 목록에
  추가했다. `scripts/db-migrate.mjs`는 매 실행 후 seed_sync_log의 wiki_reader
  SELECT를 다시 막는다(D7 재확정 — 전체 GRANT 후 REVOKE).
- 편집자 규약·체크리스트는 `db/seeds/README.md` "repo 편집 → 운영 반영",
  적용기 운영은 `deploy/README.md` wiki-sync 절과 `deploy/docker-compose.wiki-sync.yml`
  + `deploy/wiki-sync-loop.sh`를 참조한다.
- 일반 테스트 스크립트는 소유자 결정(#625, scripts/AGENTS.md "새 테스트 스크립트를
  작성하지 않는다")에 따라 두지 않았다. 검증은 스크래치 PostgreSQL 실실행 영수증으로
  PR에 첨부한다.
