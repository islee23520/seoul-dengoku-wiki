using System;
using System.Linq;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.Battle;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class FoundationBattleViewTests
    {
        FoundationBattleView view;
        BattleSimState battle;
        OwnerCardTargetingMachine machine;

        [SetUp]
        public void SetUp()
        {
            var context = BattleContext.Create("world-view", default, 271828, new Tick(0), 0, 0,
                BattleRules.RulesVersion, "world-view", UnitHpSnapshot.DefaultParty());
            var setup = BattleSetup.FromContext(context);
            battle = BattleSim.Open(setup);
            Assert.IsNull(BattleSim.Submit(battle, new Ledger(), new BattleTickCommand
            {
                Id = new CommandId("deploy-view"), Kind = BattleTickCommandKind.Deploy, Formation = setup.PlayerFormation,
            }));
            machine = new OwnerCardTargetingMachine(battle, _ => Assert.Fail("Presentation must not submit without confirmation"), () => 1);
            view = FoundationBattleView.Create(null, battle, machine);
        }

        [TearDown]
        public void TearDown() { if (view != null) UnityEngine.Object.DestroyImmediate(view.gameObject); }

        [Test]
        public void EveryCoreUnitHasOneWorldPresentation_GridAndFacingAreReadOnly()
        {
            string before = battle.Fingerprint();
            view.Refresh();
            Assert.AreEqual(6, battle.Units.Count(u => u.Side == 0));
            Assert.Greater(battle.Units.Count(u => u.Side == 1), 0);
            Assert.AreEqual(battle.Units.Length, view.Units.Count);
            Assert.AreEqual(battle.Units.Length, view.Units.Values.Select(t => t.position).Distinct().Count());
            foreach (var unit in battle.Units)
            {
                Assert.AreEqual(view.CellWorld(unit.Cell), view.Units[unit.Id].position);
                Assert.IsTrue(view.Units[unit.Id].gameObject.activeSelf);
            }
            Assert.AreEqual(1.5f, Vector3.Distance(view.CellWorld(new GridCoord(0, 0)), view.CellWorld(new GridCoord(1, 0))));
            Assert.AreEqual(before, battle.Fingerprint());
            Assert.AreEqual(0, view.GetComponentsInChildren<Canvas>(true).Length);
            Assert.AreEqual(0, view.GetComponentsInChildren<TMPro.TMP_Text>(true).Length);
            Assert.AreEqual(GenreContract.CameraPitchDegrees, view.ViewCamera.transform.eulerAngles.x, 0.001f);
            Assert.AreEqual(GenreContract.CameraYawDegrees, view.ViewCamera.transform.eulerAngles.y, 0.001f);
            Assert.IsTrue(view.ViewCamera.orthographic);
        }

        [Test]
        public void SelectionRingFollowsCorePosition_AndDeadUnitIsHidden()
        {
            var unit = battle.Units[0];
            string before = battle.Fingerprint();
            Assert.IsTrue(view.SelectUnit(unit.Id));
            Assert.AreEqual(before, battle.Fingerprint());
            Assert.IsTrue(view.SelectionRing.gameObject.activeSelf);
            Assert.AreEqual(view.CellWorld(unit.Cell) + Vector3.up * 0.035f, view.SelectionRing.position);
            Assert.IsInstanceOf<MeshRenderer>(view.SelectionRing.GetComponent<Renderer>());
            Assert.IsTrue(view.SelectionRing.GetComponent<MeshFilter>().sharedMesh.normals.All(n => n.y > 0.9f));
            unit.Cell = new GridCoord(4, 4);
            view.Refresh();
            Assert.AreEqual(view.CellWorld(unit.Cell) + Vector3.up * 0.035f, view.SelectionRing.position);
            unit.Hp = 0;
            view.Refresh();
            Assert.IsFalse(view.Units[unit.Id].gameObject.activeSelf);
            Assert.IsFalse(view.SelectionRing.gameObject.activeSelf);
        }

        [Test]
        public void OnlyMobilityChoosingDirectionShowsFourWorldArrows_ConfirmAndMoraleDoNot()
        {
            var owner = battle.Units[0];
            var target = battle.Units[1];
            // Fixture cells isolate direction legality; production view never changes occupancy.
            for (int i = 0; i < battle.Units.Length; i++) battle.Units[i].Cell = new GridCoord(i, 7);
            owner.Cell = new GridCoord(3, 4);
            target.Cell = new GridCoord(4, 3);
            view.SelectUnit(owner.Id);
            Assert.IsTrue(machine.BeginCard("mobility-regroup"));
            view.Refresh();
            Assert.AreEqual(0, view.VisibleArrowCount);
            string before = battle.Fingerprint();
            Assert.IsTrue(view.SelectUnit(target.Id));
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, machine.Stage);
            Assert.AreEqual(4, view.VisibleArrowCount);
            foreach (Transform arrow in view.Arrows)
            {
                Assert.AreEqual(1.03f, Vector3.Distance(view.TargetRing.position, arrow.position), 0.0001f);
                Assert.IsNotNull(arrow.GetComponent<MeshRenderer>());
                Assert.IsTrue(arrow.GetComponent<MeshFilter>().sharedMesh.normals.All(n => n.y > 0.9f));
            }
            Assert.AreEqual(before, battle.Fingerprint());
            Assert.IsTrue(view.SelectDirection(CardinalDirection.East));
            Assert.AreEqual(CardTargetingStage.Confirm, machine.Stage);
            Assert.AreEqual(0, view.VisibleArrowCount);
            machine.Cancel();
            Assert.IsTrue(machine.BeginCard("encourage-morale"));
            Assert.IsTrue(view.SelectUnit(target.Id));
            Assert.AreEqual(CardTargetingStage.Confirm, machine.Stage);
            Assert.AreEqual(0, view.VisibleArrowCount);
            machine.Cancel();
            view.Refresh();
            Assert.IsFalse(view.TargetRing.gameObject.activeSelf);
        }

        [Test]
        public void IllegalDirectionIsRed_HoverIsGold_AndNeitherMutatesCore()
        {
            for (int i = 0; i < battle.Units.Length; i++) battle.Units[i].Cell = new GridCoord(i, 7);
            battle.Units[0].Cell = new GridCoord(3, 4);
            battle.Units[1].Cell = new GridCoord(4, 3);
            battle.Units[2].Cell = new GridCoord(5, 3);
            view.SelectUnit(battle.Units[0].Id);
            machine.BeginCard("mobility-regroup");
            view.SelectUnit(battle.Units[1].Id);
            string before = battle.Fingerprint();
            var east = view.Arrows[(int)CardinalDirection.East];
            Assert.AreEqual(FoundationBattleView.IllegalRed, east.GetComponent<Renderer>().sharedMaterial.color);
            Assert.IsFalse(view.SelectDirection(CardinalDirection.East));
            Assert.AreEqual(4, view.VisibleArrowCount);
            var north = view.Arrows[(int)CardinalDirection.North];
            view.Point(new Ray(north.position + Vector3.up * 10, Vector3.down), false);
            Assert.AreEqual(FoundationBattleView.HoverGold, north.GetComponent<Renderer>().sharedMaterial.color);
            Assert.AreEqual(before, battle.Fingerprint());
        }

        [Test]
        public void AlliedCommanderUsesLocalReviewSprite_OthersStayPlaceholderMeshes()
        {
            view.Refresh();
            var commander = Array.Find(battle.Units, unit => unit.Id.Equals(battle.PlayerCommanderId));
            Assert.IsNotNull(commander);
            foreach (var unit in battle.Units)
            {
                Transform token = view.Units[unit.Id];
                var sprite = token.GetComponentInChildren<SpriteRenderer>(true);
                if (unit.Id.Equals(battle.PlayerCommanderId))
                {
                    Assert.IsNotNull(sprite);
                    Assert.IsNotNull(sprite.sprite);
                    Assert.AreEqual(0, token.GetComponentsInChildren<MeshFilter>(true).Length);
                }
                else
                {
                    Assert.IsNull(sprite);
                    Assert.Greater(token.GetComponentsInChildren<MeshFilter>(true).Length, 0);
                }
            }
            Assert.AreEqual(0, view.GetComponentsInChildren<TMPro.TMP_Text>(true).Length);
        }

        [Test]
        public void GameplayHudShowsLocalReviewProvenanceBanner_WorldViewDoesNot()
        {
            RectTransform hud = UguiHudBuilder.BuildGameplay(null);
            try
            {
                var banner = UguiHudBuilder.Find(hud, UiElementNames.LocalReviewProvenanceBanner);
                Assert.IsNotNull(banner);
                Assert.AreEqual("로컬 리뷰 파생물 · 원본 아틀라스 미수록", banner.GetComponent<TMPro.TMP_Text>().text);
                Assert.IsNotNull(banner.GetComponentInParent<Canvas>());
                Assert.AreEqual(0, view.GetComponentsInChildren<TMPro.TMP_Text>(true).Length);
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(hud.parent.gameObject);
            }
        }
    }
}
