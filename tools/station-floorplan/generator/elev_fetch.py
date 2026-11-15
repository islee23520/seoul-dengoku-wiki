"""Per station real elevation points (sequential requests; S-Map blocks parallel clients):
  1) seoul:footprint_w_minmax (3D building footprints with ground min / roof max elevation, EPSG:5186) in a 700 m box
  2) seoul:seoul_1m DEM via WMS GetFeatureInfo on a 5x5 grid (150 m step) to cover parks and hills without buildings.
Writes geo_cache/elev/<name>.json {"bld": [[x5179, y5179, ground, roof, area]], "dem": [[x5179, y5179, z]]}."""
import json, os, sys, time, urllib.request, urllib.parse
from pyproj import Transformer
from shapely.geometry import shape
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
from smap_wfs import wfs
T45 = Transformer.from_crs(4326, 5186, always_xy=True); T5179 = Transformer.from_crs(5186, 5179, always_xy=True)
ST = json.load(open(r'E:/git/seoul-dengoku-wiki/.omo/handoff/v4/settlement/data/stations.json', encoding='utf-8'))['stations']
od = os.path.join(ROOT, 'geo_cache/elev'); os.makedirs(od, exist_ok=True)
def dem(x, y):
    p = ('/geoserver/wms?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=seoul:seoul_1m&query_layers=seoul:seoul_1m'
         f'&srs=EPSG:5186&bbox={x - 0.5},{y - 0.5},{x + 0.5},{y + 0.5}&width=1&height=1&x=0&y=0&info_format=application/json')
    url = 'https://smap.seoul.go.kr/imageProxy.do?svc=2D&param=' + urllib.parse.quote(p, safe='/?=&:,')
    for a in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'Referer': 'https://smap.seoul.go.kr/', 'User-Agent': 'Mozilla/5.0'}), timeout=30).read()
            return json.loads(r)['features'][0]['properties']['GRAY_INDEX']
        except Exception:
            time.sleep(2 + 3 * a)
    return None
for s in ST:
    out = os.path.join(od, f"{s['name_ko']}.json")
    if os.path.exists(out): continue
    x, y = T45.transform(s['lon'], s['lat'])
    res = {'bld': [], 'dem': []}
    try:
        j = wfs('seoul:footprint_w_minmax', [x - 350, y - 350, x + 350, y + 350])
        for f in j['features']:
            p = f['properties']; g = shape(f['geometry']); c = g.representative_point()
            X, Y = T5179.transform(c.x, c.y)
            res['bld'].append([round(X, 1), round(Y, 1), p.get('min'), p.get('max'), round(g.area, 1)])
    except Exception as e:
        print('bld fail', s['name_ko'], e, flush=True)
    for i in range(-2, 3):
        for k in range(-2, 3):
            z = dem(x + i * 150, y + k * 150); time.sleep(0.2)
            X, Y = T5179.transform(x + i * 150, y + k * 150); res['dem'].append([round(X, 1), round(Y, 1), z])
    json.dump(res, open(out, 'w', encoding='utf-8'))
    print(s['name_ko'], len(res['bld']), sum(1 for d in res['dem'] if d[2] is not None), flush=True)
