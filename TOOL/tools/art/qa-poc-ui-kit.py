#!/usr/bin/env python3
"""Machine QA for the Todo 13 UI/station texture kit."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageStat

REPO = Path(__file__).resolve().parents[3]
ART_UI = REPO / "Game" / "Assets" / "Janseon" / "Art" / "UI"
ART_TITLE = REPO / "Game" / "Assets" / "Janseon" / "Art" / "Title"
ART_TILES = REPO / "Game" / "Assets" / "Janseon" / "Art" / "Tiles"

BUTTON_IDS = [
    "poc-ui-button-normal",
    "poc-ui-button-hover",
    "poc-ui-button-pressed",
]
ICON_NAMES = [
    "talk",
    "detour",
    "battle",
    "heal",
    "party",
    "station",
    "crate",
    "alert",
]
TILE_FILES = [
    "poc-tile-floor.png",
    "poc-tile-wall.png",
    "poc-tile-platform.png",
]


def fail(errors: list[str], extra: dict | None = None) -> int:
    payload = {"ok": False, "errors": errors}
    if extra:
        payload.update(extra)
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 1


def ocr_text(path: Path) -> str:
    binary = shutil.which("tesseract")
    if binary is None:
        return ""
    completed = subprocess.run(
        [binary, str(path), "stdout", "-l", "eng+kor", "--psm", "6"],
        check=False,
        capture_output=True,
        text=True,
    )
    return " ".join(completed.stdout.split()).strip()


def alpha_bbox(image: Image.Image, threshold: int = 16) -> tuple[int, int, int, int] | None:
    alpha = image.split()[-1]
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def mean_abs_diff(left: Image.Image, right: Image.Image) -> float:
    delta = ImageChops.difference(left.convert("RGB"), right.convert("RGB"))
    stats = ImageStat.Stat(delta)
    return sum(stats.mean) / len(stats.mean)


def seam_score(tile: Image.Image) -> dict:
    width, height = tile.size
    doubled = Image.new("RGB", (width * 2, height * 2))
    rgb = tile.convert("RGB")
    for y in range(2):
        for x in range(2):
            doubled.paste(rgb, (x * width, y * height))
    vertical = doubled.crop((width - 2, 0, width + 2, height * 2))
    horizontal = doubled.crop((0, height - 2, width * 2, height + 2))
    left = vertical.crop((0, 0, 2, height * 2))
    right = vertical.crop((2, 0, 4, height * 2))
    top = horizontal.crop((0, 0, width * 2, 2))
    bottom = horizontal.crop((0, 2, width * 2, 4))
    return {
        "vertical_mean_abs": mean_abs_diff(left, right),
        "horizontal_mean_abs": mean_abs_diff(top, bottom),
    }


def unique_ink_ratio(image: Image.Image) -> float:
    rgba = image.convert("RGBA")
    pixels = list(rgba.getdata())
    ink = {pixel[:3] for pixel in pixels if pixel[3] > 32}
    return len(ink) / max(len(pixels), 1)


def main() -> int:
    errors: list[str] = []
    buttons: dict[str, dict] = {}
    missing = []
    required = [
        ART_TITLE / "poc-title-art.png",
        ART_UI / "poc-ui-concept.png",
        ART_UI / "poc-ui-kit.png",
        ART_UI / "poc-ui-panel-9slice.png",
        ART_UI / "poc-ui-icons.png",
    ]
    required.extend(ART_UI / f"{asset_id}.png" for asset_id in BUTTON_IDS)
    required.extend(ART_TILES / name for name in TILE_FILES)
    required.extend(ART_UI / f"icon-{name}.png" for name in ICON_NAMES)
    for path in required:
        if not path.exists():
            missing.append(str(path.relative_to(REPO)))
    if missing:
        return fail(["missing_files"] + missing)

    title = Image.open(ART_TITLE / "poc-title-art.png")
    if title.size != (1920, 1080):
        errors.append(f"title_size:{title.size}")
    title_text = ocr_text(ART_TITLE / "poc-title-art.png")
    if len(title_text) >= 12:
        errors.append(f"title_long_text:{title_text[:80]}")
    lowered = title_text.lower()
    for token in ("watermark", "openai", "midjourney", "©", "http"):
        if token in lowered:
            errors.append(f"title_watermark:{token}")

    panel = Image.open(ART_UI / "poc-ui-panel-9slice.png").convert("RGBA")
    if panel.size != (256, 256):
        errors.append(f"panel_size:{panel.size}")
    border = 48
    center = panel.crop((border, border, 256 - border, 256 - border))
    center_alpha = ImageStat.Stat(center.split()[-1]).mean[0]
    if center_alpha > 80:
        errors.append(f"panel_center_not_empty:{center_alpha:.1f}")
    edge = panel.crop((0, 0, 256, 8))
    edge_alpha = ImageStat.Stat(edge.split()[-1]).mean[0]
    if edge_alpha < 160:
        errors.append(f"panel_edge_too_transparent:{edge_alpha:.1f}")
    if panel.getextrema()[3][0] > 16:
        errors.append("panel_missing_transparent_pixels")

    reference = None
    for asset_id in BUTTON_IDS:
        image = Image.open(ART_UI / f"{asset_id}.png").convert("RGBA")
        bbox = alpha_bbox(image)
        buttons[asset_id] = {
            "width": image.size[0],
            "height": image.size[1],
            "bbox": bbox,
        }
        if image.size != (256, 64):
            errors.append(f"{asset_id}_size:{image.size}")
        if bbox is None:
            errors.append(f"{asset_id}_empty_alpha")
            continue
        if reference is None:
            reference = {"bbox": bbox, "mask": image.split()[-1]}
        else:
            if bbox != reference["bbox"]:
                errors.append(f"{asset_id}_bbox_mismatch:{bbox}!={reference['bbox']}")
            mask_delta = ImageChops.difference(image.split()[-1], reference["mask"])
            if ImageStat.Stat(mask_delta).mean[0] > 1.5:
                errors.append(f"{asset_id}_alpha_mismatch:{ImageStat.Stat(mask_delta).mean[0]:.2f}")

    icon_atlas = Image.open(ART_UI / "poc-ui-icons.png").convert("RGBA")
    if icon_atlas.size != (256, 128):
        errors.append(f"icon_atlas_size:{icon_atlas.size}")
    for name in ICON_NAMES:
        icon = Image.open(ART_UI / f"icon-{name}.png").convert("RGBA")
        if icon.size != (64, 64):
            errors.append(f"icon_{name}_size:{icon.size}")
        small = icon.resize((32, 32), Image.Resampling.NEAREST)
        if unique_ink_ratio(small) < 0.002:
            errors.append(f"icon_{name}_unreadable_32px")
        bbox = alpha_bbox(small, threshold=40)
        if bbox is None:
            errors.append(f"icon_{name}_empty_32px")
        else:
            box_w = bbox[2] - bbox[0]
            box_h = bbox[3] - bbox[1]
            if box_w < 10 or box_h < 10:
                errors.append(f"icon_{name}_too_small_32px:{bbox}")
        text = ocr_text(ART_UI / f"icon-{name}.png")
        letters = [token for token in text.split() if any(char.isalpha() for char in token)]
        if any(len(token) >= 3 for token in letters):
            errors.append(f"icon_{name}_has_text:{text}")

    seams = {}
    for name in TILE_FILES:
        tile = Image.open(ART_TILES / name)
        if tile.size != (256, 256):
            errors.append(f"{name}_size:{tile.size}")
        score = seam_score(tile)
        seams[name] = score
        if score["vertical_mean_abs"] > 12 or score["horizontal_mean_abs"] > 12:
            errors.append(f"{name}_seam:{score}")
        blurred = tile.convert("RGB").filter(ImageFilter.GaussianBlur(radius=8))
        if mean_abs_diff(tile.convert("RGB"), blurred) < 1.2:
            errors.append(f"{name}_too_flat")

    payload = {
        "ok": not errors,
        "errors": errors,
        "buttons": buttons,
        "seams": seams,
        "title_ocr": title_text,
        "panel_center_alpha": center_alpha,
    }
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
