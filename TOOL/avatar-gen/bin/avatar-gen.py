#!/usr/bin/env python3
"""Inspect and validate the repository-owned avatar asset package."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from avatar_gen.manifest import check_manifest, load_manifest


def main() -> int:
    parser = argparse.ArgumentParser(prog="avatar-gen")
    parser.add_argument("command", choices=("list", "check"))
    args = parser.parse_args()
    if args.command == "list":
        payload = load_manifest()
        print(json.dumps({"status": "PASS", "assets": payload["assets"]}, indent=2))
        return 0
    result = check_manifest()
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())

