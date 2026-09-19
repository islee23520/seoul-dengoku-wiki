# BROWSER REFERENCE KNOWLEDGE BASE

## OVERVIEW
Frozen browser interaction/visual reference for the Unity port; score 9 (29 files, dense symbols, ~45 exported functions), distinct prototype domain. Freeze provenance: stage 6 of `Wikis/game-logic/Ui-Implementation-Pipeline.md`; the Korean `README.md` states the contract.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Review entry and freeze contract | `index.html`, `README.md`, `SHA256SUMS` | Four linked review surfaces; byte-level baseline |
| Formation placement and confirmation | `formation-editor/formation-model.js` | Shared `UNITS`, `assertFormation`, `createInitialState` |
| Fixed-tick squad simulation | `battle-preview/battle-model.js` | `createSquadBattleState`, `advanceBattleTicks`, `battleFingerprint` |
| Commander-owned cards | `avatar-preview/avatar-command-card-model.js` | Offering, selection, play, recharge, fingerprints |
| Atlas geometry and animation | `avatar-preview/avatar-render-model.js` | Camera-relative rows, frame selection, layer composition |
| Three.js interaction/rendering | Each preview's `app.js` | Avatar preview consumes formation and battle models |
| Recovered campaign transitions | `recovered-campaign/campaign-model.js` | State validation, encounters, settlement, return |
| Recovery authority and rejected sources | `recovered-campaign/SOURCE-COMPARISON.md` | Windows v3 source and deliberate exclusions |
| Avatar provenance and limits | `avatar-preview/SOURCE-PROVENANCE.md` | Pinned review source, rights boundary, unsupported clips |
| Model assertions | Sibling `*.test.js` files | Node test runner; models imported directly |

## CONVENTIONS
- These are browser ES modules, not a bundled application; each `app.js` imports `three@0.180.0` from the jsdelivr CDN.
- State/rule modules stay separate from DOM and Three.js `app.js` consumers.
- Battle model uses 30 ticks/second and at most four simulation steps per frame.
- Formation state crosses review surfaces using `janseon.review.formation.v1`.
- Campaign state uses `janseon.review.campaign.v1`; recovery links carry `?campaign=recovered`.
- The return link `?result=reviewed` connects battle review to recovered-campaign settlement.
- A changed frozen mockup requires refreshed `SHA256SUMS` and renewed comparison with the Unity port.
- Avatar body and shadow share the same atlas cell and foot anchor; shadow renders first.
- Idle and walk are supported. A stationary attack uses idle and reports `attack clip unsupported`.

## COMMANDS
From the repository root:
```bash
node --test GAME-REFERENCE/poc/browser/*/*.test.js
python3 -m http.server 8000 --directory GAME-REFERENCE/poc/browser
```
Review `http://localhost:8000/`; CDN modules and pinned remote avatar images need network access.
The HTTP server is a review surface, not proof that the Unity implementation matches it.

## ANTI-PATTERNS
- Do not copy, publish, or promote Pilgrimage images into the product; this POC's authorization is local review only.
- Do not mirror opposite avatar directions: their atlas rows are separately authored.
- Do not claim attack atlases, depth shaders, outlines, or foot-plant IK that this renderer does not implement.
- Do not restore rejected recovery behavior: AP/turn combat, random rosters, Windows portrait paths, or timer-override harnesses.
- Do not treat `Design/poc-diegetic/DIRECTION.md` as an approved replacement for this frozen baseline; it is a candidate pending owner review.
