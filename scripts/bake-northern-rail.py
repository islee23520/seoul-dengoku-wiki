"""Extract mapped northern rail geometry from a pinned Geofabrik OSM snapshot.

Run: python3 scripts/bake-northern-rail.py --pbf PATH --out public/northern-rail.json
This is observed geography, not an assertion of physical inter-way connectivity or 2126 passage.
"""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

import osmium
import osmium.io
from rasterio.warp import transform


SOURCE_SHA256 = "9bb18639a4f35c5ff41404a1a2faa5fd205be960fb5143ed19342a9c1dc16db0"
MODES = {"rail", "narrow_gauge", "tram", "subway", "light_rail", "monorail", "funicular"}
STOPS = {"station", "halt"}


class NorthernRail(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.paths = []
        self.stations = []
        self.counts = Counter()
        self.modes = Counter()
        self.admin = Counter()

    def way(self, way):
        tags = way.tags
        mode = tags.get("railway")
        if tags.get("boundary") == "administrative":
            self.admin["ways"] += 1
        if mode in STOPS:
            self.counts["stationWaysNotPointStations"] += 1
        if mode not in MODES:
            if mode in {"abandoned", "disused", "construction", "razed"}:
                self.counts["inactiveOrConstructionWaysExcluded"] += 1
            return
        self.modes[mode] += 1
        try:
            coords = [(node.lon, node.lat) for node in way.nodes]
        except osmium.InvalidLocationError:
            self.counts["waysWithMissingNodes"] += 1
            return
        if len(coords) < 2:
            self.counts["shortWaysExcluded"] += 1
            return
        projected = transform("EPSG:4326", "EPSG:5179", [x for x, _ in coords], [y for _, y in coords])
        east, north = projected[0], projected[1]
        entry = {"osmWay": way.id, "mode": mode, "points": [[round(x), round(y)] for x, y in zip(east, north)], "passage2126": "unknown"}
        for key in ("name", "ref"):
            if tags.get(key):
                entry[key] = tags[key]
        self.paths.append(entry)

    def node(self, node):
        tags = node.tags
        mode = tags.get("railway")
        if mode not in STOPS:
            return
        projected = transform("EPSG:4326", "EPSG:5179", [node.lon], [node.lat])
        east, north = projected[0], projected[1]
        entry = {"osmNode": node.id, "mode": mode, "east": round(east[0]), "north": round(north[0]), "passage2126": "unknown"}
        if tags.get("name"):
            entry["name"] = tags["name"]
        else:
            self.counts["unnamedPointStations"] += 1
        if tags.get("ref"):
            entry["ref"] = tags["ref"]
        self.stations.append(entry)

    def relation(self, relation):
        if relation.tags.get("boundary") == "administrative":
            self.admin[relation.tags.get("admin_level", "unknown")] += 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pbf", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    if hashlib.sha256(args.pbf.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError("Northern OSM snapshot SHA-256 mismatch")
    header = osmium.io.Reader(str(args.pbf)).header()
    rail = NorthernRail()
    rail.apply_file(str(args.pbf), locations=True)
    rail.paths.sort(key=lambda path: path["osmWay"])
    rail.stations.sort(key=lambda station: station["osmNode"])
    assert len({path["osmWay"] for path in rail.paths}) == len(rail.paths)
    assert len({station["osmNode"] for station in rail.stations}) == len(rail.stations)
    result = {
        "schema": "northern-rail.v1", "projection": "EPSG:5179",
        "source": {"url": "https://download.geofabrik.de/asia/north-korea-260924.osm.pbf", "snapshot": header.get("osmosis_replication_timestamp"), "sha256": SOURCE_SHA256, "license": "OpenStreetMap contributors ODbL 1.0"},
        "scope": "Mapped OSM way geometry and point stations in the North Korea extract; no inferred connections, service, or 2126 passage.",
        "coverage": {"modes": dict(sorted(rail.modes.items())), "counts": dict(sorted(rail.counts.items())), "administrativeBoundaryRelationsByLevel": dict(sorted(rail.admin.items())), "missingNorthernBoundariesInRenderedLayer": True},
        "paths": rail.paths, "stations": rail.stations,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({"paths": len(rail.paths), "stations": len(rail.stations), "coverage": result["coverage"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
