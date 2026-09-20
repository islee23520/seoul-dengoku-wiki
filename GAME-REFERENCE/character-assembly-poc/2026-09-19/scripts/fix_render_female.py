# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Remove 1 degenerate face, verify, and render female base."""
import sys
from pathlib import Path
import bmesh
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from mesh_tools import boundary_groups, components, orient_surface

assert bpy.app.background
obj=bpy.data.objects['Female_Base_Assembly']
mesh=obj.data
bm=bmesh.new();bm.from_mesh(mesh);bm.normal_update()

# Find and fix degenerate faces
degens=[f for f in bm.faces if f.calc_area()<1e-12]
print(f'Degenerate faces: {len(degens)}',flush=True)
if degens:
    for f in degens:
        print(f'  face {f.index}: area={f.calc_area():.2e}, verts={len(f.verts)}, center={[round(c,5) for c in f.calc_center_median()]}',flush=True)
    bmesh.ops.delete(bm,geom=degens,context='FACES_ONLY')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    orient_surface(bm)
    bm.normal_update()

# Verify clean
parts=components(bm)
remaining=boundary_groups(bm)
wind=sum(1 for e in bm.edges if e.is_manifold and not e.is_contiguous)
junc=sum(1 for e in bm.edges if len(e.link_faces)>2)
degen2=sum(1 for f in bm.faces if f.calc_area()<1e-12)
print(f'After fix: {len(parts)} components, boundaries={[len(g) for g in remaining]}, winding={wind}, junction={junc}, degenerate={degen2}',flush=True)

bm.to_mesh(mesh);bm.free()
mesh.normals_split_custom_set([(0,0,0)]*len(mesh.loops))
for p in mesh.polygons:p.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/female-base-clean.blend'))

# Render
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=900;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world=bpy.data.worlds.new('FQAW');scene.world.color=(.35,.35,.35)
mat=bpy.data.materials.new('FQAClay');mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.46,.34,.25,1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
scene.view_layers[0].material_override=mat
camera=bpy.data.objects.new('FQACam',bpy.data.cameras.new('FQACam'));scene.collection.objects.link(camera);scene.camera=camera
camera.data.type='ORTHO';camera.data.clip_start=.001;camera.data.clip_end=5
for i,offset in enumerate([(-2,-3,4),(2,-1,2),(0,3,3)]):
    light=bpy.data.objects.new(f'FQAL{i}',bpy.data.lights.new(f'FQAL{i}','AREA'));scene.collection.objects.link(light)
    light.location=Vector(offset);light.data.energy=[300,120,200][i];light.data.size=3
    light.rotation_euler=(Vector((0,0,.8))-light.location).to_track_quat('-Z','Y').to_euler()
output=ROOT/'evidence/female-base';output.mkdir(parents=True,exist_ok=True)
for view,direction in [('front',(0,-3,0)),('back',(0,3,0)),('left',(-3,0,0)),('right',(3,0,0)),('quarter',(2,-3,.5))]:
    camera.location=Vector(direction);camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.ortho_scale=2.2
    scene.render.filepath=str(output/f'{view}.png');bpy.ops.render.render(write_still=True)
print('FEMALE_BASE_CLEAN_AND_RENDERED',flush=True)
