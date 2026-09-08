using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
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
        public UnitId PlayerCommanderId;
        public UnitId EnemyCommanderId;
        public int[] PreviousHp;
        public string[] PreviousStates;
        public bool[] CommanderBelowHalf;
        public CardState[] Cards;
        public string[] StrongholdCardIds;
        public BattleContext Context;


        public BattleSimState Clone()
        {
            var c = new BattleSimState { Tick=Tick, Deployed=Deployed, Outcome=Outcome, Rng=Rng == null ? null : Rng.Clone(), Arena=Arena == null ? null : Arena.Clone() };
            c.Units = Units == null ? null : Array.ConvertAll(Units, x => x.Clone());
            c.Sides = Sides == null ? null : Array.ConvertAll(Sides, x => x.Clone());
            c.Telegraphs = Telegraphs == null ? null : Array.ConvertAll(Telegraphs, x => x.Clone());
            c.Pending = new List<BattleTickCommand>(Pending ?? new List<BattleTickCommand>());
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
            var s = Tick + ";" + (int)Outcome + ";" + Deployed;
            if (Units != null) for (var i=0; i<Units.Length; i++) { var u=Units[i]; s += ";" + u.Id + ":" + u.Cell + ":" + u.Hp + ":" + u.State + ":" + u.CooldownTicksLeft; }
            if (Sides != null) for (var i=0; i<Sides.Length; i++) { var x=Sides[i]; s += ";m" + x.Morale + ":" + x.CommandsLocked; }
            if (Cards != null) for (var i=0; i<Cards.Length; i++) { var card=Cards[i]; s += ";c" + card.Id + ":" + card.RechargeTicksLeft + ":" + card.ActiveTicksLeft; }
            if (StrongholdCardIds != null) for (var i=0; i<StrongholdCardIds.Length; i++) s += ";sh" + StrongholdCardIds[i];
            return CoreApi.StableHashHex(s);
        }
    }
    public sealed class CardState
    {
        public string Id; public int RechargeTicksLeft; public int ActiveTicksLeft;
        public CardState Clone() { return (CardState)MemberwiseClone(); }
    }
    public sealed class UnitState
    {
        public UnitId Id; public int Side; public GridCoord Cell; public CardinalDirection Facing;
        public int Hp; public int MaxHp; public int Power; public int RangeMin; public int RangeMax;
        public int MoveTicksPerCell; public int MoveTicksLeft; public int AttackCooldownTicks; public int CooldownTicksLeft; public string State = "Active";
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
