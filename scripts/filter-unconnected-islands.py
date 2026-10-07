#!/usr/bin/env python3
"""Remove disconnected coarse-map land from committed regional terrain assets."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from scipy import ndimage


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def component_labels(manifest: dict, public: Path) -> tuple[np.ndarray, int]:
    layer = next(layer for layer in manifest["layers"] if layer["name"] == "peninsula")
    raw = np.fromfile(public / layer["file"], dtype="<u2").reshape(layer["height"], layer["width"], 2)
    # The overview's second channel uses 0x8000 for sourced sea; use four-neighbor
    # connectivity so diagonal coast contacts do not join disconnected land.
    land = (raw[:, :, 1] & 0x8000) == 0
    labels = np.zeros(land.shape, dtype=np.int32)
    ndimage.label(land, structure=ndimage.generate_binary_structure(2, 1), output=labels)
    count = int(labels.max())
    return labels, count


def filter_assets(public: Path) -> dict:
    manifest_path = public / "regional-terrain.json"
    manifest = json.loads(manifest_path.read_text())
    labels, count = component_labels(manifest, public)
    initial_components = count
    if count == 0:
        raise ValueError("peninsula raster contains no land component")
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    keep_label = int(np.argmax(sizes))
    keep = labels == keep_label
    dropped = (labels != 0) & ~keep
    changed_tiles: list[dict] = []
    unchanged_tiles: list[dict] = []

    for layer in manifest["layers"]:
        if layer["name"] != "peninsula":
            continue
        path = public / layer["file"]
        before = sha(path)
        raster = np.fromfile(path, dtype="<u2").reshape(layer["height"], layer["width"], 2)
        raster[:, :, 1][dropped] = 0x8000
        path.write_bytes(raster.tobytes())
        layer["sha256"] = sha(path)
        layer["minElevation"] = round(float((raster[:, :, 0].astype(np.int32) - 500).min()), 1)
        layer["maxElevation"] = round(float((raster[:, :, 0].astype(np.int32) - 500).max()), 1)
        if np.any(dropped):
            changed_tiles.append({"key": "peninsula", "file": layer["file"], "before": before, "after": layer["sha256"], "samplesChanged": int(np.count_nonzero(dropped))})
        else:
            unchanged_tiles.append({"key": "peninsula", "file": layer["file"], "sha256": layer["sha256"]})

    grid = manifest["detailGrid"]
    west, north = grid["origin"]
    cell, intervals = grid["cellSize"], grid["intervals"]
    peninsula = next(layer for layer in manifest["layers"] if layer["name"] == "peninsula")
    pe0, pn0, pe1, pn1 = peninsula["bboxEPSG5179"]
    changed_samples = 0
    for tile in manifest["detailTiles"]:
        path = public / tile["file"]
        raster = np.fromfile(path, dtype="<u2").reshape(tile["height"], tile["width"], 2)
        before = sha(path)
        x0, _, _, y1 = tile["bboxEPSG5179"]
        east = x0 + np.arange(tile["width"]) * cell / intervals
        northing = y1 - np.arange(tile["height"]) * cell / intervals
        cols = np.rint((east - pe0) / (pe1 - pe0) * (keep.shape[1] - 1)).astype(int)
        rows = np.rint((pn1 - northing) / (pn1 - pn0) * (keep.shape[0] - 1)).astype(int)
        row_grid = np.broadcast_to(rows[:, None], (tile["height"], tile["width"]))
        col_grid = np.broadcast_to(cols[None, :], (tile["height"], tile["width"]))
        valid = (row_grid >= 0) & (row_grid < keep.shape[0]) & (col_grid >= 0) & (col_grid < keep.shape[1])
        component_keep = np.zeros(valid.shape, dtype=bool)
        component_keep[valid] = keep[row_grid[valid], col_grid[valid]]
        # Detail terrain also has sourced sea bit 0x8000. Preserve it and the elevations.
        remove = (raster[:, :, 1] & 0x8000) == 0
        remove &= valid & ~component_keep
        removed_here = int(np.count_nonzero(remove))
        if removed_here:
            raster[:, :, 1][remove] = 0x8000
            path.write_bytes(raster.tobytes())
            tile["sha256"] = sha(path)
            changed_tiles.append({"key": tile["key"], "file": tile["file"], "before": before, "after": tile["sha256"], "samplesChanged": removed_here})
            changed_samples += removed_here
        else:
            unchanged_tiles.append({"key": tile["key"], "file": tile["file"], "sha256": sha(path)})

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")))
    _, after_count = component_labels(manifest, public)
    return {
        "componentsBefore": initial_components,
        "componentsAfter": after_count,
        "mainlandCells": int(sizes[keep_label]),
        "droppedCells": int(np.count_nonzero(dropped)),
        "detailSamplesChanged": changed_samples,
        "changedTiles": changed_tiles,
        "unchangedTiles": unchanged_tiles,
        "waterFeatureCounts": {
            "detailFeatures": sum(len(json.loads((public / tile["waterFile"]).read_text())["features"]) for tile in manifest["detailTiles"]),
            "farFeatures": len(json.loads((public / manifest["farWaterFile"]).read_text())["features"]),
        },
        "manifestSha256": sha(manifest_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--public", type=Path, default=Path(__file__).resolve().parents[1] / "public")
    args = parser.parse_args()
    print(json.dumps(filter_assets(args.public), ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
