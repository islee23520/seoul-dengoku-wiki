# Concept

## 무엇을 만드는가
서울 내부 세계 위키(seoul-dengoku-wiki)의 저장소다. SQLite 정본(`data/canonical/wiki-cast.sqlite`)에서 승인된 공개 투영을 생성하고, React SPA(`/wiki`)·읽기 전용 Node API가 이를 소비한다. 상세 계약은 루트 `AGENTS.md`("Repository Guidelines")와 `WORLD_BUILDING_GUIDE.md`가 정본이다.

## 현재 모듈 (2026-10-27~)
**InkOS 어댑터 혼합 구조 지원** — `scripts/inkos-adapter/export.mjs`가 문단 전용 문서만 허용하는 제한(`E_ADAPTER_UNSUPPORTED`)으로 유일 공개 문서(`DOC:Lost-Technology-Lineage`, heading 17·list 2·paragraph 61)의 정본 왕복을 차단한다. 승인된 문서 전체가 공개 상태인 만큼, 워커 번들은 안정 한국어 문단 슬롯만 발췌하고 heading·목록·표 노드는 건너뛴다. 대상 앵커는 여전히 안정 한국어 문단이어야 하며, prepare 미리보기는 비(非)문단 노드를 원본 그대로 보존한다. 후보 전용·읽기 전용·`no-apply` 경계는 불변.

## 스택 메모
- 런타임: Node ≥24.15(`node:sqlite`, 로컬은 26.4.0). 패키지 매니저 npm(`npm ci --ignore-scripts`).
- 제품 스크립트: ESM(`"type":"module"`), `scripts/`의 평범한 .mjs — 프레임워크 없음.
- 시험: 순수 `node:test`(vitest는 PR #625로 제거됨 — 재도입 금지).
- DB: SQLite 정본 읽기는 `scripts/cast-sqlite/db.mjs`의 `openReadOnly()`만.
- 원격: GitHub `islee23520/seoul-dengoku-wiki`, 전용 브랜치 → PR → 소유자 rebase merge.

## 비목표
정본 쓰기·승인 발급·자동 적용/게시, vitest/CI 재도입, 세계관 문서 집필, 이 모듈 외 어댑터 계약 변경.
