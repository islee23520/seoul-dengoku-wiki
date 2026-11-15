"""Extract Seoul features from the Geofabrik South Korea PBF into geojson-ish JSON (WGS84):
subway/train entrances (ref), ventilation shafts, water areas, waterways."""
import osmium, json, sys
from shapely.geometry import shape, mapping
BB = (126.76, 37.42, 127.19, 37.71)  # lon/lat bbox around Seoul
inb = lambda lon, lat: BB[0] <= lon <= BB[2] and BB[1] <= lat <= BB[3]
out = {'entrances': [], 'vents': [], 'water': [], 'waterways': []}
gf = osmium.geom.GeoJSONFactory()
class H(osmium.SimpleHandler):
    def node(self, n):
        t = n.tags
        if not n.location.valid() or not inb(n.location.lon, n.location.lat): return
        rw = t.get('railway'); mm = t.get('man_made')
        if rw in ('subway_entrance', 'train_station_entrance') or (t.get('entrance') and t.get('ref') and t.get('subway')):
            out['entrances'].append({'id': n.id, 'lon': n.location.lon, 'lat': n.location.lat, 'ref': t.get('ref'), 'name': t.get('name'), 'kind': rw})
        if mm in ('ventilation_shaft', 'air_shaft', 'chimney') or t.get('ventilation') or 'vent' in (t.get('description') or '').lower():
            out['vents'].append({'id': n.id, 'lon': n.location.lon, 'lat': n.location.lat, 'tags': dict(t)})
    def way(self, w):
        t = w.tags
        if t.get('waterway') in ('river', 'stream', 'canal') :
            try:
                g = json.loads(gf.create_linestring(w))
                if any(inb(*c) for c in g['coordinates']): out['waterways'].append({'id': w.id, 'name': t.get('name'), 'kind': t.get('waterway'), 'geom': g})
            except Exception: pass
        if t.get('man_made') in ('ventilation_shaft', 'air_shaft'):
            try:
                g = json.loads(gf.create_linestring(w)); c = g['coordinates'][0]
                if inb(*c): out['vents'].append({'id': w.id, 'lon': c[0], 'lat': c[1], 'tags': dict(t)})
            except Exception: pass
    def area(self, a):
        t = a.tags
        if t.get('natural') == 'water' or t.get('waterway') == 'riverbank' or t.get('water'):
            try:
                g = json.loads(gf.create_multipolygon(a))
                c = g['coordinates'][0][0][0]
                if inb(*c) or shape(g).intersects(shape({'type': 'Polygon', 'coordinates': [[(BB[0], BB[1]), (BB[2], BB[1]), (BB[2], BB[3]), (BB[0], BB[3]), (BB[0], BB[1])]]})):
                    out['water'].append({'id': a.id, 'name': t.get('name'), 'geom': g})
            except Exception: pass
H().apply_file(sys.argv[1], locations=True, idx='flex_mem')
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
print({k: len(v) for k, v in out.items()})
