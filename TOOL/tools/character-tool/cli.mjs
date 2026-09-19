#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { blenderPath, CliError, worker, stagingPath } from './runtime.mjs';

const help = `character-tool — Blender character workbench for agents

Usage: character-tool [--json] <command> [options]
  doctor          Discover Blender, versions and add-on capabilities
  setup           Install/enable supplied add-ons for the current Blender/OS
  launch          Open an isolated Blender window; return its PID
  inspect | check Inspect geometry and skinning; --require-rig rejects unrigged input
  align           Normalize explicit source axes, center and ground an unrigged model
  rig-template    Append an installed Auto-Rig Pro preset (not anatomical fitting)
  rig             Bind --skeleton JSON or an existing --armature by automatic weights
  weld            Merge nearby mesh vertices with --distance (meters)
  shape-key       Author a named shape key from --spec vertex deltas
  rig-edit        Edit explicit rest-bone positions from --spec
  skin-edit       Replace explicit vertex weights from --spec and normalize
  export          Export a checked rig to FBX or GLB
  render          Render front/side/back previews; optional --pose-bone and --angle
  exec            Run an explicit --script Python file in isolated Blender
  unity-install   Install editor-only import hook into --project
  unity-import    Import FBX into --destination Assets/Art/Staging/<new-folder>

Common: --blender executable (or BLENDER_PATH), --input model, --output new-file
Setup: --addons auto_rig_pro,rig_tools,weight_paint_tools,proxy_picker[,voxel_skinning]
       --addon-dir directory (default: repository TOOL/blender-addons)
Align: --up Z --forward -Y [--height meters]
Rig:   --skeleton bones.json | --armature name [--engine automatic|arp|voxel|surface]
       --gui for real GUI ARP; --resolution 128 --loops 5 --influences 4
Edit:  --mesh name --spec edits.json; weld --distance 0.0001
Template: --preset human|dog|horse|horse_ik_spine|bird|free
Unity: --project path --unity executable [--rig-type generic|humanoid] --receipt file
Exec: --script file.py (full bpy access; set result to a JSON value)
Every write uses a new output. Nothing is promoted to runtime automatically.
Natural language is interpreted by the companion agent skill, not shell evaluation.
`;
const strings = ['blender','input','output','addons','addon-dir','up','forward','height','skeleton',
  'armature','engine','preset','script','project','destination','unity','receipt','rig-type','pose-bone','angle',
  'mesh','spec','distance','resolution','loops','influences','screenshot','log'];
let command = '';
try {
  const { values, positionals } = parseArgs({ options: {
    ...Object.fromEntries(strings.map(name => [name, { type: 'string' }])),
    json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    'require-rig': { type: 'boolean' }, gui: { type: 'boolean' },
  }, allowPositionals: true });
  command = positionals[0] || '';
  if (values.help || !command) { process.stdout.write(help); }
  else {
    const commands = ['doctor','setup','launch','inspect','check','align','rig-template','rig','export','render','exec','unity-install','unity-import',
      'weld','shape-key','rig-edit','skin-edit'];
    if (!commands.includes(command) || positionals.length !== 1) throw new CliError('USAGE', 'Unknown command or extra positional arguments. Use --help.');
    const required = {
      align: ['input','output'], rig: ['input','output'], export: ['input','output'],
      'rig-template': ['output','preset'], inspect: ['input'], check: ['input'], render: ['input','output'],
      exec: ['script'], 'unity-install': ['project'], 'unity-import': ['input','project','destination','receipt'],
      weld: ['input','output'], 'shape-key': ['input','output','mesh','spec'],
      'rig-edit': ['input','output','armature','spec'], 'skin-edit': ['input','output','mesh','spec'],
    };
    if (command === 'unity-import') stagingPath(values.destination);
    for (const name of required[command] || []) if (!values[name]) throw new CliError('USAGE', `--${name} is required for ${command}`);
    const request = { ...values, command: command === 'check' ? 'inspect' : command };
    for (const key of ['input','output','skeleton','script','project','receipt','addon-dir','spec','screenshot','log']) {
      if (request[key]) request[key] = resolve(request[key]);
    }
    let data;
    if (command.startsWith('unity-')) {
      const { unityCommand } = await import('./unity.mjs');
      data = await unityCommand(request);
    } else {
      const binary = await blenderPath(values.blender);
      if (command === 'launch') {
        const { launch } = await import('./launch.mjs');
        data = await launch(binary, request);
      } else data = await worker(binary, request);
    }
    process.stdout.write(`${JSON.stringify({ ok: true, command, data }, null, values.json ? 0 : 2)}\n`);
  }
} catch (error) {
  const code = error instanceof CliError ? error.code : error.code?.startsWith('ERR_PARSE_ARGS') ? 'USAGE' : 'FAILED';
  process.stdout.write(`${JSON.stringify({ ok: false, command, error: { code, message: error.message } })}\n`);
  process.exitCode = 2;
}
