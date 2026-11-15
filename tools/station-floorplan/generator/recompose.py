"""Recompose sheets for a slice of stations (renders are cached).
Usage: recompose.py <k> <n> [--max M] [--since EPOCH]  -> slice k of n; skip stations whose data.json is newer than --since;
stop after M stations (lets an agent loop in short calls)."""
import json, os, sys, time, traceback
sys.path.insert(0, os.path.dirname(__file__))
from compose import compose, PLANS, ROOT
k, n = int(sys.argv[1]), int(sys.argv[2])
mx = int(sys.argv[sys.argv.index('--max') + 1]) if '--max' in sys.argv else 10 ** 6
since = float(sys.argv[sys.argv.index('--since') + 1]) if '--since' in sys.argv else 0
names = sorted(PLANS)[k::n]; done = 0; left = 0
for nm in names:
    dj = os.path.join(ROOT, 'out', nm, 'data.json')
    if since and os.path.exists(dj) and os.path.getmtime(dj) > since: continue
    if done >= mx: left += 1; continue
    try:
        compose(nm); print(nm, 'ok', flush=True)
    except Exception as e:
        print(nm, 'fail', f'{type(e).__name__}: {str(e)[-200:]}', flush=True); traceback.print_exc()
    done += 1
print(f'SLICE {k}/{n} done_now={done} remaining={left}', flush=True)
