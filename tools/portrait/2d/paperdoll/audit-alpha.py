import hashlib
import json
import subprocess
import sys
from collections import Counter
from PIL import Image

results = []
for path in sys.argv[1:]:
    with open(path, 'rb') as stream:
        raw = stream.read()
    image = Image.open(path)
    rgba = image.convert('RGBA')
    alpha = rgba.getchannel('A')
    pillow_bytes = alpha.tobytes()
    magick_bytes = subprocess.check_output(['magick', path, '-alpha', 'extract', '-depth', '8', 'gray:-'])
    counts = Counter(pillow_bytes)
    interior = Counter()
    width, height = image.size
    # Report a fixed center box, not a segmentation or a corrective threshold.
    for y in range(height // 3, height * 2 // 3):
        for x in range(width // 3, width * 2 // 3):
            interior[pillow_bytes[y * width + x]] += 1
    chunks = []
    offset = 8
    while offset < len(raw):
        size = int.from_bytes(raw[offset:offset+4], 'big')
        chunks.append({'type': raw[offset+4:offset+8].decode('ascii'), 'bytes': size})
        offset += size + 12
    results.append({'path': path, 'sha256': hashlib.sha256(raw).hexdigest(), 'size': image.size, 'mode': image.mode,
                    'IHDR': {'bitDepth': raw[24], 'colorType': raw[25], 'interlace': raw[28]}, 'chunks': chunks,
                    'profileFields': list(image.info), 'pillowMagickExactAlphaAgreement': pillow_bytes == magick_bytes,
                    'alphaSha256': hashlib.sha256(pillow_bytes).hexdigest(), 'histogram': dict(sorted(counts.items())),
                    'centerBoxHistogram': dict(sorted(interior.items())), 'alphaMode': counts.most_common(6),
                    'zero': counts[0], 'opaque255': counts[255], 'partial': sum(v for k,v in counts.items() if 0<k<255),
                    'max': max(counts)})
print(json.dumps(results, indent=2))
