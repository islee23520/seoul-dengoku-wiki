> Historical evidence for `6f07a94996a1f416cec1a44a3b3844dfb732900f`, not validation of publication base `3a52612`. Machine paths are normalized. PNGs and raw diagnostics named below are retained locally, **not bundled or downloadable links**. See [publication scope](../README.md).

# Actual visible input log

All player-native commands used `powershell.exe -NoProfile -ExecutionPolicy Bypass
-File .omo/evidence/gameplay-continuity/cua/native.ps1
-TargetPid 913372 -Name <name>` plus input options below. All successful calls
produce a PNG and append UTC, PID, HWND, process start, foreground before/after,
client dimensions, coordinates/keys and capture receipt to `native-actions.jsonl`.
`commands.log` reconstructs those exact executed commands from the receipts,
alongside launch, refused attempts, CUA activation and cleanup commands.

| Prefix | Input (1280x720 client coordinates) | Opened after-image / observed result |
|---|---|---|
| 01 | Capture/size only | Title, Start is sole visible gameplay control |
| 02 | Attempt Start (640,424) | Refused exact foreground; no click sent |
| CUA 1 | bring_to_front PID/HWND | Refused, receipt bring-to-front.json |
| desktop | One desktop context capture | Owned player foreground/base; transition unattributed |
| 03 | Capture only | Actually Encounter at Sindorim, despite intended filename |
| 04 | (204,280), intended Depart | 05 expedition/home; attribution compromised by 03 |
| 06 | Attempt travel (204,187) | Refused exact foreground; no click sent |
| CUA 2 | bring_to_front PID/HWND | Refused, receipt bring-to-front-2.json |
| 07 | Capture only | World preview without UI, noncanonical |
| 08 | Click native titlebar at window-left+180, window-top+15 | 09 complete expedition/home; canonical baseline |
| 10 | Travel (204,187) | 11 Sindorim, Encounter available |
| 12 | Encounter (204,282) | 13 Encounter, Enter resolution available |
| 14 | Enter resolution (204,280) | 15 negotiation/bypass/combat choices |
| 16 | Negotiate (828,194) | 17 negotiation settlement pending |
| 18 | Apply (828,254) | 19 applied result-27c2f047751fa155, Return replaces Apply |
| 20 | Return (828,262) | 21 Yeongdeungpo, Depart available |
| 22 | Depart (204,280) | 23 new expedition/home, same PID/start time |
| 24 | Travel (204,187) | 25 Sindorim, Encounter available |
| 26 | Encounter (204,282) | 27 Encounter, Enter resolution available |
| 28 | Enter resolution (204,280) | 29 same three choices available |
| 30 | Bypass (828,252) | 31 bypass settlement pending |
| 32 | Apply (828,254) | 33 applied result-cfa4fb80954e47f0, Return replaces Apply |
| 34 | Return (828,262) | 35 Yeongdeungpo, Depart available |
| 36 | Escape (SendKeys {ESC}, exact foreground guarded) | 37 unchanged return UI, no menu exposed |
| cleanup | CloseMainWindow of exact owned PID/path/start-time | Exited, no owned player remains; existing daemon preserved |

No fixed sleeps, polling, injected state, game-domain calls, or presenter hooks.
After-images are separate capture calls, opened and judged, not a fixed-time
assumption of completion. All canonical images are exact 1280x720. The only
1920x1080 image is desktop-context.png, excluded from gameplay evidence.

No resource/reputation/party values were visible anywhere in this sequence.
Two IDs and branch labels are not reward arithmetic. Save/load/restart were not
exposed on observed UI; Escape after the second return did not expose a menu.
