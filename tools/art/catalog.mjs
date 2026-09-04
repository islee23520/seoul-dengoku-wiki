export const GRAPH_SCHEMA_VERSION = 1;

export const ASSET_CLASSES = new Set([
  'portrait',
  'character_mesh',
  'prop',
  'tile',
  'animation_clip',
  'identity_lock',
  'ui_concept',
  'title_art',
  'ui_kit',
]);

export const ANIMATION_NEEDS = new Set(['none', 'four_dir_clip', 'cinematic_keyframe', 'previs']);
export const DCCS = new Set(['auto', 'blender', 'maya']);
export const BACKENDS = new Set([
  'nanobanana_gemini',
  'grok_imagine',
  'openai_image',
  'trellis_v1',
  'comfyui_trellis',
  'none',
]);
export const INVALID_BACKENDS = new Set(['trellis_v1', 'comfyui_trellis']);
export const STATUSES = new Set(['draft', 'reviewed', 'promoted', 'blocked', 'archived']);
export const RIGHTS = new Set(['allowed', 'blocked', 'unresolved']);
export const SOURCES = new Set(['generate', 'existing']);
export const MAYA_INCOMPATIBLE_ASSETS = new Set([
  'portrait',
  'tile',
  'identity_lock',
  'ui_concept',
  'title_art',
  'ui_kit',
]);
export const STILL_2D_ASSETS = new Set(['portrait', 'tile', 'ui_concept', 'title_art', 'ui_kit']);
export const MESH_ASSETS = new Set(['character_mesh', 'prop']);

export const TRELLIS_MODEL = 'microsoft/TRELLIS-image-large';
export const TRELLIS_REVISION = '442aa1e1afb9014e80681d3bf604e8d728a86ee7';

export const BACKEND_2D_NODE = {
  nanobanana_gemini: {
    tool: 'nanobanana_gemini',
    provider: 'google',
    model: 'nanobanana-gemini',
  },
  grok_imagine: {
    tool: 'grok_imagine',
    provider: 'xai',
    model: 'grok-imagine',
  },
  openai_image: {
    tool: 'openai_image',
    provider: 'openai',
    model: 'openai-imagegen',
  },
  comfyui_trellis: { tool: 'comfyui' },
};

export const BACKEND_3D_NODE = {
  trellis_v1: {
    tool: 'trellis',
    provider: 'microsoft',
    model: TRELLIS_MODEL,
    revision: TRELLIS_REVISION,
    execution: 'direct_python',
  },
  comfyui_trellis: {
    tool: 'trellis',
    execution: 'comfyui',
  },
};

export const NODE_META = {
  rights_check: { kind: 'gate' },
  identity_plan: { kind: 'plan' },
  generate_2d: { kind: 'generate' },
  generate_3d_trellis: { kind: 'generate', tool: 'trellis' },
  archive_raw: { kind: 'archive' },
  blender_cleanup: { kind: 'dcc', tool: 'blender' },
  blender_rig: { kind: 'dcc', tool: 'blender' },
  blender_animation: { kind: 'dcc', tool: 'blender' },
  blender_previs: { kind: 'dcc', tool: 'blender' },
  maya_animo_polish: {
    kind: 'dcc_polish',
    tool: 'animo',
    tool_version: '10.0',
    standalone: false,
    capabilities: [
      'tools_editor',
      'hotkeys',
      'space_switch',
      'bake',
      'playblast',
      'reference_import',
    ],
  },
  export_fbx: { kind: 'export' },
  unity_import: { kind: 'engine', tool: 'unity' },
  human_review: { kind: 'gate' },
  bom_promotion: { kind: 'gate' },
};
