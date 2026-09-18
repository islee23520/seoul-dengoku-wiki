# Pilgrimage avatar preview source record

## Authority

- User-supplied repository: `https://github.com/islee23520/pilgrimage`
- Pinned review revision: `de04a116bdf388cf9ecb9b9a0ad2ec79a025a139`
- Inspected read-only checkout: `/Volumes/gameWorkspace/game-refs/pilgrimage`
- The checkout HEAD equals the user-supplied fork `main` SHA.
- The checkout's configured origin still names `tomjohndesign/pilgrimage`; that
  remote label was not treated as authority.

## Rights boundary

The inspected fork has no tracked `LICENSE`, `COPYING`, or `NOTICE` file and
GitHub reports no detected license. Public visibility and fork ownership do not
establish shipping rights. These images are loaded by exact raw GitHub URL only
for this user-authorized local review POC. They are not copied into the product,
promoted, published, or described as licensed production assets.

## Renderer findings

- `lib/game/character-assets.ts:27-35`: walk and idle are separate atlas clips;
  columns, rows, anchor, scale and shadows come from metadata.
- `lib/game/character-assets.ts:43-47,77-83`: directions are
  `S, SW, W, NW, N, NE, E, SE`; row selection is camera-relative and stopped
  characters use a still frame.
- `lib/game/base-person/population-assets.ts:17-32`: a calling uses six body
  profiles with `rowOffset = variant * 8`, plus shared shadow atlases.
- `components/game/character-sprite.tsx:89-100`: each character clones texture
  UV state, uses nearest filtering and disables mipmaps.
- `components/game/character-sprite.tsx:143-204`: world heading and camera yaw
  select the row; moving switches to walk and stationary switches to idle.
- `assets/BASE_PERSON.md:82-90`: each 64px cell uses anchor `(32, 48.5)`;
  opposite directions are authored and must not be obtained by mirroring.
- `public/textures/characters/population/v23/manifest.json:1-25`: walk has
  20 columns, idle one column, and 48 rows = six profiles × eight directions.

## Minimal remote asset set

Role mapping is a POC visual mapping, not Pilgrimage or Janseon canon:

| Janseon POC role | Pilgrimage calling |
|---|---|
| guard | knight |
| assault | peasant |
| archer | friar |

The preview requests only:

- `knight-walk.png`, `knight-idle.png`
- `peasant-walk.png`, `peasant-idle.png`
- `friar-walk.png`, `friar-idle.png`
- shared `shadow-walk.png`, `shadow-idle.png`

Every URL is pinned beneath commit
`de04a116bdf388cf9ecb9b9a0ad2ec79a025a139`.

## Deliberate limits

- Idle and walk are supported.
- No attack atlas is used. A stationary attacking figure displays idle and the
  preview explicitly reports `attack clip unsupported`.
- Pilgrimage's custom per-pixel depth shader, generated depth maps, outlines,
  foot-plant IK and activity clips are not claimed by this small renderer port.
- Body and matching cast-shadow sprites share the same atlas cell and foot
  anchor. The shadow renders first.
