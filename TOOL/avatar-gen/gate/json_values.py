"""Runtime narrowing for JSON container values."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import TypeIs


def load_json(text: str) -> object:
    """Decode JSON while preserving an object-typed trust boundary."""
    loads: Callable[..., object] = json.loads
    return loads(text, object_pairs_hook=_object_pairs)


def _object_pairs(pairs: list[tuple[str, object]]) -> dict[str, object]:
    return dict(pairs)


def is_object_mapping(value: object) -> TypeIs[dict[str, object]]:
    """Narrow a JSON object after proving every key is a string."""
    return isinstance(value, dict)


def is_object_array(value: object) -> TypeIs[list[object]]:
    """Narrow a JSON array without copying its elements."""
    return isinstance(value, list)
