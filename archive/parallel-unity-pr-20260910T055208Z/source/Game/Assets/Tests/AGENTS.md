# UNITY TEST KNOWLEDGE BASE

## OVERVIEW
EditMode contracts and real-scene PlayMode evidence; score 8, distinct validation domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| RNG/replay invariants | `EditMode/CoreDeterminismTests.cs` | Seeded core behavior |
| Route and campaign behavior | `EditMode/RouteTraversalTests.cs`, `CampaignLoopTests.cs` | Typed travel and stage transitions |
| Battle handoff | `EditMode/BattleSrpgTests.cs` | Large deterministic SRPG fixture |
| Settlement retries/conflicts | `EditMode/SettlementExactOnceTests.cs` | Receipts and exact-once effects |
| Transition rejection/retry | `EditMode/ApplicationFlowTests.cs` | Recording scene-loader seams |
| UI structure and regressions | `EditMode/UiToolkitScreenTests.cs`, `UiToolkitVisualQaDefectTests.cs` | Selectors, UXML/USS, resolution contracts |
| Scene and asset provenance | `EditMode/RuntimeAssetProvenanceTests.cs` | Real Node gate and Unity dependency checks |
| Runtime slot contracts | `EditMode/RuntimeSlotBindingTests.cs`, `RuntimeSlotPromotionTests.cs` | Reviewed asset binding and promotion |
| Candidate imports | `EditMode/UiCandidateImportTests.cs`, `PocUiKitShowcaseImportRenderTests.cs` | Editor-only showcase import contracts |
| Actual scene ownership | `PlayMode/FoundationSceneFlowTests.cs` | Bootstrap/content scopes, cancellation, disposal |
| Gameplay integration | `PlayMode/CoreLoopPlayModeTests.cs` | Presenter actions through the live scoped session |
| Capture matrix | `PlayMode/UiToolkitCapturePlayModeTests.cs` | PNGs plus machine-readable provenance receipts |
| Candidate rendering | `PlayMode/UiCandidateRenderPlayModeTests.cs` | Imported showcase rendering evidence |

## CONVENTIONS
- Both asmdefs use `Janseon.Foundation.Tests`, `UNITY_INCLUDE_TESTS`, and `TestAssemblies`.
- EditMode references Foundation/Core and is restricted to Editor; PlayMode also references VContainer assemblies.
- Many fixtures map to numbered design todos; inspect the current assertion rather than treating a RED-era comment as current status.
- Tests use NUnit; coroutine fixtures use Unity Test Framework attributes where the engine surface requires them.
- Presenter `BindForTest` / `Trigger*ForTest` seams exercise machine actions without physical input.
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
