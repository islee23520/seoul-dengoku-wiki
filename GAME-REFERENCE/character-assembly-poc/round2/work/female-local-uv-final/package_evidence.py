"""Compose actual render comparisons and retain machine-readable evidence."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent


def main() -> None:
    names = ['front','back','side','quarter','head-neck','left-hand','right-hand','feet']
    sheet = Image.new('RGB',(8*320,2*344),'white')
    draw = ImageDraw.Draw(sheet)
    diffs = []
    receipts = [json.loads((HERE/f'{stage}-render-receipt.json').read_text()) for stage in ['before','after']]
    for index,name in enumerate(names):
        a,b = (next(v for v in receipt['views'] if v['view']==name) for receipt in receipts)
        assert all(a[key]==b[key] for key in ['source_world_bounds','camera_world','center_world','ortho_scale'])
        arrays = []
        for row,stage in enumerate(['before','after']):
            path = HERE/'renders'/f'{stage}-worldframed-v2'/f'{name}.png'
            with Image.open(path) as image:
                arrays.append(np.asarray(image.convert('RGB')))
                sheet.paste(image.convert('RGB').resize((320,320)),(index*320,row*344))
            draw.text((index*320+4,row*344+322),f'{stage}: {name}',fill='black')
        changed = np.any(arrays[0]!=arrays[1],axis=2)
        diffs.append({'view':name,'changed_pixels':int(changed.sum()),'total_pixels':int(changed.size),'world_camera_identical':True})
    sheet.save(HERE/'checker-before-after.png')
    report = {'camera_comparison':diffs,'render_pass':'AtlasUV 64-frequency unlit checker',
              'visual_assessment':'Whole-body placement and broad chart readability preserved. Head facial features, fingers and toes remain visibly fragmented from the inherited atlas. Local changes are small at these views; no claim of full artistic UV quality.',
              'color_status':'UNPROVEN; see COLOR-STATUS.md',
              'evidence_sha256':hashlib.sha256((HERE/'checker-before-after.png').read_bytes()).hexdigest()}
    (HERE/'visual-review.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'event':'EVIDENCE_PACKAGED','camera_pairs':len(diffs),'pixel_changes':diffs}),flush=True)


if __name__ == '__main__':
    main()
