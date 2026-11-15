"""Classify glb material textures into roles (rail, psd) by thumbnail similarity to reference textures.
Writes <out>.json {material_name: role}. Usage: glb_textures.py model.glb out.json [--dump dir]"""
import json, struct, sys, io, os
import numpy as np
from PIL import Image
HERE = os.path.dirname(__file__)
def load(glb):
    b = open(glb, 'rb').read(); L = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + L]); bin0 = 20 + L + 8
    return b, j, bin0
def img_bytes(b, j, bin0, im):
    bv = j['bufferViews'][im['bufferView']]; o = bin0 + bv.get('byteOffset', 0)
    return b[o:o + bv['byteLength']]
def feat(data, n=24):
    im = Image.open(io.BytesIO(data)).convert('L').resize((n, n), Image.BILINEAR)
    a = np.asarray(im, float); a = a - a.mean(); s = np.linalg.norm(a)
    return a / s if s > 1e-6 else a
def color(data):
    im = Image.open(io.BytesIO(data)).convert('RGB').resize((8, 8)); return np.asarray(im, float).reshape(-1, 3).mean(0)
REFS = {}
for f in os.listdir(os.path.join(HERE, 'refs')) if os.path.isdir(os.path.join(HERE, 'refs')) else []:
    if not f.lower().endswith(('.jpg', '.jpeg', '.png')) or not f.startswith('rail_'): continue  # rail only; other roles: facility_roles.py
    role = 'rail'; REFS.setdefault(role, []).append(feat(open(os.path.join(HERE, 'refs', f), 'rb').read()))
def classify(glb):
    b, j, bin0 = load(glb)
    imgrole = {}; scores = {}
    for i, im in enumerate(j.get('images', [])):
        try: data = img_bytes(b, j, bin0, im); f = feat(data)
        except Exception: continue
        best = (None, 0)
        for role, fs in REFS.items():
            for r in fs:
                for rr in (r, r.T):
                    sc = float((f * rr).sum())
                    if sc > best[1]: best = (role, sc)
        scores[i] = best
        if best[1] > 0.6: imgrole[i] = best[0]
    out = {}
    for mi, m in enumerate(j.get('materials', [])):
        pbr = m.get('pbrMetallicRoughness', {}); t = pbr.get('baseColorTexture')
        if t is None: continue
        src = j['textures'][t['index']].get('source')
        if src in imgrole: out[m.get('name', str(mi))] = imgrole[src]
    return out, scores, j
if __name__ == '__main__':
    out, scores, j = classify(sys.argv[1])
    json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
    import collections; print(collections.Counter(out.values()))
    if '--dump' in sys.argv:
        d = sys.argv[sys.argv.index('--dump') + 1]; os.makedirs(d, exist_ok=True)
        b, jj, bin0 = load(sys.argv[1])
        top = sorted(scores.items(), key=lambda kv: -kv[1][1])[:24]
        for i, (role, sc) in top:
            open(os.path.join(d, f'{sc:.2f}_{role}_{jj["images"][i]["name"]}.img'), 'wb').write(img_bytes(b, jj, bin0, jj['images'][i]))
