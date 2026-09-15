#!/usr/bin/env python3
"""기존 캐릭터 정의를 보존하여 승인되지 않은 로컬 스프라이트 초안을 조립한다."""

from __future__ import annotations

import argparse
import json
import math
from hashlib import sha256
from pathlib import Path
from typing import assert_never

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
EXPLORER_ASSET_ID = "poc-explorer"
EXPLORER_PILOT_FRAMES = (
    {"role": "idle-N", "facing": "N", "action": "idle", "frame": 0},
    {"role": "idle-E", "facing": "E", "action": "idle", "frame": 0},
    {"role": "idle-S", "facing": "S", "action": "idle", "frame": 0},
    {"role": "idle-W", "facing": "W", "action": "idle", "frame": 0},
    {"role": "attack-windup", "facing": "S", "action": "attack", "frame": 2},
    {"role": "attack-contact", "facing": "S", "action": "attack", "frame": 3},
    {"role": "hit", "facing": "S", "action": "hit", "frame": 1},
    {"role": "down", "facing": "S", "action": "down", "frame": 3},
)
HEAD_H = 36
BODY_H = 90
FEET_Y = 117
NECK_W = 12
VISOR = (18, 22, 28, 255)
HELMET_GLASS = (28, 36, 44, 255)
FLASH = (255, 255, 255, 60)
APRON_STRAP = (196, 176, 140, 255)
COAT_SHADOW = {
    "poc-explorer": (36, 86, 90, 255),
    "poc-medic": (84, 112, 80, 255),
    "poc-patrol": (30, 33, 37, 255),
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


def _clamp_box(x0: int, y0: int, x1: int, y1: int) -> tuple[int, int, int, int]:
    return (max(2, min(x0, x1)), max(2, min(y0, y1)), min(W - 3, max(x0, x1)), min(H - 3, max(y0, y1)))


def px(draw: ImageDraw.ImageDraw, x: int, y: int, color: tuple[int, int, int, int], size: int = 1) -> None:
    rect(draw, x, y, x + size - 1, y + size - 1, color)


def rect(draw: ImageDraw.ImageDraw, x0: int, y0: int, x1: int, y1: int, color: tuple[int, int, int, int]) -> None:
    left, top, right, bot = _clamp_box(x0, y0, x1, y1)
    if right < left or bot < top:
        return
    draw.rectangle((left, top, right, bot), fill=color)


def oval(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], color: tuple[int, int, int, int]) -> None:
    left, top, right, bot = _clamp_box(*box)
    if right - left < 1 or bot - top < 1:
        return
    draw.ellipse((left, top, right, bot), fill=color)


def blit(dst: Image.Image, src: Image.Image, xy: tuple[int, int]) -> None:
    dst.paste(src, xy)


def screen_side(facing: str, slot: str) -> str:
    left = slot.startswith("left_")
    match facing:
        case "S":
            return "screen_right" if left else "screen_left"
        case "N":
            return "screen_left" if left else "screen_right"
        case "E":
            return "screen_left" if left else "screen_right"
        case "W":
            return "screen_right" if left else "screen_left"
        case unreachable:
            assert_never(unreachable)


def body_edge_x(facing: str, side: str, width: int, cx: int) -> int:
    match facing:
        case "E":
            left_edge, right_edge = cx - 8, cx + 12
        case "W":
            left_edge, right_edge = cx - 12, cx + 8
        case "N" | "S":
            left_edge, right_edge = cx - 12, cx + 11
        case unreachable:
            assert_never(unreachable)
    return left_edge - width + 1 if side == "screen_left" else right_edge - 1


def head_edge_x(facing: str, side: str, width: int, cx: int) -> int:
    match facing:
        case "E":
            left_edge, right_edge = cx - 6, cx + 16
        case "W":
            left_edge, right_edge = cx - 16, cx + 6
        case "N" | "S":
            left_edge, right_edge = cx - 15, cx + 14
        case unreachable:
            assert_never(unreachable)
    return left_edge - width + 1 if side == "screen_left" else right_edge - 1


def pose(action: str, frame: int, count: int) -> dict[str, float]:
    data = {
        "bob": 0.0,
        "leg": 0.0,
        "arm": 0.0,
        "recoil": 0.0,
        "down": 0.0,
        "attack": 0.0,
        "flash": 0.0,
    }
    match action:
        case "idle":
            data["bob"] = (0, 1, 2, 1)[frame]
            data["arm"] = (0.0, 0.45, 0.0, 0.45)[frame]
        case "walk":
            cycle = math.sin(frame / count * math.pi * 2)
            data["leg"] = cycle
            data["arm"] = -cycle
            data["bob"] = (0, 1, 2, 1, 0, 1)[frame]
        case "attack":
            data["attack"] = (0.0, 0.2, 0.55, 1.0, 0.62, 0.22)[frame]
            data["arm"] = data["attack"]
            data["bob"] = (0, 1, 2, 3, 1, 0)[frame]
        case "hit":
            data["recoil"] = (0.35, 1.0, 0.5)[frame]
            data["flash"] = (0.0, 1.0, 0.35)[frame]
            data["bob"] = (1, 3, 0)[frame]
        case "down":
            data["down"] = (0.28, 0.58, 0.86, 1.0)[frame]
            data["bob"] = (1, 2, 3, 4)[frame]
            data["arm"] = (0.2, 0.55, 0.9, 1.0)[frame]
        case unreachable:
            assert_never(unreachable)
    return data


def draw_character(character: dict, facing: str, action: str, frame: int) -> Image.Image:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pal = character["palette"]
    p = pose(action, frame, ACTIONS[action])
    cx = 48
    match facing:
        case "E":
            cx += 2
        case "W":
            cx -= 2
        case "N" | "S":
            pass
        case unreachable:
            assert_never(unreachable)
    if p["recoil"]:
        match facing:
            case "E":
                cx -= int(4 * p["recoil"])
            case "W":
                cx += int(4 * p["recoil"])
            case "S":
                cx += int(2 * p["recoil"])
            case "N":
                cx -= int(2 * p["recoil"])
            case unreachable:
                assert_never(unreachable)
    if action == "down":
        return draw_down(character, facing, frame, cx)

    bob = int(p["bob"])
    head_top = FEET_Y - BODY_H + 1 + bob
    neck = head_top + HEAD_H
    torso_bot = FEET_Y - 20 + bob
    coat_hem = FEET_Y - 8 + bob if character["asset_id"] == "poc-explorer" else torso_bot + 4
    stride = int(10 * p["leg"])
    left_leg_x, right_leg_x = _leg_x(facing, cx, stride)
    rect(draw, left_leg_x, neck + 18, left_leg_x + 7, FEET_Y, pal["pants"])
    rect(draw, right_leg_x, neck + 18, right_leg_x + 7, FEET_Y, pal["pants"])
    rect(draw, left_leg_x - 1, FEET_Y - 4, left_leg_x + 8, FEET_Y + 1, pal["outline"])
    rect(draw, right_leg_x - 1, FEET_Y - 4, right_leg_x + 8, FEET_Y + 1, pal["outline"])

    attack = p["attack"]
    arm = p["arm"]
    shadow = COAT_SHADOW[character["asset_id"]]
    _draw_head(character, facing, draw, pal, cx, head_top, neck)
    _draw_neck(character, facing, draw, pal, cx, neck)
    torso_top = neck + 3
    hand_r, hand_l = _draw_torso(
        character, facing, draw, pal, shadow, cx, torso_top, coat_hem, torso_bot, arm, attack,
    )
    if p["flash"]:
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        alpha = int(FLASH[3] * p["flash"])
        oval(od, (cx - 18, head_top - 2, cx + 18, coat_hem), (255, 255, 255, alpha))
        img = Image.alpha_composite(img, overlay)
        draw = ImageDraw.Draw(img)
    draw_gear(character, facing, draw, cx, head_top, neck, coat_hem, hand_r, hand_l, attack)
    return img


def _leg_x(facing: str, cx: int, stride: int) -> tuple[int, int]:
    match facing:
        case "E":
            return cx - 6 - stride, cx - 1 + stride
        case "W":
            return cx - 2 + stride, cx - 7 - stride
        case "S":
            return cx - 9 - stride, cx + 2 + stride
        case "N":
            return cx - 9 + stride, cx + 2 - stride
        case unreachable:
            assert_never(unreachable)


def _draw_neck(
    character: dict,
    facing: str,
    draw: ImageDraw.ImageDraw,
    pal: dict,
    cx: int,
    neck: int,
) -> None:
    color = pal["coat"] if character["asset_id"] == "poc-patrol" else pal["skin"]
    if facing == "N":
        rect(draw, cx - 6, neck, cx + 5, neck + 3, color)
        return
    rect(draw, cx - 6, neck - 2, cx + 5, neck + 3, color)


def _draw_torso(
    character: dict,
    facing: str,
    draw: ImageDraw.ImageDraw,
    pal: dict,
    shadow: tuple[int, int, int, int],
    cx: int,
    torso_top: int,
    coat_hem: int,
    torso_bot: int,
    arm: float,
    attack: float,
) -> tuple[tuple[int, int], tuple[int, int]]:
    asset = character["asset_id"]
    arm_y0 = torso_top + 2
    match facing:
        case "E":
            rect(draw, cx - 8, torso_top, cx + 12, coat_hem, pal["coat"])
            rect(draw, cx + 8, torso_top + 4, cx + 12, coat_hem - 2, shadow)
            if asset == "poc-explorer":
                rect(draw, cx + 2, torso_top, cx + 11, torso_top + 8, pal["accent"])
                rect(draw, cx - 2, torso_top + 10, cx + 1, coat_hem - 6, pal["pants"])
                rect(draw, cx - 4, torso_bot - 2, cx + 8, torso_bot + 1, pal["outline"])
            elif asset == "poc-medic":
                rect(draw, cx - 4, torso_top + 6, cx + 10, torso_bot + 2, pal["accent"])
                rect(draw, cx - 2, torso_top + 8, cx + 8, torso_top + 12, APRON_STRAP)
                rect(draw, cx + 1, torso_top + 16, cx + 8, torso_top + 24, pal["accent"])
            elif asset == "poc-patrol":
                rect(draw, cx - 6, torso_top + 4, cx + 8, torso_top + 8, pal["outline"])
                rect(draw, cx - 4, torso_top + 18, cx + 6, torso_top + 22, pal["outline"])
            extend = 10 + int(16 * attack) + int(8 * arm)
            hand_rx = min(88, cx + extend)
            rect(draw, cx + 10, arm_y0, hand_rx, arm_y0 + 7, pal["coat"])
            rect(draw, hand_rx - 1, arm_y0 + 4, min(90, hand_rx + 3), arm_y0 + 10, pal["skin"] if asset != "poc-patrol" else pal["coat"])
            rear = arm_y0 + 8 + int(6 * arm)
            rect(draw, cx - 14, arm_y0 + 4, cx - 7, rear + 8, pal["coat"])
            hand_r = (hand_rx + 1, arm_y0 + 6)
            hand_l = (cx - 12, rear + 6)
        case "W":
            rect(draw, cx - 12, torso_top, cx + 8, coat_hem, pal["coat"])
            rect(draw, cx - 12, torso_top + 4, cx - 8, coat_hem - 2, shadow)
            if asset == "poc-explorer":
                rect(draw, cx - 6, torso_top + 8, cx + 4, torso_top + 22, pal["outline"])
                rect(draw, cx - 4, torso_top + 10, cx + 2, torso_top + 20, pal["gear_secondary"])
            elif asset == "poc-medic":
                rect(draw, cx - 10, torso_top + 6, cx + 4, torso_bot, pal["coat"])
            extend = 10 + int(14 * attack) + int(8 * arm)
            hand_rx = max(5, cx - extend)
            rect(draw, hand_rx, arm_y0 + 3, cx - 8, arm_y0 + 10, pal["coat"])
            rect(draw, max(3, hand_rx - 2), arm_y0 + 6, hand_rx + 2, arm_y0 + 12, pal["skin"] if asset != "poc-patrol" else pal["coat"])
            rear_x = min(90, cx + 12 + int(14 * max(-arm, 0)))
            rect(draw, cx + 6, arm_y0 + 8, rear_x, arm_y0 + 22 + int(4 * arm), pal["coat"])
            hand_r = (hand_rx, arm_y0 + 8)
            hand_l = (rear_x - 2, arm_y0 + 20)
        case "S":
            rect(draw, cx - 12, torso_top, cx + 11, coat_hem, pal["coat"])
            if asset == "poc-explorer":
                rect(draw, cx - 8, torso_top, cx + 7, torso_top + 8, pal["accent"])
                rect(draw, cx - 2, torso_top + 10, cx + 1, coat_hem - 8, pal["pants"])
                px(draw, cx - 1, torso_top + 18, pal["outline"], 2)
                px(draw, cx - 1, torso_top + 26, pal["outline"], 2)
                rect(draw, cx - 8, torso_bot - 2, cx + 7, torso_bot + 1, pal["outline"])
            elif asset == "poc-medic":
                rect(draw, cx - 9, torso_top + 4, cx + 8, torso_bot + 4, pal["accent"])
                rect(draw, cx - 8, torso_top + 4, cx - 6, torso_top + 16, APRON_STRAP)
                rect(draw, cx + 5, torso_top + 4, cx + 7, torso_top + 16, APRON_STRAP)
                rect(draw, cx - 5, torso_top + 16, cx + 4, torso_top + 28, pal["accent"])
                rect(draw, cx - 4, torso_top + 18, cx + 3, torso_top + 24, APRON_STRAP)
            elif asset == "poc-patrol":
                rect(draw, cx - 10, torso_top + 4, cx + 9, torso_top + 8, pal["outline"])
                rect(draw, cx - 8, torso_top + 16, cx + 7, torso_top + 20, pal["outline"])
            left_arm_y1 = arm_y0 + 16 + int(8 * arm)
            right_arm_y1 = arm_y0 + 16 - int(12 * attack) - int(8 * arm)
            left_x = max(4, cx - 18 - int(6 * max(arm, 0)))
            right_x = min(86, cx + 11 + int(10 * attack) + int(6 * max(-arm, 0)))
            torso_left, torso_right = cx - 12, cx + 11
            rect(draw, left_x, arm_y0, left_x + 6, left_arm_y1, pal["coat"])
            rect(draw, right_x, arm_y0, right_x + 6, right_arm_y1, pal["coat"])
            rect(draw, min(left_x, torso_left), arm_y0, max(left_x + 6, torso_left), arm_y0 + 6, pal["coat"])
            rect(draw, min(right_x, torso_right), arm_y0, max(right_x + 6, torso_right), arm_y0 + 6, pal["coat"])
            skin = pal["skin"] if asset != "poc-patrol" else pal["coat"]
            rect(draw, left_x, left_arm_y1 - 2, left_x + 6, left_arm_y1 + 5, skin)
            rect(draw, right_x, right_arm_y1 - 2, right_x + 6, right_arm_y1 + 5, skin)
            hand_r = (left_x + 2, left_arm_y1 + 2)
            hand_l = (right_x + 3, right_arm_y1 + 2)
        case "N":
            rect(draw, cx - 12, torso_top, cx + 11, coat_hem, pal["coat"])
            rect(draw, cx - 8, torso_top + 6, cx + 7, coat_hem - 4, shadow)
            if asset == "poc-explorer":
                rect(draw, cx - 5, torso_top + 8, cx + 5, torso_top + 22, pal["outline"])
                rect(draw, cx - 3, torso_top + 10, cx + 3, torso_top + 20, pal["gear_secondary"])
            left_arm_y1 = arm_y0 + 16 - int(12 * attack) - int(8 * arm)
            right_arm_y1 = arm_y0 + 16 + int(8 * arm)
            left_x = max(4, cx - 20 - int(10 * attack) - int(10 * max(-arm, 0)))
            right_x = min(86, cx + 13 + int(10 * max(arm, 0)))
            torso_left, torso_right = cx - 12, cx + 11
            rect(draw, left_x, arm_y0, left_x + 6, left_arm_y1, pal["coat"])
            rect(draw, right_x, arm_y0, right_x + 6, right_arm_y1, pal["coat"])
            rect(draw, min(left_x, torso_left), arm_y0, max(left_x + 6, torso_left), arm_y0 + 6, pal["coat"])
            rect(draw, min(right_x, torso_right), arm_y0, max(right_x + 6, torso_right), arm_y0 + 6, pal["coat"])
            hand_r = (right_x + 3, right_arm_y1 + 2)
            hand_l = (left_x + 2, left_arm_y1 + 2)
        case unreachable:
            assert_never(unreachable)
    if asset == "poc-medic":
        knot_x = body_edge_x(facing, screen_side(facing, "right_arm"), 6, cx)
        rect(draw, knot_x, torso_top + 2, knot_x + 6, torso_top + 9, pal["gear_primary"])
        px(draw, knot_x + 1, torso_top + 10, pal["gear_primary"], 3)
    return hand_r, hand_l


def _stamp_spans(
    draw: ImageDraw.ImageDraw,
    cx: int,
    y0: int,
    spans: tuple[int, ...],
    color: tuple[int, int, int, int],
) -> None:
    for i, half in enumerate(spans):
        if half < 1:
            continue
        rect(draw, cx - half, y0 + i, cx + half - 1, y0 + i, color)


def _draw_head(
    character: dict,
    facing: str,
    draw: ImageDraw.ImageDraw,
    pal: dict,
    cx: int,
    head_top: int,
    neck: int,
) -> None:
    asset = character["asset_id"]
    if asset == "poc-patrol":
        _draw_patrol_helmet(facing, draw, pal, cx, head_top, neck)
        return
    skull = (5, 8, 10, 12, 13, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 15, 14, 14, 13, 13, 12, 11, 10, 9, 8)
    match facing:
        case "S":
            _stamp_spans(draw, cx, head_top, skull, pal["skin"])
            hair = (4, 7, 9, 11, 13, 14, 15, 14, 15, 13, 11, 8, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            _stamp_spans(draw, cx, head_top, hair, pal["hair"])
            if asset == "poc-medic":
                rect(draw, cx - 1, head_top + 3, cx, head_top + 14, pal["skin"])
                oval(draw, (cx - 14, head_top + 8, cx - 8, head_top + 22), pal["hair"])
                oval(draw, (cx + 7, head_top + 8, cx + 13, head_top + 22), pal["hair"])
                rect(draw, cx - 16, neck + 1, cx - 13, neck + 9, pal["hair"])
                rect(draw, cx + 12, neck + 1, cx + 15, neck + 9, pal["hair"])
            else:
                px(draw, cx - 8, head_top + 8, pal["hair"], 3)
                px(draw, cx + 6, head_top + 7, pal["hair"], 2)
                px(draw, cx - 3, head_top + 4, pal["hair"], 2)
            px(draw, cx - 6, head_top + 18, pal["eye"], 2)
            px(draw, cx + 3, head_top + 18, pal["eye"], 2)
            rect(draw, cx - 3, head_top + 25, cx + 2, head_top + 26, pal["outline"])
        case "N":
            _stamp_spans(draw, cx, head_top, skull, pal["hair"])
            if asset == "poc-medic":
                rect(draw, cx - 16, neck + 1, cx - 13, neck + 9, pal["hair"])
                rect(draw, cx + 12, neck + 1, cx + 15, neck + 9, pal["hair"])
            else:
                px(draw, cx - 9, head_top + 8, pal["hair"], 3)
                px(draw, cx + 7, head_top + 7, pal["hair"], 2)
        case "E":
            profile = (5, 7, 9, 11, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 12, 12, 11, 11, 11, 10, 10, 9, 9, 8, 8, 8, 8)
            _stamp_spans(draw, cx + 4, head_top, profile, pal["skin"])
            hair = (4, 6, 8, 10, 12, 13, 12, 13, 11, 9, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            _stamp_spans(draw, cx + 4, head_top, hair, pal["hair"])
            if asset == "poc-medic":
                rect(draw, cx + 12, neck + 5, cx + 15, neck + 12, pal["hair"])
            px(draw, cx + 9, head_top + 18, pal["eye"], 2)
            rect(draw, cx + 11, head_top + 24, cx + 14, head_top + 25, pal["outline"])
        case "W":
            profile = (5, 7, 9, 11, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 12, 12, 11, 11, 11, 10, 10, 9, 9, 8, 8, 8, 8)
            _stamp_spans(draw, cx - 4, head_top, profile, pal["skin"])
            hair = (4, 6, 8, 10, 12, 13, 13, 12, 11, 9, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            _stamp_spans(draw, cx - 4, head_top, hair, pal["hair"])
            if asset == "poc-medic":
                rect(draw, cx - 16, neck + 5, cx - 13, neck + 12, pal["hair"])
        case unreachable:
            assert_never(unreachable)


def _draw_patrol_helmet(
    facing: str,
    draw: ImageDraw.ImageDraw,
    pal: dict,
    cx: int,
    head_top: int,
    neck: int,
) -> None:
    dome = (5, 8, 10, 12, 14, 15, 16, 15, 16, 15, 16, 15, 16, 15, 16, 15, 16, 15, 16, 15, 16, 15, 15, 14, 15, 14, 13, 12, 13, 12, 11, 10, 9, 9, 8, 8)
    match facing:
        case "S":
            _stamp_spans(draw, cx, head_top, dome, pal["coat"])
            visor = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 12, 13, 12, 11, 10, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            _stamp_spans(draw, cx, head_top, visor, VISOR)
            glass = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 10, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            _stamp_spans(draw, cx, head_top, glass, HELMET_GLASS)
            oval(draw, (cx - 7, neck - 10, cx + 6, neck - 2), pal["coat"])
            rect(draw, cx - 4, neck - 6, cx + 3, neck - 4, pal["outline"])
            oval(draw, (cx - 15, head_top + 12, cx - 11, head_top + 18), pal["coat"])
            oval(draw, (cx + 10, head_top + 12, cx + 14, head_top + 18), pal["coat"])
        case "N":
            _stamp_spans(draw, cx, head_top, dome, pal["coat"])
            oval(draw, (cx - 8, head_top + 10, cx + 7, head_top + 22), pal["outline"])
            oval(draw, (cx - 16, head_top + 10, cx - 12, head_top + 20), pal["coat"])
            oval(draw, (cx + 11, head_top + 10, cx + 15, head_top + 20), pal["coat"])
        case "E":
            _stamp_spans(draw, cx + 3, head_top, dome, pal["coat"])
            visor = (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 8, 8, 7, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            _stamp_spans(draw, cx + 8, head_top, visor, VISOR)
            oval(draw, (cx + 4, neck - 8, cx + 14, neck - 1), pal["coat"])
            oval(draw, (cx - 8, head_top + 12, cx - 2, head_top + 24), pal["coat"])
        case "W":
            _stamp_spans(draw, cx - 3, head_top, dome, pal["coat"])
            oval(draw, (cx - 16, head_top + 6, cx - 4, neck - 6), pal["outline"])
            oval(draw, (cx - 14, neck - 8, cx - 4, neck - 1), pal["coat"])
            oval(draw, (cx + 2, head_top + 12, cx + 8, head_top + 24), pal["coat"])
        case unreachable:
            assert_never(unreachable)


def draw_down(character: dict, facing: str, frame: int, cx: int) -> Image.Image:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pal = character["palette"]
    asset = character["asset_id"]
    head_top = (42, 58, 72, 82)[frame]
    body_y = (70, 84, 94, 100)[frame]
    body_h = (28, 22, 16, 14)[frame]
    match facing:
        case "E":
            body_x0, body_x1 = 18, 62 + frame * 4
            head_cx = body_x1 - 6
        case "W":
            body_x0, body_x1 = 30 - frame * 4, 76
            head_cx = body_x0 + 6
        case "S" | "N":
            body_x0, body_x1 = cx - 18 - frame, cx + 17 + frame
            head_cx = cx
        case unreachable:
            assert_never(unreachable)
    body_x0, body_y, body_x1, body_bot = _clamp_box(body_x0, body_y, body_x1, body_y + body_h)
    rect(draw, body_x0, body_y, body_x1, body_bot, pal["coat"])
    if asset == "poc-medic":
        rect(draw, body_x0 + 4, body_y + 2, body_x1 - 4, body_bot - 2, pal["accent"])
    if asset == "poc-explorer":
        rect(draw, body_x0 + 2, body_y, body_x1 - 2, body_y + 4, pal["accent"])
    if frame == 0:
        rect(draw, cx - 9, 88, cx + 8, 112, pal["pants"])
        _draw_head(character, facing, draw, pal, cx, 44, 44 + HEAD_H)
        draw_gear(character, facing, draw, cx, 44, 44 + HEAD_H, 92, (cx - 16, 88), (cx + 14, 84), 0.0)
        return img
    _down_head(character, facing, draw, pal, head_cx, head_top, standing=False)
    _down_gear(character, facing, draw, pal, cx, body_y, stage=frame)
    return img


def _down_head(
    character: dict,
    facing: str,
    draw: ImageDraw.ImageDraw,
    pal: dict,
    cx: int,
    head_top: int,
    standing: bool,
) -> None:
    if standing:
        _draw_head(character, facing, draw, pal, cx, head_top, head_top + HEAD_H)
        return
    box = _clamp_box(cx - 12, head_top, cx + 11, head_top + 22)
    if character["asset_id"] == "poc-patrol":
        oval(draw, box, pal["coat"])
        if facing == "S":
            oval(draw, (box[0] + 3, box[1] + 6, box[2] - 3, box[3] - 4), VISOR)
        return
    oval(draw, box, pal["skin"])
    oval(draw, (box[0], box[1] - 2, box[2], box[1] + 12), pal["hair"])
    if facing == "S":
        px(draw, cx - 4, head_top + 12, pal["eye"], 2)
        px(draw, cx + 2, head_top + 12, pal["eye"], 2)


def _down_gear(
    character: dict,
    facing: str,
    draw: ImageDraw.ImageDraw,
    pal: dict,
    cx: int,
    y: int,
    stage: int,
) -> None:
    gear = character["gear"]
    left = screen_side(facing, "left_hip" if "left_hip" in gear else "left_chest")
    right = screen_side(facing, "right_hand")
    left_x = 18 if left == "screen_left" else 60
    right_x = 16 if right == "screen_left" else 64
    if "lantern" in gear.values():
        oval(draw, _clamp_box(left_x, y + 4, left_x + 10, y + 14), pal["gear_primary"])
    if "satchel" in gear.values():
        rect(draw, *_clamp_box(left_x, y + 4, left_x + 12, y + 14), pal["gear_secondary"])
    if "hazard_bar" in gear.values():
        bar_x = 22 if screen_side(facing, "left_chest") == "screen_left" else 58
        rect(draw, *_clamp_box(bar_x, y + 2, bar_x + 10, y + 8), pal["accent"])
    if "visor_lamp" in gear.values():
        lamp_x = 22 if screen_side(facing, "left_helmet") == "screen_left" else 60
        oval(draw, _clamp_box(lamp_x, y - 8, lamp_x + 7, y - 1), pal["gear_primary"])
    if any(item in gear.values() for item in ("prybar", "baton", "splint_kit")):
        rect(draw, *_clamp_box(right_x, y - 4, right_x + 4, y + 14), pal["gear_secondary"])
        if "splint_kit" in gear.values():
            rect(draw, *_clamp_box(right_x - 2, y, right_x + 8, y + 8), pal["accent"])
        if "prybar" in gear.values():
            hook_x = right_x if right == "screen_right" else right_x - 4
            rect(draw, *_clamp_box(hook_x, y - 4, hook_x + 7, y - 1), pal["accent"])
    if "red_cloth_knot" in gear.values():
        knot_x = 24 if screen_side(facing, "right_arm") == "screen_left" else 58
        rect(draw, *_clamp_box(knot_x, y + 1, knot_x + 6, y + 7), pal["gear_primary"])
    if "radio_antenna" in gear.values():
        ant_x = 28 if screen_side(facing, "left_shoulder") == "screen_left" else 58
        rect(draw, *_clamp_box(ant_x, y - 12, ant_x + 2, y + 2), pal["gear_secondary"])


def draw_gear(character, facing, draw, cx, head_y, torso_top, torso_bot, hand_r, hand_l, attack):
    pal = character["palette"]
    gear = character["gear"]
    for slot, item in gear.items():
        side = screen_side(facing, slot)
        match item:
            case "lantern":
                x = body_edge_x(facing, side, 10, cx)
                y = torso_bot - 12
                oval(draw, (x, y, x + 10, y + 10), pal["gear_primary"])
                rect(draw, x + 3, y - 4, x + 6, y, pal["gear_secondary"])
                px(draw, x + 4, y + 3, (250, 230, 140, 255), 2)
            case "radio_antenna":
                x = (cx - 7) if side == "screen_left" else (cx + 5)
                rect(draw, x, head_y - 4, x + 2, head_y + 12, pal["gear_secondary"])
                rect(draw, x, torso_top + 4, x + 2, torso_top + 14, pal["gear_secondary"])
                px(draw, x - 1, head_y - 8, pal["gear_primary"], 4)
            case "satchel":
                x = body_edge_x(facing, side, 12, cx)
                rect(draw, x, torso_bot - 16, x + 12, torso_bot - 4, pal["gear_secondary"])
                rect(draw, x + 2, torso_bot - 14, x + 10, torso_bot - 8, pal["outline"])
            case "red_cloth_knot":
                x = body_edge_x(facing, side, 6, cx)
                rect(draw, x, torso_top + 2, x + 6, torso_top + 9, pal["gear_primary"])
            case "hazard_bar":
                x = body_edge_x(facing, side, 10, cx)
                rect(draw, x, torso_top + 10, x + 10, torso_top + 16, pal["accent"])
            case "visor_lamp":
                x = head_edge_x(facing, side, 7, cx)
                oval(draw, (x, head_y + 6, x + 7, head_y + 13), pal["outline"])
                oval(draw, (x + 1, head_y + 7, x + 6, head_y + 12), pal["gear_primary"])
            case "prybar" | "baton" | "splint_kit":
                hx, hy = hand_r
                if item == "prybar":
                    top = hy - 4 - int(8 * attack)
                    rect(draw, hx, top, hx + 3, hy + 16, pal["gear_secondary"])
                    hook_x = hx if side == "screen_right" else hx - 4
                    rect(draw, hook_x, top, hook_x + 7, top + 3, pal["accent"])
                    oval(draw, (hx - 3, hy, hx + 5, hy + 8), pal["skin"])
                elif item == "baton":
                    top = hy - 2 - int(10 * attack)
                    baton_x = hx + 1 if side == "screen_right" else hx - 3
                    rect(draw, baton_x, top, baton_x + 3, hy + 20, pal["gear_secondary"])
                    oval(draw, (hx - 4, hy, hx + 5, hy + 9), pal["coat"])
                else:
                    rect(draw, hx - 3, hy - 1, hx + 9, hy + 10, pal["outline"])
                    rect(draw, hx - 1, hy + 1, hx + 7, hy + 7, pal["accent"])
                    oval(draw, (hx - 4, hy + 6, hx + 4, hy + 12), pal["skin"])
            case unreachable:
                assert_never(unreachable)


def identity_sheet(character: dict, frames: dict) -> Image.Image:
    sheet = Image.new("RGBA", (W * 4 + 12, H + 12), (0, 0, 0, 0))
    for i, facing in enumerate(FACINGS):
        blit(sheet, frames[(facing, "idle", 0)], (6 + i * W, 6))
    return sheet


def atlas_image(frames: dict) -> Image.Image:
    cols = 6
    rows = 4 * 5
    atlas = Image.new("RGBA", (W * cols, H * rows), (0, 0, 0, 0))
    row = 0
    for facing in FACINGS:
        for action in ACTIONS:
            for frame in range(ACTIONS[action]):
                blit(atlas, frames[(facing, action, frame)], (frame * W, row * H))
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


def _prepare_candidate_output_dir(output_dir: Path) -> Path:
    output_dir = output_dir.resolve()
    if any(part.casefold() == "game" for part in output_dir.parts):
        raise ValueError("Game 경로는 후보 출력으로 사용할 수 없습니다.")
    output_dir.mkdir(parents=True, exist_ok=False)
    return output_dir


def _character_by_id(asset_id: str) -> dict:
    for character in CHARACTERS:
        if character["asset_id"] == asset_id:
            return character
    raise KeyError(asset_id)


def build_explorer_pilot(output_dir: Path) -> Path:
    """탐사원 8프레임 파일럿만 조립한다. ADR-002 Decision 2."""
    output_dir = _prepare_candidate_output_dir(output_dir)
    character = _character_by_id(EXPLORER_ASSET_ID)
    frames = []
    for spec in EXPLORER_PILOT_FRAMES:
        image = draw_character(character, spec["facing"], spec["action"], spec["frame"])
        relative_path = f"{spec['role']}.png"
        raw_hash = write_png(output_dir / relative_path, image)
        frames.append({
            "role": spec["role"],
            "facing": spec["facing"],
            "action": spec["action"],
            "frame": spec["frame"],
            "path": relative_path,
            "raw_hash": raw_hash,
            "width": W,
            "height": H,
        })
    manifest = {
        "schema_version": 1,
        "mode": "explorer-pilot",
        "asset_id": character["asset_id"],
        "status": "draft",
        "rights_status": "unknown",
        "source": "local_assembly",
        "seed": character["seed"],
        "frame_size": [W, H],
        "frames": frames,
        "tool_versions": {"pillow": PILLOW_VERSION},
    }
    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def build(output_dir: Path) -> Path:
    """명시된 새 디렉터리에 미검수 후보만 조립한다. Unity import는 별도 작업이다."""
    output_dir = _prepare_candidate_output_dir(output_dir)
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
    parser.add_argument("--explorer-pilot", action="store_true")
    args = parser.parse_args()
    if args.explorer_pilot:
        manifest_path = build_explorer_pilot(args.output_dir)
        print(json.dumps({
            "ok": True,
            "status": "draft",
            "mode": "explorer-pilot",
            "characters": [EXPLORER_ASSET_ID],
            "frames": len(EXPLORER_PILOT_FRAMES),
            "manifest": str(manifest_path),
        }, indent=2))
        return 0
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
