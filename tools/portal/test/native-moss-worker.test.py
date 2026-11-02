"""CPU-only private-worker boundary tests; never import model/GPU libraries."""
import base64
import copy
import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import uuid

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
sys.path.insert(0, str(WORKER))
import job
import runtime


def packed(raw):
    return {"byteBase64": base64.b64encode(raw).decode(), "sha256": job.sha(raw), "size": len(raw)}


def document(value):
    return packed(json.dumps(value).encode())


def envelope():
    token = {"personId": "person-1004", "characterId": "K1004", "name": "Test Person",
             "identity": {"gender": "female"}, "slots": {"hair": {"color": "black"}}}
    return {"schema": "native-moss-job.v1", "requestId": str(uuid.uuid4()), "nonce": str(uuid.uuid4()),
            "profileDigest": job.PROFILE_DIGEST, "mode": "token-only", "recipe": "recovery16-native-token-v1",
            "ownerBindingHash": "a" * 64, "settings": copy.deepcopy(job.SETTINGS), "explicitEdits": [],
            "snapshot": {"personId": "person-1004", "characterId": "K1004", "name": "Test Person",
                         "token": document(token), "detail": document({"id": "person-1004", "characterId": "K1004", "name": "Test Person"}),
                         "original": None, "sourceSelection": {"kind": "selected", "personId": "person-1004", "sourceSHA256": None}},
            "bundle": [{"name": name, **packed((WORKER / name).read_bytes())} for name in MANIFEST["files"]]}


MANIFEST = job.parse((WORKER / "manifest.json").read_bytes())


class CpuRuntime:
    def __init__(self):
        self.executed = 0

    def verify_bundle(self, manifest):
        runtime.InstalledRuntime().verify_bundle(manifest)

    def reserve(self, request, root):
        self.reserved = request["requestId"]

    def preflight(self, request, token, retained):
        return {"compiled": runtime.compile_prompt(request, token), "context": {"cpuTestOnly": True}}

    def execute(self, request, target, proof):
        self.executed += 1
        return {"cpuTestOnly": True, "modelLoaded": False}


class WorkerTests(unittest.TestCase):
    def reject(self, request):
        injected = CpuRuntime()
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises((ValueError, TypeError, KeyError)):
                job.run(json.dumps(request).encode(), injected, pathlib.Path(folder))
            self.assertEqual(list(pathlib.Path(folder).iterdir()), [])
            self.assertEqual(injected.executed, 0)

    def test_valid_token_snapshot_and_duplicate_uuid(self):
        request, injected = envelope(), CpuRuntime()
        with tempfile.TemporaryDirectory() as folder:
            receipt = job.run(json.dumps(request).encode(), injected, pathlib.Path(folder))
            self.assertFalse(receipt["alphaFinished"])
            self.assertEqual(receipt["cropXYXY"], [6, 1, 346, 511])
            self.assertEqual(receipt["cropXYWH"], [6, 1, 340, 510])
            self.assertEqual(receipt["profileDigest"], job.PROFILE_DIGEST)
            self.assertEqual(receipt["bundleSHA256"], MANIFEST["implementationSHA256"])
            with self.assertRaisesRegex(ValueError, "NATIVE_DUPLICATE_JOB"):
                job.run(json.dumps(request).encode(), injected, pathlib.Path(folder))
            self.assertEqual(injected.executed, 1)

    def test_unknown_settings_paths_and_mode_pairing(self):
        for key, value in [("command", "python evil.py"), ("output", "../escape"),
                           ("profileDigest", "b" * 64), ("requestId", "../escape"),
                           ("recipe", "arbitrary"), ("mode", "reference-img2img"),
                           ("explicitEdits", [{"instruction": "change face"}])]:
            with self.subTest(key=key):
                request = envelope()
                request[key] = value
                self.reject(request)
        request = envelope()
        request["settings"]["n"] = True
        self.reject(request)
        request = envelope()
        request["settings"]["qualityQualified"] = True
        self.reject(request)

    def test_canonical_base64_size_hash_and_duplicate_names(self):
        for field, value in [("byteBase64", "Zh=="), ("sha256", "0" * 64), ("size", True)]:
            request = envelope()
            request["snapshot"]["token"][field] = value
            self.reject(request)
        request = envelope()
        request["bundle"].append(request["bundle"][0])
        self.reject(request)
        request = envelope()
        request["bundle"][0]["name"] = "../job.py"
        self.reject(request)
        request = envelope()
        request["bundle"].pop()
        self.reject(request)
        with self.assertRaisesRegex(ValueError, "NATIVE_DUPLICATE_KEY"):
            job.parse(b'{"x":1,"x":2}')
        with self.assertRaisesRegex(ValueError, "NATIVE_NONFINITE"):
            job.parse(b'{"x":NaN}')
        with self.assertRaisesRegex(ValueError, "NATIVE_NONFINITE"):
            job.parse(b'{"x":1e400}')

    def test_person_character_name_binding(self):
        for field, value in [("personId", "person-9999"), ("characterId", "K9999"), ("name", "Other")]:
            request = envelope()
            request["snapshot"][field] = value
            self.reject(request)

    def test_reference_snapshot_both_recipes_and_image_pin(self):
        for recipe in ("recovery16-native-flow-source045-v1", "recovery16-native-flow-source025-v1"):
            request = envelope()
            original = b"not-an-image-but-authority-boundary-test"
            request.update(mode="reference-img2img", recipe=recipe)
            request["snapshot"]["original"] = packed(original)
            request["snapshot"]["sourceSelection"]["sourceSHA256"] = job.sha(original)
            token = job.parse(base64.b64decode(request["snapshot"]["token"]["byteBase64"]))
            token["image"] = {"path": "/portraits/person-1004.png", "sha256": job.sha(original)}
            request["snapshot"]["token"] = document(token)
            validated = job.validate(json.dumps(request).encode(), MANIFEST)
            self.assertEqual(validated[1]["original"], original)
            request["snapshot"]["sourceSelection"]["sourceSHA256"] = "0" * 64
            self.reject(request)

    def test_content_hold_before_writes_and_models(self):
        for slots in ({"unreviewed": {"value": "x"}}, {"hair": {"color": "--seed 7"}},
                      {"accessories": {"shape": {"value": "glasses", "source": "a"},
                                       "color": {"value": "watch", "source": "b"}}}):
            request = envelope()
            token = job.parse(base64.b64decode(request["snapshot"]["token"]["byteBase64"]))
            token["slots"] = slots
            request["snapshot"]["token"] = document(token)
            self.reject(request)

    def test_symlink_job_and_existing_file_rejected(self):
        request = envelope()
        with tempfile.TemporaryDirectory() as folder, tempfile.TemporaryDirectory() as outside:
            (pathlib.Path(folder) / request["requestId"]).symlink_to(outside, target_is_directory=True)
            with self.assertRaisesRegex(ValueError, "NATIVE_DUPLICATE_JOB"):
                job.run(json.dumps(request).encode(), CpuRuntime(), pathlib.Path(folder))
            self.assertEqual(list(pathlib.Path(outside).iterdir()), [])
            file = pathlib.Path(outside) / "fixed"
            job.exclusive(file, b"first")
            with self.assertRaises(ValueError):
                job.exclusive(file, b"second")

    def test_actual_chat_ast_context_overflow_and_flags(self):
        source = '''MAX_TEXT_TOKENS = 4096
class MossImageModel:
    def _chat(self, text):
        return self.tokenizer.apply_chat_template([{"role":"user","content":text}], tokenize=False, add_generation_prompt=True, enable_thinking=True)
'''
        class Tokenizer:
            def apply_chat_template(self, messages, **flags):
                self.flags = flags
                return messages[0]["content"]

            def __call__(self, text, **flags):
                self.truncation = flags["truncation"]
                return {"input_ids": [0] * len(text)}
        tokenizer = Tokenizer()
        proof = runtime.context.context_with_installed_wrapper(source, tokenizer, [{"personId": "x", "text": "ok"}], "")
        self.assertEqual(proof["counts"][0]["tokens"], 2)
        self.assertTrue(tokenizer.flags["enable_thinking"])
        self.assertFalse(tokenizer.truncation)
        with self.assertRaisesRegex(ValueError, "MOSS_TEXT_CONTEXT_OVERFLOW"):
            runtime.context.context_with_installed_wrapper(source, tokenizer, [{"personId": "x", "text": "x" * 4097}], "")
        with self.assertRaisesRegex(ValueError, "MOSS_CHAT_FLAGS_CHANGED"):
            runtime.context.context_with_installed_wrapper(source.replace("enable_thinking=True", "enable_thinking=False"), tokenizer, [], "")

    def test_no_model_imports_on_validation(self):
        self.assertNotIn("torch", sys.modules)
        self.assertNotIn("transformers", sys.modules)
        self.assertNotIn("toolkit", sys.modules)
        request = envelope()
        request["command"] = "forbidden"
        result = subprocess.run([sys.executable, "-B", str(WORKER / "job.py")], input=json.dumps(request),
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout)["code"], "NATIVE_COMMAND_OPERATION")

    def test_command_readiness_is_honest_and_read_commands_cannot_launch(self):
        result = job.command({"schema": "native-moss-command.v1", "operation": "readiness", "profileDigest": job.PROFILE_DIGEST})
        self.assertFalse(result["ready"])
        self.assertFalse(result["generationDispatched"])
        for operation in ("status", "readArtifacts"):
            frame = {"schema": "native-moss-command.v1", "operation": operation,
                     "profileDigest": job.PROFILE_DIGEST, "requestId": "../escape", "nonce": str(uuid.uuid4()),
                     "ownerBindingHash": "a" * 64, "envelopeSHA256": "b" * 64}
            with self.assertRaises(ValueError):
                job.command(frame)

    def test_provisional_content_rejected_before_writes(self):
        request = envelope()
        token = job.parse(base64.b64decode(request["snapshot"]["token"]["byteBase64"]))
        token["slots"]["hair"]["color"] = {"value": "black", "status": "provisional"}
        request["snapshot"]["token"] = document(token)
        self.reject(request)

    def test_read_commands_bind_retained_config_receipt_and_artifacts(self):
        request = envelope()
        data = json.dumps(request).encode()
        with tempfile.TemporaryDirectory() as folder:
            root = pathlib.Path(folder)
            receipt = job.run(data, CpuRuntime(), root)
            output = root / request["requestId"] / "output"
            raw, crop = b"cpu-raw-artifact", b"cpu-crop-artifact"
            job.exclusive(output / "raw.png", raw)
            job.exclusive(output / "crop-RGB.png", crop)
            receipt["native"].update(rawSHA256=job.sha(raw), cropSHA256=job.sha(crop))
            status = root / request["requestId"] / "status.json"
            # Rewrite only synthetic test output created in this temporary fixture.
            status.unlink()
            job.exclusive(status, json.dumps(receipt).encode())
            frame = {"schema": "native-moss-command.v1", "operation": "status", "profileDigest": job.PROFILE_DIGEST,
                     **{key: receipt[key] for key in ("requestId", "nonce", "ownerBindingHash", "envelopeSHA256")}}
            with patch.object(job, "ROOT", root), patch.object(runtime.InstalledRuntime, "execute", side_effect=AssertionError("read launched model")):
                self.assertEqual(job.command(frame)["receipt"], receipt)
                frame["operation"] = "readArtifacts"
                artifacts = job.command(frame)["artifacts"]
                self.assertEqual([base64.b64decode(item["byteBase64"]) for item in artifacts], [raw, crop])
                frame["nonce"] = str(uuid.uuid4())
                with self.assertRaisesRegex(ValueError, "NATIVE_STATUS_BINDING"):
                    job.command(frame)
                frame["nonce"] = receipt["nonce"]
                (output / "raw.png").unlink()
                (output / "raw.png").symlink_to(output / "crop-RGB.png")
                with self.assertRaisesRegex(ValueError, "NATIVE_ARTIFACT_PATH"):
                    job.command(frame)
                frame["operation"] = "status"
                config = root / request["requestId"] / "config.json"
                config.unlink()
                job.exclusive(config, b"changed")
                with self.assertRaisesRegex(ValueError, "NATIVE_CONFIG_HASH"):
                    job.command(frame)

    def test_native_execute_reference_namespace_both_recipes(self):
        from PIL import Image

        class ImageConfig:
            def __init__(self, **values):
                self.__dict__.update(values)
                for key in ("ctrl_img", "ctrl_img_1", "ctrl_img_2", "ctrl_img_3", "latents", "adapter_image_path"):
                    setattr(self, key, None)

        class Model:
            def __init__(self, merged=False):
                self.network = types.SimpleNamespace(is_merged_in=merged, can_merge_in=False)
                self.calls = 0
                self.pipeline = None

            def generate_images(self, images, *, pipeline):
                self.calls += 1
                self.pipeline = pipeline
                Image.new("RGB", (352, 512), (17, 42, 91)).save(images[0].output_path)

        module = types.ModuleType("toolkit.config_modules")
        setattr(module, "GenerateImageConfig", ImageConfig)
        for recipe in ("recovery16-native-flow-source045-v1", "recovery16-native-flow-source025-v1"):
            for failure in (None, "source", "transform", "merged", "config"):
                with self.subTest(recipe=recipe, failure=failure), tempfile.TemporaryDirectory() as folder:
                    target = pathlib.Path(folder)
                    (target / "inputs").mkdir()
                    (target / "output").mkdir()
                    original = b"private-authority-fixture"
                    (target / "inputs" / "original.png").write_bytes(original)
                    request = envelope()
                    request.update(mode="reference-img2img", recipe=recipe)
                    request["snapshot"]["original"] = packed(original)
                    if failure == "source":
                        request["snapshot"]["original"]["sha256"] = "0" * 64
                    transform = {"rgb": base64.b64encode(b"cpu-transformed-source").decode(),
                                 "receipt": {"sourceSHA256": job.sha(original)}}
                    proof = {"compiled": {"text": runtime.reference.PROMPT,
                                          "promptSHA256": job.sha(runtime.reference.PROMPT.encode()), "fields": []},
                             "transform": copy.deepcopy(transform)}
                    if failure == "transform":
                        proof["transform"]["receipt"]["sourceSHA256"] = "0" * 64
                    if failure == "config":
                        proof["compiled"]["text"] = "not the fixed reference prompt"
                    model = Model(merged=failure == "merged")
                    original_path = list(sys.path)
                    try:
                        with patch.dict(sys.modules, {"toolkit": types.ModuleType("toolkit"), "toolkit.config_modules": module}), \
                             patch.object(runtime, "construct", return_value=(model, 336, ImageConfig)) as construct, \
                             patch.object(runtime.InstalledRuntime, "lease", return_value="cpu-lease"), \
                             patch.object(runtime.InstalledRuntime, "transform", return_value=transform) as transform_call, \
                             patch.object(runtime.reference, "load_native", return_value=object()):
                            if failure:
                                expected = {"source": "NATIVE_SOURCE_CHANGED", "transform": "NATIVE_TRANSFORM_CHANGED",
                                            "merged": "FLOATING_UNMERGED_NETWORK_REQUIRED", "config": "REFERENCE_GENERATION_CONFIG"}
                                with self.assertRaisesRegex(ValueError, expected[failure]):
                                    runtime.InstalledRuntime().execute(request, target, proof)
                                self.assertEqual(model.calls, 0)
                                if failure in ("source", "transform"):
                                    construct.assert_not_called()
                            else:
                                result = runtime.InstalledRuntime().execute(request, target, proof)
                                self.assertEqual(model.calls, 1)
                                construct.assert_called_once()
                                pipeline = model.pipeline
                                assert pipeline is not None
                                self.assertEqual(type(pipeline).__name__, "ReferencePipeline")
                                self.assertEqual(pipeline.recipe, recipe)
                                self.assertEqual(pipeline.binding, {})
                                namespace = pipeline.__class__.__init__.__globals__
                                self.assertIs(namespace["ReferencePipeline"], pipeline.__class__)
                                self.assertIs(namespace["generate_reference"].__globals__, namespace)
                                self.assertIsNot(namespace["verify_source"], runtime.reference.verify_source)
                                self.assertEqual(transform_call.call_count, 3)
                                self.assertTrue(result["noMerge"])
                                self.assertFalse(result["alphaFinished"])
                                with Image.open(target / "output" / "crop-RGB.png") as crop:
                                    self.assertEqual(crop.size, (340, 510))
                    finally:
                        sys.path[:] = original_path
        for name in ("torch", "transformers", "safetensors", "toolkit"):
            self.assertNotIn(name, sys.modules)

    def test_native_execute_token_geometry_and_post_merge_rejection(self):
        from PIL import Image
        class ImageConfig:
            def __init__(self, **values):
                self.__dict__.update(values)
                for key in ("ctrl_img", "ctrl_img_1", "ctrl_img_2", "ctrl_img_3", "latents", "adapter_image_path"):
                    setattr(self, key, None)
        class Model:
            def __init__(self, merge=False):
                self.network = types.SimpleNamespace(is_merged_in=False, can_merge_in=False)
                self.merge = merge
                self.calls = 0

            def generate_images(self, images):
                self.calls += 1
                Image.new("RGB", (352, 512), (17, 42, 91)).save(images[0].output_path)
                self.network.is_merged_in = self.merge
        module = types.ModuleType("toolkit.config_modules")
        module.GenerateImageConfig = ImageConfig
        package = types.ModuleType("toolkit")
        request = envelope()
        token = job.parse(base64.b64decode(request["snapshot"]["token"]["byteBase64"]))
        proof = {"compiled": runtime.compile_prompt(request, token)}
        for merge in (False, True):
            with self.subTest(merge=merge), tempfile.TemporaryDirectory() as folder:
                target = pathlib.Path(folder)
                (target / "output").mkdir()
                model = Model(merge)
                original_path = list(sys.path)
                try:
                    with patch.dict(sys.modules, {"toolkit": package, "toolkit.config_modules": module}), \
                         patch.object(runtime, "construct", return_value=(model, 336, ImageConfig)), \
                         patch.object(runtime.InstalledRuntime, "lease", return_value="cpu-lease"):
                        if merge:
                            with self.assertRaisesRegex(ValueError, "NATIVE_POST_MERGE"):
                                runtime.InstalledRuntime().execute(request, target, proof)
                            self.assertFalse((target / "output" / "crop-RGB.png").exists())
                        else:
                            result = runtime.InstalledRuntime().execute(request, target, proof)
                            self.assertTrue(result["noMerge"])
                            self.assertEqual(result["nativeTensorCount"], 336)
                            with Image.open(target / "output" / "crop-RGB.png") as crop:
                                self.assertEqual(crop.size, (340, 510))
                                self.assertEqual(crop.getpixel((0, 0)), (17, 42, 91))
                        self.assertEqual(model.calls, 1)
                finally:
                    sys.path[:] = original_path


if __name__ == "__main__":
    unittest.main()
