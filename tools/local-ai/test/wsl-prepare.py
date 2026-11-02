"""Prepare only a unique CPU fixture directory, preserving task16 inputs."""
import hashlib
import json
from pathlib import Path
import shutil
import struct
import sys

repository, name, results = sys.argv[1:]
base = Path("/home/oliver/.local/share/local-ai/uniforge3d")
root = base / "data" / name
root.chmod(0o700)
for filename in ("wsl-supervisor.py", "wsl-collector.py", "wsl_contract.py", "uniforge3d-worker.py"):
    shutil.copyfile(Path(repository) / "tools/local-ai" / filename, root / filename)
shutil.copyfile(Path(repository) / "tools/local-ai/test/wsl-fixture.py", root / "worker.py")
(root / "source/uniforge3d/pipelines").mkdir(parents=True)
(root / "model").mkdir()
(root / "cache").mkdir()
(root / "jobs").mkdir()
source_file = root / "source/uniforge3d/pipelines/uniforge3d_image_to_3d.py"
shutil.copyfile(base / "build/uniforge3d/pipelines/uniforge3d_image_to_3d.py", source_file)
(root / "model/pipeline.json").write_text("{}")
image = Path(results) / "input.ppm"
image.write_bytes(b"P6\n1 1\n255\n\xff\x00\x00")
(root / "fixture-settings.json").write_text(json.dumps({"results": results}))
binary = struct.pack("<9f3H2x", 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 2)
document = {"asset": {"version": "2.0"}, "buffers": [{"byteLength": 44}],
            "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": 36},
                            {"buffer": 0, "byteOffset": 36, "byteLength": 6}],
            "accessors": [{"bufferView": 0, "componentType": 5126, "count": 3, "type": "VEC3"},
                          {"bufferView": 1, "componentType": 5123, "count": 3, "type": "SCALAR"}],
            "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "indices": 1}]}]}
encoded = json.dumps(document).encode()
encoded += b" " * (-len(encoded) % 4)
(root / "mesh.glb").write_bytes(struct.pack("<4s4I", b"glTF", 2, 28 + len(encoded) + 44,
                                          len(encoded), 0x4E4F534A) + encoded
                              + struct.pack("<2I", 44, 0x004E4942) + binary)
python = Path(sys.executable)
pins = [{"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        for path in (python, image, *[p for p in root.rglob("*") if p.is_file()])]
config = {"python": str(python), "worker": str(root / "worker.py"), "source": str(root / "source"),
          "sourceRevision": "8b6094780e202b8a6b1d239e0997552e18547026", "runtimeId": "task20-cpu-fixture",
          "model": str(root / "model"), "hfHome": str(root / "cache"), "outputRoot": str(root / "jobs"),
          "resultsRoot": results, "assets": {"fixture": [str(image)]}, "pins": pins}
(root / "config.json").write_text(json.dumps(config))
print(json.dumps({"root": str(root), "python": str(python), "pins": pins}))
