"""Pilot / batch result board: an HTML page with every station sheet and a single PNG contact board for Slack.
Usage: board.py <out_dir> <title> <name_ko> [...]"""
import json, os, sys, html
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
od, title, names = sys.argv[1], sys.argv[2], sys.argv[3:]
os.makedirs(od, exist_ok=True)
font = lambda s: ImageFont.truetype(r'C:\Windows\Fonts\malgunbd.ttf', s)
cards = []
for n in names:
    d = json.load(open(os.path.join(ROOT, 'out', n, 'data.json'), encoding='utf-8'))
    cards.append((n, d, os.path.join(ROOT, 'out', n, f'{n}.png')))
# contact board PNG
TW = 1300; cols = 2
thumbs = []
for n, d, p in cards:
    im = Image.open(p).convert('RGB'); h = int(im.height * TW / im.width)
    thumbs.append(im.resize((TW, h), Image.LANCZOS))
rows = [thumbs[i:i + cols] for i in range(0, len(thumbs), cols)]
H = 150 + sum(max(t.height for t in r) + 70 for r in rows) + 330
board = Image.new('RGB', (cols * TW + (cols + 1) * 30, H), '#0b1524'); dr = ImageDraw.Draw(board)
dr.text((30, 30), title, font=font(46), fill='#e8f1ff')
dr.text((30, 92), '지상 = 서울시 공간정보 실측(건물·토지피복·도로명) + S-Map 출입구 위에 2126 설정 / 지하 = S-Map 실내 3D 모형 층별 실측. 출처 등급 A 실측 · B OSM · C 설정 · [추정]', font=font(22), fill='#9db7d3')
y = 150; i = 0
for r in rows:
    x = 30
    for t in r:
        n, d, _ = cards[i]; i += 1
        fl = [f for f in d['floors']]; deep = max((f['depth_m'] for f in fl), default=0)
        dr.text((x, y), f'{n} — 모형 {len(d["models"])}개 · 층 {len(fl)}개 · 가장 깊은 층 {deep:.1f} m · 출입구 {len(d["exits"])}곳', font=font(26), fill='#ffd166')
        board.paste(t, (x, y + 44)); x += TW + 30
    y += max(t.height for t in r) + 70
src = ['A 실측: S-Map 실내 3D 모형(층·평면·선로·바닥 높이), S-Map 출입구 표식(번호·위치, OSM 출입구 번호와 대조), 서울시 공간정보 WFS(도로명주소 건물·토지피복·도로명)',
       'B 공개 협업: OpenStreetMap(하천·물길·환기구, 출입구 번호 대조) / C 설정: 출입구 상태·잔해 둑·차단·건물 쓰임·층 쓰임(정착 원칙·역 설정표)',
       '[추정]: 급기구·배기 출구·셔터 선·개찰구·최후 구역 자리(모형에 기능 표시 없음) / 이용: 공개 자료 이용 허용(소유자 결정 2026-11-15)']
for k, s in enumerate(src):
    dr.text((30, y + 10 + k * 40), s, font=font(24), fill='#dce8f5')
board.save(os.path.join(od, 'board.png'), optimize=True)
# small preview for chat
pv = board.copy(); pv.thumbnail((2400, 2400)); pv.save(os.path.join(od, 'board-preview.jpg'), quality=88)
# html
esc = html.escape
body = [f'<h1>{esc(title)}</h1><p>{esc(src[0])}<br>{esc(src[1])}<br>{esc(src[2])}</p>']
for n, d, p in cards:
    rel = os.path.relpath(p, od).replace('\\', '/')
    body.append(f'<h2>{esc(n)}</h2><p>모형: {esc(", ".join(d["models"]))} · 출입구 {len(d["exits"])}곳 · 주변 건물 {d["counts"]["buildings"]}동</p>'
                f'<a href="{rel}"><img src="{rel}" style="width:100%"></a>')
open(os.path.join(od, 'index.html'), 'w', encoding='utf-8').write(
    '<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><body style="background:#0b1524;color:#dce8f5;font-family:Malgun Gothic,sans-serif;margin:24px">' + ''.join(body) + '</body>')
print('board', os.path.join(od, 'board.png'), board.size)
