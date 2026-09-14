"""Catalog interiors cover every named Seoul station."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
INTERIORS = ROOT / "Wikis" / "game-logic" / "regions" / "station-interiors.json"
CATALOG = ROOT / "Wikis" / "game-logic" / "Seoul-Station-Catalog.md"


class StationInteriorTests(unittest.TestCase):
    def test_one_interior_per_catalog_station(self):
        payload = json.loads(INTERIORS.read_text(encoding="utf-8"))
        names = [s["name"] for s in payload["stations"]]
        self.assertEqual(payload["count"], 334)
        self.assertEqual(len(names), 334)
        self.assertEqual(len(set(names)), 334)
        self.assertIn("영등포", names)
        self.assertIn("홍대입구", names)
        yeong = next(s for s in payload["stations"] if s["name"] == "영등포")
        labels = {layer["id"] for layer in yeong["layers"]}
        self.assertEqual(labels, {"tracks", "platform", "concourse", "surface"})
        for layer in yeong["layers"]:
            self.assertTrue(layer["contents"])
            self.assertTrue(layer["condition"])
        self.assertIsNone(yeong["observed_levels"])
        self.assertIn("영등포", CATALOG.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
