# PLAYABLE WEB POC KNOWLEDGE BASE

## OVERVIEW
Vanilla-JS browser POC of the campaign core loop; distinct non-Unity domain (score ~10: ~20 exports in `model.mjs`, own node:test suite, zero Unity coupling).

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Pure rules / state machine | `model.mjs` | All game logic: `createGame`, `selectDestination`, `depart`, `negotiate`, `startBattle`, `stepGame`, `playCard`, `settle`, `returnHome`... |
| Tests | `model.test.mjs` | node:test + assert/strict; 13 fixtures |
| UI wiring | `app.js`, `index.html`, `style.css` | `index.html` loads `world-data.js` then module `app.js` |
| Visual / UX contract | `Design.md` | Korean; POC UI decisions (colors, layout, mobile 390px) |
| Seoul map data | `world-data.js` | One-line `window.POC_WORLD` blob, 702KB, OSM snapshot (`asOf` in file) |

## CONVENTIONS
- This directory is a staged copy of `GAME-LOGIC/site/dist/play` (currently byte-identical); upstream owns canonical content.
- `model.mjs` is self-contained: no imports, no DOM access; UI goes through model functions only.
- State transitions are functional: actions take state and return a copied next state; module data (`CARDS`) is `Object.freeze`d.
- Battle time is ticks at `TICKS_PER_SECOND = 30`; cooldowns/intervals are tick counts, never seconds.
- `Design.md` forbids new fonts, frameworks, and image generation: CSS/SVG/Canvas only.

## COMMANDS
```bash
node --test model.test.mjs   # from this directory
```

## ANTI-PATTERNS
- Do not hand-edit `world-data.js`; it is generated. Change the upstream source and restage.
- Do not port Unity travel/combat rules here or POC rules into Unity (`model.mjs` header: "Pure web POC rules, not a port").
- Do not mutate state in place; tests deep-freeze inputs and assert rejected actions return the state unchanged (`rejectsUnchanged`).
- Do not add npm dependencies or a build step; there is no `package.json` here.
