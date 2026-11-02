"""Additive native content profile; historical Comfy v3 is not modified."""
import hashlib
import json

PROFILE = "recovery16-native-authored-content.v1"
TRIGGER = "seoul dengoku portrait style"
IDENTITY = ("gender", "ageCategory", "ethnicity", "origin")
SLOTS = {
    "face": ("description", "faceShape", "eyeColor", "eyeShape", "eyebrowShape", "lipColor", "mouthShape", "noseShape", "beardShape"),
    "hair": ("description", "shape", "color", "length"),
    "body": ("build", "bustSize", "skin"),
    "outfit": ("headwear", "upper", "neckline", "marks"),
    "accessories": ("description", "shape", "color", "material", "mounting"),
}
EXCLUDED = {"body": {"height", "weight"}, "outfit": {"lower", "footwear"}}


def compile_content(token):
    fields, holds, excluded = [], [], []

    def retain(pointer, trait):
        if isinstance(trait, str):
            trait = {"value": trait, "status": "authored-token", "source": pointer}
        if not isinstance(trait, dict) or "value" not in trait:
            holds.append({"pointer": pointer, "reason": "UNSUPPORTED_TRAIT"})
            return
        value = trait["value"]
        if value is None or trait.get("status") == "unknown":
            fields.append({"pointer": pointer, "value": None, "status": "unknown", "source": trait.get("source")})
        elif isinstance(value, (str, int, float)):
            if isinstance(value, str) and "--" in value:
                holds.append({"pointer": pointer, "reason": "TOOLKIT_FLAG_DELIMITER"})
            fields.append({"pointer": pointer, "value": value, "status": trait.get("status"), "source": trait.get("source")})
        else:
            holds.append({"pointer": pointer, "reason": "UNSUPPORTED_VALUE"})

    for key in IDENTITY:
        if key in token["identity"]:
            retain("/identity/" + key, token["identity"][key])
    for section, values in token["slots"].items():
        if section not in SLOTS:
            holds.append({"pointer": "/slots/" + section, "reason": "UNSUPPORTED_SECTION"})
            continue
        for key, trait in values.items():
            pointer = f"/slots/{section}/{key}"
            if key in EXCLUDED.get(section, set()):
                excluded.append({"pointer": pointer, "reason": "OUTSIDE_BUST_OR_NONVISIBLE_DIMENSION"})
            elif key not in SLOTS[section]:
                holds.append({"pointer": pointer, "reason": "UNSUPPORTED_FIELD"})
            else:
                retain(pointer, trait)
    # Allow only framing/pose content from generationContract, not its old model,
    # styleReferenceRole, background delivery or precompiled textToImage history.
    contract = token.get("generationContract", {})
    for key in ("camera", "pose", "direction", "gaze"):
        if key in contract:
            retain("/generationContract/" + key, contract[key])
    if "gaze" not in contract:
        fields.append({"pointer": "/generationContract/gaze", "value": None, "status": "unknown", "source": None})
    # Do not merge separate semantic objects into a fictitious single accessory.
    accessories = token["slots"].get("accessories", {})
    sources = {x.get("source") for x in accessories.values() if isinstance(x, dict) and x.get("value") is not None}
    if len(sources) > 1:
        holds.append({"pointer": "/slots/accessories", "reason": "MULTIPLE_SOURCE_OBJECTS_REQUIRE_REVIEW"})
    body = "\n".join(json.dumps({"field": f["pointer"], "value": f["value"]}, ensure_ascii=False, separators=(",", ":")) for f in fields)
    text = TRIGGER + ", One person, full head, both shoulders and upper chest; preserve the following authored content. Unknown gaze is not an eye-fixation instruction.\n" + body
    return {"profile": PROFILE, "personId": token["personId"], "characterId": token["characterId"], "trigger": TRIGGER, "fields": fields, "holds": holds, "excluded": excluded, "body": body, "bodySHA256": hashlib.sha256(body.encode()).hexdigest(), "text": text, "promptSHA256": hashlib.sha256(text.encode()).hexdigest(), "truncatedFields": [], "contextValidated": False, "dispatchAllowed": False}


def validate_context(compiled, tokenizer, negative, max_text_length=4096):
    # Exactly the installed MossImageModel._chat and tokenizer call, except that
    # truncation is disabled here so overflow fails before encode/model work.
    counts = {}
    for name, text in (("positive", compiled["text"]), ("negative", negative)):
        chat = tokenizer.apply_chat_template([{"role": "user", "content": text}], tokenize=False, add_generation_prompt=True)
        ids = tokenizer(chat, truncation=False)["input_ids"]
        counts[name] = len(ids)
        if len(ids) > max_text_length:
            raise ValueError("MOSS_TEXT_CONTEXT_OVERFLOW: " + name)
    return {"contextValidated": True, "tokenCounts": counts, "maxTextLength": max_text_length, "dispatchAllowed": not compiled["holds"]}
