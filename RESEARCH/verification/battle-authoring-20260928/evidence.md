# #281 authored BattleSetup verification — 2026-09-28

[문서] Scoped implementation and engine-free execution are verified. This is **not Unity acceptance, scenario approval, scene integration, or issue completion**. No production balance, squad, enemy, equipment, or approved scenario was fabricated.

Baseline: `84920d8c418d0f8e2bbc474b83d4a9ca0c397728`; branch at execution: `codex/tripothon-battle-authoring`. The five changed C# source hashes are recorded in [source-sha256.json](source-sha256.json). The actual Core files compile from the repository, not a copied simulation. Live #281, #298 and #278 issue bodies/comments were read on 2026-09-28; #298 approved input was absent.

## Director compatibility boundary — decisions 13 and 14

[문서] Latest authority read: owner [PR #306](https://github.com/islee23520/seoul-dengoku/pull/306), pinned [Intent.md at `5a98964518f0e7110e91ba37e7e9590135be21c1`](https://github.com/islee23520/seoul-dengoku/blob/5a98964518f0e7110e91ba37e7e9590135be21c1/Intent.md), decisions 13 and 14 dated 2026-09-28. The local source snapshot is `research/2026-09-28/tripothon/sources/intent-5a989645.md` in the parent workspace. This pin identifies the reviewed source, not a claim that PR #306 is merged.

Decision 13 supersedes Total War-style battle command with Norland-style per-person resolution. Weapons, armor, relative combat skill, bodily condition and mood affect each person's attack; automatic and manual battle must share resolution rules. Pre-engagement squad orders, melee command lock, battle-wide retreat and persistent individual consequences belong to that target. This bridge does **not** implement or verify those rules, automatic/manual equivalence, or new adjudication thresholds.

Decision 14 supersedes simultaneous strategic turns, turn time limits, per-turn movement budgets and turn-stepped world time with movement while campaign world time flows. It preserves the strategic command lock on a battling squad until settlement. This bridge adds **no** campaign clock, route movement integration, speed or distance rules. Its existing Tick and ledger assertions verify only the current POC handoff/attachment API; unchanged Tick on attachment is not evidence of the new campaign time model or an endorsement of superseded turn budgets.

Issue #281 still asks this slice to consume the current `BattleContext`/`BattleSim.Open`/`CampaignApi.AttachPendingBattle` contracts. Accordingly, this implementation is a **compatibility draft against baseline 84920d8c**, not delivery of decisions 13/14. Its soldier/hero separation and explicit authored data remain useful seams, but schema fields and 62 checks cannot certify the eventual owner contracts. Before integration or production registration, revalidate the authoring schema, participant identity/HP and condition projection, setup/open validation, command/settlement boundaries and tests against the owner's revised Core contracts. Approved scenario input and actual Unity acceptance remain required. No C# or owner implementation lane was changed for this compatibility note.

## Portable reproduction

Run from the repository root with .NET SDK 10.0 (executed with 10.0.400):

```sh
dotnet run --project RESEARCH/verification/battle-authoring-20260928/BattleHarness.csproj
node TOOL/tools/architecture/check-unity-architecture.mjs
node TOOL/tools/check-lfs-hydration.mjs
git diff --check
```

The copied harness was rerun from this repository: **exit 0, 62 checks passed**. [dotnet.log](dotnet.log) records its output (identical to the original local run). Its project uses only repository-relative source paths and has no package references. `bin/` and `obj/` are ignored. No project dependency, NUnit replacement or Unity stub was installed.

The harness compiles `GAME/Assets/Janseon/Core/**/*.cs`, `BattleSetupDefinition.cs` and `BattleSetupRepository.cs`. It exercises real `BattleSim.Open`, `CampaignApi.Apply`, `CampaignApi.AttachPendingBattle`, and actual campaign/ledger hashes. Its 62 console assertions include 26 malformed-input cases followed by nonmutation checks, catalog identity/missing cases, preserved wounded HP, independent source/return snapshots and explicit successful attachment. **62 console checks are not 62 NUnit tests.**

[architecture.log](architecture.log): exit 0, 89 runtime files and 3 scene scopes verified. `git diff --check`: exit 0. [lfs-preflight.json](lfs-preflight.json): exit 1, 1062 scanned, **120 LFS pointers**, zero scanning errors. The failed hydration prerequisite was respected; Unity was not launched.

## Source and API scope

- `Data/Authoring/BattleSetupDefinition.cs`: serializable rules/navigation/participant/hero/retreat/objective definition without product defaults.
- `Data/Authoring/BattleSetupDefinitionAsset.cs`: ScriptableObject wrapper; no product `.asset` instance.
- `Data/Repositories/BattleSetupRepository.cs`: copies injected definitions; `Create(stableId, context)` resolves fresh setup objects and calls existing `BattleSim.Open` validation before returning.
- `RealtimeBattleSimTests.cs`: 17 new NUnit cases; existing fixture receives the explicit synthetic hero its current Core contract requires.
- `CampaignLoopTests.cs`: one new NUnit case for validation before attachment, preserved wounds and immutable rejected state.

The three new C# files include source `.meta` files. Core, BattleSim, controllers and scenes remain unchanged. Existing `BattlefieldDefinitionAsset` expresses a 2D grid rather than the current explicit 3D `NavPath`; this work does not invent conversion semantics. No reinforcing telegraphs are authored in this minimal schema. Empty retreat arrays explicitly mean no retreat anchors; null arrays reject.

## Owner integration handoff

After approved scenario authoring/import, inject `BattleSetupDefinitionAsset.definition` values into `new BattleSetupRepository(definitions)`. Obtain the unchanged `BattleRequired.Context`, then call `repository.Create(approvedSetupId, required.Context)`. On an argument error, do not attach or append ledger events. Open the valid setup through the owner-controlled driver, then adopt `CampaignApi.AttachPendingBattle` only after setup/open succeeds. There is no fallback catalog or asset-path lookup.

The exact immutable context is retained. Every context participant must exist in the authored soldier roster with matching maximum HP; handoff current HP takes precedence to preserve wounds. Participants absent from the context use their explicit authored HP, as allowed by the existing BattleContext contract. Optional heroes are authored separately. Encounter-to-setup selection remains caller-owned and requires approval; the repository does not infer scenario authority.

## Unexecuted Unity acceptance

[미확인] Unity 6000.7.0a5 is unavailable locally and LFS preflight fails. ScriptableObject import/serialization, compilation/execution of **18 added NUnit cases**, full EditMode suite/XML, PlayMode, scene binding and WebGL were not run. No Unity RED-to-GREEN claim is made.

On an authorized environment restore submodules/LFS, verify Editor + WebGL support and license, and require the hydration checker to exit 0 before continuing:

```sh
unity editors verify 6000.7.0a5 --format json
unity modules list 6000.7.0a5 --format json
node TOOL/tools/check-lfs-hydration.mjs
mkdir -p .omo/evidence/tripothon-battle-authoring
```

Then run a single background Editor for this `GAME` path, from repository root. `UNITY_EDITOR` must refer to the verified binary; no GUI launch:

```sh
"$UNITY_EDITOR" -batchmode -projectPath "$PWD/GAME" -runTests -testPlatform EditMode -testFilter 'Janseon.Foundation.Tests.RealtimeBattleSimTests;Janseon.Tests.EditMode.CampaignLoopTests' -testResults "$PWD/.omo/evidence/tripothon-battle-authoring/editmode.xml" -logFile "$PWD/.omo/evidence/tripothon-battle-authoring/editmode.log"
```

Require process exit 0, XML executed >0 and failed 0; inspect compiler errors/warnings and bind evidence to source commit/dirty hashes. Broader baseline and controller integration remain owner work. Approved #298 squad/HP/enemy/equipment/stance data, navigation/retreat/objective IDs and encounter mapping are still required before product registration. #281 full acceptance remains pending those gates and real Unity verification.
