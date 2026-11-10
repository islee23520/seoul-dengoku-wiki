# State machines in the Pages site

Owner instruction: find every implicit state machine and pick the option that improves UX, DX and AX without breaking anything.

The rule used here: a piece of interactive state becomes an explicit machine when it has **two or more fields that must change
together** or **phases in which some events are invalid**. Each machine lives in `site/theme/machines/`, is a pure function
`reduce(state, action)`, and lists its allowed transitions in one table. Components only call `dispatch`.

| Machine | File | Phases | What it prevents |
| --- | --- | --- | --- |
| People search | `peopleFilter.ts` | `loading`, `ready`, `error` | filtering before data arrives; a stale or corrupt saved filter crashing the page (restore falls back to defaults); rendering 1,022 rows at once (paged by 100) |
| Territory map | `territoryMap.ts` | `loading`, `ready`, `failed` | two selections at once (selection is a union of one kind); a title selected while the underground layer is shown; a detail panel open with nothing selected; a late event arriving in the wrong phase |
| Locale preference | `localePref.ts` | none (pure decision table) | guessing the browser language; rewriting a shared deep link; losing the choice after a reload |

## Transition tables

### People search (`peopleFilter.ts`)

| Phase | Accepts | Goes to |
| --- | --- | --- |
| loading | `loaded` / `failed` | ready / error |
| ready | `set`, `reset`, `more` | ready |
| error | `retry` | loading |

`set` and `reset` also reset the visible page size to 100.

### Territory map (`territoryMap.ts`)

| Phase | Accepts | Goes to |
| --- | --- | --- |
| loading | `loaded` / `failed` | ready / failed |
| ready | `mode`, `layer`, `rank`, `line`, `holding`, `select`, `segments`, `toggle`, `detail`, `view`, `escape` | ready |
| failed | `retry` | loading (state fully reset) |

Cross-field rules (the part the old React component spread over many click handlers):

| Action | Also resets |
| --- | --- |
| `mode` | selection, detail panel, rank back to county, holding, segment choices; switching to titles forces the surface layer |
| `layer` | selection, detail panel, segment choices; switching to underground forces the political map |
| `rank` | the selection only if it is a title; the detail panel with it |
| `line` | the selection only if it is a segment |
| `select` | segment choices; opens the detail panel unless the selection is none |
| `holding` | selection; opens the panel when a holding is chosen |
| `escape` | segment choices first, then the detail panel |

### Locale preference (`localePref.ts`)

| When | Do |
| --- | --- |
| nothing stored | stay (English is the default; the browser language is never guessed) |
| stored equals the URL's locale | stay |
| stored differs and the URL is a locale home (`/` or `/ko/`) | redirect to the stored locale home |
| stored differs and the URL is any other page | stay (a shared deep link is never rewritten) |
| navigation changes the URL's locale | store the new locale |

## Left to the default theme on purpose

VitePress's default theme already models these, and replacing them would risk the layout for no gain:

- dark mode (persisted by its own inline script), the mobile sidebar and navigation drawer, the local search dialog.

They are treated as black boxes: the site does not read or write their state.

## Still implicit in the new code, and why

- `TerritoryMap.vue`: `dragged` (a pointer-up that ended a drag must not count as a click) and `railFailed` (the rail file failed to load). Both are single booleans with no dependent fields, so a machine would add code without removing a bug.
- Pan/zoom `box` is held in the map machine (`view`), but the gesture in progress (`drag`) is a local variable because it never outlives one pointer interaction.

## How to add a machine

1. Write the phases and the transition table first (as above), then `reduce`.
2. Ignore actions the current phase does not accept; never throw on a late event.
3. Keep restoring from storage defensive: validate every field, fall back to defaults.
4. Add the table to this document.
