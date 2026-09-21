"""Run Blender mesh-work audit, conservative repair planning and verification."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path
from typing import TypedDict, cast

from .mesh_contract import MeshJob, route_request, write_job
from .mesh_plan import RepairPlan, build_repair_plan, write_plan

TOOL_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = TOOL_ROOT.parents[1]
DEFAULT_BLENDER = Path("/Applications/Blender.app/Contents/MacOS/Blender")


class MeshWorkReceipt(TypedDict):
    schema_version: int
    status: str
    source: dict[str, object]
    job: MeshJob
    audit_path: str
    plan_path: str
    output_path: str | None
    verification_path: str | None
    hard_failures: list[str]
    blocked: list[str]
    applied_actions: list[str]
    unproven: list[str]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def blender_path() -> Path:
    return Path(os.environ.get("BLENDER_PATH", str(DEFAULT_BLENDER)))


def run_audit(source: Path, job_path: Path, audit_path: Path, *, blender: Path | None = None) -> dict[str, object]:
    executable = blender or blender_path()
    script = TOOL_ROOT / "scripts" / "audit_mesh_work_blender.py"
    subprocess.run([
        str(executable), "--background", "--factory-startup", str(source.resolve()),
        "--python-exit-code", "1", "--python", str(script), "--",
        "--job", str(job_path.resolve()), "--output", str(audit_path.resolve()),
    ], check=True)
    raw = cast(object, json.loads(audit_path.read_text(encoding="utf-8")))
    if not isinstance(raw, dict):
        raise ValueError("Blender mesh audit must be an object")
    return cast(dict[str, object], raw)


def apply_plan(source: Path, plan_path: Path, output_path: Path, *, allow_destructive: bool, blender: Path | None = None) -> list[str]:
    executable = blender or blender_path()
    script = TOOL_ROOT / "scripts" / "apply_mesh_plan_blender.py"
    command = [
        str(executable), "--background", "--factory-startup", str(source.resolve()),
        "--python-exit-code", "1", "--python", str(script), "--",
        "--plan", str(plan_path.resolve()), "--output", str(output_path.resolve()),
    ]
    if allow_destructive:
        command.append("--allow-destructive")
    completed = subprocess.run(command, check=True, capture_output=True, text=True)
    marker = next((line for line in completed.stdout.splitlines() if line.startswith("{")), None)
    if marker is None:
        raise RuntimeError("repair process did not emit a success receipt")
    payload = json.loads(marker)
    return [str(item) for item in payload.get("actions", [])]


def execute_mesh_work(
    source: Path,
    request: str,
    work_dir: Path,
    *,
    output: Path | None = None,
    apply_repairs: bool = False,
    allow_destructive: bool = False,
    blender: Path | None = None,
) -> MeshWorkReceipt:
    if not source.is_file():
        raise FileNotFoundError(source)
    if output is not None and source.resolve() == output.resolve():
        raise ValueError("output must not overwrite source")
    source_resolved = source.resolve()
    if work_dir.exists() and work_dir.is_symlink():
        raise ValueError("work-dir must not be a symlink")
    work_dir.mkdir(parents=True, exist_ok=True)
    job = route_request(request, apply_repairs=apply_repairs)
    job_path = work_dir / "mesh-job.json"
    audit_path = work_dir / "baseline-audit.json"
    plan_path = work_dir / "repair-plan.json"
    receipt_path = work_dir / "mesh-work-receipt.json"
    for artifact in (job_path, audit_path, plan_path, receipt_path, work_dir / "verification-audit.json"):
        if artifact.exists() and artifact.is_symlink():
            raise ValueError(f"work artifact must not be a symlink: {artifact.name}")
        if artifact.resolve() == source_resolved:
            raise ValueError(f"work artifact must not overwrite source: {artifact.name}")
    write_job(job_path, job)
    audit = run_audit(source, job_path, audit_path, blender=blender)
    plan = build_repair_plan(audit)
    write_plan(plan_path, plan)
    applied: list[str] = []
    verification_path: Path | None = None
    final_status = "AUDITED"
    if apply_repairs:
        if output is None:
            raise ValueError("--output is required when repairs are applied")
        if plan["blocked"]:
            final_status = "BLOCKED"
        else:
            applied = apply_plan(source, plan_path, output, allow_destructive=allow_destructive, blender=blender)
            verification_path = work_dir / "verification-audit.json"
            verified = run_audit(output, job_path, verification_path, blender=blender)
            verified_failures = [str(value) for value in cast(list[object], verified.get("hard_failures", []))]
            if verified_failures:
                final_status = "FAIL"
            elif plan["unproven"]:
                final_status = "REPAIRED_UNPROVEN"
            else:
                final_status = "PASS"
    receipt: MeshWorkReceipt = {
        "schema_version": 1,
        "status": final_status,
        "source": {"path": str(source.resolve()), "sha256": sha256(source), "size_bytes": source.stat().st_size},
        "job": job,
        "audit_path": str(audit_path.resolve()),
        "plan_path": str(plan_path.resolve()),
        "output_path": str(output.resolve()) if output else None,
        "verification_path": str(verification_path.resolve()) if verification_path else None,
        "hard_failures": plan["hard_failures"],
        "blocked": plan["blocked"],
        "applied_actions": applied,
        "unproven": plan["unproven"],
    }
    receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return receipt
