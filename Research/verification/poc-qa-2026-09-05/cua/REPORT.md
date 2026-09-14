> Historical evidence for `6f07a94996a1f416cec1a44a3b3844dfb732900f`, not validation of publication base `3a52612`. Machine paths are normalized. PNGs and raw diagnostics named below are retained locally, **not bundled or downloadable links**. See [publication scope](../README.md).

# Consecutive gameplay CUA audit: visible continuity demonstrated, state consequences unverifiable

Evidence root: `.omo/evidence/gameplay-continuity/cua/`.
Retained source binding: `6f07a94996a1f416cec1a44a3b3844dfb732900f`.

Two successive expeditions were exercised through visible mouse controls in one
Windows player process: negotiation at Sindorim -> apply -> return to
Yeongdeungpo -> depart again -> bypass at Sindorim -> apply -> return.
This proves the observed consecutive UI flow, **not connected economic or party
state correctness**. No reward arithmetic is inferred from result IDs.

## Runtime and method

- Executable: `.omo/evidence/live-poc-check/player/Janseon.exe`.
- Owned PID `913372`, HWND `42271050`, process start
  `2026-09-05T18:33:49.5345674Z`, Windows session 1, unchanged across all receipts.
- Fresh desktop check: agent session 1 = active console session 1, accessible
  input desktop `Default`, nonzero foreground window. `desktop-check.json`.
  `inputDesktopError=203` is a stale last-error value after a successful nonzero
  handle/name call, not a failed desktop-open result.
- All 194 retained output hashes match prior provenance: `hash-verification.json`.
- One exact 1280x720 client sequence, not a viewport matrix. Native OS cursor and
  mouse down/up, exact foreground HWND guard; Escape via Windows SendKeys.
  Captures use GetClientRect/PrintWindow(client, full content), not resized images.
- Every named after-image cited below was opened by the executing agent.
  Immediate action images are supplemental, not automatic transition proof.
- `native.ps1` is a QA-local derivative of the previous successful-run script.
  No presenter hooks, reflection, game-state injection, or debug-memory mutation.
  No Unity editor/project opening, builds, source edits, git mutations, or restart.

## Focused evidence index

Names below identify local-only images in the original evidence root. Published
`focused-manifest.json` supplies repository-relative local locators, SHA256 and dimensions; no PNG is bundled.

| Before -> actual input -> after | What the UI actually demonstrates |
|---|---|
| `09-current-after-activation.png` -> travel/encounter/enter -> `15-expedition1-choices.png` | Expedition at home -> Sindorim, three choices available |
| `15-expedition1-choices.png` -> negotiate -> `17-negotiation-pending.png` | Negotiation-specific pending settlement |
| `17-negotiation-pending.png` -> apply -> `19-negotiation-applied.png` | Applied negotiation result `result-27c2f047751fa155`; Apply replaced by Return |
| `19-negotiation-applied.png` -> Return -> `21-return1-before-next.png` | Yeongdeungpo selected, Return phase, Depart available |
| `21-return1-before-next.png` -> Depart -> `23-expedition2-home.png` | Next expedition in the same PID/start time; home selected, no prior result panel |
| `23-expedition2-home.png` -> travel/encounter/enter -> `29-expedition2-choices.png` | Same station and same three choices remain available after negotiation |
| `29-expedition2-choices.png` -> bypass -> `31-bypass-pending.png` | Different branch explicitly identified as bypass settlement |
| `31-bypass-pending.png` -> apply -> `33-bypass-applied.png` | Applied bypass result `result-cfa4fb80954e47f0`, distinct from first result |
| `33-bypass-applied.png` -> Return -> `35-return2-before-menu-check.png` | Home selected again; Depart available |
| `35-return2-before-menu-check.png` -> Escape -> `37-escape-menu-after.png` | No visible pause/save/restart menu appeared |

## Visible values and consequence limits

| Audit item | Verdict and evidence |
|---|---|
| Consecutive play without process restart | DEMONSTRATED: IDs/start time and sequence above |
| Same underlying campaign object/ID | UNVERIFIABLE FROM UI: campaign identity is not displayed; process continuity alone does not prove object continuity |
| Selected station across return/departure | DEMONSTRATED: Sindorim -> Yeongdeungpo -> Sindorim -> Yeongdeungpo |
| Branch/result presentation | DEMONSTRATED: negotiation and bypass pending/applied labels, distinct exact IDs |
| Resource totals and before/after costs/rewards | UNVERIFIABLE FROM UI: no numeric resource totals or deltas displayed before choice, after apply, at return, or next departure |
| Reputation and world consequences | UNVERIFIABLE FROM UI: no numeric reputation, faction disposition, or world-change panel displayed |
| Party health/damage carryover | UNVERIFIABLE FROM UI: no party condition values displayed in this noncombat sequence; combat not exercised on this lane |
| Reward arithmetic | UNVERIFIABLE FROM UI: opaque result IDs are not amounts or evidence of arithmetic |
| Duplicate settlement safety | UNVERIFIABLE FROM UI: Apply disappears after use; repeated domain settlement was not invoked or proved safe |
| Negotiation changes later choice availability | No visible change at the same station: all three choices still present in image 29. Hidden modifiers remain unverifiable |
| Save/load/restart UI availability | NOT EXPOSED in observed title, expedition, settlement, return screens; Escape at return shows no menu. This is not proof that no undiscovered binding exists |
| Cross-process persistence | NOT RUN: no restart/save/load control exposed, and same-process sequence preserved as requested |

Before/after values genuinely visible are station names, phase/branch labels,
control availability, and the two applied result strings. No numeric economy or
party values are available to transcribe. The state-audit lane owns independent
assembly/source validation; this report does not claim its findings.

## Capture/input limitations and initial troubleshooting

The title is visible in `01-title.png`. Native Start attempt refused with
`Exact target not foreground; no click sent`; first CUA bring_to_front also
reported refused. A later one-time full desktop context image nevertheless shows
base and the player foregrounded. **The title-to-base transition is unattributed.**
No fabricated successful Start receipt is claimed.

Early client image `03-base-before.png` actually shows Encounter at Sindorim,
not the filename's intended base state. `04-depart-action` sent (204,280), but its
intended departure cannot be reliably attributed from that inconsistent before
image. Image 05 shows expedition/home. A subsequent travel attempt refused exact
foreground; second CUA bring_to_front also reported refused. Image 07 contains
only the world preview without UI and is noncanonical capture evidence.
Titlebar activation was performed in 08. Image 09 is the observed, complete
expedition/home baseline for the audited sequence. From 10 onward each claimed
input has an exact-target native receipt and a separately opened matching
complete after-image. These early inconsistencies prevent an unqualified initial
Start/departure PASS; they do not get hidden by renaming or deleting evidence.

`desktop-context.png` is the single full desktop diagnostic, includes unrelated
browser chrome, and is excluded from the focused gameplay review packet. No
browser UI was driven. Driver skill-pack path was queried but its SKILL.md was
not installed; prior proven native technique, installed tool schema, and available
visual-QA/Windows-shell skills were read. No packages installed or daemon changed.

## Console and cleanup

`player.log` / `console-findings.txt`: D3D12 info-queue failure `0x80004002` and
broken IDXGISwapChain::GetFrameStatistics timestamp warning. No managed exception,
command-rejection or crash text found in this log. Not a warning-free or
performance PASS.

`cleanup.json`: owned PID 913372 exited after CloseMainWindow, no owned player
remaining, no force kill. Exit code is null/not captured; **not an exit-code-0
claim**. Existing CUA daemon PID 122360, start `2026-08-25T07:49:55.8861033Z`, remains
running. No daemon stop issued. Prior evidence/build preserved; all writes on this
lane are QA artifacts in this root. `action-log.md`, `commands.log`, and
`native-actions.jsonl` give concrete commands, UTCs, input coordinates, capture
paths, and process identity.
