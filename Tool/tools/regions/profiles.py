"""Measured regional context for subsequent authors; no invented inhabitants."""
from collections import Counter, defaultdict
import math

import numpy as np
import rasterio
import rasterio.windows
from rasterio.features import geometry_mask
from rasterio.windows import from_bounds
from shapely.geometry import box, mapping

from spatial import project


class Profiles:
    def __init__(self, regions):
        self.regions = regions
        self.by_id = {row["id"]: row for row in regions}
        self.counts = defaultdict(Counter)
        self.landuse = defaultdict(Counter)
        self.anchors = defaultdict(list)

    def add(self, record):
        classes, tags = record["classification"], record["tags"]
        name = tags.get("name:ko") or tags.get("name")
        for rid in record["memberships"]:
            row = self.by_id[rid]
            self.counts[rid].update(classes)
            self.counts[rid]["all_candidates"] += 1
            for key, category in (("station_ids", "subway_station"), ("station_ids", "rail_station"),
                                  ("facility_ids", "facility"), ("landscape_ids", "landscape"),
                                  ("access_ids", "access")):
                if category in classes:
                    row[key].append(record["id"])
            for key in ("landuse", "natural", "building", "highway"):
                if key in tags:
                    self.landuse[rid][key + "=" + tags[key]] += 1
            if not name:
                continue
            kind = next((c for c in ("subway_station", "rail_station", "facility", "landscape", "access", "building_context", "road_context") if c in classes), "other_context")
            priority = {"subway_station": 0, "rail_station": 1, "landscape": 3, "facility": 4, "access": 6,
                        "building_context": 7, "road_context": 8, "other_context": 9}[kind]
            if tags.get("amenity") in {"hospital", "university", "marketplace", "townhall", "school"} or tags.get("man_made") in {"water_works", "wastewater_plant"}:
                priority = 2
            anchor = dict(id=record["id"], source_object_id=record["id"], name=name, kind=kind,
                          relation="primary" if record["primary_region_id"] == rid else "cross_boundary",
                          source_ref=record["source_ref"], tags={k: tags[k] for k in ("amenity", "railway", "landuse", "natural", "building", "shop", "tourism") if k in tags})
            self.anchors[rid].append((priority, record["id"], anchor))

    def finish(self):
        for row in self.regions:
            rid = row["id"]
            anchors = sorted(self.anchors[rid])
            # Reserve representatives of each observed kind before filling remaining slots.
            selected, kinds = [], set()
            for entry in anchors:
                if entry[2]["kind"] not in kinds:
                    selected.append(entry)
                    kinds.add(entry[2]["kind"])
            for entry in anchors:
                if len(selected) >= 12:
                    break
                if entry not in selected:
                    selected.append(entry)
            row["profile"] = dict(landuse=[dict(tag=tag, object_count=count) for tag, count in self.landuse[rid].most_common()],
                                  terrain={}, anchors=[a[2] for a in sorted(selected)[:12]],
                                  candidate_counts=dict(self.counts[rid]),
                                  anchor_scope="Selected representatives, not an exhaustive facility inventory; all memberships remain in objects.")


def terrain_profiles(regions, geometries, source_root):
    files = sorted((source_root / "terrain-mapzen-geotiff").rglob("*.tif"))
    values, refs = defaultdict(list), defaultdict(list)
    geometries_3857 = {rid: project(g, "EPSG:5179", "EPSG:3857") for rid, g in geometries.items()}
    for path in files:
        with rasterio.open(path) as dataset:
            for rid, geometry in geometries_3857.items():
                if not geometry.intersects(box(*dataset.bounds)):
                    continue
                fractional = from_bounds(*geometry.bounds, transform=dataset.transform)
                left = max(0, math.floor(fractional.col_off))
                top = max(0, math.floor(fractional.row_off))
                right = min(dataset.width, math.ceil(fractional.col_off + fractional.width))
                bottom = min(dataset.height, math.ceil(fractional.row_off + fractional.height))
                if right <= left or bottom <= top:
                    continue
                window = rasterio.windows.Window.from_slices((top, bottom), (left, right))
                data = dataset.read(1, window=window, masked=True)
                inside = geometry_mask([mapping(geometry)], out_shape=data.shape, transform=dataset.window_transform(window), invert=True)
                valid = data.compressed() if inside.all() else data[inside].compressed()
                if valid.size:
                    values[rid].append(valid)
                    refs[rid].append("terrain:" + str(path.relative_to(source_root)))
    for row in regions:
        rid = row["id"]
        samples = np.concatenate(values[rid]) if values[rid] else np.array([])
        row["profile"]["terrain"] = dict(sample_count=int(samples.size),
            min_m=int(samples.min()) if samples.size else None, max_m=int(samples.max()) if samples.size else None,
            mean_m=float(samples.mean()) if samples.size else None,
            relief_m=int(samples.max() - samples.min()) if samples.size else None,
            source_refs=refs[rid], method="Native EPSG:3857 raster cell centers inside region; nodata excluded; not a slope or travel model.",
            observation_date=None, source_object_modified_month="2017-12")
        row["source_refs"].extend(refs[rid])
