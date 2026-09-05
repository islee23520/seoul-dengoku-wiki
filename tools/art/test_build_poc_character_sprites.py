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


class DraftAssemblyTests(unittest.TestCase):
    def test_geometry_matches_original_decoded_pixels(self):
        # Given: 원본 전체 276 frame + identity/atlas의 RED 전 픽셀 fingerprint.
        digest = sha256()
        # When: 동일한 입력을 모두 렌더한다.
        for character in builder.CHARACTERS:
            frames = {}
            for facing in builder.FACINGS:
                for action, count in builder.ACTIONS.items():
                    for frame in range(count):
                        image = builder.draw_character(character, facing, action, frame)
                        frames[(facing, action, frame)] = image
                        digest.update(image.tobytes())
            digest.update(builder.identity_sheet(character, frames).tobytes())
            digest.update(builder.atlas_image(frames).tobytes())
        # Then: 라벨뿐 아니라 실제 픽셀이 원본과 같다.
        self.assertEqual(digest.hexdigest(), "a47114d4ede3cc34c861008dc34785b3e12f5514313cac2181267c90341f9602")

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
        original = builder.draw_character(character, "S", "idle", 0).tobytes()
        character["palette"]["coat"] = (255, 0, 255, 255)
        with tempfile.TemporaryDirectory(prefix="character-palette-") as temporary:
            path = Path(temporary) / "changed.png"
            # When: 변경된 입력을 실제 PNG로 쓴다.
            digest = builder.write_png(path, builder.draw_character(character, "S", "idle", 0))
            # Then: 파일 픽셀과 hash가 입력 변경을 반영하고 meta는 쓰지 않는다.
            with Image.open(path) as image:
                self.assertNotEqual(image.tobytes(), original)
                self.assertEqual(image.getpixel((48, 60)), (255, 0, 255, 255))
            self.assertEqual(digest, sha256(path.read_bytes()).hexdigest())
            self.assertEqual(list(Path(temporary).iterdir()), [path])

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
