import zipfile,re,xml.etree.ElementTree as ET
NS='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
def col(ref):
    m=re.match(r'([A-Z]+)',ref);n=0
    for ch in m.group(1): n=n*26+ord(ch)-64
    return n-1
def rows(path,sheet=1):
    z=zipfile.ZipFile(path);ss=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(NS+'si'):
            ss.append(''.join(t.text or '' for t in si.iter(NS+'t')))
    out=[]
    for row in ET.fromstring(z.read(f'xl/worksheets/sheet{sheet}.xml')).iter(NS+'row'):
        r={}
        for c in row.findall(NS+'c'):
            v=c.find(NS+'v');t=c.get('t')
            if v is None:
                isv=c.find('.//'+NS+'t');val=isv.text if isv is not None else ''
            else: val=ss[int(v.text)] if t=='s' else v.text
            r[col(c.get('r'))]=val
        if r: out.append([r.get(i,'') for i in range(max(r)+1)])
    return out
