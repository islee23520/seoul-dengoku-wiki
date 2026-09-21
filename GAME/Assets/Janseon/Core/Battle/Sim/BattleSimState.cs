using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public struct IntPointMm : IEquatable<IntPointMm>
    {
        public int X;
        public int Y;

        public IntPointMm(int x, int y)
        {
            X = x;
            Y = y;
        }

        public bool Equals(IntPointMm other) => X == other.X && Y == other.Y;

        public override bool Equals(object obj) => obj is IntPointMm && Equals((IntPointMm)obj);

        public override int GetHashCode() => (X * 397) ^ Y;

        public override string ToString() => X + "," + Y;
    }

    internal static class AggregateSurvivorRules
    {
        public static int FromHp(int hp, int maxHp)
        {
            if (hp <= 0 || maxHp <= 0)
            {
                return 0;
            }

            return Math.Min(4, (int)((4L * hp + maxHp - 1L) / maxHp));
        }
    }

    public sealed class BattleSimState
    {
        public bool Deployed;
        public UnitState[] Units;
        public HeroState[] Heroes = new HeroState[0];
        public SquadState[] Squads = new SquadState[0];
        public SideState[] Sides;
        public TelegraphState[] Telegraphs;
        public List<BattleTickCommand> Pending = new List<BattleTickCommand>();
        public BattleOutcomeKind Outcome;
        public PurposeRng Rng;
        public BattleDefinition Definition;
        public BattleContext Context;
        public ArenaState Arena;
        public Heightmap Terrain;
        public UnitId PlayerCommanderId;
        public UnitId EnemyCommanderId;
        public int[] PreviousHp;
        public BattleUnitStatus[] PreviousStatuses;
        public bool[] CommanderBelowHalf;
        public double ElapsedSeconds;
        public double NextEnemyDecisionSeconds;
        public BattleFrame Frame { get; private set; }
        public string SpatialHash;
        public Dictionary<IntPointMm, List<UnitId>> SpatialBuckets = new Dictionary<IntPointMm, List<UnitId>>();

        public UnitState[] Soldiers => Units ?? new UnitState[0];

        public void PublishFrame()
        {
            var units = Units == null ? new UnitState[0] : Array.ConvertAll(Units, unit => unit.Clone());
            Frame = new BattleFrame(ElapsedSeconds, units);
        }

        public BattleSimState Clone()
        {
            var clone = new BattleSimState
            {
                Deployed = Deployed,
                Outcome = Outcome,
                Rng = Rng == null ? null : Rng.Clone(),
                Definition = Definition,
                Context = Context,
                Arena = Arena == null ? null : Arena.Clone(),
                Terrain = Terrain == null ? null : Terrain.Snapshot(),
                PlayerCommanderId = PlayerCommanderId,
                EnemyCommanderId = EnemyCommanderId,
                ElapsedSeconds = ElapsedSeconds,
                NextEnemyDecisionSeconds = NextEnemyDecisionSeconds,
                SpatialHash = SpatialHash,
                SpatialBuckets = new Dictionary<IntPointMm, List<UnitId>>()
            };

            foreach (var pair in SpatialBuckets)
            {
                clone.SpatialBuckets[pair.Key] = new List<UnitId>(pair.Value);
            }

            clone.Units = Units == null ? null : Array.ConvertAll(Units, unit => unit.Clone());
            clone.Heroes = Heroes == null ? null : Array.ConvertAll(Heroes, hero => hero.Clone());
            clone.Squads = Squads == null ? null : Array.ConvertAll(Squads, squad => squad.Clone());
            clone.Sides = Sides == null ? null : Array.ConvertAll(Sides, side => side.Clone());
            clone.Telegraphs = Telegraphs == null ? null : Array.ConvertAll(Telegraphs, telegraph => telegraph.Clone());
            clone.Pending = Pending == null
                ? new List<BattleTickCommand>()
                : new List<BattleTickCommand>(Pending.ConvertAll(command => command.Clone()));
            clone.PreviousHp = PreviousHp == null ? null : (int[])PreviousHp.Clone();
            clone.PreviousStatuses = PreviousStatuses == null ? null : (BattleUnitStatus[])PreviousStatuses.Clone();
            clone.CommanderBelowHalf = CommanderBelowHalf == null ? null : (bool[])CommanderBelowHalf.Clone();
            clone.Frame = Frame == null ? null : Frame.Clone();

            return clone;
        }

        public string Fingerprint()
        {
            var value = "rules=" + (Context == null ? string.Empty : Context.RulesVersion)
                + ";elapsed=" + ElapsedSeconds.ToString("R", CultureInfo.InvariantCulture)
                + ";nextEnemyDecision=" + NextEnemyDecisionSeconds.ToString("R", CultureInfo.InvariantCulture)
                + ";outcome=" + (int)Outcome
                + ";deployed=" + Deployed;

            if (Heroes != null)
            {
                foreach (var hero in Heroes)
                {
                    value += ";hero=" + hero.Id + ":" + hero.Position + ":" + hero.Facing + ":" + hero.Hp
                        + ":" + (int)hero.OrderKind + ":" + hero.OrderDestination + ":" + hero.OrderTargetUnitId;
                }
            }

            if (Units != null)
            {
                foreach (var unit in Units)
                {
                    value += ";unit=" + unit.Id + ":" + unit.Position + ":" + unit.Facing + ":" + unit.Hp
                        + ":" + unit.SurvivorCount + ":" + (int)unit.Status
                        + ":" + unit.AttackCooldownSeconds.ToString("R", CultureInfo.InvariantCulture)
                        + ":" + unit.AttackCooldownSecondsRemaining.ToString("R", CultureInfo.InvariantCulture)
                        + ":" + (int)unit.OrderKind + ":" + unit.OrderDestination + ":" + unit.OrderTargetUnitId
                        + ":" + unit.ActivePathSegmentIndex + ":" + unit.ActivePathSegmentProgressMm.ToString("R", CultureInfo.InvariantCulture)
                        + ":" + unit.VisualKindId;
                }
            }

            if (Terrain != null)
            {
                value += ";terrain=" + Terrain.Fingerprint();
            }

            if (Arena != null)
            {
                value += ";enemyObjective=" + Arena.EnemyObjectivePosition;
            }

            if (Sides != null)
            {
                foreach (var side in Sides)
                {
                    value += ";side=" + side.Morale + ":" + side.CommanderHpPercent + ":" + side.RetreatCovered
                        + ":" + side.SurrenderConditionsMet + ":" + side.CommandsLocked;
                }
            }

            if (Pending != null)
            {
                foreach (var command in Pending)
                {
                    value += ";pending=" + command.AtSeconds.ToString("R", CultureInfo.InvariantCulture) + ":" + command.Seq + ":" + (int)command.Kind
                        + ":" + command.ActorUnitId + ":" + command.TargetUnitId
                        + ":" + command.Destination + ":" + command.Facing;
                }
            }

            return CoreApi.StableHashHex(value);
        }
    }

    public sealed class UnitState
    {
        public UnitId Id;
        public SoldierId SoldierId;
        public SquadId SquadId;
        public HeroId HeroId;
        public string VisualKindId;
        public int Side;
        public BattlePositionMm Position;
        public BattleFacing Facing;
        public BattlePositionMm OrderDestination;
        public UnitId OrderTargetUnitId;
        public BattleOrderKind OrderKind;
        public BattleUnitStatus Status;
        public int Hp;
        public int MaxHp;
        public int SurvivorCount;
        public int Power;
        public int RangeMinMm;
        public int RangeMaxMm;
        public int RadiusMm;
        public int MoveSpeedMillimetersPerSecond;
        public double AttackCooldownSeconds;
        public double AttackCooldownSecondsRemaining;
        public NavPath ActivePath;
        public int ActivePathSegmentIndex;
        public double ActivePathSegmentProgressMm;

        public UnitState Clone()
        {
            var clone = (UnitState)MemberwiseClone();
            clone.VisualKindId = VisualKindId;
            return clone;
        }
    }

    public sealed class BattleFrame
    {
        public readonly double ElapsedSeconds;
        public readonly UnitState[] Units;

        public BattleFrame(double elapsedSeconds, UnitState[] units)
        {
            ElapsedSeconds = elapsedSeconds;
            Units = units ?? new UnitState[0];
        }

        public BattleFrame Clone()
        {
            var units = Units == null ? new UnitState[0] : Array.ConvertAll(Units, unit => unit.Clone());
            return new BattleFrame(ElapsedSeconds, units);
        }
    }

    public sealed class HeroState
    {
        public HeroId Id;
        public int Hp;
        public BattlePositionMm Position;
        public BattleFacing Facing;
        public BattleOrderKind OrderKind;
        public BattlePositionMm OrderDestination;
        public UnitId OrderTargetUnitId;

        public HeroState Clone() => new HeroState
        {
            Id = Id,
            Hp = Hp,
            Position = Position,
            Facing = Facing,
            OrderKind = OrderKind,
            OrderDestination = OrderDestination,
            OrderTargetUnitId = OrderTargetUnitId
        };
    }

    public sealed class SquadState
    {
        public SquadId Id;
        public BattleOrderKind CurrentOrder;
        public FormationSlot[] Formation;

        public SquadState Clone() => new SquadState
        {
            Id = Id,
            CurrentOrder = CurrentOrder,
            Formation = Formation == null ? null : (FormationSlot[])Formation.Clone()
        };
    }

    public sealed class SideState
    {
        public int Morale;
        public int CommanderHpPercent;
        public bool RetreatCovered;
        public bool SurrenderConditionsMet;
        public bool CommandsLocked;

        public SideState Clone() => (SideState)MemberwiseClone();
    }

    public sealed class TelegraphState
    {
        public BattlePositionMm Position;
        public double ElapsedSeconds;
        public double DurationSeconds;
        public int Count;
        public bool Completed;

        public TelegraphState Clone() => (TelegraphState)MemberwiseClone();
    }

    public sealed class ArenaState
    {
        public NavPath Navigation;
        public BattlePositionMm[] PlayerDeploymentPositions;
        public BattlePositionMm[] EnemyDeploymentPositions;
        public BattlePositionMm[] PlayerRetreatAnchors;
        public BattlePositionMm[] EnemyRetreatAnchors;
        public BattlePositionMm EnemyObjectivePosition;

        public ArenaState Clone()
        {
            return new ArenaState
            {
                Navigation = Navigation,
                PlayerDeploymentPositions = PlayerDeploymentPositions == null ? null : (BattlePositionMm[])PlayerDeploymentPositions.Clone(),
                EnemyDeploymentPositions = EnemyDeploymentPositions == null ? null : (BattlePositionMm[])EnemyDeploymentPositions.Clone(),
                PlayerRetreatAnchors = PlayerRetreatAnchors == null ? null : (BattlePositionMm[])PlayerRetreatAnchors.Clone(),
                EnemyRetreatAnchors = EnemyRetreatAnchors == null ? null : (BattlePositionMm[])EnemyRetreatAnchors.Clone(),
                EnemyObjectivePosition = EnemyObjectivePosition
            };
        }
    }
}
