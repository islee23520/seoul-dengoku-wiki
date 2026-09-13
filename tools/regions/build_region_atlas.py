"""Build the pinned Seoul partition and complete original-candidate ledger."""
import argparse
from collections import Counter
import gzip
import json
from pathlib import Path

import numpy as np
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

from osm_source import read_candidates
from profiles import Profiles, terrain_profiles
from provenance import dump, load, read_sources, sha256
from spatial import RegionIndex, clean_regions, date_errors, partition_errors, project


def build(args):
    output = args.output.parent
    output.mkdir(parents=True, exist_ok=True)
    selection, sources = read_sources(args.source_root, args.boundary, args.as_of)
    features = [f for f in load(args.boundary)["features"] if f["properties"].get("sido") == "11"]
    features.sort(key=lambda f: f["properties"]["adm_cd2"])
    originals = {"region:" + f["properties"]["adm_cd2"]: project(shape(f["geometry"])) for f in features}
    if len(features) != 427 or len(originals) != 427:
        raise ValueError("selected_boundary_must_have_427_unique_dongs")
    geometries, changes = clean_regions(originals)
    errors = partition_errors(geometries, originals)
    if errors:
        raise ValueError(errors)
    regions, districts = [], {}
    for feature in features:
        p = feature["properties"]
        rid, did = "region:" + p["adm_cd2"], "gu:" + p["sgg"]
        geometry = geometries[rid]
        row = dict(id=rid, adm_cd2=p["adm_cd2"], name=p["adm_nm"].split(" ", 2)[-1],
                   district_id=did, district_name=p["sggnm"], geometry=mapping(project(geometry, "EPSG:5179", "EPSG:4326")),
                   geometry_5179=mapping(geometry), area_m2=geometry.area, cleanup_changed_area_m2=changes[rid],
                   source_refs=[selection["selected_boundary"]["source_id"], "osm-bbbike-20260904"],
                   station_ids=[], facility_ids=[], landscape_ids=[], access_ids=[], shared_boundary_neighbors=[],
                   profile={}, content=None)
        regions.append(row)
        districts.setdefault(did, dict(id=did, name=p["sggnm"], region_ids=[]))["region_ids"].append(rid)
    if len(districts) != 25:
        raise ValueError("selected_boundary_must_have_25_districts")
    index = RegionIndex(geometries)
    for i, row in enumerate(regions):
        a = geometries[row["id"]]
        for j in sorted(index.tree.query(a, predicate="intersects")):
            if j <= i:
                continue
            length = a.boundary.intersection(index.geometries[j].boundary).length
            if length > 0:
                row["shared_boundary_neighbors"].append(dict(region_id=index.ids[j], shared_boundary_m=length, travel_edge=False))
                regions[j]["shared_boundary_neighbors"].append(dict(region_id=row["id"], shared_boundary_m=length, travel_edge=False))
    print("Reading original candidates and genuine relation areas", flush=True)
    records, inventory = read_candidates(args.source_root / selection["osm"]["path"])
    date_failures = date_errors(args.as_of, {r["object_timestamp"] for r in records})
    if date_failures:
        raise ValueError(date_failures)
    profiles = Profiles(regions)
    statuses, classes, primitive_statuses, reasons = Counter(), Counter(), Counter(), Counter()
    cross_boundary = 0
    ledger_path = output / "objects.jsonl.gz"
    with ledger_path.open("wb") as raw, gzip.GzipFile(fileobj=raw, mode="wb", filename="", mtime=0) as stream:
        for start in range(0, len(records), 2048):
            batch = records[start:start + 2048]
            projected = project(np.array([r["shape"] if not r["geometry_reason"] else None for r in batch], dtype=object))
            for record, geometry in zip(batch, projected):
                result = index.memberships(geometry)
                if record["geometry_reason"]:
                    result["reason"] = record["geometry_reason"]
                item = {k: v for k, v in record.items() if k != "shape"}
                item.update(result)
                item.update(geometry=mapping(record["shape"]) if record["shape"] is not None else None,
                            geometry_status="quarantine" if result["status"] == "quarantine" else "valid",
                            source_ref="osm-bbbike-20260904", snapshot_at=selection["osm"]["snapshot_at"],
                            exclusion_reason=result["reason"] if result["status"] == "outside" else None,
                            quarantine_reason=result["reason"] if result["status"] == "quarantine" else None)
                stream.write((json.dumps(item, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n").encode())
                statuses[item["status"]] += 1
                primitive_statuses[(item["primitive"], item["status"])] += 1
                for category in item["classification"]:
                    classes[(category, item["status"])] += 1
                if item["reason"]:
                    reasons[item["reason"]] += 1
                cross_boundary += len(item["memberships"]) > 1
                profiles.add(item)
    profiles.finish()
    terrain_profiles(regions, geometries, args.source_root)
    union = unary_union(list(geometries.values()))
    original_union = unary_union(list(originals.values()))
    coverage = dict(schema="seoul-region-coverage.v1", as_of=args.as_of, region_count=len(regions), district_count=len(districts),
                    selected_union_area_m2=original_union.area, cleaned_union_area_m2=union.area,
                    symmetric_difference_m2=union.symmetric_difference(original_union).area,
                    gap_m2=original_union.difference(union).area, excess_m2=union.difference(original_union).area,
                    overlap_m2=max(0, sum(g.area for g in geometries.values()) - union.area),
                    source_overlap_excess_m2=sum(g.area for g in originals.values()) - original_union.area,
                    cleanup_changed_regions=sum(v > 0 for v in changes.values()),
                    candidate_inventory=inventory, candidate_status_counts=dict(statuses),
                    candidate_class_counts=[dict(classification=c, status=s, count=n) for (c, s), n in sorted(classes.items())],
                    candidate_primitive_status_counts=[dict(primitive=p, status=s, count=n) for (p, s), n in sorted(primitive_statuses.items())],
                    reason_counts=dict(reasons), cross_boundary_candidate_count=cross_boundary,
                    regions_without_stations=sum(not r["station_ids"] for r in regions),
                    regions_without_facilities=sum(not r["facility_ids"] for r in regions),
                    regions_without_candidates=sum(not r["profile"]["candidate_counts"] for r in regions),
                    official_real_world_completeness="unverified", content_status="pending_phase3", tolerance_m2=0.01,
                    canonical_crs="EPSG:5179", geometry_field_crs="EPSG:4326", canonical_geometry_field="geometry_5179",
                    adjacency_semantics="Shared surface boundary only; no inferred travel edges or station-stop shortcuts.",
                    privacy="Raw source tags preserved except contact fields (phone/fax/email/website/url/contact:*); addresses retained. No contributor account metadata.")
    if inventory["candidate_count"] != sum(statuses.values()):
        raise ValueError("candidate_accounting_incomplete")
    for did, district in districts.items():
        rows = [r for r in regions if r["district_id"] == did]
        dump(output / "profiles" / (did.removeprefix("gu:") + ".json"),
             dict(schema="seoul-region-profiles.v1", as_of=args.as_of, district=district,
                  source_refs=[s["id"] for s in sources], regions=[{k: r[k] for k in
                  ("id", "adm_cd2", "name", "district_id", "district_name", "area_m2", "profile", "station_ids", "facility_ids", "landscape_ids", "access_ids", "shared_boundary_neighbors")} for r in rows]))
    dump(output / "regions.geojson", dict(type="FeatureCollection", features=[dict(type="Feature", geometry=r["geometry"],
         properties={k: r[k] for k in ("id", "adm_cd2", "name", "district_id", "district_name", "area_m2", "cleanup_changed_area_m2", "geometry_5179")}) for r in regions]))
    dump(output / "sources.json", dict(schema="seoul-region-sources.v1", source_selection=selection, sources=sources))
    coverage["artifact_sha256"] = {name: sha256(output / name) for name in ("objects.jsonl.gz", "regions.geojson", "sources.json")}
    dump(output / "coverage.json", coverage)
    atlas = dict(schema="seoul-region-atlas.v1", as_of=args.as_of, fictional_epoch=selection["fictional_epoch"],
                 source_selection=selection, sources=sources, coverage=coverage, districts=list(districts.values()), regions=regions,
                 files=dict(objects="objects.jsonl.gz", regions="regions.geojson", coverage="coverage.json"))
    dump(args.output, atlas)
    print(json.dumps(dict(output=str(args.output), region_count=len(regions), candidate_status_counts=dict(statuses),
                          candidate_count=inventory["candidate_count"], geometry_errors=errors), sort_keys=True), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--boundary", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    build(parser.parse_args())


if __name__ == "__main__":
    main()
