# manualQa - task 13

## surfaceEvidence

| scenario id | criterion reference | surface | exact invocation | verdict | artifactRefs |
|---|---|---|---|---|---|
| T13-HAPPY | Task 13 Happy QA | Unity Test Runner PlayMode, serialized catalog and actual prefab instances | `Unity -batchmode -projectPath GAME -runTests -testPlatform PlayMode -assemblyNames Janseon.Foundation.PlayModeTests -testFilter Janseon.Foundation.Tests.Full3dBattleVisualTests.TemporaryHeroAndSoldierMeshesAreDistinct -testResults .../green/task-13-happy.xml -logFile .../green/task-13-happy.log` | PASS: exact case present, failed=0, skipped=0; four unique enum entries resolve distinct prefabs, hero/soldier and melee/ranged hierarchy differs, root Collider and MeshRenderers exist, selection and five poses are observable. | A1, A4 |
| T13-FAILURE | Task 13 Failure QA | Unity Test Runner PlayMode, catalog provenance/dependencies/runtime source | `Unity -batchmode -projectPath GAME -runTests -testPlatform PlayMode -assemblyNames Janseon.Foundation.PlayModeTests -testFilter Janseon.Foundation.Tests.Full3dBattleVisualTests.OddlandAndSpineAreNotBattleCombatants -testResults .../green/task-13-failure.xml -logFile .../green/task-13-failure.log` | PASS: exact case present, failed=0, skipped=0; provenance is exact, dependency paths exclude Oddland/Spine/character, runtime catalog has no AssetDatabase, Resources path search, or CreatePrimitive. | A2, A4 |
| T13-RENDER | Task 13 render evidence | Unity PlayMode Game View render at 1280x720 from actual catalog prefabs | `TASK13_CAPTURE_PATH=.../render/task-13-game-view-1280x720.png Unity -batchmode -projectPath GAME -runTests -testPlatform PlayMode -assemblyNames Janseon.Foundation.PlayModeTests -testFilter Janseon.Foundation.Tests.Full3dBattleVisualTests.CatalogPrefabsRenderInGameView1280x720 ...` | PASS: exact render case failed=0/skipped=0. Image inspection shows four prefab rows; taller crested heroes, smaller soldiers, bows/quivers versus melee weapons, green selected rings, blue alive, orange hit/wounded, and dark fallen dead states. Magenta error pixels=0. | A3, A5, A6 |
| T13-BUILDER | Task 13 Work/catalog generation | Unity Editor API asset generation | `Unity -batchmode -nographics -quit -projectPath GAME -executeMethod Janseon.Foundation.Editor.TemporaryBattleVisualCatalogBuilder.BuildFromCommandLine` | PASS: exit 0 and `TEMPORARY_BATTLE_VISUAL_CATALOG_OK`; `-nographics/-quit` used only for Editor asset generation, never PlayMode/render. | A7 |

## adversarialCases

| scenario id | criterion reference | adversarial class | expected behavior | verdict | artifactRefs |
|---|---|---|---|---|---|
| T13-A1 | Failure QA | prohibited asset dependency | Any Oddland, Spine, or character dependency fails. | PASS: dependency traversal found none. | A2 |
| T13-A2 | Failure QA | runtime path/editor lookup | Runtime catalog must use serialized references only. | PASS: source assertions reject AssetDatabase and Resources.Load. | A2 |
| T13-A3 | Failure QA | unbounded primitive creation | Runtime instantiation must clone serialized prefabs, not call CreatePrimitive. | PASS: runtime source assertion and exact case pass. | A2 |
| T13-A4 | provenance | accidental final-art promotion | Source/use must be `unity-generated-blockout` / `temporary-gameplay-mesh`. | PASS. | A2, A6 |
| T13-A5 | render integrity | shader-error magenta | Magenta error pixels absent or near-zero; state colors form nontrivial clusters. | PASS: magenta=0; alive blue=53400, wounded orange=16145, dead dark=3221, selected green=5161. | A5 |
| T13-A6 | scratch cleanup | generated test scene contamination | No `InitTestScene*.unity` or meta remains. | PASS: cleanup search returned no paths. | A8 |

## artifactRefs

| id | kind | description | path |
|---|---|---|---|
| A1 | NUnit XML | Strengthened happy case, exact test name, failed=0 skipped=0 | `evidence/layered-full3d-16x9/task-13/green/task-13-happy.xml` |
| A2 | NUnit XML | Exact failure/adversarial case, failed=0 skipped=0 | `evidence/layered-full3d-16x9/task-13/green/task-13-failure.xml` |
| A3 | NUnit XML | Exact render case, failed=0 skipped=0 | `evidence/layered-full3d-16x9/task-13/green/task-13-render.xml` |
| A4 | logs | Unity PlayMode invocation and execution logs | `evidence/layered-full3d-16x9/task-13/green/` |
| A5 | PNG | Inspected real 1280x720 catalog-prefab render | `evidence/layered-full3d-16x9/task-13/render/task-13-game-view-1280x720.png` |
| A6 | receipt | Feature HEAD, source fingerprint, Unity version, scene, resolution, seed, PNG SHA, visual facts | `evidence/layered-full3d-16x9/task-13/render/receipt.txt` |
| A7 | builder log | Post-feature-commit exit 0 and success sentinel | `evidence/layered-full3d-16x9/task-13/post-commit-builder.log` |
| A8 | cleanup receipt | No Unity/Test Runner process and no scratch scene | `evidence/layered-full3d-16x9/task-13/cleanup.json` |
| A9 | RED XMLs | Pre-implementation failures for both exact required cases | `evidence/layered-full3d-16x9/task-13/red/` |
