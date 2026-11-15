import csv,sys,re
K=sys.argv[1]; keys=[k.split('|') for k in sys.argv[2].split(',')]
E=list(csv.reader(open(K+'/k933.csv',encoding='utf-8')))[1:]
S=list(csv.reader(open(K+'/k932.csv',encoding='utf-8')))[1:]
def norm(s): s=re.sub(r'\(.*?\)','',s).strip().replace(' ',''); return s[:-1] if s.endswith('역') and len(s)>2 else s
for op,st in keys:
    print('=====',op,st)
    for r in E:
        if op in r[0]+'/'+r[1] and norm(r[2])==st: print(' E',r[1],'|',r[5][:160],'|',r[6:10])
    for r in S:
        if op in r[0]+'/'+r[1] and norm(r[2])==st: print(' S',r[1],'|',r[6],r[7],r[8][:60],'->',r[9],r[10],r[11][:60])
