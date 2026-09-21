"""Create conservative repair plans from Blender audit receipts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TypedDict, cast


class RepairAction(TypedDict):
    action: str
    object_name: str
    parameters: dict[str, object]
    authorization: str


class RepairPlan(TypedDict):
    schema_version: int
    status: str
    source_sha256: str
    hard_failures: list[str]
    actions: list[RepairAction]
    blocked: list[str]
    donor_decisions: list[dict[str, object]]
    unproven: list[str]


def _integer(value: object, default: int = 0) -> int:
    return value if type(value) is int else default


def _number(value: object, default: float) -> float:
    return float(value) if isinstance(value, int | float) else default


def build_repair_plan(audit: dict[str, object]) -> RepairPlan:
    if audit.get("schema_version") != 1 or not isinstance(audit.get("source"), dict) or not isinstance(audit.get("objects"), list):
        raise ValueError("malformed Blender mesh audit")
    source = cast(dict[str, object], audit["source"])
    actions: list[RepairAction] = []
    blocked: list[str] = []
    hard_failures: list[str] = []
    donor_decisions: list[dict[str, object]] = []
    for raw in cast(list[object], audit["objects"]):
        if not isinstance(raw, dict):
            raise ValueError("malformed audit object")
        item = cast(dict[str, object], raw)
        name = str(item.get("object_name"))
        failures = [str(value) for value in cast(list[object], item.get("hard_failures", []))]
        hard_failures.extend(failures)
        if "WINDING_CONFLICT" in failures or bool(item.get("inconsistent_normals")):
            actions.append({"action": "recalculate-normals", "object_name": name, "parameters": {"inside": False}, "authorization": "safe-local"})
        center_candidates = _integer(item.get("centerline_duplicate_pair_count"))
        if center_candidates > 0:
            actions.append({"action": "weld-centerline", "object_name": name, "parameters": {"threshold_m": _number(item.get("centerline_weld_threshold_m"), 0.00001)}, "authorization": "safe-local"})
        symmetry = item.get("symmetry")
        if isinstance(symmetry, dict):
            symmetry_data = cast(dict[str, object], symmetry)
            donor = symmetry_data.get("recommended_donor")
            decision = {
                "object_name": name,
                "recommended_donor": donor,
                "match_coverage": symmetry_data.get("match_coverage"),
                "maximum_error_m": symmetry_data.get("maximum_error_m"),
                "left_hard_issue_count": symmetry_data.get("left_hard_issue_count"),
                "right_hard_issue_count": symmetry_data.get("right_hard_issue_count"),
            }
            donor_decisions.append(decision)
            if donor in {"left", "right"}:
                actions.append({"action": "mirror-from-donor", "object_name": name, "parameters": {"donor": donor, "plane_x_m": _number(symmetry_data.get("plane_x_m"), 0.0), "weld_threshold_m": _number(symmetry_data.get("weld_threshold_m"), 0.00001)}, "authorization": "explicit-destructive"})
            elif symmetry_data.get("requested") is True and symmetry_data.get("eligible") is True:
                blocked.append(f"SYMMETRY_DONOR_UNPROVEN:{name}")
        for failure in failures:
            if failure not in {"WINDING_CONFLICT", "CENTERLINE_DUPLICATE"}:
                blocked.append(f"MANUAL_OR_SPECIALIZED_REPAIR_REQUIRED:{name}:{failure}")
    hard_failures = list(dict.fromkeys(hard_failures))
    blocked = list(dict.fromkeys(blocked))
    unproven = [str(value) for value in cast(list[object], audit.get("unproven", []))]
    return {
        "schema_version": 1,
        "status": "BLOCKED" if blocked else ("READY" if actions else "NO_ACTION"),
        "source_sha256": str(source.get("sha256", "")),
        "hard_failures": hard_failures,
        "actions": actions,
        "blocked": blocked,
        "donor_decisions": donor_decisions,
        "unproven": unproven,
    }


def load_audit(path: Path) -> dict[str, object]:
    raw = cast(object, json.loads(path.read_text(encoding="utf-8")))
    if not isinstance(raw, dict):
        raise ValueError("audit must be an object")
    return cast(dict[str, object], raw)


def write_plan(path: Path, plan: RepairPlan) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
