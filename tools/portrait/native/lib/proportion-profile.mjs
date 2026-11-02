import { createHash } from 'node:crypto';
import { decodeCodexPng } from './2d/codex-image.mjs';

function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
const hash = value => createHash('sha256').update(canonicalJSON(value)).digest('hex');
const validSHA = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const metrics = ['headWidth', 'headHeight', 'faceWidth', 'faceHeight', 'eyeY', 'headCenterX', 'crownY', 'shoulderWidth', 'torsoWidth'];

export function measureProportions(observation) {
  if (!validSHA(observation?.imageSHA) || !validSHA(observation?.measurementEvidenceSHA) || observation.actualImageMeasured !== true) throw new Error('source-bound actual landmark measurement required');
  if (JSON.stringify(observation.canvas) !== '[1024,1536]') throw new Error('proportion canvas must be 1024x1536');
  const p = observation.landmarks;
  const names = ['crown', 'chin', 'headLeft', 'headRight', 'faceTop', 'faceLeft', 'faceRight', 'leftPupil', 'rightPupil', 'leftShoulder', 'rightShoulder', 'torsoLeft', 'torsoRight'];
  if (!p || names.some(name => !Array.isArray(p[name]) || p[name].length !== 2 || p[name].some((v, i) => !Number.isFinite(v) || v < 0 || v > [1023,1535][i]))) throw new Error('complete in-canvas semantic landmarks required');
  if (p.torsoLeft[1] !== p.torsoRight[1]) throw new Error('torso cross-section landmarks must share the same level');
  if (p.faceTop[1] < p.crown[1] || p.faceTop[1] >= p.chin[1] || p.faceLeft[0] < p.headLeft[0] || p.faceRight[0] > p.headRight[0]) throw new Error('face landmarks must lie inside the measured head');
  if ([p.leftPupil,p.rightPupil].some(point => point[0] < p.faceLeft[0] || point[0] > p.faceRight[0] || point[1] < p.faceTop[1] || point[1] > p.chin[1])) throw new Error('pupil landmarks must lie inside the measured face');
  const result = {
    headWidth: p.headRight[0] - p.headLeft[0], headHeight: p.chin[1] - p.crown[1],
    faceWidth: p.faceRight[0] - p.faceLeft[0], faceHeight: p.chin[1] - p.faceTop[1],
    eyeY: (p.leftPupil[1] + p.rightPupil[1]) / 2,
    headCenterX: (p.headLeft[0] + p.headRight[0]) / 2, crownY: p.crown[1],
    shoulderWidth: p.rightShoulder[0] - p.leftShoulder[0], torsoWidth: p.torsoRight[0] - p.torsoLeft[0],
  };
  if (['headWidth','headHeight','faceWidth','faceHeight','shoulderWidth','torsoWidth'].some(name => result[name] <= 0)) throw new Error('landmark spans must be positive');
  return result;
}

export function createProportionProfile({ commonReference, bodyReference, bodyType, tolerance }) {
  const common = measureProportions(commonReference), body = measureProportions(bodyReference);
  if (typeof bodyType !== 'string' || !bodyType.trim()) throw new Error('authored body type identifier required');
  if (!tolerance || !validSHA(tolerance.evidenceSHA) || !Number.isFinite(tolerance.pixels) || tolerance.pixels < 0 || !Number.isFinite(tolerance.ratio) || tolerance.ratio < 0) throw new Error('source-bound explicit proportion tolerances required');
  const profile = {
    schema: 'portrait-proportion-profile.v1', canvas: [1024,1536], bodyType,
    commonSourceSHA: commonReference.imageSHA, commonMeasurementSHA: commonReference.measurementEvidenceSHA,
    bodySourceSHA: bodyReference.imageSHA, bodyMeasurementSHA: bodyReference.measurementEvidenceSHA,
    targets: Object.fromEntries(metrics.slice(0,7).map(name => [name, common[name]])),
    ratios: { shoulderToHead: body.shoulderWidth / body.headWidth, torsoToHead: body.torsoWidth / body.headWidth },
    tolerance: { ...tolerance },
    semantics: { head: 'attached-hair-left-right-crown-to-lowest-chin', face: 'face-top-skin-to-chin-and-skin-left-right', shoulders: 'joint-centers-not-garment-extents', torso: 'authored-visible-torso-cross-section-same-level' },
  };
  return { ...profile, profileSHA: hash(profile) };
}

export function validateProportionProfile(profile) {
  if (!profile || profile.schema !== 'portrait-proportion-profile.v1') throw new Error('proportion profile required');
  const { profileSHA, ...payload } = profile;
  if (!validSHA(profileSHA) || hash(payload) !== profileSHA) throw new Error('proportion profile hash mismatch');
  if (JSON.stringify(profile.canvas) !== '[1024,1536]' || !profile.bodyType?.trim() || ![profile.commonSourceSHA,profile.commonMeasurementSHA,profile.bodySourceSHA,profile.bodyMeasurementSHA,profile.tolerance?.evidenceSHA].every(validSHA)) throw new Error('invalid source-bound proportion profile');
  if (metrics.slice(0,7).some(name => !Number.isFinite(profile.targets?.[name])) || Object.values(profile.ratios ?? {}).length !== 2 || ['shoulderToHead','torsoToHead'].some(name => !Number.isFinite(profile.ratios[name]) || profile.ratios[name] <= 0)) throw new Error('invalid proportion targets');
  if (![profile.tolerance.pixels,profile.tolerance.ratio].every(v => Number.isFinite(v) && v >= 0)) throw new Error('invalid proportion tolerances');
  return profile;
}

export function verifyProportions(profile, observation) {
  validateProportionProfile(profile);
  const measured = measureProportions(observation), failures = [];
  if (observation.bodyType !== profile.bodyType) failures.push('bodyType');
  for (const name of metrics.slice(0,7)) if (Math.abs(measured[name] - profile.targets[name]) > profile.tolerance.pixels) failures.push(name);
  const ratios = { shoulderToHead: measured.shoulderWidth / measured.headWidth, torsoToHead: measured.torsoWidth / measured.headWidth };
  for (const name of Object.keys(ratios)) if (Math.abs(ratios[name] - profile.ratios[name]) > profile.tolerance.ratio) failures.push(name);
  return { schema: 'portrait-proportion-verdict.v1', imageSHA: observation.imageSHA, measurementEvidenceSHA: observation.measurementEvidenceSHA, profileSHA: profile.profileSHA, bodyType: profile.bodyType, measured, ratios, failures, pass: failures.length === 0, ownerApprovalImplied: false };
}

export function validateSharedProportionProfiles(profiles) {
  if (!Array.isArray(profiles) || !profiles.length) throw new Error('batch proportion profiles required');
  const bodies = new Map();
  let commonSHA;
  for (const profile of profiles) {
    validateProportionProfile(profile);
    const common = hash({ canvas: profile.canvas, sourceSHA: profile.commonSourceSHA, measurementSHA: profile.commonMeasurementSHA, targets: profile.targets, pixels: profile.tolerance.pixels, evidenceSHA: profile.tolerance.evidenceSHA });
    if (commonSHA !== undefined && commonSHA !== common) throw new Error('batch profiles must share one head and face standard');
    commonSHA = common;
    const body = hash({ sourceSHA: profile.bodySourceSHA, measurementSHA: profile.bodyMeasurementSHA, ratios: profile.ratios, ratioTolerance: profile.tolerance.ratio });
    if (bodies.has(profile.bodyType) && bodies.get(profile.bodyType) !== body) throw new Error('same body type must use one proportional standard');
    bodies.set(profile.bodyType, body);
  }
  return { commonSHA, bodyTypes: [...bodies.keys()] };
}

function artifactObservation({ imageBytes, measurementBytes }) {
  if (!(imageBytes instanceof Uint8Array) || !(measurementBytes instanceof Uint8Array)) throw new Error('exact image and measurement artifact bytes required');
  const imageSHA = createHash('sha256').update(imageBytes).digest('hex');
  const measurementEvidenceSHA = createHash('sha256').update(measurementBytes).digest('hex');
  const observation = JSON.parse(Buffer.from(measurementBytes).toString('utf8'));
  if (observation.imageSHA !== imageSHA) throw new Error('measurement artifact image hash mismatch');
  const image = decodeCodexPng(Buffer.from(imageBytes));
  if (JSON.stringify(observation.canvas) !== JSON.stringify([image.width, image.height])) throw new Error('measurement canvas differs from actual PNG');
  const bound = { ...observation, measurementEvidenceSHA };
  measureProportions(bound);
  return bound;
}

export function createProportionProfileFromArtifacts({ commonReference, bodyReference, bodyType, toleranceBytes }) {
  if (!(toleranceBytes instanceof Uint8Array)) throw new Error('exact tolerance artifact bytes required');
  const tolerance = JSON.parse(Buffer.from(toleranceBytes).toString('utf8'));
  const common = artifactObservation(commonReference), body = artifactObservation(bodyReference);
  if (body.bodyType !== bodyType) throw new Error('body reference differs from authored body type');
  return createProportionProfile({ commonReference: common, bodyReference: body, bodyType, tolerance: { ...tolerance, evidenceSHA: createHash('sha256').update(toleranceBytes).digest('hex') } });
}

export function verifyProportionArtifacts(profile, artifacts) {
  return verifyProportions(profile, artifactObservation(artifacts));
}

export function proportionInstruction(profile) {
  validateProportionProfile(profile);
  return `Use the fixed 1024x1536 canvas. Common head/face measurements in source pixels: ${canonicalJSON(profile.targets)}. Body type ${profile.bodyType}: shoulder joint span / head width = ${profile.ratios.shoulderToHead}; visible torso cross-section span / head width = ${profile.ratios.torsoToHead}. Pixel tolerance ${profile.tolerance.pixels}; ratio tolerance ${profile.tolerance.ratio}. Preserve authored identity and body type. Never stretch width and height independently or use garment edges as shoulder joints. These measurements require actual output verification, not provider success.`;
}
