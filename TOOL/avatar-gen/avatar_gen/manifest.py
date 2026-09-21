"""Validate the portable avatar-gen asset manifest."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import TypedDict, cast

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets" / "manifest.json"


class AssetEntry(TypedDict):
    role: str
    path: str
    sha256: str


class Manifest(TypedDict):
    schema_version: int
    required_roles: list[str]
    assets: list[AssetEntry]


class Failure(TypedDict):
    path: str
    failure: str


class CheckResult(TypedDict):
    status: str
    checked: int
    roles: list[str]
    failures: list[Failure]


def load_manifest(path: Path = MANIFEST) -> Manifest:
    payload = cast(object, json.loads(path.read_text(encoding="utf-8")))
    if not isinstance(payload, dict):
        raise ValueError("avatar manifest must be an object")
    raw = cast(dict[str, object], payload)
    if raw.get("schema_version") != 1:
        raise ValueError("unsupported avatar manifest schema")
    raw_assets = raw.get("assets")
    if not isinstance(raw_assets, list) or not raw_assets:
        raise ValueError("avatar manifest has no assets")
    assets = cast(list[object], raw_assets)
    required = raw.get("required_roles")
    if not isinstance(required, list) or not all(isinstance(role, str) for role in cast(list[object], required)):
        raise ValueError("avatar manifest required roles are malformed")
    required_roles = cast(list[str], required)
    entries: list[AssetEntry] = []
    for item in assets:
        if not isinstance(item, dict):
            raise ValueError("avatar manifest asset is malformed")
        raw_item = cast(dict[str, object], item)
        role, relative, expected = raw_item.get("role"), raw_item.get("path"), raw_item.get("sha256")
        if not isinstance(role, str) or not isinstance(relative, str) or not isinstance(expected, str):
            raise ValueError("avatar manifest asset fields are malformed")
        entries.append({"role": role, "path": relative, "sha256": expected})
    return {"schema_version": 1, "required_roles": required_roles, "assets": entries}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def check_manifest(path: Path = MANIFEST) -> CheckResult:
    payload = load_manifest(path)
    root = path.parent.parent if path.resolve() == MANIFEST.resolve() else path.parent
    failures: list[Failure] = []
    checked = 0
    roles: set[str] = set()
    for item in payload["assets"]:
        relative = item["path"]
        expected = item["sha256"]
        role = item["role"]
        candidate = (root / relative).resolve()
        if root.resolve() not in candidate.parents:
            failures.append({"path": relative, "failure": "PATH_ESCAPE"})
            continue
        if not candidate.is_file():
            failures.append({"path": relative, "failure": "MISSING_FILE"})
            continue
        roles.add(role)
        actual = _sha256(candidate)
        if actual != expected:
            failures.append({"path": relative, "failure": "HASH_MISMATCH"})
            continue
        checked += 1
    required = set(payload["required_roles"])
    missing_roles = sorted(required - roles)
    failures.extend({"path": "<manifest>", "failure": f"MISSING_ROLE:{role}"} for role in missing_roles)
    return {
        "status": "PASS" if not failures else "FAIL",
        "checked": checked,
        "roles": sorted(roles),
        "failures": failures,
    }

