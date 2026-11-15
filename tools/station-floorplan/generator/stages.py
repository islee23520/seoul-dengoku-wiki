"""Five expansion stages of a station stronghold (v4, provisional), with capacity computed from measured inputs.

Design sources (private research, .omo/handoff/v4/settlement/research/fortification/):
  A east Asia, B Europe/Mideast/Africa, C Americas/Oceania/modern urban, D growth stages and capacity (formulas 3.3, table 3.4).
World-facing names use current standard Korean words only; historical names stay in the design lens.

Measured inputs per station:
  F_station  underground walkable floor of all S-Map indoor models (depth > 1.5 m)
  P          2126 population (station-floorplans.json)
  E_u/E_h/E_s exits in use / hidden / sealed (S-Map markers, 2126 state rules)
  V          real station vents (서울교통공사 환기구 table) else 2 + degree
  F_bld      underground floors of buildings inside the stage-4 line (도로명주소 건물 und_flo_co x footprint x 0.7)
  L_surface  stage-4 line weighted by kind: built barrier/cut/gap 1.0, building face/wall 0.5, river/rail/bank 0.25
  degree     neighbours on the map graph; tunnel cuts C = degree x (2 if deepest platform >= 25 m else 1)
Open owner questions (defaults marked): arms factor k_w, surface heating taboo, living in running tunnels, stage names.
"""
import math

STAGES = [
    (1, '출입구 초소', '문과 망루(설계 렌즈)'),
    (2, '대합실 거점', '굳힌 안뜰'),
    (3, '역 구내 방어', '이웃 구역 고리'),
    (4, '지상 외곽 방어선', '바깥 고리와 앞 시설'),
    (5, '역간 방어 체계', '마디들의 그물'),
]
PHI = {1: 0.25, 2: 0.55, 3: 0.85, 4: 0.85, 5: 0.85}
A_M2 = {1: 1.5, 2: 3.5, 3: 5.5, 4: 8, 5: 10}
Q_M3H = {1: 3, 2: 6, 3: 12, 4: 25, 5: 25}
W_L = {1: 5, 2: 7.5, 3: 15, 4: 20, 5: 25}
T_FOOD = {1: 14, 2: 60, 3: 120, 4: 180, 5: 365}
T_WATER = {1: 3, 2: 7, 3: 14, 4: 30, 5: 60}
GROW = {1: 0, 2: 0, 3: 0.05, 4: 0.15, 5: 0.25}
WORKSHOP = {1: 0.5, 2: 1, 3: 1.5, 4: 2, 5: 2.5}
WATER_GRADE_L = {'남음': 50, '넉넉': 25, '보통': 15, '모자람': 7.5, '없음': 0}
FACTION = {   # mobilisable share, standing watch per post, arms factor k_w (owner question: guns)
    'government': {'M': 0.20, 'r': 4.5, 'k_w': 0.2},
    'free-city': {'M': 0.27, 'r': 4.0, 'k_w': 0.3},
    'arc': {'M': 0.30, 'r': 4.0, 'k_w': 0.4},
}
KIND_W = {'cut': 1.0, 'gap': 1.0, 'facade': 0.5, 'wall': 0.5, 'natural': 0.25}
ROOF_YIELD = 1.4 / 365 * 0.8   # [추정] m3 per m2 roof per day: Seoul normal ~1,400 mm (rain + snow), 80 % collected
AIR_SPEED = {1: 1.0, 2: 1.0, 3: 2.0, 4: 2.5, 5: 3.0}   # [추정] m/s through each 4 m2 shaft: natural draught, then fans (D 3.2 Q)
TUNNEL_W = 9.0; TUNNEL_LEN = 300.0      # [추정] box tunnel width, length held toward each neighbour in stage 5

WORKS = {   # physical works per stage (common), from D 3.4
    1: '셔터를 내리고 쓰지 않는 출입구를 모래주머니로 막는다. 쓰는 출입구 하나에 초소와 문',
    2: '승강장 양 끝 터널에 방벽과 문, 개찰구 선을 안쪽 검문선으로 굳힘, 임시 재료를 벽돌·콘크리트로 바꿈',
    3: '출입구를 쓰는·숨긴·막은 문으로 정리, 쓰는 문마다 전실(이중문), 환기구 덮개와 창살, 터널 안 100~300 m 전초, 사는 칸 방화 구획',
    4: '출입구 둘레 지상에 실측 블록을 이은 방어선, 바깥 완충 지대(비워 둔 띠 30~100 m), 망루와 검문소, 붙은 건물 지하 편입',
    5: '이웃 역까지 터널을 안전 통로로(중간 초소·조명·신호선), 터널 구간을 거처·재배실로, 깊은 역 하나를 대피소로 지정, 구간별 책임',
}
ARC_WORKS = {
    4: '깊은 층 봉쇄: 지상 출입구를 막고 위장, 대심도 터널·기계실 아래로 파 내려감, 빛과 열을 지상에 내지 않음',
    5: '깊은 노선끼리 한 덩어리로 잇는 통로, 바깥과 잇는 통로는 적고 좁게, 최후 구역(데이터센터·성소) 공동 비축',
}
FACIL = {
    1: '물통, 응급 구석, 공동 취사 하나',
    2: '창고(얕은 층), 저수조, 화장실, 진료 자리, 명부 자리, 공구 자리',
    3: '진료소와 격리실, 학교, 배급소, 작업장, 버섯 재배실, 세탁, 안치소(얕은 층)',
    4: '지상 창고와 냉장, 여름 온실, 땔감 마당, 지상 작업장(데우지 않음)',
    5: '권역 창고, 장(큰 환승역), 통신, 정비 기지, 병원(서울 전체 2~3곳 가운데 하나일 수 있음)',
}
LABOR = {1: '출입구 하나 막기 10~20, 초소 10 인일', 2: '전체 1,000~3,000 인일', 3: '전체 3,000~8,000 인일',
         4: '세운 방벽 1 m당 2~10, 망루 하나 20~50 인일', 5: '터널 100 m 거처화 200~500, 중간 초소 하나 30 인일'}
DURATION = {1: '몇 시간~3일', 2: '2주~3달', 3: '6달~3년', 4: '3~10년', 5: '10~30년'}
ENTRY = {
    1: '사람 10명 이상이 들어오고 위협이 있음',
    2: '14일 생존, 물원 확보, 인구 40명 이상',
    3: '점유율 75% 이상 또는 공격 한 번을 버팀, 비축 60일 이상, 남는 일손 10% 이상',
    4: '인구가 3단계 정원을 넘어 명부 밖 사람이 바깥에 삶 또는 지상 위협 변화, 비축 120일 이상, 비상 경계 ≤ 동원 가능',
    5: '이웃 역 하나 이상이 3단계 이상, 공동 위협이나 장·통행 이익, 정치 합의',
}
# terrain archetype -> how stages 3-5 use the real ground (A/B/C synthesis tables)
TERRAIN = {
    'ridge': ('산성형', {3: '급기구를 비탈 위쪽(공기 상류)에 두고 배기는 골짜기 아래로',
                       4: '능선과 비탈을 따라 두른다. 가장 높은 건물·바위 언덕이 망루, 비탈 자체가 비워 둔 띠, 골짜기 쪽 하수 수구에 창살',
                       5: '능선 위 신호 자리로 이웃 역과 보이는 줄을 잇는다'}),
    'river': ('수변형', {3: '집수정과 배수펌프를 최후 구역에, 하천 쪽 배수 관로 끝에 창살',
                       4: '하천 한쪽이 해자다. 둑이 성벽, 다리와 하수 출구가 문. 겨울에 언 하천은 길이 되므로 얼음 감시 초소',
                       5: '다리 하나를 막고 하나는 지켜 건너는 길로 쓴다'}),
    'rail': ('철도성토형', {3: '철길 아래 지하차도와 통로를 안쪽 문으로 굳힌다',
                         4: '철도 성토·절토가 이미 둑이다. 둑 위에 방벽, 지하차도와 철교 아래가 문, 성토 위가 망루 줄',
                         5: '지상 선로를 짐 나르는 길로(밀차), 철교는 끊고 잇는 문'}),
    'tower': ('고층블록형', {3: '붙은 고층 건물의 지하층을 구내 창고로',
                          4: '고층 건물의 외벽 줄이 성벽, 1~2층 창을 막고 고층 꼭대기가 망루, 건물 사이 틈만 방벽',
                          5: '고층 건물끼리 지하 주차장·연결 통로로 이어 지상에 나가지 않고 오간다'}),
    'estate': ('단지형', {3: '단지 지하 주차장을 구내와 잇는 통로를 낸다',
                        4: '아파트 단지 담장이 안뜰 성벽, 단지 정문이 성문, 동 사이 마당이 텃밭과 땔감 마당',
                        5: '이웃 단지를 차례로 편입해 단지 성채 여럿을 잇는다'}),
    'warren': ('골목형', {3: '출입구 위 저층 건물의 지하실을 숨긴 창고로',
                        4: '골목 입구 몇 곳만 열고 나머지는 막아 막다른 미로로, 건물 벽을 뚫어 안쪽 통로를 낸다',
                        5: '건물 안 통로를 이어 이웃 역 방향으로 지상에 나가지 않는 길을 낸다'}),
    'plain': ('평지형', {3: '얕은 역이면 깊은 이웃 역과 짝을 맺는 것이 먼저',
                       4: '기댈 지형이 없어 둑을 쌓고 해자를 판다. 넓은 길은 비워 둔 띠(사격 띠)로, 모서리에 망루',
                       5: '얕은 역은 혼자 서지 못한다. 깊은 이웃 역과의 짝으로만 성립'}),
}


def compute(st, plan, faction, terrain, f_station, exits, vents_n, degree, depth_max, per=None, f_bld=0.0, vents_s4=0, vents_s5=0, f_src='S-Map 지하 층 실측', roof_m2=0.0):
    P = int(plan.get('pop_2126') or 0)
    fx = FACTION.get(faction, FACTION['government'])
    E_u = sum(1 for e in exits if e['state'] == 'used'); E_h = sum(1 for e in exits if e['state'] == 'hidden')
    E_s = sum(1 for e in exits if e['state'] == 'sealed')
    t = 2 if depth_max >= 25 else 1; C = max(1, degree) * t
    V = vents_n or (2 + degree)
    Q = V * 4.0 * 1.0 * 3600                 # [추정] 4 m2 shaft, natural draught 1 m/s
    water_L = WATER_GRADE_L.get(plan.get('water') or '보통', 15)
    f = float(plan.get('fuel_kg_per_person_day') or 1.2)
    L_sur = sum(per['stats'][k] * KIND_W[k] for k in KIND_W) if per else 0.0
    F_t = degree * TUNNEL_LEN * TUNNEL_W
    rows = []
    M = fx['M'] * P
    for k, name, lens in STAGES:
        floor = PHI[k] * f_station + (f_bld if k >= 4 else 0) + (F_t if k == 5 else 0)
        Vk = V + (vents_s4 if k >= 4 else 0) + (vents_s5 if k == 5 else 0)
        Qk = Vk * 4.0 * AIR_SPEED[k] * 3600
        cap_space = floor / A_M2[k]; cap_air = Qk / Q_M3H[k]; cap_water = P * water_L / W_L[k] if water_L else 0
        W_live = P * water_L / 1000 + (roof_m2 * ROOF_YIELD if k >= 4 else 0)
        cap_water = W_live * 1000 / W_L[k] if W_live else 0
        living = int(min(cap_space, cap_air, cap_water)) if W_live else int(min(cap_space, cap_air))
        # maximum holding (crowded but survivable: 3.5 m2, 6 m3/h shelter air, 7.5 L survival water) grows with every stage
        full_floor = f_station + (f_bld if k >= 4 else 0) + (F_t if k == 5 else 0)
        W_day = P * water_L / 1000 + (roof_m2 * ROOF_YIELD if k >= 4 else 0)      # m3/day: current source + roof catchment inside the line
        mx_space = full_floor / 3.5; mx_air = Qk / 6.0; mx_water = W_day * 1000 / 7.5 if W_day else 1e12
        cap = int(min(mx_space, mx_air, mx_water))
        cap_by_max = min((('공간', mx_space), ('공기', mx_air), ('물', mx_water)), key=lambda x: x[1])[0]
        limit = int((f_station + (f_bld if k >= 4 else 0) + (F_t if k == 5 else 0)) / 3.5) if k >= 2 else int(PHI[1] * f_station / 1.0)
        n_inner = 0 if k < 2 else (1 if k == 2 else 2)
        n_watch = math.ceil(L_sur / 200) if (k >= 4 and per) else 0
        posts = (1 if k == 1 else E_u) + (E_h if k >= 3 else 0) + (C if k >= 2 else 0) + (V if k >= 3 else 0) + n_inner + n_watch
        r = 3 if k == 1 else fx['r']
        G_s = r * posts + 2 * 3 * math.ceil(E_s / 5)
        surf = fx['k_w'] * L_sur if (k >= 4 and per) else 0
        G_e = 4 * ((1 if k == 1 else E_u) + (E_h if k >= 3 else 0) + (C if k >= 2 else 0)) + surf + 0.02 * P
        food_t = P * 0.6 * T_FOOD[k] / 1000
        water_m3 = P * W_L[k] * T_WATER[k] / 1000
        fuel_t = P * f * T_FOOD[k] / 1000
        rows.append({
            'stage': k, 'name': ('깊은 층 봉쇄' if (faction == 'arc' and k == 4) else name), 'lens': lens,
            'air_speed': AIR_SPEED[k], 'works': ARC_WORKS.get(k) if faction == 'arc' and k in ARC_WORKS else WORKS[k],
            'terrain_works': '; '.join(TERRAIN[tg][1][k] for tg in terrain.get('tags', [])[:2] if tg in TERRAIN and k in TERRAIN[tg][1]) if k >= 3 else '',
            'facilities': FACIL[k], 'floor_m2': round(floor), 'capacity': cap, 'cap_by_max': cap_by_max, 'living_capacity': living,
            'cap_by': min((('공간', cap_space), ('공기', cap_air), ('물', cap_water if water_L else 1e9)), key=lambda x: x[1])[0],
            'overcrowd_limit': limit, 'over': P > living, 'overflow': P > cap, 'guard_standing': round(G_s), 'guard_emergency': round(G_e),
            'mobilisable': round(M), 'defensible': G_e <= M, 'food_t': round(food_t, 1), 'granary_m2': round(1.4 * food_t),
            'water_m3': round(water_m3), 'fuel_t': round(fuel_t, 1), 'fuel_store_m2': round(fuel_t * 1000 / 500 / 2 / 0.7),
            'toilets': math.ceil(P / (50 if k == 1 else 20)), 'washing': math.ceil(P / (250 if k <= 2 else 100)),
            'beds': math.ceil(1.8 * P / 1000) if k >= 3 else 0, 'isolation': math.ceil(P / 1000) if k >= 3 else 0,
            'schools': math.ceil(P / 5000) if k >= 3 else 0, 'ration_points': math.ceil(P / 5000),
            'grow_share': GROW[k], 'workshop_m2': round(WORKSHOP[k] * P), 'labor': LABOR[k], 'duration': DURATION[k], 'entry': ENTRY[k],
            'surface_line_m': round(L_sur) if (k >= 4 and per) else 0, 'surface_line_real_m': (per.get('length') or 0) if (k >= 4 and per) else 0, 'watchtowers': n_watch, 'vents_k': Vk, 'air_m3h': round(Qk),
            'max_by_floor': int((f_station + (f_bld if k >= 4 else 0) + (F_t if k == 5 else 0)) / 3.5),
        })
    # 2126 starting stage (D 3.8): most stations 3; big interchanges 4 when stage 4 is defensible; surface/terminal stations 2
    start = 3
    typ = plan.get('type') or ''
    if '큰 환승역' in typ and rows[3]['defensible']: start = 4
    if (st.get('structure') or '').startswith(('지상', '고가')) or degree <= 1: start = 2
    if P and P < 40: start = 1
    inputs = {'P': P, 'F_station_m2': round(f_station), 'F_station_src': f_src, 'water_note': '눈 녹이기(연료 추가)' if not water_L else '', 'roof_catch_m2': round(roof_m2), 'roof_water_m3_day': round(roof_m2 * ROOF_YIELD, 1), 'E_used': E_u, 'E_hidden': E_h, 'E_sealed': E_s, 'tunnel_cuts': C,
              'vents': V, 'vents_src': '서울교통공사 환기구 표' if vents_n else '[추정] 2+이웃 수', 'Q_m3h': round(Q),
              'water_L': water_L, 'fuel_kg': f, 'L_surface_m': round(L_sur), 'F_bld_m2': round(f_bld), 'F_tunnel_m2': round(F_t),
              'k_w': fx['k_w'], 'M_share': fx['M'], 'vents_s4_add': vents_s4, 'vents_s5_add': vents_s5}
    return {'stages': rows, 'start_stage': start, 'inputs': inputs,
            'terrain': {'primary': terrain.get('primary'), 'tags': terrain.get('tags', []),
                        'label': TERRAIN.get(terrain.get('primary'), ('?',))[0]}}
