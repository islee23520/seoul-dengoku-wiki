"""UI 후보 generator는 Design.md 계약을 만족하는 draft만 새 디렉터리에 만든다."""

import importlib.util
import json
import tempfile
import unittest
from hashlib import sha256
from pathlib import Path

from PIL import Image

TOOL = Path(__file__).with_name("build-poc-ui-candidates.py")
REPO = Path(__file__).resolve().parents[2]
ART = REPO / "Game" / "Assets" / "Janseon" / "Art"
SPEC = importlib.util.spec_from_file_location("ui_candidate_builder", TOOL)
assert SPEC is not None and SPEC.loader is not None
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)

ORIGINALS = {
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


class UiCandidateContractTests(unittest.TestCase):
    def test_original_assets_fail_candidate_contract(self):
        # Given: 시각 검토에서 불합격한 원본 자산.
        title = Image.open(ORIGINALS["title"]).convert("RGB")
        icons = {name: Image.open(ART / "UI" / f"icon-{name}.png").convert("RGBA") for name in builder.ICON_NAMES}
        panel = Image.open(ORIGINALS["panel"]).convert("RGBA")
        # When: 후보 계약(네온 cyan 비율, 타일 재질)을 원본에 적용한다.
        report = builder.evaluate_candidates(title, icons, {
            "floor": Image.open(ORIGINALS["floor"]).convert("RGB"),
            "wall": Image.open(ORIGINALS["wall"]).convert("RGB"),
            "platform": Image.open(ORIGINALS["platform"]).convert("RGB"),
        }, panel, {
            state: Image.open(ORIGINALS[f"button-{state}"]).convert("RGBA") for state in builder.BUTTON_STATES
        })
        # Then: 원본은 계약을 통과하지 못한다(변이 증명: 계약이 실제로 결함을 잡는다).
        # 타이틀 원본의 결함은 구도(추상 반복)라 픽셀 대역 검사가 아닌 직접 열람/네 축 검토 대상이다.
        self.assertFalse(report["ok"])
        self.assertGreater(report["icon_neon_fraction_max"], builder.NEON_FRACTION_MAX)
        self.assertGreater(report["panel_neon_fraction"], builder.NEON_FRACTION_MAX)
        self.assertGreater(report["button_neon_fraction_max"], builder.NEON_FRACTION_MAX)
        self.assertGreater(report["tile_cyan_fraction"]["floor"], builder.TILE_CYAN_FRACTION_MAX)
        self.assertIn("floor_cyan_tint", report["errors_by_check"])

    def test_generated_candidates_pass_contract_and_render_deterministically(self):
        # Given: 로컬 그림 정의만으로 후보를 두 번 렌더한다.
        first = builder.render_all()
        second = builder.render_all()
        # When: 계약을 평가한다.
        report = builder.evaluate_candidates(first["title"], first["icons"], first["tiles"], first["panel"], first["buttons"])
        # Then: 결정론적이고 계약을 통과한다.
        self.assertEqual(report["errors"], [])
        self.assertTrue(report["ok"])
        self.assertEqual(first["title"].tobytes(), second["title"].tobytes())
        for name in builder.ICON_NAMES:
            self.assertEqual(first["icons"][name].tobytes(), second["icons"][name].tobytes())
            self.assertEqual(first["icons"][name].size, (64, 64))
        self.assertEqual(first["title"].size, (1920, 1080))
        self.assertEqual(first["atlas"].size, (256, 128))
        for kind in ("floor", "wall", "platform"):
            self.assertEqual(first["tiles"][kind].size, (256, 256))
            self.assertLessEqual(report["tile_seams"][kind]["vertical_mean_abs"], builder.SEAM_MAX)
            self.assertLessEqual(report["tile_seams"][kind]["horizontal_mean_abs"], builder.SEAM_MAX)
        self.assertEqual(first["panel"].size, (256, 256))
        for state in builder.BUTTON_STATES:
            self.assertEqual(first["buttons"][state].size, (256, 64))
        # 32px에서 아이콘끼리 서로 구분된다.
        self.assertGreaterEqual(report["icon_pairwise_min_distance"], builder.ICON_DISTINCT_MIN)

    def test_build_writes_only_drafts_with_parent_hashes_into_explicit_directory(self):
        # Given: 원본을 흉내 낸 sentinel 파일과 명시 후보 디렉터리.
        with tempfile.TemporaryDirectory(prefix="ui-candidate-") as temporary:
            root = Path(temporary)
            sentinel = root / "original.png"
            sentinel.write_bytes(b"preserved-original")
            output = root / "candidate-v1"
            # When: 실제 entry point를 실행한다.
            manifest_path = builder.build(output)
            # Then: 파일은 후보 디렉터리 안에만 있고 승인/권리/승격 주장이 없다.
            self.assertEqual(sentinel.read_bytes(), b"preserved-original")
            self.assertEqual(set(root.iterdir()), {sentinel, output})
            manifest = json.loads(manifest_path.read_text())
            self.assertEqual(manifest["status"], "draft")
            self.assertEqual(manifest["rights_status"], "unknown")
            self.assertFalse(manifest["promotion"])
            self.assertFalse(manifest["runtime_activated"])
            self.assertEqual(manifest["review_receipts"], [])
            self.assertEqual(len(manifest["files"]), 17)
            for entry in manifest["files"]:
                path = output / entry["path"]
                self.assertTrue(path.exists(), entry["path"])
                self.assertEqual(entry["sha256"], sha256(path.read_bytes()).hexdigest())
                with Image.open(path) as image:
                    self.assertEqual(tuple(entry["size"]), image.size)
            parents = {p["role"]: p for p in manifest["parent_inputs"]}
            for key, original in ORIGINALS.items():
                self.assertEqual(parents[f"original:{key}"]["sha256"], sha256(original.read_bytes()).hexdigest())
            self.assertIn("design_md", manifest)
            self.assertEqual(manifest["design_md"]["sha256"], sha256((REPO / "Design.md").read_bytes()).hexdigest())
            self.assertTrue(manifest["contract"]["ok"])

    def test_build_rejects_game_and_artsource_destinations(self):
        for forbidden in (REPO / "Game" / "Assets" / "Janseon" / "Art" / "UI" / "x", REPO / "Game" / "Assets" / "Janseon" / "ArtSource" / "x"):
            with self.assertRaises(ValueError):
                builder.build(forbidden)


if __name__ == "__main__":
    unittest.main()
