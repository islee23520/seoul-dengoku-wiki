import json,numpy as np,os
from PIL import Image, ImageDraw
items=json.load(open('items.json'))
def feat(fn,n=16):
    im=Image.open(fn).convert('RGB').resize((n,n)); a=np.asarray(im,float).ravel(); return a
F=[];keep=[]
for fn,lab in items:
    try: f=feat(fn)
    except Exception: continue
    if F:
        d=np.abs(np.array(F)-f).mean(1)
        if d.min()<6: continue
    F.append(f); keep.append((fn,lab))
json.dump(keep,open('keep.json','w'))
import shutil; shutil.rmtree('sheets'); os.makedirs('sheets')
T=150; C=10; R=8
for k in range(0,len(keep),C*R):
    sh=Image.new('RGB',(C*T,R*(T+12)),'white'); dr=ImageDraw.Draw(sh)
    for n,(fn,lab) in enumerate(keep[k:k+C*R]):
        im=Image.open(fn).convert('RGB'); w,h=im.size; im.thumbnail((T,T))
        x=(n%C)*T; y=(n//C)*(T+12); sh.paste(im,(x,y)); dr.text((x+1,y+T),lab.split('|')[0][:24],fill='black')
    sh.save(f'sheets/s{k//(C*R):03d}.png')
print(len(keep))
