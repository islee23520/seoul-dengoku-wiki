# usage: floors.py <est.txt> <kric_dir> <out.json>
import csv,re,json,sys,ast
est=[ast.literal_eval(l) for l in open(sys.argv[1],encoding='utf-8') if l.startswith("('")]
K=sys.argv[2]
E=list(csv.reader(open(K+'/k933.csv',encoding='utf-8')))[1:]
S=list(csv.reader(open(K+'/k932.csv',encoding='utf-8')))[1:]
G=list(csv.reader(open(K+'/k1278.csv',encoding='utf-8')))[3:]
OPS={'9호선':lambda o,l:'메트로9' in o,'신림선':lambda o,l:'남서울' in o,'우이신설선':lambda o,l:'우이신설' in o,
 '신분당선':lambda o,l:o.strip()=='신분당선','수인분당선':lambda o,l:'코레일' in o and l in('분당선','수인분당선'),
 '공항철도':lambda o,l:o.strip()=='공항철도','경의중앙선':lambda o,l:'코레일' in o and l=='경의중앙선','경춘선':lambda o,l:'코레일' in o and l=='경춘선',
 '1호선':lambda o,l:'코레일' in o and l=='1호선','김포골드라인':lambda o,l:'김포골드' in o,'서해선':lambda o,l:'서해' in o or ('코레일' in o and l=='서해선'),
 'GTX-A':lambda o,l:'GTX' in l}
def norm(s): s=re.sub(r'\(.*?\)','',s).strip().replace(' ',''); return s[:-1] if s.endswith('역') and len(s)>2 else s
OTHER=['1호선','2호선','3호선','4호선','5호선','6호선','7호선','8호선','9호선','분당선','경의','경춘','공항','신분당','신림선','우이','GTX','SRT','KTX','에버라인']
def lvl(tok):
    tok=tok.strip().upper().replace(' ','')
    m=re.match(r'^(?:B|지하)(\d+)',tok)
    if m: return -int(m.group(1))
    m=re.match(r'^(\d+)(?:F|층)?$',tok) or re.match(r'^F(\d+)',tok) or re.match(r'^(\d+)F',tok)
    if m: return int(m.group(1))
    return None
def segs(text):
    out=[]
    for m in re.finditer(r'\(\s*([^()]{1,6})\s*\)\s*([^()]*)',text):
        v=lvl(m.group(1).replace('지하','B').replace('층',''))
        if v is not None: out.append((v,m.group(2)))
    for m in re.finditer(r'(지하|지상)\s*(\d+)\s*층\s*([^~]*)',text):
        v=int(m.group(2))*(-1 if m.group(1)=='지하' else 1); out.append((v,m.group(3)))
    return out
def isplat(t,line):
    if not re.search(r'승강장|홈|\d-\d\s*(출입문|앞)|방향|방면',t): return False
    if '대합실' in t or '환승통로' in t or '표' in t and '승강장' not in t: return False
    for o in OTHER:
        if o in t and not line.startswith(o[:2]): return False
    return True
res={}
for name,sid,line,dep,fl,struct,grade in est:
    f=OPS.get(line)
    if not f: continue
    n=norm(name)
    rows=[]
    for r in E:
        if f(r[0],r[1]) and norm(r[2])==n:
            sg=segs(r[5]); ends=[]
            for side,lv in ((r[6],r[7]),(r[8],r[9])):
                try: v=int(float(lv)); ends.append(-v if '지하' in side else v)
                except: pass
            rows.append(('E',sg,ends,r[5][:200]))
    for r in S:
        if f(r[0],r[1]) and norm(r[2])==n:
            sg=[]; ends=[]
            for side,lv,txt in ((r[6],r[7],r[8]),(r[9],r[10],r[11])):
                m=re.search(r'\d+',lv); v=None
                if m: v=int(m.group())*(-1 if '지하' in side else 1); ends.append(v)
                s2=segs(txt)
                if s2: sg+=s2
                elif v is not None: sg.append((v,txt))
            rows.append(('S',sg,ends,(r[8]+' / '+r[11])[:200]))
    for r in G:
        if line=='GTX-A' and len(r)>10 and 'GTX' in r[2] and norm(r[3])==n:
            rows.append(('G',segs(r[6]),[],r[6][:200]))
    plat=sorted({v for _,sg,_,_ in rows for v,t in sg if isplat(t,line)})
    allv=sorted({v for _,sg,ends,_ in rows for v in ends+[x for x,_ in sg]})
    ex=[t for _,sg,_,_ in rows for v,t in sg if isplat(t,line)][:4]
    res[f'{name}|{line}']=dict(n_rows=len(rows),platform_levels=plat,all_levels=allv,examples=ex)
json.dump(res,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,indent=0)
