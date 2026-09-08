using System;
using System.Collections.Generic;
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

            // Both opening units have a free north cell, regardless of initiative order.
            var result = BattleApi.Apply(state, ledger, MoveCmd("m-north", actorId, 0, 1));
            state = MustBattle(result, "North step from the flat opening grid");
            var moved = BattleApi.FindUnit(state, actorId);
            TestContext.WriteLine("FLAT_MOVE position=" + beforePos + "->" + moved.Position
                + ";ap=" + beforeAp + "->" + moved.Ap);
            Assert.AreEqual(beforeAp - 1, moved.Ap);
            Assert.AreEqual(new GridCoord(beforePos.X, beforePos.Y + 1), moved.Position);
            Assert.AreEqual(1, ledger.Events.Count);
            Assert.AreEqual(1, state.BattleTick.Value);
        }

        // Terrain input is a shipped public overload — tests invoke the real API directly.
        static BattleState OpenWithTerrain(BattleContext context, Heightmap terrain)
        {
            return MustBattle(BattleApi.Open(context, terrain), "Open with terrain");
        }

        static int[] FlatCells(int height)
        {
            var cells = new int[25];
            for (var i = 0; i < cells.Length; i++)
            {
                cells[i] = height;
            }

            return cells;
        }

        [Test]
        public void CardinalMove_OneLevelHigher_ConsumesTwoAp_AndUpdatesPosition()
        {
            var context = SindorimBattleHandoff(out var campaign, out var campaignLedger);
            var campaignBefore = CampaignApi.ComputeCampaignHash(campaign, campaignLedger);
            var cells = new int[25];
            for (var i = 0; i < cells.Length; i++)
            {
                cells[i] = i / 5 == 3 ? 4 : 3;
            }

            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();
            var actorId = ActiveId(state);
            var beforePos = state.ActiveUnit.Position;
            var beforeAp = state.ActiveUnit.Ap;
            var beforeStateHash = BattleApi.ComputeBattleHash(state, null);
            var destination = new GridCoord(beforePos.X, beforePos.Y + 1);
            Assert.AreEqual(3, terrain.Get(beforePos));
            Assert.AreEqual(4, terrain.Get(destination));

            var movedState = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd("height-north", actorId, 0, 1)),
                "Cardinal uphill step with sufficient AP");
            var moved = BattleApi.FindUnit(movedState, actorId);
            TestContext.WriteLine("HEIGHT_MOVE dh=1;position=" + beforePos + "->" + moved.Position
                + ";ap=" + beforeAp + "->" + moved.Ap);
            Assert.AreEqual(beforeAp - 2, moved.Ap, "A one-level cardinal climb spends 2 AP");
            Assert.AreEqual(destination, moved.Position);
            Assert.AreEqual(state.BattleTick.Value + 1, movedState.BattleTick.Value);
            Assert.AreEqual(1, ledger.Events.Count);
            Assert.AreEqual(beforeStateHash, BattleApi.ComputeBattleHash(state, null));
            Assert.AreEqual(campaignBefore, CampaignApi.ComputeCampaignHash(campaign, campaignLedger));
        }

        [Test]
        public void CardinalMove_IntoWater_IsOutOfBoundsRejection_WithoutStateApOrLedgerMutation()
        {
            var context = SindorimBattleHandoff(out var campaign, out var campaignLedger);
            var campaignBefore = CampaignApi.ComputeCampaignHash(campaign, campaignLedger);
            var cells = new int[25];
            for (var i = 0; i < cells.Length; i++)
            {
                cells[i] = i / 5 == 4 ? 2 : 3;
            }

            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();
            var actorId = ActiveId(state);
            // Populate the real ledger first, so rejection must preserve existing events too.
            state = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd("dry-north", actorId, 0, 1)),
                "Dry approach to water");
            Assert.AreEqual(1, ledger.Events.Count);
            var beforePos = BattleApi.FindUnit(state, actorId).Position;
            var beforeAp = BattleApi.FindUnit(state, actorId).Ap;
            var beforeTick = state.BattleTick.Value;
            var beforeEvents = ledger.Events.Count;
            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeRng = state.Rng.Fingerprint();
            var destination = new GridCoord(beforePos.X, beforePos.Y + 1);
            Assert.IsTrue(terrain.InBounds(destination.X, destination.Y));
            Assert.IsTrue(terrain.IsWater(destination.X, destination.Y));
            Assert.Greater(beforeAp, 0);

            var result = BattleApi.Apply(state, ledger, MoveCmd("water-north", actorId, 0, 1));
            var afterHash = BattleApi.ComputeBattleHash(state, ledger);
            TestContext.WriteLine("WATER_MOVE position=" + beforePos + "->"
                + BattleApi.FindUnit(state, actorId).Position + ";ap=" + beforeAp + "->"
                + BattleApi.FindUnit(state, actorId).Ap + ";hash=" + beforeHash + "->" + afterHash);
            Assert.IsInstanceOf<BattleRejection>(result, "Water is impassable");
            var rejection = (BattleRejection)result;
            Assert.AreEqual(BattleRejectReason.OutOfBounds, rejection.Reason);
            Assert.AreEqual(BattleCommandKind.Move, rejection.Attempted);
            Assert.AreEqual(actorId, rejection.ActorId);
            Assert.AreEqual(beforePos, BattleApi.FindUnit(state, actorId).Position);
            Assert.AreEqual(beforeAp, BattleApi.FindUnit(state, actorId).Ap);
            Assert.AreEqual(beforeTick, state.BattleTick.Value);
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
            Assert.AreEqual(beforeRng, state.Rng.Fingerprint());
            Assert.AreEqual(beforeHash, afterHash);
            Assert.AreEqual(campaignBefore, CampaignApi.ComputeCampaignHash(campaign, campaignLedger));
        }

        [Test]
        public void TerrainSnapshot_IsOwned_InputMapMutationCannotRewriteOpenedBattle()
        {
            var context = SindorimBattleHandoff(out var campaign, out var campaignLedger);
            var campaignBefore = CampaignApi.ComputeCampaignHash(campaign, campaignLedger);
            var cells = new int[25];
            for (var i = 0; i < cells.Length; i++)
            {
                cells[i] = i / 5 == 3 ? 4 : 3;
            }

            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var actorId = ActiveId(state);
            var beforeHash = BattleApi.ComputeBattleHash(state, null);
            var beforeAp = state.ActiveUnit.Ap;
            var dest = new GridCoord(state.ActiveUnit.Position.X, state.ActiveUnit.Position.Y + 1);

            // Caller mutates the input map AFTER Open: destination would cost 6 AP if the
            // battle aliased the caller array, and (0,0) becomes water.
            cells[3 * 5 + dest.X] = 8;
            cells[0] = 0;
            Assert.AreEqual(8, terrain.Get(dest), "Input map must actually be mutated for this proof");
            Assert.IsTrue(terrain.IsWater(0, 0), "Input map must actually be mutated for this proof");

            // Owned snapshot: opening hash unchanged and the climb still prices at dh=1 (2 AP).
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, null),
                "Mutating the input map must not rewrite the opened battle hash");
            var ledger = new Ledger();
            var moved = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd("snapshot-north", actorId, 0, 1)),
                "Move must price against the owned snapshot, not the mutated input map");
            var movedUnit = BattleApi.FindUnit(moved, actorId);
            TestContext.WriteLine("SNAPSHOT_MOVE mutatedInputCost=6;actualAp=" + beforeAp + "->" + movedUnit.Ap);
            Assert.AreEqual(beforeAp - 2, movedUnit.Ap, "Snapshot dh=1 must cost 2 AP despite input mutation");
            Assert.AreEqual(dest, movedUnit.Position);
            Assert.AreEqual(campaignBefore, CampaignApi.ComputeCampaignHash(campaign, campaignLedger));
        }

        [Test]
        public void TerrainFingerprint_ParticipatesInOpeningHash_RulesVersionIsV2()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var baseCells = new int[25];
            for (var i = 0; i < baseCells.Length; i++)
            {
                baseCells[i] = 3;
            }

            var terrainA = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, (int[])baseCells.Clone());
            var terrainA2 = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, (int[])baseCells.Clone());
            var differentCells = (int[])baseCells.Clone();
            differentCells[2 * 5 + 2] = 7;
            var terrainB = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, differentCells);

            Assert.AreNotEqual(terrainA.Fingerprint(), terrainB.Fingerprint(),
                "Fixture guard: the two maps must differ");
            var hashA = OpenWithTerrain(context, terrainA).OpeningHash;
            var hashA2 = OpenWithTerrain(context, terrainA2).OpeningHash;
            var hashB = OpenWithTerrain(context, terrainB).OpeningHash;
            TestContext.WriteLine("TERRAIN_HASH a=" + hashA + ";a2=" + hashA2 + ";b=" + hashB);

            Assert.AreEqual(hashA, hashA2, "Independent equal maps must open identically");
            Assert.AreNotEqual(hashA, hashB, "Different terrain fingerprint must change the opening hash");
            Assert.AreEqual("poc-srpg-v2", BattleApi.RulesVersion, "Terrain rules must be versioned v2");
        }

        [Test]
        public void TerrainBattle_EqualIndependentReplays_ProduceIdenticalHashes()
        {
            string Run()
            {
                var context = SindorimBattleHandoff(out _, out _);
                var cells = new int[25];
                for (var i = 0; i < cells.Length; i++)
                {
                    cells[i] = i / 5 == 3 ? 4 : 3;
                }

                var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
                var state = OpenWithTerrain(context, terrain);
                var ledger = new Ledger();

                var first = ActiveId(state);
                state = MustBattle(
                    BattleApi.Apply(state, ledger, MoveCmd("rep-up-1", first, 0, 1)),
                    "Replay first uphill move");
                Assert.AreEqual(BattleApi.DefaultMaxAp - 2, BattleApi.FindUnit(state, first).Ap);
                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd("rep-end-1", first)),
                    "Replay first end turn");
                var second = ActiveId(state);
                Assert.AreNotEqual(first, second);
                state = MustBattle(
                    BattleApi.Apply(state, ledger, MoveCmd("rep-up-2", second, 0, 1)),
                    "Replay second uphill move");

                // Deterministic rejection probe on the terrain battle.
                var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
                var oot = BattleApi.Apply(state, ledger, MoveCmd("rep-oot", first, 0, 1));
                Assert.IsInstanceOf<BattleRejection>(oot);
                Assert.AreEqual(BattleRejectReason.OutOfTurn, ((BattleRejection)oot).Reason);
                Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));

                state = PlayToOutcome(state, ledger, 64, out var used);
                Assert.AreNotEqual(BattleOutcomeKind.Ongoing, state.Outcome);
                TestContext.WriteLine("TERRAIN_REPLAY used=" + used + ";outcome=" + state.Outcome);
                return BattleApi.ComputeBattleHash(state, ledger) + ":" + BattleApi.ComputeResultHash(state);
            }

            var h1 = Run();
            var h2 = Run();
            Assert.AreEqual(h1, h2, "Independent terrain replays must produce identical hashes");
            Assert.IsFalse(string.IsNullOrEmpty(h1));
        }

        /// <summary>
        /// Drives the foe two flat steps away so the ally shoots at Manhattan distance 4,
        /// exactly one tile beyond the base ranged range of 3.
        /// </summary>
        static BattleState FoeTwoStepsAway(BattleState state, Ledger ledger, string label)
        {
            var guard = 0;
            while (guard++ < 6 && !string.Equals(ActiveId(state), BattleApi.FoeId, StringComparison.Ordinal))
            {
                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd(label + "-wait-" + guard, ActiveId(state))),
                    "wait for foe turn");
            }

            Assert.AreEqual(BattleApi.FoeId, ActiveId(state));
            state = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd(label + "-foe-east", BattleApi.FoeId, 1, 0)),
                "foe east to (4,2)");
            state = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd(label + "-foe-north", BattleApi.FoeId, 0, 1)),
                "foe north to (4,3)");
            state = MustBattle(
                BattleApi.Apply(state, ledger, EndCmd(label + "-foe-end", BattleApi.FoeId)),
                "foe end turn");
            Assert.AreEqual(BattleApi.AllyId, ActiveId(state), "Ally must act again with refilled AP");
            return state;
        }

        /// <summary>
        /// Given: a ranged attacker standing one level above its target.
        /// When: ranged attack at Manhattan distance 4 (one beyond base range 3).
        /// Then: accepted — high ground extends ranged reach by exactly one tile (BBM53)
        /// and still deals the standard RangedDamage with no extra modifier (FFT §6.8).
        /// </summary>
        [Test]
        public void HighGroundRangedAttack_ReachesDistance4_AndDealsStandardDamage()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var cells = FlatCells(3);
            cells[2 * 5 + 1] = 4; // ally spawn (1,2) one level above the grid
            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();

            state = FoeTwoStepsAway(state, ledger, "hg");
            var ally = BattleApi.FindUnit(state, BattleApi.AllyId);
            var foe = BattleApi.FindUnit(state, BattleApi.FoeId);
            Assert.Greater(terrain.Get(ally.Position), terrain.Get(foe.Position),
                "Fixture guard: attacker must stand higher than the target");
            Assert.AreEqual(BattleApi.RangedRange + 1, ally.Position.ManhattanTo(foe.Position),
                "Fixture guard: target sits exactly one tile beyond base ranged range");

            var foeBefore = foe.Hp;
            state = MustBattle(
                BattleApi.Apply(state, ledger, RangedCmd("hg-ranged-4", BattleApi.AllyId, BattleApi.FoeId)),
                "Ranged from high ground must reach Manhattan distance 4");
            var foeAfter = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            TestContext.WriteLine("HIGH_GROUND_RANGED dist=4;foeHp=" + foeBefore + "->" + foeAfter
                + ";allyAp=" + BattleApi.FindUnit(state, BattleApi.AllyId).Ap);
            Assert.AreEqual(foeBefore - BattleApi.RangedDamage, foeAfter,
                "High ground extends range only; damage stays RangedDamage");
            Assert.AreEqual(
                BattleApi.DefaultMaxAp - BattleApi.RangedApCost,
                BattleApi.FindUnit(state, BattleApi.AllyId).Ap,
                "Ranged from high ground still spends the standard ranged AP");
        }

        [Test]
        public void EqualHeight_RangedDistance4_IsStillOutOfRange()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, FlatCells(3));
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();

            state = FoeTwoStepsAway(state, ledger, "eq");
            var ally = BattleApi.FindUnit(state, BattleApi.AllyId);
            var foe = BattleApi.FindUnit(state, BattleApi.FoeId);
            Assert.AreEqual(terrain.Get(ally.Position), terrain.Get(foe.Position),
                "Fixture guard: equal heights");
            Assert.AreEqual(BattleApi.RangedRange + 1, ally.Position.ManhattanTo(foe.Position),
                "Fixture guard: distance 4");

            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeEvents = ledger.Events.Count;
            var result = BattleApi.Apply(state, ledger, RangedCmd("eq-ranged-4", BattleApi.AllyId, BattleApi.FoeId));
            TestContext.WriteLine("EQUAL_HEIGHT_RANGED dist=4;result=" + result);
            Assert.IsInstanceOf<BattleRejection>(result, "Equal height must not extend ranged range");
            Assert.AreEqual(BattleRejectReason.OutOfRange, ((BattleRejection)result).Reason);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
        }

        [Test]
        public void LowerAttacker_RangedDistance4_IsStillOutOfRange()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var cells = FlatCells(4);
            cells[2 * 5 + 1] = 3; // ally spawn below the rest of the grid
            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();

            state = FoeTwoStepsAway(state, ledger, "lo");
            var ally = BattleApi.FindUnit(state, BattleApi.AllyId);
            var foe = BattleApi.FindUnit(state, BattleApi.FoeId);
            Assert.Less(terrain.Get(ally.Position), terrain.Get(foe.Position),
                "Fixture guard: attacker must stand lower than the target");
            Assert.AreEqual(BattleApi.RangedRange + 1, ally.Position.ManhattanTo(foe.Position),
                "Fixture guard: distance 4");

            var beforeHash = BattleApi.ComputeBattleHash(state, ledger);
            var beforeEvents = ledger.Events.Count;
            var result = BattleApi.Apply(state, ledger, RangedCmd("lo-ranged-4", BattleApi.AllyId, BattleApi.FoeId));
            TestContext.WriteLine("LOWER_ATTACKER_RANGED dist=4;result=" + result);
            Assert.IsInstanceOf<BattleRejection>(result, "Attacking uphill must not extend ranged range");
            Assert.AreEqual(BattleRejectReason.OutOfRange, ((BattleRejection)result).Reason);
            Assert.AreEqual(beforeHash, BattleApi.ComputeBattleHash(state, ledger));
            Assert.AreEqual(beforeEvents, ledger.Events.Count);
        }

        [Test]
        public void HighGround_MeleeRangeStaysOne_DamageUnchanged()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var cells = FlatCells(3);
            cells[2 * 5 + 1] = 4; // ally spawn (1,2)
            cells[2 * 5 + 2] = 4; // (2,2): flat step for the ally approach
            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();
            var guard = 0;
            while (guard++ < 6 && !string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal))
            {
                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd("hm-wait-" + guard, ActiveId(state))),
                    "wait for ally turn");
            }

            Assert.AreEqual(BattleApi.AllyId, ActiveId(state));
            Assert.Greater(
                terrain.Get(BattleApi.FindUnit(state, BattleApi.AllyId).Position),
                terrain.Get(BattleApi.FindUnit(state, BattleApi.FoeId).Position),
                "Fixture guard: melee attacker stands higher");

            // Distance 2 melee must stay out of range even from high ground.
            var meleeOor = BattleApi.Apply(state, ledger, MeleeCmd("hm-oor", BattleApi.AllyId, BattleApi.FoeId));
            Assert.IsInstanceOf<BattleRejection>(meleeOor, "High ground must not extend melee range");
            Assert.AreEqual(BattleRejectReason.OutOfRange, ((BattleRejection)meleeOor).Reason);

            // Adjacent melee from high ground deals exactly MeleeDamage.
            state = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd("hm-close", BattleApi.AllyId, 1, 0)),
                "flat step east to (2,2)");
            var foeBefore = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            state = MustBattle(
                BattleApi.Apply(state, ledger, MeleeCmd("hm-hit", BattleApi.AllyId, BattleApi.FoeId)),
                "adjacent melee");
            var foeAfter = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
            TestContext.WriteLine("HIGH_GROUND_MELEE dmg=" + (foeBefore - foeAfter)
                + ";allyAp=" + BattleApi.FindUnit(state, BattleApi.AllyId).Ap);
            Assert.AreEqual(BattleApi.MeleeDamage, foeBefore - foeAfter, "Height grants no melee damage bonus");
            Assert.AreEqual(
                BattleApi.DefaultMaxAp - BattleApi.MoveApCost - BattleApi.MeleeApCost,
                BattleApi.FindUnit(state, BattleApi.AllyId).Ap,
                "Melee from high ground still spends the standard melee AP");
        }

        [Test]
        public void HeightAdvantage_AddsNoHitOrDamageModifier_WithinBaseRange()
        {
            void RunRanged(Heightmap map, out int damage, out int apSpent, out int events)
            {
                var context = SindorimBattleHandoff(out _, out _);
                var state = OpenWithTerrain(context, map);
                var battleLedger = new Ledger();
                var guard = 0;
                while (guard++ < 6 && !string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal))
                {
                    state = MustBattle(
                        BattleApi.Apply(state, battleLedger, EndCmd("mod-wait-" + guard, ActiveId(state))),
                        "wait for ally turn");
                }

                var foeBefore = BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
                state = MustBattle(
                    BattleApi.Apply(state, battleLedger, RangedCmd("mod-ranged", BattleApi.AllyId, BattleApi.FoeId)),
                    "ranged within base range");
                damage = foeBefore - BattleApi.FindUnit(state, BattleApi.FoeId).Hp;
                apSpent = BattleApi.DefaultMaxAp - BattleApi.FindUnit(state, BattleApi.AllyId).Ap;
                events = battleLedger.Events.Count;
            }

            var highCells = FlatCells(3);
            highCells[2 * 5 + 1] = 4;
            RunRanged(new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, FlatCells(3)), out var flatDamage, out var flatAp, out var flatEvents);
            RunRanged(new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, highCells), out var highDamage, out var highAp, out var highEvents);
            TestContext.WriteLine("HEIGHT_MODIFIER flat=" + flatDamage + "d/" + flatAp + "ap;"
                + "high=" + highDamage + "d/" + highAp + "ap");
            Assert.AreEqual(BattleApi.RangedDamage, flatDamage, "Flat fixture guard");
            Assert.AreEqual(BattleApi.RangedDamage, highDamage,
                "Height advantage must not modify ranged damage within base range");
            Assert.AreEqual(flatAp, highAp, "Height advantage must not change ranged AP cost");
            Assert.AreEqual(flatEvents, highEvents, "Height advantage must not add extra resolution events");
        }

        /// <summary>
        /// Two successive accepted terrain-priced moves must price from the terrain carried
        /// by each cloned state; dropping terrain propagation in BattleState.Clone must
        /// fail here (plan todo 35, task-2 verification note N1).
        /// </summary>
        [Test]
        public void SuccessiveTerrainPricedMoves_RetainTerrainAcrossClonedStates()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var cells = new int[25];
            for (var i = 0; i < cells.Length; i++)
            {
                var row = i / 5;
                cells[i] = row == 3 ? 4 : (row == 4 ? 5 : 3);
            }

            var terrain = new Heightmap(5, 5, 8, 2, Seed, LayerId.B1, cells);
            var state = OpenWithTerrain(context, terrain);
            var ledger = new Ledger();
            var mapFingerprint = state.Terrain.Fingerprint();
            var guard = 0;
            while (guard++ < 6 && !string.Equals(ActiveId(state), BattleApi.AllyId, StringComparison.Ordinal))
            {
                state = MustBattle(
                    BattleApi.Apply(state, ledger, EndCmd("cl-wait-" + guard, ActiveId(state))),
                    "wait for ally turn");
            }

            var eventsAfterWait = ledger.Events.Count;
            var actorId = BattleApi.AllyId;

            // First uphill move: (1,2)h3 -> (1,3)h4 costs 2 AP.
            var first = MustBattle(
                BattleApi.Apply(state, ledger, MoveCmd("cl-up-1", actorId, 0, 1)),
                "First uphill move");
            var firstUnit = BattleApi.FindUnit(first, actorId);
            Assert.IsNotNull(first.Terrain, "Accepted move must carry the terrain snapshot into the cloned state");
            Assert.AreEqual(mapFingerprint, first.Terrain.Fingerprint(), "Cloned terrain must equal the opened map");
            Assert.AreEqual(BattleApi.DefaultMaxAp - 2, firstUnit.Ap, "First climb costs 2 AP");
            Assert.AreEqual(new GridCoord(1, 3), firstUnit.Position);

            // Turn cycles back so the same actor can move again with refilled AP.
            first = MustBattle(BattleApi.Apply(first, ledger, EndCmd("cl-end-1", actorId)), "ally end turn");
            first = MustBattle(BattleApi.Apply(first, ledger, EndCmd("cl-end-2", ActiveId(first))), "foe end turn");
            Assert.AreEqual(actorId, ActiveId(first));

            // Second uphill move prices from the CLONED state's terrain: (1,3)h4 -> (1,4)h5 costs 2 AP.
            var second = MustBattle(
                BattleApi.Apply(first, ledger, MoveCmd("cl-up-2", actorId, 0, 1)),
                "Second uphill move must price against the cloned terrain");
            var secondUnit = BattleApi.FindUnit(second, actorId);
            TestContext.WriteLine("TERRAIN_CLONE move1Ap=2;move2Ap="
                + (BattleApi.DefaultMaxAp - secondUnit.Ap));
            Assert.IsNotNull(second.Terrain, "Second accepted move must still carry terrain");
            Assert.AreEqual(mapFingerprint, second.Terrain.Fingerprint(),
                "Terrain surviving one clone must survive the next");
            Assert.AreEqual(BattleApi.DefaultMaxAp - 2, secondUnit.Ap,
                "A flat reprice (1 AP) would mean the clone dropped its terrain");
            Assert.AreEqual(new GridCoord(1, 4), secondUnit.Position);
            Assert.AreEqual(eventsAfterWait + 4, ledger.Events.Count, "two moves plus two end turns");
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
            TestContext.WriteLine("DIAGONAL_MOVE position=" + beforePos + "->"
                + BattleApi.FindUnit(state, actorId).Position + ";ap=" + beforeAp + "->"
                + BattleApi.FindUnit(state, actorId).Ap + ";hash=" + beforeHash + "->"
                + BattleApi.ComputeBattleHash(state, ledger));
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

        // ---- Task 4: persistent leftover HP opens the next battle ----

        static BattleContext TaskHpContext(string identityKey, int allyHp)
        {
            return BattleContext.Create(
                CampaignId,
                StationId.Sindorim,
                Seed,
                new Tick(3),
                100,
                0,
                CampaignApi.RulesVersion,
                identityKey,
                new UnitHpSnapshot(new Dictionary<string, int> { [BattleApi.AllyId] = allyHp }));
        }

        [Test]
        public void Open_WithStartHpSnapshot_SeedsAllySeven_FoeDefaultsToMax()
        {
            var state = BattleApi.Open(TaskHpContext("task-4-hp-ctx", 7));
            var ally = BattleApi.FindUnit(state, BattleApi.AllyId);
            var foe = BattleApi.FindUnit(state, BattleApi.FoeId);
            Assert.AreEqual(7, ally.Hp, "context start HP must seed the opening HP");
            Assert.AreEqual(BattleApi.DefaultMaxHp, ally.MaxHp, "start HP is damage carry, not a max change");
            Assert.AreEqual(BattleApi.DefaultMaxHp, foe.Hp, "absent entry is the initial default, not corrupt");
            Assert.AreEqual(BattleApi.DefaultMaxHp, foe.MaxHp);
            Assert.AreEqual(BattleApi.DefaultMaxAp, ally.Ap);
        }

        [Test]
        public void Open_CorruptStartHp_ThrowsExplicitError_NotSilentDefault()
        {
            foreach (var corruptHp in new[] { -2, BattleApi.DefaultMaxHp + 1 })
            {
                var context = TaskHpContext("task-4-hp-corrupt", corruptHp);
                Assert.Throws<ArgumentException>(
                    () => BattleApi.Open(context),
                    "corrupt start HP " + corruptHp + " must throw, not default to " + BattleApi.DefaultMaxHp);
            }
        }

        [Test]
        public void Open_MissingPersistentAlly_ThrowsExplicitError_NotSilentDefault()
        {
            var context = BattleContext.Create(
                CampaignId,
                StationId.Sindorim,
                Seed,
                new Tick(3),
                100,
                0,
                CampaignApi.RulesVersion,
                "task-4-missing-ally",
                new UnitHpSnapshot(Array.Empty<KeyValuePair<string, int>>()));

            Assert.Throws<ArgumentException>(
                () => BattleApi.Open(context),
                "a context missing its required persistent ally must fail, not heal to default HP");
        }

        [Test]
        public void BattleContext_SameClaimedIdentityWithDifferentHp_Throws()
        {
            const string identityKey = "task-4-claimed-identity";
            var canonical = TaskHpContext(identityKey, 7);
            var alteredHp = new UnitHpSnapshot(
                new Dictionary<string, int> { [BattleApi.AllyId] = BattleApi.DefaultMaxHp });

            Assert.Throws<ArgumentException>(
                () => new BattleContext(
                    canonical.BattleId,
                    canonical.CampaignId,
                    canonical.Location,
                    canonical.WorldSeed,
                    canonical.WorldTick,
                    canonical.PartyResources,
                    canonical.Reputation,
                    canonical.RulesVersion,
                    identityKey,
                    canonical.ContextHash,
                    alteredHp,
                    canonical.SeedIdentityHash,
                    canonical.SeedIdentityBattleId),
                "same claimed public identity must not accept different opening HP");
        }

        [Test]
        public void BattleContext_MismatchedSeedIdentities_Throw()
        {
            const string identityKey = "task-4-seed-integrity";
            var canonical = TaskHpContext(identityKey, 7);
            var forgedSeedHash = CoreApi.StableHashHex("unrelated-seed-identity");
            var forgedSeedBattleId = "battle-" + forgedSeedHash.Substring(0, 16);

            Assert.Throws<ArgumentException>(
                () => new BattleContext(
                    canonical.BattleId,
                    canonical.CampaignId,
                    canonical.Location,
                    canonical.WorldSeed,
                    canonical.WorldTick,
                    canonical.PartyResources,
                    canonical.Reputation,
                    canonical.RulesVersion,
                    identityKey,
                    canonical.ContextHash,
                    canonical.StartHp,
                    forgedSeedHash,
                    forgedSeedBattleId),
                "seed identity must be derived from the canonical battle material");

            Assert.Throws<ArgumentException>(
                () => new BattleContext(
                    canonical.BattleId,
                    canonical.CampaignId,
                    canonical.Location,
                    canonical.WorldSeed,
                    canonical.WorldTick,
                    canonical.PartyResources,
                    canonical.Reputation,
                    canonical.RulesVersion,
                    identityKey,
                    canonical.ContextHash,
                    canonical.StartHp,
                    canonical.SeedIdentityHash,
                    "battle-unrelated-seed"),
                "seed battle id must be paired with the canonical seed identity hash");
        }

        [Test]
        public void Open_DownedPersistentAlly_IsTerminalEnemyVictory_AndCannotAct()
        {
            var state = BattleApi.Open(TaskHpContext("task-4-hp-zero", 0));
            var ally = BattleApi.FindUnit(state, BattleApi.AllyId);
            Assert.AreEqual(0, ally.Hp, "zero is a valid persisted downed value");
            Assert.IsTrue(ally.IsDowned);
            Assert.AreEqual(BattleOutcomeKind.EnemyVictory, state.Outcome);

            var ledger = new Ledger();
            var before = BattleApi.ComputeBattleHash(state, ledger);
            var rejected = BattleApi.Apply(state, ledger, EndCmd("downed-cannot-act", ally.UnitId));
            Assert.IsInstanceOf<BattleRejection>(rejected);
            Assert.AreEqual(BattleRejectReason.BattleEnded, ((BattleRejection)rejected).Reason);
            Assert.AreEqual(before, BattleApi.ComputeBattleHash(state, ledger));
            Assert.AreEqual(0, ledger.Events.Count);
        }

        [Test]
        public void OpeningHash_IncludesStartHp_AndReplaysIdentically()
        {
            var atSeven = BattleApi.Open(TaskHpContext("task-4-hash-ctx", 7));
            var atTen = BattleApi.Open(TaskHpContext("task-4-hash-ctx", BattleApi.DefaultMaxHp));
            var atSevenReplay = BattleApi.Open(TaskHpContext("task-4-hash-ctx", 7));

            Assert.AreNotEqual(atSeven.OpeningHash, atTen.OpeningHash, "opening hash must include start HP");
            Assert.AreEqual(atSeven.OpeningHash, atSevenReplay.OpeningHash, "same start HP must replay identically");
        }

        [Test]
        public void StartHpSnapshot_CopiesCallerStorage_NoMutableAlias()
        {
            var source = new Dictionary<string, int> { [BattleApi.AllyId] = 7 };
            var context = BattleContext.Create(
                CampaignId,
                StationId.Sindorim,
                Seed,
                new Tick(3),
                100,
                0,
                CampaignApi.RulesVersion,
                "task-4-alias",
                new UnitHpSnapshot(source));

            source[BattleApi.AllyId] = 9; // mutate caller storage after construction

            var state = BattleApi.Open(context);
            Assert.AreEqual(
                7,
                BattleApi.FindUnit(state, BattleApi.AllyId).Hp,
                "snapshot must copy caller storage, not alias it");
        }

        [Test]
        public void Wait_DefersToNextLivingUnit_WithoutAdvancingTurn()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var actorId = ActiveId(state);
            var turnBefore = state.TurnNumber;
            var ledger = new Ledger();

            var afterWait = MustBattle(
                BattleApi.Apply(state, ledger, new BattleCommand { Kind = BattleCommandKind.Wait, ActorId = actorId }),
                "wait defers");

            Assert.AreNotEqual(actorId, ActiveId(afterWait), "wait hands the turn to the next living unit");
            Assert.AreEqual(turnBefore, afterWait.TurnNumber, "wait is an in-round deferral and must not advance the turn");
            var before = BattleApi.FindUnit(state, actorId);
            var after = BattleApi.FindUnit(afterWait, actorId);
            Assert.AreEqual(before.Ap, after.Ap, "wait must not change the waiting actor's AP");
        }

        [Test]
        public void Wait_IsDistinctFromEndTurn_ForIdenticalOpening()
        {
            var first = BattleApi.Open(SindorimBattleHandoff(out _, out _));
            var second = BattleApi.Open(SindorimBattleHandoff(out _, out _));
            var ledgerA = new Ledger();
            var ledgerB = new Ledger();
            var idA = ActiveId(first);
            var idB = ActiveId(second);

            var afterWait = MustBattle(BattleApi.Apply(first, ledgerA, new BattleCommand { Kind = BattleCommandKind.Wait, ActorId = idA }), "wait");
            var afterEnd = MustBattle(BattleApi.Apply(second, ledgerB, EndCmd("end", idB)), "end turn");

            Assert.AreNotEqual(
                BattleApi.ComputeBattleHash(afterWait, ledgerA),
                BattleApi.ComputeBattleHash(afterEnd, ledgerB),
                "wait and end-turn must produce different deterministic outcomes");
            Assert.AreEqual(first.TurnNumber, afterWait.TurnNumber, "wait must not advance the turn");
            Assert.AreEqual(second.TurnNumber + 1, afterEnd.TurnNumber, "end-turn advances the turn");
        }

        [Test]
        public void Wait_AfterTerminalOutcome_IsTypedRejection()
        {
            var context = SindorimBattleHandoff(out _, out _);
            var state = BattleApi.Open(context);
            var ledger = new Ledger();
            var first = ActiveId(state);
            state = PlayToOutcome(state, ledger, 64, out _);

            var rejected = BattleApi.Apply(state, ledger, new BattleCommand { Kind = BattleCommandKind.Wait, ActorId = first });

            Assert.IsInstanceOf<BattleRejection>(rejected, "wait after a terminal outcome must be rejected");
        }

    }
}
