#!/bin/sh
# Run from a detached GDD checkout. Retain artifacts outside the worktree.
set -eu
sha=$(git rev-parse HEAD)
npm ci --prefix viewer
GDD_SOURCE_SHA="$sha" npm --prefix viewer run build:standalone
store=${GDD_ARTIFACT_ROOT:?GDD_ARTIFACT_ROOT must be outside the checkout}
mkdir -p "$store"
test ! -e "$store/$sha"
cp -R viewer/dist "$store/$sha"
echo "GDD_BUILD_PASS sha=$sha artifact=$store/$sha"
