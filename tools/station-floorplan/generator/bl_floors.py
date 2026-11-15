# Blender headless: render each S-Map floor of a station glb top-down (orthographic), write PNG + meta json.
import bpy, sys, json, os, re, math
from mathutils import Vector
argv = sys.argv[sys.argv.index('--')+1:]
glb, outdir = argv[0], argv[1]
px_per_m = float(argv[2]) if len(argv) > 2 else 4.0
roles = json.load(open(argv[3], encoding='utf-8')) if len(argv) > 3 and os.path.exists(argv[3]) else {}
angle = float(argv[4]) if len(argv) > 4 else 0.0
froles = json.load(open(argv[5], encoding='utf-8')) if len(argv) > 5 and os.path.exists(argv[5]) else {'materials': {}, 'labels': {}}
FAC = ('gate', 'machine', 'escalator', 'stair', 'elevator')
def frole_of(name):
    fm = froles['materials']
    for k in (name, name.split('.')[0], re.sub(r'\.\d{3}$', '', name)):
        if k in fm: return k, fm[k]
    return None, None  # CCW radians: model frame -> north-up EPSG:5179 frame
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
from mathutils import Matrix
for o in list(bpy.context.scene.objects):
    if o.parent is None:
        o.matrix_world = Matrix.Rotation(angle, 4, 'Z') @ o.matrix_world
bpy.context.view_layer.update()
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
def role_of(name):
    return roles.get(name) or roles.get(name.split('.')[0]) or roles.get(re.sub(r'\.\d{3}$', '', name))
def fkey(name):
    k = name.split('_R')[0].split('.')[0]
    return 'B' + k[2:] if re.match(r'^B0[0-9]', k) else k
groups = {}
for o in meshes:
    groups.setdefault(fkey(o.name), []).append(o)
# global bbox in world (Blender Z up after gltf import: glTF Y-up -> Blender Z-up)
def bbox(objs):
    xs=[];ys=[];zs=[]
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); xs.append(w.x); ys.append(w.y); zs.append(w.z)
    return min(xs),max(xs),min(ys),max(ys),min(zs),max(zs)
gb = bbox(meshes)
pad = 10
x0,x1,y0,y1 = gb[0]-pad, gb[1]+pad, gb[2]-pad, gb[3]+pad
W = x1-x0; H = y1-y0
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.view_settings.view_transform = 'Standard'
sh = scene.display.shading
sh.light = 'FLAT'; sh.color_type = 'TEXTURE'
sh.show_backface_culling = True
scene.display.render_aa = '8'
scene.render.film_transparent = True
scene.render.resolution_x = int(W*px_per_m); scene.render.resolution_y = int(H*px_per_m)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
cam_data = bpy.data.cameras.new('top'); cam_data.type = 'ORTHO'
cam_data.ortho_scale = max(W, H)
cam = bpy.data.objects.new('top', cam_data); scene.collection.objects.link(cam); scene.camera = cam
cam.location = ((x0+x1)/2, (y0+y1)/2, gb[5]+100); cam.rotation_euler = (0,0,0)
cam_data.clip_end = 10000
for m in bpy.data.materials:
    m.diffuse_color = (0.85, 0.1, 0.1, 1) if role_of(m.name) == 'rail' else (1, 1, 1, 1)
meta = {'glb': os.path.basename(glb), 'angle': angle, 'bbox_xy': [x0,x1,y0,y1], 'px_per_m': px_per_m,
        'size': [scene.render.resolution_x, scene.render.resolution_y], 'floors': {}}
for k, objs in groups.items():
    for o in meshes: o.hide_render = o not in objs
    b = bbox(objs)
    # ceiling cut: render only from above, back-faces culled so ceilings facing down are hidden
    scene.render.filepath = os.path.join(outdir, f'{k}.png')
    sh.color_type = 'TEXTURE'
    bpy.ops.render.render(write_still=True)
    # role pass: rails red, everything else white
    sh.color_type = 'MATERIAL'
    scene.render.filepath = os.path.join(outdir, f'role_{k}.png')
    bpy.ops.render.render(write_still=True)
    # floor level: area-weighted mode of upward faces' z
    import collections
    hist = collections.Counter(); rail_area = 0.0; rail_polys = []; fac = {}
    for o in objs:
        mw = o.matrix_world; ms = o.data.materials
        for p in o.data.polygons:
            if ms and p.material_index < len(ms) and ms[p.material_index]:
                mk, fr = frole_of(ms[p.material_index].name)
                if fr in FAC:
                    co = [mw @ o.data.vertices[i].co for i in p.vertices]
                    fac.setdefault(fr, []).append({'xy': [[round(c.x, 2), round(c.y, 2)] for c in co], 'z': round(sum(c.z for c in co) / len(co), 2),
                                                   'label': froles['labels'].get(mk, '')})
            n = (mw.to_3x3() @ p.normal).normalized()
            if n.z > 0.9:
                z = (mw @ p.center).z; hist[round(z * 2) / 2] += p.area
                if ms and p.material_index < len(ms) and ms[p.material_index] and role_of(ms[p.material_index].name) == 'rail':
                    rail_area += p.area
                    rail_polys.append([[round((mw @ o.data.vertices[i].co).x, 2), round((mw @ o.data.vertices[i].co).y, 2)] for i in p.vertices])
    lvl = hist.most_common(1)[0][0] if hist else b[4]
    json.dump(rail_polys, open(os.path.join(outdir, f'railpoly_{k}.json'), 'w'))
    json.dump(fac, open(os.path.join(outdir, f'facpoly_{k}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    meta['floors'][k] = {'parts': [o.name for o in objs], 'z': [b[4], b[5]], 'floor_z': lvl, 'rail_area': rail_area,
                         'walk_area': sum(hist.values()), 'tris': sum(len(o.data.polygons) for o in objs)}
json.dump(meta, open(os.path.join(outdir, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
print('DONE', json.dumps({k: v['z'] for k, v in meta['floors'].items()}))
