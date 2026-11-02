// Offline proposal arithmetic. No imports from or registration with product Core.
const check = (ok, code) => { if (!ok) throw new Error(code); };
const uint = (value, positive = false) => {
  check(Number.isSafeInteger(value) && value >= (positive ? 1 : 0), 'INTEGER_RANGE');
  return BigInt(value);
};
const number = value => {
  check(value <= BigInt(Number.MAX_SAFE_INTEGER), 'OVERFLOW');
  return Number(value);
};
const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);

export function baseAttributes({ st, dx, ht }) {
  const strength = uint(st, true);
  const speed = uint(dx, true) + uint(ht, true);
  const squared = strength * strength;
  const liftFifthLb = squared >= 50n ? ((squared + 2n) / 5n) * 5n : squared;
  return { liftFifthLb: number(liftFifthLb), speedNumerator: number(speed),
    speedDenominator: 4, initialBasicMove: number(speed / 4n) };
}

export function personalMove({ basicMove, liftFifthLb, loadFifthLb, hp, maxHp, fp, maxFp, canWalk }) {
  const move = uint(basicMove, true), lift = uint(liftFifthLb, true), load = uint(loadFifthLb);
  const health = uint(hp, true), maxHealth = uint(maxHp, true);
  const fatigue = uint(fp, true), maxFatigue = uint(maxFp, true);
  check(health <= maxHealth && fatigue <= maxFatigue, 'STATE_RANGE');
  check(canWalk === true, 'UNSUPPORTED_WALKER');
  const level = [1n, 2n, 3n, 6n, 10n].findIndex(limit => load <= lift * limit);
  check(level >= 0, 'OVER_CAPACITY');
  let effective = move * BigInt(5 - level) / 5n;
  if (effective < 1n) effective = 1n;
  if (health * 3n < maxHealth) effective = (effective + 1n) / 2n;
  if (fatigue * 3n < maxFatigue) effective = (effective + 1n) / 2n;
  return { encumbrance: level, move: number(effective) };
}

export function squadMove(members) {
  check(Array.isArray(members) && members.length > 0, 'EMPTY_SQUAD');
  return members.reduce((minimum, member) => Math.min(minimum, personalMove(member).move), Infinity);
}

// NEW DESIGN: an explicit active-travel divisor, not a duration stated by Lite.
// Stance factors 1, 3/2, 1/2, 0, 0 are candidates awaiting owner approval.
export function campaignRates(move, walkingHours) {
  const m = uint(move, true), hours = uint(walkingHours, true);
  check(hours <= 24n, 'HOURS_RANGE');
  const dailyMmPerMove = 16093440n;
  const denominator = hours * 3600n * 2n;
  const factor = gcd(dailyMmPerMove, denominator);
  const perMove = dailyMmPerMove / factor;
  return { denominator: number(denominator / factor),
    rates: Object.fromEntries(Object.entries({ normal: 2n, forced: 3n, ambush: 1n, garrison: 0n, camp: 0n })
      .map(([stance, multiplier]) => [stance, number(m * perMove * multiplier)])) };
}
