"""Owner-steered mesh-work contracts and natural-language routing."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import TypedDict, cast

TOOL_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONTRACT_PATH = TOOL_ROOT / "contracts" / "owner-steered-mesh-v1.json"


class RoutedStage(TypedDict):
    id: str
    reason: str


class MeshJob(TypedDict):
    schema_version: int
    contract_id: str
    request: str
    stages: list[RoutedStage]
    required_checks: list[str]
    protected_openings: list[str]
    required_roles: list[str]
    symmetry_requested: bool
    apply_repairs: bool


@dataclass(frozen=True)
class RouteRule:
    stage: str
    patterns: tuple[str, ...]
    reason: str


ROUTES = (
    RouteRule("inventory", ("import", "임포트", "source", "소스", "axis", "축", "height", "높이"), "lock source identity, axes, units and bounds"),
    RouteRule("topology-audit", ("repair", "수리", "hole", "구멍", "weld", "용접", "normal", "노말", "boundary", "경계", "quad", "쿼드", "retopo", "리토포"), "audit topology and protected boundaries before repair"),
    RouteRule("bilateral-audit", ("symmetry", "시메트리", "대칭", "bilateral", "좌우", "양쪽", "left", "왼쪽", "right", "오른쪽", "반대쪽"), "audit both halves before donor selection"),
    RouteRule("join-transition", ("neck", "목", "join", "접합", "density", "밀도", "head", "머리", "body", "몸"), "measure and plan high-density to low-density transition"),
    RouteRule("oral-eye", ("oral", "mouth", "입", "구강", "입안", "잇몸", "치아", "혀", "eye", "눈", "눈알", "각막", "동공", "홍채"), "preserve eye openings and require oral/eye roles"),
    RouteRule("uv-texture", ("uv", "texture", "텍스처", "bake", "베이크", "color", "색상"), "validate final-geometry UV and source-color lineage"),
    RouteRule("delivery", ("fbx", "export", "익스포트", "reimport", "재임포트", "unity", "three.js", "threejs"), "verify portable export and independent reimport"),
    RouteRule("holdout", ("holdout", "재현", "repeat", "반복", "다른 메쉬", "자율"), "prove the frozen procedure on independent geometry"),
)


def load_contract(path: Path = DEFAULT_CONTRACT_PATH) -> dict[str, object]:
    raw = cast(object, json.loads(path.read_text(encoding="utf-8")))
    if not isinstance(raw, dict) or raw.get("schema_version") != 1 or not isinstance(raw.get("contract_id"), str):
        raise ValueError("unsupported mesh-work contract")
    return cast(dict[str, object], raw)


def route_request(request: str, *, apply_repairs: bool = False, contract_path: Path = DEFAULT_CONTRACT_PATH) -> MeshJob:
    normalized = request.casefold()
    contract = load_contract(contract_path)
    stages: list[RoutedStage] = [{"id": "inventory", "reason": "every job begins with immutable source inventory"}]
    seen = {"inventory"}
    for rule in ROUTES:
        if rule.stage in seen:
            continue
        if any(re.search(re.escape(pattern.casefold()), normalized) for pattern in rule.patterns):
            stages.append({"id": rule.stage, "reason": rule.reason})
            seen.add(rule.stage)
    if "topology-audit" not in seen:
        stages.append({"id": "topology-audit", "reason": "hard geometry failures must be checked for every mesh job"})
        seen.add("topology-audit")
    stages.append({"id": "verification", "reason": "fresh-process verification is mandatory"})
    protected = [str(item["semantic_id"]) for item in cast(list[dict[str, object]], contract["protected_openings"])]
    roles = [str(item) for item in cast(list[object], contract["oral_roles"])]
    return {
        "schema_version": 1,
        "contract_id": str(contract["contract_id"]),
        "request": request,
        "stages": stages,
        "required_checks": [str(item) for item in cast(list[object], contract["hard_failures"])],
        "protected_openings": protected,
        "required_roles": roles,
        "symmetry_requested": "bilateral-audit" in seen,
        "apply_repairs": apply_repairs,
    }


def write_job(path: Path, job: MeshJob) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(job, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
