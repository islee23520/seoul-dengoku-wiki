# Task 09 - production owner-card pointer confirmation

## Outcome

Completed on `feat/unity-html-poc-ui-parity`, starting from `907e4714481ca8ce8926281b4d0f607ec67042d1`.

The existing production path is preserved and now covered through actual EventSystem raycasts:

`GraphicRaycaster -> FoundationBattleViewHost.Point -> FoundationBattleView.SelectUnit/SelectDirection -> OwnerCardTargetingMachine -> fresh BattleSim.PreviewCard -> PocCoreLoopController.SubmitBattleCommand -> BattleSessionDriver.Enqueue -> SubmitCurrentCommands`.

- Only explicit left-clicks inside the active battlefield viewport perform world picking.
- Mobility target selection requires an explicitly chosen cardinal direction before confirmation. Clicking the selected target again confirms.
- Morale target selection goes straight from ChoosingAlly to Confirm with no arrows or Facing requirement.
- Confirm-time validation rejects a destination occupied after direction preview without consuming a command sequence, moving units, or starting recharge.
- Escape uses the existing StandaloneInputModule Cancel mapping independently of selected HUD keyboard focus. Project InputManager maps Cancel to escape.
- The existing 44x44 cancel button is moved at runtime to the viewport's top-right corner, where real UI raycasts reach it. Visibility follows active targeting. It consumes HUD clicks instead of selecting the battlefield behind it.
- Paused driver frames execute zero steps while confirmation still submits immediately.

## Scope and decision

Inspected the controller, machine, battle view/host, driver, presenter/HUD builder/snapshot, scene composition, input/package configuration, related EditMode/PlayMode fixtures, repository rules, plan, and git history/blame.

Two approaches were considered: duplicate selection/confirmation in the presenter/controller, or complete the scene-local pointer adapter while retaining the already landed machine callback. The latter won because todo 7 already removed the South/self shortcut and todo 8 already connected confirmation to that callback. Duplicating this wiring would introduce another command path rather than fix the observed input defects.

No controller, Core, scene, package, sprite binding, HTML POC, or HUD authoring file changed. The parent plan exists in the parent checkout, not this worktree; it was read but not edited. No 32-image capture matrix was run.

## RED evidence

All XML is written by Unity Test Framework / NUnit, never synthesized.

- Initial baseline runs occurred before any production edit. `red-640x480.xml` preserves the real 6-case run: three pass; Escape remains ChoosingDirection, right-click incorrectly reaches Confirm, and the old cancel location is below the visible screen.
- Fixture setup was corrected to await actual Canvas graphic depth instead of an arbitrary presentation frame. Early setup failures are retained locally, not represented as behavioral RED.
- Final `red.xml` reruns unchanged HEAD production with the final tests: 7 total, 3 passed, 4 failed; 20,855 bytes. Production host was temporarily restored from `git show HEAD:<path>` for this run, then the patch restored. Three failures are the task input defects; one is the pre-existing driver lifecycle test described below.
- RED failure examples: Escape exact Idle presentation never occurs; right-click expected ChoosingAlly but was Confirm; cancel raycast point `(123.00, -34.50)` is outside the camera viewport.

## GREEN verification

Unity executable: `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity`.
Every Editor invocation used `-batchmode`; no visible Editor and no concurrent license use.

- `green.xml`: **6 passed, 0 failed**, 13,254 bytes. Filter: `Janseon.Foundation.Tests.OwnerCardPointerPlayModeTests`.
  - Paused mobility moves the ally exactly one cardinal cell, increments sequence once, starts only the selected owner's matching card recharge, preserves other unit cells and all other recharges, and observes a real zero-step paused driver frame.
  - Morale applies its Core-defined effect without direction or arrows.
  - Destination occupied after preview rejects at confirm without movement/recharge/enqueue.
  - Escape after target selection clears targeting and arrows with unchanged battle hash and sequence.
  - Foremost HUD card/cancel raycasts consume input without changing world target/owner.
  - Right-click cannot select or confirm a world target.
- `editmode.xml`: **38 passed, 0 failed**. Filters: OwnerCardTargetingTests, FoundationBattleViewTests, BattleSessionDriverTests, PortraitCommanderCardDockTests, FormationEditScreenTests.
- Asset import and compile: existing batch entry `FoundationProjectBuilder.ImportUiToolkitAssets` recursively calls AssetDatabase.ImportAsset/Refresh. `green-import.log` contains `UI_TOOLKIT_IMPORT_OK`; Unity generated the new test .meta. Successful test/build compilation has no C# errors. UniCli check found its server package absent; no dependency was installed. LSP diagnostics were attempted on both changed C# files but timed out, so Unity compiler output is the available diagnostic verification.
- macOS development player build succeeded via `FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer`: `BUILD_OSX_DEV_OK`, 177,731,134 bytes, Bootstrap/MainTitle/Foundation included. Build is local ignored output under task-09/build; standalone player execution was not performed.
- `git diff --check` passed. Searching PocCoreLoopController for `Facing = South` and `Facing = CardinalDirection.South` finds no matches.

Commands used, with evidence paths rooted in this directory:

```text
Unity -batchmode -quit -projectPath Game -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportUiToolkitAssets -logFile green-import.log
Unity -batchmode -projectPath Game -runTests -testPlatform PlayMode -testFilter Janseon.Foundation.Tests.OwnerCardPointerPlayModeTests -testResults green.xml -logFile green.log
Unity -batchmode -projectPath Game -runTests -testPlatform EditMode -testFilter <five fixtures above> -testResults editmode.xml -logFile editmode.log
Unity -batchmode -quit -projectPath Game -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer -buildOutput <task-09>/build/Janseon.app -logFile build.log
```

## Manual QA and limits

Rendered the real Foundation scene in Editor Play Mode through Camera.Render at 1920x1080 and inspected `pointer-targeting.png`. The battlefield, allied/enemy tokens, direction arrows, target/owner rings, and reachable top-right cancel control are visible. This is one targeted image, not matrix evidence or an assertion of overall UI parity.

Tests drive actual uGUI raycast ordering and event handlers for all card/world actions. Campaign navigation before the battle is fixture setup using existing Button callbacks. Escape is injected at the existing BaseInput boundary, then awaited through real production Update/presentation; physical keyboard input was not manually exercised. No fixed sleeps or timing-luck synchronization are used in the fixture.

## Known baseline failures / risks

- `BattleSessionDriverPlayModeTests.ProductionCoreLoop_DriverOwnsLiveBattleLifecycle_EndToEnd` fails with `Timed out waiting commit edited formation`, line 75. Reproduced with unchanged HEAD production in red.xml and with this patch in related-playmode-failure.xml. It was not removed, skipped, or changed; the six task-09 tests and 38 relevant EditMode tests pass independently. The related suite is NOT claimed fully green.
- The captured scene still has unrelated header/dock text wrapping, placeholder art, and overflowing layout. This change only makes targeting cancel reachable; it is not a visual-parity sign-off.
- The production controller and machine already supplied enqueue and confirm legality. Their absence from this commit is deliberate, not an unimplemented alternate command path.

## Cleanup and delivery

Only FoundationBattleViewHost.cs, new OwnerCardPointerPlayModeTests.cs plus Unity-generated .meta, and selected task-09 evidence are committed. The Editor exited and Game/Temp/UnityLockfile was absent after verification. Test input overrides are restored; scene leases and RenderTextures are released. Build/log/debug artifacts remain ignored locally. No Core modifications, sprite binding, git clean/reset, checkout, push, or external worktree edits.

Requested commit subject: `feat(foundation): wire card confirm to PreviewCard enqueue`.
Footer: `Plan: .omo/plans/unity-html-poc-ui-parity.md`.
