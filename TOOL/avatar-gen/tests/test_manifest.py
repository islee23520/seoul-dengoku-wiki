from __future__ import annotations

import json
from pathlib import Path

from avatar_gen.manifest import check_manifest  # type: ignore[import-not-found]  # pyright: ignore[reportImplicitRelativeImport]


def test_production_manifest_passes() -> None:
    result = check_manifest()
    assert result["status"] == "PASS"
    assert result["checked"] >= 22
    assert result["failures"] == []


def test_changed_asset_is_rejected(tmp_path: Path) -> None:
    asset = tmp_path / "asset.bin"
    _ = asset.write_bytes(b"changed")
    manifest = tmp_path / "manifest.json"
    _ = manifest.write_text(json.dumps({
        "schema_version": 1,
        "required_roles": ["fixture"],
        "assets": [{"role": "fixture", "path": "asset.bin", "sha256": "0" * 64}],
    }))
    result = check_manifest(manifest)
    assert result["status"] == "FAIL"
    assert result["failures"] == [{"path": "asset.bin", "failure": "HASH_MISMATCH"}]

