"""Read-only fixed Windows probes and native reservation; no public commands."""
import datetime
import ast
import ctypes
from ctypes import wintypes
import json
import hashlib
import os
import pathlib
import re
import subprocess
import sys
import urllib.request
from typing import Any

import job

TRAINING = pathlib.Path("E:/git/linalab/PNGAL/environment/training")
# Measured read-only over strict SSH on 2026-10-21; no remote directories created.
CANONICAL_TRAINING = pathlib.Path("D:/AI/environments/PNGAL/training")
PROCESS_COMMAND = "$ErrorActionPreference='Stop';$rows=@(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,ExecutablePath,CommandLine,@{N='start';E={$_.CreationDate.ToUniversalTime().ToString('o')}});$listeners=@(Get-NetTCPConnection -State Listen | Where-Object {($_.LocalPort -eq 8188 -and $_.LocalAddress -eq '127.0.0.1') -or $_.LocalPort -eq 8189} | ForEach-Object {$p=Get-CimInstance Win32_Process -Filter ('ProcessId='+$_.OwningProcess);@{pid=[int]$_.OwningProcess;processStart=$p.CreationDate.ToUniversalTime().ToString('o');address=$_.LocalAddress;port=[int]$_.LocalPort}});@{processes=$rows;listeners=$listeners} | ConvertTo-Json -Depth 5 -Compress"
COMFY_ROOT = "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0"
COMFY_PYTHON = COMFY_ROOT + "/venv/Scripts/python.exe"
COMFY_SCRIPT = COMFY_ROOT + "/main.py"
COMFY_ARGS = ["--listen", "127.0.0.1", "--port", "8188"]
COMFY_MAIN_SHA = "226a90fdd2cb0942c587e60ae292cddcebd8f6173224e3b91a80ab0efafa93ef"
DESKTOP_ROOT = "D:/AI/Comfy-Desktop/ComfyUI"
DESKTOP_CWD = "E:/Comfy-Desktop/ComfyUI"
DESKTOP_PARENT = DESKTOP_ROOT + "/ComfyUI/.venv/Scripts/python.exe"
DESKTOP_CHILD = DESKTOP_ROOT + "/standalone-env/python.exe"
DESKTOP_ARGV = ["E:/Comfy-Desktop/ComfyUI/ComfyUI/.venv/Scripts/python.exe", "-s", "ComfyUI/main.py",
                "--feature-flag", "show_signin_button=true", "--feature-flag", "enable_telemetry=true",
                "--enable-assets", "--enable-manager", "--listen", "--port", "8189", "--extra-model-paths-config",
                "C:/Users/oliver/AppData/Roaming/Comfy Desktop/instance-model-paths/inst-1783870996011.yaml"]
DESKTOP_SCRIPT = DESKTOP_ROOT + "/ComfyUI/main.py"
DESKTOP_MAIN_SHA = "a25ef1dbc7159b79fbf1e596e2c901322d6248681020e520ea5b7f84f4f2dbec"
DESKTOP_APP = "C:/Users/oliver/AppData/Local/Programs/ComfyUI/Comfy Desktop/Comfy Desktop.exe"
START = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z")


def linked(path):
    return path.is_symlink() or bool(getattr(path.lstat(), "st_file_attributes", 0) & 0x400)


def windows_argv(command):
    """Use Windows' own parser, not whitespace or substring interpretation."""
    job.require(os.name == "nt" and type(command) is str and bool(command) and len(command) <= 32767,
                "NATIVE_PROCESS_ARGV_UNKNOWN")
    loader = getattr(ctypes, "WinDLL")  # This attribute exists only on Windows.
    shell = loader("shell32", use_last_error=True)
    parse = shell.CommandLineToArgvW
    parse.argtypes = [wintypes.LPCWSTR, ctypes.POINTER(ctypes.c_int)]
    parse.restype = ctypes.POINTER(wintypes.LPWSTR)
    count = ctypes.c_int()
    pointer = parse(command, ctypes.byref(count))
    job.require(bool(pointer), "NATIVE_PROCESS_ARGV_UNKNOWN")
    free = loader("kernel32", use_last_error=True).LocalFree
    free.argtypes = [ctypes.c_void_p]
    free.restype = ctypes.c_void_p
    try:
        return [pointer[index] for index in range(count.value)]
    finally:
        free(ctypes.cast(pointer, ctypes.c_void_p))


def norm(value):
    job.require(type(value) is str, "NATIVE_PROCESS_PATH_UNKNOWN")
    return value.replace("\\", "/")


def process_record(record):
    job.closed(record, "name start parentPid command executable argv cwd cwdResolved scriptPath scriptSHA256 startAfter")
    job.require(type(record["name"]) is str and type(record["start"]) is str and START.fullmatch(record["start"]) and
                record["startAfter"] == record["start"] and type(record["parentPid"]) is int, "NATIVE_PROCESS_INVENTORY")


def proven_comfy(processes: dict[str, dict[str, Any]], listeners: list[dict[str, Any]]):
    job.require(type(processes) is dict and type(listeners) is list, "NATIVE_COMFY_LISTENER")
    for key, record in processes.items():
        job.require(type(key) is str and key.isdigit(), "NATIVE_PROCESS_INVENTORY")
        process_record(record)
    for listener in listeners:
        job.closed(listener, "pid processStart address port")
        job.require(type(listener["pid"]) is int and type(listener["port"]) is int and
                    str(listener["pid"]) in processes and
                    listener["processStart"] == processes[str(listener["pid"])]["start"], "NATIVE_COMFY_PID_REUSED")
    primary = [item for item in listeners if item["port"] == 8188 and item["address"] == "127.0.0.1"]
    desktop = [item for item in listeners if item["port"] == 8189]
    job.require(len(primary) == 1 and len(desktop) == 2 and
                {item["address"] for item in desktop} == {"0.0.0.0", "::"} and
                len({item["pid"] for item in desktop}) == 1 and len(listeners) == 3, "NATIVE_COMFY_LISTENER")
    pid = primary[0]["pid"]
    record = processes[str(pid)]
    argv = record["argv"]
    job.require(type(argv) is list and len(argv) == 6 and all(type(v) is str for v in argv), "NATIVE_COMFY_PROCESS")
    job.require(record["name"].lower() == "python.exe" and norm(record["executable"]) == COMFY_PYTHON and
                norm(argv[0]) == COMFY_PYTHON and norm(argv[1]) in ("main.py", COMFY_SCRIPT) and argv[2:] == COMFY_ARGS and
                norm(record["cwd"]) == COMFY_ROOT and norm(record["cwdResolved"]) == COMFY_ROOT and
                norm(record["scriptPath"]) == COMFY_SCRIPT and record["scriptSHA256"] == COMFY_MAIN_SHA, "NATIVE_COMFY_PROCESS")
    child_pid = desktop[0]["pid"]
    child = processes[str(child_pid)]
    parent = processes.get(str(child["parentPid"]))
    if not isinstance(parent, dict):
        raise ValueError("NATIVE_DESKTOP_ANCESTRY")
    app = processes.get(str(parent["parentPid"]))
    job.require(app is not None and norm(app["executable"]) == DESKTOP_APP and app["name"] == "Comfy Desktop.exe" and
                app["start"] < parent["start"] < child["start"] and child_pid != pid, "NATIVE_DESKTOP_ANCESTRY")
    for item, executable in ((parent, DESKTOP_PARENT), (child, DESKTOP_CHILD)):
        job.require(item["name"].lower() == "python.exe" and norm(item["executable"]) == executable and
                    type(item["argv"]) is list and [norm(arg) for arg in item["argv"]] == DESKTOP_ARGV and
                    norm(item["cwd"]) == DESKTOP_CWD and norm(item["cwdResolved"]) == DESKTOP_ROOT and
                    norm(item["scriptPath"]) == DESKTOP_SCRIPT and item["scriptSHA256"] == DESKTOP_MAIN_SHA,
                    "NATIVE_DESKTOP_PROCESS")
    def identity(profile, owner_pid, item, port):
        return {"profile": profile, "pid": owner_pid, "processStart": item["start"],
                "executable": item["executable"], "script": item["scriptPath"], "argv": item["argv"], "listenerPort": port}
    return [identity("fixed8188", pid, record, 8188),
            identity("desktop8189-parent", child["parentPid"], parent, 8189),
            identity("desktop8189-listener", child_pid, child, 8189)]


def validate_process_proof(proof):
    job.closed(proof, "schema processInventoryComplete processes listeners freeMiB utilization queue queues systemStats provenComfyInstances")
    job.require(proof["schema"] == "native-moss-host-process-proof.v2" and proof["processInventoryComplete"] is True, "NATIVE_PROCESS_INVENTORY")
    expected = proven_comfy(proof["processes"], proof["listeners"])
    job.require(proof["provenComfyInstances"] == expected, "NATIVE_COMFY_PROCESS")
    job.closed(proof["queues"], "8188 8189")
    job.closed(proof["systemStats"], "8188")
    for port in ("8188", "8189"):
        queue = proof["queues"][port]
        job.closed(queue, "queue_running queue_pending")
        job.require(type(queue["queue_running"]) is list and type(queue["queue_pending"]) is list, "NATIVE_QUEUE_UNKNOWN")
        job.require(not queue["queue_running"] and not queue["queue_pending"], "NATIVE_COMFY_QUEUE_BUSY")
        if port == "8188":
            stats = proof["systemStats"][port]
            job.closed(stats, "pid argv")
            job.require(stats["pid"] == expected[0]["pid"] and [norm(a) for a in stats["argv"]] ==
                        ["main.py", *COMFY_ARGS], "NATIVE_COMFY_SYSTEM_IDENTITY")
    job.require(proof["queue"] == proof["queues"]["8188"] and type(proof["freeMiB"]) is int and
                proof["freeMiB"] >= 0 and type(proof["utilization"]) is int and 0 <= proof["utilization"] <= 100,
                "NATIVE_GPU_INVENTORY")
    return {(str(item["pid"]), item["processStart"]) for item in expected}


def canonical(root):
    job.require(TRAINING.resolve() == CANONICAL_TRAINING and root == job.ROOT and
                root.parent.resolve() == CANONICAL_TRAINING, "NATIVE_CANONICAL_ROOT")
    job.require(root.is_dir() and not linked(root) and root.resolve() == CANONICAL_TRAINING / root.name,
                "NATIVE_JOB_ROOT_REPARSE")
    for path in root.rglob("*"):
        job.require(not linked(path) and path.resolve().is_relative_to(root.resolve()), "NATIVE_DESCENDANT_REPARSE")


def probe():
    job.require(os.name == "nt", "NATIVE_HOST_PROOF_UNAVAILABLE")
    import psutil
    job.require(psutil.__version__ == "7.2.2", "NATIVE_PSUTIL_VERSION")
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", PROCESS_COMMAND],
                            capture_output=True, text=True, check=True, timeout=30)
    inventory = json.loads(result.stdout)
    job.closed(inventory, "processes listeners")
    rows: list[dict[str, Any]] = inventory["processes"]
    job.require(type(rows) is list, "NATIVE_PROCESS_INVENTORY")
    processes = {}
    for row in rows:
        job.require(type(row) is dict and type(row.get("ProcessId")) is int and type(row.get("start")) is str and
                    START.fullmatch(row["start"]) and row.get("Name"), "NATIVE_PROCESS_INVENTORY")
        pid = row["ProcessId"]
        python = row["Name"].lower() in ("python.exe", "pythonw.exe")
        command = row.get("CommandLine")
        record = {"name": row["Name"], "start": row["start"], "startAfter": row["start"], "parentPid": row["ParentProcessId"],
                  "command": command, "executable": row.get("ExecutablePath"), "argv": None,
                  "cwd": None, "cwdResolved": None, "scriptPath": None, "scriptSHA256": None}
        if python:
            process = psutil.Process(pid)
            before = process.create_time()
            argv = windows_argv(command)
            cwd = process.cwd()
            record.update(argv=argv, executable=str(pathlib.Path(process.exe()).resolve()), cwd=cwd,
                          cwdResolved=str(pathlib.Path(cwd).resolve()))
            script = next((arg for arg in argv[1:] if arg.lower().endswith(".py")), None)
            if script:
                script_path = pathlib.Path(script)
                if not script_path.is_absolute(): script_path = pathlib.Path(cwd) / script_path
                script_path = script_path.resolve()
                record["scriptPath"] = str(script_path)
                if script_path.is_file():
                    with script_path.open("rb") as stream:
                        record["scriptSHA256"] = hashlib.file_digest(stream, "sha256").hexdigest()
            job.require(process.create_time() == before and abs(before - datetime.datetime.fromisoformat(row["start"].replace("Z", "+00:00")).timestamp()) < 0.00001,
                        "NATIVE_PROCESS_PID_REUSED")
        processes[str(pid)] = record
    # Refresh exact creation tokens after all CWD/script reads, including the
    # Desktop app ancestor. A recycled or vanished recorded PID fails closed.
    again = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", PROCESS_COMMAND],
                           capture_output=True, text=True, check=True, timeout=30)
    second = json.loads(again.stdout)
    starts = {str(row["ProcessId"]): row["start"] for row in second["processes"]}
    relevant = {key for key, record in processes.items() if record["name"].lower() in ("python.exe", "pythonw.exe") or record["name"] == "Comfy Desktop.exe"}
    for key in relevant:
        processes[key]["startAfter"] = starts.get(key)
    listener_order = lambda item: (item["port"], item["address"], item["pid"], item["processStart"])
    job.require(sorted(second["listeners"], key=listener_order) == sorted(inventory["listeners"], key=listener_order),
                "NATIVE_COMFY_LISTENER_CHANGED")
    instances = proven_comfy(processes, inventory["listeners"])
    gpu = subprocess.run(["nvidia-smi", "--query-gpu=memory.free,utilization.gpu", "--format=csv,noheader,nounits"],
                         capture_output=True, text=True, check=True, timeout=30)
    values = [[int(x.strip()) for x in row.split(",")] for row in gpu.stdout.strip().splitlines()]
    job.require(len(values) == 1 and len(values[0]) == 2, "NATIVE_GPU_INVENTORY")
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs): raise ValueError("NATIVE_QUEUE_REDIRECT")
    opener = urllib.request.build_opener(NoRedirect())
    queues, stats = {}, {}
    for port in (8188, 8189):
        with opener.open(f"http://127.0.0.1:{port}/queue", timeout=15) as response:
            queues[str(port)] = job.parse(response.read(1024 * 1024 + 1))
        if port == 8188:
            with opener.open("http://127.0.0.1:8188/system_stats", timeout=15) as response:
                system = job.parse(response.read(1024 * 1024 + 1))["system"]
                stats["8188"] = {"pid": system.get("pid"), "argv": system["argv"]}
    after = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", PROCESS_COMMAND],
                           capture_output=True, text=True, check=True, timeout=30)
    final = json.loads(after.stdout)
    final_starts = {str(row["ProcessId"]): row["start"] for row in final["processes"]}
    for key in relevant:
        processes[key]["startAfter"] = final_starts.get(key)
    job.require(sorted(final["listeners"], key=listener_order) == sorted(inventory["listeners"], key=listener_order) and
                {(str(row["ProcessId"]), row["start"]) for row in final["processes"] if row["Name"].lower() in ("python.exe", "pythonw.exe")} ==
                {(key, processes[key]["start"]) for key in relevant if processes[key]["name"].lower() in ("python.exe", "pythonw.exe")},
                "NATIVE_PROCESS_INVENTORY_CHANGED")
    # These separate OS/HTTP reads are instantaneous observations, not an
    # atomic lock against new Comfy work or unrelated GPU users after return.
    proof = {"schema": "native-moss-host-process-proof.v2", "processInventoryComplete": True, "processes": processes,
             "listeners": inventory["listeners"], "freeMiB": values[0][0], "utilization": values[0][1],
             "queue": queues["8188"], "queues": queues, "systemStats": stats, "provenComfyInstances": instances}
    validate_process_proof(proof)
    return proof


def admit(proof, root, pid):
    allowed = validate_process_proof(proof)
    job.require(proof.get("processInventoryComplete") is True and type(proof.get("processes")) is dict,
                "NATIVE_PROCESS_INVENTORY")
    own = proof["processes"].get(str(pid))
    if own is None or not START.fullmatch(own["start"]):
        raise ValueError("NATIVE_OWN_PROCESS_START")
    job.require(not (root / "gpu-lease.json").exists() and not (root / "gpu-lease.json").is_symlink(), "NATIVE_LEASE_BUSY")
    for target in root.iterdir():
        if target.is_dir() and (target / "config.json").exists():
            job.require((target / "lease-release.json").is_file(), "NATIVE_PRIOR_JOB_UNCERTAIN")
    for key, process in proof["processes"].items():
        if key == str(pid) or process["name"].lower() not in ("python.exe", "pythonw.exe"):
            continue
        command = process.get("command")
        job.require(type(command) is str, "NATIVE_PROCESS_COMMAND_UNKNOWN")
        job.require((key, process["start"]) in allowed, "NATIVE_COMPETING_PYTHON")
    queue = proof["queue"]
    job.require(type(queue.get("queue_running")) is list and type(queue.get("queue_pending")) is list and
                not queue["queue_running"] and not queue["queue_pending"] and
                proof["freeMiB"] >= 8192 and proof["utilization"] <= 5, "NATIVE_GPU_NOT_IDLE")
    return own["start"]


def verify_owned(request, lease, root=job.ROOT):
    canonical(root)
    path = root / "gpu-lease.json"
    job.require(path.is_file() and not linked(path), "NATIVE_LEASE_BUSY")
    current = job.parse(path.read_bytes())
    job.require(current == lease and current["requestId"] == request["requestId"] and current["nonce"] == request["nonce"],
                "NATIVE_LEASE_CHANGED")
    proof = probe()
    own = proof["processes"].get(str(os.getpid()))
    job.require(own is not None and own["start"] == current["processStart"] and current["pid"] == os.getpid(),
                "NATIVE_OWN_PROCESS_START")


def reserve(request, root=job.ROOT, *, host=probe, validate=canonical, pid=None):
    validate(root)
    pid = os.getpid() if pid is None else pid
    proof = host()
    start = admit(proof, root, pid)
    lease = {"schema": "native-moss-gpu-lease.v1", "requestId": request["requestId"], "nonce": request["nonce"],
             "pid": pid, "processStart": start, "state": "ACTIVE", "scope": "native-through-alpha",
             "acquiredAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    job.exclusive(root / "gpu-lease.json", json.dumps(lease).encode())
    return lease


def readiness(root=job.ROOT):
    try:
        canonical(root)
        proof = probe()
        admit(proof, root, os.getpid())
        return {"ready": True, "proof": proof, "canonicalRoot": str(root.resolve())}
    except Exception:
        return {"ready": False, "reason": "NATIVE_HOST_PROOF_NOT_READY"}


def private_roots(root):
    job.require(root.is_dir() and job.STAGED_WORKER.is_dir(), "NATIVE_ROOT_NOT_PROVISIONED")
    canonical(root)
    worker = job.STAGED_WORKER
    job.require(worker.resolve() == CANONICAL_TRAINING / worker.name and not linked(worker) and
                job.HERE.resolve() == worker.resolve(), "NATIVE_PRIVATE_WORKER_ROOT")
    # ACL access is read-only. Reject broad writable grants and unowned roots;
    # do not modify inheritance/ownership from a connect/readiness operation.
    script = "$ErrorActionPreference='Stop';$me=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;$paths=@('E:/git/linalab/PNGAL/environment/training/recovery16-workbench-jobs-v1','E:/git/linalab/PNGAL/environment/training/recovery16-workbench-worker-v1');$r=@();foreach($p in $paths){$a=Get-Acl -LiteralPath $p;$owner=([Security.Principal.NTAccount]$a.Owner).Translate([Security.Principal.SecurityIdentifier]).Value;$rules=@($a.Access | ForEach-Object { @{sid=$_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value;allow=($_.AccessControlType -eq 'Allow');rights=[int]$_.FileSystemRights} });$r+=@{path=$p;owner=$owner;current=$me;protected=$a.AreAccessRulesProtected;rules=$rules}};$r | ConvertTo-Json -Depth 6 -Compress"
    output = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
                            capture_output=True, text=True, check=True, timeout=30)
    rows = json.loads(output.stdout)
    job.require(type(rows) is list and len(rows) == 2, "NATIVE_PRIVATE_ACL_UNKNOWN")
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("NATIVE_PRIVATE_ACL_UNKNOWN")
        permitted = {row["current"], "S-1-5-18", "S-1-5-32-544"}
        job.require(row["owner"] in permitted and row["protected"] is True, "NATIVE_PRIVATE_ACL_NOT_PROTECTED")
        # WriteData/AppendData/WriteEA/WriteAttributes/Delete/DeleteChild/
        # ChangePermissions/TakeOwnership all permit integrity changes.
        write_mask = 2 | 4 | 16 | 256 | 65536 | 64 | 262144 | 524288
        job.require(all(not (rule["allow"] and rule["rights"] & write_mask and rule["sid"] not in permitted)
                        for rule in row["rules"]), "NATIVE_PRIVATE_ACL_WRITABLE")
    return {"canonicalRoot": str(root.resolve()), "workerRoot": str(worker.resolve()), "aclProtected": True}


def installed_pins():
    import runtime
    import native_runner_v1 as native
    import reference_pipeline_recipes as reference
    import context_v1 as context
    config = runtime.CONFIG
    toolkit = pathlib.Path(config["toolkit"])
    head = subprocess.check_output(["git", "-C", str(toolkit), "rev-parse", "HEAD"], text=True, timeout=30).strip()
    job.require(head == native.COMMIT, "NATIVE_TRAINER_REVISION")
    for rel, pin in {**native.SOURCE_PINS, **reference.SOURCE_PINS}.items():
        job.require(native.digest(toolkit / rel) == pin, "NATIVE_INSTALLED_SOURCE_PIN")
    for role, pin in {**native.PINS, "adapter": config["adapter_sha256"], "terminal_receipt": runtime.TERMINAL}.items():
        job.require(native.digest(config[role]) == pin, "NATIVE_INSTALLED_ASSET_PIN")
    job.require(pathlib.Path(config["adapter"]).stat().st_size == 148697488, "NATIVE_ADAPTER_SIZE")
    terminal = job.parse(pathlib.Path(config["terminal_receipt"]).read_bytes())
    job.require(terminal["state"] == "completed" and terminal["exitCode"] == 0 and terminal["steps"] == 1600 and
                terminal["adapter"]["sha256"] == config["adapter_sha256"], "NATIVE_TRAINING_TERMINAL")
    for name, pin in context.TOKENIZER_PINS.items():
        job.require(native.digest(pathlib.Path(runtime.TOKENIZER) / name) == pin, "NATIVE_TOKENIZER_PIN")
    job.require(pathlib.Path(runtime.BUN).is_file(), "NATIVE_BUN_MISSING")
    return {"trainerCommit": head, "modelPins": native.PINS, "adapterSHA256": config["adapter_sha256"],
            "terminalReceiptSHA256": runtime.TERMINAL, "tokenizerPins": context.TOKENIZER_PINS}


def dependencies():
    import runtime
    # Isolated CPU-only tokenizer import. No native model module import,
    # downloads, tensors, warmup, or model-weight loading. Disclose torch import.
    code = "import importlib.util,json,sys; names=['torch','safetensors','PIL','numpy','scipy','transformers','accelerate','diffusers','peft']; missing=[n for n in names if importlib.util.find_spec(n) is None]; assert not missing,missing; from transformers import Qwen2Tokenizer; t=Qwen2Tokenizer.from_pretrained(" + repr(runtime.TOKENIZER) + ",local_files_only=True); ids=t(t.apply_chat_template([{'role':'user','content':'readiness'}],tokenize=False,add_generation_prompt=True,enable_thinking=True),truncation=False)['input_ids']; print(json.dumps({'offlineTokenizer':True,'tokens':len(ids),'torchImported':'torch' in sys.modules,'modelLoaded':False}))"
    env = {**os.environ, "CUDA_VISIBLE_DEVICES": "", "USE_TORCH": "0", "USE_TF": "0", "USE_FLAX": "0",
           "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"}
    try:
        result = subprocess.run([sys.executable, "-B", "-c", code], env=env, capture_output=True,
                                text=True, encoding="utf-8", timeout=90, check=True)
        proof = job.parse(result.stdout.encode())
        job.require(proof["offlineTokenizer"] is True and proof["modelLoaded"] is False and
                    type(proof["tokens"]) is int and 0 < proof["tokens"] <= 4096, "NATIVE_DEPENDENCY_PROOF")
        return proof
    except (subprocess.SubprocessError, ValueError, KeyError):
        raise ValueError("NATIVE_DEPENDENCY_UNAVAILABLE")


def qualify(manifest, root=job.ROOT):
    """Qualification performs no writes; callers cannot select any host paths."""
    try:
        job.require(manifest.get("profileDigest") == job.PROFILE_DIGEST, "NATIVE_PROFILE_DIGEST")
        from runtime import InstalledRuntime
        InstalledRuntime().verify_bundle(manifest)
        job.require("lifecycle.py" in manifest["files"], "NATIVE_LIFECYCLE_MISSING")
        lifecycle_source = (job.HERE / "lifecycle.py").read_bytes()
        job.require(job.sha(lifecycle_source) == manifest["files"]["lifecycle.py"]["sha256"], "NATIVE_LIFECYCLE_PIN")
        tree = ast.parse(lifecycle_source)
        job.require(any(isinstance(n, ast.FunctionDef) and n.name == "command" for n in tree.body) and
                    any(isinstance(n, ast.Constant) and n.value == "native-moss-lifecycle-command.v1" for n in ast.walk(tree)),
                    "NATIVE_LIFECYCLE_PROTOCOL")
        roots = private_roots(root)
        pins = installed_pins()
        deps = dependencies()
        proof = probe()
        admit(proof, root, os.getpid())
        import lifecycle
        class QueueSnapshot:
            def request(self, path):
                job.require(path == "/queue", "NATIVE_READINESS_QUERY")
                return proof["queue"]
        phase = lifecycle.command({"schema": "native-moss-lifecycle-command.v1", "operation": "readiness",
                                   "profileDigest": job.PROFILE_DIGEST}, root=root,
                                  expected=CANONICAL_TRAINING / root.name, http=QueueSnapshot(), probe=lambda: proof)
        job.require(phase["ready"] is True, "NATIVE_LIFECYCLE_NOT_READY")
        return {"ready": True, "reason": None, "roots": roots, "pins": pins,
                "dependencies": deps, "hostReadiness": {"ready": True, "proof": proof}, "lifecycleReadiness": phase}
    except Exception as error:
        reason = str(error)
        if not re.fullmatch(r"NATIVE_[A-Z_]+", reason):
            reason = "NATIVE_READINESS_PROOF_UNAVAILABLE"
        return {"ready": False, "reason": reason}
