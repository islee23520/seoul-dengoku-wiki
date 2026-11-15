"""Score every unique image against refs (glb_textures.py method: 24x24 gray corr, also transposed ref).
Report per role: #models with >=1 hit at several thresholds; write hit sheets for spot check."""
import json,os,sys,io,collections,random
import numpy as np
from PIL import Image, ImageDraw
REF='../tools/refs'; ROLES=['gate','escalator','stair','elevator','shutter','psd','machine','sign_exit','guide_map','rail']
def role_of(f):
    for r in sorted(ROLES,key=len,reverse=True):
        if f.startswith(r+'_'): return r
def feat_img(im):
    a=np.asarray(im.convert('L').resize((24,24),Image.BILINEAR),float); a=a-a.mean(); s=np.linalg.norm(a); return a/s if s>1e-6 else a
Z=np.load('feats.npz'); F=Z['F'].reshape(len(Z['h']),-1); H=list(Z['h']); ok=Z['ok']
A=json.load(open('allimg.json')); occ=A['occ']
models_of=collections.defaultdict(set)
for m,i,n,mats,h in occ: models_of[h].add(m)
nmodels=len({o[0] for o in occ})
refs=[(f,role_of(f),feat_img(Image.open(os.path.join(REF,f)))) for f in sorted(os.listdir(REF)) if role_of(f)]
R=np.stack([np.stack([r[2].ravel(),r[2].T.ravel()]) for r in refs])  # nref,2,576
S=np.einsum('kd,rtd->krt',F,R).max(2)  # nimg,nref
S[~ok]=0
roles=sorted({r[1] for r in refs})
RS=np.stack([S[:,[k for k,r in enumerate(refs) if r[1]==ro]].max(1) for ro in roles],1)
best=RS.argmax(1); bests=RS.max(1)
np.savez('scores.npz',RS=RS,roles=np.array(roles))
out={}
for ti,t in enumerate([0.6,0.7,0.8,0.9]):
    for ri,ro in enumerate(roles):
        hit=np.where((best==ri)&(bests>t))[0]
        ms=set().union(*[models_of[H[k]] for k in hit]) if len(hit) else set()
        out.setdefault(ro,{})[t]=(len(hit),len(ms))
print('models',nmodels)
for ro in roles: print(ro, ' '.join(f'>{t}: imgs {a} models {b}' for t,(a,b) in out[ro].items()))
json.dump({ro:{str(t):v for t,v in d.items()} for ro,d in out.items()},open('hitrates.json','w'))
# spot-check sheets: per role, random sample of hits in bins
os.makedirs('hits',exist_ok=True); random.seed(1)
for ri,ro in enumerate(roles):
    cells=[]
    for lo,hi in [(0.6,0.7),(0.7,0.8),(0.8,1.01)]:
        idx=[k for k in np.where((best==ri)&(bests>lo)&(bests<=hi))[0]]
        random.shuffle(idx); cells+= [(k,lo) for k in idx[:20]]
    T=120;C=10
    sh=Image.new('RGB',(C*T,max(1,(len(cells)+C-1)//C)*(T+12)),'white'); dr=ImageDraw.Draw(sh)
    for n,(k,lo) in enumerate(cells):
        try: im=Image.open(A['files'][H[k]]); im.draft('RGB',(256,256)); im=im.convert('RGB'); im.thumbnail((T,T))
        except Exception: continue
        x=(n%C)*T;y=(n//C)*(T+12); sh.paste(im,(x,y)); dr.text((x+1,y+T),f'{bests[k]:.2f} {H[k][:6]}',fill='black')
    sh.save(f'hits/{ro}.png')
