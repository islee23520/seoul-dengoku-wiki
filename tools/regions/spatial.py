"""Canonical EPSG:5179 partition, membership, and accounting checks."""
from datetime import date
from typing import overload
from shapely.geometry.base import BaseGeometry

import numpy as np
import shapely
from rasterio.warp import transform as warp
from shapely.geometry import GeometryCollection, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.validation import explain_validity


@overload
def project(geometry: BaseGeometry, source: str = "EPSG:4326", target: str = "EPSG:5179") -> BaseGeometry: ...

@overload
def project(geometry: np.ndarray, source: str = "EPSG:4326", target: str = "EPSG:5179") -> np.ndarray: ...

def project(geometry, source="EPSG:4326", target="EPSG:5179"):
    def coordinates(xy):
        result = warp(source, target, xy[:, 0], xy[:, 1])
        return np.column_stack((result[0], result[1]))
    return shapely.transform(geometry, coordinates)


def clean_regions(regions):
    cleaned, changes = {}, {}
    owned = GeometryCollection()
    for rid, geometry in sorted(regions.items()):
        if not geometry.is_valid or geometry.is_empty:
            raise ValueError(f"Invalid source region: {rid}")
        result = geometry.difference(owned)
        if result.is_empty or result.area <= 0 or not result.is_valid:
            raise ValueError(f"Invalid cleaned region: {rid}")
        cleaned[rid] = result
        changes[rid] = geometry.symmetric_difference(result).area
        owned = owned.union(result)
    return cleaned, changes


def partition_errors(regions, originals):
    errors = []
    if set(regions) != set(originals):
        errors.append("region_id_set_mismatch")
    if any(g.is_empty or not g.is_valid or g.area <= 0 or
           g.geom_type not in {"Polygon", "MultiPolygon"} for g in regions.values()):
        return errors + ["invalid_region_geometry"]
    union = unary_union(list(regions.values()))
    if union.symmetric_difference(unary_union(list(originals.values()))).area > 0.01:
        errors.append("selected_union_gap_or_excess")
    if sum(g.area for g in regions.values()) - union.area > 0.01:
        errors.append("positive_region_overlap")
    return errors


class RegionIndex:
    def __init__(self, regions):
        self.ids = sorted(regions)
        self.geometries = [regions[rid] for rid in self.ids]
        self.tree = STRtree(self.geometries)

    def memberships(self, geometry):
        result = dict(status="quarantine", memberships=[], primary_region_id=None,
                      reason="missing_geometry")
        if geometry is None or geometry.is_empty:
            return result
        if not geometry.is_valid or not np.isfinite(shapely.get_coordinates(geometry)).all():
            result["reason"] = "invalid_geometry:" + explain_validity(geometry)
            return result
        indices = sorted(self.tree.query(geometry, predicate="intersects"))
        if not indices:
            return dict(result, status="outside", reason="disjoint_selected_20260701_union")
        scores = []
        for index in indices:
            intersection = geometry.intersection(self.geometries[index])
            scores.append((intersection.area, intersection.length, self.ids[index]))
        primary = min(scores, key=lambda s: (-s[0], -s[1], s[2]))[2]
        return dict(status="assigned", memberships=[self.ids[i] for i in indices],
                    primary_region_id=primary, reason=None)


def memberships(geometry, regions):
    return RegionIndex(regions).memberships(geometry)


def geometry_from_json(value):
    try:
        geometry = shape(value)
    except (ValueError, TypeError, KeyError, IndexError, shapely.errors.GEOSException, shapely.errors.GeometryTypeError) as error:
        return None, "malformed_geometry:" + str(error)
    if geometry.is_empty or not geometry.is_valid:
        return None, "invalid_geometry:" + explain_validity(geometry)
    return geometry, None


def date_errors(as_of, source_dates):
    cutoff = date.fromisoformat(as_of)
    errors = []
    for value in source_dates:
        if value is None:
            continue
        try:
            start = value[:10] if len(value) >= 10 else value + ("-01-01" if len(value) == 4 else "-01")
            if date.fromisoformat(start) > cutoff:
                errors.append("future_source:" + value)
        except (ValueError, TypeError):
            errors.append("malformed_source_date:" + str(value))
    return errors


def accounting_errors(records, candidate_ids, regions):
    errors, seen = [], set()
    index = RegionIndex(regions)
    for record in records:
        rid = record["id"]
        if rid in seen:
            errors.append("duplicate_candidate:" + rid)
        seen.add(rid)
        geometry, reason = geometry_from_json(record["geometry"]) if record["geometry"] else (None, "missing")
        expected = index.memberships(geometry)
        if record.get("geometry_reason"):
            expected = index.memberships(None)
        for key in ("status", "memberships", "primary_region_id"):
            if record[key] != expected[key]:
                errors.append("candidate_" + key + ":" + rid)
    if seen != candidate_ids:
        errors.append("candidate_id_set_mismatch")
    return errors
