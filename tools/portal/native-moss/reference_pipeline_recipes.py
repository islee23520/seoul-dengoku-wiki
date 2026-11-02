"""Isolated reference-only candidate. Importing this module does not import torch.

Caller owns terminal adapter/model verification and floating LoRA attachment.
No model load, installation, network, fallback or command-line generation entry.
"""
import base64
import hashlib
import importlib
import io
import json
import pathlib
import re
import subprocess

RECIPE = "recovery16-native-flow-source045-v1"
RECIPE025 = "recovery16-native-flow-source025-v1"


def recipe_values(recipe):
    if recipe == RECIPE:
        return 0.45, 55
    if recipe == RECIPE025:
        return 0.25, 100
    raise ValueError("UNKNOWN_REFERENCE_RECIPE")
SEED = 152995270030802
PROMPT = ("seoul dengoku portrait style, preserve the source person, outfit, "
          "composition and gaze; change only the drawing style")
SOURCE_PINS = {
    "extensions_built_in/diffusion_models/moss_image/src/pipeline.py": "6440f4629245063f82f033f120356e0f54946ef5a877e73c469d63041fd267bb",
    "extensions_built_in/diffusion_models/moss_image/moss_image.py": "da48fcb10a64d80cc6c3394736094a66e58fc5fa4a27ff9dc6701059e27aecd7",
    "extensions_built_in/diffusion_models/moss_image/src/transformer.py": "d9b0918536b0ddc45ed138c48e712c7a2739c437bdbce40e660fd6049fe908c6",
    "toolkit/models/v2/vae/flux2_kl.py": "ccdf5a238ff95773d17376d571d1cb3b8af362a9043ac6a2cc6880f2fc5da9ef",
    "toolkit/models/base_model.py": "53ef134f030d026d6bf740489a113ff73ec9c2c95dea0975dadf4495ab9737e3",
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_native(toolkit):
    """Call only in the later integrated runtime; no model is constructed here."""
    root = pathlib.Path(toolkit).resolve()
    for rel, pin in SOURCE_PINS.items():
        if sha((root / rel).read_bytes()) != pin:
            raise ValueError("NATIVE_SOURCE_DRIFT: " + rel)
    module = importlib.import_module("extensions_built_in.diffusion_models.moss_image.src.pipeline")
    if module.__file__ is None or pathlib.Path(module.__file__).resolve() != root / "extensions_built_in/diffusion_models/moss_image/src/pipeline.py":
        raise ValueError("NATIVE_IMPORT_ROOT")
    return module


def verify_source(binding):
    """Re-read immutable selected wiki artifacts and reuse the existing transform."""
    selected = binding["selected"]
    if (set(selected) != {"kind", "personId", "sourceSHA256"} or
            selected["kind"] != "selected" or
            not re.fullmatch(r"person-[0-9]+", selected["personId"]) or
            binding["explicitEdits"] != []):
        raise ValueError("PRESERVE_ONLY_SELECTED_SOURCE_REQUIRED")
    payload = {"selected": selected, "explicitEdits": [], "worktree": binding["worktree"]}
    for role, pin in (("original", selected["sourceSHA256"]),
                      ("token", binding["tokenSHA256"]), ("detail", binding["detailSHA256"])):
        data = pathlib.Path(binding[role + "Path"]).read_bytes()
        if sha(data) != pin:
            raise ValueError("SOURCE_HASH_MISMATCH: " + role)
        payload[role] = base64.b64encode(data).decode("ascii")
        if role != "original":
            payload[role + "SHA256"] = pin
    bridge = pathlib.Path(__file__).with_name("transform-source.ts")
    result = subprocess.run([binding["bun"], str(bridge)], input=json.dumps(payload),
                            text=True, capture_output=True, check=True)
    proof = json.loads(result.stdout)
    rgb = base64.b64decode(proof.pop("rgb"), validate=True)
    receipt = proof["receipt"]
    if (proof["originalSHA256"] != selected["sourceSHA256"] or
            proof["personId"] != selected["personId"] or
            receipt["sourceSHA256"] != selected["sourceSHA256"] or
            receipt["rgbSHA256"] != sha(rgb) or
            (receipt["width"], receipt["height"]) != (352, 512) or
            receipt["computationalContentRect"] != {"x": 6, "y": 1, "width": 340, "height": 510} or
            receipt["matte"] != [224, 226, 228] or receipt["crop"] is not None):
        raise ValueError("TRANSFORM_BINDING_MISMATCH")
    return rgb, proof


def tensor_receipt(tensor):
    """Canonical little-endian FP32 hash; source dtype is retained separately."""
    array = tensor.detach().float().cpu().contiguous().numpy().astype("<f4", copy=False)
    return {"shape": list(tensor.shape), "sourceDtype": str(tensor.dtype),
            "hashDtype": "little-endian-float32", "sha256": sha(array.tobytes())}


def active_schedule(native, recipe=RECIPE):
    _, full_steps = recipe_values(recipe)
    full = native.moss_sigmas(full_steps, shift=5.0).to(device="cpu", dtype=native.torch.float32)
    active = full[-26:]
    if (len(full) != full_steps + 1 or len(active) != 26 or not native.torch.isfinite(full).all() or
            not bool((full[:-1] > full[1:]).all()) or float(full[0]) != 1.0 or
            float(active[-1]) != 0.0 or not 0 < float(active[0]) < 1):
        raise ValueError("REFERENCE_RECIPE_SCHEDULE")
    return full, active


def flow_initial(clean, noise, sigma):
    return (1.0 - sigma) * clean.float() + sigma * noise.float()


class ReferencePipeline:
    def __init__(self, model, binding, native, recipe=RECIPE):
        recipe_values(recipe)
        self.recipe = recipe
        self.model = model
        self.binding = json.loads(json.dumps(binding))
        self.native = native
        self.receipt = None
        # Runs before the caller invokes BaseModel.generate_images.
        verify_source(self.binding)

    @property
    def device(self):
        return self.model.device_torch

    def to(self, *args, **kwargs):
        return self

    def set_progress_bar_config(self, **kwargs):
        pass

    def __call__(self, conditional_embeds, unconditional_embeds, height=512, width=352,
                 num_inference_steps=25, guidance_scale=2.5, latents=None,
                 generator=None, shift=5.0, uncond_skip_layers=(22,),
                 ref_latents=None, isolate_refs=False, **kwargs):
        torch = self.native.torch
        with torch.no_grad():
            return self._sample(conditional_embeds, unconditional_embeds, height, width,
                                num_inference_steps, guidance_scale, latents, generator,
                                shift, uncond_skip_layers, ref_latents, isolate_refs, kwargs)

    def _sample(self, conditional, unconditional, height, width, steps, cfg, latents,
                generator, shift, skip, refs, isolate, kwargs):
        native, model = self.native, self.model
        torch, device = native.torch, model.device_torch
        rgb, source_proof = verify_source(self.binding)
        if ((height, width, steps, cfg, shift, tuple(skip)) != (512, 352, 25, 2.5, 5.0, (22,)) or
                latents is not None or refs is not None or isolate or kwargs or
                model.is_edit or unconditional is None or generator is None or
                generator.initial_seed() != SEED or str(generator.device) != "cpu" or
                len(conditional.text_embeds) != 1 or len(unconditional.text_embeds) != 1):
            raise ValueError("REFERENCE_RESOLVED_CONFIG")
        fresh = torch.Generator(device="cpu").manual_seed(SEED)
        if not torch.equal(generator.get_state(), fresh.get_state()):
            raise ValueError("GENERATOR_ALREADY_CONSUMED")
        network = model.network
        if (network is None or network.can_merge_in or network.is_merged_in or
                not network.is_active or network.multiplier != 1.0 or
                any(p.dtype != torch.float32 for p in network.parameters())):
            raise ValueError("FLOATING_UNMERGED_NETWORK_REQUIRED")
        full, active = active_schedule(native, self.recipe)
        from PIL import Image
        import numpy as np
        image = Image.open(io.BytesIO(rgb))
        if image.mode != "RGB" or image.size != (352, 512):
            raise ValueError("RGB_GEOMETRY")
        pixels = torch.from_numpy(np.array(image, copy=True)).permute(2, 0, 1)
        chw = pixels.to(device=device, dtype=torch.float32) / 127.5 - 1.0
        # encode_images owns VAE mean, 2x2 packing and BN. Never repack/rescale.
        clean = model.encode_images([chw], device=device, dtype=torch.float32)
        if tuple(clean.shape) != (1, 128, 32, 22) or not torch.isfinite(clean).all():
            raise ValueError("SOURCE_LATENT_GEOMETRY_OR_FINITE")
        before_cast = tensor_receipt(clean)
        clean = clean.to(device=device, dtype=torch.float32)
        rng_before = sha(generator.get_state().numpy().tobytes())
        noise = native.randn_tensor(clean.shape, generator=generator, device=device, dtype=torch.float32)
        x = flow_initial(clean, noise, active[0].to(device))
        receipt = {"recipe": self.recipe, "denoise": recipe_values(self.recipe)[0], "seed": SEED,
                   "source": source_proof, "vaeDtype": str(model.vae.dtype),
                   "vaeEncodingCast": {"input": "torch.float32", "internal": str(model.vae.dtype), "returned": str(clean.dtype)},
                   "sourceLatentBeforeCast": before_cast, "sourceLatent": tensor_receipt(clean),
                   "noise": tensor_receipt(noise), "initial": tensor_receipt(x),
                   "fullSigmas": full.tolist(), "activeSigmas": active.tolist(),
                   "fullSigmaTensor": tensor_receipt(full), "activeSigmaTensor": tensor_receipt(active),
                   "generatorDevice": str(generator.device), "generatorStateBefore": rng_before,
                   "generatorStateAfter": sha(generator.get_state().numpy().tobytes()),
                   "torchVersion": torch.__version__, "device": str(device),
                   "packing": "native-VAE-c-pi-pj-BN-no-extra-scale", "transitions": 25}
        cond, cond_mask = native.stack_text_embeds(conditional.text_embeds, device, model.torch_dtype)
        uncond, uncond_mask = native.stack_text_embeds(unconditional.text_embeds, device, model.torch_dtype)
        active = active.to(device)
        for index in range(25):
            sigma, next_sigma = active[index], active[index + 1]
            timestep = (sigma * 1000).reshape(1)
            pred = model.transformer(x, timestep, cond, cond_mask, ref_kv_cache=None).float()
            negative = model.transformer(x, timestep, uncond, uncond_mask,
                                         skip_layers=skip, ref_kv_cache=None).float()
            pred = negative + cfg * (pred - negative)
            if getattr(model, "sample_step_hook", None) is not None:
                model._emit_sample_step(x - sigma * pred, index, 25)
            x = x + (next_sigma - sigma) * pred
        if not torch.isfinite(x).all():
            raise ValueError("NONFINITE_RESULT")
        receipt["finalLatent"] = tensor_receipt(x)
        images = model.decode_latents(x, device=device, dtype=torch.float32)
        images = ((images.float().clamp(-1, 1) + 1) * 127.5).round().to(torch.uint8)
        images = images.permute(0, 2, 3, 1).cpu().numpy()
        self.receipt = receipt
        return [Image.fromarray(arr) for arr in images]


def generate_reference(model, image_configs, pipeline):
    """Integration boundary: source failure causes zero generate_images calls."""
    verify_source(pipeline.binding)
    if model is not pipeline.model or len(image_configs) != 1:
        raise ValueError("ONE_BOUND_REFERENCE_REQUIRED")
    image = image_configs[0]
    expected = {"prompt": PROMPT, "negative_prompt": "", "width": 352, "height": 512,
                "num_inference_steps": 25, "guidance_scale": 2.5, "seed": SEED,
                "network_multiplier": 1.0, "latents": None, "ctrl_img": None,
                "ctrl_img_1": None, "ctrl_img_2": None, "ctrl_img_3": None,
                "adapter_image_path": None}
    if any(getattr(image, key) != value for key, value in expected.items()):
        raise ValueError("REFERENCE_GENERATION_CONFIG")
    # BaseModel may merge before invoking the pipeline. Reject before entry.
    if model.network is None or model.network.can_merge_in or model.network.is_merged_in:
        raise ValueError("FLOATING_UNMERGED_NETWORK_REQUIRED")
    return model.generate_images(image_configs, pipeline=pipeline)
