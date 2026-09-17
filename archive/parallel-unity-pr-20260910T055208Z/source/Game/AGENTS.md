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
| Scene authoring/build entry points | `Assets/Janseon/Foundation/Editor/FoundationProjectBuilder.cs` | Also exposes Janseon editor menu actions |

## CONVENTIONS
- Open `Game/` as the Unity project; Unity asset paths start at `Assets/`, not `Game/Assets/`.
- Bootstrap owns the application scope; MainTitle and Foundation are content scenes.
- Build settings keep Bootstrap first, then MainTitle, then Foundation.
- The genre contract uses an orthographic camera: yaw 45, pitch 35.264, no orbit/perspective.
- Movement has four directions; exploration and combat share a grid with 1.5-unit tiles.
- The silhouette contract is 2.5 heads tall, four authored facings, pixel head and mesh body.
- `Janseon/Play Bootstrap` opens the startup scene before entering Play Mode.
- `Janseon/Build Foundation Scene` regenerates all three scenes and resets their build order.

## COMMANDS
Run from the repository root; `UNITY_EDITOR` denotes the installed pinned Unity executable.
```bash
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform EditMode -testResults /tmp/janseon-editmode.xml
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/Game" -runTests -testPlatform PlayMode -testResults /tmp/janseon-playmode.xml
"$UNITY_EDITOR" -batchmode -quit -projectPath "$PWD/Game" -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer
```
- Player output accepts `-buildOutput` or `UNITY_PLAYER_OUTPUT`; the fallback is under repo `.omo/evidence/`.
- The macOS builder requests `BuildOptions.Development` without `AllowDebugging`.
- These are available entry points, not a claim that the current checkout passed Unity validation.

## ANTI-PATTERNS
- Do not include TRELLIS, quarantine, or StationPropValidation scenes in playable builds.
- Do not replace the development-player builder with a bare build that drops its options.
- Do not enable managed debugging for headless smoke runs: the builder documents debugger-agent stalls.
- Do not change the JSON genre contract independently of its C# constants and contract tests.
