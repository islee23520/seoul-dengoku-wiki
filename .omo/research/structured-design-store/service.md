# 《잔선》 설계 저장소: 버전·승인·서비스 운영 경계

계획 전용. 측정일 2026-09-13, HEAD `5bd47ee0780186709ec71f95db0687fac2bf90fa`. 아래 API·상태·운영 절차는 **제안이며 미구현**이다. 제품/소스/JSON 변경, 설치, 이관, 커밋, 푸시, PR #87 병합, 배포는 수행하지 않는다. 이관 순서는 형제 노드 소관이다.

입력: `.omo/research/structured-design-store/discovery-digest.md:73-132`의 충돌·여섯 구성요소·입력 지도, `design-brief.md:5-27`, `storage-options.md:35-78`, `consumers.md:11-45`(뒤 세 경로도 같은 디렉터리). digest가 brief의 권위를 미확정으로 적은 부분은 최신 작업 지시가 brief를 필수 입력으로 지정한 것으로 해소한다. 그렇다고 중앙 API 운영 승인이 생기지는 않는다.

## 1. 두 권위 모드와 ADR-001 승인 게이트

현행 ADR은 저장소 `docs/`를 원본으로, Wiki를 파생물로 정하고 전용 브랜치·PR 납품 및 소유자 병합을 요구한다(`docs/adr/ADR-001-repository-delivery-policy.md:24-31`).

| 경계 | Git-canonical 임시 모드 | SQLite-API 목표 모드 |
| --- | --- | --- |
| 저작 원본 | 소유 문서/구조화 원본의 Git 이력. JSON/MD 안정 출력은 앞으로 정의할 계약 | 단일 서비스의 불변 revision과 현재 head |
| 편집 | 격리 브랜치/worktree에서 기준 commit·revision을 명시한 제안, PR 검토 | 인증된 API만 수정. Git 수정·오프라인 변경도 CAS import 제안으로 환류 |
| DB 역할 | 삭제 후 승인된 Git snapshot에서 재생성 가능한 읽기 인덱스. 고유 승인/초안을 DB에만 보관하지 않음 | 승인·출처·초안까지 보존하는 원본. DB 파일 직접 편집 금지 |
| 공개 권위 | 소유자가 병합한 Git 산출물 | DB 저작 승인과 별개로 소유자가 병합한 release 산출물 |

**OWNER DECISIONS — 권위:** ADR-001을 명시적으로 개정하여 DB 저작 원본, Git 공개 snapshot, 적용 범위·효력 시점·검토자 권한을 승인해야 목표 모드로 전환할 수 있다. 그 전에는 임시 모드를 유지한다. 두 원본의 동시 직접 편집이나 장애 시 자동 Git-canonical 전환은 허용하지 않는 권고안이다. 정책 승인과 호스트·인증 승인은 각각 필요하다.

문서 envelope, atlas registry, ID/관계, 검토/공개, 출력 표면, runtime snapshot이라는 여섯 경계를 유지한다. 412/422, r11/r14, PR #87·지역 브랜치와 HEAD 차이는 원문 근거와 충돌로 남기며 서비스가 임의로 정정·승격하지 않는다(입력 digest:73-84,108-130). 게임은 설계 API의 실시간 소비자가 되지 않는다.

확정 제약은 캠페인에만 적용한다: 후세 지역 정체성; 신종교·문화 상호작용과 salvage tech·침공/이벤트; 구세계 상징 신격화·화폐/소비 의례 신화·기계/공장 숭배의 잔해 신앙화; 종파 분열 매트릭스. 전투는 고정 아이소·사각 격자·4방향·이동 후 행동을 유지하며 참조 틱 체계나 봉신 UI를 도입하지 않는다. 공개 명칭은 《잔선》만 사용한다. 내부 근거는 `.omo/locks/ate-grammar-reference.md` 경로로만 인용한다(`design-brief.md:17-23`).

## 2. 편집 CAS·멱등성·기존 승인 상태 대응

목표 흐름: 조회로 `entity_id/head_revision/content_hash` 획득 → `base_revision`과 `Idempotency-Key`를 붙여 수정 제출 → 구조/관계/권한 검증 → 짧은 원자 트랜잭션에서 revision 추가, `WHERE head_revision = base_revision` 조건부 head 갱신, 링크·출처·감사·요청 결과를 함께 기록한다. 다중 엔티티 변경은 각 기준 revision을 확인하고 전부 성공하거나 전부 롤백한다.

- 다른 요청이 먼저 head를 바꿨으면 **409 Conflict**와 현재 revision/hash를 반환한다. 부분 기록·자동 덮어쓰기 없이 작성자가 차이를 검토하고 새 기준·새 키로 재제출한다.
- 키 범위는 인증 주체+연산+키, 요청 digest에는 대상·기준 revision·본문을 포함한다. 동일 키/동일 요청은 커밋된 응답을 재사용하며 revision을 추가하지 않는다. 동일 키/다른 요청은 409 `idempotency_key_reuse`. 응답 유실 재시도는 같은 키를 쓴다. 멱등 결과 조회는 stale 판정보다 앞서 처리한다.
- 커밋 전 실패는 콘텐츠와 성공 영수증 모두 남기지 않는다. 동시 동일 키는 유일성 제약과 트랜잭션으로 하나만 성공시킨다. 보존 기간/재시도 유효 기간을 계약에 명시하고 만료 키를 새 작업으로 조용히 재사용하지 않는다.
- 모델 호출·사람 검토는 트랜잭션 밖에서 수행한다. `SQLITE_BUSY`는 stale conflict가 아니다. 제한된 대기 소진은 명시적 재시도 가능 503으로 구별한다([S2], [S5]). Git 임시 모드에서는 이 프로토콜을 구현된 API라고 부르지 않으며, 기준 commit/revision과 병합 결과 검증으로 의미 충돌을 차단한다.

제안 검토 흐름은 `draft → in_review → approved / changes_requested / rejected`; 수정본은 새 `draft`이며 이전 승인을 상속하지 않는다. 승인/철회 이벤트는 reviewer·정확한 revision/hash·증거·시각에 결속한다. 이는 아래 기존 상태들을 하나로 대체하는 enum이 아니다.

| 기존 근거 | 대응 축과 보존 규칙 |
| --- | --- |
| Cast-Index의 `게시`, `미게시·대기`, `폐기` (`docs/game-logic/Cast-Index.md:9-37`) | 표면별 publication eligibility. `게시`만 해당 공개의 근거이고 파일 존재·큐레이션 통과는 대체하지 못함. 기존 기록의 revision/hash 결속을 확인하지 못하면 unknown 유지 |
| `confirmed-integration-manifest.json`의 `approved` 및 `incomplete: true` (`tools/wiki/confirmed-integration-manifest.json:2-6`) | 통합 출처 승인과 전체 완결성은 별도. B017·B020·M007 및 최종 검토 미완을 보존. 일부 공개가 전체 완료를 뜻하지 않음 |
| art `look.owner_verdict: accepted`, `status: promoted`, 해시·권리·검토 영수증 (`tools/art/runtime-asset-provenance.mjs:63-105`) | 자산 검토와 runtime promotion 축. 문서 승인으로 승격 불가. 경로/해시/GUID 참조를 연결하고 2D 합성과 메시 파이프라인 승인은 분리 |

**OWNER DECISIONS — 승인:** reviewer/owner 역할 배정, 자기 승인 허용 여부, 철회 권한과 이미 공개된 release의 회수 정책, 멱등 기록 보존 기간. 권고는 작성자에게 owner 승격 권한을 주지 않는 것이다.

## 3. release manifest → JSON/Markdown → owner PR → 정적 공개

두 모드 모두 공개 절차는 다음과 같이 제안한다.

1. 승인된 정확한 revision 집합을 **불변 release manifest**로 고정한다. `release_id`, authority mode, source commit/tree, entity/revision/hash, schema/exporter version, 검토 근거, 공개 표면, 출력 path/hash, incomplete 표시를 포함한다. 공개본 manifest에는 내부 출처 상세·비밀 경로를 넣지 않고 내부 감사본과 식별자로 연결한다.
2. 격리 staging에서 manifest만 입력으로 안정 JSON과 generated Markdown을 생성한다. 필드 순서·인코딩·개행을 고정하고 의미 있는 배열 순서를 보존한다. 후속 DB 편집은 진행 중 release에 영향을 주지 않는다. 내부 영감/초안은 JSON·MD·HTML·검색 인덱스·이미지 메타데이터까지 공개 투영에서 제외한다.
3. hash·schema·ID/FK 관계·승인 결속·slug/anchor·자산 실제 bytes·공개 텍스트를 검사한다. 출력 manifest가 소유한 파일만 교체/정리하고 별도 저작 문서는 보호한다. 현행 mount는 복사 후 오래된 파일을 지우지 않고, VitePress는 폴더 Markdown을 열거하므로 기존 출력 폴더를 그대로 신뢰하지 않는다(`docs-site/scripts/mount.mjs:193-197`; `docs-site/.vitepress/config.mts:8-18`).
4. manifest+JSON+MD를 **owner PR**로 검토한다. 병합 산출물 hash가 고정 manifest와 일치하는지 다시 검증한 뒤 VitePress static을 생성/게시한다. 현재 `docs:build`는 VitePress만 실행하며 링크 무시 설정이 있어 별도 gate가 필요하다(`docs-site/package.json:7-9`; `docs-site/.vitepress/config.mts:27`). 기존 `/design/`, `/world/`, `/rules/` URL을 유지한다(같은 config:55-75).
5. `(release_id, surface, artifact_hash, merged_commit, deployment_receipt)` 영수증으로 공개를 확인한다. PR 생성/병합만으로 deployed라 표시하지 않는다. Git·DB·배포는 하나의 트랜잭션이 아니므로 재시도 가능한 대조 작업으로 영수증을 복구한다.

GitHub Wiki는 동일 승인 release에서 **별도 생성·검사·소유자 허가·공개 영수증**을 갖는 파생 표면이다. 현재 조각 필터는 Cast-Index 게시 상태를 읽는다(`tools/wiki/build-wiki.mjs:250-278`). 그 필터만으로 atlas 본문/JSON 내부의 비공개 필드까지 가려지지는 않는다. Wiki 성공과 사이트 성공을 서로 대신하지 않으며 Wiki 역편집을 수입 원본으로 삼지 않는다. 별도 Wiki 공개 허가는 ADR:30의 요구다.

## 4. 제안 `/design-store-api/`와 인증 경계

모든 경로는 미구현 제안이다. 공개 독서는 정적 snapshot을 사용하고 API의 초안/검토 데이터는 인증된 저작자에게만 제공한다.

| 경로(접두사 생략) | 계약 |
| --- | --- |
| `GET /v1/entities`, `/v1/entities/{id}`, `/v1/entities/{id}/revisions/{revision}` | domain/kind/tag 검색, 현재 head와 불변 revision; 읽기 scope 적용 |
| `POST /v1/changesets` | 생성·편집·오프라인 import의 단일 CAS 진입점; 모든 변경의 기준 revision과 멱등 키 필수 |
| `POST /v1/entities/{id}/reviews` | 정확한 revision/hash에 승인·변경요청·철회 기록; reviewer scope |
| `POST /v1/releases`, `GET /v1/releases/{id}` | 승인 집합 고정 및 산출물/표면별 영수증 조회; 생성은 release 권한 |
| `GET /health/ready` | 운영자 전용 readiness; DB·비밀·초안 노출 금지 |

**OWNER DECISIONS — 인증/노출:** IdP, 사람 세션/에이전트 토큰 발급·철회 방식, 역할과 domain scope, origin 공개 방식은 미결정이다. 권고는 사람 SSO, 에이전트별 최소권한 단기 토큰, HTTPS origin에서 직접 인증/인가 재검증이다. 프록시 주소나 클라이언트의 actor 필드를 신뢰하지 않는다. 쿠키 사용 시 CSRF·Origin 검사, 비밀 없는 공개 번들, 제한된 CORS, 비공개 응답 `no-store`, 감사 로그 접근 통제를 적용한다. Vercel 프록시가 인증을 대신하지 않는다.

**WT와 HEAD 구별:** 현재 dirty `vercel.json:25-28`은 `/api/:path*`를 character-forge로 rewrite한다. 직접 읽은 **HEAD `vercel.json:1-4`에는 outputDirectory/buildCommand만 있다**. 이는 배포 확인도 HEAD 설정도 아니므로 `/api/*`를 점유하지 않는 별도 prefix를 제안한다. 이번 작업에서는 rewrite를 추가하지 않는다.

## 5. 단일 내구 호스트·백업·복구 운영

**OWNER DECISIONS — 호스트/운영:** Windows 단일 호스트의 로컬 영구 디스크 `E:/git/design-store-data/`를 저장소 밖 운영 경로로 쓰는 안을 권고할 뿐, 호스트 존재·디스크 성격·가용성은 미측정이다. 운영자, 서비스 계정, 재시작 감독, HTTPS 도달성, 방화벽, 장애 연락, RPO/RTO·보존 기간·허용 쓰기 중단·비용 승인이 필요하다. 개발 체크아웃이 있는 macOS에서 이 경로를 만들지 않는다.

SQLite WAL은 읽기와 쓰기를 병행하지만 **동시 writer는 하나**이고 공유 메모리 때문에 동일 호스트를 요구한다([S2]). 단일 서비스가 쓰기를 직렬화하고, 모든 연결에서 트랜잭션 전에 FK를 활성화·확인한다. SMB/NFS·클라우드 동기화 폴더·독립 writer 호스트를 사용하지 않는다. 처리량 보장은 없으며 queue latency, busy 오류, transaction 시간, WAL/checkpoint, 디스크 여유, 마지막 정상 백업을 관측한다.

Vercel은 정적 read-only 배포 및 선택적 API 프록시만 맡긴다. 함수 파일시스템은 ephemeral이고 인스턴스 간 공유되지 않아 mutable SQLite의 영구 저장소로 사용하지 않는다([V1]). 외부 rewrite 지원([V2])이 Windows LAN origin의 도달성을 보장하지 않는다.

백업은 **Online Backup API 또는 `VACUUM INTO`**로 일관 snapshot을 만든다([S6]). 활성 WAL DB의 main 파일만 복사하지 않는다([S2]). 초안·revision·검토·멱등 기록·release 영수증을 포함하고, 앱/schema 버전·설정 복구 절차와 필요한 외부 증거 bytes도 별도로 보존한다. 암호화·접근 통제된 다른 장애 도메인에 복제한다. Git 공개 export는 미공개 초안의 백업이 아니다.

복원 훈련은 격리 경로에서 수행하고 **`PRAGMA integrity_check`가 `ok`이며 `PRAGMA foreign_key_check` 결과가 0행**이어야 통과한다. 전자는 FK 오류를 검사하지 않으므로 둘 다 필수다([S7]). revision/hash·승인·manifest 재현·멱등 재시도를 확인한 뒤에만 운영자가 복원본 전환을 승인한다. 복구 시 기존 writer를 중단/차단해 두 원본이 살아나지 않게 한다.

공식 근거는 `storage-options.md:83-88,100-101`에 수집된 URL을 사용한다: [S2] https://www.sqlite.org/wal.html ; [S5] https://www.sqlite.org/lang_transaction.html ; [S6] https://www.sqlite.org/backup.html ; [S7] https://www.sqlite.org/pragma.html ; [V1] https://vercel.com/kb/guide/is-sqlite-supported-in-vercel ; [V2] https://vercel.com/docs/rewrites . 이 작업에서 성능·실서비스·공식 페이지 재조회는 하지 않았다.

## 6. 수용 시나리오와 검증 범위

아래는 **향후 구현 수용 기준이며 실행 결과가 아니다**. 동시성 검증은 고정 sleep 대신 트랜잭션/상태 이벤트를 먼저 구독하고 bounded timeout으로 관측한다.

| 시나리오 | 자극과 관측 가능한 통과 조건 |
| --- | --- |
| Service down | 저작 origin 중단. 기존 사이트/Wiki와 승인 snapshot은 API 호출 없이 읽힌다. 쓰기는 명시적 연결 실패/503이며 성공으로 표시되지 않는다. 응답 유실 요청은 복구 후 같은 키로 대조하여 중복 revision이 없다. 자동 원본 전환 없음 |
| Stale write | 두 작성자가 r7 조회. A의 r8 커밋 이벤트 후 B가 r7 제출. B는 409/current r8, B revision·링크·승인 변경 0건. A 요청 재전송은 기존 결과, 같은 키/다른 본문은 409 |
| Corrupt export | staging JSON/MD 한 byte 변조 또는 dangling link·승인 불일치 주입. gate 실패로 공개 중단, 기존 정상 release 유지, published 영수증 없음. 원 manifest 재생성은 같은 bytes/hash; 내부 자료 유출도 gate 실패 |
| Backup restore | 초안과 승인 release가 있는 백업을 격리 복원. integrity_check=ok AND foreign_key_check=0행, 승인·revision·키 결과·export hash 일치. FK 위반 fixture는 첫 검사 통과 여부와 무관하게 거부. RPO/RTO는 실제 측정치로 보고하고 운영 writer 차단 전 전환 금지 |

이번 검증은 필수 입력과 인용 원본 읽기, HEAD/WT 비교, 보고서 여섯 섹션 확인에 한정한다. 직접 읽은 ADR·Cast-Index·통합 manifest·art validator·Wiki filter·mount·VitePress 설정/스크립트는 `git diff --quiet HEAD -- ...` 결과 0으로 HEAD와 같았다. 서비스·DB·브라우저·빌드·복구 훈련은 실행하지 않았다.
