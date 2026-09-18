"""Pinned source provenance without promoting modification dates to observations."""
import hashlib
import json
from pathlib import Path

import osmium.io
import osmium.osm

from spatial import date_errors


def load(path):
    return json.loads(Path(path).read_text())


def dump(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n")


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1048576), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_dates(selection):
    boundary, osm = selection["selected_boundary"], selection["osm"]
    return [selection["as_of"], boundary["source_effective_date"], boundary["publication_commit_date"],
            boundary["retrieved_on"], osm["snapshot_at"], osm["modified_at"], osm["acquired_at"],
            selection["terrain"]["source_object_modified_month"]]


def read_sources(source_root, boundary_path, as_of):
    selection_path = boundary_path.with_name("selection.json")
    selection = load(selection_path)
    errors = date_errors(as_of, source_dates(selection))
    if errors:
        raise ValueError(errors)
    manifest_path = source_root / "manifest.json"
    manifest = load(manifest_path)
    selected = selection["selected_boundary"]
    if sha256(boundary_path) != selected["sha256"]:
        raise ValueError("boundary_hash_mismatch")
    pbf = source_root / selection["osm"]["path"]
    if sha256(pbf) != selection["osm"]["sha256"]:
        raise ValueError("pbf_hash_mismatch")
    with osmium.io.Reader(str(pbf), osmium.osm.NOTHING) as reader:
        header = {key: reader.header().get(key) for key in ("generator", "osmosis_replication_timestamp")}
    if header["osmosis_replication_timestamp"] != selection["osm"]["snapshot_at"]:
        raise ValueError("pbf_header_snapshot_mismatch")
    sources = [dict(id=selected["source_id"], **selected),
               dict(id="osm-bbbike-20260904", **selection["osm"], header=header,
                    source_url=manifest["editable_osm_current_bbbike"]["files"][0]["source_url"],
                    license=manifest["editable_osm_current_bbbike"]["license"],
                    attribution=manifest["editable_osm_current_bbbike"]["attribution"]),
               dict(id="bundle-manifest", path=str(manifest_path.resolve()), sha256=sha256(manifest_path))]
    terrain = manifest["terrain_mapzen"]
    for row in terrain["files"]:
        if sha256(source_root / row["path"]) != row["sha256"]:
            raise ValueError("terrain_hash_mismatch:" + row["path"])
        sources.append(dict(id="terrain:" + row["path"], **row,
                            source_object_modified_month="2017-12", source_object_modified_precision="month",
                            observation_date=None, attribution=terrain["attribution"]))
    comparison = boundary_path.with_name("boundary-comparison.json")
    if sha256(source_root / selection["comparison_boundary"]["path"]) != selection["comparison_boundary"]["sha256"]:
        raise ValueError("comparison_boundary_hash_mismatch")
    sources.append(dict(id="kostat-2013", **selection["comparison_boundary"],
                        role="dated_discrepancy_only_not_selected_mask", comparison=load(comparison)))
    selection["build_inputs"] = dict(source_root=str(source_root.resolve()), boundary=str(boundary_path.resolve()),
                                      selection=str(selection_path.resolve()), selection_sha256=sha256(selection_path))
    return selection, sources
