# usage: python -I -X utf8 build_gaps.py <settlement_data_dir> <gaps_dir>
# Builds gaps.json from: settlement stations.json, _est.txt (list_est.py), _floors.json (floors.py),
# KRIC downloads in dl_kric/, MOIS exits in dl_mois/, OA-13305 csv in settlement _dl/depth/.
import json, csv, re, sys, math, statistics, ast, collections

SD, GD = sys.argv[1], sys.argv[2]
stations = json.load(open(SD + '/stations.json', encoding='utf-8'))['stations']
byname = {s['name_ko']: s for s in stations}
fl = json.load(open(GD + '/_floors.json', encoding='utf-8'))
est = [ast.literal_eval(l) for l in open(GD + '/_est.txt', encoding='utf-8') if l.startswith("('")]

OA13305 = 'https://data.seoul.go.kr/dataList/OA-13305/F/1/datasetView.do'
K933 = 'https://data.kric.go.kr/rips/M_01_01/detail.do?id=933'
K932 = 'https://data.kric.go.kr/rips/M_01_01/detail.do?id=932'
K1294 = 'https://data.kric.go.kr/rips/M_01_01/detail.do?id=1294'
K1278 = 'https://data.kric.go.kr/rips/M_01_01/detail.do?id=1278'
MOIS = 'https://www.arcgis.com/home/item.html?id=8b8721ad08e5455196f1e516a244cecc'
MOIS_FS = 'https://portal.esrikr.com/arcgis/rest/services/Hosted/MOIS_KR_Subway/FeatureServer'

D18 = list(csv.DictReader(open(SD + '/_dl/depth/depth18.csv', encoding='utf-8')))


def d18(line, name):
    for r in D18:
        if r['호선'] == line and r['역명'].strip() == name:
            return r


cal = collections.defaultdict(list)
for r in D18:
    m = re.match(r'B(\d)', r['층수'])
    if m:
        try:
            cal[int(m.group(1))].append(float(r['정거장깊이']))
        except ValueError:
            pass
CAL = {k: round(statistics.median(v), 1) for k, v in sorted(cal.items())}
CALN = {k: len(v) for k, v in sorted(cal.items())}

sys.path.insert(0, __import__('os').path.dirname(__file__))
import xlsx
K = [r for r in xlsx.rows(SD + '/_dl/kric/k1294.bin') if len(r) > 18][1:]
PT = 17  # 승강장 유형
OPM = {'9호선': '9호선', '신림선': '신림선', '우이신설선': '우이신설', '신분당선': '신분당', '수인분당선': '분당',
       '공항철도': '공항철도', '경의중앙선': '경의', '경춘선': '경춘', '1호선': '1호선', '김포골드라인': '김포',
       '서해선': '서해', 'GTX-A': 'GTX'}


def ptype(name, line):
    n = '서울' if name == '서울역' else name
    key = OPM.get(line, line)
    for r in K:
        nm = re.sub(r'\(.*?\)', '', r[4]).strip()
        if nm.endswith('역') and len(nm) > 2:
            nm = nm[:-1]
        if nm == n and key in (r[0] + r[1]):
            return (r[PT] or '').strip() or None
    return None


ALIAS = {('구로디지털단지', '2호선'): ('2', '구로디지털'), ('을지로3가', '2호선'): ('2', '을지3가'),
         ('을지로4가', '2호선'): ('2', '을지4가'), ('미아사거리', '4호선'): ('4', '미아삼거리'),
         ('불암산', '4호선'): ('4', '당고개'), ('동대문역사문화공원', '5호선'): ('5', '동대문운동장'),
         ('둔촌동', '5호선'): ('5', '둔촌'), ('애오개', '5호선'): ('5', '애오게'),
         ('디지털미디어시티', '6호선'): ('6', 'DMC'), ('숭실대입구', '7호선'): ('7', '숭실대'),
         ('신대방삼거리', '7호선'): ('7', '신대방'), ('총신대입구(이수)', '7호선'): ('7', '이수'),
         ('자양', '7호선'): ('7', '뚝섬유원지')}

OVR = {
    ('논현', '신분당선'): ('B4', 'KRIC 933 상세위치 "(B4) 신분당선 신사/신논현 방향 승강장"'),
    ('증미', '9호선'): ('B2', '상세위치는 B2 승강장, 운행층 칸은 지하3으로 서로 다름'),
    ('구반포', '9호선'): ('B2', '상세위치는 B2 승강장, 운행층 칸은 지하3으로 서로 다름'),
    ('대모산입구', '수인분당선'): ('B5', 'KRIC 933 "B5층 개포동역 방향 승강장"'),
    ('대방', '신림선'): ('B4', 'KRIC 932는 B4 승강장, 933은 B3로 적어 서로 다름. 철도경제신문(redaily 3922)도 B4'),
    ('샛강', '신림선'): ('B4', 'KRIC 933은 B4 승강장, 932는 B3로 적어 서로 다름. 철도경제신문(redaily 3922)도 B4'),
    ('당곡', '신림선'): ('B2', 'KRIC 933·932 모두 B2. 철도경제신문(redaily 3922)은 "당곡역은 지하 3층"이라 적어 서로 다름'),
    ('홍대입구', '경의중앙선'): ('B2', '운행층 칸은 승강장 지하2~대합실 지하1. 상세위치 문자열은 B1 승강장/B2 표내는곳으로 거꾸로 적혀 있음'),
    ('김포공항', '9호선'): ('B3/B4', '상선(공항시장 방향) B3, 하선(개화 방향) B4 위아래 겹침 승강장'),
    ('김포공항', '공항철도'): ('B3/B4', '서울역 방향 B3, 인천공항 방향 B4 위아래 겹침 승강장'),
    ('서울역', '공항철도'): ('B7', '일반열차·직통열차 승강장 모두 B7. 대합실 B2(직통)·B3(일반), B4~B6은 기계실·비운행층'),
    ('수서', '수인분당선'): ('B4', '운행층 칸만 지하4(상세위치 문자열 없음)'),
    ('복정', '수인분당선'): ('B3', 'KRIC 932 "(B3) 승강장 중앙"'),
    ('왕십리', '수인분당선'): ('1F', '코레일 층 표기: 서울숲 방향 승강장 1F, 맞이방 2F, 2호선 환승통로 B2. 역사가 비탈에 있어 주변 지면 대비 실제 깊이는 이 자료로 알 수 없음'),
    ('청량리', '수인분당선'): ('1F', 'KRIC 933 경의중앙선 항목 "(1F) 1번 홈 분당선 왕십리역 방향 8-2 앞/2번 홈 경춘선 회기역 방향": 수인분당선은 지상 1·2번 홈을 경춘선과 함께 씀'),
    ('청량리', '경춘선'): ('1F', 'KRIC 933 경의중앙선 항목 "2번 홈 경춘선" 1F'),
    ('회기', '경춘선'): ('1F', 'KRIC 933 1호선 항목 "맞이방(2층) <-> 중앙선승강장(1층)", 경춘선은 같은 승강장을 씀'),
    ('회기', '경의중앙선'): ('1F', 'KRIC 933 1호선 항목 "맞이방(2층) <-> 중앙선승강장(1층)"'),
    ('노량진', '1호선'): ('1F', 'KRIC 933 9호선 항목 "(1F) 1호선 용산역 방향 승강장(5번홈)"'),
    ('창동', '1호선'): ('1F', 'KRIC 933 서울교통공사 4호선 항목 "쌍문 방면 6-1(1호선 소요산방면)" 지상1 (4호선은 고가 2F)'),
    ('중랑', '경춘선'): ('2F', 'KRIC 933 경의중앙선 항목 "(2F) 회기역 방향 승강장 5-1 출입문 앞"; 경춘선은 같은 승강장을 씀'),
    ('개화', '9호선'): ('1F', 'KRIC 933 "(1F) 하선승강장 6-4 근처(2F) 안전관리실 옆": 지상역'),
}


def lvl2s(v):
    return f'B{-v}' if v < 0 else f'{v}F'


out = {}
upd = collections.Counter()
for name, sid, line, dep, floors, struct, grade in est:
    e = {'prev': {'depth_m': dep, 'floors': floors, 'structure': struct, 'grade': grade}}
    pt = ptype(name, line)
    if (name, line) in ALIAS:
        ln, an = ALIAS[(name, line)]
        r = d18(ln, an)
        dm = float(r['정거장깊이'])
        e.update(depth_m=dm, rail_depth_m=float(r['선로기준정거장깊이']), floor=r['층수'], platform=r['형식'],
                 structure='고가' if dm < 0 else '지하',
                 grade=f'[확인: {OA13305}] 역명 "{an}"(옛 이름·약칭)으로 실려 있어 지난번 이름 대조에서 빠졌음. 승강장기준 정거장깊이, 음수는 고가')
        upd['depth_m_confirmed_OA13305'] += 1
    else:
        f = fl.get(f'{name}|{line}', {})
        plat = f.get('platform_levels', [])
        if (name, line) in OVR:
            floor, note = OVR[(name, line)]
        elif plat:
            under = [v for v in plat if v < 0]
            floor = lvl2s(min(under)) if under else lvl2s(min(v for v in plat if v > 0))
            note = f'KRIC 승강기 상세위치에 이 노선 승강장이 나온 층 {[lvl2s(v) for v in plat]} 가운데 가장 깊은 층'
        elif f.get('n_rows') and all(v > 0 for v in f.get('all_levels', [])):
            floor = '지상(층 번호 미상)'
            note = f"KRIC 승강기 {f['n_rows']}행이 모두 지상 층({[lvl2s(v) for v in f['all_levels']]})만 오감. 승강장 층 문자열은 없음"
        else:
            floor, note = None, 'KRIC 승강기 자료에 이 역·노선 행이 없음'
        e['floor'] = floor
        e['platform'] = pt
        src = K1278 if line == 'GTX-A' else f'{K933} + {K932}'
        if floor:
            e['structure'] = '지하' if floor.startswith('B') else '지상'
            e['floor_grade'] = f'[확인: {src}] {note}'
            upd['floor_confirmed_KRIC'] += 1
            if floor.startswith('B'):
                n = int(re.match(r'B(\d)', floor.split('/')[-1]).group(1))
                e['depth_m'] = None
                e['depth_m_est'] = CAL.get(n, round(5 * n + 3, 1))
                e['grade'] = (f'[추정: 승강장 층 {floor}을 OA-13305(1~8호선) 같은 층수 승강장깊이 중앙값으로 환산] '
                              '운영기관의 미터 단위 심도는 공개 자료로 찾지 못함')
            else:
                e['depth_m'] = 0
                e['grade'] = f'[확인: {src}] 승강장이 지상 층({floor})에 있어 지상역(깊이 0). 성토·교량 높이는 미상'
                upd['ground_confirmed_KRIC'] += 1
        else:
            e['depth_m'] = dep if dep == 0 else None
            e['depth_m_est'] = dep
            e['grade'] = grade
            e['floor_grade'] = note
            upd['still_estimated'] += 1
    if pt:
        e['platform_grade'] = f'[확인: {K1294}] 승강장 유형'
    out.setdefault(name, {'lines': {}, 'exits': None, 'notes': ''})['lines'][line] = e

# ---- special stations ----
def S(name):
    return out.setdefault(name, {'lines': {}, 'exits': None, 'notes': ''})

a = S('암사역사공원')
a['lines']['8호선'] = {
    'depth_m': 17.28, 'rail_depth_m': 18.38, 'floor': 'B2', 'concourse': 'B1', 'platform': '상대식',
    'structure': '지하', 'opened': '2024-08-10', 'station_area_m2': 7665.57,
    'grade': f'[확인: {OA13305}] 8호선 277행 "암사역사공원 B2 상대식 18.38/17.28"',
    'floor_grade': f'[확인: {K933} + {K932}] 승강기 지하1(대합실)~지하2(승강장), 출입구 엘리베이터 1·3번 지하1~지상1',
    'platform_grade': f'[확인: {K1294}] 상대식 (횡단 가능 여부는 [발췌: https://namu.wiki/w/암사역사공원역] "복선 상대식 승강장 (횡단 가능)")'}
a['exits'] = [
    {'no': 1, 'side': '아리수로 남쪽', 'near': ['강일중학교', '암사3동주민센터', '강동롯데캐슬퍼스트', '강동현대홈타운'], 'bus_stop': '암사역사공원역1번출구(25208)'},
    {'no': 2, 'side': '아리수로 남쪽', 'near': ['선사고등학교', '신암중학교', '암사1동주민센터'], 'note': '2번 출입구는 중간층을 거치는 에스컬레이터(KRIC 932 "2번 출입구(중간층)")'},
    {'no': 3, 'side': '아리수로 북쪽', 'near': ['암사역사공원', '서울 암사동 유적', '양지마을'], 'bus_stop': '암사역사공원역3번출구(25209)', 'note': '부근 천장 채광창으로 대합실 자연채광'}]
a['exits_grade'] = ('[확인: https://data.seoul.go.kr/dataList/OA-22449/F/1/datasetView.do] 출입구 1·2·3번 3개(2024 설치, 표준형 캐노피) / '
                    '위치·주변 시설은 [발췌: https://namu.wiki/w/%EC%95%94%EC%82%AC%EC%97%AD%EC%82%AC%EA%B3%B5%EC%9B%90%EC%97%AD]. '
                    'MOIS 출구 레이어(2026-04-30)에는 이 역이 없음')
a['shelter'] = {'designated': True, 'name': '암사역사공원역 지하(지하1층)', 'area_m2': 7666, 'capacity': 7666, 'designated_on': '2024-08-10',
                'grade': '[확인: https://file.localdata.go.kr/file/civil_defense_shelter_info/info] 관리번호 3240000-S202400001, 사용중'}
a['transfer'] = None
a['notes'] = ('S-Map 실내 모델 없음: smap/subway.json 322개 모델 가운데 이 역 좌표(127.13556, 37.55667) 800 m 안에 모델이 없고 이름·파일명에도 없음(가장 가까운 것 명일역 0.94 km, 암사역 1.05 km). '
              '별내선(8호선 연장) 서울 구간 유일 역으로 서울교통공사 운영, 다음 역 장자호수공원까지 3.5 km 한강 하저터널. '
              '지하 7층 집수정·배수펌프실은 승강장 층이 아님([발췌: 나무위키, 2024-07 라돈 보도]). 환승 없음. '
              'settlement stations.json에는 이미 같은 깊이 17.28 m가 들어 있음.')

c = S('청량리')
c['lines'].setdefault('수인분당선', {})
c['notes'] = ('수인분당선 승강장은 지하가 아니라 지상 1F 1번 홈(경춘선과 1·2번 홈 공유)이다. S-Map 청량리 모델이 B2에서 끝나는 것은 1호선(서울교통공사, B2 승강장, OA-13305 5.34 m) 때문이며 수인분당선 지하층을 빠뜨린 것이 아니다. '
              '코레일 구역: 1F 승강장(1~8번 홈), 2F 콘코스·표내는 곳, 3F 맞이방(민자역사), B1~B2 1호선 환승통로·롯데백화점 연결통로. GTX-C·면목선 등 계획 노선은 다루지 않음.')

g = S('서울역')
g['lines']['GTX-A'] = {
    'depth_m': None, 'depth_m_reported': [50, 60], 'floor': '승강장 층 번호 미공개(보도는 "지하 3층" 표기, 실제로는 긴 에스컬레이터 2회)',
    'structure': '지하(대단면 터널형 정거장)', 'platform': None,
    'grade': ('[발췌: https://www.korea.kr/news/reporterView.do?newsId=148955530] 약 50 m / '
              '[발췌: https://www.e-science.co.kr/news/articleView.html?idxno=139655] DL이앤씨 ITA 수상 보도 약 60 m, 대합실·승강장·환승통로 약 5,300 m², 폭 최대 31 m, 높이 20 m 이상 / '
              '[발췌: https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003092268] "지하 3층" 표기'),
    'floor_grade': 'KRIC GTX-A 자료(1277~1279)는 수서~동탄 남부 구간만 있어 서울역·연신내는 없음',
    'prev': {'depth_m': 50}}
g['notes'] = '공식 미터 값 없음. 정부 보도 계열(korea.kr) 50 m와 시공사 보도 60 m가 갈림. 기본값은 50 m 유지 권장, 60 m는 터널 바닥 기준일 수 있음 [추정].'

y = S('연신내')
y['lines']['GTX-A'] = {
    'depth_m': None, 'depth_m_reported': [50], 'floor': 'B8', 'concourse': 'B1(개찰구)',
    'structure': '지하(대단면 터널형 정거장)',
    'grade': ('[발췌: http://news.lghellovision.net/news/articleView.html?idxno=493158] 지하 50 m, 지하 8층 승강장, 전용 고속 엘리베이터 약 3분 / '
              '[발췌: https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003092268] B1 개찰구에서 B8까지 에스컬레이터 7번 / '
              '[발췌: https://www.mygoyang.com/news/articleView.html?idxno=82464] 지하 50 m'),
    'floor_grade': '[발췌] 두 보도 모두 B8. KRIC 자료 없음',
    'prev': {'depth_m': 50}}

su = S('수서')
if 'GTX-A' in su['lines']:
    su['lines']['GTX-A']['notes'] = 'KRIC 1278: GTX-A 승강장 B4, 대합실 B3·B1, 피난안전구역 B3. 미터 값은 없음'

out.setdefault('삼성', {'lines': {}, 'exits': None, 'notes': ''})['notes'] = (
    'settlement 데이터의 삼성역은 2호선만 있어 GTX-A 삼성역(영동대로 복합환승센터, 2026년 현재 미개통)은 대상 밖으로 둠.')

# ---- exits from MOIS for stations lacking exit data ----
E = [f for o in (0, 2000) for f in json.load(open(f'{GD}/dl_mois/exit_{o}.json', encoding='utf-8'))['features']]


def nrm(s):
    s = re.sub(r'\(.*?\)', '', s).strip().replace(' ', '')
    return s[:-1] if s.endswith('역') and len(s) > 2 else s


cnt = collections.Counter()
for s in stations:
    if s['map_artefact'] or s['exits'] is not None:
        continue
    n = nrm(s['name_ko'])
    lat, lon = s['lat'], s['lon']
    ex = []
    for f in E:
        if nrm(f['attributes']['stn_nm']) != n:
            continue
        gx, gy = f['geometry']['x'], f['geometry']['y']
        d = math.hypot((gx - lon) * 88200, (gy - lat) * 111000)
        if d < 1500:
            ex.append({'no': f['attributes']['entrc_no'], 'label': f['attributes']['entrc_nm'], 'lat': round(gy, 6), 'lon': round(gx, 6),
                       'dist_m': round(d)})
    st = out.setdefault(s['name_ko'], {'lines': {}, 'exits': None, 'notes': ''})
    if ex:
        seen = {}
        for x in sorted(ex, key=lambda x: (x['no'], x['dist_m'])):
            seen.setdefault((x['no'], x['label']), x)
        st['exits'] = list(seen.values())
        st['exits_count'] = len({x['no'] for x in st['exits']})
        st['exits_grade'] = (f'[확인: {MOIS}] 행정안전부 도로명주소 지하철 출구 점(2026-04-30 기준, 가공 레이어 {MOIS_FS}/0). '
                             '번호와 좌표만 있고 주변 시설명은 없음. 역 하나에 여러 노선이 있어도 출구는 역 단위')
        cnt['exits_found'] += 1
    else:
        st['exits_grade'] = 'MOIS 출구 레이어에 이 역 없음(신림선 전체는 원자료에서 빠졌다고 명시)'
        cnt['exits_missing'] += 1
    st['exits_lines'] = s['lines']

datasets = [
    {'id': 'KRIC-933', 'name': '전국 도시광역철도 역사 엘리베이터 현황', 'url': K933,
     'download': 'https://data.kric.go.kr/rips/dataset/download.file?type=filedata&id=933&operation=1', 'file': 'dl_kric/k933.bin(.csv)',
     'coverage': '전국 모든 운영기관(서울메트로9호선㈜, 남서울경전철(신림선), 우이신설경전철, 신분당선, 코레일, 공항철도, 김포골드라인, 서해철도, GTX-A 남부 등) 3,828행. 상세위치 문자열에 층과 승강장 방향이 들어 있어 승강장 층을 읽을 수 있음. 기준일 2025-12-31',
     'used_for': '비서울교통공사 노선 승강장 층 [확인]'},
    {'id': 'KRIC-932', 'name': '전국 도시광역철도 역사 에스컬레이터 현황', 'url': K932,
     'download': 'https://data.kric.go.kr/rips/dataset/download.file?type=filedata&id=932&operation=1', 'file': 'dl_kric/k932.bin(.csv)',
     'coverage': '8,162행, 시작·종료 층과 상세위치. 기준일 2026-05-31', 'used_for': '승강장 층 교차 확인'},
    {'id': 'KRIC-1278/1279', 'name': 'GTX-A 엘리베이터·역사정보', 'url': K1278, 'file': 'dl_kric/k1278.csv, k1279.csv',
     'coverage': '수서~동탄(남부, 2024-04) 구간만. 서울역·연신내 없음', 'used_for': '수서 GTX-A B4'},
    {'id': 'KRIC-1294', 'name': '전국 도시광역철도 역사정보', 'url': K1294, 'file': 'settlement _dl/kric/k1294.txt',
     'coverage': '승강장 유형(섬식/상대식 등), 도로명주소, 좌표', 'used_for': 'platform 필드'},
    {'id': 'KRIC 기관별', 'name': '9호선(528/505)·신림선(1187/1186)·우이신설(530/977)·신분당(1031/1030)·공항철도(1147/1146)·코레일(1069/1068)·김포골드(1199)·서해(1247) 승강기',
     'file': 'dl_kric/k*.csv', 'coverage': '933/932와 같은 내용의 기관별 원본. 대조용으로만 받아 둠', 'used_for': '-'},
    {'id': 'OA-13305', 'name': '서울교통공사 역사심도정보(1~8호선 276행)', 'url': OA13305, 'file': 'settlement _dl/depth/depth18.csv',
     'coverage': '서울교통공사 1~8호선만. 옛 역명(을지3가, 미아삼거리, 동대문운동장, 숭실대, 이수, 뚝섬유원지, 당고개, DMC, 애오게(오기) 등)이 그대로 남아 있음',
     'used_for': '역명 별칭 대조로 13건 실측 깊이 회수, 층→깊이 환산표'},
    {'id': 'OA-22446', 'name': '9호선 2·3단계 역사 심도', 'url': 'https://data.seoul.go.kr/dataList/OA-22446/F/1/datasetView.do',
     'coverage': '언주~중앙보훈병원 13역만. 9호선 1단계(개화~신논현, 서울시메트로9호선㈜ 운영) 심도는 공개 자료 없음(서울시 미디어허브 기사도 같은 설명)', 'used_for': '-'},
    {'id': 'MOIS-subway-exit', 'name': '행정안전부 전국 지하철 노선 및 출구 정보(Esri Korea 가공 레이어)', 'url': MOIS,
     'download': f'{MOIS_FS}/0/query (where=1=1, 서울 bbox, outFields=*, f=json)', 'file': 'dl_mois/exit_0.json, exit_2000.json, station.json',
     'coverage': '서울 bbox 안 출구 2,016점, 366역. 번호·좌표만. 신림선 전체와 일부 역(암사역사공원 등)은 없음. 원자료는 도로명주소 기타자료(business.juso.go.kr), 기준일 2026-04-30',
     'used_for': '출입구 수가 비어 있던 역의 출구 번호·좌표'},
    {'id': 'OA-21211', 'name': '서울시 지하철 출입구 리프트 위치정보', 'url': 'https://data.seoul.go.kr/dataList/OA-21211/S/1/datasetView.do',
     'coverage': '리프트 위치만(일반 출입구 아님). 받지 않음', 'used_for': '-'},
    {'id': 'LOCALDATA-shelter', 'name': '민방위대피시설', 'url': 'https://file.localdata.go.kr/file/civil_defense_shelter_info/info',
     'file': 'settlement _dl/shelter/seoul.csv', 'coverage': '암사역사공원역 지하(지하1층) 7,666 m² 확인', 'used_for': '암사역사공원 대피시설'},
]

meta = {'generated': '2026-11-15', 'scope': 'settlement stations.json의 [확인] 아닌 노선별 깊이 147건 + 암사역사공원·청량리·서울역·연신내 특별 항목 + 출입구 공백 역',
        'counts': dict(upd, **cnt),
        'floor_to_depth_calibration': {'source': OA13305, 'median_platform_depth_m_by_floor': CAL, 'n_by_floor': CALN},
        'field_notes': {'depth_m': '공식 미터 값만, 없으면 null', 'depth_m_est': '[추정] 환산값', 'floor': '승강장 층(KRIC 운영기관 층 표기). 코레일 역사는 민자역사 기준 층 번호라 지면 높이와 다를 수 있음',
                        'prev': 'settlement stations.json 원래 값'}}
json.dump({'meta': meta, 'stations': out, 'datasets': datasets}, open(GD + '/gaps.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(meta['counts'], CAL)
