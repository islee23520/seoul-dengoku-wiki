#!/usr/bin/env python3
"""Replace OpenFreeMap wildcard fallbacks via bounded PMTiles range reads."""

from __future__ import annotations

import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

from pmtiles.reader import Reader
from pmtiles.tile import Compression


ROOT = Path(__file__).resolve().parent
LOG = ROOT / "_acquisition" / "download-log.jsonl"
PMTILES_URL = (
    "https://btrfs.openfreemap.com/areas/planet/"
    "20260830_080001_pt/tiles.pmtiles"
)


class RangeSource:
    def __init__(self, url: str):
        self.url = url
        self.requests: list[dict[str, int | str]] = []

    def __call__(self, offset: int, length: int) -> bytes:
        with tempfile.TemporaryDirectory(prefix="pmtiles-range-") as temp_dir:
            destination = Path(temp_dir) / "range.bin"
            end = offset + length - 1
            completed = subprocess.run(
                [
                    "/usr/bin/curl",
                    "--fail",
                    "--location",
                    "--silent",
                    "--show-error",
                    "--connect-timeout",
                    "20",
                    "--max-time",
                    "300",
                    "--range",
                    f"{offset}-{end}",
                    "--header",
                    "Accept-Encoding: identity",
                    "--header",
                    'If-Range: "a366bc1c0577d4b388c64f94e73ac860-9145"',
                    "--output",
                    str(destination),
                    self.url,
                ],
                check=False,
            )
            if completed.returncode != 0:
                raise RuntimeError(
                    f"curl exit {completed.returncode} for range {offset}-{end}"
                )
            payload = destination.read_bytes()
            if len(payload) != length:
                raise RuntimeError(
                    f"range length mismatch {offset}-{end}: {len(payload)} != {length}"
                )
            self.requests.append({"offset": offset, "length": length})
            return payload


def sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def main() -> int:
    records = [json.loads(line) for line in LOG.read_text().splitlines()]
    wildcard = [
        record
        for record in records
        if "/mvt/" in record["path"]
        and record["http"].get("x-ofm-debug") == "wildcard PBF planet"
    ]
    if len(wildcard) != 52:
        raise RuntimeError(f"expected 52 wildcard files, found {len(wildcard)}")

    source = RangeSource(PMTILES_URL)
    reader = Reader(source)
    header = reader.header()
    if header["tile_type"].name != "MVT":
        raise RuntimeError(f"unexpected PMTiles tile type: {header['tile_type']}")

    replacement_log = ROOT / "_acquisition" / "pmtiles-range-replacements.jsonl"
    replacement_log.unlink(missing_ok=True)
    for record in wildcard:
        path = ROOT / record["path"]
        z, x, y = map(int, path.parts[-3:][:2] + (path.stem,))
        payload = reader.get(z, x, y)
        if payload is None:
            raise RuntimeError(f"tile missing from fixed PMTiles archive: {z}/{x}/{y}")
        if header["tile_compression"] == Compression.GZIP:
            payload = gzip.decompress(payload)
        old_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temp:
            temp.write(payload)
            temp_path = Path(temp.name)
        os.replace(temp_path, path)
        replacement = {
            "path": record["path"],
            "z": z,
            "x": x,
            "y": y,
            "source": PMTILES_URL,
            "old_wildcard_sha256": old_hash,
            "sha256": sha256(payload),
            "bytes": len(payload),
        }
        with replacement_log.open("a", encoding="utf-8") as log:
            log.write(json.dumps(replacement, sort_keys=True) + "\n")
        print(
            f"OK {z}/{x}/{y} bytes={len(payload)} sha256={replacement['sha256']}",
            flush=True,
        )

    summary = {
        "archive_url": PMTILES_URL,
        "archive_was_not_downloaded": True,
        "archive_header": {
            key: value.name if hasattr(value, "name") else value
            for key, value in header.items()
        },
        "range_request_count": len(source.requests),
        "range_bytes_transferred": sum(
            int(request["length"]) for request in source.requests
        ),
        "range_requests": source.requests,
        "replaced_tile_count": len(wildcard),
    }
    (ROOT / "_acquisition" / "pmtiles-range-summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n"
    )
    print(
        "COMPLETE "
        f"replacements={len(wildcard)} ranges={len(source.requests)} "
        f"range_bytes={summary['range_bytes_transferred']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
