"""Full-run board: per-faction contact sheets (PNG), an HTML index of every sheet, and a missing/skip table.
Usage: board_all.py <stage_dir>   (copies sheets into <stage_dir>/sheets/)"""
import json, os, sys, glob, html, shutil, re
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
sys.path.insert(0, HERE)
from compose import PLANS, STATIONS, FACTION_KO
from render_station import smap_names
stage = sys.argv[1]; os.makedirs(os.path.join(stage, 'sheets'), exist_ok=True)
font = lambda s: ImageFont.truetype(r'C:\Windows\Fonts\malgunbd.ttf', s)
st = {}
for f in glob.glob(os.path.join(ROOT, 'out/_batch/status*.json')): st.update(json.load(open(f, encoding='utf-8')))
rows, missing = [], []
for n, s in STATIONS.items():
    png = os.path.join(ROOT, 'out', n, f'{n}.png'); dj = os.path.join(ROOT, 'out', n, 'data.json')
    if n not in PLANS:
        missing.append((n, '건너뜀', '역 설정표에 없음: 정착지로 세지 않는 지도 항목')); continue
    if not os.path.exists(png):
        missing.append((n, '실패', st.get(n, {}).get('reason', 'PNG 없음'))); continue
    d = json.load(open(dj, encoding='utf-8'))
    sm = smap_names(n)
    if not d['models']:
        missing.append((n, '지하 [추정]', 'S-Map 실내지도 없음' if not sm else f'S-Map 모형 불러오기 실패: {", ".join(sm)}'))
    rows.append((s['faction_id'][0], n, d))
    shutil.copyfile(png, os.path.join(stage, 'sheets', f'{n}.png'))
    shutil.copyfile(dj, os.path.join(stage, 'sheets', f'{n}.data.json'))
# per-faction contact boards
TW, TH, COLS = 430, 300, 6
boards = {}
for fac in ('government', 'free-city', 'arc'):
    items = sorted([r for r in rows if r[0] == fac], key=lambda r: r[1])
    nrow = (len(items) + COLS - 1) // COLS
    W = COLS * (TW + 14) + 14; H = 110 + nrow * (TH + 40) + 20
    b = Image.new('RGB', (W, H), '#0b1524'); dr = ImageDraw.Draw(b)
    dr.text((14, 20), f'{FACTION_KO[fac]} — 역 방어 평면도 {len(items)}장 (실측 지리 데이터 기반, 잠정)', font=font(40), fill='#e8f1ff')
    dr.text((14, 72), '시트 위쪽만 보임. 전체는 index.html. 출처 A 실측(S-Map·서울시) · B OSM · C 설정 · [추정]', font=font(20), fill='#9db7d3')
    for i, (_, n, d) in enumerate(items):
        im = Image.open(os.path.join(ROOT, 'out', n, f'{n}.png')).convert('RGB')
        crop = im.crop((0, 0, im.width, int(im.width * TH / TW))); crop = crop.resize((TW, TH), Image.LANCZOS)
        x = 14 + (i % COLS) * (TW + 14); y = 110 + (i // COLS) * (TH + 40)
        deep = max([f['depth_m'] for f in d['floors']] or [0])
        dr.text((x, y), f'{n} · 층 {len(d["floors"])} · {deep:.0f} m' + ('' if d['models'] else ' · 지하[추정]'), font=font(17), fill='#ffd166' if d['models'] else '#ff8a8a')
        b.paste(crop, (x, y + 26))
    out = os.path.join(stage, f'board-{fac}.png'); b.save(out, optimize=True); boards[fac] = (out, len(items))
    pv = b.copy(); pv.thumbnail((2000, 4000)); pv.save(os.path.join(stage, f'board-{fac}-preview.jpg'), quality=85)
# html index
e = html.escape
h = ['<!doctype html><meta charset="utf-8"><title>v4 역 방어 평면도 전체</title><body style="background:#0b1524;color:#dce8f5;font-family:Malgun Gothic,sans-serif;margin:24px">',
     f'<h1>v4 역 방어 평면도 전체 — 실측 지리 데이터 기반 ({len(rows)}장)</h1>',
     '<p>지상: 서울시 공간정보(도로명주소 건물·토지피복·도로명) + S-Map 출입구 표식 + OSM 하천·환기구, EPSG:5179. 지하: S-Map 실내 3D 모형 층별 실측. 그 위 2126 설정. '
     '환기구: 서울교통공사_환기구현황(서울 열린데이터광장 OA-12926). 출처 등급 A 실측 · B OSM · C 설정 · [추정]. 이용: 공개 자료 이용 허용(소유자 결정 2026-11-15), 출처 표기 유지.</p>',
     '<h2>세력별 보드</h2>' + ''.join(f'<p><a href="board-{f}.png">{FACTION_KO[f]} {boards[f][1]}장</a></p><a href="board-{f}.png"><img src="board-{f}-preview.jpg" style="max-width:100%"></a>' for f in boards),
     '<h2>확보하지 못한 자료와 건너뛴 항목</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr><th>역</th><th>상태</th><th>이유</th></tr>'
     + ''.join(f'<tr><td>{e(n)}</td><td>{e(k)}</td><td>{e(r)}</td></tr>' for n, k, r in missing) + '</table>',
     '<h2>모든 시트</h2>']
for fac in ('government', 'free-city', 'arc'):
    h.append(f'<h3>{FACTION_KO[fac]}</h3><p>' + ' · '.join(f'<a href="sheets/{e(n)}.png">{e(n)}</a>' for f_, n, d in sorted(rows, key=lambda r: r[1]) if f_ == fac) + '</p>')
open(os.path.join(stage, 'index.html'), 'w', encoding='utf-8').write(''.join(h))
json.dump({'sheets': len(rows), 'missing': missing}, open(os.path.join(stage, 'summary.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('sheets', len(rows), 'missing', len(missing)); [print(' ', *m) for m in missing]
