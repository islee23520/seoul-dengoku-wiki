// Unapproved research only. T=time, D=distance, W=traversal work; no defaults.
import { createHash } from 'node:crypto';
import { advanceMotion } from './time-motion.mjs';
const check = (ok, code) => { if (!ok) throw new Error(code); };
const int = (n, min = 0) => { check(Number.isSafeInteger(n) && n >= min, 'INTEGER_RANGE'); return BigInt(n); };
const number = n => { check(n <= BigInt(Number.MAX_SAFE_INTEGER), 'OVERFLOW'); return Number(n); };
const stances = ['normal', 'forced', 'ambush', 'garrison', 'camp'];
const edgeFields = ['id', 'from', 'to', 'fromLayer', 'toLayer', 'transfer', 'allowed', 'blocked', 'endZoc', 'kind', 'distanceD', 'workNumerator', 'workDenominator', 'entryWorkW'];
const project = (value, fields) => Object.fromEntries(fields.map(key => [key, value[key]]));
const semanticEdge = edge => project(edge, edgeFields);

export function costedPath(edges) {
  return edges.map(edge => {
    check(['road', 'surface', 'underground', 'transfer'].includes(edge.kind), 'TERRAIN_KIND');
    check((edge.kind === 'transfer') === edge.transfer, 'TRANSFER_KIND');
    check(edge.kind !== 'road' && edge.kind !== 'surface' || edge.fromLayer === 'surface', 'TERRAIN_LAYER');
    check(edge.kind !== 'underground' || edge.fromLayer === 'subway', 'TERRAIN_LAYER');
    const d = int(edge.distanceD, 1), n = int(edge.workNumerator, 1), q = int(edge.workDenominator, 1);
    return { ...edge, distanceU: number((d * n + q - 1n) / q + int(edge.entryWorkW)) };
  });
}

function validate(squad, path) {
  for (const key of ['id', 'controllerId', 'orderId']) check(typeof squad[key] === 'string' && squad[key].length > 0, 'SQUAD_ID');
  int(squad.revision);
  check(stances.includes(squad.stance), 'STANCE');
  int(squad.denominator, 1);
  for (const stance of stances) int(squad.rates[stance]);
  check(squad.rates.forced > squad.rates.normal && squad.rates.ambush <= squad.rates.normal && squad.rates.garrison === 0 && squad.rates.camp === 0, 'STANCE_RATES');
  advanceMotion({ state: squad.motion, elapsedU: 0, speedNumerator: squad.rates[squad.stance], speedDenominator: squad.denominator, edges: path, worldActive: true, battleLocked: false });
}

export function advanceOrder(squad, elapsedU, worldActive = true) {
  const path = costedPath(squad.path); validate(squad, path);
  return { ...squad, motion: advanceMotion({ state: squad.motion, elapsedU, speedNumerator: squad.rates[squad.stance], speedDenominator: squad.denominator, edges: path, worldActive, battleLocked: squad.battleLocked }) };
}

// Caller first advances to the authoritative event time. Replacement paths carry
// the retained prefix from the original origin, including the active edge.
// Mid-edge reversal/rerouting, changing cost snapshots and denominator changes
// need a different approved position contract and are deliberately unsupported.
export function replaceOrder(squad, command) {
  check(typeof command.actorId === 'string' && command.actorId.length > 0 && command.actorId === squad.controllerId, 'UNAUTHORIZED');
  check(!squad.battleLocked, 'BATTLE_LOCK');
  check(command.atU === squad.motion.worldTimeU, 'EVENT_TIME');
  check(command.expectedRevision === squad.revision, 'STALE_ORDER');
  check(typeof command.id === 'string' && command.id.length > 0, 'COMMAND_ID');
  check(!['garrison', 'camp'].includes(squad.stance), 'STANCE_STOP');
  const oldPath = costedPath(squad.path), newPath = costedPath(command.path);
  validate(squad, oldPath);
  check(newPath[0]?.from === oldPath[0].from && newPath[0]?.fromLayer === oldPath[0].fromLayer, 'ORIGIN');
  let prefix = 0;
  for (const [i, edge] of oldPath.entries()) {
    if (prefix > squad.motion.distanceU || prefix === squad.motion.distanceU && squad.motion.remainder === 0) break;
    check(newPath[i] && canonical(semanticEdge(edge)) === canonical(semanticEdge(newPath[i])), 'PROGRESS_REWRITE');
    prefix += edge.distanceU;
  }
  const end = oldPath.at(-1);
  check(!(end.endZoc && squad.motion.distanceU === oldPath.reduce((sum, e) => sum + e.distanceU, 0)), 'START_ZOC');
  const next = { ...squad, revision: number(int(squad.revision) + 1n), orderId: command.id, path: structuredClone(command.path) };
  validate(next, newPath); // full path rejection, never prefix execution
  return next;
}

export function canInitiate(stance, action) {
  check(stances.includes(stance), 'STANCE');
  return !(stance === 'forced' && ['ATTACK', 'INTERCEPT'].includes(action) || stance === 'camp' && action === 'ATTACK');
}

export function reachableOnPath(squad, horizonU) {
  const advanced = advanceOrder(squad, horizonU);
  let cumulative = 0;
  return costedPath(squad.path).filter(edge => {
    cumulative += edge.distanceU;
    return cumulative > squad.motion.distanceU && cumulative <= advanced.motion.distanceU;
  }).map(edge => edge.to);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

// Fixed semantic projection: metadata/frame timing/host order are excluded.
export function replayOrders(initial, events) {
  let squad = structuredClone(initial);
  let hash = '0'.repeat(64);
  const receipts = [];
  for (const event of events) {
    check(['advance', 'replace'].includes(event.kind), 'EVENT_KIND');
    if (event.kind === 'advance') {
      check(typeof event.worldActive === 'boolean', 'INVALID_LOCK');
      squad = advanceOrder(squad, event.elapsedU, event.worldActive);
    }
    else squad = replaceOrder(squad, event.command);
    const semantic = {
      version: 'synthetic-time-orders-v1', previousHash: hash,
      event: event.kind === 'advance' ? { kind: event.kind, elapsedU: event.elapsedU, worldActive: event.worldActive } : { kind: event.kind, id: event.command.id, atU: event.command.atU, actorId: event.command.actorId, expectedRevision: event.command.expectedRevision },
      squad: { id: squad.id, controllerId: squad.controllerId, revision: squad.revision, orderId: squad.orderId, stance: squad.stance, rates: project(squad.rates, stances), denominator: squad.denominator, battleLocked: squad.battleLocked, motion: project(squad.motion, ['worldTimeU', 'distanceU', 'remainder']),
        path: squad.path.map(semanticEdge) },
    };
    hash = createHash('sha256').update(canonical(semantic)).digest('hex');
    receipts.push(hash);
  }
  return { squad, hash, receipts };
}
