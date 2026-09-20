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
            if (setup.Context.RulesVersion != BattleRules.RulesVersion)
                throw new NotSupportedException("Unsupported battle rules version '" + setup.Context.RulesVersion + "'.");
            var seedHash = setup.Context.SeedIdentityHash ?? setup.Context.ContextHash ?? string.Empty;
            var seed = unchecked((int)uint.Parse(CoreApi.StableHashHex(seedHash).Substring(0, 8), NumberStyles.HexNumber, CultureInfo.InvariantCulture));
            var terrain = setup.Terrain != null ? setup.Terrain.Snapshot() : null;
            var arena = terrain != null ? new ArenaState { Width = terrain.Width, Height = terrain.Height } : new ArenaState();
            ValidateRoster(setup.PlayerUnits, 0);
            ValidateRoster(setup.EnemyUnits, 1);
            var s = new BattleSimState { Tick = 0, Outcome = ContractOutcome.Ongoing, Rng = new PurposeRng(seed), Arena = arena, Terrain = terrain, Context = setup.Context };
            s.Sides = new[] { new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 }, new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 } };
            s.PlayerCommanderId = setup.PlayerFormation != null && setup.PlayerFormation.Length > 0 ? setup.PlayerFormation[0].Unit : (setup.PlayerUnits != null && setup.PlayerUnits.Length > 0 ? setup.PlayerUnits[0].Id : new UnitId());
            s.EnemyCommanderId = setup.EnemyCommanderId;
            var roster = new List<RosterUnit>(); if (setup.PlayerUnits != null) roster.AddRange(setup.PlayerUnits); if (setup.EnemyUnits != null) roster.AddRange(setup.EnemyUnits);
            s.Arena.EnemyRetreatEdge = new GridCoord[s.Arena.Height - 2];
            for (var y = 0; y < s.Arena.EnemyRetreatEdge.Length; y++) s.Arena.EnemyRetreatEdge[y] = new GridCoord(s.Arena.Width - 1, y + 1);
            s.Units = new UnitState[roster.Count];
            for (var i = 0; i < roster.Count; i++) { var u = roster[i]; s.Units[i] = new UnitState { Id=u.Id, Side=u.Side, Hp=u.Hp, MaxHp=u.MaxHp, SurvivorCount=AggregateSurvivorRules.FromHp(u.Hp, u.MaxHp), Power=u.Power, RangeMin=u.RangeMin, RangeMax=u.RangeMax, MoveTicksPerCell=u.MoveTicksPerCell, AttackCooldownTicks=u.AttackCooldownTicks, Cell=new GridCoord(u.Side == 0 ? 1 : 10, i % 6 + 1), Facing=u.Side == 0 ? CardinalDirection.East : CardinalDirection.West, MoveTicksLeft=u.MoveTicksPerCell }; }
            var definitions = CardCatalog.All();
            var cardStates = new List<CardState>();
            for (var definitionIndex = 0; definitionIndex < definitions.Count; definitionIndex++)
            {
                var definition = definitions[definitionIndex];
                if (definition.Kind == CardKind.Stronghold)
                {
                    cardStates.Add(new CardState { Id = definition.Id });
                    continue;
                }
                for (var unitIndex = 0; unitIndex < s.Units.Length; unitIndex++)
                    if (s.Units[unitIndex].Side == 0) cardStates.Add(new CardState { OwnerUnitId = s.Units[unitIndex].Id, Id = definition.Id });
            }
            s.Cards = cardStates.ToArray();
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
        public static object PreviewCard(BattleSimState state, BattleTickCommand cmd)
        {
            CardValidation validation;
            return ValidateCard(state, cmd, out validation);
        }
        public static object Submit(BattleSimState state, Ledger ledger, BattleTickCommand cmd)
        {
            if (state == null || ledger == null || cmd == null) return new ContractRejection { Reason=ContractRejectReason.MalformedCommand };
            cmd = cmd.Clone();
            if (cmd.At.Value != state.Tick) return new ContractRejection { Reason=ContractRejectReason.TickMismatch };
            if (state.Outcome != ContractOutcome.Ongoing) return new ContractRejection { Reason=ContractRejectReason.BattleEnded };
            if (cmd.Kind == BattleTickCommandKind.DemandSurrender) { if (!OutcomeRules.CanEnemySurrender(state)) return new ContractRejection { Reason=ContractRejectReason.SurrenderConditionsUnmet }; state.Outcome=ContractOutcome.EnemySurrender; ClearAllOrders(state); ledger.Events.Add(new TypedEvent { Id=new EventId("bcmd-"+cmd.At.Value.ToString(CultureInfo.InvariantCulture)+"-"+cmd.Seq.ToString(CultureInfo.InvariantCulture)), At=cmd.At, CauseId=cmd.Id, SummaryHash=state.Fingerprint() }); return null; }
            if (cmd.Kind == BattleTickCommandKind.PlayCard)
            {
                CardValidation validation;
                var rejection = ValidateCard(state, cmd, out validation);
                if (rejection != null) return rejection;
                ApplyCard(state, cmd, validation);
            }
            else if (!state.Deployed && cmd.Kind != BattleTickCommandKind.Deploy) return new ContractRejection { Reason=ContractRejectReason.NotDeployed };
            if (cmd.Kind == BattleTickCommandKind.SetFacing || cmd.Kind == BattleTickCommandKind.Move || cmd.Kind == BattleTickCommandKind.Attack)
            {
                var rejection = ValidateActorCommand(state, cmd);
                if (rejection != null) return rejection;
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
            if (cmd.Kind == BattleTickCommandKind.OrderRetreat && !IsActive(state, "passage-retreat"))
                return new ContractRejection { Reason=ContractRejectReason.RetreatUnavailable };
            state.Pending.Add(cmd); state.Pending.Sort((a,b) => a.At.Value != b.At.Value ? a.At.Value.CompareTo(b.At.Value) : a.Seq.CompareTo(b.Seq));
            if (cmd.Kind == BattleTickCommandKind.Deploy) { state.Deployed=true; FormationResolver.Resolve(state, cmd.Formation); }
            ledger.Events.Add(new TypedEvent { Id=new EventId("bcmd-"+cmd.At.Value.ToString(CultureInfo.InvariantCulture)+"-"+cmd.Seq.ToString(CultureInfo.InvariantCulture)), At=cmd.At, CauseId=cmd.Id, SummaryHash=state.Fingerprint() }); return null;
        }
        public static void Step(BattleSimState state, Ledger ledger)
        {
            Step(state, ledger, 1f / BattleRules.TicksPerSecond);
        }

        public static void Step(BattleSimState state, Ledger ledger, float fixedDeltaTime)
        {
            if (state == null || ledger == null || state.Outcome != ContractOutcome.Ongoing) return;
            if (fixedDeltaTime <= 0f) throw new ArgumentOutOfRangeException(nameof(fixedDeltaTime));
            state.ElapsedSeconds += fixedDeltaTime;
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
                        var actor = FindUnit(state, c.ActorUnitId);
                        if (IsLivingPlayer(actor)) actor.Facing = c.Facing;
                        break;
                    }
                    case BattleTickCommandKind.Move:
                    {
                        var actor = FindUnit(state, c.ActorUnitId);
                        if (IsLivingPlayer(actor))
                        {
                            actor.OrderKind = BattleOrderKind.Move;
                            actor.OrderDestination = c.Target;
                            actor.OrderTargetUnitId = new UnitId();
                        }
                        break;
                    }
                    case BattleTickCommandKind.Attack:
                    {
                        var actor = FindUnit(state, c.ActorUnitId);
                        if (IsLivingPlayer(actor))
                        {
                            actor.OrderKind = BattleOrderKind.Attack;
                            actor.OrderDestination = new GridCoord();
                            actor.OrderTargetUnitId = c.TargetUnitId;
                        }
                        break;
                    }
                    default: throw new ArgumentOutOfRangeException();
                }
            }
            ClearUnavailableActorOrders(state);
            ReinforcementRules.Resolve(state); if (state.Outcome != ContractOutcome.Ongoing) { ClearAllOrders(state); TickCards(state); ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++; return; } IntentPlanner.Resolve(state); CombatRules.Resolve(state); MoraleRules.Resolve(state); state.Sides[1].RetreatCovered = OutcomeRules.RetreatCovered(state); OutcomeRules.Resolve(state); ClearInvalidOrders(state);
            TickCards(state);
            ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++;
        }

        static void ValidateRoster(RosterUnit[] roster, int side)
        {
            if (roster == null) return;
            if (roster.Length > 20) throw new ArgumentException("A squad may contain at most 20 soldiers.");
            var ids = new HashSet<string>(StringComparer.Ordinal);
            for (var i = 0; i < roster.Length; i++)
                if (roster[i] == null || roster[i].Side != side || string.IsNullOrEmpty(roster[i].Id.Value) || !ids.Add(roster[i].Id.Value))
                    throw new ArgumentException("Roster contains an invalid, duplicate, or mismatched soldier.");
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
        sealed class CardValidation
        {
            public CardDefinition Definition;
            public CardState State;
            public UnitState Owner;
            public UnitState Target;
            public GridCoord Destination;
        }
        static object ValidateCard(BattleSimState state, BattleTickCommand cmd, out CardValidation validation)
        {
            validation = null;
            if (state == null || cmd == null || cmd.Kind != BattleTickCommandKind.PlayCard)
                return new ContractRejection { Reason = ContractRejectReason.MalformedCommand };
            if (cmd.At.Value != state.Tick) return new ContractRejection { Reason = ContractRejectReason.TickMismatch };
            if (state.Outcome != ContractOutcome.Ongoing) return new ContractRejection { Reason = ContractRejectReason.BattleEnded };
            if (!state.Deployed) return new ContractRejection { Reason = ContractRejectReason.NotDeployed };
            if (state.Sides != null && state.Sides.Length > 0 && state.Sides[0].CommandsLocked)
                return new ContractRejection { Reason = ContractRejectReason.CommandsLocked };
            if (string.IsNullOrEmpty(cmd.CardId)) return new ContractRejection { Reason = ContractRejectReason.MalformedCommand };
            var definition = CardCatalog.Find(cmd.CardId);
            if (definition == null) return new ContractRejection { Reason = ContractRejectReason.CardUnknown };
            if (definition.Kind == CardKind.Stronghold && !Contains(state.StrongholdCardIds, definition.Id))
                return new ContractRejection { Reason = ContractRejectReason.CardUnknown };

            UnitState owner = null;
            if (definition.Kind == CardKind.Character)
            {
                if (string.IsNullOrEmpty(cmd.OwnerUnitId.Value)) return new ContractRejection { Reason = ContractRejectReason.CardOwnerRequired };
                owner = FindUnit(state, cmd.OwnerUnitId);
                if (!IsLivingPlayer(owner)) return new ContractRejection { Reason = ContractRejectReason.CardInvalidOwner };
            }
            else if (!string.IsNullOrEmpty(cmd.OwnerUnitId.Value))
            {
                owner = FindUnit(state, cmd.OwnerUnitId);
                if (!IsLivingPlayer(owner)) return new ContractRejection { Reason = ContractRejectReason.CardInvalidOwner };
            }

            UnitState target = null;
            if (!string.IsNullOrEmpty(cmd.TargetUnitId.Value))
            {
                target = FindUnit(state, cmd.TargetUnitId);
                if (!IsLivingPlayer(target)) return new ContractRejection { Reason = ContractRejectReason.CardInvalidTarget };
            }
            if (definition.EffectKey == "cardinal_reposition" && target == null)
                return new ContractRejection { Reason = ContractRejectReason.CardInvalidTarget };
            if (target == null) target = owner ?? FindUnit(state, state.PlayerCommanderId);
            if (!IsLivingPlayer(target)) return new ContractRejection { Reason = ContractRejectReason.CardInvalidTarget };

            var radiusOrigin = definition.Kind == CardKind.Character
                ? owner
                : FindUnit(state, state.PlayerCommanderId);
            if (!IsLivingPlayer(radiusOrigin)
                || radiusOrigin.Cell.ManhattanTo(target.Cell) > BattleRules.CommandRadius)
                return new ContractRejection { Reason = ContractRejectReason.CardOutOfRadius };

            var cardState = FindCardState(state, definition, cmd.OwnerUnitId);
            if (cardState == null) return new ContractRejection { Reason = ContractRejectReason.CardUnknown };
            if (cardState.RechargeTicksLeft > 0) return new ContractRejection { Reason = ContractRejectReason.CardRecharging };

            var destination = target.Cell;
            if (definition.EffectKey == "cardinal_reposition")
            {
                destination = target.Cell.Step(cmd.Facing);
                if (!state.Arena.InBounds(destination) || state.Terrain != null && state.Terrain.MoveCost(target.Cell, destination) < 0)
                    return new ContractRejection { Reason = ContractRejectReason.CardDestinationOutOfBounds };
                if (Occupied(state, destination)) return new ContractRejection { Reason = ContractRejectReason.CardDestinationBlocked };
            }

            validation = new CardValidation { Definition = definition, State = cardState, Owner = owner, Target = target, Destination = destination };
            return null;
        }
        static void ApplyCard(BattleSimState state, BattleTickCommand cmd, CardValidation validation)
        {
            var card = validation.Definition;
            validation.State.RechargeTicksLeft = card.RechargeTicks;
            if (card.EffectKey == "front_damage" || card.EffectKey == "retreat")
                validation.State.ActiveTicksLeft = BattleRules.CardEffectTicks;
            if (card.EffectKey == "morale") state.Sides[0].Morale += card.Effect;
            if (card.EffectKey == "front_heal")
                validation.Target.Hp = System.Math.Min(validation.Target.MaxHp, validation.Target.Hp + card.Effect);
            if (card.EffectKey == "cardinal_reposition")
            {
                validation.Target.Cell = validation.Destination;
                validation.Target.Facing = cmd.Facing;
            }
        }
        static object ValidateActorCommand(BattleSimState state, BattleTickCommand cmd)
        {
            if (state.Sides != null && state.Sides.Length > 0 && state.Sides[0].CommandsLocked)
                return new ContractRejection { Reason = ContractRejectReason.CommandsLocked };
            var actor = FindUnit(state, cmd.ActorUnitId);
            if (!IsLivingPlayer(actor)) return new ContractRejection { Reason = ContractRejectReason.UnknownActor };
            if (cmd.Kind == BattleTickCommandKind.Move)
            {
                if (!state.Arena.InBounds(cmd.Target)
                    || state.Terrain != null && state.Terrain.IsWater(cmd.Target.X, cmd.Target.Y))
                    return new ContractRejection { Reason = ContractRejectReason.CardDestinationOutOfBounds };
                if (Occupied(state, cmd.Target, actor))
                    return new ContractRejection { Reason = ContractRejectReason.CardDestinationBlocked };
            }
            if (cmd.Kind == BattleTickCommandKind.Attack)
            {
                var target = FindUnit(state, cmd.TargetUnitId);
                if (target == null || target.Side == actor.Side || target.State != "Active" || target.Hp <= 0)
                    return new ContractRejection { Reason = ContractRejectReason.CardInvalidTarget };
            }
            return null;
        }
        static CardState FindCardState(BattleSimState state, CardDefinition definition, UnitId ownerUnitId)
        {
            if (state.Cards == null) return null;
            for (var i = 0; i < state.Cards.Length; i++)
            {
                var card = state.Cards[i];
                if (card.Id != definition.Id) continue;
                if (definition.Kind == CardKind.Stronghold || card.OwnerUnitId.Equals(ownerUnitId)) return card;
            }
            return null;
        }
        static UnitState FindUnit(BattleSimState state, UnitId id)
        {
            if (state.Units == null) return null;
            for (var i = 0; i < state.Units.Length; i++) if (state.Units[i].Id.Equals(id)) return state.Units[i];
            return null;
        }
        static bool IsLivingPlayer(UnitState unit)
        {
            return unit != null && unit.Side == 0 && unit.State == "Active" && unit.Hp > 0;
        }
        static bool Occupied(BattleSimState state, GridCoord cell)
        {
            return Occupied(state, cell, null);
        }
        static bool Occupied(BattleSimState state, GridCoord cell, UnitState except)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (ReferenceEquals(unit, except)) continue;
                if (unit.State != "Down" && unit.State != "Routing" && unit.Hp > 0 && unit.Cell.Equals(cell)) return true;
            }
            return false;
        }
        static void ClearUnavailableActorOrders(BattleSimState state)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.OrderKind == BattleOrderKind.None) continue;
                if (unit.State != "Active" || unit.Hp <= 0
                    || unit.Side >= 0 && unit.Side < state.Sides.Length && state.Sides[unit.Side].CommandsLocked)
                    ClearOrder(unit);
            }
        }
        static void ClearInvalidOrders(BattleSimState state)
        {
            if (state.Outcome != ContractOutcome.Ongoing)
            {
                ClearAllOrders(state);
                return;
            }
            ClearUnavailableActorOrders(state);
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.OrderKind != BattleOrderKind.Attack) continue;
                var target = FindUnit(state, unit.OrderTargetUnitId);
                if (target == null || target.Side == unit.Side || target.State != "Active" || target.Hp <= 0)
                    ClearOrder(unit);
            }
        }
        static void ClearAllOrders(BattleSimState state)
        {
            state.Pending.Clear();
            if (state.Units == null) return;
            for (var i = 0; i < state.Units.Length; i++) ClearOrder(state.Units[i]);
        }
        static void ClearOrder(UnitState unit)
        {
            unit.OrderKind = BattleOrderKind.None;
            unit.OrderDestination = new GridCoord();
            unit.OrderTargetUnitId = new UnitId();
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
                if (state.Cards[i].Id == cardId && state.Cards[i].ActiveTicksLeft > 0) return true;
            return false;
        }
        public static BattleSnapshot Snapshot(BattleSimState s) { var x=new BattleSnapshot { RulesVersion=s.Context == null ? string.Empty : s.Context.RulesVersion, Tick=s.Tick, Outcome=s.Outcome, Sides=new BattleSnapshot.SideSnapshot[s.Sides.Length], Units=new BattleSnapshot.UnitSnapshot[s.Units.Length], Telegraphs=new BattleSnapshot.TelegraphView[s.Telegraphs.Length], Cards=new BattleSnapshot.CardView[s.Cards == null ? 0 : s.Cards.Length] }; for(var i=0;i<x.Cards.Length;i++) x.Cards[i]=new BattleSnapshot.CardView {OwnerUnitId=s.Cards[i].OwnerUnitId,Id=s.Cards[i].Id,RechargeTicksLeft=s.Cards[i].RechargeTicksLeft,ActiveTicksLeft=s.Cards[i].ActiveTicksLeft}; for(var i=0;i<s.Telegraphs.Length;i++) x.Telegraphs[i]=new BattleSnapshot.TelegraphView {Cell=s.Telegraphs[i].Cell, ArrivalTick=s.Telegraphs[i].ArrivalTick, Count=s.Telegraphs[i].Count}; for(var i=0;i<s.Sides.Length;i++) x.Sides[i]=new BattleSnapshot.SideSnapshot {Morale=s.Sides[i].Morale,CommanderHpPercent=s.Sides[i].CommanderHpPercent,RetreatCovered=s.Sides[i].RetreatCovered,CommandsLocked=s.Sides[i].CommandsLocked}; for(var i=0;i<s.Units.Length;i++) x.Units[i]=new BattleSnapshot.UnitSnapshot {Id=s.Units[i].Id,Side=s.Units[i].Side,Cell=s.Units[i].Cell,Facing=s.Units[i].Facing,Hp=s.Units[i].Hp,SurvivorCount=s.Units[i].SurvivorCount,State=s.Units[i].State,OrderKind=s.Units[i].OrderKind,OrderDestination=s.Units[i].OrderDestination,OrderTargetUnitId=s.Units[i].OrderTargetUnitId,MoveTicksLeft=s.Units[i].MoveTicksLeft,AttackCooldownTicksLeft=s.Units[i].CooldownTicksLeft}; return x; }
        public static BattleResult Result(BattleSimState s) { if (s == null) throw new ArgumentNullException(nameof(s)); var hp = new Dictionary<string, int>(); if (s.Units != null) for (var i=0;i<s.Units.Length;i++) if (s.Units[i].Id.ToString() == RealtimeBattleApi.PersistentAllyId) hp[RealtimeBattleApi.PersistentAllyId] = s.Units[i].Hp; return new BattleResult {Outcome=s.Outcome,FinalTick=s.Tick,BattleId=s.Context != null ? s.Context.BattleId : string.Empty,ResultHash=CoreApi.StableHashHex((int)s.Outcome+";"+s.Tick+";"+s.Fingerprint()+";" ),UnitHp=new UnitHpSnapshot(hp)}; }
        public static (BattleSimState, Ledger) Replay(BattleSetup setup, IReadOnlyList<BattleTickCommand> commands, int maxTicks)
        {
            if (setup == null) throw new ArgumentNullException(nameof(setup));
            if (setup.Context == null || setup.Context.RulesVersion != BattleRules.RulesVersion)
                throw new NotSupportedException("Unsupported battle replay rules version '" + (setup.Context == null ? string.Empty : setup.Context.RulesVersion) + "'.");
            var s=Open(setup); var l=new Ledger(); var a=new List<BattleTickCommand>(commands??new BattleTickCommand[0]); a.Sort((x,y)=>x.At.Value!=y.At.Value?x.At.Value.CompareTo(y.At.Value):x.Seq.CompareTo(y.Seq)); var next=0; for(var i=0;i<maxTicks&&s.Outcome==ContractOutcome.Ongoing;i++){ while(next<a.Count&&a[next].At.Value==s.Tick){var command=a[next]; var rejection=Submit(s,l,command); if(rejection!=null) throw new InvalidOperationException("Replay command '"+command.Id+"' rejected: "+((ContractRejection)rejection).Reason); next++;} Step(s,l); } return (s,l);
        }
    }
}
