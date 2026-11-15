import json,re,random,sys
from PIL import Image, ImageDraw
A=json.load(open('allimg.json')); random.seed(0)
pats=sys.argv[2].split(',')
cells=[]
for p in pats:
    hs=[]; 
    for m,i,n,mats,h in A['occ']:
        if re.match(p+'$',n) and h not in [x[0] for x in hs]: hs.append((h,n,m))
    random.shuffle(hs); cells+=hs[:6]
T=150;C=6
sh=Image.new('RGB',(C*T,((len(cells)+C-1)//C)*(T+24)),'white'); dr=ImageDraw.Draw(sh)
for k,(h,n,m) in enumerate(cells):
    im=Image.open(A['files'][h]); im.draft('RGB',(300,300)); im=im.convert('RGB'); im.thumbnail((T,T))
    x=(k%C)*T;y=(k//C)*(T+24); sh.paste(im,(x,y)); dr.text((x+1,y+T),n[:22],fill='black'); dr.text((x+1,y+T+11),m[:24],fill='black')
sh.save(sys.argv[1])
