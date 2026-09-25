"""Bake offline Mapzen terrain and CC BY 4.0 administrative boundaries.

Run with --fetch once, then rerun from the local --cache without network.
The cache belongs outside the repository; only the compact public assets are committed.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
from urllib.parse import quote

import numpy as np
import osmium
import osmium.geom
from PIL import Image
from scipy.ndimage import gaussian_filter, median_filter
from scipy.spatial import cKDTree
from shapely.geometry import box, shape, mapping
from shapely import contains_xy
from shapely.ops import transform as shape_transform, unary_union
from shapely.strtree import STRtree
from shapely import wkb
from rasterio.warp import transform as crs_transform

SOURCES = {
    "boundaries.geojson": "https://raw.githubusercontent.com/vuski/admdongkor/master/ver20260701/HangJeongDong_ver20260701.geojson",
    "lines.geojson": "https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/lines.geojson",
    "stations.geojson": "https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/stations.geojson",
    "official-stations.csv": "https://raw.githubusercontent.com/xuanx1/seoulMetro/main/seoul_subway_station_information.csv",
}
OSM_ROUTES = {"G": 8656357, "SH": 8725314, "E": 3573517, "I2": 7527496, "KK": 6462562, "KP": 10092719, "SL": 14191876, "W": 7533582}
OSM_FULL = {"I": [19425645], "U": [7530880], "1-GA": [17413294, 18828088]}
for _line, _relation in OSM_ROUTES.items():
    _query = f"[out:json][timeout:120];relation({_relation});out geom;"
    SOURCES[f"osm-{_relation}.json"] = "https://overpass.kumi.systems/api/interpreter?data=" + quote(_query)
for _line, _relations in OSM_FULL.items():
    for _relation in _relations:
        SOURCES[f"osm-{_relation}-full.xml"] = f"https://api.openstreetmap.org/api/0.6/relation/{_relation}/full"
SH_STOPS = (5891336917, 8334213106, 11015793561, 11015720679, 8239424020, 5900500322, 5692879222, 5271460818, 5921531701, 5921531696, 5921531693, 5921531688, 5528524289, 5528524288, 355173121, 5921531568, 5921531565)
SOURCES["osm-8725314-stations.xml"] = "https://api.openstreetmap.org/api/0.6/nodes?nodes=" + ",".join(map(str, SH_STOPS))
SOURCES["osm-jipyeong.json"] = "https://nominatim.openstreetmap.org/search?q=%EC%A7%80%ED%8F%89%EC%97%AD%2C+%EC%96%91%ED%8F%89%EA%B5%B0%2C+%EB%8C%80%ED%95%9C%EB%AF%BC%EA%B5%AD&format=json&limit=5"
PENINSULA = (124.0, 33.0, 131.4, 43.5)
METRO = (125.8, 36.55, 128.2, 38.3)
CITY_PARTS = {
    "고양": ["고양시"], "양평": ["양평군"], "춘천": ["춘천시"],
    "천안·아산": ["천안시", "아산시"], "시흥": ["시흥시"],
    "인천": ["인천광역시"], "파주": ["파주시"], "하남": ["하남시"],
    "남양주": ["남양주시"], "의정부·연천": ["의정부시", "연천군"],
    "성남": ["성남시"], "수원": ["수원시"], "영종": ["영종"],
}
LINE_IDS = {"1": "2-1", "2": "3-2", "3": "4-3", "4": "5-4", "5": "6-5", "6": "7-6", "7": "8-7", "8": "9-8", "9": "10-9", "airport": "A", "bundang": "B", "gyeongui": "K", "shinbundang": "S"}
DETAIL_BOX = (825000, 1825000, 1075000, 2050000)
DETAIL_CELL = 25000
DETAIL_INTERVALS = 64
OSM_SNAPSHOTS = ("south-korea-260924.osm.pbf", "north-korea-260924.osm.pbf")
OSM_HASHES = ("cd4f04b9145cb8e1cacaf2ce9b10cdb5425f7ae3ae49dac73ef2084f42d94329", "9bb18639a4f35c5ff41404a1a2faa5fd205be960fb5143ed19342a9c1dc16db0")
LAND_NAME = "ne_10m_land.geojson"
LAND_HASH = "1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416"
LAND_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_land.geojson"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def xyz(lon, lat, zoom):
    n = 2 ** zoom
    return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n


def fetch(cache, name, url):
    path = cache / name
    if not path.exists():
        import requests
        response = requests.get(url, timeout=120, headers={"User-Agent": "SeoulKenshiWikiTerrainBake/1.0 (open geodata attribution)"})
        response.raise_for_status()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(response.content)
    return path


def tile_range(bounds, zoom):
    a, b = xyz(bounds[0], bounds[3], zoom)
    c, d = xyz(bounds[2], bounds[1], zoom)
    return range(math.floor(a), math.floor(c) + 1), range(math.floor(b), math.floor(d) + 1)


def tile_mosaic(cache, bounds, zoom, download):
    xs, ys = tile_range(bounds, zoom)
    tiles = []
    mosaic = np.zeros((len(ys) * 256, len(xs) * 256), np.float32)
    for ix, x in enumerate(xs):
        for iy, y in enumerate(ys):
            name = f"terrain/z{zoom}/{x}/{y}.png"
            path = cache / name
            if download:
                fetch(cache, name, f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{zoom}/{x}/{y}.png")
            if not path.exists():
                raise FileNotFoundError(f"Missing cached {name}; run with --fetch")
            rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
            elev = rgb[:, :, 0] * 256 + rgb[:, :, 1] + rgb[:, :, 2] / 256 - 32768
            # Same urban spike treatment as bake_seoul_terrain.py: median then Gaussian.
            elev = np.where(np.abs(elev - median_filter(elev, size=7)) > 120, median_filter(elev, size=7), elev)
            mosaic[iy * 256:(iy + 1) * 256, ix * 256:(ix + 1) * 256] = elev
            tiles.append({"path": name, "sha256": sha(path)})
    return mosaic, xs.start, ys.start, tiles


def project(x, y):
    east, north = crs_transform("EPSG:4326", "EPSG:5179", list(x), list(y))
    return east, north


def unproject(x, y):
    lon, lat = crs_transform("EPSG:5179", "EPSG:4326", list(x), list(y))
    return np.asarray(lon), np.asarray(lat)


def projected_box(bounds):
    corners = [(bounds[0], bounds[1]), (bounds[0], bounds[3]), (bounds[2], bounds[1]), (bounds[2], bounds[3])]
    x, y = project([c[0] for c in corners], [c[1] for c in corners])
    return [min(x), min(y), max(x), max(y)]


def sample_height(cache, bounds, zoom, size, download):
    mosaic, tile_x, tile_y, sources = tile_mosaic(cache, bounds, zoom, download)
    east0, north0, east1, north1 = projected_box(bounds)
    width, height = size
    east = np.linspace(east0, east1, width)
    north = np.linspace(north1, north0, height)
    ee, nn = np.meshgrid(east, north)
    lon, lat = unproject(ee.ravel(), nn.ravel())
    tx = (lon + 180) / 360 * (2 ** zoom)
    ty = (1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * (2 ** zoom)
    px = np.clip((tx - tile_x) * 256, 0, mosaic.shape[1] - 1).astype(np.int32)
    py = np.clip((ty - tile_y) * 256, 0, mosaic.shape[0] - 1).astype(np.int32)
    elev = mosaic[py, px].reshape((height, width))
    elev = gaussian_filter(elev, sigma=0.65 if zoom == 9 else 0.35)
    elev = np.clip(elev, -500, 3000)
    return elev, [east0, north0, east1, north1], sources, ee, nn


def projected_geometry(geom):
    def warp(x, y, z=None):
        xx, yy = project(np.atleast_1d(x), np.atleast_1d(y))
        return (xx[0], yy[0]) if np.isscalar(x) else (xx, yy)
    return shape_transform(warp, geom)


def sourced_land(cache, bounds):
    """Clip Natural Earth land before projection to stay within EPSG:5179's domain."""
    doc = json.loads((cache / LAND_NAME).read_text())
    extent = box(*bounds)
    return unary_union([projected_geometry(shape(f["geometry"]).intersection(extent)) for f in doc["features"] if shape(f["geometry"]).intersects(extent)])


def boundaries(cache):
    doc = json.loads((cache / "boundaries.geojson").read_text())
    buckets = {city: [] for city in CITY_PARTS}
    for feature in doc["features"]:
        p = feature["properties"]
        province = p.get("sidonm", "")
        city = p.get("sggnm", "")
        for key, names in CITY_PARTS.items():
            selected = (key == "인천" and province == "인천광역시" and city not in ("영종구", "옹진군", "강화군")) or (key == "영종" and province == "인천광역시" and city == "영종구") or (key not in ("인천", "영종") and any(city.startswith(name) for name in names))
            if selected:
                geom = projected_geometry(shape(feature["geometry"]))
                if key == "영종":
                    # Keep the airport island and its adjacent islands, not mainland Jung-gu.
                    geom = geom.intersection(projected_geometry(shape({"type": "Polygon", "coordinates": [[[125.9, 37.2], [126.62, 37.2], [126.62, 37.7], [125.9, 37.7], [125.9, 37.2]]]})))
                if not geom.is_empty:
                    buckets[key].append(geom)
    result = []
    for key, geoms in buckets.items():
        if not geoms:
            raise ValueError(f"Missing boundary: {key}")
        merged = unary_union(geoms).simplify(350, preserve_topology=True)
        centroid = merged.centroid
        result.append({"city": key, "centroid": [round(centroid.x, 1), round(centroid.y, 1)], "geometry": mapping(merged)})
    return result


def network(cache):
    import xml.etree.ElementTree as ET
    lines = json.loads((cache / "lines.geojson").read_text())
    stations = json.loads((cache / "stations.geojson").read_text())
    paths = []
    for f in lines["features"]:
        line = LINE_IDS.get(f["properties"]["lineId"])
        if not line:
            continue
        geom = projected_geometry(shape(f["geometry"])).simplify(80, preserve_topology=False)
        for part in (geom.geoms if hasattr(geom, "geoms") else [geom]):
            if hasattr(part, "coords") and len(part.coords) > 1:
                paths.append({"lineId": line, "points": [[round(x), round(y)] for x, y in part.coords]})
    for line, relation_id in OSM_ROUTES.items():
        osm = json.loads((cache / f"osm-{relation_id}.json").read_text())
        for relation in osm["elements"]:
            for member in relation["members"]:
                coords = member.get("geometry")
                if member["type"] != "way" or not coords or len(coords) < 2:
                    continue
                x, y = project([point["lon"] for point in coords], [point["lat"] for point in coords])
                paths.append({"lineId": line, "points": [[round(east), round(north)] for east, north in zip(x, y)]})
    full_stops = []
    for line, relation_ids in OSM_FULL.items():
        for relation_id in relation_ids:
            root = ET.parse(cache / f"osm-{relation_id}-full.xml").getroot()
            nodes = {node.attrib["id"]: node for node in root.findall("node")}
            ways = {way.attrib["id"]: way for way in root.findall("way")}
            relation = next(item for item in root.findall("relation") if item.attrib["id"] == str(relation_id))
            for member in relation.findall("member"):
                if member.attrib["type"] == "node" and member.attrib.get("role") == "stop" and member.attrib["ref"] in nodes:
                    full_stops.append((line, nodes[member.attrib["ref"]]))
                if member.attrib["type"] != "way" or member.attrib["ref"] not in ways:
                    continue
                refs = [node.attrib["ref"] for node in ways[member.attrib["ref"]].findall("nd")]
                coords = [nodes[ref] for ref in refs if ref in nodes]
                if len(coords) < 2:
                    continue
                x, y = project([float(node.attrib["lon"]) for node in coords], [float(node.attrib["lat"]) for node in coords])
                paths.append({"lineId": line, "points": [[round(east), round(north)] for east, north in zip(x, y)]})
    station_list = []
    for f in stations["features"]:
        x, y = project([f["geometry"]["coordinates"][0]], [f["geometry"]["coordinates"][1]])
        ids = [LINE_IDS[l] for l in f["properties"]["lines"] if l in LINE_IDS]
        station_list.append({"name": f["properties"]["name_ko"], "east": round(x[0]), "north": round(y[0]), "lineIds": ids})
    for line, node in full_stops:
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in node.findall("tag")}
        name = tags.get("name:ko") or tags.get("name")
        if name:
            x, y = project([float(node.attrib["lon"])], [float(node.attrib["lat"])])
            station_list.append({"name": name, "east": round(x[0]), "north": round(y[0]), "lineIds": [line]})
    # Additional official station points cover the suburban branches omitted by the 13 OSM-derived lines.
    with (cache / "official-stations.csv").open() as handle:
        rows = list(csv.DictReader(handle))
    jipyeong = json.loads((cache / "osm-jipyeong.json").read_text())[0]
    for row in rows:
        if row["subway_station_name"] == "지평" and row["line"] == "K":
            row["x_xgs"], row["y_xgs"] = jipyeong["lat"], jipyeong["lon"]
    additional = {"G": "G", "K": "K", "SU": "B", "A": "A", "S": "S", "1": "2-1", "SH": "SH", "E": "E", "I": "I", "I2": "I2", "KK": "KK", "U": "U", "UI": "W"}
    seen = {(s["name"], tuple(s["lineIds"])) for s in station_list}
    for row in rows:
        lid = additional.get(row["line"])
        if not lid or not row["x_xgs"] or not row["y_xgs"]:
            continue
        x, y = project([float(row["y_xgs"])], [float(row["x_xgs"])])
        name = row["subway_station_name"]
        if (name, (lid,)) not in seen:
            station_list.append({"name": name, "east": round(x[0]), "north": round(y[0]), "lineIds": [lid]})
            seen.add((name, (lid,)))
    for line, relation_id in (("SH", 8725314), ("KP", 10092719), ("SL", 14191876)):
        for node in ET.parse(cache / f"osm-{relation_id}-stations.xml").findall("node"):
            tags = {tag.attrib["k"]: tag.attrib["v"] for tag in node.findall("tag")}
            name = tags.get("name:ko") or tags.get("name")
            if not name:
                continue
            x, y = project([float(node.attrib["lon"])], [float(node.attrib["lat"])])
            station_list.append({"name": name, "east": round(x[0]), "north": round(y[0]), "lineIds": [line]})
    # Stop order is encoded in the published external station codes.
    for source_line, lid in [("K", "K"), ("SU", "B")]:
        ordered = {}
        for row in rows:
            if row["line"] != source_line or not row["external_code"] or not row["x_xgs"] or not row["y_xgs"]:
                continue
            code = row["external_code"].upper()
            if not code[1:].isdigit():
                continue
            x, y = project([float(row["y_xgs"])], [float(row["x_xgs"])])
            ordered[code] = [round(x[0]), round(y[0])]
        groups = {}
        for code, point in ordered.items():
            groups.setdefault(code[:2] if source_line == "K" else code[:1], []).append((int(code[1:]), point))
        for entries in groups.values():
            entries.sort()
            for (_, a), (_, b) in zip(entries, entries[1:]):
                if math.dist(a, b) < 18000:
                    paths.append({"lineId": lid, "points": [a, b]})
    return {"paths": paths, "stations": station_list}


def bake_detail(cache, out, province, rail, download):
    """Bake the rail-region detail lattice and separately sourced hydrography."""
    for name, digest in zip(OSM_SNAPSHOTS, OSM_HASHES):
        if sha(cache / name) != digest:
            raise ValueError(f"Incorrect frozen OSM extract: {name}")
    if sha(cache / LAND_NAME) != LAND_HASH:
        raise ValueError("Incorrect frozen coastline source")
    west, south, east, north = DETAIL_BOX
    peninsula_extent = box(*projected_box(PENINSULA))
    cols = (east - west) // DETAIL_CELL
    rows = (north - south) // DETAIL_CELL
    bounds_x = [west, west, east, east]
    bounds_y = [south, north, south, north]
    lon, lat = unproject(bounds_x, bounds_y)
    geographic = (float(lon.min()) - .1, float(lat.min()) - .1, float(lon.max()) + .1, float(lat.max()) + .1)
    width, height = cols * DETAIL_INTERVALS + 1, rows * DETAIL_INTERVALS + 1
    mosaic, tile_x, tile_y, terrain_sources = tile_mosaic(cache, geographic, 11, download)
    east_axis = np.linspace(west, east, width)
    north_axis = np.linspace(north, south, height)
    ee, nn = np.meshgrid(east_axis, north_axis)
    lon, lat = unproject(ee.ravel(), nn.ravel())
    tx = (lon + 180) / 360 * 2048
    ty = (1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * 2048
    px = np.clip((tx - tile_x) * 256, 0, mosaic.shape[1] - 1).astype(np.int32)
    py = np.clip((ty - tile_y) * 256, 0, mosaic.shape[0] - 1).astype(np.int32)
    elevation = gaussian_filter(mosaic[py, px].reshape(height, width), sigma=.35)
    elevation = np.clip(elevation, -500, 3000)

    land = sourced_land(cache, geographic)
    mask = np.zeros((height, width), dtype=np.uint16)
    mask[~contains_xy(land, ee, nn)] = 0x8000
    samples = []
    for path in rail["paths"]:
        for a, b in zip(path["points"], path["points"][1:]):
            length = math.dist(a, b)
            samples.extend((a[0] * (1-t) + b[0] * t, a[1] * (1-t) + b[1] * t) for t in np.linspace(0, 1, max(2, int(length / 1500))))
    samples.extend((s["east"], s["north"]) for s in rail["stations"])
    distance, _ = cKDTree(samples).query(np.column_stack((ee.ravel(), nn.ravel())), workers=-1)
    mask[(distance.reshape(height, width) < 7500) & (mask == 0)] = 1
    for index, entry in enumerate(province):
        inside = contains_xy(shape(entry["geometry"]), ee, nn) & (mask < 0x8000)
        mask[inside] = index + 2

    features = []
    factory = osmium.geom.WKBFactory()

    class Water(osmium.SimpleHandler):
        def way(self, way):
            if way.tags.get("waterway") not in ("river", "stream"):
                return
            try:
                geom = projected_geometry(wkb.loads(factory.create_linestring(way), hex=True))
            except osmium.InvalidLocationError:
                return
            if geom.intersects(peninsula_extent):
                features.append((f"way/{way.id}", "line", {"waterway": way.tags["waterway"]}, geom))

        def area(self, area):
            tags = {tag.k: tag.v for tag in area.tags if tag.k in ("natural", "water", "waterway", "name", "name:ko")}
            if not ((tags.get("natural") == "water" and tags.get("water") == "river") or tags.get("waterway") == "riverbank"):
                return
            try:
                geom = projected_geometry(wkb.loads(factory.create_multipolygon(area), hex=True))
            except (osmium.InvalidLocationError, RuntimeError):
                return
            if geom.intersects(peninsula_extent):
                kind = "way" if area.from_way() else "relation"
                features.append((f"{kind}/{area.orig_id()}", "polygon", tags, geom))

    for name in OSM_SNAPSHOTS:
        Water().apply_file(str(cache / name), locations=True)
    # Geofabrik country extracts overlap at borders; keep each OSM feature once.
    features = list({(fid, kind): (fid, kind, tags, geom) for fid, kind, tags, geom in features}.values())
    shapes = [item[3] for item in features]
    tree = STRtree(shapes)
    detail_dir = out / "regional-terrain-tiles"
    detail_dir.mkdir(parents=True, exist_ok=True)
    tiles = []
    for row in range(rows):
        for col in range(cols):
            x0, x1 = west + col * DETAIL_CELL, west + (col + 1) * DETAIL_CELL
            y1, y0 = north - row * DETAIL_CELL, north - (row + 1) * DETAIL_CELL
            clip = box(x0, y0, x1, y1)
            key = f"{col}-{row}"
            payload = np.stack((np.round(elevation[row*64:row*64+65, col*64:col*64+65] + 500).astype('<u2'), mask[row*64:row*64+65, col*64:col*64+65].astype('<u2')), axis=-1)
            data_file = detail_dir / f"{key}.bin"
            data_file.write_bytes(payload.tobytes())
            water = []
            for ix in tree.query(clip):
                fid, kind, tags, geom = features[int(ix)]
                part = geom.intersection(clip)
                if part.is_empty:
                    continue
                for piece in (part.geoms if hasattr(part, "geoms") else [part]):
                    if kind == "polygon" and piece.geom_type == "Polygon":
                        rings = [piece.exterior, *piece.interiors]
                        coords = [[[round(x, 1), round(y, 1)] for x, y in ring.coords] for ring in rings]
                    elif kind == "line" and piece.geom_type == "LineString" and piece.length > 0:
                        coords = [[round(x, 1), round(y, 1)] for x, y in piece.coords]
                    else:
                        continue
                    water.append({"id": fid, "kind": kind, "tag": tags, "coordinates": coords})
            water.sort(key=lambda item: (item["id"], item["kind"], str(item["coordinates"][:1])))
            water_file = detail_dir / f"{key}-water.json"
            water_file.write_text(json.dumps({"features": water}, ensure_ascii=False, separators=(",", ":")))
            corner_lon, corner_lat = unproject([x0, x0, x1, x1], [y0, y1, y0, y1])
            source_x, source_y = tile_range((float(corner_lon.min()), float(corner_lat.min()), float(corner_lon.max()), float(corner_lat.max())), 11)
            source_paths = {f"terrain/z11/{sx}/{sy}.png" for sx in source_x for sy in source_y}
            tiles.append({"key": key, "col": col, "row": row, "file": f"regional-terrain-tiles/{key}.bin", "waterFile": f"regional-terrain-tiles/{key}-water.json", "bboxEPSG5179": [x0, y0, x1, y1], "width": 65, "height": 65, "sha256": sha(data_file), "waterSha256": sha(water_file), "sourceTiles": [source for source in terrain_sources if source["path"] in source_paths]})
    # A single simplified far-view water payload avoids requesting detail cells at peninsula distance.
    far = []
    for fid, kind, tags, geom in features:
        if kind == "line" and (tags.get("waterway") != "river" or geom.length < 5000):
            continue
        if kind == "polygon" and geom.area < 1000000:
            continue
        simplified = geom.intersection(peninsula_extent).simplify(150, preserve_topology=True)
        for piece in (simplified.geoms if hasattr(simplified, "geoms") else [simplified]):
            if kind == "polygon" and piece.geom_type == "Polygon":
                coords = [[[round(x), round(y)] for x, y in ring.coords] for ring in [piece.exterior, *piece.interiors]]
            elif kind == "line" and piece.geom_type == "LineString" and piece.length > 300:
                coords = [[round(x), round(y)] for x, y in piece.coords]
            else:
                continue
            far.append({"id": fid, "kind": kind, "tag": tags, "coordinates": coords})
    far.sort(key=lambda item: (item["id"], item["kind"], str(item["coordinates"][:1])))
    far_file = out / "regional-terrain-far-water.json"
    far_file.write_text(json.dumps({"features": far}, ensure_ascii=False, separators=(",", ":")))
    return {"detailGrid": {"projection": "EPSG:5179", "origin": [west, north], "cellSize": DETAIL_CELL, "intervals": DETAIL_INTERVALS, "cols": cols, "rows": rows}, "detailTiles": tiles, "farWaterFile": far_file.name, "farWaterSha256": sha(far_file), "detailSources": {"hydrography": [{"url": f"https://download.geofabrik.de/asia/{name}", "snapshot": "2026-09-24T20:21:20Z", "sha256": digest, "bytes": (cache / name).stat().st_size, "license": "ODbL 1.0 © OpenStreetMap contributors"} for name, digest in zip(OSM_SNAPSHOTS, OSM_HASHES)], "coastline": {"url": LAND_URL, "sha256": LAND_HASH, "bytes": (cache / LAND_NAME).stat().st_size, "license": "Natural Earth public domain, 1:10m land polygons"}, "elevation": {"url": "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png", "retrieved": "2026-09-25", "tiles": terrain_sources, "attribution": "Mapzen Terrain Tiles; USGS SRTM/GMTED2010 and NOAA ETOPO1 where applicable"}}, "waterFeatureCount": len(features)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "public")
    parser.add_argument("--fetch", action="store_true")
    parser.add_argument("--detail-cache", type=Path, required=True)
    args = parser.parse_args()
    cache = args.cache
    cache.mkdir(parents=True, exist_ok=True)
    for name, url in SOURCES.items():
        if args.fetch:
            fetch(cache, name, url)
        elif not (cache / name).exists():
            raise FileNotFoundError(cache / name)
    for relation_id in (10092719, 14191876):
        relation = json.loads((cache / f"osm-{relation_id}.json").read_text())["elements"][0]
        ids = [member["ref"] for member in relation["members"] if member["type"] == "node" and member.get("role") == "stop"]
        name = f"osm-{relation_id}-stations.xml"
        SOURCES[name] = "https://api.openstreetmap.org/api/0.6/nodes?nodes=" + ",".join(map(str, ids))
        if args.fetch:
            fetch(cache, name, SOURCES[name])
        elif not (cache / name).exists():
            raise FileNotFoundError(cache / name)
    province = boundaries(cache)
    rail = network(cache)
    layers = []
    coarse = None
    coarse_box = None
    for name, bounds, zoom, size in [("peninsula", PENINSULA, 6, (190, 280)), ("metro", METRO, 9, (320, 300))]:
        elevation, projected, tiles, ee, nn = sample_height(cache, bounds, zoom, size, args.fetch)
        if name == "metro" and coarse is not None and coarse_box is not None:
            from scipy.ndimage import map_coordinates
            ce0, cn0, ce1, cn1 = coarse_box
            col = np.clip((ee - ce0) / (ce1 - ce0) * (coarse.shape[1] - 1), 0, coarse.shape[1] - 1)
            row = np.clip((cn1 - nn) / (cn1 - cn0) * (coarse.shape[0] - 1), 0, coarse.shape[0] - 1)
            low = map_coordinates(coarse, [row, col], order=1, mode="nearest")
            rr, cc = np.indices(elevation.shape)
            edge = np.minimum.reduce([rr, size[1] - 1 - rr, cc, size[0] - 1 - cc])
            weight = np.clip(edge / 18, 0, 1)
            elevation = elevation * weight + low * (1 - weight)
        # A rail corridor is living; all other land is wasteland. Sea remains separate.
        if name == "metro":
            samples = []
            for path in rail["paths"]:
                points = path["points"]
                for a, b in zip(points, points[1:]):
                    length = math.dist(a, b)
                    for t in np.linspace(0, 1, max(2, int(length / 1500))):
                        samples.append((a[0] * (1-t) + b[0] * t, a[1] * (1-t) + b[1] * t))
            samples.extend((s["east"], s["north"]) for s in rail["stations"])
            distance, _ = cKDTree(samples).query(np.column_stack((ee.ravel(), nn.ravel())), workers=-1)
            living = (distance.reshape(elevation.shape) < 7500).astype(np.uint8)
            for index, entry in enumerate(province):
                geom = shape(entry["geometry"])
                living[contains_xy(geom, ee, nn) & (elevation > 0)] = index + 2
        else:
            living = np.zeros(elevation.shape, np.uint8)
            coarse, coarse_box = elevation, projected
        packed = np.stack((np.clip(np.round(elevation + 500), 0, 65535).astype("<u2"), living.astype("<u2")), axis=-1)
        filename = f"regional-{name}.bin"
        args.out.mkdir(parents=True, exist_ok=True)
        (args.out / filename).write_bytes(packed.tobytes())
        layers.append({"name": name, "file": filename, "zoom": zoom, "bboxLonLat": bounds, "bboxEPSG5179": [round(v, 1) for v in projected], "width": size[0], "height": size[1], "minElevation": round(float(elevation.min()), 1), "maxElevation": round(float(elevation.max()), 1), "sourceTiles": tiles, "sha256": sha(args.out / filename)})
    (args.out / "regional-boundaries.json").write_text(json.dumps(province, ensure_ascii=False, separators=(",", ":")))
    (args.out / "regional-rail.json").write_text(json.dumps(rail, ensure_ascii=False, separators=(",", ":")))
    meta = {"schema": "regional-terrain.v1", "projection": "EPSG:5179", "heightEncoding": "interleaved uint16 little endian: elevation meters + 500, living mask", "layers": layers, "sources": {name: {"url": url, "sha256": sha(cache / name)} for name, url in SOURCES.items()}, "attribution": "Terrain: Mapzen Terrain Tiles (SRTM/GMTED2010, USGS; ETOPO1, NOAA where used). Boundaries: vuski/admdongkor CC BY 4.0, source KOSTAT SGIS public attribution. Rail: © OpenStreetMap contributors ODbL 1.0; official station coordinates via Korean Government Open Data Portal."}
    meta.update(bake_detail(args.detail_cache, args.out, province, rail, args.fetch))
    # Preserve existing low mask values while adding an independent sourced sea bit.
    coarse = layers[0]
    coarse_data = np.frombuffer((args.out / coarse["file"]).read_bytes(), dtype="<u2").copy().reshape(coarse["height"], coarse["width"], 2)
    e0, n0, e1, n1 = coarse["bboxEPSG5179"]
    ce, cn = np.meshgrid(np.linspace(e0, e1, coarse["width"]), np.linspace(n1, n0, coarse["height"]))
    coarse_land = sourced_land(args.detail_cache, PENINSULA)
    coarse_data[:, :, 1][~contains_xy(coarse_land, ce, cn)] = 0x8000
    (args.out / coarse["file"]).write_bytes(coarse_data.tobytes())
    coarse["sha256"] = sha(args.out / coarse["file"])
    meta["heightEncoding"] = "row-major north-to-south interleaved little-endian uint16: elevation meters + 500, mask (low 15 bits: 0 ruin, 1 living, 2+ vassal; bit 0x8000: sourced sea on peninsula and detail tiles)"
    meta["detailHeightEncoding"] = meta["heightEncoding"]
    meta["attribution"] += " Rivers: © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright). Coastline: Natural Earth 1:10m public domain."
    (args.out / "regional-terrain.json").write_text(json.dumps(meta, ensure_ascii=False, separators=(",", ":")))
    print(json.dumps({"layers": [(v["name"], v["width"], v["height"], v["zoom"]) for v in layers], "boundaries": len(province), "stations": len(rail["stations"]), "paths": len(rail["paths"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
