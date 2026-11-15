import json,struct,glob,collections,re
C=collections.Counter(); I=collections.Counter(); U=collections.Counter()
for p in glob.glob('../smap/models/*.glb'):
    if p.endswith('.clean.glb'): continue
    b=open(p,'rb').read(20); L=struct.unpack('<I',b[12:16])[0]
    with open(p,'rb') as f: f.seek(20); j=json.loads(f.read(L))
    for m in j.get('materials',[]):
        n=re.sub(r'\.\d+$','',m.get('name','')); n=re.sub(r'\d+','#',n); C[n]+=1
    for i in j.get('images',[]):
        n=re.sub(r'\d+','#',i.get('name','')); I[n]+=1; U[i.get('uri','-')[:20]]+=1
print(C.most_common(60)); print(I.most_common(40)); print(U.most_common(3))
