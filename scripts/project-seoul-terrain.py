#!/usr/bin/env python3
"""Explicitly prepare the sealed Seoul-only terrain web assets from pinned Git inputs."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from shapely import contains_xy
from shapely.geometry import LineString, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
ATLAS_HASH = '89d559fc31ce0644e331c6a54b8cfc997bf482b05f7c940694ea68f4f304fdf1'
RAW_HASH = 'b630f3161f0f86cd014293934c87f2bc35b33fa4c522301718ebc56fc7d7330f'
FILES = ('seoul-terrain.png', 'seoul-terrain-water.json', 'seoul-terrain-clip.json')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def checked(path, sha):
    data = path.read_bytes()
    if data.startswith(b'version https://git-lfs.github.com/spec/v1') or digest(data) != sha:
        raise ValueError(f'E_SEOUL_INPUT_HASH:{path}')
    return data


def geometry(atlas_bytes, opening):
    prefix = b'window.SEOUL_REGION_ATLAS='
    if not atlas_bytes.startswith(prefix):
        raise ValueError('E_SEOUL_ATLAS_WRAPPER')
    atlas = json.loads(atlas_bytes[len(prefix):].rstrip(b';\n '))
    rows = atlas['regions']
    ids = [item['id'] for item in rows]
    public_ids = [item['id'] for item in opening['regions']]
    if len(ids) != 427 or len(set(ids)) != 427 or set(ids) != set(public_ids) or len(set(public_ids)) != 427:
        raise ValueError('E_SEOUL_REGION_IDS')
    shapes = [shape(item['map_geometry']) for item in rows]
    if any(g.is_empty or not g.is_valid or g.geom_type not in ('Polygon', 'MultiPolygon') for g in shapes):
        raise ValueError('E_SEOUL_POLYGON')
    union = unary_union(shapes)
    p = opening['projection']
    if p['crs'] != 'EPSG:5179' or any(abs(a - b) > .001 for a, b in zip(union.bounds, (p['minEast'], p['minNorth'], p['maxEast'], p['maxNorth']))):
        raise ValueError('E_SEOUL_PROJECTION')
    return union


def raster(raw, layer, union):
    width, height = layer['width'], layer['height']
    samples = np.frombuffer(raw, dtype='<u2')
    if samples.size != width * height * 2 or width < 2 or height < 2:
        raise ValueError('E_SEOUL_RASTER_SIZE')
    samples = samples.reshape(height, width, 2)
    west, south, east, north = layer['bboxEPSG5179']
    ee, nn = np.meshgrid(np.linspace(west, east, width), np.linspace(north, south, height))
    inside = contains_xy(union, ee, nn)
    if not inside.any():
        raise ValueError('E_SEOUL_EMPTY_RASTER')
    elevation = samples[:, :, 0].astype(np.int32) - 500
    tint = np.clip(elevation / 1700, 0, 1)
    color = np.stack((117 + tint * 78, 137 + tint * 66, 111 + tint * 55), axis=-1).astype(np.uint8)
    color[(samples[:, :, 1] & 0x8000) != 0] = [29, 63, 78]
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    rgba[:, :, :3][inside] = color[inside]
    rgba[:, :, 3][inside] = 255
    rows, cols = np.where(inside)
    left, right, top, bottom = cols.min(), cols.max() + 1, rows.min(), rows.max() + 1
    dx, dy = (east - west) / (width - 1), (north - south) / (height - 1)
    bounds = [west + (left - .5) * dx, north - (bottom - .5) * dy,
              west + (right - .5) * dx, north - (top - .5) * dy]
    return Image.fromarray(rgba[top:bottom, left:right], 'RGBA'), bounds


def river_lines(features, union):
    result = []
    for feature in features:
        if feature['kind'] != 'line' or feature['tag'].get('waterway') != 'river':
            continue
        intersection = LineString(feature['coordinates']).intersection(union)
        def parts(value):
            if value.geom_type == 'LineString':
                if value.length > 0:
                    yield value
            elif hasattr(value, 'geoms'):
                for member in value.geoms:
                    yield from parts(member)
        for index, line in enumerate(parts(intersection)):
            if line.difference(union).length > 1e-6:
                raise ValueError('E_SEOUL_RIVER_OUTSIDE')
            result.append({'id': feature['id'], 'memberIndex': index, 'kind': 'line',
                           'tag': {'waterway': 'river'}, 'coordinates': [[x, y] for x, y in line.coords]})
    return sorted(result, key=lambda row: (str(row['id']), row['memberIndex'], row['coordinates']))


def exact_clip(union, opening):
    p = opening['projection']
    def ring(coords):
        points = [((east - p['minEast']) / (p['maxEast'] - p['minEast']) * opening['width'],
                   (p['maxNorth'] - north) / (p['maxNorth'] - p['minNorth']) * opening['height']) for east, north in coords.coords]
        return 'M' + 'L'.join(f'{x:.17g},{y:.17g}' for x, y in points) + 'Z'
    polygons = [union] if union.geom_type == 'Polygon' else union.geoms
    paths = [ring(boundary) for polygon in polygons for boundary in (polygon.exterior, *polygon.interiors)]
    return {'schema': 'seoul-terrain-clip.v1', 'projection': 'EPSG:5179', 'path': ''.join(paths)}


def project(root=ROOT):
    public = root / 'public'
    source_manifest = json.loads((root / 'snapshots/build-inputs/source-manifest.json').read_bytes())
    atlas_pin = next(item['sha256'] for item in source_manifest['files'] if item['path'] == 'atlas-data.js')
    if atlas_pin != ATLAS_HASH:
        raise ValueError('E_SEOUL_ATLAS_PIN')
    opening = json.loads((public / 'opening-territories.json').read_bytes())
    union = geometry(checked(root / 'snapshots/build-inputs/atlas-data.js', ATLAS_HASH), opening)
    manifest = json.loads(checked(public / 'regional-terrain.json', RAW_HASH))
    if manifest['projection'] != 'EPSG:5179' or manifest['schema'] != 'regional-terrain.v1':
        raise ValueError('E_SEOUL_RAW_CRS')
    layer = next(item for item in manifest['layers'] if item['name'] == 'metro')
    if layer['file'] != 'regional-metro.bin' or manifest['farWaterFile'] != 'regional-terrain-far-water.json' or len(manifest['detailTiles']) != 90:
        raise ValueError('E_SEOUL_RAW_INVENTORY')
    for item in manifest['layers']:
        checked(public / item['file'], item['sha256'])
    for item in manifest['detailTiles']:
        for file, sha in ((item['file'], item['sha256']), (item['waterFile'], item['waterSha256'])):
            if not file.startswith('regional-terrain-tiles/') or '..' in Path(file).parts:
                raise ValueError('E_SEOUL_TILE_PATH')
            checked(public / file, sha)
    source_water = json.loads(checked(public / manifest['farWaterFile'], manifest['farWaterSha256']))
    image, bounds = raster(checked(public / layer['file'], layer['sha256']), layer, union)
    image.save(public / FILES[0], format='PNG')
    (public / FILES[1]).write_text(json.dumps({'features': river_lines(source_water['features'], union)}, ensure_ascii=False, separators=(',', ':')) + '\n')
    (public / FILES[2]).write_text(json.dumps(exact_clip(union, opening), separators=(',', ':')) + '\n')
    result = {'schema': 'seoul-terrain.v2', 'projection': 'EPSG:5179', 'regionCount': 427,
              'bboxEPSG5179': bounds, 'width': image.width, 'height': image.height,
              'rasterFile': FILES[0], 'rasterSha256': digest((public / FILES[0]).read_bytes()),
              'waterFile': FILES[1], 'waterSha256': digest((public / FILES[1]).read_bytes()),
              'clipFile': FILES[2], 'clipSha256': digest((public / FILES[2]).read_bytes()),
              'inputs': {'atlasSha256': ATLAS_HASH, 'rawManifestSha256': RAW_HASH,
                         'openingSha256': digest((public / 'opening-territories.json').read_bytes())},
              'attribution': 'Terrain: Mapzen Terrain Tiles (USGS/NOAA). Rivers: © OpenStreetMap contributors, ODbL 1.0. Seoul boundary: vuski/admdongkor CC BY 4.0 (SGIS-derived).'}
    (public / 'seoul-terrain.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    return result


if __name__ == '__main__':
    print(json.dumps(project(), ensure_ascii=False))
