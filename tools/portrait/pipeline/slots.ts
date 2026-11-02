// 3D 슬롯 카탈로그: 무엇을 어떤 공정으로 만들어 추가했는지 해시로 묶어 기록한다.
import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { PortraitError } from './portrait.ts';

export const SLOTS = ['hair', 'clothes', 'headgear'] as const;
export const SEXES = ['female', 'male'] as const;

export interface SlotRecipe {
  readonly pipeline: string; readonly reference_plate: string; readonly reference_sha256: string;
  readonly prompt: string; readonly prompt_sha256: string;
  readonly generator: { readonly tool: string; readonly model: string };
  readonly tripo: { readonly task_id: string; readonly model_version: string };
}
export interface SlotItem {
  readonly id: string; readonly slot: (typeof SLOTS)[number]; readonly sex: (typeof SEXES)[number]; readonly name: string;
  readonly file: string; readonly sha256: string; readonly created_at: string; readonly added_by: string;
  readonly recipe: SlotRecipe; readonly fit: { readonly method: string; readonly receipt: string };
}
export interface SlotCatalog { readonly version: 1; readonly items: readonly SlotItem[] }

const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const hex = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const sha256 = (bytes: Buffer | string): string => createHash('sha256').update(bytes).digest('hex');

function validItem(value: unknown): value is SlotItem {
  if (!record(value) || !record(value.recipe) || !record(value.fit)) return false;
  const { recipe, fit } = value;
  return text(value.id) && /^[a-z0-9][a-z0-9-]*$/.test(value.id)
    && SLOTS.includes(value.slot as SlotItem['slot']) && SEXES.includes(value.sex as SlotItem['sex'])
    && text(value.name) && text(value.file) && hex(value.sha256) && text(value.created_at) && text(value.added_by)
    && text(recipe.pipeline) && text(recipe.reference_plate) && hex(recipe.reference_sha256)
    && text(recipe.prompt) && hex(recipe.prompt_sha256) && recipe.prompt_sha256 === sha256(recipe.prompt)
    && record(recipe.generator) && text(recipe.generator.tool) && text(recipe.generator.model)
    && record(recipe.tripo) && text(recipe.tripo.task_id) && text(recipe.tripo.model_version)
    && text(fit.method) && text(fit.receipt);
}

export async function loadCatalog(path: string): Promise<SlotCatalog> {
  let raw: string;
  try { raw = await readFile(path, 'utf8'); }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return { version: 1, items: [] }; throw error; }
  const value: unknown = JSON.parse(raw);
  if (!record(value) || value.version !== 1 || !Array.isArray(value.items) || !value.items.every(validItem)) {
    throw new PortraitError('CATALOG_INVALID', `Slot catalog is malformed: ${path}`);
  }
  return value as unknown as SlotCatalog;
}

export async function itemFile(catalogPath: string, item: SlotItem): Promise<string> {
  const file = resolve(dirname(resolve(catalogPath)), item.file);
  let bytes: Buffer;
  try { bytes = await readFile(file); }
  catch { throw new PortraitError('CATALOG_FILE_MISSING', `Slot mesh missing: ${file}`); }
  if (sha256(bytes) !== item.sha256) throw new PortraitError('CATALOG_SHA_MISMATCH', `Slot mesh bytes differ from catalog: ${item.id}`);
  return file;
}

export async function addCatalogItem(catalogPath: string, entryPath: string): Promise<SlotItem> {
  const value: unknown = JSON.parse(await readFile(entryPath, 'utf8'));
  if (!validItem(value)) throw new PortraitError('CATALOG_ENTRY_INVALID', 'Entry needs id, slot, sex, name, file, sha256, created_at, added_by, full recipe and fit');
  const catalog = await loadCatalog(catalogPath);
  if (catalog.items.some(item => item.id === value.id)) throw new PortraitError('CATALOG_DUPLICATE', `Catalog already has ${value.id}`);
  await itemFile(catalogPath, value);
  const next: SlotCatalog = { version: 1, items: [...catalog.items, value] };
  const temporary = `${catalogPath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, catalogPath);
  return value;
}
