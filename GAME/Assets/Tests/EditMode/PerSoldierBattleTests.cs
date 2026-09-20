using System;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using NUnit.Framework;

namespace Janseon.Foundation.Tests
{
    public sealed class PerSoldierBattleTests
    {
        [Test]
        public void UnityFixedDeltaTimeAndRoster()
        {
            var setup = BattleSetup.FromContext(BattleContext.Create("campaign", default(StationId), 7, new Tick(0), 0, 0, BattleRules.RulesVersion, "task7", UnitHpSnapshot.DefaultParty()));
            setup.PlayerUnits = new RosterUnit[20];
            for (var i = 0; i < setup.PlayerUnits.Length; i++)
                setup.PlayerUnits[i] = new RosterUnit { Id = new UnitId("soldier-" + i), SoldierId = new SoldierId("soldier-" + i), SquadId = new SquadId("squad-1"), Side = 0, Hp = 10, MaxHp = 10, Power = 1 };
            setup.PlayerHeroId = new HeroId("hero-1");
            var state = BattleSim.Open(setup);
            var before = state.Fingerprint();
            BattleSim.Step(state, new Ledger());
            Assert.That(state.Fingerprint(), Is.Not.EqualTo(before));
            Assert.That(Array.FindAll(state.Units, unit => unit.Side == 0).Length, Is.EqualTo(20));
            Assert.That(state.Units[0].Id.Value, Is.EqualTo("soldier-0"));
            Assert.That(state.Units[0].SoldierId.Value, Is.EqualTo("soldier-0"));
            Assert.That(state.Units[0].SquadId.Value, Is.EqualTo("squad-1"));
            Assert.That(state.Frame, Is.Not.Null);
            Assert.That(state.Frame.Units, Is.Not.SameAs(state.Units));
            var clone = state.Clone();
            clone.PublishFrame();
            Assert.That(state.Frame, Is.Not.SameAs(clone.Frame));
            Assert.That(state.Heroes.Length, Is.EqualTo(1));
            Assert.That(state.Squads.Length, Is.EqualTo(1));
        }

        [Test]
        public void RejectHardcodedThirtyHzOversizedSquadAndDuplicateSoldier()
        {
            var setup = BattleSetup.FromContext(BattleContext.Create("campaign", default(StationId), 7, new Tick(0), 0, 0, BattleRules.RulesVersion, "task7", UnitHpSnapshot.DefaultParty()));
            setup.PlayerUnits = new RosterUnit[21];
            for (var i = 0; i < setup.PlayerUnits.Length; i++)
                setup.PlayerUnits[i] = new RosterUnit { Id = new UnitId(i == 20 ? "soldier-0" : "soldier-" + i), SoldierId = new SoldierId(i == 20 ? "soldier-0" : "soldier-" + i), SquadId = new SquadId("squad-1"), Side = 0, Hp = 10, MaxHp = 10 };
            Assert.Throws<ArgumentException>(() => BattleSim.Open(setup));
        }

        [Test]
        public void PathFormationAndNavigationSurface()
        {
            var surface = BattleSim.BattlefieldSurface.Create(5, 3)
                .WithHeights(new[] { 3, 3, 4, 4, 4, 3, 3, 4, 4, 4, 3, 3, 4, 4, 4 })
                .WithPassage(new GridCoord(2, 0), new GridCoord(2, 1))
                .WithAnchor("entry", new GridCoord(0, 1))
                .WithAnchor("exit", new GridCoord(4, 1));
            var units = new[] { new BattleSim.FormationUnit("soldier-0", 0), new BattleSim.FormationUnit("soldier-1", 1) };
            var result = BattleSim.ProjectFormation(surface, units, "entry", "exit");
            var repeat = BattleSim.ProjectFormation(surface, units, "entry", "exit");
            Assert.That(result.Success, Is.True);
            Assert.That(result.Path.Count, Is.GreaterThan(0));
            Assert.That(result.FormationHash, Is.EqualTo(repeat.FormationHash));
        }

        [Test]
        public void RejectFormationInsideWallOrDisconnectedFloor()
        {
            var surface = BattleSim.BattlefieldSurface.Create(3, 3)
                .WithBlocked(new GridCoord(1, 1))
                .WithAnchor("entry", new GridCoord(0, 0))
                .WithAnchor("exit", new GridCoord(2, 2));
            var units = new[] { new BattleSim.FormationUnit("soldier-0", 0) };
            Assert.That(BattleSim.ProjectFormation(surface, units, "entry", "exit", new[] { new GridCoord(1, 1) }).Success, Is.False);
            Assert.That(BattleSim.ProjectFormation(surface, units, "entry", "missing").Error, Does.Contain("anchor"));
            var isolated = BattleSim.BattlefieldSurface.Create(3, 3).WithBlocked(new GridCoord(1, 0), new GridCoord(0, 1), new GridCoord(1, 1), new GridCoord(1, 2), new GridCoord(2, 1)).WithAnchor("entry", new GridCoord(0, 0)).WithAnchor("exit", new GridCoord(2, 2));
            Assert.That(BattleSim.ProjectFormation(isolated, units, "entry", "exit").Success, Is.False);
            Assert.That(BattleSim.ProjectFormation(surface, units, "entry", "exit", null, false).Error, Does.Contain("tuning"));
        }

        [Test]
        public void NarrowPassageCrowdIsDeterministic()
        {
            var first = CrowdState(new[] { "b", "a", "c" });
            var second = CrowdState(new[] { "c", "b", "a" });
            var passage = new System.Collections.Generic.HashSet<GridCoord> { new GridCoord(1, 0) };
            Assert.That(BattleSim.ResolveSoldierSpacing(first, passage), Is.True);
            Assert.That(BattleSim.ResolveSoldierSpacing(second, passage), Is.True);
            Assert.That(first.SpatialHash, Is.EqualTo(second.SpatialHash));
            Assert.That(Array.Find(first.Units, unit => unit.Id.Value == "a").PositionMm.X, Is.EqualTo(1000));
            Assert.That(Array.Find(first.Units, unit => unit.Id.Value == "b").PositionMm.X, Is.EqualTo(2004));
        }

        [Test]
        public void DenseBlockedFormationDoesNotTeleportOrLoop()
        {
            var state = CrowdState(new[] { "a", "b", "c", "d" });
            var before = state.Units[0].PositionMm;
            var blocked = new System.Collections.Generic.HashSet<GridCoord> { new GridCoord(0, 0), new GridCoord(1, 0) };
            Assert.That(BattleSim.ResolveSoldierSpacing(state, blocked), Is.False);
            Assert.That(state.Units[0].PositionMm, Is.EqualTo(before));
            Assert.That(state.Units[0].PositionMm.X, Is.LessThan(2000));
            Assert.That(state.SpatialHash, Is.Not.Null);
        }

        static BattleSimState CrowdState(string[] ids)
        {
            var state = new BattleSimState { Arena = new ArenaState { Width = 3, Height = 1 }, Units = new UnitState[ids.Length] };
            Array.Sort(ids, StringComparer.Ordinal);
            for (var i = 0; i < ids.Length; i++)
                state.Units[i] = new UnitState { Id = new UnitId(ids[i]), SoldierId = new SoldierId(ids[i]), Side = 0, Cell = new GridCoord(0, 0), PositionMm = new IntPointMm(1000 + i * 1000, 0), RadiusMm = 500 };
            return state;
        }
    }
}
