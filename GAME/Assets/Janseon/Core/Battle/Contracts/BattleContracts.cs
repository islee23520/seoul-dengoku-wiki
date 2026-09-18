using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core;

namespace Janseon.Core.Battle.Contracts
{
    public enum BattleOutcomeKind { Ongoing, PlayerVictory, EnemyVictory, PlayerRetreat, EnemySurrender, PlayerRout, Draw }

    public sealed class RosterUnit
    {
        public UnitId Id; public int Side; public string Role; public int Hp; public int MaxHp; public int Power;
        public int RangeMin; public int RangeMax; public int MoveTicksPerCell; public int AttackCooldownTicks;
    }
    public sealed class FormationSlot { public UnitId Unit; public int Row; public int Column; public CardinalDirection Facing; }
    public sealed class TelegraphPlan { public GridCoord Cell; public int ArrivalTick; public int Count; }

    public sealed class BattleSetup
    {
        public BattleContext Context; public RosterUnit[] PlayerUnits; public RosterUnit[] EnemyUnits;
        public FormationSlot[] PlayerFormation; public FormationSlot[] EnemyFormation; public UnitId EnemyCommanderId;
        public TelegraphPlan[] Telegraphs; public Heightmap Terrain;
        public static BattleSetup FromContext(BattleContext ctx)
        {
            return FromContext(ctx, null);
        }
        public static BattleSetup FromContext(BattleContext ctx, Heightmap terrain)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            ctx.ValidateIntegrity();
            var roles = new[] { "근위", "돌격", "궁수" };
            var hp = new[] { 30, 20, 14 }; var power = new[] { 4, 6, 3 }; var range = new[] { 1, 1, 3 };
            var player = new RosterUnit[6]; var enemy = new RosterUnit[6];
            for (var side = 0; side < 2; side++) for (var i = 0; i < 6; i++)
            {
                var r = i / 2;
                var id = (side == 0 ? RealtimeBattleApi.PlayerUnitPrefix : RealtimeBattleApi.EnemyUnitPrefix)
                    + i.ToString(CultureInfo.InvariantCulture);
                var maxHp = side == 0 ? RealtimeBattleApi.PersistentMaxHp : hp[r];
                var startHp = maxHp;
                if (side == 0 && ctx.StartHp != null && ctx.StartHp.TryGet(id, out var storedHp))
                {
                    if (storedHp < 0 || storedHp > maxHp)
                        throw new ArgumentException("Corrupt start HP for unit '" + id + "'.", nameof(ctx));
                    startHp = storedHp;
                }
                var u = new RosterUnit { Id = new UnitId(id), Side = side, Role = roles[r], Hp = startHp, MaxHp = maxHp, Power = power[r], RangeMin = 1, RangeMax = range[r], MoveTicksPerCell = BattleRules.MoveTicksPerCell, AttackCooldownTicks = BattleRules.AttackCooldownTicks };
                if (side == 0) player[i] = u; else enemy[i] = u;
            }
            var telegraphs = new TelegraphPlan[12];
            for (var i = 0; i < telegraphs.Length; i++)
            {
                var side = i < 6 ? 1 : 0;
                var slot = i % 6;
                telegraphs[i] = new TelegraphPlan { Cell = new GridCoord(side == 1 ? 9 : 2, 1 + slot), ArrivalTick = 30 + i, Count = 1 };
            }
            return new BattleSetup { Context = ctx, PlayerUnits = player, EnemyUnits = enemy, PlayerFormation = Formation(player), EnemyFormation = Formation(enemy), EnemyCommanderId = enemy[0].Id, Telegraphs = telegraphs, Terrain = terrain != null ? terrain.Snapshot() : null };
        }
        static FormationSlot[] Formation(RosterUnit[] units) { var a = new FormationSlot[units.Length]; for (var i = 0; i < a.Length; i++) a[i] = new FormationSlot { Unit = units[i].Id, Row = i / 2, Column = i % 2 - 1, Facing = CardinalDirection.East }; return a; }
    }

    public enum BattleTickCommandKind { Deploy, PlayCard, OrderRetreat, DemandSurrender, SetFacing, Move, Attack }
    public enum BattleOrderKind { None, Move, Attack }
    public sealed class BattleTickCommand
    {
        public CommandId Id; public int Seq; public Tick At; public BattleTickCommandKind Kind;
        public FormationSlot[] Formation; public string CardId; public UnitId ActorUnitId; public UnitId OwnerUnitId; public UnitId TargetUnitId;
        public GridCoord Target; public CardinalDirection Facing; public string[] StrongholdCardIds; public string[] StrongholdCards;
        public BattleTickCommand Clone()
        {
            return new BattleTickCommand
            {
                Id=Id, Seq=Seq, At=At, Kind=Kind,
                Formation=Formation == null ? null : Array.ConvertAll(Formation, x => new FormationSlot { Unit=x.Unit, Row=x.Row, Column=x.Column, Facing=x.Facing }),
                CardId=CardId, ActorUnitId=ActorUnitId, OwnerUnitId=OwnerUnitId, TargetUnitId=TargetUnitId, Target=Target, Facing=Facing,
                StrongholdCardIds=StrongholdCardIds == null ? null : (string[])StrongholdCardIds.Clone(),
                StrongholdCards=StrongholdCards == null ? null : (string[])StrongholdCards.Clone(),
            };
        }
    }
    public enum BattleRejectReason { TickMismatch, BattleStarted, NotDeployed, CardUnknown, CardRecharging, CardOutOfRadius, CommandsLocked, SurrenderConditionsUnmet, BattleEnded, UnknownActor, MalformedCommand, RetreatUnavailable, CardOwnerRequired, CardInvalidOwner, CardInvalidTarget, CardDestinationBlocked, CardDestinationOutOfBounds }
    public enum CardKind { Character, Stronghold }
    public sealed class CardDefinition
    {
        public string Id; public CardKind Kind; public int RechargeTicks; public int Effect; public string EffectKey;
    }
    public sealed class BattleRejection { public BattleRejectReason Reason; public string Detail; }
    public sealed class BattleRules { public const int TicksPerSecond=30, MoveTicksPerCell=10, AttackCooldownTicks=30, MoraleBase=60, MoraleWarn=40, MoraleRecoverCap=80, MoraleRecoveryPerSecond=5, MoraleLossPerDeath=5, MoraleLossCommanderBelowHalf=10, SurrenderMoraleMax=20, SurrenderCommanderHpPercentMax=50, StrongholdCardSlots=2, CardEffectTicks=150, MaxTicks=9000, CommandRadius=3, MoraleLock=0, FormationRows=3, FormationColumns=3, CardRechargeMinTicks=300, CardRechargeMaxTicks=900; public const string LegacyRulesVersion="poc-rtfc-v1", RulesVersion="rtfc-owner-cards-v2"; }
    public static class BattleRoleRules { public static readonly string[] Roles={"근위","돌격","궁수"}; public static readonly int[] MaxHp={30,20,14}; public static readonly int[] Power={4,6,3}; public static readonly int[] RangeMax={1,1,3}; }

    public static class RealtimeBattleApi
    {
        public const string PlayerUnitPrefix = "ally-";
        public const string EnemyUnitPrefix = "foe-";
        public const string PersistentAllyId = "ally-0";
        public const int PersistentMaxHp = 10;
    }

    public sealed class BattleSnapshot { public string RulesVersion; public int Tick; public BattleOutcomeKind Outcome; public SideSnapshot[] Sides; public UnitSnapshot[] Units; public TelegraphView[] Telegraphs; public CardView[] Cards; public sealed class SideSnapshot { public int Morale; public int CommanderHpPercent; public bool RetreatCovered; public bool CommandsLocked; } public sealed class UnitSnapshot { public UnitId Id; public int Side; public GridCoord Cell; public CardinalDirection Facing; public int Hp; public int SurvivorCount; public string State; public BattleOrderKind OrderKind; public GridCoord OrderDestination; public UnitId OrderTargetUnitId; public int MoveTicksLeft; public int AttackCooldownTicksLeft; } public sealed class TelegraphView { public GridCoord Cell; public int ArrivalTick; public int Count; } public sealed class CardView { public UnitId OwnerUnitId; public string Id; public int RechargeTicksLeft; public int ActiveTicksLeft; } }
    public sealed class BattleResult
    {
        public BattleOutcomeKind Outcome;
        public int FinalTick;
        public string ResultHash;
        public string BattleId;
        public UnitHpSnapshot UnitHp;

        /// <summary>Maps every terminal realtime outcome without collapsing retreat/rout/surrender/draw into victory.</summary>
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
