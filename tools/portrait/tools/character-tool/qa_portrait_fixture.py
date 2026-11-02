# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Test fixture adapter only; production rendering never generates source meshes.
from __future__ import annotations

import runpy
from pathlib import Path


def create_fixture():
    fixture = runpy.run_path(str(Path(__file__).with_name('qa-portrait-render.py')))
    return fixture['add_fixture']()
