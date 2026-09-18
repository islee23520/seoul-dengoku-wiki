# GAME KNOWLEDGE BASE

## OVERVIEW
Unity project and its serialized runtime contract; score 8, distinct engine/build domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Editor version | `ProjectSettings/ProjectVersion.txt` | Pins `6000.7.0a5`, not a stable 2022 release |
| Package versions | `Packages/manifest.json` | URP 17.7.0, Input System 1.20.0, VContainer 1.19.0 |
| Playable scene order | `ProjectSettings/EditorBuildSettings.asset` | Bootstrap, MainTitle, Foundation |
| Camera/grid contract | `ProjectSettings/GenreContract.json` | Companion constants in `Assets/Janseon/Foundation/GenreContract.cs` |
| Runtime and editor code | `Assets/Janseon/` | See its scoped guidance |
| Unity test assemblies | `Assets/Tests/` | See its scoped guidance |
| Scene authoring/build entry points | `Assets/Janseon/Foundation/Editor/FoundationProjectBuilder.cs` | Batchmode authoring and development-player build |
| Browser-only prototype | `play/model.mjs`, `play/app.js`, `play/Design.md` | Separate vanilla-JS experiment, not Unity runtime authority |
| Headless execution contract | `../TOOL/docs/Unity-Headless-Workflow.md` | Mandatory batchmode-only workflow |
| Unity quality gateway | this file | Procedure, regressions and done-means below |

## CONVENTIONS
- Target `Game/` as the Unity project; Unity asset paths start at `Assets/`, not `GAME/Assets/`.
- Use pinned `6000.7.0a5` batchmode processes in a dedicated background session, one per worktree/project.
- Scene, prefab, asset and serialized-reference edits use Unity APIs / `SerializedObject`, not hand-edited YAML.
- Bootstrap owns the application scope; MainTitle and Foundation are content scenes.
- Build settings keep Bootstrap first, then MainTitle, then Foundation.
- The genre contract uses an orthographic camera: yaw 45, pitch 35.264, no orbit/perspective.
- Movement has four directions; exploration and combat share a grid with 1.5-unit tiles.
- The silhouette contract is 2.5 heads tall, four authored facings, pixel head and mesh body.
- `FoundationProjectBuilder.BuildFoundationScene` regenerates all three scenes and resets their build order.

## COMMANDS
Run from the repository root; `UNITY_EDITOR` denotes the installed pinned Unity executable.
```bash
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/GAME" -runTests -testPlatform EditMode -testResults /tmp/janseon-editmode.xml -logFile /tmp/janseon-editmode.log
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/GAME" -runTests -testPlatform PlayMode -testResults /tmp/janseon-playmode.xml -logFile /tmp/janseon-playmode.log
"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/GAME" -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer
```
- Player output accepts `-buildOutput` or `UNITY_PLAYER_OUTPUT`; the fallback is under repo `.omo/evidence/`.
- The macOS builder requests `BuildOptions.Development` without `AllowDebugging`.
- These are available entry points, not a claim that the current checkout passed Unity validation.
- Run hydration checks in `../TOOL/tools/AGENTS.md` before Unity validation; retain exit codes, logs and XML.
- `Packages/manifest.json` still points Unity Remote at old `../../tools/unity-remote/unity-package`; the checkout is under `TOOL/unity-remote`. Verify package resolution before claiming compile success.

## QUALITY GATEWAY

### Unity work procedure
- Before changing a system, inspect the owning scenes, prefabs, ScriptableObjects and callers.
- Edit scenes, prefabs and serialized references through Unity APIs / `SerializedObject`. If YAML must be touched, verify references separately.
- After C# changes, recompile in `6000.7.0a5` and resolve or explain every new console error and warning.
- Prefer EditMode tests for logic. Use PlayMode when the change depends on frames, physics, input or scene lifetime.
- Play or UI changes require actual batchmode PlayMode reproduction and inspected Game View captures (no `-nographics`), with receipts bound to HEAD and the dirty-source fingerprint.
- If the full suite is too heavy, run the touched slice and state omitted coverage in the result.
- For platform-specific code, check non-target-platform compile guards.

### Core regressions
When the change touches that system, verify the matching items:
- A combat choice yields `BattleRequired`; caller state stays unchanged until it adopts the handoff.
- Battle identity distinguishes handoffs that differ only in party HP.
- Settlement is exact-once; replay or resubmit must not apply twice.
- Unsupported or corrupt saves fail explicitly; never silent recovery.
- Bootstrap is build-index 0 and owns the app VContainer scope; MainTitle then Foundation; content scenes use exclusive child scopes.
- `SceneManager.LoadScene*` runs only through the App scene-loader adapter.
- Runtime has no `FindObject*` / `GameObject.Find` and no mutable static `Instance` / `Current`.
- `Janseon.Core` stays engine-free.
- Genre contract stays locked: yaw 45, pitch 35.264, 1.5-unit tiles, 2.5-head silhouette; JSON and C# move together.
- New runtime UI is uGUI; do not add UI Toolkit surfaces.
- Runtime art slots require Node provenance plus Unity import; `Art/Staging` and quarantine paths are not runtime-reachable.

### Done means
- Requested behavior matches the confirmed scope of the current design.
- Undecided numbers or content were not invented to close the task.
- Reference-game or older draft rules were not mistaken for this game's rules.
- Editor compilation has no errors; every new warning is explained or resolved.
- Relevant automated tests and needed PlayMode / visual verification were performed.
- Scenes, prefabs, asset references and `.meta` files remain intact.
- Save-data and target-platform impacts were reviewed.
- Remaining assumptions, unverified areas and design decisions still needed are stated in the result.

## ANTI-PATTERNS
- Do not launch interactive Editor/Test Runner, `unity open`, manual Play, GUI automation or `unicli`.
- Do not include TRELLIS, quarantine, or StationPropValidation scenes in playable builds.
- Do not replace the development-player builder with a bare build that drops its options.
- Do not enable managed debugging for headless smoke runs: the builder documents debugger-agent stalls.
- Do not change the JSON genre contract independently of its C# constants and contract tests.
