"""Render every S-Map model of one map station north-up (EPSG:5179) and compute floor geometry.
Writes render/<smap name>/{<floor>.png, role_<floor>.png, meta.json, geo.json}."""
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from georef import SUB, TAB, placement, T5186_5179, exits
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BLENDER = r'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
PPM = 2.5
# map station name -> extra S-Map catalogue names whose label does not follow "<name>역" / "<name>역(...)"
ALIAS = {'구반포': ['구반포'], '불암산': ['당고개역'], '총신대입구(이수)': ['총신대입구역'], '보문': ['보문역 우이신설선'],
         '올림픽공원': ['올림픽공원역 (5호선)'], '효창공원앞': ['효창공원앞역 (6호선)']}
def smap_names(name_ko):
    base = name_ko if name_ko.endswith('역') else name_ko + '역'
    return sorted(set(n for n in SUB if n == base or n.startswith(base + '(')) | set(a for a in ALIAS.get(name_ko, []) if a in SUB))
def north_rot(px, py):
    a = T5186_5179.transform(px, py); b = T5186_5179.transform(px, py + 100)
    return math.atan2(-(b[0] - a[0]), b[1] - a[1])
def render(name, force=False):
    m = SUB[name]; glb = os.path.join(ROOT, 'smap/models', m['filename'])
    if not os.path.exists(glb):
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools/fetch_models.py'), name], check=True)
    roles = glb[:-4] + '.roles.json'
    if not os.path.exists(roles):
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools/glb_textures.py'), glb, roles], check=True, capture_output=True)
    from glb_sanitize import sanitize
    glb, nbad = sanitize(glb, glb[:-4] + '.clean.glb')
    px, py, th, src = placement(name)
    ang = th + north_rot(px, py)
    out = os.path.join(ROOT, 'render', name)
    if force or not os.path.exists(os.path.join(out, 'meta.json')):
        r = subprocess.run([BLENDER, '-b', '--factory-startup', '-P', os.path.join(ROOT, 'tools/bl_floors.py'), '--',
                            glb, out, str(PPM), roles, str(ang), glb.replace('.clean.glb', '.glb')[:-4] + '.froles.json'], capture_output=True, text=True, encoding='utf-8', errors='replace')
        if 'DONE' not in r.stdout:
            raise RuntimeError(f'blender failed for {name}: {r.stdout[-800:]} {r.stderr[-800:]}')
    meta = json.load(open(os.path.join(out, 'meta.json'), encoding='utf-8'))
    ox, oy = T5186_5179.transform(px, py)
    ex = exits(name); c, s = math.cos(ang), math.sin(ang)
    ex5179 = {k: (ox + v[0] * c - v[1] * s, oy + v[0] * s + v[1] * c, v[2]) for k, v in ex.items()}
    # ground level: median exit z; else top of 1F floor
    zs = sorted(v[2] for v in ex.values())
    fl = meta['floors']
    ground = zs[len(zs) // 2] if zs else max((v['floor_z'] for k, v in fl.items() if k.endswith('F')), default=max(v['floor_z'] for v in fl.values()))
    geo = {'name': name, 'origin5179': [ox, oy], 'angle': ang, 'placement_src': src, 'ground_z': ground,
           'ground_src': 'S-Map 출입구 z 중앙값' if zs else 'S-Map 1F 바닥 z', 'exits': ex5179, 'floors': {}}
    x0, x1, y0, y1 = meta['bbox_xy']; p = meta['px_per_m']
    for k, v in fl.items():
        a = np.asarray(Image.open(os.path.join(out, f'{k}.png')).getchannel('A')) > 20
        role = np.asarray(Image.open(os.path.join(out, f'role_{k}.png')).convert('RGB')).astype(int)
        rail = ((role[..., 0] - role[..., 1]) > 60) & a
        rp = os.path.join(out, f'railpoly_{k}.json')
        if os.path.exists(rp):
            from PIL import ImageDraw
            rim = Image.new('L', (a.shape[1], a.shape[0]), 0); dr = ImageDraw.Draw(rim)
            for poly in json.load(open(rp)):
                if len(poly) >= 3: dr.polygon([((x - x0) * p, (y1 - y) * p) for x, y in poly], fill=255)
            rail = rail | (np.asarray(rim) > 0)
        geo['floors'][k] = {'floor_z': v['floor_z'], 'depth_m': round(ground - v['floor_z'], 1), 'walk_m2': round(float(a.sum()) / p / p),
                            'rail_m2': round(float(rail.sum()) / p / p), 'has_rail': bool(rail.sum() / p / p > 150)}
        np.save(os.path.join(out, f'mask_{k}.npy'), np.packbits(a)); np.save(os.path.join(out, f'rail_{k}.npy'), np.packbits(rail))
    geo['bbox_xy'] = meta['bbox_xy']; geo['px_per_m'] = p; geo['size'] = meta['size']
    json.dump(geo, open(os.path.join(out, 'geo.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return geo
if __name__ == '__main__':
    for st in sys.argv[1:]:
        for n in smap_names(st):
            try:
                g = render(n, force='--force' in sys.argv)
            except Exception as e:
                print('FAIL', n, str(e)[-300:]); continue
            print(n, g['placement_src'], 'ground', round(g['ground_z'], 1), {k: (v['depth_m'], v['has_rail']) for k, v in g['floors'].items()})
