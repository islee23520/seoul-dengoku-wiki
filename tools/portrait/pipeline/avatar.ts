import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { blenderPath, worker } from '../tools/character-tool/runtime.mjs';
import { inspectPng } from './png.ts';
import { PortraitError, requireNew } from './portrait.ts';
import { itemFile, loadCatalog, SEXES, SLOTS, type SlotItem } from './slots.ts';

export const AVATAR_MODE = 'prebaked-3d-avatar' as const;

export interface AvatarOptions {
  readonly catalog: string; readonly body: string; readonly sex: string; readonly slots: readonly string[];
  readonly output: string; readonly pose?: string; readonly textures?: string; readonly width?: number; readonly height?: number;
  readonly yaw?: number; readonly framing?: string; readonly blender?: string;
}

const hash = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

export async function resolveSlots(catalogPath: string, sex: string, requests: readonly string[]): Promise<readonly SlotItem[]> {
  if (!SEXES.includes(sex as SlotItem['sex'])) throw new PortraitError('SEX_INVALID', 'Use --sex female or male');
  const catalog = await loadCatalog(catalogPath), chosen = new Map<string, SlotItem>();
  for (const request of requests) {
    const [slot, id, extra] = request.split('=');
    if (!slot || !id || extra !== undefined || !SLOTS.includes(slot as SlotItem['slot'])) throw new PortraitError('SLOT_USAGE', `Use --slot <${SLOTS.join('|')}>=<catalog id>`);
    if (chosen.has(slot)) throw new PortraitError('SLOT_DUPLICATE', `Slot ${slot} chosen twice`);
    const item = catalog.items.find(candidate => candidate.id === id);
    if (!item) throw new PortraitError('SLOT_UNKNOWN', `Catalog has no item ${id}`);
    if (item.slot !== slot) throw new PortraitError('SLOT_KIND_MISMATCH', `${id} is a ${item.slot} item, not ${slot}`);
    if (item.sex !== sex) throw new PortraitError('SLOT_SEX_MISMATCH', `${id} is for ${item.sex}, not ${sex}`);
    chosen.set(slot, item);
  }
  return [...chosen.values()];
}

export async function renderAvatar(options: AvatarOptions) {
  const items = await resolveSlots(options.catalog, options.sex, options.slots);
  const width = options.width ?? 512, height = options.height ?? 640, yaw = options.yaw ?? 0, framing = options.framing ?? 'upper';
  if (![width, height].every(v => Number.isInteger(v) && v >= 64 && v <= 2048) || !Number.isFinite(yaw) || Math.abs(yaw) > 180 || !['upper', 'full', 'bust'].includes(framing)) {
    throw new PortraitError('RENDER_OPTIONS', 'Dimensions 64..2048, yaw -180..180, framing upper|full|bust required');
  }
  const body = resolve(options.body), output = resolve(options.output), receiptPath = `${output}.json`;
  if (!output.toLowerCase().endsWith('.png')) throw new PortraitError('OUTPUT_FORMAT', 'Avatar output must be .png');
  const bodyBytes = await readFile(body).catch(() => { throw new PortraitError('BODY_MISSING', `Body missing: ${body}`); });
  const parts = await Promise.all(items.map(async item => ({ slot: item.slot, id: item.id, sha256: item.sha256, file: await itemFile(options.catalog, item) })));
  const pose = options.pose ? resolve(options.pose) : undefined;
  const poseBytes = pose ? await readFile(pose).catch(() => { throw new PortraitError('POSE_MISSING', `Pose missing: ${pose}`); }) : undefined;
  if (poseBytes) {
    let spec: unknown;
    try { spec = JSON.parse(poseBytes.toString('utf8')); } catch { spec = null; }
    const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
    const angle = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 180;
    const valid = record(spec) && spec.deformer === 'armature-v1' && record(spec.bones)
      && Object.values(spec.bones).every(v => Array.isArray(v) && v.length === 3 && v.every(angle))
      && (spec.properties === undefined || (record(spec.properties) && Object.values(spec.properties)
        .every(p => record(p) && Object.values(p).every(v => typeof v === 'number' && Number.isFinite(v)))));
    if (!valid) throw new PortraitError('POSE_INVALID', 'Pose needs {"deformer":"armature-v1","bones":{name:[x,y,z] degrees},"properties"?:{bone:{prop:number}}}');
  }
  await requireNew(output); await requireNew(receiptPath);
  const binary = await blenderPath(options.blender);
  await mkdir(dirname(output), { recursive: true });
  try {
    const rendered = await worker(binary, { command: 'avatar', input: body, parts: parts.map(({ slot, file }) => ({ slot, file })), pose, textures: options.textures ? resolve(options.textures) : undefined, output, width, height, yaw, framing });
    const bytes = await readFile(output), image = inspectPng(bytes);
    if (image.width !== width || image.height !== height) throw new PortraitError('PNG_SIZE', 'Rendered PNG dimensions differ from request');
    if (hash(await readFile(body)) !== hash(bodyBytes)) throw new PortraitError('SOURCE_CHANGED', 'Body changed during rendering');
    const receipt = {
      version: 1, mode: AVATAR_MODE, status: 'PASS', sex: options.sex,
      body: { file: body, sha256: hash(bodyBytes) },
      slots: parts.map(({ slot, id, sha256, file }) => ({ slot, id, sha256, file })),
      pose: pose && poseBytes ? { file: pose, sha256: hash(poseBytes) } : null,
      output, outputSha256: hash(bytes), width, height, yaw, framing, visiblePixels: image.visiblePixels, blender: rendered,
    };
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx' });
    return receipt;
  } catch (error) {
    await rm(output, { force: true });
    throw error;
  }
}
