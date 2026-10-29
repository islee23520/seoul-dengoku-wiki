# Concept

## 무엇을 만드는가
서울 내부 세계 위키(seoul-dengoku-wiki)의 저장소다. 현재 main은 SQLite 정본에서 공개 투영을 생성하며, 이 모듈에서 PostgreSQL 정본으로 전환한다. React SPA(`/wiki`)와 읽기 전용 Node API의 공개 계약을 유지한다.

## 현재 모듈: PostgreSQL 위키 판독 전환
최신 원격 main을 코드 기준으로 삼고, 위키의 정본·생성·문서 및 데이터 API가 PostgreSQL을 사용하도록 전환한다. 기존 SQLite와 JSON은 대사·역사 보존 또는 승인된 공개 산출물로만 다루며 현재 판독의 대체 정본으로 사용하지 않는다. 현재 운영 데이터와 사용자의 승인 범위, 비공개 권한, 문서 revision 및 기존 공개 API 계약을 보존한다.

기존 InkOS 어댑터 모듈의 완료 기록은 ToDo.md에 유지한다.

## 병렬 모듈: PostgreSQL 원천 아카이브 소비자 (main 943b32eba)
승인된 `.omp/plans/postgres-migration-remaining.md`의 Todo 8에 따라 `readSourceArchive` 호출자가 PostgreSQL 연결과 비동기 반환을 올바르게 사용하도록 전환한다. 기존 서울 정본과 승인·해시 검증은 보존하며 운영 전환 전 SQLite 아카이브를 유지한다. 실행 스택은 Node ESM 및 PostgreSQL `pg` 단일 연결·비동기 판독이다. 이전 InkOS 모듈은 아래 기록을 보존한다.

## 현재 작업 모듈: PostgreSQL 문서 API 판독 (PR #638)
공개 문서 API(`server/wiki-document-api.mjs`, :8788)의 판독을 PostgreSQL로 전환한다. 기존 SQLite 동기 호출자(생성·저작·검사)는 보존하고 `*Async` PG 판독자를 추가하며, 요청별 REPEATABLE READ 스냅샷과 SAVEPOINT 격리로 문서별 오류가 요청 전체를 503로 만들지 않도록 한다. 위 아카이브 소비자 전환과 병렬 진행되는 모듈이다.

## 이전 모듈 (2026-10-27~)
**InkOS 어댑터 혼합 구조 지원** — `scripts/inkos-adapter/export.mjs`가 문단 전용 문서만 허용하는 제한(`E_ADAPTER_UNSUPPORTED`)으로 유일 공개 문서(`DOC:Lost-Technology-Lineage`, heading 17·list 2·paragraph 61)의 정본 왕복을 차단한다. 승인된 문서 전체가 공개 상태인 만큼, 워커 번들은 안정 한국어 문단 슬롯만 발췌하고 heading·목록·표 노드는 건너뛴다. 대상 앵커는 여전히 안정 한국어 문단이어야 하며, prepare 미리보기는 비(非)문단 노드를 원본 그대로 보존한다. 후보 전용·읽기 전용·`no-apply` 경계는 불변.

## 스택 메모
- 런타임: Node ≥24.15(`node:sqlite`, 로컬은 26.4.0). 패키지 매니저 npm(`npm ci --ignore-scripts`).
- 제품 스크립트: ESM(`"type":"module"`), `scripts/`의 평범한 .mjs — 프레임워크 없음.
- 시험: 순수 `node:test`(vitest는 PR #625로 제거됨 — 재도입 금지).
- DB: PostgreSQL `pg` 비동기 reader와 요청별 read-only snapshot. SQLite는 이관 대사 및 역사 보존에만 사용한다.
- 원격: GitHub `islee23520/seoul-dengoku-wiki`, 전용 브랜치 → PR → 소유자 rebase merge.

## 비목표
vitest/CI 재도입과 세계관 내용의 임의 변경은 범위 밖이다.
