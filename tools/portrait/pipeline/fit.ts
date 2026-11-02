import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { blenderPath, worker } from '../tools/character-tool/runtime.mjs';
import { PortraitError, requireNew } from './portrait.ts';
import { SLOTS } from './slots.ts';

export const FIT_METHOD = 'landmark-scale-v1' as const;

export interface FitOptions {
  readonly slot: string; readonly body: string; readonly input: string; readonly output: string;
  readonly faces?: number; readonly blender?: string;
}

const hash = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

export async function fitSlot(options: FitOptions) {
  if (!SLOTS.includes(options.slot as (typeof SLOTS)[number])) throw new PortraitError('SLOT_USAGE', `Use --slot ${SLOTS.join('|')}`);
  const faces = options.faces ?? 80000;
  if (!Number.isInteger(faces) || faces < 1000 || faces > 1_000_000) throw new PortraitError('FIT_OPTIONS', '--faces must be an integer 1000..1000000');
  const input = resolve(options.input), body = resolve(options.body), output = resolve(options.output), receiptPath = `${output}.fit.json`;
  if (!output.toLowerCase().endsWith('.glb')) throw new PortraitError('OUTPUT_FORMAT', 'Fitted slot output must be .glb');
  const inputBytes = await readFile(input).catch(() => { throw new PortraitError('FIT_INPUT_MISSING', `Raw slot mesh missing: ${input}`); });
  const bodyBytes = await readFile(body).catch(() => { throw new PortraitError('BODY_MISSING', `Body missing: ${body}`); });
  await requireNew(output); await requireNew(receiptPath);
  const binary = await blenderPath(options.blender);
  await mkdir(dirname(output), { recursive: true });
  try {
    const fitted = await worker(binary, { command: 'fit-slot', input: body, raw: input, slot: options.slot, output, faces });
    const outputBytes = await readFile(output);
    const receipt = {
      version: 1, method: FIT_METHOD, slot: options.slot,
      input: { file: input, sha256: hash(inputBytes) }, body: { file: body, sha256: hash(bodyBytes) },
      output: { file: output, sha256: hash(outputBytes) }, faces, blender: fitted,
    };
    await writeFile(receiptPath, JSON.stringify(receipt, null, 2), { flag: 'wx' });
    return receipt;
  } catch (error) {
    await rm(output, { force: true });
    throw error;
  }
}
