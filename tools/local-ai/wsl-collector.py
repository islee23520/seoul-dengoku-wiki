"""Pinned Linux UniForge collection; all descendants belong to the subreaper."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from wsl_contract import Configuration, Validation, WireRequest, WslContractError


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            value.update(chunk)
    return value.hexdigest()


def canonical(value: str) -> Path:
    path = Path(value)
    if not path.is_absolute() or path.resolve(strict=True) != path:
        raise WslContractError("WSL_PATH_ESCAPE")
    return path


def main() -> None:
    os.umask(0o077)
    request = WireRequest.model_validate_json(sys.stdin.buffer.read(65537))
    config_path = canonical(sys.argv[1])
    config = Configuration.model_validate_json(config_path.read_bytes())
    images = config.assets[request.assetId]
    if not 1 <= len(images) <= 16:
        raise WslContractError("WSL_IMAGES_REQUIRED")
    required = {config.python, config.worker,
                str(Path(config.source) / "uniforge3d/pipelines/uniforge3d_image_to_3d.py"),
                str(Path(config.model) / "pipeline.json"), *images}
    if not required.issubset({pin.path for pin in config.pins}):
        raise WslContractError("WSL_PIN_MISSING")
    for pin in config.pins:
        if digest(canonical(pin.path)) != pin.sha256:
            raise WslContractError("WSL_PIN_MISMATCH")
    for path in (config.source, config.model, config.hfHome, config.outputRoot, config.resultsRoot):
        canonical(path)
    directory = Path(config.outputRoot) / request.requestId
    directory.mkdir(mode=0o700)
    output = directory / "prediction.glb"
    job = {"version": 1, "jobId": request.requestId,
           "request": {"assetId": request.assetId, "seed": request.seed},
           "source": config.source, "sourceRevision": config.sourceRevision,
           "runtimeId": config.runtimeId, "model": config.model, "images": images,
           "pins": [pin.model_dump() for pin in config.pins], "output": str(output)}
    request_path = directory / "request.json"
    with request_path.open("xb") as stream:
        stream.write(json.dumps(job, separators=(",", ":")).encode())
    request_hash = digest(request_path)
    env = {"PATH": "/usr/bin:/bin", "HOME": str(directory), "PYTHONNOUSERSITE": "1",
           "PYTHONDONTWRITEBYTECODE": "1", "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1",
           "HF_DATASETS_OFFLINE": "1", "HF_HUB_DISABLE_TELEMETRY": "1", "HF_HOME": config.hfHome}
    # Both execution stages are synchronous children of this pinned collector;
    # cancellation is supervised outside it and never fabricates a worker result.
    subprocess.run([config.python, "-I", config.worker, "generate", "--request", str(request_path)],
                   cwd=config.source, env=env, check=True, stdin=subprocess.DEVNULL,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    validation_path = directory / "validation.json"
    with validation_path.open("xb") as stream:
        subprocess.run([config.python, "-I", config.worker, "validate", "--request", str(request_path)],
                       cwd=config.source, env=env, check=True, stdin=subprocess.DEVNULL,
                       stdout=stream, stderr=subprocess.DEVNULL)
    if validation_path.stat().st_size > 16384:
        raise WslContractError("WSL_VALIDATION_BOUNDS")
    result = Validation.model_validate_json(validation_path.read_bytes())
    if result.requestSha256 != request_hash or digest(request_path) != request_hash:
        raise WslContractError("WSL_REQUEST_CHANGED")
    if canonical(str(output)).stat().st_size != result.artifact.bytes or digest(output) != result.artifact.sha256:
        raise WslContractError("WSL_ARTIFACT_CHANGED")
    target = Path(config.resultsRoot) / request.requestId
    target.mkdir(mode=0o700)
    artifacts = target / "artifacts"
    artifacts.mkdir(mode=0o700)
    artifact_id = f"{request.requestId}-0"
    with output.open("rb") as source, (artifacts / artifact_id).open("xb") as destination:
        shutil.copyfileobj(source, destination)
        destination.flush()
        os.fsync(destination.fileno())
    if digest(artifacts / artifact_id) != result.artifact.sha256:
        raise WslContractError("WSL_COPY_CHANGED")
    model_pins = [pin.model_dump() for pin in config.pins if Path(pin.path).is_relative_to(config.model)]
    input_pins = [pin.model_dump() for pin in config.pins if pin.path in images]
    receipt = {"version": 1, "request": request.model_dump(exclude={"version", "op", "prompt"}),
               "adapterRequestSha256": request_hash, "sourceRevision": config.sourceRevision,
               "runtimeId": config.runtimeId,
               "modelSha256": hashlib.sha256(json.dumps(model_pins, sort_keys=True).encode()).hexdigest(),
               "inputSha256": hashlib.sha256(json.dumps(input_pins, sort_keys=True).encode()).hexdigest(),
               "artifacts": [{"id": artifact_id, **result.artifact.model_dump(), "mime": "model/gltf-binary"}]}
    with (target / "receipt.tmp").open("xb") as stream:
        stream.write(json.dumps(receipt, separators=(",", ":")).encode())
        stream.flush()
        os.fsync(stream.fileno())
    (target / "receipt.tmp").rename(target / "receipt.json")


if __name__ == "__main__":
    main()
