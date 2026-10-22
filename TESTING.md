# 테스트 스크립트 작성 규칙

이 저장소의 테스트 스크립트가 불필요하게 늘어나지 않게 하는 프로젝트 공통 규칙이다. 새 검증 코드를 추가하기 전에 이 문서를 읽는다. 위키 본문(lore) 편집 규칙은 [WORLD_BUILDING_GUIDE.md](WORLD_BUILDING_GUIDE.md)를, PR 절차는 [CONTRIBUTING.md](CONTRIBUTING.md)를 따른다.

## 규칙

1. **한 모듈에 한 테스트 파일.** 영구 모듈(생성기·검증기·API·렌더러)의 회귀 검증은 `scripts/test-<모듈>.mjs` 한 파일에 사례를 추가한다. 새 `.mjs` 테스트 파일은 새 영구 모듈이 생길 때만 만든다.
2. **1회성 확인은 커밋된 테스트로 만들지 않는다.** 원천 정정·마이그레이션·일회성 점검은 실행 결과를 `.omo/private/<작업-날짜>/` 증거로 남기고 스크립트는 작업 세션이 끝나기 전에 지운다. 산문(lore 문장) 변경에는 문장 고정 테스트를 만들지 않는다(세계관 편집 지침 §7).
3. **`package.json`의 `test:*`는 CI가 실제로 실행하는 그룹만 둔다.** 현재 이 저장소의 PR 게이트는 `npm run test:lore-json`과 `node scripts/lore-json-validate.mjs`이다. 새 `test:*` 항목은 `.github/workflows/lore-pr-checks.yml`(또는 상위 저장소 CI의 고정 튜플)에도 반영할 때만 등록한다.
4. **데이터 계약 검증은 검증기가 담당한다.** 로어 JSON 형식은 `scripts/lore-json-validate.mjs`, 게시 금지어·비공개 링크·링크 깨짐은 `scripts/gate.mjs`가 이미 검사한다. 테스트 파일에서 같은 검사를 복제하지 않고 검증기 규칙을 보강한다.
5. **기대값 고정(baseline·snapshot) 테스트는 승인 기록과 함께 재발급한다.** 소유자가 정본을 바꾼 때 고정값이 달라지면, `scripts/approved-*.json` 승인 기록과 함께 재발급한다. 승인 없이 baseline을 조용히 고쳐 통과시키지 않는다.
6. **임시 검증 스크립트(`sweep-*`, `probe-*`, `stage-*`)는 남기지 않는다.** 커밋 전 `git status`의 `?? scripts/` 항목을 검사하고, 끝난 작업의 산물은 삭제하거나 증거 디렉터리로 옮긴다.
7. **재현 가능성.** 각 테스트 그룹은 저장소 루트에서 `npm run <그룹>` 한 줄로 실행해 같은 결과가 나와야 한다. 고정 sleep·타이밍 의존·네트워크 의존을 두지 않고, 비동기 대기는 이벤트·상태 구독에 bounded timeout으로 건다.

## 현재 상태

- `scripts/cast-sqlite/test-*.mjs`, `scripts/test-cia-*`, `scripts/sweep-*` 등 미추적 스크립트 다수는 이 규칙 시행 이전 세션의 작업 중 산물이다. 소유자 승인 아래 이 규칙에 따라 정리 대상을 검토한다. 정리 전에는 임의로 삭제하지 않는다.
- 기존 그룹 목록과 실행 방법은 `package.json`의 `scripts`와 [README.md](README.md)의 Checks 절을 본다.
