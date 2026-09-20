"""Join all authored dong records and export the local, source-backed atlas view."""

import argparse
import copy
import gzip
import json
from pathlib import Path

from shapely.geometry import mapping, shape

from provenance import dump, load, sha256
from verify_region_atlas import content_errors


def combine_content(atlas, documents):
    """Reject missing, duplicated, misplaced or invalid regional content."""
    expected = {region["id"]: region for region in atlas["regions"]}
    authored = {}
    action_ids = set()
    for document in documents:
        if document.get("as_of") != atlas.get("as_of"):
            raise ValueError("content_cutoff")
        for row in document["regions"]:
            rid = row["region_id"]
            if rid in authored or rid not in expected:
                raise ValueError("duplicate_or_unknown_region:" + rid)
            region = expected[rid]
            if document["district_id"] != region["district_id"] or row["name"] != region["name"]:
                raise ValueError("authored_region_identity:" + rid)
            errors = content_errors(dict(region, content=row["content"]))
            if errors:
                raise ValueError(errors)
            action_id = row["content"]["action"]["id"]
            if action_id in action_ids:
                raise ValueError("duplicate_action_id:" + action_id)
            action_ids.add(action_id)
            authored[rid] = row["content"]
    if set(authored) != set(expected):
        raise ValueError("missing_authored_regions:" + ",".join(sorted(set(expected) - set(authored))))
    result = copy.deepcopy(atlas)
    for region in result["regions"]:
        region["content"] = authored[region["id"]]
    return result


def write_map_data(atlas, output_path, objects_path):
    """Export map input for the official wiki without creating another public viewer."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    region_rows = []
    for region in atlas["regions"]:
        display_geometry = shape(region["geometry_5179"]).simplify(6, preserve_topology=True)
        region_rows.append({
            key: region[key] for key in (
                "id", "name", "district_id", "district_name", "area_m2", "profile", "content",
                "station_ids", "facility_ids", "shared_boundary_neighbors"
            )
        } | {"map_geometry": mapping(display_geometry)})
    sites = []
    with gzip.open(objects_path, "rt", encoding="utf-8") as stream:
        for line in stream:
            row = json.loads(line)
            if row["status"] != "assigned":
                continue
            kinds = set(row["classification"])
            if not kinds.intersection({"rail_station", "subway_station", "facility"}):
                continue
            label = row["tags"].get("name:ko") or row["tags"].get("name")
            tags = {key: value for key, value in row["tags"].items()
                    if key in {"railway", "station", "public_transport", "amenity", "shop", "tourism",
                               "leisure", "office", "craft", "healthcare", "man_made", "power", "aeroway"}}
            sites.append({"id": row["id"], "name": label or "이름 미등록 시설",
                          "named": bool(label), "kinds": row["classification"], "tags": tags,
                          "region_ids": row["memberships"], "primary_region_id": row["primary_region_id"]})
    result = {"schema": atlas["schema"], "as_of": atlas["as_of"], "fictional_epoch": atlas["fictional_epoch"],
              "source_selection": atlas["source_selection"], "districts": atlas["districts"],
              "coverage": {key: atlas["coverage"][key] for key in (
                  "region_count", "district_count", "selected_union_area_m2", "gap_m2", "overlap_m2",
                  "candidate_status_counts", "regions_without_stations", "official_real_world_completeness")},
              "regions": region_rows, "sites": sites,
              "map_note": "표시 지도는 EPSG:5179에서 6m 단순화. 전수 검증은 단순화 전 원본 도형으로 수행.",
              "attribution": "통계청 SGIS · vuski/admdongkor (CC BY 4.0), © OpenStreetMap contributors (ODbL). Mapzen/USGS 지형."}
    payload = json.dumps(result, ensure_ascii=False, separators=(",", ":"), allow_nan=False).replace("</", "<\\/")
    output_path.write_text("window.SEOUL_REGION_ATLAS=" + payload + ";\n", encoding="utf-8")
    return {"regions": len(region_rows), "sites": len(sites), "bytes": output_path.stat().st_size}


def prose_text(document):
    """Keep real paragraphs intact for the Korean prose gate."""
    paragraphs = ["# " + document["district_name"]]
    for row in document["regions"]:
        c = row["content"]
        paragraphs.extend(["## " + row["name"], c["summary"], c["livelihood"], c["opening_state"],
                           c["hazard"]["description"], c["connections"], c["action"]["tradeoff"]])
    return "\n\n".join(paragraphs) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--atlas", required=True, type=Path)
    parser.add_argument("--content-dir", required=True, type=Path)
    parser.add_argument("--map-data", required=True, type=Path)
    args = parser.parse_args()
    paths = sorted(args.content_dir.glob("*.json"))
    documents = [load(path) for path in paths]
    atlas = combine_content(load(args.atlas), documents)
    atlas["coverage"]["content_status"] = "authored_pending_final_verification"
    atlas["content_sources"] = [{"path": str(path), "sha256": sha256(path)} for path in paths]
    dump(args.atlas, atlas)
    dump(args.atlas.parent / atlas["files"]["coverage"], atlas["coverage"])
    prose_dir = args.atlas.parent / "prose"
    prose_dir.mkdir(exist_ok=True)
    for path, document in zip(paths, documents):
        (prose_dir / path.with_suffix(".md").name).write_text(prose_text(document), encoding="utf-8")
    result = write_map_data(atlas, args.map_data, args.atlas.parent / atlas["files"]["objects"])
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
