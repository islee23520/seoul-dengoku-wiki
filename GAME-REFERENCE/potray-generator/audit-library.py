#!/usr/bin/env python3
"""Numeric-only portrait library gate. Requires the already installed Pillow.

Usage: python3 Design/potrait-generator/audit-library.py [path/to/library.json]
Exit 0 means numeric checks passed, NOT visual or provenance approval.
"""

import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from PIL import Image


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DEFAULT_MANIFEST = HERE / "assets/v2/library.json"
SLOT_SCHEMA = HERE.parents[1] / "Tool/art/portrait/portrait-layer-slots.json"
SIZE = (1145, 1374)
SHA256 = re.compile(r"^[0-9a-f]{64}$")
SELECTABLE = {"bg", "face_base", "mouth", "nose", "eyes_white", "eyes_shape", "eyes_color", "clothes", "headgear", "acc_eye", "frame"}
MULTIPLY_ELIGIBLE = {"cheeks", "chin"}
ALLOWED_BLEND_MODES = {"source-over", "multiply"}
MODES = {
    "female": {
        **{slot: "selectable" for slot in SELECTABLE},
        "clothes_back": "companion", "headgear_back": "companion", "hair_back": "companion",
        "beard_back": "disabled", "neck": "fixed", "cheeks": "companion", "chin": "companion",
        "ears": "fixed", "headgear_mid": "companion", "beard": "disabled", "hair": "selectable",
        "clothes_front": "companion",
    },
    "male": {
        **{slot: "selectable" for slot in SELECTABLE},
        "clothes_back": "companion", "headgear_back": "companion", "hair_back": "disabled",
        "beard_back": "disabled", "neck": "fixed", "cheeks": "companion", "chin": "companion",
        "ears": "fixed", "headgear_mid": "companion", "beard": "fixed", "hair": "selectable",
        "clothes_front": "companion",
    },
}


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


def raw_sha256(path, location):
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except (OSError, ValueError) as error:
        raise AuditError("ASSET_READ", location, str(error)) from error


def alpha_sha256(path, location):
    try:
        with Image.open(path) as image:
            image.load()
            return hashlib.sha256(image.convert("RGBA").getchannel("A").tobytes()).hexdigest()
    except (OSError, ValueError, SyntaxError, Image.DecompressionBombError) as error:
        raise AuditError("PNG_DECODE", location, str(error)) from error


def bound_path(root, value, location):
    require(isinstance(value, str) and value, "EVIDENCE_POLICY", location, "Expected a bound evidence path")
    for base in (root, REPO):
        path = (base / value).resolve()
        if path.is_relative_to(base.resolve()) and path.is_file():
            return path
    raise AuditError("EVIDENCE_POLICY", location, f"Bound evidence file is missing: {value}")


def accepted_record(path, location):
    text = path.read_text(encoding="utf-8")
    status_match = re.search(r'(?:^#\s+|Status:\s*\**`?|"status"\s*:\s*")([^\n"`*]+)', text, re.MULTILINE)
    status = status_match.group(1).strip() if status_match else ""
    if not re.search(r'\bLEAD_(?:ACCEPTED|APPROVED)|\b(?:SELF_REVIEW_)?PASS\b', status):
        token = re.search(r'\bLEAD_(?:ACCEPTED|APPROVED)(?:_[A-Z0-9]+)*\b', text)
        if token: status = token.group(0)
    require(not re.search(r'\b(?:REJECTED|REJECTION)(?:_[A-Z0-9]+)*\b', status, re.IGNORECASE),
            "EVIDENCE_POLICY", location, "Evidence status is rejected")
    accepted = re.search(r'\bLEAD_(?:ACCEPTED|APPROVED)(?:_[A-Z0-9]+)*\b|\b(?:SELF_REVIEW_)?PASS\b', status)
    require(bool(accepted), "EVIDENCE_POLICY", location,
            "Evidence record does not affirm an accepted PASS status")


def validate_source_policy(root, variant, location, asset_digest):
    source = variant.get("source")
    identity = variant.get("source_identity")
    require(isinstance(source, str) and isinstance(identity, dict), "EVIDENCE_POLICY", location,
            "Expected source and source_identity")
    if "acceptance_record" in identity or "candidate" in identity:
        record = bound_path(root, identity.get("acceptance_record"), location)
        candidate = bound_path(root, identity.get("candidate"), location)
        require(SHA256.fullmatch(str(identity.get("acceptance_record_sha256", "")))
                and raw_sha256(record, location) == identity["acceptance_record_sha256"],
                "EVIDENCE_POLICY", location, "Acceptance record sha256 mismatch")
        require(SHA256.fullmatch(str(identity.get("candidate_sha256", "")))
                and raw_sha256(candidate, location) == identity["candidate_sha256"] == asset_digest,
                "EVIDENCE_POLICY", location, "Accepted candidate sha256 mismatch")
        accepted_record(record, location)
        return
    if source in ("authored-deterministic", "derived-multiply-detail"):
        script = bound_path(root, identity.get("generating_script"), location)
        require(SHA256.fullmatch(str(identity.get("generating_script_sha256", "")))
                and raw_sha256(script, location) == identity["generating_script_sha256"],
                "EVIDENCE_POLICY", location, "Generating script sha256 mismatch")
        if source == "derived-multiply-detail":
            candidate = bound_path(root, identity.get("source_candidate"), location)
            require(SHA256.fullmatch(str(identity.get("source_candidate_sha256", "")))
                    and raw_sha256(candidate, location) == identity["source_candidate_sha256"],
                    "EVIDENCE_POLICY", location, "Multiply detail source sha256 mismatch")
        return
    keys = ("plate", "sha256") if source == "accepted-stage1-plate" else ("source_plate", "source_plate_sha256")
    require(source in ("accepted-stage1-plate", "accepted-gate1-foundation"),
            "EVIDENCE_POLICY", location, f"Unaccepted source kind: {source}")
    source_path = bound_path(root, identity.get(keys[0]), location)
    require(SHA256.fullmatch(str(identity.get(keys[1], "")))
            and raw_sha256(source_path, location) == identity[keys[1]] == asset_digest,
            "EVIDENCE_POLICY", location, "Foundation source sha256 mismatch")


def validate_manifest(manifest, canonical):
    require(isinstance(manifest, dict), "MANIFEST_SCHEMA", "manifest", "Expected an object")
    require(type(manifest.get("version")) is int and manifest["version"] == 1,
            "MANIFEST_SCHEMA", "version", "Expected version 1")
    contract_required = manifest.get("minimum_contract_policy") == "required"
    canvas = manifest.get("canvas")
    require(isinstance(canvas, dict) and canvas.get("width") == SIZE[0] and canvas.get("height") == SIZE[1],
            "MANIFEST_SCHEMA", "canvas", "Expected 1145x1374")
    slots = manifest.get("slots")
    require(isinstance(slots, list) and len(slots) == len(canonical),
            "MANIFEST_SCHEMA", "slots", "Expected every canonical slot")
    for slot in canonical:
        matches = [s for s in slots if isinstance(s, dict) and s.get("id") == slot["id"]]
        require(len(matches) == 1 and type(matches[0].get("z")) is int and matches[0]["z"] == slot["z"],
                "MANIFEST_SCHEMA", slot["id"], "Canonical slot ID/z mismatch")
    bundles = manifest.get("logical_bundles")
    require(isinstance(bundles, dict), "MANIFEST_SCHEMA", "logical_bundles", "Expected logical bundle records")
    expected_bundles = {
        "clothes": {"primary": "clothes", "members": ["clothes_back", "clothes", "clothes_front"]},
        "hair": {"primary": "hair", "members": ["hair_back", "hair"]},
        "face_shape": {"primary": "face_base", "members": ["face_base", "cheeks", "chin"]},
    }
    for bundle_id, expected_bundle in expected_bundles.items():
        bundle = bundles.get(bundle_id)
        require(isinstance(bundle, dict) and bundle.get("primary") == expected_bundle["primary"]
                and bundle.get("members") == expected_bundle["members"], "MANIFEST_SCHEMA", bundle_id,
                "Logical bundle primary/members mismatch")
    sexes = manifest.get("sexes")
    require(isinstance(sexes, dict), "MANIFEST_SCHEMA", "sexes", "Expected female and male records")
    for sex in ("female", "male"):
        record = sexes.get(sex)
        require(isinstance(record, dict) and isinstance(record.get("slots"), dict),
                "MANIFEST_SCHEMA", sex, "Missing slot records")
        entries = record["slots"]
        require(set(entries) == {s["id"] for s in canonical},
                "MANIFEST_SCHEMA", sex, "Expected every canonical slot")
        for slot in canonical:
            location = f'{sex}/{slot["id"]}'
            entry = entries[slot["id"]]
            require(isinstance(entry, dict) and isinstance(entry.get("variants"), list),
                    "MANIFEST_SCHEMA", location, "Expected mode/enabled/variants record")
            mode = MODES[sex][slot["id"]]
            variants = entry["variants"]
            require(entry.get("mode") == mode and entry.get("enabled") is (mode != "disabled"),
                    "SLOT_MODE", location, f"Expected mode {mode}")
            if mode == "selectable":
                require(len(variants) >= 1, "VARIANT_COUNT", location,
                        f"Expected at least 1 variant, got {len(variants)}")
            elif mode == "fixed":
                require(len(variants) == 1, "VARIANT_COUNT", location,
                        f"Expected exactly 1 fixed variant, got {len(variants)}")
            elif mode == "disabled":
                require(len(variants) == 0, "VARIANT_COUNT", location,
                        f"Expected 0 disabled variants, got {len(variants)}")
            ids = set()
            for variant in variants:
                require(isinstance(variant, dict), "MANIFEST_SCHEMA", location, "Expected variant object")
                identifier = variant.get("id")
                require(isinstance(identifier, str) and bool(identifier) and identifier not in ids,
                        "MANIFEST_SCHEMA", location, "Missing or duplicate variant ID")
                ids.add(identifier)
                require(isinstance(variant.get("path"), str) and bool(variant["path"].strip()),
                        "ASSET_PATH", f"{location}/{identifier}", "Expected local relative image path")
                require(SHA256.fullmatch(str(variant.get("sha256", ""))), "ASSET_SHA256",
                        f"{location}/{identifier}", "Expected lowercase sha256")
                contract = variant.get("minimum_contract")
                if contract_required:
                    require(isinstance(contract, dict) and contract.get("status") == "PASS"
                            and isinstance(contract.get("record"), str)
                            and SHA256.fullmatch(str(contract.get("record_sha256", ""))),
                            "MINIMUM_CONTRACT", f"{location}/{identifier}",
                            "Production variants require a hash-bound minimum-contract PASS")
                validity = variant.get("slot_validity")
                if manifest.get("slot_validity_policy") == "gates-1-4":
                    require(isinstance(validity, dict) and validity.get("policy") == "gates-1-4"
                            and validity.get("status") in ("verified", "provisional"),
                            "SLOT_VALIDITY", f"{location}/{identifier}",
                            "Slot components require a gates-1-4 validity record")
                    gates = validity.get("gates")
                    require(gates is None or (isinstance(gates, dict)
                            and all(gates.get(g) in ("PASS", "FAIL", "PENDING", "BLOCKED") for g in gates)),
                            "SLOT_VALIDITY", f"{location}/{identifier}", "Gate chain statuses malformed")
                    if validity.get("status") == "verified":
                        require(isinstance(gates, dict) and all(gates.get(g) == "PASS" for g in ("gate1", "gate2", "gate3", "gate4")),
                                "SLOT_VALIDITY", f"{location}/{identifier}",
                                "verified slot validity requires all four gates PASS")
                blend_mode = variant.get("blend_mode", "source-over")
                require(blend_mode in ALLOWED_BLEND_MODES, "BLEND_MODE", f"{location}/{identifier}",
                        f"Unsupported blend mode: {blend_mode}")
                require(blend_mode != "multiply" or slot["id"] in MULTIPLY_ELIGIBLE,
                        "BLEND_MODE", f"{location}/{identifier}", "Slot is not eligible for multiply")
                if slot["id"] in MULTIPLY_ELIGIBLE:
                    require(blend_mode == "multiply", "BLEND_MODE", f"{location}/{identifier}",
                            "Facial detail must use multiply")
                if slot["id"] == "eyes_color":
                    require(blend_mode == "source-over", "BLEND_MODE", f"{location}/{identifier}",
                            "eyes_color must remain source-over")
                if slot["id"] == "eyes_white":
                    require(blend_mode == "source-over", "BLEND_MODE", f"{location}/{identifier}",
                            "eyes_white must remain source-over")
                if slot["id"] == "eyes_shape":
                    require(blend_mode == "source-over", "BLEND_MODE", f"{location}/{identifier}",
                            "eyes_shape owns sclera and must remain source-over")
                if slot["id"] in ("mouth", "nose"):
                    require(blend_mode == "source-over", "BLEND_MODE", f"{location}/{identifier}",
                            f"{slot['id']} is part of the visible face family and must remain source-over")
                if mode == "companion":
                    link = variant.get("companion_of")
                    targets = link.get("variants") if isinstance(link, dict) and isinstance(link.get("variants"), list) else [link.get("variant") if isinstance(link, dict) else None]
                    require(isinstance(link, dict) and isinstance(link.get("slot"), str)
                            and bool(targets) and all(isinstance(target, str) for target in targets), "SLOT_MODE", location,
                            "Companion variants require companion_of variant/variants")
                else:
                    require("companion_of" not in variant, "SLOT_MODE", location,
                            "Only companion slots may carry companion_of")
                conditions = set()
                for override in variant.get("render_overrides", []):
                    override_location = f"{location}/{identifier}/render_override"
                    require(isinstance(override, dict) and isinstance(override.get("when"), dict),
                            "MANIFEST_SCHEMA", override_location, "Expected render override condition")
                    condition = override["when"]
                    target_slot = condition.get("slot")
                    target_variant = condition.get("variant")
                    require(isinstance(target_slot, str) and isinstance(target_variant, str)
                            and target_slot != slot["id"], "MANIFEST_SCHEMA", override_location,
                            "Render override requires another slot and variant")
                    target = entries.get(target_slot)
                    require(isinstance(target, dict) and target.get("enabled") is True
                            and any(candidate.get("id") == target_variant for candidate in target.get("variants", [])),
                            "MANIFEST_SCHEMA", override_location, "Render override target does not exist")
                    key = (target_slot, target_variant)
                    require(key not in conditions, "MANIFEST_SCHEMA", override_location,
                            "Duplicate render override condition")
                    conditions.add(key)
                    require(isinstance(override.get("path"), str) and override["path"].strip(),
                            "ASSET_PATH", override_location, "Expected render override image path")
                    require(SHA256.fullmatch(str(override.get("sha256", ""))), "ASSET_SHA256",
                            override_location, "Expected render override sha256")


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


def inspect_png(path, location, allow_empty, multiply=False):
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
                require(support > 0 or allow_empty, "EMPTY_SUPPORT", location, "Decoded alpha support is empty")
                if multiply:
                    pixel_bytes = rgba.tobytes()
                    for index in range(0, len(pixel_bytes), 4):
                        red, green, blue, alpha = pixel_bytes[index:index + 4]
                        require(alpha == 0 or max(red, green, blue) - min(red, green, blue) <= 1,
                                "MULTIPLY_GRAYSCALE", location, "Multiply RGB must be neutral grayscale")
                # Invisible RGB is not variant content. Preserve every sample at alpha > 0.
                transparent = rgba.getchannel("A").point(lambda alpha: 255 if alpha == 0 else 0)
                rgba.paste((0, 0, 0, 0), mask=transparent)
                return hashlib.sha256(rgba.tobytes()).hexdigest(), support
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
        "provenanceReason": "Raw asset sha256 and accepted source records have not yet been verified.",
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
                entry = manifest["sexes"][sex]["slots"][slot["id"]]
                for variant in entry["variants"]:
                    location = f'{sex}/{slot["id"]}/{variant["id"]}'
                    contract = variant.get("minimum_contract")
                    if manifest.get("minimum_contract_policy") == "required":
                        contract_record = bound_path(root, contract["record"], f"{location}/minimum_contract")
                        require(raw_sha256(contract_record, f"{location}/minimum_contract") == contract["record_sha256"],
                                "MINIMUM_CONTRACT", location, "Minimum-contract record sha256 mismatch")
                    path = asset_path(root, variant["path"], location)
                    asset_digest = raw_sha256(path, location)
                    require(asset_digest == variant["sha256"], "ASSET_SHA256", location,
                            "Raw file sha256 does not match manifest")
                    validate_source_policy(root, variant, location, asset_digest)
                    if variant.get("source") == "derived-multiply-detail":
                        source_path = bound_path(root, variant["source_identity"].get("source_candidate"), location)
                        require(alpha_sha256(path, location) == alpha_sha256(source_path, location),
                                "MULTIPLY_ALPHA", location, "Multiply derivation changed alpha")
                    is_multiply = variant.get("blend_mode", "source-over") == "multiply"
                    allow_empty = variant.get("empty") is True and (not is_multiply or variant.get("intentionally_empty") is True)
                    decoded_key = (path, is_multiply)
                    if decoded_key not in decoded:
                        decoded[decoded_key] = inspect_png(path, location, allow_empty, is_multiply)
                    digest, support = decoded[decoded_key]
                    require((support == 0) is (variant.get("empty") is True), "EMPTY_SUPPORT", location,
                            "empty marker does not match decoded alpha support")
                    require(digest not in seen, "DUPLICATE_PIXELS", location,
                            f"Identical decoded RGBA to {seen.get(digest)} in the same sex/slot")
                    seen[digest] = variant["id"]
                    report["variantsChecked"] += 1
                    for override in variant.get("render_overrides", []):
                        override_location = f'{location}/render_override/{override["when"]["slot"]}/{override["when"]["variant"]}'
                        if manifest.get("minimum_contract_policy") == "required":
                            contract = override.get("minimum_contract")
                            require(isinstance(contract, dict) and contract.get("status") == "PASS",
                                    "MINIMUM_CONTRACT", override_location, "Render override minimum-contract PASS missing")
                            contract_record = bound_path(root, contract.get("record"), f"{override_location}/minimum_contract")
                            require(raw_sha256(contract_record, f"{override_location}/minimum_contract") == contract.get("record_sha256"),
                                    "MINIMUM_CONTRACT", override_location, "Render override minimum-contract record sha256 mismatch")
                        override_path = asset_path(root, override["path"], override_location)
                        override_digest = raw_sha256(override_path, override_location)
                        require(override_digest == override["sha256"], "ASSET_SHA256", override_location,
                                "Raw render override sha256 does not match manifest")
                        validate_source_policy(root, override, override_location, override_digest)
                        inspect_png(override_path, override_location, False, override.get("blend_mode", variant.get("blend_mode", "source-over")) == "multiply")
                        report["variantsChecked"] += 1
        for sex in ("female", "male"):
            entries = manifest["sexes"][sex]["slots"]
            for face in entries["face_base"]["variants"]:
                for detail_slot in ("cheeks", "chin"):
                    matches = []
                    for detail in entries[detail_slot]["variants"]:
                        link = detail.get("companion_of", {})
                        targets = link.get("variants", [link.get("variant")])
                        if link.get("slot") == "face_base" and face["id"] in targets:
                            matches.append(detail)
                    require(len(matches) <= 1, "FACE_SHAPE_BUNDLE", f'{sex}/face_base/{face["id"]}',
                            f"Expected zero or one {detail_slot} member")
                    if matches:
                        face_path = asset_path(root, face["path"], f'{sex}/face_base/{face["id"]}')
                        detail_path = asset_path(root, matches[0]["path"], f'{sex}/{detail_slot}/{matches[0]["id"]}')
                        with Image.open(face_path) as face_image, Image.open(detail_path) as detail_image:
                            face_alpha = face_image.convert("RGBA").getchannel("A").tobytes()
                            detail_alpha = detail_image.convert("RGBA").getchannel("A").tobytes()
                            outside = sum(1 for detail_value, face_value in zip(detail_alpha, face_alpha)
                                          if detail_value and not face_value)
                        require(outside == 0, "FACE_SHAPE_SUPPORT", f'{sex}/{detail_slot}/{matches[0]["id"]}',
                                "Face detail adds support outside active face_base alpha")
        report["numericAcceptance"] = "GREEN"
        report["provenanceAcceptance"] = "VERIFIED"
        report["provenanceReason"] = "Raw asset sha256 and accepted source bindings verified."
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
