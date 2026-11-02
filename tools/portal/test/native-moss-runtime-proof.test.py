"""CPU-only runtime preflight proof fixtures; no toolkit, weights or GPU imports."""
import ast
import base64
import io
import importlib.util
import json
import pathlib
import struct
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
sys.path.insert(0, str(WORKER))
import runtime


class RuntimeProofTests(unittest.TestCase):
    def fixture(self, *, changed=False, context_change=None, newline="\n", invalid=None):
        token = {"personId": "person-1004", "characterId": "K1004", "identity": {"gender": "female"},
                 "slots": {"hair": {"color": "black"}}}
        request = {"mode": "token-only", "snapshot": {"personId": "person-1004"}}
        terminal = json.dumps({"state": "completed", "exitCode": 0, "steps": 1600,
                               "adapter": {"sha256": runtime.CONFIG["adapter_sha256"]}}).encode()
        source_pin = runtime.native.SOURCE_PINS["extensions_built_in/diffusion_models/moss_image/moss_image.py"]
        context = {"maxTextLength": 4096, "truncation": False, "modelLoaded": False,
                   "sourceSHA256": source_pin, "tokenizerPins": runtime.context.TOKENIZER_PINS,
                   "counts": [{"personId": "person-1004", "tokens": 123, "chatSHA256": "a" * 64},
                              {"personId": "negative", "tokens": 7, "chatSHA256": "b" * 64}]}
        if context_change:
            context.update(context_change)
        context["fixtureUnicode"] = "서울"
        response = (json.dumps(context, indent=2, ensure_ascii=False) + "\n").replace("\n", newline).encode("utf-8")
        if invalid is not None:
            response = invalid
        header = json.dumps({"__metadata__": {"training_info": json.dumps({"step": 1600})}}).encode()
        pins = {**runtime.native.SOURCE_PINS, **runtime.reference.SOURCE_PINS}
        def digest(path):
            value = str(path)
            for rel, pin in pins.items():
                if value.endswith(rel):
                    return pin
            return {**runtime.native.PINS, "adapter": runtime.CONFIG["adapter_sha256"]}[
                next(role for role in (*runtime.native.PINS, "adapter") if runtime.CONFIG[role] == value)]
        with patch.object(runtime, "TERMINAL", runtime.sha(terminal)), \
             patch.object(runtime.subprocess, "check_output", return_value=runtime.native.COMMIT), \
             patch.object(runtime.native, "digest", side_effect=digest), \
             patch.object(pathlib.Path, "stat", return_value=types.SimpleNamespace(st_size=148697488)), \
             patch.object(pathlib.Path, "read_bytes", return_value=terminal + (b" " if changed else b"")) as read, \
             patch("builtins.open", return_value=io.BytesIO(struct.pack("<Q", len(header)) + header)), \
             patch.object(runtime.native, "tensor_contract"), \
             patch.object(runtime.subprocess, "run", return_value=types.SimpleNamespace(stdout=response)) as run:
            proof = runtime.InstalledRuntime().preflight(request, token, {"token": b"retained-token", "detail": b"retained-detail"})
            self.assertEqual(read.call_count, 1)
            self.assertEqual(run.call_count, 1)
            self.assertIsInstance(run.call_args.kwargs["input"], bytes)
            self.assertNotIn("text", run.call_args.kwargs)
            self.assertNotIn("encoding", run.call_args.kwargs)
        return proof, terminal, response, token

    def test_measured_terminal_and_exact_context_bytes(self):
        proof, terminal, response, token = self.fixture()
        observed = proof["runtimeAttestation"]
        self.assertEqual(proof["terminalReceiptSHA256"], runtime.sha(terminal))
        self.assertEqual(base64.b64decode(observed["terminalReceipt"]), terminal)
        self.assertEqual(base64.b64decode(observed["contextResponse"]), response)
        self.assertEqual(observed["contextResponseSHA256"], runtime.sha(response))
        context_input = base64.b64decode(observed["contextInputBytes"])
        self.assertEqual(observed["contextInputSHA256"], runtime.sha(context_input))
        self.assertEqual(json.loads(context_input), observed["contextInput"])
        self.assertEqual(observed["context"], json.loads(response))
        self.assertEqual(observed["compiled"], runtime.content.compile_content(token))
        self.assertEqual(runtime.sha(observed["compiled"]["body"].encode()), observed["compiled"]["bodySHA256"])
        self.assertEqual(runtime.sha(observed["compiled"]["text"].encode()), observed["compiled"]["promptSHA256"])
        self.assertEqual(observed["contextInput"]["prompts"][0]["text"], observed["compiled"]["text"])
        self.assertEqual(observed["retainedSHA256"]["token"], runtime.sha(b"retained-token"))
        self.assertEqual(observed["sourcePins"], {**runtime.native.SOURCE_PINS, **runtime.reference.SOURCE_PINS})
        self.assertNotIn("exitCode", proof)
        self.assertNotIn("processStart", proof)

    def test_changed_terminal_and_wrong_context_reject(self):
        with self.assertRaisesRegex(ValueError, "NATIVE_INSTALLED_PIN"):
            self.fixture(changed=True)
        for change in ({"sourceSHA256": "0" * 64}, {"tokenizerPins": {}}, {"truncation": True},
                       {"counts": [{"personId": "wrong", "tokens": 1, "chatSHA256": "a" * 64}]}):
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, "NATIVE_CONTEXT"):
                self.fixture(context_change=change)

    def test_crlf_lf_exact_bytes_and_invalid_encoding(self):
        lf, _, lf_bytes, _ = self.fixture()
        crlf, _, crlf_bytes, _ = self.fixture(newline="\r\n")
        self.assertEqual(lf["context"], crlf["context"])
        self.assertNotEqual(lf_bytes, crlf_bytes)
        self.assertNotEqual(lf["runtimeAttestation"]["contextResponseSHA256"],
                            crlf["runtimeAttestation"]["contextResponseSHA256"])
        self.assertEqual(base64.b64decode(crlf["runtimeAttestation"]["contextResponse"]), crlf_bytes)
        with self.assertRaises(UnicodeDecodeError):
            self.fixture(invalid=b'{"x":"\xff"}')
        with self.assertRaises(json.JSONDecodeError):
            self.fixture(invalid=b'{\r\n invalid json\r\n}')

    def test_token_sampler_has_no_complete_observation_callback(self):
        source = WORKER.parents[2] / ".omo/evidence/style-chain/moss-lora-20261019/trainer-src/pipeline.py"
        raw = source.read_bytes()
        self.assertEqual(runtime.sha(raw), runtime.reference.SOURCE_PINS[
            "extensions_built_in/diffusion_models/moss_image/src/pipeline.py"])
        tree = ast.parse(raw)
        cls = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "MossImagePipeline")
        call = next(node for node in cls.body if isinstance(node, ast.FunctionDef) and node.name == "__call__")
        self.assertNotIn("callback", [arg.arg for arg in call.args.args])
        hooks = [node for node in ast.walk(call) if isinstance(node, ast.Call) and
                 isinstance(node.func, ast.Attribute) and node.func.attr == "_emit_sample_step"]
        self.assertEqual(len(hooks), 1)
        self.assertIsInstance(hooks[0].args[0], ast.BinOp)
        for name in ("torch", "transformers", "toolkit", "safetensors"):
            self.assertNotIn(name, sys.modules)

    def test_token_execute_rejects_missing_observation_before_return(self):
        from PIL import Image
        class ImageConfig:
            def __init__(self, **values):
                self.__dict__.update(values)
                for key in ("ctrl_img", "ctrl_img_1", "ctrl_img_2", "ctrl_img_3", "latents", "adapter_image_path"):
                    setattr(self, key, None)
        calls = []
        class Model:
            network = types.SimpleNamespace(is_merged_in=False, can_merge_in=False)
            def generate_images(self, images, *, pipeline):
                calls.append(images)
                Image.new("RGB", (352, 512), (17, 42, 91)).save(images[0].output_path)
        proof, _, _, _ = self.fixture()
        module = types.ModuleType("toolkit.config_modules")
        setattr(module, "GenerateImageConfig", ImageConfig)
        spec = importlib.util.spec_from_file_location("oracle", WORKER.parent / "test/native-moss-token-observer.test.py")
        if spec is None or spec.loader is None:
            raise RuntimeError("ORACLE_IMPORT")
        oracle = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(oracle)
        installed = types.ModuleType("installed_pipeline")
        installed.__dict__.update(oracle.namespace())
        installed.__file__ = str(WORKER.parents[2] / ".omo/evidence/style-chain/moss-lora-20261019/trainer-src/pipeline.py")
        before = list(sys.path)
        try:
            with tempfile.TemporaryDirectory() as folder, \
                 patch.dict(sys.modules, {"toolkit": types.ModuleType("toolkit"), "toolkit.config_modules": module}), \
                 patch.object(runtime.InstalledRuntime, "lease", return_value="cpu-only"), \
                 patch.object(runtime.reference, "load_native", return_value=installed), \
                 patch.object(runtime, "construct", return_value=(Model(), 336, ImageConfig)):
                target = pathlib.Path(folder)
                (target / "output").mkdir()
                with self.assertRaisesRegex(ValueError, "NATIVE_TOKEN_SAMPLING_PROOF_MISSING"):
                    runtime.InstalledRuntime().execute({"mode": "token-only", "recipe": "recovery16-native-token-v1"}, target, proof)
                self.assertEqual(len(calls), 1)
        finally:
            sys.path[:] = before


if __name__ == "__main__":
    unittest.main()
