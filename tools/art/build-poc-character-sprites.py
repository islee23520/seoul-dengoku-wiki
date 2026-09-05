#!/usr/bin/env python3
"""기존 캐릭터 정의를 보존하여 승인되지 않은 로컬 스프라이트 초안을 조립한다."""

from __future__ import annotations

import argparse
import json
import math
from hashlib import sha256
from pathlib import Path

from PIL import Image, ImageDraw, __version__ as PILLOW_VERSION

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


def write_png(path: Path, image: Image.Image) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return sha256_file(path)


def clip_name(asset_id: str, facing: str, action: str) -> str:
    return f"{asset_id}_{facing}_{action}"


def frame_name(asset_id: str, facing: str, action: str, frame: int) -> str:
    return f"{clip_name(asset_id, facing, action)}_{frame:02d}.png"


def build(output_dir: Path) -> Path:
    """명시된 새 디렉터리에 미검수 후보만 조립한다. Unity import는 별도 작업이다."""
    output_dir = output_dir.resolve()
    if any(part.casefold() in {"game", "artsource"} for part in output_dir.parts):
        raise ValueError("Game/ArtSource 경로는 후보 출력으로 사용할 수 없습니다.")
    output_dir.mkdir(parents=True, exist_ok=False)
    capture_matrix = []
    bom_assets = []
    hashes = {}

    for character in CHARACTERS:
        asset_id = character["asset_id"]
        frames = {}
        for facing in FACINGS:
            for action, count in ACTIONS.items():
                for frame in range(count):
                    image = draw_character(character, facing, action, frame)
                    frames[(facing, action, frame)] = image
                    raw_path = output_dir / asset_id / "sprites" / frame_name(asset_id, facing, action, frame)
                    raw_hash = write_png(raw_path, image)
                    relative_path = raw_path.relative_to(output_dir).as_posix()
                    hashes[relative_path] = raw_hash
                    capture_matrix.append({
                        "asset_id": asset_id,
                        "facing": facing,
                        "action": action,
                        "frame": frame,
                        "clip": clip_name(asset_id, facing, action),
                        "duration": count / FPS,
                        "raw": relative_path,
                        "raw_hash": raw_hash,
                    })

        identity_path = output_dir / asset_id / "identity" / "identity-sheet.png"
        identity_hash = write_png(identity_path, identity_sheet(character, frames))
        side_path = output_dir / asset_id / "identity" / "side-map.json"
        side_path.write_text(json.dumps(side_map(character), indent=2) + "\n", encoding="utf-8")
        atlas_path = output_dir / asset_id / f"{asset_id}-atlas.png"
        atlas_hash = write_png(atlas_path, atlas_image(frames))
        for path in (identity_path, side_path, atlas_path):
            hashes[path.relative_to(output_dir).as_posix()] = sha256_file(path)
        bom_assets.append({
            "schema_version": 1,
            "asset_id": asset_id,
            "role": character["role"],
            "representation": "four_dir_sprite",
            "source": "local_assembly",
            "rights_status": "unknown",
            "seed": character["seed"],
            "raw_hash": identity_hash,
            "output_hash": atlas_hash,
            "identity_sheet": identity_path.relative_to(output_dir).as_posix(),
            "side_map": side_path.relative_to(output_dir).as_posix(),
            "atlas": atlas_path.relative_to(output_dir).as_posix(),
            "tool_versions": {"pillow": PILLOW_VERSION},
            "operations": ["sprite_assembly", "atlas"],
            "review_receipts": [],
            "status": "draft",
        })

    bom_path = output_dir / "poc-characters.bom.json"
    bom_path.write_text(json.dumps({"schema_version": 1, "assets": bom_assets}, indent=2) + "\n", encoding="utf-8")
    matrix_path = output_dir / "capture-matrix.json"
    matrix_path.write_text(json.dumps(capture_matrix, indent=2) + "\n", encoding="utf-8")
    for path in (bom_path, matrix_path):
        hashes[path.relative_to(output_dir).as_posix()] = sha256_file(path)
    (output_dir / "asset-hashes.json").write_text(json.dumps(hashes, indent=2) + "\n", encoding="utf-8")
    return bom_path


def main() -> int:
    parser = argparse.ArgumentParser(description="캐릭터 초안을 새 출력 디렉터리에 로컬 조립합니다.")
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    bom_path = build(args.output_dir)
    print(json.dumps({
        "ok": True,
        "status": "draft",
        "characters": [c["asset_id"] for c in CHARACTERS],
        "frames": len(CHARACTERS) * len(FACINGS) * sum(ACTIONS.values()),
        "bom": str(bom_path),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
