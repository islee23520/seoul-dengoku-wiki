"""Fetch Seoul official geodata through the S-Map geoserver proxy (EPSG:5186).
Layers: seoul:tl_spbd_buld_2 (도로명주소 건물), seoul:seoul_area (토지피복), seoul:tl_sprd_manage (도로명 도로 중심선)."""
import urllib.request, urllib.parse, json, os, sys, time
CACHE = os.path.join(os.path.dirname(__file__), '..', 'geo_cache')
def wfs(typ, bbox):
    os.makedirs(CACHE, exist_ok=True)
    key = os.path.join(CACHE, f"{typ.split(':')[1]}_{'_'.join(str(int(b)) for b in bbox)}.json")
    if os.path.exists(key):
        return json.load(open(key, encoding='utf-8'))
    q = (f"/geoserver/seoul/wfs?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application/json"
         f"&typeName={typ}&CQL_FILTER=bbox(geom,{','.join(str(int(b)) for b in bbox)})")
    url = "https://smap.seoul.go.kr/imageProxy.do?svc=2D&param=" + urllib.parse.quote(q, safe='/?=&:,')
    for a in range(4):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'Referer': 'https://smap.seoul.go.kr/', 'User-Agent': 'Mozilla/5.0'}), timeout=90).read()
            j = json.loads(r); break
        except Exception as e:
            if a == 3: raise
            time.sleep(3 * (a + 1))
    json.dump(j, open(key, 'w', encoding='utf-8'), ensure_ascii=False)
    return j
if __name__ == '__main__':
    import collections
    j = wfs('seoul:seoul_area', [203100, 551150, 203450, 551480])
    print(collections.Counter((f['properties']['l1_name'], f['properties']['l2_name'], f['properties']['l3_name']) for f in j['features']).most_common(40))
