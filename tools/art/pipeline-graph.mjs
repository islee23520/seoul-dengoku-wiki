import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ASSET_CLASSES = new Set([
  'portrait',
  'character_mesh',
  'prop',
  'tile',
  'animation_clip',
  'identity_lock',
]);
const ANIMATION_NEEDS = new Set(['none', 'four_dir_clip', 'cinematic_keyframe', 'previs']);
const DCCS = new Set(['auto', 'blender', 'maya']);
const BACKENDS = new Set(['openai_image', 'comfyui_trellis', 'none']);
const RIGHTS = new Set(['allowed', 'blocked', 'unresolved']);
const SOURCES = new Set(['generate', 'existing']);
const MAYA_INCOMPATIBLE_ASSETS = new Set(['portrait', 'tile', 'identity_lock']);

const NODE_META = {
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

export class PipelineError extends Error {
  constructor(code) {
    super(code);
    this.name = 'PipelineError';
    this.code = code;
  }
}

function commandExists(name) {
  try {
    execFileSync('which', [name], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function probeHost() {
  const animoRoot = process.env.ANIMO_ROOT;
  return {
    blender_available: commandExists('blender'),
    maya_available: commandExists('maya') || commandExists('mayapy'),
    animo_available: Boolean(animoRoot && existsSync(animoRoot)),
    animo_version: process.env.ANIMO_VERSION ?? null,
  };
}

export function parseHostFlag(value) {
  if (!value) return probeHost();
  const host = {
    blender_available: false,
    maya_available: false,
    animo_available: false,
    animo_version: null,
  };
  for (const part of value.split(',')) {
    const [key, raw] = part.split('=');
    const on = raw === '1' || raw === 'true';
    if (key === 'blender') host.blender_available = on;
    if (key === 'maya') host.maya_available = on;
    if (key === 'animo') host.animo_available = on;
  }
  return host;
}

function validateIntent(intent) {
  if (!ASSET_CLASSES.has(intent.asset_class)) throw new PipelineError('unknown_asset_class');
  if (!ANIMATION_NEEDS.has(intent.animation_need)) throw new PipelineError('unknown_animation_need');
  if (!DCCS.has(intent.dcc)) throw new PipelineError('unknown_dcc');
  if (!BACKENDS.has(intent.generation_backend)) throw new PipelineError('unknown_backend');
  if (!RIGHTS.has(intent.rights_status)) throw new PipelineError('unknown_rights');
  if (!SOURCES.has(intent.source)) throw new PipelineError('unknown_source');
  if (intent.source === 'generate' && intent.generation_backend === 'none') {
    throw new PipelineError('generate_requires_backend');
  }
  if (intent.dcc === 'maya') {
    if (MAYA_INCOMPATIBLE_ASSETS.has(intent.asset_class)) {
      throw new PipelineError('maya_incompatible_asset');
    }
    if (intent.animation_need === 'none') throw new PipelineError('maya_without_animation');
    if (intent.animation_need === 'four_dir_clip') throw new PipelineError('four_dir_requires_blender');
    if (intent.animation_need !== 'cinematic_keyframe') throw new PipelineError('maya_requires_cinematic');
  }
}

function skipAnimo(reason = 'animo_not_on_auto_path') {
  return [{ id: 'maya_animo_polish', reason }];
}

function selectStages(intent) {
  if (intent.rights_status !== 'allowed') {
    return { stages: ['rights_check'], skipped: skipAnimo(), status: 'blocked' };
  }

  if (intent.asset_class === 'identity_lock') {
    return {
      stages: ['rights_check', 'identity_plan', 'human_review', 'bom_promotion'],
      skipped: skipAnimo(),
      status: 'compiled',
    };
  }

  const stages = ['rights_check'];
  const meshLike = intent.asset_class === 'character_mesh' || intent.asset_class === 'prop';
  const still2d = intent.asset_class === 'portrait' || intent.asset_class === 'tile';
  const generating = intent.source === 'generate';

  if (generating && (still2d || meshLike)) stages.push('generate_2d');
  if (generating && meshLike) stages.push('generate_3d_trellis');
  if (generating && (still2d || meshLike)) stages.push('archive_raw');

  if (meshLike) stages.push('blender_cleanup');
  if (intent.asset_class === 'character_mesh') stages.push('blender_rig');

  const skipped = [];
  if (intent.animation_need === 'four_dir_clip'
    || (intent.animation_need === 'cinematic_keyframe' && intent.dcc !== 'maya')) {
    stages.push('blender_animation');
    skipped.push(...skipAnimo('animo_not_on_auto_path'));
  } else if (intent.animation_need === 'previs') {
    stages.push('blender_previs');
    skipped.push(...skipAnimo('animo_not_on_auto_path'));
  } else if (intent.animation_need === 'cinematic_keyframe' && intent.dcc === 'maya') {
    stages.push('maya_animo_polish');
  } else {
    skipped.push(...skipAnimo('animo_not_on_auto_path'));
  }

  if (meshLike || intent.asset_class === 'animation_clip') {
    stages.push('export_fbx', 'unity_import');
  }

  stages.push('human_review', 'bom_promotion');
  return { stages, skipped, status: 'compiled' };
}

function materializeNode(id, intent) {
  const meta = NODE_META[id];
  if (!meta) throw new PipelineError('unknown_node');
  const node = { id, standalone: false, ...meta };
  if (id === 'generate_2d') {
    node.tool = intent.generation_backend === 'comfyui_trellis' ? 'comfyui' : intent.generation_backend;
  }
  return node;
}

export function compileGraph(intent) {
  validateIntent(intent);
  const { stages, skipped, status } = selectStages(intent);
  const nodes = stages.map((id) => materializeNode(id, intent));
  const edges = [];
  for (let index = 1; index < stages.length; index += 1) {
    edges.push([stages[index - 1], stages[index]]);
  }
  return {
    schema_version: 1,
    intent,
    nodes,
    edges,
    skipped,
    status,
  };
}

export function checkGraph(graph, host = {}) {
  const codes = [];
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const ids = nodes.map((node) => node.id);
  const intent = graph.intent ?? {};

  if (intent.rights_status === 'blocked' || graph.status === 'blocked') codes.push('rights_blocked');
  if (intent.rights_status === 'unresolved') codes.push('rights_unresolved');

  const animo = nodes.find((node) => node.id === 'maya_animo_polish');
  if (animo) {
    const predecessors = edges.filter(([, dst]) => dst === 'maya_animo_polish');
    if (animo.standalone === true || predecessors.length === 0 || !ids.includes('rights_check')) {
      codes.push('animo_standalone_forbidden');
    }
    if (!host.maya_available) codes.push('maya_missing');
    if (!host.animo_available) codes.push('animo_missing');
  }

  if (graph.status === 'compiled' && !ids.includes('human_review')) {
    codes.push('missing_human_review');
  }

  const needsBlender = ids.some((id) => id.startsWith('blender_'));
  if (needsBlender && !host.blender_available) codes.push('blender_missing');

  return { ok: codes.length === 0, codes };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    args[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);
  if (command === 'compile') {
    if (!args.intent) {
      process.stderr.write('usage: node tools/art/pipeline-graph.mjs compile --intent <file.json>\n');
      return 1;
    }
    const graph = compileGraph(readJson(args.intent));
    process.stdout.write(`${JSON.stringify(graph, null, 2)}\n`);
    return 0;
  }
  if (command === 'check') {
    if (!args.graph) {
      process.stderr.write('usage: node tools/art/pipeline-graph.mjs check --graph <file.json> [--host blender=1,maya=0,animo=0]\n');
      return 1;
    }
    const result = checkGraph(readJson(args.graph), parseHostFlag(args.host));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.ok ? 0 : 2;
  }
  process.stderr.write('usage: node tools/art/pipeline-graph.mjs <compile|check> ...\n');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exit(await main());
}
