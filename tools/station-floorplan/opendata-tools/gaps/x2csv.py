import sys,csv,os
sys.path.insert(0,os.path.dirname(__file__))
import xlsx
for p in sys.argv[1:]:
    R=xlsx.rows(p)
    with open(p.rsplit('.',1)[0]+'.csv','w',encoding='utf-8',newline='') as f: csv.writer(f).writerows(R)
    print(p,len(R))
