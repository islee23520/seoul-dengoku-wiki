"""Fixed UniForge3D worker; validate is CPU-only and never imports torch/source."""
import argparse
import hashlib
import io
import os
from pathlib import Path
import shutil
import struct
import sys
from typing import Annotated, Final, Literal, TypedDict

import numpy as np
from PIL import Image
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

LIMIT: Final = 128 * 1024 * 1024
Digest = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


class Request(Strict):
    assetId: Annotated[str, StringConstraints(pattern=r"^[a-z0-9-]{1,80}$")]
    seed: Annotated[int, Field(ge=0, le=2147483647)]


class Pin(Strict):
    path: str
    sha256: Digest


class Job(Strict):
    version: Literal[1]
    jobId: str
    request: Request
    source: str
    sourceRevision: str
    runtimeId: str
    model: str
    images: Annotated[list[str], Field(min_length=1, max_length=16)]
    pins: list[Pin]
    output: str


class Parsed(BaseModel):
    model_config = ConfigDict(frozen=True, strict=True)


class Gltf(Parsed):
    """Only the fixed export's geometry/material subset; unsupported constructs fail."""
    asset: dict[str, str]
    buffers: list["Buffer"]
    bufferViews: list["View"]
    accessors: list["Accessor"]
    meshes: list["Mesh"]
    images: list["TextureImage"] = []
    textures: list["Texture"] = []
    materials: list["Material"] = []
    extensionsRequired: list[str] = []


class Buffer(Strict):
    byteLength: Annotated[int, Field(ge=0)]


class View(Parsed):
    buffer: Literal[0]
    byteOffset: Annotated[int, Field(ge=0)] = 0
    byteLength: Annotated[int, Field(gt=0)]
    byteStride: Annotated[int, Field(ge=4, le=252)] | None = None


class Accessor(Parsed):
    bufferView: Annotated[int, Field(ge=0)]
    byteOffset: Annotated[int, Field(ge=0)] = 0
    count: Annotated[int, Field(gt=0)]
    componentType: Literal[5126, 5125, 5123, 5121]
    type: Literal["VEC3", "VEC2", "SCALAR"]
    normalized: Literal[False] = False
    sparse: None = None


class Primitive(Parsed):
    attributes: dict[str, int]
    indices: int
    mode: Literal[4] = 4
    material: int | None = None
    extensions: None = None


class Mesh(Parsed):
    primitives: list[Primitive]


class TextureImage(Strict):
    bufferView: int
    mimeType: Literal["image/png", "image/jpeg"]
    name: str = ""


class Texture(Parsed):
    source: int


class Slot(Parsed):
    index: int
    texCoord: Literal[0] = 0


class Pbr(Parsed):
    baseColorTexture: Slot | None = None
    metallicRoughnessTexture: Slot | None = None


class Material(Parsed):
    pbrMetallicRoughness: Pbr = Pbr()
    normalTexture: Slot | None = None
    occlusionTexture: Slot | None = None
    emissiveTexture: Slot | None = None


Gltf.model_rebuild()


class Artifact(TypedDict):
    name: str
    bytes: int
    sha256: str


class Receipt(TypedDict):
    version: int
    requestSha256: str
    vertices: int
    triangles: int
    bounds: list[list[float]]
    textures: int
    artifact: Artifact


class ContractError(ValueError):
    """A private job or generated artifact violates the fixed contract."""


def require(condition: bool, code: str) -> None:
    if not condition:
        raise ContractError(code)


def canonical(value: str) -> Path:
    path = Path(value)
    require(path.is_absolute() and path.resolve(strict=True) == path.absolute(), "PATH_ESCAPE")
    return path


def hash_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def decode_image(stream: io.BytesIO | Path) -> None:
    with Image.open(stream) as image:
        require(max(image.size) <= 4096 and min(image.size) > 0, "IMAGE_DIMENSIONS")
        require(getattr(image, "n_frames", 1) == 1, "IMAGE_ANIMATED")
        image.load()


def accessor(document: Gltf, binary: bytes, index: int) -> np.ndarray:
    require(0 <= index < len(document.accessors), "ACCESSOR_INDEX")
    item = document.accessors[index]
    kind, component = item.type, item.componentType
    width = {"VEC3": 3, "VEC2": 2, "SCALAR": 1}[kind]
    dtype = np.dtype({5126: "<f4", 5125: "<u4", 5123: "<u2", 5121: "u1"}[component])
    view_index, count = item.bufferView, item.count
    require(0 <= view_index < len(document.bufferViews), "VIEW_INDEX")
    require(0 < count <= LIMIT // (width * dtype.itemsize), "ACCESSOR_COUNT")
    view = document.bufferViews[view_index]
    start, size = view.byteOffset, view.byteLength
    require(start + size <= len(binary), "VIEW_BOUNDS")
    offset, stride = item.byteOffset, view.byteStride or width * dtype.itemsize
    require(stride >= width * dtype.itemsize
            and stride % dtype.itemsize == 0 and offset % dtype.itemsize == 0
            and offset + (count - 1) * stride + width * dtype.itemsize <= size, "ACCESSOR_BOUNDS")
    return np.ndarray((count, width), dtype=dtype, buffer=binary, offset=start + offset,
                      strides=(stride, dtype.itemsize))


def validate(job: Job, request_path: Path) -> Receipt:
    path = canonical(job.output)
    require(path.stat().st_mtime_ns >= request_path.stat().st_mtime_ns, "STALE_OUTPUT")
    size = path.stat().st_size
    require(28 <= size <= LIMIT, "GLB_SIZE")
    with path.open("rb") as stream:
        magic, version, length = struct.unpack("<4sII", stream.read(12))
        require(magic == b"glTF" and version == 2 and length == size, "GLB_HEADER")
        json_size, kind = struct.unpack("<II", stream.read(8))
        require(kind == 0x4E4F534A and 0 < json_size <= 4 * 1024 * 1024
                and json_size % 4 == 0 and 28 + json_size <= size, "GLB_JSON")
        document = Gltf.model_validate_json(stream.read(json_size))
        bin_size, kind = struct.unpack("<II", stream.read(8))
        require(kind == 0x004E4942 and bin_size % 4 == 0 and 28 + json_size + bin_size == size, "GLB_BIN")
        binary = stream.read(bin_size)
    require(document.asset.get("version") == "2.0" and not document.extensionsRequired, "GLTF_VERSION")
    require(len(document.buffers) == 1
            and 0 <= bin_size - document.buffers[0].byteLength <= 3, "BUFFER_INVALID")
    for view in document.bufferViews:
        require(view.byteOffset + view.byteLength <= document.buffers[0].byteLength, "VIEW_BOUNDS")
    vertices, triangles = 0, 0
    lower, upper = np.full(3, np.inf), np.full(3, -np.inf)
    for mesh in document.meshes:
        for primitive in mesh.primitives:
            positions = accessor(document, binary, primitive.attributes["POSITION"])
            require(positions.shape[1] == 3 and positions.dtype.kind == "f"
                    and bool(np.isfinite(positions).all()), "POSITIONS_INVALID")
            indices = accessor(document, binary, primitive.indices)
            require(indices.shape[1] == 1 and indices.dtype.kind == "u" and indices.size % 3 == 0
                    and int(indices.max()) < len(positions), "INDICES_INVALID")
            for offset in range(0, indices.size, 3 * 16384):
                faces = positions[indices.reshape(-1)[offset:offset + 3 * 16384].reshape(-1, 3)]
                require(bool((np.linalg.norm(np.cross(faces[:, 1] - faces[:, 0], faces[:, 2] - faces[:, 0]), axis=1) > 0).all()), "TRIANGLES_DEGENERATE")
            vertices += len(positions)
            triangles += indices.size // 3
            lower = np.minimum(lower, positions.min(axis=0))
            upper = np.maximum(upper, positions.max(axis=0))
            if primitive.material is not None:
                require(0 <= primitive.material < len(document.materials), "MATERIAL_INDEX")
                material = document.materials[primitive.material]
                if any((material.pbrMetallicRoughness.baseColorTexture, material.pbrMetallicRoughness.metallicRoughnessTexture,
                        material.normalTexture, material.occlusionTexture, material.emissiveTexture)):
                    uv = accessor(document, binary, primitive.attributes["TEXCOORD_0"])
                    require(uv.shape == (len(positions), 2) and bool(np.isfinite(uv).all()), "UV_INVALID")
    require(vertices > 0 and triangles > 0 and bool(np.isfinite([lower, upper]).all())
            and float(np.linalg.norm(upper - lower)) > 0, "BOUNDS_INVALID")
    for image in document.images:
        require(0 <= image.bufferView < len(document.bufferViews), "TEXTURE_VIEW")
        view = document.bufferViews[image.bufferView]
        start, count = view.byteOffset, view.byteLength
        decode_image(io.BytesIO(binary[start:start + count]))
    for texture in document.textures:
        require(0 <= texture.source < len(document.images), "TEXTURE_SOURCE")
    # Check every material texture slot, including normal/occlusion/emissive/PBR.
    for material in document.materials:
        slots = (material.normalTexture, material.occlusionTexture, material.emissiveTexture,
                 material.pbrMetallicRoughness.baseColorTexture, material.pbrMetallicRoughness.metallicRoughnessTexture)
        for slot in slots:
            if slot is not None:
                require(0 <= slot.index < len(document.textures), "TEXTURE_INDEX")
    return Receipt(version=1, requestSha256=hash_file(request_path), vertices=vertices, triangles=triangles,
                   bounds=[lower.tolist(), upper.tolist()], textures=len(document.textures),
                   artifact=Artifact(name="prediction.glb", bytes=size, sha256=hash_file(path)))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("generate", "validate"))
    parser.add_argument("--request", required=True)
    args = parser.parse_args()
    request_path = canonical(args.request)
    require(request_path.stat().st_size <= 1024 * 1024, "REQUEST_SIZE")
    job = Job.model_validate_json(request_path.read_bytes())
    require(Path(job.output) == request_path.parent / "prediction.glb", "OUTPUT_ESCAPE")
    required = {canonical(str(value)) for value in (sys.executable, __file__, Path(job.model) / "pipeline.json",
                Path(job.source) / "uniforge3d/pipelines/uniforge3d_image_to_3d.py", *job.images)}
    require(required.issubset({Path(pin.path) for pin in job.pins}), "PIN_MISSING")
    for pin in job.pins:
        require(hash_file(canonical(pin.path)) == pin.sha256, "PIN_MISMATCH")
    require(sum(canonical(image).stat().st_size for image in job.images) <= LIMIT, "IMAGES_SIZE")
    for image in job.images:
        decode_image(canonical(image))
    if args.mode == "validate":
        import json
        print(json.dumps(validate(job, request_path), allow_nan=False))
        return
    require(not Path(job.output).exists(), "OUTPUT_EXISTS")
    require(all(os.environ.get(key) == "1" for key in
                ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE", "PYTHONNOUSERSITE")), "OFFLINE_REQUIRED")
    source, model = canonical(job.source), canonical(job.model)
    dependencies = {*source.rglob("*.py"), *(p for p in model.rglob("*") if p.is_file())}
    require(dependencies.issubset({Path(pin.path) for pin in job.pins}), "DEPENDENCY_PIN_MISSING")
    inputs = request_path.parent / "images"
    inputs.mkdir(exist_ok=False)
    images = []
    for index, image in enumerate(job.images):
        target = inputs / f"{index:02d}{Path(image).suffix}"
        shutil.copyfile(image, target)
        require(hash_file(target) == next(pin.sha256 for pin in job.pins if Path(pin.path) == Path(image)), "INPUT_CHANGED")
        decode_image(target)
        images.append(target)
    sys.path.insert(0, str(source))
    from uniforge3d import UniForge3DImageTo3DPipeline
    pipeline = UniForge3DImageTo3DPipeline.from_pretrained(model, device=0, low_vram=True, local_files_only=True)
    pipeline.run(images, Path(job.output), seed=job.request.seed, overwrite=False)


if __name__ == "__main__":
    main()
