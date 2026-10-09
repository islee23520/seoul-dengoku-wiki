# Outside occupation projection

`lore/regions/outside-control-2126.json` owns whole-unit political assignments. Schema v3 allows `authority: null` only for units enumerated by `lore/regions/outside-island-occupation.json`.

The island ledger enumerates every disconnected path component of those administrative boundaries. `componentIndex` is zero-based and bound to the exact observed unit path by `pathSha256`; changing geometry requires reviewing the component allocation again. `location` is the WGS84 bounding-box midpoint of the displayed component, a review locator rather than a surveyed place point. Names are nullable: unidentified coastal components do not receive invented names or ownership.

`mainland-bridge` means a verified continuous bridge connection to the mainland (possibly through other islands), not merely a bridge to another offshore island. `no-mainland-bridge` and `unknown` both project `authority: null`, `status: unassigned`, and no personal holder or title. Only verified mainland-connected components project Government authority. The geographic evidence does not establish opening-day passability.

`scripts/outside-occupation.mjs` validates coverage, unique indices, geometry binding, source references, and the ownership boundary. It supplies the `components` with exact paths and derives whole-unit `partial` or `unassigned` status. The map renders these components instead of tinting the entire administrative unit; its detail panel shows the individual assignments. Observed `public/outside-admin-units.json` geometry is unchanged.

Regenerate and check from the WIKI root:

```sh
npm run generate
npx vitest run scripts/test-outside-occupation.mjs scripts/test-current-affiliation.mjs scripts/test-approved-political-territories.mjs scripts/test-territory-map.mjs scripts/test-territory-layer-interaction.mjs
npm test
npm run build
node scripts/gate.mjs
```

Run generation and build sequentially: generation recreates crest assets used by the build. Keep source captures and per-component review evidence under ignored `.omo/evidence/`.
