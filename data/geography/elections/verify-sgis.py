"""Read-only official SGIS derivation and map verification; no geometry repair."""
import argparse
import hashlib
import json
import pathlib
import struct
import subprocess
import zipfile

import shapely
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree

root = pathlib.Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser()
parser.add_argument('--projected', action='store_true')
parser.add_argument('--map', type=pathlib.Path)
parser.add_argument('--proj4', type=pathlib.Path)
args = parser.parse_args()
archive = root / '.omo/private/seoul-migration/task-2-source-audit/sgis-20250630-national.zip'
membership_path = root / 'data/geography/elections/sources/seoul-constituency-membership.json'
membership = json.loads(membership_path.read_text())
tolerance = 0.01


def dbf(data):
    count, header, width = struct.unpack_from('<IHH', data, 4)
    fields = []
    for offset in range(32, header - 1, 32):
        name = data[offset:offset + 11].split(b'\0')[0].decode('ascii')
        fields.append((name, data[offset + 16]))
    rows = []
    for index in range(count):
        start = header + index * width
        assert data[start] == 32
        cursor = start + 1
        row = {}
        for name, length in fields:
            row[name] = data[cursor:cursor + length].decode('utf-8').strip()
            cursor += length
        rows.append(row)
    return rows


def polygon(data):
    assert struct.unpack_from('<I', data, 0)[0] == 5
    parts, points = struct.unpack_from('<II', data, 36)
    starts = list(struct.unpack_from('<' + 'I' * parts, data, 44)) + [points]
    coordinates = list(struct.iter_unpack('<dd', data[44 + 4 * parts:]))
    assert len(coordinates) == points
    rings = [Polygon(coordinates[starts[i]:starts[i + 1]]) for i in range(parts)]
    depths = [sum(q.area > p.area and q.contains(p.representative_point())
                  for j, q in enumerate(rings) if i != j) for i, p in enumerate(rings)]
    shells = []
    for i, p in enumerate(rings):
        if depths[i] % 2 == 0:
            holes = [q.exterior.coords for j, q in enumerate(rings)
                     if depths[j] == depths[i] + 1 and p.contains(q.representative_point())]
            shells.append(Polygon(p.exterior.coords, holes))
    result = MultiPolygon(shells)
    assert result.is_valid and not result.is_empty
    return result


def overlap(geometries):
    tree = STRtree(geometries)
    maximum = 0.0
    for i, geometry in enumerate(geometries):
        for j in tree.query(geometry, predicate='intersects'):
            if j > i:
                maximum = max(maximum, geometry.intersection(geometries[j]).area)
    assert maximum <= tolerance, maximum
    return maximum


def equal(a, b):
    delta = a.symmetric_difference(b).area
    assert delta <= tolerance, delta
    return delta


layers = {}
members = []
with zipfile.ZipFile(archive) as zipped:
    for layer, prefix, code in [('dong', 'bnd_dong_', 'ADM_CD'),
                               ('gu', 'bnd_sigungu_', 'SIGUNGU_CD'),
                               ('city', 'bnd_sido_', 'SIDO_CD')]:
        files = {pathlib.PurePosixPath(name).suffix: name for name in zipped.namelist()
                 if pathlib.PurePosixPath(name).name.startswith(prefix)}
        raw = {extension: zipped.read(name) for extension, name in files.items()}
        for extension, data in raw.items():
            members.append({'name': pathlib.PurePosixPath(files[extension]).name,
                            'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        assert raw['.cpg'].decode() == 'UTF-8'
        rows = dbf(raw['.dbf'])
        geometries = {}
        offset = 100
        for index, row in enumerate(rows):
            number, words = struct.unpack_from('>II', raw['.shp'], offset)
            assert number == index + 1
            if row[code].startswith('11'):
                assert row['BASE_DATE'] == '20250630'
                geometries[row[code]] = (row, polygon(raw['.shp'][offset + 8:offset + 8 + 2 * words]))
            offset += 8 + 2 * words
        assert offset == len(raw['.shp'])
        layers[layer] = geometries
    wkt = raw['.prj'].decode()

normalize = lambda name: name.replace('제', '') if not name.startswith('홍제') else name.replace('홍제제', '홍제')
def namekey(name):
    return normalize(name).replace(' ', '').replace('ㆍ', '·').replace('․', '·').replace('・', '·')

gu_codes = {row['SIGUNGU_NM']: code for code, (row, _) in layers['gu'].items()}
gu_names = {row['guId']: row['name'] for row in membership['gu']}
dong_lookup = {(code[:5], namekey(row['ADM_NM'])): code for code, (row, _) in layers['dong'].items()}
assert len(dong_lookup) == len(layers['dong'])
features = []
county_geometries = []
references = []
for county in membership['constituencies']:
    dong_codes = []
    for dong in county['electoralDongs']:
        code = dong_lookup[(gu_codes[gu_names[dong['guId']]], namekey(dong['sourceName']))]
        assert dong['fragmentId'] is None
        references.append(code)
        dong_codes.append(code)
        row, geometry = layers['dong'][code]
        stable_id = ('region:' + dong['currentCorrespondences'][0]['candidateAdminId']
                     if len(dong['currentCorrespondences']) == 1 else dong['electoralDongId'])
        features.append({'type': 'Feature', 'id': 'sgis:20250630:dong:' + code,
                         'properties': {'kind': 'dong', 'sourceEdition': 'sgis-20250630',
                                        'officialCode': code, 'officialName': row['ADM_NM'],
                                        'dongId': stable_id, 'electoralDongId': dong['electoralDongId'],
                                        'countyTitleId': 'geography:county:' + county['constituencyId'],
                                        'guId': dong['guId']}, 'geometry': mapping(geometry)})
    geometry = unary_union([layers['dong'][code][1] for code in dong_codes])
    assert geometry.is_valid
    county_geometries.append(geometry)
    features.append({'type': 'Feature', 'id': 'geography:county:' + county['constituencyId'],
                     'properties': {'kind': 'county', 'sourceEdition': 'sgis-20250630',
                                    'name': county['name'], 'officialDongCodes': dong_codes,
                                    'jurisdictionGuRefs': county['jurisdictionGuRefs']}, 'geometry': mapping(geometry)})
assert len(references) == len(set(references)) == len(layers['dong']) == 426
assert set(references) == set(layers['dong'])
city = layers['city']['11'][1]
gu_metrics = []
for gu in membership['gu']:
    code = gu_codes[gu['name']]
    row, geometry = layers['gu'][code]
    dong_union = unary_union([g for k, (_, g) in layers['dong'].items() if k.startswith(code)])
    gu_metrics.append({'guId': gu['guId'], 'officialCode': code, 'dongUnionDifferenceM2': equal(dong_union, geometry), 'areaM2': geometry.area})
    features.append({'type': 'Feature', 'id': 'geography:duchy:' + gu['guId'],
                     'properties': {'kind': 'gu', 'sourceEdition': 'sgis-20250630',
                                    'guId': gu['guId'], 'officialCode': code, 'name': gu['name']}, 'geometry': mapping(geometry)})
features.append({'type': 'Feature', 'id': 'geography:empire:seoul',
                 'properties': {'kind': 'city', 'sourceEdition': 'sgis-20250630', 'officialCode': '11', 'name': '서울특별시'},
                 'geometry': mapping(city)})
metrics = {'schema': 'seoul-sgis-geometry-proof.v1', 'toleranceM2': tolerance,
           'counts': {'dong': len(layers['dong']), 'gu': len(layers['gu']), 'city': len(layers['city']), 'county': len(county_geometries)},
           'cityAreaM2': city.area,
           'dongCityDifferenceM2': equal(unary_union([g for _, g in layers['dong'].values()]), city),
           'guCityDifferenceM2': equal(unary_union([g for _, g in layers['gu'].values()]), city),
           'countyCityDifferenceM2': equal(unary_union(county_geometries), city),
           'maxDongOverlapM2': overlap([g for _, g in layers['dong'].values()]),
           'maxGuOverlapM2': overlap([g for _, g in layers['gu'].values()]),
           'maxCountyOverlapM2': overlap(county_geometries), 'gu': gu_metrics,
           'pythonShapely': shapely.__version__, 'geos': shapely.geos_version_string,
           'archiveSha256': hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest(),
           'membershipSha256': hashlib.sha256(membership_path.read_bytes()).hexdigest(),
           'members': members, 'sourceWkt': wkt}
assert metrics['archiveSha256'] == 'f1cf0f9de453ac7eaacb273f39cee52851183372b9ddfda428a967c3a670b2c6'
if args.map:
    assert args.proj4
    transform = """
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const { default: proj4 } = await import(pathToFileURL(process.argv[1]));
const conversion = proj4('+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs', 'EPSG:4326');
const data = JSON.parse(readFileSync(0, 'utf8'));
const coordinates = value => typeof value[0] === 'number' ? conversion.inverse(value) : value.map(coordinates);
for (const feature of data.features) feature.geometry.coordinates = coordinates(feature.geometry.coordinates);
process.stdout.write(JSON.stringify(data));
"""
    process = subprocess.run(['node', '--input-type=module', '-e', transform, str(args.proj4.resolve())],
                             input=args.map.read_text(), capture_output=True, text=True, check=True)
    projected = json.loads(process.stdout)
    expected = {f['id']: f for f in features}
    assert len(projected['features']) == len(expected)
    round_trip_differences = []
    for feature in projected['features']:
        source = expected.pop(feature['id'])
        assert feature['properties'] == source['properties']
        round_trip_differences.append(equal(shape(feature['geometry']), shape(source['geometry'])))
    assert not expected
    metrics['mapRoundTripVerified'] = True
    metrics['maximumMapRoundTripDifferenceM2'] = max(round_trip_differences)
    metrics['mapSha256'] = hashlib.sha256(args.map.read_bytes()).hexdigest()
print(json.dumps({'type': 'FeatureCollection', 'features': features, 'metrics': metrics}
                 if args.projected else metrics, ensure_ascii=False, separators=(',', ':')))
