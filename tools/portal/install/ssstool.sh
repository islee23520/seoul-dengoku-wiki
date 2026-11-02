#!/bin/sh
set -eu
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'NODE24_REQUIRED' >&2
  exit 2
fi
exec node "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/install.mjs" "$@"
