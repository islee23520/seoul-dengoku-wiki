# Portrait template forwarding entrypoints

The single active 2D engine, schemas, configuration and GUI now live at TOOL/avatar-gen/portrait/2d. These .mjs entrypoints forward existing callers there; they contain no copied generation engine. Read TOOL/avatar-gen/portrait/2d/CONTRACTS.md for slots, reference hashes, portrait/full-body commands and separate output paths.

The independent Blender and model/rig tools remain at TOOL/avatar-gen/portrait/bin and TOOL/avatar-gen/portrait/tools/character-tool. Their render contract does not constrain 2D generation.
