import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

import { validateManifest } from './asset-manifest.mjs';
import {
  ANIMATION_NEEDS,
  ASSET_CLASSES,
  BACKEND_2D_NODE,
  BACKEND_3D_NODE,
  backendPolicyError,
  DCCS,
  GRAPH_SCHEMA_VERSION,
  MAYA_INCOMPATIBLE_ASSETS,
  MESH_ASSETS,
  NODE_META,
  RIGHTS,
  SOURCES,
  STILL_2D_ASSETS,
} from './catalog.mjs';
import { parseHostFlag, probeHost } from './host.mjs';

export { parseHostFlag, probeHost };

export class PipelineError extends Error {
  constructor(code) {
    super(code);
    this.name = 'PipelineError';
    this.code = code;
  }
}

function validateIntent(intent) {
  if (!ASSET_CLASSES.has(intent.asset_class)) throw new PipelineError('unknown_asset_class');
  if (!ANIMATION_NEEDS.has(intent.animation_need)) throw new PipelineError('unknown_animation_need');
  if (!DCCS.has(intent.dcc)) throw new PipelineError('unknown_dcc');
  const backendError = backendPolicyError(intent);
  if (backendError) throw new PipelineError(backendError);
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
  const meshLike = MESH_ASSETS.has(intent.asset_class);
  const still2d = STILL_2D_ASSETS.has(intent.asset_class);
  const generating = intent.source === 'generate';

  if (generating && (still2d || meshLike)) {
    stages.push(intent.generation_backend === 'trellis_v1' ? 'generate_3d_trellis' : 'generate_2d', 'archive_raw');
  }

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
    const backend = BACKEND_2D_NODE[intent.generation_backend];
    if (backend) Object.assign(node, backend);
  }
  if (id === 'generate_3d_trellis') {
    const backend = BACKEND_3D_NODE[intent.generation_backend];
    if (backend) Object.assign(node, backend);
  }
  return node;
}

export function digestIntent(intent) {
  return createHash('sha256').update(JSON.stringify(intent)).digest('hex');
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
    schema_version: GRAPH_SCHEMA_VERSION,
    intent,
    intent_digest: digestIntent(intent),
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

  try {
    const expected = compileGraph(intent);
    if (!isDeepStrictEqual(nodes, expected.nodes)
      || !isDeepStrictEqual(edges, expected.edges)
      || graph.status !== expected.status) {
      codes.push('graph_plan_mismatch');
    }
  } catch (error) {
    if (!(error instanceof PipelineError)) throw error;
    codes.push(error.code);
  }

  if (graph.schema_version !== GRAPH_SCHEMA_VERSION) codes.push('schema_version_mismatch');
  if (typeof graph.intent_digest === 'string' && graph.intent_digest !== digestIntent(intent)) {
    codes.push('stale_intent');
  }

  if (intent.rights_status === 'blocked') codes.push('rights_blocked');
  else if (intent.rights_status === 'unresolved') codes.push('rights_unresolved');
  else if (graph.status === 'blocked') codes.push('rights_blocked');

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

  if (nodes.some((node) => node.id === 'generate_3d_trellis') && !host.trellis_available) {
    codes.push('trellis_missing');
  }

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

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const args = parseArgs(rest);
  if (command === 'compile') {
    if (!args.intent) {
      process.stderr.write('usage: node Tool/art/pipeline-graph.mjs compile --intent <file.json>\n');
      return 1;
    }
    writeJson(compileGraph(readJson(args.intent)));
    return 0;
  }
  if (command === 'check') {
    if (!args.graph) {
      process.stderr.write('usage: node Tool/art/pipeline-graph.mjs check --graph <file.json> [--host blender=1,trellis=1,maya=0,animo=0]\n');
      return 1;
    }
    const result = checkGraph(readJson(args.graph), parseHostFlag(args.host));
    writeJson(result);
    return result.ok ? 0 : 2;
  }
  if (command === 'validate-manifest') {
    if (!args.manifest) {
      process.stderr.write('usage: node Tool/art/pipeline-graph.mjs validate-manifest --manifest <file.json>\n');
      return 1;
    }
    let document;
    try {
      document = JSON.parse(readFileSync(args.manifest, 'utf8'));
    } catch (error) {
      if (error instanceof SyntaxError) {
        writeJson({ ok: false, errors: [{ code: 'malformed_json' }] });
        return 2;
      }
      throw error;
    }
    const result = validateManifest(document);
    writeJson(result);
    return result.ok ? 0 : 2;
  }
  process.stderr.write('usage: node Tool/art/pipeline-graph.mjs <compile|check|validate-manifest> ...\n');
  return 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.exit(await main());
  } catch (error) {
    if (!(error instanceof PipelineError)) throw error;
    writeJson({ ok: false, codes: [error.code] });
    process.exit(2);
  }
}
