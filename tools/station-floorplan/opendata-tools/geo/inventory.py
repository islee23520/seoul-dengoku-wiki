"""Sequential, throttled S-Map geoserver probe for candidate layers in the 왕십리 bbox (EPSG:5186).
Saves one sample FeatureCollection per layer under geo/samples/ and a summary in geo/raw/inventory.json."""
import sys, json, time, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import smap

sys.stdout.reconfigure(encoding='utf-8')
G = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
B = (203100, 551150, 203450, 551480)
names = sys.argv[1:]
outf = os.path.join(G, 'raw', 'inventory.json')
res = json.load(open(outf, encoding='utf-8')) if os.path.exists(outf) else {}
for n in names:
    if n in res and res[n].get('err') is None:
        continue
    r = dict(count=None, geom=[], fields=[], err=None, sample_from='bbox')
    try:
        d = smap.wfs(n, bbox=B, maxf=2000)
        fs = d.get('features', [])
        if not fs:
            time.sleep(1.5)
            d = smap.wfs(n, maxf=3)
            r['sample_from'] = 'anywhere(maxFeatures=3)'
        r['count'] = len(fs)
        fs2 = d.get('features', [])
        r['geom'] = sorted({(f.get('geometry') or {}).get('type') for f in fs2} - {None})
        r['fields'] = list(fs2[0]['properties'].keys()) if fs2 else []
        r['example'] = fs2[0]['properties'] if fs2 else {}
        r['crs'] = (d.get('crs') or {}).get('properties', {}).get('name')
        if fs2:
            json.dump(d, open(os.path.join(G, 'samples', n.replace(':', '__') + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    except Exception as e:
        r['err'] = str(e)[:200]
    res[n] = r
    print(n, r['count'], r['geom'], r['err'] or '', ','.join(r['fields'])[:200], flush=True)
    json.dump(res, open(outf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    time.sleep(1.5)
