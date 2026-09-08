using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
    public enum BattleCommandKind
    {
        Move = 1,
        MeleeAttack = 2,
        RangedAttack = 3,
        EndTurn = 4,
        Wait = 5
    }

    public enum BattleRejectReason
    {
        None = 0,
        DiagonalOrInvalidStep = 1,
        OutOfTurn = 2,
        OutOfRange = 3,
        InsufficientAp = 4,
        Occupied = 5,
        OutOfBounds = 6,
        BattleEnded = 7,
        UnknownActor = 8,
        InvalidTarget = 9,
        ActorDowned = 10
    }

    public enum BattleOutcomeKind
    {
        Ongoing = 0,
        PlayerVictory = 1,
        EnemyVictory = 2
    }

    public sealed class BattleCommand
    {
        public CommandId Id;
        public BattleCommandKind Kind;
        public string ActorId;
        public string TargetId;
        /// <summary>Move delta. Legal moves are unit cardinal steps only (|dx|+|dy|==1).</summary>
        public int Dx;
        public int Dy;
    }

    public sealed class BattleRejection
    {
        public readonly BattleRejectReason Reason;
        public readonly string ActorId;
        public readonly BattleCommandKind Attempted;

        public BattleRejection(BattleRejectReason reason, string actorId, BattleCommandKind attempted)
        {
            Reason = reason;
            ActorId = actorId ?? string.Empty;
            Attempted = attempted;
        }
    }

    /// <summary>
    /// One combatant snapshot. Mutated only via BattleState.Clone + BattleApi.Apply success path.
    /// </summary>
    public sealed class BattleUnit
    {
        public string UnitId;
        public bool IsPlayer;
        public GridCoord Position;
        public int Hp;
        public int MaxHp;
        public int Ap;
        public int MaxAp;
        public int Initiative;

        public bool IsDowned => Hp <= 0;

        public BattleUnit Clone()
        {
            return new BattleUnit
            {
                UnitId = UnitId,
                IsPlayer = IsPlayer,
                Position = Position,
                Hp = Hp,
                MaxHp = MaxHp,
                Ap = Ap,
                MaxAp = MaxAp,
                Initiative = Initiative
            };
        }
    }

    /// <summary>
    /// Live battle. Successful commands return a new instance; rejections leave caller untouched.
    /// Holds a reference to the immutable campaign <see cref="BattleContext"/> handoff only —
    /// never resolves campaign repository/state.
    /// </summary>
    public sealed class BattleState
    {
        public BattleContext Context;
        public int Width;
        public int Height;
        public List<BattleUnit> Units;
        public int ActiveIndex;
        public int TurnNumber;
        public Tick BattleTick;
        public BattleOutcomeKind Outcome;
        public PurposeRng Rng;
        public string OpeningHash;
        /// <summary>Owned immutable terrain snapshot; null for the flat POC grid.</summary>
        public Heightmap Terrain;

        public BattleUnit ActiveUnit
        {
            get
            {
                if (Units == null || Units.Count == 0)
                {
                    return null;
                }

                if (ActiveIndex < 0 || ActiveIndex >= Units.Count)
                {
                    return null;
                }

                return Units[ActiveIndex];
            }
        }

        public BattleState Clone()
        {
            var units = new List<BattleUnit>(Units != null ? Units.Count : 0);
            if (Units != null)
            {
                for (var i = 0; i < Units.Count; i++)
                {
                    units.Add(Units[i].Clone());
                }
            }

            return new BattleState
            {
                Context = Context,
                Width = Width,
                Height = Height,
                Units = units,
                ActiveIndex = ActiveIndex,
                TurnNumber = TurnNumber,
                BattleTick = BattleTick,
                Outcome = Outcome,
                Rng = Rng != null ? Rng.Clone() : null,
                OpeningHash = OpeningHash,
                Terrain = Terrain != null ? Terrain.Snapshot() : null
            };
        }
    }

    /// <summary>
    /// Engine-free deterministic SRPG rules for the POC tactical slice (Todo 8).
    /// </summary>
    public static class BattleApi
    {
        public const int GridWidth = 5;
        public const int GridHeight = 5;
        public const int DefaultMaxHp = 10;
        public const int DefaultMaxAp = 3;
        public const int MoveApCost = 1;
        public const int MeleeApCost = 2;
        public const int MeleeRange = 1;
        public const int MeleeDamage = 5;
        public const int RangedApCost = 2;
        public const int RangedRange = 3;
        public const int RangedDamage = 3;
        public const string AllyId = "ally-0";
        public const string FoeId = "foe-0";
        public const string RulesVersion = "poc-srpg-v2";

        /// <summary>
        /// Open a battle from an immutable campaign handoff. Does not touch campaign state.
        /// </summary>
        public static BattleState Open(BattleContext context)
        {
            return OpenCore(context, null);
        }

        /// <summary>
        /// Open a battle on an owned snapshot of the caller's terrain: the opened battle never
        /// aliases the input map, grid dims come from the map and cardinal moves price via
        /// <see cref="Heightmap.MoveCost"/> (water impassable).
        /// </summary>
        public static BattleState Open(BattleContext context, Heightmap terrain)
        {
            if (terrain == null)
            {
                throw new ArgumentNullException(nameof(terrain));
            }

            return OpenCore(context, terrain.Snapshot());
        }

        static BattleState OpenCore(BattleContext context, Heightmap terrain)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            context.ValidateIntegrity();
            var allyHp = ResolveStartHp(context, AllyId, requiredPersistent: true);
            var foeHp = ResolveStartHp(context, FoeId, requiredPersistent: false);

            // Seed identity is deliberately separate from complete context integrity. Rebuilding
            // the pre-HP battle id preserves the established initiative/RNG stream while StartHp
            // remains authenticated by ContextHash and the public BattleId.
            var seedIdentityHash = context.SeedIdentityHash ?? string.Empty;
            var seedMaterial = "battle-open"
                + ";ctx=" + seedIdentityHash
                + ";seed=" + context.WorldSeed.ToString(CultureInfo.InvariantCulture)
                + ";id=" + (context.SeedIdentityBattleId ?? string.Empty)
                + ";loc=" + (context.Location.Value ?? string.Empty);
            var seedHash = CoreApi.StableHashHex(seedMaterial);
            // Take first 8 hex digits as signed seed.
            var seed = unchecked((int)Convert.ToUInt32(seedHash.Substring(0, 8), 16));
            var rng = new PurposeRng(seed);

            // Fixed POC spawn on a small station grid. Initiative from Battle stream only.
            var allyInit = Math.Abs(rng.Consume(RngPurpose.Battle) % 100);
            var foeInit = Math.Abs(rng.Consume(RngPurpose.Battle) % 100);
            // Tie-break by unit id ordinal so order is total and deterministic.
            if (allyInit == foeInit)
            {
                foeInit = checked(foeInit + 1);
            }

            var ally = new BattleUnit
            {
                UnitId = AllyId,
                IsPlayer = true,
                Position = new GridCoord(1, 2),
                Hp = allyHp,
                MaxHp = DefaultMaxHp,
                Ap = DefaultMaxAp,
                MaxAp = DefaultMaxAp,
                Initiative = allyInit
            };
            var foe = new BattleUnit
            {
                UnitId = FoeId,
                IsPlayer = false,
                Position = new GridCoord(3, 2),
                Hp = foeHp,
                MaxHp = DefaultMaxHp,
                Ap = DefaultMaxAp,
                MaxAp = DefaultMaxAp,
                Initiative = foeInit
            };

            var units = new List<BattleUnit>(2);
            if (CompareInitiative(ally, foe) <= 0)
            {
                units.Add(ally);
                units.Add(foe);
            }
            else
            {
                units.Add(foe);
                units.Add(ally);
            }

            var state = new BattleState
            {
                Context = context,
                Width = terrain != null ? terrain.Width : GridWidth,
                Height = terrain != null ? terrain.Height : GridHeight,
                Terrain = terrain,
                Units = units,
                ActiveIndex = 0,
                TurnNumber = 1,
                BattleTick = new Tick(0),
                Outcome = BattleOutcomeKind.Ongoing,
                Rng = rng,
                OpeningHash = string.Empty
            };
            state.Outcome = EvaluateOutcome(state);
            state.OpeningHash = ComputeBattleHash(state, null);
            return state;
        }

        /// <summary>
        /// Opening HP for a unit: the persistent ally is required; the non-persistent foe may be
        /// absent and then uses the initial default. Zero is a valid downed value. Other values
        /// outside 0..DefaultMaxHp are corrupt and throw rather than silently healing.
        /// </summary>
        static int ResolveStartHp(BattleContext context, string unitId, bool requiredPersistent)
        {
            if (context == null || context.StartHp == null || !context.StartHp.TryGet(unitId, out var hp))
            {
                if (requiredPersistent)
                {
                    throw new ArgumentException(
                        "Missing required persistent start HP for unit '" + unitId + "'.",
                        nameof(context));
                }

                return DefaultMaxHp;
            }

            if (hp < 0 || hp > DefaultMaxHp)
            {
                throw new ArgumentException(
                    "Corrupt start HP for unit '" + unitId + "': "
                    + hp.ToString(CultureInfo.InvariantCulture)
                    + " (expected 0.." + DefaultMaxHp.ToString(CultureInfo.InvariantCulture) + ").",
                    nameof(context));
            }

            return hp;
        }

        public static object Apply(BattleState state, Ledger ledger, BattleCommand cmd)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            if (ledger == null)
            {
                throw new ArgumentNullException(nameof(ledger));
            }

            if (cmd == null)
            {
                throw new ArgumentNullException(nameof(cmd));
            }

            if (state.Outcome != BattleOutcomeKind.Ongoing)
            {
                return new BattleRejection(BattleRejectReason.BattleEnded, cmd.ActorId, cmd.Kind);
            }

            switch (cmd.Kind)
            {
                case BattleCommandKind.Move:
                    return ApplyMove(state, ledger, cmd);
                case BattleCommandKind.MeleeAttack:
                    return ApplyAttack(state, ledger, cmd, MeleeRange, MeleeDamage, MeleeApCost, "melee");
                case BattleCommandKind.RangedAttack:
                    return ApplyAttack(state, ledger, cmd, RangedRange, RangedDamage, RangedApCost, "ranged", allowHighGroundBonus: true);
                case BattleCommandKind.EndTurn:
                    return ApplyEndTurn(state, ledger, cmd);
                case BattleCommandKind.Wait:
                    return ApplyWait(state, ledger, cmd);
                default:
                    return new BattleRejection(BattleRejectReason.UnknownActor, cmd.ActorId, cmd.Kind);
            }
        }

        static object ApplyMove(BattleState state, Ledger ledger, BattleCommand cmd)
        {
            var actorCheck = RequireActiveActor(state, cmd);
            if (actorCheck is BattleRejection)
            {
                return actorCheck;
            }

            var actor = (BattleUnit)actorCheck;

            // Cardinal unit step only: exactly one of |dx|,|dy| is 1, the other 0.
            var adx = Math.Abs(cmd.Dx);
            var ady = Math.Abs(cmd.Dy);
            if (!((adx == 1 && ady == 0) || (adx == 0 && ady == 1)))
            {
                return new BattleRejection(BattleRejectReason.DiagonalOrInvalidStep, cmd.ActorId, cmd.Kind);
            }

            var nextPos = new GridCoord(checked(actor.Position.X + cmd.Dx), checked(actor.Position.Y + cmd.Dy));
            var cost = MoveApCost;
            if (state.Terrain != null)
            {
                // Terrain prices the cardinal step; -1 marks water (impassable) like off-grid.
                cost = state.Terrain.MoveCost(actor.Position, nextPos);
                if (cost < 0)
                {
                    return new BattleRejection(BattleRejectReason.OutOfBounds, cmd.ActorId, cmd.Kind);
                }
            }

            if (actor.Ap < cost)
            {
                return new BattleRejection(BattleRejectReason.InsufficientAp, cmd.ActorId, cmd.Kind);
            }

            if (!InBounds(state, nextPos))
            {
                return new BattleRejection(BattleRejectReason.OutOfBounds, cmd.ActorId, cmd.Kind);
            }

            if (IsOccupied(state, nextPos, actor.UnitId))
            {
                return new BattleRejection(BattleRejectReason.Occupied, cmd.ActorId, cmd.Kind);
            }

            var next = state.Clone();
            var nextActor = FindUnit(next, actor.UnitId);
            nextActor.Position = nextPos;
            nextActor.Ap = checked(nextActor.Ap - cost);
            next.BattleTick = state.BattleTick.Next();
            AppendEvent(ledger, cmd, next, "move:" + nextPos, nextActor.Ap);
            return next;
        }

        static object ApplyAttack(
            BattleState state,
            Ledger ledger,
            BattleCommand cmd,
            int range,
            int damage,
            int apCost,
            string kindLabel,
            bool allowHighGroundBonus = false)
        {
            var actorCheck = RequireActiveActor(state, cmd);
            if (actorCheck is BattleRejection)
            {
                return actorCheck;
            }

            var actor = (BattleUnit)actorCheck;

            if (string.IsNullOrEmpty(cmd.TargetId))
            {
                return new BattleRejection(BattleRejectReason.InvalidTarget, cmd.ActorId, cmd.Kind);
            }

            var target = FindUnit(state, cmd.TargetId);
            if (target == null || target.IsDowned)
            {
                return new BattleRejection(BattleRejectReason.InvalidTarget, cmd.ActorId, cmd.Kind);
            }

            // Cannot attack self or same side.
            if (string.Equals(target.UnitId, actor.UnitId, StringComparison.Ordinal) || target.IsPlayer == actor.IsPlayer)
            {
                return new BattleRejection(BattleRejectReason.InvalidTarget, cmd.ActorId, cmd.Kind);
            }

            if (actor.Ap < apCost)
            {
                return new BattleRejection(BattleRejectReason.InsufficientAp, cmd.ActorId, cmd.Kind);
            }

            var effectiveRange = range;
            if (allowHighGroundBonus && state.Terrain != null
                && state.Terrain.Get(actor.Position) > state.Terrain.Get(target.Position))
            {
                // High ground reaches one tile further (BBM53); no hit or damage bonus (FFT §6.8).
                effectiveRange++;
            }

            var distance = actor.Position.ManhattanTo(target.Position);
            if (distance > effectiveRange || distance < 1)
            {
                return new BattleRejection(BattleRejectReason.OutOfRange, cmd.ActorId, cmd.Kind);
            }

            var next = state.Clone();
            var nextActor = FindUnit(next, actor.UnitId);
            var nextTarget = FindUnit(next, target.UnitId);
            nextActor.Ap = checked(nextActor.Ap - apCost);
            nextTarget.Hp = nextTarget.Hp - damage;
            if (nextTarget.Hp < 0)
            {
                nextTarget.Hp = 0;
            }

            next.BattleTick = state.BattleTick.Next();
            next.Outcome = EvaluateOutcome(next);
            AppendEvent(
                ledger,
                cmd,
                next,
                kindLabel + ":" + (cmd.TargetId ?? string.Empty) + ":dmg=" + damage.ToString(CultureInfo.InvariantCulture),
                nextTarget.Hp);
            return next;
        }

        static object ApplyWait(BattleState state, Ledger ledger, BattleCommand cmd)
        {
            var actorCheck = RequireActiveActor(state, cmd);
            if (actorCheck is BattleRejection)
            {
                return actorCheck;
            }

            var actor = (BattleUnit)actorCheck;
            var next = state.Clone();

            var startIndex = -1;
            for (var i = 0; i < next.Units.Count; i++)
            {
                if (next.Units[i].UnitId == actor.UnitId)
                {
                    startIndex = i;
                    break;
                }
            }

            for (var offset = 1; offset < next.Units.Count; offset++)
            {
                var candidateIndex = (startIndex + offset) % next.Units.Count;
                if (next.Units[candidateIndex].Hp > 0)
                {
                    next.ActiveIndex = candidateIndex;
                    break;
                }
            }

            AppendEvent(ledger, cmd, next, "wait", actor.Ap);
            return next;
        }

        static object ApplyEndTurn(BattleState state, Ledger ledger, BattleCommand cmd)
        {
            var actorCheck = RequireActiveActor(state, cmd);
            if (actorCheck is BattleRejection)
            {
                return actorCheck;
            }

            var next = state.Clone();
            var advanced = AdvanceTurn(next);
            if (!advanced)
            {
                // Softlock guard: if no living unit can act, force outcome from remaining sides.
                next.Outcome = EvaluateOutcome(next);
                if (next.Outcome == BattleOutcomeKind.Ongoing)
                {
                    // Both sides somehow living but no active — should not happen with 2 units.
                    next.Outcome = BattleOutcomeKind.PlayerVictory;
                }
            }

            next.BattleTick = state.BattleTick.Next();
            AppendEvent(ledger, cmd, next, "end-turn", next.ActiveIndex);
            return next;
        }

        static object RequireActiveActor(BattleState state, BattleCommand cmd)
        {
            if (string.IsNullOrEmpty(cmd.ActorId))
            {
                return new BattleRejection(BattleRejectReason.UnknownActor, cmd.ActorId, cmd.Kind);
            }

            var actor = FindUnit(state, cmd.ActorId);
            if (actor == null)
            {
                return new BattleRejection(BattleRejectReason.UnknownActor, cmd.ActorId, cmd.Kind);
            }

            if (actor.IsDowned)
            {
                return new BattleRejection(BattleRejectReason.ActorDowned, cmd.ActorId, cmd.Kind);
            }

            var active = state.ActiveUnit;
            if (active == null || !string.Equals(active.UnitId, actor.UnitId, StringComparison.Ordinal))
            {
                return new BattleRejection(BattleRejectReason.OutOfTurn, cmd.ActorId, cmd.Kind);
            }

            return actor;
        }

        static bool AdvanceTurn(BattleState state)
        {
            if (state.Units == null || state.Units.Count == 0)
            {
                return false;
            }

            var count = state.Units.Count;
            var start = state.ActiveIndex;
            for (var step = 1; step <= count; step++)
            {
                var idx = (start + step) % count;
                var unit = state.Units[idx];
                if (!unit.IsDowned)
                {
                    state.ActiveIndex = idx;
                    unit.Ap = unit.MaxAp;
                    state.TurnNumber = checked(state.TurnNumber + 1);
                    return true;
                }
            }

            return false;
        }

        static BattleOutcomeKind EvaluateOutcome(BattleState state)
        {
            var playerAlive = false;
            var enemyAlive = false;
            for (var i = 0; i < state.Units.Count; i++)
            {
                var u = state.Units[i];
                if (u.IsDowned)
                {
                    continue;
                }

                if (u.IsPlayer)
                {
                    playerAlive = true;
                }
                else
                {
                    enemyAlive = true;
                }
            }

            if (!enemyAlive && playerAlive)
            {
                return BattleOutcomeKind.PlayerVictory;
            }

            if (!playerAlive && enemyAlive)
            {
                return BattleOutcomeKind.EnemyVictory;
            }

            if (!playerAlive && !enemyAlive)
            {
                // Mutual KO: treat as enemy victory (fail closed for player objective).
                return BattleOutcomeKind.EnemyVictory;
            }

            return BattleOutcomeKind.Ongoing;
        }

        static bool InBounds(BattleState state, GridCoord pos)
        {
            return pos.X >= 0 && pos.Y >= 0 && pos.X < state.Width && pos.Y < state.Height;
        }

        static bool IsOccupied(BattleState state, GridCoord pos, string exceptUnitId)
        {
            for (var i = 0; i < state.Units.Count; i++)
            {
                var u = state.Units[i];
                if (u.IsDowned)
                {
                    continue;
                }

                if (string.Equals(u.UnitId, exceptUnitId, StringComparison.Ordinal))
                {
                    continue;
                }

                if (u.Position.Equals(pos))
                {
                    return true;
                }
            }

            return false;
        }

        public static BattleUnit FindUnit(BattleState state, string unitId)
        {
            if (state == null || state.Units == null || unitId == null)
            {
                return null;
            }

            for (var i = 0; i < state.Units.Count; i++)
            {
                if (string.Equals(state.Units[i].UnitId, unitId, StringComparison.Ordinal))
                {
                    return state.Units[i];
                }
            }

            return null;
        }

        static int CompareInitiative(BattleUnit a, BattleUnit b)
        {
            var cmp = a.Initiative.CompareTo(b.Initiative);
            if (cmp != 0)
            {
                return cmp;
            }

            return string.CompareOrdinal(a.UnitId, b.UnitId);
        }

        static void AppendEvent(Ledger ledger, BattleCommand cmd, BattleState next, string kind, int value)
        {
            var activeId = next.ActiveUnit != null ? next.ActiveUnit.UnitId : string.Empty;
            var summary = CoreApi.StableHashHex(
                "battle=" + kind
                + ";cmd=" + (cmd.Id.Value ?? string.Empty)
                + ";actor=" + (cmd.ActorId ?? string.Empty)
                + ";tick=" + next.BattleTick.Value.ToString(CultureInfo.InvariantCulture)
                + ";turn=" + next.TurnNumber.ToString(CultureInfo.InvariantCulture)
                + ";active=" + activeId
                + ";outcome=" + ((int)next.Outcome).ToString(CultureInfo.InvariantCulture)
                + ";val=" + value.ToString(CultureInfo.InvariantCulture)
                + ";units=" + UnitsFingerprint(next));

            ledger.Events.Add(new TypedEvent
            {
                Id = new EventId(
                    "battle-" + next.BattleTick.Value.ToString(CultureInfo.InvariantCulture)
                    + "-" + (cmd.Id.Value ?? "none")),
                CauseId = cmd.Id,
                Value = value,
                At = next.BattleTick,
                SummaryHash = summary
            });
        }

        static string UnitsFingerprint(BattleState state)
        {
            var sb = new StringBuilder(128);
            if (state.Units == null)
            {
                return string.Empty;
            }

            // Units stay in initiative order established at Open — never reorder by hashset.
            for (var i = 0; i < state.Units.Count; i++)
            {
                var u = state.Units[i];
                if (i > 0)
                {
                    sb.Append('|');
                }

                sb.Append(u.UnitId ?? string.Empty)
                    .Append('@')
                    .Append(u.Position.ToString())
                    .Append(":hp=")
                    .Append(u.Hp.ToString(CultureInfo.InvariantCulture))
                    .Append(":ap=")
                    .Append(u.Ap.ToString(CultureInfo.InvariantCulture))
                    .Append(":init=")
                    .Append(u.Initiative.ToString(CultureInfo.InvariantCulture))
                    .Append(":side=")
                    .Append(u.IsPlayer ? "P" : "E");
            }

            return sb.ToString();
        }

        public static string ComputeBattleHash(BattleState state, Ledger ledger)
        {
            var sb = new StringBuilder(256);
            if (state == null)
            {
                sb.Append("battle:null");
            }
            else
            {
                sb.Append("ctx=").Append(state.Context != null ? state.Context.ContextHash ?? string.Empty : string.Empty);
                sb.Append(";w=").Append(state.Width.ToString(CultureInfo.InvariantCulture));
                sb.Append(";h=").Append(state.Height.ToString(CultureInfo.InvariantCulture));
                sb.Append(";active=").Append(state.ActiveIndex.ToString(CultureInfo.InvariantCulture));
                sb.Append(";turn=").Append(state.TurnNumber.ToString(CultureInfo.InvariantCulture));
                sb.Append(";tick=").Append(state.BattleTick.Value.ToString(CultureInfo.InvariantCulture));
                sb.Append(";out=").Append(((int)state.Outcome).ToString(CultureInfo.InvariantCulture));
                sb.Append(";units=").Append(UnitsFingerprint(state));
                if (state.Terrain != null)
                {
                    sb.Append(";map=").Append(state.Terrain.Fingerprint());
                }

                if (state.Rng != null)
                {
                    sb.Append(";rng=").Append(state.Rng.Fingerprint());
                }
            }

            if (ledger == null)
            {
                sb.Append(";ledger=null");
            }
            else
            {
                sb.Append(";events=").Append(ledger.Events.Count.ToString(CultureInfo.InvariantCulture));
                for (var i = 0; i < ledger.Events.Count; i++)
                {
                    var e = ledger.Events[i];
                    sb.Append('|')
                        .Append(i.ToString(CultureInfo.InvariantCulture))
                        .Append(':')
                        .Append(e.Id.Value ?? string.Empty)
                        .Append(',')
                        .Append(e.CauseId.Value ?? string.Empty)
                        .Append(',')
                        .Append(e.Value.ToString(CultureInfo.InvariantCulture))
                        .Append(',')
                        .Append(e.At.Value.ToString(CultureInfo.InvariantCulture))
                        .Append(',')
                        .Append(e.SummaryHash ?? string.Empty);
                }
            }

            return CoreApi.StableHashHex(sb.ToString());
        }

        /// <summary>
        /// Terminal result hash (outcome + final unit snapshot). Stable for identical replays.
        /// </summary>
        public static string ComputeResultHash(BattleState state)
        {
            if (state == null)
            {
                return CoreApi.StableHashHex("result:null");
            }

            var sb = new StringBuilder(128);
            sb.Append("out=").Append(((int)state.Outcome).ToString(CultureInfo.InvariantCulture));
            sb.Append(";tick=").Append(state.BattleTick.Value.ToString(CultureInfo.InvariantCulture));
            sb.Append(";turn=").Append(state.TurnNumber.ToString(CultureInfo.InvariantCulture));
            sb.Append(";units=").Append(UnitsFingerprint(state));
            sb.Append(";ctx=").Append(state.Context != null ? state.Context.ContextHash ?? string.Empty : string.Empty);
            return CoreApi.StableHashHex(sb.ToString());
        }

    }
}
