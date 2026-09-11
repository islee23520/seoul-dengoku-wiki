# Task 07 - Foundation owner-card targeting

Implemented on `feat/unity-html-poc-ui-parity`, based on a5165a5.

## Design and integration

- Added `OwnerCardTargetingMachine`, `CardTargetingStage`, and `CardTargetingContext` in Foundation/UI only.
- Intents: SelectOwner, BeginCard, SelectTarget, PreviewDirection, Confirm, Cancel.
- BeginCard is an intent, not a persistent stage: Idle -> ChoosingAlly. `CardCatalog.Find(id).EffectKey == cardinal_reposition` branches to ChoosingDirection; a legal explicit facing reaches Confirm. `front_damage` and `morale` go directly to Confirm after a valid ally preview, with zero DirectionChoices and nullable Facing unset.
- Stronghold cards require the explicit Stronghold context (the future HUD's stronghold/거점 context); SelectTarget and Confirm call Core PreviewCard, and their commands always have an empty OwnerUnitId, regardless of selected HUD character. Stronghold eligibility/recharge/radius remain Core-owned.
- All previews call BattleSim.PreviewCard without submitting/enqueueing. Confirm constructs a fresh PlayCard at the current tick, previews it again, allocates a sequence only on success, and submits exactly once. A successful Confirm returns to Idle.
- Selecting another valid allied owner cancels targeting, exposes that owner's live Core recharge, and never writes PlayerCommanderId. Invalid owners are rejected without changing the current selection. Pause is not part of the machine and does not gate Confirm.
- Minimal PocCoreLoopController extraction was necessary to make the unchanged RED regression tests pass: its two former immediate-submit handlers now BeginCard. It creates the machine per battle, exposes Targeting, and shares its existing sequence/submission seam. Initial HUD owner defaults to the existing commander; target and facing are never default-selected.
- Chose this extraction over a presenter/HUD rewrite: it removes the proved South/self-target shortcut while respecting the ownership of todos 5/6. No UguiHudBuilder.cs, GameplayPresenter.cs, UiElementNames.cs, Core files, scene assets, or atlas files changed.

## Real RED -> GREEN evidence

Unity executable: `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity`
Project: `/Users/ilseoblee/workspace/seoul-kenshi-wt/unity-poc-mac/Game`
Every Editor invocation checked `Game/Temp/UnityLockfile` using an until-loop with lsof before launch.

- `red.xml`: real NUnit output, 7,521 bytes, total=2, failed=2. Both existing-controller actions expected recharge 0 but observed 600 before confirmation. Assertions were retained for GREEN.
- `green.xml`: real NUnit output, 49,711 bytes, total=58, passed=58, failed=0, skipped=0. First behavioral GREEN run passed without retries. Suites: 16 OwnerCardTargetingTests, 32 RealtimeCardSettlementTests, 10 BattleSessionDriverTests.
- Tests cover all four input facings, non-self ally, exact-one submit, current tick after an actual Core Step, invalid target/radius/owner/direction, no preview mutation, stale occupancy/owner revalidation, cancel, owner recharge restoration, pause, and both stronghold keys including unavailable deployment selection.
- Tests use synchronous deterministic Core/driver execution, not sleeps or polling.
- Both XML files were parsed with Python ElementTree; byte sizes and test-run failed values were asserted. No XML was handwritten.

Commands (paths are absolute in actual invocations):

```sh
Unity -batchmode -nographics -projectPath Game -runTests -testPlatform EditMode \
  -testFilter Janseon.Foundation.Tests.OwnerCardTargetingTests \
  -testResults task-07/red.xml -logFile task-07/red.log

Unity -batchmode -nographics -projectPath Game -runTests -testPlatform EditMode \
  -testFilter 'Janseon.Foundation.Tests.OwnerCardTargetingTests;Janseon.Foundation.Tests.RealtimeCardSettlementTests;Janseon.Foundation.Tests.BattleSessionDriverTests' \
  -testResults task-07/green.xml -logFile task-07/green.log
```

## Build, diagnostics, and manual QA limits

- macOS Development player build succeeded: `BUILD_OSX_DEV_OK`, 177,692,728 bytes, three enabled scenes. See build.log. Used existing FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer and task-local ignored player output.
- Player was executed with -batchmode -nographics -quit. It reached `JANSEON_STARTUP_READY screen=MainTitle` (player-smoke.log) but did not exit within the 60-second process timeout. subprocess.run terminated it. This is NOT a clean-exit smoke pass and NOT interactive targeting QA.
- Interactive pointer/arrow/Confirm QA was not performed. Only the two existing card handlers are delegated here; the HUD owners must connect the remaining intents and refresh the machine's state. DirectionChoices is the tested presentation contract, not a claim that rendered arrows have been wired.
- LSP was attempted for every changed C# file. New machine and tests returned no diagnostics. Controller LSP returned stale CS0246 for OwnerCardTargetingMachine at lines 55/328, even after Unity generated a csproj containing the new file. Unity's real compiler successfully compiled all changed files for tests and the player; no compiler error suppression was introduced.
- Existing unrelated CS0618/CS8321 warnings and missing main-title emoji glyph warnings remain visible in logs, unchanged.
- Initial RED launch was blocked by an uninitialized required tools/unity-remote submodule. Initialized it at the repository-pinned 86b0c856823946e7bf1e56279cdd83de69a9bf1d; no package manifest or submodule pointer changes. A missing Composition namespace import in the new test was corrected before capturing the real RED. Initial launch logs remain local.

## Cleanup and residual integration risks

- No Mac main checkout/writes, no git clean, no Core edits, no atlas copies.
- Only scoped source/meta and task-07 evidence files are included in the commit. Build/player output remains ignored and local for inspection.
- No task-owned Unity Editor/player process remains after verification; existing Unity Hub/licensing processes were not killed.
- Legacy PlayMode tests assuming immediate card play may require migration when the HUD targeting controls are connected; this task did not claim a full PlayMode suite pass.
- The plan file named in the required commit footer is not present in this worktree snapshot; the supplied task specification was the implementation contract.

Plan: .omo/plans/unity-html-poc-ui-parity.md
