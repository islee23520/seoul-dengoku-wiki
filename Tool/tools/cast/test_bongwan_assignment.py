#!/usr/bin/env python3
import unittest

from bongwan_assignment import assign_bongwan


class BongwanAssignmentTest(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {
                "hangul": "임",
                "hanja": "林",
                "population_2015": 800,
                "bongwan": [{"name": "나주", "hanja": "羅州", "majority": True}],
            },
            {
                "hangul": "임",
                "hanja": "任",
                "population_2015": 200,
                "bongwan": [{"name": "풍천", "hanja": "豊川", "majority": True}],
            },
        ]

    def test_same_name_is_deterministic(self):
        first = assign_bongwan("임하준", self.rows)
        self.assertEqual(first, assign_bongwan("임하준", self.rows))

    def test_result_comes_from_census_rows(self):
        result = assign_bongwan("임하준", self.rows)
        self.assertIn(result["surname_hanja"], {"林", "任"})
        self.assertIn(result["bongwan"], {"나주", "풍천"})

    def test_empty_bongwan_rows_return_none(self):
        self.assertIsNone(assign_bongwan("흥다온", [{"population_2015": 10, "bongwan": []}]))


if __name__ == "__main__":
    unittest.main()
