#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["osmium", "shapely==2.1.2", "pydantic>=2,<3"]
# ///
# How to run: install uv from https://astral.sh/uv/ then:
# uv run scripts/physical_rail.py (read-only JSON output on stdout)
"""Observed rail clipping; station connectivity requires separate exact node evidence."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from dataclasses import dataclass
from collections import Counter
from pathlib import Path
from typing import Final, Literal, NewType

import osmium
from osmium.osm import Node, Way
from pydantic import BaseModel, ConfigDict, Field
from shapely import get_parts
from shapely.geometry import LineString, Point, Polygon, MultiPolygon, shape
from shapely.geometry.base import BaseGeometry

ROOT: Final = Path(__file__).resolve().parents[1]
BOUNDARY_SHA: Final = "6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4"
OSM_SHA: Final = "70007aa979f8e362ca609fdc2d6302164c2f1379f11c8fc5fd39a7a2e79d3c17"
OFFICIAL_SHA: Final = "6b9e1bec6987875ed5f5e6b2df508d3716208628f1749b03f5b80cf1a2af9b7a"
ORIGINAL_SHA: Final = "46985afccc2d3f2b5e4e3152254d30bc023d0688d63745a951a9be0f6ebf097d"
INVENTORY_SHA: Final = "596e8beb2cf82bce5379332a8ab4bc149dda6d043fde47843df45dbda0fbe261"
AUDIT_SHA: Final = "b8020422848eb3a30fff8057b404fc8c9eb07e22294441aff2250699be6559c9"
MODES: Final = frozenset({"rail", "narrow_gauge", "tram", "subway", "light_rail", "monorail", "funicular"})
StationId = NewType("StationId", str)
NodeId = NewType("NodeId", int)


@dataclass(frozen=True, slots=True)
class RailEvidenceError(Exception):
    code: str

    def __str__(self) -> str:
        return self.code


class RailWay(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")
    osm_way: int = Field(gt=0)
    mode: str
    node_ids: tuple[NodeId, ...]
    points: tuple[tuple[float, float], ...]


class AdjacentPair(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")
    line_id: str
    codes: tuple[str, str]
    station_ids: tuple[StationId, StationId]


class EdgeWitness(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")
    pair: AdjacentPair
    osm_way: int
    station_nodes: tuple[NodeId, NodeId]


class SubpathWitness(EdgeWitness):
    """Exact directed node sequence on one original OSM way, including both stops."""
    indices: tuple[int, int]
    node_ids: tuple[NodeId, ...]


class WaySegment(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")
    osm_way: int
    indices: tuple[int, int]
    node_ids: tuple[NodeId, ...]


class MultiwayWitness(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")
    pair: AdjacentPair
    station_nodes: tuple[NodeId, NodeId]
    segments: tuple[WaySegment, ...]


@dataclass(frozen=True, slots=True)
class RailProof:
    """Independently reviewed original adjacency and exact station-to-node bindings."""
    original: tuple[AdjacentPair, ...]
    station_nodes: tuple[tuple[StationId, NodeId], ...]


class RailPiece(BaseModel):
    model_config = ConfigDict(frozen=True)
    id: str
    osm_way: int
    mode: str
    points: tuple[tuple[float, float], ...]


class PhysicalSubset(BaseModel):
    model_config = ConfigDict(frozen=True)
    schema_version: Literal["seoul-physical-rail.v1"] = "seoul-physical-rail.v1"
    projection: Literal["EPSG:4326"] = "EPSG:4326"
    boundary_sha256: str = BOUNDARY_SHA
    osm_sha256: str = OSM_SHA
    passage2126: Literal["unknown"] = "unknown"
    paths: tuple[RailPiece, ...]
    edges: tuple[EdgeWitness, ...] = ()
    station_binding_status: Literal["missing-evidence"] = "missing-evidence"


def checked_bytes(path: Path, digest: str) -> bytes:
    """Reject missing, LFS-pointer or changed source bytes before geometry parsing."""
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != digest:
        raise RailEvidenceError("E_RAIL_SOURCE_HASH:" + str(path))
    return data


def seoul_boundary() -> Polygon | MultiPolygon:
    """Read only the pinned city feature, never a bbox or inferred station extent."""
    data = checked_bytes(ROOT / "data/geography/boundaries/seoul-sgis-20250630.geojson", BOUNDARY_SHA)
    document = json.loads(data)
    cities = [f for f in document["features"] if f["properties"]["kind"] == "city"]
    if len(cities) != 1 or cities[0]["properties"]["officialCode"] != "11":
        raise RailEvidenceError("E_RAIL_SEOUL_CITY")
    boundary = shape(cities[0]["geometry"])
    if not isinstance(boundary, (Polygon, MultiPolygon)) or not boundary.is_valid:
        raise RailEvidenceError("E_RAIL_BOUNDARY_GEOMETRY")
    return boundary


def clip_way(way: RailWay, boundary: BaseGeometry) -> tuple[RailPiece, ...]:
    """Intersect every original segment separately; join only consecutive inside pieces."""
    if len(way.points) < 2 or len(way.points) != len(way.node_ids) or way.mode not in MODES:
        raise RailEvidenceError("E_RAIL_WAY_EVIDENCE")
    runs: list[list[tuple[float, float]]] = []
    continuous = False
    for a, b in zip(way.points, way.points[1:]):
        segment = LineString([a, b])
        clipped = segment.intersection(boundary)
        parts = get_parts(clipped)
        lines = [part for part in parts if isinstance(part, LineString) and part.length > 0]
        lines.sort(key=lambda part: segment.project(part.interpolate(0.5, normalized=True)))
        for part in lines:
            points = [(coordinate[0], coordinate[1]) for coordinate in part.coords]
            if segment.project(Point(points[0])) > segment.project(Point(points[-1])):
                points.reverse()
            if continuous and runs and runs[-1][-1] == points[0]:
                runs[-1].extend(points[1:])
            else:
                runs.append(points)
            continuous = points[-1] == b
        if not lines:
            continuous = False
    return tuple(RailPiece(id=f"osm:way:{way.osm_way}:piece:{i}", osm_way=way.osm_way,
                           mode=way.mode, points=tuple(points)) for i, points in enumerate(runs)
                 if boundary.covers(LineString(points)))


def verified_edge(witness: EdgeWitness, way: RailWay, proof: RailProof,
                  boundary: BaseGeometry) -> EdgeWitness:
    """Accept only an original adjacent pair witnessed by an entire inside physical way.

    Four independent inputs are required: witness, observed way, original adjacency and
    boundary. No nearest-station snapping, endpoint-only containment or code-distance line.
    """
    if witness.pair not in proof.original or witness.osm_way != way.osm_way:
        raise RailEvidenceError("E_RAIL_ORIGINAL_ADJACENCY")
    bindings = dict(proof.station_nodes)
    if len(bindings) != len(proof.station_nodes) or any(
        bindings.get(station) != node
        for station, node in zip(witness.pair.station_ids, witness.station_nodes)
    ):
        raise RailEvidenceError("E_RAIL_STATION_BINDING_EVIDENCE")
    if len(way.node_ids) < 2 or witness.station_nodes != (way.node_ids[0], way.node_ids[-1]):
        raise RailEvidenceError("E_RAIL_STATION_NODE_EVIDENCE")
    clip_way(way, boundary)
    if not boundary.covers(LineString(way.points)):
        raise RailEvidenceError("E_RAIL_OUTSIDE_DETOUR")
    return witness


def verified_subpath(witness: SubpathWitness, way: RailWay, proof: RailProof,
                     boundary: BaseGeometry) -> SubpathWitness:
    """Verify an original adjacent pair on each consecutive inside OSM segment.

    This is distinct from verified_edge's deliberately whole-way endpoint contract.
    It neither connects separate ways nor publishes the resulting witness.
    """
    if witness.pair not in proof.original or witness.osm_way != way.osm_way:
        raise RailEvidenceError("E_RAIL_ORIGINAL_ADJACENCY")
    bindings = dict(proof.station_nodes)
    if len(bindings) != len(proof.station_nodes) or any(
        bindings.get(station) != node
        for station, node in zip(witness.pair.station_ids, witness.station_nodes)
    ):
        raise RailEvidenceError("E_RAIL_STATION_BINDING_EVIDENCE")
    if len(way.node_ids) < 2 or len(way.node_ids) != len(way.points) or way.mode not in MODES:
        raise RailEvidenceError("E_RAIL_WAY_EVIDENCE")
    start, end = witness.indices
    if (start == end or min(start, end) < 0 or max(start, end) >= len(way.node_ids)
        or any(way.node_ids.count(node) != 1 for node in witness.station_nodes)):
        raise RailEvidenceError("E_RAIL_STATION_NODE_EVIDENCE")
    step = 1 if start < end else -1
    indices = range(start, end + step, step)
    if (witness.station_nodes != (way.node_ids[start], way.node_ids[end])
        or witness.node_ids != tuple(way.node_ids[index] for index in indices)):
        raise RailEvidenceError("E_RAIL_STATION_NODE_EVIDENCE")
    if any(not boundary.covers(LineString((way.points[index], way.points[index + step])))
           for index in range(start, end, step)):
        raise RailEvidenceError("E_RAIL_OUTSIDE_DETOUR")
    return witness


def named_line(line_name: str, observed: str) -> bool:
    """A complete operating-line token, never a substring of another line number."""
    return bool(observed and re.search(r"(?<![\w])" + re.escape(line_name) + r"(?![\w])", observed))


def verified_multiway(witness: MultiwayWitness, ways: dict[int, RailWay], names: dict[int, str],
                      line_name: str, proof: RailProof, boundary: BaseGeometry) -> MultiwayWitness:
    """Prove every directed original node interval and every shared-node handoff."""
    if witness.pair not in proof.original:
        raise RailEvidenceError("E_RAIL_ORIGINAL_ADJACENCY")
    bindings = dict(proof.station_nodes)
    if (len(bindings) != len(proof.station_nodes) or any(
        bindings.get(station) != node for station, node in zip(witness.pair.station_ids, witness.station_nodes)
    )):
        raise RailEvidenceError("E_RAIL_STATION_BINDING_EVIDENCE")
    if len(witness.segments) < 2 or len({part.osm_way for part in witness.segments}) != len(witness.segments):
        raise RailEvidenceError("E_RAIL_MULTIWAY_CHAIN")
    previous: NodeId | None = None
    visited: set[NodeId] = set()
    for part in witness.segments:
        way = ways.get(part.osm_way)
        if way is None or not named_line(line_name, names.get(part.osm_way, "")):
            raise RailEvidenceError("E_RAIL_MULTIWAY_WAY_EVIDENCE")
        if len(way.node_ids) < 2 or len(way.points) != len(way.node_ids) or way.mode not in MODES:
            raise RailEvidenceError("E_RAIL_WAY_EVIDENCE")
        start, end = part.indices
        if start == end or min(start, end) < 0 or max(start, end) >= len(way.node_ids):
            raise RailEvidenceError("E_RAIL_MULTIWAY_CHAIN")
        step = 1 if start < end else -1
        indices = range(start, end + step, step)
        if (part.node_ids != tuple(way.node_ids[index] for index in indices)
            or len(set(part.node_ids)) != len(part.node_ids)
            or (previous is not None and part.node_ids[0] != previous)):
            raise RailEvidenceError("E_RAIL_MULTIWAY_CHAIN")
        if visited.intersection(part.node_ids[1:] if previous is not None else part.node_ids):
            raise RailEvidenceError("E_RAIL_MULTIWAY_CHAIN")
        if any(not boundary.covers(LineString((way.points[index], way.points[index + step])))
               for index in range(start, end, step)):
            raise RailEvidenceError("E_RAIL_OUTSIDE_DETOUR")
        previous = part.node_ids[-1]
        visited.update(part.node_ids)
    if witness.segments[0].node_ids[0] != witness.station_nodes[0] or previous != witness.station_nodes[1]:
        raise RailEvidenceError("E_RAIL_STATION_NODE_EVIDENCE")
    if any(ways[part.osm_way].node_ids.count(node) > 1
           for part in witness.segments for node in witness.station_nodes):
        raise RailEvidenceError("E_RAIL_STATION_NODE_EVIDENCE")
    return witness


def multiway_routes(pair: AdjacentPair, line_name: str, left: list[tuple[NodeId, str, str]],
                    right: list[tuple[NodeId, str, str]], tracks: CandidateWays,
                    boundary: BaseGeometry, original_pairs: set[frozenset[StationId]],
                    max_ways: int = 4) -> tuple[list[MultiwayWitness], bool]:
    """Enumerate two paths at most; flag the finite search bound and result cap."""
    if frozenset(pair.station_ids) not in original_pairs:
        return [], False
    relevant = {id: way for id, way in tracks.ways.items() if named_line(line_name, tracks.names[id])}
    by_node: dict[NodeId, list[tuple[int, int]]] = {}
    for id, way in relevant.items():
        for index, node in enumerate(way.node_ids):
            by_node.setdefault(node, []).append((id, index))
    results: list[MultiwayWitness] = []
    targets = {node for node, _, _ in right}
    incomplete = False

    def walk(node: NodeId, origin: NodeId, used: frozenset[int], segments: tuple[WaySegment, ...],
             seen: frozenset[NodeId]) -> None:
        nonlocal incomplete
        if len(results) >= 2:
            incomplete = True
            return
        if node in targets:
            if len(segments) >= 2:
                witness = MultiwayWitness(pair=pair, station_nodes=(origin, node), segments=segments)
                proof = RailProof((pair,), tuple(zip(pair.station_ids, (origin, node))))
                verified_multiway(witness, relevant, tracks.names, line_name, proof, boundary)
                results.append(witness)
            return
        if len(segments) == max_ways:
            if any(way_id not in used for way_id, _ in by_node.get(node, ())):
                incomplete = True
            return
        for way_id, start in sorted(by_node.get(node, ())):
            if way_id in used:
                continue
            way = relevant[way_id]
            if way.node_ids.count(node) != 1:
                continue
            for step in (-1, 1):
                for end in range(start + step, len(way.node_ids) if step > 0 else -1, step):
                    next_node = way.node_ids[end]
                    if next_node in seen or way.node_ids.count(next_node) != 1:
                        break
                    if not boundary.covers(LineString((way.points[end - step], way.points[end]))):
                        break
                    if next_node in tracks.stops and next_node not in targets:
                        break
                    if next_node in by_node and (next_node in targets or
                        any(other != way_id and other not in used for other, _ in by_node[next_node])):
                        indices = range(start, end + step, step)
                        part = WaySegment(osm_way=way_id, indices=(start, end),
                                          node_ids=tuple(way.node_ids[i] for i in indices))
                        walk(next_node, origin, used | {way_id}, segments + (part,),
                             seen | set(part.node_ids[1:]))
                        if len(results) >= 2:
                            return

    for node, _, _ in left:
        if len(results) >= 2:
            incomplete = True
            break
        walk(node, node, frozenset(), (), frozenset({node}))
    return results, incomplete


class SeoulRail(osmium.SimpleHandler):
    """Mutable OSM callback accumulator; stores only independently clipped way pieces."""

    def __init__(self, boundary: BaseGeometry) -> None:
        super().__init__()
        self.boundary = boundary
        self.paths: list[RailPiece] = []
        self.observed_ways = 0

    def way(self, way: Way) -> None:
        """Preserve OSM node order and way identity; missing locations fail closed."""
        mode = way.tags.get("railway", "")
        if mode not in MODES:
            return
        self.observed_ways += 1
        observed = RailWay(osm_way=way.id, mode=mode,
                           node_ids=tuple(NodeId(node.ref) for node in way.nodes),
                           points=tuple((node.lon, node.lat) for node in way.nodes))
        if len(observed.points) < 2:
            raise RailEvidenceError("E_RAIL_WAY_EVIDENCE")
        if not LineString(observed.points).intersects(self.boundary):
            return
        self.paths.extend(clip_way(observed, self.boundary))


class StopCandidates(osmium.SimpleHandler):
    """First PBF pass: retain only explicitly named, coded stops inside the city."""

    def __init__(self, requested: dict[str, set[str]], boundary: BaseGeometry) -> None:
        super().__init__()
        self.requested = requested
        self.boundary = boundary
        self.by_code: dict[str, list[tuple[NodeId, str, str]]] = {code: [] for code in requested}
        self.name_matches: dict[str, int] = {code: 0 for code in requested}
        self.by_name: dict[str, list[tuple[NodeId, str, str]]] = {name: [] for names in requested.values() for name in names}

    def node(self, node: Node) -> None:
        if node.tags.get("railway") != "stop" or node.tags.get("public_transport") != "stop_position":
            return
        name = node.tags.get("name:ko") or node.tags.get("name", "")
        if not name or not node.location.valid() or not self.boundary.covers(Point(node.lon, node.lat)):
            return
        if name in self.by_name:
            self.by_name[name].append((NodeId(node.id), name, node.tags.get("ref") or ""))
        for code, names in self.requested.items():
            if name not in names:
                continue
            self.name_matches[code] += 1
            # Way's matching named operating line supplies independent line evidence
            # when OSM platform refs differ from the operator diagram's code.
            self.by_code[code].append((NodeId(node.id), name, node.tags.get("ref") or ""))


class CandidateWays(osmium.SimpleHandler):
    """Second PBF pass: retain city-intersecting ways, including intermediate ways."""

    def __init__(self, stops: set[NodeId], boundary: BaseGeometry | None = None) -> None:
        super().__init__()
        self.stops = stops
        self.boundary = boundary
        self.ways: dict[int, RailWay] = {}
        self.names: dict[int, str] = {}
        self.incident: dict[NodeId, set[int]] = {node: set() for node in stops}

    def way(self, way: Way) -> None:
        mode = way.tags.get("railway", "")
        if mode not in MODES:
            return
        hits = self.stops.intersection(node.ref for node in way.nodes)
        if not hits and self.boundary is None:
            return
        observed = RailWay(osm_way=way.id, mode=mode,
                           node_ids=tuple(NodeId(node.ref) for node in way.nodes),
                           points=tuple((node.lon, node.lat) for node in way.nodes))
        if self.boundary is not None and (len(observed.points) < 2 or
            not LineString(observed.points).intersects(self.boundary)):
            return
        self.ways[way.id] = observed
        self.names[way.id] = way.tags.get("name:ko") or way.tags.get("name", "") or ""
        for node in hits:
            self.incident[node].add(way.id)


def classify_pair(pair: AdjacentPair, line_name: str, stops: StopCandidates,
                  tracks: CandidateWays, boundary: BaseGeometry,
                  original_pairs: set[frozenset[StationId]] | None = None) -> dict:
    """Withhold uncertain stops or track routes; return one exact single-way witness at most."""
    left, right = (stops.by_code[code] for code in pair.codes)
    base: dict[str, str | list[str] | list[int] | dict[str, int | list[int]]] = {
        "lineId": pair.line_id, "codes": list(pair.codes), "stationIds": list(pair.station_ids)
    }
    if not left or not right:
        return base | {"status": "missing", "reason": "no-exact-named-stop",
                       "candidateCounts": [len(left), len(right)],
                       "nameOnlyCounts": [stops.name_matches[code] for code in pair.codes]}
    # A platform pair may expose two travel directions; select only a unique proven chain.
    witnesses: list[SubpathWitness] = []
    common: set[int] = set()
    for a, _, _ in left:
        for b, _, _ in right:
            common.update(tracks.incident[a] & tracks.incident[b])
            for way_id in sorted(tracks.incident[a] & tracks.incident[b]):
                way = tracks.ways[way_id]
                if not named_line(line_name, tracks.names[way_id]):
                    continue
                starts = [i for i, node in enumerate(way.node_ids) if node == a]
                ends = [i for i, node in enumerate(way.node_ids) if node == b]
                if len(starts) != 1 or len(ends) != 1 or starts[0] == ends[0]:
                    continue
                start, end = starts[0], ends[0]
                step = 1 if start < end else -1
                witness = SubpathWitness(pair=pair, osm_way=way_id, station_nodes=(a, b),
                                         indices=(start, end),
                                         node_ids=tuple(way.node_ids[i] for i in range(start, end + step, step)))
                try:
                    verified_subpath(witness, way, RailProof((pair,), tuple(zip(pair.station_ids, (a, b)))), boundary)
                except RailEvidenceError as error:
                    if error.code != "E_RAIL_OUTSIDE_DETOUR":
                        raise
                else:
                    witnesses.append(witness)
    if len(witnesses) == 1 and original_pairs is None:
        witness = witnesses[0]
        return base | {"status": "verified", "witness": {
            "osmWay": witness.osm_way, "stopNodes": list(witness.station_nodes),
            "stopRefs": [next(ref for node, _, ref in side if node == bound)
                         for side, bound in zip((left, right), witness.station_nodes)],
            "bindingEvidence": "exact-name-and-named-line-with-ref-recorded",
            "indices": list(witness.indices), "orderedOsmNodeIds": list(witness.node_ids)}}
    if len(witnesses) > 1:
        return base | {"status": "ambiguous", "reason": "multiple-inside-single-way-witnesses",
                       "candidateWays": sorted({item.osm_way for item in witnesses}),
                       "candidateStopNodes": sorted({node for item in witnesses for node in item.station_nodes})}
    if original_pairs is not None:
        routes, incomplete = multiway_routes(pair, line_name, left, right, tracks, boundary, original_pairs)
        if len(witnesses) == 1 and not routes:
            witness = witnesses[0]
            return base | {"status": "verified", "searchBoundWays": 4,
                           "multiwaySearchIncomplete": incomplete, "witness": {
                "osmWay": witness.osm_way, "stopNodes": list(witness.station_nodes),
                "stopRefs": [next(ref for node, _, ref in side if node == bound)
                             for side, bound in zip((left, right), witness.station_nodes)],
                "bindingEvidence": "exact-name-and-named-line-with-ref-recorded",
                "indices": list(witness.indices), "orderedOsmNodeIds": list(witness.node_ids)}}
        if len(routes) == 1 and not witnesses:
            route = routes[0]
            return base | {"status": "bounded-multiway-candidate", "searchBoundWays": 4,
                           "searchIncomplete": incomplete, "routeUniquenessProven": False, "witness": {
                "stopNodes": list(route.station_nodes), "bindingEvidence": "exact-name-and-named-line-with-ref-recorded",
                "stopRefs": [next(ref for node, _, ref in side if node == bound)
                             for side, bound in zip((left, right), route.station_nodes)],
                "segments": [{"osmWay": segment.osm_way, "indices": list(segment.indices),
                              "orderedOsmNodeIds": list(segment.node_ids)} for segment in route.segments]}}
        if len(routes) > 1 or (routes and witnesses):
            return base | {"status": "ambiguous", "reason": "multiple-inside-multiway-routes",
                           "searchBoundWays": 4, "searchIncomplete": incomplete,
                           "candidateRoutes": [[segment.osm_way for segment in route.segments] for route in routes]}
        if incomplete:
            return base | {"status": "multiwaygap", "reason": "bounded-search-incomplete",
                           "searchBoundWays": 4, "searchIncomplete": True,
                           "candidateWays": sorted({item.osm_way for item in witnesses})}
    if common:
        return base | {"status": "multiwaygap", "reason": "shared-way-but-line-or-subpath-unproven",
                       "candidateWays": sorted(common)}
    return base | {"status": "multiwaygap", "reason": "no-shared-single-way",
                   "leftWays": sorted({way for node, _, _ in left for way in tracks.incident[node]}),
                   "rightWays": sorted({way for node, _, _ in right for way in tracks.incident[node]})}


def private_witness_inventory() -> dict:
    """Classify every mapped official adjacent record without changing published edges."""
    source = json.loads(checked_bytes(ROOT / "lore/places/regular-line-adjacency.json", OFFICIAL_SHA))
    original = json.loads(checked_bytes(ROOT / "snapshots/build-inputs/SeoulWorldGraph.json", ORIGINAL_SHA))
    aliases = original["aliases"]
    original_ids = {station["id"] for station in original["stations"]}
    requested: dict[str, set[str]] = {}
    pairs: list[tuple[AdjacentPair, str]] = []
    for line in source["lines"]:
        for path in line["paths"]:
            for before, after in zip(path, path[1:]):
                codes = (before["code"], after["code"])
                ids = tuple(source["stationIdsByCode"].get(code) for code in codes)
                if not all(ids) or ids[0] == ids[1]:
                    continue
                if not all(station in original_ids for station in ids):
                    raise RailEvidenceError("E_RAIL_ORIGINAL_STATION")
                pair = AdjacentPair(line_id=line["id"], codes=codes, station_ids=ids)
                pairs.append((pair, line["name"]))
                for stop, station in zip((before, after), ids):
                    requested.setdefault(stop["code"], set()).update((stop["name"], station))
                    requested[stop["code"]].update(name for name, alias in aliases.items() if alias == station)
    pbf = ROOT / "data/geography/osm/south-korea-20261009.osm.pbf"
    with pbf.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != OSM_SHA:
            raise RailEvidenceError("E_RAIL_OSM_HASH")
    boundary = seoul_boundary()
    stops = StopCandidates(requested, boundary)
    stops.apply_file(str(pbf), locations=True, idx="flex_mem")
    tracks = CandidateWays({node for candidates in stops.by_code.values() for node, _, _ in candidates}, boundary)
    tracks.apply_file(str(pbf), locations=True, idx="flex_mem")
    original_pairs = {frozenset((edge["a"], edge["b"])) for edge in original["edges"]}
    rows = [classify_pair(pair, name, stops, tracks, boundary, original_pairs) for pair, name in pairs]
    return {"schema": "private-physical-rail-witness-candidates.v1", "osmSha256": OSM_SHA,
            "boundarySha256": BOUNDARY_SHA, "officialSha256": OFFICIAL_SHA, "originalSha256": ORIGINAL_SHA,
            "passage2126": "unknown", "recordCount": len(rows),
            "uniqueStationPairs": len({tuple(sorted(pair.station_ids)) for pair, _ in pairs}), "records": rows}


def observed_subset() -> PhysicalSubset:
    """Extract actual mapped ways; do not infer a station graph without bindings."""
    pbf = ROOT / "data/geography/osm/south-korea-20261009.osm.pbf"
    with pbf.open("rb") as source:
        if hashlib.file_digest(source, "sha256").hexdigest() != OSM_SHA:
            raise RailEvidenceError("E_RAIL_OSM_HASH")
    rail = SeoulRail(seoul_boundary())
    rail.apply_file(str(pbf), locations=True, idx="flex_mem")
    return PhysicalSubset(paths=tuple(sorted(rail.paths, key=lambda piece: (piece.osm_way, piece.id))))


class PhysicalConnection(BaseModel):
    """One observed connection, not an exhaustive or selected travel route."""
    model_config = ConfigDict(frozen=True, extra="forbid")
    pair: AdjacentPair
    station_nodes: tuple[NodeId, NodeId]
    segments: tuple[WaySegment, ...]
    points: tuple[tuple[float, float], ...]
    physical_existence: Literal["witnessed"] = "witnessed"
    route_uniqueness_proven: Literal[False] = False
    alternatives: Literal["unknown"] = "unknown"
    selected_game_travel_route: None = None
    passage2126: Literal["unknown"] = "unknown"
    search_bound_ways: int
    search_incomplete: bool


class PhysicalWitnessProduct(BaseModel):
    """Private bounded product; deliberately incompatible with public map v1."""
    model_config = ConfigDict(frozen=True, extra="forbid")
    schema_version: Literal["private-physical-rail-existence.v1"] = "private-physical-rail-existence.v1"
    projection: Literal["EPSG:4326"] = "EPSG:4326"
    source_sha256: dict[str, str]
    edges: tuple[PhysicalConnection, ...]
    record_count: int
    unique_station_pairs: int
    original_adjacency_matches: int
    residual_status_counts: dict[str, int]
    residual_records: tuple[dict, ...]
    route_uniqueness_proven: Literal[False] = False
    selected_game_travel_route: None = None
    passage2126: Literal["unknown"] = "unknown"
    public_integration: Literal["blocked-shared-consumer-outside-scope"] = "blocked-shared-consumer-outside-scope"


@dataclass(frozen=True)
class WitnessSources:
    official: dict
    original: dict
    inventory: dict
    audit: dict
    stops: StopCandidates
    tracks: CandidateWays
    boundary: BaseGeometry


def load_witness_sources() -> WitnessSources:
    """Read receipt bytes and replay their observations against the pinned actual PBF."""
    directory = ROOT / ".omo/private/seoul-migration/physical-rail-multiway-witness-20261015"
    inventory = json.loads(checked_bytes(directory / "inventory.json", INVENTORY_SHA))
    audit = json.loads(checked_bytes(directory / "independent.json", AUDIT_SHA))
    official = json.loads(checked_bytes(ROOT / "lore/places/regular-line-adjacency.json", OFFICIAL_SHA))
    original = json.loads(checked_bytes(ROOT / "snapshots/build-inputs/SeoulWorldGraph.json", ORIGINAL_SHA))
    expected = {"boundary": BOUNDARY_SHA, "osm": OSM_SHA, "official": OFFICIAL_SHA, "original": ORIGINAL_SHA}
    if (audit["sourceSha256"] != expected or audit["verdict"] != "bounded-PASS"
        or any(inventory[key + "Sha256"] != value for key, value in expected.items())):
        raise RailEvidenceError("E_RAIL_RECEIPT_SOURCE")
    pbf = ROOT / "data/geography/osm/south-korea-20261009.osm.pbf"
    with pbf.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != OSM_SHA:
            raise RailEvidenceError("E_RAIL_OSM_HASH")
    requested: dict[str, set[str]] = {}
    for line in official["lines"]:
        for path in line["paths"]:
            for stop in path:
                station = official["stationIdsByCode"].get(stop["code"])
                if station:
                    requested.setdefault(stop["code"], set()).update((stop["name"], station))
                    requested[stop["code"]].update(name for name, target in original["aliases"].items()
                                                    if target == station)
    boundary = seoul_boundary()
    stops = StopCandidates(requested, boundary)
    stops.apply_file(str(pbf), locations=True, idx="flex_mem")
    tracks = CandidateWays({node for side in stops.by_code.values() for node, _, _ in side}, boundary)
    tracks.apply_file(str(pbf), locations=True, idx="flex_mem")
    return WitnessSources(official, original, inventory, audit, stops, tracks, boundary)


def physical_connection(row: dict, sources: WitnessSources) -> PhysicalConnection:
    """Consume a candidate only after independent identity, adjacency and full-segment checks."""
    pair = AdjacentPair(line_id=row["lineId"], codes=tuple(row["codes"]), station_ids=tuple(row["stationIds"]))
    matches = [(line["name"], before, after) for line in sources.official["lines"]
               if line["id"] == pair.line_id for path in line["paths"]
               for before, after in zip(path, path[1:])
               if (before["code"], after["code"]) == pair.codes]
    if not matches or any(tuple(sources.official["stationIdsByCode"].get(code) for code in pair.codes)
                          != pair.station_ids for _ in matches):
        raise RailEvidenceError("E_RAIL_ORIGINAL_ADJACENCY")
    if len({(name, a["name"], b["name"]) for name, a, b in matches}) != 1:
        raise RailEvidenceError("E_RAIL_SOURCE_AMBIGUITY")
    station_ids = {station["id"] for station in sources.original["stations"]}
    if (not set(pair.station_ids).issubset(station_ids)
        or not any(frozenset((edge["a"], edge["b"])) == frozenset(pair.station_ids)
                   for edge in sources.original["edges"])):
        raise RailEvidenceError("E_RAIL_ORIGINAL_ADJACENCY")
    if row["status"] not in {"verified", "bounded-multiway-candidate"} or row.get("routeUniquenessProven", False):
        raise RailEvidenceError("E_RAIL_EXISTENCE_ONLY")
    evidence = row["witness"]
    if len(evidence["stopNodes"]) != 2 or len(evidence["stopRefs"]) != 2:
        raise RailEvidenceError("E_RAIL_STATION_BINDING_EVIDENCE")
    nodes = (NodeId(evidence["stopNodes"][0]), NodeId(evidence["stopNodes"][1]))
    line_name, before, after = matches[0]
    for stop, station, node, ref in zip((before, after), pair.station_ids, nodes, evidence["stopRefs"], strict=True):
        names = {stop["name"], station} | {name for name, target in sources.original["aliases"].items()
                                          if target == station}
        observed = {(candidate, name, observed_ref) for name in names
                    for candidate, _, observed_ref in sources.stops.by_name.get(name, ())}
        if not any(candidate == node and observed_ref == ref for candidate, _, observed_ref in observed):
            raise RailEvidenceError("E_RAIL_STATION_BINDING_EVIDENCE")
    proof = RailProof((pair,), tuple(zip(pair.station_ids, nodes, strict=True)))
    raw_segments = evidence.get("segments", [evidence])
    segments = tuple(WaySegment(osm_way=part["osmWay"], indices=tuple(part["indices"]),
                                node_ids=tuple(part["orderedOsmNodeIds"])) for part in raw_segments)
    if len(segments) == 1:
        part = segments[0]
        way = sources.tracks.ways.get(part.osm_way)
        if way is None or not named_line(line_name, sources.tracks.names.get(part.osm_way, "")):
            raise RailEvidenceError("E_RAIL_MULTIWAY_WAY_EVIDENCE")
        verified_subpath(SubpathWitness(pair=pair, station_nodes=nodes, **part.model_dump()),
                         way, proof, sources.boundary)
    else:
        verified_multiway(MultiwayWitness(pair=pair, station_nodes=nodes, segments=segments),
                         sources.tracks.ways, sources.tracks.names, line_name, proof, sources.boundary)
    points: list[tuple[float, float]] = []
    for part in segments:
        start, end = part.indices
        step = 1 if start < end else -1
        observed_points = [sources.tracks.ways[part.osm_way].points[i] for i in range(start, end + step, step)]
        if points and points[-1] != observed_points[0]:
            raise RailEvidenceError("E_RAIL_MULTIWAY_CHAIN")
        points.extend(observed_points[1:] if points else observed_points)
    if len(set(node for part in segments for node in part.node_ids)) != len(points):
        raise RailEvidenceError("E_RAIL_MULTIWAY_CHAIN")
    return PhysicalConnection(pair=pair, station_nodes=nodes, segments=segments, points=tuple(points),
                              search_bound_ways=row["searchBoundWays"],
                              search_incomplete=row.get("searchIncomplete", row.get("multiwaySearchIncomplete", False)))


def private_existence_product(sources: WitnessSources | None = None) -> PhysicalWitnessProduct:
    """Produce the 33 bounded witnesses, retaining every unresolved source record."""
    sources = sources if sources is not None else load_witness_sources()
    records = sources.inventory["records"]
    counts = dict(Counter(row["status"] for row in records))
    original_pairs = {frozenset((edge["a"], edge["b"])) for edge in sources.original["edges"]}
    matches = sum(frozenset(row["stationIds"]) in original_pairs for row in records)
    unique = len({frozenset(row["stationIds"]) for row in records})
    if (len(records) != sources.audit["recordCount"] or unique != sources.audit["uniqueStationPairs"]
        or matches != sources.audit["originalAdjacencyMatches"] or counts != sources.audit["statusCounts"]
        or len({(row["lineId"], tuple(row["codes"])) for row in records}) != len(records)):
        raise RailEvidenceError("E_RAIL_RECEIPT_COUNTS")
    edges = tuple(physical_connection(row, sources) for row in records
                  if row["status"] in {"verified", "bounded-multiway-candidate"})
    residual = tuple(row for row in records if row["status"] not in {"verified", "bounded-multiway-candidate"})
    return PhysicalWitnessProduct(source_sha256={"boundary": BOUNDARY_SHA, "osm": OSM_SHA,
        "official": OFFICIAL_SHA, "original": ORIGINAL_SHA, "inventory": INVENTORY_SHA, "audit": AUDIT_SHA},
        edges=edges, record_count=len(records), unique_station_pairs=unique,
        original_adjacency_matches=matches, residual_status_counts=dict(Counter(row["status"] for row in residual)),
        residual_records=residual)


def consume_existence_product(product: PhysicalWitnessProduct, sources: WitnessSources) -> tuple[PhysicalConnection, ...]:
    """Rebuild from checked sources: no supplied geometry or uniqueness flag is trusted."""
    if product != private_existence_product(sources):
        raise RailEvidenceError("E_RAIL_PRODUCT_EVIDENCE")
    return product.edges


if __name__ == "__main__":
    if sys.argv[1:] == ["--private-existence-product"]:
        print(private_existence_product().model_dump_json())
    elif sys.argv[1:] == ["--check-private-existence-product"]:
        path = ROOT / ".omo/private/seoul-migration/physical-rail-witness-integration-20261016/product.json"
        data = path.read_bytes()
        product = PhysicalWitnessProduct.model_validate_json(data)
        edges = consume_existence_product(product, load_witness_sources())
        print(json.dumps({"schema": "private-physical-rail-existence-check.v1", "verdict": "bounded-PASS",
            "productSha256": hashlib.sha256(data).hexdigest(), "witnessCount": len(edges),
            "singleWayCount": sum(len(edge.segments) == 1 for edge in edges),
            "multiwayCount": sum(len(edge.segments) > 1 for edge in edges),
            "recordCount": product.record_count, "uniqueStationPairs": product.unique_station_pairs,
            "originalAdjacencyMatches": product.original_adjacency_matches,
            "residualStatusCounts": product.residual_status_counts,
            "searchIncompletePairs": [edge.pair.model_dump() for edge in edges if edge.search_incomplete],
            "routeUniquenessProven": False, "selectedGameTravelRoute": None,
            "passage2126": "unknown", "publicIntegration": product.public_integration}, ensure_ascii=False))
    elif sys.argv[1:] == ["--private-witness-inventory"]:
        destination = ROOT / ".omo/private/seoul-migration/physical-rail-witness-extraction-20261015/inventory.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(private_witness_inventory(), ensure_ascii=False, sort_keys=True,
                                          separators=(",", ":")) + "\n", encoding="utf-8")
        print(destination)
    elif sys.argv[1:] == ["--private-multiway-witness"]:
        destination = ROOT / ".omo/private/seoul-migration/physical-rail-multiway-witness-20261015/inventory.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        inventory = private_witness_inventory()
        inventory["schema"] = "private-physical-rail-multiway-witness-candidates.v1"
        inventory["statusCounts"] = {status: sum(row["status"] == status for row in inventory["records"])
                                     for status in sorted({row["status"] for row in inventory["records"]})}
        original = json.loads(checked_bytes(ROOT / "snapshots/build-inputs/SeoulWorldGraph.json", ORIGINAL_SHA))
        original_pairs = {frozenset((edge["a"], edge["b"])) for edge in original["edges"]}
        inventory["originalAdjacencyMatches"] = sum(frozenset(row["stationIds"]) in original_pairs
                                                    for row in inventory["records"])
        destination.write_text(json.dumps(inventory, ensure_ascii=False, sort_keys=True,
                                          separators=(",", ":")) + "\n", encoding="utf-8")
        print(destination)
    else:
        print(observed_subset().model_dump_json())
