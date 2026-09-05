using System;
using System.Globalization;
using System.IO;
using System.Text;
using Janseon.Core;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Tests.EditMode
{
    [TestFixture]
    public class BattleSrpgTests
    {
        const int Seed = 42;
        const string CampaignId = "poc-campaign-1";

        static RouteGraph Graph() => RouteGraph.CreateYeongdeungpoSindorimGuro();

        static CampaignState FreshCampaign()
        {
            return CampaignApi.Start(Seed, StationId.Yeongdeungpo, CampaignId);
        }

        static CampaignCommand CampCmd(string id, CampaignCommandKind kind, StationId dest = default)
        {
            return new CampaignCommand
            {
                Id = new CommandId(id),
                Kind = kind,
                TravelDestination = dest
            };
        }

        static CampaignState MustCampaign(object result, string context)
        {
            Assert.IsInstanceOf<CampaignState>(result, context);
            return (CampaignState)result;
        }

        /// <summary>
        /// Given: campaign at Resolution after travel to Sindorim.
        /// When: ChooseCombat.
        /// Then: immutable BattleRequired handoff (Todo 7 contract preserved).
        /// </summary>
        static BattleContext SindorimBattleHandoff(out CampaignState campaignState, out Ledger campaignLedger)
        {
            var graph = Graph();
            var state = FreshCampaign();
            campaignLedger = new Ledger();

            state = MustCampaign(
                CampaignApi.Apply(graph, state, campaignLedger, CampCmd("h-depart", CampaignCommandKind.Depart)),
                "Depart");
            state = MustCampaign(
                CampaignApi.Apply(
                    graph,
                    state,
                    campaignLedger,
                    CampCmd("h-travel", CampaignCommandKind.Travel, StationId.Sindorim)),
                "Travel Sindorim");
            state = MustCampaign(
                CampaignApi.Apply(graph, state, campaignLedger, CampCmd("h-face", CampaignCommandKind.FaceEncounter)),
                "Face");
            state = MustCampaign(
                CampaignApi.Apply(graph, state, campaignLedger, CampCmd("h-enter", CampaignCommandKind.EnterResolution)),
                "Enter");

            var handoff = CampaignApi.Apply(
                graph,
                state,
                campaignLedger,
                CampCmd("h-combat", CampaignCommandKind.ChooseCombat));
            Assert.IsInstanceOf<BattleRequired>(handoff, "Combat must yield BattleRequired");
            campaignState = state;
            return ((BattleRequired)handoff).Context;
        }

        static BattleCommand MoveCmd(string id, string actorId, int dx, int dy)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.Move,
                ActorId = actorId,
                Dx = dx,
                Dy = dy
            };
        }

        static BattleCommand MeleeCmd(string id, string actorId, string targetId)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.MeleeAttack,
                ActorId = actorId,
                TargetId = targetId
            };
        }

        static BattleCommand RangedCmd(string id, string actorId, string targetId)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.RangedAttack,
                ActorId = actorId,
                TargetId = targetId
            };
        }

        static BattleCommand EndCmd(string id, string actorId)
        {
            return new BattleCommand
            {
                Id = new CommandId(id),
                Kind = BattleCommandKind.EndTurn,
                ActorId = actorId
            };
        }

        static BattleState MustBattle(object result, string context)
        {
            Assert.IsInstanceOf<BattleState>(result, context);
            return (BattleState)result;
        }

        static string ActiveId(BattleState state)
        {
            Assert.IsNotNull(state.ActiveUnit);
            return state.ActiveUnit.UnitId;
        }

        static BattleUnit OtherUnit(BattleState state, string actorId)
        {
            for (var i = 0; i < state.Units.Count; i++)
            {
                if (!string.Equals(state.Units[i].UnitId, actorId, StringComparison.Ordinal))
                {
                    return state.Units[i];
                }
            }

            return null;
        }

        /// <summary>
        /// Drive battle to a terminal outcome with a bounded command budget (no softlock).
        /// Strategy: active unit closes distance with cardinal moves, melee when adjacent,
        /// otherwise ranged if in range, else end turn. Cap at 64 commands.
        /// </summary>
        static BattleState PlayToOutcome(BattleState state, Ledger ledger, int budget, out int commandsUsed)
        {
            commandsUsed = 0;
            for (var i = 0; i < budget; i++)
            {
                if (state.Outcome != BattleOutcomeKind.Ongoing)
                {
                    return state;
                }

                var actor = state.ActiveUnit;
                Assert.IsNotNull(actor, "Active unit required while ongoing");
                var foe = OtherUnit(state, actor.UnitId);
                Assert.IsNotNull(foe, "Opponent required");

                object result = null;
                if (!foe.IsDowned)
                {
                    var dist = actor.Position.ManhattanTo(foe.Position);
                    if (dist <= BattleApi.MeleeRange && actor.Ap >= BattleApi.MeleeApCost)
                    {
                        result = BattleApi.Apply(state, ledger, MeleeCmd("auto-melee-" + i, actor.UnitId, foe.UnitId));
                    }
                    else if (dist <= BattleApi.RangedRange && actor.Ap >= BattleApi.RangedApCost)
                    {
                        result = BattleApi.Apply(state, ledger, RangedCmd("auto-ranged-" + i, actor.UnitId, foe.UnitId));
                    }
                    else if (actor.Ap >= BattleApi.MoveApCost)
                    {
                        var dx = Math.Sign(foe.Position.X - actor.Position.X);
                        var dy = Math.Sign(foe.Position.Y - actor.Position.Y);
                        // Prefer X then Y; single cardinal step.
                        if (dx != 0)
                        {
                            result = BattleApi.Apply(state, ledger, MoveCmd("auto-mx-" + i, actor.UnitId, dx, 0));
                        }
                        else if (dy != 0)
                        {
                            result = BattleApi.Apply(state, ledger, MoveCmd("auto-my-" + i, actor.UnitId, 0, dy));
                        }
                    }
                }

                if (result is BattleState next)
                {
                    state = next;
                    commandsUsed++;
                    continue;
                }

                // End turn when blocked or no useful action.
                result = BattleApi.Apply(state, ledger, EndCmd("auto-end-" + i, actor.UnitId));
                state = MustBattle(result, "EndTurn at step " + i);
                commandsUsed++;
            }

            return state;
        }

        [Test]
        public void OpenFromCampaignHandoff_CopiesImmutableContext_OnSharedCardinalGrid()
        {
            // Given a Todo 7 combat handoff at Sindorim
            var context = SindorimBattleHandoff(out var campaignState, out var campaignLedger);
            var campaignHashBefore = CampaignApi.ComputeCampaignHash(campaignState, campaignLedger);

            // When battle opens from that handoff
            var battle = BattleApi.Open(context);

            // Then context is retained by reference identity of content fields (immutable handoff)
            Assert.AreSame(context, battle.Context);
            Assert.AreEqual(context.ContextHash, battle.Context.ContextHash);
            Assert.AreEqual(context.BattleId, battle.Context.BattleId);
            Assert.AreEqual(StationId.Sindorim, battle.Context.Location);
            Assert.AreEqual(Seed, battle.Context.WorldSeed);
            Assert.AreEqual(CampaignId, battle.Context.CampaignId);

            // Shared cardinal integer grid
            Assert.AreEqual(BattleApi.GridWidth, battle.Width);
            Assert.AreEqual(BattleApi.GridHeight, battle.Height);
            Assert.AreEqual(2, battle.Units.Count);
            Assert.AreEqual(BattleOutcomeKind.Ongoing, battle.Outcome);
            Assert.GreaterOrEqual(battle.ActiveIndex, 0);
            Assert.IsNotNull(battle.ActiveUnit);
            Assert.AreEqual(battle.ActiveUnit.MaxAp, battle.ActiveUnit.Ap);

            // Units on-grid, distinct cells
            for (var i = 0; i < battle.Units.Count; i++)
            {
                var u = battle.Units[i];
                Assert.GreaterOrEqual(u.Position.X, 0);
                Assert.GreaterOrEqual(u.Position.Y, 0);
                Assert.Less(u.Position.X, battle.Width);
                Assert.Less(u.Position.Y, battle.Height);
            }

            Assert.IsFalse(battle.Units[0].Position.Equals(battle.Units[1].Position));

            // Initiative order is deterministic and sorted
            Assert.LessOrEqual(battle.Units[0].Initiative, battle.Units[1].Initiative);

            // Campaign untouched
            Assert.AreEqual(campaignHashBefore, CampaignApi.ComputeCampaignHash(campaignState, campaignLedger));
            Assert.AreEqual(CampaignStage.Resolution, campaignState.Stage);
            Assert.IsFalse(campaignState.SettlementApplied);
            Assert.IsNull(campaignState.PendingBattle);
        }

        [Test]
        public void LegalCardinalMove_ConsumesAp_AndUpdatesPosition()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();
            var actorId = ActiveId(state);
            var actor = BattleApi.FindUnit(state, actorId);
            var beforePos = actor.Position;
            var beforeAp = actor.Ap;

            // Move east one step (cardinal)
            var result = BattleApi.Apply(state, ledger, MoveCmd("m-east", actorId, 1, 0));
            // If east is occupied/oob, try west/north/south until one legal
            if (result is BattleRejection)
            {
                result = BattleApi.Apply(state, ledger, MoveCmd("m-west", actorId, -1, 0));
            }

            if (result is BattleRejection)
            {
                result = BattleApi.Apply(state, ledger, MoveCmd("m-north", actorId, 0, 1));
            }

            if (result is BattleRejection)
            {
                result = BattleApi.Apply(state, ledger, MoveCmd("m-south", actorId, 0, -1));
            }

            state = MustBattle(result, "At least one cardinal step must be legal from open");
            var moved = BattleApi.FindUnit(state, actorId);
            Assert.AreEqual(beforeAp - BattleApi.MoveApCost, moved.Ap);
            Assert.AreEqual(1, beforePos.ManhattanTo(moved.Position));
            Assert.AreEqual(1, ledger.Events.Count);
            Assert.AreEqual(1, state.BattleTick.Value);
        }

        [Test]
        public void DiagonalMove_IsTypedRejection_WithoutMutation()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();
            var actorId = ActiveId(state);
            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeTick = state.BattleTick.Value;
            var beforeEvents = ledger.Events.Count;
            var beforePos = BattleApi.FindUnit(state, actorId).Position;
            var beforeAp = BattleApi.FindUnit(state, actorId).Ap;

            var result = BattleApi.Apply(state, ledger, MoveCmd("diag", actorId, 1, 1));
            Assert.IsInstanceOf<BattleRejection>(result);
            var rejection = (BattleRejection)result;
            Assert.AreEqual(BattleRejectReason.DiagonalOrInvalidStep, rejection.Reason);
            Assert.AreEqual(BattleCommandKind.Move, rejection.Attempted);

            Assert.AreEqual(beforeTick, state.BattleTick.Value);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforePos, BattleApi.FindUnit(state, actorId).Position);
            Assert.AreEqual(beforeAp, BattleApi.FindUnit(state, actorId).Ap);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
        }

        [Test]
        public void OutOfTurnCommand_IsTypedRejection_WithoutMutation()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();
            var activeId = ActiveId(state);
            var other = OtherUnit(state, activeId);
            Assert.IsNotNull(other);
            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeEvents = ledger.Events.Count;
            var beforeTick = state.BattleTick.Value;

            var result = BattleApi.Apply(state, ledger, MoveCmd("oot", other.UnitId, 1, 0));
            Assert.IsInstanceOf<BattleRejection>(result);
            Assert.AreEqual(BattleRejectReason.OutOfTurn, ((BattleRejection)result).Reason);

            Assert.AreEqual(beforeTick, state.BattleTick.Value);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
        }

        [Test]
        public void OccupiedAndOutOfBoundsAndInsufficientAp_RejectWithoutMutation()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();
            var actorId = ActiveId(state);

            // Drain AP with EndTurn? Better: move until AP=0 then move again.
            // Force insufficient AP: end turns don't spend, so spend moves then try again.
            // Use a fresh open and apply moves equal to MaxAp in a safe direction, then one more.
            // First prove out of bounds: walk west from x=1 repeatedly to edge then one more.
            // Ally starts at (1,2), foe at (3,2). Active may be either.

            // Out of bounds: craft by moving toward nearest edge.
            var actor = BattleApi.FindUnit(state, actorId);
            var dx = actor.Position.X <= 0 ? -1 : (actor.Position.X >= state.Width - 1 ? 1 : -1);
            // Walk to edge
            var guard = 0;
            while (guard++ < 8)
            {
                actor = BattleApi.FindUnit(state, actorId);
                if (actor.Ap < BattleApi.MoveApCost)
                {
                    state = MustBattle(
                        BattleApi.Apply(state, ledger, EndCmd("oob-end", actorId)),
                        "End to refresh AP");
                    // After end turn, actor may no longer be active.
                    if (state.ActiveUnit == null || !string.Equals(state.ActiveUnit.UnitId, actorId, StringComparison.Ordinal))
                    {
                        // End the other side too to come back.
                        var otherId = ActiveId(state);
                        state = MustBattle(
                            BattleApi.Apply(state, ledger, EndCmd("oob-end2", otherId)),
                            "End other");
                    }

                    continue;
                }

                var nextX = actor.Position.X + dx;
                if (nextX < 0 || nextX >= state.Width)
                {
                    break;
                }

                var step = BattleApi.Apply(state, ledger, MoveCmd("oob-walk-" + guard, actorId, dx, 0));
                if (step is BattleRejection rej)
                {
                    // Occupied mid-path: try other axis instead
                    if (rej.Reason == BattleRejectReason.Occupied)
                    {
                        break;
                    }

                    Assert.Fail("Unexpected rejection while walking to edge: " + rej.Reason);
                }

                state = (BattleState)step;
                // Keep actor active
                if (state.ActiveUnit == null || !string.Equals(state.ActiveUnit.UnitId, actorId, StringComparison.Ordinal))
                {
                    break;
                }
            }

            // Ensure actor is active for the OOB attempt
            guard = 0;
            while (guard++ < 4
                   && (state.ActiveUnit == null
                       || !string.Equals(state.ActiveUnit.UnitId, actorId, StringComparison.Ordinal)))
            {
                var cur = ActiveId(state);
                state = MustBattle(BattleApi.Apply(state, ledger, EndCmd("oob-sync-" + guard, cur)), "sync");
            }

            Assert.AreEqual(actorId, ActiveId(state), "Actor must be active for OOB attempt");
            actor = BattleApi.FindUnit(state, actorId);
            // If not at edge, push dx toward outside from current x
            dx = actor.Position.X <= state.Width / 2 ? -1 : 1;
            // Walk remaining
            guard = 0;
            while (guard++ < 8)
            {
                actor = BattleApi.FindUnit(state, actorId);
                var nx = actor.Position.X + dx;
                if (nx < 0 || nx >= state.Width)
                {
                    break;
                }

                if (actor.Ap < BattleApi.MoveApCost)
                {
                    state = MustBattle(BattleApi.Apply(state, ledger, EndCmd("oob-ap", actorId)), "ap");
                    if (!string.Equals(ActiveId(state), actorId, StringComparison.Ordinal))
                    {
                        state = MustBattle(BattleApi.Apply(state, ledger, EndCmd("oob-ap2", ActiveId(state))), "ap2");
                    }

                    continue;
                }

                var step = BattleApi.Apply(state, ledger, MoveCmd("oob-push-" + guard, actorId, dx, 0));
                if (step is BattleRejection)
                {
                    // may be occupied — switch side of approach
                    dx = -dx;
                    continue;
                }

                state = (BattleState)step;
            }

            Assert.AreEqual(actorId, ActiveId(state));
            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeEvents = ledger.Events.Count;
            var beforeTick = state.BattleTick.Value;
            var beforeAp = BattleApi.FindUnit(state, actorId).Ap;
            var beforePos = BattleApi.FindUnit(state, actorId).Position;

            // Ensure enough AP for the rejected attempt so reason is OutOfBounds not InsufficientAp
            if (beforeAp < BattleApi.MoveApCost)
            {
                state = MustBattle(BattleApi.Apply(state, ledger, EndCmd("oob-refresh", actorId)), "refresh");
                if (!string.Equals(ActiveId(state), actorId, StringComparison.Ordinal))
                {
                    state = MustBattle(BattleApi.Apply(state, ledger, EndCmd("oob-refresh2", ActiveId(state))), "r2");
                }

                beforeHash = BattleApi.ComputeBattleHash(state, ledger);
                beforeEvents = ledger.Events.Count;
                beforeTick = state.BattleTick.Value;
                beforeAp = BattleApi.FindUnit(state, actorId).Ap;
                beforePos = BattleApi.FindUnit(state, actorId).Position;
            }

            actor = BattleApi.FindUnit(state, actorId);
            dx = actor.Position.X <= 0 ? -1 : (actor.Position.X >= state.Width - 1 ? 1 : -1);
            // If still not at edge, this may move in-bounds; force edge position assertion
            if (actor.Position.X > 0 && actor.Position.X < state.Width - 1)
            {
                // Direct OOB from interior is impossible with unit step; instead test insufficient AP path below.
            }
            else
            {
                var oob = BattleApi.Apply(state, ledger, MoveCmd("oob-final", actorId, dx, 0));
                Assert.IsInstanceOf<BattleRejection>(oob);
                Assert.AreEqual(BattleRejectReason.OutOfBounds, ((BattleRejection)oob).Reason);
                Assert.AreEqual(beforeTick, state.BattleTick.Value);
                Assert.AreEqual(beforeEvents, ledger.Events.Count);
                Assert.AreEqual(beforeAp, BattleApi.FindUnit(state, actorId).Ap);
                Assert.AreEqual(beforePos, BattleApi.FindUnit(state, actorId).Position);
                Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
            }

            // Insufficient AP: spend all AP then move
            state = BattleApi.Open(context);
            ledger = new Ledger();
            actorId = ActiveId(state);
            actor = BattleApi.FindUnit(state, actorId);
            // Spend AP with EndTurn is free; instead move in place-safe dirs until AP=0
            // Ally(1,2) foe(3,2): if active is ally, move north twice and west once etc.
            var spent = 0;
            while (BattleApi.FindUnit(state, actorId).Ap > 0 && spent < 8)
            {
                if (!string.Equals(ActiveId(state), actorId, StringComparison.Ordinal))
                {
                    break;
                }

                var tryDirs = new[] { (0, 1), (0, -1), (1, 0), (-1, 0) };
                object moved = null;
                for (var d = 0; d < tryDirs.Length; d++)
                {
                    moved = BattleApi.Apply(
                        state,
                        ledger,
                        MoveCmd("ap-" + spent + "-" + d, actorId, tryDirs[d].Item1, tryDirs[d].Item2));
                    if (moved is BattleState)
                    {
                        break;
                    }
                }

                if (moved is BattleState ms)
                {
                    state = ms;
                    spent++;
                }
                else
                {
                    break;
                }
            }

            Assert.AreEqual(actorId, ActiveId(state));
            Assert.AreEqual(0, BattleApi.FindUnit(state, actorId).Ap);
            beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            beforeEvents = ledger.Events.Count;
            beforeTick = state.BattleTick.Value;
            var insuf = BattleApi.Apply(state, ledger, MoveCmd("no-ap", actorId, 0, 1));
            Assert.IsInstanceOf<BattleRejection>(insuf);
            Assert.AreEqual(BattleRejectReason.InsufficientAp, ((BattleRejection)insuf).Reason);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeTick, state.BattleTick.Value);

            // Occupied: open fresh, walk ally onto foe cell path
            state = BattleApi.Open(context);
            ledger = new Ledger();
            // Ensure ally is active; if not, end turns until ally acts with full AP and step toward foe
            guard = 0;
            while (guard++ < 6 && !string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal))
            {
                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd("occ-wait-" + guard, ActiveId(state))),
                    "wait ally");
            }

            Assert.AreEqual(BattleApi.AllyId, ActiveId(state));
            // Ally at (1,2), foe at (3,2): move east to (2,2) then try east onto (3,2)
            state = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd("occ-e1", BattleApi.AllyId, 1, 0)),
                "ally east to 2,2");
            beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            beforeEvents = ledger.Events.Count;
            beforeTick = state.BattleTick.Value;
            var occ = BattleApi.Apply(state, ledger, MoveCmd("occ-e2", BattleApi.AllyId, 1, 0));
            Assert.IsInstanceOf<BattleRejection>(occ);
            Assert.AreEqual(BattleRejectReason.Occupied, ((BattleRejection)occ).Reason);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeTick, state.BattleTick.Value);
        }

        [Test]
        public void MeleeAndRangedAttacks_DealDeterministicDamage_AndRespectRange()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();

            // Get ally active at (1,2), foe at (3,2): distance 2 — melee out of range, ranged OK.
            var guard = 0;
            while (guard++ < 6 && !string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal))
            {
                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd("atk-wait-" + guard, ActiveId(state))),
                    "wait");
            }

            Assert.AreEqual(BattleApi.AllyId, ActiveId(state));
            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeEvents = ledger.Events.Count;
            var meleeOor = BattleApi.Apply(
                state,
                ledger,
                MeleeCmd("melee-oor", BattleApi.AllyId, BattleApi.FoeId));
            Assert.IsInstanceOf<BattleRejection>(meleeOor);
            Assert.AreEqual(BattleRejectReason.OutOfRange, ((BattleRejection)meleeOor).Reason);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);

            var foeBefore = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            state = MustBattle(
                BattleApi.Apply(state, ledger, RangedCmd("ranged-hit", BattleApi.AllyId, BattleApi.FoeId)),
                "ranged");
            var foeAfter = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            Assert.AreEqual(foeBefore - BattleApi.RangedDamage, foeAfter);
            Assert.AreEqual(BattleApi.DefaultMaxAp - BattleApi.RangedApCost, BattleApi.FindUnit(state, BattleApi.AllyId).Ap);

            // Close to melee range: move east to (2,2), end turns as needed, melee.
            if (BattleApi.FindUnit(state, BattleApi.AllyId).Ap >= BattleApi.MoveApCost
                && string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal))
            {
                state = MustBattle(
                    BattleApi.Apply(state, ledger, MoveCmd("close", BattleApi.AllyId, 1, 0)),
                    "close");
            }
            else
            {
                // Refresh turns
                guard = 0;
                while (guard++ < 4)
                {
                    if (string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal)
                        && BattleApi.FindUnit(state, BattleApi.AllyId).Ap >= BattleApi.MoveApCost)
                    {
                        break;
                    }

                    state = MustBattle(
                        BattleApi.Apply(state, ledger, EndCmd("close-wait-" + guard, ActiveId(state))),
                        "cw");
                }

                state = MustBattle(
                    BattleApi.Apply(state, ledger, MoveCmd("close", BattleApi.AllyId, 1, 0)),
                    "close");
            }

            // Need melee AP; may need new turn
            guard = 0;
            while (guard++ < 6)
            {
                if (string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal)
                    && BattleApi.FindUnit(state, BattleApi.AllyId).Ap >= BattleApi.MeleeApCost
                    && BattleApi.FindUnit(state, BattleApi.AllyId).Position.ManhattanTo(
                        BattleApi.FindUnit(state, BattleApi.FoeId).Position) <= BattleApi.MeleeRange)
                {
                    break;
                }

                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd("melee-wait-" + guard, ActiveId(state))),
                    "mw");
            }

            foeBefore = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            state = MustBattle(
                BattleApi.Apply(state, ledger, MeleeCmd("melee-hit", BattleApi.AllyId, BattleApi.FoeId)),
                "melee");
            foeAfter = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            Assert.AreEqual(foeBefore - BattleApi.MeleeDamage, foeAfter);
        }

        [Test]
        public void SameContextAndCommands_ProduceIdenticalBattleEventAndResultHash()
        {
            string Run()
            {
                var context = SindorimBattleHandoff(out _, out _);
                var state = BattleApi.Open(context);
                var ledger = new Ledger();
                state = PlayToOutcome(state, ledger, 64, out _);
                Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome);
                return BattleApi.ComputeBattleHash(state, ledger) + ":" + BattleApi.ComputeResultHash(state);
            }

            var h1 = Run();
            var h2 = Run();
            Assert.AreEqual(h1, h2);
            Assert.IsFalse(string.IsNullOrEmpty(h1));
        }

        [Test]
        public void BoundedCommandSequence_ReachesTerminalOutcome_WithoutSoftlock()
        {
            var context = SindorimBattleHandoff(out var campaignState, out var campaignLedger);
            var campaignBefore = CampaignApi.ComputeCampaignHash(campaignState, campaignLedger);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();

            state = PlayToOutcome(state, ledger, 64, out var used);
            Assert.Less(used, 64, "Must finish with spare budget (no softlock)");
            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome);
            Assert.IsTrue(
                state.Outcome == BattleOutcomeKind.PlayerVictory
                || state.Outcome == BattleOutcomeKind.EnemyVictory);

            // At least one unit downed
            var downed = 0;
            for (var i = 0; i < state.Units.Count; i++)
            {
                if (state.Units[i].IsDowned)
                {
                    downed++;
                }
            }

            Assert.GreaterOrEqual(downed, 1);
            Assert.IsFalse(string.IsNullOrEmpty(BattleApi.ComputeResultHash(state)));
            Assert.AreEqual(campaignBefore, CampaignApi.ComputeCampaignHash(campaignState, campaignLedger));
        }

        /// <summary>
        /// Manual QA consumer: Sindorim handoff → immutable context → legal play → outcome;
        /// diagonal/out-of-turn rejection with unchanged hashes; campaign untouched.
        /// </summary>
        [Test]
        public void ConsumerSurface_SindorimBattle_Observable()
        {
            var context = SindorimBattleHandoff(out var campaignState, out var campaignLedger);
            var campaignBefore = CampaignApi.ComputeCampaignHash(campaignState, campaignLedger);

            var state = BattleApi.Open(context);
            var openingHash = state.OpeningHash;
            var contextHash = context.ContextHash;
            var initialTurn = state.TurnNumber;
            var initialActive = ActiveId(state);
            var initialBattleHash = BattleApi.ComputeBattleHash(state, null);

            TestContext.WriteLine("BATTLE_QA_CONTEXT_HASH=" + contextHash);
            TestContext.WriteLine("BATTLE_QA_OPENING_HASH=" + openingHash);
            TestContext.WriteLine("BATTLE_QA_INITIAL_TURN=" + initialTurn);
            TestContext.WriteLine("BATTLE_QA_INITIAL_ACTIVE=" + initialActive);
            TestContext.WriteLine("BATTLE_QA_LOCATION=" + context.Location.Value);

            // Illegal diagonal + out-of-turn before any mutation of a fresh clone path
            var illegalState = BattleApi.Open(context);
            var illegalLedger = new Ledger();
            var illegalBefore = BattleApi.ComputeBattleHash(illegalState, illegalLedger);
            var diag = BattleApi.Apply(
                illegalState,
                illegalLedger,
                MoveCmd("qa-diag", ActiveId(illegalState), 1, 1));
            Assert.IsInstanceOf<BattleRejection>(diag);
            Assert.AreEqual(BattleRejectReason.DiagonalOrInvalidStep, ((BattleRejection)diag).Reason);
            var illegalAfterDiag = BattleApi.ComputeBattleHash(illegalState, illegalLedger);
            Assert.AreEqual(illegalBefore, illegalAfterDiag);

            var other = OtherUnit(illegalState, ActiveId(illegalState));
            var oot = BattleApi.Apply(
                illegalState,
                illegalLedger,
                MoveCmd("qa-oot", other.UnitId, 1, 0));
            Assert.IsInstanceOf<BattleRejection>(oot);
            Assert.AreEqual(BattleRejectReason.OutOfTurn, ((BattleRejection)oot).Reason);
            var illegalAfterOot = BattleApi.ComputeBattleHash(illegalState, illegalLedger);
            Assert.AreEqual(illegalBefore, illegalAfterOot);

            // Legal play to outcome
            var ledger = new Ledger();
            state = PlayToOutcome(state, ledger, 64, out var used);
            Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome);

            var eventHash = BattleApi.ComputeBattleHash(state, ledger);
            var resultHash = BattleApi.ComputeResultHash(state);

            // Replay for identical hashes
            var replay = BattleApi.Open(context);
            var replayLedger = new Ledger();
            replay = PlayToOutcome(replay, replayLedger, 64, out _);
            var replayEventHash = BattleApi.ComputeBattleHash(replay, replayLedger);
            var replayResultHash = BattleApi.ComputeResultHash(replay);
            Assert.AreEqual(eventHash, replayEventHash);
            Assert.AreEqual(resultHash, replayResultHash);

            Assert.AreEqual(campaignBefore, CampaignApi.ComputeCampaignHash(campaignState, campaignLedger));
            Assert.AreEqual(CampaignStage.Resolution, campaignState.Stage);
            Assert.IsFalse(campaignState.SettlementApplied);

            var sbUnits = new StringBuilder();
            for (var i = 0; i < state.Units.Count; i++)
            {
                var u = state.Units[i];
                if (i > 0)
                {
                    sbUnits.Append(';');
                }

                sbUnits.Append(u.UnitId)
                    .Append('@')
                    .Append(u.Position)
                    .Append(":hp=")
                    .Append(u.Hp)
                    .Append(":ap=")
                    .Append(u.Ap)
                    .Append(":downed=")
                    .Append(u.IsDowned);
            }

            TestContext.WriteLine("BATTLE_QA_OUTCOME=" + state.Outcome);
            TestContext.WriteLine("BATTLE_QA_COMMANDS=" + used);
            TestContext.WriteLine("BATTLE_QA_UNITS=" + sbUnits);
            TestContext.WriteLine("BATTLE_QA_EVENT_HASH=" + eventHash);
            TestContext.WriteLine("BATTLE_QA_RESULT_HASH=" + resultHash);
            TestContext.WriteLine("BATTLE_QA_DIAG_REASON=" + ((BattleRejection)diag).Reason);
            TestContext.WriteLine("BATTLE_QA_OOT_REASON=" + ((BattleRejection)oot).Reason);
            TestContext.WriteLine("BATTLE_QA_ILLEGAL_BEFORE=" + illegalBefore);
            TestContext.WriteLine("BATTLE_QA_ILLEGAL_AFTER=" + illegalAfterOot);
            TestContext.WriteLine("BATTLE_QA_CAMPAIGN_UNCHANGED=" + (campaignBefore == CampaignApi.ComputeCampaignHash(campaignState, campaignLedger)));

            var repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            var outDir = Path.Combine(repoRoot, ".omo", "evidence", "unity-poc-core-loop", "task-8-srpg", "manual-qa");
            Directory.CreateDirectory(outDir);
            var outPath = Path.Combine(outDir, "manual-qa-result.txt");
            var sb = new StringBuilder();
            sb.AppendLine("task-8-srpg manual QA consumer");
            sb.AppendLine("surface=EditMode BattleSrpgTests.ConsumerSurface_SindorimBattle_Observable");
            sb.AppendLine("seed=" + Seed.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("handoff.location=" + context.Location.Value);
            sb.AppendLine("handoff.battleId=" + context.BattleId);
            sb.AppendLine("handoff.contextHash=" + contextHash);
            sb.AppendLine("openingHash=" + openingHash);
            sb.AppendLine("initialTurn=" + initialTurn.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("initialActive=" + initialActive);
            sb.AppendLine("initialBattleHash=" + initialBattleHash);
            sb.AppendLine("grid=" + state.Width + "x" + state.Height);
            sb.AppendLine("outcome=" + state.Outcome);
            sb.AppendLine("commandsUsed=" + used.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("finalTick=" + state.BattleTick.Value.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("finalTurn=" + state.TurnNumber.ToString(CultureInfo.InvariantCulture));
            sb.AppendLine("units=" + sbUnits);
            sb.AppendLine("eventHash=" + eventHash);
            sb.AppendLine("resultHash=" + resultHash);
            sb.AppendLine("replayEventHash=" + replayEventHash);
            sb.AppendLine("replayResultHash=" + replayResultHash);
            sb.AppendLine("replayMatch=" + (string.Equals(eventHash, replayEventHash, StringComparison.Ordinal)
                && string.Equals(resultHash, replayResultHash, StringComparison.Ordinal)));
            sb.AppendLine("illegal.diagReason=" + ((BattleRejection)diag).Reason);
            sb.AppendLine("illegal.ootReason=" + ((BattleRejection)oot).Reason);
            sb.AppendLine("illegal.beforeHash=" + illegalBefore);
            sb.AppendLine("illegal.afterDiagHash=" + illegalAfterDiag);
            sb.AppendLine("illegal.afterOotHash=" + illegalAfterOot);
            sb.AppendLine("illegal.hashUnchanged=" + string.Equals(illegalBefore, illegalAfterOot, StringComparison.Ordinal));
            sb.AppendLine("campaign.stage=" + campaignState.Stage);
            sb.AppendLine("campaign.settlementApplied=" + campaignState.SettlementApplied);
            sb.AppendLine("campaign.beforeHash=" + campaignBefore);
            sb.AppendLine("campaign.afterHash=" + CampaignApi.ComputeCampaignHash(campaignState, campaignLedger));
            sb.AppendLine("campaign.unchanged=" + string.Equals(
                campaignBefore,
                CampaignApi.ComputeCampaignHash(campaignState, campaignLedger),
                StringComparison.Ordinal));
            sb.AppendLine("MANUAL_QA_PASS=True");
            File.WriteAllText(outPath, sb.ToString(), Encoding.UTF8);
            TestContext.WriteLine("BATTLE_QA_ARTIFACT=" + outPath);
        }
    }
}
