"""Actual runtime -> pinned observer -> original call, using CPU oracle doubles."""
import copy
import importlib.util
import pathlib
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
sys.path.insert(0, str(WORKER))
import runtime

spec = importlib.util.spec_from_file_location("oracle", WORKER.parent / "test/native-moss-token-observer.test.py")
if spec is None or spec.loader is None:
    raise RuntimeError("ORACLE_IMPORT")
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


class WiringTests(unittest.TestCase):
    def test_actual_observed_call_and_rejects_tamper(self):
        class ImageConfig:
            def __init__(self, **values):
                self.__dict__.update(values)
                for key in ("ctrl_img", "ctrl_img_1", "ctrl_img_2", "ctrl_img_3", "latents", "adapter_image_path"):
                    setattr(self, key, None)
        ns = oracle.namespace()
        installed = types.ModuleType("installed_pipeline")
        installed.__dict__.update(ns)
        installed.__file__ = str(WORKER.parents[2] / ".omo/evidence/style-chain/moss-lora-20261019/trainer-src/pipeline.py")
        module = types.ModuleType("toolkit.config_modules")
        setattr(module, "GenerateImageConfig", ImageConfig)
        for change in (None, "missing", "shape", "schedule", "source"):
            with self.subTest(change=change), tempfile.TemporaryDirectory() as folder:
                model = oracle.Model()
                model.transformer = oracle.Transformer(model)
                calls = []
                def generate(images, *, pipeline):
                    calls.append(pipeline)
                    image = images[0]
                    output = pipeline(types.SimpleNamespace(text_embeds=["positive"]),
                                      types.SimpleNamespace(text_embeds=["negative"]), height=image.height, width=image.width,
                                      num_inference_steps=image.num_inference_steps, guidance_scale=image.guidance_scale,
                                      generator=oracle.Generator(image.seed), shift=5.0, uncond_skip_layers=(22,),
                                      latents=None, ref_latents=None, isolate_refs=False)
                    output[0].save(image.output_path)
                    if change == "missing": pipeline.receipt = None
                    elif change == "shape": pipeline.receipt["noise"]["shape"] = [1]
                    elif change == "schedule": pipeline.receipt["fullSigmas"][1] = 1
                    elif change == "source": pipeline.receipt["pipelineSourceSHA256"] = "0" * 64
                model.generate_images = generate
                target = pathlib.Path(folder)
                (target / "output").mkdir()
                proof = {"compiled": {"text": "fixture", "promptSHA256": runtime.sha(b"fixture"), "fields": []}}
                proof["context"] = {"maxTextLength": 4096, "truncation": False}
                proof["terminalReceiptSHA256"] = "a" * 64
                proof["runtimeAttestation"] = {"schema": "native-moss-runtime-proof.v1",
                                               "compiled": proof["compiled"], "context": proof["context"]}
                before = list(sys.path)
                try:
                    with patch.dict(sys.modules, {"toolkit": types.ModuleType("toolkit"), "toolkit.config_modules": module}), \
                         patch.object(runtime, "construct", return_value=(model, 336, ImageConfig)), \
                         patch.object(runtime.InstalledRuntime, "lease", return_value="cpu"), \
                         patch.object(runtime.reference, "load_native", return_value=installed), \
                         patch.object(oracle.Tensor, "dtype", property(lambda self: "torch.float32")):
                        if change:
                            with self.assertRaises(ValueError):
                                runtime.InstalledRuntime().execute({"mode": "token-only", "recipe": "recovery16-native-token-v1"}, target, proof)
                            self.assertFalse((target / "output/crop-RGB.png").exists())
                        else:
                            result = runtime.InstalledRuntime().execute({"mode": "token-only", "recipe": "recovery16-native-token-v1"}, target, proof)
                            self.assertEqual(result["samplingCoverage"], {"status": "OBSERVED", "adoptionAllowed": True})
                            self.assertEqual(result["sampling"]["noise"]["shape"], [1, 128, 32, 22])
                            self.assertEqual(len(model.calls), 50)
                            self.assertEqual(len(calls), 1)
                finally:
                    sys.path[:] = before


if __name__ == "__main__":
    unittest.main()
