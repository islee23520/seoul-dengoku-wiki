# 서울:전국 GDD

The GDD repository builds independently and publishes at
`https://seoul-dengoku.linalab.io/gdd/`.

```sh
npm ci --prefix viewer
GDD_SOURCE_SHA=$(git rev-parse HEAD) npm --prefix viewer run build:standalone
```

This command materializes the JSON canon into an external temporary directory,
checks the rendered lock, builds the viewer, and runs its complete test suite.
It uses only committed world snapshots and versioned renderer/materializer files
inside this repository. No game, wiki, tools, or parent checkout is required.

The deployment artifact is `viewer/dist/`, including `build.json` with the exact
source commit. Deploy only this artifact into the existing host's `site/gdd/`;
do not rebuild or replace `/wiki/`, `/avatar/`, or the root hub.

## CI and promotion

Register this repository as a separate custom project in the existing
`ci.linalab.io` registry. Its build command is:

```sh
GDD_ARTIFACT_ROOT="$HOME/artifacts" sh viewer/scripts/ci-build.sh
```

The build stores its verified artifact under the exact GDD SHA before the CI
detached worktree is removed. Build and deploy are separate operations.

An authorized operator supplies that retained artifact and runs
`viewer/scripts/ci-deploy.sh <artifact> <sha>` inside `linalab-ci-seoul-1`.
This takes the existing Seoul project lock, replaces only `site/gdd/`, updates
the hub's artifact hashes and separate GDD identity, and checks origin identity
and deep links. Failed verification restores the previous GDD and manifest.
No nginx or Cloudflare policy change is needed for the existing `/gdd/` route.
