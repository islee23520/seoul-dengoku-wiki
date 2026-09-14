#!/usr/bin/env python3
"""Design.md 토큰만으로 UI 수정 후보(title, icon, tile, panel, button)를 명시 디렉터리에 초안으로 조립한다."""

from __future__ import annotations

import argparse
import json
from hashlib import sha256
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageStat, __version__ as PILLOW_VERSION

REPO = Path(__file__).resolve().parents[2]
ART = REPO / "Game" / "Assets" / "Janseon" / "Art"
DESIGN_MD = REPO / "Design.md"
GENERATOR = Path(__file__).resolve()

# Design.md 2.1 색 토큰 (sRGB)
TOKENS = {
    "bg-void": (11, 17, 28),
    "bg-panel": (20, 28, 42),
    "bg-panel-raised": (27, 37, 54),
    "bg-well": (14, 22, 34),
    "stroke-quiet": (42, 53, 72),
    "stroke-focus": (201, 162, 39),
    "stroke-danger": (139, 58, 58),
    "text-primary": (230, 234, 240),
    "text-secondary": (154, 166, 178),
    "text-muted": (107, 118, 132),
    "accent-line": (61, 126, 166),
    "accent-safe": (63, 107, 84),
    "accent-talk": (91, 107, 138),
    "accent-fight": (139, 74, 58),
    "signal-live": (201, 162, 39),
    "grid-line": (36, 48, 68),
    "ally-cell": (42, 74, 92),
    "foe-cell": (92, 42, 42),
}

ICON_NAMES = ("talk", "detour", "battle", "heal", "party", "station", "crate", "alert")
BUTTON_STATES = ("normal", "hover", "pressed")
TILE_KINDS = ("floor", "wall", "platform")

# 기계 계약 임계값
NEON_FRACTION_MAX = 0.005          # 장식 네온(포화 cyan) 픽셀 비율 상한
TILE_CYAN_FRACTION_MAX = 0.05      # 타일의 청록 물듦 상한
SEAM_MAX = 3.0                     # 2x2 반복 이음새 평균 절대차 상한
FLATNESS_MIN = 1.2                 # 블러 대비 재질 디테일 하한
ICON_DISTINCT_MIN = 0.12           # 32px 알파 실루엣 쌍별 차이 하한
ICON_PADDING_MIN = 3               # 64px 기준 최소 여백
BUTTON_STATE_DELTA_MIN = 6.0       # 상태 간 평균 밝기 차 하한 (0-255)

ORIGINAL_INPUTS = {
    "title": ART / "Title" / "poc-title-art.png",
    "icons": ART / "UI" / "poc-ui-icons.png",
    "floor": ART / "Tiles" / "poc-tile-floor.png",
    "wall": ART / "Tiles" / "poc-tile-wall.png",
    "platform": ART / "Tiles" / "poc-tile-platform.png",
    "panel": ART / "UI" / "poc-ui-panel-9slice.png",
    "button-normal": ART / "UI" / "poc-ui-button-normal.png",
    "button-hover": ART / "UI" / "poc-ui-button-hover.png",
    "button-pressed": ART / "UI" / "poc-ui-button-pressed.png",
}
for _name in ICON_NAMES:
    ORIGINAL_INPUTS[f"icon-{_name}"] = ART / "UI" / f"icon-{_name}.png"

REFERENCE_INPUTS = {
    "raw:floor": REPO / "Game/Assets/Janseon/Art/Tiles/poc-tile-texture/raw/floor.jpg",
    "raw:wall": REPO / "Game/Assets/Janseon/Art/Tiles/poc-tile-texture/raw/wall.jpg",
    "raw:platform": REPO / "Game/Assets/Janseon/Art/Tiles/poc-tile-texture/raw/platform.jpg",
    "raw:title": REPO / "Game/Assets/Janseon/Art/Title/poc-title-art/raw/title.jpg",
}


# ---------------------------------------------------------------- helpers

def sha256_file(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def rgb(token: str, alpha: int = 255) -> tuple[int, int, int, int]:
    r, g, b = TOKENS[token]
    return (r, g, b, alpha)


def mix(a: tuple, b: tuple, t: float) -> tuple[int, int, int]:
    r, g, b_ = (int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))
    return (r, g, b_)


def wrapped_noise(size: int, cells: int, seed: int) -> np.ndarray:
    """주기적(seamless) value noise, 0..1."""
    rng = np.random.default_rng(seed)
    grid = rng.random((cells, cells))
    grid = np.pad(grid, ((0, 1), (0, 1)), mode="wrap")
    coords = np.linspace(0, cells, size, endpoint=False)
    i0 = np.floor(coords).astype(int)
    frac = coords - i0
    smooth = frac * frac * (3 - 2 * frac)
    fy, fx = smooth[:, None], smooth[None, :]
    y0, x0 = i0[:, None], i0[None, :]
    n00 = grid[y0, x0]
    n10 = grid[y0 + 1, x0]
    n01 = grid[y0, x0 + 1]
    n11 = grid[y0 + 1, x0 + 1]
    return n00 * (1 - fy) * (1 - fx) + n10 * fy * (1 - fx) + n01 * (1 - fy) * fx + n11 * fy * fx


def fbm(size: int, seed: int, octaves=((8, 0.5), (16, 0.3), (32, 0.2))) -> np.ndarray:
    total = np.zeros((size, size), dtype=np.float64)
    weight = 0.0
    for index, (cells, amplitude) in enumerate(octaves):
        total += amplitude * wrapped_noise(size, cells, seed + 101 * index)
        weight += amplitude
    return total / weight


def to_image(arr: np.ndarray) -> Image.Image:
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")


def supersampled(size: tuple[int, int], draw_fn, scale: int = 4) -> Image.Image:
    """4배로 그린 뒤 box reduce로 깨끗한 안티에일리어스 알파를 만든다."""
    big = Image.new("RGBA", (size[0] * scale, size[1] * scale), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(big), scale)
    return big.reduce(scale)


# ---------------------------------------------------------------- tiles

def tile_floor(size: int = 256, seed: int = 11) -> Image.Image:
    """콘크리트/테라조 바닥: 64px 타일 4x4, 어두운 줄눈, 마모 얼룩, 젖은 광택 한 스톱."""
    yy, xx = np.mgrid[0:size, 0:size]
    base = np.array(mix(TOKENS["text-muted"], TOKENS["bg-panel-raised"], 0.42), dtype=np.float64)  # 차가운 중간 회색
    grout = np.array(mix(TOKENS["bg-well"], TOKENS["stroke-quiet"], 0.35), dtype=np.float64)
    cell = 64
    # 타일 경계(x=0,y=0)가 줄눈이 아니라 면 한가운데 오도록 반 칸 이동 → 2x2 반복 이음새가 면 안에 숨는다.
    sx, sy = (xx + cell // 2) % size, (yy + cell // 2) % size
    tx, ty = sx // cell, sy // cell
    rng = np.random.default_rng(seed)
    jitter = rng.uniform(-0.06, 0.06, (size // cell, size // cell))
    face = base[None, None, :] * (1 + jitter[ty, tx])[..., None]
    grime = fbm(size, seed, ((4, 0.45), (8, 0.3), (32, 0.25)))
    face = face * (0.9 + 0.2 * grime)[..., None]
    stain = np.clip((wrapped_noise(size, 3, seed + 7) - 0.62) * 3.0, 0, 1)
    face = face * (1 - 0.12 * stain)[..., None]
    speck = wrapped_noise(size, 128, seed + 3)
    face = face + ((speck - 0.5) * 9)[..., None]
    lx, ly = sx % cell, sy % cell
    bevel_light = ((lx == 2) | (ly == 2)) & (lx >= 2) & (ly >= 2)
    bevel_dark = ((lx == cell - 1) | (ly == cell - 1))
    face = np.where(bevel_light[..., None], face * 1.08 + 6, face)
    face = np.where(bevel_dark[..., None], face * 0.86, face)
    grout_mask = (lx < 2) | (ly < 2)
    color = np.where(grout_mask[..., None], grout[None, None, :] * (0.92 + 0.16 * grime)[..., None], face)
    sheen = np.clip((wrapped_noise(size, 2, seed + 19) - 0.55) * 2.2, 0, 1) * (1 - grout_mask)
    cold = np.array([0.94, 1.0, 1.08])
    color = color * (1 + 0.16 * sheen)[..., None] * (1 + (cold - 1) * sheen[..., None] * 0.6)
    return to_image(color)


def tile_wall(size: int = 256, seed: int = 23) -> Image.Image:
    """역사 벽: 32x16 ceramic 타일 running bond, 얇은 줄눈, 저채도 회백색, 그을음/때."""
    yy, xx = np.mgrid[0:size, 0:size]
    base = np.array(mix(TOKENS["text-secondary"], TOKENS["text-muted"], 0.55), dtype=np.float64)
    base = base * np.array([1.0, 0.99, 0.965])  # 아주 약한 웜 그레이
    grout = np.array(mix(TOKENS["text-muted"], TOKENS["bg-panel"], 0.55), dtype=np.float64)
    bw, bh = 32, 16
    # 타일 경계가 두 줄(짝/홀 running bond) 모두에서 벽돌 면 중앙(줄눈에서 8px)을 지나도록 8px 이동.
    sy = (yy + bh // 2) % size
    row = sy // bh
    offset = (row % 2) * (bw // 2)
    sx = (xx + bw // 4 + offset) % size
    col = sx // bw
    lx, ly = sx % bw, sy % bh
    rng = np.random.default_rng(seed)
    jitter = rng.uniform(-0.05, 0.05, (size // bh, size // bw))
    face = base[None, None, :] * (1 + jitter[row, col])[..., None]
    grime = fbm(size, seed, ((4, 0.4), (16, 0.35), (64, 0.25)))
    face = face * (0.86 + 0.24 * grime)[..., None]
    soot = np.clip((wrapped_noise(size, 3, seed + 5) - 0.58) * 2.6, 0, 1)
    face = face * (1 - 0.15 * soot)[..., None]
    glaze = np.clip((wrapped_noise(size, 6, seed + 29) - 0.5) * 1.6, 0, 1)
    face = face * (1 + 0.05 * glaze)[..., None]
    edge_light = (lx == 1) | (ly == 1)
    edge_dark = (lx == bw - 1) | (ly == bh - 1)
    face = np.where(edge_light[..., None], face * 1.05 + 3, face)
    face = np.where(edge_dark[..., None], face * 0.9, face)
    grout_mask = (lx == 0) | (ly == 0)
    color = np.where(grout_mask[..., None], grout[None, None, :] * (0.9 + 0.2 * grime)[..., None], face)
    speck = wrapped_noise(size, 128, seed + 3)
    color = color + ((speck - 0.5) * 6)[..., None]
    return to_image(color)


def tile_platform(size: int = 256, seed: int = 37) -> Image.Image:
    """승강장 가장자리: 무광 콘크리트 슬래브, 점자 안전 띠 한 줄(황토), 닳은 백색 안전선."""
    yy, xx = np.mgrid[0:size, 0:size]
    base = np.array(mix(TOKENS["text-muted"], TOKENS["bg-panel-raised"], 0.30), dtype=np.float64)
    joint = np.array(mix(TOKENS["bg-well"], TOKENS["text-muted"], 0.25), dtype=np.float64)
    grime = fbm(size, seed, ((4, 0.4), (8, 0.3), (32, 0.3)))
    color = base[None, None, :] * (0.88 + 0.24 * grime)[..., None]
    stain = np.clip((wrapped_noise(size, 3, seed + 11) - 0.6) * 2.8, 0, 1)
    color = color * (1 - 0.16 * stain)[..., None]
    speck = wrapped_noise(size, 128, seed + 3)
    color = color + ((speck - 0.5) * 8)[..., None]
    slab_joint = ((xx + 40) % 128 < 2)
    color = np.where(slab_joint[..., None], joint[None, None, :], color)

    # 점자 안전 띠: y 168..216, 8px 피치 truncated dome
    band_top, band_h = 168, 48
    band = (yy >= band_top) & (yy < band_top + band_h)
    ochre = np.array(mix(TOKENS["signal-live"], TOKENS["text-muted"], 0.35), dtype=np.float64)
    band_color = ochre[None, None, :] * (0.86 + 0.24 * grime)[..., None] * (1 - 0.25 * stain)[..., None]
    dx = (xx % 8) - 3.5
    dy = ((yy - band_top) % 8) - 3.5
    dome = (dx * dx + dy * dy) <= 6.5
    dome_light = dome & (dy < -0.5)
    dome_dark = dome & (dy > 1.5)
    band_color = np.where(dome_light[..., None], band_color * 1.10 + 4, band_color)
    band_color = np.where(dome_dark[..., None], band_color * 0.82, band_color)
    band_edge = band & ((yy == band_top) | (yy == band_top + band_h - 1))
    band_color = np.where(band_edge[..., None], band_color * 0.7, band_color)
    color = np.where(band[..., None], band_color, color)

    # 닳은 백색 안전선: y 228..231
    line = (yy >= 228) & (yy < 232)
    wear = np.clip((wrapped_noise(size, 12, seed + 41) - 0.35) * 1.8, 0, 1)
    white = np.array(TOKENS["text-secondary"], dtype=np.float64)
    line_color = color * (1 - wear)[..., None] + white[None, None, :] * (0.85 + 0.15 * grime)[..., None] * wear[..., None]
    color = np.where(line[..., None], line_color, color)
    return to_image(color)


# ---------------------------------------------------------------- icons

def _icon(name: str) -> Image.Image:
    """64px, 4px 여백, 단색 solid 스타일 계약: 몸통 text-secondary, 컷 bg-void, 의미색 한 요소."""
    body = rgb("text-secondary")
    cut = rgb("bg-void")
    light = rgb("text-primary")
    shade = rgb("text-muted")

    def draw(d: ImageDraw.ImageDraw, s: int):
        def P(*pts):
            return [(x * s, y * s) for x, y in pts]

        def R(x0, y0, x1, y1):
            return (x0 * s, y0 * s, x1 * s, y1 * s)

        if name == "talk":
            d.rounded_rectangle(R(6, 8, 58, 44), radius=6 * s, fill=body)
            d.polygon(P((14, 42), (26, 42), (12, 57)), fill=body)
            d.rounded_rectangle(R(15, 18, 49, 23), radius=2 * s, fill=cut)
            d.rounded_rectangle(R(15, 28, 41, 33), radius=2 * s, fill=rgb("accent-talk"))
        elif name == "detour":
            # 노선 폴드: 왼쪽 직진 노선은 차단, 45° 폴드 우회로가 위로 이어진다
            d.rounded_rectangle(R(15, 8, 23, 56), radius=2 * s, fill=shade)
            d.line(P((13, 24), (25, 36)), fill=rgb("stroke-danger"), width=5 * s)
            d.line(P((25, 24), (13, 36)), fill=rgb("stroke-danger"), width=5 * s)
            safe = rgb("accent-safe")
            d.rounded_rectangle(R(19, 44, 45, 52), radius=3 * s, fill=safe)
            d.polygon(P((40, 46), (54, 32), (60, 38), (46, 52)), fill=safe)
            d.rounded_rectangle(R(43, 12, 51, 38), radius=3 * s, fill=safe)
            d.polygon(P((47, 4), (58, 18), (36, 18)), fill=safe)
        elif name == "battle":
            # 대각 날 + 가드 + 손잡이(accent-fight)
            d.polygon(P((12, 44), (46, 10), (54, 10), (54, 18), (20, 52)), fill=light)
            d.polygon(P((46, 10), (54, 10), (54, 18), (50, 22)), fill=body)
            d.line(P((8, 40), (24, 56)), fill=body, width=6 * s)
            d.line(P((16, 48), (7, 57)), fill=rgb("accent-fight"), width=7 * s)
        elif name == "heal":
            d.rounded_rectangle(R(24, 6, 40, 58), radius=3 * s, fill=light)
            d.rounded_rectangle(R(6, 24, 58, 40), radius=3 * s, fill=light)
            d.rectangle(R(28, 10, 36, 54), fill=rgb("accent-safe"))
            d.rectangle(R(10, 28, 54, 36), fill=rgb("accent-safe"))
        elif name == "party":
            d.ellipse(R(34, 8, 54, 28), fill=shade)
            d.rounded_rectangle(R(30, 30, 60, 58), radius=8 * s, fill=shade)
            d.ellipse(R(12, 6, 34, 28), fill=body)
            d.rounded_rectangle(R(6, 30, 40, 58), radius=9 * s, fill=body)
            d.rectangle(R(6, 52, 40, 58), fill=rgb("ally-cell"))
        elif name == "station":
            # 전동차 전면: 몸통, 어두운 전면창, 전조등(signal-live), 노선 바(accent-line)
            d.rounded_rectangle(R(8, 8, 56, 46), radius=9 * s, fill=body)
            d.rounded_rectangle(R(14, 14, 50, 30), radius=3 * s, fill=cut)
            d.ellipse(R(14, 34, 22, 42), fill=rgb("signal-live"))
            d.ellipse(R(42, 34, 50, 42), fill=rgb("signal-live"))
            d.rectangle(R(4, 50, 60, 58), fill=rgb("accent-line"))
            d.ellipse(R(28, 50, 36, 58), fill=light)
        elif name == "crate":
            top = light
            left = body
            right = shade
            d.polygon(P((32, 6), (58, 20), (32, 34), (6, 20)), fill=top)
            d.polygon(P((6, 20), (32, 34), (32, 60), (6, 46)), fill=left)
            d.polygon(P((58, 20), (32, 34), (32, 60), (58, 46)), fill=right)
            d.line(P((6, 33), (32, 47), (58, 33)), fill=cut, width=2 * s)
            d.line(P((32, 6), (32, 34)), fill=cut, width=2 * s)
        elif name == "alert":
            amber = rgb("signal-live")
            d.polygon(P((32, 5), (60, 57), (4, 57)), fill=amber)
            d.rounded_rectangle(R(28, 20, 36, 40), radius=2 * s, fill=cut)
            d.ellipse(R(27, 44, 37, 54), fill=cut)
        else:
            raise ValueError(name)

    return supersampled((64, 64), draw)


def render_icons() -> dict[str, Image.Image]:
    return {name: _icon(name) for name in ICON_NAMES}


def atlas_image(icons: dict[str, Image.Image]) -> Image.Image:
    atlas = Image.new("RGBA", (256, 128), (0, 0, 0, 0))
    for index, name in enumerate(ICON_NAMES):
        atlas.paste(icons[name], ((index % 4) * 64, (index // 4) * 64))
    return atlas


# ---------------------------------------------------------------- panel / buttons

def render_panel() -> Image.Image:
    """256px 9-slice 프레임(border 48): 무광 밴드, stroke-quiet 2px, 45° 코너 폴드, 중앙 투명."""
    size, border, chamfer = 256, 48, 12
    yy, xx = np.mgrid[0:size, 0:size]
    noise = fbm(size, 5, ((4, 0.5), (16, 0.3), (64, 0.2)))
    fill = np.array(TOKENS["bg-panel"], dtype=np.float64)[None, None, :] * (0.96 + 0.08 * noise)[..., None]
    inner_line = np.array(TOKENS["grid-line"], dtype=np.float64)
    stroke = np.array(TOKENS["stroke-quiet"], dtype=np.float64)
    color = fill.copy()
    ring = (xx >= border - 3) & (xx < border) | (yy >= border - 3) & (yy < border) | \
           (xx >= size - border) & (xx < size - border + 3) | (yy >= size - border) & (yy < size - border + 3)
    color = np.where(ring[..., None], fill * 0.85, color)
    hair = ((xx == border - 4) | (yy == border - 4) | (xx == size - border + 3) | (yy == size - border + 3))
    color = np.where(hair[..., None], inner_line[None, None, :], color)
    # 외곽 2px stroke + 모서리 45° 폴드
    corner_cut = (xx + yy < chamfer) | ((size - 1 - xx) + yy < chamfer) | (xx + (size - 1 - yy) < chamfer) | ((size - 1 - xx) + (size - 1 - yy) < chamfer)
    outer = (xx < 2) | (yy < 2) | (xx >= size - 2) | (yy >= size - 2) | \
            (abs(xx + yy - chamfer) < 2) | (abs((size - 1 - xx) + yy - chamfer) < 2) | \
            (abs(xx + (size - 1 - yy) - chamfer) < 2) | (abs((size - 1 - xx) + (size - 1 - yy) - chamfer) < 2)
    color = np.where(outer[..., None], stroke[None, None, :], color)
    alpha = np.full((size, size), 255, dtype=np.uint8)
    center = (xx >= border) & (xx < size - border) & (yy >= border) & (yy < size - border)
    alpha[center] = 0
    alpha[corner_cut] = 0
    rgba = np.dstack([np.clip(color, 0, 255).astype(np.uint8), alpha])
    return Image.fromarray(rgba, "RGBA")


def _button_mask(scale: int = 4) -> Image.Image:
    big = Image.new("L", (256 * scale, 64 * scale), 0)
    ImageDraw.Draw(big).rounded_rectangle((0, 0, 256 * scale - 1, 64 * scale - 1), radius=8 * scale, fill=255)
    return big.reduce(scale)


def render_buttons() -> dict[str, Image.Image]:
    """동일 마스크 3상태: normal(bg-panel), hover(raised), pressed(well + inset + accent-line 하단 2px)."""
    mask = _button_mask()
    yy, xx = np.mgrid[0:64, 0:256]
    noise = fbm(256, 9, ((8, 0.5), (32, 0.5)))[:64, :]
    specs = {
        "normal": (TOKENS["bg-panel"], TOKENS["bg-panel-raised"], TOKENS["stroke-quiet"], None),
        "hover": (TOKENS["bg-panel-raised"], mix(TOKENS["bg-panel-raised"], TOKENS["text-muted"], 0.18), mix(TOKENS["stroke-quiet"], TOKENS["text-muted"], 0.45), None),
        "pressed": (TOKENS["bg-well"], TOKENS["bg-well"], TOKENS["stroke-quiet"], TOKENS["accent-line"]),
    }
    out = {}
    for state, (bottom, top, stroke, bar) in specs.items():
        t = (yy / 63.0)[..., None]
        color = np.array(top, dtype=np.float64) * (1 - t) + np.array(bottom, dtype=np.float64) * t
        color = color * (0.97 + 0.06 * noise)[..., None]
        if state == "pressed":
            inset = np.clip(1 - yy / 6.0, 0, 1)
            color = color * (1 - 0.35 * inset)[..., None]
        border = (xx < 1) | (yy < 1) | (xx >= 255) | (yy >= 63)
        color = np.where(border[..., None], np.array(stroke, dtype=np.float64)[None, None, :], color)
        if bar is not None:
            color = np.where(((yy >= 60) & (yy < 62) & (xx >= 8) & (xx < 248))[..., None], np.array(bar, dtype=np.float64)[None, None, :], color)
        image = Image.fromarray(np.clip(color, 0, 255).astype(np.uint8), "RGB").convert("RGBA")
        image.putalpha(mask)
        out[state] = image
    return out


# ---------------------------------------------------------------- title

_TITLE_FONT = Path("/System/Library/Fonts/AppleSDGothicNeo.ttc")
_TITLE_MARK = "《잔선: 서울》"
_TITLE_SUB = "붕괴 이후 지하철망의 질서를 다시 세운다"


def _cjk_font(size: int, *, medium: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(_TITLE_FONT), size, index=2 if medium else 0)


def _cubic(p0, p1, p2, p3, steps: int = 72) -> list[tuple[float, float]]:
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1.0 - t
        x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
        y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
        points.append((x, y))
    return points


def compose_title(_tiles: dict[str, Image.Image] | None = None) -> Image.Image:
    """void 필드 + 희미한 노선 폴드: 순수 기하 폴리라인, 이미지 텍스처 없음."""
    width, height = 1920, 1080
    scale = 2
    canvas = Image.new("RGBA", (width * scale, height * scale), rgb("bg-void"))
    layer = Image.new("RGBA", (width * scale, height * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    def scaled(points):
        return [(x * scale, y * scale) for x, y in points]

    def stroke(points, token: str, alpha: int, width_px: float):
        draw.line(
            scaled(points),
            fill=rgb(token, alpha),
            width=max(1, int(round(width_px * scale))),
            joint="curve",
        )

    def station(x: float, y: float, radius: float = 4.5, token: str = "stroke-quiet", alpha: int = 80):
        r = radius * scale
        cx, cy = x * scale, y * scale
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=rgb(token, alpha), width=max(1, scale))
        inner = r * 0.35
        if inner >= 1:
            draw.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=rgb(token, max(1, alpha // 2)))

    for x in range(160, width, 160):
        stroke([(x, 0), (x, height)], "grid-line", 22, 1)
    for y in range(120, height, 120):
        stroke([(0, y), (width, y)], "grid-line", 22, 1)

    fold = (960.0, 332.0)
    routes = [
        ("grid-line", 40, 1.25, _cubic((40, 980), (420, 940), (720, 560), fold)),
        ("grid-line", 36, 1.15, _cubic((1880, 980), (1500, 940), (1200, 560), fold)),
        ("stroke-quiet", 58, 1.6, _cubic((40, 220), (380, 160), (700, 280), fold)),
        ("stroke-quiet", 54, 1.5, _cubic((1880, 220), (1540, 160), (1220, 280), fold)),
        ("stroke-quiet", 50, 1.4, _cubic((40, 540), (280, 520), (640, 400), fold)),
        ("stroke-quiet", 50, 1.4, _cubic((1880, 540), (1640, 520), (1280, 400), fold)),
        ("accent-line", 72, 2.0, _cubic((120, 860), (480, 780), (760, 480), fold)),
        ("accent-line", 64, 1.75, _cubic((1800, 860), (1440, 780), (1160, 480), fold)),
        ("accent-line", 48, 1.35, _cubic((960, 1040), (960, 760), (960, 520), fold)),
        ("grid-line", 34, 1.1, _cubic((240, 80), (480, 180), (760, 280), fold)),
        ("grid-line", 34, 1.1, _cubic((1680, 80), (1440, 180), (1160, 280), fold)),
        ("stroke-quiet", 44, 1.25, [(80, 760), (280, 760), (440, 600), (640, 600)]),
        ("stroke-quiet", 44, 1.25, [(1840, 760), (1640, 760), (1480, 600), (1280, 600)]),
        ("grid-line", 32, 1.1, [(320, 1000), (520, 800), (720, 800)]),
        ("grid-line", 32, 1.1, [(1600, 1000), (1400, 800), (1200, 800)]),
    ]
    for token, alpha, line_width, points in routes:
        stroke(points, token, alpha, line_width)

    nodes = [
        (80, 760), (280, 760), (440, 600), (640, 600),
        (1840, 760), (1640, 760), (1480, 600), (1280, 600),
        (120, 860), (1800, 860), (960, 1040),
        (40, 540), (1880, 540), (240, 80), (1680, 80),
        (320, 1000), (1600, 1000), fold,
    ]
    for x, y in nodes:
        hub = (x, y) == fold
        station(x, y, radius=7.0 if hub else 4.5, token="accent-line" if hub else "stroke-quiet", alpha=110 if hub else 80)

    mark_font = _cjk_font(96 * scale, medium=True)
    sub_font = _cjk_font(22 * scale, medium=False)
    tracking = 96 * scale * 0.02

    def glyph_width(text: str, font) -> float:
        box = draw.textbbox((0, 0), text, font=font)
        return float(box[2] - box[0])

    def tracked_width(text: str, font, extra: float) -> float:
        return sum(glyph_width(ch, font) for ch in text) + extra * (len(text) - 1)

    def draw_tracked(text: str, y: float, font, fill, extra: float = 0.0):
        total = tracked_width(text, font, extra) if extra else glyph_width(text, font)
        x = (width * scale - total) / 2.0
        if extra == 0.0:
            draw.text((x, y * scale), text, font=font, fill=fill)
            return
        cursor = x
        for ch in text:
            draw.text((cursor, y * scale), ch, font=font, fill=fill)
            cursor += glyph_width(ch, font) + extra

    draw_tracked(_TITLE_MARK, 456, mark_font, rgb("text-primary"), tracking)
    mark_w = tracked_width(_TITLE_MARK, mark_font, tracking) / scale
    stroke([(width / 2 - mark_w / 2, 572), (width / 2 + mark_w / 2, 572)], "accent-line", 70, 2)
    draw_tracked(_TITLE_SUB, 600, sub_font, rgb("text-secondary"))

    composed = Image.alpha_composite(canvas, layer)
    return composed.reduce(scale).convert("RGB")


# ---------------------------------------------------------------- contract

def _hsv(img: Image.Image, opaque_only: bool):
    arr = np.asarray(img.convert("RGBA")).astype(np.float64)
    mask = arr[..., 3] > 128 if opaque_only else np.ones(arr.shape[:2], dtype=bool)
    rgb_ = arr[..., :3][mask] / 255.0
    mx, mn = rgb_.max(1), rgb_.min(1)
    d = mx - mn + 1e-9
    r, g, b = rgb_[:, 0], rgb_[:, 1], rgb_[:, 2]
    hue = np.where(mx == r, (60 * ((g - b) / d)) % 360, np.where(mx == g, 60 * ((b - r) / d) + 120, 60 * ((r - g) / d) + 240))
    sat = np.where(mx > 0, d / mx, 0)
    return hue, sat, mx


def neon_fraction(img: Image.Image, opaque_only: bool = True) -> float:
    """포화 cyan(hue 165-195, s>=0.30, v>=0.45) 비율."""
    hue, sat, val = _hsv(img, opaque_only)
    if hue.size == 0:
        return 0.0
    return float(((hue >= 165) & (hue <= 195) & (sat >= 0.30) & (val >= 0.45)).mean())


def tile_cyan_fraction(img: Image.Image) -> float:
    """타일의 청록 물듦(hue 160-200, s>=0.22, v>=0.35) 비율."""
    hue, sat, val = _hsv(img, False)
    return float(((hue >= 160) & (hue <= 200) & (sat >= 0.22) & (val >= 0.35)).mean())


def mean_abs_diff(left: Image.Image, right: Image.Image) -> float:
    stats = ImageStat.Stat(ImageChops.difference(left.convert("RGB"), right.convert("RGB")))
    return sum(stats.mean) / len(stats.mean)


def seam_score(tile: Image.Image) -> dict[str, float]:
    width, height = tile.size
    doubled = Image.new("RGB", (width * 2, height * 2))
    rgb_ = tile.convert("RGB")
    for y in range(2):
        for x in range(2):
            doubled.paste(rgb_, (x * width, y * height))
    vertical = doubled.crop((width - 2, 0, width + 2, height * 2))
    horizontal = doubled.crop((0, height - 2, width * 2, height + 2))
    return {
        "vertical_mean_abs": mean_abs_diff(vertical.crop((0, 0, 2, height * 2)), vertical.crop((2, 0, 4, height * 2))),
        "horizontal_mean_abs": mean_abs_diff(horizontal.crop((0, 0, width * 2, 2)), horizontal.crop((0, 2, width * 2, 4))),
    }


def alpha_bbox(image: Image.Image, threshold: int = 16):
    alpha = np.asarray(image.split()[-1])
    mask = Image.fromarray(np.where(alpha > threshold, 255, 0).astype(np.uint8), "L")
    return mask.getbbox()


def icon_distance(a: Image.Image, b: Image.Image) -> float:
    sa = np.asarray(a.resize((32, 32), Image.Resampling.BOX).split()[-1]).astype(int)
    sb = np.asarray(b.resize((32, 32), Image.Resampling.BOX).split()[-1]).astype(int)
    return float((np.abs(sa - sb) > 64).mean())


def evaluate_candidates(title: Image.Image, icons: dict[str, Image.Image], tiles: dict[str, Image.Image],
                        panel: Image.Image, buttons: dict[str, Image.Image]) -> dict:
    errors_by_check: dict[str, str] = {}

    def check(name: str, ok: bool, detail: str):
        if not ok:
            errors_by_check[name] = detail

    title_neon = neon_fraction(title, opaque_only=False)
    check("title_size", title.size == (1920, 1080), f"{title.size}")
    check("title_neon", title_neon <= NEON_FRACTION_MAX, f"{title_neon:.4f}")

    icon_neon = {}
    icon_boxes = {}
    for name in ICON_NAMES:
        icon = icons[name].convert("RGBA")
        check(f"icon_{name}_size", icon.size == (64, 64), f"{icon.size}")
        icon_neon[name] = neon_fraction(icon)
        check(f"icon_{name}_neon", icon_neon[name] <= NEON_FRACTION_MAX, f"{icon_neon[name]:.4f}")
        box = alpha_bbox(icon)
        icon_boxes[name] = box
        check(f"icon_{name}_padding", box is not None and box[0] >= ICON_PADDING_MIN and box[1] >= ICON_PADDING_MIN
              and box[2] <= 64 - ICON_PADDING_MIN and box[3] <= 64 - ICON_PADDING_MIN, f"{box}")
        small = icon.resize((32, 32), Image.Resampling.BOX)
        small_box = alpha_bbox(small, threshold=40)
        check(f"icon_{name}_legible_32px", small_box is not None and small_box[2] - small_box[0] >= 10 and small_box[3] - small_box[1] >= 10, f"{small_box}")
    distances = [icon_distance(icons[a], icons[b]) for i, a in enumerate(ICON_NAMES) for b in ICON_NAMES[i + 1:]]
    pairwise_min = min(distances)
    check("icon_pairwise_distinct_32px", pairwise_min >= ICON_DISTINCT_MIN, f"{pairwise_min:.3f}")

    tile_cyan = {}
    tile_seams = {}
    tile_detail = {}
    for kind in TILE_KINDS:
        tile = tiles[kind].convert("RGB")
        check(f"{kind}_size", tile.size == (256, 256), f"{tile.size}")
        tile_cyan[kind] = tile_cyan_fraction(tile)
        check(f"{kind}_cyan_tint", tile_cyan[kind] <= TILE_CYAN_FRACTION_MAX, f"{tile_cyan[kind]:.4f}")
        tile_seams[kind] = seam_score(tile)
        check(f"{kind}_seam", tile_seams[kind]["vertical_mean_abs"] <= SEAM_MAX and tile_seams[kind]["horizontal_mean_abs"] <= SEAM_MAX, f"{tile_seams[kind]}")
        tile_detail[kind] = mean_abs_diff(tile, tile.filter(ImageFilter.GaussianBlur(radius=8)))
        check(f"{kind}_flat", tile_detail[kind] >= FLATNESS_MIN, f"{tile_detail[kind]:.3f}")

    panel = panel.convert("RGBA")
    panel_neon = neon_fraction(panel)
    check("panel_size", panel.size == (256, 256), f"{panel.size}")
    check("panel_neon", panel_neon <= NEON_FRACTION_MAX, f"{panel_neon:.4f}")
    center_alpha = ImageStat.Stat(panel.crop((48, 48, 208, 208)).split()[-1]).mean[0]
    edge_alpha = ImageStat.Stat(panel.crop((20, 0, 236, 8)).split()[-1]).mean[0]
    check("panel_center_hollow", center_alpha <= 8, f"{center_alpha:.2f}")
    check("panel_edge_opaque", edge_alpha >= 160, f"{edge_alpha:.2f}")

    button_neon = {}
    button_lum = {}
    reference_mask = None
    for state in BUTTON_STATES:
        button = buttons[state].convert("RGBA")
        check(f"button_{state}_size", button.size == (256, 64), f"{button.size}")
        button_neon[state] = neon_fraction(button)
        check(f"button_{state}_neon", button_neon[state] <= NEON_FRACTION_MAX, f"{button_neon[state]:.4f}")
        mask = button.split()[-1]
        if reference_mask is None:
            reference_mask = mask
        else:
            delta = ImageStat.Stat(ImageChops.difference(mask, reference_mask)).mean[0]
            check(f"button_{state}_geometry", delta <= 1.5, f"{delta:.3f}")
        arr = np.asarray(button).astype(np.float64)
        opaque = arr[..., 3] > 128
        button_lum[state] = float((0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2])[opaque].mean())
    for i, a in enumerate(BUTTON_STATES):
        for b in BUTTON_STATES[i + 1:]:
            check(f"button_{a}_{b}_distinct", abs(button_lum[a] - button_lum[b]) >= BUTTON_STATE_DELTA_MIN, f"{button_lum[a]:.1f} vs {button_lum[b]:.1f}")

    errors = [f"{name}:{detail}" for name, detail in errors_by_check.items()]
    return {
        "ok": not errors,
        "errors": errors,
        "errors_by_check": errors_by_check,
        "title_neon_fraction": title_neon,
        "icon_neon_fraction_max": max(icon_neon.values()),
        "icon_neon_fraction": icon_neon,
        "icon_alpha_bbox": {name: list(box) if box else None for name, box in icon_boxes.items()},
        "icon_pairwise_min_distance": pairwise_min,
        "tile_cyan_fraction": tile_cyan,
        "tile_seams": tile_seams,
        "tile_detail": tile_detail,
        "panel_neon_fraction": panel_neon,
        "panel_center_alpha": center_alpha,
        "panel_edge_alpha": edge_alpha,
        "button_neon_fraction_max": max(button_neon.values()),
        "button_luminance": button_lum,
        "thresholds": {
            "neon_fraction_max": NEON_FRACTION_MAX,
            "tile_cyan_fraction_max": TILE_CYAN_FRACTION_MAX,
            "seam_max": SEAM_MAX,
            "flatness_min": FLATNESS_MIN,
            "icon_distinct_min": ICON_DISTINCT_MIN,
            "icon_padding_min": ICON_PADDING_MIN,
            "button_state_delta_min": BUTTON_STATE_DELTA_MIN,
        },
    }


# ---------------------------------------------------------------- assembly

def render_all() -> dict:
    tiles = {"floor": tile_floor(), "wall": tile_wall(), "platform": tile_platform()}
    icons = render_icons()
    return {
        "title": compose_title(tiles),
        "icons": icons,
        "atlas": atlas_image(icons),
        "tiles": tiles,
        "panel": render_panel(),
        "buttons": render_buttons(),
    }


def contact_sheet(rendered: dict) -> Image.Image:
    sheet = Image.new("RGB", (1280, 900), TOKENS["bg-void"])
    draw = ImageDraw.Draw(sheet)
    sheet.paste(rendered["title"].resize((640, 360), Image.Resampling.LANCZOS), (24, 24))
    panel_bg = Image.new("RGB", (360, 360), TOKENS["bg-panel"])
    sheet.paste(panel_bg, (688, 24))
    sheet.paste(rendered["panel"].resize((360, 360), Image.Resampling.NEAREST), (688, 24), rendered["panel"].resize((360, 360), Image.Resampling.NEAREST))
    x = 24
    for name in ICON_NAMES:
        icon = rendered["icons"][name]
        sheet.paste(icon, (x, 404), icon)
        small = icon.resize((32, 32), Image.Resampling.BOX)
        sheet.paste(small, (x + 16, 476), small)
        x += 80
    y = 404
    for state in BUTTON_STATES:
        button = rendered["buttons"][state]
        sheet.paste(button, (688, y), button)
        y += 76
    x = 24
    for kind in TILE_KINDS:
        tile = rendered["tiles"][kind].convert("RGB")
        repeat = Image.new("RGB", (512, 512))
        for ty in range(2):
            for tx in range(2):
                repeat.paste(tile, (tx * 256, ty * 256))
        sheet.paste(repeat.resize((256, 256), Image.Resampling.BOX), (x, 620))
        x += 272
    sheet.paste(rendered["atlas"], (856, 640), rendered["atlas"])
    draw.rectangle((855, 639, 856 + 256, 640 + 128), outline=TOKENS["stroke-quiet"])
    return sheet


def write_png(path: Path, image: Image.Image) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "PNG", optimize=True)
    return sha256_file(path)


def build(output_dir: Path) -> Path:
    """명시 후보 디렉터리에 draft만 조립한다. Game 경로에는 쓰지 않는다."""
    output_dir = output_dir.resolve()
    if any(part.casefold() == "game" for part in output_dir.parts):
        raise ValueError("Game 경로는 후보 출력으로 사용할 수 없습니다.")
    output_dir.mkdir(parents=True, exist_ok=False)
    rendered = render_all()
    report = evaluate_candidates(rendered["title"], rendered["icons"], rendered["tiles"], rendered["panel"], rendered["buttons"])

    files = []

    def record(relative: str, image: Image.Image, role: str):
        digest = write_png(output_dir / relative, image)
        files.append({"path": relative, "role": role, "sha256": digest, "size": list(image.size), "mode": image.mode})

    record("title/poc-title-art.png", rendered["title"], "title_art")
    for name in ICON_NAMES:
        record(f"ui/icon-{name}.png", rendered["icons"][name], "ui_icon")
    record("ui/poc-ui-icons.png", rendered["atlas"], "ui_icon_atlas")
    for kind in TILE_KINDS:
        record(f"tiles/poc-tile-{kind}.png", rendered["tiles"][kind], "history_texture")
    record("ui/poc-ui-panel-9slice.png", rendered["panel"], "ui_panel")
    for state in BUTTON_STATES:
        record(f"ui/poc-ui-button-{state}.png", rendered["buttons"][state], "ui_button")
    sheet_hash = write_png(output_dir / "poc-ui-candidates-sheet.png", contact_sheet(rendered))

    manifest = {
        "schema": "janseon-ui-candidate-manifest/1",
        "generator": {"path": str(GENERATOR.relative_to(REPO)), "sha256": sha256_file(GENERATOR), "pillow": PILLOW_VERSION, "numpy": np.__version__},
        "status": "draft",
        "rights_status": "unknown",
        "promotion": False,
        "runtime_activated": False,
        "review_receipts": [],
        "design_md": {"path": "Design.md", "sha256": sha256_file(DESIGN_MD)},
        "tokens": {name: "#%02X%02X%02X" % value for name, value in TOKENS.items()},
        "files": files,
        "sheets": [{"path": "poc-ui-candidates-sheet.png", "sha256": sheet_hash}],
        "parent_inputs": [
            {"role": f"original:{key}", "path": str(path.relative_to(REPO)), "sha256": sha256_file(path), "pixels_used": False}
            for key, path in ORIGINAL_INPUTS.items()
        ],
        "reference_inputs": [
            {"role": key, "path": str(path.relative_to(REPO)), "sha256": sha256_file(path), "pixels_used": False}
            for key, path in REFERENCE_INPUTS.items()
        ],
        "contract": report,
    }
    manifest_path = output_dir / "poc-ui-candidates.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return manifest_path


def main() -> int:
    parser = argparse.ArgumentParser(description="UI 수정 후보를 새 출력 디렉터리에 로컬 조립합니다.")
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    manifest_path = build(args.output_dir)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    print(json.dumps({
        "ok": manifest["contract"]["ok"],
        "status": manifest["status"],
        "files": len(manifest["files"]),
        "errors": manifest["contract"]["errors"],
        "manifest": str(manifest_path),
    }, indent=2, ensure_ascii=False))
    return 0 if manifest["contract"]["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
