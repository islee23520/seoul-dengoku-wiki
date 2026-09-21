using System;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.Battle;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    [TestFixture]
    public sealed class FoundationBattleViewTests
    {
        FoundationBattleView view;
        TemporaryBattleVisualCatalog catalog;
        GameObject[] prefabs;

        [SetUp]
        public void SetUp()
        {
            catalog = ScriptableObject.CreateInstance<TemporaryBattleVisualCatalog>();
            prefabs = new GameObject[4];
            var entries = new TemporaryBattleVisualEntry[4];
            foreach (TemporaryCombatantKind kind in Enum.GetValues(typeof(TemporaryCombatantKind)))
            {
                var prefab = new GameObject("BoundaryPrefab_" + kind);
                var marker = new GameObject("SelectionMarker");
                marker.transform.SetParent(prefab.transform, false);
                var visual = prefab.AddComponent<TemporaryBattleCombatantVisual>();
                visual.Configure(prefab.transform, Array.Empty<Renderer>(), marker,
                    Color.blue, Color.yellow, Color.black);
                prefabs[(int)kind] = prefab;
                entries[(int)kind] = new TemporaryBattleVisualEntry(kind, prefab);
            }
            catalog.SetGeneratedEntries(entries);
        }

        [TearDown]
        public void TearDown()
        {
            if (view != null) UnityEngine.Object.DestroyImmediate(view.gameObject);
            if (catalog != null) UnityEngine.Object.DestroyImmediate(catalog);
            if (prefabs == null) return;
            foreach (GameObject prefab in prefabs)
                if (prefab != null) UnityEngine.Object.DestroyImmediate(prefab);
        }

        [Test]
        public void Refresh_MapsMillimetersToMetersAndFacingYawWithoutMutatingSimulation()
        {
            var state = State(Unit("first", 1250, -2000, 375, 90250));
            string before = state.Fingerprint();

            view = FoundationBattleView.Create(null, state, catalog, KindFor);

            Transform visual = view.Units[new UnitId("first")].transform;
            Assert.That(visual.localPosition, Is.EqualTo(new Vector3(1.25f, -2f, 0.375f)));
            Assert.That(visual.localRotation.eulerAngles.y, Is.EqualTo(90.25f).Within(0.001f));
            Assert.That(state.Fingerprint(), Is.EqualTo(before));
        }

        [Test]
        public void Refresh_AppliesTypedStatePoseWithoutMutatingSimulation()
        {
            var unit = Unit("pose", 0, 0, 0, 0);
            unit.OrderKind = BattleOrderKind.Move;
            var state = State(unit);
            view = FoundationBattleView.Create(null, state, catalog, KindFor);
            string before = state.Fingerprint();

            Assert.That(view.Units[unit.Id].Pose, Is.EqualTo(TemporaryCombatantPose.Moving));

            UnitState hit = unit.Clone();
            hit.Status = BattleUnitStatus.Hit;
            PublishFrame(state, hit);
            view.Refresh();
            Assert.That(view.Units[unit.Id].Pose, Is.EqualTo(TemporaryCombatantPose.Hit));

            UnitState down = hit.Clone();
            down.Status = BattleUnitStatus.Down;
            PublishFrame(state, down);
            view.Refresh();
            Assert.That(view.Units[unit.Id].Pose, Is.EqualTo(TemporaryCombatantPose.Dead));
            Assert.That(state.Fingerprint(), Is.EqualTo(before));
        }

        [Test]
        public void Select_ActivatesOnlyTheSelectedVisualMarkerWithoutMutatingSimulation()
        {
            var first = Unit("first", 0, 0, 0, 0);
            var second = Unit("second", 1000, 0, 0, 0);
            var state = State(first, second);
            view = FoundationBattleView.Create(null, state, catalog, KindFor);
            string before = state.Fingerprint();

            Assert.That(view.Select(second.Id), Is.True);
            Assert.That(view.Units[first.Id].IsSelected, Is.False);
            Assert.That(view.Units[second.Id].IsSelected, Is.True);
            Assert.That(view.Select(new UnitId("missing")), Is.False);
            Assert.That(state.Fingerprint(), Is.EqualTo(before));
        }

        [Test]
        public void Refresh_RemovesVisualForUnitMissingFromPublishedFrameWithoutMutatingSimulation()
        {
            var retained = Unit("retained", 0, 0, 0, 0);
            var stale = Unit("stale", 1000, 0, 0, 0);
            var state = State(retained, stale);
            view = FoundationBattleView.Create(null, state, catalog, KindFor);
            TemporaryBattleCombatantVisual staleVisual = view.Units[stale.Id];
            string before = state.Fingerprint();

            PublishFrame(state, retained.Clone());
            view.Refresh();

            Assert.That(view.Units.ContainsKey(retained.Id), Is.True);
            Assert.That(view.Units.ContainsKey(stale.Id), Is.False);
            Assert.That(staleVisual == null, Is.True);
            Assert.That(state.Fingerprint(), Is.EqualTo(before));
        }

        static TemporaryCombatantKind KindFor(UnitState unit)
        {
            return unit.Side == 0 ? TemporaryCombatantKind.SoldierMelee : TemporaryCombatantKind.SoldierRanged;
        }

        static BattleSimState State(params UnitState[] units)
        {
            var state = new BattleSimState { Units = units };
            state.PublishFrame();
            return state;
        }

        static void PublishFrame(BattleSimState state, params UnitState[] units)
        {
            UnitState[] simulationUnits = state.Units;
            state.Units = units;
            state.PublishFrame();
            state.Units = simulationUnits;
        }

        static UnitState Unit(string id, int x, int y, int z, int yawMilliDegrees)
        {
            return new UnitState
            {
                Id = new UnitId(id),
                Side = 0,
                Position = new BattlePositionMm(x, y, z),
                Facing = new BattleFacing(yawMilliDegrees),
                Status = BattleUnitStatus.Active,
                OrderKind = BattleOrderKind.None,
                Hp = 10,
                MaxHp = 10,
            };
        }
    }
}
