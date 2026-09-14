# 《잔선》 구조화 설계 저장소 전환 계획

계획 전용. 제품·소스·JSON 변경, 서비스 설치, 이관 실행, 커밋·푸시, PR #87 병합, 배포는 범위 밖이다. 측정 HEAD `5bd47ee0780186709ec71f95db0687fac2bf90fa`(2026-09-13). 본문의 명령은 모두 **PLANNED / 미실행**. 선행 보고서의 파싱 수치를 이번 실행 결과로 재사용하지 않는다.

캠페인 문법(캠페인 층만): 후세 지역 정체성; 신종교·문화 상호작용과 잔해 기술·침공/이벤트; 잔해 신앙화; 종파 분열 매트릭스. 세부 다섯 축은 내부 문법 락 `.omo/locks/ate-grammar-reference.md` 참조. 전투 불변: 고정 아이소, 사각 격자, 4방향, 이동 후 행동. 참조 틱 체계·봉신 UI 없음. 대외 명칭은 《잔선》만.

## 1. 목표와 비목표

**목표.** 기획(`planning`)·세계(`world`)·규칙(`rules`) 원문을 손실 없이 봉투화하고, 공통 ID·관계·출처·검토를 정규화하며, 서술 본문은 JSON/Markdown으로 보존한다. Git 검토 산출물만 공개 게이트로 둔다. 검색 투영은 재생성 가능해야 한다. 파일 존재·`document_status=active`·통합 SHA·Wiki 게시·런타임 반영을 서로 다른 상태로 유지한다.

**비목표.** 전투 규칙 변경, Area-1 3역 카탈로그 재타깃, `CreateSeoul` 재배선, 실시간 게임플레이가 설계 저장소를 읽는 경로, Git와 DB의 동시 직접 편집, MongoDB/유료 호스트 설치, PR #87·지역 브랜치 자동 승격, 세 인물 저장소의 이름 병합, 범용 CMS·문장별 EAV·이벤트 소싱, 내부 영감 고유명·에셋의 공개 유출, 아트 바이너리 적재(경로·해시·GUID만), 포트레잇 2D 합성과 메시 파이프라인 통합(승인·경로·해시·GUID 참조만 연결).

## 2. 권고

**지금(임시 정본):** Git JSON/Markdown. ADR-001이 `docs/`를 SoT, Wiki를 파생물, 전용 브랜치+PR, 소유자 병합으로 고정한다(`docs/adr/ADR-001-repository-delivery-policy.md:22–31`). 임의 DB는 승인된 Git 스냅샷에서 폐기·재생성 가능한 색인이다.

**승인된 목표 아키텍처(운영 승인과 별개):** 단일 SQLite를 가진 HTTP 저작 API. SQL은 ID·관계·승인·출처, JSON은 타입별 본문과 **교환**, Markdown은 긴 서술 블록과 **내보내기**. JSON 파일 디렉터리를 NoSQL 서버로 부르지 않는다. MongoDB는 비교 대안이며 선택하지 않는다.

전환은 ADR-001 명시 개정 + 내구 호스트 운영자 + 인증 모델이 모두 승인된 뒤에만 한다. 그 전 중앙 API를 현행 원본으로 쓰지 않는다.

## 3. 분류와 스키마 요약

도메인 수치(digest 교차검증, 이번 미실행): humans **422** (`K001`–`K422`); `roster-100.json` **100** (`roll-*`, ∩ humans = 0); untracked backfill **422** (∩ humans = 422, ∩ roster = 0); `region:*` **427**; 역 카탈로그·compiled graph **334** (상수 `SeoulWorldGraphCatalog.cs:9–11`, 호출 `RouteDomain.cs:106–111`); Area-1 콘텐츠 스냅샷은 **3역** (`GameDataCatalogValidator.cs:20`); Wiki `publishedFragmentPages` **25** / 제외 **88** (파일 113); atlas 투영 **125**. 가문 기계 카운트 32, CORPORATION **22** (`HC01`–`HC22`). 관계: Cast-Relations 780 이름 간선 vs atlas 43 ID 간선 vs 지역 문자열 427 — 결합하지 않는다.

| 축 | 개수 | 권한 | 예 |
|---|---|---|---|
| domain | 1/개정 | 저작 책임 | planning, world, rules |
| kind | 1/개정 | payload 계약 | plan, lore_page, person, house, faith, culture, region, event, rule, source |
| category | 다중 | 통제 분류 | campaign-faith, regional-identity 등(전체 목록은 `schema.md` 2절) |
| tag | 다중 | 검색 표지 | 배급의례, 지역 순례 |

`planning` 공개 URL은 `/design/` (`docs-site/.vitepress/config.mts:55–75`). 파일 prefix가 분류 권한이 되지 않는다. faith와 culture는 별 엔티티, 관계로만 연결.

**테이블(미구현 DDL 계획).** `entity`; 불변 `revision`(domain/kind/`payload_json`/`content_sha256`/`source_kind`/`as_of`/`fictional_time_json`); `alias`; `source`+`revision_source`; `link`(해소 ID 또는 원문 참조); `term`+`revision_term`; `review`(scope/target별); `artifact`(surface/slug/fingerprint/GUID). 대형 아트는 bytes 대신 경로·해시·GUID. 허구 시간과 실제 `as_of`를 분리하고 unknown을 기본값으로 채우지 않는다.

| 구성요소 | 보존 |
|---|---|
| C1 문서 봉투 | path, git tree SHA, content SHA-256, branch/PR, schema/revision/status/owner/`source_kind`/`as_of` |
| C2 atlas `WNA-001` | JSON fence 전 필드(charter/membership/succession 포함). r11 vs r14 병존 |
| C3 정체성 | 네임스페이스 분리, K 422 ID/이름/순서 동결, 이름 조인 금지 |
| C4 검토·공개·승격 | Cast-Index 게시 ≠ 파일 존재 ≠ manifest incomplete ≠ 자산 `owner_verdict` |
| C5 출력 | Wiki/mount/VitePress/regions viewer는 미러. 쓰기 권한 없음 |
| C6 런타임 | Area-1 SO, compiled graph, fingerprint/GUID만. 설계 레코드 라이브 읽기 금지 |

교환 envelope 예(미저장·미승인):

```json
{
  "entity_id": "K001",
  "schema_id": "person.v1",
  "domain": "world",
  "kind": "person",
  "source_kind": "original-fiction",
  "fictional_time_json": {"epoch": "opening-day", "absolute_date": null},
  "payload_json": {"title": "한재목", "blocks": [{"format": "markdown", "text": "…"}]}
}
```

캠페인 faith payload는 지역 정체성·신성화·잔해 의례·종파 행렬·문화 상호작용·캠페인 사건 여섯 묶음을 담는다. 필드 식별자와 예시는 `.omo/research/structured-design-store/schema.md` 4절. K 동결표는 `.omo/research/structured-design-store/migration.md` 1절.

충돌은 수집 시 정정하지 않는다: (1) 412 문구 vs 422 기계; (2) atlas r11/r14·`last_verified_commit=c485bc8`; (3) HC01–HC14 문구 vs HC01–HC22 데이터; (4) 파일 113 vs 게시 25; (5) K / `roll-*` / backfill; (6) 미결합 관계; (7) 334역 vs 427동 vs 16국 vs Area-1 3역; (8) 연대 미결; (9) dirty `SERVICES.md`/`vercel.json` vs HEAD; (10) Rules vs 코드.

## 4. 서비스·권위 흐름

| | Git-canonical 임시 | SQLite-API 목표 |
|---|---|---|
| 원본 | 소유 문서 Git 이력 | 서비스 불변 revision + head |
| 편집 | 브랜치/PR, 기준 commit 명시 | 인증 API만. 오프라인 변경은 CAS import |
| DB | 재생성 읽기 인덱스. 초안을 DB에만 두지 않음 | 승인·출처·초안 원본. 파일 직접 편집 금지 |
| 공개 | 소유자 병합 Git 산출물 | DB 승인과 별개, 소유자 병합 release |

**편집(목표, 미구현).** 조회 `entity_id/head_revision/content_hash` → `base_revision`+`Idempotency-Key` 제출 → 검증 → 원자 트랜잭션에서 revision 추가, `WHERE head_revision = base_revision` head 갱신. stale는 409. 동일 키/동일 요청은 재사용, 다른 본문은 409. `SQLITE_BUSY`는 503이지 내용 충돌이 아니다. 다중 엔티티는 전부 성공 또는 전부 롤백.

**공개(두 모드 공통).** 불변 release manifest(entity/revision/hash, schema/exporter, 표면, incomplete) → 격리 staging에서 안정 JSON + 생성 MD → hash/관계/승인/공개 텍스트 게이트 → **owner PR** → 병합 hash 재검증 → VitePress 정적. Wiki는 별도 생성·허가·영수증(`ADR-001:30`). 현행 `docs:build`는 VitePress만이며 `ignoreDeadLinks: true`(`docs-site/package.json:7–9`; `docs-site/.vitepress/config.mts:27`). mount는 stale을 지우지 않는다(`docs-site/scripts/mount.mjs:193–197`). 내부 영감은 JSON·MD·HTML·검색에서 제외.

제안 prefix `/design-store-api/`(미구현): `GET /v1/entities…`, `POST /v1/changesets`, `POST /v1/entities/{id}/reviews`, `POST /v1/releases`, `GET /health/ready`. dirty WT `vercel.json:25–28`의 `/api/:path*` character-forge rewrite를 점유하지 않는다. HEAD `vercel.json`은 `outputDirectory`/`buildCommand`만.

SQLite WAL은 동일 호스트·단일 writer. Vercel 함수 FS는 ephemeral이라 mutable DB 금지. 백업은 Online Backup API 또는 `VACUUM INTO`. 복원은 `PRAGMA integrity_check=ok` 그리고 `PRAGMA foreign_key_check` 0행.

게임은 설계 API의 실시간 소비자가 되지 않는다.

## 5. 단계적 이관 체크리스트

`audit/verify-migration.mjs`는 **미구현 명세**다. 미구현이면 해당 게이트는 BLOCKED. 순서는 C1→C2→C3→C4→C5→C6. 원 저장소 reset/clean/merge/push 금지.

- [ ] 1. C1 문서 봉투 수집
  - 의존: 없음. HEAD·index·dirty WT·untracked를 경로별로 분리 관측.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs capture`
- [ ] 2. C2 Atlas 레지스트리 무손실 수입
  - 의존: 1. fence 전 필드·배열 순서·r11/r14 병존. 재직렬화로 공백 변경 실패.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs registry`
- [ ] 3. C3 정체성 동결
  - 의존: 2. K 422 순서/ID/이름 고정; `roll-*` 100·backfill 422·corridor 별칭 분리. 파서 재번호 금지(`tools/wiki/world-atlas-parse.mjs:24–47`).
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs identities`
- [ ] 4. 미병합 브랜치 제안 스냅샷
  - 의존: 1. PR #87 `5230e02…`, 지역 `98cc619…`를 `proposal=true`로만. cherry-pick/merge 없음.
  - 검증(PLANNED·미실행): `gh pr view 87 --json state,baseRefName,headRefOid,files` ; `git diff --name-status 5bd47ee...5230e02` ; `git diff --name-status 5bd47ee...98cc619`
- [ ] 5. C4 검토·공개·승격 분리
  - 의존: 3–4. Cast-Index 게시 25, manifest `incomplete: true`, 자산 verdict를 합치지 않음.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs review`
- [ ] 6. 충돌 10건 reconcile-review
  - 의존: 5. 미결은 수집을 막지 않으나 승인 export 승격은 막음. 이관 중 본문 보정 금지.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs review`
- [ ] 7. 스키마·교환 계약 고정
  - 의존: 3. DDL/JSON Schema는 계획 예. 설치·CREATE 없음.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs registry`
- [ ] 8. Git 정본 임시 읽기 인덱스
  - 의존: 6–7, ADR 미개정. SQLite는 폐기 가능 색인. 초안 유일 보관소 아님.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs capture`
- [ ] 9. C5 내보내기 바이트 호환
  - 의존: 6. 125 투영·Wiki 25·site Rules 7 보호. 공개 텍스트 정책 유지.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs exports` ; `node tools/wiki/materialize-world-atlas.mjs --atlas docs/game-logic/World-Narrative-Atlas.md --check` ; `node tools/wiki/build-wiki.mjs docs/game-logic docs/assets/wiki wiki-output 5bd47ee0780186709ec71f95db0687fac2bf90fa` ; `npm --prefix tools test` ; `node docs-site/scripts/mount.mjs` ; `node docs-site/scripts/stage-images.mjs` ; `node docs-site/scripts/gate.mjs` ; `npm --prefix docs-site run docs:build` ; `diff -r baseline/wiki-output candidate/wiki-output` ; `diff -r baseline/docs-site/design candidate/docs-site/design` 및 world·rules·dist 동일 확산
- [ ] 10. C6 런타임 스냅샷 경계
  - 의존: 9. Unity 파일 생성/수정 없음. `CreateSeoul` 재배선 없음.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs runtime` ; `git diff --exit-code 5bd47ee -- Game/Assets/Janseon/Core/RouteDomain.cs Game/Assets/Janseon/Data`
- [ ] 11. 권위·호스트·인증 게이트
  - 의존: 8–10 통과 + 6절 소유자 결정. 미승인 시 12 진입 금지.
  - 검증(PLANNED·미실행): `shasum -a 256 <ADR 개정본 경로>` 와 소유자 결정서 해시 대조 ; `gh pr list --repo islee23520/seoul-kenshi --state merged --json number,headRefName` 에서 ADR 개정 PR 확인 — 부재 시 BLOCKED
- [ ] 12. SQLite HTTP 저작 API 전환
  - 의존: 11. 단일 writer, `/design-store-api/`, Git 공개 게이트 유지. 이중 원본 금지.
  - 검증(PLANNED·미실행): 인증된 `GET /design-store-api/v1/entities` 200 ; `POST /v1/changesets` stale 409 픽스처 `audit/fixtures/cas-409.json`(미구현 명세) — 서비스 미설치·픽스처 부재 시 BLOCKED
- [ ] 13. 롤백 리허설
  - 의존: 1의 before manifest. 실패 시 격리 DB/candidate만 폐기.
  - 검증(PLANNED·미실행): `node audit/verify-migration.mjs rollback` ; `git status --porcelain=v2 -z` ; `git rev-parse HEAD docs/lore-audit-corrections feat/seoul-region-atlas-20260913`

## 6. 소유자 결정

모두 **미결정**. 권고는 기본값이지 승인 사실이 아니다.

| 항목 | 권고 | 금지/유보 |
|---|---|---|
| ADR-001 개정 | 목표 모드 전에 DB 저작 원본·Git 공개 snapshot·효력 시점·검토 권한을 명시 개정 | 개정 전 API를 원본으로 취급, 장애 시 자동 Git 전환, Git/DB 동시 직접 편집 |
| 내구 호스트 운영자 | 단일 writer, 저장소 밖 영구 디스크. 제안 경로 `E:/git/design-store-data/`는 미측정. 이 macOS 체크아웃에 만들지 않음 | Vercel FS에 SQLite, SMB/NFS, 독립 writer 호스트 |
| 인증 모델 | 사람 SSO, 에이전트 최소권한 단기 토큰, origin에서 인가 재검증 | 프록시 actor 신뢰, `/api/*` 점유, 초안 공개 |
| RPO/RTO | 소유자가 숫자·허용 쓰기 중단·보존 기간을 정한 뒤 복원 훈련 | 미측정 처리량을 가용성 주장으로 사용 |
| URL 매핑 | 공개 `/design/` `/world/` `/rules/` 유지. 내부 domain `planning→/design/`. API는 `/design-store-api/` | 기존 `/api/:path*` rewrite 변경(이번 계획) |
| PR #87 | OPEN 제안 스냅샷으로만 수집. 파일 16·+640/−364는 digest의 `gh pr view 87` 인용(이 계획 미실행), calendar/gear는 제안 | 이 계획에서 merge/cherry-pick. 본문을 HEAD 사실로 승격 |
| 지역 브랜치 | `feat/seoul-region-atlas-20260913`=`98cc619…` + WT 25 JSON을 별 provenance. 427동은 HEAD 트리 아님(`git ls-tree HEAD -- docs/game-logic/regions` = 0) | Unity/런타임 승격, GeoJSON을 허구 소유권으로 해석 |
| 달력·장비 제안 | HEAD는 상대 붕괴 N년, `selection.json` `absolute_date=null`. 문법의 후세 정체성은 연대 확정이 아님 | 2026/2036/2042 또는 수백 년 경과를 schema epoch 기본값으로 상속 |
| 검토 역할·자기승인 | 검토자/owner 배정, 자기승인 금지 권고 | 미결정 상태로 운영 착수 |
| 공개 release 철회 | 철회 권한·회수 절차·기배포본 처리 | 철회 없이 방치 |
| 멱등 기록 보존 | TTL·보존 기간·만료 키 재사용 금지 | 기본값 임의 채택 |
| 유료 인프라 | 기본 비선택 | 승인 없이 유료 호스트·서비스 가입 |

추가 권고: 작성자에게 owner 승격 권한 없음. 새 개정은 이전 승인을 상속하지 않음.

## 7. 수용 시나리오와 롤백

향후 구현 기준이며 실행 결과가 아니다. 동시성 검증에 고정 sleep을 쓰지 않는다.

| 시나리오 | 통과 |
|---|---|
| Service down | 정적 사이트/Wiki는 API 없이 읽힘. 쓰기는 명시 실패/503. 같은 키 재시도에 중복 revision 없음. 자동 원본 전환 없음 |
| Stale write | A가 r8 커밋 후 B가 r7 제출 → 409/current r8, B 변경 0. 동일 키 재전송은 기존 결과 |
| Corrupt export | staging 1 byte 변조 또는 dangling link → gate 실패, 기존 release 유지, 공개 영수증 없음. 내부 자료 유출도 실패 |
| Backup restore | 격리 복원 `integrity_check=ok` AND `foreign_key_check` 0행. 승인·revision·export hash 일치. 운영 writer 차단 전 전환 금지 |
| 바이트 호환 | 무수정 이관에서 125 투영·Wiki·mount bytes/SHA-256 동일. JSON 재직렬화 공백 변경 실패 |
| 런타임 울타리 | `Game/` 호출 경로·GUID/fingerprint 불변. 설계 저장소 HTTP 의존 0 |
| 문법 울타리 | 캠페인 typed payload만 추가 가능. 전투 4불변 변경 0. 공개물에 락 원문 고유명 0 |

**롤백.** S0 before manifest로 재수집 동일성을 본다. 원 WT·index·PR #87·지역 브랜치·dirty 파일을 그대로 둔다. DB 삭제는 Git 복구가 아니다. 제품 복귀는 소유자 revert PR이며 이번 범위가 아니다.

## 8. 근거 부록

합성 입력 다섯 파일(모두 `.omo/research/structured-design-store/`):

1. `discovery-digest.md` — 검증 사실, 충돌 10, 여섯 구성요소, 입력 지도, 카운트 422/100/422·427·334·25/88·125. HEAD `5bd47ee…`.
2. `design-brief.md` — 권안(SQLite HTTP + JSON 교환 + MD 서술/내보내기), 미응답 편집 기준, 확정 캠페인 락 5축.
3. `schema.md` — 테이블·domain/kind·ID 규칙·캠페인 payload 예. HEAD `5bd47ee…`.
4. `service.md` — 두 권위 모드, CAS, release 흐름, `/design-store-api/`, 호스트/백업, 수용 시나리오.
5. `migration.md` — C1–C6 순서, K 동결표, 브랜치 스냅샷, 충돌 절차, export/롤백 게이트(전부 미실행).

지원 인벤토리(digest가 접음): `corpus.md`, `consumers.md`, `storage-options.md`. 락: `.omo/locks/ate-grammar-reference.md`. 정책: `docs/adr/ADR-001-repository-delivery-policy.md:22–31`.
