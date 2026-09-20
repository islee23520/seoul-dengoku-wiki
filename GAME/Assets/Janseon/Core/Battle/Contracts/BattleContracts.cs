using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;

namespace Janseon.Core.Battle.Contracts
{
    public readonly struct UnitId : IEquatable<UnitId>
    {
        public readonly string Value;

        public UnitId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(UnitId other)
        {
            return string.Equals(Value, other.Value, StringComparison.Ordinal);
        }

        public override bool Equals(object obj)
        {
            return obj is UnitId other && Equals(other);
        }

        public override int GetHashCode()
        {
            return StringComparer.Ordinal.GetHashCode(Value ?? string.Empty);
        }

        public override string ToString()
        {
            return Value ?? string.Empty;
        }
    }

    public readonly struct SoldierId : IEquatable<SoldierId>
    {
        public readonly string Value;

        public SoldierId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(SoldierId other)
        {
            return string.Equals(Value, other.Value, StringComparison.Ordinal);
        }

        public override bool Equals(object obj)
        {
            return obj is SoldierId other && Equals(other);
        }

        public override int GetHashCode()
        {
            return StringComparer.Ordinal.GetHashCode(Value ?? string.Empty);
        }

        public override string ToString()
        {
            return Value ?? string.Empty;
        }
    }

    public readonly struct SquadId : IEquatable<SquadId>
    {
        public readonly string Value;

        public SquadId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(SquadId other)
        {
            return string.Equals(Value, other.Value, StringComparison.Ordinal);
        }

        public override bool Equals(object obj)
        {
            return obj is SquadId other && Equals(other);
        }

        public override int GetHashCode()
        {
            return StringComparer.Ordinal.GetHashCode(Value ?? string.Empty);
        }

        public override string ToString()
        {
            return Value ?? string.Empty;
        }
    }

    public readonly struct HeroId : IEquatable<HeroId>
    {
        public readonly string Value;

        public HeroId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(HeroId other)
        {
            return string.Equals(Value, other.Value, StringComparison.Ordinal);
        }

        public override bool Equals(object obj)
        {
            return obj is HeroId other && Equals(other);
        }

        public override int GetHashCode()
        {
            return StringComparer.Ordinal.GetHashCode(Value ?? string.Empty);
        }

        public override string ToString()
        {
            return Value ?? string.Empty;
        }
    }

    public readonly struct BattlePositionMm : IEquatable<BattlePositionMm>
    {
        public readonly int X;
        public readonly int Y;
        public readonly int Z;

        public BattlePositionMm(int x, int y, int z)
        {
            X = x;
            Y = y;
            Z = z;
        }

        public long DistanceSquaredTo(BattlePositionMm other)
        {
            var dx = (long)other.X - X;
            var dy = (long)other.Y - Y;
            var dz = (long)other.Z - Z;
            return dx * dx + dy * dy + dz * dz;
        }

        public long ManhattanDistanceTo(BattlePositionMm other)
        {
            return Math.Abs((long)other.X - X) + Math.Abs((long)other.Y - Y) + Math.Abs((long)other.Z - Z);
        }

        public bool Equals(BattlePositionMm other)
        {
            return X == other.X && Y == other.Y && Z == other.Z;
        }

        public override bool Equals(object obj)
        {
            return obj is BattlePositionMm other && Equals(other);
        }

        public override int GetHashCode()
        {
            return unchecked(((X * 397) ^ Y) * 397 ^ Z);
        }

        public override string ToString()
        {
            return X.ToString(CultureInfo.InvariantCulture) + "," + Y.ToString(CultureInfo.InvariantCulture) + "," + Z.ToString(CultureInfo.InvariantCulture);
        }
    }

    public readonly struct BattleFacing : IEquatable<BattleFacing>
    {
        public const int FullTurnMilliDegrees = 360000;
        public readonly int YawMilliDegrees;

        public BattleFacing(int yawMilliDegrees)
        {
            YawMilliDegrees = Normalize(yawMilliDegrees);
        }

        public static BattleFacing FromDegrees(double degrees)
        {
            return new BattleFacing(checked((int)Math.Round(degrees * 1000d, MidpointRounding.AwayFromZero)));
        }

        public static BattleFacing FromDelta(int deltaX, int deltaZ)
        {
            if (deltaX == 0 && deltaZ == 0)
            {
                return new BattleFacing(0);
            }
            var degrees = Math.Atan2(deltaX, deltaZ) * 180d / Math.PI;
            return FromDegrees(degrees);
        }

        public static BattleFacing FromDirection(int deltaX, int deltaZ)
        {
            return FromDelta(deltaX, deltaZ);
        }

        static int Normalize(int value)
        {
            var normalized = value % FullTurnMilliDegrees;
            return normalized < 0 ? normalized + FullTurnMilliDegrees : normalized;
        }

        public bool Equals(BattleFacing other)
        {
            return YawMilliDegrees == other.YawMilliDegrees;
        }

        public override bool Equals(object obj)
        {
            return obj is BattleFacing other && Equals(other);
        }

        public override int GetHashCode()
        {
            return YawMilliDegrees;
        }

        public override string ToString()
        {
            return YawMilliDegrees.ToString(CultureInfo.InvariantCulture);
        }
    }

    public sealed class NavNode
    {
        public string Id { get; }
        public BattlePositionMm Position { get; }

        public NavNode(string id, BattlePositionMm position)
        {
            if (string.IsNullOrEmpty(id))
            {
                throw new ArgumentException("Nav node id is required.", nameof(id));
            }
            Id = id;
            Position = position;
        }
    }

    public sealed class NavSegment
    {
        public string FromNodeId { get; }
        public string ToNodeId { get; }

        public NavSegment(string fromNodeId, string toNodeId)
        {
            if (string.IsNullOrEmpty(fromNodeId))
            {
                throw new ArgumentException("From node id is required.", nameof(fromNodeId));
            }
            if (string.IsNullOrEmpty(toNodeId))
            {
                throw new ArgumentException("To node id is required.", nameof(toNodeId));
            }
            if (string.Equals(fromNodeId, toNodeId, StringComparison.Ordinal))
            {
                throw new ArgumentException("A nav segment requires distinct endpoints.");
            }
            FromNodeId = fromNodeId;
            ToNodeId = toNodeId;
        }
    }

    public sealed class NavPath
    {
        readonly ReadOnlyCollection<NavNode> nodes;
        readonly ReadOnlyCollection<NavSegment> segments;
        readonly Dictionary<string, NavNode> byId;

        public NavPath(IEnumerable<NavNode> nodes, IEnumerable<NavSegment> segments)
        {
            this.nodes = new ReadOnlyCollection<NavNode>(new List<NavNode>(nodes ?? Array.Empty<NavNode>()));
            this.segments = new ReadOnlyCollection<NavSegment>(new List<NavSegment>(segments ?? Array.Empty<NavSegment>()));
            byId = new Dictionary<string, NavNode>(StringComparer.Ordinal);
            Validate();
        }

        public IReadOnlyList<NavNode> Nodes => nodes;
        public IReadOnlyList<NavSegment> Segments => segments;

        public void Validate()
        {
            if (nodes.Count == 0)
            {
                throw new ArgumentException("A nav path requires at least one node.");
            }
            byId.Clear();
            for (var i = 0; i < nodes.Count; i++)
            {
                var node = nodes[i];
                if (node == null || !byId.TryAdd(node.Id, node))
                {
                    throw new ArgumentException("Nav nodes must be non-null and uniquely identified.");
                }
            }
            for (var i = 0; i < segments.Count; i++)
            {
                var segment = segments[i];
                if (segment == null || !byId.ContainsKey(segment.FromNodeId) || !byId.ContainsKey(segment.ToNodeId))
                {
                    throw new ArgumentException("Nav segment endpoints must reference authored nodes.");
                }
            }
        }

        public bool Contains(BattlePositionMm position)
        {
            for (var i = 0; i < nodes.Count; i++)
                if (nodes[i].Position.Equals(position))
                {
                    return true;
                }
            return false;
        }

        public bool TryGetNode(string id, out NavNode node)
        {
            return byId.TryGetValue(id ?? string.Empty, out node);
        }
    }

    public enum BattleUnitStatus
    {
        Active,
        Hit,
        Down,
        Routing,
        Dead
    }

    public enum BattleOutcomeKind
    {
        Ongoing,
        PlayerVictory,
        EnemyVictory,
        PlayerRetreat,
        EnemySurrender,
        PlayerRout,
        Draw
    }

    public sealed class RosterUnit
    {
        public UnitId Id;
        public SoldierId SoldierId;
        public SquadId SquadId;
        public int Side;
        public string Role;
        public string VisualKindId;
        public int Hp;
        public int MaxHp;
        public int Power;
        public float Morale;
        public int RangeMinMm;
        public int RangeMaxMm;
        public int MoveMillimetersPerSecond;
        public double AttackCooldownSeconds;
        public int RadiusMm;
        public BattlePositionMm InitialPosition;
        public BattleFacing InitialFacing;
        public BattleUnitStatus? InitialStatus;
    }

    public sealed class FormationSlot
    {
        public UnitId Unit;
        public BattlePositionMm Position;
        public BattleFacing Facing;
    }

    public sealed class TelegraphPlan
    {
        public BattlePositionMm Position;
        public double ArrivalSeconds;
        public int Count;
    }

    public sealed class BattleDefinition
    {
        public int MoraleBase { get; }
        public int MoraleRecoverCap { get; }
        public int MoraleRecoveryPerSecond { get; }
        public int MoraleLossPerDeath { get; }
        public int MoraleLossCommanderBelowHalf { get; }
        public int SurrenderMoraleMax { get; }
        public int SurrenderCommanderHpPercentMax { get; }
        public int MoraleLock { get; }
        public double MaximumDurationSeconds { get; }
        public double DecisionIntervalSeconds { get; }

        public BattleDefinition(int moraleBase, int moraleRecoverCap, int moraleRecoveryPerSecond,
            int moraleLossPerDeath, int moraleLossCommanderBelowHalf, int surrenderMoraleMax,
            int surrenderCommanderHpPercentMax, int moraleLock, double maximumDurationSeconds,
            double decisionIntervalSeconds)
        {
            if (moraleBase < 0 || moraleRecoverCap < 0 || moraleRecoveryPerSecond < 0
                || moraleLossPerDeath < 0 || moraleLossCommanderBelowHalf < 0 || surrenderMoraleMax < 0
                || surrenderCommanderHpPercentMax < 0 || surrenderCommanderHpPercentMax > 100 || moraleLock < 0
                || maximumDurationSeconds <= 0 || decisionIntervalSeconds <= 0)
                throw new ArgumentOutOfRangeException(nameof(moraleBase), "Battle definition values are invalid.");
            MoraleBase = moraleBase;
            MoraleRecoverCap = moraleRecoverCap;
            MoraleRecoveryPerSecond = moraleRecoveryPerSecond;
            MoraleLossPerDeath = moraleLossPerDeath;
            MoraleLossCommanderBelowHalf = moraleLossCommanderBelowHalf;
            SurrenderMoraleMax = surrenderMoraleMax;
            SurrenderCommanderHpPercentMax = surrenderCommanderHpPercentMax;
            MoraleLock = moraleLock;
            MaximumDurationSeconds = maximumDurationSeconds;
            DecisionIntervalSeconds = decisionIntervalSeconds;
        }
    }

    public sealed class HeroDefinition
    {
        public HeroId Id;
        public int Hp;
        public int MaxHp;
        public BattlePositionMm Position;
        public BattleFacing Facing;
    }

    public sealed class BattleSetup
    {
        public BattleContext Context;
        public BattleDefinition Definition;
        public RosterUnit[] PlayerUnits;
        public RosterUnit[] EnemyUnits;
        public FormationSlot[] PlayerFormation;
        public FormationSlot[] EnemyFormation;
        public UnitId PlayerCommanderId;
        public UnitId EnemyCommanderId;
        public TelegraphPlan[] Telegraphs;
        public NavPath Navigation;
        public HeroId PlayerHeroId;
        public HeroId EnemyHeroId;
        public HeroDefinition PlayerHero;
        public HeroDefinition EnemyHero;
        public SquadId PlayerSquadId;
        public BattlePositionMm[] PlayerRetreatAnchors;
        public BattlePositionMm[] EnemyRetreatAnchors;
        public BattlePositionMm EnemyObjectivePosition;
    }

    public enum BattleTickCommandKind
    {
        Deploy,
        OrderRetreat,
        DemandSurrender,
        SetFacing,
        Move,
        Attack
    }

    public enum BattleOrderKind
    {
        None,
        Move,
        Attack
    }

    public sealed class BattleTickCommand
    {
        public CommandId Id;
        public int Seq;
        public double AtSeconds;
        public BattleTickCommandKind Kind;
        public FormationSlot[] Formation;
        public UnitId ActorUnitId;
        public UnitId TargetUnitId;
        public BattlePositionMm Destination;
        public NavPath Path;
        public BattleFacing Facing;

        public BattleTickCommand Clone()
        {
            return new BattleTickCommand
            {
                Id = Id,
                Seq = Seq,
                AtSeconds = AtSeconds,
                Kind = Kind,
                Formation = Formation == null ? null : Array.ConvertAll(Formation, x => new FormationSlot { Unit = x.Unit, Position = x.Position, Facing = x.Facing }),
                ActorUnitId = ActorUnitId,
                TargetUnitId = TargetUnitId,
                Destination = Destination,
                Path = Path,
                Facing = Facing,
            };
        }
    }

    public enum BattleRejectReason
    {
        TimestampMismatch,
        BattleStarted,
        NotDeployed,
        CommandsLocked,
        SurrenderConditionsUnmet,
        BattleEnded,
        UnknownActor,
        MalformedCommand,
        RetreatUnavailable,
        InvalidTarget,
        DestinationBlocked,
        DestinationOffNav,
        CommandConflict
    }

    public sealed class BattleRejection
    {
        public BattleRejectReason Reason;
        public string Detail;
    }

    public static class BattleRules
    {
    }

    public sealed class BattleSnapshot
    {
        public string RulesVersion;
        public double ElapsedSeconds;
        public BattleOutcomeKind Outcome;
        public SideSnapshot[] Sides;
        public UnitSnapshot[] Units;
        public TelegraphView[] Telegraphs;

        public sealed class SideSnapshot
        {
            public int Morale;
            public int CommanderHpPercent;
            public bool RetreatCovered;
            public bool CommandsLocked;
        }
        public sealed class UnitSnapshot
        {
            public UnitId Id;
            public int Side;
            public BattlePositionMm Position;
            public BattleFacing Facing;
            public int Hp;
            public int SurvivorCount;
            public BattleUnitStatus Status;
            public BattleOrderKind OrderKind;
            public BattlePositionMm OrderDestination;
            public UnitId OrderTargetUnitId;
            public double AttackCooldownSecondsRemaining;
        }
        public sealed class TelegraphView
        {
            public BattlePositionMm Position;
            public double ArrivalSeconds;
            public int Count;
        }
    }

    public sealed class BattleResult
    {
        public BattleOutcomeKind Outcome;
        public double FinalElapsedSeconds;
        public string ResultHash;
        public string BattleId;
        public UnitHpSnapshot UnitHp;

        public EncounterResult ToEncounterResult()
        {
            var hash = ResultHash ?? string.Empty;
            return new EncounterResult
            {
                ResultId = new ResultId("result-" + (hash.Length >= 16 ? hash.Substring(0, 16) : hash)),
                BattleId = new BattleId(BattleId),
                Outcome = Outcome == BattleOutcomeKind.PlayerVictory ? SettlementOutcomeKind.PlayerVictory
                    : Outcome == BattleOutcomeKind.EnemyVictory ? SettlementOutcomeKind.EnemyVictory
                    : Outcome == BattleOutcomeKind.Draw ? SettlementOutcomeKind.Draw
                    : Outcome == BattleOutcomeKind.PlayerRetreat ? SettlementOutcomeKind.PlayerRetreat
                    : Outcome == BattleOutcomeKind.EnemySurrender ? SettlementOutcomeKind.EnemySurrender
                    : Outcome == BattleOutcomeKind.PlayerRout ? SettlementOutcomeKind.PlayerRout
                    : SettlementOutcomeKind.None,
                ResultHash = hash,
                UnitHp = UnitHp
            };
        }
    }
}
