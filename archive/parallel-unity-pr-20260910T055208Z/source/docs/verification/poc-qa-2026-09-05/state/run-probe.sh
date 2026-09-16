#!/usr/bin/env bash
# QA-only replay of historical DLLs; never builds the Unity project.
set -euo pipefail
: "${MONO:?Set MONO to the Mono executable}"
: "${CSC:?Set CSC to the compatible C# compiler executable}"
: "${MANAGED:?Set MANAGED to the retained player Managed directory}"
: "${OUT:?Set OUT to a new directory outside the publication worktree}"
HERE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
REPO=$(cd -- "$HERE/../../../.." && pwd -P)
if command -v cygpath >/dev/null 2>&1; then
    MONO=$(cygpath -au "$MONO")
    CSC=$(cygpath -am "$CSC")
    MANAGED=$(cygpath -au "$MANAGED")
    OUT=$(cygpath -au "$OUT")
fi
MANAGED=$(cd -- "$MANAGED" && pwd -P)
# Parent must exist; OUT must be new, preventing historical output overwrite.
OUT="$(cd -- "$(dirname -- "$OUT")" && pwd -P)/$(basename -- "$OUT")"
case "${OUT,,}/" in
    "${REPO,,}/"*) echo "OUT must be outside the publication worktree" >&2; exit 2 ;;
esac
(cd -- "$MANAGED" && sha256sum -c "$HERE/managed-assemblies.sha256")
mkdir -- "$OUT"
SOURCE="$HERE/StateProbe.cs"
EXPECTED="$HERE/expected-ids.txt"
if command -v cygpath >/dev/null 2>&1; then
    MANAGED=$(cygpath -am "$MANAGED")
    OUT=$(cygpath -am "$OUT")
    SOURCE=$(cygpath -am "$SOURCE")
    EXPECTED=$(cygpath -am "$EXPECTED")
fi
"$MONO" "$CSC" -nologo -langversion:latest -target:exe "-out:$OUT/StateProbe.exe" "-r:$MANAGED/netstandard.dll" "-r:$MANAGED/Janseon.Core.dll" "-r:$MANAGED/Janseon.Foundation.dll" "$SOURCE" 2>&1 | tee "$OUT/compile.log"
MONO_PATH="$MANAGED" "$MONO" "$OUT/StateProbe.exe" "$EXPECTED" 2>&1 | tee "$OUT/probe-results.log"
