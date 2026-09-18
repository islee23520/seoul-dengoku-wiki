# Unity 무창 배치 작업 가이드

이 문서는 이 저장소와 모든 Git worktree에서 Unity 작업을 수행하는 강제 실행 계약입니다. 목표는 Unity 기능을 포기하는 것이 아니라 **사용자 데스크톱에 Unity Editor 창을 열지 않고**, Unity Technologies의 CLI와 `-batchmode` Editor 프로세스로 동일한 저작·검증 작업을 수행하는 것입니다.

## 절대 규칙

1. `unity open`과 `unicli`를 실행하지 않습니다. `unicli`는 열린 Editor가 필요합니다.
2. 대화형 Unity Editor, GUI Test Runner, 수동 Play Mode, CuaDriver, OS GUI 자동화, uLoop를 사용하지 않습니다.
3. 모든 Editor 프로세스는 `-batchmode`로 전용 background session에서 실행합니다.
4. 같은 worktree의 같은 `Game` 경로에는 Unity 프로세스를 동시에 둘 이상 실행하지 않습니다.
5. scene, prefab, UI Toolkit, `.asset`, build settings는 Editor API로 생성·수정하며 Unity YAML을 손으로 편집하지 않습니다.
6. 모든 실행은 log, 결과 파일, exit code를 남깁니다.

## 실행 선택

- 정적 계약: LSP와 Node/Python gate를 사용합니다.
- 일회성 저작·import: `unity run "$WORKTREE/Game" --editor-version 6000.7.0a5 -- -executeMethod <method> -logFile <path>`.
- 테스트: `unity test "$WORKTREE/Game" --editor-version 6000.7.0a5 --mode EditMode|PlayMode --report-format junit --output <xml> --timeout 600`.
- 빌드: `unity build "$WORKTREE/Game" --editor-version 6000.7.0a5 --target <target> --execute-method <method>`.
- 반복 scene/GUI 작업: Editor binary를 `-batchmode`와 `-projectPath`로 직접 실행하되 `-quit`을 빼고 persistent headless Pipeline worker로 사용한 뒤 `unity list`/`unity command --project-path`로 조작합니다.
- UPM: `Packages/manifest.json`을 손으로 고치지 않고 `UnityEditor.PackageManager.Client.AddAndRemove` Editor script를 direct batch process에서 실행합니다. 비동기 완료 callback이 `EditorApplication.Exit`을 호출합니다.

## GUI와 시각 검증

- UI Toolkit, scene, prefab, hierarchy 작업은 `Assets/**/Editor/`의 idempotent builder, `[CliCommand]`, `-executeMethod`로 수행합니다.
- 시각 검증은 batchmode PlayMode/render command가 고정 seed·resolution·camera로 PNG를 생성하게 합니다. 이때 `-nographics`를 사용하지 않습니다.
- PNG와 scene, commit, Unity version, resolution, seed, tested route를 담은 JSON receipt 및 XML/log를 함께 남깁니다.
- 생성 이미지는 Unity 밖의 이미지 검토 surface에서 확인합니다. Unity 창을 열지 않습니다.
- 문서의 “실제 Editor Play Mode”는 실제 Unity PlayMode를 `-batchmode` Editor 프로세스에서 실행한다는 뜻입니다.

## 종료와 증거

- persistent worker는 시작한 background session id 또는 확인한 PID만 종료합니다. `killall Unity`, `pkill -f Unity`는 금지합니다.
- 완료 보고에는 worktree/Game 경로, 실행 command, exit code 0, XML/log/build 결과, 시각 변경 시 PNG/receipt, focus를 훔친 창이 없었다는 확인, worker 종료 여부를 포함합니다.
