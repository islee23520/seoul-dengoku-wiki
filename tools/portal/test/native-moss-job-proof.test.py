"""Measured job proof propagation with injected CPU runtime; never native models."""
import base64
import importlib.util
import io
import json
import os
import pathlib
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
from PIL import Image

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
sys.path.insert(0, str(WORKER))
job = importlib.import_module("job")
runtime = importlib.import_module("runtime")
context_v1 = importlib.import_module("context_v1")
native_runner_v1 = importlib.import_module("native_runner_v1")
reference_pipeline_recipes = importlib.import_module("reference_pipeline_recipes")

spec = importlib.util.spec_from_file_location("job_proof_fixture", WORKER.parent / "test" / "native-moss-worker.test.py")
fixtures = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixtures)
oracle_spec = importlib.util.spec_from_file_location("job_observed_oracle", WORKER.parent / "test" / "native-moss-token-observer.test.py")
oracle = importlib.util.module_from_spec(oracle_spec)
oracle_spec.loader.exec_module(oracle)


class ProofRuntime:
    def __init__(self, terminal, mutation=None):
        self.terminal = terminal
        self.mutation = mutation
        self.executed = 0

    def verify_bundle(self, manifest):
        runtime.InstalledRuntime().verify_bundle(manifest)

    def preflight(self, request, token, retained):
        compiled = runtime.compile_prompt(request, token)
        cpu_input = {"tokenizerFolder": runtime.TOKENIZER, "toolkit": runtime.CONFIG["toolkit"],
                     "mossSourceSHA256": native_runner_v1.SOURCE_PINS["extensions_built_in/diffusion_models/moss_image/moss_image.py"],
                     "prompts": [{"personId": request["snapshot"]["personId"], "text": compiled["text"]}], "negative": ""}
        context = {"maxTextLength": 4096, "truncation": False, "modelLoaded": False,
                   "tokenizerPins": context_v1.TOKENIZER_PINS, "sourceSHA256": cpu_input["mossSourceSHA256"],
                   "counts": [{"personId": request["snapshot"]["personId"], "tokens": 37, "chatSHA256": "1" * 64},
                              {"personId": "negative", "tokens": 9, "chatSHA256": "2" * 64}]}
        context_bytes = (json.dumps(context, indent=2) + "\r\n").encode()
        input_bytes = json.dumps(cpu_input, ensure_ascii=False).encode()
        attestation = {"schema": "native-moss-runtime-proof.v1", "terminalReceipt": base64.b64encode(self.terminal).decode(),
                       "terminalReceiptSHA256": job.sha(self.terminal), "compiled": compiled, "contextInput": cpu_input,
                       "contextInputBytes": base64.b64encode(input_bytes).decode(), "contextInputSHA256": job.sha(input_bytes),
                       "context": context, "contextResponse": base64.b64encode(context_bytes).decode(),
                       "contextResponseSHA256": job.sha(context_bytes),
                       "sourcePins": {**native_runner_v1.SOURCE_PINS, **reference_pipeline_recipes.SOURCE_PINS},
                       "retainedSHA256": {key: job.sha(raw) for key, raw in retained.items()}, "transform": None}
        proof = {"compiled": compiled, "context": context, "transform": None, "terminalReceiptSHA256": job.sha(self.terminal),
                 "runtimeAttestation": attestation}
        if self.mutation:
            self.mutation(proof)
        return proof

    def reserve(self, request, root):
        return {"requestId": request["requestId"], "nonce": request["nonce"], "pid": os.getpid(),
                "processStart": "2026-10-21T20:41:28.3621750Z", "state": "ACTIVE", "scope": "native-through-alpha"}

    def execute(self, request, target, proof):
        self.executed += 1
        if request["mode"] == "reference-img2img":
            raw, crop = io.BytesIO(), io.BytesIO()
            Image.new("RGB", (352, 512), (37, 49, 61)).save(raw, format="PNG")
            with Image.open(io.BytesIO(raw.getvalue())) as image:
                image.crop((6, 1, 346, 511)).save(crop, format="PNG")
            job.exclusive(target / "output" / "raw.png", raw.getvalue())
            job.exclusive(target / "output" / "crop-RGB.png", crop.getvalue())
            return {"pid": os.getpid(), "nativeTensorCount": 336, "savedTensorCount": 504, "noMerge": True,
                    "loadedValuesVerified": True, "terminalReceiptSHA256": proof["terminalReceiptSHA256"],
                    "runtimeAttestation": proof["runtimeAttestation"], "rawSHA256": job.sha(raw.getvalue()), "cropSHA256": job.sha(crop.getvalue()),
                    "sampling": {"cpuInjectedReference": True}, "samplingCoverage": {"status": "OBSERVED_REFERENCE", "adoptionAllowed": False}}
        class ImageConfig:
            def __init__(self, **values):
                self.__dict__.update(values)
                for key in ("ctrl_img", "ctrl_img_1", "ctrl_img_2", "ctrl_img_3", "latents", "adapter_image_path"):
                    setattr(self, key, None)
        installed = types.ModuleType("job_installed_pipeline")
        installed.__dict__.update(oracle.namespace())
        installed.__file__ = str(WORKER.parents[2] / ".omo/evidence/style-chain/moss-lora-20261019/trainer-src/pipeline.py")
        config_module = types.ModuleType("toolkit.config_modules")
        setattr(config_module, "GenerateImageConfig", ImageConfig)
        model = oracle.Model()
        model.transformer = oracle.Transformer(model)
        def generate(images, *, pipeline):
            self.pipeline = pipeline
            self.model = model
            image = images[0]
            output = pipeline(types.SimpleNamespace(text_embeds=["positive"]), types.SimpleNamespace(text_embeds=["negative"]),
                              height=image.height, width=image.width, num_inference_steps=image.num_inference_steps,
                              guidance_scale=image.guidance_scale, generator=oracle.Generator(image.seed), shift=5.0,
                              uncond_skip_layers=(22,), latents=None, ref_latents=None, isolate_refs=False)
            output[0].save(image.output_path)
        model.generate_images = generate
        before = list(sys.path)
        try:
            with patch.dict(sys.modules, {"toolkit": types.ModuleType("toolkit"), "toolkit.config_modules": config_module}), \
                 patch.object(runtime, "construct", return_value=(model, 336, ImageConfig)), \
                 patch.object(runtime.InstalledRuntime, "lease", return_value="cpu-checked"), \
                 patch.object(runtime.reference, "load_native", return_value=installed), \
                 patch.object(oracle.Tensor, "dtype", property(lambda self: "torch.float32")):
                return runtime.InstalledRuntime().execute(request, target, proof)
        finally:
            sys.path[:] = before


class JobProofTests(unittest.TestCase):
    def terminal(self, extra="measured"):
        return (json.dumps({"state": "completed", "exitCode": 0, "steps": 1600,
                            "adapter": {"sha256": runtime.CONFIG["adapter_sha256"]}, "fixture": extra}) + "\r\n").encode()

    def test_exact_preflight_bytes_terminal_context_and_phase_propagate(self):
        for variant in ("first", "second"):
            terminal = self.terminal(variant)
            request = fixtures.envelope()
            with tempfile.TemporaryDirectory() as folder, patch.object(runtime, "TERMINAL", job.sha(terminal)):
                root = pathlib.Path(folder)
                receipt = job.run(json.dumps(request).encode(), ProofRuntime(terminal), root)
                preflight_bytes = (root / request["requestId"] / "preflight.json").read_bytes()
                observed = job.parse(preflight_bytes)
                self.assertEqual(receipt["preflightSHA256"], job.sha(preflight_bytes))
                self.assertEqual(receipt["preflightSize"], len(preflight_bytes))
                self.assertEqual(receipt["native"]["terminalReceiptSHA256"], job.sha(terminal))
                self.assertEqual(base64.b64decode(observed["runtimeAttestation"]["terminalReceipt"]), terminal)
                context_raw = base64.b64decode(observed["runtimeAttestation"]["contextResponse"])
                self.assertTrue(context_raw.endswith(b"\r\n"))
                self.assertEqual(job.sha(context_raw), observed["runtimeAttestation"]["contextResponseSHA256"])
                self.assertEqual(receipt["native"]["phaseOutcome"], "RETURNED_SUCCESSFULLY")
                self.assertNotIn("exitCode", receipt["native"])
                self.assertEqual(receipt["native"]["processStart"], observed["hostLease"]["processStart"])
                self.assertEqual(receipt["native"]["samplingCoverage"], {"status": "OBSERVED", "adoptionAllowed": True})
                self.assertEqual(receipt["native"]["sampling"]["status"], "OBSERVED")
                frame = {"schema": "native-moss-command.v1", "operation": "readArtifacts", "profileDigest": job.PROFILE_DIGEST,
                         **{key: receipt[key] for key in ("requestId", "nonce", "ownerBindingHash", "envelopeSHA256")}}
                with patch.object(job, "ROOT", root):
                    artifacts = job.command(frame)["artifacts"]
                    self.assertEqual([a["name"] for a in artifacts], ["preflight.json", "raw.png", "crop-RGB.png"])
                    path = root / request["requestId"] / "preflight.json"
                    path.unlink()
                    job.exclusive(path, preflight_bytes + b" ")
                    with self.assertRaisesRegex(ValueError, "NATIVE_PREFLIGHT_HASH"):
                        job.command(frame)

    def test_forged_preflight_rejects_before_writes_or_execute(self):
        mutations = [lambda p: p.update(terminalReceiptSHA256="0" * 64),
                     lambda p: p["runtimeAttestation"].update(contextResponseSHA256="0" * 64),
                     lambda p: p["runtimeAttestation"].update(retainedSHA256={}),
                     lambda p: p["runtimeAttestation"]["contextInput"].update(negative="forged")]
        for mutation in mutations:
            terminal = self.terminal()
            injected = ProofRuntime(terminal, mutation)
            with tempfile.TemporaryDirectory() as folder, patch.object(runtime, "TERMINAL", job.sha(terminal)):
                with self.assertRaises(ValueError):
                    job.run(json.dumps(fixtures.envelope()).encode(), injected, pathlib.Path(folder))
                self.assertEqual(injected.executed, 0)
                self.assertEqual(list(pathlib.Path(folder).iterdir()), [])

    def test_pid_and_start_mismatch_no_success_receipt(self):
        terminal = self.terminal()
        for field, wrong in (("pid", os.getpid() + 1000), ("processStart", "wall-clock-not-os-token")):
            injected = ProofRuntime(terminal)
            reserve = injected.reserve
            with patch.object(injected, "reserve", side_effect=lambda request, root: {**reserve(request, root), field: wrong}), \
                 tempfile.TemporaryDirectory() as folder, patch.object(runtime, "TERMINAL", job.sha(terminal)):
                request = fixtures.envelope()
                with self.assertRaisesRegex(ValueError, "NATIVE_PHASE_PROCESS_BINDING"):
                    job.run(json.dumps(request).encode(), injected, pathlib.Path(folder))
                self.assertFalse((pathlib.Path(folder) / request["requestId"] / "status.json").exists())

    def test_forged_post_execute_result_never_gets_success_claim(self):
        for field, wrong in (("pid", os.getpid() + 1), ("noMerge", False), ("terminalReceiptSHA256", "0" * 64),
                             ("rawSHA256", "0" * 64), ("processStart", "2026-10-21T20:41:28.3621760Z"),
                             ("exitCode", 0), ("samplingCoverage", {"status": "UNOBSERVED", "adoptionAllowed": True})):
            terminal = self.terminal()
            injected = ProofRuntime(terminal)
            execute = injected.execute
            with tempfile.TemporaryDirectory() as folder, patch.object(runtime, "TERMINAL", job.sha(terminal)), \
                 patch.object(injected, "execute", side_effect=lambda req, target, proof: {**execute(req, target, proof), field: wrong}):
                request = fixtures.envelope()
                with self.subTest(field=field), self.assertRaises(ValueError):
                    job.run(json.dumps(request).encode(), injected, pathlib.Path(folder))
                self.assertFalse((pathlib.Path(folder) / request["requestId"] / "status.json").exists())

    def test_actual_runtime_job_roundtrip_observed_sampling_and_mutations(self):
        changes = [None, "null", "unobserved", "shape", "source", "sigma", "seed", "model", "missing"]
        for change in changes:
            terminal = self.terminal()
            injected = ProofRuntime(terminal)
            execute = injected.execute
            def run(req, target, proof):
                result = execute(req, target, proof)
                if change == "null":
                    result["sampling"] = None
                elif change == "unobserved":
                    result["samplingCoverage"] = {"status": "UNOBSERVED", "adoptionAllowed": False}
                elif change == "shape":
                    result["sampling"]["noise"]["shape"] = [1]
                elif change == "source":
                    result["sampling"]["pipelineSourceSHA256"] = "0" * 64
                elif change == "sigma":
                    result["sampling"]["sigmas"]["sha256"] = "0" * 64
                elif change == "seed":
                    result["sampling"]["seed"] += 1
                elif change == "model":
                    result["modelPins"] = {}
                elif change == "missing":
                    del result["sampling"]["finalLatent"]
                return result
            with self.subTest(change=change), tempfile.TemporaryDirectory() as folder, \
                 patch.object(runtime, "TERMINAL", job.sha(terminal)), patch.object(injected, "execute", side_effect=run):
                request = fixtures.envelope()
                root = pathlib.Path(folder)
                if change:
                    with self.assertRaises((ValueError, KeyError)):
                        job.run(json.dumps(request).encode(), injected, root)
                    self.assertFalse((root / request["requestId"] / "status.json").exists())
                else:
                    receipt = job.run(json.dumps(request).encode(), injected, root)
                    self.assertEqual(receipt["native"]["sampling"], injected.pipeline.receipt)
                    self.assertEqual(len(injected.model.calls), 50)
                    self.assertEqual(receipt["native"]["phaseOutcome"], "RETURNED_SUCCESSFULLY")


if __name__ == "__main__":
    unittest.main()
