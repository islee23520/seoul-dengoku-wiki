"""Private alpha lifecycle. No native sampler, SSH, installs, retries or lease stealing."""
import ast
import base64
import io
import json
import os
import pathlib
import subprocess
import sys
from typing import Any
import urllib.parse
import urllib.request

import job

ROOT = job.ROOT
EXPECTED_ROOT = pathlib.Path("D:/AI/environments/PNGAL/training/recovery16-workbench-jobs-v1")
API = "http://127.0.0.1:8188"
HELPER_PIN = "0b0ee4ab58a6b8a5c51b826b3add2a97c350cdccfbdab1b6e1e9cf51f74d6c34"
# Exact reviewed source bytes are inserted below; __main__ is never executed.
HELPER_BASE64 = "IiIiQm91bmRlZCBDUFUgcmVmaW5lbWVudCBvZiBmcm96ZW4gcmVjb3ZlcnkxNiBlZGdlczsgbmV2ZXIgY2hhbmdlcyBhbHBoYS4iIiIKaW1wb3J0IGhhc2hsaWIKaW1wb3J0IGpzb24KZnJvbSBwYXRobGliIGltcG9ydCBQYXRoCgppbXBvcnQgbnVtcHkgYXMgbnAKZnJvbSBQSUwgaW1wb3J0IEltYWdlCmZyb20gc2NpcHkubmRpbWFnZSBpbXBvcnQgZGlzdGFuY2VfdHJhbnNmb3JtX2VkdAoKCmRlZiByZWZpbmUocmdiLCByZ2JhKToKICAgIGFscGhhID0gcmdiYVs6LCA6LCAzXQogICAgbWF0dGUgPSBucC5tZWRpYW4ocmdiWzo0MF0ucmVzaGFwZSgtMSwgMyksIGF4aXM9MCkKICAgIGlud2FyZCA9IG5wLmFzYXJyYXkoZGlzdGFuY2VfdHJhbnNmb3JtX2VkdChhbHBoYSA+IDApKQogICAgc3RhYmxlID0gKGFscGhhID09IDI1NSkgJiAoaW53YXJkID49IDMpCiAgICBkaXN0YW5jZSA9IG5wLmFzYXJyYXkoZGlzdGFuY2VfdHJhbnNmb3JtX2VkdCh+c3RhYmxlKSkKICAgIGluZGljZXMgPSBucC5hc2FycmF5KGRpc3RhbmNlX3RyYW5zZm9ybV9lZHQofnN0YWJsZSwgcmV0dXJuX2Rpc3RhbmNlcz1GYWxzZSwgcmV0dXJuX2luZGljZXM9VHJ1ZSkpCiAgICBkb25vciA9IHJnYltpbmRpY2VzWzBdLCBpbmRpY2VzWzFdXS5hc3R5cGUoZmxvYXQpCiAgICBkaXJlY3Rpb24gPSBkb25vciAtIG1hdHRlCiAgICBub3JtID0gKGRpcmVjdGlvbiAqIGRpcmVjdGlvbikuc3VtKGF4aXM9MikKICAgIGNvdmVyYWdlID0gbnAuY2xpcCgoKHJnYi5hc3R5cGUoZmxvYXQpIC0gbWF0dGUpICogZGlyZWN0aW9uKS5zdW0oYXhpcz0yKQogICAgICAgICAgICAgICAgICAgICAgIC8gbnAubWF4aW11bShub3JtLCAxKSwgMCwgMSkKICAgIHJlc2lkdWFsID0gbnAubWF4KG5wLmFicyhyZ2IuYXN0eXBlKGZsb2F0KSAtIG1hdHRlCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIGNvdmVyYWdlWzosIDosIE5vbmVdICogZGlyZWN0aW9uKSwgYXhpcz0yKQogICAgZWxpZ2libGUgPSAoKGFscGhhID4gMCkgJiAoYWxwaGEgPCAyNTUpICYgKGRpc3RhbmNlIDw9IDYpCiAgICAgICAgICAgICAgICAmIChub3JtID4gNjAgKiogMikgJiAocmVzaWR1YWwgPD0gMTIpICYgKGNvdmVyYWdlIDwgMC45OCkpCiAgICBvdXRwdXQgPSByZ2JhLmNvcHkoKQogICAgb3V0cHV0WzosIDosIDozXVtlbGlnaWJsZV0gPSBucC5yb3VuZChkb25vcltlbGlnaWJsZV0pLmFzdHlwZShucC51aW50OCkKICAgIHJldHVybiBvdXRwdXQsIGVsaWdpYmxlLCBtYXR0ZQoKCmRlZiB2ZXJpZnkocmdiLCBiZWZvcmUsIGFmdGVyLCBlbGlnaWJsZSk6CiAgICBhc3NlcnQgbnAuYXJyYXlfZXF1YWwoYmVmb3JlWzosIDosIDNdLCBhZnRlcls6LCA6LCAzXSkKICAgIGFzc2VydCBucC5hcnJheV9lcXVhbChiZWZvcmVbYmVmb3JlWzosIDosIDNdID09IDI1NV0sIGFmdGVyW2JlZm9yZVs6LCA6LCAzXSA9PSAyNTVdKQogICAgYXNzZXJ0IG5wLmFycmF5X2VxdWFsKGJlZm9yZVt+ZWxpZ2libGVdLCBhZnRlclt+ZWxpZ2libGVdKQogICAgYXNzZXJ0IG5wLmFsbChhZnRlclthZnRlcls6LCA6LCAzXSA9PSAwLCA6M10gPT0gMCkKICAgIGVkZ2UgPSAoYmVmb3JlWzosIDosIDNdID4gMCkgJiAobnAuYXNhcnJheShkaXN0YW5jZV90cmFuc2Zvcm1fZWR0KGJlZm9yZVs6LCA6LCAzXSA+IDApKSA8PSAyKQogICAgcGFsZV9iZWZvcmUgPSBlZGdlICYgKHJnYi5taW4oYXhpcz0yKSA+IDE0MCkgJiAocmdiLm1heChheGlzPTIpIC0gcmdiLm1pbihheGlzPTIpIDwgMzApCiAgICBwYWxlX2FmdGVyID0gZWRnZSAmIChhZnRlcls6LCA6LCA6M10ubWluKGF4aXM9MikgPiAxNDApICYgKGFmdGVyWzosIDosIDozXS5tYXgoYXhpcz0yKSAtIGFmdGVyWzosIDosIDozXS5taW4oYXhpcz0yKSA8IDMwKQogICAgYXNzZXJ0IHBhbGVfYWZ0ZXIuc3VtKCkgPCBwYWxlX2JlZm9yZS5zdW0oKSAqIDAuNAogICAgcmV0dXJuIHsncGFsZU5lYXJFZGdlQmVmb3JlJzogaW50KHBhbGVfYmVmb3JlLnN1bSgpKSwgJ3BhbGVOZWFyRWRnZUFmdGVyJzogaW50KHBhbGVfYWZ0ZXIuc3VtKCkpLAogICAgICAgICAgICAnY2hhbmdlZFJHQlBpeGVscyc6IGludChucC5hbnkoYmVmb3JlWzosIDosIDozXSAhPSBhZnRlcls6LCA6LCA6M10sIGF4aXM9Mikuc3VtKCkpLAogICAgICAgICAgICAnYWxwaGFJZGVudGljYWwnOiBUcnVlLCAnYWxsT3BhcXVlUGl4ZWxzSWRlbnRpY2FsJzogVHJ1ZSwgJ291dHNpZGVFbGlnaWJsZUlkZW50aWNhbCc6IFRydWV9CgoKaWYgX19uYW1lX18gPT0gJ19fbWFpbl9fJzoKICAgIHJvb3QgPSBQYXRoKF9fZmlsZV9fKS5yZXNvbHZlKCkucGFyZW50c1szXQogICAgc291cmNlID0gUGF0aCgnL1VzZXJzL2lsc2VvYmxlZS93b3Jrc3BhY2Uvc2VvdWwtZGVuZ29rdS10b29scy9BUlQtQVNTRVRTL3BvcnRyYWl0LXRyYWluaW5nL3JlY292ZXJ5MTYtbmF0aXZlLWdlbmVyYXRlZC12MScpCiAgICB0YXJnZXQgPSByb290IC8gJ0FSVC1BU1NFVFMvcG9ydHJhaXQtdHJhaW5pbmcvcmVjb3ZlcnkxNi1hbHBoYS1yZWZpbmVtZW50LXYxJwogICAgdGFyZ2V0Lm1rZGlyKHBhcmVudHM9VHJ1ZSwgZXhpc3Rfb2s9VHJ1ZSkKICAgIG9yaWdpbmFsX21hbmlmZXN0ID0ganNvbi5sb2Fkcygoc291cmNlIC8gJ21hbmlmZXN0Lmpzb24nKS5yZWFkX3RleHQoKSkKICAgIHBpbnMgPSB7cm93WydwYXRoJ106IHJvd1snc2hhMjU2J10gZm9yIHJvdyBpbiBvcmlnaW5hbF9tYW5pZmVzdFsnZmlsZXMnXX0KICAgIHJlY29yZHMgPSBbXQogICAgZm9yIHBlcnNvbiBpbiBbJ3BlcnNvbi0xMDA4JywgJ3BlcnNvbi0xMDA0J106CiAgICAgICAgcmdiX3BhdGggPSBzb3VyY2UgLyBmJ3twZXJzb259LTM0MHg1MTAtUkdCLnBuZycKICAgICAgICByZ2JhX3BhdGggPSBzb3VyY2UgLyBmJ3twZXJzb259LTM0MHg1MTAtUkdCQS5wbmcnCiAgICAgICAgZm9yIHBhdGggaW4gW3JnYl9wYXRoLCByZ2JhX3BhdGhdOgogICAgICAgICAgICBhc3NlcnQgaGFzaGxpYi5zaGEyNTYocGF0aC5yZWFkX2J5dGVzKCkpLmhleGRpZ2VzdCgpID09IHBpbnNbcGF0aC5uYW1lXQogICAgICAgIHJnYiA9IG5wLmFycmF5KEltYWdlLm9wZW4ocmdiX3BhdGgpLmNvbnZlcnQoJ1JHQicpKQogICAgICAgIGJlZm9yZSA9IG5wLmFycmF5KEltYWdlLm9wZW4ocmdiYV9wYXRoKS5jb252ZXJ0KCdSR0JBJykpCiAgICAgICAgYWZ0ZXIsIGVsaWdpYmxlLCBtYXR0ZSA9IHJlZmluZShyZ2IsIGJlZm9yZSkKICAgICAgICBjaGVja3MgPSB2ZXJpZnkocmdiLCBiZWZvcmUsIGFmdGVyLCBlbGlnaWJsZSkKICAgICAgICBvdXRwdXQgPSB0YXJnZXQgLyBmJ3twZXJzb259LWRlZnJpbmdlZC5wbmcnCiAgICAgICAgYXNzZXJ0IG5vdCBvdXRwdXQuZXhpc3RzKCkKICAgICAgICBJbWFnZS5mcm9tYXJyYXkoYWZ0ZXIpLnNhdmUob3V0cHV0KQogICAgICAgIHNoZWV0ID0gSW1hZ2UubmV3KCdSR0InLCAoMTAyMCwgNTEwKSkKICAgICAgICBmb3IgaW5kZXgsIGJhY2tncm91bmQgaW4gZW51bWVyYXRlKFsoMCwgMCwgMCksICgyNTUsIDI1NSwgMjU1KSwgKDM1LCAxMDUsIDE1NSldKToKICAgICAgICAgICAgdmlldyA9IEltYWdlLm5ldygnUkdCQScsICgzNDAsIDUxMCksIGJhY2tncm91bmQgKyAoMjU1LCkpCiAgICAgICAgICAgIHZpZXcuYWxwaGFfY29tcG9zaXRlKEltYWdlLmZyb21hcnJheShhZnRlcikpCiAgICAgICAgICAgIHNoZWV0LnBhc3RlKHZpZXcuY29udmVydCgnUkdCJyksIChpbmRleCAqIDM0MCwgMCkpCiAgICAgICAgc2hlZXQuc2F2ZSh0YXJnZXQgLyBmJ3twZXJzb259LWNvbXBvc2l0ZXMucG5nJykKICAgICAgICB6b29tID0gc2hlZXQuY3JvcCgoNTAsIDYwLCAzMDAsIDI5MCkpLnJlc2l6ZSgoNzUwLCA2OTApLCBJbWFnZS5SZXNhbXBsaW5nLk5FQVJFU1QpCiAgICAgICAgem9vbS5zYXZlKHRhcmdldCAvIGYne3BlcnNvbn0taGFpci16b29tLnBuZycpCiAgICAgICAgcmVjb3Jkcy5hcHBlbmQoeydwZXJzb25JZCc6IHBlcnNvbiwgJ3NvdXJjZVJHQic6IHN0cihyZ2JfcGF0aCksICdzb3VyY2VSR0JBJzogc3RyKHJnYmFfcGF0aCksCiAgICAgICAgICAgICAgICAgICAgICAgICdzb3VyY2VSR0JTSEEyNTYnOiBwaW5zW3JnYl9wYXRoLm5hbWVdLCAnc291cmNlUkdCQVNIQTI1Nic6IHBpbnNbcmdiYV9wYXRoLm5hbWVdLAogICAgICAgICAgICAgICAgICAgICAgICAnb3V0cHV0Jzogc3RyKG91dHB1dCksICdvdXRwdXRTSEEyNTYnOiBoYXNobGliLnNoYTI1NihvdXRwdXQucmVhZF9ieXRlcygpKS5oZXhkaWdlc3QoKSwKICAgICAgICAgICAgICAgICAgICAgICAgJ21hdHRlRXN0aW1hdGUnOiBtYXR0ZS50b2xpc3QoKSwgJ2NoZWNrcyc6IGNoZWNrc30pCiAgICBwcmludChqc29uLmR1bXBzKHJlY29yZHMpKQo="


def read(path, limit=32 * 1024 * 1024):
    job.require(path.is_file() and not linked(path) and path.stat().st_size <= limit, "LIFECYCLE_FILE")
    return path.read_bytes()


def linked(path):
    return path.is_symlink() or bool(getattr(path.lstat(), "st_file_attributes", 0) & 0x400)


def emit(path, value):
    job.exclusive(path, json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode())


def host_probe():
    job.require(os.name == "nt", "LIFECYCLE_WINDOWS_PROOF_UNAVAILABLE")
    script = "Get-CimInstance Win32_Process | Select-Object ProcessId,Name,@{N='start';E={$_.CreationDate.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Compress"
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script],
                            capture_output=True, text=True, check=True, timeout=30)
    processes: Any = json.loads(result.stdout)
    if not isinstance(processes, list):
        raise ValueError("LIFECYCLE_PROCESS_PROOF")
    inventory = {}
    for record in processes:
        if not isinstance(record, dict) or not record.get("start") or not record.get("Name"):
            raise ValueError("LIFECYCLE_PROCESS_PROOF")
        inventory[str(record["ProcessId"])] = {"start": record["start"], "name": record["Name"]}
    gpu = subprocess.run(["nvidia-smi", "--query-gpu=memory.free,utilization.gpu", "--format=csv,noheader,nounits"],
                         capture_output=True, text=True, check=True, timeout=30)
    values = [[int(x.strip()) for x in row.split(",")] for row in gpu.stdout.strip().splitlines()]
    job.require(len(values) == 1, "LIFECYCLE_GPU_INVENTORY")
    return {"processInventoryComplete": True,
            "processes": inventory,
            "freeMiB": values[0][0], "utilization": values[0][1]}


class Http:
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            raise ValueError("LIFECYCLE_REDIRECT")

    def __init__(self):
        self.opener = urllib.request.build_opener(self.NoRedirect())

    def request(self, path, data=None, content="application/json"):
        req = urllib.request.Request(API + path, data=data, headers={"Content-Type": content})
        with self.opener.open(req, timeout=60) as response:
            raw = response.read(8 * 1024 * 1024 + 1)
        job.require(len(raw) <= 8 * 1024 * 1024, "LIFECYCLE_HTTP_SIZE")
        return raw if path.startswith("/view?") else job.parse(raw)


def graph(image, request):
    def node(kind, **inputs):
        return {"class_type": kind, "inputs": inputs}
    return {
        "8": node("LoadImage", image=image),
        "20": node("LoadBackgroundRemovalModel", bg_removal_name="birefnet.safetensors"),
        "21": node("RemoveBackground", bg_removal_model=["20", 0], image=["8", 0]),
        "22": node("ThresholdMask", mask=["21", 0], value=254/255),
        "23": node("MaskComposite", destination=["21", 0], source=["22", 0], x=0, y=0, operation="add"),
        "24": node("InvertMask", mask=["23", 0]),
        "25": node("ThresholdMask", mask=["21", 0], value=1/255),
        "26": node("EmptyImage", width=352, height=512, batch_size=1, color=0),
        "30": node("ImageCompositeMasked", destination=["26", 0], source=["8", 0], mask=["25", 0], x=0, y=0, resize_source=False),
        "27": node("JoinImageWithAlpha", image=["30", 0], alpha=["24", 0]),
        "28": node("MaskToImage", mask=["23", 0]),
        "29": node("MaskToImage", mask=["21", 0]),
        "9": node("SaveImage", images=["27", 0], filename_prefix="portal_native_alpha/" + request + "_finished"),
        "11": node("SaveImage", images=["28", 0], filename_prefix="portal_native_alpha/" + request + "_mask"),
        "15": node("SaveImage", images=["29", 0], filename_prefix="portal_native_alpha/" + request + "_rawmask"),
    }


def verify_graph(value, image, request):
    job.require(value == graph(image, request), "LIFECYCLE_ALPHA_GRAPH")


def bound(frame, root, expected):
    job.closed(frame, "schema operation profileDigest requestId nonce ownerBindingHash envelopeSHA256 bundleSHA256 ownerPid ownerStart")
    job.require(frame["schema"] == "native-moss-lifecycle-command.v1" and frame["profileDigest"] == job.PROFILE_DIGEST,
                "LIFECYCLE_PROFILE")
    job.identity(frame["requestId"])
    job.identity(frame["nonce"])
    job.require(type(frame["ownerPid"]) is int and frame["ownerPid"] > 0 and
                type(frame["ownerStart"]) is str and bool(frame["ownerStart"]), "LIFECYCLE_PROCESS_BINDING")
    job.require(root.is_dir() and root.resolve() == expected.resolve(), "LIFECYCLE_CANONICAL_ROOT")
    target = root / frame["requestId"]
    job.require(target.is_dir() and not linked(target), "LIFECYCLE_JOB_PATH")
    for child in target.rglob("*"):
        job.require(not linked(child) and child.resolve().is_relative_to(expected.resolve()), "LIFECYCLE_DESCENDANT_REPARSE")
    manifest = job.parse(read(job.HERE / "manifest.json"))
    from runtime import InstalledRuntime
    InstalledRuntime().verify_bundle(manifest)
    job.require(frame["bundleSHA256"] == manifest["implementationSHA256"], "LIFECYCLE_BUNDLE")
    config = read(target / "config.json")
    job.require(job.sha(config) == frame["envelopeSHA256"], "LIFECYCLE_CONFIG")
    native = job.parse(read(target / "status.json"))
    for key in ("requestId", "nonce", "ownerBindingHash", "profileDigest", "envelopeSHA256", "bundleSHA256"):
        job.require(native.get(key) == frame[key], "LIFECYCLE_NATIVE_BINDING")
    job.require(native.get("schema") == "native-moss-native-phase.v1" and
                native.get("state") == "NATIVE_COMPLETE_ALPHA_PENDING" and
                native["native"].get("noMerge") is True and native["native"].get("loadedValuesVerified") is True and
                native["native"].get("nativeTensorCount") == 336, "LIFECYCLE_NATIVE_PROOF")
    preflight_bytes = read(target / "preflight.json", 8 * 1024 * 1024)
    job.require(type(native.get("preflightSize")) is int and native["preflightSize"] == len(preflight_bytes) and
                native.get("preflightSHA256") == job.sha(preflight_bytes), "LIFECYCLE_PREFLIGHT_HASH")
    preflight = job.parse(preflight_bytes)
    request, retained, token, _ = job.validate(config, manifest)
    job.verify_preflight(request, preflight, retained, token)
    observed = preflight["hostLease"]
    job.require(observed.get("requestId") == frame["requestId"] and observed.get("nonce") == frame["nonce"] and
                observed.get("state") == "ACTIVE" and observed.get("scope") == "native-through-alpha" and
                type(observed.get("pid")) is int and observed["pid"] == frame["ownerPid"] == native["native"].get("pid") and
                observed.get("processStart") == frame["ownerStart"] == native["native"].get("processStart") and
                native["native"].get("phaseOutcome") == "RETURNED_SUCCESSFULLY" and "exitCode" not in native["native"] and
                native["native"].get("terminalReceiptSHA256") == preflight["terminalReceiptSHA256"] and
                native["native"].get("runtimeAttestation") == preflight["runtimeAttestation"] and
                native.get("context") == preflight["context"], "LIFECYCLE_PREFLIGHT_BINDING")
    for name, key in (("raw.png", "rawSHA256"), ("crop-RGB.png", "cropSHA256")):
        job.require(job.sha(read(target / "output" / name)) == native["native"][key], "LIFECYCLE_NATIVE_ARTIFACT")
    return target, native


def ownership(frame, root, proof, absent=False):
    lease = job.parse(read(root / "gpu-lease.json", 65536))
    job.require(lease.get("requestId") == frame["requestId"] and lease.get("nonce") == frame["nonce"] and
                lease.get("pid") == frame["ownerPid"] and lease.get("processStart") == frame["ownerStart"] and
                lease.get("state") == "ACTIVE" and lease.get("scope") == "native-through-alpha", "LIFECYCLE_LEASE_BUSY")
    job.require(type(proof.get("processes")) is dict and proof.get("processInventoryComplete") is True,
                "LIFECYCLE_PROCESS_PROOF")
    process = proof["processes"].get(str(frame["ownerPid"]))
    job.require(process is None if absent else process is None or process["start"] == frame["ownerStart"], "LIFECYCLE_PID_REUSED")
    return lease


def terminal(target, frame):
    receipt = job.parse(read(target / "execution.json"))
    job.require(receipt.get("schema") == "native-moss-execution.v1" and receipt.get("state") == "HOLD" and
                receipt.get("qualityQualified") is False and receipt.get("alphaFinished") is True, "LIFECYCLE_TERMINAL")
    for key in ("requestId", "nonce", "ownerBindingHash", "profileDigest", "envelopeSHA256", "bundleSHA256"):
        job.require(receipt.get(key) == frame[key], "LIFECYCLE_TERMINAL_BINDING")
    native = job.parse(read(target / "status.json"))
    proof = job.parse(read(target / "preflight.json", 8 * 1024 * 1024))
    attestation = proof["runtimeAttestation"]
    job.require(receipt.get("preflightSHA256") == native["preflightSHA256"] and
                receipt.get("preflightSize") == native["preflightSize"] and
                receipt.get("terminalReceiptSHA256") == proof["terminalReceiptSHA256"] and
                receipt.get("contextInputSHA256") == attestation["contextInputSHA256"] and
                receipt.get("contextResponseSHA256") == attestation["contextResponseSHA256"] and
                receipt.get("phaseOutcome") == "RETURNED_SUCCESSFULLY" and
                receipt.get("ownerProcess") == {"pid": frame["ownerPid"], "start": frame["ownerStart"]}, "LIFECYCLE_TERMINAL_PROOF")
    job.require(job.sha(read(target / "output" / "final-RGBA.png")) == receipt["finalSHA256"], "LIFECYCLE_FINAL_HASH")
    job.require(job.sha(read(target / "alpha-history.json")) == receipt["alphaHistorySHA256"] and
                job.sha(read(target / "alpha-graph.json")) == receipt["alphaGraphSHA256"], "LIFECYCLE_TERMINAL_CHAIN")
    for name, key in (("alpha352.png", "alphaSHA256"), ("mask352.png", "maskSHA256"), ("rawmask352.png", "rawmaskSHA256")):
        job.require(job.sha(read(target / "output" / name)) == receipt[key], "LIFECYCLE_TERMINAL_CHAIN")
    return receipt


FINAL_ARTIFACTS = (
    "config.json", "status.json", "execution.json", "preflight.json",
    "alpha-graph.json", "alpha-history.json", "alpha-submitted.json",
    "output/raw.png", "output/crop-RGB.png", "output/alpha352.png",
    "output/mask352.png", "output/rawmask352.png", "output/final-RGBA.png",
)


def collect_artifacts(frame, root, expected):
    """Read only retained final files; never consult host liveness or launch."""
    try:
        target, native = bound(frame, root, expected)
        receipt = terminal(target, frame)
        lease_path = root / "gpu-lease.json"
        if lease_path.exists() or lease_path.is_symlink():
            lease = job.parse(read(lease_path, 65536))
            job.require(lease.get("requestId") == frame["requestId"] and lease.get("nonce") == frame["nonce"] and
                        lease.get("pid") == frame["ownerPid"] and lease.get("processStart") == frame["ownerStart"] and
                        lease.get("state") == "ACTIVE" and lease.get("scope") == "native-through-alpha", "LIFECYCLE_LEASE_BUSY")
        else:
            release = job.parse(read(target / "lease-release.json", 65536))
            job.require(release == {"requestId": frame["requestId"], "nonce": frame["nonce"],
                                   "ownerPid": frame["ownerPid"], "ownerStart": frame["ownerStart"]}, "LIFECYCLE_RELEASE_BINDING")
        artifacts = []
        total = 0
        raw_files = {}
        for name in FINAL_ARTIFACTS:
            path = target / name
            job.require(path.resolve().is_relative_to(target.resolve()), "LIFECYCLE_ARTIFACT_ESCAPE")
            limit = 8 * 1024 * 1024 if name.startswith("output/") or name == "preflight.json" else 2 * 1024 * 1024
            raw = read(path, limit)
            total += len(raw)
            job.require(total <= 32 * 1024 * 1024, "LIFECYCLE_ARTIFACT_TOTAL")
            raw_files[name] = raw
            artifacts.append({"name": name, "size": len(raw), "sha256": job.sha(raw),
                              "byteBase64": base64.b64encode(raw).decode("ascii")})
        # Verify the same buffers being returned, not only earlier file reads.
        job.require(job.sha(raw_files["config.json"]) == frame["envelopeSHA256"] and
                    job.sha(raw_files["preflight.json"]) == native["preflightSHA256"] and
                    len(raw_files["preflight.json"]) == native["preflightSize"] and
                    job.parse(raw_files["status.json"]) == native and job.parse(raw_files["execution.json"]) == receipt,
                    "LIFECYCLE_ARTIFACT_SNAPSHOT")
        checks = {"output/raw.png": native["native"]["rawSHA256"], "output/crop-RGB.png": native["native"]["cropSHA256"],
                  "alpha-graph.json": receipt["alphaGraphSHA256"], "alpha-history.json": receipt["alphaHistorySHA256"],
                  "output/alpha352.png": receipt["alphaSHA256"], "output/mask352.png": receipt["maskSHA256"],
                  "output/rawmask352.png": receipt["rawmaskSHA256"], "output/final-RGBA.png": receipt["finalSHA256"]}
        job.require(all(job.sha(raw_files[name]) == digest for name, digest in checks.items()), "LIFECYCLE_ARTIFACT_HASH")
        submitted = job.parse(raw_files["alpha-submitted.json"])
        value = job.parse(raw_files["alpha-graph.json"])
        history = job.parse(raw_files["alpha-history.json"])
        job.closed(submitted, "promptId image graphSHA256")
        verify_graph(value, submitted["image"], frame["requestId"])
        job.require(submitted["promptId"] == receipt["alphaPromptId"] == history["prompt"][1] and
                    submitted["graphSHA256"] == receipt["alphaGraphSHA256"] and history["prompt"][2] == value and
                    history["status"]["completed"] is True and history["status"]["status_str"] == "success", "LIFECYCLE_ARTIFACT_HISTORY")
        return {"schema": "native-moss-lifecycle-artifacts.v1", "state": "ARTIFACTS", "receipt": receipt, "artifacts": artifacts}
    except (ValueError, KeyError, TypeError, OSError) as error:
        code = str(error)
        if not code.startswith(("LIFECYCLE_", "NATIVE_")) or len(code) > 100:
            code = "LIFECYCLE_ARTIFACTS_UNAVAILABLE"
        return {"schema": "native-moss-lifecycle-artifacts.v1", "state": "NOT_READY", "code": code}


def command(frame, *, root=ROOT, expected=EXPECTED_ROOT, http=None, probe=host_probe):
    operation = frame.get("operation")
    if operation == "readiness":
        job.closed(frame, "schema operation profileDigest")
        job.require(frame["schema"] == "native-moss-lifecycle-command.v1" and frame["profileDigest"] == job.PROFILE_DIGEST,
                    "LIFECYCLE_PROFILE")
        proof = None
        try:
            job.require(root.is_dir() and root.resolve() == expected.resolve(), "LIFECYCLE_CANONICAL_ROOT")
            proof = job.host_proof().probe() if probe is host_probe else probe()
            job.require(proof.get("processInventoryComplete") is True, "LIFECYCLE_PROCESS_PROOF")
            queue = (http or Http()).request("/queue")
            allowed = set()
            if "provenComfyInstances" in proof:
                allowed = job.host_proof().validate_process_proof(proof)
                job.require(queue == proof["queues"]["8188"], "LIFECYCLE_QUEUE_CHANGED")
            busy = any(p["name"].lower() in ("python.exe", "pythonw.exe") and
                       (pid, p["start"]) not in allowed for pid, p in proof["processes"].items() if pid != str(os.getpid()))
            ready = not (root / "gpu-lease.json").exists() and not busy and not queue["queue_running"] and not queue["queue_pending"] and proof["freeMiB"] >= 8192 and proof["utilization"] <= 5
            return {"schema": "native-moss-lifecycle-readiness.v1", "ready": bool(ready), "proof": proof,
                    "modelLoaded": False, "generationDispatched": False}
        except Exception:
            result = {"schema": "native-moss-lifecycle-readiness.v1", "ready": False, "reason": "HOST_PROOF_UNKNOWN",
                      "modelLoaded": False, "generationDispatched": False}
            if proof is not None:
                result["proof"] = proof
            return result
    job.require(operation in ("alpha", "finalize", "reconcile", "release", "readArtifacts"), "LIFECYCLE_OPERATION")
    if operation == "readArtifacts":
        return collect_artifacts(frame, root, expected)
    target, native = bound(frame, root, expected)
    if operation == "reconcile":
        if (target / "execution.json").exists():
            return terminal(target, frame)
        return {"schema": "native-moss-lifecycle-status.v1", "state": "UNKNOWN", "requestId": frame["requestId"], "launchAllowed": False}
    proof = probe()
    ownership(frame, root, proof, absent=operation == "release")
    if operation == "release":
        result = terminal(target, frame)
        emit(target / "lease-release.json", {"requestId": frame["requestId"], "nonce": frame["nonce"], "ownerPid": frame["ownerPid"], "ownerStart": frame["ownerStart"]})
        ownership(frame, root, probe(), absent=True)
        (root / "gpu-lease.json").unlink()
        return {"schema": "native-moss-lifecycle-release.v1", "state": "RELEASED", "finalSHA256": result["finalSHA256"]}
    http = http or Http()
    if operation == "alpha":
        queue = http.request("/queue")
        job.require(not queue["queue_running"] and not queue["queue_pending"] and proof["freeMiB"] >= 8192 and proof["utilization"] <= 5,
                    "LIFECYCLE_GPU_BUSY")
        # Durable intent before any external POST. Never retried after uncertainty.
        emit(target / "alpha-intent.json", {"requestId": frame["requestId"], "nonce": frame["nonce"], "nativeSHA256": native["native"]["rawSHA256"]})
        try:
            boundary = "nativealpha" + frame["nonce"].replace("-", "")
            body = ('--' + boundary + '\r\nContent-Disposition: form-data; name="image"; filename="native-' + frame["requestId"] + '.png"\r\nContent-Type: image/png\r\n\r\n').encode() + read(target / "output" / "raw.png") + ('\r\n--' + boundary + '--\r\n').encode()
            upload = http.request("/upload/image", body, "multipart/form-data; boundary=" + boundary)
            image = "/".join(x for x in (upload.get("subfolder"), upload["name"]) if x)
            job.require(upload.get("type") == "input" and ".." not in image and not image.startswith(("/", "\\")) and "\\" not in image, "LIFECYCLE_UPLOAD")
            value = graph(image, frame["requestId"])
            verify_graph(value, image, frame["requestId"])
            emit(target / "alpha-graph.json", value)
            result = http.request("/prompt", json.dumps({"prompt": value, "client_id": frame["nonce"]}).encode())
            job.identity(result["prompt_id"])
            emit(target / "alpha-submitted.json", {"promptId": result["prompt_id"], "image": image, "graphSHA256": job.sha(read(target / "alpha-graph.json"))})
            return {"schema": "native-moss-alpha-phase.v1", "state": "ALPHA_SUBMITTED", "promptId": result["prompt_id"]}
        except Exception:
            emit(target / "alpha-unknown.json", {"state": "UNKNOWN", "requestId": frame["requestId"]})
            raise
    return finalize(frame, target, native, http)


def finalize(frame, target, native, http):
    import numpy as np
    from PIL import Image
    submitted = job.parse(read(target / "alpha-submitted.json"))
    value = job.parse(read(target / "alpha-graph.json"))
    verify_graph(value, submitted["image"], frame["requestId"])
    job.require(job.sha(read(target / "alpha-graph.json")) == submitted["graphSHA256"], "LIFECYCLE_GRAPH_HASH")
    prompt = submitted["promptId"]
    job.identity(prompt)
    history = http.request("/history/" + prompt)
    job.require(prompt in history, "LIFECYCLE_HISTORY_MISSING")
    entry = history[prompt]
    job.require(entry["status"].get("completed") is True and entry["status"]["status_str"] == "success", "LIFECYCLE_HISTORY_FAILED")
    job.require(entry["prompt"][1] == prompt and entry["prompt"][2] == value, "LIFECYCLE_HISTORY_PROMPT")
    artifacts = {}
    for node in ("9", "11", "15"):
        images = entry["outputs"][node]["images"]
        job.require(len(images) == 1, "LIFECYCLE_OUTPUT_COUNT")
        metadata = images[0]
        job.require(type(metadata) is dict and set(metadata) in
                    ({"filename", "subfolder", "type"}, {"filename", "subfolder", "type", "metadata"}), "LIFECYCLE_OUTPUT_METADATA")
        if "metadata" in metadata:
            details = metadata["metadata"]
            job.require(type(details) is dict and set(details) == {"kind", "width", "height"} and
                        details["kind"] == "image" and type(details["width"]) is int and type(details["height"]) is int and
                        (details["width"], details["height"]) == (352, 512), "LIFECYCLE_OUTPUT_METADATA")
        descriptor = {key: metadata[key] for key in ("filename", "subfolder", "type")}
        filename = descriptor["filename"]
        if not isinstance(filename, str):
            raise ValueError("LIFECYCLE_OUTPUT_METADATA")
        job.require(metadata["type"] == "output" and
                    all(type(v) is str and len(v) <= 255 and ".." not in v and "\\" not in v and not v.startswith("/") for v in descriptor.values()) and
                    metadata["subfolder"] == "portal_native_alpha" and filename.startswith(frame["requestId"] + "_"), "LIFECYCLE_OUTPUT_METADATA")
        artifacts[node] = http.request("/view?" + urllib.parse.urlencode(descriptor))
    def image(raw, mode):
        with Image.open(io.BytesIO(raw)) as opened:
            job.require(opened.size == (352, 512) and opened.mode == mode, "LIFECYCLE_ALPHA_GEOMETRY")
            return np.array(opened)
    raw = image(read(target / "output" / "raw.png"), "RGB")
    before = image(artifacts["9"], "RGBA")
    mask = image(artifacts["11"], "RGB")
    rawmask = image(artifacts["15"], "RGB")
    job.require(np.array_equal(mask[:, :, 0], mask[:, :, 1]) and np.array_equal(mask[:, :, 0], mask[:, :, 2]) and
                np.array_equal(rawmask[:, :, 0], rawmask[:, :, 1]) and np.array_equal(rawmask[:, :, 0], rawmask[:, :, 2]) and
                np.array_equal(before[:, :, 3], mask[:, :, 0]), "LIFECYCLE_ALPHA_MASK_CHAIN")
    # ThresholdMask compares floats with >254/255 before SaveImage quantizes.
    # Byte254 alone cannot distinguish equality/float32 boundary from >threshold.
    # Only that one bin permits 254 or255; every other byte must be identical.
    quantized = rawmask[:, :, 0]
    final_mask = mask[:, :, 0]
    job.require(np.all(np.where(quantized == 254, (final_mask == 254) | (final_mask == 255),
                                final_mask == quantized)), "LIFECYCLE_ALPHA_MASK_CHAIN")
    job.require(np.all(before[before[:, :, 3] == 0, :3] == 0) and
                np.array_equal(before[rawmask[:, :, 0] > 1, :3], raw[rawmask[:, :, 0] > 1]), "LIFECYCLE_ALPHA_RGB_CHAIN")
    rgb = raw[1:511, 6:346]
    with Image.open(io.BytesIO(read(target / "output" / "crop-RGB.png"))) as cropped:
        job.require(cropped.mode == "RGB" and cropped.size == (340, 510) and np.array_equal(np.array(cropped), rgb), "LIFECYCLE_CROP")
    source = base64.b64decode(HELPER_BASE64, validate=True)
    job.require(job.sha(source) == HELPER_PIN, "LIFECYCLE_HELPER_PIN")
    namespace: dict[str, Any] = {"__name__": "private_reviewed_defringe"}
    exec(compile(ast.parse(source), "<pinned-private-defringe>", "exec"), namespace)
    before_crop = before[1:511, 6:346]
    after, eligible, matte = namespace["refine"](rgb, before_crop)
    # Retain the reviewed visual criterion as HOLD metadata, never weaken it.
    try:
        checks = namespace["verify"](rgb, before_crop, after, eligible)
        criterion = "PASS"
    except AssertionError:
        checks, criterion = {}, "FAIL_HOLD"
    job.require(np.array_equal(after[:, :, 3], before_crop[:, :, 3]) and
                np.array_equal(after[~eligible], before_crop[~eligible]) and
                np.array_equal(after[before_crop[:, :, 3] == 255], before_crop[before_crop[:, :, 3] == 255]) and
                np.all(after[after[:, :, 3] == 0, :3] == 0), "LIFECYCLE_DEFRINGE_INVARIANT")
    result = io.BytesIO()
    Image.fromarray(after).save(result, format="PNG")
    job.exclusive(target / "output" / "alpha352.png", artifacts["9"])
    job.exclusive(target / "output" / "mask352.png", artifacts["11"])
    job.exclusive(target / "output" / "rawmask352.png", artifacts["15"])
    job.exclusive(target / "output" / "final-RGBA.png", result.getvalue())
    emit(target / "alpha-history.json", entry)
    receipt = {"schema": "native-moss-execution.v1", **{k: frame[k] for k in
               ("requestId", "nonce", "profileDigest", "ownerBindingHash", "envelopeSHA256", "bundleSHA256")},
               "state": "HOLD", "reviewStatus": "HOLD", "qualityQualified": False, "ownerApproved": False,
               "preflightSHA256": native["preflightSHA256"], "preflightSize": native["preflightSize"],
               "terminalReceiptSHA256": native["native"]["terminalReceiptSHA256"],
               "contextInputSHA256": native["native"]["runtimeAttestation"]["contextInputSHA256"],
               "contextResponseSHA256": native["native"]["runtimeAttestation"]["contextResponseSHA256"],
               "phaseOutcome": "RETURNED_SUCCESSFULLY",
               "alphaFinished": True, "native": native, "alphaPromptId": prompt,
               "alphaGraphSHA256": submitted["graphSHA256"], "alphaHistorySHA256": job.sha(read(target / "alpha-history.json")),
               "alphaSHA256": job.sha(artifacts["9"]), "maskSHA256": job.sha(artifacts["11"]), "rawmaskSHA256": job.sha(artifacts["15"]),
               "finalSHA256": job.sha(result.getvalue()), "cropXYXY": [6, 1, 346, 511], "cropXYWH": [6, 1, 340, 510],
               "ownerProcess": {"pid": frame["ownerPid"], "start": frame["ownerStart"]},
               "lifecycleSHA256": job.sha(read(pathlib.Path(__file__))),
               "defringe": {"helperSHA256": HELPER_PIN, "criterion": criterion, "checks": checks, "matte": matte.tolist(),
                            "alphaIdentical": True, "opaqueIdentical": True, "outsideEligibleIdentical": True, "zeroAlphaRGBBlack": True}}
    emit(target / "execution.json", receipt)
    return receipt


if __name__ == "__main__":
    try:
        job.require(len(sys.argv) == 1, "LIFECYCLE_STDIN_ONLY")
        print(json.dumps(command(job.parse(sys.stdin.buffer.read(job.LIMIT + 1)))), flush=True)
    except Exception as error:
        print(json.dumps({"schema": "native-moss-lifecycle-error.v1", "code": str(error) if str(error).startswith("LIFECYCLE_") else "LIFECYCLE_FAILURE"}), flush=True)
        sys.exit(1)
