const KINDS = new Set(['clothes', 'hair', 'beard']);

function fail(message) { throw new Error(message); }

export function validateAttachmentRigs(document) {
  if (document?.schema_version !== 1 || document.canvas?.width !== 1145 || document.canvas?.height !== 1374 || !Array.isArray(document.rigs)) {
    fail('attachment rig 형식 오류');
  }
  const ids = new Set();
  for (const rig of document.rigs) {
    if (!rig?.id || ids.has(rig.id) || !KINDS.has(rig.kind) || !Array.isArray(rig.contours)) fail('attachment rig ID/kind 오류');
    for (const contour of rig.contours) {
      if (contour?.closed !== true || !Array.isArray(contour.segments) || contour.segments.length === 0) fail(`${rig.id}: 닫힌 cubic contour가 필요합니다.`);
      for (const segment of contour.segments) for (const key of ['p0', 'c1', 'c2', 'p3']) {
        const point = segment[key];
        if (!Array.isArray(point) || point.length !== 2 || point.some(value => !Number.isFinite(value) || value < 0 || value > 1)) fail(`${rig.id}: normalized point 오류`);
      }
    }
    ids.add(rig.id);
  }
  return document;
}

function point(canvas, value) { return [value[0] * canvas.width, value[1] * canvas.height]; }

export function rigForSelection(document, selection, requested = 'auto') {
  validateAttachmentRigs(document);
  const kind = requested === 'auto' ? selection.sex === 'female' ? 'clothes' : 'hair' : requested;
  return document.rigs.find(rig => rig.kind === kind) ?? null;
}

export function drawAttachmentRig(canvas, document, selection, requested = 'auto') {
  const rig = requested === 'none' ? null : rigForSelection(document, selection, requested);
  canvas.width = document.canvas.width; canvas.height = document.canvas.height;
  const context = canvas.getContext('2d');
  if (!context) fail('attachment guide canvas 2D를 사용할 수 없습니다.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!rig) return null;
  context.lineJoin = 'round'; context.lineCap = 'round';
  for (const contour of rig.contours) {
    context.beginPath();
    const first = point(canvas, contour.segments[0].p0); context.moveTo(...first);
    for (const segment of contour.segments) {
      const c1 = point(canvas, segment.c1), c2 = point(canvas, segment.c2), p3 = point(canvas, segment.p3);
      context.bezierCurveTo(...c1, ...c2, ...p3);
    }
    context.closePath();
    context.fillStyle = 'rgba(196,221,155,.10)'; context.fill();
    context.strokeStyle = 'rgba(255,48,144,.95)'; context.lineWidth = 4; context.stroke();
    for (const segment of contour.segments) {
      const p0 = point(canvas, segment.p0), c1 = point(canvas, segment.c1), c2 = point(canvas, segment.c2), p3 = point(canvas, segment.p3);
      context.beginPath(); context.moveTo(...p0); context.lineTo(...c1); context.moveTo(...c2); context.lineTo(...p3);
      context.strokeStyle = 'rgba(64,192,255,.75)'; context.lineWidth = 2; context.stroke();
      for (const control of [p0, c1, c2, p3]) {
        context.beginPath(); context.arc(control[0], control[1], 7, 0, Math.PI * 2); context.fillStyle = 'rgba(255,196,32,.95)'; context.fill();
      }
    }
  }
  return rig;
}
