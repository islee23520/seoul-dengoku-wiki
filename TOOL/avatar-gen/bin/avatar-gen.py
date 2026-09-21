#!/usr/bin/env python3
"""Inspect and validate the repository-owned avatar asset package."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import cast

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from avatar_gen.manifest import check_manifest, load_manifest  # type: ignore[import-not-found]  # pyright: ignore[reportImplicitRelativeImport]
from avatar_gen.mesh_contract import route_request, write_job  # type: ignore[import-not-found]  # pyright: ignore[reportImplicitRelativeImport]
from avatar_gen.mesh_work import execute_mesh_work  # pyright: ignore[reportMissingImports, reportImplicitRelativeImport]


def main() -> int:
    parser = argparse.ArgumentParser(prog="avatar-gen")
    _ = parser.add_argument("command", choices=("list", "check", "route", "mesh-work"))
    _ = parser.add_argument("--manifest", type=Path)
    _ = parser.add_argument("--request")
    _ = parser.add_argument("--source", type=Path)
    _ = parser.add_argument("--work-dir", type=Path)
    _ = parser.add_argument("--output", type=Path)
    _ = parser.add_argument("--apply", action="store_true")
    _ = parser.add_argument("--allow-destructive", action="store_true")
    namespace = vars(parser.parse_args())
    raw_command = namespace.get("command")
    raw_manifest = namespace.get("manifest")
    if not isinstance(raw_command, str):
        parser.error("command is required")
    command = raw_command
    manifest = raw_manifest if isinstance(raw_manifest, Path) else None
    request = namespace.get("request")
    if command in {"route", "mesh-work"} and not isinstance(request, str):
        parser.error("--request is required")
    if command == "route":
        job = route_request(cast(str, request), apply_repairs=bool(namespace.get("apply")))
        work_dir = namespace.get("work_dir")
        if isinstance(work_dir, Path):
            write_job(work_dir / "mesh-job.json", job)
        print(json.dumps(job, ensure_ascii=False, indent=2))
        return 0
    if command == "mesh-work":
        source = namespace.get("source")
        work_dir = namespace.get("work_dir")
        if not isinstance(source, Path) or not isinstance(work_dir, Path):
            parser.error("--source and --work-dir are required")
        output = namespace.get("output")
        receipt = execute_mesh_work(
            source,
            cast(str, request),
            work_dir,
            output=output if isinstance(output, Path) else None,
            apply_repairs=bool(namespace.get("apply")),
            allow_destructive=bool(namespace.get("allow_destructive")),
        )
        print(json.dumps(receipt, ensure_ascii=False, indent=2))
        return 0 if receipt["status"] in {"AUDITED", "PASS", "REPAIRED_UNPROVEN"} else 1
    if command == "list":
        payload = load_manifest(manifest) if manifest else load_manifest()
        print(json.dumps({"status": "PASS", "assets": payload["assets"]}, indent=2))
        return 0
    result = check_manifest(manifest) if manifest else check_manifest()
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
