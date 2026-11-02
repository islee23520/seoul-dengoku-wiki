#!/usr/bin/env python3
"""Split a two-part BJD base sheet (head on top, torso below) into separate
square images for the face and the body, both normalized to a common size
(1024x1024) with the piece centered on the background color.

v2: nothing may be clipped.
- Lower fg threshold so low-contrast regions (pale bald scalp) count as part.
- Split point = the WIDEST empty-row gap between the top and bottom of the
  content, instead of trusting per-band mass (v1 mis-dropped a detached head
  crown as a "speck" and cropped the top of the head off).
- Both outputs are resized to the same square size, content centered.

Usage: python3 split_bjd_sheet.py SHEET.png [SHEET2.png ...]
Outputs: <stem>-face.png and <stem>-body.png next to each input.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

OUT_SIZE = 1024
FG_THRESHOLD = 30  # low: keep pale scalp/soft edges inside the piece


def find_bg_color(arr: np.ndarray) -> np.ndarray:
    ring = np.concatenate([
        arr[:6].reshape(-1, 3),
        arr[-6:].reshape(-1, 3),
        arr[:, :6].reshape(-1, 3),
        arr[:, -6:].reshape(-1, 3),
    ])
    colors, counts = np.unique(ring, axis=0, return_counts=True)
    return colors[counts.argmax()].astype(np.int16)


def find_split(arr: np.ndarray) -> tuple[int, int, np.ndarray, np.ndarray]:
    """Return (gap_start, gap_end, fg_mask, row_counts).

    (gap_start, gap_end) = the WIDEST run of essentially-empty rows that lies
    strictly between the first and last content row. The face piece lives
    entirely above gap_start; the body piece entirely below gap_end.
    """
    h, w, _ = arr.shape
    bg = find_bg_color(arr)
    dist = np.abs(arr.astype(np.int16) - bg).sum(axis=2)
    fg = dist > FG_THRESHOLD
    row_counts = fg.sum(axis=1)

    content = np.nonzero(row_counts > 0)[0]
    if content.size == 0:
        raise ValueError("no content found")
    top, bottom = int(content[0]), int(content[-1])

    empty = row_counts <= 2  # tolerate a few stray pixels
    runs: list[tuple[int, int]] = []
    start = None
    for y in range(top, bottom + 1):
        if empty[y] and start is None:
            start = y
        elif not empty[y] and start is not None:
            runs.append((start, y))
            start = None
    if start is not None:
        runs.append((start, bottom + 1))
    if not runs:
        raise ValueError("no empty gap between the two pieces found")

    # widest gap wins; ties -> the higher (later) one separates head/torso
    gap_start, gap_end = max(runs, key=lambda r: (r[1] - r[0], r[0]))
    if gap_start <= top or gap_end >= bottom:
        raise ValueError(
            f"bad gap ({gap_start},{gap_end}) for content {top}..{bottom}"
        )
    return gap_start, gap_end, fg, row_counts


def part_bbox(fg: np.ndarray, rows: tuple[int, int]) -> tuple[int, int, int, int]:
    y0, y1 = rows
    col_counts = fg[y0:y1].sum(axis=0)
    cols = np.nonzero(col_counts > 0)[0]
    if cols.size == 0:
        raise ValueError(f"no content in rows {rows}")
    return int(cols[0]), y0, int(cols[-1]) + 1, y1


def crop_square(img: Image.Image, box: tuple[int, int, int, int],
                bg: np.ndarray, out_size: int) -> Image.Image:
    l, t, r, b = box
    cw, ch = r - l, b - t
    side = max(cw, ch)
    canvas = Image.new("RGB", (side, side), tuple(int(c) for c in bg))
    canvas.paste(img.crop((l, t, r, b)), ((side - cw) // 2, (side - ch) // 2))
    return canvas.resize((out_size, out_size), Image.Resampling.LANCZOS)


def process(path: Path) -> dict:
    original = Image.open(path).convert("RGBA")
    background = Image.new("RGBA", original.size, (235, 232, 230, 255))
    img = Image.alpha_composite(background, original).convert("RGB")
    arr = np.asarray(img)
    h, w = arr.shape[:2]
    bg = find_bg_color(arr)
    gap_start, gap_end, fg, row_counts = find_split(arr)

    content_rows = np.nonzero(row_counts > 0)[0]
    top, bottom = int(content_rows[0]), int(content_rows[-1])
    face_rows = (top, gap_start)
    body_rows = (gap_end, bottom + 1)

    margin = int(max(w, h) * 0.04)

    def expand(box: tuple[int, int, int, int],
               clamp_top: int, clamp_bottom: int) -> tuple[int, int, int, int]:
        """Expand by margin; vertical growth may only reach into the empty
        gap [clamp_top, clamp_bottom], never into the other piece."""
        l, t, r, b = box
        return (max(0, l - margin),
                max(clamp_top, t - margin),
                min(w, r + margin),
                min(clamp_bottom, b + margin))

    face_box = expand(part_bbox(fg, face_rows), 0, gap_start)
    # face may grow up to image top but never below gap_start
    body_box = expand(part_bbox(fg, body_rows), gap_start, h)
    # body may grow down to image bottom but never above gap_start
    face = crop_square(img, face_box, bg, OUT_SIZE)
    body = crop_square(img, body_box, bg, OUT_SIZE)

    face_path = path.with_name(path.stem + "-face.png")
    body_path = path.with_name(path.stem + "-body.png")
    if face_path.exists() or body_path.exists():
        raise FileExistsError("split output already exists")
    face.save(face_path)
    body.save(body_path)
    return {
        "sheet": path.name,
        "gap": [gap_start, gap_end],
        "face_bbox": face_box,
        "body_bbox": body_box,
        "outputs": [
            {"path": str(face_path), "size": face.size},
            {"path": str(body_path), "size": body.size},
        ],
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    results = []
    for arg in sys.argv[1:]:
        try:
            results.append(process(Path(arg)))
        except Exception as exc:
            print(f"ERROR processing {arg}: {exc}", file=sys.stderr)
            return 1
    print(json.dumps(results, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
