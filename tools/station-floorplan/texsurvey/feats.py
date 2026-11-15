"""Compute glb_textures.py-style 24x24 normalized grayscale features for all unique images (cached)."""
import json,numpy as np,io
from PIL import Image
A=json.load(open('allimg.json')); hs=sorted(A['files'])
F=np.zeros((len(hs),24,24),np.float32); ok=np.zeros(len(hs),bool); S=np.zeros((len(hs),2),np.int32)
for k,h in enumerate(hs):
    try:
        im=Image.open(A['files'][h]); S[k]=im.size
        if im.format=='JPEG': im.draft('L',(96,96))
        a=np.asarray(im.convert('L').resize((24,24),Image.BILINEAR),float); a=a-a.mean(); s=np.linalg.norm(a)
        F[k]=a/s if s>1e-6 else a; ok[k]=True
    except Exception: pass
np.savez('feats.npz',F=F,ok=ok,S=S,h=np.array(hs))
print(ok.sum(),len(hs))
