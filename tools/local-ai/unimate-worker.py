"""Pinned broker worker. `validate` imports no torch and never dispatches inference."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from typing import Annotated, Literal

import numpy as np
from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


class Request(StrictModel):
    assetId: str
    prompt: Annotated[str, StringConstraints(min_length=1, max_length=2000)]
    seed: Annotated[int, Field(ge=0, le=2147483647)]


class Pin(StrictModel):
    path: str
    sha256: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]


class Asset(StrictModel):
    directory: str
    condPath: str
    condKey: str
    canonicalGlb: str
    jointNames: list[str]
    frameDigest: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{40}$")]
    features: Annotated[int, Field(gt=0)]


class Job(StrictModel):
    version: Literal[1]
    jobId: str
    request: Request
    source: str
    sourceRevision: str
    runtimeId: str
    expDir: str
    checkpoint: str
    asset: Asset
    pins: list[Pin]
    output: str


class ManifestAsset(BaseModel):
    model_config = ConfigDict(strict=True)
    cond_path: str
    cond_key: str
    canonical_glb: str
    joint_names: list[str]
    frame_digest: str


class Run(BaseModel):
    model_config = ConfigDict(strict=True)
    exp_dir: str
    checkpoint: str
    seed: int
    mode: str


class Sample(BaseModel):
    model_config = ConfigDict(strict=True)
    asset: str
    prompt: str
    kind: str
    run: int
    frame_digest: str


class Manifest(BaseModel):
    model_config = ConfigDict(strict=True)
    format: Literal["unimate-samples/1"]
    motions_dir: Literal["motions"]
    runs: list[Run]
    assets: dict[str, ManifestAsset]
    samples: dict[str, Sample]


class ContractError(ValueError):
    """A worker boundary or output contract failed."""


def require(condition: bool, code: str) -> None:
    if not condition:
        raise ContractError(code)


def pinned_path(value: str) -> Path:
    path = Path(value)
    require(path.is_absolute() and path.resolve(strict=True) == path.absolute(), "PATH_ESCAPE")
    return path


def source_path(value: str, source: str) -> Path:
    path = Path(value)
    return pinned_path(str(path if path.is_absolute() else Path(source) / path))


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def validate(job: Job, request_path: Path) -> dict[str, object]:
    output = pinned_path(job.output)
    require(output == request_path.parent / "samples", "OUTPUT_ESCAPE")
    manifest_path = pinned_path(str(output / "manifest.json"))
    require(manifest_path.stat().st_size <= 1024 * 1024, "MANIFEST_TOO_LARGE")
    manifest = Manifest.model_validate_json(manifest_path.read_bytes())
    require(len(manifest.runs) == len(manifest.samples) == len(manifest.assets) == 1, "OUTPUT_CARDINALITY")
    run = manifest.runs[0]
    require(source_path(run.exp_dir, job.source) == Path(job.expDir)
            and source_path(run.checkpoint, job.source) == Path(job.checkpoint)
            and run.seed == job.request.seed and run.mode == "text", "RUN_IDENTITY")
    name, sample = next(iter(manifest.samples.items()))
    require(Path(name).name == name and name.endswith(".npy") and "\\" not in name, "MOTION_ESCAPE")
    require(sample.asset == job.asset.condKey and sample.run == 0
            and sample.kind == "sample" and sample.prompt == job.request.prompt
            and sample.frame_digest == job.asset.frameDigest, "SAMPLE_IDENTITY")
    asset = manifest.assets.get(sample.asset)
    if asset is None:
        raise ContractError("ASSET_MISSING")
    require(asset.cond_key == job.asset.condKey and asset.joint_names == job.asset.jointNames
            and asset.frame_digest == job.asset.frameDigest
            and source_path(asset.cond_path, job.source) == Path(job.asset.condPath)
            and source_path(asset.canonical_glb, job.source) == Path(job.asset.canonicalGlb), "ASSET_IDENTITY")
    motion_path = pinned_path(str(output / "motions" / name))
    require(motion_path.stat().st_size <= 128 * 1024 * 1024, "MOTION_TOO_LARGE")
    cutoff = request_path.stat().st_mtime_ns
    require(all(path.stat().st_mtime_ns >= cutoff for path in (manifest_path, motion_path)), "STALE_OUTPUT")
    motion = np.load(motion_path, allow_pickle=False)
    require(motion.dtype.kind == "f" and motion.ndim == 3, "MOTION_TYPE")
    frames, joints, features = motion.shape
    require(frames > 1 and joints == len(job.asset.jointNames)
            and features == job.asset.features, "MOTION_SHAPE")
    require(bool(np.isfinite(motion).all()), "MOTION_NONFINITE")
    variation = float(np.max(np.abs(np.diff(motion.astype(np.float64), axis=0))))
    require(variation > 0, "MOTION_STATIC")
    artifacts = []
    for path in (manifest_path, motion_path):
        artifacts.append({"name": path.relative_to(output).as_posix(), "bytes": path.stat().st_size,
                          "sha256": hash_file(path)})
    return {"version": 1, "requestSha256": hashlib.sha256(request_path.read_bytes()).hexdigest(),
            "frames": frames, "joints": joints, "features": features,
            "variation": variation, "artifacts": artifacts}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("generate", "validate"))
    parser.add_argument("--request", required=True)
    args = parser.parse_args()
    request_path = pinned_path(args.request)
    job = Job.model_validate_json(request_path.read_bytes())
    require(bool(job.request.prompt.strip()) and "\0" not in job.request.prompt, "PROMPT_INVALID")
    required = {str(Path(value)) for value in (sys.executable, __file__, job.checkpoint,
                                               str(Path(job.expDir) / "config.json"),
                                               str(Path(job.expDir) / "dataset_stats.npy"),
                                               job.asset.condPath, job.asset.canonicalGlb)}
    require(required.issubset({str(Path(pin.path)) for pin in job.pins}), "PIN_MISSING")
    for pin in job.pins:
        require(hash_file(pinned_path(pin.path)) == pin.sha256, "PIN_MISMATCH")
    # The only pickle input is the operator's hash-pinned prepared cond, never output NPY.
    cond = np.load(job.asset.condPath, allow_pickle=True).item()[job.asset.condKey]
    # Upstream asset_files._cond_hash(fold_zero=True), without importing source dependencies.
    frame = hashlib.sha1()
    frame.update(json.dumps([str(name) for name in cond["joint_names"]]).encode())
    frame.update(np.asarray(cond["parents"], dtype=np.int64).tobytes())
    for key in ("tpos_first_frame", "tpos_global_rotations"):
        frame.update((np.round(np.asarray(cond[key], dtype=np.float64), 6) + 0.0).tobytes())
    require([str(name) for name in cond["joint_names"]] == job.asset.jointNames
            and frame.hexdigest() == job.asset.frameDigest, "COND_IDENTITY")
    match args.mode:
        case "generate":
            require(all(os.environ.get(key) == "1" for key in
                        ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE", "PYTHONNOUSERSITE")), "OFFLINE_REQUIRED")
            require(Path(job.output) == request_path.parent / "samples", "OUTPUT_ESCAPE")
            Path(job.output).mkdir(exist_ok=False)
            # The broker owns this process tree and keeps its lease until it has exited.
            subprocess.run([sys.executable, "-s", "-m", "unimate.inference.sample",
                            "--exp_dir", job.expDir, "--model_path", job.checkpoint,
                            "--asset", job.asset.directory, "--prompt=" + job.request.prompt,
                            "--output_dir", job.output, "--num_repetitions", "1",
                            "--batch_size", "1", "--seed", str(job.request.seed),
                            "--only_save_motion"], cwd=pinned_path(job.source),
                           env=os.environ.copy(), shell=False, check=True)
            # Generator logging is not a machine receipt; invoke validate separately.
        case "validate":
            print(json.dumps(validate(job, request_path), allow_nan=False))


if __name__ == "__main__":
    main()
