# ToDo

규칙: 한 번에 하나의 모듈. 현재 모듈만 진행하고, 로컬 검증 → commit/push → PR 순서로만 완료한다.

## 현재 모듈: PostgreSQL 문서 API 판독
- [x] 최신 main의 문서·생성·데이터 API·프런트엔드 소비 경로와 승인 경계를 조사한다.
- [x] PostgreSQL 문서 API와 전이 판독기를 연결하고 main의 공개 정책과 기존 SQLite 호출자를 보존한다. (e376cc6e9)
- [x] 일회용 PostgreSQL에서 reader 권한과 실제 HTTP 문서 응답을 검증한다 — 전수 대사 PASS(1006 테이블·371만 행 SHA-256 동일), 목록·본문 ko/en·world/index가 순정 main SQLite API와 동일(536450c81). 누락-schema 시나리오(typed sidecar DROP)는 503가 아니라 목록 60→1 축소·Sixteen-States/world-index 404·glossary 200 — 누락 스키마가 다수 문서를 숨기는 영향까지 관찰됨. 운영 자격·권한 변경은 별도로 처리한다.
- [ ] 검증된 모듈을 commit/push하고 main 대상 PR로 전달한다. 병합은 소유자만 수행한다.

## 현재 모듈: 생성 release PG 스냅숏 컨텍스트 + clan-crests worker (feat/pg-generation-snapshot-20261029)
- [x] release 오케스트레이터가 WIKI_DOCUMENT_PG 시 REPEATABLE READ 스냅숏을 export해 환경으로 전파(exporter는 worker 종료까지 유지). 단, 이 시점에 스냅숏을 소비하는 worker는 clan-crests 하나뿐이며 catalog·portrait 2종은 여전히 SQLite를 읽는다 — 전체 release PG 모드는 아직 실행 불가.
- [x] db-pg transaction에 importSnapshot(SET TRANSACTION SNAPSHOT) 지원, 스냅숏 ID 형식 검증(하이픈 hex 실측 기준).
- [x] clan-crests worker PG 전환: WIKI_DOCUMENT_PG 시 스냅숏 트랜잭션에서 readClanCatalogDocumentAsync+motif 판독. WIKI_DOCUMENT_DB SQLite 경로는 무변경 보존.
- [x] 검증: 스냅숏 임포트 판독 == 일반 판독 == SQLite 판독(303 clan·106 source·15 motif·assignCrests 입력 완전 동일), 부모→자식 프로세스 스냅숏 전달 종단 확인.
- 경계: catalog·portrait-source·portrait-tokens worker는 아직 SQLite를 읽음(스냅숏 미소비). databaseHashes의 파일해시→PG generation 식별자 대체도 미구현. 다음 모듈에서 전환.

## 후속 모듈: 전체 PostgreSQL 전환
- [ ] 공통 typed reader 약 100개 파일과 private 입력을 비동기 PostgreSQL 계약으로 전환한다.
- [ ] 생성 worker, release 일관된 snapshot, 저작 transaction 및 Python→Node 브리지를 전환한다.
- [ ] 데이터 API·프런트엔드 공개 투영 경로와 기존 계약을 PostgreSQL 정본에 연결한다.
- [ ] 현재 정본의 스키마·inventory·metadata 생성 및 대사를 검증하고 운영 reader 권한과 배포를 별도 적용한다.

## 이전 모듈: InkOS 어댑터 혼합 구조 지원 (feat/inkos-adapter-mixed-structure-20261027)
- [x] 브랜치 생성(`test/inkos-adapter-regression-20261026` 위에 스택 — PR #627 의존 명시)
- [x] `export.mjs`: 문단 전용 거부 → 비문단 노드 skip + 대상 앵커 문단 요구 유지
- [x] `inkos-adapter-fixture.mjs`: `mixedStructure` 옵션(heading+list 노드, 기본값 불변)
- [x] 신규 시험 `test-inkos-adapter-mixed-structure.mjs`(발췌·체인·비문단 보존·비문단 대상 거부)
- [x] 픽스처 들여쓰기 정리
- [x] README §4·§6·§9 갱신(혼합 구조 발췌 서술)
- [x] 로컬 검증: 7종 직렬 실행 전부 통과(108/108)
- [x] 정본 실운영(E 본완료): `개요-p1` export → 실제 provider(cliproxy) → collect → prepare-draft → 정본 DB 해시 무변경 → `real-provider-run.md` 폐쇄
- [x] commit(한국어 conventional) → push → PR(#627 스택 명시)

## 대기 중 (소유자)
- PR #623/#627/#628 병합 → 병합 후 D 레인(`test-inkos.mjs` master 스모크 복원)
