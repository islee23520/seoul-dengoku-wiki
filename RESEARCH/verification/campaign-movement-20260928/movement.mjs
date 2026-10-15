// Offline NEW DESIGN calculator. No product imports, approved-data loader or mutation.
import { createHash } from 'node:crypto';

export const RULES = Object.freeze({
  version: 'movement-proposal-v0.1', status: 'draft', q: 1000,
  encumbrance: Object.freeze([1000, 800, 600, 400, 200]),
  loadLimits: Object.freeze([1, 2, 3, 6, 10]),
  stance: Object.freeze({ normal: 1000, forced: 1500, ambush: 500 }),
  edge: Object.freeze({ road: 750, plain: 1000, rough: 1500, underground: 1000, transfer: 1250 }),
});
const MAX = BigInt(Number.MAX_SAFE_INTEGER);
const fail = code => { throw new Error(code); };
const requireThat = (condition, code = 'MALFORMED') => { if (!condition) fail(code); };
const integer = (value, positive = false) => {
  requireThat(Number.isSafeInteger(value) && value >= (positive ? 1 : 0), 'INTEGER_RANGE');
  return BigInt(value);
};
const checked = value => {
  requireThat(value >= 0n && value <= MAX, 'OVERFLOW');
  return Number(value);
};
const id = value => requireThat(typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value));
const bool = value => requireThat(typeof value === 'boolean');
const keyed = values => {
  requireThat(Array.isArray(values));
  const result = new Map();
  for (const value of values) {
    requireThat(value !== null && typeof value === 'object' && !Array.isArray(value));
    id(value.id);
    requireThat(!result.has(value.id), 'DUPLICATE_ID');
    result.set(value.id, value);
  }
  return result;
};
const own = (object, key) => Object.hasOwn(object, key);

export function personalBudget(member) {
  requireThat(member !== null && typeof member === 'object');
  id(member.id);
  requireThat(['commander', 'hero', 'soldier'].includes(member.role));
  const move = integer(member.basicMove);
  const lift = integer(member.basicLift, true);
  const load = integer(member.load);
  requireThat([1000, 750, 0].includes(member.health));
  requireThat([1000, 750, 500, 0].includes(member.fatigue));
  const level = RULES.loadLimits.findIndex(limit => load <= lift * BigInt(limit));
  requireThat(level >= 0, 'OVER_CAPACITY');
  return checked(move * 1000n * BigInt(RULES.encumbrance[level]) * BigInt(member.health) * BigInt(member.fatigue) / 1000000000n);
}

export function squadBudget(squad) {
  id(squad.id);
  const members = [...keyed(squad.members).values()];
  requireThat(members.length > 0, 'EMPTY_SQUAD');
  requireThat(members.filter(member => member.role === 'soldier').length <= 20, 'SOLDIER_LIMIT');
  const budgets = members.map(personalBudget);
  requireThat(['normal', 'forced', 'ambush', 'garrison', 'camp'].includes(squad.stance));
  const base = budgets.reduce((minimum, value) => Math.min(minimum, value));
  return own(RULES.stance, squad.stance) ? checked(BigInt(base) * BigInt(RULES.stance[squad.stance]) / 1000n) : 0;
}

export function edgeCost(edge) {
  requireThat(own(RULES.edge, edge.kind));
  const terrain = integer(edge.terrainPermille, true);
  const surcharge = integer(edge.surchargeU);
  return checked((BigInt(RULES.edge[edge.kind]) * terrain + 999n) / 1000n + surcharge);
}

function validateMap(map) {
  id(map.version);
  const nodes = keyed(map.nodes);
  const edges = keyed(map.edges);
  for (const node of nodes.values()) {
    id(node.layer);
    requireThat(['surface', 'underground'].includes(node.domain));
    bool(node.zoc);
  }
  for (const edge of edges.values()) {
    requireThat(nodes.has(edge.from) && nodes.has(edge.to), 'UNKNOWN_NODE');
    bool(edge.allowed); bool(edge.blocked);
    edgeCost(edge);
  }
  return { nodes, edges };
}

// MOVE only. Commands for attack/stance/retreat/reservations belong to separate contracts.
export function evaluateMove(input) {
  try {
    requireThat(input !== null && typeof input === 'object');
    const { squad, map, command } = input;
    requireThat(squad && map && command);
    id(command.id);
    requireThat(command.kind === 'MOVE', 'UNSUPPORTED_COMMAND');
    requireThat(command.squadId === squad.id, 'WRONG_SQUAD');
    const budgetU = squadBudget(squad);
    const spent = integer(squad.spentU);
    requireThat(spent <= BigInt(budgetU), 'INVALID_SPENT');
    bool(squad.stopped); bool(squad.usedForcedMarchThisTurn);
    const remainingU = budgetU - squad.spentU;
    const { nodes, edges } = validateMap(map);
    requireThat(nodes.has(squad.node), 'UNKNOWN_NODE');
    requireThat(Array.isArray(command.path) && command.path.length > 0, 'EMPTY_PATH');
    const path = command.path.map(edgeId => { id(edgeId); requireThat(edges.has(edgeId), 'UNKNOWN_EDGE'); return edges.get(edgeId); });
    let current = squad.node;
    for (const edge of path) { requireThat(edge.from === current, 'NOT_ADJACENT'); current = edge.to; }
    for (const edge of path) {
      const from = nodes.get(edge.from), to = nodes.get(edge.to);
      if (edge.kind !== 'transfer') {
        requireThat(from.layer === to.layer, 'LAYER_MISMATCH');
        const domain = edge.kind === 'underground' ? 'underground' : 'surface';
        requireThat(from.domain === domain && to.domain === domain, 'LAYER_MISMATCH');
      }
      // Transfer endpoints are the explicit directed pair in the validated map.
    }
    for (const edge of path) requireThat(edge.allowed, 'NO_PERMISSION');
    for (const edge of path) requireThat(!edge.blocked, 'BLOCKED');
    requireThat(own(RULES.stance, squad.stance) && !squad.stopped, 'STANCE_STOP');
    requireThat(!nodes.get(squad.node).zoc, 'START_ZOC');
    for (const edge of path.slice(0, -1)) requireThat(!nodes.get(edge.to).zoc, 'ZOC_TRANSIT');
    const costU = checked(path.reduce((sum, edge) => sum + BigInt(edgeCost(edge)), 0n));
    requireThat(costU <= remainingU, 'INSUFFICIENT_BUDGET');
    const stop = nodes.get(current).zoc ? 'ZOC' : null;
    return { ok: true, costU, budgetU, remainingU: remainingU - costU, node: current, stop,
      usedForcedMarchThisTurn: squad.usedForcedMarchThisTurn || squad.stance === 'forced' };
  } catch (error) {
    // Invalid JSON shapes should be rejected too, not become an uncaught TypeError.
    return { ok: false, code: error instanceof TypeError ? 'MALFORMED' : error.message };
  }
}

export function canInitiate(squad, kind) {
  requireThat(['ATTACK', 'INTERCEPT'].includes(kind));
  bool(squad.usedForcedMarchThisTurn);
  requireThat(['normal', 'forced', 'ambush', 'garrison', 'camp'].includes(squad.stance));
  return !(squad.usedForcedMarchThisTurn || squad.stance === 'forced' || (kind === 'ATTACK' && squad.stance === 'camp'));
}

function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') { integer(value); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  requireThat(value && typeof value === 'object', 'MALFORMED_HASH');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
const sorted = values => [...keyed(values).values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const fields = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key]]));

// This hashes a research batch, not an authoritative simultaneous resolution.
export function packetHash({ turn, worldTime, previousHash, map, squads, commands }) {
  integer(turn); integer(worldTime);
  requireThat(typeof previousHash === 'string' && /^[0-9a-f]{64}$/.test(previousHash));
  validateMap(map);
  // Hash and evaluate the same explicit semantic projection. Unknown display and
  // transport metadata must not acquire replay meaning through an object spread.
  const semanticMap = {
    version: map.version,
    nodes: sorted(map.nodes).map(node => fields(node, ['id', 'layer', 'domain', 'zoc'])),
    edges: sorted(map.edges).map(edge => fields(edge, ['id', 'from', 'to', 'kind', 'terrainPermille', 'surchargeU', 'allowed', 'blocked'])),
  };
  const orderedSquads = sorted(squads).map(squad => {
    squadBudget(squad);
    return {
      ...fields(squad, ['id', 'node', 'stance', 'spentU', 'stopped', 'usedForcedMarchThisTurn']),
      members: sorted(squad.members).map(member => fields(member, ['id', 'role', 'basicMove', 'basicLift', 'load', 'health', 'fatigue'])),
    };
  });
  const byId = new Map(orderedSquads.map(squad => [squad.id, squad]));
  const orderedCommands = sorted(commands).map(command => fields(command, ['id', 'squadId', 'kind', 'path']));
  for (const command of orderedCommands) requireThat(byId.has(command.squadId), 'WRONG_SQUAD');
  const envelope = { canonicalVersion: 'research-v1', rules: RULES, turn, worldTime, previousHash,
    map: semanticMap, squads: orderedSquads, commands: orderedCommands,
    results: orderedCommands.map(command => ({ id: command.id, result: evaluateMove({ map: semanticMap, squad: byId.get(command.squadId), command }) })) };
  const bytes = canonical(envelope);
  return { bytes, sha256: createHash('sha256').update(bytes, 'utf8').digest('hex') };
}
