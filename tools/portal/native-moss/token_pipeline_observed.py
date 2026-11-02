"""Pinned original token sampler with additive read-only AST observation sites."""
import ast
import hashlib
import pathlib

SOURCE_PIN = "6440f4629245063f82f033f120356e0f54946ef5a877e73c469d63041fd267bb"


def tensor_receipt(value):
    array = value.detach().float().cpu().contiguous().numpy().astype("<f4", copy=False)
    return {"shape": list(value.shape), "sourceDtype": str(value.dtype),
            "hashDtype": "little-endian-float32",
            "sha256": hashlib.sha256(array.tobytes()).hexdigest()}


def observed_class(source, namespace):
    """Compile only the hash-pinned class; numeric statements are never replaced."""
    if hashlib.sha256(source).hexdigest() != SOURCE_PIN:
        raise ValueError("TOKEN_PIPELINE_SOURCE_DRIFT")
    tree = ast.parse(source)
    cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "MossImagePipeline")
    call = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == "__call__")
    # Sites are explicit structural boundaries in the pinned source, not a
    # rewritten sampler or a global torch/randn monkeypatch.
    sites = set()
    def observe(name, expression):
        sites.add(name)
        return ast.parse(f"self._observe('{name}', {expression})").body[0]
    body = []
    for node in call.body:
        if isinstance(node, ast.If) and ast.unparse(node.test) == "latents is None":
            node.body.append(observe("noise", "latents"))
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "images" for t in node.targets) and \
                isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Attribute) and node.value.func.attr == "decode_latents":
            body.append(observe("finalLatent", "latents"))
        body.append(node)
        if isinstance(node, ast.Assign) and ast.unparse(node.value) == "latents.to(device, torch.float32)":
            body.append(observe("initial", "latents"))
        if isinstance(node, ast.Assign) and ast.unparse(node.value) == "moss_sigmas(num_inference_steps, shift=shift).to(device)":
            body.append(observe("sigmas", "sigmas"))
    if sites != {"noise", "initial", "finalLatent", "sigmas"}:
        raise ValueError("TOKEN_OBSERVATION_API_CHANGED")
    call.body = body
    private = dict(namespace)
    exec(compile(ast.fix_missing_locations(ast.Module(body=[cls], type_ignores=[])),
                 "<pinned-observed-token>", "exec"), private)
    original = private["MossImagePipeline"]

    class ObservedTokenPipeline(original):
        def __init__(self, model):
            super().__init__(model)
            self.receipt = None
            self._pending = {}

        def _observe(self, name, tensor):
            if name in self._pending:
                raise ValueError("TOKEN_DUPLICATE_OBSERVATION")
            self._pending[name] = tensor_receipt(tensor)
            if name == "sigmas":
                self._pending["fullSigmas"] = tensor.detach().float().cpu().tolist()

        def __call__(self, conditional_embeds, unconditional_embeds, **values):
            self.receipt = None
            self._pending = {}
            generator = values.get("generator")
            network = self.model.network
            if network is None or network.can_merge_in or network.is_merged_in:
                raise ValueError("TOKEN_FLOATING_NETWORK_REQUIRED")
            if (values.get("height"), values.get("width"), values.get("num_inference_steps"),
                    values.get("guidance_scale"), values.get("shift"), tuple(values.get("uncond_skip_layers", ()))) != \
                    (512, 352, 25, 2.5, 5.0, (22,)) or generator is None or \
                    values.get("latents") is not None or values.get("ref_latents") is not None or \
                    values.get("isolate_refs", False) or unconditional_embeds is None or \
                    set(values) - {"height", "width", "num_inference_steps", "guidance_scale", "shift",
                                   "uncond_skip_layers", "latents", "ref_latents", "isolate_refs", "generator"}:
                raise ValueError("TOKEN_OBSERVATION_CONFIG")
            if generator.initial_seed() != 152995270030802 or str(generator.device) != "cpu":
                raise ValueError("TOKEN_OBSERVATION_GENERATOR")
            before = hashlib.sha256(generator.get_state().cpu().numpy().tobytes()).hexdigest()
            images = super().__call__(conditional_embeds, unconditional_embeds, **values)
            if network.can_merge_in or network.is_merged_in:
                raise ValueError("TOKEN_FLOATING_NETWORK_REQUIRED")
            if not all(k in self._pending for k in ("noise", "initial", "finalLatent", "sigmas", "fullSigmas")):
                raise ValueError("TOKEN_OBSERVATION_MISSING")
            sigmas = self._pending["fullSigmas"]
            if any(self._pending[key]["shape"] != [1, 128, 32, 22] for key in ("noise", "initial", "finalLatent")):
                raise ValueError("TOKEN_OBSERVATION_GEOMETRY")
            if len(sigmas) != 26 or sigmas[0] != 1 or sigmas[-1] != 0 or \
                    not all(a > b for a, b in zip(sigmas, sigmas[1:])):
                raise ValueError("TOKEN_OBSERVATION_SCHEDULE")
            self.receipt = {"schema": "native-moss-token-sampling.v1", "status": "OBSERVED",
                            "pipelineSourceSHA256": SOURCE_PIN, **self._pending,
                            "activeSigmas": list(sigmas), "seed": generator.initial_seed(),
                            "steps": values["num_inference_steps"], "cfg": values["guidance_scale"],
                            "shift": values["shift"], "transitions": len(sigmas) - 1,
                            "generatorStateBefore": before,
                            "generatorStateAfter": hashlib.sha256(generator.get_state().cpu().numpy().tobytes()).hexdigest()}
            return images
    return ObservedTokenPipeline


def create_observed_pipeline(model, native):
    """Later runtime uses model.generate_images([image], pipeline=this instance).

    Caller must use its source-pin/root-validated native module (load_native),
    preserve no-merge checks, and bind returned receipt to its own execution.
    """
    source = pathlib.Path(native.__file__).read_bytes()
    return observed_class(source, vars(native))(model)
