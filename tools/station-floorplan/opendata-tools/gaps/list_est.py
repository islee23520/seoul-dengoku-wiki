import json,collections,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
out=open(sys.argv[2],'w',encoding='utf-8')
est=[]
for st in d['stations']:
  for e in st.get('depth_by_line') or []:
    g=e.get('grade') or ''
    if not g.startswith('[확인'): est.append((st['name_ko'],st['id'],e['line'],e.get('depth_m'),e.get('floors'),e.get('structure'),g[:140]))
for x in est: out.write(repr(x)+'\n')
out.write(repr(collections.Counter(x[2] for x in est))+'\n')
out.write(json.dumps(d['meta'],ensure_ascii=False)[:3000])
