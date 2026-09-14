#!/usr/bin/env python3
"""Generate NanoBanana/Gemini identity sheets for the three POC characters."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_ROOT = ROOT / "Game" / "Assets" / "Janseon" / "Art" / "Staging" / "Characters"
EVIDENCE = ROOT / ".omo" / "evidence" / "unity-poc-core-loop" / "task-15-characters"
MODEL = "gemini-2.5-flash-image"
ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

CHARACTERS = {
    "poc-explorer": {
        "title": "explorer leader",
        "prompt": """Use case: identity-lock turnaround
Asset type: four-view character identity sheet for a Korean post-collapse grand-strategy SRPG
Subject: unnamed Korean expedition leader, late 20s, short black hair, tired determined eyes, compact 2.5-head-tall SD body with oversized identity-bearing pixel-readable head
Equipment lock: prybar held in the character's RIGHT hand, oil lantern clipped on the character's LEFT hip, radio antenna on the character's LEFT shoulder. Do not mirror equipment.
Medium and style: original pixel-readable SD character turnaround, limited palette teal coat #2F6F73 with burnt-orange lining #C45C32, matte salvage cloth, no painterly blur
Composition and camera: single image, four orthographic views labeled only by silhouette order left-to-right N, E, S, W, white or transparent background, full body, one-tile footprint, no UI
Lighting and color: flat even light, no drop shadow, no rim light
Mood: practical, cautious, working
Background: empty
Constraints: Korean facial identity; practical modern salvage clothing; profession before combat power; no logo, no watermark, no readable text
Avoid: generic samurai armor, fantasy oversize weapon, mirrored lantern, mirrored prybar, photoreal 8-head proportions""",
    },
    "poc-medic": {
        "title": "medic companion",
        "prompt": """Use case: identity-lock turnaround
Asset type: four-view character identity sheet for a Korean post-collapse grand-strategy SRPG
Subject: unnamed Korean field medic, early 30s, tied brown hair, focused compassionate eyes, compact 2.5-head-tall SD body with oversized identity-bearing head
Equipment lock: splint kit in the character's RIGHT hand, canvas satchel on the character's LEFT hip, red cloth knot on the character's RIGHT upper arm. Do not mirror equipment.
Medium and style: original pixel-readable SD character turnaround, limited palette olive coat #6E8F6A with cream apron #E7D7B1 and red knot #C43C3C
Composition and camera: single image, four orthographic views left-to-right N, E, S, W, empty background, full body, one-tile footprint
Lighting and color: flat even light
Mood: tired care, restrained urgency
Background: empty
Constraints: Korean facial identity; medical salvage clothing; no logo, no watermark, no readable text, no red-cross trademark
Avoid: mirrored satchel, mirrored arm knot, glossy doll skin, fantasy staff""",
    },
    "poc-patrol": {
        "title": "patrol enemy",
        "prompt": """Use case: identity-lock turnaround
Asset type: four-view character identity sheet for a Korean post-collapse grand-strategy SRPG
Subject: unnamed station patrol, mid 20s, square visor helmet, compact 2.5-head-tall SD body with oversized head
Equipment lock: short baton in the character's RIGHT hand, lime hazard bar on the character's LEFT chest, visor lamp on the character's LEFT helmet side. Do not mirror equipment.
Medium and style: original pixel-readable SD character turnaround, limited palette charcoal #2A2E33 with lime accent #C6D64A
Composition and camera: single image, four orthographic views left-to-right N, E, S, W, empty background, full body, one-tile footprint
Lighting and color: flat even light
Mood: watchful, impersonal
Background: empty
Constraints: Korean facial identity under visor; salvage patrol gear; no logo, no watermark, no readable text
Avoid: mirrored hazard bar, mirrored lamp, samurai armor, fantasy rifle""",
    },
}


def sha256_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()


def extract_image(payload: dict) -> bytes | None:
    for candidate in payload.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                import base64

                return base64.b64decode(inline["data"])
    return None


def generate(prompt: str) -> tuple[bytes | None, dict]:
    key = os.environ.get("GOOGLE_API_KEY", "")
    if not key:
        return None, {"ok": False, "error": "GOOGLE_API_KEY missing"}
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }
    req = urllib.request.Request(
        f"{ENDPOINT}?key={key}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        return None, {"ok": False, "error": f"HTTP {error.code}", "detail": detail[:2000]}
    except Exception as error:  # noqa: BLE001
        return None, {"ok": False, "error": type(error).__name__, "detail": str(error)}
    image = extract_image(payload)
    if image is None:
        return None, {"ok": False, "error": "no_image_in_response", "payload_keys": list(payload.keys())}
    return image, {"ok": True, "model": MODEL, "bytes": len(image)}


def main() -> int:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    receipts = []
    for asset_id, spec in CHARACTERS.items():
        prompt = spec["prompt"]
        image, receipt = generate(prompt)
        prompt_hash = sha256_bytes(prompt.encode("utf-8"))
        record = {
            "asset_id": asset_id,
            "title": spec["title"],
            "model": MODEL,
            "prompt_hash": prompt_hash,
            "cost_mode": "subscription",
            "cost_cents": 0,
            **receipt,
        }
        identity_dir = OUT_ROOT / asset_id / "identity"
        identity_dir.mkdir(parents=True, exist_ok=True)
        (identity_dir / "identity-prompt.txt").write_text(prompt + "\n", encoding="utf-8")
        if image is not None:
            dest = identity_dir / "identity-sheet-gemini.png"
            dest.write_bytes(image)
            record["sha256"] = sha256_bytes(image)
            record["path"] = str(dest.relative_to(ROOT))
        receipts.append(record)
        time.sleep(1)
    out = EVIDENCE / "identity-gemini-receipt.json"
    out.write_text(json.dumps(receipts, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipts, indent=2))
    return 0 if all(item.get("ok") for item in receipts) else 2


if __name__ == "__main__":
    sys.exit(main())
