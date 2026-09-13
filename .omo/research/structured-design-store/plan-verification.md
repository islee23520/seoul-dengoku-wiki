# 구조화 설계 저장소 계획 검증

검증 전용. 계획·제품·JSON은 수정하지 않았다. 측정 HEAD `5bd47ee0780186709ec71f95db0687fac2bf90fa`(2026-09-13). 대조 입력: `.omo/plans/structured-design-store.md`, `discovery-digest.md`, `design-brief.md`, `schema.md`, `service.md`, `migration.md`(접힘 `corpus.md`/`consumers.md`/`storage-options.md`). 아래 수치는 이 패스에서 원문을 다시 세었고, 계획 본문 명령을 실행하지 않았다.

## 1. 요구↔증거

| 계획 절 | 계약 요구 | 증거 | 판정 |
|---|---|---|---|
| 머리말 | 계획 전용, 명령 미실행, HEAD 명시, 문법 락·전투 불변, 대외 《잔선》, 락은 경로만 | 계획:1–5; digest:1–3,90–100; brief:17–23; 락 `.omo/locks/ate-grammar-reference.md` | 부분 — 5행 공개 어휘 |
| 1 목표/비목표 | 봉투화·상태 분리, 전투/Area-1/`CreateSeoul`/라이브 읽기/이중편집/Mongo/PR#87 자동승격/이름병합/CMS·EAV/영감 유출/아트 바이트 금지 | 계획:7–11; digest:110–119,123–131; brief:11–15,20–21,26; consumers:8, runtime 행 | 부분 — 포트레잇/메시 분리 문구 없음 |
| 2 권고 | Git 임시 정본, SQLite HTTP는 미승인 목표, JSON=교환·MD=서술/내보내기, Mongo 비선택, ADR 개정 전 API 원본 금지 | 계획:13–19; brief:5–8; digest:60–67,102–104; ADR-001:22–31(항목5=:30); storage-options 권고 행 | 통과 |
| 3 분류·스키마 | domain/kind≠category/tag, 테이블 계획, C1–C6, 충돌 10 미정정, 교환 예, faith payload | 계획:21–61; digest:40–48,69–80,110–119; schema.md 1–4절; migration.md 1절 동결표 | 부분 — envelope 혼선, 334 인용줄 |
| 4 서비스 | 두 권위 모드, CAS/409/503, release→owner PR, `/design-store-api/`, WT vs HEAD vercel, WAL 단일 writer, 게임 비소비 | 계획:63–80; service.md 1–5절; digest:64–66; vercel WT:25–28 vs HEAD 1–4행; mount.mjs:193–197; config.mts:27,55–75; package.json:8 | 통과 |
| 5 체크리스트 | C1→C6, 미구현 게이트 BLOCKED, 각 항 검증 명령, SQL/CLI는 예 | 계획:82–124; migration.md 1·6절; `audit/verify-migration.mjs` 부재 | 부분 — 9·11·12 |
| 6 소유자 결정 | 전부 미결정, 권고≠승인 | 계획:126–142; brief:6–7,23; service.md OWNER DECISIONS; storage-options 명시 승인 목록 | 부분 — 행 누락 |
| 7 수용·롤백 | 미실행 기준, sleep 금지, 문법/런타임 울타리 | 계획:144–157; service.md:84–94; migration.md 5절 | 부분 — mount 검증 공백 |
| 8 부록 | digest/brief/schema/service/migration + 접힘 3파일 | 계획:159–169; digest:7–15 | 통과 |

## 2. 수치 독립 재도출 (8항 이상, 계획 3행·digest 교차)

계획 3행은 “digest 교차검증, 이번 미실행”으로 표시. 이 패스 실측과 비교한다.

| # | 주장 | 이 패스 실측 | 출처 | 결과 |
|---|---|---|---|---|
| 1 | humans 422 `K001`–`K422` | 422, 한재목→노세람 | atlas JSON fence; Cast-Index 표 422행 / 푸터 `총 412명`; verify.mjs:94–105 | 일치(412는 충돌1) |
| 2 | roster 100 `roll-*`, ∩ humans=0 | n=100, people=100, 이름 교집합 0, 회랑 전부 null | `roster-100.json` | 일치 |
| 3 | backfill 422, ∩ humans=422, ∩ roster=0 | count=422, 이름 교집합 422 / 0 | `cast-backfill-draft.json` | 일치 |
| 4 | `region:*` 427 | 25 JSON, 고유 427 | WT `docs/game-logic/regions/content`; HEAD `git ls-tree …/regions` = 0 | 일치 |
| 5 | 역 334, 그래프 25/334/435 | `DistrictCount=25` `StationCount=334` `EdgeCount=435` | `SeoulWorldGraphCatalog.cs:9–11`; `CreateSeoul`는 `RouteDomain.cs:106–111` | 수 일치, 인용 줄은 카탈로그가 정본 |
| 6 | Area-1 3역 | `Stations.Count == 3` | `GameDataCatalogValidator.cs:20`; builder:20–29 | 일치 |
| 7 | Wiki 게시 25 / 제외 88 / 파일 113 | 조각 파일 45+41+27=113; hub `게시` B001+G01–G24=25; 113−25=88 | `git ls-files`; `Cast-Index.md` 행; `build-wiki.mjs:250–278` | 일치 |
| 8 | 투영 125 | 9 인덱스 + story 45 + monster 41 + hostile 27 + diagram 3 = 125 | `world-atlas-render.mjs:177–206` 키 구성; digest:54는 함수 실행 125 | 일치(렌더러 미실행) |
| 9 | 가문 32, CORPORATION 22 `HC01`–`HC22` | classes 22/4/3/2/1; `related_ids`는 HC01–HC14 | atlas `houses[]` | 일치(충돌3) |
| 10 | 관계 780 vs 43 vs 427 | Cast-Relations 데이터 780; atlas relations 43; 동 427 | 각 원문 | 일치 |
| 11 | site Rules 7 | `Rules-*.md` 7 | `docs-site/rules/` | 일치 |

부가 실측(계획 미인용, digest와 같음): atlas 5,072,804 B / 57,612줄; SHA-256 `61650e2e…`; blob `a4a7d55…`; `existing-names` 430; docs-site md 13/165/36; game-logic 깊이3 md 202; PR tip `5230e02`·지역 `98cc619` 둘 다 HEAD 조상 아님(exit 1).

## 3. 체크박스·SQL/CLI

13개 `- [ ]` 모두 `검증(PLANNED·미실행)`이 있다. 1–10·13은 셸 명령. SQL CREATE는 계획에 없고 `테이블(미구현 DDL 계획)`만 — 미실행 표기 충족. CLI는 머리말·5절이 계획 예임을 명시. `audit/verify-migration.mjs`는 디스크에 없음 → 해당 게이트는 계획 문면대로 BLOCKED.

결함: 11은 명령이 아니라 “결정서 해시 대조”. 12는 인증 GET/409이나 픽스처 경로가 없다. 9는 materialize/`docs:build`/wiki `diff`만 있고, 7절이 요구하는 mount 바이트 비교와 migration.md 6절의 `mount.mjs`·`gate.mjs`·`diff -r …/design|world|rules|dist`가 빠졌다.

실행·계획 혼동: 없음. 체크 해제, 파서 수치를 이번 실행으로 쓰지 않음.

## 4. 결함 목록

**근거 없는/부정확한 주장**
- 계획:23이 25/334/435를 `RouteDomain.cs:106–111`에 묶음. 상수는 `SeoulWorldGraphCatalog.cs:9–11`. 106–111은 `CreateFromCatalog` 호출뿐.
- 계획:47–57 envelope는 `schema_id=lore-page.v1`인데 `kind=person`. schema.md 4절 예는 `kind=lore_page` + UUID. 미저장 예라도 계약이 충돌.
- 계획:136 “16파일 docs”는 digest:32 `gh pr view` 값. 출처 명령이 6절에 없고, 이 패스 `git diff --name-only 5bd47ee...5230e02`는 24경로(PR 파일 목록과 동일 연산 아님).

**카운트 불일치:** 계획 주장 숫자 vs 이 패스 실측 — 없음.

**실행 vs 계획 혼동:** 없음.

**PR 구속 본문 공개 어휘** (`design-brief.md:33–35`, run-state 스윕). 참조 IP 고유명(모드명)은 본문에 없고 락 경로만 있다. 그러나 계획:5 `salvage tech`, `기계/공장 숭배`; :29 `salvage-technology`; :59 `salvage_practice`/`campaign_events`는 공개 금지 내부 영문·“공장 숭배”다. 이 파일은 PR에 실릴 계획이다.

**캠페인 전용/전투 불변:** 위반 없음. 비목표·7절이 Area-1 3역·`CreateSeoul`·틱·봉신 UI·전투 규칙 변경을 제외. Intent.md:11·Concept.md:5의 아이소/4방향과 충돌하지 않음.

**누락 소유자 결정** (service.md 2·4·5절, storage-options 명시 승인): 검토자/owner 역할, 자기승인, 공개 release 철회, 멱등 기록 보존기간, 유료 인프라. 계획 6절 8행·추가 권고(작성자 승격 금지)만으로는 부족하다. brief:21 포트레잇 2D 합성 vs 메시 분리도 계획 본문에 없다.

## 5. 판정

**FAIL**

리드가 계획만 고친다. 필수 수정:

1. 계획:5·29·59에서 `salvage*`·`공장 숭배`·공개 금지 `Event` 표기를 삭제. 문법 서술은 `.omo/locks/ate-grammar-reference.md` 경로만. 공개 한 줄은 brief:34 형식(《잔선》·후세 서울·잔해 신앙화·종파 분열·문화 분열)만.
2. 비목표 또는 7절에 포트레잇 2D 합성과 메시 파이프라인 분리, 바이트 대신 승인·경로·해시·GUID만 연결을 명시(brief:21; migration.md 7절).
3. 25/334/435는 `SeoulWorldGraphCatalog.cs:9–11`, 호출은 `RouteDomain.cs:106–111`로 분리.
4. envelope를 schema.md 4절과 맞추거나(`kind`/`schema_id`), 계획 JSON을 삭제하고 보고서 절로만 보낸다.
5. 체크박스 9 검증에 `node docs-site/scripts/mount.mjs`, `node docs-site/scripts/gate.mjs`, `diff -r baseline/docs-site/{design,world,rules,dist} candidate/...`를 추가(전부 PLANNED).
6. 체크박스 11을 결정서 경로·해시·ADR 개정 PR 조회 명령으로 바꾸고, 12는 미설치 BLOCKED와 픽스처 경로를 명시.
7. 6절에 검토 역할·자기승인·공개 철회·멱등 TTL·유료 인프라 행을 추가하고 모두 미결정으로 둔다.
8. “16파일”에 `gh pr view 87` 출처를 붙이거나, 미재실행이면 숫자를 digest 인용으로만 표시한다.

위 8항이 계획에 반영되면 재검증 PASS 후보. 이 문서는 계획을 고치지 않았다.
