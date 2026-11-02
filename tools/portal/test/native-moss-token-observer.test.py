"""CPU NumPy oracle executes pinned original AST and additive observed AST."""
import ast
import hashlib
import importlib.util
import pathlib
import types
import unittest
from typing import List, Optional, Sequence

import numpy as np
from numpy.typing import DTypeLike
from PIL import Image

WORKER = pathlib.Path(__file__).resolve().parents[1] / "native-moss"
spec = importlib.util.spec_from_file_location("observer", WORKER / "token_pipeline_observed.py")
if spec is None or spec.loader is None:
    raise RuntimeError("OBSERVER_IMPORT")
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)
SOURCE = (WORKER.parents[2] / ".omo/evidence/style-chain/moss-lora-20261019/trainer-src/pipeline.py").read_bytes()


class Tensor:
    def __init__(self, value, dtype: DTypeLike = np.float32):
        self.data = np.asarray(value, dtype=dtype)

    @property
    def shape(self):
        return self.data.shape

    @property
    def dtype(self):
        return str(self.data.dtype)

    def detach(self): return self
    def cpu(self): return self
    def contiguous(self): return self
    def numpy(self): return self.data
    def tolist(self): return self.data.tolist()
    def float(self): return Tensor(self.data, np.float32)
    def to(self, *args, **kwargs):
        dtype = kwargs.get("dtype")
        if args and args[-1] in ("float32", "uint8", "int64"):
            dtype = args[-1]
        return Tensor(self.data, dtype or self.data.dtype)
    def flip(self, axis): return Tensor(np.flip(self.data, axis))
    def clamp(self, low=None, high=None, **kwargs):
        return Tensor(np.clip(self.data, kwargs.get("min", low), kwargs.get("max", high)), self.data.dtype)
    def abs(self): return Tensor(np.abs(self.data))
    def new_zeros(self, n): return Tensor(np.zeros(n))
    def reshape(self, *shape): return Tensor(self.data.reshape(*shape))
    def permute(self, *axes): return Tensor(self.data.transpose(axes), self.data.dtype)
    def round(self): return Tensor(np.round(self.data))
    def __len__(self): return len(self.data)
    def __getitem__(self, key):
        return Tensor(self.data[key.data.astype(int) if isinstance(key, Tensor) else key], self.data.dtype)
    def __add__(self, other): return Tensor(self.data + unwrap(other))
    __radd__ = __add__
    def __sub__(self, other): return Tensor(self.data - unwrap(other))
    def __rsub__(self, other): return Tensor(unwrap(other) - self.data)
    def __mul__(self, other): return Tensor(self.data * unwrap(other))
    __rmul__ = __mul__
    def __truediv__(self, other): return Tensor(self.data / unwrap(other))
    def __le__(self, other): return self.data <= unwrap(other)


def unwrap(value):
    return value.data if isinstance(value, Tensor) else value


class Generator:
    device = "cpu"
    def __init__(self, seed):
        self.seed = seed
        self.draws = 0
        self.rng = np.random.default_rng(seed)
    def initial_seed(self): return self.seed
    def get_state(self):
        # Exact serialized fake RNG state; querying never draws.
        import json
        return Tensor(np.frombuffer(json.dumps(self.rng.bit_generator.state, sort_keys=True).encode(), dtype=np.uint8), np.uint8)


def namespace():
    torch = types.SimpleNamespace(
        float32="float32", uint8="uint8", Tensor=Tensor, Generator=Generator,
        device=str, dtype=str, no_grad=lambda: lambda fn: fn,
        linspace=lambda a, b, n: Tensor(np.linspace(a, b, n, dtype=np.float32)),
        searchsorted=lambda a, b: Tensor(np.searchsorted(a.data, b.data), np.int64),
        where=lambda condition, a, b: Tensor(np.where(condition, a.data, b.data), np.int64),
        unique_consecutive=lambda a: Tensor(a.data[np.r_[True, a.data[1:] != a.data[:-1]]]),
        cat=lambda arrays: Tensor(np.concatenate([a.data for a in arrays])),
    )
    def randn(shape, *, generator, device, dtype):
        generator.draws += 1
        return Tensor(generator.rng.standard_normal(shape, dtype=np.float32))
    ns = {"torch": torch, "Image": Image, "List": List, "Optional": Optional, "Sequence": Sequence,
          "DEFAULT_SHIFT": 5.0, "DEFAULT_GUIDANCE": 3.0, "DEFAULT_STEPS": 30,
          "DEFAULT_UNCOND_SKIP_LAYERS": (22,), "NUM_TRAIN_TIMESTEPS": 1000,
          "randn_tensor": randn, "stack_text_embeds": lambda values, device, dtype: (values[0], "mask")}
    tree = ast.parse(SOURCE)
    nodes: list[ast.stmt] = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "moss_sigmas" or
             isinstance(n, ast.ClassDef) and n.name == "MossImagePipeline"]
    exec(compile(ast.Module(body=nodes, type_ignores=[]), "<original-pinned-token>", "exec"), ns)
    return ns


class Model:
    device_torch = "cpu"
    torch_dtype = "bfloat16"
    sample_step_hook = True
    def __init__(self):
        self.network = types.SimpleNamespace(can_merge_in=False, is_merged_in=False)
        self.calls = []
        self.previews = []
        self.decoded = None
        self.transformer = self.predict
    def predict(self, latents, timestep, cond, mask, **kwargs):
        self.calls.append((observer.tensor_receipt(latents), float(timestep.data[0]), cond, mask, kwargs))
        return Tensor(latents.data * np.float32(0.125) + np.float32(0.03 if cond == "positive" else -0.02))
    def _emit_sample_step(self, value, index, steps):
        self.previews.append((observer.tensor_receipt(value), index, steps))
    def decode_latents(self, value, **kwargs):
        self.decoded = (observer.tensor_receipt(value), kwargs)
        return Tensor(value.data[:, :3].repeat(16, axis=2).repeat(16, axis=3))


class Transformer:
    def __init__(self, model):
        self.model = model
        self.params = types.SimpleNamespace(latent_channels=128)
    def __call__(self, *args, **kwargs): return self.model.predict(*args, **kwargs)


class TokenObserverTests(unittest.TestCase):
    def test_original_and_observed_actual_ast_parity(self):
        self.assertEqual(hashlib.sha256(SOURCE).hexdigest(), observer.SOURCE_PIN)
        ns = namespace()
        originals = []
        for observed in (False, True):
            model = Model()
            model.transformer = Transformer(model)
            generator = Generator(152995270030802)
            before = generator.get_state().numpy().tobytes()
            cls = observer.observed_class(SOURCE, ns) if observed else ns["MossImagePipeline"]
            pipeline = cls(model)
            images = pipeline(types.SimpleNamespace(text_embeds=["positive"]),
                              types.SimpleNamespace(text_embeds=["negative"]), height=512, width=352,
                              num_inference_steps=25, guidance_scale=2.5, latents=None, generator=generator,
                              shift=5.0, uncond_skip_layers=(22,), ref_latents=None, isolate_refs=False)
            originals.append((np.array(images[0]), model, generator, pipeline))
            self.assertNotEqual(before, generator.get_state().numpy().tobytes())
        plain, seen = originals
        np.testing.assert_array_equal(plain[0], seen[0])
        self.assertEqual(plain[1].calls, seen[1].calls)
        self.assertEqual(len(seen[1].calls), 50)
        self.assertEqual(plain[1].previews, seen[1].previews)
        self.assertEqual(plain[1].decoded, seen[1].decoded)
        self.assertEqual(plain[2].draws, 1)
        self.assertEqual(seen[2].draws, 1)
        self.assertEqual(plain[2].get_state().numpy().tobytes(), seen[2].get_state().numpy().tobytes())
        receipt = seen[3].receipt
        self.assertEqual(receipt["noise"], receipt["initial"])
        self.assertEqual(receipt["initial"], seen[1].calls[0][0])
        self.assertEqual(receipt["finalLatent"], seen[1].decoded[0])
        sigmas = ns["moss_sigmas"](25, shift=5.0)
        self.assertEqual(receipt["sigmas"], observer.tensor_receipt(sigmas))
        self.assertEqual(receipt["fullSigmas"], sigmas.tolist())
        self.assertEqual(receipt["activeSigmas"], receipt["fullSigmas"])
        self.assertEqual(receipt["transitions"], 25)
        self.assertEqual(receipt["noise"]["shape"], [1, 128, 32, 22])
        self.assertEqual(receipt["noise"]["sourceDtype"], "float32")
        # Hash values are independently computed from deterministic actual fake
        # generator bytes, not copied from the receipt or a registered seed hash.
        oracle_rng = np.random.default_rng(152995270030802)
        noise = oracle_rng.standard_normal((1, 128, 32, 22), dtype=np.float32)
        self.assertEqual(receipt["noise"]["sha256"], hashlib.sha256(noise.astype("<f4").tobytes()).hexdigest())
        self.assertEqual(receipt["generatorStateAfter"], hashlib.sha256(seen[2].get_state().numpy().tobytes()).hexdigest())

    def test_drift_unsupported_api_and_failed_call_never_publish_receipt(self):
        with self.assertRaisesRegex(ValueError, "TOKEN_PIPELINE_SOURCE_DRIFT"):
            observer.observed_class(SOURCE + b"\n", namespace())
        ns = namespace()
        model = Model()
        model.transformer = Transformer(model)
        pipeline = observer.observed_class(SOURCE, ns)(model)
        values = dict(height=512, width=352, num_inference_steps=25, guidance_scale=2.5,
                      generator=Generator(152995270030802), shift=5.0, uncond_skip_layers=(22,))
        with self.assertRaisesRegex(ValueError, "TOKEN_OBSERVATION_CONFIG"):
            pipeline(None, None, **values)
        self.assertIsNone(pipeline.receipt)
        self.assertEqual(model.calls, [])
        model.decode_latents = lambda *a, **k: (_ for _ in ()).throw(ValueError("DECODE_FAILED"))
        with self.assertRaisesRegex(ValueError, "DECODE_FAILED"):
            pipeline(types.SimpleNamespace(text_embeds=["positive"]), types.SimpleNamespace(text_embeds=["negative"]), **values)
        self.assertIsNone(pipeline.receipt)


if __name__ == "__main__":
    unittest.main()
