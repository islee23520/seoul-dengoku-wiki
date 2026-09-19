# UNITY TEST KNOWLEDGE BASE

## OVERVIEW
EditMode contracts and real-scene PlayMode evidence; score 9, distinct validation domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| RNG/replay invariants | `EditMode/CoreDeterminismTests.cs` | Seeded core behavior |
| Route and campaign behavior | `EditMode/RouteTraversalTests.cs`, `CampaignLoopTests.cs` | Typed travel and stage transitions |
| Realtime battle and handoff | `EditMode/RealtimeBattleSimTests.cs`, `EditMode/BattleSessionDriverTests.cs` | Tick simulation and driver lifecycle |
| Cards and settlement | `EditMode/RealtimeCardSettlementTests.cs` | Deterministic combat and settlement regression cases |
| Catalog validation and identity | `EditMode/Area1*Tests.cs` | Projection, authoring, fingerprint and content contracts |
| Transition rejection/retry | `EditMode/ApplicationFlowTests.cs` | Recording scene-loader seams |
| Genre contract lock | `EditMode/GenreContractTests.cs` | Retired isometric/grid/SD keys absent; `realtime-formation-card` enforced |
| Strategy-map core | `EditMode/StrategyMapCatalogTests.cs`, `SeoulWorldGraphTests.cs`, `HeightmapTests.cs`, `SMapSchematicTests.cs` | Grid, Seoul graph, heightmap, schematic catalogs |
| Strategy-map presentation | `EditMode/StrategyMapPresenterTests.cs`, `PlaceholderVoxelLayoutTests.cs` | Presenter contracts and voxel layout |
| Battle view and pointer | `EditMode/FoundationBattleViewTests.cs`, `PlayMode/FoundationBattleViewPlayModeTests.cs`, `PlayMode/BattleSessionDriverPlayModeTests.cs`, `PlayMode/OwnerCardPointerPlayModeTests.cs` | View lifecycle, driver integration, pointer input |
| Gameplay UI additions | `EditMode/DynamicTravelUiTests.cs`, `FormationEditScreenTests.cs`, `OwnerCardTargetingTests.cs`, `PortraitCommanderCardDockTests.cs`, `Task23DeployPanelTests.cs` | Travel UI, formation edit, targeting, dock, deploy panel |
| Area1 runtime bindings | `PlayMode/Area1VContainerBindingTests.cs`, `Area1DataRepositoryPlayModeTests.cs`, `Area1VisionCaptureTests.cs` | Container wiring, repositories, vision capture |
| UI structure and regressions | `EditMode/UguiScreenTests.cs`, `UguiVisualQaDefectTests.cs` | Canvas, `UiElementNames`, capture receipts |
| Actual scene ownership | `PlayMode/FoundationSceneFlowTests.cs` | Bootstrap/content scopes, cancellation, disposal |
| Gameplay integration | `PlayMode/CoreLoopPlayModeTests.cs` | Presenter actions through the live scoped session |
| Capture matrix | `PlayMode/UguiCapturePlayModeTests.cs`, `StrategyMapCapturePlayModeTests.cs` | PNGs plus machine-readable provenance receipts |

## CONVENTIONS
- Assemblies are `Janseon.Foundation.EditModeTests` and `Janseon.Foundation.PlayModeTests`, both with `UNITY_INCLUDE_TESTS` and `TestAssemblies`.
- EditMode namespaces are mixed: most fixtures use `Janseon.Foundation.Tests`; six older ones (CampaignLoop, CoreDeterminism, DynamicTravelUi, RouteTraversal, SeoulWorldGraph, Task23DeployPanel) use `Janseon.Tests.EditMode`. Match the file you extend.
- Both assemblies reference Foundation, Core, Data, TMP and VContainer; EditMode additionally references Data.Editor and is Editor-only.
- Many fixtures map to numbered design todos; inspect the current assertion rather than treating a RED-era comment as current status.
- Tests use NUnit; coroutine fixtures use Unity Test Framework attributes where the engine surface requires them.
- Presenter `BindForTest` / `Trigger*ForTest` seams exercise machine actions without physical input.
- `PlayMode/UguiKeyboardPlayModeHelper.cs` is the shared keyboard-input seam for PlayMode UI tests.
- Subscribe to scene-loaded/unloaded or readiness signals before triggering the operation; bound waits with a timeout.
- Scene-flow integration asserts one app scope, one content scope, and disposal of the previous screen.
- Capture fixtures require actual Play Mode and write evidence under repository `.omo/evidence/`.
- Receipts bind captures to git HEAD, a source-only dirty-tree fingerprint, image hashes, and scene state.
- `Foundation/UI/UiSourceFingerprint.cs` in the sibling Janseon tree excludes `.omo/` outputs and temporary Test Runner scenes.

## ANTI-PATTERNS
- Do not substitute an empty scene for a Bootstrap-to-content integration or screenshot fixture.
- Do not make synchronization depend on fixed sleeps or guessed frame counts; await the exact state/event.
- Do not pin user-visible prose; assert machine selectors, parsed receipt fields, and domain state.
- Do not fake provenance approval by mocking away the actual Node audit exercised by provenance tests.
- Do not reuse stale screenshots after source edits: capture receipts must match the current source fingerprint.
- Do not confuse EditMode import success with a successful PlayMode render or runtime scene binding.
