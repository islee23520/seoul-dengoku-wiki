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
owner가 다음을 **런타임 환경변수/시크릿으로** 주입해야 한다:

- `WIKI_DOCUMENT_PG` — PostgreSQL 연결 URL(예: `postgresql://wiki_reader@…/seoul`).
  이미지에 절어 들어가지 않는다(`deploy/wiki-document.Dockerfile` 참조).
- 연결은 `wiki_reader` 역할 경계로 접속한다(`scripts/cast-sqlite/db-pg.mjs` `createReader`).
  런타임 reader 로그인 프로비저닝은 `scripts/postgres-migration/runtime-reader-login.sql`이
  owner 단계에서 수행한다. 이 저장소는 호스트 자격증명을 보유하지 않는다.
- 기동 시 `wiki.meta`와 저장소 `scripts/postgres-migration/schema-pg/metadata.json`의
  `schema_version`·`source_sha256`이 일치해야 하며, 불일치면 기동이 실패한다(fail-closed).

owner 배포 파이프라인에서의 실제 주입은 아직 검증되지 않았다. 로컬 일회용
PostgreSQL에서의 검증(전수 대사 PASS·HTTP 응답 동등성)만 완료된 상태다.
