"""Download S-Map indoor subway models (glb) listed by getSubwayData.do. Usage: fetch_models.py [name-substring ...]"""
import json, os, sys, urllib.request, urllib.parse, time
ROOT = os.path.join(os.path.dirname(__file__), '..')
L = json.load(open(os.path.join(ROOT, 'smap/subway.json'), encoding='utf-8'))['subwayDataList']
os.makedirs(os.path.join(ROOT, 'smap/models'), exist_ok=True)
want = sys.argv[1:]
# Prefer local S-Map copies already collected in the seoul-dengoku repo (line 2 smap-source) before any remote download.
import glob, shutil
LOCAL = {os.path.basename(p): p for p in glob.glob(r'E:/git/seoul-dengoku/ART-ASSETS/station-interiors/smap-source/*/*.glb')}
for m in L:
    if want and not any(w in m['name'] for w in want): continue
    out = os.path.join(ROOT, 'smap/models', m['filename'])
    if os.path.exists(out) and os.path.getsize(out) > 1000: continue
    if m['filename'] in LOCAL:
        shutil.copyfile(LOCAL[m['filename']], out); print('local', m['name']); continue
    url = 'https://smap1.eseoul.go.kr:5432/contents/models/' + urllib.parse.quote(m['filename'], safe="=&()'")
    for a in range(3):
        try:
            import ssl; ctx = ssl._create_unverified_context()
            data = urllib.request.urlopen(urllib.request.Request(url, headers={'Referer': 'https://smap.seoul.go.kr/', 'User-Agent': 'Mozilla/5.0'}), timeout=180, context=ctx).read()
            open(out, 'wb').write(data); print('ok', m['name'], len(data)); break
        except Exception as e:
            print('retry', m['name'], e); time.sleep(5)
    else:
        print('FAIL', m['name'])
