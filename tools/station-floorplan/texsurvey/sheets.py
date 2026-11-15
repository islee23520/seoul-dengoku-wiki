"""Extract images from sample models, dedupe, and write contact sheets with labels."""
import json,struct,io,os,sys,hashlib
from PIL import Image, ImageDraw
M='../smap/models/'
SAMPLE=sys.argv[1].split(',')
OUT='sheets'; os.makedirs(OUT,exist_ok=True); os.makedirs('imgs',exist_ok=True)
def load(p):
    b=open(p,'rb').read(); L=struct.unpack('<I',b[12:16])[0]; return b,json.loads(b[20:20+L]),20+L+8
seen={}; items=[]
for si,s in enumerate(SAMPLE):
    b,j,b0=load(M+s)
    matof={}
    for m in j.get('materials',[]):
        t=m.get('pbrMetallicRoughness',{}).get('baseColorTexture')
        if t: matof.setdefault(j['textures'][t['index']].get('source'),m.get('name',''))
    for i,im in enumerate(j.get('images',[])):
        bv=j['bufferViews'][im['bufferView']]; o=b0+bv.get('byteOffset',0); d=b[o:o+bv['byteLength']]
        h=hashlib.md5(d).hexdigest()[:10]
        if h in seen: continue
        ext='png' if im.get('mimeType')=='image/png' else 'jpg'
        fn=f'imgs/m{si:02d}_{i:03d}.{ext}'; open(fn,'wb').write(d); seen[h]=fn
        items.append((fn,f'm{si:02d}_{i} {im.get("name","")[:10]}|{matof.get(i,"")[:10]}'))
json.dump(items,open('items.json','w'))
T=176; C=8; R=6
for k in range(0,len(items),C*R):
    sh=Image.new('RGB',(C*T,R*(T+14)),'white'); dr=ImageDraw.Draw(sh)
    for n,(fn,lab) in enumerate(items[k:k+C*R]):
        try: im=Image.open(fn).convert('RGB'); w,h=im.size; im.thumbnail((T,T))
        except Exception: continue
        x=(n%C)*T; y=(n//C)*(T+14); sh.paste(im,(x,y)); dr.text((x+2,y+T),f'{lab} {w}x{h}',fill='black')
    sh.save(f'{OUT}/s{k//(C*R):03d}.png')
print(len(items), (len(items)+C*R-1)//(C*R))
