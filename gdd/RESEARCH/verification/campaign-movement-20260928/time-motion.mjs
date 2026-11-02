// Decision14 research fixture, not Core. No speed, distance or time-unit defaults.
const requireThat = (condition, code) => { if (!condition) throw new Error(code); };
const integer = (value, positive = false) => {
  requireThat(Number.isSafeInteger(value) && value >= (positive ? 1 : 0), 'INTEGER_RANGE');
  return BigInt(value);
};
const checked = value => { requireThat(value <= BigInt(Number.MAX_SAFE_INTEGER), 'OVERFLOW'); return Number(value); };

// One unchanged rate/path/access snapshot per interval. Split at authoritative
// events before calling; dynamic collisions and command replacement are not modeled.
export function advanceMotion({ state, elapsedU, speedNumerator, speedDenominator, edges, worldActive, battleLocked }) {
  const elapsed = integer(elapsedU), numerator = integer(speedNumerator), denominator = integer(speedDenominator, true);
  const time = integer(state.worldTimeU), distance = integer(state.distanceU), carry = integer(state.remainder);
  requireThat(carry < denominator, 'INVALID_REMAINDER');
  requireThat(typeof worldActive === 'boolean' && typeof battleLocked === 'boolean', 'INVALID_LOCK');
  requireThat(Array.isArray(edges) && edges.length > 0, 'EMPTY_PATH');
  const ids = new Set();
  let total = 0n;
  for (const [index, edge] of edges.entries()) {
    for (const key of ['id', 'from', 'to', 'fromLayer', 'toLayer']) requireThat(typeof edge[key] === 'string' && edge[key].length > 0, 'INVALID_ID');
    requireThat(!ids.has(edge.id), 'DUPLICATE_ID'); ids.add(edge.id);
    requireThat(typeof edge.transfer === 'boolean' && typeof edge.endZoc === 'boolean', 'INVALID_EDGE');
    requireThat(edge.allowed === true && edge.blocked === false, 'ACCESS_DENIED');
    requireThat(edge.transfer || edge.fromLayer === edge.toLayer, 'LAYER_MISMATCH');
    if (index) requireThat(edges[index - 1].to === edge.from && edges[index - 1].toLayer === edge.fromLayer, 'NOT_ADJACENT');
    requireThat(!edge.endZoc || index === edges.length - 1, 'ZOC_TRANSIT');
    total += integer(edge.distanceU, true);
  }
  checked(total);
  requireThat(distance <= total && (distance < total || carry === 0n), 'INVALID_PROGRESS');
  if (!worldActive) return { ...state };
  const worldTimeU = checked(time + elapsed);
  if (battleLocked) return { ...state, worldTimeU };
  const scaled = numerator * elapsed + carry;
  const next = distance + scaled / denominator;
  return next >= total
    ? { worldTimeU, distanceU: Number(total), remainder: 0 }
    : { worldTimeU, distanceU: Number(next), remainder: Number(scaled % denominator) };
}
