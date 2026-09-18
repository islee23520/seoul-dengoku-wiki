"""Read original primitives; libosmium assembles genuine member-based areas."""
from collections import Counter
import hashlib
import json

import osmium
import osmium.area
import osmium.geom
import osmium.index
import osmium.io
import osmium.osm
import shapely
from shapely.geometry import GeometryCollection, Point, Polygon


FACILITY_KEYS = {"amenity", "shop", "tourism", "leisure", "office", "craft", "healthcare", "industrial"}
LANDSCAPE_KEYS = {"landuse", "natural", "water", "waterway", "landcover"}
CONTACT_KEYS = {"phone", "fax", "email", "website", "url", "contact", "operator:phone", "operator:email"}


def classify(tags):
    classes = []
    rail_mode = tags.get("station") in {"subway", "light_rail", "train"} or any(
        tags.get(mode) == "yes" for mode in ("subway", "train", "light_rail")
    )
    station = tags.get("railway") in {"station", "halt"} or (
        tags.get("public_transport") == "station" and rail_mode
    )
    if station:
        classes.append("subway_station" if tags.get("station") == "subway" or tags.get("subway") == "yes" else "rail_station")
    if any(k in tags for k in ("railway", "public_transport", "aeroway", "route")) or tags.get("highway") == "bus_stop":
        classes.append("access")
    if FACILITY_KEYS.intersection(tags) or tags.get("man_made") in {"water_works", "wastewater_plant", "water_tower", "pumping_station", "works", "storage_tank"} or tags.get("power") in {"plant", "substation", "generator"} or tags.get("aeroway") in {"aerodrome", "terminal", "hangar"}:
        classes.append("facility")
    if LANDSCAPE_KEYS.intersection(tags) or tags.get("aeroway") in {"aerodrome", "runway", "taxiway"}:
        classes.append("landscape")
    if "building" in tags or "building:part" in tags:
        classes.append("building_context")
    if "highway" in tags:
        classes.append("road_context")
    return classes or ["other_context"]


def area_way(tags):
    if tags.get("area") == "no":
        return False
    return tags.get("area") == "yes" or any(k in tags for k in ("building", "building:part", "landuse", "amenity", "shop", "leisure", "tourism", "office")) or tags.get("natural") in {"water", "wood", "scrub", "heath", "grassland", "wetland", "sand", "beach", "bare_rock", "scree"}


def safe_tags(tags):
    return {k: v for k, v in tags.items() if k not in CONTACT_KEYS and not k.startswith("contact:")}


def source_fingerprint(record):
    body = {k: record[k] for k in ("id", "tags", "members", "geometry_reason", "object_timestamp")}
    body["wkb"] = record["shape"].wkb_hex if record["shape"] is not None else None
    return hashlib.sha256(json.dumps(body, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


class SourceScan(osmium.SimpleHandler):
    def __init__(self, locations):
        super().__init__()
        self.locations = locations
        self.factory = osmium.geom.WKBFactory()
        self.records = {}
        self.ways = {}
        self.relations = {}
        self.areas = {}
        self.primitives = Counter()
        self.untagged_nodes = 0

    def add(self, primitive, obj, geometry, reason=None):
        rid = f"osm:{primitive}:{obj.id}"
        tags = safe_tags(dict(obj.tags))
        self.records[rid] = dict(id=rid, primitive=primitive, source_object_id=obj.id,
                                tags=tags, classification=classify(tags), shape=geometry,
                                geometry_reason=reason, members=[],
                                object_timestamp=obj.timestamp.isoformat().replace("+00:00", "Z"))

    def node(self, node):
        self.primitives["node"] += 1
        if not node.tags:
            self.untagged_nodes += 1
            return
        geometry = Point(node.location.lon, node.location.lat) if node.location.valid() else None
        self.add("node", node, geometry, None if geometry else "missing_node_location")

    def way(self, way):
        self.primitives["way"] += 1
        geometry, reason = None, None
        try:
            geometry = shapely.from_wkb(self.factory.create_linestring(way))
        except (RuntimeError, osmium.InvalidLocationError, shapely.errors.GEOSException) as error:
            reason = "way_geometry:" + str(error)
        self.ways[way.id] = geometry
        if geometry is not None and way.is_closed() and area_way(dict(way.tags)):
            geometry = Polygon(geometry.coords)
        self.add("way", way, geometry, reason)

    def relation(self, relation):
        self.primitives["relation"] += 1
        self.add("relation", relation, None)
        record = self.records[f"osm:relation:{relation.id}"]
        record["members"] = [dict(type=m.type, ref=m.ref, role=m.role) for m in relation.members]
        self.relations[relation.id] = record

    def area(self, area):
        if area.from_way():
            return
        try:
            self.areas[area.orig_id()] = shapely.from_wkb(self.factory.create_multipolygon(area))
        except (RuntimeError, osmium.InvalidLocationError, shapely.errors.GEOSException) as error:
            self.areas[area.orig_id()] = "area_geometry:" + str(error)

    def relation_geometry(self, rid, chain=()):
        if rid in chain or rid not in self.relations:
            return None, "missing_or_cyclic_relation:" + str(rid)
        record = self.relations[rid]
        if record["shape"] is not None or record["geometry_reason"]:
            return record["shape"], record["geometry_reason"]
        if record["tags"].get("type") in {"multipolygon", "boundary"}:
            area = self.areas.get(rid)
            if area is None or isinstance(area, str):
                return None, area or "area_assembly_failed_or_incomplete_members"
            return area, None
        parts, errors = [], []
        for member in record["members"]:
            geometry, reason = None, None
            match member["type"]:
                case "w":
                    geometry = self.ways.get(member["ref"])
                case "n":
                    try:
                        location = self.locations.get(member["ref"])
                        if location.valid():
                            geometry = Point(location.lon, location.lat)
                    except KeyError:
                        reason = "missing_member_node"
                case "r":
                    geometry, reason = self.relation_geometry(member["ref"], chain + (rid,))
                case other:
                    reason = "unknown_member_type:" + other
            if geometry is None or reason:
                errors.append(reason or f"missing_member:{member['type']}{member['ref']}")
            else:
                parts.append(geometry)
        return GeometryCollection(parts), ";".join(errors) or (None if parts else "empty_relation")


def read_candidates(path):
    locations = osmium.index.create_map("flex_mem")
    scan = SourceScan(locations)
    areas = osmium.area.AreaManager()
    with osmium.io.Reader(str(path), osmium.osm.RELATION) as reader:
        osmium.apply(reader, areas.first_pass_handler())
    handler = osmium.NodeLocationsForWays(locations)
    handler.ignore_errors()
    with osmium.io.Reader(str(path)) as reader:
        osmium.apply(reader, handler, areas.second_pass_handler(scan), scan)
    for rid, record in scan.relations.items():
        record["shape"], record["geometry_reason"] = scan.relation_geometry(rid)
    records = list(scan.records.values())
    digest = hashlib.sha256()
    for record in records:
        geometry = record["shape"]
        if geometry is not None and (geometry.is_empty or not geometry.is_valid):
            record["geometry_reason"] = record["geometry_reason"] or "invalid_source_geometry:" + shapely.is_valid_reason(geometry)
        record["source_fingerprint"] = source_fingerprint(record)
        digest.update((record["id"] + " " + record["source_fingerprint"] + "\n").encode())
    return records, dict(primitives=dict(scan.primitives), untagged_dependency_nodes=scan.untagged_nodes,
                         candidate_count=len(records), candidate_digest_sha256=digest.hexdigest(),
                         candidate_policy="Every tagged node and every way/relation, including unnamed and unclassified context; untagged nodes counted as structural dependencies.")
