#!/usr/bin/env python3
import json
import random
import unittest
from pathlib import Path

from bongwan_assignment import surname_rows_by_hangul
from generate_nemotron_roster import compose_name


ROOT = Path(__file__).resolve().parents[3]
POOLS = ROOT / "Wikis" / "game-logic" / "name-pools"


def load_pools() -> dict:
    pools = {
        "surnames": json.loads((POOLS / "surnames.json").read_text(encoding="utf-8")),
        "given-male": json.loads((POOLS / "given-male.json").read_text(encoding="utf-8")),
        "given-female": json.loads((POOLS / "given-female.json").read_text(encoding="utf-8")),
        "clans": json.loads((POOLS / "clan-hangnyeol-tables.json").read_text(encoding="utf-8")),
    }
    surname_bongwan = json.loads((POOLS / "surnames-bongwan.json").read_text(encoding="utf-8"))
    pools["surname-bongwan-by-hangul"] = surname_rows_by_hangul(surname_bongwan["surnames"])
    return pools


class GenerateNemotronRosterTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pools = load_pools()

    def test_lineage_clan_controls_surname_bongwan_and_hangnyeol(self):
        lineage = {
            "parents": {"child": "parent", "parent": "founder"},
            "founder_sesu": {"founder": 40},
            "person_clan": {"child": "cangnyeong-seong-yeolcha"},
        }
        person = compose_name("남자", "child", self.pools, set(), random.Random(7), lineage)
        self.assertEqual(person["성"], "성")
        self.assertEqual(person["본관"], "창녕")
        self.assertEqual(person["성 한자"], "成")
        self.assertEqual(person["본관 한자"], "昌寧")
        self.assertEqual(person["항렬자"], "현")
        self.assertTrue(person["이름"].endswith("현"))

    def test_unrelated_person_gets_deterministic_census_bongwan(self):
        first = compose_name("남자", "free", self.pools, set(), random.Random(7), {})
        second = compose_name("남자", "free", self.pools, set(), random.Random(7), {})
        self.assertEqual(first, second)
        self.assertIsNotNone(first["본관"])
        self.assertIsNotNone(first["성 한자"])
        self.assertIsNone(first["항렬자"])


if __name__ == "__main__":
    unittest.main()
