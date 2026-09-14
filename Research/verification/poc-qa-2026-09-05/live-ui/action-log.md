> Historical evidence for `6f07a94996a1f416cec1a44a3b3844dfb732900f`, not validation of publication base `3a52612`. Machine paths are normalized. PNGs and raw diagnostics named below are retained locally, **not bundled or downloadable links**. See [publication scope](../README.md).

# Actual UI action log

SHA 6f07a94996a1f416cec1a44a3b3844dfb732900f. All coordinates below refer to
observed player client pixels; no presenter hooks or direct domain commands.
`native-actions.jsonl` contains UTC, PID, HWND, coordinates, foreground identity,
dimensions and capture receipt per successful native script call. Number prefixes
link actions to settled after-images. Immediate action captures are intermediate
evidence, not automatically a successful transition; settled images were opened.

## Initial input troubleshooting (NOT gameplay success)

- doctor/session refresh: current agent and active console are both session 1,
  active user, input desktop Default, nonzero foreground HWND. No session mismatch.
- Player PID 889956 launched at 1280x720; real title visible in 01.
- Background CUA Start click 02: effect unverifiable, unchanged title.
- Foreground CUA Start click 03 and Enter 04: exact target not activated,
  no input sent. Native SetForegroundWindow/AttachThreadInput also refused target.
- Desktop context screenshot 07 showed Start menu over the game. Escape was sent
  to dismiss it. A titlebar activation attempt did not establish target focus;
  later desktop context 12 showed Chrome. No browser page was driven.
- CUA bring_to_front then returned landed_on_target=true, HWND 0x91153e.
  CUA foreground Start click 14 has an unverifiable effect in its receipt; image 15 supports the resulting BasePreparation transition, not certain input attribution.
- Initial diagnostics/screenshots are in troubleshooting/. Misleading early
  filenames such as 02-base and 11-base actually show title, NOT base gameplay.
  The two full-desktop context images contain unrelated desktop UI; they are
  excluded from the canonical review packet. Do not use them as game evidence.

## First process: combat loop (PID 889956)

| Action prefix | Visible input | Settled observed result |
|---|---|---|
| 14 | CUA foreground Start (640,454 window pixels) | 15 BasePreparation, props and departure |
| 16 | Depart (204,280) | 17 expedition home |
| 18 | Sindorim (204,187) | 19 Sindorim selected, encounter available |
| 20 | Guro (204,232) | 21 Guro selected |
| 22 | Encounter (204,282) | 23 Encounter, Enter resolution |
| 24 | Enter resolution (204,280) | 25 negotiation/bypass/combat choices |
| 26 | Combat (828,310) | 27 battle grid, HP10/AP3 |
| 28 | Battle command (164,298) | 29 AP1, foe HP7 |
| 30 | Same visible battle command | 31 ally moves to 2,2, AP0 |
| 32 | Same visible battle command | 33 active HUD HP7/AP3 |
| 34 | Same visible battle command | 35 log ally HP5, active HUD HP7/AP1 |
| 36 | Same visible battle command | 37 foe moves to 3,3, AP0 |
| 38 | Same visible battle command | 39 active HUD HP5/AP3 |
| 40 | Same visible battle command | 41 foe HP4 |
| 42 | OS resize exact client to 1920x1080 | 43 same live battle, true 1080p |
| 44 | Battle command (246,448) | 45 ally moves to 3,2 |
| 46 | Same visible battle command | 47 active HUD HP4/AP3 |
| 48 | Same visible battle command | 49 combat settlement panel replaces battle |
| 50 | Resize to 1280x720 | 51 pending combat settlement |
| 52 | Apply settlement (828,254) | 53 result ID, Return button |
| 54 | Resize to 1920x1080 | 55 same applied settlement |
| 56 | Return (1242,393) | 57 home station / BaseReady |
| 58 | Resize to 1280x720 | 59 BaseReady |

Process exited after close request 60; first-close receipt retained, exit code not captured. No outcome type
(victory/defeat) is asserted: visible settlement copy only says combat settlement.

## Second process: negotiation then bypass (PID 849268)

| Action prefix | Visible input | Settled observed result |
|---|---|---|
| 61 | Launch and set exact 1920x1080 client | 62 title |
| 63 | Start (960,636) | 64 BasePreparation |
| 65 | Depart (306,424) | 66 expedition home |
| 67 | Sindorim (306,281) | 68 selected station |
| 69 | Guro (306,351) | 70 selected station |
| 71 | Encounter (306,426) | 72 Encounter |
| 73 | Enter resolution (306,424) | 74 choices |
| 75 | Negotiate (1242,292) | 76 negotiation settlement |
| 77 | Resize to 720p | 78 negotiation settlement |
| 79 | Apply settlement (828,254) | 80 applied negotiation result ID |
| 81 | Resize to 1080p | 82 same applied settlement |
| 83 | Return (1242,394) | 84 home / BaseReady |
| 85 | Resize to 720p | 86 BaseReady |
| 87 | Depart (204,280) | 88 expedition |
| 89 | Sindorim (204,187) | 90 station selected |
| 91 | Encounter (204,282) | 92 Encounter |
| 93 | Enter resolution (204,280) | 94 choices |
| 95 | Bypass (828,252) | 96 bypass settlement |
| 97 | Resize to 1080p | 98 bypass settlement |
| 99 | Apply settlement (1242,382) | 100 applied bypass result ID |
| 101 | Resize to 720p | 102 same applied settlement |
| 103 | Return (828,262) | 104 home / BaseReady |
| 105 | Resize to 1080p | 106 BaseReady |

Both owned players exited; successful exit codes were not captured. CUA named session ended; existing daemon
preserved. No background synthetic return was taken as proof of success. Mouse
actions used OS input with exact foreground HWND validation; every transition
claim above was grounded by opening the settled screenshot.
