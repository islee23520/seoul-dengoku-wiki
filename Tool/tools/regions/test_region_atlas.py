"""Deterministic behavior counterexamples for source and spatial contracts."""
import tempfile
import unittest
from typing import TypedDict
from pathlib import Path

from shapely.geometry import Point, Polygon, box, mapping
from spatial import (accounting_errors, clean_regions, date_errors,
                     geometry_from_json, memberships, partition_errors)
from osm_source import classify, read_candidates
from verify_region_atlas import content_errors
from profiles import terrain_profiles
from spatial import project
import numpy as np
import rasterio
from rasterio.transform import from_origin


class SpatialTests(unittest.TestCase):
    def setUp(self):
        self.regions = {"region:1111053000": box(0, 0, 10, 10),
                        "region:1111054000": box(10, 0, 20, 10)}

    def test_null_content_fails_strict_contract(self):
        self.assertTrue(content_errors({"id": "region:1111053000", "content": None}))

    def test_missing_region_rejected(self):
        self.assertTrue(partition_errors(dict(list(self.regions.items())[:1]), self.regions))

    def test_positive_overlap_rejected(self):
        overlapping = dict(self.regions)
        overlapping["region:1111054000"] = box(9, 0, 20, 10)
        self.assertTrue(partition_errors(overlapping, self.regions))

    def test_cleanup_retains_union_and_small_fragment(self):
        originals = {"a": box(0, 0, 10, 10), "b": box(9, 0, 10.000001, 10)}
        cleaned, changes = clean_regions(originals)
        self.assertAlmostEqual(cleaned["a"].intersection(cleaned["b"]).area, 0)
        self.assertGreater(cleaned["b"].area, 0)
        self.assertAlmostEqual(changes["b"], 10)
        self.assertEqual(partition_errors(cleaned, originals), [])

    def test_boundary_point_has_all_memberships_and_stable_primary(self):
        result = memberships(Point(10, 5), dict(reversed(list(self.regions.items()))))
        self.assertEqual(result["memberships"], sorted(self.regions))
        self.assertEqual(result["primary_region_id"], min(self.regions))
        self.assertEqual(result["status"], "assigned")

    def test_cross_region_polygon_has_all_memberships(self):
        result = memberships(box(8, 2, 15, 8), self.regions)
        self.assertEqual(result["memberships"], sorted(self.regions))
        self.assertEqual(result["primary_region_id"], max(self.regions))

    def test_invalid_geometry_is_quarantine_not_outside(self):
        bowtie = Polygon([(30, 0), (40, 10), (30, 10), (40, 0), (30, 0)])
        result = memberships(bowtie, self.regions)
        self.assertEqual(result["status"], "quarantine")
        self.assertTrue(result["reason"])

    def test_unknown_geometry_is_quarantine(self):
        geometry, reason = geometry_from_json({"type": "Unknown", "coordinates": []})
        self.assertIsNone(geometry)
        self.assertTrue(reason)
        self.assertEqual(memberships(geometry, self.regions)["status"], "quarantine")

    def test_malformed_geometry_is_quarantine(self):
        geometry, reason = geometry_from_json({"type": "Point", "coordinates": [1]})
        self.assertIsNone(geometry)
        self.assertTrue(reason)

    def test_future_snapshot_rejected(self):
        self.assertTrue(date_errors("2026-09-12", ["2026-09-13T00:00:00Z"]))

    def test_dates_keep_month_year_precision(self):
        self.assertEqual(date_errors("2026-09-12", ["2013", "2017-12", "2026-09-04T23:00:00Z"]), [])
        self.assertTrue(date_errors("2026-09-12", ["2027"]))

    def test_no_interior_candidate_can_be_hidden_outside(self):
        record = {"id": "osm:node:1", "geometry": mapping(Point(5, 5)),
                  "status": "outside", "memberships": [], "primary_region_id": None}
        self.assertTrue(accounting_errors([record], {record["id"]}, self.regions))

    def test_missing_candidate_rejected(self):
        self.assertTrue(accounting_errors([], {"osm:node:1"}, self.regions))

    def test_same_name_distinct_ids_retained(self):
        records = [dict(id=f"osm:node:{i}", tags={"name": "Same"}, geometry=mapping(Point(5, 5)),
                        status="assigned", memberships=[min(self.regions)],
                        primary_region_id=min(self.regions)) for i in (1, 2)]
        self.assertEqual(accounting_errors(records, {"osm:node:1", "osm:node:2"}, self.regions), [])
        self.assertTrue(accounting_errors(records[:1], {"osm:node:1", "osm:node:2"}, self.regions))


class ContentTests(unittest.TestCase):
    def setUp(self):
        self.region = {
            "id": "region:1111053000",
            "profile": {"anchors": [{"source_object_id": "osm:node:42"}]},
            "content": {
                "source_kind": "original-fiction", "fictional_epoch": "opening-day",
                "title": "저수조 교대", "summary": "골목 주민과 정비조가 저수조 교대를 나눈다.",
                "anchor_refs": ["osm:node:42"],
                "canon_refs": ["Wikis/game-logic/Sixteen-States.md"],
                "polity_contexts": ["S06"], "inhabitants": ["정비조"],
                "livelihood": "주민이 물 운반과 밸브 점검을 나눠 맡는다.",
                "production": {"outputs": ["급수 서비스"], "requires": ["부품"]},
                "shortages": ["부품 부족"],
                "hazard": {"kind": "supply", "description": "부품이 없으면 밸브가 멈춘다."},
                "opening_state": "급수 교대를 협의 중이다.",
                "connections": "이웃 구역과 부품 운송을 협의한다.",
                "uncertainty": "재난 이후의 상태와 수치는 창작이다.",
                "buildings": [{"anchor_ref": "osm:node:42", "name": "저수조 옆 주민센터",
                               "observed_use": "주민센터", "river": "inland",
                               "opening_use": "배급 창구", "how": "1층만 연다"}],
                "action": {"id": "1111053000-valve", "label": "밸브 점검",
                           "target_ref": "osm:node:42",
                           "costs": [{"resource": "labor", "amount": 2, "unit": "shift"}],
                           "outcomes": [{"kind": "service", "effect": "급수 교대 재개"}],
                           "tradeoff": "같은 교대의 운반 인원이 줄어든다."}
            }
        }

    def test_complete_content_accepts_valid_local_anchor_and_action(self):
        self.assertEqual(content_errors(self.region), [])

    def test_empty_content_fields_rejected(self):
        self.region["content"]["livelihood"] = ""
        self.region["content"]["inhabitants"] = []
        self.assertTrue(content_errors(self.region))

    def test_foreign_region_anchor_rejected(self):
        self.region["content"]["anchor_refs"] = ["osm:node:999"]
        self.assertTrue(content_errors(self.region))

    def test_action_target_must_be_a_cited_local_anchor(self):
        self.region["content"]["action"]["target_ref"] = "osm:node:999"
        self.assertTrue(content_errors(self.region))

    def test_observed_fact_cannot_masquerade_as_fictional_opening_state(self):
        self.region["content"]["source_kind"] = "observed-source"
        self.assertTrue(content_errors(self.region))

    def test_missing_buildings_rejected(self):
        del self.region["content"]["buildings"]
        self.assertTrue(any(e.startswith("invalid_buildings:") for e in content_errors(self.region)))

    def test_building_anchor_must_be_local(self):
        self.region["content"]["buildings"][0]["anchor_ref"] = "osm:node:999"
        self.assertTrue(any(e.startswith("invalid_building_anchor:") for e in content_errors(self.region)))

    def test_calendar_date_is_not_a_fictional_epoch(self):
        self.region["content"]["fictional_epoch"] = "2026-09-12"
        self.assertTrue(content_errors(self.region))

    def test_empty_action_consequence_rejected(self):
        self.region["content"]["action"]["outcomes"] = [{"kind": "service", "effect": ""}]
        self.assertTrue(content_errors(self.region))

    def test_infinite_cost_rejected(self):
        self.region["content"]["action"]["costs"][0]["amount"] = float("inf")
        self.assertTrue(content_errors(self.region))

    def test_unknown_polity_rejected(self):
        self.region["content"]["polity_contexts"] = ["S99"]
        self.assertTrue(content_errors(self.region))

    def test_nonexistent_canon_reference_rejected(self):
        self.region["content"]["canon_refs"] = ["Wikis/game-logic/does-not-exist.md"]
        self.assertTrue(content_errors(self.region))

    def test_inhabitants_must_be_a_list(self):
        self.region["content"]["inhabitants"] = "정비조"
        self.assertTrue(content_errors(self.region))

    def test_production_lists_cannot_be_strings(self):
        self.region["content"]["production"] = {"outputs": "급수", "requires": "부품"}
        self.assertTrue(content_errors(self.region))

    def test_unknown_hazard_kind_rejected(self):
        self.region["content"]["hazard"]["kind"] = "unregistered-kind"
        self.assertTrue(content_errors(self.region))

    def test_whitespace_outcome_rejected(self):
        self.region["content"]["action"]["outcomes"][0]["effect"] = "  "
        self.assertTrue(content_errors(self.region))


class TerrainFixture(TypedDict):
    id: str
    profile: dict[str, dict[str, float]]
    source_refs: list[str]


class SourceTests(unittest.TestCase):
    def test_subpixel_tile_intersection_does_not_lose_interior_cells(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            tile = root / "terrain-mapzen-geotiff" / "tile.tif"
            tile.parent.mkdir()
            x, y = 14128000, 4500600
            with rasterio.open(tile, "w", driver="GTiff", width=10, height=10,
                               count=1, dtype="int16", crs="EPSG:3857",
                               transform=from_origin(x, y + 10, 1, 1), nodata=-32768) as dataset:
                dataset.write(np.full((1, 10, 10), 7, dtype=np.int16))
            regions: list[TerrainFixture] = [TerrainFixture(id=rid, profile={}, source_refs=[]) for rid in ("edge", "inside")]
            geometries = {"edge": project(box(x - 2, y + 1, x + 0.1, y + 9), "EPSG:3857"),
                          "inside": project(box(x + 1.1, y + 1.1, x + 8.9, y + 8.9), "EPSG:3857")}
            terrain_profiles(regions, geometries, root)
        self.assertEqual(regions[0]["profile"]["terrain"]["sample_count"], 0)
        self.assertEqual(regions[1]["profile"]["terrain"]["sample_count"], 64)
        self.assertEqual(regions[1]["profile"]["terrain"]["mean_m"], 7)

    def test_building_and_road_are_context_candidates(self):
        self.assertIn("building_context", classify({"building": "apartments"}))
        self.assertIn("road_context", classify({"highway": "residential"}))

    def test_bus_hotel_platform_not_subway_station(self):
        for tags in ({"highway": "bus_stop"}, {"tourism": "hotel"},
                     {"public_transport": "platform", "subway": "yes"}):
            self.assertNotIn("subway_station", classify(tags))
        self.assertIn("subway_station", classify({"railway": "station", "station": "subway"}))

    def test_public_transport_station_requires_rail_mode_evidence(self):
        for tags in ({"public_transport": "station", "amenity": "bus_station"},
                     {"public_transport": "station", "ferry": "yes"},
                     {"public_transport": "station"}):
            with self.subTest(tags=tags):
                self.assertNotIn("rail_station", classify(tags))
                self.assertNotIn("subway_station", classify(tags))
                self.assertIn("access", classify(tags))
        self.assertIn("rail_station", classify({"public_transport": "station", "train": "yes"}))

    def test_real_osm_member_area_holes_and_candidate_inventory(self):
        xml = """<osm version="0.6" generator="region-test">
<node id="1" lat="0" lon="0"/><node id="2" lat="0" lon="10"/>
<node id="3" lat="10" lon="10"/><node id="4" lat="10" lon="0"/>
<node id="5" lat="2" lon="2"/><node id="6" lat="2" lon="4"/>
<node id="7" lat="4" lon="4"/><node id="8" lat="4" lon="2"/>
<node id="9" lat="1" lon="1"><tag k="amenity" v="school"/><tag k="name" v="Same"/></node>
<node id="10" lat="1" lon="1"><tag k="amenity" v="school"/><tag k="name" v="Same"/></node>
<way id="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/></way>
<way id="2"><nd ref="3"/><nd ref="4"/><nd ref="1"/></way>
<way id="3"><nd ref="5"/><nd ref="6"/><nd ref="7"/><nd ref="8"/><nd ref="5"/></way>
<relation id="1"><member type="way" ref="1" role="outer"/>
<member type="way" ref="2" role="outer"/><member type="way" ref="3" role="inner"/>
<tag k="type" v="multipolygon"/><tag k="landuse" v="residential"/></relation>
<relation id="2"><member type="way" ref="999" role="outer"/>
<tag k="type" v="multipolygon"/><tag k="building" v="yes"/></relation>
<relation id="3"><member type="node" ref="9" role="stop"/>
<member type="node" ref="888" role="stop"/><member type="node" ref="10" role="stop"/>
<tag k="type" v="route"/><tag k="route" v="subway"/></relation></osm>"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.osm"
            path.write_text(xml)
            records, inventory = read_candidates(path)
        by_id = {r["id"]: r for r in records}
        self.assertEqual(len(by_id), 8)
        self.assertEqual(inventory["primitives"], {"node": 10, "way": 3, "relation": 3})
        self.assertAlmostEqual(by_id["osm:relation:1"]["shape"].area, 96)
        self.assertFalse(by_id["osm:relation:1"]["shape"].covers(Point(3, 3)))
        self.assertTrue(by_id["osm:relation:2"]["geometry_reason"])
        self.assertTrue(by_id["osm:relation:3"]["geometry_reason"])
        self.assertEqual([m["ref"] for m in by_id["osm:relation:3"]["members"]], [9, 888, 10])
        self.assertIn("osm:node:9", by_id)
        self.assertIn("osm:node:10", by_id)


if __name__ == "__main__":
    unittest.main()
