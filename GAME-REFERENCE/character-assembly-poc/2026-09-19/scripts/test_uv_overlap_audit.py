# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Fixture-based UV gate checks with real intersection geometry."""
import unittest

import numpy as np
from uv_overlap_audit import audit, intersection_area


class UVIntersectionTests(unittest.TestCase):
    def test_shared_diagonal_is_not_overlap(self):
        triangles = np.array([[[0, 0], [1, 0], [0, 1]], [[1, 0], [1, 1], [0, 1]]], float)
        self.assertTrue(audit(triangles)['ok'])

    def test_duplicate_reversed_triangle_fails(self):
        triangles = np.array([[[0, 0], [1, 0], [0, 1]], [[0, 1], [1, 0], [0, 0]]], float)
        result = audit(triangles)
        self.assertFalse(result['ok'])
        self.assertAlmostEqual(result['positive_area_overlap_pairs'][0]['area'], .5)

    def test_interior_triangle_and_collinear_uv_fail(self):
        triangles = np.array([[[0, 0], [1, 0], [0, 1]], [[.1, .1], [.2, .1], [.1, .2]], [[2, 0], [3, 0], [4, 0]]], float)
        result = audit(triangles)
        self.assertEqual(result['degenerate_triangle_ids'], [2])
        self.assertEqual(len(result['positive_area_overlap_pairs']), 1)
        self.assertAlmostEqual(result['positive_area_overlap_pairs'][0]['area'], .005)

    def test_separate_mirrored_tiles_pass(self):
        triangles = np.array([[[.02, .1], [.45, .1], [.02, .9]], [[.55, .1], [.98, .1], [.98, .9]]], float)
        self.assertTrue(audit(triangles)['ok'])


if __name__ == '__main__':
    unittest.main()
