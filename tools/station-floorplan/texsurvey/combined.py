"""Per role: models covered by (a) refs at recommended threshold, (b) name rules, (c) OCR keywords, and union."""
import json,re,collections,numpy as np
A=json.load(open('allimg.json')); Z=np.load('scores.npz'); RS=Z['RS']; roles=list(Z['roles']); H=list(np.load('feats.npz')['h'])
TH={'gate':0.9,'elevator':0.8,'psd':0.8,'sign_exit':0.9,'stair':0.9,'escalator':0.97,'guide_map':0.9,'shutter':0.97}
NAME={'gate':r'SBgate|DisableP|gaichalgu|pass_side|card_(top|side)|_gate\d','escalator':r'^esc|^ESC','stair':r'stair','elevator':r'elv|elevator','sign_exit':r'^EXIT_|ExitA|_exit_'}
ocr={k:set(v) for k,v in json.load(open('ocr_roles.json')).items()}
best=RS.argmax(1); bs=RS.max(1); refimg=collections.defaultdict(set)
for k in range(len(H)):
    ro=roles[best[k]]
    if ro in TH and bs[k]>=TH[ro]: refimg[ro].add(H[k])
cov={r:{'ref':set(),'name':set(),'ocr':set()} for r in set(TH)|set(ocr)}
for m,i,n,mats,h in A['occ']:
    for r in cov:
        if h in refimg.get(r,()): cov[r]['ref'].add(m)
        if r in NAME and re.search(NAME[r],n+' '+' '.join(mats),re.I): cov[r]['name'].add(m)
        if h in ocr.get(r,()): cov[r]['ocr'].add(m)
for r,d in sorted(cov.items()):
    u=d['ref']|d['name']|d['ocr']; print(f"{r:10s} ref {len(d['ref']):3d} name {len(d['name']):3d} ocr {len(d['ocr']):3d} union {len(u):3d}/322")
