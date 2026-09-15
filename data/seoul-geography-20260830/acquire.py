#!/usr/bin/env python3
"""Acquire the bounded Seoul geography source bundle without retry loops."""

from __future__ import annotations

import concurrent.futures
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading


ROOT = Path(__file__).resolve().parent
LOG_DIR = ROOT / "_acquisition"
LOG_PATH = LOG_DIR / "download-log.jsonl"
TILE_VERSION = "20260830_080001_pt"
LOCK = threading.Lock()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_headers(path: Path) -> dict[str, str]:
    blocks: list[dict[str, str]] = []
    current: dict[str, str] = {}
    for raw_line in path.read_text(encoding="iso-8859-1").splitlines():
        line = raw_line.strip()
        if line.startswith("HTTP/"):
            if current:
                blocks.append(current)
            current = {":status-line": line}
        elif ":" in line:
            key, value = line.split(":", 1)
            current[key.strip().lower()] = value.strip()
    if current:
        blocks.append(current)
    return blocks[-1] if blocks else {}


def download(url: str, relative_path: str) -> dict[str, object]:
    destination = ROOT / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="seoul-acquire-", dir=LOG_DIR) as temp_dir:
        temp = Path(temp_dir) / "payload"
        headers_file = Path(temp_dir) / "headers"
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
                "1800",
                "--dump-header",
                str(headers_file),
                "--output",
                str(temp),
                url,
            ],
            check=False,
        )
        if completed.returncode != 0:
            raise RuntimeError(f"curl exit {completed.returncode}: {url}")

        downloaded_hash = sha256(temp)
        action = "downloaded"
        if destination.exists():
            existing_hash = sha256(destination)
            if existing_hash != downloaded_hash:
                raise RuntimeError(
                    f"existing file differs; preserved without overwrite: {relative_path}"
                )
            action = "reused-after-byte-verification"
        else:
            os.replace(temp, destination)

        headers = parse_headers(headers_file)
        record: dict[str, object] = {
            "accessed_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
            "url": url,
            "path": relative_path,
            "action": action,
            "bytes": destination.stat().st_size,
            "sha256": downloaded_hash,
            "http": {
                key: headers[key]
                for key in (
                    ":status-line",
                    "content-type",
                    "content-length",
                    "content-encoding",
                    "last-modified",
                    "etag",
                    "x-amz-meta-x-imagery-sources",
                    "x-ofm-debug",
                )
                if key in headers
            },
        }
        with LOCK:
            with LOG_PATH.open("a", encoding="utf-8") as log:
                log.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
            print(
                f"OK {relative_path} bytes={record['bytes']} "
                f"sha256={downloaded_hash} action={action}",
                flush=True,
            )
        return record


def preserve_verified_prior_download(
    url: str, relative_path: str, expected_sha256: str, accessed_at_utc: str
) -> dict[str, object]:
    """Record a byte-verified file obtained by an earlier monitored invocation."""
    destination = ROOT / relative_path
    actual_sha256 = sha256(destination)
    if actual_sha256 != expected_sha256:
        raise RuntimeError(f"prior download checksum mismatch: {relative_path}")
    record: dict[str, object] = {
        "accessed_at_utc": accessed_at_utc,
        "url": url,
        "path": relative_path,
        "action": "preserved-verified-prior-download",
        "bytes": destination.stat().st_size,
        "sha256": actual_sha256,
        "http": {"content-type": "text/html; charset=utf-8"},
    }
    with LOG_PATH.open("a", encoding="utf-8") as log:
        log.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
    print(
        f"OK {relative_path} bytes={record['bytes']} sha256={actual_sha256} "
        "action=preserved-verified-prior-download",
        flush=True,
    )
    return record


def main() -> int:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    LOG_PATH.unlink(missing_ok=True)

    fixed_sources = [
        (
            "https://btrfs.openfreemap.com/areas/planet/"
            f"{TILE_VERSION}/osm_date",
            "openfreemap/release/osm_date",
        ),
        (
            "https://raw.githubusercontent.com/hyperknot/openfreemap/main/README.md",
            "licenses/openfreemap-README.md",
        ),
        (
            "https://raw.githubusercontent.com/hyperknot/openfreemap/main/LICENSE.md",
            "licenses/openfreemap-LICENSE.md",
        ),
        (
            "https://opendatacommons.org/licenses/odbl/odbl-10.txt",
            "licenses/ODbL-1.0.txt",
        ),
        (
            "https://download.bbbike.org/osm/bbbike/Seoul/Seoul.osm.pbf",
            "osm-current-bbbike/Seoul.osm.pbf",
        ),
        (
            "https://download.bbbike.org/osm/bbbike/Seoul/Seoul.poly",
            "osm-current-bbbike/Seoul.poly",
        ),
        (
            "https://raw.githubusercontent.com/southkorea/seoul-maps/master/"
            "kostat/2013/json/seoul_municipalities_geo.json",
            "boundaries-kostat-2013/seoul_municipalities_geo.json",
        ),
        (
            "https://raw.githubusercontent.com/southkorea/seoul-maps/master/"
            "kostat/2013/json/seoul_municipalities_geo_simple.json",
            "boundaries-kostat-2013/seoul_municipalities_geo_simple.json",
        ),
        (
            "https://raw.githubusercontent.com/southkorea/seoul-maps/master/README.md",
            "licenses/southkorea-seoul-maps-README.md",
        ),
        (
            "https://www.apache.org/licenses/LICENSE-2.0.txt",
            "licenses/Apache-2.0.txt",
        ),
        (
            "https://raw.githubusercontent.com/tilezen/joerd/master/docs/attribution.md",
            "licenses/mapzen-terrain-attribution.md",
        ),
        (
            "https://raw.githubusercontent.com/tilezen/joerd/master/docs/formats.md",
            "licenses/mapzen-terrain-formats.md",
        ),
        (
            "https://raw.githubusercontent.com/tilezen/joerd/master/docs/data-sources.md",
            "licenses/mapzen-terrain-data-sources.md",
        ),
    ]

    terrain_sources = [
        (
            f"https://s3.amazonaws.com/elevation-tiles-prod/geotiff/11/{x}/{y}.tif",
            f"terrain-mapzen-geotiff/z11/{x}/{y}.tif",
        )
        for x in range(1745, 1748)
        for y in range(792, 795)
    ]

    preserve_verified_prior_download(
        "https://www.openstreetmap.org/copyright",
        "licenses/openstreetmap-copyright.html",
        "dffb9cce1cd61f5ab77ddb965a714f669c5783f59c21048210280ac06030e160",
        "2026-09-08T08:33:34.181048+00:00",
    )
    for source in fixed_sources:
        download(*source)
    for source in terrain_sources:
        download(*source)

    tile_sources = [
        (
            f"https://tiles.openfreemap.org/planet/{TILE_VERSION}/14/{x}/{y}.pbf",
            f"openfreemap/mvt/{TILE_VERSION}/14/{x}/{y}.pbf",
        )
        for x in range(13960, 13981)
        for y in range(6337, 6354)
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(download, *source) for source in tile_sources]
        for future in concurrent.futures.as_completed(futures):
            future.result()

    print(f"COMPLETE downloads={len(fixed_sources) + len(terrain_sources) + len(tile_sources)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR {error}", file=sys.stderr, flush=True)
        raise
