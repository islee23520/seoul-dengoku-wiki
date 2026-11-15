"""Download Seoul Metro station-facility OpenAPI services (OA-22724..22749) in full.
Key is read from ~/.omo/agent/keys/seoul_openapi.key and never printed."""
import json, os, glob, time, urllib.request
KEY = open(os.path.expanduser('~/.omo/agent/keys/seoul_openapi.key')).read().strip()
HERE = os.path.dirname(os.path.abspath(__file__)); FAC = os.path.join(HERE, '..', 'facilities')
out = os.path.join(FAC, 'seoul_openapi'); os.makedirs(out, exist_ok=True)
summary = {}
for f in sorted(glob.glob(os.path.join(FAC, 'raw/seoul_openapi_samples/OA-*_*.json'))):
    oa, svc = os.path.basename(f)[:-5].split('_', 1)
    rows, start, step = [], 1, 1000
    while True:
        url = f'http://openapi.seoul.go.kr:8088/{KEY}/json/{svc}/{start}/{start + step - 1}/'
        for a in range(3):
            try: d = json.loads(urllib.request.urlopen(url, timeout=60).read().decode('utf-8')); break
            except Exception as e: err = str(e).replace(KEY, '<key>'); time.sleep(3)
        else: summary[svc] = {'oa': oa, 'error': err}; break
        body = d.get('response', {}).get('body', {}); items = body.get('items', {})
        it = items.get('item', []) if isinstance(items, dict) else []
        if isinstance(it, dict): it = [it]
        rows += it
        total = int(body.get('totalCount') or 0)
        if not it or len(rows) >= total or len(it) < step: break
        start += step; time.sleep(0.3)
    json.dump(rows, open(os.path.join(out, f'{oa}_{svc}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    summary.setdefault(svc, {'oa': oa, 'rows': len(rows)})
    print(oa, svc, len(rows), flush=True)
json.dump(summary, open(os.path.join(out, '_summary.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
