# SEOUL-KENSHI WORKTREE UNITY EXECUTION RULES

이 디렉터리 아래의 현재 및 향후 모든 `seoul-kenshi` Git worktree에 적용합니다.

## 강제 실행 계약

- Unity 작업 전에 해당 worktree의 `docs/Unity-Headless-Workflow.md`를 읽습니다. 문서가 아직 없는 새 worktree에서는 `/Users/ilseoblee/workspace/seoul-kenshi/docs/Unity-Headless-Workflow.md`를 기준으로 사용합니다.
- `unity open`, `unicli`, 대화형 Unity Editor, GUI Test Runner, 수동 Play Mode, uLoop, CuaDriver/OS GUI 자동화를 금지합니다.
- 모든 Unity Editor 프로세스는 `-batchmode`로 전용 background session에서 실행합니다.
- 일회성 작업은 Unity Technologies CLI의 `unity run`, `unity test`, `unity build`를 우선합니다.
- 비시각 일회성 작업의 기본 명령은 `unity run "$WORKTREE/Game" --editor-version 6000.7.0a5 -- -nographics -executeMethod <fully-qualified-static-method> -logFile -`입니다. `unity <version> <project>` shorthand는 GUI를 열 수 있으므로 금지합니다.
- 반복 scene/GUI 작업은 pinned Editor binary를 `-batchmode`로 상주시킨 persistent headless Pipeline worker와 `unity list`/`unity command --project-path`로 처리합니다. 이 worker에는 `-quit`을 넣지 않습니다.
- GUI, UI Toolkit, scene, prefab, hierarchy, import, build settings, screenshot 작업은 idempotent Editor script, `[CliCommand]`, `-executeMethod`로 수행합니다. Unity YAML을 손으로 편집하지 않습니다.
- 시각 검증은 batchmode PlayMode/render가 PNG, JSON receipt, XML/log를 생성하게 하고 Unity 밖에서 검토합니다. 시각 캡처 실행에는 `-nographics`를 사용하지 않습니다.
- 같은 worktree의 같은 `Game` 경로에는 Unity 프로세스를 동시에 둘 이상 실행하지 않습니다. 병렬 Unity 실행은 서로 다른 worktree를 사용합니다.
- persistent worker는 시작한 background session id 또는 확인한 PID만 종료합니다. `killall Unity`와 `pkill -f Unity`를 금지합니다.
- “실제 Editor Play Mode”는 실제 Unity runtime의 PlayMode를 `-batchmode` Editor 프로세스에서 실행한다는 뜻이며 interactive Editor를 허용하지 않습니다.

## 완료 증거

Unity 작업 완료 보고에는 worktree/Game 절대 경로, 실행 command, exit code 0, 결과 XML/log/build artifact, 시각 변경 시 PNG/receipt, visible Unity window/focus change 없음, worker 종료 여부를 포함합니다.
