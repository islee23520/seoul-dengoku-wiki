> Historical evidence for `6f07a94996a1f416cec1a44a3b3844dfb732900f`, not validation of publication base `3a52612`. Machine paths are normalized. PNGs and raw diagnostics named below are retained locally, **not bundled or downloadable links**. See [publication scope](../README.md).

# Real POC QA completed: functional flow PASS, visual completeness FAIL

The retained merged build was exercised through real visible controls after the
user unlocked Windows. Title -> departure -> travel -> encounter -> resolution
-> settlement -> return works for combat, negotiation and bypass in observed
runs. All 13 required states have exact 1280x720 and 1920x1080 client captures.
Eight additional images cover noncombat applied-settlement/return variants.

**Not an unqualified visual PASS.** Character/title/icon/environment art slots
explicitly display art-blocked placeholders. Battle/settlement presentation
omits important context. No production fixes were made.

## Review entry points

Evidence: `.omo/evidence/live-poc-check-unlocked/`.

- canonical-manifest.json: 34 canonical image records, repository-relative local locators, SHA256,
  dimensions, timestamp, source SHA, action/transition mapping.
- canonical-manifest.md: concise 17-row paired-viewport index.
- action-log.md: actual inputs/results and failed initial attempts.
- native-actions.jsonl: UTC, PID, HWND, coordinates, dimensions, capture receipts.
- matrix.json: all 26 required cells captured, branch variants, separate verdicts.
- hash-verification.json: all 194 retained output hashes unchanged.
- player-720.log, player-second.log, console-errors.txt: diagnostics.
- cleanup.json, player-first-close.json, cua-session-end.json: teardown.
- troubleshooting/: early failed input/focus evidence, NOT canonical gameplay.
  Early base-named images there still show title. Two desktop context images
  contain unrelated desktop UI and are excluded from the review packet.

## Source/build binding

SHA `6f07a94996a1f416cec1a44a3b3844dfb732900f`, detached worktree
`<tested-checkout>`. Retained executable:
`.omo/evidence/live-poc-check/player/Janseon.exe`.

Prior build provenance: ../live-poc-check/provenance.json, build-process.json,
build-result.json and build-windows.log. Unity 6000.7.0a5 (a15235a53881), Windows64,
exit 0, build GUID 2c2981ca64f54a6a889a8de9b126bfa7. This run reverified 194 output
hashes, zero mismatches, no rebuild. Effective Development BuildOptions bit
remains unverified; only prior requested flag is known.

Fresh session/doctor inspected once: current agent session 1 equals active
console session 1 for the active user; Default input desktop accessible, foreground HWND
nonzero. No session mismatch/transfer/sign-in/credential action. UIA enumeration
still reports timeout, but native capture and OS input work. The prior locked
desktop blocker no longer applies.

## Execution and capture rigor

Two owned launches: PID 889956 combat; PID 849268 negotiation then bypass.
Initial background CUA input was unverifiable and unchanged. Scoped foreground
input failed activation until CUA bring_to_front confirmed exact target HWND.
Start then opened BasePreparation. Subsequent inputs were real OS mouse events,
with exact foreground HWND checked before game clicks. No presenter hooks or
direct game-state writes.

Every canonical image was opened by the executing agent. Exact client dimensions
come from GetClientRect and PrintWindow(client/full content), not resizing capped
CUA screenshots. Native window resize changes the live game viewport; after
captures verify the resulting layout.

Coverage qualification: **live-resized runs, not two independent full replays per
branch**. Start/travel/encounter executed at each size across two launches; battle
commands used both sizes; settlement/return actions used both across branches.
Every required state and branch result/return captured at both sizes. Unexposed
victory/defeat or noncombat outcome variants are not claimed. No fixed sleeps
or foreground polling loops were used.

## Observed findings

1. **Art completeness FAIL.** Title art is explicitly blocked. Footer identifies
   blocked icons, floor/wall/platform, explorer, medic and patrol. Battle cells
   show explorer/patrol art-blocked text rather than characters. Actual rendered
   content, not a capture defect. Visible small 3D props and colored primitives
   do not validate blocked runtime slots.
2. **Battle active-unit clarity FAIL (presentation).** HUD labels only battle,
   HP and AP while values follow the active unit. At 33/35 and 47, HUD differs
   from ally values in the adjacent log without identifying whose turn/HP is
   displayed. GameplayUiSnapshot.FillBattle lines 240-260 confirm reading
   battle.ActiveUnit. Not an arithmetic bug claim; missing active-unit identity.
3. **Settlement information incomplete.** Combat pending says combat settlement
   without visible victory/defeat. Applied panels expose opaque result IDs rather
   than rewards/costs. Negotiation/bypass identify branch/application ID but not
   detailed outcome. Apply and Return controls work.
4. **Station preview clipping.** Sindorim captures 19/68 show colored marker at
   upper right cut by preview top edge. At Guro actor marker is not visible in
   preview. Station selection works; do not infer actor visibility from highlight.

Korean title/stages/choices/combat/settlement/return text is readable in canonical
images. No tofu or control-label clipping observed there. No mockup baseline
supplied, so no fabricated pixel-fidelity comparison was run.

## Console and matrix

Both logs: `d3d12: failed to query info queue interface (0x80004002)`.
Both logs also repeatedly report broken `IDXGISwapChain::GetFrameStatistics`
timestamps and fallback to CPU-side timing. This is not a performance PASS.
No managed exception, command-rejection or crash found in the two gameplay logs.
Earlier locked-run FMOD warnings did not recur. Not a warning-free console claim.

| Gate | Result |
|---|---|
| Agent session equals active user console / usable desktop | PASS |
| SHA/build hash binding | PASS |
| Title/start/departure/travel/encounter/choices | PASS - visible transitions |
| Combat to settlement and return | PASS - visible transitions |
| Negotiation settlement and return | PASS - visible transitions |
| Bypass settlement and return | PASS - visible transitions |
| Required states at both exact viewport sizes | PASS - 26/26 |
| Runtime art visual completeness | FAIL - blocked placeholders |
| Battle/settlement clarity | FAIL - presentation findings |
| Independent complete replay per branch per size | NOT RUN - live resize coverage |
| WebGL/browser | NOT RUN - native Windows surface chosen |
| Owned runtime cleanup | PASS |

The original matrix predates independent review. Completed reviews below supersede its historical `independentReview: Lead pending` field, retained rather than backdated.

## Completed independent review

Both independent reviewers directly opened all 34 canonical PNGs. Functional
review also checked eight supplementary captures and input receipts. Verdict:
demonstrated UI transitions PASS; visual completeness and information clarity
FAIL. Not a reward-calculation, persistence, performance or WebGL PASS.

Additional finding: combat pending-settlement images 49/51 retain Resolution
highlight while negotiation/bypass pending panels highlight Settlement. Missing
active-unit identity is confirmed; source behavior was not independently audited.
Start receipt 14 calls its effect unverifiable; image 15 supports the resulting
BasePreparation transition. Cleanup establishes exited processes, not exit code 0.
See independent-visual-review.md and independent-functional-review.md.

## Cleanup and scope

Both owned player PIDs exited; cleanup.json has empty ownedPlayersRemaining.
Named CUA session ended. Existing daemon PID 122360 and user processes preserved.
Retained build/worktree and prior evidence intact. No production edits, rebuild,
git writes/commits/merges, terms acceptance or external posts. Only QA artifacts
written under this evidence root. All applicable canonical captures delivered.
