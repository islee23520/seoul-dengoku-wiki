# WORKTREE EXECUTION RULES

이 worktree의 모든 Unity 작업은 `docs/Unity-Headless-Workflow.md`를 먼저 읽고 따릅니다.

- `unity open`, `unicli`, 대화형 Unity Editor, GUI Test Runner, 수동 Play Mode, uLoop, CuaDriver/OS GUI 자동화를 금지합니다.
- 모든 Unity Editor 프로세스는 `-batchmode`로 전용 background session에서 실행합니다.
- `unity run`, `unity test`, `unity build`를 우선하고, GUI/scene/prefab/UI 작업은 Editor script, `[CliCommand]`, `-executeMethod`로 수행합니다.
- 시각 증거는 batchmode PlayMode/render가 PNG와 receipt를 생성하게 하고 Unity 밖에서 검토합니다.
- 같은 worktree의 `Game` 경로에 Unity 프로세스를 둘 이상 실행하지 않으며, 종료는 해당 session id/PID만 대상으로 합니다.

`Concept.md`와 `ToDo.md`의 “실제 Editor Play Mode”는 이 저장소에서 interactive Editor가 아니라 실제 Unity PlayMode를 `-batchmode`로 실행한다는 뜻입니다.
