# JANSEON IMPLEMENTATION KNOWLEDGE BASE

## OVERVIEW
Production domains, Unity composition, and art import boundary; score 8, distinct implementation domain.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Typed IDs, RNG, replay primitives | `Core/DeterministicCore.cs` | `CoreApi`, `PurposeRng`, request index and ledger |
| Travel graph | `Core/RouteDomain.cs` | `RouteApi`, station identifiers and traversal |
| Campaign stages | `Core/CampaignDomain.cs` | `CampaignApi`, encounter choices and battle handoff |
| Realtime formation/card combat | `Core/Battle/` | `BattleSim`, tick commands, cards, terrain-aware arena state |
| Exact-once settlement | `Core/SettlementDomain.cs` | `SettlementApi`, result IDs and receipts |
| Screen transitions | `Foundation/AppFlow/` | State machine, coordinator, loader/lease interfaces |
| DI and scene lifetime | `Foundation/Composition/` | App scope, content scopes, Unity loader |
| Session-to-core bridge | `Foundation/UI/PocCoreLoopController.cs` | Scoped campaign, battle, ledgers, settlement book |
| UXML and USS | `Foundation/UI/Screens/`, `Foundation/UI/Styles/` | MainTitle and Gameplay documents |
| UI event/render wiring | `Foundation/UI/Presenters/` | Presenters and MonoBehaviour hosts |
| Stable UI selectors | `Foundation/UI/UiElementNames.cs` | Machine names, not user-visible copy |
| Reviewed runtime references | `Foundation/Art/RuntimeSlotCatalog.cs` | Injectable catalog, not candidate-path lookup |
| Slot import and wiring | `Foundation/Editor/RuntimeSlotPromoter.cs`, `RuntimeSlotCatalogBuilder.cs` | Node preflight plus actual Unity imports |
| Source vs imported art | `ArtSource/`, `Art/` | Raw authoring evidence vs imported assets; neither name alone grants approval |

## CONVENTIONS
- `Core/Core.asmdef` defines `Janseon.Core` with `noEngineReferences: true` and no assembly dependencies.
- `Foundation/Janseon.Foundation.asmdef` depends on Core, VContainer, and VContainer.Unity.
- Editor-only Foundation tooling has a separate assembly under `Foundation/Editor/`.
- Domain files group related IDs, commands, state, rejections, and API classes rather than one type per file.
- `PurposeRng` partitions xorshift32 cursors by purpose; `Peek` leaves the next draw unchanged.
- RNG fingerprints sort cursor keys and use invariant numeric formatting.
- `ApplicationFlowCoordinator` returns a stored outcome for an already committed destination.
- Content leases expose readiness and asynchronous cleanup; transitions distinguish cancellation from failure.
- `PocCoreLoopController` publishes `StateChanged` and `CommandRejected` and unwires presenter events on disposal.
- UI resolution selectors use `jk-res-720` / `jk-res-1080`; stable IDs are centralized in `UiElementNames`.
- Runtime slot wiring invokes repo `tools/art/export-runtime-slots.mjs` in batchmode and resolves imported Unity objects.
- Promotion invokes `tools/art/runtime-slot-promotion.mjs` for prepare/commit and verifies source hashes before writes.
- Promotion copies reviewed files, remaps animation references, and deletes newly created assets if import/commit fails.
- `RuntimeSlotPromoter.Run` reads `JANSEON_SLOT_PROMOTION_REQUEST`; non-fixture promotion rewires the catalog.

## ANTI-PATTERNS
- Do not add UnityEngine dependencies to Core or static/SceneManager state to the scoped core-loop controller.
- Do not embed ArtSource, ArtCandidates, quarantine, or provider-specific asset paths in runtime scripts.
- Do not treat provider eligibility as asset provenance; approval is enforced by the Node-backed import boundary.
- Do not bypass Unity import with a catalog entry pointing at missing or unreviewed objects.
- Do not let animation clips retain candidate sprite references after runtime promotion.
- Do not load unreviewed UI candidates through Resources; editor showcase imports are not runtime approval.
