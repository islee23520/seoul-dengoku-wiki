# Retained failure record

- Baseline inspection first run: native checks completed but JSON encoding failed on a Blender polygon loop `range`. Fixed by encoding the range as a list. No source save occurred.
- Packing runs 1 and 2: all chart computations, per-loop assignments and exact source/body fingerprint assertions completed. Blender 5.2.2 crashed during `bpy.data.libraries.write` with a Scene datablock. Native backtrace: `BKE_view_layer_copy_data -> scene_copy_data -> BKE_id_copy_in_lib -> PartialWriteContext::id_add_copy -> bpy_lib_write`. No candidate was created. Stage output reached `PACK_SAVE`.
- Recovery changes the serialization path materially: write only the two garment Object datablocks to a library, open a fresh empty scene, append those two objects and perform ordinary `save_as_mainfile`. Source Scene copying is not required for a garment-only bundle.

Failed UV chart candidates, if any, retain their numbered assignment and native verdict files. No gate threshold is changed.
