# Windows HTML recovery comparison

## Selected authority

- Windows snapshot: `.omo/windows-import-20260909/snapshot/seoul-kenshi/.omo/design/fullgame-example-v3.html`
- SHA256: `85c62fb6c284f2add0de81f32cf8755c82c5e52f8375b79fdb0a547495c3ef2a`
- Reason: this is the most complete coherent playable source without the embedded automation side effects in `fullgame-test.html` and `fullgame-test2.html`. It contains title/create, roster, hub, relationship dialogue, deployment, route, encounter, combat, settlement, and return-loop code.

## Candidate comparison

| Candidate | Finding | Integration decision |
| --- | --- | --- |
| `fullgame-example-v3.html` | Complete player-facing loop with character creation and randomized world roster | Selected as behavior/design source |
| `fullgame-test.html` | v3 plus an auto-running browser harness | Rejected as shipping source; harness is not user interaction |
| `fullgame-test2.html` | Synchronous timer override and malformed `if(G._field.length<G.deployKeys)0;` deploy statement | Rejected as shipping source |
| `fullgame-example-v2.html` | Earlier playable campaign without the complete create/roster layer | Superseded by v3 |
| `ui-mockup-v4.html`, `v4-s1`–`v4-s5` | Strong visual shell, mostly static screen studies | Reused as visual reference, not selected as game-loop authority |
| `poc-complete.html`, `game-logic-synthesis.html` | Design/synthesis documents rather than complete interactive loop | Recorded as supporting rationale only |

## Applied to the current POC

- Preserved: title/create, four-person world roster, hub rest/dialogue/mission actions, relationship effect, route selection, visible encounter costs, non-combat branches, receipt settlement, return to hub.
- Connected: encounter combat now hands off to `../formation-editor/?campaign=recovered`; confirmed formation is passed through the existing session formation contract to `../battle-preview/?campaign=recovered`; battle review returns to `../recovered-campaign/?result=reviewed` for settlement.
- Preserved unchanged: the approved formation scene, 30 Hz real-time squad simulation, maximum four fixed steps per frame, and fixed orthographic 45° / 35.264° camera.
- Deliberately not ported: obsolete 5×5 AP/turn combat, random `Math.random()` roster behavior, Windows `file:///E:/...` portrait paths, fixed 1280×720-only layout, and test harness timer overrides.
