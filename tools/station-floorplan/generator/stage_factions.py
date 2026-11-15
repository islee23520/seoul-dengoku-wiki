"""Split the full board into per-faction evidence folders (JPEG sheets, <=~35 MB each)."""
import json, os, shutil, html, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from compose import STATIONS, FACTION_KO
from PIL import Image
G = r'C:/Users/oliver/.omp/evidence/gallery-public'; SRC = f'{G}/seoul-v4-station-floorplans-all'
summ = json.load(open(f'{SRC}/summary.json', encoding='utf-8')); e = html.escape
NOTE = ('지상: 서울시 공간정보(도로명주소 건물·토지피복·도로명) + S-Map·행정안전부 출입구 + S-Map 오픈랩 수치지형도(지하환기구 13,756·지하도·지하도입구·터널 실측 윤곽) + 서울교통공사 환기구 표 + OSM 하천, EPSG:5179. '
        '지하: S-Map 실내 3D 모형 층별 실측 + 모형에서 판별한 개찰구·계단·에스컬레이터(셔터 선)·승강기·기계실 + 빠른하차정보(칸-문)로 환산한 승강장 계단·에스컬레이터·승강기 + 공식 승강장 층·깊이(OA-13305, KRIC) + 공식 역 안내도. 그 위 2126 설정: 성곽은 원이 아니라 실측 블록·건물 외벽·담장·하천·철도·제방·성토를 이어 붙여 경계 인원 예산과 인구 면적 상한 안에서 잡음(정부 0.7·자유도시 1.2 교리, 아크는 지상 성곽 없음). '
        '출처 등급 A 실측 · B OSM · C 설정 · [추정]. 이용: 공개 자료 이용 허용(소유자 결정 2026-11-15), 출처 표기 유지.')
def build(slug, title, names, board_prev):
    D = f'{G}/{slug}'; shutil.rmtree(D, ignore_errors=True); os.makedirs(f'{D}/sheets')
    for n in names:
        im = Image.open(f'{SRC}/sheets/{n}.png').convert('RGB'); im.thumbnail((2000, 6000)); im.save(f'{D}/sheets/{n}.jpg', quality=80, optimize=True)
        shutil.copyfile(f'{SRC}/sheets/{n}.data.json', f'{D}/sheets/{n}.data.json')
    shutil.copyfile(board_prev, f'{D}/board-preview.jpg')
    miss = ''.join(f'<tr><td>{e(n)}</td><td>{e(k)}</td><td>{e(r)}</td></tr>' for n, k, r in summ['missing'])
    h = [f'<!doctype html><meta charset="utf-8"><title>{e(title)}</title><body style="background:#0b1524;color:#dce8f5;font-family:Malgun Gothic,sans-serif;margin:24px">',
         f'<h1>{e(title)}</h1><p>{e(NOTE)}</p><img src="board-preview.jpg" style="max-width:100%">',
         f'<h2>확보하지 못한 자료와 건너뛴 항목(전체)</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr><th>역</th><th>상태</th><th>이유</th></tr>{miss}</table><h2>시트</h2>']
    h += [f'<h3>{e(n)}</h3><a href="sheets/{e(n)}.jpg"><img loading="lazy" src="sheets/{e(n)}.jpg" style="width:100%"></a>' for n in names]
    open(f'{D}/index.html', 'w', encoding='utf-8').write(''.join(h)); print(slug, len(names))
for fac in ('government', 'free-city', 'arc'):
    names = sorted(n for n, s in STATIONS.items() if s['faction_id'][0] == fac and os.path.exists(f'{SRC}/sheets/{n}.png'))
    parts = [names] if len(names) < 100 else [names[:len(names) // 2], names[len(names) // 2:]]
    for i, part in enumerate(parts, 1):
        sl = f'seoul-v4-floorplans-{fac}' + (f'-{i}' if len(parts) > 1 else '')
        tt = f'v4 역 방어 평면도 — {FACTION_KO[fac]} ' + (f'{i}/{len(parts)} ' if len(parts) > 1 else '') + f'{len(part)}장 ({part[0]}~{part[-1]}), 실측 지리 데이터 기반'
        build(sl, tt, part, f'{SRC}/board-{fac}-preview.jpg')
