import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { blenderPath, worker } from '../tools/character-tool/runtime.mjs';
import { inspectPng } from './png.ts';

export const MODE = 'prebaked-3d' as const;
export class PortraitError extends Error {
  readonly code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}
export interface RenderOptions {
  readonly input: string; readonly output: string; readonly width?: number; readonly height?: number;
  readonly yaw?: number; readonly framing?: string; readonly blender?: string;
}
export interface PortraitReceipt {
  readonly version: 1; readonly mode: typeof MODE; readonly status: 'PASS';
  readonly source: string; readonly sourceName: string; readonly sourceSha256: string;
  readonly output: string; readonly outputSha256: string; readonly width: number; readonly height: number;
  readonly yaw: number; readonly framing: string; readonly visiblePixels: number;
}
const hash = (bytes: Buffer): string => createHash('sha256').update(bytes).digest('hex');

export async function requireNew(path: string): Promise<void> {
  try { await access(path); }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return; throw error; }
  throw new PortraitError('OUTPUT_EXISTS', `Refusing overwrite: ${path}`);
}

export async function renderPortrait(options: RenderOptions): Promise<PortraitReceipt> {
  const input = resolve(options.input), output = resolve(options.output);
  if (!['.blend','.glb','.gltf','.fbx'].includes(extname(input).toLowerCase())) throw new PortraitError('SOURCE_FORMAT','Use a pre-baked .blend/.glb/.gltf/.fbx object');
  let source: Buffer;
  try {
    if (!(await stat(input)).isFile()) throw new PortraitError('SOURCE_INVALID','Source must be a regular 3D file');
    source = await readFile(input);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') throw new PortraitError('SOURCE_MISSING',`3D source missing: ${input}`);
    throw error;
  }
  const width = options.width ?? 512, height = options.height ?? 640, yaw = options.yaw ?? 0, framing = options.framing ?? 'upper';
  if (![width,height].every(v=>Number.isInteger(v)&&v>=64&&v<=2048) || !Number.isFinite(yaw) || Math.abs(yaw)>180 || !['upper','full'].includes(framing)) throw new PortraitError('RENDER_OPTIONS','Dimensions 64..2048, yaw -180..180, framing upper|full required');
  if (extname(output).toLowerCase() !== '.png') throw new PortraitError('OUTPUT_FORMAT','Portrait output must be .png');
  const receiptPath = output+'.json';
  await requireNew(output); await requireNew(receiptPath);
  const binary = await blenderPath(options.blender);
  await mkdir(dirname(output),{recursive:true});
  try {
    await worker(binary,{command:'portrait',input,output,width,height,yaw,framing});
    const bytes = await readFile(output), image = inspectPng(bytes);
    if (image.width !== width || image.height !== height) throw new PortraitError('PNG_SIZE','Rendered PNG dimensions differ from request');
    if (hash(await readFile(input)) !== hash(source)) throw new PortraitError('SOURCE_CHANGED','Source changed during rendering');
    const receipt: PortraitReceipt = {version:1,mode:MODE,status:'PASS',source:input,sourceName:basename(input),sourceSha256:hash(source),
      output,outputSha256:hash(bytes),width,height,yaw,framing,visiblePixels:image.visiblePixels};
    await writeFile(receiptPath,JSON.stringify(receipt,null,2),{flag:'wx'});
    return receipt;
  } catch (error) {
    await rm(output,{force:true});
    throw error;
  }
}

export async function checkPortrait(receiptPath: string): Promise<PortraitReceipt> {
  const value: unknown = JSON.parse(await readFile(receiptPath,'utf8'));
  if (typeof value !== 'object' || value === null || !('version' in value) || value.version !== 1 ||
      !('mode' in value) || value.mode !== MODE || !('status' in value) || value.status !== 'PASS' ||
      !('output' in value) || typeof value.output !== 'string' || !('outputSha256' in value) || typeof value.outputSha256 !== 'string' ||
      !('source' in value) || typeof value.source !== 'string' || !('sourceName' in value) || typeof value.sourceName !== 'string' ||
      !('sourceSha256' in value) || typeof value.sourceSha256 !== 'string' || !('width' in value) || typeof value.width !== 'number' ||
      !('height' in value) || typeof value.height !== 'number' || !('yaw' in value) || typeof value.yaw !== 'number' ||
      !('framing' in value) || typeof value.framing !== 'string' || !('visiblePixels' in value) || typeof value.visiblePixels !== 'number') throw new PortraitError('RECEIPT_INVALID','Invalid 3D render receipt');
  const bytes = await readFile(value.output), image = inspectPng(bytes);
  if (hash(bytes) !== value.outputSha256 || image.width !== value.width || image.height !== value.height) throw new PortraitError('PNG_CHANGED','PNG does not match rendered receipt');
  return {version:1,mode:MODE,status:'PASS',output:value.output,outputSha256:value.outputSha256,source:value.source,
    sourceName:value.sourceName,sourceSha256:value.sourceSha256,width:value.width,height:value.height,yaw:value.yaw,
    framing:value.framing,visiblePixels:image.visiblePixels};
}

export async function exportPortrait(receiptPath: string, destination: string): Promise<PortraitReceipt> {
  const receipt = await checkPortrait(receiptPath), output = resolve(destination);
  if (extname(output).toLowerCase()!=='.png') throw new PortraitError('OUTPUT_FORMAT','Export must be PNG');
  await requireNew(output); await requireNew(output+'.json');
  await mkdir(dirname(output),{recursive:true});
  await copyFile(receipt.output,output,constants.COPYFILE_EXCL);
  const exported = {...receipt,output};
  await writeFile(output+'.json',JSON.stringify(exported,null,2),{flag:'wx'});
  return exported;
}
