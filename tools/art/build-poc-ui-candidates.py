#!/usr/bin/env python3
"""Design.md 토큰만으로 UI 수정 후보(title, icon, tile, panel, button)를 명시 디렉터리에 초안으로 조립한다."""

from __future__ import annotations

import argparse
import json
import math
from hashlib import sha256
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat, __version__ as PILLOW_VERSION

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
    "raw:floor": REPO / "Game/Assets/Janseon/ArtSource/Tiles/poc-tile-texture/raw/floor.jpg",
    "raw:wall": REPO / "Game/Assets/Janseon/ArtSource/Tiles/poc-tile-texture/raw/wall.jpg",
    "raw:platform": REPO / "Game/Assets/Janseon/ArtSource/Tiles/poc-tile-texture/raw/platform.jpg",
    "raw:title": REPO / "Game/Assets/Janseon/ArtSource/Title/poc-title-art/raw/title.jpg",
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

def compose_title(tiles: dict[str, Image.Image]) -> Image.Image:
    """일점 투시 역사 콘코스: 실제 후보 타일로 바닥/벽 재질, 비상등 청백 조명, 꺼진 안내판, 개찰구, 벤치."""
    W, H = 1920, 1080
    F, cx, horizon = 1150.0, 960.0, 462.0
    h, c, w, D = 1.65, 2.35, 6.2, 24.0
    S = 64 / 0.6  # px per metre
    void = np.array(TOKENS["bg-void"], dtype=np.float64)

    xs = (np.arange(W) + 0.5)[None, :]
    ys = (np.arange(H) + 0.5)[:, None]
    dirx = np.broadcast_to((xs - cx) / F, (H, W))
    diry = np.broadcast_to((horizon - ys) / F, (H, W))
    big = 1e9
    z_floor = np.where(diry < -1e-6, h / np.maximum(-diry, 1e-6), big)
    z_ceil = np.where(diry > 1e-6, c / np.maximum(diry, 1e-6), big)
    z_left = np.where(dirx < -1e-6, w / np.maximum(-dirx, 1e-6), big)
    z_right = np.where(dirx > 1e-6, w / np.maximum(dirx, 1e-6), big)
    stack = np.stack([z_floor, z_ceil, z_left, z_right])
    plane = stack.argmin(0)
    z = stack.min(0)
    back = z > D
    z = np.where(back, D, z)
    plane = np.where(back, 4, plane)
    X, Y, Z = dirx * z, diry * z, z

    def mips(image: Image.Image):
        arr = np.asarray(image.convert("RGB")).astype(np.float64)
        return [arr] + [np.asarray(image.convert("RGB").filter(ImageFilter.GaussianBlur(r))).astype(np.float64) for r in (1.2, 2.5, 5.0)]

    def sample(levels, u, v):
        ui = np.floor(u).astype(np.int64) % 256
        vi = np.floor(v).astype(np.int64) % 256
        level = np.clip(np.floor(np.log2(np.maximum(Z, 1.0) / 3.0)), 0, 3).astype(int)
        out = np.zeros((H, W, 3), dtype=np.float64)
        for index, arr in enumerate(levels):
            sel = level == index
            out[sel] = arr[vi[sel], ui[sel]]
        return out

    floor_m = mips(tiles["floor"])
    wall_m = mips(tiles["wall"])
    ceiling_noise = fbm(256, 71, ((4, 0.5), (16, 0.3), (64, 0.2)))
    ceiling_arr = np.array(mix(TOKENS["bg-panel-raised"], TOKENS["text-muted"], 0.25), dtype=np.float64)[None, None, :] * (0.8 + 0.4 * ceiling_noise)[..., None]
    ceiling_m = [ceiling_arr] * 4

    albedo = np.zeros((H, W, 3), dtype=np.float64)
    for p, (levels, u, v) in {
        0: (floor_m, X * S, Z * S),
        1: (ceiling_m, X * S, Z * S),
        2: (wall_m, Z * S, (c - Y) * S),
        3: (wall_m, Z * S, (c - Y) * S),
        4: (wall_m, X * S, (c - Y) * S),
    }.items():
        sel = plane == p
        albedo[sel] = sample(levels, u, v)[sel]

    # 벽면은 바닥보다 어둡게(그을음), 천장 더 어둡게
    albedo[plane == 1] *= 0.55
    albedo[(plane >= 2)] *= 0.72

    # 조명: 벽/천장 접합부 비상등 스트립(청백, 연속) + 천장 중앙선 비상 luminaire 4m 간격 + 거리 안개.
    light_col = np.array([0.82, 0.90, 1.0])
    lamp_z = (3.0, 7.0, 11.0, 15.0, 19.0, 23.0)
    lamp_size = (0.6, 0.22)
    ambient = 0.24

    def strip_term(Xw, Yw):
        d2 = (np.abs(Xw) - w) ** 2 + (Yw - c) ** 2
        return 1.1 / (1.0 + d2 / 6.0)

    def lamp_term(Xw, Yw, Zw):
        total = 0.0
        for zk in lamp_z:
            d2 = Xw ** 2 + (Yw - c) ** 2 + (Zw - zk) ** 2
            total = total + 1.6 / (1.0 + d2 / 5.0)
        return total

    strip = strip_term(X, Y)
    lamps = lamp_term(X, Y, Z)
    is_ceiling = plane == 1
    lamps = np.where(is_ceiling, lamps * 0.6, lamps)
    intensity = ambient + strip + lamps
    junction = np.exp(-((np.abs(X) - w) ** 2) / 0.35) * np.exp(-((Y + h) ** 2) / 0.45)
    ao = 1 - 0.45 * junction
    color = albedo * intensity[..., None] * light_col[None, None, :] * ao[..., None]

    # 젖은 바닥: 램프/스트립 반사를 웅덩이 마스크로 제한(한 스톱)
    wet = np.clip((wrapped_noise(256, 3, 77)[(np.floor(Z * 20).astype(int) % 256), (np.floor((X + 40) * 12).astype(int) % 256)] - 0.45) * 2.4, 0, 1)
    is_floor = plane == 0
    refl = np.zeros_like(Z)
    for zk in lamp_z:
        refl = refl + np.exp(-(X ** 2) / 0.9) * np.exp(-((Z - zk) ** 2) / 1.2)
    refl = refl + 0.5 * np.exp(-((np.abs(X) - w) ** 2) / 1.6)
    color += (is_floor * wet * np.clip(refl, 0, 1) * 0.30)[..., None] * light_col[None, None, :] * 255 * 0.55
    fog = 1 - np.exp(-Z / 22.0)
    color = color * (1 - fog)[..., None] + void[None, None, :] * fog[..., None]

    image = to_image(color)
    draw = ImageDraw.Draw(image, "RGBA")

    def proj(Xw: float, Yw: float, Zw: float) -> tuple[float, float]:
        return (cx + F * Xw / Zw, horizon - F * Yw / Zw)

    def light_at(Xw: float, Yw: float, Zw: float) -> tuple[float, float]:
        i = ambient + float(strip_term(np.array(Xw), np.array(Yw))) + float(lamp_term(np.array(Xw), np.array(Yw), np.array(Zw)))
        f = 1 - math.exp(-Zw / 22.0)
        return i, f

    def shade(base: tuple, Xw: float, Yw: float, Zw: float, k: float = 1.0) -> tuple[int, int, int, int]:
        i, f = light_at(Xw, Yw, Zw)
        out = []
        for ch, lc, fc in zip(base, light_col, void):
            v = ch * i * lc * k
            out.append(int(np.clip(v * (1 - f) + fc * f, 0, 255)))
        return (out[0], out[1], out[2], 255)

    # 뒷벽: 꺼진 안내판 두 개와 통로 입구(깊이)
    def rect_on_back(x0, y0, x1, y1, fill, outline=None):
        a = proj(x0, y1, D)
        b = proj(x1, y0, D)
        draw.rectangle((a[0], a[1], b[0], b[1]), fill=fill, outline=outline, width=2)

    pa = proj(0.9, 1.7, D)
    pb = proj(4.3, -h, D)
    passage_h = max(1, int(pb[1] - pa[1]))
    passage = Image.new("RGB", (max(1, int(pb[0] - pa[0])), passage_h))
    grad = np.linspace(0.35, 1.0, passage_h)[:, None, None]
    passage_arr = void[None, None, :] * 0.5 * (1 - grad) + np.array(mix(TOKENS["bg-well"], TOKENS["text-muted"], 0.3), dtype=np.float64)[None, None, :] * grad * 0.8
    passage = to_image(np.broadcast_to(passage_arr, (passage_h, passage.size[0], 3)))
    image.paste(passage, (int(pa[0]), int(pa[1])))
    rect_on_back(0.9, -h, 1.15, 1.7, shade(TOKENS["stroke-quiet"], 1.0, 0.0, D, 0.9))
    rect_on_back(4.05, -h, 4.3, 1.7, shade(TOKENS["stroke-quiet"], 4.2, 0.0, D, 0.9))
    for x0, x1 in ((-4.6, -2.2), (-1.6, 0.2)):
        rect_on_back(x0, 1.05, x1, 1.75, shade(TOKENS["bg-well"], (x0 + x1) / 2, 1.4, D, 0.7), shade(TOKENS["stroke-quiet"], (x0 + x1) / 2, 1.4, D))

    # 천장 배관 3줄(소실점으로 수렴)
    for xp, yp, tone in ((-2.4, c - 0.12, 0.55), (-2.05, c - 0.16, 0.5), (2.6, c - 0.1, 0.55)):
        near = proj(xp, yp, 1.05)
        far = proj(xp, yp, D)
        width = int(max(2, 14 / 1.05))
        draw.line((near, far), fill=shade(TOKENS["text-muted"], xp, yp, 4.0, tone), width=6)
        draw.line((near, far), fill=shade(TOKENS["text-secondary"], xp, yp, 4.0, tone * 0.6), width=2)

    # 깊이 순서로 소품: 기둥, 매달린 꺼진 안내판, 개찰구, 벤치
    props = []
    for Zp in (21.5, 16.5, 11.5, 6.5):
        for Xp in (-3.4, 3.4):
            props.append((Zp, "pillar", Xp))
    props.append((6.6, "sign", 0.0))
    for index in range(6):
        props.append((9.0, "gate", -3.1 + index * 0.72))
    props.append((12.4, "bench", -5.0))
    props.append((5.2, "bench", -5.0))
    props.append((14.8, "bench", 5.0))
    props.sort(key=lambda item: -item[0])
    pillar_col = mix(TOKENS["text-muted"], TOKENS["bg-panel-raised"], 0.35)
    gate_col = mix(TOKENS["text-muted"], TOKENS["bg-panel-raised"], 0.5)
    gate_top = TOKENS["text-muted"]
    bench_col = (110, 88, 62)
    for Zp, kind, Xp in props:
        if kind == "pillar":
            width = 0.5
            x0, x1 = Xp - width / 2, Xp + width / 2
            a = proj(x0, c, Zp)
            b = proj(x1, -h, Zp)
            pw, ph = max(1, int(b[0] - a[0])), max(1, int(b[1] - a[1]))
            face_rgb = np.array(shade(pillar_col, Xp, 0.3, Zp)[:3], dtype=np.float64)
            tex = fbm(256, int(Zp * 10 + (7 if Xp < 0 else 3)), ((4, 0.4), (16, 0.35), (64, 0.25)))
            tex = np.asarray(Image.fromarray((tex * 255).astype(np.uint8), "L").resize((pw, ph), Image.Resampling.BILINEAR)).astype(np.float64) / 255.0
            vertical = np.linspace(1.0, 0.82, ph)[:, None]
            base_dirt = 1 - 0.28 * np.clip((np.linspace(0, 1, ph)[:, None] - 0.82) / 0.18, 0, 1)
            column = face_rgb[None, None, :] * (0.88 + 0.24 * tex)[..., None] * (vertical * base_dirt)[..., None]
            image.paste(to_image(column), (int(a[0]), int(a[1])))
            draw = ImageDraw.Draw(image, "RGBA")
            side_x = x1 if Xp < 0 else x0
            s0 = proj(side_x, c, Zp)
            s1 = proj(side_x, -h, Zp)
            s2 = proj(side_x, -h, Zp + 0.5)
            s3 = proj(side_x, c, Zp + 0.5)
            draw.polygon([s0, s1, s2, s3], fill=shade(pillar_col, Xp, 0.3, Zp, 0.7))
            top = proj(x0, c, Zp)
            draw.line((top, proj(x1, c, Zp)), fill=shade(TOKENS["text-secondary"], Xp, c, Zp, 0.5), width=2)
            if Zp == 11.5 and Xp < 0:
                lamp_pt = proj(x1 + 0.02, 1.85, Zp)
                r = 5
                draw.ellipse((lamp_pt[0] - r * 2.4, lamp_pt[1] - r * 2.4, lamp_pt[0] + r * 2.4, lamp_pt[1] + r * 2.4), fill=(201, 162, 39, 40))
                draw.ellipse((lamp_pt[0] - r, lamp_pt[1] - r, lamp_pt[0] + r, lamp_pt[1] + r), fill=(201, 162, 39, 255))
        elif kind == "sign":
            a = proj(-1.5, 2.05, Zp)
            b = proj(1.5, 1.5, Zp)
            frame = shade(TOKENS["text-muted"], 0, 1.8, Zp, 0.45)
            draw.rectangle((a[0], a[1], b[0], b[1]), fill=frame)
            glass = shade(TOKENS["bg-well"], 0, 1.8, Zp, 0.55)
            draw.rectangle((a[0] + 3, a[1] + 3, b[0] - 3, b[1] - 3), fill=glass)
            sheen_a = proj(-1.45, 2.0, Zp)
            sheen_b = proj(1.45, 1.93, Zp)
            draw.rectangle((sheen_a[0], sheen_a[1], sheen_b[0], sheen_b[1]), fill=(196, 212, 232, 22))
            for hx in (-1.2, 1.2):
                draw.line((proj(hx, c, Zp), proj(hx, 2.05, Zp)), fill=shade(TOKENS["text-muted"], hx, 2.2, Zp), width=2)
        elif kind == "gate":
            width, depth, height = 0.16, 0.7, 1.05
            x0, x1 = Xp - width / 2, Xp + width / 2
            t0 = proj(x0, -h + height, Zp)
            t1 = proj(x1, -h + height, Zp)
            t2 = proj(x1, -h + height, Zp + depth)
            t3 = proj(x0, -h + height, Zp + depth)
            draw.polygon([t0, t1, t2, t3], fill=shade(gate_top, Xp, -0.6, Zp, 1.1))
            a = proj(x0, -h + height, Zp)
            b = proj(x1, -h, Zp)
            draw.rectangle((a[0], a[1], b[0], b[1]), fill=shade(gate_col, Xp, -1.0, Zp, 0.95), outline=shade(TOKENS["bg-well"], Xp, -1.0, Zp), width=1)
            panel_a = proj(x0 + 0.03, -h + height - 0.06, Zp - 0.001)
            panel_b = proj(x1 - 0.03, -h + height - 0.34, Zp - 0.001)
            draw.rectangle((panel_a[0], panel_a[1], panel_b[0], panel_b[1]), fill=shade(TOKENS["bg-well"], Xp, -0.8, Zp, 0.8))
            led = proj(Xp, -h + height - 0.2, Zp - 0.002)
            r = max(2.0, 4.0 * 9.0 / Zp)
            draw.ellipse((led[0] - r, led[1] - r, led[0] + r, led[1] + r), fill=(150, 48, 44, 255))
        elif kind == "bench":
            length, depth, top_y, seat_h = 1.9, 0.5, -h + 0.45, 0.08
            x0, x1 = Xp - length / 2, Xp + length / 2
            q = [proj(x0, top_y, Zp), proj(x1, top_y, Zp), proj(x1, top_y, Zp + depth), proj(x0, top_y, Zp + depth)]
            draw.polygon(q, fill=shade(bench_col, Xp, top_y, Zp, 1.1))
            a = proj(x0, top_y, Zp)
            b = proj(x1, top_y - seat_h, Zp)
            draw.rectangle((a[0], a[1], b[0], b[1]), fill=shade(bench_col, Xp, top_y, Zp, 0.8))
            for lx in (x0 + 0.15, x1 - 0.25):
                la = proj(lx, top_y - seat_h, Zp)
                lb = proj(lx + 0.1, -h, Zp)
                draw.rectangle((la[0], la[1], lb[0], lb[1]), fill=shade(TOKENS["bg-panel-raised"], lx, -1.2, Zp, 0.9))

    # 비상등 기구: 벽/천장 접합부 스트립 밴드(벽면 상단 0.1m) + 천장 중앙 luminaire, 블러 halo 한 겹
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    z_near = 1.15
    for side in (-1, 1):
        band = [proj(side * w, c - 0.02, z_near), proj(side * w, c - 0.02, D), proj(side * w, c - 0.14, D), proj(side * w, c - 0.14, z_near)]
        gd.polygon(band, fill=(188, 204, 224, 215))
        cover = [proj(side * w, c - 0.14, z_near), proj(side * w, c - 0.14, D), proj(side * w, c - 0.20, D), proj(side * w, c - 0.20, z_near)]
        gd.polygon(cover, fill=(120, 132, 150, 255))
    for zk in lamp_z:
        half_w, half_d = lamp_size[0] / 2, lamp_size[1] / 2
        quad = [proj(-half_w, c - 0.001, zk - half_d), proj(half_w, c - 0.001, zk - half_d), proj(half_w, c - 0.001, zk + half_d), proj(-half_w, c - 0.001, zk + half_d)]
        gd.polygon(quad, fill=(214, 226, 242, 255))
    blurred = glow.filter(ImageFilter.GaussianBlur(18))
    blurred.putalpha(blurred.split()[3].point(lambda v: int(v * 0.5)))
    image = Image.alpha_composite(image.convert("RGBA"), blurred)
    image = Image.alpha_composite(image, glow)

    # 마무리: 비네트, 상단 1스톱 어둡게, 필름 그레인
    arr = np.asarray(image.convert("RGB")).astype(np.float64)
    ny = (ys - H / 2) / (H / 2)
    nx = (xs - W / 2) / (W / 2)
    r2 = nx ** 2 + ny ** 2
    vignette = 1 - 0.22 * np.clip(r2 / 1.6, 0, 1)
    top_shade = 1 - 0.10 * np.clip((H * 0.35 - ys) / (H * 0.35), 0, 1)
    arr = arr * (vignette * top_shade)[..., None]
    grain = np.tile(wrapped_noise(256, 128, 99), (H // 256 + 1, W // 256 + 1))[:H, :W]
    arr = arr + ((grain - 0.5) * 6)[..., None]
    return to_image(arr)


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
    """명시 후보 디렉터리에 draft만 조립한다. 원본/ArtSource/Game 경로에는 쓰지 않는다."""
    output_dir = output_dir.resolve()
    if any(part.casefold() in {"game", "artsource"} for part in output_dir.parts):
        raise ValueError("Game/ArtSource 경로는 후보 출력으로 사용할 수 없습니다.")
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
