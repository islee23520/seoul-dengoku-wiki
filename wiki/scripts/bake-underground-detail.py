"""Bake observed subway geometry from locally cached public data; never fetch at build time.

python3 wiki/scripts/bake-underground-detail.py --cache .omo/evidence/wiki-issues/underground-detail \
    --osm /path/to/Seoul.osm.pbf
Requires pyosmium and rasterio (already used by the terrain bake).
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

import osmium
from rasterio.warp import transform

ROOT = Path(__file__).resolve().parents[2]
LINE_IDS = {str(n): f"{n + 1}-{n}" for n in range(1, 9)}
LINE_IDS.update({'9': '10-9', '공항철도': 'A', '수인·분당': 'B', '경의·중앙': 'K', '신분당': 'S'})
NAME_EXCEPTIONS = {'디지털미디어시티': 'DMC', '서울역': '서울', '불암산': '당고개', '자양': '뚝섬유원지', '암사역사공원': '암사역사공원'}
DEPTH_URL = 'https://datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do?useCache=false&infId=OA-13305&seq=8&infSeq=1'
OPERATIONS_URL = 'https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000007658194&fileDetailSn=1&insertDataPrcus=N'
OSM_URL = 'https://download.bbbike.org/osm/bbbike/Seoul/Seoul.osm.pbf'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    return list(csv.DictReader(path.read_bytes().decode('cp949').splitlines()))


def name_key(name):
    name = name.strip()
    return NAME_EXCEPTIONS.get(name, name[:-1] if name.endswith('역') and name != '서울역' else name)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--osm', type=Path, required=True)
    args = parser.parse_args()
    depth_file, operation_file = args.cache / 'depth.csv', args.cache / 'operations.csv'
    catalog = json.loads((ROOT / 'wiki/public/opening-territories.json').read_text())
    official = json.loads((ROOT / 'wiki/scripts/official-seoul-lines.json').read_text())
    import re
    aliases = dict(re.findall(r"'([^']+)': '([^']+)'", (ROOT / 'wiki/src/components/stationPresentation.ts').read_text()))
    depths = {(name_key(row['역명']), LINE_IDS[row['호선']]): row for row in rows(depth_file) if row['호선'] in LINE_IDS}
    operations = {(name_key(row['역명']), LINE_IDS[row['호선'].replace('호선', '')]): row for row in rows(operation_file) if row['호선'].replace('호선', '') in LINE_IDS}
    stations = {}
    for station in catalog['stations']:
        key = name_key(aliases.get(station['id'], station['name']))
        entries = {}
        for line in station['lineIds']:
            depth, operation = depths.get((key, line)), operations.get((key, line))
            underground_depth = depth if depth and float(depth['정거장깊이']) > 0 and float(depth['선로기준정거장깊이']) > 0 else None
            entries[line] = {
                'railM': float(underground_depth['선로기준정거장깊이']) if underground_depth else None,
                'platformM': float(underground_depth['정거장깊이']) if underground_depth else None,
                'floors': operation['층수'] if operation else (depth['층수'] if depth else None),
                'platformType': operation['승강장유형'] if operation else (depth['형식'] if depth else None),
                'exits': int(operation['출입구']) if operation and operation['출입구'].isdigit() else None,
                'transfers': [s.strip() for s in operation['환승노선'].split(',') if s.strip()] if operation else None,
                'sources': {field: source for field, source in (('depth', 'depth' if underground_depth else None), ('floors', 'operations' if operation else 'depth' if depth else None), ('platformType', 'operations' if operation else 'depth' if depth else None), ('exits', 'operations' if operation else None), ('transfers', 'operations' if operation else None)) if source},
            }
        stations[station['id']] = entries

    projection = catalog['projection']
    def xy(east, north):
        return ((east - projection['minEast']) / (projection['maxEast'] - projection['minEast']) * catalog['width'],
                (projection['maxNorth'] - north) / (projection['maxNorth'] - projection['minNorth']) * catalog['height'])

    by_id = {station['id']: station for station in catalog['stations']}
    edges = {}
    for index, edge in enumerate(catalog['edges']):
        for line in edge['lineIds']:
            if line in catalog['lines']:
                edges.setdefault(line, []).append((index, by_id[edge['a']], by_id[edge['b']]))

    def nearest_edge(line, points):
        midpoint = points[len(points) // 2]
        best = (float('inf'), None)
        for index, a, b in edges.get(line, []):
            dx, dy = b['x'] - a['x'], b['y'] - a['y']
            t = max(0, min(1, ((midpoint[0] - a['x']) * dx + (midpoint[1] - a['y']) * dy) / (dx * dx + dy * dy))) if dx * dx + dy * dy else 0
            distance = (midpoint[0] - a['x'] - t * dx) ** 2 + (midpoint[1] - a['y'] - t * dy) ** 2
            if distance < best[0]:
                best = distance, (index, a, b)
        return best[1] if best[0] < 18 ** 2 else None  # ~550 m at this map's scale

    class Routes(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.ways = {}

        def relation(self, relation):
            if relation.tags.get('route') not in ('subway', 'train', 'light_rail'):
                return
            line = LINE_IDS.get(relation.tags.get('ref'))
            if not line:
                return
            for member in relation.members:
                if member.type == 'w' and member.role not in ('platform', 'stop'):
                    self.ways.setdefault(member.ref, set()).add(line)

    routes = Routes()
    routes.apply_file(str(args.osm))
    paths = []
    covered = set()

    class Ways(osmium.SimpleHandler):
        def way(self, way):
            if way.id not in routes.ways or way.tags.get('railway') != 'subway' or not (way.tags.get('tunnel') == 'yes' or (way.tags.get('layer') or '').startswith('-')):
                return
            coordinates = [(node.lon, node.lat) for node in way.nodes if node.location.valid()]
            if len(coordinates) < 2:
                return
            projected = transform('EPSG:4326', 'EPSG:5179', [p[0] for p in coordinates], [p[1] for p in coordinates])
            east, north = projected[0], projected[1]
            points = [xy(e, n) for e, n in zip(east, north)]
            for line in routes.ways[way.id]:
                for first, second in zip(points, points[1:]):
                    if not all(0 <= x <= catalog['width'] and 0 <= y <= catalog['height'] for x, y in (first, second)):
                        continue
                    match = nearest_edge(line, [first, second])
                    if not match:
                        continue
                    index, a, b = match
                    covered.add((index, line))
                    depths_pair = (stations[a['id']].get(line, {}).get('railM'), stations[b['id']].get(line, {}).get('railM'))
                    def point_depth(x, y):
                        dx, dy = b['x'] - a['x'], b['y'] - a['y']
                        t = max(0, min(1, ((x - a['x']) * dx + (y - a['y']) * dy) / (dx * dx + dy * dy))) if dx * dx + dy * dy else 0
                        return round(depths_pair[0] * (1 - t) + depths_pair[1] * t, 2) if None not in depths_pair else None
                    segment = [[round(x, 2), round(y, 2), point_depth(x, y)] for x, y in (first, second)]
                    if paths and paths[-1]['osmWay'] == way.id and paths[-1]['edge'] == index and paths[-1]['lineId'] == line and paths[-1]['points'][-1] == segment[0]:
                        paths[-1]['points'].append(segment[1])
                    else:
                        paths.append({'lineId': line, 'edge': index, 'osmWay': way.id, 'kind': 'observed', 'points': segment})

    Ways().apply_file(str(args.osm), locations=True)
    for line, line_edges in edges.items():
        for index, a, b in line_edges:
            if (index, line) in covered:
                continue
            da, db = stations[a['id']].get(line, {}).get('railM'), stations[b['id']].get(line, {}).get('railM')
            paths.append({'lineId': line, 'edge': index, 'osmWay': None, 'kind': 'schematic', 'points': [[a['x'], a['y'], da], [b['x'], b['y'], db]]})
    result = {
        'schema': 'underground-detail.v1',
        'verticalScale': '1 map unit = 5 metres (depth relative to local ground); null = neutral schematic level',
        'sources': {
            'depth': {'url': DEPTH_URL, 'license': '공공누리 1유형', 'asOf': '2024-11-04', 'sha256': sha(depth_file)},
            'operations': {'url': OPERATIONS_URL, 'license': '이용허락범위 제한 없음', 'asOf': '2026-08-31', 'sha256': sha(operation_file)},
            'geometry': {'url': OSM_URL, 'license': 'ODbL 1.0', 'asOf': '2026-08-30 bundle', 'sha256': sha(args.osm)},
        },
        'stations': stations, 'paths': paths,
    }
    output = ROOT / 'wiki/public/underground-detail.json'
    output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{output}: {len(stations)} stations, {sum(1 for s in stations.values() for x in s.values() if x["platformM"] is not None)} observed platforms, {len(paths)} paths')


if __name__ == '__main__':
    main()
