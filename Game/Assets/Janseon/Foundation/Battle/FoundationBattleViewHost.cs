using System;
using System.Collections.Generic;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.UI;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;

namespace Janseon.Foundation.Battle
{
    /// <summary>
    /// Scene-local bridge to the existing gameplay lease. Replaces the legacy occupancy
    /// graphics at runtime, leaving HUD authoring and Core occupancy untouched.
    /// </summary>
    public sealed class FoundationBattleViewHost : MonoBehaviour
    {
        GameplayUiHost host;
        PocCoreLoopController controller;
        BattleSimState displayed;
        RectTransform viewport;
        UnityEngine.UI.RawImage image;
        RenderTexture texture;
        readonly List<(UnityEngine.UI.Button button, UnityAction action)> bindings = new();
        public FoundationBattleView View { get; private set; }
        public RectTransform Viewport => viewport;
        public event Action Presented;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void Register()
        {
            SceneManager.sceneLoaded -= AttachToScene;
            SceneManager.sceneLoaded += AttachToScene;
        }

        static void AttachToScene(Scene scene, LoadSceneMode mode)
        {
            foreach (var root in scene.GetRootGameObjects())
                foreach (var gameplay in root.GetComponentsInChildren<GameplayUiHost>(true))
                    if (gameplay.GetComponent<FoundationBattleViewHost>() == null)
                        gameplay.gameObject.AddComponent<FoundationBattleViewHost>();
        }

        async void Start()
        {
            host = GetComponent<GameplayUiHost>();
            try
            {
                await host.CoreLoopReady;
                if (this == null) return;
                controller = (PocCoreLoopController)host.CoreLoop;
                BindViewport();
                controller.StateChanged += Synchronize;
                Synchronize();
            }
            catch (Exception exception) { Debug.LogException(exception, this); }
        }

        void BindViewport()
        {
            viewport = (RectTransform)UguiHudBuilder.Find(host.CanvasRoot, UiElementNames.BattleGrid);
            // Preserve the named container for presenter visibility, but replace all cell graphics.
            viewport.GetComponent<UnityEngine.UI.GridLayoutGroup>().enabled = false;
            foreach (Transform cell in viewport) cell.gameObject.SetActive(false);
            var layout = viewport.GetComponent<UnityEngine.UI.LayoutElement>();
            layout.minHeight = 200f;
            layout.preferredHeight = 326f;
            layout.flexibleHeight = 1f;
            image = viewport.gameObject.AddComponent<UnityEngine.UI.RawImage>();
            image.color = Color.white;
            image.raycastTarget = true;
            texture = new RenderTexture(1280, 720, 24) { name = "FoundationBattleViewport", filterMode = FilterMode.Bilinear };
            texture.Create();
            image.texture = texture;
            var events = viewport.gameObject.AddComponent<BattleViewportPointer>();
            events.Moved += data => Point(data, false);
            AddPointer(events, EventTriggerType.PointerClick, data => Point(data, true));
            AddPointer(events, EventTriggerType.PointerExit, _ => View?.ClearHover());
            string[] cards = { "guard-shieldwall", "encourage-morale", "pincer-focus", "mobility-regroup" };
            foreach (string card in cards)
                Bind(UiElementNames.BattleCard(card), () => { controller.Targeting?.BeginCard(card); Synchronize(); });
            Bind(UiElementNames.BattleCardCancel, () => { controller.Targeting?.Cancel(); Synchronize(); });
            // Direction and ring placeholders in the dock must never masquerade as world graphics.
            string[] graphics = { UiElementNames.BattleCardTargetRing, UiElementNames.BattleCardDirectionNorth,
                UiElementNames.BattleCardDirectionEast, UiElementNames.BattleCardDirectionSouth, UiElementNames.BattleCardDirectionWest };
            foreach (string name in graphics) UguiHudBuilder.Find(host.CanvasRoot, name).gameObject.SetActive(false);
        }

        void Bind(string name, UnityAction action)
        {
            var button = UguiHudBuilder.ButtonNamed(host.CanvasRoot, name);
            button.onClick.AddListener(action);
            bindings.Add((button, action));
        }

        static void AddPointer(EventTrigger trigger, EventTriggerType type, Action<PointerEventData> action)
        {
            var entry = new EventTrigger.Entry { eventID = type };
            entry.callback.AddListener(data => action((PointerEventData)data));
            trigger.triggers.Add(entry);
        }

        void Point(PointerEventData data, bool click)
        {
            if (View == null || !RectTransformUtility.ScreenPointToLocalPointInRectangle(
                viewport, data.position, data.pressEventCamera, out Vector2 local)) return;
            Rect rect = viewport.rect;
            var normalized = new Vector3((local.x - rect.xMin) / rect.width, (local.y - rect.yMin) / rect.height, 0);
            View.Point(View.ViewCamera.ViewportPointToRay(normalized), click);
        }

        public void Synchronize()
        {
            if (controller == null) return;
            if (!ReferenceEquals(displayed, controller.Battle))
            {
                if (View != null) { View.gameObject.SetActive(false); Destroy(View.gameObject); }
                View = null;
                displayed = controller.Battle;
                if (displayed != null)
                {
                    View = FoundationBattleView.Create(transform, displayed, controller.Targeting);
                    View.ViewCamera.targetTexture = texture;
                    View.ViewCamera.enabled = true;
                }
            }
            if (View != null)
            {
                View.Refresh();
                float aspect = viewport.rect.height > 0 ? viewport.rect.width / viewport.rect.height : 16f / 9f;
                View.FrameCamera(aspect);
            }
            Presented?.Invoke();
        }

        void LateUpdate() => Synchronize();

        void OnDestroy()
        {
            if (controller != null) controller.StateChanged -= Synchronize;
            foreach (var binding in bindings)
                if (binding.button != null) binding.button.onClick.RemoveListener(binding.action);
            if (texture != null) { texture.Release(); Destroy(texture); }
        }
    }
}
