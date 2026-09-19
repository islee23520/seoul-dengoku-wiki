import { access, copyFile, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { CliError, execute, root, stagingPath } from './runtime.mjs';

export async function safeDescendant(project, relative) {
  const base = await realpath(project);
  const target = resolve(base, relative);
  if (!target.startsWith(base + sep)) throw new CliError('PROJECT_PATH', 'Path escapes project');
  let cursor = target;
  while (cursor !== base) {
    try {
      const actual = await realpath(cursor);
      if (actual !== cursor) throw new CliError('PROJECT_SYMLINK', `Symlinked destination refused: ${cursor}`);
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    cursor = dirname(cursor);
  }
  return target;
}

async function editorPath(request, project) {
  const versionText = await readFile(join(project, 'ProjectSettings/ProjectVersion.txt'), 'utf8');
  const version = /^m_EditorVersion: (.+)$/m.exec(versionText)?.[1].trim();
  if (!version) throw new CliError('UNITY_VERSION', 'Missing pinned m_EditorVersion');
  const defaults = {
    darwin: `/Applications/Unity/Hub/Editor/${version}/Unity.app/Contents/MacOS/Unity`,
    win32: `C:\\Program Files\\Unity\\Hub\\Editor\\${version}\\Editor\\Unity.exe`,
    linux: join(process.env.HOME || '', 'Unity/Hub/Editor', version, 'Editor/Unity'),
  };
  const binary = request.unity || process.env.UNITY_EDITOR || defaults[process.platform];
  try { await access(binary, constants.X_OK); } catch { throw new CliError('UNITY_NOT_FOUND', `Set --unity / UNITY_EDITOR to Unity ${version}`); }
  return binary;
}

export async function unityCommand(request) {
  const project = await realpath(request.project);
  await access(join(project, 'ProjectSettings/ProjectVersion.txt'));
  const hook = await safeDescendant(project, 'Assets/Editor/CharacterTool/CharacterToolImporter.cs');
  const source = await readFile(join(root, 'unity/CharacterToolImporter.cs'));
  if (request.command === 'unity-install') {
    try {
      const existing = await readFile(hook);
      if (!existing.equals(source)) throw new CliError('UNITY_HOOK_EXISTS', 'Importer exists with different content; update it explicitly after reviewing the diff');
      return { hook, action: 'unchanged' };
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await mkdir(dirname(hook), { recursive: true });
    await writeFile(hook, source, { flag: 'wx' });
    return { hook, action: 'installed' };
  }
  stagingPath(request.destination);
  const destination = await safeDescendant(project, request.destination);
  try { await stat(destination); throw new CliError('OUTPUT_EXISTS', destination); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!request.input.toLowerCase().endsWith('.fbx')) throw new CliError('UNITY_INPUT', 'Export GLB to FBX with character-tool export before Unity import');
  await access(request.input);
  const manifest = request.input.replace(/\.fbx$/i, '.character.json');
  await access(manifest);
  const installed = await readFile(hook).catch(error => {
    if (error.code === 'ENOENT') throw new CliError('UNITY_HOOK_MISSING', 'Run unity-install --project first');
    throw error;
  });
  if (!installed.equals(source)) throw new CliError('UNITY_HOOK_VERSION', 'Installed importer differs from this CLI');
  if (!['generic','humanoid'].includes(request['rig-type'] || 'generic')) throw new CliError('UNITY_RIG_TYPE', 'Use generic or humanoid');
  const binary = await editorPath(request, project);
  const receipt = resolve(request.receipt);
  try { await access(receipt); throw new CliError('OUTPUT_EXISTS', receipt); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(dirname(receipt), { recursive: true });
  const temporary = await mkdtemp(join(tmpdir(), 'character-unity-'));
  try {
    const payload = join(temporary, 'request.json');
    await writeFile(payload, JSON.stringify({ input: request.input, manifest, destination: request.destination,
      receipt, rigType: request['rig-type'] || 'generic' }));
    const log = request.log || receipt + '.log';
    const result = await execute(binary, ['-batchmode', '-nographics', '-quit', '-projectPath', project,
      '-executeMethod', 'CharacterTool.Editor.CharacterToolImporter.Run', '-logFile', log],
    { env: { ...process.env, CHARACTER_TOOL_REQUEST: payload }, timeout: 1_200_000 });
    if (result.code !== 0) throw new CliError('UNITY_FAILED', `Unity exited ${result.code ?? result.signal}; inspect ${log}`);
    const data = JSON.parse(await readFile(receipt, 'utf8'));
    if (!data.ok) throw new CliError('UNITY_IMPORT_FAILED', data.error);
    return { ...data, receipt, log };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
