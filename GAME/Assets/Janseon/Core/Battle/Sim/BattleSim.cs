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
        public static bool ResolveSoldierSpacing(BattleSimState state, HashSet<GridCoord> blockedCells)
        {
            if (state == null || state.Units == null) return false;
            var ordered = new List<UnitState>(state.Units); ordered.Sort((a, b) => string.CompareOrdinal(a.Id.Value, b.Id.Value));
            for (var i = 0; i < ordered.Count; i++)
                if (blockedCells != null && blockedCells.Contains(ordered[i].Cell)) { state.SpatialHash = SpatialFingerprint(ordered); return false; }
            var cellSize = 1;
            for (var i = 0; i < ordered.Count; i++) cellSize = Math.Max(cellSize, 2 * ordered[i].RadiusMm);
            state.SpatialBuckets.Clear();
            for (var i = 0; i < ordered.Count; i++)
            {
                var key = new IntPointMm(FloorDiv(ordered[i].PositionMm.X, cellSize), FloorDiv(ordered[i].PositionMm.Y, cellSize));
                List<UnitId> bucket;
                if (!state.SpatialBuckets.TryGetValue(key, out bucket)) state.SpatialBuckets[key] = bucket = new List<UnitId>();
                bucket.Add(ordered[i].Id);
            }
            for (var iteration = 0; iteration < 4; iteration++)
                for (var i = 0; i < ordered.Count; i++)
                    for (var j = i + 1; j < ordered.Count; j++)
                    {
                        var a = ordered[i]; var b = ordered[j];
                        var dx = b.PositionMm.X - a.PositionMm.X; var dy = b.PositionMm.Y - a.PositionMm.Y;
                        var min = a.RadiusMm + b.RadiusMm;
                        if (Math.Abs(dx) >= min && Math.Abs(dy) >= min) continue;
                        if (Math.Abs(dx) >= Math.Abs(dy)) { var push = Math.Max(1, min - Math.Abs(dx)); b.PositionMm.X += dx >= 0 ? push : -push; }
                        else { var push = Math.Max(1, min - Math.Abs(dy)); b.PositionMm.Y += dy >= 0 ? push : -push; }
                    }
            state.SpatialHash = SpatialFingerprint(ordered) + ":cell=" + cellSize.ToString(CultureInfo.InvariantCulture);
            return true;
        }

        static int FloorDiv(int value, int divisor)
        {
            if (value >= 0) return value / divisor;
            return -(((-value) + divisor - 1) / divisor);
        }

        static string SpatialFingerprint(List<UnitState> units)
        {
            var text = string.Empty;
            for (var i = 0; i < units.Count; i++) text += units[i].Id.Value + "=" + units[i].PositionMm + ";";
            return CoreApi.StableHashHex(text);
        }

        public sealed class FormationUnit { public readonly string SoldierId; public readonly int Slot; public FormationUnit(string id, int slot) { SoldierId=id; Slot=slot; } }
        public sealed class BattlefieldSurface
        {
            readonly bool[] blocked; readonly int[] heights; readonly System.Collections.Generic.Dictionary<string, GridCoord> anchors = new System.Collections.Generic.Dictionary<string, GridCoord>();
            BattlefieldSurface(int w, int h) { Width=w; Height=h; blocked=new bool[w*h]; heights=new int[w*h]; for(var i=0;i<heights.Length;i++) heights[i]=1; }
            public int Width { get; } public int Height { get; }
            public static BattlefieldSurface Create(int w,int h) { return new BattlefieldSurface(w,h); }
            public BattlefieldSurface WithHeights(int[] v) { if(v==null||v.Length!=heights.Length) throw new ArgumentException("height data"); Array.Copy(v,heights,v.Length); return this; }
            public BattlefieldSurface WithBlocked(params GridCoord[] cells) { foreach(var c in cells) if(In(c)) blocked[c.Y*Width+c.X]=true; return this; }
            public BattlefieldSurface WithPassage(GridCoord a, GridCoord b) { if(In(a)&&In(b)){blocked[a.Y*Width+a.X]=false;blocked[b.Y*Width+b.X]=false;} return this; }
            public BattlefieldSurface WithAnchor(string id, GridCoord c) { anchors[id]=c; return this; }
            bool In(GridCoord c)=>c.X>=0&&c.Y>=0&&c.X<Width&&c.Y<Height;
            public sealed class Result { public bool Success; public string Error; public System.Collections.Generic.List<GridCoord> Path=new System.Collections.Generic.List<GridCoord>(); public string FormationHash; }
            public Result Project(FormationUnit[] units,string entry,string exit,GridCoord[] requested,bool tuning) { return ProjectFormation(this,units,entry,exit,requested,tuning); }
            internal bool IsOpen(GridCoord c)=>In(c)&&!blocked[c.Y*Width+c.X]; internal int HeightAt(GridCoord c)=>heights[c.Y*Width+c.X]; internal bool TryAnchor(string id,out GridCoord c)=>anchors.TryGetValue(id,out c);
        }
        public static BattlefieldSurface.Result ProjectFormation(BattlefieldSurface s, FormationUnit[] units,string entry,string exit,GridCoord[] requested=null,bool tuning=true)
        {
            var r=new BattlefieldSurface.Result(); if(s==null||units==null||units.Length==0){r.Error="formation is empty";return r;} if(!tuning){r.Error="missing tuning";return r;}
            GridCoord a,b; if(!s.TryAnchor(entry,out a)||!s.TryAnchor(exit,out b)){r.Error="anchor missing";return r;} if(requested!=null) foreach(var c in requested) if(!s.IsOpen(c)){r.Error="formation slot is blocked";return r;}
            var q=new System.Collections.Generic.Queue<GridCoord>(); var prev=new System.Collections.Generic.Dictionary<GridCoord,GridCoord>(); q.Enqueue(a); prev[a]=new GridCoord(int.MinValue,int.MinValue);
            while(q.Count>0){var c=q.Dequeue(); if(c.Equals(b))break; foreach(var d in new[]{CardinalDirection.North,CardinalDirection.East,CardinalDirection.South,CardinalDirection.West}){var n=c.Step(d); if(s.IsOpen(n)&&!prev.ContainsKey(n)){prev[n]=c;q.Enqueue(n);}}}
            if(!prev.ContainsKey(b)){r.Error="anchors disconnected";return r;} for(var c=b;;c=prev[c]){r.Path.Add(c);if(c.Equals(a))break;} r.Path.Reverse(); var text=string.Join(";",r.Path); foreach(var u in units) text+="|"+u.SoldierId+":"+u.Slot; r.FormationHash=CoreApi.StableHashHex(text); r.Success=true; return r;
        }
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
            if (!string.IsNullOrEmpty(setup.PlayerSquadId.Value))
                for (var i = 0; i < setup.PlayerUnits.Length; i++)
                    if (!setup.PlayerUnits[i].SquadId.Equals(setup.PlayerSquadId))
                        throw new ArgumentException("Soldier does not belong to the declared squad.");
            if (!string.IsNullOrEmpty(setup.PlayerSquadId.Value))
                for (var i = 0; i < setup.PlayerUnits.Length; i++)
                    if (!setup.PlayerUnits[i].SquadId.Equals(setup.PlayerSquadId))
                        throw new ArgumentException("Soldier does not belong to the declared squad.");
            var s = new BattleSimState { Tick = 0, Outcome = ContractOutcome.Ongoing, Rng = new PurposeRng(seed), Arena = arena, Terrain = terrain, Context = setup.Context };
            s.Sides = new[] { new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 }, new SideState { Morale = BattleRules.MoraleBase, CommanderHpPercent = 100 } };
            s.PlayerCommanderId = setup.PlayerFormation != null && setup.PlayerFormation.Length > 0 ? setup.PlayerFormation[0].Unit : (setup.PlayerUnits != null && setup.PlayerUnits.Length > 0 ? setup.PlayerUnits[0].Id : new UnitId());
            s.EnemyCommanderId = setup.EnemyCommanderId;
            s.Heroes = string.IsNullOrEmpty(setup.PlayerHeroId.Value) ? new HeroState[0] : new[] { new HeroState { Id = setup.PlayerHeroId, Hp = 100, Cell = new GridCoord(1, 0) } };
            var roster = new List<RosterUnit>(); if (setup.PlayerUnits != null) roster.AddRange(setup.PlayerUnits); if (setup.EnemyUnits != null) roster.AddRange(setup.EnemyUnits);
            s.Arena.EnemyRetreatEdge = new GridCoord[s.Arena.Height - 2];
            for (var y = 0; y < s.Arena.EnemyRetreatEdge.Length; y++) s.Arena.EnemyRetreatEdge[y] = new GridCoord(s.Arena.Width - 1, y + 1);
            s.Units = new UnitState[roster.Count];
            for (var i = 0; i < roster.Count; i++) { var u = roster[i]; s.Units[i] = new UnitState { Id=u.Id, SoldierId=string.IsNullOrEmpty(u.SoldierId.Value) ? new SoldierId(u.Id.Value) : u.SoldierId, SquadId=u.SquadId, Side=u.Side, Hp=u.Hp, MaxHp=u.MaxHp, SurvivorCount=AggregateSurvivorRules.FromHp(u.Hp, u.MaxHp), Power=u.Power, RangeMin=u.RangeMin, RangeMax=u.RangeMax, MoveTicksPerCell=u.MoveTicksPerCell, AttackCooldownTicks=u.AttackCooldownTicks, Cell=new GridCoord(u.Side == 0 ? 1 : 10, i % 6 + 1), Facing=u.Side == 0 ? CardinalDirection.East : CardinalDirection.West, MoveTicksLeft=u.MoveTicksPerCell }; }
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
            s.Squads = new[] { new SquadState { Id = setup.PlayerSquadId, CurrentOrder = BattleOrderKind.None, Formation = setup.PlayerFormation } };
            FormationResolver.Resolve(s, setup.EnemyFormation);
            if (terrain != null)
            {
                EnsureLandSpawnCells(s);
            }
            s.PreviousHp = new int[s.Units.Length]; s.PreviousStates = new string[s.Units.Length];
            for (var i = 0; i < s.Units.Length; i++) { s.PreviousHp[i] = s.Units[i].Hp; s.PreviousStates[i] = s.Units[i].State; }
            var plans = setup.Telegraphs ?? new TelegraphPlan[0]; s.Telegraphs = new TelegraphState[plans.Length]; for (var i=0;i<plans.Length;i++) s.Telegraphs[i] = new TelegraphState { Cell=plans[i].Cell, ArrivalTick=plans[i].ArrivalTick, Count=plans[i].Count };
            s.PublishFrame();
            return s;
        }
        public static object PreviewCard(BattleSimState state, BattleTickCommand cmd)
        {
            CardValidation validation;
            return ValidateCard(state, cmd, out validation);
        }
        public static SquadOrderResult PreviewOrder(BattleSimState state, SquadOrder order)
        {
            var result = ValidateOrder(state, order);
            if (result.Rejection != null) return result;
            result.Order = order.Clone();
            return result;
        }
        public static SquadOrderResult ConfirmOrder(BattleSimState state, Ledger ledger, SquadOrder order)
        {
            var preview = PreviewOrder(state, order);
            if (!preview.Accepted && !preview.Conflict) return preview;
            if (state.AcceptedOrders.TryGetValue(order.CommandId.Value, out var existing))
            {
                if (OrderEquals(existing, order)) return new SquadOrderResult { Accepted = true, Order = existing.Clone() };
                return new SquadOrderResult { Conflict = true, Rejection = new ContractRejection { Reason = ContractRejectReason.CommandConflict, Detail = "commandId payload conflict" } };
            }
            var snapshot = state.Clone();
            var ledgerCount = ledger.Events.Count;
            var commands = new List<BattleTickCommand>();
            for (var i = 0; i < order.ActorIds.Length; i++)
            {
                var actor = FindUnit(snapshot, new UnitId(order.ActorIds[i]));
                if (actor == null && FindHero(snapshot, order.ActorIds[i]) != null) continue;
                if (actor == null) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.UnknownActor } };
                commands.Add(new BattleTickCommand { Id = new CommandId(order.CommandId.Value + ":" + i), Seq = i, At = new Tick(state.Tick), Kind = order.Kind == BattleOrderKind.Move ? BattleTickCommandKind.Move : BattleTickCommandKind.Attack, ActorUnitId = actor.Id, Target = order.Destination, TargetUnitId = order.TargetUnitId });
            }
            for (var i = 0; i < commands.Count; i++)
            {
                var rejection = Submit(snapshot, ledger, commands[i]);
                if (rejection != null) return new SquadOrderResult { Rejection = (ContractRejection)rejection };
            }
            state.Pending = snapshot.Pending;
            while (ledger.Events.Count > ledgerCount) ledger.Events.RemoveAt(ledger.Events.Count - 1);
            state.Pending.Sort((a,b) => a.At.Value != b.At.Value ? a.At.Value.CompareTo(b.At.Value) : a.Seq.CompareTo(b.Seq));
            state.AcceptedOrders[order.CommandId.Value] = order.Clone();
            return new SquadOrderResult { Accepted = true, Order = order.Clone() };
        }
        public static SquadOrderResult StopOrder(BattleSimState state, Ledger ledger, CommandId commandId, string[] actorIds)
        {
            var stop = new SquadOrder { CommandId = commandId, ActorIds = actorIds, Kind = BattleOrderKind.None };
            for (var i = 0; i < actorIds.Length; i++)
            {
                var actor = FindUnit(state, new UnitId(actorIds[i]));
                if (!IsLivingPlayer(actor)) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.UnknownActor } };
                ClearOrder(actor);
            }
            return new SquadOrderResult { Accepted = true, Order = stop };
        }
        public static bool CancelOrder(BattleSimState state, CommandId commandId)
        {
            if (state == null) return false;
            var removed = state.AcceptedOrders.Remove(commandId.Value);
            for (var i = state.Pending.Count - 1; i >= 0; i--)
                if (state.Pending[i].Id.Value.StartsWith(commandId.Value + ":", StringComparison.Ordinal)) { state.Pending.RemoveAt(i); removed = true; }
            return removed;
        }
        static SquadOrderResult ValidateOrder(BattleSimState state, SquadOrder order)
        {
            if (state == null || order == null || order.ActorIds == null || order.ActorIds.Length == 0 || order.Kind == BattleOrderKind.None)
                return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.MalformedCommand } };
            if (state.Outcome != ContractOutcome.Ongoing) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.BattleEnded } };
            var seen = new HashSet<string>(StringComparer.Ordinal);
            for (var i = 0; i < order.ActorIds.Length; i++)
            {
                if (!seen.Add(order.ActorIds[i])) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.MalformedCommand } };
                var actor = FindUnit(state, new UnitId(order.ActorIds[i]));
                if (actor == null && FindHero(state, order.ActorIds[i]) == null) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.UnknownActor } };
                if (actor != null && !IsLivingPlayer(actor)) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.UnknownActor } };
                if (order.Kind == BattleOrderKind.Move && !state.Arena.InBounds(order.Destination)) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.CardDestinationOutOfBounds } };
                var target = FindUnit(state, order.TargetUnitId);
                if (order.Kind == BattleOrderKind.Attack && (target == null || target.Side != 1 || target.State != "Active" || target.Hp <= 0)) return new SquadOrderResult { Rejection = new ContractRejection { Reason = ContractRejectReason.UnknownActor } };
            }
            return new SquadOrderResult { Accepted = true };
        }
        static HeroState FindHero(BattleSimState state, string id)
        {
            if (state.Heroes == null) return null;
            for (var i = 0; i < state.Heroes.Length; i++) if (state.Heroes[i].Id.Value == id) return state.Heroes[i];
            return null;
        }
        static bool OrderEquals(SquadOrder a, SquadOrder b)
        {
            if (a.Kind != b.Kind || !a.Destination.Equals(b.Destination) || !a.TargetUnitId.Equals(b.TargetUnitId) || a.ActorIds.Length != b.ActorIds.Length) return false;
            for (var i = 0; i < a.ActorIds.Length; i++) if (a.ActorIds[i] != b.ActorIds[i]) return false;
            return true;
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
            ReinforcementRules.Resolve(state); if (state.Outcome != ContractOutcome.Ongoing) { ClearAllOrders(state); TickCards(state); ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++; return; }
            var previousElapsed = state.ElapsedSeconds - fixedDeltaTime;
            var enemyDecisionInterval = 0.5f;
            var enemyDecisionDue = (int)Math.Floor(state.ElapsedSeconds / enemyDecisionInterval) > (int)Math.Floor(previousElapsed / enemyDecisionInterval);
            if (enemyDecisionDue) ResolveEnemyIntent(state);
            IntentPlanner.Resolve(state); ResolveIndividualCombat(state, fixedDeltaTime); MoraleRules.Resolve(state); state.Sides[1].RetreatCovered = OutcomeRules.RetreatCovered(state);
            if (state.Sides[1].Morale <= BattleRules.MoraleLock && HasLivingSide(state, 0)) state.Outcome = ContractOutcome.PlayerRout;
            else OutcomeRules.Resolve(state); ClearInvalidOrders(state);
            TickCards(state);
            ledger.Events.Add(new TypedEvent { Id=new EventId("btick-"+state.Tick.ToString(CultureInfo.InvariantCulture)), At=new Tick(state.Tick), SummaryHash=state.Fingerprint() }); state.Tick++;
            state.PublishFrame();
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

        static void ResolveIndividualCombat(BattleSimState state, float fixedDeltaTime)
        {
            var damage = new int[state.Units.Length];
            var attackers = new List<UnitState>(state.Units);
            attackers.Sort((a, b) => string.CompareOrdinal(a.Id.Value, b.Id.Value));
            for (var i = 0; i < attackers.Count; i++)
            {
                var attacker = attackers[i];
                if (attacker.CooldownTicksLeft > 0)
                    attacker.CooldownTicksLeft = Math.Max(0, attacker.CooldownTicksLeft - Math.Max(1, (int)Math.Round(fixedDeltaTime * BattleRules.TicksPerSecond)));
                if (attacker.State != "Active" || attacker.Hp <= 0 || attacker.CooldownTicksLeft > 0) continue;
                var targets = new List<int>();
                for (var j = 0; j < state.Units.Length; j++) targets.Add(j);
                targets.Sort((a, b) =>
                {
                    var left = state.Units[a]; var right = state.Units[b];
                    var distance = attacker.Cell.ManhattanTo(left.Cell).CompareTo(attacker.Cell.ManhattanTo(right.Cell));
                    return distance != 0 ? distance : string.CompareOrdinal(left.Id.Value, right.Id.Value);
                });
                for (var j = 0; j < targets.Count; j++)
                {
                    var target = state.Units[targets[j]];
                    if (target.Side == attacker.Side || target.State != "Active" || target.Hp <= 0) continue;
                    var distance = attacker.Cell.ManhattanTo(target.Cell);
                    if (distance < attacker.RangeMin || distance > attacker.RangeMax || !HasLineOfSight(state, attacker.Cell, target.Cell)) continue;
                    if (attacker.OrderKind == BattleOrderKind.Attack && !attacker.OrderTargetUnitId.Equals(target.Id)) continue;
                    state.Rng.Consume(RngPurpose.Battle);
                    damage[targets[j]] += attacker.Power;
                    attacker.CooldownTicksLeft = attacker.AttackCooldownTicks;
                    break;
                }
            }
            for (var i = 0; i < state.Units.Length; i++)
            {
                if (damage[i] <= 0) continue;
                var unit = state.Units[i];
                unit.Hp = Math.Max(0, unit.Hp - damage[i]);
                unit.SurvivorCount = Math.Min(unit.SurvivorCount, unit.Hp <= 0 ? 0 : (int)((4L * unit.Hp + unit.MaxHp - 1L) / unit.MaxHp));
                if (unit.Hp == 0) unit.State = "Down";
            }
        }

        static void ResolveEnemyIntent(BattleSimState state)
        {
            var enemies = new List<UnitState>(state.Units);
            enemies.Sort((a, b) => string.CompareOrdinal(a.Id.Value, b.Id.Value));
            for (var i = 0; i < enemies.Count; i++)
            {
                var enemy = enemies[i];
                if (enemy.Side != 1 || enemy.State != "Active" || enemy.Hp <= 0) continue;
                var target = FindUnit(state, enemy.OrderTargetUnitId);
                if (!IsLivingPlayer(target)) target = NearestLivingPlayer(state, enemy);
                if (!IsLivingPlayer(target)) target = BattlefieldTargetAnchor(state, enemy);
                if (target == null) continue;
                enemy.OrderKind = BattleOrderKind.Attack;
                enemy.OrderTargetUnitId = target.Id;
            }
        }

        static UnitState NearestLivingPlayer(BattleSimState state, UnitState actor)
        {
            UnitState best = null; var distance = int.MaxValue;
            for (var i = 0; i < state.Units.Length; i++)
            {
                var candidate = state.Units[i]; if (!IsLivingPlayer(candidate)) continue;
                var d = actor.Cell.ManhattanTo(candidate.Cell);
                if (d < distance || d == distance && string.CompareOrdinal(candidate.Id.Value, best == null ? string.Empty : best.Id.Value) < 0) { best = candidate; distance = d; }
            }
            return best;
        }

        static UnitState BattlefieldTargetAnchor(BattleSimState state, UnitState actor)
        {
            var best = NearestLivingPlayer(state, actor);
            return best;
        }

        static bool HasLivingSide(BattleSimState state, int side)
        {
            for (var i = 0; i < state.Units.Length; i++) if (state.Units[i].Side == side && state.Units[i].State != "Down" && state.Units[i].Hp > 0) return true;
            return false;
        }

        static bool HasLineOfSight(BattleSimState state, GridCoord from, GridCoord to)
        {
            if (state.Terrain == null) return true;
            var dx = Math.Sign(to.X - from.X); var dy = Math.Sign(to.Y - from.Y);
            var x = from.X + dx; var y = from.Y + dy;
            while (x != to.X || y != to.Y)
            {
                if (state.Terrain.IsWater(x, y)) return false;
                x += dx; y += dy;
            }
            return true;
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
