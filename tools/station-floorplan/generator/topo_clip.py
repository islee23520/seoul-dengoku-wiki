"""Clip 1:1000 topographic layers (S-Map OpenLab, EPSG:5186) to a 350 m box around every map station.
Writes geo_cache/topo/<name_ko>.json {layer: [{"g": geojson(5179), "p": props}]}. One streaming pass per layer."""
import json, os, sys, glob, math
import shapefile
from shapely.geometry import shape, mapping, box
from shapely.ops import transform as sh_transform
from pyproj import Transformer
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
T45 = Transformer.from_crs(4326, 5186, always_xy=True); T5179 = Transformer.from_crs(5186, 5179, always_xy=True)
ST = json.load(open(r'E:/git/seoul-dengoku-wiki/.omo/handoff/v4/settlement/data/stations.json', encoding='utf-8'))['stations']
HALF = 350
LAYERS = {'building': 'N1A_B0010000', 'wall': 'N1L_B0020000', 'cutfill': 'N1L_F0030000', 'levee': 'N1L_C0050000',
          'road': 'N1A_A0010000', 'rail': 'N1A_A0160024', 'bridge': 'N1A_A0070000', 'interchange': 'N1A_A0090000',
          'guardrail': 'N1L_C0530000', 'river': 'N1A_E0032111', 'contour': 'N1L_F0010000', 'stairs': 'N1A_C0390000',
          'overpass': 'N1A_A0063321', 'sidewalk': 'N1L_A0033320'}
cells = {}; boxes = {}
for s in ST:
    x, y = T45.transform(s['lon'], s['lat']); b = (x - HALF - 60, y - HALF - 60, x + HALF + 60, y + HALF + 60); boxes[s['name_ko']] = b
    for i in range(int(b[0] // 500), int(b[2] // 500) + 1):
        for j in range(int(b[1] // 500), int(b[3] // 500) + 1): cells.setdefault((i, j), []).append(s['name_ko'])
out = {n: {} for n in boxes}
for key, code in LAYERS.items():
    fs = glob.glob(os.path.join(ROOT, 'opendata/openlab/shp', code, '*.shp'))
    if not fs: print('missing', key); continue
    r = shapefile.Reader(fs[0], encoding='cp949'); names = [f[0] for f in r.fields[1:]]; n_hit = 0
    for sr in r.iterShapeRecords():
        bb = sr.shape.bbox if hasattr(sr.shape, 'bbox') else None
        if not bb: continue
        hits = set()
        for i in range(int(bb[0] // 500), int(bb[2] // 500) + 1):
            for j in range(int(bb[1] // 500), int(bb[3] // 500) + 1):
                for n in cells.get((i, j), ()):
                    b = boxes[n]
                    if bb[0] <= b[2] and bb[2] >= b[0] and bb[1] <= b[3] and bb[3] >= b[1]: hits.add(n)
        if not hits: continue
        try: g = sh_transform(lambda x, y, z=None: T5179.transform(x, y), shape(sr.shape.__geo_interface__))
        except Exception: continue
        p = {k: v for k, v in zip(names, sr.record) if k in ('명칭', '구분', '종류', '용도', '층수', '재질', '높이', '등고수치', '상하구분', '폭', '주기')}
        gj = mapping(g)
        for n in hits: out[n].setdefault(key, []).append({'g': gj, 'p': p}); n_hit += 1
    print(key, n_hit, flush=True)
od = os.path.join(ROOT, 'geo_cache/topo'); os.makedirs(od, exist_ok=True)
for n, d in out.items(): json.dump(d, open(os.path.join(od, f'{n}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('done', len(out))
