# /// script
# requires-python = ">=3.13"
# dependencies = ["numpy"]
# ///
# Run: Blender -b female-garment-uv-attempt-01.blend --python verify_candidate.py
"""Reopen exact native loops and run the original unchanged UV hard gate."""
from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import asdict
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.dont_write_bytecode = True
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1]))
from uv_common import NAMES, ROOT, SOURCE, SOURCE_SHA, extract, fingerprint
from gate.uv_report import audit_extraction
from gate.uv_audit import audit_triangles
from gate.json_values import load_json, is_object_mapping

candidate = Path(bpy.data.filepath)
final = candidate.name == "female-garment-uv.blend"
suffix = "" if final else "-attempt-01"
assignment = json.loads((HERE / ("original-loop-assignment.json" if final else "assignment-attempt-01.json")).read_text())
before = json.loads((HERE / "source-semantic-fingerprints.json").read_text())
comparison = {name:{"before":before[name],"after":fingerprint(bpy.data.objects[name])} for name in NAMES}
for value in comparison.values():
    value["equal"] = value["before"] == value["after"]
meshes = [extract(bpy.data.objects[name]) for name in NAMES]
payload = {"schema_version":1,"source":{"path":str(candidate),"sha256":hashlib.sha256(candidate.read_bytes()).hexdigest(),"blender_version":bpy.app.version_string},"meshes":meshes}
parsed = load_json(json.dumps(payload))
assert is_object_mapping(parsed)
report = dict(audit_extraction(parsed))
combined = [t for mesh in meshes for t in mesh["triangles"]]
report["combined_shared_atlas"] = asdict(audit_triangles(np.array([t["uv"] for t in combined])))
report["semantic_comparison"] = comparison
report["source_sha256_unchanged"] = hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SOURCE_SHA
report["exact_original_loop_assignment"] = all(tuple(bpy.data.objects[name].data.uv_layers.active.data[l["loop"]].uv)==tuple(l["uv"]) for name in NAMES for l in assignment["objects"][name]["loops"])
report["UV0_only"] = all(len(bpy.data.objects[name].data.uv_layers)==1 and bpy.data.objects[name].data.uv_layers.active_index==0 for name in NAMES)
report["garment_objects_only"] = sorted(o.name for o in bpy.data.objects) == sorted(NAMES)
report["gate_sha256"] = {name:hashlib.sha256((ROOT/"gate"/name).read_bytes()).hexdigest() for name in ("uv_audit.py","uv_report.py","geometry_audit.py","intersections.py")}
(HERE / ("native-extraction"+suffix+".json")).write_text(json.dumps(payload, indent=2))
(HERE / ("native-verdict"+suffix+".json")).write_text(json.dumps(report, indent=2))
print("NATIVE_VERDICT",report["status"],"combined",report["combined_shared_atlas"]["status"], "geometry",comparison,flush=True)
assert report["status"] == "PASS" and report["combined_shared_atlas"]["status"] == "PASS"
assert report["source_sha256_unchanged"] and report["exact_original_loop_assignment"] and all(v["equal"] for v in comparison.values())
assert not final or (report["UV0_only"] and report["garment_objects_only"])
print("REOPEN_PASS", flush=True)
