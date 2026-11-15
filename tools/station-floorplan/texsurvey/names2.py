import os,json,struct,glob,collections,re
C=collections.Counter(); M=collections.defaultdict(set)
for p in glob.glob('../smap/models/*.glb'):
    if p.endswith('.clean.glb'): continue
    b=open(p,'rb').read(20); L=struct.unpack('<I',b[12:16])[0]
    with open(p,'rb') as f: f.seek(20); j=json.loads(f.read(L))
    for m in j.get('images',[])+j.get('materials',[]):
        n=re.sub(r'\.\d+$','',m.get('name','')); n=re.sub(r'\.(jpg|png)$','',n); n=re.sub(r'\d+','#',n)
        if re.match(r'^(Mad|LIBENT|Color_|M_#|_Color|Image_)',n) or not re.search('[A-Za-z]',n): continue
        C[n]+=1; M[n].add(os.path.basename(p)[:30])
for n,c in sorted(C.items(),key=lambda x:-len(M[x[0]])): print(len(M[n]),c,n, sorted(M[n])[:2])
