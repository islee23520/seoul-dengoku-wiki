# manualQa

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| PS-01 | Exact Unity EditMode `PerSoldierBattleTests` suite is GREEN | Unity 6000.7.0a5 EditMode Test Runner | `/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity -batchmode -projectPath /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32/GAME -runTests -testPlatform EditMode -assemblyNames Janseon.Foundation.EditModeTests -testFilter Janseon.Foundation.Tests.PerSoldierBattleTests -testResults /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32/evidence/layered-full3d-16x9/task-32/final-green-10/per-soldier.xml -logFile /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32/evidence/layered-full3d-16x9/task-32/final-green-10/per-soldier.log` | PASS - 8/8, failed 0, skipped 0, exit 0 | ART-01, ART-02, ART-03 |
| PS-02 | Root fixes are present in owned contracts/simulation and acceptance fixture | Source diff | `git -C /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32 diff -- GAME/Assets/Janseon/Core/Battle/Contracts/BattleContracts.cs GAME/Assets/Janseon/Core/Battle/Sim/BattleSim.cs GAME/Assets/Janseon/Core/Battle/Sim/BattleSimState.cs GAME/Assets/Tests/EditMode/PerSoldierBattleTests.cs` | PASS | ART-04, ART-05 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| ADV-01 | Soldier roster capacity | Boundary overflow | 21st soldier is rejected before mutation/state creation. | PASS | ART-01 |
| ADV-02 | Soldier identity integrity | Duplicate identifier | Duplicate nonempty `SoldierId` across the roster is rejected. | PASS | ART-01 |
| ADV-03 | Explicit hero authoring | Missing/implicit entity fallback | Authored hero is separate from 20-soldier roster and populated from explicit hero data, not a soldier fallback. | PASS | ART-01, ART-04 |
| ADV-04 | AI interval/path movement | Non-cardinal scheduled movement | AI remains still before the interval, then moves partially along the authored diagonal path with matching facing and no teleport. | PASS | ART-01 |
| ADV-05 | Continuous collision spacing | Crowded radii overlap | Stable bounded XZ resolution maintains at least combined-radius squared distance 1,440,000 while movement remains bounded. | PASS | ART-01 |
| ADV-06 | Invalid navigation command atomicity | Rejected malformed/off-nav path | Invalid path is rejected without changing fingerprint or ledger. | PASS | ART-01 |
| ADV-07 | Determinism | Same state/delta/commands replay | Replays produce identical fingerprints and expected partial movement. | PASS | ART-01 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| ART-01 | NUnit XML | Authoritative Unity result: 8 total, 8 passed, 0 failed, 0 skipped. | `evidence/layered-full3d-16x9/task-32/final-green-10/per-soldier.xml` |
| ART-02 | Unity log | Full Unity EditMode invocation and execution log. | `evidence/layered-full3d-16x9/task-32/final-green-10/per-soldier.log` |
| ART-03 | Exit code | Unity process exit code `0`. | `evidence/layered-full3d-16x9/task-32/final-green-10/exitcode.txt` |
| ART-04 | Source diff | Owned contract/state/simulation/test fixture changes used by the GREEN run. | `evidence/layered-full3d-16x9/task-32/final-green-10/source-diff.txt` |
| ART-05 | Root-cause matrix | Failure-by-failure diagnosis, fix, and test mapping. | `evidence/layered-full3d-16x9/task-32/final-green-10/root-cause-fix-matrix.md` |
| ART-06 | Process check | Post-run check for a Unity process still owning this project. | `evidence/layered-full3d-16x9/task-32/final-green-10/postrun-processes.txt` |
