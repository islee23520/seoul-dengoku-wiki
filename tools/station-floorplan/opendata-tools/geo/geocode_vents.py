"""Geocode Seoul Metro vents (OA-12926, lines 1-8) using the 인접건물 landmark text from the
2013/2015/2017 OA-12926 workbooks, constrained to a corridor around the vent's 구간 stations.
Geocoders: S-Map proxies (Naver local search, 도로명주소 juso), S-Map subway_exitno layer."""
import csv, json, re, sys, time, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import smap
from pyproj import Transformer
from shapely.geometry import shape, Point, LineString
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
G = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
T84 = Transformer.from_crs(4326, 5186, always_xy=True)
T79 = Transformer.from_crs(5179, 5186, always_xy=True)
TO84 = Transformer.from_crs(5186, 4326, always_xy=True)
CACHE_F = os.path.join(G, 'raw', 'search', 'geocode_cache.json')
cache = json.load(open(CACHE_F, encoding='utf-8')) if os.path.exists(CACHE_F) else {}
NET = '--offline' not in sys.argv


def cached(key, fn):
    if key in cache:
        return cache[key]
    if not NET:
        return None
    v = None
    for i in range(4):
        try:
            v = fn()
            break
        except ValueError as e:  # non-JSON answer (rejected query); do not retry
            print('  bad', key, e, flush=True)
            break
        except Exception as e:
            print('  retry', key, e, flush=True)
            time.sleep(30 * (i + 1))
    cache[key] = v
    time.sleep(0.4)
    if len(cache) % 25 == 0:
        json.dump(cache, open(CACHE_F, 'w', encoding='utf-8'), ensure_ascii=False)
    return v


def nstn(s):
    s = re.sub(r'\(.*?\)', '', s or '').replace(' ', '')
    return re.sub(r'역$', '', s)


st = {}
for f in json.load(open(os.path.join(G, 'raw', 'subway_station_all.json'), encoding='utf-8'))['features']:
    p = f['properties']
    nm = nstn(p.get('station_na') or p.get('sub_name1'))
    st.setdefault(nm, []).append(shape(f['geometry']).centroid)
stc = {k: Point(sum(q.x for q in v) / len(v), sum(q.y for q in v) / len(v)) for k, v in st.items()}
ALIAS = {'신천': '잠실새내', '영구청': '영등포구청', '영시장': '영등포시장', '터미널': '고속터미널', '고속버스터미널': '고속터미널',
         '장승백이': '장승배기', '이수': '총신대입구', '동대문운동장': '동대문역사문화공원', '신설': '신설동', '기지': '', '광명': '광명사거리',
         '태릉': '태릉입구', '효창': '효창공원앞', '올림픽': '올림픽공원', '신대방': '신대방삼거리', '건대': '건대입구',
         '개농': '개롱', '대공원': '서울대공원', '서울대': '서울대입구', '둔촌': '둔촌동', '가리봉': '가산디지털단지',
         '하남검단산': '하남검단산', '검단산': '하남검단산', '종단부': '', '기지내신출고선': '', '단대': '단대오거리'}


def anchor(tok):
    t = nstn(tok)
    t = re.sub(r'정거장$', '', t)
    t = re.sub(r'역$', '', re.sub(r'\(BN\d+\)', '', t))
    if t in ALIAS:
        t = ALIAS[t]
    if not t:
        return None
    if t in stc:
        return stc[t]
    c = [k for k in stc if k.startswith(t) or t.startswith(k)]
    if len(c) == 1:
        return stc[c[0]]
    # outside S-Map coverage (Hanam, Seongnam, Guri, Namyangju): station POI via Naver local
    d = cached('N|' + t + '역', lambda: smap.naver_local(t + '역'))
    for it in (d or {}).get('localList', []) or []:
        if '지하철' in (it.get('category') or ''):
            x, y = T84.transform(int(it['mapx']) / 1e7, int(it['mapy']) / 1e7)
            stc[t] = Point(x, y)
            return stc[t]
    return None


exits = {}
for f in json.load(open(os.path.join(G, 'raw', 'subway_exitno_all.json'), encoding='utf-8'))['features']:
    p = f['properties']
    exits.setdefault((nstn(p['subname']), str(p['enternum']).strip()), []).append(shape(f['geometry']))


def corridor(section):
    toks = [t for t in re.split(r'[~∼\-]', section or '') if t.strip()]
    pts = [a for a in (anchor(t) for t in toks) if a is not None]
    if not pts:
        return None, toks
    if len(pts) > 1 and pts[0].distance(pts[-1]) > 1:
        return LineString(pts), toks
    return pts[0], toks


SUFFIX = re.compile(r'(앞|옆|건너편|맞은편|맞은 편|부근|사이|측|뒤|후면|인근|화단|보도|녹지|중앙분리대|버스정류장|정류장|쪽|방향|주변|내|정문|후문)$')


def clean(lm):
    s = re.sub(r'\(.*?\)', ' ', lm).replace('@', '아파트 ').replace('#', '')
    s = re.split(r'[/,]', s)[0]
    s = re.sub(r'[%=<>&\'"]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    for _ in range(3):
        s = SUFFIX.sub('', s).strip()
    return s


def naver(q):
    d = cached('N|' + q, lambda: smap.naver_local(q))
    out = []
    for it in (d or {}).get('localList', []) or []:
        try:
            x, y = T84.transform(int(it['mapx']) / 1e7, int(it['mapy']) / 1e7)
            out.append((Point(x, y), re.sub('<.*?>', '', it['title']), 'naver_local'))
        except Exception:
            pass
    return out


def juso(q):
    d = cached('J|' + q, lambda: smap.juso(q))
    out = []
    for j in (((d or {}).get('results') or {}).get('juso') or [])[:3]:
        c = cached('JC|' + j['bdMgtSn'], lambda: smap.juso_coord(j))
        try:
            jj = c['results']['juso'][0]
            x, y = T79.transform(float(jj['entX']), float(jj['entY']))
            out.append((Point(x, y), j.get('bdNm') or j['roadAddr'], 'juso'))
        except Exception:
            pass
    return out


MAXD = 450.0


def best(cands, corr):
    ok = [(corr.distance(p), p, t, s) for p, t, s in cands if corr.distance(p) <= MAXD]
    return min(ok, key=lambda r: r[0]) if ok else None


def compat(a, b):
    ta = {nstn(t)[:2] for t in re.split(r'[~∼\-]', a) if t.strip()}
    tb = {nstn(t)[:2] for t in re.split(r'[~∼\-]', b) if t.strip()}
    return bool(ta & tb)


vents = list(csv.DictReader(open(os.path.join(G, '..', 'vent_utf8.csv'), encoding='utf-8')))
LM = {}
for x in csv.DictReader(open(os.path.join(G, 'vent_landmarks.csv'), encoding='utf-8-sig')):
    n = int(x['no'])
    if n >= 1000 and n // 1000 == int(x['line']):
        n %= 1000
    LM[(x['line'], n)] = x

rows = []
for i, v in enumerate(vents):
    m = re.match(r'(\d+)', v['번호'] or '')
    rec = dict(line=v['호선'], no=v['번호'], section=v['구간'], use=v['용도'], func=v['기능'], loc=v['기타'],
               height_m=v['높이(m)'], form=v['구조물형태'], landmark='', landmark_src='', x5186='', y5186='', lon='', lat='',
               precision='none', matched_name='', geocoder='', dist_to_corridor_m='')
    corr, toks = corridor(v['구간'])
    lmrow = LM.get((v['호선'], int(m.group(1)))) if (m and v['호선']) else None
    if lmrow and compat(lmrow['section'], v['구간']):
        rec['landmark'], rec['landmark_src'] = lmrow['landmark'], lmrow['src']
    elif lmrow:
        rec['landmark_src'] = 'section_mismatch:' + lmrow['section']
    hit = None
    lm = rec['landmark']
    if lm and corr is not None:
        em = re.search(r'(\d+)\s*번?\s*(출입구|출구)', lm)
        if em:
            for t in toks:
                key = nstn(ALIAS.get(nstn(t)) or t)
                for g in exits.get((key, em.group(1)), []):
                    d = corr.distance(g)
                    if d <= MAXD and (hit is None or d < hit[0]):
                        hit = (d, g, f'{key} {em.group(1)}번 출구', 'smap_subway_exitno')
        q = clean(lm)
        if not hit and q:
            hit = best(naver(q), corr)
        if not hit and q:
            hit = best(naver(f'{nstn(toks[0])}역 {q}'), corr)
        if not hit and len(q) >= 2:
            hit = best(juso(q), corr)
    p = None
    if hit:
        d, p, name, src = hit
        rec.update(precision='landmark', matched_name=name, geocoder=src, dist_to_corridor_m=round(d, 1))
    elif corr is not None:
        if isinstance(corr, LineString):
            p = corr.interpolate(0.5, normalized=True)
            rec.update(precision='section_midpoint', geocoder='smap_subway_station')
        else:
            p = corr
            rec.update(precision='station_centroid', geocoder='smap_subway_station')
    if p is not None:
        rec['x5186'], rec['y5186'] = round(p.x, 2), round(p.y, 2)
        lo, la = TO84.transform(p.x, p.y)
        rec['lon'], rec['lat'] = round(lo, 7), round(la, 7)
    rows.append(rec)
    if i % 100 == 0:
        print(i, rec['line'], rec['no'], rec['section'], rec['landmark'], rec['precision'], rec['matched_name'], flush=True)

json.dump(cache, open(CACHE_F, 'w', encoding='utf-8'), ensure_ascii=False)
with open(os.path.join(G, 'vent_coords.csv'), 'w', newline='', encoding='utf-8-sig') as fo:
    w = csv.DictWriter(fo, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
print(Counter(r['precision'] for r in rows), Counter(r['geocoder'] for r in rows))
