"""Recompose sheets for a slice of stations (renders are cached). Usage: recompose.py <k> <n>  -> slice k of n."""
import json, glob, os, sys, traceback
sys.path.insert(0, os.path.dirname(__file__))
from compose import compose, PLANS
k, n = int(sys.argv[1]), int(sys.argv[2])
names = sorted(PLANS)[k::n]
res = {}
for nm in names:
    try:
        d = compose(nm); res[nm] = {'state': 'ok', 'models': d['models'], 'floors': len(d['floors']), 'exits': len(d['exits'])}
    except Exception as e:
        res[nm] = {'state': 'fail', 'reason': f'{type(e).__name__}: {str(e)[-300:]}'}; traceback.print_exc()
    print(nm, res[nm]['state'], flush=True)
json.dump(res, open(f'out/_batch/recompose-{k}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
