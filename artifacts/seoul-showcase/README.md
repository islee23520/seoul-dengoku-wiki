# Seoul Metro Dynasties showcase

This package runs independently of the wiki and does not require the repository's
shared API client, private database, or release-generation scripts. It is a plain
Vite + React app with its own `package-lock.json`.

## Standalone checkout

Requires Node 20.19+ on the 20.x line, or Node 22.12+, and npm.

```sh
cd artifacts/seoul-showcase
npm ci --ignore-scripts
npm run typecheck
npm run build
npm run serve
```

Production files are written to `dist/public` and are addressed under the Vite
base path, which defaults to `/wiki/seoul-showcase/`. Serve that directory at
`/wiki/seoul-showcase/` (the wiki host mounts it there). All bundled runtime
assets (`scenes/`, `portraits/`, `history/`, `narration/`, `favicon.svg`) resolve
through `import.meta.env.BASE_URL`, so no asset URL is tied to a fixed prefix.

Environment variables (all optional):

- `BASE_PATH` — public base path; must start and end with `/`. Defaults to
  `/wiki/seoul-showcase/`. Set `BASE_PATH=/` when hosting at a site root.
- `PORT` — port for `npm run dev` / `npm run serve`. When set it must be a valid
  TCP port and is enforced strictly; when unset Vite picks its default. Builds
  never read it.

`npm run dev` serves the app at `http://localhost:<port>/wiki/seoul-showcase/`.

After changing dependencies, regenerate `package-lock.json` with
`npm install --package-lock-only --ignore-scripts` and re-verify `npm ci`.
This is the existing reference-card showcase; the map-led redesign is not included.
