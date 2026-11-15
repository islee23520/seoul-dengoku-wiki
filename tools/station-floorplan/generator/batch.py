"""Batch: every map station -> fetch S-Map models (local seoul-dengoku copies first), render floors, compose sheet.
Writes out/_batch/status.json (ok / fail with reason) so missing data is listed with a cause."""
import json, os, sys, traceback, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from compose import compose, STATIONS, PLANS
from render_station import smap_names, ROOT
od = os.path.join(ROOT, 'out', '_batch'); os.makedirs(od, exist_ok=True)
# usage: batch.py [--status file] [--only name ...] [skip names ...]
args = sys.argv[1:]; sp = os.path.join(od, 'status.json'); only = None
if '--status' in args:
    i = args.index('--status'); sp = args[i + 1]; del args[i:i + 2]
if '--only' in args:
    i = args.index('--only'); only = args[i + 1:]; args = args[:i]
status = json.load(open(sp, encoding='utf-8')) if os.path.exists(sp) else {}
skip = set(args)
for n in (only or STATIONS):
    if n in skip or status.get(n, {}).get('state') in ('ok', 'skip'): continue
    sm = smap_names(n)
    if n not in PLANS:
        status[n] = {'state': 'skip', 'smap_models': sm, 'reason': '역 설정표(station-floorplans.json)에 없음: 정착지로 세지 않는 지도 항목'}
        json.dump(status, open(sp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); continue
    try:
        d = compose(n)
        status[n] = {'state': 'ok', 'smap_models': sm, 'floors': len(d['floors']), 'exits': len(d['exits']),
                     'note': '' if sm else 'S-Map 실내지도 없음: 지상만 실측, 지하는 [추정]'}
    except Exception as e:
        status[n] = {'state': 'fail', 'smap_models': sm, 'reason': f'{type(e).__name__}: {str(e)[-300:]}'}
        traceback.print_exc()
    json.dump(status, open(sp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(n, status[n]['state'], flush=True)
print('done', sum(v['state'] == 'ok' for v in status.values()), '/', len(status))
