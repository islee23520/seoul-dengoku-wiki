#!/usr/bin/env python3
"""Inspect and validate the repository-owned avatar asset package."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from avatar_gen.manifest import check_manifest, load_manifest  # type: ignore[import-not-found]  # pyright: ignore[reportImplicitRelativeImport]


def main() -> int:
    parser = argparse.ArgumentParser(prog="avatar-gen")
    _ = parser.add_argument("command", choices=("list", "check"))
    _ = parser.add_argument("--manifest", type=Path)
    namespace = vars(parser.parse_args())
    raw_command = namespace.get("command")
    raw_manifest = namespace.get("manifest")
    if not isinstance(raw_command, str):
        parser.error("command is required")
    command = raw_command
    manifest = raw_manifest if isinstance(raw_manifest, Path) else None
    if command == "list":
        payload = load_manifest(manifest) if manifest else load_manifest()
        print(json.dumps({"status": "PASS", "assets": payload["assets"]}, indent=2))
        return 0
    result = check_manifest(manifest) if manifest else check_manifest()
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

