# Task 01 독립 품질 리뷰

## 범위와 기준

`AGENTS.md`, `CLAUDE.md`, `Intent.md`, `Concept.md`, `Design.md`, `ToDo.md` 및 기존 `task-01` 증거를 직접 읽고, `.omo/evidence/task-01-gate-review.md`의 B1/B2를 기준으로 재검토했다. 산문·증거 작업이므로 programming의 언어별 코드 규칙은 N/A다. 새 기계 코드는 `verify-lineage.mjs` 한 파일뿐이며 Node 테스트로 실행한다.

## 결과

`actionable_findings: 0`

- 일반적인 AI 채움말, 근거 없는 완료 주장, 중복 권위 선언을 새 산출물에서 발견하지 못했다.
- 호환성 shim, 제품 코드 추상화, 범위 밖 구현 주장은 추가하지 않았다.
- 기존 문서의 승인된 의미와 task-01 증거를 바꾸지 않고 새 계보·리뷰 증거만 추가했다.
- 이전 finding B1(validator가 commit subject의 `amend`를 읽음)은 `verify-lineage.mjs:5-21`의 구조화된 JSONL 파서와 `verify-lineage.mjs:48-53`의 subject/action 분리 테스트로 해결했다.
- 이전 finding B2(독립 quality-review 및 negative fixture 부재)는 이 문서와 `verify-lineage.mjs:48-96`의 독립 fixture들로 해결했다.
- 2차 finding(부모 연결·필수 reflog·40-hex 정규성 미검증)은 `verify-lineage.mjs:23-44`에서 base 첫 부모, 순차 부모, reflog 범위와 ordinary action을 모두 강제해 해결했다.
- 실제 path:line blocker/actionable finding은 0건이다.

## 과적합 방지 검토

검증기는 커밋 subject를 읽지 않는다. JSONL의 `{hash, parents}`와 `{hash, action}`만 읽어 40-hex hash, base 첫 부모, 각 후속 부모의 직전 commit 연결, 중복·merge, 모든 commit의 reflog 증거와 ordinary `commit:` action을 검사한다. `verify-lineage.mjs:48-96`의 14개 테스트는 각각 고유 실패 클래스를 가지며, expected 값은 validator 결과에서 파생하지 않는다. subject-only mutant, parent-chain noop mutant, optional-reflog mutant는 mutation proof에서 실패한다.

## 구현 품질 점검

- 구현 미러링: 테스트는 외부 JSONL 계약과 독립 fixture를 통과시키거나 거부하며 함수 내부 자료구조를 복제하지 않는다.
- Tautology: 기대값은 고정된 hash/action fixture에서 유도하고 validator 반환값을 기대값으로 재사용하지 않는다.
- Deletion-only: `verify-lineage.mjs:128-186`의 세 실제 mutant가 각각 실행되고 killed되어 guard 제거를 놓치지 않는다. `runRequiredCase`와 exact inventory가 assertion call neutralization을 별도로 잡는다.
- 과잉 테스트: 13개 구조 계약 사례와 3개 mutant subtest는 subject/action, merge, hash, parent, duplicate, connection, reflog, valid chain을 각각 구별한다. 최종 테스트 수는 17개이며 마지막 테스트는 inventory writer다.
- 오류 처리: broad catch나 오류 삼킴이 없고 명시적 `Error`를 발생시킨다.
- prose pinning: subject 텍스트를 파싱하거나 특정 문장을 고정하지 않는다.
- 불필요한 추상화·호환성 shim·dead code는 없다.

## 독립 receipt authority

`verify-required-lineage-cases.mjs:3-10`은 production runner와 별개의 frozen 16-ID literal authority를 가진다. `verify-required-lineage-cases.mjs:12-21`은 object-only schema, `required`/`passed` 배열, string·unique·sorted exact equality를 각각 검사한다. clean receipt는 accept하고, 양 배열에 extra를 추가하거나 `struct.valid-chain`을 양쪽에서 삭제하거나, duplicate·required-only·passed-only·wrong-type·nonstring을 tamper한 8개 temporary probe는 모두 nonzero였다. 기대 목록을 receipt에서 읽지 않으므로 양 배열을 일관되게 변조해도 통과하지 않는다.

## 현재 source line anchors

- runner inventory: `verify-lineage.mjs:6-19`
- mutation proof helper: `verify-lineage.mjs:21-24`
- exact producer comparison: `verify-lineage.mjs:27-34`
- parent/reflog structural checks: `verify-lineage.mjs:37-76`
- `subjectOnlyMutant` deletion proof: `verify-lineage.mjs:128-153`
- `parentChainNoopMutant` deletion proof: `verify-lineage.mjs:155-166`
- `optionalReflogMutant` deletion proof: `verify-lineage.mjs:167-186`
- inventory completion assertion: `verify-lineage.mjs:188-191`
- independent receipt verifier: `verify-required-lineage-cases.mjs:3-28`
- receipt tamper probes: `test-required-lineage-cases.mjs:7-25`

### 실제 mutation proof와 deletion protection

- `subjectOnlyMutant` (`verify-lineage.mjs:128-144`)는 subject의 `amend`만 보고 reflog action을 무시한다. ordinary subject fixture는 correct `true`인데 mutant가 `false`가 되고, harmless subject + `commit (amend)` fixture는 correct reject인데 mutant가 accept하여 두 변이가 모두 killed된다.
- `parentChainNoopMutant` (`verify-lineage.mjs:145-166`)는 hash와 parent count만 검사하고 base/직전 부모 연결을 생략한다. disconnected middle parent fixture에서 correct reject, mutant accept로 killed된다.
- `optionalReflogMutant` (`verify-lineage.mjs:167-186`)는 reflog 누락을 허용한다. 두 commit 중 두 번째 evidence가 빠진 fixture에서 correct reject, mutant accept로 killed된다.

세 mutant는 production `validateLineage`를 호출하지 않으며, expected 값은 literal `true`/`false`로 고정되어 있다. 각 mutation case는 `expectMutantKilled`가 proof token을 반환해야만 ID를 등록한다. `NEUTRALIZE_MUTANT_ID`로 각 call을 무력화한 isolated copy는 모두 nonzero와 해당 ID 누락 inventory를 냈다. 따라서 테스트는 구현 미러링·tautology·삭제만 통과하는 빈 body가 아니다.

## 판정

PASS. 기존 task-01 gate report는 `evidence/task-01-gate-review.md`에 경로로 결속하며, 이 리뷰는 누락된 remove-ai-slops/programming 관점과 negative fixture 요구를 독립적으로 보강한다.
