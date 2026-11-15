import json,numpy as np,random,sys,collections
from PIL import Image, ImageDraw
Z=np.load('scores.npz'); RS=Z['RS']; roles=list(Z['roles']); H=list(np.load('feats.npz')['h'])
A=json.load(open('allimg.json')); best=RS.argmax(1); bs=RS.max(1)
nm=collections.defaultdict(set)
for m,i,n,mats,h in A['occ']: nm[h].add(n)
lo,hi=float(sys.argv[1]),float(sys.argv[2]); random.seed(2)
for ri,ro in enumerate(roles):
    idx=list(np.where((best==ri)&(bs>lo)&(bs<=hi))[0]); random.shuffle(idx); idx=idx[:40]
    T=120;C=10; sh=Image.new('RGB',(C*T,max(1,(len(idx)+C-1)//C)*(T+12)),'white'); dr=ImageDraw.Draw(sh)
    for n,k in enumerate(idx):
        im=Image.open(A['files'][H[k]]); im.draft('RGB',(256,256)); im=im.convert('RGB'); im.thumbnail((T,T))
        x=(n%C)*T;y=(n//C)*(T+12); sh.paste(im,(x,y)); dr.text((x+1,y+T),f'{bs[k]:.2f} {sorted(nm[H[k]])[0][:12]}',fill='black')
    sh.save(f'hits/{ro}_{lo}.png'); print(ro,len(idx))
