using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
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
    public sealed class FoundationBattleViewPlayModeTests
    {
        [Test]
        public async Task ProductionScene_WorldUnitsAndTargeting_Capture()
        {
            Assert.IsTrue(Application.isPlaying);
            Assert.AreNotEqual(UnityEngine.Rendering.GraphicsDeviceType.Null, SystemInfo.graphicsDeviceType);
            Task titleLoaded = SceneLoaded(FoundationScenes.MainTitle);
            await Operation(SceneManager.LoadSceneAsync(FoundationScenes.Bootstrap, LoadSceneMode.Single));
            await Bounded(titleLoaded);
            var app = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>();
            var flow = app.Container.Resolve<ApplicationFlowCoordinator>();
            await Bounded(flow.CurrentTransition);
            await Bounded(flow.OpenFoundationAsync(CancellationToken.None));
            var host = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
            await Bounded(host.CoreLoopReady);
            var adapter = host.GetComponent<FoundationBattleViewHost>();
            Assert.IsNotNull(adapter, "Runtime scene adapter must attach without test-only installation");
            await Presented(adapter);
            var controller = (PocCoreLoopController)host.CoreLoop;
            Click(host, UiElementNames.ActionDepart);
            Click(host, UiElementNames.StationSindorim);
            Click(host, UiElementNames.ActionFaceEncounter);
            Click(host, UiElementNames.ActionEnterResolution);
            Click(host, UiElementNames.ChoiceCombat);
            Click(host, UiElementNames.EditFormation);
            Click(host, UiElementNames.FormationEditConfirm);
            Assert.IsTrue(controller.Battle.Deployed);
            Assert.IsTrue(controller.BattlePaused);
            adapter.Synchronize();
            Canvas.ForceUpdateCanvases();
            adapter.Synchronize();
            var view = adapter.View;
            Assert.IsNotNull(view);
            Assert.AreEqual(6, controller.Battle.Units.Count(u => u.Side == 0));
            Assert.Greater(controller.Battle.Units.Count(u => u.Side == 1), 0);
            Assert.AreEqual(controller.Battle.Units.Length, view.Units.Count);
            Assert.AreEqual(view.Units.Count, view.Units.Values.Select(t => t.position).Distinct().Count());
            foreach (Transform cell in adapter.Viewport) Assert.IsFalse(cell.gameObject.activeInHierarchy);
            var owner = controller.Battle.Units.First(u => u.Side == 0);
            var ally = controller.Battle.Units.First(u => u.Side == 0 && !u.Id.Equals(owner.Id)
                && Math.Abs(u.Cell.X - owner.Cell.X) + Math.Abs(u.Cell.Y - owner.Cell.Y) <= 2);
            PointerClick(adapter, view.Units[owner.Id].position);
            Assert.AreEqual(owner.Id, controller.Targeting.SelectedOwner);
            Assert.AreEqual(view.CellWorld(owner.Cell) + Vector3.up * 0.035f, view.SelectionRing.position);
            Capture(host, adapter, "selected");
            Click(host, UiElementNames.BattleCard("mobility-regroup"));
            Assert.AreEqual(0, view.VisibleArrowCount);
            PointerClick(adapter, view.Units[ally.Id].position);
            Assert.AreEqual(CardTargetingStage.ChoosingDirection, controller.Targeting.Stage);
            Assert.AreEqual(4, view.VisibleArrowCount);
            Capture(host, adapter, "mobility-four-arrows");
            Click(host, UiElementNames.BattleCardCancel);
            Click(host, UiElementNames.BattleCard("encourage-morale"));
            PointerClick(adapter, view.Units[ally.Id].position);
            Assert.AreEqual(CardTargetingStage.Confirm, controller.Targeting.Stage);
            Assert.AreEqual(0, view.VisibleArrowCount);
            Capture(host, adapter, "morale-no-arrows");
            // Clicking the same world target again confirms; selection itself never submits.
            PointerClick(adapter, view.Units[ally.Id].position);
            Assert.AreEqual(CardTargetingStage.Idle, controller.Targeting.Stage);
            Assert.AreEqual(600, controller.Targeting.RechargeTicksLeft("encourage-morale"));
            await Bounded(flow.OpenMainTitleAsync(CancellationToken.None));
            Assert.IsTrue(view == null, "Battle presentation must be released with its Foundation scene");
        }

        static void Click(GameplayUiHost host, string name)
        {
            var button = UguiHudBuilder.ButtonNamed(host.CanvasRoot, name);
            Assert.IsNotNull(button, name);
            Assert.IsTrue(button.gameObject.activeInHierarchy, name);
            Assert.IsTrue(button.interactable, name);
            button.onClick.Invoke();
        }

        static void PointerClick(FoundationBattleViewHost adapter, Vector3 world)
        {
            Canvas.ForceUpdateCanvases();
            adapter.Synchronize();
            Vector3 normalized = adapter.View.ViewCamera.WorldToViewportPoint(world);
            Assert.That(normalized.x, Is.InRange(0f, 1f));
            Assert.That(normalized.y, Is.InRange(0f, 1f));
            Rect rect = adapter.Viewport.rect;
            Vector3 local = new Vector3(rect.xMin + normalized.x * rect.width, rect.yMin + normalized.y * rect.height, 0);
            var data = new PointerEventData(EventSystem.current)
            {
                position = RectTransformUtility.WorldToScreenPoint(null, adapter.Viewport.TransformPoint(local)),
                button = PointerEventData.InputButton.Left,
            };
            ExecuteEvents.Execute(adapter.Viewport.gameObject, data, ExecuteEvents.pointerClickHandler);
        }

        static void Capture(GameplayUiHost host, FoundationBattleViewHost adapter, string state)
        {
            string directory = Path.GetFullPath(Path.Combine(Application.dataPath,
                "../../.omo/evidence/unity-html-poc-ui-parity/task-08"));
            Directory.CreateDirectory(directory);
            var camera = host.StationCamera;
            var canvas = host.CanvasRoot.GetComponentInParent<Canvas>();
            var target = new RenderTexture(1920, 1080, 24);
            var pixels = new Texture2D(1920, 1080, TextureFormat.RGBA32, false);
            RenderTexture oldActive = RenderTexture.active;
            RenderTexture oldTarget = camera.targetTexture;
            RenderMode oldMode = canvas.renderMode;
            Camera oldCamera = canvas.worldCamera;
            float oldPlane = canvas.planeDistance;
            try
            {
                target.Create();
                camera.targetTexture = target;
                canvas.renderMode = RenderMode.ScreenSpaceCamera;
                canvas.worldCamera = camera;
                canvas.planeDistance = 1f;
                Canvas.ForceUpdateCanvases();
                adapter.Synchronize();
                adapter.View.ViewCamera.Render();
                camera.Render();
                RenderTexture.active = target;
                pixels.ReadPixels(new Rect(0, 0, target.width, target.height), 0, 0);
                pixels.Apply();
                File.WriteAllBytes(Path.Combine(directory, state + ".png"), pixels.EncodeToPNG());
                File.WriteAllText(Path.Combine(directory, state + ".txt"),
                    "isPlaying=" + Application.isPlaying + "\ngraphics=" + SystemInfo.graphicsDeviceType
                    + "\nscene=" + host.gameObject.scene.path + "\nunits=" + adapter.View.Units.Count
                    + "\narrows=" + adapter.View.VisibleArrowCount + "\ncore=" + host.CoreLoop.BattleHash
                    + "\nsourceFingerprint=" + UiSourceFingerprint.Compute(Path.GetFullPath(Path.Combine(Application.dataPath, "../.."))));
            }
            finally
            {
                RenderTexture.active = oldActive;
                camera.targetTexture = oldTarget;
                canvas.renderMode = oldMode;
                canvas.worldCamera = oldCamera;
                canvas.planeDistance = oldPlane;
                target.Release();
                UnityEngine.Object.Destroy(target);
                UnityEngine.Object.Destroy(pixels);
            }
        }

        static async Task Presented(FoundationBattleViewHost host)
        {
            var completion = new TaskCompletionSource<bool>();
            void OnPresented() { completion.TrySetResult(true); }
            host.Presented += OnPresented;
            try { await Bounded(completion.Task); }
            finally { host.Presented -= OnPresented; }
        }

        static async Task SceneLoaded(string path)
        {
            var completion = new TaskCompletionSource<bool>();
            void OnLoaded(Scene scene, LoadSceneMode mode) { if (scene.path == path) completion.TrySetResult(true); }
            SceneManager.sceneLoaded += OnLoaded;
            try { await Bounded(completion.Task); }
            finally { SceneManager.sceneLoaded -= OnLoaded; }
        }

        static Task Operation(AsyncOperation operation)
        {
            var completion = new TaskCompletionSource<bool>();
            operation.completed += _ => completion.TrySetResult(true);
            return Bounded(completion.Task);
        }

        static async Task Bounded(Task task)
        {
            Assert.IsNotNull(task);
            Assert.AreSame(task, await Task.WhenAny(task, Task.Delay(TimeSpan.FromSeconds(20))), "Timed out awaiting exact scene/presentation event");
            await task;
        }
    }
}
