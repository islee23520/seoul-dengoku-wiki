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
        public TelegraphPlan[] Telegraphs;
        public static BattleSetup FromContext(BattleContext ctx)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            var roles = new[] { "근위", "돌격", "궁수" };
            var hp = new[] { 30, 20, 14 }; var power = new[] { 4, 6, 3 }; var range = new[] { 1, 1, 3 };
            var player = new RosterUnit[6]; var enemy = new RosterUnit[6];
            for (var side = 0; side < 2; side++) for (var i = 0; i < 6; i++)
            {
                var r = i / 2; var u = new RosterUnit { Id = new UnitId((side == 0 ? "p-" : "e-") + i.ToString(CultureInfo.InvariantCulture)), Side = side, Role = roles[r], Hp = hp[r], MaxHp = hp[r], Power = power[r], RangeMin = 1, RangeMax = range[r], MoveTicksPerCell = BattleRules.MoveTicksPerCell, AttackCooldownTicks = BattleRules.AttackCooldownTicks };
                if (side == 0) player[i] = u; else enemy[i] = u;
            }
            var telegraphs = new TelegraphPlan[12];
            for (var i = 0; i < telegraphs.Length; i++) telegraphs[i] = new TelegraphPlan { Cell = new GridCoord(5 + i % 2, 1 + i / 2), ArrivalTick = 30 + i, Count = 1 };
            return new BattleSetup { Context = ctx, PlayerUnits = player, EnemyUnits = enemy, PlayerFormation = Formation(player), EnemyFormation = Formation(enemy), EnemyCommanderId = enemy[0].Id, Telegraphs = telegraphs };
        }
        static FormationSlot[] Formation(RosterUnit[] units) { var a = new FormationSlot[units.Length]; for (var i = 0; i < a.Length; i++) a[i] = new FormationSlot { Unit = units[i].Id, Row = i / 2, Column = i % 2 - 1, Facing = CardinalDirection.East }; return a; }
    }

    public enum BattleTickCommandKind { Deploy, PlayCard, OrderRetreat, DemandSurrender }
    public sealed class BattleTickCommand { public CommandId Id; public int Seq; public Tick At; public BattleTickCommandKind Kind; public FormationSlot[] Formation; public string CardId; public GridCoord Target; }
    public enum BattleRejectReason { TickMismatch, BattleStarted, NotDeployed, CardUnknown, CardRecharging, CardOutOfRadius, CommandsLocked, SurrenderConditionsUnmet, BattleEnded, UnknownActor, MalformedCommand }
    public sealed class BattleRejection { public BattleRejectReason Reason; public string Detail; }
    public sealed class BattleRules { public const int TicksPerSecond=30, MoveTicksPerCell=10, AttackCooldownTicks=30, MoraleBase=60, MoraleWarn=40, MoraleRecoverCap=80, MoraleRecoveryPerSecond=5, MoraleLossPerDeath=5, MoraleLossCommanderBelowHalf=10, SurrenderMoraleMax=20, SurrenderCommanderHpPercentMax=50, StrongholdCardSlots=2, MaxTicks=9000, CommandRadius=3; public const string RulesVersion="poc-rtfc-v1"; }

    public sealed class BattleSnapshot { public int Tick; public BattleOutcomeKind Outcome; public SideSnapshot[] Sides; public UnitSnapshot[] Units; public TelegraphView[] Telegraphs; public CardView[] Cards; public sealed class SideSnapshot { public int Morale; public int CommanderHpPercent; public bool RetreatCovered; public bool CommandsLocked; } public sealed class UnitSnapshot { public UnitId Id; public int Side; public GridCoord Cell; public CardinalDirection Facing; public int Hp; public string State; } public sealed class TelegraphView { public GridCoord Cell; public int ArrivalTick; public int Count; } public sealed class CardView { public string Id; public int RechargeTicksLeft; } }
    public sealed class BattleResult { public BattleOutcomeKind Outcome; public int FinalTick; public string ResultHash; public EncounterResult ToEncounterResult() { return new EncounterResult { ResultHash = ResultHash }; } }
}
