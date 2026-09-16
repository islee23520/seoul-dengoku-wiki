한 줄 요약: 《잔선》 설계 문서 정본 238파일을 저장소 밖 보존소+SQLite로 캡처하고, 3방향 바이트 비교로 전량 수용을 증명하는 도구입니다.

## 커밋

- `670017d` feat(store): 정본 보존소·SQLite 캡처와 3방향 바이트 검증 도구 — 3파일 +366줄. base `origin/main` `4343cc0`.

## 변경 내용

- `tools/store/design-store-capture.mjs` — `capture` / `verify` CLI. 신규 의존성 없음(node:sqlite·node:crypto 내장).
  - 코퍼스: 루트 설계문서 4(Concept·Design·ToDo·Intent), docs/game-logic 최상위 MD 202, reference 18, name-pools JSON 6, docs-site/rules 사이트 전용 8(마운트 사본 28 제외) = **238**.
  - 캡처: `originals/<원본경로>` 바이트 복사(tmp+rename) + `design-store.sqlite`(capture_run·source_file: bytes BLOB·SHA-256·크기·git blob sha·commit) + `capture-receipt.json`(파일별 해시 매니페스트).
  - 검증: 코퍼스 재열거 후 **원본↔보존소↔DB 3방향 바이트 비교** + size/sha256 메타 대조 + DB행/보존소 과잉 탐지. 누락·변이·과잉 0이면 pass, 아니면 nonzero exit과 `verify-receipt.json`.
- `tools/store/test-design-store-capture.mjs` — node --test 5케이스(정상 캡처, 보존소 1바이트 변이, DB 행 삭제, DB 과잉 행, DB bytes 변이).
- `tools/package.json` — `test:design-store` 명시적 게이트 추가(tools 관례).

## 검증 증거

- RED→GREEN: 항상-통과 스텁 검증기에서 5/5 FAIL 탐지 확인 → 실구현 후 5/5 PASS (`npm run test:design-store`).
- 회귀: `npm --prefix tools test` 37 passed 0 failed.
- 실제 실행(깨끗한 worktree, `4343cc0`):
  - `capture` → files **238**, 보존소 12MB + SQLite 12MB
  - `verify` → `{"pass":true,"files":238,"db_rows":238,"preserved_files":238,"missing":[],"mutated":[],"extras":[]}`
  - 스팟 3파일(World-Narrative-Atlas.md 5,072,804B·roster-100.json·Intent.md): DB↔원본 cmp 동일, DB↔`git show HEAD` cmp 동일, git blob sha 일치. Atlas SHA-256 `61650e2e…`는 기존 감사 원본 해시와 동일.
- 보존소·DB·영수증: `/Users/ilseoblee/workspace/seoul-kenshi-store/run-4343cc0-160339/`(저장소 밖, Git 정본 불변).

## 범위

- PR #93 계획 C1/S0(문서 봉투 수집)의 첫 실행 도구입니다. 정본 권한은 여전히 Git(ADR-001)이며 DB는 재생성 가능한 보존·검증 사본입니다. 데이터 이관·스키마 확장·서비스 설치·Unity 변경 없음. main 병렬 작업·PR #87·#93 무손실.
