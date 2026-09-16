/**
 * The offline portrait tool.
 *
 * Intent decision 8 keeps this surface a 2D slot composite assembled offline:
 * plates go in, one composited PNG comes out, and Unity only ever receives that
 * output. This module is the command-line half — build a library manifest from
 * plates, compose one selection, assign portraits to registered characters, and
 * emit the binding document `verify-portrait-binding.mjs` checks.
 *
 * It composites and records. It never judges art: a library built here carries
 * `quality_acceptance: "NOT VERIFIED"` until a GQ review says otherwise.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compositePortraitLayers } from './portrait-layer-composite.mjs';
import { requirePortraitCapability, validatePortraitWorkflow } from './portrait-gateway.mjs';
import { loadCharacterRegistry } from './verify-portrait-binding.mjs';

const slotSchema = JSON.parse(readFileSync(new URL('./portrait-layer-slots.json', import.meta.url), 'utf8'));
const reviewContract = JSON.parse(readFileSync(new URL('./portrait-review-contract.json', import.meta.url), 'utf8'));

export const SEXES = ['female', 'male'];
export const DISABLED_BY_SEX = { female: ['beard', 'beard_back'], male: [] };
export const DEFAULT_CANVAS = { width: reviewContract.reference.width, height: reviewContract.reference.height };
export const TOOL_ID = 'Tool/art/portrait/portrait-tool.mjs';

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const orderedSlots = () => [...slotSchema.slots].sort((a, b) => a.z - b.z);
const posix = (value) => value.split('\\').join('/');

/** Read width/height straight out of the IHDR, without inflating the image data. */
function pngSize(bytes, label) {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIG)) throw new Error(`${label} is not a PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function slotEnabled(sex, slotId) {
  return !DISABLED_BY_SEX[sex].includes(slotId);
}

function emptySexRecord(reason) {
  const entries = {};
  for (const slot of slotSchema.slots) entries[slot.id] = { enabled: false, variants: [], reason };
  return { slots: entries };
}

/**
 * Scan a convention plate tree into a library manifest.
 * Layout: `<plateRoot>/<sex>/<slot>/<variantId>.png`
 *
 * @param {{ repoRoot: string, plateRoot: string, canvas?: {width:number,height:number},
 *           manifestDir?: string, stage?: string }} options
 */
export function buildLibrary(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const plateRoot = options.plateRoot ?? 'plates';
  const canvas = options.canvas ?? DEFAULT_CANVAS;
  const base = resolve(repoRoot, options.manifestDir ?? '.');

  const sexes = {};
  for (const sex of SEXES) {
    const entries = {};
    for (const slot of slotSchema.slots) {
      const enabled = slotEnabled(sex, slot.id);
      const dir = resolve(repoRoot, plateRoot, sex, slot.id);
      const variants = [];
      if (enabled && existsSync(dir) && statSync(dir).isDirectory()) {
        for (const name of readdirSync(dir).sort()) {
          if (!name.toLowerCase().endsWith('.png')) continue;
          const full = join(dir, name);
          const bytes = readFileSync(full);
          const size = pngSize(bytes, posix(relative(repoRoot, full)));
          if (size.width !== canvas.width || size.height !== canvas.height) {
            throw new Error(`plate canvas ${size.width}x${size.height} != ${canvas.width}x${canvas.height}: ${posix(relative(repoRoot, full))}`);
          }
          variants.push({
            id: basename(name, '.png'),
            path: posix(relative(base, full)),
            sha256: digest(bytes),
          });
        }
      }
      entries[slot.id] = enabled
        ? { enabled: true, variants }
        : { enabled: false, variants: [], reason: `slot not applicable to ${sex}` };
    }
    sexes[sex] = { slots: entries };
  }

  return {
    version: 1,
    stage: options.stage ?? 'stage2',
    built_by: TOOL_ID,
    quality_acceptance: 'NOT VERIFIED',
    quality_note: 'Plate inventory only. GQ1-GQ4 acceptance lives in review records, not here.',
    canvas,
    path_base: posix(relative(repoRoot, base)) || '.',
    slots: slotSchema.slots,
    sexes,
  };
}

/**
 * Adapt a Stage-1 partition recipe into a library manifest for one sex.
 * Every recipe asset becomes `<slot>-<variant>`; the unauthored sex stays empty.
 */
export function libraryFromRecipe(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const recipePath = options.recipePath;
  const sex = options.sex ?? 'female';
  if (!SEXES.includes(sex)) throw new Error(`unknown sex ${sex}`);
  const recipeFull = resolve(repoRoot, recipePath);
  const recipe = JSON.parse(readFileSync(recipeFull, 'utf8'));
  const recipeDir = dirname(recipeFull);
  const base = resolve(repoRoot, options.manifestDir ?? '.');
  const canvas = recipe.canvas ?? DEFAULT_CANVAS;

  const entries = {};
  for (const slot of slotSchema.slots) {
    entries[slot.id] = slotEnabled(sex, slot.id)
      ? { enabled: true, variants: [] }
      : { enabled: false, variants: [], reason: `slot not applicable to ${sex}` };
  }
  for (const asset of recipe.assets ?? []) {
    const entry = entries[asset.id];
    if (!entry?.enabled) continue;
    const id = `${asset.id}-${asset.variant ?? 'base'}`;
    if (entry.variants.some((variant) => variant.id === id)) continue;
    const full = resolve(recipeDir, asset.path);
    if (!existsSync(full)) throw new Error(`recipe asset missing: ${asset.path}`);
    const bytes = readFileSync(full);
    const size = pngSize(bytes, asset.path);
    if (size.width !== canvas.width || size.height !== canvas.height) {
      throw new Error(`plate canvas ${size.width}x${size.height} != ${canvas.width}x${canvas.height}: ${asset.path}`);
    }
    // Stage-1 marks deliberately transparent slots; keep that, so an empty
    // plate is never mistaken for authored content later.
    const variant = { id, path: posix(relative(base, full)), sha256: digest(bytes) };
    if (asset.empty === true) variant.empty = true;
    entry.variants.push(variant);
  }
  for (const entry of Object.values(entries)) entry.variants.sort((a, b) => a.id.localeCompare(b.id));

  const other = SEXES.find((value) => value !== sex);
  return {
    version: 1,
    stage: 'stage1-derived',
    built_by: TOOL_ID,
    quality_acceptance: 'NOT VERIFIED',
    quality_note: 'Derived from the Stage-1 partition of one identity. Not ten authored variants, not a GQ pass.',
    canvas,
    path_base: posix(relative(repoRoot, base)) || '.',
    slots: slotSchema.slots,
    sexes: {
      [sex]: { slots: entries },
      [other]: emptySexRecord('not authored in this stage-1 recipe'),
    },
  };
}

function resolvePlate(library, repoRoot, variantPath) {
  return resolve(repoRoot, library.path_base ?? '.', variantPath);
}

/**
 * Composite one selection into a single PNG, back to front by slot z.
 * @param {{ library: object, repoRoot: string, sex: string, selection: Record<string,string> }} options
 */
export function composeFromLibrary(options = {}) {
  const { library, sex, workflow, purpose = 'delivery' } = options;
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const selection = options.selection ?? {};
  if (purpose === 'reconstruction') {
    if (workflow) validatePortraitWorkflow(workflow);
  } else if (purpose === 'review') {
    if (!workflow) throw new Error('portrait workflow is required for combination review');
    requirePortraitCapability(workflow, 'combinations');
  } else if (purpose === 'delivery') {
    if (!workflow) throw new Error('portrait workflow is required for delivery');
    requirePortraitCapability(workflow, 'export');
  } else {
    throw new Error(`unknown portrait compose purpose ${purpose}`);
  }
  if (!SEXES.includes(sex)) throw new Error(`unknown sex ${sex}`);
  const record = library?.sexes?.[sex]?.slots;
  if (!record) throw new Error(`library has no ${sex} record`);

  const slots = {};
  const order = [];
  for (const slot of orderedSlots()) {
    const entry = record[slot.id];
    const chosen = selection[slot.id];
    if (chosen === undefined) {
      if (slot.required && entry?.enabled) throw new Error(`missing required slot: ${slot.id}`);
      continue;
    }
    if (!entry?.enabled) throw new Error(`slot ${slot.id} is disabled for ${sex}`);
    const variant = entry.variants.find((candidate) => candidate.id === chosen);
    if (!variant) throw new Error(`unknown variant ${chosen} for slot ${slot.id}`);
    const full = resolvePlate(library, repoRoot, variant.path);
    if (!existsSync(full)) throw new Error(`plate missing: ${variant.path}`);
    const bytes = readFileSync(full);
    if (variant.sha256 && digest(bytes) !== variant.sha256) {
      throw new Error(`plate hash drifted from the library record: ${variant.path}`);
    }
    slots[slot.id] = full;
    order.push(slot.id);
  }
  if (order.length === 0) throw new Error('selection is empty');

  const composed = compositePortraitLayers({ schema: slotSchema, slots });
  const canvas = library.canvas ?? DEFAULT_CANVAS;
  if (composed.width !== canvas.width || composed.height !== canvas.height) {
    throw new Error(`composite ${composed.width}x${composed.height} != library canvas ${canvas.width}x${canvas.height}`);
  }
  return { ...composed, order, sha256: digest(composed.png) };
}

/**
 * Pick one variant per required slot, deterministically, from the seed and the
 * character id alone — so a roster edit never reshuffles anyone else's portrait.
 */
export function assignPortraits(options = {}) {
  const { library, workflow, people = [], seed = '' } = options;
  if (!workflow) throw new Error('portrait workflow is required for character assignment');
  requirePortraitCapability(workflow, 'binding');
  const assignments = [];
  for (const person of people) {
    const sex = person.sex;
    if (!SEXES.includes(sex)) throw new Error(`unknown sex for ${person.id}: ${sex}`);
    const record = library?.sexes?.[sex]?.slots;
    if (!record) throw new Error(`library has no ${sex} record`);
    const selection = {};
    for (const slot of orderedSlots()) {
      const entry = record[slot.id];
      if (!slot.required || !entry?.enabled) continue;
      if (entry.variants.length === 0) throw new Error(`no variants for required slot ${slot.id} (${sex})`);
      const index = parseInt(digest(`${seed}|${person.id}|${slot.id}`).slice(0, 8), 16) % entry.variants.length;
      selection[slot.id] = entry.variants[index].id;
    }
    assignments.push({ character_id: person.id, sex, selection });
  }
  return assignments;
}

/**
 * Compose every assigned portrait and emit the binding document.
 * Refuses to write into an existing directory: exports are evidence, not drafts.
 */
export function batchPortraits(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const libraryPath = posix(options.libraryPath);
  const outDir = posix(options.outDir);
  const libraryFull = resolve(repoRoot, libraryPath);
  const libraryBytes = readFileSync(libraryFull);
  const library = JSON.parse(libraryBytes.toString('utf8'));
  if (!options.workflow) throw new Error('portrait workflow is required for batch');
  requirePortraitCapability(options.workflow, 'export');

  const outFull = resolve(repoRoot, outDir);
  if (existsSync(outFull)) throw new Error(`output directory already exists: ${outDir}`);
  mkdirSync(outFull, { recursive: true });

  const assignments = options.assignments ?? assignPortraits({
    library, workflow: options.workflow, people: options.people ?? [], seed: options.seed ?? '',
  });

  const bindings = [];
  for (const assignment of assignments) {
    const composed = composeFromLibrary({
      library, repoRoot, sex: assignment.sex, selection: assignment.selection,
      workflow: options.workflow, purpose: 'delivery'
    });
    const exportPath = posix(join(outDir, `${assignment.character_id}.png`));
    writeFileSync(resolve(repoRoot, exportPath), composed.png);
    bindings.push({
      character_id: assignment.character_id,
      sex: assignment.sex,
      selection: assignment.selection,
      export: { path: exportPath, sha256: composed.sha256 },
    });
  }

  const document = {
    schema_version: 1,
    built_by: TOOL_ID,
    seed: options.seed ?? null,
    library: { path: libraryPath, sha256: digest(libraryBytes) },
    bindings,
  };
  const documentPath = posix(join(outDir, 'bindings.json'));
  writeFileSync(resolve(repoRoot, documentPath), `${JSON.stringify(document, null, 2)}\n`);
  return { document, documentPath, bindings, outDir };
}

function parseSelection(value) {
  const selection = {};
  for (const pair of String(value ?? '').split(',')) {
    if (!pair.trim()) continue;
    const [slot, variant] = pair.split('=');
    if (!slot || !variant) throw new Error(`bad --select entry: ${pair}`);
    selection[slot.trim()] = variant.trim();
  }
  return selection;
}

/**
 * Read an explicit roster. The atlas carries no sex field and the binding
 * contract forbids inferring one, so every entry must state it: a blanket
 * `--sex` over the registry would be exactly the inference that is barred.
 */
export function loadRoster(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const parsed = JSON.parse(readFileSync(resolve(repoRoot, options.rosterPath), 'utf8'));
  const humans = Array.isArray(parsed) ? parsed : parsed?.humans;
  if (!Array.isArray(humans)) throw new Error('roster must be an array of {id, sex}');
  const seen = new Set();
  return humans.map((entry) => {
    const id = entry?.id;
    if (typeof id !== 'string' || !id.trim()) throw new Error('roster entry without an id');
    if (seen.has(id)) throw new Error(`duplicate roster entry ${id}`);
    seen.add(id);
    if (!SEXES.includes(entry?.sex)) {
      throw new Error(`roster entry ${id} must state sex explicitly (female|male); it is never inferred`);
    }
    return { id, sex: entry.sex };
  });
}

const USAGE = `usage:
  portrait-tool.mjs library --plates <dir> --out <manifest.json> [--canvas WxH] [--stage <name>]
  portrait-tool.mjs library --recipe <recipe.json> --sex <female|male> --out <manifest.json>
  portrait-tool.mjs compose --library <manifest.json> --workflow <workflow.json> --purpose <reconstruction|review|delivery> --sex <s> --select slot=variant,... --out <out.png>
  portrait-tool.mjs batch   --library <manifest.json> --workflow <workflow.json> --roster <roster.json> --seed <seed> --out-dir <dir> [--limit N]
                            roster entries are {id, sex}; sex is never inferred from the registry
all paths are repository-relative; pass --repo-root to override the working directory`;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const read = (flag, fallback) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback);
  try {
    const command = args[0];
    const repoRoot = resolve(read('--repo-root', process.cwd()));
    const out = read('--out');
    if (command === 'library') {
      const canvasArg = read('--canvas');
      const canvas = canvasArg
        ? { width: Number(canvasArg.split('x')[0]), height: Number(canvasArg.split('x')[1]) }
        : DEFAULT_CANVAS;
      if (!out) throw new Error(USAGE);
      const manifestDir = posix(dirname(out));
      const library = args.includes('--recipe')
        ? libraryFromRecipe({ repoRoot, recipePath: read('--recipe'), sex: read('--sex', 'female'), manifestDir })
        : buildLibrary({ repoRoot, plateRoot: read('--plates', 'plates'), canvas, manifestDir, stage: read('--stage') });
      mkdirSync(dirname(resolve(repoRoot, out)), { recursive: true });
      writeFileSync(resolve(repoRoot, out), `${JSON.stringify(library, null, 2)}\n`);
      const counted = Object.fromEntries(SEXES.map((sex) => [sex,
        Object.values(library.sexes[sex].slots).reduce((n, entry) => n + entry.variants.length, 0)]));
      console.log(JSON.stringify({ wrote: out, stage: library.stage, canvas: library.canvas, variants: counted }, null, 2));
    } else if (command === 'compose') {
      if (!out) throw new Error(USAGE);
      const libraryPath = read('--library');
      const library = JSON.parse(readFileSync(resolve(repoRoot, libraryPath), 'utf8'));
      const workflowPath = read('--workflow');
      const workflow = workflowPath ? validatePortraitWorkflow(JSON.parse(readFileSync(resolve(repoRoot, workflowPath), 'utf8'))) : undefined;
      const composed = composeFromLibrary({
        library, workflow, purpose: read('--purpose', 'combination'), repoRoot,
        sex: read('--sex', 'female'), selection: parseSelection(read('--select')),
      });
      mkdirSync(dirname(resolve(repoRoot, out)), { recursive: true });
      writeFileSync(resolve(repoRoot, out), composed.png);
      console.log(JSON.stringify({
        wrote: out, sha256: composed.sha256,
        width: composed.width, height: composed.height, order: composed.order,
      }, null, 2));
    } else if (command === 'batch') {
      const outDir = read('--out-dir');
      if (!outDir) throw new Error(USAGE);
      if (args.includes('--sex')) {
        throw new Error('batch takes no --sex: every roster entry states its own sex (see --roster)');
      }
      const rosterPath = read('--roster');
      if (!rosterPath) throw new Error(USAGE);
      const workflowPath = read('--workflow');
      if (!workflowPath) throw new Error(USAGE);
      const workflow = validatePortraitWorkflow(JSON.parse(readFileSync(resolve(repoRoot, workflowPath), 'utf8')));
      const roster = loadRoster({ repoRoot, rosterPath });
      const registry = loadCharacterRegistry(repoRoot);
      const stray = roster.filter((person) => !registry.has(person.id)).map((person) => person.id);
      if (stray.length) throw new Error(`roster holds ids absent from the atlas: ${stray.join(', ')}`);
      const limit = read('--limit') ? Number(read('--limit')) : null;
      const result = batchPortraits({
        repoRoot,
        libraryPath: read('--library'),
        workflow,
        people: limit ? roster.slice(0, limit) : roster,
        seed: read('--seed', ''),
        outDir,
      });
      console.log(JSON.stringify({
        wrote: result.documentPath, portraits: result.bindings.length,
        next: `node Tool/art/portrait/verify-portrait-binding.mjs --bindings ${result.documentPath} --repo-root "$PWD"`,
      }, null, 2));
    } else {
      throw new Error(USAGE);
    }
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}
