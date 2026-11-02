"""Bounded CPU refinement of frozen recovery16 edges; never changes alpha."""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


def refine(rgb, rgba):
    alpha = rgba[:, :, 3]
    matte = np.median(rgb[:40].reshape(-1, 3), axis=0)
    inward = np.asarray(distance_transform_edt(alpha > 0))
    stable = (alpha == 255) & (inward >= 3)
    distance = np.asarray(distance_transform_edt(~stable))
    indices = np.asarray(distance_transform_edt(~stable, return_distances=False, return_indices=True))
    donor = rgb[indices[0], indices[1]].astype(float)
    direction = donor - matte
    norm = (direction * direction).sum(axis=2)
    coverage = np.clip(((rgb.astype(float) - matte) * direction).sum(axis=2)
                       / np.maximum(norm, 1), 0, 1)
    residual = np.max(np.abs(rgb.astype(float) - matte
                            - coverage[:, :, None] * direction), axis=2)
    eligible = ((alpha > 0) & (alpha < 255) & (distance <= 6)
                & (norm > 60 ** 2) & (residual <= 12) & (coverage < 0.98))
    output = rgba.copy()
    output[:, :, :3][eligible] = np.round(donor[eligible]).astype(np.uint8)
    return output, eligible, matte


def verify(rgb, before, after, eligible):
    assert np.array_equal(before[:, :, 3], after[:, :, 3])
    assert np.array_equal(before[before[:, :, 3] == 255], after[before[:, :, 3] == 255])
    assert np.array_equal(before[~eligible], after[~eligible])
    assert np.all(after[after[:, :, 3] == 0, :3] == 0)
    edge = (before[:, :, 3] > 0) & (np.asarray(distance_transform_edt(before[:, :, 3] > 0)) <= 2)
    pale_before = edge & (rgb.min(axis=2) > 140) & (rgb.max(axis=2) - rgb.min(axis=2) < 30)
    pale_after = edge & (after[:, :, :3].min(axis=2) > 140) & (after[:, :, :3].max(axis=2) - after[:, :, :3].min(axis=2) < 30)
    assert pale_after.sum() < pale_before.sum() * 0.4
    return {'paleNearEdgeBefore': int(pale_before.sum()), 'paleNearEdgeAfter': int(pale_after.sum()),
            'changedRGBPixels': int(np.any(before[:, :, :3] != after[:, :, :3], axis=2).sum()),
            'alphaIdentical': True, 'allOpaquePixelsIdentical': True, 'outsideEligibleIdentical': True}


if __name__ == '__main__':
    root = Path(__file__).resolve().parents[3]
    source = Path('/Users/ilseoblee/workspace/seoul-dengoku-tools/ART-ASSETS/portrait-training/recovery16-native-generated-v1')
    target = root / 'ART-ASSETS/portrait-training/recovery16-alpha-refinement-v1'
    target.mkdir(parents=True, exist_ok=True)
    original_manifest = json.loads((source / 'manifest.json').read_text())
    pins = {row['path']: row['sha256'] for row in original_manifest['files']}
    records = []
    for person in ['person-1008', 'person-1004']:
        rgb_path = source / f'{person}-340x510-RGB.png'
        rgba_path = source / f'{person}-340x510-RGBA.png'
        for path in [rgb_path, rgba_path]:
            assert hashlib.sha256(path.read_bytes()).hexdigest() == pins[path.name]
        rgb = np.array(Image.open(rgb_path).convert('RGB'))
        before = np.array(Image.open(rgba_path).convert('RGBA'))
        after, eligible, matte = refine(rgb, before)
        checks = verify(rgb, before, after, eligible)
        output = target / f'{person}-defringed.png'
        assert not output.exists()
        Image.fromarray(after).save(output)
        sheet = Image.new('RGB', (1020, 510))
        for index, background in enumerate([(0, 0, 0), (255, 255, 255), (35, 105, 155)]):
            view = Image.new('RGBA', (340, 510), background + (255,))
            view.alpha_composite(Image.fromarray(after))
            sheet.paste(view.convert('RGB'), (index * 340, 0))
        sheet.save(target / f'{person}-composites.png')
        zoom = sheet.crop((50, 60, 300, 290)).resize((750, 690), Image.Resampling.NEAREST)
        zoom.save(target / f'{person}-hair-zoom.png')
        records.append({'personId': person, 'sourceRGB': str(rgb_path), 'sourceRGBA': str(rgba_path),
                        'sourceRGBSHA256': pins[rgb_path.name], 'sourceRGBASHA256': pins[rgba_path.name],
                        'output': str(output), 'outputSHA256': hashlib.sha256(output.read_bytes()).hexdigest(),
                        'matteEstimate': matte.tolist(), 'checks': checks})
    print(json.dumps(records))
