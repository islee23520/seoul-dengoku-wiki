import os,numpy as np,json
from PIL import Image
REF='../tools/refs'
def fi(p):
    a=np.asarray(Image.open(p).convert('L').resize((24,24),Image.BILINEAR),float); a=a-a.mean(); s=np.linalg.norm(a); return a/s if s>1e-6 else a
Z=np.load('feats.npz'); F=Z['F'].reshape(len(Z['h']),-1); ok=Z['ok']
for f in sorted(os.listdir(REF)):
    if not f[0].isalpha() or f.endswith('.md'): continue
    r=fi(os.path.join(REF,f)); s=np.maximum(F@r.ravel(),F@r.T.ravel()); s[~ok]=0
    print(f'{f:45s} >0.6:{(s>0.6).sum():5d} >0.8:{(s>0.8).sum():4d} >0.9:{(s>0.9).sum():4d} >0.97:{(s>0.97).sum():4d}')
