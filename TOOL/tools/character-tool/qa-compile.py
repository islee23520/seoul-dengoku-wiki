# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
# Compile actual Blender Python modules without producing bytecode artifacts.
from __future__ import annotations

from pathlib import Path

root = Path(__file__).resolve().parent
files = sorted(root.glob('*.py'))
for path in files:
    compile(path.read_text(),str(path),'exec')
result = {'compiled':len(files),'blenderPython':True}
