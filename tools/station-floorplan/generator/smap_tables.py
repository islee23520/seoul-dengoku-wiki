# Parse subwayDatas.js tables (relocation, exitPosition) into JSON.
import json, re, sys
s = open(sys.argv[1], encoding='utf-8').read()
i = s.find('var locationAndExitData = {'); j = s.find('var pois = [];')
body = s[i+len('var locationAndExitData = '):j].strip().rstrip(';')
body = re.sub(r'//[^\n]*', '', body)
body = re.sub(r',(\s*[}\]])', r'\1', body)
d = json.loads(body)
json.dump(d, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
print({k: len(v) for k, v in d.items()})
