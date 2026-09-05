"""로컬 조립은 초안만 만들며 기존 파일과 그림 정의를 보존한다."""

import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from hashlib import sha256
from pathlib import Path

from PIL import Image

TOOL = Path(__file__).with_name("build-poc-character-sprites.py")
SPEC = importlib.util.spec_from_file_location("character_builder", TOOL)
assert SPEC is not None and SPEC.loader is not None
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)

HEADS_TARGET = 2.5
HEADS_TOLERANCE = 0.08
FOOTPRINT_WIDTH_RATIO_MAX = 0.72
MIN_BODY_ROW_WIDTH = 8


def render_all_frames():
    packed = {}
    for character in builder.CHARACTERS:
        frames = {}
        for facing in builder.FACINGS:
            for action, count in builder.ACTIONS.items():
                for frame in range(count):
                    frames[(facing, action, frame)] = builder.draw_character(
                        character, facing, action, frame,
                    )
        packed[character["asset_id"]] = (character, frames)
    return packed


def opaque_rows(image: Image.Image, min_width: int = MIN_BODY_ROW_WIDTH):
    px = image.load()
    width, height = image.size
    rows = []
    for y in range(height):
        xs = [x for x in range(width) if px[x, y][3] > 32]
        if len(xs) >= min_width:
            rows.append((y, xs[0], xs[-1]))
    return rows


def measure_heads(image: Image.Image) -> tuple[float, int, int, int]:
    rows = opaque_rows(image)
    if not rows:
        raise AssertionError("empty silhouette")
    top = rows[0][0]
    bot = rows[-1][0]
    body_h = bot - top + 1
    upper = [row for row in rows if row[0] <= top + int(body_h * 0.42)]
    max_w = max(row[2] - row[1] + 1 for row in upper)
    seen_head = False
    neck_y = None
    for y, x0, x1 in upper:
        width = x1 - x0 + 1
        if width >= max_w * 0.75:
            seen_head = True
        elif seen_head and width <= 14:
            neck_y = y
            break
    if neck_y is None:
        raise AssertionError(f"neck not found top={top} body_h={body_h} max_w={max_w}")
    head_h = neck_y - top
    if head_h < 8:
        raise AssertionError(f"head too small: {head_h}")
    return body_h / head_h, body_h, head_h, max(row[2] - row[1] + 1 for row in rows)


def first_pixel(image: Image.Image, color: tuple[int, int, int, int]) -> tuple[int, int] | None:
    px = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            if px[x, y] == color:
                return (x, y)
    return None


def color_centroid(image: Image.Image, rgb: tuple[int, int, int], y0: int, y1: int) -> tuple[float, float, int] | None:
    px = image.load()
    width, _height = image.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(y0, y1):
        for x in range(width):
            pixel = px[x, y]
            if pixel[3] > 32 and pixel[:3] == rgb:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return (sum(xs) / len(xs), sum(ys) / len(ys), len(xs))


def count_rgb(image: Image.Image, rgb: tuple[int, int, int], y0: int = 0, y1: int = 128) -> int:
    px = image.load()
    width, _height = image.size
    n = 0
    for y in range(y0, y1):
        for x in range(width):
            pixel = px[x, y]
            if pixel[3] > 32 and pixel[:3] == rgb:
                n += 1
    return n


def opaque_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    box = image.split()[-1].getbbox()
    if box is None:
        raise AssertionError("empty frame")
    return box


def edge_opaque_count(image: Image.Image) -> int:
    px = image.load()
    width, height = image.size
    n = 0
    for y in range(height):
        if px[0, y][3] > 0 or px[width - 1, y][3] > 0:
            n += 1
    for x in range(width):
        if px[x, 0][3] > 0 or px[x, height - 1][3] > 0:
            n += 1
    return n


def head_row_widths(image: Image.Image, top: int, neck: int) -> list[int]:
    px = image.load()
    width, _height = image.size
    widths = []
    for y in range(top, neck):
        xs = [x for x in range(width) if px[x, y][3] > 32]
        if len(xs) >= 4:
            widths.append(xs[-1] - xs[0] + 1)
    return widths


def longest_constant_run(values: list[int]) -> int:
    longest = 1
    run = 1
    for i in range(1, len(values)):
        if values[i] == values[i - 1]:
            run += 1
            if run > longest:
                longest = run
        else:
            run = 1
    return longest


def limb_span(image: Image.Image, y0: int, y1: int) -> int:
    px = image.load()
    width, _height = image.size
    left = width
    right = 0
    for y in range(y0, y1):
        for x in range(width):
            if px[x, y][3] > 32:
                if x < left:
                    left = x
                if x > right:
                    right = x
    if right < left:
        return 0
    return right - left + 1


class DraftAssemblyTests(unittest.TestCase):
    def test_atlas_preserves_all_alpha_levels_and_transparent_rgb(self):
        # Given: 실제 RGBA 경계값 전체. 무시된 로컬 evidence를 테스트 fixture로 쓰지 않는다.
        source = Image.new("RGBA", (96, 128))
        source.putdata([(37, 113, 209, i % 256) for i in range(96 * 128)])
        frames = {
            (facing, action, frame): source
            for facing in builder.FACINGS
            for action, count in builder.ACTIONS.items()
            for frame in range(count)
        }
        # When: 실제 atlas 조립 함수를 호출한다.
        atlas = builder.atlas_image(frames)
        # Then: 알파0 RGB도 버리지 않고 알파1~254를 제곱하지 않는다.
        self.assertEqual(atlas.crop((0, 0, 96, 128)).tobytes(), source.tobytes())

    def test_build_records_only_drafts_and_real_file_hashes(self):
        # Given: 기존 source/runtime를 흉내 낸 파일과 별도 후보 디렉터리.
        with tempfile.TemporaryDirectory(prefix="character-draft-") as temporary:
            root = Path(temporary)
            sentinel = root / "original.png"
            sentinel.write_bytes(b"preserved-original")
            output = root / "candidates"
            # When: 실제 조립 entry point를 실행한다.
            builder.build(output)
            # Then: 모든 파일은 지정 디렉터리 안에 있고 승인 기록은 없다.
            self.assertEqual(sentinel.read_bytes(), b"preserved-original")
            self.assertEqual(set(root.iterdir()), {sentinel, output})
            manifest = json.loads((output / "poc-characters.bom.json").read_text())
            self.assertEqual(len(manifest["assets"]), 3)
            for asset in manifest["assets"]:
                self.assertEqual(asset["rights_status"], "unknown")
                self.assertEqual(asset["status"], "draft")
                self.assertEqual(asset["review_receipts"], [])
                for fabricated in ("provider", "model", "prefab", "unity_import_settings", "prompt_hash"):
                    self.assertNotIn(fabricated, asset)
                self.assertEqual(asset["output_hash"], sha256((output / asset["atlas"]).read_bytes()).hexdigest())
            hashes = json.loads((output / "asset-hashes.json").read_text())
            actual = {p.relative_to(output).as_posix() for p in output.rglob("*") if p.is_file()}
            self.assertEqual(actual, set(hashes) | {"asset-hashes.json"})
            for name, expected in hashes.items():
                path = output / name
                self.assertTrue(path.resolve().is_relative_to(output.resolve()))
                self.assertIn(path.suffix, {".png", ".json"})
                self.assertEqual(sha256(path.read_bytes()).hexdigest(), expected, name)
            matrix = json.loads((output / "capture-matrix.json").read_text())
            self.assertEqual(len(matrix), 276)
            self.assertEqual({item["facing"] for item in matrix}, {"N", "E", "S", "W"})
            self.assertEqual([asset["seed"] for asset in manifest["assets"]], [1501, 1502, 1503])
            for item in matrix:
                self.assertNotIn("promoted", item)
                self.assertEqual(hashes[item["raw"]], item["raw_hash"])

    def test_changed_palette_changes_written_pixels_and_hash(self):
        # Given: 기본 팔레트와 확실히 다른 색을 갖는 하나의 입력.
        character = copy.deepcopy(builder.CHARACTERS[0])
        original_image = builder.draw_character(character, "S", "idle", 0)
        coat_xy = first_pixel(original_image, character["palette"]["coat"])
        self.assertIsNotNone(coat_xy)
        original = original_image.tobytes()
        character["palette"]["coat"] = (255, 0, 255, 255)
        with tempfile.TemporaryDirectory(prefix="character-palette-") as temporary:
            path = Path(temporary) / "changed.png"
            # When: 변경된 입력을 실제 PNG로 쓴다.
            digest = builder.write_png(path, builder.draw_character(character, "S", "idle", 0))
            # Then: 파일 픽셀과 hash가 입력 변경을 반영하고 meta는 쓰지 않는다.
            with Image.open(path) as image:
                self.assertNotEqual(image.tobytes(), original)
                self.assertEqual(image.getpixel(coat_xy), (255, 0, 255, 255))
            self.assertEqual(digest, sha256(path.read_bytes()).hexdigest())
            self.assertEqual(list(Path(temporary).iterdir()), [path])

    def test_frames_meet_heads_ratio_and_tile_footprint(self):
        # Given: 네 방향 idle 실루엣.
        packed = render_all_frames()
        # When: 실제 불투명 픽셀에서 머리/전신 높이와 발폭을 잰다.
        for asset_id, (_character, frames) in packed.items():
            for facing in builder.FACINGS:
                image = frames[(facing, "idle", 0)]
                heads, body_h, head_h, footprint = measure_heads(image)
                # Then: 모든 방향이 2.5±0.08등신이며 한 타일 발폭을 넘지 않는다.
                self.assertAlmostEqual(
                    heads, HEADS_TARGET, delta=HEADS_TOLERANCE,
                    msg=f"{asset_id} {facing} heads={heads} body={body_h} head={head_h}",
                )
                self.assertLessEqual(footprint / builder.W, FOOTPRINT_WIDTH_RATIO_MAX, f"{asset_id} {facing}")
                self.assertEqual(image.size, (builder.W, builder.H))

    def test_north_is_back_and_south_shows_face(self):
        # Given: 같은 idle 프레임의 N과 S.
        packed = render_all_frames()
        # When: 실루엣 머리 구간에서 얼굴(눈) 픽셀을 센다.
        for asset_id, (character, frames) in packed.items():
            south = frames[("S", "idle", 0)]
            north = frames[("N", "idle", 0)]
            _heads, _body, head_h, _foot = measure_heads(south)
            top = opaque_rows(south)[0][0]
            neck = top + head_h
            eye = character["palette"]["eye"][:3]
            skin = character["palette"]["skin"][:3]
            south_eyes = count_rgb(south, eye, top, neck)
            north_eyes = count_rgb(north, eye, top, neck)
            # Then: S는 얼굴이 보이고 N은 등/헬멧 후면이다.
            if asset_id == "poc-patrol":
                self.assertGreater(count_rgb(south, character["palette"]["coat"][:3], top, neck), 40)
                self.assertEqual(south_eyes, 0)
                self.assertEqual(north_eyes, 0)
                visor = count_rgb(south, (18, 22, 28), top, neck)
                self.assertGreater(visor, 20, "patrol south visor")
            else:
                self.assertGreaterEqual(south_eyes, 8, asset_id)
                self.assertEqual(north_eyes, 0, asset_id)
                self.assertGreater(count_rgb(north, character["palette"]["hair"][:3], top, neck), 40)
                self.assertGreater(count_rgb(south, skin, top, neck) + south_eyes, 0)
            self.assertNotEqual(south.tobytes(), north.tobytes(), asset_id)

    def test_east_west_are_not_horizontal_mirrors_and_gear_stays_attached(self):
        # Given: E/W idle과 캐릭터-상대 장비 색.
        packed = render_all_frames()
        # When: 좌우 반전 비교와 장비 centroid를 잰다.
        for asset_id, (character, frames) in packed.items():
            east = frames[("E", "idle", 0)]
            west = frames[("W", "idle", 0)]
            flipped = east.transpose(Image.FLIP_LEFT_RIGHT)
            # Then: E/W는 맹목 미러가 아니다.
            self.assertNotEqual(flipped.tobytes(), west.tobytes(), asset_id)
            self.assertNotEqual(east.tobytes(), west.tobytes(), asset_id)
            pal = character["palette"]
            south = frames[("S", "idle", 0)]
            _heads, body_h, head_h, _foot = measure_heads(south)
            top = opaque_rows(south)[0][0]
            neck = top + head_h
            hip_y0 = neck + max(8, body_h // 5)
            for facing, image in (("E", east), ("W", west), ("S", south), ("N", frames[("N", "idle", 0)])):
                self.assertIsNotNone(image.split()[-1].getbbox(), f"{asset_id} {facing}")
                match asset_id:
                    case "poc-explorer":
                        lantern = color_centroid(image, pal["gear_primary"][:3], hip_y0, 128)
                        self.assertIsNotNone(lantern, f"{asset_id} {facing} lantern")
                        assert lantern is not None
                        expected_left = facing in {"N", "E"}
                        if expected_left:
                            self.assertLess(lantern[0], 48, f"{asset_id} {facing} lantern x={lantern[0]}")
                        else:
                            self.assertGreater(lantern[0], 48, f"{asset_id} {facing} lantern x={lantern[0]}")
                        antenna = color_centroid(image, pal["gear_secondary"][:3], 0, neck)
                        self.assertIsNotNone(antenna, f"{asset_id} {facing} antenna")
                    case "poc-medic":
                        satchel = color_centroid(image, pal["gear_secondary"][:3], hip_y0, 128)
                        self.assertIsNotNone(satchel, f"{asset_id} {facing} satchel")
                        assert satchel is not None
                        expected_left = facing in {"N", "E"}
                        if expected_left:
                            self.assertLess(satchel[0], 48, f"{asset_id} {facing} satchel x={satchel[0]}")
                        else:
                            self.assertGreater(satchel[0], 48, f"{asset_id} {facing} satchel x={satchel[0]}")
                        knot = color_centroid(image, pal["gear_primary"][:3], neck, hip_y0)
                        self.assertIsNotNone(knot, f"{asset_id} {facing} knot")
                    case "poc-patrol":
                        lamp = color_centroid(image, pal["gear_primary"][:3], top, neck)
                        self.assertIsNotNone(lamp, f"{asset_id} {facing} visor lamp")
                        assert lamp is not None
                        expected_left = facing in {"N", "E"}
                        if expected_left:
                            self.assertLess(lamp[0], 48, f"{asset_id} {facing} lamp x={lamp[0]}")
                        else:
                            self.assertGreater(lamp[0], 48, f"{asset_id} {facing} lamp x={lamp[0]}")
                    case unreachable:
                        raise AssertionError(unreachable)
            for facing in builder.FACINGS:
                down = frames[(facing, "down", 3)]
                self.assertIsNotNone(down.split()[-1].getbbox(), f"{asset_id} {facing} down")
                held = pal["gear_secondary"][:3]
                self.assertGreater(count_rgb(down, held), 8, f"{asset_id} {facing} down held gear")

    def test_actions_have_visible_extrema_not_unique_hash_surrogates(self):
        # Given: walk/attack/down의 전 프레임.
        packed = render_all_frames()
        # When: 발 bbox와 팔 폭의 극값을 잰다.
        for asset_id, (_character, frames) in packed.items():
            for facing in builder.FACINGS:
                walk_feet = []
                walk_span = []
                for frame in range(builder.ACTIONS["walk"]):
                    image = frames[(facing, "walk", frame)]
                    x0, y0, x1, y1 = opaque_bbox(image)
                    walk_feet.append((x0, x1, y1))
                    walk_span.append(x1 - x0)
                # Then: 걸음은 좌우 교대 보폭이 있고 idle 루프는 왕복 가능하다.
                self.assertGreaterEqual(max(item[1] for item in walk_feet) - min(item[0] for item in walk_feet), 6, f"{asset_id} {facing} walk stride")
                self.assertGreaterEqual(max(walk_span) - min(walk_span), 4, f"{asset_id} {facing} walk arm counter")
                attack_span = [
                    limb_span(frames[(facing, "attack", frame)], 40, 90)
                    for frame in range(builder.ACTIONS["attack"])
                ]
                contact = attack_span.index(max(attack_span))
                self.assertGreaterEqual(max(attack_span) - attack_span[0], 6, f"{asset_id} {facing} attack windup")
                self.assertGreater(contact, 0, f"{asset_id} {facing} attack contact")
                self.assertLess(contact, 5, f"{asset_id} {facing} attack recovery")
                self.assertLess(attack_span[-1], max(attack_span), f"{asset_id} {facing} attack recover")
                down_tops = [opaque_bbox(frames[(facing, "down", frame)])[1] for frame in range(4)]
                down_heights = [
                    opaque_bbox(frames[(facing, "down", frame)])[3] - opaque_bbox(frames[(facing, "down", frame)])[1]
                    for frame in range(4)
                ]
                self.assertGreater(down_tops[-1], down_tops[0] + 8, f"{asset_id} {facing} down collapse")
                self.assertLess(down_heights[-1], down_heights[0] - 8, f"{asset_id} {facing} down flatten")
                idle_blobs = [frames[(facing, "idle", frame)].tobytes() for frame in range(4)]
                self.assertGreaterEqual(len(set(idle_blobs)), 3, f"{asset_id} {facing} idle motion")
                self.assertEqual(idle_blobs[1], idle_blobs[3], f"{asset_id} {facing} idle loop return")

    def test_every_frame_stays_inside_the_cell(self):
        # Given: 276 프레임.
        packed = render_all_frames()
        # When: 셀 가장자리 알파를 센다.
        for asset_id, (_character, frames) in packed.items():
            for facing in builder.FACINGS:
                for action, count in builder.ACTIONS.items():
                    for frame in range(count):
                        image = frames[(facing, action, frame)]
                        x0, y0, x1, y1 = opaque_bbox(image)
                        # Then: 가장자리에 그려지지 않고 셀 안에 남는다.
                        self.assertEqual(edge_opaque_count(image), 0, f"{asset_id} {facing} {action} {frame} bbox={(x0, y0, x1, y1)}")
                        self.assertGreater(x0, 0, f"{asset_id} {facing} {action} {frame}")
                        self.assertGreater(y0, 0, f"{asset_id} {facing} {action} {frame}")
                        self.assertLess(x1, builder.W - 1, f"{asset_id} {facing} {action} {frame}")
                        self.assertLess(y1, builder.H - 1, f"{asset_id} {facing} {action} {frame}")

    def test_idle_heads_are_stepped_not_rectangles(self):
        # Given: 네 방향 idle 머리 실루엣.
        packed = render_all_frames()
        # When: 머리 구간 행 폭을 잰다.
        for asset_id, (character, frames) in packed.items():
            for facing in builder.FACINGS:
                image = frames[(facing, "idle", 0)]
                _heads, _body, head_h, _foot = measure_heads(image)
                top = opaque_rows(image)[0][0]
                neck = top + head_h
                widths = head_row_widths(image, top, neck)
                self.assertGreaterEqual(len(widths), 10, f"{asset_id} {facing}")
                # Then: 정수리와 턱이 잘리고 같은 폭이 길게 이어지지 않는다.
                self.assertLess(widths[0], max(widths) - 4, f"{asset_id} {facing} crown {widths[:4]}")
                self.assertLess(widths[-1], max(widths) - 3, f"{asset_id} {facing} chin {widths[-4:]}")
                self.assertLessEqual(longest_constant_run(widths), 6, f"{asset_id} {facing} run={longest_constant_run(widths)} {widths}")
                if asset_id == "poc-medic" and facing in {"S", "N"}:
                    hair = character["palette"]["hair"][:3]
                    locks = color_centroid(image, hair, neck - 8, neck + 8)
                    self.assertIsNotNone(locks, f"{asset_id} {facing} bob lock")
                    self.assertGreater(count_rgb(image, hair, neck - 6, neck + 10), 8, f"{asset_id} {facing} side lock")
                if asset_id == "poc-patrol" and facing == "S":
                    visor_rows = head_row_widths(image, top + 10, neck - 6)
                    self.assertGreaterEqual(len(set(visor_rows)), 3, f"{asset_id} {facing} visor curve {visor_rows}")

    def test_atlas_and_identity_preserve_fractional_alpha_cells(self):
        # Given: hit 섬광이 분수 알파를 가진 프레임.
        packed = render_all_frames()
        # When: atlas/identity를 소스 셀과 바이트 비교한다.
        for asset_id, (_character, frames) in packed.items():
            atlas = builder.atlas_image(frames)
            identity = builder.identity_sheet(_character, frames)
            self.assertEqual(atlas.size, (builder.W * 6, builder.H * 20))
            row = 0
            for facing in builder.FACINGS:
                idle = frames[(facing, "idle", 0)]
                ident_x = 6 + builder.FACINGS.index(facing) * builder.W
                ident_cell = identity.crop((ident_x, 6, ident_x + builder.W, 6 + builder.H))
                self.assertEqual(ident_cell.tobytes(), idle.tobytes(), f"{asset_id} identity {facing}")
                for action, count in builder.ACTIONS.items():
                    for frame in range(count):
                        src = frames[(facing, action, frame)]
                        cell = atlas.crop((frame * builder.W, row * builder.H, (frame + 1) * builder.W, (row + 1) * builder.H))
                        self.assertEqual(cell.tobytes(), src.tobytes(), f"{asset_id} {facing} {action} {frame}")
                    row += 1
            hit = frames[("S", "hit", 1)]
            hit_px = hit.load()
            alphas = {
                hit_px[x, y][3]
                for y in range(builder.H)
                for x in range(builder.W)
                if 0 < hit_px[x, y][3] < 255
            }
            self.assertTrue(alphas, f"{asset_id} expected fractional hit flash")

    def test_existing_output_is_rejected_without_overwriting(self):
        # Given: 이미 파일이 들어 있는 디렉터리.
        with tempfile.TemporaryDirectory(prefix="character-existing-") as temporary:
            output = Path(temporary)
            sentinel = output / "keep.png"
            sentinel.write_bytes(b"keep")
            # When: 같은 경로를 출력으로 요청한다.
            with self.assertRaises(FileExistsError):
                builder.build(output)
            # Then: 기존 데이터와 파일 목록이 보존된다.
            self.assertEqual(sentinel.read_bytes(), b"keep")
            self.assertEqual(list(output.iterdir()), [sentinel])

    def test_game_and_source_paths_including_symlink_are_rejected(self):
        # Given: runtime/source 및 그 위치를 가리키는 symlink.
        with tempfile.TemporaryDirectory(prefix="character-protected-") as temporary:
            root = Path(temporary)
            (root / "Game").mkdir()
            (root / "alias").symlink_to(root / "Game", target_is_directory=True)
            for relative in ("Game/Assets/Janseon/Art/Characters", "ArtSource/characters", "alias/Assets/new"):
                with self.subTest(relative=relative):
                    output = root / relative
                    before = set(root.rglob("*"))
                    # When: 보호 경로로 조립을 요청한다.
                    with self.assertRaises(ValueError):
                        builder.build(output)
                    # Then: 새 폴더나 파일을 만들지 않는다.
                    self.assertEqual(set(root.rglob("*")), before)

    def test_cli_requires_explicit_output_without_writes(self):
        # Given: 비어 있는 작업 디렉터리.
        with tempfile.TemporaryDirectory(prefix="character-cli-") as temporary:
            # When: 출력 경로 없이 실제 CLI를 실행한다.
            result = subprocess.run([sys.executable, "-B", str(TOOL.resolve())], cwd=temporary,
                                    capture_output=True, text=True, timeout=30, check=False)
            # Then: 인자 오류로 종료하며 cwd를 변경하지 않는다.
            self.assertEqual(result.returncode, 2)
            self.assertEqual(list(Path(temporary).iterdir()), [])


if __name__ == "__main__":
    unittest.main()
