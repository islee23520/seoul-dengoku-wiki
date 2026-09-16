#!/usr/bin/env python3
"""Numeric-only portrait library gate. Requires the already installed Pillow.

Usage: python3 Design/portrait-demo/audit-library.py [path/to/library.json]
Exit 0 means numeric checks passed, NOT visual or provenance approval.
"""

import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

from PIL import Image


HERE = Path(__file__).resolve().parent
DEFAULT_MANIFEST = HERE / "assets/v2/library.json"
SLOT_SCHEMA = HERE.parents[1] / "Tool/art/portrait/portrait-layer-slots.json"
SIZE = (1145, 1374)


class AuditError(Exception):
    def __init__(self, code, location, message):
        super().__init__(message)
        self.detail = {"code": code, "location": str(location), "message": message}


def require(condition, code, location, message):
    if not condition:
        raise AuditError(code, location, message)


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        raise AuditError("MANIFEST_READ", path, str(error)) from error


def validate_manifest(manifest, canonical):
    require(isinstance(manifest, dict), "MANIFEST_SCHEMA", "manifest", "Expected an object")
    require(type(manifest.get("version")) is int and manifest["version"] == 1,
            "MANIFEST_SCHEMA", "version", "Expected version 1")
    canvas = manifest.get("canvas")
    require(isinstance(canvas, dict) and canvas.get("width") == SIZE[0] and canvas.get("height") == SIZE[1],
            "MANIFEST_SCHEMA", "canvas", "Expected 1145x1374")
    slots = manifest.get("slots")
    require(isinstance(slots, list) and len(slots) == len(canonical),
            "MANIFEST_SCHEMA", "slots", "Expected all 22 canonical slots")
    for slot in canonical:
        matches = [s for s in slots if isinstance(s, dict) and s.get("id") == slot["id"]]
        require(len(matches) == 1 and type(matches[0].get("z")) is int and matches[0]["z"] == slot["z"],
                "MANIFEST_SCHEMA", slot["id"], "Canonical slot ID/z mismatch")
    sexes = manifest.get("sexes")
    require(isinstance(sexes, dict), "MANIFEST_SCHEMA", "sexes", "Expected female and male records")
    for sex in ("female", "male"):
        record = sexes.get(sex)
        require(isinstance(record, dict) and isinstance(record.get("slots"), dict),
                "MANIFEST_SCHEMA", sex, "Missing slot records")
        entries = record["slots"]
        require(set(entries) == {s["id"] for s in canonical},
                "MANIFEST_SCHEMA", sex, "Expected all 22 canonical slots")
        for slot in canonical:
            location = f'{sex}/{slot["id"]}'
            entry = entries[slot["id"]]
            require(isinstance(entry, dict) and isinstance(entry.get("variants"), list),
                    "MANIFEST_SCHEMA", location, "Expected enabled/variants record")
            enabled = sex != "female" or slot["id"] not in ("beard", "beard_back")
            variants = entry["variants"]
            require(entry.get("enabled") is enabled and (enabled or not variants),
                    "SEX_APPLICABILITY", location, "Female beard/beard_back must be disabled and empty; all other slots enabled")
            require(len(variants) == (10 if enabled else 0), "VARIANT_COUNT", location,
                    f"Expected {10 if enabled else 0} variants, got {len(variants)}")
            ids = set()
            for variant in variants:
                require(isinstance(variant, dict), "MANIFEST_SCHEMA", location, "Expected variant object")
                identifier = variant.get("id")
                require(isinstance(identifier, str) and bool(identifier) and identifier not in ids,
                        "MANIFEST_SCHEMA", location, "Missing or duplicate variant ID")
                ids.add(identifier)
                require(isinstance(variant.get("path"), str) and bool(variant["path"].strip()),
                        "ASSET_PATH", f"{location}/{identifier}", "Expected local relative image path")


def asset_path(root, value, location):
    # Match manifest-relative URL paths, but allow neither remote URLs nor
    # query/fragment aliases. Resolve symlinks before testing containment.
    try:
        decoded = unquote(value, errors="strict")
        url = urlsplit(decoded)
        require(not url.scheme and not url.netloc and not decoded.startswith("/")
                and not any(c in decoded for c in "\\?#\x00")
                and not any(ord(c) < 32 for c in decoded),
                "ASSET_PATH", location, "Expected a local relative path without query or fragment")
        path = (root / decoded).resolve()
        require(path.is_relative_to(root), "ASSET_PATH", location, "Image escapes library directory")
        return path
    except (ValueError, OSError) as error:
        raise AuditError("ASSET_PATH", location, str(error)) from error


def inspect_png(path, location):
    try:
        with path.open("rb") as stream:
            # verify checks PNG integrity; reopen and load to actually decode all pixels.
            with Image.open(stream) as image:
                require(image.format == "PNG", "PNG_FORMAT", location, "Expected PNG data")
                image.verify()
            stream.seek(0)
            with Image.open(stream) as image:
                require(image.size == SIZE, "PNG_DIMENSIONS", location,
                        f"Expected 1145x1374, got {image.width}x{image.height}")
                require(getattr(image, "n_frames", 1) == 1, "PNG_FORMAT", location, "Animated PNG is not a static layer")
                image.load()
                rgba = image.convert("RGBA")
                support = sum(rgba.getchannel("A").histogram()[1:])
                require(support > 0, "EMPTY_SUPPORT", location, "Decoded alpha support is empty")
                # Invisible RGB is not variant content. Preserve every sample at alpha > 0.
                transparent = rgba.getchannel("A").point(lambda alpha: 255 if alpha == 0 else 0)
                rgba.paste((0, 0, 0, 0), mask=transparent)
                return hashlib.sha256(rgba.tobytes()).hexdigest()
    except (FileNotFoundError, IsADirectoryError, PermissionError) as error:
        raise AuditError("ASSET_READ", location, str(error)) from error
    except (OSError, ValueError, SyntaxError, Image.DecompressionBombError) as error:
        raise AuditError("PNG_DECODE", location, str(error)) from error


def audit_library(manifest_path):
    report = {
        "manifest": str(manifest_path),
        "numericAcceptance": "RED",
        "visualAcceptance": "NOT VERIFIED",
        "provenanceAcceptance": "NOT VERIFIED",
        "provenanceReason": "The v1 UI library contract defines no machine-readable provenance fields. Recipe target/asset sha256 fields belong to a separate recipe format, not this library.",
        "variantsChecked": 0,
        "errors": [],
    }
    try:
        manifest = read_json(manifest_path)
        canonical = read_json(SLOT_SCHEMA)["slots"]
        validate_manifest(manifest, canonical)
        root = manifest_path.parent.resolve()
        decoded = {}
        for sex in ("female", "male"):
            for slot in canonical:
                seen = {}
                for variant in manifest["sexes"][sex]["slots"][slot["id"]]["variants"]:
                    location = f'{sex}/{slot["id"]}/{variant["id"]}'
                    path = asset_path(root, variant["path"], location)
                    if path not in decoded:
                        decoded[path] = inspect_png(path, location)
                    digest = decoded[path]
                    require(digest not in seen, "DUPLICATE_PIXELS", location,
                            f"Identical decoded RGBA to {seen.get(digest)} in the same sex/slot")
                    seen[digest] = variant["id"]
                    report["variantsChecked"] += 1
        report["numericAcceptance"] = "GREEN"
    except AuditError as error:
        report["errors"].append(error.detail)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", nargs="?", type=Path, default=DEFAULT_MANIFEST)
    args = parser.parse_args()
    # Keep the explicit manifest's parent as the URL base, even if it is a symlink.
    report = audit_library(args.manifest.absolute())
    print(json.dumps(report, indent=2))
    return 0 if report["numericAcceptance"] == "GREEN" else 1


if __name__ == "__main__":
    raise SystemExit(main())
