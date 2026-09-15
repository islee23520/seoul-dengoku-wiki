"""Fetch the pinned boundary bytes required to reproduce the regional atlas."""

import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen


def main():
    root = Path(__file__).resolve().parents[3]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=root / "Wikis/game-logic/regions/sources")
    args = parser.parse_args()
    selection = json.loads((args.directory / "selection.json").read_text(encoding="utf-8"))
    selected = selection["selected_boundary"]
    destination = args.directory / "admdongkor-20260701.geojson"
    if destination.exists():
        payload = destination.read_bytes()
    else:
        with urlopen(selected["source_url"], timeout=120) as response:
            payload = response.read(40_000_001)
    digest = hashlib.sha256(payload).hexdigest()
    if digest != selected["sha256"]:
        raise ValueError("Pinned boundary SHA-256 mismatch; existing file was not overwritten")
    if not destination.exists():
        with destination.open("xb") as stream:
            stream.write(payload)
    print(json.dumps({"path": str(destination), "sha256": digest, "bytes": len(payload)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
