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
| Headless execution contract | `../Tool/docs/Unity-Headless-Workflow.md` | Mandatory batchmode-only workflow |
| Windows Unity quality gateway | `E:\git\minimoo\OneMoreShelter-PC\AGENTS.md` | Completion bar below; not Janseon gameplay rules |

## CONVENTIONS
- Target `Game/` as the Unity project; Unity asset paths start at `Assets/`, not `Game/Assets/`.
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
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode -testResults /tmp/janseon-editmode.xml -logFile /tmp/janseon-editmode.log
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform PlayMode -testResults /tmp/janseon-playmode.xml -logFile /tmp/janseon-playmode.log
"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/Game" -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer
```
- Player output accepts `-buildOutput` or `UNITY_PLAYER_OUTPUT`; the fallback is under repo `.omo/evidence/`.
- The macOS builder requests `BuildOptions.Development` without `AllowDebugging`.
- These are available entry points, not a claim that the current checkout passed Unity validation.
- Run hydration checks in `../Tool/tools/AGENTS.md` before Unity validation; retain exit codes, logs and XML.
- `Packages/manifest.json` still points Unity Remote at old `../../tools/unity-remote/unity-package`; the checkout is under `Tool/unity-remote`. Verify package resolution before claiming compile success.

## QUALITY GATEWAY
User path: `E:\git\minimoo\one-more-shelter`.
Observed 2026-09-14 checkout: `E:\git\minimoo\OneMoreShelter-PC` on `desktop-bo514et` (`ssh desktop`).
Authoritative guidance: `E:\git\minimoo\OneMoreShelter-PC\AGENTS.md` and `E:\git\minimoo\OneMoreShelter-PC\Packages\com.minimumstudio.minimoo\AGENTS.md`.
Use its Unity work bar, adapted to this repo's pinned editor and batchmode-only contract:
> - Requested behavior matches the confirmed scope of the current design.
> - Undecided numbers or content have not been unnecessarily fixed.
> - Legacy predecessor rules have not been mistaken for this game's rules.
> - Editor compilation has no errors; every new warning is explained or resolved.
> - Relevant automated tests and necessary PlayMode/visual verification were performed.
> - Scenes, prefabs, asset references and `.meta` files remain intact.
> - Save-data and target-platform impacts were reviewed.
> - Remaining assumptions, unverified areas and decisions needing design input are stated in the result.

- Inspect the owning scenes, prefabs, ScriptableObjects and callers before changing a system.
- Recompile in `6000.7.0a5`; run touched-system EditMode tests, then PlayMode tests where applicable.
- Play or UI changes require actual batchmode PlayMode reproduction and inspected captured Game View evidence, not only static tests.
- Preserve graphics for captures (no `-nographics`); retain source-bound receipts and state omitted coverage.
- Check non-target-platform compilation guards for platform-specific code.
- Transfer quality procedures only: OneMoreShelter's zombies, shelter loop and regression rules are not Janseon design.

## ANTI-PATTERNS
- Do not launch interactive Editor/Test Runner, `unity open`, manual Play, GUI automation or `unicli`.
- Do not include TRELLIS, quarantine, or StationPropValidation scenes in playable builds.
- Do not replace the development-player builder with a bare build that drops its options.
- Do not enable managed debugging for headless smoke runs: the builder documents debugger-agent stalls.
- Do not change the JSON genre contract independently of its C# constants and contract tests.
