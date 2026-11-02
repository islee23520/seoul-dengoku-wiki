"""CPU generator fixture; validation delegates to the unmodified real worker."""
import json
import os
from pathlib import Path
import runpy
import signal
import sys

request_path = Path(sys.argv[-1])
job = json.loads(request_path.read_bytes())
root = Path(__file__).parent
if sys.argv[1] == "validate":
    runpy.run_path(str(root / "uniforge3d-worker.py"), run_name="__main__")
elif job["request"]["seed"] == 9:
    # The grandchild escapes the process group. Subreaper custody, not group
    # membership, must still kill and reap it after its parent is cancelled.
    ready_read, ready_write = os.pipe()
    child = os.fork()
    if child == 0:
        os.close(ready_read)
        os.setsid()
        with os.fdopen(ready_write, "wb") as stream:
            stream.write(str(os.getpid()).encode())
        signal.pause()
    os.close(ready_write)
    with os.fdopen(ready_read, "rb") as stream:
        descendant = int(stream.read())
    settings = json.loads((root / "fixture-settings.json").read_bytes())
    marker = Path(settings["results"]) / f'{job["jobId"]}.ready'
    temporary = marker.with_suffix(".tmp")
    temporary.write_text(json.dumps({"parent": os.getpid(), "descendant": descendant}))
    temporary.rename(marker)
    signal.pause()
else:
    Path(job["output"]).write_bytes((root / "mesh.glb").read_bytes())
