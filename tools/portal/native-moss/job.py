"""Private stdin-only native worker. Python retains the host lease through alpha."""
import base64
import hashlib
import importlib.util
import json
import math
import os
import pathlib
import re
import sys
import uuid

HERE = pathlib.Path(__file__).resolve().parent
ROOT = pathlib.Path("E:/git/linalab/PNGAL/environment/training/recovery16-workbench-jobs-v1")
STAGED_WORKER = pathlib.Path("E:/git/linalab/PNGAL/environment/training/recovery16-workbench-worker-v1")
LIMIT = 32 * 1024 * 1024
PROFILE_DIGEST = "1b340aab2d91ca70ed0a6d01cfaa84df1f8194d71e9c0900c6874e1fd844c8c6"
SETTINGS = {"generationProfile": "native340-v1", "size": "340x510", "n": 1,
            "seed": 152995270030802, "steps": 25, "cfg": 2.5,
            "preserveOnly": True, "ownerApproved": False, "qualityQualified": False}
RECIPES = {"recovery16-native-token-v1": "token-only",
           "recovery16-native-flow-source045-v1": "reference-img2img",
           "recovery16-native-flow-source025-v1": "reference-img2img"}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def require(condition, code):
    if not condition:
        raise ValueError(code)


def closed(value, keys):
    require(type(value) is dict and set(value) == set(keys.split()), "NATIVE_FIELDS")


def pairs(items):
    result = {}
    for key, value in items:
        require(key not in result, "NATIVE_DUPLICATE_KEY")
        result[key] = value
    return result


def parse(data):
    require(type(data) is bytes and len(data) <= LIMIT, "NATIVE_ENVELOPE_SIZE")
    def finite(value):
        number = float(value)
        require(math.isfinite(number), "NATIVE_NONFINITE")
        return number
    return json.loads(data, object_pairs_hook=pairs,
                      parse_float=finite,
                      parse_constant=lambda _: require(False, "NATIVE_NONFINITE"))


def blob(value, limit):
    closed(value, "byteBase64 sha256 size")
    require(type(value["byteBase64"]) is str and len(value["byteBase64"]) <= ((limit + 2) // 3) * 4,
            "NATIVE_BLOB_SIZE")
    data = base64.b64decode(value["byteBase64"], validate=True)
    require(base64.b64encode(data).decode() == value["byteBase64"], "NATIVE_BASE64")
    require(type(value["size"]) is int and 0 < len(data) == value["size"] <= limit, "NATIVE_BLOB_SIZE")
    require(value["sha256"] == sha(data), "NATIVE_BLOB_HASH")
    return data


def identity(value):
    require(type(value) is str and str(uuid.UUID(value)) == value, "NATIVE_UUID")


def validate(data, manifest):
    job = parse(data)
    closed(job, "schema requestId nonce profileDigest mode recipe snapshot bundle settings ownerBindingHash explicitEdits")
    require(job["schema"] == "native-moss-job.v1", "NATIVE_SCHEMA")
    identity(job["requestId"])
    identity(job["nonce"])
    require(type(job["ownerBindingHash"]) is str and re.fullmatch(r"[0-9a-f]{64}", job["ownerBindingHash"]),
            "NATIVE_OWNER_BINDING")
    require(job["profileDigest"] == PROFILE_DIGEST, "NATIVE_PROFILE_DIGEST")
    require(job["recipe"] in RECIPES and job["mode"] == RECIPES[job["recipe"]], "NATIVE_RECIPE_MODE")
    require(job["settings"] == SETTINGS and all(type(job["settings"][k]) is type(v) for k, v in SETTINGS.items()),
            "NATIVE_SETTINGS")
    require(job["explicitEdits"] == [], "NATIVE_EDITS_UNSUPPORTED")
    snap = job["snapshot"]
    closed(snap, "personId characterId name detail token original sourceSelection")
    require(type(snap["personId"]) is str and re.fullmatch(r"person-[0-9]+", snap["personId"]), "NATIVE_PERSON")
    require(type(snap["characterId"]) is str and re.fullmatch(r"K[0-9]+", snap["characterId"]), "NATIVE_CHARACTER")
    require(type(snap["name"]) is str and snap["name"].strip(), "NATIVE_NAME")
    retained = {role: blob(snap[role], 2 * 1024 * 1024) for role in ("detail", "token")}
    detail, token = (parse(retained[role]) for role in ("detail", "token"))
    if not isinstance(detail, dict) or not isinstance(token, dict):
        raise ValueError("NATIVE_SOURCE_DOCUMENT")
    require(detail.get("id") == token.get("personId") == snap["personId"] and
            detail.get("characterId") == token.get("characterId") == snap["characterId"] and
            detail.get("name") == token.get("name") == snap["name"], "NATIVE_SOURCE_IDENTITY")
    selected = snap["sourceSelection"]
    closed(selected, "kind personId sourceSHA256")
    require(selected["kind"] in ("selected", "uploaded") and selected["personId"] == snap["personId"], "NATIVE_SELECTION")
    require(selected["kind"] != "uploaded", "NATIVE_UPLOADED_SOURCE_UNSUPPORTED")
    if job["mode"] == "reference-img2img":
        retained["original"] = blob(snap["original"], 8 * 1024 * 1024)
        require(selected["sourceSHA256"] == sha(retained["original"]), "NATIVE_ORIGINAL_HASH")
        require(token.get("image", {}).get("sha256") == selected["sourceSHA256"] and
                token["image"].get("path") == f'/portraits/{snap["personId"]}.png', "NATIVE_IMAGE_BINDING")
    else:
        require(snap["original"] is None and selected["sourceSHA256"] is None, "NATIVE_TOKEN_HAS_REFERENCE")
    require(type(job["bundle"]) is list, "NATIVE_BUNDLE")
    bundle = {}
    for item in job["bundle"]:
        closed(item, "name byteBase64 sha256 size")
        name = item["name"]
        require(type(name) is str and name in manifest["files"] and name not in bundle, "NATIVE_BUNDLE_NAME")
        raw = blob({k: v for k, v in item.items() if k != "name"}, 2 * 1024 * 1024)
        require(sha(raw) == manifest["files"][name]["sha256"] and len(raw) == manifest["files"][name]["size"],
                "NATIVE_BUNDLE_PIN")
        bundle[name] = raw
    require(set(bundle) == set(manifest["files"]), "NATIVE_BUNDLE_INCOMPLETE")
    return job, retained, token, bundle


def exclusive(path, data):
    require(not path.is_symlink() and not path.exists(), "NATIVE_EXISTING_PATH")
    with path.open("xb") as stream:
        stream.write(data)


def host_proof():
    spec = importlib.util.spec_from_file_location("native_host_proof", HERE / "newhost-proof.py")
    if spec is None or spec.loader is None:
        raise ValueError("NATIVE_HOST_PROOF_IMPORT")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify_preflight(request, proof, retained, token):
    import runtime
    import context_v1
    import native_runner_v1
    import reference_pipeline_recipes
    attestation = proof["runtimeAttestation"]
    closed(attestation, "schema terminalReceiptSHA256 terminalReceipt compiled contextInput contextInputBytes contextInputSHA256 context contextResponseSHA256 contextResponse sourcePins retainedSHA256 transform")
    require(attestation["schema"] == "native-moss-runtime-proof.v1", "NATIVE_RUNTIME_PROOF")
    def decoded(key, digest):
        raw = base64.b64decode(attestation[key], validate=True)
        require(len(raw) <= 2 * 1024 * 1024 and base64.b64encode(raw).decode() == attestation[key] and
                sha(raw) == attestation[digest], "NATIVE_RUNTIME_PROOF_BYTES")
        raw.decode("utf-8", errors="strict")
        return raw
    terminal_raw = decoded("terminalReceipt", "terminalReceiptSHA256")
    terminal = parse(terminal_raw)
    require(sha(terminal_raw) == proof["terminalReceiptSHA256"] == runtime.TERMINAL and
            terminal["state"] == "completed" and terminal["exitCode"] == 0 and terminal["steps"] == 1600 and
            terminal["adapter"]["sha256"] == runtime.CONFIG["adapter_sha256"], "NATIVE_TERMINAL_PROOF")
    compiled = runtime.compile_prompt(request, token)
    require(attestation["compiled"] == proof["compiled"] == compiled and
            compiled["promptSHA256"] == sha(compiled["text"].encode()), "NATIVE_COMPILED_PROOF")
    expected_input = {"tokenizerFolder": runtime.TOKENIZER, "toolkit": runtime.CONFIG["toolkit"],
                      "mossSourceSHA256": native_runner_v1.SOURCE_PINS["extensions_built_in/diffusion_models/moss_image/moss_image.py"],
                      "prompts": [{"personId": request["snapshot"]["personId"], "text": compiled["text"]}], "negative": ""}
    context = parse(decoded("contextResponse", "contextResponseSHA256"))
    input_bytes = decoded("contextInputBytes", "contextInputSHA256")
    input_bytes.decode("utf-8", errors="strict")
    require(parse(input_bytes) == expected_input, "NATIVE_CONTEXT_INPUT_PROOF")
    require(attestation["contextInput"] == expected_input and attestation["context"] == proof["context"] == context and
            context["maxTextLength"] == 4096 and context["truncation"] is False and context["modelLoaded"] is False and
            context["tokenizerPins"] == context_v1.TOKENIZER_PINS and context["sourceSHA256"] == expected_input["mossSourceSHA256"],
            "NATIVE_CONTEXT_PROOF")
    require([row["personId"] for row in context["counts"]] == [request["snapshot"]["personId"], "negative"] and
            all(type(row["tokens"]) is int and 0 < row["tokens"] <= 4096 and
                type(row["chatSHA256"]) is str and re.fullmatch(r"[0-9a-f]{64}", row["chatSHA256"]) for row in context["counts"]), "NATIVE_CONTEXT_PROOF")
    require(attestation["sourcePins"] == {**native_runner_v1.SOURCE_PINS, **reference_pipeline_recipes.SOURCE_PINS} and
            attestation["retainedSHA256"] == {key: sha(raw) for key, raw in retained.items()} and
            attestation["transform"] == proof["transform"], "NATIVE_SOURCE_PROOF")
    if request["mode"] == "token-only":
        require(proof["transform"] is None, "NATIVE_SOURCE_PROOF")
    else:
        transform = proof["transform"]
        if not isinstance(transform, dict) or set(transform) != {"rgb", "receipt"}:
            raise ValueError("NATIVE_TRANSFORM_PROOF")
        encoded = transform["rgb"]
        source = transform["receipt"]
        if not isinstance(encoded, str) or not isinstance(source, dict):
            raise ValueError("NATIVE_TRANSFORM_PROOF")
        rgb = base64.b64decode(encoded, validate=True)
        require(base64.b64encode(rgb).decode() == encoded and
                source["sourceSHA256"] == sha(retained["original"]) and source["rgbSHA256"] == sha(rgb) and
                (source["width"], source["height"]) == (352, 512) and
                source["computationalContentRect"] == {"x": 6, "y": 1, "width": 340, "height": 510}, "NATIVE_TRANSFORM_PROOF")


def verify_result(request, result, proof, target):
    lease = proof["hostLease"]
    require(lease["requestId"] == request["requestId"] and lease["nonce"] == request["nonce"] and
            lease["state"] == "ACTIVE" and lease["scope"] == "native-through-alpha" and
            type(result["pid"]) is int and result["pid"] == lease["pid"] and
            type(lease["processStart"]) is str and re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z", lease["processStart"]),
            "NATIVE_PHASE_PROCESS_BINDING")
    require(result["nativeTensorCount"] == 336 and result["savedTensorCount"] == 504 and
            result["loadedValuesVerified"] is True and result["noMerge"] is True and
            result["terminalReceiptSHA256"] == proof["terminalReceiptSHA256"] and
            result["runtimeAttestation"] == proof["runtimeAttestation"], "NATIVE_PHASE_RESULT_PROOF")
    from PIL import Image
    import numpy as np
    arrays = []
    for name, key, size in (("raw.png", "rawSHA256", (352, 512)), ("crop-RGB.png", "cropSHA256", (340, 510))):
        path = target / "output" / name
        require(path.is_file() and not path.is_symlink() and path.stat().st_size <= 8 * 1024 * 1024 and
                sha(path.read_bytes()) == result[key], "NATIVE_PHASE_OUTPUT_PROOF")
        with Image.open(path) as image:
            require(image.mode == "RGB" and image.size == size, "NATIVE_PHASE_OUTPUT_PROOF")
            arrays.append(np.array(image))
    require(np.array_equal(arrays[0][1:511, 6:346], arrays[1]), "NATIVE_PHASE_OUTPUT_PROOF")
    require("exitCode" not in result and "processStart" not in result and "phaseOutcome" not in result, "NATIVE_PHASE_UNOBSERVED_CLAIM")
    if request["mode"] == "token-only":
        import runtime as installed_runtime
        require(request["recipe"] == "recovery16-native-token-v1" and result["samplingCoverage"] == {
            "status": "OBSERVED", "adoptionAllowed": True}, "NATIVE_SAMPLING_PROOF")
        closed(result["sampling"], "schema status pipelineSourceSHA256 noise initial finalLatent sigmas fullSigmas activeSigmas seed steps cfg shift transitions generatorStateBefore generatorStateAfter")
        for key in ("noise", "initial", "finalLatent", "sigmas"):
            closed(result["sampling"][key], "shape sourceDtype hashDtype sha256")
        installed_runtime.token_sampling_proof(result["sampling"])
        require(result.get("seed") == SETTINGS["seed"] and result.get("steps") == SETTINGS["steps"] and
                result.get("cfg") == SETTINGS["cfg"] and result.get("adapterSHA256") == installed_runtime.CONFIG["adapter_sha256"] and
                result.get("modelPins") == installed_runtime.native.PINS and result.get("toolkitCommit") == installed_runtime.native.COMMIT and
                result.get("promptSHA256") == proof["compiled"]["promptSHA256"], "NATIVE_TOKEN_EXECUTION_BINDING")
    else:
        require(type(result["sampling"]) is dict and result["samplingCoverage"] == {
            "status": "OBSERVED_REFERENCE", "adoptionAllowed": False}, "NATIVE_SAMPLING_PROOF")
    return {**result, "processStart": lease["processStart"], "phaseOutcome": "RETURNED_SUCCESSFULLY"}


def run(data, runtime, root=ROOT):
    manifest = parse((HERE / "manifest.json").read_bytes())
    runtime.verify_bundle(manifest)
    job, retained, token, bundle = validate(data, manifest)
    # All authority, content, context, transform and installed-byte checks precede writes/models.
    proof = runtime.preflight(job, token, retained)
    verify_preflight(job, proof, retained, token)
    require(root.is_dir() and not root.is_symlink(), "NATIVE_JOB_ROOT")
    target = root / job["requestId"]
    require(not target.exists() and not target.is_symlink(), "NATIVE_DUPLICATE_JOB")
    if root == ROOT:
        lease = host_proof().reserve(job, root)
        proof["hostLease"] = lease
    else:
        # Local Python test API only; the stdin entrypoint never accepts roots.
        proof["hostLease"] = runtime.reserve(job, root)
    lease = proof["hostLease"]
    start = lease.get("processStart") if isinstance(lease, dict) else None
    if not isinstance(start, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{7}Z", start):
        raise ValueError("NATIVE_PHASE_PROCESS_BINDING")
    require(type(lease) is dict and lease.get("requestId") == job["requestId"] and lease.get("nonce") == job["nonce"] and
            lease.get("pid") == os.getpid(), "NATIVE_PHASE_PROCESS_BINDING")
    target.mkdir(exist_ok=False)
    for name in ("inputs", "worker", "output"):
        (target / name).mkdir(exist_ok=False)
    for role, raw in retained.items():
        exclusive(target / "inputs" / (role + (".png" if role == "original" else ".json")), raw)
    for name, raw in bundle.items():
        path = target / "worker" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        require(path.resolve().is_relative_to((target / "worker").resolve()), "NATIVE_DESCENDANT_ESCAPE")
        exclusive(path, raw)
    exclusive(target / "config.json", data)
    preflight_bytes = json.dumps(proof, ensure_ascii=False, separators=(",", ":")).encode()
    require(len(preflight_bytes) <= 8 * 1024 * 1024, "NATIVE_PREFLIGHT_SIZE")
    exclusive(target / "preflight.json", preflight_bytes)
    if root == ROOT:
        host_proof().verify_owned(job, proof["hostLease"], root)
    result = verify_result(job, runtime.execute(job, target, proof), proof, target)
    receipt = {"schema": "native-moss-native-phase.v1", "requestId": job["requestId"],
               "nonce": job["nonce"], "ownerBindingHash": job["ownerBindingHash"],
               "envelopeSHA256": sha(data), "profileDigest": job["profileDigest"],
               "bundleSHA256": manifest["implementationSHA256"],
               "mode": job["mode"], "recipe": job["recipe"],
               "snapshotHashes": {k: sha(v) for k, v in retained.items()},
               "preflightSHA256": sha(preflight_bytes), "preflightSize": len(preflight_bytes),
               "native": result, "context": proof["context"],
               "cropXYXY": [6, 1, 346, 511], "cropXYWH": [6, 1, 340, 510],
               "state": "NATIVE_COMPLETE_ALPHA_PENDING", "alphaFinished": False,
               "qualityQualified": False, "ownerApproved": False, "reviewStatus": "HOLD"}
    exclusive(target / "status.json", json.dumps(receipt, ensure_ascii=False).encode())
    return receipt


def main():
    require(len(sys.argv) == 1, "NATIVE_STDIN_ONLY")
    receipt = command(parse(sys.stdin.buffer.read(LIMIT + 1)))
    print(json.dumps(receipt, ensure_ascii=False), flush=True)


def command(frame):
    """One strict command, one JSON response; reads never launch or reconcile."""
    require(type(frame) is dict, "NATIVE_COMMAND_FIELDS")
    operation = frame.get("operation")
    fields = {"readiness": "schema operation profileDigest",
              "execute": "schema operation profileDigest job",
              "status": "schema operation profileDigest requestId nonce ownerBindingHash envelopeSHA256",
              "readArtifacts": "schema operation profileDigest requestId nonce ownerBindingHash envelopeSHA256"}
    require(type(operation) is str and operation in fields, "NATIVE_COMMAND_OPERATION")
    closed(frame, fields[operation])
    require(frame["schema"] == "native-moss-command.v1" and frame["profileDigest"] == PROFILE_DIGEST,
            "NATIVE_COMMAND_PROFILE")
    from runtime import InstalledRuntime
    runtime = InstalledRuntime()
    manifest = parse((HERE / "manifest.json").read_bytes())
    if operation == "readiness":
        qualification = host_proof().qualify(manifest)
        return {"schema": "native-moss-readiness.v1", "profileDigest": PROFILE_DIGEST,
                "bundleSHA256": manifest["implementationSHA256"], **qualification,
                "modelLoaded": False, "generationDispatched": False}
    runtime.verify_bundle(manifest)
    if operation == "execute":
        return run(json.dumps(frame["job"], ensure_ascii=False, separators=(",", ":")).encode(), runtime)
    identity(frame["requestId"])
    identity(frame["nonce"])
    for key in ("ownerBindingHash", "envelopeSHA256"):
        require(type(frame[key]) is str and re.fullmatch(r"[0-9a-f]{64}", frame[key]), "NATIVE_COMMAND_HASH")
    target = ROOT / frame["requestId"]
    require(target.is_dir() and not target.is_symlink() and target.resolve().parent == ROOT.resolve(), "NATIVE_JOB_NOT_FOUND")
    status = target / "status.json"
    require(status.is_file() and not status.is_symlink(), "NATIVE_TERMINAL_STATUS_UNAVAILABLE")
    require(status.stat().st_size <= 2 * 1024 * 1024, "NATIVE_STATUS_SIZE")
    receipt = parse(status.read_bytes())
    require(type(receipt) is dict and receipt.get("schema") == "native-moss-native-phase.v1" and
            receipt.get("state") == "NATIVE_COMPLETE_ALPHA_PENDING" and
            receipt.get("bundleSHA256") == manifest["implementationSHA256"], "NATIVE_STATUS_SCHEMA")
    require(all(receipt.get(key) == frame[key] for key in
                ("requestId", "nonce", "ownerBindingHash", "envelopeSHA256", "profileDigest")), "NATIVE_STATUS_BINDING")
    config = target / "config.json"
    require(config.is_file() and not config.is_symlink() and config.stat().st_size <= LIMIT,
            "NATIVE_CONFIG_UNAVAILABLE")
    require(sha(config.read_bytes()) == frame["envelopeSHA256"], "NATIVE_CONFIG_HASH")
    preflight = target / "preflight.json"
    require(preflight.is_file() and not preflight.is_symlink() and preflight.stat().st_size <= 8 * 1024 * 1024,
            "NATIVE_PREFLIGHT_UNAVAILABLE")
    preflight_bytes = preflight.read_bytes()
    require(sha(preflight_bytes) == receipt["preflightSHA256"] and len(preflight_bytes) == receipt["preflightSize"], "NATIVE_PREFLIGHT_HASH")
    observed = parse(preflight_bytes)
    request, retained, token, _ = validate(config.read_bytes(), manifest)
    verify_preflight(request, observed, retained, token)
    lease = observed["hostLease"]
    require(lease["requestId"] == frame["requestId"] and lease["nonce"] == frame["nonce"] and
            lease["state"] == "ACTIVE" and lease["scope"] == "native-through-alpha", "NATIVE_READBACK_PROOF")
    require(receipt["native"]["pid"] == observed["hostLease"]["pid"] and
            receipt["native"]["processStart"] == observed["hostLease"]["processStart"] and
            receipt["native"]["terminalReceiptSHA256"] == observed["terminalReceiptSHA256"] and
            receipt["native"]["runtimeAttestation"] == observed["runtimeAttestation"] and
            receipt["native"]["phaseOutcome"] == "RETURNED_SUCCESSFULLY", "NATIVE_READBACK_PROOF")
    if operation == "status":
        return {"schema": "native-moss-status.v1", "receipt": receipt}
    output = target / "output"
    require(output.is_dir() and not output.is_symlink(), "NATIVE_ARTIFACT_PATH")
    artifacts = [{"name": "preflight.json", "size": len(preflight_bytes), "sha256": sha(preflight_bytes),
                  "byteBase64": base64.b64encode(preflight_bytes).decode()}]
    for name, hash_key in (("raw.png", "rawSHA256"), ("crop-RGB.png", "cropSHA256")):
        path = output / name
        require(path.is_file() and not path.is_symlink() and path.stat().st_size <= 8 * 1024 * 1024,
                "NATIVE_ARTIFACT_PATH")
        raw = path.read_bytes()
        require(sha(raw) == receipt["native"][hash_key], "NATIVE_ARTIFACT_HASH")
        artifacts.append({"name": name, "size": len(raw), "sha256": sha(raw),
                          "byteBase64": base64.b64encode(raw).decode()})
    return {"schema": "native-moss-artifacts.v1", "receipt": receipt, "artifacts": artifacts}


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # No source text, secrets or submitted paths in the public failure frame.
        code = str(error).split(":", 1)[0]
        print(json.dumps({"schema": "native-moss-error.v1", "code": code if re.fullmatch(r"[A-Z_]+", code) else "NATIVE_FAILURE"}), flush=True)
        sys.exit(1)
