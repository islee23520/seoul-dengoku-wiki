import glob,shutil,os,json,sys
S="114,208,204,339,638,740,Samyangsageori,Guil,Nokcheon,Sinseoldong,Anguk,Dorimcheon,Daechi,SeoulStation,221".split(',')
items=dict(json.load(open('items.json')))
for spec in sys.argv[1:]:
    role,i=spec.split(':'); f=glob.glob(f'imgs/{i}.*')[0].replace(chr(92),'/')
    lab=items[f].split(' ',1)[1].split('|')[0].strip() or 'x'
    lab=lab.strip('_') or i.split('_')[1]
    m=S[int(i[1:3])]; dst=f'../tools/refs/{role}_{m}_{lab}{os.path.splitext(f)[1]}'
    shutil.copy(f,dst); print(dst)
