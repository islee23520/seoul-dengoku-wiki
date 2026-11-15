"""Force re-render (facility polygons) for slice k of n of all stations in the floorplan table."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from render_station import smap_names, render
from compose import PLANS
k, n = int(sys.argv[1]), int(sys.argv[2])
for nm in sorted(PLANS)[k::n]:
    for m in smap_names(nm):
        try: render(m, force=True); print('ok', m, flush=True)
        except Exception as e: print('FAIL', m, str(e)[-200:], flush=True)
