"""Assign roles to images from Windows OCR text (ocr_*.tsv) and count models per role."""
import json,re,glob,collections,os,sys
sys.stdout.reconfigure(encoding="utf-8")
A=json.load(open('allimg.json'))
txt={}
for f in glob.glob('ocr_*.tsv'):
    for line in open(f,encoding='utf-8-sig',errors='replace'):
        p,_,t=line.rstrip('\n').partition('\t'); txt[os.path.basename(p).split('.')[0]]=t
RX={
 'machine':r'기계실|전기실|변전실|펌프|프실|환기실|공조실|배전실|발전기|축전지|통신실|신호실|냉동|송풍|배연|급기실|배기실|\bEPS\b|\bTPS\b|관계자\s*외?\s*출입\s*금지',
 'shutter':r'방화\s*셔터|셔터|방화\s*문|방화구획|FIRE\s*SHUTTER',
 'gate':r'개찰|카드\s*대는|Place your card|교통카드를?\s*대',
 'sign_exit':r'\d\s*번\s*출\s*[구입]|출입구|번\s*출구',
 'guide_map':r'주변\s*지역|안내도|Neighborhood|Station Map|역\s*이용',
 'elevator':r'엘리베이터|Elevator|승강기',
 'escalator':r'에스컬레이터|Escalator',
 'stair':r'계단|Stair',
}
role_img=collections.defaultdict(set)
for h,t in txt.items():
    for r,rx in RX.items():
        if re.search(rx,t,re.I): role_img[r].add(h)
mods=collections.defaultdict(set)
for m,i,n,mats,h in A['occ']:
    for r in RX:
        if h in role_img[r]: mods[r].add(m)
print('ocr images',len(txt))
for r in RX: print(r,'imgs',len(role_img[r]),'models',len(mods[r]))
json.dump({r:sorted(v) for r,v in role_img.items()},open('ocr_roles.json','w'))
if len(sys.argv)>1:
    r=sys.argv[1]
    for h in sorted(role_img[r]): print(h, txt[h][:150])
