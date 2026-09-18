using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using VContainer;

namespace Janseon.Foundation.Tests
{
    public sealed class OwnerCardPointerPlayModeTests
    {
        GameplayUiHost host;
        FoundationBattleViewHost adapter;
        PocCoreLoopController controller;
        ApplicationFlowCoordinator flow;
        UnitState owner, ally;
        RenderTexture surface;
        Camera eventCamera;

        [SetUp]
        public async Task OpenDeployedBattle()
        {
            Assert.IsTrue(Application.isPlaying);
            var title = new TaskCompletionSource<bool>();
            void Loaded(Scene scene, LoadSceneMode mode)
            {
                if (scene.path == FoundationScenes.MainTitle) title.TrySetResult(true);
            }
            SceneManager.sceneLoaded += Loaded;
            try
            {
                await SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single);
                await Bounded(title.Task);
            }
            finally { SceneManager.sceneLoaded -= Loaded; }
            flow = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>().Container.Resolve<ApplicationFlowCoordinator>();
            await Bounded(flow.CurrentTransition);
            await Bounded(flow.OpenFoundationAsync(CancellationToken.None));
            host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            await Bounded(host.CoreLoopReady);
            controller = (PocCoreLoopController)host.CoreLoop;
            adapter = host.GetComponent<FoundationBattleViewHost>();
            var presented = new TaskCompletionSource<bool>();
            void Presented() => presented.TrySetResult(true);
            adapter.Presented += Presented;
            try { await Bounded(presented.Task); }
            finally { adapter.Presented -= Presented; }
            // Campaign navigation is fixture setup; every card/world action below uses real raycasts.
            foreach (string name in new[] { UiElementNames.ActionDepart, UiElementNames.StationSindorim,
                UiElementNames.ActionFaceEncounter, UiElementNames.ActionEnterResolution, UiElementNames.ChoiceCombat,
                UiElementNames.EditFormation, UiElementNames.FormationEditConfirm })
                UguiHudBuilder.ButtonNamed(host.CanvasRoot, name).onClick.Invoke();
            // Render the real Canvas at the supported 16:9 surface, not batchmode's 640x480 fallback.
            surface = new RenderTexture(1920, 1080, 24);
            surface.Create();
            eventCamera = host.StationCamera;
            eventCamera.targetTexture = surface;
            var canvas = host.CanvasRoot.GetComponentInParent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = eventCamera;
            canvas.planeDistance = 1f;
            var rendered = new TaskCompletionSource<bool>();
            void Rendered()
            {
                if (adapter.Viewport.GetComponent<UnityEngine.UI.RawImage>().depth >= 0)
                    rendered.TrySetResult(true);
            }
            Canvas.willRenderCanvases += Rendered;
            try { await Bounded(rendered.Task); }
            finally { Canvas.willRenderCanvases -= Rendered; }
            Assert.IsTrue(controller.Battle.Deployed);
            Assert.IsTrue(controller.BattlePaused);
            owner = controller.Battle.Units.First(u => u.Side == 0);
            ally = controller.Battle.Units.First(u => u.Side == 0 && !u.Id.Equals(owner.Id)
                && Distance(u.Cell, owner.Cell) <= 2);
            WorldClick(adapter.View.CellWorld(owner.Cell));
            Assert.AreEqual(owner.Id, controller.Targeting.SelectedOwner);
        }

        [TearDown]
        public async Task CloseFoundation()
        {
            if (eventCamera != null) eventCamera.targetTexture = null;
            if (surface != null) { surface.Release(); UnityEngine.Object.Destroy(surface); }
            if (flow != null) await Bounded(flow.OpenMainTitleAsync(CancellationToken.None));
        }

        [Test]
        public async Task PausedMobility_PointerConfirm_MovesOneCardinalCellAndRechargesOnlyOwner()
        {
            string before = controller.BattleHash;
            int sequence = controller.CommandSequence;
            int tick = controller.Battle.Tick;
            Click(UiElementNames.BattleCard("mobility-regroup"));
            Assert.AreEqual(CardTargetingStage.ChoosingAlly, controller.Targeting.Stage);
            Assert.AreEqual(before, controller.BattleHash);
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, controller.Targeting.Stage);
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, controller.Targeting.Stage);
            Assert.AreEqual(sequence, controller.CommandSequence, "An ally alone cannot confirm mobility");
            CaptureTargetingSurface();
            var direction = LegalDirection();
            WorldClick(adapter.View.Arrows[(int)direction].position);
            Assert.AreEqual(CardTargetingStage.Confirm, controller.Targeting.Stage);
            Assert.AreEqual(direction, controller.Targeting.Facing);
            Assert.AreEqual(before, controller.BattleHash);
            var origin = ally.Cell;
            var otherCells = controller.Battle.Units.Where(u => !u.Id.Equals(ally.Id)).ToDictionary(u => u.Id, u => u.Cell);
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(origin.Step(direction), ally.Cell);
            Assert.AreEqual(1, Distance(origin, ally.Cell));
            Assert.AreEqual(sequence + 1, controller.CommandSequence);
            Assert.AreEqual(CardTargetingStage.Idle, controller.Targeting.Stage);
            AssertRecharge("mobility-regroup");
            foreach (var unit in controller.Battle.Units.Where(u => !u.Id.Equals(ally.Id)))
                Assert.AreEqual(otherCells[unit.Id], unit.Cell);
            var scope = UnityEngine.Object.FindAnyObjectByType<FoundationLifetimeScope>();
            var driver = scope.Container.Resolve<BattleSessionDriver>();
            var processed = new TaskCompletionSource<int>();
            void Frame(int steps) => processed.TrySetResult(steps);
            driver.FrameProcessed += Frame;
            try { await Bounded(processed.Task); Assert.AreEqual(0, processed.Task.Result); }
            finally { driver.FrameProcessed -= Frame; }
            Assert.AreEqual(tick, controller.Battle.Tick);
            AssertRecharge("mobility-regroup");
            Assert.IsTrue(controller.BattlePaused);
        }

        [Test]
        public void Morale_FromChoosingAlly_ConfirmsWithoutDirection()
        {
            int morale = controller.Battle.Sides[0].Morale;
            Click(UiElementNames.BattleCard("encourage-morale"));
            Assert.AreEqual(CardTargetingStage.ChoosingAlly, controller.Targeting.Stage);
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(CardTargetingStage.Confirm, controller.Targeting.Stage);
            Assert.IsNull(controller.Targeting.Facing);
            Assert.AreEqual(0, adapter.View.VisibleArrowCount);
            Assert.AreEqual(morale, controller.Battle.Sides[0].Morale);
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(morale + CardCatalog.Find("encourage-morale").Effect, controller.Battle.Sides[0].Morale);
            AssertRecharge("encourage-morale");
        }

        [Test]
        public void Confirm_RevalidatesNewlyBlockedDestination_WithoutMovementOrRecharge()
        {
            Click(UiElementNames.BattleCard("mobility-regroup"));
            WorldClick(adapter.View.CellWorld(ally.Cell));
            var direction = LegalDirection();
            WorldClick(adapter.View.Arrows[(int)direction].position);
            Assert.AreEqual(CardTargetingStage.Confirm, controller.Targeting.Stage);
            var blocker = controller.Battle.Units.First(u => !u.Id.Equals(owner.Id) && !u.Id.Equals(ally.Id));
            blocker.Cell = ally.Cell.Step(direction);
            string before = controller.BattleHash;
            int sequence = controller.CommandSequence;
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(before, controller.BattleHash);
            Assert.AreEqual(sequence, controller.CommandSequence);
            Assert.AreEqual(BattleRejectReason.CardDestinationBlocked, ((BattleRejection)controller.Targeting.LastRejection).Reason);
            Assert.IsTrue(controller.Battle.Cards.All(card => card.RechargeTicksLeft == 0));
        }

        [Test]
        public async Task EscapeAfterTargetSelection_CancelsWithoutEnqueue()
        {
            Click(UiElementNames.BattleCard("mobility-regroup"));
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, controller.Targeting.Stage);
            string before = controller.BattleHash;
            int sequence = controller.CommandSequence;
            var module = EventSystem.current.GetComponent<StandaloneInputModule>();
            Assert.AreEqual("Cancel", module.cancelButton);
            var input = module.gameObject.AddComponent<CancelInput>();
            var previous = module.inputOverride;
            var presented = new TaskCompletionSource<bool>();
            void Presented()
            {
                if (controller.Targeting.Stage == CardTargetingStage.Idle) presented.TrySetResult(true);
            }
            adapter.Presented += Presented;
            try
            {
                // The project's InputManager maps Escape to Cancel. Keep that exact input
                // pressed through the production Update and await its presentation event.
                module.inputOverride = input;
                await Bounded(presented.Task);
            }
            finally
            {
                adapter.Presented -= Presented;
                module.inputOverride = previous;
                UnityEngine.Object.Destroy(input);
            }
            Assert.AreEqual(CardTargetingStage.Idle, controller.Targeting.Stage);
            Assert.AreEqual(0, adapter.View.VisibleArrowCount);
            Assert.AreEqual(before, controller.BattleHash);
            Assert.AreEqual(sequence, controller.CommandSequence);
            WorldClick(adapter.View.CellWorld(ally.Cell));
            Assert.AreEqual(before, controller.BattleHash);
        }

        [Test]
        public async Task HudRaycast_ConsumesCardAndCancel_WithoutWorldSelection()
        {
            string before = controller.BattleHash;
            Click(UiElementNames.BattleCard("mobility-regroup"));
            Assert.AreEqual(default(UnitId), controller.Targeting.SelectedTarget);
            Assert.AreEqual(owner.Id, controller.Targeting.SelectedOwner);
            var graphic = UguiHudBuilder.ButtonNamed(host.CanvasRoot, UiElementNames.BattleCardCancel).targetGraphic;
            var rendered = new TaskCompletionSource<bool>();
            void Rendered() { if (graphic.depth >= 0) rendered.TrySetResult(true); }
            Canvas.willRenderCanvases += Rendered;
            try { await Bounded(rendered.Task); }
            finally { Canvas.willRenderCanvases -= Rendered; }
            Click(UiElementNames.BattleCardCancel);
            Assert.AreEqual(CardTargetingStage.Idle, controller.Targeting.Stage);
            Assert.AreEqual(before, controller.BattleHash);
        }

        [Test]
        public void RightClickOnWorldTarget_DoesNotSelectOrConfirm()
        {
            Click(UiElementNames.BattleCard("encourage-morale"));
            WorldClick(adapter.View.CellWorld(ally.Cell), PointerEventData.InputButton.Right);
            Assert.AreEqual(CardTargetingStage.ChoosingAlly, controller.Targeting.Stage);
            Assert.AreEqual(default(UnitId), controller.Targeting.SelectedTarget);
        }

        void CaptureTargetingSurface()
        {
            Canvas.ForceUpdateCanvases();
            adapter.View.ViewCamera.Render();
            eventCamera.Render();
            var old = RenderTexture.active;
            var pixels = new Texture2D(surface.width, surface.height, TextureFormat.RGBA32, false);
            try
            {
                RenderTexture.active = surface;
                pixels.ReadPixels(new Rect(0, 0, surface.width, surface.height), 0, 0);
                pixels.Apply();
                string directory = System.IO.Path.GetFullPath(System.IO.Path.Combine(Application.dataPath,
                    "../../.omo/evidence/unity-html-poc-ui-parity/task-09"));
                System.IO.Directory.CreateDirectory(directory);
                System.IO.File.WriteAllBytes(System.IO.Path.Combine(directory, "pointer-targeting.png"), pixels.EncodeToPNG());
            }
            finally { RenderTexture.active = old; UnityEngine.Object.Destroy(pixels); }
        }

        void AssertRecharge(string cardId)
        {
            foreach (var card in controller.Battle.Cards)
                Assert.AreEqual(card.Id == cardId && card.OwnerUnitId.Equals(owner.Id) ? CardCatalog.Find(cardId).RechargeTicks : 0,
                    card.RechargeTicksLeft, card.Id + ":" + card.OwnerUnitId.Value);
        }

        CardinalDirection LegalDirection() => Enumerable.Range(0, 4).Select(i => (CardinalDirection)i).First(direction =>
            BattleSim.PreviewCard(controller.Battle, new BattleTickCommand
            {
                At = new Tick(controller.Battle.Tick), Kind = BattleTickCommandKind.PlayCard,
                CardId = "mobility-regroup", OwnerUnitId = owner.Id, TargetUnitId = ally.Id, Facing = direction,
            }) == null);

        void Click(string name)
        {
            Canvas.ForceUpdateCanvases();
            var button = UguiHudBuilder.ButtonNamed(host.CanvasRoot, name);
            Assert.IsNotNull(button, name);
            Assert.IsTrue(button.gameObject.activeInHierarchy && button.IsInteractable(), name);
            var rect = (RectTransform)button.transform;
            Dispatch(RectTransformUtility.WorldToScreenPoint(eventCamera, rect.TransformPoint(rect.rect.center)), button.gameObject);
        }

        void WorldClick(Vector3 world, PointerEventData.InputButton button = PointerEventData.InputButton.Left)
        {
            Canvas.ForceUpdateCanvases();
            adapter.Synchronize();
            Vector3 normalized = adapter.View.ViewCamera.WorldToViewportPoint(world);
            Rect rect = adapter.Viewport.rect;
            Vector3 local = new Vector3(rect.xMin + normalized.x * rect.width, rect.yMin + normalized.y * rect.height, 0);
            Dispatch(RectTransformUtility.WorldToScreenPoint(eventCamera, adapter.Viewport.TransformPoint(local)), adapter.Viewport.gameObject, button);
        }

        static void Dispatch(Vector2 screen, GameObject expected, PointerEventData.InputButton button = PointerEventData.InputButton.Left)
        {
            var data = new PointerEventData(EventSystem.current) { position = screen, button = button };
            var hits = new List<RaycastResult>();
            EventSystem.current.RaycastAll(data, hits);
            var graphic = expected.GetComponent<UnityEngine.UI.Graphic>();
            Assert.IsNotEmpty(hits, $"{expected.name} screen={Screen.width}x{Screen.height} point={screen} rect={((RectTransform)expected.transform).rect} depth={graphic.depth} cull={graphic.canvasRenderer.cull} canvas={graphic.canvas.renderMode} active={expected.activeInHierarchy}");
            var receiver = ExecuteEvents.GetEventHandler<IPointerClickHandler>(hits[0].gameObject);
            Assert.AreSame(expected, receiver, "The foremost real UI raycast must own the click");
            data.pointerCurrentRaycast = hits[0];
            data.pointerPressRaycast = hits[0];
            ExecuteEvents.Execute(receiver, data, ExecuteEvents.pointerDownHandler);
            ExecuteEvents.Execute(receiver, data, ExecuteEvents.pointerUpHandler);
            ExecuteEvents.Execute(receiver, data, ExecuteEvents.pointerClickHandler);
        }

        static int Distance(GridCoord a, GridCoord b) => Math.Abs(a.X - b.X) + Math.Abs(a.Y - b.Y);
        static async Task Bounded(Task task)
        {
            Assert.AreSame(task, await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(20))), "Exact scene/driver/presentation event timed out");
            await task;
        }

        public sealed class CancelInput : BaseInput
        {
            public override bool GetButtonDown(string buttonName) => buttonName == "Cancel";
            public override float GetAxisRaw(string axisName) => 0;
            public override bool mousePresent => false;
            public override bool touchSupported => false;
        }
    }
}
