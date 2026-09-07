using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
    /// <summary>
    /// Cardinal step on the shared 4-direction integer grid (Concept + Realtime-Formation-Card-Battle).
    /// </summary>
    public enum CardinalDirection
    {
        North = 0,
        East = 1,
        South = 2,
        West = 3
    }

    /// <summary>
    /// Integer grid coordinate. Same orientation grammar as route/station tiles.
    /// </summary>
    public readonly struct GridCoord : IEquatable<GridCoord>
    {
        public readonly int X;
        public readonly int Y;

        public GridCoord(int x, int y)
        {
            X = x;
            Y = y;
        }

        public GridCoord Step(CardinalDirection direction)
        {
            switch (direction)
            {
                case CardinalDirection.North:
                    return new GridCoord(X, Y + 1);
                case CardinalDirection.East:
                    return new GridCoord(X + 1, Y);
                case CardinalDirection.South:
                    return new GridCoord(X, Y - 1);
                case CardinalDirection.West:
                    return new GridCoord(X - 1, Y);
                default:
                    return this;
            }
        }

        public int ManhattanTo(GridCoord other)
        {
            return Math.Abs(X - other.X) + Math.Abs(Y - other.Y);
        }

        public bool Equals(GridCoord other) => X == other.X && Y == other.Y;
        public override bool Equals(object obj) => obj is GridCoord other && Equals(other);
        public override int GetHashCode() => unchecked((X * 397) ^ Y);
        public override string ToString() => X.ToString(CultureInfo.InvariantCulture) + "," + Y.ToString(CultureInfo.InvariantCulture);
    }

    public enum BattleCommandKind
    {
        Move = 1,
        MeleeAttack = 2,
        RangedAttack = 3,
        EndTurn = 4
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
                OpeningHash = OpeningHash
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
        public const string RulesVersion = "poc-srpg-v1";

        /// <summary>
        /// Open a battle from an immutable campaign handoff. Does not touch campaign state.
        /// </summary>
        public static BattleState Open(BattleContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException(nameof(context));
            }

            // Battle seed is content-derived from the handoff hash + world seed (no wall clock).
            var seedMaterial = "battle-open"
                + ";ctx=" + (context.ContextHash ?? string.Empty)
                + ";seed=" + context.WorldSeed.ToString(CultureInfo.InvariantCulture)
                + ";id=" + (context.BattleId ?? string.Empty)
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
                Hp = DefaultMaxHp,
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
                Hp = DefaultMaxHp,
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
                Width = GridWidth,
                Height = GridHeight,
                Units = units,
                ActiveIndex = 0,
                TurnNumber = 1,
                BattleTick = new Tick(0),
                Outcome = BattleOutcomeKind.Ongoing,
                Rng = rng,
                OpeningHash = string.Empty
            };
            state.OpeningHash = ComputeBattleHash(state, null);
            return state;
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
                    return ApplyAttack(state, ledger, cmd, RangedRange, RangedDamage, RangedApCost, "ranged");
                case BattleCommandKind.EndTurn:
                    return ApplyEndTurn(state, ledger, cmd);
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

            if (actor.Ap < MoveApCost)
            {
                return new BattleRejection(BattleRejectReason.InsufficientAp, cmd.ActorId, cmd.Kind);
            }

            var nextPos = new GridCoord(checked(actor.Position.X + cmd.Dx), checked(actor.Position.Y + cmd.Dy));
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
            nextActor.Ap = checked(nextActor.Ap - MoveApCost);
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
            string kindLabel)
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

            var distance = actor.Position.ManhattanTo(target.Position);
            if (distance > range || distance < 1)
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

        /// <summary>
        /// Parse a unit cardinal step into Dx/Dy. Returns false for non-cardinal.
        /// </summary>
        public static bool TryCardinalDelta(CardinalDirection direction, out int dx, out int dy)
        {
            switch (direction)
            {
                case CardinalDirection.North:
                    dx = 0;
                    dy = 1;
                    return true;
                case CardinalDirection.East:
                    dx = 1;
                    dy = 0;
                    return true;
                case CardinalDirection.South:
                    dx = 0;
                    dy = -1;
                    return true;
                case CardinalDirection.West:
                    dx = -1;
                    dy = 0;
                    return true;
                default:
                    dx = 0;
                    dy = 0;
                    return false;
            }
        }
    }
}
