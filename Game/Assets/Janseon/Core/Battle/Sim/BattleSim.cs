using System;
using System.Collections.Generic;
using System.Globalization;
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
            if (setup.Context == null) throw new ArgumentException("Battle setup requires context.", nameof(setup));
            setup.Context.ValidateIntegrity();
            var seedHash = setup.Context.SeedIdentityHash ?? setup.Context.ContextHash ?? string.Empty;
            var seed = unchecked((int)uint.Parse(CoreApi.StableHashHex(seedHash).Substring(0, 8), NumberStyles.HexNumber, CultureInfo.InvariantCulture));
            var terrain = setup.Terrain != null ? setup.Terrain.Snapshot() : null;
            var arena = terrain != null ? new ArenaState { Width = terrain.Width, Height = terrain.Height } : new ArenaState();
            var s = new BattleSimState { Tick = 0, Outcome = ContractOutcome.Ongoing, Rng = new PurposeRng(seed), Arena = arena, Terrain = terrain, Context = setup.Context };
            var cards = CardCatalog.All(); s.Cards = new CardState[cards.Count]; for (var i = 0; i < cards.Count; i++) s.Cards[i] = new CardState { Id = cards[i].Id };
            s.Sides = new[] { new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 }, new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 } };
            s.PlayerCommanderId = setup.PlayerFormation != null && setup.PlayerFormation.Length > 0 ? setup.PlayerFormation[0].Unit : (setup.PlayerUnits != null && setup.PlayerUnits.Length > 0 ? setup.PlayerUnits[0].Id : new UnitId());
            s.EnemyCommanderId = setup.EnemyCommanderId;
            var roster = new List<RosterUnit>(); if (setup.PlayerUnits != null) roster.AddRange(setup.PlayerUnits); if (setup.EnemyUnits != null) roster.AddRange(setup.EnemyUnits);
            s.Arena.EnemyRetreatEdge = new GridCoord[s.Arena.Height - 2];
            for (var y = 0; y < s.Arena.EnemyRetreatEdge.Length; y++) s.Arena.EnemyRetreatEdge[y] = new GridCoord(s.Arena.Width - 1, y + 1);
            s.Units = new UnitState[roster.Count];
            for (var i = 0; i < roster.Count; i++) { var u = roster[i]; s.Units[i] = new UnitState { Id=u.Id, Side=u.Side, Hp=u.Hp, MaxHp=u.MaxHp, Power=u.Power, RangeMin=u.RangeMin, RangeMax=u.RangeMax, MoveTicksPerCell=u.MoveTicksPerCell, AttackCooldownTicks=u.AttackCooldownTicks, Cell=new GridCoord(u.Side == 0 ? 1 : 10, i % 6 + 1), Facing=u.Side == 0 ? CardinalDirection.East : CardinalDirection.West, MoveTicksLeft=u.MoveTicksPerCell }; }
            FormationResolver.Resolve(s, setup.EnemyFormation);
            if (terrain != null)
            {
                EnsureLandSpawnCells(s);
            }
            s.PreviousHp = new int[s.Units.Length]; s.PreviousStates = new string[s.Units.Length];
            for (var i = 0; i < s.Units.Length; i++) { s.PreviousHp[i] = s.Units[i].Hp; s.PreviousStates[i] = s.Units[i].State; }
            var plans = setup.Telegraphs ?? new TelegraphPlan[0]; s.Telegraphs = new TelegraphState[plans.Length]; for (var i=0;i<plans.Length;i++) s.Telegraphs[i] = new TelegraphState { Cell=plans[i].Cell, ArrivalTick=plans[i].ArrivalTick, Count=plans[i].Count };
            return s;
        }
        public static object Submit(BattleSimState state, Ledger ledger, BattleTickCommand cmd)
        {
            if (state == null || ledger == null || cmd == null) return new ContractRejection { Reason=ContractRejectReason.MalformedCommand };
            if (cmd.At.Value != state.Tick) return new ContractRejection { Reason=ContractRejectReason.TickMismatch };
            if (state.Outcome != ContractOutcome.Ongoing) return new ContractRejection { Reason=ContractRejectReason.BattleEnded };
            if (cmd.Kind == BattleTickCommandKind.DemandSurrender) { if (!OutcomeRules.CanEnemySurrender(state)) return new ContractRejection { Reason=ContractRejectReason.SurrenderConditionsUnmet }; state.Outcome=ContractOutcome.EnemySurrender; ledger.Events.Add(new TypedEvent { Id=new EventId("bcmd-"+cmd.At.Value.ToString(CultureInfo.InvariantCulture)+"-"+cmd.Seq.ToString(CultureInfo.InvariantCulture)), At=cmd.At, CauseId=cmd.Id, SummaryHash=state.Fingerprint() }); return null; }
            if (cmd.Kind == BattleTickCommandKind.PlayCard && !string.IsNullOrEmpty(cmd.CardId))
            {
                var near = false;
                for (var i = 0; i < state.Units.Length; i++)
                {
                    var commander = state.Units[i];
                    if (commander.Id.Equals(state.PlayerCommanderId)
                        && commander.Side == 0
                        && commander.State == "Active"
                        && commander.Hp > 0
                        && commander.Cell.ManhattanTo(cmd.Target) <= BattleRules.CommandRadius)
                    {
                        near = true;
                        break;
                    }
                }
                if (!near) return new ContractRejection { Reason=ContractRejectReason.CardOutOfRadius };
            }
            if (!state.Deployed && cmd.Kind != BattleTickCommandKind.Deploy) return new ContractRejection { Reason=ContractRejectReason.NotDeployed };
            if (cmd.Kind == BattleTickCommandKind.SetFacing)
            {
                var found = false;
                for (var i = 0; i < state.Units.Length; i++) if (state.Units[i].Side == 0 && state.Units[i].Cell.Equals(cmd.Target)) { found = true; break; }
                if (!found) return new ContractRejection { Reason=ContractRejectReason.UnknownActor };
            }
            if (cmd.Kind == BattleTickCommandKind.Deploy)
            {
                var strongholds = cmd.StrongholdCardIds ?? cmd.StrongholdCards;
                if (strongholds != null && strongholds.Length > BattleRules.StrongholdCardSlots) return new ContractRejection { Reason=ContractRejectReason.MalformedCommand };
                if (strongholds != null) for (var i = 0; i < strongholds.Length; i++)
                {
                    var selected = CardCatalog.Find(strongholds[i]);
                    if (selected == null || selected.Kind != CardKind.Stronghold) return new ContractRejection { Reason=ContractRejectReason.MalformedCommand };
                }
                state.StrongholdCardIds = strongholds;
            }
            if (cmd.Kind == BattleTickCommandKind.PlayCard)
            {
                if (string.IsNullOrEmpty(cmd.CardId)) return new ContractRejection { Reason=ContractRejectReason.MalformedCommand };
                var card = CardCatalog.Find(cmd.CardId); if (card == null) return new ContractRejection { Reason=ContractRejectReason.CardUnknown };
                if (card.Kind == CardKind.Stronghold && !Contains(state.StrongholdCardIds, card.Id)) return new ContractRejection { Reason=ContractRejectReason.CardUnknown };
                for (var i = 0; i < state.Cards.Length; i++) if (state.Cards[i].Id == card.Id && state.Cards[i].RechargeTicksLeft > 0) return new ContractRejection { Reason=ContractRejectReason.CardRecharging };
                if (card.EffectKey == "cardinal_reposition")
                {
                    var target = FindPlayerUnit(state, cmd.Target);
                    if (target == null || target.State != "Active" || target.Hp <= 0)
                        return new ContractRejection { Reason=ContractRejectReason.CardInvalidTarget };
                    var destination = target.Cell.Step(cmd.Facing);
                    if (!state.Arena.InBounds(destination) || state.Terrain != null && state.Terrain.MoveCost(target.Cell, destination) < 0)
                        return new ContractRejection { Reason=ContractRejectReason.CardDestinationOutOfBounds };
                    if (Occupied(state, destination))
                        return new ContractRejection { Reason=ContractRejectReason.CardDestinationBlocked };
                }
                for (var i = 0; i < state.Cards.Length; i++) if (state.Cards[i].Id == card.Id)
                {
                    state.Cards[i].RechargeTicksLeft = card.RechargeTicks;
                    if (card.EffectKey == "front_damage" || card.EffectKey == "retreat") state.Cards[i].ActiveTicksLeft = BattleRules.CardEffectTicks;
                }
                if (card.EffectKey == "morale") state.Sides[0].Morale += card.Effect;
                if (card.EffectKey == "front_heal")
                {
                    for (var i = 0; i < state.Units.Length; i++)
                    {
                        var unit = state.Units[i];
                        if (unit.Side != 0 || unit.State != "Active" || unit.Hp <= 0) continue;
                        unit.Hp = System.Math.Min(unit.MaxHp, unit.Hp + card.Effect);
                        break;
                    }
                }
                if (card.EffectKey == "cardinal_reposition")
                {
                    var target = FindPlayerUnit(state, cmd.Target);
                    target.Cell = target.Cell.Step(cmd.Facing);
                    target.Facing = cmd.Facing;
                }
            }
            if (cmd.Kind == BattleTickCommandKind.OrderRetreat && !IsActive(state, "passage-retreat"))
                return new ContractRejection { Reason=ContractRejectReason.RetreatUnavailable };
            state.Pending.Add(cmd); state.Pending.Sort((a,b) => a.At.Value != b.At.Value ? a.At.Value.CompareTo(b.At.Value) : a.Seq.CompareTo(b.Seq));
            if (cmd.Kind == BattleTickCommandKind.Deploy) { state.Deployed=true; FormationResolver.Resolve(state, cmd.Formation); }
            ledger.Events.Add(new TypedEvent { Id=new EventId("bcmd-"+cmd.At.Value.ToString(CultureInfo.InvariantCulture)+"-"+cmd.Seq.ToString(CultureInfo.InvariantCulture)), At=cmd.At, CauseId=cmd.Id, SummaryHash=state.Fingerprint() }); return null;
        }
        public static void Step(BattleSimState state, Ledger ledger)
        {
            if (state == null || ledger == null || state.Outcome != ContractOutcome.Ongoing) return;
            state.Pending.Sort((a,b) => a.At.Value != b.At.Value ? a.At.Value.CompareTo(b.At.Value) : a.Seq.CompareTo(b.Seq));
            while (state.Pending.Count > 0 && state.Pending[0].At.Value == state.Tick)
            {
                var c = state.Pending[0]; state.Pending.RemoveAt(0);
                switch (c.Kind)
                {
                    case BattleTickCommandKind.Deploy: break;
                    case BattleTickCommandKind.PlayCard: break;
                    case BattleTickCommandKind.OrderRetreat: state.Outcome = ContractOutcome.PlayerRetreat; break;
                    case BattleTickCommandKind.DemandSurrender: break;
                    case BattleTickCommandKind.SetFacing:
                    {
                        for (var i = 0; i < state.Units.Length; i++) if (state.Units[i].Side == 0 && state.Units[i].Cell.Equals(c.Target)) { state.Units[i].Facing = c.Facing; break; }
                        break;
                    }
                    default: throw new ArgumentOutOfRangeException();
                }
            }
            ReinforcementRules.Resolve(state); if (state.Outcome != ContractOutcome.Ongoing) { TickCards(state); ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++; return; } IntentPlanner.Resolve(state); CombatRules.Resolve(state); MoraleRules.Resolve(state); state.Sides[1].RetreatCovered = OutcomeRules.RetreatCovered(state); OutcomeRules.Resolve(state);
            TickCards(state);
            ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++;
        }
        static void TickCards(BattleSimState state)
        {
            if (state.Cards == null) return;
            for (var i = 0; i < state.Cards.Length; i++)
            {
                if (state.Cards[i].RechargeTicksLeft > 0) state.Cards[i].RechargeTicksLeft--;
                if (state.Cards[i].ActiveTicksLeft > 0) state.Cards[i].ActiveTicksLeft--;
            }
        }
        static UnitState FindPlayerUnit(BattleSimState state, GridCoord cell)
        {
            for (var i = 0; i < state.Units.Length; i++)
                if (state.Units[i].Side == 0 && state.Units[i].Cell.Equals(cell)) return state.Units[i];
            return null;
        }
        static bool Occupied(BattleSimState state, GridCoord cell)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.State != "Down" && unit.State != "Routing" && unit.Hp > 0 && unit.Cell.Equals(cell)) return true;
            }
            return false;
        }
        static void EnsureLandSpawnCells(BattleSimState state)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (!state.Terrain.IsWater(unit.Cell.X, unit.Cell.Y)) continue;
                for (var y = 0; y < state.Arena.Height; y++) for (var x = 0; x < state.Arena.Width; x++)
                {
                    var candidate = new GridCoord(x, y);
                    if (!state.Terrain.IsWater(x, y) && !Occupied(state, candidate)) { unit.Cell = candidate; x = state.Arena.Width; y = state.Arena.Height; }
                }
            }
        }
        static bool Contains(string[] values, string value)
        {
            if (values == null) return false;
            for (var i = 0; i < values.Length; i++) if (values[i] == value) return true;
            return false;
        }
        static bool IsActive(BattleSimState state, string cardId)
        {
            if (state.Cards == null) return false;
            for (var i = 0; i < state.Cards.Length; i++)
                if (state.Cards[i].Id == cardId) return state.Cards[i].ActiveTicksLeft > 0;
            return false;
        }
        public static BattleSnapshot Snapshot(BattleSimState s) { var x=new BattleSnapshot { Tick=s.Tick, Outcome=s.Outcome, Sides=new BattleSnapshot.SideSnapshot[s.Sides.Length], Units=new BattleSnapshot.UnitSnapshot[s.Units.Length], Telegraphs=new BattleSnapshot.TelegraphView[s.Telegraphs.Length], Cards=new BattleSnapshot.CardView[s.Cards == null ? 0 : s.Cards.Length] }; for(var i=0;i<x.Cards.Length;i++) x.Cards[i]=new BattleSnapshot.CardView {Id=s.Cards[i].Id,RechargeTicksLeft=s.Cards[i].RechargeTicksLeft}; for(var i=0;i<s.Telegraphs.Length;i++) x.Telegraphs[i]=new BattleSnapshot.TelegraphView {Cell=s.Telegraphs[i].Cell, ArrivalTick=s.Telegraphs[i].ArrivalTick, Count=s.Telegraphs[i].Count}; for(var i=0;i<s.Sides.Length;i++) x.Sides[i]=new BattleSnapshot.SideSnapshot {Morale=s.Sides[i].Morale,CommanderHpPercent=s.Sides[i].CommanderHpPercent,RetreatCovered=s.Sides[i].RetreatCovered,CommandsLocked=s.Sides[i].CommandsLocked}; for(var i=0;i<s.Units.Length;i++) x.Units[i]=new BattleSnapshot.UnitSnapshot {Id=s.Units[i].Id,Side=s.Units[i].Side,Cell=s.Units[i].Cell,Facing=s.Units[i].Facing,Hp=s.Units[i].Hp,State=s.Units[i].State}; return x; }
        public static BattleResult Result(BattleSimState s) { if (s == null) throw new ArgumentNullException(nameof(s)); var hp = new Dictionary<string, int>(); if (s.Units != null) for (var i=0;i<s.Units.Length;i++) if (s.Units[i].Id.ToString() == RealtimeBattleApi.PersistentAllyId) hp[RealtimeBattleApi.PersistentAllyId] = s.Units[i].Hp; return new BattleResult {Outcome=s.Outcome,FinalTick=s.Tick,BattleId=s.Context != null ? s.Context.BattleId : string.Empty,ResultHash=CoreApi.StableHashHex((int)s.Outcome+";"+s.Tick+";"+s.Fingerprint()+";" ),UnitHp=new UnitHpSnapshot(hp)}; }
        public static (BattleSimState, Ledger) Replay(BattleSetup setup, IReadOnlyList<BattleTickCommand> commands, int maxTicks) { var s=Open(setup); var l=new Ledger(); var a=new List<BattleTickCommand>(commands??new BattleTickCommand[0]); a.Sort((x,y)=>x.At.Value!=y.At.Value?x.At.Value.CompareTo(y.At.Value):x.Seq.CompareTo(y.Seq)); var next=0; for(var i=0;i<maxTicks&&s.Outcome==ContractOutcome.Ongoing;i++){ while(next<a.Count&&a[next].At.Value==s.Tick){Submit(s,l,a[next]);next++;} Step(s,l); } return (s,l); }
    }
}
