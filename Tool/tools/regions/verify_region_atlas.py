"""Reopen serialized geometry and reconcile every candidate against original PBF."""
import argparse
from collections import Counter, defaultdict
import gzip
import json
import math
from pathlib import Path
import sys

import numpy as np
from shapely.geometry import mapping, shape

from osm_source import read_candidates
from provenance import load, read_sources, sha256, source_dates
from spatial import RegionIndex, date_errors, partition_errors, project


def text_value(value):
    return isinstance(value, str) and bool(value.strip())


def text_list(value):
    return isinstance(value, list) and bool(value) and all(text_value(item) for item in value)


def publication_errors(atlas):
    """Check actual author bytes and content, rejecting stale publications."""
    sources = atlas.get("content_sources")
    if not isinstance(sources, list) or not sources:
        return ["missing_content_sources"]
    errors = []
    published = {r["id"]: r["content"] for r in atlas["regions"]}
    seen = set()
    for source in sources:
        path = Path(source["path"])
        if not path.is_file():
            errors.append("missing_content_source:" + str(path))
            continue
        if sha256(path) != source["sha256"]:
            errors.append("stale_content_source:" + str(path))
        for row in load(path)["regions"]:
            rid = row["region_id"]
            if rid in seen or row["content"] != published.get(rid):
                errors.append("published_content_mismatch:" + rid)
            seen.add(rid)
    if seen != set(published):
        errors.append("published_content_id_set")
    return errors


def content_errors(region):
    content = region["content"]
    if not isinstance(content, dict) or not content:
        return ["missing_content:" + region["id"]]
    errors = []
    for key in ("title", "summary", "inhabitants", "livelihood", "production", "shortages",
                "hazard", "action", "opening_state", "connections", "uncertainty",
                "anchor_refs", "canon_refs", "polity_contexts"):
        if not content.get(key) or isinstance(content[key], str) and not content[key].strip():
            errors.append("missing_content_" + key + ":" + region["id"])
    if content.get("source_kind") != "original-fiction" or content.get("fictional_epoch") != "opening-day":
        errors.append("content_provenance_or_epoch:" + region["id"])
    for key in ("inhabitants", "shortages", "anchor_refs", "canon_refs", "polity_contexts"):
        if not text_list(content.get(key)):
            errors.append("invalid_content_list_" + key + ":" + region["id"])
    for key in ("title", "summary", "livelihood", "opening_state", "connections", "uncertainty"):
        if not text_value(content.get(key)):
            errors.append("invalid_content_text_" + key + ":" + region["id"])
    allowed_polities = {f"S{i:02d}" for i in range(1, 17)}
    if text_list(content.get("polity_contexts")) and any(p not in allowed_polities for p in content["polity_contexts"]):
        errors.append("unknown_polity:" + region["id"])
    repo = Path(__file__).resolve().parents[3]
    if text_list(content.get("canon_refs")):
        for reference in content["canon_refs"]:
            canonical = (repo / reference).resolve()
            if not canonical.is_relative_to(repo) or not canonical.is_file():
                errors.append("invalid_canon_reference:" + region["id"])
    local_anchors = {a["source_object_id"] for a in region.get("profile", {}).get("anchors", [])}
    refs = content.get("anchor_refs", [])
    if not isinstance(refs, list) or not refs or any(ref not in local_anchors for ref in refs):
        errors.append("invalid_local_content_anchor:" + region["id"])
    production = content.get("production", {})
    if not isinstance(production, dict) or not text_list(production.get("outputs")) or not text_list(production.get("requires")):
        errors.append("incomplete_production:" + region["id"])
    hazard = content.get("hazard", {})
    if not isinstance(hazard, dict) or hazard.get("kind") not in {"water", "slope", "power", "access", "fire", "supply", "governance"} or not text_value(hazard.get("description")):
        errors.append("incomplete_hazard:" + region["id"])
    action = content.get("action", {})
    if not isinstance(action, dict) or not action.get("costs") or not action.get("outcomes") or not action.get("tradeoff"):
        errors.append("incomplete_player_choice:" + region["id"])
    else:
        if not action.get("id") or not action.get("label") or action.get("target_ref") not in refs:
            errors.append("invalid_action_target:" + region["id"])
        if any(not isinstance(c.get("amount"), (int, float)) or isinstance(c.get("amount"), bool)
               or not math.isfinite(c["amount"]) or c["amount"] <= 0 or not c.get("resource")
               or not c.get("unit") for c in action["costs"]):
            errors.append("invalid_action_cost:" + region["id"])
        if any(not text_value(outcome.get("kind")) or not text_value(outcome.get("effect")) for outcome in action["outcomes"]):
            errors.append("incomplete_action_outcome:" + region["id"])
    return errors


def verify(atlas_path, geometry_only=False):
    atlas = load(atlas_path)
    output = atlas_path.parent
    errors = []
    if atlas["schema"] != "seoul-region-atlas.v1":
        errors.append("atlas_schema")
    selection = atlas["source_selection"]
    inputs = selection["build_inputs"]
    if sha256(inputs["selection"]) != inputs["selection_sha256"]:
        errors.append("selection_hash_mismatch")
    current_selection, sources = read_sources(Path(inputs["source_root"]), Path(inputs["boundary"]), atlas["as_of"])
    if selection != current_selection or sources != atlas["sources"]:
        errors.append("source_provenance_mismatch")
    errors.extend(date_errors(atlas["as_of"], source_dates(selection)))
    features = [f for f in load(inputs["boundary"])["features"] if f["properties"].get("sido") == "11"]
    originals = {"region:" + f["properties"]["adm_cd2"]: project(shape(f["geometry"])) for f in features}
    regions = {r["id"]: r for r in atlas["regions"]}
    geometries = {rid: shape(r["geometry_5179"]) for rid, r in regions.items()}
    if len(regions) != 427 or len(atlas["regions"]) != 427:
        errors.append("region_count")
    errors.extend(partition_errors(geometries, originals))
    district_ids = {d["id"] for d in atlas["districts"]}
    if len(district_ids) != 25:
        errors.append("district_count")
    for feature in features:
        props = feature["properties"]
        rid = "region:" + props["adm_cd2"]
        if rid not in regions:
            continue
        row, geometry = regions[rid], geometries[rid]
        if row["adm_cd2"] != props["adm_cd2"] or row["district_id"] != "gu:" + props["sgg"] or row["name"] != props["adm_nm"].split(" ", 2)[-1]:
            errors.append("region_identity:" + rid)
        if abs(row["area_m2"] - geometry.area) > 0.01:
            errors.append("serialized_area:" + rid)
        display = project(shape(row["geometry"]))
        if display.symmetric_difference(geometry).area > 0.01:
            errors.append("display_geometry_differs:" + rid)
        if not row["profile"]["terrain"]["sample_count"]:
            errors.append("missing_terrain_profile:" + rid)
    for district in atlas["districts"]:
        if district["region_ids"] != sorted(rid for rid, row in regions.items() if row["district_id"] == district["id"]):
            errors.append("district_membership:" + district["id"])
        profile = load(output / "profiles" / (district["id"].removeprefix("gu:") + ".json"))
        if {r["id"]: r["profile"] for r in profile["regions"]} != {rid: regions[rid]["profile"] for rid in district["region_ids"]}:
            errors.append("profile_file_mismatch:" + district["id"])
    coverage = load(output / atlas["files"]["coverage"])
    if coverage != atlas["coverage"]:
        errors.append("coverage_file_mismatch")
    for name, expected in coverage["artifact_sha256"].items():
        if sha256(output / name) != expected:
            errors.append("artifact_hash:" + name)
    geojson = load(output / atlas["files"]["regions"])
    if {f["properties"]["id"]: f["geometry"] for f in geojson["features"]} != {rid: row["geometry"] for rid, row in regions.items()}:
        errors.append("geojson_geometry_mismatch")
    print("Re-reading original candidates for identity, raw geometry, and membership reconciliation", flush=True)
    records, inventory = read_candidates(Path(inputs["source_root"]) / selection["osm"]["path"])
    if inventory != coverage["candidate_inventory"]:
        errors.append("original_inventory_mismatch")
    original_records = {r["id"]: r for r in records}
    index = RegionIndex(geometries)
    seen, statuses, counts = set(), Counter(), defaultdict(Counter)
    lists = defaultdict(lambda: defaultdict(list))
    with gzip.open(output / atlas["files"]["objects"], "rt") as stream:
        while True:
            batch = []
            for line in stream:
                batch.append(json.loads(line))
                if len(batch) == 2048:
                    break
            if not batch:
                break
            projected = project(np.array([shape(r["geometry"]) if r["geometry"] and not r["geometry_reason"] else None for r in batch], dtype=object))
            for item, geometry in zip(batch, projected):
                oid = item["id"]
                if oid in seen or oid not in original_records:
                    errors.append("unknown_or_duplicate_candidate:" + oid)
                    continue
                seen.add(oid)
                source = original_records[oid]
                for key in ("primitive", "source_object_id", "tags", "classification", "members", "geometry_reason", "object_timestamp", "source_fingerprint"):
                    if source[key] != item[key]:
                        errors.append("source_" + key + ":" + oid)
                expected_geometry = json.loads(json.dumps(mapping(source["shape"]))) if source["shape"] is not None else None
                if item["geometry"] != expected_geometry:
                    errors.append("raw_geometry_mismatch:" + oid)
                expected = index.memberships(geometry)
                if source["geometry_reason"]:
                    expected["reason"] = source["geometry_reason"]
                for key in ("status", "memberships", "primary_region_id", "reason"):
                    if item[key] != expected[key]:
                        errors.append("object_" + key + ":" + oid)
                if item["snapshot_at"] != selection["osm"]["snapshot_at"] or item["source_ref"] != "osm-bbbike-20260904":
                    errors.append("object_source_date:" + oid)
                statuses[item["status"]] += 1
                for rid in item["memberships"]:
                    counts[rid].update(item["classification"])
                    counts[rid]["all_candidates"] += 1
                    for key, category in (("station_ids", "subway_station"), ("station_ids", "rail_station"), ("facility_ids", "facility"), ("landscape_ids", "landscape"), ("access_ids", "access")):
                        if category in item["classification"]:
                            lists[rid][key].append(oid)
    if seen != set(original_records):
        errors.append("candidate_id_set_mismatch")
    if dict(statuses) != coverage["candidate_status_counts"] or sum(statuses.values()) != inventory["candidate_count"]:
        errors.append("status_accounting_mismatch")
    errors.extend(date_errors(atlas["as_of"], {r["object_timestamp"] for r in records}))
    for rid, row in regions.items():
        if row["profile"]["candidate_counts"] != dict(counts[rid]):
            errors.append("profile_counts:" + rid)
        for key in ("station_ids", "facility_ids", "landscape_ids", "access_ids"):
            if row[key] != lists[rid][key]:
                errors.append("profile_" + key + ":" + rid)
        for anchor in row["profile"]["anchors"]:
            source = original_records.get(anchor["source_object_id"])
            if source is None or anchor["name"] != (source["tags"].get("name:ko") or source["tags"].get("name")):
                errors.append("invalid_anchor:" + rid)
        for neighbor in row["shared_boundary_neighbors"]:
            actual = geometries[rid].boundary.intersection(geometries[neighbor["region_id"]].boundary).length
            if neighbor["travel_edge"] or actual <= 0 or abs(actual - neighbor["shared_boundary_m"]) > 0.000001:
                errors.append("invalid_surface_adjacency:" + rid)
        if not geometry_only:
            errors.extend(content_errors(row))
    if not geometry_only:
        errors.extend(publication_errors(atlas))
    return dict(passed=not errors, mode="geometry-only-intermediate" if geometry_only else "strict",
                full_atlas_complete=not geometry_only and not errors, region_count=len(regions),
                candidate_count=len(seen), candidate_status_counts=dict(statuses), errors=errors,
                official_real_world_completeness="unverified")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--atlas", type=Path, required=True)
    parser.add_argument("--geometry-only", action="store_true")
    args = parser.parse_args()
    result = verify(args.atlas, args.geometry_only)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True), flush=True)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
