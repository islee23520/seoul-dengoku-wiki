# Concept

## 무엇을 만드는가
서울 내부 세계 위키(seoul-dengoku-wiki)의 저장소다. 현재 main은 SQLite 정본에서 공개 투영을 생성하며, 이 모듈에서 PostgreSQL 정본으로 전환한다. React SPA(`/wiki`)와 읽기 전용 Node API의 공개 계약을 유지한다.

## 현재 모듈: PostgreSQL 위키 판독 전환
최신 원격 main을 코드 기준으로 삼고, 위키의 정본·생성·문서 및 데이터 API가 PostgreSQL을 사용하도록 전환한다. 기존 SQLite와 JSON은 대사·역사 보존 또는 승인된 공개 산출물로만 다루며 현재 판독의 대체 정본으로 사용하지 않는다. 현재 운영 데이터와 사용자의 승인 범위, 비공개 권한, 문서 revision 및 기존 공개 API 계약을 보존한다.

기존 InkOS 어댑터 모듈의 완료 기록은 ToDo.md에 유지한다.

## 스택 메모
- 런타임: Node ≥24.15(`node:sqlite`, 로컬은 26.4.0). 패키지 매니저 npm(`npm ci --ignore-scripts`).
- 제품 스크립트: ESM(`"type":"module"`), `scripts/`의 평범한 .mjs — 프레임워크 없음.
- 시험: 순수 `node:test`(vitest는 PR #625로 제거됨 — 재도입 금지).
- DB: PostgreSQL `pg` 비동기 reader와 요청별 read-only snapshot. SQLite는 이관 대사 및 역사 보존에만 사용한다.
- 원격: GitHub `islee23520/seoul-dengoku-wiki`, 전용 브랜치 → PR → 소유자 rebase merge.

## 비목표
vitest/CI 재도입과 세계관 내용의 임의 변경은 범위 밖이다.
