import json,struct,sys,collections
def load(p):
    b=open(p,'rb').read(); L=struct.unpack('<I',b[12:16])[0]; return json.loads(b[20:20+L])
for p in sys.argv[1:]:
    j=load(p)
    ims=j.get('images',[]); mats=j.get('materials',[]); nodes=j.get('nodes',[]); meshes=j.get('meshes',[])
    print('==',p.split('/')[-1],'imgs',len(ims),'mats',len(mats),'nodes',len(nodes),'meshes',len(meshes))
    print(' mimes',collections.Counter(i.get('mimeType') for i in ims))
    print(' img names',[i.get('name') for i in ims[:15]])
    print(' mat names',[m.get('name') for m in mats[:15]])
    print(' node names',[n.get('name') for n in nodes[:15]])
    print(' mesh names',[m.get('name') for m in meshes[:10]])
    ex=[n.get('extras') for n in nodes if n.get('extras')]+[m.get('extras') for m in mats if m.get('extras')]
    print(' extras',len(ex),ex[:3], 'top extras', j.get('extras'), j.get('asset'))
