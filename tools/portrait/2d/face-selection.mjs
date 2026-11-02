import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { slotFields, sourcedTrait } from '../neutral-slots.mjs';

export const uniqueFaceIds = ['K1009', 'K1010', 'K998', 'K1003', 'K1007', 'K1008', 'K1018', 'K1017', 'K1019', 'K1004'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const genderKey = value => ({ '남': 'male', '남성': 'male', '여': 'female', '여성': 'female' }[value] ?? value);
const text = value => typeof value === 'string' && value.trim().length > 0;
export function validateFaceMode(mode, required = false) {
  if (mode == null) { if (required) throw new Error('explicit faceMode required for new sheet creation'); return null; }
  if (Object.keys(mode).some(key => !['kind', 'variantId'].includes(key)) || !['unique', 'template'].includes(mode.kind) || !Object.hasOwn(mode, 'variantId')) throw new Error('invalid faceMode');
  if (mode.kind === 'unique' ? mode.variantId !== null : !text(mode.variantId)) throw new Error('faceMode variantId must be null for unique or an explicit template ID');
  return structuredClone(mode);
}
export async function readFaceCatalog(path) {
  if (!path) return { schemaVersion: 1, variants: [] };
  const catalog = JSON.parse(await readFile(path, 'utf8'));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.variants) || Object.keys(catalog).some(key => !['schemaVersion', 'variants'].includes(key))) throw new Error('invalid face variant catalog');
  const ids = new Set();
  for (const variant of catalog.variants) {
    if (Object.keys(variant).some(key => !['id', 'gender', 'ancestry', 'source', 'face', 'referenceImageSha256', 'referenceImagePath'].includes(key))) throw new Error('face variant has non-face metadata');
    if (!text(variant.id) || ids.has(variant.id) || !['male', 'female'].includes(variant.gender) || !text(variant.ancestry) || !text(variant.source)) throw new Error('invalid face variant metadata');
    ids.add(variant.id);
    if (!variant.face || !Object.keys(variant.face).length || Array.isArray(variant.face)) throw new Error('face variant traits required');
    for (const [key, trait] of Object.entries(variant.face)) {
      if (!slotFields.face.includes(key)) throw new Error('variant may contain face traits only');
      if (!trait || typeof trait !== 'object' || Array.isArray(trait)) throw new Error('variant requires sourced neutral face traits');
      if (sourcedTrait(trait).value === null) throw new Error('variant requires sourced neutral face traits');
    }
    if (!Object.hasOwn(variant, 'referenceImageSha256') || !Object.hasOwn(variant, 'referenceImagePath') || (variant.referenceImageSha256 == null) !== (variant.referenceImagePath == null) || (variant.referenceImageSha256 != null && (!/^[a-f0-9]{64}$/.test(variant.referenceImageSha256) || !text(variant.referenceImagePath)))) throw new Error('variant reference hash/path pair required');
  }
  return catalog;
}
export async function selectFace(record, { required = false, catalogPath = null, canonicalRoot = null, lineageEligibilityPath = null, lineageEligibilitySha256 = null } = {}) {
  if ((lineageEligibilityPath !== null || lineageEligibilitySha256 !== null) && (!text(lineageEligibilityPath) || !/^[a-f0-9]{64}$/.test(lineageEligibilitySha256 ?? ''))) throw new Error('explicit lineage eligibility path/hash pair required');
  if (typeof record.uniqueFaceRequired !== 'boolean') throw new Error('invalid unique face marker');
  if (record.uniqueFaceRequired && (record.uniqueFaceSource?.characterId !== record.characterId || !text(record.uniqueFaceSource?.source))) throw new Error('unique ruler marker requires ID-backed source');
  const mode = validateFaceMode(record.faceMode, required);
  if (!mode) return record;
  if (mode.kind === 'unique') {
    if (!Object.values(record.slots.face).some(trait => trait.value !== null)) throw new Error('unique requires individual sourced face slots');
    return { ...record, faceMode: mode, faceVariant: null };
  }
  if (uniqueFaceIds.includes(record.characterId) || record.uniqueFaceRequired === true) throw new Error('identity requires unique face');
  const selection = record.faceSelection;
  if (!selection || Object.keys(selection).some(key => !['gender', 'ancestry', 'source', 'skinTone'].includes(key)) || !text(selection.ancestry) || !text(selection.source) || !['male', 'female'].includes(selection.gender)) throw new Error('explicit sourced catalog group, gender and skinTone selection required');
  if (selection.ancestry !== 'east-asian') {
    if (!canonicalRoot || !/^person-\d+$/.test(record.personId ?? '')) throw new Error('foreign seed requires canonical lineage');
    const base = resolve(canonicalRoot);
    let eligibility;
    try {
      const bytes = await readFile(lineageEligibilityPath === null ? resolve(base, 'lore/name-pools/face-seed-eligibility.json') : resolve(lineageEligibilityPath));
      if (lineageEligibilityPath !== null && hash(bytes) !== lineageEligibilitySha256) throw new Error('lineage eligibility ledger hash mismatch');
      eligibility = JSON.parse(bytes);
    }
    catch (error) { if (error.code === 'ENOENT' && lineageEligibilityPath === null) throw new Error('foreign seed requires canonical lineage'); throw error; }
    if (eligibility.schemaVersion !== 1 || !Array.isArray(eligibility.people)) throw new Error('invalid canonical lineage eligibility');
    const rows = eligibility.people.filter(row => row.characterId === record.characterId && row.ancestry === selection.ancestry);
    if (rows.length !== 1 || rows[0].name !== record.name) throw new Error('foreign seed requires canonical lineage');
    const support = rows[0], source = support.source;
    if (!text(support.ancestorId) || !source || !text(source.path) || isAbsolute(source.path) || !text(source.pointer) || !source.pointer.startsWith('/') || !/^[a-f0-9]{64}$/.test(source.sha256 ?? '') || !text(source.quote)) throw new Error('invalid canonical lineage source');
    const sourcePath = resolve(base, source.path), local = relative(base, sourcePath);
    if (local === '..' || local.startsWith('../') || isAbsolute(local)) throw new Error('canonical lineage source outside root');
    const bytes = await readFile(sourcePath);
    if (hash(bytes) !== source.sha256) throw new Error('canonical lineage source hash mismatch');
    let value = JSON.parse(bytes);
    for (const token of source.pointer.slice(1).split('/')) {
      if (/~(?:[^01]|$)/.test(token)) throw new Error('invalid canonical lineage pointer');
      const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
      if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) throw new Error('unresolved canonical lineage pointer');
      value = value[key];
    }
    if (value !== source.quote) throw new Error('canonical lineage quote mismatch');
    const detail = JSON.parse(await readFile(resolve(base, 'public/person-details/'+record.personId+'.json'), 'utf8'));
    const registry = JSON.parse(await readFile(resolve(base, 'lore/name-pools/person-id-registry.json'), 'utf8'));
    const person = registry.persons.find(person => person.id === record.characterId);
    if (!person || person.name !== record.name || detail.id !== record.personId || detail.name !== record.name || detail.detailRoute !== '/people/'+record.personId) throw new Error('canonical lineage identity mismatch');
    const tree = detail.familyTree;
    if (!tree || tree.personId !== record.characterId || !Array.isArray(tree.nodes) || !Array.isArray(tree.edges)) throw new Error('foreign seed requires biological lineage');
    const nodes = new Set(tree.nodes.map(node => node.id));
    if (!nodes.has(record.characterId)) throw new Error('foreign seed requires biological lineage');
    const ancestors = new Set([record.characterId]), pending = [record.characterId];
    while (pending.length) {
      const child = pending.pop();
      for (const edge of tree.edges) if (edge.type === 'biological' && edge.to === child && nodes.has(edge.to) && nodes.has(edge.from) && !ancestors.has(edge.from)) { ancestors.add(edge.from); pending.push(edge.from); }
    }
    if (!nodes.has(support.ancestorId) || !ancestors.has(support.ancestorId)) throw new Error('foreign seed requires biological lineage');
  }
  if (!selection.skinTone || typeof selection.skinTone !== 'object') throw new Error('authored sourced skinTone required');
  const tone = sourcedTrait(selection.skinTone);
  if (tone.value === null || ['value', 'status', 'source', 'unit'].some(key => tone[key] !== record.slots.body.skin[key])) throw new Error('skinTone must match independent authored body.skin slot');
  const variant = (await readFaceCatalog(catalogPath)).variants.find(item => item.id === mode.variantId);
  if (!variant) throw new Error('unknown face variant: ' + mode.variantId);
  if (variant.gender !== selection.gender || genderKey(record.identity.gender.value) !== selection.gender || variant.ancestry !== selection.ancestry) throw new Error('face variant gender/catalog group mismatch');
  const referencePath = variant.referenceImagePath == null ? null : resolve(dirname(catalogPath), variant.referenceImagePath);
  if (referencePath && hash(await readFile(referencePath)) !== variant.referenceImageSha256) throw new Error('face variant reference hash mismatch');
  const face = Object.fromEntries(slotFields.face.map(key => [key, sourcedTrait(variant.face[key])]));
  for (const key of ['eyeColor', 'lipColor', 'beardShape']) {
    if (record.slots.face[key].value !== null) face[key] = record.slots.face[key];
  }
  return { ...record, faceMode: mode, slots: { ...record.slots, face }, faceVariant: { id: variant.id, gender: variant.gender, ancestry: variant.ancestry, source: variant.source, traitsSha256: hash(JSON.stringify(variant.face)), referenceImageSha256: variant.referenceImageSha256 ?? null, referenceImagePath: referencePath, assetStatus: referencePath ? 'reference-available' : 'traits-only' } };
}
