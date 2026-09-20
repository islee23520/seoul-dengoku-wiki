# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy"]
# ///
"""Geometric fixtures separate legitimate adjacency from true penetration."""
import unittest
import numpy as np
from triangle_intersection_audit import audit_intersections


class TriangleIntersectionTests(unittest.TestCase):
    def test_shared_edge_and_shared_vertex_are_allowed(self):
        p = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [-1, 0, 0]], float)
        self.assertTrue(audit_intersections(p, [[0, 1, 2], [1, 3, 2]])['ok'])
        self.assertTrue(audit_intersections(p, [[0, 1, 2], [0, 4, 5]])['ok'])

    def test_nonadjacent_crossing_fails_in_either_winding(self):
        p = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [.2, .2, -1], [.2, .2, 1], [.7, .2, 0]], float)
        for other in [[3, 4, 5], [5, 4, 3]]:
            result = audit_intersections(p, [[0, 1, 2], other])
            self.assertFalse(result['ok'])
            self.assertEqual(result['intersections'][0]['type'], 'PROPER_INTERSECTION')

    def test_shared_vertex_does_not_hide_crossing(self):
        p = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [.5, .2, -1], [.5, .2, 1]], float)
        result = audit_intersections(p, [[0, 1, 2], [0, 3, 4]])
        self.assertFalse(result['ok'])
        self.assertEqual(result['intersections'][0]['shared_vertices'], 1)

    def test_coplanar_overlap_and_duplicate_fail(self):
        p = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [.1, .1, 0], [.2, .1, 0], [.1, .2, 0]], float)
        self.assertFalse(audit_intersections(p, [[0, 1, 2], [3, 4, 5]])['ok'])
        self.assertFalse(audit_intersections(p, [[0, 1, 2], [2, 1, 0]])['ok'])

    def test_parallel_planes_are_not_aabb_false_positive(self):
        p = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, .1], [1, 0, .1], [0, 1, .1]], float)
        self.assertTrue(audit_intersections(p, [[0, 1, 2], [3, 4, 5]])['ok'])


if __name__ == '__main__':
    unittest.main()
