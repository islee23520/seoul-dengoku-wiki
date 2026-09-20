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
                setup.PlayerUnits[i] = new RosterUnit { Id = new UnitId("soldier-" + i), Side = 0, Hp = 10, MaxHp = 10, Power = 1 };
            var state = BattleSim.Open(setup);
            var before = state.Fingerprint();
            BattleSim.Step(state, new Ledger());
            Assert.That(state.Fingerprint(), Is.Not.EqualTo(before));
            Assert.That(Array.FindAll(state.Units, unit => unit.Side == 0).Length, Is.EqualTo(20));
            Assert.That(state.Units[0].Id.Value, Is.EqualTo("soldier-0"));
        }

        [Test]
        public void RejectHardcodedThirtyHzOversizedSquadAndDuplicateSoldier()
        {
            var setup = BattleSetup.FromContext(BattleContext.Create("campaign", default(StationId), 7, new Tick(0), 0, 0, BattleRules.RulesVersion, "task7", UnitHpSnapshot.DefaultParty()));
            setup.PlayerUnits = new RosterUnit[21];
            for (var i = 0; i < setup.PlayerUnits.Length; i++)
                setup.PlayerUnits[i] = new RosterUnit { Id = new UnitId(i == 20 ? "soldier-0" : "soldier-" + i), Side = 0, Hp = 10, MaxHp = 10 };
            Assert.Throws<ArgumentException>(() => BattleSim.Open(setup));
        }
    }
}
