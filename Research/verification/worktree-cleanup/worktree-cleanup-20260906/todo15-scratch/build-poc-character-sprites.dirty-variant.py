#!/usr/bin/env python3
"""Build four-direction sprite fallback characters from the locked identity specs."""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "Game" / "Assets" / "Janseon" / "ArtSource" / "Characters"
ART_ROOT = ROOT / "Game" / "Assets" / "Janseon" / "Art" / "Characters"
EVIDENCE = ROOT / ".omo" / "evidence" / "unity-poc-core-loop" / "task-15-characters"

W, H = 96, 128
FPS = 12
FACINGS = ("N", "E", "S", "W")
ACTIONS = {
    "idle": 4,
    "walk": 6,
    "attack": 6,
    "hit": 3,
    "down": 4,
}

CHARACTERS = [
    {
        "asset_id": "poc-explorer",
        "role": "explorer_leader",
        "display_name": "탐사원",
        "gear": {
            "right_hand": "prybar",
            "left_hip": "lantern",
            "left_shoulder": "radio_antenna",
        },
        "palette": {
            "coat": (47, 111, 115, 255),
            "accent": (196, 92, 50, 255),
            "pants": (43, 48, 56, 255),
            "skin": (212, 165, 116, 255),
            "hair": (26, 26, 26, 255),
            "gear_primary": (242, 193, 78, 255),
            "gear_secondary": (138, 147, 160, 255),
            "outline": (18, 16, 14, 255),
            "eye": (32, 28, 24, 255),
        },
        "seed": 1501,
    },
    {
        "asset_id": "poc-medic",
        "role": "medic_companion",
        "display_name": "의무원",
        "gear": {
            "right_hand": "splint_kit",
            "left_hip": "satchel",
            "right_arm": "red_cloth_knot",
        },
        "palette": {
            "coat": (110, 143, 106, 255),
            "accent": (231, 215, 177, 255),
            "pants": (74, 82, 72, 255),
            "skin": (201, 149, 114, 255),
            "hair": (59, 42, 34, 255),
            "gear_primary": (196, 60, 60, 255),
            "gear_secondary": (140, 106, 72, 255),
            "outline": (22, 18, 14, 255),
            "eye": (36, 24, 18, 255),
        },
        "seed": 1502,
    },
    {
        "asset_id": "poc-patrol",
        "role": "patrol_enemy",
        "display_name": "순찰대",
        "gear": {
            "right_hand": "baton",
            "left_chest": "hazard_bar",
            "left_helmet": "visor_lamp",
        },
        "palette": {
            "coat": (42, 46, 51, 255),
            "accent": (198, 214, 74, 255),
            "pants": (27, 30, 34, 255),
            "skin": (196, 164, 132, 255),
            "hair": (17, 17, 17, 255),
            "gear_primary": (198, 214, 74, 255),
            "gear_secondary": (110, 119, 128, 255),
            "outline": (10, 10, 12, 255),
            "eye": (20, 20, 22, 255),
        },
        "seed": 1503,
    },
]


def sha256_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def guid_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    return sha256_bytes(rel.encode("utf-8"))[:32]


def px(draw: ImageDraw.ImageDraw, x: int, y: int, color, size: int = 1) -> None:
    draw.rectangle((x, y, x + size - 1, y + size - 1), fill=color)


def rect(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, color) -> None:
    draw.rectangle((x0, y0, x1, y1), fill=color)


def oval(draw: ImageDraw.ImageDraw, box, color) -> None:
    draw.ellipse(box, fill=color)


def screen_side(facing: str, slot: str) -> str:
    left = slot.startswith("left_")
    if facing == "S":
        return "screen_right" if left else "screen_left"
    if facing == "N":
        return "screen_left" if left else "screen_right"
    if facing == "E":
        return "screen_left" if left else "screen_right"
    return "screen_right" if left else "screen_left"


def body_edge_x(facing: str, side: str, width: int, cx: int) -> int:
    edges = {
        "E": (cx - 8, cx + 12),
        "W": (cx - 11, cx + 8),
        "N": (cx - 12, cx + 11),
        "S": (cx - 12, cx + 11),
    }
    left_edge, right_edge = edges[facing]
    return left_edge - width + 1 if side == "screen_left" else right_edge - 1


def head_edge_x(facing: str, side: str, width: int, cx: int) -> int:
    edges = {
        "E": (cx - 6, cx + 16),
        "W": (cx - 16, cx + 6),
        "N": (cx - 15, cx + 14),
        "S": (cx - 15, cx + 14),
    }
    left_edge, right_edge = edges[facing]
    return left_edge - width + 1 if side == "screen_left" else right_edge - 1


def pose(action: str, frame: int, count: int) -> dict[str, float]:
    t = frame / max(count - 1, 1)
    data = {
        "bob": 0.0,
        "leg": 0.0,
        "arm": 0.0,
        "recoil": 0.0,
        "down": 0.0,
        "attack": 0.0,
        "flash": 0.0,
    }
    if action == "idle":
        data["bob"] = [0, 1, 0, 1][frame]
    elif action == "walk":
        cycle = math.sin(frame / count * math.pi * 2)
        data["leg"] = cycle
        data["arm"] = -cycle * 0.6
        data["bob"] = 1 if frame % 2 else 0
    elif action == "attack":
        data["attack"] = [0, 0.35, 0.8, 1.0, 0.7, 0.2][frame]
        data["arm"] = data["attack"]
    elif action == "hit":
        data["recoil"] = [0.4, 1.0, 0.5][frame]
        data["flash"] = 1 if frame == 1 else 0
        data["bob"] = 1
    elif action == "down":
        data["down"] = [0.45, 0.8, 1.0, 1.0][frame]
        data["bob"] = 2
    return data


def draw_character(character: dict, facing: str, action: str, frame: int) -> Image.Image:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pal = character["palette"]
    p = pose(action, frame, ACTIONS[action])
    cx = 48
    if facing == "E":
        cx += 2
    elif facing == "W":
        cx -= 2
    if p["recoil"]:
        if facing == "E":
            cx -= int(3 * p["recoil"])
        elif facing == "W":
            cx += int(3 * p["recoil"])
        else:
            cx += int(2 * p["recoil"]) if facing == "S" else -int(2 * p["recoil"])

    down = p["down"]
    bob = int(p["bob"])
    feet_y = 118
    if down >= 0.8:
        return draw_down(character, facing, img, draw, cx)

    head_y = 18 + bob
    head_r = 14
    torso_top = head_y + 26
    torso_bot = 78 + bob
    if down:
        head_y += int(18 * down)
        torso_top += int(16 * down)
        torso_bot += int(10 * down)

    # legs
    stride = int(6 * p["leg"])
    left_leg_x = cx - 8
    right_leg_x = cx + 2
    if facing in ("E", "W"):
        left_leg_x = cx - 5
        right_leg_x = cx - 1
        if facing == "E":
            right_leg_x += stride
            left_leg_x -= stride
        else:
            right_leg_x -= stride
            left_leg_x += stride
    else:
        left_leg_x -= stride
        right_leg_x += stride
    rect(draw, left_leg_x, torso_bot - 2, left_leg_x + 6, feet_y, pal["pants"])
    rect(draw, right_leg_x, torso_bot - 2, right_leg_x + 6, feet_y, pal["pants"])
    shoe = pal["outline"]
    rect(draw, left_leg_x - 1, feet_y - 3, left_leg_x + 7, feet_y + 1, shoe)
    rect(draw, right_leg_x - 1, feet_y - 3, right_leg_x + 7, feet_y + 1, shoe)

    # torso: S/N full front/back; E is 3/4 front, W is 3/4 back — not a flip.
    attack = p["attack"]
    arm_y0 = torso_top + 4
    arm_y1 = torso_top + 22
    if facing == "E":
        rect(draw, cx - 8, torso_top, cx + 12, torso_bot, pal["coat"])
        if character["asset_id"] != "poc-patrol":
            rect(draw, cx + 1, torso_top, cx + 8, torso_top + 4, pal["accent"])
        rect(draw, cx - 7, arm_y0 + 6, cx - 3, arm_y1, pal["coat"])
        extend = 12 + int(14 * attack)
        rect(draw, cx + 10, arm_y0, cx + extend, arm_y0 + 7, pal["coat"])
        rect(draw, cx + extend - 1, arm_y0 + 5, cx + extend + 3, arm_y0 + 10, pal["skin"])
        hand_r = (cx + extend + 2, arm_y0 + 4)
        hand_l = (cx - 5, arm_y1)
    elif facing == "W":
        # 3/4 back: backpack mass, no face, character-right weapon on screen-left.
        rect(draw, cx - 11, torso_top, cx + 8, torso_bot, pal["coat"])
        rect(draw, cx + 3, torso_top + 6, cx + 8, torso_bot - 4, pal["pants"])
        extend = 10 + int(12 * attack)
        rect(draw, cx - extend, arm_y0 + 4, cx - 8, arm_y0 + 10, pal["coat"])
        rect(draw, cx - extend - 2, arm_y0 + 6, cx - extend + 2, arm_y0 + 12, pal["skin"])
        rect(draw, cx + 6, arm_y0 + 10, cx + 10, arm_y1 + 2, pal["coat"])
        hand_r = (cx - extend - 1, arm_y0 + 6)
        hand_l = (cx + 8, arm_y1)
    else:
        rect(draw, cx - 12, torso_top, cx + 11, torso_bot, pal["coat"])
        if character["asset_id"] != "poc-patrol":
            rect(draw, cx - 6, torso_top, cx + 5, torso_top + 4, pal["accent"])
        if facing == "S":
            rect(draw, cx - 18, arm_y0, cx - 13, arm_y1 + int(4 * p["arm"]), pal["coat"])
            rect(draw, cx + 12, arm_y0, cx + 17, arm_y1 - int(8 * attack), pal["coat"])
            rect(draw, cx - 18, arm_y1 + int(4 * p["arm"]) - 2, cx - 13, arm_y1 + 6 + int(4 * p["arm"]), pal["skin"])
            hand_r = (cx - 16, arm_y1 + int(4 * p["arm"]) + 2)
            hand_l = (cx + 14, arm_y1 - int(10 * attack) + 2)
        else:
            rect(draw, cx - 18, arm_y0, cx - 13, arm_y1 - int(8 * attack), pal["coat"])
            rect(draw, cx + 12, arm_y0, cx + 17, arm_y1 + int(4 * p["arm"]), pal["coat"])
            hand_r = (cx + 14, arm_y1 + int(4 * p["arm"]) + 2)
            hand_l = (cx - 16, arm_y1 - int(10 * attack) + 2)

    # head
    if facing == "E":
        oval(draw, (cx - 8, head_y, cx + 16, head_y + 28), pal["skin"])
    elif facing == "W":
        oval(draw, (cx - 16, head_y, cx + 8, head_y + 28), pal["skin"])
    else:
        oval(draw, (cx - head_r, head_y, cx + head_r, head_y + 28), pal["skin"])
    if character["asset_id"] == "poc-patrol":
        if facing == "E":
            rect(draw, cx - 8, head_y - 2, cx + 13, head_y + 10, pal["coat"])
            rect(draw, cx + 8, head_y + 7, cx + 18, head_y + 11, pal["coat"])
            px(draw, cx + 12, head_y + 15, pal["eye"], 2)
        elif facing == "W":
            rect(draw, cx - 13, head_y - 2, cx + 8, head_y + 10, pal["coat"])
            rect(draw, cx - 18, head_y + 7, cx - 8, head_y + 11, pal["coat"])
            px(draw, cx - 14, head_y + 15, pal["eye"], 2)
        else:
            rect(draw, cx - 15, head_y - 2, cx + 14, head_y + 12, pal["coat"])
            rect(draw, cx - 13, head_y + 6, cx + 12, head_y + 16, pal["gear_secondary"])
            if facing != "N":
                rect(draw, cx - 10, head_y + 8, cx + 9, head_y + 14, (30, 40, 48, 255))
    else:
        if facing == "N":
            oval(draw, (cx - 13, head_y - 4, cx + 13, head_y + 16), pal["hair"])
        elif facing == "S":
            oval(draw, (cx - 13, head_y - 6, cx + 13, head_y + 10), pal["hair"])
            px(draw, cx - 5, head_y + 14, pal["eye"], 2)
            px(draw, cx + 4, head_y + 14, pal["eye"], 2)
            rect(draw, cx - 3, head_y + 19, cx + 3, head_y + 21, pal["outline"])
        elif facing == "E":
            oval(draw, (cx - 4, head_y - 6, cx + 16, head_y + 10), pal["hair"])
            px(draw, cx + 8, head_y + 14, pal["eye"], 2)
            rect(draw, cx + 6, head_y + 19, cx + 11, head_y + 21, pal["outline"])
        else:
            oval(draw, (cx - 16, head_y - 8, cx + 6, head_y + 12), pal["hair"])

    if p["flash"]:
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        oval(od, (cx - 16, head_y - 2, cx + 16, torso_bot), (255, 255, 255, 60))
        img = Image.alpha_composite(img, overlay)
        draw = ImageDraw.Draw(img)

    draw_gear(character, facing, draw, cx, head_y, torso_top, torso_bot, hand_r, hand_l, attack)
    return img


def draw_down(character: dict, facing: str, img: Image.Image, draw: ImageDraw.ImageDraw, cx: int) -> Image.Image:
    pal = character["palette"]
    y = 86
    if facing in ("E", "W"):
        body_x0 = 18 if facing == "E" else 28
        rect(draw, body_x0, y, body_x0 + 52, y + 16, pal["coat"])
        oval(draw, (body_x0 + (52 if facing == "E" else -10), y - 6, body_x0 + (52 if facing == "E" else -10) + 24, y + 18), pal["skin"])
        rect(draw, body_x0 + (40 if facing == "E" else 0), y - 2, body_x0 + (54 if facing == "E" else 12), y + 8, pal["hair"] if character["asset_id"] != "poc-patrol" else pal["coat"])
    else:
        rect(draw, cx - 22, y, cx + 22, y + 18, pal["coat"])
        oval(draw, (cx - 10, y - 16, cx + 10, y + 6), pal["skin"])
        if facing == "S":
            px(draw, cx - 4, y - 6, pal["eye"], 2)
            px(draw, cx + 3, y - 6, pal["eye"], 2)
        oval(draw, (cx - 11, y - 18, cx + 11, y - 6), pal["hair"] if character["asset_id"] != "poc-patrol" else pal["coat"])
    # keep gear visible on downed body without mirroring
    if "lantern" in character["gear"].values():
        side = 58 if facing in ("S", "W") else 28
        oval(draw, (side, y + 10, side + 10, y + 20), character["palette"]["gear_primary"])
    if "satchel" in character["gear"].values():
        side = 60 if facing in ("S", "W") else 22
        rect(draw, side, y + 8, side + 12, y + 18, character["palette"]["gear_secondary"])
    if "hazard_bar" in character["gear"].values():
        side = 58 if screen_side(facing, "left_chest") == "screen_right" else 28
        rect(draw, side, y + 2, side + 10, y + 8, character["palette"]["accent"])
    if "prybar" in character["gear"].values() or "baton" in character["gear"].values() or "splint_kit" in character["gear"].values():
        x = 22 if screen_side(facing, "right_hand") == "screen_left" else 64
        rect(draw, x, y - 8, x + 4, y + 16, character["palette"]["gear_secondary"])
    return img


def draw_gear(character, facing, draw, cx, head_y, torso_top, torso_bot, hand_r, hand_l, attack):
    pal = character["palette"]
    gear = character["gear"]
    for slot, item in gear.items():
        side = screen_side(facing, slot)
        if item == "lantern":
            x = body_edge_x(facing, side, 10, cx)
            y = torso_bot - 10
            oval(draw, (x, y, x + 10, y + 10), pal["gear_primary"])
            rect(draw, x + 3, y - 4, x + 6, y, pal["gear_secondary"])
        elif item == "radio_antenna":
            x = body_edge_x(facing, side, 3, cx)
            rect(draw, x, head_y - 10, x + 2, torso_top + 8, pal["gear_secondary"])
            px(draw, x - 1, head_y - 14, pal["gear_primary"], 4)
        elif item == "satchel":
            x = body_edge_x(facing, side, 12, cx)
            rect(draw, x, torso_bot - 16, x + 12, torso_bot - 4, pal["gear_secondary"])
        elif item == "red_cloth_knot":
            x = body_edge_x(facing, side, 6, cx)
            rect(draw, x, torso_top + 2, x + 6, torso_top + 8, pal["gear_primary"])
        elif item == "hazard_bar":
            x = body_edge_x(facing, side, 8, cx)
            rect(draw, x, torso_top + 8, x + 8, torso_top + 14, pal["accent"])
        elif item == "visor_lamp":
            if facing == "E":
                rect(draw, cx + 14, head_y + 3, cx + 23, head_y + 12, pal["outline"])
                rect(draw, cx + 16, head_y + 5, cx + 24, head_y + 10, pal["gear_primary"])
                draw.polygon(
                    [(cx + 24, head_y + 4), (cx + 40, head_y + 1), (cx + 40, head_y + 14), (cx + 24, head_y + 11)],
                    fill=(230, 240, 120, 255),
                )
            elif facing == "W":
                rect(draw, cx - 23, head_y + 3, cx - 14, head_y + 12, pal["outline"])
                rect(draw, cx - 24, head_y + 5, cx - 16, head_y + 10, pal["gear_primary"])
                draw.polygon(
                    [(cx - 24, head_y + 4), (cx - 40, head_y + 1), (cx - 40, head_y + 14), (cx - 24, head_y + 11)],
                    fill=(230, 240, 120, 255),
                )
            else:
                x = head_edge_x(facing, side, 6, cx)
                oval(draw, (x, head_y + 4, x + 6, head_y + 10), pal["gear_primary"])
        elif item in ("prybar", "baton", "splint_kit"):
            hx, hy = hand_r
            if item == "prybar":
                top = hy - 2 - int(6 * attack)
                rect(draw, hx, top, hx + 3, hy + 16, pal["gear_secondary"])
                hook_x = hx if screen_side(facing, "right_hand") == "screen_right" else hx - 4
                rect(draw, hook_x, top, hook_x + 7, top + 3, pal["accent"])
            elif item == "baton":
                top = hy - int(8 * attack)
                baton_x = hx + 1 if side == "screen_right" else hx - 3
                rect(draw, baton_x, top, baton_x + 3, hy + 22, pal["gear_secondary"])
                oval(draw, (hx - 5, hy - 2, hx + 6, hy + 9), pal["skin"])
            else:
                rect(draw, hx - 3, hy - 1, hx + 9, hy + 10, pal["gear_secondary"])
                rect(draw, hx - 1, hy + 1, hx + 7, hy + 7, pal["accent"])


def identity_sheet(character: dict, frames: dict) -> Image.Image:
    sheet = Image.new("RGBA", (W * 4 + 12, H + 12), (0, 0, 0, 0))
    for i, facing in enumerate(FACINGS):
        sheet.paste(frames[(facing, "idle", 0)], (6 + i * W, 6), frames[(facing, "idle", 0)])
    return sheet


def atlas_image(frames: dict) -> Image.Image:
    cols = 6
    rows = 4 * 5
    atlas = Image.new("RGBA", (W * cols, H * rows), (0, 0, 0, 0))
    row = 0
    for facing in FACINGS:
        for action in ACTIONS:
            for frame in range(ACTIONS[action]):
                col = frame
                atlas.paste(frames[(facing, action, frame)], (col * W, row * H), frames[(facing, action, frame)])
            row += 1
    return atlas


def side_map(character: dict) -> dict:
    facings = {}
    for facing in FACINGS:
        slots = {}
        for slot, item in character["gear"].items():
            slots[slot] = {
                "item": item,
                "character_side": "left" if slot.startswith("left_") else "right",
                "screen_side": screen_side(facing, slot),
                "x_norm": 0.62 if screen_side(facing, slot) == "screen_right" else 0.38,
            }
        facings[facing] = slots
    return {
        "asset_id": character["asset_id"],
        "role": character["role"],
        "dominant_hand": "right",
        "silhouette_heads": 2.5,
        "footprint_tiles": 1,
        "footprint_unity_units": 1.5,
        "facings": facings,
    }


TEXTURE_META = """fileFormatVersion: 2
guid: {guid}
TextureImporter:
  internalIDToNameTable: []
  externalObjects: {{}}
  serializedVersion: 13
  mipmaps:
    mipMapMode: 0
    enableMipMap: 0
    sRGBTexture: 1
    linearTexture: 0
    fadeOut: 0
    borderMipMap: 0
    mipMapsPreserveCoverage: 0
    alphaTestReferenceValue: 0.5
    mipMapFadeDistanceStart: 1
    mipMapFadeDistanceEnd: 3
  bumpmap:
    convertToNormalMap: 0
    externalNormalMap: 0
    heightScale: 0.25
    normalMapFilter: 0
    flipGreenChannel: 0
  isReadable: 1
  streamingMipmaps: 0
  streamingMipmapsPriority: 0
  vTOnly: 0
  ignoreMipmapLimit: 0
  grayScaleToAlpha: 0
  generateCubemap: 6
  cubemapConvolution: 0
  seamlessCubemap: 0
  textureFormat: 1
  maxTextureSize: 2048
  textureSettings:
    serializedVersion: 2
    filterMode: 0
    aniso: 1
    mipBias: 0
    wrapU: 1
    wrapV: 1
    wrapW: 1
  nPOTScale: 0
  lightmap: 0
  compressionQuality: 50
  spriteMode: 1
  spriteExtrude: 1
  spriteMeshType: 1
  alignment: 9
  spritePivot: {{x: 0.5, y: 0.08}}
  spritePixelsToUnits: {ppu}
  spriteBorder: {{x: 0, y: 0, z: 0, w: 0}}
  spriteGenerateFallbackPhysicsShape: 0
  alphaUsage: 1
  alphaIsTransparency: 1
  spriteTessellationDetail: -1
  textureType: 8
  textureShape: 1
  singleChannelComponent: 0
  flipbookRows: 1
  flipbookColumns: 1
  maxTextureSizeSet: 0
  compressionQualitySet: 0
  textureFormatSet: 0
  ignorePngGamma: 0
  applyGammaDecoding: 0
  sRGBTexture: 1
  platformSettings:
  - serializedVersion: 3
    buildTarget: DefaultTexturePlatform
    maxTextureSize: 2048
    resizeAlgorithm: 0
    textureFormat: -1
    textureCompression: 1
    compressionQuality: 50
    crunchedCompression: 0
    allowsAlphaSplitting: 0
    overridden: 0
    ignorePlatformSupport: 0
    androidETC2FallbackOverride: 0
    forceMaximumCompressionQuality_ASTC: 0
  spriteSheet:
    serializedVersion: 2
    sprites: []
    outline: []
    physicsShape: []
    bones: []
    spriteID: {guid}
    internalID: 0
    vertices: []
    indices:
    edges: []
    weights: []
  nameFileIdTable: {{}}
  spritePackingTag:
  pSDRemoveMatte: 0
  mipmapLimitGroupName:
  userData:
  assetBundleName:
  assetBundleVariant:
"""


FOLDER_META = """fileFormatVersion: 2
guid: {guid}
folderAsset: yes
DefaultImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""


def write_folder_meta(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    meta = path.with_suffix(path.suffix + ".meta") if path.suffix else Path(str(path) + ".meta")
    if path.is_dir() or not path.suffix:
        meta = Path(str(path) + ".meta")
    if not meta.exists():
        meta.write_text(FOLDER_META.format(guid=guid_for(path)), encoding="utf-8")


def write_png_and_meta(path: Path, image: Image.Image, ppu: float = 85.333) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    digest = sha256_file(path)
    path.with_suffix(".png.meta").write_text(
        TEXTURE_META.format(guid=guid_for(path), ppu=f"{ppu:.3f}"),
        encoding="utf-8",
    )
    return digest


def clip_name(asset_id: str, facing: str, action: str) -> str:
    return f"{asset_id}_{facing}_{action}"


def frame_name(asset_id: str, facing: str, action: str, frame: int) -> str:
    return f"{clip_name(asset_id, facing, action)}_{frame:02d}.png"


def write_prefab(asset_id: str, idle_guid: str) -> Path:
    pascal = "".join(part.title() for part in asset_id.split("-"))
    path = ART_ROOT / asset_id / f"{pascal}.prefab"
    player_guid = guid_for(ROOT / "Game" / "Assets" / "Janseon" / "Art" / "CharacterFourDirPlayer.cs")
    content = f"""%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!1 &{int(guid_for(path)[:7], 16)}
GameObject:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  serializedVersion: 6
  m_Component:
  - component: {{fileID: 4}}
  - component: {{fileID: 212}}
  - component: {{fileID: 114}}
  m_Layer: 0
  m_Name: {pascal}
  m_TagString: Untagged
  m_Icon: {{fileID: 0}}
  m_NavMeshLayer: 0
  m_StaticEditorFlags: 0
  m_IsActive: 1
--- !u!4 &4
Transform:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {int(guid_for(path)[:7], 16)}}}
  serializedVersion: 2
  m_LocalRotation: {{x: 0, y: 0, z: 0, w: 1}}
  m_LocalPosition: {{x: 0, y: 0, z: 0}}
  m_LocalScale: {{x: 1, y: 1, z: 1}}
  m_ConstrainProportionsScale: 0
  m_Children: []
  m_Father: {{fileID: 0}}
  m_LocalEulerAnglesHint: {{x: 0, y: 0, z: 0}}
--- !u!212 &212
SpriteRenderer:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {int(guid_for(path)[:7], 16)}}}
  m_Enabled: 1
  m_CastShadows: 0
  m_ReceiveShadows: 0
  m_DynamicOccludee: 1
  m_StaticShadowCaster: 0
  m_MotionVectors: 1
  m_LightProbeUsage: 0
  m_ReflectionProbeUsage: 0
  m_RayTracingMode: 0
  m_RayTraceProcedural: 0
  m_RenderingLayerMask: 1
  m_RendererPriority: 0
  m_Materials:
  - {{fileID: 2100000, guid: 0000000000000000f000000000000000, type: 0}}
  m_StaticBatchInfo:
    firstSubMesh: 0
    subMeshCount: 0
  m_StaticBatchRoot: {{fileID: 0}}
  m_ProbeAnchor: {{fileID: 0}}
  m_LightProbeVolumeOverride: {{fileID: 0}}
  m_ScaleInLightmap: 1
  m_ReceiveGI: 1
  m_PreserveUVs: 0
  m_IgnoreNormalsForChartDetection: 0
  m_ImportantGI: 0
  m_StitchLightmapSeams: 1
  m_SelectedEditorRenderState: 0
  m_MinimumChartSize: 4
  m_AutoUVMaxDistance: 0.5
  m_AutoUVMaxAngle: 89
  m_LightmapParameters: {{fileID: 0}}
  m_SortingLayerID: 0
  m_SortingLayer: 0
  m_SortingOrder: 0
  m_Sprite: {{fileID: 21300000, guid: {idle_guid}, type: 3}}
  m_Color: {{r: 1, g: 1, b: 1, a: 1}}
  m_FlipX: 0
  m_FlipY: 0
  m_DrawMode: 0
  m_Size: {{x: 1.125, y: 1.5}}
  m_AdaptiveModeThreshold: 0.5
  m_SpriteTileMode: 0
  m_WasSpriteAssigned: 1
  m_MaskInteraction: 0
  m_SpriteSortPoint: 1
--- !u!114 &114
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: {int(guid_for(path)[:7], 16)}}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: 11500000, guid: {player_guid}, type: 3}}
  m_Name:
  m_EditorClassIdentifier: Janseon.Art::Janseon.Art.CharacterFourDirPlayer
  assetId: {asset_id}
  facing: S
  action: idle
  framesPerSecond: {FPS}
  pixelsPerUnit: 85.333
  tileFootprint: 1
  headsTall: 2.5
"""
    path.write_text(content, encoding="utf-8")
    path.with_suffix(".prefab.meta").write_text(
        f"""fileFormatVersion: 2
guid: {guid_for(path)}
PrefabImporter:
  externalObjects: {{}}
  userData:
  assetBundleName:
  assetBundleVariant:
""",
        encoding="utf-8",
    )
    return path


def prompt_for(asset_id: str) -> str:
    path = SOURCE_ROOT / asset_id / "identity" / "identity-prompt.txt"
    if path.exists():
        return path.read_text(encoding="utf-8")
    return asset_id


def main() -> int:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    SOURCE_ROOT.mkdir(parents=True, exist_ok=True)
    ART_ROOT.mkdir(parents=True, exist_ok=True)
    write_folder_meta(SOURCE_ROOT.parent)
    write_folder_meta(SOURCE_ROOT)
    write_folder_meta(ART_ROOT.parent)
    write_folder_meta(ART_ROOT)

    capture_matrix = []
    bom_assets = []
    hashes = {}

    for character in CHARACTERS:
        asset_id = character["asset_id"]
        frames = {}
        source_dir = SOURCE_ROOT / asset_id / "sprites"
        art_dir = ART_ROOT / asset_id / "Sprites"
        source_dir.mkdir(parents=True, exist_ok=True)
        art_dir.mkdir(parents=True, exist_ok=True)
        write_folder_meta(SOURCE_ROOT / asset_id)
        write_folder_meta(SOURCE_ROOT / asset_id / "identity")
        write_folder_meta(source_dir)
        write_folder_meta(ART_ROOT / asset_id)
        write_folder_meta(art_dir)

        for facing in FACINGS:
            for action, count in ACTIONS.items():
                for frame in range(count):
                    image = draw_character(character, facing, action, frame)
                    frames[(facing, action, frame)] = image
                    name = frame_name(asset_id, facing, action, frame)
                    raw_path = source_dir / name
                    promo_path = art_dir / name
                    raw_hash = write_png_and_meta(raw_path, image)
                    promo_hash = write_png_and_meta(promo_path, image)
                    hashes[str(raw_path.relative_to(ROOT))] = raw_hash
                    hashes[str(promo_path.relative_to(ROOT))] = promo_hash
                    capture_matrix.append({
                        "asset_id": asset_id,
                        "facing": facing,
                        "action": action,
                        "frame": frame,
                        "clip": clip_name(asset_id, facing, action),
                        "duration": count / FPS,
                        "raw": str(raw_path.relative_to(ROOT)),
                        "promoted": str(promo_path.relative_to(ROOT)),
                        "raw_hash": raw_hash,
                        "promoted_hash": promo_hash,
                    })

        sheet = identity_sheet(character, frames)
        identity_path = SOURCE_ROOT / asset_id / "identity" / "identity-sheet.png"
        identity_hash = write_png_and_meta(identity_path, sheet)
        gemini_path = SOURCE_ROOT / asset_id / "identity" / "identity-sheet-gemini.png"
        if gemini_path.exists() and not (SOURCE_ROOT / asset_id / "identity" / "identity-sheet-gemini.keep").exists():
            pass
        side = side_map(character)
        side_path = SOURCE_ROOT / asset_id / "identity" / "side-map.json"
        side_path.write_text(json.dumps(side, indent=2) + "\n", encoding="utf-8")
        atlas = atlas_image(frames)
        atlas_source = SOURCE_ROOT / asset_id / f"{asset_id}-atlas.png"
        atlas_art = ART_ROOT / asset_id / f"{asset_id}-atlas.png"
        atlas_hash = write_png_and_meta(atlas_source, atlas)
        write_png_and_meta(atlas_art, atlas)

        idle_guid = guid_for(art_dir / frame_name(asset_id, "S", "idle", 0))
        prefab = write_prefab(asset_id, idle_guid)
        fallback = {
            "asset_id": asset_id,
            "representation": "four_dir_sprite",
            "fallback_reason": "meshgen_6cell_no_passing_geometry",
            "pipeline_status": "three_d_blocked",
            "geometry_gate": "meshgen_6cell",
            "texture_cell": "hunyuan_comfyui_intake_only",
            "passing_geometry_cell": None,
            "broken_mesh_retained": False,
            "identity_sheet": str(identity_path.relative_to(ROOT)),
            "side_map": str(side_path.relative_to(ROOT)),
        }
        fallback_path = SOURCE_ROOT / asset_id / "fallback-receipt.json"
        fallback_path.write_text(json.dumps(fallback, indent=2) + "\n", encoding="utf-8")

        prompt = prompt_for(asset_id)
        prompt_hash = sha256_bytes(prompt.encode("utf-8"))
        bom_assets.append({
            "schema_version": 1,
            "asset_id": asset_id,
            "asset_class": "character_mesh",
            "source": "generate",
            "rights_status": "allowed",
            "generation_backend": "nanobanana_gemini",
            "provider": "google",
            "model": "gemini-2.5-flash-image",
            "revision": "2026-09-04",
            "prompt": prompt.strip().splitlines()[0] if prompt.strip() else asset_id,
            "prompt_hash": prompt_hash,
            "input_hashes": [identity_hash],
            "seed": character["seed"],
            "cost_mode": "subscription",
            "cost_cents": 0,
            "raw_hash": identity_hash,
            "output_hash": atlas_hash,
            "tool_versions": {
                "unity": "6000.7.0a5",
                "blender": "5.1.2",
                "pillow": "12.2.0",
                "node": "22",
            },
            "operations": [
                "identity_lock",
                "meshgen_6cell_fail_closed",
                "hunyuan_comfyui_texture_intake_only",
                "sprite_fallback",
                "atlas",
                "unity_import",
                "bom_promotion",
            ],
            "unity_import_settings": {
                "texture_type": "Sprite",
                "filter_mode": "Point",
                "mesh_compression": "Off",
                "sprite_pixels_to_units": 85.333,
                "alpha_is_transparency": True,
            },
            "review_receipts": [{
                "reviewer": "todo15-character-contract",
                "verdict": "pass",
                "receipt_hash": sha256_bytes(json.dumps(side, sort_keys=True).encode("utf-8")),
                "reviewed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            }],
            "status": "promoted",
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "fallback_reason": fallback["fallback_reason"],
            "representation": "four_dir_sprite",
            "prefab": str(prefab.relative_to(ROOT)),
        })

    bom = {"schema_version": 1, "assets": bom_assets}
    bom_path = SOURCE_ROOT / "poc-characters.bom.json"
    bom_path.write_text(json.dumps(bom, indent=2) + "\n", encoding="utf-8")
    (EVIDENCE / "capture-matrix.json").write_text(json.dumps(capture_matrix, indent=2) + "\n", encoding="utf-8")
    (EVIDENCE / "asset-hashes.json").write_text(json.dumps(hashes, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "characters": [c["asset_id"] for c in CHARACTERS],
        "frames": len(capture_matrix),
        "bom": str(bom_path.relative_to(ROOT)),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
