"""Compose a station defence floorplan (ground + underground) from real geodata.

Ground plan  : Seoul official geodata via the S-Map geoserver (buildings, land cover, road names, EPSG:5186 -> 5179),
               S-Map exit markers, OSM water / ventilation shafts. 2126 setting overlays are placed on that terrain.
Underground  : S-Map indoor 3D model floors rendered top-down (render_station.py), real floor heights, detected rails.
Setting data : settlement/data/station-floorplans.json, stations.json, stations/<faction>/<station>.md.

Usage: compose.py <name_ko> [...]   -> out/<name_ko>/<name_ko>.svg (+ .png via Edge headless, + data.json)
"""
import base64, io, json, math, os, re, subprocess, sys, html
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from shapely.geometry import shape, Point, LineString, Polygon, box, MultiPolygon, mapping
from shapely.ops import transform as sh_transform, unary_union
from skimage import measure

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from georef import T5186_5179, T4326_5186
from pyproj import Transformer
from smap_wfs import wfs
from render_station import smap_names, render, ROOT
import perimeter as PER

T4326_5179 = Transformer.from_crs(4326, 5179, always_xy=True)
T5179_5186 = Transformer.from_crs(5179, 5186, always_xy=True)
SET = r'E:/git/seoul-dengoku-wiki/.omo/handoff/v4/settlement'
STATIONS = {s['name_ko']: s for s in json.load(open(f'{SET}/data/stations.json', encoding='utf-8'))['stations']}
PLANS = {s['name_ko']: s for s in json.load(open(f'{SET}/data/station-floorplans.json', encoding='utf-8'))['stations']}
OSM = json.load(open(os.path.join(ROOT, 'osm/seoul.json'), encoding='utf-8'))
import csv, glob
VENTS = list(csv.DictReader(open(os.path.join(ROOT, 'opendata/vent_utf8.csv'), encoding='utf-8')))
GAPS = json.load(open(os.path.join(ROOT, 'opendata/gaps/gaps.json'), encoding='utf-8'))['stations']
FAC = os.path.join(ROOT, 'opendata/facilities')
def _norm(n):
    n = re.sub(r'_\d+$', '', n); n = re.sub(r'\(.*?\)', '', n).strip(); return re.sub(r'역$', '', n).strip()
def official_maps(name_ko):
    base = _norm(name_ko); out = []
    for f in glob.glob(os.path.join(FAC, 'layout_maps/seoulmetro_1-8/*/*.jpg')):
        stem = os.path.splitext(os.path.basename(f))[0].split(' ', 1)[-1]
        if _norm(stem) == base: out.append((f, '서울교통공사 역 이용 안내도·비상대피로'))
    for f in glob.glob(os.path.join(FAC, 'layout_maps/ui_sinseol/*.jpg')):
        if os.path.basename(f).split('_')[1] == base: out.append((f, '우이신설선 역 안내도'))
    for f in glob.glob(os.path.join(FAC, 'layout_maps/shinbundang/*.jpg')):
        if os.path.basename(f).split('_')[1] == base: out.append((f, '신분당선 역 안내도'))
    idx = os.path.join(FAC, 'layout_maps/line9_all38/index.json')
    if os.path.exists(idx):
        for e in json.load(open(idx, encoding='utf-8')):
            if e['label'].split(' ')[0] == base:
                for im in e.get('images', [])[:1]: out.append((os.path.join(FAC, 'layout_maps/line9_all38', im['file']), '서울시메트로9호선 역 안내도'))
    return out[:3]
VC = {}
for r in csv.DictReader(open(os.path.join(ROOT, 'opendata/geo/vent_coords.csv'), encoding='utf-8-sig')):
    if r['precision'] == 'landmark' and r['x5186']:
        VC[(r['line'], r['no'])] = (float(r['x5186']), float(r['y5186']), r['landmark'])
_SO = os.path.join(FAC, 'seoul_openapi')
QE, CSO = {}, {}
if os.path.exists(os.path.join(_SO, 'OA-22749_getFstExit.json')):
    for r in json.load(open(os.path.join(_SO, 'OA-22749_getFstExit.json'), encoding='utf-8')):
        QE.setdefault(_norm(r['stnNm']), []).append(r)
if os.path.exists(os.path.join(_SO, 'OA-22736_getFcCstct.json')):
    for r in json.load(open(os.path.join(_SO, 'OA-22736_getFcCstct.json'), encoding='utf-8')):
        CSO.setdefault(_norm(r['stnNm']), []).append(f"{r.get('lineNm', '')} {r.get('stnFlr', '')} {r.get('dtlPstn', '')}".strip())
NCARS = {'1': 10, '2': 10, '3': 10, '4': 10, '5': 8, '6': 8, '7': 8, '8': 6}
# S-Map OpenLab public layers (수치지형도, EPSG:5186): 지하환기구, 지하도, 지하도입구, 터널
import shapefile
from shapely.strtree import STRtree
def _ol(code):
    fs = glob.glob(os.path.join(ROOT, 'opendata/openlab/shp', code, '*.shp'))
    if not fs: return [], None
    r = shapefile.Reader(fs[0], encoding='cp949'); geoms, recs = [], []
    for sh, rec in zip(r.shapes(), r.records()):
        try:
            g = shape(sh.__geo_interface__)
            g = sh_transform(lambda x, y, z=None: T5186_5179.transform(x, y), g)
            geoms.append(g); recs.append(list(rec))
        except Exception: pass
    return list(zip(geoms, recs)), STRtree(geoms)
OL = {k: _ol(c) for k, c in (('vent', 'N1A_C0470000'), ('underpass', 'N1A_C0453322'), ('upentr', 'N1L_C0463374'), ('tunnel', 'N1A_A0110020'))}
def ol_in(key, area):
    items, tree = OL[key]
    if tree is None: return []
    return [items[i] for i in tree.query(area) if items[i][0].intersects(area)]
GATES = {}
_gf = glob.glob(os.path.join(FAC, 'utf8/OA-13294/*20240325.csv'))
if _gf:
    for r in csv.DictReader(open(_gf[0], encoding='utf-8-sig')):
        n = _norm(r['역명']); tot = sum(int(v or 0) for k, v in r.items() if k.endswith('개집표기'))
        GATES[n] = GATES.get(n, 0) + tot
VENT_SRC = '서울교통공사_환기구현황 2024-11-04 (서울 열린데이터광장 OA-12926, 1~8호선)'
def station_vents(name):
    base = re.sub(r'\(.*?\)', '', name).replace('역', '').strip()
    own = [v for v in VENTS if '역사' in v['용도'] and re.sub(r'\(.*?\)', '', v['구간']).replace('역', '').strip() == base]
    line = [v for v in VENTS if '~' in v['구간'] and base in [x.strip().replace('역', '') for x in v['구간'].split('~')]]
    return own, line
FACTION_KO = {'government': '정부', 'free-city': '자유도시', 'arc': '아크'}
FONT = "'Malgun Gothic','Noto Sans KR',sans-serif"
esc = lambda s: html.escape(str(s), quote=True)

# ---------------------------------------------------------------- colours
C = dict(bg='#0f1b2d', panel='#13233a', frame='#3d6a99', grid='#18304d', text='#dce8f5', sub='#9db7d3',
         road='#22405f', rail='#3a3f4a', water='#1d5a80', green='#173a2c', bare='#1a2a3d', bld='#1c2e47', bld_line='#5f86b3',
         used='#3ddc84', sealed='#ff5c6c', hidden='#ffd34d', rubble='#a8b6c8', barrier='#c9a063', vent='#ff8a3d',
         intake='#58b9ff', shutter='#ff4d5e', gate='#ffd166', foot='#e8f1ff', last='#4cd97b', sump='#58b9ff')
USE_COL = {'숨김': '#ffd34d', '거처': '#7aa7ff', '장터': '#ff9f5a', '망루': '#ff5c6c', '작업': '#c9a063', '공공': '#b48cff', '빈': '#6f7f93'}

# ---------------------------------------------------------------- helpers
def to5179(g, src):
    t = T5186_5179 if src == 5186 else T4326_5179
    return sh_transform(lambda x, y, z=None: t.transform(x, y), g)

def neighbour(text):
    m = re.match(r'^(.+?) 쪽', text or '')
    if not m: return None
    s = STATIONS.get(m.group(1))
    return (s['name_ko'], T4326_5179.transform(s['lon'], s['lat'])) if s else (m.group(1), None)

def md_glance(name, faction):
    p = f'{SET}/stations/{faction}/{name}.md'
    out = {}
    if not os.path.exists(p): return out
    t = open(p, encoding='utf-8').read()
    sec = t.split('## 한눈에', 1)[-1].split('\n## ', 1)[0]
    for line in sec.splitlines():
        m = re.match(r'^\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|$', line)
        if m and m.group(1) not in ('항목', '---'): out[m.group(1)] = m.group(2)
    return out

USE_NAME = {'01': '단독주택', '02': '공동주택', '03': '제1종 근린생활', '04': '제2종 근린생활', '05': '문화·집회',
            '06': '판매(시장)', '07': '의료', '08': '교육연구', '09': '노유자', '10': '업무', '11': '숙박',
            '12': '위락', '13': '공장', '14': '창고', '16': '자동차', '90': '기타'}

def building_use(p, d_exit, faction, fid):
    code = (p.get('bdtyp_cd') or '')
    c2 = code[:2]; gro = p.get('gro_flo_co') or 0; und = p.get('und_flo_co') or 0
    if und >= 2 and d_exit < 60: return '숨김', f'숨긴 출입구·지하 창고(지하 {und}층, 출입구 {d_exit:.0f} m)'
    if gro >= 15: return '망루', f'망루(지상 {gro}층 꼭대기에서 길목 감시)'
    if code.startswith('031') : return '공공', '무기고·경비 초소'
    if code.startswith('042'): return '공공', '기도처'
    if c2 in ('01', '02'):
        if faction == 'free-city' and gro >= 5: return '거처', f'아파트 장원(지상 {gro}층, 지상 공장 겸용)'
        if faction == 'arc': return '빈', '빈집(해체해 땔감·자재)'
        return '거처', '명부 밖 거처(지상 겨울살이)'
    if c2 in ('03', '04', '06'): return '장터', '장터 가게·난전 / 해체해 자재' if c2 != '06' else '옛 시장 = 지상 장날 터'
    if c2 == '07': return '공공', '진료소·격리 병동'
    if c2 == '08': return '공공', '학교 터·서고'
    if c2 == '10': return ('망루', f'망루·관아(지상 {gro}층)') if gro >= 10 else ('공공', '관아·문서 창고')
    if c2 == '11': return '거처', '숙소 → 나중 명부 거처'
    if c2 in ('13', '14', '16'): return '작업', '작업장·창고·차량 해체장(차단물 재료)'
    return '빈', '빈 건물(해체해 땔감)'

def landcover_class(p):
    l1 = p.get('l1_name') or ''; l2 = p.get('l2_name') or ''; l3 = p.get('l3_name') or ''
    if '철도' in l3: return 'rail'
    if '교통' in l2 or '도로' in l3: return 'road'
    if '수역' in l1 or '수' == l1[:1] or '하천' in l3 or '호소' in l3: return 'water'
    if '초지' in l1 or '산림' in l1 or '농업' in l1 or '습지' in l1: return 'green'
    if '나지' in l1: return 'bare'
    return None

def png_b64(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

# ---------------------------------------------------------------- underground data
def load_model(name):
    out = os.path.join(ROOT, 'render', name)
    geo = json.load(open(os.path.join(out, 'geo.json'), encoding='utf-8'))
    for k, f in geo['floors'].items():
        W, H = geo['size']
        f['mask'] = np.unpackbits(np.load(os.path.join(out, f'mask_{k}.npy')))[:W * H].reshape(H, W).astype(bool)
        f['rail'] = np.unpackbits(np.load(os.path.join(out, f'rail_{k}.npy')))[:W * H].reshape(H, W).astype(bool)
        f['png'] = os.path.join(out, f'{k}.png')
    return geo

def calibrate(geo, st):
    """Ground z. Models with S-Map exit markers keep the exit median (consistent inside S-Map).
    Models without exits: anchor the deepest floor to the deepest recorded platform depth when that is plausible.
    A model with no rail texture at all gets its deepest floor marked as platform [추정]."""
    fl = geo['floors']
    geo['depth_src'] = geo['ground_src']
    # sanity: street level must sit near the 1F floor; otherwise the exit markers use another datum
    f1 = fl.get('1F') or fl.get('F01')
    if f1 and abs(geo['ground_z'] - f1['floor_z']) > 6:
        geo['ground_z'] = f1['floor_z']; geo['depth_src'] = 'S-Map 1F 바닥 높이(출입구 표식 높이가 1F와 6 m 넘게 어긋나 대신 씀)'
    elif not f1:
        top = max(f['floor_z'] for f in fl.values())
        if geo['ground_z'] - top < 2:
            geo['ground_z'] = top + 5; geo['depth_src'] = '지상 층 없음 → 가장 얕은 층 위 5 m를 지면으로 [추정]'
    if not any(f['has_rail'] for f in fl.values()):
        deep = min(fl.values(), key=lambda f: f['floor_z'])
        if geo['ground_z'] - deep['floor_z'] > 12:
            deep['has_rail'] = True; deep['rail_est'] = True
    if not geo['exits']:
        lines = [d for d in (st.get('depth_by_line') or []) if isinstance(d.get('depth_m'), (int, float)) and d['depth_m'] > 0]
        deep = min(fl.values(), key=lambda f: f['floor_z'])
        if lines:
            dz = geo['ground_z'] - deep['floor_z']; best = min(lines, key=lambda d: abs(d['depth_m'] - dz))
            if abs(best['depth_m'] - dz) <= 8:
                geo['ground_z'] = deep['floor_z'] + best['depth_m']
                geo['depth_src'] = f"출입구 표식 없음 → 가장 깊은 층 = {best['line']} 승강장 {best['depth_m']} m(stations.json)에 맞춤"
    for f in fl.values():
        f['depth_m'] = round(geo['ground_z'] - f['floor_z'], 1)

def px_to_5179(geo, u, v):
    x0, x1, y0, y1 = geo['bbox_xy']; p = geo['px_per_m']; ox, oy = geo['origin5179']
    return ox + x0 + u / p, oy + y1 - v / p

def mask_polys(geo, mask, simplify=1.5, min_area=30):
    small = mask[::2, ::2]
    small = ndimage.binary_closing(small, iterations=2)
    polys = []
    for c in measure.find_contours(np.pad(small, 1).astype(float), 0.5):
        pts = [px_to_5179(geo, (x - 1) * 2, (y - 1) * 2) for y, x in c]
        if len(pts) < 4: continue
        pg = Polygon(pts).buffer(0)
        if pg.area >= min_area: polys.append(pg.simplify(simplify))
    return polys

def official_line(ln, v):
    g = lambda t: '확인' if (t or '').startswith('[확인') else ('발췌' if (t or '').startswith('[발췌') else '추정')
    fl = f"{v.get('floor') or '?'}[층 {g(v.get('floor_grade') or v.get('grade'))}]"
    if v.get('depth_m') is not None: dp = f"{v['depth_m']} m[{g(v.get('grade'))}]"
    elif v.get('depth_m_est'): dp = f"약 {v['depth_m_est']} m[층 환산 추정]"
    else: dp = '깊이 미상'
    return f'{ln} {fl} {dp}'

def fac_clusters(geo, kf, role, cell=6.0):
    """Facility polygons (S-Map model materials classified by texture/name/OCR) -> clusters [(u, v, n, label)] in render pixels."""
    fp = os.path.join(ROOT, 'render', geo['name'], f'facpoly_{kf}.json')
    if not os.path.exists(fp): return []
    items = json.load(open(fp, encoding='utf-8')).get(role, [])
    x0, x1, y0, y1 = geo['bbox_xy']; p = geo['px_per_m']; cells = {}
    for it in items:
        xs = [q[0] for q in it['xy']]; ys = [q[1] for q in it['xy']]
        cx_, cy_ = sum(xs) / len(xs), sum(ys) / len(ys)
        key = (round(cx_ / cell), round(cy_ / cell))
        c = cells.setdefault(key, [0, 0, 0, it.get('label', '')]); c[0] += cx_; c[1] += cy_; c[2] += 1
    out = []
    for c in cells.values():
        X, Y = c[0] / c[2], c[1] / c[2]; out.append(((X - x0) * p, (y1 - Y) * p, c[2], c[3]))
    # merge clusters closer than 2 cells
    merged = []
    for u, v, n, lab in sorted(out, key=lambda t: -t[2]):
        for m_ in merged:
            if math.dist((u, v), (m_[0], m_[1])) < 2 * cell * p:
                m_[2] += n; break
        else: merged.append([u, v, n, lab])
    return merged

def rail_strips(geo, f):
    src = f['mask'] if f.get('rail_est') else f['rail']
    lab, n = ndimage.label(ndimage.binary_dilation(src, iterations=3))
    p = geo['px_per_m']; out = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(xs) / p / p < 120: continue
        pts = np.stack([xs, ys], 1).astype(float); c = pts.mean(0)
        u, s, vt = np.linalg.svd(pts - c, full_matrices=False); ax = vt[0]
        pr = (pts - c) @ ax; w = (pts - c) @ vt[1]
        a, b = c + ax * pr.min(), c + ax * pr.max()
        out.append({'a': a, 'b': b, 'c': c, 'len_m': (pr.max() - pr.min()) / p, 'w_m': (w.max() - w.min()) / p,
                    'ax': ax, 'n': vt[1]})
    return sorted(out, key=lambda r: -r['len_m'])

# ---------------------------------------------------------------- main compose
def compose(name_ko, half=300):
    st = STATIONS[name_ko]; plan = PLANS.get(name_ko, {}); faction = st['faction_id'][0]
    models = []
    for n in smap_names(name_ko):
        try:
            render(n)
            g = load_model(n); calibrate(g, st); models.append(g)
        except Exception as e:
            print('model fail', n, e)
    # centre: all exits + model origins; no S-Map model -> station coordinate (stations.json)
    pts = [v[:2] for g in models for v in g['exits'].values()] or [g['origin5179'] for g in models]         or [T4326_5179.transform(st['lon'], st['lat'])]
    cx, cy = float(np.mean([p[0] for p in pts])), float(np.mean([p[1] for p in pts]))
    ext = box(cx - half, cy - half, cx + half, cy + half)
    # fetch Seoul official layers (5186 bbox)
    c5186 = [T5179_5186.transform(x, y) for x, y in ext.exterior.coords]
    bb = [min(p[0] for p in c5186) - 20, min(p[1] for p in c5186) - 20, max(p[0] for p in c5186) + 20, max(p[1] for p in c5186) + 20]
    blds = []
    for ft in wfs('seoul:tl_spbd_buld_2', bb)['features']:
        g = to5179(shape(ft['geometry']), 5186)
        if g.intersects(ext): blds.append((g.intersection(ext), ft['properties'], g))
    lc = {'road': [], 'rail': [], 'water': [], 'green': [], 'bare': []}
    for ft in wfs('seoul:seoul_area', bb)['features']:
        k = landcover_class(ft['properties'])
        if k:
            g = to5179(shape(ft['geometry']), 5186).buffer(0)
            if g.intersects(ext): lc[k].append(g.intersection(ext))
    roads_named = []
    for ft in wfs('seoul:tl_sprd_manage', bb)['features']:
        g = to5179(shape(ft['geometry']), 5186)
        if g.intersects(ext): roads_named.append((g.intersection(ext), ft['properties']))
    water_osm = []
    for w in OSM['water']:
        try:
            g = to5179(shape(w['geom']), 4326)
            if g.intersects(ext): water_osm.append((g.intersection(ext), w.get('name')))
        except Exception: pass
    ways_osm = []
    for w in OSM['waterways']:
        g = to5179(shape(w['geom']), 4326)
        if g.intersects(ext): ways_osm.append((g.intersection(ext), w.get('name'), w.get('kind')))
    vents_osm = []
    for v in OSM['vents']:
        x, y = T4326_5179.transform(v['lon'], v['lat'])
        if ext.contains(Point(x, y)): vents_osm.append((x, y, v['tags']))
    road_u = unary_union(lc['road']) if lc['road'] else Polygon()
    bld_u = unary_union([b[2] for b in blds]) if blds else Polygon()
    # footprint of every underground floor (depth > 1 m) of every model
    foot = []
    for g in models:
        for k, f in g['floors'].items():
            if f['depth_m'] > 1.0 and f['walk_m2'] > 40: foot += mask_polys(g, f['mask'])
    foot_u = unary_union(foot).buffer(2).buffer(-2) if foot else Polygon()
    # ---- exits: S-Map numbered markers; status from the station's 2126 exit counts
    exits = []
    for g in models:
        for k, (x, y, z) in g['exits'].items():
            if any(math.dist((x, y), (e['x'], e['y'])) < 4 for e in exits): continue
            exits.append({'no': k, 'x': x, 'y': y, 'model': g['name'], 'd_bld': Point(x, y).distance(bld_u) if not bld_u.is_empty else 99,
                          'in_road': (Point(x, y).distance(road_u) < 2) if not road_u.is_empty else False})
    gx_ = GAPS.get(name_ko, {}).get('exits') or []
    if not exits and any('lat' in e for e in gx_):   # 행정안전부 전국 지하철 출구 레이어 (official coordinates)
        for e in gx_:
            if 'lat' not in e: continue
            x, y = T4326_5179.transform(e['lon'], e['lat'])
            exits.append({'no': str(e['no']), 'x': x, 'y': y, 'model': 'MOIS', 'd_bld': Point(x, y).distance(bld_u) if not bld_u.is_empty else 99,
                          'in_road': (Point(x, y).distance(road_u) < 2) if not road_u.is_empty else False})
    if not exits:   # 수치지형도 지하도입구 named '<역>역<n>번출입구' (S-Map 오픈랩)
        base_ = _norm(name_ko)
        for g_, rec in ol_in('upentr', ext):
            m_ = re.search(r'(.+?)역\s*(\d+(?:-\d+)?)\s*번\s*출입구', rec[0] or '')
            if m_ and _norm(m_.group(1)).endswith(base_):
                c_ = g_.centroid
                if any(e['no'] == m_.group(2) for e in exits): continue
                exits.append({'no': m_.group(2), 'x': c_.x, 'y': c_.y, 'model': 'OPENLAB', 'd_bld': c_.distance(bld_u) if not bld_u.is_empty else 99,
                              'in_road': (c_.distance(road_u) < 2) if not road_u.is_empty else False})
    if not models and not exits:   # OSM entrances near the station stand in for S-Map exit markers (grade B)
        sx_, sy_ = pts[0]
        for e in OSM['entrances']:
            x, y = T4326_5179.transform(e['lon'], e['lat'])
            if math.dist((x, y), (sx_, sy_)) < 220 and e.get('ref') and not any(math.dist((x, y), (q['x'], q['y'])) < 4 for q in exits):
                exits.append({'no': e['ref'], 'x': x, 'y': y, 'model': 'OSM', 'd_bld': Point(x, y).distance(bld_u) if not bld_u.is_empty else 99,
                              'in_road': (Point(x, y).distance(road_u) < 2) if not road_u.is_empty else False})
    cnt = plan.get('exits', {}); tot = max(1, cnt.get('total') or len(exits))
    n = len(exits); n_hid = max(1 if n >= 3 else 0, round(n * (cnt.get('hidden', 1) / tot)))
    n_used = max(1, round(n * (cnt.get('used', 1) / tot)))
    order = sorted(exits, key=lambda e: e['d_bld'])          # closest to buildings -> hidden
    for e in order[:n_hid]: e['state'] = 'hidden'
    rest = sorted(order[n_hid:], key=lambda e: math.dist((e['x'], e['y']), (cx, cy)))
    exposed = sorted(rest, key=lambda e: (-(e['in_road']), -e['d_bld']))
    used_set = set(id(e) for e in sorted(rest, key=lambda e: (e['in_road'], math.dist((e['x'], e['y']), (cx, cy))))[:n_used])
    for e in rest: e['state'] = 'used' if id(e) in used_set else 'sealed'
    # ---- rubble ring on real roads
    R = 60.0
    if not foot_u.is_empty:
        R = max(math.dist((cx, cy), p) for p in foot_u.convex_hull.exterior.coords) + 45
    R = float(min(max(R, 110), 200, half - 40))
    ring = Point(cx, cy).buffer(R + 4).difference(Point(cx, cy).buffer(R - 4))
    rubble = ring.intersection(road_u) if not road_u.is_empty else Polygon()
    rubble_parts = [p for p in getattr(rubble, 'geoms', [rubble]) if not p.is_empty and p.area > 20]
    barriers = []
    for rp in sorted(rubble_parts, key=lambda g: -g.area)[:8]:
        if rp.area / 8 > 22:   # road wider than ~18 m where it crosses the ring: zig-zag vehicle barrier outside
            c = rp.centroid; dx, dy = c.x - cx, c.y - cy; L = math.hypot(dx, dy) or 1
            ux, uy = dx / L, dy / L; tx, ty = -uy, ux
            for i, (off, side) in enumerate([(14, -1), (24, 1), (34, -1)]):
                barriers.append((c.x + ux * off + tx * side * 5, c.y + uy * off + ty * side * 5, math.degrees(math.atan2(ty, tx))))
    # ---- air: supply / exhaust toward neighbouring stations
    air = plan.get('air', {}); sup = neighbour(air.get('supply')); exh = neighbour(air.get('exhaust'))
    ev = plan.get('exhaust_vent', {}); ev_d = ev.get('distance_m', 300)
    def toward(nb, dist):
        if not nb or not nb[1]: return None
        dx, dy = nb[1][0] - cx, nb[1][1] - cy; L = math.hypot(dx, dy) or 1
        return cx + dx / L * dist, cy + dy / L * dist, dx / L, dy / L
    exh_pt = toward(exh, ev_d); sup_pt = toward(sup, R + 50); exh_real = None
    vent_real = None
    own_v, line_v = station_vents(name_ko)
    vent_marks = []
    if own_v:
        ring_v = (foot_u.buffer(25) if not foot_u.is_empty else Point(cx, cy).buffer(60)).exterior if not (foot_u.buffer(25) if not foot_u.is_empty else Point(cx, cy).buffer(60)).geom_type.startswith('Multi') else unary_union(foot_u.buffer(25)).convex_hull.exterior
        green_u = unary_union(lc['green']) if lc['green'] else Polygon()
        by_type = {}
        for v in own_v: by_type.setdefault(v['기타'], []).append(v)
        for t, vs in by_type.items():
            area = green_u if t in ('녹지', '공원') else (road_u.buffer(3).difference(road_u.buffer(-3)) if t == '보도' and not road_u.is_empty else (road_u if t == '차도' else None))
            L = ring_v.length; cands = [ring_v.interpolate(L * (i + 0.5) / 60) for i in range(60)]
            if area is not None and not area.is_empty:
                good = [p for p in cands if area.distance(p) < 12]
                cands = good or cands
            step = max(1, len(cands) // max(1, len(vs)))
            for j, v in enumerate(vs):
                lm = VC.get((v['호선'], v['번호']))
                if lm:
                    lx, ly = T5186_5179.transform(lm[0], lm[1])
                    if ext.contains(Point(lx, ly)):
                        k_ = sum(1 for q in vent_marks if q[3] == 'landmark' and math.dist(q[:2], (lx, ly)) < 1)
                        a_ = k_ * 1.3; vent_marks.append((lx + 7 * math.cos(a_) * min(k_, 1), ly + 7 * math.sin(a_) * min(k_, 1), v, 'landmark', lm[2])); continue
                pt = cands[(j * step + hash(t) % 7) % len(cands)]
                vent_marks.append((pt.x, pt.y, v, 'rule', ''))
    line_sec = {}; line_marks = []
    for v in line_v:
        line_sec.setdefault(v['구간'], []).append(v['기능'])
        lm = VC.get((v['호선'], v['번호']))
        if lm:
            lx, ly = T5186_5179.transform(lm[0], lm[1]); line_marks.append((lx, ly, v, lm[2]))
    if exh_pt and vents_osm:
        vent_real = min(vents_osm, key=lambda v: math.dist(v[:2], exh_pt[:2]))
    exh_ol = None
    if exh and exh_pt:
        near_v = ol_in('vent', Point(cx, cy).buffer(max(ev_d, 300) + 200))
        sub_v = [g_ for g_, rec in near_v if '지하철' in (rec[0] or '')] or [g_ for g_, rec in near_v if (rec[0] or '') == '지하환기구']
        if sub_v:
            ux_, uy_ = exh_pt[2], exh_pt[3]
            fwd = [g_ for g_ in sub_v if ((g_.centroid.x - cx) * ux_ + (g_.centroid.y - cy) * uy_) > 60]
            if fwd:
                bv = min(fwd, key=lambda g_: g_.centroid.distance(Point(exh_pt[0], exh_pt[1])))
                exh_ol = bv.centroid
    if exh and exh_pt and exh_ol is None:
        cand_ex = [m for m in line_marks if exh[0] in m[2]['구간'] and '배기' in m[2]['기능']]
        if cand_ex:
            bx = min(cand_ex, key=lambda m: math.dist(m[:2], exh_pt[:2]))
            exh_real = (bx[0], bx[1], bx[2]['구간'], bx[3])
            exh_pt = (bx[0], bx[1], exh_pt[2], exh_pt[3]); ev_d = int(math.dist((cx, cy), bx[:2]))
    if exh_ol is not None:
        exh_pt = (exh_ol.x, exh_ol.y, exh_pt[2], exh_pt[3]); ev_d = int(math.dist((cx, cy), (exh_ol.x, exh_ol.y)))
    # ---- defensive perimeter from combined real data (replaces the old fixed ring when topo data exists)
    # surface core = exits kept in use + intake vent (the underground needs no surface wall; hidden exits stay outside)
    core_parts = [Point(e['x'], e['y']).buffer(10) for e in exits if e['state'] == 'used'] or [Point(cx, cy).buffer(30)]
    if sup_pt: core_parts.append(Point(sup_pt[0], sup_pt[1]).buffer(8))
    try:
        per = None if faction == 'arc' else PER.build(name_ko, ext, unary_union(core_parts), faction, plan.get('pop_2126'), unary_union(lc['water']) if lc['water'] else None)
    except Exception as e_:
        print('perimeter fail', name_ko, e_); per = None
    if per or faction == 'arc':
        rubble_parts = []; barriers = []
    # ---- buildings to annotate
    cand = []
    for g, p, gfull in blds:
        if g.is_empty or g.area < 120: continue
        d_c = gfull.distance(Point(cx, cy))
        if d_c > half * 0.8: continue
        d_exit = min((gfull.distance(Point(e['x'], e['y'])) for e in exits), default=999)
        gro = p.get('gro_flo_co') or 0; und = p.get('und_flo_co') or 0
        score = gfull.area * (1 + gro + 2 * und) / (1 + d_c / 60) * (1.5 if (p.get('buld_nm') or p.get('pos_bul_nm')) else 1)
        cat, use = building_use(p, d_exit, faction, None)
        cand.append(dict(g=g, gfull=gfull, p=p, score=score, cat=cat, use=use, d_exit=d_exit))
    cand.sort(key=lambda c: -c['score'])
    picked = []; seen_names = set()
    for c in cand:
        nm = c['p'].get('buld_nm') or c['p'].get('pos_bul_nm') or ''
        if nm and nm in seen_names: continue
        if any(c['gfull'].distance(o['gfull']) < 12 for o in picked): continue
        picked.append(c); seen_names.add(nm)
        if len(picked) >= 12: break
    # ================================================================= SVG
    W = 2600; GS = 1040; gx, gy = 40, 150
    k = GS / (2 * half)
    S = lambda x, y: (gx + (x - (cx - half)) * k, gy + ((cy + half) - y) * k)
    def path(g):
        if g.is_empty: return ''
        geoms = getattr(g, 'geoms', [g]); d = []
        for gg in geoms:
            if gg.geom_type == 'Polygon':
                for ring_ in [gg.exterior] + list(gg.interiors):
                    d.append('M' + 'L'.join(f'{S(x, y)[0]:.1f},{S(x, y)[1]:.1f}' for x, y in ring_.coords) + 'Z')
            elif gg.geom_type in ('LineString', 'LinearRing'):
                d.append('M' + 'L'.join(f'{S(x, y)[0]:.1f},{S(x, y)[1]:.1f}' for x, y in gg.coords))
            elif hasattr(gg, 'geoms'):
                d.append(path(gg))
        return ' '.join(d)
    out = []
    A = out.append
    # ---- underground panels layout (right)
    UX, UY, UW = gx + GS + 50, 150, W - (gx + GS + 50) - 40
    panels = []; skipped = []
    for g in models:
        for kf, f in g['floors'].items():
            if f['walk_m2'] < 40: continue
            ys, xs = np.nonzero(f['mask'])
            if not len(xs): continue
            dens = f['walk_m2'] / max(1.0, (xs.max() - xs.min()) * (ys.max() - ys.min()) / g['px_per_m'] ** 2)
            if dens < 0.03 or f['walk_m2'] < 120:
                skipped.append(f"{g['name']} {kf}({f['walk_m2']} m², 흩어진 조각)"); continue
            panels.append((g, kf, f, xs.min(), xs.max(), ys.min(), ys.max()))
    panels.sort(key=lambda t: (t[2]['depth_m'], t[0]['name']))
    COLS = 3 if len(panels) > 8 else 2
    colw = (UW - (COLS - 1) * 16) / COLS
    maxw_m = max([(t[4] - t[3]) / t[0]['px_per_m'] for t in panels] or [100])
    sc = min(colw / (maxw_m + 8), 3.0)        # px per metre, common to all panels
    colh = [UY + 60] * COLS
    playout = []
    for t in panels:
        g, kf, f, u0, u1, v0, v1 = t; p = g['px_per_m']
        wpx = (u1 - u0) / p * sc + 16; hpx = (v1 - v0) / p * sc + 16
        ci = int(np.argmin(colh)); x = UX + ci * (colw + 16); y = colh[ci]
        playout.append((t, x, y, wpx, hpx + 46)); colh[ci] += hpx + 46 + 14
    if not panels:
        colh[0] = UY + 60 + 40 + 26 * max(1, len(plan.get('levels', []))) + 40
    H = int(max(gy + GS + 40, max(colh)) + 620)
    A(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{FONT}">')
    A('<defs>'
      f'<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="{C["grid"]}" stroke-width="1"/></pattern>'
      f'<pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#26384f"/><line x1="0" y1="0" x2="0" y2="7" stroke="{C["rubble"]}" stroke-width="2.4"/></pattern>'
      f'<pattern id="whatch" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="{C["water"]}"/><path d="M0 5H10M5 0V10" stroke="#3f86b5" stroke-width="0.8"/></pattern>'
      f'<pattern id="railp" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="{C["rail"]}"/><line x1="0" y1="3" x2="6" y2="3" stroke="#59606d" stroke-width="1"/></pattern>'
      '<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="context-stroke"/></marker>'
      '</defs>')
    A(f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/><rect width="{W}" height="{H}" fill="url(#grid)"/>')
    title = f'{name_ko}역 방어 평면도 (설계도) — 실측 지리 데이터 기반, 위키 v4 정착 원칙, 잠정'
    A(f'<text x="40" y="58" font-size="34" font-weight="700" fill="{C["text"]}">{esc(title)}</text>')
    A(f'<text x="40" y="92" font-size="17" fill="{C["sub"]}">{esc(FACTION_KO[faction])} · {esc(plan.get("type", ""))} · 2126 인구 약 {format(plan["pop_2126"], ",") if isinstance(plan.get("pop_2126"), int) else "?"}명 (잠정) · 노선 {esc(", ".join(st["lines"]))} · '
      f'왼쪽: 지상 평면(서울시 공간정보 실측 위에 2126 설정) · 오른쪽: 지하 평면(S-Map 실내 3D 모형 층별 실측). 원칙 번호는 settlement-principles.md.</text>')
    # ---- ground panel
    A(f'<rect x="{gx}" y="{gy - 40}" width="{GS}" height="{GS + 40}" fill="{C["panel"]}" stroke="{C["frame"]}" stroke-width="2"/>')
    A(f'<text x="{gx + 14}" y="{gy - 12}" font-size="22" font-weight="700" fill="{C["text"]}">① 지상 평면 — 실측 {2 * half} m × {2 * half} m, 북쪽 위 (EPSG:5179)</text>')
    A(f'<svg x="{gx}" y="{gy}" width="{GS}" height="{GS}" viewBox="{gx} {gy} {GS} {GS}" overflow="hidden">')
    A(f'<rect x="{gx}" y="{gy}" width="{GS}" height="{GS}" fill="{C["bare"]}"/>')
    for kk, col in (('green', C['green']), ('road', C['road']), ('rail', 'url(#railp)'), ('water', 'url(#whatch)')):
        for g in lc[kk]: A(f'<path d="{path(g)}" fill="{col}" fill-rule="evenodd" stroke="none"/>')
    for g, nm in water_osm: A(f'<path d="{path(g)}" fill="url(#whatch)" fill-rule="evenodd" opacity="0.9"/>')
    for g, nm, kind in ways_osm: A(f'<path d="{path(g)}" fill="none" stroke="#4fa3d9" stroke-width="{3 if kind == "river" else 2}"/>')
    pick_ids = {id(c['p']) for c in picked}
    for g, p, gfull in blds:
        if id(p) in pick_ids: continue
        A(f'<path d="{path(g)}" fill="{C["bld"]}" stroke="{C["bld_line"]}" stroke-width="0.7" fill-rule="evenodd"/>')
    for i, c in enumerate(picked, 1):
        A(f'<path d="{path(c["g"])}" fill="{USE_COL[c["cat"]]}" fill-opacity="0.32" stroke="{USE_COL[c["cat"]]}" stroke-width="1.6" fill-rule="evenodd"/>')
    # station footprint (real, all underground floors)
    A(f'<path d="{path(foot_u)}" fill="{C["foot"]}" fill-opacity="0.10" stroke="{C["foot"]}" stroke-width="2" stroke-dasharray="7 5" fill-rule="evenodd"/>')
    # defensive perimeter (combined real data)
    if per:
        A(f'<path d="{path(per["poly"])}" fill="#ffffff" fill-opacity="0.04" stroke="none"/>')
        SEGSTYLE = {'facade': ('#dce8f5', 3.2, ''), 'wall': ('#e0c080', 3.2, ''), 'natural': ('#4fa3d9', 3.2, '7 4'),
                    'gap': (C['rubble'], 6.5, '3 3'), 'cut': (C['barrier'], 9, '')}
        for c_, g_ in per['segments']:
            if g_.geom_type != 'LineString': continue
            col, w_, da = SEGSTYLE[c_]
            A(f'<path d="{path(g_)}" fill="none" stroke="{col}" stroke-width="{w_}" stroke-linecap="butt"' + (f' stroke-dasharray="{da}"' if da else '') + '/>')
        if per.get('watch'):
            wg, wp, wh = per['watch']; wc = wg.centroid; sx_, sy_ = S(wc.x, wc.y)
            A(f'<path d="M{sx_:.1f},{sy_ - 13:.1f}L{sx_ + 4:.1f},{sy_ - 4:.1f}L{sx_ + 13:.1f},{sy_ - 4:.1f}L{sx_ + 6:.1f},{sy_ + 3:.1f}L{sx_ + 9:.1f},{sy_ + 12:.1f}L{sx_:.1f},{sy_ + 6:.1f}L{sx_ - 9:.1f},{sy_ + 12:.1f}L{sx_ - 6:.1f},{sy_ + 3:.1f}L{sx_ - 13:.1f},{sy_ - 4:.1f}L{sx_ - 4:.1f},{sy_ - 4:.1f}Z" fill="#ff5c6c" stroke="#ffffff" stroke-width="1"/>')
            A(f'<text x="{sx_ + 15:.1f}" y="{sy_ + 4:.1f}" font-size="13" fill="#ffb0b8" stroke="{C["bg"]}" stroke-width="3" paint-order="stroke">망루: {esc(wp.get("명칭") or wp.get("주기") or wp.get("용도") or "건물")} 지상 {wp.get("층수") or "?"}층, 꼭대기 해발 약 {wh:.0f} m</text>')
    # rubble + barriers (old ring fallback)
    for rp in rubble_parts: A(f'<path d="{path(rp)}" fill="url(#hatch)" stroke="{C["rubble"]}" stroke-width="1"/>')
    for bx, by, ang in barriers:
        sx, sy = S(bx, by)
        A(f'<rect x="{sx - 11:.1f}" y="{sy - 3.5:.1f}" width="22" height="7" fill="{C["barrier"]}" transform="rotate({-ang:.1f} {sx:.1f} {sy:.1f})"/>')
    # road names (widest named roads)
    lab_done = set()
    for g, p in sorted(roads_named, key=lambda t: -(float(t[1].get('road_bt') or 0))):
        nm = p.get('rn')
        if not nm or nm in lab_done or float(p.get('road_bt') or 0) < 15 or g.length < 120: continue
        lab_done.add(nm)
        mid = g.interpolate(0.5, normalized=True); a = g.interpolate(0.45, normalized=True); b = g.interpolate(0.55, normalized=True)
        ang = math.degrees(math.atan2(-(b.y - a.y), b.x - a.x))
        if ang > 90: ang -= 180
        if ang < -90: ang += 180
        sx, sy = S(mid.x, mid.y)
        A(f'<text x="{sx:.1f}" y="{sy:.1f}" font-size="13" fill="#8fb0d4" text-anchor="middle" transform="rotate({ang:.1f} {sx:.1f} {sy:.1f})" opacity="0.9">{esc(nm)}</text>')
        if len(lab_done) >= 6: break
    # water labels
    wl = set()
    for g, nm, kind in ways_osm:
        if nm and nm not in wl and g.length > 150:
            wl.add(nm); m = g.interpolate(0.5, normalized=True); sx, sy = S(m.x, m.y)
            A(f'<text x="{sx:.1f}" y="{sy - 8:.1f}" font-size="14" fill="#7cc4f0" text-anchor="middle">{esc(nm)} = 자연 해자 (원칙 15)</text>')
    # S-Map OpenLab 수치지형도 layers (real geometry)
    ol_vents = ol_in('vent', ext); ol_cnt = {}
    for g_, rec in ol_vents:
        kind = rec[0] or '환기구'; ol_cnt[kind] = ol_cnt.get(kind, 0) + 1
        col = C['vent'] if '지하철' in kind else ('#b48cff' if '공동구' in kind else '#9aa7b8')
        A(f'<path d="{path(g_.buffer(1.2))}" fill="{col}" fill-opacity="0.9" stroke="#ffffff" stroke-width="0.6"/>')
    for g_, rec in ol_in('underpass', ext):
        A(f'<path d="{path(g_)}" fill="#3a5f86" fill-opacity="0.55" stroke="#9fc3ea" stroke-width="1" stroke-dasharray="4 2"/>')
    for g_, rec in ol_in('tunnel', ext):
        A(f'<path d="{path(g_)}" fill="none" stroke="#c0c8d4" stroke-width="1.5" stroke-dasharray="6 3"/>')
    for g_, rec in ol_in('upentr', ext):
        A(f'<path d="{path(g_)}" fill="none" stroke="#e8f1ff" stroke-width="2.2"/>')
    # real station vents (Seoul Metro table: count/function/location type real, position [추정])
    n_ol_sub = sum(1 for g_, rec in ol_vents if '지하철' in (rec[0] or ''))
    for x, y, v, prec, lmn in (vent_marks if n_ol_sub == 0 else []):
        sx, sy = S(x, y); col = C['intake'] if v['기능'] == '급기' else (C['vent'] if v['기능'] == '배기' else '#c0c8d4')
        A(f'<rect x="{sx - 6:.1f}" y="{sy - 6:.1f}" width="12" height="12" fill="{col}" fill-opacity="0.85" stroke="{"#ffffff" if prec == "landmark" else C["bg"]}" stroke-width="{2 if prec == "landmark" else 1.5}"/>')
    for x, y, v, lmn in line_marks:
        if not ext.contains(Point(x, y)): continue
        sx, sy = S(x, y); col = C['intake'] if v['기능'] == '급기' else (C['vent'] if v['기능'] == '배기' else '#c0c8d4')
        A(f'<rect x="{sx - 4:.1f}" y="{sy - 4:.1f}" width="8" height="8" fill="none" stroke="{col}" stroke-width="2"/>')
    if own_v or line_sec:
        import collections as _c
        fc_ = _c.Counter(v['기능'] for v in own_v); tc_ = _c.Counter(v['기타'] for v in own_v)
        t1 = f'실제 역사 환기구 {len(own_v)}기: ' + ' · '.join(f'{k} {n}' for k, n in fc_.items()) + (' (놓인 곳: ' + ', '.join(f'{k} {n}' for k, n in tc_.items()) + ')' if tc_ else '')
        t2 = '본선 환기구: ' + ('; '.join(f'{k} ' + ' · '.join(f'{f} {n}' for f, n in _c.Counter(fs).items()) for k, fs in line_sec.items()) if line_sec else '없음')
        A(f'<rect x="{gx + 10}" y="{gy + 10}" width="{GS - 80}" height="50" fill="{C["bg"]}" fill-opacity="0.82"/>')
        n_lm = sum(1 for q in vent_marks if q[3] == 'landmark')
        pos_note = (f'판 안 수치지형도 지하환기구 실측: 지하철 {n_ol_sub}·공동구 {ol_cnt.get("공동구환기구", 0)}·일반 {sum(v for k, v in ol_cnt.items() if "지하철" not in k and "공동구" not in k)}' if ol_cnt else '') + (' / ' if ol_cnt and not n_ol_sub else '') + ('' if n_ol_sub else f'흰 테두리 {n_lm}기는 인접건물 좌표(근사), 나머지는 유형별 배치[추정]')
        A(f'<text x="{gx + 18}" y="{gy + 30}" font-size="13" fill="{C["text"]}">{esc(t1[:80])} — {esc(pos_note[:110])}</text>')
        A(f'<text x="{gx + 18}" y="{gy + 50}" font-size="13" fill="{C["sub"]}">{esc(t2[:120])}</text>')
    # vents (OSM real) and setting air points
    for x, y, tg in vents_osm:
        sx, sy = S(x, y); A(f'<rect x="{sx - 5:.1f}" y="{sy - 5:.1f}" width="10" height="10" fill="none" stroke="{C["intake"]}" stroke-width="2"/>')
    if sup_pt:
        sx, sy = S(sup_pt[0], sup_pt[1])
        A(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="13" fill="none" stroke="{C["intake"]}" stroke-width="2.5"/>')
        A(f'<text x="{sx + 18:.1f}" y="{sy + 5:.1f}" font-size="13" fill="{C["intake"]}">급기구(눈 덮인 환기구, {esc(sup[0])} 쪽) [추정 위치]</text>')
    if exh_pt:
        ex_, ey_ = exh_pt[0], exh_pt[1]
        inside = ext.buffer(-30).contains(Point(ex_, ey_))
        if not inside:
            # clip to edge, arrow out
            L = LineString([(cx, cy), (ex_, ey_)]).intersection(ext.buffer(-30))
            ex_, ey_ = L.coords[-1]
        sx, sy = S(ex_, ey_); scx, scy = S(cx, cy)
        A(f'<line x1="{scx:.1f}" y1="{scy:.1f}" x2="{sx:.1f}" y2="{sy:.1f}" stroke="{C["vent"]}" stroke-width="2" stroke-dasharray="6 6" marker-end="url(#arr)"/>')
        A(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="14" fill="none" stroke="{C["vent"]}" stroke-width="3"/>')
        real_sec = [k for k in line_sec if exh[0] in k] if line_sec else []
        real_ex = sum(1 for k in real_sec for f in line_sec[k] if '배기' in f)
        lab = f'배기 출구 → {exh[0]} 쪽 {ev_d} m' + ('' if inside else ' (판 밖)') + (' = 실측 지하철 환기구(수치지형도, S-Map 오픈랩)' if exh_ol is not None else '') + (f' = 실제 본선 배기 환기구 자리({exh_real[2]}, {exh_real[3]} 근처, 랜드마크 근사)' if (exh_real and exh_ol is None) else (f' = 실제 본선 배기 환기구({real_sec[0]}, {real_ex}기)' if real_ex else '')) + ' · 멀리·낮게·식혀서(원칙 9)'
        A(f'<text x="{sx + 18:.1f}" y="{sy - 12:.1f}" font-size="13" fill="{C["vent"]}">{esc(lab)}{"" if exh_ol is not None else " [추정 위치]"}</text>')
    # exits
    for e in exits:
        sx, sy = S(e['x'], e['y']); col = C[e['state']]
        if e['state'] == 'sealed':
            A(f'<path d="M{sx - 9:.1f},{sy - 9:.1f}L{sx + 9:.1f},{sy + 9:.1f}M{sx + 9:.1f},{sy - 9:.1f}L{sx - 9:.1f},{sy + 9:.1f}" stroke="{col}" stroke-width="4"/>')
        elif e['state'] == 'hidden':
            A(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="9" fill="none" stroke="{col}" stroke-width="3" stroke-dasharray="3 3"/>')
        else:
            A(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="9" fill="{col}"/>')
        A(f'<text x="{sx + 11:.1f}" y="{sy - 9:.1f}" font-size="14" font-weight="700" fill="{col}" stroke="{C["bg"]}" stroke-width="3" paint-order="stroke">{esc(e["no"])}</text>')
    # building numbers
    for i, c in enumerate(picked, 1):
        pt = c['g'].representative_point(); sx, sy = S(pt.x, pt.y)
        A(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="11" fill="{C["bg"]}" stroke="{USE_COL[c["cat"]]}" stroke-width="2"/>'
          f'<text x="{sx:.1f}" y="{sy + 5:.1f}" font-size="13" font-weight="700" text-anchor="middle" fill="{USE_COL[c["cat"]]}">{i}</text>')
    # labels for rubble ring + footprint
    scx, scy = S(cx, cy)
    if per:
        sh_ = per['share']; st_ = per['stats']
        lines_ = [f'성곽 둘레 {per["length"]} m · 안쪽 {per["area_m2"] / 10000:.1f} ha · 블록 {per["blocks"]}개 (실측 블록을 붙여 나감, 원 아님)',
                  f'건물 외벽 {sh_["facade"]}% · 담장 {sh_["wall"]}% · 자연 방어선 {sh_["natural"]}% · 메울 틈(잔해 둑) {sh_["gap"]}% · 길목 바리케이드 {per["n_cuts"]}곳 {st_["cut"]} m',
                  f'경계 인원 필요 {per["guards_need"]}명 / 가용 {per["guards_avail"]}명 (2126 인구 15% 성인 ÷ 3교대 × 세력 교리 {per["doctrine"]})']
        A(f'<rect x="{gx + 10}" y="{gy + GS - 120}" width="{GS - 20}" height="66" fill="{C["bg"]}" fill-opacity="0.85"/>')
        for i_, t_ in enumerate(lines_):
            A(f'<text x="{gx + 18}" y="{gy + GS - 100 + i_ * 19}" font-size="13" fill="{C["text"] if i_ else "#ffffff"}">{esc(t_)}</text>')
        if per['guards_need'] > per['guards_avail']:
            A(f'<text x="{gx + 18}" y="{gy + GS - 43}" font-size="13" font-weight="700" fill="#ff5c6c">경계 인원 부족 {per["guards_need"] - per["guards_avail"]}명 — 역 핵심(지하 윤곽·출입구)만으로도 예산 초과, 바리케이드는 교대로 비움</text>')
    elif faction == 'arc':
        n_h = sum(e['state'] == 'hidden' for e in exits); n_u = sum(e['state'] == 'used' for e in exits)
        A(f'<rect x="{gx + 10}" y="{gy + GS - 100}" width="{GS - 20}" height="46" fill="{C["bg"]}" fill-opacity="0.85"/>')
        A(f'<text x="{gx + 18}" y="{gy + GS - 80}" font-size="13" fill="#ffffff">아크 교리: 지상 성곽 없음 — 쓰는 출입구 {n_u}곳·숨긴 출입구 {n_h}곳만 위장, 나머지는 안에서 봉쇄. 지상은 버린 땅(명부 없음)</text>')
        A(f'<text x="{gx + 18}" y="{gy + GS - 61}" font-size="13" fill="{C["text"]}">방어는 지하 깊이와 데이터센터·성소 쪽 후퇴로 한다. 판의 실측 지형·출입구·환기구는 위장 대상 목록</text>')
    else:
        A(f'<circle cx="{scx:.1f}" cy="{scy:.1f}" r="{R * k:.1f}" fill="none" stroke="{C["rubble"]}" stroke-width="1" stroke-dasharray="2 8" opacity="0.6"/>')
        A(f'<text x="{scx:.1f}" y="{scy - R * k - 10:.1f}" font-size="14" fill="{C["rubble"]}" text-anchor="middle" stroke="{C["bg"]}" stroke-width="3" paint-order="stroke">[추정] 지형 자료 없음 — 임시 고리 {R:.0f} m</text>')
    fc = foot_u.centroid if not foot_u.is_empty else Point(cx, cy); fx, fy = S(fc.x, fc.y)
    A(f'<text x="{gx + GS - 16}" y="{gy + GS - 18}" font-size="14" fill="{C["foot"]}" text-anchor="end" stroke="{C["bg"]}" stroke-width="3" paint-order="stroke">흰 점선 = 역 지하 공간의 실제 윤곽(S-Map 모형) · 그 위 지붕·역사는 눈과 잔해로 덮음(원칙 8)</text>')
    # scale bar + north
    A(f'<g transform="translate({gx + 24},{gy + GS - 30})"><rect width="{100 * k:.1f}" height="8" fill="{C["text"]}"/><text y="-6" font-size="13" fill="{C["text"]}">100 m</text></g>')
    A(f'<g transform="translate({gx + GS - 40},{gy + 44})"><path d="M0,-26L9,6L0,0L-9,6Z" fill="{C["text"]}"/><text y="24" font-size="14" text-anchor="middle" fill="{C["text"]}">N</text></g>')
    A('</svg>')
    # ---- underground panel
    A(f'<rect x="{UX - 16}" y="{UY - 40}" width="{UW + 32}" height="{max(colh) - UY + 50}" fill="{C["panel"]}" stroke="{C["frame"]}" stroke-width="2"/>')
    A(f'<text x="{UX}" y="{UY - 12}" font-size="22" font-weight="700" fill="{C["text"]}">② 지하 평면 — S-Map 실내 3D 모형 층별 실측 평면, 같은 축척({sc:.2f} px/m), 북쪽 위</text>')
    A(f'<text x="{UX}" y="{UY + 18}" font-size="14" fill="{C["sub"]}">얕은 층부터. 깊이 = 지면 높이 − 층 바닥 높이(모형 실측). 선로 = 모형의 선로 텍스처로 판별. 셔터 선·개찰구·최후 구역 자리는 [추정].</text>')
    levels = plan.get('levels', [])
    deepest_rail = None
    for g in models:
        for kf, f in g['floors'].items():
            if f['has_rail'] and (deepest_rail is None or f['depth_m'] > deepest_rail[1]['depth_m']): deepest_rail = (g, f, kf)
    shallowest_ug = min((f['depth_m'] for g in models for f in g['floors'].values() if f['depth_m'] > 1.5 and f['walk_m2'] > 40), default=None)
    def level_for(f):
        if f['depth_m'] < 1.5 and not f['has_rail']:
            return next((l for l in levels if l['level'] == '지상'), None)
        want_plat = f['has_rail']
        cand = [l for l in levels if l['level'] != '지상' and (('승강장' in l['name']) == want_plat)]
        if not cand: return None
        return min(cand, key=lambda l: abs(l['depth_m'] - f['depth_m']))
    floor_rows = []
    open_panel = False; fac_found = {'gate': 0, 'vert': 0, 'machine': [], 'qe': 0}
    for (g, kf, f, u0, u1, v0, v1), x, y, wpx, hpx in playout:
        if open_panel: A('</svg>')
        A(f'<svg x="{x:.1f}" y="{y:.1f}" width="{colw:.1f}" height="{hpx:.1f}" viewBox="{x:.1f} {y:.1f} {colw:.1f} {hpx:.1f}" overflow="hidden">'); open_panel = True
        p = g['px_per_m']; m = sc / p
        im = Image.open(f['png']).convert('RGBA').crop((u0 - 6, v0 - 6, u1 + 6, v1 + 6))
        a = np.asarray(im).astype(float); alpha = a[..., 3] > 20
        lum = (a[..., :3] @ [0.3, 0.59, 0.11]) / 255
        tint = np.array([0x22, 0x3c, 0x60], float) / 255
        rgb = tint[None, None, :] * (0.55 + 0.6 * lum[..., None])
        rail = f['rail'][v0 - 6:v1 + 7, u0 - 6:u1 + 7][:alpha.shape[0], :alpha.shape[1]]
        rgb[rail] = np.array([0xc8, 0x9b, 0x4a]) / 255 * (0.5 + 0.5 * lum[rail][:, None])
        edge = ndimage.binary_dilation(alpha) & ~ndimage.binary_erosion(alpha)
        rgb[edge] = np.array([0x8f, 0xb4, 0xd9]) / 255
        outim = np.dstack([np.clip(rgb * 255, 0, 255), alpha * 255]).astype(np.uint8)
        pim = Image.fromarray(outim, 'RGBA')
        tw, th = max(1, int(pim.width * m)), max(1, int(pim.height * m))
        pim = pim.resize((tw, th), Image.LANCZOS)
        lv = level_for(f)
        is_home = deepest_rail and f is deepest_rail[1]
        kind = ('승강장 [추정: 선로 텍스처 없음, 가장 깊은 층]' if f.get('rail_est') else '승강장(선로 있음)') if f['has_rail'] else ('지상 역사' if f['depth_m'] < 1.5 else '대합실·통로')
        head = f'{g["name"]} {kf} · 깊이 {f["depth_m"]:.1f} m · {kind}'
        use = (lv['use'] if lv else '')
        if is_home: use = '세워 둔 전동차 = 가구별 거처(첫 명부), 칸 번호가 주소'
        floor_rows.append({'model': g['name'], 'floor': kf, 'depth_m': f['depth_m'], 'floor_z': f['floor_z'], 'walk_m2': f['walk_m2'],
                           'has_rail': f['has_rail'], 'use_2126': use, 'siege': lv['siege'] if lv else '', 'residents': lv['residents'] if lv else ''})
        frame_col = C['shutter'] if (f['has_rail'] and f['depth_m'] > 1.5) else C['frame']
        A(f'<rect x="{x:.1f}" y="{y:.1f}" width="{colw:.1f}" height="{hpx:.1f}" fill="#0e1a2b" stroke="{frame_col}" stroke-width="{2 if f["has_rail"] else 1}" {"stroke-dasharray=\"10 6\"" if f["has_rail"] and f["depth_m"] > 1.5 else ""}/>')
        A(f'<text x="{x + 10:.1f}" y="{y + 20:.1f}" font-size="15" font-weight="700" fill="{C["text"]}">{esc(head)}</text>')
        A(f'<text x="{x + 10:.1f}" y="{y + 38:.1f}" font-size="12.5" fill="{C["gate"] if not f["has_rail"] else "#ffb0b8"}">{esc(("2126: " + use)[:70])}{" · " + esc(lv["siege"]) if lv else ""}</text>')
        ix, iy = x + 8, y + 46
        A(f'<image x="{ix:.1f}" y="{iy:.1f}" width="{tw}" height="{th}" href="{png_b64(pim)}"/>')
        P = lambda uu, vv: (ix + (uu - (u0 - 6)) * m, iy + (vv - (v0 - 6)) * m)
        # exits on the floor nearest street level
        if abs(f['floor_z'] - g['ground_z']) < 3.5 or (kf in ('1F', 'F01') and not any(abs(ff['floor_z'] - g['ground_z']) < 3.5 for ff in g['floors'].values())):
            x0b, x1b, y0b, y1b = g['bbox_xy']; ox, oy = g['origin5179']
            for e in exits:
                if e['model'] != g['name']: continue
                uu = (e['x'] - ox - x0b) * p; vv = (oy + y1b - e['y']) * p
                if u0 - 6 <= uu <= u1 + 6 and v0 - 6 <= vv <= v1 + 6:
                    qx, qy = P(uu, vv); col = C[e['state']]
                    A(f'<circle cx="{qx:.1f}" cy="{qy:.1f}" r="6" fill="{col if e["state"] == "used" else "none"}" stroke="{col}" stroke-width="2"/>'
                      f'<text x="{qx + 7:.1f}" y="{qy - 5:.1f}" font-size="11" fill="{col}">{esc(e["no"])}</text>')
        # real facilities from the model: gates, stairs/escalators (shutter line), elevators, machine rooms
        inb = lambda uu, vv: u0 - 6 <= uu <= u1 + 6 and v0 - 6 <= vv <= v1 + 6
        gates = [c for c in fac_clusters(g, kf, 'gate') if inb(c[0], c[1])]
        for i_, (uu, vv, n_, _) in enumerate(gates):
            qx, qy = P(uu, vv)
            A(f'<rect x="{qx - 9:.1f}" y="{qy - 3:.1f}" width="18" height="6" fill="{C["gate"]}" stroke="#0e1a2b"/>')
        if gates:
            uu, vv = gates[0][0], gates[0][1]; qx, qy = P(uu, vv)
            A(f'<text x="{qx:.1f}" y="{qy - 10:.1f}" font-size="12" fill="{C["gate"]}" text-anchor="middle" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">개찰구 {len(gates)}무리(모형 실측) = 성문</text>')
            fac_found['gate'] += len(gates)
        vert = [c for r_ in ('stair', 'escalator') for c in fac_clusters(g, kf, r_) if inb(c[0], c[1])]
        for uu, vv, n_, _ in vert:
            qx, qy = P(uu, vv)
            A(f'<path d="M{qx - 10:.1f},{qy}L{qx + 10:.1f},{qy}" stroke="{C["shutter"]}" stroke-width="5"/><path d="M{qx - 10:.1f},{qy - 4}L{qx + 10:.1f},{qy - 4}" stroke="{C["shutter"]}" stroke-width="1.5" stroke-dasharray="3 2"/>')
        if vert and f['depth_m'] > 1.5:
            qx, qy = P(vert[0][0], vert[0][1])
            A(f'<text x="{qx:.1f}" y="{qy + 18:.1f}" font-size="11.5" fill="#ffb0b8" text-anchor="middle" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">셔터 = 계단·에스컬레이터 자리(모형 실측)</text>')
            fac_found['vert'] += len(vert)
        for uu, vv, n_, _ in [c for c in fac_clusters(g, kf, 'elevator') if inb(c[0], c[1])]:
            qx, qy = P(uu, vv); A(f'<rect x="{qx - 4:.1f}" y="{qy - 4:.1f}" width="8" height="8" fill="none" stroke="#b9d3ff" stroke-width="1.5"/>')
        for uu, vv, n_, lab in [c for c in fac_clusters(g, kf, 'machine') if inb(c[0], c[1])]:
            qx, qy = P(uu, vv); fac_found['machine'].append((f['depth_m'], lab or '기계실', g['name'], kf))
            A(f'<rect x="{qx - 30:.1f}" y="{qy - 10:.1f}" width="60" height="20" fill="#0f2a1c" stroke="{C["last"]}" stroke-width="1.5"/>'
              f'<text x="{qx:.1f}" y="{qy + 4:.1f}" font-size="10.5" fill="{C["last"]}" text-anchor="middle">{esc(lab or "기계실")}</text>')
        # concourse label (only when no real gates were found on this floor)
        if not gates and not f['has_rail'] and f['depth_m'] > 1.5 and shallowest_ug is not None and abs(f['depth_m'] - shallowest_ug) < 0.1:
            cy_, cx_ = ndimage.center_of_mass(f['mask'][v0:v1 + 1, u0:u1 + 1]); qx, qy = P(u0 + cx_, v0 + cy_)
            A(f'<text x="{qx:.1f}" y="{qy:.1f}" font-size="13" fill="{C["gate"]}" text-anchor="middle" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">대합실 = 장터 · 개찰구 = 성문(법이 바뀌는 선) [추정 위치]</text>')
        # rails: tunnel ends, air ends, homes
        if f['has_rail']:
            strips = rail_strips(g, f)
            for si, r in enumerate(strips[:4]):
                for end in (r['a'], r['b']):
                    qx, qy = P(end[0], end[1])
                    A(f'<rect x="{qx - 6:.1f}" y="{qy - 6:.1f}" width="12" height="12" fill="{C["barrier"]}" stroke="#0e1a2b"/>')
                if si == 0:
                    qa, qb = P(*r['a']), P(*r['b'])
                    A(f'<text x="{qb[0] + 8:.1f}" y="{qb[1] + 4:.1f}" font-size="11.5" fill="{C["barrier"]}" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">막은 선로 터널(전동차·자재로 차단)</text>')
            # 빠른하차정보: platform stairs/escalators/elevators by car-door number, placed along the measured rail strip
        if f['has_rail'] and strips and not f.get('rail_est'):
            r0 = strips[0]
            for q in QE.get(_norm(name_ko), []):
                fl_ = (q.get('fwkPstnNm') or '').split()[-1:]
                if fl_ != [kf]: continue
                nb = STATIONS.get(_norm(q.get('drtnInfo') or ''))
                m_ = re.match(r'(\d+)-(\d+)', q.get('qckgffVhclDoorNo') or '')
                if not nb or not m_: continue
                nx_, ny_ = T4326_5179.transform(nb['lon'], nb['lat']); dvx, dvy = nx_ - cx, -(ny_ - cy)
                da_ = (r0['a'][0] - r0['c'][0]) * dvx + (r0['a'][1] - r0['c'][1]) * dvy
                front, back = (r0['a'], r0['b']) if da_ > 0 else (r0['b'], r0['a'])
                nc = NCARS.get(re.sub(r'\D', '', q.get('lineNm', ''))[:1], 8); L_ = nc * 20.0; plen = max(r0['len_m'], L_)
                car, door = int(m_.group(1)), int(m_.group(2)); sm = (plen - L_) / 2 + (car - 1) * 20 + (door - 0.5) * 5
                t_ = min(max(sm / plen, 0), 1); uu = front[0] + (back[0] - front[0]) * t_; vv = front[1] + (back[1] - front[1]) * t_
                qx, qy = P(uu, vv); fac = q.get('plfmCmgFac') or ''
                col = C['shutter'] if ('계단' in fac or '에스컬' in fac) else '#b9d3ff'
                A(f'<path d="M{qx:.1f},{qy - 7:.1f}L{qx + 6:.1f},{qy:.1f}L{qx:.1f},{qy + 7:.1f}L{qx - 6:.1f},{qy:.1f}Z" fill="{col}" stroke="#0e1a2b" stroke-width="1"/>')
                fac_found['qe'] += 1
        if is_home and strips and sup and sup[1]:
                r = strips[0]; vx, vy = sup[1][0] - cx, sup[1][1] - cy
                da = (r['a'][0] - r['c'][0]) * vx - (r['a'][1] - r['c'][1]) * vy
                s_end, e_end = (r['a'], r['b']) if da > 0 else (r['b'], r['a'])
                qa, qb = P(*s_end), P(*e_end)
                A(f'<line x1="{qa[0]:.1f}" y1="{qa[1]:.1f}" x2="{qb[0]:.1f}" y2="{qb[1]:.1f}" stroke="{C["intake"]}" stroke-width="2.5" marker-end="url(#arr)" opacity="0.9"/>')
                A(f'<text x="{qa[0]:.1f}" y="{qa[1] - 12:.1f}" font-size="12" fill="{C["intake"]}" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">급기 끝({esc(sup[0])} 쪽) · 역장 집안 20%</text>')
                A(f'<text x="{qb[0]:.1f}" y="{qb[1] + 18:.1f}" font-size="12" fill="{C["vent"]}" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">배기 끝({esc(exh[0]) if exh else "?"} 쪽) · 취사장·격리실 20%(원칙 7)</text>')
                mx, my = (qa[0] + qb[0]) / 2, (qa[1] + qb[1]) / 2
                A(f'<text x="{mx:.1f}" y="{my - 8:.1f}" font-size="12" fill="#b9d3ff" text-anchor="middle" stroke="#0e1a2b" stroke-width="3" paint-order="stroke">세워 둔 전동차 = 가구별 거처(첫 명부 60%)</text>')
                # last zone at the supply end
                lx_ = qa[0] + (qb[0] - qa[0]) * 0.12; ly_ = qa[1] + (qb[1] - qa[1]) * 0.12
                nx_, ny_ = -(qb[1] - qa[1]), (qb[0] - qa[0]); nl = math.hypot(nx_, ny_) or 1
                lx_ += nx_ / nl * 34; ly_ += ny_ / nl * 34
                lx_ = min(max(lx_, x + 45), x + colw - 45); ly_ = min(max(ly_, y + 60), y + hpx - 24)
                A(f'<rect x="{lx_ - 42:.1f}" y="{ly_ - 17:.1f}" width="84" height="34" fill="#0f2a1c" stroke="{C["last"]}" stroke-width="2"/>'
                  f'<text x="{lx_:.1f}" y="{ly_ - 3:.1f}" font-size="10.5" fill="{C["last"]}" text-anchor="middle">최후 구역·집수정</text>'
                  f'<text x="{lx_:.1f}" y="{ly_ + 11:.1f}" font-size="10" fill="{C["last"]}" text-anchor="middle">[추정 위치]</text>')
    if open_panel: A('</svg>')
    if not panels:
        A(f'<text x="{UX}" y="{UY + 70}" font-size="17" font-weight="700" fill="{C["sealed"]}">S-Map 실내지도 없음 — 층 구성은 공식 승강장 자료 + 역 설정표 규칙값</text>')
        gl_ = GAPS.get(name_ko, {}).get('lines', {})
        for j_, (ln, v) in enumerate(gl_.items()):
            A(f'<text x="{UX + 520}" y="{UY + 104 + j_ * 26}" font-size="14" fill="{C["gate"]}">공식: {esc(ln)} 승강장 {esc(v.get("floor") or "")} · 깊이 {v.get("depth_m") if v.get("depth_m") is not None else "?"} m · 대합실 {esc(v.get("concourse") or "?")} · {esc(v.get("platform") or "")} [확인]</text>')
        for i, l in enumerate(plan.get('levels', [])):
            A(f'<text x="{UX}" y="{UY + 104 + i * 26}" font-size="14" fill="{C["text"]}">{esc(l["level"])} · {esc(l["name"])} · 깊이 {l["depth_m"]} m · {esc(l["use"])} · {esc(l["siege"])} [추정]</text>')
    # ---- bottom: buildings table, settlement box, legends, sources
    by = int(max(gy + GS + 40, max(colh) + 20)) + 10
    A(f'<text x="40" y="{by + 10}" font-size="20" font-weight="700" fill="{C["text"]}">주변 건물 설정 (실측 건물 + 2126 쓰임)</text>')
    for i, c in enumerate(picked, 1):
        p = c['p']; nm = p.get('buld_nm') or p.get('pos_bul_nm') or '(이름 없는 건물)'
        code = p.get('bdtyp_cd') or ''; un = USE_NAME.get(code[:2], code)
        row = f'{i:>2}. {nm} — {un}, 지상 {p.get("gro_flo_co") or 0}층·지하 {p.get("und_flo_co") or 0}층 → {c["use"]}'
        col = 0 if i <= 6 else 1; row = row if len(row) <= 66 else row[:65] + '…'
        A(f'<text x="{40 + col * 630}" y="{by + 38 + ((i - 1) % 6) * 22}" font-size="13.5" fill="{USE_COL[c["cat"]]}">{esc(row)}</text>')
    # settlement box
    gl = md_glance(name_ko, faction)
    sx0 = 1300
    A(f'<rect x="{sx0}" y="{by - 12}" width="{W - sx0 - 40}" height="170" fill="#132a22" stroke="{C["last"]}" stroke-width="1.5"/>')
    A(f'<text x="{sx0 + 14}" y="{by + 12}" font-size="18" font-weight="700" fill="{C["last"]}">정착지(정차지) 설정 — {esc(name_ko)} (잠정)</text>')
    rows = [('유형·세력', f'{gl.get("유형", plan.get("type", ""))} · {gl.get("세력", "")}'),
            ('우두머리', gl.get('우두머리', '')), ('도시 지위·장', f'{gl.get("도시 지위", "")} · 장 {gl.get("장", "")}'),
            ('2126 인구', gl.get('2126 인구', '')), ('물/연료/결핵/노출', gl.get('물 / 연료 / 결핵 / 노출', '')),
            ('셔터 선', plan.get('shutter_line', '')),
            ('역무실→역장 집무', ' / '.join(CSO.get(_norm(name_ko), [])[:2]) + ' (고객안전실, OA-22736)' if CSO.get(_norm(name_ko)) else '고객안전실 위치 자료 없음'),
            ('출입구', f'S-Map 실측 {len(exits)}곳 → 쓰는 {sum(e["state"] == "used" for e in exits)} · 숨긴 {sum(e["state"] == "hidden" for e in exits)} · 막은 {sum(e["state"] == "sealed" for e in exits)}')]
    for i, (kx, vx) in enumerate(rows):
        vx = re.sub(r'\[[^\]]*\]', '', str(vx)).strip()
        A(f'<text x="{sx0 + 14}" y="{by + 36 + i * 19}" font-size="13" fill="{C["text"]}"><tspan fill="{C["sub"]}">{esc(kx)}: </tspan>{esc(vx[:120])}</text>')
    # legend
    ly = by + 180
    A(f'<text x="40" y="{ly}" font-size="18" font-weight="700" fill="{C["text"]}">범례</text>')
    items = [('circle', C['used'], '쓰는 출입구'), ('x', C['sealed'], '막은 출입구'), ('dash', C['hidden'], '숨긴 출입구'),
             ('line_facade', '#dce8f5', '성곽: 건물 외벽'), ('line_wall', '#e0c080', '성곽: 담장'), ('line_nat', '#4fa3d9', '성곽: 하천·철도·제방·성토'),
             ('line_gap', C['rubble'], '성곽: 잔해 둑(틈 메움)'), ('bar', C['barrier'], '길목 바리케이드 / 막은 선로 터널'),
             ('dashline', C['foot'], '역 지하 윤곽(S-Map)'), ('ring', C['vent'], '배기 출구'), ('ring', C['intake'], '급기구'),
             ('sq', C['intake'], '환기구(급기 파랑·배기 주황, 서울교통공사 표 + OSM)'), ('dashrect', C['shutter'], '셔터 선 안쪽 층(승강장)'), ('fill', '#c89b4a', '선로(모형 실측)')]
    lx = 40
    for kind, col, lab in items:
        yy = ly + 28
        if kind == 'circle': A(f'<circle cx="{lx + 8}" cy="{yy - 5}" r="8" fill="{col}"/>')
        elif kind == 'x': A(f'<path d="M{lx},{yy - 13}L{lx + 16},{yy + 3}M{lx + 16},{yy - 13}L{lx},{yy + 3}" stroke="{col}" stroke-width="4"/>')
        elif kind == 'dash': A(f'<circle cx="{lx + 8}" cy="{yy - 5}" r="8" fill="none" stroke="{col}" stroke-width="3" stroke-dasharray="3 3"/>')
        elif kind == 'hatch': A(f'<rect x="{lx}" y="{yy - 14}" width="22" height="16" fill="url(#hatch)"/>')
        elif kind.startswith('line_'):
            da_ = {'line_nat': ' stroke-dasharray="7 4"', 'line_gap': ' stroke-dasharray="3 3"'}.get(kind, '')
            A(f'<line x1="{lx}" y1="{yy - 6}" x2="{lx + 24}" y2="{yy - 6}" stroke="{col}" stroke-width="{6 if kind == "line_gap" else 3.5}"{da_}/>')
        elif kind == 'bar': A(f'<rect x="{lx}" y="{yy - 10}" width="22" height="8" fill="{col}"/>')
        elif kind == 'dashline': A(f'<line x1="{lx}" y1="{yy - 5}" x2="{lx + 24}" y2="{yy - 5}" stroke="{col}" stroke-width="2" stroke-dasharray="6 4"/>')
        elif kind == 'ring': A(f'<circle cx="{lx + 8}" cy="{yy - 5}" r="8" fill="none" stroke="{col}" stroke-width="3"/>')
        elif kind == 'sq': A(f'<rect x="{lx}" y="{yy - 13}" width="14" height="14" fill="none" stroke="{col}" stroke-width="2"/>')
        elif kind == 'dashrect': A(f'<rect x="{lx}" y="{yy - 13}" width="22" height="14" fill="none" stroke="{col}" stroke-width="2" stroke-dasharray="5 3"/>')
        elif kind == 'fill': A(f'<rect x="{lx}" y="{yy - 13}" width="22" height="14" fill="{col}"/>')
        A(f'<text x="{lx + 30}" y="{yy}" font-size="14" fill="{C["text"]}">{esc(lab)}</text>')
        lx += 36 + len(lab) * 14.5
        if lx > W - 300: lx = 40; ly += 30
    ux = 40; uy = ly + 60
    A(f'<text x="{ux}" y="{uy}" font-size="14" fill="{C["sub"]}">건물 색(2126 쓰임): </text>')
    ux += 140
    for kx, col in USE_COL.items():
        A(f'<rect x="{ux}" y="{uy - 13}" width="16" height="16" fill="{col}" fill-opacity="0.4" stroke="{col}"/><text x="{ux + 22}" y="{uy}" font-size="14" fill="{col}">{esc({"숨김": "숨긴 출입구·지하 창고", "거처": "거처", "장터": "장터·난전", "망루": "망루·감시", "작업": "작업장·창고", "공공": "관아·기도처·학교·진료", "빈": "빈 건물(땔감)"}[kx])}</text>')
        ux += 210
    # data sources legend
    sy0 = uy + 34
    A(f'<text x="40" y="{sy0}" font-size="18" font-weight="700" fill="{C["text"]}">데이터 출처와 등급</text>')
    dmed = exit_osm_check(models)
    src = [
        ('A 실측', f'S-Map 실내 3D 모형(서울시, smap.seoul.go.kr getSubwayData.do 카탈로그 + 모형 glb): 층 구분·층 평면·선로·바닥 높이. 모형 {len(models)}개: {", ".join(g["name"] for g in models)}'),
        ('A 실측', 'S-Map 출입구 표식(subwayDatas.js locationAndExitData): 출입구 번호·위치. 위치 보정(relocation) 적용. ' + dmed),
        ('A 실측', '서울시 공간정보(S-Map geoserver WFS, EPSG:5186→5179): 도로명주소 건물(윤곽·이름·용도코드·지상/지하 층수), 토지피복(도로·철도·수역·녹지), 도로명 도로 중심선'),
        ('A 실측', '깊이: ' + ('S-Map 모형 없음' if not models else '') + '; '.join(f'{g["name"]} 지면 = {g["depth_src"]}' for g in models)),
        ('A 실측', '공식 승강장 층·깊이: ' + ('; '.join(official_line(ln, v) for ln, v in GAPS.get(name_ko, {}).get('lines', {}).items()) or '역 설정표(stations.json)의 값 사용') + (' · 출입구 좌표: 행정안전부 전국 지하철 출구 레이어(2026-04-30)' if any(e['model'] == 'MOIS' for e in exits) else '') + (' · 출입구 좌표: 수치지형도 지하도입구(S-Map 오픈랩)' if any(e['model'] == 'OPENLAB' for e in exits) else '')),
        ('A 실측', 'S-Map 오픈랩 공개 레이어(수치지형도, EPSG:5186): 지하환기구(지하철·공동구·일반, 주황·보라·회색 실측 윤곽), 지하도(파란 점선), 지하도입구(흰 선), 터널 — openlab.eseoul.go.kr qgisplugin SHP'),
        ('B 공개 협업', 'OpenStreetMap(Geofabrik south-korea 2026-11-14 추출): 하천·물길·실제 환기구(man_made=ventilation_shaft), 출입구 번호 대조용'),
        ('C 설정', '2126 설정: 출입구 상태(쓰는/숨긴/막은: 역별 개수 × 건물 거리·도로 노출 순위), 성곽(실측 블록·건물 외벽·담장·하천·철도·제방·성토를 이어 붙이고 경계 인원 예산 안에서 범위 결정, 길목=수치지형도 도로면과 만나는 자리), 망루(등고선 해발+층수 최고점), 건물 쓰임(실제 용도·층수 규칙), 층 쓰임(station-floorplans.json)'),
        ('A 실측', f'승강장 계단·에스컬레이터·승강기: 빠른하차정보(서울교통공사 OpenAPI OA-22749) {fac_found["qe"]}곳을 칸-문 번호로 실측 선로 위에 환산(마름모, 열차 진행 방향은 이웃 역 좌표, 편성 칸수×20 m)' if fac_found['qe'] else '승강장 칸-문 위치: 자료 없음(서울교통공사 1~8호선만) 또는 층 이름 불일치'),
        ('A 실측', f'개찰구 대수: {GATES[_norm(name_ko)]}대(서울교통공사_1-8호선 개집표기 시설물 현황 2024-03-25, OA-13294)' if _norm(name_ko) in GATES else '개찰구 대수: 공개 자료 없음(서울교통공사 1~8호선만 수록)'),
        ('A 실측', f'역 안 시설(모형 텍스처·재질 이름·글자 판독으로 판별): 개찰구 {fac_found["gate"]}무리, 계단·에스컬레이터 {fac_found["vert"]}곳(셔터 선 자리), 기계실류 {len(fac_found["machine"])}곳' + (' — ' + ', '.join(sorted(set(m[1] for m in fac_found['machine']))) if fac_found['machine'] else '')),
        ('[추정]', '급기구·배기 출구 위치(이웃 역 방향 × 설정 거리), 모형에서 시설을 찾지 못한 층의 개찰구·셔터 선·최후 구역 자리, 방화셔터 실제 위치(공개 자료 없음). 용도코드 두 자리 대분류 이름도 추정'),
        ('생략', '빈 패널로 뺀 층: ' + (', '.join(skipped) if skipped else '없음')),
        ('A 실측', f'환기구: {VENT_SRC} — 개수·급기/배기·놓인 곳·높이 실측. 좌표: 2013~2017판 인접건물 이름을 지오코딩한 근사 위치(전체 50.6%, 건물 기준이라 수십 m 오차 가능), 나머지는 유형별 배치 [추정]' + ('' if (own_v or line_sec) else ' (이 역은 자료 없음: 1~8호선만 수록)')),
        ('이용', '공개 자료 이용 허용(소유자 결정 2026-11-15). 출처 표기 유지: 서울시 S-Map, 서울 열린데이터광장, 서울교통공사, OpenStreetMap 기여자(ODbL).'),
    ]
    for i, (g_, t_) in enumerate(src):
        A(f'<text x="40" y="{sy0 + 26 + i * 21}" font-size="13.5" fill="{C["text"]}"><tspan fill="{C["gate"]}" font-weight="700">{esc(g_)}</tspan>  {esc(t_[:260])}</text>')
    A(f'<text x="40" y="{sy0 + 26 + len(src) * 21 + 10}" font-size="13" fill="{C["sub"]}">세력별 변형: 정부=셔터 선·명부 가장 엄격, 지상 노출 최소 / 자유도시=지상 공장 겸용으로 지붕·작업장 노출, 차단물이 철판·컨테이너 / 아크=명부 없음, 데이터센터가 최후 구역이자 성소. 성곽·해자·성문은 설계 렌즈 표현이며 본문에는 실제 역 공간 이름을 쓴다.</text>')
    H2 = sy0 + 26 + len(src) * 21 + 40
    maps = official_maps(name_ko)
    if maps:
        A(f'<text x="40" y="{H2 + 10}" font-size="20" font-weight="700" fill="{C["text"]}">공식 역 안내도 (실측 보조 자료: 개찰구·계단·승강기·비상대피로 확인용)</text>')
        mx = 40; mh = 640
        for fpath, cap in maps:
            im = Image.open(fpath).convert('RGB'); w_ = int(im.width * mh / im.height)
            if mx + w_ > W - 40: break
            im = im.resize((w_, mh), Image.LANCZOS); b = io.BytesIO(); im.save(b, 'JPEG', quality=82)
            A(f'<image x="{mx}" y="{H2 + 26}" width="{w_}" height="{mh}" href="data:image/jpeg;base64,{base64.b64encode(b.getvalue()).decode()}"/>')
            A(f'<text x="{mx}" y="{H2 + 26 + mh + 20}" font-size="13" fill="{C["sub"]}">{esc(cap)} — {esc(os.path.basename(fpath))}</text>')
            mx += w_ + 20
        H2 += mh + 70
    A('</svg>')
    svg = '\n'.join(out).replace(f'height="{H}" viewBox="0 0 {W} {H}"', f'height="{H2}" viewBox="0 0 {W} {H2}"', 1)
    svg = svg.replace(f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/><rect width="{W}" height="{H}" fill="url(#grid)"/>',
                      f'<rect width="{W}" height="{H2}" fill="{C["bg"]}"/><rect width="{W}" height="{H2}" fill="url(#grid)"/>', 1)
    od = os.path.join(ROOT, 'out', name_ko); os.makedirs(od, exist_ok=True)
    open(os.path.join(od, f'{name_ko}.svg'), 'w', encoding='utf-8').write(svg)
    data = {'station': name_ko, 'faction': faction, 'center5179': [cx, cy], 'half_m': half, 'models': [g['name'] for g in models],
            'floors': floor_rows, 'exits': [{k: e[k] for k in ('no', 'x', 'y', 'model', 'state')} for e in exits],
            'rubble_ring_m': R, 'rubble_cuts': len(rubble_parts), 'barriers': len(barriers),
            'perimeter': ({k_: v_ for k_, v_ in per.items() if k_ not in ('poly', 'segments', 'cuts', 'watch')} | {'watch': ({'name': per['watch'][1].get('명칭') or per['watch'][1].get('주기'), 'floors': per['watch'][1].get('층수'), 'top_m': round(per['watch'][2])} if per.get('watch') else None)}) if per else None,
            'buildings': [{'no': i, 'name': c['p'].get('buld_nm') or c['p'].get('pos_bul_nm'), 'bdtyp_cd': c['p'].get('bdtyp_cd'),
                           'gro': c['p'].get('gro_flo_co'), 'und': c['p'].get('und_flo_co'), 'use_2126': c['use'],
                           'centroid5179': list(c['gfull'].centroid.coords[0])} for i, c in enumerate(picked, 1)],
            'air': {'supply': sup[0] if sup else None, 'exhaust': exh[0] if exh else None, 'exhaust_m': ev_d,
                    'osm_vents_in_view': len(vents_osm)},
            'counts': {'buildings': len(blds), 'landcover': {k: len(v) for k, v in lc.items()}, 'water_osm': len(water_osm), 'waterways': len(ways_osm)}}
    json.dump(data, open(os.path.join(od, 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    to_png(os.path.join(od, f'{name_ko}.svg'), os.path.join(od, f'{name_ko}.png'), W, H2)
    return data

def exit_osm_check(models):
    O = [(e, *T4326_5179.transform(e['lon'], e['lat'])) for e in OSM['entrances']]
    ds = []
    for g in models:
        for k, (x, y, z) in g['exits'].items():
            same = [math.dist((x, y), (ox, oy)) for e, ox, oy in O if e.get('ref') == k and math.dist((x, y), (ox, oy)) < 300]
            if same: ds.append(min(same))
    n = sum(len(g['exits']) for g in models)
    if not ds: return f'OSM 출입구 번호와 대조 불가({n}곳)'
    ds.sort(); return f'OSM 출입구 번호 대조: {len(ds)}/{n}곳 일치, 위치 차 중앙값 {ds[len(ds) // 2]:.0f} m'

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
def to_png(svg, png, w, h):
    import resvg_py
    data = resvg_py.svg_to_bytes(svg_path=svg, font_family='Malgun Gothic', sans_serif_family='Malgun Gothic',
                                 font_dirs=[r'C:\Windows\Fonts'], resources_dir=os.path.dirname(svg))
    open(png, 'wb').write(bytes(data))

if __name__ == '__main__':
    for nm in sys.argv[1:]:
        d = compose(nm)
        print(nm, 'models', d['models'], 'exits', len(d['exits']), 'bld', d['counts']['buildings'], 'rubble', d['rubble_cuts'])
