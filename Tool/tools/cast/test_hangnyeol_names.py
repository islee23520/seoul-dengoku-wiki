#!/usr/bin/env python3
import unittest

from hangnyeol_names import (
    apply_hangnyeol,
    derive_sesu,
    lineage_clan_id,
    normalize_lineage_document,
    select_hangnyeol,
)


class HangnyeolNamesTest(unittest.TestCase):
    def test_siblings_share_generation_from_parent_edges(self):
        parents = {"child-a": "parent", "child-b": "parent", "parent": "founder"}
        self.assertEqual(derive_sesu("child-a", parents, {"founder": 30}), 32)
        self.assertEqual(derive_sesu("child-b", parents, {"founder": 30}), 32)

    def test_age_is_not_an_input(self):
        parents = {"child": "parent", "parent": "founder"}
        self.assertEqual(derive_sesu("child", parents, {"founder": 30}), 32)

    def test_cycle_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "cycle"):
            derive_sesu("a", {"a": "b", "b": "a"}, {})

    def test_apply_respects_position(self):
        self.assertEqual(apply_hangnyeol("민수", "재", "first"), "재수")
        self.assertEqual(apply_hangnyeol("민수", "재", "second"), "민재")

    def test_select_hangnyeol_uses_lineage_depth_not_age(self):
        parents = {"child": "parent", "parent": "founder"}
        clan = {"rows": [{"sesu": 32, "hangnyeol": "재", "position": "first"}]}
        self.assertEqual(
            select_hangnyeol("child", clan, parents, {"founder": 30}),
            {"sesu": 32, "hangnyeol": "재", "position": "first"},
        )

    def test_select_hangnyeol_returns_none_without_a_lineage(self):
        self.assertIsNone(select_hangnyeol("child", {"rows": []}, {}, {}))

    def test_lineage_must_name_the_person_clan(self):
        lineage = {"person_clan": {"child": "gimhae-kim"}}
        self.assertEqual(lineage_clan_id("child", lineage), "gimhae-kim")

    def test_lineage_without_person_clan_is_not_guessed(self):
        self.assertIsNone(lineage_clan_id("child", {"parents": {"child": "parent"}}))

    def test_cast_application_document_normalizes_to_generator_lineage(self):
        document = {
            "lineage": {"parents": {"child": "founder"}, "founder_sesu": {"founder": 40}},
            "people": [{"name": "child", "status": "applied", "clan": "gimhae-kim"}],
        }
        self.assertEqual(
            normalize_lineage_document(document),
            {
                "parents": {"child": "founder"},
                "founder_sesu": {"founder": 40},
                "person_clan": {"child": "gimhae-kim"},
            },
        )


if __name__ == "__main__":
    unittest.main()
