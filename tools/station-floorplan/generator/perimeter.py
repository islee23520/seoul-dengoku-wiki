"""Defensive perimeter (성곽) for a station settlement, built from several real datasets at once.

Datasets combined (all EPSG:5179 after clipping):
  1:1000 수치지형도 via S-Map OpenLab (geo_cache/topo/<station>.json):
     도로면 road surfaces, 철도경계 rail land, 실폭하천 rivers, 건물 (footprint + 층수 + 용도), 담장 walls (with material),
     성절토 cut/fill banks, 제방 levees (with height), 교량/입체교차부 bridges and interchanges, 방호울타리 guardrails,
     등고선 contours (elevation), 계단 stairs, 육교 overpasses
  서울시 토지피복 (seoul_area), 도로명주소 건물 (from compose), S-Map indoor footprint and exits, 2126 settlement table.

Method (no fixed shapes):
  1. Blocks = land left after removing road surfaces, rail land and water: the real city blocks.
  2. Core = station underground footprint + exits kept in use/hidden + intake vent. Blocks touching the core are taken first.
  3. Greedy growth across streets: each candidate block is scored by what it adds (floor area, apartment forts for the
     free city, high points for watch) against the change in perimeter guard cost. Growth stops at the guard budget.
  4. Perimeter = closed union of chosen blocks (interior streets absorbed). Every 2 m of the boundary is classified:
     facade (building wall), wall (담장), natural (water, rail land, levee, cut/fill bank, elevated road edge),
     cut (a road surface crosses the line -> barricade), gap (open ground -> rubble bank).
  5. Guard cost per post: cut 1 per 4 m of road width, gap 1 per 40 m, facade 1 per 80 m, wall 1 per 60 m, natural 1 per 150 m.
     Available guards = 2126 population x 15 % able adults / 3 watches, scaled by faction doctrine.
"""
import json, math, os
from shapely.geometry import shape, Point, LineString, Polygon, MultiPolygon, box
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.prepared import prep

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
COST = {'cut': 1 / 2.5, 'gap': 1 / 20.0, 'facade': 1 / 60.0, 'wall': 1 / 50.0, 'natural': 1 / 120.0}
AREA_PER_HEAD = 8.0  # m2 of held surface per resident (yards, stores, watch, workshops), scaled by doctrine
DOCTRINE = {'government': 0.7, 'free-city': 1.2, 'arc': 0.3}


def load_topo(name):
    p = os.path.join(ROOT, 'geo_cache/topo', f'{name}.json')
    if not os.path.exists(p): return {}
    d = json.load(open(p, encoding='utf-8'))
    out = {}
    for k, items in d.items():
        gs = []
        for it in items:
            try:
                g = shape(it['g'])
                if not g.is_valid: g = g.buffer(0)
                gs.append((g, it['p']))
            except Exception: pass
        out[k] = gs
    return out


def _u(items, buf=0):
    gs = [g.buffer(buf) if buf else g for g, _ in items]
    return unary_union(gs) if gs else Polygon()


def elevation_at(contours, pt):
    """nearest contour value (m above sea level) — 1:1000 contours, 1 m/5 m interval"""
    best = None
    for g, p in contours:
        d = g.distance(pt)
        if best is None or d < best[0]: best = (d, p.get('등고수치'))
    return best[1] if best else None


def build(name, ext, core, faction, pop, landcover_water, apartments=None):
    T = load_topo(name)
    if not T: return None
    roads = _u(T.get('road', [])).intersection(ext.buffer(80))
    rail = _u(T.get('rail', []))
    water = unary_union([_u(T.get('river', [])), landcover_water]) if landcover_water is not None else _u(T.get('river', []))
    blocks_area = ext.buffer(60).difference(unary_union([roads, rail, water]).buffer(0.5))
    raw = [b for b in getattr(blocks_area, 'geoms', [blocks_area]) if b.area > 150]
    blocks = []
    for b in raw:   # superblocks (alleys are not road surfaces) are split into 60 m cells so part of a block can be held
        if b.area <= 2000: blocks.append(b); continue
        x0, y0, x1, y1 = b.bounds
        for gx_ in range(int(x0 // 60), int(x1 // 60) + 1):
            for gy_ in range(int(y0 // 60), int(y1 // 60) + 1):
                c_ = b.intersection(box(gx_ * 60, gy_ * 60, gx_ * 60 + 60, gy_ * 60 + 60))
                for q in getattr(c_, 'geoms', [c_]):
                    if q.geom_type == 'Polygon' and q.area > 120: blocks.append(q)
    bld = [(g, p) for g, p in T.get('building', []) if g.area > 8]
    bld_tree = STRtree([g for g, _ in bld]) if bld else None
    def block_value(b):
        if bld_tree is None: return b.area * 0.2, 0, 0
        fl = 0.0; apt = 0; hi = 0
        for i in bld_tree.query(b):
            g, p = bld[i]
            if not g.intersects(b): continue
            n = int(p.get('층수') or 1); fl += g.area * max(n, 1)
            if ('공동주택' in (p.get('용도') or '') or '아파트' in (p.get('종류') or '')) and n >= 5: apt += 1
            hi = max(hi, n)
        return fl, apt, hi
    # boundary classification layers
    walls = _u(T.get('wall', []), 1.2)
    natural = unary_union([water.buffer(3), rail.buffer(3), _u(T.get('levee', []), 3), _u(T.get('cutfill', []), 3),
                           _u(T.get('bridge', []), 2), _u(T.get('interchange', []), 2)])
    bld_u = unary_union([g for g, _ in bld]).buffer(2.5) if bld else Polygon()
    pr_roads, pr_nat, pr_bld, pr_wall = prep(roads), prep(natural), prep(bld_u), prep(walls)
    def classify(perim, step=2.0):
        segs = []; L = perim.length
        if L == 0: return segs
        n = max(4, int(L / step)); prev = None
        for k in range(n):
            pt = perim.interpolate(k / n, normalized=True)
            if pr_roads.contains(pt): c = 'cut'
            elif pr_nat.contains(pt): c = 'natural'
            elif pr_bld.contains(pt): c = 'facade'
            elif pr_wall.contains(pt): c = 'wall'
            else: c = 'gap'
            if prev and prev[0] == c: prev[1].append((pt.x, pt.y))
            else:
                prev = [c, [(pt.x, pt.y)]]; segs.append(prev)
        return [(c, LineString(p) if len(p) > 1 else Point(p[0])) for c, p in segs]
    def cost_of(poly):
        ring = poly.boundary
        tot = 0.0; cuts = 0
        for c, g in classify(ring, 5.0):
            ln = g.length if hasattr(g, 'length') else 0
            if c == 'cut': tot += max(2, math.ceil(max(ln, 3) * COST['cut'])); cuts += 1
            else: tot += ln * COST[c]
        return tot, cuts
    def closed(polys):
        u = unary_union(polys)
        return u.buffer(14, join_style=2).buffer(-14, join_style=2).intersection(ext.buffer(-4))
    guards = max(6.0, (pop or 500) * 0.15 / 3 * DOCTRINE.get(faction, 1.0))
    area_cap = max(8000.0, (pop or 500) * AREA_PER_HEAD * DOCTRINE.get(faction, 1.0)) + core.area
    chosen = [b for b in blocks if b.intersects(core.buffer(10))]
    if not chosen:
        chosen = sorted(blocks, key=lambda b: b.distance(core))[:2]
    cur = closed(chosen + [core.buffer(6)]); cur_cost, _ = cost_of(cur) if not cur.is_empty else (0, 0)
    rest = [b for b in blocks if b not in chosen]
    steps = 0
    while rest and steps < 40:
        steps += 1
        cand = [b for b in rest if b.distance(cur) < 38 and b.centroid.distance(core.centroid) < 280]
        if not cand: break
        best = None
        for b in cand:
            fl, apt, hi = block_value(b)
            val = fl + (apt * 4000 if faction == 'free-city' else 0) + (hi >= 12) * 1500
            if faction == 'arc': val *= 0.3
            nxt = closed(chosen + [core.buffer(6), b])
            if nxt.is_empty or nxt.geom_type == 'MultiPolygon': continue
            if nxt.area > area_cap: continue
            c2, _ = cost_of(nxt)
            if c2 > guards: continue
            score = val / max(1.0, c2 - cur_cost + 1.0)
            if best is None or score > best[0]: best = (score, b, nxt, c2)
        if best is None: break
        _, b, cur, cur_cost = best; chosen.append(b); rest.remove(b)
    segs = classify(cur.boundary)
    stat = {k: 0.0 for k in COST}; cuts = []
    for c, g in segs:
        ln = g.length if hasattr(g, 'length') else 0; stat[c] += ln
        if c == 'cut': cuts.append((g, ln))
    L = sum(stat.values()) or 1
    # watch post: highest point on/inside the line (ground elevation from contours + building floors x 3.3 m)
    watch = None
    contours = T.get('contour', [])
    if bld:
        inside = [(g, p) for g, p in bld if g.intersects(cur.buffer(5))]
        if inside:
            def height(gp):
                g, p = gp; e = elevation_at(contours, g.centroid) if contours else 0
                return (e or 0) + int(p.get('층수') or 1) * 3.3
            g, p = max(inside, key=height); watch = (g, p, height((g, p)))
    used_cost, ncut = cost_of(cur)
    return {'poly': cur, 'segments': segs, 'cuts': cuts, 'stats': {k: round(v) for k, v in stat.items()},
            'share': {k: round(100 * v / L) for k, v in stat.items()}, 'length': round(L), 'blocks': len(chosen),
            'area_m2': round(cur.area), 'area_cap_m2': round(area_cap), 'guards_need': round(used_cost), 'guards_avail': round(guards), 'n_cuts': len(cuts),
            'watch': watch, 'doctrine': DOCTRINE.get(faction, 1.0)}
