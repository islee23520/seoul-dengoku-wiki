"""Read the terrain around every station from real data and classify the setting a fortification has to answer.

Inputs per station (EPSG:5179): geo_cache/topo/<name>.json (1:1000 수치지형도 via S-Map OpenLab: contours, buildings with
floors/use, walls, rivers, rail land, cut/fill banks, levees, road surfaces, underpasses), render/<model>/geo.json (S-Map indoor
floors: walkable area and depth), out/<name>/data.json (exits), station-floorplans.json (2126 population, faction).
Writes out/_terrain/terrain.json and terrain.csv.

Archetypes (a station can carry several tags; the primary one is the strongest score):
  ridge      산성형     relief >= 20 m within 300 m or steep slope share: walls follow the ridge, the high ground is the keep
  river      수변형     river surface within 250 m: the river is the moat on one side, water gates
  rail       철도성토형 rail land / long cut-fill banks: embankment as a ready-made rampart
  tower      고층블록형 dense high-rise blocks: building faces are the wall, towers are keeps (urban fortress)
  estate     단지형     walled apartment estates: the estate wall is the bailey (fortified estate / 圍屋)
  warren     골목형     dense low-rise grain, many small buildings: dead-end lanes as defence (medina)
  plain      평지형     open ground and wide roads: everything must be built (평지성, planned square fort)
"""
import json, os, sys, glob, math, csv
import numpy as np
from shapely.geometry import shape, Point, box
from shapely.ops import unary_union
from scipy.interpolate import griddata

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..'))
sys.path.insert(0, HERE)
SET = r'E:/git/seoul-dengoku-wiki/.omo/handoff/v4/settlement'
STATIONS = {s['name_ko']: s for s in json.load(open(f'{SET}/data/stations.json', encoding='utf-8'))['stations']}
PLANS = {s['name_ko']: s for s in json.load(open(f'{SET}/data/station-floorplans.json', encoding='utf-8'))['stations']}
from pyproj import Transformer
T = Transformer.from_crs(4326, 5179, always_xy=True)


def gj(items):
    out = []
    for it in items:
        try: out.append((shape(it['g']), it['p']))
        except Exception: pass
    return out


def read(name):
    st = STATIONS[name]; cx, cy = T.transform(st['lon'], st['lat'])
    dj = os.path.join(ROOT, 'out', name, 'data.json')
    d = json.load(open(dj, encoding='utf-8')) if os.path.exists(dj) else {}
    if d.get('center5179'): cx, cy = d['center5179']
    R = 300.0; area = Point(cx, cy).buffer(R); A = area.area
    topo = json.load(open(os.path.join(ROOT, 'geo_cache/topo', f'{name}.json'), encoding='utf-8'))
    m = {'name': name, 'faction': st['faction_id'][0], 'pop_2126': PLANS.get(name, {}).get('pop_2126'), 'cx': cx, 'cy': cy}
    # relief from real elevation points: 3D building ground (S-Map footprint_w_minmax) + 1 m DEM samples
    ep = os.path.join(ROOT, 'geo_cache/elev', f'{name}.json')
    if os.path.exists(ep):
        E = json.load(open(ep, encoding='utf-8'))
        P = [(x, y, g) for x, y, g, r, a in E['bld'] if g is not None and (x - cx) ** 2 + (y - cy) ** 2 <= R * R]
        P += [(x, y, z) for x, y, z in E['dem'] if z is not None and (x - cx) ** 2 + (y - cy) ** 2 <= (R + 10) ** 2]
        if len(P) > 10:
            zs = np.array([p[2] for p in P], float)
            lo, hi = np.percentile(zs, 2), np.percentile(zs, 98)      # trim stray points
            m['elev_min'], m['elev_max'], m['relief_m'] = round(float(lo), 1), round(float(hi), 1), round(float(hi - lo), 1)
            near = [p[2] for p in P if (p[0] - cx) ** 2 + (p[1] - cy) ** 2 < 60 ** 2]
            m['station_elev'] = round(float(np.median(near)), 1) if near else round(float(np.median(zs)), 1)
            # steepness: elevation change between neighbouring points (m per 100 m)
            arr = np.array(P, float); idx = np.random.default_rng(0).choice(len(arr), min(len(arr), 400), replace=False); sub = arr[idx]
            dx = sub[:, None, 0] - sub[None, :, 0]; dy = sub[:, None, 1] - sub[None, :, 1]; dd = np.hypot(dx, dy)
            mask = (dd > 20) & (dd < 80); grad = np.abs(sub[:, None, 2] - sub[None, :, 2])[mask] / dd[mask] * 100
            m['slope_p90_pct'] = round(float(np.percentile(grad, 90)), 1) if grad.size else 0
            m['steep_share'] = round(float((grad > 12).mean()), 3) if grad.size else 0
            k = int(np.argmax(zs)); hx, hy = P[k][0], P[k][1]
            m['high_dir_deg'] = round(math.degrees(math.atan2(hx - cx, hy - cy)) % 360); m['high_dist_m'] = round(math.hypot(hx - cx, hy - cy))
            roofs = [(r, x, y, a) for x, y, g, r, a in E['bld'] if r is not None and (x - cx) ** 2 + (y - cy) ** 2 <= R * R and a > 80]
            if roofs:
                r, x, y, a = max(roofs); m['roof_max_m'] = round(r, 1); m['roof_max_xy'] = [x, y]
    # water, rail, banks
    river = unary_union([g for g, _ in gj(topo.get('river', []))]) if topo.get('river') else None
    m['river_m2_300'] = round(river.intersection(area).area) if river is not None else 0
    m['river_dist_m'] = round(river.distance(Point(cx, cy))) if river is not None and not river.is_empty else None
    rail = unary_union([g for g, _ in gj(topo.get('rail', []))]) if topo.get('rail') else None
    m['rail_m2_300'] = round(rail.intersection(area).area) if rail is not None else 0
    m['cutfill_m_300'] = round(sum(g.intersection(area).length for g, _ in gj(topo.get('cutfill', []))))
    m['levee_m_300'] = round(sum(g.intersection(area).length for g, _ in gj(topo.get('levee', []))))
    m['wall_m_300'] = round(sum(g.intersection(area).length for g, _ in gj(topo.get('wall', []))))
    road = unary_union([g for g, _ in gj(topo.get('road', []))]) if topo.get('road') else None
    m['road_share'] = round(road.intersection(area).area / A, 3) if road is not None else 0
    # buildings
    B = [(g, p) for g, p in gj(topo.get('building', [])) if g.intersects(area)]
    if B:
        foot = [g.intersection(area).area for g, _ in B]; fl = [int(p.get('층수') or 1) for _, p in B]
        m['bld_count'] = len(B); m['bld_cover'] = round(sum(foot) / A, 3)
        m['floors_mean_w'] = round(sum(a * f for a, f in zip(foot, fl)) / max(1, sum(foot)), 1)
        m['highrise_share'] = round(sum(a for a, f in zip(foot, fl) if f >= 10) / max(1, sum(foot)), 3)
        apt = [(g, p) for g, p in B if ('공동주택' in (p.get('용도') or '') or '아파트' in (p.get('종류') or '')) and int(p.get('층수') or 1) >= 5]
        m['apt_count'] = len(apt); m['apt_cover'] = round(sum(g.intersection(area).area for g, _ in apt) / A, 3)
        m['small_bld_share'] = round(sum(a for a, f in zip(foot, fl) if a < 200 and f <= 4) / max(1, sum(foot)), 3)
        m['floor_area_m2'] = round(sum(a * f for a, f in zip(foot, fl)))
    else:
        for k in ('bld_count', 'bld_cover', 'floors_mean_w', 'highrise_share', 'apt_count', 'apt_cover', 'small_bld_share', 'floor_area_m2'): m[k] = 0
    # underground (S-Map indoor) and exits
    ug, deep = 0, 0
    for mn in d.get('models', []):
        gp = os.path.join(ROOT, 'render', mn, 'geo.json')
        if os.path.exists(gp):
            g = json.load(open(gp, encoding='utf-8'))
            for f in g['floors'].values():
                if f['depth_m'] > 1.5: ug += f['walk_m2']; deep = max(deep, f['depth_m'])
    m['ug_floor_m2'] = round(ug); m['depth_max_m'] = deep; m['exits'] = len(d.get('exits', []))
    m['underpass_m2'] = round(sum(g.intersection(area).area for g, _ in gj(topo.get('underpass', [])))) if topo.get('underpass') else 0
    # scores -> tags
    sc = {
        'ridge': min(1, (m.get('relief_m') or 0) / 30) * 0.6 + min(1, (m.get('steep_share') or 0) / 0.25) * 0.4,
        'river': min(1, m['river_m2_300'] / 15000) if m['river_m2_300'] else 0,
        'rail': min(1, m['rail_m2_300'] / 20000) * 0.7 + min(1, m['cutfill_m_300'] / 800) * 0.3,
        'tower': min(1, m['highrise_share'] / 0.5) * 0.6 + min(1, m['bld_cover'] / 0.35) * 0.4,
        'estate': min(1, m['apt_cover'] / 0.06) * 0.7 + min(1, m['wall_m_300'] / 4000) * 0.3,
        'warren': min(1, m['small_bld_share'] / 0.35) * 0.5 + min(1, m['bld_cover'] / 0.4) * 0.3 + max(0, 1 - m['floors_mean_w'] / 6) * 0.2,
        'plain': max(0, 1 - m['bld_cover'] / 0.25) * 0.5 + min(1, m['road_share'] / 0.3) * 0.5,
    }
    m['scores'] = {k: round(v, 2) for k, v in sc.items()}
    m['tags'] = [k for k, v in sorted(sc.items(), key=lambda kv: -kv[1]) if v >= 0.45]
    m['primary'] = max(sc, key=sc.get)
    return m


if __name__ == '__main__':
    names = sys.argv[1:] or sorted(PLANS)
    od = os.path.join(ROOT, 'out', '_terrain'); os.makedirs(od, exist_ok=True)
    res = []
    for n in names:
        try: res.append(read(n)); print(n, res[-1]['primary'], res[-1]['tags'], flush=True)
        except Exception as e: print('FAIL', n, e, flush=True)
    if len(names) > 20:
        json.dump(res, open(os.path.join(od, 'terrain.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        keys = [k for k in res[0] if k not in ('scores', 'tags')]
        with open(os.path.join(od, 'terrain.csv'), 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f); w.writerow(keys + ['tags'] + [f's_{k}' for k in res[0]['scores']])
            for r in res: w.writerow([r.get(k) for k in keys] + ['|'.join(r['tags'])] + list(r['scores'].values()))
        import collections; print(collections.Counter(r['primary'] for r in res))
