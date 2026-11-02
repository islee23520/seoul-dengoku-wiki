"""Private, owner-admitted UniForge paths; public callers provide no paths."""
from pathlib import Path
from typing import Annotated, Final, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

ROOT: Final = Path("/home/oliver/.local/share/local-ai/uniforge3d")
Digest = Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{64}$")]


class WslContractError(ValueError):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


class WireRequest(Strict):
    version: Literal[1]
    op: Literal["run"]
    requestId: Annotated[str, StringConstraints(pattern=r"^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$")]
    tool: Literal["uniforge3d"]
    assetId: Annotated[str, StringConstraints(pattern=r"^[a-z0-9-]{1,80}$")]
    seed: Annotated[int, Field(ge=0, le=2147483647)]
    prompt: Literal[""]


class Pin(Strict):
    path: str
    sha256: Digest


class Configuration(Strict):
    python: str
    worker: str
    source: str
    sourceRevision: Literal["8b6094780e202b8a6b1d239e0997552e18547026"]
    runtimeId: Annotated[str, StringConstraints(pattern=r"^[a-z0-9-]{1,80}$")]
    model: str
    hfHome: str
    outputRoot: str
    resultsRoot: str
    pins: tuple[Pin, ...]
    assets: dict[str, tuple[str, ...]]

    @field_validator("python", "worker", "source", "model", "hfHome", "outputRoot")
    @classmethod
    def linux_private_path(cls, value: str) -> str:
        path = Path(value)
        if not path.is_relative_to(ROOT) or ".." in path.parts:
            raise WslContractError("WSL_PRIVATE_ROOT_REQUIRED")
        return value

    @field_validator("resultsRoot")
    @classmethod
    def windows_result_path(cls, value: str) -> str:
        path = Path(value)
        if not path.is_absolute() or not value.startswith("/mnt/") or ".." in path.parts:
            raise WslContractError("WINDOWS_RESULTS_ROOT_REQUIRED")
        return value


class Artifact(Strict):
    name: Literal["prediction.glb"]
    bytes: Annotated[int, Field(gt=0, le=128 * 1024 * 1024)]
    sha256: Digest


class Validation(Strict):
    version: Literal[1]
    requestSha256: Digest
    vertices: Annotated[int, Field(gt=0)]
    triangles: Annotated[int, Field(gt=0)]
    bounds: tuple[tuple[float, float, float], tuple[float, float, float]]
    textures: Annotated[int, Field(ge=0)]
    artifact: Artifact
