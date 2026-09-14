# RTFC Phase C delivery receipt

Recorded at `2026-09-08T07:24:59Z` for branch `rtfc/phase-c` in `/Users/ilseoblee/workspace/seoul-kenshi-wt/rtfc-phase-c`.

## Git identity and base state

- Inspected implementation/evidence HEAD: `e77b45a8a7d0c258cc7187f796b8f18225214805` (`fix(core): 카드 실효과·정산 전제 복구(RTFC Phase C)`).
- Fetched `origin` successfully. Current `origin/main`: `6c6396bf6304728812e900a67ee0f489533a9308`.
- Merge-base: `aef3bd8410cb827fcab9f5563f29efbc3bc400ac`.
- Divergence after fetch: `origin/main` has 32 commits absent from the branch; the branch has 3 commits absent from `origin/main`.
- No rebase or merge was attempted. `git merge-tree --write-tree origin/main HEAD` exited 1 and reported conflicts in:
  - `Game/Assets/Janseon/Core/BattleDomain.cs` (modify/delete)
  - `Game/Assets/Janseon/Core/SettlementDomain.cs` (content)
  - `Game/Assets/Janseon/Foundation/UI/PocCoreLoopController.cs` (content)
  - `Game/Assets/Janseon/Foundation/UI/RuntimeSlotView.cs` (modify/delete)
  - `Game/Assets/Janseon/Foundation/UI/Screens/Gameplay.uxml` (modify/delete)
  - `Game/Assets/Tests/AGENTS.md.meta` (add/add)
  - `Game/Assets/Tests/EditMode/BattleSrpgTests.cs` (modify/delete)
  - `Game/Assets/Tests/EditMode/SettlementExactOnceTests.cs` (modify/delete)
  - `Game/Assets/Tests/EditMode/UiToolkitScreenTests.cs` (content)
  - `Game/Assets/Tests/EditMode/UiToolkitVisualQaDefectTests.cs` (content)
  - `Game/Assets/Tests/PlayMode/CoreLoopPlayModeTests.cs` (content)
  - `Game/Assets/Tests/PlayMode/UiToolkitCapturePlayModeTests.cs` (content)
- Therefore the tested branch is not currently mergeable into the fetched `origin/main`; conflict reconciliation remains lead-owned work.
- Unrelated untracked files were preserved and excluded: `Game/Assets/Janseon/AGENTS.md.meta` and `Game/Assets/Janseon/ArtCandidates/UI.meta`.

## Immutable committed evidence

The following files were parsed from beginning to end. They and the exercising source files were unchanged against the inspected HEAD (`git diff --quiet HEAD -- ...` exited 0).

| Evidence | XML attributes and actual parsed cases | Exit file | Terminal result line | SHA-256 |
| --- | --- | --- | --- | --- |
| `docs/verification/ulw-execute/rtfc/phase-c/simple-repair/final-editmode.xml` | `total=132`, `passed=130`, `failed=2`, `skipped=0`; 132 actual `<test-case>` elements and 2 failed cases | `final-editmode.exit`: 2 | `Test run completed. Exiting with code 2 (Failed). One or more tests failed.` | `75644b5094d3a41b653b5932522d99d41cf5be8116a38f3ab3be7439f89a6b39` |
| `docs/verification/ulw-execute/rtfc/phase-c/simple-repair/post-tick-focused.xml` | `total=32`, `passed=32`, `failed=0`, `skipped=0`; 32 actual `<test-case>` elements and 0 failed cases | `post-tick-focused.exit`: 0 | `Test run completed. Exiting with code 0 (Ok). Run completed.` | `a351698a9bda023aedfacdd975782f95f990cafcc57ebca8d3808fbd58f03386` |
| `docs/verification/ulw-execute/rtfc/phase-c/simple-repair/post-tick-roundtrip.xml` | `total=1`, `passed=1`, `failed=0`, `skipped=0`; 1 actual `<test-case>` element and 0 failed cases | `post-tick-roundtrip.exit`: 0 | `Test run completed. Exiting with code 0 (Ok). Run completed.` | `3a96b0ad4499282187a6ea27ad26a90cb6880308d140d6cfaceac7358d4a2859` |

The two full EditMode failures remain non-green and are not waived:

1. `Janseon.Foundation.Tests.RuntimeAssetProvenanceTests.PlayableScenes_DoNotReferenceQuarantineOrTrellisAssets`: `real provenance gate must accept every scene dependency`, expected true but was false.
2. `Janseon.Foundation.Tests.UiToolkitVisualQaDefectTests.CaptureReceipts_RequireIsPlayingTrue_Roots_State_Head`: `exactly 10 receipts required`, expected 10 but was 0.

`final-editmode-failures.txt` names the same two failures. The first belongs to the existing runtime asset-provenance gate. The second requires 10 external capture receipts, but the evidence directory resolved with 0 receipts during this run.

## What the focused evidence exercises

- `GuardShieldwall_ReducesActualReceivedDamageByThreeFor150Ticks_ThenExpires` applies the card to a real 5-damage strike, verifies damage falls to 2 and floors at 0, advances 150 simulation ticks, then verifies the same strike returns to 5 damage after expiry.
- `PincerFocus_AddsOneActualOutgoingDamageFor150Ticks_ThenExpires` verifies a real outgoing strike rises from 4 to 5, advances 150 simulation ticks, then verifies damage returns to 4 after expiry.
- `CombatSettlement_NoPendingBattle_RejectsWithoutStateLedgerOrBookMutation` removes `PendingBattle`, submits a terminal combat result, requires `SettlementRejectReason.NoPendingBattle`, and verifies campaign hash, ledger count, and settlement-book indexes do not mutate.
- `CombatSettlement_OngoingBattleResult_IsRejectedWithoutMutation` rejects a non-terminal battle result before settlement conversion.
- `CampaignBattleCardSettlementDuplicateReturn_RoundTripTranscript` uses the public Core campaign API to depart, travel, face an encounter, enter resolution, attach the issued pending battle, open the real-time battle, select and play `passage-retreat`, tick recharge from 750 to 749, reach `PlayerRetreat`, settle, prove duplicate receipt equality with zero mutation, and complete the return to `BaseReady` at the home base.
- The committed roundtrip transcript records matching receipt hashes: `36d9f6466a49ffe8ac2ad6c026a9b0918846412fe5f3c647cad16a0c7e597bc8` for first and duplicate application.

Exercising source SHA-256 values:

- `Game/Assets/Tests/EditMode/RealtimeCardSettlementTests.cs`: `7a5280d4cc259ad2acb83a81b51f3d5c8491624f09be0a8a2c5e0438ffc2c5d1`
- `Game/Assets/Janseon/Core/Battle/Sim/BattleSim.cs`: `3118b6df17febb3c5630c8d885a9ee31b65cfa23a80280d0d4a6d7c089060c25`
- `Game/Assets/Janseon/Core/Battle/Sim/CombatRules.cs`: `a79482fdbb8f13c8426c5aa2b7a14dbf3a62a79ed0284bc1903cd2182ddcbf72`
- `Game/Assets/Janseon/Core/SettlementDomain.cs`: `76251ca2678946f6d34d1a42bb2517fba2d9dab9ab6a074a4a6ff94870712e44`

This is deterministic Core/EditMode evidence. It is not Unity UI, PlayMode, visual, or player-input proof.

## Fresh delivery checks

Diagnostics were requested once before the command gates. The configured diagnostics service reported that no language server is available for Markdown (`.md`), so no Markdown LSP result exists.

The following commands were then run once in the exact worktree, with their real exit codes captured without pipeline masking:

| Command | Result |
| --- | --- |
| `node tools/architecture/check-unity-architecture.mjs` | exit 0; `unity architecture gate passed (52 runtime files, 3 scene scopes verified)` |
| `npm --prefix tools test` | exit 0; 37 passed, 0 failed; wiki build and Unity architecture wiki contracts passed |
| `git diff --check` | exit 0 |

Unity was not rerun. The committed exercising source and evidence matched the inspected HEAD, so another Unity process would duplicate the existing runs rather than resolve a mismatch.

## Known delivery limitations

- Full EditMode remains red at 130/132 for the two exact failures above.
- `CardCatalog.All()` currently contains 5 cards. The Phase C plan calls for 6–8, so the catalog remains short by at least 1 card; this is an explicit pending count gap, not a pass. No card was invented during delivery preparation.
- The fetched base advanced by 32 commits and the synthetic merge reports the 12 conflict paths listed above. The branch is not currently mergeable without reconciliation.
- No UI/PlayMode claim is made from the focused Core/EditMode evidence.
- No worktree cleanup, branch deletion, product edit, rebase, merge, or Unity rerun was performed.
