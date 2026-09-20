# Task 32 root-cause/fix matrix

| Immutable RED failure | Root cause | Root fix | GREEN evidence |
|---|---|---|---|
| Hero array length was 0 with 20 soldiers | `BattleSim.Open` never constructed hero state, and `BattleSetup` had only an id rather than authored hero state data. | Added explicit `HeroDefinition` fields to `BattleSetup`; `CreateHeroes` validates matching explicit ids and authored HP/position/facing, keeping heroes separate from soldier rosters. Updated the fixture to author the player hero explicitly. | `Open_AllowsTwentySoldiers_AndKeepsHeroSeparateFromSoldierRoster` passed in `per-soldier.xml`. |
| Duplicate `SoldierId` was accepted | Roster validation only checked `UnitId` uniqueness inside each side. | `SoldierId` is now required, and `ValidateUniqueSoldierIds` enforces uniqueness across both complete rosters before state creation. | `Open_RejectsDuplicateSoldierId` passed in `per-soldier.xml`. |
| 21st soldier was accepted | No side/squad roster ceiling was validated. | `ValidateRoster` rejects a side over 20 before state creation and also bounds each authored squad at 20. | `Open_RejectsTwentyFirstSoldier` passed in `per-soldier.xml`. |
| Enemy AI stayed at `0,0,0` after its decision interval | AI commands were stamped with the historical decision timestamp, then rejected against the already advanced simulation time. | AI decisions retain authored interval scheduling but commands are submitted at current simulation time, allowing the validated non-cardinal authored path to become the active move order without teleporting. | `Step_UsesAiIntervalAndNonCardinalPath_AndResolvesMoraleAndOutcome` passed in `per-soldier.xml`. |
| Crowded squared distance was 562500 instead of at least 1440000 | Movement had no continuous soldier-radius separation phase. | Added deterministic id-sorted, bounded-pass XZ separation using the sum of authored radii and navigation-segment legality checks. | `SubmitAndStep_CrowdedMovementDoesNotTeleportOrOverlapSoldierRadii` passed in `per-soldier.xml`. |

## Exact verification

`/Applications/Unity/Hub/Editor/6000.7.0a5/Unity.app/Contents/MacOS/Unity -batchmode -projectPath /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32/GAME -runTests -testPlatform EditMode -assemblyNames Janseon.Foundation.EditModeTests -testFilter Janseon.Foundation.Tests.PerSoldierBattleTests -testResults /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32/evidence/layered-full3d-16x9/task-32/final-green-10/per-soldier.xml -logFile /Volumes/gameWorkspace/worktrees/seoul-kenshi/layered-full3d-16x9-wave3-task32/evidence/layered-full3d-16x9/task-32/final-green-10/per-soldier.log`

Result: total 8, passed 8, failed 0, skipped 0; process exit code 0.
