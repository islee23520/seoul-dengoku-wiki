"""Installed ai-toolkit adapter; no model imports until execute; owns native lease."""
import ast
import base64
import contextlib
import datetime
import io
import json
import math
import os
import pathlib
import struct
import subprocess
import sys
from typing import Any

from job import HERE, ROOT, SETTINGS, exclusive, parse, require, sha
import content_v1 as content
import context_v1 as context
import native_runner_v1 as native
import reference_pipeline_recipes as reference

TRAINING = "E:/git/linalab/PNGAL/environment/training/"
CONFIG = {
    "toolkit": "E:/git/linalab/PNGAL/environment/ai-toolkit",
    "base": "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0/models/diffusion_models/moss_image_sft_int8_convrot.safetensors",
    "encoder": TRAINING + "moss-lora-20261019/qwen3.5_9b_int8_convrot.safetensors",
    "vae": "D:/AI/environments/PNGAL/ComfyUI-pngal-0.28.0/models/vae/flux2-vae_small.safetensors",
    "adapter": TRAINING + "moss-style-recovery16-provisional-v1/output/seoul-dengoku-moss-sft-style-recovery16-provisional-v1/seoul-dengoku-moss-sft-style-recovery16-provisional-v1.safetensors",
    "terminal_receipt": TRAINING + "moss-style-recovery16-provisional-v1/training-status.json",
    "adapter_sha256": "50dd8ab132a9d9c67e35e19bb7c1da6770658757df1c7b424d492999d200ca57",
    "steps": 25, "cfg": 2.5, "negative": "",
}
TOKENIZER = "C:/Users/oliver/.cache/huggingface/hub/models--OpenMOSS-Team--MOSS-Image-SFT/snapshots/2c7954437269461767f533b006823e8f85973a60/tokenizer"
BUN = "C:/Users/oliver/.bun/bin/bun.exe"
TERMINAL = "09055e014559376af615cf8626b53a734d3ff55a757a13465a8304d4ff66bbd6"
OBSERVER = "77b7124e763cb2fc4def9af59a1e02245f3c23a068091a4a5eb25fdd3f49368c"


def token_sampling_proof(value):
    require(isinstance(value, dict) and value.get("schema") == "native-moss-token-sampling.v1" and
            value.get("status") == "OBSERVED" and value.get("pipelineSourceSHA256") ==
            reference.SOURCE_PINS["extensions_built_in/diffusion_models/moss_image/src/pipeline.py"], "NATIVE_TOKEN_SAMPLING_PROOF_MISSING")
    for key, expected in {"seed": SETTINGS["seed"], "steps": 25, "cfg": 2.5, "shift": 5.0, "transitions": 25}.items():
        require(type(value.get(key)) in (int, float) and value[key] == expected, "NATIVE_TOKEN_SAMPLING_CONFIG")
    def digest(value):
        return isinstance(value, str) and len(value) == 64 and all(c in "0123456789abcdef" for c in value)
    for key in ("noise", "initial", "finalLatent", "sigmas"):
        tensor = value.get(key)
        require(isinstance(tensor, dict) and tensor.get("shape") == ([26] if key == "sigmas" else [1, 128, 32, 22]) and
                tensor.get("sourceDtype") == "torch.float32" and tensor.get("hashDtype") == "little-endian-float32" and
                digest(tensor.get("sha256")), "NATIVE_TOKEN_SAMPLING_TENSOR")
    sigmas = value.get("fullSigmas")
    if not isinstance(sigmas, list):
        raise ValueError("NATIVE_TOKEN_SAMPLING_SCHEDULE")
    require(isinstance(sigmas, list) and len(sigmas) == 26 and sigmas == value.get("activeSigmas") and
            all(type(v) in (int, float) and math.isfinite(v) for v in sigmas) and
            sigmas[0] == 1 and sigmas[-1] == 0 and all(a > b for a, b in zip(sigmas, sigmas[1:])), "NATIVE_TOKEN_SAMPLING_SCHEDULE")
    require(sha(struct.pack("<26f", *sigmas)) == value["sigmas"]["sha256"] and
            value["noise"] == value["initial"] and digest(value.get("generatorStateBefore")) and
            digest(value.get("generatorStateAfter")), "NATIVE_TOKEN_SAMPLING_BINDING")
    return value


def compile_prompt(job, token):
    def qualified(value):
        if isinstance(value, dict):
            require(value.get("provisional") is not True and value.get("status") not in
                    ("provisional", "pending-review", "rejected"), "NATIVE_PROVISIONAL_SOURCE")
            for child in value.values():
                qualified(child)
        elif isinstance(value, list):
            for child in value:
                qualified(child)
    qualified(token)
    if job["mode"] == "token-only":
        compiled = content.compile_content(token)
        require(not compiled["holds"], "NATIVE_CONTENT_HOLD")
        return compiled
    return {"text": reference.PROMPT, "promptSHA256": sha(reference.PROMPT.encode()),
            "fields": [], "holds": [], "profile": "native-moss-reference-img2img.v1"}


def construct(config):
    # Exact reviewed constructor and 504->336 load checks; only file authority changes.
    tree = ast.parse((HERE / "native_runner_v1.py").read_bytes())
    fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "generate")
    start = next(i for i, n in enumerate(fn.body) if isinstance(n, ast.Assign) and
                 any(isinstance(t, ast.Name) and t.id == "mc" for t in n.targets))
    end = next(i for i, n in enumerate(fn.body) if isinstance(n, ast.Expr) and
               isinstance(n.value, ast.Call) and isinstance(n.value.func, ast.Attribute) and n.value.func.attr == "mkdir")
    prefix = fn.body[:next(i for i, n in enumerate(fn.body) if isinstance(n, ast.Assign) and
                          any(isinstance(t, ast.Name) and t.id == "output" for t in n.targets))]
    fn.name = "construct"
    fn.args.args = [ast.arg(arg="config")]
    fn.body = prefix + fn.body[start:end] + ast.parse("return model, len(expected), GenerateImageConfig").body
    namespace = vars(native).copy()
    exec(compile(ast.fix_missing_locations(ast.Module(body=[fn], type_ignores=[])),
                 "<frozen-native-construction>", "exec"), namespace)
    return namespace["construct"](config)


class InstalledRuntime:
    def reserve(self, job, root):
        require(root == ROOT, "NATIVE_FIXED_ROOT")
        # One host lease, retained after native completion for the alpha phase.
        # Existing or stale files are never stolen or automatically reconciled.
        lease = {"schema": "native-moss-gpu-lease.v1", "requestId": job["requestId"],
                 "nonce": job["nonce"], "state": "ACTIVE", "scope": "native-through-alpha",
                 "pid": os.getpid(), "acquiredAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}
        exclusive(root / "gpu-lease.json", json.dumps(lease).encode())

    def verify_bundle(self, manifest):
        rows = manifest["files"]
        encoded = json.dumps(rows, sort_keys=True, separators=(",", ":")).encode()
        require(sha(encoded) == manifest["implementationSHA256"], "NATIVE_MANIFEST_DIGEST")
        for name, pin in rows.items():
            path = HERE / name
            require(not path.is_symlink() and path.is_file() and
                    sha(path.read_bytes()) == pin["sha256"] and path.stat().st_size == pin["size"], "NATIVE_WORKER_DRIFT")

    def lease(self, job):
        path = ROOT / "gpu-lease.json"
        require(path.is_file() and not path.is_symlink(), "NATIVE_LEASE_REQUIRED")
        lease = parse(path.read_bytes())
        require(lease.get("requestId") == job["requestId"] and lease.get("nonce") == job["nonce"] and
                lease.get("state") == "ACTIVE" and lease.get("scope") == "native-through-alpha", "NATIVE_LEASE_BINDING")
        return sha(path.read_bytes())

    def preflight(self, job, token, retained):
        compiled = compile_prompt(job, token)
        require("--" not in compiled["text"], "NATIVE_PROMPT_FLAGS")
        root = pathlib.Path(CONFIG["toolkit"])
        require(subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip() == native.COMMIT,
                "NATIVE_TOOLKIT_REVISION")
        source_pins = {}
        for rel, pin in {**native.SOURCE_PINS, **reference.SOURCE_PINS}.items():
            measured = native.digest(root / rel)
            require(measured == pin, "NATIVE_SOURCE_DRIFT")
            source_pins[rel] = measured
        for role, pin in {**native.PINS, "adapter": CONFIG["adapter_sha256"]}.items():
            require(native.digest(CONFIG[role]) == pin, "NATIVE_INSTALLED_PIN")
        require(pathlib.Path(CONFIG["adapter"]).stat().st_size == 148697488, "NATIVE_ADAPTER_SIZE")
        terminal_bytes = pathlib.Path(CONFIG["terminal_receipt"]).read_bytes()
        terminal_digest = sha(terminal_bytes)
        require(terminal_digest == TERMINAL, "NATIVE_INSTALLED_PIN")
        terminal = parse(terminal_bytes)
        require(terminal["state"] == "completed" and terminal["exitCode"] == 0 and terminal["steps"] == 1600 and
                terminal["adapter"]["sha256"] == CONFIG["adapter_sha256"], "NATIVE_TRAINING_TERMINAL")
        with open(CONFIG["adapter"], "rb") as stream:
            size = struct.unpack("<Q", stream.read(8))[0]
            require(size <= 2 * 1024 * 1024, "NATIVE_ADAPTER_HEADER")
            header = parse(stream.read(size))
        native.tensor_contract(header)
        require(json.loads(header["__metadata__"]["training_info"])["step"] == 1600, "NATIVE_ADAPTER_STEP")
        cpu_config = {"tokenizerFolder": TOKENIZER, "toolkit": CONFIG["toolkit"],
                      "mossSourceSHA256": native.SOURCE_PINS["extensions_built_in/diffusion_models/moss_image/moss_image.py"],
                      "prompts": [{"personId": job["snapshot"]["personId"], "text": compiled["text"]}], "negative": ""}
        env = {**os.environ, "CUDA_VISIBLE_DEVICES": "", "USE_TORCH": "0", "USE_TF": "0", "USE_FLAX": "0",
               "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"}
        context_input = json.dumps(cpu_config, ensure_ascii=False).encode("utf-8")
        result = subprocess.run([sys.executable, "-B", str(HERE / "runtime.py"), "--context"],
                                input=context_input, capture_output=True,
                                timeout=180, check=True, env=env)
        context_bytes = result.stdout
        context_digest = sha(context_bytes)
        context_bytes.decode("utf-8", errors="strict")
        context_proof = parse(context_bytes)
        require(context_proof["maxTextLength"] == 4096 and context_proof["truncation"] is False and
                context_proof["modelLoaded"] is False and context_proof["tokenizerPins"] == context.TOKENIZER_PINS and
                context_proof["sourceSHA256"] == cpu_config["mossSourceSHA256"], "NATIVE_CONTEXT")
        counts = context_proof["counts"]
        require(isinstance(counts, list) and len(counts) == 2 and
                [row["personId"] for row in counts] == [job["snapshot"]["personId"], "negative"] and
                all(type(row["tokens"]) is int and 0 < row["tokens"] <= 4096 and
                    isinstance(row["chatSHA256"], str) and len(row["chatSHA256"]) == 64 and
                    all(c in "0123456789abcdef" for c in row["chatSHA256"]) for row in counts), "NATIVE_CONTEXT")
        transform = None
        if "original" in retained:
            transform = self.transform(retained["original"])
        attestation = {"schema": "native-moss-runtime-proof.v1",
                       "terminalReceiptSHA256": terminal_digest,
                       "terminalReceipt": base64.b64encode(terminal_bytes).decode("ascii"),
                       "compiled": compiled, "contextInput": cpu_config, "context": context_proof,
                       "contextInputSHA256": sha(context_input),
                       "contextInputBytes": base64.b64encode(context_input).decode("ascii"),
                       "contextResponseSHA256": context_digest,
                       "contextResponse": base64.b64encode(context_bytes).decode("ascii"),
                       "sourcePins": source_pins,
                       "retainedSHA256": {role: sha(raw) for role, raw in retained.items()},
                       "transform": transform}
        return {"compiled": compiled, "context": context_proof, "transform": transform,
                "terminalReceiptSHA256": terminal_digest, "runtimeAttestation": attestation}

    def transform(self, original):
        result = subprocess.run([BUN, str(HERE / "transform-stdin.ts")],
                                input=json.dumps({"original": base64.b64encode(original).decode()}),
                                capture_output=True, text=True, encoding="utf-8", check=True, timeout=180)
        proof = parse(result.stdout.encode())
        rgb = base64.b64decode(proof["rgb"], validate=True)
        receipt = proof["receipt"]
        require(receipt["sourceSHA256"] == sha(original) and receipt["rgbSHA256"] == sha(rgb) and
                (receipt["width"], receipt["height"]) == (352, 512) and
                receipt["computationalContentRect"] == {"x": 6, "y": 1, "width": 340, "height": 510}, "NATIVE_TRANSFORM")
        return proof

    def execute(self, job, target, proof):
        self.lease(job)
        output = target / "output"
        config = {**CONFIG, "output": str(output)}
        # Library progress belongs to stderr, machine stdout is one bounded frame.
        with contextlib.redirect_stdout(sys.stderr):
            sys.path.insert(0, CONFIG["toolkit"])
            from toolkit.config_modules import GenerateImageConfig
            image_type = GenerateImageConfig
            image = image_type(prompt=proof["compiled"]["text"], negative_prompt="", width=352, height=512,
                               num_inference_steps=25, guidance_scale=2.5, seed=SETTINGS["seed"],
                               network_multiplier=1.0, output_path=str(output / "raw.png"))
            native.resolved_config(image, config, {"text": proof["compiled"]["text"], "seed": SETTINGS["seed"]})
            sampling = None
            if job["mode"] == "reference-img2img":
                # Replace only source-file authority in a private module namespace.
                namespace = vars(reference).copy()
                def verify_source(binding):
                    original = (target / "inputs" / "original.png").read_bytes()
                    require(sha(original) == job["snapshot"]["original"]["sha256"], "NATIVE_SOURCE_CHANGED")
                    fresh = self.transform(original)
                    require(fresh == proof["transform"], "NATIVE_TRANSFORM_CHANGED")
                    return base64.b64decode(fresh["rgb"], validate=True), {"receipt": fresh["receipt"]}
                namespace["verify_source"] = verify_source
                tree = ast.parse((HERE / "reference_pipeline_recipes.py").read_bytes())
                definitions: list[ast.stmt] = [n for n in tree.body if
                               (isinstance(n, ast.ClassDef) and n.name == "ReferencePipeline") or
                               (isinstance(n, ast.FunctionDef) and n.name == "generate_reference")]
                exec(compile(ast.Module(body=definitions, type_ignores=[]), "<frozen-reference-pipeline>", "exec"), namespace)
                verify_source({})
                model, count, _ = construct(config)
                pipeline = namespace["ReferencePipeline"](model, {}, reference.load_native(CONFIG["toolkit"]), recipe=job["recipe"])
                namespace["generate_reference"](model, [image], pipeline)
                sampling = pipeline.receipt
            else:
                require(job.get("recipe") == "recovery16-native-token-v1", "NATIVE_RECIPE_MODE")
                attestation = proof.get("runtimeAttestation")
                require(isinstance(attestation, dict) and attestation.get("schema") == "native-moss-runtime-proof.v1" and
                        attestation.get("compiled") == proof["compiled"] and
                        attestation.get("context") == proof.get("context") and
                        proof.get("context", {}).get("maxTextLength") == 4096 and
                        proof.get("context", {}).get("truncation") is False and
                        sha(proof["compiled"]["text"].encode("utf-8")) == proof["compiled"]["promptSHA256"],
                        "NATIVE_TOKEN_CONTEXT_PROOF_MISSING")
                observer_bytes = (HERE / "token_pipeline_observed.py").read_bytes()
                require(sha(observer_bytes) == OBSERVER, "NATIVE_TOKEN_OBSERVER_DRIFT")
                observer: dict[str, Any] = {"__name__": "private_token_observer"}
                exec(compile(observer_bytes, "<pinned-token-observer>", "exec"), observer)
                installed = reference.load_native(CONFIG["toolkit"])
                model, count, _ = construct(config)
                pipeline = observer["create_observed_pipeline"](model, installed)
                model.generate_images([image], pipeline=pipeline)
                sampling = token_sampling_proof(pipeline.receipt)
            require(count == 336 and not model.network.is_merged_in and not model.network.can_merge_in, "NATIVE_POST_MERGE")
        from PIL import Image
        raw = output / "raw.png"
        require(raw.is_file() and not raw.is_symlink(), "NATIVE_RAW_MISSING")
        with Image.open(raw) as source:
            require(source.size == (352, 512) and source.mode == "RGB", "NATIVE_RAW_GEOMETRY")
            crop = io.BytesIO()
            source.crop((6, 1, 346, 511)).save(crop, format="PNG")
        exclusive(output / "crop-RGB.png", crop.getvalue())
        return {"nativeTensorCount": count, "savedTensorCount": 504, "loadedValuesVerified": True,
                "noMerge": True, "rawSHA256": native.digest(raw), "cropSHA256": sha(crop.getvalue()),
                "cropXYXY": [6, 1, 346, 511], "cropXYWH": [6, 1, 340, 510],
                "sampling": sampling, "seed": SETTINGS["seed"], "steps": 25, "cfg": 2.5,
                "adapterSHA256": CONFIG["adapter_sha256"], "modelPins": native.PINS,
                "toolkitCommit": native.COMMIT, "sourcePins": {**native.SOURCE_PINS, **reference.SOURCE_PINS},
                "promptSHA256": proof["compiled"]["promptSHA256"],
                "contentFieldsSHA256": context.field_hash(proof["compiled"]["fields"]),
                "pid": os.getpid(), "alphaFinished": False,
                "samplingCoverage": {"status": "OBSERVED", "adoptionAllowed": True} if job["mode"] == "token-only" else
                                    {"status": "OBSERVED_REFERENCE", "adoptionAllowed": False},
                **({"terminalReceiptSHA256": proof["terminalReceiptSHA256"],
                    "runtimeAttestation": proof["runtimeAttestation"]} if "runtimeAttestation" in proof else {})}


if __name__ == "__main__":
    require(sys.argv[1:] == ["--context"], "NATIVE_PRIVATE_CONTEXT_ONLY")
    context.tokenizer_cpu(parse(sys.stdin.buffer.read(4 * 1024 * 1024)))
