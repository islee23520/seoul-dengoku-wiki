#!/usr/bin/env python3
"""Validate acquired source bytes and write manifest.json."""

from __future__ import annotations

import datetime as dt
import hashlib
import json
from math import atan, degrees, pi, sinh
from pathlib import Path

import mapbox_vector_tile
import osmium
import rasterio


ROOT = Path(__file__).resolve().parent
REQUESTED_BBOX = [126.76, 37.42, 127.19, 37.70]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tile_envelope(z: int, x_min: int, x_max: int, y_min: int, y_max: int):
    lon = lambda x: x / (2**z) * 360 - 180
    lat = lambda y: degrees(atan(sinh(pi * (1 - 2 * y / (2**z)))))
    return [lon(x_min), lat(y_max + 1), lon(x_max + 1), lat(y_min)]


def acquisition_records() -> dict[str, dict]:
    records = {}
    for line in (ROOT / "_acquisition/download-log.jsonl").read_text().splitlines():
        record = json.loads(line)
        records[record["path"]] = record
    return records


def file_record(path: Path, acquired: dict[str, dict], **extra) -> dict:
    relative = str(path.relative_to(ROOT))
    source = acquired.get(relative, {})
    return {
        "path": relative,
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "source_url": source.get("url"),
        "accessed_at_utc": source.get("accessed_at_utc"),
        "http": source.get("http", {}),
        **extra,
    }


class OsmStats(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.nodes = 0
        self.ways = 0
        self.relations = 0
        self.highways = 0
        self.buildings = 0

    def node(self, _):
        self.nodes += 1

    def way(self, way):
        self.ways += 1
        self.highways += int("highway" in way.tags)
        self.buildings += int("building" in way.tags)

    def relation(self, relation):
        self.relations += 1
        self.highways += int("highway" in relation.tags)
        self.buildings += int("building" in relation.tags)


def main() -> int:
    acquired = acquisition_records()
    replacements = {
        record["path"]: record
        for record in map(
            json.loads,
            (ROOT / "_acquisition/pmtiles-range-replacements.jsonl")
            .read_text()
            .splitlines(),
        )
    }

    mvt_files = sorted((ROOT / "openfreemap/mvt").rglob("*.pbf"))
    if len(mvt_files) != 357:
        raise RuntimeError(f"expected 357 MVT files, found {len(mvt_files)}")
    expected_mvt_coordinates = {
        (14, x, y)
        for x in range(13960, 13981)
        for y in range(6337, 6354)
    }
    actual_mvt_coordinates = {
        (14, int(path.parent.name), int(path.stem)) for path in mvt_files
    }
    if actual_mvt_coordinates != expected_mvt_coordinates:
        raise RuntimeError("MVT coordinate set does not match the requested tile rectangle")
    mvt_records = []
    layer_occurrences: dict[str, int] = {}
    for path in mvt_files:
        decoded = mapbox_vector_tile.decode(path.read_bytes())
        if not decoded:
            raise RuntimeError(f"empty decoded MVT: {path}")
        for layer in decoded:
            layer_occurrences[layer] = layer_occurrences.get(layer, 0) + 1
        relative = str(path.relative_to(ROOT))
        replacement = replacements.get(relative)
        record = file_record(
            path,
            acquired,
            z=14,
            x=int(path.parent.name),
            y=int(path.stem),
            format="Mapbox Vector Tile protobuf",
            decoded_layers=sorted(decoded),
            fixed_release_provenance=(
                "official PMTiles archive bounded range extraction"
                if replacement
                else "fixed-version tile endpoint"
            ),
        )
        if replacement:
            if record["sha256"] != replacement["sha256"]:
                raise RuntimeError(f"replacement checksum mismatch: {relative}")
            record["source_url"] = replacement["source"]
            record["accessed_at_utc"] = dt.datetime.fromtimestamp(
                (ROOT / "_acquisition/pmtiles-range-replacements.jsonl").stat().st_mtime,
                dt.timezone.utc,
            ).isoformat()
            record["http"] = {
                "archive_etag": '"a366bc1c0577d4b388c64f94e73ac860-9145"',
                "archive_last_modified": "Mon, 31 Aug 2026 00:29:33 GMT",
            }
            record["note"] = (
                "The fixed tile endpoint returned a newer wildcard fallback for this "
                "coordinate. The stored byte was instead read by HTTP Range from the "
                "official immutable 2026-08-30 PMTiles archive. The planet archive "
                "was not downloaded or retained."
            )
        mvt_records.append(record)

    terrain_files = sorted((ROOT / "terrain-mapzen-geotiff").rglob("*.tif"))
    if len(terrain_files) != 9:
        raise RuntimeError(f"expected 9 GeoTIFF files, found {len(terrain_files)}")
    expected_terrain_coordinates = {
        (11, x, y)
        for x in range(1745, 1748)
        for y in range(792, 795)
    }
    actual_terrain_coordinates = {
        (11, int(path.parent.name), int(path.stem)) for path in terrain_files
    }
    if actual_terrain_coordinates != expected_terrain_coordinates:
        raise RuntimeError("terrain coordinate set does not match the requested tile rectangle")
    terrain_records = []
    for path in terrain_files:
        with rasterio.open(path) as dataset:
            values = dataset.read(1, masked=True)
            if dataset.driver != "GTiff" or dataset.crs.to_epsg() != 3857:
                raise RuntimeError(f"unexpected GeoTIFF metadata: {path}")
            terrain_records.append(
                file_record(
                    path,
                    acquired,
                    z=11,
                    x=int(path.parent.name),
                    y=int(path.stem),
                    format="GeoTIFF",
                    dimensions=[dataset.width, dataset.height],
                    crs="EPSG:3857",
                    dtype=dataset.dtypes[0],
                    nodata=dataset.nodata,
                    elevation_interpretation=(
                        "signed 16-bit raw elevation values in metres; no vertical "
                        "scale/offset; -32768 is nodata"
                    ),
                    valid_pixel_count=int(values.count()),
                    valid_min_m=int(values.min()),
                    valid_max_m=int(values.max()),
                    bounds_epsg3857=list(dataset.bounds),
                    imagery_sources=acquired[str(path.relative_to(ROOT))]["http"].get(
                        "x-amz-meta-x-imagery-sources"
                    ),
                )
            )

    boundary_files = []
    for path in sorted((ROOT / "boundaries-kostat-2013").glob("*.json")):
        data = json.loads(path.read_text())
        years = sorted({feature["properties"].get("base_year") for feature in data["features"]})
        if data["type"] != "FeatureCollection" or len(data["features"]) != 25:
            raise RuntimeError(f"unexpected district collection: {path}")
        if years != ["2013"]:
            raise RuntimeError(f"unexpected district base year: {path}: {years}")
        boundary_files.append(
            file_record(
                path,
                acquired,
                format="GeoJSON FeatureCollection",
                feature_count=25,
                base_years=years,
                geometry_types=sorted(
                    {feature["geometry"]["type"] for feature in data["features"]}
                ),
            )
        )

    osm_path = ROOT / "osm-current-bbbike/Seoul.osm.pbf"
    osm_stats = OsmStats()
    osm_stats.apply_file(str(osm_path), locations=False)
    poly_path = ROOT / "osm-current-bbbike/Seoul.poly"

    license_files = sorted((ROOT / "licenses").iterdir())
    release_file = ROOT / "openfreemap/release/osm_date"
    all_data_files = mvt_files + terrain_files + [osm_path, poly_path] + [
        ROOT / record["path"] for record in boundary_files
    ]
    all_source_files = all_data_files + license_files + [release_file]

    manifest = {
        "schema_version": 1,
        "bundle_name": "seoul-geography-20260830",
        "generated_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "bundle_root": str(ROOT),
        "scope_statement": (
            "A bounded Seoul z14 OpenFreeMap vector-tile extraction plus separately "
            "dated editable BBBike OSM, Mapzen terrain, and historical KOSTAT 2013 "
            "district boundaries. This is not an all-zoom or complete raw OSM snapshot."
        ),
        "openfreemap": {
            "release_id": "20260830_080001_pt",
            "release_date": "2026-08-30",
            "underlying_osm_date": release_file.read_text().strip(),
            "requested_bbox_wgs84": REQUESTED_BBOX,
            "zoom": 14,
            "tile_range": {"x_min": 13960, "x_max": 13980, "y_min": 6337, "y_max": 6353},
            "tile_envelope_wgs84": tile_envelope(14, 13960, 13980, 6337, 6353),
            "tile_count": len(mvt_files),
            "total_bytes": sum(path.stat().st_size for path in mvt_files),
            "decoded_all_tiles": True,
            "layer_occurrences": dict(sorted(layer_occurrences.items())),
            "direct_fixed_endpoint_tiles": len(mvt_files) - len(replacements),
            "fixed_archive_range_tiles": len(replacements),
            "fixed_archive_range_summary": json.loads(
                (ROOT / "_acquisition/pmtiles-range-summary.json").read_text()
            ),
            "service_usage_basis": {
                "official_page": "https://openfreemap.org/",
                "statement": (
                    "Using our public instance is completely free: there are no limits "
                    "on the number of map views or requests."
                ),
                "method": "357 bounded requests, at most four concurrent, no retry loops",
            },
            "limitations": [
                "Only zoom 14 is present.",
                "Coverage is the enclosing z14 tile rectangle, not a polygon clip.",
                "MVT is processed OpenMapTiles-schema content, not raw/full OSM.",
                "Release ID date is 2026-08-30; official osm_date is 2026-08-24.",
            ],
            "attribution": "OpenFreeMap © OpenMapTiles — Data from OpenStreetMap",
            "files": mvt_records,
        },
        "editable_osm_current_bbbike": {
            "historical_release": False,
            "description": "Current BBBike Seoul rectangular OSM extract, segregated from the fixed OpenFreeMap release.",
            "coverage_from_poly_wgs84": [126.58, 37.35, 127.31, 37.72],
            "pbf_last_modified_utc": acquired[str(osm_path.relative_to(ROOT))]["http"].get("last-modified"),
            "object_counts": {
                "nodes": osm_stats.nodes,
                "ways": osm_stats.ways,
                "relations": osm_stats.relations,
                "highway_tagged_ways_or_relations": osm_stats.highways,
                "building_tagged_ways_or_relations": osm_stats.buildings,
            },
            "license": "OpenStreetMap ODbL 1.0",
            "attribution": "© OpenStreetMap contributors",
            "files": [
                file_record(osm_path, acquired, format="OpenStreetMap PBF"),
                file_record(poly_path, acquired, format="Osmosis polygon text"),
            ],
        },
        "terrain_mapzen": {
            "zoom": 11,
            "tile_range": {"x_min": 1745, "x_max": 1747, "y_min": 792, "y_max": 794},
            "tile_envelope_wgs84": tile_envelope(11, 1745, 1747, 792, 794),
            "tile_count": len(terrain_files),
            "total_bytes": sum(path.stat().st_size for path in terrain_files),
            "source_date_note": "Inspected S3 objects were last modified in December 2017; this is not a 2026 terrain snapshot.",
            "source_families": ["SRTM", "GMTED2010", "ETOPO1 where present"],
            "attribution": [
                "Mapzen",
                "SRTM and GMTED2010 terrain data courtesy of the U.S. Geological Survey",
                "Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration",
            ],
            "files": terrain_records,
        },
        "district_boundaries_kostat_2013": {
            "historical": True,
            "current_boundaries": False,
            "feature_count_each": 25,
            "base_year": "2013",
            "source_attribution": "Statistics Korea (KOSTAT), Administrative division geodata for Census, 2013",
            "repository": "https://github.com/southkorea/seoul-maps",
            "repository_declared_license": "Apache v2.0",
            "license_caveat": (
                "The repository README declares Apache v2.0, but the historical upstream "
                "KOSTAT page does not expose a currently verifiable 2013 license grant. "
                "Do not represent the repository declaration as a newly verified upstream "
                "KOSTAT license."
            ),
            "files": boundary_files,
        },
        "licenses_and_source_text": {
            "files": [file_record(path, acquired) for path in license_files]
            + [file_record(release_file, acquired)],
        },
        "counts": {
            "data_files": len(all_data_files),
            "source_and_license_files": len(all_source_files),
            "mvt_tiles": len(mvt_files),
            "terrain_tiles": len(terrain_files),
            "district_geojson_files": len(boundary_files),
        },
        "bytes": {
            "data_files": sum(path.stat().st_size for path in all_data_files),
            "source_and_license_files": sum(path.stat().st_size for path in all_source_files),
        },
    }
    (ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    )
    print(
        f"manifest.json written: data_files={len(all_data_files)} "
        f"data_bytes={manifest['bytes']['data_files']} "
        f"source_files={len(all_source_files)} "
        f"source_bytes={manifest['bytes']['source_and_license_files']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
