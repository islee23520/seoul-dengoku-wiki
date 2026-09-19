import { spawn } from 'node:child_process';
import { access, mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { CliError, root } from './runtime.mjs';

export async function launch(binary, request) {
  if (request.input) {
    if (!request.input.toLowerCase().endsWith('.blend')) throw new CliError('LAUNCH_FORMAT', 'Launch accepts .blend; import other formats with inspect/align first');
    await access(request.input);
  }
  const log = request.log || join(homedir(), '.character-tool', `blender-${Date.now()}.log`);
  await mkdir(dirname(log), { recursive: true });
  const file = await open(log, 'wx');
  try {
    const child = spawn(binary, ['--disable-autoexec', ...(request.input ? [request.input] : []),
      ...(request.screenshot ? ['--python', join(root, 'launch_capture.py'), '--', request.screenshot] : [])], {
      detached: true, stdio: ['ignore', file.fd, file.fd], windowsHide: false,
    });
    await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
    return { pid: child.pid, log, input: request.input || null, state: 'spawned',
      note: 'User-owned interactive Blender window. Spawn does not assert scene readiness.' };
  } finally { await file.close(); }
}
