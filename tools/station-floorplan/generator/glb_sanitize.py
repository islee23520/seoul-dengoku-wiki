"""Drop texture references that point past the textures array (some S-Map glbs carry them). Returns a path to a clean glb."""
import json, struct, os
def walk(o, n):
    bad = 0
    if isinstance(o, dict):
        for k in list(o):
            v = o[k]
            if isinstance(v, dict) and 'index' in v and k.endswith('Texture') and isinstance(v['index'], int) and v['index'] >= n:
                del o[k]; bad += 1
            else:
                bad += walk(v, n)
    elif isinstance(o, list):
        for v in o: bad += walk(v, n)
    return bad
def sanitize(glb, out):
    b = open(glb, 'rb').read(); L = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + L]); n = len(j.get('textures', []))
    bad = walk(j.get('materials', []), n)
    if not bad: return glb, 0
    js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    rest = b[20 + L:]
    body = struct.pack('<I', len(js)) + b'JSON' + js + rest
    open(out, 'wb').write(b[:8] + struct.pack('<I', 12 + len(body)) + body)
    return out, bad
