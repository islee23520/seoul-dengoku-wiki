# Task 12 - retarget HUD tests to production chrome

## Outcome

Completed on `feat/unity-html-poc-ui-parity`, starting from `478f057`.

`CoreLoopPlayModeTests` no longer treats `edit-formation` as Deploy. That button only opens the formation-edit rail. Deploy waits on `formation-edit-confirm` (`UiElementNames.FormationEditConfirm`). Card HUD clicks now begin owner-card targeting and confirm through the production machine; they no longer assume one click plays the card.

`UiToolkitCapturePlayModeTests` / `UiToolkitVisualQaDefectTests` do not assert debug SHA or `data-contract-panel` as THE HUD, so they were left in place. `PortraitCommanderCardDockTests` was not edited.

## Scope

- `Game/Assets/Tests/PlayMode/CoreLoopPlayModeTests.cs` only.
- No Core, no Foundation production code, no portrait-dock tests, no git clean/reset, no checkout, no push.

## GREEN verification

Unity executable: `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity`.
Every Editor invocation used `-batchmode`; no visible Editor.

- Import: `import.log` contains `UI_TOOLKIT_IMPORT_OK`.
- `green-playmode.xml`: **23 passed, 0 failed**, 35,618 bytes. Filter: `Janseon.Foundation.Tests.CoreLoopPlayModeTests`. Unity wrote the XML under `Game/.omo/...`; it was copied to this evidence directory.
- No EditMode files changed, so EditMode was not rerun.
- `git diff --check` passed.

Commands:

```text
Unity -batchmode -quit -projectPath Game -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportUiToolkitAssets -logFile .omo/evidence/unity-html-poc-ui-parity/task-12/import.log
Unity -batchmode -projectPath Game -runTests -testPlatform PlayMode -testFilter Janseon.Foundation.Tests.CoreLoopPlayModeTests -testResults .omo/evidence/unity-html-poc-ui-parity/task-12/green-playmode.xml -logFile .omo/evidence/unity-html-poc-ui-parity/task-12/green-playmode.log
```

## Manual QA and limits

No Play Mode screenshot for this task. Batchmode screen is 640x480; the overflowing portrait dock (`edit-formation`, `card-general-use`, `battle-reset`) is off-screen there (todo 11). ApprovedUnityShell therefore opens the editor with the production `onClick` and pointer-clicks `formation-edit-confirm` on the right rail. Off-screen shell clicks fall back to EventSystem `pointerClick` instead of asserting a screen-space raycast hit.

Card apply is confirmed through `OwnerCardTargetingMachine` (SelectTarget / PreviewDirection / Confirm) after the HUD click. That matches production; it is not a world-pointer matrix.

## Known baseline / risks

- `BattleSessionDriverPlayModeTests.ProductionCoreLoop_DriverOwnsLiveBattleLifecycle_EndToEnd` still times out waiting `commit edited formation` because it calls `TriggerEditFormationForTest` and awaits `Deployed`. That fixture was not in this filter, was not deleted, and remains a pre-existing production-test mismatch. This task does not claim the related suite green.
- Capture tests still click `EditFormation` then await `Deployed` in `UiToolkitCapturePlayModeTests`. They were not required as THE HUD and were not retargeted in this surgical pass.
- Overflowing dock layout is unchanged.

## Cleanup and delivery

Editor exited; `Game/Temp/UnityLockfile` was absent after verification. No Core modifications, no git clean/reset, no checkout, no push.
