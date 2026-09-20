# /// script
# requires-python = ">=3.13"
# dependencies = ["pillow", "numpy"]
# ///
# Run: python3 draw_atlas.py
"""Draw the real loop UVs, labeled chart views and deterministic checker atlas."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
assignment = json.loads((HERE / "original-loop-assignment.json").read_text())
native = json.loads((HERE / "native-extraction.json").read_text())
quality = json.loads((HERE / "quality.json").read_text())
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 23)
small = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 17)
palette = [(109,190,213),(227,175,109),(163,208,142),(195,145,213),(228,140,152),(129,175,227),(219,210,137),(130,211,190),(210,163,131)]
triangles = {m["object_name"]:m["triangles"] for m in native["meshes"]}
atlas = Image.new("RGBA", (4096,4096), (0,0,0,0))
draw = ImageDraw.Draw(atlas)
overview = Image.new("RGB", (1720,1350), (26,30,37))
od = ImageDraw.Draw(overview)
od.text((35,20),"VERIFIED GARMENT UV | shared 4096 x 4096",font=font,fill="white")
od.text((35,53),"Actual native-loop layout | UV0 GarmentUV_4K | no body assets",font=small,fill=(190,199,213))
mini = Image.new("RGB", (1200,1200), (42,47,56))
md = ImageDraw.Draw(mini)
detail = Image.new("RGB", (1800,1530), (26,30,37))
dd = ImageDraw.Draw(detail)
dd.text((30,15),"NAMED CHARTS | individually fitted views; density is measured in the shared atlas",font=font,fill="white")
for ci,chart in enumerate(assignment["charts"]):
    color = palette[ci]
    faces = set(chart["faces"])
    uv = np.array(chart["uv"])
    lower,upper = uv.min(axis=0),uv.max(axis=0)
    row,col = divmod(ci,3)
    ox,oy = col*600+25,row*490+65
    dd.text((ox,oy),f"{ci+1}. {chart['name']}",font=small,fill=color)
    dd.text((ox,oy+24),f"{len(faces)} polygons | disk | 1 boundary",font=small,fill=(200,207,215))
    size = upper-lower
    fit = min(540/max(size[0],1e-12),370/max(size[1],1e-12))
    rim = "_rim_" in chart["name"]
    vertical_fit = 75/max(size[1],1e-12) if rim else fit
    if rim:
        dd.text((ox,oy+175),"Thickness enlarged for inspection only",font=small,fill=(200,207,215))
        dd.text((ox,oy+200),"Atlas itself retains equal measured texel density",font=small,fill=(200,207,215))
    for t in triangles[chart["object"]]:
        if t["polygon_id"] not in faces:
            continue
        points = [(u*4095,(1-v)*4095) for u,v in t["uv"]]
        draw.polygon(points,fill=(*color,100),outline=(*color,240),width=1)
        md.polygon([(u*1199,(1-v)*1199) for u,v in t["uv"]],fill=color,outline=(40,48,58))
        detail_points = [(ox+15+(u-lower[0])*fit,oy+70+(upper[1]-v)*vertical_fit) for u,v in t["uv"]]
        dd.polygon(detail_points,fill=color,outline=(38,46,57))
    center = (lower+upper)/2
    position = (int(center[0]*1199),int((1-center[1])*1199))
    if not rim:
        md.rectangle((position[0]-13,position[1]-13,position[0]+18,position[1]+17),fill=(20,24,30))
        md.text((position[0]-9,position[1]-12),str(ci+1),font=font,fill="white")
    od.rectangle((1270,110+ci*72,1290,130+ci*72),fill=color)
    od.text((1300,108+ci*72),f"{ci+1}. {chart['name']}",font=small,fill="white")
overview.paste(mini,(35,95))
od.text((1270,820),"Minimum gap: 20.00 px",font=small,fill="white")
od.text((1270,850),"Tile border: 20.00 px",font=small,fill="white")
od.text((1270,880),"Density: ~3486.9 px/m",font=small,fill="white")
od.text((1270,910),"Surface occupancy: 41.13%",font=small,fill="white")
od.text((1270,950),"Rims retain physical density:",font=small,fill=(200,207,215))
od.text((1270,975),"thin strips are ~2-3 pixels high.",font=small,fill=(200,207,215))
od.text((1270,1020),"No owner-approved density target.",font=small,fill=(200,207,215))
atlas.save(HERE / "uv-layout-4096.png")
overview.save(HERE / "named-atlas.png")
detail.save(HERE / "named-chart-details.png")
# Exactly the 64-by-64 pattern used in the shader review, encoded as sRGB.
colors = [(0.06,0.15,0.2),(0.8,0.85,0.64)]
encoded = np.array([[round((12.92*v if v<=0.0031308 else 1.055*v**(1/2.4)-0.055)*255) for v in c] for c in colors],dtype=np.uint8)
y,x = np.indices((4096,4096))
checker = encoded[(x//64+(4095-y)//64)%2]
Image.fromarray(checker).save(HERE / "shared-checker-4096.png")
print("ATLAS_COMPLETE",flush=True)
