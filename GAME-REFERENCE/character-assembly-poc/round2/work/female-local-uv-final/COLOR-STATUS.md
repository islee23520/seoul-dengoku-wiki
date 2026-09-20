# Source color: UNPROVEN

This deliverable repairs AtlasUV only. It is not a full color PASS.

The input candidate's single material is
`Female_SourceColor_DefectiveCharts_Unlit`, reading the previously baked
`Female_SourceColor_DefectiveCharts_4096`. That image is not original material
truth and must not be reused as proof of final color correctness.

Inspection of the input build recipe establishes two specific limitations:

1. The old bake interpolates the per-corner `SourceBoundColor` attribute rather
   than sampling original bound source textures at every destination texel.
2. The old recipe writes `(0, 0)` to `LockedSourceUV` for unmatched/authored
   corners, and collapses all final polygon material indices to zero. Therefore
   this candidate alone does not provide exact original material binding and
   source UV truth for every final face.

`LockedSourceUV` is nevertheless immutable input truth for this repair and is
hash-verified unchanged. Repairing or replacing that layer would be a different
task. No fresh source-color bake is claimed. The retained old material is stale
where AtlasUV changes; checker renders are the UV evidence, not color evidence.
The parent may reconstruct exact source bindings and finish the color bake
separately using the final per-loop UV export.
