"""Sample real elevation values (m) from S-Map WMS layer seoul:seoul_1m via GetFeatureInfo (GRAY_INDEX)
on a regular grid. WCS GetCoverage is rejected by the proxy (400) and WMS GeoTIFF output is a styled 8-bit
image, so per-point GetFeatureInfo is the only way to get true values.
usage: dem_sample.py minx miny maxx maxy step out.csv"""
import sys, json, time, csv, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import smap

minx, miny, maxx, maxy, step = map(float, sys.argv[1:6])
out = sys.argv[6]
rows = []
y = miny
while y <= maxy:
    x = minx
    while x <= maxx:
        b = f'{x-0.5},{y-0.5},{x+0.5},{y+0.5}'
        p = ('/geoserver/wms?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=seoul:seoul_1m&query_layers=seoul:seoul_1m'
             f'&srs=EPSG:5186&bbox={b}&width=1&height=1&x=0&y=0&info_format=application/json')
        try:
            v = json.loads(smap.proxy(p))['features'][0]['properties']['GRAY_INDEX']
        except Exception as e:
            v = ''
        rows.append((round(x, 2), round(y, 2), v))
        time.sleep(0.3)
        x += step
    y += step
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['x5186', 'y5186', 'elev_m'])
    w.writerows(rows)
print(len(rows), 'points ->', out)
