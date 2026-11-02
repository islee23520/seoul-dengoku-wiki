> Historical evidence for `6f07a94996a1f416cec1a44a3b3844dfb732900f`, not validation of publication base `3a52612`. Machine paths are normalized. PNGs and raw diagnostics named below are retained locally, **not bundled or downloadable links**. See [publication scope](../README.md).

# Independent expectations recorded before execution

Target: 6f07a94996a1f416cec1a44a3b3844dfb732900f. Production remains read-only. Probe compiles an external console consumer against the retained player's Janseon.Core.dll; an additional pure GameplayUiSnapshot call may reference Janseon.Foundation.dll. No UI/controller/native Unity execution is claimed.

Expected values are literal arithmetic and transition counts independently derived from inspected public rules, not loaded production constants or copied test assertions. IDs for noncombat are independently SHA256-derived by Python before the C# probe executes.

## Consecutive campaign scenario
Seed 90421, campaign poc-core-loop, home Yeongdeungpo, resources 100, reputation 0, tick/events 0. Each successful campaign transition adds exactly 1 tick and 1 campaign event; ChooseCombat only returns a context and has no mutation; attaching it adds 1. Battle commands only add battle ticks/events. Settlement adds 1 campaign tick/event regardless of battle length. Return resets location to home, not resources or reputation. Departure clears encounter-local fields but preserves campaign ID, seed, resources, reputation, RNG cursor and campaign ledger. Probe keeps the same ledger/book reference throughout (CampaignState itself is intentionally replaced by clones).

1. Depart -> Sindorim -> encounter -> resolution -> negotiate: tick/events 5, resources/reputation still 100/0, pending -5/+3, choice locked. Settlement: 95/3, tick/events 6; duplicate: identical receipt with all hashes/counts/numbers unchanged. Return: home, 95/3, tick/events 7.
2. Next depart: 95/3, tick/events 8; all encounter-local markers empty/reset. Replay previous result now: old receipt, zero mutation. Travel -> face -> resolution -> bypass: tick/events 12, pending -2/-1, totals still 95/3. Settlement: 93/2, tick/events 13; return: 93/2, tick/events 14. Result IDs differ from expedition 1.
3. Depart -> travel -> face -> resolution: tick/events 18. Context owns campaign poc-core-loop, Sindorim, tick 18, seed 90421, resources 93, reputation 2. Attach: 19. Open: ally-0 and foe-0 both HP 10/AP 3 at (1,2)/(3,2), 5x5, battle tick 0. Ongoing FromBattle yields None and Apply rejects InvalidResult without mutation. Script uses real legal ranged attacks: allow each side one hit (both HP 7), then only ally attacks while foe ends turns. Three more ranged hits reduce foe 7->4->1->0; player remains 7. Total five attacks; turn/end-command count depends on deterministic initiative, measured not pre-assumed. Victory settlement: 103/7, tick/events 20, battle cleared, location still Sindorim. Duplicate and same-battle/different-result conflict have zero mutation. Return: 103/7, tick/events 21.
4. Next expedition resolution: tick/events 25. Fresh combat opens both units 10/3, not surviving ally HP 7 from previous battle. Attach: tick/events 26. Reverse controlled ranged strategy: both take one hit, then only foe attacks, ally HP 0, foe HP 7, EnemyVictory. Settlement: 88/2, tick/events 27, return 28. Next departure: 88/2, tick/events 29. Earlier receipts remain queryable in the same book and old exact-result retry cannot reward twice.
5. Fresh CampaignApi.Start with the SAME id/seed returns initial 100/0, tick 0 and initial RNG, demonstrating CampaignId alone cannot prove session identity. This is not a process-restart/save execution.

## Rejection, replay and visibility checks
- Invalid Yeongdeungpo->Guro direct travel after departure: typed TravelRejected, same hash, tick and ledger count.
- A second Depart during travel: typed WrongStage, zero campaign mutation.
- Identical replay of the full controlled sequence: same campaign/ledger hashes, result IDs and receipts.
- Snapshot at BaseReady has ShowDepartAction true; settled snapshot has ShowReturnAction true, ShowSettleAction false; terminal combat snapshot has ShowSettleAction true.
- Resources/reputation have no snapshot properties/bindings; result id and receipt prefix are represented in machine-readable SettlementOutcomeCode. Their numeric consequences cannot be proven by those labels.

## Characterization of trusted API boundaries (NOT live UI exploit assertions)
Code inspection predicts AttachPendingBattle accepts a legitimate context generated for another campaign because it checks stage/choice, not CampaignId/context reconstruction. Noncombat SettlementApi.Apply accepts a fresh legitimate bypass payload from another campaign while the receiver is locked to negotiate because it checks noncombat shape/stage but not matching choice/result provenance. Probe will record actual result types and mutations separately from ordinary path pass criteria. Current controller always obtains context/result from its own state; these are caller-trust limitations, not evidence of wrong UI handoff.

## Test scope
Existing CoreLoopPlayModeTests are inspected, NOT RUN: they require the Unity project and native scene/input surface reserved for the CUA lane; each RunBranchAsync rebuilds Bootstrap/Foundation and does not assert two consecutive expeditions in one session. Existing EditMode consumer tests also write artifacts outside this task's authorized directory. External synchronous probe avoids both conflicts and fixed sleeps; it is executable domain-integration evidence, not a replacement PlayMode pass.
