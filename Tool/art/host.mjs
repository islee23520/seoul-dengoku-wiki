import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

function commandExists(name) {
  try {
    execFileSync('which', [name], { stdio: 'ignore' });
    return true;
  } catch (error) {
    if (error instanceof Error) return false;
    throw error;
  }
}

export function probeHost() {
  const animoRoot = process.env.ANIMO_ROOT;
  return {
    blender_available: commandExists('blender'),
    trellis_available: false,
    maya_available: commandExists('maya') || commandExists('mayapy'),
    animo_available: Boolean(animoRoot && existsSync(animoRoot)),
    animo_version: process.env.ANIMO_VERSION ?? null,
  };
}

export function parseHostFlag(value) {
  if (!value) return probeHost();
  const host = {
    blender_available: false,
    trellis_available: false,
    maya_available: false,
    animo_available: false,
    animo_version: null,
  };
  for (const part of value.split(',')) {
    const [key, raw] = part.split('=');
    const on = raw === '1' || raw === 'true';
    if (key === 'blender') host.blender_available = on;
    if (key === 'trellis') host.trellis_available = on;
    if (key === 'maya') host.maya_available = on;
    if (key === 'animo') host.animo_available = on;
  }
  return host;
}
