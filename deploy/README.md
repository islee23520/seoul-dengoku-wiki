# Wiki deployment caller

## wiki-postgres 운영 PostgreSQL (desktop-bo514et)

운영 단일 PostgreSQL 17 클러스터는 desktop-bo514et의 통합 compose
(`E:\git\seoul-dengoku-web\docker-compose.yml`, 프로젝트 `seoul-dengoku-web`)에
`wiki-postgres` 서비스로 상주한다. 서비스 정의는
`deploy/docker-compose.wiki-postgres.yml`(스니펫 복사본)과 동일하다.

- 이미지 `postgres:17`, DB `seoul`, 컨테이너 슈퍼유저 `wiki_owner`.
- named volume `seoul-pgdata`(프로젝트 접두사 `seoul-dengoku-web_seoul-pgdata`).
- 네트워크는 통합 compose 기본값(`seoul-dengoku-web_default`, external).
- **5432 publish 금지** — docker 네트워크 내부 전용이며 외부에서 접근 불가해야 한다.
- healthcheck: `pg_isready -U wiki_owner`(30s 간격).
- 비밀번호는 프로젝트 루트 `.env`의 `WIKI_POSTGRES_PASSWORD`(커밋 금지).

호스트 적용 절차(운영자, lazyssh/desktop-bo514et):

1. `E:\git\seoul-dengoku-web\docker-compose.yml`를 백업한다
   (`docker-compose.before-wiki-postgres.yml`). 기존 web/tunnel/wiki-api 서비스와
   cloudflared 터널 블록은 절대 수정하지 않고, 서비스·volumes 블록만 추가한다.
2. 프로젝트 루트 `.env`에 `WIKI_POSTGRES_PASSWORD`를 설정한다.
3. `docker compose config --quiet`으로 검증한 뒤
   `docker compose up -d wiki-postgres`로 기동한다(기존 서비스 재시작 없음).
4. 역할·스키마 부트스트랩은 `scripts/postgres-migration/bootstrap-roles.sql`을
   `docker exec -i wiki-postgres psql -U wiki_owner -d postgres`로 적용한다
   (컨테이너 슈퍼유저가 wiki_owner이므로 `-U postgres`가 아니다).
   스키마 `wiki`/`wiki_private`/`orbat`과 역할 4종이 생성된다.
5. 확인: `docker exec wiki-postgres pg_isready -U wiki_owner` → accepting,
   `docker ps --filter name=wiki-postgres --format '{{.Status}}'` → Up (healthy).

야간 백업: Windows 작업 스케줄러 작업 `wiki-postgres-nightly-dump`(매일 03:30)가
`E:\git\seoul-dengoku-web\pg-backup.cmd`를 실행해 `pg_dump -U wiki_owner -d seoul`을
`E:\git\seoul-dengoku-web\backups\seoul-latest.sql`에 저장하고 같은 디렉터리에
`seoul-latest.sql.sha256`을 기록한다.

`.woodpecker/deploy.yaml` runs only for pushes to `main`.
The Node 26 step sends the commit to the deployment owner, then checks the public
site with `check-live-contract.mjs --public-edge`. The owner performs the release and rollback;
this repository does not hold deployment host credentials.

Configure the Woodpecker secret `seoul_deploy_token`. `SEOUL_DEPLOY_URL` currently
points to `http://172.28.0.4:8080/api/deployments/seoul-wiki`, the dashboard's
address on the outer `linalab-ci-tools_build` network. Outer Docker aliases do
not resolve inside the nested build engine. Update this workflow value if the
dashboard address changes. Reachability still requires a successful probe from
the build environment; the runtime deployment endpoint must also be installed
before rollout. The caller uses `SEOUL_DEPLOY_TOKEN`
as bearer authentication and sends only `{"sha": CI_COMMIT_SHA}` in the POST body.
It does not retry a request or follow redirects.

The owner returns NDJSON. Blank lines and `{"status":"running"}` keepalives are
accepted. A terminal record must contain the requested `sha` and a `status` of
`success`, `failed`, or `rolled-back`. Only `success` passes. A mismatched SHA,
invalid response, HTTP error, missing terminal record, or 35-minute deadline
fails the step. Responses are limited to 8 MiB total and 64 Ki characters per
line. Neither upstream response text nor the token is logged.

The catalog is not tracked. `npm ci --ignore-scripts` installs the generator's
dependencies, and `node scripts/generate-catalog.mjs` creates it from repository
lore and checked-in build snapshots. No full Vite build, crest generation, or
observed-geography generation is needed for the HTTP check. The check command is:

```sh
node deploy/check-live-contract.mjs --public-edge https://sss.linalab.io live-http-green.json src/generated/wikiCatalog.ts
```

Public-edge mode requires HTTP 200 and the React entry marker on every catalog
wiki route, compatibility wiki route, `/wiki/`, and `/wiki/states`. It does not
follow redirects. `/system-design/regions`, `/system-design/regions/`, and `/gdd/`
must return HTTP 302 to the HTTPS `linalab.cloudflareaccess.com` login path for
the checked host. HTTP 200 or 308 fails: either would bypass the Access boundary.
Access Location query values are never included in the result.

Without `--public-edge`, the checker remains the origin contract (default
`http://127.0.0.1:8080`), including the region redirects' HTTP 308 and destination.
The deployment owner runs that contract against the origin during promotion;
the public check does not replace it.

Deployment test suites were removed by owner decision. The deployment caller and live HTTP contract checker remain operational.

## 문서 API 런타임 PostgreSQL 연결 (owner 주입)

`server/wiki-document-api.mjs`는 런타임에 PostgreSQL만 읽는다(SQLite 폴백 없음). 배포 시
owner가 `WIKI_DOCUMENT_PG_FILE`에 런타임 사용자 소유, mode 0600의 일반 파일
경로를 주입한다. 파일에는 `wiki_runtime_reader` 로그인용 PostgreSQL URL을 넣는다.
심볼릭 링크와 잘못된 소유권·권한은 거부된다. 직접 `WIKI_DOCUMENT_PG` URL을
사용할 수도 있지만 두 설정을 동시에 지정할 수 없다. 비밀을 이미지·저장소에 넣지 않는다.
- `wiki_reader`는 NOLOGIN이며 런타임은 별도 `wiki_runtime_reader`로 접속해
  `db-pg.mjs`의 startup option으로 `wiki_reader` 역할을 적용한다. 로그인 역할은
  해당 역할만 상속·전환할 수 있다. 이 저장소는 호스트 자격증명을 보유하지 않는다.
- 기동 시 `wiki.meta`와 저장소 `scripts/postgres-migration/schema-pg/metadata.json`의
  `schema_version`·`source_sha256`이 일치해야 하며, 불일치면 기동이 실패한다(fail-closed).

### 런타임 로그인 프로비저닝과 비밀 전달

먼저 `bootstrap-roles.sql`과 schema/load를 적용한다. `wiki_reader`는 LOGIN으로
바꾸지 않는다. 아래 스크립트는 PostgreSQL 17에서 `seoul` DB에 접속한 슈퍼유저가
실행하며 트랜잭션으로 역할을 생성하거나 암호를 회전한다. 기존 로그인 역할의
다른 역할 멤버십·소유권·직접 권한·역할 설정이나 위험 속성은 자동 제거하지 않고
실패한다. 원인을 관리자 측에서 조사·정리한 뒤 재실행한다. `wiki_reader`의
위험 속성, 상위 역할, 대표적인 쓰기·사설 권한도 거부한다. 전체 DB의 PUBLIC 및
기존 역할 권한을 별도로 감사해야 한다. 이 스크립트는 권한 감사 전체를 대체하지 않는다.

비밀 입력 전 psql echo와 해당 PostgreSQL 세션의 statement/duration/error SQL
로깅을 끄며, 설정 권한이 없거나 감지 가능한 SQL 감사 확장 활성화 시 실패한다.
프록시·외부 수집기·기타 SQL 감사 확장이 쿼리를 기록하지 않는 신뢰된 관리자
경로를 사전에 확인한다. 다른 세션의 로깅 설정은 변경하지 않는다. 환경변수는
같은 호스트의 권한 있는 프로세스에 노출될 수 있으므로 전용 관리자 세션을 쓰고
shell xtrace, 세션 녹화, 명령 기록 및 터미널 캡처를 끈다. 암호는 secret manager에서
비공개 입력으로 환경변수에 주입한다. 아래 입력 예시는 터미널에서 직접 실행하며
값을 명령 인수, SQL 파일, 로그 또는 shell history에 넣지 않는다:

```sh
set +x
stty -echo; printf 'Runtime reader password: ' >&2
IFS= read -r WIKI_RUNTIME_READER_PASSWORD
stty echo; printf '\n' >&2
export WIKI_RUNTIME_READER_PASSWORD
psql -X -v ON_ERROR_STOP=1 -d seoul -f scripts/postgres-migration/runtime-reader-login.sql
unset WIKI_RUNTIME_READER_PASSWORD
```

관리자 접속은 별도로 안전하게 구성하고 암호를 psql 인수/URL에 넣지 않는다.
네트워크를 통한다면 검증된 TLS와 신뢰된 경로가 필요하다. 오류가 발생해도
환경변수를 해제하고, 감사 로그에 비밀이 기록됐을 가능성이 있으면 해당 비밀을
폐기·회전한다. 재실행은 새 암호를 적용하므로 기존 API 연결의 재접속과 롤백을
계획한 후 수행한다. owner는 `CI_SEOUL_DOCUMENT_PG_FILE`의 보호된 URL을 전용
Docker 볼륨에 넣고 후보에 읽기 전용으로 마운트한다. URL은 컨테이너 환경변수가
아니며 Docker 볼륨에는 평문으로 남으므로 daemon 접근을 제한한다. 파일 내용·URL을 출력하거나 커밋하지 않는다.
후보 API의 공개 응답과 private 거부를 검증하기 전 기존 SQLite API를 전환하지 않는다.

일회용 PostgreSQL에서 parent 통합 검증 시 bootstrap을 적용한 다음 위 SQL을
같은 임시 암호로 두 번 실행한다. 로그인으로 `SET ROLE wiki_reader`가 성공하고
공개 `wiki` SELECT가 가능해야 한다. `wiki_private` SELECT, `wiki` 쓰기,
다른 역할로 `SET ROLE`, 슈퍼유저 작업은 각각 실패해야 한다. 별도로 `pg_roles`와
`pg_auth_members`에서 NOLOGIN 경계·위험 속성·유일한 비관리 멤버십을 확인하고,
다른 멤버십이나 직접 권한이 있는 오염된 로그인 역할을 거부하는지도 확인한다.
실제 `db-pg` startup option과 문서 API도 동일한 disposable DB에서 검증한다.
이 절의 절차 자체는 운영 적용이나 검증 완료를 의미하지 않는다.

카탈로그 historical-rights 원문 9경로의 PostgreSQL reader 배선을 로컬에서
검증했다(저장된 호출부 블록 추출 실행: SQLite 대비 바이트 동등,
정답 핀 9/9·오답 핀 거부 9/9). 별도로 격리 환경에서 SQLite·PG reader와
전체 worker 출력 1,433개의 동등성, 일반 PG 빌드 및 계약·산출물·게이트 검사
통과를 확인했다. 이는 운영 배포 검증이 아니다. 정확한 커밋 SHA 기준 운영 후보
확인과 배포는 남아 있으며, 런타임 연결값을 빌드 프로세스 전역 환경에 주입하지 않는다.

### 비공개 생성 reader 프로비저닝

생성 입력은 공개 런타임과 **별도 연결과 자격증명**을 사용한다. 공개 연결은
기존 `wiki_runtime_reader` → `wiki_reader`를 유지하며 `wiki_private`에 접근하지
않는다. 생성용 `wiki_generation_login`은 LOGIN이고 `wiki_generation_reader`만
상속·전환한다. 후자는 NOLOGIN이며 `wiki_private` USAGE와
`generation-reader-login.sql`의 명시적 editorial/soul typed table 및 인증 증거
`ev_evidence`, `ev_evidence_policy`, `ev_evidence_reference`에만 SELECT를
받는다. archive 등 다른 사설 테이블 전체에 대한 권한이나 기본 SELECT 권한은
부여하지 않는다. 공개 데이터는 공개 연결로 읽고 생성 로그인에 합치지 않는다.

이 권한은 테이블 단위이므로 영혼 typed revision 테이블에 저장된 draft 행에도
접근할 수 있다. 내부 생성 프로세스에만 자격증명을 제공하고, 승인된 imported
revision 선택과 무결성 확인은 `openSoulAssignmentsAsync`가 수행한다. 이는 DB
차원의 행별 draft 차단이 아니다. `soul_document` SELECT는 revision_id의
`information_schema.columns` 검색에도 필요하다. 테이블 목록이 reader의 domain
정의와 어긋나거나 테이블이 없으면 먼저 양쪽을 함께 갱신한다.

bootstrap과 schema/load를 마친 뒤, 위 런타임 절과 동일한 신뢰 관리자 경로와
SQL 로깅·shell 기록 방지 조건에서 슈퍼유저로 실행한다. SQL은 예상 밖 역할
멤버십·소유권·설정, 쓰기 권한, 목록 밖 사설 SELECT 및 공개 역할의 사설 접근을
거부한다. 실패하면 관리자가 원인을 조사하고 정리한다. 기존 권한을 자동 삭제하지
않으며, 전체 DB·PUBLIC·확장·함수에 대한 독립적인 보안 감사를 대체하지 않는다.
암호는 secret manager에서 전달하거나 아래와 같이 비공개 입력하며, 출력·인수·파일·
로그·history에 넣지 않는다. 오류 시에도 환경변수를 해제하고 노출 가능성이 있으면
암호를 폐기·회전한다.

```sh
set +x
stty -echo; printf 'Generation reader password: ' >&2
IFS= read -r WIKI_GENERATION_READER_PASSWORD
stty echo; printf '\n' >&2
export WIKI_GENERATION_READER_PASSWORD
psql -X -v ON_ERROR_STOP=1 -d seoul -f scripts/postgres-migration/generation-reader-login.sql
unset WIKI_GENERATION_READER_PASSWORD
```

일회용 PostgreSQL에서 parent가 schema/load 후 동일한 임시 암호로 위 SQL을 두 번
적용한다. 두 번 모두 성공해야 한다. `pg_roles`, `pg_auth_members` 및
`has_table_privilege`로 NOLOGIN reader, 제한된 LOGIN, 유일한 비관리 멤버십,
명시된 테이블별 SELECT와 목록 밖 private SELECT·쓰기 권한 부재를 확인한다.
별도 로그인으로 `SET ROLE wiki_generation_reader`, typed SELECT 및
`information_schema.columns`의 `soul_document.revision_id` 가시성을 확인하고,
archive SELECT·쓰기·다른 역할 전환은 실패해야 한다. 공개 런타임 연결의 private
접근도 거부되어야 한다. 오염된 역할·PUBLIC 권한과 누락 테이블을 각각 거부하는지
확인하고 실제 비공개 reader smoke는 내용을 출력하지 않고 실행한다. 이 절은 운영
프로비저닝이나 검증이 완료됐다는 뜻이 아니다.

### PostgreSQL 생성 stage 검증

보호된 환경에서 `WIKI_DOCUMENT_PG`와 같은 데이터베이스의 비공개 생성 reader 연결
`WIKI_GENERATION_PRIVATE_PG`를 주입한 뒤 `node scripts/generate-release.mjs --verify-pg`를
실행한다. 두 연결과 worker의 실제 원천·승인 의존성이 모두 필요하다. 잠금과 단일
PostgreSQL snapshot 아래 실제 worker와 원천 검증을 실행하고 stage inventory의 개수와
SHA-256을 출력한다. 기존 transaction이 있으면 복구하거나 삭제하지 않고 실패한다.
성공 시 이 실행의 stage만 정리하며 backup, 승격, live output 변경 및 build는 수행하지
않는다. 실패한 stage에는 비밀 없는 `verify-report.json`을 남긴다. 이 명령 자체는
운영 전환을 증명하지 않는다. 일반 PostgreSQL release는 허용되며 메타데이터,
PostgreSQL 스냅샷과 비공개 입력 스냅샷·출처 검증은 유지한다. 연결값과 private
stage를 공개하거나 커밋하지 않는다.
