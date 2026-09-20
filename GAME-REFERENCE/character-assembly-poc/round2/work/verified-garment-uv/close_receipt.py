# /// script
# requires-python = ">=3.13"
# dependencies = []
# ///
# Run: python3 close_receipt.py after all background Blender jobs exit.
"""Bind the final candidate, unchanged certificates and reviewed images."""
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
source_dir = ROOT / "work/garment-shell-topology"
source = source_dir / "female-underwear-topology-v4.blend"
source_sha = hashlib.sha256(source.read_bytes()).hexdigest()
assert source_sha == "0ac891a2625bb1330c1b5942945854c041d503e678da7406e304034264160a02"
verdict = json.loads((HERE / "native-verdict.json").read_text())
quality = json.loads((HERE / "quality.json").read_text())
certificate = json.loads((source_dir / "continuous-clearance-v4.json").read_text())
assert certificate["candidate_sha256"] == source_sha
assert verdict["status"] == "PASS" and verdict["combined_shared_atlas"]["status"] == "PASS"
assert all(v["equal"] for v in verdict["semantic_comparison"].values())
assert verdict["UV0_only"] and verdict["garment_objects_only"] and verdict["exact_original_loop_assignment"]
assert quality["minimum_inter_chart_padding_px"] >= 19.9999
assert quality["minimum_tile_border_px"] >= 19.9999
assert all(c["saved_native_disk_euler"]==1 and c["saved_native_boundary_count"]==1 for c in quality["charts"])
candidate_sha = hashlib.sha256((HERE / "female-garment-uv.blend").read_bytes()).hexdigest()
assert candidate_sha == verdict["source"]["sha256"]
for label,sha in [("before-final",source_sha),("after-final",candidate_sha)]:
    receipt = json.loads((HERE / label / "receipt.json").read_text())
    assert receipt["source_sha256"] == sha and receipt["source_not_saved"]
    for name,expected in receipt["image_sha256"].items():
        assert hashlib.sha256((HERE / label / name).read_bytes()).hexdigest() == expected
gate_hashes = {name:hashlib.sha256((ROOT / "gate" / name).read_bytes()).hexdigest() for name in verdict["gate_sha256"]}
assert gate_hashes == verdict["gate_sha256"]
processes = subprocess.run(["pgrep","-fl",r"Blender.*verified-garment-uv"],capture_output=True,text=True,check=False)
assert processes.returncode == 1 and not processes.stdout
receipt = {"status":"PASS","candidate":"female-garment-uv.blend","candidate_sha256":candidate_sha,
           "source_sha256":source_sha,"scope":"two verified clothing objects only; no body output",
           "native_uv_verdict":"native-verdict.json","quality":"quality.json",
           "geometry_certificate_reuse":"Exact native geometry/material/world-matrix fingerprint equality, not rerun geometry audit",
           "certificate_sha256":{n:hashlib.sha256((source_dir/n).read_bytes()).hexdigest() for n in ("final-v4-verification.json","continuous-clearance-v4.json")},
           "continuous_clearance":certificate["objects"],"gate_sha256":gate_hashes,
           "reusable_assignment_replayed_on_source":True,"owned_live_blender_processes":[],
           "final_views_reviewed":["front","back","side","bandeau-front","briefs-front","briefs-back","crotch"],
           "reviewed_atlas_views":["named-atlas.png","named-chart-details.png"],
           "parent_visual_approval":"pending parent review; not claimed",
           "failure_evidence":"failure-record.md; baseline-inspection.json; numbered attempt files retained"}
(HERE / "completion-receipt.json").write_text(json.dumps(receipt,indent=2))
manifest = {str(p.relative_to(HERE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(HERE.rglob("*")) if p.is_file() and p.name != "manifest-sha256.json"}
(HERE / "manifest-sha256.json").write_text(json.dumps(manifest,indent=2))
print("BUNDLE_COMPLETE",candidate_sha,"no owned Blender processes",flush=True)
