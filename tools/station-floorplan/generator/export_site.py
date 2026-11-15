"""Export the station stronghold sheets (out/<station>/data.json + <station>.png) to the public Pages site.

Writes
  data/sql/130-strongholds.sql      stronghold, stronghold_floor, stronghold_stage, stronghold_stage_text,
                                    stronghold_terrain_text, stronghold_terrain_type (Korean and English)
  data/sql/131-gdd-strongholds.sql  GDD category 'settlement' and the design-method document (gdd/*.md next to this file)
  site/assets/strongholds/<slug>-ground.webp, <slug>-underground.webp   crops of the sheet, max width 1100 px

English text is generated from the English templates below, which mirror stages.py (WORKS, ARC_WORKS, FACIL, LABOR,
DURATION, ENTRY, TERRAIN). Korean text is read from data.json. Nothing is machine-translated per station.
When stages.py is importable (--tools, default the scratch tools folder) every Korean template and every station's
terrain sentence is checked against it, so the English mirror cannot drift silently.

Usage: python export_site.py [--out DIR] [--tools DIR] [--repo DIR] [--no-images]
"""
import argparse, glob, io, json, math, os, re, sqlite3, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_DEFAULT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SCRATCH = 'E:/git/seoul-dengoku-wiki-wt/scratch/floorplan'

# ---- English mirror of stages.py -------------------------------------------------------------------------------
NAME_EN = {1: 'Entrance Post', 2: 'Concourse Stronghold', 3: 'Station Precinct Defence', 4: 'Surface Perimeter Line',
           5: 'Inter-Station Defence Network'}
ARC_NAME_EN = {4: 'Deep-Level Seal'}
WORKS_EN = {
    1: 'Lower the shutters and block the unused entrances with sandbags. One entrance stays in use, with a guard post and a gate',
    2: 'Bulkheads and gates in the tunnels at both ends of the platform, the ticket-gate line hardened into an inner checkpoint, temporary materials replaced with brick and concrete',
    3: 'Entrances sorted into used, hidden and sealed doors, an airlock (double door) at every door in use, covers and grilles on the vents, outposts 100-300 m inside the tunnels, fire compartments for the living sections',
    4: 'A surface defence line around the entrances that joins measured city blocks, an outer buffer (a cleared strip 30-100 m wide), watchtowers and checkpoints, basements of adjoining buildings taken in',
    5: 'Tunnels to the neighbouring stations turned into safe passages (midway posts, lighting, signal lines), tunnel sections used as housing and growing rooms, one deep station designated as the shelter, a responsible group for every section',
}
ARC_WORKS_EN = {
    4: 'Deep-level seal: surface entrances blocked and camouflaged, digging down below the deep tunnels and machine rooms, no light or heat let out at the surface',
    5: 'Passages that join the deep lines into one mass, few and narrow passages to the outside, a shared reserve in the last-stand zone (data centre, sanctuary)',
}
FACIL_EN = {
    1: 'Water drums, a first-aid corner, one shared kitchen',
    2: 'Storerooms (shallow levels), water tanks, toilets, a clinic corner, a register desk, a tool corner',
    3: 'Clinic and isolation room, school, ration point, workshops, mushroom growing rooms, laundry, mortuary (shallow levels)',
    4: 'Surface storehouses and cold storage, summer greenhouses, a firewood yard, surface workshops (unheated)',
    5: 'District storehouse, market (large interchanges), communications, maintenance base, hospital (possibly one of only two or three in all of Seoul)',
}
LABOR_EN = {1: '10-20 person-days to block one entrance, 10 for a guard post', 2: '1,000-3,000 person-days in total',
            3: '3,000-8,000 person-days in total', 4: '2-10 person-days per metre of raised barrier, 20-50 per watchtower',
            5: '200-500 person-days to make 100 m of tunnel habitable, 30 per midway post'}
DURATION_EN = {1: 'A few hours to 3 days', 2: '2 weeks to 3 months', 3: '6 months to 3 years', 4: '3 to 10 years', 5: '10 to 30 years'}
ENTRY_EN = {
    1: 'At least 10 people come in and there is a threat',
    2: '14 days survived, a water source secured, population of 40 or more',
    3: 'Occupancy of 75% or more or one attack withstood, reserves for 60 days or more, at least 10% spare labour',
    4: 'Population above the stage 3 capacity so that people outside the register live outside, or a change in the surface threat; reserves for 120 days or more; emergency watch no larger than the mobilisable force',
    5: 'At least one neighbouring station at stage 3 or higher, a shared threat or market and passage gains, a political agreement',
}
TERRAIN_EN = {
    'ridge': ('Ridge type', {3: 'Air intakes placed upslope (upwind) and exhaust sent down into the valley',
                             4: 'The line runs along the ridge and slopes. The tallest building or rocky knoll is the watchtower, the slope itself is the cleared strip, and grilles close the sewer outlets on the valley side',
                             5: 'Signal points on the ridge keep a line of sight to the neighbouring stations'}),
    'river': ('Riverside type', {3: 'Sumps and drainage pumps in the last-stand zone, grilles at the ends of the drains on the river side',
                                 4: 'The river is the moat on one side. The embankment is the wall, bridges and sewer outlets are the gates. A frozen river becomes a road in winter, so there is an ice watch post',
                                 5: 'One bridge is blocked and one is held as the crossing'}),
    'rail': ('Rail embankment type', {3: 'Underpasses and passages below the tracks hardened into inner gates',
                                      4: 'The railway embankments and cuttings are ready-made ramparts. Barriers stand on top, the underpasses and spaces below the rail bridges are the gates, and the top of the embankment is the line of watchtowers',
                                      5: 'Surface tracks become haul roads (push carts); rail bridges are gates that can be cut or joined'}),
    'tower': ('High-rise block type', {3: 'Basements of adjoining high-rise buildings used as precinct storerooms',
                                       4: 'The outer walls of the high-rise buildings form the wall. Ground and first-floor windows are blocked, the rooftops are watchtowers, and only the gaps between buildings get barriers',
                                       5: 'High-rise buildings are linked through underground car parks and connecting passages, so people move between them without going outside'}),
    'estate': ('Apartment estate type', {3: 'A passage is cut from the estate\'s underground car park to the station precinct',
                                         4: 'The apartment estate wall is the inner wall and the estate main gate is the gate. Yards between the blocks become vegetable plots and a firewood yard',
                                         5: 'Neighbouring estates are taken in one by one, joining several estate strongholds'}),
    'warren': ('Alley warren type', {3: 'Basements of low-rise buildings above the entrances used as hidden storerooms',
                                     4: 'Only a few alley mouths stay open and the rest are blocked into a maze of dead ends; building walls are broken through to make inner passages',
                                     5: 'Passages through buildings are joined toward the neighbouring station, giving a route that never goes outside'}),
    'plain': ('Flat ground type', {3: 'For a shallow station, pairing with a deep neighbour comes first',
                                   4: 'With no terrain to lean on, banks are raised and ditches dug. Wide roads are kept as the cleared strip (field of fire), with watchtowers at the corners',
                                   5: 'A shallow station cannot stand alone. It exists only as a pair with a deep neighbour'}),
}
CAP_BY = {'공간': 'space', '공기': 'air', '물': 'water'}
F_SRC_EN = {'S-Map 지하 층 실측': 'S-Map underground floors, measured', 'S-Map 역사 층 실측(지상역)': 'S-Map station-hall floors, measured (surface station)',
            '서울교통공사 역사 연면적': 'Seoul Metro station gross floor area'}
WATER_NOTE_EN = {'': '', '눈 녹이기(연료 추가)': 'Melting snow (extra fuel)'}
GROUND_BOX = (38, 108, 1082, 1192)          # ground panel of the sheet at native 2600 px width (border colour 61,106,153)
UG_LEFT, UG_RIGHT, UG_TOP, BORDER = 1112, 2578, 108, (61, 106, 153)
MAX_W, QUALITY = 1100, 60


def q(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return '1' if v else '0'
    if isinstance(v, (int, float)): return repr(v) if isinstance(v, float) else str(v)
    return "'" + str(v).replace("'", "''") + "'"


def ins(table, cols, rows):
    return ''.join(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(q(r[c]) for c in cols)});\n" for r in rows)


def slugify(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def ug_bottom(im):
    near = lambda p: all(abs(a - b) <= 12 for a, b in zip(p, BORDER))
    x = UG_LEFT + 1
    if not near(im.getpixel((x, UG_TOP + 1))): return None
    y = UG_TOP + 1
    while y + 1 < im.height and near(im.getpixel((x, y + 1))): y += 1
    return y + 1 if y - UG_TOP > 50 else None


def webp(img, path):
    from PIL import Image
    if img.width > MAX_W: img = img.resize((MAX_W, round(img.height * MAX_W / img.width)), Image.LANCZOS)
    img.save(path, 'WEBP', quality=QUALITY, method=6)
    return img.size, os.path.getsize(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=f'{SCRATCH}/out')
    ap.add_argument('--tools', default=f'{SCRATCH}/tools')
    ap.add_argument('--repo', default=REPO_DEFAULT)
    ap.add_argument('--no-images', action='store_true')
    a = ap.parse_args()

    db = sqlite3.connect(':memory:')
    for f in ('000-schema.sql', '035-factions.sql', '120-map-core.sql'):
        db.executescript(open(os.path.join(a.repo, 'data/sql', f), encoding='utf-8').read())
    mst = {r[2]: dict(zip(('id', 'name', 'name_ko', 'district', 'district_ko', 'sort'), r[:2] + r[2:6]))
           for r in db.execute('SELECT id, name, name_ko, district, district_ko, sort FROM map_station')}
    terrain = {t['name']: t for t in json.load(open(os.path.join(a.out, '_terrain/terrain.json'), encoding='utf-8'))}

    ref = None
    if os.path.isfile(os.path.join(a.tools, 'stages.py')):
        sys.path.insert(0, a.tools); import stages as ref  # noqa: E402

    names = sorted(d for d in os.listdir(a.out) if os.path.isfile(os.path.join(a.out, d, 'data.json')))
    img_dir = os.path.join(a.repo, 'site/assets/strongholds')
    if not a.no_images:
        os.makedirs(img_dir, exist_ok=True)
        for f in glob.glob(os.path.join(img_dir, '*.webp')): os.remove(f)
    slugs = {}
    rows, floors, stage_rows, texts = [], [], [], {}
    img_bytes = 0; missing_ug = []
    for name in names:
        d = json.load(open(os.path.join(a.out, name, 'data.json'), encoding='utf-8'))
        if 'stages' not in d: raise SystemExit(f'E_STALE: {name} has no stages')
        m = mst.get(name)
        if not m: raise SystemExit(f'E_NO_MAP_STATION: {name}')
        slug = slugify(m['name'])
        if slug in slugs: raise SystemExit(f'E_DUP_SLUG: {slug} ({name}, {slugs[slug]})')
        slugs[slug] = name
        S = d['stages']; inp = S['inputs']; tr = S['terrain']; fac = d['faction']
        t = terrain.get(name, {})
        reading = {k: t.get(k) for k in ('elev_min', 'elev_max', 'relief_m', 'station_elev', 'slope_p90_pct', 'steep_share',
                                         'river_dist_m', 'river_m2_300', 'rail_m2_300', 'cutfill_m_300', 'levee_m_300', 'wall_m_300',
                                         'road_share', 'bld_count', 'bld_cover', 'floors_mean_w', 'highrise_share', 'apt_count',
                                         'small_bld_share', 'roof_max_m', 'ug_floor_m2', 'depth_max_m', 'underpass_m2', 'scores')}
        per = d.get('perimeter')
        per_pub = {k: per[k] for k in ('stats', 'share', 'length', 'blocks', 'area_m2', 'guards_need', 'guards_avail', 'n_cuts', 'outposts') if k in per} if per else None
        if per and per.get('watch'): per_pub['watch_floors'] = per['watch'].get('floors'); per_pub['watch_top_m'] = per['watch'].get('top_m')
        img = {'img_ground': None, 'img_ground_w': None, 'img_ground_h': None, 'img_under': None, 'img_under_w': None, 'img_under_h': None}
        png = os.path.join(a.out, name, f'{name}.png')
        if not a.no_images and os.path.isfile(png):
            from PIL import Image
            im = Image.open(png).convert('RGB')
            (w, h), n = webp(im.crop(GROUND_BOX), os.path.join(img_dir, f'{slug}-ground.webp'))
            img.update(img_ground=f'{slug}-ground.webp', img_ground_w=w, img_ground_h=h); img_bytes += n
            bottom = ug_bottom(im)
            if bottom:
                (w, h), n = webp(im.crop((UG_LEFT, UG_TOP, UG_RIGHT, bottom + 1)), os.path.join(img_dir, f'{slug}-underground.webp'))
                img.update(img_under=f'{slug}-underground.webp', img_under_w=w, img_under_h=h); img_bytes += n
            else: missing_ug.append(name)
        neigh = [mst[n]['id'] for n in S.get('neighbours', []) if n in mst]
        rows.append({'id': slug, 'sort': m['sort'], 'station_id': m['id'], 'name': m['name'], 'name_ko': m['name_ko'],
                     'district': m['district'], 'district_ko': m['district_ko'], 'faction_id': fac, 'start_stage': S['start_stage'],
                     'terrain_primary': tr['primary'], 'terrain_tags': json.dumps(tr.get('tags', [])),
                     'shelter_station_id': mst[S['shelter']]['id'] if S.get('shelter') in mst else None,
                     'neighbour_ids': json.dumps(neigh, ensure_ascii=False), 'population': inp['P'], 'f_station_m2': inp['F_station_m2'],
                     'e_used': inp['E_used'], 'e_hidden': inp['E_hidden'], 'e_sealed': inp['E_sealed'], 'tunnel_cuts': inp['tunnel_cuts'],
                     'f_station_src': F_SRC_EN[inp['F_station_src']], 'f_station_src_ko': inp['F_station_src'],
                     'water_note': WATER_NOTE_EN[inp['water_note']], 'water_note_ko': inp['water_note'],
                     'roof_catch_m2': inp['roof_catch_m2'], 'roof_water_m3_day': inp['roof_water_m3_day'],
                     'vents': inp['vents'], 'vents_measured': 0 if str(inp.get('vents_src', '')).startswith('[') else 1, 'q_m3h': inp['Q_m3h'],
                     'water_l': inp['water_L'], 'fuel_kg': inp['fuel_kg'], 'l_surface_m': inp['L_surface_m'], 'f_bld_m2': inp['F_bld_m2'],
                     'f_tunnel_m2': inp['F_tunnel_m2'], 'k_w': inp['k_w'], 'm_share': inp['M_share'], 'building_count': len(d.get('buildings', [])),
                     'exit_count': len(d.get('exits', [])), 'terrain_json': json.dumps(reading, ensure_ascii=False),
                     'perimeter_json': json.dumps(per_pub) if per_pub else None, **img})
        for i, fl in enumerate(d.get('floors', [])):
            floors.append({'stronghold_id': slug, 'sort': i, 'floor': fl.get('floor'), 'depth_m': fl.get('depth_m'), 'walk_m2': fl.get('walk_m2'),
                           'has_rail': bool(fl.get('has_rail')), 'use_ko': fl.get('use_2126') or ''})
        tags = tr.get('tags', [])[:2]
        for st in S['stages']:
            k = st['stage']; variant = 'arc' if fac == 'arc' and k in (4, 5) else 'common'
            key = (k, variant)
            tx = {'stage': k, 'variant': variant, 'name': ARC_NAME_EN.get(k, NAME_EN[k]) if variant == 'arc' else NAME_EN[k], 'name_ko': st['name'],
                  'works': ARC_WORKS_EN[k] if variant == 'arc' else WORKS_EN[k], 'works_ko': st['works'], 'facilities': FACIL_EN[k], 'facilities_ko': st['facilities'],
                  'labor': LABOR_EN[k], 'labor_ko': st['labor'], 'duration': DURATION_EN[k], 'duration_ko': st['duration'], 'entry': ENTRY_EN[k], 'entry_ko': st['entry']}
            if key in texts and texts[key] != tx: raise SystemExit(f'E_TEMPLATE_DRIFT: stage {key} differs at {name}')
            texts[key] = tx
            tw_en = '; '.join(TERRAIN_EN[tg][1][k] for tg in tags if tg in TERRAIN_EN and k in TERRAIN_EN[tg][1]) if k >= 3 else ''
            if ref:
                tw_ko = '; '.join(ref.TERRAIN[tg][1][k] for tg in tags if tg in ref.TERRAIN and k in ref.TERRAIN[tg][1]) if k >= 3 else ''
                if tw_ko != st['terrain_works']: raise SystemExit(f'E_TERRAIN_DRIFT: {name} stage {k}')
            stage_rows.append({'stronghold_id': slug, 'stage': k, 'variant': variant, 'terrain_works': tw_en, 'terrain_works_ko': st['terrain_works'],
                               'floor_m2': st['floor_m2'], 'capacity': st['capacity'], 'cap_by_max': CAP_BY[st['cap_by_max']],
                               'living_capacity': st['living_capacity'], 'cap_by': CAP_BY[st['cap_by']], 'over_living': bool(st['over']), 'over_max': bool(st['overflow']),
                               'air_speed': st['air_speed'], 'overcrowd_limit': st['overcrowd_limit'],
                               'guard_standing': st['guard_standing'], 'guard_emergency': st['guard_emergency'], 'mobilisable': st['mobilisable'],
                               'defensible': bool(st['defensible']), 'food_t': st['food_t'], 'water_m3': st['water_m3'], 'fuel_t': st['fuel_t'],
                               'surface_line_m': st.get('surface_line_m', 0), 'surface_line_real_m': st.get('surface_line_real_m', 0), 'watchtowers': st.get('watchtowers', 0)})
    if ref:  # Korean templates must equal stages.py, so the English mirror covers exactly what the sheets say
        for (k, v), tx in texts.items():
            want = {'name_ko': ('깊은 층 봉쇄' if v == 'arc' and k == 4 else ref.STAGES[k - 1][1]),
                    'works_ko': ref.ARC_WORKS[k] if v == 'arc' else ref.WORKS[k], 'facilities_ko': ref.FACIL[k],
                    'labor_ko': ref.LABOR[k], 'duration_ko': ref.DURATION[k], 'entry_ko': ref.ENTRY[k]}
            for c, w in want.items():
                if tx[c] != w: raise SystemExit(f'E_REF_DRIFT: stage {k}/{v} {c}')
        if set(ref.TERRAIN) != set(TERRAIN_EN): raise SystemExit('E_REF_DRIFT: terrain types')
    terr_rows = [{'id': k, 'sort': i, 'label': TERRAIN_EN[k][0], 'label_ko': (ref.TERRAIN[k][0] if ref else k)} for i, k in enumerate(TERRAIN_EN)]
    terr_text = [{'terrain_id': k, 'stage': s, 'text': TERRAIN_EN[k][1][s], 'text_ko': ref.TERRAIN[k][1][s] if ref else ''} for k in TERRAIN_EN for s in (3, 4, 5)]

    schema = """-- Station strongholds (역 거점): perimeter from real blocks and terrain, five expansion stages. PROVISIONAL (잠정).
-- Generated by tools/station-floorplan/generator/export_site.py from the floorplan sheets. Do not edit by hand.
CREATE TABLE IF NOT EXISTS stronghold (id TEXT PRIMARY KEY, sort INTEGER NOT NULL, station_id TEXT NOT NULL, name TEXT NOT NULL, name_ko TEXT NOT NULL, district TEXT NOT NULL, district_ko TEXT NOT NULL, faction_id TEXT NOT NULL, start_stage INTEGER NOT NULL, terrain_primary TEXT NOT NULL, terrain_tags TEXT NOT NULL, shelter_station_id TEXT, neighbour_ids TEXT NOT NULL, population INTEGER NOT NULL, f_station_m2 INTEGER NOT NULL, f_station_src TEXT NOT NULL, f_station_src_ko TEXT NOT NULL, water_note TEXT NOT NULL, water_note_ko TEXT NOT NULL, roof_catch_m2 INTEGER NOT NULL, roof_water_m3_day REAL NOT NULL, e_used INTEGER NOT NULL, e_hidden INTEGER NOT NULL, e_sealed INTEGER NOT NULL, tunnel_cuts INTEGER NOT NULL, vents INTEGER NOT NULL, vents_measured INTEGER NOT NULL, q_m3h INTEGER NOT NULL, water_l REAL NOT NULL, fuel_kg REAL NOT NULL, l_surface_m INTEGER NOT NULL, f_bld_m2 INTEGER NOT NULL, f_tunnel_m2 INTEGER NOT NULL, k_w REAL NOT NULL, m_share REAL NOT NULL, building_count INTEGER NOT NULL, exit_count INTEGER NOT NULL, terrain_json TEXT NOT NULL, perimeter_json TEXT, img_ground TEXT, img_ground_w INTEGER, img_ground_h INTEGER, img_under TEXT, img_under_w INTEGER, img_under_h INTEGER);
CREATE TABLE IF NOT EXISTS stronghold_floor (stronghold_id TEXT NOT NULL REFERENCES stronghold(id), sort INTEGER NOT NULL, floor TEXT NOT NULL, depth_m REAL, walk_m2 INTEGER, has_rail INTEGER NOT NULL, use_ko TEXT NOT NULL, PRIMARY KEY (stronghold_id, sort));
CREATE TABLE IF NOT EXISTS stronghold_terrain_type (id TEXT PRIMARY KEY, sort INTEGER NOT NULL, label TEXT NOT NULL, label_ko TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS stronghold_terrain_text (terrain_id TEXT NOT NULL REFERENCES stronghold_terrain_type(id), stage INTEGER NOT NULL, text TEXT NOT NULL, text_ko TEXT NOT NULL, PRIMARY KEY (terrain_id, stage));
CREATE TABLE IF NOT EXISTS stronghold_stage_text (stage INTEGER NOT NULL, variant TEXT NOT NULL, name TEXT NOT NULL, name_ko TEXT NOT NULL, works TEXT NOT NULL, works_ko TEXT NOT NULL, facilities TEXT NOT NULL, facilities_ko TEXT NOT NULL, labor TEXT NOT NULL, labor_ko TEXT NOT NULL, duration TEXT NOT NULL, duration_ko TEXT NOT NULL, entry TEXT NOT NULL, entry_ko TEXT NOT NULL, PRIMARY KEY (stage, variant));
CREATE TABLE IF NOT EXISTS stronghold_stage (stronghold_id TEXT NOT NULL REFERENCES stronghold(id), stage INTEGER NOT NULL, variant TEXT NOT NULL, terrain_works TEXT NOT NULL, terrain_works_ko TEXT NOT NULL, floor_m2 INTEGER NOT NULL, capacity INTEGER NOT NULL, cap_by_max TEXT NOT NULL, living_capacity INTEGER NOT NULL, cap_by TEXT NOT NULL, over_living INTEGER NOT NULL, over_max INTEGER NOT NULL, air_speed REAL NOT NULL, overcrowd_limit INTEGER NOT NULL, guard_standing INTEGER NOT NULL, guard_emergency INTEGER NOT NULL, mobilisable INTEGER NOT NULL, defensible INTEGER NOT NULL, food_t REAL NOT NULL, water_m3 INTEGER NOT NULL, fuel_t REAL NOT NULL, surface_line_m INTEGER NOT NULL, surface_line_real_m INTEGER NOT NULL, watchtowers INTEGER NOT NULL, PRIMARY KEY (stronghold_id, stage));

"""
    rows.sort(key=lambda r: r['sort'])
    sql = schema
    sql += ins('stronghold_terrain_type', ['id', 'sort', 'label', 'label_ko'], terr_rows)
    sql += ins('stronghold_terrain_text', ['terrain_id', 'stage', 'text', 'text_ko'], terr_text)
    sql += ins('stronghold_stage_text', list(next(iter(texts.values())).keys()), [texts[k] for k in sorted(texts)])
    sql += ins('stronghold', list(rows[0].keys()), rows)
    sql += ins('stronghold_floor', list(floors[0].keys()), floors)
    sql += ins('stronghold_stage', list(stage_rows[0].keys()), stage_rows)
    with open(os.path.join(a.repo, 'data/sql/130-strongholds.sql'), 'w', encoding='utf-8', newline='\n') as fh: fh.write(sql)

    # GDD design-method document (hand-written Markdown next to this script, both languages)
    gdd = os.path.join(HERE, 'gdd')
    en = open(os.path.join(gdd, 'stronghold-design.en.md'), encoding='utf-8').read()
    ko = open(os.path.join(gdd, 'stronghold-design.ko.md'), encoding='utf-8').read()
    title = lambda md: re.match(r'#\s+(.+)', md).group(1).strip()
    doc = {'id': 'doc.SETTLEMENT-001', 'category_id': 'settlement', 'slug': 'station-stronghold-stages', 'title': title(en), 'title_ko': title(ko),
           'summary': 'How a station stronghold is drawn from real city blocks and terrain, and how it grows through five stages. Provisional.',
           'summary_ko': '실측 블록과 지형으로 역 거점의 성곽을 긋고 다섯 단계로 키우는 방법. 잠정.',
           'status': 'proposal', 'sort': 0, 'source_path': 'tools/station-floorplan/generator/gdd/stronghold-design.ko.md', 'body_md': en, 'body_ko_md': ko}
    gsql = ('-- GDD: settlement and stronghold design (provisional).\n-- Generated by tools/station-floorplan/generator/export_site.py from gdd/stronghold-design.{en,ko}.md.\n'
            + ins('gdd_category', ['id', 'sort', 'label', 'label_ko'], [{'id': 'settlement', 'sort': 8, 'label': 'Settlement & Stronghold Design', 'label_ko': '정착지·거점 설계'}])
            + ins('gdd_document', list(doc.keys()), [doc]))
    with open(os.path.join(a.repo, 'data/sql/131-gdd-strongholds.sql'), 'w', encoding='utf-8', newline='\n') as fh: fh.write(gsql)

    print(f'strongholds {len(rows)}, floors {len(floors)}, stage rows {len(stage_rows)}, stage templates {len(texts)}, '
          f'reference check {"stages.py" if ref else "SKIPPED (stages.py not found)"}')
    if not a.no_images:
        print(f'images {sum(1 for r in rows if r["img_ground"]) + sum(1 for r in rows if r["img_under"])} '
              f'(no underground panel: {len(missing_ug)}) total {img_bytes / 1e6:.1f} MB')
        if img_bytes > 60e6: raise SystemExit('E_IMAGES_TOO_HEAVY: over 60 MB')


if __name__ == '__main__':
    main()
