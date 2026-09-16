# 공개 준비 검증 기록 - 2026-09-06

이 기록은 공개용 QA 소비자와 패키지의 검증이다. **게임 검증 SHA는 `6f07a94996a1f416cec1a44a3b3844dfb732900f`**이며 게시 기준 `3a526124ca4667e9162a8e315c0a41fb52f15707` 또는 현재 main을 새로 검증하지 않았다.

## 실행 결과

- [Runner](state/run-probe.sh)를 명시적 `MONO`, `CSC`, `MANAGED`, `OUT`으로 호출했다. Mono/CSC는 Unity 6000.7.0a5 번들, MANAGED는 원본 저장소의 로컬 `.omo/evidence/live-poc-check/player/Janseon_Data/Managed`, OUT은 게시 worktree 밖의 새 임시 디렉터리였다. 절대 기계 경로는 공개하지 않는다.
- Core/Foundation/netstandard SHA256 사전 검사 모두 OK. QA 소비자 컴파일 성공, compile.log 0바이트, 실행 종료 0. 실제 프로브 실행은 **한 번**이며 내부 결정론 검사는 두 시나리오 재실행이다.
- 최종 표식: `PROBE_PASS|assertions=448|domainIntegration=true|pureSnapshot=true|liveUI=false|unityTestsRun=false`.
- 새 전체 콘솔 로그는 줄바꿈 정규화 후 원본 역사적 로그와 동일했다. 새 로그 원시 SHA256: `f2b79270db382da84c964d5fb73de11587f41bc318d1f32c2c0466297e547e02`. 실제 DLL 경로가 들어 있는 새 로그/EXE는 공개하지 않았다. 역사적 JSON 68개 레코드는 재생성하지 않았다.
- 실행 후 세 Managed 파일의 고정 해시도 동일했다. 프로브는 게임 프로젝트나 보존 DLL을 빌드/수정하지 않는다.
- OUT이 게시 폴더 안이면 종료 2, 이미 존재하는 외부 OUT이면 종료 1로 거부됨을 별도 확인했다. 금지 출력 디렉터리는 생성되지 않았다. 이 거부 확인에서는 프로브가 실행되지 않았다.

## 패키지 검사

- 모든 JSON 10개를 전체 파싱했다.
- 보존 로컬 PNG 45개(UI 34 + CUA 11)의 SHA256과 PNG IHDR 치수가 공개 manifest와 일치했다. 파일 내용은 공개하지 않았다. 이는 해시/치수 확인이지 새로운 시각 리뷰가 아니다.
- [원본 대응](publication-provenance.json)에 기록된 원본 22개 SHA256이 그대로 일치했다. StateProbe.cs와 expected-ids.txt는 줄바꿈 정규화 후 원본과 동일하고 expected-ids.json의 material을 독립 SHA256 계산해 두 ID를 확인했다.
- 절대 드라이브/사용자 홈 경로, 개인 사용자명 및 대표 GitHub credential 패턴을 전 파일에서 검색해 검출 0이었다. 이는 무결점 비밀 탐지 보장이 아니라 읽은 자료와 패턴 검사의 결과다.
- Markdown 상대 링크 대상 및 GitHub SHA 고정 source 경로/줄 범위를 로컬 git 객체로 확인했다. 원격 HTTP 접근/권한 확인은 하지 않았다. 미동봉 PNG는 링크가 아닌 로컬 식별자로만 표시했다.
- `bash -n docs/verification/poc-qa-2026-09-05/state/run-probe.sh` 종료 0.
- StateProbe.cs LSP: `No diagnostics found`. 디렉터리 LSP는 Markdown 서버 미구성으로 사용할 수 없었다. C# 실제 컴파일 결과가 별도 확인됐다.
- `git diff --check` 통과. untracked 추가 파일은 별도로 각각 `git diff --no-index --check -- /dev/null <file>`로 공백 오류 출력 없음까지 검사했다. no-index 종료 1은 추가 차이를 뜻하며 오류로 숨기지 않았다.
- 게시 worktree의 기존 tracked 파일 diff는 없고 새 파일은 이 패키지 디렉터리에만 있다. 커밋/푸시/PR/생산 코드 수정은 하지 않았다.

## 수행하지 않은 검증

Unity 빌드/EditMode/PlayMode, 현재 main 게임 실행, 새로운 UI 조작/시각 리뷰, 디스크 저장/재시작, 성능/WebGL은 수행하지 않았다. 이번에 실행 가능한 변경 표면은 외부 QA 소비자와 runner뿐이며 그 컴파일/실행으로 확인했다. 문구 snapshot 테스트는 추가하지 않았다.

## 공개 파일 목록 (26개)

- 루트: README.md, REPORT.md, VALIDATION.md, publication-provenance.json.
- state/: REPORT.md, StateProbe.cs, run-probe.sh, managed-assemblies.sha256, expected-before-probe.md, expected-ids.json, expected-ids.txt, probe-results.json, preservation-verification.json.
- cua/: REPORT.md, action-log.md, focused-manifest.json, cleanup.json.
- live-ui/: REPORT.md, action-log.md, canonical-manifest.json, canonical-manifest.md, independent-visual-review.md, independent-functional-review.md, matrix.json, cleanup.json, hash-verification.json.
