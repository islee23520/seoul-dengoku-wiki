import sys,glob
from PIL import Image, ImageDraw
ids=sys.argv[2].split(','); T=int(sys.argv[3]) if len(sys.argv)>3 else 400; C=4
fs=[glob.glob(f'imgs/{i}.*')[0] for i in ids]
sh=Image.new('RGB',(C*T,((len(fs)+C-1)//C)*(T+14)),'white'); dr=ImageDraw.Draw(sh)
for n,f in enumerate(fs):
    im=Image.open(f).convert('RGB'); w,h=im.size; im.thumbnail((T,T)); x=(n%C)*T; y=(n//C)*(T+14); sh.paste(im,(x,y)); dr.text((x+2,y+T),f'{ids[n]} {w}x{h}',fill='black')
sh.save(sys.argv[1])
