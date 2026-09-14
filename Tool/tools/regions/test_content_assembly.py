"""Machine contracts for assembling authored regions, not tests of prose wording."""

import importlib.util
import copy
import unittest
from pathlib import Path


class ContentAssemblyTests(unittest.TestCase):
    def setUp(self):
        self.content = {
            "source_kind": "original-fiction", "fictional_epoch": "opening-day",
            "title": "점검 교대", "summary": "골목의 정비 교대를 조정한다.",
            "anchor_refs": ["osm:node:1"], "canon_refs": ["Wikis/game-logic/Sixteen-States.md"],
            "polity_contexts": ["S06"], "inhabitants": ["정비조"], "livelihood": "급수 점검",
            "production": {"outputs": ["급수"], "requires": ["부품"]}, "shortages": ["부품"],
            "hazard": {"kind": "supply", "description": "밸브 고장"},
            "opening_state": "교대 협의", "connections": "이웃과 부품 교환", "uncertainty": "창작 상태",
            "action": {"id": "region-1-check", "label": "점검", "target_ref": "osm:node:1",
                       "costs": [{"resource": "labor", "amount": 2, "unit": "shift"}],
                       "outcomes": [{"kind": "service", "effect": "급수 재개"}], "tradeoff": "운반 교대 감소"}
        }
        self.atlas = {"as_of": "2026-09-12", "regions": [{"id": "region:1", "name": "A", "district_id": "gu:1",
                                   "profile": {"anchors": [{"source_object_id": "osm:node:1"}]}, "content": None}]}

    def assembler(self):
        path = Path(__file__).with_name("assemble_region_content.py")
        self.assertTrue(path.exists(), "The atlas has no authored-region assembly entry point")
        spec = importlib.util.spec_from_file_location("assemble_region_content", path)
        assert spec is not None
        assert spec.loader is not None
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def test_missing_region_fails_instead_of_publishing_partial_content(self):
        module = self.assembler()
        atlas = {"regions": [{"id": "region:1", "name": "A", "district_id": "gu:1"}]}
        with self.assertRaises(ValueError):
            module.combine_content(atlas, [])

    def test_duplicate_region_record_fails(self):
        module = self.assembler()
        row = {"region_id": "region:1", "name": "A", "content": self.content}
        documents = [{"as_of": "2026-09-12", "district_id": "gu:1", "regions": [row, row]}]
        with self.assertRaisesRegex(ValueError, "duplicate_or_unknown_region:region:1"):
            module.combine_content(self.atlas, documents)

    def test_valid_content_is_joined_without_mutating_source_atlas(self):
        module = self.assembler()
        original = copy.deepcopy(self.atlas)
        documents = [{"as_of": "2026-09-12", "district_id": "gu:1", "regions": [{"region_id": "region:1", "name": "A", "content": self.content}]}]
        combined = module.combine_content(self.atlas, documents)
        self.assertEqual(combined["regions"][0]["content"]["action"]["costs"][0]["amount"], 2)
        self.assertEqual(self.atlas, original)

    def test_wrong_district_assignment_fails(self):
        module = self.assembler()
        atlas = {"regions": [{"id": "region:1", "name": "A", "district_id": "gu:1"}]}
        documents = [{"district_id": "gu:2", "regions": [{"region_id": "region:1", "name": "A", "content": {}}]}]
        with self.assertRaises(ValueError):
            module.combine_content(atlas, documents)

    def test_empty_local_content_fails(self):
        module = self.assembler()
        atlas = {"regions": [{"id": "region:1", "name": "A", "district_id": "gu:1"}]}
        documents = [{"district_id": "gu:1", "regions": [{"region_id": "region:1", "name": "A", "content": {}}]}]
        with self.assertRaises(ValueError):
            module.combine_content(atlas, documents)

    def test_wrong_cutoff_content_rejected(self):
        module = self.assembler()
        documents = [{"schema": "seoul-region-content.v1", "as_of": "2026-10-01", "district_id": "gu:1",
                      "regions": [{"region_id": "region:1", "name": "A", "content": self.content}]}]
        with self.assertRaisesRegex(ValueError, "content_cutoff"):
            module.combine_content(self.atlas, documents)

    def test_action_ids_must_be_unique_across_regions(self):
        module = self.assembler()
        second_region = copy.deepcopy(self.atlas["regions"][0])
        second_region["id"] = "region:2"
        second_region["name"] = "B"
        self.atlas["regions"].append(second_region)
        documents = [{"as_of": "2026-09-12", "district_id": "gu:1", "regions": [
            {"region_id": "region:1", "name": "A", "content": self.content},
            {"region_id": "region:2", "name": "B", "content": copy.deepcopy(self.content)}]}]
        with self.assertRaisesRegex(ValueError, "duplicate_action_id"):
            module.combine_content(self.atlas, documents)


if __name__ == "__main__":
    unittest.main()
