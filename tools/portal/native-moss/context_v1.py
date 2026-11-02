"""Versioned content gate around preserved native runner; no automatic generation."""
import argparse
import ast
import hashlib
import json
import os
import pathlib
import runpy
import subprocess
import sys

PROFILE = "recovery16-native-authored-content.v1"
TOKENIZER_PINS = {
    "tokenizer.json": "06b9509352d2af50381ab2247e083b80d32d5c0aba91c272ca9ff729b6a0e523",
    "tokenizer_config.json": "bee8eba30f0eb4af73c0fe2cd06d0f89b657d7819941c438157ec42f7c80ea87",
    "chat_template.jinja": "a4aee8afcf2e0711942cf848899be66016f8d14a889ff9ede07bca099c28f715",
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def field_hash(fields):
    return sha(json.dumps(fields, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode())


def verify_content(config, compile_content):
    if config["promptProfile"] != PROFILE:
        raise ValueError("CONTENT_PROFILE_REQUIRED")
    records = []
    for prompt in config["prompts"]:
        evidence = prompt["liveWiki"]
        token = json.loads(pathlib.Path(evidence["tokenPath"]).read_bytes())
        compiled = compile_content(token)
        if token["personId"] != prompt["personId"] or compiled["holds"]:
            raise ValueError("CONTENT_IDENTITY_OR_HOLD")
        if evidence["compiler"] != PROFILE or evidence["compiledPrompt"] != compiled["text"] or prompt["text"] != compiled["text"]:
            raise ValueError("CONTENT_RECOMPILE_MISMATCH")
        if evidence["compiledPromptSHA256"] != compiled["promptSHA256"] or prompt["contentBodySHA256"] != compiled["bodySHA256"] or prompt["contentFieldsSHA256"] != field_hash(compiled["fields"]):
            raise ValueError("CONTENT_MACHINE_HASH_MISMATCH")
        records.append({"personId": prompt["personId"], "profile": PROFILE, "fields": compiled["fields"], "bodySHA256": compiled["bodySHA256"], "fieldsSHA256": prompt["contentFieldsSHA256"], "promptSHA256": compiled["promptSHA256"]})
    return records


def context_with_installed_wrapper(source, tokenizer, prompts, negative):
    tree = ast.parse(source)
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "MossImageModel")
    chat = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == "_chat")
    call = next(n for n in ast.walk(chat) if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and n.func.attr == "apply_chat_template")
    flags = {k.arg: k.value.value for k in call.keywords if isinstance(k.value, ast.Constant)}
    if flags.get("enable_thinking") is not True or flags.get("add_generation_prompt") is not True or flags.get("tokenize") is not False:
        raise ValueError("MOSS_CHAT_FLAGS_CHANGED")
    limit = next(n.value.value for n in tree.body if isinstance(n, ast.Assign) and isinstance(n.value, ast.Constant) and any(isinstance(t, ast.Name) and t.id == "MAX_TEXT_TOKENS" for t in n.targets))
    if not isinstance(limit, int) or limit <= 0:
        raise ValueError("MOSS_CONTEXT_LIMIT_TYPE")
    namespace = {}
    exec(compile(ast.Module(body=[chat], type_ignores=[]), "<installed-MOSS-chat>", "exec"), namespace)
    from types import SimpleNamespace
    counts = []
    for name, text in [(p["personId"], p["text"]) for p in prompts] + [("negative", negative)]:
        wrapped = namespace["_chat"](SimpleNamespace(tokenizer=tokenizer), text)
        ids = tokenizer(wrapped, truncation=False)["input_ids"]
        if len(ids) > limit:
            raise ValueError("MOSS_TEXT_CONTEXT_OVERFLOW: " + name)
        counts.append({"personId": name, "tokens": len(ids), "chatSHA256": sha(wrapped.encode())})
    return {"maxTextLength": limit, "counts": counts, "truncation": False, "wrapper": "actual installed AST _chat", "modelLoaded": False}


def tokenizer_cpu(config):
    # Runs in a separate CPU-only process: transformers backend selection cannot
    # affect the later model process. No downloads or toolkit/model imports.
    os.environ.update(USE_TORCH="0", USE_TF="0", USE_FLAX="0", CUDA_VISIBLE_DEVICES="", HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")
    folder = pathlib.Path(config["tokenizerFolder"])
    for name, pin in TOKENIZER_PINS.items():
        if sha((folder / name).read_bytes()) != pin:
            raise ValueError("TOKENIZER_PIN: " + name)
    source_path = pathlib.Path(config["toolkit"]) / "extensions_built_in/diffusion_models/moss_image/moss_image.py"
    source = source_path.read_bytes()
    if sha(source) != config["mossSourceSHA256"]:
        raise ValueError("MOSS_SOURCE_PIN")
    from transformers import Qwen2Tokenizer
    tokenizer = Qwen2Tokenizer.from_pretrained(str(folder), local_files_only=True)
    proof = context_with_installed_wrapper(source.decode("utf-8"), tokenizer, config["prompts"], config["negative"])
    proof["tokenizerPins"] = TOKENIZER_PINS
    proof["sourceSHA256"] = sha(source)
    print(json.dumps(proof), flush=True)


def load_pinned(path, pin):
    if sha(pathlib.Path(path).read_bytes()) != pin:
        raise ValueError("LOCAL_COMPONENT_PIN")
    return runpy.run_path(path)


def reviewed_context(config, context):
    # Exact reviewer bytes plus an explicit machine binding avoid guessing the
    # reviewer's narrative schema or accepting a receipt for another prompt.
    receipt = pathlib.Path(config["contextReviewReceipt"]).read_bytes()
    if not config["contextReviewReceiptSHA256"] or sha(receipt) != config["contextReviewReceiptSHA256"]:
        raise ValueError("REVIEWED_CONTEXT_RECEIPT_REQUIRED")
    binding = config["reviewedContextBinding"]
    expected = {p["personId"]: p["liveWiki"]["compiledPromptSHA256"] for p in config["prompts"]}
    if binding["promptSHA256"] != expected or binding["context"] != context:
        raise ValueError("REVIEWED_CONTEXT_BINDING_MISMATCH")
    reviewed = json.loads(receipt)["nativeContext"]
    if reviewed["modelSourceSHA256"] != context["sourceSHA256"] or reviewed["tokenizerPins"] != context["tokenizerPins"] or reviewed["maxTextLength"] != context["maxTextLength"]:
        raise ValueError("REVIEWED_CONTEXT_SOURCE_MISMATCH")
    for p in config["prompts"]:
        row = next(r for r in reviewed["actualCounts"] if r["personId"] == p["personId"])
        if row["promptSHA256"] != expected[p["personId"]]:
            raise ValueError("REVIEWED_PROMPT_MISMATCH")
        for name, role in ((p["personId"], "positive"), ("negative", "negative")):
            actual = next(r for r in context["counts"] if r["personId"] == name)
            if actual["tokens"] != row["counts"][role]["tokens"] or actual["chatSHA256"] != row["counts"][role]["wrappedSHA256"]:
                raise ValueError("REVIEWED_TOKEN_COUNT_MISMATCH")
    return {"receiptSHA256": sha(receipt), "binding": binding}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("config")
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--tokenizer-only", action="store_true")
    args = parser.parse_args()
    config = json.loads(pathlib.Path(args.config).read_bytes())
    if args.tokenizer_only:
        tokenizer_cpu(config)
        return
    helper = load_pinned(config["contentHelper"], config["contentHelperSHA256"])
    content_proof = verify_content(config, helper["compile_content"])
    legacy = load_pinned(config["legacyRunner"], config["legacyRunnerSHA256"])
    # Preserves canonical live-byte/person/fixed-settings/model/adapter checks.
    proof = legacy["preflight"](config)
    env = os.environ.copy()
    env.update(CUDA_VISIBLE_DEVICES="", USE_TORCH="0", USE_TF="0", USE_FLAX="0", HF_HUB_OFFLINE="1", TRANSFORMERS_OFFLINE="1")
    result = subprocess.run([sys.executable, "-B", __file__, args.config, "--tokenizer-only"], env=env, check=True, capture_output=True, text=True, encoding="utf-8")
    context = json.loads(result.stdout)
    review = reviewed_context(config, context)
    proof.update(contentProfile=PROFILE, contentRecords=content_proof, nativeContext=context, independentContext=review)
    if args.generate:
        if not config["generation_enabled"]:
            raise ValueError("GENERATION_DISABLED")
        legacy["generate"](config, proof)
    else:
        print(json.dumps({**proof, "generationDispatched": False}), flush=True)


if __name__ == "__main__":
    main()
