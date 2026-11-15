"""S-Map model frame -> EPSG:5186 -> EPSG:5179 / WGS84.
Model frame = Blender frame of the glb (x east-ish, y north-ish, z up), rotated CCW by theta about z, translated to position."""
import json, math, os
from pyproj import Transformer
ROOT = os.path.join(os.path.dirname(__file__), '..')
SUB = {m['name']: m for m in json.load(open(os.path.join(ROOT, 'smap/subway.json'), encoding='utf-8'))['subwayDataList']}
TAB = json.load(open(os.path.join(ROOT, 'smap/exits.json'), encoding='utf-8'))
T5186_4326 = Transformer.from_crs(5186, 4326, always_xy=True)
T4326_5186 = Transformer.from_crs(4326, 5186, always_xy=True)
T5186_5179 = Transformer.from_crs(5186, 5179, always_xy=True)
def placement(name, sign=1):
    r = TAB['relocation'].get(name)
    if r and 'position' in r:
        P = r['position']; th = r['rotation'][1]; src = 'relocation'
    else:
        m = SUB[name]; P = {'x': m['x'], 'y': m['y']}; th = math.radians(m['roty']); src = 'getSubwayData'
    return P['x'], P['y'], sign * th, src
def model_to_5186(name, pts, sign=1):
    px, py, th, _ = placement(name, sign); c, s = math.cos(th), math.sin(th)
    return [(px + x * c - y * s, py + x * s + y * c) for x, y in pts]
def exits(name):
    out = {}
    for k, v in TAB['exitPosition'].get(name, {}).items():
        pos = v.get('position') if isinstance(v, dict) else None
        if isinstance(v, list):   # nested array in the source (e.g. 마곡역 7): take the first marker
            v = v[0]; pos = v.get('position')
        if pos and isinstance(pos[0], list): pos = pos[0]
        if pos: out[k] = pos
    return out
