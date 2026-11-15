# Build (호선, 번호) -> 구간, 인접건물, 크기 from historical OA-12926 workbooks (2013, 2015, 2017).
import openpyxl, sys, csv, re
sys.stdout.reconfigure(encoding='utf-8')
R = '../raw/dataseoul/'
out = {}
def put(line, no, sec, lm, src, extra):
    try: line = str(int(str(line).strip())); no = int(str(no).strip())
    except: return
    if not lm or str(lm).strip() in ('', '-', 'None'): lm = ''
    k = (line, no)
    cur = out.get(k)
    if cur is None or (not cur['landmark'] and lm):
        out[k] = dict(line=line, no=no, section=str(sec or '').replace('\n', ' ').strip(), landmark=str(lm).replace('\n', ' ').strip(), src=src, **extra)
# 2017 1~4 (f3): 호선 번호 구간 용도 기능 위치 높이 가로 세로 인접건물 비고
wb = openpyxl.load_workbook(R + 'f3.xlsx', read_only=True, data_only=True)
for r in wb.worksheets[0].iter_rows(min_row=3, values_only=True):
    if r[0] and r[1] is not None: put(r[0], r[1], r[2], r[9], '2017_1-4', dict(loc=r[5] or '', w=r[7], l=r[8]))
# 2017 5~8 (f4): 연번 번호 구간 ... 인접건물명 at col with header; find col index
ws = openpyxl.load_workbook(R + 'f4.xlsx', read_only=True, data_only=True).worksheets[0]
rows = list(ws.iter_rows(values_only=True))
for r in rows[6:]:
    if not r or not isinstance(r[1], (int, float)) and not (isinstance(r[1], str) and r[1].strip().isdigit()): continue
    no = int(str(r[1]).strip()); line = str(no // 1000)
    vals = [c for c in r]
    # landmark: last non-empty string cell after numeric block
    lm = ''
    for c in reversed(vals[18:]):
        if isinstance(c, str) and c.strip() and c.strip() not in ('×',):
            lm = c; break
    put(line, no, r[2], lm, '2017_5-8', dict(loc='', w=None, l=None))
# 2015 / 2013 1~4 sheets: 호선 번호 구간 용도 기능 위치 높이 가로 세로 ... 인접건물 (find header)
for f, tag in (('f2.xlsx', '2015_1-4'), ('f1.xlsx', '2013_1-4')):
    wb = openpyxl.load_workbook(R + f, read_only=True, data_only=True)
    for ws in wb.worksheets[1:]:
        rows = list(ws.iter_rows(values_only=True))
        h = [str(c or '').replace('\n', '').replace(' ', '') for c in rows[0]]
        if '인접건물' not in h: continue
        i = h.index('인접건물')
        for r in rows[2:]:
            if r[0] and r[1] is not None: put(r[0], r[1], r[2], r[i], tag, dict(loc=r[5] or '', w=r[7], l=r[8]))
with open('../vent_landmarks.csv', 'w', newline='', encoding='utf-8-sig') as fo:
    w = csv.DictWriter(fo, fieldnames=['line', 'no', 'section', 'landmark', 'loc', 'w', 'l', 'src'])
    w.writeheader()
    for k in sorted(out, key=lambda k: (int(k[0]), k[1])): w.writerow(out[k])
from collections import Counter
print(len(out), Counter(v['line'] for v in out.values()), sum(1 for v in out.values() if v['landmark']))
