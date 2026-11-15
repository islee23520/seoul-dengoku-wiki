import sys, json, time, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import smap
sys.stdout.reconfigure(encoding='utf-8')
L = json.load(open('../raw/layers.json', encoding='utf-8'))['wfs']
out = {}
for n, _, _ in L:
    if n.startswith('seoul:climate_pmv'): continue
    try:
        x = smap.proxy(f'/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&resultType=hits&typeName={n}&srsName=EPSG:5186&BBOX=203100,551150,203450,551480,EPSG:5186', timeout=60).decode('utf-8', 'replace')
        m = re.search(r'numberOfFeatures="(\d+)"', x)
        a = re.search(r'numberOfFeatures="(\d+)"', smap.proxy(f'/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&resultType=hits&typeName={n}', timeout=90).decode('utf-8', 'replace'))
        out[n] = (int(m.group(1)) if m else x[:80], int(a.group(1)) if a else None)
    except Exception as e:
        out[n] = ('ERR ' + str(e)[:60], None)
    print(n, out[n], flush=True); time.sleep(0.8)
json.dump(out, open('../raw/hits.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
