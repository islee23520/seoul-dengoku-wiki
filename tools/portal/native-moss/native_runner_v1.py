"""Isolated native token inference. Preflight is stdlib-only; generation is explicit."""
import argparse
import hashlib
import json
import os
import pathlib
import re
import struct
import subprocess
import sys
import urllib.request

COMMIT = "8cf43dd2cc1fe828884001aceeda044649d9abd0"
PINS = {
    "base": "b4d1475bc7eeffd7b809e82ea13a1fba1fb85c4e18365af3813722faa5c0fe4f",
    "encoder": "32e3787472f708fa5f83624acbf5ef23f7fc89c439e05065ea57cfe5a97f025a",
    "vae": "d8d52ba036475f5fb07c8b435e176d3d97ebfa82f0d1a1c317f9cc1e25bd013b",
}
SOURCE_PINS = {
    "toolkit/models/base_model.py": "53ef134f030d026d6bf740489a113ff73ec9c2c95dea0975dadf4495ab9737e3",
    "toolkit/lora_special.py": "dcca49bceb2b5660cd14a53c15ffd0d38ff6a07eb1630f6f69b729132f9d385e",
    "toolkit/network_mixins.py": "0c1b621503231a9a7f165f7631ff34f7a888857a6ea0969190d6c05ae50f3e8f",
    "extensions_built_in/diffusion_models/moss_image/moss_image.py": "da48fcb10a64d80cc6c3394736094a66e58fc5fa4a27ff9dc6701059e27aecd7",
}


def digest(path):
    with pathlib.Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def tensor_contract(header):
    expected = {}
    for layer in range(42):
        for projection in ("q", "k", "v", "o", "ffn_up_gate", "ffn_down"):
            prefix = f"diffusion_model.layers.{layer}.proj.{projection}"
            inputs = 8192 if projection == "ffn_down" else 3072
            outputs = 16384 if projection == "ffn_up_gate" else 3072
            expected[prefix + ".lora_A.weight"] = [32, inputs]
            expected[prefix + ".lora_B.weight"] = [outputs, 32]
    actual = {k: v for k, v in header.items() if k != "__metadata__"}
    if set(actual) != set(expected):
        raise ValueError("ADAPTER_KEY_SET")
    for key, shape in expected.items():
        if actual[key]["shape"] != shape or actual[key]["dtype"] != "F16":
            raise ValueError("ADAPTER_SHAPE_OR_DTYPE")
    return expected


def native_key(key):
    key = key.replace("lora_A", "lora_down").replace("lora_B", "lora_up")
    return key.replace(".", "$$").replace("$$lora_down$$", ".lora_down.").replace("$$lora_up$$", ".lora_up.")


def converted_binding(model, weights, current):
    # The installed MOSS converter owns prefix translation and QKV fusion.
    converted = model.convert_lora_weights_before_load(weights)
    expected = {native_key(k): v for k, v in converted.items()}
    actual = {k: v for k, v in current.items() if k.endswith((".lora_down.weight", ".lora_up.weight"))}
    if len(expected) != 336 or set(expected) != set(actual):
        raise ValueError("NETWORK_KEY_BINDING")
    if any(tuple(value.shape) != tuple(actual[key].shape) for key, value in expected.items()):
        # Independent Q/K/V A tensors legitimately convert to rank96. They
        # cannot fit this rank32 network without the loader shrinking weights.
        raise ValueError("CONVERTED_SHAPE_REQUIRES_RESIZE")
    return expected


def prompt_contract(config, prompt, fetch):
    text = prompt["text"]
    if "--" in text or text != text.strip():
        raise ValueError("PROMPT_FLAGS_OR_WHITESPACE")
    if config["steps"] != 25 or config["cfg"] != 2.5 or type(prompt["seed"]) is not int or not 0 <= prompt["seed"] < 2**63:
        raise ValueError("FIXED_GENERATION_PARAMETERS")
    evidence = prompt["liveWiki"]
    identity = prompt["personId"]
    origin = "https://sss.linalab.io/wiki/"
    bodies = {}
    for role, suffix in (("token", "portrait-tokens/"), ("detail", "person-details/")):
        url = origin + suffix + identity + ".json"
        if evidence[role + "URL"] != url:
            raise ValueError("LIVE_WIKI_URL_BINDING")
        retained = pathlib.Path(evidence[role + "Path"]).read_bytes()
        pin = evidence[role + "SHA256"]
        if hashlib.sha256(retained).hexdigest() != pin or fetch(url) != retained:
            raise ValueError("LIVE_WIKI_BYTES_CHANGED")
        bodies[role] = json.loads(retained)
    token, detail = bodies["token"], bodies["detail"]
    if token["personId"] != identity or detail["id"] != identity or token["characterId"] != detail["characterId"] or token["name"] != detail["name"]:
        raise ValueError("LIVE_WIKI_PERSON_BINDING")
    if hashlib.sha256(text.encode("utf-8")).hexdigest() != evidence["compiledPromptSHA256"] or evidence["compiledPrompt"] != text or not evidence["compiler"]:
        raise ValueError("COMPILED_PROMPT_BINDING")
    return {"personId": identity, "text": text, "seed": prompt["seed"], "liveWiki": evidence}


class NoWikiRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("LIVE_WIKI_REDIRECT")


def fetch_wiki(url, open_url=None):
    if not re.fullmatch(r"https://sss\.linalab\.io/wiki/(portrait-tokens|person-details)/person-[0-9]+\.json", url):
        raise ValueError("LIVE_WIKI_URL_BINDING")
    if open_url is None:
        opener = urllib.request.build_opener(NoWikiRedirect())
        opener.addheaders = [("User-Agent", "Mozilla/5.0 recovery16-native-preflight"), ("Accept", "application/json")]
        open_url = opener.open
    with open_url(url, timeout=15) as response:
        if response.geturl() != url:
            raise ValueError("LIVE_WIKI_REDIRECT")
        data = response.read((2 << 20) + 1)
        if len(data) > 2 << 20:
            raise ValueError("LIVE_WIKI_TOO_LARGE")
        return data


def resolved_config(image, config, prompt):
    expected = {"prompt": prompt["text"], "negative_prompt": config["negative"], "width": 352, "height": 512, "num_inference_steps": 25, "guidance_scale": 2.5, "seed": prompt["seed"], "network_multiplier": 1.0, "ctrl_img": None, "ctrl_img_1": None, "ctrl_img_2": None, "ctrl_img_3": None, "latents": None, "adapter_image_path": None}
    if any(getattr(image, key) != value for key, value in expected.items()):
        raise ValueError("RESOLVED_GENERATION_CONFIG_CHANGED")
    return expected


def preflight(config):
    root = pathlib.Path(config["toolkit"])
    if subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"], text=True).strip() != COMMIT:
        raise ValueError("TRAINER_REVISION")
    for rel, pin in SOURCE_PINS.items():
        if digest(root / rel) != pin:
            raise ValueError("SOURCE_DRIFT: " + rel)
    for role, pin in PINS.items():
        if digest(config[role]) != pin:
            raise ValueError("MODEL_PIN: " + role)
    adapter = pathlib.Path(config["adapter"])
    if not config["adapter_sha256"] or digest(adapter) != config["adapter_sha256"]:
        raise ValueError("TERMINAL_ADAPTER_BINDING_REQUIRED")
    terminal = json.loads(pathlib.Path(config["terminal_receipt"]).read_text(encoding="utf-8"))
    if terminal.get("state") != "completed" or terminal.get("exitCode") != 0 or terminal.get("steps") != 1600:
        raise ValueError("TRAINING_NOT_TERMINAL")
    if terminal["adapter"]["sha256"] != config["adapter_sha256"]:
        raise ValueError("TERMINAL_ADAPTER_MISMATCH")
    with adapter.open("rb") as stream:
        header = json.loads(stream.read(struct.unpack("<Q", stream.read(8))[0]))
    tensor_contract(header)
    if json.loads(header["__metadata__"]["training_info"])["step"] != 1600:
        raise ValueError("ADAPTER_STEP")
    if config["mode"] != "token-only" or config["width"] != 352 or config["height"] != 512:
        raise ValueError("ONLY_TOKEN_352512_SUPPORTED")
    if not config["prompts"] or any(not p["text"].startswith("seoul dengoku portrait style,") for p in config["prompts"]):
        raise ValueError("BOUND_LIVE_TOKEN_PROMPTS_REQUIRED")
    ids = [p["personId"] for p in config["prompts"]]
    if len(ids) != len(set(ids)) or any(i not in {"person-1003", "person-1008", "person-1004", "person-1005"} for i in ids):
        raise ValueError("HELDOUT_PERSON_ID_REQUIRED")
    if pathlib.Path(config["output"]).exists():
        raise ValueError("FRESH_OUTPUT_REQUIRED")
    provenance = [prompt_contract(config, p, fetch_wiki) for p in config["prompts"]]
    return {"adapter_sha256": config["adapter_sha256"], "tensorCount": 504, "modelPins": PINS, "prompts": provenance, "boundConfigSHA256": hashlib.sha256(json.dumps(config, sort_keys=True, separators=(",", ":")).encode()).hexdigest()}


def generate(config, proof):
    # No runtime/model imports occur before explicit --generate and preflight.
    sys.path.insert(0, config["toolkit"])
    os.environ.update(HF_HOME="C:/Users/oliver/.cache/huggingface", HF_HUB_CACHE="C:/Users/oliver/.cache/huggingface/hub", HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1", TOKENIZERS_PARALLELISM="false")
    import torch
    from safetensors.torch import load_file
    from toolkit.config_modules import ModelConfig, NetworkConfig, GenerateImageConfig
    from toolkit.lora_special import LoRASpecialNetwork
    from extensions_built_in.diffusion_models.moss_image.moss_image import MossImageModel

    # Resolve the installed prompt parser before constructing/loading any model.
    output = pathlib.Path(config["output"])
    images = [GenerateImageConfig(prompt=p["text"], negative_prompt=config["negative"], width=352, height=512, num_inference_steps=25, guidance_scale=2.5, seed=p["seed"], network_multiplier=1.0, output_path=str(output / (p["personId"] + ".png"))) for p in config["prompts"]]
    effective = [resolved_config(image, config, p) for image, p in zip(images, config["prompts"])]
    # Recheck exact live bytes immediately before model construction/dispatch.
    for p in config["prompts"]:
        prompt_contract(config, p, fetch_wiki)
    mc = ModelConfig(arch="moss_image", name_or_path=config["base"], te_name_or_path=config["encoder"], vae_path=config["vae"], dtype="bf16", quantize=True, quantize_te=True, qtype="convrot8", qtype_te="convrot8", low_vram=True, layer_offloading=True, layer_offloading_transformer_percent=0.5, layer_offloading_text_encoder_percent=1.0)
    model = MossImageModel(device="cuda:0", model_config=mc, dtype="bf16", noise_scheduler=MossImageModel.get_train_scheduler())
    model.load_model()
    nc = NetworkConfig(type="lora", linear=32, linear_alpha=32)
    # Same constructor/attachment as BaseSDTrainProcess:1927-1984; no optimizer.
    network = LoRASpecialNetwork(text_encoder=model.text_encoder, unet=model.get_model_to_train(), lora_dim=nc.linear, alpha=nc.linear_alpha, multiplier=1.0, train_unet=True, train_text_encoder=False, conv_lora_dim=nc.conv, conv_alpha=nc.conv_alpha, dropout=nc.dropout, network_config=nc, network_type=nc.type, transformer_only=nc.transformer_only, is_transformer=model.is_transformer, base_model=model, target_lin_modules=model.target_lora_modules)
    network.force_to(model.device_torch, dtype=torch.float32)
    model.network = network
    network._update_torch_multiplier()
    network.apply_to(model.text_encoder, model.get_model_to_train(), False, True)
    network.can_merge_in = False
    weights = load_file(config["adapter"], device="cpu")
    current = network.state_dict()
    expected = converted_binding(model, weights, current)
    if any(not torch.isfinite(v).all().item() for v in weights.values()):
        raise ValueError("NONFINITE_ADAPTER")
    if any(not torch.isfinite(v).all().item() for v in expected.values()):
        raise ValueError("NONFINITE_CONVERTED_ADAPTER")
    extra = network.load_weights(weights)
    if extra or network.did_change_weights:
        raise ValueError("ADAPTER_LOAD_CHANGED_OR_EXTRA")
    current = network.state_dict()
    for key, value in expected.items():
        if not torch.equal(current[key].cpu(), value.float()):
            raise ValueError("ADAPTER_NOT_EXACTLY_LOADED")
    network.eval()
    if network.can_merge_in or network.is_merged_in:
        raise ValueError("MERGE_FORBIDDEN")
    output.mkdir(parents=True, exist_ok=False)
    model.generate_images(images)
    if network.is_merged_in:
        raise ValueError("MERGE_FORBIDDEN")
    from PIL import Image
    records = []
    for p in config["prompts"]:
        raw = output / (p["personId"] + ".png")
        with Image.open(raw) as image:
            if image.size != (352, 512):
                raise ValueError("OUTPUT_GEOMETRY")
            # RGB diagnostic only; alpha finishing remains a separate gate.
            cropped = output / (p["personId"] + "-340x510-RGB.png")
            image.crop((6, 1, 346, 511)).save(cropped)
        records.append({"personId": p["personId"], "rawSHA256": digest(raw), "cropSHA256": digest(cropped)})
    (output / "native-inference-receipt.json").write_text(json.dumps({**proof, "effectiveGeneration": effective, "nativeTensorCount": len(expected), "records": records, "alphaFinished": False, "ownerStyleApproved": False}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("config")
    parser.add_argument("--generate", action="store_true")
    args = parser.parse_args()
    config = json.loads(pathlib.Path(args.config).read_text(encoding="utf-8"))
    proof = preflight(config)
    if args.generate:
        if not config["generation_enabled"]:
            raise ValueError("GENERATION_DISABLED")
        generate(config, proof)
    else:
        print(json.dumps({**proof, "modelLoaded": False, "generationDispatched": False}))
