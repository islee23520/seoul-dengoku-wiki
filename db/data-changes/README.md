# 공개 seed data migration metadata

`npm run seed:sync -- --base-ref <commit> --actor <actor> --reason <reason>
--change-id <id>`는 PostgreSQL 접속 없이 Git baseline과 현재 JSONL을 비교한다.
`--emit-migration --name <slug>`를 추가하면 pinned drizzle-kit 0.31.11의 custom
generator가 SQL 번호, journal, meta snapshot을 배정하고 seed manifest를 재계산한다.
테스트는 `node --test scripts/test-seed-sync.mjs scripts/test-migration-provenance.mjs`로 실행한다.

`<changeId>.json`은 `wiki-data-change/1` 형식이다. 적용 원장은 계속
`wiki_migrations.__drizzle_migrations` 하나다. 이 파일은 공개 설명·재생성 입력이다.

- `changeId`, `actor`, `reason`, `baseCommit`: 안정된 작업 ID, 주장된 행위자·사유,
  실제로 resolve한 40자리 Git baseline. PR 승인이나 DB 인증 주체를 대신하지 않는다.
- `baseSeedManifestSha256`, `targetSeedManifestSha256`: 실제 baseline 및 예상 target
  manifest 바이트의 SHA-256. target은 적용 후 actual 관측이라는 주장이 아니다.
- `rowDeltaSha256`: `delta`의 pretty JSON + LF 바이트 해시.
- `delta`: table, operation(`insert`/`update`), lossless PK key, before/after scalar
  JSON 문자열. 숫자 토큰은 int8 끝값까지 보존한다.
- `tables`: 실제 catalog 컬럼·PK, insert/update 수, 대상 표의 모든 before/after
  canonical row 문자열. SQL은 이 집합으로 transaction 내부 pre/post hash를 비교한다.
- `targetFiles`: 변경 표의 실제 JSONL 바이트. checker는 Git의 baseline에서 이
  파일만 바꾸어 manifest·delta·SQL을 재생성하고 byte-for-byte 대조한다.

SQL 첫 줄 `-- wiki-data-change/1 <hex-JSON>`은 위 메타데이터의 digest와 감사 필드,
대상 표·수를 결합한다. hex는 actor/reason이나 문자열에 있는 SQL 인용문·개행·
Drizzle breakpoint가 실행 구문으로 바뀌지 않게 한다. 최종 자기 commit SHA나
자기 파일 hash를 자기 안에 넣지 않는다. payload만 주장한 hash는 검증 근거가 아니다.

범위는 `scripts/seed-edit-scope.mjs`의 12개 표이며 `current_region_disposition`,
`current_right_retirement`는 INSERT-only다. DELETE·PK 변경·scope 외 편집·schema
변경은 `E_SYNC_*`로 거부한다. PK 변경은 동일 non-PK 내용을 갖는 삭제+추가로
진단한다. 식별 불가능한 삭제+추가도 DELETE로 거부한다. FK 부모 INSERT가 먼저이며
cycle은 거부한다. 한 migration은 대상 표만 lock하여 prehash→DML→posthash를
같은 transaction 안에서 검사한다. UPDATE는 PK 및 모든 baseline 컬럼을
`IS NOT DISTINCT FROM`으로 잠근 뒤 다시 평가하며 정확히 1행이어야 한다.

manifest v1에는 PostgreSQL text collation이 없다. 따라서 기존 text PK의 순서는
해시로 검증한 Git baseline의 상대 순서를 그대로 유지해야 하며 JavaScript의
임의 collation으로 재정렬하지 않는다. 숫자 PK는 오름차순을 검사한다. 새 text PK의
실제 export 위치는 후속 PG roundtrip에서 확인한다. 예상 target과 actual export가
다르면 projection에서 드러나며 이를 바이트 동일 roundtrip으로 보고하지 않는다.

기존 도메인 검증은 완화하지 않는다. 특히 CIA current-rights reader는 승인된
정확한 2개 retirement/3개 disposition 집합을 요구한다. matrix에서 INSERT가
가능하더라도 그 reader가 새 결정을 승인하지 않으면 `E_CIA_CURRENT_RIGHTS`로
실패한다. 새 approval 모델을 이 생성기가 만들어 내지 않는다. retirement prose도
기존 60행·계산된 text hash 검증을 통과해야 하며 임의 hash 교체는 실패한다.

실패 중 파일 쓰기는 DB transaction이 아니다. journal은 마지막에 기록한다.
부분 SQL/metadata는 provenance preflight의 orphan 검사로 차단된다. 출력 실패 시
미적용 신규 파일만 검토·복구하고 재생성한다. 적용된 SQL/journal/meta는 수정하지 않는다.
실제 운영 data migration은 이 구현 커밋에 포함하지 않는다.
