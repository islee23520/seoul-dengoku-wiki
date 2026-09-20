using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    internal static class AggregateSurvivorRules
    {
        public static int FromHp(int hp, int maxHp)
        {
            if (hp <= 0 || maxHp <= 0) return 0;
            return System.Math.Min(4, (int)((4L * hp + maxHp - 1L) / maxHp));
        }
    }

    public sealed class BattleSimState
    {
        public int Tick;
        public bool Deployed;
        public UnitState[] Units;
        public SideState[] Sides;
        public TelegraphState[] Telegraphs;
        public List<BattleTickCommand> Pending = new List<BattleTickCommand>();
        public Janseon.Core.Battle.Contracts.BattleOutcomeKind Outcome;
        public PurposeRng Rng;
        public ArenaState Arena;
        public Heightmap Terrain;
        public UnitId PlayerCommanderId;
        public UnitId EnemyCommanderId;
        public int[] PreviousHp;
        public string[] PreviousStates;
        public bool[] CommanderBelowHalf;
        public CardState[] Cards;
        public string[] StrongholdCardIds;
        public BattleContext Context;
        public float ElapsedSeconds;


        public BattleSimState Clone()
        {
            var c = new BattleSimState { Tick=Tick, Deployed=Deployed, Outcome=Outcome, ElapsedSeconds=ElapsedSeconds, Rng=Rng == null ? null : Rng.Clone(), Arena=Arena == null ? null : Arena.Clone(), Terrain=Terrain == null ? null : Terrain.Snapshot() };
            c.Units = Units == null ? null : Array.ConvertAll(Units, x => x.Clone());
            c.Sides = Sides == null ? null : Array.ConvertAll(Sides, x => x.Clone());
            c.Telegraphs = Telegraphs == null ? null : Array.ConvertAll(Telegraphs, x => x.Clone());
            c.Pending = Pending == null ? new List<BattleTickCommand>() : new List<BattleTickCommand>(Pending.ConvertAll(x => x.Clone()));
            c.PlayerCommanderId = PlayerCommanderId; c.EnemyCommanderId = EnemyCommanderId;
            c.PreviousHp = PreviousHp == null ? null : (int[])PreviousHp.Clone();
            c.PreviousStates = PreviousStates == null ? null : (string[])PreviousStates.Clone();
            c.CommanderBelowHalf = CommanderBelowHalf == null ? null : (bool[])CommanderBelowHalf.Clone();
            c.Cards = Cards == null ? null : System.Array.ConvertAll(Cards, x => x.Clone());
            c.StrongholdCardIds = StrongholdCardIds == null ? null : (string[])StrongholdCardIds.Clone();
            c.Context = Context;
            return c;
        }
        public string Fingerprint()
        {
            var s = "rules=" + (Context == null ? string.Empty : Context.RulesVersion) + ";" + Tick + ";" + (int)Outcome + ";" + Deployed;
            if (Units != null) for (var i=0; i<Units.Length; i++) { var u=Units[i]; s += ";" + u.Id + ":" + u.Cell + ":" + (int)u.Facing + ":" + u.Hp + ":" + u.SurvivorCount + ":" + u.State + ":" + u.MoveTicksLeft + ":" + u.CooldownTicksLeft + ":" + (int)u.OrderKind + ":" + u.OrderDestination + ":" + u.OrderTargetUnitId; }
            if (Terrain != null) s += ";terrain=" + Terrain.Fingerprint();
            if (Sides != null) for (var i=0; i<Sides.Length; i++) { var x=Sides[i]; s += ";m" + x.Morale + ":" + x.CommandsLocked; }
            if (Cards != null) for (var i=0; i<Cards.Length; i++) { var card=Cards[i]; s += ";c" + card.OwnerUnitId + ":" + card.Id + ":" + card.RechargeTicksLeft + ":" + card.ActiveTicksLeft; }
            if (StrongholdCardIds != null) for (var i=0; i<StrongholdCardIds.Length; i++) s += ";sh" + StrongholdCardIds[i];
            if (Pending != null) for (var i=0; i<Pending.Count; i++) { var command=Pending[i]; s += ";p" + command.At + ":" + command.Seq + ":" + (int)command.Kind + ":" + command.CardId + ":" + command.ActorUnitId + ":" + command.OwnerUnitId + ":" + command.TargetUnitId + ":" + command.Target + ":" + (int)command.Facing; }
            return CoreApi.StableHashHex(s);
        }
    }
    public sealed class CardState
    {
        public UnitId OwnerUnitId; public string Id; public int RechargeTicksLeft; public int ActiveTicksLeft;
        public CardState Clone() { return (CardState)MemberwiseClone(); }
    }
    public sealed class UnitState
    {
        public UnitId Id; public int Side; public GridCoord Cell; public CardinalDirection Facing;
        public int Hp; public int MaxHp; public int SurvivorCount; public int Power; public int RangeMin; public int RangeMax;
        public int MoveTicksPerCell; public int MoveTicksLeft; public int AttackCooldownTicks; public int CooldownTicksLeft; public string State = "Active";
        public BattleOrderKind OrderKind; public GridCoord OrderDestination; public UnitId OrderTargetUnitId;
        public UnitState Clone() { return (UnitState)MemberwiseClone(); }
    }
    public sealed class SideState
    {
        public int Morale; public int CommanderHpPercent; public bool RetreatCovered; public bool CommandsLocked;
        public SideState Clone() { return (SideState)MemberwiseClone(); }
    }
    public sealed class TelegraphState
    {
        public GridCoord Cell; public int ArrivalTick; public int Count; public bool Arrived;
        public TelegraphState Clone() { return (TelegraphState)MemberwiseClone(); }
    }
    public sealed class ArenaState
    {
        public int Width = 12; public int Height = 8; public GridCoord[] PlayerDeployZone; public GridCoord[] EnemyDeployZone; public GridCoord[] EnemyRetreatEdge;
        public ArenaState Clone() { return new ArenaState { Width=Width, Height=Height, PlayerDeployZone=PlayerDeployZone == null ? null : (GridCoord[])PlayerDeployZone.Clone(), EnemyDeployZone=EnemyDeployZone == null ? null : (GridCoord[])EnemyDeployZone.Clone(), EnemyRetreatEdge=EnemyRetreatEdge == null ? null : (GridCoord[])EnemyRetreatEdge.Clone() }; }
        public bool InBounds(GridCoord c) { return c.X >= 0 && c.X < Width && c.Y >= 0 && c.Y < Height; }
    }
}
