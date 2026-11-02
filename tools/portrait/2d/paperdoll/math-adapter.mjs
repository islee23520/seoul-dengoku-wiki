import {strictJSONParse} from '../design-prompt.mjs';
import {checked} from './workflow.mjs';

// Actual bb-proportion-comparison.json fields. This validates evidence binding,
// not a perfect anatomy fit, socket estimate, statistical confidence or threshold.
export async function measuredRegistration(reference,sourceSha256) {
  const report=strictJSONParse((await checked(reference)).toString('utf8'));
  const fail=message=>{throw new Error(message);};
  if(report.schemaVersion!==1||report.status!=='MEASURED_DESIGN_NOT_APPROVED_MASTER'||report.source?.sha256!==sourceSha256)fail('actual mathematical report/source mismatch');
  await checked({path:report.source.path,sha256:report.source.sha256});await checked({path:report.visual.path,sha256:report.visual.sha256});
  if(report.visual.finishedArt!==false||!report.metrics||!report.neckConstraint||!Array.isArray(report.pivotSensitivity))fail('measurement uncertainty/proxy evidence missing');
  for(const fit of [report.headFit,report.torsoGarmentProxyFit])if(!Number.isFinite(fit?.scale)||fit.scale<=0||!Array.isArray(fit.translation)||fit.translation.length!==2||!fit.translation.every(Number.isFinite))fail('invalid measured isotropic fit');
  if(!Number.isFinite(report.headFit.rmsPx)||!Array.isArray(report.headFit.residualsXY)||!Array.isArray(report.torsoGarmentProxyFit.verticalResidualsPx)||!report.source.canonicalLandmarks?.points||!report.reference?.landmarks)fail('observed landmarks/residuals missing');
  return {report:reference,source:report.source,visual:report.visual,headFit:report.headFit,torsoGarmentProxyFit:report.torsoGarmentProxyFit,metrics:report.metrics,neckConstraint:report.neckConstraint,pivotSensitivity:report.pivotSensitivity,sourceLandmarks:report.source.canonicalLandmarks,referenceLandmarks:report.reference.landmarks,limitations:report.limitations,editRequired:report.neckConstraint.status==='UNDERDETERMINED'};
}
