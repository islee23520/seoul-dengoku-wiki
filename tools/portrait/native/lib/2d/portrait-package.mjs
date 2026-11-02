import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { strictJSONParse } from './design-prompt.mjs';

const roles = new Set(['overlay-template', 'canvas-rule', 'transparency-edge-rule', 'style-technique', 'composition-guide', 'composition-guide-metadata-portable', 'composition-guide-envelope', 'face-catalog-entry']);
const requiredRoles = ['overlay-template', 'canvas-rule', 'transparency-edge-rule', 'face-catalog-entry'];
const forbiddenFaceSlots = new Set(['skin', 'hair', 'body', 'outfit']);
const faceFields = new Set(['description', 'faceShape', 'eyeShape', 'eyebrowShape', 'noseShape', 'mouthShape', 'eyeColor', 'lipColor', 'beardShape']);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function repoPath(root, assetPath, name) {
  if (typeof assetPath !== 'string' || assetPath.trim() === '' || isAbsolute(assetPath) || assetPath.split(/[\\/]/).includes('..')) {
    throw new Error(`portrait package asset ${name} has invalid repository-relative path`);
  }
  const target = resolve(root, assetPath);
  const local = relative(root, target);
  if (local === '..' || local.startsWith(`..${sep}`) || isAbsolute(local)) throw new Error(`portrait package asset ${name} escapes repository root`);
  return target;
}

export async function loadPortraitPackage({ root, manifestPath = 'portrait-package.json' }) {
  const requestedPath = resolve(root);
  const manifestFile = repoPath(requestedPath, manifestPath, 'manifest');
  const repositoryRoot = requestedPath;
  let manifest;
  try { manifest = strictJSONParse(await readFile(manifestFile, 'utf8')); }
  catch (error) { throw new Error(`portrait package manifest could not be loaded: ${error.message}`, { cause: error }); }
  if (!manifest || manifest.id !== 'seoul-dengoku-portrait-package' || manifest.version !== 1 || !Array.isArray(manifest.assets)) {
    throw new Error('portrait package manifest has invalid id, version, or assets');
  }
  const declaredRoles = new Set(manifest.assets.map(asset => asset?.role));
  for (const role of requiredRoles) {
    if (!declaredRoles.has(role)) throw new Error(`portrait package is missing required ${role} asset`);
  }
  const resolvedAssets = [];
  const seen = new Set();
  for (const asset of manifest.assets) {
    const name = asset?.path ?? '<unnamed>';
    if (!asset || !roles.has(asset.role) || !['path', 'sha256', 'provenance', 'rights', 'rolescope', 'role'].every(key => Object.hasOwn(asset, key))) {
      throw new Error(`portrait package asset ${name} has invalid metadata`);
    }
    if (seen.has(asset.path)) throw new Error(`portrait package asset ${name} is duplicated`);
    seen.add(asset.path);
    if (!/^[a-f0-9]{64}$/.test(asset.sha256) || /^0+$/.test(asset.sha256) || /placeholder|todo|unknown/i.test(asset.sha256)) {
      throw new Error(`portrait package asset ${name} has missing or placeholder SHA-256`);
    }
    if (![asset.provenance, asset.rights, asset.rolescope].every(value => typeof value === 'string' && value.trim())) {
      throw new Error(`portrait package asset ${name} has incomplete provenance, rights, or role scope`);
    }
    const filePath = repoPath(repositoryRoot, asset.path, name);
    let bytes;
    try { bytes = await readFile(filePath); }
    catch (error) { throw new Error(`portrait package asset ${name} is missing or unreadable: ${error.message}`, { cause: error }); }
    const actual = sha256(bytes);
    if (actual !== asset.sha256) throw new Error(`portrait package asset ${name} hash mismatch: expected ${asset.sha256}, got ${actual}`);
    resolvedAssets.push({ ...asset, filePath, bytes });
  }
  const envelopeAssets = resolvedAssets.filter(asset => asset.role === 'composition-guide-envelope');
  const guideMetadata = resolvedAssets.filter(asset => /\.json$/i.test(asset.path) && ['composition-guide', 'composition-guide-metadata-portable'].includes(asset.role)).map(asset => ({ asset, data: strictJSONParse(asset.bytes.toString('utf8')) }));
  const projections = guideMetadata.filter(({ data }) => data.projectionSchema);
  if (projections.some(({ data }) => data.projectionSchema !== 'portrait-guide-portable-projection.v2')) throw new Error('stale guide projection/rule version pair');
  if (envelopeAssets.length || projections.length) {
    if (envelopeAssets.length !== 1 || projections.length !== 1) throw new Error('guide requires exactly one envelope and versioned projection');
    const envelopeAsset = envelopeAssets[0];
    const envelope = strictJSONParse(envelopeAsset.bytes.toString('utf8'));
    const projection = projections[0].data;
    const rule = strictJSONParse(resolvedAssets.find(asset => asset.role === 'canvas-rule').bytes.toString('utf8'));
    if (envelope.schema !== 'portrait-guide-envelope.v1' || envelope.version !== 1 || envelope.referenceVersion !== 'task8-approved16-semantic-diagnostic-estimate-20261007-v1' || projection.referenceVersion !== envelope.referenceVersion || rule.schemaVersion !== 2 || rule.referenceVersion !== envelope.referenceVersion) throw new Error('stale guide/envelope/reference rule version pair');
    if (envelope.status !== 'PROVISIONAL_NOT_PASS_AUTHORITY' || envelope.passAuthority !== false || envelope.mechanicalEnvelopeUsable !== false || envelope.productionQualified !== false) throw new Error('diagnostic guide envelope cannot grant PASS or production authority');
    const image = resolvedAssets.find(asset => asset.role === 'composition-guide' && asset.path === envelope.guidePng?.path && /\.png$/i.test(asset.path));
    if (!image || image.sha256 !== envelope.guidePng.sha256 || projection.guidePngDerivedSha256 !== image.sha256) throw new Error('stale guide PNG/envelope binding');
    if (projection.envelope?.path !== envelopeAsset.path || projection.envelope?.sha256 !== envelopeAsset.sha256 || JSON.stringify(projection.semanticLandmarks) !== JSON.stringify(envelope.semanticLandmarks)) throw new Error('stale guide projection/envelope binding');
    if (rule.compositionGuideEnvelope && (rule.compositionGuideEnvelope.path !== envelopeAsset.path || rule.compositionGuideEnvelope.sha256 !== envelopeAsset.sha256)) throw new Error('stale guide rule/envelope binding');
    if (!/^[a-f0-9]{64}$/.test(envelope.reference?.sha256 ?? '') || envelope.canvas?.join(',') !== '1024,1536') throw new Error('invalid diagnostic guide reference binding');
  }
  if (!resolvedAssets.some(asset => asset.role === 'face-catalog-entry')) throw new Error('portrait package is missing face-catalog-entry assets');
  const faceAssetByPath = new Map(resolvedAssets.filter(asset => asset.role === 'face-catalog-entry').map(asset => [relative(repositoryRoot, asset.filePath).split(sep).join('/'), asset]));
  const catalogPaths = new Set();
  for (const asset of resolvedAssets.filter(item => item.role === 'face-catalog-entry')) {
    if (/\.png$/i.test(asset.path)) continue;
    let catalog;
    try { catalog = strictJSONParse(asset.bytes.toString('utf8')); }
    catch (error) { throw new Error(`portrait package face catalog ${asset.path} is invalid JSON: ${error.message}`, { cause: error }); }
    if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.variants) || catalog.variants.length !== 24) {
      throw new Error(`portrait package face catalog ${asset.path} must contain exactly 24 variants`);
    }
    for (const variant of catalog.variants) {
      for (const slot of forbiddenFaceSlots) {
        if (Object.hasOwn(variant, slot) || Object.hasOwn(variant.face ?? {}, slot)) {
          throw new Error(`portrait package face catalog ${asset.path} assigns face assets to forbidden ${slot} slot`);
        }
      }
      if (Object.keys(variant).some(key => !['id', 'gender', 'ancestry', 'source', 'face', 'referenceImageSha256', 'referenceImagePath'].includes(key)) || Object.keys(variant.face ?? {}).some(key => !faceFields.has(key))) {
        throw new Error(`portrait package face catalog ${asset.path} contains non-face slot data`);
      }
      if (variant.referenceImagePath !== null) {
        const imageAssetPath = `${asset.path.slice(0, asset.path.lastIndexOf('/') + 1)}${variant.referenceImagePath}`;
        const image = repoPath(repositoryRoot, imageAssetPath, `${asset.path}#${variant.id}`);
        const localImage = relative(repositoryRoot, image).split(sep).join('/');
        catalogPaths.add(localImage);
        if (!faceAssetByPath.has(localImage)) throw new Error(`portrait package face catalog asset ${variant.referenceImagePath} is not declared as face-catalog-entry`);
        let imageBytes;
        try { imageBytes = await readFile(image); }
        catch (error) { throw new Error(`portrait package face catalog asset ${variant.referenceImagePath} is missing or unreadable: ${error.message}`, { cause: error }); }
        const expectedImageSha = variant.referenceImageSha256 ?? faceAssetByPath.get(localImage).sha256;
        if (!/^[a-f0-9]{64}$/.test(expectedImageSha) || sha256(imageBytes) !== expectedImageSha || faceAssetByPath.get(localImage).sha256 !== expectedImageSha) {
          throw new Error(`portrait package face catalog asset ${imageAssetPath} hash mismatch`);
        }
      }
    }
  }
  for (const asset of faceAssetByPath.values()) {
    if (/\.png$/i.test(asset.path) && !catalogPaths.has(relative(repositoryRoot, asset.filePath).split(sep).join('/'))) {
      throw new Error(`portrait package face asset ${asset.path} is not bound by the face catalog`);
    }
  }
  return { id: manifest.id, version: manifest.version, assets: resolvedAssets };
}
