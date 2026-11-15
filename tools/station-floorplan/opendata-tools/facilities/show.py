import json,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
for s in d:
  print('##',s['oa'],s['title'],s['dates'])
  for f in s['files']: print(' ',f['seq'],f['file'],f['bytes'],f['status'],f.get('rows'),f.get('head',[])[:3], f.get('convert_error',''))
