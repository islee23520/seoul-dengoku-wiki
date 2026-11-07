# Migration과 공개 snapshot 출처

`check-migration-provenance.mjs`는 pinned drizzle-orm 0.45.4의 SQL hash,
journal `when`과 동일한 값으로 원장을 대조한다. 중복·구멍·SQL 고아·meta chain
불일치·적용된 SQL 변경을 거부한다. `readMigrationInventory({root})`,
`verifyLedger(entries, rows, {allowPending})`, `ledgerDigest(rows)`가 공유 API다.
`allowPending`은 정확한 applied prefix 뒤의 신규 migration에만 허용된다.

공개 `public-snapshot.json` 형식은 다음 필드만 허용한다. P2 refresh가 실제
관측으로 생성하며 P1은 예시를 운영 receipt로 만들지 않는다.

- `format`: `wiki-public-snapshot/1`
- `producerCodeSha`: producer의 40자리 Git SHA
- `seedManifestSha256`: 실제 seed manifest 바이트 SHA-256
- `ledgerDigest`: `when`을 decimal 문자열로 정규화한 `{when,hash}` 오름차순
  배열의 pretty JSON + LF SHA-256
- `renderInventorySha256`: 실제 `renders/manifest.json` 바이트 SHA-256

DB명/OID, credential, host 경로, snapshot ID, private receipt, wall-clock은 이
형식에 포함하지 않는다. Git PR/승인 검증 및 보호된 host receipt는 P3/P4가 맡는다.
이 파일은 제2의 적용 원장이 아니다. typed projection/imported snapshot을
실행된 data migration으로 기록하지 않는다.

`node scripts/check-migration-provenance.mjs --offline --snapshot <path>`는
기록된 snapshot과 repo를 검증하며 현재 DB가 같다고 주장하지 않는다. 기본 live
모드는 기존 `WIKI_SEEDS_PG[_FILE]` 또는 `WIKI_SEEDS_PSQL` 읽기 전용 어댑터로
ledger 및 모든 seed 파일을 byte hash 대조한다. 현재 live 검사는 순차 조회이므로
같은 snapshot의 증거는 P2/P3 coordinator가 제공해야 한다. 이것을 full C3나
private generation 재현의 PASS로 보고하지 않는다.

## Migrator와 P4 pending fence

`db-migrate.mjs`는 하나의 leased PG connection에서 advisory lock
`wiki-migrate-v1`을 보유한다. preflight한 불변 SQL을 실제 pinned Drizzle
dialect/session transaction에 전달한다. DML과 ledger의 transaction을 재구현하지
않으며 commit 직전 ledger와 예상 원장을 다시 대조한다. 실패하면 ledger를 읽어
`rolled-back`, `applied-awaiting-projection`, `unknown`을 구분한다.

P4 wrapper는 shared host flock 안에서 **db-migrate 호출 전** pending state를
fsync한다. 이 보수적인 fence는 commit 직전보다 넓다. 정확한 환경 계약:

- `WIKI_PROJECTION_STATE_FILE`: 보호된 pending 파일.
- `WIKI_MIGRATE_CODE_REF`: exact source SHA. pending 파일의 `pendingWatermark`와 동일.
- `WIKI_MIGRATE_POST_REFRESH_SERVICE`: 성공 후 비동기 시작할 systemd `.service` 이름.

export `PROJECTION_ENV`는 위 이름을 고정한다.
`verifyProjectionStatePrecondition(env)`는 파일 존재·JSON·
`status=applied-awaiting-projection`·`pendingWatermark===WIKI_MIGRATE_CODE_REF`를
검사하며 실패 시 `E_PROJECTION_STATE_PRECONDITION`이다. 파일은 쓰거나 지우지
않는다. 이 검사는 connection 전 및 advisory lock 대기 후 transaction 전에 실행한다.
환경 변수가 없는 기존 로컬 runner는 기존 연결 의미를 보존한다.

`runMigrations({beforeCommit})` observer는 transaction 안에서 검증된 ledgerDigest,
pendingWatermark, applied 수를 받는다. observer 실패는 rollback이다. post-commit에는
기존 `wiki_reader` USAGE/SELECT GRANT 두 개를 유지한 뒤
`triggerPostRefreshService(env)`가 `systemctl start --no-block <service>`를 호출한다.
GRANT/refresh 실패는 `E_MIGRATE_POST_COMMIT`이며 이미 commit된 행·원장을 rollback으로
보고하지 않는다. 모든 실패에서 pending 파일은 남는다. P4 refresh는 ledger delta가
0이면 기존 current 복원을 판단하고 1 이상이면 투영 성공까지 배포를 차단한다.

## 공개 scratch 경계와 아직 하지 않은 검증

`scratch-bootstrap.mjs`는 명시적 loopback TCP, 15433이 아닌 명시적 port,
`seoul_scratch_*` 이름과 실제 server identity를 검사한다. 전용 임시 cluster의
빈 DB에 roles, public tables, seed INSERT, 실제 NOT VALID FK, 실제 guards.sql의
public trigger를 순서대로 설치한다. private schema는 baseline migration의 REVOKE가
성공할 빈 경계만 만들며 private table/data는 만들지 않는다. ledger는 만들지 않는다.
실제 baseline drizzle replay는 이후 harness가 별도로 수행해야 한다.

fixture tests는 PG protocol 모델 위에서 실제 Drizzle transaction과 SQL 생성 계약을
검증한다. live PG SQL 문법·guard 실행·두 runner 경합·public roundtrip·full backup
generation·actual PR provenance는 P3 C2/C3 harness의 후속 검증이며 P1 테스트의
통과로 대체하지 않는다. 공개 scratch는 seed 직렬화만 재현하고 admission/렌더
전체성이나 private generation을 재현하지 않는다.
