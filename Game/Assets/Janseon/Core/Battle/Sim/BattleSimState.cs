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

        public BattleSimState Clone()
        {
            var c = new BattleSimState { Tick=Tick, Deployed=Deployed, Outcome=Outcome, Rng=Rng == null ? null : Rng.Clone(), Arena=Arena == null ? null : Arena.Clone() };
            c.Units = Units == null ? null : Array.ConvertAll(Units, x => x.Clone());
            c.Sides = Sides == null ? null : Array.ConvertAll(Sides, x => x.Clone());
            c.Telegraphs = Telegraphs == null ? null : Array.ConvertAll(Telegraphs, x => x.Clone());
            c.Pending = new List<BattleTickCommand>(Pending ?? new List<BattleTickCommand>());
            return c;
        }
        public string Fingerprint()
        {
            var s = Tick + ";" + (int)Outcome + ";" + Deployed;
            if (Units != null) for (var i=0; i<Units.Length; i++) { var u=Units[i]; s += ";" + u.Id + ":" + u.Cell + ":" + u.Hp + ":" + u.State + ":" + u.CooldownTicksLeft; }
            if (Sides != null) for (var i=0; i<Sides.Length; i++) { var x=Sides[i]; s += ";m" + x.Morale + ":" + x.CommandsLocked; }
            return CoreApi.StableHashHex(s);
        }
    }
    public sealed class UnitState
    {
        public UnitId Id; public int Side; public GridCoord Cell; public CardinalDirection Facing;
        public int Hp; public int MaxHp; public int Power; public int RangeMin; public int RangeMax;
        public int MoveTicksPerCell; public int AttackCooldownTicks; public int CooldownTicksLeft; public string State = "Active";
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
