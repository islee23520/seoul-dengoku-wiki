"""Catalog interiors cover every named Seoul station."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
INTERIORS = ROOT / "Wikis" / "game-logic" / "regions" / "station-interiors.json"
CATALOG = ROOT / "Wikis" / "game-logic" / "Seoul-Station-Catalog.md"
CONTENT = ROOT / "Wikis" / "game-logic" / "regions" / "content"


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
        hong = next(s for s in payload["stations"] if s["name"] == "홍대입구")
        self.assertEqual(hong["observed_levels"]["below"], 2)
        self.assertEqual(hong["observed_levels_source"], "OA-11572")
        observed = sum(1 for s in payload["stations"] if s.get("observed_levels"))
        self.assertGreaterEqual(observed, 260)
        self.assertIn("영등포", CATALOG.read_text(encoding="utf-8"))

    def test_named_osm_buildings_keep_observed_levels(self):
        n = 0
        for path in CONTENT.glob("*.json"):
            doc = json.loads(path.read_text(encoding="utf-8"))
            for row in doc["regions"]:
                for building in row["content"].get("buildings") or []:
                    if building.get("observed_levels"):
                        n += 1
                        self.assertTrue(building.get("observed_levels_source"))
        self.assertGreaterEqual(n, 40)


if __name__ == "__main__":
    unittest.main()
