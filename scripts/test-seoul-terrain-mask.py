import importlib.util
import unittest
from pathlib import Path

import numpy as np
from shapely.geometry import MultiPolygon, Polygon

spec = importlib.util.spec_from_file_location('seoul_terrain', Path(__file__).with_name('project-seoul-terrain.py'))
terrain = importlib.util.module_from_spec(spec)
spec.loader.exec_module(terrain)


class TerrainTests(unittest.TestCase):
    def test_exact_mask_hole_island_and_pixel_edges(self):
        union = MultiPolygon([Polygon([(0, 0), (6, 0), (6, 6), (0, 6)], holes=[[(2, 2), (4, 2), (4, 4), (2, 4)]]), Polygon([(8, 0), (10, 0), (10, 2), (8, 2)])])
        samples = np.zeros((11, 11, 2), dtype='<u2')
        samples[:, :, 0] = 700
        image, bounds = terrain.raster(samples.tobytes(), {'width': 11, 'height': 11, 'bboxEPSG5179': [0, 0, 10, 10]}, union)
        self.assertEqual(image.getpixel((3, 3)), (0, 0, 0, 0))
        self.assertEqual(image.getpixel((6, 4)), (0, 0, 0, 0))
        self.assertEqual(image.getpixel((8, 4))[3], 255)
        self.assertEqual(bounds, [0.5, 0.5, 9.5, 5.5])
        clip = terrain.exact_clip(union, {'projection': {'minEast': 0, 'maxEast': 10, 'minNorth': 0, 'maxNorth': 10}, 'width': 10, 'height': 10})
        self.assertEqual(clip['path'].count('M'), 3)

    def test_river_crossings_and_outside_excluded(self):
        union = Polygon([(0, 0), (4, 0), (4, 4), (0, 4)], holes=[[(1, 1), (3, 1), (3, 3), (1, 3)]])
        features = [{'id': 'way/1', 'kind': 'line', 'tag': {'waterway': 'river'}, 'coordinates': [[-1, 2], [5, 2]]},
                    {'id': 'way/2', 'kind': 'line', 'tag': {'waterway': 'river'}, 'coordinates': [[6, 6], [8, 8]]}]
        lines = terrain.river_lines(features, union)
        self.assertEqual(len(lines), 2)
        self.assertEqual([line['memberIndex'] for line in lines], [0, 1])
        self.assertTrue(all(__import__('shapely').geometry.LineString(line['coordinates']).difference(union).length < 1e-6 for line in lines))


if __name__ == '__main__':
    unittest.main()
