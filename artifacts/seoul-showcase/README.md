# Seoul Subway States showcase

This package runs independently of the wiki and does not require the repository's
pnpm catalog, shared API client, private database, or release-generation scripts.

## Standalone checkout

Requires Node 20.19+ on the 20.x line, or Node 22.12+, and pnpm 10.

```sh
cd artifacts/seoul-showcase
pnpm install --ignore-workspace --frozen-lockfile
pnpm run typecheck
PORT=20814 BASE_PATH=/seoul-showcase/ pnpm run build
PORT=20814 BASE_PATH=/seoul-showcase/ pnpm run serve
```

Open `/seoul-showcase/` on the preview server. For development, replace `serve`
with `dev`. Set `BASE_PATH=/` when hosting at the site root. Production files
are written to `dist/public`; serve them at the selected base path.

## Replit multi-app workspace

Use the root workspace install and existing managed workflow:
`pnpm --filter @workspace/seoul-showcase run dev`. The root lockfile governs
workspace installs; this package's lockfile governs standalone installs only.

After changing dependencies, update both locks and verify both installation modes.
This is the existing reference-card showcase; the map-led redesign is not included.
