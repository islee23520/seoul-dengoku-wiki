#!/bin/sh
# Operator invokes this inside linalab-ci-seoul-1, not the dashboard container.
set -eu
artifact=${1:?verified artifact directory required}
sha=${2:?exact GDD commit required}
exec 9>/state/ci.lock
flock -n 9 || { echo 'CI_BUSY project=seoul'; exit 1; }
node "$(dirname "$0")/deploy-artifact.mjs" "$artifact" /e/git/seoul-dengoku-web/site "$sha" http://seoul-dengoku-web
