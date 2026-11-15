"""Per-model material -> facility role, from the texture survey (texsurvey/):
ref correlation at role thresholds, material/image name rules, and OCR keywords (Windows OCR over all 56k images).
Writes smap/models/<glb>.froles.json {"materials": {mat: role}, "labels": {mat: text}}."""
import json, re, collections, os, glob
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); T = os.path.join(ROOT, 'texsurvey')
A = json.load(open(os.path.join(T, 'allimg.json'))); Z = np.load(os.path.join(T, 'scores.npz'))
RS = Z['RS']; roles = list(Z['roles']); H = list(np.load(os.path.join(T, 'feats.npz'))['h'])
TH = {'gate': 0.9, 'elevator': 0.8, 'psd': 0.8, 'sign_exit': 0.9, 'stair': 0.9, 'escalator': 0.97, 'guide_map': 0.9}
NAME = {'gate': r'SBgate|DisableP|gaichalgu|pass_side|card_(top|side)|_gate\d', 'escalator': r'^esc|^ESC', 'stair': r'stair',
        'elevator': r'elv|elevator', 'sign_exit': r'^EXIT_|ExitA|_exit_'}
ocr = {k: set(v) for k, v in json.load(open(os.path.join(T, 'ocr_roles.json'))).items()}
best = RS.argmax(1); bs = RS.max(1); refimg = collections.defaultdict(set)
for k in range(len(H)):
    ro = roles[best[k]]
    if ro in TH and bs[k] >= TH[ro]: refimg[ro].add(H[k])
# OCR text per hash for machine-room labels
ROOMS = ['기계실', '전기실', '변전실', '펌프실', '공조실', '환기실', '통신실', '신호실', 'EPS', '배전실', '발전기실', '축전지실', '집수정']
txt = {}
for f in glob.glob(os.path.join(T, 'ocr_*.tsv')):
    for line in open(f, encoding='utf-8-sig'):
        p = line.rstrip('\n').split('\t', 1)
        if len(p) == 2: txt[os.path.splitext(os.path.basename(p[0]))[0]] = p[1]
PRIO = ['gate', 'machine', 'escalator', 'stair', 'elevator', 'psd', 'sign_exit', 'guide_map']
out = collections.defaultdict(lambda: {'materials': {}, 'labels': {}})
for m, i, n, mats, h in A['occ']:
    found = []
    for r in PRIO:
        if h in refimg.get(r, ()) or h in ocr.get(r, ()) or (r in NAME and re.search(NAME[r], n + ' ' + ' '.join(mats), re.I)):
            found.append(r)
    if not found: continue
    r = found[0]
    for mat in mats:
        out[m]['materials'][mat] = r
        if r == 'machine':
            t = txt.get(h, ''); lab = next((x for x in ROOMS if x in t), '기계실')
            out[m]['labels'][mat] = lab
for m, d in out.items():
    json.dump(d, open(os.path.join(ROOT, 'smap/models', m[:-4] + '.froles.json'), 'w', encoding='utf-8'), ensure_ascii=False)
c = collections.Counter(r for d in out.values() for r in set(d['materials'].values()))
print('models', len(out), dict(c))
