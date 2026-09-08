using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using ContractOutcome = Janseon.Core.Battle.Contracts.BattleOutcomeKind;
using ContractRejection = Janseon.Core.Battle.Contracts.BattleRejection;
using ContractRejectReason = Janseon.Core.Battle.Contracts.BattleRejectReason;

namespace Janseon.Core.Battle.Sim
{
    public static class BattleSim
    {
        public static BattleSimState Open(BattleSetup setup)
        {
            if (setup == null) throw new ArgumentNullException(nameof(setup));
            var seed = unchecked((int)uint.Parse(CoreApi.StableHashHex(setup.Context.ContextHash ?? string.Empty).Substring(0, 8), NumberStyles.HexNumber, CultureInfo.InvariantCulture));
            var s = new BattleSimState { Tick = 0, Outcome = ContractOutcome.Ongoing, Rng = new PurposeRng(seed), Arena = new ArenaState() };
            s.Sides = new[] { new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 }, new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 } };
            var roster = new List<RosterUnit>(); if (setup.PlayerUnits != null) roster.AddRange(setup.PlayerUnits); if (setup.EnemyUnits != null) roster.AddRange(setup.EnemyUnits);
            s.Units = new UnitState[roster.Count];
            for (var i = 0; i < roster.Count; i++) { var u = roster[i]; s.Units[i] = new UnitState { Id=u.Id, Side=u.Side, Hp=u.Hp, MaxHp=u.MaxHp, Power=u.Power, RangeMin=u.RangeMin, RangeMax=u.RangeMax, MoveTicksPerCell=u.MoveTicksPerCell, AttackCooldownTicks=u.AttackCooldownTicks, Cell=new GridCoord(u.Side == 0 ? 1 : 10, i % 6 + 1), Facing=u.Side == 0 ? CardinalDirection.East : CardinalDirection.West }; }
            var plans = setup.Telegraphs ?? new TelegraphPlan[0]; s.Telegraphs = new TelegraphState[plans.Length]; for (var i=0;i<plans.Length;i++) s.Telegraphs[i] = new TelegraphState { Cell=plans[i].Cell, ArrivalTick=plans[i].ArrivalTick, Count=plans[i].Count };
            return s;
        }
        public static object Submit(BattleSimState state, Ledger ledger, BattleTickCommand cmd)
        {
            if (state == null || ledger == null || cmd == null) return new ContractRejection { Reason=ContractRejectReason.MalformedCommand };
            if (cmd.At.Value != state.Tick) return new ContractRejection { Reason=ContractRejectReason.TickMismatch };
            if (state.Outcome != ContractOutcome.Ongoing) return new ContractRejection { Reason=ContractRejectReason.BattleEnded };
            if (!state.Deployed && cmd.Kind != BattleTickCommandKind.Deploy) return new ContractRejection { Reason=ContractRejectReason.NotDeployed };
            state.Pending.Add(cmd); state.Pending.Sort((a,b) => a.At.Value != b.At.Value ? a.At.Value.CompareTo(b.At.Value) : a.Seq.CompareTo(b.Seq));
            if (cmd.Kind == BattleTickCommandKind.Deploy) { state.Deployed=true; FormationResolver.Resolve(state, cmd.Formation); }
            ledger.Events.Add(new TypedEvent { Id=new EventId("bcmd-"+cmd.At.Value.ToString(CultureInfo.InvariantCulture)+"-"+cmd.Seq.ToString(CultureInfo.InvariantCulture)), At=cmd.At, CauseId=cmd.Id, SummaryHash=state.Fingerprint() }); return null;
        }
        public static void Step(BattleSimState state, Ledger ledger)
        {
            if (state == null || ledger == null || state.Outcome != ContractOutcome.Ongoing) return;
            state.Pending.Sort((a,b) => a.At.Value != b.At.Value ? a.At.Value.CompareTo(b.At.Value) : a.Seq.CompareTo(b.Seq));
            while (state.Pending.Count > 0 && state.Pending[0].At.Value == state.Tick) { var c=state.Pending[0]; state.Pending.RemoveAt(0); IntentPlanner.Resolve(state); }
            ReinforcementRules.Resolve(state); IntentPlanner.Resolve(state); CombatRules.Resolve(state); MoraleRules.Resolve(state); OutcomeRules.Resolve(state);
            ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++;
        }
        public static BattleSnapshot Snapshot(BattleSimState s) { var x=new BattleSnapshot { Tick=s.Tick, Outcome=s.Outcome, Sides=new BattleSnapshot.SideSnapshot[s.Sides.Length], Units=new BattleSnapshot.UnitSnapshot[s.Units.Length], Telegraphs=new BattleSnapshot.TelegraphView[s.Telegraphs.Length], Cards=new BattleSnapshot.CardView[0] }; for(var i=0;i<s.Telegraphs.Length;i++) x.Telegraphs[i]=new BattleSnapshot.TelegraphView {Cell=s.Telegraphs[i].Cell, ArrivalTick=s.Telegraphs[i].ArrivalTick, Count=s.Telegraphs[i].Count}; for(var i=0;i<s.Sides.Length;i++) x.Sides[i]=new BattleSnapshot.SideSnapshot {Morale=s.Sides[i].Morale,CommanderHpPercent=s.Sides[i].CommanderHpPercent,RetreatCovered=s.Sides[i].RetreatCovered,CommandsLocked=s.Sides[i].CommandsLocked}; for(var i=0;i<s.Units.Length;i++) x.Units[i]=new BattleSnapshot.UnitSnapshot {Id=s.Units[i].Id,Side=s.Units[i].Side,Cell=s.Units[i].Cell,Facing=s.Units[i].Facing,Hp=s.Units[i].Hp,State=s.Units[i].State}; return x; }
        public static BattleResult Result(BattleSimState s) { return new BattleResult {Outcome=s.Outcome,FinalTick=s.Tick,ResultHash=CoreApi.StableHashHex((int)s.Outcome+";"+s.Tick+";"+s.Fingerprint()+";" )}; }
        public static (BattleSimState, Ledger) Replay(BattleSetup setup, IReadOnlyList<BattleTickCommand> commands, int maxTicks) { var s=Open(setup); var l=new Ledger(); var a=new List<BattleTickCommand>(commands??new BattleTickCommand[0]); a.Sort((x,y)=>x.At.Value!=y.At.Value?x.At.Value.CompareTo(y.At.Value):x.Seq.CompareTo(y.Seq)); var next=0; for(var i=0;i<maxTicks&&s.Outcome==ContractOutcome.Ongoing;i++){ while(next<a.Count&&a[next].At.Value==s.Tick){Submit(s,l,a[next]);next++;} Step(s,l); } return (s,l); }
    }
}
