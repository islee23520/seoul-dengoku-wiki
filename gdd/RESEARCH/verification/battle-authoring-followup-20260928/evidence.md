# #281 후속 검증 기록 — 2026-09-28

[문서] [인계 계약](contract.md)을 디렉터의 [PR #307 후속 평가](https://github.com/islee23520/seoul-dengoku/issues/281#issuecomment-5871838293)와 현재 소스에 대조했다. 산출물은 **계약 문서 + 기존 브리지 재검증**이다. 새 개인 판정 구현, 제품 `.asset`, controller 연결, Unity 수용, #281 완료는 아니다.

## 실행 기준과 증거

- source commit: `d9c9f6488a31993930290b6f79bb4115bf483f83`
- branch: `codex/tripothon-battle-authoring`
- 작업 경로: `/Users/CI/Documents/ChatGPT/서울켄시/output/tripothon-game`
- 시작 당시 tracked/untracked 작업 변경 없음. 실행 중 Core/Data/controller/scene/assets와 과거 증거를 수정하지 않았다.
- [run-manifest.json](run-manifest.json): 실행 인자·시각·exit·로그. [source-sha256.json](source-sha256.json): 실제 harness가 소비한 Core/Data와 관련 NUnit/도구의 해시. 두 신규 증거 문서는 이 SHA의 소스를 설명하며 자신을 이 SHA에 이미 포함된 파일이라고 주장하지 않는다.

| 실제 실행 | exit | 결과/증거 | 증명하지 않는 범위 |
|---|---:|---|---|
| `dotnet --version` | 0 | [dotnet-version.log](dotnet-version.log): 10.0.400 | Unity SDK/라이선스 |
| `dotnet run --project RESEARCH/verification/battle-authoring-20260928/BattleHarness.csproj` | 0 | [dotnet.log](dotnet.log): `DOTNET_ENGINE_FREE_CHECKS_PASSED=62` | **62 console check이며 NUnit 테스트 수가 아님**. ScriptableObject wrapper/Unity import는 컴파일 대상 밖 |
| `node TOOL/tools/architecture/check-unity-architecture.mjs` | 0 | [architecture.log](architecture.log): 89 runtime files, 3 scene scopes | 소스 정적 gate. 실제 scene import/runtime/새 전투 규칙 검증 아님 |
| `node TOOL/tools/check-lfs-hydration.mjs` | 1 | [lfs-preflight.json](lfs-preflight.json): 1062 files, 120 pointers, 0 scan errors | 환경 선검증 **실패** |
| `unity editors verify 6000.7.0a5 --format json` | 127* | [unity-editor.log](unity-editor.log): executable 없음 | pinned Editor 검증 불가 |
| `unity modules list 6000.7.0a5 --format json` | 127* | [unity-modules.log](unity-modules.log): executable 없음 | WebGL 모듈 검증 불가 |
| `git submodule status --recursive` | 0 | [submodules.log](submodules.log): GDD/document-renderer 초기화, unity-remote/WIKI `-` 미초기화 | status 조회 성공은 환경 준비 PASS가 아님 |
| GitHub #281 본문·지정 comment read-only 재조회 | 0 / 0 | [issue-281.json](issue-281.json), [director-comment.json](director-comment.json) | 외부 댓글 작성·PR 변경 안 함 |

`127*`는 Python runner가 `FileNotFoundError`를 명시 기록한 값이다. Unity 프로세스가 시작됐다가 exit 127로 종료됐다는 뜻이 아니다. [unity-environment.json](unity-environment.json)은 CLI PATH·`UNITY_EDITOR` 및 세 통상 설치 위치의 읽기 전용 조회다. 모두 사용할 수 없었으며 라이선스는 미확인이다. 전체 파일시스템을 전수 검색하거나 모든 설치 가능성을 부정하지 않는다.

할당된 기존 .NET/소스 architecture gate는 별도 부분 증거로 재실행했다. **LFS 실패 상태에서 Unity compile/test/import/build와 asset 의존 검사는 실행하지 않았다.** 설치·LFS checkout/pull·submodule init·Editor 실행은 없었다.

## 검증 해석과 남은 수용 조건

harness는 이전 `Program.cs`/`BattleHarness.csproj`를 그대로 실행했다. 실제 Core와 repository를 직접 컴파일하며 새 DTO/stub/default를 추가하지 않았다. 26종 malformed case 각각의 오류 및 campaign/ledger 불변, wounded HP, 독립 복사, 명시 Attach 등이 62 console assertion에 포함된다. 원래 `bin/obj` 빌드 산출물은 git-ignore 대상이며 증거 커밋에 넣지 않는다.

문서의 입력 표는 구현 사실·후속 요구·미확정 질문을 분리한다. 특히 기존 한 편 ≤20 제한/roster 지휘관과 새 분대 ≤20/별도 영웅/임시 분대장 간 차이, context에 없는 roster의 authored HP 및 hero HP 투영 공백을 숨기지 않는다. `power/range/morale/cooldown`은 기존 POC 값이며 새 무기/방어구/기술/몸 상태/기분의 fallback이 아니다.

현재 추가 NUnit 18건은 **미실행**이다. #278 준비 성공 후 [계약의 batch 명령과 수용 표](contract.md#5-unity-수용-인계--아직-실행하지-않은-명령)대로 실 Unity XML·log를 남겨야 한다. #298/#299 승인 데이터와 #286 새 Core 계약, #285 실제 조우 통합, #287 신병 결과/정확히 한 번 정산은 계속 미결이다. 이번 문서·증거를 그 완료로 승격하지 않는다.

[document-check.log](document-check.log)은 이 신규 증거 묶음의 JSON 파싱·로컬 링크/소스 해시 일치·기존 로그 결과·스코프·whitespace를 확인한 기록이다. 문장 품질이나 향후 계약의 실행 가능성을 자동 보증하는 CI를 추가한 것은 아니다.
