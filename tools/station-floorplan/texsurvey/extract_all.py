"""Extract every embedded image from all models, dedupe by md5, record index (model,image idx,name,material names)."""
import json,struct,os,glob,hashlib
M='../smap/models/'; O='allimg'; os.makedirs(O,exist_ok=True)
idx={}; occ=[]
for p in sorted(glob.glob(M+'*.glb')):
    if p.endswith('.clean.glb'): continue
    b=open(p,'rb').read(); L=struct.unpack('<I',b[12:16])[0]; j=json.loads(b[20:20+L]); b0=20+L+8
    mats={}
    for m in j.get('materials',[]):
        t=m.get('pbrMetallicRoughness',{}).get('baseColorTexture')
        if t: mats.setdefault(j['textures'][t['index']].get('source'),[]).append(m.get('name',''))
    for i,im in enumerate(j.get('images',[])):
        if 'bufferView' not in im: continue
        bv=j['bufferViews'][im['bufferView']]; o=b0+bv.get('byteOffset',0); d=b[o:o+bv['byteLength']]
        h=hashlib.md5(d).hexdigest()[:16]
        if h not in idx:
            ext='png' if im.get('mimeType')=='image/png' else 'jpg'
            fn=f'{O}/{h}.{ext}'; open(fn,'wb').write(d); idx[h]=fn
        occ.append([os.path.basename(p),i,im.get('name',''),mats.get(i,[]),h])
json.dump({'files':idx,'occ':occ},open('allimg.json','w'))
print(len(idx),len(occ))
